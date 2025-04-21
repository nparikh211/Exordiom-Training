import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Auth helpers
export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user || null;
};

export const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
  // Validate inputs
  if (!email || !password || !firstName || !lastName) {
    throw new Error('All fields are required');
  }
  
  // Special handling for admin email
  const isAdminEmail = email.toLowerCase() === 'neej@exordiom.com';
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (error) throw error;
    
    // For admin, we need to use the special RPC function
    if (data.user && isAdminEmail) {
      try {
        await supabase.rpc('set_admin_profile', {
          user_id: data.user.id,
          user_email: email
        });
      } catch (adminError) {
        console.error('Error setting admin status:', adminError);
      }
    } else if (data.user) {
      // For regular users, create profile directly
      try {
        // Check if profile already exists first to avoid duplicates
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();
          
        if (!existingProfile) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            email: email,
            is_admin: false
          });
        }
      } catch (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    return data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  // Validate inputs
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  
  try {
    // Special handling for admin email
    const isAdminEmail = email.toLowerCase() === 'neej@exordiom.com';
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
    
    // After successful login, ensure profile exists
    if (data.user) {
      try {
        // Check if profile exists
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();
        
        if (!profileData) {
          // Special case for admin user
          if (isAdminEmail) {
            await supabase.rpc('set_admin_profile', {
              user_id: data.user.id,
              user_email: email
            });
          } else {
            // For regular users, create a basic profile
            await supabase.from('profiles').insert({
              id: data.user.id,
              email: email,
              first_name: data.user.user_metadata.first_name || '',
              last_name: data.user.user_metadata.last_name || '',
              is_admin: false
            });
          }
        } else if (isAdminEmail) {
          // Ensure admin status for existing admin profile
          await supabase.rpc('set_admin_profile', {
            user_id: data.user.id,
            user_email: email
          });
        }
      } catch (profileError) {
        // Most likely this is a duplicate key error which means the profile already exists
        // We can safely ignore this in most cases
        console.warn('Profile check/creation warning:', profileError);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error in signIn function:', error);
    throw error;
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Check if user is admin
export const isAdmin = async (userId: string) => {
  if (!userId) return false;
  
  try {
    // Get user email - the most reliable way to check admin
    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email;
    
    // Special case for known admin email
    if (email?.toLowerCase() === 'neej@exordiom.com') {
      return true;
    }
    
    // Use the secure function to check admin status in database
    const { data, error } = await supabase.rpc('get_admin_status', {
      user_id: userId
    });
    
    if (error) {
      console.error('Error checking admin status via RPC:', error);
      
      // Fallback to direct check if RPC fails
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        console.error('Error in fallback admin check:', profileError);
        return false;
      }
      
      return profileData?.is_admin || false;
    }
    
    return !!data; // Convert to boolean
  } catch (error) {
    console.error('Exception checking admin status:', error);
    return false;
  }
};
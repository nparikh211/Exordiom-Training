import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { AuthForm } from './AuthForm';
import { signIn, signUp } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (data: { email: string; password: string }) => {
    if (!data.email || !data.password) {
      toast.error("Please enter both email and password");
      return;
    }
    
    setLoading(true);
    try {
      await signIn(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error("Authentication Error", {
        description: err.message || "Failed to authenticate. Please check your credentials."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (data: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    password: string 
  }) => {
    if (!data.firstName || !data.lastName || !data.email || !data.password) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setLoading(true);
    try {
      await signUp(data.email, data.password, data.firstName, data.lastName);
      toast.success("Account created successfully", {
        description: "You can now sign in with your credentials"
      });
    } catch (err: any) {
      console.error('Signup error:', err);
      toast.error("Sign-up Error", {
        description: err.message || "Failed to create account. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ea6565] to-[#b84141] p-2 sm:p-4">
      <Card className="w-full max-w-md p-4 sm:p-6 space-y-6 bg-white shadow-lg border-0">
        <div className="text-center space-y-2">
          <img src="/logo.png" alt="Logo" className="h-16 sm:h-20 w-auto mx-auto mb-6 object-contain" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome to Exordiom Talent Training</h1>
          <p className="text-gray-700">Sign in to access training modules</p>
        </div>

        <Tabs defaultValue="login" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full bg-gray-100">
            <TabsTrigger 
              value="login" 
              className="data-[state=active]:bg-[#ea6565] data-[state=active]:text-white"
            >
              Login
            </TabsTrigger>
            <TabsTrigger 
              value="signup" 
              className="data-[state=active]:bg-[#ea6565] data-[state=active]:text-white"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <AuthForm
              isLogin={true}
              onSubmit={handleLogin}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="signup">
            <AuthForm
              isLogin={false}
              onSubmit={handleSignup}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </Card>
      <Toaster />
    </div>
  );
}
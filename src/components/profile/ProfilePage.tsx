import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserMenu } from '@/components/ui/UserMenu';
import { ArrowLeft, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { ProfileData, QuizAttempt, TrainingProgress } from '@/types/training';

export function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [progress, setProgress] = useState<TrainingProgress[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.user) {
          navigate('/');
          return;
        }
        
        const userId = sessionData.session.user.id;
        
        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (profileError) {
          throw profileError;
        }
        
        setProfile(profileData);
        setFormData({
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          email: profileData.email
        });
        
        // Get training progress
        const { data: progressData, error: progressError } = await supabase
          .from('training_progress')
          .select('*')
          .eq('user_id', userId);
          
        if (progressError) {
          throw progressError;
        }
        
        setProgress(progressData || []);
        
        // Get quiz attempts
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', userId)
          .order('attempt_number', { ascending: false });
          
        if (attemptsError) {
          throw attemptsError;
        }
        
        setAttempts(attemptsData || []);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [navigate]);

  const handleUpdateProfile = async () => {
    if (!profile) return;
    
    try {
      setUpdating(true);
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);
        
      if (error) {
        throw error;
      }
      
      // Also update auth metadata
      await supabase.auth.updateUser({
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName
        }
      });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ea6565] to-[#b84141]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  // Calculate progress
  const completedSections = progress.filter(p => p.completed).length;
  const totalSections = 3; // Total number of training sections
  const progressPercentage = Math.round((completedSections / totalSections) * 100);
  
  // Quiz status
  const quizPassed = attempts.some(a => a.passed);
  const latestAttempt = attempts[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ea6565] to-[#b84141] p-2 sm:p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-4 sm:p-6 contrast-bg shadow-lg border-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Your Profile
              </h1>
            </div>
            <UserMenu />
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="mt-1 border-gray-300 text-gray-900 bg-white"
                />
              </div>
              
              <div>
                <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="mt-1 border-gray-300 text-gray-900 bg-white"
                />
              </div>
              
              <div className="sm:col-span-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input
                  id="email"
                  value={formData.email}
                  disabled
                  className="mt-1 bg-gray-50 text-gray-700 border-gray-300"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Email cannot be changed
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={handleUpdateProfile}
                disabled={updating}
                className="bg-[#ea6565] hover:bg-[#d45151] text-white"
              >
                {updating ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
            
            <Separator className="bg-gray-200" />
            
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Training Status</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-lg bg-white shadow-sm border border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700">Progress</h3>
                  <p className="text-2xl font-bold text-gray-900">{progressPercentage}%</p>
                  <p className="text-sm text-gray-700">
                    {completedSections} of {totalSections} sections completed
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-white shadow-sm border border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700">Quiz Status</h3>
                  <p className="text-2xl font-bold">
                    {quizPassed ? (
                      <span className="text-green-600">Passed</span>
                    ) : attempts.length > 0 ? (
                      <span className="text-red-600">Failed</span>
                    ) : (
                      <span className="text-gray-700">Not Attempted</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-700">
                    {attempts.length} {attempts.length === 1 ? 'attempt' : 'attempts'}
                  </p>
                </div>
              </div>
              
              {latestAttempt && (
                <div className="p-4 rounded-lg bg-white mb-4 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Latest Quiz Attempt</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-600">Date:</p>
                      <p className="text-sm text-gray-800">
                        {latestAttempt.completed_at 
                          ? new Date(latestAttempt.completed_at).toLocaleDateString()
                          : 'In progress'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Score:</p>
                      <p className="text-sm text-gray-800">
                        {latestAttempt.score}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Result:</p>
                      <p className="text-sm">
                        {latestAttempt.passed 
                          ? <span className="text-green-600 font-medium">Passed</span> 
                          : <span className="text-red-600 font-medium">Failed</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Attempt #:</p>
                      <p className="text-sm text-gray-800">{latestAttempt.attempt_number}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="w-full border-gray-300 text-gray-800 hover:bg-gray-50"
              >
                Return to Training Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
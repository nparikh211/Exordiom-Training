import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UserMenu } from '@/components/ui/UserMenu';
import { Play, CheckCircle, Lock, Award, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { TrainingProgress } from '@/types/training';

// Training sections data with shorter YouTube videos (around 3 minutes each)
const trainingSections = [
  {
    id: 'section1',
    title: 'Professional Communication',
    description: 'Learn effective communication techniques in a professional environment',
    videoUrl: 'https://drive.google.com/file/d/1K7hyyDPFesbN30_zfHBWIc_fXx56RxCN/view?usp=sharing',
    duration: '3 min'
  },
  {
    id: 'section2',
    title: 'Time Management',
    description: 'Master strategies for efficient time management in your workplace',
    videoUrl: 'https://www.youtube.com/watch?v=AgYVYOZrpzY',
    duration: '3 min'
  },
  {
    id: 'section3',
    title: 'Workplace Etiquette',
    description: 'Understand essential workplace etiquette and professional conduct',
    videoUrl: 'https://www.youtube.com/watch?v=VRXmsVF_QFY',
    duration: '3 min'
  }
];

export function TrainingDashboard() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<TrainingProgress[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizPassed, setQuizPassed] = useState(false);
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Calculate completion percentage
  const completedSections = progress.filter(p => p.completed).length;
  const totalSections = trainingSections.length;
  const completionPercentage = Math.round((completedSections / totalSections) * 100);
  
  // Check if quiz is available (all sections completed)
  const quizAvailable = completedSections === totalSections;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.user) {
          navigate('/');
          return;
        }
        
        const user = sessionData.session.user;
        setUserId(user.id);
        
        // Get user's name
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, is_admin')
          .eq('id', user.id)
          .single();
          
        if (profileData) {
          setUserName(`${profileData.first_name || ''} ${profileData.last_name || ''}`);
          setIsAdmin(profileData.is_admin || false);
        }
        
        // Fetch training progress
        const { data: progressData, error: progressError } = await supabase
          .from('training_progress')
          .select('*')
          .eq('user_id', user.id);
          
        if (progressError) {
          throw progressError;
        }
        
        if (progressData) {
          setProgress(progressData);
        }
        
        // Check if quiz has been passed
        const { data: quizData, error: quizError } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', user.id)
          .eq('passed', true)
          .limit(1);
          
        if (quizError) {
          throw quizError;
        }
        
        setQuizPassed(quizData && quizData.length > 0);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load training data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate]);

  const getSectionStatus = (sectionId: string) => {
    const sectionProgress = progress.find(p => p.section_id === sectionId);
    if (sectionProgress?.completed) {
      return 'completed';
    }
    
    // Section 1 is always available
    if (sectionId === 'section1') {
      return 'available';
    }
    
    // Check if previous section is completed
    const prevSectionId = `section${parseInt(sectionId.replace('section', '')) - 1}`;
    const prevSectionCompleted = progress.some(p => p.section_id === prevSectionId && p.completed);
    
    return prevSectionCompleted ? 'available' : 'locked';
  };

  const handleStartSection = (section: typeof trainingSections[0]) => {
    navigate(`/training/${section.id}`, { state: { section } });
  };

  const handleStartQuiz = () => {
    navigate('/quiz');
  };

  const handleGoToAdmin = () => {
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ea6565] to-[#b84141]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ea6565] to-[#b84141] p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="p-4 sm:p-6 contrast-bg shadow-lg border-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome to Exordiom Talent Training</h1>
              <p className="text-gray-700 mt-1 font-medium">{userName}</p>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Button
                  onClick={handleGoToAdmin}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex gap-2 items-center"
                >
                  <UserCog className="h-4 w-4" />
                  Admin Dashboard
                </Button>
              )}
              <UserMenu />
            </div>
          </div>
          
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-800">Your Progress</h2>
              <span className="text-sm font-medium text-gray-800">{completionPercentage}% complete</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Training Modules</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trainingSections.map((section) => {
                const status = getSectionStatus(section.id);
                
                return (
                  <Card 
                    key={section.id}
                    className={`p-4 border ${
                      status === 'completed' 
                        ? 'border-green-200 bg-green-50/80' 
                        : status === 'locked'
                        ? 'border-gray-200 bg-gray-50/80 opacity-75'
                        : 'border-blue-200 bg-blue-50/80'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900">{section.title}</h3>
                      {status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : status === 'locked' ? (
                        <Lock className="h-5 w-5 text-gray-600" />
                      ) : (
                        <Play className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-4">{section.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-700">{section.duration}</span>
                      
                      <Button
                        variant={status === 'completed' ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleStartSection(section)}
                        disabled={status === 'locked'}
                        className={
                          status === 'completed'
                            ? 'border-green-300 text-green-700 hover:bg-green-50'
                            : status === 'locked'
                            ? 'bg-gray-300 text-gray-600'
                            : 'bg-[#ea6565] hover:bg-[#d45151] text-white'
                        }
                      >
                        {status === 'completed' ? 'Review' : status === 'locked' ? 'Locked' : 'Start'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
            
            {/* Quiz section */}
            <div className="mt-8">
              <Card className={`p-4 border ${
                quizPassed 
                  ? 'border-green-200 bg-green-50/80' 
                  : !quizAvailable
                  ? 'border-gray-200 bg-gray-50/80 opacity-75'
                  : 'border-purple-200 bg-purple-50/80'
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      {quizPassed ? (
                        <>
                          <Award className="h-5 w-5 text-green-600 mr-2" />
                          Professional Etiquette Quiz - Completed
                        </>
                      ) : (
                        'Professional Etiquette Quiz'
                      )}
                    </h3>
                    <p className="text-sm text-gray-700 mt-1">
                      {quizPassed 
                        ? 'Congratulations! You have completed the quiz successfully.' 
                        : quizAvailable
                        ? 'Test your knowledge of professional workplace etiquette'
                        : 'Complete all training modules to unlock the quiz'}
                    </p>
                  </div>
                  
                  <Button
                    variant={quizPassed ? 'outline' : 'default'}
                    onClick={handleStartQuiz}
                    disabled={!quizAvailable}
                    className={
                      quizPassed
                        ? 'border-green-300 text-green-700 hover:bg-green-50'
                        : !quizAvailable
                        ? 'bg-gray-300 text-gray-600'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }
                  >
                    {quizPassed ? 'Review Quiz' : 'Start Quiz'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { UserMenu } from '@/components/ui/UserMenu';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import ReactPlayer from 'react-player';
import type { TrainingSection } from '@/types/training';

export function VideoTraining() {
  const { sectionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sectionData, setSectionData] = useState<TrainingSection | null>(null);
  const playerRef = useRef<ReactPlayer>(null);
  const progressThreshold = 0.95; // 95% of the video must be watched to mark as complete

  useEffect(() => {
    const fetchUserAndSection = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.user) {
          navigate('/');
          return;
        }
        
        setUserId(sessionData.session.user.id);
        
        // Get section data from location state or default data
        const section = location.state?.section;
        if (section) {
          setSectionData(section);
        } else {
          // Fallback to default data if not provided in state
          const defaultSections = [
            {
              id: 'section1',
              title: 'Professional Etiquette',
              description: 'Learn the required professional behavior and communication techniques in a work environment',
              videoUrl: 'https://drive.google.com/file/d/1K7hyyDPFesbN30_zfHBWIc_fXx56RxCN/view?usp=sharing',
              duration: '2 min'
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
          
          const foundSection = defaultSections.find(s => s.id === sectionId);
          if (foundSection) {
            setSectionData(foundSection);
          } else {
            toast.error('Training section not found');
            navigate('/dashboard');
            return;
          }
        }
        
        // Check if section is already completed - use maybeSingle instead of single to handle no results
        const { data: progressData } = await supabase
          .from('training_progress')
          .select('*')
          .eq('user_id', sessionData.session.user.id)
          .eq('section_id', sectionId)
          .maybeSingle();
          
        if (progressData && progressData.completed) {
          setVideoCompleted(true);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load training section');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndSection();
  }, [sectionId, navigate, location.state]);

  const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    setWatchedSeconds(state.playedSeconds);
    
    // Mark as completed if watched enough of the video
    if (state.played >= progressThreshold && !videoCompleted) {
      handleVideoComplete();
    }
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const handleVideoComplete = async () => {
    if (!userId || !sectionId || videoCompleted) return;
    
    try {
      setVideoCompleted(true);
      
      // Update or insert progress record
      const { data: existingRecord } = await supabase
        .from('training_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('section_id', sectionId)
        .maybeSingle();
      
      if (existingRecord) {
        // Update existing record
        await supabase
          .from('training_progress')
          .update({
            completed: true,
            completion_date: new Date().toISOString()
          })
          .eq('id', existingRecord.id);
      } else {
        // Insert new record
        await supabase
          .from('training_progress')
          .insert({
            user_id: userId,
            section_id: sectionId,
            completed: true,
            completion_date: new Date().toISOString()
          });
      }
      
      toast.success('Section completed!');
    } catch (error) {
      console.error('Error marking section as completed:', error);
      toast.error('Failed to update progress');
      setVideoCompleted(false);
    }
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  if (loading || !sectionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ea6565] to-[#b84141]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  const progressPercentage = duration > 0 ? Math.min(Math.round((watchedSeconds / duration) * 100), 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ea6565] to-[#b84141] p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="p-4 sm:p-6 contrast-bg shadow-lg border-0">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleGoBack}
                className="mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {sectionData.title}
              </h1>
            </div>
            <UserMenu />
          </div>
          
          <p className="text-gray-700 mb-6">{sectionData.description}</p>
          
          <div className="rounded-lg overflow-hidden mb-6 aspect-video relative shadow-md">
            <ReactPlayer
              ref={playerRef}
              url={sectionData.videoUrl}
              width="100%"
              height="100%"
              controls
              playing={true}
              onProgress={handleProgress}
              onDuration={handleDuration}
              config={{
                youtube: {
                  playerVars: { showinfo: 1 }
                }
              }}
            />
            
            {videoCompleted && (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Completed
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-800">Your Progress</h3>
              <span className="text-sm text-gray-700">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            {videoCompleted ? (
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                You have completed this section
              </p>
            ) : (
              <p className="text-sm text-gray-700 mt-2">
                Watch at least 95% of the video to mark as complete
              </p>
            )}
          </div>
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleGoBack}
              className="border-gray-300 text-gray-800 hover:bg-gray-50"
            >
              Back to Dashboard
            </Button>
            
            {!videoCompleted && duration > 0 && progressPercentage < Math.round(progressThreshold * 100) && (
              <Button
                onClick={() => {
                  if (playerRef.current) {
                    // Jump to 95% of the video for testing purposes
                    playerRef.current.seekTo(duration * progressThreshold);
                  }
                }}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                Skip to End (Testing)
              </Button>
            )}
            
            {videoCompleted && (
              <Button
                className="bg-[#ea6565] hover:bg-[#d45151] text-white"
                onClick={handleGoBack}
              >
                Continue Training
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
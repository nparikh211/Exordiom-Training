import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserMenu } from '@/components/ui/UserMenu';
import { ArrowLeft, ArrowRight, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { QuizQuestion, UserQuizAnswer } from '@/types/training';

export function QuizPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserQuizAnswer[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [previousAttempts, setPreviousAttempts] = useState(0);
  const [userProfile, setUserProfile] = useState<{
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null>(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        
        // Check authentication
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.user) {
          navigate('/');
          return;
        }
        
        const userId = sessionData.session.user.id;
        setUserId(userId);
        
        // Get user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', userId)
          .single();
          
        if (profileData) {
          setUserProfile(profileData);
        }
        
        // Get previous attempts
        const { data: attemptsData } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', userId)
          .order('attempt_number', { ascending: false })
          .limit(1);
          
        if (attemptsData && attemptsData.length > 0) {
          setPreviousAttempts(attemptsData[0].attempt_number);
          setAttemptNumber(attemptsData[0].attempt_number + 1);
          
          // Check if already passed
          if (attemptsData[0].passed) {
            setQuizPassed(true);
          }
        } else {
          setAttemptNumber(1);
        }
        
        // Check if all training sections are completed
        const { data: progressData } = await supabase
          .from('training_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('completed', true);
          
        if (!progressData || progressData.length < 3) {
          toast.error('You must complete all training sections first');
          navigate('/dashboard');
          return;
        }
        
        // Fetch quiz questions
        const { data: questionsData, error } = await supabase
          .from('quiz_questions')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        if (questionsData) {
          // Shuffle questions for this attempt
          const shuffledQuestions = [...questionsData].sort(() => Math.random() - 0.5);
          setQuestions(shuffledQuestions);
        }
      } catch (error) {
        console.error('Error fetching quiz data:', error);
        toast.error('Failed to load quiz');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizData();
  }, [navigate]);

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleNextQuestion = () => {
    if (!selectedAnswer) {
      toast.error('Please select an answer');
      return;
    }
    
    // Record this answer
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    setUserAnswers([
      ...userAnswers,
      {
        questionId: currentQuestion.id,
        selectedAnswer,
        correct: isCorrect
      }
    ]);
    
    // Move to next question or submit quiz
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      handleSubmitQuiz([
        ...userAnswers,
        {
          questionId: currentQuestion.id,
          selectedAnswer,
          correct: isCorrect
        }
      ]);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Restore previous answer
      const previousAnswer = userAnswers[currentQuestionIndex - 1];
      if (previousAnswer) {
        setSelectedAnswer(previousAnswer.selectedAnswer);
      }
    }
  };

  const handleSubmitQuiz = async (finalAnswers: UserQuizAnswer[]) => {
    if (!userId) return;
    
    try {
      setQuizSubmitted(true);
      
      // Calculate score
      const correctAnswers = finalAnswers.filter(a => a.correct).length;
      const score = Math.round((correctAnswers / questions.length) * 100);
      const passed = score === 100; // Must get 100% to pass
      
      setQuizPassed(passed);
      
      // Save attempt to database
      const { data: attemptData, error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: userId,
          score,
          passed,
          attempt_number: attemptNumber,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // If passed, send email notification
      if (passed && userProfile) {
        // Send completion notification using Netlify function
        try {
          const response = await fetch('/.netlify/functions/training-completed', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firstName: userProfile.first_name || '',
              lastName: userProfile.last_name || '',
              email: userProfile.email,
              attemptCount: attemptNumber,
              completionDate: new Date().toISOString()
            }),
          });
          
          if (!response.ok) {
            console.error('Failed to send completion notification');
          }
        } catch (emailError) {
          console.error('Error sending completion notification:', emailError);
        }
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    }
  };

  const handleRetakeQuiz = () => {
    // Reset quiz state for retake
    setSelectedAnswer(null);
    setUserAnswers([]);
    setCurrentQuestionIndex(0);
    setQuizSubmitted(false);
    setAttemptNumber(attemptNumber + 1);
    
    // Reshuffle questions
    setQuestions(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ea6565] to-[#b84141]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  // Current question being displayed
  const currentQuestion = questions[currentQuestionIndex];
  
  // Overall quiz progress
  const quizProgress = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ea6565] to-[#b84141] p-2 sm:p-4">
      <div className="max-w-3xl mx-auto">
        <Card className="p-4 sm:p-6 contrast-bg shadow-lg border-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToDashboard}
                className="mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Professional Etiquette Quiz
              </h1>
            </div>
            <UserMenu />
          </div>
          
          {!quizSubmitted ? (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-800">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </h3>
                  <span className="text-sm text-gray-700">{quizProgress}%</span>
                </div>
                <Progress value={quizProgress} className="h-2" />
                
                {previousAttempts > 0 && (
                  <p className="text-sm text-gray-700 mt-2">
                    Attempt #{attemptNumber} - Previous attempts: {previousAttempts}
                  </p>
                )}
              </div>
              
              {currentQuestion && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {currentQuestion.question}
                    </h2>
                    
                    <RadioGroup
                      value={selectedAnswer || ''}
                      onValueChange={handleAnswerSelect}
                      className="space-y-3"
                    >
                      <div className="flex items-start space-x-2 rounded-md border border-gray-200 p-3 hover:bg-gray-50">
                        <RadioGroupItem value="A" id="option-a" />
                        <Label className="cursor-pointer flex-1 text-gray-800" htmlFor="option-a">
                          {currentQuestion.option_a}
                        </Label>
                      </div>
                      <div className="flex items-start space-x-2 rounded-md border border-gray-200 p-3 hover:bg-gray-50">
                        <RadioGroupItem value="B" id="option-b" />
                        <Label className="cursor-pointer flex-1 text-gray-800" htmlFor="option-b">
                          {currentQuestion.option_b}
                        </Label>
                      </div>
                      <div className="flex items-start space-x-2 rounded-md border border-gray-200 p-3 hover:bg-gray-50">
                        <RadioGroupItem value="C" id="option-c" />
                        <Label className="cursor-pointer flex-1 text-gray-800" htmlFor="option-c">
                          {currentQuestion.option_c}
                        </Label>
                      </div>
                      <div className="flex items-start space-x-2 rounded-md border border-gray-200 p-3 hover:bg-gray-50">
                        <RadioGroupItem value="D" id="option-d" />
                        <Label className="cursor-pointer flex-1 text-gray-800" htmlFor="option-d">
                          {currentQuestion.option_d}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="border-gray-300 text-gray-800 hover:bg-gray-50"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    
                    <Button
                      onClick={handleNextQuestion}
                      className="bg-[#ea6565] hover:bg-[#d45151] text-white"
                      disabled={!selectedAnswer}
                    >
                      {currentQuestionIndex < questions.length - 1 ? (
                        <>
                          Next
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        'Submit Quiz'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              {quizPassed ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertTitle className="text-green-800 text-lg">Congratulations!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    You've passed the quiz with a perfect score. Your training is now complete.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertTitle className="text-red-800 text-lg">Not Quite There</AlertTitle>
                  <AlertDescription className="text-red-700">
                    You need to score 100% to pass this quiz. Please review and try again.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Quiz Results</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-700">Score:</p>
                    <p className="font-medium text-gray-900">
                      {userAnswers.filter(a => a.correct).length} / {questions.length} correct
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">Percentage:</p>
                    <p className="font-medium text-gray-900">
                      {Math.round((userAnswers.filter(a => a.correct).length / questions.length) * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">Status:</p>
                    <p className={`font-medium ${quizPassed ? 'text-green-600' : 'text-red-600'}`}>
                      {quizPassed ? 'Passed' : 'Failed'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">Attempt:</p>
                    <p className="font-medium text-gray-900">#{attemptNumber}</p>
                  </div>
                </div>
              </div>
              
              {!quizPassed && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Review Your Answers</h3>
                  
                  <div className="space-y-3">
                    {userAnswers.map((answer, index) => {
                      const question = questions.find(q => q.id === answer.questionId);
                      if (!question) return null;
                      
                      return (
                        <div 
                          key={answer.questionId}
                          className={`p-3 rounded-lg border ${
                            answer.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {answer.correct ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            )}
                            <div>
                              <h4 className="font-medium text-gray-900">{index + 1}. {question.question}</h4>
                              <p className="text-sm mt-1 text-gray-800">
                                Your answer: {answer.selectedAnswer === 'A' ? question.option_a :
                                              answer.selectedAnswer === 'B' ? question.option_b :
                                              answer.selectedAnswer === 'C' ? question.option_c :
                                              question.option_d}
                              </p>
                              {!answer.correct && (
                                <p className="text-sm text-green-700 mt-1">
                                  Correct answer: {question.correct_answer === 'A' ? question.option_a :
                                                  question.correct_answer === 'B' ? question.option_b :
                                                  question.correct_answer === 'C' ? question.option_c :
                                                  question.option_d}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handleBackToDashboard}
                  className="border-gray-300 text-gray-800 hover:bg-gray-50"
                >
                  Back to Dashboard
                </Button>
                
                {!quizPassed && (
                  <Button
                    onClick={handleRetakeQuiz}
                    className="bg-[#ea6565] hover:bg-[#d45151] text-white"
                  >
                    Retake Quiz
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
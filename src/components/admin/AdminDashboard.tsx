import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserMenu } from '@/components/ui/UserMenu';
import { ArrowLeft, Search, SortAsc, SortDesc, Download, BarChart2, UserCog, ShieldAlert } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/supabase';
import { format } from 'date-fns';
import type { ProfileData, TrainingProgress, QuizAttempt } from '@/types/training';

interface UserTrainingData {
  profile: ProfileData;
  progress: TrainingProgress[];
  attempts: QuizAttempt[];
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserTrainingData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'name', direction: 'asc' });
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [adminConfirmed, setAdminConfirmed] = useState(false);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.user) {
          toast.error("Authentication required");
          navigate('/');
          return;
        }
        
        // Check admin status
        const adminStatus = await isAdmin(sessionData.session.user.id);
        if (!adminStatus) {
          toast.error('Unauthorized. Admin access required.');
          navigate('/dashboard');
          return;
        }
        
        setAdminConfirmed(true);
        
        // Fetch all profiles - use special admin function if available
        let profilesData = [];
        
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (error) {
            console.error('Error fetching profiles:', error);
            throw error;
          }
           
          profilesData = data || [];
        } catch (profilesError) {
          console.error('Failed to fetch profiles using standard method:', profilesError);
          
          // If this fails, the RLS policies are likely not set up correctly
          toast.error("Unable to fetch user profiles. Please check database permissions.");
          
          // Provide empty data so we don't crash
          profilesData = [];
        }
        
        // Fetch all training progress
        let progressData = [];
        
        try {
          const { data, error } = await supabase
            .from('training_progress')
            .select('*');
            
          if (error) {
            console.error('Error fetching training progress:', error);
            throw error;
          }
           
          progressData = data || [];
        } catch (progressError) {
          console.error('Failed to fetch training progress:', progressError);
          progressData = [];
        }
        
        // Fetch quiz attempts
        let attemptsData = [];
        
        try {
          const { data, error } = await supabase
            .from('quiz_attempts')
            .select('*')
            .order('attempt_number', { ascending: false });
            
          if (error) {
            console.error('Error fetching quiz attempts:', error);
            throw error;
          }
           
          attemptsData = data || [];
        } catch (attemptsError) {
          console.error('Failed to fetch quiz attempts:', attemptsError);
          attemptsData = [];
        }
        
        // Combine data
        const combinedData: UserTrainingData[] = profilesData.map((profile: any) => {
          const userProgress = progressData.filter((p: any) => p.user_id === profile.id);
          const userAttempts = attemptsData.filter((a: any) => a.user_id === profile.id);
          
          return {
            profile,
            progress: userProgress,
            attempts: userAttempts
          };
        });
        
        setUserData(combinedData);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Failed to load admin dashboard');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminAndFetchData();
  }, [navigate]);

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const getSortedData = () => {
    const filteredData = userData.filter(user => {
      // Filter by search query
      const searchString = `${user.profile.first_name} ${user.profile.last_name} ${user.profile.email}`.toLowerCase();
      const matchesSearch = searchQuery === '' || searchString.includes(searchQuery.toLowerCase());
      
      // Filter by tab
      if (activeTab === 'all') {
        return matchesSearch;
      } else if (activeTab === 'completed') {
        const hasPassed = user.attempts.some(a => a.passed);
        return matchesSearch && hasPassed;
      } else {
        const hasPassed = user.attempts.some(a => a.passed);
        return matchesSearch && !hasPassed;
      }
    });
    
    return [...filteredData].sort((a, b) => {
      switch (sortConfig.key) {
        case 'name':
          const nameA = `${a.profile.first_name || ''} ${a.profile.last_name || ''}`.toLowerCase();
          const nameB = `${b.profile.first_name || ''} ${b.profile.last_name || ''}`.toLowerCase();
          return sortConfig.direction === 'asc' 
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
          
        case 'email':
          return sortConfig.direction === 'asc'
            ? a.profile.email.localeCompare(b.profile.email)
            : b.profile.email.localeCompare(a.profile.email);
          
        case 'progress':
          const progressA = (a.progress.filter(p => p.completed).length / 3) * 100;
          const progressB = (b.progress.filter(p => p.completed).length / 3) * 100;
          return sortConfig.direction === 'asc'
            ? progressA - progressB
            : progressB - progressA;
          
        case 'completion':
          const completedA = a.attempts.some(attempt => attempt.passed);
          const completedB = b.attempts.some(attempt => attempt.passed);
          
          if (completedA === completedB) {
            // If completion status is the same, sort by completion date
            const dateA = a.attempts.find(attempt => attempt.passed)?.completed_at || '';
            const dateB = b.attempts.find(attempt => attempt.passed)?.completed_at || '';
            return sortConfig.direction === 'asc'
              ? dateA.localeCompare(dateB)
              : dateB.localeCompare(dateA);
          }
          
          return sortConfig.direction === 'asc'
            ? completedA ? 1 : -1
            : completedA ? -1 : 1;
          
        case 'attempts':
          const attemptsA = a.attempts.length;
          const attemptsB = b.attempts.length;
          return sortConfig.direction === 'asc'
            ? attemptsA - attemptsB
            : attemptsB - attemptsA;
          
        default:
          return 0;
      }
    });
  };

  const exportToCSV = () => {
    // Prepare data
    const csvRows = [];
    
    // Header row
    csvRows.push([
      'Name',
      'Email',
      'Training Progress',
      'Completed Sections',
      'Quiz Attempts',
      'Last Attempt Date',
      'Quiz Passed',
      'Completion Date',
      'Registration Date'
    ].join(','));
    
    // Data rows
    getSortedData().forEach(user => {
      const name = `${user.profile.first_name || ''} ${user.profile.last_name || ''}`;
      const email = user.profile.email;
      const completedSections = user.progress.filter(p => p.completed).length;
      const progress = Math.round((completedSections / 3) * 100);
      const attemptsCount = user.attempts.length;
      const lastAttemptDate = user.attempts[0]?.completed_at 
        ? format(new Date(user.attempts[0].completed_at), 'yyyy-MM-dd')
        : 'N/A';
      const passed = user.attempts.some(a => a.passed);
      const passedDate = user.attempts.find(a => a.passed)?.completed_at
        ? format(new Date(user.attempts.find(a => a.passed)!.completed_at!), 'yyyy-MM-dd')
        : 'N/A';
      const registrationDate = format(new Date(user.profile.created_at), 'yyyy-MM-dd');
      
      csvRows.push([
        `"${name}"`,
        `"${email}"`,
        `${progress}%`,
        completedSections,
        attemptsCount,
        lastAttemptDate,
        passed ? 'Yes' : 'No',
        passedDate,
        registrationDate
      ].join(','));
    });
    
    // Generate CSV content
    const csvContent = csvRows.join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `training-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ea6565] to-[#b84141]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (!adminConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ea6565] to-[#b84141]">
        <Card className="p-6 max-w-md text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-4">Admin Access Required</h2>
          <p className="mb-6">You don't have permission to access the admin dashboard.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const sortedData = getSortedData();
  const completedCount = userData.filter(user => user.attempts.some(a => a.passed)).length;
  const inProgressCount = userData.length - completedCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ea6565] to-[#b84141] p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="p-4 sm:p-6 bg-white shadow-lg border-0 contrast-bg">
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
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                  <UserCog className="h-6 w-6 mr-2 text-blue-600" />
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500">Manage and monitor user training progress</p>
              </div>
            </div>
            <UserMenu />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 contrast-card">
              <h3 className="text-sm font-medium text-gray-700">Total Users</h3>
              <p className="text-3xl font-bold text-gray-900">{userData.length}</p>
            </Card>
            
            <Card className="p-4 contrast-card">
              <h3 className="text-sm font-medium text-gray-700">Training Completed</h3>
              <p className="text-3xl font-bold text-green-600">{completedCount}</p>
            </Card>
            
            <Card className="p-4 contrast-card">
              <h3 className="text-sm font-medium text-gray-700">In Progress</h3>
              <p className="text-3xl font-bold text-blue-600">{inProgressCount}</p>
            </Card>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'all' | 'completed' | 'incomplete')}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-3 w-full sm:w-auto bg-gray-100">
                <TabsTrigger value="all" className="data-[state=active]:bg-[#ea6565] data-[state=active]:text-white">All Users</TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:bg-[#ea6565] data-[state=active]:text-white">Completed</TabsTrigger>
                <TabsTrigger value="incomplete" className="data-[state=active]:bg-[#ea6565] data-[state=active]:text-white">Incomplete</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex w-full sm:w-auto gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white border-gray-300 text-gray-900"
                />
              </div>
              
              <Button 
                onClick={exportToCSV}
                variant="outline"
                className="whitespace-nowrap text-gray-800 border-gray-300 bg-white hover:bg-gray-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          
          <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
            <Table className="admin-table">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-200 text-gray-900 font-semibold"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Name
                      {sortConfig.key === 'name' && (
                        sortConfig.direction === 'asc' 
                          ? <SortAsc className="ml-1 h-4 w-4" /> 
                          : <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-200 text-gray-900 font-semibold"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center">
                      Email
                      {sortConfig.key === 'email' && (
                        sortConfig.direction === 'asc' 
                          ? <SortAsc className="ml-1 h-4 w-4" /> 
                          : <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-200 text-center text-gray-900 font-semibold"
                    onClick={() => handleSort('progress')}
                  >
                    <div className="flex items-center justify-center">
                      Training Progress
                      {sortConfig.key === 'progress' && (
                        sortConfig.direction === 'asc' 
                          ? <SortAsc className="ml-1 h-4 w-4" /> 
                          : <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-200 text-center text-gray-900 font-semibold"
                    onClick={() => handleSort('attempts')}
                  >
                    <div className="flex items-center justify-center">
                      Quiz Attempts
                      {sortConfig.key === 'attempts' && (
                        sortConfig.direction === 'asc' 
                          ? <SortAsc className="ml-1 h-4 w-4" /> 
                          : <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-200 text-center text-gray-900 font-semibold"
                    onClick={() => handleSort('completion')}
                  >
                    <div className="flex items-center justify-center">
                      Status
                      {sortConfig.key === 'completion' && (
                        sortConfig.direction === 'asc' 
                          ? <SortAsc className="ml-1 h-4 w-4" /> 
                          : <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right text-gray-900 font-semibold">Registration Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length > 0 ? (
                  sortedData.map((user) => {
                    const completedSections = user.progress.filter(p => p.completed).length;
                    const progress = Math.round((completedSections / 3) * 100);
                    const attemptsCount = user.attempts.length;
                    const passed = user.attempts.some(a => a.passed);
                    const completionDate = user.attempts.find(a => a.passed)?.completed_at;
                    
                    return (
                      <TableRow key={user.profile.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">
                          {user.profile.first_name} {user.profile.last_name}
                          {user.profile.is_admin && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Admin</span>}
                        </TableCell>
                        <TableCell className="text-gray-900">{user.profile.email}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-12 text-center mr-2 text-gray-900">{progress}%</div>
                            <div className="w-24 bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  progress === 100 
                                    ? 'bg-green-600' 
                                    : progress >= 66 
                                    ? 'bg-blue-600' 
                                    : progress >= 33 
                                    ? 'bg-yellow-500'
                                    : 'bg-red-600'
                                }`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-700 mt-1">
                            {completedSections} of 3 sections
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {attemptsCount > 0 ? (
                            <div>
                              <span className="font-medium text-gray-900">{attemptsCount}</span>
                              {user.attempts[0]?.completed_at && (
                                <div className="text-xs text-gray-700 mt-1">
                                  Last: {format(new Date(user.attempts[0].completed_at), 'MMM d, yyyy')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-700">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {passed ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Completed
                            </Badge>
                          ) : progress > 0 ? (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                              In Progress
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                              Not Started
                            </Badge>
                          )}
                          {completionDate && (
                            <div className="text-xs text-gray-700 mt-1">
                              {format(new Date(completionDate), 'MMM d, yyyy')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-gray-900">
                          {format(new Date(user.profile.created_at), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-700">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
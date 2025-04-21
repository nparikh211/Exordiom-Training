import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { LoginPage } from './components/auth/LoginPage';
import { TrainingDashboard } from './components/training/TrainingDashboard';
import { VideoTraining } from './components/training/VideoTraining';
import { QuizPage } from './components/quiz/QuizPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ProfilePage } from './components/profile/ProfilePage';
import { supabase } from './lib/supabase';
import { isAdmin as checkIsAdmin } from './lib/supabase';
import './App.css';

function ProtectedRoute({ children, adminRequired = false }: { children: React.ReactNode, adminRequired?: boolean }) {
  const [user, setUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user || null;
      setUser(currentUser);
      
      if (currentUser) {
        // Check if user is admin
        const adminStatus = await checkIsAdmin(currentUser.id);
        setIsAdmin(adminStatus);
      }
      
      setLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        
        if (currentUser) {
          // Check if user is admin
          const adminStatus = await checkIsAdmin(currentUser.id);
          setIsAdmin(adminStatus);
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    checkAuth();

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ea6565]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (adminRequired && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user);
      setLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    checkAuth();

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ea6565]" />
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class">
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <TrainingDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/training/:sectionId"
            element={
              <ProtectedRoute>
                <VideoTraining />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz"
            element={
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminRequired={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
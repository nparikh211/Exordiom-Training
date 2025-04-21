import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, getCurrentUser, isAdmin } from '@/lib/supabase';
import { toast } from 'sonner';

export function UserMenu() {
  const [userName, setUserName] = useState('User');
  const [userInitials, setUserInitials] = useState('U');
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          // Try to get profile details
          const firstName = user.user_metadata?.first_name || '';
          const lastName = user.user_metadata?.last_name || '';
          
          if (firstName && lastName) {
            setUserName(`${firstName} ${lastName}`);
            setUserInitials(`${firstName[0]}${lastName[0]}`);
          } else {
            // Use email as fallback
            setUserName(user.email || 'User');
            setUserInitials((user.email || 'U')[0].toUpperCase());
          }
          
          // Check if user is admin
          const adminStatus = await isAdmin(user.id);
          setUserIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out. Please try again.');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 px-2 sm:px-3 h-9 sm:h-10 border-0"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-[#ea6565] text-white">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm hidden sm:inline">{userName}</span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        {userIsAdmin && (
          <DropdownMenuItem onClick={() => navigate('/admin')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Admin Dashboard</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
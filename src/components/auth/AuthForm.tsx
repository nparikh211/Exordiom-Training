import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Mail, User } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

interface AuthFormProps {
  isLogin: boolean;
  onSubmit: (data: LoginFormValues | SignupFormValues) => void;
  loading: boolean;
}

export function AuthForm({ isLogin, onSubmit, loading }: AuthFormProps) {
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  const handleSubmit = isLogin
    ? loginForm.handleSubmit(onSubmit)
    : signupForm.handleSubmit(onSubmit);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isLogin && (
        <>
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <Input
                id="firstName"
                placeholder="First name"
                {...signupForm.register('firstName')}
                className="pl-10 text-gray-900 border-gray-300 bg-white"
              />
            </div>
            {signupForm.formState.errors.firstName && (
              <p className="text-sm text-red-600 font-medium">
                {signupForm.formState.errors.firstName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <Input
                id="lastName"
                placeholder="Last name"
                {...signupForm.register('lastName')}
                className="pl-10 text-gray-900 border-gray-300 bg-white"
              />
            </div>
            {signupForm.formState.errors.lastName && (
              <p className="text-sm text-red-600 font-medium">
                {signupForm.formState.errors.lastName.message}
              </p>
            )}
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-700">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
          <Input
            id="email"
            type="email"
            placeholder="Email address"
            {...(isLogin ? loginForm.register('email') : signupForm.register('email'))}
            className="pl-10 text-gray-900 border-gray-300 bg-white"
          />
        </div>
        {isLogin && loginForm.formState.errors.email && (
          <p className="text-sm text-red-600 font-medium">
            {loginForm.formState.errors.email.message}
          </p>
        )}
        {!isLogin && signupForm.formState.errors.email && (
          <p className="text-sm text-red-600 font-medium">
            {signupForm.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-700">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
          <Input
            id="password"
            type="password"
            placeholder="Password"
            {...(isLogin ? loginForm.register('password') : signupForm.register('password'))}
            className="pl-10 text-gray-900 border-gray-300 bg-white"
          />
        </div>
        {isLogin && loginForm.formState.errors.password && (
          <p className="text-sm text-red-600 font-medium">
            {loginForm.formState.errors.password.message}
          </p>
        )}
        {!isLogin && signupForm.formState.errors.password && (
          <p className="text-sm text-red-600 font-medium">
            {signupForm.formState.errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-[#ea6565] hover:bg-[#d45151] text-white"
        disabled={loading}
      >
        {loading ? 'Processing...' : isLogin ? 'Sign in' : 'Sign up'}
      </Button>
    </form>
  );
}
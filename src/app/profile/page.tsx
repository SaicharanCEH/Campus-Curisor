
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import DashboardHeader from '@/components/dashboard-header';
import { updateUserProfile, changePassword } from '@/ai/flows/update-user-profile';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const profileFormSchema = z.object({
  fullName: z.string().min(3, { message: 'Full name must be at least 3 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phoneNumber: z.string().refine(phone => /^\d{10}$/.test(phone), { message: 'Phone number must be exactly 10 digits.' }),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required.' }),
  newPassword: z.string().min(6, { message: 'New password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match.",
  path: ['confirmPassword'],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  identifier: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
  });
  
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      profileForm.reset({
          fullName: parsedUser.fullName || '',
          email: parsedUser.email || '',
          phoneNumber: parsedUser.phoneNumber ? parsedUser.phoneNumber.replace('+91', '') : '',
      });
      setIsLoading(false);
    } else {
      router.push('/login');
    }
  }, [router, profileForm]);

  const handleProfileUpdate = async (data: ProfileFormValues) => {
    if (!user) return;
    
    const result = await updateUserProfile({
      userId: user.id,
      fullName: data.fullName,
      email: data.email,
      phoneNumber: `+91${data.phoneNumber}`,
    });

    if (result.success) {
      toast({ title: 'Profile Updated', description: 'Your information has been successfully updated.' });
      const updatedUser = { ...user, ...data, phoneNumber: `+91${data.phoneNumber}` };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } else {
      toast({ variant: 'destructive', title: 'Update Failed', description: result.message });
    }
  };

  const handlePasswordChange = async (data: PasswordFormValues) => {
    if (!user) return;
    
    const result = await changePassword({
      userId: user.id,
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });

    if (result.success) {
      toast({ title: 'Password Changed', description: 'Your password has been successfully updated.' });
      passwordForm.reset();
    } else {
      toast({ variant: 'destructive', title: 'Change Failed', description: result.message });
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  if (isLoading) {
    return (
        <div className="flex flex-col h-screen">
            <DashboardHeader isAuthenticated={true} onLogout={() => {}} />
            <main className="flex-1 flex justify-center items-start p-4 md:p-8">
                <Skeleton className="w-full max-w-2xl h-96" />
            </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader isAuthenticated={!!user} onLogout={handleLogout} />
      <main className="flex-1 flex justify-center items-start p-4 md:p-8">
        <div className="w-full max-w-2xl space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" {...profileForm.register('fullName')} />
                  {profileForm.formState.errors.fullName && <p className="text-sm text-destructive">{profileForm.formState.errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" {...profileForm.register('email')} />
                   {profileForm.formState.errors.email && <p className="text-sm text-destructive">{profileForm.formState.errors.email.message}</p>}
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-background text-muted-foreground sm:text-sm">+91</span>
                    <Input id="phoneNumber" type="tel" {...profileForm.register('phoneNumber')} className="rounded-l-none" />
                  </div>
                  {profileForm.formState.errors.phoneNumber && <p className="text-sm text-destructive">{profileForm.formState.errors.phoneNumber.message}</p>}
                </div>
                <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                  {profileForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password here. Make sure it's a strong one.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
                  {passwordForm.formState.errors.currentPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>}
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
                  {passwordForm.formState.errors.newPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>}
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} />
                  {passwordForm.formState.errors.confirmPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>}
                </div>
                <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                    {passwordForm.formState.isSubmitting ? 'Changing...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

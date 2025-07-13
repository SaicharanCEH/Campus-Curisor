'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { deleteAllUsers } from '@/ai/flows/delete-all-users';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

export function UserTable() {
  const [users, setUsers] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    } catch (err) {
      setError('Failed to fetch users. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleClearUsers = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAllUsers();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'All users have been deleted.',
        });
        setUsers([]); // Clear users from state
      } else {
        throw new Error(result.message || 'An unknown error occurred');
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
        <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-center">{error}</p>;
  }

  return (
    <div>
        <div className="flex justify-end mb-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={users.length === 0}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Users
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all
                    user accounts from the database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearUsers} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Continue'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
        <ScrollArea className="h-96">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Identifier</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Bus Number</TableHead>
                <TableHead>Pickup</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {users.length > 0 ? (
                users.map(user => (
                <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.role === 'student' ? user.rollNumber : user.username}</TableCell>
                    <TableCell>{user.password}</TableCell>
                    <TableCell>{user.busNumber || 'N/A'}</TableCell>
                    <TableCell>{user.pickupLocation ? `${user.pickupLocation} at ${user.pickupTime}` : 'N/A'}</TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={7} className="text-center">No users found.</TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
        </ScrollArea>
    </div>
  );
}

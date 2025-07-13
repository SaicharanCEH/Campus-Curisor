
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, DocumentData, query, where } from 'firebase/firestore';
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
import { deleteAllStudents } from '@/ai/flows/delete-all-students';
import { deleteStudent } from '@/ai/flows/delete-student';
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
import type { Route } from '@/types';

interface StudentWithLocation extends DocumentData {
    location?: string;
}

export function UserTable() {
  const [students, setStudents] = useState<StudentWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const fetchStudentsAndLocations = async () => {
    setLoading(true);
    try {
      // Fetch all routes to get stop information
      const routesCollection = collection(db, 'routes');
      const routeSnapshot = await getDocs(routesCollection);
      const routesList = routeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Route));
      
      const stopLocationMap = new Map<string, string>();
      routesList.forEach(route => {
        route.stops.forEach(stop => {
          // Store the latest location for each roll number
          stopLocationMap.set(stop.rollNumber.toUpperCase(), stop.location);
        });
      });

      // Fetch all students
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);
      const studentsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const studentRollNumber = data.rollNumber?.toUpperCase();
        return {
          id: doc.id,
          ...data,
          location: stopLocationMap.get(studentRollNumber) || 'Not Assigned',
        };
      });

      setStudents(studentsData);
    } catch (err) {
      setError('Failed to fetch students. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchStudentsAndLocations();
  }, []);

  const handleClearStudents = async () => {
    setIsDeletingAll(true);
    try {
      const result = await deleteAllStudents();
      if (result.success) {
        toast({
          title: 'Success',
          description: 'All students have been deleted.',
        });
        setStudents([]); // Clear students from state
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
      setIsDeletingAll(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    setIsDeleting(true);
    try {
      const result = await deleteStudent(studentId);
      if (result.success) {
        toast({
          title: 'Student Deleted',
          description: 'The student account has been successfully removed.',
        });
        // Remove student from local state to update UI
        setStudents(prevStudents => prevStudents.filter(student => student.id !== studentId));
      } else {
        throw new Error(result.message || 'An unknown error occurred while deleting the student.');
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
                <Button variant="destructive" disabled={students.length === 0 || isDeletingAll}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeletingAll ? 'Clearing...' : 'Clear All Students'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all
                    student accounts from the database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearStudents} disabled={isDeletingAll}>
                    {isDeletingAll ? 'Deleting...' : 'Continue'}
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
                <TableHead>Roll Number</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Password</TableHead>
                <TableHead className="text-right">Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {students.length > 0 ? (
                students.map(user => (
                <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.rollNumber}</TableCell>
                    <TableCell>{user.location}</TableCell>
                    <TableCell>{user.phoneNumber || 'N/A'}</TableCell>
                    <TableCell>{user.password}</TableCell>
                    <TableCell className="text-right">
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isDeleting}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {user.fullName}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the student account for {user.fullName} ({user.rollNumber}). This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteStudent(user.id)} 
                                disabled={isDeleting}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={7} className="text-center">No students found.</TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
        </ScrollArea>
    </div>
  );
}

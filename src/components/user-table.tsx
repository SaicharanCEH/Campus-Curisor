
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Pencil } from 'lucide-react';
import type { Route, Stop } from '@/types';
import { EditStopForm } from './edit-stop-form';
import { useJsApiLoader } from '@react-google-maps/api';

interface StudentWithStopInfo extends DocumentData {
    stopInfo?: Stop;
    routeId?: string;
}

const libraries: ('places' | 'drawing' | 'geometry' | 'localContext' | 'visualization')[] = ['places'];


export function UserTable() {
  const [students, setStudents] = useState<StudentWithStopInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithStopInfo | null>(null);

  const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  const fetchStudentsAndLocations = async () => {
    setLoading(true);
    try {
      const routesCollection = collection(db, 'routes');
      const routeSnapshot = await getDocs(routesCollection);
      const routesList = routeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Route));
      
      const stopInfoMap = new Map<string, { stop: Stop; routeId: string }>();
      routesList.forEach(route => {
        route.stops.forEach(stop => {
          stopInfoMap.set(stop.rollNumber.toUpperCase(), { stop, routeId: route.id });
        });
      });

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);
      const studentsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const studentRollNumber = data.rollNumber?.toUpperCase();
        const stopData = stopInfoMap.get(studentRollNumber);
        return {
          id: doc.id,
          ...data,
          stopInfo: stopData?.stop,
          routeId: stopData?.routeId,
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
  
  const onStopUpdated = () => {
    setEditDialogOpen(false);
    fetchStudentsAndLocations(); // Re-fetch all data to ensure consistency
  }

  const handleEditClick = (student: StudentWithStopInfo) => {
    setSelectedStudent(student);
    setEditDialogOpen(true);
  };

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
                <TableHead>Roll Number</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Email</TableHead>
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
                    <TableCell>{user.rollNumber}</TableCell>
                    <TableCell>{user.stopInfo?.location || 'Not Assigned'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phoneNumber || 'N/A'}</TableCell>
                    <TableCell>{user.password}</TableCell>
                    <TableCell className="text-right">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         onClick={() => handleEditClick(user)} 
                         disabled={!user.stopInfo}
                         title={user.stopInfo ? "Edit stop" : "No stop assigned to edit"}
                        >
                          <Pencil className="h-4 w-4" />
                       </Button>
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
        {selectedStudent && (
          <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Stop for {selectedStudent.fullName}</DialogTitle>
              </DialogHeader>
              <EditStopForm 
                student={selectedStudent} 
                onStopUpdated={onStopUpdated}
                isGoogleMapsLoaded={isGoogleMapsLoaded}
              />
            </DialogContent>
          </Dialog>
        )}
    </div>
  );
}

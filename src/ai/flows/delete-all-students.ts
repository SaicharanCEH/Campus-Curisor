
'use server';
/**
 * @fileOverview A flow to delete all students from the database.
 *
 * - deleteAllStudents - A function that handles the deletion of all students.
 */
import { collection, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function deleteAllStudents(): Promise<{ success: boolean; message?: string }> {
  try {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('role', '==', 'student'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: true, message: 'No students to delete.' };
    }

    const batch = writeBatch(db);
    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error deleting all students:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to delete students: ${message}` };
  }
}

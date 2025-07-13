
'use server';
/**
 * @fileOverview A flow to delete a single student from the database.
 *
 * - deleteStudent - A function that handles the deletion of a student by their ID.
 */
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function deleteStudent(studentId: string): Promise<{ success: boolean; message?: string }> {
  try {
    if (!studentId) {
      throw new Error('Student ID is required.');
    }
    const studentDocRef = doc(db, 'users', studentId);
    await deleteDoc(studentDocRef);

    return { success: true };
  } catch (error) {
    console.error(`Error deleting student ${studentId}:`, error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to delete student: ${message}` };
  }
}

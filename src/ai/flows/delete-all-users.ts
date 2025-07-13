'use server';
/**
 * @fileOverview A flow to delete all users from the database.
 *
 * - deleteAllUsers - A function that handles the deletion of all users.
 */
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function deleteAllUsers(): Promise<{ success: boolean; message?: string }> {
  try {
    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);

    if (querySnapshot.empty) {
      return { success: true, message: 'No users to delete.' };
    }

    const batch = writeBatch(db);
    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error deleting all users:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to delete users: ${message}` };
  }
}

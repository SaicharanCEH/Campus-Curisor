
'use server';
/**
 * @fileOverview A flow to delete a single route from the database.
 *
 * - deleteRoute - A function that handles the deletion of a route by its ID.
 */
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function deleteRoute(routeId: string): Promise<{ success: boolean; message?: string }> {
  try {
    if (!routeId) {
      throw new Error('Route ID is required.');
    }
    const routeDocRef = doc(db, 'routes', routeId);
    await deleteDoc(routeDocRef);

    return { success: true };
  } catch (error) {
    console.error(`Error deleting route ${routeId}:`, error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to delete route: ${message}` };
  }
}

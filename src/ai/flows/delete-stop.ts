
'use server';
/**
 * @fileOverview A flow to delete a single stop from a route in the database.
 *
 * - deleteStop - A function that handles the deletion of a stop by its ID from a specific route.
 * - DeleteStopInput - The input type for the deleteStop function.
 */

import { doc, updateDoc, getDoc, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Route } from '@/types';

export interface DeleteStopInput {
  routeId: string;
  stopId: string;
}

export async function deleteStop({ routeId, stopId }: DeleteStopInput): Promise<{ success: boolean; message?: string }> {
  try {
    if (!routeId || !stopId) {
      throw new Error('Route ID and Stop ID are required.');
    }

    const routeRef = doc(db, 'routes', routeId);
    const routeSnap = await getDoc(routeRef);

    if (!routeSnap.exists()) {
      throw new Error('Route not found.');
    }

    const routeData = routeSnap.data() as Route;
    const stopToRemove = routeData.stops.find(stop => stop.id === stopId);

    if (!stopToRemove) {
      // If the stop doesn't exist, maybe it was already deleted.
      // Consider this a success to avoid user-facing errors for a resolved state.
      console.warn(`Stop with ID ${stopId} not found in route ${routeId}. It might have been already deleted.`);
      return { success: true, message: 'Stop not found, likely already deleted.' };
    }

    await updateDoc(routeRef, {
      stops: arrayRemove(stopToRemove)
    });

    return { success: true };
  } catch (error) {
    console.error(`Error deleting stop ${stopId} from route ${routeId}:`, error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to delete stop: ${message}` };
  }
}

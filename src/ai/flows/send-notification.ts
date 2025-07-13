
'use server';
/**
 * @fileOverview A flow to send a broadcast notification to all users.
 *
 * - sendNotification - A function that saves a notification message to the database.
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function sendNotification(message: string): Promise<{ success: boolean; message?: string }> {
  try {
    if (!message || message.trim().length === 0) {
      throw new Error('Notification message cannot be empty.');
    }

    await addDoc(collection(db, 'notifications'), {
      message: message.trim(),
      timestamp: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('Error sending notification:', error);
    return { success: false, message: `Failed to send notification: ${errorMessage}` };
  }
}

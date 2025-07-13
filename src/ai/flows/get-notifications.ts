
'use server';
/**
 * @fileOverview A flow to fetch all notifications from the database.
 *
 * - getNotifications - A function that returns a list of all notifications.
 */
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Notification } from '@/types';

export async function getNotifications(): Promise<Notification[]> {
  try {
    const notificationsCollection = collection(db, 'notifications');
    const q = query(notificationsCollection, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);

    const notifications = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      // Firestore timestamps need to be converted to a serializable format (e.g., ISO string)
      // to be passed from a server component/action to a client component.
      const timestamp = data.timestamp as Timestamp;
      return {
        id: doc.id,
        message: data.message,
        timestamp: timestamp.toDate().toISOString(),
      };
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return []; // Return empty array on error
  }
}

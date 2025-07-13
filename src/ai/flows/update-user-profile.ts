
'use server';
/**
 * @fileOverview A set of server actions for updating user profiles.
 *
 * - updateUserProfile - Updates a user's name, email, and phone number.
 * - changePassword - Updates a user's password after verifying the current one.
 */

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UpdateProfileInput {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

export async function updateUserProfile(input: UpdateProfileInput): Promise<{ success: boolean; message?: string }> {
  try {
    if (!input.userId) {
      throw new Error('User ID is required.');
    }
    const userDocRef = doc(db, 'users', input.userId);
    await updateDoc(userDocRef, {
      fullName: input.fullName,
      email: input.email,
      phoneNumber: input.phoneNumber,
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to update profile: ${message}` };
  }
}

interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export async function changePassword(input: ChangePasswordInput): Promise<{ success: boolean; message?: string }> {
  try {
    if (!input.userId) {
      throw new Error('User ID is required.');
    }
    const userDocRef = doc(db, 'users', input.userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error('User not found.');
    }

    const userData = userDoc.data();
    if (userData.password !== input.currentPassword) {
      throw new Error('Incorrect current password.');
    }

    await updateDoc(userDocRef, {
      password: input.newPassword,
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message };
  }
}

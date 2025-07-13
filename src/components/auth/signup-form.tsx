
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { sendWelcomeEmail } from '@/ai/flows/send-welcome-email';

interface SignupFormProps {
  onUserCreated?: () => void;
}

export function SignupForm({ onUserCreated }: SignupFormProps) {
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('student');
  const [busNumber, setBusNumber] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !identifier || !email) {
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: 'Please fill out all required fields.',
      });
      return;
    }
    
    // Validate roll number format for students
    if (role === 'student') {
        const rollNumberRegex = /^[a-zA-Z0-9]{10}$/;
        if (!rollNumberRegex.test(identifier)) {
            toast({
                variant: 'destructive',
                title: 'Invalid Roll Number',
                description: 'Roll number must be exactly 10 characters long.',
            });
            return;
        }
    }
    
    // Validate phone number format
    const phoneRegex = /^\d{10}$/;
    if (phoneNumber && !phoneRegex.test(phoneNumber)) {
        toast({
            variant: 'destructive',
            title: 'Invalid Phone Number',
            description: 'Phone number must be exactly 10 digits.',
        });
        return;
    }


    setIsSubmitting(true);
    try {
      const generatedPassword = Math.random().toString(36).slice(-8);
      
      const userData: { [key: string]: any } = {
        fullName,
        email,
        phoneNumber,
        password: generatedPassword, 
        role,
      };

      if (role === 'admin') {
        userData.username = identifier;
      } else {
        userData.rollNumber = identifier.toUpperCase();
        userData.busNumber = busNumber;
        userData.pickupLocation = pickupLocation;
        userData.pickupTime = pickupTime;
      }

      await addDoc(collection(db, 'users'), userData);
      toast({
        title: 'User Created',
        description: `Successfully created a new ${role}. Password: ${generatedPassword}`,
      });

      // Send the welcome email
      const emailResult = await sendWelcomeEmail({
        fullName,
        email,
        phoneNumber,
        identifier: role === 'student' ? identifier.toUpperCase() : identifier,
        password: generatedPassword,
        role,
        busNumber,
        pickupLocation,
        pickupTime
      });
      
      if (emailResult.success) {
        toast({
            title: 'Welcome Email Sent',
            description: `An email has been sent to ${email}.`,
        });
      } else {
         toast({
            variant: 'destructive',
            title: 'Email Failed',
            description: `Could not send welcome email to ${email}.`,
        });
      }


      // Clear form after successful submission
      setFullName('');
      setIdentifier('');
      setEmail('');
      setPhoneNumber('');
      setRole('student');
      setBusNumber('');
      setPickupLocation('');
      setPickupTime('');

      onUserCreated?.();

    } catch (error) {
      console.error('Error adding document: ', error);
      toast({
        variant: 'destructive',
        title: 'Creation Error',
        description: 'An error occurred. Please try again.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto max-w-sm w-full border-0 shadow-none">
      <CardContent className="px-0 pt-6">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Register as</Label>
            <RadioGroup defaultValue="student" onValueChange={setRole} value={role} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="student" id="student" />
                <Label htmlFor="student">Student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin">Admin</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input 
              id="full-name" 
              placeholder="Max Robinson" 
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)} 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="identifier">{role === 'admin' ? 'Username' : 'Roll Number'}</Label>
            <Input
              id="identifier"
              type="text"
              placeholder={role === 'admin' ? 'e.g., adminuser' : 'e.g., 23B81A05LT'}
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone-number">Phone Number</Label>
            <Input
              id="phone-number"
              type="tel"
              placeholder="+91"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          {role === 'student' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="bus-number">Bus Number</Label>
                <Input
                  id="bus-number"
                  type="text"
                  placeholder="e.g., 101"
                  value={busNumber}
                  onChange={(e) => setBusNumber(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pickup-location">Pickup Location</Label>
                <Input
                  id="pickup-location"
                  type="text"
                  placeholder="e.g., Downtown Station"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pickup-time">Pickup Time</Label>
                <Input
                  id="pickup-time"
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

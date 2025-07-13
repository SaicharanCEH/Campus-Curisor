
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AddRouteFormValues {
  name: string;
  busNumber: string;
  driverName: string;
  driverMobile: string;
}

interface AddRouteFormProps {
  onRouteCreated?: () => void;
}

export function AddRouteForm({ onRouteCreated }: AddRouteFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddRouteFormValues>({
    defaultValues: {
      name: '',
      busNumber: '',
      driverName: '',
      driverMobile: '',
    },
  });

  const onSubmit = async (data: AddRouteFormValues) => {
    setIsSubmitting(true);
    try {
      const routeData = {
        ...data,
        stops: [], // Initialize with an empty stops array
      };

      await addDoc(collection(db, 'routes'), routeData);

      toast({
        title: 'Route Created',
        description: `Successfully created route: ${data.name}. You can now add stops to it.`,
      });
      reset();
      onRouteCreated?.();
    } catch (error) {
      console.error('Error adding route: ', error);
      toast({
        variant: 'destructive',
        title: 'Creation Error',
        description: error instanceof Error ? error.message : 'An error occurred while creating the route.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 pt-4">
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Route Name</Label>
            <Input
              id="name"
              placeholder="e.g., Campus Express"
              {...register('name', { required: 'Route name is required' })}
            />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="busNumber">Bus Number</Label>
            <Input
              id="busNumber"
              placeholder="e.g., #1234"
              {...register('busNumber', { required: 'Bus number is required' })}
            />
            {errors.busNumber && <p className="text-destructive text-sm">{errors.busNumber.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="grid gap-2">
            <Label htmlFor="driverName">Driver Name</Label>
            <Input
              id="driverName"
              placeholder="e.g., John Doe"
              {...register('driverName', { required: "Driver's name is required" })}
            />
            {errors.driverName && <p className="text-destructive text-sm">{errors.driverName.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="driverMobile">Driver Mobile</Label>
            <Input
              id="driverMobile"
              type="tel"
              placeholder="e.g., 9876543210"
              {...register('driverMobile', { 
                  required: "Driver's mobile number is required",
                  pattern: {
                      value: /^\d{10}$/,
                      message: "Mobile number must be 10 digits."
                  }
              })}
            />
            {errors.driverMobile && <p className="text-destructive text-sm">{errors.driverMobile.message}</p>}
          </div>
        </div>
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating Route...' : 'Create Route'}
      </Button>
    </form>
  );
}

    
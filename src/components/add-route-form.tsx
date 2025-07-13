'use client';

import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { X, PlusCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollArea } from './ui/scroll-area';
import { geocodeAddress } from '@/ai/flows/geocode-address';

interface Stop {
  name: string;
  location: string;
  time: string;
}

interface AddRouteFormValues {
  name: string;
  busNumber: string;
  driverName: string;
  driverMobile: string;
  stops: Stop[];
}

interface AddRouteFormProps {
  onRouteCreated?: () => void;
}

export function AddRouteForm({ onRouteCreated }: AddRouteFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<AddRouteFormValues>({
    defaultValues: {
      name: '',
      busNumber: '',
      driverName: '',
      driverMobile: '',
      stops: [{ name: '', location: '', time: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stops',
  });

  const onSubmit = async (data: AddRouteFormValues) => {
    setIsSubmitting(true);
    try {
      const stopsWithPositions = await Promise.all(
        data.stops.map(async (stop) => {
          const { lat, lng } = await geocodeAddress({ address: stop.location });
          if (lat === 0 && lng === 0) {
            toast({
              variant: 'destructive',
              title: 'Geocoding Failed',
              description: `Could not find coordinates for location: ${stop.location}`,
            });
            throw new Error('Geocoding failed');
          }
          return {
            id: `${data.name.replace(/\s+/g, '-').toLowerCase()}-${stop.name.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substr(2, 5)}`,
            name: stop.name,
            location: stop.location,
            time: stop.time,
            position: { lat, lng },
          };
        })
      );
      
      const routeData = {
        name: data.name,
        busNumber: data.busNumber,
        driverName: data.driverName,
        driverMobile: data.driverMobile,
        stops: stopsWithPositions,
      };

      await addDoc(collection(db, 'routes'), routeData);

      toast({
        title: 'Route Created',
        description: `Successfully created route: ${data.name}`,
      });
      reset();
      onRouteCreated?.();
    } catch (error) {
      console.error('Error adding route: ', error);
      toast({
        variant: 'destructive',
        title: 'Creation Error',
        description: 'An error occurred while creating the route. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
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
              placeholder="e.g., 555-123-4567"
              {...register('driverMobile', { required: "Driver's mobile number is required" })}
            />
            {errors.driverMobile && <p className="text-destructive text-sm">{errors.driverMobile.message}</p>}
          </div>
        </div>
      
      <div className="grid gap-4">
        <Label>Stops</Label>
        <ScrollArea className="h-48 pr-4">
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-x-2 gap-y-2 p-3 border rounded-md relative">
                <div className="col-span-12 sm:col-span-6">
                  <Label htmlFor={`stops.${index}.name`} className="text-xs">Stop Name</Label>
                  <Input
                    id={`stops.${index}.name`}
                    placeholder="e.g., Library"
                    {...register(`stops.${index}.name` as const, { required: true })}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <Label htmlFor={`stops.${index}.location`} className="text-xs">Location</Label>
                  <Input
                    id={`stops.${index}.location`}
                    placeholder="e.g., Main Gate"
                    {...register(`stops.${index}.location` as const, { required: true })}
                  />
                </div>
                <div className="col-span-9 sm:col-span-9">
                  <Label htmlFor={`stops.${index}.time`} className="text-xs">Time</Label>
                  <Input
                    id={`stops.${index}.time`}
                    type="time"
                    {...register(`stops.${index}.time` as const, { required: true })}
                  />
                </div>
                <div className="col-span-3 sm:col-span-3 flex items-end">
                    {fields.length > 1 && (
                     <Button type="button" variant="destructive" size="icon" className="h-9 w-9" onClick={() => remove(index)}>
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove Stop</span>
                    </Button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ name: '', location: '', time: '' })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Stop
        </Button>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating Route...' : 'Create Route'}
      </Button>
    </form>
  );
}

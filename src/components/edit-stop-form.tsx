
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { geocodeAddress } from '@/ai/flows/geocode-address';
import { Autocomplete } from '@react-google-maps/api';
import type { Route, Stop } from '@/types';
import { DocumentData } from 'firebase/firestore';

interface EditStopFormValues {
  location: string;
  landmark: string;
  time: string;
}

interface EditStopFormProps {
  student: DocumentData & { stopInfo?: Stop, routeId?: string };
  onStopUpdated: () => void;
  isGoogleMapsLoaded: boolean;
}

export function EditStopForm({ student, onStopUpdated, isGoogleMapsLoaded }: EditStopFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { register, control, handleSubmit, reset, formState: { errors }, setValue } = useForm<EditStopFormValues>({
    defaultValues: {
      location: student.stopInfo?.location || '',
      landmark: student.stopInfo?.landmark || '',
      time: student.stopInfo?.time || '',
    },
  });

  useEffect(() => {
    reset({
      location: student.stopInfo?.location || '',
      landmark: student.stopInfo?.landmark || '',
      time: student.stopInfo?.time || '',
    });
  }, [student, reset]);

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.formatted_address) {
        setValue('location', place.formatted_address, { shouldValidate: true });
      }
    }
  };

  const onSubmit = async (data: EditStopFormValues) => {
    setIsSubmitting(true);
    try {
      if (!student.routeId || !student.stopInfo) {
        throw new Error("Student's route or stop information is missing.");
      }
      if (!data.location) {
        throw new Error("Location is missing.");
      }

      const coordinates = await geocodeAddress({ address: data.location });
      if (!coordinates || coordinates.lat === undefined || coordinates.lng === undefined) {
        throw new Error(`Could not find coordinates for location: "${data.location}". Please enter a valid address.`);
      }

      const routeRef = doc(db, 'routes', student.routeId);
      const routeSnap = await getDoc(routeRef);

      if (!routeSnap.exists()) {
        throw new Error("Route not found.");
      }

      const routeData = routeSnap.data() as Route;
      const stopIndex = routeData.stops.findIndex(stop => stop.id === student.stopInfo?.id);

      if (stopIndex === -1) {
        throw new Error("Stop not found in the route.");
      }
      
      const updatedStops = [...routeData.stops];
      updatedStops[stopIndex] = {
        ...updatedStops[stopIndex],
        location: data.location,
        landmark: data.landmark,
        time: data.time,
        position: coordinates,
      };

      await updateDoc(routeRef, {
        stops: updatedStops
      });

      toast({
        title: 'Stop Updated',
        description: `Successfully updated stop for ${student.fullName}.`,
      });
      onStopUpdated();
    } catch (error) {
      console.error('Error updating stop: ', error);
      toast({
        variant: 'destructive',
        title: 'Update Error',
        description: error instanceof Error ? error.message : 'An error occurred while updating the stop.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 pt-4">
        <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            {isGoogleMapsLoaded ? (
                <Controller
                    name="location"
                    control={control}
                    rules={{ required: 'Location is required' }}
                    render={({ field }) => (
                        <Autocomplete
                            onLoad={onAutocompleteLoad}
                            onPlaceChanged={onPlaceChanged}
                            fields={['formatted_address', 'geometry']}
                        >
                            <Input
                                {...field}
                                id="location"
                                placeholder="e.g., Main Gate, VNRVJIET"
                            />
                        </Autocomplete>
                    )}
                />
            ) : (
                <Input
                    id="location"
                    placeholder="e.g., Main Gate, VNRVJIET"
                    {...register('location' as const, { required: 'Location is required' })}
                />
            )}
            {errors.location && <p className="text-destructive text-sm">{errors.location.message}</p>}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="landmark">Landmark</Label>
                <Input
                id="landmark"
                placeholder="e.g., Near the big tree"
                {...register('landmark', { required: 'Landmark is required' })}
                />
                {errors.landmark && <p className="text-destructive text-sm">{errors.landmark.message}</p>}
            </div>
            <div className="grid gap-2">
                <Label htmlFor="time">Time</Label>
                <Input
                id="time"
                type="time"
                {...register('time', { required: 'Time is required' })}
                />
                 {errors.time && <p className="text-destructive text-sm">{errors.time.message}</p>}
            </div>
        </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Updating Stop...' : 'Update Stop'}
      </Button>
    </form>
  );
}

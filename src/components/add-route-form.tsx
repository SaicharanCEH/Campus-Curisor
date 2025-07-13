
'use client';

import { useState, useRef } from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { X, PlusCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollArea } from './ui/scroll-area';
import { geocodeAddress } from '@/ai/flows/geocode-address';
import { Autocomplete } from '@react-google-maps/api';

interface StopFormValues {
  rollNumber: string;
  studentName: string;
  location: string;
  landmark: string;
  time: string;
}

interface AddRouteFormValues {
  name: string;
  busNumber: string;
  driverName: string;
  driverMobile: string;
  stops: StopFormValues[];
}

interface AddRouteFormProps {
  onRouteCreated?: () => void;
  isGoogleMapsLoaded: boolean;
}

export function AddRouteForm({ onRouteCreated, isGoogleMapsLoaded }: AddRouteFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autocompleteRefs = useRef<google.maps.places.Autocomplete[]>([]);

  const { register, control, handleSubmit, reset, formState: { errors }, setValue } = useForm<AddRouteFormValues>({
    defaultValues: {
      name: '',
      busNumber: '',
      driverName: '',
      driverMobile: '',
      stops: [{ rollNumber: '', studentName: '', location: '', landmark: '', time: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stops',
  });

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete, index: number) => {
    autocompleteRefs.current[index] = autocomplete;
  };

  const onPlaceChanged = (index: number) => {
    const autocomplete = autocompleteRefs.current[index];
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place && place.formatted_address) {
        setValue(`stops.${index}.location`, place.formatted_address);
      }
    }
  };

  const onSubmit = async (data: AddRouteFormValues) => {
    setIsSubmitting(true);
    try {
      const stopsWithPositions = await Promise.all(
        data.stops.map(async (stop) => {
          if (!stop.location) {
            throw new Error(`Location for student "${stop.studentName}" is missing.`);
          }
          const coordinates = await geocodeAddress({ address: stop.location });
          if (!coordinates || coordinates.lat === undefined || coordinates.lng === undefined) {
             throw new Error(`Could not find coordinates for location: "${stop.location}". Please enter a valid address.`);
          }
          return {
            id: `${data.name.replace(/\s+/g, '-').toLowerCase()}-${stop.studentName.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substr(2, 5)}`,
            studentName: stop.studentName,
            rollNumber: stop.rollNumber,
            location: stop.location,
            landmark: stop.landmark,
            time: stop.time,
            position: coordinates,
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
        description: error instanceof Error ? error.message : 'An error occurred while creating the route.',
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
      
      <div className="grid gap-4">
        <Label>Stops</Label>
        <ScrollArea className="h-48 pr-4">
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-x-2 gap-y-4 p-3 border rounded-md relative">
                <div className="col-span-12 sm:col-span-6">
                  <Label htmlFor={`stops.${index}.studentName`} className="text-xs">Student Name</Label>
                  <Input
                    id={`stops.${index}.studentName`}
                    placeholder="e.g., Jane Doe"
                    {...register(`stops.${index}.studentName` as const, { required: true })}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <Label htmlFor={`stops.${index}.rollNumber`} className="text-xs">Roll Number</Label>
                  <Input
                    id={`stops.${index}.rollNumber`}
                    placeholder="e.g., 21B81A0501"
                    {...register(`stops.${index}.rollNumber` as const, { required: true })}
                  />
                </div>
                <div className="col-span-12">
                  <Label htmlFor={`stops.${index}.location`} className="text-xs">Location</Label>
                  {isGoogleMapsLoaded ? (
                     <Controller
                        name={`stops.${index}.location`}
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                           <Autocomplete
                            onLoad={(autocomplete) => onAutocompleteLoad(autocomplete, index)}
                            onPlaceChanged={() => onPlaceChanged(index)}
                          >
                            <Input
                              {...field}
                              id={`stops.${index}.location`}
                              placeholder="e.g., Main Gate, VNRVJIET"
                            />
                           </Autocomplete>
                        )}
                      />
                  ) : (
                     <Input
                      id={`stops.${index}.location`}
                      placeholder="e.g., Main Gate, VNRVJIET"
                      {...register(`stops.${index}.location` as const, { required: true })}
                    />
                  )}
                </div>
                 <div className="col-span-12 sm:col-span-6">
                  <Label htmlFor={`stops.${index}.landmark`} className="text-xs">Landmark (Optional)</Label>
                  <Input
                    id={`stops.${index}.landmark`}
                    placeholder="e.g., Near the big tree"
                    {...register(`stops.${index}.landmark` as const)}
                  />
                </div>
                <div className="col-span-9 sm:col-span-4">
                  <Label htmlFor={`stops.${index}.time`} className="text-xs">Time</Label>
                  <Input
                    id={`stops.${index}.time`}
                    type="time"
                    {...register(`stops.${index}.time` as const, { required: true })}
                  />
                </div>
                <div className="col-span-3 sm:col-span-2 flex items-end">
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
          onClick={() => append({ rollNumber: '', studentName: '', location: '', landmark: '', time: '' })}
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

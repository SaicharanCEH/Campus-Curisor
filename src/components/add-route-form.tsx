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
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';

interface Stop {
  rollNumber: string;
  studentName: string;
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

// Define libraries for Google Maps API
const libraries: ('places' | 'drawing' | 'geometry' | 'localContext' | 'visualization')[] = ['places'];


export function AddRouteForm({ onRouteCreated }: AddRouteFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autocompleteInstances, setAutocompleteInstances] = useState<(google.maps.places.Autocomplete | null)[]>([]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<AddRouteFormValues>({
    defaultValues: {
      name: '',
      busNumber: '',
      driverName: '',
      driverMobile: '',
      stops: [{ rollNumber: '', studentName: '', location: '', time: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stops',
  });
  
  const handleAutocompleteLoad = (index: number, autocomplete: google.maps.places.Autocomplete) => {
    setAutocompleteInstances(prev => {
        const newInstances = [...prev];
        newInstances[index] = autocomplete;
        return newInstances;
    });
  };

  const handlePlaceChanged = (index: number) => {
    const autocomplete = autocompleteInstances[index];
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
             toast({
                variant: 'destructive',
                title: 'Missing Location',
                description: `Please provide a location for student ${stop.studentName}.`,
            });
            throw new Error('Missing location');
          }
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
            id: `${data.name.replace(/\s+/g, '-').toLowerCase()}-${stop.studentName.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substr(2, 5)}`,
            studentName: stop.studentName,
            rollNumber: stop.rollNumber,
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
      if (error instanceof Error && error.message.includes('Missing location')) {
        // Do nothing, toast is already shown
      } else {
        toast({
            variant: 'destructive',
            title: 'Creation Error',
            description: 'An error occurred while creating the route. Please try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

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
                <div className="col-span-12 sm:col-span-6">
                  <Label htmlFor={`stops.${index}.location`} className="text-xs">Location</Label>
                   <Autocomplete
                      onLoad={(autocomplete) => handleAutocompleteLoad(index, autocomplete)}
                      onPlaceChanged={() => handlePlaceChanged(index)}
                    >
                        <Input
                            id={`stops.${index}.location`}
                            placeholder="e.g., Main Gate"
                            {...register(`stops.${index}.location` as const, { required: true })}
                        />
                   </Autocomplete>
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
          onClick={() => append({ rollNumber: '', studentName: '', location: '', time: '' })}
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


'use client';

import { useState, useRef, useCallback } from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { X, PlusCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollArea } from './ui/scroll-area';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';

const libraries: ('places' | 'drawing' | 'geometry' | 'localContext' | 'visualization')[] = ['places'];

interface StopFormValues {
  rollNumber: string;
  studentName: string;
  location: string;
  time: string;
  position: { lat: number; lng: number };
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
}

export function AddRouteForm({ onRouteCreated }: AddRouteFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autocompleteRefs = useRef<google.maps.places.Autocomplete[]>([]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<AddRouteFormValues>({
    defaultValues: {
      name: '',
      busNumber: '',
      driverName: '',
      driverMobile: '',
      stops: [{ rollNumber: '', studentName: '', location: '', time: '', position: { lat: 0, lng: 0 } }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stops',
  });

  const onAutocompleteLoad = (index: number, autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRefs.current[index] = autocomplete;
  };

  const onPlaceChanged = (index: number) => {
    const autocomplete = autocompleteRefs.current[index];
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        setValue(`stops.${index}.location`, place.formatted_address || '', { shouldValidate: true });
        setValue(`stops.${index}.position`, {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        }, { shouldValidate: true });
      }
    }
  };

  const onSubmit = async (data: AddRouteFormValues) => {
    setIsSubmitting(true);
    try {
      const stopsWithPositions = data.stops.map((stop) => {
        if (!stop.position || stop.position.lat === 0 || stop.position.lng === 0) {
          throw new Error(`Location for stop "${stop.location}" is not valid. Please select a location from the suggestions.`);
        }
        return {
          id: `${data.name.replace(/\s+/g, '-').toLowerCase()}-${stop.studentName.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substr(2, 5)}`,
          studentName: stop.studentName,
          rollNumber: stop.rollNumber,
          location: stop.location,
          time: stop.time,
          position: stop.position,
        };
      });

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
  
  if (loadError) return <div>Error loading maps. Please try again.</div>;

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
                  {isLoaded ? (
                    <Controller
                        control={control}
                        name={`stops.${index}.location`}
                        rules={{ required: 'Location is required.' }}
                        render={({ field: { onChange, value } }) => (
                            <Autocomplete
                                onLoad={(autocomplete) => onAutocompleteLoad(index, autocomplete)}
                                onPlaceChanged={() => onPlaceChanged(index)}
                                fields={['formatted_address', 'geometry.location']}
                            >
                                <Input
                                    id={`stops.${index}.location`}
                                    placeholder="e.g., Main Gate, VNRVJIET"
                                    defaultValue={value}
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
          onClick={() => append({ rollNumber: '', studentName: '', location: '', time: '', position: {lat: 0, lng: 0} })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Stop
        </Button>
      </div>

      <Button type="submit" disabled={isSubmitting || !isLoaded}>
        {isSubmitting ? 'Creating Route...' : 'Create Route'}
      </Button>
    </form>
  );
}

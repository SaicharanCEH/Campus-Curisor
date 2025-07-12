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

interface Stop {
  name: string;
  lat: number;
  lng: number;
}

interface AddRouteFormValues {
  name: string;
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
      stops: [{ name: '', lat: 0, lng: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stops',
  });

  const onSubmit = async (data: AddRouteFormValues) => {
    setIsSubmitting(true);
    try {
      const routeData = {
        name: data.name,
        stops: data.stops.map(stop => ({
          id: `${data.name.replace(/\s+/g, '-').toLowerCase()}-${stop.name.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substr(2, 5)}`,
          name: stop.name,
          position: {
            lat: Number(stop.lat),
            lng: Number(stop.lng),
          },
        })),
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
      <div className="grid gap-2">
        <Label htmlFor="name">Route Name</Label>
        <Input
          id="name"
          placeholder="e.g., Campus Express"
          {...register('name', { required: 'Route name is required' })}
        />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>
      
      <div className="grid gap-4">
        <Label>Stops</Label>
        <ScrollArea className="h-64 pr-4">
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-x-2 gap-y-2 p-3 border rounded-md relative">
                <div className="col-span-12 sm:col-span-4">
                  <Label htmlFor={`stops.${index}.name`} className="text-xs">Stop Name</Label>
                  <Input
                    id={`stops.${index}.name`}
                    placeholder="e.g., Library"
                    {...register(`stops.${index}.name` as const, { required: true })}
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <Label htmlFor={`stops.${index}.lat`} className="text-xs">Latitude</Label>
                  <Input
                    id={`stops.${index}.lat`}
                    type="number"
                    step="any"
                    placeholder="17.1966"
                    {...register(`stops.${index}.lat` as const, { required: true, valueAsNumber: true })}
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <Label htmlFor={`stops.${index}.lng`} className="text-xs">Longitude</Label>
                  <Input
                    id={`stops.${index}.lng`}
                    type="number"
                    step="any"
                    placeholder="78.5961"
                    {...register(`stops.${index}.lng` as const, { required: true, valueAsNumber: true })}
                  />
                </div>
                <div className="col-span-12 sm:col-span-2 flex items-end">
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
          onClick={() => append({ name: '', lat: 0, lng: 0 })}
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

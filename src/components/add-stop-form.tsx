
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, updateDoc, arrayUnion, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { geocodeAddress } from '@/ai/flows/geocode-address';
import { Autocomplete } from '@react-google-maps/api';
import { Combobox } from './ui/combobox';
import type { Route } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


interface AddStopFormValues {
  routeId: string;
  rollNumber: string;
  studentName: string;
  location: string;
  landmark: string;
  time: string;
}

interface AddStopFormProps {
  onStopAdded?: () => void;
  isGoogleMapsLoaded: boolean;
  routes: Route[];
}

export function AddStopForm({ onStopAdded, isGoogleMapsLoaded, routes }: AddStopFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState<{ value: string; label: string; fullName: string }[]>([]);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const routeOptions = useMemo(() => {
    return routes.map(route => ({ value: route.id, label: `${route.busNumber} (${route.name})` }))
  }, [routes]);

  const { register, control, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<AddStopFormValues>({
    defaultValues: {
      routeId: '',
      rollNumber: '',
      studentName: '',
      location: '',
      landmark: '',
      time: '',
    },
  });

  useEffect(() => {
    const fetchStudents = async () => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('role', '==', 'student'));
            const querySnapshot = await getDocs(q);
            const studentList = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    value: data.rollNumber.toLowerCase(), // for combobox matching and storing
                    label: data.rollNumber, // for display
                    fullName: data.fullName
                };
            });
            setStudents(studentList);
        } catch (error) {
            console.error("Error fetching students: ", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load student list.',
            });
        }
    };
    fetchStudents();
  }, [toast]);

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete | null) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.formatted_address) {
        setValue(`location`, place.formatted_address);
      }
    }
  };

  const onSubmit = async (data: AddStopFormValues) => {
    setIsSubmitting(true);
    try {
        if (!data.routeId) {
            throw new Error("Please select a route by its bus number.");
        }
        if (!data.rollNumber) {
            throw new Error("Please select a student.");
        }
        if (!data.location) {
            throw new Error("Location is missing.");
        }

        const coordinates = await geocodeAddress({ address: data.location });
        if (!coordinates || coordinates.lat === undefined || coordinates.lng === undefined) {
            throw new Error(`Could not find coordinates for location: "${data.location}". Please enter a valid address.`);
        }

        const newStop = {
            id: `${data.routeId}-${data.rollNumber}-${Math.random().toString(36).substr(2, 5)}`,
            studentName: data.studentName,
            rollNumber: data.rollNumber.toUpperCase(),
            location: data.location,
            landmark: data.landmark,
            time: data.time,
            position: coordinates,
        };

        const routeRef = doc(db, 'routes', data.routeId);
        await updateDoc(routeRef, {
            stops: arrayUnion(newStop)
        });

      toast({
        title: 'Stop Added',
        description: `Successfully added stop for ${data.studentName}.`,
      });
      reset();
      onStopAdded?.();
    } catch (error) {
      console.error('Error adding stop: ', error);
      toast({
        variant: 'destructive',
        title: 'Creation Error',
        description: error instanceof Error ? error.message : 'An error occurred while adding the stop.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 pt-4">
        <div className="grid gap-2">
            <Label htmlFor="routeId">Bus Number</Label>
            <Controller
                name="routeId"
                control={control}
                rules={{ required: 'Please select a bus number' }}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a bus number" />
                        </SelectTrigger>
                        <SelectContent>
                            {routeOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
             {errors.routeId && <p className="text-destructive text-sm">{errors.routeId.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <Label htmlFor={`rollNumber`} className="text-xs">Roll Number</Label>
                <Controller
                    name={`rollNumber`}
                    control={control}
                    rules={{ required: 'Roll number is required' }}
                    render={({ field }) => (
                        <Combobox
                            options={students}
                            placeholder="Select student..."
                            notFoundText="No student found."
                            value={field.value}
                            onChange={(value) => {
                                const selectedStudent = students.find(s => s.value === value);
                                field.onChange(value);
                                setValue(`studentName`, selectedStudent ? selectedStudent.fullName : '');
                            }}
                        />
                    )}
                />
                 {errors.rollNumber && <p className="text-destructive text-sm">{errors.rollNumber.message}</p>}
            </div>
            <div>
                <Label htmlFor={`studentName`} className="text-xs">Student Name</Label>
                <Input
                id={`studentName`}
                placeholder="Student name (auto-filled)"
                {...register(`studentName` as const, { required: 'Student name is required' })}
                readOnly
                className="bg-muted"
                />
            </div>
        </div>

        <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            {isGoogleMapsLoaded ? (
                <Controller
                name="location"
                control={control}
                rules={{ required: 'Location is required' }}
                render={({ field: { onChange, value } }) => (
                    <Autocomplete
                        onLoad={(autocomplete) => onAutocompleteLoad(autocomplete)}
                        onPlaceChanged={onPlaceChanged}
                        fields={['formatted_address', 'geometry']} // Explicitly request fields
                    >
                        <Input
                            id="location"
                            placeholder="e.g., Main Gate, VNRVJIET"
                            onChange={onChange}
                            value={value}
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
                <Label htmlFor="landmark">Landmark (Optional)</Label>
                <Input
                id="landmark"
                placeholder="e.g., Near the big tree"
                {...register('landmark' as const)}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="time">Time</Label>
                <Input
                id="time"
                type="time"
                {...register('time' as const, { required: 'Time is required' })}
                />
                 {errors.time && <p className="text-destructive text-sm">{errors.time.message}</p>}
            </div>
        </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Adding Stop...' : 'Add Stop'}
      </Button>
    </form>
  );
}

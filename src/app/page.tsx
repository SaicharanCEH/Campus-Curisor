
'use client';

import { useEffect, useState } from 'react';
import MapPlaceholder from '@/components/map-placeholder';
import DashboardHeader from '@/components/dashboard-header';
import type { Bus, Route, Stop, BusCapacity } from '@/types';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SignupForm } from '@/components/auth/signup-form';
import { Bus as BusIcon, PlusCircle, View, MapPin } from 'lucide-react';
import { UserTable } from '@/components/user-table';
import { AddRouteForm } from '@/components/add-route-form';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import CruiserSidebar from '@/components/cruiser-sidebar';
import { useJsApiLoader } from '@react-google-maps/api';
import { AddStopForm } from '@/components/add-stop-form';
import { Skeleton } from '@/components/ui/skeleton';
import { deleteRoute } from '@/ai/flows/delete-route';
import { deleteStop } from '@/ai/flows/delete-stop';
import { useToast } from '@/hooks/use-toast';

const libraries: ('places' | 'drawing' | 'geometry' | 'localContext' | 'visualization')[] = ['places'];

interface User {
  fullName: string;
  role: string;
  identifier: string; // Roll number for students, username for admins
}

export default function HomePage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [favoriteStops, setFavoriteStops] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAddStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [isAddRouteDialogOpen, setAddRouteDialogOpen] = useState(false);
  const [isAddStopDialogOpen, setAddStopDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  const fetchAllRoutes = async () => {
    const routesCollection = collection(db, 'routes');
    const routeSnapshot = await getDocs(routesCollection);
    return routeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Route));
  };
  
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      setUser(parsedUser);
      
      fetchAllRoutes().then(allRoutes => {
        
        let routesToDisplay = allRoutes;
        let studentRoute: Route | null = null;
        let studentStop: Stop | null = null;
        
        // Student-specific logic
        if (parsedUser.role === 'student' && parsedUser.identifier) {
          for (const route of allRoutes) {
            const foundStop = route.stops.find(
              stop => stop.rollNumber.toUpperCase() === parsedUser.identifier.toUpperCase()
            );
            if (foundStop) {
              studentRoute = route;
              studentStop = foundStop;
              break;
            }
          }
          // If a student's route is found, only display that route
          if (studentRoute) {
            routesToDisplay = [studentRoute];
          } else {
            // If student is not assigned a route, show nothing.
            routesToDisplay = [];
          }
        }
        
        setRoutes(routesToDisplay);

        // Auto-select logic
        if (studentRoute && studentStop) {
            setSelectedRoute(studentRoute);
            setSelectedStop(studentStop);
        } else if (routesToDisplay.length > 0) {
            // Fallback for admins or if no specific student stop was found
            setSelectedRoute(routesToDisplay[0]);
        }
        
        setIsLoading(false);
      });
    } else {
      router.push('/login');
    }
  }, [router]);


  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const handleStopSelect = (stop: Stop | null) => {
    setSelectedStop(stop);
  };
  
  const handleRouteSelect = (route: Route | null) => {
    setSelectedRoute(route);
    setSelectedStop(null);
  };

  const handleToggleFavorite = (stopId: string) => {
    setFavoriteStops(prev => 
      prev.includes(stopId) ? prev.filter(id => id !== stopId) : [...prev, stopId]
    );
  };

  const onUserCreated = () => {
    setAddStudentDialogOpen(false);
  };

  const onRouteCreated = async () => {
    setAddRouteDialogOpen(false);
    const allRoutes = await fetchAllRoutes();
    setRoutes(allRoutes);
  };

  const onStopAdded = async () => {
    setAddStopDialogOpen(false);
    const allRoutes = await fetchAllRoutes();
    setRoutes(allRoutes);
  };

  const handleDeleteRoute = async (routeId: string) => {
    const result = await deleteRoute(routeId);
    if (result.success) {
      toast({ title: 'Route Deleted', description: 'The route has been successfully removed.' });
      const allRoutes = await fetchAllRoutes();
      setRoutes(allRoutes);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  const handleDeleteStop = async (routeId: string, stopId: string) => {
    const result = await deleteStop({ routeId, stopId });
    if (result.success) {
      toast({ title: 'Stop Deleted', description: 'The stop has been successfully removed.' });
      const allRoutes = await fetchAllRoutes();
      setRoutes(allRoutes);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  const handleCapacityChange = async (routeId: string, capacity: BusCapacity) => {
    const routeRef = doc(db, 'routes', routeId);
    try {
      await updateDoc(routeRef, { capacity });
      setRoutes(prevRoutes => prevRoutes.map(r => r.id === routeId ? { ...r, capacity } : r));
      if (selectedRoute?.id === routeId) {
        setSelectedRoute(prev => prev ? { ...prev, capacity } : null);
      }
      toast({ title: "Capacity Updated", description: `Route capacity set to ${capacity}.`});
    } catch (error) {
      console.error("Error updating capacity:", error);
      toast({ variant: 'destructive', title: 'Error', description: "Failed to update bus capacity." });
    }
  };
  
  const activeBuses = buses
    .filter(bus => bus.routeId === selectedRoute?.id)
    .map(bus => ({ ...bus, capacity: selectedRoute?.capacity }));


  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col">
        <DashboardHeader isAuthenticated={false} onLogout={() => {}} />
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-80 border-r p-4">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-full w-full" />
          </aside>
          <main className="flex-1 p-4">
            <Skeleton className="h-full w-full" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col">
       <DashboardHeader isAuthenticated={!!user} onLogout={handleLogout} />
        <div className="flex flex-1 overflow-hidden">
            <aside className="w-80 border-r overflow-y-auto">
                <CruiserSidebar
                    routes={routes}
                    selectedRoute={selectedRoute}
                    onSelectRoute={handleRouteSelect}
                    selectedStop={selectedStop}
                    onSelectStop={handleStopSelect}
                    favoriteStops={favoriteStops}
                    onToggleFavorite={handleToggleFavorite}
                    onDeleteRoute={handleDeleteRoute}
                    onDeleteStop={handleDeleteStop}
                    onCapacityChange={handleCapacityChange}
                    userRole={user?.role}
                />
            </aside>
            <main className="flex-1 flex flex-col items-center justify-start p-4 gap-4">
                 {user?.role === 'admin' && (
                    <div className="flex gap-4 self-start">
                        <Dialog open={isAddStudentDialogOpen} onOpenChange={setAddStudentDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Student
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                            <DialogTitle>Add a New User</DialogTitle>
                            <DialogDescription>
                                Create a new student or admin account.
                            </DialogDescription>
                            </DialogHeader>
                            <SignupForm onUserCreated={onUserCreated} />
                        </DialogContent>
                        </Dialog>

                        <Dialog open={isAddRouteDialogOpen} onOpenChange={setAddRouteDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                            <BusIcon className="mr-2 h-4 w-4" />
                            Add Route
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                            <DialogTitle>Add a New Bus Route</DialogTitle>
                            <DialogDescription>
                                Define a new route with its name and driver details. Stops can be added later.
                            </DialogDescription>
                            </DialogHeader>
                            <AddRouteForm onRouteCreated={onRouteCreated} />
                        </DialogContent>
                        </Dialog>

                        <Dialog open={isAddStopDialogOpen} onOpenChange={setAddStopDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                            <MapPin className="mr-2 h-4 w-4" />
                             Add Stop
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                            <DialogTitle>Add a New Stop to a Route</DialogTitle>
                            <DialogDescription>
                                Select a route and assign a student stop with location and time.
                            </DialogDescription>
                            </DialogHeader>
                            <AddStopForm 
                                onStopAdded={onStopAdded} 
                                isGoogleMapsLoaded={isLoaded}
                                routes={routes}
                            />
                        </DialogContent>
                        </Dialog>

                        <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                            <View className="mr-2 h-4 w-4" />
                            View Students
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                            <DialogHeader>
                            <DialogTitle>Student Management</DialogTitle>
                            <DialogDescription>
                                View and manage all registered students in the database.
                            </DialogDescription>
                            </DialogHeader>
                            <UserTable />
                        </DialogContent>
                        </Dialog>
                    </div>
                )}
                <div className="w-full h-full">
                    <MapPlaceholder
                        buses={activeBuses}
                        selectedRoute={selectedRoute}
                        onSelectStop={handleStopSelect}
                        isLoaded={isLoaded}
                        loadError={loadError}
                    />
                </div>
            </main>
        </div>
    </div>
  );
}

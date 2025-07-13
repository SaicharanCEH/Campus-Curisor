
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

const DUMMY_BUS_IDS = ['bus-1', 'bus-2', 'bus-3', 'bus-4'];
const SIMULATION_SPEED = 0.0001; // Controls how fast buses move

const libraries: ('places' | 'drawing' | 'geometry' | 'localContext' | 'visualization')[] = ['places'];

export default function HomePage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [favoriteStops, setFavoriteStops] = useState<string[]>([]);
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
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

  const fetchRoutes = async () => {
    const routesCollection = collection(db, 'routes');
    const routeSnapshot = await getDocs(routesCollection);
    const routesList = routeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Route));
    
    setRoutes(routesList);

    const currentSelectedRouteId = selectedRoute?.id;
    if (currentSelectedRouteId) {
      const newSelectedRoute = routesList.find(r => r.id === currentSelectedRouteId) || null;
      setSelectedRoute(newSelectedRoute);
    } else if (routesList.length > 0) {
      setSelectedRoute(routesList[0]);
    } else {
      setSelectedRoute(null);
      setSelectedStop(null);
    }
    return routesList;
  };

  const initializeBuses = (routesData: Route[]) => {
    const initialBuses: Bus[] = [];
    routesData.forEach((route, index) => {
      if (route.stops.length > 0) {
        // Assign a bus ID from the dummy list
        const busId = DUMMY_BUS_IDS[index % DUMMY_BUS_IDS.length];
        initialBuses.push({
          id: busId,
          routeId: route.id,
          position: route.stops[0].position, // Start at the first stop
          currentStopIndex: 0,
        });
      }
    });
    setBuses(initialBuses);
  };
  
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchRoutes().then(routesData => {
        initializeBuses(routesData);
        setIsLoading(false);
      });
    } else {
      router.push('/login');
    }
  }, [router]);
  
  useEffect(() => {
    if (!routes.length || !buses.length) return;

    const interval = setInterval(() => {
      setBuses(currentBuses =>
        currentBuses.map(bus => {
          const route = routes.find(r => r.id === bus.routeId);
          if (!route || route.stops.length === 0) {
            return bus; // Keep bus stationary if route is invalid
          }

          const currentStop = route.stops[bus.currentStopIndex];
          const nextStopIndex = (bus.currentStopIndex + 1) % route.stops.length;
          const nextStop = route.stops[nextStopIndex];

          const dx = nextStop.position.lng - currentStop.position.lng;
          const dy = nextStop.position.lat - currentStop.position.lat;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // If the bus is very close to the next stop, snap to it and update target
          if (distance < SIMULATION_SPEED) {
            return {
              ...bus,
              position: nextStop.position,
              currentStopIndex: nextStopIndex,
            };
          }

          // Otherwise, move towards the next stop
          const newLat = bus.position.lat + (dy / distance) * SIMULATION_SPEED;
          const newLng = bus.position.lng + (dx / distance) * SIMULATION_SPEED;

          return {
            ...bus,
            position: { lat: newLat, lng: newLng },
          };
        })
      );
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [buses, routes]);


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
    const newRoutes = await fetchRoutes();
    initializeBuses(newRoutes);
  };

  const onStopAdded = async () => {
    setAddStopDialogOpen(false);
    const newRoutes = await fetchRoutes();
    initializeBuses(newRoutes);
  };

  const handleDeleteRoute = async (routeId: string) => {
    const result = await deleteRoute(routeId);
    if (result.success) {
      toast({ title: 'Route Deleted', description: 'The route has been successfully removed.' });
      const newRoutes = await fetchRoutes();
      initializeBuses(newRoutes);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  const handleDeleteStop = async (routeId: string, stopId: string) => {
    const result = await deleteStop({ routeId, stopId });
    if (result.success) {
      toast({ title: 'Stop Deleted', description: 'The stop has been successfully removed.' });
      const newRoutes = await fetchRoutes();
      initializeBuses(newRoutes);
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
                    onToggleFavorite={onToggleFavorite}
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

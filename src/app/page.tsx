'use client';

import { useEffect, useState } from 'react';
import MapPlaceholder from '@/components/map-placeholder';
import DashboardHeader from '@/components/dashboard-header';
import type { Bus, Route, Stop } from '@/types';
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
import { BusPlus, PlusCircle, View } from 'lucide-react';
import { UserTable } from '@/components/user-table';
import { AddRouteForm } from '@/components/add-route-form';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DUMMY_BUSES: Bus[] = [
  { id: 'bus-3', routeId: 'route-2', position: { lat: 17.4025, lng: 78.5025 } },
  { id: 'bus-4', routeId: 'route-2', position: { lat: 17.4125, lng: 78.5125 } },
];

export default function HomePage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [isAddStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [isAddRouteDialogOpen, setAddRouteDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    const fetchRoutes = async () => {
      const routesCollection = collection(db, 'routes');
      const routeSnapshot = await getDocs(routesCollection);
      const routesList = routeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Route));
      setRoutes(routesList);
      if (routesList.length > 0) {
        setSelectedRoute(routesList[0]);
      }
    };
    fetchRoutes();
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const handleStopSelect = (stop: Stop) => {
    console.log('Selected stop:', stop);
    alert(`Selected stop: ${stop.name}`);
  };

  const onUserCreated = () => {
    setAddStudentDialogOpen(false);
  };

  const onRouteCreated = async () => {
    setAddRouteDialogOpen(false);
    // Refetch routes
    const routesCollection = collection(db, 'routes');
    const routeSnapshot = await getDocs(routesCollection);
    const routesList = routeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Route));
    setRoutes(routesList);
  };


  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader isAuthenticated={!!user} onLogout={handleLogout} />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-2xl font-bold">Campus Cruiser 🚌</h1>
        {user && (
          <div className="text-center">
            <p className="text-lg">Welcome, {user.fullName}!</p>
            <p className="text-md text-muted-foreground">You are logged in as a {user.role}.</p>
          </div>
        )}
        {user?.role === 'admin' && (
          <div className="flex gap-4">
            <Dialog open={isAddStudentDialogOpen} onOpenChange={setAddStudentDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add User
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
                  <BusPlus className="mr-2 h-4 w-4" />
                  Add Route
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add a New Bus Route</DialogTitle>
                  <DialogDescription>
                    Define a new route with its name and stops.
                  </DialogDescription>
                </DialogHeader>
                <AddRouteForm onRouteCreated={onRouteCreated} />
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <View className="mr-2 h-4 w-4" />
                  View Users
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>User Management</DialogTitle>
                  <DialogDescription>
                    View and manage all registered users in the database.
                  </DialogDescription>
                </DialogHeader>
                <UserTable />
              </DialogContent>
            </Dialog>
          </div>
        )}
        <div className="flex gap-4">
          {routes.map((route) => (
            <button
              key={route.id}
              onClick={() => setSelectedRoute(route)}
              className={`px-4 py-2 rounded ${
                selectedRoute?.id === route.id ? 'bg-primary text-white' : 'bg-gray-200'
              }`}
            >
              {route.name}
            </button>
          ))}
        </div>

      </main>
      <MapPlaceholder
        buses={DUMMY_BUSES.filter(bus => bus.routeId === selectedRoute?.id)}
        selectedRoute={selectedRoute}
        onSelectStop={handleStopSelect}
      />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import MapPlaceholder from '@/components/map-placeholder';
import DashboardHeader from '@/components/dashboard-header';
import type { Bus, Route, Stop } from '@/types';
import { useRouter } from 'next/navigation';

// Dummy stops and routes
const DUMMY_ROUTES: Route[] = [
 {
    id: 'route-2',
    name: 'College Express',
    stops: [
      { id: 'stop-4', name: 'Downtown Station', position: { lat: 17.4000, lng: 78.5000 } },
      { id: 'stop-5', name: 'City Library', position: { lat: 17.4050, lng: 78.5050 } },
      { id: 'stop-6', name: 'Shopping Mall', position: { lat: 17.4100, lng: 78.5100 } },
      { id: 'stop-7', name: 'Residential Area', position: { lat: 17.4150, lng: 78.5150 } },
      { id: 'stop-8', name: 'CVR College of Engineering', position: { lat: 17.1966, lng: 78.5961 } },
    ],
  },
];

const DUMMY_BUSES: Bus[] = [
  { id: 'bus-3', routeId: 'route-2', position: { lat: 17.4025, lng: 78.5025 } },
  { id: 'bus-4', routeId: 'route-2', position: { lat: 17.4125, lng: 78.5125 } },
];


export default function HomePage() {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(DUMMY_ROUTES[0]);
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
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
        <div className="flex gap-4">
          {DUMMY_ROUTES.map((route) => (
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

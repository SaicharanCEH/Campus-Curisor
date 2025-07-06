'use client';

import React, { useState } from 'react';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Route, Stop } from '@/types';
import DashboardHeader from '@/components/dashboard-header';
import MapPlaceholder from '@/components/map-placeholder';
import CruiserSidebar from '@/components/cruiser-sidebar';
import { DUMMY_ROUTES, DUMMY_BUSES } from '@/lib/data';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(DUMMY_ROUTES[0]);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [favoriteStops, setFavoriteStops] = useState<string[]>(['stop-101', 'stop-203']);

  const toggleFavorite = (stopId: string) => {
    setFavoriteStops((prev) =>
      prev.includes(stopId)
        ? prev.filter((id) => id !== stopId)
        : [...prev, stopId]
    );
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full flex-col">
        <DashboardHeader 
          isAuthenticated={isAuthenticated} 
          onLogout={() => setIsAuthenticated(false)} 
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            variant="sidebar"
            collapsible="icon"
            className="w-80 border-r"
          >
            <CruiserSidebar
              routes={DUMMY_ROUTES}
              selectedRoute={selectedRoute}
              onSelectRoute={setSelectedRoute}
              selectedStop={selectedStop}
              onSelectStop={setSelectedStop}
              favoriteStops={favoriteStops}
              onToggleFavorite={toggleFavorite}
            />
          </Sidebar>
          <SidebarInset className="flex-1 overflow-y-auto bg-background">
            <main className="p-4 md:p-6 h-full">
              <MapPlaceholder 
                buses={DUMMY_BUSES}
                selectedRoute={selectedRoute}
                onSelectStop={setSelectedStop}
              />
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}

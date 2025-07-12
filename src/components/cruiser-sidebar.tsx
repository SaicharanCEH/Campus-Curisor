'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bus, Clock, Heart, Map, Star } from 'lucide-react';
import type { Route, Stop } from '@/types';

interface CruiserSidebarProps {
  routes: Route[];
  selectedRoute: Route | null;
  onSelectRoute: (route: Route | null) => void;
  selectedStop: Stop | null;
  onSelectStop: (stop: Stop | null) => void;
  favoriteStops: string[];
  onToggleFavorite: (stopId: string) => void;
}

export default function CruiserSidebar({
  routes,
  selectedRoute,
  onSelectRoute,
  selectedStop,
  onSelectStop,
  favoriteStops,
  onToggleFavorite,
}: CruiserSidebarProps) {
  const allStops = routes.flatMap(route => route.stops);
  const favoritedStopDetails = allStops.filter(stop => favoriteStops.includes(stop.id));

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold font-headline">Routes & Stops</h2>
      </div>
      <Tabs defaultValue="routes" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 m-4">
          <TabsTrigger value="routes"><Map className="w-4 h-4 mr-2" />Routes</TabsTrigger>
          <TabsTrigger value="favorites"><Heart className="w-4 h-4 mr-2" />Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="flex-1 overflow-y-auto px-4">
          <Accordion type="single" collapsible defaultValue={selectedRoute?.id}>
            {routes.map((route) => (
              <AccordionItem value={route.id} key={route.id}>
                <AccordionTrigger onClick={() => onSelectRoute(route)}>
                  <span className="flex items-center">
                    <Bus className="h-4 w-4 mr-2" />
                    {route.name}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {route.stops.map((stop) => (
                      <li key={stop.id}>
                        <Button
                          variant={selectedStop?.id === stop.id ? 'secondary' : 'ghost'}
                          className="w-full justify-start"
                          onClick={() => onSelectStop(stop)}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span>{stop.name}</span>
                            <div
                              role="button"
                              tabIndex={0}
                              className="p-1 rounded hover:bg-muted"
                              onClick={(e) => { e.stopPropagation(); onToggleFavorite(stop.id); }}
                            >
                              <Star className={`h-4 w-4 ${favoriteStops.includes(stop.id) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                            </div>
                          </div>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        <TabsContent value="favorites" className="flex-1 overflow-y-auto px-4">
          {favoritedStopDetails.length > 0 ? (
            <ul className="space-y-2">
              {favoritedStopDetails.map((stop) => (
                <li key={stop.id}>
                  <Button
                    variant={selectedStop?.id === stop.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => onSelectStop(stop)}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span>{stop.name}</span>
                      <div
                        role="button"
                        tabIndex={0}
                        className="p-1 rounded hover:bg-muted"
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(stop.id); }}
                      >
                        <Star className="h-4 w-4 fill-accent text-accent" />
                      </div>
                    </div>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center mt-8">No favorite stops yet. Add some!</p>
          )}
        </TabsContent>
      </Tabs>

      {selectedStop && (
        <div className="p-4 border-t bg-secondary/50">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{selectedStop.name}</span>
                <div
                  role="button"
                  tabIndex={0}
                  className="p-1 rounded hover:bg-muted"
                  onClick={() => onToggleFavorite(selectedStop.id)}
                >
                  <Star className={`h-5 w-5 ${favoriteStops.includes(selectedStop.id) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-lg">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                <span>Next arrival: <span className="font-bold">{selectedStop.eta}</span></span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

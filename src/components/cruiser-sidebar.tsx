
'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bus, Clock, Heart, Map, Star, Pin, Trash2 } from 'lucide-react';
import type { Route, Stop } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


interface CruiserSidebarProps {
  routes: Route[];
  selectedRoute: Route | null;
  onSelectRoute: (route: Route | null) => void;
  selectedStop: Stop | null;
  onSelectStop: (stop: Stop | null) => void;
  favoriteStops: string[];
  onToggleFavorite: (stopId: string) => void;
  onDeleteRoute: (routeId: string) => Promise<void>;
  onDeleteStop: (routeId: string, stopId: string) => Promise<void>;
}

export default function CruiserSidebar({
  routes,
  selectedRoute,
  onSelectRoute,
  selectedStop,
  onSelectStop,
  favoriteStops,
  onToggleFavorite,
  onDeleteRoute,
  onDeleteStop,
}: CruiserSidebarProps) {
  const allStops = routes.flatMap(route => route.stops);
  const favoritedStopDetails = allStops.filter(stop => favoriteStops.includes(stop.id));
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteRouteClick = async (routeId: string) => {
    setIsDeleting(true);
    await onDeleteRoute(routeId);
    setIsDeleting(false);
  }

  const handleDeleteStopClick = async (routeId: string, stopId: string) => {
    setIsDeleting(true);
    await onDeleteStop(routeId, stopId);
    setIsDeleting(false);
  }


  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
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
                <div className="group flex items-center justify-between w-full hover:underline">
                    <AccordionTrigger
                    onClick={() => onSelectRoute(route)}
                    className="flex-1 py-4 font-medium text-left"
                    >
                    <span className="flex items-center">
                        <Bus className="h-4 w-4 mr-2" />
                        {route.name}
                    </span>
                    </AccordionTrigger>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity delete-route-btn"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Route: {route.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the route and all its stops.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={() => handleDeleteRouteClick(route.id)}
                                    disabled={isDeleting}
                                    className="bg-destructive hover:bg-destructive/90"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete Route'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <AccordionContent>
                  <ul className="space-y-1">
                    {route.stops.map((stop) => (
                      <li key={stop.id} className="relative group/item flex items-center">
                        <Button
                          variant={selectedStop?.id === stop.id ? 'secondary' : 'ghost'}
                          className="w-full justify-start text-left h-auto py-2"
                          onClick={() => onSelectStop(stop)}
                        >
                          <div className="flex-1">
                            <div>{stop.studentName}</div>
                            <div className="text-xs text-muted-foreground">{stop.location}</div>
                          </div>
                        </Button>
                        <div className="absolute right-1 flex items-center">
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover/item:opacity-100 transition-opacity delete-stop-btn"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete stop for {stop.studentName}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will remove the stop at {stop.location}. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteStopClick(route.id, stop.id)}
                                      disabled={isDeleting}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      {isDeleting ? 'Deleting...' : 'Delete Stop'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <div
                            role="button"
                            tabIndex={0}
                            className="p-1 rounded hover:bg-muted"
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(stop.id); }}
                          >
                            <Star className={`h-4 w-4 ${favoriteStops.includes(stop.id) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                          </div>
                        </div>
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
                      <span>{stop.studentName}</span>
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
                <span>{selectedStop.studentName}</span>
                <div
                  role="button"
                  tabIndex={0}
                  className="p-1 rounded hover:bg-muted"
                  onClick={() => onToggleFavorite(selectedStop.id)}
                >
                  <Star className={`h-5 w-5 ${favoriteStops.includes(selectedStop.id) ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                </div>
              </CardTitle>
              <CardDescription>{selectedStop.rollNumber}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center text-md">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                <span>Scheduled: <span className="font-semibold">{selectedStop.time}</span></span>
              </div>
              {selectedStop.landmark && (
                 <div className="flex items-center text-md">
                    <Pin className="h-4 w-4 mr-2 text-primary" />
                    <span>Landmark: <span className="font-semibold">{selectedStop.landmark}</span></span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

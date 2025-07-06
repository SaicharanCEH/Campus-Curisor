'use client';

import Image from 'next/image';
import { Bus, MapPin, Wind } from 'lucide-react';
import type { Bus as BusType, Route, Stop } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MapPlaceholderProps {
  buses: BusType[];
  selectedRoute: Route | null;
  onSelectStop: (stop: Stop) => void;
}

export default function MapPlaceholder({
  buses,
  selectedRoute,
  onSelectStop,
}: MapPlaceholderProps) {
  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border shadow-sm">
      <Image
        src="https://placehold.co/1200x800.png"
        alt="Map of campus"
        layout="fill"
        objectFit="cover"
        className="opacity-50"
        data-ai-hint="city map"
      />
      <div className="absolute inset-0 z-10">
        <TooltipProvider>
          {buses.map((bus) => (
            <Tooltip key={bus.id}>
              <TooltipTrigger asChild>
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-in-out"
                  style={{ top: bus.position.top, left: bus.position.left }}
                >
                  <div className={`p-1.5 rounded-full ${selectedRoute?.id === bus.routeId ? 'bg-accent' : 'bg-primary'}`}>
                    <Bus
                      className={`h-6 w-6 ${selectedRoute?.id === bus.routeId ? 'text-accent-foreground' : 'text-primary-foreground'}`}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bus {bus.id}</p>
                <p>Route: {selectedRoute?.name || 'Unknown'}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          {selectedRoute && selectedRoute.stops.map((stop) => (
            <Tooltip key={stop.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSelectStop(stop)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ top: stop.position.top, left: stop.position.left }}
                >
                  <MapPin className="h-8 w-8 text-destructive fill-destructive-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{stop.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}

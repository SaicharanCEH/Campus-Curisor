'use client';

import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useCallback, useRef } from 'react';
import type { Bus as BusType, Route, Stop } from '@/types';

interface MapPlaceholderProps {
  buses: BusType[];
  selectedRoute: Route | null;
  onSelectStop: (stop: Stop) => void;
}

const containerStyle = {
  width: '100%',
  height: '600px',
};

// Center of your campus
const defaultCenter = {
  lat: 17.3871, // Example: Hyderabad coordinates
  lng: 78.4917,
};

export default function MapPlaceholder({
  buses,
  selectedRoute,
  onSelectStop,
}: MapPlaceholderProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  if (!isLoaded) return <p>Loading Map...</p>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={15}
      onLoad={onLoad}
    >
      {/* Bus Markers */}
      {buses.map((bus) => (
        <Marker
          key={bus.id}
          position={bus.position}
          title={`Bus ${bus.id}`}
          icon={{
            url: 'https://img.icons8.com/ios-filled/50/000000/bus.png',
            scaledSize: new window.google.maps.Size(40, 40),
          }}
        />
      ))}

      {/* Stop Markers */}
      {selectedRoute?.stops.map((stop) => (
        <Marker
          key={stop.id}
          position={stop.position}
          onClick={() => onSelectStop(stop)}
          title={stop.name}
          icon={{
            url: 'https://img.icons8.com/ios-filled/50/ff0000/marker.png',
            scaledSize: new window.google.maps.Size(35, 35),
          }}
        />
      ))}
    </GoogleMap>
  );
}

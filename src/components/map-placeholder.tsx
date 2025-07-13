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
  height: '100%',
};

// Center of your campus
const defaultCenter = {
  lat: 17.1966,
  lng: 78.5961,
};

const libraries: ('places' | 'drawing' | 'geometry' | 'localContext' | 'visualization')[] = ['places'];

export default function MapPlaceholder({
  buses,
  selectedRoute,
  onSelectStop,
}: MapPlaceholderProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  if (loadError) {
    return <p>Error loading map</p>
  }

  if (!isLoaded) return <p>Loading Map...</p>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={15}
      onLoad={onLoad}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
      }}
    >
      {/* College Marker */}
      <Marker
        position={defaultCenter}
        title="Campus"
        icon={{
          url: 'https://maps.google.com/mapfiles/kml/shapes/university.png',
          scaledSize: new window.google.maps.Size(40, 40),
        }}
      />
      
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
        stop.position && <Marker
          key={stop.id}
          position={stop.position}
          onClick={() => onSelectStop(stop)}
          title={stop.studentName}
          icon={{
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new window.google.maps.Size(32, 32),
          }}
        />
      ))}
    </GoogleMap>
  );
}

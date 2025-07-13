
'use client';

import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { useCallback, useEffect, useRef } from 'react';
import type { Bus as BusType, Route, Stop } from '@/types';

interface MapPlaceholderProps {
  buses: BusType[];
  selectedRoute: Route | null;
  onSelectStop: (stop: Stop) => void;
  isLoaded: boolean;
  loadError?: Error;
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

const polylineOptions = {
    strokeColor: '#3F51B5', // Deep blue, matching primary color
    strokeOpacity: 0.8,
    strokeWeight: 4,
    fillColor: '#3F51B5',
    fillOpacity: 0.35,
    clickable: false,
    draggable: false,
    editable: false,
    visible: true,
    radius: 30000,
    zIndex: 1,
};


export default function MapPlaceholder({
  buses,
  selectedRoute,
  onSelectStop,
  isLoaded,
  loadError,
}: MapPlaceholderProps) {
  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);
  
  useEffect(() => {
    if (mapRef.current && selectedRoute && selectedRoute.stops.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      selectedRoute.stops.forEach(stop => {
        if(stop.position) {
          bounds.extend(new window.google.maps.LatLng(stop.position.lat, stop.position.lng));
        }
      });
      mapRef.current.fitBounds(bounds);
    }
  }, [selectedRoute]);

  const routePath = selectedRoute?.stops
    .filter(stop => stop.position)
    .map(stop => stop.position);

  if (loadError) {
    return <p>Error loading map. Please check your API key and ensure it is configured correctly.</p>
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
        title="CVR College of Engineering"
        animation={window.google.maps.Animation.BOUNCE}
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
      
      {/* Route Polyline */}
      {routePath && routePath.length > 1 && (
        <Polyline
          path={routePath}
          options={polylineOptions}
        />
      )}
    </GoogleMap>
  );
}

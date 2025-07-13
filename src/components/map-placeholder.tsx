
'use client';

import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { useCallback, useEffect, useRef } from 'react';
import type { Bus as BusType, Route, Stop, BusCapacity } from '@/types';

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

const defaultCenter = {
  lat: 17.1966, 
  lng: 78.5961,
};

const polylineOptions = {
    strokeColor: '#3F51B5',
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

const getBusIconUrl = (capacity?: BusCapacity) => {
    switch (capacity) {
        case 'Low':
            // Green Bus Icon
            return 'https://raw.githubusercontent.com/Concept211/Google-Maps-Markers/master/images/marker_green.png';
        case 'Medium':
            // Orange Bus Icon
            return 'https://raw.githubusercontent.com/Concept211/Google-Maps-Markers/master/images/marker_orange.png';
        case 'Full':
            // Red Bus Icon
            return 'https://raw.githubusercontent.com/Concept211/Google-Maps-Markers/master/images/marker_red.png';
        default:
            // Default Black Bus Icon
            return 'https://raw.githubusercontent.com/Concept211/Google-Maps-Markers/master/images/marker_black.png';
    }
}


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
    if (mapRef.current && selectedRoute && selectedRoute.stops.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      selectedRoute.stops.forEach(stop => {
        if(stop.position) {
          bounds.extend(new window.google.maps.LatLng(stop.position.lat, stop.position.lng));
        }
      });
      // Also include the college marker in the bounds
      bounds.extend(new window.google.maps.LatLng(defaultCenter.lat, defaultCenter.lng));
      mapRef.current.fitBounds(bounds);
    } else if (mapRef.current) {
        mapRef.current.setCenter(defaultCenter);
        mapRef.current.setZoom(15);
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
      <Marker
        position={defaultCenter}
        title="CVR College of Engineering"
        animation={window.google.maps.Animation.BOUNCE}
        icon={{
          url: 'https://maps.google.com/mapfiles/kml/shapes/university.png',
          scaledSize: new window.google.maps.Size(40, 40),
        }}
      />
      
      {buses.map((bus) => (
        <Marker
          key={bus.id}
          position={bus.position}
          title={`Bus ${bus.id} - Capacity: ${bus.capacity || 'N/A'}`}
          icon={{
            url: getBusIconUrl(bus.capacity),
            scaledSize: new window.google.maps.Size(32, 45),
            labelOrigin: new window.google.maps.Point(16, 18)
          }}
          label={{
              text: 'B',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
          }}
        />
      ))}

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
      
      {routePath && routePath.length > 1 && (
        <Polyline
          path={routePath}
          options={polylineOptions}
        />
      )}
    </GoogleMap>
  );
}

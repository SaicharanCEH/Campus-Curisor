
export interface Stop {
  id: string;
  studentName: string;
  rollNumber: string;
  location: string;
  landmark?: string;
  time: string;
  eta?: string;
  position: { lat: number; lng: number };
}

export type BusCapacity = 'Low' | 'Medium' | 'Full';

export interface Route {
  id: string;
  name: string;
  busNumber: string;
  driverName:string;
  driverMobile: string;
  stops: Stop[];
  capacity?: BusCapacity;
}

export interface Bus {
  id: string;
  routeId: string;
  position: { lat: number; lng: number };
  capacity?: BusCapacity;
}

export interface Notification {
    id: string;
    message: string;
    timestamp: string; // Stored as ISO string for client compatibility
}

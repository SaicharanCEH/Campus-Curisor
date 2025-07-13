
export interface Stop {
  id: string;
  studentName: string;
  rollNumber: string;
  location: string;
  time: string;
  eta?: string;
  position: { lat: number; lng: number };
}

export interface Route {
  id: string;
  name: string;
  busNumber: string;
  driverName: string;
  driverMobile: string;
  stops: Stop[];
}

export interface Bus {
  id: string;
  routeId: string;
  position: { lat: number; lng: number };
}

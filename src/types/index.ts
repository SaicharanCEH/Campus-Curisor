export interface Stop {
  id: string;
  name: string;
  location: string;
  time: string;
  position: { lat: number; lng: number };
}

export interface Route {
  id: string;
  name: string;
  stops: Stop[];
}

export interface Bus {
  id: string;
  routeId: string;
  position: { lat: number; lng: number };
}

export interface Stop {
  id: string;
  name: string;
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

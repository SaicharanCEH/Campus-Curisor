export interface Stop {
  id: string;
  name: string;
  position: { top: string; left: string };
  eta: string;
}

export interface Route {
  id: string;
  name: string;
  stops: Stop[];
}

export interface Bus {
  id: string;
  routeId: string;
  position: { top: string; left: string };
}

import type { Route, Bus } from '@/types';

export const DUMMY_ROUTES: Route[] = [
  {
    id: 'route-1',
    name: 'Campus Loop',
    stops: [
      { id: 'stop-101', name: 'Student Union', position: { top: '25%', left: '30%' }, eta: '5 min' },
      { id: 'stop-102', name: 'Library', position: { top: '40%', left: '55%' }, eta: '12 min' },
      { id: 'stop-103', name: 'North Quad', position: { top: '60%', left: '20%' }, eta: '18 min' },
    ],
  },
  {
    id: 'route-2',
    name: 'East-West Connector',
    stops: [
      { id: 'stop-201', name: 'Science Building', position: { top: '70%', left: '75%' }, eta: '3 min' },
      { id: 'stop-202', name: 'Arts Center', position: { top: '50%', left: '80%' }, eta: '9 min' },
      { id: 'stop-203', name: 'Stadium', position: { top: '20%', left: '65%' }, eta: '15 min' },
    ],
  },
  {
    id: 'route-3',
    name: 'Downtown Express',
    stops: [
        { id: 'stop-301', name: 'City Hall', position: { top: '85%', left: '40%' }, eta: '8 min' },
        { id: 'stop-302', name: 'Market Street', position: { top: '15%', left: '10%' }, eta: '20 min' },
    ],
  },
];

export const DUMMY_BUSES: Bus[] = [
    { id: 'bus-01', routeId: 'route-1', position: { top: '30%', left: '40%' } },
    { id: 'bus-02', routeId: 'route-1', position: { top: '50%', left: '30%' } },
    { id: 'bus-03', routeId: 'route-2', position: { top: '60%', left: '80%' } },
    { id: 'bus-04', routeId: 'route-3', position: { top: '5%', left: '5%' } },
];

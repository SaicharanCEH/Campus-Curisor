'use server';
/**
 * @fileOverview A flow to convert a string address into geographic coordinates.
 *
 * - geocodeAddress - A function that takes an address and returns its latitude and longitude.
 * - GeocodeAddressInput - The input type for the geocodeAddress function.
 * - GeocodeAddressOutput - The return type for the geocodeAddress function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import NodeGeocoder from 'node-geocoder';

const GeocodeAddressInputSchema = z.object({
  address: z.string().describe('The address to geocode.'),
});
export type GeocodeAddressInput = z.infer<typeof GeocodeAddressInputSchema>;

const GeocodeAddressOutputSchema = z.object({
  lat: z.number().describe('The latitude of the address.'),
  lng: z.number().describe('The longitude of the address.'),
});
export type GeocodeAddressOutput = z.infer<typeof GeocodeAddressOutputSchema>;

// Configure the geocoder. Using a provider like OpenStreetMap doesn't require an API key.
// In a production app, you might want to use Google Maps Platform or another provider with an API key.
const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
});

const geocodeTool = ai.defineTool(
  {
    name: 'geocodeTool',
    description: 'Get the latitude and longitude for a given address.',
    inputSchema: GeocodeAddressInputSchema,
    outputSchema: GeocodeAddressOutputSchema,
  },
  async ({ address }) => {
    try {
      const res = await geocoder.geocode(address);
      if (res.length > 0 && res[0].latitude && res[0].longitude) {
        return {
          lat: res[0].latitude,
          lng: res[0].longitude,
        };
      }
      throw new Error(`Could not find coordinates for address: ${address}`);
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error(`Geocoding failed for address: ${address}`);
    }
  }
);


export async function geocodeAddress(input: GeocodeAddressInput): Promise<GeocodeAddressOutput> {
  return geocodeAddressFlow(input);
}

const geocodeAddressFlow = ai.defineFlow(
  {
    name: 'geocodeAddressFlow',
    inputSchema: GeocodeAddressInputSchema,
    outputSchema: GeocodeAddressOutputSchema,
    tools: [geocodeTool],
  },
  async (input) => {
    return await geocodeTool(input);
  }
);

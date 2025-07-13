
'use server';
/**
 * @fileOverview A flow to convert a string address into geographic coordinates.
 *
 * - geocodeAddress - A function that takes an address and returns its latitude and longitude.
 * - GeocodeAddressInput - The input type for the geocodeAddress function.
 * - GeocodeAddressOutput - The return type for the geocodeAddress function.
 */
import nodeFetch from 'node-fetch';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import NodeGeocoder from 'node-geocoder';

// Custom fetch to include User-Agent header for Nominatim policy compliance.
const customFetch = (url: RequestInfo, options?: RequestInit): Promise<Response> => {
  const headers = {
    ...options?.headers,
    'User-Agent': 'CampusCruiserApp/1.0 (https://campus-cruiser-app.com)',
  };
  return nodeFetch(url, { ...options, headers });
};

// Ensure global fetch is available for node-geocoder if it isn't already.
if (typeof globalThis.fetch === 'undefined') {
  (globalThis as any).fetch = customFetch;
}

const GeocodeAddressInputSchema = z.object({
  address: z.string().describe('The address to geocode.'),
});
export type GeocodeAddressInput = z.infer<typeof GeocodeAddressInputSchema>;

const GeocodeAddressOutputSchema = z.object({
  lat: z.number().describe('The latitude of the address.'),
  lng: z.number().describe('The longitude of the address.'),
});
export type GeocodeAddressOutput = z.infer<typeof GeocodeAddressOutputSchema>;

// Configure the geocoder.
const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
  fetch: customFetch,
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
      // This is a specific error if no results are found.
      throw new Error(`No coordinates found for address: "${address}". Please try a more specific location.`);
    } catch (error) {
      // This catches errors from the geocoding service itself (e.g., network issues, timeouts).
      const message = error instanceof Error ? error.message : String(error);
      // We check if the message is our specific "No coordinates found" message. If so, we re-throw it as is.
      // Otherwise, we wrap it in a more generic error. This prevents double-wrapping our specific error.
      if (message.startsWith('No coordinates found')) {
        throw error;
      }
      throw new Error(`Geocoding service failed for address: "${address}". Reason: ${message}`);
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
  },
  async (input) => {
    // This flow directly calls the tool since the task is pure geocoding.
    // In a more complex scenario, this flow could call an LLM that *uses* the tool.
    return await geocodeTool(input);
  }
);

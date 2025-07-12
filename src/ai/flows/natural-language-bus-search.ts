// src/ai/flows/natural-language-bus-search.ts
'use server';
/**
 * @fileOverview Implements natural language bus search to find the next bus to a destination.
 *
 * - naturalLanguageBusSearch - A function that processes natural language queries to find bus routes.
 * - NaturalLanguageBusSearchInput - The input type for the naturalLanguageBusSearch function.
 * - NaturalLanguageBusSearchOutput - The return type for the naturalLanguageBusSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NaturalLanguageBusSearchInputSchema = z.object({
  query: z.string().describe('The natural language query to find the next bus to a destination.'),
});
export type NaturalLanguageBusSearchInput = z.infer<
  typeof NaturalLanguageBusSearchInputSchema
>;

const NaturalLanguageBusSearchOutputSchema = z.object({
  busRoute: z.string().describe('The bus route that matches the query.'),
  estimatedArrivalTime: z
    .string()
    .describe('The estimated arrival time of the bus.'),
  confidenceScore: z
    .number()
    .describe(
      'A score between 0 and 1 indicating the confidence level of the search result.'
    ),
  stops: z.array(z.object({
    name: z.string().describe('The name of the bus stop.'),
    eta: z.string().describe('The estimated time of arrival at this stop.'),
  })).optional().describe('A list of stops on the route with their ETAs.'),
});
export type NaturalLanguageBusSearchOutput = z.infer<
  typeof NaturalLanguageBusSearchOutputSchema
>;

export async function naturalLanguageBusSearch(
  input: NaturalLanguageBusSearchInput
): Promise<NaturalLanguageBusSearchOutput> {
  return naturalLanguageBusSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'naturalLanguageBusSearchPrompt',
  input: {schema: NaturalLanguageBusSearchInputSchema},
  output: {schema: NaturalLanguageBusSearchOutputSchema},
  prompt: `You are a helpful assistant that provides bus route information based on natural language queries.

  Given the following query, extract the bus route, estimated arrival time, and a list of stops with their ETAs if available.

  Query: {{{query}}}

  Respond with the bus route, estimated arrival time, a list of stops, and a confidence score (0-1) indicating the accuracy of the match.
  Format your repsonse as a JSON object.
  `,
});

const naturalLanguageBusSearchFlow = ai.defineFlow(
  {
    name: 'naturalLanguageBusSearchFlow',
    inputSchema: NaturalLanguageBusSearchInputSchema,
    outputSchema: NaturalLanguageBusSearchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

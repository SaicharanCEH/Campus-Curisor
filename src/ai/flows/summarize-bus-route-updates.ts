'use server';
/**
 * @fileOverview Summarizes bus route updates and delays for students.
 *
 * - summarizeBusRouteUpdates - A function that summarizes bus route updates.
 * - SummarizeBusRouteUpdatesInput - The input type for the summarizeBusRouteUpdates function.
 * - SummarizeBusRouteUpdatesOutput - The return type for the summarizeBusRouteUpdates function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeBusRouteUpdatesInputSchema = z.object({
  routeUpdates: z.string().describe('A detailed description of bus route changes, delays, and other relevant information.'),
});
export type SummarizeBusRouteUpdatesInput = z.infer<typeof SummarizeBusRouteUpdatesInputSchema>;

const SummarizeBusRouteUpdatesOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the bus route updates.'),
});
export type SummarizeBusRouteUpdatesOutput = z.infer<typeof SummarizeBusRouteUpdatesOutputSchema>;

export async function summarizeBusRouteUpdates(input: SummarizeBusRouteUpdatesInput): Promise<SummarizeBusRouteUpdatesOutput> {
  return summarizeBusRouteUpdatesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeBusRouteUpdatesPrompt',
  input: {schema: SummarizeBusRouteUpdatesInputSchema},
  output: {schema: SummarizeBusRouteUpdatesOutputSchema},
  prompt: `You are a helpful assistant that summarizes bus route updates for college students.\n\nGiven the following information about bus route changes and delays, provide a concise summary that students can quickly understand. Focus on key details such as route numbers, affected stops, estimated delays, and alternative options.\n\nRoute Updates: {{{routeUpdates}}}`,
});

const summarizeBusRouteUpdatesFlow = ai.defineFlow(
  {
    name: 'summarizeBusRouteUpdatesFlow',
    inputSchema: SummarizeBusRouteUpdatesInputSchema,
    outputSchema: SummarizeBusRouteUpdatesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

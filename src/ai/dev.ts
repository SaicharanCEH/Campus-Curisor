
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-bus-route-updates.ts';
import '@/ai/flows/natural-language-bus-search.ts';
import '@/ai/flows/send-welcome-email.ts';
import '@/ai/flows/geocode-address.ts';
import '@/ai/flows/delete-all-students.ts';

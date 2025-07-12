'use server';
/**
 * @fileOverview A flow to send a welcome email to new users.
 *
 * - sendWelcomeEmail - A function that handles sending the welcome email.
 * - WelcomeEmailInput - The input type for the sendWelcomeEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { sendMail } from '@/lib/mail';

const WelcomeEmailInputSchema = z.object({
  fullName: z.string().describe('The full name of the new user.'),
  email: z.string().email().describe('The email address of the new user.'),
  identifier: z.string().describe('The roll number or username for the new user.'),
  password: z.string().describe('The auto-generated password for the new user.'),
  role: z.string().describe('The role assigned to the new user (student or admin).'),
  busNumber: z.string().optional().describe('The assigned bus number for the student.'),
  pickupLocation: z.string().optional().describe('The pickup location for the student.'),
  pickupTime: z.string().optional().describe('The pickup time for the student.'),
});
export type WelcomeEmailInput = z.infer<typeof WelcomeEmailInputSchema>;

const EmailContentOutputSchema = z.object({
    subject: z.string().describe('The subject of the email.'),
    body: z.string().describe('The HTML body of the email.'),
});

const emailPrompt = ai.definePrompt({
    name: 'welcomeEmailPrompt',
    input: { schema: WelcomeEmailInputSchema.extend({ isStudent: z.boolean() }) },
    output: { schema: EmailContentOutputSchema },
    prompt: `You are an assistant responsible for creating welcome emails for new users of the Campus Cruiser app.
Generate a friendly and welcoming email to the user with their login credentials.
The subject of the email should be "Welcome to Campus Cruiser!".
The body should be formatted in HTML with a professional and clean look, including a title, a warm welcome message, and the user's login details.

{{#if isStudent}}
Include the student's bus details in the email body.
{{/if}}

Here is the user's information:
- Name: {{fullName}}
- Email: {{email}}
- Login Identifier ({{#if isStudent}}Roll Number{{else}}Username{{/if}}): {{identifier}}
- Password: {{password}}
- Role: {{role}}

{{#if isStudent}}
Bus Details:
- Bus Number: {{busNumber}}
- Pickup Location: {{pickupLocation}}
- Pickup Time: {{pickupTime}}
{{/if}}

Generate the subject and the HTML body for the email.
`,
});

export async function sendWelcomeEmail(input: WelcomeEmailInput): Promise<{ success: boolean }> {
    try {
        // Step 1: Generate the email content using the AI prompt.
        const { output } = await emailPrompt({
            ...input,
            isStudent: input.role === 'student',
        });

        if (!output || !output.subject || !output.body) {
            console.error("Failed to generate email content from prompt.");
            return { success: false };
        }

        // Step 2: Send the generated email content using the mail service.
        await sendMail({
            to: input.email,
            subject: output.subject,
            html: output.body,
        });

        return { success: true };
    } catch (error) {
        console.error("sendWelcomeEmail flow failed:", error);
        return { success: false };
    }
}

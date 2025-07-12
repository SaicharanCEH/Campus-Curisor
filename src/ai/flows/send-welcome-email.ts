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

const sendEmailTool = ai.defineTool(
  {
    name: 'sendEmail',
    description: 'Sends an email to a specified recipient with their login credentials.',
    inputSchema: z.object({
      to: z.string().email().describe('The email address of the recipient.'),
      subject: z.string().describe('The subject of the email.'),
      body: z.string().describe('The HTML body of the email.'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
    }),
  },
  async (input) => {
    const success = await sendMail({
      to: input.to,
      subject: input.subject,
      html: input.body,
    });
    return { success };
  }
);


const emailPrompt = ai.definePrompt({
    name: 'welcomeEmailPrompt',
    tools: [sendEmailTool],
    input: { schema: WelcomeEmailInputSchema.extend({ isStudent: z.boolean(), isAdmin: z.boolean() }) },
    prompt: `You are an assistant responsible for creating and sending welcome emails for new users of the Campus Cruiser app.
A new {{role}} account has been created.
First, generate a friendly and welcoming email to the user with their login credentials. The subject of the email should be "Welcome to Campus Cruiser!". The body should be formatted in HTML with a professional and clean look.
Then, use the sendEmail tool to send this email to the user.

{{#if isStudent}}
Include the student's bus details in the email body.
{{/if}}

Here is the user's information:
- Name: {{fullName}}
- Email: {{email}}
- Login Identifier ({{#if isStudent}}Roll Number{{/if}}{{#if isAdmin}}Username{{/if}}): {{identifier}}
- Password: {{password}}

{{#if isStudent}}
Bus Details:
- Bus Number: {{busNumber}}
- Pickup Location: {{pickupLocation}}
- Pickup Time: {{pickupTime}}
{{/if}}
`,
});

export async function sendWelcomeEmail(input: WelcomeEmailInput): Promise<{ success: boolean }> {
    const {output} = await emailPrompt({
        ...input,
        isStudent: input.role === 'student',
        isAdmin: input.role === 'admin',
    });

    if (!output) {
      return { success: false };
    }
    
    // The tool call is now handled by the LLM, so we check the tool output
    const toolOutput = output.toolCalls[0]?.output;
    if (toolOutput?.success) {
      return { success: true };
    }
    
    return { success: false };
}

'use server';
/**
 * @fileOverview A flow to send a welcome email to new users.
 *
 * - sendWelcomeEmail - A function that handles sending the welcome email.
 * - WelcomeEmailInput - The input type for the sendWelcomeEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

// Placeholder tool for sending an email.
// In a real application, this would use a service like Nodemailer or a third-party API.
const sendEmailTool = ai.defineTool(
  {
    name: 'sendEmail',
    description: 'Sends an email to a specified recipient.',
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
    console.log(`Email Tool: Sending email to ${input.to}`);
    console.log(`Subject: ${input.subject}`);
    // In a real implementation, you would have your email sending logic here.
    // For this example, we'll just simulate a successful response.
    return { success: true };
  }
);


const emailPrompt = ai.definePrompt({
    name: 'welcomeEmailPrompt',
    input: { schema: WelcomeEmailInputSchema },
    tools: [sendEmailTool],
    prompt: `You are an assistant responsible for sending welcome emails to new users of the Campus Cruiser app.
A new {{role}} account has been created.
Generate a friendly and welcoming email to the user with their login credentials.
If the user is a student, include their bus details.

Here is the user's information:
- Name: {{fullName}}
- Email: {{email}}
- Login Identifier ({{#if (eq role 'student')}}Roll Number{{else}}Username{{/if}}): {{identifier}}
- Password: {{password}}

{{#if (eq role 'student')}}
Bus Details:
- Bus Number: {{busNumber}}
- Pickup Location: {{pickupLocation}}
- Pickup Time: {{pickupTime}}
{{/if}}

Use the sendEmail tool to send the email to the user's email address. The subject of the email should be "Welcome to Campus Cruiser!".
The body should be formatted in HTML with a professional and clean look.
`,
});


export async function sendWelcomeEmail(input: WelcomeEmailInput) {
    const {output} = await emailPrompt(input);
    return output;
}

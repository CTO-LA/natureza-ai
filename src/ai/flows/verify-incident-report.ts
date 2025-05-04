'use server';

/**
 * @fileOverview An AI agent for verifying incident reports and assigning a verification level.
 *
 * - verifyIncidentReport - A function that handles the incident report verification process.
 * - VerifyIncidentReportInput - The input type for the verifyIncidentReport function.
 * - VerifyIncidentReportOutput - The return type for the verifyIncidentReport function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {IncidentReport} from '@/packages/shared/types';

const VerifyIncidentReportInputSchema = z.object({
  report: z.object({
    zoneId: z.string().describe('The Uber H3 hexagon ID of the incident.'),
    message: z.string().describe('The description of the incident.'),
    mediaUrl: z.string().optional().describe('Optional URL for associated media.'),
    timestamp: z.string().describe('ISO 8601 timestamp of the incident.'),
    reporterType: z
      .enum(['citizen', 'sensor', 'verified_partner'])
      .optional()
      .describe('Type of the reporter.'),
  }).describe('The incident report to verify.'),
});
export type VerifyIncidentReportInput = z.infer<typeof VerifyIncidentReportInputSchema>;

const VerifyIncidentReportOutputSchema = z.object({
  verificationLevel: z.enum(['low', 'medium', 'high']).describe('The verification level assigned to the incident report.'),
  reason: z.string().describe('The reason for the assigned verification level.'),
});
export type VerifyIncidentReportOutput = z.infer<typeof VerifyIncidentReportOutputSchema>;

export async function verifyIncidentReport(input: VerifyIncidentReportInput): Promise<VerifyIncidentReportOutput> {
  return verifyIncidentReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyIncidentReportPrompt',
  input: {
    schema: z.object({
      report: z.object({
        zoneId: z.string().describe('The Uber H3 hexagon ID of the incident.'),
        message: z.string().describe('The description of the incident.'),
        mediaUrl: z.string().optional().describe('Optional URL for associated media.'),
        timestamp: z.string().describe('ISO 8601 timestamp of the incident.'),
        reporterType: z
          .enum(['citizen', 'sensor', 'verified_partner'])
          .optional()
          .describe('Type of the reporter.'),
      }).describe('The incident report to verify.'),
    }),
  },
  output: {
    schema: z.object({
      verificationLevel: z
        .enum(['low', 'medium', 'high'])
        .describe('The verification level assigned to the incident report.'),
      reason: z.string().describe('The reason for the assigned verification level.'),
    }),
  },
  prompt: `You are an AI assistant specializing in verifying incident reports for the Natureza AI platform. Analyze the incident report below and determine a verification level (low, medium, or high) based on the content and source.

Report Details:
Zone ID: {{{report.zoneId}}}
Message: {{{report.message}}}
Media URL: {{#if report.mediaUrl}}{{{report.mediaUrl}}}{{else}}N/A{{/if}}
Timestamp: {{{report.timestamp}}}
Reporter Type: {{#if report.reporterType}}{{{report.reporterType}}}{{else}}Unknown{{/if}}

Consider the following factors when determining the verification level:
- Clarity and detail of the message
- Reliability of the reporter type (e.g., verified partners are more reliable than anonymous citizens)
- Availability of supporting media (media can increase the verification level)

Respond with a JSON object containing the verificationLevel and a brief reason for the assigned level.
`,
});

const verifyIncidentReportFlow = ai.defineFlow<
  typeof VerifyIncidentReportInputSchema,
  typeof VerifyIncidentReportOutputSchema
>({
  name: 'verifyIncidentReportFlow',
  inputSchema: VerifyIncidentReportInputSchema,
  outputSchema: VerifyIncidentReportOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});


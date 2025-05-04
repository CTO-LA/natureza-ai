'use server';
/**
 * @fileOverview An AI agent for handling incident reporting via chat.
 *
 * - incidentChatFlow - A function that handles the chat interaction for reporting incidents.
 * - IncidentChatInput - The input type for the incidentChatFlow function.
 * - IncidentChatOutput - The return type for the incidentChatFlow function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import * as h3 from 'h3-js';

// Define the structure for a single chat message
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const IncidentChatInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The chat history so far.'),
  message: z.string().describe('The latest user message.'),
});
export type IncidentChatInput = z.infer<typeof IncidentChatInputSchema>;

const IncidentChatOutputSchema = z.object({
  response: z.string().describe('The AI model\'s response message.'),
  // Optional: Add fields to indicate if zoneId and description are collected
  zoneId: z.string().optional().describe('Extracted H3 Zone ID (if identified).'),
  description: z.string().optional().describe('Extracted incident description (if identified).'),
  isComplete: z.boolean().optional().describe('Indicates if the AI believes it has collected all necessary information.')
});
export type IncidentChatOutput = z.infer<typeof IncidentChatOutputSchema>;

// Define a tool for verifying H3 index (optional but good practice)
const verifyH3Index = ai.defineTool(
  {
    name: 'verifyH3Index',
    description: 'Verifies if a given string is a valid H3 cell index (specifically resolution 2).',
    inputSchema: z.object({
      h3Index: z.string().describe('The H3 index string to verify.'),
    }),
    outputSchema: z.object({
      isValid: z.boolean(),
      resolution: z.number().optional(),
    }),
  },
  async ({ h3Index }) => {
    const isValid = h3.isValidCell(h3Index);
    let resolution: number | undefined = undefined;
    if (isValid) {
      try {
        resolution = h3.getResolution(h3Index);
      } catch (e) {
        // Ignore errors if resolution cannot be determined
      }
    }
    return { isValid, resolution };
  }
);


export async function processChat(input: IncidentChatInput): Promise<IncidentChatOutput> {
  return incidentChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'incidentChatPrompt',
  input: { schema: IncidentChatInputSchema },
  output: { schema: IncidentChatOutputSchema },
  tools: [verifyH3Index], // Make the tool available
  prompt: `You are an AI assistant for Natureza AI, helping users report environmental incidents.
Engage in a natural conversation to collect the following information:
1.  **Incident Location:** Ask for the location. If the user provides coordinates or a place name, guide them towards providing or confirming the Uber H3 Zone ID (specifically resolution 2). You can use the verifyH3Index tool to check if a provided ID is valid and if it's resolution 2. If it's valid but not resolution 2, gently ask if they can provide the resolution 2 ID. If invalid, inform them and ask again.
2.  **Incident Description:** Ask the user to describe what happened.

Keep the conversation friendly and helpful.

**Conversation History:**
{{#each history}}
{{role}}: {{{content}}}
{{/each}}

**Latest User Message:**
user: {{{message}}}

**Your Task:**
Respond to the user's latest message. Ask clarifying questions if needed to get the Zone ID (resolution 2) and description. Use the verifyH3Index tool when the user provides something that looks like an H3 index.

Once you believe you have a valid resolution 2 H3 Zone ID AND a description:
1. Summarize the collected information (Zone ID and Description).
2. Ask the user to confirm if the summary is correct.
3. If confirmed, set 'isComplete' to true in your response object and inform the user that the report is ready to be submitted (but don't actually submit it).
4. If not confirmed, ask the user what needs to be corrected.

Structure your output ONLY as a JSON object matching the IncidentChatOutput schema, including the 'response' field and optionally 'zoneId', 'description', and 'isComplete' based on the conversation state.`,
});

const incidentChatFlow = ai.defineFlow<
  typeof IncidentChatInputSchema,
  typeof IncidentChatOutputSchema
>(
  {
    name: 'incidentChatFlow',
    inputSchema: IncidentChatInputSchema,
    outputSchema: IncidentChatOutputSchema,
  },
  async (input) => {
    // Construct the full prompt history for the model
    const promptMessages = [
        ...input.history.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user' as const, content: input.message },
    ];

    const result = await ai.generate({
        model: ai.model, // Use the default model configured in ai-instance
        prompt: promptMessages,
        output: { schema: IncidentChatOutputSchema, format: 'json' },
        tools: [verifyH3Index],
        toolChoice: 'auto', // Let the model decide when to use the tool
    });


    let response = result.output;

    // If the model generated tool requests, handle them
    if (result.requests?.length) {
        // For this simple case, we assume only one tool request at a time
        const request = result.requests[0];
        if (request.toolName === 'verifyH3Index') {
            const toolResponse = await verifyH3Index(request.input);

            // Send the tool response back to the model to continue generation
            const followUpResult = await ai.generate({
                model: ai.model,
                prompt: [
                    ...promptMessages,
                    { role: 'model', content: result.content }, // Include the model's previous partial content if any
                    { role: 'tool', content: { output: toolResponse }, toolName: 'verifyH3Index' }
                ],
                 output: { schema: IncidentChatOutputSchema, format: 'json' },
                tools: [verifyH3Index],
                // No toolChoice needed here, we expect a text response now
            });
            response = followUpResult.output;
        }
    }


    if (!response) {
      // Fallback response if generation fails or returns nothing
      return { response: "Sorry, I encountered an issue. Could you please repeat that?" };
    }

    // Ensure the response structure is correct, even if the model fails slightly
    return {
        response: response.response || "I'm not sure how to respond to that. Could you clarify?",
        zoneId: response.zoneId,
        description: response.description,
        isComplete: response.isComplete || false,
    };
  }
);

// Define a function to submit the final report (can be called from the chat interface later)
// This is similar to the logic previously in the API route
export async function submitCollectedIncident(zoneId: string, message: string): Promise<{ status: string; message: string }> {
    'use server';
    // You might want to re-integrate AI verification here if needed
    // For now, just log and return success
    console.log('Submitting collected incident:', { zoneId, message, timestamp: new Date().toISOString() });

    // TODO: Add actual data persistence logic here (e.g., save to Firestore)

    return { status: 'success', message: 'Incident report submitted successfully!' };
}

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
import type { Part } from 'genkit'; // Import Part type

// Define the structure for a single chat message (used internally in the component)
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Define the structure for the flow input, containing history and the new message
const IncidentChatInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The chat history so far.'),
  message: z.string().describe('The latest user message.'),
});
export type IncidentChatInput = z.infer<typeof IncidentChatInputSchema>;

// Define the structure for the flow output
const IncidentChatOutputSchema = z.object({
  response: z.string().describe('The AI model\'s response message.'),
  // Optional: Add fields to indicate if zoneId and description are collected
  zoneId: z.string().optional().describe('Extracted H3 Zone ID (if identified).'),
  description: z.string().optional().describe('Extracted incident description (if identified).'),
  isComplete: z.boolean().optional().describe('Indicates if the AI believes it has collected all necessary information.')
});
export type IncidentChatOutput = z.infer<typeof IncidentChatOutputSchema>;

// Define a tool for verifying H3 index
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
    // Forcing resolution 2 check
    return { isValid: isValid && resolution === 2, resolution };
  }
);


export async function processChat(input: IncidentChatInput): Promise<IncidentChatOutput> {
  return incidentChatFlow(input);
}

// Note: The ai.definePrompt is not directly used by ai.generate with a history array,
// but it helps document the expected input/output and can be used for single-turn scenarios.
// The system prompt logic is embedded in the flow's initial message construction.
const promptDefinition = ai.definePrompt({
  name: 'incidentChatPrompt',
  input: { schema: IncidentChatInputSchema },
  output: { schema: IncidentChatOutputSchema },
  tools: [verifyH3Index], // Make the tool available
  prompt: `You are an AI assistant for Natureza AI, helping users report environmental incidents.
Engage in a natural conversation to collect the following information:
1.  **Incident Location:** Ask for the location. Guide the user towards providing or confirming the Uber H3 Zone ID (specifically resolution 2). Use the verifyH3Index tool to check if a provided ID is valid and if it's resolution 2. If it's valid but not resolution 2, ask for the resolution 2 ID. If invalid, inform them and ask again.
2.  **Incident Description:** Ask the user to describe what happened.

Keep the conversation friendly and helpful. Use the verifyH3Index tool when the user provides something that looks like an H3 index.

Once you believe you have a valid resolution 2 H3 Zone ID AND a description:
1. Summarize the collected information (Zone ID and Description).
2. Ask the user to confirm if the summary is correct.
3. If confirmed, set 'isComplete' to true and inform the user the report is ready.
4. If not confirmed, ask what needs correction.

Structure your output ONLY as a JSON object matching the IncidentChatOutput schema.

**Conversation History:**
{{#each history}}
{{role}}: {{{content}}}
{{/each}}

**Latest User Message:**
user: {{{message}}}

**Your Task:**
Respond to the user's latest message based on the history and instructions above.`,
});


// Define the flow
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

    // Convert ChatMessage history to the format expected by ai.generate (Array<Part>)
    const promptMessages: Part[] = [
      // System/Initial prompt part (optional, but good practice)
      // { role: 'system', content: [{ text: "You are..." }] }, // If needed

      // Map history messages
      ...input.history.map(msg => ({
          role: msg.role,
          content: [{ text: msg.content }] // Wrap content in array with text part
      })),
      // Add the latest user message
      { role: 'user' as const, content: [{ text: input.message }] } // Wrap content
    ];

    const result = await ai.generate({
        model: ai.model, // Use the default model configured in ai-instance
        prompt: promptMessages,
        output: { schema: IncidentChatOutputSchema, format: 'json' },
        tools: [verifyH3Index],
        toolChoice: 'auto',
    });


    let response = result.output;
    let currentContent = result.content || []; // Initialize with existing content if any

    // Handle tool requests if any
    if (result.requests?.length) {
        const toolResponses: Part[] = [];
        for (const request of result.requests) {
             if (request.toolName === 'verifyH3Index') {
                const toolResponseData = await verifyH3Index(request.input);
                toolResponses.push({ role: 'tool', content: [{ output: toolResponseData, toolName: 'verifyH3Index' }] });
             }
        }


        // Send the tool responses back to the model to continue generation
        const followUpResult = await ai.generate({
            model: ai.model,
            prompt: [
                ...promptMessages,
                ...currentContent, // Include the model's previous partial content if any
                ...toolResponses // Add the results from the tool calls
            ],
             output: { schema: IncidentChatOutputSchema, format: 'json' },
            tools: [verifyH3Index],
            // No toolChoice needed here, we expect a text response now
        });
        response = followUpResult.output;
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
export async function submitCollectedIncident(zoneId: string, message: string): Promise<{ status: string; message: string }> {
    'use server';
    // You might want to re-integrate AI verification here if needed
    // For now, just log and return success
    console.log('Submitting collected incident:', { zoneId, message, timestamp: new Date().toISOString() });

    // TODO: Add actual data persistence logic here (e.g., save to Firestore)

    return { status: 'success', message: 'Incident report submitted successfully!' };
}

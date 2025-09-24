'use server';

/**
 * @fileOverview An AI-powered TV group assignment flow.
 *
 * - suggestTvGroupAssignment - A function that suggests TV group assignments based on TV name.
 * - SuggestTvGroupAssignmentInput - The input type for the suggestTvGroupAssignment function.
 * - SuggestTvGroupAssignmentOutput - The return type for the suggestTvGroupAssignment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTvGroupAssignmentInputSchema = z.object({
  tvName: z
    .string()
    .describe('The user-friendly name of the TV (e.g., \'Lobby TV\').'),
  existingGroupNames: z
    .array(z.string())
    .describe('The list of names of existing groups.'),
});
export type SuggestTvGroupAssignmentInput = z.infer<
  typeof SuggestTvGroupAssignmentInputSchema
>;

const SuggestTvGroupAssignmentOutputSchema = z.object({
  suggestedGroupName: z
    .string()
    .describe(
      'The name of the group the TV should be assigned to, based on its name.'
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'A number from 0 to 1 indicating the confidence level of the suggestion.'
    ),
});
export type SuggestTvGroupAssignmentOutput = z.infer<
  typeof SuggestTvGroupAssignmentOutputSchema
>;

export async function suggestTvGroupAssignment(
  input: SuggestTvGroupAssignmentInput
): Promise<SuggestTvGroupAssignmentOutput> {
  return suggestTvGroupAssignmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTvGroupAssignmentPrompt',
  input: {schema: SuggestTvGroupAssignmentInputSchema},
  output: {schema: SuggestTvGroupAssignmentOutputSchema},
  prompt: `You are an expert system for automatically assigning TVs to groups in a digital signage system.

You are given the name of a TV and a list of existing group names. Your task is to suggest the most appropriate group for the TV based on its name.

Existing Group Names:
{{#each existingGroupNames}}- {{this}}\n{{/each}}

TV Name: {{{tvName}}}

Consider the TV name and existing group names to infer the best group assignment.
If no group name seems appropriate, return an existing group name instead of creating a new group. Only return an existing group name.
Return a high confidence score if there is high correlation between the TV name and group name, and low confidence if there isn't.
`,
});

const suggestTvGroupAssignmentFlow = ai.defineFlow(
  {
    name: 'suggestTvGroupAssignmentFlow',
    inputSchema: SuggestTvGroupAssignmentInputSchema,
    outputSchema: SuggestTvGroupAssignmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

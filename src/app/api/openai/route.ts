import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import z from 'zod';

export const maxDuration = 30;
const stepsSchema = z.array(z.string());

export async function POST(req: Request) {
    try {
        const requestData = await req.json();
        
        // Handle both old format (direct string) and new format (object with analysis and extraInfo)
        let analysis: string;
        let extraInfo: string = '';
        
        if (typeof requestData === 'string') {
            // Old format - just the analysis text
            analysis = requestData;
        } else {
            // New format - object with analysis and extraInfo
            analysis = requestData.analysis || requestData;
            extraInfo = requestData.extraInfo || '';
        }

        // Build the prompt with extra info if provided
        let prompt = `Generate steps for a workflow for a browser agent to execute based on this video analysis: ${analysis}`;
        
        if (extraInfo) {
            prompt += `\n\nAdditional context and requirements: ${extraInfo}`;
        }

        console.log('prompt', prompt);

        const result = await generateObject({
            model: openai('gpt-4o'),
            output: 'array',
            schema: stepsSchema,
            prompt: prompt,
            system: `
            You are a helpful assistant that generates clear, actionable browser automation steps. 
            Take into account any additional context or requirements provided by the user to make the workflow more accurate and useful. 
            Select the google account: Hiresh Bremanand.

            Clear base actions:
            - Clicking elements (such as buttons and links)
            - Filling out and submitting forms
            - Hovering over items
            - Pressing keyboard keys like Enter and Tab
            - Navigating to specific URLs
            - Moving back or forward in browser history
            - Scrolling pages
            - Extracting structured data
            - Grabbing text from page elements
            - Executing mouse movements such as drag-and-drop
            - Handling file uploads and downloads
            - Waiting for page changes

            Example steps:
            - Go to https://quotes.toscrape.com/
            - Use extract_structured_data action with the query "first 3 quotes with their authors"
            - Save results to quotes.csv using write_file action
            - Do a google search for the first quote and find when it was written

            Note: Video analysis is not always accurate, so you may need to adjust the steps based on the context of the video. Predict what the user is trying to do when they are doing a manual repetitive task and generate the steps accordingly.
            `,
        });

        return new Response(JSON.stringify(result.object), {
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Error in OpenAI route:', error);
        return new Response(
            JSON.stringify({ 
                error: "Failed to generate steps", 
                details: error instanceof Error ? error.message : 'Unknown error' 
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
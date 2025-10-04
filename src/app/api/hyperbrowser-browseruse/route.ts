import { Hyperbrowser } from "@hyperbrowser/sdk";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // Parse JSON body
    const { task, steps } = await req.json();
    console.log('Hyperbrowser Browser Use task:', task);
    console.log('Hyperbrowser Browser Use steps:', steps);

    // Validate input - accept either a task string or steps array
    if (!task && (!Array.isArray(steps) || steps.length === 0)) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input. Expected either a 'task' string or 'steps' array." 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // If steps are provided, validate they are strings
    if (steps && !steps.every((step: any) => typeof step === 'string')) {
      return new Response(
        JSON.stringify({ error: "All action steps must be strings." }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for Hyperbrowser API key
    if (!process.env.HYPERBROWSER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Hyperbrowser API key not configured" }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Hyperbrowser client
    const hbClient = new Hyperbrowser({
      apiKey: process.env.HYPERBROWSER_API_KEY,
    });

    const session = await hbClient.sessions.create({
        // Use a profile (for login data)
        // profile: {
        //     id: '2de12d0b-8843-42e1-a039-e17a9d6dff7e'
        // }
    });
    

    // Create a readable stream for real-time updates
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          // Send initial status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: 'Initializing Hyperbrowser Browser Use agent...',
            step: 0,
            totalSteps: steps ? steps.length : 1
          })}\n\n`));

          // Determine the task description
          let taskDescription: string;
          if (task) {
            taskDescription = task;
          } else {
            taskDescription = `\n${steps.map((step: string, index: number) => `${step}.`).join('\n')}`;
          }

          // Send task description
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'task',
            message: 'Task description prepared',
            taskDescription: taskDescription
          })}\n\n`))

          // Start Browser Use agent execution
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: 'Starting Hyperbrowser Browser Use agent...',
            step: 1,
            totalSteps: steps ? steps.length : 1
          })}\n\n`));

          // Execute the task using Browser Use agent
          const result = await hbClient.agents.hyperAgent.startAndWait({
            task: taskDescription,
            sessionId: session.id
          });

          console.log('Hyperbrowser Browser Use result:', result);

          // Send completion status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            message: 'Browser automation completed successfully',
            output: result.data?.finalResult || 'Task completed successfully',
            step: steps ? steps.length : 1,
            totalSteps: steps ? steps.length : 1,
            resultData: result.data
          })}\n\n`));

        } catch (error) {
          console.error('Error in Hyperbrowser Browser Use agent execution:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: 'Browser automation failed',
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            step: -1,
            totalSteps: steps ? steps.length : 1
          })}\n\n`));
        } finally {
          // Close the stream
          controller.close();
        }
      },
    });

    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error in Hyperbrowser Browser Use route:', error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process request", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

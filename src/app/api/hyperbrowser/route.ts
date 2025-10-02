import { HyperAgent } from "@hyperbrowser/agent";
import { Hyperbrowser } from "@hyperbrowser/sdk";
import { chromium } from "playwright";
import { ChatOpenAI } from "@langchain/openai";

// Allow streaming responses up to 60 seconds for browser automation
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // Parse JSON body
    const { steps } = await req.json();
    console.log('actionSteps', steps);
    // Validate input
    if (!Array.isArray(steps) || steps.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid action steps. Expected an array of strings." }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate that all steps are strings
    if (!steps.every(step => typeof step === 'string')) {
      return new Response(
        JSON.stringify({ error: "All action steps must be strings." }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    let sessionId;

    // Initialize HyperBrowser client
    const hbClient = new Hyperbrowser({
      apiKey: process.env.HYPERBROWSER_API_KEY,
    });

    const session = await hbClient.sessions.create({
        useProxy: true,
        proxyCountry: "us",
        profile: {
            id: '2de12d0b-8843-42e1-a039-e17a9d6dff7e'
        }
    })

    sessionId = session.id

    // console.log('hbClient', hbClient)

    const llm = new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: "gpt-4o",
    })
    
    const agent = new HyperAgent({
        llm: llm,
        browserProvider: "Hyperbrowser",
    })

    const browser = await chromium.connectOverCDP(session.wsEndpoint);
    const context = browser.contexts()[0];

    agent.browser = browser as any;
    agent.context = context as any;

    // Create a readable stream for real-time updates
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
        //   // Send initial status
        //   controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        //     type: 'status',
        //     message: 'Initializing HyperBrowser agent...',
        //     step: 0,
        //     totalSteps: steps.length
        //   })}\n\n`));

          // Convert action steps to a single task description
          const taskDescription = `Execute the following browser automation steps in sequence:\n${steps.map((step) => `- ${step}`).join('\n')}`;

          console.log('taskDescription', taskDescription);

          // Send task description
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'task',
            message: 'Task description created',
            taskDescription: taskDescription
          })}\n\n`));

          // Start the HyperBrowser agent
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: 'Starting browser agent execution...',
            step: 1,
            totalSteps: steps.length
          })}\n\n`));

          const result = await agent.executeTask(
              taskDescription,
              {
                  debugOnAgentOutput: (agentOutput) => {
                    console.log("\n" + ("===== AGENT OUTPUT ====="));
                    console.dir(agentOutput, { depth: null, colors: true });
                    console.log(("===============") + "\n");
                    
                    // Stream agent output
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'agent_output',
                      message: 'Agent output received',
                      data: agentOutput
                    })}\n\n`));
                  },
                  onStep: (step) => {
                    console.log("\n" + `===== STEP ${step.idx} =====`);
                    console.dir(step, { depth: null, colors: true });
                    console.log(("===============") + "\n");
                    
                    // Stream step updates
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'step',
                      message: `Executing step ${step.idx}`,
                      step: step.idx,
                      totalSteps: steps.length,
                      stepData: step
                    })}\n\n`));
                  },
              }
          );

          console.log('result', result);
          await agent.closeAgent();
          console.log("\nResult:");
          console.log(result.output);

          // Send final result
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            message: 'Browser automation completed successfully',
            output: result.output,
            step: steps.length,
            totalSteps: steps.length
          })}\n\n`));

        } catch (error) {
          console.error('Error in agent execution:', error);
          // Send error message
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: 'Browser automation failed',
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            step: -1,
            totalSteps: steps.length
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

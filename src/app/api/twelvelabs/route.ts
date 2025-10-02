import { TwelveLabs, TwelvelabsApi } from "twelvelabs-js";

const client = new TwelveLabs({
    apiKey: process.env.TWELVELABS_API_KEY,
});

export async function POST(req: Request) {
    // Parse the incoming form data (video file)
    const formData = await req.formData();
    const file = formData.get('file');

    // Create an index
    let indexId

    const retrievedIndex = await client.indexes.list({
        indexName: "junction-hack",
    })

    const indexExists = retrievedIndex.data.some((index: any) => index.indexName === "junction-hack");

    if (!indexExists) {
        const index = await client.indexes.create({indexName: "junction-hack",models: [{modelName: "marengo2.7",modelOptions: ["visual", "audio"]},{modelName: "pegasus1.2", modelOptions: ["visual", "audio"]}]})
        indexId = index.id;
    } else {
        indexId = retrievedIndex.data.find((index: any) => index.indexName === "junction-hack")?.id;
    }

    console.log('indexId', indexId);

    if (!indexId) {
        return new Response('Index not found', { status: 404 });
    }

    // Create video upload task
    let taskId
    const existingTask = await client.tasks.list({
        indexId: indexId || "",
        filename: (file as File).name || "",
    });

    if (existingTask.data.length == 0) {
        const task = await client.tasks.create({indexId: indexId, videoFile: file as File})
        taskId = task.id;
    } else {
        taskId = existingTask.data[0].id;
    }

    console.log('taskId', taskId);

    if (!taskId) {
        return new Response('Task not found', { status: 404 });
    }

    const task = await client.tasks.waitForDone(taskId, {
        sleepInterval: 5,
        callback: (task: TwelvelabsApi.TasksRetrieveResponse) => {
            console.log(`  Status=${task.status}`);
        },
    });
    if (task.status !== "ready") {
        throw new Error(`Indexing failed with status ${task.status}`);
    }

    console.log(
        `Upload complete. The unique identifier of your video is ${task.videoId}`,
    );

    // 5. Perform open-ended analysis and create readable stream
    const textStream = await client.analyzeStream({
        videoId: task.videoId!,
        prompt: "The video is a screen recording of a person doing a manual browser task. Explain what is going on in the screen recording video.",
    });
    
    // 6. Convert to ReadableStream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
        async start(controller) {
            try {
                for await (const text of textStream) {
                    if ("text" in text) {
                        console.log(text.text!);
                        controller.enqueue(encoder.encode(text.text!));
                    }
                }
                controller.close();
            } catch (error) {
                controller.error(error);
            }
        }
    });
    
    return new Response(readable, {
        headers: { "Content-Type": "text/plain" }
    });
}

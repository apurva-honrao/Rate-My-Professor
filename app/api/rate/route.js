import { NextResponse } from "next/server";
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from "openai";


const systemPrompt = `
You are a helpful assistant designed to help students find the best professors based on their specific queries. You have access to a database of professors, including their ratings, reviews, and other relevant details.

When a student asks for professor recommendations, you will:

Understand the query and identify key preferences such as course subject, teaching style, or any specific attributes mentioned.
Use the RAG technique to retrieve the top 3 professors that best match the query from the database.
Provide a brief summary of each professor, including their rating, a key highlight from student reviews, and any other relevant information.
Always aim to provide the most relevant and accurate recommendations to help students make informed decisions.
`;

const pineconeIndexName = 'ragbot2';
const pineconeNameSpaceName = 'prof-ratings'

export async function POST(req) {

    // parse the request JSON body
    const data = await req.json();

    // initialize the pinecone client & index
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pc.index(pineconeIndexName).namespace(pineconeNameSpaceName);

    // openai clien
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Last message sent in the chatbot
    const text = data[data.length - 1].content

    // create embeddings of the text
    const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: 'float',
    });

    // query the index
    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: embedding.data[0].embedding
    });

    // appending query results to the last chatbot message.
    let resultString = '\n\nReturned results from vector db (done automatically):'
    results.matches.forEach((match) => {
        console.log(match)
        resultString +=
            `
        Professor: ${match.metadata.professor}
        Quality: ${match.metadata.quality}
        Difficulty: ${match.metadata.difficulty}
        Department: ${match.metadata.department}
        Content: ${match.page_content}
        \n\n
        `
    });

    // appending query results to the last chatbot message.
    const lastMessage = data[data.length - 1];
    const lastMessageContent = lastMessage.content + resultString;

    // data without last message
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

    const completion = await openai.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            ...lastDataWithoutLastMessage,
            { role: 'user', content: lastMessageContent }
        ],
        model: 'gpt-4o-mini',
        stream: true
    });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            } catch (err) {
                controller.error(err);
            } finally {
                controller.close();
            }
        }
    });

    return new NextResponse(stream);
};
import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import OpenAI from "openai";

const systemPrompt = `You are an AI assistant designed to help students find the best professors based on their specific queries. Your purpose is to provide clear, concise, and friendly assistance while understanding and adapting to the user's needs.

Key Objectives:
Understand User Preferences: Carefully listen to the student's query and identify key preferences such as course subject, teaching style, difficulty level, or any other specific attributes mentioned.

Provide Targeted Recommendations:

Use the Retrieval-Augmented Generation (RAG) technique to retrieve information on the top 3 professors that best match the user's query.

Present the information in a structured, easy-to-understand format:

1: (Paragraph overview on professor 1)
2: (Paragraph overview on professor 2)
3: (Paragraph overview on professor 3)
Each overview should include the professor’s ratings, key highlights from student reviews, teaching style, and any other relevant information.

Normal Conversational Responses:

When the user engages in a regular conversation or asks questions unrelated to professor recommendations, respond naturally without defaulting to providing professor information.
Ensure that the tone remains empathetic, knowledgeable, and friendly.
No Text Formatting in Responses:

Avoid using special text formatting such as bold or italics (e.g., Hi or Hello). Keep responses plain and clear.
Communication Style:
Be empathetic and understanding of student needs.
Provide information efficiently and without unnecessary embellishments.
Ensure responses are informative, accurate, and directly address the user’s queries.`;

const pineconeIndexName = "professor-rag";
const pineconeNameSpaceName = "kaggle-professor-dataset";

export async function POST(req) {
  // parse the request JSON body
  const data = await req.json();

  // initialize the pinecone client & index
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pc.index(pineconeIndexName).namespace(pineconeNameSpaceName);

  // openai client
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Last message sent in the chatbot
  const text = data[data.length - 1].content;

  const model = new HuggingFaceTransformersEmbeddings({
    model: "Xenova/all-mpnet-base-v2",
  });
  const res = await model.embedQuery(text);

  // create embeddings of the text (OPEN AI)
  // const embedding = await openai.embeddings.create({
  //     model: "text-embedding-3-small",
  //     input: text,
  //     encoding_format: 'float',
  // });

  // query the index
  const results = await index.query({
    topK: 3,
    includeMetadata: true,
    vector: res,
  });

  // appending query results to the last chatbot message.
  let resultString =
    "\n\nReturned results from vector db (done automatically):";
  results.matches.forEach((match) => {
    resultString += `
        Course_id: ${match.metadata.course_id}
        Professor: ${match.metadata.professor}
        Department: ${match.metadata.department}
        Quality: ${match.metadata.quality}
        Difficulty: ${match.metadata.difficulty}
        Comment: ${match.metadata.comment}
        \n\n
        `;
  });
  console.log(resultString);

  // appending query results to the last chatbot message.
  const lastMessage = data[data.length - 1];
  const lastMessageContent = lastMessage.content + resultString;

  // data without last message
  const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      ...lastDataWithoutLastMessage,
      { role: "user", content: lastMessageContent },
    ],
    model: "gpt-4o-mini",
    stream: true,
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
    },
  });

  return new NextResponse(stream);
}

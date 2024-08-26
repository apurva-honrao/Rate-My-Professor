import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import OpenAI from "openai";

const systemPrompt = `
You are a helpful assistant designed to help students find the best professors based on their specific queries. You have access to a database of professors, including their ratings, reviews, and other relevant details.

When a student asks for professor recommendations, you will:

1. Understand the query and identify key preferences such as course subject, teaching style, particular professor name, or any specific attributes mentioned.
2. Ensure that results match the course subject and department mentioned in the query. If a specific subject or department is not mentioned, infer it from the query context.
3. Use the RAG technique to retrieve the top 3 professors from the database who are most relevant to the specified course subject and department.
4. Provide a brief summary of each professor, including their rating, a key highlight from student reviews, and any other relevant information.
5. Always aim to provide the most relevant and accurate recommendations that match the query subject and department to help students make informed decisions.

Strictly adhere to the subject and department specified in the query when providing recommendations.

`;

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

  // Generate embeddings for the query
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
    topK: 10, // Increased to get more options in case of duplicates
    includeMetadata: true,
    vector: res,
  });

  // Cluster results by professor and create a summarized entry
  const clusters = {};
  results.matches.forEach((match) => {
    const professor = match.metadata.professor;
    if (!clusters[professor]) {
      clusters[professor] = {
        course_ids: new Set(),
        ratings: [],
        difficulties: [],
        comments: [],
        department: match.metadata.department,
      };
    }
    clusters[professor].course_ids.add(match.metadata.course_id);
    clusters[professor].ratings.push(parseFloat(match.metadata.quality));
    clusters[professor].difficulties.push(
      parseFloat(match.metadata.difficulty)
    );
    clusters[professor].comments.push(match.metadata.comment);
  });

  // Helper function to calculate average
  function calculateAverage(values) {
    if (values.length === 0) return "N/A"; // Handle empty arrays
    const sum = values.reduce((a, b) => a + b, 0);
    return (sum / values.length).toFixed(1);
  }

  // Convert clusters to an array of summarized entries
  const summarizedResults = Object.keys(clusters)
    .map((professor) => {
      const cluster = clusters[professor];
      const avgRating = calculateAverage(cluster.ratings);
      const avgDifficulty = calculateAverage(cluster.difficulties);
      return {
        professor,
        department: cluster.department,
        quality: avgRating,
        difficulty: avgDifficulty,
        comment: cluster.comments[0], // Use the first comment or summarize
      };
    })
    .slice(0, 3); // Limit to top 3 results

  // Construct the result string with summarized entries
  let resultString =
    "\n\nReturned results from vector db (done automatically):";
  summarizedResults.forEach((result) => {
    resultString += `
        Course_ids: ${[...clusters[result.professor].course_ids].join(", ")}
        Professor: ${result.professor}
        Department: ${result.department}
        Quality Rating: ${result.quality}
        Difficulty Rating: ${result.difficulty}
        Comment: ${result.comment}
        \n\n
        `;
  });
  console.log(resultString);

  // appending query results to the last chatbot message.
  const lastMessage = data[data.length - 1];
  const lastMessageContent = lastMessage.content + resultString;

  // data without last message
  const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

  // Generate the chatbot response using OpenAI
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

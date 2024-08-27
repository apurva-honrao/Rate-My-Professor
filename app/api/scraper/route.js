import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { PineconeStore } from "@langchain/pinecone";
import { getEncoding } from "js-tiktoken";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

const tokenizer = getEncoding("p50k_base");
const tiktokenLen = (text) => {
  const tokens = tokenizer.encode(text);
  return tokens.length;
};

export async function POST(request) {
  try {
    const { url } = await request.json(); // Get the URL from the request body

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await chromium.font(
      "https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf"
    );

    const isLocal = !!process.env.CHROME_EXECUTABLE_PATH;

    const browser = await puppeteer.launch({
      args: isLocal
        ? puppeteer.defaultArgs()
        : [
          ...chromium.args,
          "--hide-scrollbars",
          "--incognito",
          "--no-sandbox",
        ],
      defaultViewport: chromium.defaultViewport,
      executablePath:
        process.env.CHROME_EXECUTABLE_PATH ||
        (await chromium.executablePath(
          "https://ratemyprofessor.blob.core.windows.net/ratemyprof/chromium-v127.0.0-pack.tar"
        )),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    //   //professor-1
    //   await page.goto("https://www.ratemyprofessors.com/professor/27253/", {
    //     timeout: 0,
    //     waitUntil: "networkidle2", // Ensures the page is fully loaded
    //   });

    //   //professor-2
    //   await page.goto("https://www.ratemyprofessors.com/professor/83286", {
    //     timeout: 0,
    //     waitUntil: "networkidle2", // Ensures the page is fully loaded
    //   });

    // Use the user-provided URL
    await page.goto(url, {
      timeout: 0,
      waitUntil: "networkidle2",
    });

    // Scrape the required data
    const data = await page.evaluate(() => {
      // Extract professor name
      const professorNameElement = document.querySelector(
        "div.NameTitle__Name-dowf0z-0"
      );
      const firstName =
        professorNameElement?.querySelector("span")?.innerText.trim() || "";
      const lastName =
        professorNameElement
          ?.querySelector("span.NameTitle__LastNameWrapper-dowf0z-2")
          ?.innerText.trim() || "";
      const professor = `${firstName} ${lastName}`;

      // Extract department
      const departmentElement = document.querySelector(
        "a.TeacherDepartment__StyledDepartmentLink-fl79e8-0"
      );
      const department = departmentElement
        ? departmentElement.innerText.trim()
        : "";

      const reviews = Array.from(
        document.querySelectorAll("li > div.Rating__StyledRating-sc-1rhvpxz-1")
      );
      // Limit reviews to the first 5
      const limitedReviews = reviews.slice(0, 5);

      return limitedReviews.map((review) => {
        const courseIdElement = review.querySelector(
          "div.RatingHeader__StyledClass-sc-1dlkqw1-3"
        );
        const course_id = courseIdElement
          ? courseIdElement.innerText.trim().replace(/\s+/g, " ").split(" ")[0]
          : "";

        const qualityElement = review.querySelector(
          "div.CardNumRating__StyledCardNumRating-sc-17t4b9u-0 > div.CardNumRating__CardNumRatingNumber-sc-17t4b9u-2"
        );
        const quality = qualityElement ? qualityElement.innerText.trim() : "";

        const difficultyElement = review.querySelector(
          "div.RatingValues__RatingContainer-sc-6dc747-1:nth-child(2) div.CardNumRating__CardNumRatingNumber-sc-17t4b9u-2"
        );
        const difficulty = difficultyElement
          ? difficultyElement.innerText.trim()
          : "";

        const commentElement = review.querySelector(
          "div.Comments__StyledComments-dzzyvm-0"
        );
        const comment = commentElement ? commentElement.innerText.trim() : "";

        return {
          professor,
          department,
          course_id,
          quality,
          difficulty,
          comment,
        };
      });
    });

    await browser.close();

    if (data.length === 0) {
      throw new Error("No data found");
    }

    // Logic to add the professor data into the Pinecone Index.
    let documents = [];
    for (let i = 0; i < data.length; i++) {
      documents.push(
        new Document({
          pageContent: `Professorr: ${data[i].professor}
          Department: ${data[i].department}
          Course ID: ${data[i].course_id}
          Quality: ${data[i].quality}
          Difficulty: ${data[i].difficulty}
          Comment: ${data[i].comment}`,
          metadata: {
            professor: data[i].professor,
            department: data[i].department,
            course_id: data[i].course_id,
            quality: data[i].quality,
            difficulty: data[i].difficulty,
            comment: data[i].comment,
          },
        })
      );
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 100,
      lengthFunction: tiktokenLen,
    });
    const texts = await textSplitter.splitDocuments(documents);

    const pc = new PineconeClient();
    const pineconeIndex = pc.Index("professor-rag");
    const vectorStore = await PineconeStore.fromExistingIndex(
      new HuggingFaceTransformersEmbeddings({
        model: "Xenova/all-mpnet-base-v2",
      }),
      {
        pineconeIndex,
        namespace: "kaggle-professor-dataset",
      }
    );

    await vectorStore.addDocuments(texts);
    console.log("Added to Pinecone Index successfully");

    // Return the scraped data
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error during scraping:", error);

    return new Response(JSON.stringify({ error: "Failed to scrape data" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { pipeline, env } from "@xenova/transformers";

// Disable local models since we download from huggingface hub
env.allowLocalModels = false;

// Singleton pipeline to avoid reloading the model
class PipelineSingleton {
  static task: any = "text-classification";
  static model = "Xenova/toxic-bert";
  static instance: any = null;

  static async getInstance(progress_callback?: any) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

// Helper to extract YouTube ID
function getVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === "youtu.be") {
      return urlObj.pathname.slice(1);
    }
    if (urlObj.hostname.includes("youtube.com")) {
      return urlObj.searchParams.get("v");
    }
  } catch (e) {
    return null;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { videoUrl, commentCount = 20 } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: "Missing videoUrl" }, { status: 400 });
    }

    const videoId = getVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    let comments: string[] = [];

    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
      const baseComments = [
        "This video is absolutely amazing, thanks for sharing! I learned so much.",
        "You are so stupid for making this video, horrible content. Delete your channel.",
        "Can you explain the second point a bit more? I didn't get it.",
        "I absolutely hate you. You are the worst.",
        "This helped me solve my problem perfectly!"
      ];
      for (let i = 0; i < commentCount; i++) {
        comments.push(baseComments[i % baseComments.length]);
      }
    } else {
      // Fetch from YouTube Data API
      const ytRes = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=${commentCount}&key=${apiKey}`
      );
      
      const ytData = await ytRes.json();
      
      if (!ytRes.ok) {
        return NextResponse.json({ error: ytData.error?.message || "YouTube API Error" }, { status: 500 });
      }

      for (const item of ytData.items || []) {
        const textDisplay = item.snippet?.topLevelComment?.snippet?.textDisplay;
        if (textDisplay) {
          comments.push(textDisplay.replace(/<[^>]*>?/gm, ''));
        }
      }
    }

    if (comments.length === 0) {
      return NextResponse.json({ error: "No comments found on this video" }, { status: 404 });
    }

    // Run AI Classification
    const classifier = await PipelineSingleton.getInstance();
    
    const analyzedComments = [];
    let toxicCount = 0;

    for (const text of comments) {
      // Xenova/toxic-bert returns an array with the best label
      const prediction = await classifier(text);
      const isToxic = prediction[0].label === "toxic" && prediction[0].score > 0.5;
      
      if (isToxic) toxicCount++;

      analyzedComments.push({
        text,
        label: prediction[0].label,
        score: prediction[0].score,
        isToxic
      });
    }

    const overallToxicity = Math.round((toxicCount / comments.length) * 100);

    return NextResponse.json({
      overallToxicity,
      totalComments: comments.length,
      toxicComments: toxicCount,
      comments: analyzedComments
    });

  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

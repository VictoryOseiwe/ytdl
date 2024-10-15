import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import ytdl from "@distube/ytdl-core";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173", // Allow localhost in development
    credentials: true, // Allow cookies if needed
    methods: ["GET", "POST", "OPTIONS"], // Allow necessary methods
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.options("*", cors());

function getFormatByQuality(formats, qualityLabel) {
  return formats.find((format) => format.qualityLabel === qualityLabel);
}

function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs > 0 ? hrs + ":" : ""}${mins > 9 ? mins : "0" + mins}:${
    secs > 9 ? secs : "0" + secs
  }`;
}

function sanitizedTitle(title) {
  return (
    title
      .replace(/[<>:"\/\\|?*\u0000-\u001F]/g, "")
      // Replace any other special characters with a safe alternative (e.g., dash)
      .replace(/[^a-zA-Z0-9-_ ]/g, "-")
      .trim() || "video"
  );
}

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the YouTube Downloader API!" });
});

app.post("/info", async (req, res) => {
  const { videoUrl } = req.body;

  if (!ytdl.validateURL(videoUrl)) {
    return res.status(400).json({ error: "Invalid YouTube URL" });
  }

  try {
    const info = await ytdl.getInfo(videoUrl);
    console.log("awaiting info");
    const videoDetails = {
      title: info.videoDetails.title,

      duration: formatDuration(info.videoDetails.lengthSeconds),
      thumbnail:
        info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]
          ?.url,

      formats: [
        getFormatByQuality(info.formats, "720p"),
        getFormatByQuality(info.formats, "480p"),
        getFormatByQuality(info.formats, "360p"),
      ].filter(Boolean), // Filter out null values
    };
    return res.status(200).json(videoDetails);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch video information" });
  }
});

app.get("/download", async (req, res) => {
  const { videoUrl, qualityLabel } = req.query;

  if (!ytdl.validateURL(videoUrl)) {
    return res.status(400).json({ error: "Invalid YouTube URL" });
  }

  try {
    const info = await ytdl.getInfo(videoUrl);
    const format = info.formats.find(
      (format) => format.qualityLabel === qualityLabel
    );

    if (!format) {
      return res.status(404).json({ error: "Requested quality not available" });
    }

    // const title = info.videoDetails.title.replace(/[<>:"\/\\|?*]/g, "");
    const title = sanitizedTitle(info.videoDetails.title);

    res.header("Content-Disposition", `attachment; filename="${title}.mp4"`);
    ytdl(videoUrl, { format }).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: "Requested quality not available" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

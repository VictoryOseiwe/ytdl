import React, { useState } from "react";
import axios from "axios";

export default function App() {
  const [videoInfo, setVideoInfo] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");

  async function handleSubmitUrl(e) {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:3000/info", {
        videoUrl,
      });

      setVideoInfo(response.data);
      setError("");
    } catch (error) {
      console.error(error);
      setError("Failed to get video information.");
      setVideoInfo(null);
    }
  }

  function handleDownload(qualityLabel) {
    const downloadUrl = `http://localhost:3000/download?videoUrl=${encodeURIComponent(
      videoUrl
    )}&qualityLabel=${qualityLabel}`;

    window.open(downloadUrl);
  }

  return (
    <div className="sdown-container">
      <h1 className="">Download Youtube videos</h1>
      <form className="input-container">
        <input
          className="text-field"
          type="text"
          name="video-url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Paste your video link here..."
        />
        <button className="submit-btn" type="submit" onClick={handleSubmitUrl}>
          Download
        </button>
      </form>

      {error && (
        <p className="error" style={{ color: "red" }}>
          {error}
        </p>
      )}

      {videoInfo && (
        <div className="result-container">
          <img
            src={videoInfo.thumbnail}
            style={{ height: "144px", width: "256px" }}
            alt="Video Thumbnail"
          />
          <div className="video-info">
            <h2 className="video-title">{videoInfo.title}</h2>

            <ul className="video-fmt-list">
              {videoInfo.formats.map((format, index) => (
                <li className="video-fmt" key={index}>
                  {format.qualityLabel}
                  <button
                    className="download-btn"
                    onClick={() => handleDownload(format.qualityLabel)}
                  >
                    Download
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

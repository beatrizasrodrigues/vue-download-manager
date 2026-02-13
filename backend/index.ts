import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Proxy route to fetch PDFs
app.get("/download-pdf", async (req, res) => {
  const fileUrl = req.query.url as string;

  if (!fileUrl) {
    return res.status(400).send("Missing file URL");
  }

  try {
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const contentType =
      response.headers.get("content-type") || "application/pdf";

    res.setHeader("Content-Type", contentType);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Download proxy error:", error);
    res.status(500).send("Failed to fetch file");
  }
});

app.listen(PORT, () => {
  console.log(`Backend proxy running on http://localhost:${PORT}`);
});

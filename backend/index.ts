import express from "express";
import cors from "cors";
import { Readable } from "stream";

const app = express();
const PORT = 3000;

app.use(cors());

app.get("/download-pdf", async (req, res) => {
  const fileUrl = req.query.url as string;
  if (!fileUrl) return res.status(400).send("Missing file URL");

  const range = req.headers.range;

  try {
    const response = await fetch(fileUrl, {
      headers: {
        ...(range ? { Range: range } : {}),
        "User-Agent": "Mozilla/5.0",
      },
    });

    res.status(response.status);

    response.headers.forEach((value, key) => {
      if (value) res.setHeader(key, value);
    });

    if (response.body) {
      Readable.fromWeb(response.body as any).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).end("Proxy failed");
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running http://localhost:${PORT}`);
});

let aborted = false;
let paused = false;
let downloadedBytes = 0;

self.onmessage = async (e) => {
  const { type, downloadUrl, alreadyDownloaded } = e.data;

  if (e.data.type === "abort") {
    aborted = true;
    return;
  }

  if (type === "pause") {
    paused = true;
    return;
  }

  if (type === "start") {
    aborted = false;
    paused = false;
    downloadedBytes = alreadyDownloaded || 0;

    if (!downloadUrl || downloadUrl === null) {
      return;
    }

    const response = await fetch(downloadUrl, {
      headers:
        alreadyDownloaded > 0 ? { Range: `bytes=${alreadyDownloaded}-` } : {},
    });

    const mimeType =
      response.headers.get("content-type") || "application/octet-stream";
    const reader = response.body?.getReader();
    const contentLength = +response.headers.get("content-length")!;
    const chunks = [];

    while (alreadyDownloaded < contentLength && !aborted && !paused) {
      const { done, value } = await reader!.read();
      if (done) break;
      if (aborted) break;

      chunks.push(value);
      downloadedBytes += value.length;

      self.postMessage({
        status: "downloading",
        loaded: downloadedBytes,
        total: alreadyDownloaded + contentLength,
      });
    }

    if (aborted) return;

    if (paused) {
      self.postMessage({
        status: "paused",
        loaded: downloadedBytes,
      });
      return;
    }

    const blob = new Blob(chunks, { type: mimeType });
    self.postMessage({ status: "completed", blob });
  }
};

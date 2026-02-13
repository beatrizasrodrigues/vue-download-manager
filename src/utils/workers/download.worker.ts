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

    const response = await fetch(
      `http://localhost:3000/download-pdf?url=${encodeURIComponent(downloadUrl)}`,
      {
        headers:
          alreadyDownloaded > 0 ? { Range: `bytes=${alreadyDownloaded}-` } : {},
      },
    );

    const mimeType = response.headers.get("content-type") || "application/pdf";
    const reader = response.body?.getReader();

    let totalSize = 0;

    const contentRange = response.headers.get("content-range");
    if (contentRange) {
      // format: bytes START-END/TOTAL
      totalSize = parseInt(contentRange.split("/")[1], 10);
    } else {
      totalSize = parseInt(response.headers.get("content-length") || "0", 10);
    }

    if (!totalSize || totalSize <= 0) totalSize = 1;

    const chunks = [];

    while (!aborted && !paused) {
      const { done, value } = await reader!.read();
      if (done) break;

      const chunkSize = value?.byteLength ?? value?.length ?? 0;
      downloadedBytes += chunkSize;
      chunks.push(value);

      self.postMessage({
        status: "downloading",
        loaded: downloadedBytes,
        total: totalSize,
      });
    }

    if (aborted) return;

    if (paused) {
      self.postMessage({
        status: "paused",
        loaded: downloadedBytes,
        total: totalSize,
      });
      return;
    }

    const blob = new Blob(chunks, { type: mimeType });
    self.postMessage({
      status: "completed",
      blob,
      loaded: downloadedBytes,
      total: totalSize,
    });
  }
};

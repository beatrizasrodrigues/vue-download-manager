import { useDownloadStore } from "@/stores/download";
import type {
  DownloadItem,
  ManagedWorker,
  WorkerDownloadMessage,
} from "@/interfaces/download";
import { supabase } from "@/lib/supabase";

export const fetchDownloadItems = async (): Promise<DownloadItem[]> => {
  const { data, error } = await supabase.from("downloads").select("*");

  if (error) {
    console.error("Failed to fetch downloads:", error);
    return [];
  }

  // Map Supabase rows to your DownloadItem type
  return data.map((row) => ({
    id: row.id,
    filename: row.filename,
    url: row.url,
    size: row.size,
    status: row.status as DownloadItem["status"],
    progress: row.progress ?? 0,
    endTime: row.end_time ? new Date(row.end_time) : undefined,
    metadata: {
      downloadedBytes: row.downloaded_bytes ?? 0,
      loaded: row.loaded,
      total: row.total ?? row.size,
      isDirect: true,
    },
  }));
};

const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/\.\./g, "_")
    .trim();
};

const triggerBrowserDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = sanitizeFilename(filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadFile = async (item: DownloadItem): Promise<void> => {
  const downloadStore = useDownloadStore();
  if (
    (item.metadata?.isDirect === true &&
      downloadStore.activeDownloads.length >=
        downloadStore.configuration.maxConcurrent) ||
    downloadStore.allDirectDownloads.length >=
      downloadStore.configuration.maxConcurrent
  ) {
    downloadStore.queue.push(item);
    downloadStore.addToDirectDownloads(item);
  }

  if (
    item.metadata?.isDirect === true &&
    downloadStore.activeDownloads.length <
      downloadStore.configuration.maxConcurrent
  ) {
    downloadStore.addToDirectDownloads(item);
    await executeDownload(item);
  }
};

export const downloadMultiple = async (
  items: DownloadItem[],
): Promise<void> => {
  const downloadStore = useDownloadStore();
  items.forEach((item) => downloadStore.addToMultipleDownloads(item));

  const toStart = Math.min(
    items.length,
    downloadStore.configuration.maxConcurrent,
  );
  const promises = [];
  const remainingItems = items.slice(toStart);
  remainingItems.forEach((item) => downloadStore.queue.push(item));

  for (let i = 0; i < toStart; i++) {
    items[i] = {
      ...items[i],
      progress: 0,
      metadata: {
        ...items[i].metadata,
        isDirect: false,
        downloadedBytes: 0,
      },
    };
    promises.push(executeDownload(items[i]));
  }

  await Promise.allSettled(promises);
};

const executeDownload = async (item: DownloadItem): Promise<void> => {
  const downloadStore = useDownloadStore();
  let worker: Worker;
  let managedWorker: ManagedWorker;

  item.metadata!.abortController = new AbortController();

  // managing create/reuse web worker
  if (
    downloadStore.inactiveWorkers.length < 1 &&
    downloadStore.workers.size < 3
  ) {
    worker = new Worker(
      new URL("@/utils/workers/download.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    managedWorker = downloadStore.addWorker(worker, item);
  } else {
    const inactiveWorker = downloadStore.inactiveWorkers.find(
      (w) => w.state === "inactive",
    );
    if (!inactiveWorker) return;

    downloadStore.updateWorkerState(inactiveWorker.id, "active");
    worker = inactiveWorker.instance;
    managedWorker = {
      id: inactiveWorker.id,
      instance: worker,
      download: item,
      state: "active",
    };
    downloadStore.workers.set(managedWorker.id, managedWorker);
  }

  // Abort listener
  const abortListener = () => {
    worker.postMessage({ type: "abort" });
    downloadStore.updateDownload(item.id, {
      status: "cancelled",
      endTime: new Date(),
    });

    const noMoreDownloads =
      downloadStore.queue.length < 1 &&
      downloadStore.activeDownloads.length < 1 &&
      downloadStore.pendingDownloads.length < 1;

    if (noMoreDownloads) {
      worker.terminate();
      downloadStore.removeWorker(managedWorker.id);
    }

    item.metadata?.abortController?.signal.removeEventListener(
      "abort",
      abortListener,
    );
    downloadStore.updateWorkerState(managedWorker.id, "inactive");
    if (item.metadata?.isDirect)
      downloadStore.removeDirectDownloadFromList(item.id);
  };

  item.metadata?.abortController.signal.addEventListener(
    "abort",
    abortListener,
  );

  worker.postMessage({
    downloadUrl: item.url,
    alreadyDownloaded: item.metadata.loaded ?? 0,
    type: "start",
  });

  // Worker message handler
  const handleMessage = (e: MessageEvent<WorkerDownloadMessage>) => {
    const { status, loaded, blob, total } = e.data;

    item = { ...item, size: total || item.size };

    const updatedMetadata = {
      ...item.metadata,
      loaded: Number(loaded || 1),
      downloadedBytes: Number(loaded || 1),
      total: total || item.size,
      progress: Math.floor((loaded! / (item.size || 1)) * 100),
    };

    console.log("loaded", item.metadata.loaded, loaded);

    if (status === "downloading") {
      downloadStore.updateDownload(item.id, {
        status: "downloading",
        metadata: updatedMetadata,
        progress: Math.floor((loaded! / (item.size || 1)) * 100),
      });
    }

    if (status === "completed" && blob) {
      triggerBrowserDownload(blob, item.filename);

      downloadStore.updateDownload(item.id, {
        status: "completed",
        progress: 100,
        endTime: new Date(),
      });

      downloadStore.updateWorkerState(managedWorker.id, "inactive");
      worker.removeEventListener("message", handleMessage);

      if (downloadStore.queue.length > 0) processNextInQueue();

      if (item.metadata?.isDirect)
        downloadStore.removeDirectDownloadFromList(item.id);
    }
  };

  worker.addEventListener("message", handleMessage);

  worker.onerror = (error) => {
    console.error(`Download failed for ${item.id}:`, error);
    downloadStore.updateDownload(item.id, {
      status: "error",
      endTime: new Date(),
    });
    if (item.metadata?.isDirect)
      downloadStore.removeDirectDownloadFromList(item.id);
    worker.terminate();
  };
};

const processNextInQueue = (): void => {
  const downloadStore = useDownloadStore();
  const nextItem = downloadStore.processQueue();
  if (nextItem) {
    executeDownload(nextItem);
  }
};

export const cancelDownload = (download: DownloadItem): void => {
  const downloadStore = useDownloadStore();
  const managedWorker = downloadStore.getWorkerByDownloadId(download.id);

  const controller = download.metadata?.abortController;

  if (controller) {
    controller.abort();
  }

  if (managedWorker !== null) {
    const worker = managedWorker.instance;
    worker.postMessage({ type: "abort" });

    // clean up event listeners
    worker.onmessage = null;
    worker.onerror = null;

    downloadStore.updateDownload(download.id, {
      status: "cancelled",
      progress: 0,
      metadata: { ...download.metadata, downloadedBytes: 0, loaded: 0 },
      endTime: new Date(),
    });

    downloadStore.updateWorkerState(managedWorker.id, "inactive");
    worker.terminate();
    downloadStore.removeWorker(managedWorker.id);
  }
  if (downloadStore.queue.length > 0) processNextInQueue();
};

export const pauseDownload = (download: DownloadItem): void => {
  const downloadStore = useDownloadStore();

  const managedWorker = downloadStore.getWorkerByDownloadId(download.id);
  const controller = download.metadata?.abortController;

  if (controller && managedWorker !== null) {
    const worker = managedWorker.instance;

    worker.postMessage({ type: "pause" });
    controller.abort();

    downloadStore.updateDownload(download.id, { status: "paused" });
    downloadStore.updateWorkerState(managedWorker.id, "inactive");
    worker.terminate();
    downloadStore.removeWorker(managedWorker.id);
  } else if (controller) {
    const inactiveWorker = downloadStore.inactiveWorkers[0];

    const worker = inactiveWorker.instance;
    worker.postMessage({ type: "pause" });

    controller.abort();

    downloadStore.updateDownload(download.id, { status: "paused" });

    downloadStore.updateWorkerState(inactiveWorker.id, "inactive");
    worker.terminate();
    downloadStore.removeWorker(inactiveWorker.id);
  }
};

export const resumeDownload = async (download: DownloadItem): Promise<void> => {
  const downloadStore = useDownloadStore();

  console.log(download.metadata.downloadedBytes);
  const resumeItem: DownloadItem = {
    id: download.id,
    url: download.url,
    filename: download.filename,
    size: download.size,
    progress: download.progress,
    status: "downloading",
    metadata: {
      ...download.metadata,
      abortController: undefined,
      downloadedBytes: download.metadata!.downloadedBytes,
    },
  };

  downloadStore.updateDownload(download.id, {
    status: "downloading",
    progress: resumeItem.progress,
    endTime: undefined,
    metadata: {
      ...download.metadata,
      loaded: resumeItem.metadata!.downloadedBytes,
    },
  });

  await executeDownload(resumeItem);
};

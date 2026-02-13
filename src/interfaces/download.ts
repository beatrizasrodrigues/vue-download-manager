export type DownloadURL = {
  url: string;
};

export interface DownloadMetadata {
  isDirect?: boolean;
  abortController?: AbortController;
  downloadedBytes: number;
  loaded?: number;
  total?: number;
}

export interface DownloadItem {
  id: string;
  url: string;
  filename: string;
  size: number;
  status:
    | "pending"
    | "downloading"
    | "completed"
    | "error"
    | "paused"
    | "cancelled";
  progress: number;
  endTime?: Date;
  metadata: DownloadMetadata;
}

export interface ManagedWorker {
  id: string;
  instance: Worker;
  download: DownloadItem;
  state: "active" | "inactive";
}

export type WorkerDownloadMessage = {
  status: "downloading" | "paused" | "completed" | "error";
  loaded?: number;
  blob?: Blob;
  downloadedBytes: number;
  total: number;
};

export interface DownloadMetadata {
  isDirect?: boolean;
  abortController?: AbortController;
  downloadedBytes: number;
  progress: number;
}

export interface DownloadItem {
  id: string;
  url: string;
  filename: string;
  size: number;
  metadata?: DownloadMetadata;
}

export interface DownloadState {
  id: string;
  filename: string;
  url: string;
  progress: number;
  loaded: number;
  total: number;
  status:
    | "pending"
    | "downloading"
    | "completed"
    | "error"
    | "paused"
    | "cancelled";
  endTime?: Date;
  metadata?: DownloadMetadata;
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
  total: number;
  partialBlob?: Blob;
};

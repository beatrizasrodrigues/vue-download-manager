import { defineStore } from "pinia";
import type {
  DownloadItem,
  DownloadState,
  ManagedWorker,
} from "@/interfaces/download";
import { v4 as uuidv4 } from "uuid";

interface State {
  directDownloads: Record<string, DownloadState>;
  multipleDownloads: Record<string, DownloadState>;
  queue: DownloadItem[];
  configuration: {
    maxConcurrent: number; // httpMaximumConnectionsPerHost - max 6
  };
  workers: Map<string, ManagedWorker>;
}

export const useDownloadStore = defineStore("download", {
  state: (): State => ({
    directDownloads: {},
    multipleDownloads: {},
    queue: [],
    configuration: {
      maxConcurrent: 3,
    },
    workers: new Map<string, ManagedWorker>(),
  }),

  getters: {
    // active downloads has both direct and multiple downloads to keep track of concurrency
    activeDownloads: (state): DownloadState[] => {
      return [
        ...Object.values(state.directDownloads).filter(
          (d) => d.status === "downloading",
        ),
        ...Object.values(state.multipleDownloads).filter(
          (d) => d.status === "downloading",
        ),
      ];
    },
    completedDownloads: (state): DownloadState[] =>
      Object.values(state.multipleDownloads).filter(
        (d) => d.status === "completed",
      ),

    failedDownloads: (state): DownloadState[] =>
      Object.values(state.multipleDownloads).filter(
        (d) => d.status === "error",
      ),

    pausedDownloads: (state): DownloadState[] =>
      Object.values(state.multipleDownloads).filter(
        (d) => d.status === "paused",
      ),

    pendingDownloads: (state): DownloadState[] =>
      Object.values(state.multipleDownloads).filter((d) =>
        ["pending", "cancelled"].includes(d.status),
      ),

    allDirectDownloads: (state): DownloadState[] =>
      Object.values(state.directDownloads),

    allMultipleDownloads: (state): DownloadState[] =>
      Object.values(state.multipleDownloads),

    allDownloads: (state): DownloadState[] => {
      return [
        ...Object.values(state.directDownloads),
        ...Object.values(state.multipleDownloads),
      ];
    },

    activeWorkers: (state): ManagedWorker[] =>
      Array.from(state.workers.values()).filter((w) => w.state === "active"),

    inactiveWorkers: (state): ManagedWorker[] =>
      Array.from(state.workers.values()).filter((w) => w.state === "inactive"),
  },

  actions: {
    totalProgress(): number {
      const active = this.activeDownloads as DownloadState[];
      if (active.length === 0) return 0;

      const totalLoaded = active.reduce(
        (sum: number, d: DownloadState) => sum + d.loaded,
        0,
      );
      const totalSize = active.reduce(
        (sum: number, d: DownloadState) => sum + d.total,
        0,
      );

      return totalSize > 0 ? Math.round((totalLoaded / totalSize) * 100) : 0;
    },

    downloadProgress(item: DownloadState): number {
      const totalLoaded = item.loaded;
      const totalSize = item.total;

      return totalSize > 0 ? Math.round((totalLoaded / totalSize) * 100) : 0;
    },

    addToDirectDownloads(item: DownloadItem): void {
      const downloadState: DownloadState = {
        id: item.id,
        filename: item.filename,
        url: item.url,
        progress: 0,
        loaded: 0,
        total: item.size ?? 0,
        status: "pending",
        metadata: item.metadata,
      };

      this.directDownloads[item.id] = downloadState;
    },

    addToMultipleDownloads(item: DownloadItem): void {
      const downloadState: DownloadState = {
        id: item.id,
        filename: item.filename,
        url: item.url,
        progress: 0,
        loaded: 0,
        total: item.size ?? 0,
        status: "pending",
        metadata: item.metadata,
      };

      this.multipleDownloads[item.id] = downloadState;

      // Add to queue if max concurrent reached
      if (this.activeDownloads.length >= this.configuration.maxConcurrent) {
        this.queue.push(item);
      }
    },

    updateDownload(id: string, updates: Partial<DownloadState>): void {
      const updateEntry = (downloads: Record<string, DownloadState>) => {
        const existing = downloads[id];
        if (!existing) return;

        const updated = { ...existing, ...updates };

        if (
          (updates.status === "completed" || updates.status === "error") &&
          !updated.endTime
        ) {
          updated.endTime = new Date();
        }

        downloads[id] = updated;
      };

      updateEntry(this.directDownloads);
      updateEntry(this.multipleDownloads);
    },

    removeDirectDownloadFromList(id: string): void {
      const download = Object.values(this.directDownloads).find(
        (download) => download.id === id,
      );

      if (download) delete this.directDownloads[id];
    },

    removeMultipleDownloadFromList(id: string): void {
      const download = Object.values(this.multipleDownloads).find(
        (download) => download.id === id,
      );

      if (download) delete this.multipleDownloads[id];
    },

    processQueue(): DownloadItem | null {
      if (this.queue.length === 0) return null;
      if (this.activeDownloads.length >= this.configuration.maxConcurrent)
        return null;

      return this.queue.shift() || null;
    },

    addWorker(workerInstance: Worker, download: DownloadItem): ManagedWorker {
      const managedWorker: ManagedWorker = {
        id: uuidv4(),
        instance: workerInstance,
        download,
        state: "active",
      };

      this.workers.set(managedWorker.id, managedWorker);
      return managedWorker;
    },

    getWorker(workerId: string): ManagedWorker | undefined {
      return this.workers.get(workerId);
    },

    getWorkerByDownloadId(downloadId: string): ManagedWorker | null {
      const worker = this.activeWorkers.find(
        (w) => w.download.id === downloadId,
      );
      if (!worker) {
        return null;
      }
      return worker;
    },

    removeWorker(workerId: string): void {
      this.workers.delete(workerId);
    },

    updateWorkerState(workerId: string, state: "active" | "inactive"): void {
      const worker = this.workers.get(workerId);
      if (!worker) return;

      const updatedWorker = { ...worker, state };
      this.workers.set(workerId, updatedWorker);
    },

    cleanupWorker(worker: Worker, id: string) {
      worker.terminate();
      this.removeWorker(id);
    },
  },
});

import { defineStore } from "pinia";
import type { DownloadItem, ManagedWorker } from "@/interfaces/download";
import { v4 as uuidv4 } from "uuid";

interface State {
  directDownloads: Record<string, DownloadItem>;
  multipleDownloads: Record<string, DownloadItem>;
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
    activeDownloads: (state): DownloadItem[] => {
      return [
        ...Object.values(state.directDownloads).filter(
          (d) => d.status === "downloading",
        ),
      ];
    },

    completedDownloads: (state): DownloadItem[] =>
      Object.values(state.multipleDownloads).filter(
        (d) => d.status === "completed",
      ),

    failedDownloads: (state): DownloadItem[] =>
      Object.values(state.multipleDownloads).filter(
        (d) => d.status === "error",
      ),

    pausedDownloads: (state): DownloadItem[] =>
      Object.values(state.multipleDownloads).filter(
        (d) => d.status === "paused",
      ),

    pendingDownloads: (state): DownloadItem[] =>
      Object.values(state.multipleDownloads).filter((d) =>
        ["pending", "cancelled"].includes(d.status),
      ),

    allDirectDownloads: (state): DownloadItem[] =>
      Object.values(state.directDownloads),

    allMultipleDownloads: (state): DownloadItem[] =>
      Object.values(state.multipleDownloads),

    allDownloads: (state): DownloadItem[] => {
      return [...Object.values(state.directDownloads)];
    },

    activeWorkers: (state): ManagedWorker[] =>
      Array.from(state.workers.values()).filter((w) => w.state === "active"),

    inactiveWorkers: (state): ManagedWorker[] =>
      Array.from(state.workers.values()).filter((w) => w.state === "inactive"),
  },

  actions: {
    generateUUID(): string {
      return uuidv4();
    },
    totalProgress(): number {
      const active = this.activeDownloads as DownloadItem[];
      if (active.length === 0) return 0;

      const totalLoaded = active.reduce(
        (sum: number, d: DownloadItem) => sum + d.metadata.loaded!,
        0,
      );
      const totalSize = active.reduce(
        (sum: number, d: DownloadItem) => sum + d.metadata.total!,
        0,
      );

      return totalSize > 0 ? Math.round((totalLoaded / totalSize) * 100) : 0;
    },

    downloadProgress(item: DownloadItem): number {
      const loaded = item.metadata.loaded ?? 0;
      const total = item.metadata.total ?? item.size ?? 1;

      return total > 0 ? Math.round((loaded / total) * 100) : 0;
    },

    addToDirectDownloads(item: DownloadItem): void {
      this.directDownloads[item.id] = item;
    },

    addToMultipleDownloads(item: DownloadItem): void {
      this.multipleDownloads[item.id] = item;

      // Add to queue if max concurrent reached
      if (this.activeDownloads.length >= this.configuration.maxConcurrent) {
        this.queue.push(item);
      }
    },

    updateDownload(id: string, updates: Partial<DownloadItem>): void {
      const updateEntry = (downloads: Record<string, DownloadItem>) => {
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

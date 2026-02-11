export type DownloadURL = {
  url: string
}

export interface DownloadMetadata {
  timelineId?: string
  isDirect?: boolean
  abortController?: AbortController
  downloadedBytes: number
  progress: number
}

export interface DownloadItem {
  id: string
  url: string
  filename: string
  size: number
  metadata: DownloadMetadata
}

export interface DownloadState {
  id: string
  filename: string
  url: string
  progress: number
  loaded: number
  total: number
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'paused' | 'cancelled'
  error?: string
  speed?: number
  eta?: number
  startTime?: Date
  endTime?: Date
  metadata: DownloadMetadata
}

export type DownloadStatus = {
  progress: number
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'cancelled'
}

export interface ManagedWorker {
  id: string
  instance: Worker
  download: DownloadItem
  state: 'active' | 'inactive'
}

export type WorkerDownloadMessage = {
  status: 'downloading' | 'paused' | 'completed' | 'error'
  loaded?: number
  blob?: Blob
  downloadedBytes: number
  total: number
}
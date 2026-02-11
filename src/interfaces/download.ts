export interface DownloadItem {
  id: string
  name: string
  size: number
  version: string
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error'
  progress: number
  url: string
  addedAt: Date
}
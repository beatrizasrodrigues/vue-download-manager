import { useDownloadStore } from '@/stores/download'
import type {
  DownloadItem,
  ManagedWorker,
  WorkerDownloadMessage
} from '@/interfaces/download'
import { supabase } from '@/lib/supabase'


export const fetchDownloadItems = async (): Promise<DownloadItem[]> => {
  const { data, error } = await supabase
    .from('downloads')
    .select('*')

  if (error) {
    console.error('Failed to fetch downloads:', error)
    return []
  }

  // Map Supabase rows to your DownloadItem type
  return data.map(row => ({
    id: row.id,
    filename: row.filename,
    url: row.url,
    size: row.size,
    status: row.status as DownloadItem['status'], 
    progress: row.progress ?? 0,      
    endTime: row.end_time ? new Date(row.end_time) : undefined,
    metadata: {
      downloadedBytes: row.downloaded_bytes ?? 0,
      loaded: row.loaded ?? 0,
      total: row.total ?? row.size,
      isDirect: true
    }
  }))
}

const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\.\./g, '_')
    .trim()
}

const triggerBrowserDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = sanitizeFilename(filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const downloadFile = async (item: DownloadItem): Promise<void> => {
  const downloadStore = useDownloadStore()
  if (
    (item.metadata?.isDirect === true &&
      downloadStore.activeDownloads.length >= downloadStore.configuration.maxConcurrent) ||
    downloadStore.allDirectDownloads.length >= downloadStore.configuration.maxConcurrent
  ) {
    downloadStore.queue.push(item)
    downloadStore.addToDirectDownloads(item)
  }

  if (
    item.metadata?.isDirect === true &&
    downloadStore.activeDownloads.length < downloadStore.configuration.maxConcurrent
  ) {
    downloadStore.addToDirectDownloads(item)
    await executeDownload(item)
  }
}

const executeDownload = async (item: DownloadItem): Promise<void> => {
  const downloadStore = useDownloadStore()
  let worker: Worker
  let managedWorker: ManagedWorker

  item.metadata!.abortController = new AbortController()

  // Create or reuse a worker
  if (downloadStore.inactiveWorkers.length < 1 && downloadStore.workers.size < 3) {
    worker = new Worker(new URL('@/utils/workers/download.worker.ts', import.meta.url), {
      type: 'module'
    })
    managedWorker = downloadStore.addWorker(worker, item)
  } else {
    const inactiveWorker = downloadStore.inactiveWorkers.find((w) => w.state === 'inactive')
    if (!inactiveWorker) return

    downloadStore.updateWorkerState(inactiveWorker.id, 'active')
    worker = inactiveWorker.instance
    managedWorker = { id: inactiveWorker.id, instance: worker, download: item, state: 'active' }
    downloadStore.workers.set(managedWorker.id, managedWorker)
  }

  // Abort listener
  const abortListener = () => {
    worker.postMessage({ type: 'abort' })
    downloadStore.updateDownload(item.id, { status: 'cancelled', endTime: new Date() })
    worker.terminate()
    downloadStore.removeWorker(managedWorker.id)
    item.metadata?.abortController?.signal.removeEventListener('abort', abortListener)
    downloadStore.updateWorkerState(managedWorker.id, 'inactive')
  }

  item.metadata?.abortController.signal.addEventListener('abort', abortListener)

  // Pass download URL directly to worker
  worker.postMessage({
    downloadUrl: item.url,
    alreadyDownloaded: item.metadata?.downloadedBytes || 0,
    type: 'start'
  })

  // Worker message handler
  const handleMessage = (e: MessageEvent<WorkerDownloadMessage>) => {
    const { status, loaded, blob, total } = e.data
    item = { ...item, size: total || item.size }

    const updateMeta = {
      ...item.metadata,
      downloadedBytes: Number(loaded || 0),
      progress: Math.floor((loaded! / (item.size || 1)) * 100)
    }

    if (status === 'downloading') {
      downloadStore.updateDownload(item.id, { status: 'downloading', metadata: updateMeta })
    }

    if (status === 'completed' && blob) {
      triggerBrowserDownload(blob, item.filename)
      downloadStore.updateDownload(item.id, {
        status: 'completed',
        progress: 100,
        endTime: new Date()
      })

      downloadStore.updateWorkerState(managedWorker.id, 'inactive')
      worker.removeEventListener('message', handleMessage)

      if (downloadStore.queue.length > 0) processNextInQueue()

      if (item.metadata?.isDirect) downloadStore.removeDirectDownloadFromList(item.id)
    }
  }

  worker.addEventListener('message', handleMessage)

  // Error fallback
  worker.onerror = (error) => {
    console.error(`Download failed for ${item.id}:`, error)
    downloadStore.updateDownload(item.id, { status: 'error', endTime: new Date() })
    worker.terminate()
  }
}

const processNextInQueue = (): void => {
  const downloadStore = useDownloadStore()
  const nextItem = downloadStore.processQueue()
  if (nextItem) {
    executeDownload(nextItem)
  }
}

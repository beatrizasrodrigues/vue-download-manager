# Vue Download Manager (Web Workers + Pinia)

A high-performance browser download system built with **Vue**, **Web Workers**, and **Pinia** that enables efficient, concurrent, and non-blocking file downloads.

The system supports **individual and batch downloads**, with full lifecycle controls including **pause, resume, cancel, and retry**, while keeping the main UI thread responsive.

---

## Overview

The download system leverages the **Web Workers API** to offload heavy download processing from the main thread, enabling smooth UI performance even during large or multiple concurrent downloads.

Each file download runs in a **dedicated worker**, allowing safe parallelism and efficient resource usage.

State management and orchestration are handled via a centralized **Pinia store**.

---

## Web Workers — Download Flow

Each download is executed by a **dedicated Web Worker**, responsible for handling one download at a time.

### Workflow

1. Main thread sends a pre-signed URL to the worker
2. Worker downloads the file using `fetch` / `XMLHttpRequest`
3. Worker sends progress updates via `postMessage`
4. Worker returns the downloaded `Blob` to the main thread
5. Browser download is triggered

This architecture keeps the main thread free for UI rendering and application logic.

> **Note:** Zipped downloads are not supported due to browser limitations related to maximum downloadable file size.

---

## Architecture

### Pinia Store — `DownloadStore`

The **DownloadStore** is the core of the system and manages:

- Active and pending downloads
- Batch and direct downloads
- Download queue
- Concurrency limits
- Route navigation safety during downloads
- Managed Web Worker instances

Each worker is tracked in a `ManagedWorker` map:

```ts
interface ManagedWorker {
  id: string;
  instance: Worker;
  download: DownloadItem | null;
  state: "active" | "inactive";
}
```

This allows the system to efficiently reuse or terminate workers as needed.

---

### Main Thread — `useFileDownload`

The main download orchestration logic lives in `useFileDownload.ts`

#### Public API

- `downloadFile()` — Start a single download
- `downloadMultiple()` — Batch download
- `pauseDownload()`
- `resumeDownload()`
- `cancelDownload()`
- `retryDownload()`

#### Core Function: `executeDownload`

Handles the full lifecycle of a download:

- Creates or reuses inactive workers
- Fetches pre-signed URL from backend
- Sends metadata + resume offset to worker
- Uses `AbortController` for pause/cancel
- Streams file via `ReadableStream`
- Tracks real-time progress
- Receives blob and triggers browser download

> Downloaded files include **reference, suitability, and revision metadata** in the filename for clear identification.

---

### Web Worker — `download.worker.ts`

Workers listen for:

- `start`
- `pause`
- `abort`

#### Worker Behavior

- Fetches file using provided URL
- Supports **resume** using HTTP `Range` header
- Streams data in chunks
- Sends periodic progress updates
- Assembles blob on completion
- Exits early on pause/abort and reports status

---

## Components

### Download Drawer — `DownloadFile`

Provides the main UI for managing downloads:

- View artifacts timeline
- Download individual files
- Add files to download list
- Download all / Cancel / Retry / Pause / Resume
- Prevent navigation during active downloads
- Warns user that downloads continue in background if UI is closed

---

### Artifact Timeline — `ArtifactTimelineSelector`

Allows users to:

- Browse artifact version history
- Download specific versions
- Add versions to download list
- Prevent duplicate entries in the list

---

### Download List — `ArtifactCardDownload`

Displays all downloads with controls:

- Download All
- Cancel (resets to pending)
- Pause / Resume
- Retry
- Remove from list

Each download shows:

- Progress bar
- Status: Pending / Downloading / Completed / Error

---

## Key Features

### Concurrency & Queue Management

- Configurable max concurrent downloads
- Excess downloads are queued
- Queue automatically advances when a download completes
- Ensures resource-safe parallelism

---

### Pause, Resume & Cancel

- Resume supported via HTTP `Range` header
- Pause / Cancel powered by `AbortController`
- Workers are terminated when no longer needed
- Cancel fully cleans state and listeners
- Pause preserves state for later resume

---

### Real-Time Progress Tracking

- Workers send progress updates via `postMessage`
- Pinia store tracks all download states
- UI derives computed states:
  - Active
  - Pending
  - Completed
  - Paused
  - Failed

- Supports aggregated progress tracking (future-ready)

---

## Tech Stack

- Vue
- Pinia
- Web Workers API
- TypeScript
- Fetch API + ReadableStreams
- AbortController

---

## Why Web Workers?

Using Web Workers allows:

- Non-blocking UI during heavy downloads
- Parallel downloads
- Efficient memory usage
- Better performance with large files
- True background processing

---

## Limitations

- Browser maximum downloadable size prevents zipped downloads
- Requires backend support for pre-signed URLs
- Resume requires server support for `Range` requests

---

## Possible Future Improvements

- Global progress indicator
- Download speed calculation
- Integrity verification (hash)
- Persistent download state
- Service Worker integration
- Background sync
- Packaging as reusable Vue library

---

## Author

Designed and implemented as a **high-performance browser download system** to demonstrate advanced frontend engineering, concurrency handling, and Web Worker architecture in Vue.

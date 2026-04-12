/**
 * videoCompressor.ts
 *
 * In-browser video compression using FFmpeg.wasm (v0.12).
 * Runs entirely client-side — no server required.
 *
 * What it does for every uploaded video:
 *  1. Transcodes to H.264 MP4 with AAC audio
 *  2. Scales to max 1280×720 (preserving aspect ratio)
 *  3. Sets CRF 28 for good quality at small file size
 *  4. Adds -movflags +faststart so playback begins before full download
 *  5. Extracts a thumbnail from the first frame
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Singleton FFmpeg instance — loaded once, reused for all uploads
let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<void> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;

  if (loadingPromise) {
    await loadingPromise;
    return ffmpegInstance!;
  }

  const ff = new FFmpeg();
  ffmpegInstance = ff;

  loadingPromise = (async () => {
    // Load the multi-threaded WASM core from CDN (cached by browser after first load)
    const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';
    await ff.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
    });
  })();

  await loadingPromise;
  return ff;
}

export interface CompressionResult {
  videoFile: File;          // Compressed MP4 file ready for Firebase upload
  thumbnailFile: File;      // JPEG thumbnail extracted from first frame
  originalSizeMB: number;
  compressedSizeMB: number;
  compressionRatio: number; // e.g. 0.45 means 55% smaller
}

export interface CompressionProgress {
  stage: 'loading' | 'compressing' | 'thumbnail' | 'done';
  progress: number; // 0–100
  message: string;
}

/**
 * Compress a video file in the browser using FFmpeg.wasm.
 *
 * @param file        The raw video File from the file input
 * @param onProgress  Optional callback for progress updates
 */
export async function compressVideo(
  file: File,
  onProgress?: (p: CompressionProgress) => void
): Promise<CompressionResult> {
  const report = (stage: CompressionProgress['stage'], progress: number, message: string) => {
    onProgress?.({ stage, progress, message });
  };

  report('loading', 0, 'Loading video processor…');

  const ff = await getFFmpeg();

  // Listen to FFmpeg progress events
  ff.on('progress', ({ progress }) => {
    const pct = Math.round(Math.min(progress * 100, 99));
    report('compressing', pct, `Compressing… ${pct}%`);
  });

  const inputName = 'input' + getExtension(file.name);
  const outputName = 'output.mp4';
  const thumbName = 'thumb.jpg';

  report('loading', 10, 'Reading video file…');
  await ff.writeFile(inputName, await fetchFile(file));

  report('compressing', 15, 'Compressing video…');

  // Compression settings:
  // -vf scale: max 1280px wide, max 720px tall, preserve aspect ratio, ensure even dimensions
  // -crf 28: good quality / small size balance (lower = better quality, larger file)
  // -preset fast: fast encoding (good for browser)
  // -movflags +faststart: move moov atom to front for instant web playback
  // -c:a aac -b:a 128k: AAC audio at 128kbps
  await ff.exec([
    '-i', inputName,
    '-vf', 'scale=\'min(1280,iw)\':\'min(720,ih)\':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-c:v', 'libx264',
    '-crf', '28',
    '-preset', 'fast',
    '-profile:v', 'baseline',
    '-level', '3.1',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    '-y',
    outputName,
  ]);

  report('thumbnail', 97, 'Generating thumbnail…');

  // Extract thumbnail from the first frame
  await ff.exec([
    '-i', outputName,
    '-vframes', '1',
    '-q:v', '2',
    '-y',
    thumbName,
  ]);

  report('done', 100, 'Done!');

  // Read output files — copy to plain ArrayBuffer to avoid SharedArrayBuffer type issues
  const compressedRaw = await ff.readFile(outputName);
  const thumbRaw = await ff.readFile(thumbName);
  const compressedData = new Uint8Array(compressedRaw as Uint8Array);
  const thumbData = new Uint8Array(thumbRaw as Uint8Array);

  // Clean up FFmpeg virtual filesystem
  await ff.deleteFile(inputName).catch(() => {});
  await ff.deleteFile(outputName).catch(() => {});
  await ff.deleteFile(thumbName).catch(() => {});

  // Remove progress listener
  ff.off('progress', () => {});

  const baseName = file.name.replace(/\.[^.]+$/, '');
  const videoFile = new File([compressedData.buffer], `${baseName}_compressed.mp4`, { type: 'video/mp4' });
  const thumbnailFile = new File([thumbData.buffer], `${baseName}_thumb.jpg`, { type: 'image/jpeg' });

  const originalSizeMB = file.size / 1024 / 1024;
  const compressedSizeMB = videoFile.size / 1024 / 1024;

  return {
    videoFile,
    thumbnailFile,
    originalSizeMB,
    compressedSizeMB,
    compressionRatio: compressedSizeMB / originalSizeMB,
  };
}

function getExtension(filename: string): string {
  const match = filename.match(/\.[^.]+$/);
  return match ? match[0].toLowerCase() : '.mp4';
}

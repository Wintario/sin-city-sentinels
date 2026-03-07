import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import {
  deleteFile,
  getPublicUrl,
  getVideoThumbsDir,
  getVideosDir
} from '../utils/fileUtils.js';

const FFMPEG_BIN = process.env.FFMPEG_PATH || 'ffmpeg';
const FALLBACK_THUMBNAIL_URL = '/video-placeholder.svg';
const jobs = new Map();
const queue = [];
let workerBusy = false;

const runFfmpeg = (args) => {
  return new Promise((resolve, reject) => {
    const child = spawn(FFMPEG_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr || `ffmpeg exited with code ${code}`));
      }
    });
  });
};

const isFfmpegUnavailableError = (error) => {
  const code = error?.code;
  const message = String(error?.message || '');
  return (
    code === 'ENOENT' ||
    code === 'EPERM' ||
    code === 'EACCES' ||
    message.includes('ENOENT') ||
    message.includes('EPERM') ||
    message.includes('EACCES')
  );
};

const processJob = async (job) => {
  const outputBase = uuidv4();
  const outputVideo = path.join(getVideosDir(), `${outputBase}.mp4`);
  const outputThumb = path.join(getVideoThumbsDir(), `${outputBase}.jpg`);

  jobs.set(job.id, {
    ...jobs.get(job.id),
    status: 'processing',
    updatedAt: new Date().toISOString()
  });

  try {
    await runFfmpeg([
      '-y',
      '-i',
      job.tempPath,
      '-vf',
      "scale='min(1280,iw)':-2,fps=30",
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '24',
      '-movflags',
      '+faststart',
      '-map_metadata',
      '-1',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      outputVideo
    ]);

    await runFfmpeg([
      '-y',
      '-ss',
      '2',
      '-i',
      outputVideo,
      '-frames:v',
      '1',
      '-vf',
      'scale=640:-1',
      outputThumb
    ]);

    deleteFile(job.tempPath);

    jobs.set(job.id, {
      ...jobs.get(job.id),
      status: 'completed',
      updatedAt: new Date().toISOString(),
      result: {
        videoUrl: getPublicUrl(path.basename(outputVideo), 'videos'),
        thumbnailUrl: getPublicUrl(path.basename(outputThumb), 'video_thumbs')
      }
    });

    logger.info('Video job completed', {
      jobId: job.id,
      video: outputVideo
    });
  } catch (error) {
    const isFfmpegMissing = isFfmpegUnavailableError(error);

    if (isFfmpegMissing) {
      try {
        const sourceExt = path.extname(job.tempPath).toLowerCase();

        if (sourceExt !== '.mp4') {
          throw new Error('ffmpeg is required for non-mp4 uploads. Install ffmpeg or upload .mp4');
        }

        const passthroughVideo = path.join(getVideosDir(), `${outputBase}${sourceExt}`);
        fs.renameSync(job.tempPath, passthroughVideo);

        jobs.set(job.id, {
          ...jobs.get(job.id),
          status: 'completed',
          updatedAt: new Date().toISOString(),
          result: {
            videoUrl: getPublicUrl(path.basename(passthroughVideo), 'videos'),
            thumbnailUrl: FALLBACK_THUMBNAIL_URL
          }
        });

        logger.warn('ffmpeg not found, video saved without transcoding', {
          jobId: job.id,
          video: passthroughVideo
        });

        return;
      } catch (fallbackError) {
        error = fallbackError;
      }
    }

    deleteFile(job.tempPath);
    deleteFile(outputVideo);
    deleteFile(outputThumb);

    jobs.set(job.id, {
      ...jobs.get(job.id),
      status: 'failed',
      updatedAt: new Date().toISOString(),
      error: error.message
    });

    logger.error('Video job failed', {
      jobId: job.id,
      error: error.message
    });
  }
};

const runWorker = async () => {
  if (workerBusy) return;
  const nextJob = queue.shift();
  if (!nextJob) return;

  workerBusy = true;
  await processJob(nextJob);
  workerBusy = false;

  if (queue.length > 0) {
    setImmediate(runWorker);
  }
};

export const enqueueVideoProcessing = (tempPath, originalName, userId) => {
  const id = uuidv4();
  const job = {
    id,
    tempPath,
    originalName,
    userId,
    createdAt: new Date().toISOString()
  };

  jobs.set(id, {
    id,
    status: 'queued',
    createdAt: job.createdAt,
    updatedAt: job.createdAt
  });

  queue.push(job);
  setImmediate(runWorker);

  logger.info('Video job queued', { jobId: id, originalName, userId });
  return id;
};

export const getVideoJobStatus = (jobId) => {
  return jobs.get(jobId) || null;
};

export default {
  enqueueVideoProcessing,
  getVideoJobStatus
};

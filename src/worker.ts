import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { cloneRepository, segmentCriticalFiles, cleanupRepository } from './services/repo.service';

// TODO: Replace with secure environment variables for production
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;

const connection = new IORedis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
});

// Define the job processing function
const processJob = async (job: Job) => {
  const { repoUrl, encryptedToken, branch, commitHash } = job.data;
  let tempDir: string | null = null;

  try {
    console.log(`Starting job ${job.id}: Cloning ${repoUrl}`);
    const { tempDir: newTempDir } = await cloneRepository(repoUrl, encryptedToken, branch, commitHash);
    tempDir = newTempDir; // Assign to the outer scope for the finally block

    console.log(`Job ${job.id}: Analyzing repository at ${tempDir}`);
    const criticalFiles = await segmentCriticalFiles(tempDir);
    console.log(`Job ${job.id}: Found critical files:`, criticalFiles);

    // TODO: Construct Gemini prompt and get analysis
    // TODO: Save report to Firestore

    console.log(`Job ${job.id} completed successfully.`);
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    // Re-throw the error to let BullMQ handle the job failure
    throw error;
  } finally {
    if (tempDir) {
      console.log(`Job ${job.id}: Starting cleanup for ${tempDir}`);
      await cleanupRepository(tempDir);
    }
  }
};

// Create the worker
const worker = new Worker('compliance-checks', processJob, {
  connection,
  concurrency: 5, // Process up to 5 jobs concurrently
  limiter: {
    max: 10, // Max 10 jobs
    duration: 1000, // per second
  },
});

console.log('Worker is listening for jobs...');

worker.on('completed', (job) => {
  console.log(`Worker completed job ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`Worker failed job ${job.id} with error: ${err.message}`);
});

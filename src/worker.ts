// Load environment variables from .env as early as possible so modules that read
// process.env at import-time (like src/utils/crypto.ts) see the values.
import "dotenv/config";
import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import {
  cloneRepository,
  segmentCriticalFiles,
  cleanupRepository,
} from "./services/repo.service";
import { performComplianceAnalysis } from "./services/gemini.service";
import { saveComplianceReport } from "./services/firestore.service";

// TODO: Replace with secure environment variables for production
const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = process.env.REDIS_PORT
  ? parseInt(process.env.REDIS_PORT, 10)
  : 6379;

const connection = new IORedis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
});

// Define the job processing function
const processJob = async (job: Job) => {
  // We need appId and userId for Firestore paths, which would be in the job data.
  const { repoUrl, encryptedToken, branch, commitHash, appId, userId } =
    job.data;
  let tempDir: string | null = null;

  // Normalize and validate job id early so downstream calls can rely on a string id.
  const jobId = job.id?.toString();
  if (!jobId) {
    throw new Error(`Received a job without an id; cannot proceed.`);
  }

  if (!appId || !userId) {
    throw new Error(`Job ${jobId} is missing critical data: appId or userId.`);
  }

  try {
    console.log(`Starting job ${jobId}: Cloning ${repoUrl}`);
    const { tempDir: newTempDir } = await cloneRepository(
      repoUrl,
      encryptedToken,
      branch,
      commitHash
    );
    tempDir = newTempDir;
    console.log(`Job ${jobId}: Segmenting critical files in ${tempDir}`);
    const criticalFiles = await segmentCriticalFiles(tempDir);
    console.log(`Job ${jobId}: Found ${criticalFiles.length} critical files.`);

    console.log(`Job ${jobId}: Starting Gemini analysis...`);
    const report = await performComplianceAnalysis(criticalFiles);
    console.log(
      `Job ${jobId}: Gemini analysis complete. App status: ${report.app_status}`
    );

    console.log(`Job ${jobId}: Saving report to Firestore...`);
    await saveComplianceReport(appId, userId, jobId, report);

    console.log(`Job ${jobId} completed and report saved.`);
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    // Re-throw the error to let BullMQ handle the job failure
    throw error;
  } finally {
    if (tempDir) {
      console.log(`Job ${jobId}: Starting cleanup for ${tempDir}`);
      await cleanupRepository(tempDir);
    }
  }
};

// Create the worker
const worker = new Worker("compliance-checks", processJob, {
  connection,
  concurrency: 5, // Process up to 5 jobs concurrently
  limiter: {
    max: 10, // Max 10 jobs
    duration: 1000, // per second
  },
});

console.log("Worker is listening for jobs...");

worker.on("completed", (job) => {
  if (job && job.id) {
    console.log(`Worker completed job ${job.id}`);
  } else {
    console.log("Worker completed a job (job object unavailable)");
  }
});

worker.on("failed", (job, err) => {
  if (job && job.id) {
    console.error(
      `Worker failed job ${job.id} with error: ${err?.message ?? String(err)}`
    );
  } else {
    console.error(
      `Worker failed a job (job object unavailable) with error: ${
        err?.message ?? String(err)
      }`
    );
  }
});

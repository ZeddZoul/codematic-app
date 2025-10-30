import { simpleGit, SimpleGit } from 'simple-git';
import { promises as fs } from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import { decrypt } from '../utils/crypto';

// A simple in-memory store to track our temporary directories
const tempDirs = new Set<string>();

/**
 * Creates a secure temporary directory for cloning the repository.
 * @returns {Promise<string>} The path to the temporary directory.
 */
const createTempDir = async (): Promise<string> => {
  const dirPath = path.join('/tmp', `repo-scan-${Date.now()}`);
  await fs.mkdir(dirPath, { recursive: true });
  tempDirs.add(dirPath);
  return dirPath;
};

/**
 * Securely clones a repository to a temporary directory.
 * @param {string} repoUrl The URL of the repository.
 * @param {string} encryptedToken The encrypted authentication token.
 * @param {string} branch The branch to clone.
 * @param {string} commitHash The specific commit to checkout.
 * @returns {Promise<{git: SimpleGit, tempDir: string}>} An object containing the git instance and the temp directory path.
 */
export const cloneRepository = async (
  repoUrl: string,
  encryptedToken: string,
  branch: string,
  commitHash: string
): Promise<{ git: SimpleGit; tempDir: string }> => {
  const tempDir = await createTempDir();
  const decryptedToken = decrypt(encryptedToken);

  const git: SimpleGit = simpleGit(tempDir, {
    binary: 'git',
    maxConcurrentProcesses: 6,
  });

  // Inject the token for authentication
  const remote = `https://oauth2:${decryptedToken}@${repoUrl.replace('https://', '')}`;

  await git.clone(remote, tempDir, ['--branch', branch, '--single-branch', '--depth', '1']);

  if (commitHash !== 'latest') {
    await git.fetch('origin', commitHash);
    await git.checkout(commitHash);
  }

  return { git, tempDir };
};

/**
 * Recursively searches for files with specific names within a directory.
 * @param {string} dir The directory to search in.
 * @param {string[]} targetFiles The names of the files to search for.
 * @returns {Promise<string[]>} A list of full paths to the found files.
 */
const findFilesRecursively = async (dir: string, targetFiles: string[]): Promise<string[]> => {
    const foundFiles: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Avoid traversing into node_modules, .git, etc. for efficiency
            if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'vendor') {
                foundFiles.push(...await findFilesRecursively(fullPath, targetFiles));
            }
        } else if (targetFiles.includes(entry.name)) {
            foundFiles.push(fullPath);
        }
    }
    return foundFiles;
};


/**
 * Identifies and extracts critical files for analysis.
 * @param {string} tempDir The directory where the repo is cloned.
 * @returns {Promise<string[]>} A list of paths to critical files.
 */
export const segmentCriticalFiles = async (tempDir: string): Promise<string[]> => {
  const criticalFileNames = [
    'AndroidManifest.xml',
    'Info.plist',
    'package.json',
    'Gemfile',
    'Podfile',
    'build.gradle',
    'privacy.md', // Common privacy policy files
    'PRIVACY.md',
    'Privacy.md',
    'privacy.txt',
  ];

  return findFilesRecursively(tempDir, criticalFileNames);
};

/**
 * Reliably removes the temporary directory.
 * @param {string} tempDir The path to the directory to remove.
 */
export const cleanupRepository = async (tempDir: string): Promise<void> => {
  if (tempDirs.has(tempDir)) {
    await fse.remove(tempDir);
    tempDirs.delete(tempDir);
    console.log(`Successfully cleaned up temporary directory: ${tempDir}`);
  }
};

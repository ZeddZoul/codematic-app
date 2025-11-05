import { Request, Response } from "express";

import { encrypt } from "../utils/crypto";
import { saveRepoDetails } from "../services/mockdb.service";

interface ConnectRepoRequestBody {
  repoUrl: string;
  authType?: "github_oauth" | string;
  authToken?: string;
  token?: string; // Alternative name for authToken
  branch: string;
  userId?: string; // Allow userId to be passed in request
}

export const connectRepo = async (req: Request, res: Response) => {
  const {
    repoUrl,
    authType,
    authToken,
    token,
    branch,
    userId: requestUserId,
  } = req.body as ConnectRepoRequestBody;

  // Support both 'token' and 'authToken' field names
  const actualToken = authToken || token;

  if (!repoUrl || !actualToken || !branch) {
    return res
      .status(400)
      .json({
        message:
          "Missing required fields: repoUrl, token (or authToken), and branch",
      });
  }

  try {
    const encryptedToken = encrypt(actualToken);

    // The userId can come from the request body or the auth middleware
    const userId = requestUserId || (req as any).user?.id || "default-user-id";

    const repoId = await saveRepoDetails({
      repoUrl,
      encryptedToken,
      branch,
      userId,
    });

    res.status(201).json({ repoId, status: "Registered" });
  } catch (error) {
    console.error("Error connecting repo:", error);
    res.status(500).json({ message: "Failed to connect repository" });
  }
};

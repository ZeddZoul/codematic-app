import { Router } from "express";

const router = Router();

import { connectRepo } from "../controllers/repo.controller";

router.post("/connect", connectRepo);
router.post("/register", connectRepo); // Alias for connect

export default router;

import BackupController from "./backup.controller";
import { asyncWrapper } from "../../lib/utils";
import { authenticate } from "../../middleware/auth.middleware";
import { Router } from "express";

const router = Router();
const controller = new BackupController();

router.route("/:type").get(authenticate, asyncWrapper(controller.export));

export { router as backup_router };

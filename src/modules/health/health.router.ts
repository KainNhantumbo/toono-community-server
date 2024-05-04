import { Router } from "express";
import HealthController from "./health.controller";
import { asyncWrapper } from "../../lib/utils";

const router = Router();
const controller = new HealthController();

router.route("/").get(asyncWrapper(controller.getState));

export { router as health_router };

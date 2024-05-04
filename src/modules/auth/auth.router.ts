import { Router } from "express";
import { asyncWrapper } from "../../lib/utils";
import AuthController from "./auth.controller";

const router = Router();
const controller = new AuthController();

router.get("/revalidate", asyncWrapper(controller.revalidate));
router.post("/sign-in", asyncWrapper(controller.login));
router.post("/sign-out", asyncWrapper(controller.logout));

export { router as auth_router };

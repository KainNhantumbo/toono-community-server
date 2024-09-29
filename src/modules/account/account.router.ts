import { Router } from "express";
import AccountController from "./account.controller";
import { asyncWrapper } from "../../lib/utils";

const router = Router();
const controller = new AccountController();

router.get("/forgot-password", asyncWrapper(controller.sendInstructions));
router.get("/update-credentials", asyncWrapper(controller.sendInstructions));


export { router as account_router };
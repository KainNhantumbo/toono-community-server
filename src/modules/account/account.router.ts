import { Router } from "express";
import AccountController from "./account.controller";
import { asyncWrapper } from "../../lib/utils";

const router = Router();
const controller = new AccountController();

router
  .post("/forgot-password", asyncWrapper(controller.sendInstructions))
  .patch("/update-credentials", asyncWrapper(controller.updateCredentials));

export { router as account_router };

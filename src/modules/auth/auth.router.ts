import { Router } from "express";
import { asyncWrapper } from "../../lib/utils";
import AuthController from "./auth.controller";
import OauthController from "./auth.oauth.controller"

const router = Router();
const controller = new AuthController();
const oAuthController = new OauthController();

router.get("/revalidate", asyncWrapper(controller.revalidate));
router.get("/oauth/github/:code/:scope", asyncWrapper(oAuthController.github));
router.post("/sign-in", asyncWrapper(controller.login));
router.post("/sign-out", asyncWrapper(controller.logout));

export { router as auth_router };

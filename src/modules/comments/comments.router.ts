import CommentController from "./comments.controller";
import { asyncWrapper } from "../../lib/utils";
import { authenticate } from "../../middleware/auth.middleware";
import { Router } from "express";

const router = Router();
const controller = new CommentController();

router.route("/public/:postId").get(asyncWrapper(controller.findAll));

router
  .route("/:id")
  .post(authenticate, asyncWrapper(controller.create))
  .patch(authenticate, asyncWrapper(controller.update))
  .delete(authenticate, asyncWrapper(controller.delete));

export { router as comments_router };

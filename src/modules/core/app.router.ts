import { Router } from "express";
import { logger } from "../../lib/utils";

const router = Router();

router.route("*").all((req, res) => {
  if (process.env.NODE_ENV === "development") {
    logger.error(`The requested route [${req.url}] was not found.`);
  }

  res.status(404).json({
    code: 404,
    status: "Route not found.",
    message: "Route not found, check and try again."
  });
});

export { router as error_route };

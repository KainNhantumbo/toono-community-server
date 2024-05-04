import { Response, Request } from "express";

export default class HealthController {
  async getState(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      statusCode: 200,
      message: "Service active and running..."
    });
  }
}

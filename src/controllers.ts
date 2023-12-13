import { IntegratorService } from "./services";
import { RequestHandler } from "express-serve-static-core";

export class IntegratorController {
  static getIntegratorEvents: RequestHandler = async (req, res) => {
    try {
      const { address } = req.params;
      const events = await IntegratorService.getIntegratorEvents(address);
      res.status(200).json(events);
    } catch (e) {
      res.status(400).send(e instanceof Error ? e.message : "Unknown error");
    }
  };
}

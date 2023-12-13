import express from "express";
import { IntegratorController } from "./controllers";

export const createRouter = () => {
  const router = express.Router();

  router.get("/integrator/:address", IntegratorController.getIntegratorEvents);
  router.get("/health", (_, res) => res.sendStatus(200));
  return router;
};

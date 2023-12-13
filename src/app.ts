import express from "express";
import DB from "./db";

interface AppDependencies {
  router: express.Router;
  db: DB;
}
export default async function createApp({ router, db }: AppDependencies) {
  const app = express();
  await db.connect();
  app.use(router);

  return app;
}

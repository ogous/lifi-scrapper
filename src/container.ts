import {
  AwilixContainer,
  InjectionMode,
  asClass,
  asFunction,
  asValue,
  createContainer as createAwilixContainer,
} from "awilix";
import http from "http";
import createApp from "./app";
import ConfigManager, { Config } from "./config";
import { createRouter } from "./router";
import DB from "./db";
import { Router, Express } from "express";
import { SchedulerService } from "./services";

export interface ContainerDependencies {
  config: Config;
  db: DB;
  router: Router;
  app: Promise<Express>;
  scheduler: SchedulerService;
  server: http.Server;
}
interface ContainerOptions {
  startScheduler?: boolean;
}
export async function createContainer(
  opts: ContainerOptions = { startScheduler: true },
): Promise<AwilixContainer<ContainerDependencies>> {
  const container: AwilixContainer<ContainerDependencies> =
    createAwilixContainer({
      injectionMode: InjectionMode.PROXY,
    });
  const configManager = new ConfigManager();
  const config = configManager.load();

  container.register({
    config: asValue(config),
    db: asClass(DB),
    router: asFunction(createRouter).singleton(),
    app: asFunction(createApp).singleton(),
    scheduler: asClass(SchedulerService).singleton(),
  });

  const { app, scheduler } = container.cradle;
  container.register({
    server: asValue(http.createServer(await app)),
  });

  if (opts.startScheduler) scheduler.start();

  return container;
}

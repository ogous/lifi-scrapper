import { type ContainerDependencies, createContainer } from "../src/container";
import DB from "../src/db";
import { AwilixContainer } from "awilix";
import { Express } from "express";
import request from "supertest";

let container: AwilixContainer<ContainerDependencies>;
let db: DB;
let app: Express;
beforeEach(async () => {
  container = await createContainer({ startScheduler: false });
  db = container.cradle.db;
  app = await container.cradle.app;
});

describe("Health Check Endpoint", () => {
  it("check the status and body", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({});
  });
});

afterEach(async () => {
  if (db) {
    await db.close();
  }
});

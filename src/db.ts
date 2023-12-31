import mongoose from "mongoose";
import type { Config } from "./config";

export default class DB {
  private config: Config;
  constructor({ config }: { config: Config }) {
    this.config = config;
  }

  async connect() {
    try {
      await mongoose.connect(this.config.MONGO_URI, this.config.dbOptions);

      mongoose.set("debug", process.env.NODE_ENV !== "production");
    } catch (e) {
      console.error(e instanceof Error ? e.message : "Unkown error");
    }
  }

  async close() {
    try {
      await mongoose.connection.close();
    } catch (e) {
      console.error(
        "Error disconnecting from mongoose:",
        e instanceof Error ? e.message : "Unknown error",
      );
    }
  }
}

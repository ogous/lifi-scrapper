import z from "zod";

const envSchema = z.object({
  NODE_ENV: z.string(),
  APP_PORT: z.number(),
  APP_HOST: z.string(),
  MONGO_PORT: z.number(),
  MONGO_USER: z.string(),
  MONGO_PASSWORD: z.string(),
  MONGO_DBNAME: z.string(),
  MONGO_URI: z.string(),
  CRON_SCHEDULE: z.string(),
});

type EnvSchemaType = z.infer<typeof envSchema>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv extends EnvSchemaType {}
  }
}

const constSchema = z.object({
  dbOptions: z.object({
    dbName: z.string(),
    maxIdleTimeMS: z.number(),
    socketTimeoutMS: z.number(),
  }),
  contractAddress: z.string(),
  chainRPC: z.string().url(),
  minBlockNumber: z.number(),
  limitQuickNodeInfuraAlchemy: z.number(),
});

export type Config = z.infer<typeof envSchema> & z.infer<typeof constSchema>;

export default class ConfigManager {
  readonly config = {} as Config;

  constructor() {
    this.config.NODE_ENV = process.env.NODE_ENV;
    this.config.APP_PORT = Number(process.env.APP_PORT);
    this.config.APP_HOST = process.env.APP_HOST;
    this.config.MONGO_PORT = Number(process.env.MONGO_PORT);
    this.config.MONGO_USER = process.env.MONGO_USER;
    this.config.MONGO_PASSWORD = process.env.MONGO_PASSWORD;
    this.config.MONGO_DBNAME = process.env.MONGO_DBNAME;
    this.config.MONGO_URI = process.env.MONGO_URI;
    this.config.CRON_SCHEDULE = process.env.CRON_SCHEDULE;
    this.config.dbOptions = {
      dbName: process.env.MONGO_DBNAME,
      maxIdleTimeMS: 10000,
      socketTimeoutMS: 20000,
    };
    this.config.contractAddress = "0xbD6C7B0d2f68c2b7805d88388319cfB6EcB50eA9";
    this.config.chainRPC = "https://polygon-rpc.com";
    this.config.minBlockNumber = 47961368;
    this.config.limitQuickNodeInfuraAlchemy = 3000;
  }
  load() {
    const envServer = envSchema.safeParse({
      NODE_ENV: this.config.NODE_ENV,
      APP_PORT: this.config.APP_PORT,
      APP_HOST: this.config.APP_HOST,
      MONGO_PORT: this.config.MONGO_PORT,
      MONGO_USER: this.config.MONGO_USER,
      MONGO_PASSWORD: this.config.MONGO_PASSWORD,
      MONGO_DBNAME: this.config.MONGO_DBNAME,
      MONGO_URI: this.config.MONGO_URI,
      CRON_SCHEDULE: this.config.CRON_SCHEDULE,
    });

    if (!envServer.success) {
      console.error(envServer.error.issues);
      throw new Error(
        "There is an error with the server environment variables",
      );
    }

    const constServer = constSchema.safeParse({
      dbOptions: this.config.dbOptions,
      contractAddress: this.config.contractAddress,
      chainRPC: this.config.chainRPC,
      minBlockNumber: this.config.minBlockNumber,
      limitQuickNodeInfuraAlchemy: this.config.limitQuickNodeInfuraAlchemy,
    });

    if (!constServer.success) {
      console.error(constServer.error.issues);
      throw new Error("There is an error with the server constants");
    }

    return this.config;
  }
}

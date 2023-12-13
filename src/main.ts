import { createContainer } from "./container";

(async () => {
  const container = await createContainer();
  process.on("uncaughtException", (err) => {
    console.error(`Uncaught: ${err.message}`, err.toString());
    process.exit(1);
  });

  process.on("unhandledRejection", (err) => {
    console.error(
      `Unhandled: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
    process.exit(1);
  });

  const { server, config } = container.cradle;
  server.listen(config.APP_PORT, config.APP_HOST, () =>
    console.log("Server started at port", config.APP_PORT),
  );
})();

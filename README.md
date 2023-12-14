# Li.Fi Scrapper

- This is a tool that scrapes the contract for emitted `FeesCollected` event on a given chain
- Can be started at any time to retrieve new events
- Persists the data scanned and does not scan the same blocks again: see [Scraping Service](src/services.ts)
- Stores retrieved events in a [MongoDB](src/db.ts) database using [Typegoose](src/models.ts)
- Has a [REST endpoint](src/router.ts) that allows to retrieve all collected events for a given `integrator`
- Dockerized application: [Dockerfile](Dockerfile), [Docker Compose](compose.yaml)
- Built in TypeScript: run `yarn lint`

## Bonus

- Uses dependecy injection container [awilix](src/container.ts) for composable designs with isolated components
- Basic test suite setup with `Jest` and `Supertest`: run `yarn test`

## Environment Variables and configurations

Generate your `.env` file with the help of [.env.example](.env.example) file. Development command `yarn dev` and Docker [compose.yaml](compose.yaml) file targets `.env` file, change their configurations if you would like to use anything else. For other configurations, please check [src/config.ts](src/config.ts) file.

## How to develop on local machine

Install dependency packages with `yarn`. Start a MongoDB instance with `docker compose up db`. Execute `nvm use` it will set node.js version to lts. This is necessary because `--env-file=` feature is used. `yarn dev` to start development application.

## How to build & run with Docker

Read [README.Docker.md](README.Docker.md) for details.

## How does scraping work

- Checks last block number of selected chain and last scanned block number of scraping service recorded
- Sets a minimum block number (to `47961368` from [config](src/config.ts)) if scraping service does not record a block before
- Creates a loop depending on available block scan range
- Records scanned events, and last scanned block number to MongoDB
- Checks the progression to prevent possible concurrant cron jobs
- Can start/stop anytime with any cron scheduling but only works for progression in forward when a last scanned block number recorded.

## How it can be improved?

- Data queries can be optimized for bigger bulk of data instead of writing on every iteration of loop. This can be changed depending on block time, cron scheduling, events frequency, targetted block scan range and scan range limit. [Check the PR](https://github.com/ogous/lifi-scrapper/pull/1)

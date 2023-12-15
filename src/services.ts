import { BigNumber, ethers } from "ethers";
import { FeeCollector__factory } from "lifi-contract-types";
import { BlockTag } from "@ethersproject/abstract-provider";
import { FeeCollectedEvent, FeeEventModel, MetaDataModel } from "./models";
import type { Config } from "./config";
import { CronJob } from "cron";
import DB from "./db";

class ScrapingService {
  private inProgress = false;
  protected config;
  protected db;
  constructor({ config, db }: { config: Config; db: DB }) {
    this.config = config;
    this.db = db;
  }

  private loadFeeCollectorEvents = (
    fromBlock: BlockTag,
    toBlock: BlockTag,
  ): Promise<ethers.Event[]> => {
    const feeCollector = new ethers.Contract(
      this.config.contractAddress,
      FeeCollector__factory.createInterface(),
      new ethers.providers.JsonRpcProvider(this.config.chainRPC),
    );
    const filter = feeCollector.filters.FeesCollected();

    return feeCollector.queryFilter(filter, fromBlock, toBlock);
  };

  private parseFeeCollectorEvents = (
    events: ethers.Event[],
  ): FeeCollectedEvent[] => {
    const feeCollectorContract = new ethers.Contract(
      this.config.contractAddress,
      FeeCollector__factory.createInterface(),
      new ethers.providers.JsonRpcProvider(this.config.chainRPC),
    );

    return events.map((event) => {
      const parsedEvent = feeCollectorContract.interface.parseLog(event);

      const feesCollected: FeeCollectedEvent = {
        token: parsedEvent.args[0],
        integrator: parsedEvent.args[1],
        integratorFee: BigNumber.from(parsedEvent.args[2]).toString(),
        lifiFee: BigNumber.from(parsedEvent.args[3]).toString(),
      };
      return feesCollected;
    });
  };

  private getMetaData() {
    return MetaDataModel.findOne().lean().exec();
  }

  private getBlockNumber() {
    const provider = new ethers.providers.JsonRpcProvider(this.config.chainRPC);
    return provider.getBlockNumber();
  }

  private updateMetaData(lastScannedBlock: number) {
    return MetaDataModel.updateOne(
      {},
      {
        updatedAt: new Date().toISOString(),
        lastScannedBlock,
      },
      { upsert: true },
    ).exec();
  }

  private async handleEvents(lastScannedBlock: number) {
    const events = await this.loadFeeCollectorEvents(
      lastScannedBlock + 1,
      lastScannedBlock + 1 + this.config.limitQuickNodeInfuraAlchemy,
    );

    if (events.length > 0) {
      const parsedEvents = this.parseFeeCollectorEvents(events);
      await FeeEventModel.insertMany(parsedEvents);
    }
  }

  scrape = async () => {
    let session;
    if (this.inProgress) {
      return console.log("SCRAPING IN PROGRES");
    }
    try {
      this.inProgress = true;
      const metadata = await this.getMetaData();
      let lastScannedBlock =
        metadata?.lastScannedBlock ?? this.config.minBlockNumber;
      const blockNumber = await this.getBlockNumber();

      while (blockNumber > lastScannedBlock) {
        session = await this.db.startSession();
        session.startTransaction();
        await this.handleEvents(lastScannedBlock);

        lastScannedBlock += 1 + this.config.limitQuickNodeInfuraAlchemy;

        await this.updateMetaData(
          lastScannedBlock > blockNumber ? blockNumber : lastScannedBlock,
        );
        await session.commitTransaction();
      }
    } catch (e) {
      console.error(e instanceof Error ? e.message : "Unknown error");
    } finally {
      await session?.endSession();
      this.inProgress = false;
    }
  };
}

class SchedulerService extends ScrapingService {
  private readonly job: CronJob;
  constructor({ config, db }: { config: Config; db: DB }) {
    super({ config, db });
    this.job = new CronJob(this.config.CRON_SCHEDULE, this.scrape);
    process.on("SIGTERM", this.stop);
    process.on("beforeExit", this.stop);
  }

  start() {
    this.job.start();
  }
  stop() {
    this.job.stop();
  }
}

class IntegratorService {
  static getIntegratorEvents = (integrator: string) => {
    return FeeEventModel.find({ integrator }).lean().exec();
  };
}

export { IntegratorService, SchedulerService };

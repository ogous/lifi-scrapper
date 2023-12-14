import { BigNumber, ethers } from "ethers";
import { FeeCollector__factory } from "lifi-contract-types";
import { BlockTag } from "@ethersproject/abstract-provider";
import { FeeCollectedEvent, FeeEventModel, MetaDataModel } from "./models";
import type { Config } from "./config";
import { CronJob } from "cron";

class ScrapingService {
  private inProgress = false;

  constructor(protected config: Config) {}

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

  private insertEvents(batch: ReturnType<typeof this.parseFeeCollectorEvents>) {
    return FeeEventModel.insertMany(batch);
  }

  private async handleEvents(lastScannedBlock: number) {
    const events = await this.loadFeeCollectorEvents(
      lastScannedBlock + 1,
      lastScannedBlock + 1 + this.config.limitQuickNodeInfuraAlchemy,
    );

    if (events.length > 0) {
      const parsedEvents = this.parseFeeCollectorEvents(events);
      return parsedEvents;
    }
  }

  scrape = async () => {
    if (this.inProgress) {
      return console.log("SCRAPING IN PROGRES");
    }
    try {
      this.inProgress = true;
      const metadata = await this.getMetaData();
      let lastScannedBlock =
        metadata?.lastScannedBlock ?? this.config.minBlockNumber;
      const blockNumber = await this.getBlockNumber();

      const batch = [];
      while (blockNumber > lastScannedBlock) {
        const events = await this.handleEvents(lastScannedBlock);

        lastScannedBlock += 1 + this.config.limitQuickNodeInfuraAlchemy;
        if (events)
          batch.push(...events.map((e) => ({ lastScannedBlock, ...e })));
      }
      const mongoBatchLimit = 100000;

      while (batch.length > 0) {
        const currentBatch = batch.splice(0, mongoBatchLimit);
        await this.insertEvents(
          currentBatch.map((e) => {
            const event = Object.assign({}, e) as FeeCollectedEvent & {
              lastScannedBlock?: number;
            };
            delete event.lastScannedBlock;
            return event;
          }),
        );
        await this.updateMetaData(
          currentBatch[currentBatch.length - 1].lastScannedBlock,
        );
      }
    } catch (e) {
      console.error(e instanceof Error ? e.message : "Unknown error");
    } finally {
      this.inProgress = false;
    }
  };
}

class SchedulerService extends ScrapingService {
  private readonly job: CronJob;
  constructor({ config }: { config: Config }) {
    super(config);
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

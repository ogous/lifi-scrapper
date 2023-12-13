import { prop, getModelForClass } from "@typegoose/typegoose";
class FeeCollectedEvent {
  @prop({ type: () => String, required: true })
  public token!: string;

  @prop({ type: () => String, required: true })
  public integrator!: string;

  @prop({ type: () => String, required: true })
  public integratorFee!: string;

  @prop({ type: () => String, required: true })
  public lifiFee!: string;
}

const FeeEventModel = getModelForClass(FeeCollectedEvent);

class MetaData {
  @prop({ type: () => Number, required: true })
  public lastScannedBlock!: number;

  @prop({ type: () => String, required: true })
  public updatedAt!: string;
}

const MetaDataModel = getModelForClass(MetaData);

export { FeeEventModel, FeeCollectedEvent, MetaData, MetaDataModel };

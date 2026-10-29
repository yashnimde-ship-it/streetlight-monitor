import mongoose from 'mongoose';

// Single document holding the assumptions used in energy calculations.
const settingsSchema = new mongoose.Schema(
  {
    operatingHoursPerDay: { type: Number, default: 12, min: 0, max: 24 },
    tariffPerKwh: { type: Number, default: 7, min: 0 },
    // India grid average emission factor (kg CO2 per kWh); adjust to the latest CEA figure.
    co2KgPerKwh: { type: Number, default: 0.71, min: 0 },
    // Estimated power reduction when a non-LED lamp is replaced with an equivalent LED.
    ledSavingPercent: { type: Number, default: 50, min: 0, max: 100 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

settingsSchema.statics.getSingleton = async function getSingleton() {
  return (await this.findOne()) ?? this.create({});
};

export const Settings = mongoose.model('Settings', settingsSchema);

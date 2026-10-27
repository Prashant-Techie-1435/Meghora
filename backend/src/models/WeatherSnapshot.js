import mongoose from 'mongoose';

const weatherSnapshotSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    temperature: {
      type: Number,
    },
    apparentTemperature: {
      type: Number,
    },
    relativeHumidity: {
      type: Number,
    },
    windSpeed: {
      type: Number,
    },
    weatherCondition: {
      type: String,
    },
    weatherIcon: {
      type: String,
    },
    metrics: {
      type: mongoose.Schema.Types.Mixed,
    },
    dataSource: {
      type: String,
      default: 'Open-Meteo',
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
      // Automatic expiration after 30 minutes (1800 seconds) for sensible caching
      expires: 1800,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index on city (case-insensitive)
weatherSnapshotSchema.index({ city: 1 });

export const WeatherSnapshot = mongoose.model('WeatherSnapshot', weatherSnapshotSchema);
export default WeatherSnapshot;

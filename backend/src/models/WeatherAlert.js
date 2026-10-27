import mongoose from 'mongoose';

const weatherAlertSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    event: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    headline: {
      type: String,
      required: [true, 'Headline is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: {
        values: ['severe', 'warning', 'watch', 'advisory'],
        message: 'severity must be one of: severe, warning, watch, advisory',
      },
      default: 'advisory',
      index: true,
    },
    is_verified: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      default: 'Regional Meteorological Department',
      trim: true,
    },
    precautions: {
      type: [String],
      default: [],
    },
    effective_from: {
      type: Date,
      default: Date.now,
    },
    effective_to: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        ret.title = ret.event;
        ret.startTime = ret.effective_from;
        ret.endTime = ret.effective_to;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        ret.title = ret.event;
        ret.startTime = ret.effective_from;
        ret.endTime = ret.effective_to;
        return ret;
      },
    },
  }
);

// Virtual aliases
weatherAlertSchema.virtual('title').get(function () {
  return this.event;
}).set(function (val) {
  this.event = val;
});

weatherAlertSchema.virtual('startTime').get(function () {
  return this.effective_from;
}).set(function (val) {
  this.effective_from = val;
});

weatherAlertSchema.virtual('endTime').get(function () {
  return this.effective_to;
}).set(function (val) {
  this.effective_to = val;
});

export const WeatherAlert = mongoose.model('WeatherAlert', weatherAlertSchema);
export default WeatherAlert;

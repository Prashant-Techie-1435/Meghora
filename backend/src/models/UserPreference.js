import mongoose from 'mongoose';

const SUPPORTED_PROFILES = [
  'health',
  'outdoor_fitness',
  'beach',
  'travel',
  'family',
  'agriculture',
  'commuter',
  'event_planner',
];

const userPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'userId is required'],
      unique: true,
      trim: true,
      index: true,
    },
    preferred_city: {
      type: String,
      trim: true,
      default: 'Mumbai',
    },
    temperature_unit: {
      type: String,
      enum: {
        values: ['celsius', 'fahrenheit'],
        message: 'temperature_unit must be either celsius or fahrenheit',
      },
      default: 'celsius',
    },
    language: {
      type: String,
      trim: true,
      default: 'en',
    },
    profiles: {
      type: [String],
      validate: {
        validator: function (v) {
          if (!Array.isArray(v)) return false;
          return v.every((p) => SUPPORTED_PROFILES.includes(p));
        },
        message: (props) => `One or more selected profiles are invalid. Supported: ${SUPPORTED_PROFILES.join(', ')}`,
      },
      default: ['health', 'commuter', 'outdoor_fitness'],
    },
    categories: {
      type: [String],
      default: ['health', 'commute', 'fitness'],
    },
    notifications: {
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        // Provide backwards-compatible field aliases
        ret.user_id = ret.userId;
        ret.city = ret.preferred_city;
        ret.unit = ret.temperature_unit;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        ret.user_id = ret.userId;
        ret.city = ret.preferred_city;
        ret.unit = ret.temperature_unit;
        return ret;
      },
    },
  }
);

// Virtual aliases
userPreferenceSchema.virtual('city').get(function () {
  return this.preferred_city;
}).set(function (val) {
  this.preferred_city = val;
});

userPreferenceSchema.virtual('unit').get(function () {
  return this.temperature_unit;
}).set(function (val) {
  this.temperature_unit = val;
});

userPreferenceSchema.virtual('user_id').get(function () {
  return this.userId;
}).set(function (val) {
  this.userId = val;
});

export const UserPreference = mongoose.model('UserPreference', userPreferenceSchema);
export default UserPreference;

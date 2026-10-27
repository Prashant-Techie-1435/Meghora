import mongoose from 'mongoose';

const savedLocationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'userId is required'],
      trim: true,
      index: true,
    },
    city_name: {
      type: String,
      required: [true, 'city_name is required'],
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: 'India',
    },
    latitude: {
      type: Number,
      required: [true, 'latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'longitude is required'],
    },
    is_favorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        ret.user_id = ret.userId;
        ret.city = ret.city_name;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        ret.user_id = ret.userId;
        ret.city = ret.city_name;
        return ret;
      },
    },
  }
);

// Virtual alias
savedLocationSchema.virtual('city').get(function () {
  return this.city_name;
}).set(function (val) {
  this.city_name = val;
});

// Prevent duplicate saved cities for the same user (case-insensitive unique index)
savedLocationSchema.index(
  { userId: 1, city_name: 1 },
  {
    unique: true,
    collation: { locale: 'en', strength: 2 }, // Case-insensitive collation
  }
);

export const SavedLocation = mongoose.model('SavedLocation', savedLocationSchema);
export default SavedLocation;

import mongoose from 'mongoose';

/**
 * Utility to safely sanitize connection string for logging (masks user:password)
 */
function sanitizeMongoUri(uri) {
  if (!uri) return '';
  return uri.replace(/\/\/[^@]+@/, '//***:***@');
}

let isConnecting = false;

/**
 * Connect to MongoDB using Mongoose
 */
export async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) {
    const errorMsg = 'MONGODB_URI environment variable is missing. Set it in your backend .env file.';
    console.error(`[Database Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // If already connected, return existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) {
    return mongoose.connection;
  }

  try {
    isConnecting = true;
    const sanitized = sanitizeMongoUri(uri);
    console.log(`[Database] Connecting to MongoDB: ${sanitized}`);

    // Set connection timeout to 4 seconds and buffer timeout to 2.5 seconds
    mongoose.set('bufferTimeoutMS', 2500);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
    });

    console.log('[Database] MongoDB connection established successfully.');
    return mongoose.connection;
  } catch (err) {
    console.error(`[Database Connection Error]: ${err.message}`);
    throw err;
  } finally {
    isConnecting = false;
  }
}

/**
 * Disconnect from MongoDB gracefully
 */
export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      console.log('[Database] MongoDB connection closed gracefully.');
    } catch (err) {
      console.error('[Database Disconnect Error]:', err.message);
    }
  }
}

/**
 * Check if MongoDB is connected and ready
 */
export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Get accurate database connection status for health checks
 */
export function getDatabaseStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const state = states[mongoose.connection.readyState] || 'unknown';
  return {
    status: state === 'connected' ? 'connected' : 'disconnected',
    readyState: mongoose.connection.readyState,
    state,
    databaseName: mongoose.connection.name || null,
  };
}

export default {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
  getDatabaseStatus,
};

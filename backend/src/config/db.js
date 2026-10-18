const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log(`[MongoDB] Connected: ${conn.connection.host} / ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error] ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

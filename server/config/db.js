import mongoose from 'mongoose';

export default async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cybershield';
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB:', uri);
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('⚠️  Server will continue but database features will be unavailable');
    return false;
  }
}

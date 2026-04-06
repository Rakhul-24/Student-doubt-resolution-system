import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Doubt from './models/Doubt.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-doubt-resolution').then(async () => {
  const doubts = await Doubt.find({});
  doubts.forEach(d => {
    console.log(`- ID: ${d._id}, Status: ${d.status}, Reply: >${d.reply}< (Type: ${typeof d.reply})`);
  });
  mongoose.connection.close();
});

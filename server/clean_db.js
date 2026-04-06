import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-doubt-resolution').then(async () => {
  const users = await User.find({ role: 'staff' });
  for (const user of users) {
    if (user.subject !== (user.subject || '').trim()) {
      console.log(`Fixing subject for ${user.email} from '${user.subject}' to '${user.subject.trim()}'`);
      user.subject = user.subject.trim();
      await user.save();
    }
  }
  console.log('Done cleaning staff subjects.');
  mongoose.connection.close();
});

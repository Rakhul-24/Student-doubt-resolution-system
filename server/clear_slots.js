import mongoose from 'mongoose';
import Slot from './models/Slot.js';
import Doubt from './models/Doubt.js';

mongoose.connect('mongodb://localhost:27017/student-doubt-resolution').then(async () => {
    await Slot.deleteMany({});
    console.log('Deleted all old slots');
    await Doubt.deleteMany({});
    console.log('Deleted all old doubts');
    process.exit(0);
});

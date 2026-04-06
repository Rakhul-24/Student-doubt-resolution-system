import mongoose from 'mongoose';
import Slot from './models/Slot.js';
import Doubt from './models/Doubt.js';

import dotenv from 'dotenv';

dotenv.config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    await Slot.deleteMany({});
    console.log('Deleted all old slots');
    await Doubt.deleteMany({});
    console.log('Deleted all old doubts');
    process.exit(0);
});

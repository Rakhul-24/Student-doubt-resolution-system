import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const slotSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    doubtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doubt',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      default: 30, // in minutes
    },
    status: {
      type: String,
      enum: ['Pending Student Confirmation', 'Confirmed'],
      default: 'Pending Student Confirmation',
    },
    shareableLink: {
      type: String,
      default: uuidv4,
      unique: true
    },
    topic: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Slot', slotSchema);

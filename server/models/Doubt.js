import mongoose from 'mongoose';

const doubtSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    targetStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    question: {
      type: String,
      required: true,
    },
    requestSlot: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Open', 'Slot Scheduled', 'Resolved'],
      default: 'Open',
    },
    assignedSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      default: null,
    },
    resolvingStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reply: {
      type: String,
      default: '',
    }
  },
  { timestamps: true }
);

export default mongoose.model('Doubt', doubtSchema);

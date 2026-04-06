import Doubt from '../models/Doubt.js';
import User from '../models/User.js';

export const createDoubt = async (req, res) => {
  try {
    const { subject, targetStaffId, question, requestSlot } = req.body;
    let resolvedSubject = subject?.trim();

    if (!question?.trim()) {
      return res.status(400).json({ error: 'Subject and question are required' });
    }

    if (!resolvedSubject && targetStaffId) {
      const targetStaff = await User.findById(targetStaffId).select('subject');
      if (!targetStaff) {
        return res.status(404).json({ error: 'Selected staff member was not found' });
      }
      resolvedSubject = targetStaff.subject;
    }

    if (!resolvedSubject) {
      return res.status(400).json({ error: 'Subject and question are required' });
    }

    const doubt = new Doubt({
      studentId: req.userId,
      subject: resolvedSubject,
      targetStaffId: targetStaffId || null,
      question: question.trim(),
      requestSlot: !!requestSlot,
    });

    await doubt.save();
    await doubt.populate('targetStaffId', 'name email');

    if (req.app.get('io')) {
      req.app.get('io').emit('doubt_updated');
    }

    res.status(201).json({ success: true, doubt });
  } catch (error) {
    console.error('Create doubt error:', error);
    res.status(500).json({ error: 'Failed to create doubt' });
  }
};

export const getStudentDoubts = async (req, res) => {
  try {
    const doubts = await Doubt.find({ studentId: req.userId })
      .populate('targetStaffId resolvingStaffId', 'name')
      .populate('assignedSlotId')
      .sort({ createdAt: -1 });

    res.json({ success: true, doubts });
  } catch (error) {
    console.error('Get student doubts error:', error);
    res.status(500).json({ error: 'Failed to fetch your doubts' });
  }
};

export const getStaffDoubts = async (req, res) => {
  try {
    const staff = await User.findById(req.userId);
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    const doubts = await Doubt.find({
      $or: [
        { targetStaffId: req.userId },
        { targetStaffId: null, subject: { $regex: new RegExp(`^${(staff.subject || '').trim()}$`, 'i') } },
      ],
    })
      .populate('studentId targetStaffId resolvingStaffId', 'name email')
      .populate('assignedSlotId')
      .sort({ createdAt: -1 });

    res.json({ success: true, doubts });
  } catch (error) {
    console.error('Get staff doubts error:', error);
    res.status(500).json({ error: 'Failed to fetch assigned doubts' });
  }
};

export const updateDoubtStatus = async (req, res) => {
  try {
    const { doubtId } = req.params;
    const { status, assignedSlotId, reply } = req.body;

    const doubt = await Doubt.findById(doubtId);
    if (!doubt) {
      return res.status(404).json({ error: 'Doubt not found' });
    }

    doubt.status = status || doubt.status;
    if (assignedSlotId !== undefined) {
      doubt.assignedSlotId = assignedSlotId;
    }
    if (reply !== undefined) {
      doubt.reply = reply;
    }
    doubt.resolvingStaffId = req.userId;

    await doubt.save();

    if (req.app.get('io')) {
      req.app.get('io').emit('doubt_updated');
    }

    res.json({ success: true, doubt });
  } catch (error) {
    console.error('Update doubt error:', error);
    res.status(500).json({ error: 'Failed to update doubt' });
  }
};

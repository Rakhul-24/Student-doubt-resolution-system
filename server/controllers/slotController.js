import Slot from '../models/Slot.js';
import Doubt from '../models/Doubt.js';

const getSlotDateTime = (date, time) => {
  if (!date || !time) return null;
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  const slotDateTime = new Date(`${date}T${normalizedTime}`);
  return Number.isNaN(slotDateTime.getTime()) ? null : slotDateTime;
};

const isSlotExpired = (date, time) => {
  const slotDateTime = getSlotDateTime(date, time);
  if (!slotDateTime) return true;
  return slotDateTime <= new Date();
};

const slotHasStudent = (slot, userId) =>
  slot.studentIds.some((studentId) => studentId.toString() === userId);

export const createSlotForDoubt = async (req, res) => {
  try {
    const { doubtId, date, time, duration, topic, notes } = req.body;

    if (!date || !time || !doubtId) {
      return res.status(400).json({ error: 'Doubt ID, date, and time are required' });
    }

    if (isSlotExpired(date, time)) {
      return res.status(400).json({ error: 'Slot schedule must be a future date and time' });
    }

    const doubt = await Doubt.findById(doubtId);
    if (!doubt) {
      return res.status(404).json({ error: 'Doubt not found' });
    }

    const slot = new Slot({
      staffId: req.userId,
      studentIds: [doubt.studentId],
      doubtId,
      date,
      time,
      duration: duration || 30,
      topic: topic || doubt.subject,
      notes: notes || '',
      status: 'Pending Student Confirmation',
    });

    await slot.save();
    
    doubt.status = 'Slot Scheduled';
    doubt.assignedSlotId = slot._id;
    doubt.resolvingStaffId = req.userId;
    await doubt.save();

    await slot.populate('staffId studentIds', 'name email subject');
    if (req.app.get('io')) req.app.get('io').emit('slot_updated');

    res.status(201).json({ success: true, slot });
  } catch (error) {
    console.error('Create slot error:', error);
    res.status(500).json({ error: 'Failed to create slot' });
  }
};

export const getStaffSlots = async (req, res) => {
  try {
    const slots = await Slot.find({ staffId: req.userId })
      .populate('studentIds', 'name email')
      .populate('doubtId')
      .sort({ date: 1, time: 1 });

    res.json({ success: true, slots });
  } catch (error) {
    console.error('Get staff slots error:', error);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
};

export const getStudentSlots = async (req, res) => {
  try {
    const slots = await Slot.find({ studentIds: req.userId })
      .populate('staffId', 'name email subject')
      .populate('doubtId')
      .sort({ date: 1, time: 1 });

    res.json({ success: true, slots });
  } catch (error) {
    console.error('Get student slots error:', error);
    res.status(500).json({ error: 'Failed to fetch your slots' });
  }
};

export const getSlotByLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const slot = await Slot.findOne({ shareableLink: linkId })
      .populate('staffId', 'name subject avatar')
      .populate('doubtId');

    if (!slot) {
      return res.status(404).json({ error: 'Invalid or expired slot link' });
    }

    res.json({ success: true, slot });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slot details' });
  }
};

export const joinSlotViaLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const slot = await Slot.findOne({ shareableLink: linkId });

    if (!slot) return res.status(404).json({ error: 'Invalid or expired slot link' });

    if (isSlotExpired(slot.date, slot.time)) {
      return res.status(400).json({ error: 'Slot time has already passed' });
    }

    if (slotHasStudent(slot, req.userId)) {
      return res.status(400).json({ error: 'You have already joined this session.' });
    }

    slot.studentIds.push(req.userId);
    await slot.save();

    if (req.app.get('io')) req.app.get('io').emit('slot_updated');
    
    await slot.populate('staffId', 'name email subject');
    res.json({ success: true, message: 'Successfully joined session', slot });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join slot' });
  }
};

export const confirmSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const slot = await Slot.findById(slotId);
    
    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    
    if (!slotHasStudent(slot, req.userId)) {
       return res.status(403).json({ error: 'You are not authorized to confirm this slot.'});
    }

    slot.status = 'Confirmed';
    await slot.save();
    if (req.app.get('io')) req.app.get('io').emit('slot_updated');

    res.json({ success: true, slot });
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm slot' });
  }
};

export const deleteSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const slot = await Slot.findByIdAndDelete(slotId);
    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    
    if (slot.doubtId) {
       const doubt = await Doubt.findById(slot.doubtId);
       if (doubt) {
         doubt.status = 'Open';
         doubt.assignedSlotId = null;
         await doubt.save();
       }
    }
    if (req.app.get('io')) req.app.get('io').emit('slot_updated');

    res.json({ success: true, message: 'Slot deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete slot' });
  }
};

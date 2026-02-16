import Slot from '../models/Slot.js';

export const createSlot = async (req, res) => {
  try {
    const { date, time, duration, topic } = req.body;

    if (!date || !time) {
      return res.status(400).json({ error: 'Date and time are required' });
    }

    const slot = new Slot({
      staffId: req.userId,
      date,
      time,
      duration: duration || 30,
      topic: topic || '',
      status: 'Available',
    });

    await slot.save();
    await slot.populate('staffId', 'name email subject');

    res.status(201).json({
      success: true,
      message: 'Slot created successfully',
      slot,
    });
  } catch (error) {
    console.error('Create slot error:', error);
    res.status(500).json({ error: 'Failed to create slot' });
  }
};

export const getStaffSlots = async (req, res) => {
  try {
    const slots = await Slot.find({ staffId: req.userId })
      .populate('studentId', 'name email')
      .sort({ date: 1, time: 1 });

    res.json({ success: true, slots });
  } catch (error) {
    console.error('Get staff slots error:', error);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
};

export const getAvailableSlots = async (req, res) => {
  try {
    const slots = await Slot.find({ status: 'Available' })
      .populate('staffId', 'name email subject')
      .sort({ date: 1, time: 1 });

    res.json({ success: true, slots });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
};

export const getStudentSlots = async (req, res) => {
  try {
    const slots = await Slot.find({ studentId: req.userId })
      .populate('staffId', 'name email subject')
      .sort({ date: 1, time: 1 });

    res.json({ success: true, slots });
  } catch (error) {
    console.error('Get student slots error:', error);
    res.status(500).json({ error: 'Failed to fetch booked slots' });
  }
};

export const bookSlot = async (req, res) => {
  try {
    const { slotId } = req.body;

    if (!slotId) {
      return res.status(400).json({ error: 'Slot ID is required' });
    }

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    if (slot.status === 'Booked') {
      return res.status(400).json({ error: 'Slot is already booked' });
    }

    slot.studentId = req.userId;
    slot.status = 'Booked';
    await slot.save();
    await slot.populate('staffId studentId', 'name email');

    res.json({
      success: true,
      message: 'Slot booked successfully',
      slot,
    });
  } catch (error) {
    console.error('Book slot error:', error);
    res.status(500).json({ error: 'Failed to book slot' });
  }
};

export const updateSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { date, time, duration, topic, status } = req.body;

    const slot = await Slot.findByIdAndUpdate(
      slotId,
      { date, time, duration, topic, status },
      { new: true }
    ).populate('staffId studentId', 'name email');

    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    res.json({
      success: true,
      message: 'Slot updated successfully',
      slot,
    });
  } catch (error) {
    console.error('Update slot error:', error);
    res.status(500).json({ error: 'Failed to update slot' });
  }
};

export const deleteSlot = async (req, res) => {
  try {
    const { slotId } = req.params;

    const slot = await Slot.findByIdAndDelete(slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    res.json({ success: true, message: 'Slot deleted successfully' });
  } catch (error) {
    console.error('Delete slot error:', error);
    res.status(500).json({ error: 'Failed to delete slot' });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { slotId } = req.params;

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    if (slot.studentId.toString() !== req.userId) {
      return res.status(403).json({ error: 'You can only cancel your own bookings' });
    }

    slot.studentId = null;
    slot.status = 'Available';
    await slot.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      slot,
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

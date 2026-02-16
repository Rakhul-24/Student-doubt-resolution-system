import express from 'express';
import {
  createSlot,
  getStaffSlots,
  getAvailableSlots,
  getStudentSlots,
  bookSlot,
  updateSlot,
  deleteSlot,
  cancelBooking,
} from '../controllers/slotController.js';
import { authMiddleware, staffOnly, studentOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Staff routes
router.post('/create', authMiddleware, staffOnly, createSlot);
router.get('/staff', authMiddleware, staffOnly, getStaffSlots);
router.put('/:slotId', authMiddleware, staffOnly, updateSlot);
router.delete('/:slotId', authMiddleware, staffOnly, deleteSlot);

// Student routes
router.get('/available', authMiddleware, studentOnly, getAvailableSlots);
router.get('/my-slots', authMiddleware, studentOnly, getStudentSlots);
router.post('/book', authMiddleware, studentOnly, bookSlot);
router.post('/:slotId/cancel', authMiddleware, studentOnly, cancelBooking);

export default router;

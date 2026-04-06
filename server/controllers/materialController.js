import Material from '../models/Material.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/materials/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // increased limit to 50MB for video
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|jpg|jpeg|png|gif|mp4|webm|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, Docs, PPT, Images, Video (MP4/WebM).'));
    }
  }
}).single('file');

export const uploadMaterial = async (req, res) => {
  console.log('Upload material called');
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { title, description, subject, topic } = req.body;
      const fileUrl = req.file ? `/uploads/materials/${req.file.filename}` : null;

      if (!title || !subject || !fileUrl) {
        console.log('Validation failed:', { title, subject, fileUrl });
        return res.status(400).json({ error: 'Title, subject, and file are required. Please select a file to upload.' });
      }

      const fileType = path.extname(req.file.originalname).toLowerCase().replace('.', '');

      const material = new Material({
        staffId: req.userId,
        title,
        description,
        subject,
        topic,
        fileUrl,
        fileType: fileType || 'pdf',
      });

      await material.save();
      await material.populate('staffId', 'name email subject');

      res.status(201).json({
        success: true,
        message: 'Material uploaded successfully',
        material,
      });
    } catch (error) {
      console.error('Upload material error:', error);
      res.status(500).json({ error: 'Failed to upload material' });
    }
  });
};

export const getAllMaterials = async (req, res) => {
  try {
    const materials = await Material.find()
      .populate('staffId', 'name email subject')
      .sort({ uploadedAt: -1 });

    res.json({ success: true, materials });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
};

export const getStaffMaterials = async (req, res) => {
  try {
    const materials = await Material.find({ staffId: req.userId }).sort({
      uploadedAt: -1,
    });

    res.json({ success: true, materials });
  } catch (error) {
    console.error('Get staff materials error:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
};

export const updateMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { title, description, subject, topic, fileUrl, fileType } = req.body;

    const material = await Material.findByIdAndUpdate(
      materialId,
      { title, description, subject, topic, fileUrl, fileType },
      { new: true }
    ).populate('staffId', 'name email subject');

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({
      success: true,
      message: 'Material updated successfully',
      material,
    });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Failed to update material' });
  }
};

export const deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;

    const material = await Material.findByIdAndDelete(materialId);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
};

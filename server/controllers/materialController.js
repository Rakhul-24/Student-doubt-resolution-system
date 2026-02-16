import Material from '../models/Material.js';

export const uploadMaterial = async (req, res) => {
  try {
    const { title, description, subject, topic, fileUrl, fileType } = req.body;

    if (!title || !subject || !fileUrl) {
      return res.status(400).json({ error: 'Title, subject, and file URL are required' });
    }

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

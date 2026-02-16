import React, { useState, useEffect } from 'react';
import { materialAPI } from '../services/api';

const MaterialsUploadPage = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    topic: '',
    fileUrl: '',
    fileType: 'pdf',
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await materialAPI.getMyMaterials();
      setMaterials(res.data.materials || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.subject || !formData.fileUrl) {
      setError('Please fill all required fields');
      return;
    }

    try {
      await materialAPI.uploadMaterial(formData);
      setSuccessMessage('Material uploaded successfully! ✅');
      setTimeout(() => setSuccessMessage(''), 3000);
      setFormData({
        title: '',
        description: '',
        subject: '',
        topic: '',
        fileUrl: '',
        fileType: 'pdf',
      });
      setShowForm(false);
      fetchMaterials();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload material');
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await materialAPI.deleteMaterial(materialId);
        setSuccessMessage('Material deleted successfully! ✅');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchMaterials();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete material');
      }
    }
  };

  const getFileIcon = (fileType) => {
    const icons = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      ppt: '🎯',
      link: '🔗',
      image: '🖼️',
    };
    return icons[fileType] || '📎';
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="container">
        <div className="row mb-4">
          <div className="col-12">
            <h1 className="display-5 fw-bold text-success">📚 Manage Materials</h1>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {successMessage}
            <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
          </div>
        )}

        {/* Upload Form */}
        <div className="row mb-4">
          <div className="col-12">
            <button
              className="btn btn-success mb-3"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '❌ Cancel' : '➕ Upload Material'}
            </button>

            {showForm && (
              <div className="card shadow">
                <div className="card-header bg-success text-white fw-bold">
                  Upload Study Material
                </div>
                <div className="card-body">
                  <form onSubmit={handleUploadMaterial}>
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label">
                        Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        placeholder="Material title"
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">
                        Description
                      </label>
                      <textarea
                        className="form-control"
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Brief description of the material"
                      ></textarea>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="subject" className="form-label">
                          Subject <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                          placeholder="e.g., Mathematics"
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label htmlFor="topic" className="form-label">
                          Topic
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="topic"
                          name="topic"
                          value={formData.topic}
                          onChange={handleInputChange}
                          placeholder="e.g., Algebra"
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="fileUrl" className="form-label">
                          File URL <span className="text-danger">*</span>
                        </label>
                        <input
                          type="url"
                          className="form-control"
                          id="fileUrl"
                          name="fileUrl"
                          value={formData.fileUrl}
                          onChange={handleInputChange}
                          required
                          placeholder="https://example.com/file.pdf"
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label htmlFor="fileType" className="form-label">
                          File Type
                        </label>
                        <select
                          className="form-select"
                          id="fileType"
                          name="fileType"
                          value={formData.fileType}
                          onChange={handleInputChange}
                        >
                          <option value="pdf">PDF</option>
                          <option value="doc">DOC</option>
                          <option value="docx">DOCX</option>
                          <option value="ppt">PPT</option>
                          <option value="link">Link</option>
                          <option value="image">Image</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-success w-100">
                      Upload Material
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Materials Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : materials.length === 0 ? (
          <div className="alert alert-info text-center">
            No materials uploaded yet. Start by uploading your first material!
          </div>
        ) : (
          <div className="row g-4">
            {materials.map((material) => (
              <div key={material._id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow">
                  <div className="card-header bg-light">
                    <h6 className="mb-0 fw-bold">
                      {getFileIcon(material.fileType)} {material.title}
                    </h6>
                  </div>
                  <div className="card-body">
                    <p className="card-text text-muted small">
                      {material.description || 'No description'}
                    </p>
                    <p className="mb-1">
                      <strong>📚 Subject:</strong> {material.subject}
                    </p>
                    {material.topic && (
                      <p className="mb-1">
                        <strong>🏷️ Topic:</strong> {material.topic}
                      </p>
                    )}
                    <p className="mb-0">
                      <strong>📅 Uploaded:</strong>{' '}
                      {new Date(material.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="card-footer d-grid gap-2">
                    <a
                      href={material.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-info"
                    >
                      View
                    </a>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteMaterial(material._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialsUploadPage;

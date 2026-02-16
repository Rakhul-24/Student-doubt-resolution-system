import React, { useState, useEffect } from 'react';
import { materialAPI } from '../services/api';

const MaterialsPage = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await materialAPI.getAllMaterials();
      setMaterials(res.data.materials || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  const subjects = ['All', ...new Set(materials.map((m) => m.subject))];

  const filteredMaterials =
    selectedSubject === 'All'
      ? materials
      : materials.filter((m) => m.subject === selectedSubject);

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
            <h1 className="display-5 fw-bold text-primary">📚 Study Materials</h1>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        {/* Subject Filter */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow">
              <div className="card-body">
                <label className="form-label fw-bold">Filter by Subject:</label>
                <div className="d-flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <button
                      key={subject}
                      className={`btn ${
                        selectedSubject === subject
                          ? 'btn-primary'
                          : 'btn-outline-primary'
                      }`}
                      onClick={() => setSelectedSubject(subject)}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Materials Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="alert alert-info text-center">
            No materials available for this subject yet.
          </div>
        ) : (
          <div className="row g-4">
            {filteredMaterials.map((material) => (
              <div key={material._id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow">
                  <div className="card-header bg-light">
                    <h6 className="mb-0 fw-bold">
                      {getFileIcon(material.fileType)} {material.title}
                    </h6>
                  </div>
                  <div className="card-body">
                    <p className="card-text text-muted">
                      {material.description || 'No description available'}
                    </p>
                    <p className="mb-2">
                      <strong>👨‍🏫 By:</strong> {material.staffId?.name || 'Unknown'}
                    </p>
                    <p className="mb-2">
                      <strong>📚 Subject:</strong> {material.subject}
                    </p>
                    {material.topic && (
                      <p className="mb-2">
                        <strong>🏷️ Topic:</strong> {material.topic}
                      </p>
                    )}
                    <p className="mb-2">
                      <strong>📅 Uploaded:</strong>{' '}
                      {new Date(material.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="card-footer">
                    <a
                      href={material.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary w-100"
                    >
                      {material.fileType === 'link' ? 'Visit Link' : 'Download'}
                    </a>
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

export default MaterialsPage;

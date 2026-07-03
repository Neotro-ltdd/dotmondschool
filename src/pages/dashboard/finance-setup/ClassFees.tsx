import { useActiveTerm } from '../../../hooks/useActiveTerm';
import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import '../finance/Finance.css';

interface FeeTemplateListDto {
  id: string;
  classId: string;
  className: string;
  level: string;
  section: string;
  totalAmount: number;
}

interface FeeTemplateDetailDto {
  id: string;
  classId: string;
  className: string;
  level: string;
  session: string;
  term: string;
  totalAmount: number;
  items: { name: string; amount: number }[];
}

export default function ClassFees() {
  const [templates, setTemplates] = useState<FeeTemplateListDto[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterClassId, setFilterClassId] = useState<string>('');
  const { session: filterSession, term: filterTerm, setSession: setFilterSession, setTerm: setFilterTerm } = useActiveTerm();

  // Modal State
  const [selectedTemplate, setSelectedTemplate] = useState<FeeTemplateDetailDto | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [filterSession, filterTerm]);

  const fetchClasses = async () => {
    try {
      const data = await api.get('/setup/classes');
      setClasses(data);
    } catch (err) {
      console.error("Failed to load classes");
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/finance/setup/fee-templates?session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`);
      setTemplates(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load fee templates.');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (classId: string) => {
    try {
      setLoadingDetails(true);
      const data = await api.get(`/finance/setup/fee-templates/class/${classId}?session=${encodeURIComponent(filterSession)}&term=${encodeURIComponent(filterTerm)}`);
      setSelectedTemplate(data);
    } catch (err: any) {
      alert(err.message || 'Failed to load template details');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Filter templates
  let filteredTemplates = templates;
  if (filterLevel) {
    filteredTemplates = filteredTemplates.filter(t => t.level === filterLevel);
  }
  if (filterClassId) {
    filteredTemplates = filteredTemplates.filter(t => t.classId === filterClassId);
  }

  // Generate options for classes based on selected level
  const classOptions = filterLevel ? classes.filter(c => c.level === filterLevel) : classes;

  return (
    <div className="finance-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Class Fees</h1>
          <p className="page-subtitle">View official fee configurations by class.</p>
        </div>
      </div>

      <div className="filter-bar glass-panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Filter by Level:</label>
          <select value={filterLevel} onChange={(e) => { setFilterLevel(e.target.value); setFilterClassId(''); }} className="filter-select">
            <option value="">All Levels</option>
            <option value="Senior Secondary">Senior Secondary</option>
            <option value="Junior Secondary">Junior Secondary</option>
            <option value="Primary">Primary</option>
            <option value="Upper Primary">Upper Primary</option>
            <option value="Lower Primary">Lower Primary</option>
            <option value="Nursery">Nursery</option>
            <option value="Nursery 2">Nursery 2</option>
            <option value="Nursery 1">Nursery 1</option>
            <option value="Kindergarten">Kindergarten</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Filter by Class:</label>
          <select value={filterClassId} onChange={(e) => setFilterClassId(e.target.value)} className="filter-select">
            <option value="">All Classes</option>
            {classOptions.map(cls => (
              <option key={cls.id} value={cls.id}>{`${cls.level} ${cls.name} ${cls.section}`}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Session:</label>
          <select value={filterSession} onChange={(e) => setFilterSession(e.target.value)} className="filter-select">
            <option value={`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}>{`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}</option>
            <option value={`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}>{`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}</option>
            <option value={`${new Date().getFullYear() - 2}/${new Date().getFullYear() - 1}`}>{`${new Date().getFullYear() - 2}/${new Date().getFullYear() - 1}`}</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label>Term:</label>
          <select value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)} className="filter-select">
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-container glass-panel">
        {loading ? (
          <p className="loading-text">Loading templates...</p>
        ) : filteredTemplates.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
            <p className="empty-text">No fee template configured for the selected filters.</p>
            <a href="/dashboard/finance-setup/builder" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '1rem', textDecoration: 'none' }}>Go to Fee Builder</a>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Class</th>
                <th>Section</th>
                <th>Total Official Fee</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map(template => (
                <tr key={template.id} onClick={() => handleRowClick(template.classId)} style={{ cursor: 'pointer' }}>
                  <td>{template.level}</td>
                  <td><strong>{template.className}</strong></td>
                  <td>{template.section}</td>
                  <td><strong style={{ color: 'var(--primary-light)' }}>₦{template.totalAmount.toLocaleString()}</strong></td>
                  <td>
                    <button className="btn btn-secondary btn-sm">View Breakdown</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedTemplate && (
        <div className="modal-overlay" onClick={() => setSelectedTemplate(null)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h2>Fee Breakdown: {selectedTemplate.className}</h2>
            <p className="text-muted">{selectedTemplate.term} • {selectedTemplate.session}</p>
            
            <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '0.8rem' }}>Fee Item</th>
                    <th style={{ padding: '0.8rem', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTemplate.items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.8rem' }}>{item.name}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'right' }}>₦{item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ padding: '1rem 0.8rem', fontWeight: 'bold', fontSize: '1.1rem' }}>Total</td>
                    <td style={{ padding: '1rem 0.8rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary-light)' }}>
                      ₦{selectedTemplate.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="modal-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="btn btn-primary" onClick={() => setSelectedTemplate(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      
      {loadingDetails && (
        <div className="modal-overlay">
          <div className="loading-screen">Loading Breakdown...</div>
        </div>
      )}
    </div>
  );
}

import { useActiveTerm } from '../../../hooks/useActiveTerm';
import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import '../finance/Finance.css';
import { useDialog } from '../../../context/DialogContext';


interface FeeTemplateItem {
  name: string;
  amount: number;
}

export default function FinanceFeeBuilder() {
  const { showAlert } = useDialog();

  const [classes, setClasses] = useState<any[]>([]);
  
  // Form State
  const { session, term, setSession, setTerm } = useActiveTerm();
  const [classId, setClassId] = useState('');
  
  const [feeItems, setFeeItems] = useState<FeeTemplateItem[]>([
    { name: 'Tuition Fees', amount: 0 },
    { name: 'PTA Fees', amount: 0 },
    { name: 'Technology Fees', amount: 0 },
    { name: 'Uniform Fees', amount: 0 },
    { name: 'Books', amount: 0 }
  ]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await api.get('/setup/classes');
      setClasses(data);
      if (data.length > 0) setClassId(data[0].id);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFeeItems([...feeItems, { name: '', amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setFeeItems(feeItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'name' | 'amount', value: string | number) => {
    const newItems = [...feeItems];
    newItems[index] = { ...newItems[index], [field]: value as never };
    setFeeItems(newItems);
  };

  const handleSaveFeeTemplate = async () => {
    if (!classId) return showAlert('Please select a class');
    
    // Validate items
    const validItems = feeItems.filter(i => i.name.trim() !== '' && i.amount >= 0);
    if (validItems.length === 0) return showAlert('Please provide at least one valid fee item.');

    setSaving(true);
    try {
      await api.post('/finance/setup/fee-template', {
        session,
        term,
        classId,
        items: validItems
      });
      showAlert('Fee template saved successfully!');
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message;
      showAlert('Failed to save fee template:\n' + detail);
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = feeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  if (loading) return <div className="loading-screen">Loading Fee Builder...</div>;

  return (
    <div className="finance-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Builder</h1>
          <p className="page-subtitle">Configure official itemized term fees per class.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem 3rem', maxWidth: '800px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Itemized Fee Builder</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Set up the official fee breakdown for a specific Class.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Session</label>
            <input type="text" className="form-control" value={session} onChange={e => setSession(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Term</label>
            <select className="form-control" value={term} onChange={e => setTerm(e.target.value)}>
              <option>First Term</option>
              <option>Second Term</option>
              <option>Third Term</option>
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label>Target Class</label>
          <select className="form-control" value={classId} onChange={e => setClassId(e.target.value)}>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.level} {c.name} {c.section}</option>
            ))}
          </select>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0 }}>Fee Breakdown</h4>
            <button className="btn btn-secondary btn-sm" onClick={handleAddItem}>+ Add Custom Field</button>
          </div>

          {feeItems.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
              <div style={{ flex: 2 }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Fee Name (e.g., Excursion)" 
                  value={item.name} 
                  onChange={e => handleItemChange(index, 'name', e.target.value)}
                  style={{ padding: '0.8rem', fontSize: '1rem' }}
                />
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#666', fontWeight: 'bold' }}>₦</span>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Amount" 
                  min="0"
                  value={item.amount || ''} 
                  onChange={e => handleItemChange(index, 'amount', Number(e.target.value))}
                  style={{ padding: '0.8rem 0.8rem 0.8rem 2rem', fontSize: '1rem' }}
                />
              </div>
              <button 
                className="btn btn-danger" 
                style={{ width: '45px', height: '45px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }} 
                onClick={() => handleRemoveItem(index)}
                title="Remove Fee"
              >
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>×</span>
              </button>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <strong style={{ fontSize: '1.2rem' }}>Total Official Fee:</strong>
            <strong style={{ fontSize: '1.2rem', color: 'var(--primary-light)' }}>₦{totalAmount.toLocaleString()}</strong>
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1.1rem' }} 
          onClick={handleSaveFeeTemplate}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Fee Configuration'}
        </button>
      </div>
    </div>
  );
}

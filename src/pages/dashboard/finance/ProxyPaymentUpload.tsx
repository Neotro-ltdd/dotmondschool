import React, { useState, useEffect } from 'react';
import { api, API_ROOT } from '../../../services/api';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import './Finance.css';
import { useDialog } from '../../../context/DialogContext';


interface PosStudent {
  id: string;
  name: string;
  registrationNumber: string;
  className: string;
  invoices: any[];
}

export default function ProxyPaymentUpload() {
  const { showAlert } = useDialog();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PosStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<PosStudent | null>(null);
  
  const [targetInvoiceId, setTargetInvoiceId] = useState<string | 'new'>('new');
  const { session: posSession, term: posTerm, setSession: setPosSession, setTerm: setPosTerm } = useActiveTerm();
  const [posAmountDue, setPosAmountDue] = useState<number>(0);
  const [posAmountPaid, setPosAmountPaid] = useState<number>(0);
  const [directMethod, setDirectMethod] = useState('Transfer');
  const [directRemarks, setDirectRemarks] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [processing, setProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [financeSetup, setFinanceSetup] = useState<any>(null);

  React.useEffect(() => {
    api.get('/finance/setup')
      .then(data => setFinanceSetup(data))
      .catch(err => console.error(err));
  }, []);

  const getSortedPendingInvoices = (student: PosStudent) => {
    const termsOrder: Record<string, number> = { 'First Term': 1, 'Second Term': 2, 'Third Term': 3 };
    return student.invoices
      .filter(i => i.paymentStatus !== 'Completed')
      .sort((a, b) => {
        if (a.session !== b.session) return a.session.localeCompare(b.session);
        return (termsOrder[a.term] || 99) - (termsOrder[b.term] || 99);
      });
  };

  const handleSelectStudent = (student: PosStudent) => {
    setSelectedStudent(student);
    setReceiptData(null);
    const pending = getSortedPendingInvoices(student);
    if (pending.length > 0) {
      const oldest = pending[0];
      setTargetInvoiceId(oldest.id);
      setPosTerm(oldest.term);
      setPosSession(oldest.session);
      setPosAmountDue(oldest.amountDue);
      setPosAmountPaid(oldest.balance);
    } else {
      setTargetInvoiceId('new');
      setPosTerm('First Term');
      setPosSession(`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`);
      setPosAmountDue(0);
      setPosAmountPaid(0);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      const data = await api.get(`/finance/student-ledger?q=${searchTerm}`);
      setSearchResults(data || []);
      setSelectedStudent(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProxyUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || posAmountPaid <= 0 || posAmountDue <= 0 || !selectedFile) {
      showAlert("Please ensure all fields are filled and a file is uploaded.");
      return;
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      if (targetInvoiceId !== 'new') {
        formData.append('invoiceId', targetInvoiceId);
      }
      formData.append('studentId', selectedStudent.id);
      formData.append('term', posTerm);
      formData.append('session', posSession);
      formData.append('amountDue', posAmountDue.toString());
      formData.append('amountPaid', posAmountPaid.toString());
      formData.append('method', directMethod);
      formData.append('remarks', directRemarks);
      formData.append('file', selectedFile);

      // Using the base fetch method for FormData
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ROOT}/api/finance/proxy-record`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }

      const data = await response.json();
      
      let msg = data.message;
      if (data.invoiceStatus === 'Completed') {
        msg += "\n\nPayment fully cleared! Official Receipt is now available.";
      } else {
        msg += `\n\nPart-Payment logged successfully.`;
      }
      showAlert(msg);
      
      setReceiptData({
        studentName: selectedStudent.name,
        regNumber: selectedStudent.registrationNumber,
        className: selectedStudent.className,
        term: posTerm,
        session: posSession,
        amountPaid: posAmountPaid,
        method: directMethod,
        date: new Date().toLocaleDateString(),
        receiptNo: data.receiptNumber || 'N/A',
        invoiceId: data.invoiceId
      });

      setSelectedFile(null);
      handleSearch();
    } catch (err: any) {
      showAlert("Upload failed: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="finance-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Proxy Payment Upload</h1>
          <p className="page-subtitle">Upload parent payment proofs (e.g. from WhatsApp) and instantly generate official receipts.</p>
        </div>
      </div>

      <div className="glass-panel fade-in" style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1 }}>
          <h2 className="section-title">Student Search</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, fontSize: '1.2rem' }}>🔍</span>
              <input 
                type="text" 
                style={{ 
                  padding: '1rem 1rem 1rem 3.2rem', 
                  width: '100%', 
                  margin: 0,
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(0,0,0,0.2)',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                placeholder="Search by Name or Reg No..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button className="btn btn-primary" style={{ padding: '1rem 2rem', borderRadius: '12px', fontWeight: 'bold' }} onClick={handleSearch}>
              Search
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="search-results" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {searchResults.map(student => (
                <div 
                  key={student.id} 
                  className={`kid-item ${selectedStudent?.id === student.id ? 'active' : ''}`}
                  onClick={() => handleSelectStudent(student)}
                  style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', border: selectedStudent?.id === student.id ? '1px solid var(--primary)' : '1px solid transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '40px', height: '40px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 'bold', fontSize: '1.2rem'
                    }}>
                      {student.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--text-color)' }}>{student.name}</strong>
                        <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>{student.className}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Reg No: <strong>{student.registrationNumber}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <h2 className="section-title">Upload & Verify</h2>
          {!selectedStudent ? (
            <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
              <p>Select a student from the left to upload proof of payment.</p>
            </div>
          ) : (
            <form onSubmit={handleProxyUpload} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h4>Billing Details for {selectedStudent.name}</h4>
                
                {getSortedPendingInvoices(selectedStudent).length > 0 && (
                  <div className="form-group mt-2">
                    <label style={{ color: 'var(--primary-light)' }}>Target Invoice</label>
                    <select className="form-control" value={targetInvoiceId} onChange={e => {
                      const val = e.target.value;
                      setTargetInvoiceId(val);
                      if (val !== 'new') {
                        const inv = selectedStudent.invoices.find(i => i.id === val);
                        if (inv) {
                          setPosTerm(inv.term);
                          setPosSession(inv.session);
                          setPosAmountDue(inv.amountDue);
                          setPosAmountPaid(inv.balance);
                        }
                      } else {
                        setPosAmountDue(0);
                        setPosAmountPaid(0);
                      }
                    }}>
                      {getSortedPendingInvoices(selectedStudent).map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.session} - {inv.term} (Owes ₦{inv.balance.toLocaleString()})
                        </option>
                      ))}
                      <option value="new">+ Create Custom Charge</option>
                    </select>
                  </div>
                )}

                <div className="form-group mt-2">
                  <label>Session</label>
                  <input type="text" className="form-control" value={posSession} onChange={e => setPosSession(e.target.value)} required disabled={targetInvoiceId !== 'new'} />
                </div>
                <div className="form-group">
                  <label>Term</label>
                  <select className="form-control" value={posTerm} onChange={e => setPosTerm(e.target.value)} required disabled={targetInvoiceId !== 'new'}>
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Total Fee For Term (Amount Due ₦)</label>
                  <input type="number" className="form-control" min="1" value={posAmountDue} onChange={e => setPosAmountDue(Number(e.target.value))} required disabled={targetInvoiceId !== 'new'} />
                </div>
              </div>

              <div className="form-group">
                <label>Amount Paid (₦)</label>
                <input type="number" min="1" max={targetInvoiceId !== 'new' ? posAmountDue : undefined} value={posAmountPaid} onChange={e => setPosAmountPaid(Number(e.target.value))} className="form-control" required />
              </div>

              <div className="form-group">
                <label>Proof of Payment (Image/PDF)</label>
                <input type="file" className="form-control" style={{ padding: '0.8rem' }} accept="image/*,.pdf" onChange={e => setSelectedFile(e.target.files?.[0] || null)} required />
              </div>

              <div className="form-group">
                <label>Remarks</label>
                <input type="text" value={directRemarks} onChange={e => setDirectRemarks(e.target.value)} className="form-control" placeholder="E.g., Received via WhatsApp on May 5th" />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={processing || !selectedFile}>
                {processing ? "Uploading & Verifying..." : `Verify & Issue Receipt (₦${posAmountPaid.toLocaleString()})`}
              </button>
            </form>
          )}

          {receiptData && (
            <div className="receipt-overlay fade-in" style={{ marginTop: '2rem', padding: '1.5rem', background: '#fff', color: '#000', borderRadius: '8px', border: '1px solid #ccc', textAlign: 'center' }}>
              <h3 style={{ color: 'var(--primary-dark)', marginBottom: '1rem' }}>Payment Successfully Verified</h3>
              <p>Receipt #{receiptData.receiptNo} has been generated.</p>
              
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}
                onClick={() => {
                  window.open(`/dashboard/finance/receipt/${receiptData.invoiceId}`, '_blank');
                }}
              >
                📄 View / Print Official Receipt
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

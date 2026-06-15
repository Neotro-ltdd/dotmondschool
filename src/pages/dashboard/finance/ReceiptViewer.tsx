import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, API_ROOT } from '../../../services/api';
import { useTenant } from '../../../context/TenantContext';
import './ReceiptViewer.css';

// Helper to convert numbers to words (basic implementation for Naira)
function numberToWords(num: number): string {
  if (num === 0) return 'Zero Naira Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function convert(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 !== 0 ? ' ' + convert(n % 1000000) : '');
    return n.toString();
  }
  
  return convert(num) + ' Naira Only';
}

const ReceiptViewer: React.FC = () => {
  const navigate = useNavigate();
  // Using params to fetch the real receipt data
  const { paymentId } = useParams<{ paymentId: string }>();
  const { schoolName } = useTenant();

  const [receiptData, setReceiptData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!paymentId) return;

    const fetchReceipt = async () => {
      try {
        setLoading(true);
        // paymentId is technically the invoiceId in our new routing
        const response = await api.get(`/finance/receipts/${paymentId}`);
        setReceiptData(response);
      } catch (err: any) {
        console.error('Failed to fetch receipt:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load receipt.');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [paymentId]);

  const getFullUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_ROOT}${url}`;
  };

  if (loading) return <div style={{padding: 20}}>Loading receipt...</div>;
  if (error) return <div style={{padding: 20, color: 'red'}}>Error: {error}</div>;
  if (!receiptData) return <div style={{padding: 20}}>No receipt found.</div>;

  // Robust data extraction supporting both camelCase and PascalCase
  const rawLogo = receiptData.schoolLogoUrl || receiptData.SchoolLogoUrl;
  const rawSignature = receiptData.accountantSignatureUrl || receiptData.AccountantSignatureUrl;
  
  const schoolLogoUrl = getFullUrl(rawLogo) || "https://placehold.co/150x150/2993cf/ffffff?text=LOGO";
  const accountantSignatureUrl = getFullUrl(rawSignature) || "https://placehold.co/200x60/ffffff/000000?text=Accountant+Signature";
  
  const amount = receiptData.amount ?? receiptData.Amount ?? 0;
  const amountStr = amount.toLocaleString();
  const sumOfWords = numberToWords(amount);

  const viewData = {
    receiptNo: receiptData.receiptNo ?? receiptData.ReceiptNo ?? "N/A",
    receivedFrom: receiptData.receivedFrom ?? receiptData.ReceivedFrom ?? "N/A",
    onBehalfOf: receiptData.onBehalfOf ?? receiptData.OnBehalfOf ?? "N/A",
    paymentFor: receiptData.paymentFor ?? receiptData.PaymentFor ?? "N/A",
    term: receiptData.term ?? receiptData.Term ?? "N/A",
    balance: receiptData.balance ?? receiptData.Balance ?? "N/A",
    date: receiptData.date ?? receiptData.Date ?? "N/A"
  };

  return (
    <div className="receipt-viewer-container">
      <div className="no-print receipt-actions">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
        <button className="btn btn-primary" onClick={() => window.print()}>Print Receipt</button>
      </div>

      <div className="receipt-paper-wrapper">
        <div className="receipt-template">
          
          {/* Watermark */}
          {schoolLogoUrl && (
            <div className="rt-watermark-container">
              <img src={schoolLogoUrl} alt="Watermark" className="rt-watermark-image" />
            </div>
          )}

          {/* Top Header Section */}
          <div className="rt-header">
            <div className="rt-badge-container">
              <div className="rt-badge">
                <span>CASH RECEIPT</span>
              </div>
            </div>
            
            <div className="rt-school-info">
              <div className="rt-logo">
                {schoolLogoUrl ? <img src={schoolLogoUrl} alt="Logo" style={{maxWidth:'100%', maxHeight:'100%', objectFit: 'contain'}} /> : "LOGO"}
              </div>
              <div className="rt-school-text">
                <h1>{schoolName.toUpperCase()}</h1>
                <h2>NURSERY, PRIMARY & SECONDARY SCHOOLS</h2>
                <p>Golden Pearl Estate, Km 49, Lekki-Epe Expressway,</p>
                <p>Olokonla, Lagos State. | Tel: 08051409106, 08168917447.</p>
              </div>
            </div>
            
            <div className="rt-receipt-no-box">
              <div className="rt-receipt-no-label">Receipt No</div>
              <div className="rt-receipt-no-value">{viewData.receiptNo}</div>
            </div>
          </div>

          {/* Body Section */}
          <div className="rt-body">
            
            {/* Left Sidebar */}
            <div className="rt-sidebar">
              <div className="rt-sidebar-text">
                MOTTO: Steady Progress Glorious Future
              </div>
            </div>

            {/* Main Form Content */}
            <div className="rt-content">


              <div className="rt-row">
                <span className="rt-label">Received from:</span>
                <div className="rt-line">
                  <span className="rt-value">{viewData.receivedFrom}</span>
                </div>
              </div>

              <div className="rt-row">
                <span className="rt-label">On behalf of:</span>
                <div className="rt-line">
                  <span className="rt-value">{viewData.onBehalfOf}</span>
                </div>
              </div>

              <div className="rt-row">
                <span className="rt-label">The sum of:</span>
                <div className="rt-line">
                  <span className="rt-value">{sumOfWords}</span>
                </div>
              </div>

              <div className="rt-row">
                <span className="rt-label">Being part/full payment for:</span>
                <div className="rt-line">
                  <span className="rt-value">{viewData.paymentFor}</span>
                </div>
              </div>

              <div className="rt-row-multi">
                <div className="rt-field">
                  <span className="rt-label">Term:</span>
                  <div className="rt-line">
                    <span className="rt-value">{viewData.term}</span>
                  </div>
                </div>
                <div className="rt-field">
                  <span className="rt-label">Balance:</span>
                  <div className="rt-line">
                    <span className="rt-value">{viewData.balance}</span>
                  </div>
                </div>
                <div className="rt-field">
                  <span className="rt-label">Date:</span>
                  <div className="rt-line">
                    <span className="rt-value">{viewData.date}</span>
                  </div>
                </div>
              </div>

              <div className="rt-bottom">
                <div className="rt-amount-box">
                  <div className="n-col">N</div>
                  <div className="val-col">{amountStr}</div>
                  <div className="k-col">: K</div>
                </div>

                <div className="rt-signature">
                  <span className="rt-label">Signature:</span>
                  <div className="rt-line">
                    {accountantSignatureUrl && <img src={accountantSignatureUrl} alt="Accountant Signature" />}
                  </div>
                </div>
              </div>
              
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReceiptViewer;

import React, { useState } from 'react';
import './TemplateGallery.css';

export default function TemplateGallery() {
  const [activeTab, setActiveTab] = useState('idcards');

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <h1>Template Gallery (Preview)</h1>
        <p>
          Explore the different template options available for ID Cards, Receipts, and Result
          Sheets.
        </p>

        <div className="gallery-tabs">
          <button
            className={`tab-btn ${activeTab === 'idcards' ? 'active' : ''}`}
            onClick={() => setActiveTab('idcards')}
          >
            ID Cards
          </button>
          <button
            className={`tab-btn ${activeTab === 'receipts' ? 'active' : ''}`}
            onClick={() => setActiveTab('receipts')}
          >
            Receipts
          </button>
          <button
            className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            Result Sheets
          </button>
        </div>
      </div>

      <div className="gallery-content">
        {/* ID CARDS */}
        {activeTab === 'idcards' && (
          <div className="gallery-section">
            <div className="template-card">
              <div className="template-info">
                <h3>Template A: Standard Vertical (CR80)</h3>
                <p>
                  The current default. Great for lanyard clips and standard ID card printers.
                  Features a dark header and footer with dual-sided QR attendance.
                </p>
              </div>
              <div className="template-preview id-preview-vertical">
                <div className="mock-id-vertical">
                  <div className="mock-id-header">EXCELLENCE ACADEMY</div>
                  <div className="mock-id-photo">PHOTO</div>
                  <div className="mock-id-name">JOHN DOE</div>
                  <div className="mock-id-footer">VALID 2026 - 2027</div>
                </div>
              </div>
            </div>

            <div className="template-card">
              <div className="template-info">
                <h3>Template B: Landscape Lanyard (CR80)</h3>
                <p>
                  A wider horizontal layout. Ideal for schools that prefer larger photos, longer
                  school names, or standard corporate style badges.
                </p>
              </div>
              <div className="template-preview id-preview-horizontal">
                <div className="mock-id-horizontal">
                  <div className="mock-id-left">
                    <div className="mock-id-photo-small">PHOTO</div>
                  </div>
                  <div className="mock-id-right">
                    <div className="mock-id-header-horiz">EXCELLENCE ACADEMY</div>
                    <div className="mock-id-name-horiz">JANE SMITH</div>
                    <div className="mock-id-details-horiz">Class: JSS 1 | ID: 1002</div>
                    <div className="mock-id-footer-horiz">ATTENDANCE CARD</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RECEIPTS */}
        {activeTab === 'receipts' && (
          <div className="gallery-section">
            <div className="template-card">
              <div className="template-info">
                <h3>Template A: Thermal POS Print (80mm)</h3>
                <p>
                  The current default. Optimized for fast thermal receipt printers at the bursary
                  desk. Simple, narrow, and saves paper.
                </p>
              </div>
              <div className="template-preview receipt-preview-thermal">
                <div className="mock-receipt-thermal">
                  <h4>EXCELLENCE ACADEMY</h4>
                  <p className="thermal-meta">
                    Date: 12-Oct-2026
                    <br />
                    Receipt: #REC-001
                  </p>
                  <div className="thermal-line"></div>
                  <div className="thermal-item">
                    <span>Tuition Fee</span>
                    <span>₦150k</span>
                  </div>
                  <div className="thermal-item">
                    <span>Bus Fee</span>
                    <span>₦50k</span>
                  </div>
                  <div className="thermal-line"></div>
                  <div className="thermal-total">
                    <span>TOTAL</span>
                    <span>₦200k</span>
                  </div>
                  <p className="thermal-thanks">Thank you!</p>
                </div>
              </div>
            </div>

            <div className="template-card">
              <div className="template-info">
                <h3>Template B: Standard A4 Invoice</h3>
                <p>
                  A full-page, professional invoice layout. Better for parents who request printed
                  A4 records for corporate reimbursement or tax filing.
                </p>
              </div>
              <div className="template-preview receipt-preview-a4">
                <div className="mock-receipt-a4">
                  <div className="a4-header">
                    <div>
                      <h2>EXCELLENCE ACADEMY</h2>
                      <p>123 Education Way, Lagos</p>
                    </div>
                    <div className="a4-title">OFFICIAL RECEIPT</div>
                  </div>
                  <div className="a4-meta">
                    <div>Billed To: Mr. Smith</div>
                    <div>
                      Date: Oct 12, 2026
                      <br />
                      Receipt: #REC-002
                    </div>
                  </div>
                  <table className="a4-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Tuition Fee (First Term)</td>
                        <td>₦ 150,000</td>
                      </tr>
                      <tr>
                        <td>Transport (Island Route)</td>
                        <td>₦ 50,000</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="a4-total">TOTAL PAID: ₦ 200,000</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {activeTab === 'results' && (
          <div className="gallery-section">
            <div className="template-card">
              <div className="template-info">
                <h3>Template A: Standard Classic Grid</h3>
                <p>
                  The current default. Traditional tabular layout focusing on CA scores, Exam
                  scores, Total, and Grades. Simple and universally understood.
                </p>
              </div>
              <div className="template-preview result-preview-classic">
                <div className="mock-result-classic">
                  <div className="classic-header">FIRST TERM RESULT SHEET</div>
                  <table className="classic-table">
                    <thead>
                      <tr>
                        <th>SUBJECT</th>
                        <th>CA</th>
                        <th>EXAM</th>
                        <th>TOTAL</th>
                        <th>GRADE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Mathematics</td>
                        <td>28</td>
                        <td>65</td>
                        <td>93</td>
                        <td>A</td>
                      </tr>
                      <tr>
                        <td>English Lang.</td>
                        <td>25</td>
                        <td>60</td>
                        <td>85</td>
                        <td>A</td>
                      </tr>
                      <tr>
                        <td>Basic Science</td>
                        <td>20</td>
                        <td>55</td>
                        <td>75</td>
                        <td>B</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="classic-footer">Principal's Remarks: Excellent performance.</div>
                </div>
              </div>
            </div>

            <div className="template-card">
              <div className="template-info">
                <h3>Template B: Modern Analytical</h3>
                <p>
                  A premium, visual-heavy layout. Includes class averages, progress bars, and
                  graphical performance indicators for a modern feel.
                </p>
              </div>
              <div className="template-preview result-preview-modern">
                <div className="mock-result-modern">
                  <div className="modern-header">
                    <div>
                      <h2>EXCELLENCE ACADEMY</h2>
                      <p>Term Report</p>
                    </div>
                    <div className="modern-gpa">GPA: 3.8 / 4.0</div>
                  </div>
                  <div className="modern-bars">
                    <div className="m-bar">
                      <span className="m-sub">Math</span>
                      <div className="m-track">
                        <div className="m-fill" style={{ width: '93%' }}></div>
                      </div>
                      <span className="m-score">93%</span>
                    </div>
                    <div className="m-bar">
                      <span className="m-sub">English</span>
                      <div className="m-track">
                        <div className="m-fill" style={{ width: '85%' }}></div>
                      </div>
                      <span className="m-score">85%</span>
                    </div>
                  </div>
                  <div className="modern-insights">
                    <div className="m-box">Highest: Math</div>
                    <div className="m-box">Class Avg: 72%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

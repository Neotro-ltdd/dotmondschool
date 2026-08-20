import React, { useState, useEffect } from 'react';
import { api, API_ROOT } from '../../services/api';
import './PublicAdmissionForm.css';

interface ClassItem {
  id: string;
  name: string;
  level: string;
  section: string;
}

export default function PublicAdmissionForm() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Form Section Tab: 'header' | 'sectionA' | 'sectionB' | 'sectionC' | 'sectionD' | 'sectionE'
  const [activeTab, setActiveTab] = useState<string>('sectionA');

  // Form State
  const [formData, setFormData] = useState({
    session: '2026/2027',
    term: 'First Term',
    targetClassId: '',

    // Section A: Student Information
    fullName: '',
    dateOfBirth: '',
    age: 0,
    gender: 'Male',
    placeOfBirth: '',
    nationality: 'Nigerian',
    stateOfOrigin: '',
    lga: '',
    homeAddress: '',
    lastSchoolAttended: '',
    lastClassCompleted: '',

    // Section B: Parent / Guardian Information
    fatherName: '',
    fatherOccupation: '',
    fatherPhoneNumber: '',
    fatherEmail: '',

    motherName: '',
    motherOccupation: '',
    motherPhoneNumber: '',
    motherEmail: '',

    parentEmail: '',
    parentPhoneNumber: '',

    guardianName: '',
    guardianRelationship: '',
    guardianAddress: '',

    // Section C: Medical Information
    bloodGroup: '',
    genotype: '',
    medicalConditions: '',
    doctorNameClinic: '',
    emergencyContactNumber: '',

    // Section D: Documents Required Checklist
    birthCertificateSubmitted: false,
    passportsSubmitted: false,
    previousResultSubmitted: false,
    otherDocuments: '',

    // Section E: Declaration
    declarantFullName: '',
    agreeDeclaration: false
  });

  // Files
  const [birthCertFile, setBirthCertFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [previousResultFile, setPreviousResultFile] = useState<File | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await api.get('/setup/classes');
      setClasses(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setFormData(prev => ({ ...prev, targetClassId: data[0].id }));
      }
    } catch (err) {
      console.error("Failed to load classes for public admission form", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Auto calculate age from date of birth
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dobStr = e.target.value;
    let calculatedAge = 0;
    if (dobStr) {
      const dob = new Date(dobStr);
      const diffMs = Date.now() - dob.getTime();
      const ageDate = new Date(diffMs);
      calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
    }
    setFormData(prev => ({ ...prev, dateOfBirth: dobStr, age: calculatedAge }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName.trim()) {
      setError("Please provide the Student's Full Name (Section A).");
      setActiveTab('sectionA');
      return;
    }
    if (!formData.targetClassId) {
      setError("Please select the Class Applied For.");
      setActiveTab('sectionA');
      return;
    }
    if (!formData.parentEmail.trim() || !formData.parentPhoneNumber.trim()) {
      setError("Please provide a valid Parent Contact Email and Phone Number in Section B.");
      setActiveTab('sectionB');
      return;
    }
    if (!formData.agreeDeclaration || !formData.declarantFullName.trim()) {
      setError("Please complete the Parent/Guardian Declaration in Section E.");
      setActiveTab('sectionE');
      return;
    }

    try {
      setLoading(true);
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        submitData.append(key, val.toString());
      });

      if (birthCertFile) submitData.append('BirthCertificateFile', birthCertFile);
      if (passportFile) submitData.append('PassportPhotoFile', passportFile);
      if (previousResultFile) submitData.append('PreviousResultFile', previousResultFile);
      if (paymentProofFile) submitData.append('PaymentProofFile', paymentProofFile);

      await api.post('/public/admission', submitData);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit admission application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="public-admission-page">
        <div className="admission-container success-card">
          <div className="success-icon">🎉</div>
          <h2 className="success-title">Application Submitted Successfully!</h2>
          <p className="success-message">
            Thank you for registering your child with <strong>DOTMOND NURSERY, PRIMARY AND SECONDARY SCHOOL</strong>.
          </p>
          <div className="success-details-box">
            <p><strong>Student Name:</strong> {formData.fullName}</p>
            <p><strong>Primary Parent Email:</strong> {formData.parentEmail}</p>
            <p><strong>Primary Parent Phone:</strong> {formData.parentPhoneNumber}</p>
          </div>
          <p className="success-next-steps">
            Our admissions office, principal, and accountant have received your application. 
            You will receive an <strong>Email and SMS</strong> notifying you to bring your child to school for documentation and physical assessment.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-admission-page">
      <div className="admission-container">
        
        {/* School Banner Header */}
        <div className="admission-header-card">
          <h1 className="school-form-title">DOTMOND NURSERY, PRIMARY AND SECONDARY SCHOOL</h1>
          <h2 className="school-form-subtitle">OFFICIAL ONLINE REGISTRATION FORM</h2>
          <p className="school-address">Happyland Estate, Ajah, Lagos State, Nigeria</p>
        </div>

        {/* Target Session & Class Bar */}
        <div className="target-selection-bar">
          <div className="form-group">
            <label>Academic Session / Term</label>
            <div className="input-row-2">
              <input type="text" className="form-control" name="session" value={formData.session} onChange={handleInputChange} placeholder="e.g. 2026/2027" />
              <select className="form-control" name="term" value={formData.term} onChange={handleInputChange}>
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Class Applied For *</label>
            <select className="form-control" name="targetClassId" value={formData.targetClassId} onChange={handleInputChange} required>
              <option value="">-- Select Class --</option>
              {classes.map(c => {
                const displayName = c.section && c.section.trim() !== '' ? `${c.name} ${c.section}`.trim() : c.name;
                return (
                  <option key={c.id} value={c.id}>{displayName}</option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Section Tab Stepper Navigation */}
        <div className="section-tabs-nav">
          <button type="button" className={`tab-nav-btn ${activeTab === 'sectionA' ? 'active' : ''}`} onClick={() => setActiveTab('sectionA')}>
            Section A: Student Info
          </button>
          <button type="button" className={`tab-nav-btn ${activeTab === 'sectionB' ? 'active' : ''}`} onClick={() => setActiveTab('sectionB')}>
            Section B: Parent/Guardian
          </button>
          <button type="button" className={`tab-nav-btn ${activeTab === 'sectionC' ? 'active' : ''}`} onClick={() => setActiveTab('sectionC')}>
            Section C: Medical Info
          </button>
          <button type="button" className={`tab-nav-btn ${activeTab === 'sectionD' ? 'active' : ''}`} onClick={() => setActiveTab('sectionD')}>
            Section D: Documents
          </button>
          <button type="button" className={`tab-nav-btn ${activeTab === 'sectionE' ? 'active' : ''}`} onClick={() => setActiveTab('sectionE')}>
            Section E: Declaration
          </button>
        </div>

        {error && <div className="alert-banner alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="admission-form">
          
          {/* SECTION A: STUDENT INFORMATION */}
          {activeTab === 'sectionA' && (
            <div className="form-section-card">
              <h3 className="section-heading">SECTION A: STUDENT INFORMATION</h3>
              <div className="form-grid-2">
                
                <div className="form-group full-width">
                  <label>Full Name of Child (Surname First) *</label>
                  <input type="text" className="form-control" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="e.g. ABIODUN, Josiah Oluwaseun" required />
                </div>

                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input type="date" className="form-control" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleDobChange} required />
                </div>

                <div className="form-group">
                  <label>Age (Years)</label>
                  <input type="number" className="form-control" name="age" value={formData.age} readOnly placeholder="Auto-calculated" />
                </div>

                <div className="form-group">
                  <label>Gender *</label>
                  <select className="form-control" name="gender" value={formData.gender} onChange={handleInputChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Place of Birth</label>
                  <input type="text" className="form-control" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleInputChange} placeholder="e.g. Lagos, Nigeria" />
                </div>

                <div className="form-group">
                  <label>Nationality</label>
                  <input type="text" className="form-control" name="nationality" value={formData.nationality} onChange={handleInputChange} placeholder="e.g. Nigerian" />
                </div>

                <div className="form-group">
                  <label>State of Origin</label>
                  <input type="text" className="form-control" name="stateOfOrigin" value={formData.stateOfOrigin} onChange={handleInputChange} placeholder="e.g. Ogun State" />
                </div>

                <div className="form-group">
                  <label>L.G.A.</label>
                  <input type="text" className="form-control" name="lga" value={formData.lga} onChange={handleInputChange} placeholder="e.g. Eti-Osa" />
                </div>

                <div className="form-group full-width">
                  <label>Home Address *</label>
                  <input type="text" className="form-control" name="homeAddress" value={formData.homeAddress} onChange={handleInputChange} placeholder="Full residential address" required />
                </div>

                <div className="form-group">
                  <label>Previous School Attended (if any)</label>
                  <input type="text" className="form-control" name="lastSchoolAttended" value={formData.lastSchoolAttended} onChange={handleInputChange} placeholder="Name of previous school" />
                </div>

                <div className="form-group">
                  <label>Last Class Completed</label>
                  <input type="text" className="form-control" name="lastClassCompleted" value={formData.lastClassCompleted} onChange={handleInputChange} placeholder="e.g. Primary 5" />
                </div>

              </div>

              <div className="step-actions">
                <button type="button" className="btn btn-primary" onClick={() => setActiveTab('sectionB')}>
                  Next: Section B (Parent Info) ➔
                </button>
              </div>
            </div>
          )}

          {/* SECTION B: PARENT/GUARDIAN INFORMATION */}
          {activeTab === 'sectionB' && (
            <div className="form-section-card">
              <h3 className="section-heading">SECTION B: PARENT / GUARDIAN INFORMATION</h3>
              
              <div className="sub-section-title">👨 Father's Information</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Father's Full Name</label>
                  <input type="text" className="form-control" name="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Father's Name" />
                </div>
                <div className="form-group">
                  <label>Occupation</label>
                  <input type="text" className="form-control" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleInputChange} placeholder="Father's Occupation" />
                </div>
                <div className="form-group">
                  <label>Father's Phone Number</label>
                  <input type="text" className="form-control" name="fatherPhoneNumber" value={formData.fatherPhoneNumber} onChange={handleInputChange} placeholder="e.g. 08031234567" />
                </div>
                <div className="form-group">
                  <label>Father's Email Address</label>
                  <input type="email" className="form-control" name="fatherEmail" value={formData.fatherEmail} onChange={handleInputChange} placeholder="father@gmail.com" />
                </div>
              </div>

              <div className="sub-section-title">👩 Mother's Information</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Mother's Full Name</label>
                  <input type="text" className="form-control" name="motherName" value={formData.motherName} onChange={handleInputChange} placeholder="Mother's Name" />
                </div>
                <div className="form-group">
                  <label>Occupation</label>
                  <input type="text" className="form-control" name="motherOccupation" value={formData.motherOccupation} onChange={handleInputChange} placeholder="Mother's Occupation" />
                </div>
                <div className="form-group">
                  <label>Mother's Phone Number</label>
                  <input type="text" className="form-control" name="motherPhoneNumber" value={formData.motherPhoneNumber} onChange={handleInputChange} placeholder="e.g. 08059876543" />
                </div>
                <div className="form-group">
                  <label>Mother's Email Address</label>
                  <input type="email" className="form-control" name="motherEmail" value={formData.motherEmail} onChange={handleInputChange} placeholder="mother@gmail.com" />
                </div>
              </div>

              <div className="sub-section-title">📱 Primary Notification Contact (For Email &amp; SMS Alerts)</div>
              <div className="form-grid-2 highlight-box">
                <div className="form-group">
                  <label>Primary Parent Email Address (Receives Admission Status &amp; Portal Login) *</label>
                  <input type="email" className="form-control" name="parentEmail" value={formData.parentEmail} onChange={handleInputChange} placeholder="parent@gmail.com" required />
                </div>

                <div className="form-group">
                  <label>Primary Parent Phone Number (Receives Assessment SMS) *</label>
                  <input type="text" className="form-control" name="parentPhoneNumber" value={formData.parentPhoneNumber} onChange={handleInputChange} placeholder="08031234567" required />
                </div>
              </div>

              <div className="sub-section-title">🏠 Guardian Information (If Different)</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Guardian's Name</label>
                  <input type="text" className="form-control" name="guardianName" value={formData.guardianName} onChange={handleInputChange} placeholder="Guardian Name" />
                </div>
                <div className="form-group">
                  <label>Relationship to Child</label>
                  <input type="text" className="form-control" name="guardianRelationship" value={formData.guardianRelationship} onChange={handleInputChange} placeholder="e.g. Uncle / Aunt" />
                </div>
                <div className="form-group full-width">
                  <label>Guardian Address</label>
                  <input type="text" className="form-control" name="guardianAddress" value={formData.guardianAddress} onChange={handleInputChange} placeholder="Guardian Residential Address" />
                </div>
              </div>

              <div className="step-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('sectionA')}>
                  ⬅ Back
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setActiveTab('sectionC')}>
                  Next: Section C (Medical Info) ➔
                </button>
              </div>
            </div>
          )}

          {/* SECTION C: MEDICAL INFORMATION */}
          {activeTab === 'sectionC' && (
            <div className="form-section-card">
              <h3 className="section-heading">SECTION C: MEDICAL INFORMATION</h3>
              <div className="form-grid-2">
                
                <div className="form-group">
                  <label>Blood Group</label>
                  <select className="form-control" name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange}>
                    <option value="">-- Select Blood Group --</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Genotype</label>
                  <select className="form-control" name="genotype" value={formData.genotype} onChange={handleInputChange}>
                    <option value="">-- Select Genotype --</option>
                    <option value="AA">AA</option>
                    <option value="AS">AS</option>
                    <option value="SS">SS</option>
                    <option value="AC">AC</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Any Medical Condition / Allergy</label>
                  <textarea className="form-control" name="medicalConditions" value={formData.medicalConditions} onChange={handleInputChange} rows={2} placeholder="State any allergies, asthma, or medical conditions..." />
                </div>

                <div className="form-group">
                  <label>Doctor's Name / Clinic</label>
                  <input type="text" className="form-control" name="doctorNameClinic" value={formData.doctorNameClinic} onChange={handleInputChange} placeholder="Name of Family Doctor or Hospital" />
                </div>

                <div className="form-group">
                  <label>Emergency Contact Number</label>
                  <input type="text" className="form-control" name="emergencyContactNumber" value={formData.emergencyContactNumber} onChange={handleInputChange} placeholder="e.g. 08029998877" />
                </div>

              </div>

              <div className="step-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('sectionB')}>
                  ⬅ Back
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setActiveTab('sectionD')}>
                  Next: Section D (Documents) ➔
                </button>
              </div>
            </div>
          )}

          {/* SECTION D: DOCUMENTS REQUIRED CHECKLIST & UPLOADS */}
          {activeTab === 'sectionD' && (
            <div className="form-section-card">
              <h3 className="section-heading">SECTION D: DOCUMENTS REQUIRED (TICK IF SUBMITTED)</h3>
              
              <div className="checklist-container">
                
                {/* Birth Certificate */}
                <div className="checklist-item-row">
                  <label className="checkbox-label">
                    <input type="checkbox" name="birthCertificateSubmitted" checked={formData.birthCertificateSubmitted} onChange={handleInputChange} />
                    <span>Birth Certificate</span>
                  </label>
                  <div className="file-upload-box">
                    <input type="file" accept="image/*,application/pdf" onChange={(e) => setBirthCertFile(e.target.files?.[0] || null)} />
                  </div>
                </div>

                {/* Passports */}
                <div className="checklist-item-row">
                  <label className="checkbox-label">
                    <input type="checkbox" name="passportsSubmitted" checked={formData.passportsSubmitted} onChange={handleInputChange} />
                    <span>2 Passport Photographs</span>
                  </label>
                  <div className="file-upload-box">
                    <input type="file" accept="image/*" onChange={(e) => setPassportFile(e.target.files?.[0] || null)} />
                  </div>
                </div>

                {/* Previous Result / Transfer Certificate */}
                <div className="checklist-item-row">
                  <label className="checkbox-label">
                    <input type="checkbox" name="previousResultSubmitted" checked={formData.previousResultSubmitted} onChange={handleInputChange} />
                    <span>Previous School Result / Transfer Certificate</span>
                  </label>
                  <div className="file-upload-box">
                    <input type="file" accept="image/*,application/pdf" onChange={(e) => setPreviousResultFile(e.target.files?.[0] || null)} />
                  </div>
                </div>

                {/* Other Documents */}
                <div className="form-group full-width mt-3">
                  <label>Other Documents (Specify)</label>
                  <input type="text" className="form-control" name="otherDocuments" value={formData.otherDocuments} onChange={handleInputChange} placeholder="e.g. Immunization Card" />
                </div>

                {/* Payment Proof Upload */}
                <div className="form-group full-width mt-2">
                  <label>Upload Application Payment Receipt / Proof</label>
                  <input type="file" className="form-control" accept="image/*,application/pdf" onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)} />
                </div>

              </div>

              <div className="step-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('sectionC')}>
                  ⬅ Back
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setActiveTab('sectionE')}>
                  Next: Section E (Declaration) ➔
                </button>
              </div>
            </div>
          )}

          {/* SECTION E: DECLARATION */}
          {activeTab === 'sectionE' && (
            <div className="form-section-card">
              <h3 className="section-heading">SECTION E: DECLARATION</h3>
              
              <div className="declaration-box">
                <p className="declaration-text">
                  I, <input type="text" className="inline-declarant-input" name="declarantFullName" value={formData.declarantFullName} onChange={handleInputChange} placeholder="Parent/Guardian Full Name" required /> (Parent/Guardian), hereby declare that the information provided above is true to the best of my knowledge.
                </p>

                <div className="declaration-agree-check">
                  <label className="checkbox-label">
                    <input type="checkbox" name="agreeDeclaration" checked={formData.agreeDeclaration} onChange={handleInputChange} required />
                    <span>I confirm and sign this digital admission declaration.</span>
                  </label>
                </div>
              </div>

              <div className="step-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('sectionD')}>
                  ⬅ Back
                </button>
                <button type="submit" className="btn btn-success submit-app-btn" disabled={loading}>
                  {loading ? 'Submitting Application...' : '📩 Submit Admission Application'}
                </button>
              </div>
            </div>
          )}

        </form>

      </div>
    </div>
  );
}

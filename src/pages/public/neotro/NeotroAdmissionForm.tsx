import React, { useState, useEffect } from 'react';
import { api, API_ROOT, getTenantId } from '../../../services/api';
import { useTenant } from '../../../context/TenantContext';
import { Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import './NeotroAdmissionForm.css';

interface ClassItem {
  id: string;
  name: string;
  level: string;
  section: string;
}

export default function NeotroAdmissionForm() {
  const { schoolName: tenantSchoolName, logoUrl } = useTenant();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Form Section Tab: 'sectionA' | 'sectionB' | 'sectionC' | 'sectionD' | 'sectionE' | 'sectionF'
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

    // Section E: Rules & Regulations & Section F: Declaration
    agreeRules: false,
    declarantFullName: '',
    agreeDeclaration: false,
  });

  // Files
  const [birthCertFile, setBirthCertFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [previousResultFile, setPreviousResultFile] = useState<File | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await api.get('/setup/classes');
      setClasses(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setFormData((prev) => ({ ...prev, targetClassId: data[0].id }));
      }
    } catch (err) {
      console.error('Failed to load classes for public admission form', err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dobStr = e.target.value;
    let calculatedAge = 0;
    if (dobStr) {
      const dob = new Date(dobStr);
      const diffMs = Date.now() - dob.getTime();
      const ageDate = new Date(diffMs);
      calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
    }
    setFormData((prev) => ({ ...prev, dateOfBirth: dobStr, age: calculatedAge }));
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
      setError('Please select the Class Applied For.');
      setActiveTab('sectionA');
      return;
    }

    const hasParentName =
      formData.fatherName.trim() || formData.motherName.trim() || formData.guardianName.trim();
    if (!hasParentName) {
      setError('Please provide at least one Parent or Guardian Full Name in Section B.');
      setActiveTab('sectionB');
      return;
    }

    if (!formData.parentEmail.trim() || !formData.parentPhoneNumber.trim()) {
      setError('Please provide a valid Parent Contact Email and Phone Number in Section B.');
      setActiveTab('sectionB');
      return;
    }
    if (!formData.agreeRules) {
      setError('Please review and accept the School Rules and Regulations in Section E.');
      setActiveTab('sectionE');
      return;
    }
    if (!formData.agreeDeclaration || !formData.declarantFullName.trim()) {
      setError('Please complete the Parent/Guardian Declaration in Section F.');
      setActiveTab('sectionF');
      return;
    }

    try {
      setLoading(true);
      const submitData = new FormData();
      submitData.append('tenantId', getTenantId());
      Object.entries(formData).forEach(([key, val]) => {
        if (key === 'dateOfBirth' && (!val || val === '')) return;
        submitData.append(key, val !== null && val !== undefined ? val.toString() : '');
      });

      if (birthCertFile) submitData.append('BirthCertificateFile', birthCertFile);
      if (passportFile) submitData.append('PassportPhotoFile', passportFile);
      if (previousResultFile) submitData.append('PreviousResultFile', previousResultFile);

      await api.post('/public/admission', submitData);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Admission form submission error:', err);
      setError(
        err.message ||
          'Failed to submit admission application. Please check required fields and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="neotro-admission-page">
        <div className="neotro-admission-container success-card">
          <div className="success-icon"><CheckCircle2 size={54} color="#1B5E4B" /></div>
          <h2 className="success-title">Application Submitted Successfully!</h2>
          <p className="success-message">
            Thank you for registering your child with{' '}
            <strong>{tenantSchoolName || 'NEOTRO ACADEMIC SYSTEM'}</strong>.
          </p>
          <div className="success-details-box">
            <p><strong>Student Name:</strong> {formData.fullName}</p>
            <p><strong>Primary Parent Email:</strong> {formData.parentEmail}</p>
            <p><strong>Primary Parent Phone:</strong> {formData.parentPhoneNumber}</p>
          </div>
          <p className="success-next-steps">
            Our admissions office and academic panel have received your application. You will receive an <strong>Email and SMS</strong> notifying you regarding physical assessment and document verification.
          </p>
          <button className="neotro-btn neotro-btn-primary" onClick={() => window.location.reload()}>
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="neotro-admission-page">
      <div className="neotro-admission-container">
        {/* School Banner Header */}
        <div className="neotro-admission-header-card">
          <div className="neotro-logo-container">
            {logoUrl ? (
              <img src={logoUrl} alt={tenantSchoolName || 'Neotro School'} className="neotro-school-logo" />
            ) : (
              <div className="neotro-logo-icon">
                <Shield size={32} color="#FFFFFF" />
              </div>
            )}
          </div>
          <h1 className="neotro-form-title">{tenantSchoolName || 'NEOTRO ACADEMIC SYSTEM'}</h1>
          <h2 className="neotro-form-subtitle">OFFICIAL ONLINE ADMISSION REGISTRATION</h2>
          <p className="neotro-address">Victoria Island Campus, Lagos State, Nigeria</p>
        </div>

        {/* Target Session & Class Bar */}
        <div className="neotro-target-bar">
          <div className="form-group">
            <label>Academic Session *</label>
            <input
              type="text"
              className="form-control"
              name="session"
              value={formData.session}
              onChange={handleInputChange}
              placeholder="e.g. 2026/2027"
              required
            />
          </div>

          <div className="form-group">
            <label>Class Applied For *</label>
            <select
              className="form-control"
              name="targetClassId"
              value={formData.targetClassId}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Select Class --</option>
              {classes.map((c) => {
                const displayName =
                  c.section && c.section.trim() !== '' ? `${c.name} ${c.section}`.trim() : c.name;
                return (
                  <option key={c.id} value={c.id}>
                    {displayName}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Section Tab Stepper Navigation */}
        <div className="neotro-tabs-nav">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'sectionA' ? 'active' : ''}`}
            onClick={() => setActiveTab('sectionA')}
          >
            Section A: Student Info
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'sectionB' ? 'active' : ''}`}
            onClick={() => setActiveTab('sectionB')}
          >
            Section B: Parent/Guardian
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'sectionC' ? 'active' : ''}`}
            onClick={() => setActiveTab('sectionC')}
          >
            Section C: Medical Info
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'sectionD' ? 'active' : ''}`}
            onClick={() => setActiveTab('sectionD')}
          >
            Section D: Documents
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'sectionE' ? 'active' : ''}`}
            onClick={() => setActiveTab('sectionE')}
          >
            Section E: Rules &amp; Code
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'sectionF' ? 'active' : ''}`}
            onClick={() => setActiveTab('sectionF')}
          >
            Section F: Declaration
          </button>
        </div>

        {error && <div className="neotro-alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="neotro-admission-form">
          {/* SECTION A: STUDENT INFORMATION */}
          {activeTab === 'sectionA' && (
            <div className="neotro-card">
              <h3 className="section-heading">SECTION A: STUDENT INFORMATION</h3>
              <div className="form-grid-2">
                <div className="form-group full-width">
                  <label>Full Name of Child (Surname First) *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. ADENIRAN, Samuel Kayode"
                    required
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Date of Birth *</label>
                    {formData.age > 0 && (
                      <span className="age-badge">Calculated Age: {formData.age} yrs</span>
                    )}
                  </div>
                  <input
                    type="date"
                    className="form-control"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleDobChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    className="form-control"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Place of Birth</label>
                  <input
                    type="text"
                    className="form-control"
                    name="placeOfBirth"
                    value={formData.placeOfBirth}
                    onChange={handleInputChange}
                    placeholder="e.g. Lagos, Nigeria"
                  />
                </div>

                <div className="form-group">
                  <label>Nationality</label>
                  <input
                    type="text"
                    className="form-control"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    placeholder="e.g. Nigerian"
                  />
                </div>

                <div className="form-group">
                  <label>State of Origin</label>
                  <input
                    type="text"
                    className="form-control"
                    name="stateOfOrigin"
                    value={formData.stateOfOrigin}
                    onChange={handleInputChange}
                    placeholder="e.g. Lagos State"
                  />
                </div>

                <div className="form-group">
                  <label>L.G.A.</label>
                  <input
                    type="text"
                    className="form-control"
                    name="lga"
                    value={formData.lga}
                    onChange={handleInputChange}
                    placeholder="e.g. Eti-Osa"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Home Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="homeAddress"
                    value={formData.homeAddress}
                    onChange={handleInputChange}
                    placeholder="Full residential address"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Previous School Attended (if any)</label>
                  <input
                    type="text"
                    className="form-control"
                    name="lastSchoolAttended"
                    value={formData.lastSchoolAttended}
                    onChange={handleInputChange}
                    placeholder="Name of previous school"
                  />
                </div>

                <div className="form-group">
                  <label>Last Class Completed</label>
                  <input
                    type="text"
                    className="form-control"
                    name="lastClassCompleted"
                    value={formData.lastClassCompleted}
                    onChange={handleInputChange}
                    placeholder="e.g. Primary 5"
                  />
                </div>
              </div>

              <div className="step-actions">
                <button
                  type="button"
                  className="neotro-btn neotro-btn-primary"
                  onClick={() => setActiveTab('sectionB')}
                >
                  Next: Parent Info <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* SECTION B: PARENT/GUARDIAN INFORMATION */}
          {activeTab === 'sectionB' && (
            <div className="neotro-card">
              <h3 className="section-heading">SECTION B: PARENT / GUARDIAN INFORMATION</h3>

              <div className="sub-heading">Father's Information</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Father's Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                    placeholder="Father's Name"
                  />
                </div>
                <div className="form-group">
                  <label>Occupation</label>
                  <input
                    type="text"
                    className="form-control"
                    name="fatherOccupation"
                    value={formData.fatherOccupation}
                    onChange={handleInputChange}
                    placeholder="Father's Occupation"
                  />
                </div>
                <div className="form-group">
                  <label>Father's Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="fatherPhoneNumber"
                    value={formData.fatherPhoneNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. 08031234567"
                  />
                </div>
                <div className="form-group">
                  <label>Father's Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    name="fatherEmail"
                    value={formData.fatherEmail}
                    onChange={handleInputChange}
                    placeholder="father@gmail.com"
                  />
                </div>
              </div>

              <div className="sub-heading">Mother's Information</div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Mother's Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleInputChange}
                    placeholder="Mother's Name"
                  />
                </div>
                <div className="form-group">
                  <label>Occupation</label>
                  <input
                    type="text"
                    className="form-control"
                    name="motherOccupation"
                    value={formData.motherOccupation}
                    onChange={handleInputChange}
                    placeholder="Mother's Occupation"
                  />
                </div>
                <div className="form-group">
                  <label>Mother's Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="motherPhoneNumber"
                    value={formData.motherPhoneNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. 08059876543"
                  />
                </div>
                <div className="form-group">
                  <label>Mother's Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    name="motherEmail"
                    value={formData.motherEmail}
                    onChange={handleInputChange}
                    placeholder="mother@gmail.com"
                  />
                </div>
              </div>

              <div className="sub-heading">Primary Notification Contact (Email &amp; SMS)</div>
              <div className="form-grid-2 highlight-box-neotro">
                <div className="form-group">
                  <label>Primary Parent Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleInputChange}
                    placeholder="parent@gmail.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Primary Parent Phone Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="parentPhoneNumber"
                    value={formData.parentPhoneNumber}
                    onChange={handleInputChange}
                    placeholder="08031234567"
                    required
                  />
                </div>
              </div>

              <div className="step-actions">
                <button
                  type="button"
                  className="neotro-btn neotro-btn-secondary"
                  onClick={() => setActiveTab('sectionA')}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="neotro-btn neotro-btn-primary"
                  onClick={() => setActiveTab('sectionC')}
                >
                  Next: Medical Info <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* SECTION C: MEDICAL INFORMATION */}
          {activeTab === 'sectionC' && (
            <div className="neotro-card">
              <h3 className="section-heading">SECTION C: MEDICAL INFORMATION</h3>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Blood Group</label>
                  <select
                    className="form-control"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                  >
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
                  <select
                    className="form-control"
                    name="genotype"
                    value={formData.genotype}
                    onChange={handleInputChange}
                  >
                    <option value="">-- Select Genotype --</option>
                    <option value="AA">AA</option>
                    <option value="AS">AS</option>
                    <option value="SS">SS</option>
                    <option value="AC">AC</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Medical Conditions / Allergies</label>
                  <textarea
                    className="form-control"
                    name="medicalConditions"
                    value={formData.medicalConditions}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="State any allergies or medical requirements..."
                  />
                </div>
              </div>

              <div className="step-actions">
                <button
                  type="button"
                  className="neotro-btn neotro-btn-secondary"
                  onClick={() => setActiveTab('sectionB')}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="neotro-btn neotro-btn-primary"
                  onClick={() => setActiveTab('sectionD')}
                >
                  Next: Documents <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* SECTION D: DOCUMENTS REQUIRED CHECKLIST */}
          {activeTab === 'sectionD' && (
            <div className="neotro-card">
              <h3 className="section-heading">SECTION D: DOCUMENTS REQUIRED</h3>
              <div className="checklist-container">
                <div className="checklist-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="birthCertificateSubmitted"
                      checked={formData.birthCertificateSubmitted}
                      onChange={handleInputChange}
                    />
                    <span>Birth Certificate</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setBirthCertFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="checklist-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="passportsSubmitted"
                      checked={formData.passportsSubmitted}
                      onChange={handleInputChange}
                    />
                    <span>Passport Photograph</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="checklist-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="previousResultSubmitted"
                      checked={formData.previousResultSubmitted}
                      onChange={handleInputChange}
                    />
                    <span>Previous Academic Result</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setPreviousResultFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="step-actions">
                <button
                  type="button"
                  className="neotro-btn neotro-btn-secondary"
                  onClick={() => setActiveTab('sectionC')}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="neotro-btn neotro-btn-primary"
                  onClick={() => setActiveTab('sectionE')}
                >
                  Next: Rules &amp; Code <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* SECTION E: RULES & CODE */}
          {activeTab === 'sectionE' && (
            <div className="neotro-card">
              <h3 className="section-heading">SECTION E: CODE OF CONDUCT &amp; RULES</h3>
              <div className="rules-box">
                <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                  <li>Punctuality and consistent attendance are required for academic success.</li>
                  <li>Prescribed institutional uniform and grooming guidelines must be strictly observed.</li>
                  <li>Academic integrity and mutual respect are non-negotiable core values.</li>
                  <li>Digital devices during instructional hours require explicit instructor consent.</li>
                </ol>

                <div style={{ marginTop: '1.5rem' }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="agreeRules"
                      checked={formData.agreeRules}
                      onChange={handleInputChange}
                      required
                    />
                    <span style={{ fontWeight: 700 }}>I agree to abide by the Neotro Academic Code of Conduct.</span>
                  </label>
                </div>
              </div>

              <div className="step-actions">
                <button
                  type="button"
                  className="neotro-btn neotro-btn-secondary"
                  onClick={() => setActiveTab('sectionD')}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="neotro-btn neotro-btn-primary"
                  onClick={() => setActiveTab('sectionF')}
                >
                  Next: Declaration <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* SECTION F: DECLARATION */}
          {activeTab === 'sectionF' && (
            <div className="neotro-card">
              <h3 className="section-heading">SECTION F: PARENT/GUARDIAN DECLARATION</h3>
              <div className="declaration-box-neotro">
                <p>
                  I,{' '}
                  <input
                    type="text"
                    className="inline-input"
                    name="declarantFullName"
                    value={formData.declarantFullName}
                    onChange={handleInputChange}
                    placeholder="Parent/Guardian Full Name"
                    required
                  />{' '}
                  hereby declare that all information submitted in this application is accurate and complete.
                </p>

                <div style={{ marginTop: '1.25rem' }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="agreeDeclaration"
                      checked={formData.agreeDeclaration}
                      onChange={handleInputChange}
                      required
                    />
                    <span>I confirm and sign this digital admission declaration.</span>
                  </label>
                </div>
              </div>

              <div className="step-actions">
                <button
                  type="button"
                  className="neotro-btn neotro-btn-secondary"
                  onClick={() => setActiveTab('sectionE')}
                >
                  Back
                </button>
                <button type="submit" className="neotro-btn neotro-btn-submit" disabled={loading}>
                  {loading ? 'Submitting Application...' : 'Submit Neotro Application'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

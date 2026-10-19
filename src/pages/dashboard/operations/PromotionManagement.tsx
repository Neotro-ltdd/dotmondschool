import React, { useState } from 'react';
import { api } from '../../../services/api';
import { getSessionOptions } from '../../../utils/sessionOptions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  Users,
  ArrowRightCircle,
  CheckCircle,
  AlertTriangle,
  FileText,
  X,
  Search,
  Filter,
  Download,
  Edit3,
  RotateCcw,
  Eye,
  History,
  ShieldAlert,
  PlayCircle,
  LayoutGrid,
  List,
  BookOpen,
  Calendar,
  Percent,
  ChevronRight,
  UserCheck,
  UserX,
  Award,
  Trash2,
  Send,
  Sparkles,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import { SlideNotification } from '../../../components/ui/SlideNotification';
import { useDialog } from '../../../context/DialogContext';
import { useActiveTerm } from '../../../hooks/useActiveTerm';
import IdCardPrintModal from '../students/IdCardPrintModal';
import './PromotionManagement.css';

interface ClassItem {
  id: string;
  name: string;
  level: string;
}

interface DPStudent {
  id: string;
  firstName: string;
  surname: string;
  otherNames?: string;
  registrationNumber: string;
  className?: string;
  classId?: string;
  isIdCardPrinted?: boolean;
}

interface AccelerationPreview {
  studentId: string;
  studentName: string;
  currentClassId: string;
  currentClassName: string;
  currentRegNumber: string;
  isIdCardPrintedCurrent: boolean;
  targetClassId: string;
  targetClassName: string;
  targetClassStudentCount: number;
  assignedSequence: number;
  assignedRegNumber: string;
  strategyUsed: string;
  strategyNote: string;
  suggestedSkippedClass: string;
  existingStudentsUntouched: boolean;
  safetyGuarantee: string;
}

interface AccelerationHistoryItem {
  id: string;
  studentId: string;
  studentName: string;
  currentClass: string;
  originalDecision: string;
  newDecision: string;
  principalName: string;
  reasonNote: string;
  date: string;
}

interface StudentRecord {
  recommendationId: string;
  studentId: string;
  studentName: string;
  registrationNumber: string;
  annualAverage: number;
  systemRecommendation: string;
  finalDecision: string;
  hasOverride: boolean;
  overrideDetails?: {
    principal: string;
    reason: string;
    date: string;
  };
}

interface ReportData {
  batchId?: string;
  class: string;
  nextClass: string;
  session: string;
  status: string;
  dateCreated: string;
  summary: {
    totalStudents: number;
    promotableCount: number;
    heldBackCount: number;
    graduatingCount: number;
    exemptCount?: number;
    overridesCount: number;
  };
  records: StudentRecord[];
}

import { useAuth } from '../../../context/AuthContext';

export default function PromotionManagement() {
  const { userRole } = useAuth();
  const isReadOnly = userRole === 'Chairman';
  const queryClient = useQueryClient();
  const { showConfirm } = useDialog();
  const year = new Date().getFullYear();

  // Tab & View States
  const [activeTab, setActiveTab] = useState<'promotion' | 'report' | 'history' | 'double-promote'>('promotion');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Notification Toast State
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
    action?: { label: string; onClick: () => void };
  }>({
    isOpen: false,
    message: '',
    type: 'info',
  });

  const showNotification = (
    message: string,
    type: 'success' | 'warning' | 'error' | 'info' = 'info',
    title?: string,
    action?: { label: string; onClick: () => void },
  ) => {
    setNotification({ isOpen: true, message, type, title, action });
  };

  // --- DOUBLE PROMOTION / ACADEMIC ACCELERATION STATE ---
  const [dpOriginClassId, setDpOriginClassId] = useState<string>('');
  const [dpStudentSearch, setDpStudentSearch] = useState<string>('');
  const [dpSelectedStudentId, setDpSelectedStudentId] = useState<string>('');
  const [dpTargetClassId, setDpTargetClassId] = useState<string>('');
  const [dpSkippedClass, setDpSkippedClass] = useState<string>('');
  const [dpRegStrategy, setDpRegStrategy] = useState<'TailAppend' | 'PreserveSuffix'>('TailAppend');
  const [dpReasonNote, setDpReasonNote] = useState<string>(
    'Special Academic Acceleration: Student demonstrated superior cognitive readiness and academic milestone attainment. Following consultation and mutual agreement with parents, the School Board and Principal approved double promotion directly into the target class, skipping the intervening curriculum grade.'
  );
  const [dpConsultationConsent, setDpConsultationConsent] = useState<boolean>(false);
  const [dpAssignedRegNumber, setDpAssignedRegNumber] = useState<string>('');
  const [printStudentId, setPrintStudentId] = useState<string | null>(null);

  // --- CLASS PROMOTION STATE ---
  const [selectedClassId, setSelectedClassId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const { session: nextSession, setSession: setNextSession } = useActiveTerm();
  const [minScore, setMinScore] = useState<number>(50);
  const [batchId, setBatchId] = useState<string | null>(null);

  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideRecId, setOverrideRecId] = useState('');
  const [overrideDecision, setOverrideDecision] = useState('Promotable');
  const [overrideReason, setOverrideReason] = useState('');
  const [promoSearchQuery, setPromoSearchQuery] = useState('');

  // --- PROMOTION REPORT STATE ---
  const [reportClassId, setReportClassId] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('All');
  const [reportSearchQuery, setReportSearchQuery] = useState('');

  // 1. Fetch Classes using React Query
  const { data: classes = [], isLoading: classesLoading } = useQuery<ClassItem[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/setup/classes');
      return res;
    },
  });

  // 2. Fetch Report (By Batch ID for Class Promotion Tab)
  const { data: batchReport, isLoading: batchReportLoading } = useQuery<ReportData>({
    queryKey: ['promotionReport', batchId],
    queryFn: async () => {
      if (!batchId) return null;
      const res = await api.get(`/reports/academics/promotions/${batchId}`);
      return res;
    },
    enabled: !!batchId && activeTab === 'promotion',
  });

  // 3. Fetch Report (By Class ID for Promotion Report Tab)
  const { data: classReport, isLoading: classReportLoading } = useQuery<ReportData>({
    queryKey: ['promotionReportByClass', reportClassId],
    queryFn: async () => {
      if (!reportClassId) return null;
      try {
        const res = await api.get(`/reports/academics/promotions/class/${reportClassId}/latest`);
        return res;
      } catch (err: any) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!reportClassId && activeTab === 'report',
    retry: false,
  });

  // 4. Fetch All Promotion Batches for Approved & Historical Lists Tab
  const { data: promotionBatches = [], isLoading: batchesLoading } = useQuery<any[]>({
    queryKey: ['allPromotionBatches'],
    queryFn: async () => {
      return await api.get('/academics/promotion/batches');
    },
    enabled: activeTab === 'history',
  });

  // Mutations
  const generateBatchMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/academics/promotion/generate', payload);
    },
    onSuccess: (data) => {
      if (data.batchId) {
        setBatchId(data.batchId);
        showNotification(
          'Promotion evaluation generated successfully! Review student decisions below.',
          'success',
          'List Generated',
        );
      }
    },
    onError: (err: any) => {
      const errMsg = err.message || 'Failed to generate promotion list.';
      if (
        errMsg.toLowerCase().includes('already approved') ||
        errMsg.toLowerCase().includes('already exists')
      ) {
        showNotification(errMsg, 'warning', 'Promotion Already Executed', {
          label: 'View Approved Batches',
          onClick: () => setActiveTab('history'),
        });
      } else {
        showNotification(errMsg, 'error', 'Generation Error');
      }
    },
  });

  const approveBatchMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/academics/promotion/approve', { batchId });
    },
    onSuccess: () => {
      showNotification(
        'Promotions executed successfully! Students have been transitioned to their target classes.',
        'success',
        'Execution Complete',
      );
      queryClient.invalidateQueries({ queryKey: ['promotionReport', batchId] });
      queryClient.invalidateQueries({ queryKey: ['promotionReportByClass'] });
      queryClient.invalidateQueries({ queryKey: ['allPromotionBatches'] });
    },
    onError: (err: any) => {
      showNotification(err.message || 'Failed to approve promotions.', 'error', 'Approval Error');
    },
  });

  const revertBatchMutation = useMutation({
    mutationFn: async (targetId?: string) => {
      const idToUse = targetId || batchId;
      if (!idToUse) throw new Error('No promotion list selected.');
      return await api.post('/academics/promotion/revert', { batchId: idToUse });
    },
    onSuccess: () => {
      showNotification(
        'Promotion batch successfully revoked & unlocked! You can now edit student decisions or regenerate.',
        'success',
        'Batch Unlocked',
      );
      queryClient.invalidateQueries({ queryKey: ['promotionReport', batchId] });
      queryClient.invalidateQueries({ queryKey: ['promotionReportByClass'] });
      queryClient.invalidateQueries({ queryKey: ['allPromotionBatches'] });
    },
    onError: (err: any) => {
      showNotification(err.message || 'Failed to unlock promotion batch.', 'error', 'Revert Error');
    },
  });

  const overrideMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/academics/promotion/override', payload);
    },
    onSuccess: () => {
      setShowOverrideModal(false);
      showNotification(
        'Student promotion decision updated successfully.',
        'success',
        'Status Overridden',
      );
      queryClient.invalidateQueries({ queryKey: ['promotionReport', batchId] });
      queryClient.invalidateQueries({ queryKey: ['promotionReportByClass'] });
      queryClient.invalidateQueries({ queryKey: ['allPromotionBatches'] });
    },
    onError: (err: any) => {
      showNotification(
        err.message || 'Failed to override student decision.',
        'error',
        'Update Error',
      );
    },
  });

  const promoteSingleMutation = useMutation({
    mutationFn: async (payload: { recommendationId: string }) => {
      return await api.post('/academics/promotion/promote-single', payload);
    },
    onSuccess: (res: any) => {
      showNotification(
        res?.message || 'Single student promotion notification processed successfully.',
        'success',
        'Notification Sent',
      );
      queryClient.invalidateQueries({ queryKey: ['promotionReport', batchId] });
      queryClient.invalidateQueries({ queryKey: ['promotionReportByClass'] });
      queryClient.invalidateQueries({ queryKey: ['allPromotionBatches'] });
    },
    onError: (err: any) => {
      showNotification(
        err.message || 'Failed to send student notification.',
        'error',
        'Notification Error',
      );
    },
  });

  const handlePromoteSingle = async (recId: string, studentName: string, decision: string) => {
    const confirmed = await showConfirm(
      `Do you want to execute promotion & send the notification email for ${studentName} based on the Final Decision (${decision})?`,
      {
        title: 'Send Student Promotion Notification',
        type: 'info',
        confirmText: 'Send Notification',
        cancelText: 'Cancel',
      },
    );
    if (confirmed) {
      promoteSingleMutation.mutate({ recommendationId: recId });
    }
  };

  const deleteBatchMutation = useMutation({
    mutationFn: async (targetBatchId: string) => {
      return await api.delete(`/academics/promotion/batch/${targetBatchId}`);
    },
    onSuccess: () => {
      showNotification('Promotion batch deleted successfully.', 'success', 'Batch Deleted');
      queryClient.invalidateQueries({ queryKey: ['allPromotionBatches'] });
      queryClient.invalidateQueries({ queryKey: ['promotionReport'] });
      queryClient.invalidateQueries({ queryKey: ['promotionReportByClass'] });
    },
    onError: (err: any) => {
      showNotification(err.message || 'Failed to delete promotion batch.', 'error', 'Delete Error');
    },
  });

  // 5. Fetch all students for Double Promotion tab
  const { data: allStudents = [], isLoading: allStudentsLoading } = useQuery<DPStudent[]>({
    queryKey: ['studentsForDoublePromotion'],
    queryFn: async () => {
      const res = await api.get('/setup/students');
      return res;
    },
    enabled: activeTab === 'double-promote',
  });

  // 6. Acceleration Preview Query
  const { data: previewData, isLoading: previewLoading } = useQuery<AccelerationPreview | null>({
    queryKey: ['previewDoublePromotion', dpSelectedStudentId, dpTargetClassId, dpRegStrategy],
    queryFn: async () => {
      if (!dpSelectedStudentId || !dpTargetClassId) return null;
      const res = await api.get(
        `/academics/promotion/preview-double-promotion?studentId=${dpSelectedStudentId}&targetClassId=${dpTargetClassId}&strategy=${dpRegStrategy}`
      );
      return res;
    },
    enabled: !!dpSelectedStudentId && !!dpTargetClassId && activeTab === 'double-promote',
  });

  // Auto-populate suggested skipped class if not manually edited
  // Auto-populate suggested skipped class and assigned reg number when previewData loads
  React.useEffect(() => {
    if (previewData?.suggestedSkippedClass && (!dpSkippedClass || dpSkippedClass === 'Intervening Grade')) {
      setDpSkippedClass(previewData.suggestedSkippedClass);
    }
    if (previewData?.assignedRegNumber) {
      setDpAssignedRegNumber(previewData.assignedRegNumber);
    }
  }, [previewData?.suggestedSkippedClass, previewData?.assignedRegNumber]);

  // 7. Fetch recent double promotions history
  const { data: accelerationHistory = [], isLoading: historyLoading } = useQuery<AccelerationHistoryItem[]>({
    queryKey: ['doublePromotionsHistory'],
    queryFn: async () => {
      const res = await api.get('/academics/promotion/double-promotions');
      return res;
    },
    enabled: activeTab === 'double-promote',
  });

  // 8. Execute Double Promotion Mutation
  const doublePromoteMutation = useMutation({
    mutationFn: async (payload: {
      studentId: string;
      targetClassId: string;
      skippedClassName: string;
      reasonNote: string;
      regNumberStrategy: string;
      customRegistrationNumber?: string;
      resetIdCardStatus: boolean;
    }) => {
      return await api.post('/academics/promotion/double-promote', payload);
    },
    onSuccess: (res: any) => {
      showNotification(
        res?.message || 'Student accelerated successfully with Zero-Waste ID Card allocation!',
        'success',
        'Acceleration Executed',
        {
          label: 'Print New ID Card',
          onClick: () => setPrintStudentId(res?.studentId),
        }
      );
      queryClient.invalidateQueries({ queryKey: ['doublePromotionsHistory'] });
      queryClient.invalidateQueries({ queryKey: ['studentsForDoublePromotion'] });
      queryClient.invalidateQueries({ queryKey: ['previewDoublePromotion'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['promotionReport'] });
      setDpConsultationConsent(false);
    },
    onError: (err: any) => {
      showNotification(
        err?.response?.data?.message || err?.message || 'Failed to execute double promotion.',
        'error',
        'Execution Error'
      );
    },
  });

  const handleExecuteDoublePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dpSelectedStudentId || !dpTargetClassId) {
      showNotification('Please select both a student and destination class.', 'warning', 'Missing Details');
      return;
    }
    if (!dpConsultationConsent) {
      showNotification('Please confirm parent consultation and administrative authorization.', 'warning', 'Consent Required');
      return;
    }
    if (!dpReasonNote.trim() || dpReasonNote.trim().length < 10) {
      showNotification('Please provide a complete justification note (at least 10 characters) for accreditation records.', 'warning', 'Justification Required');
      return;
    }

    const selectedStudentObj = allStudents.find((s) => s.id === dpSelectedStudentId);
    const targetClassObj = classes.find((c) => c.id === dpTargetClassId);

    const assignedRegDisplay = dpAssignedRegNumber || previewData?.assignedRegNumber || 'Sequential';

    const confirmed = await showConfirm(
      `Are you sure you want to accelerate ${selectedStudentObj ? selectedStudentObj.firstName + ' ' + selectedStudentObj.surname : 'this student'} into ${targetClassObj?.name || 'the target class'}?\n\nAssigned Reg Number: ${assignedRegDisplay}\nZero-Waste Guarantee: Existing students will remain 100% untouched.`,
      {
        title: 'Confirm Academic Acceleration',
        type: 'warning',
        confirmText: 'Confirm & Accelerate',
        cancelText: 'Cancel',
      }
    );

    if (confirmed) {
      doublePromoteMutation.mutate({
        studentId: dpSelectedStudentId,
        targetClassId: dpTargetClassId,
        skippedClassName: dpSkippedClass || 'Intervening Grade',
        reasonNote: dpReasonNote,
        regNumberStrategy: dpRegStrategy,
        customRegistrationNumber: dpAssignedRegNumber ? dpAssignedRegNumber.trim() : undefined,
        resetIdCardStatus: true,
      });
    }
  };

  const filteredStudentsForDP = allStudents.filter((s) => {
    const matchesClass = !dpOriginClassId || s.classId === dpOriginClassId || s.className === dpOriginClassId;
    const matchesSearch =
      !dpStudentSearch ||
      `${s.firstName} ${s.surname}`.toLowerCase().includes(dpStudentSearch.toLowerCase()) ||
      (s.registrationNumber && s.registrationNumber.toLowerCase().includes(dpStudentSearch.toLowerCase()));
    return matchesClass && matchesSearch;
  });

  const selectedStudentObj = allStudents.find((s) => s.id === dpSelectedStudentId);

  const handleCurrentClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    if (!newClassId) {
      setTargetClassId('');
      return;
    }
    const currentClass = classes.find((c) => c.id === newClassId);
    if (currentClass) {
      if (targetClassId === newClassId) {
        setTargetClassId('');
      }
      const name = currentClass.name.trim();
      const match = name.match(/(\d+)/);
      if (match) {
        const currentNum = parseInt(match[0], 10);
        const nextNum = currentNum + 1;
        const predictedName = name.replace(String(currentNum), String(nextNum)).toLowerCase();
        const nextClass = classes.find((c) => c.name.trim().toLowerCase() === predictedName);
        if (nextClass && nextClass.id !== newClassId) {
          setTargetClassId(nextClass.id);
          return;
        }
      }
      if (targetClassId === newClassId) {
        setTargetClassId('');
      }
    }
  };

  const handleGenerateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !nextSession) {
      showNotification(
        'Please select a current class and specify the target academic session.',
        'warning',
        'Missing Selection',
      );
      return;
    }
    if (targetClassId && selectedClassId === targetClassId) {
      showNotification(
        'Target class cannot be identical to current class! Promoting a student to their current class is logically invalid.',
        'error',
        'Invalid Target Class',
      );
      return;
    }
    generateBatchMutation.mutate({
      classId: selectedClassId,
      nextClassId: targetClassId || null,
      session: nextSession,
      minimumPromotionScore: minScore,
    });
  };

  const handleApprove = async () => {
    if (!batchId) return;
    const confirmed = await showConfirm(
      'Are you sure you want to approve and execute these promotions? This action is permanent and will transition students to their target classes.',
      {
        title: 'Confirm Promotion Execution',
        type: 'warning',
        confirmText: 'Execute Promotions',
        cancelText: 'Cancel',
      },
    );
    if (confirmed) {
      approveBatchMutation.mutate();
    }
  };

  const openOverrideModal = (recId: string, currentDecision: string) => {
    setOverrideRecId(recId);
    const defaultTargetDecision =
      currentDecision === 'Held Back' || currentDecision === 'Repeat' || currentDecision?.startsWith('Exempt') ? 'Promotable' : 'Held Back';
    setOverrideDecision(defaultTargetDecision);
    setOverrideReason('');
    setShowOverrideModal(true);
  };

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      showNotification(
        'Please provide an explicit reason note for overriding this decision for audit logs.',
        'warning',
        'Reason Required',
      );
      return;
    }
    overrideMutation.mutate({
      recommendationId: overrideRecId,
      newDecision: overrideDecision,
      reasonNote: overrideReason,
    });
  };

  const exportToCSV = (records: StudentRecord[], className: string) => {
    if (!records || records.length === 0) return;
    const headers = [
      'S/N',
      'Student Name',
      'Registration Number',
      'Annual Average (%)',
      'System Recommendation',
      'Final Decision',
    ];
    const rows = records.map((r, i) => [
      i + 1,
      `"${r.studentName}"`,
      `"${r.registrationNumber}"`,
      `${r.annualAverage.toFixed(2)}%`,
      `"${r.systemRecommendation}"`,
      `"${r.finalDecision}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${className}_Promotion_Report.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getStudentInitials = (name: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  // Filtering for Class Promotion Tab
  const promoFilteredRecords = batchReport?.records.filter(
    (r) =>
      r.studentName.toLowerCase().includes(promoSearchQuery.toLowerCase()) ||
      r.registrationNumber.toLowerCase().includes(promoSearchQuery.toLowerCase()),
  );

  // Filtering for Promotion Report Tab
  const reportFilteredRecords = classReport?.records.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
      r.registrationNumber.toLowerCase().includes(reportSearchQuery.toLowerCase());
    const matchesStatus =
      reportStatusFilter === 'All' ||
      (reportStatusFilter === 'Exempt'
        ? r.finalDecision?.startsWith('Exempt')
        : r.finalDecision === reportStatusFilter);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="promo-page-container">
      <SlideNotification
        isOpen={notification.isOpen}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        action={notification.action}
        onClose={() => setNotification((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Page Header */}
      <div className="promo-page-header">
        <div>
          <h1 className="promo-page-title">
            <GraduationCap size={28} color="var(--primary-color, #000080)" />
            Student Promotion Management
          </h1>
          <p className="promo-page-subtitle">
            Configure grade thresholds, generate class transition rosters, review overrides, and
            execute annual promotions
          </p>
        </div>

        {activeTab === 'promotion' && batchReport && (
          <button
            className="btn-execute-promo-header"
            onClick={handleApprove}
            disabled={approveBatchMutation.isPending}
          >
            <CheckCircle size={18} />
            {approveBatchMutation.isPending ? 'Executing...' : 'Execute & Approve Batch'}
          </button>
        )}

        {activeTab === 'report' && classReport && (
          <button
            className="btn-execute-promo-header"
            onClick={() => exportToCSV(reportFilteredRecords || [], classReport.class)}
          >
            <Download size={18} />
            Export CSV Report
          </button>
        )}
      </div>

      {/* Metric Cards Banner (Matching Reference 4-Card Blueprint) */}
      <div className="promo-metrics-grid">
        <div className="promo-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">PROMOTED STUDENTS</span>
            <span className="metric-number">
              {batchReport?.summary.promotableCount ?? classReport?.summary.promotableCount ?? 0}
            </span>
          </div>
          <div className="metric-icon-badge promoted">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="promo-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">GRADUATING SENIORS</span>
            <span className="metric-number">
              {batchReport?.summary.graduatingCount ?? classReport?.summary.graduatingCount ?? 0}
            </span>
          </div>
          <div className="metric-icon-badge graduated">
            <Award size={22} />
          </div>
        </div>

        <div className="promo-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">HELD BACK / REVIEW</span>
            <span className="metric-number" style={{ color: '#B45309' }}>
              {batchReport?.summary.heldBackCount ?? classReport?.summary.heldBackCount ?? 0}
            </span>
          </div>
          <div className="metric-icon-badge heldback">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="promo-metric-card">
          <div className="metric-info-box">
            <span className="metric-label">EXECUTIVE OVERRIDES</span>
            <span className="metric-number" style={{ color: '#6B21A8' }}>
              {batchReport?.summary.overridesCount ?? classReport?.summary.overridesCount ?? 0}
            </span>
          </div>
          <div className="metric-icon-badge overrides">
            <Edit3 size={22} />
          </div>
        </div>
      </div>

      {/* Top Executive Navigation Tabs */}
      <div className="promo-tabs-container">
        <button
          className={`promo-tab-btn ${activeTab === 'promotion' ? 'active' : ''}`}
          onClick={() => setActiveTab('promotion')}
        >
          <PlayCircle size={17} /> Class Promotion (Execute)
        </button>
        <button
          className={`promo-tab-btn ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          <FileText size={17} /> Promotion Report (View & Export)
        </button>
        <button
          className={`promo-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={17} /> Approved Promotions (Revoke & Revert)
        </button>
        <button
          className={`promo-tab-btn ${activeTab === 'double-promote' ? 'active' : ''}`}
          onClick={() => setActiveTab('double-promote')}
        >
          <Sparkles size={17} /> Double Promotion & Acceleration
        </button>
      </div>

      {/* =========================================
          TAB 1: CLASS PROMOTION (EXECUTE)
          ========================================= */}
      {activeTab === 'promotion' && (
        <div className="promo-tab-content">
          {/* Executive Form Controls Card */}
          <div className="promo-controls-card">
            <div className="promo-controls-header">
              <div className="promo-controls-title">
                <BookOpen size={18} color="var(--primary-color, #000080)" />
                <span>Promotion Parameters & Transition Configuration</span>
              </div>
              <span className="promo-controls-badge">Step 1 of 2</span>
            </div>

            <form onSubmit={handleGenerateList} className="promo-form-grid">
              <div className="promo-form-group">
                <label>Current Class *</label>
                <div className="promo-input-wrapper">
                  <BookOpen className="field-icon" size={16} />
                  <select
                    className="promo-select-input"
                    value={selectedClassId}
                    onChange={(e) => handleCurrentClassChange(e.target.value)}
                    required
                  >
                    <option value="">Select Current Class...</option>
                    {!classesLoading &&
                      classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="promo-form-group">
                <label>Target Academic Session *</label>
                <div className="promo-input-wrapper">
                  <Calendar className="field-icon" size={16} />
                  <select
                    className="promo-select-input"
                    value={nextSession}
                    onChange={(e) => setNextSession(e.target.value)}
                    required
                  >
                    {getSessionOptions(nextSession).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="promo-form-group">
                <label>Target Class (Destination)</label>
                <div className="promo-input-wrapper">
                  <GraduationCap className="field-icon" size={16} />
                  <select
                    className="promo-select-input"
                    value={targetClassId}
                    onChange={(e) => setTargetClassId(e.target.value)}
                  >
                    <option value="">-- Graduating Class (Leave Empty if Graduating) --</option>
                    {!classesLoading &&
                      classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="promo-form-group" style={{ maxWidth: '160px' }}>
                <label>Pass Score (%) *</label>
                <div className="promo-input-wrapper">
                  <Percent className="field-icon" size={16} />
                  <input
                    type="number"
                    className="promo-select-input"
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    min={0}
                    max={100}
                    required
                  />
                </div>
              </div>

              <button
                className="btn-generate-promo"
                type="submit"
                disabled={generateBatchMutation.isPending}
              >
                <ArrowRightCircle size={18} />
                {generateBatchMutation.isPending
                  ? 'Generating Roster...'
                  : 'Generate Promotion List'}
              </button>
            </form>
          </div>

          {/* Promotion Candidate List Table & Cards Container */}
          {batchReportLoading ? (
            <div className="promo-table-wrapper loading-box">
              <div className="spinner" />
              <span>Evaluating annual scores and generating candidate recommendations...</span>
            </div>
          ) : batchReport ? (
            <div className="promo-table-wrapper">
              <div className="promo-table-toolbar">
                <div>
                  <h3 className="promo-table-title">
                    Promotion Candidate List — {batchReport.class}{' '}
                    <ChevronRight size={16} inline-block />{' '}
                    {batchReport.nextClass || 'Graduating Class'}
                  </h3>
                  <span className="promo-table-subtitle">
                    Generated on {new Date(batchReport.dateCreated).toLocaleDateString()} • Session{' '}
                    {batchReport.session}
                  </span>
                </div>

                <div className="promo-toolbar-actions">
                  <div className="promo-search-box">
                    <Search className="promo-search-icon" size={15} />
                    <input
                      type="text"
                      placeholder="Search student name or reg..."
                      value={promoSearchQuery}
                      onChange={(e) => setPromoSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* View Toggle matching reference design */}
                  <div className="promo-view-toggle">
                    <button
                      className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setViewMode('table')}
                      title="Table View"
                    >
                      <List size={15} /> Table View
                    </button>
                    <button
                      className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setViewMode('grid')}
                      title="Grid Cards"
                    >
                      <LayoutGrid size={15} /> Grid Cards
                    </button>
                  </div>

                  {!isReadOnly && (
                    <button
                      className="btn-save-grading"
                      onClick={handleApprove}
                      disabled={approveBatchMutation.isPending}
                    >
                      <CheckCircle size={18} />
                      {approveBatchMutation.isPending
                        ? 'Executing...'
                        : 'Execute & Approve Promotions'}
                    </button>
                  )}
                </div>
              </div>

              {viewMode === 'table' ? (
                <table className="executive-promo-table">
                  <thead>
                    <tr>
                      <th>STUDENT NAME</th>
                      <th>REGISTRATION NO.</th>
                      <th>ANNUAL AVERAGE</th>
                      <th>SYSTEM RECOMMENDATION</th>
                      <th>FINAL DECISION</th>
                      <th style={{ textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoFilteredRecords && promoFilteredRecords.length > 0 ? (
                      promoFilteredRecords.map((rec) => (
                        <tr key={rec.recommendationId}>
                          <td>
                            <div className="teacher-profile-cell">
                              <div className="teacher-avatar">
                                {getStudentInitials(rec.studentName)}
                              </div>
                              <div className="student-info-col">
                                <span className="teacher-name-title">{rec.studentName}</span>
                                {rec.hasOverride && (
                                  <span className="override-badge-sub">Overridden</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="reg-badge">{rec.registrationNumber}</span>
                          </td>
                          <td>
                            <div className="score-pill-box">
                              <span
                                className={`score-badge ${rec.annualAverage >= minScore ? 'pass' : 'fail'}`}
                              >
                                {rec.annualAverage.toFixed(2)}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`status-pill ${rec.systemRecommendation === 'Promotable' ? 'active' : rec.systemRecommendation === 'Graduating' ? 'info' : rec.systemRecommendation?.startsWith('Exempt') ? 'pending' : 'inactive'}`}
                            >
                              {rec.systemRecommendation}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-pill ${rec.finalDecision === 'Promotable' ? 'active' : rec.finalDecision === 'Graduating' ? 'info' : rec.finalDecision?.startsWith('Exempt') ? 'pending' : 'inactive'}`}
                            >
                              {rec.finalDecision}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                className="btn-action-override"
                                title="Override Decision"
                                onClick={() =>
                                  openOverrideModal(
                                    rec.recommendationId || rec.studentId,
                                    rec.finalDecision,
                                  )
                                }
                              >
                                <Edit3 size={14} />
                                Override
                              </button>
                              <button
                                className="btn-action-override"
                                style={{ backgroundColor: '#EEF2FF', color: '#3730A3', borderColor: '#C7D2FE' }}
                                title="Process & Send Notification for this student"
                                disabled={promoteSingleMutation.isPending}
                                onClick={() =>
                                  handlePromoteSingle(
                                    rec.recommendationId || rec.studentId,
                                    rec.studentName,
                                    rec.finalDecision,
                                  )
                                }
                              >
                                <Send size={14} />
                                Test Email
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="empty-table-cell">
                          No matching student records found for "{promoSearchQuery}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="promo-grid-wrapper">
                  {promoFilteredRecords && promoFilteredRecords.length > 0 ? (
                    promoFilteredRecords.map((rec) => (
                      <div className="promo-grid-card" key={rec.recommendationId}>
                        <div className="card-top-header">
                          <div className="teacher-avatar">
                            {getStudentInitials(rec.studentName)}
                          </div>
                          <div>
                            <span className="card-student-name">{rec.studentName}</span>
                            <span className="card-reg-no">{rec.registrationNumber}</span>
                          </div>
                        </div>

                        <div className="card-metrics-row">
                          <div className="card-metric-col">
                            <span className="card-metric-lbl">Annual Avg</span>
                            <span
                              className={`score-badge ${rec.annualAverage >= minScore ? 'pass' : 'fail'}`}
                            >
                              {rec.annualAverage.toFixed(2)}%
                            </span>
                          </div>

                          <div className="card-metric-col">
                            <span className="card-metric-lbl">Final Decision</span>
                            <span
                              className={`status-pill ${rec.finalDecision === 'Promotable' ? 'active' : rec.finalDecision === 'Graduating' ? 'info' : rec.finalDecision?.startsWith('Exempt') ? 'pending' : 'inactive'}`}
                            >
                              {rec.finalDecision}
                            </span>
                          </div>
                        </div>

                        <div className="card-footer-actions">
                          <span className="system-rec-lbl">System: {rec.systemRecommendation}</span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn-action-override"
                              onClick={() =>
                                openOverrideModal(
                                  rec.recommendationId || rec.studentId,
                                  rec.finalDecision,
                                )
                              }
                            >
                              <Edit3 size={14} /> Override
                            </button>
                            <button
                              className="btn-action-override"
                              style={{ backgroundColor: '#EEF2FF', color: '#3730A3', borderColor: '#C7D2FE' }}
                              disabled={promoteSingleMutation.isPending}
                              onClick={() =>
                                handlePromoteSingle(
                                  rec.recommendationId || rec.studentId,
                                  rec.studentName,
                                  rec.finalDecision,
                                )
                              }
                            >
                              <Send size={14} /> Test Email
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-grid-box">No matching student records found.</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="promo-empty-placeholder">
              <div className="empty-icon-circle">
                <GraduationCap size={36} color="var(--primary-color, #000080)" />
              </div>
              <h3>No Promotion Batch Selected</h3>
              <p>
                Select a current class above and click <strong>Generate Promotion List</strong> to
                initiate student transition evaluations.
              </p>
            </div>
          )}
        </div>
      )}

      {/* =========================================
          TAB 2: PROMOTION REPORT (VIEW & EXPORT)
          ========================================= */}
      {activeTab === 'report' && (
        <div className="promo-tab-content">
          <div className="promo-controls-card">
            <div className="promo-controls-header">
              <div className="promo-controls-title">
                <FileText size={18} color="var(--primary-color, #000080)" />
                <span>Class Promotion Audit & Export Controls</span>
              </div>
            </div>

            <div className="promo-controls-row">
              <div className="promo-form-group" style={{ flex: 1, minWidth: '220px' }}>
                <label>Select Class *</label>
                <div className="promo-input-wrapper">
                  <BookOpen className="field-icon" size={16} />
                  <select
                    className="promo-select-input"
                    value={reportClassId}
                    onChange={(e) => setReportClassId(e.target.value)}
                  >
                    <option value="">-- Choose Class to Audit --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="promo-form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label>Status Filter</label>
                <div className="promo-input-wrapper">
                  <Filter className="field-icon" size={16} />
                  <select
                    className="promo-select-input"
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value)}
                  >
                    <option value="All">All Decisions</option>
                    <option value="Promotable">Promotable</option>
                    <option value="Repeat">Repeat / Hold Back</option>
                    <option value="Exempt">Exempt (New Intake)</option>
                  </select>
                </div>
              </div>

              <div className="promo-search-box" style={{ flex: 1.2, minWidth: '240px' }}>
                <Search className="promo-search-icon" size={15} />
                <input
                  type="text"
                  placeholder="Search student name or reg..."
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                />
              </div>

              {classReport && (
                <button
                  className="btn-add-rule"
                  onClick={() => exportToCSV(reportFilteredRecords || [], classReport.class)}
                  style={{ height: '42px', marginTop: 'auto' }}
                >
                  <Download size={16} /> Export CSV Report
                </button>
              )}
            </div>
          </div>

          {classReportLoading ? (
            <div className="promo-table-wrapper loading-box">
              <div className="spinner" />
              <span>Fetching promotion audit records for class...</span>
            </div>
          ) : classReport ? (
            <div className="promo-table-wrapper">
              <div className="promo-table-toolbar">
                <div>
                  <h3 className="promo-table-title">
                    Latest Approved Promotion Report — {classReport.class}
                  </h3>
                  <span className="promo-table-subtitle">
                    Session {classReport.session} • Total Students:{' '}
                    {classReport.summary.totalStudents}
                  </span>
                </div>

                <div className="promo-view-toggle">
                  <button
                    className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    <List size={15} /> Table View
                  </button>
                  <button
                    className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid size={15} /> Grid Cards
                  </button>
                </div>
              </div>

              {viewMode === 'table' ? (
                <table className="executive-promo-table">
                  <thead>
                    <tr>
                      <th>STUDENT NAME</th>
                      <th>REGISTRATION NO.</th>
                      <th>ANNUAL AVERAGE</th>
                      <th>SYSTEM RECOMMENDATION</th>
                      <th>FINAL DECISION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportFilteredRecords && reportFilteredRecords.length > 0 ? (
                      reportFilteredRecords.map((rec) => (
                        <tr key={rec.recommendationId}>
                          <td>
                            <div className="teacher-profile-cell">
                              <div className="teacher-avatar">
                                {getStudentInitials(rec.studentName)}
                              </div>
                              <span className="teacher-name-title">{rec.studentName}</span>
                            </div>
                          </td>
                          <td>
                            <span className="reg-badge">{rec.registrationNumber}</span>
                          </td>
                          <td>
                            <strong>{rec.annualAverage.toFixed(2)}%</strong>
                          </td>
                          <td>
                            <span className={`status-pill ${rec.systemRecommendation === 'Promotable' ? 'active' : rec.systemRecommendation === 'Graduating' ? 'info' : rec.systemRecommendation?.startsWith('Exempt') ? 'pending' : 'inactive'}`}>{rec.systemRecommendation}</span>
                          </td>
                          <td>
                            <span className={`status-pill ${rec.finalDecision === 'Promotable' ? 'active' : rec.finalDecision === 'Graduating' ? 'info' : rec.finalDecision?.startsWith('Exempt') ? 'pending' : 'inactive'}`}>{rec.finalDecision}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="empty-table-cell">
                          No matching promotion records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="promo-grid-wrapper">
                  {reportFilteredRecords && reportFilteredRecords.length > 0 ? (
                    reportFilteredRecords.map((rec) => (
                      <div className="promo-grid-card" key={rec.recommendationId}>
                        <div className="card-top-header">
                          <div className="teacher-avatar">
                            {getStudentInitials(rec.studentName)}
                          </div>
                          <div>
                            <span className="card-student-name">{rec.studentName}</span>
                            <span className="card-reg-no">{rec.registrationNumber}</span>
                          </div>
                        </div>
                        <div className="card-metrics-row">
                          <div className="card-metric-col">
                            <span className="card-metric-lbl">Annual Avg</span>
                            <span className="score-badge pass">
                              {rec.annualAverage.toFixed(2)}%
                            </span>
                          </div>
                          <div className="card-metric-col">
                            <span className="card-metric-lbl">Final Decision</span>
                            <span className={`status-pill ${rec.finalDecision === 'Promotable' ? 'active' : rec.finalDecision === 'Graduating' ? 'info' : rec.finalDecision?.startsWith('Exempt') ? 'pending' : 'inactive'}`}>{rec.finalDecision}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-grid-box">No matching promotion records found.</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="promo-empty-placeholder">
              <div className="empty-icon-circle">
                <FileText size={36} color="var(--primary-color, #000080)" />
              </div>
              <h3>No Class Selected</h3>
              <p>
                Select a class from the dropdown above to inspect historical promotion reports and
                export CSV summaries.
              </p>
            </div>
          )}
        </div>
      )}

      {/* =========================================
          TAB 3: APPROVED PROMOTIONS (REVOKE & REVERT)
          ========================================= */}
      {activeTab === 'history' && (
        <div className="promo-tab-content">
          <div className="promo-table-wrapper">
            <div className="promo-table-toolbar">
              <div>
                <h3 className="promo-table-title">Executed & Approved Promotion Batches</h3>
                <span className="promo-table-subtitle">
                  Audit log of historical promotion executions with options to revoke and revert
                  class transitions
                </span>
              </div>
            </div>

            {batchesLoading ? (
              <div className="loading-box">
                <div className="spinner" />
                <span>Loading historical batch audit logs...</span>
              </div>
            ) : promotionBatches.length === 0 ? (
              <div className="promo-empty-placeholder" style={{ border: 'none' }}>
                <div className="empty-icon-circle">
                  <History size={36} color="var(--primary-color, #000080)" />
                </div>
                <h3>No Historical Batches Found</h3>
                <p>There are no executed promotion batches recorded in the database yet.</p>
              </div>
            ) : (
              <table className="executive-promo-table">
                <thead>
                  <tr>
                    <th>CLASS TRANSITION</th>
                    <th>ACADEMIC SESSION</th>
                    <th>EXECUTION DATE</th>
                    <th>STATUS</th>
                    <th style={{ textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {promotionBatches.map((batch: any) => {
                    const rawDate = batch.createdAt || batch.dateCreated || batch.approvedAt;
                    const formattedDate =
                      rawDate && !isNaN(new Date(rawDate).getTime())
                        ? new Date(rawDate).toLocaleDateString()
                        : 'N/A';
                    const isApproved = batch.isApproved || batch.status === 'Approved';

                    return (
                      <tr key={batch.id}>
                        <td>
                          <div className="batch-transition-cell">
                            <span className="batch-class-name">{batch.className}</span>
                            <ChevronRight size={16} className="transition-arrow" />
                            <span className="batch-target-name">
                              {batch.targetClassName ||
                                batch.nextClassName ||
                                'Graduating Senior Class'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="reg-badge">{batch.session}</span>
                        </td>
                        <td>{formattedDate}</td>
                        <td>
                          <span className={`status-pill ${isApproved ? 'active' : 'inactive'}`}>
                            {isApproved ? 'Approved & Executed' : 'Pending / Reverted'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              justifyContent: 'center',
                            }}
                          >
                            {isApproved && (
                              <button
                                className="btn-revoke-batch"
                                onClick={async () => {
                                  const confirmRevert = await showConfirm(
                                    `Are you sure you want to revoke and unlock promotions for ${batch.className}? Students will be returned to their previous class placement.`,
                                    { title: 'Confirm Promotion Reversal', type: 'warning' },
                                  );
                                  if (confirmRevert) revertBatchMutation.mutate(batch.id);
                                }}
                                disabled={revertBatchMutation.isPending}
                              >
                                <RotateCcw size={14} /> Revoke Batch
                              </button>
                            )}

                            <button
                              className="btn-delete-batch"
                              onClick={async () => {
                                const confirmDelete = await showConfirm(
                                  `Are you sure you want to permanently delete the promotion batch for ${batch.className}? This action cannot be undone.`,
                                  {
                                    title: 'Confirm Batch Deletion',
                                    type: 'warning',
                                    confirmText: 'Delete Batch',
                                    cancelText: 'Cancel',
                                  },
                                );
                                if (confirmDelete) deleteBatchMutation.mutate(batch.id);
                              }}
                              disabled={deleteBatchMutation.isPending}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* =========================================
          TAB 4: DOUBLE PROMOTION & ACADEMIC ACCELERATION
          ========================================= */}
      {activeTab === 'double-promote' && (
        <div className="dp-container">
          {/* Executive Hero Banner */}
          <div className="dp-hero-banner">
            <div className="dp-hero-title-row">
              <h2 className="dp-hero-title">
                <Sparkles size={24} color="#38bdf8" />
                Zero-Waste Academic Acceleration & Double Promotion
              </h2>
              <span className="dp-hero-badge">
                <ShieldCheck size={14} /> Zero Plastic Card Waste Guarantee
              </span>
            </div>
            <p className="dp-hero-desc">
              Promote gifted students across multiple grade levels or adjust already-executed annual promotions.
              The zero-waste numbering engine allocates the next sequential tail number in the destination class,
              ensuring <strong>100% of existing printed plastic ID cards in both classes remain completely valid and untouched</strong>.
            </p>
            <div className="dp-hero-tags">
              <span className="dp-tag-pill">🛡️ Non-Colliding Tail Sequencing</span>
              <span className="dp-tag-pill">📜 Permanent Transcript Accreditation</span>
              <span className="dp-tag-pill">⚡ Dynamic Subject Enrollment</span>
              <span className="dp-tag-pill">🏷️ Instant ID Card Queue Reset</span>
            </div>
          </div>

          <div className="dp-content-grid">
            {/* Left Card: Promotion Controls Form */}
            <form onSubmit={handleExecuteDoublePromotion} className="dp-card">
              <div className="dp-card-header">
                <h3 className="dp-card-title">
                  <ArrowRightCircle size={18} color="var(--primary-color, #000080)" />
                  Acceleration Parameters
                </h3>
                <span className="dp-step-badge">Self-Service Engine</span>
              </div>

              {/* Step 1: Student Filter & Selection */}
              <div className="dp-form-row">
                <label className="dp-form-label">
                  <span>1. Filter Student by Current Class</span>
                  <span className="dp-form-hint">Optional</span>
                </label>
                <select
                  className="dp-select"
                  value={dpOriginClassId}
                  onChange={(e) => {
                    setDpOriginClassId(e.target.value);
                    setDpSelectedStudentId('');
                  }}
                >
                  <option value="">All Classes (All School Levels)</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="dp-form-row">
                <label className="dp-form-label">
                  <span>2. Select Student to Accelerate *</span>
                  <span className="dp-form-hint">{filteredStudentsForDP.length} available</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                    <input
                      type="text"
                      className="dp-input"
                      style={{ paddingLeft: '2rem' }}
                      placeholder="Search by student name or reg number..."
                      value={dpStudentSearch}
                      onChange={(e) => setDpStudentSearch(e.target.value)}
                    />
                  </div>
                </div>
                <select
                  className="dp-select"
                  value={dpSelectedStudentId}
                  onChange={(e) => {
                    setDpSelectedStudentId(e.target.value);
                  }}
                  required
                >
                  <option value="">-- Choose Student --</option>
                  {filteredStudentsForDP.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.surname} {std.firstName} {std.otherNames ? std.otherNames + ' ' : ''}({std.registrationNumber} - {std.className || 'No Class'})
                    </option>
                  ))}
                </select>

                {selectedStudentObj && (
                  <div className="dp-student-pill-preview">
                    <div className="dp-student-avatar">
                      {getStudentInitials(`${selectedStudentObj.firstName} ${selectedStudentObj.surname}`)}
                    </div>
                    <div className="dp-student-meta">
                      <span className="dp-student-name">
                        {selectedStudentObj.firstName} {selectedStudentObj.surname} {selectedStudentObj.otherNames || ''}
                      </span>
                      <span className="dp-student-sub">
                        <span>Current Class: <strong>{selectedStudentObj.className || 'Unassigned'}</strong></span>
                        <span>•</span>
                        <span>Reg No: <strong>{selectedStudentObj.registrationNumber}</strong></span>
                        <span>•</span>
                        <span style={{ color: selectedStudentObj.isIdCardPrinted ? '#2563eb' : '#d97706', fontWeight: 700 }}>
                          {selectedStudentObj.isIdCardPrinted ? 'ID Card Printed' : 'No ID Card Printed Yet'}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Target Destination Class */}
              <div className="dp-form-row">
                <label className="dp-form-label">
                  <span>3. Destination Target Class *</span>
                  <span className="dp-form-hint">Grade student is entering</span>
                </label>
                <select
                  className="dp-select"
                  value={dpTargetClassId}
                  onChange={(e) => setDpTargetClassId(e.target.value)}
                  required
                >
                  <option value="">-- Select Destination Class --</option>
                  {classes
                    .filter((c) => !selectedStudentObj || c.id !== selectedStudentObj.classId)
                    .map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.level})
                      </option>
                    ))}
                </select>
              </div>

              {/* Step 3: Skipped Grade Recognition */}
              <div className="dp-form-row">
                <label className="dp-form-label">
                  <span>4. Skipped Grade / Curriculum Gap</span>
                  <span className="dp-form-hint">Stored on academic transcript</span>
                </label>
                <input
                  type="text"
                  className="dp-input"
                  placeholder="e.g. Nursery 2, Primary 2, or Accelerated Curriculum"
                  value={dpSkippedClass}
                  onChange={(e) => setDpSkippedClass(e.target.value)}
                />
              </div>

              {/* Step 4: Reg Number Numbering Strategy */}
              <div className="dp-form-row">
                <label className="dp-form-label">
                  <span>5. Reg Number Allocation Strategy</span>
                </label>
                <div className="dp-strategy-toggle">
                  <button
                    type="button"
                    className={`dp-strategy-btn ${dpRegStrategy === 'TailAppend' ? 'active' : ''}`}
                    onClick={() => setDpRegStrategy('TailAppend')}
                  >
                    🛡️ Zero-Waste Tail Sequence (Recommended)
                  </button>
                  <button
                    type="button"
                    className={`dp-strategy-btn ${dpRegStrategy === 'PreserveSuffix' ? 'active' : ''}`}
                    onClick={() => setDpRegStrategy('PreserveSuffix')}
                  >
                    🔢 Preserve Original Suffix (If Unoccupied)
                  </button>
                </div>
              </div>

              {/* Step 5: Assigned Registration Number (Editable) */}
              <div className="dp-form-row">
                <label className="dp-form-label">
                  <span>6. Assigned Registration Number *</span>
                  <span className="dp-form-hint">Editable & Non-Colliding</span>
                </label>
                <input
                  type="text"
                  className="dp-input"
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: 'var(--primary-color, #000080)',
                    letterSpacing: '0.04em',
                    background: '#f8fafc',
                    border: '1.5px solid #94a3b8',
                  }}
                  value={dpAssignedRegNumber}
                  onChange={(e) => setDpAssignedRegNumber(e.target.value.toUpperCase())}
                  placeholder={previewData?.assignedRegNumber || 'e.g. DOTNURSERY2-010 or DOTKINDERGARTEN-010'}
                  required
                />
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  💡 Auto-calculated to match destination class convention ({previewData?.assignedRegNumber || 'Calculated'}). You can customize or edit this if your school uses a specific identifier.
                </span>
              </div>

              {/* Step 6: Official Justification Note */}
              <div className="dp-form-row">
                <label className="dp-form-label">
                  <span>7. Accreditation Justification Note *</span>
                  <span className="dp-form-hint">Principal & Board Endorsement</span>
                </label>
                <textarea
                  className="dp-textarea"
                  value={dpReasonNote}
                  onChange={(e) => setDpReasonNote(e.target.value)}
                  placeholder="Provide detailed justification for transcript audit trail..."
                  required
                />
              </div>

              {/* Step 7: Mandatory Consent Checkbox */}
              <div className="dp-consent-box" onClick={() => setDpConsultationConsent(!dpConsultationConsent)}>
                <input
                  type="checkbox"
                  id="dp-consent-check"
                  checked={dpConsultationConsent}
                  onChange={(e) => setDpConsultationConsent(e.target.checked)}
                />
                <label htmlFor="dp-consent-check" className="dp-consent-label" onClick={(e) => e.stopPropagation()}>
                  I certify that parent consultation has taken place and this academic acceleration is formally authorized by the School Administration. I understand this action updates class rosters, re-enrolls curriculum subjects, and certifies the skipped grade permanently on transcripts.
                </label>
              </div>

              <button
                type="submit"
                className="btn-execute-dp"
                disabled={!dpSelectedStudentId || !dpTargetClassId || !dpConsultationConsent || doublePromoteMutation.isPending}
              >
                <Sparkles size={18} />
                {doublePromoteMutation.isPending ? 'Executing Acceleration...' : 'Execute Double Promotion & Acceleration'}
              </button>
            </form>

            {/* Right Card: Live Non-Colliding Preview & Safety Verification */}
            <div className={`dp-preview-card ${previewData ? 'has-data' : ''}`}>
              <div className="dp-card-header">
                <h3 className="dp-card-title">
                  <Eye size={18} color="#0ea5e9" />
                  Live Non-Colliding Preview
                </h3>
                <span className="dp-step-badge" style={{ background: previewData ? '#e0f2fe' : '#f1f5f9', color: previewData ? '#0284c7' : '#64748b' }}>
                  {previewData ? 'Calculated' : 'Awaiting Input'}
                </span>
              </div>

              {previewLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                  <div className="spinner" style={{ margin: '0 auto 0.75rem' }} />
                  <span>Calculating non-colliding sequence for destination class...</span>
                </div>
              ) : previewData ? (
                <>
                  <div className="dp-reg-display-box">
                    <span className="dp-reg-label">Assigned New Registration Number</span>
                    <span className="dp-reg-number-badge">{dpAssignedRegNumber || previewData.assignedRegNumber}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                      Sequence Slot: #{previewData.assignedSequence} • Destination: {previewData.targetClassName} ({previewData.targetClassStudentCount} existing students)
                    </span>
                  </div>

                  <div className="dp-reassurance-box">
                    <ShieldCheck className="dp-reassurance-icon" size={20} />
                    <div>
                      <strong>Zero-Waste ID Card Engine Active</strong>
                      <span>{previewData.safetyGuarantee}</span>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>TRANSITION SPECIFICATIONS:</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                      <span style={{ color: '#64748b' }}>Origin Grade:</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{previewData.currentClassName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                      <span style={{ color: '#64748b' }}>Skipped Curriculum Gap:</span>
                      <span style={{ fontWeight: 600, color: '#b45309' }}>{dpSkippedClass || previewData.suggestedSkippedClass}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                      <span style={{ color: '#64748b' }}>Destination Class:</span>
                      <span style={{ fontWeight: 700, color: '#059669' }}>{previewData.targetClassName} 🚀</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                      <span style={{ color: '#64748b' }}>ID Card Queue Action:</span>
                      <span style={{ fontWeight: 700, color: '#2563eb' }}>Reset to Unprinted (Ready for Print)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                      <span style={{ color: '#64748b' }}>Transcript Certification:</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>Permanent Override Log Endorsement</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', background: '#f1f5f9', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                    💡 {previewData.strategyNote}
                  </div>
                </>
              ) : (
                <div className="dp-empty-state">
                  <GraduationCap size={40} color="#cbd5e1" style={{ marginBottom: '0.75rem' }} />
                  <p style={{ fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>Live Sequence Calculation Ready</p>
                  <p style={{ fontSize: '0.82rem', margin: 0 }}>
                    Select a student and a destination class on the left to preview the non-colliding registration number and zero-waste safety assurance.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Academic Accelerations & Endorsement History */}
          <div className="dp-history-section">
            <div className="dp-history-header">
              <h3 className="dp-history-title">
                <History size={19} color="var(--primary-color, #000080)" />
                Recent Academic Acceleration Endorsements & Audit Trail
              </h3>
              <span className="dp-step-badge">
                {accelerationHistory.length} Recorded Endorsements
              </span>
            </div>

            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                <div className="spinner" style={{ margin: '0 auto 0.5rem' }} />
                <span>Loading acceleration endorsements...</span>
              </div>
            ) : accelerationHistory.length === 0 ? (
              <div className="dp-empty-state">
                <Award size={36} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontWeight: 600, color: '#64748b', margin: 0 }}>
                  No double promotions or academic accelerations recorded yet.
                </p>
              </div>
            ) : (
              <table className="executive-promo-table">
                <thead>
                  <tr>
                    <th>STUDENT NAME</th>
                    <th>TRANSITION PATHWAY</th>
                    <th>REG NUMBER DETAILS</th>
                    <th>AUTHORIZATION & REASON</th>
                    <th>DATE</th>
                    <th style={{ textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {accelerationHistory.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{item.studentName}</strong>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Current: {item.currentClass}</div>
                      </td>
                      <td>
                        <div className="batch-transition-cell">
                          <span className="batch-class-name">{item.originalDecision.replace('Placement in ', '')}</span>
                          <ChevronRight size={15} className="transition-arrow" />
                          <span className="batch-target-name">{item.newDecision.replace('Academic Acceleration to ', '')}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: '#334155' }}>
                          {item.reasonNote.includes('Assigned Reg:') 
                            ? item.reasonNote.split('Assigned Reg:')[1].split('.')[0].trim() 
                            : 'Updated'}
                        </span>
                      </td>
                      <td>
                        <div style={{ maxWidth: '320px', fontSize: '0.8rem', color: '#475569', lineHeight: 1.35 }}>
                          <div><strong>By:</strong> {item.principalName}</div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.reasonNote}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-revoke-batch"
                          style={{ background: '#f0f9ff', color: '#0284c7', borderColor: '#bae6fd' }}
                          onClick={() => setPrintStudentId(item.studentId)}
                          title="Print Plastic ID Card"
                        >
                          <Printer size={14} /> Print ID Card
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* OVERRIDE MODAL */}
      {showOverrideModal && (
        <div className="promo-modal-backdrop">
          <div className="promo-modal-panel">
            <div className="promo-modal-header">
              <h3 className="promo-modal-title">Override Student Decision</h3>
              <button className="btn-close-modal" onClick={() => setShowOverrideModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="promo-modal-body">
              <div className="promo-form-group">
                <label>Override Decision *</label>
                <div className="promo-input-wrapper">
                  <UserCheck className="field-icon" size={16} />
                  <select
                    className="promo-select-input"
                    value={overrideDecision}
                    onChange={(e) => setOverrideDecision(e.target.value)}
                  >
                    <option value="Promotable">Promotable (Promote to Next Class)</option>
                    <option value="Held Back">Held Back (Repeat Current Class)</option>
                    <option value="Exempt (New Intake)">Exempt (New Intake / Skip Promotion Email)</option>
                    <option value="Graduating">Graduating</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>

              <div className="promo-form-group">
                <label>Audit Reason Note *</label>
                <textarea
                  className="promo-textarea-input"
                  rows={4}
                  placeholder="Provide an explicit reason for overriding this recommendation for audit logging..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  required
                />
              </div>

              <div className="promo-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowOverrideModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save-grading"
                  disabled={overrideMutation.isPending}
                >
                  {overrideMutation.isPending ? 'Saving...' : 'Save Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printStudentId && (
        <IdCardPrintModal
          studentId={printStudentId}
          onClose={() => setPrintStudentId(null)}
        />
      )}
    </div>
  );
}

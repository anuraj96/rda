import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  Plus, Edit2, Trash2, BookOpen, Calendar, Users, Sliders, CheckSquare, XCircle, Search, SlidersHorizontal,
  BookmarkCheck, PlusCircle, AlertCircle, Clock, ArrowLeft
} from 'lucide-react';

export const CoursesAndBatches: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<'courses' | 'batches'>('batches');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Form Controls
  const [isCourseFormOpen, setIsCourseFormOpen] = useState(false);
  const [isBatchFormOpen, setIsBatchFormOpen] = useState(false);
  const [isAttendanceMode, setIsAttendanceMode] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Course Fields
  const [cName, setCName] = useState('');
  const [cDescription, setCDescription] = useState('');
  const [cDuration, setCDuration] = useState(12);
  const [cMonthlyFee, setCMonthlyFee] = useState('');
  const [cRegistrationFee, setCRegistrationFee] = useState('');
  const [cStatus, setCStatus] = useState('ACTIVE');
  const [editingCourse, setEditingCourse] = useState<any>(null);

  // Batch Fields
  const [bName, setBName] = useState('');
  const [bCourseId, setBCourseId] = useState('');
  const [bInstructorId, setBInstructorId] = useState('');
  const [bSchedule, setBSchedule] = useState('');
  const [bCapacity, setBCapacity] = useState(25);
  const [bStartDate, setBStartDate] = useState('');
  const [bEndDate, setBEndDate] = useState('');
  const [bBranchId, setBBranchId] = useState('');
  const [bStatus, setBStatus] = useState('ACTIVE');
  const [editingBatch, setEditingBatch] = useState<any>(null);

  // Attendance Marking Fields
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { status: 'PRESENT' | 'ABSENT' | 'LEAVE' | '', remarks: string }>>({});

  // Enroll Fields
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);
  const [enrollSearch, setEnrollSearch] = useState('');

  // Metadata Lists
  const [instructors, setInstructors] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, bRes] = await Promise.all([
        api.get('/courses'),
        api.get('/batches')
      ]);
      setCourses(cRes.data.data);
      setBatches(bRes.data.data);
    } catch { } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [staffRes, branchesRes] = await Promise.all([
        api.get('/staff'),
        api.get('/branches')
      ]);
      // Instructors filter
      setInstructors(staffRes.data.data.filter((s: any) => s.role?.name === 'INSTRUCTOR'));
      setBranches(branchesRes.data.data);
    } catch { }
  };

  useEffect(() => {
    fetchData();
    fetchMetadata();
  }, []);

  // Sync tab with route path
  useEffect(() => {
    if (location.pathname === '/courses') {
      setActiveWorkspace('courses');
    } else if (location.pathname === '/batches') {
      setActiveWorkspace('batches');
    }
  }, [location.pathname]);

  // Detailed Batch Select
  const selectBatch = async (id: string) => {
    try {
      const res = await api.get(`/batches/${id}`);
      setSelectedBatch(res.data.data);
    } catch { }
  };

  // Course Submit
  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cMonthlyFee || !cRegistrationFee) {
      setFormError('Please fill out all required fields');
      return;
    }
    setFormError(null);

    const payload = {
      name: cName,
      description: cDescription || null,
      duration: Number(cDuration),
      monthlyFee: Number(cMonthlyFee),
      registrationFee: Number(cRegistrationFee),
      status: cStatus
    };

    try {
      if (editingCourse) {
        await api.put(`/courses/${editingCourse.id}`, payload);
      } else {
        await api.post('/courses', payload);
      }
      setIsCourseFormOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Action failed');
    }
  };

  // Batch Submit
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName || !bCourseId || !bInstructorId || !bSchedule || !bBranchId) {
      setFormError('Please fill out all required fields');
      return;
    }
    setFormError(null);

    const payload = {
      name: bName,
      courseId: bCourseId,
      instructorId: bInstructorId,
      schedule: bSchedule,
      capacity: Number(bCapacity),
      startDate: new Date(bStartDate).toISOString(),
      endDate: new Date(bEndDate).toISOString(),
      branchId: bBranchId,
      status: bStatus
    };

    try {
      if (editingBatch) {
        await api.put(`/batches/${editingBatch.id}`, payload);
      } else {
        await api.post('/batches', payload);
      }
      setIsBatchFormOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Action failed');
    }
  };

  // Setup Attendance Marking List
  const enterAttendanceMode = () => {
    setIsAttendanceMode(true);
  };

  // Sync and fetch marked attendance records on mode, batch, or date change
  useEffect(() => {
    if (isAttendanceMode && selectedBatch) {
      const loadAttendanceRecords = async () => {
        const defaultRecs: Record<string, { status: 'PRESENT' | 'ABSENT' | 'LEAVE' | '', remarks: string }> = {};
        try {
          const res = await api.get(`/attendance/student/batch/${selectedBatch.id}`, {
            params: { date: attendanceDate }
          });
          const marked = res.data.data;

          selectedBatch.students.forEach((s: any) => {
            const found = marked.find((m: any) => m.studentId === s.student.id);
            defaultRecs[s.student.id] = {
              status: found ? found.status : '',
              remarks: found ? (found.remarks || '') : ''
            };
          });
          setAttendanceRecords(defaultRecs);
        } catch {
          selectedBatch.students.forEach((s: any) => {
            defaultRecs[s.student.id] = {
              status: '',
              remarks: ''
            };
          });
          setAttendanceRecords(defaultRecs);
        }
      };
      loadAttendanceRecords();
    }
  }, [isAttendanceMode, selectedBatch?.id, attendanceDate]);

  // Bulk marking utilities
  const markAllPresent = () => {
    setAttendanceRecords(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(studentId => {
        next[studentId] = { ...next[studentId], status: 'PRESENT' };
      });
      return next;
    });
  };

  const markAllAbsent = () => {
    setAttendanceRecords(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(studentId => {
        next[studentId] = { ...next[studentId], status: 'ABSENT' };
      });
      return next;
    });
  };

  // Mark Student Attendance
  const submitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    const formattedRecords = Object.keys(attendanceRecords).map((studentId) => ({
      studentId,
      status: attendanceRecords[studentId].status || 'PRESENT',
      remarks: attendanceRecords[studentId].remarks || null
    }));

    try {
      const res = await api.post('/attendance/student', {
        batchId: selectedBatch.id,
        branchId: selectedBatch.branchId,
        date: new Date(attendanceDate).toISOString(),
        records: formattedRecords
      });
      setIsAttendanceMode(false);
      if (res.data.data?.alreadyMarked) {
        showToast('Attendance is already marked for this batch on this date', 'warning');
      } else {
        showToast('Attendance saved successfully', 'success');
      }
    } catch {
      showToast('Failed to mark attendance', 'error');
    }
  };

  // Enroll workspace loader
  const openEnrollDrawer = async () => {
    if (!selectedBatch) return;
    try {
      // Find students in the same branch that are active but not enrolled in this batch
      const res = await api.get('/students');
      const allStudents = res.data.data;
      const enrolledIds = selectedBatch.students.map((s: any) => s.student.id);

      const unassigned = allStudents.filter(
        (s: any) => s.branchId === selectedBatch.branchId && s.status === 'ACTIVE' && !enrolledIds.includes(s.id)
      );

      setUnassignedStudents(unassigned);
      setIsEnrollOpen(true);
    } catch { }
  };

  const handleEnrollStudent = async (studentId: string) => {
    if (!selectedBatch) return;
    try {
      await api.post(`/batches/${selectedBatch.id}/enroll`, {
        studentIds: [studentId]
      });
      setIsEnrollOpen(false);
      selectBatch(selectedBatch.id);
    } catch { }
  };

  const handleUnenrollStudent = async (studentId: string) => {
    if (!selectedBatch) return;
    if (window.confirm('Dropout/Unenroll this student from this batch?')) {
      try {
        await api.post(`/batches/${selectedBatch.id}/unenroll`, {
          studentIds: [studentId]
        });
        selectBatch(selectedBatch.id);
      } catch { }
    }
  };

  const openCourseCreate = () => {
    setEditingCourse(null);
    setCName('');
    setCDescription('');
    setCDuration(12);
    setCMonthlyFee('');
    setCRegistrationFee('');
    setCStatus('ACTIVE');
    setFormError(null);
    setIsCourseFormOpen(true);
  };

  const openCourseEdit = (c: any) => {
    setEditingCourse(c);
    setCName(c.name);
    setCDescription(c.description || '');
    setCDuration(c.duration);
    setCMonthlyFee(Number(c.monthlyFee).toString());
    setCRegistrationFee(Number(c.registrationFee).toString());
    setCStatus(c.status);
    setFormError(null);
    setIsCourseFormOpen(true);
  };

  const openBatchCreate = () => {
    setEditingBatch(null);
    setBName('');
    setBCourseId(courses[0]?.id || '');
    setBInstructorId(instructors[0]?.id || '');
    setBSchedule('');
    setBCapacity(25);
    setBStartDate(new Date().toISOString().split('T')[0]);
    const end = new Date();
    end.setMonth(end.getMonth() + 6);
    setBEndDate(end.toISOString().split('T')[0]);
    setBBranchId(user?.branchId || branches[0]?.id || '');
    setBStatus('ACTIVE');
    setFormError(null);
    setIsBatchFormOpen(true);
  };

  return (
    <div className="space-y-6">

      {/* Detail Workspace View or Grid Dashboard */}
      {selectedBatch ? (
        isAttendanceMode ? (
          /* ========================================================= */
          /* DAILY ATTENDANCE MARKING PAGE                             */
          /* ========================================================= */
          <div className="space-y-6">
            <button
              onClick={() => { setIsAttendanceMode(false); }}
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary border border-border px-3 py-1.5 rounded-xl transition-all mb-4 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Batch Details</span>
            </button>

            {/* Attendance Page Header Info */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary">
                  <CheckSquare className="h-5 w-5" />
                  <h2 className="text-xl font-extrabold text-foreground">Mark Student Attendance</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-bold text-foreground bg-secondary text-primary px-2 py-0.5 rounded">{selectedBatch.name}</span>
                  <span>•</span>
                  <span>Course: {selectedBatch.course?.name}</span>
                  <span>•</span>
                  <span>Teacher: {selectedBatch.instructor?.name}</span>
                  <span>•</span>
                  <span>Schedule: {selectedBatch.schedule}</span>
                </div>
              </div>

              {/* Class Date Input */}
              <div className="flex items-center gap-3 bg-secondary border border-border px-4 py-2 rounded-xl">
                <label className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">Class Date</label>
                <input
                  type="date"
                  value={attendanceDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-card border border-border px-3 py-1.5 rounded-lg outline-none font-bold text-xs"
                />
              </div>
            </div>

            {/* Checklist Table */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
                <div>
                  <h3 className="font-extrabold text-sm text-primary uppercase">Student Attendance Checklist</h3>
                  <p className="text-xs text-muted-foreground">Record daily check-ins. Toggles save temporarily in page state; save to database with "Save Attendance".</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={markAllPresent}
                    className="text-xs bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-500 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    onClick={markAllAbsent}
                    className="text-xs bg-rose-500/10 hover:bg-rose-500/25 text-rose-500 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>

              <div className="border border-border rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-secondary/50 border-b border-border font-bold">
                    <tr>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Admission Number</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Remarks / Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedBatch.students?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">No students enrolled in this batch yet.</td>
                      </tr>
                    ) : (
                      selectedBatch.students.map((s: any) => {
                        const studentId = s.student.id;
                        const record = attendanceRecords[studentId] || { status: 'PRESENT', remarks: '' };
                        return (
                          <tr key={studentId} className="hover:bg-secondary/10">
                            <td className="p-3 font-semibold text-foreground">{s.student.name}</td>
                            <td className="p-3 font-mono text-muted-foreground">{s.student.admissionNumber}</td>
                            <td className="p-3">
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setAttendanceRecords(prev => ({
                                    ...prev,
                                    [studentId]: { ...prev[studentId], status: 'PRESENT' }
                                  }))}
                                  className={`px-3 py-1.5 font-bold rounded-lg transition-all text-xs cursor-pointer ${record.status === 'PRESENT'
                                      ? 'bg-emerald-500 text-white shadow-sm'
                                      : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                                    }`}
                                >
                                  Present
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAttendanceRecords(prev => ({
                                    ...prev,
                                    [studentId]: { ...prev[studentId], status: 'ABSENT' }
                                  }))}
                                  className={`px-3 py-1.5 font-bold rounded-lg transition-all text-xs cursor-pointer ${record.status === 'ABSENT'
                                      ? 'bg-rose-500 text-white shadow-sm'
                                      : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                                    }`}
                                >
                                  Absent
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAttendanceRecords(prev => ({
                                    ...prev,
                                    [studentId]: { ...prev[studentId], status: 'LEAVE' }
                                  }))}
                                  className={`px-3 py-1.5 font-bold rounded-lg transition-all text-xs cursor-pointer ${record.status === 'LEAVE'
                                      ? 'bg-amber-500 text-white shadow-sm'
                                      : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                                    }`}
                                >
                                  Leave
                                </button>
                              </div>
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                placeholder="Add class feedback or attendance notes..."
                                value={record.remarks}
                                onChange={(e) => setAttendanceRecords(prev => ({
                                  ...prev,
                                  [studentId]: { ...prev[studentId], remarks: e.target.value }
                                }))}
                                className="bg-secondary border border-border text-foreground rounded-lg px-3 py-1.5 outline-none w-full max-w-md focus:border-primary transition-colors font-medium text-xs"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Submit Actions */}
              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAttendanceMode(false)}
                  className="bg-secondary border border-border hover:bg-secondary/80 py-2.5 px-6 rounded-xl font-bold transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitAttendance}
                  className="bg-primary text-primary-foreground hover:bg-primary/95 py-2.5 px-6 rounded-xl font-bold shadow-lg transition-colors cursor-pointer text-xs"
                >
                  Save Attendance
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* CLASS BATCH DETAILS & STUDENT ENROLLMENTS                 */
          /* ========================================================= */
          <div className="space-y-6">
            <button
              onClick={() => { setSelectedBatch(null); fetchData(); }}
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary border border-border px-3 py-1.5 rounded-xl transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Timetables</span>
            </button>

            {/* Header Summary */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center gap-5">
                <div className="h-16 w-16 bg-primary text-primary-foreground font-black text-2xl flex items-center justify-center rounded-2xl shadow-lg">
                  B
                </div>
                <div className="text-center md:text-left space-y-1">
                  <h2 className="text-xl font-extrabold">{selectedBatch.name}</h2>
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
                    <span className="text-[10px] bg-secondary text-primary font-bold px-2 py-0.5 rounded tracking-wide">{selectedBatch.course?.name}</span>
                    <span className="text-[10px] text-muted-foreground">• Schedule: {selectedBatch.schedule}</span>
                    <span className="text-[10px] text-muted-foreground">• Teacher: {selectedBatch.instructor?.name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs">
                <button
                  onClick={enterAttendanceMode}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>Daily Attendance Checklist</span>
                </button>
                <button
                  onClick={openEnrollDrawer}
                  className="flex items-center gap-1.5 bg-secondary text-foreground border border-border font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Enroll Student</span>
                </button>
              </div>
            </div>

            {/* Enrolled Pupils Lists */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-primary uppercase">Enrolled Students ({selectedBatch.students?.length} / {selectedBatch.capacity})</h3>
              <div className="border border-border rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-secondary/50 border-b border-border font-bold">
                    <tr>
                      <th className="p-3">Student</th>
                      <th className="p-3">Admission #</th>
                      <th className="p-3">Emergency Contact</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedBatch.students?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">No students enrolled in this batch yet.</td>
                      </tr>
                    ) : (
                      selectedBatch.students.map((s: any) => (
                        <tr key={s.student.id} className="hover:bg-secondary/10">
                          <td className="p-3 font-semibold text-foreground">{s.student.name}</td>
                          <td className="p-3 font-mono font-semibold">{s.student.admissionNumber}</td>
                          <td className="p-3 text-muted-foreground">{s.student.parentPhone}</td>
                          <td className="p-3">
                            <button
                              onClick={() => handleUnenrollStudent(s.student.id)}
                              className="text-rose-500 hover:underline font-semibold cursor-pointer"
                            >
                              Dropout
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : (

        /* ========================================================= */
        /* MASTER COURSE AND BATCH PANELS                            */
        /* ========================================================= */
        <div className="space-y-6">
          {/* Header Workspace Options */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {activeWorkspace === 'courses' ? (
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Dance Courses Catalog</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Manage and organize your dance class syllabus and fee structures.</p>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Timetables & Batches</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Manage student classes, schedules, and instructor assignments.</p>
              </div>
            )}

            {activeWorkspace === 'courses' ? (
              <button
                onClick={openCourseCreate}
                className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-4 py-2 rounded-xl shadow-lg cursor-pointer text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Create Course</span>
              </button>
            ) : (
              <button
                onClick={openBatchCreate}
                className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-4 py-2 rounded-xl shadow-lg cursor-pointer text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Create Class Batch</span>
              </button>
            )}
          </div>

          {/* Workspace Content Display */}
          {activeWorkspace === 'courses' ? (

            /* COURSES CATALOG LIST */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(c => (
                <div key={c.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-base">{c.name}</h4>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${c.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed min-h-12">{c.description || 'No description provided.'}</p>

                    <div className="pt-2 flex justify-between text-xs font-semibold text-foreground">
                      <span>Monthly Fee: ₹{Number(c.monthlyFee).toLocaleString()}</span>
                      <span>Reg Fee: ₹{Number(c.registrationFee).toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block">Duration: {c.duration} Weeks (Course outline)</span>
                  </div>

                  <div className="flex gap-2 mt-5 pt-3 border-t border-border">
                    <button
                      onClick={() => openCourseEdit(c)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-secondary hover:bg-primary/10 hover:text-primary rounded-lg transition-all"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Update</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

          ) : (

            /* BATCHES LIST */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.map(b => (
                <div key={b.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-all flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-base leading-tight">{b.name}</h4>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide mt-1 block">{b.course?.name}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${b.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                        {b.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>Schedule: {b.schedule}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>Enrolled: {b._count?.students || 0} / {b.capacity} Pupils</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>Teacher: {b.instructor?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-5 pt-3 border-t border-border">
                    <button
                      onClick={() => selectBatch(b.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-secondary hover:bg-primary/10 hover:text-primary rounded-lg transition-all"
                    >
                      <BookmarkCheck className="h-4 w-4" />
                      <span>Manage Workspace</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* DIALOG SHEETS AND DRAWER COMPONENT LAYOUTS                */}
      {/* ========================================================= */}

      {/* 1. COURSE FORM DRAWER */}
      {isCourseFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border-l border-border h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-slide-in">
            <div className="space-y-6 text-xs">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h3 className="text-lg font-bold">{editingCourse ? 'Edit Dance Course' : 'Create Dance Syllabus'}</h3>
                <button onClick={() => setIsCourseFormOpen(false)} className="p-1 hover:bg-secondary rounded-lg">
                  <Plus className="h-5 w-5 rotate-45" />
                </button>
              </div>

              {formError && <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-lg">{formError}</div>}

              <form onSubmit={handleCourseSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Course Name *</label>
                  <input
                    type="text"
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="e.g. Hip Hop Beginners"
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Description</label>
                  <textarea
                    rows={3}
                    value={cDescription}
                    onChange={(e) => setCDescription(e.target.value)}
                    placeholder="Syllabus details"
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Monthly Tuition Fee (INR) *</label>
                    <input
                      type="number"
                      value={cMonthlyFee}
                      onChange={(e) => setCMonthlyFee(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Registration Fee (INR) *</label>
                    <input
                      type="number"
                      value={cRegistrationFee}
                      onChange={(e) => setCRegistrationFee(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Course Duration (Weeks)</label>
                    <input
                      type="number"
                      value={cDuration}
                      onChange={(e) => setCDuration(Number(e.target.value))}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Status</label>
                    <select
                      value={cStatus}
                      onChange={(e) => setCStatus(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>

            <div className="pt-6 border-t border-border flex gap-3 mt-8">
              <button onClick={() => setIsCourseFormOpen(false)} className="flex-1 bg-secondary border border-border py-2 px-4 rounded-xl font-bold">Cancel</button>
              <button onClick={handleCourseSubmit} className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-xl font-bold shadow-lg">Save Course</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. BATCH FORM DRAWER */}
      {isBatchFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border-l border-border h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-slide-in">
            <div className="space-y-6 text-xs">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h3 className="text-lg font-bold">{editingBatch ? 'Edit Batch Timings' : 'Setup New Class Batch'}</h3>
                <button onClick={() => setIsBatchFormOpen(false)} className="p-1 hover:bg-secondary rounded-lg">
                  <Plus className="h-5 w-5 rotate-45" />
                </button>
              </div>

              {formError && <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-lg">{formError}</div>}

              <form onSubmit={handleBatchSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Batch Name *</label>
                  <input
                    type="text"
                    value={bName}
                    onChange={(e) => setBName(e.target.value)}
                    placeholder="e.g. Hip Hop Juniors Kochi"
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Course Type *</label>
                    <select
                      value={bCourseId}
                      onChange={(e) => setBCourseId(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    >
                      <option value="">Select Course</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Assign Instructor *</label>
                    <select
                      value={bInstructorId}
                      onChange={(e) => setBInstructorId(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    >
                      <option value="">Select Instructor</option>
                      {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-muted-foreground uppercase">Schedule *</label>
                  <input
                    type="text"
                    value={bSchedule}
                    onChange={(e) => setBSchedule(e.target.value)}
                    placeholder="e.g. Mon, Wed, Fri 5:00 PM - 6:30 PM"
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Max Capacity *</label>
                    <input
                      type="number"
                      value={bCapacity}
                      onChange={(e) => setBCapacity(Number(e.target.value))}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Branch Location *</label>
                    <select
                      value={bBranchId}
                      onChange={(e) => setBBranchId(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none font-semibold text-foreground"
                    >
                      <option value="">Select Location</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">Start Date</label>
                    <input
                      type="date"
                      value={bStartDate}
                      onChange={(e) => setBStartDate(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-muted-foreground uppercase">End Date</label>
                    <input
                      type="date"
                      value={bEndDate}
                      onChange={(e) => setBEndDate(e.target.value)}
                      className="w-full bg-secondary border border-border px-3 py-2 rounded-lg outline-none"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="pt-6 border-t border-border flex gap-3 mt-8">
              <button onClick={() => setIsBatchFormOpen(false)} className="flex-1 bg-secondary border border-border py-2 px-4 rounded-xl font-bold">Cancel</button>
              <button onClick={handleBatchSubmit} className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-xl font-bold shadow-lg">Save Batch</button>
            </div>
          </div>
        </div>
      )}


      {/* 4. ENROLL STUDENT CHECKLIST DRAWER */}
      {isEnrollOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border-l border-border h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-slide-in">
            <div className="space-y-6 text-xs">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h3 className="text-lg font-bold">Enroll Student to Batch</h3>
                <button onClick={() => setIsEnrollOpen(false)} className="p-1 hover:bg-secondary rounded-lg">
                  <Plus className="h-5 w-5 rotate-45" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search branch pupils..."
                  value={enrollSearch}
                  onChange={(e) => setEnrollSearch(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2 outline-none"
                />
              </div>

              <div className="divide-y divide-border max-h-[60vh] overflow-y-auto pr-1">
                {unassignedStudents
                  .filter(s => s.name.toLowerCase().includes(enrollSearch.toLowerCase()) || s.admissionNumber.includes(enrollSearch))
                  .map(s => (
                    <div key={s.id} className="py-3.5 flex justify-between items-center gap-4">
                      <div>
                        <span className="font-bold text-foreground block">{s.name}</span>
                        <span className="text-[10px] text-muted-foreground">{s.admissionNumber}</span>
                      </div>
                      <button
                        onClick={() => handleEnrollStudent(s.id)}
                        className="bg-primary/10 hover:bg-primary/20 text-primary font-bold px-3 py-1 rounded-xl"
                      >
                        Enroll Now
                      </button>
                    </div>
                  ))}
                {unassignedStudents.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">All active branch pupils already enrolled.</div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-border mt-8">
              <button onClick={() => setIsEnrollOpen(false)} className="w-full bg-secondary border border-border py-2 px-4 rounded-xl font-bold">Close Drawer</button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-card border border-border px-4 py-3 rounded-2xl shadow-2xl animate-scale-in text-xs max-w-sm">
          <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-emerald-500 animate-pulse' : toast.type === 'warning' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-pulse'
            }`} />
          <span className="font-bold text-foreground leading-relaxed">{toast.message}</span>
        </div>
      )}

    </div>
  );
};

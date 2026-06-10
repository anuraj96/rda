import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export const BulkImportStudents: React.FC = () => {
  const { user, activeBranchId } = useAuthStore();
  const navigate = useNavigate();

  const [branches, setBranches] = useState<any[]>([]);
  const [targetBranchId, setTargetBranchId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch branches for target dropdown (if Super Admin)
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      api.get('/branches')
        .then(res => {
          const fetchedBranches = res.data.data;
          setBranches(fetchedBranches);

          // Auto select target branch
          if (activeBranchId) {
            setTargetBranchId(activeBranchId);
          } else if (user?.branchId) {
            setTargetBranchId(user.branchId);
          } else if (fetchedBranches.length > 0) {
            setTargetBranchId(fetchedBranches[0].id);
          }
        })
        .catch(() => { });
    } else if (user?.branchId) {
      setTargetBranchId(user.branchId);
    }
  }, [user, activeBranchId]);

  const handleDownloadTemplate = () => {
    const headers = [
      'Admission Number',
      'Full Name',
      'Gender',
      'Date of Birth (YYYY-MM-DD)',
      'Parent/Guardian Name',
      'Parent/Guardian Phone',
      'Email',
      'Address',
      'Emergency Contact',
      'Joining Date (YYYY-MM-DD)'
    ];

    const sampleRows = [
      ['ADM-20001', 'John Doe', 'Male', '2016-04-12', 'Robert Doe', '9876543210', 'john@example.com', '123 Park Street, Trivandrum', '9876543211', '2026-06-01'],
      ['', 'Alice Smith', 'Female', '2018-09-23', 'David Smith', '9123456780', '', '456 Garden Lane, Trivandrum', '', '2026-06-05']
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'students_bulk_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/);
    const result = [];
    if (lines.length < 1) return [];

    const parseLine = (line: string) => {
      const row = [];
      let insideQuote = false;
      let entry = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          row.push(entry.trim());
          entry = '';
        } else {
          entry += char;
        }
      }
      row.push(entry.trim());
      return row;
    };

    const headers = parseLine(lines[0]);

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = parseLine(lines[i]);
      if (values.length < headers.length) continue;

      const obj: any = {};
      obj.admissionNumber = values[0] || '';
      obj.name = values[1] || '';
      obj.gender = values[2] || 'Female';
      obj.dob = values[3] || '';
      obj.parentName = values[4] || '';
      obj.parentPhone = values[5] || '';
      obj.email = values[6] || '';
      obj.address = values[7] || '';
      obj.emergencyContact = values[8] || '';
      obj.joiningDate = values[9] || '';

      result.push(obj);
    }
    return result;
  };

  const validateStudentRow = (student: any) => {
    const errors = [];
    if (!student.name) errors.push('Name is required');
    if (!student.parentName) errors.push('Parent Name is required');
    if (!student.parentPhone) errors.push('Parent Phone is required');
    if (!student.address) errors.push('Address is required');

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (student.dob && !dateRegex.test(student.dob)) {
      errors.push('DOB must be YYYY-MM-DD');
    }
    if (student.joiningDate && !dateRegex.test(student.joiningDate)) {
      errors.push('Joining Date must be YYYY-MM-DD');
    }

    return errors;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setImportError('The uploaded CSV file appears to be empty or misformatted.');
          setStudents([]);
        } else {
          setStudents(parsed);
        }
      } catch (err) {
        setImportError('Failed to parse the CSV file. Please make sure it is a valid comma-separated text file.');
        setStudents([]);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBranchId) {
      setImportError('Please select a target branch.');
      return;
    }
    if (students.length === 0) {
      setImportError('No student records found to import.');
      return;
    }

    const hasErrors = students.some(s => validateStudentRow(s).length > 0);
    if (hasErrors) {
      setImportError('Please resolve all validation errors in the preview list before importing.');
      return;
    }

    try {
      setUploadLoading(true);
      setImportError(null);

      const payload = {
        branchId: targetBranchId,
        students
      };

      const res = await api.post('/students/bulk', payload);
      showToast(res.data.message || 'Students imported successfully!', 'success');
      setTimeout(() => {
        navigate('/students');
      }, 2000);
    } catch (err: any) {
      setImportError(err.response?.data?.message || 'Bulk upload failed. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const hasValidationError = students.some(s => validateStudentRow(s).length > 0);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/students')}
        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary border border-border px-3 py-1.5 rounded-xl transition-all"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Student Directory</span>
      </button>

      {/* Header Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Bulk Student Import Workspace</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Upload, validate, and import multiple student profiles simultaneously.</p>
        </div>
        <button
          onClick={handleDownloadTemplate}
          type="button"
          className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 font-bold px-4 py-2 rounded-xl text-sm transition-all cursor-pointer"
        >
          <FileText className="h-4 w-4" />
          <span>Download CSV Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Control Card */}
        <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6 h-fit">
          <h3 className="font-extrabold text-sm text-primary uppercase">Import Configuration</h3>

          <form onSubmit={handleImportSubmit} className="space-y-5">
            {/* Target Branch Dropdown */}
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] block">Target Import Branch *</label>
              {user?.role === 'SUPER_ADMIN' ? (
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full bg-secondary border border-border px-3.5 py-2.5 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-primary/20 text-xs"
                >
                  <option value="">Select target branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              ) : (
                <div className="w-full bg-secondary border border-border px-3.5 py-2.5 rounded-xl font-bold text-foreground text-xs">
                  {user?.branchName || 'My Branch'}
                </div>
              )}
            </div>

            {/* Drag & Drop File Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] block">Select CSV File *</label>
              <label className="w-full h-32 flex flex-col items-center justify-center border border-dashed border-border hover:border-primary/50 bg-secondary/15 hover:bg-secondary/35 rounded-2xl cursor-pointer transition-all p-4 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-xs font-semibold text-foreground truncate max-w-full px-2">
                  {file ? file.name : 'Choose CSV File...'}
                </span>
                {!file && <span className="text-[10px] text-muted-foreground/80 mt-1">Drag and drop file here</span>}
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {importError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3.5 rounded-xl flex items-start gap-2 font-semibold text-[11px] animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={uploadLoading || students.length === 0 || hasValidationError}
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground py-2.5 px-4 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {uploadLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Importing students...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm & Import ({students.length} Records)</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Validation Checklist / Help */}
          <div className="border-t border-border pt-4 space-y-3">
            <h4 className="font-extrabold text-[10px] text-muted-foreground uppercase">CSV Format Rules</h4>
            <ul className="text-[11px] space-y-2 text-muted-foreground list-disc list-inside leading-relaxed">
              <li>Header row must remain intact.</li>
              <li><strong className="text-foreground">Full Name</strong>, <strong className="text-foreground">Parent Name</strong>, <strong className="text-foreground">Parent Phone</strong>, and <strong className="text-foreground">Address</strong> are strictly required.</li>
              <li>Dates (DOB, Joining Date) must be formatted as <code className="bg-secondary px-1 py-0.5 rounded font-bold font-mono">YYYY-MM-DD</code>.</li>
              <li>Admission numbers will be auto-generated if left blank.</li>
            </ul>
          </div>
        </div>

        {/* Right Data Preview Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <h3 className="font-extrabold text-sm text-primary uppercase">Parsed Records Preview ({students.length})</h3>
              {students.length > 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${hasValidationError ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  {hasValidationError ? 'Validation Warnings Detected' : 'All Rows Valid'}
                </span>
              )}
            </div>

            {students.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="font-semibold text-xs">No records loaded yet.</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-sm">
                  Select or drag-and-drop a completed CSV template file in the left panel to preview your students data here before importing.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="border border-border rounded-xl overflow-hidden text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-secondary/50 border-b border-border font-bold">
                      <tr>
                        <th className="p-3">Admission #</th>
                        <th className="p-3">Full Name</th>
                        <th className="p-3">Gender</th>
                        <th className="p-3">Parent / Phone</th>
                        <th className="p-3">Address</th>
                        <th className="p-3 text-right">Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {students.map((s, idx) => {
                        const rowErrors = validateStudentRow(s);
                        return (
                          <tr key={idx} className={`hover:bg-secondary/5 ${rowErrors.length > 0 ? 'bg-rose-500/5' : ''}`}>
                            <td className="p-3 font-semibold font-mono text-muted-foreground">
                              {s.admissionNumber || <span className="italic text-slate-400">Auto Generate</span>}
                            </td>
                            <td className="p-3 font-bold text-foreground">
                              {s.name || <span className="text-rose-500 italic">Missing name</span>}
                            </td>
                            <td className="p-3 text-muted-foreground">{s.gender}</td>
                            <td className="p-3">
                              <span className="font-semibold block">{s.parentName || <span className="text-rose-500 italic">Missing parent</span>}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{s.parentPhone || <span className="text-rose-500 italic">Missing phone</span>}</span>
                            </td>
                            <td className="p-3 text-muted-foreground truncate max-w-[150px]">
                              {s.address || <span className="text-rose-500 italic">Missing address</span>}
                            </td>
                            <td className="p-3 text-right">
                              {rowErrors.length > 0 ? (
                                <div className="flex flex-col items-end gap-1">
                                  {rowErrors.map((err, eIdx) => (
                                    <span key={eIdx} className="bg-rose-500/10 text-rose-500 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">
                                      {err}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="bg-emerald-500/10 text-emerald-500 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">
                                  Valid
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-card border border-border px-4 py-3 rounded-2xl shadow-2xl animate-scale-in text-xs max-w-sm">
          <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-emerald-500 animate-pulse' : toast.type === 'warning' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-pulse'}`} />
          <span className="font-bold text-foreground leading-relaxed">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldAlert, Terminal, Clock, ShieldCheck, User } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchLogs = async (currentPage: number) => {
    try {
      setLoading(true);
      const res = await api.get('/audit', { params: { page: currentPage, limit: 10 } });
      setLogs(res.data.data);
      if (res.data.meta) {
        setTotalPages(res.data.meta.totalPages || 1);
        setTotalItems(res.data.meta.total || 0);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Security & Audit Logs</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Real-time trail of administrative actions, data edits, and logins.</p>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-card border border-border p-12 rounded-2xl text-center text-muted-foreground">
          No audit history logged.
        </div>
      ) : (
        <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-secondary/50 border-b border-border font-bold">
                <tr>
                  <th className="p-4">Action</th>
                  <th className="p-4">Actor (Employee)</th>
                  <th className="p-4">Entity Context</th>
                  <th className="p-4">JSON Details</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => {
                  let parsedDetails = '-';
                  try {
                    if (log.details) {
                      const detailsObj = JSON.parse(log.details);
                      parsedDetails = Object.keys(detailsObj)
                        .map(key => `${key}: ${detailsObj[key]}`)
                        .join(', ');
                    }
                  } catch {}

                  return (
                    <tr key={log.id} className="hover:bg-secondary/15">
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider ${
                          log.action === 'LOGIN'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : log.action.startsWith('CREATE')
                            ? 'bg-blue-500/10 text-blue-500'
                            : log.action.startsWith('DELETE')
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-secondary text-foreground'
                        }`}>
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{log.user?.name}</span>
                          <span className="text-[9px] text-muted-foreground">({log.user?.employeeId})</span>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-foreground">
                        {log.entityName} {log.branch?.name && `(${log.branch.name.replace('Dance School ', '')})`}
                      </td>
                      <td className="p-4 text-muted-foreground truncate max-w-xs">{parsedDetails}</td>
                      <td className="p-4 text-muted-foreground font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination controls */}
      {!loading && logs.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 text-xs font-semibold">
          <span className="text-muted-foreground">
            Showing logs {((page - 1) * 10) + 1} - {Math.min(page * 10, totalItems)} of {totalItems} total logs
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="bg-card hover:bg-secondary/40 border border-border px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Previous
            </button>
            <span className="flex items-center px-2 text-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="bg-card hover:bg-secondary/40 border border-border px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

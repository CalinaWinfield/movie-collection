import React, { useState, useEffect } from 'react';
import { X, Handshake, RotateCcw, Calendar, Check, User, Clock, Film, Tv, Gamepad2 } from 'lucide-react';
import { client } from '../api/client';

export function LentModal({ isOpen, onClose, onRefresh }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await client.get('/loans');
      setLoans(res.loans || []);
    } catch (err) {
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleReturn = async (loanId) => {
    try {
      await client.put(`/loans/${loanId}/return`, {});
      fetchLoans();
      onRefresh();
    } catch (err) {
      alert('Error updating loan: ' + err.message);
    }
  };

  const activeLoans = loans.filter(l => l.is_returned === 0);
  const returnedLoans = loans.filter(l => l.is_returned === 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-2xl bg-surface rounded-3xl border border-surface-border shadow-2xl overflow-hidden my-auto max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-surface-elevated border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 font-display">Lent Out Tracker</h2>
              <p className="text-xs text-slate-400">Never lose track of movies, discs, or games borrowed by friends</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-surface rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-surface-border px-6 bg-surface">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-3 text-xs font-semibold border-b-2 mr-6 transition-all ${
              activeTab === 'active'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Currently on Loan ({activeLoans.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Loan History ({returnedLoans.length})
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'active' ? (
            activeLoans.length > 0 ? (
              <div className="space-y-3">
                {activeLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-4 rounded-2xl bg-surface-elevated border border-surface-border hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      {loan.item_poster ? (
                        <img src={loan.item_poster} alt={loan.item_title} className="w-12 h-16 object-cover rounded-lg shrink-0 border border-surface-border" />
                      ) : (
                        <div className="w-12 h-16 rounded-lg bg-slate-900 border border-surface-border flex items-center justify-center shrink-0">
                          <Film className="w-5 h-5 text-slate-600" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-100">{loan.item_title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <User className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Lent to <strong className="text-white">{loan.borrower_name}</strong></span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                          <span>Lent: {loan.loan_date}</span>
                          {loan.due_date && <span>• Expected return: <strong className="text-amber-400">{loan.due_date}</strong></span>}
                          {loan.borrower_contact && <span>• {loan.borrower_contact}</span>}
                        </div>
                        {loan.notes && (
                          <p className="text-[11px] text-slate-400 italic">"{loan.notes}"</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleReturn(loan.id)}
                      className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all self-end sm:self-center"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Mark Returned</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Check className="w-12 h-12 text-emerald-500/60 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-300">All items are safely on your shelves</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  When you loan a 4K disc, Steelbook, or cartridge to a friend, click "Lend This Title" in the title details to track it here.
                </p>
              </div>
            )
          ) : (
            returnedLoans.length > 0 ? (
              <div className="space-y-2.5">
                {returnedLoans.map((loan) => (
                  <div key={loan.id} className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border text-xs flex items-center justify-between text-slate-400">
                    <div>
                      <span className="font-bold text-slate-200 text-sm block">{loan.item_title}</span>
                      <span>Borrowed by <strong className="text-slate-300">{loan.borrower_name}</strong> on {loan.loan_date}</span>
                    </div>
                    <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-medium text-[11px]">
                      Returned {loan.returned_date || ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">No past loan records.</p>
            )
          )}
        </div>
      </div>
    </div>
  );
}

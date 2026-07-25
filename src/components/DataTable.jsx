import React from 'react';
import { Eye, Pencil, Trash2, Printer, Download, Car } from 'lucide-react';

export default function DataTable({ 
  data, 
  onView, 
  onEdit, 
  onDelete, 
  onViewInvoice, 
  onDownloadInvoice, 
  onPrintInvoice 
}) {
  return (
    <div>
      {/* ── DESKTOP TABLE (md+) ─────────────────────────────────────────── */}
      <div
        className="hidden md:block overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/20"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-950/40 text-slate-400 font-semibold border-b border-slate-800">
              <th className="py-4 px-4 text-center w-16">Photo</th>
              <th className="py-4 px-4">Invoice No</th>
              <th className="py-4 px-4">Vehicle Number</th>
              <th className="py-4 px-4">Model</th>
              <th className="py-4 px-4">Customer</th>
              <th className="py-4 px-4 text-center">Status</th>
              <th className="py-4 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data.length > 0 ? (
              data.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-800/20 transition-all duration-150">
                  {/* Photo */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center">
                      {bill.vehiclePhoto ? (
                        <img src={bill.vehiclePhoto} alt="Vehicle" className="w-10 h-10 object-cover rounded-lg border border-slate-700/80" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                          <Car size={18} />
                        </div>
                      )}
                    </div>
                  </td>
                  {/* Invoice ID */}
                  <td className="py-3 px-4 font-mono text-xs text-indigo-400 font-semibold">{bill.invoiceNumber}</td>
                  {/* Plate */}
                  <td className="py-3 px-4">
                    <span className="inline-block px-2.5 py-1 bg-slate-950 text-slate-200 border border-slate-700 rounded text-xs font-mono font-bold tracking-wider uppercase">
                      {bill.vehicleNumber || 'N/A'}
                    </span>
                  </td>
                  {/* Model */}
                  <td className="py-3 px-4 font-medium text-slate-200">{bill.vehicleModel || 'N/A'}</td>
                  {/* Customer */}
                  <td className="py-3 px-4 text-slate-300 font-medium">{bill.customerName}</td>
                  {/* Status */}
                  <td className="py-3 px-4 text-center">
                    {Number(bill.pendingAmount || 0) <= 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Paid</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>
                    )}
                  </td>
                  {/* Actions */}
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => onView(bill)} className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 active:scale-95 touch-manipulation" title="View Details"><Eye size={15} /></button>
                      <button onClick={() => onEdit(bill)} className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors border border-transparent hover:border-indigo-500/20 active:scale-95 touch-manipulation" title="Edit Bill"><Pencil size={15} /></button>
                      <button onClick={() => onDelete(bill.id)} className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20 active:scale-95 touch-manipulation" title="Delete Bill"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-500 font-medium">No billing records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARD LAYOUT (< md) ────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {data.length > 0 ? (
          data.map((bill) => (
            <div key={bill.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              {/* Card Header: Photo + Invoice No + Status */}
              <div className="flex items-center gap-3 p-4 border-b border-slate-800/60">
                {bill.vehiclePhoto ? (
                  <img src={bill.vehiclePhoto} alt="Vehicle" className="w-14 h-14 object-cover rounded-xl border border-slate-700/80 shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                    <Car size={24} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-indigo-400 font-semibold truncate">{bill.invoiceNumber}</p>
                  <p className="font-bold text-slate-200 truncate mt-0.5">{bill.customerName}</p>
                  <p className="text-xs text-slate-500 truncate">{bill.date}</p>
                </div>
                {Number(bill.pendingAmount || 0) <= 0 ? (
                  <span className="shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Paid</span>
                ) : (
                  <span className="shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>
                )}
              </div>

              {/* Card Body: Plate + Model */}
              <div className="px-4 py-3 flex items-center gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Plate</p>
                  <span className="inline-block px-2 py-0.5 bg-slate-950 text-slate-200 border border-slate-700 rounded text-xs font-mono font-bold tracking-wider uppercase">
                    {bill.vehicleNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Model</p>
                  <p className="text-sm font-medium text-slate-300">{bill.vehicleModel || 'N/A'}</p>
                </div>
              </div>

              {/* Card Footer: Action Buttons */}
              <div className="border-t border-slate-800/60 grid grid-cols-3 divide-x divide-slate-800/60">
                <button
                  onClick={() => onView(bill)}
                  className="flex items-center justify-center gap-1.5 min-h-[48px] text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors text-xs font-medium active:scale-95 touch-manipulation"
                >
                  <Eye size={15} />
                  View
                </button>
                <button
                  onClick={() => onEdit(bill)}
                  className="flex items-center justify-center gap-1.5 min-h-[48px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors text-xs font-medium active:scale-95 touch-manipulation"
                >
                  <Pencil size={15} />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(bill.id)}
                  className="flex items-center justify-center gap-1.5 min-h-[48px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-xs font-medium active:scale-95 touch-manipulation"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-slate-500 font-medium">No billing records found.</div>
        )}
      </div>
    </div>
  );
}

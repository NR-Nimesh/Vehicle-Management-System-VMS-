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
    <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/20">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-slate-950/40 text-slate-400 font-semibold border-b border-slate-800">
            <th className="py-4 px-4 text-center w-16">Photo</th>
            <th className="py-4 px-4">Invoice No</th>
            <th className="py-4 px-4">Vehicle Number</th>
            <th className="py-4 px-4">Model</th>
            <th className="py-4 px-4">Customer</th>
            <th className="py-4 px-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {data.length > 0 ? (
            data.map((bill) => (
              <tr key={bill.id} className="hover:bg-slate-800/20 transition-all duration-150">
                {/* Photo Column */}
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center">
                    {bill.vehiclePhoto ? (
                      <img 
                        src={bill.vehiclePhoto} 
                        alt="Vehicle" 
                        className="w-10 h-10 object-cover rounded-lg border border-slate-700/80" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                        <Car size={18} />
                      </div>
                    )}
                  </div>
                </td>

                {/* Invoice ID */}
                <td className="py-3 px-4 font-mono text-xs text-indigo-400 font-semibold">
                  {bill.invoiceNumber}
                </td>

                {/* Vehicle Plate Number */}
                <td className="py-3 px-4">
                  <span className="inline-block px-2.5 py-1 bg-slate-950 text-slate-200 border border-slate-700 rounded text-xs font-mono font-bold tracking-wider uppercase">
                    {bill.vehicleNumber || 'N/A'}
                  </span>
                </td>

                {/* Vehicle Model */}
                <td className="py-3 px-4 font-medium text-slate-200">
                  {bill.vehicleModel || 'N/A'}
                </td>

                {/* Customer Name */}
                <td className="py-3 px-4 text-slate-300 font-medium">
                  {bill.customerName}
                </td>

                {/* Actions Row */}
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onView(bill)}
                      className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
                      title="View Details"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="py-12 text-center text-slate-500 font-medium">
                No billing records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

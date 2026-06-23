import React, { forwardRef } from 'react';
import { Car, Fuel } from 'lucide-react';

const InvoicePreview = forwardRef(({ bill, businessProfile = null }, ref) => {
  if (!bill) return null;

  return (
    <div 
      ref={ref} 
      className="bg-white text-slate-900 p-8 sm:p-12 max-w-[210mm] min-h-[297mm] mx-auto shadow-2xl rounded-2xl border border-slate-200/50 print:border-none print:shadow-none print:p-0 print:rounded-none font-sans"
    >
      {/* Invoice Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-6 pb-8 border-b border-slate-200">
        <div className="flex items-start gap-4">
          {(businessProfile?.logo || bill.businessLogo) ? (
            <img 
              src={businessProfile?.logo || bill.businessLogo} 
              alt="Logo" 
              className="w-16 h-16 object-contain border border-slate-200 p-1 rounded-xl bg-slate-50" 
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Car size={32} />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {businessProfile?.name || bill.businessName || 'AutoDrive Services'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {businessProfile?.address || bill.businessAddress || 'N/A'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Phone: {businessProfile?.phone || bill.businessPhone || 'N/A'} | Email: {businessProfile?.email || bill.businessEmail || 'N/A'}
            </p>
            {(businessProfile?.taxNumber || bill.businessTaxNumber) && (
              <p className="text-xs text-slate-400 mt-0.5">Tax/VAT ID: {businessProfile?.taxNumber || bill.businessTaxNumber}</p>
            )}
          </div>
        </div>

        <div className="text-left sm:text-right flex flex-col justify-end">
          <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">INVOICE RECEIPT</span>
          <h1 className="text-xl font-mono font-bold text-slate-800 mt-1">{bill.invoiceNumber}</h1>
          <p className="text-xs text-slate-500 mt-0.5">Date: {bill.date ? (typeof bill.date === 'string' ? bill.date.split('T')[0] : bill.date) : ''}</p>
        </div>
      </div>

      {/* Addresses and Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-slate-200">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">BILLED TO</h3>
          <h4 className="text-sm font-bold text-slate-800">{bill.customerName}</h4>
          <p className="text-xs text-slate-500 mt-1.5">Email: {bill.customerEmail || 'N/A'}</p>
          <p className="text-xs text-slate-500 mt-0.5">Phone: {bill.customerPhone || 'N/A'}</p>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">VEHICLE DETAILS</h3>
          <div className="flex gap-4">
            <div>
              <p className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                {bill.vehicleNumber}
              </p>
              <h4 className="text-sm font-bold text-slate-800 mt-1">{bill.vehicleModel}</h4>
              {bill.vehicleDescription && (
                <p className="text-xs text-slate-500 mt-1 max-w-[200px] truncate" title={bill.vehicleDescription}>
                  {bill.vehicleDescription}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Service Details Table */}
      <div className="py-8">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-300 text-slate-400 font-bold uppercase">
              <th className="py-3 px-2 w-3/4">Service Type</th>
              <th className="py-3 px-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.services && Array.isArray(bill.services) && bill.services.length > 0 ? (
              bill.services.map((service, index) => (
                <tr key={index} className="border-b border-slate-100 text-slate-700">
                  <td className="py-4 px-2 font-medium text-slate-800">
                    {service.type || 'General Maintenance Service'}
                  </td>
                  <td className="py-4 px-2 text-right">Rs. {Number(service.amount || 0).toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr className="border-b border-slate-100 text-slate-700">
                <td className="py-4 px-2 font-medium text-slate-800">
                  {bill.serviceType || 'General Maintenance Service'}
                </td>
                <td className="py-4 px-2 text-right">Rs. {Number(bill.amount || 0).toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Breakdown Calculations */}
      <div className="flex justify-end pt-4">
        <div className="w-full sm:w-80 space-y-2 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal:</span>
            <span>Rs. {Number(bill.amount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Tax (added):</span>
            <span className="text-rose-600">+Rs. {Number(bill.tax || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Discount (deducted):</span>
            <span className="text-emerald-600">-Rs. {Number(bill.discount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-sm font-bold text-slate-900">
            <span>Total:</span>
            <span className="text-indigo-600 text-base font-extrabold">Rs. {Number(bill.total || 0).toFixed(2)}</span>
          </div>
          
          <div className="pt-2 mt-2 border-t border-slate-100 border-dashed space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Paid Amount:</span>
              <span className="text-indigo-600 font-semibold">Rs. {Number(bill.paidAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-slate-700">Pending Amount:</span>
              <span className={Number(bill.pendingAmount || 0) > 0 ? 'text-amber-500' : 'text-emerald-500'}>
                Rs. {Number(bill.pendingAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Footer */}
      <div className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
        <p className="font-semibold text-slate-600 mb-1">Thank you for your business!</p>
        <p>If you have any questions about this invoice, please contact {bill.businessEmail || 'us'}.</p>
      </div>
    </div>
  );
});

InvoicePreview.displayName = 'InvoicePreview';

export default InvoicePreview;

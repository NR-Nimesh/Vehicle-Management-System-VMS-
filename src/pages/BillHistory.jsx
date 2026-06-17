import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBilling } from '../context/BillingContext';
import { generateInvoicePDF } from '../utils/generateInvoice';
import { useReactToPrint } from 'react-to-print';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import InvoicePreview from '../components/InvoicePreview';
import { 
  X, Printer, Download, Car, Info, Calendar, User, 
  CreditCard, Briefcase, Mail, Phone, ArrowUpDown, ChevronDown 
} from 'lucide-react';

export default function BillHistory() {
  const navigate = useNavigate();
  const { bills, deleteBill, setCurrentEditBill } = useBilling();
  
  // States
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'
  const [selectedDetailBill, setSelectedDetailBill] = useState(null);
  const [selectedPreviewBill, setSelectedPreviewBill] = useState(null);

  // Print Ref for Modal Preview
  const printModalRef = useRef(null);
  const handleModalPrint = useReactToPrint({
    content: () => printModalRef.current,
  });

  // 1. Search Filter
  const filteredBills = bills.filter(bill => {
    const query = search.toLowerCase();
    return (
      bill.invoiceNumber?.toLowerCase().includes(query) ||
      bill.vehicleNumber?.toLowerCase().includes(query) ||
      bill.vehicleModel?.toLowerCase().includes(query) ||
      bill.customerName?.toLowerCase().includes(query)
    );
  });

  // 2. Sorting (Newest to Oldest by default)
  const sortedBills = [...filteredBills].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (sortOrder === 'newest') {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  });

  // Handlers
  const handleViewDetails = (bill) => {
    setSelectedDetailBill(bill);
  };

  const handleViewInvoice = (bill) => {
    setSelectedPreviewBill(bill);
  };

  const handleEditBill = (bill) => {
    setCurrentEditBill(bill);
    navigate('/billing');
  };

  const handleDeleteBill = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this billing record?')) {
      deleteBill(id);
    }
  };

  const handleDownloadInvoice = (bill) => {
    generateInvoicePDF(bill);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
          Bill History
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Review, filter, download, or edit past vehicle invoices and billing transactions.
        </p>
      </div>

      {/* Filter and Actions Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <div className="flex-1 w-full">
          <SearchBar 
            value={search} 
            onChange={setSearch} 
            placeholder="Search by Invoice No, Customer Name, Vehicle Number, or Model..." 
          />
        </div>
        <div className="flex shrink-0 w-full md:w-auto items-center gap-3">
          <button
            onClick={toggleSortOrder}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-slate-700 hover:border-slate-600 rounded-xl text-sm font-semibold transition-all hover:bg-slate-800/40 text-slate-300"
          >
            <ArrowUpDown size={16} className="text-indigo-400" />
            Sort by: {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-panel p-6">
        <DataTable 
          data={sortedBills}
          onView={handleViewDetails}
          onEdit={handleEditBill}
          onDelete={handleDeleteBill}
          onViewInvoice={handleViewInvoice}
          onDownloadInvoice={handleDownloadInvoice}
          onPrintInvoice={handleDownloadInvoice} // Re-routing pdf/print appropriately
        />
        <div className="flex justify-between items-center mt-4 text-xs text-slate-500 font-semibold px-2">
          <span>Found {sortedBills.length} records</span>
          <span>Transactions stored directly in vms_db</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedDetailBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-3xl overflow-hidden shadow-2xl animate-scaleIn border-slate-700 bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2 text-indigo-400">
                <Info size={18} />
                <h3 className="text-lg font-bold text-slate-200">Billing Information</h3>
              </div>
              <button 
                onClick={() => setSelectedDetailBill(null)}
                className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Column 1: Client and Business */}
                <div className="space-y-4">
                  {/* Client Details */}
                  <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/10">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                      <User size={13} /> Client Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-slate-400">Name: <span className="text-slate-200 font-semibold">{selectedDetailBill.customerName}</span></p>
                      <p className="text-slate-400">Email: <span className="text-slate-200">{selectedDetailBill.customerEmail || 'N/A'}</span></p>
                      <p className="text-slate-400">Phone: <span className="text-slate-200">{selectedDetailBill.customerPhone || 'N/A'}</span></p>
                    </div>
                  </div>
                </div>

                {/* Column 2: Vehicle */}
                <div className="space-y-4">
                  <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/10 h-full flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                        <Car size={13} /> Vehicle Details
                      </h4>
                      
                      {selectedDetailBill.vehiclePhoto && (
                        <div className="w-full h-32 rounded-lg border border-slate-800 overflow-hidden mb-3 bg-slate-950">
                          <img src={selectedDetailBill.vehiclePhoto} alt="Vehicle Uploaded" className="w-full h-full object-cover" />
                        </div>
                      )}
                      
                      <div className="space-y-2 text-sm">
                        <p className="text-slate-400">Plate Number: <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 font-mono text-xs font-bold text-slate-200 rounded">{selectedDetailBill.vehicleNumber}</span></p>
                        <p className="text-slate-400">Model: <span className="text-slate-200 font-semibold">{selectedDetailBill.vehicleModel}</span></p>
                        {selectedDetailBill.vehicleDescription && (
                          <p className="text-slate-500 text-xs mt-2 italic bg-slate-900/50 p-2 rounded border border-slate-800/40">
                            Description: {selectedDetailBill.vehicleDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Embedded Invoice Receipt */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 p-4">
                <InvoicePreview bill={selectedDetailBill} />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/20">
              <button
                onClick={() => setSelectedDetailBill(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl hover:bg-slate-800/50 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INVOICE PREVIEW MODAL */}
      {/* ========================================================================= */}
      {selectedPreviewBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header (Floating Controls) */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-indigo-400 font-mono">{selectedPreviewBill.invoiceNumber}</span>
                <span className="text-xs text-slate-500">| Preview Document</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleModalPrint}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500/30 text-indigo-400 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all"
                  title="Print Invoice"
                >
                  <Printer size={13} />
                  Print
                </button>

                <button
                  onClick={() => handleDownloadInvoice(selectedPreviewBill)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-all"
                  title="Download PDF"
                >
                  <Download size={13} />
                  Download PDF
                </button>

                <button
                  onClick={() => setSelectedPreviewBill(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 ml-2"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Invoice Container Scroll */}
            <div className="p-6 sm:p-10 overflow-y-auto bg-slate-950 flex-1">
              <InvoicePreview 
                ref={printModalRef} 
                bill={selectedPreviewBill} 
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

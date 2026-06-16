import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBilling } from '../context/BillingContext';
import { useReactToPrint } from 'react-to-print';
import { generateInvoicePDF } from '../utils/generateInvoice';
import { compressImage } from '../utils/imageCompressor';
import InvoicePreview from '../components/InvoicePreview';
import { 
  Calendar, Hash, User, Car, FileText, Phone, Mail, 
  Building2, DollarSign, Percent, Tag, Save, Download, 
  Printer, ArrowLeft, Upload, CheckCircle2, AlertCircle 
} from 'lucide-react';

export default function Billing() {
  const navigate = useNavigate();
  const { 
    businessProfile, 
    currentEditBill, 
    setCurrentEditBill,
    addBill, 
    updateBill, 
    getNextInvoiceNumber, 
    incrementInvoiceCounter 
  } = useBilling();

  // Reference for printable invoice
  const componentRef = useRef(null);

  // Form states
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  
  // Vehicle states
  const [vehiclePhoto, setVehiclePhoto] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleDescription, setVehicleDescription] = useState('');

  // Customer states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Business states
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');

  // Service states
  const [serviceType, setServiceType] = useState('General Maintenance');
  const [amount, setAmount] = useState('');
  const [tax, setTax] = useState('');
  const [discount, setDiscount] = useState('');

  // Notification states
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Load Initial Invoice Number & Business Info
  useEffect(() => {
    if (currentEditBill) {
      // Load details for editing
      setDate(currentEditBill.date);
      setInvoiceNumber(currentEditBill.invoiceNumber);
      setVehiclePhoto(currentEditBill.vehiclePhoto || '');
      setVehicleNumber(currentEditBill.vehicleNumber || '');
      setVehicleModel(currentEditBill.vehicleModel || '');
      setVehicleDescription(currentEditBill.vehicleDescription || '');
      setCustomerName(currentEditBill.customerName || '');
      setCustomerEmail(currentEditBill.customerEmail || '');
      setCustomerPhone(currentEditBill.customerPhone || '');
      setBusinessName(currentEditBill.businessName || '');
      setBusinessPhone(currentEditBill.businessPhone || '');
      setBusinessEmail(currentEditBill.businessEmail || '');
      setServiceType(currentEditBill.serviceType || '');
      setAmount(currentEditBill.amount || '');
      setTax(currentEditBill.tax || '');
      setDiscount(currentEditBill.discount || '');
    } else {
      // Setup default new invoice values
      setInvoiceNumber(getNextInvoiceNumber());
      if (businessProfile) {
        setBusinessName(businessProfile.name || '');
        setBusinessPhone(businessProfile.phone || '');
        setBusinessEmail(businessProfile.email || '');
      }
    }
  }, [currentEditBill, businessProfile]);

  // Handle Photo Upload & compression
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const compressed = await compressImage(event.target.result, 400, 300);
        setVehiclePhoto(compressed);
      } catch (err) {
        console.error('Vehicle image compression failed', err);
        setVehiclePhoto(event.target.result); // Fallback to uncompressed
      }
    };
    reader.readAsDataURL(file);
  };

  // Auto Calculations
  const calculatedTotal = (
    (parseFloat(amount) || 0) + 
    (parseFloat(tax) || 0) - 
    (parseFloat(discount) || 0)
  );

  // Compile current state into a single bill object
  const getCurrentBillData = () => {
    return {
      date,
      invoiceNumber,
      vehiclePhoto,
      vehicleNumber: vehicleNumber.toUpperCase(),
      vehicleModel,
      vehicleDescription,
      customerName,
      customerEmail,
      customerPhone,
      businessName,
      businessPhone,
      businessEmail,
      businessLogo: businessProfile?.logo || '',
      businessAddress: businessProfile?.address || '',
      businessTaxNumber: businessProfile?.taxNumber || '',
      serviceType,
      amount: parseFloat(amount) || 0,
      tax: parseFloat(tax) || 0,
      discount: parseFloat(discount) || 0,
      total: calculatedTotal
    };
  };

  // Save Details Action
  const handleSaveDetails = () => {
    if (!customerName || !vehicleNumber || !vehicleModel) {
      setNotification({
        type: 'error',
        message: 'Please complete all required fields (*): Customer Name, Vehicle Number, and Vehicle Model.'
      });
      return;
    }

    const billData = getCurrentBillData();

    if (currentEditBill) {
      updateBill({ ...billData, id: currentEditBill.id });
      showNotification('success', 'Changes updated successfully in Bill History!');
    } else {
      addBill(billData);
      showNotification('success', 'Details saved as a draft record in Bill History!');
    }
  };

  // Save Bill Action (Official Save & Increment Invoice Counter)
  const handleSaveBill = () => {
    if (!customerName || !vehicleNumber || !vehicleModel) {
      setNotification({
        type: 'error',
        message: 'Please complete all required fields (*): Customer Name, Vehicle Number, and Vehicle Model.'
      });
      return;
    }

    const billData = getCurrentBillData();

    if (currentEditBill) {
      updateBill({ ...billData, id: currentEditBill.id });
      showNotification('success', 'Bill updated and finalized!');
    } else {
      addBill(billData);
      incrementInvoiceCounter(); // Increment sequence counter for next invoice
      showNotification('success', 'Invoice saved and generated!');
      // Reset invoice number to new auto increment
      setTimeout(() => {
        setInvoiceNumber(getNextInvoiceNumber());
        clearNewBillFields();
      }, 1000);
    }
  };

  const clearNewBillFields = () => {
    setVehiclePhoto('');
    setVehicleNumber('');
    setVehicleModel('');
    setVehicleDescription('');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setAmount('');
    setTax('');
    setDiscount('');
  };

  // Helper for notifications
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 4000);
  };

  // PDF Download Trigger
  const generatePDF = () => {
    const billData = getCurrentBillData();
    generateInvoicePDF(billData);
  };

  // react-to-print print trigger
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const handleBackToHistory = () => {
    setCurrentEditBill(null);
    navigate('/history');
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            {currentEditBill ? 'Edit Invoice Workspace' : 'Invoice Workspace'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {currentEditBill ? `Modify invoice details for ${currentEditBill.invoiceNumber}` : 'Create, preview, print, and export vehicle service invoices.'}
          </p>
        </div>
        {currentEditBill && (
          <button
            onClick={handleBackToHistory}
            className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-700/80 hover:border-slate-600 rounded-xl text-sm font-semibold transition-all hover:bg-slate-800/40 text-slate-300"
          >
            <ArrowLeft size={16} />
            Back to History
          </button>
        )}
      </div>

      {/* Grid Layout - Forms on Left (2 cols), Live Preview on Right (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form Column (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {notification.message && (
            <div className={`p-4 rounded-xl flex items-start gap-2.5 border animate-fadeIn ${
              notification.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {notification.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5" /> : <AlertCircle size={18} className="mt-0.5" />}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          )}

          {/* 1. Invoice Metadata Section */}
          <div className="glass-panel p-6">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Hash size={18} className="text-indigo-400" />
              Invoice Configuration
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Date</label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="glass-input pl-10 w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Invoice Number</label>
                <div className="relative">
                  <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-0000"
                    className="glass-input pl-10 w-full font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Customer Information Section */}
          <div className="glass-panel p-6">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <User size={18} className="text-indigo-400" />
              Customer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col sm:col-span-2">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="glass-input w-full"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="johndoe@example.com"
                    className="glass-input pl-10 w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="glass-input pl-10 w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Vehicle Information Section */}
          <div className="glass-panel p-6">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Car size={18} className="text-indigo-400" />
              Vehicle Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Vehicle Number (Plate) *</label>
                <input
                  type="text"
                  required
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g. CA-876-90"
                  className="glass-input w-full font-mono uppercase tracking-wider font-bold"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Vehicle Model *</label>
                <input
                  type="text"
                  required
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="e.g. Tesla Model 3 (2022)"
                  className="glass-input w-full"
                />
              </div>

              {/* Photo Upload */}
              <div className="flex flex-col sm:col-span-2">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Vehicle Photo</label>
                <div className="flex items-center gap-4 border border-slate-700/60 rounded-lg p-3 bg-slate-950/30">
                  <div className="relative w-16 h-12 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                    {vehiclePhoto ? (
                      <img src={vehiclePhoto} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <Car size={20} className="text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label htmlFor="vehicle-photo" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-medium cursor-pointer transition-colors shadow">
                      <Upload size={13} />
                      Upload Photo
                    </label>
                    <input
                      type="file"
                      id="vehicle-photo"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Accepts PNG, JPEG. Automatically resizes.</p>
                  </div>
                  {vehiclePhoto && (
                    <button
                      type="button"
                      onClick={() => setVehiclePhoto('')}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:col-span-2">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Vehicle Description / Remarks</label>
                <textarea
                  value={vehicleDescription}
                  onChange={(e) => setVehicleDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. Scratches on left fender. Engine oil level low."
                  className="glass-input resize-none"
                />
              </div>
            </div>
          </div>

          {/* 4. Business Default Values Override */}
          <div className="glass-panel p-6">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-indigo-400" />
              Business Profile Defaults (Editable)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Phone</label>
                <input
                  type="text"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
                <input
                  type="text"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              * Note: Address, Logo, and Tax Number are automatically pulled from your Business Profile settings.
            </p>
          </div>

          {/* 5. Service & Cost Details Section */}
          <div className="glass-panel p-6">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <DollarSign size={18} className="text-indigo-400" />
              Service & Pricing Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col sm:col-span-2">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Service Type *</label>
                <input
                  type="text"
                  required
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="e.g. Engine Oil Replacement"
                  className="glass-input"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Service Amount ($) *</label>
                <div className="relative">
                  <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="glass-input pl-10 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Tax ($)</label>
                  <div className="relative">
                    <Percent size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="number"
                      step="0.01"
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                      placeholder="0.00"
                      className="glass-input pl-10 w-full text-rose-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Discount ($)</label>
                  <div className="relative">
                    <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="number"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0.00"
                      className="glass-input pl-10 w-full text-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* Auto Calculated Display */}
              <div className="flex sm:col-span-2 items-center justify-between bg-slate-950/40 border border-slate-800 p-4 rounded-xl mt-2">
                <span className="text-sm font-semibold text-slate-400">Auto Calculated Total:</span>
                <span className="text-2xl font-extrabold text-indigo-400">
                  ${calculatedTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDetails}
                className="px-5 py-2.5 border border-slate-700/80 hover:border-indigo-500/40 hover:bg-slate-800/40 text-slate-200 font-semibold rounded-xl text-sm transition-all flex items-center gap-2"
              >
                <Save size={16} className="text-indigo-400" />
                Save Details (Draft)
              </button>

              <button
                type="button"
                onClick={handleSaveBill}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20"
              >
                <CheckCircle2 size={16} />
                Save Bill
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={generatePDF}
                className="p-2.5 border border-slate-700 hover:border-emerald-500/40 rounded-xl hover:bg-slate-800/30 text-emerald-400 hover:text-emerald-300 transition-colors"
                title="Download PDF Invoice"
              >
                <Download size={18} />
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="p-2.5 border border-slate-700 hover:border-indigo-500/40 rounded-xl hover:bg-slate-800/30 text-indigo-400 hover:text-indigo-300 transition-colors"
                title="Print Invoice"
              >
                <Printer size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Preview Column (lg:col-span-5) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">LIVE INVOICE PREVIEW</h3>
            <span className="text-[10px] text-slate-500 animate-pulse-subtle bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
              Live updating
            </span>
          </div>
          
          <div className="w-full scale-[0.8] origin-top sm:scale-[0.9] lg:scale-100 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-slate-950">
            <InvoicePreview 
              ref={componentRef} 
              bill={getCurrentBillData()} 
            />
          </div>
        </div>

      </div>
    </div>
  );
}

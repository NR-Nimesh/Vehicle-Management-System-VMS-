import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBilling } from '../context/BillingContext';
import { useReactToPrint } from 'react-to-print';
import { generateInvoicePDF } from '../utils/generateInvoice';
import { compressImage } from '../utils/imageCompressor';
import InvoicePreview from '../components/InvoicePreview';
import InputWithIcon from '../components/InputWithIcon';
import useFormFieldNavigation from '../hooks/useFormFieldNavigation';
import {
  sanitizePhone,
  sanitizeVehicleNumber,
  normalizeEmail,
  isValidPhone,
} from '../utils/billingValidation';
import {
  Calendar, Hash, User, Car, Phone, Mail,
  DollarSign, Percent, Tag, Download,
  Printer, ArrowLeft, Upload, CheckCircle2, AlertCircle, Plus, Trash2
} from 'lucide-react';

const MAX_SERVICES = 20;
const DEFAULT_SERVICE = { type: '', amount: '' };

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

  const componentRef = useRef(null);
  const formRef = useRef(null);
  useFormFieldNavigation(formRef);

  // ── Form states ───────────────────────────────────────────────────────────
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Vehicle
  const [vehiclePhoto, setVehiclePhoto] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleDescription, setVehicleDescription] = useState('');

  // Customer
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Business
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');

  // Services — multi-row table
  const [services, setServices] = useState([{ ...DEFAULT_SERVICE }]);
  const [tax, setTax] = useState('');
  const [discount, setDiscount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');

  // UI states
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [modal, setModal] = useState({ show: false, message: '', type: '' });

  // ── Draft persistence ─────────────────────────────────────────────────────
  const DRAFT_KEY = 'billing_draft';
  const draftLoaded = useRef(false);

  // Auto-save draft on every change (new bills only)
  useEffect(() => {
    if (currentEditBill) return;
    if (!draftLoaded.current) return;
    const draft = {
      date, invoiceNumber, vehiclePhoto, vehicleNumber, vehicleModel, vehicleDescription,
      customerName, customerEmail, customerPhone, businessName, businessPhone, businessEmail,
      services, tax, discount, paidAmount
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [date, invoiceNumber, vehiclePhoto, vehicleNumber, vehicleModel, vehicleDescription,
      customerName, customerEmail, customerPhone, businessName, businessPhone, businessEmail,
      services, tax, discount, paidAmount, currentEditBill]);

  // Load data once on mount
  useEffect(() => {
    if (draftLoaded.current) return;
    draftLoaded.current = true;

    if (currentEditBill) {
      setDate(currentEditBill.date || new Date().toISOString().split('T')[0]);
      setInvoiceNumber(currentEditBill.invoiceNumber || '');
      setVehiclePhoto(currentEditBill.vehiclePhoto || '');
      setVehicleNumber(sanitizeVehicleNumber(currentEditBill.vehicleNumber || ''));
      setVehicleModel(currentEditBill.vehicleModel || '');
      setVehicleDescription(currentEditBill.vehicleDescription || '');
      setCustomerName(currentEditBill.customerName || '');
      setCustomerEmail(currentEditBill.customerEmail || '');
      setCustomerPhone(sanitizePhone(currentEditBill.customerPhone || ''));
      setBusinessName(currentEditBill.businessName || '');
      setBusinessPhone(currentEditBill.businessPhone || '');
      setBusinessEmail(currentEditBill.businessEmail || '');
      // Support both legacy single-service and new multi-service format
      if (Array.isArray(currentEditBill.services) && currentEditBill.services.length > 0) {
        setServices(currentEditBill.services);
      } else if (currentEditBill.serviceType) {
        setServices([{ type: currentEditBill.serviceType, amount: String(currentEditBill.amount || '') }]);
      } else {
        setServices([{ ...DEFAULT_SERVICE }]);
      }
      setTax(currentEditBill.tax || '');
      setDiscount(currentEditBill.discount || '');
      setPaidAmount(currentEditBill.paidAmount || '');
    } else {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setDate(draft.date || new Date().toISOString().split('T')[0]);
          setInvoiceNumber(draft.invoiceNumber || getNextInvoiceNumber());
          setVehiclePhoto(draft.vehiclePhoto || '');
          setVehicleNumber(sanitizeVehicleNumber(draft.vehicleNumber || ''));
          setVehicleModel(draft.vehicleModel || '');
          setVehicleDescription(draft.vehicleDescription || '');
          setCustomerName(draft.customerName || '');
          setCustomerEmail(draft.customerEmail || '');
          setCustomerPhone(sanitizePhone(draft.customerPhone || ''));
          setBusinessName(draft.businessName || '');
          setBusinessPhone(draft.businessPhone || '');
          setBusinessEmail(draft.businessEmail || '');
          setServices(Array.isArray(draft.services) && draft.services.length > 0
            ? draft.services
            : [{ ...DEFAULT_SERVICE }]);
          setTax(draft.tax || '');
          setDiscount(draft.discount || '');
          setPaidAmount(draft.paidAmount || '');
        } catch {
          localStorage.removeItem(DRAFT_KEY);
          setInvoiceNumber(getNextInvoiceNumber());
          if (businessProfile) {
            setBusinessName(businessProfile.name || '');
            setBusinessPhone(businessProfile.phone || '');
            setBusinessEmail(businessProfile.email || '');
          }
        }
      } else {
        setInvoiceNumber(getNextInvoiceNumber());
        if (businessProfile) {
          setBusinessName(businessProfile.name || '');
          setBusinessPhone(businessProfile.phone || '');
          setBusinessEmail(businessProfile.email || '');
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Service table helpers ─────────────────────────────────────────────────
  const addServiceRow = () => {
    if (services.length >= MAX_SERVICES) return;
    setServices(prev => [...prev, { ...DEFAULT_SERVICE }]);
  };

  const removeServiceRow = (index) => {
    if (services.length === 1) return; // keep at least one row
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const updateServiceRow = (index, field, value) => {
    setServices(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const handlePhoneChange = (e) => {
    setCustomerPhone(sanitizePhone(e.target.value));
  };

  const handleVehicleNumberChange = (e) => {
    setVehicleNumber(sanitizeVehicleNumber(e.target.value));
  };

  const handleEmailBlur = () => {
    setCustomerEmail((prev) => normalizeEmail(prev));
  };

  const handleEmailChange = (e) => {
    const raw = e.target.value;
    if (raw.includes('@')) {
      setCustomerEmail(raw);
    } else {
      setCustomerEmail(raw.replace(/\s/g, ''));
    }
  };

  // ── Keyboard Navigation for Services ──
  const handleServiceTypeKeyDown = (e, index) => {
    if (e.key === 'Escape') {
      e.target.blur();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const amountInput = document.getElementById(`service-amount-${index}`);
      if (amountInput) amountInput.focus();
    }
  };

  const handleServiceAmountKeyDown = (e, index) => {
    if (e.key === 'Escape') {
      e.target.blur();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === services.length - 1 && services.length < MAX_SERVICES) {
        addServiceRow();
        setTimeout(() => {
          const nextTypeInput = document.getElementById(`service-type-${index + 1}`);
          if (nextTypeInput) nextTypeInput.focus();
        }, 0);
      } else if (index < services.length - 1) {
        const nextTypeInput = document.getElementById(`service-type-${index + 1}`);
        if (nextTypeInput) nextTypeInput.focus();
      }
    }
  };

  // ── Calculations ──────────────────────────────────────────────────────────
  const subtotal = services.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
  const taxVal = parseFloat(tax) || 0;
  const discountVal = parseFloat(discount) || 0;
  const finalTotal = subtotal + taxVal - discountVal;
  const paidVal = parseFloat(paidAmount) || 0;
  const pendingVal = finalTotal - paidVal;

  // ── Photo upload ──────────────────────────────────────────────────────────
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const compressed = await compressImage(event.target.result, 400, 300);
        setVehiclePhoto(compressed);
      } catch {
        setVehiclePhoto(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Build bill data object ────────────────────────────────────────────────
  const getCurrentBillData = () => ({
    date,
    invoiceNumber,
    vehiclePhoto,
    vehicleNumber: sanitizeVehicleNumber(vehicleNumber),
    vehicleModel,
    vehicleDescription,
    customerName,
    customerEmail: normalizeEmail(customerEmail),
    customerPhone: sanitizePhone(customerPhone),
    businessName,
    businessPhone,
    businessEmail,
    businessLogo: businessProfile?.logo || '',
    businessAddress: businessProfile?.address || '',
    businessTaxNumber: businessProfile?.taxNumber || '',
    services,
    // Legacy fields for backward compatibility with PDF / print templates
    serviceType: services.map(s => s.type).filter(Boolean).join(', '),
    amount: subtotal,
    tax: taxVal,
    discount: discountVal,
    total: finalTotal,
    paidAmount: paidVal,
    pendingAmount: pendingVal
  });

  // ── Save Bill ─────────────────────────────────────────────────────────────
  const handleSaveBill = async () => {
    if (!customerName || !vehicleNumber || !vehicleModel) {
      setNotification({
        type: 'error',
        message: 'Please complete all required fields (*): Customer Name, Vehicle Number, and Vehicle Model.'
      });
      return;
    }
    if (customerPhone && !isValidPhone(customerPhone)) {
      setNotification({
        type: 'error',
        message: 'Phone number must contain exactly 10 digits (numbers only).'
      });
      return;
    }
    if (services.every(s => !s.type && !s.amount)) {
      setNotification({ type: 'error', message: 'Please add at least one service row.' });
      return;
    }
    const billData = getCurrentBillData();
    try {
      if (currentEditBill) {
        await updateBill({ ...billData, id: currentEditBill.id });
      } else {
        await addBill(billData);
      }
      setModal({ show: true, message: 'Bill saved successfully!', type: 'success' });
      const nextInv = await incrementInvoiceCounter();
      setInvoiceNumber(nextInv);
      clearNewBillFields();
      setDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      setModal({ show: true, message: `Error saving bill: ${error.message}`, type: 'error' });
    }
  };

  const handleClearForm = () => {
    if (window.confirm("Are you sure you want to clear all entered data? This action cannot be undone.")) {
      clearNewBillFields();
      setDate(new Date().toISOString().split('T')[0]);
      if (!currentEditBill) {
        setInvoiceNumber(getNextInvoiceNumber());
      }
      setNotification({ type: 'success', message: 'Form cleared successfully.' });
    }
  };

  const clearNewBillFields = () => {
    localStorage.removeItem(DRAFT_KEY);
    setVehiclePhoto('');
    setVehicleNumber('');
    setVehicleModel('');
    setVehicleDescription('');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setServices([{ ...DEFAULT_SERVICE }]);
    setTax('');
    setDiscount('');
    setPaidAmount('');
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 4000);
  };

  const generatePDF = () => {
    generateInvoicePDF(getCurrentBillData(), businessProfile);
    if (!currentEditBill) localStorage.removeItem(DRAFT_KEY);
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    onAfterPrint: () => { if (!currentEditBill) localStorage.removeItem(DRAFT_KEY); }
  });

  const handleBackToHistory = () => {
    setCurrentEditBill(null);
    navigate('/history');
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Success / Error Modal */}
      {modal.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 animate-fadeIn">
            <div className={`flex items-center gap-3 mb-3 ${modal.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {modal.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              <h2 className="text-lg font-bold">
                {modal.type === 'success' ? 'Saved Successfully!' : 'Save Failed'}
              </h2>
            </div>
            <p className="text-slate-300 text-sm mb-5">{modal.message}</p>
            <button
              onClick={() => setModal({ show: false, message: '', type: '' })}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 flex flex-col items-center">

        <div className="max-w-3xl w-full">
          {/* Page Header */}
          <div className="flex flex-col items-center justify-center gap-4 mb-8 text-center">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent text-center">
                {currentEditBill ? 'Edit Invoice Workspace' : 'Invoice Workspace'}
              </h1>
              <p className="text-slate-400 text-sm mt-1 text-center">
                {currentEditBill
                  ? `Modify invoice details for ${currentEditBill.invoiceNumber}`
                  : 'Create, preview, print, and export vehicle service invoices.'}
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
          <div ref={formRef} className="space-y-6">

            {/* Inline notification banner */}
            {notification.message && (
              <div className={`p-4 rounded-xl flex items-start gap-2.5 border animate-fadeIn ${
                notification.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                {notification.type === 'success'
                  ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
                <span className="text-sm font-medium">{notification.message}</span>
              </div>
            )}

            {/* ── 1. Invoice Configuration ── */}
            <div className="glass-panel p-6">
              <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Hash size={18} className="text-indigo-400" />
                Invoice Configuration
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Date</label>
                  <InputWithIcon
                    type="date"
                    icon={Calendar}
                    iconSize={15}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Invoice Number</label>
                  <InputWithIcon
                    type="text"
                    icon={Hash}
                    iconSize={15}
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-0000"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            {/* ── 2. Customer Information ── */}
            <div className="glass-panel p-6">
              <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                <User size={18} className="text-indigo-400" />
                Customer Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Customer Name *</label>
                  <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. John Doe" className="glass-input w-full" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <InputWithIcon
                    type="email"
                    icon={Mail}
                    iconSize={15}
                    value={customerEmail}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    placeholder="username or name@gmail.com"
                    inputMode="email"
                    autoComplete="email"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Phone Number</label>
                  <InputWithIcon
                    type="tel"
                    icon={Phone}
                    iconSize={15}
                    value={customerPhone}
                    onChange={handlePhoneChange}
                    placeholder="9876543210"
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="tel"
                  />
                  {customerPhone.length > 0 && customerPhone.length < 10 && (
                    <p className="text-[11px] text-amber-400/90 mt-1">{customerPhone.length}/10 digits</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── 3. Vehicle Information ── */}
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
                    onChange={handleVehicleNumberChange}
                    placeholder="e.g. CA87690"
                    className="glass-input w-full font-mono uppercase tracking-wider font-bold"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Vehicle Model *</label>
                  <input type="text" required value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="e.g. Maruti Swift (2022)" className="glass-input w-full" />
                </div>

                {/* Photo Upload */}
                <div className="flex flex-col sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Vehicle Photo</label>
                  <div className="flex items-center gap-4 border border-slate-700/60 rounded-lg p-3 bg-slate-950/30">
                    <div className="relative w-16 h-12 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                      {vehiclePhoto
                        ? <img src={vehiclePhoto} alt="Thumbnail" className="w-full h-full object-cover" />
                        : <Car size={20} className="text-slate-600" />}
                    </div>
                    <div className="flex-1">
                      <label htmlFor="vehicle-photo" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-medium cursor-pointer transition-colors shadow">
                        <Upload size={13} />
                        Upload Photo
                      </label>
                      <input type="file" id="vehicle-photo" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      <p className="text-[10px] text-slate-500 mt-1">Accepts PNG, JPEG. Auto-resizes.</p>
                    </div>
                    {vehiclePhoto && (
                      <button type="button" onClick={() => setVehiclePhoto('')} className="text-xs text-rose-400 hover:text-rose-300 font-semibold">
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Vehicle Description / Remarks</label>
                  <textarea value={vehicleDescription} onChange={(e) => setVehicleDescription(e.target.value)} rows={2} placeholder="e.g. Scratches on left fender. Engine oil level low." className="glass-input resize-none" />
                </div>
              </div>
            </div>

            {/* ── 4. Service & Pricing Details ── */}
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <DollarSign size={18} className="text-indigo-400" />
                  Service &amp; Pricing Details
                </h2>
                <button
                  type="button"
                  onClick={addServiceRow}
                  disabled={services.length >= MAX_SERVICES}
                  title={services.length >= MAX_SERVICES ? 'Maximum 20 rows reached' : 'Add service row'}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  Add Row
                  <span className="ml-1 text-indigo-300 font-normal">({services.length}/{MAX_SERVICES})</span>
                </button>
              </div>

              {/* Services Table */}
              <div className="rounded-xl border border-slate-700/60 overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="text-left py-3 px-4 font-semibold">#</th>
                      <th className="text-left py-3 px-4 font-semibold">Service Type</th>
                      <th className="text-right py-3 px-4 font-semibold">Amount (Rs.)</th>
                      <th className="py-3 px-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {services.map((row, index) => (
                      <tr key={index} className="group hover:bg-slate-800/20 transition-colors">
                        <td className="py-2 px-4 text-slate-500 text-xs font-mono">{index + 1}</td>
                        <td className="py-2 px-4">
                          <input
                            id={`service-type-${index}`}
                            type="text"
                            value={row.type}
                            onChange={(e) => updateServiceRow(index, 'type', e.target.value)}
                            onKeyDown={(e) => handleServiceTypeKeyDown(e, index)}
                            placeholder="e.g. Engine Oil Change"
                            className="glass-input text-sm py-2 min-h-0"
                          />
                        </td>
                        <td className="py-2 px-4">
                          <input
                            id={`service-amount-${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={row.amount}
                            onChange={(e) => updateServiceRow(index, 'amount', e.target.value)}
                            onKeyDown={(e) => handleServiceAmountKeyDown(e, index)}
                            placeholder="0.00"
                            className="glass-input text-sm text-right py-2 min-h-0"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          {services.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeServiceRow(index)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                              title="Remove row"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Subtotal + Tax + Discount + Final Total */}
              <div className="space-y-3">
                {/* Subtotal */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm text-slate-400">Subtotal</span>
                  <span className="text-sm font-semibold text-slate-200">Rs. {subtotal.toFixed(2)}</span>
                </div>

                {/* Tax & Discount inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Tax (Rs.)</label>
                    <InputWithIcon
                      type="number"
                      icon={Percent}
                      iconSize={14}
                      step="0.01"
                      min="0"
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                      placeholder="0.00"
                      className="text-rose-400"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Discount (Rs.)</label>
                    <InputWithIcon
                      type="number"
                      icon={Tag}
                      iconSize={14}
                      step="0.01"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0.00"
                      className="text-emerald-400"
                    />
                  </div>
                  <div className="flex flex-col col-span-2">
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Paid Amount (Rs.)</label>
                    <InputWithIcon
                      type="number"
                      icon={DollarSign}
                      iconSize={14}
                      step="0.01"
                      min="0"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder="0.00"
                      className="text-indigo-400"
                    />
                  </div>
                </div>

                {/* Formula breakdown */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Subtotal</span>
                    <span>Rs. {subtotal.toFixed(2)}</span>
                  </div>
                  {taxVal > 0 && (
                    <div className="flex justify-between text-xs text-rose-400/80">
                      <span>+ Tax</span>
                      <span>Rs. {taxVal.toFixed(2)}</span>
                    </div>
                  )}
                  {discountVal > 0 && (
                    <div className="flex justify-between text-xs text-emerald-400/80">
                      <span>− Discount</span>
                      <span>Rs. {discountVal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-700/50 pt-2 flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-300">Total</span>
                    <span className="text-2xl font-extrabold text-indigo-400">Rs. {finalTotal.toFixed(2)}</span>
                  </div>
                  {paidVal > 0 && (
                    <div className="flex justify-between text-xs text-indigo-300/80">
                      <span>− Paid Amount</span>
                      <span>Rs. {paidVal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-700/50 pt-2 flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-300">Pending Amount</span>
                    <span className={`text-lg font-bold ${pendingVal > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>Rs. {pendingVal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 pb-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-enter-submit
                  onClick={handleSaveBill}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  <CheckCircle2 size={16} />
                  Save Bill
                </button>
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="px-4 py-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 font-semibold rounded-xl text-sm transition-all flex items-center gap-2 border border-rose-500/20"
                >
                  <Trash2 size={16} />
                  Clear
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
        </div>
      </div>

      {/* Hidden print area */}
      <div className="hidden">
        <div ref={componentRef}>
          <InvoicePreview bill={getCurrentBillData()} businessProfile={businessProfile} />
        </div>
      </div>
    </>
  );
}

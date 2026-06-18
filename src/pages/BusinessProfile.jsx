import React, { useState, useEffect, useRef } from 'react';
import { useBilling } from '../context/BillingContext';
import { compressImage } from '../utils/imageCompressor';
import useFormFieldNavigation from '../hooks/useFormFieldNavigation';
import { Building2, Phone, Mail, MapPin, Percent, Upload, CheckCircle2 } from 'lucide-react';

export default function BusinessProfile() {
  const { businessProfile, updateBusinessProfile } = useBilling();
  const formRef = useRef(null);
  useFormFieldNavigation(formRef);
  
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    address: '',
    phone: '',
    email: '',
    taxNumber: ''
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync state with context when loaded
  useEffect(() => {
    if (businessProfile) {
      setFormData(businessProfile);
    }
  }, [businessProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // Compress image before saving
        const compressed = await compressImage(event.target.result, 300, 300);
        setFormData(prev => ({ ...prev, logo: compressed }));
      } catch (err) {
        console.error('Image compression failed', err);
        // Fallback to original base64 if compression fails
        setFormData(prev => ({ ...prev, logo: event.target.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await updateBusinessProfile(formData);
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save business profile', error);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            Business Profile
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure default headers, logos, and taxes for your invoices.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 sm:p-8">
        {success && (
          <div className="mb-6 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl animate-fadeIn">
            <CheckCircle2 size={20} />
            <span className="text-sm font-medium">Business profile settings updated successfully!</span>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-800">
            <div className="relative group">
              <div className="w-28 h-28 rounded-2xl bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-indigo-500/50">
                {formData.logo ? (
                  <img src={formData.logo} alt="Business Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <Building2 size={36} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                )}
              </div>
              <label htmlFor="logo-upload" className="absolute bottom-1 right-1 bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-lg cursor-pointer transition-colors shadow-lg shadow-indigo-600/30">
                <Upload size={14} />
              </label>
              <input 
                type="file" 
                id="logo-upload" 
                accept="image/*" 
                onChange={handleLogoUpload} 
                className="hidden" 
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-semibold text-slate-200">Business Logo</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Upload a JPEG or PNG image. Image will be compressed automatically for local database efficiency.
              </p>
              {formData.logo && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                  className="mt-2 text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
                >
                  Remove Logo
                </button>
              )}
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                <Building2 size={15} className="text-indigo-400" />
                Business Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Acme Auto Services"
                className="glass-input w-full"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                <Percent size={15} className="text-indigo-400" />
                Tax Registration Number
              </label>
              <input
                type="text"
                name="taxNumber"
                value={formData.taxNumber}
                onChange={handleChange}
                placeholder="e.g. TAX-987654321"
                className="glass-input w-full"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                <Phone size={15} className="text-indigo-400" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +1 (555) 019-2834"
                className="glass-input w-full"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                <Mail size={15} className="text-indigo-400" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. info@acmeauto.com"
                className="glass-input w-full"
              />
            </div>

            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                <MapPin size={15} className="text-indigo-400" />
                Business Address
              </label>
              <textarea
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. 123 Gearbox Lane, Auto City, AC 94012"
                className="glass-input resize-none w-full"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 hover:scale-102 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving Settings...
                </>
              ) : (
                'Save Business Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

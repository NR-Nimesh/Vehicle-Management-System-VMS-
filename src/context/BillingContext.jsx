import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const BillingContext = createContext();

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};

export const BillingProvider = ({ children }) => {
  const [bills, setBills] = useState([]);
  const [businessProfile, setBusinessProfile] = useState({
    name: '',
    logo: '',
    address: '',
    phone: '',
    email: '',
    taxNumber: ''
  });
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState('INV-0001');
  const [currentEditBill, setCurrentEditBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mapBillData = (bill) => {
    // Parse services — may come as a JSON string from MySQL or already as an array
    let services = bill.services || bill.service_list || [];
    if (typeof services === 'string') {
      try { services = JSON.parse(services); } catch { services = []; }
    }
    if (!Array.isArray(services)) services = [];

    return {
      id: bill.id,
      invoiceNumber: bill.invoice_number || bill.invoiceNumber,
      date: bill.date ? (typeof bill.date === 'string' ? bill.date.split('T')[0] : new Date(bill.date).toISOString().split('T')[0]) : null,
      vehiclePhoto: bill.vehicle_photo || bill.vehiclePhoto,
      vehicleNumber: bill.vehicle_number || bill.vehicleNumber,
      vehicleModel: bill.vehicle_model || bill.vehicleModel,
      vehicleDescription: bill.vehicle_description || bill.vehicleDescription,
      customerName: bill.customer_name || bill.customerName,
      customerEmail: bill.customer_email || bill.customerEmail,
      customerPhone: bill.customer_phone || bill.customerPhone,
      businessName: bill.business_name || bill.businessName,
      businessPhone: bill.business_phone || bill.businessPhone,
      businessEmail: bill.business_email || bill.businessEmail,
      businessLogo: bill.business_logo || bill.businessLogo,
      businessAddress: bill.business_address || bill.businessAddress,
      businessTaxNumber: bill.business_tax_number || bill.businessTaxNumber,
      serviceType: bill.service_type || bill.serviceType,
      services,
      amount: bill.amount,
      tax: bill.tax,
      discount: bill.discount,
      total: bill.total,
      createdAt: bill.created_at,
      updatedAt: bill.updated_at
    };
  };

  const fetchBills = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/bills');
      setBills(data.map(mapBillData));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessProfile = async () => {
    try {
      const data = await apiRequest('/business-profile');
      setBusinessProfile({
        name: data.name || '',
        logo: data.logo || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        taxNumber: data.tax_number || ''
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchNextInvoiceNumber = async () => {
    try {
      const data = await apiRequest('/bills/next-invoice-number');
      const next = data.nextInvoiceNumber || 'INV-0001';
      setNextInvoiceNumber(next);
      return next;
    } catch (err) {
      setError(err.message);
      return 'INV-0001';
    }
  };

  useEffect(() => {
    fetchBills();
    fetchBusinessProfile();
    fetchNextInvoiceNumber();
  }, []);

  const addBill = async (billData) => {
    const newBill = await apiRequest('/bills', {
      method: 'POST',
      body: JSON.stringify(billData)
    });
    const mapped = mapBillData(newBill);
    setBills((prev) => [mapped, ...prev]);
    return mapped;
  };

  const updateBill = async (updatedBill) => {
    const updated = await apiRequest(`/bills/${updatedBill.id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedBill)
    });
    const mapped = mapBillData(updated);
    setBills((prev) => prev.map((bill) => (bill.id === mapped.id ? mapped : bill)));
    if (currentEditBill && currentEditBill.id === mapped.id) {
      setCurrentEditBill(null);
    }
    return mapped;
  };

  const deleteBill = async (id) => {
    await apiRequest(`/bills/${id}`, { method: 'DELETE' });
    setBills((prev) => prev.filter((bill) => bill.id !== id));
    if (currentEditBill && currentEditBill.id === id) {
      setCurrentEditBill(null);
    }
  };

  const updateBusinessProfile = async (profile) => {
    const updated = await apiRequest('/business-profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: profile.name || null,
        logo: profile.logo || null,
        address: profile.address || null,
        phone: profile.phone || null,
        email: profile.email || null,
        tax_number: profile.taxNumber || null
      })
    });
    setBusinessProfile({
      name: updated.name || '',
      logo: updated.logo || '',
      address: updated.address || '',
      phone: updated.phone || '',
      email: updated.email || '',
      taxNumber: updated.tax_number || ''
    });
    return updated;
  };

  const getNextInvoiceNumber = () => nextInvoiceNumber;

  const incrementInvoiceCounter = async () => {
    return await fetchNextInvoiceNumber();
  };

  return (
    <BillingContext.Provider value={{
      bills,
      businessProfile,
      nextInvoiceNumber,
      currentEditBill,
      setCurrentEditBill,
      addBill,
      updateBill,
      deleteBill,
      updateBusinessProfile,
      getNextInvoiceNumber,
      incrementInvoiceCounter,
      loading,
      error
    }}>
      {children}
    </BillingContext.Provider>
  );
};

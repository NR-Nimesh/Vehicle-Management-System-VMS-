import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  loadBills, 
  saveBills, 
  loadBusinessProfile, 
  saveBusinessProfile, 
  loadLatestInvoiceCounter, 
  saveLatestInvoiceCounter 
} from '../utils/localStorage';
import { v4 as uuidv4 } from 'uuid';

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
  const [latestInvoiceCounter, setLatestInvoiceCounter] = useState(0);
  const [currentEditBill, setCurrentEditBill] = useState(null);

  // Load initial state from Local Storage
  useEffect(() => {
    setBills(loadBills());
    setBusinessProfile(loadBusinessProfile());
    setLatestInvoiceCounter(loadLatestInvoiceCounter());
  }, []);

  // Sync bills state to Local Storage
  const syncBills = (updatedBills) => {
    setBills(updatedBills);
    saveBills(updatedBills);
  };

  // State action: Save Business Profile
  const updateBusinessProfile = (profile) => {
    setBusinessProfile(profile);
    saveBusinessProfile(profile);
  };

  // State action: Add Bill
  const addBill = (billData) => {
    const newBill = {
      ...billData,
      id: uuidv4()
    };
    const updatedBills = [newBill, ...bills];
    syncBills(updatedBills);
    return newBill;
  };

  // State action: Update Bill
  const updateBill = (updatedBill) => {
    const updatedBills = bills.map(bill => 
      bill.id === updatedBill.id ? updatedBill : bill
    );
    syncBills(updatedBills);
    // Clear current edit bill state if we just updated it
    if (currentEditBill && currentEditBill.id === updatedBill.id) {
      setCurrentEditBill(null);
    }
  };

  // State action: Delete Bill
  const deleteBill = (id) => {
    const updatedBills = bills.filter(bill => bill.id !== id);
    syncBills(updatedBills);
    if (currentEditBill && currentEditBill.id === id) {
      setCurrentEditBill(null);
    }
  };

  // Auto-increment helpers
  const getNextInvoiceNumber = () => {
    const nextCounter = latestInvoiceCounter + 1;
    return `INV-${String(nextCounter).padStart(4, '0')}`;
  };

  const incrementInvoiceCounter = () => {
    const nextCounter = latestInvoiceCounter + 1;
    setLatestInvoiceCounter(nextCounter);
    saveLatestInvoiceCounter(nextCounter);
    return nextCounter;
  };

  return (
    <BillingContext.Provider value={{
      bills,
      businessProfile,
      latestInvoiceCounter,
      currentEditBill,
      setCurrentEditBill,
      addBill,
      updateBill,
      deleteBill,
      updateBusinessProfile,
      getNextInvoiceNumber,
      incrementInvoiceCounter
    }}>
      {children}
    </BillingContext.Provider>
  );
};

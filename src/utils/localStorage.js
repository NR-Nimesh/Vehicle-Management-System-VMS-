const KEYS = {
  BILLS: 'vms_bills',
  BUSINESS_PROFILE: 'vms_business_profile',
  LATEST_INVOICE_NUMBER: 'vms_latest_invoice_number'
};

export const loadBills = () => {
  try {
    const data = localStorage.getItem(KEYS.BILLS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading bills from local storage', error);
    return [];
  }
};

export const saveBills = (bills) => {
  try {
    localStorage.setItem(KEYS.BILLS, JSON.stringify(bills));
  } catch (error) {
    console.error('Error saving bills to local storage', error);
  }
};

export const loadBusinessProfile = () => {
  try {
    const data = localStorage.getItem(KEYS.BUSINESS_PROFILE);
    return data ? JSON.parse(data) : {
      name: '',
      logo: '',
      address: '',
      phone: '',
      email: '',
      taxNumber: ''
    };
  } catch (error) {
    console.error('Error loading business profile from local storage', error);
    return {
      name: '',
      logo: '',
      address: '',
      phone: '',
      email: '',
      taxNumber: ''
    };
  }
};

export const saveBusinessProfile = (profile) => {
  try {
    localStorage.setItem(KEYS.BUSINESS_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving business profile to local storage', error);
  }
};

export const loadLatestInvoiceCounter = () => {
  try {
    const data = localStorage.getItem(KEYS.LATEST_INVOICE_NUMBER);
    return data ? parseInt(data, 10) : 0;
  } catch (error) {
    console.error('Error loading latest invoice counter from local storage', error);
    return 0;
  }
};

export const saveLatestInvoiceCounter = (counter) => {
  try {
    localStorage.setItem(KEYS.LATEST_INVOICE_NUMBER, counter.toString());
  } catch (error) {
    console.error('Error saving latest invoice counter to local storage', error);
  }
};

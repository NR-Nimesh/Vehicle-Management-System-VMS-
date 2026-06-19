import { jsPDF } from 'jspdf';

export const generateInvoicePDF = (bill) => {
  // Create instance of jsPDF (A4 size: 210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [79, 70, 229]; // Indigo
  const darkColor = [15, 23, 42];    // Slate 900
  const lightColor = [241, 245, 249]; // Slate 100
  const grayColor = [100, 116, 139];  // Slate 500

  // Margins & Dimensions
  const marginX = 15;
  let currentY = 15;

  // Draw Header background band
  doc.setFillColor(...lightColor);
  doc.rect(0, 0, 210, 45, 'F');

  // Business Logo & Details
  if (bill.businessLogo) {
    try {
      doc.addImage(bill.businessLogo, 'JPEG', marginX, 10, 25, 25);
    } catch (e) {
      console.warn('Could not render business logo in PDF:', e);
    }
  }

  // Business info text
  doc.setTextColor(...darkColor);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(20);
  const businessNameX = bill.businessLogo ? 45 : marginX;
  doc.text(bill.businessName || 'Vehicle Management', businessNameX, 18);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text(`Phone: ${bill.businessPhone || 'N/A'}`, businessNameX, 24);
  doc.text(`Email: ${bill.businessEmail || 'N/A'}`, businessNameX, 29);
  if (bill.businessTaxNumber) {
    doc.text(`Tax/VAT: ${bill.businessTaxNumber}`, businessNameX, 34);
  }

  // Invoice Date & ID on Top Right
  doc.setTextColor(...darkColor);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('INVOICE', 195, 18, { align: 'right' });
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Invoice No: ${bill.invoiceNumber}`, 195, 24, { align: 'right' });
  doc.text(`Date: ${bill.date}`, 195, 29, { align: 'right' });

  // Move Y pointer past the header band
  currentY = 55;

  // Horizontal separator line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(marginX, currentY, 195, currentY);
  currentY += 8;

  // Billing To & Vehicle Details Sections (Two columns)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text('CLIENT DETAILS', marginX, currentY);
  doc.text('VEHICLE DETAILS', 105, currentY);
  currentY += 6;

  doc.setTextColor(...darkColor);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  
  // Client Details column
  doc.text(`Name: ${bill.customerName}`, marginX, currentY);
  doc.text(`Email: ${bill.customerEmail || 'N/A'}`, marginX, currentY + 5);
  doc.text(`Phone: ${bill.customerPhone || 'N/A'}`, marginX, currentY + 10);

  // Vehicle Details column
  doc.text(`Plate No: ${bill.vehicleNumber}`, 105, currentY);
  doc.text(`Model: ${bill.vehicleModel}`, 105, currentY + 5);
  doc.text(`Desc: ${bill.vehicleDescription || 'N/A'}`, 105, currentY + 10);

  currentY += 20;

  // If Vehicle Photo is present, draw a nice framed photo card
  if (bill.vehiclePhoto) {
    try {
      doc.setFillColor(...lightColor);
      doc.roundedRect(marginX, currentY, 180, 42, 3, 3, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...primaryColor);
      doc.text('VEHICLE PHOTO PREVIEW', marginX + 5, currentY + 8);
      
      // Draw image
      doc.addImage(bill.vehiclePhoto, 'JPEG', marginX + 5, currentY + 12, 45, 25);
      
      // Add info next to image
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...darkColor);
      doc.text(`Model Reference: ${bill.vehicleModel}`, marginX + 55, currentY + 15);
      doc.text(`Registered ID: ${bill.vehicleNumber}`, marginX + 55, currentY + 20);
      doc.text(`Generated Date: ${bill.date}`, marginX + 55, currentY + 25);
      
      currentY += 50;
    } catch (e) {
      console.warn('Could not render vehicle photo in PDF:', e);
      currentY += 5;
    }
  } else {
    currentY += 5;
  }

  // Service Details Header Table
  doc.setFillColor(...primaryColor);
  doc.rect(marginX, currentY, 180, 8, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Service Type', marginX + 5, currentY + 5.5);
  doc.text('Amount', 190, currentY + 5.5, { align: 'right' });
  
  currentY += 8;

  // Service Details Content Row
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.2);

  const services = (bill.services && Array.isArray(bill.services) && bill.services.length > 0)
    ? bill.services
    : [{ type: bill.serviceType || 'General Service', amount: bill.amount || 0 }];

  const rowHeight = 10;
  doc.rect(marginX, currentY, 180, services.length * rowHeight, 'FD');

  doc.setTextColor(...darkColor);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9.5);

  services.forEach((service, index) => {
    const yPos = currentY + (index * rowHeight) + 6.5;
    doc.text(service.type || 'General Service', marginX + 5, yPos);
    doc.text(`$${Number(service.amount || 0).toFixed(2)}`, 190, yPos, { align: 'right' });
    
    // Add horizontal line between rows if not last
    if (index < services.length - 1) {
      doc.setDrawColor(220, 225, 230);
      doc.setLineWidth(0.2);
      doc.line(marginX, currentY + ((index + 1) * rowHeight), 195, currentY + ((index + 1) * rowHeight));
    }
  });

  currentY += (services.length * rowHeight) + 10;

  // Breakdown Summary Table
  const labelX = 140;
  const valueX = 190;
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...grayColor);
  doc.text('Subtotal:', labelX, currentY);
  doc.setTextColor(...darkColor);
  doc.text(`$${Number(bill.amount).toFixed(2)}`, valueX, currentY, { align: 'right' });

  currentY += 6;
  doc.setTextColor(...grayColor);
  doc.text('Tax:', labelX, currentY);
  doc.setTextColor(...darkColor);
  doc.text(`+$${Number(bill.tax).toFixed(2)}`, valueX, currentY, { align: 'right' });

  currentY += 6;
  doc.setTextColor(...grayColor);
  doc.text('Discount:', labelX, currentY);
  doc.setTextColor(...darkColor);
  doc.text(`-$${Number(bill.discount).toFixed(2)}`, valueX, currentY, { align: 'right' });

  currentY += 8;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.4);
  doc.line(labelX - 10, currentY - 5, valueX, currentY - 5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('Grand Total:', labelX, currentY);
  doc.text(`$${Number(bill.total).toFixed(2)}`, valueX, currentY, { align: 'right' });

  // Footer Message
  const pageHeight = 297;
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text('Thank you for choosing our services!', 105, pageHeight - 20, { align: 'center' });
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('This is a computer-generated invoice.', 105, pageHeight - 15, { align: 'center' });

  // Trigger download in browser
  doc.save(`${bill.invoiceNumber}_invoice.pdf`);
};

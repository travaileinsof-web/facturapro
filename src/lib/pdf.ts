import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './store';

function hexToRgb(hex: string): [number, number, number] {
  if (!hex) return [15, 23, 42];
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [15, 23, 42];
}

export function generateInvoicePDF(invoice: any, settings: any) {
  const doc = new jsPDF({ format: 'a4', orientation: 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const primaryRgb = hexToRgb(settings?.primaryColor);
  const secondaryRgb: [number, number, number] = [71, 85, 105]; // slate-500
  const lightBgRgb: [number, number, number] = [248, 250, 252]; // slate-50
  
  // Clean, modern top border
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 0, pageWidth, 5, 'F');

  let y = 20;

  // Render Logo or Text
  if (settings.logo) {
      // Basic best-effort dimensions: 40 width, 18 height
      const format = settings.logo.includes('png') ? 'PNG' : 'JPEG';
      doc.addImage(settings.logo, format, 15, y, 45, 15);
      y += 20;
  } else {
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      doc.text((settings.companyName || 'ENTREPRISE').toUpperCase(), 15, y + 6);
      y += 15;
  }
  
  // Sender Details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
  
  if (settings.slogan) { 
      doc.setFont('helvetica', 'italic'); 
      doc.text(settings.slogan, 15, y); 
      doc.setFont('helvetica', 'normal'); 
      y += 5; 
  }
  if (settings.address) { doc.text(settings.address, 15, y); y += 4; }
  
  let contactInfo = [];
  if (settings.phone) contactInfo.push(settings.phone);
  if (settings.email) contactInfo.push(settings.email);
  if (settings.website) contactInfo.push(settings.website);
  if (contactInfo.length) { doc.text(contactInfo.join('  •  '), 15, y); y += 4; }
  if (settings.taxId) { doc.text(`NIF / RCCM : ${settings.taxId}`, 15, y); }

  // Document Box (FACTURE) ultra-modern
  doc.setFillColor(lightBgRgb[0], lightBgRgb[1], lightBgRgb[2]);
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(pageWidth - 90, 20, 75, 40, 2, 2, 'FD');
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text("FACTURE", pageWidth - 52, 30, { align: 'center' });

  doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.line(pageWidth - 75, 34, pageWidth - 30, 34);

  doc.setFontSize(9);
  doc.setTextColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
  doc.text("Numéro :", pageWidth - 85, 42);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text(invoice.number, pageWidth - 20, 42, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
  doc.text("Émission :", pageWidth - 85, 48);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text(formatDate(invoice.createdAt), pageWidth - 20, 48, { align: 'right' });

  if(invoice.dueDate) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
    doc.text("Échéance:", pageWidth - 85, 54);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text(formatDate(invoice.dueDate), pageWidth - 20, 54, { align: 'right' });
  }

  // Client Section
  y = 75;
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(15, y, 95, 7, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text("FACTURÉ À", 20, y + 5);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, y + 7, 95, 30, 'FD');
  
  let cy = y + 14;
  doc.setFontSize(11);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text(invoice.client?.name || '', 20, cy); cy += 6;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
  if(invoice.client?.address) { doc.text(invoice.client.address, 20, cy); cy += 5; }
  if(invoice.client?.city) { doc.text(`${invoice.client.city} ${invoice.client.country? ', '+invoice.client.country : ''}`, 20, cy); cy += 5; }
  if(invoice.client?.phone) { doc.text(`Tél: ${invoice.client.phone}`, 20, cy); cy += 5; }
  if(invoice.client?.email) { doc.text(`Email: ${invoice.client.email}`, 20, cy); }

  // Items Table
  const items = JSON.parse(invoice.items || '[]');
  const tableData = items.map((item: any) => [
     item.description,
     item.quantity,
     formatCurrency(item.unitPrice).replace(' FCFA', ''),
     formatCurrency(item.quantity * item.unitPrice).replace(' FCFA', '')
  ]);

  autoTable(doc, {
    startY: 120,
    head: [['Description', 'Qté', 'Prix Unitaire', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
       fillColor: primaryRgb,
       textColor: [255, 255, 255],
       fontStyle: 'bold',
       fontSize: 10,
       halign: 'center'
    },
    bodyStyles: {
       textColor: [30, 41, 59],
       fontSize: 10,
       cellPadding: 7,
       lineColor: [226, 232, 240]
    },
    alternateRowStyles: {
       fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 85, halign: 'left' },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold', textColor: primaryRgb }
    },
    margin: { left: 15, right: 15 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;

  // Totals Area (Right)
  const totalBoxWidth = 85;
  const rightX = pageWidth - 15 - totalBoxWidth;
  const valX = pageWidth - 20;
  let ty = finalY;

  // A subtle grey box for totals
  doc.setFillColor(lightBgRgb[0], lightBgRgb[1], lightBgRgb[2]);
  doc.rect(rightX - 5, ty - 5, totalBoxWidth + 5, 45, 'F');

  doc.setFontSize(10);
  doc.setTextColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
  doc.text("Sous-total HT", rightX, ty);
  doc.text(formatCurrency(invoice.subtotal), valX, ty, { align: 'right' });
  ty += 7;

  if (invoice.taxRate > 0) {
     doc.text(`TVA (${invoice.taxRate}%)`, rightX, ty);
     doc.text(formatCurrency(invoice.taxAmount), valX, ty, { align: 'right' });
     ty += 7;
  }

  if (invoice.discount > 0) {
     doc.text("Remise", rightX, ty);
     doc.text(`-${formatCurrency(invoice.discount)}`, valX, ty, { align: 'right' });
     ty += 7;
  }

  // Grand Total Net
  ty += 4;
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(rightX - 5, ty, totalBoxWidth + 5, 12, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text("NET À PAYER TTC", rightX, ty + 8);
  doc.setFontSize(14);
  doc.text(formatCurrency(invoice.total), valX, ty + 8.5, { align: 'right' });

  // Notes & Bank info (Left side)
  let leftY = finalY - 5;
  
  if (invoice.notes) {
     doc.setFontSize(10);
     doc.setFont('helvetica', 'bold');
     doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
     doc.text("Conditions & Notes", 15, leftY);
     doc.setFontSize(9);
     doc.setFont('helvetica', 'normal');
     doc.setTextColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
     const noteLines = doc.splitTextToSize(invoice.notes, 85);
     doc.text(noteLines, 15, leftY + 6);
     leftY += (noteLines.length * 5) + 12;
  }

  if (settings.bankName || settings.bankAccount) {
     doc.setFontSize(10);
     doc.setFont('helvetica', 'bold');
     doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
     doc.text("Informations bancaires", 15, leftY);
     doc.setFontSize(9);
     doc.setFont('helvetica', 'normal');
     doc.setTextColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
     if(settings.bankName) { doc.text(`Banque : ${settings.bankName}`, 15, leftY + 6); }
     if(settings.bankAccount) { doc.text(`Code RIB / IBAN : ${settings.bankAccount}`, 15, leftY + 11); }
  }

  // Signatures
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text("La Direction", pageWidth - 45, pageHeight - 55, { align: 'center' });

  if (settings.stamp || settings.signature) {
     if(settings.stamp) {
        const stampFormat = settings.stamp.includes('png') ? 'PNG' : 'JPEG';
        doc.addImage(settings.stamp, stampFormat, pageWidth - 80, pageHeight - 48, 28, 28);
     }
     if(settings.signature) {
        const sigFormat = settings.signature.includes('png') ? 'PNG' : 'JPEG';
        doc.addImage(settings.signature, sigFormat, pageWidth - 50, pageHeight - 45, 30, 20);
     }
  }

  // Footer styling
  doc.setFillColor(lightBgRgb[0], lightBgRgb[1], lightBgRgb[2]);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
  doc.text(`${settings.companyName || 'FacturaPro'} - Document généré avec soin.`, pageWidth / 2, pageHeight - 6, { align: 'center' });

  doc.save(`${invoice.number}.pdf`);
}

export function generateReceiptPDF(receipt: any, settings: any) {
  const doc = new jsPDF({ format: 'a4', orientation: 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const primaryRgb = hexToRgb(settings?.primaryColor);
  const secondaryRgb: [number, number, number] = [71, 85, 105];
  const lightBgRgb: [number, number, number] = [248, 250, 252];
  
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 0, pageWidth, 5, 'F');

  let y = 20;

  if (settings.logo) {
      const format = settings.logo.includes('png') ? 'PNG' : 'JPEG';
      doc.addImage(settings.logo, format, 15, y, 45, 15);
      y += 20;
  } else {
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      doc.text((settings.companyName || 'ENTREPRISE').toUpperCase(), 15, y + 6);
      y += 15;
  }
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
  if(settings.address) { doc.text(settings.address, 15, y); y += 4; }
  
  let contactInfo = [];
  if(settings.phone) contactInfo.push(settings.phone);
  if(settings.email) contactInfo.push(settings.email);
  if(contactInfo.length) { doc.text(contactInfo.join('  •  '), 15, y); }

  doc.setFillColor(lightBgRgb[0], lightBgRgb[1], lightBgRgb[2]);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(pageWidth - 90, 20, 75, 30, 2, 2, 'FD');
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text("REÇU", pageWidth - 52, 30, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
  doc.text("N° :", pageWidth - 85, 38);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text(receipt.number, pageWidth - 20, 38, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
  doc.text("Date :", pageWidth - 85, 44);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text(formatDate(receipt.paymentDate), pageWidth - 20, 44, { align: 'right' });


  y = 75;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
  doc.text("Maison confirme avoir reçu de :", 15, y);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text(receipt.client?.name || '', 15, y + 8);

  const amountY = y + 20;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.roundedRect(15, amountY, pageWidth - 30, 40, 3, 3, 'FD');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
  doc.text("La somme de :", 25, amountY + 12);
  
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text(formatCurrency(receipt.amount), 25, amountY + 28);

  let detailY = amountY + 55;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  
  const paymentMethodStr = receipt.paymentMethod?.replace('_', ' ').replace(/\b\w/g, (l:any) => l.toUpperCase());
  doc.text(`Méthode : ${paymentMethodStr}`, 15, detailY);
  detailY += 8;
  
  if (receipt.invoice) {
    doc.text(`Référence Facture : ${receipt.invoice.number}`, 15, detailY);
    detailY += 8;
  }
  
  if (receipt.notes) {
     doc.setTextColor(secondaryRgb[0], secondaryRgb[1], secondaryRgb[2]);
     doc.text(`Notes : ${receipt.notes}`, 15, detailY);
  }

  if (settings.stamp || settings.signature) {
     if(settings.stamp) {
        const stampFormat = settings.stamp.includes('png') ? 'PNG' : 'JPEG';
        doc.addImage(settings.stamp, stampFormat, pageWidth - 80, pageHeight - 50, 25, 25);
     }
     if(settings.signature) {
        const sigFormat = settings.signature.includes('png') ? 'PNG' : 'JPEG';
        doc.addImage(settings.signature, sigFormat, pageWidth - 45, pageHeight - 48, 30, 20);
     }
  }

  doc.save(`${receipt.number}.pdf`);
}

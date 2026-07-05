/**
 * Opens a new window with the given HTML content and triggers the browser's
 * native Print-to-PDF dialog — vector quality, no screenshot artifacts.
 */
export async function exportHTMLToPDF(htmlContent: string, _filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      reject(new Error('Impossible d\'ouvrir la fenêtre d\'impression. Autorisez les popups pour ce site.'));
      return;
    }

    printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @media print {
      body { margin: 0; }
      @page { margin: 0; size: A4; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
${htmlContent}
<div class="no-print" style="text-align:center;padding:20px;background:#f1f5f9;border-top:1px solid #e2e8f0;">
  <p style="color:#64748b;font-size:13px;margin-bottom:12px;">Cliquez sur <strong>Imprimer</strong> et choisissez <strong>"Enregistrer en PDF"</strong> comme destination.</p>
  <button onclick="window.print()" style="background:#0f172a;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">🖨 Imprimer / Sauvegarder en PDF</button>
</div>
</body>
</html>`);

    printWindow.document.close();
    printWindow.addEventListener('afterprint', () => {
      printWindow.close();
      resolve();
    });
    resolve();
  });
}

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generatePDFBase64(htmlContent: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '210mm';
      container.style.background = '#fff';
      container.style.color = '#000';
      
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = htmlContent;
      
      const style = document.createElement('style');
      style.innerHTML = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'); * { font-family: 'Inter', sans-serif; }`;
      contentDiv.appendChild(style);
      
      container.appendChild(contentDiv);
      document.body.appendChild(container);
      
      // Wait for fonts to load
      await new Promise(r => setTimeout(r, 800));
      
      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      document.body.removeChild(container);
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      const base64 = pdf.output('datauristring');
      resolve(base64);
    } catch (err) {
      reject(err);
    }
  });
}

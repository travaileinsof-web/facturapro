import { formatCurrency, formatDate, escapeHTML, safeJSONParse } from './store';

// ─── Color Helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex: string) {
  if (!hex) return { r: 15, g: 23, b: 42 };
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 15, g: 23, b: 42 };
}

function lighten(hex: string, pct = 0.93): string {
  const { r, g, b } = hexToRgb(hex);
  const l = (c: number) => Math.round(c + (255 - c) * pct);
  return `rgb(${l(r)},${l(g)},${l(b)})`;
}

function alpha(hex: string, a: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// ─── Invoice HTML Template ────────────────────────────────────────────────────

export function buildInvoiceHTML(invoice: any, settings: any): string {
  const companyInfo = invoice.company || settings;
  const color = companyInfo?.primaryColor || '#B38E36';
  const light = lighten(color, 0.96);
  const items: any[] = safeJSONParse(invoice.items);

  let documentTitle = 'FACTURE';
  if (invoice.type === 'devis') documentTitle = 'DEVIS';
  if (invoice.type === 'proforma') documentTitle = 'FACTURE PROFORMA';

  const logoHTML = companyInfo?.logo
    ? `<img src="${escapeHTML(companyInfo.logo)}" alt="logo" style="max-height:80px;max-width:200px;object-fit:contain;display:block;" />`
    : `<div style="font-size:24px;font-weight:900;color:#111;letter-spacing:-0.5px;line-height:1;">${escapeHTML(companyInfo?.companyName || 'ENTREPRISE')}</div>`;

  const itemRows = items.map((item, i) => `
    <tr>
      <td style="padding:20px 20px; border-bottom:1px solid #f1f5f9; vertical-align:top;">
        <div style="font-size:13px; font-weight:800; color:#111; margin-bottom:6px;">${escapeHTML(item.service || item.description || 'Prestation')}</div>
        <div style="font-size:11px; color:#64748b; line-height:1.6;">${escapeHTML(item.description)}</div>
      </td>
      <td style="padding:20px 20px; border-bottom:1px solid #f1f5f9; text-align:center; font-size:12px; color:#475569; vertical-align:top; font-weight:600;">${item.quantity || 1}</td>
      <td style="padding:20px 20px; border-bottom:1px solid #f1f5f9; text-align:right; font-size:12px; color:#475569; vertical-align:top; font-weight:600;">${formatCurrency(item.unitPrice || item.price || 0)}</td>
      <td style="padding:20px 20px; border-bottom:1px solid #f1f5f9; text-align:right; font-size:13px; font-weight:800; color:#111; vertical-align:top;">${formatCurrency((item.quantity || 1) * (item.unitPrice || item.price || 0))}</td>
    </tr>`).join('');

  const taxRow = invoice.taxRate > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:8px 0;">
      <span style="color:#64748b;font-size:12px;">TVA (${invoice.taxRate}%)</span>
      <span style="color:#111;font-size:12px;font-weight:600;">${formatCurrency(invoice.taxAmount)}</span>
    </div>` : '';

  const discountRow = invoice.discount > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:8px 0;">
      <span style="color:#ef4444;font-size:12px;">Remise</span>
      <span style="color:#ef4444;font-size:12px;font-weight:600;">-${formatCurrency(invoice.discount)}</span>
    </div>` : '';

  const withholdingRow = invoice.vatWithholdingApplied && invoice.taxAmount ? `
    <div style="display:flex;justify-content:space-between;padding:8px 0;">
      <span style="color:#64748b;font-size:12px;">Retenue à la source (50% TVA)</span>
      <span style="color:#111;font-size:12px;font-weight:600;">-${formatCurrency(invoice.taxAmount / 2)}</span>
    </div>` : '';

  const vatExemptRow = invoice.vatExemptReason ? `
    <div style="margin-top:12px;padding:8px 12px;background:#f8fafc;border-left:2px solid ${color};font-size:11px;color:#475569;line-height:1.4;">
      <strong>Exonération TVA :</strong> ${escapeHTML(invoice.vatExemptReason)}
    </div>` : '';

  const notesBlock = invoice.notes ? `
    <div style="margin-bottom:24px;">
      <div style="font-size:10px; font-weight:800; color:${color}; text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid ${color}; padding-bottom:4px; margin-bottom:8px; display:inline-block;">Notes & Conditions</div>
      <div style="font-size:11px; color:#475569; line-height:1.6; white-space:pre-wrap;">${escapeHTML(invoice.notes)}</div>
    </div>` : '';

  const bankBlock = (companyInfo?.bankName || companyInfo?.bankAccount) ? `
    <div style="margin-bottom:24px;">
      <div style="font-size:10px; font-weight:800; color:${color}; text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid ${color}; padding-bottom:4px; margin-bottom:8px; display:inline-block;">Coordonnées Bancaires</div>
      ${companyInfo.bankName ? `<div style="font-size:12px; font-weight:700; color:#1e293b; margin-bottom:2px;">${escapeHTML(companyInfo.bankName)}</div>` : ''}
      ${companyInfo.bankAccount ? `<div style="font-size:12px; color:#475569; font-family:monospace;">${escapeHTML(companyInfo.bankAccount)}</div>` : ''}
    </div>` : '';

  const stampImg = companyInfo?.stamp
    ? `<img src="${companyInfo.stamp}" alt="tampon" style="width:100px;height:100px;object-fit:contain;" />`
    : '';
  const sigImg = companyInfo?.signature
    ? `<img src="${companyInfo.signature}" alt="signature" style="width:160px;height:70px;object-fit:contain;" />`
    : '';

  const sigSection = (companyInfo?.stamp || companyInfo?.signature) ? `
    <div style="text-align:right; display:inline-block;">
      <div style="font-size:10px; font-weight:800; color:${color}; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Signature & Cachet</div>
      <div style="display:flex; justify-content:flex-end; align-items:center; gap:16px;">
        ${stampImg}
        ${sigImg}
      </div>
    </div>` : `
    <div style="text-align:right; display:inline-block;">
      <div style="font-size:10px; font-weight:800; color:${color}; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Signature & Cachet</div>
      <div style="height:70px;width:160px;border:1px dashed #cbd5e1;border-radius:4px;margin-left:auto;"></div>
    </div>`;

  const contactInfo = [companyInfo?.phone, companyInfo?.email, companyInfo?.website].filter(Boolean).join('<br/>');
  
  // Rendu de la facture
  return `
<div style="font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;background:#fefdfb;width:794px;min-height:1123px;margin:0 auto;color:#1e293b;position:relative;box-sizing:border-box;">
  
  <!-- Thick Colored Border on the Left -->
  <div style="position:absolute;top:60px;bottom:60px;left:0;width:8px;background:${color};"></div>

  <div style="padding:60px 50px 60px 70px;">
    
    <!-- Top Section: Title & Company Info -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:60px;">
      <div style="flex:1;">
        <div style="font-family:'Times New Roman', Times, serif;font-size:42px;font-weight:700;color:#111;line-height:1.05;letter-spacing:-0.5px;text-transform:uppercase;width:70%;">
          ${documentTitle.replace(' ', '<br/>')}
        </div>
        <div style="font-size:11px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1px;margin-top:12px;width:80%;">
          ${escapeHTML(companyInfo?.slogan || '')}
        </div>
      </div>
      <div style="text-align:right; flex:1;">
        <div style="margin-bottom:12px;display:flex;justify-content:flex-end;">
          ${logoHTML}
        </div>
        <div style="font-size:11px;color:#64748b;line-height:1.7;">
          ${companyInfo?.legalForm ? `<div style="font-weight:600;color:#1e293b;">${escapeHTML(companyInfo.legalForm)}</div>` : ''}
          ${companyInfo?.address ? `<div style="color:#475569;">${escapeHTML(companyInfo.address)}</div>` : ''}
          ${contactInfo ? `<div>${contactInfo}</div>` : ''}
          <div style="margin-top:6px;padding-top:6px;border-top:1px solid #e2e8f0;display:inline-block;">
            ${companyInfo?.taxId ? `<div><strong>NIF :</strong> ${escapeHTML(companyInfo.taxId)}</div>` : ''}
            ${companyInfo?.rccm ? `<div><strong>RCCM :</strong> ${escapeHTML(companyInfo.rccm)}</div>` : ''}
            ${companyInfo?.taxRegime ? `<div><strong>Régime :</strong> ${escapeHTML(companyInfo.taxRegime)}</div>` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- Middle Section: Client & Invoice Info -->
    <div style="display:flex;justify-content:space-between;margin-bottom:50px;">
      
      <!-- Facturé à -->
      <div style="flex:1;">
        <div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid ${color};padding-bottom:4px;margin-bottom:16px;display:inline-block;">
          FACTURÉ À
        </div>
        <div style="font-size:16px;font-weight:800;color:#111;margin-bottom:6px;">
          ${escapeHTML(invoice.client?.name || '—')}
        </div>
        <div style="font-size:12px;color:#475569;line-height:1.6;">
          ${invoice.client?.address ? `${escapeHTML(invoice.client.address)}<br/>` : ''}
          ${invoice.client?.city ? `${escapeHTML(invoice.client.city)}${invoice.client?.country ? ', ' + escapeHTML(invoice.client.country) : ''}<br/>` : ''}
          ${invoice.client?.phone ? `${escapeHTML(invoice.client.phone)}<br/>` : ''}
          ${invoice.client?.email ? `${escapeHTML(invoice.client.email)}<br/>` : ''}
          ${invoice.client?.nif ? `<br/><strong>NIF :</strong> ${escapeHTML(invoice.client.nif)}` : ''}
          ${invoice.client?.rccm ? `<br/><strong>RCCM :</strong> ${escapeHTML(invoice.client.rccm)}` : ''}
        </div>
      </div>

      <!-- Informations Facture -->
      <div style="flex:1; margin-left:60px;">
        <div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid ${color};padding-bottom:4px;margin-bottom:16px;display:inline-block;">
          INFORMATIONS FACTURE
        </div>
        <table style="width:100%;font-size:12px;color:#475569;">
          <tr>
            <td style="padding-bottom:10px;">Référence :</td>
            <td style="padding-bottom:10px;font-weight:800;color:#111;text-align:right;">${escapeHTML(invoice.number)}</td>
          </tr>
          <tr>
            <td style="padding-bottom:10px;">Date :</td>
            <td style="padding-bottom:10px;font-weight:800;color:#111;text-align:right;">${formatDate(invoice.createdAt)}</td>
          </tr>
          ${invoice.dueDate ? `
          <tr>
            <td style="padding-bottom:10px;">Échéance :</td>
            <td style="padding-bottom:10px;font-weight:800;color:${color};text-align:right;">${formatDate(invoice.dueDate)}</td>
          </tr>` : ''}
          ${invoice.validityDate && invoice.type !== 'facture' ? `
          <tr>
            <td style="padding-bottom:10px;">Validité :</td>
            <td style="padding-bottom:10px;font-weight:800;color:${color};text-align:right;">${formatDate(invoice.validityDate)}</td>
          </tr>` : ''}
          ${invoice.sourceDocumentId ? `
          <tr>
            <td style="padding-bottom:10px;">Document lié :</td>
            <td style="padding-bottom:10px;font-weight:800;color:#111;text-align:right;">${escapeHTML(invoice.sourceDocumentId)}</td>
          </tr>` : ''}
          ${invoice.paymentTerms ? `
          <tr>
            <td style="padding-bottom:10px;">Paiement :</td>
            <td style="padding-bottom:10px;font-weight:600;color:#475569;text-align:right;">${escapeHTML(invoice.paymentTerms)}</td>
          </tr>` : ''}
        </table>
      </div>

    </div>

    <!-- Table Section -->
    <div style="margin-bottom:40px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:${light};">
            <th style="padding:16px 20px;font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;text-align:left;border-bottom:2px solid ${color};width:50%;">DESCRIPTION DES PRESTATIONS</th>
            <th style="padding:16px 20px;font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;text-align:center;border-bottom:2px solid ${color};">QTÉ</th>
            <th style="padding:16px 20px;font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;text-align:right;border-bottom:2px solid ${color};">PRIX U.</th>
            <th style="padding:16px 20px;font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;text-align:right;border-bottom:2px solid ${color};">MONTANT</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>

    <!-- Totals & Payments Section -->
    <div style="display:flex;justify-content:flex-end;margin-bottom:40px;">
      <div style="width:360px;">
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;">
          <span style="color:#64748b;font-size:12px;">Sous-total HT</span>
          <span style="color:#111;font-size:12px;font-weight:600;">${formatCurrency(invoice.subtotal)}</span>
        </div>
        ${taxRow}
        ${discountRow}
        ${withholdingRow}
        
        <div style="border-top:1px solid #111;padding-top:12px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;font-weight:800;color:#111;text-transform:uppercase;letter-spacing:0.5px;">TOTAL FACTURE</span>
          <span style="font-size:16px;font-weight:900;color:#111;letter-spacing:-0.5px;">${formatCurrency(invoice.vatWithholdingApplied && invoice.taxAmount ? invoice.total - (invoice.taxAmount / 2) : invoice.total)}</span>
        </div>
        ${vatExemptRow}

        ${(invoice.receipts && invoice.receipts.length > 0) ? `
        <div style="margin-top:20px;background:#f8fafc;padding:12px 16px;border-left:2px solid #94a3b8;">
          <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Acomptes / Paiements effectués</div>
          ${invoice.receipts.map((r: any) => `
            <div style="display:flex;justify-content:space-between;font-size:11px;color:#475569;margin-bottom:4px;">
              <span>Reçu ${escapeHTML(r.number)}</span>
              <span style="color:#15803d;font-weight:700;">- ${formatCurrency(r.amount)}</span>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:12px;padding:12px 16px;background:${color};display:flex;justify-content:space-between;align-items:center;color:#fff;">
          <span style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;">RESTE À PAYER</span>
          <span style="font-size:18px;font-weight:900;letter-spacing:-0.5px;">${formatCurrency(invoice.amountRemaining !== undefined ? invoice.amountRemaining : invoice.total)}</span>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Notes & Signature -->
    <div style="display:flex;justify-content:space-between;align-items:flex-end;">
      <div style="flex:1; padding-right:40px;">
        ${notesBlock}
        ${bankBlock}
      </div>
      <div>
        ${sigSection}
      </div>
    </div>

  </div>
</div>`;
}


// ─── Receipt HTML Template ────────────────────────────────────────────────────

export function buildReceiptHTML(receipt: any, settings: any): string {
  const companyInfo = receipt.company || settings;
  const color = companyInfo?.primaryColor || '#B38E36';
  const light = lighten(color, 0.96);

  const logoHTML = companyInfo?.logo
    ? `<img src="${escapeHTML(companyInfo.logo)}" alt="logo" style="max-height:80px;max-width:200px;object-fit:contain;display:block;" />`
    : `<div style="font-size:24px;font-weight:900;color:#111;letter-spacing:-0.5px;line-height:1;">${escapeHTML(companyInfo?.companyName || 'ENTREPRISE')}</div>`;

  const paymentMethod = receipt.paymentMethod?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || '—';

  const stampImg = companyInfo?.stamp
    ? `<img src="${companyInfo.stamp}" alt="tampon" style="width:100px;height:100px;object-fit:contain;" />`
    : '';
  const sigImg = companyInfo?.signature
    ? `<img src="${companyInfo.signature}" alt="signature" style="width:160px;height:70px;object-fit:contain;" />`
    : '';

  const sigSection = (companyInfo?.stamp || companyInfo?.signature) ? `
    <div style="text-align:right; display:inline-block;">
      <div style="font-size:10px; font-weight:800; color:${color}; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Signature & Cachet</div>
      <div style="display:flex; justify-content:flex-end; align-items:center; gap:16px;">
        ${stampImg}
        ${sigImg}
      </div>
    </div>` : `
    <div style="text-align:right; display:inline-block;">
      <div style="font-size:10px; font-weight:800; color:${color}; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">Signature & Cachet</div>
      <div style="height:70px;width:160px;border:1px dashed #cbd5e1;border-radius:4px;margin-left:auto;"></div>
    </div>`;

  const contactInfo = [companyInfo?.phone, companyInfo?.email, companyInfo?.website].filter(Boolean).join('<br/>');
  
  const parsedInvoiceItems = safeJSONParse(receipt.invoice?.items);
  const itemRows = Array.isArray(parsedInvoiceItems) ? parsedInvoiceItems.map((item: any) => `
    <tr>
      <td style="padding:16px 20px; border-bottom:1px solid #f1f5f9; vertical-align:top;">
        <div style="font-size:12px; font-weight:800; color:#111;">${escapeHTML(item.description || item.service || '—')}</div>
      </td>
      <td style="padding:16px 20px; border-bottom:1px solid #f1f5f9; text-align:right; font-size:12px; font-weight:700; color:#111; vertical-align:top;">
        ${formatCurrency(item.total || item.amount || (item.quantity * item.unitPrice) || 0)}
      </td>
    </tr>
  `).join('') : '';

  return `
<div style="font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;background:#fefdfb;width:794px;min-height:1123px;margin:0 auto;color:#1e293b;position:relative;box-sizing:border-box;">
  
  <!-- Thick Colored Border on the Left -->
  <div style="position:absolute;top:60px;bottom:60px;left:0;width:8px;background:${color};"></div>

  <div style="padding:60px 50px 60px 70px;">
    
    <!-- Top Section: Title & Company Info -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:60px;">
      <div style="flex:1;">
        <div style="font-family:'Times New Roman', Times, serif;font-size:42px;font-weight:700;color:#111;line-height:1.05;letter-spacing:-0.5px;text-transform:uppercase;width:70%;">
          REÇU DE<br/>PAIEMENT
        </div>
        <div style="font-size:11px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1px;margin-top:12px;width:80%;">
          ${escapeHTML(companyInfo?.slogan || 'QUITTANCE OFFICIELLE')}
        </div>
      </div>
      <div style="text-align:right; flex:1;">
        <div style="margin-bottom:12px;display:flex;justify-content:flex-end;">
          ${logoHTML}
        </div>
        <div style="font-size:11px;color:#64748b;line-height:1.7;">
          ${companyInfo?.legalForm ? `<div style="font-weight:600;color:#1e293b;">${escapeHTML(companyInfo.legalForm)}</div>` : ''}
          ${companyInfo?.address ? `<div style="color:#475569;">${escapeHTML(companyInfo.address)}</div>` : ''}
          ${contactInfo ? `<div>${contactInfo}</div>` : ''}
          <div style="margin-top:6px;padding-top:6px;border-top:1px solid #e2e8f0;display:inline-block;">
            ${companyInfo?.taxId ? `<div><strong>NIF :</strong> ${escapeHTML(companyInfo.taxId)}</div>` : ''}
            ${companyInfo?.rccm ? `<div><strong>RCCM :</strong> ${escapeHTML(companyInfo.rccm)}</div>` : ''}
            ${companyInfo?.taxRegime ? `<div><strong>Régime :</strong> ${escapeHTML(companyInfo.taxRegime)}</div>` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- Middle Section: Client & Receipt Info -->
    <div style="display:flex;justify-content:space-between;margin-bottom:50px;">
      
      <!-- Reçu de -->
      <div style="flex:1;">
        <div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid ${color};padding-bottom:4px;margin-bottom:16px;display:inline-block;">
          REÇU DE LA PART DE
        </div>
        <div style="font-size:16px;font-weight:800;color:#111;margin-bottom:6px;">
          ${escapeHTML(receipt.client?.name || '—')}
        </div>
        <div style="font-size:12px;color:#475569;line-height:1.6;">
          ${receipt.client?.address ? `${escapeHTML(receipt.client.address)}<br/>` : ''}
          ${receipt.client?.city ? `${escapeHTML(receipt.client.city)}${receipt.client?.country ? ', ' + escapeHTML(receipt.client.country) : ''}<br/>` : ''}
          ${receipt.client?.phone ? `${escapeHTML(receipt.client.phone)}<br/>` : ''}
          ${receipt.client?.email ? `${escapeHTML(receipt.client.email)}<br/>` : ''}
          ${receipt.client?.nif ? `<br/><strong>NIF :</strong> ${escapeHTML(receipt.client.nif)}` : ''}
          ${receipt.client?.rccm ? `<br/><strong>RCCM :</strong> ${escapeHTML(receipt.client.rccm)}` : ''}
        </div>
      </div>

      <!-- Informations Reçu -->
      <div style="flex:1; margin-left:60px;">
        <div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid ${color};padding-bottom:4px;margin-bottom:16px;display:inline-block;">
          INFORMATIONS DU REÇU
        </div>
        <table style="width:100%;font-size:12px;color:#475569;">
          <tr>
            <td style="padding-bottom:10px;">Référence :</td>
            <td style="padding-bottom:10px;font-weight:800;color:#111;text-align:right;">${escapeHTML(receipt.number)}</td>
          </tr>
          <tr>
            <td style="padding-bottom:10px;">Date du paiement :</td>
            <td style="padding-bottom:10px;font-weight:800;color:#111;text-align:right;">${formatDate(receipt.paymentDate)}</td>
          </tr>
          <tr>
            <td style="padding-bottom:10px;">Moyen de paiement :</td>
            <td style="padding-bottom:10px;font-weight:800;color:${color};text-align:right;">${paymentMethod}</td>
          </tr>
          ${receipt.receivedBy ? `
          <tr>
            <td style="padding-bottom:10px;">Reçu par :</td>
            <td style="padding-bottom:10px;font-weight:600;color:#475569;text-align:right;">${escapeHTML(receipt.receivedBy)}</td>
          </tr>` : ''}
        </table>
      </div>

    </div>

    <!-- Amount Section (Premium Block) -->
    <div style="margin-bottom:50px;">
       <div style="background:${light};border:1px solid ${alpha(color, 0.15)};padding:36px 48px;display:flex;align-items:center;justify-content:space-between;position:relative;box-shadow:0 4px 20px rgba(0,0,0,0.02);">
          <div style="position:absolute;top:0;left:0;width:6px;height:100%;background:${color};"></div>
          
          <div>
            <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">MONTANT REÇU</div>
            <div style="font-size:46px;font-weight:900;color:#111;letter-spacing:-1.5px;line-height:1;font-family:monospace;">${formatCurrency(receipt.amount)}</div>
          </div>
          <div style="text-align:right;">
             <div style="width:70px;height:70px;border-radius:50%;background:${alpha(color, 0.1)};display:flex;align-items:center;justify-content:center;color:${color};font-size:32px;font-weight:900;margin-left:auto;">✓</div>
             <div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;margin-top:12px;">PAIEMENT VALIDÉ</div>
          </div>
       </div>
    </div>

    <!-- Services Details (If linked to invoice) -->
    ${receipt.invoice ? `
    <div style="margin-bottom:50px;">
      <div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid ${color};padding-bottom:4px;margin-bottom:16px;display:inline-block;">
        SERVICES CONCERNÉS (FACTURE ${escapeHTML(receipt.invoice.number)})
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:${light};">
            <th style="padding:16px 20px;font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;text-align:left;border-bottom:2px solid ${color};">DESCRIPTION</th>
            <th style="padding:16px 20px;font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;text-align:right;border-bottom:2px solid ${color};">MONTANT FACTURÉ</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
      <div style="display:flex;justify-content:flex-end;margin-top:24px;">
        <div style="width:360px;">
           <div style="display:flex;justify-content:space-between;font-size:12px;color:#475569;margin-bottom:10px;">
              <span>Total de la facture</span>
              <span style="font-weight:700;color:#111;">${formatCurrency(receipt.invoice.total)}</span>
           </div>
           ${(receipt.invoice.amountPaid - receipt.amount) > 0 ? `
           <div style="display:flex;justify-content:space-between;font-size:12px;color:#475569;margin-bottom:10px;">
              <span>Déjà payé</span>
              <span style="font-weight:700;color:#111;">- ${formatCurrency(receipt.invoice.amountPaid - receipt.amount)}</span>
           </div>
           ` : ''}
           <div style="display:flex;justify-content:space-between;font-size:12px;color:#475569;margin-bottom:12px;">
              <span>Ce paiement</span>
              <span style="font-weight:700;color:#15803d;">- ${formatCurrency(receipt.amount)}</span>
           </div>
           <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #111;padding-top:16px;margin-top:8px;">
              <span style="font-size:12px;font-weight:800;color:#111;text-transform:uppercase;letter-spacing:0.5px;">RESTE À PAYER</span>
              <span style="font-size:16px;font-weight:900;color:${receipt.invoice.amountRemaining > 0 ? '#ef4444' : '#10b981'};">${formatCurrency(receipt.invoice.amountRemaining)}</span>
           </div>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- Notes & Signature -->
    <div style="display:flex;justify-content:space-between;align-items:flex-end;">
      <div style="flex:1; padding-right:40px;">
        ${receipt.notes ? `
        <div style="margin-bottom:24px;">
          <div style="font-size:10px; font-weight:800; color:${color}; text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid ${color}; padding-bottom:4px; margin-bottom:8px; display:inline-block;">Notes</div>
          <div style="font-size:11px; color:#475569; line-height:1.6; white-space:pre-wrap;">${escapeHTML(receipt.notes)}</div>
        </div>` : ''}
      </div>
      <div>
        ${sigSection}
      </div>
    </div>

  </div>
</div>`;
}

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
          ${companyInfo?.address ? `<div style="color:#475569;">${escapeHTML(companyInfo.address)}</div>` : ''}
          ${contactInfo ? `<div>${contactInfo}</div>` : ''}
          ${companyInfo?.taxId ? `<div style="margin-top:4px;">NIF/RCCM : ${escapeHTML(companyInfo.taxId)}</div>` : ''}
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
          ${invoice.client?.email ? `${escapeHTML(invoice.client.email)}` : ''}
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
        
        <div style="border-top:1px solid #111;padding-top:12px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;font-weight:800;color:#111;text-transform:uppercase;letter-spacing:0.5px;">TOTAL FACTURE</span>
          <span style="font-size:16px;font-weight:900;color:#111;letter-spacing:-0.5px;">${formatCurrency(invoice.total)}</span>
        </div>

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
  const secondary = companyInfo?.secondaryColor || color;
  const accent = companyInfo?.accentColor || color;
  const light = lighten(color, 0.96);
  const mid = lighten(color, 0.88);

  const logoHTML = companyInfo?.logo
    ? `<img src="${escapeHTML(companyInfo.logo)}" alt="logo" style="max-height:80px;max-width:240px;object-fit:contain;display:block;" />`
    : `<div style="font-size:30px;font-weight:900;color:#fff;letter-spacing:-1px;line-height:1;">${escapeHTML(companyInfo?.companyName || 'ENTREPRISE').toUpperCase()}</div>`;

  const paymentMethod = receipt.paymentMethod?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || '—';

  const stampImg = companyInfo?.stamp
    ? `<img src="${companyInfo.stamp}" alt="tampon" style="width:120px;height:120px;object-fit:contain;" />`
    : '';
  const sigImg = companyInfo?.signature
    ? `<img src="${companyInfo.signature}" alt="signature" style="width:200px;height:90px;object-fit:contain;" />`
    : '';

  const sigSection = (companyInfo?.stamp || companyInfo?.signature) ? `
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;">
      <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;">Signature & Cachet</div>
      <div style="display:flex;align-items:center;gap:16px;">
        ${stampImg}
        ${sigImg}
      </div>
      <div style="width:200px;border-top:2px solid ${color};padding-top:10px;font-size:12px;font-weight:700;color:${color};">La Direction</div>
    </div>` : `
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;">
      <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;">Signature & Cachet</div>
      <div style="height:90px;width:220px;border:2px dashed #e2e8f0;border-radius:10px;"></div>
      <div style="width:200px;border-top:2px solid ${color};padding-top:10px;font-size:12px;font-weight:700;color:${color};">La Direction</div>
    </div>`;

  const contactInfo = [companyInfo?.phone, companyInfo?.email].filter(Boolean).join('  ·  ');
  const invoiceRef = receipt.invoice ? `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9;">
      <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Réf. Facture</span>
      <span style="font-size:13px;font-weight:700;color:${color};font-family:monospace;">${escapeHTML(receipt.invoice.number)}</span>
    </div>` : '';
  const notesRef = receipt.notes ? `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:12px 0;gap:20px;">
      <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;white-space:nowrap;">Notes</span>
      <span style="font-size:13px;color:#475569;text-align:right;line-height:1.5;white-space:pre-wrap;">${escapeHTML(receipt.notes)}</span>
    </div>` : '';

  const parsedInvoiceItems = safeJSONParse(receipt.invoice?.items);
  const itemRows = Array.isArray(parsedInvoiceItems) ? parsedInvoiceItems.map((item: any) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:${color};font-size:13px;">${escapeHTML(item.description || item.service || '—')}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:center;color:#64748b;font-size:13px;">${item.quantity || 1}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;color:#64748b;font-size:13px;">${formatCurrency(item.price || item.unitPrice || 0)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;color:#475569;font-size:13px;font-weight:500;">${formatCurrency(item.total || item.amount || (item.quantity * item.unitPrice) || 0)}</td>
    </tr>
  `).join('') : '';

  const serviceBlock = receipt.invoice ? `
    <div style="background:#f8fafc;border-radius:14px;padding:28px 32px;margin-bottom:40px;">
      <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px;">Service / Prestation concerné</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:${secondary};">
            <th style="padding:10px;text-align:left;font-size:10px;color:#ffffff;text-transform:uppercase;">Description</th>
            <th style="padding:10px;text-align:center;font-size:10px;color:#ffffff;text-transform:uppercase;">Qté</th>
            <th style="padding:10px;text-align:right;font-size:10px;color:#ffffff;text-transform:uppercase;">Prix U.</th>
            <th style="padding:10px;text-align:right;font-size:10px;color:#ffffff;text-transform:uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
      <div style="display:flex;flex-direction:column;gap:10px;border-top:2px solid #e2e8f0;padding-top:16px;margin-left:auto;width:300px;">
         <div style="display:flex;justify-content:space-between;font-size:13px;">
            <span style="color:#64748b;">Montant Total du Service</span>
            <span style="font-weight:600;color:${color};">${formatCurrency(receipt.invoice.total)}</span>
         </div>
         <div style="display:flex;justify-content:space-between;font-size:13px;">
            <span style="color:#64748b;">Reste à payer (après ce reçu)</span>
            <span style="font-weight:700;color:${receipt.invoice.amountRemaining > 0 ? '#ef4444' : '#10b981'};">${formatCurrency(receipt.invoice.amountRemaining)}</span>
         </div>
      </div>
    </div>
  ` : '';

  return `
<div style="font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;background:#fff;width:794px;margin:0 auto;color:#1e293b;">

  <!-- Header Banner -->
  <div style="background:${color};padding:40px 52px 44px;position:relative;overflow:hidden;">
    <div style="position:absolute;top:-80px;right:-40px;width:280px;height:280px;border-radius:50%;border:70px solid rgba(255,255,255,0.05);"></div>
    <div style="position:absolute;bottom:-60px;right:120px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>

    <div style="position:relative;display:flex;justify-content:space-between;align-items:flex-start;gap:40px;">
      <!-- Logo / Company -->
      <div>
        ${companyInfo?.logo ? `<img src="${escapeHTML(companyInfo.logo)}" alt="logo" style="max-height:70px;max-width:200px;object-fit:contain;display:block;" />` : `<div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;line-height:1;">${escapeHTML(companyInfo?.companyName || 'ENTREPRISE').toUpperCase()}</div>`}
        ${companyInfo?.slogan ? `<div style="font-size:12px;color:rgba(255,255,255,0.6);font-style:italic;margin-top:8px;">${escapeHTML(companyInfo.slogan)}</div>` : ''}
        <div style="font-size:11.5px;color:rgba(255,255,255,0.65);line-height:1.9;margin-top:12px;">
          ${companyInfo?.address ? `<div>${escapeHTML(companyInfo.address)}</div>` : ''}
          ${contactInfo ? `<div>${escapeHTML(contactInfo)}</div>` : ''}
          ${companyInfo?.taxId ? `<div>NIF / RCCM : ${escapeHTML(companyInfo.taxId)}</div>` : ''}
        </div>
      </div>

      <!-- Doc identity -->
      <div style="text-align:right;">
        <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Quittance</div>
        <div style="font-size:48px;font-weight:900;color:#ffffff;letter-spacing:-2px;line-height:1;">REÇU</div>
        <div style="margin-top:16px;display:flex;flex-direction:column;gap:4px;">
          <div style="display:flex;justify-content:flex-end;align-items:center;gap:10px;">
            <span style="font-size:11px;color:rgba(255,255,255,0.55);">N°</span>
            <span style="font-size:15px;font-weight:800;color:#fff;font-family:monospace;">${escapeHTML(receipt.number)}</span>
          </div>
          <div style="display:flex;justify-content:flex-end;align-items:center;gap:10px;">
            <span style="font-size:11px;color:rgba(255,255,255,0.55);">Date</span>
            <span style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.9);">${formatDate(receipt.paymentDate)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Client + Amount Section -->
  <div style="padding:0 52px;">
    <!-- Client strip -->
    <div style="background:${light};border:1px solid ${alpha(color, 0.12)};border-radius:0 0 16px 16px;padding:22px 32px 26px;margin-bottom:36px;">
      <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Reçu de la part de</div>
      <div style="font-size:24px;font-weight:900;color:${color};">${escapeHTML(receipt.client?.name || '—')}</div>
      ${receipt.client?.address ? `<div style="font-size:13px;color:#64748b;margin-top:4px;">${escapeHTML(receipt.client.address)}${receipt.client?.city ? ', ' + escapeHTML(receipt.client.city) : ''}</div>` : ''}
    </div>

    <!-- Big Amount Box -->
    <div style="background:${color};border-radius:20px;padding:40px 52px;margin-bottom:36px;display:flex;align-items:center;justify-content:space-between;position:relative;overflow:hidden;">
      <div style="position:absolute;top:0;right:0;bottom:0;width:8px;background:${accent};"></div>
      <div>
        <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">Montant Reçu</div>
        <div style="font-size:52px;font-weight:900;color:#fff;letter-spacing:-2px;line-height:1;">${formatCurrency(receipt.amount)}</div>
      </div>
      <div style="text-align:right;">
        <div style="width:80px;height:80px;border-radius:50%;background:${alpha(accent, 0.2)};display:flex;align-items:center;justify-content:center;font-size:36px;margin-left:auto;color:${accent};">✓</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:10px;text-transform:uppercase;letter-spacing:1px;">Paiement Confirmé</div>
      </div>
    </div>

    <!-- Details Box -->
    <div style="background:#f8fafc;border-radius:14px;padding:28px 32px;margin-bottom:20px;">
      <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px;">Détails du Paiement</div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9;">
        <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Mode de paiement</span>
        <span style="font-size:14px;font-weight:700;color:${color};">${paymentMethod}</span>
      </div>
      ${invoiceRef}
      ${notesRef}
    </div>

    ${serviceBlock}

    <!-- Signature Section -->
    <div style="display:flex;justify-content:flex-end;padding:0 0 52px;">
      <div style="background:#f8fafc;border-radius:16px;padding:32px 40px;">
        ${sigSection}
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:${color};padding:20px 52px;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:11px;color:rgba(255,255,255,0.55);line-height:1.7;">
      ${[companyInfo?.companyName, companyInfo?.address].filter(Boolean).map(escapeHTML).join('  ·  ')}
    </div>
    <div style="font-size:11px;color:rgba(255,255,255,0.55);text-align:right;line-height:1.7;">
      ${[companyInfo?.phone, companyInfo?.email].filter(Boolean).map(escapeHTML).join('  ·  ')}
      ${companyInfo?.taxId ? `<div style="margin-top:2px;">NIF/RCCM: ${escapeHTML(companyInfo.taxId)}</div>` : ''}
    </div>
  </div>
</div>`;
}

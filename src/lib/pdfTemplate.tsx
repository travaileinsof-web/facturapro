import { formatCurrency, formatDate, escapeHTML } from './store';

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
  const secondary = companyInfo?.secondaryColor || color;
  const accent = companyInfo?.accentColor || color;
  const light = lighten(color, 0.96);
  const mid = lighten(color, 0.88);
  const items: any[] = (() => { try { const p = JSON.parse(invoice.items || '[]'); return Array.isArray(p) ? p : (p && typeof p === 'object' ? [p] : []); } catch { return []; } })();
  const items: any[] = safeJSONParse(invoice.items);

  let documentTitle = 'FACTURE';
  if (invoice.type === 'devis') documentTitle = 'DEVIS';
  if (invoice.type === 'proforma') documentTitle = 'FACTURE PRO FORMA';

  const logoHTML = companyInfo?.logo
    ? `<img src="${escapeHTML(companyInfo.logo)}" alt="logo" style="max-height:80px;max-width:240px;object-fit:contain;display:block;" />`
    : `<div style="font-size:30px;font-weight:900;color:${color};letter-spacing:-1px;line-height:1;">${escapeHTML(companyInfo?.companyName || 'ENTREPRISE').toUpperCase()}</div>`;

  const itemRows = items.map((item, i) => `
    <tr>
      <td style="padding:14px 20px;font-size:13px;border-bottom:1px solid #f1f5f9;color:#1e293b;background:${i % 2 === 1 ? '#f8fafc' : '#fff'};"><strong style="display:block;margin-bottom:2px;">${escapeHTML(item.description)}</strong></td>
      <td style="padding:14px 20px;font-size:13px;border-bottom:1px solid #f1f5f9;text-align:center;color:#475569;background:${i % 2 === 1 ? '#f8fafc' : '#fff'};">${item.quantity}</td>
      <td style="padding:14px 20px;font-size:13px;border-bottom:1px solid #f1f5f9;text-align:right;color:#475569;background:${i % 2 === 1 ? '#f8fafc' : '#fff'};">${formatCurrency(item.unitPrice)}</td>
      <td style="padding:14px 20px;font-size:13px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;color:${color};background:${i % 2 === 1 ? '#f8fafc' : '#fff'};">${formatCurrency(item.quantity * item.unitPrice)}</td>
    </tr>`).join('');

  const taxRow = invoice.taxRate > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9;">
      <span style="color:#64748b;font-size:13px;">TVA (${invoice.taxRate}%)</span>
      <span style="color:#64748b;font-size:13px;">${formatCurrency(invoice.taxAmount)}</span>
    </div>` : '';

  const discountRow = invoice.discount > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9;">
      <span style="color:#ef4444;font-size:13px;">Remise</span>
      <span style="color:#ef4444;font-size:13px;">-${formatCurrency(invoice.discount)}</span>
    </div>` : '';

  const statusBadge = (() => {
    const statusMap: any = {
      'brouillon': ['#f1f5f9', '#475569', 'Brouillon'],
      'envoyée': ['#eff6ff', '#1d4ed8', 'Envoyée'],
      'partielle': ['#fffbeb', '#d97706', 'Partielle'],
      'payée': ['#f0fdf4', '#15803d', 'Payée'],
      'annulée': ['#fef2f2', '#dc2626', 'Annulée'],
      'impayée': ['#fef2f2', '#dc2626', 'Impayée'],
      'retard': ['#fef2f2', '#dc2626', 'En retard'],
    };
    const s = statusMap[String(invoice.status || '').toLowerCase()] || ['', '', ''];
    if (!s[2]) return '';
    return `<span style="background:${s[0]};color:${s[1]};font-size:10px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;">${s[2]}</span>`;
  })();

  const notesBlock = invoice.notes ? `
    <div style="margin-top:36px;padding:20px 24px;background:#f8fafc;border-radius:10px;border-left:3px solid ${accent};">
      <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Notes & Conditions</div>
      <div style="font-size:13px;color:#475569;line-height:1.7;white-space:pre-wrap;">${escapeHTML(invoice.notes)}</div>
    </div>` : '';

  const bankBlock = (companyInfo?.bankName || companyInfo?.bankAccount) ? `
    <div style="margin-top:24px;padding:20px 24px;background:#f8fafc;border-radius:10px;">
      <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Coordonnées Bancaires</div>
      ${companyInfo.bankName ? `<div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:4px;">${escapeHTML(companyInfo.bankName)}</div>` : ''}
      ${companyInfo.bankAccount ? `<div style="font-size:13px;color:#475569;font-family:monospace;letter-spacing:0.5px;">${escapeHTML(companyInfo.bankAccount)}</div>` : ''}
    </div>` : '';

  const stampImg = companyInfo?.stamp
    ? `<img src="${companyInfo.stamp}" alt="tampon" style="width:110px;height:110px;object-fit:contain;" />`
    : '';
  const sigImg = companyInfo?.signature
    ? `<img src="${companyInfo.signature}" alt="signature" style="width:180px;height:80px;object-fit:contain;" />`
    : '';

  const sigSection = (companyInfo?.stamp || companyInfo?.signature) ? `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-width:220px;background:#f8fafc;border-radius:12px;padding:24px 32px;">
      <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Signature & Cachet</div>
      ${stampImg}
      ${sigImg}
      <div style="width:160px;border-top:2px solid #e2e8f0;margin-top:8px;padding-top:8px;font-size:11px;font-weight:600;color:#94a3b8;text-align:center;">La Direction</div>
    </div>` : `
    <div style="min-width:220px;background:#f8fafc;border-radius:12px;padding:24px 32px;display:flex;flex-direction:column;align-items:center;gap:8px;">
      <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;">Signature & Cachet</div>
      <div style="height:70px;width:160px;border:2px dashed #e2e8f0;border-radius:8px;"></div>
      <div style="width:160px;border-top:2px solid #e2e8f0;margin-top:4px;padding-top:8px;font-size:11px;font-weight:600;color:#94a3b8;text-align:center;">La Direction</div>
    </div>`;

  const contactInfo = [companyInfo?.phone, companyInfo?.email, companyInfo?.website].filter(Boolean).join('  ·  ');

  return `
<div style="font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;background:#fff;width:794px;margin:0 auto;color:#1e293b;">

  <!-- Header Banner with accent -->
  <div style="background:${color};padding:36px 48px 40px;position:relative;overflow:hidden;">
    <!-- Subtle decorative circle -->
    <div style="position:absolute;top:-60px;right:-60px;width:240px;height:240px;border-radius:50%;background:${alpha(color, 0)};border:60px solid rgba(255,255,255,0.06);"></div>
    <div style="position:absolute;bottom:-80px;right:80px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>

    <div style="position:relative;display:flex;justify-content:space-between;align-items:flex-start;gap:40px;">
      <!-- Logo / Company name -->
      <div>
        ${logoHTML}
        ${companyInfo?.slogan ? `<div style="font-size:12px;color:rgba(255,255,255,0.65);font-style:italic;margin-top:8px;">${escapeHTML(companyInfo.slogan)}</div>` : ''}
        <div style="font-size:11.5px;color:rgba(255,255,255,0.7);line-height:1.9;margin-top:12px;">
          ${companyInfo?.address ? `<div>${escapeHTML(companyInfo.address)}</div>` : ''}
          ${contactInfo ? `<div>${escapeHTML(contactInfo)}</div>` : ''}
          ${companyInfo?.taxId ? `<div>NIF / RCCM : ${escapeHTML(companyInfo.taxId)}</div>` : ''}
        </div>
      </div>

      <!-- Doc identity -->
      <div style="text-align:right;">
        <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Document Commercial</div>
        <div style="font-size:48px;font-weight:900;color:#ffffff;letter-spacing:-2px;line-height:1;">${documentTitle}</div>
        <div style="margin-top:16px;display:flex;flex-direction:column;gap:4px;">
          <div style="display:flex;justify-content:flex-end;align-items:center;gap:10px;">
            <span style="font-size:11px;color:rgba(255,255,255,0.55);">N°</span>
            <span style="font-size:15px;font-weight:800;color:#fff;font-family:monospace;">${escapeHTML(invoice.number)}</span>
          </div>
          <div style="display:flex;justify-content:flex-end;align-items:center;gap:10px;">
            <span style="font-size:11px;color:rgba(255,255,255,0.55);">Émission</span>
            <span style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.9);">${formatDate(invoice.createdAt)}</span>
          </div>
          ${invoice.dueDate ? `
          <div style="display:flex;justify-content:flex-end;align-items:center;gap:10px;">
            <span style="font-size:11px;color:rgba(255,255,255,0.55);">Échéance</span>
            <span style="font-size:13px;font-weight:600;color:#fbbf24;">${formatDate(invoice.dueDate)}</span>
          </div>` : ''}
          <div style="margin-top:8px;display:flex;justify-content:flex-end;">${statusBadge}</div>
        </div>
      </div>
    </div>
  </div>

  <div style="padding:0 48px;">
    <div style="background:${light};border:1px solid ${alpha(color, 0.12)};border-radius:0 0 16px 16px;padding:24px 32px 28px;margin-bottom:36px;">
      <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">Facturé à</div>
      <div style="font-size:22px;font-weight:900;color:${color};margin-bottom:8px;">${escapeHTML(invoice.client?.name || '—')}</div>
      <div style="font-size:13px;color:#64748b;line-height:1.8;">
        ${invoice.client?.address ? `<span>${escapeHTML(invoice.client.address)}</span>` : ''}
        ${invoice.client?.city ? `<span style="margin-left:8px;">${escapeHTML(invoice.client.city)}${invoice.client?.country ? ', ' + escapeHTML(invoice.client.country) : ''}</span>` : ''}
        ${invoice.client?.phone ? `<span style="margin-left:16px;">✆ ${escapeHTML(invoice.client.phone)}</span>` : ''}
        ${invoice.client?.email ? `<span style="margin-left:16px;">✉ ${escapeHTML(invoice.client.email)}</span>` : ''}
      </div>
    </div>
  </div>

  <!-- Table -->
  <div style="padding:0 48px;margin-bottom:36px;">
    <table style="width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <thead>
        <tr style="background:${secondary};">
          <th style="padding:14px 20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#ffffff;text-align:left;">Article / Service</th>
          <th style="padding:14px 20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#ffffff;text-align:center;">Qté</th>
          <th style="padding:14px 20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#ffffff;text-align:right;">Prix Unitaire</th>
          <th style="padding:14px 20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#ffffff;text-align:right;">Montant</th>
        </tr>
      </thead>
      <tbody>${itemRows}
        <tr><td colspan="4" style="height:4px;background:${secondary};"></td></tr>
      </tbody>
    </table>
  </div>

  <!-- Totals + Notes -->
  <div style="padding:0 48px;display:flex;justify-content:space-between;gap:32px;margin-bottom:36px;">
    <!-- Left: Notes + Bank -->
    <div style="flex:1;">
      ${notesBlock}
      ${bankBlock}
    </div>

    <!-- Right: Totals -->
    <div style="min-width:280px;">
      <div style="background:#f8fafc;border-radius:12px;padding:24px;">
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9;">
          <span style="color:#64748b;font-size:13px;">Sous-total HT</span>
          <span style="color:#1e293b;font-size:13px;font-weight:600;">${formatCurrency(invoice.subtotal)}</span>
        </div>
        ${taxRow}
        ${discountRow}
        <div style="display:flex;justify-content:space-between;padding:12px 0;border-top:2px solid ${color};margin-top:10px;">
          <span style="font-size:14px;font-weight:700;color:#64748b;text-transform:uppercase;">Total de la Facture</span>
          <span style="font-size:16px;font-weight:800;color:#1e293b;font-family:monospace;">${formatCurrency(invoice.total)}</span>
        </div>
        
        ${(invoice.receipts && invoice.receipts.length > 0) ? `
        <div style="margin-top:16px;background:#f8fafc;border-radius:8px;padding:16px;">
          <div style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Acomptes & Paiements reçus</div>
          ${invoice.receipts.map((r: any) => `
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #e2e8f0;font-size:13px;color:#475569;">
              <span>Reçu ${escapeHTML(r.number)}</span>
              <span style="color:#15803d;font-weight:700;font-family:monospace;">- ${formatCurrency(r.amount)}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div style="margin-top:16px;background:${color};border-radius:10px;padding:18px 20px;display:flex;justify-content:space-between;align-items:center;box-shadow: 0 10px 25px -5px ${color}40;">
          <div>
            <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">
              ${(invoice.receipts && invoice.receipts.length > 0) ? 'Reste à payer TTC' : 'Net à payer TTC'}
            </div>
            <div style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-0.5px;font-family:monospace;">
              ${formatCurrency(invoice.amountRemaining !== undefined ? invoice.amountRemaining : invoice.total)}
            </div>
          </div>
          <div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;">
            ${(invoice.amountRemaining !== undefined && invoice.amountRemaining <= 0) ? '✓' : '💳'}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Signature Banner -->
  <div style="padding:0 48px 48px;">
    <div style="display:flex;justify-content:flex-end;">
      ${sigSection}
    </div>
  </div>

  <!-- Footer -->
  <div style="background:${color};padding:20px 48px;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:11px;color:rgba(255,255,255,0.55);line-height:1.7;">
      ${[companyInfo?.companyName, companyInfo?.address].filter(Boolean).map(escapeHTML).join('  ·  ')}
    </div>
    <div style="font-size:11px;color:rgba(255,255,255,0.55);text-align:right;line-height:1.7;">
      ${[companyInfo?.phone, companyInfo?.email].filter(Boolean).map(escapeHTML).join('  ·  ')}
      ${companyInfo?.taxId ? `<div>NIF/RCCM: ${escapeHTML(companyInfo.taxId)}</div>` : ''}
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

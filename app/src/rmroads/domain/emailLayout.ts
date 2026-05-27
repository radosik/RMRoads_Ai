// Branded email layout. Inline styles only — most clients strip
// <style> from <head>. Table-based outer layout so legacy email
// clients (Outlook on Windows in particular) lay it out correctly.
//
// Colour values are hardcoded duplicates of the dark-theme tokens in
// Main.css. They live here as constants because email clients have no
// access to CSS variables.

const BRAND = {
  bg: "#051424",
  panel: "#0d1c2d",
  panelMuted: "#1c2b3c",
  border: "#1a2a3a",
  borderSoft: "#273647",
  fg: "#d4e4fa",
  fgStrong: "#ffffff",
  muted: "#94a3b8",
  secondary: "#4cd7f6",
  secondaryDeep: "#003640",
  destructive: "#ffb4ab",
  destructiveDeep: "#680010",
};

export type BrandedEmailInput = {
  preheader?: string;
  title: string;
  intro?: string;
  bodyHtml: string;
  primaryAction?: { label: string; url: string };
  footerNote?: string;
};

export function wrapBrandedEmail(opts: BrandedEmailInput): string {
  const preheader = opts.preheader ?? "";
  const intro = opts.intro
    ? `<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${BRAND.muted};">${opts.intro}</p>`
    : "";
  const action = opts.primaryAction
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
         <tr>
           <td style="background-color:${BRAND.secondary};border-radius:4px;">
             <a href="${escapeHtml(opts.primaryAction.url)}" style="display:inline-block;padding:12px 24px;color:${BRAND.secondaryDeep};text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.02em;">${escapeHtml(opts.primaryAction.label)}</a>
           </td>
         </tr>
       </table>`
    : "";
  const footerNote = opts.footerNote
    ? `<p style="margin:0 0 8px;">${opts.footerNote}</p>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};color:${BRAND.fg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none !important;visibility:hidden;overflow:hidden;max-height:0;width:0;font-size:1px;line-height:1px;color:transparent;">${escapeHtml(preheader)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BRAND.bg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding:0 0 28px 4px;">
              <span style="font-size:22px;font-weight:700;letter-spacing:-0.01em;color:${BRAND.fg};">RMRoads</span><span style="font-size:18px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;color:${BRAND.secondary};margin-left:6px;text-shadow:0 0 16px rgba(76,215,246,0.45);">AI</span>
            </td>
          </tr>
          <tr>
            <td style="background-color:${BRAND.panel};border:1px solid ${BRAND.border};border-radius:8px;padding:32px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${BRAND.fgStrong};letter-spacing:-0.01em;line-height:1.25;">${escapeHtml(opts.title)}</h1>
              ${intro}
              ${opts.bodyHtml}
              ${action}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 4px 0;text-align:left;font-size:12px;color:${BRAND.muted};line-height:1.6;">
              ${footerNote}
              <p style="margin:0 0 6px;">Recommendations are decision support. Planner approval is required.</p>
              <p style="margin:0;">${new Date().getFullYear()} RMRoads AI · Disruption response workbench · Open source</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailInfoList(items: Array<{ label: string; value: string }>): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;">
    ${items
      .map(
        (item, idx) => `
      <tr>
        <td style="padding:14px 0;border-top:${idx === 0 ? "none" : `1px solid ${BRAND.border}`};">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.muted};margin-bottom:4px;">${escapeHtml(item.label)}</div>
          <div style="font-size:15px;color:${BRAND.fg};line-height:1.5;">${item.value}</div>
        </td>
      </tr>`,
      )
      .join("")}
  </table>`;
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:${BRAND.fg};">${text}</p>`;
}

export function emailSectionTitle(label: string): string {
  return `<div style="margin:24px 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.secondary};font-weight:600;">${escapeHtml(label)}</div>`;
}

export function emailStatGrid(stats: Array<{ label: string; value: string | number }>): string {
  // Two-column grid via nested table. Outlook-safe.
  const rows: string[] = [];
  for (let i = 0; i < stats.length; i += 2) {
    const left = stats[i];
    const right = stats[i + 1];
    rows.push(`<tr>
      <td width="50%" style="padding:6px;vertical-align:top;">
        ${statCell(left)}
      </td>
      <td width="50%" style="padding:6px;vertical-align:top;">
        ${right ? statCell(right) : ""}
      </td>
    </tr>`);
  }
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 -6px;width:calc(100% + 12px);">${rows.join("")}</table>`;
}

function statCell(stat: { label: string; value: string | number }): string {
  return `<div style="background-color:${BRAND.panelMuted};border:1px solid ${BRAND.borderSoft};border-radius:6px;padding:14px 16px;">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.muted};margin-bottom:6px;">${escapeHtml(stat.label)}</div>
    <div style="font-size:20px;font-weight:700;color:${BRAND.fgStrong};line-height:1.2;">${escapeHtml(String(stat.value))}</div>
  </div>`;
}

export function emailRiskBadge(level: "critical" | "high" | "medium" | "low" | string, label?: string): string {
  const isCritical = level === "critical";
  const isHigh = level === "high";
  const bg = isCritical ? "rgba(255,180,171,0.12)" : isHigh ? "rgba(255,180,171,0.08)" : "rgba(76,215,246,0.12)";
  const fg = isCritical ? BRAND.destructive : isHigh ? "#ffd49b" : BRAND.secondary;
  const border = isCritical ? BRAND.destructive : isHigh ? "#ffd49b" : BRAND.secondary;
  return `<span style="display:inline-block;background-color:${bg};color:${fg};border:1px solid ${border};border-radius:4px;padding:2px 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">${escapeHtml(label ?? level)}</span>`;
}

export function emailRiskList(items: Array<{ shipmentId: string; customer: string; riskScore: number; reason: string; riskLevel?: string }>): string {
  if (!items.length) return emailParagraph(`<em style="color:${BRAND.muted};">No open exceptions.</em>`);
  const rows = items
    .map(
      (item, idx) => `
    <tr>
      <td style="padding:12px 0;border-top:${idx === 0 ? "none" : `1px solid ${BRAND.border}`};">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="vertical-align:top;">
              <div style="font-size:14px;font-weight:600;color:${BRAND.fgStrong};">${escapeHtml(item.shipmentId)} · ${escapeHtml(item.customer)}</div>
              <div style="font-size:13px;color:${BRAND.muted};margin-top:2px;line-height:1.5;">${escapeHtml(item.reason)}</div>
            </td>
            <td style="vertical-align:top;text-align:right;white-space:nowrap;padding-left:12px;">
              ${emailRiskBadge(item.riskLevel ?? "high", `${item.riskScore}/100`)}
            </td>
          </tr>
        </table>
      </td>
    </tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;">${rows}</table>`;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

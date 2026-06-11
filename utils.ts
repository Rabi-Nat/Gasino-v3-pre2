export const getApiUrl = (path: string): string => {
  let base = '';
  if (typeof window !== 'undefined') {
    const savedBase = localStorage.getItem('gasino_api_server_url');
    if (savedBase && savedBase.trim() !== '') {
      base = savedBase.trim();
    } else {
      const origin = window.location.origin;
      if (origin && !origin.includes('file://') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        base = origin;
      } else {
        // Fallback to the production deployed URL
        base = 'https://ais-pre-paup5q3fn37ypcgv6bevqn-56010228689.us-east1.run.app';
      }
    }
  } else {
    base = 'https://ais-pre-paup5q3fn37ypcgv6bevqn-56010228689.us-east1.run.app';
  }
  
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${cleanBase}/${cleanPath}`;
};

// SVG blue print generator for 100% offline-first high resolution graphics in Iran
const generateBlueprintSvg = (type: string): string => {
  let mainColor = '#3b82f6'; // blue
  let glowColor = 'rgba(59, 130, 246, 0.4)';
  let bgStart = '#050e1e';
  let bgEnd = '#02070f';
  let linesContent = '';
  let labelsContent = '';

  const gridPattern = `
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="0.8"/>
    </pattern>
    <pattern id="gridSub" width="100" height="100" patternUnits="userSpaceOnUse">
      <rect width="100" height="100" fill="url(#grid)"/>
      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.2"/>
    </pattern>
  `;

  if (type === 'gas') {
    mainColor = '#f59e0b'; // amber/orange
    glowColor = 'rgba(245, 158, 11, 0.4)';
    bgStart = '#020b18';
    bgEnd = '#01040a';
    linesContent = `
      <!-- Piping -->
      <path d="M -20,120 L 160,120 C 180,120 180,180 200,180 L 420,180" fill="none" stroke="${mainColor}" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
      <path d="M 120,-20 L 120,100" fill="none" stroke="${mainColor}" stroke-width="3" stroke-dasharray="6,4" opacity="0.6"/>
      <!-- Regulator Box -->
      <rect x="130" y="90" width="60" height="60" rx="8" fill="#1e293b" fill-opacity="0.9" stroke="${mainColor}" stroke-width="2" stroke-dasharray="1, 1"/>
      <circle cx="160" cy="120" r="18" fill="none" stroke="${mainColor}" stroke-dasharray="4,2"/>
      <path d="M 150,120 L 170,120 M 160,110 L 160,130" stroke="${mainColor}" stroke-width="2"/>
      <!-- Pressure Gauge -->
      <circle cx="280" cy="120" r="28" fill="#0f172a" stroke="${mainColor}" stroke-width="2.5"/>
      <path d="M 280,120 L 298,105" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
      <circle cx="280" cy="120" r="4" fill="${mainColor}"/>
      <!-- Compass / Drafting details -->
      <circle cx="200" cy="150" r="110" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      <path d="M 90,150 A 110,110 0 0,1 310,150" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.8" stroke-dasharray="4,8"/>
    `;
    labelsContent = `
      <text x="30" y="50" fill="#94a3b8" font-family="monospace" font-size="9" opacity="0.5">SCALE: 1:12</text>
      <text x="30" y="65" fill="#94a3b8" font-family="monospace" font-size="9" opacity="0.5">P1: 17.4 kPa (GAS_LINE)</text>
      <text x="250" y="80" fill="${mainColor}" font-family="sans-serif" font-size="10" font-weight="bold">METERING UNIT</text>
      <text x="330" y="270" fill="#94a3b8" font-family="monospace" font-size="8" opacity="0.4">ISO M-17</text>
    `;
  } else if (type === 'fire') {
    mainColor = '#f43f5e'; // rose/red
    glowColor = 'rgba(244, 63, 94, 0.4)';
    bgStart = '#1a040b';
    bgEnd = '#0b0104';
    linesContent = `
      <!-- Water Loop -->
      <path d="M 60,320 L 60,150 C 60,130 80,110 100,110 L 320,110 C 340,110 340,50 360,50 L 420,50" fill="none" stroke="${mainColor}" stroke-width="4.5" stroke-linejoin="round" opacity="0.85"/>
      <!-- Sprinkler Head Blueprint -->
      <g transform="translate(220,110)">
        <circle cx="0" cy="0" r="22" fill="#1e1b4b" stroke="${mainColor}" stroke-width="2"/>
        <line x1="0" y1="-25" x2="0" y2="25" stroke="${mainColor}" stroke-width="2.5"/>
        <path d="M -12,-15 L 12,-15 M -12,15 L 12,15" stroke="${mainColor}" stroke-width="1.5"/>
        <path d="M -8,0 L 8,0" stroke="#f43f5e" stroke-width="4"/>
      </g>
      <!-- Fire tank outlines -->
      <rect x="290" y="160" width="70" height="90" rx="10" fill="none" stroke="${mainColor}" stroke-width="2" stroke-dasharray="4,4" opacity="0.6"/>
      <circle cx="325" cy="205" r="16" fill="none" stroke="${mainColor}" stroke-width="1.5"/>
      <!-- Heat Wave vectors -->
      <path d="M 120,200 Q 140,180 160,200 T 200,200" fill="none" stroke="${mainColor}" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.5"/>
      <!-- Coordinate circles -->
      <circle cx="220" cy="110" r="60" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    `;
    labelsContent = `
      <text x="30" y="50" fill="#94a3b8" font-family="monospace" font-size="9" opacity="0.5">DWG: FIRE-PRO-04</text>
      <text x="30" y="65" fill="#94a3b8" font-family="monospace" font-size="9" opacity="0.5">SPRINKLER HYDRANT FLUX</text>
      <text x="210" y="180" fill="${mainColor}" font-family="sans-serif" font-size="10" font-weight="bold">ACTUATOR</text>
      <text x="330" y="270" fill="#94a3b8" font-family="monospace" font-size="8" opacity="0.4">NFPA-13</text>
    `;
  } else if (type === 'plumbing') {
    mainColor = '#06b6d4'; // cyan
    glowColor = 'rgba(6, 182, 212, 0.4)';
    bgStart = '#021217';
    bgEnd = '#01050a';
    linesContent = `
      <!-- Dual Pipes (Hot & Cold) -->
      <path d="M -20,100 L 220,100 C 240,100 240,200 260,200 L 420,200" fill="none" stroke="${mainColor}" stroke-width="3" opacity="0.85"/>
      <path d="M -20,120 L 210,120 C 225,120 225,220 240,220 L 420,220" fill="none" stroke="#2563eb" stroke-width="2.5" opacity="0.75"/>
      <!-- Siphon bend -->
      <path d="M 80,-20 L 80,70 C 80,95 110,105 120,80 C 130,55 150,70 150,140" fill="none" stroke="${mainColor}" stroke-width="2" stroke-dasharray="5,2" opacity="0.5"/>
      <!-- Sump pit diagram -->
      <rect x="30" y="190" width="80" height="70" rx="4" fill="#0f172a" fill-opacity="0.8" stroke="${mainColor}" stroke-width="1.5"/>
      <!-- Bubbles -->
      <circle cx="50" cy="225" r="4" fill="none" stroke="${mainColor}" stroke-width="1" opacity="0.6"/>
      <circle cx="75" cy="210" r="6" fill="none" stroke="${mainColor}" stroke-width="1" opacity="0.4"/>
      <circle cx="90" cy="235" r="3" fill="none" stroke="${mainColor}" stroke-width="1" opacity="0.7"/>
    `;
    labelsContent = `
      <text x="30" y="50" fill="#94a3b8" font-family="monospace" font-size="9" opacity="0.5">SFU CALCULATION PLAT</text>
      <text x="30" y="65" fill="#94a3b8" font-family="monospace" font-size="9" opacity="0.5">SLOPE = 0.02 (2%)</text>
      <text x="50" y="280" fill="${mainColor}" font-family="sans-serif" font-size="9" font-weight="bold">COLLECTOR WELL</text>
      <text x="330" y="270" fill="#94a3b8" font-family="monospace" font-size="8" opacity="0.4">EN_806</text>
    `;
  } else if (type === 'hvac') {
    mainColor = '#f59e0b'; // amber
    glowColor = 'rgba(245, 158, 11, 0.4)';
    bgStart = '#120c02';
    bgEnd = '#050300';
    linesContent = `
      <!-- Air Duct Blueprint -->
      <rect x="60" y="70" width="280" height="150" rx="12" fill="none" stroke="${mainColor}" stroke-width="2" stroke-dasharray="4,4" opacity="0.4"/>
      <!-- Spiral heat wave exchanger -->
      <path d="M 90,145 C 90,110 130,110 130,145 C 130,180 170,180 170,145 C 170,110 210,110 210,145 C 210,180 250,180 250,145 C 250,110 290,110 290,145" fill="none" stroke="${mainColor}" stroke-width="3" stroke-linecap="round" opacity="0.85"/>
      <!-- Centrifugal Fan circles -->
      <ellipse cx="190" cy="145" rx="55" ry="55" fill="none" stroke="${mainColor}" stroke-width="1.5" stroke-dasharray="8,6" opacity="0.5"/>
      <line x1="195" y1="90" x2="195" y2="200" stroke="${mainColor}" stroke-width="1" opacity="0.3"/>
      <line x1="140" y1="145" x2="250" y2="145" stroke="${mainColor}" stroke-width="1" opacity="0.3"/>
      <circle cx="190" cy="145" r="14" fill="#1e1b4b" stroke="${mainColor}" stroke-width="2.5"/>
    `;
    labelsContent = `
      <text x="30" y="50" fill="#94a3b8" font-family="monospace" font-size="9" opacity="0.5">HEATING LOAD CALCS</text>
      <text x="30" y="65" fill="#94a3b8" font-family="monospace" font-size="9" opacity="0.5">DUCT AIRFLOW MATRIX</text>
      <text x="165" y="245" fill="${mainColor}" font-family="sans-serif" font-size="10" font-weight="bold">BLOWER VENT</text>
      <text x="330" y="270" fill="#94a3b8" font-family="monospace" font-size="8" opacity="0.4">ASHRAE</text>
    `;
  } else if (type === 'store') {
    mainColor = '#10b981'; // emerald
    glowColor = 'rgba(16, 185, 129, 0.4)';
    bgStart = '#021209';
    bgEnd = '#010502';
    linesContent = `
      <!-- Isometric Racking / Shelves -->
      <g transform="translate(130, 90)">
        <polygon points="50,0 120,30 50,60 -20,30" fill="none" stroke="${mainColor}" stroke-width="2" opacity="0.75"/>
        <polygon points="50,40 120,70 50,100 -20,70" fill="none" stroke="${mainColor}" stroke-width="1.5" stroke-dasharray="4,2" opacity="0.5"/>
        <line x1="-20" y1="30" x2="-20" y2="100" stroke="${mainColor}" stroke-width="2" />
        <line x1="50" y1="60" x2="50" y2="130" stroke="${mainColor}" stroke-width="2" />
        <line x1="120" y1="30" x2="120" y2="100" stroke="${mainColor}" stroke-width="2" />
      </g>
      <!-- Price tag circles -->
      <circle cx="80" cy="190" r="18" fill="none" stroke="${mainColor}" stroke-width="1.5" stroke-dasharray="2,2"/>
      <path d="M 80,182 L 80,195 M 74,188 L 86,188" stroke="${mainColor}" stroke-width="2.5"/>
    `;
    labelsContent = `
      <text x="30" y="50" fill="#94a3b8" font-family="monospace" font-size="9" opacity="0.5">WAREHOUSE DISPATCH</text>
      <text x="30" y="65" fill="#94a3b8" font-family="monospace" font-size="9" opacity="0.5">SUPPLY PRICEINDEX LIST</text>
      <text x="330" y="270" fill="#94a3b8" font-family="monospace" font-size="8" opacity="0.4">ISO-9001</text>
    `;
  } else if (type === 'contact') {
    mainColor = '#8b5cf6'; // violet
    glowColor = 'rgba(139, 92, 246, 0.4)';
    bgStart = '#0d041c';
    bgEnd = '#04010a';
    linesContent = `
      <!-- Signal Ring waves -->
      <circle cx="100" cy="200" r="40" fill="none" stroke="${mainColor}" stroke-width="1" stroke-dasharray="3,3" opacity="0.5"/>
      <circle cx="100" cy="200" r="70" fill="none" stroke="${mainColor}" stroke-width="1.5" opacity="0.4"/>
      <circle cx="100" cy="200" r="100" fill="none" stroke="${mainColor}" stroke-width="2" opacity="0.25"/>
      <circle cx="100" cy="200" r="130" fill="none" stroke="${mainColor}" stroke-width="2.5" opacity="0.12"/>
      <!-- Connecting Hub Nodes -->
      <circle cx="100" cy="200" r="10" fill="#1e1b4b" stroke="${mainColor}" stroke-width="2.5"/>
      <line x1="100" y1="200" x2="280" y2="100" stroke="${mainColor}" stroke-width="2" opacity="0.75"/>
      <line x1="100" y1="200" x2="310" y2="190" stroke="${mainColor}" stroke-width="1.5" opacity="0.5"/>
      <circle cx="280" cy="100" r="14" fill="#0f172a" stroke="${mainColor}" stroke-width="2"/>
      <circle cx="310" cy="190" r="8" fill="#1e293b" stroke="${mainColor}" stroke-width="1.5"/>
    `;
    labelsContent = `
      <text x="30" y="50" fill="#94a3b8" font-family="monospace" font-size="9" opacity="0.5">SUPPORT TELEMETRY ENGINE</text>
      <text x="30" y="65" fill="#94a3b8" font-family="monospace" font-size="9" opacity="0.5">RESPONSE SLA SPEED: 15MIN</text>
      <text x="330" y="270" fill="#94a3b8" font-family="monospace" font-size="8" opacity="0.4">CRM-V7</text>
    `;
  } else {
    // guide
    mainColor = '#0ea5e9'; // sky
    glowColor = 'rgba(14, 165, 233, 0.4)';
    bgStart = '#03101c';
    bgEnd = '#01050a';
    linesContent = `
      <!-- Scale ticks (Ruler mark mockup) -->
      <path d="M 40,250 L 360,250" stroke="${mainColor}" stroke-width="2" opacity="0.7"/>
      <path d="M 60,250 L 60,240 M 100,250 L 100,242 M 140,250 L 140,240 M 180,250 L 180,242 M 220,250 L 220,240 M 260,250 L 260,242 M 300,250 L 300,240 M 340,250 L 340,242" stroke="${mainColor}" stroke-width="1.5" opacity="0.6"/>
      <!-- Compass Arch blueprint -->
      <path d="M 120,100 A 80,80 0 0,1 280,100" fill="none" stroke="${mainColor}" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.45"/>
      <!-- Open Book geometry -->
      <polygon points="120,120 195,100 195,190 120,210" fill="none" stroke="${mainColor}" stroke-width="2.2" opacity="0.8"/>
      <polygon points="270,120 195,100 195,190 270,210" fill="none" stroke="${mainColor}" stroke-width="2.2" opacity="0.8"/>
    `;
    labelsContent = `
      <text x="30" y="50" fill="#94a3b8" font-family="monospace" font-size="9" opacity="0.5">TECHNICAL CODEBOOK SUMMARY</text>
      <text x="30" y="65" fill="#94a3b8" font-family="monospace" font-size="9" opacity="0.5">NATIONAL BUILDING REGS (IRAN)</text>
      <text x="330" y="270" fill="#94a3b8" font-family="monospace" font-size="8" opacity="0.4">REGS-16-17</text>
    `;
  }

  const rawSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
      <defs>
        <radialGradient id="radialGlow" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="${bgStart}"/>
          <stop offset="100%" stop-color="${bgEnd}"/>
        </radialGradient>
        <radialGradient id="neonLight" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${mainColor}" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="${mainColor}" stop-opacity="0"/>
        </radialGradient>
        ${gridPattern}
      </defs>

      <!-- Background -->
      <rect width="400" height="300" fill="url(#radialGlow)"/>

      <!-- Blueprint Grid Overlay -->
      <rect width="400" height="300" fill="url(#gridSub)"/>

      <!-- Ambient Neon Halo -->
      <circle cx="200" cy="150" r="160" fill="url(#neonLight)"/>

      <!-- Tech Drafting Design Geometry -->
      ${linesContent}

      <!-- Dimension Coordinates and Text Labels -->
      ${labelsContent}
    </svg>
  `;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(rawSvg.trim());
};

// Map each section/item background safely and fully offline
export const getProxiedImageUrl = (url: string): string => {
  if (!url) return '';
  
  // Intercept stock Unsplash and replace with premium vector SVGs directly!
  if (url.includes('unsplash.com') || url.includes('/placeholder') || url === '') {
    if (url.includes('photo-1504307651254') || url.includes('gas')) {
      return generateBlueprintSvg('gas');
    }
    if (url.includes('photo-1516383274235') || url.includes('fire')) {
      return generateBlueprintSvg('fire');
    }
    if (url.includes('photo-1584622650111') || url.includes('plumbing')) {
      return generateBlueprintSvg('plumbing');
    }
    if (url.includes('photo-1621905251189') || url.includes('hvac')) {
      return generateBlueprintSvg('hvac');
    }
    if (url.includes('photo-1581092160607') || url.includes('store')) {
      return generateBlueprintSvg('store');
    }
    if (url.includes('photo-1516321318423') || url.includes('contact')) {
      return generateBlueprintSvg('contact');
    }
    if (url.includes('photo-1506784983877') || url.includes('guide')) {
      return generateBlueprintSvg('guide');
    }
    
    // Fallback based on text match
    const lower = url.toLowerCase();
    if (lower.includes('gas') || lower.includes('pipe')) return generateBlueprintSvg('gas');
    if (lower.includes('fire') || lower.includes('extinguish')) return generateBlueprintSvg('fire');
    if (lower.includes('plumb') || lower.includes('sew') || lower.includes('reservoir')) return generateBlueprintSvg('plumbing');
    if (lower.includes('hvac') || lower.includes('heat') || lower.includes('duct') || lower.includes('chiller')) return generateBlueprintSvg('hvac');
    if (lower.includes('store') || lower.includes('shop') || lower.includes('price')) return generateBlueprintSvg('store');
    if (lower.includes('contact') || lower.includes('support') || lower.includes('message')) return generateBlueprintSvg('contact');
    if (lower.includes('guide') || lower.includes('book') || lower.includes('instruction')) return generateBlueprintSvg('guide');

    return generateBlueprintSvg('gas');
  }

  // Live remote image (e.g. from Google Sheets or custom hosts)
  // We load the URL directly on the client side to avoid Cloud Run US-east server being geo-blocked by domestic Iranian hosts.
  // This ensures 0-latency and maximum reliability since <img> tags are not restricted by CORS.
  return url;
};

// ----------------------------------------------------
// Google Sheets CSV Parse Helpers (Zero-Dependency Client-Side Sync)
// ----------------------------------------------------
export function parseCSVRow(rowText: string): string[] {
  const result: string[] = [];
  let currentWord = "";
  let inQuotes = false;
  for (let i = 0; i < rowText.length; i++) {
    const char = rowText[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(currentWord);
      currentWord = "";
    } else {
      currentWord += char;
    }
  }
  result.push(currentWord);
  return result.map(cell => {
    let cleaned = cell.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    return cleaned.replace(/""/g, '"');
  });
}

export function parseCSVToAds(csvText: string): any[] {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = parseCSVRow(headerLine).map(h => h.trim().toLowerCase());

  const getColIndex = (names: string[]): number => {
    return headers.findIndex(h => names.includes(h));
  };

  const idIdx = getColIndex(['id', 'شناسه', 'code', 'کد']);
  const titleIdx = getColIndex(['title', 'عنوان', 'نام']);
  const descIdx = getColIndex(['description', 'توضیحات', 'متن']);
  const imgIdx = getColIndex(['imageurl', 'image', 'عکس', 'تصویر', 'لینک عکس']);
  const linkIdx = getColIndex(['link', 'لینک', 'پیوند', 'آدرس سایت']);
  const sloganIdx = getColIndex(['slogan', 'شعار', 'متن شعار']);
  const badgeIdx = getColIndex(['badge', 'برچسب', 'اتیکت', 'گروه']);
  const activeIdx = getColIndex(['isactive', 'active', 'فعال', 'نمایش']);

  const ads: any[] = [];
  const seenIds = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const rowText = lines[i].trim();
    if (!rowText) continue;

    const cells = parseCSVRow(rowText);
    if (cells.length === 0) continue;

    const getValue = (idx: number, fallbackIdx: number, defaultValue: any) => {
      if (idx !== -1 && idx < cells.length) return cells[idx].trim();
      if (fallbackIdx < cells.length) return cells[fallbackIdx].trim();
      return defaultValue;
    };

    const title = getValue(titleIdx, 1, "");
    if (!title) continue; // Skip rows without basic title

    let rawId = getValue(idIdx, 0, `ad_${i}`).trim();
    if (!rawId) {
      rawId = `ad_${i}`;
    }

    let id = rawId;
    let counter = 1;
    while (seenIds.has(id)) {
      id = `${rawId}_${counter}`;
      counter++;
    }
    seenIds.add(id);

    const description = getValue(descIdx, 2, "");
    const imageUrl = getValue(imgIdx, 3, "");
    const link = getValue(linkIdx, 4, "#");
    const slogan = getValue(sloganIdx, 5, "");
    const badge = getValue(badgeIdx, 6, "حامی گازینو");
    const isActiveStr = getValue(activeIdx, 7, "true");
    const isActive = isActiveStr.toLowerCase() === 'true' || isActiveStr === '1' || isActiveStr === 'yes' || isActiveStr === 'بله' || isActiveStr === '';

    ads.push({
      id,
      title,
      description,
      imageUrl,
      link,
      slogan,
      badge,
      isActive
    });
  }

  return ads;
}

export function normalizeSourceUrl(url: string): string {
  if (!url) return url;
  const trimmed = url.trim();
  const sheetMatch = trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetMatch && sheetMatch[1]) {
    const sheetId = sheetMatch[1];
    
    // Check if it's already published csv url, else export as csv
    if (trimmed.includes('/pub?') && trimmed.includes('output=csv')) {
      return trimmed;
    }
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  }
  return trimmed;
}

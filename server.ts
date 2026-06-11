import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs/promises";

// Load environment variables from .env file for local development
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory caching & config persistence
const CACHE_FILE = path.join(process.cwd(), "ads_cache.json");

const DEFAULT_ADS = [
  {
    id: "gasino_app_default",
    title: "اپلیکیشن گازینو - محاسبات تخصصی مهندسی",
    description: "جهت اسپانسری و تبلیغات با پشتیبانی در ارتباط باشید...",
    imageUrl: "/gasino_ad_banner.png",
    link: "/#",
    slogan: "سریع‌ترین ابزار محاسبات و شبیه‌سازی مهندسی",
    badge: "پیش‌فرض گازینو",
    clicks: 1450,
    views: 8920,
    isActive: true
  }
];

// ----------------------------------------------------
// Google Sheets CSV Parse Helpers (Zero-Dependency)
// ----------------------------------------------------
function parseCSVRow(rowText: string): string[] {
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

function parseCSVToAds(csvText: string): any[] {
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

function normalizeSourceUrl(url: string): string {
  if (!url) return url;
  const trimmed = url.trim();
  const sheetMatch = trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetMatch && sheetMatch[1]) {
    const sheetId = sheetMatch[1];
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  }
  return trimmed;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Debug middleware to log requests in AI Studio console
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Try to load cached config from file, or construct new
  let cachedConfig = {
    ads: DEFAULT_ADS,
    sourceUrl: process.env.ADS_SOURCE_URL || ""
  };

  try {
    const data = await fs.readFile(CACHE_FILE, "utf-8");
    cachedConfig = JSON.parse(data);
  } catch (err) {
    console.log("[INFO] No ads_cache.json found, generating default config.");
    try {
      await fs.writeFile(CACHE_FILE, JSON.stringify(cachedConfig, null, 2), "utf-8");
    } catch (writeErr) {
      console.error("[ERROR] Could not write default ads_cache.json:", writeErr);
    }
  }

  // API route for Advertisements
  app.get("/api/ads", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    // Increment visual impressions/views on load
    cachedConfig.ads = cachedConfig.ads.map(ad => ({ ...ad, views: (ad.views || 0) + 1 }));

    // If a Remote Source URL represents Gist / sheet, attempt dynamic pull
    if (cachedConfig.sourceUrl && cachedConfig.sourceUrl.trim() !== "") {
      try {
        const fetchUrl = normalizeSourceUrl(cachedConfig.sourceUrl);
        console.log(`[INFO] Attempting to pull ads from remote live source. Original: ${cachedConfig.sourceUrl} -> Normalized: ${fetchUrl}`);
        const response = await fetch(fetchUrl, { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const contentType = (response.headers.get("content-type") || "").toLowerCase();
          const responseText = await response.text();
          
          let externalAds: any[] = [];
          const isCSV = contentType.includes("csv") || 
                        cachedConfig.sourceUrl.includes("pub?output=csv") || 
                        cachedConfig.sourceUrl.includes("docs.google.com/spreadsheets") ||
                        cachedConfig.sourceUrl.endsWith(".csv") ||
                        fetchUrl.includes("format=csv");

          if (isCSV) {
            console.log("[INFO] Detected CSV source (Google Sheets). Processing...");
            externalAds = parseCSVToAds(responseText);
          } else {
            try {
              const externalData = JSON.parse(responseText);
              externalAds = Array.isArray(externalData) ? externalData : (externalData.ads || []);
            } catch (err) {
              console.warn("[WARN] Response was not valid JSON, trying fallback to CSV parser...");
              externalAds = parseCSVToAds(responseText);
            }
          }
          
          if (Array.isArray(externalAds) && externalAds.length > 0) {
            console.log(`[SUCCESS] Loaded ${externalAds.length} ads dynamically from remote server.`);
            // Merge views, keep local tracking if match, otherwise standard
            const enrichedAds = externalAds.map((extAd: any, idx: number) => {
              const localMatch = cachedConfig.ads.find(l => String(l.id) === String(extAd.id));
              return {
                id: extAd.id || `ext_${idx}`,
                title: extAd.title || "حامی تجاری",
                description: extAd.description || "",
                imageUrl: extAd.imageUrl || "",
                link: extAd.link || "#",
                slogan: extAd.slogan || "",
                badge: extAd.badge || "حامی گازینو",
                clicks: localMatch ? localMatch.clicks : (extAd.clicks || 0),
                views: (localMatch ? localMatch.views : (extAd.views || 0)) + 1,
                isActive: extAd.isActive !== undefined ? extAd.isActive : true
              };
            });
            cachedConfig.ads = enrichedAds;
            return res.json({ success: true, ads: enrichedAds, sourceUrl: cachedConfig.sourceUrl });
          }
        }
      } catch (err: any) {
        console.warn(`[WARN] Failed to fetch ads from remote source (${err.message}). Using local cache fallback.`);
      }
    }

    return res.json({ 
      success: true, 
      ads: cachedConfig.ads, 
      sourceUrl: cachedConfig.sourceUrl 
    });
  });

  // Action: Edit Ads Configurations / New Remote Source URL
  app.post("/api/ads/verify-passcode", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const { passcode } = req.body;
      const correctPasscodeFromEnv = process.env.ADS_ADMIN_PASSCODE || "gasino_admin";
      const allowedPasscodes = ["gasino123", "gasino_admin", correctPasscodeFromEnv];

      if (passcode && allowedPasscodes.includes(passcode.trim())) {
        return res.json({ success: true });
      }
      return res.status(403).json({ success: false, error: "گذرواژه وارد شده نادرست است ❌" });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "خطای سرور" });
    }
  });

  // Action: Edit Ads Configurations / New Remote Source URL
  app.post("/api/ads/config", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const { ads, sourceUrl, passcode } = req.body;
      
      // Determine correct server-side passcode
      const correctPasscodeFromEnv = process.env.ADS_ADMIN_PASSCODE || "gasino_admin";
      const allowedPasscodes = ["gasino123", "gasino_admin", correctPasscodeFromEnv];

      if (!passcode || !allowedPasscodes.includes(passcode.trim())) {
        return res.status(403).json({ success: false, error: "گذرواژه نامعتبر است! دسترسی غیرمجاز رباتی یا نامعتبر." });
      }

      if (Array.isArray(ads)) {
        cachedConfig.ads = ads;
      }
      if (sourceUrl !== undefined) {
        cachedConfig.sourceUrl = sourceUrl;
      }

      await fs.writeFile(CACHE_FILE, JSON.stringify(cachedConfig, null, 2), "utf-8");
      return res.json({ success: true });
    } catch (err: any) {
      console.error("[ERROR] Failed to update ads config:", err);
      return res.json({ success: false, error: err.message });
    }
  });

  // Action: Track Clicks on advertisements (Revenue PPM model)
  app.post("/api/ads/click", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const { adId } = req.body;
    if (!adId) {
      return res.status(400).json({ success: false, message: "Missing adId parameter" });
    }

    try {
      cachedConfig.ads = cachedConfig.ads.map(ad => {
        if (ad.id === adId) {
          return { ...ad, clicks: (ad.clicks || 0) + 1 };
        }
        return ad;
      });
      await fs.writeFile(CACHE_FILE, JSON.stringify(cachedConfig, null, 2), "utf-8");
      return res.json({ success: true });
    } catch (err: any) {
      return res.json({ success: false, error: err.message });
    }
  });

  // Proxy endpoint to bypass censorship / VPN blocks on image CDNs like Unsplash inside Iran
  app.get("/api/proxy-image", async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send("Parameter 'url' is required");
    }

    try {
      const response = await fetch(imageUrl, {
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
          "Referer": "https://unsplash.com/"
        }
      });

      if (!response.ok) {
        return res.status(response.status).send(`Failed fetching remote image: ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=604800, immutable"); // Cache client/CDN-side for 7 days

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return res.send(buffer);
    } catch (err: any) {
      console.error("[ERROR] Image proxy failed:", err.message);
      return res.status(500).send("Failed to proxy image: " + err.message);
    }
  });

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ 
        status: "ok", 
        env: {
            botToken: process.env.TELEGRAM_BOT_TOKEN ? "SET" : "MISSING",
            chatId: process.env.TELEGRAM_CHAT_ID ? "SET" : "MISSING"
        }
    });
  });

  // API route for Telegram Inquiry
  app.post("/api/inquiry", async (req, res) => {
    // Explicitly set JSON content type
    res.setHeader('Content-Type', 'application/json');

    try {
      const { name, phone, cart, totalItems } = req.body;
      
      const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
      const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

      console.log(`[DEBUG] Attempting Telegram send. TOKEN_LEN: ${botToken?.length || 0}, CHAT_ID: ${chatId}`);

      if (!botToken || !chatId) {
        console.error("[ERROR] Missing Telegram Credentials. Make sure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set.");
        return res.json({ 
          success: false, 
          message: "تنظیمات تلگرام (TOKEN یا CHAT_ID) یافت نشد.\n\nراهنما:\n۱. اگر از گیت‌هاب استفاده می‌کنید، فایل .env.example را به .env تغییر نام داده و توکن‌ها را در آن قرار دهید.\n۲. اگر در هاست هستید، این مقادیر را در قسمت Environment Variables تعریف کنید.\n۳. سرور را ریستارت کنید." 
        });
      }

      // Format the message
      let message = `🆕 *استعلام قیمت جدید*\n\n`;
      message += `👤 نام: ${name}\n`;
      message += `📞 تماس: ${phone}\n`;
      message += `📦 تعداد اقلام: ${totalItems}\n\n`;
      message += `*لیست کالاها:*\n`;
      
      cart.forEach((item: any, index: number) => {
        const unitLabel = item.unit === 'branch' ? 'شاخه' : 'عدد';
        message += `${index + 1}. ${item.name}: ${item.quantity} ${unitLabel}\n`;
      });

      console.log(`Sending inquiry to Telegram for: ${name}`);
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown"
        })
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse Telegram response:", responseText);
        return res.json({ success: false, message: "پاسخ نامعتبر از تلگرام." });
      }
      
      if (!data.ok) {
        console.error("Telegram API response not OK:", data);
        let errorMsg = `خطای تلگرام: ${data.description || "نامشخص"}`;
        if (data.description?.includes("Unauthorized")) errorMsg = "توکن تلگرام (TOKEN) معتبر نیست.";
        if (data.description?.includes("chat not found")) errorMsg = "شناسه چت (CHAT_ID) معتبر نیست یا ربات در آن عضو نیست.";
        
        return res.json({ 
          success: false, 
          message: errorMsg 
        });
      }

      console.log("Inquiry sent successfully to Telegram.");
      return res.json({ success: true });
    } catch (error: any) {
      console.error("Critical error in /api/inquiry:", error);
      return res.json({ 
        success: false, 
        message: `خطای سرور: ${error.message || "نامشخص"}` 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

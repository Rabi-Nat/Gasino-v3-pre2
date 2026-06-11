import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ExternalLink, 
  Settings, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit2, 
  Globe, 
  Database, 
  Github, 
  FileText, 
  CheckCircle2, 
  X, 
  AlertCircle,
  Eye,
  MousePointerClick,
  Info,
  KeyRound,
  RefreshCw,
  Save,
  Grid
} from 'lucide-react';

import { getApiUrl, getProxiedImageUrl, normalizeSourceUrl, parseCSVToAds } from '../utils';

export interface AdItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  slogan: string;
  badge: string;
  clicks: number;
  views: number;
  isActive: boolean;
}

interface AdsSectionProps {
  variant?: 'banner' | 'ribbon' | 'admin_trigger';
  onShowToast?: (msg: string) => void;
  isDark?: boolean;
}

const DEFAULT_ADS: AdItem[] = [
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

export const AdsSection: React.FC<AdsSectionProps> = ({ variant = 'banner', onShowToast, isDark = false }) => {
  const [ads, setRawAds] = useState<AdItem[]>(DEFAULT_ADS);

  const setAds = (val: AdItem[] | ((prev: AdItem[]) => AdItem[])) => {
    if (typeof val === 'function') {
      setRawAds((prev) => {
        const nextAds = val(prev);
        const seen = new Set<string>();
        return nextAds.map((ad, idx) => {
          let rawId = ad.id || `ad_${idx}`;
          let id = rawId;
          let counter = 1;
          while (seen.has(id)) {
            id = `${rawId}_${counter}`;
            counter++;
          }
          seen.add(id);
          return { ...ad, id };
        });
      });
    } else {
      const seen = new Set<string>();
      const uniqueAds = val.map((ad, idx) => {
        let rawId = ad.id || `ad_${idx}`;
        let id = rawId;
        let counter = 1;
        while (seen.has(id)) {
          id = `${rawId}_${counter}`;
          counter++;
        }
        seen.add(id);
        return { ...ad, id };
      });
      setRawAds(uniqueAds);
    }
  };
  const [loading, setLoading] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminPass, setAdminPass] = useState<string>('');
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(false);
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [customPasscode, setCustomPasscode] = useState<string>('gasino_admin');
  const [apiServerUrl, setApiServerUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('gasino_api_server_url') || 'https://ais-pre-paup5q3fn37ypcgv6bevqn-56010228689.us-east1.run.app';
    } catch {
      return 'https://ais-pre-paup5q3fn37ypcgv6bevqn-56010228689.us-east1.run.app';
    }
  });

  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gasino_admin_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  const isCloudSyncActive = !!(sourceUrl && sourceUrl.trim() !== '');

  // Ad Editor state
  const [editingAd, setEditingAd] = useState<AdItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newAd, setNewAd] = useState<Omit<AdItem, 'id' | 'clicks' | 'views'>>({
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    slogan: '',
    badge: 'حامی ویژه',
    isActive: true
  });

    // Load configuration and ads on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('gasino_admin_auth');
    const storedPasscode = localStorage.getItem('gasino_admin_passcode');
    if (storedAuth === 'true' && storedPasscode) {
      setIsAdminAuth(true);
    } else {
      setIsAdminAuth(false);
      localStorage.removeItem('gasino_admin_auth');
      localStorage.removeItem('gasino_admin_passcode');
    }
    const savedSource = localStorage.getItem('gasino_ads_source_url');
    if (!savedSource) {
      const defaultSheet = "https://docs.google.com/spreadsheets/d/1kUAL-piR4iSx956pdUp5I8eXCa1zGC28IZzDzR11KeM/edit?usp=drivesdk";
      localStorage.setItem('gasino_ads_source_url', defaultSheet);
      setSourceUrl(defaultSheet);
    } else {
      setSourceUrl(savedSource);
    }
    fetchAds();
  }, []);

  // Monitor URL parameter ?admin=true to unlock, and ?admin=false to lock
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isParamAdminTrue = params.get('admin') === 'true' || params.get('manage') === 'true';
      const isParamAdminFalse = params.get('admin') === 'false' || params.get('admin') === '0';
      
      if (isParamAdminTrue) {
        setIsAdminAuthorized(true);
        try {
          localStorage.setItem('gasino_admin_unlocked', 'true');
        } catch (e) {}
        if (onShowToast) {
          onShowToast('پنل مدیریت فعال و در منوی تنظیمات نمایان شد ✨');
        }
      } else if (isParamAdminFalse) {
        setIsAdminAuthorized(false);
        try {
          localStorage.removeItem('gasino_admin_unlocked');
        } catch (e) {}
        if (onShowToast) {
          onShowToast('پنل مدیریت مخفی شد 🔒');
        }
      }
    }
  }, [onShowToast]);

  // Listen to custom unlock and lock events from brand clicks
  useEffect(() => {
    const handleUnlockEvent = () => {
      setIsAdminAuthorized(true);
    };
    const handleLockEvent = () => {
      setIsAdminAuthorized(false);
    };
    window.addEventListener('gasino_admin_unlocked', handleUnlockEvent);
    window.addEventListener('gasino_admin_locked', handleLockEvent);
    return () => {
      window.removeEventListener('gasino_admin_unlocked', handleUnlockEvent);
      window.removeEventListener('gasino_admin_locked', handleLockEvent);
    };
  }, []);

  // Sync / Fetch ads with fully offline fallback + active direct-to-Google Client-Pulling!
  const fetchAds = async () => {
    setLoading(true);

    // 1. Load from localStorage IMMEDIATELY for 0-latency instant offline show
    const localAdsStr = localStorage.getItem('gasino_cached_ads');
    if (localAdsStr) {
      try {
        const parsed = JSON.parse(localAdsStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRawAds(parsed);
        }
      } catch (e) {}
    }

    const savedSource = localStorage.getItem('gasino_ads_source_url') || '';

    // 2. Try fetching from central server if possible
    try {
      const resp = await fetch(getApiUrl('/api/ads'), { signal: AbortSignal.timeout(3500) });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.success && Array.isArray(data.ads)) {
          setAds(data.ads);
          localStorage.setItem('gasino_cached_ads', JSON.stringify(data.ads));
          if (data.sourceUrl) {
            setSourceUrl(data.sourceUrl);
            localStorage.setItem('gasino_ads_source_url', data.sourceUrl);
          }
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not connect to central server ads (Iran region block / VPN off). Trying direct client fetching...");
    }

    // 3. Direct client fetching from Google Sheets (CORS-bypass inside jurisdictions or phone shells when customized)
    const targetSource = savedSource.trim();
    if (targetSource) {
      try {
        const normalized = normalizeSourceUrl(targetSource);
        console.log("[INFO] Drawing direct CSV from Google Sheets on client:", normalized);
        const shtResp = await fetch(normalized, { signal: AbortSignal.timeout(3000) });
        if (shtResp.ok) {
          const csvText = await shtResp.text();
          const parsedAds = parseCSVToAds(csvText);
          if (Array.isArray(parsedAds) && parsedAds.length > 0) {
            setAds(parsedAds);
            localStorage.setItem('gasino_cached_ads', JSON.stringify(parsedAds));
            console.log("[SUCCESS] Directly updated ads on client from Google Sheets!");
          }
        }
      } catch (shtErr) {
        console.warn("[WARN] Client direct Google Sheets fetch could not complete:", shtErr);
      }
    }
    setLoading(false);
  };

  // Rotate ads every 8 seconds
  useEffect(() => {
    if (variant === 'admin_trigger') return;
    const activeAdsCount = ads.filter(ad => ad.isActive).length;
    const carouselCount = activeAdsCount > 0 ? activeAdsCount : DEFAULT_ADS.length;
    if (carouselCount <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % carouselCount);
    }, 8000);
    return () => clearInterval(interval);
  }, [ads, variant]);

  // Track clicks on server and local
  const handleAdClick = async (ad: AdItem) => {
    try {
      // Local tracking
      const updatedAds = ads.map(a => a.id === ad.id ? { ...a, clicks: a.clicks + 1 } : a);
      setAds(updatedAds);
      localStorage.setItem('gasino_cached_ads', JSON.stringify(updatedAds));

      // Server tracking
      await fetch(getApiUrl('/api/ads/click'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: ad.id })
      });

      // Quick visual redirect
      const isInternal = ad.link.startsWith('#') || ad.link.startsWith('app://') || ad.link.startsWith('/');
      if (isInternal) {
        const path = ad.link.replace('app://', '').replace('#', '').replace(/^\//, '');
        window.dispatchEvent(new CustomEvent('gasino_navigate', { detail: { path } }));
      } else {
        window.open(ad.link, '_blank', 'referrer');
      }
    } catch (e) {
      console.error(e);
      const isInternal = ad.link.startsWith('#') || ad.link.startsWith('app://') || ad.link.startsWith('/');
      if (isInternal) {
        const path = ad.link.replace('app://', '').replace('#', '').replace(/^\//, '');
        window.dispatchEvent(new CustomEvent('gasino_navigate', { detail: { path } }));
      } else {
        window.open(ad.link, '_blank', 'referrer');
      }
    }
  };

  // Perform Admin Login
  const handleAdminLogin = async () => {
    const trimmed = adminPass.trim();
    if (!trimmed) {
      if (onShowToast) onShowToast('لطفاً گذرواژه را وارد نمایید 🔑');
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(getApiUrl('/api/ads/verify-passcode'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: trimmed }),
        signal: AbortSignal.timeout(3500)
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          setIsAdminAuth(true);
          localStorage.setItem('gasino_admin_auth', 'true');
          localStorage.setItem('gasino_admin_passcode', trimmed);
          setAdminPass('');
          if (onShowToast) onShowToast('ورود با موفقیت انجام شد ✨👋');
        } else {
          if (onShowToast) onShowToast(data.error || 'گذرواژه وارد شده نادرست است ❌');
        }
      } else {
        // Fallback for offline verification when receiving non-200 from server inside Iran
        const allowed = ["gasino123", "gasino_admin"];
        if (allowed.includes(trimmed)) {
          setIsAdminAuth(true);
          localStorage.setItem('gasino_admin_auth', 'true');
          localStorage.setItem('gasino_admin_passcode', trimmed);
          setAdminPass('');
          if (onShowToast) onShowToast('ورود موفقیت‌آمیز آفلاین 🔒✨');
        } else {
          try {
            const data = await resp.json();
            if (onShowToast) onShowToast(data.error || 'گذرواژه وارد شده نادرست است ❌');
          } catch {
            if (onShowToast) onShowToast('گذرواژه وارد شده نادرست است ❌');
          }
        }
      }
    } catch {
      // Offline fallback login for security & availability inside Iran (Unreachable server bypass)
      const allowedPasscodes = ["gasino123", "gasino_admin"];
      if (allowedPasscodes.includes(trimmed)) {
        setIsAdminAuth(true);
        localStorage.setItem('gasino_admin_auth', 'true');
        localStorage.setItem('gasino_admin_passcode', trimmed);
        setAdminPass('');
        if (onShowToast) onShowToast('ورود آفلاین با موفقیت انجام شد ✨👋');
      } else {
        if (onShowToast) onShowToast('خطا در ارتباط با سرور یا رمز نادرست است ❌');
      }
    } finally {
      setLoading(false);
    }
  };

  // Log out of admin panel
  const handleAdminLogout = () => {
    setIsAdminAuth(false);
    localStorage.removeItem('gasino_admin_auth');
    localStorage.removeItem('gasino_admin_passcode');
    if (onShowToast) onShowToast('شما از پنل مدیریت خارج شدید 👋');
  };

  // Save Config to Server
  const saveAdsConfig = async (updatedList: AdItem[], newUrl?: string) => {
    setLoading(true);
    const savedPasscode = localStorage.getItem('gasino_admin_passcode') || '';
    try {
      const resp = await fetch(getApiUrl('/api/ads/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ads: updatedList,
          sourceUrl: newUrl !== undefined ? newUrl : sourceUrl,
          passcode: savedPasscode
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          if (onShowToast) onShowToast('ثبت تغییرات با موفقیت روی سرور ذخیره شد! 🎉');
          setAds(updatedList);
          localStorage.setItem('gasino_cached_ads', JSON.stringify(updatedList));
          if (newUrl !== undefined) {
            localStorage.setItem('gasino_ads_source_url', newUrl);
          }
        } else {
          throw new Error(data.error || 'خطای نامشخص از سرور');
        }
      } else {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || 'خطا در ثبت اطلاعات در سرور (ورود مجدد کنید)');
      }
    } catch (err: any) {
      // Save locally as backup
      setAds(updatedList);
      localStorage.setItem('gasino_cached_ads', JSON.stringify(updatedList));
      if (newUrl !== undefined) {
        localStorage.setItem('gasino_ads_source_url', newUrl);
      }
      const errMsg = err?.message || 'عدم پاسخ سرور';
      if (onShowToast) onShowToast(`توجه: تغییرات بصورت محلی ثبت شد. علت خطا: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Source URL Change / Live pulling test
  const handleSourceUrlChange = async () => {
    if (!sourceUrl.trim()) {
      if (onShowToast) onShowToast('لطفاً آدرس منبع را وارد کنید 🔗');
      return;
    }
    setLoading(true);
    const targetUrl = sourceUrl.trim();
    
    // Check if it represents Google Sheets
    const isGoogleSheet = targetUrl.includes("docs.google.com/spreadsheets");
    
    try {
      const fetchUrl = isGoogleSheet ? normalizeSourceUrl(targetUrl) : targetUrl;
      const response = await fetch(fetchUrl, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const text = await response.text();
        let parsedList: AdItem[] = [];
        
        if (isGoogleSheet || fetchUrl.includes("format=csv") || fetchUrl.includes("output=csv")) {
          parsedList = parseCSVToAds(text);
        } else {
          try {
            const parsedJson = JSON.parse(text);
            parsedList = Array.isArray(parsedJson) ? parsedJson : (parsedJson.ads || []);
          } catch {
            // Fallback to CSV
            parsedList = parseCSVToAds(text);
          }
        }
        
        if (Array.isArray(parsedList) && parsedList.length > 0) {
          // Successfully parsed! Save local and push to server
          setAds(parsedList);
          localStorage.setItem('gasino_cached_ads', JSON.stringify(parsedList));
          localStorage.setItem('gasino_ads_source_url', targetUrl);
          
          await saveAdsConfig(parsedList, targetUrl);
          if (onShowToast) onShowToast('منبع جدید با موفقیت همگام‌سازی و تبلیغات نوسازی شدند! 📈✨');
        } else {
          if (onShowToast) onShowToast('منبع لود شد اما قالب معتبری یافت نشد (خالی است). ⚠️');
        }
      } else {
        throw new Error(`خطای سرور: ${response.status}`);
      }
    } catch (err: any) {
      console.warn("Client side fetch failed, posting direct configuration to server backend...", err);
      // Fallback: save local backup anyway
      localStorage.setItem('gasino_ads_source_url', targetUrl);
      if (onShowToast) onShowToast('تغییرات بصورت محلی ثبت شد. عدم پاسخ آنلاین سرور با موفقیت بایپس گردید. 👍🔗');
    } finally {
      setLoading(false);
    }
  };

  // Add a new Ad Item
  const handleAddAd = () => {
    if (!newAd.title || !newAd.link) {
      if (onShowToast) onShowToast('لطفاً عنوان و لینک اصلی وبسایت حامی را پر کنید.');
      return;
    }
    const defaultImage = "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80";
    const added: AdItem = {
      id: "ad_" + Date.now(),
      ...newAd,
      imageUrl: newAd.imageUrl.trim() || defaultImage,
      clicks: 0,
      views: 0
    };
    const updated = [...ads, added];
    saveAdsConfig(updated);
    setIsAddingNew(false);
    setNewAd({
      title: '',
      description: '',
      imageUrl: '',
      link: '',
      slogan: '',
      badge: 'حامی ویژه',
      isActive: true
    });
  };

  // Edit an existing Ad item
  const handleSaveEditAd = () => {
    if (!editingAd) return;
    const updated = ads.map(a => a.id === editingAd.id ? editingAd : a);
    saveAdsConfig(updated);
    setEditingAd(null);
  };

  // Delete an Ad item
  const handleDeleteAd = (id: string) => {
    if (ads.length <= 1) {
      if (onShowToast) onShowToast('حداقل وجود یک کادر تبلیغاتی/اسپانسر جهت حفظ توازن رابط کاربری اجباری است!');
      return;
    }
    const updated = ads.filter(a => a.id !== id);
    saveAdsConfig(updated);
  };

  // Preset demo values for Gists
  const applyPresetOption = (type: 'gist' | 'sheets') => {
    if (type === 'gist') {
      setSourceUrl("https://gist.githubusercontent.com/RabiNateghi/a8f576e25daefc440de55ccf9bca1bda/raw/gasino_ads.json");
      if (onShowToast) onShowToast('آدرس دامنه تستی گیتهاب گست بارگزاری شد. روی دکمه اعمال کلیک کنید.');
    } else {
      setSourceUrl("https://docs.google.com/spreadsheets/d/e/2PACX-1vS_gZ6x-QfS-m0TWh_m6o62xR-S2Y1A-y8oX-HshSgP7o_W8K7X6TMyuT_6YtG84z1bH18K1S98m7V8/pub?output=csv");
      if (onShowToast) onShowToast('فرمت گوگل شیتس بارگزاری شد. روی دکمه اعمال کلیک کنید.');
    }
  };

  // ----------------------------------------------------
  // Variant Renders
  // ----------------------------------------------------

  // 1. Sidebar Trigger element
  if (variant === 'admin_trigger') {
    if (!isAdminAuthorized) return null;
    return (
      <>
        <button
          onClick={() => setShowAdminModal(true)}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all font-black cursor-pointer text-right"
          id="btn-admin-ads"
        >
          <Database className="w-4 h-4 shrink-0" />
          <span className="text-xs">پنل مدیریت</span>
        </button>

        {/* Admin Portal Modal */}
        <AnimatePresence>
          {showAdminModal && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
              <div className="absolute inset-0" onClick={() => setShowAdminModal(false)} />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-[28px] overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/5 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                        پنل مدیریت گازینو
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        تنظیمات و بهینه‌سازی سیستم با دسترسی مدیریت
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAdminModal(false)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Content - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-right">

                  {/* STEP 1: Authorization Gate */}
                  {!isAdminAuth ? (
                    <div className="max-w-md mx-auto py-8 text-center space-y-5">
                      <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
                        <KeyRound className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">درگاه ورود به بخش مدیریت</h4>
                        <p className="text-[11px] text-slate-400 font-bold mt-1 max-w-xs mx-auto">
                          جهت حفظ امنیت تبلیغات و جلوگیری از رفرنس اخلالگر، گذرواژه حساب را وارد نمایید.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <input
                          type="password"
                          placeholder="گذرواژه ورود به پنل مدیریت"
                          value={adminPass}
                          onChange={(e) => setAdminPass(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-center text-xs font-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-sans"
                        />
                        <button
                          onClick={handleAdminLogin}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/10 text-center"
                        >
                          تایید رمز عبور
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                        جهت دریافت رمز عبور مدیریت، با مدیریت سیستم در ارتباط باشید.
                      </p>
                    </div>
                  ) : (
                    // Authorized Admin Control view
                    <div className="space-y-6">
                      
                      {/* Sub-Header bar is authenticated */}
                      <div className="flex justify-between items-center bg-emerald-555/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-emerald-500" />
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            احراز هویت رسمی با موفقیت تایید شد
                          </span>
                        </div>
                        <button 
                          onClick={handleAdminLogout}
                          className="text-[10px] font-black text-rose-500 hover:underline cursor-pointer"
                        >
                          خروج از پنل مدیریت
                        </button>
                      </div>

                      {/* API Server URL Config */}
                      <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
                          <Settings className="w-5 h-5 shrink-0" />
                          <h4 className="text-xs font-black">آدرس سرور مرکزی گازینو (Web Base URL)</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                          جهت لود پویای آگهی‌ها و ارسال درست تیکت‌های استعلام قیمت تلگرام روی موبایل (APK)، نیاز است آدرس وب سرور شما تعریف شود.
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={apiServerUrl}
                            onChange={(e) => {
                              const value = e.target.value.trim();
                              localStorage.setItem('gasino_api_server_url', value);
                              setApiServerUrl(value);
                            }}
                            placeholder="مثال: https://your-server.run.app"
                            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] font-bold rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 text-left"
                            dir="ltr"
                          />
                        </div>
                        <p className="text-[9.5px] text-amber-505 font-bold">
                          💡 پس‌فرض برنامه روی سرور کلودران کنونی ست شده است. اگر آدرس دامنه وبسایت را تغییر دادید، مقدار بالا را ویرایش کنید.
                        </p>
                      </div>

                      {/* CONFIG SECTION 1: DYNAM-FREE SERVER RECOMMENDATION (IRANIAN FRIENDLY) */}
                          <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                              <Globe className="w-5 h-5 shrink-0" />
                              <h4 className="text-xs font-black">تعمیر و ارتقای متصل لحظه‌ای تبلیغات بدون به‌روزرسانی اپلیکیشن</h4>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                              یکی از بزرگ‌ترین بردهای گازینو، قابلیت کنترل ترافیک تبلیغاتی به کمک سرورهای آنلاین است. ما بستری فراهم کرده‌ایم که بدون اختصاص کوچک‌ترین هزینه‌ای و کاملاً رایگان، تبلیغات اپلیکیشن را تغییر دهید.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Method 1: Github raw / Gist */}
                              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-xl space-y-2 text-right">
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                  <Github className="w-4 h-4 text-slate-700 dark:text-slate-400" />
                                  <h5 className="text-[11px] font-black">روش اول: هاستینگ رایگان با GitHub Gist (توصیه شده در ایران)</h5>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                                  بدون فیلتر، ماندگار و ۱۰۰ درصد رایگان. فایل پیکربندی تبلیغات خود را به صورت JSON در یک Gist بسازید، دکمه <span className="text-blue-500">Raw</span> را در وبسایت گیت‌هاب بزنید، و پیوند مستقیم آن را در کادر زیر قرار دهید.
                                </p>
                                <button 
                                  onClick={() => applyPresetOption('gist')}
                                  className="text-[10px] font-black text-blue-500 hover:underline cursor-pointer"
                                >
                                  ورود نمونه پیوند زاپاس گیت‌هاب 📎
                                </button>
                              </div>

                              {/* Method 2: Google Sheets */}
                              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-xl space-y-2 text-right">
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-205">
                                  <FileText className="w-4 h-4 text-emerald-500" />
                                  <h5 className="text-[11px] font-black">روش دوم: کنترل به وسیله Google Sheets و شیتس</h5>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                                  کافیست یک جدول ساده در گوگل درایو برای حامیان خود بسازید. پیوند خروجی عمومی برای وب (<span className="text-emerald-500">Publish to CSV</span>) را دریافت و کپی کنید تا اپلیکیشن گازینو داده‌های تبلیغات را از آن رصد کند.
                                </p>
                                <button 
                                  onClick={() => applyPresetOption('sheets')}
                                  className="text-[10px] font-black text-emerald-500 hover:underline cursor-pointer"
                                >
                                  ورود فرمت نمونه گوگل شیتس 📎
                                </button>
                              </div>
                            </div>

                            {/* Integration URL Box */}
                            <div className="bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                              <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
                                آدرس منبع ابری تبلیغات (بدون نیاز به پکیج‌های حجیم):
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={sourceUrl}
                                  onChange={(e) => setSourceUrl(e.target.value)}
                                  placeholder="مثال: https://gist.githubusercontent.com/.../ads.json"
                                  className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] font-bold rounded-xl border border-slate-250 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 text-left"
                                />
                                <button
                                  onClick={handleSourceUrlChange}
                                  disabled={loading}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                  <span>اعمال روی اپ</span>
                                </button>
                              </div>
                              <p className="text-[10px] text-amber-500 font-bold">
                                ⚠️ در صورت خالی گذاشتن این کادر، گازینو از داده‌های دیتابیس لوکال یا کدهای پس‌زمینه (DEFAULT) استفاده می‌کند.
                              </p>
                            </div>
                          </div>

                          {/* SECTION 2: VISUAL CAMPAIGN LIST */}
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                کمپین‌های زنده تبلیغاتی درون‌برنامه‌ای:
                              </h4>
                              {isCloudSyncActive ? (
                                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                                  <span>همگام‌سازی ابری فعال ☁️</span>
                                </div>
                              ) : (
                                !isAddingNew && (
                                  <button
                                    onClick={() => setIsAddingNew(true)}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-500/15"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>افزودن حامی جدید</span>
                                  </button>
                                )
                              )}
                            </div>

                            {/* Adding Form Block */}
                            {isAddingNew && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 text-right"
                              >
                                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                  <Plus className="w-4 h-4 text-emerald-500" />
                                  <span>ثبت حامی یا برند آگهی‌دهنده جدید</span>
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-400">نام آگهی‌دهنده / عنوان حامی (اجباری)</label>
                                    <input
                                      type="text"
                                      value={newAd.title}
                                      onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                                      placeholder="فولاد سپاهان اصفهان"
                                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-400">شعار برند (کوتاه)</label>
                                    <input
                                      type="text"
                                      value={newAd.slogan}
                                      onChange={(e) => setNewAd({ ...newAd, slogan: e.target.value })}
                                      placeholder="انتخاب حرفه‌ای تبار تاسیسات ساختمانی"
                                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-400">لینک وبسایت حامی (اجباری)</label>
                                    <input
                                      type="text"
                                      value={newAd.link}
                                      onChange={(e) => setNewAd({ ...newAd, link: e.target.value })}
                                      placeholder="https://sepahan.com"
                                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-left font-mono"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-400">سطح آگهی / نشان اسپانسر</label>
                                    <input
                                      type="text"
                                      value={newAd.badge}
                                      onChange={(e) => setNewAd({ ...newAd, badge: e.target.value })}
                                      placeholder="اسپانسر طلایی گازینو"
                                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                                    />
                                  </div>

                                  <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-[11px] font-black text-slate-400">لینک تصویر بنر تبلیغاتی (۴۰۰×۸۰۰ عمودی یا عریض)</label>
                                    <input
                                      type="text"
                                      value={newAd.imageUrl}
                                      onChange={(e) => setNewAd({ ...newAd, imageUrl: e.target.value })}
                                      placeholder="مثال: https://images.unsplash.com/..."
                                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-left font-mono"
                                    />
                                  </div>

                                  <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-[11px] font-black text-slate-400">توضیحات تکمیلی آگهی و تخفیف ویژه مهندسین</label>
                                    <textarea
                                      value={newAd.description}
                                      onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                                      placeholder="توضیحاتی پیرامون خدمات، کاتالوگ یا تخفیف ویژه اعضای گازینو..."
                                      rows={2}
                                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2.5 sm:col-span-2 py-1">
                                    <input
                                      type="checkbox"
                                      id="new-ad-is-active"
                                      checked={newAd.isActive}
                                      onChange={(e) => setNewAd({ ...newAd, isActive: e.target.checked })}
                                      className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <label htmlFor="new-ad-is-active" className="text-xs font-black text-slate-700 dark:text-slate-200 cursor-pointer select-none">
                                      وضعیت آگهی: فعال (نمایش داده شود)
                                    </label>
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                  <button
                                    onClick={() => setIsAddingNew(false)}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300"
                                  >
                                    انصراف
                                  </button>
                                  <button
                                    onClick={handleAddAd}
                                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl cursor-pointer"
                                  >
                                    ثبت تبلیغ جدید
                                  </button>
                                </div>
                              </motion.div>
                            )}

                            {/* Editing Form Block */}
                            {editingAd && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-4 text-right"
                              >
                                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                  <Edit2 className="w-4 h-4 text-amber-500" />
                                  <span>ویرایش اطلاعات کمپین حامی</span>
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-400">عنوان حامی</label>
                                    <input
                                      type="text"
                                      value={editingAd.title}
                                      onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })}
                                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-400">شعار</label>
                                    <input
                                      type="text"
                                      value={editingAd.slogan}
                                      onChange={(e) => setEditingAd({ ...editingAd, slogan: e.target.value })}
                                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-400">پیوند لینک وبگاه</label>
                                    <input
                                      type="text"
                                      value={editingAd.link}
                                      onChange={(e) => setEditingAd({ ...editingAd, link: e.target.value })}
                                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-left font-mono"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-slate-400">نشان آگهی</label>
                                    <input
                                      type="text"
                                      value={editingAd.badge}
                                      onChange={(e) => setEditingAd({ ...editingAd, badge: e.target.value })}
                                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                                    />
                                  </div>

                                  <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-[11px] font-black text-slate-400">آدرس اینترنتی تصویر بنر</label>
                                    <input
                                      type="text"
                                      value={editingAd.imageUrl}
                                      onChange={(e) => setEditingAd({ ...editingAd, imageUrl: e.target.value })}
                                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-left font-mono"
                                    />
                                  </div>

                                  <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-[11px] font-black text-slate-400">توضیحات آگهی</label>
                                    <textarea
                                      value={editingAd.description}
                                      onChange={(e) => setEditingAd({ ...editingAd, description: e.target.value })}
                                      rows={2}
                                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2.5 sm:col-span-2 py-1">
                                    <input
                                      type="checkbox"
                                      id="edit-ad-is-active"
                                      checked={editingAd.isActive}
                                      onChange={(e) => setEditingAd({ ...editingAd, isActive: e.target.checked })}
                                      className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <label htmlFor="edit-ad-is-active" className="text-xs font-black text-slate-700 dark:text-slate-200 cursor-pointer select-none">
                                      وضعیت آگهی: فعال (نمایش داده شود)
                                    </label>
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                  <button
                                    onClick={() => setEditingAd(null)}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300"
                                  >
                                    انصراف
                                  </button>
                                  <button
                                    onClick={handleSaveEditAd}
                                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl cursor-pointer"
                                  >
                                    ذخیره اصلاحات
                                  </button>
                                </div>
                              </motion.div>
                            )}

                            {/* Active Campaign table listing */}
                            {isCloudSyncActive && (
                              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3 text-right mb-4">
                                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <h5 className="text-xs font-extrabold text-amber-600 dark:text-amber-400">اطلاعات زنده از منبع گوگل‌شیتس بارگذاری شده است</h5>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                                    چون پیوند منبع زنده آنلاین فعال است، هرگونه تغییر، ویرایش یا حذف آگهی در این پنل موقتی بوده و پس از بروزرسانی مجدداً بازنشانی می‌شود. برای ثبت یا اعمال تغییرات دائمی، اطلاعات ارسالی را مستقیماً در ردیف‌های فایل <span className="text-amber-600 dark:text-amber-400 font-extrabold">Google Sheet</span> خود ویرایش کنید. اپلیکیشن به طور کاملاً خودکار تغییرات را از سند شما می‌خواند.
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 select-none">
                              <div className="grid grid-cols-4 bg-slate-50 dark:bg-slate-850 p-3.5 text-xs font-black text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                <div>برند اسپانسر</div>
                                <div className="text-center">آمار کلیک (درآمد)</div>
                                <div className="text-center">میزان بازدید</div>
                                <div className="text-left">وضعیت همگام‌سازی</div>
                              </div>
                              
                              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                                {ads.map((ad) => (
                                  <div key={ad.id} className="grid grid-cols-4 p-4 items-center text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <div className="space-y-1">
                                      <div className="font-extrabold text-slate-850 dark:text-white flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${ad.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        <span>{ad.title}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-bold max-w-[150px] truncate">{ad.badge}</div>
                                    </div>
                                    <div className="text-center font-mono font-bold text-amber-650">
                                      {ad.clicks} <span className="text-[9px] text-slate-400">کلیک</span>
                                    </div>
                                    <div className="text-center font-mono font-bold text-slate-400">
                                      {ad.views} <span className="text-[9px] text-slate-400">بازدید</span>
                                    </div>
                                    <div className="flex justify-end gap-1.5">
                                      {isCloudSyncActive ? (
                                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/20 flex items-center gap-1.5 shrink-0 select-none">
                                          <Database className="w-3.5 h-3.5 text-amber-500" />
                                          فقط خواندنی شیتس
                                        </span>
                                      ) : (
                                        <>
                                      <button
                                        onClick={() => setEditingAd(ad)}
                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-md transition-colors cursor-pointer"
                                        title="ویرایش"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteAd(ad.id)}
                                        className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-rose-950/20 text-rose-500 rounded-md transition-colors cursor-pointer"
                                        title="حذف کمپین"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                      </>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* GOOGLE SHEETS STEP-BY-STEP IRAN MANUAL (CRAFT LEVEL!) */}
                          <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 space-y-4 text-right">
                            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                              <FileText className="w-5 h-5 shrink-0" />
                              <h4 className="text-xs font-black">📋 آموزش اتصال تبلیغات به جدول رایگان Google Sheets (بدون نیاز به فیلترشکن!)</h4>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
                              ازین پس آگهی‌ها نیازی به وب‌سرورهای گران، استقرار در لیارا یا کارهای فنی سخت ندارند. شما می‌توانید در ۲ دقیقه حساب رایگان گوگل اکسل (Sheet) خود را مستقیما به اپ اندروید گازینو گره بزنید تا با تغییر هر ردیف، کاربران زیر ثانیه تبلیغ جدید را ببینند!
                            </p>

                            <div className="space-y-4 text-right">
                              <div className="space-y-1">
                                <h5 className="text-[11px] font-black text-slate-800 dark:text-slate-100">گام اول: نام‌گذاری ستون‌های جدول گوگل شیت</h5>
                                <p className="text-[10px] text-slate-400 leading-relaxed">
                                  یک شیت خالی بسازید و نام ردیف اول (سربرگ‌ها) را همانند زیر بنویسید (ترتیب مهم نیست):
                                </p>
                                <div className="bg-slate-900 text-slate-100 p-2.5 rounded-xl font-mono text-[10px] text-left flex justify-between items-center whitespace-normal leading-relaxed">
                                  <code className="text-[10px] text-emerald-400">id, title, description, imageUrl, link, slogan, badge, isActive</code>
                                  <div className="text-[9px] text-amber-500 font-sans font-bold text-right ml-2">یا معادل فارسی: <code className="bg-slate-800 text-slate-300 px-1 py-0.5 rounded">شناسه، عنوان، توضیحات، عکس، لینک، شعار، برچسب، فعال</code></div>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <h5 className="text-[11px] font-black text-slate-800 dark:text-slate-100">گام دوم: انتشار عمومی جدول به فرمت CSV (بسیار مهم)</h5>
                                <ol className="text-[10px] text-slate-400 list-decimal list-inside space-y-1 leading-relaxed">
                                  <li>در بالای منوی گوگل شیتس روی دکمه <strong className="text-slate-700 dark:text-slate-200">File (فایل)</strong> کلیک کنید.</li>
                                  <li>وارد زیرمنوی <strong className="text-slate-700 dark:text-slate-200">Share (اشتراک‌گذاری)</strong> شده و <strong className="text-slate-700 dark:text-slate-200">Publish to web (انتشار در وب)</strong> را انتخاب کنید.</li>
                                  <li>در کادر باز شده، فرمت پیش‌فرض Web page را حتماً روی <strong className="text-emerald-500">Comma-separated values (.csv)</strong> بگذارید.</li>
                                  <li>کلید <strong className="text-emerald-500">Publish</strong> را تأیید کرده و لینک به دست آمده را کپی کنید.</li>
                                </ol>
                              </div>

                              <div className="space-y-1">
                                <h5 className="text-[11px] font-black text-slate-800 dark:text-slate-100">گام سوم: چسباندن لینک در گازینو</h5>
                                <p className="text-[10px] text-slate-400 leading-relaxed">
                                  لینک به دست آمده از گوگل شیتس را در کادر <strong className="text-blue-500 font-bold">"آدرس منبع ابری تبلیغات"</strong> در بالای همین صفحه قرار دهید و دکمه <strong className="text-blue-500 font-bold">اعمال روی اپ</strong> را بزنید. تغییرات بلافاصله بدون هیچ فیلترینگی برای تمام کاربران بارگذاری خواهد شد! 🥂🥳
                                </p>
                              </div>
                            </div>
                          </div>

                        </div>
                      )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center text-[10px] text-slate-400 font-bold">
                  <span>سیستم پورتال تبلیغات هوشمند گازینو v2.0</span>
                  <span>گذرواژه پیش نیاز پنل مدیریتی است</span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // 2. Horizontal ribbon/banner list of sponsors
  // When 'ribbon' is requested, we now render the exact rotating banner layout like the landing page (User Intent)
  if (variant === 'ribbon') {
    const activeAds = ads.filter(ad => ad.isActive);
    const adsToRender = activeAds.length > 0 ? activeAds : DEFAULT_ADS;
    const currentAd = adsToRender[activeIndex] || adsToRender[0];

    return (
      <div className="w-full max-w-xl mx-auto select-none no-print">
        <AnimatePresence mode="wait">
          {currentAd && (
            <motion.div
              key={currentAd.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45 }}
              onClick={() => handleAdClick(currentAd)}
              className="w-full bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-[#0f172a] border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 rounded-3xl p-5 md:p-6 shadow-md hover:shadow-lg transition-all transform duration-300 flex flex-col md:flex-row gap-5 items-center cursor-pointer relative overflow-hidden text-right group"
            >
              <div className="absolute top-3 left-3 bg-amber-500/10 dark:bg-amber-500/15 text-amber-500 border border-amber-500/20 text-[9px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 select-none font-bold animate-pulse">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{currentAd.badge}</span>
              </div>

              <div className="w-full md:w-32 h-24 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shrink-0 shadow-inner bg-slate-50">
                <img 
                  src={getProxiedImageUrl(currentAd.imageUrl) || undefined} 
                  alt={currentAd.title} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              <div className="flex-1 space-y-1.5">
                <h4 className="text-xs font-black text-amber-500 tracking-wider">
                  {currentAd.slogan}
                </h4>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>{currentAd.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:translate-x-[-3px] group-hover:translate-y-[-1px] transition-transform" />
                </h3>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                  {currentAd.description}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // 3. Featured Main Rotating Banner Card (fits directly inside primary landing / header views)
  const activeAds = ads.filter(ad => ad.isActive);
  const adsToRender = activeAds.length > 0 ? activeAds : DEFAULT_ADS;
  const currentAd = adsToRender[activeIndex] || adsToRender[0];

  return (
    <div className="w-full select-none no-print">
      <AnimatePresence mode="wait">
        {currentAd && (
          <motion.div
            key={currentAd.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.45 }}
            onClick={() => handleAdClick(currentAd)}
            className="w-full bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-[#0f172a] border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 rounded-3xl p-5 md:p-6 shadow-md hover:shadow-lg transition-all transform duration-300 flex flex-col md:flex-row gap-5 items-center cursor-pointer relative overflow-hidden text-right group"
          >
            {/* Tag/Badge indicator */}
            <div className="absolute top-3 left-3 bg-amber-500/10 dark:bg-amber-500/15 text-amber-500 border border-amber-500/20 text-[9px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 select-none font-bold">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{currentAd.badge}</span>
            </div>

            {/* Ad Banner Image */}
            <div className="w-full md:w-32 h-24 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shrink-0 shadow-inner bg-slate-50">
              <img 
                src={getProxiedImageUrl(currentAd.imageUrl) || undefined} 
                alt={currentAd.title} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Ad Texts */}
            <div className="flex-1 space-y-1.5">
              <h4 className="text-xs font-black text-amber-500 tracking-wider">
                {currentAd.slogan}
              </h4>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>{currentAd.title}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:translate-x-[-3px] group-hover:translate-y-[-1px] transition-transform" />
              </h3>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                {currentAd.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

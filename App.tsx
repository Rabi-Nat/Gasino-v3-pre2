import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X,
  Flame, 
  Wind, 
  Gauge, 
  ShieldCheck, 
  MessageSquare,
  ChevronLeft,
  Store as StoreIcon,
  FlaskConical,
  Activity,
  ArrowLeftRight,
  FireExtinguisher,
  Cylinder,
  ArrowUpToLine,
  Wrench,
  Scaling,
  Ruler,
  Home,
  Sliders,
  CloudRain,
  ClipboardCheck,
  BookOpen,
  Settings,
  Share2,
  Star,
  Sun,
  Moon,
  Banknote,
  Lock,
  Unlock,
  Sparkles,
  Shield,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Calendar,
  KeyRound,
  ArrowUpRight,
  Layers
} from 'lucide-react';
import { PipeCalculator } from './components/PipeCalculator';
import { Ventilation } from './components/Ventilation';
import { MeterSpecs } from './components/MeterSpecs';
import { ValveInstallation } from './components/ValveInstallation';
import { ApplianceDistance } from './components/ApplianceDistance';
import { PriceList } from './components/PriceList';
import { ContactUs } from './components/ContactUs';
import { Store } from './components/Store';
import { GasTest } from './components/GasTest';
import { DraftingSection } from './components/DraftingSection';

// Firefighting Components
import { WaterSystem } from './components/WaterSystem';
import { FirePipeSizer } from './components/FirePipeSizer';
import { ExtinguisherCalc } from './components/ExtinguisherCalc';
import { FirePumpHead } from './components/FirePumpHead';
import { PlumbingSystem } from './components/PlumbingSystem';
import { MechanicalHvac } from './components/MechanicalHvac';
import { UserGuide } from './components/UserGuide';
import ClassicLanding from './components/ClassicLanding';
import { AdsSection } from './components/AdsSection';
import { getProxiedImageUrl } from './utils';

type SectionId = 'gas' | 'fire' | 'plumbing' | 'hvac';
type TabId = 'pipe' | 'ventilation' | 'meter' | 'valve' | 'safety' | 'price' | 'isometric' | 'plan' | 'drafting' | 'contact' | 'store' | 'test' | 'water' | 'firepipe' | 'extinguisher' | 'pump' | 'plumbing' | 'plumbing_reservoir' | 'plumbing_rainwater' | 'plumbing_test' | 'hvac_load' | 'hvac_duct' | 'hvac_pipe' | 'hvac_test';

const sectionBackgrounds: Record<SectionId, string> = {
  gas: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
  fire: 'https://images.unsplash.com/photo-1516383274235-5f42d6c6426d?auto=format&fit=crop&w=1200&q=80',
  plumbing: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
  hvac: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
};

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionId>('gas');
  const [hasSelectedSection, setHasSelectedSection] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('pipe');
  const [isLoading, setIsLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSectionSelector, setShowSectionSelector] = useState(false);
  
  const isInitialHistoryLoadRef = useRef(true);
  
  // Quick Dashboard Unit Converter States
  const [quickConvType, setQuickConvType] = useState<'pressure' | 'power'>('pressure');
  const [quickConvInput, setQuickConvInput] = useState<string>('1');
  const [quickConvSrc, setQuickConvSrc] = useState<string>('Bar');
  const [quickConvDst, setQuickConvDst] = useState<string>('PSI');

  const handleQuickConvTypeChange = (type: 'pressure' | 'power') => {
    setQuickConvType(type);
    if (type === 'pressure') {
      setQuickConvSrc('Bar');
      setQuickConvDst('PSI');
    } else {
      setQuickConvSrc('kW');
      setQuickConvDst('BTU');
    }
  };

  const getQuickConverted = () => {
    const val = parseFloat(quickConvInput);
    if (isNaN(val)) return '0';
    if (quickConvType === 'pressure') {
      const factors: Record<string, number> = {
        'Bar': 1,
        'PSI': 14.5038,
        'KPa': 100
      };
      const base = val / factors[quickConvSrc];
      const res = base * factors[quickConvDst];
      return res.toFixed(3).replace(/\.?0+$/, "");
    } else {
      const factors: Record<string, number> = {
        'kW': 1,
        'BTU': 3412.14,
        'kcal': 860.421
      };
      const base = val / factors[quickConvSrc];
      const res = base * factors[quickConvDst];
      return res.toFixed(3).replace(/\.?0+$/, "");
    }
  };


  const [landingStyle, setLandingStyle] = useState<'creative' | 'classic'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('landingStyle') as 'creative' | 'classic') || 'creative';
    }
    return 'creative';
  });
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const [creativeClicks, setCreativeClicks] = useState(0);
  const handleCreativeBrandClick = () => {
    const nextClicks = creativeClicks + 1;
    if (nextClicks >= 6) {
      setCreativeClicks(0);
      try {
        const isCurrentlyUnlocked = localStorage.getItem('gasino_admin_unlocked') === 'true';
        if (isCurrentlyUnlocked) {
          localStorage.removeItem('gasino_admin_unlocked');
          window.dispatchEvent(new CustomEvent('gasino_admin_locked'));
        } else {
          localStorage.setItem('gasino_admin_unlocked', 'true');
          window.dispatchEvent(new CustomEvent('gasino_admin_unlocked'));
        }
      } catch (e) {}
    } else {
      setCreativeClicks(nextClicks);
    }
  };

  useEffect(() => {
    if (isDark && !hasSelectedSection) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark, hasSelectedSection]);

  // Sync React navigation state changes back to browser history
  useEffect(() => {
    // Current depth calculation
    let currentDepth = 0;
    if (hasSelectedSection) currentDepth++;
    if (showGuide) currentDepth++;

    let historyDepth = 0;
    try {
      historyDepth = window.history.state?.depth || 0;
    } catch (e) {
      // In restricted sandboxed environments, history object may not be accessible or throws
      return;
    }

    if (currentDepth > historyDepth) {
      try {
        window.history.pushState({ depth: currentDepth }, '');
      } catch (e) {
        console.warn('history.pushState blocked in sandbox:', e);
      }
    } else if (currentDepth < historyDepth) {
      if (isInitialHistoryLoadRef.current) {
        // Skip going backward on initial load if we have leftover session state
        isInitialHistoryLoadRef.current = false;
        return;
      }
      const diff = historyDepth - currentDepth;
      try {
        window.history.go(-diff);
      } catch (e) {
        console.warn('history.go blocked in sandbox:', e);
      }
    }
  }, [hasSelectedSection, showGuide]);

  // Manage browser history to intercept the hardware back button (Capacitor/Android & Browser back button support)
  useEffect(() => {
    // Inject initial history state so we have a baseline
    try {
      if (!window.history.state || window.history.state.depth === undefined) {
        window.history.replaceState({ depth: 0 }, '');
      }
    } catch (e) {
      console.warn('history.replaceState blocked in sandbox:', e);
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      const targetDepth = state && typeof state.depth === 'number' ? state.depth : 0;
      
      // Update React state according to the target history depth
      if (targetDepth === 0) {
        setHasSelectedSection(false);
        setShowGuide(false);
      } else if (targetDepth === 1) {
        // If we popped back to depth 1, close the Guide but keep section active
        setShowGuide(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Support internal app links from ads / remote config
  useEffect(() => {
    const handleNavigation = (e: Event) => {
      const customEvent = e as CustomEvent<{ path: string }>;
      const path = customEvent.detail?.path?.trim()?.toLowerCase();
      if (!path) return;

      const tabToSectionMap: Record<string, { section: SectionId; tab: TabId }> = {
        'pipe': { section: 'gas', tab: 'pipe' },
        'ventilation': { section: 'gas', tab: 'ventilation' },
        'meter': { section: 'gas', tab: 'meter' },
        'valve': { section: 'gas', tab: 'valve' },
        'safety': { section: 'gas', tab: 'safety' },
        'store': { section: 'gas', tab: 'store' },
        'test': { section: 'gas', tab: 'test' },
        'price': { section: 'gas', tab: 'price' },
        'contact': { section: 'gas', tab: 'contact' },
        'drafting': { section: 'gas', tab: 'drafting' },
        'plan': { section: 'gas', tab: 'drafting' },
        'isometric': { section: 'gas', tab: 'drafting' },
        
        'water': { section: 'fire', tab: 'water' },
        'firepipe': { section: 'fire', tab: 'firepipe' },
        'pump': { section: 'fire', tab: 'pump' },
        'extinguisher': { section: 'fire', tab: 'extinguisher' },
        
        'plumbing': { section: 'plumbing', tab: 'plumbing' },
        'plumbing_reservoir': { section: 'plumbing', tab: 'plumbing_reservoir' },
        'plumbing_rainwater': { section: 'plumbing', tab: 'plumbing_rainwater' },
        'plumbing_test': { section: 'plumbing', tab: 'plumbing_test' },
        
        'hvac_load': { section: 'hvac', tab: 'hvac_load' },
        'hvac_duct': { section: 'hvac', tab: 'hvac_duct' },
        'hvac_pipe': { section: 'hvac', tab: 'hvac_pipe' },
        'hvac_test': { section: 'hvac', tab: 'hvac_test' }
      };

      const match = tabToSectionMap[path];
      if (match) {
        setActiveSection(match.section);
        setActiveTab(match.tab);
        setHasSelectedSection(true);
      }
    };
    window.addEventListener('gasino_navigate', handleNavigation);
    return () => {
      window.removeEventListener('gasino_navigate', handleNavigation);
    };
  }, []);

  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 3000);
  }, []);

  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Gasino',
        text: 'Gasino - پرتال محاسبات مهندسی تاسیسات ساختمان',
        url: window.location.href,
      }).then(() => {
        showToast('برنامه با موفقیت به اشتراک گذاشته شد! 🚀');
      }).catch(() => {
        navigator.clipboard.writeText(window.location.href);
        showToast('لینک برنامه کپی شد! 📋');
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('لینک برنامه کپی شد! 📋');
    }
    setShowSettings(false);
  };

  const handleRateApp = () => {
    showToast('ثبت شد! از ثبت امتیاز ۵ ستاره شما صمیمانه سپاسگزاریم 😍⭐');
    setShowSettings(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const gasTabs = [
    { id: 'pipe' as TabId, label: 'سایزینگ لوله‌کشی', icon: Ruler, component: PipeCalculator },
    { id: 'ventilation' as TabId, label: 'تهویه و دریچه', icon: Wind, component: Ventilation },
    { id: 'meter' as TabId, label: 'کنتور', icon: Gauge, component: MeterSpecs },
    { id: 'drafting' as TabId, label: 'نقشه کشی', icon: Layers, component: DraftingSection },
    { id: 'valve' as TabId, label: 'فواصل شیرآلات', icon: Wrench, component: ValveInstallation },
    { id: 'safety' as TabId, label: 'فواصل ایمنی', icon: ShieldCheck, component: ApplianceDistance },
    { id: 'store' as TabId, label: 'فروشگاه ملزومات', icon: StoreIcon, component: Store },
    { id: 'test' as TabId, label: 'تست استقامت', icon: FlaskConical, component: GasTest },
    { id: 'price' as TabId, label: 'تعرفه خدمات', icon: Banknote, component: PriceList },
    { id: 'contact' as TabId, label: 'تماس با ما', icon: MessageSquare, component: ContactUs },
  ];

  const fireTabs = [
    { id: 'water' as TabId, label: 'مخزن و دبی', icon: Cylinder, component: WaterSystem },
    { id: 'firepipe' as TabId, label: 'سایزینگ لوله', icon: Ruler, component: FirePipeSizer },
    { id: 'pump' as TabId, label: 'هد پمپ', icon: ArrowUpToLine, component: FirePumpHead },
    { id: 'extinguisher' as TabId, label: 'کپسول اطفاء', icon: FireExtinguisher, component: ExtinguisherCalc },
    { id: 'contact' as TabId, label: 'تماس با ما', icon: MessageSquare, component: ContactUs },
  ];

  const plumbingTabs = [
    { id: 'plumbing' as TabId, label: 'آبرسانی و فاضلاب', icon: Cylinder, component: PlumbingSystem },
    { id: 'plumbing_reservoir' as TabId, label: 'منبع ذخیره مصرفی', icon: Sliders, component: PlumbingSystem },
    { id: 'plumbing_rainwater' as TabId, label: 'آب باران و ناودان', icon: CloudRain, component: PlumbingSystem },
    { id: 'plumbing_test' as TabId, label: 'تست سیستم‌ها', icon: ClipboardCheck, component: PlumbingSystem },
    { id: 'contact' as TabId, label: 'تماس با ما', icon: MessageSquare, component: ContactUs },
  ];

  const hvacTabs = [
    { id: 'hvac_load' as TabId, label: 'بارهای برودتی حرارتی', icon: Sliders, component: MechanicalHvac },
    { id: 'hvac_duct' as TabId, label: 'سایزینگ کانال تهویه', icon: Wind, component: MechanicalHvac },
    { id: 'hvac_pipe' as TabId, label: 'سایزینگ لوله‌های تأسیسات', icon: Ruler, component: MechanicalHvac },
    { id: 'hvac_test' as TabId, label: 'تست‌ها و گواهی مبحث ۱۴', icon: ClipboardCheck, component: MechanicalHvac },
    { id: 'contact' as TabId, label: 'تماس با ما', icon: MessageSquare, component: ContactUs },
  ];

  const tabs = activeSection === 'gas' 
    ? gasTabs 
    : activeSection === 'fire' 
    ? fireTabs 
    : activeSection === 'plumbing' 
    ? plumbingTabs 
    : hvacTabs;

  const handleSectionSelect = (section: SectionId) => {
    setActiveSection(section);
    setActiveTab(
      section === 'gas' 
        ? 'pipe' 
        : section === 'fire' 
        ? 'water' 
        : section === 'plumbing' 
        ? 'plumbing' 
        : 'hvac_load'
    );
    setHasSelectedSection(true);
  };

  const toggleSection = () => {
    const next = activeSection === 'gas' 
      ? 'fire' 
      : activeSection === 'fire' 
      ? 'plumbing' 
      : activeSection === 'plumbing' 
      ? 'hvac' 
      : 'gas';
    setActiveSection(next);
    setActiveTab(
      next === 'gas' 
        ? 'pipe' 
        : next === 'fire' 
        ? 'water' 
        : next === 'plumbing' 
        ? 'plumbing' 
        : 'hvac_load'
    );
  };

  const resetToLanding = () => setHasSelectedSection(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<number>(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const interactionTimer = useRef<NodeJS.Timeout | null>(null);

  const landingContainerRef = useRef<HTMLDivElement>(null);

  // Slow automatic scroll to top when returning to the landing page or on load
  useEffect(() => {
    if (!hasSelectedSection) {
      const container = landingContainerRef.current;
      if (!container) return;

      let animationFrameId: number;
      let userInteracted = false;

      const onInteraction = () => {
        userInteracted = true;
      };

      container.addEventListener('wheel', onInteraction, { passive: true });
      container.addEventListener('touchstart', onInteraction, { passive: true });
      container.addEventListener('mousedown', onInteraction, { passive: true });

      const smoothScrollToTop = () => {
        if (!container || userInteracted) return;
        const currentScroll = container.scrollTop;
        if (currentScroll > 0) {
          const step = Math.max(1.5, currentScroll / 24); 
          container.scrollTop = currentScroll - step;
          animationFrameId = requestAnimationFrame(smoothScrollToTop);
        }
      };

      const timer = setTimeout(() => {
        animationFrameId = requestAnimationFrame(smoothScrollToTop);
      }, 150);

      return () => {
        clearTimeout(timer);
        cancelAnimationFrame(animationFrameId);
        if (container) {
          container.removeEventListener('wheel', onInteraction);
          container.removeEventListener('touchstart', onInteraction);
          container.removeEventListener('mousedown', onInteraction);
        }
      };
    }
  }, [hasSelectedSection, landingStyle]);

  // Synchronize scrollPosRef with manual user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current && isInteracting) {
        scrollPosRef.current = scrollRef.current.scrollLeft;
      }
    };
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (el) {
        el.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isInteracting]);

  // Infinite Auto-scroll logic
  useEffect(() => {
    let animationFrame: number;
    const scrollSpeed = 0.1; // Pixels per frame

    // Initialize with current scroll value
    if (scrollRef.current) {
      scrollPosRef.current = scrollRef.current.scrollLeft;
    }

    const animate = () => {
      if (!scrollRef.current || isInteracting) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      const el = scrollRef.current;
      
      // Update sub-pixel scroll accuracy reference
      scrollPosRef.current -= scrollSpeed;
      
      // Loop logic for RTL
      // In RTL, scrollLeft 0 is far right. Negative values move left.
      // We want to loop back when we've scrolled one full set.
      if (Math.abs(scrollPosRef.current) >= (el.scrollWidth / 2)) {
        scrollPosRef.current = 0;
      }
      
      el.scrollLeft = scrollPosRef.current;

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInteracting]);

  const handleInteractionStart = () => {
    setIsInteracting(true);
    if (interactionTimer.current) clearTimeout(interactionTimer.current);
  };

  const handleInteractionEnd = () => {
    // Resume auto-scroll after 3 seconds of inactivity
    interactionTimer.current = setTimeout(() => {
      setIsInteracting(false);
    }, 3000);
  };

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || PipeCalculator;
  const activeLabel = tabs.find(t => t.id === activeTab)?.label || '';

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-blue-600 flex flex-col items-center justify-center transition-opacity duration-700">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl animate-bounce mb-6">
          <Flame className="text-blue-600 w-16 h-16" />
        </div>
        <h1 className="text-white text-4xl font-black mb-2">Gasino</h1>
        <div className="mt-12">
          <div className="w-32 h-1 bg-blue-400/30 rounded-full overflow-hidden">
            <div className="w-full h-full bg-white" style={{ animation: 'loading-bar 1.5s ease-in-out infinite' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (showGuide) {
    return <UserGuide onClose={() => setShowGuide(false)} />;
  }

  if (!hasSelectedSection) {
    const mainMenuItems = [
      {
        id: 'gas',
        title: 'سیستم گازرسانی',
        englishTitle: 'Natural Gas Engineering',
        icon: Flame,
        colorClass: 'text-blue-600',
        bgClass: 'bg-gradient-to-r from-blue-500/5 to-blue-500/10 hover:from-blue-500/10 hover:to-blue-500/15',
        borderClass: 'border-blue-100 hover:border-blue-300',
        badge: 'مبحث ۱۷',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/50',
        action: () => {
          setActiveSection('gas');
          setActiveTab('pipe');
          setHasSelectedSection(true);
        },
        description: 'امکانات سایزینگ لوله‌کشی، انتخاب کنتور متناسب، تعیین مشخصات دودکش و فواصل استاندارد شیرآلات گاز.',
        glowColor: 'rgba(37,99,235,0.06)',
        watermarkText: 'METHANE CH4'
      },
      {
        id: 'fire',
        title: 'سیستم آتش‌نشانی و ضدحریق',
        englishTitle: 'Hydraulic Fire Safety',
        icon: FireExtinguisher,
        colorClass: 'text-rose-600',
        bgClass: 'bg-gradient-to-r from-rose-500/5 to-rose-500/10 hover:from-rose-500/10 hover:to-rose-500/15',
        borderClass: 'border-rose-100 hover:border-rose-300',
        badge: 'نازل و اطفاء',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200/50',
        action: () => {
          setActiveSection('fire');
          setActiveTab('water');
          setHasSelectedSection(true);
        },
        description: 'محاسبه حجم مخزن ذخیره سازی آب اطفاء، محاسبات هد پمپ، سایزینگ کلکتور و زون‌بندی تخصصی حریق.',
        glowColor: 'rgba(225,29,72,0.06)',
        watermarkText: 'HYDRAULIC'
      },
      {
        id: 'plumbing',
        title: 'تاسیسات بهداشتی، آبرسانی و فاضلاب',
        englishTitle: 'Water & Plumbing Systems',
        icon: Cylinder,
        colorClass: 'text-cyan-600',
        bgClass: 'bg-gradient-to-r from-cyan-500/5 to-cyan-500/10 hover:from-cyan-500/10 hover:to-cyan-500/15',
        borderClass: 'border-cyan-100 hover:border-cyan-300',
        badge: 'مبحث ۱۶',
        badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200/50',
        action: () => {
          setActiveSection('plumbing');
          setActiveTab('plumbing');
          setHasSelectedSection(true);
        },
        description: 'محاسبات دبی خطوط آبرسانی بر اساس SFU، طراحی مخازن آب اضطراری، و سایزینگ شیب ثقلی کلکتورهای فاضلاب ساختمان.',
        glowColor: 'rgba(6,182,212,0.06)',
        watermarkText: 'HYDRO SYSTEM'
      },
      {
        id: 'hvac',
        title: 'تاسیسات مکانیکی و سرمایش گرمایش',
        englishTitle: 'Mechanical HVAC Systems',
        icon: Wind,
        colorClass: 'text-amber-600',
        bgClass: 'bg-gradient-to-r from-amber-500/5 to-amber-500/10 hover:from-amber-500/10 hover:to-amber-500/15',
        borderClass: 'border-amber-100 hover:border-amber-300',
        badge: 'مبحث ۱۴',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/50',
        action: () => {
          setActiveSection('hvac');
          setActiveTab('hvac_load');
          setHasSelectedSection(true);
        },
        description: 'محاسبه بارهای برودتی و حرارتی، سایزینگ کانال‌کشی هوا، چیلرها و فن‌کویل‌ها بر اساس دیتای سایکرومتریک شهرهای ایران.',
        glowColor: 'rgba(245,158,11,0.06)',
        watermarkText: 'METROPOLIS HVAC'
      },
      {
        id: 'store',
        title: 'فروشگاه تدارکات ملزومات',
        englishTitle: 'Engineering Hardware Store',
        icon: StoreIcon,
        colorClass: 'text-emerald-600',
        bgClass: 'bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 hover:from-emerald-500/10 hover:to-emerald-500/15',
        borderClass: 'border-emerald-100 hover:border-emerald-300',
        badge: 'تجهیزات تأییدشده',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
        action: () => {
          setActiveSection('gas');
          setActiveTab('store');
          setHasSelectedSection(true);
        },
        description: 'کاتالوگ و لیست استعلام قیمت انواع لوله‌های مانسمان بدون درز، اتصالات استاندارد و تجهیزات برقی ایمنی گاز.',
        glowColor: 'rgba(16,185,129,0.06)',
        watermarkText: 'STORE FITTINGS'
      },
      {
        id: 'contact',
        title: 'ارتباط مستقیم و پشتیبانی فنی',
        englishTitle: 'Consultation & Support',
        icon: MessageSquare,
        colorClass: 'text-violet-600',
        bgClass: 'bg-gradient-to-r from-violet-500/5 to-violet-500/10 hover:from-violet-500/10 hover:to-violet-500/15',
        borderClass: 'border-violet-100 hover:border-violet-300',
        badge: 'مشاوره آنلاین',
        badgeColor: 'bg-violet-50 text-violet-700 border-violet-200/50',
        action: () => {
          setActiveSection('gas');
          setActiveTab('contact');
          setHasSelectedSection(true);
        },
        description: 'طرح سوالات نظارت، استعلام نقشه‌ها و همکاری مستقیم با مهندسین.',
        glowColor: 'rgba(139,92,246,0.06)',
        watermarkText: 'CONSULT'
      },
      {
        id: 'guide',
        title: 'راهنمای استفاده و مستندات محاسباتی',
        englishTitle: 'Technical User Guide',
        icon: BookOpen,
        colorClass: 'text-sky-600',
        bgClass: 'bg-gradient-to-r from-sky-500/5 to-sky-500/10 hover:from-sky-500/10 hover:to-sky-500/15',
        borderClass: 'border-sky-100 hover:border-sky-300',
        badge: 'مستندات و فرمول‌ها',
        badgeColor: 'bg-sky-50 text-sky-700 border-sky-200/50',
        action: () => {
          setShowGuide(true);
        },
        description: 'راهنمای کاربری سیستم گاز، تاسیسات بهداشتی، مکانیکی و آتش‌نشانی همراه با روابط و فرمول‌های هر بخش.',
        glowColor: 'rgba(14,165,233,0.06)',
        watermarkText: 'USER MANUAL'
      }
    ];

    // Parent container animation variants for staggered children load
    const containerVariants = {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.05
        }
      }
    };

    const itemVariants = {
      hidden: { y: 25, opacity: 0 },
      show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 180, damping: 20 } }
    };

    if (landingStyle === 'classic') {
      return (
        <div ref={landingContainerRef} className="h-screen w-full max-w-full bg-[#f8fafc] dark:bg-[#070b13] flex flex-col px-4 pb-16 relative font-sans overflow-y-auto overflow-x-hidden">
          {/* Settings Floating Button */}
          <div className="fixed left-4 top-4 md:left-8 md:top-8 z-55 no-print">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-705 active:scale-95 transition-all cursor-pointer text-slate-600 dark:text-slate-300 relative"
              title="تنظیمات"
            >
              <Settings className={`w-5 h-5 transition-transform duration-500 ${showSettings ? 'rotate-90 text-blue-600 dark:text-blue-400' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            <AnimatePresence>
              {showSettings && (
                <>
                  {/* Overlay layer to close modern popup on click outside */}
                  <div 
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setShowSettings(false)}
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.93, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.93, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-2.5 text-right font-sans flex flex-col gap-1 z-50 select-none animate-none text-slate-800 dark:text-slate-200"
                    style={{ direction: 'rtl' }}
                  >
                    {/* Theme Toggle (Dark Mode) */}
                    <button
                      onClick={() => setIsDark(!isDark)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-right cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">حالت تاریک</span>
                      </div>
                      {/* Switch Indicator */}
                      <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center ${isDark ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isDark ? 'translate-x-[14px]' : 'translate-x-0'}`} />
                      </div>
                    </button>
                    
                    <div className="h-[1px] bg-slate-100 dark:bg-slate-700 my-0.5" />

                    {/* Landing Style Option Toggle */}
                    <button
                      onClick={() => {
                        const next = 'creative';
                        setLandingStyle(next);
                        localStorage.setItem('landingStyle', next);
                        showToast(`طرح لندینگ: مدرن (جدید)`);
                        setShowSettings(false);
                      }}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-right cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">طرح صفحه اصلی</span>
                      </div>
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2.1 py-0.5 rounded-lg font-black">
                        مدرن
                      </span>
                    </button>

                    <div className="h-[1px] bg-slate-100 dark:bg-slate-700 my-0.5" />

                    {/* Share App */}
                    <button
                      onClick={handleShareApp}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-right cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200">به اشتراک‌گذاری برنامه</span>
                    </button>

                    <div className="h-[1px] bg-slate-100 dark:bg-slate-700 my-0.5" />

                    {/* Rate App */}
                    <button
                      onClick={handleRateApp}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-right cursor-pointer"
                    >
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200">امتیاز به برنامه</span>
                    </button>

                    <div className="h-[1px] bg-slate-100 dark:bg-slate-700 my-0.5" />

                    {/* Ads Admin Trigger */}
                    <AdsSection variant="admin_trigger" onShowToast={showToast} isDark={isDark} />


                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <ClassicLanding 
            isDark={isDark}
            onSelectSection={(secId, tabId) => {
              setActiveSection(secId as SectionId);
              setActiveTab(tabId as TabId);
              setHasSelectedSection(true);
            }}
            onShowGuide={() => setShowGuide(true)}
          />

          {/* Global Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-55 px-5 py-3 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 text-right pointer-events-none"
                style={{ direction: 'rtl' }}
              >
                <span>{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <div ref={landingContainerRef} className="h-screen w-full max-w-full bg-[#f8fafc] dark:bg-[#070b13] flex flex-col items-center px-4 pb-16 relative font-sans overflow-y-auto overflow-x-hidden">
        
        {/* Settings Floating Button */}
        <div className="fixed left-4 top-4 md:left-8 md:top-8 z-55 no-print">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-705 active:scale-95 transition-all cursor-pointer text-slate-600 dark:text-slate-300 relative"
            title="تنظیمات"
          >
            <Settings className={`w-5 h-5 transition-transform duration-500 ${showSettings ? 'rotate-90 text-blue-600 dark:text-blue-400' : ''}`} />
          </button>
          
          {/* Dropdown Menu */}
          <AnimatePresence>
            {showSettings && (
              <>
                {/* Overlay layer to close modern popup on click outside */}
                <div 
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setShowSettings(false)}
                />
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.93, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.93, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-2.5 text-right font-sans flex flex-col gap-1 z-50 select-none animate-none text-slate-800 dark:text-slate-200"
                  style={{ direction: 'rtl' }}
                >
                  {/* Theme Toggle (Dark Mode) */}
                  <button
                    onClick={() => setIsDark(!isDark)}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-right cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200">حالت تاریک</span>
                    </div>
                    {/* Switch Indicator */}
                    <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center ${isDark ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isDark ? 'translate-x-[14px]' : 'translate-x-0'}`} />
                    </div>
                  </button>
                  
                  <div className="h-[1px] bg-slate-100 dark:bg-slate-700 my-0.5" />

                  {/* Landing Style Option Toggle */}
                  <button
                    onClick={() => {
                      const next = 'classic';
                      setLandingStyle(next);
                      localStorage.setItem('landingStyle', next);
                      showToast(`طرح لندینگ: کلاسیک (لیستی)`);
                      setShowSettings(false);
                    }}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-right cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200">طرح صفحه اصلی</span>
                    </div>
                    <span className="text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2.1 py-0.5 rounded-lg font-black">
                      کلاسیک
                    </span>
                  </button>

                  <div className="h-[1px] bg-slate-100 dark:bg-slate-700 my-0.5" />

                  {/* Share App */}
                  <button
                    onClick={handleShareApp}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-right cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">به اشتراک‌گذاری برنامه</span>
                  </button>

                  <div className="h-[1px] bg-slate-100 dark:bg-slate-700 my-0.5" />

                  {/* Rate App */}
                  <button
                    onClick={handleRateApp}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-right cursor-pointer"
                  >
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">امتیاز به برنامه</span>
                  </button>

                  <div className="h-[1px] bg-slate-100 dark:bg-slate-700 my-0.5" />

                  {/* Ads Admin Trigger */}
                  <AdsSection variant="admin_trigger" onShowToast={showToast} isDark={isDark} />


                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Fine engineering background grid decor */}
        <div className="absolute inset-0 bg-[size:32px_32px] bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#334155_0.5px,transparent_0.5px),linear-gradient(to_bottom,#334155_0.5px,transparent_0.5px)] opacity-[0.2] dark:opacity-[0.1] pointer-events-none" />
        
        {/* Soft abstract blur accents */}
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-emerald-500/3 rounded-full blur-[100px] pointer-events-none" />

        {/* Animated Brand Header */}
        <div className="sticky top-0 w-full pt-2 pb-1.5 mb-1 text-center z-40 bg-[#f8fafc]/90 dark:bg-[#070b13]/90 backdrop-blur-md transition-colors duration-300 flex justify-center animate-none" dir="ltr">
          <motion.div 
            whileTap={{ scale: 0.96 }}
            onClick={handleCreativeBrandClick}
            className="relative inline-block px-4 py-0.5 cursor-pointer select-none"
            title="ضربه بزنید"
          >
            {/* Ambient colorful backdrop glow (slowly breathing and rotating) */}
            <motion.div 
              animate={{ 
                scale: [0.95, 1.1, 0.95],
                opacity: [0.5, 0.8, 0.5],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 12, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-rose-500/10 rounded-full blur-[35px] pointer-events-none" 
            />
            
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.08,
                    delayChildren: 0.15
                  }
                }
              }}
              className="flex items-center justify-center gap-[3px] font-sans text-4xl md:text-5xl font-black tracking-tight"
            >
              {["G", "a", "s", "i", "n", "o"].map((letter, idx) => {
                // Elegant transitioning gradient segments
                const gradients = [
                  "from-blue-600 to-blue-500",
                  "from-blue-500 to-cyan-500",
                  "from-cyan-550 to-emerald-500",
                  "from-emerald-500 to-amber-500",
                  "from-amber-500 to-rose-500",
                  "from-rose-500 to-rose-600"
                ];

                return (
                  <motion.span
                    key={idx}
                    variants={{
                      hidden: { y: -35, opacity: 0, scale: 0.4 },
                      visible: { 
                        y: 0, 
                        opacity: 1, 
                        scale: 1,
                        transition: { 
                          type: "spring" as const,
                          stiffness: 220,
                          damping: 12
                        }
                      }
                    }}
                    whileHover={{ 
                      y: -12, 
                      scale: 1.15,
                      rotate: idx % 2 === 0 ? 8 : -8,
                      filter: "drop-shadow(0px 10px 20px rgba(37,99,235,0.15))",
                      transition: { type: "spring" as const, stiffness: 300, damping: 10 }
                    }}
                    animate={{
                      y: [0, -5, 0],
                    }}
                    transition={{
                      y: {
                        duration: 3.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: idx * 0.18
                      }
                    }}
                    className={`inline-block bg-gradient-to-br ${gradients[idx]} bg-clip-text text-transparent cursor-pointer filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.01)]`}
                  >
                    {letter}
                  </motion.span>
                );
              })}
            </motion.div>
          </motion.div>
        </div>

        {/* Constrained Visually-focused Modern Bento Dashboard */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 mt-6 px-2 md:px-0" 
          dir="rtl"
        >
          {/* Bento Menu Items Grid */}
          {mainMenuItems.map((menuItem, idx) => {
            const IconComp = menuItem.icon;
            
            // Layout placement mapping with beautifully compacted heights matching classic landing sizes
            const bentoColClasses: Record<string, string> = {
              gas: 'md:col-span-2 lg:col-span-2 h-38',
              fire: 'md:col-span-1 lg:col-span-1 h-38',
              plumbing: 'md:col-span-1 lg:col-span-1 h-38',
              hvac: 'md:col-span-2 lg:col-span-2 h-38',
              store: 'md:col-span-1 lg:col-span-1 h-28',
              contact: 'md:col-span-1 lg:col-span-1 h-28',
              guide: 'md:col-span-1 lg:col-span-1 h-28'
            };

            const bentoImages: Record<string, string> = {
              gas: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
              fire: 'https://images.unsplash.com/photo-1516383274235-5f42d6c6426d?auto=format&fit=crop&w=800&q=80',
              plumbing: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
              hvac: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
              store: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
              contact: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
              guide: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80'
            };

            const systemHalos: Record<string, string> = {
              gas: 'group-hover:shadow-[0_0_35px_rgba(37,99,235,0.22)] border-blue-500/20',
              fire: 'group-hover:shadow-[0_0_35px_rgba(244,63,94,0.22)] border-rose-500/20',
              plumbing: 'group-hover:shadow-[0_0_35px_rgba(6,182,212,0.22)] border-cyan-500/20',
              hvac: 'group-hover:shadow-[0_0_35px_rgba(245,158,11,0.22)] border-amber-500/20',
              store: 'group-hover:shadow-[0_0_35px_rgba(16,185,129,0.22)] border-emerald-500/20',
              contact: 'group-hover:shadow-[0_0_35px_rgba(139,92,246,0.22)] border-violet-500/20',
              guide: 'group-hover:shadow-[0_0_35px_rgba(14,165,233,0.22)] border-sky-500/20'
            };

            const colClass = bentoColClasses[menuItem.id] || 'col-span-1 h-36';
            const bgImage = getProxiedImageUrl(bentoImages[menuItem.id] || '');
            const activeHalo = systemHalos[menuItem.id] || 'group-hover:shadow-lg';

            const modernBadgeStyles: Record<string, string> = {
              gas: 'bg-blue-500/25 text-blue-200 border-blue-400/40',
              fire: 'bg-rose-500/25 text-rose-200 border-rose-400/40',
              plumbing: 'bg-cyan-500/25 text-cyan-200 border-cyan-400/40',
              hvac: 'bg-amber-500/25 text-amber-200 border-amber-400/40',
              store: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40',
              contact: 'bg-violet-500/25 text-violet-200 border-violet-400/40',
              guide: 'bg-sky-500/25 text-sky-200 border-sky-400/40'
            };

            const modernIconColors: Record<string, string> = {
              gas: 'text-blue-400',
              fire: 'text-rose-400',
              plumbing: 'text-cyan-400',
              hvac: 'text-amber-400',
              store: 'text-emerald-400',
              contact: 'text-violet-400',
              guide: 'text-sky-400'
            };

            return (
              <motion.div
                key={menuItem.id}
                variants={itemVariants}
                onClick={menuItem.action}
                className={`group relative overflow-hidden rounded-[2rem] border border-slate-200/40 dark:border-slate-800 bg-[#f8fafc] dark:bg-[#0d1525] dark:hover:border-slate-750 transition-all duration-500 hover:scale-[1.012] cursor-pointer ${colClass} ${activeHalo}`}
              >
                {/* Visual Cover Image */}
                <div 
                  className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 ease-out scale-100 group-hover:scale-105"
                  style={{ backgroundImage: `url('${bgImage}')` }}
                />

                {/* Dark Cinematic Vignette/Glassmorphism Overlay */}
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-slate-900/40 opacity-90 transition-opacity duration-300 group-hover:opacity-95" />

                {/* Radial Light Leak / Halo at corner on hover */}
                <div 
                  className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
                  style={{ 
                    background: menuItem.id === 'gas' ? 'radial-gradient(circle at 50% 100%, rgba(59,130,246,0.18), transparent 60%)' :
                                menuItem.id === 'fire' ? 'radial-gradient(circle at 50% 100%, rgba(244,63,94,0.18), transparent 60%)' :
                                menuItem.id === 'plumbing' ? 'radial-gradient(circle at 50% 100%, rgba(6,182,212,0.18), transparent 60%)' :
                                menuItem.id === 'hvac' ? 'radial-gradient(circle at 50% 100%, rgba(245,158,11,0.18), transparent 60%)' :
                                menuItem.id === 'store' ? 'radial-gradient(circle at 50% 100%, rgba(16,185,129,0.18), transparent 60%)' :
                                menuItem.id === 'contact' ? 'radial-gradient(circle at 50% 100%, rgba(139,92,246,0.18), transparent 60%)' :
                                'radial-gradient(circle at 50% 100%, rgba(14,165,233,0.18), transparent 60%)'
                  }} 
                />

                {/* Blueprint grid overlay lines (subtle blueprint texture) */}
                <div className="absolute inset-0 z-10 opacity-[0.03] group-hover:opacity-[0.05] bg-[size:24px_24px] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] select-none pointer-events-none transition-all duration-500" />

                {/* English Watermark Text */}
                <div className="absolute left-6 top-4.5 text-[8px] font-black tracking-widest text-[#94a3b8]/20 font-mono select-none pointer-events-none">
                  {menuItem.watermarkText}
                </div>

                {/* Main Card Content Layer with optimized sizing for smaller heights */}
                <div className="absolute inset-0 z-20 p-4 md:p-5 flex flex-col justify-between items-start text-right">
                  {/* Top Overlay Badge Tag & Icon Row */}
                  <div className="flex items-center justify-between w-full">
                    {/* Glowing Icon Container */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 bg-white/15 shadow-lg border-white/20 ${modernIconColors[menuItem.id] || 'text-white'} group-hover:scale-110 group-hover:rotate-3`}>
                      <IconComp className="w-5 h-5 text-current" />
                    </div>
                    
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border backdrop-blur-md ${modernBadgeStyles[menuItem.id] || 'bg-white/10 text-white border-white/20'}`}>
                      {menuItem.badge}
                    </span>
                  </div>

                  {/* Text descriptions at bottom */}
                  <div className="w-full">
                    {/* Persian title */}
                    <h3 className="text-sm md:text-base font-black text-white group-hover:text-blue-200 transition-colors drop-shadow-md">
                      {menuItem.title}
                    </h3>

                    {/* Description Paragraph (Line clamped to 1-line for superb clean look on half-size cards) */}
                    <p className="text-slate-300 dark:text-slate-300 text-[10px] leading-relaxed font-bold mt-0.5 line-clamp-1 max-w-lg">
                      {menuItem.description}
                    </p>

                    {/* Technical Tag and arrow action link */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                      <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {menuItem.englishTitle}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] font-black text-white/80 group-hover:text-white transition-colors">
                        <span>ورود</span>
                        <ChevronLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                      </div>
                    </div>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </motion.div>

        {/* Banner Ad / Sponsors Section */}
        <div className="w-full max-w-xl mt-8 z-10">
          <AdsSection variant="banner" onShowToast={showToast} isDark={isDark} />
        </div>

        {/* Footer info text */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.7 }}
          className="mt-14 text-xs font-black text-slate-400 text-center max-w-md px-4 leading-relaxed"
        >
          منبع و مرجع مطابق مباحث ۱۴،۱۶، و ۱۷ مقررات ملی ساختمان و استاندارد ASHRAE
        </motion.div>

        {/* Global Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-55 px-5 py-3 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 text-right pointer-events-none"
              style={{ direction: 'rtl' }}
            >
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }



  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden text-slate-900 bg-slate-50 dark:bg-[#070b13] dark:text-slate-100 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 p-6 z-50 no-print">
        <div className="flex items-center justify-between mb-8 cursor-pointer group" onClick={resetToLanding}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl shadow-lg transition-all group-hover:scale-110 ${activeSection === 'gas' ? 'bg-blue-600 shadow-blue-100' : activeSection === 'fire' ? 'bg-rose-600 shadow-rose-100' : activeSection === 'plumbing' ? 'bg-cyan-600 shadow-cyan-100' : 'bg-amber-600 shadow-amber-100'}`}>
              <Flame className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-xl leading-tight">Gasino</h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                {activeSection === 'gas' ? 'سیستم گازرسانی' : activeSection === 'fire' ? 'مهندسی ضد حریق' : activeSection === 'plumbing' ? 'تاسیسات بهداشتی' : 'تهویه و گرمایش سرمایش'}
              </p>
            </div>
          </div>
        </div>

        {/* 4-Section Unified Switch */}
        <div className="p-1 bg-slate-100 rounded-2xl flex flex-col gap-1.5 mb-4 border border-slate-200/50">
          <button 
            onClick={() => { setActiveSection('gas'); setActiveTab('pipe'); }}
            className={`py-2 text-[10px] font-black rounded-xl transition-all ${activeSection === 'gas' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            سیستم گازرسانی
          </button>
          <button 
            onClick={() => { setActiveSection('fire'); setActiveTab('water'); }}
            className={`py-2 text-[10px] font-black rounded-xl transition-all ${activeSection === 'fire' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            آتش‌نشانی و ضد حریق
          </button>
          <button 
            onClick={() => { setActiveSection('plumbing'); setActiveTab('plumbing'); }}
            className={`py-2 text-[10px] font-black rounded-xl transition-all ${activeSection === 'plumbing' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            تاسیسات بهداشتی و فاضلاب
          </button>
          <button 
            onClick={() => { setActiveSection('hvac'); setActiveTab('hvac_load'); }}
            className={`py-2 text-[10px] font-black rounded-xl transition-all ${activeSection === 'hvac' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            تاسیسات مکانیکی و هوا
          </button>
        </div>

        {/* Back to Home / Main Menu button */}
        <button 
          onClick={resetToLanding}
          className="flex items-center justify-center gap-2 mb-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/80 rounded-2xl text-[11px] font-black transition-all cursor-pointer shadow-sm w-full"
          dir="rtl"
        >
          <Home className="w-4 h-4 text-slate-500" />
          <span>بازگشت به منوی اصلی</span>
        </button>

        {/* Technical User Guide Button */}
        <button 
          onClick={() => setShowGuide(true)}
          className="flex items-center justify-center gap-2 mb-4 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 border border-blue-200/80 rounded-2xl text-[11px] font-black transition-all cursor-pointer shadow-sm w-full"
          dir="rtl"
        >
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>کتابچه راهنما و مبانی محاسباتی</span>
        </button>
        
        <nav className="flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-1">
          {tabs.map((tab) => {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  sidebar-btn flex items-center justify-between gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 group w-full text-right
                  ${activeTab === tab.id 
                    ? (activeSection === 'gas' ? 'active-gas' : activeSection === 'fire' ? 'active-fire' : activeSection === 'plumbing' ? 'active-plumbing' : 'active-hvac') 
                    : 'text-slate-500 hover:bg-slate-50'}
                `}
              >
                <div className="flex items-center gap-3.5">
                  <tab.icon className={`w-5 h-5 transition-transform duration-500 ${
                    activeTab === tab.id 
                      ? (
                        activeSection === 'gas' ? 'animate-pulse-slow text-yellow-300 scale-110' :
                        activeSection === 'fire' ? 'animate-float text-rose-200 scale-110' :
                        activeSection === 'plumbing' ? 'animate-float text-cyan-200 scale-110' :
                        'animate-spin-slow text-amber-250 scale-110'
                      )
                      : 'text-slate-500 group-hover:scale-110 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                  }`} />
                  <span className="font-bold text-sm">{tab.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Dynamic Sponsor Ad */}
        <div className="mt-4 pt-4 border-t border-slate-105 dark:border-slate-800">
          <AdsSection variant="banner" onShowToast={showToast} isDark={isDark} />
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 font-sans">
            <p className="text-[10px] text-blue-700 font-black leading-relaxed">ویرایش پنجم ۱۴۰۳</p>
            <p className="text-[9px] text-blue-400 mt-0.5 uppercase font-bold tracking-tighter ltr">National Building Regulations</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className={`md:hidden h-16 border-b flex items-center justify-between px-4 sticky top-0 z-40 no-print transition-colors ${activeSection === 'gas' ? 'bg-blue-600 border-blue-500 text-white' : activeSection === 'fire' ? 'bg-rose-600 border-rose-500 text-white' : activeSection === 'plumbing' ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-amber-600 border-amber-500 text-white'}`}>
        <button 
          onClick={resetToLanding}
          className="bg-white/15 p-2.5 rounded-xl hover:bg-white/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
          title="بازگشت به منوی اصلی"
          dir="rtl"
        >
          <Home className="w-5 h-5 text-white" />
        </button>
        
        <div className="flex items-center gap-2 text-center overflow-hidden">
          <span className="font-black text-base truncate">{activeLabel}</span>
        </div>

        <button 
          onClick={() => setShowSectionSelector(true)}
          className="bg-white/15 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>تغییر بخش</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative bg-slate-50 dark:bg-[#070b13] transition-colors duration-500">
        {/* Revolutionary Context-Aware High Quality Background Image with glassmorphism blending */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
          <motion.div 
            key={activeSection}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: isDark ? 0.08 : 0.06, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${getProxiedImageUrl(sectionBackgrounds[activeSection])})`,
              filter: 'grayscale(15%) contrast(110%) blur(0.5px)'
            }}
          />
          {/* Subtle elegant engineering blueprint grid overlay */}
          <div className="absolute inset-0 bg-[size:36px_36px] bg-[linear-gradient(to_right,#e2e8f0_0.8px,transparent_0.8px),linear-gradient(to_bottom,#e2e8f0_0.8px,transparent_0.8px)] dark:bg-[linear-gradient(to_right,#1e293b_0.5px,transparent_0.5px),linear-gradient(to_bottom,#1e293b_0.5px,transparent_0.5px)] opacity-[0.24] dark:opacity-[0.14]" />
          
          {/* Glowing ambient flow spotlight in the top right corner */}
          <div className={`absolute top-0 right-1/4 w-[450px] h-[450px] rounded-full blur-[130px] opacity-[0.16] dark:opacity-[0.12] -translate-y-1/3 transition-all duration-700 ${
            activeSection === 'gas' ? 'bg-blue-500' :
            activeSection === 'fire' ? 'bg-rose-500' :
            activeSection === 'plumbing' ? 'bg-cyan-500' : 'bg-amber-500'
          }`} />
        </div>

        <div className={`h-full custom-scrollbar p-4 md:p-10 ${activeTab === 'contact' ? 'pb-10' : 'pb-28'} md:pb-10 overflow-y-auto relative z-10`}>
          {ActiveComponent === PlumbingSystem ? (
            <PlumbingSystem activeTabId={activeTab} />
          ) : ActiveComponent === MechanicalHvac ? (
            <MechanicalHvac activeTabId={activeTab} />
          ) : (
            <ActiveComponent />
          )}

          {/* Bottom Banner Ads identical to landing page */}
          <div className="mt-10 md:mt-16 border-t border-slate-200 dark:border-slate-800/80 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                حامیان توسعه و شرکای تجاری تائید شده گازینو:
              </h4>
            </div>
            <AdsSection variant="banner" onShowToast={showToast} isDark={isDark} />
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        {activeTab !== 'contact' && (
          <nav 
            className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 py-2 z-40 no-print"
            onTouchStart={handleInteractionStart}
            onTouchEnd={handleInteractionEnd}
            onMouseDown={handleInteractionStart}
            onMouseUp={handleInteractionEnd}
          >
            <div 
              ref={scrollRef}
              className="flex w-full overflow-x-auto no-scrollbar gap-1 px-2"
              style={{ direction: 'rtl' }}
            >
              {/* Double the tabs for infinite loop effect */}
              {[...tabs, ...tabs].map((tab, idx) => {
                return (
                  <button
                    key={`${tab.id}-${idx}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex flex-col items-center justify-center min-w-[80px] py-1 transition-all duration-300 relative
                      ${activeTab === tab.id 
                        ? (activeSection === 'gas' ? 'text-blue-600' : activeSection === 'fire' ? 'text-rose-600' : activeSection === 'plumbing' ? 'text-cyan-600' : 'text-amber-600') 
                        : 'text-slate-400'}
                    `}
                  >
                    {activeTab === tab.id && idx < tabs.length && (
                      <motion.div 
                        layoutId="activeTabMobile"
                        className={`absolute top-[-8px] w-5 h-1 rounded-full ${activeSection === 'gas' ? 'bg-blue-600' : activeSection === 'fire' ? 'bg-rose-600' : activeSection === 'plumbing' ? 'bg-cyan-600' : 'bg-amber-600'}`} 
                      />
                    )}
                    <div className="relative">
                      <tab.icon className="w-6 h-6 mb-1" />
                    </div>
                    <span className="text-[9px] font-bold">
                      {tab.id === 'valve' ? 'شیر' : 
                       tab.id === 'plumbing' ? 'آب/فاضلاب' :
                       tab.id === 'plumbing_reservoir' ? 'ذخیره آب' :
                       tab.id === 'plumbing_rainwater' ? 'آب باران' :
                       tab.id === 'plumbing_test' ? 'تست' :
                       tab.id === 'hvac_load' ? 'بار تهویه' :
                       tab.id === 'hvac_duct' ? 'کانال تهویه' :
                       tab.id === 'hvac_pipe' ? 'سایز لوله' :
                       tab.id === 'drafting' ? 'نقشه کشی' :
                       
                       tab.id === 'hvac_test' ? 'آزمون‌ها' :
                       tab.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </main>

      {/* Dynamic Section Selector Bottom Sheet / Centered Modal */}
      <AnimatePresence>
        {showSectionSelector && (
          <>
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSectionSelector(false)}
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm cursor-default"
            />

            {/* Bottom Sheet Modal Container */}
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-55 max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-t-[2.5rem] border-t border-slate-200/60 dark:border-slate-800 p-6 shadow-2xl font-sans text-right"
              dir="rtl"
            >
              {/* Drag Handle Indicator */}
              <div 
                className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700/65 rounded-full mx-auto mb-5 cursor-pointer" 
                onClick={() => setShowSectionSelector(false)} 
              />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">انتخاب بخش محاسباتی</h3>
                </div>
                <button
                  onClick={() => setShowSectionSelector(false)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-5 leading-relaxed font-black">
                حوزه محاسبات مهندسی و فنی مورد نظر خود را جهت جابجایی انتخاب کنید:
              </p>

              <div className="flex flex-col gap-3.5 mb-6">
                {[
                  {
                    id: 'gas' as SectionId,
                    label: 'سیستم گازرسانی و محاسبات',
                    subLabel: 'محاسبه لوله‌کشی، تهویه دهانه‌ها، کنتور، فواصل ایمنی و تست استقامت',
                    icon: Flame,
                    borderColor: 'border-blue-100 hover:border-blue-300 dark:border-blue-900/40 dark:hover:border-blue-800',
                    bgGradient: 'hover:bg-blue-50/40 dark:hover:bg-blue-950/20',
                    badge: 'مبحث ۱۷',
                    color: 'text-blue-600',
                    badgeBg: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200/40'
                  },
                  {
                    id: 'fire' as SectionId,
                    label: 'آتش‌نشانی و مهندسی ضد حریق',
                    subLabel: 'مخازن اطفا حریق، محاسبات لوله حریق، هد و دبی پمپ، کپسول اطفاء',
                    icon: FireExtinguisher,
                    borderColor: 'border-rose-100 hover:border-rose-300 dark:border-rose-900/40 dark:hover:border-rose-800',
                    bgGradient: 'hover:bg-rose-50/40 dark:hover:bg-rose-950/20',
                    badge: 'مبحث ۳',
                    color: 'text-rose-600',
                    badgeBg: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200/40'
                  },
                  {
                    id: 'plumbing' as SectionId,
                    label: 'تاسیسات بهداشتی و فاضلاب',
                    subLabel: 'طراحی لوله‌کشی آبرسانی ساختمان، فاضلاب، منبع مصرفی و آب باران',
                    icon: Wrench,
                    borderColor: 'border-cyan-100 hover:border-cyan-300 dark:border-cyan-900/40 dark:hover:border-cyan-800',
                    bgGradient: 'hover:bg-cyan-50/40 dark:hover:bg-cyan-950/20',
                    badge: 'مبحث ۱۶',
                    color: 'text-cyan-600',
                    badgeBg: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border border-cyan-200/40'
                  },
                  {
                    id: 'hvac' as SectionId,
                    label: 'تاسیسات مکانیکی و تهویه',
                    subLabel: 'بارهای برودتی حرارتی، سایز کانال تهویه، لوله‌های تاسیساتی و تست',
                    icon: Wind,
                    borderColor: 'border-amber-100 hover:border-amber-300 dark:border-amber-900/40 dark:hover:border-amber-800',
                    bgGradient: 'hover:bg-amber-50/40 dark:hover:bg-amber-950/20',
                    badge: 'مبحث ۱۴',
                    color: 'text-amber-600',
                    badgeBg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/40'
                  }
                ].map((sec) => {
                  const IconComp = sec.icon;
                  const isCurrent = activeSection === sec.id;
                  
                  return (
                    <button
                      key={sec.id}
                      onClick={() => {
                        handleSectionSelect(sec.id);
                        setShowSectionSelector(false);
                      }}
                      className={`w-full group p-4 border rounded-2xl flex items-start gap-3.5 transition-all duration-300 text-right cursor-pointer select-none active:scale-[0.98] ${sec.borderColor} ${sec.bgGradient} ${
                        isCurrent 
                          ? 'border-blue-650 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-900/10 shadow-sm shadow-blue-500/10' 
                          : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/60'
                      }`}
                    >
                      <div className={`p-3 rounded-2xl transition-all duration-300 group-hover:scale-105 shrink-0 ${
                        isCurrent 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 justify-between">
                          <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                            {sec.label}
                          </h4>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${sec.badgeBg}`}>
                            {sec.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-black truncate">
                          {sec.subLabel}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowSectionSelector(false)}
                className="w-full py-3 rounded-2xl text-slate-500 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-300 transition-colors font-extrabold text-xs text-center cursor-pointer active:scale-95 border border-slate-100 dark:border-slate-800/40"
              >
                انصراف و بستن
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;

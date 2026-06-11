import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  FireExtinguisher, 
  Droplet, 
  Cog, 
  Zap, 
  Calculator, 
  FileSpreadsheet, 
  FileText,
  Bell, 
  Menu, 
  X, 
  ArrowLeft, 
  Thermometer, 
  Pipette, 
  Scale, 
  ArrowRightLeft,
  ChevronLeft,
  BookOpen,
  MessageSquare,
  LogOut
} from 'lucide-react';
import { getProxiedImageUrl } from '../utils';

const UNIT_DATA = {
  pressure: {
    label: 'فشار',
    units: [
      { id: 'Bar', name: 'Bar (بار)', factor: 1 },
      { id: 'PSI', name: 'PSI (پوند بر اینچ مربع)', factor: 14.5038 },
      { id: 'KPa', name: 'KPa (کیلوپاسکال)', factor: 100 },
      { id: 'mmH2O', name: 'mmH2O (میلی‌متر ستون آب)', factor: 10197.16 },
      { id: 'Atm', name: 'Atm (اتمسفر اتمی)', factor: 0.986923 },
      { id: 'Pa', name: 'Pa (پاسکال)', factor: 100000 }
    ]
  },
  flow: {
    label: 'دبی مایعات',
    units: [
      { id: 'GPM', name: 'GPM (گالن بر دقیقه)', factor: 1 },
      { id: 'LPM', name: 'LPM (لیتر بر دقیقه)', factor: 3.78541 },
      { id: 'm3h', name: 'm³/h (مترمکعب بر ساعت)', factor: 0.227125 },
      { id: 'Ls', name: 'L/s (لیتر بر ثانیه)', factor: 0.0630902 },
      { id: 'm3s', name: 'm³/s (مترمکعب بر ثانیه)', factor: 0.0000630902 }
    ]
  },
  power: {
    label: 'توان و بار حرارتی',
    units: [
      { id: 'BTU', name: 'BTU/hr (حرارتی بریتانیا)', factor: 1 },
      { id: 'W', name: 'W (وات)', factor: 0.293071 },
      { id: 'kW', name: 'kW (کیلووات)', factor: 0.000293071 },
      { id: 'kcal', name: 'kcal/h (کیلوکالری بر ساعت)', factor: 0.251996 },
      { id: 'Tons', name: 'Tons (تن تبرید)', factor: 0.0000833333 },
      { id: 'HP', name: 'HP (اسب بخار توان)', factor: 0.000393015 }
    ]
  },
  length: {
    label: 'طول و سایز لوله',
    units: [
      { id: 'Inch', name: 'Inch (اینچ)', factor: 1 },
      { id: 'mm', name: 'mm (میلی‌متر)', factor: 25.4 },
      { id: 'cm', name: 'cm (سانتی‌متر)', factor: 2.54 },
      { id: 'm', name: 'm (متر)', factor: 0.0254 }
    ]
  },
  temp: {
    label: 'دما',
    units: [
      { id: 'C', name: 'Celsius (°C)', factor: 1 },
      { id: 'F', name: 'Fahrenheit (°F)', factor: 1 },
      { id: 'K', name: 'Kelvin (K)', factor: 1 }
    ]
  }
};

interface ClassicLandingProps {
  onSelectSection: (sectionId: string, tabId: string) => void;
  onShowGuide: () => void;
  isDark: boolean;
}

export default function ClassicLanding({ onSelectSection, onShowGuide, isDark }: ClassicLandingProps) {
  const [showMenuOverlay, setShowMenuOverlay] = useState(false);
  const [activeModal, setActiveModal] = useState<'unit' | 'electricity' | 'standards' | 'formulas' | null>(null);
  
  // Dynamic click count to unlock/lock secret admin options
  const [brandClicks, setBrandClicks] = useState(0);

  const handleBrandClick = () => {
    const nextClicks = brandClicks + 1;
    if (nextClicks >= 6) {
      setBrandClicks(0);
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
      setBrandClicks(nextClicks);
    }
  };

  // Unit converter states
  const [convertType, setConvertType] = useState<'pressure' | 'flow' | 'power' | 'length' | 'temp'>('pressure');
  const [inputUnit, setInputUnit] = useState<string>('Bar');
  const [outputUnit, setOutputUnit] = useState<string>('PSI');
  const [inputValue, setInputValue] = useState<string>('1');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animationFrameId: number;
    const autoScrollSpeed = 0.5; // very smooth and slow
    let isInteracting = false;
    let resumeTimeoutId: any = null;

    const scroll = () => {
      if (!container || isInteracting) return;
      
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0) return;

      const current = container.scrollLeft;
      
      if (current === 0) {
        container.scrollLeft = -1;
      } else if (current < 0) {
        // RTL negative values
        if (Math.abs(current) >= maxScroll - 1) {
          container.scrollLeft = 0;
        } else {
          container.scrollLeft -= autoScrollSpeed;
        }
      } else {
        // RTL positive fallback
        if (current >= maxScroll - 1) {
          container.scrollLeft = 0;
        } else {
          container.scrollLeft += autoScrollSpeed;
        }
      }
    };

    const loop = () => {
      scroll();
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    // Mouse drag-to-scroll implementation
    let isMouseDown = false;
    let startX = 0;
    let startScrollLeft = 0;

    const onMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      isInteracting = true;
      if (resumeTimeoutId) {
        clearTimeout(resumeTimeoutId);
        resumeTimeoutId = null;
      }
      startX = e.pageX - container.offsetLeft;
      startScrollLeft = container.scrollLeft;
      container.style.scrollBehavior = 'auto'; // precise drag positioning
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5; // drag speed modifier
      container.scrollLeft = startScrollLeft - walk;
    };

    const onMouseUpOrLeave = () => {
      if (isMouseDown) {
        isMouseDown = false;
        container.style.scrollBehavior = 'smooth';
        resumeTimeoutId = setTimeout(() => {
          isInteracting = false;
        }, 4000);
      }
    };

    // Touch events for mobile screens
    const onTouchStart = () => {
      isInteracting = true;
      if (resumeTimeoutId) {
        clearTimeout(resumeTimeoutId);
        resumeTimeoutId = null;
      }
      container.style.scrollBehavior = 'auto';
    };

    const onTouchEnd = () => {
      container.style.scrollBehavior = 'smooth';
      resumeTimeoutId = setTimeout(() => {
        isInteracting = false;
      }, 4000);
    };

    // Attach Event Listeners
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUpOrLeave);
    container.addEventListener('mouseleave', onMouseUpOrLeave);

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resumeTimeoutId) clearTimeout(resumeTimeoutId);
      
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUpOrLeave);
      container.removeEventListener('mouseleave', onMouseUpOrLeave);

      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const handleTypeChange = (type: 'pressure' | 'flow' | 'power' | 'length' | 'temp') => {
    setConvertType(type);
    if (type === 'pressure') {
      setInputUnit('Bar');
      setOutputUnit('PSI');
    } else if (type === 'flow') {
      setInputUnit('GPM');
      setOutputUnit('LPM');
    } else if (type === 'power') {
      setInputUnit('BTU');
      setOutputUnit('W');
    } else if (type === 'length') {
      setInputUnit('Inch');
      setOutputUnit('mm');
    } else if (type === 'temp') {
      setInputUnit('C');
      setOutputUnit('F');
    }
  };

  const getConvertedValue = (valStr: string, from: string, to: string, type: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val)) return '0';
    
    if (type === 'temp') {
      let celsius = val;
      if (from === 'F') {
        celsius = (val - 32) * 5 / 9;
      } else if (from === 'K') {
        celsius = val - 273.15;
      }
      
      let converted = celsius;
      if (to === 'C') {
        converted = celsius;
      } else if (to === 'F') {
        converted = (celsius * 9 / 5) + 32;
      } else if (to === 'K') {
        converted = celsius + 273.15;
      }
      return converted.toFixed(2);
    }
    
    const cat = UNIT_DATA[type as keyof typeof UNIT_DATA];
    const unitIn = cat.units.find(u => u.id === from);
    const unitOut = cat.units.find(u => u.id === to);
    if (!unitIn || !unitOut) return valStr;
    
    const baseValue = val / unitIn.factor;
    const finalValue = baseValue * unitOut.factor;
    
    if (finalValue === 0) return '0';
    if (Math.abs(finalValue) < 0.001) return finalValue.toExponential(3);
    if (Math.abs(finalValue) > 100000) return finalValue.toFixed(0);
    return finalValue.toLocaleString('en-US', { maximumFractionDigits: 4, minimumFractionDigits: 0 });
  };

  const handleQuickAccess = (type: string) => {
    if (type === 'tank') {
      onSelectSection('fire', 'water'); // Fire reservoir
    } else if (type === 'heat') {
      onSelectSection('hvac', 'hvac_load'); // Thermal HVAC Load
    } else if (type === 'pump') {
      onSelectSection('fire', 'pump'); // Fire Pump Selection
    } else if (type === 'pressure_drop') {
      onSelectSection('gas', 'pipe'); // Gas piping pressure drop / pipe sizes
    } else if (type === 'rainwater') {
      onSelectSection('plumbing', 'plumbing_rainwater');
    } else if (type === 'ventilation') {
      onSelectSection('gas', 'ventilation');
    } else if (type === 'plumbing') {
      onSelectSection('plumbing', 'plumbing');
    } else if (type === 'extinguisher') {
      onSelectSection('fire', 'extinguisher');
    } else if (type === 'hvac_duct') {
      onSelectSection('hvac', 'hvac_duct');
    } else if (type === 'hvac_pipe') {
      onSelectSection('hvac', 'hvac_pipe');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto min-h-screen flex flex-col justify-between font-sans px-4 pb-24 relative select-none" dir="rtl">
      
      {/* Decorative Wavy Lines Background absolute to container header */}
      <div className="absolute top-0 left-0 right-0 h-64 overflow-hidden pointer-events-none z-0">
        <svg className="absolute w-full h-full opacity-35 dark:opacity-20 text-blue-500/30" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,160 C120,220 240,240 360,200 C480,160 600,60 720,80 C840,100 960,240 1080,240 C1200,240 1320,100 1440,120 L1440,0 L0,0 Z"></path>
        </svg>
        <svg className="absolute w-full h-full opacity-20 dark:opacity-10 text-cyan-400/40" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ top: '15px' }}>
          <path fill="currentColor" d="M0,96 C120,140 240,200 360,192 C480,180 600,100 720,130 C840,160 960,260 1080,220 C1200,180 1320,120 1440,160 L1440,0 L0,0 Z"></path>
        </svg>
      </div>

      {/* Top Banner Header Row with icons */}
      <div className="relative z-10 flex items-center justify-between pt-2 pb-0.5 no-print">
        {/* Hamburger Menu on right */}
        <button 
          onClick={() => setShowMenuOverlay(true)}
          className="w-10 h-10 rounded-full bg-white/75 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:scale-105 active:scale-95 transition-all shadow-sm"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Center Title and Logo */}
        <div className="text-center flex-1">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBrandClick}
            dir="ltr"
            className="text-3xl font-black tracking-tight flex items-center justify-center gap-[2.5px] cursor-pointer select-none font-sans"
            title="ضربه بزنید"
          >
            {["G", "a", "s", "i", "n", "o"].map((letter, idx) => {
              const gradients = [
                "from-blue-600 to-blue-500",
                "from-blue-500 to-cyan-500",
                "from-cyan-500 to-emerald-500",
                "from-emerald-500 to-amber-500",
                "from-amber-500 to-rose-500",
                "from-rose-500 to-rose-600"
              ];
              return (
                <span 
                  key={idx} 
                  className={`bg-gradient-to-br ${gradients[idx]} bg-clip-text text-transparent`}
                >
                  {letter}
                </span>
              );
            })}
          </motion.h1>
        </div>

        {/* Right side spacer to balance the centered design perfectly */}
        <div className="w-10 h-10" />
      </div>

      {/* Grid of 8 Core Boxes with stunning visual covers and hover effects */}
      <div className="relative z-10 grid grid-cols-2 gap-3 mt-8">
        
        {/* Card 1: تأسیسات مکانیکی */}
        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => onSelectSection('hvac', 'hvac_load')}
          className="group overflow-hidden rounded-2xl aspect-[2.1/1] relative border border-slate-200/10 dark:border-slate-850 shadow-md flex flex-col items-center justify-center p-3 cursor-pointer select-none"
        >
          {/* Cover Image */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 ease-out scale-100 group-hover:scale-105"
            style={{ backgroundImage: `url(${getProxiedImageUrl('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80')})` }}
          />
          {/* Dark Glassmorphism Overlay */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-slate-900/40 opacity-90 transition-opacity duration-300 group-hover:opacity-95" />
          
          {/* Radial Light Leak / Halo */}
          <div className="absolute -inset-1 z-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500" />
          
          {/* Card Content */}
          <div className="relative z-20 flex flex-col items-center text-center">
            {/* Glowing Icon Container */}
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 flex items-center justify-center mb-1.5 transition-colors duration-300 group-hover:bg-emerald-500/20 group-hover:border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.15)] group-hover:shadow-[0_0_15px_rgba(16,185,129,0.25)]">
              <Cog className="w-5 h-5 animate-spin-slow text-emerald-400 dark:text-emerald-350" />
            </div>
            <span className="font-extrabold text-xs text-white tracking-wide">تأسیسات مکانیکی</span>
            <span className="text-[8.5px] text-slate-350 font-bold mt-0.5 max-w-[140px] leading-relaxed line-clamp-1 shadow-sm">بار تهویه، کانال‌کشی و چیلر</span>
          </div>
        </motion.div>

        {/* Card 2: تاسیسات بهداشتی */}
        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => onSelectSection('plumbing', 'plumbing')}
          className="group overflow-hidden rounded-2xl aspect-[2.1/1] relative border border-slate-200/10 dark:border-slate-850 shadow-md flex flex-col items-center justify-center p-3 cursor-pointer select-none"
        >
          {/* Cover Image */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 ease-out scale-100 group-hover:scale-105"
            style={{ backgroundImage: `url(${getProxiedImageUrl('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80')})` }}
          />
          {/* Dark Glassmorphism Overlay */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-slate-900/40 opacity-90 transition-opacity duration-300 group-hover:opacity-95" />
          
          {/* Radial Light Leak / Halo */}
          <div className="absolute -inset-1 z-0 bg-gradient-to-r from-sky-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500" />
          
          {/* Card Content */}
          <div className="relative z-20 flex flex-col items-center text-center">
            {/* Glowing Icon Container */}
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 backdrop-blur-md border border-sky-500/30 flex items-center justify-center mb-1.5 transition-colors duration-300 group-hover:bg-sky-500/20 group-hover:border-sky-400/50 shadow-[0_0_10px_rgba(56,189,248,0.15)] group-hover:shadow-[0_0_15px_rgba(56,189,248,0.25)]">
              <Droplet className="w-5 h-5 animate-float text-sky-400 dark:text-sky-350" />
            </div>
            <span className="font-extrabold text-xs text-white tracking-wide">تاسیسات بهداشتی</span>
            <span className="text-[8.5px] text-slate-355 font-bold mt-0.5 max-w-[140px] leading-relaxed line-clamp-1 shadow-sm">آبرسانی بر اساس SFU و شیب</span>
          </div>
        </motion.div>

        {/* Card 3: آتش‌نشانی و اطفاء حریق */}
        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => onSelectSection('fire', 'water')}
          className="group overflow-hidden rounded-2xl aspect-[2.1/1] relative border border-slate-200/10 dark:border-slate-850 shadow-md flex flex-col items-center justify-center p-3 cursor-pointer select-none"
        >
          {/* Cover Image */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 ease-out scale-100 group-hover:scale-105"
            style={{ backgroundImage: `url(${getProxiedImageUrl('https://images.unsplash.com/photo-1516383274235-5f42d6c6426d?auto=format&fit=crop&w=600&q=80')})` }}
          />
          {/* Dark Glassmorphism Overlay */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-slate-900/40 opacity-90 transition-opacity duration-300 group-hover:opacity-95" />
          
          {/* Radial Light Leak / Halo */}
          <div className="absolute -inset-1 z-0 bg-gradient-to-r from-rose-500/20 to-red-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500" />
          
          {/* Card Content */}
          <div className="relative z-20 flex flex-col items-center text-center">
            {/* Glowing Icon Container */}
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 backdrop-blur-md border border-rose-500/30 flex items-center justify-center mb-1.5 transition-colors duration-300 group-hover:bg-rose-500/20 group-hover:border-rose-400/50 shadow-[0_0_10px_rgba(244,63,94,0.15)] group-hover:shadow-[0_0_15px_rgba(244,63,94,0.25)]">
              <FireExtinguisher className="w-5 h-5 animate-pulse-slow text-rose-400 dark:text-rose-350" />
            </div>
            <span className="font-extrabold text-xs text-white tracking-wide">آتش‌نشانی و اطفاء</span>
            <span className="text-[8.5px] text-slate-355 font-bold mt-0.5 max-w-[140px] leading-relaxed line-clamp-1 shadow-sm">هد پمپ، کلکتور و اسپرینکلر</span>
          </div>
        </motion.div>

        {/* Card 4: سیستم گازرسانی */}
        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => onSelectSection('gas', 'pipe')}
          className="group overflow-hidden rounded-2xl aspect-[2.1/1] relative border border-slate-200/10 dark:border-slate-850 shadow-md flex flex-col items-center justify-center p-3 cursor-pointer select-none"
        >
          {/* Cover Image */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 ease-out scale-100 group-hover:scale-105"
            style={{ backgroundImage: `url(${getProxiedImageUrl('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80')})` }}
          />
          {/* Dark Glassmorphism Overlay */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-slate-900/40 opacity-90 transition-opacity duration-300 group-hover:opacity-95" />
          
          {/* Radial Light Leak / Halo */}
          <div className="absolute -inset-1 z-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500" />
          
          {/* Card Content */}
          <div className="relative z-20 flex flex-col items-center text-center">
            {/* Glowing Icon Container */}
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 backdrop-blur-md border border-blue-500/30 flex items-center justify-center mb-1.5 transition-colors duration-300 group-hover:bg-blue-500/20 group-hover:border-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.15)] group-hover:shadow-[0_0_15px_rgba(59,130,246,0.25)]">
              <Flame className="w-5 h-5 animate-pulse-slow text-blue-400 dark:text-blue-350" />
            </div>
            <span className="font-extrabold text-xs text-white tracking-wide">سیستم گازرسانی</span>
            <span className="text-[8.5px] text-slate-355 font-bold mt-0.5 max-w-[140px] leading-relaxed line-clamp-1 shadow-sm">مبحث ۱۷ لوله‌کشی و دودکش‌</span>
          </div>
        </motion.div>

        {/* Card 5: کتابچه راهنما و مقررات */}
        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={onShowGuide}
          className="group overflow-hidden rounded-2xl aspect-[2.1/1] relative border border-slate-200/10 dark:border-slate-850 shadow-md flex flex-col items-center justify-center p-3 cursor-pointer select-none"
        >
          {/* Cover Image */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 ease-out scale-100 group-hover:scale-105"
            style={{ backgroundImage: `url(${getProxiedImageUrl('https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=600&q=80')})` }}
          />
          {/* Dark Glassmorphism Overlay */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-slate-900/40 opacity-90 transition-opacity duration-300 group-hover:opacity-95" />
          
          {/* Radial Light Leak / Halo */}
          <div className="absolute -inset-1 z-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500" />
          
          {/* Card Content */}
          <div className="relative z-20 flex flex-col items-center text-center">
            {/* Glowing Icon Container */}
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 backdrop-blur-md border border-amber-500/30 flex items-center justify-center mb-1.5 transition-colors duration-300 group-hover:bg-amber-500/20 group-hover:border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.15)] group-hover:shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <BookOpen className="w-5 h-5 animate-float text-amber-400 dark:text-amber-350" />
            </div>
            <span className="font-extrabold text-xs text-white tracking-wide">راهنما و مقررات</span>
            <span className="text-[8.5px] text-slate-355 font-bold mt-0.5 max-w-[140px] leading-relaxed line-clamp-1 shadow-sm">راهنمای ۱۶، ۱۴، ۱۷ و فرمول‌ها</span>
          </div>
        </motion.div>

        {/* Card 6: ابزارها و تبدیل واحد */}
        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => setActiveModal('unit')}
          className="group overflow-hidden rounded-2xl aspect-[2.1/1] relative border border-slate-200/10 dark:border-slate-850 shadow-md flex flex-col items-center justify-center p-3 cursor-pointer select-none"
        >
          {/* Cover Image */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 ease-out scale-100 group-hover:scale-105"
            style={{ backgroundImage: `url(${getProxiedImageUrl('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80')})` }}
          />
          {/* Dark Glassmorphism Overlay */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-slate-900/40 opacity-90 transition-opacity duration-300 group-hover:opacity-95" />
          
          {/* Radial Light Leak / Halo */}
          <div className="absolute -inset-1 z-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500" />
          
          {/* Card Content */}
          <div className="relative z-20 flex flex-col items-center text-center">
            {/* Glowing Icon Container */}
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 backdrop-blur-md border border-orange-500/30 flex items-center justify-center mb-1.5 transition-colors duration-300 group-hover:bg-orange-500/20 group-hover:border-orange-400/50 shadow-[0_0_10px_rgba(249,115,22,0.15)] group-hover:shadow-[0_0_15px_rgba(249,115,22,0.25)]">
              <Calculator className="w-5 h-5 animate-pulse-slow text-orange-400 dark:text-orange-350" />
            </div>
            <span className="font-extrabold text-xs text-white tracking-wide">تبدیل واحد مهندسی</span>
            <span className="text-[8.5px] text-slate-355 font-bold mt-0.5 max-w-[140px] leading-relaxed line-clamp-1 shadow-sm">فشار، دما، دبی و توان حرارتی</span>
          </div>
        </motion.div>

        {/* Card 7: تماس با ما */}
        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => onSelectSection('gas', 'contact')}
          className="group overflow-hidden rounded-2xl aspect-[2.1/1] relative border border-slate-200/10 dark:border-slate-850 shadow-md flex flex-col items-center justify-center p-3 cursor-pointer select-none"
        >
          {/* Cover Image */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-705 ease-out scale-100 group-hover:scale-105"
            style={{ backgroundImage: `url(${getProxiedImageUrl('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80')})` }}
          />
          {/* Dark Glassmorphism Overlay */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-slate-900/40 opacity-90 transition-opacity duration-300 group-hover:opacity-95" />
          
          {/* Radial Light Leak / Halo */}
          <div className="absolute -inset-1 z-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500" />
          
          {/* Card Content */}
          <div className="relative z-20 flex flex-col items-center text-center">
            {/* Glowing Icon Container */}
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 backdrop-blur-md border border-violet-500/30 flex items-center justify-center mb-1.5 transition-colors duration-300 group-hover:bg-violet-500/20 group-hover:border-violet-400/50 shadow-[0_0_10px_rgba(139,92,246,0.15)] group-hover:shadow-[0_0_15px_rgba(139,92,246,0.25)]">
              <MessageSquare className="w-5 h-5 animate-float text-violet-400 dark:text-violet-350" />
            </div>
            <span className="font-extrabold text-xs text-white tracking-wide">تماس با ما</span>
            <span className="text-[8.5px] text-slate-355 font-bold mt-0.5 max-w-[140px] leading-relaxed line-clamp-1 shadow-sm">مشاوره آنلاین با کارشناسان</span>
          </div>
        </motion.div>

        {/* Card 8: فروشگاه ملزومات و قیمت */}
        <motion.div
          whileHover={{ y: -4, scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => onSelectSection('gas', 'store')}
          className="group overflow-hidden rounded-2xl aspect-[2.1/1] relative border border-slate-200/10 dark:border-slate-850 shadow-md flex flex-col items-center justify-center p-3 cursor-pointer select-none"
        >
          {/* Cover Image */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 ease-out scale-100 group-hover:scale-105"
            style={{ backgroundImage: `url(${getProxiedImageUrl('https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=600&q=80')})` }}
          />
          {/* Dark Glassmorphism Overlay */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-slate-900/40 opacity-90 transition-opacity duration-300 group-hover:opacity-95" />
          
          {/* Radial Light Leak / Halo */}
          <div className="absolute -inset-1 z-0 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500" />
          
          {/* Card Content */}
          <div className="relative z-20 flex flex-col items-center text-center">
            {/* Glowing Icon Container */}
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 backdrop-blur-md border border-indigo-500/30 flex items-center justify-center mb-1.5 transition-colors duration-300 group-hover:bg-indigo-500/20 group-hover:border-indigo-400/50 shadow-[0_0_10px_rgba(99,102,241,0.15)] group-hover:shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              <svg className="w-5 h-5 text-indigo-400 dark:text-indigo-300 animate-pulse-slow font-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span className="font-extrabold text-xs text-white tracking-wide">فروشگاه ملزومات</span>
            <span className="text-[8.5px] text-slate-355 font-bold mt-0.5 max-w-[140px] leading-relaxed line-clamp-1 shadow-sm">لیست قیمت لوله‌ها و اتصالات</span>
          </div>
        </motion.div>

      </div>

      {/* Bottom Area: "دسترسی سریع" Banner exactly matching mockup look with circular item links */}
      <div className="relative z-10 bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 p-5 rounded-3xl mt-8">
        <h3 className="font-black text-xs text-blue-700 dark:text-blue-400 text-center mb-4">
          دسترسی سریع به محاسبات مرجع
        </h3>
        
        <div ref={scrollRef} className="flex flex-row overflow-x-auto gap-4 pb-2.5 pt-1 scroll-smooth select-none touch-pan-x" style={{ direction: 'rtl', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          
          {/* Quick Item 1: حجم مخزن */}
          <button 
            onClick={() => handleQuickAccess('tank')}
            className="flex flex-col items-center gap-1.5 focus:outline-none group flex-shrink-0 w-[78px]"
          >
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/55 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 flex items-center justify-center transition shadow-sm active:scale-90 group-hover:scale-105">
              <Droplet className="w-4 h-4 text-rose-500" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 text-center truncate w-full">حجم مخزن</span>
          </button>

          {/* Quick Item 2: محاسبه بار حرارتی */}
          <button 
            onClick={() => handleQuickAccess('heat')}
            className="flex flex-col items-center gap-1.5 focus:outline-none group flex-shrink-0 w-[78px]"
          >
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/55 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 flex items-center justify-center transition shadow-sm active:scale-90 group-hover:scale-105">
              <Thermometer className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 text-center truncate w-full">بار حرارتی</span>
          </button>

          {/* Quick Item 3: انتخاب پمپ */}
          <button 
            onClick={() => handleQuickAccess('pump')}
            className="flex flex-col items-center gap-1.5 focus:outline-none group flex-shrink-0 w-[78px]"
          >
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/55 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 flex items-center justify-center transition shadow-sm active:scale-90 group-hover:scale-105">
              <Cog className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 text-center truncate w-full">انتخاب پمپ</span>
          </button>

          {/* Quick Item 4: محاسبه افت فشار */}
          <button 
            onClick={() => handleQuickAccess('pressure_drop')}
            className="flex flex-col items-center gap-1.5 focus:outline-none group flex-shrink-0 w-[78px]"
          >
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/55 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 flex items-center justify-center transition shadow-sm active:scale-90 group-hover:scale-105">
              <Flame className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 text-center truncate w-full">افت فشار لوله</span>
          </button>

          {/* Quick Item 5: سایزینگ لوله SFU */}
          <button 
            onClick={() => handleQuickAccess('plumbing')}
            className="flex flex-col items-center gap-1.5 focus:outline-none group flex-shrink-0 w-[78px]"
          >
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/55 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 flex items-center justify-center transition shadow-sm active:scale-90 group-hover:scale-105">
              <Droplet className="w-4 h-4 text-sky-500" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 text-center truncate w-full">سایزینگ SFU</span>
          </button>

          {/* Quick Item 6: لوله آب باران */}
          <button 
            onClick={() => handleQuickAccess('rainwater')}
            className="flex flex-col items-center gap-1.5 focus:outline-none group flex-shrink-0 w-[78px]"
          >
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/55 dark:border-slate-700 hover:border-pink-400 dark:hover:border-pink-500 flex items-center justify-center transition shadow-sm active:scale-90 group-hover:scale-105">
              <Droplet className="w-4 h-4 text-pink-500" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 text-center truncate w-full">آب باران بام</span>
          </button>

          {/* Quick Item 7: دودکش و تهویه */}
          <button 
            onClick={() => handleQuickAccess('ventilation')}
            className="flex flex-col items-center gap-1.5 focus:outline-none group flex-shrink-0 w-[78px]"
          >
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/55 dark:border-slate-700 hover:border-orange-400 dark:hover:border-orange-500 flex items-center justify-center transition shadow-sm active:scale-90 group-hover:scale-105">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 text-center truncate w-full">تهویه و دودکش</span>
          </button>

          {/* Quick Item 8: کانال‌کشی هوا */}
          <button 
            onClick={() => handleQuickAccess('hvac_duct')}
            className="flex flex-col items-center gap-1.5 focus:outline-none group flex-shrink-0 w-[78px]"
          >
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/55 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 flex items-center justify-center transition shadow-sm active:scale-90 group-hover:scale-105">
              <Cog className="w-4 h-4 text-violet-500" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 text-center truncate w-full">سایز کانال هوا</span>
          </button>

          {/* Quick Item 9: لوله‌کشی چیلر */}
          <button 
            onClick={() => handleQuickAccess('hvac_pipe')}
            className="flex flex-col items-center gap-1.5 focus:outline-none group flex-shrink-0 w-[78px]"
          >
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/55 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 flex items-center justify-center transition shadow-sm active:scale-90 group-hover:scale-105">
              <Droplet className="w-4 h-4 text-indigo-500" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 text-center truncate w-full">لوله‌کشی چیلر</span>
          </button>

          {/* Quick Item 10: کپسول اطفاء */}
          <button 
            onClick={() => handleQuickAccess('extinguisher')}
            className="flex flex-col items-center gap-1.5 focus:outline-none group flex-shrink-0 w-[78px]"
          >
            <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/55 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-500 flex items-center justify-center transition shadow-sm active:scale-90 group-hover:scale-105">
              <FireExtinguisher className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-300 text-center truncate w-full">کپسول حریق</span>
          </button>

        </div>
      </div>

      {/* Hamburger menu slide overlay */}
      <AnimatePresence>
        {showMenuOverlay && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenuOverlay(false)}
              className="fixed inset-0 bg-slate-950 z-[150] cursor-default"
            />
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 right-0 w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[160] p-6 text-right flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="font-black text-base text-slate-850 dark:text-white">منوی ابزار گازینو</h3>
                  <button onClick={() => setShowMenuOverlay(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-extrabold">
                  <button 
                    onClick={() => { setShowMenuOverlay(false); onShowGuide(); }}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-right"
                  >
                    <BookOpen className="w-4.5 h-4.5 text-blue-600" />
                    <span>کتابچه راهنما و مقررات مباحث</span>
                  </button>
                  
                  <button 
                    onClick={() => { setShowMenuOverlay(false); setActiveModal('unit'); }}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-right"
                  >
                    <Calculator className="w-4.5 h-4.5 text-orange-500" />
                    <span>ماشین‌حساب تبدیل واحدهای مهندسی</span>
                  </button>

                  <button 
                    onClick={() => { 
                      setShowMenuOverlay(false);
                      if (confirm("آیا مایل به خروج از برنامه هستید؟")) {
                        localStorage.clear();
                        try {
                          window.close();
                        } catch (e) {}
                        window.location.reload();
                      }
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/25 text-right text-red-600 dark:text-red-400 group transition-all"
                  >
                    <LogOut className="w-4.5 h-4.5 text-red-500 group-hover:translate-x-0.5 transition-transform" />
                    <span>خروج از برنامه</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-center">
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal font-bold">
                  گازینو | نرم‌افزار هوشمند محاسباتی تاسیسات منطبق بر مقررات ملی ساختمان
                </p>
                <p className="text-[9px] text-[#2563eb]/70 mt-1 font-mono uppercase tracking-widest font-black">
                  Edition 2026 v5.3
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Dynamic Popups for secondary item click events (Preventing dead link stubs) */}
      <AnimatePresence>
        
        {/* Unit Converter Modal */}
        {activeModal === 'unit' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950"
              onClick={() => setActiveModal(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-2xl p-6 text-right"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-4">
                <h3 className="font-black text-sm text-slate-850 dark:text-white flex items-center gap-2">
                  <Calculator className="w-4.5 h-4.5 text-orange-500" />
                  <span>ماشین‌حساب مبدل واحدهای تاسیساتی</span>
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                  <X className="w-4.5 h-4.5 text-slate-400" />
                </button>
              </div>

              {/* Category pills grid */}
              <div className="flex flex-wrap gap-1 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-2xl mb-4 text-center font-bold text-[10px]">
                {(Object.keys(UNIT_DATA) as Array<keyof typeof UNIT_DATA>).map(catKey => (
                  <button 
                    key={catKey}
                    onClick={() => handleTypeChange(catKey)}
                    className={`px-3 py-1.5 rounded-xl transition-all ${convertType === catKey ? 'bg-orange-500 text-white shadow font-black' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  >
                    {UNIT_DATA[catKey].label}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {/* Input Numeric Value */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1">
                    مقدار عددی ورودی:
                  </label>
                  <input 
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value ?? '')}
                    className="w-full text-left font-mono font-black ltr bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-3 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:border-orange-500"
                    placeholder="مقدار را وارد کنید..."
                  />
                </div>

                {/* Dropdowns for Unit Selection and Swap Button */}
                <div className="grid grid-cols-11 gap-1 items-center">
                  {/* Source Unit */}
                  <div className="col-span-5">
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1">
                      واحد مبدا:
                    </label>
                    <select
                      value={inputUnit}
                      onChange={(e) => setInputUnit(e.target.value)}
                      className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-2 rounded-xl text-slate-700 dark:text-slate-200 outline-none ltr text-left"
                    >
                      {UNIT_DATA[convertType].units.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Swap Button */}
                  <div className="col-span-1 flex justify-center pt-4">
                    <button 
                      onClick={() => {
                        const temp = inputUnit;
                        setInputUnit(outputUnit);
                        setOutputUnit(temp);
                      }}
                      className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/45 border border-orange-100 dark:border-orange-900 text-orange-600 dark:text-orange-400 hover:scale-105 active:scale-95 transition-all shadow-sm"
                      title="تعویض واحد مبدا و مقصد"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 rotate-90" />
                    </button>
                  </div>

                  {/* Target Unit */}
                  <div className="col-span-1 flex justify-center pt-4" /> {/* empty spacer spacer balance layout */}
                  <div className="col-span-4">
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1">
                      واحد مقصد:
                    </label>
                    <select
                      value={outputUnit}
                      onChange={(e) => setOutputUnit(e.target.value)}
                      className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 p-2 rounded-xl text-slate-700 dark:text-slate-200 outline-none ltr text-left"
                    >
                      {UNIT_DATA[convertType].units.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Main Conversion Result Display Card */}
                <div className="bg-orange-500/5 dark:bg-orange-500/10 border border-orange-200/50 dark:border-orange-850 p-4 rounded-2xl text-center">
                  <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider block mb-1">
                    نتیجه نهایی تبدیل
                  </span>
                  <div className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight leading-none my-1 flex items-center justify-center gap-1 ltr">
                    <span className="text-orange-500">{inputValue || '0'}</span>
                    <span className="text-xs text-slate-500 font-bold font-sans uppercase">{inputUnit}</span>
                    <span className="text-slate-400 dark:text-slate-500 font-sans mx-1">═▶</span>
                    <span className="text-emerald-500 font-black">{getConvertedValue(inputValue, inputUnit, outputUnit, convertType)}</span>
                    <span className="text-xs text-slate-500 font-bold font-sans uppercase">{outputUnit}</span>
                  </div>
                </div>

                {/* Secondary: Comparison cheat sheet table of other units */}
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 p-3.5 rounded-2xl max-h-[160px] overflow-y-auto">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 block mb-2 border-b border-dashed border-slate-200 dark:border-slate-700 pb-1.5">
                    مقادیر معادل در سایر واحدها:
                  </span>
                  <div className="space-y-1.5 select-all">
                    {UNIT_DATA[convertType].units
                      .filter(unit => unit.id !== inputUnit)
                      .map(unit => (
                        <div key={unit.id} className="flex justify-between items-center text-xs ltr text-left">
                          <span className="font-bold text-slate-500 dark:text-slate-400 text-[10px] font-sans rtl text-right">
                            {unit.name}
                          </span>
                          <span className="font-mono font-black text-slate-700 dark:text-slate-300 text-[11px]">
                            {getConvertedValue(inputValue, inputUnit, unit.id, convertType)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 text-[9px] font-bold text-slate-400 text-center leading-normal">
                این تبدیل واحدها جهت کالیبراسیون داده‌های پمپ و سیستم‌های آبرسانی مطابق مرجع تهیه‌شده است.
              </div>
            </motion.div>
          </div>
        )}

        {/* Electricity Notifier Info Modal */}
        {activeModal === 'electricity' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950"
              onClick={() => setActiveModal(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-2xl p-6 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="font-black text-sm text-slate-800 dark:text-white mb-2">تجهیزات و محاسبات الکتریکی ساختمان</h3>
              <p className="text-[11px] leading-relaxed font-bold text-slate-500 dark:text-slate-400 px-2 max-w-xs mx-auto">
                محاسبات کابل‌کشی، محاسبه توان، بار کلید محافظ و ضوابط ایمنی الکتریکی بر پایه مبحث ۱۳ مقررات ملی ساختمان در فاز بعدی گازینو فعال خواهد شد.
              </p>
              
              <div className="mt-6">
                <button 
                  onClick={() => setActiveModal(null)}
                  className="w-full bg-violet-600 hover:bg-violet-750 text-white py-3 rounded-2xl font-black text-xs active:scale-98 transition shadow"
                >
                  فهمیدم، سپاس
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Standards Information table modal */}
        {activeModal === 'standards' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950"
              onClick={() => setActiveModal(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-2xl p-5 text-right"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3.5">
                <h3 className="font-black text-sm text-slate-850 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4.5 h-4.5 text-cyan-600" />
                  <span>برخی جداول استاندارد مباحث ملّی</span>
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                  <X className="w-4.5 h-4.5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <h4 className="font-black text-xs text-cyan-600 dark:text-cyan-400 mb-1">کنتورهای خانگی گازی (مبحث ۱۷)</h4>
                  <p className="text-[10px] leading-relaxed font-semibold text-slate-500 dark:text-slate-400">
                    کنتور G10 با ظرفیت حداکثر ۱۶ مترمکعب بر ساعت و کنتور G16 با حداکثر ظرفیت ۲۵ مترمکعب بر ساعت مناسب سایزهای بالا می‌باشد.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <h4 className="font-black text-xs text-cyan-600 dark:text-cyan-400 mb-1">دبی‌های توصیه‌شده شیب فاضلاب (مبحث ۱۶)</h4>
                  <p className="text-[10px] leading-relaxed font-semibold text-slate-500 dark:text-slate-400">
                    لوله‌کشی با قطر ۳ الی ۴ اینچ نیاز به حداقل شیب ۱ درصد الی ۲ درصد دارد تا فرآیند ثقلی دفع به درستی اجرا شود.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <h4 className="font-black text-xs text-cyan-600 dark:text-cyan-400 mb-1">سرعت مجاز آب اصفاء حریق</h4>
                  <p className="text-[10px] leading-relaxed font-semibold text-slate-500 dark:text-slate-400">
                    سرعت حرکت آب در خطوط مکش نباید از ۱.۵ متر بر ثانیه و در خطوط رانش هد کلکتور از ۳ متر بر ثانیه تجاوز نماید تا کارایی پمپ تضمین گردد.
                  </p>
                </div>
              </div>

              <div className="mt-4 text-center">
                <button 
                  onClick={() => { setActiveModal(null); onShowGuide(); }}
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-600 hover:text-cyan-700 font-black"
                >
                  <span>مشاهده کتابچه مرجع کامل</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Formulas detail overlay */}
        {activeModal === 'formulas' && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950"
              onClick={() => setActiveModal(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-2xl p-5 text-right"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3.5">
                <h3 className="font-black text-sm text-slate-850 dark:text-white flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                  <span>فرمول‌های مرجع مهندسی تاسیسات</span>
                </h3>
                <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                  <X className="w-4.5 h-4.5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 p-3.5 rounded-2xl">
                  <p className="text-[10px] font-black text-[#555] dark:text-slate-400 mb-1">فرمول مقدار دبی دایره‌ای آب باران:</p>
                  <code className="block text-left text-xs bg-slate-950 text-emerald-400 font-mono p-2 rounded-xl ltr mb-1 select-all">
                    Q = (A * I) / 3600
                  </code>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold">Q دبی بر حسب لیتر بر ثانیه و I شدت بارندگی منطقه به میلی‌متر است.</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 p-3.5 rounded-2xl">
                  <p className="text-[10px] font-black text-[#555] dark:text-slate-400 mb-1">افت اصطکاکی با فرمول Hazen-Williams:</p>
                  <code className="block text-left text-xs bg-slate-950 text-emerald-400 font-mono p-2 rounded-xl ltr mb-1 select-all">
                    h_f = 6.05 * 10^5 * L * Q^(1.85) / (C^(1.85) * d^(4.87))
                  </code>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold">h_f مقدار افت هد بر حسب فشار و d قطر داخلی لوله است.</span>
                </div>
              </div>

              <div className="mt-5">
                <button 
                  onClick={() => { setActiveModal(null); onShowGuide(); }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-2xl font-black text-xs active:scale-98 transition shadow"
                >
                  کتابچه کامل مرجع محاسبات
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>
      
    </div>
  );
}

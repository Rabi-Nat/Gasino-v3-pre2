import React, { useState } from 'react';
import { 
  Droplets, 
  Calculator, 
  Info, 
  Check, 
  HelpCircle, 
  Trash2, 
  Plus, 
  Sliders, 
  Activity, 
  Layers, 
  TrendingDown, 
  Workflow,
  Sparkles,
  ArrowRightLeft,
  CloudRain,
  ClipboardCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Custom Type declarations
interface PlumbingFixture {
  id: string;
  name: string;
  sfuCold: number;
  sfuHot: number;
  sfuTotal: number;
  dfu: number;
  icon: string;
  isPublic?: boolean;
}

// Standards-derived fixtures according to Topic 16 (مبحث ۱۶ مقررات ملی)
const FIXTURE_STANDARDS: PlumbingFixture[] = [
  { id: 'lavatory', name: 'دستشویی (روشویی) خصوصی', sfuCold: 0.5, sfuHot: 0.5, sfuTotal: 0.7, dfu: 1, icon: '🧼', isPublic: false },
  { id: 'toilet_tank', name: 'توالت ایرانی / فرنگی خصوصی (با فلاش‌تانک)', sfuCold: 2.2, sfuHot: 0, sfuTotal: 2.2, dfu: 3, icon: '🚽', isPublic: false },
  { id: 'toilet_valve', name: 'توالت ایرانی / فرنگی خصوصی (با فلاش‌والو)', sfuCold: 6.0, sfuHot: 0, sfuTotal: 6.0, dfu: 5, icon: '⚡', isPublic: false },
  { id: 'sink', name: 'سینک ظرفشویی خصوصی آشپزخانه', sfuCold: 1.0, sfuHot: 1.0, sfuTotal: 1.5, dfu: 2, icon: '🍽️', isPublic: false },
  { id: 'shower', name: 'حمام (دوش) خصوصی', sfuCold: 1.0, sfuHot: 1.0, sfuTotal: 1.4, dfu: 2, icon: '🚿', isPublic: false },
  { id: 'bathtub', name: 'وان حمام خصوصی', sfuCold: 1.0, sfuHot: 1.0, sfuTotal: 1.4, dfu: 2, icon: '🛁', isPublic: false },
  { id: 'clothes_washer', name: 'ماشین لباسشویی', sfuCold: 1.0, sfuHot: 1.0, sfuTotal: 1.5, dfu: 2, icon: '🧺', isPublic: false },
  { id: 'dishwasher', name: 'ماشین ظرفشویی', sfuCold: 1.0, sfuHot: 1.0, sfuTotal: 1.5, dfu: 2, icon: '🍽️', isPublic: false },
  { id: 'floor_drain', name: 'کفشوی فاضلاب', sfuCold: 0, sfuHot: 0, sfuTotal: 0, dfu: 2, icon: '🕳️', isPublic: false },
  { id: 'urinal', name: 'سیفون دیواری (یورینال بقاعده فلاش تانک)', sfuCold: 1.5, sfuHot: 0, sfuTotal: 1.5, dfu: 2, icon: '🏺', isPublic: false },
  
  // Public usage fixtures request
  { id: 'toilet_tank_public', name: 'توالت با فلاش تانک عمومی', sfuCold: 5.0, sfuHot: 0, sfuTotal: 5.0, dfu: 3, icon: '🏢🚽', isPublic: true },
  { id: 'toilet_valve_public', name: 'توالت با فلاش والو عمومی', sfuCold: 10.0, sfuHot: 0, sfuTotal: 10.0, dfu: 5, icon: '⚡🚽', isPublic: true },
  { id: 'lavatory_public', name: 'دستشویی (روشویی) عمومی', sfuCold: 1.5, sfuHot: 1.5, sfuTotal: 2.0, dfu: 1, icon: '🏢🧼', isPublic: true },
  { id: 'shower_public', name: 'دوش عمومی', sfuCold: 3.0, sfuHot: 3.0, sfuTotal: 4.0, dfu: 2, icon: '🏢🚿', isPublic: true },
  { id: 'bathtub_public', name: 'وان عمومی', sfuCold: 3.0, sfuHot: 3.0, sfuTotal: 4.0, dfu: 2, icon: '🏢🛁', isPublic: true },
  { id: 'sink_public', name: 'سینک عمومی', sfuCold: 3.0, sfuHot: 3.0, sfuTotal: 4.0, dfu: 2, icon: '🏢🍽️', isPublic: true },
  { id: 'drinking_fountain', name: 'آبخوری عمومی', sfuCold: 0.25, sfuHot: 0, sfuTotal: 0.25, dfu: 1, icon: '🚰', isPublic: true }
];

const OCCUPANCY_TYPES = [
  { id: 'residential', label: 'مسکونی (آپارتمانی)', rate: 300, unit: 'لیتر به ازای هر واحد (پیشفرض)', defaultQty: 4, desc: 'ضوابط ۲۴ ساعته مخزن ذخیره بهداشتی بر اساس تفاهمنامه نظام مهندسی و شهرداری (۳۰۰ لیتر بر واحد مسکونی)' },
  { id: 'residential_person', label: 'مسکونی (نفری)', rate: 75, unit: 'لیتر برای هر فرد در شبانه روز', defaultQty: 12, desc: 'حداقل ذخیره خالص بهداشتی ۷۵ لیتر بر هر فرد در شبانه روز بر اساس مبحث ۱۶' },
  { id: 'office', label: 'اداری و دفتری', rate: 40, unit: 'لیتر به ازای هر کارمند در شیفت', defaultQty: 25, desc: 'ذخیره آب بهداشتی پرسنل اداری طبق آیین‌نامه جهت تامین آب اضطراری' },
  { id: 'commercial', label: 'تجاری و مغازه‌ها', rate: 30, unit: 'لیتر به ازای هر شاغل مغازه', defaultQty: 10, desc: 'تامین آب شرب و سرویس‌های بهداشتی پاساژها و مراکز خرید' },
  { id: 'school', label: 'مدارس و مراکز آموزشی', rate: 20, unit: 'لیتر به ازای هر دانش‌آموز', defaultQty: 200, desc: 'ذخیره آب شرب و بهداشتی مدارس بر اساس حضور ۱ شیفت کاری' },
  { id: 'hotel', label: 'هتل و مسافرخانه‌ها', rate: 200, unit: 'لیتر به ازای هر تخت اقامتی', defaultQty: 40, desc: 'طراحی برای آبگرم مجزا و ذخیره آب سرد مصرفی هتل‌های ستاره‌دار' },
  { id: 'restaurant', label: 'رستوران و غذاخوری‌ها', rate: 30, unit: 'لیتر به ازای هر صندلی غذاخوری', defaultQty: 50, desc: 'محاسبه بر اساس ظرفیت صندلی سالن به همراه شستشو و پخت و پز' }
];

interface PlumbingSystemProps {
  activeTabId?: string;
}

export const PlumbingSystem: React.FC<PlumbingSystemProps> = ({ activeTabId }) => {
  const [activeTab, setActiveTab] = useState<'water' | 'reservoir' | 'drainage' | 'rainwater' | 'test'>('water');
  const [localActiveTab, setLocalActiveTab] = useState<'water' | 'drainage'>('water');

  const currentTab = activeTabId
    ? (activeTabId === 'plumbing_reservoir'
        ? 'reservoir'
        : activeTabId === 'plumbing_rainwater'
          ? 'rainwater'
          : activeTabId === 'plumbing_test'
            ? 'test'
            : localActiveTab
      )
    : activeTab;

  // Unified fixture counts state
  const [fixtureCounts, setFixtureCounts] = useState<Record<string, number>>({
    lavatory: 4,
    toilet_tank: 3,
    sink: 2,
    shower: 2,
    clothes_washer: 2,
    floor_drain: 4
  });

  const [waterSystemType, setWaterSystemType] = useState<'tank' | 'valve'>('tank'); // Tank system or Flush Valve system
  const [fixtureTab, setFixtureTab] = useState<'private' | 'public'>('private');

  // Reservoir specific state
  const [occupancyType, setOccupancyType] = useState('residential');
  const [occupancyQty, setOccupancyQty] = useState('4');
  const [autonomyDays, setAutonomyDays] = useState('1');

  // Drainage specific state
  const [drainageSlope, setDrainageSlope] = useState<number>(2); // 1%, 2% or 4%
  const [drainageType, setDrainageType] = useState<'branch' | 'main' | 'stack'>('branch'); // horizontal branch, main drain to sewer, vertical stack

  // Rainwater specific state
  const [rainRoofArea, setRainRoofArea] = useState<number | ''>(150);
  const [rainAreaType, setRainAreaType] = useState<'roof' | 'balcony'>('roof');
  const [rainCity, setRainCity] = useState<string>('tehran');
  const [customRainIntensity, setCustomRainIntensity] = useState<number | ''>(30);

  // Testing/Inspection state
  const [testSystemType, setTestSystemType] = useState<'water' | 'drainage' | 'rainwater'>('water');
  const [drainageTestMethod, setDrainageTestMethod] = useState<'water' | 'air'>('water');
  const [testCheckedItems, setTestCheckedItems] = useState<Record<string, boolean>>({
    pipeClean: false,
    fillTwoDays: false,
    disinfection: false,
    visualInspection: false,
    plugOpenings: false,
    pressureApplied: false,
    durationPassed: false,
    finalApproval: false,
  });

  const incrementFixture = (id: string) => {
    setFixtureCounts(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const decrementFixture = (id: string) => {
    setFixtureCounts(prev => {
      const current = prev[id] || 0;
      if (current <= 0) return prev;
      return {
        ...prev,
        [id]: current - 1
      };
    });
  };

  const resetFixtures = () => {
    setFixtureCounts({
      lavatory: 0,
      toilet_tank: 0,
      toilet_valve: 0,
      sink: 0,
      shower: 0,
      bathtub: 0,
      clothes_washer: 0,
      dishwasher: 0,
      floor_drain: 0,
      urinal: 0
    });
  };

  // 1. Water Demand (Hunter's Curve) Calculations
  // Compute cumulative SFUs
  const calculateWaterSFU = () => {
    let coldTotal = 0;
    let hotTotal = 0;
    let combinedTotal = 0;

    Object.entries(fixtureCounts).forEach(([fid, count]) => {
      if (count <= 0) return;
      const std = FIXTURE_STANDARDS.find(f => f.id === fid);
      if (std) {
        coldTotal += std.sfuCold * count;
        hotTotal += std.sfuHot * count;
        combinedTotal += std.sfuTotal * count;
      }
    });

    return {
      cold: parseFloat(coldTotal.toFixed(2)),
      hot: parseFloat(hotTotal.toFixed(2)),
      total: parseFloat(combinedTotal.toFixed(2))
    };
  };

  const sfuResults = calculateWaterSFU();

  // Convert SFU to Flow Rate (GPM) using piecewise linear fitting of standard Hunter curves
  const convertSFUtoGPM = (sfu: number, isFlushValve: boolean) => {
    if (sfu <= 0) return 0;
    
    if (!isFlushValve) {
      // Flush Tank System Curve Fit
      if (sfu <= 1.0) return 1.5;
      if (sfu <= 5) return 2.0 + (sfu - 1) * 1.5; // Up to 8 GPM
      if (sfu <= 10) return 8.0 + (sfu - 5) * 0.8; // Up to 12 GPM
      if (sfu <= 20) return 12.0 + (sfu - 10) * 0.55; // Up to 17.5 GPM
      if (sfu <= 50) return 17.5 + (sfu - 20) * 0.38; // Up to 29 GPM
      if (sfu <= 100) return 29.0 + (sfu - 50) * 0.28; // Up to 43 GPM
      if (sfu <= 250) return 43.0 + (sfu - 100) * 0.21; // Up to 74.5 GPM
      if (sfu <= 500) return 74.5 + (sfu - 250) * 0.165; // Up to 115.7 GPM
      return 115.7 + (sfu - 500) * 0.12; // Above 500 SFU
    } else {
      // Flush Valve System Curve Fit (Typically starts higher because flush valve takes 15-25 GPM instantly)
      if (sfu <= 1.0) return 12;
      if (sfu <= 5) return 12.0 + (sfu - 1) * 4.5; // Up to 30 GPM
      if (sfu <= 10) return 30.0 + (sfu - 5) * 1.4; // Up to 37 GPM
      if (sfu <= 20) return 37.0 + (sfu - 10) * 1.1; // Up to 48 GPM
      if (sfu <= 50) return 48.0 + (sfu - 20) * 0.63; // Up to 67 GPM
      if (sfu <= 100) return 67.0 + (sfu - 50) * 0.44; // Up to 89 GPM
      if (sfu <= 250) return 89.0 + (sfu - 100) * 0.28; // Up to 131 GPM
      if (sfu <= 500) return 131.0 + (sfu - 250) * 0.20; // Up to 181 GPM
      return 181.0 + (sfu - 500) * 0.15; // Above 500 SFU
    }
  };

  const gpmTotal = convertSFUtoGPM(sfuResults.total, waterSystemType === 'valve');
  const gpmCold = convertSFUtoGPM(sfuResults.cold, waterSystemType === 'valve');
  const gpmHot = convertSFUtoGPM(sfuResults.hot, false); // Hot lines never have flush valves

  // Standard engineering calculations for Pipe Diameter recommendation (m/s)
  // Inside diameter D = sqrt( (4 * Flow) / (pi * Velocity) )
  // Configured precisely for the requested velocity of 1.2 m/s (3.94 ft/s) for plumbing pipes
  const recommendPipeDiameterInches = (gpm: number) => {
    if (gpm <= 0) return '—';
    if (gpm <= 3.5) return '۱/۲ اینچ (DN15)';
    if (gpm <= 7.0) return '۳/۴ اینچ (DN20)';
    if (gpm <= 13.5) return '۱ اینچ (DN25)';
    if (gpm <= 20.0) return '۱ ۱/۴ اینچ (DN32)';
    if (gpm <= 32.0) return '۱ ۱/۲ اینچ (DN40)';
    if (gpm <= 55.0) return '۲ اینچ (DN50)';
    if (gpm <= 85.0) return '۲ ۱/۲ اینچ (DN65)';
    if (gpm <= 150.0) return '۳ اینچ (DN80)';
    return '۴ اینچ به بالا (DN100)';
  };

  // Convert GPM to liters/minute
  const lpmTotal = gpmTotal * 3.785;

  // 2. Drainage / Sewage calculations
  // DFU calculations
  const calculateDrainageDFU = () => {
    let dfuTotal = 0;
    Object.entries(fixtureCounts).forEach(([fid, count]) => {
      if (count <= 0) return;
      const std = FIXTURE_STANDARDS.find(f => f.id === fid);
      if (std) {
        dfuTotal += std.dfu * count;
      }
    });
    return dfuTotal;
  };

  const dfuTotalResult = calculateDrainageDFU();

  // Recommended drainage pipeline size according to Topic 16 Code Tables
  const getRecommendDrainageSize = (dfu: number, type: 'branch' | 'main' | 'stack', slopePercent: number) => {
    if (dfu <= 0) return { size: '—', codeRef: 'فاقد بار فاضلابی', maxAllowed: 0 };

    // Standard raw branch lookup
    let rawBranch = { size: '2 in (50 mm)', codeRef: 'جدول ۱۶-۴-۲-الف', maxAllowed: 6, order: 1 };
    if (dfu > 6 && dfu <= 12) {
      rawBranch = { size: '2 1/2 in (63 mm)', codeRef: 'جدول ۱۶-۴-۲-الف', maxAllowed: 12, order: 2 };
    } else if (dfu > 12 && dfu <= 20) {
      rawBranch = { size: '3 in (90 mm)', codeRef: 'جدول ۱۶-۴-۲-الف', maxAllowed: 20, order: 3 };
    } else if (dfu > 20 && dfu <= 160) {
      rawBranch = { size: '4 in (110 mm)', codeRef: 'جدول ۱۶-۴-۲-الف', maxAllowed: 160, order: 4 };
    } else if (dfu > 160 && dfu <= 360) {
      rawBranch = { size: '5 in (125 mm)', codeRef: 'جدول ۱۶-۴-۲-الف', maxAllowed: 360, order: 5 };
    } else if (dfu > 360) {
      rawBranch = { size: '6 in (160 mm)', codeRef: 'جدول ۱۶-۴-۲-الف', maxAllowed: 960, order: 6 };
    }

    // Standard raw main lookup based on slope
    let rawMain = { size: '2 in (50 mm)', codeRef: 'جدول ۱۶-۴-۲-ب (شیب ۲٪)', maxAllowed: 21, order: 1 };
    if (slopePercent === 1) {
      if (dfu <= 21) rawMain = { size: '3 in (90 mm)', codeRef: 'جدول ۱۶-۴-۲-ب (شیب ۱٪)', maxAllowed: 21, order: 3 }; 
      else if (dfu <= 180) rawMain = { size: '4 in (110 mm)', codeRef: 'جدول ۱۶-۴-۲-ب (شیب ۱٪)', maxAllowed: 180, order: 4 };
      else if (dfu <= 390) rawMain = { size: '5 in (125 mm)', codeRef: 'جدول ۱۶-۴-۲-ب (شیب ۱٪)', maxAllowed: 390, order: 5 };
      else rawMain = { size: '6 in (160 mm)', codeRef: 'جدول ۱۶-۴-۲-ب (شیب ۱٪)', maxAllowed: 700, order: 6 };
    } 
    else if (slopePercent === 4) {
      if (dfu <= 26) rawMain = { size: '2 in (50 mm)', codeRef: 'جدول ۱۶-۴-۲-ب (شیب ۴٪)', maxAllowed: 26, order: 1 };
      else if (dfu <= 31) rawMain = { size: '2 1/2 in (63 mm)', codeRef: 'جدول ۱۶-۴-۲-ب (شیب ۴٪)', maxAllowed: 31, order: 2 };
      else if (dfu <= 50) rawMain = { size: '3 in (90 mm)', codeRef: 'جدول ۱۶-۴-۲-ب (شیب ۴٪)', maxAllowed: 50, order: 3 };
      else if (dfu <= 250) rawMain = { size: '4 in (110 mm)', codeRef: 'جدول ۱۶-۴-۲-ب (شیب ۴٪)', maxAllowed: 250, order: 4 };
      else if (dfu <= 575) rawMain = { size: '5 in (125 mm)', codeRef: 'جدول ۱۶-۴-۲-ب (شیب ۴٪)', maxAllowed: 575, order: 5 };
      else rawMain = { size: '6 in (160 mm)', codeRef: 'جدول ۱۶-۴-۲-ب (شیب ۴٪)', maxAllowed: 1000, order: 6 };
    } 
    else {
      // 2% Slope
      if (dfu <= 21) rawMain = { size: '2 in (50 mm)', codeRef: 'جدول ۱۶-۴-۲-ب (شیب ۲٪)', maxAllowed: 21, order: 1 };
      else if (dfu <= 24) rawMain = { size: '2 1/2 in (63 mm)', codeRef: 'جدول ۱۶-۴-۲-ب (شیب ۲٪)', maxAllowed: 24, order: 2 };
      else if (dfu <= 42) rawMain = { size: '3 in (90 mm)', codeRef: 'جدول ۱۶-۴-۲-ب (شیب ۲٪)', maxAllowed: 42, order: 3 };
      else if (dfu <= 216) rawMain = { size: '4 in (110 mm)', codeRef: 'جدول ۱۶-۴-۲-ب (شیب ۲٪)', maxAllowed: 216, order: 4 };
      else if (dfu <= 480) rawMain = { size: '5 in (125 mm)', codeRef: 'جدول ۱۶-۴-۲-ب (شیب ۲٪)', maxAllowed: 480, order: 5 };
      else rawMain = { size: '6 in (160 mm)', codeRef: 'جدول ۱۶-۴-۲-ب (شیب ۲٪)', maxAllowed: 840, order: 6 };
    }

    // Standard raw stack lookup
    let rawStack = { size: '2 in (50 mm)', codeRef: 'جدول ۱۶-۴-۲-ج', maxAllowed: 24, order: 1 };
    if (dfu <= 24) rawStack = { size: '2 in (50 mm)', codeRef: 'جدول ۱۶-۴-۲-ج', maxAllowed: 24, order: 1 };
    else if (dfu <= 42) rawStack = { size: '2 1/2 in (63 mm)', codeRef: 'جدول ۱۶-۴-۲-ج', maxAllowed: 42, order: 2 };
    else if (dfu <= 72) rawStack = { size: '3 in (90 mm)', codeRef: 'جدول ۱۶-۴-۲-ج', maxAllowed: 72, order: 3 };
    else if (dfu <= 500) rawStack = { size: '4 in (110 mm)', codeRef: 'جدول ۱۶-۴-۲-ج', maxAllowed: 500, order: 4 };
    else if (dfu <= 1100) rawStack = { size: '5 in (125 mm)', codeRef: 'جدول ۱۶-۴-۲-ج', maxAllowed: 1100, order: 5 };
    else rawStack = { size: '6 in (160 mm)', codeRef: 'جدول ۱۶-۴-۲-ج', maxAllowed: 1900, order: 6 };

    // Select current raw target result
    let selectedResult = type === 'branch' ? rawBranch : type === 'main' ? rawMain : rawStack;

    // RULE 2: A riser (or main drain) cannot have a diameter smaller than the branch feeding into it
    if (type === 'stack' && selectedResult.order < rawBranch.order) {
      selectedResult = {
        size: rawBranch.size,
        codeRef: `${rawBranch.codeRef} (عدم تقلیل سایز رایزر نسبت به شاخه فرعی)`,
        maxAllowed: rawBranch.maxAllowed,
        order: rawBranch.order
      };
    }
    if (type === 'main' && selectedResult.order < rawBranch.order) {
      selectedResult = {
        size: rawBranch.size,
        codeRef: `${rawBranch.codeRef} (عدم تقلیل سایز کلکتور نسبت به شاخه فرعی)`,
        maxAllowed: rawBranch.maxAllowed,
        order: rawBranch.order
      };
    }

    // RULE 1: If a toilet is present and active (quantity > 0), minimum size must be 4 inches (110 mm)
    const hasToilet = (fixtureCounts.toilet_tank || 0) > 0 || (fixtureCounts.toilet_valve || 0) > 0;
    if (hasToilet && selectedResult.order < 4) {
      selectedResult = {
        size: '4 in (110 mm)',
        codeRef: 'حداقل سایز الزامی لوله تخلیه توالت (بند ۱۶-۴-۲)',
        maxAllowed: selectedResult.maxAllowed,
        order: 4
      };
    }

    return selectedResult;
  };

  const drainageResult = getRecommendDrainageSize(dfuTotalResult, drainageType, drainageSlope);

  // Recommended vent size (آیین‌نامه سایز لوله‌های هواکش قائم بر اساس DFU)
  const getRecommendVentSize = (drainageResultSize: string) => {
    if (drainageResultSize.includes('6 in')) return '3 in (90 mm)';
    if (drainageResultSize.includes('5 in')) return '2 1/2 in (63 mm)';
    if (drainageResultSize.includes('4 in')) return '2 in (50 mm)';
    if (drainageResultSize.includes('3 in')) return '2 in (90 mm)';
    if (drainageResultSize.includes('2 1/2 in')) return '1 1/2 in (40 mm)';
    return '1 1/4 in (32 mm)';
  };
  const ventResultSize = getRecommendVentSize(drainageResult.size);

  const handleOccupancyTypeChange = (id: string) => {
    setOccupancyType(id);
    const selected = OCCUPANCY_TYPES.find(o => o.id === id);
    if (selected) {
      setOccupancyQty(selected.defaultQty.toString());
    }
  };

  const getReservoirResults = () => {
    const active = OCCUPANCY_TYPES.find(o => o.id === occupancyType) || OCCUPANCY_TYPES[0];
    const qty = parseFloat(occupancyQty) || 0;
    const days = parseFloat(autonomyDays) || 0;
    const totalLitres = active.rate * qty * days;
    return {
      litres: totalLitres,
      m3: totalLitres / 1000,
      occupancyLabel: active.label,
      rate: active.rate,
      unitLabel: active.unit
    };
  };

  const reservoirResults = getReservoirResults();

  const IRANIAN_CITIES_RAIN = [
    { id: 'tehran', name: 'تهران', intensity: 30 },
    { id: 'rasht', name: 'رشت (سواحل شمالی)', intensity: 65 },
    { id: 'tabriz', name: 'تبریز', intensity: 44 },
    { id: 'isfahan', name: 'اصفهان', intensity: 24 },
    { id: 'shiraz', name: 'شیراز', intensity: 38 },
    { id: 'mashhad', name: 'مشهد', intensity: 28 },
    { id: 'ahvaz', name: 'اهواز', intensity: 35 },
    { id: 'sari', name: 'ساری', intensity: 55 },
    { id: 'custom', name: 'سایر شهرهای کویری / کوهستانی (سفارشی)', intensity: 30 }
  ];

  const calculateRainwater = () => {
    const activeCity = IRANIAN_CITIES_RAIN.find(c => c.id === rainCity) || IRANIAN_CITIES_RAIN[0];
    const rawIntensity = rainCity === 'custom' ? customRainIntensity : activeCity.intensity;
    const intensity = rawIntensity === '' ? 0 : rawIntensity;
    const runoffCoefficient = 0.9;
    
    const area = rainRoofArea === '' ? 0 : rainRoofArea;
    
    // Q (Lps) = (C * I * A) / 3600
    const flowRateLps = (runoffCoefficient * intensity * area) / 3600;
    const flowRateLpm = flowRateLps * 60;

    const scaleFactor = intensity === 0 ? 1 : 30 / intensity;
    
    const pipeOptions = [
      { size: '2 in (50 mm)', baseMax: 85, desc: 'مناسب خروجی‌های فرعی، تراس و بالکن' },
      { size: '3 in (90 mm)', baseMax: 250, desc: 'مناسب حیاط‌های فرعی و سقف بام‌های متوسط' },
      { size: '4 in (110 mm)', baseMax: 520, desc: 'پرمصرف‌ترین ناودان عمودی ساختمان‌های شهری' },
      { size: '5 in (125 mm)', baseMax: 950, desc: 'مناسب دبی بالای سقف‌های شیروانی و مدرن بزرگ' },
      { size: '6 in (160 mm)', baseMax: 1600, desc: 'مناسب فضاهای وسیع صنعتی، کارخانجات و سوله' }
    ];

    const mappedOptions = pipeOptions.map(opt => ({
      ...opt,
      maxArea: parseFloat((opt.baseMax * scaleFactor).toFixed(1))
    }));

    // Find first size that fits
    const selectedPipe = mappedOptions.find(opt => opt.maxArea >= area) || mappedOptions[mappedOptions.length - 1];

    let recommendedPipe = selectedPipe;
    let pipeOverridden = false;
    let balconyMinimumApplied = false;

    if (rainAreaType === 'roof') {
      const selectedIndex = pipeOptions.findIndex(o => o.size === selectedPipe.size);
      if (selectedIndex < 1) {
        recommendedPipe = mappedOptions[1]; // 3 in (90 mm)
        pipeOverridden = true;
      }
    } else if (rainAreaType === 'balcony') {
      const selectedIndex = pipeOptions.findIndex(o => o.size === selectedPipe.size);
      if (selectedIndex < 0) {
        recommendedPipe = mappedOptions[0]; // 2 in (50 mm)
        balconyMinimumApplied = true;
      }
    }

    const recIndex = mappedOptions.findIndex(o => o.size === recommendedPipe.size);
    const horIndex = Math.min(recIndex + 1, mappedOptions.length - 1);
    const recommendedHorizontal = mappedOptions[horIndex];

    return {
      flowRateLps: parseFloat(flowRateLps.toFixed(2)),
      flowRateLpm: parseFloat(flowRateLpm.toFixed(1)),
      intensity,
      recommendedPipe,
      pipeOverridden,
      balconyMinimumApplied,
      recommendedHorizontal,
      cityName: activeCity.name,
      mappedOptions
    };
  };

  const rainResults = calculateRainwater();

    const testStandardsData = {
    water: {
      title: 'تست سیستم لوله‌کشی آب مصرفی (سرد، گرم و برگشت)',
      pressure: 'حداقل ۱۰ بار (۱۵۰ پوند بر اینچ مربع) یا ۱.۵ برابر فشار کارکرد کل سیستم (هر کدام بیشتر باشد).',
      duration: 'حداقل ۱ ساعت پایداری کامل بدون هرگونه افت فشار یا نشت در کل اتصالات مسیر.',
      medium: 'آب پاکیزه شهری (یا آب به همراه فشارسنج کالیبره)',
      codeRef: 'مبحث شانزدهم مقررات ملی ساختمان - بند ۱۶-۶-۶-۴',
      steps: [
        { id: 'pipeClean', label: 'شستشوی لوله‌ها با آب تمیز قبل از بستن درپوش‌ها جهت پاکسازی خاکه و ذرات جوش/رزوه.' },
        { id: 'fillTwoDays', label: 'پر نگه داشتن لوله‌ها قبل از تست: شبکه لوله‌کشی آب مصرفی پیش از اعمال فشار نهایی ۱۰ بار، باید به مدت حداقل ۲ روز (۴۸ ساعت) پر از آب نگه داشته شود.' },
        { id: 'disinfection', label: 'ضدعفونی لوله‌ها: بستن تمام شیرها و دهانه‌ها و پر کردن لوله‌ها با محلول کلر ۵۰ میلی‌گرم در لیتر به مدت ۲۴ ساعت و یا ۲۰۰ میلی‌گرم در لیتر کلر به مدت ۳ ساعت.' },
        { id: 'visualInspection', label: 'بازرسی چشمی هم‌راستایی لوله‌ها، نصب صحیح ساپورت‌ها، بَست‌های نگهدارنده رگلاژی و عایق‌کاری اولیه.' },
        { id: 'plugOpenings', label: 'مسدود کردن تمامی خروجی‌های مصرف با درپوش‌های برنجی ته‌آب‌بند جهت تحمل تست.' },
        { id: 'pressureApplied', label: 'تزریق تدریجی آب از پایین‌ترین نقطه شبکه و هواگیری کامل از بالاترین نقاط، سپس اعمال فشار تست با تلمبه دستی/برقی.' },
        { id: 'durationPassed', label: 'ثبت عقربه فشارسنج در ساعت شروع، مانیتورینگ عدم نشتی زیر اتصالات به مدت ۶۰ دقیقه کامل.' },
        { id: 'finalApproval', label: 'تایید مهندس ناظر تاسیسات، تخلیه آب خطوط در صورت خطر یخ‌زدگی و پلمپ دوره‌ای شیرآلات.' }
      ]
    },
    drainage_water: {
      title: 'تست آب‌بند ثقلی فاضلاب و هواکش (Vent) با آب',
      pressure: 'آزمون فشار ایستایی با ارتفاع ستون آب حداقل ۳ متر بالای بالاترین اتصال در آن قطعه آزمایشی.',
      duration: 'مدت ۱۵ دقیقه مانیتورینگ بی‌وقفه، بدون افت در سطح تراز آب یا نشت رطوبت از لوله، اتصالات و اورینگ‌ها.',
      medium: 'پر کردن شبکه با آب ثقلی',
      codeRef: 'مبحث شانزدهم مقررات ملی ساختمان - بند ۱۶-۴-۵',
      steps: [
        { id: 'pipeClean', label: 'پاکسازی داخل مسیر لوله از بقایای چسب، براده یا سیمان ساختمانی.' },
        { id: 'visualInspection', label: 'کنترل زاویه شیب افقی (به خصوص شیب ۱ الی ۲ درصد) و مهار پایه‌ها به دیوار و سقف کاذب.' },
        { id: 'plugOpenings', label: 'کور کردن دریچه‌های بازدید پایین‌دست و لوله خروج از ساختمان با استاپرهای لاستیکی بادی.' },
        { id: 'pressureApplied', label: 'آب انداختن تدریجی به داخل لوله‌ها تا ارتفاع ۳ متر آب روی بالاترین انشعاب قطعه مدنظر.' },
        { id: 'durationPassed', label: 'کنترل دقیق تمامی سوکت‌های پی‌وی‌سی، اتصالات پوش‌فیت یا جوش‌های پلی‌اتیلنی به مدت ۱۵ دقیقه.' },
        { id: 'finalApproval', label: 'تخلیه آب آزمایشی فاضلاب, صدور فرم گواهی سلامت آب‌بندی با مهر مجری و ناظر تاسیساتی.' }
      ]
    },
    drainage_air: {
      title: 'تست فاضلاب با هوای فشرده (دریچه‌های مسدود)',
      pressure: 'فشار آزمایش ۳۴.۵ کیلو پاسکال (۵ پوند بر اینچ مربع).',
      duration: 'حداقل ۱۵ دقیقه ایستایی بدون هرگونه افت فشار در حین انجام آزمون.',
      medium: 'هوای فشرده با کمپرسور',
      codeRef: 'مبحث شانزدهم مقررات ملی ساختمان - بند ۱۶-۴-۵',
      steps: [
        { id: 'pipeClean', label: 'پاکسازی مسیر لوله‌ها از هر‌گونه ذرات براده لوله‌بر و گرد و خاک.' },
        { id: 'visualInspection', label: 'کنترل چشمی بست‌ها، مهارها و پایداری فیزیکی لوله‌های افقی و افقی رایزر قبلی.' },
        { id: 'plugOpenings', label: 'مسدود کردن کامل تمامی دهانه‌ها، انشعاب‌ها و دریچه‌های هواکش با توپی‌های انبساطی.' },
        { id: 'pressureApplied', label: 'تزریق آرام هوای فشرده به شبکه لوله‌کشی از طریق اتصال شیرخور تا رسیدن به فشار ۳۴.۵ کیلو پاسکال.' },
        { id: 'durationPassed', label: 'ثبت فشار اولیه گیج و نظارت مستمر بر روی عقربه فشارسنج به مدت حداقل ۱۵ دقیقه بدون کوچکترین افت فشار.' },
        { id: 'finalApproval', label: 'تخلیه تدریجی هوای فشرده از بالاترین نقطه و تایید نهایی سلامت آب‌بندی هوا توسط ناظر کارگاهی.' }
      ]
    },
    rainwater: {
      title: 'تست آب‌بندی و هدایت آب باران (ناودان‌ها)',
      pressure: 'پر کردن کل لوله عمودی با آب تا تراز بالاترین کفشوی بام ساختمان (فشار هیدرواستاتیک کل ستون عمودی).',
      duration: 'حداقل ۱۵ دقیقه ایستایی بدون هرگونه نشت آب از زانوها، سیفون‌ها، رایزرها و اتصالات خروجی.',
      medium: 'پر کردن کامل ستون ناودان سرد',
      codeRef: 'مبحث شانزدهم مقررات ملی ساختمان - بند ۱۶-۶-۶',
      steps: [
        { id: 'pipeClean', label: 'خارج کردن آشغال‌های ساختمانی، نایلون‌ها و برگ‌ها افتاده در کاسه ناودان بام.' },
        { id: 'visualInspection', label: 'بررسی استحکام بست‌های هیلتی، مهار وزن عمودی ستون رایزر و آب‌بندی دور کاسه ناودان سقف.' },
        { id: 'plugOpenings', label: 'متوقف کردن کامل لوله خروجی حیاط یا کلکتور دفع بیرونی با توپی‌های انبساطی پر از هوا.' },
        { id: 'pressureApplied', label: 'پر ساختن کل ناودان از بام تا زمانی که آب در گلویی ناودان پشت‌بام کاملاً لب‌به‌لب ایستاده شود.' },
        { id: 'durationPassed', label: 'ایستادن آب در بام به مدت ۱۵ دقیقه برای تست نشت لوله‌های واقع در داکت‌ها و دیوارهای لابی.' },
        { id: 'finalApproval', label: 'برداشتن استاپر پایینی با رعایت نکات ایمنی جهت خروج دبی انبوه آب و اخذ فرم امضا شده.' }
      ]
    }
  };

  const currentTest = testSystemType === 'drainage'
    ? (drainageTestMethod === 'water' ? testStandardsData.drainage_water : testStandardsData.drainage_air)
    : (testSystemType === 'water' ? testStandardsData.water : testStandardsData.rainwater);

return (
    <div className="max-w-4xl mx-auto space-y-6 page-enter" dir="rtl">
      
      {/* Dynamic Sub-tab Selector */}
      {activeTabId ? (
        activeTabId === 'plumbing' && (
          <div className="bg-slate-100 p-1 rounded-2xl flex border border-slate-200 shadow-sm max-w-md mx-auto no-print gap-1">
            <button
              onClick={() => setLocalActiveTab('water')}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                localActiveTab === 'water' 
                  ? 'bg-cyan-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Droplets className="w-4 h-4" />
              <span>سیستم آبرسانی (SFU)</span>
            </button>
            <button
              onClick={() => setLocalActiveTab('drainage')}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                localActiveTab === 'drainage' 
                  ? 'bg-cyan-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>سایز فاضلاب (DFU)</span>
            </button>
          </div>
        )
      ) : (
        <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap gap-1 border border-slate-200 shadow-sm justify-center no-print">
          <button
            onClick={() => setActiveTab('water')}
            className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'water' 
                ? 'bg-cyan-600 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span>سیستم آبرسانی (SFU)</span>
          </button>
          <button
            onClick={() => setActiveTab('reservoir')}
            className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'reservoir' 
                ? 'bg-cyan-600 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>منبع ذخیره مصرفی</span>
          </button>
          <button
            onClick={() => setActiveTab('drainage')}
            className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'drainage' 
                ? 'bg-cyan-600 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>سایز فاضلاب (DFU)</span>
          </button>
          <button
            onClick={() => setActiveTab('rainwater')}
            className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'rainwater' 
                ? 'bg-cyan-600 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <CloudRain className="w-4 h-4" />
            <span>آب باران و ناودان</span>
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'test' 
                ? 'bg-cyan-600 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>تست سیستم‌ها</span>
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        
        {/* =============== TAB 1: WATER DEMAND SIZING (Hunter's Curve) =============== */}
        {currentTab === 'water' && (
          <motion.div
            key="water"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6 text-right"
          >
            <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100 relative">
              
              {/* Header Title */}
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-cyan-100 p-3 rounded-2xl text-cyan-700">
                  <Activity className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800">سایزبندی آبرسانی مصرفی ساختمان</h2>
                  <p className="text-xs text-slate-400 font-bold mt-1">محاسبه علمی دبی پیک و سایز لوله تغذیه بر اساس Hunter&apos;s Curve (مبحث ۱۶)</p>
                </div>
              </div>

              {/* Water system configuration choice */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-700">نوع سیستم فلاشینگ توالت‌ها</h4>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">سیستم‌های فلاش‌والو دبی‌های لحظه‌ای لحظه‌ای را به شدت بالا می‌برند.</p>
                </div>
                <div className="flex bg-slate-200 p-1 rounded-xl w-full md:w-auto">
                  <button
                    onClick={() => setWaterSystemType('valve')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${waterSystemType === 'valve' ? 'bg-cyan-600 text-white shadow' : 'text-slate-600 hover:text-slate-950'}`}
                  >
                    شیر فشاری (Flush Valve)
                  </button>
                  <button
                    onClick={() => setWaterSystemType('tank')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${waterSystemType === 'tank' ? 'bg-cyan-600 text-white shadow' : 'text-slate-600 hover:text-slate-950'}`}
                  >
                    مخزن‌دار (Flush Tank)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Visual fixture grid selector */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex justify-between items-center mr-1">
                    <span className="text-[11px] font-black text-slate-400 uppercase">تعداد تجهیزات بهداشتی ساختمان</span>
                    <button
                      onClick={resetFixtures}
                      className="text-xs font-black text-rose-500 hover:text-rose-700 transition flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>صفر کردن شمارنده</span>
                    </button>
                  </div>

                  {/* Private vs Public categorization tabs */}
                  <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/50">
                    <button
                      type="button"
                      onClick={() => setFixtureTab('private')}
                      className={`py-2 px-3 text-xs font-black rounded-lg transition-all cursor-pointer ${
                        fixtureTab === 'private'
                          ? 'bg-white text-cyan-700 shadow border border-slate-200/30'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🚪 مصارف خصوصی (مسکونی)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFixtureTab('public')}
                      className={`py-2 px-3 text-xs font-black rounded-lg transition-all cursor-pointer ${
                        fixtureTab === 'public'
                          ? 'bg-white text-cyan-700 shadow border border-slate-200/30'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🏢 مصارف عمومی (تجاری-اداری)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1 pl-1 custom-scrollbar">
                    {FIXTURE_STANDARDS.filter(fixture => fixtureTab === 'public' ? fixture.isPublic : !fixture.isPublic).map((fixture) => {
                      const count = fixtureCounts[fixture.id] || 0;
                      return (
                        <div 
                          key={fixture.id}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${count > 0 ? 'bg-cyan-50/40 border-cyan-200 shadow-sm' : 'bg-slate-50 border-slate-100/80 hover:border-slate-200'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl leading-none bg-white p-2 rounded-xl border border-slate-100 shadow-sm block">{fixture.icon}</span>
                            <div>
                              <h4 className="text-xs font-black text-slate-700">{fixture.name}</h4>
                              <div className="flex gap-2 text-[10px] text-slate-400 font-bold mt-1">
                                <span className="ltr font-mono">WSFU: {fixture.sfuTotal}</span>
                                <span>•</span>
                                <span className="ltr font-mono">DFU: {fixture.dfu}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-xl border border-slate-200/70 shadow-inner">
                            <button
                              onClick={() => decrementFixture(fixture.id)}
                              className="w-7 h-7 bg-slate-50 hover:bg-slate-100 text-slate-700 font-black rounded-lg flex items-center justify-center transition cursor-pointer select-none active:scale-95 text-xs"
                            >
                              -
                            </button>
                            <span className="font-mono text-xs font-black text-slate-800 w-6 text-center">{count}</span>
                            <button
                              onClick={() => incrementFixture(fixture.id)}
                              className="w-7 h-7 bg-indigo-50 hover:bg-indigo-100 text-cyan-700 font-black rounded-lg flex items-center justify-center transition cursor-pointer select-none active:scale-95 text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Computational outputs */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  
                  {/* Total indicator HUD */}
                  <div className="bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    
                    <div className="space-y-4 text-right relative z-10">
                      <span className="text-cyan-400 text-[10px] font-black uppercase tracking-widest block">دبی لحظه‌ای اوج (Peak Demand)</span>
                      
                      <div className="flex items-baseline gap-3 justify-end ltr" dir="ltr">
                        <span className="text-5xl font-black font-mono tracking-tighter text-cyan-300">{gpmTotal.toFixed(1)}</span>
                        <span className="text-lg font-bold opacity-40 italic">GPM</span>
                      </div>
                      
                      <div className="flex items-center gap-1 justify-end text-[11px] text-slate-400 font-bold">
                        <span className="ltr font-mono">({lpmTotal.toFixed(1)} Lit/Min)</span>
                        <span>معادل تقریبی:</span>
                      </div>

                      <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                        <div className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-slate-400 font-bold">مجموع کل واحد آبرسانی:</span>
                          <span className="font-mono font-black text-cyan-400 ltr">{sfuResults.total} SFU</span>
                        </div>
                        <div className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-slate-400 font-bold">آب سرد مصرفی:</span>
                          <span className="font-mono font-bold text-slate-300 ltr">{sfuResults.cold} SFU / {gpmCold.toFixed(1)} GPM</span>
                        </div>
                        <div className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-slate-400 font-bold">آب گرم مصرفی:</span>
                          <span className="font-mono font-bold text-slate-300 ltr">{sfuResults.hot} SFU / {gpmHot.toFixed(1)} GPM</span>
                        </div>
                        <div className="flex justify-between items-center text-xs sm:text-sm border-t border-white/5 pt-3" dir="rtl">
                          <div className="text-right">
                            <span className="text-cyan-400 text-xs font-black block">سایز پیشنهادی لوله</span>
                            <span className="text-slate-400 text-[10px] block font-bold leading-normal mt-0.5">(سرعت جریان: ۱.۲m/s)</span>
                          </div>
                          <span className="text-xs font-black bg-cyan-600 text-white px-2.5 py-1 rounded-lg shadow-sm text-right" dir="rtl">
                            {recommendPipeDiameterInches(gpmTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* standard information box */}
                  <div className="p-4 bg-cyan-50/50 border border-cyan-150 rounded-2xl flex gap-3 text-right">
                    <Info className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-cyan-900 font-black text-xs mb-1">توضیح منحنی هانتر (Hunter Curve)</h4>
                      <p className="text-cyan-700/80 text-[10px] sm:text-xs font-bold leading-relaxed">
                        این متدولوژی احتمال همزمانی باز شدن شیرآلات بهداشتی را در یک ساختمان به روش ریاضی (منحنی هانتر) محاسبه می‌کند. مضاف بر این، قطر لوله‌ها بر پایه‌ی سرعت جریان استاندارد مصوب ۱.۲ متر بر ثانیه محاسبه شده است که مانع افت فشار شدید و تولید سروصدا در سیستم لوله‌کشی می‌گردد.
                      </p>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* =============== TAB 2: SANITARY WATER TANK STORAGE =============== */}
        {currentTab === 'reservoir' && (
          <motion.div
            key="reservoir"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6 text-right"
          >
            <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100 space-y-8">
              
              <div className="flex items-center gap-4">
                <div className="bg-cyan-100 p-3 rounded-2xl text-cyan-700">
                  <Workflow className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800">طراحی منبع ذخیره آب بهداشتی</h2>
                  <p className="text-xs text-slate-400 font-bold mt-1">محاسبه حجم ذخیره‌سازی آب سالم و آبگرمکن ساختمان طبق آیین‌نامه مبحث ۱۶</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* Standard selections on Right */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 block mr-1">کاربری بهداشتی ساختمان</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {OCCUPANCY_TYPES.map((o) => (
                        <button
                          key={o.id}
                          onClick={() => handleOccupancyTypeChange(o.id)}
                          className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${occupancyType === o.id ? 'bg-cyan-600 border-cyan-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                        >
                          <span className="text-[9px] font-black opacity-65 mb-1">{o.unit}</span>
                          <span className="text-xs font-black">{o.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantitative Parameters */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-400 block mr-1">میزان تناژ / تعداد واحد</label>
                      <input 
                        type="number"
                        min="1"
                        value={occupancyQty}
                        onChange={(e) => setOccupancyQty(e.target.value)}
                        className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 focus:border-cyan-500 outline-none font-black text-center ltr"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-400 block mr-1">مدت زمان ذخیره (روز)</label>
                      <input 
                        type="number"
                        min="1"
                        step="0.5"
                        value={autonomyDays}
                        onChange={(e) => setAutonomyDays(e.target.value)}
                        className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 focus:border-cyan-500 outline-none font-black text-center ltr"
                      />
                    </div>
                  </div>

                  {/* Description Label of standard */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-bold text-slate-500 leading-relaxed leading-6">
                    <strong className="text-slate-700 block mb-1">شرح پایه استاندارد ملاک عمل:</strong>
                    {OCCUPANCY_TYPES.find(o => o.id === occupancyType)?.desc}
                  </div>
                </div>

                {/* Computational Output Display on Left */}
                <div className="flex flex-col gap-4">
                  <div className="bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    
                    <div className="space-y-4 text-right relative z-10">
                      <span className="text-cyan-400 text-[10px] font-black uppercase tracking-widest block">حجم مخزن ذخیره بهداشتی</span>
                      
                      <div className="flex items-baseline gap-3 justify-end ltr" dir="ltr">
                        <span className="text-5xl font-black font-mono tracking-tighter text-cyan-300">{reservoirResults.m3.toFixed(2)}</span>
                        <span className="text-lg font-bold opacity-40 italic">m³</span>
                      </div>
                      
                      <p className="text-[11px] font-bold text-slate-450 mt-1">
                        ظرفیت به لیتر: <span className="text-cyan-400 font-mono font-black">{(reservoirResults.litres).toLocaleString()} L</span>
                      </p>

                      <div className="mt-8 pt-6 border-t border-white/10 space-y-3.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold">نوع کاربری محاسباتی:</span>
                          <span className="font-bold text-slate-200">{reservoirResults.occupancyLabel}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold">سرانه مصرف مرجع:</span>
                          <span className="font-mono text-slate-200">{reservoirResults.rate} {reservoirResults.unitLabel}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold">تعداد کل ضریب:</span>
                          <span className="font-mono text-slate-200">{occupancyQty}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold">مدت ذخیره‌سازی اضطراری:</span>
                          <span className="font-mono text-slate-200">{autonomyDays} روز کامل</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Standard guidelines notes */}
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-right">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-amber-900 font-black text-xs mb-1">نظام مهندسی استان‌ها</h4>
                      <p className="text-amber-800/80 text-[10px] sm:text-xs font-bold leading-relaxed">
                        بر اساس الحاقیه تفاهم‌نامه ملی آبرسانی، تعبیه مخزن ذخیره بهداشتی حداقل به میزان ۱۵۰ لیتر در شبانه‌روز به ازای هر واحد مسکونی جهت مقابله با قطع و نوسان شبکه شهری برای تمامی ساختمان‌های نوساز الزامی است.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
              
            </div>
          </motion.div>
        )}

        {/* =============== TAB 3: DRAINAGE & VENT SIZING =============== */}
        {currentTab === 'drainage' && (
          <motion.div
            key="drainage"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6 text-right"
          >
            <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100">
              
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-cyan-100 p-3 rounded-2xl text-cyan-700">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800">طراحی شبکه فاضلاب ثقلی و هواکش</h2>
                  <p className="text-xs text-slate-400 font-bold mt-1">سایزبندی بهینه لوله‌های دفع فاضلاب و هواکش مجزا بر اساس مجموع DFU (مبحث ۱۶)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Configuration settings on Right */}
                <div className="lg:col-span-6 space-y-6">
                  
                  {/* Pipe type selection in system */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black text-slate-400 uppercase mr-1">بخش لوله‌کشی مورد محاسبه</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setDrainageType('branch')}
                        className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${drainageType === 'branch' ? 'bg-cyan-600 border-cyan-600 text-white shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                      >
                        شاخه افقی فرعی (Branch)
                      </button>
                      <button
                        onClick={() => setDrainageType('main')}
                        className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${drainageType === 'main' ? 'bg-cyan-600 border-cyan-600 text-white shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                      >
                        لوله اصلی افقی (Building Drain)
                      </button>
                      <button
                        onClick={() => setDrainageType('stack')}
                        className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${drainageType === 'stack' ? 'bg-cyan-600 border-cyan-600 text-white shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                      >
                        رایزر عمودی (Vertical Stack)
                      </button>
                    </div>
                  </div>

                  {/* Slope slider if horizontal is selected */}
                  {drainageType === 'main' && (
                    <div className="space-y-2 animate-fade">
                      <span className="text-[11px] font-black text-slate-400 block mr-1">شیب اجرای لوله افقی</span>
                      <div className="flex bg-slate-100 p-1 rounded-2xl justify-between border border-slate-200">
                        {[1, 2, 4].map((slope) => (
                          <button
                            key={slope}
                            onClick={() => setDrainageSlope(slope)}
                            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${drainageSlope === slope ? 'bg-cyan-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                          >
                            {slope} درصد (cm/m)
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 leading-relaxed mt-1">
                        * طبق آیین‌نامه، شیب استاندارد اجرای لوله‌های فاضلاب عموماً ترجیحاً ۲ درصد می‌باشد.
                      </p>
                    </div>
                  )}

                  {/* Current DFU score display */}
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-700">حجم واحد بار فاضلابی لوله‌ها</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">محاسبه در تب اول بر اساس تعداد لوازم بهداشتی</p>
                    </div>
                    <div className="text-left bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-inner">
                      <span className="text-xs font-bold text-slate-400 ml-1">مجموع:</span>
                      <span className="font-mono text-cyan-600 font-black text-lg">{dfuTotalResult} DFU</span>
                    </div>
                  </div>

                </div>

                {/* Outputs displays on Left */}
                <div className="lg:col-span-6 space-y-4">
                  
                  {/* Result Panel */}
                  <div className="bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    
                    <div className="space-y-6 text-right relative z-10">
                      <div>
                        <span className="text-cyan-400 text-[10px] font-black uppercase tracking-widest block mb-1">قطر لوله فاضلاب مورد نیاز</span>
                        <div className="text-3xl font-black text-cyan-300 ltr leading-relaxed mt-2" dir="ltr">
                          {drainageResult.size}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] font-bold block">مبنای مرجع آیین‌نامه</span>
                          <span className="text-[11px] font-black text-slate-200 mt-1 block">{drainageResult.codeRef}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] font-bold block">حداکثر ظرفیت لوله انتخابی</span>
                          <span className="text-[11px] font-black text-slate-200 mt-1 block font-mono">
                            {drainageResult.maxAllowed > 0 ? `${drainageResult.maxAllowed} DFU` : 'نامحدود'}
                          </span>
                        </div>
                      </div>

                      {/* Recommend Vent Stack Size too */}
                      <div className="border-t border-white/10 pt-6">
                        <span className="text-cyan-400 text-[10px] font-black uppercase tracking-widest block mb-1">قطر پیشنهادی لوله هواکش (Vent)</span>
                        <div className="text-xl font-black text-slate-200 ltr" dir="ltr">
                          {ventResultSize}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed mt-1">
                          * قطر لوله قائم هواکش نباید از ۱/۲ قطر رایزر فاضلاب متناظر کمتر باشد.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Standard safety warning design */}
                  <div className="p-4 bg-cyan-50/50 border border-cyan-150 rounded-2xl flex gap-3 text-right">
                    <Info className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-cyan-900 font-black text-xs mb-1">نکته نظارتی مبحث ۱۶ فاضلاب ثقلی</h4>
                      <p className="text-cyan-700/80 text-[10px] sm:text-xs font-bold leading-relaxed">
                        حداقل سایز لوله تخلیه توالت فرنگی ۳ اینچ (۹۰ میلی‌متر) و توالت ایرانی به دلیل ابعاد سیفون همواره ۴ اینچ (۱۱۰ میلی‌متر) الزامی است، حتی اگر بار هیدرولیکی DFU کمتر باشد. (بند ۱۶-۴-۲)
                      </p>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* =============== TAB 4: RAINWATER & DOWNSPOUT SIZING =============== */}
        {currentTab === 'rainwater' && (
          <motion.div
            key="rainwater"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6 text-right"
          >
            <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100">
              
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-cyan-100 p-3 rounded-2xl text-cyan-700">
                  <CloudRain className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800">طراحی سیستم هدایت آب باران و ناودان</h2>
                  <p className="text-xs text-slate-400 font-bold mt-1">محاسبه دبی سیلاب و سایزینگ ناودان‌های عمودی و کلکتورهای افقی بر اساس شدت بارش شهرهای ایران (مبحث ۱۶)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Parameters Column */}
                <div className="lg:col-span-6 space-y-6">
                  
                  {/* Rainwater Source Type Selection */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 block mr-1">موقعیت و کاربری محل جمع‌آوری آب باران</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setRainAreaType('roof')}
                        className={`py-3 px-3 text-xs font-black rounded-xl transition cursor-pointer text-center ${rainAreaType === 'roof' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
                      >
                        بام اصلی و حیاط (حداقل ۳")
                      </button>
                      <button
                        type="button"
                        onClick={() => setRainAreaType('balcony')}
                        className={`py-3 px-3 text-xs font-black rounded-xl transition cursor-pointer text-center ${rainAreaType === 'balcony' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
                      >
                        بالکن، تراس و خرپشته (حداقل ۲")
                      </button>
                    </div>
                  </div>

                  {/* Roof Area Input */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 block mr-1">مساحت افقی تصویر بافت یا حیاط (متر مربع)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        min="5"
                        max="10000"
                        value={rainRoofArea}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRainRoofArea(val === '' ? '' : Math.max(0, parseFloat(val) || 0));
                        }}
                        className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-150 focus:border-cyan-500 outline-none font-black text-left pl-12 font-mono"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-450 ltr font-mono">m²</span>
                    </div>
                    
                    {/* Fast slider buttons */}
                    <div className="flex gap-1.5 flex-wrap">
                      {[50, 100, 150, 200, 300, 500].map((area) => (
                        <button
                          key={area}
                          onClick={() => setRainRoofArea(area)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer border ${rainRoofArea === area ? 'bg-cyan-50 border-cyan-300 text-cyan-700 font-bold shadow-sm' : 'bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-500'}`}
                        >
                          {area} متر مربع
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* City dropdown */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 block mr-1">منطقه جغرافیایی و شهر پروژه (شدت بارش)</label>
                    <select
                      value={rainCity}
                      onChange={(e) => setRainCity(e.target.value)}
                      className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-150 focus:border-cyan-500 outline-none font-bold text-xs cursor-pointer"
                    >
                      {IRANIAN_CITIES_RAIN.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name} {city.id !== 'custom' ? `(شدت بارش مبنا: ${city.intensity} میلی‌متر در ساعت)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Intensity code override if 'custom' is selected */}
                  {rainCity === 'custom' && (
                    <div className="space-y-2 animate-fade">
                      <label className="text-[11px] font-black text-slate-400 block mr-1">شدت بارش سفارشی (میلی‌متر در ساعت - mm/hr)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          min="1"
                          max="200"
                          value={customRainIntensity}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomRainIntensity(val === '' ? '' : Math.max(0, parseFloat(val) || 0));
                          }}
                          className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-150 focus:border-cyan-500 outline-none font-black text-left pl-12 font-mono"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-450 ltr font-mono">mm/h</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 leading-relaxed mt-1">
                        * این مقدار را از روی پیوست نقشه‌های هواشناسی مبحث ۱۶ برای بازه آماری ۱۰ الی ۵۰ سـاله استخراج فرمایید.
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-xs rounded-2xl text-slate-650 font-bold leading-relaxed animate-fade text-right">
                    <p className="text-[11px] text-amber-800 leading-relaxed font-black">
                      طبق الزامات مبحث ۱۶ مقررات ملی ساختمان، حداقل تعداد کفشوی پشت‌بام و لوله‌های قائم ناودانی برای بام اصلی باید ۲ عدد باشد.
                    </p>
                  </div>

                </div>

                {/* Computational outputs Column */}
                <div className="lg:col-span-6 space-y-4">
                  
                  {/* Raw Results HUD */}
                  <div className="bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    
                    <div className="space-y-5 text-right relative z-10">
                      <div>
                        <span className="text-cyan-400 text-[10px] font-black uppercase tracking-widest block mb-1">دبی دیسشارژ سیلاب روان‌آب</span>
                        <div className="flex items-baseline gap-2 justify-end ltr" dir="ltr">
                          <span className="text-4xl font-black font-mono tracking-tighter text-cyan-300">{rainResults.flowRateLps}</span>
                          <span className="text-base font-bold opacity-40 italic">Lps (لیتر بر ثانیه)</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold mt-1 block font-mono">({rainResults.flowRateLpm} L/min)</span>
                      </div>

                      <div className="border-t border-white/10 pt-4 space-y-3">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">ناودان قائم عمودی مورد نیاز (Downspout):</span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[14px] font-black text-cyan-400 mt-1 block ltr" dir="ltr">
                              {rainResults.recommendedPipe.size}
                            </span>
                            {rainResults.pipeOverridden && (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black px-2 py-0.5 rounded-md mt-1 shrink-0">
                                حداقل سایز آیین‌نامه‌ای (۳ اینچ)
                              </span>
                            )}
                            {rainResults.balconyMinimumApplied && (
                              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded-md mt-1 shrink-0">
                                حداقل سایز آیین‌نامه‌ای (۲ اینچ)
                              </span>
                            )}
                          </div>
                          {rainResults.pipeOverridden && (
                            <p className="text-[10px] text-slate-300 font-bold mt-1 leading-relaxed">
                              * طبق مبحث ۱۶ مقررات ملی، حداقل سایز لایزر قائم باران بام اصلی و حیاط ۳ اینچ (۹۰ میلی‌متر) الزامی است.
                            </p>
                          )}
                          {rainResults.balconyMinimumApplied && (
                            <p className="text-[10px] text-slate-300 font-bold mt-1 leading-relaxed">
                              * طبق مبحث ۱۶ مقررات ملی، حداقل سایز لایزر قائم باران برای بالکن، تراس و خرپشته ۲ اینچ (۵۰ میلی‌متر) الزامی است و سایز کمتر مجاز نیست.
                            </p>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-450 font-bold block">کلکتور یا لوله اصلی افقی (Horizontal Collector):</span>
                          <span className="text-[13px] font-black text-slate-200 mt-1 block ltr" dir="ltr">
                            {rainResults.recommendedHorizontal.size} با شیب حداقل ۲٪
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Standard Limits Table for the Selected City */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-black text-slate-700">حداکثر مساحت پوشش ناودان عمودی در شهر {rainResults.cityName}</h4>
                    
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {rainResults.mappedOptions.map((opt, idx) => {
                        const isActive = rainResults.recommendedPipe.size === opt.size;
                        return (
                          <div 
                            key={idx}
                            className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${isActive ? 'bg-cyan-600 text-white border-cyan-600 scale-102 shadow-sm font-bold' : 'bg-white border-slate-100 text-slate-600'}`}
                          >
                            <span className="text-xs font-black ltr font-mono">{opt.size}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold">تا مساحت:</span>
                              <span className="font-mono text-xs font-black">{opt.maxArea} m²</span>
                              {isActive && <Check className="w-4 h-4 text-white shrink-0" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* =============== TAB 5: TESTING & COMMISSIONING =============== */}
        {currentTab === 'test' && (
          <motion.div
            key="test"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6 text-right"
          >
            <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100">
              
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-cyan-100 p-3 rounded-2xl text-cyan-700">
                  <ClipboardCheck className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800">تست و آزمایش سلامت سیستم‌های تاسیسات بهداشتی</h2>
                  <p className="text-xs text-slate-400 font-bold mt-1">آزمون‌های نظارتی و آب‌بندی لوله‌کشی در انواع سیستم آبرسانی، فاضلاب و ناودان بارانی (مبحث ۱۶)</p>
                </div>
              </div>

              {/* Sub-system quick selection */}
              <div className="flex bg-slate-100 p-1 rounded-2xl justify-between border border-slate-200 mb-6 max-w-lg mx-auto">
                <button
                  onClick={() => setTestSystemType('water')}
                  className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer ${testSystemType === 'water' ? 'bg-cyan-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  لوله‌کشی آب مصرفی
                </button>
                <button
                  onClick={() => setTestSystemType('drainage')}
                  className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer ${testSystemType === 'drainage' ? 'bg-cyan-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  شبکه فاضلاب ثقلی
                </button>
                <button
                  onClick={() => setTestSystemType('rainwater')}
                  className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer ${testSystemType === 'rainwater' ? 'bg-cyan-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  هدایت آب باران
                </button>
              </div>

              {/* Drainage specific test method selector */}
              {testSystemType === 'drainage' && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl mb-6 max-w-lg mx-auto animate-fade">
                  <span className="text-xs font-black text-slate-700">روش انجام تست شبکه فاضلاب:</span>
                  <div className="flex bg-slate-200/60 p-1 rounded-xl w-full sm:w-auto">
                    <button
                      onClick={() => setDrainageTestMethod('water')}
                      className={`flex-1 sm:flex-initial px-4 py-2 text-[11px] font-black rounded-lg transition-all cursor-pointer ${drainageTestMethod === 'water' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      آزمون ایستایی با آب (ثقلی)
                    </button>
                    <button
                      onClick={() => setDrainageTestMethod('air')}
                      className={`flex-1 sm:flex-initial px-4 py-2 text-[11px] font-black rounded-lg transition-all cursor-pointer ${drainageTestMethod === 'air' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      آزمون با هوای فشرده (۳۴.۵ kPa)
                    </button>
                  </div>
                </div>
              )}

              {/* Grid block info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-right">
                  <span className="text-[9px] font-black text-slate-400 block mb-1">فشار مورد نیاز آزمون</span>
                  <p className="text-xs font-black text-slate-800 leading-relaxed">
                    {currentTest.pressure}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-right">
                  <span className="text-[9px] font-black text-slate-400 block mb-1">مـدت زمان بـازرسی ایستایی</span>
                  <p className="text-xs font-black text-slate-800 leading-relaxed">
                    {currentTest.duration}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-right">
                  <span className="text-[9px] font-black text-slate-400 block mb-1">سیال/آسیب‌شناسی</span>
                  <p className="text-xs font-black text-slate-800 leading-relaxed">
                    تست با {currentTest.medium} انجام شده و دمای آزمون لوله‌های پلیمری باید پایدار باشد.
                  </p>
                </div>
              </div>

              {testSystemType === 'water' && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs font-bold text-slate-700 leading-relaxed space-y-1 mb-6 animate-fade">
                  <div className="flex items-center gap-2 text-amber-700">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>الزام آیین‌نامه‌ای پایداری هیدرواستاتیک پیش‌تست:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-bold">
                    طبق ضوابط صریح مبحث ۱۶ مقررات ملی ساختمان، پیش از اعمال فشار نهایی تست ۱۰ بار (به مدت ۱ ساعت)، شبکه لوله‌کشی آب مصرفی باید به مدت <span className="text-amber-850 font-extrabold underline">۲ روز (۴۸ ساعت)</span> پر از آب نگه‌داشته شود تا پایداری لازم حاصل گردد.
                  </p>
                </div>
              )}

              {/* Checklist interactive layout with progress bar */}
              <div className="space-y-4 font-sans">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  <div>
                    <h4 className="text-xs font-black text-slate-700">چک‌لیست مراحل اجرای فیزیکی آزمون نظارتی</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">مراحل را علامت بزنید تا تاییدیه گواهینامه آب‌بندی فعال گردد.</p>
                  </div>
                  
                  {/* Progress count indicator */}
                  <div className="text-left font-black text-cyan-600 font-mono text-xs">
                    {currentTest.steps.filter(step => testCheckedItems[step.id]).length} از {currentTest.steps.length} انجام شده
                  </div>
                </div>

                {/* Simulated Checklist Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {currentTest.steps.map((step) => {
                    const isChecked = testCheckedItems[step.id] || false;
                    return (
                      <div 
                        key={step.id} 
                        onClick={() => {
                          setTestCheckedItems(prev => ({
                            ...prev,
                            [step.id]: !prev[step.id]
                          }));
                        }}
                        className={`p-4 rounded-2xl border transition-all duration-300 flex items-start gap-3 cursor-pointer select-none ${isChecked ? 'bg-cyan-50/40 border-cyan-300 shadow-sm' : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'}`}
                      >
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 mt-[2px] transition ${isChecked ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 hover:border-slate-350'}`}>
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <p className={`text-xs font-bold leading-relaxed text-slate-700 ${isChecked ? 'text-slate-800 font-extrabold' : 'text-slate-500'}`}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Authorization visual shield when completed */}
                {currentTest.steps.every(step => testCheckedItems[step.id]) ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-emerald-50 border border-emerald-250 rounded-[2rem] text-center space-y-3 mt-6 "
                  >
                    <div className="inline-block bg-emerald-100 p-3.5 rounded-full text-emerald-600 mb-2">
                      <Check className="w-8 h-8 font-black" />
                    </div>
                    <h4 className="text-base font-black text-emerald-900">گواهی تایید نظارتی و آب‌بندی فوق با موفقیت صادر شد</h4>
                    <p className="text-xs text-emerald-700 max-w-lg mx-auto font-bold leading-relaxed leading-6">
                      شبکه لوله‌کشی آزمایش شده برای بخش <span className="underline">{currentTest.title}</span> آب‌بند و مستحکم قلمداد گشته، عاری از هرگونه افت فشار یا نشست مخرب ثبت گردید و هم‌اکنون به عنوان گام نهایی آماده پوشاندن با دیوارهای نازک‌کاری و داکت ثانویه است.
                    </p>
                    <div className="pt-2">
                      <button 
                        onClick={() => window.print()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow transition active:scale-95"
                      >
                        چاپ و بایگانی فرم گواهی تست نهایی
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center text-[11px] font-bold text-slate-400">
                    * جهت صدور گواهی امضا شده تست مهندسی، بقیه بندهای اجرای فیزیکی چک لیست فوق را علامت بزنید.
                  </div>
                )}

              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

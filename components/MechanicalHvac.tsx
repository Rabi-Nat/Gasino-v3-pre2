import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wind, 
  Flame, 
  Sliders, 
  Ruler, 
  ClipboardCheck, 
  Building, 
  Thermometer, 
  Check, 
  Info, 
  AlertTriangle, 
  Maximize2, 
  Circle, 
  Layers, 
  Activity, 
  Zap,
  Globe2,
  ListFilter,
  CheckCircle2,
  Cpu
} from 'lucide-react';

interface MechanicalHvacProps {
  activeTabId?: string;
}

// Data models & standards based on Iranian National Building Code Part 14 (مبحث چهاردهم مقررات ملی)
const IRANIAN_CITIES_CLIMATE = [
  { id: 'tehran', name: 'تهران', summerDB: 39, winterDB: -2, coolingFactor: 1.0, heatingFactor: 1.0, altitude: 1200, humId: 'dry' },
  { id: 'rasht', name: 'رشت (مرطوب معتدل)', summerDB: 32, winterDB: 1, coolingFactor: 1.15, heatingFactor: 0.85, altitude: -7, humId: 'humid' },
  { id: 'ahvaz', name: 'اهواز (بسیار گرم/خشک)', summerDB: 49, winterDB: 3, coolingFactor: 1.45, heatingFactor: 0.3, altitude: 18, humId: 'dry' },
  { id: 'isfahan', name: 'اصفهان', summerDB: 38, winterDB: -4, coolingFactor: 0.95, heatingFactor: 1.1, altitude: 1570, humId: 'dry' },
  { id: 'shiraz', name: 'شیراز', summerDB: 40, winterDB: -3, coolingFactor: 1.02, heatingFactor: 1.05, altitude: 1480, humId: 'dry' },
  { id: 'tabriz', name: 'تبریز (سرد کوهستانی)', summerDB: 35, winterDB: -10, coolingFactor: 0.82, heatingFactor: 1.35, altitude: 1360, humId: 'dry' },
  { id: 'mashhad', name: 'مشهد', summerDB: 37, winterDB: -8, coolingFactor: 0.98, heatingFactor: 1.22, altitude: 985, humId: 'dry' },
];

const BUILDING_USAGES = [
  { id: 'res', label: 'مسکونی (آپارتمانی)', coolPerSqm: 420, heatPerSqm: 380, cfmPerTr: 400 },
  { id: 'office', label: 'اداری (دفتر کار)', coolPerSqm: 560, heatPerSqm: 420, cfmPerTr: 350 },
  { id: 'commercial', label: 'تجاری (فروشگاه/پاساژ)', coolPerSqm: 780, heatPerSqm: 480, cfmPerTr: 320 },
];

export const MechanicalHvac: React.FC<MechanicalHvacProps> = ({ activeTabId }) => {
  // Let the component tab be driven by the sidebar tab or fall back to internal
  const [internalTab, setInternalTab] = useState<'load' | 'duct' | 'pipe' | 'test'>('load');
  const currentTab = (activeTabId?.replace('hvac_', '') as 'load' | 'duct' | 'pipe' | 'test') || internalTab;

  // -- Tab 1: Load Sizer States --
  const [selectedCity, setSelectedCity] = useState('tehran');
  const [selectedUsage, setSelectedUsage] = useState('res');
  const [floorArea, setFloorArea] = useState<string>('120');
  const [ceilingHeight, setCeilingHeight] = useState<string>('3.0');
  const [occupantCount, setOccupantCount] = useState<string>('4');
  const [exposure, setExposure] = useState<'north' | 'south' | 'east' | 'west' | 'multi'>('south');
  const [insulationType, setInsulationType] = useState<'high' | 'standard' | 'none'>('standard');
  const [glassPercentage, setGlassPercentage] = useState<'low' | 'medium' | 'high'>('medium');
  const [equipmentHeat, setEquipmentHeat] = useState<'low' | 'normal' | 'high'>('normal');

  // -- Tab 2: Duct & Pipe States --
  const [customCfmStr, setCustomCfmStr] = useState<string>('');
  const [designVelocity, setDesignVelocity] = useState<string>('900'); // FPM
  const [ductShapeType, setDuctShapeType] = useState<'ratio' | 'fixedWidth'>('ratio');
  const [aspectRatio, setAspectRatio] = useState<string>('1.5'); // Width to height
  const [fixedWidth, setFixedWidth] = useState<string>('14'); // inches

  // Pipe states
  const [pipeFluid, setPipeFluid] = useState<'water' | 'refrig_gas' | 'refrig_liq'>('water');
  const [pipeFlowGpm, setPipeFlowGpm] = useState<string>('');
  const [pipeCapacityTons, setPipeCapacityTons] = useState<string>('');

  // -- Tab 3: HVAC Equipment recommendation states --
  const [heatingSource, setHeatingSource] = useState<'radiator' | 'package' | 'duct_coil' | 'chiller_fcu'>('package');
  const [coolingSource, setCoolingSource] = useState<'evaporative' | 'split' | 'duct_split' | 'chiller' | 'vrf'>('duct_split');

  // -- Tab 4: Interactive checklist states --
  const [testCheckedItems, setTestCheckedItems] = useState<Record<string, boolean>>({});
  const [testSupervisorName, setTestSupervisorName] = useState<string>('');
  const [testProjectCode, setTestProjectCode] = useState<string>('');

  // ----------------------------------------------------
  // CALCULATIONS
  // ----------------------------------------------------

  // Calculate Cooling & Heating Loads
  const cityClimate = IRANIAN_CITIES_CLIMATE.find(c => c.id === selectedCity) || IRANIAN_CITIES_CLIMATE[0];
  const usageType = BUILDING_USAGES.find(u => u.id === selectedUsage) || BUILDING_USAGES[0];

  const calcArea = parseFloat(floorArea) || 0;
  const calcHeight = parseFloat(ceilingHeight) || 3.0;
  const calcPeople = parseInt(occupantCount, 10) || 0;

  // Multipliers
  const exposureMultiplier = { north: 0.9, south: 1.05, east: 1.12, west: 1.18, multi: 1.25 }[exposure];
  const insulationMultiplier = { high: 0.8, standard: 1.0, none: 1.3 }[insulationType];
  const glassMultiplier = { low: 0.9, medium: 1.0, high: 1.25 }[glassPercentage];
  const equipmentAddition = { low: 1000, normal: 3000, high: 7500 }[equipmentHeat];

  // Cooling load: Area-based * coefficients + People * 450 BTU/h + equipment load additions + ventilation altitude adjustment
  const areaBaseCooling = calcArea * usageType.coolPerSqm * cityClimate.coolingFactor * exposureMultiplier * insulationMultiplier * glassMultiplier;
  const peopleCooling = calcPeople * 450;
  const ventilationVolume = calcArea * calcHeight * 0.5 * 1.08 * (cityClimate.summerDB - 24); // Fresh air approx
  const finalCoolingBtu = Math.round(areaBaseCooling + peopleCooling + equipmentAddition + Math.max(0, ventilationVolume));
  const coolingTons = parseFloat((finalCoolingBtu / 12000).toFixed(2));
  const coolingKw = parseFloat((finalCoolingBtu * 0.000293).toFixed(1));
  const requiredCFM = Math.round(coolingTons * usageType.cfmPerTr);

  // Heating Load: Area based * heating factor * coefficients + ventilation allowance
  const areaBaseHeating = calcArea * usageType.heatPerSqm * cityClimate.heatingFactor * insulationMultiplier;
  const ventilationHeating = calcArea * calcHeight * 0.5 * 1.08 * (21 - cityClimate.winterDB); // Heat loss due to fresh air
  const finalHeatingBtu = Math.round(areaBaseHeating + Math.max(0, ventilationHeating));
  const heatingKw = parseFloat((finalHeatingBtu / 3412).toFixed(1));
  const heatingKcal = Math.round(finalHeatingBtu / 3.968);

  // Duct sizing logic
  const calcCfm = customCfmStr !== '' ? (parseFloat(customCfmStr) || 0) : (requiredCFM || 1200);
  const calcVelocity = parseFloat(designVelocity) || 900;

  const ductAreaSqFt = calcCfm / calcVelocity;
  const ductAreaSqIn = ductAreaSqFt * 144;

  const roundDiameterIn = parseFloat((2 * Math.sqrt(ductAreaSqIn / Math.PI)).toFixed(1));

  let rectWidth = 12;
  let rectHeight = 10;

  if (ductShapeType === 'ratio') {
    const ratioVal = parseFloat(aspectRatio) || 1.5;
    rectHeight = Math.round(Math.sqrt(ductAreaSqIn / ratioVal));
    rectWidth = Math.round(rectHeight * ratioVal);
  } else {
    const customWidthVal = parseFloat(fixedWidth) || 14;
    rectWidth = customWidthVal;
    rectHeight = Math.round(ductAreaSqIn / customWidthVal);
  }

  // Ensure duct is not ridiculously flat or small
  rectHeight = Math.max(rectHeight, 6);
  rectWidth = Math.max(rectWidth, 6);

  // Friction coefficient estimation (Darcy equivalents) via ASHRAE: inches of water gauge per 100 feet
  const frictionLossPer100ft = parseFloat((0.10913 * Math.pow(calcCfm, 1.9) / Math.pow(roundDiameterIn, 5.02)).toFixed(3));

  // Piping Sizing algorithm (Based on safe velocity & standard commercial pipe options)
  const computePipeSizing = () => {
    if (pipeFluid === 'water') {
      const gpm = pipeFlowGpm !== '' ? (parseFloat(pipeFlowGpm) || 0) : parseFloat((coolingTons * 2.4).toFixed(1)) || 10;
      let recSize = '1"';
      let velocity = 0;
      let pressDrop = 0;

      // Safe water friction rates and velocity selection ranges
      if (gpm <= 2.5) {
        recSize = '1/2" (15 mm) COPPER/STEEL';
        velocity = (gpm * 0.408) / 0.304; // ft/s
      } else if (gpm <= 5) {
        recSize = '3/4" (20 mm) COPPER/STEEL';
      } else if (gpm <= 12) {
        recSize = '1" (25 mm) COPPER/STEEL';
      } else if (gpm <= 22) {
        recSize = '1-1/4" (32 mm) STEEL';
      } else if (gpm <= 35) {
        recSize = '1-1/2" (40 mm) STEEL';
      } else if (gpm <= 70) {
        recSize = '2" (50 mm) STEEL';
      } else if (gpm <= 140) {
        recSize = '2-1/2" (65 mm) STEEL';
      } else {
        recSize = '3" (80 mm) STEEL';
      }

      const innerDiamInches = gpm <= 2.5 ? 0.62 : gpm <= 5 ? 0.824 : gpm <= 12 ? 1.049 : gpm <= 22 ? 1.38 : gpm <= 35 ? 1.61 : gpm <= 70 ? 2.067 : 2.469;
      velocity = parseFloat(((gpm * 0.408) / Math.pow(innerDiamInches, 2)).toFixed(1));
      pressDrop = parseFloat((Math.pow(gpm, 1.85) / (0.001 * Math.pow(innerDiamInches, 4.87))).toFixed(1));

      return {
        recSize,
        velocity: `${velocity} ft/s`,
        friction: `${(pressDrop / 10).toFixed(1)} psi / 100ft`,
        note: 'آستانه سرعت ایمن جریان آب لوله‌کشی فولادی تاسیسات مکانیکی بین ۲ تا ۶ فوت بر ثانیه است تا از خوردگی زودرس لوله و تولید صدای ضربه آب جلوگیری گردد.',
        color: 'text-blue-600'
      };
    } else {
      // Refrigerant Lines (R-410A) split selection based on Tons of cooling
      const tons = pipeCapacityTons !== '' ? (parseFloat(pipeCapacityTons) || 0) : (coolingTons || 4);
      if (pipeFluid === 'refrig_gas') {
        let recSize = '5/8"';
        if (tons <= 1.5) recSize = '1/2" (12.7 mm) CU';
        else if (tons <= 3) recSize = '3/4" (19.0 mm) CU';
        else if (tons <= 5) recSize = '7/8" (22.2 mm) CU';
        else if (tons <= 8) recSize = '1-1/8" (28.6 mm) CU';
        else recSize = '1-3/8" (34.9 mm) CU';

        return {
          recSize,
          velocity: '25 - 45 ft/s',
          friction: 'حدود ۲ الی ۴ درجه افت فشار معادل',
          note: 'در لوله‌های مکش (Suction Line) مبرد، سرعت جریان گاز باید بالای ۱5 فوت بر ثانیه باشد تا روغن با مبرد حرکت کرده و از گرفتگی کمپرسور ممانعت به عمل آید.',
          color: 'text-amber-600'
        };
      } else {
        // Liquid refrigerant line
        let recSize = '1/4"';
        if (tons <= 2) recSize = '1/4" (6.35 mm) CU';
        else if (tons <= 5) recSize = '3/8" (9.52 mm) CU';
        else recSize = '1/2" (12.7 mm) CU';

        return {
          recSize,
          velocity: '2 - 4 ft/s',
          friction: 'افت فشار اندک',
          note: 'خط مایع مبرد (Liquid Line) مجهز به فیلتر درایر بوده و عایق مناسب جهت پیشگیری از تبخیر ناگهانی پیش از شیر انبساط الزامی است.',
          color: 'text-emerald-600'
        };
      }
    }
  };

  const pipeResult = computePipeSizing();

  // Test System Configuration based on Part 14 Guidelines
  const hvacTestStandards = {
    hydronic: {
      title: 'آزمون هیدرواستاتیک شبکه‌های آبرسانی گرمایش، سرمایش و رایزرها',
      pressure: '۹ بار (۱3۵ پوند بر اینچ مربع) یا ۱.۵ برابر فشار کارکرد دائم کلکتور موتورخانه (هر کدام بیشتر باشد).',
      duration: 'حداقل ۴ ساعت با عقربه فشار پایدار، عاری از نشتی در زانویی‌ها و نقاط جوشکاری.',
      medium: 'آب زلال ولرم شهری',
      codeRef: 'بخش ۱۴-۸ مقررات ملی ساختمان ایران',
      steps: [
        { id: 'systemClean', label: 'فلشینگ مسیر لوله‌کشی و تخلیه کامل براده‌های جوش چسبیده روی جدارهای درونی.' },
        { id: 'ventPoints', label: 'تجهیز بالای تمام رایزرها به اتصالات شیر هواگیری اتوماتیک جهت تخلیه هوای حین آبگیری خطوط.' },
        { id: 'plugManifold', label: 'مسدود ساختن مجراهای اتصال به ترانسدیوسرها، پمپ سیرکولاتور و دیگ اصلی.' },
        { id: 'waterFill', label: 'پر کردن شبکه لوله‌ها به آرامی با آب شهری به طوری که هوا در بالاترین نقاط خارج گردد.' },
        { id: 'pressureUp', label: 'تزریق فشار توسط پمپ تست دستی تا سقف ۹ بار و مانیتورینگ اولیه لوله‌های پنج لایه یا فولادی.' },
        { id: 'hourHold', label: 'مشاهده گیج کالیبره سنجش فشار به مدت ۴ ساعت متمادی بدون هرگونه کاهش ناگهانی عقربه.' },
        { id: 'signOff', label: 'ثبت و امضا صورتجلسه آب‌بندی با حضور ناظر هماهنگ کننده تاسیساتی تاسیسات مکانیکی.' }
      ]
    },
    copper_refrig: {
      title: 'آزمون فشار و نشت لوله‌کشی مسی مبرد با گاز نیتروژن (ازت)',
      pressure: '۴۱.۵ بار (۶۰۰ پوند بر اینچ مربع) برای سیستم‌های مبرد نوین نظیر R-410A / VRF.',
      duration: 'حداقل ۲۴ ساعت پایداری کامل با محاسبه تغییرات دمای محیطی روی حجم گاز ازت.',
      medium: 'گاز ازت خشک (نیتروژن خالی)',
      codeRef: 'بند ۱۴-۹-۳ آیین‌نامه برودت ملی',
      steps: [
        { id: 'silverBrazing', label: 'کنترل چشمی جوش‌های نقره لوله مسی، عدم انحراف زوایا و صحت جوشکاری با فلاکس مرغوب.' },
        { id: 'valvesOpen', label: 'اطمینان از مسدود بودن شیرهای برقی موقت یونیت‌های داخلی و درپوش محکم بخش کمپرسور.' },
        { id: 'nitrogenHook', label: 'اتصال رگلاتور فشار قوی کپسول ازت به پورت سرویس سه‌راهی خطوط رفت و برگشت مبرد.' },
        { id: 'tempCorrection', label: 'یادداشت دمای دقیق هوای آزاد به موازات سقف فشار جهت خنثی‌سازی تغییرات فرمول چگالی گاز.' },
        { id: 'bubbleTest', label: 'استفاده از کف صابون در تمام نقاط اتصالات جوش نقره در مراحل فشار ۱۰۰ و ۳۰۰ و ۶۰۰ پی‌اس‌آی.' },
        { id: 'oneDayHold', label: 'بررسی عدم افت گیج تست پس از گذشت ۲۴ ساعت مطلق زیر تابش احتمالی آفتاب یا سرما.' },
        { id: 'vacuumDraw', label: 'تخلیه نیتروژن و شروع فرآیند وکیوم عمیق تا حداقل ۵۰۰ میکرون جیوه به منظور تضمین خلوص مدار.' }
      ]
    },
    duct_leakage: {
      title: 'آزمون هوابندی و فرونشت کانال‌های هوارسان گالوانیزه',
      pressure: 'تست بر اساس فشار مخرب استاتیک کانال فلزی (اندازه‌گیری نشت با دستگاه بلوور دور متغیر).',
      duration: 'دبی نشت نباید از حدود مجاز آیین‌نامه SMACNA تجاوز نماید.',
      medium: 'هوای دمیده به همراه دود فشرده',
      codeRef: 'بند ۱۴-۶ مقررات نظارتی کانال‌ها',
      steps: [
        { id: 'masticSeals', label: 'کنترل ماستیک‌کاری در تمامی اتصالات، درزهای فلنجی، فیتینگ‌ها و لبه پیچ‌ها.' },
        { id: 'smokeInjection', label: 'تزریق دود مصنوعی غیرسمی در درون کانال تحت فشار آرام جهت رویت موضعی نشت ریز.' },
        { id: 'sealCheck', label: 'بازرسی لبه دمپرها و کانال‌های برگشت به هود آشپزخانه‌ها به صورت مضاعف.' },
        { id: 'certSigned', label: 'تکمیل گواهینامه هوابندی قبل از اتمام پیچ چفت و عایق‌پیچی بدنه خارجی کانال.' }
      ]
    }
  };

  const activeTest = testSystemTypeToStandardCurrent();

  function testSystemTypeToStandardCurrent() {
    if (pipeFluid === 'water') return hvacTestStandards.hydronic;
    if (pipeFluid === 'refrig_gas' || pipeFluid === 'refrig_liq') return hvacTestStandards.copper_refrig;
    return hvacTestStandards.duct_leakage;
  }

  const toggleTestItem = (id: string) => {
    setTestCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Amperes load calculation for equipment according to modern COPs & Iranian conditions (Mabahs 13, 14, 19)
  const getAmpereEstimation = () => {
    const tons = coolingTons || 3;
    let kwFactor = 1.15; // default
    let powerFactor = 0.85;
    let mustBeThreePhase = tons > 4.5;
    let sourceLabel = '';

    if (coolingSource === 'evaporative') {
      kwFactor = 0.22; // No compressor, only fan/pump (very low power draw)
      powerFactor = 0.80;
      mustBeThreePhase = false;
      sourceLabel = 'کولر آبی (موتور و پمپ)';
    } else if (coolingSource === 'split') {
      kwFactor = 1.05; // COP ~ 3.3 (High efficiency split)
      powerFactor = 0.88;
      mustBeThreePhase = tons > 5.0;
      sourceLabel = 'اسپلیت دیواری (کولر گازی)';
    } else if (coolingSource === 'duct_split') {
      kwFactor = 1.20; // COP ~ 2.9 (Ducted split with static pressure fan)
      powerFactor = 0.85;
      mustBeThreePhase = tons > 4.5;
      sourceLabel = 'داکت اسپلیت';
    } else if (coolingSource === 'chiller') {
      kwFactor = 1.25; // Scroll chiller + water circulation pumps + terminal FCUs
      powerFactor = 0.85;
      mustBeThreePhase = tons > 2.5; // Central chillers are standard 3-phase
      sourceLabel = 'چیلر تراکمی و پمپ‌ها';
    } else if (coolingSource === 'vrf') {
      kwFactor = 0.95; // COP ~ 3.7 (Inverter VRF system)
      powerFactor = 0.90;
      mustBeThreePhase = tons > 4.0;
      sourceLabel = 'سیستم مرکزی VRF';
    }

    const electricalKwCooling = tons * kwFactor;
    const voltageSinglePhase = 220;
    const voltageThreePhase = 380;

    const singlePhaseAmp = Math.round((electricalKwCooling * 1000) / (voltageSinglePhase * powerFactor));
    const threePhaseAmp = Math.round((electricalKwCooling * 1000) / (Math.sqrt(3) * voltageThreePhase * powerFactor));

    // Wire & Circuit Breaker Sizing for Single Phase (Phase, Neutral, Earth)
    let wireSizeSingle = '۲.۵ × ۳ mm²';
    let fuseSingleCooling = 'C16';
    if (singlePhaseAmp <= 16) {
      wireSizeSingle = '۲.۵ × ۳ mm²';
      fuseSingleCooling = 'C16';
    } else if (singlePhaseAmp <= 25) {
      wireSizeSingle = '۴ × ۳ mm²';
      fuseSingleCooling = 'C25';
    } else if (singlePhaseAmp <= 32) {
      wireSizeSingle = '۶ × ۳ mm²';
      fuseSingleCooling = 'C32';
    } else if (singlePhaseAmp <= 50) {
      wireSizeSingle = '۱۰ × ۳ mm²';
      fuseSingleCooling = 'C50';
    } else {
      wireSizeSingle = '۱۶ × ۳ mm²';
      fuseSingleCooling = 'C63';
    }

    // Wire & Circuit Breaker Sizing for Three Phase (3 Phases, Neutral, Earth)
    let wireSizeThree = '۱.۵ × ۵ mm²';
    let fuseThreeCooling = '3P C10';
    if (threePhaseAmp <= 10) {
      wireSizeThree = '۱.۵ × ۵ mm²';
      fuseThreeCooling = '3P C10';
    } else if (threePhaseAmp <= 16) {
      wireSizeThree = '۲.5 × ۵ mm²';
      fuseThreeCooling = '3P C16';
    } else if (threePhaseAmp <= 25) {
      wireSizeThree = '۴ × ۵ mm²';
      fuseThreeCooling = '3P C25';
    } else if (threePhaseAmp <= 32) {
      wireSizeThree = '۶ × ۵ mm²';
      fuseThreeCooling = '3P C32';
    } else if (threePhaseAmp <= 50) {
      wireSizeThree = '۱۰ × ۵ mm²';
      fuseThreeCooling = '3P C50';
    } else {
      wireSizeThree = '۱۶ × ۵ mm²';
      fuseThreeCooling = '3P C63';
    }

    return {
      kw: electricalKwCooling.toFixed(2),
      singlePhaseAmp,
      threePhaseAmp,
      wireSizeSingle,
      wireSizeThree,
      fuseSingleCooling,
      fuseThreeCooling,
      mustBeThreePhase,
      sourceLabel
    };
  };

  const electricalData = getAmpereEstimation();

  return (
    <div className="space-y-8 text-right" dir="rtl">
      
      {/* Top Brand Banner */}
      <div className="bg-gradient-to-l from-amber-500/10 via-amber-500/5 to-transparent border-r-4 border-amber-600 p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-amber-600 rounded-2xl shadow-md text-white">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-amber-900">سامانه محاسبات تاسیسات مکانیکی و HVAC</h2>
        </div>
        <p className="text-xs text-amber-700 font-bold leading-relaxed max-w-3xl">
          دپارتمان جامع محاسبات تهویه مطبوع، بارهای برودتی حرارتی بر اساس آیین‌نامه‌های ملی مسکن (مبحث چهاردهم مقررات ساختمان)، سایزینگ پیشرفته داکت، محاسبات لوله مسی مبرد، آبرسانی کویل آبگرم و پایش تست نشت گاز ازت لوله‌ها.
        </p>
      </div>
      {/* Tab Switch Canvas with transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-[2rem] border border-slate-250 p-6 md:p-8 shadow-sm"
        >

          {/* TAB 1: BARS CALCULATION MODULE */}
          {currentTab === 'load' && (
            <div className="space-y-8 animate-fade">
              <div className="grid lg:grid-cols-12 gap-8">
                
                {/* Panel 1.1: Parameters entry form */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                    <Building className="w-5 h-5 text-amber-600" />
                    <h3 className="text-sm font-black text-slate-800">مشخصات اقلیمی و ساختار معماری فضا</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Select City */}
                    <div>
                      <label className="text-xs font-black text-slate-400 block mb-1.5 mr-1">شهر محل پروژه (اقلیم)</label>
                      <select 
                        value={selectedCity} 
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-3 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all cursor-pointer"
                      >
                        {IRANIAN_CITIES_CLIMATE.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} (تابستان: {c.summerDB}°C | زمستان: {c.winterDB}°C)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Usage type */}
                    <div>
                      <label className="text-xs font-black text-slate-400 block mb-1.5 mr-1">کاربری فضا</label>
                      <select 
                        value={selectedUsage} 
                        onChange={(e) => setSelectedUsage(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-3 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all cursor-pointer"
                      >
                        {BUILDING_USAGES.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Area Size */}
                    <div>
                      <label className="text-xs font-black text-slate-400 block mb-1.5 mr-1">مساحت فضا (متر مربع)</label>
                      <input 
                        type="number" 
                        value={floorArea}
                        onChange={(e) => setFloorArea(e.target.value)}
                        placeholder="120"
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all ltr"
                      />
                    </div>

                    {/* Height */}
                    <div>
                      <label className="text-xs font-black text-slate-400 block mb-1.5 mr-1">ارتفاع سقف خالص (متر)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={ceilingHeight}
                        onChange={(e) => setCeilingHeight(e.target.value)}
                        placeholder="3.0"
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all ltr"
                      />
                    </div>

                    {/* Occupants */}
                    <div>
                      <label className="text-xs font-black text-slate-400 block mb-1.5 mr-1">تعداد افراد مستقر (نفر)</label>
                      <input 
                        type="number" 
                        value={occupantCount}
                        onChange={(e) => setOccupantCount(e.target.value)}
                        placeholder="4"
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Exposure */}
                    <div>
                      <label className="text-xs font-black text-slate-400 block mb-1.5 mr-1">جهت نورگیری غالب دیوارهای خارجی</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setExposure('south')}
                          className={`py-2 text-[10px] font-black rounded-lg transition-all border ${exposure === 'south' ? 'bg-amber-600 border-amber-600 text-white' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}`}
                        >
                          سمت جنوب (آفتاب‌گیر)
                        </button>
                        <button
                          type="button"
                          onClick={() => setExposure('north')}
                          className={`py-2 text-[10px] font-black rounded-lg transition-all border ${exposure === 'north' ? 'bg-amber-600 border-amber-600 text-white' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}`}
                        >
                          سمت شمال (سایه)
                        </button>
                        <button
                          type="button"
                          onClick={() => setExposure('west')}
                          className={`py-2 text-[10px] font-black rounded-lg transition-all border ${exposure === 'west' ? 'bg-amber-600 border-amber-600 text-white' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}`}
                        >
                          سمت غرب (آفتاب آزاردهنده)
                        </button>
                        <button
                          type="button"
                          onClick={() => setExposure('multi')}
                          className={`py-2 text-[10px] font-black rounded-lg transition-all border ${exposure === 'multi' ? 'bg-amber-600 border-amber-600 text-white' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}`}
                        >
                          نورگیری چندطرفه (رایزر گوشه)
                        </button>
                      </div>
                    </div>

                    {/* Insulation level */}
                    <div>
                      <label className="text-xs font-black text-slate-400 block mb-1.5 mr-1">وضعیت عایق‌کاری محیطی</label>
                      <select 
                        value={insulationType} 
                        onChange={(e) => setInsulationType(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-3 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-amber-500"
                      >
                        <option value="high">عایق‌کاری کامل (پنجره و دیوار دوجداره استاندارد - ۲۰٪ بهبود بار)</option>
                        <option value="standard">عایق متوسط استاندارد ساختمان (بدون افزایش یا کاهش بار)</option>
                        <option value="none">بدون عایق موثر (بنای قدیمی، پنجره تک‌جداره - ۳۰٪ افزایش بار)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Glass level */}
                    <div>
                      <label className="text-xs font-black text-slate-400 block mb-1.5 mr-1">درصد نمای شیشه‌ای ساختمان</label>
                      <select 
                        value={glassPercentage} 
                        onChange={(e) => setGlassPercentage(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-3 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-amber-500"
                      >
                        <option value="low">کمتر از ۲۰٪ مساحت سطوح دیواری (دریچه‌های نرمال)</option>
                        <option value="medium">پنجره‌های متوسط بین ۲۰٪ تا ۵۰٪ (رایج مسکونی)</option>
                        <option value="high">بیش از ۵۰٪ نما شیشه‌ای فریم لس (کرتین‌وال لوکس)</option>
                      </select>
                    </div>

                    {/* Internal sources */}
                    <div>
                      <label className="text-xs font-black text-slate-400 block mb-1.5 mr-1">حرارت داخلی جانبی (تجهیزات و روشنایی)</label>
                      <select 
                        value={equipmentHeat} 
                        onChange={(e) => setEquipmentHeat(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-3 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-amber-500"
                      >
                        <option value="low">کم (فقط چراغ‌های ال‌ای‌دی مدرن کم‌مصرف)</option>
                        <option value="normal">متوسط عمومی (لپتاپ و مودم و تلویزیون‌های معمولی)</option>
                        <option value="high">شدید (سرور کوچک، پرینتر مستمر یا تجهیزات مداوم برقی)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Panel 1.2: Dynamic Outcomes of Thermal and cooling loads */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="bg-slate-50 rounded-3xl border border-slate-150 p-6 space-y-6">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-200/50">
                      <Thermometer className="w-5 h-5 text-amber-600" />
                      <div>
                        <h4 className="font-black text-xs text-slate-800">برآیند نیروهای ترمودینامیکی فضا</h4>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Loads Output Summary</span>
                      </div>
                    </div>

                    {/* 1. COOLING CALCULATION */}
                    <div className="space-y-3.5">
                      <div className="flex items-end justify-between">
                        <span className="text-xs font-black text-slate-700">کل بار برودتی مورد نیاز فضا:</span>
                        <div className="text-left font-sans">
                          <span className="text-2xl font-black text-blue-600 leading-none">{finalCoolingBtu.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-slate-400 block">BTU/hr</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-white/80 p-3 rounded-2xl border border-slate-150">
                        <div className="text-center">
                          <span className="text-[9px] font-black text-slate-400 block">ظرفیت به تن تبرید</span>
                          <p className="text-base font-black font-mono text-slate-850">{coolingTons} <span className="text-[10px] font-normal text-slate-400">TR</span></p>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] font-black text-slate-400 block">معادل سرمایشی به کیلووات</span>
                          <p className="text-base font-black font-mono text-slate-850">{coolingKw} <span className="text-[10px] font-normal text-slate-400">kW</span></p>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50/55 rounded-xl border border-blue-105 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-800">حجم هوای عبوری پیشنهادی (CFM):</span>
                        <span className="font-mono text-sm font-black text-blue-900">{requiredCFM} CFM</span>
                      </div>
                    </div>

                    <hr className="border-slate-205" />

                    {/* 2. HEATING CALCULATION */}
                    <div className="space-y-3.5">
                      <div className="flex items-end justify-between">
                        <span className="text-xs font-black text-slate-700">کل بار حرارتی مورد نیاز فضا:</span>
                        <div className="text-left font-sans">
                          <span className="text-2xl font-black text-rose-600 leading-none">{finalHeatingBtu.toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-slate-400 block">BTU/hr</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-white/80 p-3 rounded-2xl border border-slate-150">
                        <div className="text-center">
                          <span className="text-[9px] font-black text-slate-400 block">معادل حرارتی به کیلوکالری</span>
                          <p className="text-base font-black font-mono text-slate-850">{heatingKcal.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">kcal/h</span></p>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] font-black text-slate-400 block">معادل حرارتی به کیلووات</span>
                          <p className="text-base font-black font-mono text-slate-850">{heatingKw} <span className="text-[10px] font-normal text-slate-400">kW</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Advice note */}
                    <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/50 flex gap-2 w-full">
                      <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-850 leading-relaxed font-bold">
                        محاسبات بارهای فوق تقریبی و سریع با احتساب تلورانس دمای بحرانی در اوج گرمای شهر انتخابی است. جهت محاسبات ممیزی اتلاف حرارتی از روی نرم‌افزار Carrier HAP استفاده گردد.
                      </p>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}


          {/* TAB 2: DUCT SIZER MODULE */}
          {currentTab === 'duct' && (
            <div className="space-y-8 animate-fade">
              <div className="max-w-3xl mx-auto">
                {/* 2.1: DUCT SIZER PANEL */}
                <div className="bg-slate-50/60 rounded-3xl border border-slate-205 p-6 md:p-8 space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/50">
                    <Wind className="w-5 h-5 text-amber-600" />
                    <h3 className="text-sm font-black text-slate-800">سایزبندی علمی کانال گالوانیزه هوا (Duct Sizer)</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    {/* Airflow to pass */}
                    <div>
                      <label className="text-xs font-black text-slate-400 block mb-1 mr-1">دبی هوا (CFM)</label>
                      <input 
                        type="number" 
                        value={customCfmStr}
                        onChange={(e) => setCustomCfmStr(e.target.value)}
                        placeholder={(requiredCFM || 1200).toString()}
                        className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-amber-500 ltr"
                      />
                      <span className="text-[9px] text-slate-400 font-bold block mt-1 mr-1">ظرفیت سرمایشی شما: {requiredCFM} CFM</span>
                    </div>

                    {/* Recommended Velocity */}
                    <div>
                      <label className="text-xs font-black text-slate-400 block mb-1 mr-1">سرعت هوای مجاز (FPM)</label>
                      <select 
                        value={designVelocity}
                        onChange={(e) => setDesignVelocity(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="600">600 FPM (بسیار آرام - شاخه‌ها مسکونی)</option>
                        <option value="900">900 FPM (آرام - رایزر اصلی مسکونی)</option>
                        <option value="1200">1200 FPM (تجاری - شاخه‌ها)</option>
                        <option value="1500">1500 FPM (صنعتی / تجاری بزرگ رایزر)</option>
                      </select>
                    </div>
                  </div>

                  {/* Duct Aspect Ratio layout selection */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-150 space-y-4">
                    <span className="text-xs font-black text-slate-700 block">تعیین شکل ظاهری مقطع کانال:</span>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setDuctShapeType('ratio')}
                        className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${ductShapeType === 'ratio' ? 'bg-white text-amber-805 shadow-sm' : 'text-slate-500'}`}
                      >
                        نسبت پهنا به ارتفاع کانال
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuctShapeType('fixedWidth')}
                        className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${ductShapeType === 'fixedWidth' ? 'bg-white text-amber-805 shadow-sm' : 'text-slate-500'}`}
                      >
                        پهنای کانال ثابت فرضی
                      </button>
                    </div>

                    {ductShapeType === 'ratio' ? (
                      <div>
                        <label className="text-xs font-black text-slate-400 block mb-1 mr-1">نسبت ابعاد مستطیلی (W/H)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={aspectRatio}
                          onChange={(e) => setAspectRatio(e.target.value)}
                          placeholder="1.5"
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-amber-500 ltr"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs font-black text-slate-400 block mb-1 mr-1">پهنای ثابت مدنظر (اینچ)</label>
                        <input 
                          type="number" 
                          value={fixedWidth}
                          onChange={(e) => setFixedWidth(e.target.value)}
                          placeholder="14"
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-amber-500 ltr"
                        />
                      </div>
                    )}
                  </div>

                  {/* Duct outputs */}
                  <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-105-light space-y-4">
                    <h4 className="text-xs font-black text-amber-900 block border-b border-amber-200/50 pb-2">سایز پیشنهادی کانال کانال تهویه</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-amber-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold">معادل کانال گرد:</span>
                        <span className="font-sans font-black text-xs text-slate-800">{roundDiameterIn} in ({Math.round(roundDiameterIn * 25.4)} mm)</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-amber-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold">افت فشار مسیر:</span>
                        <span className="font-sans font-black text-xs text-slate-800">{frictionLossPer100ft} in.wg / 100ft</span>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-amber-100/70 text-center">
                      <span className="text-[9px] text-slate-400 font-extrabold block mb-1">ابعاد دقیق کانال مستطیلی گالوانیزه پیشنهادی</span>
                      <div className="flex justify-center items-center gap-4 text-slate-850">
                        <div className="text-center font-sans">
                          <span className="text-xl font-black block text-amber-700">{rectWidth}</span>
                          <span className="text-[10px] text-slate-400 block">عرض (اینچ)</span>
                        </div>
                        <span className="text-xl text-slate-300">×</span>
                        <div className="text-center font-sans">
                          <span className="text-xl font-black block text-amber-700">{rectHeight}</span>
                          <span className="text-[10px] text-slate-400 block">ارتفاع (اینچ)</span>
                        </div>
                        <span className="text-slate-300">|</span>
                        <div className="text-center font-sans font-black text-xs">
                          <span className="text-amber-700 block">{Math.round(rectWidth * 2.54)} × {Math.round(rectHeight * 2.54)}</span>
                          <span className="text-[9px] text-slate-400 block">ابعاد به سانتی‌متر</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}


          {/* TAB 2.5: PIPING SIZER MODULE */}
          {currentTab === 'pipe' && (
            <div className="space-y-8 animate-fade">
              <div className="max-w-3xl mx-auto">
                {/* 2.2: PIPING SIZER PANEL */}
                <div className="bg-slate-50/60 rounded-3xl border border-slate-205 p-6 md:p-8 space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/50">
                    <Ruler className="w-5 h-5 text-amber-600" />
                    <h3 className="text-sm font-black text-slate-800">سایزبندی لوله‌های آبرسانی کویل و مسی مبرد</h3>
                  </div>

                  {/* Select Fluid Type */}
                  <div>
                    <label className="text-xs font-black text-slate-400 block mb-1.5 mr-1">سیال درون شبکه لوله‌کشی</label>
                    <div className="flex bg-white border border-slate-200 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => { setPipeFluid('water'); }}
                        className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${pipeFluid === 'water' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'}`}
                      >
                        آب در گردش (چیلر/رادیاتور)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPipeFluid('refrig_gas'); }}
                        className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${pipeFluid === 'refrig_gas' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500'}`}
                      >
                        گاز مبرد گرمایش/سرمایش
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPipeFluid('refrig_liq'); }}
                        className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${pipeFluid === 'refrig_liq' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'}`}
                      >
                        مایع برگشتی مبرد مسی
                      </button>
                    </div>
                  </div>

                  {pipeFluid === 'water' ? (
                    <div>
                      <label className="text-xs font-black text-slate-400 block mb-1 mr-1">جریان کل آب در گردش (GPM)</label>
                      <input 
                        type="number"
                        value={pipeFlowGpm}
                        onChange={(e) => setPipeFlowGpm(e.target.value)}
                        placeholder={(parseFloat((coolingTons * 2.4).toFixed(1)) || 10).toString()}
                        className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-amber-500 ltr"
                      />
                      <span className="text-[9px] text-slate-400 font-bold block mt-1 mr-1">دبی تقریبی چیلر شما برای {coolingTons} تن تبرید: {(coolingTons * 2.4).toFixed(1)} GPM</span>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-black text-slate-400 block mb-1 mr-1">ظرفیت سرمایش خالص بخش مبرد (Tons of Cool)</label>
                      <input 
                        type="number"
                        value={pipeCapacityTons}
                        onChange={(e) => setPipeCapacityTons(e.target.value)}
                        placeholder={(coolingTons || 4).toString()}
                        className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl font-bold text-xs text-slate-800 outline-none focus:border-amber-500 ltr"
                      />
                      <span className="text-[9px] text-slate-400 font-bold block mt-1 mr-1">معادل بار فضایی محاسبه شده شما: {coolingTons} TR</span>
                    </div>
                  )}

                  {/* Piping output showcase */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-150 space-y-4">
                    <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">سایزینگ پیشنهادی آیین‌نامه‌ای لوله</span>
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-2xl border border-slate-200 text-center">
                      <span className={`text-xl font-black ${pipeResult.color} block`} dir="ltr">{pipeResult.recSize}</span>
                      <span className="text-[10px] text-slate-400 font-black mt-1">سایز اسمی قطر لوله</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-bold block">سرعت دقیق مایع/گاز:</span>
                        <p className="text-xs font-black text-slate-750 font-mono" dir="ltr">{pipeResult.velocity}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 font-bold block">سرعت افت اصطکاکی هیزن:</span>
                        <p className="text-xs font-black text-slate-750 font-mono" dir="ltr">{pipeResult.friction}</p>
                      </div>
                    </div>

                    {/* Explanatory note */}
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100/50 flex gap-2">
                      <Info className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-850 font-bold leading-relaxed">
                        {pipeResult.note}
                      </p>
                    </div>

                  </div>

                </div>
              </div>
            </div>
          )}





          {/* TAB 4: TESTING & COMPLIANCE CERTIFICATE */}
          {currentTab === 'test' && (
            <div className="space-y-8 animate-fade">
              
              {/* Test mode selector */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl mb-6 max-w-xl mx-auto">
                <span className="text-xs font-black text-slate-700">انتخاب شاخه آزمون تاسیسات مکانیکی:</span>
                <div className="flex bg-slate-200/60 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    onClick={() => { setPipeFluid('water'); }}
                    className={`flex-1 sm:flex-initial px-4 py-2 text-[10px] font-black rounded-lg transition-all cursor-pointer ${pipeFluid === 'water' ? 'bg-white text-amber-808 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    تست هیدرولیک لوله‌ها
                  </button>
                  <button
                    onClick={() => { setPipeFluid('refrig_gas'); }}
                    className={`flex-1 sm:flex-initial px-4 py-2 text-[10px] font-black rounded-lg transition-all cursor-pointer ${pipeFluid === 'refrig_gas' ? 'bg-white text-amber-808 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    تست فشار مسی (ازت)
                  </button>
                </div>
              </div>

              {/* Specs parameters display of testing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-right">
                  <span className="text-[9px] font-black text-slate-400 block mb-1">فشار مورد نیاز آزمون</span>
                  <p className="text-xs font-black text-slate-800 leading-relaxed">
                    {activeTest.pressure}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-right">
                  <span className="text-[9px] font-black text-slate-400 block mb-1">مدت زمان دوام آزمون</span>
                  <p className="text-xs font-black text-slate-800 leading-relaxed">
                    {activeTest.duration}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-right">
                  <span className="text-[9px] font-black text-slate-400 block mb-1">دستورالعمل آیین‌نامه‌ای</span>
                  <p className="text-xs font-black text-slate-800 leading-relaxed">
                    تست با {activeTest.medium} انجام شده و دمای آزمون لوله‌های پلیمری باید پایدار باشد.
                  </p>
                </div>
              </div>

              {/* Main Checklist steps builder */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 className="w-5 h-5 text-amber-600" />
                    <span>مراحل گام به گام تا اخذ تاییدیه مبحث ۱۴ مسکن</span>
                  </h3>
                  
                  {/* Progress count indicator */}
                  <div className="text-left font-black text-amber-600 font-mono text-xs">
                    {activeTest.steps.filter(step => testCheckedItems[step.id]).length} از {activeTest.steps.length} انجام شده
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {activeTest.steps.map((step) => {
                    const isChecked = testCheckedItems[step.id] || false;
                    return (
                      <div 
                        key={step.id}
                        onClick={() => toggleTestItem(step.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${isChecked ? 'bg-amber-50/40 border-amber-305 shadow-sm' : 'bg-slate-50/50 hover:bg-slate-100/50 border-slate-200'}`}
                      >
                        <div className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center transition-all ${isChecked ? 'bg-amber-600 border-amber-605 text-white' : 'bg-white border-slate-300'}`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <p className="text-xs font-bold leading-relaxed text-slate-700">{step.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Render digital seal and printable signature output card when completed */}
                {activeTest.steps.every(step => testCheckedItems[step.id]) ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-50/50 border-2 border-dashed border-emerald-300 rounded-[2rem] p-6 text-center space-y-3.5 mt-6"
                    dir="rtl"
                  >
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold border-4 border-emerald-100 shadow-lg">
                      ✓
                    </div>
                    <h4 className="text-base font-black text-emerald-990">برگه تایید نهایی آب‌بند و مقاومت فیزیکی سیستم کولینگ و گرمایش صادر گردید</h4>
                    <p className="text-xs text-emerald-700 max-w-lg mx-auto font-bold leading-6">
                      شبکه لوله‌کشی و هوارسان تست شده برای بخش <span className="underline font-extrabold">{activeTest.title}</span> آب‌بند گشته، عاری از هرگونه افت فشار یا نشست ناگهانی ثبت گردید و هم‌اکنون به عنوان گام نهایی آماده پوشاندن با عایق نئوپرن است.
                    </p>
                    <div className="pt-2">
                      <button 
                        onClick={() => window.print()}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black transition-all cursor-pointer shadow-sm shadow-emerald-200"
                      >
                        پرینت برگه صورتمجلس تحویل کارگاه
                      </button>
                    </div>

                    <div className="pt-4 flex flex-col items-center justify-center text-slate-400 border-t border-emerald-200/50 mt-4 h-full">
                      <div className="text-[10px] font-mono tracking-widest font-black flex items-center gap-1 text-slate-500">
                        <span>EMERALD SEAL SECURITY • APPROVED</span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center text-xs text-slate-400 font-bold mt-4">
                    جهت تایید نهایی و صدور دیجیتالی گواهی مبحث ۱۴ مقررات ملی، لطفاً تیک انجام تمام مراحل اجرایی فوق را بزنید.
                  </div>
                )}

              </div>

            </div>
          )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
};

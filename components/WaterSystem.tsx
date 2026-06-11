import React, { useState } from 'react';
import { 
  Droplets, 
  Calculator, 
  Info, 
  Check, 
  HelpCircle, 
  Grid, 
  Sliders, 
  Compass, 
  Maximize2, 
  ShieldAlert, 
  Activity,
  Ruler
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FIRE_HAZARD_CLASSES } from '../constants';
import { HazardInfoModal } from './HazardInfoModal';

// Interactive Sprinkler Hazard Specifications Custom Database
const SPRINKLER_HAZARDS = [
  {
    id: 'light',
    label: 'کم‌خطر (Light Hazard)',
    duration: 15, // standard min as per user preference
    areaMinFt: 1500,
    areaMaxFt: 3000,
    densityAtMinArea: 0.10,
    densityAtMaxArea: 0.07,
    maxSpacingFt: 15.0,
    maxSpacingM: 4.57,
    maxCoverageFt: 225,
    maxCoverageM: 18.6,
    hoseFlowGpm: 100,
    hoseDesc: 'یک عدد هوزریل (1.0 inch)',
  },
  {
    id: 'ordinary1',
    label: 'میان‌خطر ۱ (Ordinary 1)',
    duration: 20,
    areaMinFt: 1500,
    areaMaxFt: 4000,
    densityAtMinArea: 0.15,
    densityAtMaxArea: 0.10,
    maxSpacingFt: 15.0,
    maxSpacingM: 4.57,
    maxCoverageFt: 130,
    maxCoverageM: 12.1,
    hoseFlowGpm: 250,
    hoseDesc: 'جعبه آتشنشانی (1.5 inch)',
  },
  {
    id: 'ordinary2',
    label: 'میان‌خطر ۲ (Ordinary 2)',
    duration: 30,
    areaMinFt: 1500,
    areaMaxFt: 4000,
    densityAtMinArea: 0.20,
    densityAtMaxArea: 0.15,
    maxSpacingFt: 15.0,
    maxSpacingM: 4.57,
    maxCoverageFt: 130,
    maxCoverageM: 12.1,
    hoseFlowGpm: 250,
    hoseDesc: 'جعبه آتشنشانی (1.5 inch)',
  },
  {
    id: 'extra1',
    label: 'پرخطر ۱ (Extra 1)',
    duration: 60,
    areaMinFt: 2500,
    areaMaxFt: 5000,
    densityAtMinArea: 0.30,
    densityAtMaxArea: 0.25,
    maxSpacingFt: 12.0,
    maxSpacingM: 3.66,
    maxCoverageFt: 100,
    maxCoverageM: 9.3,
    hoseFlowGpm: 500,
    hoseDesc: 'دو عدد جعبه آتشنشانی (2.5 inch)',
  },
  {
    id: 'extra2',
    label: 'پرخطر ۲ (Extra 2)',
    duration: 60,
    areaMinFt: 2500,
    areaMaxFt: 5000,
    densityAtMinArea: 0.40,
    densityAtMaxArea: 0.30,
    maxSpacingFt: 12.0,
    maxSpacingM: 3.66,
    maxCoverageFt: 100,
    maxCoverageM: 9.3,
    hoseFlowGpm: 500,
    hoseDesc: 'دو عدد جعبه آتشنشانی (2.5 inch)',
  }
];

export const WaterSystem: React.FC = () => {
  // Tab control
  const [activeTab, setActiveTab] = useState<'reservoir' | 'sprinkler'>('reservoir');

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Region 1: Reservoir Tabs States
  const [hazard, setHazard] = useState(FIRE_HAZARD_CLASSES[0].id);
  const [hasSprinkler, setHasSprinkler] = useState(false);
  const [useCalculatedSprinkler, setUseCalculatedSprinkler] = useState(false);
  const [showSprInfo, setShowSprInfo] = useState(false);
  const [hydrantCount, setHydrantFlow] = useState(FIRE_HAZARD_CLASSES[0].hydrantFlow.toString()); // GPM
  const [manualDuration, setDuration] = useState(FIRE_HAZARD_CLASSES[0].duration.toString());
  
  const selectedHazard = FIRE_HAZARD_CLASSES.find(h => h.id === hazard) || FIRE_HAZARD_CLASSES[0];

  // Region 2: Sprinkler Layout Designer States
  const [sprHazardId, setSprHazardId] = useState(SPRINKLER_HAZARDS[0].id);
  const [unit, setUnit] = useState<'meter' | 'foot'>('meter');
  const [lengthInput, setLengthInput] = useState('14'); // set starting layout dimension that has sprinklers (e.g. 14x14)
  const [widthInput, setWidthInput] = useState('14');
  const [showResults, setShowResults] = useState(true);

  const selectedSprHazard = SPRINKLER_HAZARDS.find(h => h.id === sprHazardId) || SPRINKLER_HAZARDS[0];
  const [custDesignAreaFt, setCustDesignAreaFt] = useState<number>(1500);

  // NFPA 13 Curve Interpolator Logic
  const getDensityForArea = (hazardId: string, areaFt2: number) => {
    const spec = SPRINKLER_HAZARDS.find(h => h.id === hazardId) || SPRINKLER_HAZARDS[0];
    const minA = spec.areaMinFt;
    const maxA = spec.areaMaxFt;
    const maxD = spec.densityAtMinArea; // e.g. 0.10 for light hazard
    const minD = spec.densityAtMaxArea; // e.g. 0.07

    // Clamp area within specifications
    const clampedArea = Math.max(minA, Math.min(maxA, areaFt2));
    
    // Linear Interpolation: Density decreases as design area increases
    const interpolationRatio = (clampedArea - minA) / (maxA - minA);
    const density = maxD - interpolationRatio * (maxD - minD);
    
    return parseFloat(density.toFixed(3));
  };

  const getDensityMm = (gpm: number) => parseFloat((gpm * 40.74).toFixed(2));
  const getAreaM2 = (ft2: number) => parseFloat((ft2 * 0.092903).toFixed(1));

  // Helper helper to synchronize classifications safely
  const handleReservoirHazardChange = (newHazardId: string) => {
    setHazard(newHazardId);
    const h = FIRE_HAZARD_CLASSES.find(item => item.id === newHazardId) || FIRE_HAZARD_CLASSES[0];
    setDuration(h.duration.toString());
    setHydrantFlow(h.hydrantFlow.toString());
    
    // Auto-sync Sprinkler Hazard
    let targetSpr = 'light';
    if (newHazardId === 'high') {
      targetSpr = 'extra1';
    } else {
      targetSpr = newHazardId;
    }
    setSprHazardId(targetSpr);
    const targetSpec = SPRINKLER_HAZARDS.find(item => item.id === targetSpr) || SPRINKLER_HAZARDS[0];
    setCustDesignAreaFt(targetSpec.areaMinFt);
  };

  const handleSprinklerHazardChange = (newSprHazardId: string) => {
    setSprHazardId(newSprHazardId);
    const targetSpec = SPRINKLER_HAZARDS.find(item => item.id === newSprHazardId) || SPRINKLER_HAZARDS[0];
    setCustDesignAreaFt(targetSpec.areaMinFt);
    
    // Auto-sync Reservoir Hazard
    let targetResHazard = 'light';
    if (newSprHazardId === 'extra1' || newSprHazardId === 'extra2') {
      targetResHazard = 'high';
    } else {
      targetResHazard = newSprHazardId;
    }
    setHazard(targetResHazard);
    const h = FIRE_HAZARD_CLASSES.find(item => item.id === targetResHazard) || FIRE_HAZARD_CLASSES[0];
    setDuration(h.duration.toString());
    setHydrantFlow(h.hydrantFlow.toString());
  };

  // Sprinkler Layout Calculations
  const calculateSprinklerLayout = () => {
    const lVal = parseFloat(lengthInput) || 0;
    const wVal = parseFloat(widthInput) || 0;
    
    if (lVal <= 0 || wVal <= 0) {
      return null;
    }

    // Convert inputs to feet for computational consistency with NFPA database norms
    const lengthFt = unit === 'meter' ? lVal * 3.28084 : lVal;
    const widthFt = unit === 'meter' ? wVal * 3.28084 : wVal;

    const totalAreaFt2 = lengthFt * widthFt;
    const totalAreaM2 = totalAreaFt2 * 0.092903;

    // Computational layout sizing parameters
    const maxSpacing = selectedSprHazard.maxSpacingFt;
    const maxCoverage = selectedSprHazard.maxCoverageFt;
    const designAreaFt = custDesignAreaFt;
    const density = getDensityForArea(sprHazardId, custDesignAreaFt);

    // Minimum sprinklers required to cover layout length & width without exceeding spacing limits
    let nL = Math.max(1, Math.ceil(lengthFt / maxSpacing));
    let nW = Math.max(1, Math.ceil(widthFt / maxSpacing));

    // Ensure physical constraints
    while (lengthFt / nL > maxSpacing) {
      nL++;
    }
    while (widthFt / nW > maxSpacing) {
      nW++;
    }

    // Ensure maximum coverage design constraints
    while ((lengthFt / nL) * (widthFt / nW) > maxCoverage) {
      if (lengthFt / nL > widthFt / nW) {
        nL++;
      } else {
        nW++;
      }
    }

    // Final spacing computations
    const spacingLFt = lengthFt / nL;
    const spacingWFt = widthFt / nW;
    const spacingLM = spacingLFt * 0.3048;
    const spacingWM = spacingWFt * 0.3048;

    const totalSprinklers = nL * nW;

    // Calculate active sprinklers in design operating region
    const sprinklerArea = spacingLFt * spacingWFt;
    // Standard estimation matching NFPA 13
    const targetSprInDesignArea = Math.min(
      totalSprinklers,
      Math.ceil(designAreaFt / Math.max(187.5, sprinklerArea))
    );

    // Dynamic sprinkler flow calculation (including pressure flow limits of 15 GPM)
    const flowPerSprinkler = Math.max(15, sprinklerArea * density * 1.0);
    const minSprinklerFlowGpm = parseFloat((targetSprInDesignArea * flowPerSprinkler).toFixed(1));
    const rawTankSizeM3 = (minSprinklerFlowGpm + selectedSprHazard.hoseFlowGpm) * 3.78541 * selectedSprHazard.duration / 1000;

    return {
      lengthFt,
      widthFt,
      totalAreaFt2,
      totalAreaM2,
      nL,
      nW,
      spacingLFt,
      spacingWFt,
      spacingLM,
      spacingWM,
      totalSprinklers,
      sprinklersInDesignArea: targetSprInDesignArea,
      minSprinklerFlow: minSprinklerFlowGpm,
      minHoseFlow: selectedSprHazard.hoseFlowGpm,
      minPumpFlow: minSprinklerFlowGpm + selectedSprHazard.hoseFlowGpm,
      tankSizeM3: Math.ceil(rawTankSizeM3 * 10) / 10,
    };
  };

  const sprinklerResults = calculateSprinklerLayout();

  // Reservoir Calculations that accepts either default standard value or precisely designed layout flow
  const calculateReservoir = () => {
    const dur = parseInt(manualDuration) || selectedHazard.duration;
    const hFlow = parseInt(hydrantCount) || 0;
    
    let sFlow = 0;
    let isUsingCalculated = false;
    
    if (hasSprinkler) {
      if (useCalculatedSprinkler && sprinklerResults) {
        sFlow = sprinklerResults.minSprinklerFlow;
        isUsingCalculated = true;
      } else {
        sFlow = selectedHazard.sprinklerFlow;
      }
    }
    
    const totalFlowGPM = hFlow + sFlow;
    const totalVolumeLitres = totalFlowGPM * 3.785 * dur;
    
    return {
      flow: totalFlowGPM,
      volume: totalVolumeLitres / 1000, // m3
      duration: dur,
      sprinklerFlowUsed: sFlow,
      isUsingCalculated
    };
  };

  const reservoirResults = calculateReservoir();

  return (
    <div className="max-w-4xl mx-auto space-y-6 page-enter ltr:rtl">
      <HazardInfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Primary Tab Bar with high-end polished styling */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 border border-slate-200 shadow-sm max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('reservoir')}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'reservoir' 
              ? 'bg-rose-600 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Droplets className="w-4 h-4" />
          <span>مخزن و دبی پمپ</span>
        </button>
        <button
          onClick={() => setActiveTab('sprinkler')}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'sprinkler' 
              ? 'bg-rose-600 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>طراحی چیدمان اسپرینکلر</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'reservoir' ? (
          <motion.div
            key="reservoir"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-10">
                <div className="bg-rose-100 p-3 rounded-2xl">
                  <Droplets className="text-rose-600 w-6 h-6" />
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black">طراحی مخزن و دبی پمپ</h2>
                  <p className="text-slate-400 text-xs font-bold mt-1">محاسبه حجم ذخیره آب و دبی مورد نیاز بر اساس NFPA 13 & 14</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mr-1">
                      <label className="text-[11px] font-black text-slate-400 uppercase">کلاس خطر ساختمان</label>
                      <button 
                        onClick={() => setIsModalOpen(true)}
                        className="p-1 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors flex items-center gap-1.5"
                      >
                        <span className="text-[9px] font-black uppercase tracking-tight">اطلاعات تکمیلی</span>
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {FIRE_HAZARD_CLASSES.map((h) => (
                        <button
                          key={h.id}
                          onClick={() => handleReservoirHazardChange(h.id)}
                          className={`p-3 rounded-xl border text-right transition-all ${hazard === h.id ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                        >
                          <span className="block text-[10px] font-black opacity-60 mb-1">{h.id.toUpperCase()}</span>
                          <span className="text-xs font-bold">{h.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[11px] font-black text-slate-400 uppercase mr-1">تجهیزات فعال</label>
                     <div className="flex flex-col gap-3">
                       <button 
                         type="button"
                         onClick={() => {
                           const newVal = !hasSprinkler;
                           setHasSprinkler(newVal);
                           if (newVal && sprinklerResults) {
                             // Automatically prefer calculated sprinkler GPM if it was already designed!
                             setUseCalculatedSprinkler(true);
                           }
                         }}
                         className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${hasSprinkler ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-50 text-slate-400'}`}
                       >
                         <div className="flex items-center gap-1.5 align-middle">
                           <span className="text-sm font-black text-rose-600">سیستم اسپرینکلر</span>
                           <span 
                             onClick={(e) => {
                               e.stopPropagation();
                               setShowSprInfo(!showSprInfo);
                             }}
                             className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer flex items-center justify-center"
                             title="راهنمای منبع دبی"
                           >
                             <HelpCircle className="w-3.5 h-3.5" />
                           </span>
                         </div>
                         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${hasSprinkler ? 'bg-rose-600 border-rose-600 text-white shadow-sm' : 'bg-white border-slate-400 hover:border-slate-500'}`}>
                           {hasSprinkler && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                         </div>
                       </button>

                       {/* Interactive explainer box triggered by clicking the Info button */}
                       <AnimatePresence>
                         {showSprInfo && (
                           <motion.div 
                             initial={{ opacity: 0, height: 0 }}
                             animate={{ opacity: 1, height: 'auto' }}
                             exit={{ opacity: 0, height: 0 }}
                             className="overflow-hidden"
                           >
                             <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-xs font-medium space-y-2 leading-relaxed text-right">
                               <div className="flex items-center gap-1.5 justify-end text-amber-900 font-black">
                                 <span>نحوه محاسبه دبی اسپرینکلر:</span>
                                 <HelpCircle className="w-4 h-4 text-amber-800" />
                               </div>
                               <p>
                                 وقتی تیک سیستم اسپرینکلر را فعال می‌کنید، دبی آن به محاسبات حجم کل مخزن و دبی پمپ اضافه می‌شود. شما دو روش برای مقداردهی دارید:
                               </p>
                               <ul className="list-disc list-inside space-y-1.5 mt-1 font-bold text-amber-700">
                                 <li>
                                   <strong className="text-amber-900">پیش‌فرض استاندارد:</strong> دبی ثابت و کلی ضوابط بر اساس کلاس خطر (مثلاً {selectedHazard.sprinklerFlow || 200} GPM).
                                 </li>
                                 <li>
                                   <strong className="text-amber-900">دبی محاسباتی چیدمان:</strong> دبی دقیقی که بر اساس چیدمان و مساحت سالن خود در تب <span className="underline cursor-pointer text-rose-600" onClick={() => { setActiveTab('sprinkler'); setShowSprInfo(false); }}>طراحی چیدمان اسپرینکلر</span> طراحی نموده‌اید.
                                 </li>
                               </ul>
                             </div>
                           </motion.div>
                         )}
                       </AnimatePresence>

                       {hasSprinkler && (
                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 animate-fade text-right">
                           <span className="text-[10px] font-black text-slate-400 uppercase block">منبع دبی اسپرینکلر برای محاسبات مخزن:</span>
                           <div className="grid grid-cols-2 gap-2">
                             <button
                               type="button"
                               onClick={() => setUseCalculatedSprinkler(false)}
                               className={`p-2.5 rounded-xl border text-center transition-all text-xs font-bold flex flex-col items-center justify-center gap-1 ${
                                 !useCalculatedSprinkler 
                                   ? 'bg-rose-600 border-rose-600 text-white shadow-md' 
                                   : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                               }`}
                             >
                               <span>پیش‌فرض استاندارد</span>
                               <span className="text-[10px] font-mono opacity-80">{selectedHazard.sprinklerFlow} GPM</span>
                             </button>
                             <button
                               type="button"
                               disabled={!sprinklerResults}
                               onClick={() => setUseCalculatedSprinkler(true)}
                               className={`p-2.5 rounded-xl border text-center transition-all text-xs font-bold flex flex-col items-center justify-center gap-1 ${
                                 !sprinklerResults 
                                   ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-100 text-slate-400' 
                                   : useCalculatedSprinkler 
                                     ? 'bg-rose-600 border-rose-600 text-white shadow-md' 
                                     : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                               }`}
                             >
                               <span>دبی محاسباتی چیدمان</span>
                               <span className="text-[10px] font-mono opacity-80">
                                 {sprinklerResults ? `${sprinklerResults.minSprinklerFlow} GPM` : 'سالن طراحی نشده'}
                               </span>
                             </button>
                           </div>
                           {!sprinklerResults && (
                             <p className="text-[9px] text-slate-400 font-bold leading-relaxed">
                               * برای استفاده از دبی محاسباتی دقیق، ابتدا طول و عرض سالن را در تب «طراحی چیدمان اسپرینکلر» مشخص کنید.
                             </p>
                           )}
                         </div>
                       )}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-400 uppercase mr-1">دبی هیدرانت (GPM)</label>
                      <input 
                        type="number" 
                        value={hydrantCount} 
                        onChange={(e) => setHydrantFlow(e.target.value)}
                        className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 focus:border-rose-500 outline-none font-bold ltr text-left"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-400 uppercase mr-1">زمان ذخیره (Min)</label>
                      <input 
                        type="number" 
                        value={manualDuration} 
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 focus:border-rose-500 outline-none font-bold ltr text-left"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="bg-slate-900 rounded-[32px] p-8 text-white flex-1 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="relative z-10 text-right">
                      <span className="text-rose-400 text-[10px] font-black uppercase tracking-widest block mb-1">خروجی محاسبات</span>
                      <div className="flex items-baseline gap-3 justify-end ltr">
                        <span className="text-6xl font-black font-mono tracking-tighter ltr">{reservoirResults.volume.toFixed(1)}</span>
                        <span className="text-xl font-bold opacity-40 italic">m³</span>
                      </div>
                      <p className="text-xs font-bold text-slate-400 mt-2">حجم کل مخزن ذخیره اختصاصی</p>

                      <div className="mt-10 pt-8 border-t border-white/10 space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 font-bold">دبی مورد نیاز پمپ:</span>
                          <span className="font-mono font-black text-rose-400 ltr">{reservoirResults.flow} GPM</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold">
                          <span className="text-slate-400 text-xs text-right">جزئیات دبی آتشنشانی:</span>
                          <span className="font-mono text-xs opacity-75 text-rose-300 ltr">
                            ({hasSprinkler ? `${reservoirResults.sprinklerFlowUsed} (اسپرینکلر)` : '0'} + {hydrantCount || 0} (هیدرانت))
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 font-bold">زمان مفروض:</span>
                          <span className="font-mono font-black text-rose-400 ltr">{reservoirResults.duration} Min</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 font-bold">حجم به لیتر:</span>
                          <span className="font-mono font-black text-rose-400 ltr">{(reservoirResults.volume * 1000).toLocaleString()} L</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex gap-4 text-right">
              <div className="bg-blue-600/20 p-2 rounded-xl h-fit">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-blue-900 font-black text-sm mb-1">راهنمای استانداردی مخزن</h4>
                <p className="text-blue-700/70 text-xs leading-relaxed font-bold">
                  مطابق ضوابط ملاک عمل سازمان آتش‌نشانی، زمان ذخیره برای کم‌خطر ۱۵ دقیقه، میان خطر ۱ معادل ۲۰ دقیقه، میان خطر ۲ شامل ۳۰ دقیقه، و پرخطر ۶۰ دقیقه بر اساس دبی مورد نیاز سیستم هیدرانت و اسپرینکلرها محاسبه می‌شود.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="sprinkler"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Split Screen Layout: Form on Right, Outputs/Canvas on Left */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-right">
              
              {/* CONFIGURATION COLUMN (Right) */}
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 lg:col-span-5 h-fit space-y-6">
                <div className="flex items-center gap-3 mb-2 justify-end">
                  <h3 className="text-lg font-black text-slate-800">طرح و چیدمان اسپرینکلر</h3>
                  <div className="bg-rose-100 p-2 rounded-xl">
                    <Grid className="text-rose-600 w-5 h-5" />
                  </div>
                </div>

                {/* Hazard Level Tabs */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 block">انتخاب کلاس خطر ساختمان</label>
                  <div className="flex flex-wrap gap-1.5 justify-start">
                    {SPRINKLER_HAZARDS.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => handleSprinklerHazardChange(h.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                          sprHazardId === h.id 
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm' 
                            : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {h.id === 'light' ? 'Light' : h.id === 'ordinary1' ? 'Ord 1' : h.id === 'ordinary2' ? 'Ord 2' : h.id === 'extra1' ? 'Extra 1' : 'Extra 2'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Unit selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 block">واحد اندازه‌گیری</label>
                  <div className="flex gap-4 items-center justify-end">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                      <input 
                        type="radio" 
                        name="unit" 
                        checked={unit === 'foot'} 
                        onChange={() => setUnit('foot')}
                        className="accent-rose-600"
                      />
                      <span>فوت (foot)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                      <input 
                        type="radio" 
                        name="unit" 
                        checked={unit === 'meter'} 
                        onChange={() => setUnit('meter')}
                        className="accent-rose-600"
                      />
                      <span>متر (Meter)</span>
                    </label>
                  </div>
                </div>

                {/* Size Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 block text-right">طول فضا (Length)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={lengthInput}
                        onChange={(e) => setLengthInput(e.target.value)}
                        placeholder="طول فضا"
                        className="w-full bg-slate-50 p-3.5 rounded-xl border border-slate-100 focus:border-rose-500 outline-none font-bold text-center ltr"
                      />
                      <span className="absolute left-3 top-3.5 text-[10px] font-black text-slate-400 font-mono uppercase">
                        {unit === 'meter' ? 'm' : 'ft'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 block text-right">عرض فضا (Width)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={widthInput}
                        onChange={(e) => setWidthInput(e.target.value)}
                        placeholder="عرض فضا"
                        className="w-full bg-slate-50 p-3.5 rounded-xl border border-slate-100 focus:border-rose-500 outline-none font-bold text-center ltr"
                      />
                      <span className="absolute left-3 top-3.5 text-[10px] font-black text-slate-400 font-mono uppercase">
                        {unit === 'meter' ? 'm' : 'ft'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Parameters Preview Slider Display with exact values */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-slate-500">مساحت منطقه طراحی:</span>
                      <span className="font-mono text-rose-600 ltr">{getAreaM2(custDesignAreaFt)} m² / {custDesignAreaFt} ft²</span>
                    </div>
                    <input 
                      type="range"
                      min={selectedSprHazard.areaMinFt}
                      max={selectedSprHazard.areaMaxFt}
                      step={50}
                      value={custDesignAreaFt}
                      onChange={(e) => setCustDesignAreaFt(Number(e.target.value))}
                      className="w-full accent-rose-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold">
                      <span>{selectedSprHazard.areaMaxFt} ft²</span>
                      <span>{selectedSprHazard.areaMinFt} ft²</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-slate-500">شدت آبدهی بارندگی (Density):</span>
                      <span className="font-mono text-rose-600 ltr">{getDensityMm(getDensityForArea(sprHazardId, custDesignAreaFt))} mm/min / {getDensityForArea(sprHazardId, custDesignAreaFt).toFixed(3)} GPM/ft²</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden relative">
                      <div 
                        className="bg-purple-600 h-full rounded-full transition-all duration-150" 
                        style={{ width: `${Math.min(100, (getDensityForArea(sprHazardId, custDesignAreaFt) / 0.45) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>شدت متناظر بر اساس منحنی استاندارد NFPA 13</span>
                      <span className="font-mono text-rose-600">NFPA 13 Wet System</span>
                    </div>
                  </div>
                </div>

                {/* Get calculation action button */}
                <button 
                  onClick={() => setShowResults(true)}
                  className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  <span>محاسبه و ترسیم چیدمان</span>
                </button>
              </div>

              {/* RESULTS AND VISUAL LAYOUT CONTAINER (Left) */}
              <div className="lg:col-span-7 space-y-6">
                {showResults && sprinklerResults ? (
                  <div className="space-y-6">
                    {/* Numeric breakdown card */}
                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between border-b border-rose-50 pb-3">
                        <span className="text-xs bg-rose-50 text-rose-600 px-3 py-1 rounded-full font-black ltr">{selectedSprHazard.label}</span>
                        <h4 className="text-sm font-black text-slate-800">خلاصه گزارش محاسبات فنی</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                        <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                          <span className="text-slate-400">کل مساحت سالن:</span>
                          <span className="font-mono text-slate-900 ltr">
                            {sprinklerResults.totalAreaM2.toFixed(1)} m² / {sprinklerResults.totalAreaFt2.toFixed(1)} ft²
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                          <span className="text-slate-400">کل اسپرینکلرهای چیدمان:</span>
                          <span className="font-bold text-rose-600">
                            {sprinklerResults.totalSprinklers} عدد اسپرینکلر
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                          <span className="text-slate-400">فاصله طولی (در میان لوله‌ها):</span>
                          <span className="font-mono text-slate-800 ltr">
                            {sprinklerResults.spacingLM.toFixed(2)}m / {sprinklerResults.spacingLFt.toFixed(1)}ft
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                          <span className="text-slate-400">فاصله عرضی:</span>
                          <span className="font-mono text-slate-800 ltr">
                            {sprinklerResults.spacingWM.toFixed(2)}m / {sprinklerResults.spacingWFt.toFixed(1)}ft
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                          <span className="text-slate-400">تعداد اسپرینکلر طرح:</span>
                          <span className="font-mono text-slate-800 ltr">{sprinklerResults.sprinklersInDesignArea} عدد </span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                          <span className="text-slate-400">سیستم هوزریل کمکی:</span>
                          <span className="font-mono text-slate-800 ltr">{selectedSprHazard.hoseDesc}</span>
                        </div>
                      </div>

                      {/* Flows / Specs Details Block */}
                      <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-300">دبی کل اسپرینکلرهای طرح:</span>
                          <span className="font-mono text-rose-400 font-bold ltr">{sprinklerResults.minSprinklerFlow} GPM</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-300">حداقل دبی فایرباکس جانبی:</span>
                          <span className="font-mono text-rose-400 font-bold ltr">{sprinklerResults.minHoseFlow} GPM</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-t border-white/10 pt-3">
                          <span className="text-slate-100 font-black">دبی حداقل پمپ آتشنشانی:</span>
                          <span className="font-mono text-emerald-400 font-black ltr">{sprinklerResults.minPumpFlow} GPM</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-100 font-black">مخزن مورد نیاز ({selectedSprHazard.duration} Min):</span>
                          <span className="font-mono text-emerald-400 font-black ltr">{sprinklerResults.tankSizeM3} m³</span>
                        </div>
                      </div>
                    </div>

                    {/* SVG Interactive Canvas layout renderer */}
                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-4 text-center">
                      <div className="flex justify-between items-center border-b border-rose-50 pb-3 text-right">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Grid size: {sprinklerResults.nL} × {sprinklerResults.nW}
                        </span>
                        <h4 className="text-sm font-black text-slate-800">نقشه چیدمان و موقعیت اسپرینکلرها</h4>
                      </div>

                      {/* Render proportional responsive SVG container */}
                      <div className="relative border border-slate-200 bg-slate-50 rounded-2xl overflow-hidden p-6 shadow-inner flex items-center justify-center min-h-[300px]">
                        <svg 
                          viewBox="0 0 500 350" 
                          className="w-full h-auto max-w-[460px] drop-shadow-sm"
                        >
                          {/* Room Background Wall Block */}
                          <rect 
                            x="40" 
                            y="40" 
                            width="420" 
                            height="240" 
                            fill="#fcfcfd" 
                            stroke="#475569" 
                            strokeWidth="3.5" 
                            rx="8"
                          />

                          {/* Grid Branches Guide line representation */}
                          {Array.from({ length: sprinklerResults.nL }).map((_, colIndex) => {
                            const stepX = 420 / sprinklerResults.nL;
                            const x = 40 + stepX / 2 + colIndex * stepX;
                            return (
                              <line
                                key={`branch-${colIndex}`}
                                x1={x}
                                y1="40"
                                x2={x}
                                y2="280"
                                stroke="#f43f5e"
                                strokeWidth="1"
                                strokeDasharray="3 3.5"
                                opacity="0.65"
                              />
                            );
                          })}

                          {/* Render blue sprinklers inside layout with dynamic sizing */}
                          {(() => {
                            const maxPixelSpacing = Math.min(420 / sprinklerResults.nL, 240 / sprinklerResults.nW);
                            const radius = Math.max(4, Math.min(13, maxPixelSpacing * 0.35));
                            const showText = radius >= 9.5;
                            const textSize = Math.max(5, Math.min(7.5, radius * 0.6));
                            const strokeWidth = radius > 10 ? 1.5 : 1;
                            const innerDotRadius = Math.max(1.5, radius * 0.22);

                            return Array.from({ length: sprinklerResults.nL }).flatMap((_, colIndex) => {
                              const stepX = 420 / sprinklerResults.nL;
                              const x = 40 + stepX / 2 + colIndex * stepX;
                              
                              return Array.from({ length: sprinklerResults.nW }).map((__, rowIndex) => {
                                const stepY = 240 / sprinklerResults.nW;
                                const y = 40 + stepY / 2 + rowIndex * stepY;
                                return (
                                  <g key={`spr-${colIndex}-${rowIndex}`}>
                                    <circle 
                                      cx={x} 
                                      cy={y} 
                                      r={radius} 
                                      fill="#e0f2fe" 
                                      stroke="#0284c7" 
                                      strokeWidth={strokeWidth} 
                                      className="cursor-pointer hover:fill-sky-200 transition-all duration-150"
                                    />
                                    <circle cx={x} cy={y} r={innerDotRadius} fill="#0284c7" />
                                    {showText && (
                                      <text 
                                        x={x} 
                                        y={y + (textSize * 0.35)} 
                                        fontSize={textSize} 
                                        fontWeight="bold" 
                                        textAnchor="middle" 
                                        fill="#0285c7" 
                                        className="pointer-events-none font-mono"
                                      >
                                        SP
                                      </text>
                                    )}
                                  </g>
                                );
                              });
                            });
                          })()}

                          {/* Wall Dimensions Indicator text and markers */}
                          {/* Width measurement line bottom */}
                          <line x1="40" y1="300" x2="460" y2="300" stroke="#94a3b8" strokeWidth="1.5" />
                          <polygon points="40,300 46,296 46,304" fill="#94a3b8" />
                          <polygon points="460,300 454,296 454,304" fill="#94a3b8" />
                          <text 
                            x="250" 
                            y="318" 
                            fontSize="11" 
                            fontWeight="bold" 
                            textAnchor="middle" 
                            fill="#64748b"
                            className="font-mono bg-white px-2"
                          >
                            L = {parseFloat((lengthInput)).toFixed(1)} {unit === 'meter' ? 'm' : 'ft'} ({sprinklerResults.nL} SP)
                          </text>

                          {/* Vertical dimension layout */}
                          <line x1="20" y1="40" x2="20" y2="280" stroke="#94a3b8" strokeWidth="1.5" />
                          <polygon points="20,40 24,46 16,46" fill="#94a3b8" />
                          <polygon points="20,280 24,274 16,274" fill="#94a3b8" />
                          <text 
                            x="12" 
                            y="160" 
                            fontSize="11" 
                            fontWeight="bold" 
                            textAnchor="middle" 
                            fill="#64748b" 
                            transform="rotate(-90 12 160)"
                            className="font-mono bg-white px-1"
                          >
                            W = {parseFloat((widthInput)).toFixed(1)} {unit === 'meter' ? 'm' : 'ft'} ({sprinklerResults.nW} SP)
                          </text>

                          {/* Show dynamic sprinkler spacing info labels */}
                          <text 
                            x="250" 
                            y="25" 
                            fontSize="10" 
                            fontWeight="bold" 
                            textAnchor="middle" 
                            fill="#f43f5e"
                          >
                            فاصله طولی: {sprinklerResults.spacingLM.toFixed(2)}m / {sprinklerResults.spacingLFt.toFixed(1)}ft
                          </text>
                        </svg>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400">
                        * دایره‌های آبی نشان‌دهنده اسپرینکلر (SP) و خط‌چین‌های قرمز لوله‌های توزیع شاخه‌ای هستند. با افزایش تعداد اسپرینکلرها و شلوغ شدن طرح، ابعاد سرنازل‌ها به‌طور خودکار کوچک می‌شود تا وضوح نقشه حفظ شود.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-bold text-sm">
                    طول و عرض فضا را معتبر وارد کرده، سپس بر روی دکمه محاسبه کلیک کنید.
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

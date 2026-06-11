
import React, { useState, useMemo } from 'react';
import { Ruler, Droplets, Gauge, AlertCircle, Zap, TableProperties, ChevronLeft, Activity, ChevronDown, ChevronUp, Calculator, Flame, Waves, FlameKindling, Utensils, Check, X, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PRESSURE_TABLES, PIPE_SIZES, DENSITY_FACTORS, PRESSURE_OPTIONS, APPLIANCES } from '../constants';
import { CalculationResult, WorkPressure, PipeSize } from '../types';

const ApplianceIcon = ({ name, className }: { name: string, className?: string }) => {
  switch (name) {
    case 'Flame': return <Flame className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Droplets': return <Droplets className={className} />;
    case 'Waves': return <Waves className={className} />;
    case 'FlameKindling': return <FlameKindling className={className} />;
    case 'Utensils': return <Utensils className={className} />;
    default: return <Zap className={className} />;
  }
};

export const PipeCalculator: React.FC = () => {
  const [pressure, setPressure] = useState<WorkPressure>('0.25');
  const [isPressureMenuOpen, setIsPressureMenuOpen] = useState(false);
  const [length, setLength] = useState<string>('');
  const [flow, setFlow] = useState<string>('');
  const [density, setDensity] = useState<string>('0.65');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Appliance Calculator State
  const [isApplianceModalOpen, setIsApplianceModalOpen] = useState(false);
  const [selectedCounts, setSelectedCounts] = useState<Record<string, number>>({});

  const totalApplianceFlow = useMemo(() => {
    return Object.entries(selectedCounts).reduce((total, [id, count]) => {
      const appliance = APPLIANCES.find(a => id.startsWith(a.id));
      return total + (appliance ? appliance.consumption * count : 0);
    }, 0);
  }, [selectedCounts]);

  const updateCount = (id: string, delta: number) => {
    setSelectedCounts(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const applyAppliances = () => {
    if (totalApplianceFlow > 0) {
      setFlow(totalApplianceFlow.toFixed(1));
    }
    setIsApplianceModalOpen(false);
  };

  const currentTable = useMemo(() => PRESSURE_TABLES[pressure], [pressure]);

  const getDensityFactor = (d: number): number => {
    if (d <= 0.5) return 1.15;
    if (d >= 1.0) return 0.8;
    for (let i = 0; i < DENSITY_FACTORS.length - 1; i++) {
      const p1 = DENSITY_FACTORS[i];
      const p2 = DENSITY_FACTORS[i + 1];
      if (d >= p1.d && d <= p2.d) {
        const ratio = (d - p1.d) / (p2.d - p1.d);
        return p1.f + ratio * (p2.f - p1.f);
      }
    }
    return 1.0;
  };

  const calculateSize = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const lenVal = parseFloat(length);
    const flowVal = parseFloat(flow);
    const densityVal = parseFloat(density);

    if (isNaN(lenVal) || isNaN(flowVal) || lenVal <= 0 || flowVal <= 0) {
      setError('لطفاً مقادیر معتبر وارد کنید.');
      return;
    }

    if (!currentTable) {
      setError('جدول محاسباتی برای فشار انتخابی هنوز بارگذاری نشده است.');
      return;
    }

    const factor = getDensityFactor(densityVal);
    const modifiedFlow = flowVal * factor;
    
    const currentSizes = activeOption?.sizes || PIPE_SIZES;
    
    // Find matching row for length
    let searchLen = lenVal;
    if ((pressure === '30PE' || pressure === '60PE') && lenVal < 15) {
      searchLen = 30;
    }

    const row = currentTable.find(r => r.length >= searchLen);

    if (!row) {
      const maxLen = currentTable[currentTable.length - 1].length;
      setError(`طول بیش از حد مجاز (${maxLen} متر).`);
      return;
    }

    let foundIndex = -1;
    for (let i = 0; i < currentSizes.length; i++) {
      // capacities[i] could be 0 if that size isn't available for this pressure
      if (row.capacities[i] > 0 && row.capacities[i] >= modifiedFlow) {
        foundIndex = i;
        break; 
      }
    }

    if (foundIndex !== -1) {
      setResult({
        size: currentSizes[foundIndex],
        actualCapacity: row.capacities[foundIndex],
        lengthUsed: row.length,
        modifiedFlow: modifiedFlow,
        densityFactor: factor
      });
    } else {
      const maxSize = currentSizes[currentSizes.length - 1];
      const unit = maxSize.endsWith('mm') ? 'میلی‌متر' : 'اینچ';
      setError(`مصرف اصلاح شده (${modifiedFlow.toFixed(1)}) بیش از ظرفیت لوله ${maxSize} ${unit} در این فشار است.`);
    }
  };

  const activeOption = useMemo(() => PRESSURE_OPTIONS.find(p => p.id === pressure), [pressure]);

  return (
    <div className="space-y-5 page-enter">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={calculateSize} className="space-y-6">
          {/* Pressure Selection - Collapsible Bar */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase mr-1 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              فشار کار (PSI)
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPressureMenuOpen(!isPressureMenuOpen)}
                className={`
                  w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-300 group
                  ${isPressureMenuOpen ? 'bg-white border-blue-200 shadow-lg' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-xl shadow-md">
                    <Gauge className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold leading-none mb-1">فشار انتخاب شده</span>
                    <span className="text-sm font-black text-slate-900">
                      {activeOption?.label}
                    </span>
                  </div>
                </div>
                {isPressureMenuOpen ? (
                  <ChevronUp className="w-5 h-5 text-blue-600 transition-transform" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 transition-transform group-hover:text-blue-600" />
                )}
              </button>

              <AnimatePresence>
                {isPressureMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 5, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 z-[60] bg-white border border-slate-100 rounded-3xl shadow-2xl p-2 grid grid-cols-1 gap-1"
                  >
                    {PRESSURE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setPressure(opt.id as WorkPressure);
                          setIsPressureMenuOpen(false);
                          setResult(null);
                          setError(null);
                        }}
                        className={`
                          flex items-center justify-between px-4 py-3.5 rounded-xl transition-all
                          ${pressure === opt.id 
                            ? 'bg-blue-600 text-white shadow-lg' 
                            : 'text-slate-600 hover:bg-slate-50'}
                        `}
                      >
                        <span className="font-bold text-sm">{opt.label}</span>
                        {pressure === opt.id && <Zap className="w-4 h-4 fill-white" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase mr-1 flex items-center gap-2">
                <Ruler className="w-3 h-3" />
                حداکثر طول مسیر (m)
              </label>
              <div className="relative">
                <input
                  type="number" step="0.1" inputMode="decimal" value={length} onChange={(e) => setLength(e.target.value)}
                  className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 focus:border-blue-500 focus:bg-white transition-all outline-none font-bold ltr"
                  placeholder="مثال: 15"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase mr-1 flex items-center gap-2">
                <Droplets className="w-3 h-3" />
                میزان مصرف (m³/hr)
              </label>
              <div className="flex gap-2">
                <input
                  type="number" step="0.01" inputMode="decimal" value={flow} onChange={(e) => setFlow(e.target.value)}
                  className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-200 focus:border-blue-500 focus:bg-white transition-all outline-none font-bold ltr"
                  placeholder="مثال: 4.5"
                />
                {pressure === '0.25' && (
                  <button
                    type="button"
                    onClick={() => setIsApplianceModalOpen(true)}
                    className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center group shrink-0"
                    title="ماشین حساب مصرف کننده‌ها"
                  >
                    <Calculator className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isApplianceModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsApplianceModalOpen(false)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
                >
                  <div className="bg-blue-600 p-6 text-white shrink-0">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                          <Calculator className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black leading-tight">انتخاب مصرف‌کننده‌ها</h3>
                      </div>
                      <button 
                        onClick={() => setIsApplianceModalOpen(false)}
                        className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-4 flex items-baseline justify-between transition-all">
                       <span className="text-xs font-bold opacity-80">جمع کل مصرف:</span>
                       <div className="flex items-baseline gap-1">
                         <motion.span 
                           key={totalApplianceFlow}
                           initial={{ opacity: 0, y: -10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="text-2xl font-black font-mono ltr"
                         >
                           {totalApplianceFlow.toFixed(1)}
                         </motion.span>
                         <span className="text-[10px] font-bold opacity-60">m³/hr</span>
                       </div>
                    </div>
                  </div>

                  <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-2">
                    {APPLIANCES.map((app) => (
                      <div 
                        key={app.id} 
                        className={`
                          flex items-center justify-between p-3 rounded-2xl border transition-all
                          ${selectedCounts[app.id] ? 'bg-blue-50 border-blue-100 shadow-sm' : 'bg-slate-50 border-slate-50'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl transition-colors ${selectedCounts[app.id] ? 'bg-blue-600 text-white' : 'bg-white text-slate-300 border border-slate-100'}`}>
                            <ApplianceIcon name={app.icon} className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-black block text-slate-700">{app.label}</span>
                            <span className="text-[10px] text-slate-400 font-bold ltr block" dir="ltr">{app.consumption} m³/hr</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCount(app.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:border-rose-200 hover:text-rose-500 transition-colors shadow-sm active:scale-90"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className={`${(selectedCounts[app.id] || 0) > 0 ? 'text-blue-600' : 'text-slate-400'} w-6 text-center font-black text-sm font-mono`}>
                            {selectedCounts[app.id] || 0}
                          </span>
                          <button
                            onClick={() => updateCount(app.id, 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:border-blue-200 hover:text-blue-600 transition-colors shadow-sm active:scale-90"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                    <button
                      onClick={applyAppliances}
                      disabled={totalApplianceFlow === 0}
                      className={`
                        w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2
                        ${totalApplianceFlow > 0 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                      `}
                    >
                      <Check className="w-4 h-4" />
                      تایید و اعمال
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="w-full bg-blue-600 active:scale-95 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 text-lg"
          >
            محاسبه سایز لوله
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-6 rounded-2xl flex items-center gap-4 text-center">
          <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}

      {result ? (
        <div className="bg-slate-900 text-white rounded-3xl p-7 relative overflow-hidden shadow-xl animate-in fade-in duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest block">سایز لوله استاندارد</span>
              <span className={`text-[8px] px-2 py-0.5 rounded-md font-black tracking-tighter ${pressure.includes('PE') ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-400'}`}>
                {pressure.includes('PE') ? 'POLYETHYLENE' : 'STEEL'}
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-7xl font-black font-mono tracking-tighter ltr" dir="ltr">{result.size}</span>
              <span className="text-2xl font-bold opacity-40 italic">
                {result.size.endsWith('mm') ? 'mm' : 'Inch'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/10">
              <div>
                <span className="text-slate-500 text-[10px] font-bold block mb-1">حداکثر طول</span>
                <span className="text-lg font-black">{result.lengthUsed} <span className="text-[10px] font-normal opacity-50">متر</span></span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] font-bold block mb-1">حداکثر ظرفیت</span>
                <span className="text-lg font-black ltr" dir="ltr">{result.actualCapacity} <span className="text-[10px] font-normal opacity-50 italic">m³/h</span></span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        !error && (
          <div className="border-2 border-dashed border-slate-200 rounded-3xl bg-white/50 flex flex-col items-center justify-center p-10 text-center">
            <Zap className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-slate-400 font-bold text-sm">منتظر ورود اطلاعات برای محاسبه...</p>
          </div>
        )
      )}

      {/* Full Pipe Sizing Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <TableProperties className="w-4 h-4" />
            جدول ظرفیت لوله‌ها ({activeOption?.label})
          </h3>
          <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black">
            {activeOption?.tableCode !== 'نامشخص' ? `جدول ${activeOption?.tableCode}` : 'در حال تکمیل...'}
          </span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          {currentTable ? (
            <table className="w-full text-right text-[10px]">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr className="ltr">
                  <th className="p-3 text-slate-400 font-black whitespace-nowrap">طول (m)</th>
                  {(activeOption?.sizes || PIPE_SIZES).map(size => (
                    <th key={size} className="p-3 text-slate-400 font-black text-center whitespace-nowrap">
                      {size}{size.endsWith('mm') ? '' : '"'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                {currentTable.map((row) => (
                  <tr 
                    key={row.length} 
                    className={`
                      transition-colors ltr
                      ${result?.lengthUsed === row.length ? 'bg-blue-50/50' : 'hover:bg-slate-50/30'}
                    `}
                  >
                    <td className="p-3 text-slate-500 font-black">{row.length}</td>
                    {row.capacities.map((cap, idx) => (
                      <td 
                        key={idx} 
                        className={`
                          p-3 text-center transition-all
                          ${result?.size === (activeOption?.sizes || PIPE_SIZES)[idx] && result?.lengthUsed === row.length 
                            ? 'bg-blue-600 text-white shadow-inner transform scale-110 rounded-sm' 
                            : cap === 0 ? 'text-slate-200' : 'text-slate-600'}
                        `}
                      >
                        {cap > 0 ? cap : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-center">
              <TableProperties className="w-8 h-8 mb-3 opacity-20" />
              <p className="text-xs font-bold font-sans">جدول مربوط به این فشار هنوز اضافه نشده است.</p>
            </div>
          )}
        </div>
        
        {pressure.includes('PE') && (
          <div className="p-4 bg-blue-50/30 border-t border-blue-100/50 flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <AlertCircle className="w-3 h-3 text-white" />
            </div>
            <p className="text-[10px] text-blue-700 font-black">
              * حداکثر افت فشار <span className="text-blue-900 underline decoration-blue-300">۱۰ درصد</span> و بیشینه سرعت گاز <span className="text-blue-900 underline decoration-blue-300">۲۰ متر بر ثانیه</span> در محاسبات منظور شده است.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

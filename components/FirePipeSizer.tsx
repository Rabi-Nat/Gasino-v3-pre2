
import React, { useState } from 'react';
import { Activity, Ruler, Info, Calculator, CheckCircle2, HelpCircle } from 'lucide-react';
import { HazardInfoModal } from './HazardInfoModal';

// NFPA 13 Table limits depend heavily on Hazard Class
const LIGHT_HAZARD_SCHEDULE = [
  { size: '1"', maxSprinklers: 2, flowGPM: 26 },       // e.g. 2 x ~13 GPM per sprinkler
  { size: '1 1/4"', maxSprinklers: 3, flowGPM: 39 },   // e.g. 3 x ~13 GPM
  { size: '1 1/2"', maxSprinklers: 5, flowGPM: 65 },   // e.g. 5 x ~13 GPM
  { size: '2"', maxSprinklers: 10, flowGPM: 130 },
  { size: '2 1/2"', maxSprinklers: 30, flowGPM: 390 }, // allows up to 30 sprinklers
  { size: '3"', maxSprinklers: 60, flowGPM: 780 },
  { size: '4"', maxSprinklers: 100, flowGPM: 1300 },
  { size: '6"', maxSprinklers: 275, flowGPM: 3575 },
];

const ORDINARY_HAZARD_SCHEDULE = [
  { size: '1"', maxSprinklers: 2, flowGPM: 40 },       // e.g. 2 x ~20 GPM (assuming ~0.15 gpm/ft2)
  { size: '1 1/4"', maxSprinklers: 3, flowGPM: 60 },   // e.g. 3 x ~20 GPM
  { size: '1 1/2"', maxSprinklers: 5, flowGPM: 100 },  // e.g. 5 x ~20 GPM
  { size: '2"', maxSprinklers: 10, flowGPM: 200 },
  { size: '2 1/2"', maxSprinklers: 20, flowGPM: 400 }, // limited to 20 sprinklers (much tighter than light hazard!)
  { size: '3"', maxSprinklers: 40, flowGPM: 800 },     // limited to 40 sprinklers (vs 60 in light)
  { size: '4"', maxSprinklers: 115, flowGPM: 2300 },
  { size: '6"', maxSprinklers: 275, flowGPM: 5500 },
];

export const FirePipeSizer: React.FC = () => {
  const [method, setMethod] = useState<'sprinkler' | 'flow'>('sprinkler');
  const [hazardClass, setHazardClass] = useState<'light' | 'ordinary'>('light');
  const [inputVal, setInputVal] = useState('8');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const val = parseInt(inputVal) || 0;
  
  const activeSchedule = hazardClass === 'light' ? LIGHT_HAZARD_SCHEDULE : ORDINARY_HAZARD_SCHEDULE;

  const result = method === 'sprinkler' 
    ? activeSchedule.find(p => p.maxSprinklers >= val) || activeSchedule[activeSchedule.length-1]
    : activeSchedule.find(p => p.flowGPM >= val) || activeSchedule[activeSchedule.length-1];

  // Calculate dynamic flow estimator for display:
  // Light: ~13 GPM per sprinkler (0.10GPM/ft2 * 130ft2)
  // Ordinary: ~20 GPM per sprinkler (0.15GPM/ft2 * 130ft2)
  const flowPerSprinkler = hazardClass === 'light' ? 13 : 20;
  const estimatedGpm = val * flowPerSprinkler;

  return (
    <div className="max-w-4xl mx-auto space-y-8 page-enter">
      <HazardInfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-10">
          <div className="bg-rose-100 p-3 rounded-2xl">
            <Activity className="text-rose-600 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">سایزینگ لوله‌های اطفا حریق</h2>
            <p className="text-slate-400 text-xs font-bold mt-1">تخمین سایز لوله بر اساس متد Pipe Schedule استاندارد NFPA 13</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
               <label className="text-[11px] font-black text-slate-400 uppercase mr-1">روش محاسبه</label>
               <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                  <button 
                    onClick={() => { setMethod('sprinkler'); setInputVal('8'); }}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${method === 'sprinkler' ? 'bg-white text-rose-600 shadow-sm border border-rose-100' : 'text-slate-400 hover:text-slate-600'}`}
                  >تعداد اسپرینکلر</button>
                  <button 
                    onClick={() => { setMethod('flow'); setInputVal('150'); }}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${method === 'flow' ? 'bg-white text-rose-600 shadow-sm border border-rose-100' : 'text-slate-400 hover:text-slate-600'}`}
                  >دبی عبوری (GPM)</button>
               </div>
            </div>

            {/* Interactive Hazard Selector for Pipe Sizing */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase mr-1">کلاس خطر فضا (Hazard Class)</label>
              <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                <button 
                  onClick={() => setHazardClass('light')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${hazardClass === 'light' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'text-slate-400 hover:text-slate-600'}`}
                > کم‌خطر (Light Hazard)</button>
                <button 
                  onClick={() => setHazardClass('ordinary')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${hazardClass === 'ordinary' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'text-slate-400 hover:text-slate-600'}`}
                >محیط معمولی (Ordinary)</button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase mr-1">
                {method === 'sprinkler' ? 'تعداد کل سری اسپرینکلرها' : 'حداکثر دبی عبوری (GPM)'}
              </label>
              <input 
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 focus:border-rose-500 outline-none font-black text-lg ltr"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
               <h4 className="text-[10px] font-black text-slate-400 uppercase">پیش‌فرض‌های طراحی فعال:</h4>
               <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
                    استاندارد NFPA 13 (Pipe Schedule Steel Table)
                  </li>
                  <li className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
                      {hazardClass === 'light' ? 'کم‌خطر (Light Hazard)' : 'خطر معمولی (Ordinary Hazard)'}
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="text-rose-600 hover:text-rose-700 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </li>
               </ul>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="bg-slate-900 rounded-[32px] p-8 text-white flex-1 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              
              <div className="relative z-10 text-right">
                <span className="text-rose-400 text-[10px] font-black uppercase tracking-widest block mb-6 text-right">سایز پیشنهادی لوله</span>
                <div className="flex items-baseline justify-end gap-2.5 whitespace-nowrap" dir="ltr">
                  <span className="text-5xl sm:text-6xl font-black font-mono tracking-tighter text-rose-50 shadow-rose-900/20">{result.size}</span>
                  <span className="text-xl font-bold opacity-40 italic">Inch</span>
                </div>
              </div>

              {method === 'sprinkler' && (
                <div className="text-right bg-white/5 p-3 rounded-2xl border border-white/5 my-4 space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-black text-slate-300">
                    <span>دبی تقریبی هر نازل:</span>
                    <span className="font-mono text-rose-400">{flowPerSprinkler} GPM</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-black text-slate-300">
                    <span>جمع کل دبی تخمینی ({val} اسپرینکلر):</span>
                    <span className="font-mono text-rose-400">{estimatedGpm} GPM</span>
                  </div>
                </div>
              )}

              <div className="relative z-10 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                   <span>حداکثر ظرفیت این لوله:</span>
                   <span className="text-white font-mono uppercase bg-white/10 px-3 py-1 rounded-lg text-xs ltr">
                      {method === 'sprinkler' ? `${result.maxSprinklers} Heads` : `${result.flowGPM} GPM`}
                   </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

       <div className="bg-slate-100 border border-slate-200 rounded-3xl p-6 flex flex-row-reverse gap-4 text-right">
        <div className="bg-slate-200 p-2 rounded-xl h-fit">
          <Info className="w-5 h-5 text-slate-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-slate-900 font-black text-sm mb-1 text-right">نکته اجرایی</h4>
          <p className="text-slate-600/70 text-xs leading-relaxed font-bold text-right" dir="rtl">
            طبق ضوابط استانداردهای اطفای حریق (از جمله NFPA 14)، برای سیستم‌های رایزر خشک و تروخشک مشترک (سیستم‌های کلاس I و III)، حداقل قطر لوله رایزرها (Risers) نباید کمتر از ۴ اینچ در نظر گرفته شود. همچنین برای لوله‌های انتهایی متصل به اسپرینکلرها سایز پایینی همچون ۱ اینچ استفاده می‌شود.
          </p>
        </div>
      </div>
    </div>
  );
};

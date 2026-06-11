
import React, { useState } from 'react';
import { Zap, Ruler, Gauge, Info, Calculator, Droplet } from 'lucide-react';
import { motion } from 'motion/react';

export const FirePumpHead: React.FC = () => {
  const [height, setHeight] = useState('15'); // Height in meters
  const [pipeLength, setPipeLength] = useState('30'); // Distance to farthest outlet
  const [requiredStatic, setRequiredStatic] = useState('4.5'); // bar (approx 65 PSI)
  
  const heightVal = parseFloat(height) || 0;
  const lengthVal = parseFloat(pipeLength) || 0;
  const targetBar = parseFloat(requiredStatic) || 0;

  // 1 bar = 10.2m approx
  // Static Head = Height
  // Friction Losses estimate: 0.1 bar per 10m of pipe approx (1%)
  const frictionLoss = lengthVal * 0.015; // 1.5% loss factor as safety
  const totalHeadMeters = (heightVal + (targetBar * 10.2) + (frictionLoss * 10.2));
  const totalBar = totalHeadMeters / 10.2;

  return (
    <div className="max-w-4xl mx-auto space-y-8 page-enter">
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-10">
          <div className="bg-amber-100 p-3 rounded-2xl">
            <Zap className="text-amber-600 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">محاسبه هد (فشار) پمپ آتش‌نشانی</h2>
            <p className="text-slate-400 text-xs font-bold mt-1">تخمین فشار مورد نیاز بوستر پمپ بر اساس هد استاتیک و افت فشار</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase mr-1">ارتفاع عمودی بالاترین خروجی (m)</label>
              <div className="relative">
                <input 
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 focus:border-amber-500 outline-none font-bold ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase mr-1">طول طویل‌ترین مسیر لوله‌کشی (m)</label>
              <div className="relative">
                <input 
                  type="number"
                  value={pipeLength}
                  onChange={(e) => setPipeLength(e.target.value)}
                  className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 focus:border-amber-500 outline-none font-bold ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase mr-1 text-right block">فشار باقیمانده هدف (Bar)</label>
              <div className="grid grid-cols-2 gap-2">
                 <button onClick={() => setRequiredStatic('4.5')} className={`p-3 rounded-xl border text-xs font-bold ${targetBar === 4.5 ? 'bg-amber-600 text-white border-amber-600 shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>هیدرانت (4.5 Bar)</button>
                 <button onClick={() => setRequiredStatic('1.5')} className={`p-3 rounded-xl border text-xs font-bold ${targetBar === 1.5 ? 'bg-amber-600 text-white border-amber-600 shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>اسپرینکلر (1.5 Bar)</button>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="bg-slate-900 rounded-[32px] p-8 text-white flex-1 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                   <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest block mb-4">فشار نهایی پمپ (Head)</span>
                   <div className="flex items-baseline gap-3">
                      <span className="text-7xl font-black font-mono tracking-tighter ltr">{totalBar.toFixed(1)}</span>
                      <span className="text-2xl font-bold opacity-40 italic uppercase">Bar</span>
                   </div>
                   <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-bold opacity-60 font-mono ltr">{totalHeadMeters.toFixed(0)}</span>
                      <span className="text-[10px] opacity-40 font-black">Meters (Head)</span>
                   </div>
                </div>

                <div className="pt-8 border-t border-white/10 space-y-3">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                      <span>فشار استاتیک:</span>
                      <span className="ltr">{(heightVal / 10.2).toFixed(1)} Bar</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                      <span>افت اصطکاک تقریبی:</span>
                      <span className="ltr">{frictionLoss.toFixed(1)} Bar</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                      <span>فشار مورد نیاز نازل:</span>
                      <span className="ltr">{targetBar} Bar</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

       <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4">
        <div className="bg-amber-600/20 p-2 rounded-xl h-fit">
          <Info className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h4 className="text-amber-900 font-black text-sm mb-1">راهنمای محاسباتی</h4>
          <p className="text-amber-700/70 text-xs leading-relaxed font-bold">
             این محاسبه بر اساس تقریب خطی افت فشار در لوله‌های گالوانیزه/فولادی انجام شده است. برای محاسبات دقیق نهایی (Hydraulic Calculation) باید از نرم‌افزارهای تخصصی با لحاظ کردن کلیه زانوها و اتصالات استفاده مقتضی به عمل آید.
          </p>
        </div>
      </div>
    </div>
  );
};

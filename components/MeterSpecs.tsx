
import React, { useState } from 'react';
import { Info, HelpCircle, Activity, Ruler, CheckCircle2 } from 'lucide-react';

interface MeterData {
  type: string;
  maxArea: number;
  maxFlow: number;
  maxUnits: number;
  replacementLength: string;
  replacementDiameter: string;
  connectorSize: string;
}

const METER_DATA: MeterData[] = [
  { type: 'G2.5', maxArea: 60, maxFlow: 4, maxUnits: 1, replacementLength: '25-30', replacementDiameter: '1', connectorSize: '1' },
  { type: 'G4', maxArea: 150, maxFlow: 6, maxUnits: 1, replacementLength: '25-30', replacementDiameter: '1', connectorSize: '1' },
  { type: 'G6', maxArea: 450, maxFlow: 10, maxUnits: 3, replacementLength: '25-30', replacementDiameter: '1', connectorSize: '1' },
  { type: 'G10', maxArea: 750, maxFlow: 16, maxUnits: 5, replacementLength: '35-40', replacementDiameter: '1 1/2', connectorSize: '1' },
  { type: 'G16', maxArea: 1100, maxFlow: 25, maxUnits: 7, replacementLength: '35-40', replacementDiameter: '1 1/2', connectorSize: '1 1/2' },
  { type: 'G25', maxArea: 1800, maxFlow: 40, maxUnits: 12, replacementLength: '82', replacementDiameter: '2', connectorSize: '1 1/2' },
  { type: 'G40', maxArea: 3000, maxFlow: 65, maxUnits: 20, replacementLength: '120-150', replacementDiameter: '2', connectorSize: '1 1/2' },
  { type: 'G65', maxArea: 4500, maxFlow: 100, maxUnits: 30, replacementLength: '120-150', replacementDiameter: '2', connectorSize: '1 1/2' },
];

export const MeterSpecs: React.FC = () => {
  const [totalFlow, setTotalFlow] = useState<string>('5');
  const [thermalArea, setThermalArea] = useState<string>('120');

  const flowVal = parseFloat(totalFlow) || 0;
  const areaVal = parseFloat(thermalArea) || 0;

  // Recommended meter is the first one where both maxFlow and maxArea are sufficient
  const recommendedMeter = METER_DATA.find(
    (row) => row.maxFlow >= flowVal && row.maxArea >= areaVal
  ) || METER_DATA[METER_DATA.length - 1]; // fallback to biggest meter

  return (
    <div className="space-y-6 max-w-4xl mx-auto page-enter text-right" dir="rtl">
      
      {/* Dynamic Selector Panel */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden">
        
        {/* Input Controls */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-800 mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-blue-600 rounded-full inline-block"></span>
            ورودی‌های طراحی کنتور
          </h3>

          {/* Input 1: Total Flow */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-black text-slate-400 uppercase">مجموع مصرف کل (m³/h)</label>
              <span className="text-[10px] text-slate-400 font-bold">حداکثر ظرفیت مصرفی</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                value={totalFlow}
                onChange={(e) => setTotalFlow(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-right font-mono font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="4"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none text-slate-400">
                <span className="text-[10px] font-bold">m³/h</span>
                <Activity className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Input 2: Thermal Area */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-black text-slate-400 uppercase">زیربنای حرارتی ساختمان (m²)</label>
              <span className="text-[10px] text-slate-400 font-bold">مجموع مساحت تحت گرمایش</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={thermalArea}
                onChange={(e) => setThermalArea(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-right font-mono font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="150"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none text-slate-400">
                <span className="text-[10px] font-bold">m²</span>
                <Ruler className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Result Display Card */}
        <div className="bg-slate-900 rounded-[32px] p-6 lg:p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600/10 rounded-full -ml-16 -mt-16 blur-2xl pointer-events-none" />
          
          <div className="relative z-10 text-right space-y-1">
            <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest block mb-1">کنتور پیشنهادی سیستم</span>
            <div className="flex items-baseline justify-end gap-2 whitespace-nowrap" dir="ltr">
              <span className="text-5xl lg:text-6xl font-black font-mono tracking-tighter text-blue-50">
                {recommendedMeter.type}
              </span>
              <span className="text-lg font-bold opacity-40 italic">Gas Meter</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed pt-2">
              بر اساس مصرف <span className="font-mono text-white text-xs">{flowVal} m³/h</span> و زیربنای حرارتی <span className="font-mono text-white text-xs">{areaVal} m²</span>، کنتور استاندارد فوق پیشنهاد می‌گردد.
            </p>
          </div>

          <div className="relative z-10 pt-4 border-t border-white/5 space-y-2 mt-4 text-[11px] lg:text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span className="font-bold">سایز اسمی اتصال شیر:</span>
              <span className="font-mono text-white font-black">{recommendedMeter.replacementDiameter} اینچ</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span className="font-bold">فاصله مهره تا مهره (برآمدگی):</span>
              <span className="font-mono text-white font-black">{recommendedMeter.replacementLength} cm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
          <span className="text-xs font-black text-slate-500">جدول تعیین و محاسبه ظرفیت کنتور گاز شهری</span>
          <span className="text-[10px] text-emerald-600 font-black flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg">
             <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
             ردیف سبز نشان‌دهنده کنتور انتخابی است
          </span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs lg:text-sm text-right">
            <thead className="bg-slate-50/80 border-b border-slate-150">
              <tr>
                <th className="px-4 py-4 lg:px-6 font-black text-slate-400 text-[9px] uppercase tracking-wider">مدل</th>
                <th className="px-3 py-4 font-black text-slate-400 text-[9px] uppercase tracking-wider text-center">زیربنا (m²)</th>
                <th className="px-3 py-4 font-black text-slate-400 text-[9px] uppercase tracking-wider text-center">ظرفیت (m³/h)</th>
                <th className="px-3 py-4 font-black text-slate-400 text-[9px] uppercase tracking-wider text-center">حداکثر واحدها</th>
                <th className="px-3 py-4 font-black text-slate-400 text-[9px] uppercase tracking-wider text-center">ابعاد مهره (cm)</th>
                <th className="px-3 py-4 font-black text-slate-400 text-[9px] uppercase tracking-wider text-center">قطر اتصال (in)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {METER_DATA.map((row) => {
                const isSelected = row.type === recommendedMeter.type;
                return (
                  <tr 
                    key={row.type} 
                    className={`group transition-all duration-300 relative ${
                      isSelected 
                        ? 'bg-emerald-50/60 hover:bg-emerald-50 border-y-2 border-emerald-500/35 font-bold shadow-sm' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-3.5 lg:px-6">
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center font-black text-[10px] lg:text-xs transition-colors ${
                           isSelected 
                             ? 'bg-emerald-500 text-white shadow-sm' 
                             : 'bg-slate-100 text-slate-600'
                         }`}>
                            {row.type}
                         </div>
                         <div className="flex flex-col">
                           <span className={`font-black ${isSelected ? 'text-emerald-950' : 'text-slate-700'}`}>
                             کنتور {row.type}
                           </span>
                           {isSelected && (
                             <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5" dir="rtl">
                               <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                               انتخاب بهینه
                             </span>
                           )}
                         </div>
                      </div>
                    </td>
                    <td className={`px-3 py-3.5 text-center ${isSelected ? 'text-emerald-950' : 'text-slate-500'}`}>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>تا {row.maxArea}</span>
                    </td>
                    <td className={`px-3 py-3.5 text-center font-mono font-black ${isSelected ? 'text-emerald-600' : 'text-slate-600'}`}>
                      {row.maxFlow}
                    </td>
                    <td className={`px-3 py-3.5 text-center font-bold ${isSelected ? 'text-emerald-950' : 'text-slate-500'}`}>
                      {row.maxUnits} واحد
                    </td>
                    <td className="px-3 py-3.5 text-center font-mono text-slate-500 text-[11px] lg:text-xs">
                      {row.replacementLength}
                    </td>
                    <td className={`px-3 py-3.5 text-center font-black ltr`} dir="ltr">
                      {row.replacementDiameter}"
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 p-4 lg:p-5 rounded-2xl flex items-start gap-3 shadow-sm shadow-emerald-50">
        <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-[11px] lg:text-xs font-medium text-emerald-900 leading-relaxed">
          <strong className="block mb-0.5">نکته تخصصی:</strong>
          برای واحدهای تجاری یا مجتمع‌های عمومی، ظرفیت کنتور گاز عمدتاً بر اساس حاصل‌جمع "مصرف کل وسایل گازسوز" تعیین می‌گردد. همچنین برای اهداف مسکونی، متراژ زیربنای حرارتی یکی از معیارهای اصلی کنترل ظرفیت نامی است.
        </div>
      </div>
    </div>
  );
};


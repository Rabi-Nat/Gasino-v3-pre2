
import React, { useState } from 'react';
import { Wind, ArrowRight, AlertCircle, CheckCircle2, Maximize2, Ruler, BoxSelect, Circle, Square, Info } from 'lucide-react';

interface VentilationResult {
  volume: number;
  kcal: number;
  thresholdVolume: number;
  canUseOneVent: boolean;
  oneVentAreaMm2: number;
  twoVentAreaMm2: number;
  oneVentRoundInch: number;
  oneVentSquareCm: number;
  twoVentRoundInch: number;
  twoVentSquareCm: number;
}

export const Ventilation: React.FC = () => {
  const [consumption, setConsumption] = useState<string>('');
  const [area, setArea] = useState<string>('');
  const [height, setHeight] = useState<string>('3.0');
  const [result, setResult] = useState<VentilationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateVentDimensions = (areaMm2: number) => {
    const diameterMm = 2 * Math.sqrt(areaMm2 / Math.PI);
    const diameterInch = Math.ceil(diameterMm / 25.4);
    const sideMm = Math.sqrt(areaMm2);
    const sideCm = sideMm / 10;
    const finalSideCm = Math.max(Math.ceil(sideCm), 8);
    return { diameterInch, finalSideCm };
  };

  const calculateVentilation = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const consVal = parseFloat(consumption);
    const areaVal = parseFloat(area);
    const heightVal = parseFloat(height);

    if (isNaN(consVal) || consVal <= 0 || isNaN(areaVal) || areaVal <= 0 || isNaN(heightVal) || heightVal <= 0) {
      setError('لطفاً تمام مقادیر فنی را به صورت صحیح وارد کنید.');
      return;
    }

    const kcal = consVal * 10000;
    const volume = areaVal * heightVal;
    const thresholdVolume = kcal / 178;
    const canUseOneVent = volume > thresholdVolume;
    const oneVentAreaMm2 = (kcal / 117) * 100;
    const twoVentAreaMm2 = (kcal / 156) * 100;

    const oneVentDims = calculateVentDimensions(oneVentAreaMm2);
    const twoVentDims = calculateVentDimensions(twoVentAreaMm2);

    setResult({
      volume, kcal, thresholdVolume, canUseOneVent, oneVentAreaMm2, twoVentAreaMm2,
      oneVentRoundInch: oneVentDims.diameterInch,
      oneVentSquareCm: oneVentDims.finalSideCm,
      twoVentRoundInch: twoVentDims.diameterInch,
      twoVentSquareCm: twoVentDims.finalSideCm
    });
  };

  const renderDimensions = (roundInch: number, squareCm: number, colorClass: string) => (
    <div className="grid grid-cols-2 gap-3 mt-4">
      <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
        <Circle className={`w-5 h-5 ${colorClass}`} />
        <div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">قطردریچه ی گرد</div>
          <div className="text-lg font-black ltr" dir="ltr">{roundInch}" <span className="text-[10px] font-normal opacity-50">in</span></div>
        </div>
      </div>
      <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
        <Square className={`w-5 h-5 ${colorClass}`} />
        <div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ضلع دریچه مربع</div>
          <div className="text-lg font-black ltr" dir="ltr">{squareCm} <span className="text-[10px] font-normal opacity-50">cm</span></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      
      {/* Inputs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-sm">
        <form onSubmit={calculateVentilation} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block mr-1">مجموع مصرف کل (m³/hr)</label>
              <div className="relative">
                <Wind className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input
                  type="number" step="0.01" value={consumption} onChange={(e) => setConsumption(e.target.value)}
                  className="w-full bg-slate-50 pr-12 pl-4 py-3.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:bg-white transition-all outline-none font-bold ltr"
                  placeholder="2.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block mr-1">مساحت فضا (m²)</label>
                <div className="relative">
                  <Maximize2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input
                    type="number" step="0.1" value={area} onChange={(e) => setArea(e.target.value)}
                    className="w-full bg-slate-50 pr-12 pl-4 py-3.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:bg-white transition-all outline-none font-bold ltr"
                    placeholder="15"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block mr-1">ارتفاع (m)</label>
                <div className="relative">
                  <Ruler className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input
                    type="number" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)}
                    className="w-full bg-slate-50 pr-12 pl-4 py-3.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:bg-white transition-all outline-none font-bold ltr"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-amber-200 flex items-center justify-center gap-2 text-lg"
          >
            تحلیل وضعیت
          </button>
        </form>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {!result && !error && (
          <div className="h-full min-h-[300px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
             <BoxSelect className="w-12 h-12 text-slate-200 mb-4" />
             <p className="text-slate-400 font-bold">برای شروع تحلیل، ابعاد فضا را وارد کنید.</p>
          </div>
        )}

        {error && (
           <div className="bg-rose-50 border border-rose-100 text-rose-700 p-6 rounded-2xl flex items-center gap-4">
              <AlertCircle className="w-8 h-8 shrink-0" />
              <p className="font-bold text-sm">{error}</p>
           </div>
        )}

        {result && (
          <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
             
             <div className={`p-6 rounded-3xl border flex items-start gap-4 ${result.canUseOneVent ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-orange-50 border-orange-100 text-orange-900'}`}>
                <div className={`p-3 rounded-xl ${result.canUseOneVent ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                  {result.canUseOneVent ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                </div>
                <div>
                   <h4 className="font-black mb-1">{result.canUseOneVent ? 'تأمین هوا از محیط مجاز است' : 'الزام به تأمین هوا از فضای آزاد'}</h4>
                   <p className="text-xs font-medium opacity-80 leading-relaxed">
                     حجم فضا ({result.volume.toFixed(1)}m³) {result.canUseOneVent ? 'بیشتر' : 'کمتر'} از حجم مبنا ({result.thresholdVolume.toFixed(1)}m³) است.
                   </p>
                </div>
             </div>

             <div className="grid gap-4">
                {result.canUseOneVent && (
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-br-xl uppercase tracking-widest">تک دریچه</div>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-slate-400 text-xs font-bold">مساحت خالص مورد نیاز:</span>
                       <div className="text-2xl font-black text-blue-600 ltr" dir="ltr">{Math.ceil(result.oneVentAreaMm2).toLocaleString()} <span className="text-xs font-normal opacity-50">mm²</span></div>
                    </div>
                    {renderDimensions(result.oneVentRoundInch, result.oneVentSquareCm, 'text-blue-500')}
                  </div>
                )}

                <div className={`rounded-3xl border p-6 shadow-sm relative overflow-hidden ${!result.canUseOneVent ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
                   <div className={`absolute top-0 left-0 text-white text-[9px] font-black px-3 py-1 rounded-br-xl uppercase tracking-widest ${!result.canUseOneVent ? 'bg-amber-600' : 'bg-slate-400'}`}>
                      {result.canUseOneVent ? 'دو دریچه' : 'دو دریچه (الزامی)'}
                   </div>
                   <div className="flex justify-between items-center mb-2">
                       <span className="text-slate-400 text-xs font-bold">مساحت هر دریچه:</span>
                       <div className="text-2xl font-black text-slate-800 ltr" dir="ltr">{Math.ceil(result.twoVentAreaMm2).toLocaleString()} <span className="text-xs font-normal opacity-50">mm²</span></div>
                   </div>
                   {renderDimensions(result.twoVentRoundInch, result.twoVentSquareCm, !result.canUseOneVent ? 'text-amber-600' : 'text-slate-400')}
                </div>
             </div>

             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                   محاسبات بر اساس ظرفیت حرارتی کل {result.kcal.toLocaleString()} kcal/hr و ضرایب استاندارد مبحث ۱۷ انجام شده است.
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

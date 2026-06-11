
import React, { useState } from 'react';
import { Shield, Map, Info, Plus, Minus, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { HazardInfoModal } from './HazardInfoModal';

const HAZARD_LEVELS = [
  { id: 'low', label: 'کم‌خطر (اداری، مسکونی)', coverage: 250, desc: 'حجم مواد سوختنی کم و پراکنده' },
  { id: 'medium', label: 'میان‌خطر (تجاری، پارکینگ)', coverage: 150, desc: 'تراکم معمول مواد سوختنی' },
  { id: 'high', label: 'پرخطر (صنعتی، کارگاه)', coverage: 100, desc: 'تراکم بالا یا مواد سریع‌الاشتعال' },
];

export const ExtinguisherCalc: React.FC = () => {
  const [area, setArea] = useState('100');
  const [hazard, setHazard] = useState('low');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const selectedHazard = HAZARD_LEVELS.find(h => h.id === hazard) || HAZARD_LEVELS[0];
  const areaVal = parseFloat(area) || 0;
  
  const count = Math.ceil(areaVal / selectedHazard.coverage);

  return (
    <div className="max-w-4xl mx-auto space-y-8 page-enter">
      <HazardInfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-10">
          <div className="bg-orange-100 p-3 rounded-2xl">
            <Shield className="text-orange-600 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">تعداد و توزیع کپسول‌های اطفاء</h2>
            <p className="text-slate-400 text-xs font-bold mt-1">تخمین تعداد مورد نیاز بر اساس مساحت و سطح مخاطره</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase mr-1 flex items-center gap-2">
                <Map className="w-3 h-3" />
                مساحت زیربنا (مترمربع)
              </label>
              <div className="relative">
                <input 
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 focus:border-orange-500 outline-none font-bold ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mr-1">
                <label className="text-[11px] font-black text-slate-400 uppercase">سطح مخاطره فضا</label>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="p-1 px-2.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors flex items-center gap-1.5"
                >
                  <span className="text-[9px] font-black uppercase tracking-tight">اطلاعات تکمیلی</span>
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2">
                {HAZARD_LEVELS.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setHazard(h.id)}
                    className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${hazard === h.id ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-500/10' : 'bg-slate-50 border-slate-50 opacity-60'}`}
                  >
                    <div className="text-right text-slate-700 font-bold">
                       <span className="block text-sm">{h.label}</span>
                       <span className="text-[10px] opacity-60">{h.desc}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${hazard === h.id ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300'}`}>
                      {hazard === h.id && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="bg-slate-900 rounded-[32px] p-8 text-white flex-1 relative overflow-hidden flex flex-col justify-center">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                 <Shield className="w-64 h-64 -rotate-12 absolute -right-20 -bottom-20" />
              </div>
              
              <div className="relative z-10 text-center">
                <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest block mb-4">تعداد کپسول مورد نیاز</span>
                <div className="flex items-center justify-center gap-4">
                   <span className="text-8xl font-black font-mono tracking-tighter">{count}</span>
                   <div className="text-right">
                      <span className="text-sm font-bold block leading-none">دستگاه</span>
                      <span className="text-[10px] opacity-40 font-black">حداقل الزامی</span>
                   </div>
                </div>

                <div className="mt-12 bg-white/5 rounded-2xl p-4 border border-white/5">
                   <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-3 h-3 text-orange-400" />
                      <span className="text-[10px] font-black text-orange-400 uppercase">پیشنهاد ترکیب:</span>
                   </div>
                   <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>۶ کیلویی پودر و گاز:</span>
                      <span className="font-mono text-white">{Math.ceil(count * 0.7)}</span>
                   </div>
                   <div className="flex justify-between text-xs font-bold text-slate-300 mt-2">
                      <span>۴ کیلویی CO2:</span>
                      <span className="font-mono text-white">{Math.max(1, Math.floor(count * 0.3))}</span>
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
          <h4 className="text-amber-900 font-black text-sm mb-1">فواصل دسترسی</h4>
          <p className="text-amber-700/70 text-xs leading-relaxed font-bold">
            حداکثر فاصله دسترسی برای کپسول‌های پودری نباید از ۲۳ متر و برای کپسول‌های CO2 از ۱۵ متر تجاوز کند. ارتفاع نصب کپسول‌های زیر ۱۸ کیلوگرم باید حداکثر ۱.۵ متر از کف باشد.
          </p>
        </div>
      </div>
    </div>
  );
};

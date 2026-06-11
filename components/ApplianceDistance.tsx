
import React from 'react';
import { Move, ShieldCheck } from 'lucide-react';

interface ApplianceData {
  device: string;
  distances: string[];
}

const APPLIANCE_DATA: ApplianceData[] = [
  { device: 'بخاری، آبگرمکن و پکیج زمینی', distances: ['۲۵cm از جوانب', '۱۰۰cm از بالا'] },
  { device: 'اجاق گاز خانگی (کابینتی)', distances: ['۲۵cm از جوانب', '۷۵cm از بالا'] },
  { device: 'بخاری دیواری', distances: ['۱۰۰cm از جوانب', '۱۰۰cm از بالا'] },
  { device: 'آبگرمکن و پکیج دیواری', distances: ['۴۵cm از جوانب', '۵۰cm از بالا', '۱۲۰cm از کف'] },
  { device: 'فر گازی', distances: ['۲۵cm از جوانب', '۲۵cm از بالا'] },
];

export const ApplianceDistance: React.FC = () => {
  return (
    <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
      {APPLIANCE_DATA.map((item, index) => (
        <div key={index} className="bg-white rounded-2xl border border-slate-200 p-4 lg:p-6 flex flex-col group hover:border-violet-300 transition-all duration-300 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-9 h-9 lg:w-11 lg:h-11 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all">
                <Move className="w-4 h-4 lg:w-5 lg:h-5" />
             </div>
             <h3 className="font-black text-slate-800 text-xs lg:text-sm leading-tight">{item.device}</h3>
          </div>
          
          <div className="space-y-2 mt-auto">
            {item.distances.map((dist, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50/70 rounded-xl group-hover:bg-violet-50/50 transition-colors">
                <span className="text-[10px] lg:text-xs font-bold text-slate-500">{dist.split(' ')[1]} {dist.split(' ')[2]}</span>
                <div className="flex items-center gap-1.5">
                   <span className="text-[11px] lg:text-xs font-black text-slate-800">{dist.split(' ')[0]}</span>
                   <ShieldCheck className="w-3 h-3 text-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};


import React from 'react';
import { Ruler, MapPin } from 'lucide-react';

interface ValveData {
  device: string;
  heightFromFloor: string;
  distanceFromDevice: string;
}

const VALVE_DATA: ValveData[] = [
  { device: 'آبگرمکن دیواری', heightFromFloor: '۱۲۰ الی ۱۵۰', distanceFromDevice: '۲۰ الی ۴۰' },
  { device: 'پکیج دیواری', heightFromFloor: '۱۲۰ الی ۱۵۰', distanceFromDevice: '۲۰ الی ۴۰' },
  { device: 'پکیج زمینی', heightFromFloor: '۳۰ الی ۴۰', distanceFromDevice: '۲۰ الی ۴۰' },
  { device: 'آبگرمکن زمینی', heightFromFloor: '۳۰ الی ۴۰', distanceFromDevice: '۲۰ الی ۴۰' },
  { device: 'اجاق گاز', heightFromFloor: '۹۰ الی ۱۱۰', distanceFromDevice: '۲۰ الی ۴۰' },
  { device: 'بخاری', heightFromFloor: '۳۰ الی ۴۰', distanceFromDevice: '۲۰ الی ۴۰' },
  { device: 'مشعل دیگ‌های حرارتی', heightFromFloor: '۶۰ الی ۳۰', distanceFromDevice: '۵۰ الی ۷۰' },
  { device: 'بخاری دیواری', heightFromFloor: '۱۱۰ الی ۱۲۰', distanceFromDevice: '۲۰ الی ۴۰' },
  { device: 'شومینه', heightFromFloor: '۳۰ الی ۴۰', distanceFromDevice: '۲۰ الی ۴۰' },
];

export const ValveInstallation: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs lg:text-sm text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3.5 lg:px-6 lg:py-4 font-black text-slate-400 text-[9px] uppercase tracking-wider">نوع دستگاه</th>
                <th className="px-3 py-3.5 lg:px-4 lg:py-4 font-black text-slate-400 text-[9px] uppercase tracking-wider text-center">ارتفاع کف (cm)</th>
                <th className="px-3 py-3.5 lg:px-4 lg:py-4 font-black text-slate-400 text-[9px] uppercase tracking-wider text-center">فاصله بدنه (cm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {VALVE_DATA.map((row, index) => (
                <tr key={index} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 lg:px-6 lg:py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-4 bg-rose-200 group-hover:bg-rose-500 rounded-full transition-colors"></div>
                      <span className="font-bold text-slate-700">{row.device}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 lg:px-4 lg:py-3.5 text-center">
                     <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg font-bold text-slate-600 group-hover:bg-rose-50 group-hover:text-rose-700 transition-colors text-[11px] lg:text-xs">
                        <Ruler className="w-3 h-3 opacity-40" />
                        {row.heightFromFloor}
                     </div>
                  </td>
                  <td className="px-3 py-2.5 lg:px-4 lg:py-3.5 text-center">
                     <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 rounded-lg font-bold text-slate-400 group-hover:text-slate-600 transition-colors text-[11px] lg:text-xs">
                        <MapPin className="w-3 h-3 opacity-40" />
                        {row.distanceFromDevice}
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
           مبحث ۱۷ مقررات ملی ساختمان - جدول ۱۷-۴-۲
        </div>
      </div>
    </div>
  );
};

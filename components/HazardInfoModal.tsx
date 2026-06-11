
import React from 'react';
import { X, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HazardInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HazardInfoModal: React.FC<HazardInfoModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white/20"
          >
            {/* Header */}
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/20 rounded-full -mr-16 -mt-16 blur-3xl" />
               <div className="relative z-10 flex items-center gap-4">
                  <div className="bg-rose-500 p-3 rounded-2xl">
                     <Info className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">راهنمای کلاس‌بندی مخاطره ساختمان</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Hazard Classifications Guide (NFPA 13)</p>
                  </div>
               </div>
               <button 
                 onClick={onClose}
                 className="relative z-10 p-2 hover:bg-white/10 rounded-full transition-colors"
               >
                 <X className="w-6 h-6" />
               </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto font-sans">
              {/* Light Hazard */}
              <div className="flex gap-6 items-start group">
                 <div className="bg-blue-50 p-4 rounded-3xl group-hover:bg-blue-100 transition-colors shrink-0">
                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                 </div>
                 <div>
                    <h4 className="text-lg font-black text-slate-800 mb-2">کم‌خطر (Light Hazard)</h4>
                    <p className="text-sm text-slate-500 font-bold leading-relaxed mb-3">
                      مکان‌هایی که تراکم و مقدار مواد سوختنی در آن‌ها پایین بوده و در صورت بروز آتش‌سوزی، حرارت تولیدی ناچیز است.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                       {['مسکونی', 'اداری', 'آموزشی', 'کتابخانه‌ها', 'موزه‌ها'].map(tag => (
                         <span key={tag} className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">{tag}</span>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Ordinary Hazard */}
              <div className="flex gap-6 items-start group">
                 <div className="bg-orange-50 p-4 rounded-3xl group-hover:bg-orange-100 transition-colors shrink-0">
                   <AlertTriangle className="w-8 h-8 text-orange-600" />
                 </div>
                 <div>
                    <h4 className="text-lg font-black text-slate-800 mb-2">میان‌خطر (Ordinary Hazard)</h4>
                    <p className="text-sm text-slate-500 font-bold leading-relaxed mb-3">
                      مکان‌هایی که مقدار و تراکم مواد سوختنی در حد متوسط بوده و احتمال گسترش آتش‌سوزی با سرعت نسبی وجود دارد.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                       {['پارکینگ‌ها', 'تجاری', 'رستوران‌ها', 'صنایع چوب', 'نانوایی'].map(tag => (
                         <span key={tag} className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-100">{tag}</span>
                       ))}
                    </div>
                 </div>
              </div>

              {/* High Hazard */}
              <div className="flex gap-6 items-start group">
                 <div className="bg-rose-50 p-4 rounded-3xl group-hover:bg-rose-100 transition-colors shrink-0">
                    <div className="w-8 h-8 flex items-center justify-center">
                       <span className="font-black text-rose-600 text-xl">!</span>
                    </div>
                 </div>
                 <div>
                    <h4 className="text-lg font-black text-slate-800 mb-2">پرخطر (Extra Hazard)</h4>
                    <p className="text-sm text-slate-500 font-bold leading-relaxed mb-3">
                      مکان‌هایی که دارای تراکم بالای مواد سوختنی، مایعات قابل اشتعال یا مواد سریع‌الاشتعال هستند.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                       {['پالایشگاه', 'آشیانه هواپیما', 'صنایع پلاستیک', 'چاپخانه'].map(tag => (
                         <span key={tag} className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">{tag}</span>
                       ))}
                    </div>
                 </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 flex justify-center border-t border-slate-100">
               <button 
                 onClick={onClose}
                 className="bg-slate-900 text-white font-black px-12 py-3.5 rounded-2xl hover:bg-slate-800 transition-all text-sm shadow-xl shadow-slate-900/20"
               >
                 متوجه شدم
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

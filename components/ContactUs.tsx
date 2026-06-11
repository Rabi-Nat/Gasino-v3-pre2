import React, { useState } from 'react';
import { Mail, MessageSquare, Heart, ExternalLink, Copy, Check, User, Phone, Send } from 'lucide-react';

export const ContactUs: React.FC = () => {
  const email = 'rabi.nateghi@gmail.com';
  const phoneNumber = '09123493590';
  const [copied, setCopied] = useState(false);

  const copyPhone = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      
      {/* Introduction Banner */}
      <div className="bg-white rounded-3xl premium-shadow border border-slate-200/60 p-5 lg:p-6 text-center relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
         
         <div className="relative z-10 max-w-2xl mx-auto">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-550/10 rounded-2xl flex items-center justify-center text-orange-500 mx-auto mb-3 shadow-inner border border-orange-100/50">
               <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2 font-sans">ارتباط با ما</h3>
            <p className="text-slate-500 font-bold leading-relaxed text-xs mb-1.5">
               این پلتفرم با هدف ساده‌سازی محاسبات مهندسی طراحی شده است. 
               هرگونه ایده یا گزارش خطا، گامی است به سوی کمال این ابزار.
            </p>
            <p className="text-slate-400 font-extrabold text-[10px] leading-relaxed">
               جهت هرگونه پیشنهادات، نظرات، تبلیغات و اسپانسری با تیم توسعه ما در ارتباط باشید.
            </p>
         </div>
      </div>

      {/* Telegram Channel Join Link (Small, before the names) */}
      <div className="flex justify-center max-w-4xl mx-auto px-4 md:px-0 mt-3">
        <a 
          href="https://t.me/mechanical_Facility" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#229ED9]/10 hover:bg-[#229ED9]/15 text-[#229ED9] border border-[#229ED9]/20 rounded-2xl text-xs font-black transition-all hover:scale-103 active:scale-97 cursor-pointer shadow-sm shadow-[#229ED9]/5"
          dir="rtl"
        >
          <svg className="w-4 h-4 text-[#229ED9] fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.74-3.32 3.68-1.5 4.44-1.76 4.94-1.77.11 0 .36.03.52.16.13.1.17.24.19.34.02.07.02.21.01.28z"/>
          </svg>
          <span>عضویت در کانال رسمی تلگرام گازینو</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-60 ml-0.5" />
        </a>
      </div>

      {/* Team & Contact Cards Container */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto px-4 md:px-0 mt-3">
          
          {/* Card 1: ربیع ناطقی */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm hover:shadow-md hover:border-orange-200/80 transition-all duration-300 flex flex-col justify-between text-right relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-24 h-24 bg-orange-50/30 rounded-full -ml-12 -mt-12 blur-2xl opacity-80 group-hover:bg-orange-50/50 transition-colors"></div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3 justify-end">
                <h4 className="font-black text-slate-800 text-base md:text-lg">ربیع ناطقی</h4>
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 font-black shrink-0 animate-none">
                  <User className="w-5 h-5" />
                </div>
              </div>

              <div className="border-t border-dashed border-slate-100 pt-3 space-y-2.5">
                <a 
                  href={`mailto:${email}`} 
                  className="flex items-center gap-2 group/link justify-end text-slate-600 hover:text-orange-500 transition-colors"
                >
                  <span className="font-mono text-xs font-bold leading-none" dir="ltr">{email}</span>
                  <Mail className="w-4 h-4 text-slate-400 group-hover/link:text-orange-500" />
                </a>

                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <button 
                    onClick={copyPhone}
                    className="p-1.5 bg-white hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center border border-slate-200/50"
                    title="کپی شماره"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-green-600 animate-pulse" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-black text-slate-700 leading-none" dir="ltr">{phoneNumber}</span>
                    <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">پشتیبانی:</span>
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <a 
                href={`mailto:${email}`}
                className="text-[10px] font-black text-orange-500 flex items-center gap-1 hover:gap-1.5 transition-all"
              >
                <span>ارسال ایمیل مستقیم</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Card 2: فرید سپهریان آذر */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm hover:shadow-md hover:border-blue-200/80 transition-all duration-300 flex flex-col justify-between text-right relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-24 h-24 bg-blue-50/30 rounded-full -ml-12 -mt-12 blur-2xl opacity-80 group-hover:bg-blue-50/50 transition-colors"></div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3 justify-end">
                <h4 className="font-black text-slate-800 text-base md:text-lg">فرید سپهریان آذر</h4>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 font-black shrink-0">
                  <User className="w-5 h-5" />
                </div>
              </div>

              <div className="border-t border-dashed border-slate-100 pt-3 space-y-2.5">
                <a 
                  href="mailto:Farid.sep@gmail.com" 
                  className="flex items-center gap-2 group/link justify-end text-slate-600 hover:text-blue-500 transition-colors"
                >
                  <span className="font-mono text-xs font-bold leading-none" dir="ltr">Farid.sep@gmail.com</span>
                  <Mail className="w-4 h-4 text-slate-400 group-hover/link:text-blue-500" />
                </a>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <a 
                href="mailto:Farid.sep@gmail.com"
                className="text-[10px] font-black text-blue-500 flex items-center gap-1 hover:gap-1.5 transition-all"
              >
                <span>ارسال ایمیل مستقیم</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Card 3: حامد ابراهیم نژاد */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm hover:shadow-md hover:border-violet-200/80 transition-all duration-300 flex flex-col justify-between text-right relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-24 h-24 bg-violet-50/30 rounded-full -ml-12 -mt-12 blur-2xl opacity-80 group-hover:bg-violet-50/50 transition-colors"></div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3 justify-end">
                <h4 className="font-black text-slate-800 text-base md:text-lg">حامد ابراهیم نژاد</h4>
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-500 font-black shrink-0">
                  <User className="w-5 h-5" />
                </div>
              </div>

              <div className="border-t border-dashed border-slate-105 pt-3 space-y-2.5">
                <a 
                  href="mailto:En.ebrahimnezhad@gmail.com" 
                  className="flex items-center gap-2 group/link justify-end text-slate-600 hover:text-violet-500 transition-colors"
                >
                  <span className="font-mono text-xs font-bold leading-none" dir="ltr">En.ebrahimnezhad@gmail.com</span>
                  <Mail className="w-4 h-4 text-slate-400 group-hover/link:text-violet-500" />
                </a>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <a 
                href="mailto:En.ebrahimnezhad@gmail.com"
                className="text-[10px] font-black text-violet-500 flex items-center gap-1 hover:gap-1.5 transition-all"
              >
                <span>ارسال ایمیل مستقیم</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

      </div>

      {/* Footer message */}
      <div className="flex flex-col items-center gap-4 py-8">
         <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
            <span>ساخته شده با</span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
            <span>برای جامعه مهندسی ایران</span>
         </div>
      </div>
    </div>
  );
};

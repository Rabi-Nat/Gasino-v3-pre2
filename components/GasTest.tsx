
import React from 'react';
import { 
  ShieldCheck, 
  Timer, 
  Gauge, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Clock,
  Activity
} from 'lucide-react';

export const GasTest: React.FC = () => {
  return (
    <div className="space-y-6 page-enter pb-10">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10">
          <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-black mb-2">تست‌های نهایی لوله‌کشی</h2>
          <p className="text-blue-100 text-sm font-medium leading-relaxed max-w-md">
            دستورالعمل‌های آزمایش استحکام و نشت مطابق با آخرین ویرایش مبحث ۱۷ مقررات ملی ساختمان جهت اطمینان از ایمنی کامل سیستم.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strength Test Card */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-xl">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-black text-slate-800">۱. آزمایش استحکام و مقاومت</h3>
            </div>
            <span className="text-[10px] font-black bg-blue-600 text-white px-3 py-1 rounded-full uppercase tracking-wider">ویژه لوله‌کشی توکار</span>
          </div>
          
          <div className="p-8 flex-1 space-y-6">
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              این آزمایش باید بلافاصله پس از اتمام مرحله لوله‌کشی (پیش از پوشاندن لوله‌ها) انجام شود تا از مقاومت بدنه لوله و کیفیت اتصالات در برابر فشار ناگهانی اطمینان حاصل گردد.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-4 h-4 text-blue-600" />
                  <span className="text-[10px] font-black text-slate-400">فشار آزمایش</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-800">30 <span className="text-xs font-bold text-slate-400">PSI</span></span>
                  <span className="text-[10px] font-bold text-slate-400">یا معادل ۲ بار (2 Bar)</span>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="w-4 h-4 text-blue-600" />
                  <span className="text-[10px] font-black text-slate-400">مدت زمان</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-800">۱ <span className="text-xs font-bold text-slate-400">ساعت</span></span>
                  <span className="text-[10px] font-bold text-slate-400">بدون افت فشار</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex items-start gap-4">
              <div className="bg-blue-600 rounded-full p-1 mt-1 shrink-0">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-black text-blue-700 mb-1">شرط قبولی و مرحله بعد</h4>
                <p className="text-xs text-blue-600/80 font-bold leading-relaxed">
                  اگر پس از یک ساعت عقربه گیج هیچ افت فشاری را نشان نداد، تست موفقیت‌آمیز بوده و می‌توانید به مرحله «تست نشتی» بروید.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Leakage Test Card */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-black text-slate-800">۲. آزمایش نشت (تست نهایی)</h3>
            </div>
            <span className="text-[10px] font-black bg-amber-600 text-white px-3 py-1 rounded-full uppercase tracking-wider">گاز نهایی</span>
          </div>
          
          <div className="p-8 flex-1 space-y-6">
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              این تست برای شناسایی نشتی‌های بسیار ریز (Micro-Leaks) در اتصالات لوله‌کشی و شیرآلات انجام می‌شود که با تست مقاومت قابل شناسایی نیستند.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-4 h-4 text-amber-600" />
                  <span className="text-[10px] font-black text-slate-400">فشار آزمایش</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-slate-800">۱۰ <span className="text-xs font-bold text-slate-400">PSI</span></span>
                  <span className="text-[10px] font-bold text-slate-400">فشار کار (یا گیج ۰-۱۵)</span>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-[10px] font-black text-slate-400">مدت زمان</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-800">۲۴ <span className="text-xs font-bold text-slate-400">ساعت</span></span>
                  <span className="text-[10px] font-bold text-slate-400">زمان استاندارد پایش</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 flex items-start gap-4">
              <div className="bg-amber-600 rounded-full p-1 mt-1 shrink-0">
                <Info className="w-3 h-3 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-700 mb-1">نکته بسیار مهم</h4>
                <p className="text-xs text-amber-600/80 font-bold leading-relaxed">
                  طی مدت ۲۴ ساعت، هیچ‌گونه افت فشاری مجاز نیست. در صورت مشاهده کمترین تغییر در عقربه، باید تمامی اتصالات مجدداً بررسی و نشت‌یابی شوند.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post-Connection Leak Check Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-emerald-600 p-8 text-white">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-black">بررسی نشت پس از وصل جریان گاز</h3>
          </div>
          <p className="text-emerald-100 text-xs font-bold">مرحله نهایی پیش از بهره‌برداری کامل</p>
        </div>
        
        <div className="p-8 space-y-8">
          <p className="text-slate-500 text-[13px] font-bold leading-relaxed">
            پس از اطمینان از بسته بودن تمامی خروجی‌ها، بلافاصله بعد از باز کردن جریان گاز باید سیستم لوله‌کشی را به یکی از روش‌های زیر بررسی نمود تا اطمینان حاصل شود که هیچ گازی به بیرون نشت نمی‌کند.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">۱</div>
                <h4 className="font-black text-slate-800 text-sm">پایش به کمک کنتور گاز</h4>
              </div>
              <ul className="space-y-3 text-[13px] text-slate-600 font-medium list-disc mr-10 leading-relaxed">
                <li>ابتدا تمامی شیرهای انتهایی (مصرف‌کننده‌ها) را کاملاً ببندید.</li>
                <li>شیر اصلی ورود گاز و شیرهای فرعی واحدها را باز کنید.</li>
                <li>به مدت <span className="text-emerald-600 font-black">۱۵ دقیقه</span> حرکات عقربه یا شماره‌انداز کنتور را دقیقاً زیر نظر بگیرید.</li>
                <li>هرگونه حرکت در این مدت، نشانه <span className="text-red-500 font-black">نشت قطعی</span> در سیستم است.</li>
                <li className="text-slate-400 italic">نکته: برای تست سلامت کنتور، یک پیلوت را روشن کنید؛ کنتور باید بلافاصله شروع به حرکت کند.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">۲</div>
                <h4 className="font-black text-slate-800 text-sm">تست با فشارسنج حساس</h4>
              </div>
              <ul className="space-y-3 text-[13px] text-slate-600 font-medium list-disc mr-10 leading-relaxed">
                <li>استفاده از ستون آب مدرج (U-Tube) یا فشارسنج دیجیتال با دقت بالا.</li>
                <li>فشارسنج را به یکی از نقاط مصرف متصل و شیر اصلی را باز کنید.</li>
                <li>پس از تثبیت فشار (حدود ۲۵۰ میلی‌متر ستون آب)، شیر اصلی را ببندید.</li>
                <li>پایداری فشار طی زمان حدودی ۳ دقیقه نشانه سلامت سیستم است.</li>
                <li>در صورت افت، نشت‌یابی را با کف صابون از اتصالات شروع کنید.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Tips Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-100">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">توصیه‌های فنی و ایمنی</h3>
            <p className="text-slate-400 text-xs font-bold">رعایت این نکات الزامی است</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            "برای تست نشتی حتماً از گیج‌های با دامنه کم (مانند ۰ تا ۱۵ پوند) استفاده کنید تا افت‌های بسیار ریز قابل مشاهده باشند.",
            "در صورت بروز افت فشار، ابتدا اتصالات رزوه‌ای و شیرهای قطع و وصل را با کف صابون غلیظ چک کنید.",
            "آزمایش استحکام لزوماً باید پیش از سفیدکاری یا پوشاندن لوله‌های توکار در سقف‌های کاذب و داکت‌ها نهایی شود."
          ].map((tip, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="text-blue-600 font-black text-sm mt-0.5">{idx + 1}.</div>
              <p className="text-slate-600 text-[13px] font-bold leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

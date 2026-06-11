import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Wind, 
  Cylinder, 
  FireExtinguisher, 
  Ruler, 
  Calculator, 
  ArrowLeft, 
  HelpCircle, 
  Lightbulb,
  BookOpen, 
  Info,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Gauge,
  Sliders,
  AlertCircle,
  Home
} from 'lucide-react';

interface UserGuideProps {
  onClose: () => void;
}

type CategoryId = 'gas' | 'plumbing' | 'hvac' | 'fire';

interface GuideData {
  id: CategoryId;
  title: string;
  topic: string;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
  badgeColor: string;
  borderHover: string;
  intro: string;
  sections: {
    title: string;
    icon: React.ComponentType<any>;
    content: string[];
    formulas?: { name: string; equation: string; desc: string }[];
  }[];
}

export const UserGuide: React.FC<UserGuideProps> = ({ onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [selectedCategory]);

  const guides: GuideData[] = [
    {
      id: 'gas',
      title: 'راهنمای سیستم گازرسانی',
      topic: 'مبحث هفدهم مقررات ملی ساختمان',
      icon: Flame,
      color: 'text-blue-600',
      gradient: 'from-blue-500/5 via-blue-500/10 to-transparent',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/60',
      borderHover: 'hover:border-blue-300',
      intro: 'این راهنما شامل توضیحات دقیق مهندسی و محاسباتی لوله‌کشی گاز طبیعی کم‌فشار (0.25 psi) و فشارهای بالا (تا 60 psi)، مشخصات فواصل ایمنی و سایزبندی کنتور طبق مبحث ۱۷ می‌باشد.',
      sections: [
        {
          title: 'نحوه کارکرد نرم‌افزار سایزینگ لوله',
          icon: Sliders,
          content: [
            '۱. نوع فشار کاری سیستم را انتخاب کنید: فشار ضعیف مسکونی (۱۷ میلی‌بار / ۰.۲۵ پی‌اس‌آی) یا فشارهای بالاتر صنعتی (۲ الی ۶۰ پی‌اس‌آی).',
            '۲. دبی کل گاز مصرفی وسایل گازسوز را بر اساس مترمکعب در ساعت (m³/h) به عنوان ورودی اصلی وارد نمایید.',
            '۳. طول بحرانی‌ترین مسیر لوله‌کشی (دورترین مصرف‌کننده از رگولاتور) را به متر اعمال کنید تا افت فشار کل به درستی توزیع گردد.',
            '۴. چگالی نامی گاز را در صورت نیاز اصلاح کنید (چگالی پیش‌فرض گاز شهری ایران ۰.۶۵ نسبت به هوا می‌باشد).',
            '۵. سایز بهینه قطر اسمی لوله (NPS) توسط سیستم نمایش داده شده و دبی حداکثر عبوری برای قطر انتخابی گزارش می‌شود.'
          ]
        },
        {
          title: 'مبانی و فرمول‌های محاسباتی سایزینگ گاز',
          icon: Calculator,
          content: [
            'سایزینگ لوله‌های گاز با توجه به افت فشار مجاز بر اساس طول کل لوله‌کشی به شیوه رفت و برگشت محاسبه می‌شود.',
            'افت فشار مجاز سیستم لوله‌کشی گاز کم فشار حداکثر ۱.۲ میلی‌بار (یا ۱۲۰ پاسکال) در نظر گرفته می‌شود تا کارایی مشعل وسایل گازسوز حفظ گردد.',
            'چگالی نسبی گاز تاثیر مستقیم در جریان جرمی دارد و ضریب تصحیح چگالی (Density Correction Factor) برای دبی لوله‌ کشی جهت ارزیابی ظرفیت اسمی از روابط تجربی استخراج می‌گردد.'
          ],
          formulas: [
            {
              name: 'فرمول جریان گاز اسپیتزگلاس (Spitzglass) - فشار ضعیف',
              equation: 'Q = 3550 * D^2.5 * [ (ΔP) / (S * L * (1 + 3.6/D + 0.03 * D)) ]^0.5',
              desc: 'Q: دبی جریان گاز (ft³/hr) | D: قطر داخلی لوله (اینچ) | ΔP: افت فشار ممیز آب (inches of water) | S: چگالی نسبی گاز (هوا = ۱.۰) | L: طول معادل لوله‌کشی (فوت)'
            },
            {
              name: 'فرمول تصحیح چگالی گاز شهری',
              equation: 'Q_corrected = Q_actual * Fd ,  Fd = sqrt(0.65 / d)',
              desc: 'Fd: ضریب تصحیح چگالی وسایل | d: چگالی تجربی گاز مصرفی | d استاندارد کشور ایران معمولاً 0.65 در نظر گرفته می‌شود.'
            }
          ]
        },
        {
          title: 'ظرفیت اسمی و انتخاب کنتور مناسب',
          icon: Gauge,
          content: [
            'انتخاب کنتور گاز بر حسب مجموع دبی تمام تجهیزات همزمان بصورت ضریب نفوذ همزمانی مبحث ۱۷ انجام می‌گردد:',
            '• کنتور G2.5: دبی بهره‌برداری تا ۲.۵ مترمکعب بر ساعت (معمولاً یک واحد مسکونی کوچک بدون پکیج بزرگ)',
            '• کنتور G4: دبی بهره‌برداری تا ۶ مترمکعب بر ساعت (مسکونی استاندارد با پکیج و اجاق گاز)',
            '• کنتور G6: دبی بهره‌برداری تا ۱۰ مترمکعب بر ساعت | کنتور G10: دبی بهره‌برداری تا ۱۶ مترمکعب بر ساعت',
            '• کنتور G16: دبی بهره‌برداری تا ۲۵ مترمکعب بر ساعت | کنتور G25: دبی بهره‌برداری تا ۴۰ مترمکعب بر ساعت',
            '• کنتورهای G40, G65, G100: مصارف کلان، مجموعه‌های مسکونی مرتفع، تجاری و موتورخانه‌های بزرگ.'
          ]
        }
      ]
    },
    {
      id: 'plumbing',
      title: 'راهنمای تاسیسات بهداشتی',
      topic: 'مبحث شانزدهم مقررات ملی ساختمان',
      icon: Cylinder,
      color: 'text-cyan-600',
      gradient: 'from-cyan-500/5 via-cyan-500/10 to-transparent',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200/60',
      borderHover: 'hover:border-cyan-300',
      intro: 'متد محاسباتی تاسیسات آبرسانی، تغذیه لوله‌ها بر اساس حداکثر دبی همزمان لوازم بهداشتی ساختمان (SFU) و سایزینگ انشعاب‌های فاضلاب و آب باران منطبق با مراجع نوین مبحث ۱۶ کشور.',
      sections: [
        {
          title: 'سایزبندی آبرسانی با متد شاخص لوازم (SFU)',
          icon: Sliders,
          content: [
            '۱. در جدول توزیع، تعداد هر تجهیز بهداشتی که در طبقات قرار دارد را به برنامه معرفی کنید (مثلا کاسه توالت، روشویی، وان، ماشین ظرفشویی).',
            '۲. سیستم را بر اساس تخلیه فلاش‌تانک (مکانیزم کم‌فشار سیفون) یا فلاش‌والو (کاسه با دبی توام و آنی بالا) قرار دهید.',
            '۳. فاکتور دبی SFU کل به شیوه تجمعی محاسبه شده و با استفاده از تخمین‌های آماری منحنی هانتر به دبی لحظه‌ای بر حسب گالن در دقیقه (GPM) تبدیل می‌گردد.',
            '۴. بر مبنای سرعت حد مجاز جریان آب داخل لوله (حداکثر ۱.۸ الی ۲.۴ متر بر ثانیه برای کاهش صدا و جلوگیری از فرسایش و ضربه قوچ)، قطر لوله ورودی انتخاب می‌شود.'
          ]
        },
        {
          title: 'مبانی ریاضی جریان و تخمین هانتر (Hunter)',
          icon: Calculator,
          content: [
            'محاسبه جریان واقعی توزیع به هیچ وجه حاصل‌جمع کل دبی‌ها نیست؛ چرا که همزمانی باز شدن تمام شیرهای آب به طور آماری ناچیز است.',
            'منحنی تقاضای هانتر با بهره‌برداری از نظریه توزیع احتمالات دوجمله‌ای توسعه یافته است. در این برنامه، توابع ریاضی زیر برای تبدیل عددی SFU به دبی اسمی به کار گرفته شده است.'
          ],
          formulas: [
            {
              name: 'رابطه تبدیل فلاش‌تانک (لوازم خانگی متعارف)',
              equation: 'Flow (GPM) = 1.25 * sqrt(SFU)  [for SFU >= 10]',
              desc: 'در مقادیر بسیار کوچک، ضرایب خطی محلی برای دقت بیشتر در آبرسانی انشعابات فرعی آپارتمانی اعمال شده است.'
            },
            {
              name: 'رابطه تبدیل فلاش‌والو (مکان‌های عمومی با دبی ضربه‌ای)',
              equation: 'Flow (GPM) = 2.45 * sqrt(SFU) + 12.5',
              desc: 'نشان‌دهنده مصرف لحظه‌ای شدید در ثانیه‌های آغازین کارکرد فلاش‌والوها که به لوله‌های قطورتر تغذیه نیاز دارد.'
            }
          ]
        },
        {
          title: 'منبع ذخیره مصرفی آب و حجم اضطراری',
          icon: Gauge,
          content: [
            '• طبق آیین‌نامه مبحث ۱۶ مقرر شده است که ساختمان‌های بیش از ۴ طبقه یا دارای حداقل ۱۰ واحد مسکونی باید مجهز به مخزن ذخیره موقت آب باشند.',
            '• سرانه مصرف مصوب آب برای هر نفر مسکونی معادل ۱۵۰ لیتر در شبانه‌روز (۱۲ ساعت ماند معادل ۷۵ لیتر برای هر نفر) جهت تامین دبی در مواقع اوج تقاضا یا قطع موقت شبکه شهری ملاک قرار می‌گیرد.',
            '• حجم کل منبع آبرسانی از ضرب تعداد مصارف فرضی ساکنین در مقدار سرانه ذخیره مصرف ساختمان به دست می‌آید.'
          ]
        },
        {
          title: 'تخلیه ثقلی فاضلاب و آب باران',
          icon: Info,
          content: [
            '• سایزینگ لوله‌های عمودی و افقی فاضلاب بر اساس واحد شاخص فاضلاب (DFU - Drainage Fixture Unit) استوار است.',
            '• شیب لوله‌های فرعی افقی فاضلاب به قطر ۵۰ الی ۱۱۰ میلی‌متر، نباید کمتر از ۲ درصد باشد تا سرعت خودپالایی رسوب (حدود ۰.۶ متر بر ثانیه) حفظ گردد.',
            '• دبی ناودان آب باران بر مبنای مساحت موثر رو بام (پیش‌آمدگی و دیوارهای بادگیر) و حداکثر شدت بارندگی تاریخی شهر مدنظر (مثلاً بر اساس نقشه بارش‌های کلان ایران) به صورت لیتر بر ثانیه تعیین می‌گردد.'
          ]
        }
      ]
    },
    {
      id: 'hvac',
      title: 'راهنمای تاسیسات مکانیکی (HVAC)',
      topic: 'مبحث چهاردهم مقررات ملی ساختمان',
      icon: Wind,
      color: 'text-amber-600',
      gradient: 'from-amber-500/5 via-amber-500/10 to-transparent',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/60',
      borderHover: 'hover:border-amber-300',
      intro: 'ارزیابی بارهای سرمایش و گرمایش، فرآیندهای سایزینگ کانال انتقال هوا و بررسی لوله‌کشی فن‌کویل‌ها و دبی‌های هوا منطبق با اصول مهندسی مبحث ۱۴ مقررات ملی ساختمان.',
      sections: [
        {
          title: 'روند ارزیابی بار برودتی و حرارتی',
          icon: Sliders,
          content: [
            '۱. متراژ زیربنا، ارتفاع سقف و منطقه جغرافیایی پروژه را انتخاب کنید تا درجه روزهای سرمایشی/گرمایشی به طور فرضی تخصیص یابد.',
            '۲. میزان عایق‌کاری دیوارهای پیرامونی و کیفیت بازشوها (پنجره‌های ساده، دوجداره استاندارد و یو‌پی‌وی‌سی) را تعیین کنید تا ضریب کلی انتقال حرارت (U-value) اصلاح شود.',
            '۳. سیستم بار گرمایشی لازم را جهت انتخاب رادیاتور یا پکیج مسکونی به صورت BTU/hr محاسبه می‌کند.',
            '۴. بارهای سرمایشی تجمعی ساختمان شامل بار هدایتی، تابشی خورشید و بارهای داخلی ناشی از اشخاص و تجهیزات الکتریکی برآورد می‌شود.'
          ]
        },
        {
          title: 'مبانی فیزیکی و فرمول‌های حرارت مرکزی',
          icon: Calculator,
          content: [
            'بارهای انتقال حرارت از دیواره‌ها و سقف بر اساس مابه التفاوت دماهای داخل و خارج ساختمان و برآورد ظرفیت سرمایشی هوای تازه صورت می‌پذیرد.'
          ],
          formulas: [
            {
              name: 'رابطه انتقال حرارت هدایتی جداره‌ها',
              equation: 'Q_loss = U * A * (Ti - To) * k',
              desc: 'U: ضریب انتقال حرارت دیواره (W/m²°C) | A: مساحت سطح فضا (m²) | Ti & To: دمای طرح داخل و خارج | k: ضریب تصحیح جهت جغرافیایی ساختمان'
            },
            {
              name: 'محاسبه دبی جریان هوای تازه خنک‌کننده (CFM)',
              equation: 'Airflow (CFM) = Q_sensible / (1.08 * (T_room - T_supply))',
              desc: 'CFM: فوت مکعب در دقیقه هوا | Q_sensible: بار محسوس فضای داخلی (BTU/hr) | اختلاف دمای هوای طرح اتاق و هوای ورودی کانال دهش دستگاه'
            }
          ]
        },
        {
          title: 'قوانین سایزینگ کانال تهویه (Equal Friction)',
          icon: Info,
          content: [
            '• سایزبندی کانال‌ بر مبنای نرخ افت فشار معادل (معمولاً ۰.۰۸ الی ۰.۱ اینچ ممیز آب در ۱۰۰ فوت طول کانال مستقیم) صورت می‌گیرد تا فشار استاتیکی سیستم متعادل باشد.',
            '• در دبی‌های معین هوا (CFM)، حفظ سرعت استاندارد در داخل داکت‌ها برای کاربری مسکونی الزامی است تا صدای مزاحم زوزه‌ باد کاهش یابد:',
            '  - کانال‌های اصلی: مابین ۷۰۰ الی ۹۰۰ فوت بر دقیقه (FPM)',
            '  - کانالهای فرعی و خروجی دریچه‌ها: مابین ۴۰۰ الی ۶۰۰ فوت بر دقیقه (FPM)'
          ]
        }
      ]
    },
    {
      id: 'fire',
      title: 'راهنمای سیستم آتش‌نشانی',
      topic: 'ضوابط سامانه اطفاء حریق ملاک عمل سازمان آتش‌نشانی',
      icon: FireExtinguisher,
      color: 'text-rose-600',
      gradient: 'from-rose-500/5 via-rose-500/10 to-transparent',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200/60',
      borderHover: 'hover:border-rose-300',
      intro: 'راهنمای هیدرولیک آتش‌نشانی ساختمان، محاسبات دبی سیستم‌های تر و خشک فایرباکس، حجم منبع ذخیره آب آتش‌نشانی، هد کلی پمپ‌های اطفاء و تعداد کپسول‌های پودری و گاز دی‌اکسیدکربن.',
      sections: [
        {
          title: 'محاسبات هیدرولیکی فایرباکس و اسپرینکلر',
          icon: Sliders,
          content: [
            '۱. تعداد جعبه‌های آتش‌نشانی (Firebox) فعال همزمان (معمولاً حداقل دو جعبه در سناریوهای مهار اولیه مسکونی) را اعمال کنید تا دبی شبکه مشخص شود.',
            '۲. دبی استاندارد هر فایرباکس معادل ۵۰ گالن در دقیقه (GPM) با خروجی ۱.۵ اینچ می‌باشد که جریان کل ۱۰۰ گالن در دقیقه را برای دو جعبه فعال رقم می‌زند.',
            '۳. مدت زمان تامین آب سیستم بر اساس سناریو تا حداکثر ۳۰ یا ۶۰ دقیقه انتخاب می‌شود تا ظرفیت دقیق ذخیره‌سازی مخزن ضد حریق محاسبه گردد.',
            '۴. جهت فرآیند هد پمپ، بیشترین ارتفاع استاتیکی ساختمان از دهانه خروجی تا کلکتور مکش به همراه افت سایشی طولانی‌ترین مسیر ثبت می‌شود.'
          ]
        },
        {
          title: 'فرمول‌های هیدرولیکی افت فشار و هد دینامیکی پمپ',
          icon: Calculator,
          content: [
            'برای به دست آوردن هد نهایی پمپ آتش‌نشانی، باید افت فشار ناشی از اصطکاک جریانی آب درون لوله‌های فولادی محاسبه شود. روابط ریاضی پرکاربردNFPA و سازمان آتش‌نشانی به شرح زیر است.'
          ],
          formulas: [
            {
              name: 'فرمول افت فشار هازن - ویلیامز (Hazen-Williams)',
              equation: 'Pf = 4.52 * Q^1.85 * C^(-1.85) * d^(-4.87)',
              desc: 'Pf: افت فشار در هر فوت از لوله‌کشی (psi) | Q: دبی کل هیدرولیکی (GPM) | d: قطر واقعی داخلی لوله (اینچ) | C: ضریب زبری لوله که برای لوله‌های فولاد سیاه یا سیاه گالوانیزه معادل 120 است.'
            },
            {
              name: 'هد نهایی پمپ آتش‌نشانی (Pump Head H)',
              equation: 'H_pump = H_static + H_friction + H_nozzle_residual',
              desc: 'H_static: ارتفاع هندسی ساختمان | H_friction: مجموع افت‌های سایشی لوله و اتصالات | H_nozzle: فشار باقیمانده برای پرتاب کارا پشت نازل فایرباکس که بر اساس استاندارد حداقل ۳ بار یا معادل ۹۲ فوت می‌باشد.'
            }
          ]
        },
        {
          title: 'توزیع کپسول‌های آتش‌نشانی دستی (حریق طبقات)',
          icon: Info,
          content: [
            '• تعداد کپسول‌های دستی اطفاء حریق برحسب سطح مربع کل ساختمان، نوع تصرف (مسکونی پرخطر، متوسط، کم‌خطر) و شعاع دسترسی (معمولاً حداکثر ۲۳ متر) برآورد می‌شود.',
            '• برای فضاهای اداری و موتورخانه‌ها کپسول‌های CO2 شارژ مناسب جهت حریق‌های برقی و برای فضاهای عمومی کپسول پودر و گاز چندمنظوره توصیه می‌گردد.',
            '• ظرفیت اسمی هر دیسپنسر کپسول حداقل ۶ کیلوگرمی برای حفاظت بهینه است.'
          ]
        }
      ]
    }
  ];

  const currentGuide = guides.find(g => g.id === selectedCategory);

  return (
    <div id="user-guide-screen" className="fixed inset-0 z-50 bg-[#f8fafc] flex flex-col font-sans overflow-hidden" dir="rtl">
      {/* Visual background grid decor */}
      <div className="absolute inset-0 bg-[size:32px_32px] bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] opacity-[0.2] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-amber-500/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Content Area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 relative z-10">
        <AnimatePresence mode="wait">
          {!selectedCategory ? (
            /* Category Selector Screen */
            <motion.div 
              key="selector-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-4xl mx-auto flex flex-col items-center"
            >
              <div className="w-full flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/60">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 font-black rounded-full text-[10px] tracking-wide uppercase border border-blue-200/50">
                  دسترسی به مستندات محاسباتی
                </span>
                <button
                  id="btn-selector-home"
                  onClick={onClose}
                  className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-2xl transition-all cursor-pointer shadow-sm hover:scale-105 flex items-center justify-center"
                  title="بازگشت به خانه"
                >
                  <Home className="w-5 h-5 text-slate-500 hover:text-slate-705" />
                </button>
              </div>

              <div className="text-center mb-8 md:mb-10 max-w-2xl">
                <h2 className="text-2xl md:text-3.5xl font-black text-slate-800 tracking-tight leading-snug mb-3">
                  سیستم مهندسی مدنظر خود را انتخاب کنید
                </h2>
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-bold">
                  توضیحات فرآیند طراحی، جزییات فرمول‌های آکادمیک بکار رفته و کاتالوگ استانداردهای مصوب ملی در هر یک از بخش‌های زیر برای بهره‌برداری شما تنظیم شده است.
                </p>
              </div>

              {/* Category Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                {guides.map((g) => {
                  const Icon = g.icon;
                  return (
                    <motion.div
                      key={g.id}
                      onClick={() => setSelectedCategory(g.id)}
                      whileHover={{ y: -6, scale: 1.01 }}
                      className={`group relative overflow-hidden p-6 md:p-7 bg-white rounded-[32px] border border-slate-200/70 ${g.borderHover} cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between`}
                    >
                      {/* Accent gradient background hover glow */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${g.gradient} transition-opacity duration-300 opacity-60 pointer-events-none`} />

                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className={`p-4 rounded-2xl bg-slate-50 text-slate-700 ${g.color} border border-slate-150`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${g.badgeColor}`}>
                          {g.topic.split(' ')[0] + ' ' + (g.topic.split(' ')[1] || '')}
                        </span>
                      </div>

                      {/* Main info */}
                      <div className="relative z-10 mb-6">
                        <h3 className="text-base font-black text-slate-800 mb-2 group-hover:text-slate-950 transition-colors">
                          {g.title}
                        </h3>
                        <p className="text-slate-400 text-[11px] md:text-xs leading-relaxed font-bold">
                          {g.intro}
                        </p>
                      </div>

                      {/* Footer Link */}
                      <div className="flex items-center gap-1 text-[11px] font-black self-start mt-auto relative z-10 transition-all group-hover:gap-2">
                        <span className={g.color}>مشاهده کامل نحوه استفاده و محاسبات</span>
                        <ChevronLeft className={`w-4 h-4 ${g.color}`} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Call to action helper notes */}
              <div className="mt-12 p-4 bg-sky-50 rounded-2xl border border-sky-100 flex items-start gap-3 w-full max-w-xl">
                <Lightbulb className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-right">
                  <p className="text-[11px] font-black text-sky-800 leading-relaxed">تطبیق با ضوابط اجرایی ایران</p>
                  <p className="text-[10px] text-sky-600/90 leading-relaxed font-bold mt-0.5">تمامی محاسبات این پرتابل بر مبنای آخرین ویرایش‌های مقررات ملی ساختمان و استانداردهای سازمان مهندسی و آتش‌نشانی کشور مدلسازی شده است.</p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Selected Category Detail Guide Screen */
            <motion.div 
              key="detail-screen"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              className="max-w-4xl mx-auto"
            >
              {/* Back to selectors and Home header buttons */}
              <div className="flex items-center gap-2 mb-6">
                <button
                  id="btn-back-to-selector"
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#0f172a] rounded-full text-[11px] font-black transition-all cursor-pointer border border-slate-200/65"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>بازگشت به انتخاب سیستم‌ها</span>
                </button>
                <button
                  id="btn-guide-detail-home"
                  onClick={onClose}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#0f172a] rounded-full text-[11px] font-black transition-all cursor-pointer border border-slate-200/65"
                  title="بازگشت به خانه"
                >
                  <Home className="w-4 h-4 text-slate-500" />
                  <span>خانه (Home)</span>
                </button>
              </div>

              {/* Title & Banner Info Block */}
              <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200/60 shadow-sm mb-6 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${currentGuide?.gradient} rounded-full blur-2xl opacity-50`}></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5 relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-3 bg-slate-50 rounded-2xl border border-slate-150 ${currentGuide?.color}`}>
                      {currentGuide && React.createElement(currentGuide.icon, { className: "w-7 h-7" })}
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-850">{currentGuide?.title}</h2>
                      <span className={`px-3 py-0.5 rounded-full text-[10px] font-black border mt-1.5 inline-block ${currentGuide?.badgeColor}`}>
                        {currentGuide?.topic}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-slate-500 font-bold text-xs md:text-sm leading-relaxed relative z-10">
                  {currentGuide?.intro}
                </p>
              </div>

              {/* Generated Detailed Sub-sections */}
              <div className="flex flex-col gap-6">
                {currentGuide?.sections.map((section, idx) => {
                  const SecIcon = section.icon;
                  return (
                    <div key={idx} className="bg-white border border-slate-250/50 rounded-[28px] p-6 shadow-sm">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                        <div className={`p-2 bg-slate-50 rounded-xl ${currentGuide?.color}`}>
                          <SecIcon className="w-5 h-5" />
                        </div>
                        <h4 className="font-black text-sm md:text-base text-slate-800">{section.title}</h4>
                      </div>

                      {/* Content strings */}
                      <div className="flex flex-col gap-2.5 mb-4">
                        {section.content.map((pText, pIdx) => (
                          <p key={pIdx} className="text-slate-600 text-xs md:text-sm leading-relaxed font-bold">
                            {pText}
                          </p>
                        ))}
                      </div>

                      {/* Formulas Block (if present) */}
                      {section.formulas && section.formulas.length > 0 && (
                        <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-4 md:p-5 font-mono text-xs text-right mt-3">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-sans mb-3 inline-block">
                            رابطه و فرمول ریاضی محاسبات
                          </span>
                          <div className="flex flex-col gap-4">
                            {section.formulas.map((formula, fIdx) => (
                              <div key={fIdx} className="border-b border-slate-800 last:border-b-0 pb-3 last:pb-0">
                                <div className="text-[11px] font-black text-slate-400 font-sans mb-1">{formula.name}:</div>
                                <div className="bg-slate-950 p-3 rounded-lg text-left text-blue-400 font-bold overflow-x-auto ltr text-[13px] tracking-wide shadow-inner mb-2 border border-slate-900">
                                  {formula.equation}
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-bold font-sans pr-1">
                                  {formula.desc}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick-Tip Alert Box */}
              <div className="mt-8 p-5 bg-blue-50/50 border border-blue-100 rounded-[24px] flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-blue-800 leading-relaxed">چطوری محاسبات دقیق‌تر داشته باشیم؟</p>
                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed mt-0.5">
                    توصیه می‌شود قبل از ورود داده‌ها به فیلدهای مربوطه، نقشه‌های ساختمانی را به طور فیزیکی مطالعه کرده و بر اساس اطلاعات تایید شده مهندس معمار (مانند کاربری دقیق فضاها، طول لوله‌کشی و ارتفاع از روی دیتوم) ارقام را اعمال نمائید تا نرم‌افزار دقیق‌ترین خروجی را استخراج نماید.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer copyright */}
      <footer className="bg-white border-t border-slate-200 px-4 py-4 text-center text-slate-400 relative z-10 no-print">
        <span className="text-[11px] text-slate-500 font-bold">
          مرجع و منبع مباحث مقررات ملی ساختمان و استاندارد های بین المللی
        </span>
      </footer>
    </div>
  );
};

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Layers, Compass, Scaling, Sparkles } from 'lucide-react';
import { PlanDesigner } from './PlanDesigner';
import { IsometricDesigner } from './IsometricDesigner';

export const DraftingSection: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'plan' | 'isometric'>('isometric');

  return (
    <div className="space-y-6" style={{ direction: 'rtl' }}>
      {/* Mode active picker control matching user screenshot */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-4 rounded-[1.8rem] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Indicator text with active pulse dot */}
        <div className="flex items-center gap-2 text-right">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
          <span className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200">
            حالت فعال طراحی و ترسیم نقشه:
          </span>
        </div>

        {/* Buttons Selector Container */}
        <div className="bg-slate-100/80 dark:bg-slate-950 p-1 rounded-2xl flex items-center gap-1.5 border border-slate-200/50 dark:border-slate-800/60 max-w-md w-full md:w-auto">
          {/* Button 2D Plan */}
          <button
            type="button"
            onClick={() => setActiveMode('plan')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer active:scale-95 ${
              activeMode === 'plan'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-900/50'
            }`}
          >
            <Layers className={`w-4 h-4 ${activeMode === 'plan' ? 'text-white' : 'text-slate-400'}`} />
            <span>ترسیم پلان 2D</span>
          </button>

          {/* Button 3D Isometric */}
          <button
            type="button"
            onClick={() => setActiveMode('isometric')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer active:scale-95 ${
              activeMode === 'isometric'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-900/50'
            }`}
          >
            <Compass className={`w-4 h-4 ${activeMode === 'isometric' ? 'text-white' : 'text-slate-400'}`} />
            <span>ترسیم ایزومتریک 3D</span>
          </button>
        </div>
      </div>

      {/* Designers wrapped with state-preserving conditional CSS classes */}
      <div className="relative">
        <div className={activeMode === 'plan' ? 'block animate-fade-in' : 'hidden'}>
          <PlanDesigner />
        </div>
        <div className={activeMode === 'isometric' ? 'block animate-fade-in' : 'hidden'}>
          <IsometricDesigner />
        </div>
      </div>
    </div>
  );
};

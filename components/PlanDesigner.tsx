import React, { useState, useEffect, useRef } from 'react';
import { 
  Ruler, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit, 
  Grid, 
  Maximize, 
  Download, 
  Printer, 
  Info, 
  HelpCircle, 
  FileText, 
  Layers, 
  Save, 
  FolderOpen,
  ArrowUpRight,
  RotateCcw,
  X,
  CheckCircle2,
  RotateCw,
  Check,
  Undo,
  Share2,
  Move,
  LayoutGrid,
  Lock,
  Unlock,
  ArrowLeftRight,
  ArrowUpDown
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface ArchElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'stairs' | 'label' | 'equipment';
  subType?: string; // 'single' | 'double' for door, 'straight' | 'spiral' for stairs
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
  name: string;
  orientationLock?: 'horizontal' | 'vertical' | 'none';
  locked?: boolean;
}

interface SavedPlan {
  id: string;
  name: string;
  createdAt: string;
  archElements: ArchElement[];
}

export const PlanDesigner: React.FC = () => {
  // Fine architectural background settings
  const [archElements, _setArchElements] = useState<ArchElement[]>(() => {
    try {
      const saved = localStorage.getItem('isom_archElements_planOnly');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Default beautiful starter plan: Three room style
    return [
      { id: 'wall-1', type: 'wall', x: -160, y: -120, width: 335, height: 10, rotation: 0, name: 'دیوار خارجی شمالی' },
      { id: 'wall-2', type: 'wall', x: -160, y: -120, width: 260, height: 10, rotation: 90, name: 'دیوار خارجی غربی' },
      { id: 'wall-3', type: 'wall', x: 175, y: -120, width: 260, height: 10, rotation: 90, name: 'دیوار خارجی شرقی' },
      { id: 'wall-4', type: 'wall', x: -160, y: 140, width: 345, height: 10, rotation: 0, name: 'دیوار خارجی جنوبی' },
      { id: 'wall-5', type: 'wall', x: 20, y: -120, width: 10, height: 140, rotation: 0, name: 'دیوار تفکیک آشپزخانه' },
      { id: 'wall-6', type: 'wall', x: -160, y: 20, width: 180, height: 10, rotation: 0, name: 'دیوار اتاق خواب' },
      { id: 'door-1', type: 'door', x: -40, y: 140, width: 35, height: 35, rotation: 180, name: 'درب ورودی' },
      { id: 'door-2', type: 'door', x: -100, y: 20, width: 30, height: 30, rotation: 0, name: 'درب اتاق خواب' },
      { id: 'window-1', type: 'window', x: 175, y: 20, width: 10, height: 60, rotation: 90, name: 'پنجره سالن' },
      { id: 'window-2', type: 'window', x: -60, y: -120, width: 50, height: 10, rotation: 0, name: 'پنجره آشپزخانه' },
      { id: 'stairs-1', type: 'stairs', x: 100, y: -100, width: 60, height: 100, rotation: 0, name: 'پله های ورودی/دوبلکس' },
      { id: 'label-1', type: 'label', x: 100, y: -30, width: 100, height: 30, rotation: 0, name: 'آشپزخانه' },
      { id: 'label-2', type: 'label', x: -60, y: 80, width: 120, height: 30, rotation: 0, name: 'سالن نشیمن و پذیرایی' },
      { id: 'label-3', type: 'label', x: -70, y: -40, width: 100, height: 30, rotation: 0, name: 'اتاق خواب' }
    ];
  });

  const [archHistory, setArchHistory] = useState<ArchElement[][]>([]);
  const archSnapshotRef = useRef<ArchElement[] | null>(null);
  const [activeToolbarMenu, setActiveToolbarMenu] = useState<'space_layout' | 'plan_items' | 'gas_equipment' | null>(null);
  const [activeCapsuleCategory, setActiveCapsuleCategory] = useState<'wall' | 'door' | 'window' | 'stairs' | 'label' | null>(null);

  const setArchElements = (updater: ArchElement[] | ((prev: ArchElement[]) => ArchElement[])) => {
    _setArchElements(current => {
      let next = typeof updater === 'function' ? updater(current) : updater;
      if (!isEditingRef.current) {
        next = splitWallsAtIntersections(next);
      }
      return next;
    });
  };

  const handleUndo = () => {
    if (archHistory.length === 0) return;
    const prev = archHistory[archHistory.length - 1];
    isUndoingRef.current = true;
    _setArchElements(prev);
    setArchHistory(archHistory.slice(0, -1));
    setSelectedArchElementId(null);
  };

  // Keyboard shortcut for Undo (Ctrl+Z / Cmd+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        const activeTagName = document.activeElement?.tagName.toLowerCase();
        if (activeTagName === 'input' || activeTagName === 'textarea') {
          // Allow default browser undo inside input fields
          return;
        }
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [archHistory]);

  // Safe history saving effect
  useEffect(() => {
    if (isUndoingRef.current) {
      isUndoingRef.current = false;
      prevArchElementsRef.current = archElements;
      return;
    }
    if (!archSnapshotRef.current) {
      const oldVal = prevArchElementsRef.current;
      setArchHistory(prev => {
        const last = prev[prev.length - 1];
        if (last && JSON.stringify(last) === JSON.stringify(oldVal)) {
          return prev;
        }
        return [...prev, oldVal];
      });
    }
    prevArchElementsRef.current = archElements;
  }, [archElements]);

  useEffect(() => {
    try {
      localStorage.setItem('isom_archElements_planOnly', JSON.stringify(archElements));
    } catch (e) {}
  }, [archElements]);

  // View parameters
  const [scale, setScale] = useState(48); // default fits standard view
  const [offsetX, setOffsetX] = useState(400);
  const [offsetY, setOffsetY] = useState(250);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedArchElementId, _setSelectedArchElementId] = useState<string | null>(null);

  const forceCommitActiveLengthInput = (currentSelectedId = selectedArchElementId) => {
    const activeEl = document.activeElement as HTMLInputElement;
    if (activeEl && activeEl.dataset && activeEl.dataset.lengthInput === 'true') {
      if (currentSelectedId) {
        commitLengthChange(currentSelectedId, activeEl.value);
      }
    }
  };

  const setSelectedArchElementId = (id: string | null | ((prev: string | null) => string | null)) => {
    forceCommitActiveLengthInput();
    _setSelectedArchElementId(id);
    setActiveToolbarMenu(null);
  };

  const [lengthInputStr, setLengthInputStr] = useState<string>('');

  useEffect(() => {
    if (selectedArchElementId) {
      const el = archElements.find(x => x.id === selectedArchElementId);
      if (el) {
        const activeEl = document.activeElement;
        const isEditingInput = activeEl && (activeEl.getAttribute('data-length-input') === 'true');
        if (!isEditingInput) {
          const cmVal = Math.round((el.width / 48) * 100);
          setLengthInputStr(cmVal.toString());
        }
      }
    } else {
      setLengthInputStr('');
    }
  }, [selectedArchElementId, archElements]);

  const commitLengthChange = (elId: string, valStr: string) => {
    if (isCommittingRef.current) return;
    isCommittingRef.current = true;
    try {
      let val = parseInt(valStr);
      if (isNaN(val) || val <= 0) return;
      const el = archElements.find(x => x.id === elId);
      if (el && el.type === 'wall') {
        val = Math.max(10, Math.round(val / 10) * 10);
        setLengthInputStr(val.toString());
      }
      const nextWidth = Math.max(5, Math.round((val * 48) / 100));
      setArchElements(prev => {
        const item = prev.find(x => x.id === elId);
        if (!item) return prev;
        const nextHeight = item.subType === 'shape_square' ? nextWidth : item.height;
        const updated = {
          ...item,
          width: nextWidth,
          height: item.type === 'door' ? nextWidth : nextHeight
        };
        return propagateWallChanges(prev, elId, updated);
      });
    } finally {
      setTimeout(() => {
        isCommittingRef.current = false;
      }, 50);
    }
  };

  const handleInputBlur = (elId: string, valStr: string) => {
    if (isCommittingRef.current) return;
    const val = parseInt(valStr);
    if (isNaN(val) || val <= 0) {
      const el = archElements.find(x => x.id === elId);
      if (el) {
        const cmVal = Math.round((el.width / 48) * 100);
        setLengthInputStr(cmVal.toString());
      }
    } else {
      commitLengthChange(elId, valStr);
    }
  };

  // Print Mode / Style parameters
  const [isPrintTheme, setIsPrintTheme] = useState(() => {
    try {
      return localStorage.getItem('plan_isPrintTheme') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Saved Plans list
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(() => {
    try {
      const saved = localStorage.getItem('plan_custom_saved_plans');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [planNameInput, setPlanNameInput] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('plan_custom_saved_plans', JSON.stringify(savedPlans));
    } catch (e) {}
  }, [savedPlans]);

  useEffect(() => {
    localStorage.setItem('plan_isPrintTheme', String(isPrintTheme));
  }, [isPrintTheme]);

  // Dragging and resizing states inside SVG Canvas
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [activeDraggingArchId, setActiveDraggingArchId] = useState<string | null>(null);
  const [dragArchOffset, setDragArchOffset] = useState({ x: 0, y: 0 });
  const dragArchOffsetRef = useRef({ x: 0, y: 0 });
  const [dragDistance, setDragDistance] = useState(0);

  // Wall resizing states
  const [isResizingArch, setIsResizingArch] = useState(false);
  const [resizeArchStart, setResizeArchStart] = useState({ x: 0, y: 0 });
  const [resizeArchData, setResizeArchData] = useState<{
    x: number;
    y: number;
    initialWidth: number;
    initialHeight: number;
    initialX?: number;
    initialY?: number;
  }>({ x: 0, y: 0, initialWidth: 0, initialHeight: 0 });
  const [resizeArchDimension, setResizeArchDimension] = useState<'width' | 'height'>('width');
  const [resizeArchEdge, setResizeArchEdge] = useState<'start' | 'end' | 'height' | 'diagonal_shape'>('end');

  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchTimeRef = useRef(0);
  const touchStartDistanceRef = useRef<number | null>(null);
  const wasPinchZoomingRef = useRef(false);
  const lastPinchTimeRef = useRef(0);
  const lastPointerPosRef = useRef({ x: 0, y: 0 });
  const isEditingRef = useRef(false);
  const isCommittingRef = useRef(false);
  const isUndoingRef = useRef(false);
  const prevArchElementsRef = useRef<ArchElement[]>([]);

  // Automated layout centering and optimal scaling factor estimation
  const handleAutoFit = () => {
    const container = containerRef.current;
    const containerWidth = container ? container.clientWidth : 800;
    const containerHeight = container ? container.clientHeight : 620;

    let minX = -160, maxX = 185;
    let minY = -120, maxY = 150;

    if (archElements.length > 0) {
      minX = Infinity; maxX = -Infinity;
      minY = Infinity; maxY = -Infinity;
      archElements.forEach(el => {
        const halfW = el.width / 2;
        const halfH = el.height / 2;
        if (el.type === 'wall' || el.type === 'stairs') {
          minX = Math.min(minX, el.x);
          maxX = Math.max(maxX, el.x + el.width);
          minY = Math.min(minY, el.y);
          maxY = Math.max(maxY, el.y + el.height);
        } else {
          minX = Math.min(minX, el.x - halfW);
          maxX = Math.max(maxX, el.x + halfW);
          minY = Math.min(minY, el.y - halfH);
          maxY = Math.max(maxY, el.y + halfH);
        }
      });
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const contentWidth = Math.max(100, maxX - minX);
    const contentHeight = Math.max(100, maxY - minY);

    const scaleX = (containerWidth * 0.85) / contentWidth;
    const scaleY = (containerHeight * 0.85) / contentHeight;
    const calculatedScaleFactor = Math.min(scaleX, scaleY);

    const optimalScale = Math.min(120, Math.max(18, Math.round(calculatedScaleFactor * 48)));

    setScale(optimalScale);
    setOffsetX(containerWidth / 2 - centerX * (optimalScale / 48));
    setOffsetY(containerHeight / 2 - centerY * (optimalScale / 48));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleAutoFit();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  if (prevArchElementsRef.current.length === 0 && archElements.length > 0) {
    prevArchElementsRef.current = archElements;
  }

  // Presets and Loaders
  const handleLoadPresetSquare = () => {
    const elements: ArchElement[] = [
      // Outer boundaries of the square unit
      { id: 'wall-1', type: 'wall', x: -150, y: -150, width: 300, height: 10, rotation: 0, name: 'دیوار خارجی شمالی' },
      { id: 'wall-2', type: 'wall', x: -150, y: -150, width: 300, height: 10, rotation: 90, name: 'دیوار خارجی غربی' },
      { id: 'wall-3', type: 'wall', x: 150, y: -150, width: 300, height: 10, rotation: 90, name: 'دیوار خارجی شرقی' },
      { id: 'wall-4', type: 'wall', x: -150, y: 150, width: 300, height: 10, rotation: 0, name: 'دیوار خارجی جنوبی' },

      // Interior partition walls for Bedroom (North-West corner)
      { id: 'sq-wi-1', type: 'wall', x: 0, y: -150, width: 140, height: 5, rotation: 90, name: 'دیوار داخلی اتاق/پذیرایی' },
      { id: 'sq-wi-2', type: 'wall', x: -150, y: -10, width: 150, height: 5, rotation: 0, name: 'دیوار داخلی اتاق خواب' },

      // Interior partition walls for Bathroom / Toilet (South-West corner)
      { id: 'sq-wi-3', type: 'wall', x: -150, y: 65, width: 85, height: 5, rotation: 0, name: 'دیوار حمام افقی' },
      { id: 'sq-wi-4', type: 'wall', x: -65, y: 65, width: 85, height: 5, rotation: 90, name: 'دیوار حمام عمودی' },

      // Kitchen separation wall (North-East corner open kitchen counter)
      { id: 'sq-wi-5', type: 'wall', x: 0, y: -80, width: 150, height: 5, rotation: 0, name: 'کانتر و اوپن آشپزخانه' },

      // Entry & interior doors
      { id: 'door-1', type: 'door', x: 40, y: 150, width: 30, height: 30, rotation: 180, name: 'درب ورودی اصلی' },
      { id: 'door-2', type: 'door', x: -45, y: -10, width: 25, height: 25, rotation: 180, name: 'درب اتاق خواب' },
      { id: 'door-3', type: 'door', x: -65, y: 80, width: 25, height: 25, rotation: 270, name: 'درب حمام و دستشویی' },

      // Windows
      { id: 'window-1', type: 'window', x: 150, y: 30, width: 60, height: 10, rotation: 90, name: 'پنجره سالن پذیرایی' },
      { id: 'window-2', type: 'window', x: -80, y: -150, width: 45, height: 10, rotation: 0, name: 'پنجره اتاق خواب' },
      { id: 'window-3', type: 'window', x: 70, y: -150, width: 40, height: 10, rotation: 0, name: 'پنجره آشپزخانه' },
      { id: 'window-4', type: 'window', x: -150, y: 100, width: 20, height: 10, rotation: 90, name: 'هواکش سرویس' },

      // Room labels
      { id: 'label-1', type: 'label', x: 40, y: 30, width: 100, height: 20, rotation: 0, name: 'سالن پذیرایی و نشیمن' },
      { id: 'label-2', type: 'label', x: -75, y: -80, width: 80, height: 20, rotation: 0, name: 'اتاق خواب مستر' },
      { id: 'label-3', type: 'label', x: 75, y: -115, width: 80, height: 20, rotation: 0, name: 'آشپزخانه' },
      { id: 'label-4', type: 'label', x: -110, y: 105, width: 60, height: 20, rotation: 0, name: 'حمام و WC' }
    ];
    setArchElements(elements);
    setSelectedArchElementId(null);
  };

  const handleLoadPresetLShape = () => {
    const elements: ArchElement[] = [
      // Outer L boundaries
      { id: 'l-w1', type: 'wall', x: -150, y: -120, width: 300, height: 10, rotation: 0, name: 'دیوار شمالی' },
      { id: 'l-w2', type: 'wall', x: 150, y: -120, width: 130, height: 10, rotation: 90, name: 'دیوار شرقی بالایی' },
      { id: 'l-w3', type: 'wall', x: 0, y: 10, width: 150, height: 10, rotation: 0, name: 'دیوار میانی افقی' },
      { id: 'l-w4', type: 'wall', x: 0, y: 10, width: 110, height: 10, rotation: 90, name: 'دیوار شرقی پایینی' },
      { id: 'l-w5', type: 'wall', x: -150, y: 120, width: 150, height: 10, rotation: 0, name: 'دیوار جنوبی' },
      { id: 'l-w6', type: 'wall', x: -150, y: -120, width: 240, height: 10, rotation: 90, name: 'دیوار غربی' },

      // Partition wall - Bedroom in North-East Wing
      { id: 'l-wi-bed-v', type: 'wall', x: 0, y: -120, width: 130, height: 5, rotation: 90, name: 'دیوار خواب شرقی' },

      // Partition wall - Bathroom in South-West Wing
      { id: 'l-wi-bath-h', type: 'wall', x: -150, y: 40, width: 75, height: 5, rotation: 0, name: 'دیوار حمام افقی' },
      { id: 'l-wi-bath-v', type: 'wall', x: -75, y: 40, width: 80, height: 5, rotation: 90, name: 'دیوار حمام عمودی' },

      // Open Kitchen partition/bar
      { id: 'l-w7', type: 'wall', x: -150, y: -20, width: 150, height: 5, rotation: 0, name: 'اپن آشپزخانه تفکیک‌شده' },

      // Doors
      { id: 'l-d1', type: 'door', x: -40, y: 120, width: 30, height: 30, rotation: 180, name: 'درب ورودی اصلی' },
      { id: 'l-d-bed', type: 'door', x: 0, y: -15, width: 25, height: 25, rotation: 90, name: 'درب اتاق خواب' },
      { id: 'l-d-bath', type: 'door', x: -75, y: 55, width: 25, height: 25, rotation: 270, name: 'درب حمام و دستشویی' },

      // Windows
      { id: 'l-win1', type: 'window', x: -150, y: -70, width: 50, height: 10, rotation: 90, name: 'پنجره سالن پذیرایی' },
      { id: 'l-win2', type: 'window', x: 75, y: -120, width: 55, height: 10, rotation: 0, name: 'پنجره بر خواب' },
      { id: 'l-win3', type: 'window', x: -150, y: 80, width: 20, height: 10, rotation: 90, name: 'هواکش سرویس' },

      // Stairs & outdoor elements
      { id: 'l-st1', type: 'stairs', x: 60, y: -80, width: 45, height: 75, rotation: 0, name: 'پله ارتباطی حیاط' },

      // Labels
      { id: 'l-lb1', type: 'label', x: -60, y: -70, width: 90, height: 25, rotation: 0, name: 'سالن بزرگ خانوادگی' },
      { id: 'l-lb2', type: 'label', x: 75, y: -50, width: 85, height: 25, rotation: 0, name: 'اتاق خواب مهمان' },
      { id: 'l-lb3', type: 'label', x: -70, y: 10, width: 80, height: 25, rotation: 0, name: 'آشپزخانه لندری' },
      { id: 'l-lb4', type: 'label', x: -115, y: 80, width: 65, height: 25, rotation: 0, name: 'حمام و توالت' }
    ];
    setArchElements(elements);
    setSelectedArchElementId(null);
  };

  const handleLoadPresetThreeRoom = () => {
    const elements: ArchElement[] = [
      // Outer boundaries
      { id: 'u-w1', type: 'wall', x: -160, y: -120, width: 335, height: 10, rotation: 0, name: 'دیوار خارجی شمالی' },
      { id: 'u-w2', type: 'wall', x: -160, y: -120, width: 260, height: 10, rotation: 90, name: 'دیوار خارجی غربی' },
      { id: 'u-w3', type: 'wall', x: 175, y: -120, width: 260, height: 10, rotation: 90, name: 'دیوار خارجی شرقی' },
      { id: 'u-w4', type: 'wall', x: -160, y: 140, width: 335, height: 10, rotation: 0, name: 'دیوار خارجی جنوبی' },

      // Separation wall for kitchen
      { id: 'u-w5', type: 'wall', x: 20, y: -120, width: 140, height: 10, rotation: 90, name: 'دیوار تفکیک آشپزخانه' },

      // Bedrooms partitions
      { id: 'u-w6', type: 'wall', x: -160, y: 20, width: 180, height: 10, rotation: 0, name: 'دیوار اتاق خواب ۱' },
      { id: 'u-w7', type: 'wall', x: -160, y: -50, width: 180, height: 10, rotation: 0, name: 'دیوار اتاق خواب ۲' },

      // Added Bathroom/WC Enclosure (inside Bedroom 1 zone)
      { id: 'u-w-bath1', type: 'wall', x: -110, y: 80, width: 60, height: 8, rotation: 90, name: 'دیوار حمام عمودی' },
      { id: 'u-w-bath2', type: 'wall', x: -160, y: 80, width: 50, height: 8, rotation: 0, name: 'دیوار حمام افقی' },

      // Guest WC separation (beside main entrance lobby)
      { id: 'u-w-guest1', type: 'wall', x: -40, y: 100, width: 40, height: 8, rotation: 90, name: 'دیوار سرویس مهمان' },

      // Doors
      { id: 'u-d1', type: 'door', x: 10, y: 140, width: 35, height: 35, rotation: 180, name: 'درب ورودی لابی' },
      { id: 'u-d2', type: 'door', x: -100, y: 20, width: 30, height: 30, rotation: 0, name: 'درب خواب مستر' },
      { id: 'u-d3', type: 'door', x: -100, y: -50, width: 30, height: 30, rotation: 180, name: 'درب خواب کودک' },
      { id: 'u-d-bath', type: 'door', x: -110, y: 95, width: 25, height: 25, rotation: 90, name: 'درب حمام' },
      { id: 'u-d-guest', type: 'door', x: -40, y: 105, width: 22, height: 22, rotation: 90, name: 'درب سرویس مهمان' },

      // Windows
      { id: 'u-win1', type: 'window', x: 175, y: 20, width: 50, height: 10, rotation: 90, name: 'پنجره سالن' },
      { id: 'u-win2', type: 'window', x: -60, y: -120, width: 50, height: 10, rotation: 0, name: 'پنجره آشپزخانه غرق‌نور' },
      { id: 'u-win3', type: 'window', x: -130, y: -120, width: 40, height: 10, rotation: 0, name: 'پنجره خواب کودک' },
      { id: 'u-win4', type: 'window', x: -160, y: 110, width: 22, height: 10, rotation: 90, name: 'هواکش حمام' },

      // Stairs
      { id: 'u-st1', type: 'stairs', x: 100, y: -100, width: 60, height: 100, rotation: 0, name: 'راه‌پله و آسانسور' },

      // Labels
      { id: 'u-lb1', type: 'label', x: 100, y: -30, width: 100, height: 30, rotation: 0, name: 'آشپزخانه مبله اصلی' },
      { id: 'u-lb2', type: 'label', x: 75, y: 60, width: 130, height: 30, rotation: 0, name: 'نشیمن و پذیرایی اصلی' },
      { id: 'u-lb3', type: 'label', x: -60, y: -15, width: 100, height: 30, rotation: 0, name: 'خواب اول (مستر)' },
      { id: 'u-lb4', type: 'label', x: -70, y: -85, width: 100, height: 30, rotation: 0, name: 'خواب دوم (کودک)' },
      { id: 'u-lb-bath', type: 'label', x: -135, y: 110, width: 45, height: 20, rotation: 0, name: 'حمام و WC' },
      { id: 'u-lb-guest', type: 'label', x: -20, y: 115, width: 40, height: 20, rotation: 0, name: 'سرویس مهمان' }
    ];
    setArchElements(elements);
    setSelectedArchElementId(null);
  };

  const handleClearPresets = () => {
    setArchElements([]);
    setSelectedArchElementId(null);
  };

  const handleAddSpaceShape = (subType: 'shape_square' | 'shape_rect' | 'shape_triangle' | 'shape_pentagon' | 'thin' | 'dashed') => {
    const id = `wall-${Date.now()}`;
    let width = 144;
    let height = 144;
    let name = '';
    
    if (subType === 'shape_square') {
      name = 'فضای مربعی سریع';
      width = 144; // 300 cm
      height = 144;
    } else if (subType === 'shape_rect') {
      name = 'فضای مستطیلی سریع';
      width = 192; // 400 cm
      height = 144; // 300 cm
    } else if (subType === 'shape_triangle') {
      name = 'فضای مثلثی سریع';
      width = 144;
      height = 144;
    } else if (subType === 'shape_pentagon') {
      name = 'فضای پنج‌ضلعی سریع';
      width = 144;
      height = 144;
    } else if (subType === 'thin') {
      name = 'دیوار یا خط باریک';
      width = 144;
      height = 10;
    } else if (subType === 'dashed') {
      name = 'دیوار یا خط‌چین راهنما';
      width = 144;
      height = 10;
    }

    const newEl: ArchElement = {
      id,
      type: 'wall',
      subType,
      x: -50,
      y: -50,
      width,
      height,
      rotation: 0,
      name
    };
    setArchElements([...archElements, newEl]);
    setSelectedArchElementId(id);
  };

  const handleAddWall = (thicknessCm: 10 | 20 = 20) => {
    const id = `wall-${Date.now()}`;
    const h = thicknessCm === 10 ? 5 : 10;
    const w = thicknessCm === 10 ? 72 : 96;
    const newEl: ArchElement = {
      id,
      type: 'wall',
      x: -50,
      y: -50,
      width: w, // 1.5m for thin wall, 2m for thick wall
      height: h,
      rotation: 0,
      name: `دیوار ${thicknessCm} سانتی‌متری`
    };
    setArchElements([...archElements, newEl]);
    setSelectedArchElementId(id);
  };

  const handleAddDoor = (subType: 'single' | 'double' = 'single') => {
    const id = `door-${Date.now()}`;
    const name = subType === 'double' ? 'درب دو لنگه' : 'درب تک لنگه';
    const s = subType === 'double' ? 44 : 25;
    const newEl: ArchElement = {
      id,
      type: 'door',
      subType,
      x: -20,
      y: -20,
      width: s,
      height: s,
      rotation: 0,
      name
    };
    setArchElements([...archElements, newEl]);
    setSelectedArchElementId(id);
  };

  const handleAddWindow = (subType: 'single' | 'double' = 'single') => {
    const id = `window-${Date.now()}`;
    const name = subType === 'double' ? 'پنجره دو لنگه' : 'پنجره دوجداره';
    const width = subType === 'double' ? 60 : 40;
    const newEl: ArchElement = {
      id,
      type: 'window',
      subType,
      x: -30,
      y: -30,
      width,
      height: 10,
      rotation: 0,
      name
    };
    setArchElements([...archElements, newEl]);
    setSelectedArchElementId(id);
  };

  const handleAddStairs = (subType: 'straight' | 'spiral' = 'straight') => {
    const id = `stairs-${Date.now()}`;
    const name = subType === 'spiral' ? 'راه‌پله گرد' : 'راه‌پله استاندارد';
    const newEl: ArchElement = {
      id,
      type: 'stairs',
      subType,
      x: -40,
      y: -50,
      width: 45,
      height: 72,
      rotation: 0,
      name
    };
    setArchElements([...archElements, newEl]);
    setSelectedArchElementId(id);
  };

  const handleAddLabel = (presetText?: string) => {
    const id = `label-${Date.now()}`;
    const name = presetText || 'نام فضا (مثلا اتاق خواب)';
    const newEl: ArchElement = {
      id,
      type: 'label',
      x: 0,
      y: 0,
      width: 75,
      height: 20,
      rotation: 0,
      name
    };
    setArchElements([...archElements, newEl]);
    setSelectedArchElementId(id);
  };

  const handleAddEquipment = (subType: string) => {
    const id = `equipment-${Date.now()}`;
    let name = '';
    let w = 24;
    let h = 24;
    switch (subType) {
      case 'valve':
        name = 'شیر قطع‌کن';
        w = 16;
        h = 16;
        break;
      case 'yard_valve':
        name = 'شیر حیاط (RC)';
        w = 16;
        h = 16;
        break;
      case 'meter':
        name = 'کنتور گاز';
        w = 26;
        h = 18;
        break;
      case 'regulator':
        name = 'رگولاتور';
        w = 18;
        h = 18;
        break;
      case 'boiler':
        name = 'پکیج گرمایشی (BP)';
        w = 28;
        h = 28;
        break;
      case 'water_heater':
        name = 'آبگرمکن دیواری (BP)';
        w = 24;
        h = 24;
        break;
      case 'floor_water_heater':
        name = 'آبگرمکن زمینی (WH)';
        w = 28;
        h = 28;
        break;
      case 'stove':
        name = 'اجاق گاز (GC)';
        w = 36;
        h = 32;
        break;
      case 'heater':
        name = 'بخاری گازسوز (H)';
        w = 32;
        h = 24;
        break;
      case 'ventilation':
        name = 'دریچه تهویه';
        w = 10;
        h = 10;
        break;
      case 'chimney':
        name = 'دودکش';
        w = 10;
        h = 10;
        break;
      default:
        name = 'تجهیز';
    }

    const newEl: ArchElement = {
      id,
      type: 'equipment',
      subType,
      x: 0,
      y: 0,
      width: w,
      height: h,
      rotation: 0,
      name
    };
    setArchElements([...archElements, newEl]);
    setSelectedArchElementId(id);
  };

  const toggleOrientationLock = (elId: string, lockType: 'horizontal' | 'vertical' | 'none') => {
    setArchElements(prev => {
      const item = prev.find(x => x.id === elId);
      if (!item) return prev;
      
      let nextLockType: 'horizontal' | 'vertical' | 'none' = lockType;
      if (item.orientationLock === lockType) {
        nextLockType = 'none';
      }
      
      let updatedRotation = item.rotation;
      if (nextLockType === 'horizontal') {
        const r = item.rotation % 360;
        updatedRotation = (Math.abs(r - 180) < Math.abs(r - 0) && Math.abs(r - 180) < Math.abs(r - 360)) ? 180 : 0;
      } else if (nextLockType === 'vertical') {
        const r = item.rotation % 360;
        updatedRotation = (Math.abs(r - 270) < Math.abs(r - 90)) ? 270 : 90;
      }
      
      const updated = {
        ...item,
        orientationLock: nextLockType === 'none' ? undefined : nextLockType,
        rotation: updatedRotation
      };
      return propagateWallChanges(prev, elId, updated);
    });
  };

  const handleDeleteArchElement = (id: string) => {
    setArchElements(archElements.filter(x => x.id !== id));
    setSelectedArchElementId(null);
  };

  const splitWallsAtIntersections = (elements: ArchElement[]): ArchElement[] => {
    let result = elements;
    let changed = true;
    let iterations = 0;

    while (changed && iterations < 5) {
      changed = false;
      iterations++;

      const walls = result.filter(el => el.type === 'wall' && !el.subType);
      
      for (let i = 0; i < walls.length; i++) {
        const wallA = walls[i];
        const ptsA = getWallEndpoints(wallA);
        const ptsToCheck = [
          { pt: ptsA.p1, ownerId: wallA.id },
          { pt: ptsA.p2, ownerId: wallA.id }
        ];

        for (let j = 0; j < walls.length; j++) {
          const wallB = walls[j];
          if (wallA.id === wallB.id) continue;
          if (wallB.locked) continue;

          const ptsB = getWallEndpoints(wallB);
          const A = ptsB.p1;
          const B = ptsB.p2;

          const ab_x = B.x - A.x;
          const ab_y = B.y - A.y;
          const ab_len_sq = ab_x * ab_x + ab_y * ab_y;
          if (ab_len_sq < 200) continue; // skip too short walls for splitting

          for (const check of ptsToCheck) {
            const P = check.pt;
            const ap_x = P.x - A.x;
            const ap_y = P.y - A.y;

            let t = (ap_x * ab_x + ap_y * ab_y) / ab_len_sq;
            
            // Only split if on the interior of the wall (not near the endpoints)
            if (t > 0.05 && t < 0.95) {
              const proj_x = A.x + t * ab_x;
              const proj_y = A.y + t * ab_y;
              const dist = Math.hypot(P.x - proj_x, P.y - proj_y);

              if (dist < 15) {
                let len1 = Math.round(Math.hypot(proj_x - A.x, proj_y - A.y));
                len1 = snapTo10Cm(len1);
                const totalWidth = snapTo10Cm(wallB.width);
                const len2 = Math.max(15, totalWidth - len1);

                if (len1 >= 15 && len2 >= 15) {
                  const id1 = `wall-${Date.now()}-s1-${Math.floor(Math.random() * 900) + 100}`;
                  const id2 = `wall-${Date.now()}-s2-${Math.floor(Math.random() * 900) + 100}`;

                  const radB = (wallB.rotation * Math.PI) / 180;
                  const newProjX = A.x + len1 * Math.cos(radB);
                  const newProjY = A.y + len1 * Math.sin(radB);

                  const wallB1: ArchElement = {
                    ...wallB,
                    id: id1,
                    x: Math.round(A.x),
                    y: Math.round(A.y),
                    width: len1,
                    name: `${wallB.name || 'دیوار'}`
                  };

                  const wallB2: ArchElement = {
                    ...wallB,
                    id: id2,
                    x: Math.round(newProjX),
                    y: Math.round(newProjY),
                    width: len2,
                    name: `${wallB.name || 'دیوار'}`
                  };

                  if (result === elements) {
                    result = [...elements];
                  }

                  // Rebuild result list, replacing wallB with wallB1 and wallB2
                  result = result.filter(el => el.id !== wallB.id);
                  result.push(wallB1, wallB2);
                  changed = true;
                  break;
                }
              }
            }
          }
          if (changed) break;
        }
        if (changed) break;
      }
    }
    return result;
  };

  // Wall resizing calculations
  const getWallEndpoints = (el: ArchElement) => {
    const rad = (el.rotation * Math.PI) / 180;
    const p1 = { x: el.x, y: el.y };
    const p2 = {
      x: el.x + el.width * Math.cos(rad),
      y: el.y + el.width * Math.sin(rad)
    };
    return { p1, p2 };
  };

  const snapTo10Cm = (width: number): number => {
    const rawCm = (width / 48) * 100;
    const snappedCm = Math.max(10, Math.round(rawCm / 10) * 10);
    return (snappedCm * 48) / 100;
  };

  const propagateWallChanges = (prevElements: ArchElement[], updatedId: string, nextElementState: ArchElement): ArchElement[] => {
    if (
      nextElementState.type !== 'wall' ||
      (nextElementState.subType &&
        (nextElementState.subType.startsWith('shape_') ||
          nextElementState.subType === 'thin' ||
          nextElementState.subType === 'dashed'))
    ) {
      return prevElements.map(el => el.id === updatedId ? nextElementState : el);
    }

    const walls = prevElements.filter(el => el.type === 'wall' && el.subType !== 'thin' && el.subType !== 'dashed');
    const origDriver = walls.find(w => w.id === updatedId);
    if (!origDriver) {
      return prevElements.map(el => el.id === updatedId ? nextElementState : el);
    }

    const origDriverPts = getWallEndpoints(origDriver);
    const newDriverPts = getWallEndpoints(nextElementState);

    interface EndpointRef {
      wallId: string;
      pointKey: 'p1' | 'p2';
      x: number;
      y: number;
    }
    const endpoints: EndpointRef[] = [];
    walls.forEach(w => {
      const pts = getWallEndpoints(w);
      endpoints.push({ wallId: w.id, pointKey: 'p1', x: pts.p1.x, y: pts.p1.y });
      endpoints.push({ wallId: w.id, pointKey: 'p2', x: pts.p2.x, y: pts.p2.y });
    });

    const joints: EndpointRef[][] = [];
    const visited = new Set<string>();

    endpoints.forEach(ep => {
      const key = `${ep.wallId}-${ep.pointKey}`;
      if (visited.has(key)) return;

      const joint: EndpointRef[] = [];
      const queue = [ep];
      visited.add(key);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        joint.push(curr);

        endpoints.forEach(other => {
          const otherKey = `${other.wallId}-${other.pointKey}`;
          if (visited.has(otherKey)) return;

          const dist = Math.hypot(curr.x - other.x, curr.y - other.y);
          if (dist < 20) {
            visited.add(otherKey);
            queue.push(other);
          }
        });
      }
      joints.push(joint);
    });

    const jointFinalCoords = joints.map((joint) => {
      // If there is any locked wall in this joint, its position is absolute and cannot change:
      const lockedEP = joint.find(ep => {
        const wall = prevElements.find(w => w.id === ep.wallId);
        return wall && wall.locked;
      });

      if (lockedEP) {
        return { x: lockedEP.x, y: lockedEP.y };
      }

      const hasDriverP1 = joint.some(ep => ep.wallId === updatedId && ep.pointKey === 'p1');
      const hasDriverP2 = joint.some(ep => ep.wallId === updatedId && ep.pointKey === 'p2');

      if (hasDriverP1 && hasDriverP2) {
        return {
          x: (newDriverPts.p1.x + newDriverPts.p2.x) / 2,
          y: (newDriverPts.p1.y + newDriverPts.p2.y) / 2
        };
      } else if (hasDriverP1) {
        return { x: newDriverPts.p1.x, y: newDriverPts.p1.y };
      } else if (hasDriverP2) {
        return { x: newDriverPts.p2.x, y: newDriverPts.p2.y };
      }

      // No driver in this joint, keeps its original average position
      const avgX = joint.reduce((sum, ep) => sum + ep.x, 0) / joint.length;
      const avgY = joint.reduce((sum, ep) => sum + ep.y, 0) / joint.length;
      return { x: avgX, y: avgY };
    });

    const getJointCoordinate = (wallId: string, pointKey: 'p1' | 'p2', defaultPt: { x: number; y: number }) => {
      const index = joints.findIndex(joint => joint.some(ep => ep.wallId === wallId && ep.pointKey === pointKey));
      if (index === -1) return defaultPt;
      return jointFinalCoords[index];
    };

    return prevElements.map(el => {
      if (el.locked) {
        return el;
      }
      if (el.id === updatedId) {
        let coerced = { ...nextElementState };
        if (coerced.type === 'wall' && coerced.orientationLock) {
          if (coerced.orientationLock === 'horizontal') {
            const r = coerced.rotation % 360;
            coerced.rotation = (Math.abs(r - 180) < Math.abs(r - 0) && Math.abs(r - 180) < Math.abs(r - 360)) ? 180 : 0;
          } else if (coerced.orientationLock === 'vertical') {
            const r = coerced.rotation % 360;
            coerced.rotation = (Math.abs(r - 270) < Math.abs(r - 90)) ? 270 : 90;
          }
        }
        return coerced;
      }
      if (el.subType === 'thin' || el.subType === 'dashed') {
        return el;
      }
      if (el.type !== 'wall') {
        return el;
      }

      const origPts = getWallEndpoints(el);
      const finalP1 = getJointCoordinate(el.id, 'p1', origPts.p1);
      const finalP2 = getJointCoordinate(el.id, 'p2', origPts.p2);

      // Check if both endpoints of this passive wall are unmoved
      const isP1Unmoved = finalP1.x === origPts.p1.x && finalP1.y === origPts.p1.y;
      const isP2Unmoved = finalP2.x === origPts.p2.x && finalP2.y === origPts.p2.y;
      if (isP1Unmoved && isP2Unmoved) {
        if (el.orientationLock) {
          let coerced = { ...el };
          if (el.orientationLock === 'horizontal') {
            const r = coerced.rotation % 360;
            coerced.rotation = (Math.abs(r - 180) < Math.abs(r - 0) && Math.abs(r - 180) < Math.abs(r - 360)) ? 180 : 0;
          } else if (el.orientationLock === 'vertical') {
            const r = coerced.rotation % 360;
            coerced.rotation = (Math.abs(r - 270) < Math.abs(r - 90)) ? 270 : 90;
          }
          return coerced;
        }
        return el;
      }

      let newDx = finalP2.x - finalP1.x;
      let newDy = finalP2.y - finalP1.y;

      if (el.orientationLock === 'horizontal') {
        newDy = 0; // horizontal wall must be parallel to X axis
      } else if (el.orientationLock === 'vertical') {
        newDx = 0; // vertical wall must be parallel to Y axis
      }

      const length = Math.hypot(newDx, newDy);

      let angle = Math.atan2(newDy, newDx) * 180 / Math.PI;
      if (angle < 0) angle += 360;

      if (el.orientationLock === 'horizontal') {
        angle = (Math.abs(angle - 180) < Math.abs(angle - 0) && Math.abs(angle - 180) < Math.abs(angle - 360)) ? 180 : 0;
      } else if (el.orientationLock === 'vertical') {
        angle = (Math.abs(angle - 270) < Math.abs(angle - 90)) ? 270 : 90;
      }

      let finalWallWidth = Math.max(15, Math.round(length));
      if (el.type === 'wall') {
        finalWallWidth = snapTo10Cm(finalWallWidth);
      }

      return {
        ...el,
        x: Math.round(finalP1.x),
        y: Math.round(finalP1.y),
        width: finalWallWidth,
        rotation: angle
      };
    });
  };

  // Drag and touch handlers for the SVG plan preview
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    forceCommitActiveLengthInput();
    if (Date.now() - lastTouchTimeRef.current < 600) return;
    if (activeDraggingArchId || isResizingArch) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffset({ x: offsetX, y: offsetY });
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (Date.now() - lastTouchTimeRef.current < 600) return;
    const scaleFactor = scale / 48;
    
    if (isResizingArch && selectedArchElementId) {
      const dx = (e.clientX - resizeArchStart.x) / scaleFactor;
      const dy = (e.clientY - resizeArchStart.y) / scaleFactor;
      setArchElements(prev => {
        const item = prev.find(x => x.id === selectedArchElementId);
        if (!item) return prev;

        let updatedItem = { ...item };
        if (resizeArchEdge === 'diagonal_shape') {
          const nextWidth = Math.max(15, resizeArchData.initialWidth + dx);
          if (item.subType === 'shape_square') {
            updatedItem.width = nextWidth;
            updatedItem.height = nextWidth;
          } else {
            updatedItem.width = nextWidth;
            updatedItem.height = Math.max(15, resizeArchData.initialHeight + dy);
          }
        } else if (resizeArchDimension === 'width') {
          if (resizeArchEdge === 'start') {
            const rad = (item.rotation * Math.PI) / 180;
            const stepX = dx * Math.cos(rad) + dy * Math.sin(rad);
            let nextWidth = resizeArchData.initialWidth - stepX;
            if (nextWidth > 15) {
              if (item.type === 'wall') {
                nextWidth = snapTo10Cm(nextWidth);
              }
              updatedItem.width = nextWidth;
              const actualDiff = resizeArchData.initialWidth - nextWidth;
              updatedItem.x = (resizeArchData.initialX ?? item.x) + actualDiff * Math.cos(rad);
              updatedItem.y = (resizeArchData.initialY ?? item.y) + actualDiff * Math.sin(rad);
            }
          } else {
            const rad = (item.rotation * Math.PI) / 180;
            const projectedStep = dx * Math.cos(rad) + dy * Math.sin(rad);
            let nextWidth = Math.max(15, resizeArchData.initialWidth + projectedStep);
            if (item.type === 'wall') {
              nextWidth = snapTo10Cm(nextWidth);
            }
            updatedItem.width = nextWidth;
          }
        } else {
          updatedItem.height = Math.max(4, resizeArchData.initialHeight + dy);
        }
        return propagateWallChanges(prev, selectedArchElementId, updatedItem);
      });
      return;
    }

    if (activeDraggingArchId) {
      const prevOffset = dragArchOffsetRef.current;
      const dx = (e.clientX - prevOffset.x) / scaleFactor;
      const dy = (e.clientY - prevOffset.y) / scaleFactor;
      setArchElements(prev => {
        const item = prev.find(x => x.id === activeDraggingArchId);
        if (!item) return prev;
        const updatedItem = {
          ...item,
          x: Math.round(item.x + dx),
          y: Math.round(item.y + dy)
        };
        return propagateWallChanges(prev, activeDraggingArchId, updatedItem);
      });
      setDragDistance(prev => prev + Math.hypot(dx, dy));
      dragArchOffsetRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setOffsetX(dragOffset.x + dx);
    setOffsetY(dragOffset.y + dy);
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    const wasEditing = isEditingRef.current;
    isEditingRef.current = false;
    setIsDragging(false);
    setIsResizingArch(false);
    setActiveDraggingArchId(null);

    if (wasEditing) {
      setArchElements(prev => splitWallsAtIntersections(prev));
    }

    if (archSnapshotRef.current) {
      const currentSnapshot = archSnapshotRef.current;
      const changed = JSON.stringify(currentSnapshot) !== JSON.stringify(archElements);
      if (changed) {
        setArchHistory(h => [...h, currentSnapshot]);
      }
      archSnapshotRef.current = null;
    }

    const totalMoved = Math.hypot(lastPointerPosRef.current.x - dragStart.x, lastPointerPosRef.current.y - dragStart.y);
    if (isDragging && !activeDraggingArchId && !isResizingArch && totalMoved < 7) {
      setSelectedArchElementId(null);
    }
    setDragDistance(0);
  };

  // Touch Support
  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    forceCommitActiveLengthInput();
    lastTouchTimeRef.current = Date.now();
    if (activeDraggingArchId || isResizingArch) return;

    if (e.touches.length === 2) {
      wasPinchZoomingRef.current = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const d = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStartDistanceRef.current = d;
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX, y: touch.clientY });
      setDragOffset({ x: offsetX, y: offsetY });
      lastPointerPosRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    lastTouchTimeRef.current = Date.now();
    const scaleFactor = scale / 48;

    if (e.touches.length === 2 && touchStartDistanceRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const d = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = d / touchStartDistanceRef.current;
      setScale(s => Math.min(180, Math.max(12, Math.round(s * ratio))));
      touchStartDistanceRef.current = d;
      return;
    }

    if (isResizingArch && selectedArchElementId && e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = (touch.clientX - resizeArchStart.x) / scaleFactor;
      const dy = (touch.clientY - resizeArchStart.y) / scaleFactor;
      setArchElements(prev => {
        const item = prev.find(x => x.id === selectedArchElementId);
        if (!item) return prev;

        let updatedItem = { ...item };
        if (resizeArchEdge === 'diagonal_shape') {
          const nextWidth = Math.max(15, resizeArchData.initialWidth + dx);
          if (item.subType === 'shape_square') {
            updatedItem.width = nextWidth;
            updatedItem.height = nextWidth;
          } else {
            updatedItem.width = nextWidth;
            updatedItem.height = Math.max(15, resizeArchData.initialHeight + dy);
          }
        } else if (resizeArchDimension === 'width') {
          if (resizeArchEdge === 'start') {
            const rad = (item.rotation * Math.PI) / 180;
            const stepX = dx * Math.cos(rad) + dy * Math.sin(rad);
            let nextWidth = resizeArchData.initialWidth - stepX;
            if (nextWidth > 15) {
              if (item.type === 'wall') {
                nextWidth = snapTo10Cm(nextWidth);
              }
              updatedItem.width = nextWidth;
              const actualDiff = resizeArchData.initialWidth - nextWidth;
              updatedItem.x = (resizeArchData.initialX ?? item.x) + actualDiff * Math.cos(rad);
              updatedItem.y = (resizeArchData.initialY ?? item.y) + actualDiff * Math.sin(rad);
            }
          } else {
            const rad = (item.rotation * Math.PI) / 180;
            const projectedStep = dx * Math.cos(rad) + dy * Math.sin(rad);
            let nextWidth = Math.max(15, resizeArchData.initialWidth + projectedStep);
            if (item.type === 'wall') {
              nextWidth = snapTo10Cm(nextWidth);
            }
            updatedItem.width = nextWidth;
          }
        } else {
          updatedItem.height = Math.max(4, resizeArchData.initialHeight + dy);
        }
        return propagateWallChanges(prev, selectedArchElementId, updatedItem);
      });
      return;
    }

    if (activeDraggingArchId && e.touches.length === 1) {
      const touch = e.touches[0];
      const prevOffset = dragArchOffsetRef.current;
      const dx = (touch.clientX - prevOffset.x) / scaleFactor;
      const dy = (touch.clientY - prevOffset.y) / scaleFactor;
      setArchElements(prev => {
        const item = prev.find(x => x.id === activeDraggingArchId);
        if (!item) return prev;
        const updatedItem = {
          ...item,
          x: Math.round(item.x + dx),
          y: Math.round(item.y + dy)
        };
        return propagateWallChanges(prev, activeDraggingArchId, updatedItem);
      });
      setDragDistance(prev => prev + Math.hypot(dx, dy));
      dragArchOffsetRef.current = { x: touch.clientX, y: touch.clientY };
      return;
    }

    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.x;
    const dy = touch.clientY - dragStart.y;
    setOffsetX(dragOffset.x + dx);
    setOffsetY(dragOffset.y + dy);
    lastPointerPosRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<SVGSVGElement>) => {
    lastTouchTimeRef.current = Date.now();
    const wasEditing = isEditingRef.current;
    isEditingRef.current = false;
    setIsDragging(false);
    setIsResizingArch(false);
    setActiveDraggingArchId(null);
    touchStartDistanceRef.current = null;
    
    if (wasEditing) {
      setArchElements(prev => splitWallsAtIntersections(prev));
    }

    if (archSnapshotRef.current) {
      const currentSnapshot = archSnapshotRef.current;
      const changed = JSON.stringify(currentSnapshot) !== JSON.stringify(archElements);
      if (changed) {
        setArchHistory(h => [...h, currentSnapshot]);
      }
      archSnapshotRef.current = null;
    }

    const wasPinch = wasPinchZoomingRef.current || (Date.now() - lastPinchTimeRef.current < 1500);
    if (e.touches.length === 0) {
      wasPinchZoomingRef.current = false;
      if (wasPinch) {
        lastPinchTimeRef.current = Date.now();
      }
    }
    const totalMoved = Math.hypot(lastPointerPosRef.current.x - dragStart.x, lastPointerPosRef.current.y - dragStart.y);
    if (isDragging && !wasPinch && !activeDraggingArchId && !isResizingArch && totalMoved < 7) {
      setSelectedArchElementId(null);
    }
    setDragDistance(0);
  };

  const handleArchMouseDown = (e: React.MouseEvent, el: ArchElement) => {
    e.stopPropagation();
    if (Date.now() - lastTouchTimeRef.current < 600) return;
    isEditingRef.current = true;
    setSelectedArchElementId(el.id);
    if (!el.locked) {
      setActiveDraggingArchId(el.id);
      setDragArchOffset({ x: e.clientX, y: e.clientY });
      dragArchOffsetRef.current = { x: e.clientX, y: e.clientY };
    }
    setDragDistance(0);
    archSnapshotRef.current = JSON.parse(JSON.stringify(archElements));
  };

  const handleArchTouchStart = (e: React.TouchEvent, el: ArchElement) => {
    e.stopPropagation();
    isEditingRef.current = true;
    setSelectedArchElementId(el.id);
    if (!el.locked) {
      setActiveDraggingArchId(el.id);
      const touch = e.touches[0];
      setDragArchOffset({ x: touch.clientX, y: touch.clientY });
      dragArchOffsetRef.current = { x: touch.clientX, y: touch.clientY };
    }
    setDragDistance(0);
    archSnapshotRef.current = JSON.parse(JSON.stringify(archElements));
  };

  // Scaling actions
  const startResizing = (e: React.MouseEvent, id: string, edge: 'start' | 'end' | 'height' | 'diagonal_shape', dim: 'width' | 'height' = 'width') => {
    e.stopPropagation();
    const item = archElements.find(x => x.id === id);
    if (!item || item.locked) return;
 
    isEditingRef.current = true;
    archSnapshotRef.current = JSON.parse(JSON.stringify(archElements));
    setIsResizingArch(true);
    setResizeArchDimension(dim);
    setResizeArchEdge(edge);
    setResizeArchStart({ x: e.clientX, y: e.clientY });
    setResizeArchData({
      x: item.x,
      y: item.y,
      initialWidth: item.width,
      initialHeight: item.height,
      initialX: item.x,
      initialY: item.y
    });
  };
 
  const startResizingTouch = (e: React.TouchEvent, id: string, edge: 'start' | 'end' | 'height' | 'diagonal_shape', dim: 'width' | 'height' = 'width') => {
    e.stopPropagation();
    const item = archElements.find(x => x.id === id);
    if (!item || item.locked) return;
 
    isEditingRef.current = true;
    archSnapshotRef.current = JSON.parse(JSON.stringify(archElements));
    setIsResizingArch(true);
    setResizeArchDimension(dim);
    setResizeArchEdge(edge);
    const touch = e.touches[0];
    setResizeArchStart({ x: touch.clientX, y: touch.clientY });
    setResizeArchData({
      x: item.x,
      y: item.y,
      initialWidth: item.width,
      initialHeight: item.height,
      initialX: item.x,
      initialY: item.y
    });
  };

  const isWhiteStyle = isPrintTheme || isPrintMode;

  const renderArchControls = (el: ArchElement) => {
    if (el.id !== selectedArchElementId || el.locked) return null;
    
    if (el.type === 'wall') {
      if (el.subType && el.subType.startsWith('shape_')) {
        const rx = el.width;
        const ry = el.subType === 'shape_square' ? el.width : el.height;
        return (
          <g 
            className="no-print select-none animate-fade-in"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Diagonal Resize Handle */}
            <g 
              className="cursor-se-resize pointer-events-auto"
              onMouseDown={(e) => startResizing(e, el.id, 'diagonal_shape')}
              onTouchStart={(e) => startResizingTouch(e, el.id, 'diagonal_shape')}
            >
              <circle cx={rx} cy={ry} r="14" fill="none" stroke="#d946ef" strokeWidth="1.5" strokeDasharray="3,3" className="animate-pulse" />
              <circle cx={rx} cy={ry} r="9" fill="#d946ef" stroke="#ffffff" strokeWidth="2" className="shadow-lg hover:scale-125 transition-all" />
              <path d={`M ${rx - 4} ${ry - 4} L ${rx + 4} ${ry + 4} M ${rx - 4} ${ry + 4} L ${rx + 4} ${ry - 4}`} stroke="#ffffff" strokeWidth="1" fill="none" />
              <title>تغییر ابعاد قطری فضا</title>
            </g>
          </g>
        );
      }

      const rx_end = el.width;
      const ry_end = el.height / 2;
      const rx_start = 0;
      const ry_start = el.height / 2;

      return (
        <g 
          className="no-print select-none animate-fade-in"
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* A. Start Length Handle */}
          <g 
            className="cursor-pointer pointer-events-auto"
            onMouseDown={(e) => startResizing(e, el.id, 'start')}
            onTouchStart={(e) => startResizingTouch(e, el.id, 'start')}
          >
            <circle cx={rx_start} cy={ry_start} r="11" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3,3" className="animate-pulse" />
            <circle cx={rx_start} cy={ry_start} r="8" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" className="shadow-md hover:scale-125 transition-all" />
            <path d={`M ${rx_start - 3} ${ry_start} L ${rx_start + 3} ${ry_start}`} stroke="#ffffff" strokeWidth="0.8" fill="none" />
            <title>تغییر طول دیوار از ابتدا</title>
          </g>

          {/* B. End Length Handle */}
          <g 
            className="cursor-pointer pointer-events-auto"
            onMouseDown={(e) => startResizing(e, el.id, 'end')}
            onTouchStart={(e) => startResizingTouch(e, el.id, 'end')}
          >
            <circle cx={rx_end} cy={ry_end} r="11" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3,3" className="animate-pulse" />
            <circle cx={rx_end} cy={ry_end} r="8" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" className="shadow-md hover:scale-125 transition-all" />
            <path d={`M ${rx_end - 3} ${ry_end} L ${rx_end + 3} ${ry_end}`} stroke="#ffffff" strokeWidth="0.8" fill="none" />
            <title>تغییر طول دیوار از انتها</title>
          </g>
        </g>
      );
    }
    return null;
  };

  // PDF Export
  const handleExportJPG = async () => {
    setIsPrintMode(true);
    setSelectedArchElementId(null);
    setTimeout(async () => {
      const container = containerRef.current;
      if (!container) {
        setIsPrintMode(false);
        return;
      }
      try {
        const canvas = await html2canvas(container, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          onclone: (clonedDoc) => {
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach(element => {
              const htmlEl = element as HTMLElement;
              if (htmlEl.style) {
                for (let i = 0; i < htmlEl.style.length; i++) {
                  const prop = htmlEl.style[i];
                  const value = htmlEl.style.getPropertyValue(prop);
                  if (value && (value.includes('oklch') || value.includes('oklab'))) {
                    htmlEl.style.removeProperty(prop);
                  }
                }
              }
              ['color', 'background-color', 'border-color', 'fill', 'stroke'].forEach(attr => {
                const val = window.getComputedStyle(element).getPropertyValue(attr);
                if (val && (val.includes('oklch') || val.includes('oklab'))) {
                  htmlEl.style.setProperty(attr, 'unset', 'important');
                }
              });
            });
          }
        });
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        if (Capacitor.isNativePlatform()) {
          const filename = `Architectural_Plan_${Date.now()}.jpg`;
          const base64Data = dataUrl.split(',')[1];
          const result = await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Cache
          });
          await Share.share({
            title: 'پلان معماری دو بعدی',
            text: 'طراحی پلان معماری صادر شده از اپلیکیشن گاسینو',
            url: result.uri,
            dialogTitle: 'اشتراک‌گذاری تصویر پلان'
          });
        } else {
          const l = document.createElement('a');
          l.download = `Gasino_Plan_${Date.now()}.jpg`;
          l.href = dataUrl;
          l.click();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsPrintMode(false);
      }
    }, 450);
  };

  const handleExportPDF = async () => {
    const prevScale = scale;
    const prevOffsetX = offsetX;
    const prevOffsetY = offsetY;

    setIsGeneratingPDF(true);
    setIsPrintMode(true);

    // Calculate bounding box of all elements in coordinate space to perfectly autotarget and center
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    archElements.forEach(el => {
      const x = el.x;
      const y = el.y;
      const w = el.width || 0;
      const h = el.height || 0;
      
      const rad = ((el.rotation || 0) * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      
      const projW = w * cos + h * sin;
      const projH = w * sin + h * cos;
      
      const halfW = projW / 2;
      const halfH = projH / 2;
      
      const elMinX = Math.min(x, x - halfW, x + halfW);
      const elMaxX = Math.max(x, x + projW, x + halfW);
      const elMinY = Math.min(y, y - halfH, y + halfH);
      const elMaxY = Math.max(y, y + projH, y + halfH);

      minX = Math.min(minX, elMinX);
      maxX = Math.max(maxX, elMaxX);
      minY = Math.min(minY, elMinY);
      maxY = Math.max(maxY, elMaxY);
    });

    if (archElements.length === 0 || minX === Infinity) {
      minX = 100;
      maxX = 700;
      minY = 100;
      maxY = 500;
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const targetWidth = 1426;
    const targetHeight = 1008;

    // Center the content on our virtual layout at 1:1 scale (since scale is forced to 48)
    const targetOffsetX = (targetWidth / 2) - centerX;
    const targetOffsetY = (targetHeight / 2) - centerY;

    setScale(48); // Set scale to 48 so 1px = 1/48 of a meter (yielding exactly 1:100 scale on physical layout)
    setOffsetX(targetOffsetX);
    setOffsetY(targetOffsetY);
    setSelectedArchElementId(null);

    setTimeout(async () => {
      const container = containerRef.current;
      if (!container) {
        setIsGeneratingPDF(false);
        setIsPrintMode(false);
        setScale(prevScale);
        setOffsetX(prevOffsetX);
        setOffsetY(prevOffsetY);
        return;
      }
      try {
        // Apply temporary fixed width/height on container to capture complete landscape A4 document area
        container.style.width = `${targetWidth}px`;
        container.style.height = `${targetHeight}px`;

        const canvas = await html2canvas(container, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          width: targetWidth,
          height: targetHeight,
          onclone: (clonedDoc) => {
            // Strip dark mode on clone to force pristine crisp white background everywhere
            try {
              clonedDoc.documentElement.classList.remove('dark');
              clonedDoc.body.classList.remove('dark');
            } catch (e) {}

            const clonedContainer = clonedDoc.getElementById('pdf-capture-container');
            if (clonedContainer) {
              try {
                clonedContainer.style.setProperty('background-color', '#ffffff', 'important');
                clonedContainer.style.setProperty('background', '#ffffff', 'important');
                clonedContainer.classList.remove('rounded-[2.5rem]', 'border', 'shadow-inner');
                clonedContainer.style.setProperty('border', 'none', 'important');
                clonedContainer.style.setProperty('border-radius', '0px', 'important');
                clonedContainer.style.setProperty('box-shadow', 'none', 'important');
              } catch (e) {}
            }

            // Remove any no-print control elements so they do not show up in the final PDF
            const noPrintElements = clonedDoc.querySelectorAll('.no-print');
            noPrintElements.forEach(el => el.remove());

            // Force-strip oklch colors that crash html2canvas, making screenshots black or blank
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach(element => {
              const htmlEl = element as HTMLElement;
              if (htmlEl.style) {
                try {
                  for (let i = 0; i < htmlEl.style.length; i++) {
                    const prop = htmlEl.style[i];
                    const value = htmlEl.style.getPropertyValue(prop);
                    if (value && (value.includes('oklch') || value.includes('oklab'))) {
                      htmlEl.style.removeProperty(prop);
                    }
                  }
                } catch (e) {}
              }

              const computedView = clonedDoc.defaultView || window;
              ['color', 'background-color', 'border-color', 'fill', 'stroke'].forEach(attr => {
                try {
                  const val = computedView.getComputedStyle(element).getPropertyValue(attr);
                  if (val && (val.includes('oklch') || val.includes('oklab'))) {
                    htmlEl.style.setProperty(attr, 'unset', 'important');
                  }
                } catch (e) {}
              });
            });
          }
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        const pdfW = pdf.internal.pageSize.getWidth(); // 297 mm
        const pdfH = pdf.internal.pageSize.getHeight(); // 210 mm
        
        // At 1426x1008 virtual resolution with 48px coordinate = 1cm paper scale,
        // it fills the A4 landscape sheet exactly perfectly edge to edge!
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
        
        const fileName = `Gasino_Architecture_Plan_${Date.now()}.pdf`;
        if (Capacitor.isNativePlatform()) {
          try {
            const output = pdf.output('datauristring');
            const base64Data = output.split(',')[1];
            let result;
            try {
              result = await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Documents
              });
            } catch (writeErr) {
              result = await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Cache
              });
            }
            await Share.share({
              title: 'فایل PDF پلان معماری دو بعدی',
              text: 'پلان معماری بهینه شده صادر شده از گاسینو',
              url: result.uri,
              dialogTitle: 'اشتراک‌گذاری نقشه PDF'
            });
          } catch (mobileErr) {
            console.error('Mobile share failed, falling back to basic download', mobileErr);
            pdf.save(fileName);
          }
        } else {
          pdf.save(fileName);
        }
      } catch (err) {
        console.error('PDF export crashed:', err);
      } finally {
        setIsGeneratingPDF(false);
        setIsPrintMode(false);
        setIsPrintModalOpen(false);
        setScale(prevScale); // Restore user's previous zoom scale
        setOffsetX(prevOffsetX); // Restore user's previous zoom offset
        setOffsetY(prevOffsetY);
        if (containerRef.current) {
          containerRef.current.style.width = '';
          containerRef.current.style.height = '';
        }
      }
    }, 450);
  };

  const handleSaveCustomPlan = () => {
    const name = planNameInput.trim();
    if (!name) return;
    const item: SavedPlan = {
      id: `plan-${Date.now()}`,
      name,
      createdAt: new Date().toLocaleDateString('fa-IR'),
      archElements: JSON.parse(JSON.stringify(archElements))
    };
    setSavedPlans([item, ...savedPlans]);
    setPlanNameInput('');
  };

  const handleLoadCustomPlan = (id: string) => {
    const found = savedPlans.find(x => x.id === id);
    if (found) {
      setArchElements(found.archElements);
      setSelectedArchElementId(null);
    }
  };

  const handleDeleteCustomPlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedPlans(savedPlans.filter(x => x.id !== id));
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#070b13] p-1.5 md:p-6 flex flex-col gap-5 select-none" style={{ direction: 'rtl' }}>
      
      {/* Header Info Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.2rem] p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-650/10 hover:bg-indigo-650/15 flex items-center justify-center transition-all">
            <LayoutGrid className="w-6.5 h-6.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>طراحی و ترسیم پلان معماری دو بعدی (۲D)</span>
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold block mt-1">
              ترسیم دیوارهای داخلی، خارجی، بازشو، پنجره و راه‌پله با ابعاد فیزیکی دقیق سانتیمتر
            </p>
          </div>
        </div>

        <div className="flex flex-row items-center justify-center gap-2 flex-nowrap md:shrink-0 w-full md:w-auto">
          {/* Print configuration toggles */}
          <button 
            type="button"
            onClick={() => setIsPrintTheme(!isPrintTheme)}
            className={`px-3 py-2 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              isPrintTheme 
                ? 'bg-slate-900 border-slate-800 text-white' 
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
            }`}
          >
            <Grid className="w-4 h-4 text-slate-500" />
            <span>تم پیش‌نمایش: {isPrintTheme ? 'طرح چاپی' : 'طرح مهندسی'}</span>
          </button>

          <button 
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 active:scale-95 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-2 shadow-md shadow-indigo-650/10 transition-all shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>دانلود نقشه پلان</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* Left Interactive SVG Stage Workspace Canvas Panel */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div 
            ref={containerRef}
            id="pdf-capture-container"
            className={`w-full h-[620px] rounded-[2.5rem] relative overflow-hidden border shadow-inner group/canvas object-cover flex select-none ${
              isWhiteStyle
                ? 'bg-white border-slate-300'
                : 'bg-[#070b13] border-slate-850 shadow-[inset_0_4px_30px_rgba(0,0,0,0.4)]'
            }`}
          >
            {/* Soft architectural compass on background */}
            <div className="absolute top-5 right-5 z-10 pointer-events-none select-none opacity-40">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 border rounded-full flex items-center justify-center font-mono text-[9px] font-black ${isWhiteStyle ? 'border-slate-200 text-slate-400' : 'border-slate-800 text-slate-600'}`}>N</div>
                <div className={`h-4.5 w-0.5 ${isWhiteStyle ? 'bg-slate-200' : 'bg-slate-800'}`} />
              </div>
            </div>

            {/* Premium Floating Capsule Menu (Matching User Mockup Image) */}
            {activeToolbarMenu === 'plan_items' && (
              <div style={{ direction: 'rtl' }} className="absolute top-4 left-1/2 -translate-x-1/2 z-35 no-print flex flex-col items-center gap-2 max-w-[calc(100%-1.5rem)] md:max-w-xl animate-fade-in select-none">
                {/* Main capsule bar (RTL sequence: دیوار -> درب -> پنجره -> پله -> عنوان) */}
                <div className="bg-[#191f2e] dark:bg-[#090d16] border border-slate-755/90 dark:border-slate-805 px-3 md:px-4 py-1 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-1.5 md:gap-2.5 transition-all duration-300">
                  
                  {/* Item 1: دیوار */}
                  <button
                    type="button"
                    onClick={() => setActiveCapsuleCategory(activeCapsuleCategory === 'wall' ? null : 'wall')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                      activeCapsuleCategory === 'wall'
                        ? 'bg-indigo-650/30 text-indigo-400 font-extrabold border border-indigo-500/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] shadow-[0_0_6px_rgba(99,102,241,0.7)] hover:scale-110 transition-transform" />
                    <span className="text-[10px] md:text-[10.5px] font-black">دیوار</span>
                  </button>

                  <div className="w-px h-3 bg-slate-800/60" />

                  {/* Item 2: درب */}
                  <button
                    type="button"
                    onClick={() => setActiveCapsuleCategory(activeCapsuleCategory === 'door' ? null : 'door')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                      activeCapsuleCategory === 'door'
                        ? 'bg-rose-600/30 text-rose-400 font-extrabold border border-rose-500/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e] shadow-[0_0_6px_rgba(244,63,94,0.7)] hover:scale-110 transition-transform" />
                    <span className="text-[10px] md:text-[10.5px] font-black">درب</span>
                  </button>

                  <div className="w-px h-3 bg-slate-800/60" />

                  {/* Item 3: پنجره */}
                  <button
                    type="button"
                    onClick={() => setActiveCapsuleCategory(activeCapsuleCategory === 'window' ? null : 'window')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                      activeCapsuleCategory === 'window'
                        ? 'bg-blue-600/30 text-blue-400 font-extrabold border border-blue-500/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] shadow-[0_0_6px_rgba(59,130,246,0.7)] hover:scale-110 transition-transform" />
                    <span className="text-[10px] md:text-[10.5px] font-black">پنجره</span>
                  </button>

                  <div className="w-px h-3 bg-slate-800/60" />

                  {/* Item 4: پله */}
                  <button
                    type="button"
                    onClick={() => setActiveCapsuleCategory(activeCapsuleCategory === 'stairs' ? null : 'stairs')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                      activeCapsuleCategory === 'stairs'
                        ? 'bg-emerald-600/30 text-emerald-400 font-extrabold border border-emerald-500/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_6px_rgba(16,185,129,0.7)] hover:scale-110 transition-transform" />
                    <span className="text-[10px] md:text-[10.5px] font-black">پله</span>
                  </button>

                  <div className="w-px h-3 bg-slate-800/60" />

                  {/* Item 5: عنوان */}
                  <button
                    type="button"
                    onClick={() => setActiveCapsuleCategory(activeCapsuleCategory === 'label' ? null : 'label')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                      activeCapsuleCategory === 'label'
                        ? 'bg-fuchsia-600/30 text-fuchsia-400 font-extrabold border border-fuchsia-500/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d946ef] shadow-[0_0_6px_rgba(217,70,239,0.7)] hover:scale-110 transition-transform" />
                    <span className="text-[10px] md:text-[10.5px] font-black">عنوان</span>
                  </button>

                </div>

                {/* Submenus aligned underneath */}
                {activeCapsuleCategory === 'wall' && (
                  <div className="bg-[#151a26]/95 dark:bg-[#070b13]/95 backdrop-blur-md border border-indigo-500/30 px-2 py-1 rounded-xl shadow-lg flex items-center gap-1.5 animate-scale-up">
                    <button
                      type="button"
                      onClick={() => {
                        handleAddWall(10);
                        setActiveCapsuleCategory(null);
                        setActiveToolbarMenu(null);
                      }}
                      className="px-2 py-1 bg-slate-805 hover:bg-indigo-600 hover:text-white text-slate-100 text-[9.5px] font-bold rounded-lg transition-all cursor-pointer active:scale-95"
                    >
                      🧱 دیوار ۱۰ سانت
                    </button>
                    <div className="w-px h-3 bg-slate-700/60" />
                    <button
                      type="button"
                      onClick={() => {
                        handleAddWall(20);
                        setActiveCapsuleCategory(null);
                        setActiveToolbarMenu(null);
                      }}
                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-550 text-white text-[9.5px] font-bold rounded-lg transition-all cursor-pointer active:scale-95 shadow-md shadow-indigo-650/20"
                    >
                      🧱 دیوار ۲۰ سانت
                    </button>
                  </div>
                )}

                {activeCapsuleCategory === 'door' && (
                  <div className="bg-[#151a26]/95 dark:bg-[#070b13]/95 backdrop-blur-md border border-rose-500/30 px-2 py-1 rounded-xl shadow-lg flex items-center gap-1.5 animate-scale-up">
                    <button
                      type="button"
                      onClick={() => {
                        handleAddDoor('single');
                        setActiveCapsuleCategory(null);
                        setActiveToolbarMenu(null);
                      }}
                      className="px-2 py-1 bg-rose-600 hover:bg-rose-550 text-white text-[9.5px] font-bold rounded-lg transition-all cursor-pointer active:scale-95 shadow-md shadow-rose-600/20"
                    >
                      🚪 درب یک لنگه
                    </button>
                    <div className="w-px h-3 bg-slate-700/60" />
                    <button
                      type="button"
                      onClick={() => {
                        handleAddDoor('double');
                        setActiveCapsuleCategory(null);
                        setActiveToolbarMenu(null);
                      }}
                      className="px-2 py-1 bg-slate-805 hover:bg-slate-700 hover:text-rose-455 text-slate-100 text-[9.5px] font-bold rounded-lg transition-all cursor-pointer active:scale-95"
                    >
                      🚪 درب دو لنگه
                    </button>
                  </div>
                )}

                {activeCapsuleCategory === 'window' && (
                  <div className="bg-[#151a26]/95 dark:bg-[#070b13]/95 backdrop-blur-md border border-blue-500/30 px-2 py-1 rounded-xl shadow-lg flex items-center gap-1.5 animate-scale-up">
                    <button
                      type="button"
                      onClick={() => {
                        handleAddWindow('single');
                        setActiveCapsuleCategory(null);
                        setActiveToolbarMenu(null);
                      }}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-550 text-white text-[9.5px] font-bold rounded-lg transition-all cursor-pointer active:scale-95 shadow-md shadow-blue-600/20"
                    >
                      🪟 پنجره تک لنگه
                    </button>
                    <div className="w-px h-3 bg-slate-700/60" />
                    <button
                      type="button"
                      onClick={() => {
                        handleAddWindow('double');
                        setActiveCapsuleCategory(null);
                        setActiveToolbarMenu(null);
                      }}
                      className="px-2 py-1 bg-slate-805 hover:bg-slate-700 hover:text-blue-455 text-slate-100 text-[9.5px] font-bold rounded-lg transition-all cursor-pointer active:scale-95"
                    >
                      🪟 پنجره دو لنگه
                    </button>
                  </div>
                )}

                {activeCapsuleCategory === 'stairs' && (
                  <div className="bg-[#151a26]/95 dark:bg-[#070b13]/95 backdrop-blur-md border border-emerald-500/30 px-2 py-1 rounded-xl shadow-lg flex items-center gap-1.5 animate-scale-up">
                    <button
                      type="button"
                      onClick={() => {
                        handleAddStairs('straight');
                        setActiveCapsuleCategory(null);
                        setActiveToolbarMenu(null);
                      }}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-555 text-white text-[9.5px] font-bold rounded-lg transition-all cursor-pointer active:scale-95 shadow-md shadow-emerald-650/20"
                    >
                      🪜 پله مستقیم
                    </button>
                    <div className="w-px h-3 bg-slate-700/60" />
                    <button
                      type="button"
                      onClick={() => {
                        handleAddStairs('spiral');
                        setActiveCapsuleCategory(null);
                        setActiveToolbarMenu(null);
                      }}
                      className="px-2 py-1 bg-slate-805 hover:bg-slate-700 hover:text-emerald-455 text-slate-100 text-[9.5px] font-bold rounded-lg transition-all cursor-pointer active:scale-95"
                    >
                      🌀 پله گرد
                    </button>
                  </div>
                )}

                {activeCapsuleCategory === 'label' && (
                  <div className="bg-[#151a26]/95 dark:bg-[#070b13]/95 backdrop-blur-md border border-fuchsia-500/30 px-2.5 py-2 rounded-xl shadow-lg flex flex-col gap-1.5 animate-scale-up w-52">
                    <div className="text-[9px] text-slate-400 font-extrabold pb-0.5 border-b border-slate-800">
                      <span>انتخاب عنوان سریع فضا:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 block">
                      {[
                        'اتاق خواب',
                        'حال پذیرایی',
                        'آشپزخانه',
                        'حمام',
                        'دستشویی',
                        'بالکن'
                      ].map((title) => (
                        <button
                          key={title}
                          type="button"
                          onClick={() => {
                            handleAddLabel(title);
                            setActiveCapsuleCategory(null);
                            setActiveToolbarMenu(null);
                          }}
                          className="px-1.5 py-1 bg-slate-805 hover:bg-fuchsia-600 hover:text-white text-slate-200 text-[9px] font-bold rounded-md transition-all cursor-pointer text-center"
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleAddLabel();
                        setActiveCapsuleCategory(null);
                        setActiveToolbarMenu(null);
                      }}
                      className="w-full mt-1.5 py-1 bg-fuchsia-600 hover:bg-fuchsia-550 text-white text-[9px] font-black rounded-lg transition-all cursor-pointer text-center"
                    >
                      ➕ عنوان سفارشی
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Float HUD controls inside blackboard */}
            <div className="absolute right-4 bottom-4 z-10 flex items-center gap-1.5 no-print">
              <button 
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 border ${
                  showGrid
                    ? 'bg-indigo-600 hover:bg-indigo-550 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title={showGrid ? "غیرفعال‌سازی شبکه راهنما" : "فعال‌سازی شبکه راهنما"}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button"
                onClick={handleUndo}
                disabled={archHistory.length === 0}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 border ${
                  archHistory.length > 0
                    ? 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-600/20'
                    : 'bg-slate-900/90 border-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
                }`}
                title="بازگشت به حرکت قبل (واگرد - Ctrl+Z)"
              >
                <Undo className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setScale(s => Math.min(180, s + 6))} 
                className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-white flex items-center justify-center text-sm font-black active:scale-95 cursor-pointer"
                title="بزرگنمایی"
              >
                +
              </button>
              <button 
                onClick={() => setScale(s => Math.max(12, s - 6))} 
                className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-white flex items-center justify-center text-sm font-black active:scale-95 cursor-pointer"
                title="کوچکنمایی"
              >
                -
              </button>
              <button 
                onClick={handleAutoFit} 
                className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-white flex items-center justify-center active:scale-95 cursor-pointer"
                title="تنظیمات پیش‌فرض دوربین"
              >
                <Maximize className="w-3.5 h-3.5 text-slate-300" />
              </button>
            </div>

            {/* Floating Quick Drafting Toolbar (دسترسی سریع افزودن و حذف اجزا در کادر طراحی) - منتقل شده به بالای صفحه */}
            <div className="absolute left-4 top-4 z-20 flex flex-col items-start gap-1.5 no-print max-w-[calc(100%-2rem)]">
              {/* Category selector */}
              <div className="bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800 text-white p-0.5 rounded-2xl flex items-center gap-1 shadow-2xl">
                <div className="px-2 text-[8px] font-black text-slate-400 border-l border-slate-800/80 select-none hidden md:block">
                  منوی ابزار:
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setActiveToolbarMenu(activeToolbarMenu === 'space_layout' ? null : 'space_layout');
                    setActiveCapsuleCategory(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[9.5px] font-black transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${activeToolbarMenu === 'space_layout' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-200'}`}
                  title="طرح فضا (مربع، مستطیل، خطوط)"
                >
                  <span className="w-2.5 h-2.5 rounded bg-indigo-400 block" />
                  <span>۱- طرح فضا</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = activeToolbarMenu === 'plan_items' ? null : 'plan_items';
                    setActiveToolbarMenu(next);
                    if (next === 'plan_items') {
                      setActiveCapsuleCategory('wall');
                    } else {
                      setActiveCapsuleCategory(null);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[9.5px] font-black transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${activeToolbarMenu === 'plan_items' ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-200'}`}
                  title="آیتم‌های پلان (دیوار، درب، پنجره، برچسب)"
                >
                  <span className="w-2.5 h-2.5 rounded bg-emerald-400 block" />
                  <span>۲- آیتم‌های پلان</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveToolbarMenu(activeToolbarMenu === 'gas_equipment' ? null : 'gas_equipment');
                    setActiveCapsuleCategory(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[9.5px] font-black transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${activeToolbarMenu === 'gas_equipment' ? 'bg-amber-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-200'}`}
                  title="تجهیزات گازی پلان"
                >
                  <span className="w-2.5 h-2.5 rounded bg-amber-400 block" />
                  <span>۳- تجهیزات گازی</span>
                </button>
              </div>

              {/* Toolbar Dropdown Container */}
              {activeToolbarMenu && activeToolbarMenu !== 'plan_items' && (
                <div className="bg-[#0f172a] dark:bg-[#070b13] border border-slate-800 text-white p-2 rounded-2xl flex flex-col gap-1.5 shadow-2xl animate-fade-in z-30 max-w-[calc(100vw-3.5rem)] md:max-w-xl flex-wrap">
                  
                  {/* Space Layout submenu */}
                  {activeToolbarMenu === 'space_layout' && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[8.5px] text-indigo-400 font-extrabold pr-0.5 select-none font-sans">بخش فضا:</span>
                      
                      <button
                        type="button"
                        onClick={() => {
                          handleAddSpaceShape('shape_square');
                          setActiveToolbarMenu(null);
                        }}
                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-550 rounded-lg text-[9px] font-black transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <span className="w-1.5 h-1.5 rounded bg-white block" />
                        <span>مربع (تغییر قطری)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleAddSpaceShape('shape_rect');
                          setActiveToolbarMenu(null);
                        }}
                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-550 rounded-lg text-[9px] font-black transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <span className="w-2 h-1.5 rounded bg-white block" />
                        <span>مستطیل</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleAddSpaceShape('shape_triangle');
                          setActiveToolbarMenu(null);
                        }}
                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-555 rounded-lg text-[9px] font-black transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <span className="w-1.5 h-1.5 bg-white block" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                        <span>مثلث</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleAddSpaceShape('shape_pentagon');
                          setActiveToolbarMenu(null);
                        }}
                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-570 rounded-lg text-[9px] font-black transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <span className="w-2 h-2 rounded-full bg-white block" />
                        <span>پنج‌ضلعی</span>
                      </button>

                      <div className="h-4 w-[1px] bg-slate-800 mx-1" />

                      <button
                        type="button"
                        onClick={() => {
                          handleAddSpaceShape('thin');
                          setActiveToolbarMenu(null);
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-705 rounded-lg text-[9px] font-black transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <span className="w-2.5 h-[1.5px] bg-slate-400 block" />
                        <span>خط باریک</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleAddSpaceShape('dashed');
                          setActiveToolbarMenu(null);
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-705 rounded-lg text-[9px] font-black transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <span className="w-2.5 h-[1px] border-b border-dashed border-slate-400 block" />
                        <span>خط‌چین</span>
                      </button>
                    </div>
                  )}

                  {/* Gas Equipment submenu */}
                  {activeToolbarMenu === 'gas_equipment' && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[8px] text-amber-400 font-extrabold pr-0.5 select-none font-sans">افزودن قطعه:</span>
                      {[
                        { key: 'valve', label: 'شیر قطع‌کن', color: 'bg-amber-600/20 text-amber-300 hover:bg-amber-600/30' },
                        { key: 'yard_valve', label: 'شیر حیاط (RC)', color: 'bg-amber-600/20 text-amber-300 hover:bg-amber-600/30' },
                        { key: 'meter', label: 'کنتور گاز', color: 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30' },
                        { key: 'regulator', label: 'رگولاتور', color: 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30' },
                        { key: 'heater', label: 'بخاری (GC)', color: 'bg-rose-600/20 text-rose-300 hover:bg-rose-600/30' },
                        { key: 'boiler', label: 'پکیج (BP)', color: 'bg-rose-600/20 text-rose-300 hover:bg-rose-600/30' },
                        { key: 'water_heater', label: 'آبگرمکن دیواری (BP)', color: 'bg-rose-600/20 text-rose-300 hover:bg-rose-600/30' },
                        { key: 'floor_water_heater', label: 'آبگرمکن زمینی (WH)', color: 'bg-rose-600/20 text-rose-300 hover:bg-rose-600/30' },
                        { key: 'stove', label: 'اجاق گاز (GC)', color: 'bg-rose-600/20 text-rose-300 hover:bg-rose-600/30' },
                        { key: 'ventilation', label: 'تهویه', color: 'bg-sky-600/20 text-sky-300 hover:bg-sky-600/30' },
                        { key: 'chimney', label: 'دودکش', color: 'bg-orange-600/20 text-orange-300 hover:bg-orange-600/30' }
                      ].map((eq) => (
                        <button
                          key={eq.key}
                          type="button"
                          onClick={() => {
                            handleAddEquipment(eq.key);
                            setActiveToolbarMenu(null);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-all cursor-pointer active:scale-95 ${eq.color}`}
                        >
                          {eq.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

                {/* Contextual Selection Action Bar */}
                {selectedArchElementId && (() => {
                  const el = archElements.find(x => x.id === selectedArchElementId);
                  if (!el) return null;
                  return (
                    <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 text-white p-0.5 rounded-xl flex items-center gap-0.5 shadow-lg animate-fade-in z-45 font-sans">
                    <div className="px-1 border-l border-slate-800/80 flex flex-col justify-center text-right select-none">
                      <span className="text-[6.5px] text-slate-500 font-bold leading-none block">
                        {el.type === 'wall' ? 'دیوار' : el.type === 'stairs' ? 'پله' : el.type === 'door' ? 'درب' : el.type === 'window' ? 'پنجره' : el.type === 'equipment' ? 'تجهیزات' : 'عنوان'}
                      </span>
                      <span className="text-[8px] text-indigo-300 font-black truncate max-w-[45px] block mt-0.5" title={el.name}>
                        {el.name}
                      </span>
                    </div>

                    {/* General Element Lock Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setArchElements(prev => prev.map(item => item.id === el.id ? { ...item, locked: !item.locked } : item));
                      }}
                      className={`p-0.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                        el.locked 
                          ? 'bg-amber-600 border border-amber-500 text-white shadow-sm' 
                          : 'bg-slate-800 border border-transparent hover:bg-slate-600/30 text-slate-350 hover:text-amber-400'
                      }`}
                      title={el.locked ? "باز کردن قفل" : "قفل کامل"}
                    >
                      {el.locked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                    </button>

                    {/* Precise Length Controller with +/- 10cm */}
                    <div className={`flex items-center gap-0.5 px-1 border-l border-slate-800/80 transition-opacity duration-200 ${el.locked ? 'opacity-35 pointer-events-none' : ''}`}>
                      <button
                        type="button"
                        disabled={!!el.locked}
                        onClick={() => {
                          const currentCm = Math.round((el.width / 48) * 100);
                          const nextCm = Math.max(10, currentCm - 10);
                          const nextWidth = Math.max(5, Math.round((nextCm * 48) / 100));
                          setLengthInputStr(nextCm.toString());
                          setArchElements(prev => {
                            const item = prev.find(x => x.id === el.id);
                            if (!item) return prev;
                            const updated = { 
                              ...item, 
                              width: nextWidth,
                              height: item.type === 'door' ? nextWidth : item.height
                            };
                            return propagateWallChanges(prev, el.id, updated);
                          });
                        }}
                        className="w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-black transition-all cursor-pointer active:scale-95 bg-slate-800 hover:bg-rose-600 text-slate-355 hover:text-white"
                        title="طول -۱۰"
                      >
                        -
                      </button>
                      <div className="flex items-center border border-slate-850 rounded-md px-1 py-0.5 bg-slate-950">
                        <input
                          type="text"
                          data-length-input="true"
                          disabled={!!el.locked}
                          value={lengthInputStr}
                          onChange={(e) => {
                            const cleansed = e.target.value.replace(/\D/g, '');
                            setLengthInputStr(cleansed);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              commitLengthChange(el.id, lengthInputStr);
                            }
                          }}
                          onBlur={() => {
                            handleInputBlur(el.id, lengthInputStr);
                          }}
                          className="w-8 text-center text-[9px] font-black bg-transparent border-0 outline-none text-indigo-300 p-0 focus:ring-0 font-mono disabled:text-slate-500"
                          placeholder="CM"
                          title="طول دقیق به سانتی‌متر"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={!!el.locked}
                        onClick={() => {
                          const currentCm = Math.round((el.width / 48) * 100);
                          const nextCm = currentCm + 10;
                          const nextWidth = Math.max(5, Math.round((nextCm * 48) / 100));
                          setLengthInputStr(nextCm.toString());
                          setArchElements(prev => {
                            const item = prev.find(x => x.id === el.id);
                            if (!item) return prev;
                            const updated = { 
                              ...item, 
                              width: nextWidth,
                              height: item.type === 'door' ? nextWidth : item.height
                            };
                            return propagateWallChanges(prev, el.id, updated);
                          });
                        }}
                        className="w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-black transition-all cursor-pointer active:scale-95 bg-slate-800 hover:bg-indigo-650 text-slate-355 hover:text-white"
                        title="طول +۱۰"
                      >
                        +
                      </button>
                    </div>

                    {/* Orientation Lock toggles (Only for Walls) */}
                    {el.type === 'wall' && (
                      <div className={`flex items-center gap-0.5 bg-slate-955 p-0.5 rounded-lg border border-slate-850 transition-opacity duration-200 ${el.locked ? 'opacity-35 pointer-events-none' : ''}`}>
                        <button
                          type="button"
                          onClick={() => toggleOrientationLock(el.id, 'horizontal')}
                          className={`px-1 py-0.5 text-[7px] font-black rounded-md transition-all flex items-center gap-0.5 cursor-pointer active:scale-95 ${
                            el.orientationLock === 'horizontal'
                              ? 'bg-amber-600/90 text-white shadow-sm font-black'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                          }`}
                          title="رو به افقی"
                        >
                          <ArrowLeftRight className="w-2 h-2" />
                          <span>افقی</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleOrientationLock(el.id, 'vertical')}
                          className={`px-1 py-0.5 text-[7px] font-black rounded-md transition-all flex items-center gap-0.5 cursor-pointer active:scale-95 ${
                            el.orientationLock === 'vertical'
                              ? 'bg-amber-600/90 text-white shadow-sm font-black'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                          }`}
                          title="رو به عمودی"
                        >
                          <ArrowUpDown className="w-2 h-2" />
                          <span>عمودی</span>
                        </button>
                      </div>
                    )}

                    {/* Quick 90 deg rotate */}
                    <button
                      type="button"
                      disabled={!!el.locked}
                      onClick={() => {
                        setArchElements(prev => {
                          const item = prev.find(x => x.id === el.id);
                          if (!item) return prev;
                          const updated = { ...item, rotation: (item.rotation + 90) % 360 };
                          return propagateWallChanges(prev, el.id, updated);
                        });
                      }}
                      className={`p-1 rounded-md transition-all cursor-pointer active:scale-95 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white ${el.locked ? 'opacity-35 pointer-events-none' : ''}`}
                      title="چرخش ۹۰ درجه سریع"
                    >
                      <RotateCw className="w-2.5 h-2.5" />
                    </button>

                    {/* Immediate Delete button */}
                    <button
                      type="button"
                      disabled={!!el.locked}
                      onClick={() => handleDeleteArchElement(el.id)}
                      className={`p-1 rounded-md transition-all cursor-pointer active:scale-95 ${
                        el.locked
                          ? 'bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed opacity-35'
                          : 'bg-rose-950/70 hover:bg-rose-600 border border-rose-900/40 hover:border-rose-500 text-rose-400 hover:text-white flex items-center justify-center'
                      }`}
                      title={el.locked ? "قفل باز شود" : "حذف فوری"}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Canvas Area SVGSVGElement */}
            <svg
              width="100%"
              height="100%"
              className="absolute inset-0"
              style={{ touchAction: 'none' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* References Definitions */}
              <defs>
                <pattern id="plan-dot-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <circle cx="1.5" cy="1.5" r="1.5" fill={isWhiteStyle ? "rgba(15, 23, 42, 0.18)" : "rgba(255, 255, 255, 0.35)"} />
                </pattern>
              </defs>

              {/* Dot Grid Background */}
              {showGrid && !isPrintMode && (
                <rect width="100%" height="100%" fill="url(#plan-dot-grid)" className="transition-opacity" />
              )}

              {/* Horizontal / Vertical coordinate watermark */}
              <g transform={`translate(${offsetX}, ${offsetY})`} stroke={isWhiteStyle ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.04)"} strokeWidth="1" strokeDasharray="4,4">
                <line x1="-1200" y1="0" x2="1200" y2="0" />
                <line x1="0" y1="-1200" x2="0" y2="1200" />
              </g>

              {/* Graphical architectural layers grouping */}
              <g transform={`translate(${offsetX}, ${offsetY}) scale(${scale / 48})`}>
                
                {/* Visual elements mapping */}
                {[...archElements].sort((a, b) => {
                  const order = { wall: 1, stairs: 2, equipment: 3, door: 4, window: 5, label: 6 };
                  return (order[a.type] || 99) - (order[b.type] || 99);
                }).map((el) => {
                  const isSelected = el.id === selectedArchElementId;
                  const selectGlow = (isSelected && el.type !== 'equipment') ? (
                    <rect
                      x={el.type === 'wall' || el.type === 'stairs' ? -5 : -el.width/2 - 5}
                      y={el.type === 'wall' || el.type === 'stairs' ? -5 : -el.height/2 - 5}
                      width={(el.type === 'wall' || el.type === 'stairs' ? el.width : el.width) + 10}
                      height={(el.type === 'wall' || el.type === 'stairs' ? el.height : el.height) + 10}
                      fill="none"
                      stroke={el.locked ? "#f59e0b" : "#d946ef"}
                      strokeWidth="1.8"
                      strokeDasharray="4,4"
                      className="animate-pulse"
                      transform={el.type === 'wall' || el.type === 'stairs' ? `rotate(${el.rotation})` : undefined}
                    />
                  ) : null;

                  if (el.type === 'wall') {
                    if (el.subType === 'thin') {
                      return (
                        <g
                          key={el.id}
                          transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation})`}
                          className={el.locked ? "cursor-pointer group animate-fade-in" : "cursor-move group animate-fade-in"}
                          onClick={(e) => { e.stopPropagation(); setSelectedArchElementId(el.id); }}
                          onMouseDown={(e) => handleArchMouseDown(e, el)}
                          onTouchStart={(e) => handleArchTouchStart(e, el)}
                        >
                          {selectGlow}
                          <line
                            x1="0"
                            y1="0"
                            x2={el.width}
                            y2="0"
                            stroke={isSelected ? (el.locked ? '#f59e0b' : '#d946ef') : (isWhiteStyle ? '#1e293b' : '#38bdf8')}
                            strokeWidth={isSelected ? '4' : '2.5'}
                            className="transition-all hover:opacity-85"
                          />
                          <title>{el.name}</title>
                          {renderArchControls(el)}
                        </g>
                      );
                    }

                    if (el.subType === 'dashed') {
                      return (
                        <g
                          key={el.id}
                          transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation})`}
                          className={el.locked ? "cursor-pointer group animate-fade-in" : "cursor-move group animate-fade-in"}
                          onClick={(e) => { e.stopPropagation(); setSelectedArchElementId(el.id); }}
                          onMouseDown={(e) => handleArchMouseDown(e, el)}
                          onTouchStart={(e) => handleArchTouchStart(e, el)}
                        >
                          {selectGlow}
                          <line
                            x1="0"
                            y1="0"
                            x2={el.width}
                            y2="0"
                            stroke={isSelected ? (el.locked ? '#f59e0b' : '#d946ef') : (isWhiteStyle ? '#64748b' : '#94a3b8')}
                            strokeWidth={isSelected ? '3' : '2'}
                            strokeDasharray="4,4"
                            className="transition-all hover:opacity-85"
                          />
                          <title>{el.name}</title>
                          {renderArchControls(el)}
                        </g>
                      );
                    }

                    if (el.subType && el.subType.startsWith('shape_')) {
                      const wVal = el.width;
                      const hVal = el.subType === 'shape_square' ? el.width : el.height;
                      const wCm = Math.round((wVal / 48) * 100);
                      const hCm = Math.round((hVal / 48) * 100);

                      let shapeJsx = null;
                      const strokeColor = isSelected ? (el.locked ? '#f59e0b' : '#d946ef') : (isWhiteStyle ? '#475569' : '#cbd5e1');
                      const strokeWidth = isSelected ? '2' : '1.5';
                      const fillColor = isWhiteStyle ? 'rgba(79, 70, 229, 0.03)' : 'rgba(99, 102, 241, 0.05)';

                      if (el.subType === 'shape_square' || el.subType === 'shape_rect') {
                        shapeJsx = (
                          <>
                            <rect
                              x={0}
                              y={0}
                              width={wVal}
                              height={hVal}
                              fill={fillColor}
                              stroke={isWhiteStyle ? '#e2e8f0' : '#334155'}
                              strokeWidth="8"
                              strokeLinejoin="miter"
                            />
                            <rect
                              x={4}
                              y={4}
                              width={wVal - 8}
                              height={hVal - 8}
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth={strokeWidth}
                            />
                            <rect
                              x={8}
                              y={8}
                              width={wVal - 16}
                              height={hVal - 16}
                              fill="none"
                              stroke={isWhiteStyle ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.06)'}
                              strokeWidth="0.5"
                              strokeDasharray="2,2"
                            />
                          </>
                        );
                      } else if (el.subType === 'shape_triangle') {
                        shapeJsx = (
                          <>
                            <polygon
                              points={`${wVal / 2},4 4,${hVal - 4} ${wVal - 4},${hVal - 4}`}
                              fill={fillColor}
                              stroke={isWhiteStyle ? '#e2e8f0' : '#334155'}
                              strokeWidth="8"
                              strokeLinejoin="round"
                            />
                            <polygon
                              points={`${wVal / 2},4 4,${hVal - 4} ${wVal - 4},${hVal - 4}`}
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth={strokeWidth}
                              strokeLinejoin="round"
                            />
                          </>
                        );
                      } else if (el.subType === 'shape_pentagon') {
                        const cx = wVal / 2;
                        const cy = hVal / 2;
                        const rx = wVal / 2 - 4;
                        const ry = hVal / 2 - 4;
                        const pts = [0,1,2,3,4].map(i => {
                          const a = -Math.PI / 2 + (i * 2 * Math.PI / 5);
                          return `${cx + rx * Math.cos(a)},${cy + ry * Math.sin(a)}`;
                        }).join(' ');

                        shapeJsx = (
                          <>
                            <polygon
                              points={pts}
                              fill={fillColor}
                              stroke={isWhiteStyle ? '#e2e8f0' : '#334155'}
                              strokeWidth="8"
                              strokeLinejoin="round"
                            />
                            <polygon
                              points={pts}
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth={strokeWidth}
                              strokeLinejoin="round"
                            />
                          </>
                        );
                      }

                      return (
                        <g
                          key={el.id}
                          transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation})`}
                          className={el.locked ? "cursor-pointer group animate-fade-in" : "cursor-move group animate-fade-in"}
                          onClick={(e) => { e.stopPropagation(); setSelectedArchElementId(el.id); }}
                          onMouseDown={(e) => handleArchMouseDown(e, el)}
                          onTouchStart={(e) => handleArchTouchStart(e, el)}
                        >
                          {selectGlow}
                          {shapeJsx}

                          {/* Center text sizing metric */}
                          <text
                            x={wVal / 2}
                            y={hVal / 2}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={isSelected ? '#d946ef' : (isWhiteStyle ? '#1e293b' : '#38bdf8')}
                            style={{ fontSize: '10px', direction: 'ltr', unicodeBidi: 'bidi-override' }}
                            fontWeight="black"
                            stroke={isWhiteStyle ? '#ffffff' : '#070b13'}
                            strokeWidth="3.5"
                            paintOrder="stroke"
                            className="select-none pointer-events-none font-sans"
                          >
                            {wCm}×{hCm} cm
                          </text>

                          <title>{el.name}</title>
                          {renderArchControls(el)}
                        </g>
                      );
                    }

                    const physicalCm = Math.max(10, Math.round((el.width / 48) * 10) * 10);
                    return (
                      <g
                        key={el.id}
                        transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation})`}
                        className={el.locked ? "cursor-pointer group" : "cursor-move group"}
                        onClick={(e) => { e.stopPropagation(); setSelectedArchElementId(el.id); }}
                        onMouseDown={(e) => handleArchMouseDown(e, el)}
                        onTouchStart={(e) => handleArchTouchStart(e, el)}
                      >
                        {selectGlow}
                        <rect
                          x="0"
                          y="0"
                          width={el.width}
                          height={el.height}
                          fill={isWhiteStyle ? '#e2e8f0' : '#334155'}
                          stroke={isSelected ? (el.locked ? '#f59e0b' : '#d946ef') : (isWhiteStyle ? '#475569' : '#cbd5e1')}
                          strokeWidth={isSelected ? '2' : '1.5'}
                          className="transition-all hover:opacity-85"
                        />
                        <line
                          x1="0"
                          y1={el.height/2}
                          x2={el.width}
                          y2={el.height/2}
                          stroke={isSelected ? '#d946ef' : (isWhiteStyle ? '#94a3b8' : '#94a3b8')}
                          strokeWidth="0.8"
                          strokeDasharray="3,3"
                        />
                        {/* Elegant AutoCAD-style dimension lines outside the wall */}
                        {(() => {
                          // Find center of all walls to determine which way is "exterior"
                          let avgX = 400;
                          let avgY = 250;
                          const wallEls = archElements.filter(x => x.type === 'wall' && !x.subType);
                          if (wallEls.length > 0) {
                            let sumX = 0;
                            let sumY = 0;
                            wallEls.forEach(w => {
                              const r = ((w.rotation || 0) * Math.PI) / 180;
                              sumX += w.x + (w.width / 2) * Math.cos(r);
                              sumY += w.y + (w.width / 2) * Math.sin(r);
                            });
                            avgX = sumX / wallEls.length;
                            avgY = sumY / wallEls.length;
                          }

                          // Midpoint of current wall
                          const rad = ((el.rotation || 0) * Math.PI) / 180;
                          const midX = el.x + (el.width / 2) * Math.cos(rad);
                          const midY = el.y + (el.width / 2) * Math.sin(rad);

                          // Vector from layout center to wall midpoint
                          const planVecX = midX - avgX;
                          const planVecY = midY - avgY;

                          // Local positive Y unit vector direction in global space: (-sin(θ), cos(θ))
                          const localPositiveY_X = -Math.sin(rad);
                          const localPositiveY_Y = Math.cos(rad);

                          // Dot product determines if local positive Y points outwards
                          const dotProduct = planVecX * localPositiveY_X + planVecY * localPositiveY_Y;
                          const sideSign = dotProduct >= 0 ? 1 : -1;

                          const baseDirY = sideSign < 0 ? 0 : el.height;
                          const extDirY = baseDirY + 16 * sideSign;
                          const dimDirY = baseDirY + 11 * sideSign;
                          
                          const tickMinY = baseDirY + 7.5 * sideSign;
                          const tickMaxY = baseDirY + 14.5 * sideSign;

                          const textDirY = baseDirY + (sideSign < 0 ? -16 : 19);

                          return (
                            <g opacity="0.95" className="select-none pointer-events-none">
                              {/* Extension lines at wall endpoints extending outwards */}
                              <line
                                x1="0"
                                y1={baseDirY}
                                x2="0"
                                y2={extDirY}
                                stroke={isSelected ? '#d946ef' : (isWhiteStyle ? '#94a3b8' : '#cbd5e1')}
                                strokeWidth="0.75"
                              />
                              <line
                                x1={el.width}
                                y1={baseDirY}
                                x2={el.width}
                                y2={extDirY}
                                stroke={isSelected ? '#d946ef' : (isWhiteStyle ? '#94a3b8' : '#cbd5e1')}
                                strokeWidth="0.75"
                              />
                              {/* Main Dimension Line, parallel to the wall, slightly offset */}
                              <line
                                x1="-4"
                                y1={dimDirY}
                                x2={el.width + 4}
                                y2={dimDirY}
                                stroke={isSelected ? '#d946ef' : (isWhiteStyle ? '#94a3b8' : '#cbd5e1')}
                                strokeWidth="0.75"
                              />
                              {/* Left Architectural Tick (45-degree slanted hash at wall start) */}
                              <line
                                x1="-3.5"
                                y1={tickMinY}
                                x2="3.5"
                                y2={tickMaxY}
                                stroke={isSelected ? '#d946ef' : (isWhiteStyle ? '#475569' : '#ffffff')}
                                strokeWidth="1.5"
                              />
                              {/* Right Architectural Tick (45-degree slanted hash at wall end) */}
                              <line
                                x1={el.width - 3.5}
                                y1={tickMinY}
                                x2={el.width + 3.5}
                                y2={tickMaxY}
                                stroke={isSelected ? '#d946ef' : (isWhiteStyle ? '#475569' : '#ffffff')}
                                strokeWidth="1.5"
                              />
                              
                              {/* AutoCAD-style Label sitting directly on top of the dimension line */}
                              <text
                                x={el.width / 2}
                                y={textDirY}
                                textAnchor="middle"
                                dominantBaseline={sideSign < 0 ? 'text-after-edge' : 'text-before-edge'}
                                fill={isSelected ? '#d946ef' : (isWhiteStyle ? '#1e293b' : '#38bdf8')}
                                style={{ 
                                  fontSize: '11px', 
                                  direction: 'ltr', 
                                  unicodeBidi: 'bidi-override' 
                                }}
                                fontWeight="black"
                                stroke={isWhiteStyle ? '#ffffff' : '#070b13'}
                                strokeWidth="4.5"
                                paintOrder="stroke"
                                className="font-sans"
                              >
                                {physicalCm} cm
                              </text>
                            </g>
                          );
                        })()}

                        {/* Wall edge anchor controls */}
                        <g className="opacity-90 select-none pointer-events-none">
                          <circle cx="0" cy={el.height / 2} r="4" fill="#4f46e5" stroke="#ffffff" strokeWidth="1" />
                          <circle cx={el.width} cy={el.height / 2} r="4" fill="#4f46e5" stroke="#ffffff" strokeWidth="1" />
                        </g>

                        <title>{el.name}</title>
                        {renderArchControls(el)}
                      </g>
                    );
                  }

                  if (el.type === 'door') {
                    const doorCm = Math.round((el.width / 48) * 100);
                    const isDouble = el.subType === 'double';
                    const doorStroke = isSelected ? (el.locked ? '#f59e0b' : '#d946ef') : '#f43f5e';
                    const doorStrokeWidth = isSelected ? '3.5' : '2.5';
                    return (
                      <g
                        key={el.id}
                        transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation})`}
                        className={el.locked ? "cursor-pointer group" : "cursor-move group"}
                        onClick={(e) => { e.stopPropagation(); setSelectedArchElementId(el.id); }}
                        onMouseDown={(e) => handleArchMouseDown(e, el)}
                        onTouchStart={(e) => handleArchTouchStart(e, el)}
                      >
                        {selectGlow}
                        <rect
                          x={0}
                          y={-6}
                          width={el.width}
                          height={12}
                          fill={isWhiteStyle ? '#ffffff' : '#070b13'}
                          stroke="none"
                        />
                        <circle cx="0" cy="0" r="3.5" fill={isWhiteStyle ? '#334155' : '#94a3b8'} />
                        {isDouble && <circle cx={el.width} cy="0" r="3.5" fill={isWhiteStyle ? '#334155' : '#94a3b8'} />}
                        
                        {!isDouble ? (
                          <>
                            <path
                              d={`M ${el.width} 0 A ${el.width} ${el.width} 0 0 1 0 ${el.width}`}
                              fill="none"
                              stroke={doorStroke}
                              strokeWidth="1.2"
                              strokeDasharray="3,3"
                            />
                            <line
                              x1="0"
                              y1="0"
                              x2={el.width}
                              y2="0"
                              stroke={doorStroke}
                              strokeWidth={doorStrokeWidth}
                            />
                          </>
                        ) : (
                          <>
                            <path
                              d={`M 0 ${el.width / 2} A ${el.width / 2} ${el.width / 2} 0 0 0 ${el.width / 2} 0`}
                              fill="none"
                              stroke={doorStroke}
                              strokeWidth="1.2"
                              strokeDasharray="3,3"
                            />
                            <path
                              d={`M ${el.width} ${el.width / 2} A ${el.width / 2} ${el.width / 2} 0 0 1 ${el.width / 2} 0`}
                              fill="none"
                              stroke={doorStroke}
                              strokeWidth="1.2"
                              strokeDasharray="3,3"
                            />
                            <line
                              x1="0"
                              y1="0"
                              x2={el.width / 2}
                              y2="0"
                              stroke={doorStroke}
                              strokeWidth={doorStrokeWidth}
                            />
                            <line
                              x1={el.width}
                              y1="0"
                              x2={el.width / 2}
                              y2="0"
                              stroke={doorStroke}
                              strokeWidth={doorStrokeWidth}
                            />
                          </>
                        )}
                        <text
                          x={el.width / 2}
                          y={13}
                          textAnchor="middle"
                          dominantBaseline="hanging"
                          fill="#f43f5e"
                          style={{ 
                            fontSize: '11px', 
                            direction: 'ltr', 
                            unicodeBidi: 'bidi-override' 
                          }}
                          fontWeight="black"
                          stroke={isWhiteStyle ? '#ffffff' : '#070b13'}
                          strokeWidth="3.5"
                          paintOrder="stroke"
                          className="select-none pointer-events-none font-sans"
                        >
                          {doorCm} cm
                        </text>
                        <title>{el.name}</title>
                      </g>
                    );
                  }

                  if (el.type === 'window') {
                    const windowCm = Math.round((Math.max(el.width, el.height) / 48) * 100);
                    return (
                      <g
                        key={el.id}
                        transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation})`}
                        className={el.locked ? "cursor-pointer group" : "cursor-move group"}
                        onClick={(e) => { e.stopPropagation(); setSelectedArchElementId(el.id); }}
                        onMouseDown={(e) => handleArchMouseDown(e, el)}
                        onTouchStart={(e) => handleArchTouchStart(e, el)}
                      >
                        {selectGlow}
                        <rect
                          x={-el.width/2}
                          y={-el.height/2}
                          width={el.width}
                          height={el.height}
                          fill={isWhiteStyle ? '#ffffff' : '#070b13'}
                          stroke={isSelected ? (el.locked ? '#f59e0b' : '#d946ef') : '#3b82f6'}
                          strokeWidth={isSelected ? '2' : '1.5'}
                        />
                        <line x1={-el.width/2} y1="0" x2={el.width/2} y2="0" stroke="#60a5fa" strokeWidth="1.2" />
                        <line x1={-el.width/2} y1={-el.height/4} x2={el.width/2} y2={-el.height/4} stroke="#60a5fa" strokeWidth="0.8" opacity="0.6" />
                        <line x1={-el.width/2} y1={el.height/4} x2={el.width/2} y2={el.height/4} stroke="#60a5fa" strokeWidth="0.8" opacity="0.6" />
                        <text
                          x={0}
                          y={0}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#2563eb"
                          style={{ 
                            fontSize: '11px', 
                            direction: 'ltr', 
                            unicodeBidi: 'bidi-override' 
                          }}
                          fontWeight="black"
                          stroke={isWhiteStyle ? '#ffffff' : '#070b13'}
                          strokeWidth="3.5"
                          paintOrder="stroke"
                          className="select-none pointer-events-none font-sans"
                        >
                          {windowCm} cm
                        </text>
                        <title>{el.name}</title>
                      </g>
                    );
                  }

                  if (el.type === 'stairs') {
                     const stairsCmW = Math.round((el.width / 48) * 100);
                     const stairsCmH = Math.round((el.height / 48) * 100);
                     const isSpiral = el.subType === 'spiral';
                     const stairsStroke = isSelected ? (el.locked ? '#f59e0b' : '#d946ef') : '#10b981';
                     return (
                       <g
                         key={el.id}
                         transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation})`}
                         className={el.locked ? "cursor-pointer group" : "cursor-move group"}
                         onClick={(e) => { e.stopPropagation(); setSelectedArchElementId(el.id); }}
                         onMouseDown={(e) => handleArchMouseDown(e, el)}
                         onTouchStart={(e) => handleArchTouchStart(e, el)}
                       >
                         {selectGlow}
                         {!isSpiral ? (
                           <>
                             <rect
                               x="0"
                               y="0"
                               width={el.width}
                               height={el.height}
                               fill={isWhiteStyle ? '#fcfdfd' : '#040810'}
                               stroke={stairsStroke}
                               strokeWidth={isSelected ? '2' : '1.2'}
                             />
                             {(() => {
                               const stepsCount = Math.max(3, Math.floor(el.height / 12));
                               const stepHeight = el.height / stepsCount;
                               return Array.from({ length: stepsCount }).map((_, idx) => (
                                 <line
                                   key={idx}
                                   x1="0"
                                   y1={idx * stepHeight}
                                   x2={el.width}
                                   y2={idx * stepHeight}
                                   stroke={stairsStroke}
                                   strokeWidth="0.8"
                                   opacity="0.6"
                                 />
                               ));
                             })()}
                             <path d={`M ${el.width/2} ${el.height - 12} L ${el.width/2} 12`} fill="none" stroke="#10b981" strokeWidth="1.2" strokeDasharray="2,2" />
                             <path d={`M ${el.width/2 - 4} 16 L ${el.width/2} 12 L ${el.width/2 + 4} 16`} fill="none" stroke="#10b981" strokeWidth="1.5" />
                             <text x={el.width / 2} y={el.height - 6} fontSize="7" fontWeight="black" fill="#10b981" textAnchor="middle">UP</text>
                           </>
                         ) : (
                           <>
                             <circle
                               cx={el.width / 2}
                               cy={el.height / 2}
                               r={Math.min(el.width, el.height) / 2}
                               fill={isWhiteStyle ? '#fcfdfd' : '#040810'}
                               stroke={stairsStroke}
                               strokeWidth={isSelected ? '2' : '1.2'}
                             />
                             <circle
                               cx={el.width / 2}
                               cy={el.height / 2}
                               r="4"
                               fill="#10b981"
                             />
                             {(() => {
                               const cx = el.width / 2;
                               const cy = el.height / 2;
                               const r = Math.min(el.width, el.height) / 2;
                               const segments = 12;
                               return Array.from({ length: segments }).map((_, idx) => {
                                 const angleRad = (idx * 360 / segments) * Math.PI / 180;
                                 const x2 = cx + r * Math.cos(angleRad);
                                 const y2 = cy + r * Math.sin(angleRad);
                                 return (
                                   <line
                                     key={idx}
                                     x1={cx}
                                     y1={cy}
                                     x2={x2}
                                     y2={y2}
                                     stroke={stairsStroke}
                                     strokeWidth="0.8"
                                     opacity="0.5"
                                   />
                                 );
                               });
                             })()}
                             <path 
                               d={`M ${el.width / 2 + 10} ${el.height / 2} A 10 10 0 1 0 ${el.width / 2} ${el.height / 2 - 10}`} 
                               fill="none" 
                               stroke="#10b981" 
                               strokeWidth="1.2" 
                               strokeDasharray="2,2" 
                             />
                             <path 
                               d={`M ${el.width / 2 - 2} ${el.height / 2 - 12} L ${el.width / 2} ${el.height / 2 - 10} L ${el.width / 2 - 2} ${el.height / 2 - 8}`} 
                               fill="none" 
                               stroke="#10b981" 
                               strokeWidth="1.5" 
                             />
                           </>
                         )}
                         <text
                           x={el.width / 2}
                           y={el.height / 2}
                           textAnchor="middle"
                           dominantBaseline="central"
                           fill="#047857"
                           style={{ fontSize: '11px', direction: 'ltr', unicodeBidi: 'bidi-override' }}
                           fontWeight="black"
                           stroke={isWhiteStyle ? '#ffffff' : '#040810'}
                           strokeWidth="3.5"
                           paintOrder="stroke"
                           className="select-none pointer-events-none font-sans"
                         >
                           {stairsCmW}×{stairsCmH}
                         </text>
                         <title>{el.name}</title>
                       </g>
                     );
                  }

                  if (el.type === 'equipment') {
                    const eqColor = isSelected 
                      ? (el.locked ? '#f59e0b' : '#d946ef') 
                      : (isWhiteStyle ? '#b45309' : '#f59e0b');

                    return (
                      <g
                        key={el.id}
                        transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation})`}
                        className={el.locked ? "cursor-pointer group" : "cursor-move group"}
                        onClick={(e) => { e.stopPropagation(); setSelectedArchElementId(el.id); }}
                        onMouseDown={(e) => handleArchMouseDown(e, el)}
                        onTouchStart={(e) => handleArchTouchStart(e, el)}
                      >
                        {selectGlow}
                        <rect
                          x={Math.min(-el.width / 2, -12)}
                          y={Math.min(-el.height / 2, -12)}
                          width={Math.max(el.width, 24)}
                          height={Math.max(el.height, 24)}
                          fill="transparent"
                          stroke="none"
                          className="pointer-events-auto cursor-move"
                        />
 
                        {/* Custom Symbol based on subType */}
                        {el.subType === 'meter' && (
                          <>
                            <rect
                              x={-el.width*0.35}
                              y={-el.height*0.25}
                              width={el.width*0.7}
                              height={el.height*0.5}
                              fill="none"
                              stroke={eqColor}
                              strokeWidth="1.6"
                            />
                            <text x="0" y="3" fontSize="8" fontWeight="black" fill={eqColor} textAnchor="middle">G</text>
                          </>
                        )}
 
                        {el.subType === 'regulator' && (
                          <>
                            <circle cx="0" cy="0" r={el.width*0.3} fill="none" stroke={eqColor} strokeWidth="1.6" />
                            <path d={`M ${-el.width*0.3} 0 L ${el.width*0.3} 0`} stroke={eqColor} strokeWidth="1.6" />
                            <path d={`M ${-el.width*0.15} ${-el.height*0.2} L 0 ${-el.height*0.4} L ${el.width*0.15} ${-el.height*0.2}`} stroke={eqColor} strokeWidth="1.6" fill="none" />
                          </>
                        )}

                        {el.subType === 'ventilation' && (
                          <>
                            {/* Ventilation: square with diagonal cross inside */}
                            <rect
                              x={-el.width / 2}
                              y={-el.height / 2}
                              width={el.width}
                              height={el.height}
                              fill="none"
                              stroke={eqColor}
                              strokeWidth="1.5"
                            />
                            <line
                              x1={-el.width / 2}
                              y1={-el.height / 2}
                              x2={el.width / 2}
                              y2={el.height / 2}
                              stroke={eqColor}
                              strokeWidth="1.2"
                            />
                            <line
                              x1={el.width / 2}
                              y1={-el.height / 2}
                              x2={-el.width / 2}
                              y2={el.height / 2}
                              stroke={eqColor}
                              strokeWidth="1.2"
                            />
                            <text
                              x="0"
                              y={el.height / 2 + 10}
                              fontSize="8"
                              fontWeight="extrabold"
                              fill={eqColor}
                              textAnchor="middle"
                              stroke={isWhiteStyle ? '#ffffff' : '#070b13'}
                              strokeWidth="2.5"
                              paintOrder="stroke"
                              className="font-sans select-none pointer-events-none"
                            >
                              تهویه
                            </text>
                          </>
                        )}

                        {el.subType === 'chimney' && (
                          <>
                            {/* Chimney: circle */}
                            <circle
                              cx="0"
                              cy="0"
                              r={el.width / 2}
                              fill="none"
                              stroke={eqColor}
                              strokeWidth="1.5"
                            />
                            <text
                              x="0"
                              y={el.width / 2 + 10}
                              fontSize="8"
                              fontWeight="extrabold"
                              fill={eqColor}
                              textAnchor="middle"
                              stroke={isWhiteStyle ? '#ffffff' : '#070b13'}
                              strokeWidth="2.5"
                              paintOrder="stroke"
                              className="font-sans select-none pointer-events-none"
                            >
                              دودکش
                            </text>
                          </>
                        )}
 
                        {el.subType !== 'meter' && el.subType !== 'regulator' && el.subType !== 'ventilation' && el.subType !== 'chimney' && (
                          <>
                            {/* Standard Valve Symbol (شیر مصرف) represented by two meeting triangles */}
                            <path
                              d={`M ${-el.width*0.35} ${-el.height*0.25} L ${el.width*0.35} ${el.height*0.25} L ${el.width*0.35} ${-el.height*0.25} L ${-el.width*0.35} ${el.height*0.25} Z`}
                              fill={isWhiteStyle ? '#f59e0b' : '#fbbf24'}
                              fillOpacity="0.32"
                              stroke={eqColor}
                              strokeWidth="1.4"
                            />

                            <line
                              x1={-el.width*0.35}
                              y1={0}
                              x2={el.width*0.35}
                              y2={0}
                              stroke={eqColor}
                              strokeWidth="1.2"
                            />
                            {/* Shorthand Appliance Abbreviation */}
                            {(() => {
                              let abbrText = '';
                              if (el.subType === 'yard_valve') abbrText = 'RC';
                              else if (el.subType === 'boiler') abbrText = 'BP';
                              else if (el.subType === 'water_heater') abbrText = 'BP';
                              else if (el.subType === 'floor_water_heater') abbrText = 'WH';
                              else if (el.subType === 'stove') abbrText = 'GC';
                              else if (el.subType === 'heater') abbrText = 'H';
                              else if (el.subType === 'valve') abbrText = 'V';

                              if (!abbrText) return null;
                              return (
                                <text
                                  x="0"
                                  y={el.height * 0.48}
                                  fontSize="8"
                                  fontWeight="black"
                                  fill={eqColor}
                                  textAnchor="middle"
                                  className="font-sans select-none pointer-events-none"
                                >
                                  {abbrText}
                                </text>
                              );
                            })()}
                          </>
                        )}
                        <title>{el.name}</title>
                      </g>
                    );
                  }
 
                   if (el.type === 'label') {
                    return (
                      <g
                        key={el.id}
                        transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation})`}
                        className={el.locked ? "cursor-pointer group" : "cursor-move group"}
                        onClick={(e) => { e.stopPropagation(); setSelectedArchElementId(el.id); }}
                        onMouseDown={(e) => handleArchMouseDown(e, el)}
                        onTouchStart={(e) => handleArchTouchStart(e, el)}
                      >
                        {selectGlow}
                        <rect
                          x={-el.width/2}
                          y={-el.height/2}
                          width={el.width}
                          height={el.height}
                          fill="rgba(99, 102, 241, 0.04)"
                          stroke={isSelected ? (el.locked ? '#f59e0b' : '#d946ef') : 'rgba(99, 102, 241, 0.35)'}
                          strokeWidth={isSelected ? '1.8' : '1'}
                          strokeDasharray="2,2"
                          rx="6"
                        />
                        <text
                          x="0"
                          y="4"
                          fontSize="11"
                          fontWeight="black"
                          fill={isWhiteStyle ? '#4f46e5' : '#818cf8'}
                          fillOpacity="0.85"
                          textAnchor="middle"
                        >
                          {el.name}
                        </text>
                        <title>{el.name}</title>
                      </g>
                    );
                  }

                  return null;
                })}
              </g>
            </svg>

            {/* On-Canvas Floating Quick-Length Modifier HUD */}
            {selectedArchElementId && (() => {
              const el = archElements.find(x => x.id === selectedArchElementId);
              if (!el || el.type === 'equipment') return null;

              const calculatedScale = scale / 48;
              const rot = el.rotation || 0;
              
              // Find the center of the element in local coordinates
              let cx = el.x;
              let cy = el.y;

              if (el.type === 'wall' || el.type === 'stairs' || el.type === 'door') {
                const rad = (rot * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                const rx = el.width / 2;
                const ry = el.height / 2;
                cx = el.x + (rx * cos - ry * sin);
                cy = el.y + (rx * sin + ry * cos);
              }

              // Apply translation and scale to find viewport pixels
              const screenX = offsetX + (cx * calculatedScale);
              const screenY = offsetY + (cy * calculatedScale);

              return (
                <div 
                  style={{ 
                    left: `${screenX}px`, 
                    top: `${screenY}px`,
                    transform: `translate(-50%, -50%) rotate(${rot % 180}deg) translateY(-42px)`,
                    transformOrigin: 'center center',
                  }}
                  className="absolute z-30 flex items-center gap-1 bg-slate-900/95 dark:bg-slate-950/95 border border-indigo-500/70 text-white rounded-xl py-1 px-1.5 shadow-2xl select-none no-print transition-all duration-75 text-xs font-black"
                >
                  {/* Minus button */}
                  <button
                    type="button"
                    disabled={!!el.locked}
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentCm = Math.round((el.width / 48) * 100);
                      const nextCm = Math.max(10, currentCm - 10);
                      const nextWidth = Math.max(5, Math.round((nextCm * 48) / 100));
                      setLengthInputStr(nextCm.toString());
                      setArchElements(prev => {
                        const item = prev.find(x => x.id === el.id);
                        if (!item) return prev;
                        const nextHeight = item.subType === 'shape_square' ? nextWidth : item.height;
                        const updated = { ...item, width: nextWidth, height: item.type === 'door' ? nextWidth : nextHeight };
                        return propagateWallChanges(prev, el.id, updated);
                      });
                    }}
                    className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer select-none active:scale-90 bg-slate-800 hover:bg-rose-600 text-slate-200 ${
                      el.locked ? 'opacity-35 pointer-events-none' : ''
                    }`}
                    title="کاهش ۱۰ سانتی‌متر"
                  >
                    -
                  </button>

                  {/* Centimeter Input */}
                  <div className={`flex items-center border border-slate-800 rounded-md px-1 py-0.5 bg-slate-955 ${
                    el.locked ? 'opacity-35 pointer-events-none' : ''
                  }`}>
                    <input
                      type="text"
                      disabled={!!el.locked}
                      data-length-input="true"
                      value={lengthInputStr}
                      onChange={(e) => {
                        const cleansed = e.target.value.replace(/\D/g, '');
                        setLengthInputStr(cleansed);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          commitLengthChange(el.id, lengthInputStr);
                        }
                      }}
                      onBlur={() => {
                        handleInputBlur(el.id, lengthInputStr);
                      }}
                      className="w-8 text-center text-[10px] font-black bg-transparent border-0 outline-none text-indigo-300 p-0 focus:ring-0 font-mono disabled:text-slate-500"
                      placeholder="CM"
                      title="طول دقیق به سانتی‌متر (Enter برای اعمال)"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Plus button */}
                  <button
                    type="button"
                    disabled={!!el.locked}
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentCm = Math.round((el.width / 48) * 100);
                      const nextCm = currentCm + 10;
                      const nextWidth = Math.max(5, Math.round((nextCm * 48) / 100));
                      setLengthInputStr(nextCm.toString());
                      setArchElements(prev => {
                        const item = prev.find(x => x.id === el.id);
                        if (!item) return prev;
                        const nextHeight = item.subType === 'shape_square' ? nextWidth : item.height;
                        const updated = { ...item, width: nextWidth, height: item.type === 'door' ? nextWidth : nextHeight };
                        return propagateWallChanges(prev, el.id, updated);
                      });
                    }}
                    className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer select-none active:scale-90 bg-slate-800 hover:bg-indigo-650 text-slate-200 ${
                      el.locked ? 'opacity-35 pointer-events-none' : ''
                    }`}
                    title="افزایش ۱۰ سانتی‌متر"
                  >
                    +
                  </button>

                  {/* On-Canvas Element Lock Toggle (functions exactly like the top selection bar lock button) */}
                  <div className="flex items-center border-r border-slate-800 pr-1.5 mr-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setArchElements(prev => prev.map(item => item.id === el.id ? { ...item, locked: !item.locked } : item));
                      }}
                      className={`w-5.5 h-5.5 rounded-lg transition-all flex items-center justify-center cursor-pointer active:scale-90 ${
                        el.locked
                          ? 'bg-amber-600 border border-amber-500 text-white shadow-sm font-black'
                          : 'bg-slate-800 hover:bg-slate-750 border border-transparent text-slate-400 hover:text-amber-400'
                      }`}
                      title={el.locked ? "باز کردن قفل عنصر (فعال‌سازی تغییرات)" : "قفل کردن کامل عنصر (غیرفعال‌سازی حرکت، طول و زاویه)"}
                    >
                      {el.locked ? <Lock className="w-3 h-3 text-amber-100" /> : <Unlock className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* On-Canvas Orientation Lock toggles (Only for Walls) */}
                  {el.type === 'wall' && (
                    <div className={`flex items-center gap-0.5 border-r border-slate-800 pr-1.5 mr-0.5 transition-opacity duration-200 ${el.locked ? 'opacity-35 pointer-events-none' : ''}`}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOrientationLock(el.id, 'horizontal');
                        }}
                        className={`px-1.5 py-0.5 text-[8px] font-black rounded-md transition-all flex items-center gap-0.5 cursor-pointer active:scale-90 ${
                          el.orientationLock === 'horizontal'
                            ? 'bg-amber-600/90 text-white shadow-sm font-black'
                            : 'bg-slate-800 text-slate-450 hover:text-white hover:bg-slate-700'
                        }`}
                        title="قفل روی جهت افقی (دیوار تحت هیچ شرایطی تغییر زاویه نمی‌دهد)"
                      >
                        <ArrowLeftRight className="w-2.5 h-2.5" />
                        <span>افقی</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOrientationLock(el.id, 'vertical');
                        }}
                        className={`px-1.5 py-0.5 text-[8px] font-black rounded-md transition-all flex items-center gap-0.5 cursor-pointer active:scale-95 ${
                          el.orientationLock === 'vertical'
                            ? 'bg-amber-600/90 text-white shadow-sm font-black'
                            : 'text-slate-450 hover:text-white hover:bg-slate-800/50'
                        }`}
                        title="قفل روی جهت عمودی (دیوار تحت هیچ شرایطی تغییر زاویه نمی‌دهد)"
                      >
                        <ArrowUpDown className="w-2.5 h-2.5" />
                        <span>عمودی</span>
                      </button>
                    </div>
                  )}

                  {/* Rotate button — Request 3 */}
                  <div className="flex items-center border-r border-slate-800 pr-1.5 mr-0.5">
                    <button
                      type="button"
                      disabled={!!el.locked}
                      onClick={(e) => {
                        e.stopPropagation();
                        setArchElements(prev => {
                          const item = prev.find(x => x.id === el.id);
                          if (!item) return prev;
                          const updated = { ...item, rotation: (item.rotation + 90) % 360 };
                          return propagateWallChanges(prev, el.id, updated);
                        });
                      }}
                      className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-90 bg-slate-800 hover:bg-indigo-650 text-slate-200 ${
                        el.locked ? 'opacity-35 pointer-events-none' : ''
                      }`}
                      title="چرخش ۹۰ درجه سریع"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Immediate Delete button next to locks/dimension modifiers */}
                  <div className="flex items-center pl-1 border-r border-slate-800 pr-0.5">
                    <button
                      type="button"
                      disabled={!!el.locked}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteArchElement(el.id);
                      }}
                      className={`w-5.5 h-5.5 rounded-lg bg-rose-950/40 hover:bg-rose-600 border border-rose-900/40 hover:border-rose-500 text-rose-450 hover:text-white flex items-center justify-center cursor-pointer transition-all active:scale-90 ${
                        el.locked ? 'opacity-35 pointer-events-none' : ''
                      }`}
                      title="حذف فوری عنصر"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Quick Info hint block */}
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-2xl text-[11px] font-bold flex gap-2">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p className="leading-relaxed">
              راهنما: با درگ کردن روی پس‌زمینه خالی، نقشه را جابجا کنید. جهت زوم در گوشی از پینچ دو انگشتی استفاده کنید. برای انتخاب اشیاء نیز بر روی آن‎‌ها ضربه بزنید تا دسته تنظیم طول و عرض فعال شود.
            </p>
          </div>
        </div>

        {/* Right Columns: Architectural Workbench panel */}
        <div className="space-y-4 font-sans">
          
          {/* Main Architectural operations card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.2rem] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-850">
              <div className="bg-indigo-650/10 p-2 rounded-xl">
                <Layers className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-450" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-100">مدیریت عناصر پلان معماری</h3>
                <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5">افزودن و تغییر سریع ابعاد و المان‎‌‌ها</span>
              </div>
            </div>

            {/* Undo History actions panel */}
            <div className="space-y-1.5 pb-1 border-b border-slate-150/60 dark:border-slate-850">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">تاریخچه عملکرد و تنظیمات شبکه:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={archHistory.length === 0}
                  className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 border leading-none ${
                    archHistory.length > 0
                      ? 'bg-amber-600 border-amber-500 hover:bg-amber-550 text-white shadow-md active:scale-[0.98]'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                  title="واگرد تغییرات و بازگشت به عملکرد قبلی (Ctrl + Z)"
                >
                  <Undo className="w-3.5 h-3.5 shrink-0" />
                  <span>واگرد ({archHistory.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowGrid(!showGrid)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 border leading-none ${
                    showGrid
                      ? 'bg-indigo-600 border-indigo-500 hover:bg-indigo-550 text-white shadow-md active:scale-[0.98]'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                  title={showGrid ? "غیرفعال‌سازی شبکه" : "فعال‌سازی شبکه"}
                >
                  <Grid className="w-3.5 h-3.5 shrink-0" />
                  <span>{showGrid ? "غیرفعال شبکه" : "نمایش شبکه"}</span>
                </button>
              </div>
            </div>

            {/* Ready templates */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">طرح‌ها و الگوهای آماده:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleLoadPresetSquare}
                  className="py-2 px-2.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center text-slate-700 dark:text-slate-350"
                >
                  پلان مربع فرضی
                </button>
                <button
                  type="button"
                  onClick={handleLoadPresetLShape}
                  className="py-2 px-2.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center text-slate-700 dark:text-slate-350"
                >
                  پلان ساختمانی L
                </button>
                <button
                  type="button"
                  onClick={handleLoadPresetThreeRoom}
                  className="py-2 px-2.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center text-slate-700 dark:text-slate-350"
                >
                  پلان ۳ خوابه مجهز
                </button>
                <button
                  type="button"
                  onClick={handleClearPresets}
                  className="py-2 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-red-950/20 dark:border-red-900/40 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center"
                >
                  حذف کل اشیاء
                </button>
              </div>
            </div>

            {/* Quick manual element appending buttons */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-850">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">افزودن دستی شیء جدید به پلان:</label>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddWall()}
                  className="py-2 px-3 bg-slate-100 hover:bg-indigo-650 hover:text-white dark:bg-slate-800 dark:hover:bg-indigo-650 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-between text-slate-750 dark:text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>دیوار جدید</span>
                  </span>
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAddDoor()}
                  className="py-2 px-3 bg-slate-100 hover:bg-rose-600 hover:text-white dark:bg-slate-800 dark:hover:bg-rose-600 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-between text-slate-750 dark:text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>درب ورودی / بازشو</span>
                  </span>
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAddWindow()}
                  className="py-2 px-3 bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-between text-slate-750 dark:text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>پنجره</span>
                  </span>
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAddStairs()}
                  className="py-2 px-3 bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-between text-slate-750 dark:text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>باکس پله (UP)</span>
                  </span>
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAddLabel()}
                  className="py-2 px-3 bg-slate-100 hover:bg-purple-600 hover:text-white dark:bg-slate-800 dark:hover:bg-purple-600 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-between text-slate-755 dark:text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>برچسب فضا</span>
                  </span>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Selection Switcher */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-850">
              <label className="text-[10px] font-black text-slate-400 block pb-1">کل عناصر موجود در کادر:</label>
              {archElements.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-bold block bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-850">المان آماده‌ای روی صفحه نیستت.</p>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={selectedArchElementId || ''}
                    onChange={(e) => setSelectedArchElementId(e.target.value || null)}
                    className="flex-1 text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="">-- انتخاب عنصر جهت ویرایش --</option>
                    {archElements.map(el => (
                      <option key={el.id} value={el.id}>
                        {el.name} ({el.type === 'wall' ? 'دیوار' : el.type === 'door' ? 'درب' : el.type === 'window' ? 'پنجره' : el.type === 'stairs' ? 'پله' : el.type === 'equipment' ? 'تجهیزات' : 'عنوان'})
                      </option>
                    ))}
                  </select>
                  {selectedArchElementId && (
                    <button
                      type="button"
                      onClick={() => handleDeleteArchElement(selectedArchElementId)}
                      className="p-2.5 btn-rose transition-all hover:bg-rose-100 dark:hover:bg-rose-950/20 text-rose-600 rounded-xl border border-rose-200 dark:border-rose-950 cursor-pointer"
                      title="حذف المان انتخابی"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Properties panel range sliders */}
          {selectedArchElementId && (() => {
            const el = archElements.find(x => x.id === selectedArchElementId);
            if (!el) return null;
            return (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.2rem] p-6 shadow-sm space-y-4 animate-fade-in relative">
                <div className="flex items-center justify-between text-[11px] font-black text-indigo-600 dark:text-indigo-400 border-b border-dashed border-slate-100 dark:border-slate-850 pb-2">
                  <span>ویرایش جزئیات عنصر انتخابی</span>
                  <span className="font-extrabold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-650 dark:text-indigo-300 px-2.5 py-1 rounded-lg text-[9.5px]">
                    {el.type === 'wall' ? 'دیوار' : el.type === 'stairs' ? 'پله' : el.type === 'door' ? 'درب' : el.type === 'window' ? 'پنجره' : el.type === 'equipment' ? 'تجهیزات' : 'برچسب'}
                  </span>
                </div>

                {/* Name Label editing */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-450 block">نام یا برچسب توصیفی المان:</label>
                  <input
                    type="text"
                    value={el.name}
                    onChange={(e) => {
                      setArchElements(prev => prev.map(item => item.id === el.id ? { ...item, name: e.target.value } : item));
                    }}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-950 text-slate-700 dark:text-slate-250 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Position X */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9.5px] font-black text-slate-450 font-mono">
                      <span>{el.x}px</span>
                      <span>موقعیت افقی (X)</span>
                    </div>
                    <input
                      type="range"
                      min="-350"
                      max="350"
                      value={el.x}
                      onChange={(e) => {
                        setArchElements(prev => {
                          const item = prev.find(x => x.id === el.id);
                          if (!item) return prev;
                          const updated = { ...item, x: parseInt(e.target.value) };
                          return propagateWallChanges(prev, el.id, updated);
                        });
                      }}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Position Y */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9.5px] font-black text-slate-450 font-mono">
                      <span>{el.y}px</span>
                      <span>موقعیت عمودی (Y)</span>
                    </div>
                    <input
                      type="range"
                      min="-300"
                      max="300"
                      value={el.y}
                      onChange={(e) => {
                        setArchElements(prev => {
                          const item = prev.find(x => x.id === el.id);
                          if (!item) return prev;
                          const updated = { ...item, y: parseInt(e.target.value) };
                          return propagateWallChanges(prev, el.id, updated);
                        });
                      }}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Width or Length */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9.5px] font-black text-slate-450 font-mono">
                      <span>{el.width}px ({el.type === 'wall' ? Math.max(10, Math.round((el.width / 48) * 10) * 10) : Math.round(el.width / 48 * 100)}cm)</span>
                      <span>طول المان</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="400"
                      value={el.width}
                      onChange={(e) => {
                        setArchElements(prev => {
                          const item = prev.find(x => x.id === el.id);
                          if (!item) return prev;
                          const updated = { ...item, width: parseInt(e.target.value) };
                          return propagateWallChanges(prev, el.id, updated);
                        });
                      }}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Height (Thickness) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9.5px] font-black text-slate-450 font-mono">
                      <span>{el.height}px ({(Math.round(el.height / 48 * 100))}cm)</span>
                      <span>ضخامت المان</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="200"
                      value={el.height}
                      onChange={(e) => {
                        setArchElements(prev => {
                          const item = prev.find(x => x.id === el.id);
                          if (!item) return prev;
                          const updated = { ...item, height: parseInt(e.target.value) };
                          return propagateWallChanges(prev, el.id, updated);
                        });
                      }}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Rotation Angle */}
                  <div className="col-span-2 space-y-1">
                    <div className="flex justify-between text-[9.5px] font-black text-slate-450 font-mono">
                      <span>{el.rotation}° درجه</span>
                      <span className="flex items-center gap-1">
                        {el.type === 'wall' && el.orientationLock && el.orientationLock !== 'none' && (
                          <span className="text-[8px] bg-amber-600/20 text-amber-500 px-1 py-0.5 rounded font-sans font-extrabold select-none">جهت قفل شده</span>
                        )}
                        <span>زاویه دوران</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="270"
                      step="90"
                      disabled={el.type === 'wall' && !!el.orientationLock && el.orientationLock !== 'none'}
                      value={el.rotation}
                      onChange={(e) => {
                        setArchElements(prev => {
                          const item = prev.find(x => x.id === el.id);
                          if (!item) return prev;
                          const updated = { ...item, rotation: parseInt(e.target.value) };
                          return propagateWallChanges(prev, el.id, updated);
                        });
                      }}
                      className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-indigo-500 ${
                        el.type === 'wall' && el.orientationLock && el.orientationLock !== 'none'
                          ? 'opacity-40 cursor-not-allowed bg-slate-800'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                    <div className="grid grid-cols-4 gap-1 pt-1">
                      {[0, 90, 180, 270].map((deg) => (
                        <button
                          key={deg}
                          type="button"
                          disabled={el.type === 'wall' && !!el.orientationLock && el.orientationLock !== 'none'}
                          onClick={() => {
                            setArchElements(prev => {
                              const item = prev.find(x => x.id === el.id);
                              if (!item) return prev;
                              const updated = { ...item, rotation: deg };
                              return propagateWallChanges(prev, el.id, updated);
                            });
                          }}
                          className={`py-1 text-[10px] font-mono font-black rounded-lg transition-all border ${
                            el.type === 'wall' && el.orientationLock && el.orientationLock !== 'none'
                              ? 'bg-slate-105 border-slate-200/50 dark:bg-slate-950 dark:border-slate-850/50 text-slate-400 opacity-40 cursor-not-allowed'
                              : el.rotation === deg 
                                ? 'bg-indigo-650 border-indigo-600 text-white shadow-sm' 
                                : 'bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-850 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {deg}°
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Cloud & Local plan database library */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.2rem] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-850">
              <div className="bg-indigo-650/10 p-2 rounded-xl">
                <FolderOpen className="w-4.5 h-4.5 text-indigo-655" />
              </div>
              <h3 className="font-black text-sm text-slate-800 dark:text-slate-100">آرشیو محلی طراح‌های شما</h3>
            </div>

            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="نامی برای ذخیره نقشه حاضر بنویسید..." 
                value={planNameInput}
                onChange={(e) => setPlanNameInput(e.target.value)}
                className="w-full text-xs font-black p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-[#fafafa] dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none"
              />
              <button
                onClick={handleSaveCustomPlan}
                disabled={!planNameInput.trim()}
                className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  planNameInput.trim() 
                    ? 'bg-emerald-600 hover:bg-emerald-550 text-white shadow' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>ذخیره نقشه کنونی</span>
              </button>
            </div>

            {savedPlans.length > 0 && (
              <div className="space-y-1.5 pt-2 max-h-[160px] overflow-y-auto">
                <label className="text-[9px] font-black text-slate-405 block uppercase">نقشه‌های ذخیره شده:</label>
                {savedPlans.map((itm) => (
                  <div
                    key={itm.id}
                    onClick={() => handleLoadCustomPlan(itm.id)}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-900 transition-colors cursor-pointer group"
                  >
                    <div className="text-right">
                      <span className="text-[11px] font-black text-slate-705 dark:text-slate-200 block group-hover:text-indigo-600">{itm.name}</span>
                      <span className="text-[8px] text-slate-400 block mt-0.5">{itm.createdAt} - ({itm.archElements.length} مورد)</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteCustomPlan(itm.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

       {/* PDF Generation Print Dialog Backdrop Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[250] p-4 select-none">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-150 dark:border-slate-800 p-6 max-w-sm w-full space-y-4 shadow-2xl relative animate-scale-up" style={{ direction: 'rtl' }}>
            <button 
              onClick={() => setIsPrintModalOpen(false)}
              className="absolute left-4 top-4 w-7 h-7 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
 
            <div className="text-center space-y-2 pt-2">
              <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 mb-2">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="font-black text-slate-850 dark:text-slate-100 text-sm">آماده‌سازی خروجی نقشه دو بعدی</h3>
              <p className="text-xs text-slate-450 dark:text-slate-550 leading-relaxed font-bold block">
                جهت تولید و دانلود پلان معماری ۲D به صورت سند مهندسی استاندارد (A4 PDF) بر روی دکمه زیر کلیک نمایید:
              </p>
            </div>
 
            <div className="space-y-2 pt-2">
              <button
                onClick={handleExportPDF}
                disabled={isGeneratingPDF}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-550 active:scale-95 text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                {isGeneratingPDF ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>درحال ساخت فایل PDF...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>دانلود نقشه مهندسی (A4 PDF)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

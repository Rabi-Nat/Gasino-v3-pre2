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
  Sliders, 
  ArrowUpRight,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Move,
  RotateCcw,
  X,
  Compass,
  Layers,
  Eye,
  EyeOff,
  Save,
  FolderOpen
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Standard nominal gas pipe sizes in Iran
const PIPE_SIZES = [
  { value: '1/2"', label: '1/2" (DN15)', cap: 'تا ۵ مترمکعب در ساعت' },
  { value: '3/4"', label: '3/4" (DN20)', cap: 'تا ۱۰ مترمکعب در ساعت' },
  { value: '1"', label: '1" (DN25)', cap: 'تا ۲۰ مترمکعب در ساعت' },
  { value: '1 1/4"', label: '1 1/4" (DN32)', cap: 'تا ۴۵ مترمکعب در ساعت' },
  { value: '1 1/2"', label: '1 1/2" (DN40)', cap: 'تا ۷۵ مترمکعب در ساعت' },
  { value: '2"', label: '2" (DN50)', cap: 'تا ۱۲۰ مترمکعب در ساعت' },
  { value: '2 1/2"', label: '2 1/2" (DN65)', cap: 'تا ۲۰۰ مترمکعب در ساعت' },
  { value: '3"', label: '3" (DN80)', cap: 'تا ۳۵۰ مترمکعب در ساعت' },
  { value: '4"', label: '4" (DN100)', cap: 'تا ۶۰۰ مترمکعب در ساعت' }
];

const ACCESSORIES = [
  { value: 'none', label: 'بدون انشعاب (فقط لوله)' },
  { value: 'valve', label: 'شیر قطع‌کن گازی (Brass Valve)' },
  { value: 'yard_valve', label: 'شیر حیاط (RC)' },
  { value: 'meter', label: 'شیر کنتور گاز شهری (Gas Meter)' },
  { value: 'regulator', label: 'شیر قفلی (Lockable Valve)' },
  { value: 'boiler', label: 'شیر پکیج گرمایشی / دیگ موتورخانه (BP)' },
  { value: 'water_heater', label: 'شیر آبگرمکن دیواری (BP)' },
  { value: 'floor_water_heater', label: 'شیر آبگرمکن زمینی (WH)' },
  { value: 'stove', label: 'شیر اجاق گاز پخت‌وپز (GC)' },
  { value: 'heater', label: 'شیر بخاری گازسوز خانگی (H)' }
];

const DIRECTIONS = [
  { value: 'NE', label: 'شمال شرق (۳۰° بالا-راست)', dx: 1, dy: 0, dz: 0 },
  { value: 'NW', label: 'شمال غرب (۳۰° بالا-چپ)', dx: 0, dy: 1, dz: 0 },
  { value: 'SE', label: 'جنوب شرق (۳۰° پایین-راست)', dx: -1, dy: 0, dz: 0 },
  { value: 'SW', label: 'جنوب غرب (۳۰° پایین-چپ)', dx: 0, dy: -1, dz: 0 },
  { value: 'UP', label: 'عمودی روبه بالا (۹۰°)', dx: 0, dy: 0, dz: 1 },
  { value: 'DOWN', label: 'عمودی روبه پایین (۹۰°)', dx: 0, dy: 0, dz: -1 }
];

interface PipeSegment {
  id: string;
  parentId: string | null;
  name: string;
  direction: 'NE' | 'NW' | 'SE' | 'SW' | 'UP' | 'DOWN';
  length: number; // in meters
  size: string; // e.g., '1/2"'
  accessory: 'none' | 'valve' | 'yard_valve' | 'meter' | 'regulator' | 'boiler' | 'water_heater' | 'floor_water_heater' | 'stove' | 'heater';
  accessoryPosition: 'start' | 'end';
}

interface Node3D {
  x: number;
  y: number;
  z: number;
}

interface ComputedSegment extends PipeSegment {
  start: Node3D;
  end: Node3D;
  startProj: { x: number; y: number };
  endProj: { x: number; y: number };
  level: number;
}

interface ArchElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'stairs' | 'label';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
  name: string;
}

interface SavedMap {
  id: string;
  name: string;
  createdAt: string;
  isoSegments: PipeSegment[];
  planSegments: PipeSegment[];
  archElements: ArchElement[];
}

// 1. Residential single-story standard home template
const residentialTemplate: PipeSegment[] = [
  { id: '1', parentId: null, name: 'رگولاتور ورودی ساختمان', direction: 'NE', length: 1.2, size: '1 1/4"', accessory: 'regulator', accessoryPosition: 'start' },
  { id: '2', parentId: '1', name: 'اتصال به کنتور گاز G4', direction: 'UP', length: 0.8, size: '1"', accessory: 'meter', accessoryPosition: 'end' },
  { id: '3', parentId: '2', name: 'رایزر اصلی صعودی ورودی', direction: 'UP', length: 1.5, size: '1"', accessory: 'none', accessoryPosition: 'end' },
  { id: '4', parentId: '3', name: 'کلکتور افقی واحد همکف', direction: 'NW', length: 2.5, size: '1"', accessory: 'valve', accessoryPosition: 'start' },
  { id: '5', parentId: '4', name: 'انشعاب پکیج آشپزخانه', direction: 'SW', length: 1.8, size: '3/4"', accessory: 'boiler', accessoryPosition: 'end' },
  { id: '6', parentId: '4', name: 'شاخه‌ی توزیع فرعی سالن', direction: 'NW', length: 3.5, size: '3/4"', accessory: 'none', accessoryPosition: 'end' },
  { id: '7', parentId: '6', name: 'شیر و خروجی اجاق گاز', direction: 'SW', length: 1.2, size: '1/2"', accessory: 'stove', accessoryPosition: 'end' },
  { id: '8', parentId: '6', name: 'انشعاب فرعی بخاری دیواری سالن', direction: 'NE', length: 2.0, size: '1/2"', accessory: 'heater', accessoryPosition: 'end' }
];

// 2. Large complex multi-risk template (commercial or multi-home main header)
const multiBlockTemplate: PipeSegment[] = [
  { id: '1', parentId: null, name: 'انشعاب توکار شرکت گاز', direction: 'NE', length: 1.5, size: '2"', accessory: 'regulator', accessoryPosition: 'start' },
  { id: '2', parentId: '1', name: 'شیر اصلی قطع اضطراری', direction: 'UP', length: 1.0, size: '2"', accessory: 'valve', accessoryPosition: 'end' },
  { id: '3', parentId: '2', name: 'کلکتور ورودی رگولاتور اصلی', direction: 'NW', length: 2.0, size: '2"', accessory: 'none', accessoryPosition: 'end' },
  // Unit A Subtree
  { id: '4', parentId: '3', name: 'شاخه‌ی فرعی واحد ۱', direction: 'UP', length: 1.8, size: '1 1/4"', accessory: 'meter', accessoryPosition: 'end' },
  { id: '5', parentId: '4', name: 'انشعاب مصرفی پکیج واحد ۱', direction: 'NE', length: 2.5, size: '3/4"', accessory: 'boiler', accessoryPosition: 'end' },
  { id: '6', parentId: '4', name: 'مسیر خواب غربی واحد ۱', direction: 'NW', length: 3.0, size: '1/2"', accessory: 'heater', accessoryPosition: 'end' },
  // Unit B Subtree
  { id: '7', parentId: '3', name: 'شاخه‌ی فرعی واحد ۲', direction: 'SE', length: 2.2, size: '1 1/4"', accessory: 'meter', accessoryPosition: 'end' },
  { id: '8', parentId: '7', name: 'اجاق گاز آشپزخانه واحد ۲', direction: 'SW', length: 1.5, size: '1/2"', accessory: 'stove', accessoryPosition: 'end' }
];

// Helper to compute 2D line segment intersection point
function getLineIntersection(
  p0_x: number, p0_y: number, p1_x: number, p1_y: number,
  p2_x: number, p2_y: number, p3_x: number, p3_y: number
): { x: number, y: number, s: number, t: number } | null {
  const dx1 = p1_x - p0_x;
  const dy1 = p1_y - p0_y;
  const dx2 = p3_x - p2_x;
  const dy2 = p3_y - p2_y;

  const det = dx2 * dy1 - dx1 * dy2;
  if (Math.abs(det) < 0.01) {
    return null; // collinear / parallel
  }

  const u = ((p2_y - p0_y) * dx2 - (p2_x - p0_x) * dy2) / det;
  const v = (dx1 * (p2_y - p0_y) - dy1 * (p2_x - p0_x)) / det;

  if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
    return {
      x: p0_x + u * dx1,
      y: p0_y + u * dy1,
      s: u,
      t: v
    };
  }
  return null;
}

// Helper to determine the thickness and color style of a pipeline segment
function getSegmentStyle(s: PipeSegment | ComputedSegment, isSelected: boolean, isWhiteStyle: boolean) {
  let pipeColor = '#3b82f6'; // 1" default blue shade
  let pipeWidth = 1.1; // Very thin AutoCAD style line
  
  if (s.size.includes('1/2')) {
    pipeColor = '#06b6d4'; // teal
    pipeWidth = 1.1;
  } else if (s.size.includes('3/4')) {
    pipeColor = '#10b981'; // emerald
    pipeWidth = 1.1;
  } else if (s.size.includes('1 1/4')) {
    pipeColor = '#f59e0b'; // amber
    pipeWidth = 1.1;
  } else if (s.size.includes('1 1/2') || s.size.startsWith('2')) {
    pipeColor = '#ef4444'; // red thick gas line
    pipeWidth = 1.1;
  }

  if (isSelected) {
    pipeColor = '#d946ef'; // bright fuchsia highlight
  }

  if (isWhiteStyle) {
    pipeColor = isSelected ? '#c026d3' : '#0f172a'; // Deep violet-magenta for select, crisp clean solid rich slate-900 for pipes
  }
  
  return { color: pipeColor, width: pipeWidth };
}

export const IsometricDesigner: React.FC = () => {
  const viewMode = 'isometric' as 'isometric' | 'plan';

  const [isoSegments, setIsoSegments] = useState<PipeSegment[]>(() => {
    try {
      const saved = localStorage.getItem('isom_pipe_segments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load pipe segments from localStorage', e);
    }
    return [
      {
        id: 'origin',
        parentId: null,
        name: 'رگولاتور شروع سیستم (ورودی)',
        direction: 'NE',
        length: 0, // Zero length starting reference node
        size: '1"',
        accessory: 'regulator',
        accessoryPosition: 'start'
      }
    ];
  });

  const [planSegments, setPlanSegments] = useState<PipeSegment[]>(() => {
    try {
      const saved = localStorage.getItem('plan_pipe_segments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load plan segments from localStorage', e);
    }
    return [
      {
        id: 'origin_plan',
        parentId: null,
        name: 'رگولاتور شروع پلان',
        direction: 'NE',
        length: 0,
        size: '1"',
        accessory: 'regulator',
        accessoryPosition: 'start'
      }
    ];
  });

  const [isoSelectedSegmentId, setIsoSelectedSegmentId] = useState<string | null>('origin');
  const [planSelectedSegmentId, setPlanSelectedSegmentId] = useState<string | null>('origin_plan');

  const [isoHistory, setIsoHistory] = useState<PipeSegment[][]>([]);
  const [planHistory, setPlanHistory] = useState<PipeSegment[][]>([]);

  const segments = viewMode === 'isometric' ? isoSegments : planSegments;
  const setSegments = viewMode === 'isometric' ? setIsoSegments : setPlanSegments;

  const selectedSegmentId = viewMode === 'isometric' ? isoSelectedSegmentId : planSelectedSegmentId;
  const setSelectedSegmentId = viewMode === 'isometric' ? setIsoSelectedSegmentId : setPlanSelectedSegmentId;

  const history = viewMode === 'isometric' ? isoHistory : planHistory;
  const setHistory = viewMode === 'isometric' ? setIsoHistory : setPlanHistory;

  // Print Mode & Style parameters
  const [isPrintTheme, setIsPrintTheme] = useState(() => {
    try {
      return localStorage.getItem('isom_isPrintTheme') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Toggleable floating select state variables for mobile
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isAccessoryDropdownOpen, setIsAccessoryDropdownOpen] = useState(false);
  
  // Custom dialog state for safe, non-blocking deletion inside direct browser/iframe preview contexts
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Use changeSegments instead of setSegments to auto-track history!
  const changeSegments = (updater: PipeSegment[] | ((prev: PipeSegment[]) => PipeSegment[])) => {
    setHistory(h => [...h, segments]);
    setSegments(updater);
  };

  const handleUndo = () => {
    if (viewMode === 'plan') {
      if (archHistory.length === 0) return;
      const prev = archHistory[archHistory.length - 1];
      _setArchElements(prev);
      setArchHistory(archHistory.slice(0, -1));
      setSelectedArchElementId(null);
    } else {
      if (history.length === 0) return;
      const prev = history[history.length - 1];
      setSegments(prev);
      setHistory(history.slice(0, -1));
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        setSelectedSegmentId(last.id);
      } else {
        setSelectedSegmentId(null);
      }
    }
  };
  
  // Custom user parameters for adding/editing lines
  const [newName, setNewName] = useState('انشعاب جدید مسکونی');
  const [newParentId, setNewParentId] = useState<string>('root');
  const [newDirection, setNewDirection] = useState<'NE' | 'NW' | 'SE' | 'SW' | 'UP' | 'DOWN'>('NE');
  const [newLength, setNewLength] = useState<string>("150");
  const [newSize, setNewSize] = useState<string>('1"');
  const [newAccessory, setNewAccessory] = useState<'none' | 'valve' | 'yard_valve' | 'meter' | 'regulator' | 'boiler' | 'water_heater' | 'floor_water_heater' | 'stove' | 'heater'>('none');
  const [newAccessoryPos, setNewAccessoryPos] = useState<'start' | 'end'>('end');

  // Interactive editing mode
  const [isEditingSegment, setIsEditingSegment] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDirection, setEditDirection] = useState<'NE' | 'NW' | 'SE' | 'SW' | 'UP' | 'DOWN'>('NE');
  const [editLength, setEditLength] = useState<string>("150");
  const [editSize, setEditSize] = useState<string>('1"');
  const [editAccessory, setEditAccessory] = useState<'none' | 'valve' | 'yard_valve' | 'meter' | 'regulator' | 'boiler' | 'water_heater' | 'floor_water_heater' | 'stove' | 'heater'>('none');
  const [editAccessoryPos, setEditAccessoryPos] = useState<'start' | 'end'>('end');

  const [showPipesInPlan, setShowPipesInPlan] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('isom_showPipesInPlan');
      return saved === 'true'; // Default to false (hidden initially for plan view, as requested)
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('isom_showPipesInPlan', String(showPipesInPlan));
  }, [showPipesInPlan]);

  const [archHistory, setArchHistory] = useState<ArchElement[][]>([]);
  const archSnapshotRef = useRef<ArchElement[] | null>(null);

  const [archElements, _setArchElements] = useState<ArchElement[]>(() => {
    try {
      const saved = localStorage.getItem('isom_archElements');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'wall-1', type: 'wall', x: -160, y: -120, width: 335, height: 10, rotation: 0, name: 'دیوار خارجی شمالی' },
      { id: 'wall-2', type: 'wall', x: -160, y: -120, width: 10, height: 260, rotation: 0, name: 'دیوار خارجی غربی' },
      { id: 'wall-3', type: 'wall', x: 175, y: -120, width: 10, height: 260, rotation: 0, name: 'دیوار خارجی شرقی' },
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

  const setArchElements = (updater: ArchElement[] | ((prev: ArchElement[]) => ArchElement[])) => {
    if (!archSnapshotRef.current) {
      setArchHistory(h => [...h, archElements]);
    }
    _setArchElements(updater);
  };
  const [selectedArchElementId, setSelectedArchElementId] = useState<string | null>(null);

  const [activeDraggingArchId, setActiveDraggingArchId] = useState<string | null>(null);
  const [dragArchOffset, setDragArchOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showFloorPlanDrawer, setShowFloorPlanDrawer] = useState<boolean>(true);

  const [isResizingArch, setIsResizingArch] = useState<boolean>(false);
  const [resizeArchStart, setResizeArchStart] = useState<{
    x: number;
    y: number;
    initialWidth: number;
    initialHeight: number;
    initialX?: number;
    initialY?: number;
  }>({ x: 0, y: 0, initialWidth: 0, initialHeight: 0 });
  const [resizeArchDimension, setResizeArchDimension] = useState<'width' | 'height'>('width');
  const [resizeArchEdge, setResizeArchEdge] = useState<'start' | 'end' | 'height'>('end');

  // Sync architectural elements to localStorage dynamically
  useEffect(() => {
    try {
      localStorage.setItem('isom_archElements', JSON.stringify(archElements));
    } catch (e) {}
  }, [archElements]);

  // Custom Saved Maps Persistence State
  const [savedMaps, setSavedMaps] = useState<SavedMap[]>(() => {
    try {
      const saved = localStorage.getItem('isom_custom_saved_maps');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load custom maps from localStorage', e);
      return [];
    }
  });
  const [mapNameInput, setMapNameInput] = useState('');

  // Sync custom saved maps to localStorage dynamically
  useEffect(() => {
    try {
      localStorage.setItem('isom_custom_saved_maps', JSON.stringify(savedMaps));
    } catch (e) {}
  }, [savedMaps]);

  // Save active map under a custom name
  const handleSaveCurrentMap = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = mapNameInput.trim();
    if (!trimmedName) return;

    const newSavedMap: SavedMap = {
      id: 'map_' + Date.now(),
      name: trimmedName,
      createdAt: new Date().toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      isoSegments: [...isoSegments],
      planSegments: [...planSegments],
      archElements: [...archElements]
    };

    setSavedMaps(prev => {
      const existsIndex = prev.findIndex(m => m.name.toLowerCase() === trimmedName.toLowerCase());
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = { ...newSavedMap, id: prev[existsIndex].id };
        return copy;
      }
      return [newSavedMap, ...prev];
    });

    setMapNameInput('');
  };

  // Load a saved map
  const handleLoadSavedMap = (map: SavedMap) => {
    setIsoSegments(map.isoSegments);
    setPlanSegments(map.planSegments);
    setArchElements(map.archElements);

    if (map.isoSegments.length > 0) {
      setIsoSelectedSegmentId(map.isoSegments[0].id);
    } else {
      setIsoSelectedSegmentId(null);
    }

    if (map.planSegments.length > 0) {
      setPlanSelectedSegmentId(map.planSegments[0].id);
    } else {
      setPlanSelectedSegmentId(null);
    }

    setSelectedArchElementId(null);
    setTimeout(() => {
      handleAutoFit();
    }, 150);
  };

  // Delete a saved map
  const handleDeleteSavedMap = (id: string) => {
    setSavedMaps(prev => prev.filter(m => m.id !== id));
  };

  const getDirectionLabel = (value: string) => {
    if (viewMode === 'plan') {
      switch (value) {
        case 'NE': return 'راست (شرق)';
        case 'NW': return 'بالا (شمال)';
        case 'SE': return 'چپ (غرب)';
        case 'SW': return 'پایین (جنوب)';
        case 'UP': return 'رایزر صعودی (↑)';
        case 'DOWN': return 'رایزر نزولی (↓)';
        default: return value;
      }
    } else {
      return DIRECTIONS.find(d => d.value === value)?.label || value;
    }
  };

  // Drawing Viewport Configuration
  const [width, setWidth] = useState(700);
  const [height, setHeight] = useState(550);
  const [scale, setScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('isom_scale');
      if (saved) return parseFloat(saved);
    } catch (e) {}
    return 48;
  });
  const [offsetX, setOffsetX] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('isom_offsetX');
      if (saved) return parseFloat(saved);
    } catch (e) {}
    return 300;
  });
  const [offsetY, setOffsetY] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('isom_offsetY');
      if (saved) return parseFloat(saved);
    } catch (e) {}
    return 320;
  });
  const [showGrid, setShowGrid] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('isom_showGrid');
      if (saved) return saved === 'true';
    } catch (e) {}
    return true;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalOffset, setOriginalOffset] = useState({ x: 0, y: 0 });
  const [interactionMode, setInteractionMode] = useState<'draw' | 'pan'>('draw');
  const [dragDistance, setDragDistance] = useState(0);

  // Label custom rendering states to prevent clutter and overlapping
  const [labelStagger, setLabelStagger] = useState(true);
  const [labelSideShift, setLabelSideShift] = useState(true); // Default to true (طرح تناوبی)
  const [labelFontSize, setLabelFontSize] = useState(6.5); // Default to 6.5
  const [labelHoverMode, setLabelHoverMode] = useState(false);
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);
  const [isLabelPanelOpen, setIsLabelPanelOpen] = useState(false);

  // Professional CAD blueprint real physical scale settings
  const [isPDFSettingsOpen, setIsPDFSettingsOpen] = useState(false);
  const [pdfPaperSize, setPdfPaperSize] = useState<'a4' | 'a3'>('a3');
  const [pdfScaleMode, setPdfScaleMode] = useState<'fit' | 'precise'>('precise');
  const [pdfPreciseScale, setPdfPreciseScale] = useState<'1:50' | '1:100' | '1:200'>('1:100');

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const lastTouchTimeRef = useRef<number>(0);

  // High performance touch & drag synchronization refs
  const dragArchOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartDistanceRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number>(48);
  const touchStartOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartMidRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPinchTimeRef = useRef<number>(0);
  const wasPinchZoomingRef = useRef<boolean>(false);

  // Resize listener to adapt coordinate system sizing
  useEffect(() => {
    if (canvasContainerRef.current) {
      setWidth(canvasContainerRef.current.clientWidth);
      setHeight(canvasContainerRef.current.clientHeight || 525);
    }
    const handleResize = () => {
      if (canvasContainerRef.current) {
        setWidth(canvasContainerRef.current.clientWidth);
        setHeight(canvasContainerRef.current.clientHeight || 525);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute coordinate pipeline recursively
  const computedPipeline: ComputedSegment[] = React.useMemo(() => {
    const computed: Record<string, ComputedSegment> = {};
    
    // Root segments are those without parent, or those whose parents don't exist
    const roots = segments.filter(s => !s.parentId || !segments.some(p => p.id === s.parentId));

    function process(segment: PipeSegment, parentEnd: Node3D = { x: 0, y: 0, z: 0 }, level = 0) {
      const start = { ...parentEnd };
      const end = { ...start };
      
      // Requirement 3: If segment length > 500cm (5.0m), cap drawing length at 5.0m but keep real length text display
      const L = segment.length > 5.0 ? 5.0 : segment.length;
      switch (segment.direction) {
        case 'NE':
          end.x += L;
          break;
        case 'NW':
          end.y += L;
          break;
        case 'SE':
          end.x -= L;
          break;
        case 'SW':
          end.y -= L;
          break;
        case 'UP':
          end.z += L;
          break;
        case 'DOWN':
          end.z -= L;
          break;
      }
      
      let startProj = { x: 0, y: 0 };
      let endProj = { x: 0, y: 0 };

      if (viewMode === 'plan') {
        // Orthogonal 2D layout:
        // NE (+X) -> right
        // SE (-X) -> left
        // NW (+Y) -> up (on screen, decrement y)
        // SW (-Y) -> down (on screen, increment y)
        startProj = {
          x: start.x * scale + offsetX,
          y: -start.y * scale + offsetY
        };
        endProj = {
          x: end.x * scale + offsetX,
          y: -end.y * scale + offsetY
        };
      } else {
        // Standalone isometric formula relative to scale and offset
        const cos30 = 0.8660254;
        const sin30 = 0.5;
        
        startProj = {
          x: (start.x - start.y) * cos30 * scale + offsetX,
          y: ((start.x + start.y) * sin30 - start.z) * scale + offsetY
        };
        
        endProj = {
          x: (end.x - end.y) * cos30 * scale + offsetX,
          y: ((end.x + end.y) * sin30 - end.z) * scale + offsetY
        };
      }
      
      computed[segment.id] = {
        ...segment,
        start,
        end,
        startProj,
        endProj,
        level
      };
      
      // Process child branches
      const children = segments.filter(s => s.parentId === segment.id);
      children.forEach(child => {
        process(child, end, level + 1);
      });
    }

    roots.forEach(r => process(r, { x: 0, y: 0, z: 0 }, 0));
    return Object.values(computed);
  }, [segments, scale, offsetX, offsetY, viewMode]);

  // Find all 2D intersection points to make lines crossover/cut according to blueprints standard
  const intersections = React.useMemo(() => {
    const list: { x: number, y: number, cutId: string, crossId: string }[] = [];
    for (let i = 0; i < computedPipeline.length; i++) {
      const s1 = computedPipeline[i];
      if (s1.length <= 0) continue;
      for (let j = i + 1; j < computedPipeline.length; j++) {
        const s2 = computedPipeline[j];
        if (s2.length <= 0) continue;
        
        const p = getLineIntersection(
          s1.startProj.x, s1.startProj.y, s1.endProj.x, s1.endProj.y,
          s2.startProj.x, s2.startProj.y, s2.endProj.x, s2.endProj.y
        );
        if (p) {
          // Exclude joint connection points (junctions)
          const distToS1Start = Math.hypot(p.x - s1.startProj.x, p.y - s1.startProj.y);
          const distToS1End = Math.hypot(p.x - s1.endProj.x, p.y - s1.endProj.y);
          const distToS2Start = Math.hypot(p.x - s2.startProj.x, p.y - s2.startProj.y);
          const distToS2End = Math.hypot(p.x - s2.endProj.x, p.y - s2.endProj.y);
          
          if (distToS1Start > 12 && distToS1End > 12 && distToS2Start > 12 && distToS2End > 12) {
            // Strictly follow drafting principles requested by the user:
            // The second (crossing) line must always be the interrupted/gapped one,
            // while the first (previously drawn) line remains continuous.
            const cutId = s2.id;
            const crossId = s1.id;
            list.push({ x: p.x, y: p.y, cutId, crossId });
          }
        }
      }
    }
    return list;
  }, [computedPipeline]);

  // Automated layout centering and optimal scaling factor estimation
  const handleAutoFit = () => {
    if (viewMode === 'plan') {
      // Fit to architectural element boundaries to center the floor plan layout on the screen
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
      
      setOffsetX(width / 2 - centerX);
      setOffsetY(height / 2 - centerY);
      return;
    }

    if (segments.length === 0) {
      setOffsetX(width / 2);
      setOffsetY(height / 2);
      setScale(45);
      return;
    }
    
    let rawMinX = Infinity, rawMaxX = -Infinity;
    let rawMinY = Infinity, rawMaxY = -Infinity;
    
    computedPipeline.forEach(s => {
      const startRawX = (s.start.x - s.start.y) * 0.8660254;
      const startRawY = (s.start.x + s.start.y) * 0.5 - s.start.z;
      const endRawX = (s.end.x - s.end.y) * 0.8660254;
      const endRawY = (s.end.x + s.end.y) * 0.5 - s.end.z;
      
      rawMinX = Math.min(rawMinX, startRawX, endRawX);
      rawMaxX = Math.max(rawMaxX, startRawX, endRawX);
      rawMinY = Math.min(rawMinY, startRawY, endRawY);
      rawMaxY = Math.max(rawMaxY, startRawY, endRawY);
    });
    
    const rawWidth = rawMaxX - rawMinX;
    const rawHeight = rawMaxY - rawMinY;
    
    const margin = 100;
    const availWidth = Math.max(150, width - margin * 2);
    const availHeight = Math.max(150, height - margin * 2);
    
    let targetScale = 45;
    if (rawWidth > 0 && rawHeight > 0) {
      const scaleX = availWidth / rawWidth;
      const scaleY = availHeight / rawHeight;
      targetScale = Math.min(scaleX, scaleY);
      targetScale = Math.round(Math.max(15, Math.min(targetScale, 110)));
    }
    
    const rawCenterX = (rawMinX + rawMaxX) / 2;
    const rawCenterY = (rawMinY + rawMaxY) / 2;
    
    setScale(targetScale);
    setOffsetX(width / 2 - rawCenterX * targetScale);
    setOffsetY(height / 2 - rawCenterY * targetScale);
  };

  // Run auto fit once container width is detected / loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      handleAutoFit();
    }, 400);
    return () => clearTimeout(timer);
  }, [width, height, viewMode]);

  // Synchronize edit inputs when active segment shifts
  useEffect(() => {
    if (selectedSegmentId) {
      const s = segments.find(x => x.id === selectedSegmentId);
      if (s) {
        setEditName(s.name);
        setEditDirection(s.direction);
        setEditLength(Math.round(s.length * 100).toString());
        setEditSize(s.size);
        setEditAccessory(s.accessory);
        setEditAccessoryPos(s.accessoryPosition);
        
        // Also update parent dropdown for new node connections
        setNewParentId(s.id);
      }
    } else {
      setIsEditingSegment(false);
    }
  }, [selectedSegmentId, segments]);

  // Sync state modifications dynamically to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('isom_pipe_segments', JSON.stringify(isoSegments));
    } catch (e) {
      console.error('Failed to save isoSegments to localStorage', e);
    }
  }, [isoSegments]);

  useEffect(() => {
    try {
      localStorage.setItem('plan_pipe_segments', JSON.stringify(planSegments));
    } catch (e) {
      console.error('Failed to save planSegments to localStorage', e);
    }
  }, [planSegments]);

  useEffect(() => {
    try {
      localStorage.setItem('isom_scale', scale.toString());
      localStorage.setItem('isom_offsetX', offsetX.toString());
      localStorage.setItem('isom_offsetY', offsetY.toString());
      localStorage.setItem('isom_showGrid', showGrid.toString());
      localStorage.setItem('isom_isPrintTheme', isPrintTheme.toString());
      localStorage.setItem('isom_viewMode', viewMode);
    } catch (e) {}
  }, [scale, offsetX, offsetY, showGrid, isPrintTheme, viewMode]);

  const startResizing = (e: React.MouseEvent, elId: string, edge: 'start' | 'end' | 'height') => {
    e.stopPropagation();
    e.preventDefault();
    const el = archElements.find(item => item.id === elId);
    if (!el) return;
    archSnapshotRef.current = [...archElements];
    setIsResizingArch(true);
    setResizeArchEdge(edge);
    setResizeArchDimension(edge === 'height' ? 'height' : 'width');
    setResizeArchStart({
      x: e.clientX,
      y: e.clientY,
      initialWidth: el.width,
      initialHeight: el.height,
      initialX: el.x,
      initialY: el.y
    });
  };

  const startResizingTouch = (e: React.TouchEvent, elId: string, edge: 'start' | 'end' | 'height') => {
    e.stopPropagation();
    const el = archElements.find(item => item.id === elId);
    if (!el) return;
    const touch = e.touches[0];
    archSnapshotRef.current = [...archElements];
    setIsResizingArch(true);
    setResizeArchEdge(edge);
    setResizeArchDimension(edge === 'height' ? 'height' : 'width');
    setResizeArchStart({
      x: touch.clientX,
      y: touch.clientY,
      initialWidth: el.width,
      initialHeight: el.height,
      initialX: el.x,
      initialY: el.y
    });
  };

  const snapToClosestWall = (x: number, y: number, elType: 'door' | 'window', currentRotation: number): { x: number; y: number; rotation: number } => {
    let bestX = x;
    let bestY = y;
    let bestRotation = currentRotation;
    let minDistance = 25; // snap threshold in pixels

    archElements.forEach(wall => {
      if (wall.type !== 'wall') return;

      const isVertical = wall.rotation === 90 || wall.rotation === 270;
      
      let dist = 0;
      if (isVertical) {
        dist = Math.abs(x - wall.x);
        if (dist < minDistance && y >= wall.y && y <= wall.y + wall.width) {
          minDistance = dist;
          bestX = wall.x;
          bestY = Math.min(wall.y + wall.width - 10, Math.max(wall.y + 10, y)); // keep it bounded
          bestRotation = wall.rotation;
        }
      } else {
        dist = Math.abs(y - wall.y);
        if (dist < minDistance && x >= wall.x && x <= wall.x + wall.width) {
          minDistance = dist;
          bestX = Math.min(wall.x + wall.width - 10, Math.max(wall.x + 10, x)); // keep it bounded
          bestY = wall.y;
          bestRotation = wall.rotation;
        }
      }
    });

    return { x: bestX, y: bestY, rotation: bestRotation };
  };

  const getWallEndpoints = (el: ArchElement) => {
    const rad = (el.rotation * Math.PI) / 180;
    const p1 = { x: el.x, y: el.y };
    const p2 = {
      x: el.x + el.width * Math.cos(rad),
      y: el.y + el.width * Math.sin(rad)
    };
    return { p1, p2 };
  };

  const propagateWallChanges = (prevElements: ArchElement[], updatedId: string, nextElementState: ArchElement): ArchElement[] => {
    // 1. If the updated element is not a wall, just update it in the array
    if (nextElementState.type !== 'wall') {
      return prevElements.map(el => el.id === updatedId ? nextElementState : el);
    }

    const walls = prevElements.filter(el => el.type === 'wall');
    
    // 2. Find the original driver wall in the previous elements
    const origDriver = walls.find(w => w.id === updatedId);
    if (!origDriver) {
      return prevElements.map(el => el.id === updatedId ? nextElementState : el);
    }

    const origDriverPts = getWallEndpoints(origDriver);
    const newDriverPts = getWallEndpoints(nextElementState);

    // Endpoint displacement of the driver wall
    const dp1 = {
      x: newDriverPts.p1.x - origDriverPts.p1.x,
      y: newDriverPts.p1.y - origDriverPts.p1.y
    };
    const dp2 = {
      x: newDriverPts.p2.x - origDriverPts.p2.x,
      y: newDriverPts.p2.y - origDriverPts.p2.y
    };

    // 4. Cluster all original endpoints of all walls to find joints in the PREVIOUS state
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

    // Grouping into joints using simple transitive closure
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

          // Snapping threshold 20px
          const dist = Math.hypot(curr.x - other.x, curr.y - other.y);
          if (dist < 20) {
            visited.add(otherKey);
            queue.push(other);
          }
        });
      }
      joints.push(joint);
    });

    // 5. Build displacement vectors for each joint
    const jointDisplacements = joints.map((joint) => {
      const hasDriverP1 = joint.some(ep => ep.wallId === updatedId && ep.pointKey === 'p1');
      const hasDriverP2 = joint.some(ep => ep.wallId === updatedId && ep.pointKey === 'p2');

      if (hasDriverP1 && hasDriverP2) {
        return {
          dx: (dp1.x + dp2.x) / 2,
          dy: (dp1.y + dp2.y) / 2
        };
      } else if (hasDriverP1) {
        return { dx: dp1.x, dy: dp1.y };
      } else if (hasDriverP2) {
        return { dx: dp2.x, dy: dp2.y };
      }
      return { dx: 0, dy: 0 };
    });

    // 6. Map each wall endpoint to its containing joint's displacement
    const findJointDisplacement = (wallId: string, pointKey: 'p1' | 'p2') => {
      const index = joints.findIndex(joint => joint.some(ep => ep.wallId === wallId && ep.pointKey === pointKey));
      if (index === -1) return { dx: 0, dy: 0 };
      return jointDisplacements[index];
    };

    // 7. Reconstruct all architectural elements
    return prevElements.map(el => {
      if (el.id === updatedId) {
        return nextElementState;
      }
      if (el.type !== 'wall') {
        return el;
      }

      const origPts = getWallEndpoints(el);
      const disp1 = findJointDisplacement(el.id, 'p1');
      const disp2 = findJointDisplacement(el.id, 'p2');

      // If neither end of this wall shifted, keep it as is!
      if (disp1.dx === 0 && disp1.dy === 0 && disp2.dx === 0 && disp2.dy === 0) {
        return el;
      }

      const finalP1 = {
        x: origPts.p1.x + disp1.dx,
        y: origPts.p1.y + disp1.dy
      };
      const finalP2 = {
        x: origPts.p2.x + disp2.dx,
        y: origPts.p2.y + disp2.dy
      };

      const newDx = finalP2.x - finalP1.x;
      const newDy = finalP2.y - finalP1.y;
      const length = Math.hypot(newDx, newDy);

      let angle = Math.atan2(newDy, newDx) * 180 / Math.PI;
      if (angle < 0) angle += 360;

      // Handle axial wall constraint propagation
      const snapAngle = Math.round(angle / 90) * 90 % 360;
      let finalAngle = angle;
      if (Math.abs(angle - snapAngle) < 15) {
        finalAngle = snapAngle;
      }

      let finalP2_x = finalP2.x;
      let finalP2_y = finalP2.y;

      // If the wall is snapped axial, enforce coordinate alignment
      if (finalAngle === 0 || finalAngle === 180) {
        finalP2_y = finalP1.y;
      } else if (finalAngle === 90 || finalAngle === 270) {
        finalP2_x = finalP1.x;
      }

      const axialLength = Math.hypot(finalP2_x - finalP1.x, finalP2_y - finalP1.y);

      return {
        ...el,
        x: Math.round(finalP1.x),
        y: Math.round(finalP1.y),
        width: Math.max(15, Math.round(axialLength)),
        rotation: finalAngle
      };
    });
  };

  const handleArchMouseDown = (e: React.MouseEvent, el: ArchElement) => {
    e.stopPropagation();
    archSnapshotRef.current = [...archElements];
    setSelectedArchElementId(el.id);
    setActiveDraggingArchId(el.id);
    setDragDistance(0);
    setDragArchOffset({
      x: e.clientX,
      y: e.clientY
    });
    dragArchOffsetRef.current = {
      x: e.clientX,
      y: e.clientY
    };
  };

  const handleArchTouchStart = (e: React.TouchEvent, el: ArchElement) => {
    e.stopPropagation();
    archSnapshotRef.current = [...archElements];
    setSelectedArchElementId(el.id);
    setActiveDraggingArchId(el.id);
    setDragDistance(0);
    if (e.touches.length > 0) {
      setDragArchOffset({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
      dragArchOffsetRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  };

  // Helper to snap a wall end/start point to other walls' endpoints during RESIZING
  const snapWallEndpointsDuringResize = (
    item: ArchElement,
    prevElements: ArchElement[],
    edge: 'start' | 'end',
    dx: number,
    dy: number
  ) => {
    const rad = (item.rotation * Math.PI) / 180;
    const initialWidth = resizeArchStart.initialWidth;
    const initialX = resizeArchStart.initialX ?? item.x;
    const initialY = resizeArchStart.initialY ?? item.y;
    const local_dl = dx * Math.cos(rad) + dy * Math.sin(rad);

    let updatedWidth = initialWidth;
    let updatedX = initialX;
    let updatedY = initialY;

    if (edge === 'start') {
      updatedWidth = Math.max(15, initialWidth - local_dl);
      const actual_dl = initialWidth - updatedWidth;
      updatedX = initialX + actual_dl * Math.cos(rad);
      updatedY = initialY + actual_dl * Math.sin(rad);
    } else {
      updatedWidth = Math.max(15, initialWidth + local_dl);
    }

    const otherWalls = prevElements.filter(w => w.type === 'wall' && w.id !== item.id);
    const snapCandidates: { x: number; y: number }[] = [];
    
    otherWalls.forEach(ow => {
      const owRad = (ow.rotation * Math.PI) / 180;
      snapCandidates.push({ x: ow.x, y: ow.y });
      snapCandidates.push({
        x: ow.x + ow.width * Math.cos(owRad),
        y: ow.y + ow.width * Math.sin(owRad)
      });
    });

    const targetX = edge === 'start' ? updatedX : (initialX + updatedWidth * Math.cos(rad));
    const targetY = edge === 'start' ? updatedY : (initialY + updatedWidth * Math.sin(rad));
    let minSnapDist = 30; // 30px snapping radius
    let shouldSnap = false;
    let bestSnapX = targetX;
    let bestSnapY = targetY;

    snapCandidates.forEach(cand => {
      const d = Math.hypot(targetX - cand.x, targetY - cand.y);
      if (d < minSnapDist) {
        minSnapDist = d;
        bestSnapX = cand.x;
        bestSnapY = cand.y;
        shouldSnap = true;
      }
    });

    if (shouldSnap) {
      if (edge === 'start') {
        const p2_fixed_x = initialX + initialWidth * Math.cos(rad);
        const p2_fixed_y = initialY + initialWidth * Math.sin(rad);
        // Recalculate width as distance to fixed p2
        const finalWidth = Math.hypot(p2_fixed_x - bestSnapX, p2_fixed_y - bestSnapY);
        return {
          ...item,
          width: Math.max(15, Math.round(finalWidth)),
          x: Math.round(bestSnapX),
          y: Math.round(bestSnapY)
        };
      } else {
        // Recalculate width as distance from fixed p1 (initialX, initialY) to snapped p2
        const finalWidth = Math.hypot(bestSnapX - initialX, bestSnapY - initialY);
        return {
          ...item,
          width: Math.max(15, Math.round(finalWidth))
        };
      }
    }

    return {
      ...item,
      width: Math.round(updatedWidth),
      x: Math.round(updatedX),
      y: Math.round(updatedY)
    };
  };

  // Helper to snap a wall's endpoint to other walls' endpoints during DRAGGING
  const snapWallDuringDrag = (
    item: ArchElement,
    prevElements: ArchElement[],
    dx: number,
    dy: number
  ) => {
    let newX = item.x + dx;
    let newY = item.y + dy;
    const rad = (item.rotation * Math.PI) / 180;
    const p1_cand = { x: newX, y: newY };
    const p2_cand = {
      x: newX + item.width * Math.cos(rad),
      y: newY + item.width * Math.sin(rad)
    };

    const otherWalls = prevElements.filter(w => w.type === 'wall' && w.id !== item.id);
    const snapCandidates: { x: number; y: number }[] = [];
    
    otherWalls.forEach(ow => {
      const owRad = (ow.rotation * Math.PI) / 180;
      snapCandidates.push({ x: ow.x, y: ow.y });
      snapCandidates.push({
        x: ow.x + ow.width * Math.cos(owRad),
        y: ow.y + ow.width * Math.sin(owRad)
      });
    });

    let bestSnapX = 0;
    let bestSnapY = 0;
    let minSnapDist = 30; // 30px snapping radius
    let snapP1 = true;
    let shouldSnap = false;

    snapCandidates.forEach(cand => {
      const d1 = Math.hypot(p1_cand.x - cand.x, p1_cand.y - cand.y);
      if (d1 < minSnapDist) {
        minSnapDist = d1;
        bestSnapX = cand.x;
        bestSnapY = cand.y;
        snapP1 = true;
        shouldSnap = true;
      }
      const d2 = Math.hypot(p2_cand.x - cand.x, p2_cand.y - cand.y);
      if (d2 < minSnapDist) {
        minSnapDist = d2;
        bestSnapX = cand.x;
        bestSnapY = cand.y;
        snapP1 = false;
        shouldSnap = true;
      }
    });

    if (shouldSnap) {
      if (snapP1) {
        newX = bestSnapX;
        newY = bestSnapY;
      } else {
        newX = bestSnapX - item.width * Math.cos(rad);
        newY = bestSnapY - item.width * Math.sin(rad);
      }
    }

    return {
      ...item,
      x: Math.round(newX),
      y: Math.round(newY)
    };
  };

  // Canvas manual drag mechanics
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (Date.now() - lastTouchTimeRef.current < 600) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setOriginalOffset({ x: offsetX, y: offsetY });
    setDragDistance(0);
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

        if (item.type === 'wall' && (resizeArchEdge === 'start' || resizeArchEdge === 'end')) {
          updatedItem = snapWallEndpointsDuringResize(item, prev, resizeArchEdge, dx, dy);
        } else {
          // Fallback / other architectural items standard resizing
          const newWidth = resizeArchDimension === 'width' ? Math.max(15, resizeArchStart.initialWidth + dx) : item.width;
          const newHeight = resizeArchDimension === 'height' ? Math.max(4, resizeArchStart.initialHeight + dy) : item.height;
          updatedItem = {
            ...item,
            width: newWidth,
            height: newHeight
          };
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

        let updatedItem = { ...item };

        if (item.type === 'wall') {
          updatedItem = snapWallDuringDrag(item, prev, dx, dy);
        } else {
          let newX = item.x + dx;
          let newY = item.y + dy;
          let newRotation = item.rotation;

          if (item.type === 'door' || item.type === 'window') {
            const snapped = snapToClosestWall(newX, newY, item.type, item.rotation);
            newX = snapped.x;
            newY = snapped.y;
            newRotation = snapped.rotation;
          }

          updatedItem = {
            ...item,
            x: Math.round(newX),
            y: Math.round(newY),
            rotation: newRotation
          };
        }

        return propagateWallChanges(prev, activeDraggingArchId, updatedItem);
      });
      dragArchOffsetRef.current = { x: e.clientX, y: e.clientY };
      setDragArchOffset({ x: e.clientX, y: e.clientY });
      return;
    }
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const dist = Math.hypot(dx, dy);
    setDragDistance(prev => Math.max(prev, dist));
    if (interactionMode === 'pan') {
      setOffsetX(originalOffset.x + dx);
      setOffsetY(originalOffset.y + dy);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (Date.now() - lastTouchTimeRef.current < 600) return;
    if (Date.now() - lastPinchTimeRef.current < 1500) return; // Prevent drawings on mouse events simulated after pinch
    setIsDragging(false);
    setIsResizingArch(false);
    setActiveDraggingArchId(null);

    if (archSnapshotRef.current) {
      const currentSnapshot = archSnapshotRef.current;
      const changed = JSON.stringify(currentSnapshot) !== JSON.stringify(archElements);
      if (changed) {
        setArchHistory(h => [...h, currentSnapshot]);
      }
      archSnapshotRef.current = null;
    }

    if (dragDistance < 7) {
      setSelectedArchElementId(null);
      if (interactionMode === 'draw') {
        handleCanvasClickEvent(e.clientX, e.clientY);
      } else {
        // In 'pan' mode, keep the selected pipe segment active so the user can continue drawing from its end when switching back to 'draw'.
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    lastTouchTimeRef.current = Date.now();
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setOriginalOffset({ x: offsetX, y: offsetY });
      setDragDistance(0);
      wasPinchZoomingRef.current = false;
    } else if (e.touches.length === 2) {
      // Initialize pinch-to-zoom
      setIsDragging(false);
      setActiveDraggingArchId(null);
      setIsResizingArch(false);
      wasPinchZoomingRef.current = true;
      lastPinchTimeRef.current = Date.now();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      touchStartDistanceRef.current = dist;
      touchStartScaleRef.current = scale;
      touchStartOffsetRef.current = { x: offsetX, y: offsetY };
      touchStartMidRef.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    lastTouchTimeRef.current = Date.now();
    
    // Check for pinch-to-zoom first (two fingers)
    if (e.touches.length === 2 && touchStartDistanceRef.current !== null) {
      wasPinchZoomingRef.current = true;
      lastPinchTimeRef.current = Date.now();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const startDist = touchStartDistanceRef.current;
      
      if (startDist > 0) {
        const ratio = dist / startDist;
        const initialScale = touchStartScaleRef.current;
        const targetScale = Math.min(120, Math.max(15, initialScale * ratio));
        
        const currentMidX = (touch1.clientX + touch2.clientX) / 2;
        const currentMidY = (touch1.clientY + touch2.clientY) / 2;
        
        const container = canvasContainerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const px = touchStartMidRef.current.x - rect.left;
          const py = touchStartMidRef.current.y - rect.top;
          
          const oldScale = initialScale;
          const oldOffsetX = touchStartOffsetRef.current.x;
          const oldOffsetY = touchStartOffsetRef.current.y;
          
          const newScale = targetScale;
          const curMidX_rel = currentMidX - rect.left;
          const curMidY_rel = currentMidY - rect.top;
          
          const newOffsetX = curMidX_rel - ((px - oldOffsetX) / oldScale) * newScale;
          const newOffsetY = curMidY_rel - ((py - oldOffsetY) / oldScale) * newScale;
          
          setScale(newScale);
          setOffsetX(newOffsetX);
          setOffsetY(newOffsetY);
        }
      }
      return;
    }

    if (isResizingArch && selectedArchElementId && e.touches.length === 1) {
      const touch = e.touches[0];
      const scaleFactor = scale / 48;
      const dx = (touch.clientX - resizeArchStart.x) / scaleFactor;
      const dy = (touch.clientY - resizeArchStart.y) / scaleFactor;
      setArchElements(prev => {
        const item = prev.find(x => x.id === selectedArchElementId);
        if (!item) return prev;

        let updatedItem = { ...item };

        if (item.type === 'wall' && (resizeArchEdge === 'start' || resizeArchEdge === 'end')) {
          updatedItem = snapWallEndpointsDuringResize(item, prev, resizeArchEdge, dx, dy);
        } else {
          // Fallback / other architectural items standard resizing
          const newWidth = resizeArchDimension === 'width' ? Math.max(15, resizeArchStart.initialWidth + dx) : item.width;
          const newHeight = resizeArchDimension === 'height' ? Math.max(4, resizeArchStart.initialHeight + dy) : item.height;
          updatedItem = {
            ...item,
            width: newWidth,
            height: newHeight
          };
        }

        return propagateWallChanges(prev, selectedArchElementId, updatedItem);
      });
      return;
    }
    if (activeDraggingArchId && e.touches.length === 1) {
      const touch = e.touches[0];
      const scaleFactor = scale / 48;
      const prevOffset = dragArchOffsetRef.current;
      const dx = (touch.clientX - prevOffset.x) / scaleFactor;
      const dy = (touch.clientY - prevOffset.y) / scaleFactor;
      setArchElements(prev => {
        const item = prev.find(x => x.id === activeDraggingArchId);
        if (!item) return prev;

        let updatedItem = { ...item };

        if (item.type === 'wall') {
          updatedItem = snapWallDuringDrag(item, prev, dx, dy);
        } else {
          let newX = item.x + dx;
          let newY = item.y + dy;
          let newRotation = item.rotation;

          if (item.type === 'door' || item.type === 'window') {
            const snapped = snapToClosestWall(newX, newY, item.type, item.rotation);
            newX = snapped.x;
            newY = snapped.y;
            newRotation = snapped.rotation;
          }

          updatedItem = {
            ...item,
            x: Math.round(newX),
            y: Math.round(newY),
            rotation: newRotation
          };
        }

        return propagateWallChanges(prev, activeDraggingArchId, updatedItem);
      });
      dragArchOffsetRef.current = { x: touch.clientX, y: touch.clientY };
      setDragArchOffset({ x: touch.clientX, y: touch.clientY });
      return;
    }
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;
    const dist = Math.hypot(dx, dy);
    setDragDistance(prev => Math.max(prev, dist));
    if (interactionMode === 'pan') {
      setOffsetX(originalOffset.x + dx);
      setOffsetY(originalOffset.y + dy);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<SVGSVGElement>) => {
    lastTouchTimeRef.current = Date.now();
    setIsDragging(false);
    setIsResizingArch(false);
    setActiveDraggingArchId(null);
    touchStartDistanceRef.current = null;
    
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
    }
    
    if (wasPinch) {
      return;
    }

    if (dragDistance < 7) {
      setSelectedArchElementId(null);
      if (interactionMode === 'draw' && e.changedTouches.length > 0) {
        e.preventDefault();
        handleCanvasClickEvent(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      } else {
        // In 'pan' mode, keep the selected pipe active so user can switch back to draw mode later and continue drawing from its end
      }
    }
  };

  // Click-to-Draw algorithm for isometric 30-degree vector generation
  const handleCanvasClickEvent = (clientX: number, clientY: number) => {
    if (Date.now() - lastPinchTimeRef.current < 1500) {
      return; // Absolute shield against accidental touches during and right after pinch zoom gestures
    }
    if (interactionMode !== 'draw') return;

    const container = canvasContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const cos30 = 0.8660254;
    const sin30 = 0.5;

    // Isometric 3D vectors mapping to their screen projection offsets:
    const dirsList: { dir: 'NE' | 'NW' | 'SE' | 'SW' | 'UP' | 'DOWN'; ux: number; uy: number }[] = [
      { dir: 'NE', ux: cos30, uy: sin30 },
      { dir: 'NW', ux: -cos30, uy: sin30 },
      { dir: 'SE', ux: -cos30, uy: -sin30 },
      { dir: 'SW', ux: cos30, uy: -sin30 },
      { dir: 'UP', ux: 0, uy: -1 },
      { dir: 'DOWN', ux: 0, uy: 1 }
    ];

    if (segments.length === 0) {
      // Place the starting reference point at the clicked coordinates with zero line length
      const id = Date.now().toString();
      const newSeg: PipeSegment = {
        id,
        parentId: null,
        name: 'رگولاتور شروع سیستم (ورودی)',
        direction: 'NE',
        length: 0, // Zero length, no line is drawn
        size: newSize || '1/2"',
        accessory: 'regulator',
        accessoryPosition: 'start'
      };

      setOffsetX(clickX);
      setOffsetY(clickY);
      changeSegments([newSeg]);
      setSelectedSegmentId(id);
      setIsEditingSegment(true);
      return;
    }

    // Find the latest active node end projection 
    let parentSeg = computedPipeline.find(s => s.id === selectedSegmentId);
    if (!parentSeg && computedPipeline.length > 0) {
      // Default to the last added segment in list
      parentSeg = computedPipeline[computedPipeline.length - 1];
    }
    if (!parentSeg) return;

    const dx = clickX - parentSeg.endProj.x;
    const dy = clickY - parentSeg.endProj.y;

    let bestDir: 'NE' | 'NW' | 'SE' | 'SW' | 'UP' | 'DOWN' = 'NE';
    let maxDot = -Infinity;

    dirsList.forEach(d => {
      // Dot product projection
      const dot = dx * d.ux + dy * d.uy;
      if (dot > maxDot) {
        maxDot = dot;
        bestDir = d.dir;
      }
    });

    // Calculate length based on clicked distance projected in that direction
    let calculatedLen = maxDot / scale;
    // Round to 1 decimal place. E.g., 2.3m, 4.0m
    calculatedLen = Math.round(calculatedLen * 10) / 10;
    if (calculatedLen < 0.2) {
      calculatedLen = 0.5; // Responsive small fallback segment
    }
    if (calculatedLen > 30) {
      calculatedLen = 15.0; // Prevent massive line accidental overflow
    }

    const id = Date.now().toString();
    const nextNum = segments.length + 1;
    const newSeg: PipeSegment = {
      id,
      parentId: parentSeg.id,
      name: `لوله انشعاب شماره ${nextNum}`,
      direction: bestDir,
      length: calculatedLen,
      size: newSize || '1/2"',
      accessory: 'none',
      accessoryPosition: 'end'
    };

    changeSegments(prev => [...prev, newSeg]);
    setSelectedSegmentId(id);
    setIsEditingSegment(true);
  };

  // Quick action accessory applicator
  const handleQuickSetAccessory = (accType: 'none' | 'valve' | 'yard_valve' | 'meter' | 'regulator' | 'boiler' | 'water_heater' | 'floor_water_heater' | 'stove' | 'heater') => {
    if (!selectedSegmentId) {
      alert('لطفا ابتدا یک خط لوله را از روی نقشه انتخاب کنید.');
      return;
    }
    changeSegments(prev => prev.map(s => {
      if (s.id === selectedSegmentId) {
        return {
          ...s,
          accessory: accType,
          accessoryPosition: 'end'
        };
      }
      return s;
    }));
  };

  // Quick pipe size shortcut selector
  const handleQuickSetSize = (sizeValue: string) => {
    if (selectedSegmentId) {
      changeSegments(prev => prev.map(s => {
        if (s.id === selectedSegmentId) {
          return { ...s, size: sizeValue };
        }
        return s;
      }));
    }
    setNewSize(sizeValue);
    setEditSize(sizeValue);
  };

  // Quick incremental length adjustment (with centimeters)
  const handleQuickAdjustLength = (amountCm: number) => {
    if (!selectedSegmentId) return;
    changeSegments(prev => prev.map(s => {
      if (s.id === selectedSegmentId) {
        const currentCm = Math.round(s.length * 100);
        const nextCm = Math.max(10, currentCm + amountCm);
        const nextLenMeters = nextCm / 100;
        setEditLength(nextCm.toString());
        return { ...s, length: nextLenMeters };
      }
      return s;
    }));
  };

  const handleClearAll = () => {
    changeSegments([]);
    setSelectedSegmentId(null);
    setIsEditingSegment(false);
  };

  // Create new pipeline branch
  const handleAddSegment = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Date.now().toString();
    const parsedCm = parseFloat(newLength);
    const meters = isNaN(parsedCm) || parsedCm <= 0 ? 1.0 : parsedCm / 100;
    const newSeg: PipeSegment = {
      id,
      parentId: newParentId === 'root' ? null : newParentId,
      name: newName.trim() || 'شاخه لوله بدون نام',
      direction: newDirection,
      length: meters,
      size: newSize,
      accessory: newAccessory,
      accessoryPosition: newAccessoryPos
    };

    changeSegments(prev => [...prev, newSeg]);
    setSelectedSegmentId(id);
    setNewName('انشعاب فرعی جدید');
    
    // Automatically recalculate zoom parameters to keep things beautiful
    setTimeout(() => handleAutoFit(), 100);
  };

  // Update existing segment properties
  const handleUpdateSegment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSegmentId) return;

    const parsedCm = parseFloat(editLength);
    const meters = isNaN(parsedCm) || parsedCm <= 0 ? 1.0 : parsedCm / 100;

    changeSegments(prev => prev.map(s => {
      if (s.id === selectedSegmentId) {
        return {
          ...s,
          name: editName.trim() || 'لوله بدون نام',
          direction: editDirection,
          length: meters,
          size: editSize,
          accessory: editAccessory,
          accessoryPosition: editAccessoryPos
        };
      }
      return s;
    }));
    
    setIsEditingSegment(false);
    setTimeout(() => handleAutoFit(), 100);
  };

  // Safely delete a segment and all recursively downstream descendants
  const handleDeleteSegment = (idToDelete: string) => {
    const sToDelete = segments.find(s => s.id === idToDelete);
    if (!sToDelete) return;
    setDeleteConfirmationId(idToDelete);
  };

  // 2D Plan Layout Architectural Customizers and Presets
  const handleLoadPresetSquare = () => {
    const elements: ArchElement[] = [
      { id: 'wall-1', type: 'wall', x: -150, y: -100, width: 300, height: 10, rotation: 0, name: 'دیوار خارجی شمالی' },
      { id: 'wall-2', type: 'wall', x: -150, y: -100, width: 200, height: 10, rotation: 90, name: 'دیوار خارجی غربی' },
      { id: 'wall-3', type: 'wall', x: 150, y: -100, width: 200, height: 10, rotation: 90, name: 'دیوار خارجی شرقی' },
      { id: 'wall-4', type: 'wall', x: -150, y: 100, width: 300, height: 10, rotation: 0, name: 'دیوار خارجی جنوبی' },
      { id: 'door-1', type: 'door', x: -30, y: 100, width: 35, height: 35, rotation: 180, name: 'درب ورودی اصلی' },
      { id: 'window-1', type: 'window', x: 150, y: -10, width: 50, height: 10, rotation: 90, name: 'پنجره سالن' },
      { id: 'window-2', type: 'window', x: -100, y: -100, width: 50, height: 10, rotation: 0, name: 'پنجره بالا' },
      { id: 'label-1', type: 'label', x: -10, y: -10, width: 120, height: 30, rotation: 0, name: 'پذیرایی بزرگ' }
    ];
    setArchElements(elements);
    setSelectedArchElementId(null);
  };

  const handleLoadPresetLShape = () => {
    const elements: ArchElement[] = [
      { id: 'l-w1', type: 'wall', x: -150, y: -120, width: 300, height: 10, rotation: 0, name: 'دیوار شمالی' },
      { id: 'l-w2', type: 'wall', x: 150, y: -120, width: 130, height: 10, rotation: 90, name: 'دیوار شرقی بالایی' },
      { id: 'l-w3', type: 'wall', x: 0, y: 10, width: 150, height: 10, rotation: 0, name: 'دیوار میانی افقی' },
      { id: 'l-w4', type: 'wall', x: 0, y: 10, width: 110, height: 10, rotation: 90, name: 'دیوار شرقی پایینی' },
      { id: 'l-w5', type: 'wall', x: -150, y: 120, width: 150, height: 10, rotation: 0, name: 'دیوار جنوبی' },
      { id: 'l-w6', type: 'wall', x: -150, y: -120, width: 240, height: 10, rotation: 90, name: 'دیوار غربی' },
      { id: 'l-w7', type: 'wall', x: -150, y: -10, width: 150, height: 10, rotation: 0, name: 'دیوار تفکیک آشپزخانه' },
      { id: 'l-d1', type: 'door', x: -40, y: 120, width: 30, height: 30, rotation: 180, name: 'درب ورودی اصلی' },
      { id: 'l-win1', type: 'window', x: -150, y: -20, width: 50, height: 10, rotation: 90, name: 'پنجره سالن' },
      { id: 'l-win2', type: 'window', x: 50, y: -120, width: 60, height: 10, rotation: 0, name: 'پنجره اتاق بالا' },
      { id: 'l-st1', type: 'stairs', x: 60, y: -80, width: 50, height: 75, rotation: 0, name: 'پله حیاط' },
      { id: 'l-lb1', type: 'label', x: -60, y: -60, width: 90, height: 25, rotation: 0, name: 'سالن بزرگ' },
      { id: 'l-lb2', type: 'label', x: 70, y: -30, width: 80, height: 25, rotation: 0, name: 'اتاق خواب' },
      { id: 'l-lb3', type: 'label', x: -80, y: 40, width: 80, height: 25, rotation: 0, name: 'آشپزخانه اپن' }
    ];
    setArchElements(elements);
    setSelectedArchElementId(null);
  };

  const handleLoadPresetThreeRoom = () => {
    const elements: ArchElement[] = [
      { id: 'u-w1', type: 'wall', x: -160, y: -120, width: 335, height: 10, rotation: 0, name: 'دیوار خارجی شمالی' },
      { id: 'u-w2', type: 'wall', x: -160, y: -120, width: 260, height: 10, rotation: 90, name: 'دیوار خارجی غربی' },
      { id: 'u-w3', type: 'wall', x: 175, y: -120, width: 260, height: 10, rotation: 90, name: 'دیوار خارجی شرقی' },
      { id: 'u-w4', type: 'wall', x: -160, y: 140, width: 335, height: 10, rotation: 0, name: 'دیوار خارجی جنوبی' },
      { id: 'u-w5', type: 'wall', x: 20, y: -120, width: 140, height: 10, rotation: 90, name: 'دیوار تفکیک آشپزخانه' },
      { id: 'u-w6', type: 'wall', x: -160, y: 20, width: 180, height: 10, rotation: 0, name: 'دیوار اتاق خواب ۱' },
      { id: 'u-w7', type: 'wall', x: -160, y: -50, width: 180, height: 10, rotation: 0, name: 'دیوار اتاق خواب ۲' },
      { id: 'u-d1', type: 'door', x: -40, y: 140, width: 35, height: 35, rotation: 180, name: 'درب ورودی لابی' },
      { id: 'u-d2', type: 'door', x: -100, y: 20, width: 30, height: 30, rotation: 0, name: 'درب خواب مستر' },
      { id: 'u-d3', type: 'door', x: -100, y: -50, width: 30, height: 30, rotation: 180, name: 'درب خواب کودک' },
      { id: 'u-win1', type: 'window', x: 175, y: 20, width: 50, height: 10, rotation: 90, name: 'پنجره سالن' },
      { id: 'u-win2', type: 'window', x: -60, y: -120, width: 50, height: 10, rotation: 0, name: 'پنجره آشپزخانه غرق‌نور' },
      { id: 'u-st1', type: 'stairs', x: 100, y: -100, width: 60, height: 100, rotation: 0, name: 'راه‌پله و آسانسور' },
      { id: 'u-lb1', type: 'label', x: 100, y: -30, width: 100, height: 30, rotation: 0, name: 'آشپزخانه مبله' },
      { id: 'u-lb2', type: 'label', x: -60, y: 80, width: 120, height: 30, rotation: 0, name: 'سالن نشیمن خانوادگی' },
      { id: 'u-lb3', type: 'label', x: -70, y: -20, width: 100, height: 30, rotation: 0, name: 'خواب اصلی (مستر)' },
      { id: 'u-lb4', type: 'label', x: -70, y: -80, width: 100, height: 30, rotation: 0, name: 'خواب کودک (تک نفره)' }
    ];
    setArchElements(elements);
    setSelectedArchElementId(null);
  };

  const handleClearPresets = () => {
    setArchElements([]);
    setSelectedArchElementId(null);
  };

  const handleAddWall = () => {
    const id = `wall-${Date.now()}`;
    const newEl: ArchElement = {
      id,
      type: 'wall',
      x: -50,
      y: -50,
      width: 150,
      height: 10,
      rotation: 0,
      name: 'دیوار جدید لوله‌کشی'
    };
    setArchElements([...archElements, newEl]);
    setSelectedArchElementId(id);
  };

  const handleAddDoor = () => {
    const id = `door-${Date.now()}`;
    const newEl: ArchElement = {
      id,
      type: 'door',
      x: -20,
      y: -20,
      width: 35,
      height: 35,
      rotation: 0,
      name: 'درب ورودی جدید'
    };
    setArchElements([...archElements, newEl]);
    setSelectedArchElementId(id);
  };

  const handleAddWindow = () => {
    const id = `window-${Date.now()}`;
    const newEl: ArchElement = {
      id,
      type: 'window',
      x: -25,
      y: -5,
      width: 50,
      height: 10,
      rotation: 0,
      name: 'پنجره جدید سالن'
    };
    setArchElements([...archElements, newEl]);
    setSelectedArchElementId(id);
  };

  const handleAddStairs = () => {
    const id = `stairs-${Date.now()}`;
    const newEl: ArchElement = {
      id,
      type: 'stairs',
      x: 30,
      y: -30,
      width: 50,
      height: 85,
      rotation: 0,
      name: 'پله جدید ورودی'
    };
    setArchElements([...archElements, newEl]);
    setSelectedArchElementId(id);
  };

  const handleAddLabel = () => {
    const id = `label-${Date.now()}`;
    const newEl: ArchElement = {
      id,
      type: 'label',
      x: 0,
      y: 0,
      width: 100,
      height: 30,
      rotation: 0,
      name: 'نام فضا (جدید)'
    };
    setArchElements([...archElements, newEl]);
    setSelectedArchElementId(id);
  };

  const handleDeleteArchElement = (id: string) => {
    setArchElements(prev => prev.filter(el => el.id !== id));
    if (selectedArchElementId === id) {
      setSelectedArchElementId(null);
    }
  };

  // Bill of Materials Engine (متره و برآورد مصالح)
  const computeBillOfMaterials = () => {
    const pipeSummary: Record<string, number> = {};
    const accessorySummary: Record<string, number> = {};

    // Calculate elbow, tee, and reducer counts based on segment connections
    const elbowCounts: Record<string, number> = {};
    const teeCounts: Record<string, number> = {};
    const reducerCounts: Record<string, number> = {};

    segments.forEach(parent => {
      if (parent.length <= 0) return;
      const children = segments.filter(s => s.parentId === parent.id && s.length > 0);

      if (children.length === 1) {
        const child = children[0];
        // 1. Elbow if direction changes
        if (child.direction !== parent.direction) {
          const szLabel = PIPE_SIZES.find(ps => ps.value === parent.size)?.label || parent.size;
          elbowCounts[szLabel] = (elbowCounts[szLabel] || 0) + 1;
        }
        // 2. Reducer if size changes
        if (child.size !== parent.size) {
          const parentSz = PIPE_SIZES.find(ps => ps.value === parent.size)?.label || parent.size;
          const childSz = PIPE_SIZES.find(ps => ps.value === child.size)?.label || child.size;
          const reducerKey = `${parentSz} به ${childSz}`;
          reducerCounts[reducerKey] = (reducerCounts[reducerKey] || 0) + 1;
        }
      } else if (children.length >= 2) {
        // 1. Tee if 2 or more branches meet (each branching point takes children-1 Tees)
        const parentSz = PIPE_SIZES.find(ps => ps.value === parent.size)?.label || parent.size;
        teeCounts[parentSz] = (teeCounts[parentSz] || 0) + (children.length - 1);

        // 2. Reducers for branches varying from parent size
        children.forEach(child => {
          if (child.size !== parent.size) {
            const childSz = PIPE_SIZES.find(ps => ps.value === child.size)?.label || child.size;
            const reducerKey = `${parentSz} به ${childSz}`;
            reducerCounts[reducerKey] = (reducerCounts[reducerKey] || 0) + 1;
          }
        });
      }
    });

    segments.forEach(s => {
      // Sum up pipeline length categories if length > 0
      if (s.length > 0) {
        pipeSummary[s.size] = (pipeSummary[s.size] || 0) + s.length;
      }

      // Sum up fittings/accessories counts
      if (s.accessory && s.accessory !== 'none') {
        const itemInfo = ACCESSORIES.find(x => x.value === s.accessory);
        if (itemInfo) {
          let bomLabel = itemInfo.label;
          if (s.accessory === 'regulator') {
            bomLabel = 'شیر قفلی';
          } else {
            if (s.accessory === 'meter') {
              bomLabel = 'شیر کنتور گاز شهری';
            } else if (s.accessory === 'boiler') {
              bomLabel = 'شیر پکیج گرمایشی (BP)';
            } else if (s.accessory === 'water_heater') {
              bomLabel = 'شیر آبگرمکن دیواری (BP)';
            } else if (s.accessory === 'floor_water_heater') {
              bomLabel = 'شیر آبگرمکن زمینی (WH)';
            } else if (s.accessory === 'stove') {
              bomLabel = 'شیر اجاق گاز (GC)';
            } else if (s.accessory === 'heater') {
              bomLabel = 'شیر بخاری گازسوز (H)';
            } else if (!bomLabel.startsWith('شیر')) {
              bomLabel = 'شیر ' + bomLabel;
            }
          }
          accessorySummary[bomLabel] = (accessorySummary[bomLabel] || 0) + 1;
        }
      }
    });

    const totalPipeLength = segments.reduce((sum, s) => sum + (s.length > 0 ? s.length : 0), 0);

    const longestPathLength = (() => {
      const pathLengths: Record<string, number> = {};
      const segMap = new Map(segments.map(s => [s.id, s]));
      const getPathLength = (id: string): number => {
        if (pathLengths[id] !== undefined) return pathLengths[id];
        const s = segMap.get(id);
        if (!s) return 0;
        const len = s.length > 0 ? s.length : 0;
        if (!s.parentId) {
          pathLengths[id] = len;
          return len;
        }
        const parentLen = getPathLength(s.parentId);
        pathLengths[id] = parentLen + len;
        return pathLengths[id];
      };

      let maxLen = 0;
      segments.forEach(s => {
        const l = getPathLength(s.id);
        if (l > maxLen) {
          maxLen = l;
        }
      });
      return parseFloat(maxLen.toFixed(2));
    })();

    return {
      pipes: Object.entries(pipeSummary).map(([size, len]) => ({ 
        size, 
        label: PIPE_SIZES.find(ps => ps.value === size)?.label || size, 
        length: parseFloat(len.toFixed(2)) 
      })),
      accessories: Object.entries(accessorySummary).map(([label, count]) => ({ label, count })),
      connections: segments.filter(s => s.length > 0).length,
      fittings: [
        ...Object.entries(elbowCounts).map(([size, count]) => ({ label: `زانو ${size}`, count })),
        ...Object.entries(teeCounts).map(([size, count]) => ({ label: `سه راهی ${size}`, count })),
        ...Object.entries(reducerCounts).map(([key, count]) => ({ label: `تبدیل ${key}`, count }))
      ],
      totalPipeLength: parseFloat(totalPipeLength.toFixed(2)),
      longestPathLength
    };
  };

  const bom = computeBillOfMaterials();

  // Export Canvas schematic directly as high definition PDF (Matches the working implementation in Store.tsx)
  const handleExportPDF = async () => {
    const target = document.getElementById('isom-printable-area');
    if (!target || isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    
    // Save current user view states
    const prevScale = scale;
    const prevOffsetX = offsetX;
    const prevOffsetY = offsetY;
    const prevWidth = width;
    const prevHeight = height;
    const prevIsPrintMode = isPrintMode;
    const prevIsPrintTheme = isPrintTheme;

    // Apply print-optimized canvas size (Aspect ratio 1.414 of A4/A3 paper landscape format)
    const virtualWidth = 1485;
    const virtualHeight = 1050;

    // Calculate pipeline boundary coordinates in meters
    let rawMinX = Infinity, rawMaxX = -Infinity;
    let rawMinY = Infinity, rawMaxY = -Infinity;
    
    computedPipeline.forEach(s => {
      let sX1, sY1, sX2, sY2;
      if (viewMode === 'plan') {
        sX1 = s.start.x;
        sY1 = -s.start.y;
        sX2 = s.end.x;
        sY2 = -s.end.y;
      } else {
        const cos30 = 0.8660254;
        const sin30 = 0.5;
        sX1 = (s.start.x - s.start.y) * cos30;
        sY1 = (s.start.x + s.start.y) * sin30 - s.start.z;
        sX2 = (s.end.x - s.end.y) * cos30;
        sY2 = (s.end.x + s.end.y) * sin30 - s.end.z;
      }
      
      rawMinX = Math.min(rawMinX, sX1, sX2);
      rawMaxX = Math.max(rawMaxX, sX1, sX2);
      rawMinY = Math.min(rawMinY, sY1, sY2);
      rawMaxY = Math.max(rawMaxY, sY1, sY2);
    });

    if (computedPipeline.length === 0) {
      if (viewMode === 'plan' && archElements.length > 0) {
        // If no pipes but we have walls in plan view, use walls boundary
        archElements.forEach(el => {
          const baseScale = prevScale || 50;
          const halfW = el.width / baseScale;
          const halfH = el.height / baseScale;
          const elX_m = el.x / baseScale;
          const elY_m = el.y / baseScale;
          if (el.type === 'wall' || el.type === 'stairs') {
            rawMinX = Math.min(rawMinX, elX_m);
            rawMaxX = Math.max(rawMaxX, elX_m + el.width / baseScale);
            rawMinY = Math.min(rawMinY, elY_m);
            rawMaxY = Math.max(rawMaxY, elY_m + el.height / baseScale);
          } else {
            rawMinX = Math.min(rawMinX, elX_m - halfW);
            rawMaxX = Math.max(rawMaxX, elX_m + halfW);
            rawMinY = Math.min(rawMinY, elY_m - halfH);
            rawMaxY = Math.max(rawMaxY, elY_m + halfH);
          }
        });
      } else {
        rawMinX = -5; rawMaxX = 5;
        rawMinY = -5; rawMaxY = 5;
      }
    }

    const rawWidth = rawMaxX - rawMinX || 1.0;
    const rawHeight = rawMaxY - rawMinY || 1.0;
    const rawCenterX = (rawMinX + rawMaxX) / 2;
    const rawCenterY = (rawMinY + rawMaxY) / 2;

    // Calculate exact physical printed scale
    let printScale = prevScale;
    const paperW_mm = pdfPaperSize === 'a3' ? 420 : 297;
    const paperH_mm = pdfPaperSize === 'a3' ? 297 : 210;

    if (pdfScaleMode === 'precise') {
      let targetMmPerMeter = 10;
      if (pdfPreciseScale === '1:50') targetMmPerMeter = 20;
      if (pdfPreciseScale === '1:200') targetMmPerMeter = 5;
      printScale = targetMmPerMeter * (virtualWidth / paperW_mm);
    } else {
      // Fit Mode: Optimize scale to fully fit standard print canvas nicely
      const margin = 150;
      const availWidth = virtualWidth - margin * 2;
      const availHeight = virtualHeight - margin * 2;
      printScale = Math.min(availWidth / rawWidth, availHeight / rawHeight);
      printScale = Math.max(15, Math.min(printScale, 110));
    }

    // Align centering offsets beautifully on the print canvas
    const targetOffsetX = virtualWidth / 2 - rawCenterX * printScale;
    const targetOffsetY = virtualHeight / 2 - rawCenterY * printScale;

    // Set temporary DOM size on target to prevent view clipping
    target.style.width = `${virtualWidth}px`;
    target.style.height = `${virtualHeight}px`;

    // Apply React states to render with print coordinates
    setWidth(virtualWidth);
    setHeight(virtualHeight);
    setScale(printScale);
    setOffsetX(targetOffsetX);
    setOffsetY(targetOffsetY);
    setIsPrintMode(true);
    setIsPrintTheme(true);

    try {
      // Standard structural delay to guarantee SVG styles and rendering have settled completely
      await new Promise(resolve => setTimeout(resolve, 350));
      
      const canvas = await html2canvas(target, {
        scale: 2, // 2x high resolution for sharp physical print
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff', // Always print on white background!
        width: virtualWidth,
        height: virtualHeight,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
        scrollY: -window.scrollY,
        onclone: (clonedDoc) => {
          // Force-strip oklch colors that crash html2canvas, making screenshots black or blank
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
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Create landscape document with selected paper layout (A3 or A4)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: pdfPaperSize
      });
      
      // Since map matches the sheet's exact aspect ratio (1.414), fill the paper fully!
      pdf.addImage(imgData, 'JPEG', 0, 0, paperW_mm, paperH_mm);
      
      const fileName = `gasino-isometric-${new Date().getTime()}.pdf`;

      // Optimized for Android/APK: Use Capacitor plugins if available
      if (Capacitor.isNativePlatform()) {
        const pdfBase64 = pdf.output('datauristring').split(',')[1];
        
        try {
          let result;
          try {
            result = await Filesystem.writeFile({
              path: fileName,
              data: pdfBase64,
              directory: Directory.Documents,
            });
          } catch (writeErr) {
            result = await Filesystem.writeFile({
              path: fileName,
              data: pdfBase64,
              directory: Directory.Cache,
            });
          }

          await Share.share({
            title: 'نقشه ایزومتریک گازرسانی گزینو',
            text: 'فایل PDF نقشه ایزومتریک آماده و تولید شد.',
            url: result.uri,
            dialogTitle: 'ارسال یا ذخیره نقشه (PDF)',
          });
          setIsGeneratingPDF(false);
          return;
        } catch (err) {
          console.error('Native PDF/Share Error in Isometric:', err);
        }
      }

      // Web download fallback
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
    } catch (err) {
      console.error('PDF Generation Failure:', err);
      alert('خطا در بارگذاری خروجی PDF. لطفاً مجدداً تلاش فرمایید.');
    } finally {
      // Restore previous screen coordinate container & states immediately
      if (target) {
        target.style.width = '';
        target.style.height = '';
      }
      setWidth(prevWidth);
      setHeight(prevHeight);
      setScale(prevScale);
      setOffsetX(prevOffsetX);
      setOffsetY(prevOffsetY);
      setIsPrintMode(prevIsPrintMode);
      setIsPrintTheme(prevIsPrintTheme);
      setIsGeneratingPDF(false);
    }
  };

  // Export Pipe Branching & Metric Summary list to standard Excel CSV 
  const handleExportCSV = () => {
    try {
      const bomData = computeBillOfMaterials();
      
      // Create CSV rows starting with UTF-8 BOM for Excel Farsi support
      let csvContent = "\uFEFF"; 
      
      // Title
      csvContent += "گزارش متره و برآورد مصالح لوله کشی گاز (Gasino BOM)\n";
      csvContent += `تاریخ گزارش: ${new Date().toLocaleDateString('fa-IR')}\n`;
      csvContent += `کل متراژ لوله کشی: ${bomData.totalPipeLength} متر\n`;
      csvContent += `طولانی‌ترین مسیر جریان: ${bomData.longestPathLength} متر\n\n`;
      
      // Section 1: Pipes
      csvContent += "۱. متراژ لوله ها بر اساس قطر نامی\n";
      csvContent += "سایز لوله (اینچ),نام فنی (سایز نامی),متراژ کل (سانتی متر),متراژ کل (متر)\n";
      bomData.pipes.forEach(p => {
        csvContent += `"${p.size}","${p.label}",${Math.round(p.length * 100)},${p.length}\n`;
      });
      csvContent += "\n";
      
      // Section 2: Fittings
      csvContent += "۲. شمارش اتصالات (زانوها، سه راهی‌ها و تبدیل‌ها)\n";
      csvContent += "نوع اتصال,تعداد وارد شده\n";
      if (bomData.fittings && bomData.fittings.length > 0) {
        bomData.fittings.forEach(f => {
          csvContent += `"${f.label}",${f.count}\n`;
        });
      } else {
        csvContent += "اتصالی وجود ندارد,0\n";
      }
      csvContent += "\n";
      
      // Section 3: Accessories
      csvContent += "۳. شمارش شیرآلات و تجهیزات مصرفی\n";
      csvContent += "عنوان تجهیز,تعداد مورد نیاز\n";
      bomData.accessories.forEach(a => {
        csvContent += `"${a.label}",${a.count}\n`;
      });
      csvContent += "\n";
      
      // Section 4: Branch pipelines detail list
      csvContent += "۴. جزئیات شاخه ها و مسیرهای لوله کشی\n";
      csvContent += "کد شناسه,عنوان شاخه,جهت ترسیم,طول (متر),سایز لوله,تجهیز متصل,موقعیت تجهیز\n";
      computedPipeline.forEach(s => {
        const dirLabel = getDirectionLabel(s.direction);
        const accLabel = ACCESSORIES.find(a => a.value === s.accessory)?.label || "ندارد";
        const accPosLabel = s.accessoryPosition === 'start' ? 'ابتدا' : 'انتها';
        csvContent += `"${s.id}","${s.name}","${dirLabel}",${s.length},"${s.size}","${accLabel}","${accPosLabel}"\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Gasino_BOM_Estimation.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('خطا در دریافت فایل اکسل متره.');
    }
  };

  // Trigger print view formatted for landscape ISO blueprinting
  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 150);
  };

  const isWhiteStyle = isPrintTheme || isPrintMode;

  const renderArchControls = (el: ArchElement) => {
    if (el.id !== selectedArchElementId) return null;
    
    // If element is a wall, render fully fledged interactive wall handles
    if (el.type === 'wall') {
      const rx_end = el.width;
      const ry_end = el.height / 2;
      const rx_start = 0;
      const ry_start = el.height / 2;
      const cx_move = el.width / 2;
      const cy_move = el.height / 2;
      const bx_thick = el.width / 2;
      const by_thick = el.height;
      const fx = el.width / 2;
      const fy = -26;

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
          {/* A. Start Length Handle (تغییر طول از ابتدا) */}
          <g 
            className="cursor-pointer group/handle pointer-events-auto"
            onMouseDown={(e) => startResizing(e, el.id, 'start')}
            onTouchStart={(e) => startResizingTouch(e, el.id, 'start')}
          >
            {/* Pulsating back ring */}
            <circle cx={rx_start} cy={ry_start} r="11" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3,3" className="animate-pulse" />
            <circle cx={rx_start} cy={ry_start} r="8" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" className="shadow-md hover:scale-125 transition-all active:fill-indigo-800" />
            {/* Arrows */}
            <path d={`M ${rx_start - 3} ${ry_start} L ${rx_start + 3} ${ry_start} M ${rx_start - 1} ${ry_start - 2} L ${rx_start - 3} ${ry_start} L ${rx_start - 1} ${ry_start + 2} M ${rx_start + 1} ${ry_start - 2} L ${rx_start + 3} ${ry_start} L ${rx_start + 1} ${ry_start + 2}`} stroke="#ffffff" strokeWidth="0.8" fill="none" />
            <title>تغییر طول دیوار از ابتدا (طول‌دهی)</title>
          </g>

          {/* B. End Length Handle (تغییر طول از انتها) */}
          <g 
            className="cursor-pointer group/handle pointer-events-auto"
            onMouseDown={(e) => startResizing(e, el.id, 'end')}
            onTouchStart={(e) => startResizingTouch(e, el.id, 'end')}
          >
            {/* Pulsating back ring */}
            <circle cx={rx_end} cy={ry_end} r="11" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3,3" className="animate-pulse" />
            <circle cx={rx_end} cy={ry_end} r="8" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" className="shadow-md hover:scale-125 transition-all active:fill-indigo-800" />
            {/* Arrows */}
            <path d={`M ${rx_end - 3} ${ry_end} L ${rx_end + 3} ${ry_end} M ${rx_end - 1} ${ry_end - 2} L ${rx_end - 3} ${ry_end} L ${rx_end - 1} ${ry_end + 2} M ${rx_end + 1} ${ry_end - 2} L ${rx_end + 3} ${ry_end} L ${rx_end + 1} ${ry_end + 2}`} stroke="#ffffff" strokeWidth="0.8" fill="none" />
            <title>تغییر طول دیوار از انتها (طول‌دهی)</title>
          </g>

          {/* C. Center Move/Displacement Handle (علامت جابجایی در وسط) */}
          <g 
            className="cursor-move group/move pointer-events-auto"
            onMouseDown={(e) => {
              e.stopPropagation();
              setSelectedArchElementId(el.id);
              setActiveDraggingArchId(el.id);
              setDragDistance(0);
              setDragArchOffset({ x: e.clientX, y: e.clientY });
              dragArchOffsetRef.current = { x: e.clientX, y: e.clientY };
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              setSelectedArchElementId(el.id);
              setActiveDraggingArchId(el.id);
              setDragDistance(0);
              if (e.touches.length > 0) {
                const touch = e.touches[0];
                dragArchOffsetRef.current = { x: touch.clientX, y: touch.clientY };
                setDragArchOffset({ x: touch.clientX, y: touch.clientY });
              }
            }}
          >
            <circle cx={cx_move} cy={cy_move} r="15" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="3,1" />
            <circle cx={cx_move} cy={cy_move} r="10" fill="#10b981" stroke="#ffffff" strokeWidth="2" className="shadow-lg hover:scale-125 transition-all" />
            <g transform={`translate(${cx_move}, ${cy_move}) scale(0.6)`}>
              <path d="M -8 0 L 8 0 M 0 -8 L 0 8 M -8 0 L -5 -3 M -8 0 L -5 3 M 8 0 L 5 -3 M 8 0 L 5 3 M 0 -8 L -3 -5 M 0 -8 L 3 -5 M 0 8 L -3 5 M 0 8 L 3 5" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <title>جابجایی کل دیوار (با حفظ اتصالات دیوارهای متصل)</title>
          </g>

          {/* D. Bottom Thickness Handle (تغییر ضخامت) */}
          <circle
            cx={bx_thick}
            cy={by_thick}
            r="6"
            fill="#e11d48"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="cursor-ns-resize hover:scale-125 transition-all shadow-md active:fill-rose-700 pointer-events-auto"
            onMouseDown={(e) => startResizing(e, el.id, 'height')}
            onTouchStart={(e) => startResizingTouch(e, el.id, 'height')}
          >
            <title>تغییر ضخامت دیوار</title>
          </circle>

          {/* E. Floating Action menu above the Wall */}
          <g transform={`translate(${fx}, ${fy})`}>
            {/* Backing panel */}
            <rect
              x="-78"
              y="-11"
              width="156"
              height="22"
              rx="6"
              fill={isWhiteStyle ? "#ffffff" : "#1e293b"}
              stroke={isWhiteStyle ? "#cbd5e1" : "#475569"}
              strokeWidth="1.5"
              className="shadow-2xl"
            />

            {/* A. Rename Button "✎" */}
            <g
              className="cursor-pointer hover:scale-115 active:scale-95 transition-all pointer-events-auto"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsDragging(false);
                setIsResizingArch(false);
                setActiveDraggingArchId(null);
                const newName = prompt("برچسب یا توضیح جدید این عنصر را وارد کنید (مثلا آشپزخانه، پذیرایی، خواب):", el.name || "");
                if (newName !== null) {
                  setArchElements(prev => prev.map(item => item.id === el.id ? { ...item, name: newName } : item));
                }
              }}
            >
              <title>ویرایش نام / برچسب</title>
              <circle cx="-67" cy="0" r="7.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="0.5" />
              <text x="-67" y="2.5" fill="#ffffff" fontSize="7" fontWeight="black" textAnchor="middle">✎</text>
            </g>

            {/* B. Delete Button "×" */}
            <g
              className="cursor-pointer hover:scale-115 active:scale-95 transition-all pointer-events-auto"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsDragging(false);
                setIsResizingArch(false);
                setActiveDraggingArchId(null);
                setArchElements(prev => prev.filter(item => item.id !== el.id));
                setSelectedArchElementId(null);
              }}
            >
              <title>حذف کامل</title>
              <circle cx="-49" cy="0" r="7.5" fill="#ef4444" stroke="#ffffff" strokeWidth="0.5" />
              <text x="-49" y="2.5" fill="#ffffff" fontSize="9" fontWeight="black" textAnchor="middle">×</text>
            </g>

            {/* C. Coarse Decrease Length "-" */}
            <g
              className="cursor-pointer hover:scale-115 active:scale-95 transition-all pointer-events-auto"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsDragging(false);
                setIsResizingArch(false);
                setActiveDraggingArchId(null);
                setArchElements(prev => {
                  const item = prev.find(x => x.id === el.id);
                  if (!item) return prev;
                  const updatedItem = { ...item, width: Math.max(10, item.width - 10) };
                  return propagateWallChanges(prev, el.id, updatedItem);
                });
              }}
            >
              <title>کاهش طول</title>
              <circle cx="-31" cy="0" r="7.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="0.5" />
              <text x="-31" y="2" fill="#ffffff" fontSize="10" fontWeight="black" textAnchor="middle">-</text>
            </g>

            {/* D. Exact Metric Readout Text */}
            <text
              x="-4"
              y="3"
              fill={isWhiteStyle ? "#0f172a" : "#cbd5e1"}
              fontSize="8"
              fontWeight="black"
              textAnchor="middle"
            >
              {Math.round((el.width / scale) * 100)} cm
            </text>

            {/* E. Coarse Increase Length "+" */}
            <g
              className="cursor-pointer hover:scale-115 active:scale-95 transition-all pointer-events-auto"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsDragging(false);
                setIsResizingArch(false);
                setActiveDraggingArchId(null);
                setArchElements(prev => {
                  const item = prev.find(x => x.id === el.id);
                  if (!item) return prev;
                  const updatedItem = { ...item, width: item.width + 10 };
                  return propagateWallChanges(prev, el.id, updatedItem);
                });
              }}
            >
              <title>افزایش طول</title>
              <circle cx="23" cy="0" r="7.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="0.5" />
              <text x="23" y="2.5" fill="#ffffff" fontSize="9" fontWeight="black" textAnchor="middle">+</text>
            </g>

            {/* F. Rotate 90° Clockwise "↻" */}
            <g
              className="cursor-pointer hover:scale-115 active:scale-95 transition-all pointer-events-auto"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsDragging(false);
                setIsResizingArch(false);
                setActiveDraggingArchId(null);
                setArchElements(prev => {
                  const item = prev.find(x => x.id === el.id);
                  if (!item) return prev;
                  const updatedItem = { ...item, rotation: (item.rotation + 90) % 360 };
                  return propagateWallChanges(prev, el.id, updatedItem);
                });
              }}
            >
              <title>چرخش ۹۰ درجه</title>
              <circle cx="41" cy="0" r="7.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.5" />
              <text x="41" y="2.5" fill="#ffffff" fontSize="8" fontWeight="black" textAnchor="middle">↻</text>
            </g>

            {/* G. Fine Rotate 15° "↻ 15" */}
            <g
              className="cursor-pointer hover:scale-115 active:scale-95 transition-all pointer-events-auto"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsDragging(false);
                setIsResizingArch(false);
                setActiveDraggingArchId(null);
                setArchElements(prev => {
                  const item = prev.find(x => x.id === el.id);
                  if (!item) return prev;
                  const updatedItem = { ...item, rotation: (item.rotation + 15) % 360 };
                  return propagateWallChanges(prev, el.id, updatedItem);
                });
              }}
            >
              <title>چرخش ۱۵+ درجه</title>
              <circle cx="61" cy="0" r="7.5" fill="#0d9488" stroke="#ffffff" strokeWidth="0.5" />
              <text x="61" y="2" fill="#ffffff" fontSize="6.5" fontWeight="black" textAnchor="middle">+۱۵</text>
            </g>
          </g>
        </g>
      );
    }

    // Decide handle coordinates relative to rotated element group for general entities:
    const isWallOrStairs = el.type === 'stairs';
    
    // Right handle coordinate:
    const rx = isWallOrStairs ? el.width : el.width / 2;
    const ry = isWallOrStairs ? el.height / 2 : 0;
    
    // Bottom handle coordinate:
    const bx = isWallOrStairs ? el.width / 2 : 0;
    const by = isWallOrStairs ? el.height : el.height / 2;

    // Float panel coordinate (above the element center)
    const fx = isWallOrStairs ? el.width / 2 : 0;
    const fy = isWallOrStairs ? -24 : -el.height / 2 - 24;

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
        {/* 1. Width (Length) Drag Handle - Blue */}
        <circle
          cx={rx}
          cy={ry}
          r="8"
          fill="#4f46e5"
          stroke="#ffffff"
          strokeWidth="2"
          className="cursor-ew-resize hover:scale-125 transition-all shadow-md active:fill-indigo-700 pointer-events-auto"
          onMouseDown={(e) => startResizing(e, el.id, 'end')}
          onTouchStart={(e) => startResizingTouch(e, el.id, 'end')}
        >
          <title>تغییر طول/عرض از روی نقشه</title>
        </circle>

        {/* 2. Height (Thickness) Drag Handle - Green (Only for elements where height makes sense, viz. stairs, window, label) */}
        {(el.type === 'stairs' || el.type === 'window' || el.type === 'label') && (
          <circle
            cx={bx}
            cy={by}
            r="8"
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth="2"
            className="cursor-ns-resize hover:scale-125 transition-all shadow-md active:fill-emerald-700 pointer-events-auto"
            onMouseDown={(e) => startResizing(e, el.id, 'height')}
            onTouchStart={(e) => startResizingTouch(e, el.id, 'height')}
          >
            <title>تغییر ارتفاع/ضخامت از روی نقشه</title>
          </circle>
        )}

        {/* 3. Floating Micro-Panel Dock Directly on the Map */}
        <g transform={`translate(${fx}, ${fy})`}>
          {/* Glassmorphism Bar Backing Panel */}
          <rect
            x="-78"
            y="-11"
            width="156"
            height="22"
            rx="6"
            fill={isWhiteStyle ? "#ffffff" : "#1e293b"}
            stroke={isWhiteStyle ? "#cbd5e1" : "#475569"}
            strokeWidth="1.5"
            className="shadow-2xl"
          />

          {/* A. Rename Button "✎" */}
          <g
            className="cursor-pointer hover:scale-115 active:scale-95 transition-all pointer-events-auto"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsDragging(false);
              setIsResizingArch(false);
              setActiveDraggingArchId(null);
              const newName = prompt("برچسب یا توضیح جدید این عنصر را وارد کنید (مثلا آشپزخانه، پذیرایی، خواب):", el.name || "");
              if (newName !== null) {
                setArchElements(prev => prev.map(item => item.id === el.id ? { ...item, name: newName } : item));
              }
            }}
          >
            <title>ویرایش نام / برچسب</title>
            <circle cx="-67" cy="0" r="7.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="0.5" />
            <text x="-67" y="2.5" fill="#ffffff" fontSize="7" fontWeight="black" textAnchor="middle">✎</text>
          </g>

          {/* B. Delete Button "×" */}
          <g
            className="cursor-pointer hover:scale-115 active:scale-95 transition-all pointer-events-auto"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsDragging(false);
              setIsResizingArch(false);
              setActiveDraggingArchId(null);
              setArchElements(prev => prev.filter(item => item.id !== el.id));
              setSelectedArchElementId(null);
            }}
          >
            <title>حذف کامل</title>
            <circle cx="-49" cy="0" r="7.5" fill="#ef4444" stroke="#ffffff" strokeWidth="0.5" />
            <text x="-49" y="2.5" fill="#ffffff" fontSize="9" fontWeight="black" textAnchor="middle">×</text>
          </g>

          {/* C. Coarse Decrease Length "-" */}
          <g
            className="cursor-pointer hover:scale-115 active:scale-95 transition-all pointer-events-auto"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsDragging(false);
              setIsResizingArch(false);
              setActiveDraggingArchId(null);
              setArchElements(prev => {
                const item = prev.find(x => x.id === el.id);
                if (!item) return prev;
                const updatedItem = { ...item, width: Math.max(10, item.width - 10) };
                return propagateWallChanges(prev, el.id, updatedItem);
              });
            }}
          >
            <title>کاهش طول</title>
            <circle cx="-31" cy="0" r="7.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="0.5" />
            <text x="-31" y="2" fill="#ffffff" fontSize="10" fontWeight="black" textAnchor="middle">-</text>
          </g>

          {/* D. Exact Metric Readout Value Text */}
          <text
            x="-4"
            y="3"
            fill={isWhiteStyle ? "#0f172a" : "#cbd5e1"}
            fontSize="8"
            fontWeight="black"
            textAnchor="middle"
          >
            {Math.round(el.width)}px
          </text>

          {/* E. Coarse Increase Length "+" */}
          <g
            className="cursor-pointer hover:scale-115 active:scale-95 transition-all pointer-events-auto"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsDragging(false);
              setIsResizingArch(false);
              setActiveDraggingArchId(null);
              setArchElements(prev => {
                const item = prev.find(x => x.id === el.id);
                if (!item) return prev;
                const updatedItem = { ...item, width: item.width + 10 };
                return propagateWallChanges(prev, el.id, updatedItem);
              });
            }}
          >
            <title>افزایش طول</title>
            <circle cx="23" cy="0" r="7.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="0.5" />
            <text x="23" y="2.5" fill="#ffffff" fontSize="9" fontWeight="black" textAnchor="middle">+</text>
          </g>

          {/* F. Rotate 90° Clockwise "↻" */}
          <g
            className="cursor-pointer hover:scale-115 active:scale-95 transition-all pointer-events-auto"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsDragging(false);
              setIsResizingArch(false);
              setActiveDraggingArchId(null);
              setArchElements(prev => {
                const item = prev.find(x => x.id === el.id);
                if (!item) return prev;
                const updatedItem = { ...item, rotation: (item.rotation + 90) % 360 };
                return propagateWallChanges(prev, el.id, updatedItem);
              });
            }}
          >
            <title>چرخش ۹۰ درجه</title>
            <circle cx="41" cy="0" r="7.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.5" />
            <text x="41" y="2.5" fill="#ffffff" fontSize="8" fontWeight="black" textAnchor="middle">↻</text>
          </g>

          {/* G. Fine Rotate 15° "↻ 15" */}
          <g
            className="cursor-pointer hover:scale-115 active:scale-95 transition-all pointer-events-auto"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsDragging(false);
              setIsResizingArch(false);
              setActiveDraggingArchId(null);
              setArchElements(prev => {
                const item = prev.find(x => x.id === el.id);
                if (!item) return prev;
                const updatedItem = { ...item, rotation: (item.rotation + 15) % 360 };
                return propagateWallChanges(prev, el.id, updatedItem);
              });
            }}
          >
            <title>چرخش ۱۵+ درجه</title>
            <circle cx="61" cy="0" r="7.5" fill="#0d9488" stroke="#ffffff" strokeWidth="0.5" />
            <text x="61" y="2" fill="#ffffff" fontSize="6.5" fontWeight="black" textAnchor="middle">+۱۵</text>
          </g>
        </g>
      </g>
    );
  };

  return (
    <div className="space-y-6 page-enter pb-14 font-sans" dir="rtl">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left/Middle Column: 3D CAD Drawing Environment */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden flex flex-col relative group">
            
            {/* Header Control overlay */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50/55 dark:bg-slate-950/20 z-20 gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-slate-200/70 dark:bg-slate-800 p-2 rounded-xl">
                  <Grid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-800 dark:text-slate-100">
                    {viewMode === 'plan' ? 'بورد پیش‌نمایش گرافیکی پلان دو بعدی (۲D)' : 'بورد پیش‌نمایش گرافیکی ایزومتریک (۳D)'}
                  </h3>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5">کشیدن موس برای جابجایی نقشه | زوم با دکمه‌ها</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 no-print flex-wrap">
                {/* Toggle Show Pipes in Plan view */}
                {viewMode === 'plan' && (
                  <button
                    onClick={() => setShowPipesInPlan(!showPipesInPlan)}
                    className={`p-2 rounded-xl transition-all border flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                      showPipesInPlan
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold'
                        : 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 font-bold'
                    }`}
                    title={showPipesInPlan ? "عدم نمایش لوله‌ها در پلان" : "نمایش لوله‌های رسم شده در پلان"}
                  >
                    {showPipesInPlan ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span className="text-[10px] font-black">{showPipesInPlan ? "عدم نمایش لوله‌کشی" : "نمایش لوله‌کشی همزمان"}</span>
                  </button>
                )}

                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`p-2 rounded-xl transition-all border flex items-center gap-1 ${showGrid ? 'bg-indigo-50/80 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'}`}
                  title="تغییر نمایش شبکه شابلون راهنما"
                >
                  <Grid className="w-4 h-4" />
                  <span className="text-[10px] font-black hidden sm:inline">شبکه راهنما (شابلون)</span>
                </button>
                <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5" />
                <button
                  onClick={() => setScale(prev => Math.max(15, Math.round(prev - 5)))}
                  className="px-2 py-1 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-bold font-mono text-slate-600 dark:text-slate-300 shadow-sm"
                  title="کاهش مقیاس بزرگنمایی"
                >
                  زوم -
                </button>
                <span className="text-xs font-mono font-bold text-slate-400 px-1 min-w-[38px] text-center">{Math.round(scale)}px</span>
                <button
                  onClick={() => setScale(prev => Math.min(120, Math.round(prev + 5)))}
                  className="px-2 py-1 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-bold font-mono text-slate-600 dark:text-slate-300 shadow-sm"
                  title="افزایش مقیاس بزرگنمایی"
                >
                  زوم +
                </button>
                <button
                  onClick={handleAutoFit}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shadow-sm flex items-center gap-1"
                  title="تنظیم خودکار کادر نقشه"
                >
                  <Maximize className="w-4 h-4" />
                  <span className="text-[10px] font-black hidden sm:inline">تنظیم کادر</span>
                </button>
                <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5" />
                
                {/* Print Skin Toggle */}
                <button
                  onClick={() => setIsPrintTheme(!isPrintTheme)}
                  className={`p-2 rounded-xl transition-all border flex items-center gap-1 cursor-pointer ${isPrintTheme ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm font-black' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  title="تغییر به تم سفید"
                >
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPrintTheme ? 'bg-white' : 'bg-indigo-500'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isPrintTheme ? 'bg-indigo-200' : 'bg-indigo-600'}`}></span>
                  </span>
                  <span className="text-[10px] font-black">تم سفید</span>
                </button>

                <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5" />

                {/* Delete Selected Element button */}
                <button 
                  onClick={() => {
                    if (selectedSegmentId) {
                      setDeleteConfirmationId(selectedSegmentId);
                    }
                  }}
                  disabled={!selectedSegmentId}
                  className={`p-2 border rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedSegmentId 
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-250 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 dark:border-rose-900/30 shadow-sm active:scale-95' 
                      : 'bg-slate-100 dark:bg-slate-900/40 text-slate-400 border-slate-200 dark:border-slate-800 opacity-40 cursor-not-allowed'
                  }`}
                  title="حذف لوله و اتصالات فرعی انتخاب شده"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف منتخب</span>
                </button>

                <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5" />

                <button 
                  onClick={handleClearAll}
                  className="p-2 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-950/25 dark:hover:bg-red-950/45 border border-red-200 dark:border-red-900/30 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1.5"
                  title="پاکسازی کامل تمام لوله‌ها و تجهیزات"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>پاکسازی کامل</span>
                </button>
              </div>
            </div>

            {/* Drawing Area Content */}
            <div 
              id="isom-printable-area"
              ref={canvasContainerRef}
              className={`relative w-full h-[525px] overflow-hidden cursor-grab active:cursor-grabbing select-none ${isPrintMode ? '' : 'transition-all duration-300'} ${
                isWhiteStyle ? 'bg-white text-slate-900 border border-slate-200' : 'bg-[#070b13] text-white'
              } ${isPrintMode ? 'print-active-sheet' : ''}`}
            >
              <div 
                data-html2canvas-ignore="true"
                className={`absolute top-4 left-4 flex items-center gap-1 text-[10px] font-black pointer-events-none opacity-40 transition-colors duration-300 no-print ${
                  isWhiteStyle ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                <Move className="w-3.5 h-3.5" />
                <span>شما می‌توانید نقشه را بکشید و حرکت دهید</span>
              </div>

              {/* Touch & mouse responsive drawing vector sheet */}
              {/* Left Side Mode & Diameter Select Belt */}
              <div 
                data-html2canvas-ignore="true"
                className="absolute left-3 top-14 flex flex-col gap-2 z-30 no-print max-w-[65px] select-none"
              >
                {/* Interaction Mode Toggle Switch */}
                <div className="bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800/80 flex flex-col items-center gap-1 shadow-2xl">
                  <span className="text-[8px] font-black text-indigo-300 pointer-events-none mb-0.5 text-center">حالت نقشه</span>
                  <button
                    onClick={() => setInteractionMode('draw')}
                    className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${interactionMode === 'draw' ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400' : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800'}`}
                    title="ترسیم خودکار با لمس نقشه"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-[7.5px] font-black">ترسیم لمسی</span>
                  </button>
                  <button
                    onClick={() => setInteractionMode('pan')}
                    className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${interactionMode === 'pan' ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400' : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 border border-slate-800'}`}
                    title="حرکت و زوم نقشه"
                  >
                    <Move className="w-3.5 h-3.5" />
                    <span className="text-[7.5px] font-black">حرکت نقشه</span>
                  </button>

                  <div className="w-[30px] h-[1px] bg-slate-800/80 my-0.5" />

                  {/* Undo Button placed under the Move button */}
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={viewMode === 'plan' ? archHistory.length === 0 : history.length === 0}
                    className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      (viewMode === 'plan' ? archHistory.length > 0 : history.length > 0)
                        ? 'bg-amber-600 text-white hover:bg-amber-550 border border-amber-500 shadow-md active:scale-95'
                        : 'bg-slate-800/50 text-slate-400 border border-slate-700/60 cursor-not-allowed opacity-75'
                    }`}
                    title="مکانیزم واگرد - بازگشت به حرکت قبل (Undo)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="text-[6.5px] font-black">Undo</span>
                  </button>
                </div>

                {/* Active Pipe Size Shortcut chooser dropdown */}
                <div className="bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800/80 flex flex-col items-center gap-1 shadow-2xl relative">
                  <span className="text-[8px] font-black text-indigo-300 pointer-events-none mb-0.5 text-center">سایز سریع</span>
                  
                  <button
                    onClick={() => {
                      setIsSizeDropdownOpen(!isSizeDropdownOpen);
                      setIsAccessoryDropdownOpen(false);
                    }}
                    className="w-10 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex flex-col items-center justify-center border border-indigo-400 cursor-pointer shadow-lg transition-all"
                    title="انتخاب سایز لوله"
                  >
                    <span className="text-[10px] font-mono font-black">{newSize}</span>
                    <span className="text-[7px] font-black">تعیین سایز</span>
                  </button>

                  {/* Size Dropdown panel */}
                  {isSizeDropdownOpen && (
                    <div className="absolute left-14 top-8 bg-slate-950/95 backdrop-blur-lg p-2 rounded-2xl border border-slate-800 shadow-2xl flex flex-col gap-1.5 min-w-[95px] max-h-64 overflow-y-auto z-50 scrollbar-thin">
                      {PIPE_SIZES.map((szInfo) => {
                        const sz = szInfo.value;
                        const isSelected = newSize === sz;
                        return (
                          <button
                            key={`quick-sz-${sz}`}
                            onClick={() => {
                              handleQuickSetSize(sz);
                              setIsSizeDropdownOpen(false);
                            }}
                            className={`w-full py-1.5 px-2 rounded-xl text-center text-[10px] font-black cursor-pointer transition-all ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'}`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side Action Belt for Quick Accessories Placement */}
              <div 
                data-html2canvas-ignore="true"
                className="absolute right-3 top-14 flex flex-col gap-2 z-30 no-print max-w-[65px] select-none"
              >
                <div className="bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800/80 flex flex-col items-center gap-1 shadow-2xl relative">
                  <span className="text-[8px] font-black text-indigo-300 pointer-events-none mb-0.5 text-center">تجهیزات</span>
                  
                  {/* Accessories main selection trigger */}
                  <button
                    onClick={() => {
                      setIsAccessoryDropdownOpen(!isAccessoryDropdownOpen);
                      setIsSizeDropdownOpen(false);
                    }}
                    className="w-10 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex flex-col items-center justify-center border border-emerald-400 cursor-pointer shadow-lg transition-all"
                    title="انتخاب تجهیز گازی"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span className="text-[7.5px] font-black mt-0.5">تجهیزات</span>
                  </button>

                  {/* Accessory Dropdown panel */}
                  {isAccessoryDropdownOpen && (
                    <div className="absolute right-14 top-4 bg-slate-950/95 backdrop-blur-lg p-2.5 rounded-2xl border border-slate-800 shadow-2xl flex flex-col gap-1.5 min-w-[150px] max-h-[280px] overflow-y-auto z-50 custom-scrollbar">
                      <span className="text-[9px] font-black text-slate-400 pb-1 border-b border-slate-800 text-center">افزودن تجهیز به خط انتخابی</span>
                     
                      {/* Button: Valve */}
                      <button
                        onClick={() => {
                          handleQuickSetAccessory('valve');
                          setIsAccessoryDropdownOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-right text-[11px] font-black transition-all cursor-pointer flex items-center justify-between"
                      >
                        <span>شیر قطع‌کن</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      </button>

                      {/* Button: Yard Valve */}
                      <button
                        onClick={() => {
                          handleQuickSetAccessory('yard_valve');
                          setIsAccessoryDropdownOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 text-right text-[11px] font-black transition-all cursor-pointer flex items-center justify-between"
                      >
                        <span>شیر حیاط (RC)</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      </button>
                      
                      {/* Button: Meter */}
                      <button
                        onClick={() => {
                          handleQuickSetAccessory('meter');
                          setIsAccessoryDropdownOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 text-right text-[11px] font-black transition-all cursor-pointer flex items-center justify-between"
                      >
                        <span>کنتور گاز</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      </button>
                      
                      {/* Button: Regulator */}
                      <button
                        onClick={() => {
                          handleQuickSetAccessory('regulator');
                          setIsAccessoryDropdownOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-right text-[11px] font-black transition-all cursor-pointer flex items-center justify-between"
                      >
                        <span>رگولاتور</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      </button>
                      
                      {/* Button: Boiler */}
                      <button
                        onClick={() => {
                          handleQuickSetAccessory('boiler');
                          setIsAccessoryDropdownOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-right text-[11px] font-black transition-all cursor-pointer flex items-center justify-between"
                      >
                        <span>پکیج گرمایشی (BP)</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      </button>

                      {/* Button: Wall Water Heater */}
                      <button
                        onClick={() => {
                          handleQuickSetAccessory('water_heater');
                          setIsAccessoryDropdownOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-right text-[11px] font-black transition-all cursor-pointer flex items-center justify-between"
                      >
                        <span>آبگرمکن دیواری (BP)</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      </button>

                      {/* Button: Floor Water Heater */}
                      <button
                        onClick={() => {
                          handleQuickSetAccessory('floor_water_heater');
                          setIsAccessoryDropdownOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-right text-[11px] font-black transition-all cursor-pointer flex items-center justify-between"
                      >
                        <span>آبگرمکن زمینی (WH)</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </button>
                      
                      {/* Button: Stove */}
                      <button
                        onClick={() => {
                          handleQuickSetAccessory('stove');
                          setIsAccessoryDropdownOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-right text-[11px] font-black transition-all cursor-pointer flex items-center justify-between"
                      >
                        <span>اجاق گاز (GC)</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      </button>
                      
                      {/* Button: Heater */}
                      <button
                        onClick={() => {
                          handleQuickSetAccessory('heater');
                          setIsAccessoryDropdownOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-right text-[11px] font-black transition-all cursor-pointer flex items-center justify-between"
                      >
                        <span>بخاری گازسوز (H)</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      </button>
                      
                      {/* Clear Accessory */}
                      <button
                        onClick={() => {
                          handleQuickSetAccessory('none');
                          setIsAccessoryDropdownOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-right text-[11px] font-black transition-all cursor-pointer flex items-center justify-between border border-slate-800"
                      >
                        <span>حذف تجهیز</span>
                        <Trash2 className="w-3 h-3 text-slate-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

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
                {/* SVG Definitions */}
                <defs>
                  {/* Subtle isometric background dots pattern */}
                  <pattern id="dot-grid" width="30" height="17.32" patternUnits="userSpaceOnUse">
                    <circle cx="0" cy="0" r="0.9" fill={isWhiteStyle ? "#64748b" : "#38bdf8"} opacity={isWhiteStyle ? "0.25" : "0.45"} />
                    <circle cx="15" cy="8.66" r="0.9" fill={isWhiteStyle ? "#64748b" : "#38bdf8"} opacity={isWhiteStyle ? "0.25" : "0.45"} />
                    <circle cx="30" cy="0" r="0.9" fill={isWhiteStyle ? "#64748b" : "#38bdf8"} opacity={isWhiteStyle ? "0.25" : "0.45"} />
                    <circle cx="0" cy="17.32" r="0.9" fill={isWhiteStyle ? "#64748b" : "#38bdf8"} opacity={isWhiteStyle ? "0.25" : "0.45"} />
                    <circle cx="30" cy="17.32" r="0.9" fill={isWhiteStyle ? "#64748b" : "#38bdf8"} opacity={isWhiteStyle ? "0.25" : "0.45"} />
                  </pattern>

                  {/* Flow Arrow marker template */}
                  <marker
                    id="flow-arrow"
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 2 L 10 5 L 0 8 z" fill={isWhiteStyle ? "#000000" : "#fbbf24"} opacity="0.85" />
                  </marker>
                  
                  {/* Neon Glow filters list */}
                  <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Draw Background Dot Grid */}
                {showGrid && (
                  <rect width="100%" height="100%" fill="url(#dot-grid)" className="transition-opacity" />
                )}

                {/* Draw Isometric reference axes watermark */}
                <g transform={`translate(${offsetX}, ${offsetY})`} stroke={isWhiteStyle ? "#94a3b8" : "#162032"} strokeWidth="0.8" opacity={isWhiteStyle ? "0.25" : "0.3"}>
                  {/* NE Axis */}
                  <line x1="0" y1="0" x2="300" y2="173.2" strokeDasharray="3,3" />
                  {/* NW Axis */}
                  <line x1="0" y1="0" x2="-300" y2="173.2" strokeDasharray="3,3" />
                  {/* Vertical Axis */}
                  <line x1="0" y1="0" x2="0" y2="-300" strokeDasharray="3,3" />
                  <circle cx="0" cy="0" r="4" fill="none" stroke="#10b981" />
                </g>

                {/* 2D Plan Architectural Background Elements */}
                {viewMode === 'plan' && (
                  <g transform={`translate(${offsetX}, ${offsetY}) scale(${scale / 48})`}>
                    {[...archElements].sort((a, b) => {
                      const order = { wall: 1, stairs: 2, door: 3, window: 4, label: 5 };
                      return (order[a.type] || 99) - (order[b.type] || 99);
                    }).map((el) => {
                      const isSelected = el.id === selectedArchElementId;
                      const selectGlow = isSelected ? (
                        <rect
                          x={el.type === 'wall' || el.type === 'stairs' ? -4 : -el.width/2 - 4}
                          y={el.type === 'wall' || el.type === 'stairs' ? -4 : -el.height/2 - 4}
                          width={(el.type === 'wall' || el.type === 'stairs' ? el.width : el.width) + 8}
                          height={(el.type === 'wall' || el.type === 'stairs' ? el.height : el.height) + 8}
                          fill="none"
                          stroke="#d946ef"
                          strokeWidth="1.5"
                          strokeDasharray="4,4"
                          className="animate-pulse"
                          transform={el.type === 'wall' || el.type === 'stairs' ? `rotate(${el.rotation})` : undefined}
                        />
                      ) : null;

                      if (el.type === 'wall') {
                        const physicalCm = Math.round((el.width / 48) * 100);
                        return (
                          <g
                            key={el.id}
                            transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation})`}
                            className="cursor-move group"
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
                              fill={isWhiteStyle ? '#f1f5f9' : '#1e293b'}
                              stroke={isSelected ? '#d946ef' : (isWhiteStyle ? '#475569' : '#94a3b8')}
                              strokeWidth={isSelected ? '2' : '1.5'}
                              className="transition-all hover:opacity-80"
                            />
                            <line
                              x1="0"
                              y1={el.height/2}
                              x2={el.width}
                              y2={el.height/2}
                              stroke={isSelected ? '#d946ef' : (isWhiteStyle ? '#cbd5e1' : '#475569')}
                              strokeWidth="0.8"
                              strokeDasharray="3,3"
                            />
                            <text
                              x={el.width / 2}
                              y={el.height / 2}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill={isSelected ? '#d946ef' : (isWhiteStyle ? '#0f172a' : '#ffffff')}
                              style={{ fontSize: '9.5px' }}
                              fontWeight="black"
                              stroke={isWhiteStyle ? '#ffffff' : '#1e293b'}
                              strokeWidth="2.5"
                              paintOrder="stroke"
                              className="select-none pointer-events-none font-mono"
                            >
                              {physicalCm} cm
                            </text>

                            {/* Wall Start and End Endpoint Indicators */}
                            <g className="opacity-95 select-none pointer-events-none">
                              {/* Start point marker */}
                              <circle 
                                cx="0" 
                                cy={el.height / 2} 
                                r="4.5" 
                                fill="#4f46e5" 
                                stroke={isWhiteStyle ? "#ffffff" : "#0f172a"} 
                                strokeWidth="1.2" 
                              />
                              <circle 
                                cx="0" 
                                cy={el.height / 2} 
                                r="1.5" 
                                fill="#ffffff" 
                              />

                              {/* End point marker */}
                              <circle 
                                cx={el.width} 
                                cy={el.height / 2} 
                                r="4.5" 
                                fill="#4f46e5" 
                                stroke={isWhiteStyle ? "#ffffff" : "#0f172a"} 
                                strokeWidth="1.2" 
                              />
                              <circle 
                                cx={el.width} 
                                cy={el.height / 2} 
                                r="1.5" 
                                fill="#ffffff" 
                              />
                            </g>

                            <title>{el.name} (عرض: {el.width}px)</title>
                            {renderArchControls(el)}
                          </g>
                        );
                      }

                      if (el.type === 'door') {
                        const doorCm = Math.round((el.width / 48) * 100);
                        return (
                          <g
                            key={el.id}
                            transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation})`}
                            className="cursor-move group"
                            onClick={(e) => { e.stopPropagation(); setSelectedArchElementId(el.id); }}
                            onMouseDown={(e) => handleArchMouseDown(e, el)}
                            onTouchStart={(e) => handleArchTouchStart(e, el)}
                          >
                            {selectGlow}
                            {/* Visual wall cutout/backing mask to hide wall line under door */}
                            <rect
                              x={0}
                              y={-6}
                              width={el.width}
                              height={12}
                              fill={isWhiteStyle ? '#ffffff' : '#070b13'}
                              stroke="none"
                            />
                            <circle cx="0" cy="0" r="3.5" fill={isWhiteStyle ? '#334155' : '#94a3b8'} />
                            <path
                              d={`M ${el.width} 0 A ${el.width} ${el.width} 0 0 1 0 ${el.width}`}
                              fill="none"
                              stroke={isSelected ? '#d946ef' : '#f43f5e'}
                              strokeWidth="1.2"
                              strokeDasharray="3,3"
                              opacity="0.85"
                            />
                            <line
                              x1="0"
                              y1="0"
                              x2={el.width}
                              y2="0"
                              stroke={isSelected ? '#d946ef' : '#f43f5e'}
                              strokeWidth={isSelected ? '3.5' : '2.5'}
                            />
                            <text
                              x={el.width / 2}
                              y={13}
                              textAnchor="middle"
                              dominantBaseline="hanging"
                              fill="#f43f5e"
                              style={{ fontSize: '8.5px' }}
                              fontWeight="black"
                              stroke={isWhiteStyle ? '#ffffff' : '#070b13'}
                              strokeWidth="2.5"
                              paintOrder="stroke"
                              className="select-none pointer-events-none font-mono"
                            >
                              {doorCm} cm
                            </text>
                            <title>{el.name}</title>
                            {renderArchControls(el)}
                          </g>
                        );
                      }

                      if (el.type === 'window') {
                        const windowCm = Math.round((Math.max(el.width, el.height) / 48) * 100);
                        return (
                          <g
                            key={el.id}
                            transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation})`}
                            className="cursor-move group"
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
                              stroke={isSelected ? '#d946ef' : '#3b82f6'}
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
                              style={{ fontSize: '9px' }}
                              fontWeight="black"
                              stroke={isWhiteStyle ? '#ffffff' : '#070b13'}
                              strokeWidth="2.5"
                              paintOrder="stroke"
                              className="select-none pointer-events-none font-mono"
                            >
                              {windowCm} cm
                            </text>
                            <title>{el.name}</title>
                            {renderArchControls(el)}
                          </g>
                        );
                      }

                      if (el.type === 'stairs') {
                        const stairsCmW = Math.round((el.width / 48) * 100);
                        const stairsCmH = Math.round((el.height / 48) * 100);
                        return (
                          <g
                            key={el.id}
                            transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation})`}
                            className="cursor-move group"
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
                              fill={isWhiteStyle ? '#fcfdfd' : '#040810'}
                              stroke={isSelected ? '#d946ef' : '#10b981'}
                              strokeWidth={isSelected ? '2' : '1.2'}
                            />
                            {(() => {
                              const stepsCount = Math.max(3, Math.floor(el.height / 10));
                              const stepHeight = el.height / stepsCount;
                              return Array.from({ length: stepsCount }).map((_, idx) => (
                                <line
                                  key={idx}
                                  x1="0"
                                  y1={idx * stepHeight}
                                  x2={el.width}
                                  y2={idx * stepHeight}
                                  stroke={isSelected ? '#d946ef' : '#10b981'}
                                  strokeWidth="0.8"
                                  opacity="0.7"
                                />
                              ));
                            })()}
                            <path
                              d={`M ${el.width/2} ${el.height - 12} L ${el.width/2} 12`}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="1.2"
                              strokeDasharray="2,2"
                            />
                            <path
                              d={`M ${el.width/2 - 4} 16 L ${el.width/2} 12 L ${el.width/2 + 4} 16`}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="1.5"
                            />
                            <text
                              x={el.width/2}
                              y={el.height - 18}
                              fontSize="8"
                              fontWeight="black"
                              fill="#10b981"
                              textAnchor="middle"
                            >
                              کد پله
                            </text>
                            <text
                              x={el.width / 2}
                              y={el.height / 2}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#047857"
                              style={{ fontSize: '9px' }}
                              fontWeight="black"
                              stroke={isWhiteStyle ? '#ffffff' : '#040810'}
                              strokeWidth="2.5"
                              paintOrder="stroke"
                              className="select-none pointer-events-none font-mono"
                            >
                              {stairsCmW}×{stairsCmH} cm
                            </text>
                            <title>{el.name}</title>
                            {renderArchControls(el)}
                          </g>
                        );
                      }

                      if (el.type === 'label') {
                        return (
                          <g
                            key={el.id}
                            transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation})`}
                            className="cursor-move group"
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
                              fill="rgba(99, 102, 241, 0.05)"
                              stroke={isSelected ? '#d946ef' : 'rgba(99, 102, 241, 0.4)'}
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
                            {renderArchControls(el)}
                          </g>
                        );
                      }

                      return null;
                    })}
                  </g>
                )}

                {/* Empty State Starting reference node */}
                {segments.length === 0 && !(viewMode === 'plan' && !showPipesInPlan) && (
                  <g transform={`translate(${offsetX}, ${offsetY})`} className="animate-pulse select-none no-print">
                    {/* Glowing outer ring */}
                    <circle cx="0" cy="0" r="14" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,3" />
                    {/* Core solid center dot with white border */}
                    <circle cx="0" cy="0" r="6.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                    {/* Descriptive label box */}
                    <g transform="translate(0, 24)">
                      <rect x="-90" y="-12" width="180" height="22" rx="7" fill={isWhiteStyle ? "#f8fafc" : "#090d16"} stroke={isWhiteStyle ? "#cbd5e1" : "#1e293b"} strokeWidth="1" opacity="0.9" />
                      <text
                        x="0"
                        y="2"
                        fill="#10b981"
                        fontSize="10"
                        fontWeight="black"
                        textAnchor="middle"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        نقطه شروع لوله‌کشی (کلیک کنید)
                      </text>
                    </g>
                  </g>
                )}

                {/* 1. Pipe Lines Path drawing group */}
                {!(viewMode === 'plan' && !showPipesInPlan) && computedPipeline.map((s, index) => {
                  const isSelected = s.id === selectedSegmentId;
                  
                  // Color codes for nominal pipe thicknesses
                  let pipeColor = '#3b82f6'; // 1" default blue shade
                  let pipeWidth = 1.1; // Very thin AutoCAD style line
                  
                  if (s.size.includes('1/2')) {
                    pipeColor = '#06b6d4'; // teal
                    pipeWidth = 1.1;
                  } else if (s.size.includes('3/4')) {
                    pipeColor = '#10b981'; // emerald
                    pipeWidth = 1.1;
                  } else if (s.size.includes('1 1/4')) {
                    pipeColor = '#f59e0b'; // amber
                    pipeWidth = 1.1;
                  } else if (s.size.includes('1 1/2') || s.size.startsWith('2')) {
                    pipeColor = '#ef4444'; // red thick gas line
                    pipeWidth = 1.1;
                  }

                  if (isSelected) {
                    pipeColor = '#d946ef'; // bright fuchsia highlight
                  }

                  if (isWhiteStyle) {
                    pipeColor = isSelected ? '#c026d3' : '#0f172a'; // Deep violet-magenta for select, crisp clean solid rich slate-900 for pipes
                  }

                   return (
                    <g 
                      key={`pipe-line-${s.id}`} 
                      className="transition-all duration-200"
                      onMouseEnter={() => setHoveredSegmentId(s.id)}
                      onMouseLeave={() => setHoveredSegmentId(null)}
                    >
                      
                      {/* Zero length starting origin/ref target anchor is completely hidden per user request */}
                      {s.length === 0 && null}

                      {/* Interactive thick hover cushion path layer */}
                      {s.length > 0 && (
                        viewMode === 'plan' && (s.direction === 'UP' || s.direction === 'DOWN') ? (
                          <circle
                            cx={s.startProj.x}
                            cy={s.startProj.y}
                            r="15"
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setSelectedSegmentId(s.id);
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              setSelectedSegmentId(s.id);
                            }}
                            onMouseUp={(e) => {
                              e.stopPropagation();
                            }}
                            onTouchEnd={(e) => {
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSegmentId(s.id);
                            }}
                          >
                            <title>{s.name}</title>
                          </circle>
                        ) : (
                          <line
                            x1={s.startProj.x}
                            y1={s.startProj.y}
                            x2={s.endProj.x}
                            y2={s.endProj.y}
                            stroke="transparent"
                            strokeWidth="18"
                            strokeLinecap="round"
                            className="cursor-pointer"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setSelectedSegmentId(s.id);
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              setSelectedSegmentId(s.id);
                            }}
                            onMouseUp={(e) => {
                              e.stopPropagation();
                            }}
                            onTouchEnd={(e) => {
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSegmentId(s.id);
                            }}
                          >
                            <title>{s.name}</title>
                          </line>
                        )
                      )}

                      {/* Optional segment highlight outer ring glow */}
                      {s.length > 0 && isSelected && (
                        viewMode === 'plan' && (s.direction === 'UP' || s.direction === 'DOWN') ? (
                          <circle
                            cx={s.startProj.x}
                            cy={s.startProj.y}
                            r="14"
                            stroke="#d946ef"
                            strokeWidth="3.5"
                            fill="none"
                            opacity="0.35"
                            filter="url(#neon-glow)"
                          />
                        ) : (
                          <line
                            x1={s.startProj.x}
                            y1={s.startProj.y}
                            x2={s.endProj.x}
                            y2={s.endProj.y}
                            stroke="#d946ef"
                            strokeWidth={pipeWidth + 6}
                            strokeLinecap="round"
                            opacity="0.25"
                            filter="url(#neon-glow)"
                          />
                        )
                      )}

                      {/* Actual steel line graphic */}
                      {s.length > 0 && (
                        viewMode === 'plan' && (s.direction === 'UP' || s.direction === 'DOWN') ? (
                          <g transform={`translate(${s.startProj.x}, ${s.startProj.y})`}>
                            {/* Riser Circle Outer */}
                            <circle
                              cx="0"
                              cy="0"
                              r="10"
                              fill={isWhiteStyle ? '#ffffff' : '#070b13'}
                              stroke={pipeColor}
                              strokeWidth={pipeWidth}
                              className="cursor-pointer transition-all duration-300"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setSelectedSegmentId(s.id);
                              }}
                              onTouchStart={(e) => {
                                e.stopPropagation();
                                setSelectedSegmentId(s.id);
                              }}
                              onMouseUp={(e) => {
                                e.stopPropagation();
                              }}
                              onTouchEnd={(e) => {
                                e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSegmentId(s.id);
                              }}
                            />
                            {s.direction === 'UP' ? (
                              /* UP: Central solid dot */
                              <circle
                                cx="0"
                                cy="0"
                                r="3.5"
                                fill={pipeColor}
                                pointerEvents="none"
                              />
                            ) : (
                              /* DOWN: X crossing inside */
                              <g stroke={pipeColor} strokeWidth={pipeWidth - 1} pointerEvents="none">
                                <line x1="-5" y1="-5" x2="5" y2="5" />
                                <line x1="5" y1="-5" x2="-5" y2="5" />
                              </g>
                            )}
                            {/* Visual tooltip */}
                            <title>{s.name} ({s.direction === 'UP' ? 'رایزر صعودی' : 'رایزر نزولی'} {s.length}م)</title>
                          </g>
                        ) : (
                          <line
                            x1={s.startProj.x}
                            y1={s.startProj.y}
                            x2={s.endProj.x}
                            y2={s.endProj.y}
                            stroke={pipeColor}
                            strokeWidth={pipeWidth}
                            strokeLinecap="round"
                            className="transition-all duration-300"
                          />
                        )
                      )}

                      {/* Blueprint visual line crossover (clash) interrupts/cuts */}
                      {s.length > 0 && intersections.filter(p => p.cutId === s.id).map((p, pIdx) => {
                        const maskBg = isWhiteStyle ? '#ffffff' : '#070b13';
                        const crossSeg = computedPipeline.find(x => x.id === p.crossId);
                        if (!crossSeg) return null;

                        // Calculate styles for the crossing segment
                        const crossIsSelected = crossSeg.id === selectedSegmentId;
                        const crossStyle = getSegmentStyle(crossSeg, crossIsSelected, isWhiteStyle);

                        // Direction unit vector of crossSeg
                        const dx = crossSeg.endProj.x - crossSeg.startProj.x;
                        const dy = crossSeg.endProj.y - crossSeg.startProj.y;
                        const len = Math.hypot(dx, dy);
                        if (len <= 0) return null;
                        const ux = dx / len;
                        const uy = dy / len;

                        // We make the gap slightly wider than the pipe width (e.g. pipe width + 4.5px)
                        const gapRadius = pipeWidth + 4.5;
                        const halfCrossLen = gapRadius + 1.5;

                        const cx1 = p.x - ux * halfCrossLen;
                        const cy1 = p.y - uy * halfCrossLen;
                        const cx2 = p.x + ux * halfCrossLen;
                        const cy2 = p.y + uy * halfCrossLen;

                        return (
                          <g key={`crossover-${s.id}-${p.crossId}-${pIdx}`}>
                            {/* Mask circle to cover/cut the current segment (s) */}
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={gapRadius}
                              fill={maskBg}
                            />
                            {/* Restorational continuous overlay line segment for the crossing segment */}
                            <line
                              x1={cx1}
                              y1={cy1}
                              x2={cx2}
                              y2={cy2}
                              stroke={crossStyle.color}
                              strokeWidth={crossStyle.width}
                              strokeLinecap="round"
                            />
                          </g>
                        );
                      })}

                      {/* Requirement 3: Professional CAD break symbol (overlapping ss-shapes with background white/black mask) for long pipes (>500cm) */}
                      {s.length > 5.0 && (() => {
                        const mx = (s.startProj.x + s.endProj.x) / 2;
                        const my = (s.startProj.y + s.endProj.y) / 2;
                        const angleRad = Math.atan2(s.endProj.y - s.startProj.y, s.endProj.x - s.startProj.x);
                        const angleDeg = (angleRad * 180) / Math.PI;
                        const maskBg = isWhiteStyle ? '#ffffff' : '#070b13';
                        const strokeColor = pipeColor;
                        
                        return (
                          <g transform={`translate(${mx}, ${my}) rotate(${angleDeg})`} className="pointer-events-none select-none">
                            {/* Hide background segment line under the break symbol */}
                            <rect
                              x="-6"
                              y="-5.5"
                              width="12"
                              height="11"
                              fill={maskBg}
                            />
                            {/* Left Stretched elegant S-Curve (scaled to half height per user request) */}
                            <path
                              d="M -3,-5 C 0,-5 -6,-1.5 -3,0 C 0,1.5 -6,5 -1,5"
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth="1.2"
                              strokeLinecap="round"
                            />
                            {/* Right Stretched elegant S-Curve (scaled to half height per user request) */}
                            <path
                              d="M 1,-5 C 4,-5 -2,-1.5 1,0 C 4,1.5 -2,5 3,5"
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth="1.2"
                              strokeLinecap="round"
                            />
                          </g>
                        );
                      })()}

                      {/* Node connection joints are completely removed per user request */}
                      {null}

                      {/* 2. Parallel Inline Gas-spec Typography labels */}
                      {s.length > 0 && (() => {
                        // 1. Calculate midpoint along the segment. If pipe has break symbol (>500cm, i.e., >5.0m),
                        // place the label before the break symbol (t = 0.28) to avoid overlap as requested by user.
                        const isVerticalPlan = viewMode === 'plan' && (s.direction === 'UP' || s.direction === 'DOWN');
                        const t = s.length > 5.0 ? 0.28 : 0.5;
                        let labelX = s.startProj.x + (s.endProj.x - s.startProj.x) * t;
                        let labelY = s.startProj.y + (s.endProj.y - s.startProj.y) * t;
                        
                        if (isVerticalPlan) {
                          labelX += 11;
                          labelY -= 7;
                        }
                        
                        // Compute mathematical angle of rotation of local vector
                        let textAngle = isVerticalPlan ? 0 : Math.atan2(s.endProj.y - s.startProj.y, s.endProj.x - s.startProj.x) * 180 / Math.PI;
                        
                        // Limit vertical text layout flips to maintain legible read directions
                        if (!isVerticalPlan) {
                          if (textAngle > 90) textAngle -= 180;
                          if (textAngle < -90) textAngle += 180;
                        }

                        // Calculate perpendicular translation in local space
                        // SideShift: alternates between negative (above) and positive (below) the line
                        // Made labels extremely close to the pipe (shifted to 4.5/-4.5/4.0 px) for an elegant AutoCAD design
                        const localShiftY = isVerticalPlan ? 0 : (labelSideShift ? (index % 2 === 0 ? -4.5 : 4.5) : -4.0);

                        // Scale backdrop geometry to fit font size
                        const parentSeg = computedPipeline.find(p => p.id === s.parentId);
                        const firstLine = computedPipeline.find(p => p.length > 0);
                        const isFirstLine = firstLine && s.id === firstLine.id;

                        let showSize = true;
                        if (isFirstLine) {
                          // Requirement 2: Show size on the first segment along with length
                          showSize = true;
                        } else if (parentSeg) {
                          const siblings = computedPipeline.filter(c => c.parentId === parentSeg.id);
                          // It is a straight continuation if siblings count is 1 AND size has not changed from parent
                          if (s.size === parentSeg.size && siblings.length === 1) {
                            showSize = false;
                          } else {
                            showSize = true;
                          }
                        }

                        // Requirement 2: Do not show 'cm' for lengths below 150 centimeters. Only show the numeric value per user request.
                        const lenCm = Math.round(s.length * 100);

                        // Hide label if length is exactly 10 in isometric view, as requested by user to reduce visual clutter and make numbers cleaner
                        if (viewMode === 'isometric' && lenCm === 10) {
                          return null;
                        }

                        const suffix = lenCm < 150 ? "" : "cm";
                        const labelText = showSize ? `${s.size}:${lenCm}${suffix}` : `${lenCm}${suffix}`;
                        const rectWidth = Math.max(54, labelText.length * labelFontSize * 0.58 + 8);
                        const rectHeight = labelFontSize + 6;
                        const rectX = -rectWidth / 2;
                        const rectY = -rectHeight / 2;

                        // Interactive Hover Mode Opacity management
                        const isHovered = s.id === hoveredSegmentId;
                        const isHighlighted = isSelected || isHovered;
                        const showFaded = labelHoverMode && !isHighlighted;
                        const labelOpacity = showFaded ? 0.18 : 1.0;

                        return (
                          <g 
                            transform={`translate(${labelX}, ${labelY}) rotate(${textAngle}) translate(0, ${localShiftY})`}
                            style={{ opacity: labelOpacity, transition: isPrintMode ? 'none' : 'opacity 0.3s ease' }}
                            className="pointer-events-none"
                          >
                            {/* Backdrop highlight bar - Set to transparent (opacity 0) as requested by user to keep pipes fully visible and remove box border frame */}
                            <rect
                              x={rectX}
                              y={rectY}
                              width={rectWidth}
                              height={rectHeight}
                              rx="3"
                              fill="none"
                              stroke="none"
                              opacity="0"
                            />
                            
                            {/* Combined size and length metric tag */}
                            <text
                              textAnchor="middle"
                              dominantBaseline="central"
                              y="0.5"
                              fill={isSelected ? (isWhiteStyle ? '#c026d3' : '#f5d0fe') : isHovered ? (isWhiteStyle ? '#1e1b4b' : '#ffffff') : isWhiteStyle ? '#0f172a' : '#e2e8f0'}
                              fontSize={labelFontSize}
                              fontWeight="bold"
                              fontFamily="monospace"
                              letterSpacing="0.3"
                            >
                              {labelText}
                            </text>
                          </g>
                        );
                      })()}
                    </g>
                  );
                })}

                {/* 3. Render Accessory Node Symbols and Icons */}
                {!(viewMode === 'plan' && !showPipesInPlan) && computedPipeline.map((s) => {
                  const symbolStroke = isWhiteStyle ? '#0f172a' : '#ffffff';
                  const symbolTextFill = isWhiteStyle ? '#1e293b' : '#cbd5e1';
                  const lineStrokeColor = isWhiteStyle ? '#1e293b' : '#f8fafc';

                  return ['start', 'end'].map((pos) => {
                    const renderAccessory = pos === 'start' ? s.accessoryPosition === 'start' && s.accessory !== 'none' : s.accessoryPosition === 'end' && s.accessory !== 'none';
                    if (!renderAccessory) return null;

                    const pt = pos === 'start' ? s.startProj : s.endProj;
                    const type = s.accessory;

                    // Determine the exact physical 2D line segment direction angle & absolute rotation matrix
                    const dx = s.endProj.x - s.startProj.x;
                    const dy = s.endProj.y - s.startProj.y;
                    let angleRad = 0;
                    const len = Math.hypot(dx, dy);
                    if (len > 0) {
                      angleRad = Math.atan2(dy, dx);
                    }
                    const cosA = Math.cos(angleRad);
                    const sinA = Math.sin(angleRad);

                    // Utility to mathematically rotate (x, y) coordinates around (0,0) by the segment orientation
                    // This bypasses html2canvas/SVG rotation transform rendering issues and guarantees absolute alignment in PDF exports.
                    const rPt = (x: number, y: number) => {
                      return {
                        x: Number((x * cosA - y * sinA).toFixed(3)),
                        y: Number((x * sinA + y * cosA).toFixed(3))
                      };
                    };

                    const formatPoints = (pts: {x: number, y: number}[]) => {
                      return pts.map(p => `${p.x},${p.y}`).join(' ');
                    };

                    let accTextAngle = (angleRad * 180) / Math.PI;
                    if (accTextAngle > 90) accTextAngle -= 180;
                    if (accTextAngle < -90) accTextAngle += 180;

                    let isStyleScale = (scale / 48) * 1.0;
                    if (type !== 'valve' && type !== 'regulator' && type !== 'meter') {
                      isStyleScale *= 2.0;
                    }

                    return (
                      <g
                        key={`acc-${s.id}-${pos}`}
                        transform={`translate(${pt.x}, ${pt.y}) scale(${isStyleScale})`}
                        className="cursor-pointer"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setSelectedSegmentId(s.id);
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          setSelectedSegmentId(s.id);
                        }}
                        onMouseUp={(e) => {
                          e.stopPropagation();
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSegmentId(s.id);
                        }}
                      >
                        {/* Rendering specific vector graphic templates based on selection using mathematically absolute rotated points */}
                        {type === 'regulator' && (
                          <g>
                            {/* Circle border with solid white background - increased size by 20% */}
                            <circle cx="0" cy="10" r="7.8" fill="#ffffff" stroke="#000000" strokeWidth="0.8" />
                            {/* Bold black letter R in the middle - increased size by 20% */}
                            <text 
                              x="0" 
                              y="10" 
                              fill="#000000" 
                              fontSize="9.6" 
                              fontWeight="900" 
                              textAnchor="middle" 
                              dominantBaseline="central" 
                              fontFamily="sans-serif"
                            >
                              R
                            </text>
                          </g>
                        )}

                        {type === 'meter' && (
                          <g transform={`rotate(${(angleRad * 180) / Math.PI})`}>
                            <rect x="-3" y="-3" width="6" height="6" fill="#64748b" stroke={symbolStroke} strokeWidth="0.8" rx="0.6" ry="0.6" />
                            <text y="9.5" fill={isWhiteStyle ? '#475569' : '#94a3b8'} fontSize="6.5" fontWeight="black" textAnchor="middle">GM</text>
                          </g>
                        )}

                        {type === 'valve' && (
                          <g>
                            {(() => {
                              const dx_offset = pos === 'end' ? 3.2 : -3.2;
                              const t1_1 = rPt(-3.2 + dx_offset, -2);
                              const t1_2 = rPt(-3.2 + dx_offset, 2);
                              const t1_3 = rPt(0 + dx_offset, 0);
                              
                              const t2_1 = rPt(3.2 + dx_offset, -2);
                              const t2_2 = rPt(3.2 + dx_offset, 2);
                              const t2_3 = rPt(0 + dx_offset, 0);

                              const stemStart = rPt(0 + dx_offset, 0);
                              const stemEnd = rPt(0 + dx_offset, -2.8);
                              
                              const handleStart = rPt(-2 + dx_offset, -2.8);
                              const handleEnd = rPt(2 + dx_offset, -2.8);
                              
                              return (
                                <>
                                  {/* Standard 3D structural double-triangle gate symbol with stem & red handle */}
                                  <polygon points={formatPoints([t1_1, t1_2, t1_3])} fill="#fbbf24" stroke={symbolStroke} strokeWidth="0.8" />
                                  <polygon points={formatPoints([t2_1, t2_2, t2_3])} fill="#fbbf24" stroke={symbolStroke} strokeWidth="0.8" />
                                  {/* Stem & Handle line (using absolute coordinates for robust canvas export) */}
                                  <line x1={stemStart.x} y1={stemStart.y} x2={stemEnd.x} y2={stemEnd.y} stroke={symbolStroke} strokeWidth="1" />
                                  <line x1={handleStart.x} y1={handleStart.y} x2={handleEnd.x} y2={handleEnd.y} stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" />
                                </>
                              );
                            })()}
                          </g>
                        )}

                        {type === 'boiler' && (
                          <g>
                            {(() => {
                              const dx_offset = pos === 'end' ? 6.4 : -6.4;
                              const t1_1 = rPt(-6.4 + dx_offset, -3.2);
                              const t1_2 = rPt(-6.4 + dx_offset, 3.2);
                              const t1_3 = rPt(0 + dx_offset, 0);
                              
                              const t2_1 = rPt(6.4 + dx_offset, -3.2);
                              const t2_2 = rPt(6.4 + dx_offset, 3.2);
                              const t2_3 = rPt(0 + dx_offset, 0);
                              return (
                                <>
                                  <polygon points={formatPoints([t1_1, t1_2, t1_3])} fill="#38bdf8" stroke={symbolStroke} strokeWidth="0.8" />
                                  <polygon points={formatPoints([t2_1, t2_2, t2_3])} fill="#38bdf8" stroke={symbolStroke} strokeWidth="0.8" />
                                </>
                              );
                            })()}
                            {(() => {
                              const tx = pos === 'end' ? 6.4 : -6.4;
                              const tPt = rPt(tx, 9.5);
                              return (
                                <g transform={`translate(${tPt.x}, ${tPt.y}) rotate(${accTextAngle})`}>
                                  <text x="0" y="0" fill={isWhiteStyle ? "#0369a1" : "#38bdf8"} fontSize="8.5" fontWeight="black" textAnchor="middle" dominantBaseline="central">BP</text>
                                </g>
                              );
                            })()}
                          </g>
                        )}

                        {type === 'water_heater' && (
                          <g>
                            {(() => {
                              const dx_offset = pos === 'end' ? 6.4 : -6.4;
                              const t1_1 = rPt(-6.4 + dx_offset, -3.2);
                              const t1_2 = rPt(-6.4 + dx_offset, 3.2);
                              const t1_3 = rPt(0 + dx_offset, 0);
                              
                              const t2_1 = rPt(6.4 + dx_offset, -3.2);
                              const t2_2 = rPt(6.4 + dx_offset, 3.2);
                              const t2_3 = rPt(0 + dx_offset, 0);
                              return (
                                <>
                                  <polygon points={formatPoints([t1_1, t1_2, t1_3])} fill="#06b6d4" stroke={symbolStroke} strokeWidth="0.8" />
                                  <polygon points={formatPoints([t2_1, t2_2, t2_3])} fill="#06b6d4" stroke={symbolStroke} strokeWidth="0.8" />
                                </>
                              );
                            })()}
                            {(() => {
                              const tx = pos === 'end' ? 6.4 : -6.4;
                              const tPt = rPt(tx, 9.5);
                              return (
                                <g transform={`translate(${tPt.x}, ${tPt.y}) rotate(${accTextAngle})`}>
                                  <text x="0" y="0" fill={isWhiteStyle ? "#0e7490" : "#06b6d4"} fontSize="8.5" fontWeight="black" textAnchor="middle" dominantBaseline="central">BP</text>
                                </g>
                              );
                            })()}
                          </g>
                        )}

                        {type === 'floor_water_heater' && (
                          <g>
                            {(() => {
                              const dx_offset = pos === 'end' ? 6.4 : -6.4;
                              const t1_1 = rPt(-6.4 + dx_offset, -3.2);
                              const t1_2 = rPt(-6.4 + dx_offset, 3.2);
                              const t1_3 = rPt(0 + dx_offset, 0);
                              
                              const t2_1 = rPt(6.4 + dx_offset, -3.2);
                              const t2_2 = rPt(6.4 + dx_offset, 3.2);
                              const t2_3 = rPt(0 + dx_offset, 0);
                              return (
                                <>
                                  <polygon points={formatPoints([t1_1, t1_2, t1_3])} fill="#22c55e" stroke={symbolStroke} strokeWidth="0.8" />
                                  <polygon points={formatPoints([t2_1, t2_2, t2_3])} fill="#22c55e" stroke={symbolStroke} strokeWidth="0.8" />
                                </>
                              );
                            })()}
                            {(() => {
                              const tx = pos === 'end' ? 6.4 : -6.4;
                              const tPt = rPt(tx, 9.5);
                              return (
                                <g transform={`translate(${tPt.x}, ${tPt.y}) rotate(${accTextAngle})`}>
                                  <text x="0" y="0" fill={isWhiteStyle ? "#15803d" : "#22c55e"} fontSize="8.5" fontWeight="black" textAnchor="middle" dominantBaseline="central">WH</text>
                                </g>
                              );
                            })()}
                          </g>
                        )}

                        {type === 'yard_valve' && (
                          <g>
                            {(() => {
                              const dx_offset = pos === 'end' ? 6.4 : -6.4;
                              const t1_1 = rPt(-6.4 + dx_offset, -3.2);
                              const t1_2 = rPt(-6.4 + dx_offset, 3.2);
                              const t1_3 = rPt(0 + dx_offset, 0);
                              
                              const t2_1 = rPt(6.4 + dx_offset, -3.2);
                              const t2_2 = rPt(6.4 + dx_offset, 3.2);
                              const t2_3 = rPt(0 + dx_offset, 0);
                              return (
                                <>
                                  <polygon points={formatPoints([t1_1, t1_2, t1_3])} fill="#0d9488" stroke={symbolStroke} strokeWidth="0.8" />
                                  <polygon points={formatPoints([t2_1, t2_2, t2_3])} fill="#0d9488" stroke={symbolStroke} strokeWidth="0.8" />
                                </>
                              );
                            })()}
                            {(() => {
                              const tx = pos === 'end' ? 6.4 : -6.4;
                              const tPt = rPt(tx, 9.5);
                              return (
                                <g transform={`translate(${tPt.x}, ${tPt.y}) rotate(${accTextAngle})`}>
                                  <text x="0" y="0" fill={isWhiteStyle ? "#0f766e" : "#0d9488"} fontSize="8.5" fontWeight="black" textAnchor="middle" dominantBaseline="central">RC</text>
                                </g>
                              );
                            })()}
                          </g>
                        )}

                        {type === 'stove' && (
                          <g>
                            {(() => {
                              const dx_offset = pos === 'end' ? 6.4 : -6.4;
                              const t1_1 = rPt(-6.4 + dx_offset, -3.2);
                              const t1_2 = rPt(-6.4 + dx_offset, 3.2);
                              const t1_3 = rPt(0 + dx_offset, 0);
                              
                              const t2_1 = rPt(6.4 + dx_offset, -3.2);
                              const t2_2 = rPt(6.4 + dx_offset, 3.2);
                              const t2_3 = rPt(0 + dx_offset, 0);
                              return (
                                <>
                                  <polygon points={formatPoints([t1_1, t1_2, t1_3])} fill="#fb923c" stroke={symbolStroke} strokeWidth="0.8" />
                                  <polygon points={formatPoints([t2_1, t2_2, t2_3])} fill="#fb923c" stroke={symbolStroke} strokeWidth="0.8" />
                                </>
                              );
                            })()}
                            {(() => {
                              const tx = pos === 'end' ? 6.4 : -6.4;
                              const tPt = rPt(tx, 9.5);
                              return (
                                <g transform={`translate(${tPt.x}, ${tPt.y}) rotate(${accTextAngle})`}>
                                  <text x="0" y="0" fill={isWhiteStyle ? "#c2410c" : "#fb923c"} fontSize="8.5" fontWeight="black" textAnchor="middle" dominantBaseline="central">GC</text>
                                </g>
                              );
                            })()}
                          </g>
                        )}

                        {type === 'heater' && (
                          <g>
                            {(() => {
                              const dx_offset = pos === 'end' ? 6.4 : -6.4;
                              const t1_1 = rPt(-6.4 + dx_offset, -3.2);
                              const t1_2 = rPt(-6.4 + dx_offset, 3.2);
                              const t1_3 = rPt(0 + dx_offset, 0);
                              
                              const t2_1 = rPt(6.4 + dx_offset, -3.2);
                              const t2_2 = rPt(6.4 + dx_offset, 3.2);
                              const t2_3 = rPt(0 + dx_offset, 0);
                              return (
                                <>
                                  <polygon points={formatPoints([t1_1, t1_2, t1_3])} fill="#a855f7" stroke={symbolStroke} strokeWidth="0.8" />
                                  <polygon points={formatPoints([t2_1, t2_2, t2_3])} fill="#a855f7" stroke={symbolStroke} strokeWidth="0.8" />
                                </>
                              );
                            })()}
                            {(() => {
                              const tx = pos === 'end' ? 6.4 : -6.4;
                              const tPt = rPt(tx, 9.5);
                              return (
                                <g transform={`translate(${tPt.x}, ${tPt.y}) rotate(${accTextAngle})`}>
                                  <text x="0" y="0" fill={isWhiteStyle ? "#7e22ce" : "#c084fc"} fontSize="8.5" fontWeight="black" textAnchor="middle" dominantBaseline="central">H</text>
                                </g>
                              );
                            })()}
                          </g>
                        )}
                      </g>
                    );
                  });
                })}
              </svg>

              {/* Quick Interactive Length Editor floating on top of Canvas */}
              {selectedSegmentId && !(viewMode === 'plan' && !showPipesInPlan) && (
                (() => {
                  const selectedSeg = segments.find(s => s.id === selectedSegmentId);
                  if (!selectedSeg || selectedSeg.length === 0) return null;
                  return (
                    <div 
                      data-html2canvas-ignore="true"
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950/95 backdrop-blur-lg px-3 py-1.5 rounded-2xl border border-indigo-500/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-2.5 z-40 max-w-[92%] sm:max-w-md no-print text-right transition-all animate-bounce-subtle" 
                      style={{ direction: 'rtl' }}
                    >
                      <div className="flex flex-col min-w-[110px] xs:min-w-[130px]">
                        <span className="text-[9px] font-black text-indigo-300">طول لوله انتخابی: {selectedSeg.name}</span>
                        <span className="text-[8px] font-bold text-slate-400 mt-0.5">ثبت مستقیم از روی نقشه</span>
                      </div>
                      
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                        {/* Decrement Button */}
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustLength(-10)}
                          className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-black transition-all cursor-pointer active:scale-95"
                          title="کاهش طول لوله گازی (۱۰ سانتیمتر)"
                        >
                          -۱۰
                        </button>
                        
                        {/* Instant Number Input (allows clearing) */}
                        <input
                          type="text"
                          value={editLength}
                          onChange={(e) => {
                            const valStr = e.target.value;
                            setEditLength(valStr);
                            const parsedCm = parseFloat(valStr);
                            if (!isNaN(parsedCm) && parsedCm > 0) {
                              const meters = parsedCm / 100;
                              changeSegments(prev => prev.map(s => {
                                if (s.id === selectedSegmentId) {
                                  return { ...s, length: meters };
                                }
                                return s;
                              }));
                            }
                          }}
                          className="w-12 text-center text-xs font-mono font-black text-amber-400 bg-transparent focus:outline-none p-0.5 border-0"
                          title="طول لوله (سانتی‌متر)"
                        />
                        <span className="text-[8px] font-black text-slate-400 pl-0.5">سانت</span>
                        
                        {/* Increment Button */}
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustLength(10)}
                          className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-black transition-all cursor-pointer active:scale-95"
                          title="افزایش طول لوله گازی (۱۰ سانتیمتر)"
                        >
                          +۱۰
                        </button>
                      </div>
                      
                      <div className="h-6 w-[1px] bg-slate-800 mx-0.5" />

                      {/* Settings Button inside selection bar instead of trash bin */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsLabelPanelOpen(!isLabelPanelOpen)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 ${
                            isLabelPanelOpen
                              ? 'bg-indigo-600 border-indigo-400 text-white'
                              : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-indigo-400 hover:text-indigo-300'
                          }`}
                          title="تنظیمات پیشرفته نمایش نوشته‌های لوله‌ها"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>

                        {/* Settings Panel Content floating above */}
                        {isLabelPanelOpen && (
                          <div 
                            className="absolute bottom-9 left-0 bg-slate-950/98 backdrop-blur-md p-3 rounded-2xl border border-slate-850 shadow-[0_12px_45px_rgba(0,0,0,0.85)] flex flex-col gap-2 min-w-[210px] text-right transition-all animate-fade-in animate-duration-150 z-[60]"
                            style={{ direction: 'rtl' }}
                          >
                            <span className="text-[9.5px] font-black text-indigo-300 border-b border-indigo-950/40 pb-1 text-center">بهبود خوانایی لوله‌های متراکم</span>
                            
                            {/* Toggle: Stagger labels along the line */}
                            <div className="flex items-center justify-between gap-3 bg-slate-900/40 p-1 px-1.5 rounded-lg border border-slate-900/80">
                              <span className="text-[9px] font-bold text-slate-300">چینش پله‌ای (غیرهم‌تراز)</span>
                              <button
                                type="button"
                                onClick={() => setLabelStagger(!labelStagger)}
                                className={`w-7 h-3.5 rounded-full transition-colors relative cursor-pointer ${
                                  labelStagger ? 'bg-indigo-600' : 'bg-slate-800'
                                }`}
                              >
                                <span className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                                  labelStagger ? 'translate-x-3.5' : 'translate-x-0'
                                }`} />
                              </button>
                            </div>

                            {/* Toggle: Shift labels top/bottom (Left/Right) alternates */}
                            <div className="flex items-center justify-between gap-3 bg-slate-900/40 p-1 px-1.5 rounded-lg border border-slate-900/80">
                              <span className="text-[9px] font-bold text-slate-300">طرح تناوبی (دو طرف خط)</span>
                              <button
                                type="button"
                                onClick={() => setLabelSideShift(!labelSideShift)}
                                className={`w-7 h-3.5 rounded-full transition-colors relative cursor-pointer ${
                                  labelSideShift ? 'bg-indigo-600' : 'bg-slate-800'
                                }`}
                              >
                                <span className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                                  labelSideShift ? 'translate-x-3.5' : 'translate-x-0'
                                }`} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}              {/* Floor Plan Creator Elements Custom Side Drawer */}
              {viewMode === 'plan' && (
                <div 
                  data-html2canvas-ignore="true"
                  className="absolute right-0 top-0 bottom-0 w-20 bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 text-center z-40 flex flex-col no-print transition-transform duration-300 shadow-[-5px_0_15px_rgba(0,0,0,0.4)]"
                  style={{ 
                    direction: 'rtl',
                    transform: showFloorPlanDrawer ? 'translateX(0)' : 'translateX(100%)' 
                  }}
                >
                  {/* Drawer Header */}
                  <div className="p-3 border-b border-slate-800 flex flex-col items-center gap-1.5 bg-slate-950/80 shrink-0">
                    <span className="font-black text-[10px] text-indigo-400">طرح فضا</span>
                    <button
                      onClick={() => setShowFloorPlanDrawer(false)}
                      className="p-1 px-2 rounded-lg bg-slate-800 hover:bg-red-950/60 text-red-400 text-[10px] font-bold transition-all cursor-pointer"
                      title="بستن منو"
                    >
                      بستن ×
                    </button>
                  </div>

                  {/* Drawer Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar select-none text-center">
                    
                    {/* Add Room Presets */}
                    <div className="space-y-1">
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 block">طرح آماده</span>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={handleLoadPresetSquare}
                          className="w-full py-1.5 px-0.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-[10px] font-black border border-indigo-500/20 text-center flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer"
                          title="فضای ۴ دیواری چهارگوش ساده"
                        >
                          <span className="text-sm">⬜</span>
                          <span className="text-[9px]">مربع</span>
                        </button>
                        <button
                          onClick={handleLoadPresetLShape}
                          className="w-full py-1.5 px-0.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-[10px] font-black border border-indigo-500/20 text-center flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer"
                          title="سالن ال شکل"
                        >
                          <span className="text-sm">📐</span>
                          <span className="text-[9px]">ال شکل</span>
                        </button>
                        <button
                          onClick={handleLoadPresetThreeRoom}
                          className="w-full py-1.5 px-0.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-[10px] font-black border border-indigo-500/20 text-center flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer"
                          title="نقشه سه‌خوابه"
                        >
                          <span className="text-sm">🏚️</span>
                          <span className="text-[9px]">سه‌خوابه</span>
                        </button>
                      </div>
                    </div>

                    {/* Structural Architectural Elements Palette */}
                    <div className="space-y-1 pt-2 border-t border-slate-850">
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 block">مصالح فضا</span>
                      <div className="flex flex-col gap-1.5">
                        {/* Wall */}
                        <button
                          onClick={handleAddWall}
                          className="w-full py-2 px-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white text-[10px] font-black border border-slate-700 flex flex-col items-center gap-1 transition-all text-center cursor-pointer"
                        >
                          <div className="w-6 h-1.5 bg-slate-400 rounded-sm" />
                          <span>دیوار جدید</span>
                        </button>

                        {/* Door */}
                        <button
                          onClick={handleAddDoor}
                          className="w-full py-2 px-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white text-[10px] font-black border border-slate-700 flex flex-col items-center gap-1 transition-all text-center cursor-pointer"
                        >
                          <svg className="w-6 h-6 text-rose-450" viewBox="0 0 40 40">
                            <circle cx="5" cy="5" r="3" fill="none" stroke="currentColor" strokeWidth="3" />
                            <path d="M 35 5 A 30 30 0 0 1 5 35" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="4,4" />
                            <line x1="5" y1="5" x2="35" y2="5" stroke="currentColor" strokeWidth="4" />
                          </svg>
                          <span>درب ورودی</span>
                        </button>

                        {/* Window */}
                        <button
                          onClick={handleAddWindow}
                          className="w-full py-2 px-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white text-[10px] font-black border border-slate-700 flex flex-col items-center gap-1 transition-all text-center cursor-pointer"
                        >
                          <svg className="w-8 h-3 text-sky-450" viewBox="0 0 60 20">
                            <rect x="2" y="2" width="56" height="16" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="3" />
                            <line x1="2" y1="10" x2="58" y2="10" stroke="currentColor" strokeWidth="3" />
                          </svg>
                          <span>پنجره</span>
                        </button>

                        {/* Stairs */}
                        <button
                          onClick={handleAddStairs}
                          className="w-full py-2 px-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white text-[10px] font-black border border-slate-700 flex flex-col items-center gap-1 transition-all text-center cursor-pointer"
                        >
                          <svg className="w-6 h-6 text-emerald-450" viewBox="0 0 30 30">
                            <rect x="2" y="2" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" />
                            <line x1="2" y1="8" x2="28" y2="8" stroke="currentColor" strokeWidth="2" />
                            <line x1="2" y1="15" x2="28" y2="15" stroke="currentColor" strokeWidth="2" />
                            <line x1="2" y1="22" x2="28" y2="22" stroke="currentColor" strokeWidth="2" />
                          </svg>
                          <span>راه پله</span>
                        </button>

                        {/* Text Label */}
                        <button
                          onClick={handleAddLabel}
                          className="w-full py-2 px-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800/40 text-indigo-350 text-[10px] font-black flex flex-col items-center gap-1 transition-all text-center cursor-pointer"
                        >
                          <span className="font-black text-xs">T</span>
                          <span>برچسب فضا</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Manual Actions */}
                    <div className="space-y-1 pt-2 border-t border-slate-850">
                      <button
                        onClick={handleClearPresets}
                        className="w-full py-1.5 px-0.5 rounded-lg bg-red-650/15 hover:bg-red-650/30 text-red-400 text-[9px] font-black border border-red-500/20 text-center transition-all cursor-pointer"
                      >
                        حذف کل پلان
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* Toggle Drawer Handle Button (gorgeous floating trigger on correct side) */}
              {viewMode === 'plan' && !showFloorPlanDrawer && (
                <button
                  data-html2canvas-ignore="true"
                  onClick={() => setShowFloorPlanDrawer(true)}
                  className="absolute right-3 top-14 bg-indigo-600 hover:bg-indigo-700 text-white p-2 text-xs font-black rounded-xl border border-indigo-400 shadow-2xl z-30 transition-all flex items-center gap-1 animate-pulse no-print cursor-pointer"
                  style={{ direction: 'rtl' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>طرح فضا</span>
                </button>
              )}
            </div>

            {/* Bottom Actions footer bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2.5 items-center justify-between no-print">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 text-indigo-500" />
                <span>برای ایجاد سه راهی و تغییرات بعدی، ابتدا دکمه ی حرکت نقشه را زده و سپس شاخه ی مورد نظر را انتخاب کنید</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsPDFSettingsOpen(true)}
                  disabled={isGeneratingPDF}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  title="دانلود فوری فایل پی‌دی‌اف کارگاهی با مقیاس دلخواه"
                >
                  {isGeneratingPDF ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>{isGeneratingPDF ? 'در حال تولید PDF...' : 'دانلود فایل نقشه (PDF)'}</span>
                </button>
              </div>
            </div>

            {/* Professional Print & Precise scale settings Modal (تنظیمات چاپ دقیق مهندسی) */}
            {isPDFSettingsOpen && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in animate-duration-150" style={{ direction: 'rtl' }}>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] max-w-lg w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl flex flex-col gap-3 sm:gap-4 relative animate-scale-up">
                  {/* Close button icon */}
                  <button 
                    type="button"
                    onClick={() => setIsPDFSettingsOpen(false)}
                    className="absolute top-4 left-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="bg-indigo-100 dark:bg-indigo-950/40 p-2 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
                      <FileText className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs sm:text-sm text-slate-800 dark:text-slate-100">تنظیمات مقیاس و خروجی PDF</h3>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5 hidden xs:block">جهت چاپ فیزیکی دقیق کارگاهی</p>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {/* Paper Size setting row */}
                    <div>
                      <label className="text-[10px] sm:text-[11px] font-black text-slate-500 dark:text-slate-400 block mb-1">ابعاد کاغذ چاپ (Landscape)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPdfPaperSize('a3')}
                          className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-[11px] sm:text-xs font-black cursor-pointer transition-all ${
                            pdfPaperSize === 'a3' 
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' 
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span>کاغذ بزرگ A3</span>
                          <span className="text-[8px] sm:text-[10px] text-slate-400">۴۲۰×۲۹۷ mm</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPdfPaperSize('a4')}
                          className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-[11px] sm:text-xs font-black cursor-pointer transition-all ${
                            pdfPaperSize === 'a4' 
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' 
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span>کاغذ استاندارد A4</span>
                          <span className="text-[8px] sm:text-[10px] text-slate-400">۲۹۷×۲۱۰ mm</span>
                        </button>
                      </div>
                    </div>

                    {/* Scale Mode Row */}
                    <div>
                      <label className="text-[10px] sm:text-[11px] font-black text-slate-500 dark:text-slate-400 block mb-1">نحوه مقیاس‌گذاری نقشه</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPdfScaleMode('precise')}
                          className={`flex flex-col items-start p-2.5 sm:p-3 rounded-xl border text-[11px] sm:text-xs font-black cursor-pointer transition-all gap-0.5 sm:gap-1 text-right ${
                            pdfScaleMode === 'precise' 
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' 
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>مقیاس دقیق فیزیکی</span>
                            <span className="text-[7.5px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded leading-none">معتبر</span>
                          </div>
                          <span className="text-[8px] sm:text-[9px] text-slate-400 font-normal leading-tight font-sans">ابعاد مهندسی دقیق روی کاغذ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPdfScaleMode('fit')}
                          className={`flex flex-col items-start p-2.5 sm:p-3 rounded-xl border text-[11px] sm:text-xs font-black cursor-pointer transition-all gap-0.5 sm:gap-1 text-right ${
                            pdfScaleMode === 'fit' 
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' 
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span>پر کردن اتوماتیک صفحه</span>
                          <span className="text-[8px] sm:text-[9px] text-slate-400 font-normal leading-tight font-sans">تناسب خودکار با کاغذ (Fit)</span>
                        </button>
                      </div>
                    </div>

                    {/* Precise Scale Sub-selections */}
                    {pdfScaleMode === 'precise' && (
                      <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/80">
                        <label className="text-[9px] sm:text-[10px] font-black text-indigo-600 dark:text-indigo-400 block mb-1.5 font-sans">نسبت مقیاس دقیق نقشه‌کشی</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { value: '1:50', label: 'مقیاس ۱:۵۰', desc: 'هر متر = ۲cm' },
                            { value: '1:100', label: 'مقیاس ۱:۱۰۰', desc: 'هر متر = ۱cm' },
                            { value: '1:200', label: 'مقیاس ۱:۲۰۰', desc: 'هر متر = ۰.۵cm' },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setPdfPreciseScale(opt.value as any)}
                              className={`p-1.5 sm:p-2 rounded-lg border flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
                                pdfPreciseScale === opt.value
                                  ? 'border-indigo-500 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 font-black shadow-sm'
                                  : 'border-transparent bg-slate-200/65 dark:bg-slate-850 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              <span className="text-[10px] sm:text-xs font-black">{opt.label}</span>
                              <span className="text-[7.5px] sm:text-[8px] opacity-75 font-normal font-sans">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dynamic print size & limit check calculations preview */}
                    {(() => {
                      const target = document.getElementById('isom-printable-area');
                      const targetWidth = target ? target.offsetWidth : 700;
                      const targetHeight = target ? target.offsetHeight : 525;
                      
                      let computedW_mm = pdfPaperSize === 'a3' ? 420 : 297;
                      let computedH_mm = pdfPaperSize === 'a3' ? 297 : 210;
                      
                      if (pdfScaleMode === 'precise') {
                        let mmPerPixel = 10 / scale;
                        if (pdfPreciseScale === '1:50') mmPerPixel = 20 / scale;
                        if (pdfPreciseScale === '1:200') mmPerPixel = 5 / scale;
                        
                        computedW_mm = targetWidth * mmPerPixel;
                        computedH_mm = targetHeight * mmPerPixel;
                      }
                      
                      const paperW_mm = pdfPaperSize === 'a3' ? 420 : 297;
                      const paperH_mm = pdfPaperSize === 'a3' ? 297 : 210;
                      
                      const isOverflowing = pdfScaleMode === 'precise' && (computedW_mm > paperW_mm || computedH_mm > paperH_mm);
                      
                      return (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1.5 text-right font-medium">
                          <div className="flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="text-slate-500 dark:text-slate-400">ابعاد طرح روی کاغذ چاپ:</span>
                            <span className="font-extrabold text-slate-800 dark:text-white font-mono" style={{ direction: 'ltr' }}>
                              {(computedW_mm / 10).toFixed(1)} cm × {(computedH_mm / 10).toFixed(1)} cm
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="text-slate-500 dark:text-slate-400">ابعاد کاغذ انتخابی ({pdfPaperSize.toUpperCase()}):</span>
                            <span className="font-extrabold text-slate-800 dark:text-white font-mono" style={{ direction: 'ltr' }}>
                              {(paperW_mm / 10).toFixed(1)} cm × {(paperH_mm / 10).toFixed(1)} cm
                            </span>
                          </div>

                          <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex items-start gap-1 text-[9px] sm:text-[10px] leading-relaxed text-right font-sans">
                            {isOverflowing ? (
                              <>
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <span className="text-amber-700 dark:text-amber-400 font-black">
                                  سایز نقشه از ابعاد کاغذ انتخابی فراتر می‌رود. پیشنهاد می‌شود کاغذ را به A3 ارتقا داده یا مقیاس ۱:۲۰۰ انتخاب کنید.
                                </span>
                              </>
                            ) : pdfScaleMode === 'precise' ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                  سازگار با کاغذ. هر ۱۰۰cm طول فیزیکی لوله روی کاغذ دقیقاً {(pdfPreciseScale === '1:100' ? '۱' : pdfPreciseScale === '1:50' ? '۲' : '0.5')} سانتی‌متر چاپ خواهد شد.
                                </span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                <span className="text-indigo-700 dark:text-indigo-400 font-bold">
                                  نقشه متناسب با ابعاد کاغذ چاپ بزرگنمایی و تنظیم می‌شود.
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()}


                    {/* Printer setup instruction note - Hidden on small screen viewports for extra space saving */}
                    <div className="hidden sm:block bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/20 rounded-xl p-2.5 text-[10px] leading-relaxed text-amber-800 dark:text-amber-300 text-right">
                      <span className="font-extrabold block mb-0.5">💡 راهنمای کالیبراسیون چاپگر:</span>
                      برای رعایت دقیق مقیاس خط‌کشی، حتماً هنگام چاپ فایل PDF، گزینه <span className="underline font-black">Actual Size (بدون تغییر مقیاس / ۱۰۰٪)</span> را در چاپگر فعال کنید.
                    </div>
                  </div>

                  <div className="flex gap-2.5 mt-1 sm:mt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsPDFSettingsOpen(false);
                        // small delay to let modal fade out then capture target correctly
                        setTimeout(async () => {
                          await handleExportPDF();
                        }, 250);
                      }}
                      className="flex-1 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-lg shadow-indigo-600/20"
                    >
                      <FileText className="w-4 h-4" />
                      <span>تولید و خروجی نهایی PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPDFSettingsOpen(false)}
                      className="px-4 py-2.5 sm:py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 hover:dark:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-350 text-xs font-black rounded-xl sm:rounded-2xl cursor-pointer transition-all"
                    >
                      بستن
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Custom Safe Deletion Confirmation Dialog Overlay (bypasses iframe block restrictions) */}
          {deleteConfirmationId && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in animate-duration-150" style={{ direction: 'rtl' }}>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4 relative animate-scale-up text-right">
                <div className="flex items-center gap-2.5 mb-1 text-rose-600 dark:text-rose-400">
                  <div className="bg-rose-100 dark:bg-rose-950/40 p-2 rounded-xl shrink-0">
                    <Trash2 className="w-5 h-5 animate-bounce" />
                  </div>
                  <h3 className="font-black text-sm text-slate-800 dark:text-slate-100">تایید حذف لوله‌کشی</h3>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-bold">
                  {(() => {
                    const sToDelete = segments.find(s => s.id === deleteConfirmationId);
                    if (!sToDelete) return '';
                    if (sToDelete.parentId === null && segments.filter(x => x.parentId === null).length <= 1) {
                      return 'شما در حال حذف تنها نقطه شروع هستید. آیا مایل به حذف کامل لوله‌ها هستید؟';
                    }
                    const directChildren = segments.filter(c => c.parentId === deleteConfirmationId);
                    return directChildren.length > 0
                      ? `آیا مایل به حذف لوله «${sToDelete.name}» هستید؟ پس از حذف، خطوط فرعی متصل به آن حفظ شده و به لوله ماقبل متصل می‌شوند.`
                      : `آیا مایل به حذف لوله «${sToDelete.name}» هستید؟`;
                  })()}
                </p>

                <div className="flex gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (deleteConfirmationId) {
                        const idToDelete = deleteConfirmationId;
                        const sToDelete = segments.find(s => s.id === idToDelete);
                        if (sToDelete) {
                          if (sToDelete.parentId === null && segments.filter(x => x.parentId === null).length <= 1) {
                            changeSegments([]);
                            setSelectedSegmentId(null);
                            setIsEditingSegment(false);
                          } else {
                            const parentIdOfDeleted = sToDelete.parentId;
                            changeSegments(prev => prev
                              .filter(x => x.id !== idToDelete)
                              .map(x => x.parentId === idToDelete ? { ...x, parentId: parentIdOfDeleted } : x)
                            );
                            setSelectedSegmentId(null);
                            setIsEditingSegment(false);
                            setTimeout(() => handleAutoFit(), 100);
                          }
                        }
                        setDeleteConfirmationId(null);
                      }
                    }}
                    className="flex-1 py-2 sm:py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black rounded-xl cursor-pointer transition-all shadow-lg shadow-rose-600/10"
                  >
                    بله، حذف شود
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmationId(null)}
                    className="px-4 py-2 sm:py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 hover:dark:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-350 text-xs font-black rounded-xl cursor-pointer transition-all"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Bill of Materials Table (متره مصالح لوله‌کشی) */}
          {viewMode === 'isometric' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="bg-green-100 dark:bg-green-950/30 p-2 rounded-xl">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="font-black text-sm text-slate-800 dark:text-slate-100">لیست برآورد و متره مصالح (BOM)</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">{bom.connections} اتصال فعال</span>
                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                    title="دانلود لیست برآورد مصالح در قالب فایل اکسل CSV"
                  >
                    <Download className="w-3 h-3" />
                    <span>اکسل متره (CSV)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Pipe Length totals list classification */}
                <div className="bg-slate-50/70 dark:bg-slate-950/45 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase mb-3 block">متراژ و آمار کل لوله‌کشی</h4>
                    
                    {/* Separate summary metrics section */}
                    <div className="grid grid-cols-2 gap-2.5 mb-4 pb-4 border-b border-dashed border-slate-200 dark:border-slate-800">
                      <div className="bg-white/85 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2.5 rounded-xl text-center">
                        <span className="text-[9px] text-slate-450 dark:text-slate-505 font-bold block">کل متراژ لوله‌کشی</span>
                        <span className="text-sm font-black text-blue-600 dark:text-blue-400 block mt-0.5">{bom.totalPipeLength} متر</span>
                      </div>
                      <div className="bg-white/85 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2.5 rounded-xl text-center">
                        <span className="text-[9px] text-slate-450 dark:text-slate-505 font-bold block">طولانی‌ترین مسیر (بحرانی)</span>
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 block mt-0.5">{bom.longestPathLength} متر</span>
                      </div>
                    </div>

                    <h5 className="text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2">تفکیک لوله‌ها بر اساس قطر نامی:</h5>
                    {bom.pipes.length === 0 ? (
                      <p className="text-xs text-slate-400 font-bold py-2">هیچ لوله‌ای ترسیم نشده است.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/85 space-y-1.5 pt-0.5">
                        {bom.pipes.map((item, idx) => (
                          <div key={`bom-pipe-${idx}`} className="flex items-center justify-between text-xs font-bold pt-2.5 first:pt-0">
                            <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                            <span className="font-mono text-slate-900 dark:text-slate-100">{Math.round(item.length * 100)} سانتی‌متر ({item.length}م)</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Fittings & Joints (زانوها، سه راهی‌ها و تبدیل‌ها) */}
                <div className="bg-slate-50/70 dark:bg-slate-950/45 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase mb-3 block">شمارش اتصالات (زانو، سه راهی، تبدیل)</h4>
                  {bom.fittings.length === 0 ? (
                    <p className="text-xs text-slate-400 font-bold py-2">اتصالی برای شاخه‌ها برآورد نشده است. شاخه‌های فرعی زاویه‌دار رسم کنید.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/85 space-y-1.5 pt-0.5">
                      {bom.fittings.map((item, idx) => (
                        <div key={`bom-fitting-${idx}`} className="flex items-center justify-between text-xs font-bold pt-2.5 first:pt-0">
                          <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                          <span className="font-mono text-slate-900 dark:text-slate-100">{item.count} عدد</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Accessories counts card list */}
                <div className="bg-slate-50/70 dark:bg-slate-950/45 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase mb-3 block">شمارش شیرآلات و مصرف‌کننده‌ها</h4>
                  {bom.accessories.length === 0 ? (
                    <p className="text-xs text-slate-400 font-bold py-2">تجهیزاتی به لوله‌ها متصل نشده است.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/85 space-y-1.5 pt-0.5">
                      {bom.accessories.map((item, idx) => (
                        <div key={`bom-acc-${idx}`} className="flex items-center justify-between text-xs font-bold pt-2.5 first:pt-0">
                          <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                          <span className="font-mono text-slate-900 dark:text-slate-100">{item.count} عدد</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: CAD Controls Workbench Panel */}
        <div className="space-y-4 font-sans">
          
          {/* Section: Architectural 2D Plan Layout Controllers (Only in Plan Mode) */}
          {viewMode === 'plan' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="bg-indigo-150/60 dark:bg-indigo-950/40 p-2 rounded-xl">
                  <Layers className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-800 dark:text-slate-100">مدیریت عناصر و الگوهای پلان ۲D</h3>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5">ترسیم نقشه پس‌زمینه لوله‌کشی</span>
                </div>
              </div>

              {/* Presets Grid */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-405 block">الگوها و پلان‌های آماده معماری:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={handleLoadPresetSquare}
                    className="py-1.5 px-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center text-slate-700 dark:text-slate-350"
                  >
                    مربع ساده
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadPresetLShape}
                    className="py-1.5 px-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center text-slate-700 dark:text-slate-350"
                  >
                    پلان L شکل
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadPresetThreeRoom}
                    className="py-1.5 px-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center text-slate-700 dark:text-slate-350"
                  >
                    ۳ خوابه بزرگ
                  </button>
                  <button
                    type="button"
                    onClick={handleClearPresets}
                    className="py-1.5 px-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-red-950/20 dark:border-red-900/40 text-[10px] font-black rounded-lg transition-all cursor-pointer text-center"
                  >
                    پاکسازی نقشه
                  </button>
                </div>
              </div>

              {/* Add Custom architectural element forms */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-405 block">افزودن دستی شیء جدید به پلان:</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={handleAddWall}
                    className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 text-slate-750 dark:text-slate-200"
                  >
                    <Plus className="w-3 h-3 text-indigo-500" />
                    <span>دیوار جدید</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddDoor}
                    className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 text-slate-750 dark:text-slate-200"
                  >
                    <Plus className="w-3 h-3 text-rose-500" />
                    <span>درب ورودی</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddWindow}
                    className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 text-slate-750 dark:text-slate-200"
                  >
                    <Plus className="w-3 h-3 text-blue-500" />
                    <span>پنجره</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddStairs}
                    className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 text-slate-750 dark:text-slate-200"
                  >
                    <Plus className="w-3 h-3 text-emerald-500" />
                    <span>پله</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddLabel}
                    className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 text-slate-750 dark:text-slate-200"
                  >
                    <Plus className="w-3 h-3 text-purple-500" />
                    <span>برچسب فضا</span>
                  </button>
                </div>
              </div>

              {/* Element Browser & Selection Switcher */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-405 block">عنصر انتخابی معماری پس‌زمینه:</label>
                {archElements.length === 0 ? (
                  <p className="text-[10px] text-slate-400 font-bold">هیچ المانی در پلان نیست. از الگوهای آماده بالا برای ایجاد نقشه خانه استفاده کنید.</p>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={selectedArchElementId || ''}
                      onChange={(e) => setSelectedArchElementId(e.target.value || null)}
                      className="flex-1 text-xs font-bold p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-950 focus:outline-none"
                    >
                      <option value="">-- تغییری اعمال نشده --</option>
                      {archElements.map(el => (
                        <option key={el.id} value={el.id}>
                          {el.name} ({el.type === 'wall' ? 'دیوار' : el.type === 'door' ? 'درب' : el.type === 'window' ? 'پنجره' : el.type === 'stairs' ? 'باکس پله' : 'عنوان فضا'})
                        </option>
                      ))}
                    </select>
                    {selectedArchElementId && (
                      <button
                        type="button"
                        onClick={() => handleDeleteArchElement(selectedArchElementId)}
                        className="p-2 text-rose-505 hover:bg-rose-100 dark:hover:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900/50 cursor-pointer"
                        title="حذف این شیء"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Interactive Resizing and Positioning Widget panel */}
              {selectedArchElementId && (() => {
                const el = archElements.find(x => x.id === selectedArchElementId);
                if (!el) return null;
                return (
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-150 dark:border-slate-800/85 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-black text-indigo-600 dark:text-indigo-400 border-b border-dashed border-slate-200 dark:border-slate-800 pb-1.5 animate-pulse">
                      <span>تنظیم اندازه و جابجایی دقیق دو بعدی</span>
                      <span className="font-extrabold uppercase font-mono bg-indigo-50 dark:bg-indigo-900/20 text-indigo-650 px-1.5 py-0.5 rounded text-[9px]">{el.type}</span>
                    </div>

                    {/* Input: Label/Name edit */}
                    <div>
                      <label className="text-[10px] font-black text-slate-450 block mb-0.5">نام المان معمارانه:</label>
                      <input
                        type="text"
                        value={el.name}
                        onChange={(e) => {
                          setArchElements(prev => prev.map(item => item.id === el.id ? { ...item, name: e.target.value } : item));
                        }}
                        className="w-full text-[11px] font-bold p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Property: X Coordinate */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-black text-slate-450 font-mono">
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
                          className="w-full h-1 bg-slate-205 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <div className="flex justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setArchElements(prev => {
                                const item = prev.find(x => x.id === el.id);
                                if (!item) return prev;
                                const updated = { ...item, x: item.x - 10 };
                                return propagateWallChanges(prev, el.id, updated);
                              });
                            }}
                            className="text-[9px] bg-white dark:bg-slate-900 border px-1 rounded-md text-slate-500 dark:text-slate-400 font-bold active:scale-95 cursor-pointer"
                          >
                            ۱۰-
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setArchElements(prev => {
                                const item = prev.find(x => x.id === el.id);
                                if (!item) return prev;
                                const updated = { ...item, x: item.x + 10 };
                                return propagateWallChanges(prev, el.id, updated);
                              });
                            }}
                            className="text-[9px] bg-white dark:bg-slate-900 border px-1 rounded-md text-slate-500 dark:text-slate-400 font-bold active:scale-95 cursor-pointer"
                          >
                            ۱۰+
                          </button>
                        </div>
                      </div>

                      {/* Property: Y Coordinate */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-black text-slate-450 font-mono">
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
                          className="w-full h-1 bg-slate-205 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <div className="flex justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setArchElements(prev => {
                                const item = prev.find(x => x.id === el.id);
                                if (!item) return prev;
                                const updated = { ...item, y: item.y - 10 };
                                return propagateWallChanges(prev, el.id, updated);
                              });
                            }}
                            className="text-[9px] bg-white dark:bg-slate-900 border px-1 rounded-md text-slate-500 dark:text-slate-400 font-bold active:scale-95 cursor-pointer"
                          >
                            ۱۰-
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setArchElements(prev => {
                                const item = prev.find(x => x.id === el.id);
                                if (!item) return prev;
                                const updated = { ...item, y: item.y + 10 };
                                return propagateWallChanges(prev, el.id, updated);
                              });
                            }}
                            className="text-[9px] bg-white dark:bg-slate-900 border px-1 rounded-md text-slate-500 dark:text-slate-400 font-bold active:scale-95 cursor-pointer"
                          >
                            ۱۰+
                          </button>
                        </div>
                      </div>

                      {/* Property: Width */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-black text-slate-450 font-mono">
                          <span>{el.width}px</span>
                          <span>طول / عرض المان</span>
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
                          className="w-full h-1 bg-slate-205 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <div className="flex justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setArchElements(prev => {
                                const item = prev.find(x => x.id === el.id);
                                if (!item) return prev;
                                const updated = { ...item, width: Math.max(5, item.width - 10) };
                                return propagateWallChanges(prev, el.id, updated);
                              });
                            }}
                            className="text-[9px] bg-white dark:bg-slate-900 border px-1 rounded-md text-slate-500 dark:text-slate-400 font-bold active:scale-95 cursor-pointer"
                          >
                            ۱۰-
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setArchElements(prev => {
                                const item = prev.find(x => x.id === el.id);
                                if (!item) return prev;
                                const updated = { ...item, width: item.width + 10 };
                                return propagateWallChanges(prev, el.id, updated);
                              });
                            }}
                            className="text-[9px] bg-white dark:bg-slate-900 border px-1 rounded-md text-slate-500 dark:text-slate-400 font-bold active:scale-95 cursor-pointer"
                          >
                            ۱۰+
                          </button>
                        </div>
                      </div>

                      {/* Property: Height */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-black text-slate-450 font-mono">
                          <span>{el.height}px</span>
                          <span>ارتفاع / ضخامت</span>
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
                          className="w-full h-1 bg-slate-205 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <div className="flex justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setArchElements(prev => {
                                const item = prev.find(x => x.id === el.id);
                                if (!item) return prev;
                                const updated = { ...item, height: Math.max(2, item.height - 2) };
                                return propagateWallChanges(prev, el.id, updated);
                              });
                            }}
                            className="text-[9px] bg-white dark:bg-slate-900 border px-1 rounded-md text-slate-500 dark:text-slate-400 font-bold active:scale-95 cursor-pointer"
                          >
                            ۲-
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setArchElements(prev => {
                                const item = prev.find(x => x.id === el.id);
                                if (!item) return prev;
                                const updated = { ...item, height: item.height + 2 };
                                return propagateWallChanges(prev, el.id, updated);
                              });
                            }}
                            className="text-[9px] bg-white dark:bg-slate-900 border px-1 rounded-md text-slate-500 dark:text-slate-400 font-bold active:scale-95 cursor-pointer"
                          >
                            ۲+
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Property: Rotation (چرخش زاویه‌ای) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-black text-slate-450 font-mono">
                        <span>{el.rotation}°</span>
                        <span>زاویه چرخش (درجه)</span>
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="range"
                          min="0"
                          max="270"
                          step="90"
                          value={el.rotation}
                          onChange={(e) => {
                            setArchElements(prev => {
                              const item = prev.find(x => x.id === el.id);
                              if (!item) return prev;
                              const updated = { ...item, rotation: parseInt(e.target.value) };
                              return propagateWallChanges(prev, el.id, updated);
                            });
                          }}
                          className="flex-1 h-1 bg-slate-205 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
                        />
                        <div className="flex gap-1">
                          {[0, 90, 180, 270].map(deg => (
                            <button
                              key={deg}
                              type="button"
                              onClick={() => {
                                setArchElements(prev => {
                                  const item = prev.find(x => x.id === el.id);
                                  if (!item) return prev;
                                  const updated = { ...item, rotation: deg };
                                  return propagateWallChanges(prev, el.id, updated);
                                });
                              }}
                              className={`text-[9.5px] p-1 px-1.5 rounded-lg border font-black active:scale-95 cursor-pointer ${el.rotation === deg ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-650'}`}
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
            </div>
          )}

          {/* Section: Save & Load custom design maps */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm space-y-4" style={{ direction: 'rtl' }}>
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="bg-emerald-100 dark:bg-emerald-950/40 p-2 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Save className="w-5 h-5" />
              </div>
              <div className="text-right">
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-100">بایگانی نقشه‌های ایزومتریک</h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5">ذخیره، نام‌گذاری و فراخوانی مجدد نقشه‌ها</span>
              </div>
            </div>

            {/* Save Map Form */}
            <form onSubmit={handleSaveCurrentMap} className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 block mb-1 text-right">ذخیره طرح فعلی با نام جدید:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mapNameInput}
                  onChange={(e) => setMapNameInput(e.target.value)}
                  placeholder="مثال: نقشه خانه ویلایی طبقه دوم"
                  className="flex-1 text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-950 focus:outline-none text-right"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                  title="ذخیره نقشه با نام وارد شده"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>ذخیره</span>
                </button>
              </div>
            </form>

            {/* Saved Maps List */}
            <div className="space-y-2 pt-1.5">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 block text-right">لیست نقشه‌های بایگانی شده:</label>
              
              {savedMaps.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80 bg-slate-55/40 text-center">
                  <p className="text-[10.5px] text-slate-400 dark:text-slate-550 leading-relaxed font-bold text-center">
                    هنوز نقشه‌ای ذخیره نشده است. با وارد کردن نام در بالا، طرح فعلی را ذخیره کنید تا بعداً بتوانید آن را فراخوانی کنید.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-0.5" style={{ direction: 'rtl' }}>
                  {savedMaps.map(map => (
                    <div
                      key={map.id}
                      className="p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 hover:bg-slate-100/60 transition-all flex items-center justify-between gap-3 text-right"
                    >
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleLoadSavedMap(map)}
                          className="font-black text-xs text-slate-805 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-right block truncate w-full"
                          title="کلیک برای بارگذاری"
                        >
                          {map.name}
                        </button>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5 text-right" style={{ direction: 'rtl' }}>
                          📅 {map.createdAt}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleLoadSavedMap(map)}
                          className="p-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/40 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                          title="فرخوانی و بارگذاری نقشه روی بورد"
                        >
                          <FolderOpen className="w-3 h-3" />
                          <span>فراخوانی</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSavedMap(map.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer active:scale-95"
                          title="حذف این نقشه از حافظه"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 1: Active Selection & Interactive Pipeline Node tree */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
            <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Sliders className="w-4.5 h-4.5 text-blue-600" />
              <span>فهرست و درگاه شاخه‌های لوله‌کشی</span>
            </h3>

            {/* List box container */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
              {computedPipeline.map(s => {
                const isSelected = s.id === selectedSegmentId;
                return (
                  <div
                    key={`seg-list-${s.id}`}
                    onClick={() => {
                      setSelectedSegmentId(s.id);
                      setIsEditingSegment(true);
                    }}
                    className={`p-3 rounded-xl border text-right cursor-pointer transition-all flex items-center justify-between gap-2.5 ${isSelected ? 'bg-indigo-50/70 border-indigo-300 dark:bg-indigo-950/20 dark:border-indigo-800/80' : 'bg-slate-50 hover:bg-slate-100 border-slate-150 dark:bg-slate-950/30 dark:border-slate-800/60'}`}
                  >
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{s.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-black">
                          قطر {s.size}
                        </span>
                        <span className="text-[9px] text-slate-400 font-black">
                          طول {s.length}م ({getDirectionLabel(s.direction)})
                        </span>
                        {s.accessory !== 'none' && (
                          <span className="text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-black">
                            {ACCESSORIES.find(x => x.value === s.accessory)?.label.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSegment(s.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer"
                      title="حذف این لوله"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Inline Contextual Form for Adding or Editing Pipeline Segment */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-4.5 h-4.5 text-indigo-600" />
                <span>{isEditingSegment ? 'ویرایش شاخه انتخاب‌شده' : 'اتصال شاخه جدید به شبکه'}</span>
              </h3>
              {isEditingSegment && (
                <button 
                  onClick={() => setIsEditingSegment(false)}
                  className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  تغییر به ثبت لوله جدید
                </button>
              )}
            </div>

            {isEditingSegment ? (
              // EDIT SEGMENT CONTEXT FORM
              <form onSubmit={handleUpdateSegment} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 block mb-1">نام یا برچسب لوله</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="مثال: انشعاب آبگرمکن طبقه اول"
                    className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-950 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 block mb-1">طول لوله (سانتی‌متر)</label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleQuickAdjustLength(-10)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[10px] font-black transition-all"
                      >
                        -۱۰ سانت
                      </button>
                      <input
                        type="text"
                        value={editLength}
                        onChange={(e) => {
                          const valStr = e.target.value;
                          setEditLength(valStr);
                          const parsedCm = parseFloat(valStr);
                          if (!isNaN(parsedCm) && parsedCm > 0) {
                            const meters = parsedCm / 100;
                            changeSegments(prev => prev.map(s => {
                              if (s.id === selectedSegmentId) {
                                return { ...s, length: meters };
                              }
                              return s;
                            }));
                          }
                        }}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fafafa] text-center dark:bg-slate-950 focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => handleQuickAdjustLength(10)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[10px] font-black transition-all"
                      >
                        +۱۰ سانت
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 block mb-1">
                      {viewMode === 'plan' ? 'جهت ترسیم (۲D)' : 'زاویه/راستا (۳D)'}
                    </label>
                    <select
                      value={editDirection}
                      onChange={(e) => setEditDirection(e.target.value as any)}
                      className="w-full text-[11px] font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-950 focus:outline-none"
                    >
                      {DIRECTIONS.map(d => (
                        <option key={d.value} value={d.value}>{getDirectionLabel(d.value)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 block mb-1">سایز نامی اسمی</label>
                    <select
                      value={editSize}
                      onChange={(e) => setEditSize(e.target.value)}
                      className="w-full text-[11px] font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-950 focus:outline-none"
                    >
                      {PIPE_SIZES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 block mb-1">تجهیز متصل (اختیاری)</label>
                    <select
                      value={editAccessory}
                      onChange={(e) => setEditAccessory(e.target.value as any)}
                      className="w-full text-[11px] font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-950 focus:outline-none"
                    >
                      {ACCESSORIES.map(a => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {editAccessory !== 'none' && (
                  <div>
                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 block mb-1">موقعیت قرارگیری تجهیز روی شاخه لوله</label>
                    <div className="grid grid-cols-2 gap-2">
                       <button
                         type="button"
                         onClick={() => setEditAccessoryPos('start')}
                         className={`py-1.5 text-[10px] font-black rounded-lg border transition-all ${editAccessoryPos === 'start' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                       >
                         قرارگیری در ابتدا (Start)
                       </button>
                       <button
                         type="button"
                         onClick={() => setEditAccessoryPos('end')}
                         className={`py-1.5 text-[10px] font-black rounded-lg border transition-all ${editAccessoryPos === 'end' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                       >
                         قرارگیری در انتها (End)
                       </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer"
                >
                  اعمال تغییرات لوله‌کشی
                </button>
              </form>
            ) : (
              // ADD NEW CODE SEGMENT FORM
              <form onSubmit={handleAddSegment} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 block mb-1">اتصال به کدام لوله فرعی وصل شود؟</label>
                  <select
                    value={newParentId}
                    onChange={(e) => setNewParentId(e.target.value)}
                    className="w-full text-[11px] font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-950 focus:outline-none"
                  >
                    {segments.map(s => (
                      <option key={s.id} value={s.id}>متصل به انتهای: {s.name} ({s.size})</option>
                    ))}
                    <option value="root">ایجاد ریشه کاملا مستقل جدید</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 block mb-1">نام/شناسه تگ شاخه</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="مثال: لوله انشعاب پکیج واحد ۲"
                    className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-950 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 block mb-1">
                      {viewMode === 'plan' ? 'جهت ترسیم (۲D)' : 'راستای زاویه ۳D'}
                    </label>
                    <select
                      value={newDirection}
                      onChange={(e) => setNewDirection(e.target.value as any)}
                      className="w-full text-[11px] font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-950 focus:outline-none"
                    >
                      {DIRECTIONS.map(d => (
                        <option key={d.value} value={d.value}>{getDirectionLabel(d.value)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 block mb-1">طول لوله (سانتی‌متر)</label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const current = parseFloat(newLength) || 0;
                          setNewLength(Math.max(10, Math.round(current - 10)).toString());
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[10px] font-black transition-all"
                      >
                        -۱۰ سانت
                      </button>
                      <input
                        type="text"
                        value={newLength}
                        onChange={(e) => setNewLength(e.target.value)}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fafafa] text-center dark:bg-slate-950 focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const current = parseFloat(newLength) || 0;
                          setNewLength(Math.max(10, Math.round(current + 10)).toString());
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[10px] font-black transition-all"
                      >
                        +۱۰ سانت
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 block mb-1">سایز نامی (اینچ)</label>
                    <select
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      className="w-full text-[11px] font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-950 focus:outline-none"
                    >
                      {PIPE_SIZES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 block mb-1">ملزومات گازی روی لوله</label>
                    <select
                      value={newAccessory}
                      onChange={(e) => setNewAccessory(e.target.value as any)}
                      className="w-full text-[11px] font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-950 focus:outline-none"
                    >
                      {ACCESSORIES.map(a => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {newAccessory !== 'none' && (
                  <div>
                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 block mb-1">موقعیت نصب تجهیز منتخب</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewAccessoryPos('start')}
                        className={`py-1.5 text-[10px] font-black rounded-lg border transition-all ${newAccessoryPos === 'start' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                      >
                        ابتدا (Start)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAccessoryPos('end')}
                        className={`py-1.5 text-[10px] font-black rounded-lg border transition-all ${newAccessoryPos === 'end' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                      >
                        انتها (End)
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت اتصال جدید و تغییرات نقشه</span>
                </button>
              </form>
            )}
          </div>

          {/* Section 3: Professional Engineering Guidelines */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 text-slate-200">
            <h4 className="font-black text-xs text-indigo-400 mb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              <span>قوانین طلایی ترسیم نقشه فنی</span>
            </h4>
            <ul className="text-[10.5px] leading-relaxed text-slate-400 space-y-1.5 pr-2 font-medium list-disc">
              <li>ترسیم لوله کشی از <b>رگولاتور/ورودی اصلی</b> آغاز می‌شود.</li>
              <li>زوایای مجاز افقی مطابق شابلون، راستاهای <b>شمال‌شرق، جنوب‌شرق، شمال‌غرب و جنوب‌غرب</b> در راستای ۳۰° ایزومتریک استاندارد هستند.</li>
              <li>لوله‌های عمودی صعودی/نزولی فقط مجاز به راستای <b>۹۰° مستقیم (UP و DOWN)</b> هستند.</li>
              <li>تغییر اندازه قطر لوله نامی از کلکتور اصلی به صورت درخت صعودی نزولی (شاخه‌ای) برای هر مصرف‌کننده قابل تنظیم است.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 🖨️ Professional Print/PDF Export Settings Dialog */}
    </div>
  );
};

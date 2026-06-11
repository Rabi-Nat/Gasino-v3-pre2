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
  RotateCcw
} from 'lucide-react';
import html2canvas from 'html2canvas';

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
  { value: 'none', label: 'بدون تجهیز (فقط لوله)' },
  { value: 'valve', label: 'شیر قطع‌کن گازی (Brass Valve)' },
  { value: 'yard_valve', label: 'شیر حیاط (RC)' },
  { value: 'meter', label: 'کنتور گاز شهری (Gas Meter)' },
  { value: 'regulator', label: 'رگولاتور تقلیل فشار (Regulator)' },
  { value: 'boiler', label: 'پکیج گرمایشی / دیگ موتورخانه (BP)' },
  { value: 'water_heater', label: 'آبگرمکن دیواری (BP)' },
  { value: 'floor_water_heater', label: 'آبگرمکن زمینی (WH)' },
  { value: 'stove', label: 'اجاق گاز پخت‌وپز (GC)' },
  { value: 'heater', label: 'بخاری گازسوز خانگی (H)' }
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

export const IsometricDesigner: React.FC = () => {
  const [segments, setSegments] = useState<PipeSegment[]>([
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
  ]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>('origin');
  const [history, setHistory] = useState<PipeSegment[][]>([]);

  // Toggleable floating select state variables for mobile
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isAccessoryDropdownOpen, setIsAccessoryDropdownOpen] = useState(false);

  // Use changeSegments instead of setSegments to auto-track history!
  const changeSegments = (updater: PipeSegment[] | ((prev: PipeSegment[]) => PipeSegment[])) => {
    setSegments(current => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      // Push copy to undo history stack
      setHistory(h => [...h, current]);
      return next;
    });
  };

  const handleUndo = () => {
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
  };
  
  // Custom user parameters for adding/editing lines
  const [newName, setNewName] = useState('انشعاب جدید مسکونی');
  const [newParentId, setNewParentId] = useState<string>('root');
  const [newDirection, setNewDirection] = useState<'NE' | 'NW' | 'SE' | 'SW' | 'UP' | 'DOWN'>('NE');
  const [newLength, setNewLength] = useState<string>("150");
  const [newSize, setNewSize] = useState<string>('1/2"');
  const [newAccessory, setNewAccessory] = useState<'none' | 'valve' | 'yard_valve' | 'meter' | 'regulator' | 'boiler' | 'water_heater' | 'floor_water_heater' | 'stove' | 'heater'>('none');
  const [newAccessoryPos, setNewAccessoryPos] = useState<'start' | 'end'>('end');

  // Interactive editing mode
  const [isEditingSegment, setIsEditingSegment] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDirection, setEditDirection] = useState<'NE' | 'NW' | 'SE' | 'SW' | 'UP' | 'DOWN'>('NE');
  const [editLength, setEditLength] = useState<string>("150");
  const [editSize, setEditSize] = useState<string>('1/2"');
  const [editAccessory, setEditAccessory] = useState<'none' | 'valve' | 'yard_valve' | 'meter' | 'regulator' | 'boiler' | 'water_heater' | 'floor_water_heater' | 'stove' | 'heater'>('none');
  const [editAccessoryPos, setEditAccessoryPos] = useState<'start' | 'end'>('end');

  // Drawing Viewport Configuration
  const [width, setWidth] = useState(700);
  const [height, setHeight] = useState(550);
  const [scale, setScale] = useState(48);
  const [offsetX, setOffsetX] = useState(300);
  const [offsetY, setOffsetY] = useState(320);
  const [showGrid, setShowGrid] = useState(true);
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

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const lastTouchTimeRef = useRef<number>(0);

  // Resize listener to adapt coordinate system sizing
  useEffect(() => {
    if (canvasContainerRef.current) {
      const containerWidth = canvasContainerRef.current.clientWidth;
      setWidth(containerWidth);
    }
    const handleResize = () => {
      if (canvasContainerRef.current) {
        setWidth(canvasContainerRef.current.clientWidth);
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
      
      const L = segment.length;
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
      
      // Standalone isometric formula relative to scale and offset
      const cos30 = 0.8660254;
      const sin30 = 0.5;
      
      const startProj = {
        x: (start.x - start.y) * cos30 * scale + offsetX,
        y: ((start.x + start.y) * sin30 - start.z) * scale + offsetY
      };
      
      const endProj = {
        x: (end.x - end.y) * cos30 * scale + offsetX,
        y: ((end.x + end.y) * sin30 - end.z) * scale + offsetY
      };
      
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
  }, [segments, scale, offsetX, offsetY]);

  // Automated layout centering and optimal scaling factor estimation
  const handleAutoFit = () => {
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
  }, [width, segments.length]);

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
    setIsDragging(false);
    if (dragDistance < 7 && interactionMode === 'draw') {
      handleCanvasClickEvent(e.clientX, e.clientY);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    lastTouchTimeRef.current = Date.now();
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setOriginalOffset({ x: offsetX, y: offsetY });
      setDragDistance(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    lastTouchTimeRef.current = Date.now();
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
    if (dragDistance < 7 && interactionMode === 'draw' && e.changedTouches.length > 0) {
      e.preventDefault(); // Stop simulated mouse event cascade
      handleCanvasClickEvent(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
  };

  // Click-to-Draw algorithm for isometric 30-degree vector generation
  const handleCanvasClickEvent = (clientX: number, clientY: number) => {
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

  // Template loaders
  const loadResidentialTemplate = () => {
    changeSegments([...residentialTemplate]);
    setSelectedSegmentId('1');
    setIsEditingSegment(false);
  };

  const loadMultiBlockTemplate = () => {
    changeSegments([...multiBlockTemplate]);
    setSelectedSegmentId('1');
    setIsEditingSegment(false);
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

    // Root node safeguard
    if (sToDelete.parentId === null && segments.filter(x => x.parentId === null).length <= 1) {
      if (window.confirm('شما در حال حذف تنها نقطه شروع هستید. آیا مایل به حذف کامل هستید؟')) {
        changeSegments([]);
        setSelectedSegmentId(null);
        setIsEditingSegment(false);
      }
      return;
    }

    // Recursively find all children IDs
    const getDescendants = (id: string): string[] => {
      let list: string[] = [];
      const children = segments.filter(c => c.parentId === id);
      children.forEach(c => {
        list.push(c.id);
        list = [...list, ...getDescendants(c.id)];
      });
      return list;
    };

    const descendants = getDescendants(idToDelete);
    const affectedCount = descendants.length;
    
    const confirmMsg = affectedCount > 0 
      ? `شما در حال حذف لوله «${sToDelete.name}» به همراه ${affectedCount} اتصال فرعی پایین‌دست آن هستید. مایل به ادامه‌اید؟`
      : `آیا مایل به حذف لوله کشی «${sToDelete.name}» هستید؟`;

    if (window.confirm(confirmMsg)) {
      changeSegments(prev => prev.filter(x => x.id !== idToDelete && !descendants.includes(x.id)));
      setSelectedSegmentId(null);
      setIsEditingSegment(false);
      setTimeout(() => handleAutoFit(), 100);
    }
  };

  // Bill of Materials Engine (متره و برآورد مصالح)
  const computeBillOfMaterials = () => {
    const pipeSummary: Record<string, number> = {};
    const accessorySummary: Record<string, number> = {};

    segments.forEach(s => {
      // Sum up pipeline length categories if length > 0
      if (s.length > 0) {
        pipeSummary[s.size] = (pipeSummary[s.size] || 0) + s.length;
      }

      // Sum up fittings/accessories counts
      if (s.accessory && s.accessory !== 'none') {
        const itemInfo = ACCESSORIES.find(x => x.value === s.accessory);
        if (itemInfo) {
          accessorySummary[itemInfo.label] = (accessorySummary[itemInfo.label] || 0) + 1;
        }
      }
    });

    return {
      pipes: Object.entries(pipeSummary).map(([size, len]) => ({ size, label: PIPE_SIZES.find(ps => ps.value === size)?.label || size, length: parseFloat(len.toFixed(2)) })),
      accessories: Object.entries(accessorySummary).map(([label, count]) => ({ label, count })),
      connections: segments.filter(s => s.length > 0).length
    };
  };

  const bom = computeBillOfMaterials();

  // Export Canvas schematic as high definition image (PNG)
  const handleExportPNG = async () => {
    const target = document.getElementById('isom-printable-area');
    if (!target) return;
    try {
      const canvasResult = await html2canvas(target, {
        backgroundColor: '#0b1329',
        scale: 2,
        useCORS: true,
        logging: false
      });
      const dataUrl = canvasResult.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'Gasino_Isometric_Scheme.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert('محدودیتی در مرورگر برای استخراج فایل خروجی وجود دارد. لطفا از نقشه اسکرین‌شات بگیرید.');
    }
  };

  // Trigger print view formatted for landscape ISO blueprinting
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 page-enter pb-14 font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-150 border border-indigo-950">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/15 rounded-full -mr-40 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-emerald-500/10 rounded-full -mb-32 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
              <ArrowUpRight className="w-7 h-7 text-indigo-300 animate-pulse" />
            </div>
            <h2 className="text-3xl font-black mb-2 tracking-tight">طراحی نقشه ایزومتریک گازرسانی</h2>
            <p className="text-blue-100/90 text-xs md:text-sm font-medium leading-relaxed max-w-2xl">
              سیستم هوشمند شبیه‌سازی سه بعدی لوله‌کشی گاز مطابق پیش‌نویس طرح ایزومتریک مبحث ۱۷ ملی ساختمان. به راحتی خطوط لوله را با زاویه ۳۰ درجه متصل کرده، شیرآلات و کنتورها را برآورد و متره نمایید.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 shrink-0 max-w-md">
            <button 
              onClick={loadResidentialTemplate}
              className="px-4 py-2 bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-100 border border-indigo-500/30 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>نمونه نمونه مسکونی</span>
            </button>
            <button 
              onClick={loadMultiBlockTemplate}
              className="px-4 py-2 bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-100 border border-indigo-500/30 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>نمونه چند واحدی پیچیده</span>
            </button>
            <button 
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-950/40 hover:bg-red-950/60 text-red-200 border border-red-500/20 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>پاکسازی کامل</span>
            </button>
          </div>
        </div>
      </div>

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
                  <h3 className="font-black text-sm text-slate-800 dark:text-slate-100">بورد پیش‌نمایش گرافیکی CAD30°</h3>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5">کشیدن موس برای جابجایی نقشه | زوم با دکمه‌ها</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 no-print flex-wrap">
                {/* Undo Button */}
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className={`p-2 rounded-xl transition-all border flex items-center gap-1.5 ${history.length > 0 ? 'bg-indigo-50/80 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 cursor-pointer hover:bg-indigo-100/80' : 'bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-50 cursor-not-allowed'}`}
                  title="بازگشت به حرکت قبل (واگرد)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black hidden sm:inline">بازگشت (Undo)</span>
                </button>
                <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5" />
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
              </div>
            </div>

            {/* Drawing Area Content */}
            <div 
              id="isom-printable-area"
              ref={canvasContainerRef}
              className="relative w-full h-[525px] overflow-hidden bg-[#070b13] cursor-grab active:cursor-grabbing select-none"
            >
              {/* Overlay Blueprint Background markings */}
              <div className="absolute top-4 right-4 text-[9px] font-mono text-slate-650 opacity-15 pointer-events-none select-none rtl" style={{ direction: 'ltr' }}>
                GASINO ISOMETRIC GRID SHEET<br />
                PROJECTION: 30-DEGREE MULTI AXIS<br />
                SCALE: 1m = {Math.round(scale)}px
              </div>
              <div className="absolute top-4 left-4 flex items-center gap-1 text-[10px] font-black text-slate-400 pointer-events-none opacity-40">
                <Move className="w-3.5 h-3.5" />
                <span>شما می‌توانید نقشه را بکشید و حرکت دهید</span>
              </div>

              {/* Touch & mouse responsive drawing vector sheet */}
              {/* Left Side Mode & Diameter Select Belt */}
              <div className="absolute left-3 top-14 flex flex-col gap-2 z-30 no-print max-w-[65px] select-none">
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
              <div className="absolute right-3 top-14 flex flex-col gap-2 z-30 no-print max-w-[65px] select-none">
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
                    <div className="absolute right-14 top-4 bg-slate-950/95 backdrop-blur-lg p-2.5 rounded-2xl border border-slate-800 shadow-2xl flex flex-col gap-1.5 min-w-[130px] z-50">
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
                style={{ contentVisibility: 'auto', touchAction: interactionMode === 'pan' ? 'none' : 'auto' }}
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
                    <circle cx="0" cy="0" r="0.9" fill="#38bdf8" opacity="0.45" />
                    <circle cx="15" cy="8.66" r="0.9" fill="#38bdf8" opacity="0.45" />
                    <circle cx="30" cy="0" r="0.9" fill="#38bdf8" opacity="0.45" />
                    <circle cx="0" cy="17.32" r="0.9" fill="#38bdf8" opacity="0.45" />
                    <circle cx="30" cy="17.32" r="0.9" fill="#38bdf8" opacity="0.45" />
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
                    <path d="M 0 2 L 10 5 L 0 8 z" fill="#fbbf24" opacity="0.85" />
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
                <g transform={`translate(${offsetX}, ${offsetY})`} stroke="#162032" strokeWidth="0.8" opacity="0.3">
                  {/* NE Axis */}
                  <line x1="0" y1="0" x2="300" y2="173.2" strokeDasharray="3,3" />
                  {/* NW Axis */}
                  <line x1="0" y1="0" x2="-300" y2="173.2" strokeDasharray="3,3" />
                  {/* Vertical Axis */}
                  <line x1="0" y1="0" x2="0" y2="-300" strokeDasharray="3,3" />
                  <circle cx="0" cy="0" r="4" fill="none" stroke="#10b981" />
                </g>

                {/* Empty State Starting reference node */}
                {segments.length === 0 && (
                  <g transform={`translate(${offsetX}, ${offsetY})`} className="animate-pulse select-none no-print">
                    {/* Glowing outer ring */}
                    <circle cx="0" cy="0" r="14" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,3" />
                    {/* Core solid center dot with white border */}
                    <circle cx="0" cy="0" r="6.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                    {/* Descriptive label box */}
                    <g transform="translate(0, 24)">
                      <rect x="-90" y="-12" width="180" height="22" rx="7" fill="#090d16" stroke="#1e293b" strokeWidth="1" opacity="0.9" />
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
                {computedPipeline.map((s, index) => {
                  const isSelected = s.id === selectedSegmentId;
                  
                  // Color codes for nominal pipe thicknesses
                  let pipeColor = '#3b82f6'; // 1" default blue shade
                  let pipeWidth = 4.5;
                  
                  if (s.size.includes('1/2')) {
                    pipeColor = '#06b6d4'; // teal
                    pipeWidth = 3.2;
                  } else if (s.size.includes('3/4')) {
                    pipeColor = '#10b981'; // emerald
                    pipeWidth = 3.9;
                  } else if (s.size.includes('1 1/4')) {
                    pipeColor = '#f59e0b'; // amber
                    pipeWidth = 5.2;
                  } else if (s.size.includes('1 1/2') || s.size.startsWith('2')) {
                    pipeColor = '#ef4444'; // red thick gas line
                    pipeWidth = 6.2;
                  }

                  if (isSelected) {
                    pipeColor = '#d946ef'; // bright fuchsia highlight
                  }

                   return (
                    <g 
                      key={`pipe-line-${s.id}`} 
                      className="transition-all duration-200"
                      onMouseEnter={() => setHoveredSegmentId(s.id)}
                      onMouseLeave={() => setHoveredSegmentId(null)}
                    >
                      
                      {/* Zero length starting origin/ref target anchor (like regulator) */}
                      {s.length === 0 && (
                        <g>
                          {/* Anchor targeting layout for the point of origin */}
                          <circle
                            cx={s.startProj.x}
                            cy={s.startProj.y}
                            r={isSelected ? "17" : "13"}
                            fill={isSelected ? "rgba(217, 70, 239, 0.15)" : "rgba(16, 185, 129, 0.12)"}
                            stroke={isSelected ? "#d946ef" : "#10b981"}
                            strokeWidth={isSelected ? "2" : "1.2"}
                            strokeDasharray={isSelected ? "none" : "3,3"}
                            className="cursor-pointer transition-all duration-300 animate-pulse"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSegmentId(s.id);
                            }}
                          />
                          <title>{s.name}</title>
                        </g>
                      )}

                      {/* Interactive thick hover cushion path layer */}
                      {s.length > 0 && (
                        <line
                          x1={s.startProj.x}
                          y1={s.startProj.y}
                          x2={s.endProj.x}
                          y2={s.endProj.y}
                          stroke="transparent"
                          strokeWidth="18"
                          strokeLinecap="round"
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSegmentId(s.id);
                          }}
                        >
                          <title>{s.name}</title>
                        </line>
                      )}

                      {/* Optional segment highlight outer ring glow */}
                      {s.length > 0 && isSelected && (
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
                      )}

                      {/* Actual steel line graphic */}
                      {s.length > 0 && (
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
                      )}

                      {/* Node connection joints */}
                      {s.length > 0 && (
                        <>
                          <circle cx={s.startProj.x} cy={s.startProj.y} r="2.5" fill="#f8fafc" opacity="0.6"/>
                          <circle cx={s.endProj.x} cy={s.endProj.y} r="2.5" fill="#f8fafc" opacity="0.6"/>
                        </>
                      )}

                      {/* 2. Parallel Inline Gas-spec Typography labels */}
                      {s.length > 0 && (() => {
                        // 1. Calculate midpoint or staggered position along the segment
                        const t = labelStagger ? (index % 2 === 0 ? 0.33 : 0.67) : 0.5;
                        const labelX = s.startProj.x + (s.endProj.x - s.startProj.x) * t;
                        const labelY = s.startProj.y + (s.endProj.y - s.startProj.y) * t;
                        
                        // Compute mathematical angle of rotation of local vector
                        let textAngle = Math.atan2(s.endProj.y - s.startProj.y, s.endProj.x - s.startProj.x) * 180 / Math.PI;
                        
                        // Limit vertical text layout flips to maintain legible read directions
                        if (textAngle > 90) textAngle -= 180;
                        if (textAngle < -90) textAngle += 180;

                        // Calculate perpendicular translation in local space
                        // SideShift: alternates between negative (above) and positive (below) the line
                        const localShiftY = labelSideShift ? (index % 2 === 0 ? -13 : 13) : -12;

                        // Scale backdrop geometry to fit font size
                        const parentSeg = computedPipeline.find(p => p.id === s.parentId);
                        let showSize = true;
                        if (parentSeg) {
                          const siblings = computedPipeline.filter(c => c.parentId === parentSeg.id);
                          if (s.size === parentSeg.size && siblings.length === 1) {
                            showSize = false;
                          }
                        }
                        const labelText = showSize ? `${s.size}:${Math.round(s.length * 100)}cm` : `${Math.round(s.length * 100)}cm`;
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
                            style={{ opacity: labelOpacity, transition: 'all 0.3s ease' }}
                            className="pointer-events-none"
                          >
                            {/* Backdrop highlight bar */}
                            <rect
                              x={rectX}
                              y={rectY}
                              width={rectWidth}
                              height={rectHeight}
                              rx="4"
                              fill="#070b13"
                              opacity="0.5"
                              stroke={isSelected ? '#d946ef' : isHovered ? '#818cf8' : 'none'}
                              strokeWidth="1"
                            />
                            
                            {/* Combined size and length metric tag */}
                            <text
                              textAnchor="middle"
                              dominantBaseline="central"
                              y="0.5"
                              fill={isSelected ? '#f5d0fe' : isHovered ? '#ffffff' : '#e2e8f0'}
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
                {computedPipeline.map((s) => {
                  return ['start', 'end'].map((pos) => {
                    const renderAccessory = pos === 'start' ? s.accessoryPosition === 'start' && s.accessory !== 'none' : s.accessoryPosition === 'end' && s.accessory !== 'none';
                    if (!renderAccessory) return null;

                    const pt = pos === 'start' ? s.startProj : s.endProj;
                    const type = s.accessory;

                    return (
                      <g key={`acc-${s.id}-${pos}`} transform={`translate(${pt.x}, ${pt.y})`} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedSegmentId(s.id); }}>
                        {/* Interactive click shield circle */}
                        <circle cx="0" cy="0" r="16" fill="transparent" />

                        {/* Rendering specific vector graphic templates based on selection */}
                        {type === 'regulator' && (
                          <g filter="url(#neon-glow)">
                            {/* Circular diaphragm bulb */}
                            <circle cx="0" cy="0" r="10" fill="#f97316" stroke="#ffffff" strokeWidth="1.2" />
                            <path d="M -10 0 L 10 0" stroke="#f8fafc" strokeWidth="1" />
                            {/* Small pressure adjustment cone */}
                            <polygon points="-4,0 4,0 0,-7" fill="#ffffff" />
                            {/* Title tag */}
                            <text y="14" fill="#f97316" fontSize="7.5" fontWeight="black" textAnchor="middle">رگولاتور</text>
                          </g>
                        )}

                        {type === 'meter' && (
                          <g filter="url(#neon-glow)">
                            {/* Main rectangular meter body outline */}
                            <rect x="-11" y="-12" width="22" height="19" rx="3" fill="#64748b" stroke="#ffffff" strokeWidth="1.3" />
                            {/* Connection pipe fittings */}
                            <line x1="-5" y1="-12" x2="-5" y2="-17" stroke="#ffffff" strokeWidth="1.5" />
                            <line x1="5" y1="-12" x2="5" y2="-17" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                            {/* Small horizontal glass panel representation for dial numbers */}
                            <rect x="-6" y="-6" width="12" height="6" fill="#f8fafc" rx="1" />
                            <rect x="-4" y="-4" width="2" height="2" fill="#ef4444" />
                            <text y="12" fill="#94a3b8" fontSize="7.5" fontWeight="black" textAnchor="middle">کنتور گاز</text>
                          </g>
                        )}

                        {type === 'valve' && (
                          <g filter="url(#neon-glow)">
                            {/* Standard 3D structural double-triangle gate symbol with stem */}
                            <polygon points="-8,-5 -8,5 0,0" fill="#fbbf24" stroke="#ffffff" strokeWidth="0.8" />
                            <polygon points="8,-5 8,5 0,0" fill="#fbbf24" stroke="#ffffff" strokeWidth="0.8" />
                            {/* Stem & Handle */}
                            <line x1="0" y1="0" x2="0" y2="-6" stroke="#ffffff" strokeWidth="1.2" />
                            <ellipse cx="0" cy="-6" rx="4.5" ry="1.5" fill="#ef4444" />
                            <text y="12" fill="#fbbf24" fontSize="7.5" fontWeight="black" textAnchor="middle">شیر قطع‌کن</text>
                          </g>
                        )}

                        {type === 'boiler' && (
                          <g filter="url(#neon-glow)">
                            <polygon points="-8,-4 -8,4 0,0" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
                            <polygon points="8,-4 8,4 0,0" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
                            <line x1="0" y1="0" x2="0" y2="-5" stroke="#ffffff" strokeWidth="1" />
                            <ellipse cx="0" cy="-5" rx="3.5" ry="1" fill="#ef4444" />
                            <text y="12" fill="#38bdf8" fontSize="8" fontWeight="black" textAnchor="middle">BP</text>
                            <text y="18.5" fill="#cbd5e1" fontSize="5.5" textAnchor="middle">پکیج</text>
                          </g>
                        )}

                        {type === 'water_heater' && (
                          <g filter="url(#neon-glow)">
                            <polygon points="-8,-4 -8,4 0,0" fill="#06b6d4" stroke="#ffffff" strokeWidth="0.8" />
                            <polygon points="8,-4 8,4 0,0" fill="#06b6d4" stroke="#ffffff" strokeWidth="0.8" />
                            <line x1="0" y1="0" x2="0" y2="-5" stroke="#ffffff" strokeWidth="1" />
                            <ellipse cx="0" cy="-5" rx="3.5" ry="1" fill="#ef4444" />
                            <text y="12" fill="#06b6d4" fontSize="8" fontWeight="black" textAnchor="middle">BP</text>
                            <text y="18.5" fill="#cbd5e1" fontSize="5.5" textAnchor="middle">آبگرمکن دیواری</text>
                          </g>
                        )}

                        {type === 'floor_water_heater' && (
                          <g filter="url(#neon-glow)">
                            <polygon points="-8,-4 -8,4 0,0" fill="#22c55e" stroke="#ffffff" strokeWidth="0.8" />
                            <polygon points="8,-4 8,4 0,0" fill="#22c55e" stroke="#ffffff" strokeWidth="0.8" />
                            <line x1="0" y1="0" x2="0" y2="-5" stroke="#ffffff" strokeWidth="1" />
                            <ellipse cx="0" cy="-5" rx="3.5" ry="1" fill="#ef4444" />
                            <text y="12" fill="#22c55e" fontSize="8" fontWeight="black" textAnchor="middle">WH</text>
                            <text y="18.5" fill="#cbd5e1" fontSize="5.5" textAnchor="middle">آبگرمکن زمینی</text>
                          </g>
                        )}

                        {type === 'yard_valve' && (
                          <g filter="url(#neon-glow)">
                            <polygon points="-8,-4 -8,4 0,0" fill="#0d9488" stroke="#ffffff" strokeWidth="0.8" />
                            <polygon points="8,-4 8,4 0,0" fill="#0d9488" stroke="#ffffff" strokeWidth="0.8" />
                            <line x1="0" y1="0" x2="0" y2="-5" stroke="#ffffff" strokeWidth="1" />
                            <ellipse cx="0" cy="-5" rx="3.5" ry="1" fill="#ef4444" />
                            <text y="12" fill="#0d9488" fontSize="8" fontWeight="black" textAnchor="middle">RC</text>
                            <text y="18.5" fill="#cbd5e1" fontSize="5.5" textAnchor="middle">شیر حیاط</text>
                          </g>
                        )}

                        {type === 'stove' && (
                          <g filter="url(#neon-glow)">
                            <polygon points="-8,-4 -8,4 0,0" fill="#fb923c" stroke="#ffffff" strokeWidth="0.8" />
                            <polygon points="8,-4 8,4 0,0" fill="#fb923c" stroke="#ffffff" strokeWidth="0.8" />
                            <line x1="0" y1="0" x2="0" y2="-5" stroke="#ffffff" strokeWidth="1" />
                            <ellipse cx="0" cy="-5" rx="3.5" ry="1" fill="#ef4444" />
                            <text y="12" fill="#fb923c" fontSize="8" fontWeight="black" textAnchor="middle">GC</text>
                            <text y="18.5" fill="#cbd5e1" fontSize="5.5" textAnchor="middle">اجاق گاز</text>
                          </g>
                        )}

                        {type === 'heater' && (
                          <g filter="url(#neon-glow)">
                            <polygon points="-8,-4 -8,4 0,0" fill="#a855f7" stroke="#ffffff" strokeWidth="0.8" />
                            <polygon points="8,-4 8,4 0,0" fill="#a855f7" stroke="#ffffff" strokeWidth="0.8" />
                            <line x1="0" y1="0" x2="0" y2="-5" stroke="#ffffff" strokeWidth="1" />
                            <ellipse cx="0" cy="-5" rx="3.5" ry="1" fill="#ef4444" />
                            <text y="12" fill="#c084fc" fontSize="8" fontWeight="black" textAnchor="middle">H</text>
                            <text y="18.5" fill="#cbd5e1" fontSize="5.5" textAnchor="middle">بخاری</text>
                          </g>
                        )}
                      </g>
                    );
                  });
                })}
              </svg>

              {/* Quick Interactive Length Editor floating on top of Canvas */}
              {selectedSegmentId && (
                (() => {
                  const selectedSeg = segments.find(s => s.id === selectedSegmentId);
                  if (!selectedSeg || selectedSeg.length === 0) return null;
                  return (
                    <div 
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

                            {/* Toggle: Hover focus mode */}
                            <div className="flex items-center justify-between gap-3 bg-slate-900/40 p-1 px-1.5 rounded-lg border border-slate-900/80">
                              <span className="text-[9px] font-bold text-slate-300">تمرکز هوشمند روی لوله</span>
                              <button
                                type="button"
                                onClick={() => setLabelHoverMode(!labelHoverMode)}
                                className={`w-7 h-3.5 rounded-full transition-colors relative cursor-pointer ${
                                  labelHoverMode ? 'bg-indigo-600' : 'bg-slate-800'
                                }`}
                                title="با نگه داشتن ماوس روی هر لوله، اطلاعات آن نمایش داده می‌شود"
                              >
                                <span className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                                  labelHoverMode ? 'translate-x-3.5' : 'translate-x-0'
                                }`} />
                              </button>
                            </div>

                            {/* Slider: Font Size */}
                            <div className="flex flex-col gap-1 border-t border-slate-900 pt-1.5">
                              <div className="flex justify-between items-center text-[8.5px] font-bold text-slate-400">
                                <span className="font-mono text-indigo-400 font-bold">{labelFontSize}px</span>
                                <span>اندازه قلم متون لوله‌ها</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button 
                                  type="button"
                                  onClick={() => setLabelFontSize(prev => Math.max(6.5, parseFloat((prev - 0.5).toFixed(1))))}
                                  className="w-4 h-4 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-[10px] rounded font-bold cursor-pointer transition-all"
                                >
                                  -
                                </button>
                                <input 
                                  type="range" 
                                  min="6.5" 
                                  max="12.5" 
                                  step="0.5" 
                                  value={labelFontSize}
                                  onChange={(e) => setLabelFontSize(parseFloat(e.target.value))}
                                  className="w-full h-1 bg-slate-800 accent-indigo-500 rounded-lg appearance-none cursor-pointer"
                                />
                                <button 
                                  type="button"
                                  onClick={() => setLabelFontSize(prev => Math.min(12.5, parseFloat((prev + 0.5).toFixed(1))))}
                                  className="w-4 h-4 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-[10px] rounded font-bold cursor-pointer transition-all"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Bottom Actions footer bar */}
            <div className="p-4 bg-slate-55 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2.5 items-center justify-between no-print">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 text-indigo-500" />
                <span>برای متمایز کردن، لوله‌ای را مستقیما از روی نقشه بالا لمس کنید.</span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleExportPNG}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دریافت نسخه تصویر (PNG)</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>چاپ فیش نقشه (Landscape)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Bill of Materials Table (متره مصالح لوله‌کشی) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="bg-green-100 dark:bg-green-950/30 p-2 rounded-xl">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-100">لیست برآورد و متره مصالح (BOM)</h3>
              </div>
              <span className="text-[10px] font-black bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">{bom.connections} اتصال فعال</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pipe Length totals list classification */}
              <div className="bg-slate-50/70 dark:bg-slate-950/45 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase mb-3 block">متراژ لوله‌ها بر اساس قطر نامی</h4>
                {bom.pipes.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold py-2">هیچ لوله‌ای ترسیم نشده است.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-805 space-y-1.5 pt-0.5">
                    {bom.pipes.map((item, idx) => (
                      <div key={`bom-pipe-${idx}`} className="flex items-center justify-between text-xs font-bold pt-2.5 first:pt-0">
                        <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                        <span className="font-mono text-slate-900 dark:text-slate-100">{Math.round(item.length * 100)} سانتی‌متر</span>
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
                  <div className="divide-y divide-slate-100 dark:divide-slate-805 space-y-1.5 pt-0.5">
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
        </div>

        {/* Right Column: CAD Controls Workbench Panel */}
        <div className="space-y-4 font-sans">
          
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
                          طول {s.length}م ({s.direction})
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
                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 block mb-1">زاویه/راستا (۳D)</label>
                    <select
                      value={editDirection}
                      onChange={(e) => setEditDirection(e.target.value as any)}
                      className="w-full text-[11px] font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-950 focus:outline-none"
                    >
                      {DIRECTIONS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
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
                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 block mb-1">راستای زاویه ۳D</label>
                    <select
                      value={newDirection}
                      onChange={(e) => setNewDirection(e.target.value as any)}
                      className="w-full text-[11px] font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-950 focus:outline-none"
                    >
                      {DIRECTIONS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
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
    </div>
  );
};

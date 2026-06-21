import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  FileText, 
  CheckCircle2,
  Check, 
  ChevronDown, 
  ChevronUp,
  Package,
  CircleDashed,
  Settings2,
  Wrench,
  Cylinder,
  CornerDownRight,
  GitFork,
  Minimize2,
  Link,
  LayoutGrid,
  Plug2,
  Droplets,
  Download,
  Share2,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getApiUrl } from '../utils';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface Product {
  id: string;
  name: string;
  unit: 'branch' | 'piece' | 'pack';
  category: 'pipe' | 'elbow' | 'tee' | 'reducer' | 'valve' | 'nipple' | 'clamp' | 'accessory';
  basePrice?: number; // Placeholder for future use
}

const PRODUCTS: Product[] = [
  // Pipes API
  { id: 'p-12-api', name: 'لوله ۱/۲ اینچ سنگین (API)', unit: 'branch', category: 'pipe' },
  { id: 'p-34-api', name: 'لوله ۳/۴ اینچ سنگین (API)', unit: 'branch', category: 'pipe' },
  { id: 'p-1-api', name: 'لوله ۱ اینچ سنگین (API)', unit: 'branch', category: 'pipe' },
  { id: 'p-114-api', name: 'لوله ۱ ۱/۴ اینچ سنگین (API)', unit: 'branch', category: 'pipe' },
  { id: 'p-112-api', name: 'لوله ۱ ۱/۲ اینچ سنگین (API)', unit: 'branch', category: 'pipe' },
  { id: 'p-2-api', name: 'لوله ۲ اینچ سنگین (API)', unit: 'branch', category: 'pipe' },
  { id: 'p-212-api', name: 'لوله ۲ ۱/۲ اینچ سنگین (API)', unit: 'branch', category: 'pipe' },
  { id: 'p-3-api', name: 'لوله ۳ اینچ سنگین (API)', unit: 'branch', category: 'pipe' },
  { id: 'p-4-api', name: 'لوله ۴ اینچ سنگین (API)', unit: 'branch', category: 'pipe' },
  
  // Pipes Seamed (درزدار)
  { id: 'p-12-sd', name: 'لوله ۱/۲ اینچ درزدار', unit: 'branch', category: 'pipe' },
  { id: 'p-34-sd', name: 'لوله ۳/۴ اینچ درزدار', unit: 'branch', category: 'pipe' },
  { id: 'p-1-sd', name: 'لوله ۱ اینچ درزدار', unit: 'branch', category: 'pipe' },
  { id: 'p-114-sd', name: 'لوله ۱ ۱/۴ اینچ درزدار', unit: 'branch', category: 'pipe' },
  { id: 'p-112-sd', name: 'لوله ۱ ۱/۲ اینچ درزدار', unit: 'branch', category: 'pipe' },
  { id: 'p-2-sd', name: 'لوله ۲ اینچ درزدار', unit: 'branch', category: 'pipe' },
  { id: 'p-212-sd', name: 'لوله ۲ ۱/۲ اینچ درزدار', unit: 'branch', category: 'pipe' },
  { id: 'p-3-sd', name: 'لوله ۳ اینچ درزدار', unit: 'branch', category: 'pipe' },
  { id: 'p-4-sd', name: 'لوله ۴ اینچ درزدار', unit: 'branch', category: 'pipe' },

  // Pipes Mannesmann (مانیسمان)
  { id: 'p-12-ms', name: 'لوله ۱/۲ اینچ مانیسمان', unit: 'branch', category: 'pipe' },
  { id: 'p-34-ms', name: 'لوله ۳/۴ اینچ مانیسمان', unit: 'branch', category: 'pipe' },
  { id: 'p-1-ms', name: 'لوله ۱ اینچ مانیسمان', unit: 'branch', category: 'pipe' },
  { id: 'p-114-ms', name: 'لوله ۱ ۱/۴ اینچ مانیسمان', unit: 'branch', category: 'pipe' },
  { id: 'p-112-ms', name: 'لوله ۱ ۱/۲ اینچ مانیسمان', unit: 'branch', category: 'pipe' },
  { id: 'p-2-ms', name: 'لوله ۲ اینچ مانیسمان', unit: 'branch', category: 'pipe' },
  { id: 'p-212-ms', name: 'لوله ۲ ۱/۲ اینچ مانیسمان', unit: 'branch', category: 'pipe' },
  { id: 'p-3-ms', name: 'لوله ۳ اینچ مانیسمان', unit: 'branch', category: 'pipe' },
  { id: 'p-4-ms', name: 'لوله ۴ اینچ مانیسمان', unit: 'branch', category: 'pipe' },

  // Elbows Maniseman (مانیسمان)
  { id: 'e-12-ms', name: 'زانو ۱/۲ اینچ مانیسمان', unit: 'piece', category: 'elbow' },
  { id: 'e-34-ms', name: 'زانو ۳/۴ اینچ مانیسمان', unit: 'piece', category: 'elbow' },
  { id: 'e-1-ms', name: 'زانو ۱ اینچ مانیسمان', unit: 'piece', category: 'elbow' },
  { id: 'e-114-ms', name: 'زانو ۱ ۱/۴ اینچ مانیسمان', unit: 'piece', category: 'elbow' },
  { id: 'e-112-ms', name: 'زانو ۱ ۱/۲ اینچ مانیسمان', unit: 'piece', category: 'elbow' },
  { id: 'e-2-ms', name: 'زانو ۲ اینچ مانیسمان', unit: 'piece', category: 'elbow' },
  { id: 'e-212-ms', name: 'زانو ۲ ۱/۲ اینچ مانیسمان', unit: 'piece', category: 'elbow' },
  { id: 'e-3-ms', name: 'زانو ۳ اینچ مانیسمان', unit: 'piece', category: 'elbow' },
  { id: 'e-4-ms', name: 'زانو ۴ اینچ مانیسمان', unit: 'piece', category: 'elbow' },
  
  // Elbows Seamed (درزدار)
  { id: 'e-12-sd-f', name: 'زانو ۱/۲ اینچ درزدار', unit: 'piece', category: 'elbow' },
  { id: 'e-34-sd-f', name: 'زانو ۳/۴ اینچ درزدار', unit: 'piece', category: 'elbow' },
  { id: 'e-1-sd-f', name: 'زانو ۱ اینچ درزدار', unit: 'piece', category: 'elbow' },
  { id: 'e-114-sd-f', name: 'زانو ۱ ۱/۴ اینچ درزدار', unit: 'piece', category: 'elbow' },
  { id: 'e-112-sd-f', name: 'زانو ۱ ۱/۲ اینچ درزدار', unit: 'piece', category: 'elbow' },
  { id: 'e-2-sd-f', name: 'زانو ۲ اینچ درزدار', unit: 'piece', category: 'elbow' },
  { id: 'e-212-sd-f', name: 'زانو ۲ ۱/۲ اینچ درزدار', unit: 'piece', category: 'elbow' },
  { id: 'e-3-sd-f', name: 'زانو ۳ اینچ درزدار', unit: 'piece', category: 'elbow' },
  { id: 'e-4-sd-f', name: 'زانو ۴ اینچ درزدار', unit: 'piece', category: 'elbow' },

  // Equal Tees (سه راهی مساوی) - Maniseman
  { id: 'te-12-ms', name: 'سه راهی مساوی ۱/۲ اینچ مانیسمان', unit: 'piece', category: 'tee' },
  { id: 'te-34-ms', name: 'سه راهی مساوی ۳/۴ اینچ مانیسمان', unit: 'piece', category: 'tee' },
  { id: 'te-1-ms', name: 'سه راهی مساوی ۱ اینچ مانیسمان', unit: 'piece', category: 'tee' },
  { id: 'te-114-ms', name: 'سه راهی مساوی ۱ ۱/۴ اینچ مانیسمان', unit: 'piece', category: 'tee' },
  { id: 'te-112-ms', name: 'سه راهی مساوی ۱ ۱/۲ اینچ مانیسمان', unit: 'piece', category: 'tee' },
  { id: 'te-2-ms', name: 'سه راهی مساوی ۲ اینچ مانیسمان', unit: 'piece', category: 'tee' },

  // Equal Tees (سه راهی مساوی) - Seamed
  { id: 'te-12-sd', name: 'سه راهی مساوی ۱/۲ اینچ درزدار', unit: 'piece', category: 'tee' },
  { id: 'te-34-sd', name: 'سه راهی مساوی ۳/۴ اینچ درزدار', unit: 'piece', category: 'tee' },
  { id: 'te-1-sd', name: 'سه راهی مساوی ۱ اینچ درزدار', unit: 'piece', category: 'tee' },
  { id: 'te-114-sd', name: 'سه راهی مساوی ۱ ۱/۴ اینچ درزدار', unit: 'piece', category: 'tee' },
  { id: 'te-112-sd', name: 'سه راهی مساوی ۱ ۱/۲ اینچ درزدار', unit: 'piece', category: 'tee' },
  { id: 'te-2-sd', name: 'سه راهی مساوی ۲ اینچ درزدار', unit: 'piece', category: 'tee' },

  // Reducing Tees (سه راهی نافی) - Maniseman
  { id: 'tr-34-12-ms', name: 'سه راهی نافی ۳/۴ در ۱/۲ مانیسمان', unit: 'piece', category: 'tee' },
  { id: 'tr-1-12-ms', name: 'سه راهی نافی ۱ در ۱/۲ مانیسمان', unit: 'piece', category: 'tee' },
  { id: 'tr-1-34-ms', name: 'سه راهی نافی ۱ در ۳/۴ مانیسمان', unit: 'piece', category: 'tee' },
  { id: 'tr-114-1-ms', name: 'سه راهی نافی ۱ ۱/۴ در ۱ مانیسمان', unit: 'piece', category: 'tee' },
  { id: 'tr-114-34-ms', name: 'سه راهی نافی ۱ ۱/۴ در ۳/۴ مانیسمان', unit: 'piece', category: 'tee' },
  { id: 'tr-114-12-ms', name: 'سه راهی نافی ۱ ۱/۴ در ۱/۲ مانیسمان', unit: 'piece', category: 'tee' },
  { id: 'tr-112-1-ms', name: 'سه راهی نافی ۱ ۱/۲ در ۱ مانیسمان', unit: 'piece', category: 'tee' },
  { id: 'tr-112-114-ms', name: 'سه راهی نافی ۱ ۱/۲ در ۱ ۱/۴ مانیسمان', unit: 'piece', category: 'tee' },
  { id: 'tr-112-34-ms', name: 'سه راهی نافی ۱ ۱/۲ در ۳/۴ مانیسمان', unit: 'piece', category: 'tee' },
  { id: 'tr-112-12-ms', name: 'سه راهی نافی ۱ ۱/۲ در ۱/۲ مانیسمان', unit: 'piece', category: 'tee' },
  { id: 'tr-2-1-ms', name: 'سه راهی نافی ۲ در ۱ مانیسمان', unit: 'piece', category: 'tee' },
  { id: 'tr-2-114-ms', name: 'سه راهی نافی ۲ در ۱ ۱/۴ مانیسمان', unit: 'piece', category: 'tee' },
  { id: 'tr-2-112-ms', name: 'سه راهی نافی ۲ در ۱ ۱/۲ مانیسمان', unit: 'piece', category: 'tee' },

  // Reducing Tees (سه راهی نافی) - Seamed
  { id: 'tr-34-12-sd-f', name: 'سه راهی نافی ۳/۴ در ۱/۲ درزدار', unit: 'piece', category: 'tee' },
  { id: 'tr-1-12-sd-f', name: 'سه راهی نافی ۱ در ۱/۲ درزدار', unit: 'piece', category: 'tee' },
  { id: 'tr-1-34-sd-f', name: 'سه راهی نافی ۱ در ۳/۴ درزدار', unit: 'piece', category: 'tee' },
  { id: 'tr-114-1-sd-f', name: 'سه راهی نافی ۱ ۱/۴ در ۱ درزدار', unit: 'piece', category: 'tee' },
  { id: 'tr-114-34-sd-f', name: 'سه راهی نافی ۱ ۱/۴ در ۳/۴ درزدار', unit: 'piece', category: 'tee' },
  { id: 'tr-114-12-sd-f', name: 'سه راهی نافی ۱ ۱/۴ در ۱/۲ درزدار', unit: 'piece', category: 'tee' },
  { id: 'tr-112-1-sd-f', name: 'سه راهی نافی ۱ ۱/۲ در ۱ درزدار', unit: 'piece', category: 'tee' },
  { id: 'tr-112-114-sd-f', name: 'سه راهی نافی ۱ ۱/۲ در ۱ ۱/۴ درزدار', unit: 'piece', category: 'tee' },
  { id: 'tr-112-34-sd-f', name: 'سه راهی نافی ۱ ۱/۲ در ۳/۴ درزدار', unit: 'piece', category: 'tee' },
  { id: 'tr-112-12-sd-f', name: 'سه راهی نافی ۱ ۱/۲ در ۱/۲ درزدار', unit: 'piece', category: 'tee' },
  { id: 'tr-2-1-sd-f', name: 'سه راهی نافی ۲ در ۱ درزدار', unit: 'piece', category: 'tee' },
  { id: 'tr-2-114-sd-f', name: 'سه راهی نافی ۲ در ۱ ۱/۴ درزدار', unit: 'piece', category: 'tee' },
  { id: 'tr-2-112-sd-f', name: 'سه راهی نافی ۲ در ۱ ۱/۲ درزدار', unit: 'piece', category: 'tee' },

  // Reducers (تبدیل) - Maniseman
  { id: 'r-34-12-ms', name: 'تبدیل ۳/۴ به ۱/۲ مانیسمان', unit: 'piece', category: 'reducer' },
  { id: 'r-1-34-ms', name: 'تبدیل ۱ به ۳/۴ مانیسمان', unit: 'piece', category: 'reducer' },
  { id: 'r-1-12-ms', name: 'تبدیل ۱ به ۱/۲ مانیسمان', unit: 'piece', category: 'reducer' },
  { id: 'r-114-1-ms', name: 'تبدیل ۱ ۱/۴ به ۱ مانیسمان', unit: 'piece', category: 'reducer' },
  { id: 'r-114-34-ms', name: 'تبدیل ۱ ۱/۴ به ۳/۴ مانیسمان', unit: 'piece', category: 'reducer' },
  { id: 'r-112-114-ms', name: 'تبدیل ۱ ۱/۲ به ۱ ۱/۴ مانیسمان', unit: 'piece', category: 'reducer' },
  { id: 'r-112-34-ms', name: 'تبدیل ۱ ۱/۲ به ۳/۴ مانیسمان', unit: 'piece', category: 'reducer' },
  { id: 'r-2-1-ms', name: 'تبدیل ۲ به ۱ مانیسمان', unit: 'piece', category: 'reducer' },
  { id: 'r-2-114-ms', name: 'تبدیل ۲ به ۱ ۱/۴ مانیسمان', unit: 'piece', category: 'reducer' },
  { id: 'r-2-112-ms', name: 'تبدیل ۲ به ۱ ۱/۲ مانیسمان', unit: 'piece', category: 'reducer' },
  { id: 'r-212-2-ms', name: 'تبدیل ۲ ۱/۲ به ۲ مانیسمان', unit: 'piece', category: 'reducer' },
  { id: 'r-3-212-ms', name: 'تبدیل ۳ به ۲ ۱/۲ مانیسمان', unit: 'piece', category: 'reducer' },
  { id: 'r-3-2-ms', name: 'تبدیل ۳ به ۲ مانیسمان', unit: 'piece', category: 'reducer' },
  { id: 'r-3-112-ms', name: 'تبدیل ۳ به ۱ ۱/۲ مانیسمان', unit: 'piece', category: 'reducer' },
  { id: 'r-4-3-ms', name: 'تبدیل ۴ به ۳ مانیسمان', unit: 'piece', category: 'reducer' },
  { id: 'r-4-212-ms', name: 'تبدیل ۴ به ۲ ۱/۲ مانیسمان', unit: 'piece', category: 'reducer' },

  // Reducers (تبدیل) - Seamed
  { id: 'r-34-12-sd', name: 'تبدیل ۳/۴ به ۱/۲ درزدار', unit: 'piece', category: 'reducer' },
  { id: 'r-1-34-sd', name: 'تبدیل ۱ به ۳/۴ درزدار', unit: 'piece', category: 'reducer' },
  { id: 'r-1-12-sd', name: 'تبدیل ۱ به ۱/۲ درزدار', unit: 'piece', category: 'reducer' },
  { id: 'r-114-1-sd', name: 'تبدیل ۱ ۱/۴ به ۱ درزدار', unit: 'piece', category: 'reducer' },
  { id: 'r-114-34-sd', name: 'تبدیل ۱ ۱/۴ به ۳/۴ درزدار', unit: 'piece', category: 'reducer' },
  { id: 'r-112-1-sd', name: 'تبدیل ۱ ۱/۲ به ۱ درزدار', unit: 'piece', category: 'reducer' },
  { id: 'r-112-34-sd', name: 'تبدیل ۱ ۱/۲ به ۳/۴ درزدار', unit: 'piece', category: 'reducer' },
  { id: 'r-2-1-sd', name: 'تبدیل ۲ به ۱ درزدار', unit: 'piece', category: 'reducer' },
  { id: 'r-2-114-sd', name: 'تبدیل ۲ به ۱ ۱/۴ درزدار', unit: 'piece', category: 'reducer' },
  { id: 'r-2-112-sd', name: 'تبدیل ۲ به ۱ ۱/۲ درزدار', unit: 'piece', category: 'reducer' },
  { id: 'r-3-212-sd', name: 'تبدیل ۳ به ۲ ۱/۲ درزدار', unit: 'piece', category: 'reducer' },
  { id: 'r-3-2-sd', name: 'تبدیل ۳ به ۲ درزدار', unit: 'piece', category: 'reducer' },
  { id: 'r-3-112-sd', name: 'تبدیل ۳ به ۱ ۱/۲ درزدار', unit: 'piece', category: 'reducer' },
  { id: 'r-4-3-sd', name: 'تبدیل ۴ به ۳ درزدار', unit: 'piece', category: 'reducer' },
  { id: 'r-4-212-sd', name: 'تبدیل ۴ به ۲ ۱/۲ درزدار', unit: 'piece', category: 'reducer' },

  // Valves
  { id: 'v-12', name: 'شیر ۱/۲ اینچ گازی', unit: 'piece', category: 'valve' },
  { id: 'v-34', name: 'شیر ۳/۴ اینچ گازی', unit: 'piece', category: 'valve' },
  { id: 'v-1', name: 'شیر ۱ اینچ گازی', unit: 'piece', category: 'valve' },
  { id: 'v-114', name: 'شیر ۱ ۱/۴ اینچ گازی', unit: 'piece', category: 'valve' },
  { id: 'v-112', name: 'شیر ۱ ۱/۲ اینچ گازی', unit: 'piece', category: 'valve' },
  { id: 'v-2', name: 'شیر ۲ اینچ گازی', unit: 'piece', category: 'valve' },
  { id: 'v-212', name: 'شیر ۲ ۱/۲ اینچ گازی', unit: 'piece', category: 'valve' },
  { id: 'v-3', name: 'شیر ۳ اینچ گازی', unit: 'piece', category: 'valve' },
  { id: 'vl-1', name: 'شیر قفلی ۱ اینچ', unit: 'piece', category: 'valve' },
  { id: 'vl-112', name: 'شیر قفلی ۱ ۱/۲ اینچ', unit: 'piece', category: 'valve' },
  { id: 'vl-2', name: 'شیر قفلی ۲ اینچ', unit: 'piece', category: 'valve' },
  { id: 'vl-212', name: 'شیر قفلی ۲ ۱/۲ اینچ', unit: 'piece', category: 'valve' },
  
  // Threaded Ends (سردنده) - Maniseman
  { id: 'ni-12-ms', name: 'سردنده ۱/۲ اینچ مانیسمان', unit: 'piece', category: 'nipple' },
  { id: 'ni-34-ms', name: 'سردنده ۳/۴ اینچ مانیسمان', unit: 'piece', category: 'nipple' },
  { id: 'ni-1-ms', name: 'سردنده ۱ اینچ مانیسمان', unit: 'piece', category: 'nipple' },
  { id: 'ni-114-ms', name: 'سردنده ۱ ۱/۴ اینچ مانیسمان', unit: 'piece', category: 'nipple' },
  { id: 'ni-112-ms', name: 'سردنده ۱ ۱/۲ اینچ مانیسمان', unit: 'piece', category: 'nipple' },
  { id: 'ni-2-ms', name: 'سردنده ۲ اینچ مانیسمان', unit: 'piece', category: 'nipple' },
  { id: 'ni-212-ms', name: 'سردنده ۲ ۱/۲ اینچ مانیسمان', unit: 'piece', category: 'nipple' },
  { id: 'ni-3-ms', name: 'سردنده ۳ اینچ مانیسمان', unit: 'piece', category: 'nipple' },
  { id: 'ni-4-ms', name: 'سردنده ۴ اینچ مانیسمان', unit: 'piece', category: 'nipple' },

  // Threaded Ends (سردنده) - Seamed
  { id: 'ni-12-sd', name: 'سردنده ۱/۲ اینچ درزدار', unit: 'piece', category: 'nipple' },
  { id: 'ni-34-sd', name: 'سردنده ۳/۴ اینچ درزدار', unit: 'piece', category: 'nipple' },
  { id: 'ni-1-sd', name: 'سردنده ۱ اینچ درزدار', unit: 'piece', category: 'nipple' },
  { id: 'ni-114-sd', name: 'سردنده ۱ ۱/۴ اینچ درزدار', unit: 'piece', category: 'nipple' },
  { id: 'ni-112-sd', name: 'سردنده ۱ ۱/۲ اینچ درزدار', unit: 'piece', category: 'nipple' },
  { id: 'ni-2-sd', name: 'سردنده ۲ اینچ درزدار', unit: 'piece', category: 'nipple' },
  { id: 'ni-212-sd', name: 'سردنده ۲ ۱/۲ اینچ درزدار', unit: 'piece', category: 'nipple' },
  { id: 'ni-3-sd', name: 'سردنده ۳ اینچ درزدار', unit: 'piece', category: 'nipple' },
  { id: 'ni-4-sd', name: 'سردنده ۴ اینچ درزدار', unit: 'piece', category: 'nipple' },

  // Clamps (بست) - Two-leg (بست دوپایه)
  { id: 'c-12-tp', name: 'بست دوپایه ۱/۲ اینچ', unit: 'piece', category: 'clamp' },
  { id: 'c-34-tp', name: 'بست دوپایه ۳/۴ اینچ', unit: 'piece', category: 'clamp' },
  { id: 'c-1-tp', name: 'بست دوپایه ۱ اینچ', unit: 'piece', category: 'clamp' },
  { id: 'c-114-tp', name: 'بست دوپایه ۱ ۱/۴ اینچ', unit: 'piece', category: 'clamp' },
  { id: 'c-112-tp', name: 'بست دوپایه ۱ ۱/۲ اینچ', unit: 'piece', category: 'clamp' },
  { id: 'c-2-tp', name: 'بست دوپایه ۲ اینچ', unit: 'piece', category: 'clamp' },
  { id: 'c-212-tp', name: 'بست دوپایه ۲ ۱/۲ اینچ', unit: 'piece', category: 'clamp' },
  { id: 'c-3-tp', name: 'بست دوپایه ۳ اینچ', unit: 'piece', category: 'clamp' },
  { id: 'c-4-tp', name: 'بست دوپایه ۴ اینچ', unit: 'piece', category: 'clamp' },

  // Clamps (بست) - Yellow (بست زرد)
  { id: 'c-12-yl', name: 'بست زرد ۱/۲ اینچ', unit: 'piece', category: 'clamp' },
  { id: 'c-34-yl', name: 'بست زرد ۳/۴ اینچ', unit: 'piece', category: 'clamp' },
  { id: 'c-1-yl', name: 'بست زرد ۱ اینچ', unit: 'piece', category: 'clamp' },
  { id: 'c-114-yl', name: 'بست زرد ۱ ۱/۴ اینچ', unit: 'piece', category: 'clamp' },
  { id: 'c-112-yl', name: 'بست زرد ۱ ۱/۲ اینچ', unit: 'piece', category: 'clamp' },
  { id: 'c-2-yl', name: 'بست زرد ۲ اینچ', unit: 'piece', category: 'clamp' },
  { id: 'c-212-yl', name: 'بست زرد ۲ ۱/۲ اینچ', unit: 'piece', category: 'clamp' },

  // Accessories (لوازم جانبی)
  { id: 'acc-1', name: 'سیم جوش', unit: 'pack', category: 'accessory' },
  { id: 'acc-2', name: 'نوار تفلون', unit: 'piece', category: 'accessory' },
  { id: 'acc-3', name: 'نوار سیتکو', unit: 'piece', category: 'accessory' },
  { id: 'acc-4', name: 'نوار پرایمر', unit: 'piece', category: 'accessory' },
  { id: 'acc-5', name: 'پرایمر مایع', unit: 'piece', category: 'accessory' },
  { id: 'acc-6', name: 'رنگ ۲۵۰گرم', unit: 'piece', category: 'accessory' },
  { id: 'acc-7', name: 'پیچ و رولپلاک (بسته ی۴۵عدد)', unit: 'pack', category: 'accessory' },
  { id: 'acc-8', name: 'صفحه پروفیل بر', unit: 'piece', category: 'accessory' },
  { id: 'acc-9', name: 'صفحه استیل بر', unit: 'piece', category: 'accessory' },
  { id: 'acc-10', name: 'مل', unit: 'piece', category: 'accessory' },
  { id: 'acc-11', name: 'لوله سفید یک متری', unit: 'piece', category: 'accessory' },
  { id: 'acc-12', name: 'لوازم کنتور (چپقی-زانو دنده ای-نیپل-مهره ماسوره)', unit: 'piece', category: 'accessory' },
  { id: 'acc-13', name: 'گیج تست فشار', unit: 'piece', category: 'accessory' },
];

interface CartItem {
  productId: string;
  quantity: number;
}

export const Store: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvoiced, setShowInvoice] = useState(false);
  const [includeApi, setIncludeApi] = useState(false);
  const [includeMannesmannPipe, setIncludeMannesmannPipe] = useState(false);
  const [includeManiseman, setIncludeManiseman] = useState(false);
  const [includeYellowClamp, setIncludeYellowClamp] = useState(false);

  // Accordion state
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => 
      prev.includes(catId) 
        ? prev.filter(id => id !== catId) 
        : [...prev, catId]
    );
  };

  const toggleProduct = (productId: string) => {
    setCart(prev => {
      const exists = prev.find(item => item.productId === productId);
      if (exists) {
        return prev.filter(item => item.productId !== productId);
      } else {
        return [...prev, { productId, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const setManualQuantity = (productId: string, val: string) => {
      const num = parseInt(val) || 0;
      setCart(prev => prev.map(item => {
          if (item.productId === productId) {
              return { ...item, quantity: num };
          }
          return item;
      }));
  };

  const filteredProducts = PRODUCTS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // If there's an active search term, show the item regardless of toggles
    if (searchTerm.trim() !== '') return true;

    // Otherwise, respect the toggles
    if (p.id.endsWith('-api') && !includeApi) return false;
    if (p.category === 'pipe' && p.id.endsWith('-ms') && !includeMannesmannPipe) return false;
    if (p.category !== 'pipe' && p.id.endsWith('-ms') && !includeManiseman) return false;
    
    // Clamp logic: Switch between Yellow and Two-leg
    if (p.category === 'clamp') {
      if (includeYellowClamp) return p.id.endsWith('-yl');
      return p.id.endsWith('-tp');
    }

    if (p.id.endsWith('-yl') && !includeYellowClamp) return false;

    return true;
  });

  interface ToggleInfo {
    label: string;
    value: boolean;
    set: (val: boolean) => void;
  }

  const categories: {
    id: string;
    label: string;
    icon: React.ComponentType<any>;
    toggleLabel?: string;
    toggleValue?: boolean;
    setToggle?: (val: boolean) => void;
    toggles?: ToggleInfo[];
  }[] = [
    { 
      id: 'pipe', 
      label: 'لوله‌ها', 
      icon: Cylinder,
      toggles: [
        {
          label: 'نمایش لوله‌های API (توکار)',
          value: includeApi,
          set: setIncludeApi
        },
        {
          label: 'نمایش لوله‌های مانیسمان',
          value: includeMannesmannPipe,
          set: setIncludeMannesmannPipe
        }
      ]
    },
    { 
      id: 'elbow', 
      label: 'زانوها', 
      icon: CornerDownRight,
      toggleLabel: 'نمایش قطعات مانیسمان (توکار)',
      toggleValue: includeManiseman,
      setToggle: setIncludeManiseman
    },
    { 
      id: 'tee', 
      label: 'سه‌راهی‌ها', 
      icon: GitFork,
      toggleLabel: 'نمایش قطعات مانیسمان (توکار)',
      toggleValue: includeManiseman,
      setToggle: setIncludeManiseman
    },
    { 
      id: 'reducer', 
      label: 'تبدیل‌ها', 
      icon: Minimize2,
      toggleLabel: 'نمایش قطعات مانیسمان (توکار)',
      toggleValue: includeManiseman,
      setToggle: setIncludeManiseman
    },
    { 
      id: 'nipple', 
      label: 'سردنده‌ها', 
      icon: Plug2,
      toggleLabel: 'نمایش قطعات مانیسمان (توکار)',
      toggleValue: includeManiseman,
      setToggle: setIncludeManiseman
    },
    { 
      id: 'clamp', 
      label: 'بست‌ها', 
      icon: Link,
      toggleLabel: 'نمایش بست زرد',
      toggleValue: includeYellowClamp,
      setToggle: setIncludeYellowClamp
    },
    { id: 'valve', label: 'شیرآلات', icon: Droplets },
    { id: 'accessory', label: 'لوازم جانبی', icon: LayoutGrid },
  ];

  const cartTotalItems = cart.length;
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setNotification({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setNotification(null);
      toastTimeoutRef.current = null;
    }, 4000);
  };
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [showSenderForm, setShowSenderForm] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'share' | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleActionWithInfo = (action: 'share') => {
    if (!senderName || !senderPhone) {
      setPendingAction(action);
      setShowSenderForm(true);
    } else {
      handleTelegramInquiry(senderName, senderPhone);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Fallback capture from form directly in case state is stale on some Android devices
    const formData = new FormData(e.currentTarget);
    const capturedName = formData.get('name') as string || senderName;
    const capturedPhone = formData.get('phone') as string || senderPhone;
    
    const cleanPhone = (capturedPhone || '').replace(/[^0-9]/g, '');

    // Validate phone number length (must be 11 digits)
    if (cleanPhone.length !== 11) {
      showToast('شماره تماس باید ۱۱ رقم باشد -و کیبورد در حالت انگلیسی باشد-', 'info');
      return;
    }

    setShowSenderForm(false);
    
    // Save current values to local variables to ensure they are captured correctly for the callback
    const currentName = capturedName;
    const currentPhone = cleanPhone;

    if (pendingAction === 'share') {
      setTimeout(() => {
        handleTelegramInquiry(currentName, currentPhone);
        setPendingAction(null);
      }, 200);
    }
  };

  const handlePrint = async () => {
    if (!invoiceRef.current || isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    showToast('در حال تولید فایل PDF...', 'info');
    
    try {
      const element = invoiceRef.current;
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      
      // Small delay to ensure layout
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(element, {
        scale: 2, // Balanced quality and performance
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: width,
        height: height,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
        scrollY: -window.scrollY, // Fix for capturing elements inside scrollable containers
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('invoice-capture-area');
          if (el) {
            el.style.boxShadow = 'none';
            el.style.border = 'none';
          }
          
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * { color-scheme: light !important; -webkit-print-color-adjust: exact; }
            .text-blue-600 { color: #2563eb !important; }
            .bg-blue-600 { background-color: #2563eb !important; }
            .text-white { color: #ffffff !important; }
            .bg-white { background-color: #ffffff !important; }
            .no-print { display: none !important; }
          `;
          clonedDoc.head.appendChild(style);

          // Force-strip any oklch color references that crash html2canvas
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach(element => {
            const htmlEl = element as HTMLElement;
            
            // 1. Remove inline styles
            if (htmlEl.style) {
              for (let i = 0; i < htmlEl.style.length; i++) {
                const prop = htmlEl.style[i];
                const value = htmlEl.style.getPropertyValue(prop);
                if (value && (value.includes('oklch') || value.includes('oklab'))) {
                   htmlEl.style.removeProperty(prop);
                }
              }
            }

            // 2. Clean up common problematic attributes
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
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add the first page
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfPageHeight;

      // Add more pages if content is longer than one page
      while (heightLeft > 0) {
        position = (heightLeft - imgHeight); // Position of the image for the next page
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfPageHeight;
      }
      
      const fileName = `gasino-invoice-${new Date().getTime()}.pdf`;

      // Optimized for Android/APK: Use Capacitor plugins if available
      if (Capacitor.isNativePlatform()) {
        const pdfBase64 = pdf.output('datauristring').split(',')[1];
        
        try {
          // Attempt to write to Documents
          let result;
          try {
            result = await Filesystem.writeFile({
              path: fileName,
              data: pdfBase64,
              directory: Directory.Documents,
            });
          } catch (writeErr) {
            // Fallback to Cache if Documents fails
            result = await Filesystem.writeFile({
              path: fileName,
              data: pdfBase64,
              directory: Directory.Cache,
            });
          }

          // Share once
          await Share.share({
            title: 'پیش‌فاکتور ملزومات گاز',
            text: 'فایل پیش‌فاکتور ملزومات گاز آماده شد.',
            url: result.uri,
            dialogTitle: 'ارسال یا ذخیره پیش‌فاکتور',
          });

          showToast('فایل با موفقیت ایجاد و آماده اشتراک‌گذاری شد');
          return;
        } catch (err) {
          console.error('Native PDF/Share Error:', err);
          showToast('ذخیره در مسیر Documents انجام شد', 'info');
          return;
        }
      }

      // Better download method for different environments (Web Fallback)
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
      
      showToast('فایل PDF با موفقیت آماده و دانلود شد');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      // Final fallback
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleTelegramInquiry = async (nameOverride?: string, phoneOverride?: string) => {
    if (isSending) return;
    
    // Force extraction and fallback for APK stability
    const finalName = (nameOverride || senderName || '').trim();
    const finalPhone = (phoneOverride || senderPhone || '').trim();
    
    const currentName = finalName !== '' ? finalName : 'نامشخص';
    const currentPhone = finalPhone !== '' ? finalPhone : 'نامشخص';
    
    setIsSending(true);
    
    const cartItems = cart.map(item => {
      const product = PRODUCTS.find(p => p.id === item.productId);
      return {
        name: product?.name || 'کالای ناشناخته',
        quantity: item.quantity,
        unit: product?.unit || 'piece'
      };
    });

    try {
      // 1. First attempt: Direct client-side sending (Useful for APK/Mobile)
      const directToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      const directChatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

      if (directToken && directChatId) {
        // Log for debugging APK environments
        console.log("APK/Direct send triggered. Name:", currentName);
        
        // Use HTML formatting for better Farsi support
        let message = `<b>🆕 استعلام قیمت جدید (ارسال مستقیم)</b>\n\n`;
        message += `👤 <b>نام:</b> ${currentName}\n`;
        message += `📞 <b>تماس:</b> ${currentPhone}\n`;
        message += `📦 <b>تعداد اقلام:</b> ${cartTotalItems}\n\n`;
        message += `<b>📋 لیست کالاها:</b>\n`;
        
        cartItems.forEach((item, index) => {
          const unitLabel = item.unit === 'branch' ? 'شاخه' : item.unit === 'pack' ? 'بسته' : 'عدد';
          message += `${index + 1}. ${item.name}: ${item.quantity} ${unitLabel}\n`;
        });

        const telegramUrl = `https://api.telegram.org/bot${directToken}/sendMessage`;
        const response = await fetch(telegramUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: JSON.stringify({
            chat_id: directChatId,
            text: message,
            parse_mode: 'HTML'
          })
        });

        const data = await response.json();
        if (data.ok) {
          showToast('استعلام شما با موفقیت ارسال شد. کارشناس فروش بزودی با شما تماس خواهد گرفت.');
          setIsSending(false);
          setShowSenderForm(false);
          return;
        } else {
          console.error("Direct send failed:", data.description);
        }
      }

      // 2. Fallback: Use server-side endpoint (for Web environments)
      const endpoint = getApiUrl('/api/inquiry');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: currentName,
          phone: currentPhone,
          cart: cartItems,
          totalItems: cart.reduce((sum, item) => sum + item.quantity, 0)
        })
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response received:", text);
        // Special diagnostic for the user
        if (text.includes("<!DOCTYPE html>")) {
          throw new Error("سرور به جای پاسخ داده، یک صفحه وب برگرداند. این معمولاً یعنی آدرس پیدا نشده یا سرور در حال ریبوت است. لطفاً چند لحظه صبر کرده و دوباره تلاش کنید.");
        }
        throw new Error("پاسخ سرور نامعتبر است. لطفاً از تنظیم بودن دقیق TELEGRAM_BOT_TOKEN و TELEGRAM_CHAT_ID در بخش Settings اطمینان حاصل کنید.");
      }

      const data = await response.json();

      if (data.success) {
        showToast('استعلام شما با موفقیت ارسال شد. کارشناس فروش بزودی با شما تماس خواهد گرفت.');
      } else {
        alert(data.message || 'خطا در ارسال استعلام.');
        handlePrint();
      }
    } catch (error: any) {
      console.error('Error sending inquiry:', error);
      alert(`خطا در ارتباط با سرور: ${error.message || 'نامشخص'}\nلطفا اتصال خود را بررسی کنید و از تنظیم بودن TOKEN و CHAT_ID در بخش Settings اطمینان حاصل کنید.`);
    } finally {
      setIsSending(false);
    }
  };

  if (showInvoiced) {
    return (
      <div className="max-w-3xl mx-auto animate-in fade-in zoom-in duration-300">
        <div id="invoice-capture-area" ref={invoiceRef} className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100">
          <div className="bg-blue-600 p-8 text-white flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black mb-1">پیش‌فاکتور ملزومات گاز</h2>
              <div className="flex flex-col gap-1">
                <p className="text-blue-100 text-sm">لیست برآوردی پروژه بر اساس استعلام کاربر</p>
                {senderName && (
                  <div className="flex items-center gap-4 mt-2 bg-white/10 p-2 rounded-lg text-xs">
                    <span>فرستنده: <span className="font-bold">{senderName}</span></span>
                    <span>شماره تماس: <span className="font-bold">{senderPhone}</span></span>
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={() => setShowInvoice(false)}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors no-print"
            >
              <Plus className="rotate-45 w-6 h-6" />
            </button>
          </div>
          
          <div className="p-8">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100 text-slate-400 text-sm">
                  <th className="py-4 font-bold">شرح کالا</th>
                  <th className="py-4 font-bold">تعداد/مقدار</th>
                  <th className="py-4 font-bold text-center">واحد</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => {
                  const product = PRODUCTS.find(p => p.id === item.productId);
                  if (!product) return null;
                  return (
                    <tr key={item.productId} className="border-b border-slate-50">
                      <td className="py-5 font-bold text-slate-700">{product.name}</td>
                      <td className="py-5 font-black text-blue-600">{item.quantity}</td>
                      <td className="py-5 text-slate-500 text-center">
                        {product.unit === 'branch' ? 'شاخه' : product.unit === 'pack' ? 'بسته' : 'عدد'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {cart.length === 0 && (
              <div className="py-20 text-center text-slate-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>لیست خالی است</p>
              </div>
            )}

            <div className="mt-12 text-slate-500 text-sm italic">
              <p>توجه: این لیست صرفاً جهت برآورد متریال بوده و فاقد ارزش قانونی برای معامله است.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 no-print px-4">
            <button 
                type="button"
                onClick={handlePrint}
                disabled={isGeneratingPDF}
                className={`w-full ${isGeneratingPDF ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-100 disabled:cursor-not-allowed`}
            >
              {isGeneratingPDF ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
              {isGeneratingPDF ? 'در حال ایجاد...' : 'ذخیره و ارسال PDF'}
            </button>
            
            <button 
                type="button"
                onClick={() => handleActionWithInfo('share')}
                disabled={isSending}
                className={`w-full ${isSending ? 'bg-slate-400' : 'bg-slate-900 hover:bg-slate-800'} text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-slate-100 disabled:cursor-not-allowed`}
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Share2 className="w-5 h-5" />
              )}
              {isSending ? 'در حال ارسال...' : 'استعلام قیمت'}
            </button>
        </div>

        {/* Notifications Toast */}
        <AnimatePresence>
          {notification && (
              <motion.div 
                  initial={{ opacity: 0, y: -50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -50, scale: 0.9 }}
                  className="fixed top-10 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md"
              >
                  <div className={`flex items-center gap-3 p-4 rounded-2xl shadow-2xl border ${
                      notification.type === 'success' 
                      ? 'bg-green-600 border-green-500 text-white' 
                      : 'bg-amber-600 border-amber-500 text-white shadow-amber-200/50'
                  }`}>
                      {notification.type === 'success' ? (
                          <div className="bg-white/20 p-1.5 rounded-full">
                              <Check className="w-5 h-5" />
                          </div>
                      ) : (
                          <div className="bg-white/20 p-1.5 rounded-full animate-pulse">
                              <Info className="w-5 h-5" />
                          </div>
                      )}
                      <p className="font-bold text-sm md:text-base leading-relaxed">
                          {notification.message}
                      </p>
                  </div>
              </motion.div>
          )}
        </AnimatePresence>

        {/* Sender Info Modal */}
        <AnimatePresence>
          {showSenderForm && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden"
              >
                <div className="bg-slate-900 p-6 text-white text-center">
                  <h3 className="text-xl font-black mb-1">اطلاعات فرستنده</h3>
                  <p className="text-slate-400 text-xs">جهت درج در ذیل پیش‌فاکتور، اطلاعات خود را وارد کنید</p>
                </div>
                {/* Sender Info Modal - Ordered: Phone first, then Name as requested */}
                <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 mr-2">شماره تماس</label>
                    <input 
                      required
                      name="phone"
                      type="tel" 
                      dir="ltr"
                      maxLength={11}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-right"
                      placeholder="09123456789"
                      value={senderPhone}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        // Check if any Persian/Arabic digits or characters are present
                        if (/[۰-۹٠-٩]/.test(rawValue)) {
                          showToast('لطفاً کیبورد را به انگلیسی تغییر دهید', 'info');
                        }
                        
                        // Strictly allow only English digits
                        const val = rawValue.replace(/[^0-9]/g, '').slice(0, 11);
                        setSenderPhone(val);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 mr-2">نام و نام خانوادگی</label>
                    <input 
                      required
                      name="name"
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-right"
                      placeholder="مثال: علی محمدی"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowSenderForm(false);
                        setPendingAction(null);
                      }}
                      className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition-colors"
                    >
                      انصراف
                    </button>
                    <button 
                      type="submit"
                      className="flex-3 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors"
                    >
                      تایید و ادامه
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-1">فروشگاه</h2>
          <p className="text-slate-500 font-medium">انتخاب لوله و اتصالات جهت استعلام قیمت و پیش‌فاکتور</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="جستجوی کالا..."
              className="bg-white border border-slate-200 rounded-2xl py-3 pr-10 pl-4 w-48 md:w-64 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Plus className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 rotate-45" />
          </div>
          
          <button 
            onClick={() => setShowInvoice(true)}
            disabled={cart.length === 0}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all
              ${cart.length > 0 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 active:scale-95' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
            `}
          >
            <FileText className="w-5 h-5" />
            <div className="flex flex-col items-start leading-tight">
              <span>پیش‌فاکتور</span>
              <span className="text-[9px] font-medium opacity-80">استعلام قیمت کلی</span>
            </div>
            {cart.length > 0 && (
              <span className="bg-white text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px] mr-1">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {categories.map((cat) => {
            const catProducts = filteredProducts.filter(p => p.category === cat.id);
            const isExpanded = expandedCategories.includes(cat.id);
            const hasToggle = !!cat.toggleLabel;
            const hasToggles = !!cat.toggles && cat.toggles.length > 0;

            if (catProducts.length === 0 && searchTerm !== '') return null;

            return (
              <div key={cat.id} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border transition-colors ${isExpanded ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-lg">{cat.label}</h3>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                        {catProducts.length} کالا
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-5 pb-5 border-t border-slate-50 pt-4">
                        {hasToggles && (
                          <div className="flex flex-wrap justify-end gap-x-4 gap-y-2 mb-4">
                            {cat.toggles?.map((t, idx) => (
                              <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative inline-flex items-center">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={t.value}
                                    onChange={(e) => t.set(e.target.checked)}
                                  />
                                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                                <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                                  {t.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}

                        {hasToggle && !hasToggles && (
                            <div className="flex justify-end mb-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative inline-flex items-center">
                                        <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={cat.toggleValue}
                                        onChange={(e) => cat.setToggle?.(e.target.checked)}
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                                        {cat.toggleLabel}
                                    </span>
                                </label>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {catProducts.map((product) => {
                            const inCart = cart.find(item => item.productId === product.id);
                            return (
                              <div 
                                key={product.id}
                                onClick={() => !inCart && toggleProduct(product.id)}
                                className={`
                                  cursor-pointer flex items-center justify-between p-4 rounded-2xl border transition-all duration-300
                                  ${inCart 
                                    ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/10' 
                                    : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-sm'}
                                `}
                              >
                                <div className="flex items-center gap-4">
                                  <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleProduct(product.id);
                                    }}
                                    className={`
                                      w-6 h-6 rounded-lg flex items-center justify-center transition-colors
                                      ${inCart ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-300'}
                                    `}
                                  >
                                    <CheckCircle2 className={`w-4 h-4 ${inCart ? 'opacity-100' : 'opacity-0'}`} />
                                  </button>
                                  <div>
                                    <p className={`font-bold text-xs ${inCart ? 'text-blue-700' : 'text-slate-700'}`}>
                                      {product.name}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                       واحد: {product.unit === 'branch' ? 'شاخه' : product.unit === 'pack' ? 'بسته' : 'تعداد'}
                                    </p>
                                  </div>
                                </div>

                                {inCart && (
                                  <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl shadow-sm border border-blue-100" onClick={e => e.stopPropagation()}>
                                    <button 
                                      onClick={() => updateQuantity(product.id, -1)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <input 
                                        type="number"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        className="w-10 text-center font-black text-sm text-slate-700 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={inCart.quantity}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setManualQuantity(product.id, val);
                                        }}
                                    />
                                    <button 
                                      onClick={() => updateQuantity(product.id, 1)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {catProducts.length === 0 && (
                            <div className="col-span-full py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center">
                              <p className="text-slate-400 text-xs font-medium">محصولی در این فیلتر یافت نشد</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Selected List - Sidebar desktop */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl sticky top-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-600 p-2 rounded-xl">
                <ShoppingCart className="text-white w-5 h-5" />
              </div>
              <h3 className="font-black text-lg">سبد استعلام</h3>
              <span className="mr-auto bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold">
                {cart.length} کالا
              </span>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar mb-6">
              {cart.map((item) => {
                const product = PRODUCTS.find(p => p.id === item.productId);
                if (!product) return null;
                return (
                  <div key={item.productId} className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                    <div>
                      <p className="font-bold text-xs text-slate-700">{product.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.quantity} {product.unit === 'branch' ? 'شاخه' : product.unit === 'pack' ? 'بسته' : 'عدد'}</p>
                    </div>
                    <button 
                      onClick={() => toggleProduct(product.id)}
                      className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {cart.length === 0 && (
                <div className="py-12 text-center">
                  <Package className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                  <p className="text-slate-400 text-xs font-medium">کالایی انتخاب نشده است</p>
                </div>
              )}
            </div>

            <button 
              disabled={cart.length === 0}
              onClick={() => setShowInvoice(true)}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-300 transition-all shadow-lg shadow-slate-100"
            >
              <FileText className="w-5 h-5" />
              <div className="flex flex-col items-center leading-tight">
                <span>مشاهده پیش‌فاکتور نهایی</span>
                <span className="text-[10px] font-medium opacity-60">استعلام قیمت کلی</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import { PipeCapacityRow, PipeSize, WorkPressure } from './types';

// Standard pipe sizes used across tables
export const PIPE_SIZES: PipeSize[] = ["1/2", "3/4", "1", "1 1/4", "1 1/2", "2", "2 1/2", "3", "4", "6"];

export const DENSITY_FACTORS = [
  { d: 0.5, f: 1.15 },
  { d: 0.55, f: 1.08 },
  { d: 0.6, f: 1.04 },
  { d: 0.65, f: 1.0 },
  { d: 0.7, f: 0.96 },
  { d: 0.75, f: 0.93 },
  { d: 0.8, f: 0.9 },
  { d: 0.85, f: 0.87 },
  { d: 0.9, f: 0.85 },
  { d: 1.0, f: 0.8 },
];

export const PRESSURE_OPTIONS = [
  { id: '0.25', label: '0.25 پوند (خانگی)', value: 0.25, tableCode: '۱۷-۳-۱' },
  { id: '2', label: '2 پوند (فولادی)', value: 2, tableCode: 'پ-۴-۴' },
  { 
    id: '2PE', 
    label: '2 پوند (پلی‌اتیلن)', 
    value: 2, 
    tableCode: 'پ-۴-۴-PE',
    sizes: ["25mm", "32mm", "63mm", "90mm", "110mm", "125mm", "160mm"] as PipeSize[]
  },
  { id: '5', label: '5 پوند (فولادی)', value: 5, tableCode: 'پ-۴-۵' },
  { id: '15', label: '15 پوند (فولادی)', value: 15, tableCode: 'پ-۴-۶' },
  { 
    id: '15PE', 
    label: '15 پوند (پلی‌اتیلن)', 
    value: 15, 
    tableCode: 'پ-۴-۶-PE',
    sizes: ["25mm", "32mm", "63mm", "90mm", "110mm", "125mm", "160mm"] as PipeSize[]
  },
  { id: '30', label: '30 پوند (فولادی)', value: 30, tableCode: 'پ-۴-۷' },
  { 
    id: '30PE', 
    label: '30 پوند (پلی‌اتیلن)', 
    value: 30, 
    tableCode: 'پ-۴-۷-PE',
    sizes: ["25mm", "32mm", "63mm", "90mm", "110mm", "125mm", "160mm"] as PipeSize[]
  },
  { id: '60', label: '60 پوند (فولادی)', value: 60, tableCode: 'پ-۴-۸' },
  { 
    id: '60PE', 
    label: '60 پوند (پلی‌اتیلن)', 
    value: 60, 
    tableCode: 'پ-۴-۸-PE',
    sizes: ["25mm", "32mm", "63mm", "90mm", "110mm", "125mm", "160mm"] as PipeSize[]
  },
];

// Household Gas Data (0.25 PSI)
// Note: Household table only goes up to 4" (index 0-8). 6" (index 9) is 0.
export const PIPE_DATA_025PSI: PipeCapacityRow[] = [
  { length: 2, capacities: [5.9, 12.3, 23.3, 47.9, 72, 138.3, 220, 380.7, 801.9, 0] },
  { length: 4, capacities: [4, 8.5, 16, 32.9, 49.4, 95.1, 151.2, 268.5, 551.1, 0] },
  { length: 6, capacities: [3.2, 6.8, 12.9, 26.4, 39.7, 76.4, 121.5, 215.7, 442.8, 0] },
  { length: 8, capacities: [2.8, 5.8, 11, 22.6, 34, 65.4, 104, 184.7, 379.1, 0] },
  { length: 10, capacities: [2.4, 5, 9.6, 19.7, 29.6, 56.9, 90.4, 160.6, 329.7, 0] },
  { length: 12, capacities: [2.2, 4.7, 8.8, 18.1, 27.3, 52.5, 83.4, 148.2, 304.3, 0] },
  { length: 14, capacities: [2, 4.3, 8.1, 16.7, 25, 48.2, 76.6, 136.1, 279.4, 0] },
  { length: 16, capacities: [1.9, 4, 7.5, 15.5, 23.3, 44.8, 71.3, 126.7, 260, 0] },
  { length: 18, capacities: [1.8, 3.7, 7.1, 14.6, 21.9, 42.2, 67.1, 119.3, 244.8, 0] },
  { length: 20, capacities: [1.7, 3.5, 6.7, 13.8, 20.7, 39.8, 63.3, 112.5, 231, 0] },
  { length: 22, capacities: [1.6, 3.3, 6.3, 13.1, 19.6, 37.8, 60.1, 106.8, 219.2, 0] },
  { length: 24, capacities: [1.5, 3.2, 6.1, 12.5, 18.7, 36.1, 57.4, 101.9, 209.2, 0] },
  { length: 26, capacities: [1.4, 3.1, 5.8, 12, 18, 34.6, 55.1, 97.9, 200.9, 0] },
  { length: 28, capacities: [1.4, 2.9, 5.5, 11.4, 17.2, 33.1, 52.6, 93.6, 191, 0] },
  { length: 30, capacities: [1.3, 2.8, 5.3, 11, 16.6, 31.9, 50.8, 90.2, 185.1, 0] },
  { length: 35, capacities: [1.2, 2.6, 4.9, 10.2, 15.3, 29.4, 46.8, 80.1, 170.6, 0] },
  { length: 40, capacities: [1.1, 2.4, 4.6, 9.4, 14.1, 27.1, 43.3, 76.9, 157.9, 0] },
  { length: 45, capacities: [1.1, 2.2, 4.3, 8.8, 13.3, 25.5, 40.6, 72.2, 148.1, 0] },
  { length: 50, capacities: [1, 2.1, 4.1, 8.4, 12.6, 24.3, 38.6, 68.7, 141, 0] },
  { length: 55, capacities: [0.99, 2, 3.9, 8, 12, 23.1, 36.7, 65.2, 133.9, 0] },
  { length: 60, capacities: [0.94, 1.9, 3.7, 7.6, 11.5, 22.1, 35.1, 62.4, 128.1, 0] },
  { length: 70, capacities: [0.85, 1.8, 3.3, 6.9, 10.4, 20, 31.8, 56.5, 116.1, 0] },
  { length: 80, capacities: [0.8, 1.6, 3.1, 6.5, 9.7, 18.8, 29.8, 53.1, 108.9, 0] },
  { length: 90, capacities: [0.75, 1.5, 2.9, 6.1, 9.1, 17.6, 28, 49.7, 102, 0] },
  { length: 100, capacities: [0.71, 1.4, 2.8, 5.7, 8.6, 16.6, 26.4, 47, 96.5, 0] },
  { length: 120, capacities: [0.64, 1.3, 2.5, 5.2, 7.8, 15, 23.9, 42.5, 87.3, 0] },
  { length: 150, capacities: [0.57, 1.2, 2.2, 4.6, 6.9, 13.3, 21.2, 37.7, 77.5, 0] },
  { length: 200, capacities: [0.49, 1, 1.9, 3.9, 5.9, 11.4, 18.1, 32.2, 66.2, 0] },
  { length: 250, capacities: [0.43, 0.91, 1.7, 3.5, 5.2, 10.1, 16.1, 28.6, 58.8, 0] },
  { length: 300, capacities: [0.39, 0.82, 1.5, 3.1, 4.7, 9.2, 14.6, 25.9, 53.2, 0] },
];

// Industrial/Medium Pressure Data (2 PSI) - Table P-4-4
// Order: 1/2", 3/4", 1", 1 1/4", 1 1/2", 2", 2 1/2", 3", 4", 6"
export const PIPE_DATA_2PSI: PipeCapacityRow[] = [
  { length: 15, capacities: [0, 16, 30, 62, 93, 180, 276, 418, 725, 1657] },
  { length: 20, capacities: [0, 11, 21, 43, 64, 124, 217, 375, 725, 1657] },
  { length: 45, capacities: [0, 9, 17, 34, 52, 99, 175, 301, 620, 1657] },
  { length: 60, capacities: [0, 8, 14, 30, 44, 85, 150, 258, 531, 1569] },
  { length: 75, capacities: [0, 7, 13, 26, 39, 75, 132, 229, 470, 1390] },
  { length: 90, capacities: [0, 6, 12, 24, 35, 68, 120, 207, 426, 1260] },
  { length: 120, capacities: [0, 5, 10, 20, 30, 58, 103, 177, 365, 1078] },
  { length: 150, capacities: [0, 4.6, 9, 18, 27, 52, 91, 157, 323, 956] },
  { length: 200, capacities: [0, 4, 7, 15, 23, 44, 78, 134, 277, 818] },
  { length: 250, capacities: [0, 3.5, 6.5, 13, 20, 39, 69, 119, 245, 725] },
  { length: 300, capacities: [0, 3.2, 6, 12, 18.5, 36, 63, 108, 222, 657] },
  { length: 350, capacities: [0, 2.9, 5.5, 11, 17, 33, 58, 99, 204, 606] },
  { length: 400, capacities: [0, 2.7, 5.1, 10.5, 15.5, 31, 54, 92, 190, 562] },
  { length: 450, capacities: [0, 2.5, 4.8, 10, 14.5, 29, 50, 87, 179, 527] },
  { length: 500, capacities: [0, 2.4, 4.5, 9.5, 14, 27, 47, 82, 169, 498] },
  { length: 550, capacities: [0, 2.3, 4.3, 9, 13.5, 26, 45, 78, 160, 473] },
  { length: 600, capacities: [0, 2.2, 4.1, 8, 13, 25, 43, 74, 153, 451] },
];

export const PIPE_DATA_2PE: PipeCapacityRow[] = [
  { length: 15, capacities: [15.9, 30.7, 178, 363, 0, 0, 0] },
  { length: 30, capacities: [10.9, 21.0, 126, 325, 543, 701, 0] },
  { length: 45, capacities: [8.7, 16.8, 101, 260, 442, 620, 1148] },
  { length: 60, capacities: [7.4, 14.3, 86, 222, 377, 530, 1019] },
  { length: 75, capacities: [6.6, 12.7, 76, 196, 334, 468, 901] },
  { length: 90, capacities: [5.9, 11.5, 69, 177, 302, 424, 815] },
  { length: 120, capacities: [5.1, 9.8, 59, 151, 258, 362, 696] },
  { length: 150, capacities: [4.5, 8.6, 52, 134, 228, 320, 616] },
  { length: 200, capacities: [3.8, 7.4, 44, 114, 195, 273, 525] },
  { length: 250, capacities: [3.4, 6.5, 39, 101, 172, 242, 465] },
  { length: 300, capacities: [3.1, 5.9, 36, 92, 156, 219, 420] },
  { length: 350, capacities: [2.8, 5.4, 33, 84, 143, 201, 386] },
  { length: 400, capacities: [2.6, 5.0, 30, 78, 133, 187, 359] },
  { length: 450, capacities: [2.5, 4.7, 28, 73, 125, 175, 336] },
  { length: 500, capacities: [2.3, 4.5, 27, 69, 118, 165, 317] },
  { length: 550, capacities: [2.2, 4.2, 25, 66, 112, 157, 301] },
  { length: 600, capacities: [2.1, 4.0, 24, 63, 106, 149, 287] },
  { length: 800, capacities: [1.8, 3.4, 20.7, 53, 91, 127, 245] },
  { length: 1000, capacities: [1.6, 3, 18, 47, 80, 113, 217] },
];

export const PIPE_DATA_15PE: PipeCapacityRow[] = [
  { length: 15, capacities: [49, 0, 0, 0, 0, 0, 0] },
  { length: 30, capacities: [45, 80, 0, 0, 0, 0, 0] },
  { length: 45, capacities: [36, 89, 0, 0, 0, 0, 0] },
  { length: 60, capacities: [31, 59, 0, 0, 0, 0, 0] },
  { length: 75, capacities: [27, 52, 311, 0, 0, 0, 0] },
  { length: 90, capacities: [24, 47, 283, 0, 0, 0, 0] },
  { length: 120, capacities: [20.9, 40, 242, 635, 0, 0, 0] },
  { length: 150, capacities: [18.5, 36, 214, 551, 948, 1225, 0] },
  { length: 200, capacities: [15.8, 30, 183, 470, 801, 994, 2006] },
  { length: 250, capacities: [13.9, 27, 162, 416, 708, 994, 1911] },
  { length: 300, capacities: [12.6, 24, 145, 376, 604, 899, 1729] },
  { length: 350, capacities: [11.6, 22, 134, 346, 588, 826, 1585] },
  { length: 400, capacities: [10.8, 20.7, 125, 321, 546, 767, 1476] },
  { length: 450, capacities: [10.1, 19.4, 116, 301, 512, 719, 1383] },
  { length: 500, capacities: [9.5, 18.3, 110, 284, 454, 679, 1306] },
  { length: 550, capacities: [9.0, 17.4, 105, 269, 459, 644, 1239] },
  { length: 600, capacities: [8.6, 16.6, 90, 257, 437, 614, 1151] },
  { length: 800, capacities: [7.4, 14.2, 85, 219, 370, 524, 1008] },
  { length: 1000, capacities: [7, 13, 75, 184, 330, 464, 892] },
];

export const PIPE_DATA_30PE: PipeCapacityRow[] = [
  { length: 15, capacities: [0, 0, 0, 0, 0, 0, 0] }, // Empty in image
  { length: 30, capacities: [73, 0, 0, 0, 0, 0, 0] },
  { length: 45, capacities: [65, 120, 0, 0, 0, 0, 0] },
  { length: 60, capacities: [56, 107, 0, 0, 0, 0, 0] },
  { length: 75, capacities: [49, 95, 0, 0, 0, 0, 0] },
  { length: 90, capacities: [45, 86, 464, 0, 0, 0, 0] },
  { length: 120, capacities: [38, 73, 441, 0, 0, 0, 0] },
  { length: 150, capacities: [34, 65, 390, 946, 0, 0, 0] },
  { length: 200, capacities: [29, 55, 333, 858, 1414, 0, 0] },
  { length: 250, capacities: [25, 49, 295, 759, 1292, 1825, 0] },
  { length: 300, capacities: [23, 44, 267, 687, 1169, 1640, 2990] },
  { length: 350, capacities: [21, 41, 245, 631, 1074, 1507, 2898] },
  { length: 400, capacities: [19.6, 38, 228, 586, 998, 1400, 2693] },
  { length: 450, capacities: [18.4, 35, 213, 549, 935, 1312, 2524] },
  { length: 500, capacities: [17.4, 33, 201, 518, 882, 1238, 2382] },
  { length: 550, capacities: [16.5, 32, 191, 492, 837, 1175, 2260] },
  { length: 600, capacities: [15.7, 30, 182, 649, 798, 1120, 2155] },
  { length: 800, capacities: [13.4, 26, 155, 400, 681, 956, 1839] },
  { length: 1000, capacities: [11.9, 23, 138, 354, 603, 846, 1627] },
];

// High Pressure Data (5 PSI) - Table P-4-5
// Order: 1/2", 3/4", 1", 1 1/4", 1 1/2", 2", 2 1/2", 3", 4", 6"
export const PIPE_DATA_5PSI: PipeCapacityRow[] = [
  { length: 15, capacities: [0, 27, 51, 93, 127, 210, 320, 486, 842, 1925] },
  { length: 30, capacities: [0, 19, 36, 75, 113, 210, 320, 486, 842, 1925] },
  { length: 45, capacities: [0, 15.5, 29, 61, 92, 180, 320, 486, 842, 1925] },
  { length: 60, capacities: [0, 13.5, 25, 53, 80, 156, 277, 484, 842, 1925] },
  { length: 75, capacities: [0, 12, 22, 47, 71, 140, 248, 433, 842, 1925] },
  { length: 90, capacities: [0, 11, 20, 43, 65, 127, 226, 395, 823, 1925] },
  { length: 120, capacities: [0, 9.5, 18, 37, 56, 110, 196, 342, 713, 1925] },
  { length: 150, capacities: [0, 8.5, 16, 33, 50, 99, 175, 306, 637, 1918] },
  { length: 200, capacities: [0, 7.5, 14, 29, 44, 85, 152, 265, 552, 1661] },
  { length: 250, capacities: [0, 6.5, 12, 26, 39, 76, 136, 237, 494, 1486] },
  { length: 300, capacities: [0, 6, 11, 24, 36, 70, 124, 216, 451, 1359] },
  { length: 350, capacities: [0, 5.5, 10.5, 22, 33, 64, 115, 200, 417, 1259] },
  { length: 400, capacities: [0, 5, 10, 21, 31, 60, 107, 187, 390, 1175] },
  { length: 450, capacities: [0, 5, 9.5, 20, 29, 57, 101, 176, 368, 1107] },
  { length: 500, capacities: [0, 4.5, 8.5, 19, 28, 54, 96, 167, 349, 1001] },
  { length: 550, capacities: [0, 4.5, 8.5, 18, 27, 51, 91, 160, 333, 1001] },
  { length: 600, capacities: [0, 4, 8, 17, 26, 49, 87, 153, 318, 959] },
];

// High Pressure Data (15 PSI) - Table P-4-6
// Order: 1/2", 3/4", 1", 1 1/4", 1 1/2", 2", 2 1/2", 3", 4", 6"
export const PIPE_DATA_15PSI: PipeCapacityRow[] = [
  { length: 15, capacities: [0, 50, 81, 140, 189, 315, 483, 733, 1272, 2906] },
  { length: 30, capacities: [0, 40, 76, 140, 191, 315, 483, 733, 1272, 2906] },
  { length: 45, capacities: [0, 33, 62, 130, 191, 315, 483, 733, 1272, 2906] },
  { length: 60, capacities: [0, 28, 54, 112, 170, 315, 483, 733, 1272, 2906] },
  { length: 75, capacities: [0, 25, 48, 100, 152, 296, 483, 733, 1272, 2906] },
  { length: 90, capacities: [0, 23, 44, 92, 139, 270, 478, 733, 1272, 2906] },
  { length: 120, capacities: [0, 20, 38, 79, 120, 234, 414, 723, 1272, 2906] },
  { length: 150, capacities: [0, 18, 34, 71, 107, 210, 370, 647, 1272, 2906] },
  { length: 200, capacities: [0, 16, 30, 61, 93, 181, 321, 560, 1167, 2906] },
  { length: 250, capacities: [0, 14, 26, 55, 83, 162, 287, 501, 1044, 2906] },
  { length: 300, capacities: [0, 13, 24, 50, 76, 148, 262, 457, 953, 2870] },
  { length: 350, capacities: [0, 12, 22, 46, 70, 137, 242, 423, 882, 2657] },
  { length: 400, capacities: [0, 11, 21, 43, 66, 128, 227, 396, 825, 2485] },
  { length: 450, capacities: [0, 10, 20, 41, 62, 121, 214, 373, 778, 2243] },
  { length: 500, capacities: [0, 10, 19, 39, 59, 115, 203, 354, 738, 2223] },
  { length: 550, capacities: [0, 9, 18, 37, 56, 109, 193, 338, 704, 2120] },
  { length: 600, capacities: [0, 9, 17, 35, 54, 105, 185, 323, 674, 2029] },
  { length: 800, capacities: [0, 8, 15, 31, 47, 91, 160, 280, 584, 1757] },
  { length: 1000, capacities: [0, 7, 13, 27, 42, 81, 143, 250, 522, 1572] },
];

// High Pressure Data (30 PSI) - Table P-4-7
// Order: 1/2", 3/4", 1", 1 1/4", 1 1/2", 2", 2 1/2", 3", 4", 6"
export const PIPE_DATA_30PSI: PipeCapacityRow[] = [
  { length: 15, capacities: [0, 75, 122, 211, 288, 474, 727, 1104, 1915, 4376] },
  { length: 30, capacities: [0, 69, 122, 211, 288, 474, 727, 1104, 1915, 4376] },
  { length: 45, capacities: [0, 57, 108, 211, 288, 474, 727, 1104, 1915, 4376] },
  { length: 60, capacities: [0, 49, 93, 194, 288, 474, 727, 1104, 1915, 4376] },
  { length: 75, capacities: [0, 44, 83, 174, 263, 474, 727, 1104, 1915, 4376] },
  { length: 90, capacities: [0, 40, 76, 158, 240, 474, 727, 1104, 1915, 4376] },
  { length: 120, capacities: [0, 35, 66, 137, 208, 405, 716, 1104, 1915, 4376] },
  { length: 150, capacities: [0, 31, 59, 123, 186, 362, 640, 1104, 1915, 4376] },
  { length: 200, capacities: [0, 27, 51, 106, 161, 314, 554, 968, 1915, 4376] },
  { length: 250, capacities: [0, 24, 46, 95, 144, 280, 496, 865, 1804, 4376] },
  { length: 300, capacities: [0, 22, 42, 87, 131, 256, 453, 790, 1647, 4376] },
  { length: 350, capacities: [0, 20, 39, 80, 122, 237, 419, 731, 1525, 4376] },
  { length: 400, capacities: [0, 19, 36, 75, 114, 222, 392, 684, 1426, 4294] },
  { length: 450, capacities: [0, 18, 34, 71, 107, 209, 369, 645, 1345, 4048] },
  { length: 500, capacities: [0, 17, 32, 67, 102, 198, 350, 612, 1276, 3841] },
  { length: 550, capacities: [0, 16, 31, 64, 97, 189, 334, 582, 1216, 3662] },
  { length: 600, capacities: [0, 15, 29, 61, 93, 181, 320, 559, 1164, 3506] },
  { length: 800, capacities: [0, 13, 25, 53, 80, 157, 277, 484, 1008, 3036] },
  { length: 1000, capacities: [0, 12, 23, 47, 72, 140, 248, 433, 902, 2716] },
];

// High Pressure Data (60 PSI) - Table P-4-8
// Order: 1/2", 3/4", 1", 1 1/4", 1 1/2", 2", 2 1/2", 3", 4", 6"
export const PIPE_DATA_60PSI: PipeCapacityRow[] = [
  { length: 15, capacities: [0, 125, 203, 352, 481, 792, 1215, 1844, 3200, 7350] },
  { length: 30, capacities: [0, 125, 203, 352, 481, 792, 1215, 1844, 3200, 7350] },
  { length: 45, capacities: [0, 103, 196, 352, 481, 792, 1215, 1844, 3200, 7350] },
  { length: 60, capacities: [0, 89, 170, 352, 481, 792, 1215, 1844, 3200, 7350] },
  { length: 75, capacities: [0, 80, 152, 316, 479, 792, 1215, 1844, 3200, 7350] },
  { length: 90, capacities: [0, 73, 139, 289, 438, 792, 1215, 1844, 3200, 7350] },
  { length: 120, capacities: [0, 63, 120, 250, 379, 738, 1215, 1844, 3200, 7350] },
  { length: 150, capacities: [0, 56, 107, 224, 339, 660, 1166, 1844, 3200, 7350] },
  { length: 200, capacities: [0, 49, 93, 194, 294, 571, 1010, 1763, 3200, 7350] },
  { length: 250, capacities: [0, 44, 83, 173, 263, 511, 903, 1577, 3000, 7350] },
  { length: 300, capacities: [0, 40, 76, 158, 240, 466, 825, 1439, 2778, 7350] },
  { length: 350, capacities: [0, 37, 70, 146, 222, 432, 763, 1333, 2598, 7350] },
  { length: 400, capacities: [0, 35, 66, 137, 208, 404, 714, 1247, 2450, 7350] },
  { length: 450, capacities: [0, 33, 62, 129, 196, 380, 673, 1175, 2324, 6998] },
  { length: 500, capacities: [0, 31, 59, 122, 186, 361, 639, 1115, 2216, 6672] },
  { length: 550, capacities: [0, 29, 56, 117, 177, 345, 609, 1063, 2122, 6388] },
  { length: 600, capacities: [0, 28, 54, 112, 169, 330, 583, 1018, 1837, 5532] },
  { length: 800, capacities: [0, 24, 47, 97, 147, 286, 505, 881, 1643, 4948] },
  { length: 1000, capacities: [0, 22, 42, 87, 131, 255, 452, 788, 1471, 4426] },
];

// PE 60 PSI Data
// Order matching image: 25mm, 32mm, 63mm, 90mm, 110mm, 125mm, 160mm
export const PIPE_DATA_60PE: PipeCapacityRow[] = [
  { length: 15, capacities: [0, 0, 0, 0, 0, 0, 0] },
  { length: 30, capacities: [116, 0, 0, 0, 0, 0, 0] },
  { length: 45, capacities: [110, 0, 0, 0, 0, 0, 0] },
  { length: 60, capacities: [109, 189, 0, 0, 0, 0, 0] },
  { length: 75, capacities: [96, 183, 0, 0, 0, 0, 0] },
  { length: 90, capacities: [87, 166, 739, 0, 0, 0, 0] },
  { length: 120, capacities: [74, 141, 702, 0, 0, 0, 0] },
  { length: 150, capacities: [65, 125, 665, 1515, 0, 0, 0] },
  { length: 200, capacities: [56, 107, 651, 1440, 0, 0, 0] },
  { length: 250, capacities: [49, 94, 575, 1410, 2266, 2922, 0] },
  { length: 300, capacities: [45, 85, 521, 1348, 2153, 2776, 0] },
  { length: 350, capacities: [41, 78, 478, 1228, 2110, 2776, 0] },
  { length: 400, capacities: [38, 73, 444, 1151, 1961, 2745, 0] },
  { length: 450, capacities: [36, 68, 416, 1078, 1883, 2573, 4787] },
  { length: 500, capacities: [34, 64, 392, 1018, 1738, 2429, 4669] },
  { length: 550, capacities: [32, 61, 373, 966, 1646, 2305, 4430] },
  { length: 600, capacities: [30, 58, 355, 921, 1569, 2197, 4224] },
  { length: 800, capacities: [26, 49, 308, 786, 1339, 1876, 3606] },
  { length: 1000, capacities: [23, 44, 268, 695, 1185, 1659, 3190] },
];

export const APPLIANCES = [
  { id: 'stove', label: 'اجاق گاز خانگی (۵ شعله)', consumption: 0.7, icon: 'Flame' },
  { id: 'boiler_wall', label: 'پکیج گرمایشی دیواری', consumption: 2.5, icon: 'Zap' },
  { id: 'heater_water_instant', label: 'آبگرمکن دیواری فوری', consumption: 2.5, icon: 'Droplets' },
  { id: 'heater_water_tank', label: 'آبگرمکن زمینی مخزندار', consumption: 1.5, icon: 'Droplets' },
  { id: 'heater', label: 'بخاری', consumption: 0.6, icon: 'Waves' },
  { id: 'workshop_heater', label: 'بخاری کارگاهی', consumption: 5, icon: 'Flame' },
  { id: 'bakery', label: 'نانوایی (هر مشعل)', consumption: 5, icon: 'Utensils' },
  { id: 'fireplace', label: 'شومینه', consumption: 0.6, icon: 'FlameKindling' },
  { id: 'rice_cooker', label: 'کباب‌پز و پلوپز خانگی', consumption: 0.3, icon: 'Utensils' },
];

export const PRESSURE_TABLES: Record<WorkPressure, PipeCapacityRow[] | null> = {
  '0.25': PIPE_DATA_025PSI,
  '2': PIPE_DATA_2PSI,
  '2PE': PIPE_DATA_2PE,
  '5': PIPE_DATA_5PSI,
  '15': PIPE_DATA_15PSI,
  '15PE': PIPE_DATA_15PE,
  '30': PIPE_DATA_30PSI,
  '30PE': PIPE_DATA_30PE,
  '60': PIPE_DATA_60PSI,
  '60PE': PIPE_DATA_60PE,
};

// --- Firefighting Constants ---

export const FIRE_HAZARD_CLASSES = [
  { id: 'light', label: 'کم‌خطر (Light Hazard)', duration: 15, sprinklerFlow: 150, hydrantFlow: 100 },
  { id: 'ordinary1', label: 'میان‌خطر ۱ (Ordinary 1)', duration: 20, sprinklerFlow: 250, hydrantFlow: 250 },
  { id: 'ordinary2', label: 'میان‌خطر ۲ (Ordinary 2)', duration: 30, sprinklerFlow: 350, hydrantFlow: 250 },
  { id: 'high', label: 'پرخطر (High Hazard)', duration: 60, sprinklerFlow: 500, hydrantFlow: 500 },
];

export const EXTINGUISHER_TYPES = [
  { id: 'abc', label: 'پودر و گاز ABC', suitable: 'جامدات، مایعات، گازها' },
  { id: 'co2', label: 'دی‌اکسید کربن CO2', suitable: 'تجهیزات الکتریکی' },
  { id: 'water', label: 'آب و گاز', suitable: 'جامدات (چوب، کاغذ)' },
  { id: 'foam', label: 'کف (Foam)', suitable: 'مایعات مشتعل' },
];


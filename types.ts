export interface PipeCapacityRow {
  length: number;
  capacities: number[]; // Corresponds to PIPE_SIZES order
}

export type PipeSize = "160mm" | "125mm" | "110mm" | "90mm" | "63mm" | "32mm" | "25mm" | "6" | "4" | "3" | "2 1/2" | "2" | "1 1/2" | "1 1/4" | "1" | "3/4" | "1/2";

export type WorkPressure = "0.25" | "2" | "2PE" | "5" | "15" | "15PE" | "30" | "30PE" | "60" | "60PE";

export interface CalculationResult {
  size: string;
  actualCapacity: number;
  lengthUsed: number;
  modifiedFlow?: number;
  densityFactor?: number;
  pressure?: string;
}
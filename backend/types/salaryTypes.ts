export interface SalaryBySeniorityLevel {
  avg: number;
  median: number;
}

export interface SalaryBySeniority {
  Intern?: SalaryBySeniorityLevel;
  Entry?: SalaryBySeniorityLevel;
  "Mid-Level"?: SalaryBySeniorityLevel;
  Senior?: SalaryBySeniorityLevel;
}

export type SalaryRange = {
    min: number;
    max: number;
    p25: number;
    p75: number;
}

export type Currency = '$' | '₱' | '€' | '¥' | '£';
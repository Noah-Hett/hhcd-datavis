// Sample data for the HHCD DataVis dashboard.
// This is illustrative seed data so the environment has something to render.
// Replace with real data sources as the project grows.

export interface MonthlyPoint {
  month: string
  visits: number
  admissions: number
  telehealth: number
}

export const monthlyActivity: MonthlyPoint[] = [
  { month: 'Jan', visits: 4200, admissions: 820, telehealth: 1100 },
  { month: 'Feb', visits: 3980, admissions: 790, telehealth: 1240 },
  { month: 'Mar', visits: 4600, admissions: 910, telehealth: 1380 },
  { month: 'Apr', visits: 4410, admissions: 870, telehealth: 1520 },
  { month: 'May', visits: 5020, admissions: 960, telehealth: 1610 },
  { month: 'Jun', visits: 5380, admissions: 1010, telehealth: 1740 },
  { month: 'Jul', visits: 5210, admissions: 980, telehealth: 1690 },
  { month: 'Aug', visits: 5590, admissions: 1050, telehealth: 1830 },
  { month: 'Sep', visits: 5860, admissions: 1120, telehealth: 1960 },
  { month: 'Oct', visits: 6120, admissions: 1180, telehealth: 2080 },
  { month: 'Nov', visits: 6340, admissions: 1210, telehealth: 2210 },
  { month: 'Dec', visits: 6780, admissions: 1290, telehealth: 2400 },
]

export interface CategoryPoint {
  name: string
  value: number
}

export const departmentMix: CategoryPoint[] = [
  { name: 'Primary Care', value: 38 },
  { name: 'Emergency', value: 22 },
  { name: 'Behavioral', value: 18 },
  { name: 'Specialty', value: 14 },
  { name: 'Pharmacy', value: 8 },
]

export const satisfaction: CategoryPoint[] = [
  { name: 'Very Satisfied', value: 46 },
  { name: 'Satisfied', value: 33 },
  { name: 'Neutral', value: 12 },
  { name: 'Unsatisfied', value: 6 },
  { name: 'Very Unsatisfied', value: 3 },
]

export interface Kpi {
  label: string
  value: string
  delta: number
  hint: string
}

export const kpis: Kpi[] = [
  { label: 'Total Visits (YTD)', value: '63.3K', delta: 12.4, hint: 'vs. previous year' },
  { label: 'Admissions', value: '12.2K', delta: 8.1, hint: 'vs. previous year' },
  { label: 'Telehealth Share', value: '35%', delta: 5.6, hint: 'of all encounters' },
  { label: 'Avg. Wait Time', value: '18 min', delta: -9.2, hint: 'vs. previous year' },
]

export const palette = ['#6366f1', '#22d3ee', '#a855f7', '#f472b6', '#f59e0b']

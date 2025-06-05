///// Static data of the month ---------------------------------------/
export const divisions = [
  {
    name: "Ajmer",
    shades: ["#d4f5db", "#b0efc1", "#8be9a7", "#88b04b", "#6e943c", "#55772e"], // Base: #88b04b
  },
  {
    name: "Bikaner",
    shades: ["#dadbee", "#b2b5d6", "#8b8fbe", "#6b5b95", "#55497a", "#3f375f"], // Base: #6b5b95
  },
  {
    name: "Jaipur",
    shades: ["#ffe1dd", "#ffb3a7", "#ff8675", "#ff6f61", "#cc594e", "#993f36"], // Base: #ff6f61
  },

  {
    name: "Jodhpur",
    shades: ["#fff2cc", "#ffe199", "#ffd066", "#ffa500", "#cc8400", "#996300"], // Base: #ffa500
  },
];
export const desiredKeyOrderForExpenditureAndEarning = [
  "targetThisMonth",
  "actualThisMonth",
  "targetYTDThisMonth",
  "actualYTDThisMonth",
  "targetCurrentFinancialYear",
  "actualThisMonthLastYear",
  "actualYTDThisMonthLastYear",
];
export const desiredKeyOrderForComparisonForExpenditureEarning = [
  "targetThisMonth",
  "actualThisMonth",
  "targetCurrentFinancialYear",
  "actualLastFinancialYear",
];
export function getDivisionColor(name: string): string | undefined {
  const division = divisions.find((div) => div.name === name);
  return division?.shades[0];
}

export const divisionsName = ["Ajmer", "Bikaner", "Jaipur", "Jodhpur"];
export const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const years = Array.from({ length: 2026 - 2000 }, (_, i) => 2000 + i);
export const sectionsForComment = [
  "Expenditure",
  "Earning",
  "Recoverable",
  "Savings_Through_IC",
  "Settlement_Cases",
  "Accounts_inspection",
  "Stock_Sheets",
  "Audit_Objections",
  "RB_HQ_Inspection",
  "Completion_Reports",
  "Suspense_Balances",
  "Dw_Recoverables",
  "Ph_Expenditure",
];
export function getLabel(metric: string): string {
  // If it contains spaces or dashes, handle accordingly
  if (/[ -]/.test(metric)) {
    return metric
      .split(/[\s-]+/) // Split on space or dash
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
      .join(" "); // Join words back with a single space
  }

  // Otherwise, convert camelCase to "Title Case"
  return metric
    .replace(/([A-Z])/g, " $1") // Add a space before each capital letter
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize the first letter
    .trim();
}

// src/utils/sheetConfig.ts
export const sheetOptions = [
  "Expenditure",
  "Earning",
  "Recoverable",
  "PerformanceIndex",
  "OriginatingEarnings",
  "PHExpenditure",
  "Dwrecoverable",
  "Suspenseregister",
  "Completionreport",
  "Stocksheet",
  "Settlementcase",
  "Savingthroughic",
  "Hrinspection",
  "Auditobjection",
  "Accountinspection",
];

// helper to display a human-friendly label
export const humanLabel = (s: string) =>
  s
    .replace(/([a-z])([A-Z])/g, "$1 $2") // camelToWords if needed
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/(\w+)/g, (w) => w[0].toUpperCase() + w.slice(1));

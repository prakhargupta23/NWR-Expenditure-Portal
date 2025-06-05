interface KeyHighlights {
  actualEarnings: string;
  targetEarnings: string;
  performanceTarget: string;
  performanceLY: string;
  recoveryVarianceTarget: string;
  recoveryVarianceLY: string;
}

interface EarningsVsTarget {
  highestEarningCategory: string;
  lowestEarningCategory: string;
  highestEarningTarget: string;
}
interface FinancialRecord {
  division?: string;
  subCategory?: string;
  planHead?: string;
  actualThisMonth?: number;
  targetThisMonth?: number;
  actualYTDThisMonth?: number;
  targetYTDThisMonth?: number;
  actualYTDThisMonthLastYear?: number;
  actualForTheMonth?: number;
  actualUpToTheMonth?: number;
  actualUpToTheMonthLastYear?: number;
  closingBalance?: number;
}

interface ExpenditureOverview {
  expenditure: Omit<FinancialRecord, "division">[];
  phExpenditure: Omit<FinancialRecord, "division">[];
}
interface suspenseBalancesAnalysis {
  suspenseTable: any[];
  totalClosingSuspense: number;
}
interface savingsThroughICAnalysis {
  savingsTable: any[];
  totalSavings: number;
}
export interface RecoverablesAnalysis {
  totalClosingDR: number;
  totalClosingBR: number;
  highestCategoryDR: string;
  highestCategoryBR: string;
  highestDRValue: number;
  highestBRValue: number;
  totalDeptWise: number;
}
interface completionReport {
  clearanceDept: string;
  closingDept: string;
  completionTable: any[];
}

interface railwayHQInspection {
  HQInspectionTable: any[];
}

interface auditObjections {
  table: any[];
}

interface stockSheet {
  clearanceDept: string;
  closingDept: string;
  stockSheetTable: any[];
}

interface accountInspection {
  accountInspectionTable: any[];
}

interface settlementCases {
  settlementCasesTable: any[];
}

interface DivisionAnalysis {
  division: string;
  keyHighlights: any;
  earningVsTarget: any;
  expenseOverview: any;
  barImage: any;

  suspenseBalancesAnalysis: suspenseBalancesAnalysis;
  completionReport: completionReport;
  railwayHQInspection: railwayHQInspection;
  auditObjections: auditObjections;
  stockSheet: stockSheet;
  accountInspection: accountInspection;
  settlementCases: settlementCases;
  savingsThroughICAnalysis: savingsThroughICAnalysis;
  recoverablesAnalysis: RecoverablesAnalysis;
}

interface Data {
  executiveSummaryData: {
    totalEarnings: number;
    totalExpenditures: number;
    earningsAchievementPercent: string;
    expenditureAchievementPercent: string;
    highestPerformer: string;
    lowestPerformer: string;
  };
  detailedAnalysis: DivisionAnalysis[];
  // summaryOfReport: summaryOfReport;
  combinedSummaryData: {
    Earnings: {
      Jaipur: number;
      Ajmer: number;
      Bikaner: number;
      Jodhpur: number;
      "Total/Avg": number;
      "Best Performing Division": string[];
      "Worst Performing Division": string[];
    };
    Expenditure: {
      Jaipur: number;
      Ajmer: number;
      Bikaner: number;
      Jodhpur: number;
      "Total/Avg": number;
      "Best Performing Division": string[];
      "Worst Performing Division": string[];
    };
    "PH Expenditure": {
      Jaipur: number;
      Ajmer: number;
      Bikaner: number;
      Jodhpur: number;
      "Total/Avg": number;
      "Best Performing Division": string[]; // usually ["- -"]
      "Worst Performing Division": string[]; // usually ["- -"]
    };
    Recoverables: {
      Jaipur: number;
      Ajmer: number;
      Bikaner: number;
      Jodhpur: number;
      "Total/Avg": number;
      "Best Performing Division": string[];
      "Worst Performing Division": string[];
    };
    "DW Recoverables": {
      Jaipur: number;
      Ajmer: number;
      Bikaner: number;
      Jodhpur: number;
      "Total/Avg": number;
      "Best Performing Division": string[];
      "Worst Performing Division": string[];
    };
    "Suspense Balances": {
      Jaipur: number;
      Ajmer: number;
      Bikaner: number;
      Jodhpur: number;
      "Total/Avg": number;
      "Best Performing Division": string[];
      "Worst Performing Division": string[];
    };
    "Settlement Cases Closed": {
      Jaipur: number;
      Ajmer: number;
      Bikaner: number;
      Jodhpur: number;
      "Total/Avg": number;
      "Best Performing Division": string[];
      "Worst Performing Division": string[];
    };
    "Savings through IC": {
      Jaipur: number;
      Ajmer: number;
      Bikaner: number;
      Jodhpur: number;
      "Total/Avg": number;
      "Best Performing Division": string[];
      "Worst Performing Division": string[];
    };
  };

  charts: {
    divisionWiseEarningsSummaryBarChart: string; // base64 image
    divisionWiseEarningsSummaryPieChart: string;
    divisionWiseExpenditureSummaryPieChart: string;
    headsWiseEarningsSummaryPieChart: string;
    recoverablesSummaryStackedChart: string;
  };

  keyTakeaways: string[]; // 4 GPT-generated insights
  summaryOfReport: string[]; // GPT-generated summary of the report
}

export interface summaryOfReport {
  summaryOfReport: any[];
}
interface ReportData {
  success: boolean;
  data: Data;
}

export type { ReportData, DivisionAnalysis };

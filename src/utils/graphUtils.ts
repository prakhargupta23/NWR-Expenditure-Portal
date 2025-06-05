const MONTH_ORDER = [
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
const parseDate = (monthYear: string): Date => {
  const parts = monthYear.split("/");
  const month = parts[0];
  const year = parts[1] ? parseInt(parts[1]) : new Date().getFullYear(); // Use current year if missing

  const monthIndex = new Date(`${month} 1, ${year}`).getMonth(); // Convert to month index
  return new Date(year, monthIndex);
};
interface TrendEntry {
  month: string;
  category: string;
  total: number;
}

// ProcessedData can have any category as a key
type ProcessedData = Record<string, { month: string } & Record<string, number>>;
// Define the order of months
const New_MONTH_ORDER: any = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

// Function to extract month and year from the 'month' string
function extractMonthYear(entry: any) {
  const [monthName, year] = entry.month.split("/");
  return { monthName, year: parseInt(year, 10) };
}

export const processTrendData = (
  categoryType: string,
  trendData: any[],
  selectedTab: any
): { lineData: any[]; uniqueCategories: string[] } => {
  if (!trendData || trendData.length === 0)
    return { lineData: [], uniqueCategories: [] };
  const currentDate = new Date();
  const uniqueCategorySet: Set<string> = new Set();
  let processedData: any = {};

  if (categoryType === "Basic" || categoryType === "Commutation") {
    trendData.forEach(({ month, category, total }: TrendEntry) => {
      if (!processedData[month]) {
        processedData[month] = { month }; // Initialize month entry
      }

      if (category && typeof total === "number") {
        uniqueCategorySet.add(category); // Collect unique categories

        // Ensure TypeScript treats it as a number
        processedData[month][category] =
          (processedData[month][category] ?? 0) + total;
      }
    });

    // Convert object to array and sort by month/year
    const sortedData = Object.values(processedData).sort(
      (a: any, b: any) =>
        parseDate(a.month).getTime() - parseDate(b.month).getTime()
    );
    processedData = sortedData;
  } else if (categoryType === "over_under_payment") {
    // Process the trend data
    processedData = trendData;

    // Convert object to sorted array
    const sortedData: any = Object.values(processedData).sort(
      (a: any, b: any) =>
        parseDate(a.month).getTime() - parseDate(b.month).getTime()
    );
    processedData = sortedData;
    uniqueCategorySet.add("Overpaid");
    uniqueCategorySet.add("Underpaid");
  } else if (categoryType === "Age") {
    // Sorting trendData by year and month
    processedData = trendData.sort((a, b) => {
      // Extract year from "January/2025"
      const [monthA, yearA] = a.month.split("/"); // ["January", "2025"]
      const [monthB, yearB] = b.month.split("/"); // ["January", "2024"]

      // Convert years to numbers
      const yearNumA = parseInt(yearA);
      const yearNumB = parseInt(yearB);

      // Get month index
      const monthNames = [
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
      const monthIndexA = monthNames.indexOf(monthA);
      const monthIndexB = monthNames.indexOf(monthB);

      // First sort by year (ascending), then by month (ascending)
      return yearNumA - yearNumB || monthIndexA - monthIndexB;
    });

    // Add age categories
    uniqueCategorySet.add("80+");
    uniqueCategorySet.add("85+");
    uniqueCategorySet.add("90+");
    uniqueCategorySet.add("95+");
    uniqueCategorySet.add("100+");
  } else if (categoryType === "Family_pension") {
    processedData = trendData;

    trendData.forEach((entry) => {
      const month = entry.month;

      Object.keys(entry).forEach((key) => {
        if (key !== "month") {
          uniqueCategorySet.add(key);
        }
      });
    });

    // Sort the data
    const sortedData = trendData.sort((a, b) => {
      const { monthName: monthA, year: yearA } = extractMonthYear(a);
      const { monthName: monthB, year: yearB } = extractMonthYear(b);

      if (yearA !== yearB) {
        return yearA - yearB; // Sort by year
      } else {
        return New_MONTH_ORDER[monthA] - New_MONTH_ORDER[monthB]; // Sort by month
      }
    });
    return { lineData: sortedData, uniqueCategories: [...uniqueCategorySet] };
  } else if (categoryType === "New_Pensioner") {
    processedData = trendData;
    if (selectedTab === "amount") {
      // Extract keys from trendData (excluding 'month') and add to uniqueCategorySet
      Object.keys(trendData[0]).forEach((key) => {
        if (key !== "month" && key !== "NewPensioners") {
          uniqueCategorySet.add(key);
        }
      });
    } else if (selectedTab === "count") {
      // Extract keys from trendData (excluding 'month') and add to uniqueCategorySet
      Object.keys(trendData[0]).forEach((key) => {
        if (key !== "month" && key !== "NewPensionAmount") {
          uniqueCategorySet.add(key);
        }
      });
    }
  } else if (categoryType === "Stopped_Pensioner") {
    processedData = trendData;
    if (selectedTab === "amount") {
      // Extract keys from trendData (excluding 'month') and add to uniqueCategorySet
      Object.keys(trendData[0]).forEach((key) => {
        if (
          key !== "month" &&
          key !== "StoppedPensioners" &&
          key !== "previousMonth"
        ) {
          uniqueCategorySet.add(key);
        }
      });
    } else if (selectedTab === "count") {
      // Extract keys from trendData (excluding 'month') and add to uniqueCategorySet
      Object.keys(trendData[0]).forEach((key) => {
        if (
          key !== "month" &&
          key !== "StoppedPensionerAmount" &&
          key !== "previousMonth"
        ) {
          uniqueCategorySet.add(key);
        }
      });
    }
  } else if (categoryType === "Active_Pensioners") {
    processedData = trendData;
    if (selectedTab === "amount") {
      // Extract keys from trendData (excluding 'month') and add to uniqueCategorySet
      Object.keys(trendData[0]).forEach((key) => {
        if (key !== "month" && key !== "ActivePensioners") {
          uniqueCategorySet.add(key);
        }
      });
    } else if (selectedTab === "count") {
      // Extract keys from trendData (excluding 'month') and add to uniqueCategorySet
      Object.keys(trendData[0]).forEach((key) => {
        if (key !== "month" && key !== "ActivePensionAmount") {
          uniqueCategorySet.add(key);
        }
      });
    }
  } else if (categoryType === "Family_Pension_Transition") {
    processedData = trendData;
    if (selectedTab === "amount") {
      // Extract keys from trendData (excluding 'month') and add to uniqueCategorySet
      Object.keys(trendData[0]).forEach((key) => {
        if (key !== "month" && key !== "TransitionCount") {
          uniqueCategorySet.add(key);
        }
      });
    } else if (selectedTab === "count") {
      // Extract keys from trendData (excluding 'month') and add to uniqueCategorySet
      Object.keys(trendData[0]).forEach((key) => {
        if (key !== "month" && key !== "TransitionAmount") {
          uniqueCategorySet.add(key);
        }
      });
    }
  } else if (categoryType === "Age_Bracket_Movement") {
    console.log("this is trenddata");
    console.log(trendData);

    processedData = trendData;
    uniqueCategorySet.add("80+");
    uniqueCategorySet.add("85+");
    uniqueCategorySet.add("90+");
    uniqueCategorySet.add("95+");
    uniqueCategorySet.add("100+");
  }
  console.log(processedData);

  // Convert processed data to an array and sort by month order
  const sortedData = Object.values(processedData).sort(
    (a: any, b: any) =>
      MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month)
  );

  return { lineData: sortedData, uniqueCategories: [...uniqueCategorySet] };
};

export function formatKeyToLabel(key: string): any {
  if (key) {
    // PH Expenditure specific labels
    if (key === 'actualLastYear') {
      return 'LFY';
    } else if (key === 'targetLastYear') {
      return 'LFY Target';
    } else if (key === 'actualForTheMonth') {
      return 'Actual';
    } else if (key === 'actualUpToTheMonth') {
      return 'CFY YTD Actual';
    } else if (key === 'actualUpToTheMonthLastYear') {
      return 'LFY YTD Actual';
    }

    // Existing Expenditure/Earning labels
    if (key.includes("targetYTD")) {
      return "Target YTD";
    } else if (key.includes("actualYTD") && key.includes("LastYear")) {
      return "LFY YTD Actual";
    } else if (key.includes("actualYTD")) {
      return "CFY YTD Actual";
    } else if (key.includes("actualLastFinancialYear")) {
      return "Actual (last FY)";
    } else if (key.includes("targetCurrentFinancialYear")) {
      return "CFY Target";
    } else if (key.includes("actualThisMonthLastYear")) {
      return "LFY";
    } else if (key.includes("actualThisMonth")) {
      return "Actual";
    } else if (key.includes("targetThisMonth")) {
      return "Target";
    }

    // Default fallback: Convert camelCase to spaced words
    return key
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/^./, (str) => str.toUpperCase());
  }
}

export function formatYAxisTick(value: number, type: string): string {
  if (type == "Earning" || type == "Expenditure") {
    value *= 1000;
  }
  // if (type == "Expenditure") {
  //   value *= 10000000;
  // }

  if (value >= 1e7) return (value / 1e7).toFixed(2) + "cr";
  if (value >= 1e5) return (value / 1e5).toFixed(2) + "L";
  if (value >= 1e3) return (value / 1e3).toFixed(2) + "k";
  return value.toLocaleString("en-IN");
}

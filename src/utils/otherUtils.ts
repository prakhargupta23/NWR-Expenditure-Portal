import * as XLSX from "xlsx";
import { months } from "./staticDataUtis";
import { hr } from "date-fns/locale";
import { log } from "console";
export const monthMap: any = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12",
};
export const allMonths = [
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
export function generateSummaryQuery(
  categoryType: string,

  formattedDate: any
) {
  let categoryKey = "";
  let mismatchKey = "";

  if (categoryType === "Basic") {
    categoryKey = "basicCategory";
    mismatchKey = "basicMismatch";
  } else if (categoryType === "Commutation") {
    categoryKey = "commutationCategory";
    mismatchKey = "commutationMismatch";
  } else if (categoryType === "over_under_payment") {
    categoryKey = "commutationCategory"; // Adjust if necessary
    mismatchKey = "commutationMismatch"; // Adjust if necessary
  } else {
    categoryKey = "basicCategory";
    mismatchKey = "basicMismatch";
  }
  const summaryQuery = `
  SELECT 
    SUM(ABS(${mismatchKey})) as netMismatch, 
    COUNT(CASE WHEN ${categoryKey} IS NULL THEN 1 END) as unlinkedCases,
    SUM(CASE WHEN ${categoryKey} IS NULL THEN ABS(${mismatchKey}) END) as unlinkedAmount,
    (COUNT(CASE WHEN ${categoryKey} IS NULL THEN 1 END) * 100.0) / NULLIF(COUNT(*), 0) as unlinkedPercentage
  FROM arpan 
  WHERE month = '${formattedDate}'
  `;
  return summaryQuery;
}

// Convert month to "MM/YYYY" format
export const getMonthYear = (month: string, year: any) => {
  const monthMap: { [key: string]: string } = {
    January: "01",
    February: "02",
    March: "03",
    April: "04",
    May: "05",
    June: "06",
    July: "07",
    August: "08",
    September: "09",
    October: "10",
    November: "11",
    December: "12",
  };
  return `${monthMap[month]}/${year}`;
};

///// Utis function for fetching up the perfect prompt ---------------------------/
export function generatePrompt(pageType: boolean) {
  let promptForDemo = {
    role: "system",
    content: `
    - You are an AI assistant providing concise and direct responses based on Arpan data and give us SQL queries for the table name as 'arpan'.
    - Following is the schema:

      {
        uuid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: true,
        },
        fileNo: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        dateOfTransaction: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        transactionId: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        typeOfPension: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        originalPensionerName: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        newPPONo: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        oldPPONo: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        currentPensionerName: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        railwayDept: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        monthOfPension: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        basicPensionAmount: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        deduction: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        residualPension: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        fixMedicalAllowance: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        additionalPension80Plus: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        daOnBasicPension: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        totalPension: {
          type: DataTypes.FLOAT,
          allowNull: true,
        },
        basicCategory: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        basicMismatch: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        commutationCategory: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        commutationMismatch: {
          type: DataTypes.STRING(255),
          allowNull: true,
        }
      }

    - Keep answers brief and to the point.
    - The output should be a valid JSON object.
    - The words 'LIMIT' and 'TOP' are not accepted.
    - Use the 'FETCH FIRST' method to retrieve rows in queries.
    - Never use column names that are not in the table.
    - Always keep 'newPPONo' in the query.
    - You can't put comments in the output JSON.
    - Example output format:
    
      { 
        "query": "SELECT currentPensionerName, totalPension FROM arpan WHERE newPPONo IS NOT NULL ORDER BY totalPension DESC OFFSET 0 ROWS FETCH FIRST 3 ROWS ONLY;"
      }

    - If, to continue the conversation, no data from the table is required, set the query to null.
    - Output strictly has to be in the above-mentioned JSON map format, hence your output always starts with { and ends with }.
    `,
  };
  if (pageType === true) {
    return promptForDemo;
  }
}
export const parseSheetWithMergedHeaders = (sheet: any) => {
  const ref = sheet["!ref"];
  if (!ref) return [];

  const range = XLSX.utils.decode_range(ref);
  const headers: string[] = [];
  const data = [];

  const mainHeaderRow = range.s.r; // 1st row (merged headers)
  const subHeaderRow = range.s.r + 1; // 2nd row (Items, Amt.)

  let lastMainHeader = ""; // store last non-empty main header

  // Build headers
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const mainCell = sheet[XLSX.utils.encode_cell({ r: mainHeaderRow, c: C })];
    const subCell = sheet[XLSX.utils.encode_cell({ r: subHeaderRow, c: C })];

    let mainText = mainCell?.v ? mainCell.v.toString().trim() : "";
    const subText = subCell?.v ? subCell.v.toString().trim() : "";

    if (mainText) {
      lastMainHeader = mainText; // update when new mainText appears
    } else {
      mainText = lastMainHeader; // use previous mainText if empty
    }

    let header = mainText;
    if (subText) {
      if (subText.toLowerCase() === "amt.") {
        header = `${mainText} Amt.`;
      } else if (subText.toLowerCase() === "items") {
        header = `${mainText} Items`;
      }
    }

    headers.push(header.trim()); // Always trim final header
  }

  // Read data starting after sub-header row
  for (let R = subHeaderRow + 1; R <= range.e.r; ++R) {
    const row: any = {};
    let isEmpty = true;

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = sheet[XLSX.utils.encode_cell({ r: R, c: C })];
      const header = headers[C - range.s.c];

      row[header] = cell ? cell.v : null;

      if (cell && cell.v != null && cell.v !== "") {
        isEmpty = false;
      }
    }

    if (!isEmpty) {
      data.push(row);
    }
  }

  return data;
};

export const parseSheetWithHeaders = (sheet: any): any[] => {
  const ref = sheet["!ref"];
  if (!ref) return [];

  const range = XLSX.utils.decode_range(ref);
  const data: any[] = [];
  let headerRow = range.s.r;

  // 1) Find the real header row (>=2 non-empty text cells)
  for (let r = range.s.r; r <= range.e.r; r++) {
    let nonEmptyCount = 0;
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (cell && typeof cell.v === "string" && cell.v.trim() !== "") {
        nonEmptyCount++;
      }
    }
    if (nonEmptyCount >= 2) {
      headerRow = r;
      break;
    }
  }

  // 2) Read headers
  const headers: string[] = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = sheet[XLSX.utils.encode_cell({ r: headerRow, c: C })];
    headers.push(
      cell && cell.v != null ? cell.v.toString().trim() : `UNKNOWN_${C}`
    );
  }

  const stopKeywords = ["total", "gross total"];

  // 3) Read data rows
  for (let R = headerRow + 1; R <= range.e.r; ++R) {
    // peek at first column to see if we should stop
    const firstAddr = XLSX.utils.encode_cell({ r: R, c: range.s.c });
    const rawFirst = sheet[firstAddr]?.v;
    const firstVal =
      rawFirst != null ? rawFirst.toString().trim().toLowerCase() : "";

    if (stopKeywords.some((k) => firstVal.includes(k))) {
      break;
    }

    const rowObj: Record<string, any> = {};
    let isEmpty = true;

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const raw = sheet[addr]?.v;
      // empty or "-" → null
      const val = raw === undefined || raw === "" || raw === "-" ? null : raw;
      if (val != null) isEmpty = false;
      rowObj[headers[C - range.s.c]] = val;
    }

    // if the entire row is blank, stop parsing
    if (isEmpty) break;

    data.push(rowObj);
  }

  return data;
};
export const parseExcelFile = async (
  buffer: ArrayBuffer,
  division: string,
  month: string,
  year: string,
  data: any[]
) => {
  try {
    // load workbook & pick the sheets
    const workbook: any = XLSX.read(new Uint8Array(buffer), { type: "array" });
    console.log(workbook.Sheets);

    // Define the expected sheet names
    const sheetNames: { [key: string]: string } = {
      expenditure: "Expenditure",
      phExpenditure: "PH Expenditure",
      earning: "Earnings",
      recoverable: "Recoverables",
      dwRecoverable: "DW Recoverables",
      suspenseBalances: "Suspense Balances",
      auditObjections: "Audit Objections",
      accountInspections: "Accounts Inspection",
      completionReports: "Completion Reports",
      stocksheets: "Stock Sheets",
      settlementcases: "Settlement Cases",
      savingthroughic: "Savings through IC ",
      rbinspection: "RB HQ Inspection",
    };

    // Create a new object with sheets that are found in workbook.Sheets using includes
    const sheets: { [key: string]: any } = Object.keys(sheetNames).reduce(
      (acc: { [key: string]: any }, key: string) => {
        const sheetName = sheetNames[key].trim(); // Trim the sheet name
        const sheetKeys = Object.keys(workbook.Sheets);

        const matchedSheetKey =
          sheetKeys.find(
            (sheetKey) =>
              sheetKey.trim().toLowerCase() === sheetName.toLowerCase()
          ) ||
          sheetKeys.find((sheetKey) =>
            sheetKey.trim().toLowerCase().includes(sheetName.toLowerCase())
          );

        if (matchedSheetKey && workbook.Sheets[matchedSheetKey]) {
          acc[key] = workbook.Sheets[matchedSheetKey];
        }

        return acc;
      },
      {}
    );
    // date strings
    const formattedDate = getMonthYear(month, year);
    const selectedMonthYear = formattedDate;

    // detect “Thousand” or “Crore”
    const detectFigureUnit = (sheet: XLSX.WorkSheet): string | null => {
      for (const addr of Object.keys(sheet)) {
        if (addr.startsWith("!")) continue;
        const v = sheet[addr].v;
        if (typeof v === "string") {
          const lc = v.toLowerCase();
          if (lc.includes("thousand")) return "Thousand";
          if (lc.includes("crore")) return "Crore";
        }
      }
      return null;
    };

    // unified parser: alpha-keys + drop “total” rows and below
    const parseSheetWithAlphaKeys = (sheet: XLSX.WorkSheet): any[] => {
      const ref = sheet["!ref"] || "";
      if (!ref) return [];

      const { s, e } = XLSX.utils.decode_range(ref);

      // find first numeric row
      let startRow: number | null = null;
      for (let r = s.r; r <= e.r; r++) {
        for (let c = s.c; c <= e.c; c++) {
          const cell = sheet[XLSX.utils.encode_cell({ r, c })];
          if (cell && typeof cell.v === "number") {
            startRow = r;
            break;
          }
        }
        if (startRow !== null) break;
      }

      if (startRow === null) return [];

      const stopKeywords = ["total", "gross total"];
      const rows: any[] = [];

      for (let r = startRow; r <= e.r; r++) {
        const rowData: Record<string, any> = {};
        let isEmpty = true;
        let stopRow = false;

        for (let c = s.c; c <= e.c; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          const cellValue = sheet[addr]?.v;

          if (cellValue != null && cellValue !== "") isEmpty = false;

          const cellStr = String(cellValue ?? "").toLowerCase();
          if (stopKeywords.some((kw) => cellStr.includes(kw))) {
            stopRow = true;
          }

          rowData[String.fromCharCode(97 + (c - s.c))] = cellValue ?? null;
        }

        if (isEmpty || stopRow) break;

        rows.push(rowData);
      }

      return rows;
    };

    // assemble finalData
    const finalData = {
      expenditure: sheets.expenditure
        ? parseSheetWithAlphaKeys(sheets.expenditure).map((row) => ({
            division,
            date: formattedDate,
            figure: detectFigureUnit(sheets.expenditure),
            subCategory: row.a,
            actualLastFinancialYear: row.b != null ? +row.b : null,
            targetCurrentFinancialYear: row.c != null ? +row.c : null,
            targetThisMonth: row.d != null ? +row.d : null,
            actualThisMonthLastYear: row.f != null ? +row.f : null,
            actualThisMonth: row.e != null ? +row.e : null,
            targetYTDThisMonth: row.g != null ? +row.g : null,
            actualYTDThisMonthLastYear: row.i != null ? +row.i : null,
            actualYTDThisMonth: row.h != null ? +row.h : null,
          }))
        : [],

      phExpenditure: sheets.phExpenditure
        ? parseSheetWithAlphaKeys(sheets.phExpenditure).map((row) => ({
            division,
            date: formattedDate,
            figure: detectFigureUnit(sheets.phExpenditure),
            planHead: row.a,
            actualLastYear: row.b != null ? +row.b : null,
            targetLastYear: row.c != null ? +row.c : null,
            actualUpToTheMonth: row.e != null ? +row.e : null,
            actualUpToTheMonthLastYear: row.f != null ? +row.f : null,
            actualForTheMonth: row.d != null ? +row.d : null,
          }))
        : [],

      earning: sheets.earning
        ? parseSheetWithAlphaKeys(sheets.earning).map((row) => ({
            division,
            date: formattedDate,
            figure: detectFigureUnit(sheets.earning),
            subCategory: row.a,
            actualLastFinancialYear: row.b != null ? +row.b : null,
            targetThisMonth: row.c != null ? +row.c : null,
            actualThisMonthLastYear: row.e != null ? +row.e : null,
            actualThisMonth: row.d != null ? +row.d : null,
            targetYTDThisMonth: row.f != null ? +row.f : null,
            actualYTDThisMonthLastYear: row.h != null ? +row.h : null,
            actualYTDThisMonth: row.g != null ? +row.g : null,
          }))
        : [],

      recoverable: sheets.recoverable
        ? parseSheetWithAlphaKeys(sheets.recoverable).map((row) => {
            return {
              division,
              date: formattedDate,
              figure: detectFigureUnit(sheets.recoverable),
              type: row.a,
              category: row.b,
              openingBalance: row.d != null ? +row.d : 0,
              accretionUptoTheMonth: row.f != null ? +row.f : 0,
              clearanceUptoMonth: row.h != null ? +row.h : 0,
              closingBalance: row.j != null ? +row.j : 0,
            };
          })
        : [],

      dwRecoverable: sheets.dwRecoverable
        ? parseSheetWithAlphaKeys(sheets.dwRecoverable).map((row) => ({
            division,
            department: row.b,
            date: formattedDate,
            figure: detectFigureUnit(sheets.dwRecoverable),
            openingBalance: row.d != null ? +row.d : 0,
            openingBalanceItem: row.c != null ? +row.c : 0,
            accretionUptoTheMonth: row.f != null ? +row.f : 0,
            accretionUptoTheMonthItem: row.e != null ? +row.e : 0,
            clearanceUptoMonth: row.h != null ? +row.h : 0,
            clearanceUptoMonthItem: row.g != null ? +row.g : 0,
            closingBalance: row.j != null ? +row.j : 0,
            closingBalanceItem: row.i != null ? +row.i : 0,
          }))
        : [],

      suspenseBalance: sheets.suspenseBalances
        ? parseSheetWithAlphaKeys(sheets.suspenseBalances).map((row) => ({
            division,
            date: formattedDate,
            figure: detectFigureUnit(sheets.suspenseBalances),

            // treat missing or "-" as null
            suspenseHeads: row.b != null && row.b !== "-" ? row.b : null,

            position: row.d != null && row.d !== "-" ? +row.d : null,

            positionItem: row.c != null && row.c !== "-" ? +row.c : null,

            positionLhr: row.f != null && row.f !== "-" ? +row.f : null,

            positionLhrItem: row.e != null && row.e !== "-" ? +row.e : null,

            closingBalance: row.h != null && row.h !== "-" ? +row.h : null,

            closingBalanceItem: row.g != null && row.g !== "-" ? +row.g : null,

            reconciliationMonth: row.i != null && row.i !== "-" ? row.i : null,
          }))
        : [],

      auditObjection: sheets.auditObjections
        ? parseSheetWithAlphaKeys(sheets.auditObjections).map((row) => ({
            division,
            date: formattedDate,
            figure: detectFigureUnit(sheets.auditObjections),
            auditObjection: row.a,
            positionLhr: row.b != null ? +row.b : 0,
            openingBalance: row.c != null ? +row.c : 0,
            accretion: row.d != null ? +row.d : 0,
            closingBalance: row.h != null ? +row.h : 0,
            clearenceOverOneYear: row.e != null ? +row.e : 0,
            clearenceLessOneYear: row.f != null ? +row.f : 0,
          }))
        : [],

      accountInspection: sheets.accountInspections
        ? parseSheetWithAlphaKeys(sheets.accountInspections).map((row) => ({
            division,
            date: formattedDate,
            figure: detectFigureUnit(sheets.accountInspections),
            typeOfReport: row.b,
            positionLhr: row.c != null ? +row.c : 0,
            openingBalance: row.d != null ? +row.d : 0,
            accretion: row.e != null ? +row.e : 0,
            clearanceOverOneYear: row.f != null ? +row.f : 0,
            closingBalance: row.i != null ? +row.i : 0,
            clearanceLessThanOneYear: row.g != null ? +row.g : 0,
          }))
        : [],

      completionReports: sheets.completionReports
        ? parseSheetWithHeaders(sheets.completionReports).map((row: any) => {
            const positionKey = Object.keys(row).find((key) =>
              key.trim().toLowerCase().startsWith("position")
            );

            return {
              department: row["Department"] ?? null,
              positionAsLastYearMonth: row[positionKey ?? "Position"] ?? 0,
              accretionUpToMonth: row["Accretion up to month"] ?? 0,
              clearanceUpToMonth: row["Clearance up to month"] ?? 0,
              closingBalance: row["Closing Balance"] ?? 0,
              oldestCrPending: row["Oldest C.R. pending"] ?? null,
              division,
              date: formattedDate,
            };
          })
        : [],

      stocksheets: sheets.stocksheets
        ? parseSheetWithHeaders(sheets.stocksheets).map((row) => ({
            department: row["Department"] ?? null,
            openingBalanceAsLastYearMonth: row["Opening Balance"] ?? 0,
            accretionUpToMonth: row["Accretion up to month"] ?? 0,
            clearanceUpToMonth: row["Clearance up to month"] ?? 0,
            closingBalance: row["Closing Balance"] ?? 0,
            remarks: row["Remarks"] ?? null,
            division,
            date: formattedDate,
          }))
        : [],

      settlementcases: sheets.settlementcases
        ? parseSheetWithHeaders(sheets.settlementcases).map((row) => ({
            item: row["Item"] ?? null,
            openingBalanceMonth: row["Opening balance of the month"] ?? 0,
            accretionDuringMonth: row["Accretion during the month"] ?? 0,
            clearedDuringMonth: row["Cleared during the month"] ?? 0,
            closingOutstanding: row["Closing outstanding"] ?? 0,
            division,
            date: formattedDate,
          }))
        : [],

      savingthroughic: sheets.savingthroughic
        ? parseSheetWithHeaders(sheets.savingthroughic).map((row) => ({
            actualUpToLastMonth: row["Actual up to last month"] ?? 0,
            figure: detectFigureUnit(sheets.savingthroughic),
            forTheMonth: row["For the month"] ?? 0,
            totalToEndOfMonth: row["Total to end of the month"] ?? 0,
            remarks: row["Remarks"],
            division,
            date: formattedDate,
          }))
        : [],
      rbinspection: sheets.rbinspection
        ? parseSheetWithHeaders(sheets.rbinspection).map((row) => ({
            yearOfReport: row["Year of Report"] ?? null,
            typeOfPara: row["Type of para"] ?? null,
            totalParas: row["Total no. of Paras"] ?? 0,
            parasAtStartOfMonth: row["Paras o/s at the start of month"] ?? 0,
            closedDuringMonth: row["Closed during the month"] ?? 0,
            parasOutstanding: row["No. of paras Outstanding"] ?? 0,
            remarks: row["Remarks"] ?? null,
            division,
            date: formattedDate,
          }))
        : [],

      selectedMonthYear,
      division,
    };

    const enrichedData = data.map((item) => ({
      ...item,
      date: selectedMonthYear,
      division,
    }));

    return { finalData, enrichedData };
  } catch (error: any) {
    console.error("Error parsing Excel file:", error.message);
    return { finalData: {}, enrichedData: [] };
  }
};

//// Function for formatting the header -----------------------------------------------/
export const formatHeader = (key: string): string => {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2") // insert space before capital letters
    .replace(/_/g, " ") // replace underscores with space
    .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize first letter of each word
};

const customSheetNameMap: Record<string, string> = {
  Suspenseregister: "Suspense Register",
  Stocskheet: "Stocks Sheet",
  Savingthroughic: "Saving Through IC",
  Hrinspection: "HQ Inspection",
  Auditobjection: "Audit Objection",
  Accountinspection: "Account Inspection",
  PHexpenditure: "PH Expenditure",
  Settlementcase: "Settlement Case",
  Dwrecoverable: "DW Recoverable",
  Completionreport: "Completion Report",
};

export const formatSheetName = (text: string): string => {
  if (customSheetNameMap[text]) return customSheetNameMap[text];

  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};
export const toBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

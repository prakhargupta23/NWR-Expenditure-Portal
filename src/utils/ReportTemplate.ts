import { DivisionAnalysis } from "../interface/reportInterface";
import { summaryOfReport } from "../interface/reportInterface";

type MetricBlock = {
  Jaipur: number;
  Jodhpur: number;
  Bikaner: number;
  Ajmer: number;
  "Total/Avg": number;
  "Best Performing Division": string[];
  "Worst Performing Division": string[];
};

interface Charts {
  divisionWiseEarningsSummaryBarChart: string;
  divisionWiseEarningsSummaryPieChart: string;
  divisionWiseExpenditureSummaryPieChart: string;
  headsWiseEarningsSummaryPieChart: string;
  recoverablesSummaryStackedChart: string;
}

interface ExecutiveSummaryData {
  totalEarnings: number;
  totalExpenditures: number;
  earningsAchievementPercent: string;
  expenditureAchievementPercent: string;
  highestPerformer: string;
  lowestPerformer: string;
}
interface ResizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number; // value between 0 and 1
}

const mmToCssPx = (mm: number) => (mm / 25.4) * 96; // convert mm to CSS px at 96 dpi

const getResponsiveWidthPx = (targetWidthMm: number): number => {
  // Target image width in CSS pixels
  const targetWidthCssPx = mmToCssPx(targetWidthMm);

  // Current viewport width in CSS pixels
  const viewportWidth = window.innerWidth;

  // Let's say you want max image width to be 80% of viewport width
  const maxAllowedWidth = viewportWidth * 0.8;

  // Final width should be the smaller of these two
  return Math.min(targetWidthCssPx, maxAllowedWidth);
};

export const resizeChartImage = async (
  base64Image: string
): Promise<string> => {
  try {
    const resizedImage = await resizeBase64Image(base64Image, {
      maxWidth: 650,
      maxHeight: 600,
      quality: 0.9,
    });
    return resizedImage;
  } catch (error) {
    console.error("Error resizing image:", error);
    return base64Image; // fallback to original
  }
};
async function resizeBase64Image(
  base64Image: string,
  options: {
    maxWidth: number;
    maxHeight: number;
    quality?: number;
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");

        const ratio = Math.min(
          options.maxWidth / img.width,
          options.maxHeight / img.height
        );
        const width = img.width * ratio;
        const height = img.height * ratio;

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const resizedBase64 = canvas.toDataURL("image/png", options.quality);
        resolve(resizedBase64.split(",")[1]);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = `data:image/png;base64,${base64Image}`;
  });
}

const formatKey = (key: string) => {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/YTD/g, "YTD")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const summaryOfReportHtml = (summaryOfReport: string[]) => {
  return `<div style="margin: 20px 10%;">
    <h2 style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px; page-break-before: always;">
      Summary of Report
    </h2>
    <ul style="margin-top: 5px;">
      ${summaryOfReport
        .map((point: string) => `<li style="margin: 4px 0;">${point}</li>`)
        .join("\n")}
    </ul>
  </div>`;
};

const detailedAnalysisHtml = (detailedAnalysis: DivisionAnalysis[]) => {
  const renderExpenditureTable = (title: string, data: any[]) => {
    if (!data || data.length === 0) {
      return `<p style="color: #888; margin: 4px 0;">No data available</p>`;
    }

    const headers = Object.keys(data[0]);

    return `
      <table style="width: 100%; max-width: 700px; border-collapse: collapse; margin-bottom: 6px; font-size: 11px; line-height: 1.1;">
        <thead>
          <tr>
            <th colspan="${
              headers.length
            }" style="text-align: center; background-color: #ecf0f1; padding:1px 2px; font-weight: bold;">
              ${title}
            </th>
          </tr>
          <tr>
           ${headers
             .map(
               (key) =>
                 `<th style="border: 1px solid #ccc; padding: 1px 2px; text-transform: none; font-weight: 500;">${formatKey(
                   key
                 )}</th>`
             )
             .join("")}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (item) => `
              <tr>
                ${headers
                  .map(
                    (key) =>
                      `<td style="border: 1px solid #ccc; padding: 1px 2px; line-height: 1.1;">${
                        item[key] ?? "-"
                      }</td>`
                  )
                  .join("")}
              </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
  };

  return `<div style="margin: 20px 10%;">
    <h2 style="text-align: center; font-size: 30px; font-weight: bold; margin-bottom: 20px; page-break-before: always; margin-top: 20px;">
      Division-wise Detailed Analysis
    </h2>
      <ol type="1" style="margin-top: 5px;">
              <li style="margin: 3px 0;">Jaipur</li>
              <li style="margin: 3px 0;">Ajmer</li>
              <li style="margin: 3px 0;">Bikaner</li>
              <li style="margin: 3px 0;">Jodhpur</li>
      </ol>
    ${detailedAnalysis
      .map((division: DivisionAnalysis) => {
        const {
          division: divisionName,
          keyHighlights,
          earningVsTarget,
          expenseOverview,
          barImage,
        } = division;

        return `
      <div style="margin-bottom: 30px; margin-top: 20px;">
        <h3 style="font-size: 20px; font-weight: bold; color: #2c3e50; margin-bottom: 8px; page-break-before: always;">
          ${divisionName}
        </h3>

        <h4 style="font-size: 16px; font-weight: bold; margin-top: 20px; color: #34495e; margin-bottom: 6px;">Key Highlights</h4>
        <ul style="padding-left: 18px; margin-bottom: 6px;">
          <li style="margin: 3px 0;">Actual Earnings: ${
            keyHighlights.actualEarnings
          }</li>
          <li style="margin: 3px 0;">Target Earnings: ${
            keyHighlights.targetEarnings
          }</li>
          <li style="margin: 3px 0;">Performance vs Target: ${
            keyHighlights.performanceTarget
          }</li>
          <li style="margin: 3px 0;">Performance Last Year: ${
            keyHighlights.performanceLY
          }</li>
          <li style="margin: 3px 0;">Recovery Variance Target: ${
            keyHighlights.recoveryVarianceTarget
          }</li>
          <li style="margin: 3px 0;">Recovery Variance Last Year: ${
            keyHighlights.recoveryVarianceLY
          }</li>
        </ul>

        <h4 style="font-size: 16px; font-weight: bold; margin-top: 20px; color: #34495e; page-break-before: always; margin-bottom: 6px;">Earnings vs Target</h4>
        <ul style="padding-left: 18px; margin-bottom: 6px;">
          <li style="margin: 3px 0;">Highest Earning Category: ${
            earningVsTarget.highestEarningCategory
          }</li>
          <li style="margin: 3px 0;">Lowest Earning Category: ${
            earningVsTarget.lowestEarningCategory
          }</li>
          <li style="margin: 3px 0;">Highest Earning Target: ${
            earningVsTarget.highestEarningTarget
          }</li>
        </ul>
        <div style="width: 100%; display: flex; justify-content: center; padding: 6px 0;">
          <div style="width: 100%; max-width: 600px; border: 1px solid #ccc; padding: 6px; box-sizing: border-box;">
            <div style="font-weight: bold; margin-bottom: 5px; font-size: 13px; color: #2c3e50; text-align: center;">
              Earning Graph
            </div>
            <img 
              src="data:image/png;base64,${barImage}" 
              alt="Earning Graph" 
              style="display: block; width: 100%;max-width: 600px; height: 300px; object-fit: contain;" 
            />
          </div>
        </div>

        <h4 style="font-size: 16px; font-weight: bold; margin-top: 20px; color: #34495e; page-break-before: always; margin-bottom: 6px;">Expenditure Overview</h4>
        <div style="overflow-x: auto;">
          ${renderExpenditureTable(
            "General Expenditure",
            expenseOverview?.expenditure || []
          )}
        </div>

        <h4 style="font-size: 16px; font-weight: bold; margin-top: 20px; color: #34495e; page-break-before: always; margin-bottom: 6px;">PH Expenditure Overview</h4>

        <div style="overflow-x: auto; page-break-before: always; margin-bottom: 6px;">
          ${renderExpenditureTable(
            "PH Expenditure",
            expenseOverview?.phExpenditure || []
          )}


        </div>
        
        <h4 style="font-size: 16px; font-weight: bold; margin-top: 20px; color: #34495e; page-break-before: always; margin-bottom: 6px;">Recoverables Analysis</h4>
        <ul style="padding-left: 18px; margin-bottom: 6px;">
          <li style="margin: 3px 0;">Total Closing DR: ${
            division.recoverablesAnalysis.totalClosingDR
          }</li>
          <li style="margin: 3px 0;">Total Closing BR: ${
            division.recoverablesAnalysis.totalClosingBR
          }</li>
          <li style="margin: 3px 0;">Highest Category DR: ${
            division.recoverablesAnalysis.highestCategoryDR
          }</li>
          <li style="margin: 3px 0;">Highest DR Value: ${
            division.recoverablesAnalysis.highestDRValue
          }</li>
          <li style="margin: 3px 0;">Highest Category BR: ${
            division.recoverablesAnalysis.highestCategoryBR
          }</li>
          <li style="margin: 3px 0;">Highest BR Value: ${
            division.recoverablesAnalysis.highestBRValue
          }</li>
          <li style="margin: 3px 0;">Total Dept-wise Recoverables: ${
            division.recoverablesAnalysis.totalDeptWise
          }</li>
        </ul>


        <h4 style="font-size: 16px; font-weight: bold; margin-top: 20px; color: #34495e; page-break-before: always; margin-bottom: 6px;">Suspense Balances Analysis</h4>
        <ul style="padding-left: 18px; margin-bottom: 6px;">
          <li style="margin: 3px 0;">Total Closing Suspense: ${
            division.suspenseBalancesAnalysis.totalClosingSuspense
          }</li>
        </ul>
        ${renderExpenditureTable(
          "Suspense Table",
          division.suspenseBalancesAnalysis.suspenseTable || []
        )}

        <h4 style="font-size: 16px; font-weight: bold; margin-top: 20px; color: #34495e; page-break-before: always; margin-bottom: 6px;">Completion Report</h4>
        <ul style="padding-left: 18px; margin-bottom: 6px;">
          <li style="margin: 3px 0;">${
            division.completionReport.clearanceDept
          } has the highest clearance count</li>
          <li style="margin: 3px 0;">${
            division.completionReport.closingDept
          } has the highest closing count</li>
        </ul>
        ${renderExpenditureTable(
          "Completion Report",
          division.completionReport.completionTable || []
        )}

        <h4 style="font-size: 16px; font-weight: bold; margin-top: 20px; color: #34495e; page-break-before: always; margin-bottom: 6px;">Railway HQ Inspection</h4>
        ${renderExpenditureTable(
          "Railway HQ Inspection",
          division.railwayHQInspection.HQInspectionTable || []
        )}

        <h4 style="font-size: 16px; font-weight: bold; margin-top: 20px; color: #34495e; page-break-before: always; margin-bottom: 6px;">Stock Sheet</h4>
        <ul style="padding-left: 18px; margin-bottom: 6px;">
          <li style="margin: 3px 0;">${
            division.stockSheet.clearanceDept
          } has the highest clearance count</li>
          <li style="margin: 3px 0;">${
            division.stockSheet.closingDept
          } has the highest closing count</li>
        </ul>
        ${renderExpenditureTable(
          "Stock Sheet",
          division.stockSheet.stockSheetTable || []
        )}

        <h4 style="font-size: 16px; font-weight: bold; margin-top: 20px; color: #34495e; page-break-before: always; margin-bottom: 6px;">Account Inspection</h4>
        ${renderExpenditureTable(
          "Account Inspection",
          division.accountInspection.accountInspectionTable || []
        )}  

        <h4 style="font-size: 16px; font-weight: bold; margin-top: 20px; color: #34495e; page-break-before: always; margin-bottom: 6px;">Settlement Cases</h4>
        ${renderExpenditureTable(
          "Settlement Cases",
          division.settlementCases.settlementCasesTable || []
        )}

        <h4 style="font-size: 16px; font-weight: bold; margin-top: 20px; color: #34495e; page-break-before: always; margin-bottom: 6px;">Savings Through IC</h4>
        <ul style="padding-left: 18px; margin-bottom: 6px;">
          <li style="margin: 3px 0;">Total Savings: ${
            division.savingsThroughICAnalysis.totalSavings
          }</li>
        </ul>
        ${renderExpenditureTable(
          "Savings Table",
          division.savingsThroughICAnalysis.savingsTable || []
        )}
      </div>`;
      })
      .join("")}
  </div>`;
};

export const generateHTMLContent = async (
  base64Image: string,
  selectedMonth: string,
  selectedYear: any,
  executiveSummaryData: ExecutiveSummaryData,
  keyTakeaways: string[],
  combinedSummaryData: Record<string, MetricBlock>,
  charts: Charts,
  detailedAnalysis: DivisionAnalysis[],
  summaryOfReport: string[]
): Promise<string> => {
  const formattedDate = new Date().toLocaleDateString();

  const summaryPoints = Object.entries(executiveSummaryData)
    .map(
      ([key, value]) =>
        `<li style="margin: 3px 0;"><strong>${key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())}:</strong> ${value}</li>`
    )
    .join("\n");

  const takeaways = keyTakeaways
    .map((point) => `<li style="margin: 3px 0;">${point}</li>`)
    .join("\n");

  const divisions = ["Jaipur", "Jodhpur", "Bikaner", "Ajmer"];

  const combinedSummaryRows = Object.entries(combinedSummaryData)
    .map(([metric, values]: any) => {
      const row = [
        `<td style="padding: 1px 2px;">${metric}</td>`,
        ...divisions.map(
          (div) => `<td style="padding: 1px 2px;">${values[div] ?? ""}</td>`
        ),
        `<td style="padding: 1px 2px;">${values["Total"] ?? ""}</td>`,
      ];

      return `<tr>${row.join("")}</tr>`;
    })
    .join("\n");

  console.log("Combined Summary Data:", combinedSummaryData);
  console.log("Before resizing earnings chart");
  const resizedEarningsChart = await resizeChartImage(
    charts.divisionWiseEarningsSummaryBarChart
  );
  console.log("After resizing earnings chart");

  const resizedEarningSummaryPieChart = await resizeChartImage(
    charts.divisionWiseEarningsSummaryPieChart
  );
  const resizedRecoverablesChart = await resizeChartImage(
    charts.recoverablesSummaryStackedChart
  );
  const resizedExpenditureSummaryPieChart = await resizeChartImage(
    charts.divisionWiseExpenditureSummaryPieChart
  );
  const resizedHeadWiseEarningSummaryPieChart = await resizeChartImage(
    charts.headsWiseEarningsSummaryPieChart
  );

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          .document {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            margin-right: 15px;
            margin-left: 15px;
            margin-top: 40px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            display: block;
            page-break-after: always;
          }
          .header img {
            max-width: 100px;
            margin-bottom: 6px;
          }
          .title {
            font-size: 22px;
            font-weight: bold;
          }
          .sub-title {
            font-size: 14px;
            color: #555;
          }
          .section {
            margin-top: 25px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #222;
            margin-bottom: 8px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4px;
          }
          ul {
            margin-left: 15px;
            padding-left: 0;
          }
          li {
            margin: 3px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            max-width: 700px;
            margin-top: 8px;
            font-size: 11px;
            line-height: 1.1;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 1px 2px;
            text-align: center;
          }
          th {
            background-color: #f0f0f0;
            font-weight: 600;
          }
          .charts-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            row-gap: 8px;
            column-gap: 0px;
            margin-top: 20px;
          }
          .chart-block {
            width: 49%;
            box-sizing: border-box;
            text-align: center;
            padding: 0;
            margin: 0;
          }
          .chart-block img {
            width: 50%;
            max-width: 50%;
            border: 1px solid #ccc;
            margin-top: 4px;
          }
          .footer {
            text-align: center;
            font-size: 11px;
            color: #aaa;
            margin-top: 40px;
          }
        </style>
      </head>

      <body>
        <div style="width: 110%; height: 380px;">
          <table width="110%" height="100%" cellspacing="0" cellpadding="0" style="background-color: #1a237e; color: white; font-family: Arial; border-collapse: collapse;">
            <tr>
              <td align="center" valign="middle" style="padding-top: 160px; margin: 0;">
                <div style="margin-bottom: 240px;">
                  <img src="data:image/png;base64,${base64Image}" alt="Railway Logo" style="height: 120px;" style="margin-bottom: 15px;" />
                 <h1 style="font-size: 14pt; margin-top: 4px;">Report Title: Monthly Performance Report – ${selectedMonth} ${selectedYear}</h1>
                  <h1 style="font-size: 14pt; margin-top: 2px;">Divisions: Jaipur | Jodhpur | Bikaner | Ajmer</h1>
                  <h1 style="font-size: 14pt; margin-top: 2px;">Prepared by: PFA AI Platform</h1>
                  <h1 style="font-size: 14pt; margin-top: 2px;">Report Date: ${new Date().toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "long", day: "numeric" }
                  )}</h1>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <div class="document">
            <div class="header" style="page-break-before: always; margin-top: 20px;">
              <img src="data:image/jpeg;base64,${base64Image}" alt="Railway Logo" style="max-width: 70px; margin-bottom: 4px;" />
            </div>
            <div class="header">
              <div class="title" style="font-size: 16px;">Monthly Performance Report</div>
              <div class="sub-title" style="font-size: 12px;">${selectedMonth} ${selectedYear}</div>
            </div>

            <h2 style="font-size: 16px; margin-bottom: 8px;">Table of Contents</h2>
            <ol style="margin-top: 5px;">
              <li style="margin: 2px 0;">Executive Summary</li>
              <li style="margin: 2px 0;">Combined Summary Table</li>
              <li style="margin: 2px 0;">Graphs & Visuals - Overall</li>
              <li style="margin: 2px 0;">Division-wise Detailed Analysis
                <ol type="a" style="margin-top: 2px;">
                  <li style="margin: 2px 0;">Ajmer</li>
                  <li style="margin: 2px 0;">Jaipur</li>
                  <li style="margin: 2px 0;">Jodhpur</li>
                  <li style="margin: 2px 0;">Bikaner</li>
                </ol>
              </li>
              <li style="margin: 2px 0;">Conclusion & Recommendations</li>
            </ol>
          
            <div class="section" style="page-break-before: always">
              <div class="section-title">Executive Summary</div>
            </div>
            <div class="section">
              <ul style="margin-top: 5px;">${summaryPoints}</ul>
            </div>

            <div class="section" style="page-break-before: always; margin-top: 20px;">
              <div class="section-title">Key Takeaways</div>
            </div>
            <div class="section">
              <ul style="margin-top: 5px;">${takeaways}</ul>
            </div>

            <div class="section" style="page-break-before: always; margin-top: 20px;">
              <div class="section-title">Combined Metrics Summary</div>
            </div>
            <div class="section">
              <table style="width: 100%; max-width: 700px; border-collapse: collapse; margin-top: 6px;">
                <thead>
                  <tr>
                    <th style="padding: 1px 2px;">Metric</th>
                    <th style="padding: 1px 2px;">Jaipur</th>
                    <th style="padding: 1px 2px;">Jodhpur</th>
                    <th style="padding: 1px 2px;">Bikaner</th>
                    <th style="padding: 1px 2px;">Ajmer</th>
                    <th style="padding: 1px 2px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${combinedSummaryRows}
                </tbody>
              </table>
            </div>

             <div class="section" style="page-break-before: always; margin-top: 20px;">
              <div class="section-title">Division-wise Performance Charts</div>
            </div>
              <div class="section">
              <div style="text-align: center">
                <tr>
                    <td width="210" style="text-align: center; padding: 1px;">
                    <img 
                      src="data:image/png;base64,${resizedEarningsChart}" 
                      style="width: 280px; max-width: 60%; height: auto; object-fit: contain; border: 1px solid #ccc; margin: 10px auto; display: block;" 
                    />
                    </td>
                </tr>
              </div>
            </div>
            <table style="width: 100%; max-width: 700px; border-collapse: collapse; margin-top: 6px;">
                
                <tr>
                    <td width="210" style="text-align: center; padding: 1px;">
                    <img 
                      src="data:image/png;base64,${resizedEarningSummaryPieChart}" 
                      style="width: 280px; max-width: 60%; height: auto; object-fit: contain; border: 1px solid #ccc; margin: 10px auto; display: block;" 
                    />
                    </td>
                </tr>
              </table>
            </div>

            <div class="section" style="page-break-before: always; margin-top: 20px;">
              <div style="text-align: center">
                <tr>
                    <td width="210" style="text-align: center; padding: 1px;">
                    <img 
                      src="data:image/png;base64,${resizedExpenditureSummaryPieChart}" 
                      style="width: 280px; max-width: 60%; height: auto; object-fit: contain; border: 1px solid #ccc; margin: 10px auto; display: block;" 
                    />
                    </td>
                </tr>
              </div>
            </div>
            <div class="section" style="page-break-before: always; margin-top: 20px;">
               <div style="text-align: center">
                <tr>
                    <td width="210" style="text-align: center; padding: 1px;">
                    <img 
                      src="data:image/png;base64,${resizedHeadWiseEarningSummaryPieChart}" 
                      style="width: 280px; max-width: 60%; height: auto; object-fit: contain; border: 1px solid #ccc; margin: 10px auto; display: block;" 
                    />
                    </td>
                </tr>
              </div>
            </div>




            <div class="section" style="page-break-before: always; margin-top: 20px;">
              <div class="section-title">Recoverables Chart</div>
            </div>

            <div class="section">
              <div style="text-align: center">
                <tr>
                    <td width="210" style="text-align: center; padding: 1px;">
                    <img 
                      src="data:image/png;base64,${resizedRecoverablesChart}" 
                      style="width: 280px; max-width: 60%; height: auto; object-fit: contain; border: 1px solid #ccc; margin: 10px auto; display: block;" 
                    />
                    </td>
                </tr>
              </div>
            </div>
            
            
            ${detailedAnalysisHtml(detailedAnalysis)}
            ${summaryOfReportHtml(summaryOfReport)}
            
            <div class="footer" style="position: absolute; bottom: 15px; width: 100%; text-align: center; font-size: 11px; color: #555;">
              © ${new Date().getFullYear()} Indian Railways – Powered by PFA AI
            </div>
        </div>
      </body>
    </html>
  `;
};

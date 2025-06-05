import { useState, useEffect } from "react";
import { csvService } from "../services/csv.service";
import { ca } from "date-fns/locale";
import { monthMap } from "../utils/otherUtils";
import { processTrendData } from "../utils/graphUtils";
function getPreviousMonth(dateStr: string): string {
  const [monthStr, yearStr] = dateStr.split("/").map(Number); // Convert to numbers
  let month = monthStr - 1;
  let year = yearStr;

  if (month === 0) {
    // If January, move to December of the previous year
    month = 12;
    year -= 1;
  }

  // Format back to "MM/YYYY" with leading zero for month if needed
  return `${month.toString().padStart(2, "0")}/${year}`;
}

function generateQuery(
  selectedGraphTab: string,
  categoryType: string,
  selectedTab: string,
  formattedDate: any
): {
  summaryQuery: string;
  dataQuery: string;
  categoryKey: string;
  trendQuery: string;
} {
  let summaryQuery = "";
  let dataQuery = "";
  let categoryKey = "";
  let mismatchKey = "";
  let trendQuery = "";

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

  if (categoryType === "over_under_payment") {
    //// Pie chat code query when tab graph is overview ---------------------/
    if (selectedGraphTab === "Overview") {
      dataQuery = `
      SELECT 
     COUNT(CASE WHEN basicMismatch < 0 THEN 1 END) AS underpaidCount,
     SUM(CASE WHEN basicMismatch < 0 THEN ABS(basicMismatch) END) AS totalUnderpaid,
     COUNT(CASE WHEN basicMismatch > 0 THEN 1 END) AS overpaidCount,
     SUM(CASE WHEN basicMismatch > 0 THEN basicMismatch END) AS totalOverpaid
 FROM arpan
 WHERE 
     month = '${formattedDate}'
     AND basicCategory = 'mismatch'  -- Only consider 'mismatch' category
     AND basicMismatch != 0;         -- Ensure there is a mismatch
 
     `;

      summaryQuery = `
       SELECT 
         SUM(${mismatchKey}) as netMismatch,
         COUNT(CASE WHEN ${mismatchKey} < 0 THEN 1 END) as totalUnderpaidCases,
         COUNT(CASE WHEN ${mismatchKey} > 0 THEN 1 END) as totalOverpaidCases,
         SUM(CASE WHEN ${mismatchKey} < 0 THEN ABS(${mismatchKey}) END) as totalUnderpaidAmount,
         SUM(CASE WHEN ${mismatchKey} > 0 THEN ${mismatchKey} END) as totalOverpaidAmount
       FROM arpan
       WHERE month = '${formattedDate}'
     `;
    } else if (selectedGraphTab === "Trend") {
      if (selectedTab === "count") {
        trendQuery = `
              SELECT 
                  month,
                  COUNT(CASE WHEN basicMismatch < 0 THEN 1 END) AS Underpaid,
                  COUNT(CASE WHEN basicMismatch > 0 THEN 1 END) AS Overpaid
              FROM arpan
              WHERE 
                  basicCategory = 'mismatch'  
                  AND basicMismatch != 0      
              GROUP BY month;
              `;
      } else if (selectedTab === "amount") {
        trendQuery = `
              SELECT 
                  month,
                  SUM(CASE WHEN basicMismatch < 0 THEN basicMismatch ELSE 0 END) AS Underpaid,
                  SUM(CASE WHEN basicMismatch > 0 THEN basicMismatch ELSE 0 END) AS Overpaid
              FROM arpan
              WHERE 
                  basicCategory = 'mismatch'  
                  AND basicMismatch != 0      
              GROUP BY month;
              `;
      }
    }

    // **Trend Query for Over/Under Payment** (Fetch Raw Data)
  } else if (categoryType === "Age") {
    //// Age doen't overview so trend will be shown only for count and amount
    if (selectedTab == "amount") {
      trendQuery = `SELECT 
    a.month,
    SUM(CASE WHEN DATEDIFF(YEAR, s.dateOfBirth, GETDATE()) >= 80 THEN a.totalPension ELSE 0 END) AS '80+',
    SUM(CASE WHEN DATEDIFF(YEAR, s.dateOfBirth, GETDATE()) >= 85 THEN a.totalPension ELSE 0 END) AS '85+',
    SUM(CASE WHEN DATEDIFF(YEAR, s.dateOfBirth, GETDATE()) >= 90 THEN a.totalPension ELSE 0 END) AS '90+',
    SUM(CASE WHEN DATEDIFF(YEAR, s.dateOfBirth, GETDATE()) >= 95 THEN a.totalPension ELSE 0 END) AS '95+',
    SUM(CASE WHEN DATEDIFF(YEAR, s.dateOfBirth, GETDATE()) >= 100 THEN a.totalPension ELSE 0 END) AS '100+'
FROM sbi_master s
INNER JOIN arpan a  
    ON s.ppoNumber = a.newPPONo 
    OR s.ppoNumber = a.oldPPONo
GROUP BY a.month
ORDER BY a.month;


     `;
    } else if (selectedTab == "count") {
      trendQuery = `
     SELECT 
    a.month,
    COUNT(CASE WHEN DATEDIFF(YEAR, s.dateOfBirth, GETDATE()) >= 80 THEN 1 END) AS '80+',
    COUNT(CASE WHEN DATEDIFF(YEAR, s.dateOfBirth, GETDATE()) >= 85 THEN 1 END) AS '85+',
    COUNT(CASE WHEN DATEDIFF(YEAR, s.dateOfBirth, GETDATE()) >= 90 THEN 1 END) AS '90+',
    COUNT(CASE WHEN DATEDIFF(YEAR, s.dateOfBirth, GETDATE()) >= 95 THEN 1 END) AS '95+',
    COUNT(CASE WHEN DATEDIFF(YEAR, s.dateOfBirth, GETDATE()) >= 100 THEN 1 END) AS '100+'
FROM sbi_master s
INNER JOIN arpan a  
    ON s.ppoNumber = a.newPPONo 
    OR s.ppoNumber = a.oldPPONo
GROUP BY a.month
ORDER BY a.month;

    `;
    }
  } else if (categoryType === "Age_Bracket_Movement") {
    if (selectedTab === "amount") {
      trendQuery = `
      WITH PreviousMonth AS (
          SELECT 
              CONVERT(DATE, '01/' + a.month, 103) AS prev_month, 
              s.ppoNumber,
              DATEDIFF(YEAR, s.dateOfBirth, GETDATE()) AS current_age
          FROM sbi_master s
          INNER JOIN arpan a  
              ON s.ppoNumber = a.newPPONo 
              OR s.ppoNumber = a.oldPPONo
      ),
      CurrentMonth AS (
          SELECT 
              CONVERT(DATE, '01/' + a.month, 103) AS month, 
              s.ppoNumber,
              DATEDIFF(YEAR, s.dateOfBirth, GETDATE()) AS current_age,
              a.totalPension
          FROM sbi_master s
          INNER JOIN arpan a  
              ON s.ppoNumber = a.newPPONo 
              OR s.ppoNumber = a.oldPPONo
      ),
      AllMonths AS (
          SELECT DISTINCT CONVERT(DATE, '01/' + month, 103) AS month FROM arpan
      )
      SELECT 
          FORMAT(am.month, 'MM/yyyy') AS month, 
  
          SUM(CASE WHEN c.current_age >= 80 AND p.ppoNumber IS NULL THEN c.totalPension ELSE 0 END) AS '80+',
          SUM(CASE WHEN c.current_age >= 85 AND p.ppoNumber IS NULL THEN c.totalPension ELSE 0 END) AS '85+',
          SUM(CASE WHEN c.current_age >= 90 AND p.ppoNumber IS NULL THEN c.totalPension ELSE 0 END) AS '90+',
          SUM(CASE WHEN c.current_age >= 95 AND p.ppoNumber IS NULL THEN c.totalPension ELSE 0 END) AS '95+',
          SUM(CASE WHEN c.current_age >= 100 AND p.ppoNumber IS NULL THEN c.totalPension ELSE 0 END) AS '100+'
  
      FROM AllMonths am
      LEFT JOIN CurrentMonth c ON am.month = c.month
      LEFT JOIN PreviousMonth p 
          ON c.ppoNumber = p.ppoNumber 
          AND c.month = DATEADD(MONTH, 1, p.prev_month) 
      GROUP BY am.month
      ORDER BY am.month;
      `;
    } else if (selectedTab === "count") {
      trendQuery = `
      WITH PreviousMonth AS (
          SELECT 
              CONVERT(DATE, '01/' + a.month, 103) AS prev_month, 
              s.ppoNumber,
              DATEDIFF(YEAR, s.dateOfBirth, GETDATE()) AS current_age
          FROM sbi_master s
          INNER JOIN arpan a  
              ON s.ppoNumber = a.newPPONo 
              OR s.ppoNumber = a.oldPPONo
      ),
      CurrentMonth AS (
          SELECT 
              CONVERT(DATE, '01/' + a.month, 103) AS month, 
              s.ppoNumber,
              DATEDIFF(YEAR, s.dateOfBirth, GETDATE()) AS current_age
          FROM sbi_master s
          INNER JOIN arpan a  
              ON s.ppoNumber = a.newPPONo 
              OR s.ppoNumber = a.oldPPONo
      ),
      AllMonths AS (
          SELECT DISTINCT CONVERT(DATE, '01/' + month, 103) AS month FROM arpan
      )
      SELECT 
          FORMAT(am.month, 'MM/yyyy') AS month, 
  
          COUNT(CASE WHEN c.current_age >= 80 AND p.ppoNumber IS NULL THEN 1 END) AS '80+',
          COUNT(CASE WHEN c.current_age >= 85 AND p.ppoNumber IS NULL THEN 1 END) AS '85+',
          COUNT(CASE WHEN c.current_age >= 90 AND p.ppoNumber IS NULL THEN 1 END) AS '90+',
          COUNT(CASE WHEN c.current_age >= 95 AND p.ppoNumber IS NULL THEN 1 END) AS '95+',
          COUNT(CASE WHEN c.current_age >= 100 AND p.ppoNumber IS NULL THEN 1 END) AS '100+'
  
      FROM AllMonths am
      LEFT JOIN CurrentMonth c ON am.month = c.month
      LEFT JOIN PreviousMonth p 
          ON c.ppoNumber = p.ppoNumber 
          AND c.month = DATEADD(MONTH, 1, p.prev_month) 
      GROUP BY am.month
      ORDER BY am.month;
      `;
    }
  } else if (categoryType === "New_Pensioner") {
    if (selectedGraphTab === "Overview") {
      console.log("went for pension overview");
      const previousMonth = getPreviousMonth(formattedDate);
      dataQuery = `SELECT 
    '${formattedDate}' AS month,
    CASE 
        WHEN (SELECT COUNT(*) FROM arpan WHERE month = '${previousMonth}') = 0 THEN 0
        ELSE COUNT(DISTINCT COALESCE(a.newPPONo, a.oldPPONo))
    END AS totalNewPensioners,
    CASE 
        WHEN (SELECT COUNT(*) FROM arpan WHERE month = '${previousMonth}') = 0 THEN 0
        ELSE SUM(a.totalPension)
    END AS totalNewPensionAmount
FROM arpan a
WHERE 
    a.month = '${formattedDate}'
    AND NOT EXISTS (
        SELECT 1
        FROM arpan prev
        WHERE 
            prev.month = '${previousMonth}'
            AND (
                COALESCE(a.newPPONo, a.oldPPONo) = prev.newPPONo 
                OR COALESCE(a.newPPONo, a.oldPPONo) = prev.oldPPONo
            )
    );

`;

      summaryQuery = `
       SELECT 
        SUM(ABS(${mismatchKey})) as netMismatch, 
        COUNT(CASE WHEN ${categoryKey} IS NULL THEN 1 END) as unlinkedCases,
        SUM(CASE WHEN ${categoryKey} IS NULL THEN ABS(${mismatchKey}) END) as unlinkedAmount,
        (COUNT(CASE WHEN ${categoryKey} IS NULL THEN 1 END) * 100.0) / NULLIF(COUNT(*), 0) as unlinkedPercentage
      FROM arpan 
      WHERE month = '${formattedDate}'
    `;
    } else if (selectedGraphTab === "Trend") {
      trendQuery = `WITH OrderedMonths AS (
  SELECT 
    month,
    CAST('01/' + month AS DATE) AS month_date,
    LAG(month) OVER (ORDER BY CAST('01/' + month AS DATE)) AS PrevMonth
  FROM (SELECT DISTINCT month FROM arpan) AS m
),
Calculated AS (
  SELECT 
    om.month,
    CASE 
      WHEN om.PrevMonth IS NULL THEN 0
      ELSE (
        SELECT COUNT(DISTINCT COALESCE(a.newPPONo, a.oldPPONo))
        FROM arpan a
        WHERE a.month = om.month
          AND NOT EXISTS (
            SELECT 1
            FROM arpan p
            WHERE p.month = om.PrevMonth
              AND (
                COALESCE(a.newPPONo, a.oldPPONo) = p.newPPONo 
                OR COALESCE(a.newPPONo, a.oldPPONo) = p.oldPPONo
              )
          )
      )
    END AS NewPensioners,
    CASE 
      WHEN om.PrevMonth IS NULL THEN 0
      ELSE (
        SELECT CAST(SUM(a.totalPension) AS DECIMAL(18,2))
        FROM arpan a
        WHERE a.month = om.month
          AND NOT EXISTS (
            SELECT 1
            FROM arpan p
            WHERE p.month = om.PrevMonth
              AND (
                COALESCE(a.newPPONo, a.oldPPONo) = p.newPPONo 
                OR COALESCE(a.newPPONo, a.oldPPONo) = p.oldPPONo
              )
          )
      )
    END AS NewPensionAmount,
    om.month_date
  FROM OrderedMonths om
)
SELECT month, NewPensioners, NewPensionAmount
FROM Calculated
WHERE NewPensioners <> 0
ORDER BY month_date;

`;
    }
  } else if (categoryType === "Stopped_Pensioner") {
    if (selectedGraphTab === "Overview") {
      console.log("went for pension overview");
      const previousMonth = getPreviousMonth(formattedDate);
      console.log("this is the previousmonth");
      console.log(formattedDate);

      console.log(previousMonth);

      dataQuery = `
SELECT 
    '${formattedDate}' AS month,
    COUNT(DISTINCT COALESCE(prev.newPPONo, prev.oldPPONo)) AS totalStoppedPensioners,
    SUM(prev.totalPension) AS totalStoppedPensionAmount
FROM arpan prev
WHERE 
    prev.month = '${previousMonth}'
    AND NOT EXISTS (
        SELECT 1
        FROM arpan a
        WHERE 
            a.month = '${formattedDate}'
            AND (
                COALESCE(prev.newPPONo, prev.oldPPONo) = a.newPPONo 
                OR COALESCE(prev.newPPONo, prev.oldPPONo) = a.oldPPONo
            )
    );

`;

      summaryQuery = `
       SELECT 
        SUM(ABS(${mismatchKey})) as netMismatch, 
        COUNT(CASE WHEN ${categoryKey} IS NULL THEN 1 END) as unlinkedCases,
        SUM(CASE WHEN ${categoryKey} IS NULL THEN ABS(${mismatchKey}) END) as unlinkedAmount,
        (COUNT(CASE WHEN ${categoryKey} IS NULL THEN 1 END) * 100.0) / NULLIF(COUNT(*), 0) as unlinkedPercentage
      FROM arpan 
      WHERE month = '${formattedDate}'
    `;
    } else if (selectedGraphTab === "Trend") {
      trendQuery = `stopped pensioner trend`;
    }
  } else if (categoryType === "Active_Pensioners") {
    console.log("went for the active");

    if (selectedGraphTab === "Overview") {
      const previousMonth = getPreviousMonth(formattedDate);
      dataQuery = `SELECT 
    '${formattedDate}' AS month,
    COUNT(DISTINCT COALESCE(a.newPPONo, a.oldPPONo)) AS ActivePensioners,
    SUM(a.totalPension) AS ActivePensionAmount
FROM arpan a
WHERE 
    a.month = '${formattedDate}'
    AND EXISTS (
        SELECT 1
        FROM arpan prev
        WHERE 
            prev.month = '${previousMonth}'
            AND (
                COALESCE(prev.newPPONo, prev.oldPPONo) = a.newPPONo 
                OR COALESCE(prev.newPPONo, prev.oldPPONo) = a.oldPPONo
            )
    );
`;
      summaryQuery = `
SELECT 
 SUM(ABS(${mismatchKey})) as netMismatch, 
 COUNT(CASE WHEN ${categoryKey} IS NULL THEN 1 END) as unlinkedCases,
 SUM(CASE WHEN ${categoryKey} IS NULL THEN ABS(${mismatchKey}) END) as unlinkedAmount,
 (COUNT(CASE WHEN ${categoryKey} IS NULL THEN 1 END) * 100.0) / NULLIF(COUNT(*), 0) as unlinkedPercentage
FROM arpan 
WHERE month = '${formattedDate}'
`;
    } else if (selectedGraphTab === "Trend") {
      trendQuery = `active pensioner trend`;
    }
  } else if (categoryType === "Family_Pension_Transition") {
    console.log("went for family pesion");

    const previousMonth = getPreviousMonth(formattedDate);
    if (selectedGraphTab === "Overview") {
      dataQuery = `
SELECT 
    month AS formattedMonth,
    COUNT(*) AS TransitionCount,
    SUM(totalPension) AS TransitionAmount
FROM arpan a
WHERE LOWER(typeOfPension) = 'f'
  AND month = '${formattedDate}'
  AND EXISTS (
      SELECT 1
      FROM (
          SELECT oldPPONo AS PPONo FROM arpan 
          WHERE LOWER(typeOfPension) = 'r' 
            AND month = '${previousMonth}'
          UNION
          SELECT newPPONo AS PPONo FROM arpan 
          WHERE LOWER(typeOfPension) = 'r' 
            AND month = '${previousMonth}'
      ) t
      WHERE t.PPONo = a.oldPPONo OR t.PPONo = a.newPPONo
  )
GROUP BY month;

    `;
      summaryQuery = `
    SELECT 
      SUM(ABS(${mismatchKey})) as netMismatch, 
      COUNT(CASE WHEN ${categoryKey} IS NULL THEN 1 END) as unlinkedCases,
      SUM(CASE WHEN ${categoryKey} IS NULL THEN ABS(${mismatchKey}) END) as unlinkedAmount,
      (COUNT(CASE WHEN ${categoryKey} IS NULL THEN 1 END) * 100.0) / NULLIF(COUNT(*), 0) as unlinkedPercentage
    FROM arpan 
    WHERE month = '${formattedDate}'
  `;
    } else if (selectedGraphTab === "Trend") {
      trendQuery = `family pensioner transition trend`;
    }
  } else if (categoryType === "Family_pension") {
    ////// When Pie chart (overview is selected )---------------------------------/
    if (selectedGraphTab === "Overview") {
      if (selectedTab === "count") {
        dataQuery = `
SELECT LOWER(a.typeOfPension) AS pensionType, COUNT(*) AS totalCount
FROM arpan a
WHERE LOWER(a.typeOfPension) IN ('r', 'f') 
  AND a.month = '${formattedDate}'
GROUP BY LOWER(a.typeOfPension);

        `;
      } else if (selectedTab === "amount") {
        dataQuery = `
SELECT LOWER(a.typeOfPension) AS pensionType, SUM(a.totalPension) AS totalAmount
FROM arpan a
WHERE LOWER(a.typeOfPension) IN ('r', 'f') 
  AND a.month = '${formattedDate}'
GROUP BY LOWER(a.typeOfPension);

        `;
      }
      summaryQuery = `
        SELECT 
          SUM(ABS(${mismatchKey})) as netMismatch, 
          COUNT(CASE WHEN ${categoryKey} IS NULL THEN 1 END) as unlinkedCases,
          SUM(CASE WHEN ${categoryKey} IS NULL THEN ABS(${mismatchKey}) END) as unlinkedAmount,
          (COUNT(CASE WHEN ${categoryKey} IS NULL THEN 1 END) * 100.0) / NULLIF(COUNT(*), 0) as unlinkedPercentage
        FROM arpan 
        WHERE month = '${formattedDate}'
      `;
    } else if (selectedGraphTab === "Trend") {
      if (selectedTab === "amount") {
        trendQuery = `
          SELECT 
    a.month, 
    SUM(CASE WHEN LOWER(a.typeOfPension) = 'r' THEN a.totalPension ELSE 0 END) AS Regular, 
    SUM(CASE WHEN LOWER(a.typeOfPension) = 'f' THEN a.totalPension ELSE 0 END) AS Family
FROM arpan a
WHERE LOWER(a.typeOfPension) IN ('r', 'f')
GROUP BY a.month
ORDER BY a.month;

       
         `;
      } else if (selectedTab === "count") {
        trendQuery = `SELECT 
    a.month, 
    COUNT(CASE WHEN LOWER(a.typeOfPension) = 'r' THEN 1 END) AS Regular, 
    COUNT(CASE WHEN LOWER(a.typeOfPension) = 'f' THEN 1 END) AS Family
FROM arpan a
WHERE LOWER(a.typeOfPension) IN ('r', 'f')
GROUP BY a.month
ORDER BY a.month;
`;
      }
    }
  } else {
    //// Here when tab is pie chart (overview )--------------------------------/
    if (selectedGraphTab === "Overview") {
      if (selectedTab === "amount") {
        dataQuery = `SELECT 
            CASE 
              WHEN ${categoryKey} = 'mismatch' THEN 
                CASE 
                  WHEN ${mismatchKey} < 0 THEN 'underpaid' 
                  ELSE 'overpaid' 
                END
              ELSE ${categoryKey} 
            END AS basicCategory,
            SUM(ABS(${mismatchKey})) AS totalAmount
          FROM arpan 
          WHERE month = '${formattedDate}' 
          GROUP BY 
            CASE 
              WHEN ${categoryKey} = 'mismatch' THEN 
                CASE 
                  WHEN ${mismatchKey} < 0 THEN 'underpaid' 
                  ELSE 'overpaid' 
                END
              ELSE ${categoryKey} 
            END`;
      } else if (selectedTab === "count") {
        dataQuery = `SELECT 
            CASE 
              WHEN ${categoryKey} = 'mismatch' THEN 
                CASE 
                  WHEN ${mismatchKey} < 0 THEN 'underpaid' 
                  ELSE 'overpaid' 
                END
              ELSE ${categoryKey} 
            END AS basicCategory,
            COUNT(*) AS totalCount
          FROM arpan 
          WHERE month = '${formattedDate}' 
          GROUP BY 
            CASE 
              WHEN ${categoryKey} = 'mismatch' THEN 
                CASE 
                  WHEN ${mismatchKey} < 0 THEN 'underpaid' 
                  ELSE 'overpaid' 
                END
              ELSE ${categoryKey} 
            END`;
      }

      summaryQuery = `
        SELECT 
          SUM(ABS(${mismatchKey})) as netMismatch, 
          COUNT(CASE WHEN ${categoryKey} IS NULL THEN 1 END) as unlinkedCases,
          SUM(CASE WHEN ${categoryKey} IS NULL THEN ABS(${mismatchKey}) END) as unlinkedAmount,
          (COUNT(CASE WHEN ${categoryKey} IS NULL THEN 1 END) * 100.0) / NULLIF(COUNT(*), 0) as unlinkedPercentage
        FROM arpan 
        WHERE month = '${formattedDate}'
      `;
    }
    if (selectedGraphTab === "Trend") {
      // **Trend Query for Over/Under Payment** (Fetch Raw Data)
      if (selectedTab === "amount") {
        trendQuery = `
          SELECT 
              month,
              CASE 
                  WHEN ${categoryKey} = 'mismatch' THEN 
                      CASE 
                          WHEN ${mismatchKey} < 0 THEN 'underpaid' 
                          ELSE 'overpaid' 
                      END
                  ELSE ${categoryKey} 
              END AS category,
              SUM(${mismatchKey}) AS total
          FROM arpan
          GROUP BY 
              month, 
              CASE 
                  WHEN ${categoryKey} = 'mismatch' THEN 
                      CASE 
                          WHEN ${mismatchKey} < 0 THEN 'underpaid' 
                          ELSE 'overpaid' 
                      END
                  ELSE ${categoryKey} 
              END;
        `;
      } else if (selectedTab === "count") {
        trendQuery = `
          SELECT 
              month,
              CASE 
                  WHEN ${categoryKey} = 'mismatch' THEN 
                      CASE 
                          WHEN ${mismatchKey} < 0 THEN 'underpaid' 
                          ELSE 'overpaid' 
                      END
                  ELSE ${categoryKey} 
              END AS category,
              COUNT(*) AS total
          FROM arpan
          GROUP BY 
              month, 
              CASE 
                  WHEN ${categoryKey} = 'mismatch' THEN 
                      CASE 
                          WHEN ${mismatchKey} < 0 THEN 'underpaid' 
                          ELSE 'overpaid' 
                      END
                  ELSE ${categoryKey} 
              END;
        `;
      }
    }
  }

  return { summaryQuery, dataQuery, categoryKey, trendQuery };
}
function processChartData(
  categoryType: string,
  dataResponse: any,
  selectedTab: string
): { overViewData: any[] | null; uniqueCategories: string[] | null } {
  try {
    let overViewData: any[] = [];
    let uniqueCategories: string[] = [];

    if (categoryType === "Basic" || categoryType === "Commutation") {
      // Processing Basic and Commutation data
      if (dataResponse?.data) {
        overViewData = dataResponse.data
          .map((item: any) => ({
            name: item.basicCategory || item.commutationCategory,
            value:
              selectedTab === "amount" ? item.totalAmount : item.totalCount,
          }))
          .filter((item: any) => item.value > 0);

        uniqueCategories = overViewData.map((item) => item.name);
      }
    } else if (categoryType === "over_under_payment") {
      // Processing Over/Under Payment data

      if (dataResponse?.data) {
        const { overpaidCount, totalOverpaid, underpaidCount, totalUnderpaid } =
          dataResponse.data[0];

        overViewData = [
          {
            name: "Overpaid Cases",
            value: selectedTab === "amount" ? totalOverpaid : overpaidCount,
          },
          {
            name: "Underpaid Cases",
            value: selectedTab === "amount" ? totalUnderpaid : underpaidCount,
          },
        ].filter((item) => item.value > 0);

        uniqueCategories = overViewData.map((item) => item.name);
      }
    } else if (categoryType === "Family_pension") {
      // Processing Family Pension Data
      if (dataResponse?.data) {
        overViewData = dataResponse.data
          .map((item: any) => ({
            name:
              item.pensionType?.toUpperCase() === "R"
                ? "Regular Pension"
                : "Family Pension",
            value:
              selectedTab === "amount" ? item.totalAmount : item.totalCount,
          }))
          .filter((item: any) => item.value > 0);

        uniqueCategories = overViewData.map((item) => item.name);
      }
    } else if (categoryType === "New_Pensioner") {
      // Processing New Pensioner Data
      if (dataResponse?.data) {
        const { totalNewPensioners, totalNewPensionAmount } =
          dataResponse.data[0];

        overViewData = [
          {
            name: "New Pensioners",
            value:
              selectedTab === "amount"
                ? totalNewPensionAmount
                : totalNewPensioners,
          },
        ].filter((item) => item.value > 0);

        uniqueCategories = overViewData.map((item) => item.name);
      }
    } else if (categoryType === "Active_Pensioners") {
      if (dataResponse?.data) {
        const { ActivePensioners, ActivePensionAmount } = dataResponse.data[0];

        overViewData = [
          {
            name: "Active Pensioners",
            value:
              selectedTab === "amount" ? ActivePensionAmount : ActivePensioners,
          },
        ].filter((item) => item.value > 0);

        uniqueCategories = overViewData.map((item) => item.name);
      }
    } else if (categoryType === "Stopped_Pensioner") {
      // Processing New Pensioner Data
      if (dataResponse?.data) {
        const { totalStoppedPensioners, totalStoppedPensionAmount } =
          dataResponse.data[0];

        overViewData = [
          {
            name: "Stopped Pensioners",
            value:
              selectedTab === "amount"
                ? totalStoppedPensionAmount
                : totalStoppedPensioners,
          },
        ].filter((item) => item.value > 0);

        uniqueCategories = overViewData.map((item) => item.name);
      }
    } else if (categoryType === "Family_Pension_Transition") {
      // Processing New Pensioner Data
      if (dataResponse?.data) {
        const { TransitionAmount, TransitionCount } = dataResponse.data[0];

        overViewData = [
          {
            name: "Family Pensioner Transition",
            value:
              selectedTab === "amount" ? TransitionAmount : TransitionCount,
          },
        ].filter((item) => item.value > 0);

        uniqueCategories = overViewData.map((item) => item.name);
      }
    }

    return { overViewData, uniqueCategories };
  } catch (error) {
    return { overViewData: [], uniqueCategories: [] };
  }
}

export function useDynamicQuery({
  categoryType,
  selectedDate,
  selectedTab,
  reloadGraph,
  selectedGraphTab,
}: any) {
  const [data, setData] = useState({
    overview: [],
    trend: [],
    summaryData: {
      netMismatch: 0,
      unlinkedCases: 0,
      unlinkedAmount: 0,
      unlinkedPercentage: 0,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchDynamicData = async () => {
      setLoading(true);
      setError(null);

      // Format the date string (adjust formatting as necessary)
      const formattedDate = `${monthMap[selectedDate.month]}/${
        selectedDate.year
      }`;
      if (selectedGraphTab === "Overview") {
        // Get the query data for Overview
        const getQueryData = generateQuery(
          selectedGraphTab,
          categoryType,
          selectedTab,
          formattedDate
        );

        const { summaryQuery, dataQuery, categoryKey } = getQueryData;

        // Execute queries in parallel
        const [dataResponse, summaryResponse] = await Promise.all([
          csvService.getQueryData(dataQuery),
          csvService.getQueryData(summaryQuery),
        ]);

        console.log("Overview Data Response:", dataResponse);
        console.log(summaryResponse);

        const formattedData: any = processChartData(
          categoryType,
          dataResponse,
          selectedTab
        );

        setUniqueCategories(formattedData.uniqueCategories);
        setData((prev) => ({
          ...prev,
          overview: formattedData.overViewData,
          summaryData: {
            netMismatch: summaryResponse?.data[0]?.netMismatch || 0,
            unlinkedCases: summaryResponse?.data[0]?.unlinkedCases || 0,
            unlinkedAmount: summaryResponse?.data[0]?.unlinkedAmount || 0,
            unlinkedPercentage: parseFloat(
              (summaryResponse?.data[0]?.unlinkedPercentage || 0).toFixed(2)
            ),
          },
        }));
      } else if (selectedGraphTab === "Trend") {
        // Fetch data for Trend
        const trendQuery = generateQuery(
          selectedGraphTab,
          categoryType,
          selectedTab,
          formattedDate
        ).trendQuery;

        const trendResponse = await csvService.fetchData(trendQuery);
        console.log("Trend Data Response:", trendResponse);

        if (trendResponse.success) {
          const { lineData, uniqueCategories } = processTrendData(
            categoryType,
            trendResponse.data.arpan,
            selectedTab
          );

          setData((prev: any) => ({
            ...prev,
            trend: lineData,
          }));
          setUniqueCategories(uniqueCategories);
        } else {
          setData({
            overview: [],
            trend: [],
            summaryData: {
              netMismatch: 0,
              unlinkedCases: 0,
              unlinkedAmount: 0,
              unlinkedPercentage: 0,
            },
          });
          setUniqueCategories([]);
        }
      }

      setLoading(false);
    };

    fetchDynamicData();
  }, [categoryType, selectedDate, selectedTab, reloadGraph, selectedGraphTab]);

  return { data, uniqueCategories, loading, error };
}

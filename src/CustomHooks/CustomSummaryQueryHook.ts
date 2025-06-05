import { useState, useEffect } from "react";
import { csvService } from "../services/csv.service";
import { generateSummaryQuery } from "../utils/otherUtils";

interface SummaryData {
  netMismatch: number;
  unlinkedCases: number;
  unlinkedAmount: number;
  unlinkedPercentage: number;
}

export const useSummaryQuery = (selectedDate: any) => {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaryQuery = async () => {
      setSummaryLoading(true);
      setError(null);

      try {
        const formattedDate = `${String(
          selectedDate.month.indexOf(selectedDate.month) + 1
        ).padStart(2, "0")}/${selectedDate.year}`;

        const generatedQuery = generateSummaryQuery("Basic", formattedDate);
        const summaryResponse = await csvService.getQueryData(generatedQuery);

        if (summaryResponse) {
          setSummaryData({
            netMismatch: summaryResponse?.data[0]?.netMismatch || 0,
            unlinkedCases: summaryResponse?.data[0]?.unlinkedCases || 0,
            unlinkedAmount: summaryResponse?.data[0]?.unlinkedAmount || 0,
            unlinkedPercentage: parseFloat(
              (summaryResponse?.data[0]?.unlinkedPercentage || 0).toFixed(2)
            ),
          });
        }
      } catch (err: any) {
        setError(err.message || "Error fetching data");
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchSummaryQuery();
  }, [selectedDate]); // Dependency on selectedDate ensures re-fetching when it changes

  return { summaryData, summaryLoading, error };
};

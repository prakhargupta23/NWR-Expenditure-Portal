import { useEffect, useState } from "react";
import { getMonthYear } from "../utils/otherUtils";

type FetchBarDataHookParams = {
  service: any;
  type: string;
  selectedDate: { month: any; year: any };
  method: "getTransactionBarData" | "getRecoverableData" | "getRecoverableBarData"; // or make it more generic
  dependencies?: any[];
};

export const useFetchBarDataWithRetry = ({
  service,
  type,
  selectedDate,
  method,
  dependencies = [],
}: FetchBarDataHookParams) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDataWithRetry = async (retries = 2) => {
      setLoading(true);

      try {
        const selectedMonthYear = getMonthYear(
          selectedDate.month,
          selectedDate.year
        );
        const response = await service[method](type, selectedMonthYear);

        if (response?.status === 500) {
          throw new Error("Internal Server Error");
        }

        if (response) {
          setData([...response.data]);
        }
      } catch (err) {
        if (retries > 0) {
          fetchDataWithRetry(retries - 1);
        } else {
          console.error(`${method} failed after multiple attempts:`, err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDataWithRetry();
  }, [type, selectedDate, ...dependencies]);

  return { data, loading };
};

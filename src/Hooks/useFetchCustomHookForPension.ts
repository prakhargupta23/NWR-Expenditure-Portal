import { useEffect, useState } from "react";

type FetchDataHookParams = {
  service: any;
  method: string;
  params?: any[]; // optional parameters for the service call
  dependencies?: any[];
};

export const useFetchDataForPensionWithRetry = ({
  service,
  method,
  params = [],
  dependencies = [],
}: FetchDataHookParams) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDataWithRetry = async (retries = 2) => {
      setLoading(true);

      try {
        const response = await service[method](...params);

        if (response?.status === 500) {
          throw new Error("Internal Server Error");
        }

        if (response) {
          setData([...response.data]);
        }
      } catch (err) {
        if (retries > 0) {
          console.warn(`Retrying... Attempts left: ${retries}`);
          fetchDataWithRetry(retries - 1);
        } else {
          console.error(`${method} failed after multiple attempts:`, err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDataWithRetry();
  }, dependencies);

  return { data, loading };
};

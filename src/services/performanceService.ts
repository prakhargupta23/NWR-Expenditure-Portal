import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

export interface PerformanceData {
  Division: string;
  Description: string;
  MonthYear: string;
  Cumulative_Target: number;
  Cumulative_Actual_CFY: number;
  Cumulative_Actual_Last_Year: number;
  Target: number;
  Actual_CFY: number;
  Actual_Last_Year: number;
}

export interface PerformanceResponse {
  count: number;
  data: PerformanceData[];
}

export const fetchPerformanceData = async (
  monthYear: string,
  division: string
): Promise<PerformanceData[]> => {
  try {
    const params = new URLSearchParams();
    params.append('type', 'Earning');
    params.append('date', monthYear);
    params.append('division', division);

    const response = await axios.get(`${API_BASE_URL}/get-transaction-data?${params.toString()}`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching performance data:', error);
    throw error;
  }
};

export const fetchVarianceData = async (
  divisions: string[],
  categories: string[],
  metrics: string[],
  monthYear: string
): Promise<PerformanceData[]> => {
  try {
    const params = new URLSearchParams();
    params.append('type', 'Earning');
    params.append('date', monthYear);
    params.append('divisions', JSON.stringify(divisions));

    const response = await axios.get(`${API_BASE_URL}/get-transaction-data?${params.toString()}`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching variance data:', error);
    throw error;
  }
};

export const getAvailableMonths = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/GetPerformanceData`);
    const data = response.data.data as PerformanceData[];
    
    const months = new Set<string>();
    data.forEach(item => {
      months.add(item.MonthYear);
    });
    
    return Array.from(months).sort().reverse();
  } catch (error) {
    console.error('Error fetching available months:', error);
    throw error;
  }
}; 
import { fetchWrapper } from "../helpers/fetch-wrapper";
import { config } from "../shared/constants/config";
import axios from "axios";

/// Exporting all the function for the ab testing -----------------------/
export const sqlService = {
  fetchBasicAndCommutationData,
  fetchAgeData,
  fetchNewPensionerData,
  fetchStoppedPensionerData,
  downloadTrendCsvData,
  fetchActivePensionerData,
  downloadTotalCsvData,
  fetchFamilyPensionTransitionData,
  fetchFamilyPensionData,
  fetchAgeBracketData,
  downloadCsvData,
  downloadDynamicCsvData,
  downloadPieCsvData,
  getTransactionData,
};

//// Funciton for fetching all the experiments ---------------------------/
async function fetchBasicAndCommutationData(category: string) {
  return fetchWrapper.get(
    `${config.apiUrl}/api/get-basic-data?category=${category}`
  );
}
//// Funciton for fetching all the experiments ---------------------------/
async function fetchAgeData(month: string) {
  return fetchWrapper.get(`${config.apiUrl}/api/get-age-data`);
}
//// Funciton for fetching all the experiments ---------------------------/
async function fetchNewPensionerData() {
  return fetchWrapper.get(`${config.apiUrl}/api/get-newPensioner-data`);
}
//// Funciton for fetching all the experiments ---------------------------/
async function fetchStoppedPensionerData() {
  return fetchWrapper.get(`${config.apiUrl}/api/get-stoppedPensioner-data`);
}
//// Funciton for fetching all the experiments ---------------------------/
async function fetchActivePensionerData() {
  return fetchWrapper.get(`${config.apiUrl}/api/get-activePensioners-data`);
}
//// Funciton for fetching all the experiments ---------------------------/
async function fetchFamilyPensionTransitionData() {
  return fetchWrapper.get(
    `${config.apiUrl}/api/get-familyTransitionPensioners-data`
  );
}
//// Funciton for fetching all the experiments ---------------------------/
async function fetchFamilyPensionData() {
  return fetchWrapper.get(`${config.apiUrl}/api/get-family-pension`);
}
//// Funciton for fetching all the experiments ---------------------------/
async function fetchAgeBracketData() {
  return fetchWrapper.get(`${config.apiUrl}/api/get-agebracketgraph-data`);
}

//// Funciton for fetching all the experiments ---------------------------/
async function downloadCsvData() {
  return fetchWrapper.postZip(`${config.apiUrl}/api/download-csv-data`, {});
}

//// Funciton for deleting graph data ---------------------------/
async function downloadDynamicCsvData() {
  return fetchWrapper.postZip(`${config.apiUrl}/api/download-csv-data`, {});
}

//// Funciton for downloading the pie csv data ---------------------------/
async function downloadPieCsvData(data: any) {
  return fetchWrapper.post(`${config.apiUrl}/api/get-piecsv-data`, { data });
}

async function downloadTrendCsvData(data: any) {
  return fetchWrapper.post(`${config.apiUrl}/api/get-trenddownload-data`, {
    data,
  });
}
//// Function for downloading the total csv data -----------------------/
async function downloadTotalCsvData(month: any) {
  return fetchWrapper.get(
    `${config.apiUrl}/api/get-comparisoncsv-data?month=${month}`
  );
}

async function getTransactionData(type: string) {
  try {
    const response = await axios.get(`${config.apiUrl}/get-transaction-data?type=${type}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction data:', error);
    throw error;
  }
}

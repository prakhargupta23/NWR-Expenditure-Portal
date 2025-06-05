import { fetchWrapper } from "../helpers/fetch-wrapper";
import { config } from "../shared/constants/config";

/// Exporting all the function for the ab testing -----------------------/
export const transactionService = {
  uploadTransactionData,
  getTransactionBarData,
  getTransactionDocData,
  getRecoverableBarData,
  getReportData,
};

//// Funciton for fetching all the experiments ---------------------------/
async function uploadTransactionData(data: any) {
  return fetchWrapper.post(`${config.apiUrl}/api/upload-transaction-data`, {
    data,
  });
}
//// Function for getting the transaction bar data -----------------------/

async function getTransactionBarData(type: string, date: string) {
  // Format the date properly for the API
  const formattedDate = date ? `${date}` : "01/2025"; // Default to January 2025 if no date provided
  return fetchWrapper.get(
    `${config.apiUrl}/api/get-transaction-data?type=${type}&date=${formattedDate}`
  );
}

async function getRecoverableBarData(type: string, date: string) {
  // Format the date properly for the API
  const formattedDate = "02/2025";
  type="Recoverable" // Default to January 2025 if no date provided
  return fetchWrapper.get(
    `${config.apiUrl}/api/get-transaction-data?type=${type}&date=${formattedDate}`
  );
}
//// Function for getting the transaction doc data -----------------------/

async function getTransactionDocData(
  division: string,
  date: string,
  sheetName?: any
) {
  if (sheetName) {
    return fetchWrapper.get(
      `${config.apiUrl}/api/get-doc-data?division=${division}&date=${date}&sheetName=${sheetName}`
    );
  } else {
  }
}

//// Function for getting the pfa report data ------------------------------------------/
async function getReportData(date: any) {
  // console.log("wwlgfadhKJSLJDSKWJDFS",fetchWrapper.get(`${config.apiUrl}/api/get-report-data?date=${date}`));
  return fetchWrapper.get(`${config.apiUrl}/api/get-report-data?date=${date}`);
}

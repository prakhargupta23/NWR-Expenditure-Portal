import { fetchWrapper } from "../helpers/fetch-wrapper";
import { config } from "../shared/constants/config";

/// Exporting all the function for the ab testing -----------------------/
export const csvService = {
  fetchData,
  insertCsvData,
  getQueryData,
  insertTrendData,
  deleteSql,
  insertSbiCsvData,
};

//// Funciton for fetching all the experiments ---------------------------/
async function fetchData(trendQuery: any) {
  return fetchWrapper.post(`${config.apiUrl}/api/get-data`, {
    query: trendQuery,
  });
}
/// Function for deleting the sql data ------------------------------------/
async function deleteSql() {
  return fetchWrapper.delete(`${config.apiUrl}/api/delete-sql-data`);
}

//// Funciton for creating new experiments ---------------------------/
async function insertCsvData(data: any, tableName: string, month: string) {
  console.log("called till here");

  return fetchWrapper.post(`${config.apiUrl}/api/insert-csv-data`, {
    data,
    tableName,
    month,
  });
}
async function insertTrendData(data: any, tableName: string, month: string) {
  console.log("called till here");

  return fetchWrapper.post(`${config.apiUrl}/api/upload-trend-data`, {
    data,
    tableName,
    month,
  });
}

//// function for getting the particular data from csv using query-----/
async function getQueryData(query: string) {
  return fetchWrapper.post(`${config.apiUrl}/api/get-query-data`, {
    query,
  });
}

async function insertSbiCsvData(data: any, month: string) {
  console.log("called till here");

  return fetchWrapper.post(`${config.apiUrl}/api/insert-sbicsv-data`, {
    data,

    month,
  });
}

import { fetchWrapper } from "../helpers/fetch-wrapper";
import { config } from "../shared/constants/config";

/// Exporting all the function for the ab testing -----------------------/
export const recoverableService = {
  uploadRecoverableData,
  getRecoverableData,
};

//// Funciton for fetching all the experiments ---------------------------/
async function uploadRecoverableData(data: any) {
  return fetchWrapper.post(`${config.apiUrl}/api/create-recoverable`, {
    data,
  });
}
//// Function for getting the transaction bar data -----------------------/

async function getRecoverableData(type: string, date: string) {
  return fetchWrapper.get(
    `${config.apiUrl}/api/get-recoverable-data?type=${type}&date=${date}`
  );
}

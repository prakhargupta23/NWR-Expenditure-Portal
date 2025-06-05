import { fetchWrapper } from "../helpers/fetch-wrapper";
import { config } from "../shared/constants/config";

/// Exporting all the function for the ab testing -----------------------/
export const commentService = {
  uploadCommentData,
};

//// Funciton for fetching all the experiments ---------------------------/
async function uploadCommentData(data: any) {
  return fetchWrapper.post(`${config.apiUrl}/api/update-comment`, {
    data,
  });
}

import { fetchWrapper } from "../helpers/fetch-wrapper";
import { config } from "../shared/constants/config";

/// Exporting all the function for the ab testing -----------------------/
export const aiService = {
  fetchGptDetails,
  getChatResponse,
  updateAiPrompt,
};

//// Funciton for fetching all the experiments ---------------------------/
async function fetchGptDetails() {
  return fetchWrapper.get(`${config.apiUrl}/api/get-gpt-details`);
}

async function getChatResponse(
  query: string,
  pageName: string,
  threadId?: string
) {
  return fetchWrapper.post(
    `${config.apiUrl}/api/get-final-result?pageName=${pageName}`,
    {
      query,
      threadId,
    }
  );
}

/// Function for updating the ai chat prompt -----------------------------/
async function updateAiPrompt(promptData: any) {
  return fetchWrapper.put(`${config.apiUrl}/api/update-aichat-prompt`, {
    promptData,
  });
}

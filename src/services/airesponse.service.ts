import { AzureOpenAI } from "openai";

// Ensure required environment variables are set
const requiredEnvVars = ["azureOpenAiGpt4oKey", "azureOpenAiDalleUrl"];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar])
    throw new Error(`Missing environment variable: ${envVar}`);
});

// Get environment variables
const azureOpenAIKey = process.env.REACT_APP_AZURE_OPENAI_KEY || "89d534b4eaee4a7d87b15d2c62f32254";
const azureOpenAIEndpoint = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT || "https://reshape-azure-openai-eastus.openai.azure.com";
const azureOpenAIDeployment = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT || "gpt-4o";
const openAIVersion = process.env.REACT_APP_AZURE_OPENAI_VERSION || "2025-01-01-preview";

// Initialize OpenAI client
const openAIClient = new AzureOpenAI({
  endpoint: azureOpenAIEndpoint,
  apiKey: azureOpenAIKey,
  apiVersion: openAIVersion,
});

export async function getGpt4oResponse(prompt: string, data: any) {
  try {
    const response = await openAIClient.chat.completions.create({
      model: azureOpenAIDeployment, // Must match deployment name in Azure
      response_format: {
        type: "json_object", // Specify the response format
      }, // Specify the response format
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: JSON.stringify(data) },
      ],
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty response from GPT-4o");
    console.log(content);
    return JSON.parse(content);
  } catch (error: any) {
    console.error(
      "Azure OpenAI GPT-4o Error:",
      error?.response?.data || error.message
    );
    throw new Error("Failed to get GPT-4o response");
  }
}

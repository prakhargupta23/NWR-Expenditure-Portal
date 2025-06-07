import axios from 'axios';
import { getGpt4oResponse } from './airesponse.service';
import { fetchWrapper } from "../helpers/fetch-wrapper";
import { config } from "../shared/constants/config";
import { ResponseStream } from 'openai/lib/responses/ResponseStream';


const API_URL = "https://nwr-pension-2025.azurewebsites.net";

// Document type keys for GPT verification
const documentKeys = {
  "ReceiptNote": {
    description: "Please extract the following specific fields from the provided PDF document and return the result as a JSON object using the exact key names listed: R/Note-No., Date, Vendor Code, Supplier Name, Supplier Address, PL No., R.O.No., R.O.Date, RN Quantity, Rate, Value, P.O.Sr. No., Freight, Inspection Details, Inspection agency, IC no., dated, Challan/invoice no., Date, Qty. Invoiced, Qty. Received, Qty. Accepted, and Qty. Rejected. Ensure each of these keys is assigned a corresponding value from the document. If any value is missing or cannot be identified, assign it a value of null. The output should contain only the extracted values in a properly structured JSON format without any explanation, summary, or extra content. Maintain the original format of dates, quantities, and other numeric values as they appear in the document.Return all the values in string format"
    // description: "Please extract the following specific fields from the provided document and return the result as a JSON object using the exact key names listed: DRR No.,DRR Date,Challan No.,Challan Date,Adv Payment.Ensure each of these keys is assigned a corresponding value from the document. If any value is missing or cannot be identified, assign it a value of null. The output should contain only the extracted values in a properly structured JSON format without any explanation, summary, or extra content. Maintain the original format of dates, quantities, and other numeric values as they appear in the document.Return all the values in string format"
  },
  "TaxInvoice": {
    description: "Please extract the following fields from the provided PDF document and return the result as a JSON object using the exact key names listed: Supplier Name, Supplier Address, GST No., Supplier PAN, CIN, Invoice No., Date, Qty, Rate, Freight Charges, Amount, GST Amount, Total Amount, Destination, Dispatched through, e-Way Bill no., Bill of Landing/LR-RR No., and HSN Code. Ensure that each key is mapped to its corresponding value exactly as it appears in the document. If any value is missing or unclear, assign null to that key. Retain all formatting for dates, numbers, and codes as shown in the source. The output must be a clean JSON object containing only the specified key-value pairs, without any extra text or explanation.Return all the values in string format"
  },
  "GSTInvoice": {
    description: "Please extract the following specific fields from the given PDF document of a GSSt Invoice and return the result as a JSON object. The fields to extract are: Tax invoice no., Tax invoice date, Invoice Amount, Rnote no., Rnote date, RO No., RO Date, Rnote Qty, Rnote Value, PO Sr No, PL No, PO No, and HSN Code. For each of these keys, identify and extract their corresponding values from the document. If any value is missing or not found, assign null to that field. Do not include any extra information, explanation, or unrelated content—only return the extracted values in a properly formatted JSON object with these exact keys. Ensure that dates, numbers, and other formats are preserved accurately as found in the original document.Return all the values in string format"
  },
  "ModificationAdvice": {
    description: "Modification Advice verification"
  },
  "PurchaseOrder": {
    description: "Please extract the following fields from the provided PDF document and return the result as a JSON object using the exact key names listed: PO No., Inspection Agency, Basic Rate, PO Sr., PL No, Ordered Quantity, Freight Charges, and Security Money (point 4 in other terms & conditions). Each key must be matched with its corresponding value from the document. If a value is not found or is unclear, assign it a value of null. Ensure that all dates, numbers, and amounts are retained in their original format. The output should be a clean JSON object containing only these key-value pairs with no additional text or commentary.Return all the values in string format"
  },
  "InspectionCertificate": {
    description: "Please extract the following fields from the provided PDF document and return them as a JSON object using exactly these key names: Certificate no., PO Number, Date, IC Count No., PO Serial Number, Inspection quantity details, Order Qty, Qty Offered, Qty not due, Qty Passed, and Qty Rejected. Ensure each key maps to the corresponding value from the document as accurately as possible. If any value is missing or not clearly mentioned, assign null to that key. Maintain the original formatting of dates, numbers, and quantities. The output should be a clean JSON object with no additional text or explanation, containing only the specified keys and their associated values.Return all the values in string format"
  }
};

const getdata = async (file: File, documentType: keyof typeof documentKeys, rowId: number) => {
  console.log("called");

  // Convert File to base64 (without header)
  const fileBase64 = await convertFileToBase64(file); // Includes 'data:application/pdf;base64,...'
  const cleanBase64 = (fileBase64 as string).split(',')[1]; // Removes the header part

  const data = {
    prompt: documentKeys[documentType].description,
    fileBase64: cleanBase64,
    documentType: documentType,
    rowId: rowId,
  };

  console.log("Sending to API:", data);

  try {
    const answer = await fetchWrapper.post(`${config.apiUrl}/api/extract-expenditure-data`, data);
    //get-report-data,extract-expenditure-data
    console.log("gpt answer", answer);
    return answer?"success" : "error";
  } catch (err) {
    console.error("Fetch error:", err);
    throw err;
  }
};




const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const expenditureService = {

  // Get all expenditure data
  getExpenditureData: async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/get-expditure-data`);
      console.log(`hello${config.apiUrl}/api/get-expditure-data`)
      //get-basic-data,get-expenditure-data
      console.log("fetched data",response.data)
      return response.data;
      // return [{
      //   SNo: 1,
      //   ReceiptNote: null,
      //   TaxInvoice: null,
      //   GSTInvoice: null,
      //   ModificationAdvice: null,
      //   PurchaseOrder: null,
      //   Status: "approved",
      //   VerificationTime: new Date().toLocaleString(),
      //   AuthorizationCommittee: null,
      //   Remark: "-",
      // }];
    } catch (error) {
      console.error('Error fetching expenditure data:', error);
      throw error;
    }
  },

  // Update expenditure data
  updateExpenditureData: async (rowData: any) => {
    try {
      console.log("hello");
      const processedData = { ...rowData };
      const fileFields = ['ReceiptNote', 'TaxInvoice', 'GSTInvoice', 'ModificationAdvice', 'PurchaseOrder'];
  
      for (const field of fileFields) {
        if (processedData[field] instanceof File) {
          processedData[field] = await convertFileToBase64(processedData[field]);
        }
      }
  
      const payload = {
        data: [processedData]  // 👈 wrap in array if you support batch upload
      };
  
      console.log("processed data", payload);
  
      const response = await axios.post(`${config.apiUrl}/api/update-expditure-data`, payload);
      //upload-trend-data,update-expenditure-data
  
      console.log("done work",response);
      return response.data;
    } catch (error) {
      console.error('Error updating expenditure data:', error);
      throw error;
    }
  },
  

  // Report verification for uploaded document
  reportVerification: async (row: any) => {
    try {
      const formData = new FormData();
      
      // Make sure row contains SNo and other required fields
      if (!row.SNo) {
        throw new Error('SNo is required for verification');
      }
      
      // Append all fields from row to formData
      for (const key in row) {
        if (row.hasOwnProperty(key)) {
          formData.append(key, row[key]);
        }
      }
      ///update-comment,expenditure-data-verify
      console.log("calling backend for verification", formData);
      const response = await axios.post(
        `${config.apiUrl}/api/expenditure-data-verify`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
        console.log("verification response 2",response)
        return response.data;
      } catch (error) {
        console.error('Error in document verification:', error);
        throw error;
      }
  },
  getdata
}; 

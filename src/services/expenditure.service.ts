import axios from 'axios';
import { getGpt4oResponse } from './airesponse.service';
import { fetchWrapper } from "../helpers/fetch-wrapper";
import { config } from "../shared/constants/config";
import { ResponseStream } from 'openai/lib/responses/ResponseStream';



const API_URL = "https://nwr-pension-2025.azurewebsites.net";

// Document type keys for GPT verification
const documentKeys = {
  "ReceiptNote": {
    description: "Please extract the following specific fields from the provided json document and return the result as a JSON object using the exact key names listed: R/Note-No., Vendor Code, Supplier Name, Supplier Address, PO/AT No., PL No., R.O.No., R.O.Date, RN Quantity, Rate, Value, P.O.Sr.No., Freight, Inspection agency, IC no., dated, Challan/invoice no., Date(Challan Date), Qty. Invoiced, Qty. Received, Qty. Accepted, and Qty. Rejected. Ensure each of these keys is assigned a corresponding value from the document. If any value is missing or cannot be identified, assign it a value of null. The output should contain only the extracted values in a properly structured JSON format without any explanation, summary, or extra content. Return all the values in string format.Return any date in dd/mm/yy format in string and convert it if it is not in that format.(dated comes after Gate/Challan Registration No and the value is below the text dated in next line (if 'Inspection agency' is 'CONSG' then put its value as 'Consignee')"
  },
  "TaxInvoice": {
    description: "Please extract the following specific fields from the provided json document of a tax invoice and return the result as a JSON object using the exact key names listed: Supplier Name, Supplier Address, GST No., Supplier PAN, CIN, Invoice No., Date, No of Pkg, Qty, Rate, Freight Charges, GST Amount, Total Sales Amount(after gst addition), Destination, Dispatched through, e-Way Bill no., Bill of Landing/LR-RR No., and HSN Code. Ensure each of these keys is assigned a corresponding value from the document. If any value is missing or cannot be identified, assign it a value of null. The output should contain only the extracted values in a properly structured JSON format without any explanation, summary, or extra content. Return all the values in string format. Return all the values in string format.Return any date in dd/mm/yy format in string and convert it if it is not in that format. "
  },
  "GSTInvoice": {
    description: "Please extract the following specific fields from the provided json document and return the result as a JSON object using the exact key names listed: Tax invoice no., IREPS Bill Reg No., Tax invoice date, Invoice Amount, Rnote no., Rnote date, Rnote date 2, DRR No., Rnote Value, Rnote no. 2, DRR Date, DRR No. 2, DRR No. 3, RO No., RO Date, Rnote Qty, PO Rate, PO Sr No, PL No, PO No, HSN Code, Supplier Name, Supplier Address, Supplier GSTIN, Inspection Agency, and Vendor Code. Ensure each of these keys is assigned a corresponding value from the document. If any value is missing or cannot be identified, assign it a value of null. The output should contain only the extracted values in a properly structured JSON format without any explanation, summary, or extra content. Return all the values in string format.Return all the values in string format.Return any date in dd/mm/yy format in string and convert it if it is not in that format.( the value of 'Rnote date' is below it in the next line)('DRR No. 3','Rnote no. 2','Rnote date 2','RO No.','RO Date','Rnote Qty','Rnote Value' are present below the heading RNOTE DETAILS in a tabular format so fetch accordingly, the RNOTE DETAILS table will have the columns ['#','RNOTE TYPE','DRR NO.','RNOTE NO.','RNOTE DATE','RO NO.','RO DATE','RNOTE QTY','RNOTE VALUE','PAID VALUE'] and they will be in this order only so fetch data accordingly and if 'RO NO.' and 'RO DATE' get merged then seperate them before returning)(important point: if 'Rnote date' is null or not a date then make 'Rnote date 2' as 'Rnote date' also else no changes)(if 'Inspection Agency' is 'CONSG' then put its value as 'Consignee')"
  },
  "ModificationAdvice": {
    description: "Please extract the following specific fields from the provided json and return the result as a JSON object using the exact key names listed: P.O.No., Supplier Name, Supplier Address, P.O.Sr., PL no, and Vcode. Ensure each of these keys is assigned a corresponding value from the document. If any value is missing or cannot be identified, assign it a value of null. The output should contain only the extracted values in a properly structured JSON format without any explanation, summary, or extra content. Return all the values in string format.Return all the values in string format.Return any date in dd/mm/yy format in string and convert it if it is not in that format."
  },
  "InspectionCertificate": {
    description: "Please extract the following specific fields from the provided json document and return the result as a JSON object using the exact key names listed: Certificate no., PO Number, Date, IC Count No., PO Serial Number, Inspection quantity details, Order Qty, Qty Offered, Qty not due, Qty Passed, and Qty Rejected. Ensure each of these keys is assigned a corresponding value from the document. If any value is missing or cannot be identified, assign it a value of null. The output should contain only the extracted values in a properly structured JSON format without any explanation, summary, or extra content. Return all the values in string format. Return all the values in string format.Return any date in dd/mm/yy format in string and convert it if it is not in that format. "
  },
  "PurchaseOrder": {
    description: "Please extract the following specific fields from the provided json document and return the result as a JSON object using the exact key names listed: PO No., Inspection Agency, Basic Rate, PO Sr., PL No, Ordered Quantity, Freight Charges, and Security Money (point 4 in other terms & conditions). Ensure each of these keys is assigned a corresponding value from the document. If any value is missing or cannot be identified, assign it a value of null. The output should contain only the extracted values in a properly structured JSON format without any explanation, summary, or extra content. Return all the values in string format. Return all the values in string format.Return any date in dd/mm/yy format in string and convert it if it is not in that format.(For PO Sr. it is a column in a table so fetch data accordingly and take the value in the first row) "
  }
};







const getdata = async (file: File, documentType: keyof typeof documentKeys, rowId: number) => {
  console.log("called");

  // Convert File to base64 (without header)
  const fileBase64 = await convertFileToBase64(file); 
  const cleanBase64 = (fileBase64 as string).split(',')[1]; 
  

  const data = {
    prompt: documentKeys[documentType].description,
    fileBase64: cleanBase64,
    documentType: documentType,
    rowId: rowId,
  };

  console.log("Sending to API:", data);

  try {
    const answer = await fetchWrapper.post(`${config.apiUrl}/api/extract-expenditure-data`, data);
    console.log("gpt answer", answer);
    if(documentType === "GSTInvoice"){
      return answer?{response:"success",IREPSRegNo:answer.regno} : {response:"error"};
    }else{
      return answer?{response:"success"} : {response:"error"};
    }
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
      console.log("fetched data",response.data)
      return response.data;
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
      const fileFields = ['ReceiptNote', 'TaxInvoice', 'GSTInvoice', 'ModificationAdvice', 'PurchaseOrder','InspectionCertificate'];
  
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






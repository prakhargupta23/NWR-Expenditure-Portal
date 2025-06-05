import * as XLSX from "xlsx";
//// Function for formatting csv data for new pensioner --------------------/
export function formatNewPensionersForCsv(newPensionerData: any) {
  // Extract column headers dynamically from the first object in newPensionerData
  const keys =
    newPensionerData?.length > 0 ? Object.keys(newPensionerData[0]) : [];

  // Create the Excel data array
  const newPensionerExcelData = [
    keys, // First row: Dynamic column headers
    ...newPensionerData.map((data: any) => keys.map((key) => data[key])), // Rows: Data values
  ];

  // Debugging: Log the final structure before creating the sheet
  console.log("Final Excel Data Structure:", newPensionerExcelData);

  const ws2 = XLSX.utils.aoa_to_sheet(newPensionerExcelData);
  return ws2;
}
//// Function for the stopped pensioner ------------------------------------/
export function formatStoppedPensionersForCsv(stoppedPensionerData: any) {
  // Extract column headers dynamically from the first object in newPensionerData
  const keys =
    stoppedPensionerData?.length > 0
      ? Object.keys(stoppedPensionerData[0])
      : [];

  // Create the Excel data array
  const stoppedPensionerCsvData = [
    keys, // First row: Dynamic column headers
    ...stoppedPensionerData.map((data: any) => keys.map((key) => data[key])), // Rows: Data values
  ];

  // Debugging: Log the final structure before creating the sheet
  console.log("Final Excel Data Structure:", stoppedPensionerCsvData);

  const ws2 = XLSX.utils.aoa_to_sheet(stoppedPensionerCsvData);
  return ws2;
}

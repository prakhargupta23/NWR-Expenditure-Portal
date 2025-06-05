import { getGpt4oResponse } from "./airesponse.service";

export async function ReportVerification(pdfBuffer:any){
    const reportData = await Promise.all([
        getGpt4oResponse(
            `verify all the values in the pdf and tell me if all the bills are interconnected and value matching is correct,return the answer in true or false`,
            {
                pdfBuffer
            }
        )
    ]);
    return reportData[0];
}
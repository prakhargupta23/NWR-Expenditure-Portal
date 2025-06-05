declare module "html-docx-js/dist/html-docx" {
  const HTMLtoDOCX: {
    asBlob: (html: string, options?: any, pageNumberStart?: number) => Blob;
  };
  export default HTMLtoDOCX;
}

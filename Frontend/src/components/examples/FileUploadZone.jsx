import React from "react";
import { FileUploadZone } from "../FileUploadZone";

export default function FileUploadZoneExample() {
  return (
    <div className="p-6">
      <FileUploadZone
        title="Upload CVs"
        acceptedFormats={[".pdf", ".doc", ".docx"]}
        onFilesSelected={(files) => console.log("Files selected:", files)}
      />
    </div>
  );
}

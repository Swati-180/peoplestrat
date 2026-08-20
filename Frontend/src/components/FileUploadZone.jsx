import { useCallback, useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function FileUploadZone({
  title,
  acceptedFormats,
  onFilesSelected,
}) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...droppedFiles]);

      if (onFilesSelected) {
        onFilesSelected(droppedFiles);
      }
    },
    [onFilesSelected]
  );

  const handleFileInput = useCallback(
    (e) => {
      const selectedFiles = Array.from(e.target.files || []);
      setFiles((prev) => [...prev, ...selectedFiles]);

      if (onFilesSelected) {
        onFilesSelected(selectedFiles);
      }
    },
    [onFilesSelected]
  );

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card
      className="p-6"
      data-testid={`card-upload-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <h3 className="text-lg font-semibold mb-4">{title}</h3>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />

        <p className="text-sm font-medium mb-1">
          Drag and drop files here, or click to browse
        </p>

        <p className="text-xs text-muted-foreground mb-4">
          Accepted formats: {acceptedFormats.join(", ")}
        </p>

        <input
          type="file"
          multiple
          accept={acceptedFormats.join(",")}
          onChange={handleFileInput}
          className="hidden"
          id={`file-input-${title}`}
          data-testid={`input-file-${title.toLowerCase().replace(/\s+/g, "-")}`}
        />

        <Button
          variant="outline"
          onClick={() =>
            document.getElementById(`file-input-${title}`)?.click()
          }
          data-testid={`button-browse-${title.toLowerCase().replace(/\s+/g, "-")}`}
        >
          Browse Files
        </Button>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">
            Uploaded Files ({files.length})
          </p>

          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 bg-muted rounded-lg"
              data-testid={`file-item-${index}`}
            >
              <FileText className="h-4 w-4 text-muted-foreground" />

              <span className="text-sm flex-1 truncate">{file.name}</span>

              <span className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </span>

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeFile(index)}
                data-testid={`button-remove-file-${index}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

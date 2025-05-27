/**
 * FileList Component:
 *
 * This component renders a list of files. When in editing mode, it renders a DropzoneArea for uploading files.
 * When not in editing mode, it renders a list of Chip components, each representing a file.
 */
import * as React from "react";
import { Chip } from "@material-ui/core";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import { DropzoneArea } from "material-ui-dropzone";
import styles from "../ResViews.module.scss";

interface IFileListProps {
  files: string[];
  onFileClick?: (file: string) => void;
  isEditing?: boolean;
  onFilesChange?: (files: File[]) => void;
  initialFiles?: string[];
}

export const FileList: React.FC<IFileListProps> = ({
  files,
  onFileClick,
  isEditing = false,
  onFilesChange,
  initialFiles = []
}) => {
  // Function to handle file download
  const handleFileDownload = (file: string) => {
    if (onFileClick) {
      // Use the provided onFileClick handler
      onFileClick(file);
    } else {
      // Fallback download implementation if onFileClick is not provided
      const link = document.createElement('a');
      link.href = file;
      link.download = file.substr(file.lastIndexOf('/') + 1);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Render file chips
  const renderFileChips = (fileList: string[]) => {
    if (!fileList || fileList.length === 0) {
      return null;
    }
    
    return (
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {fileList.map((file, index) => (
          <Chip
            key={index}
            label={file}
            icon={<AttachFileIcon />}
            style={{ margin: "3px", height: "20px" }}
            onClick={() => handleFileDownload(file)}
          />
        ))}
      </div>
    );
  };

  if (isEditing) {
    return (
      <div>
        <DropzoneArea
          initialFiles={initialFiles}
          acceptedFiles={['.docx', '.xlsx', '.xls', 'doc', '.mov', 'image/*', 'video/*', ' application/*']}
          showPreviews={false}
          showFileNames={false}
          maxFileSize={70000000}
          filesLimit={10}
          showPreviewsInDropzone={false}
          useChipsForPreview={false}
          dropzoneClass={styles.dropZone}
          onChange={onFilesChange}
          dropzoneText="Attach general document here"
        />
        {initialFiles && initialFiles.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "5px" }}>Selected files:</div>
            {renderFileChips(initialFiles)}
          </div>
        )}
      </div>
    );
  }

  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div>
      {renderFileChips(files)}
    </div>
  );
};

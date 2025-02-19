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
import styles from "../ResDisplay.module.scss";

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
  if (isEditing) {
    return (
      <DropzoneArea
        initialFiles={initialFiles}
        acceptedFiles={['.docx', '.xlsx', '.xls', 'doc', '.mov', 'image/*', 'video/*', ' application/*']}
        showPreviews={true}
        showFileNames={true}
        maxFileSize={70000000}
        filesLimit={10}
        showPreviewsInDropzone={false}
        useChipsForPreview
        dropzoneClass={styles.dropZone}
        previewGridProps={{
          container: { spacing: 1, direction: "row" },
        }}
        previewChipProps={{
          classes: { root: styles.previewChip },
        }}
        previewText="Selected files"
        onChange={onFilesChange}
        dropzoneText="Attach general document here"
      />
    );
  }

  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div>
      {files.map((file) => (
        <Chip
          key={file}
          label={file}
          icon={<AttachFileIcon />}
          style={{ margin: "3px", height: "20px" }}
          onClick={() => onFileClick && onFileClick(file)}
        />
      ))}
    </div>
  );
};

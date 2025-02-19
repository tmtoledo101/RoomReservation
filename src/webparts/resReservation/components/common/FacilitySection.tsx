import * as React from "react";
import { Grid } from "@material-ui/core";
import { CustomInput } from "./FormComponents";
import { FacilityList } from "./FacilityList";
import { DropzoneArea } from "material-ui-dropzone";
import styles from "../ResReservation.module.scss";
// Props Interface
interface IFacilitySectionProps {
  showCSRDField: boolean;  // Controls visibility of CRSD facility section
  facilityData: any[]; // Array of facility data
  onAddClick: () => void;  // Handler for adding new facilities
  onEditClick: (index: number) => void; // Handler for editing facilities
  onFilesChange: (files: File[]) => void; // Handler for file attachment changes

}

export const FacilitySection: React.FC<IFacilitySectionProps> = ({
  showCSRDField,
  facilityData,
  onAddClick,
  onEditClick,
  onFilesChange,
}) => {
  return (
    <>
      {showCSRDField && (
        <Grid item xs={12}>
          <FacilityList
            facilityData={facilityData}
            onAddClick={onAddClick}
            onEditClick={onEditClick}
          />
        </Grid>
      )}

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Other Requirements</div>
          <CustomInput name="otherRequirment" />
        </div>
      </Grid>

      <Grid item xs={12}>
        <div className={styles.label}>Attachments Here</div>
        <DropzoneArea
          showPreviews={true}
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
             // ... configuration options
          onChange={onFilesChange}
        />
      </Grid>
    </>
  );
};

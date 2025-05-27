
{/*The FacilitiesSection component handles the display and management of facilities and additional information in the approval form section of the 
  Resource Reservation System. This component is used in:
ApprovalForm for reviewing facility requests
ReservationDetails for viewing booking details
ModificationForm for updating facility requirements*/}

import * as React from "react";
import { Grid, Paper, TextField } from "@material-ui/core";
import { DropzoneArea } from "material-ui-dropzone";
import { FacilityList } from "../common/FacilityList";
import { FileList } from "../common/FileList";
import { IFacilityData } from "../interfaces/IFacility";
import styles from "../ResViews.module.scss";

export const FacilitiesSection: React.FC<{
  showCSRDField: boolean;
  facilityData: IFacilityData[];
  onAddClick: () => void;
  onEditClick: (index: number) => void;
  onFilesChange?: (files: File[]) => void;
  existingFiles?: string[];
  onFileClick?: (file: string) => void;
  formik: any;
}> = ({ 
  showCSRDField, 
  facilityData, 
  onAddClick, 
  onEditClick,
  onFilesChange,
  existingFiles = [],
  onFileClick,
  formik 
}) => {
  return (
    <>
      {showCSRDField && (
        <Grid item xs={12}>
          <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <h3 style={{ margin: 0 }}></h3>
              </Grid>
              <Grid item xs={12}>
                <FacilityList
                  facilityData={facilityData}
                  onAddClick={onAddClick}
                  onEditClick={onEditClick}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      )}

      <Grid item xs={12}>
        <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <h3 style={{ margin: 0 }}>Additional Information</h3>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title Description"
                multiline
                rows={2}
                {...formik.getFieldProps('titleDesc')}
                error={formik.touched.titleDesc && Boolean(formik.errors.titleDesc)}
                helperText={formik.touched.titleDesc && formik.errors.titleDesc}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Other Requirements"
                multiline
                rows={2}
                {...formik.getFieldProps('otherRequirment')}
                error={formik.touched.otherRequirment && Boolean(formik.errors.otherRequirment)}
                helperText={formik.touched.otherRequirment && formik.errors.otherRequirment}
              />
            </Grid>
            
            <Grid item xs={12}>
              <div className={styles.label}>Attachments</div>
              {existingFiles && existingFiles.length > 0 ? (
                <>
                  <DropzoneArea
                    showPreviews={true}
                    showFileNames={true}
                    showPreviewsInDropzone={false}
                    useChipsForPreview={true}
                    dropzoneClass={styles.dropZone}
                    onChange={onFilesChange}
                    dropzoneText="Attach general document here"
                    previewText="Selected files"
                  />
                  <div style={{ marginTop: '16px' }}>
                    <div className={styles.label}>Uploaded Files</div>
                    <FileList 
                      files={existingFiles} 
                      onFileClick={onFileClick}
                      isEditing={false}
                    />
                  </div>
                </>
              ) : (
                <DropzoneArea
                  showPreviews={true}
                  showFileNames={true}
                  showPreviewsInDropzone={false}
                  useChipsForPreview={true}
                  dropzoneClass={styles.dropZone}
                  onChange={onFilesChange}
                  dropzoneText="Attach general document here"
                  previewText="Selected files"
                />
              )}
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </>
  );
};

import * as React from "react";
import { Grid, Paper, TextField } from "@material-ui/core";
import { DropzoneArea } from "material-ui-dropzone";
import { FacilityList } from "../common/FacilityList";
import { IFacilityData } from "../interfaces/IFacility";
import styles from "../ResViews.module.scss";

export const FacilitiesSection: React.FC<{
  showCSRDField: boolean;
  facilityData: IFacilityData[];
  onAddClick: () => void;
  onEditClick: (index: number) => void;
  onFilesChange?: (files: File[]) => void;
  formik: any;
}> = ({ 
  showCSRDField, 
  facilityData, 
  onAddClick, 
  onEditClick,
  onFilesChange,
  formik 
}) => {
  return (
    <>
      {showCSRDField && (
        <Grid item xs={12}>
          <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <h3 style={{ margin: 0 }}>Facilities</h3>
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
                onChange={onFilesChange}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </>
  );
};

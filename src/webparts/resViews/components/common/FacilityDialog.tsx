{/*The FacilityDialog component provides a modal dialog interface for adding and editing facility 
  details in the Resource Reservation System. It manages facility selection, quantity, and asset number tracking.
  */}

import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  MenuItem,
  TextField
} from "@material-ui/core";
import { IFacilityDialogProps } from "../interfaces/IFacility";

export const FacilityDialog: React.FC<IFacilityDialogProps> = ({
  open,
  onClose,
  facilityList,
  quantityList,
  formik,
  onSave,
  onDelete,
  onFacilityChange
}) => {
  return (
    // Dialog wrapper with responsive width
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {formik.values.currentRecord >= 0 ? "Edit Facility" : "Add Facility"}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
           {/* Facility Selection Dropdown */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Facility"
              {...formik.getFieldProps('facility')}
              onChange={(e) => {
                formik.handleChange(e);
                onFacilityChange(e, formik);
              }}
              error={formik.touched.facility && Boolean(formik.errors.facility)}
              helperText={formik.touched.facility && formik.errors.facility}
            >
              {facilityList.map((item) => (
                <MenuItem key={item.id} value={item.value}>
                  {item.value}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Quantity"
              {...formik.getFieldProps('quantity')}
              error={formik.touched.quantity && Boolean(formik.errors.quantity)}
              helperText={formik.touched.quantity && formik.errors.quantity}
            >
              {quantityList.map((item) => (
                <MenuItem key={item.id} value={item.value}>
                  {item.value}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Asset Number"
              {...formik.getFieldProps('assetNumber')}
              disabled
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="default">
          Cancel
        </Button>
        {formik.values.currentRecord >= 0 && (
          <Button
            onClick={() => onDelete(formik)}
            color="secondary"
            variant="contained"
          >
            Delete
          </Button>
        )}
        <Button
          onClick={() => onSave(formik)}
          color="primary"
          variant="contained"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

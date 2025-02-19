
{/*This component renders the basic information section of the approval form in the Resource Reservation System. 
  It displays user and department details in a structured layout using Material-UI components.*/}
import * as React from "react";
import { Grid, Paper, TextField } from "@material-ui/core";

export const BasicInformationSection: React.FC<{
  formik: any;
}> = ({ formik }) => (
  <Grid item xs={12}>
    <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <h3 style={{ margin: 0 }}>Basic Information</h3>
        </Grid>
        {/* Requester Information - Read-only field */}
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Requested By"
            {...formik.getFieldProps('requestedBy')}
            error={formik.touched.requestedBy && Boolean(formik.errors.requestedBy)}
            helperText={formik.touched.requestedBy && formik.errors.requestedBy}
            disabled
          />
        </Grid>
        {/* Department Information - Read-only field */}
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Department"
            {...formik.getFieldProps('department')}
            error={formik.touched.department && Boolean(formik.errors.department)}
            helperText={formik.touched.department && formik.errors.department}
            disabled
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Contact Number"
            {...formik.getFieldProps('contactNumber')}
            error={formik.touched.contactNumber && Boolean(formik.errors.contactNumber)}
            helperText={formik.touched.contactNumber && formik.errors.contactNumber}
          />
        </Grid>
      </Grid>
    </Paper>
  </Grid>
);

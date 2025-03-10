{/*help provide comments on this file on what it all about and from where the file was used, 
  provide in line comment some part of the code
  This component is used in:
ApprovalForm: For reviewing reservation date/time
ReservationDetails: For displaying booking period
ModificationReview: For checking date changes*/}

import * as React from "react";
import { Grid, Paper, TextField } from "@material-ui/core";

export const DateTimeSection: React.FC<{
  formik: any;
}> = ({ formik }) => (
  <Grid item xs={12}>
    <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <h3 style={{ margin: 0 }}>Date and Time</h3>
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="From Date"
            type="text"
            InputLabelProps={{ shrink: true }}  // Keeps label visible when field has value
            {...formik.getFieldProps('fromDate')}   // Formik field binding
            error={formik.touched.fromDate && Boolean(formik.errors.fromDate)}
            helperText={formik.touched.fromDate && formik.errors.fromDate}
            disabled
          />
        </Grid>
         {/* To Date Field - Read-only */}
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="To Date"
            type="text"
            InputLabelProps={{ shrink: true }}
            {...formik.getFieldProps('toDate')}
            error={formik.touched.toDate && Boolean(formik.errors.toDate)}
            helperText={formik.touched.toDate && formik.errors.toDate}
            disabled
          />
        </Grid>
      </Grid>
    </Paper>
  </Grid>
);

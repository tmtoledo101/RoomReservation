import * as React from "react";
import { Grid, Paper, TextField } from "@material-ui/core";

export const VenueDetailsSection: React.FC<{
  formik: any;
}> = ({ formik }) => (
  <Grid item xs={12}>
    <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <h3 style={{ margin: 0 }}>Venue Details</h3>
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Building"
            {...formik.getFieldProps('building')}
            error={formik.touched.building && Boolean(formik.errors.building)}
            helperText={formik.touched.building && formik.errors.building}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Venue"
            {...formik.getFieldProps('venue')}
            error={formik.touched.venue && Boolean(formik.errors.venue)}
            helperText={formik.touched.venue && formik.errors.venue}
          />
        </Grid>
      </Grid>
    </Paper>
  </Grid>
);

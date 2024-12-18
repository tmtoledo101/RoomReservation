import * as React from "react";
import { Grid, Paper, TextField } from "@material-ui/core";
import { IDropdownItem } from "../interfaces/IFacility";

export const CRSDFieldsSection: React.FC<{
  formik: any;
  showCSRDField: boolean;
  layoutList: IDropdownItem[];
  principalList: IDropdownItem[];
}> = ({ formik, showCSRDField, layoutList, principalList }) => {
  if (!showCSRDField) return null;
  
  return (
    <Grid item xs={12}>
      <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <h3 style={{ margin: 0 }}>CRSD Details</h3>
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              fullWidth
              label="Layout Tables/Chairs"
              {...formik.getFieldProps('layout')}
              error={formik.touched.layout && Boolean(formik.errors.layout)}
              helperText={formik.touched.layout && formik.errors.layout}
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                native: true,
              }}
            >
              <option value=""></option>
              {layoutList.map((option) => (
                <option key={option.id} value={option.value}>
                  {option.value}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Contact Person"
              {...formik.getFieldProps('contactPerson')}
              error={formik.touched.contactPerson && Boolean(formik.errors.contactPerson)}
              helperText={formik.touched.contactPerson && formik.errors.contactPerson}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              fullWidth
              label="Principal User"
              {...formik.getFieldProps('principal')}
              error={formik.touched.principal && Boolean(formik.errors.principal)}
              helperText={formik.touched.principal && formik.errors.principal}
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                native: true,
              }}
            >
              <option value=""></option>
              {principalList.map((option) => (
                <option key={option.id} value={option.value}>
                  {option.value}
                </option>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
};

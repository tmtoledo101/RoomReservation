import * as React from "react";
import { Grid, Paper, TextField, FormGroup, FormControlLabel, Checkbox } from "@material-ui/core";
import { IDropdownItem } from "../interfaces/IFacility";

export const PurposeParticipantsSection: React.FC<{
  formik: any;
  purposeOfUseList: IDropdownItem[];
}> = ({ formik, purposeOfUseList }) => {
  const participantOptions = [
    { id: "Non-BSP Personnel", value: "Non-BSP Personnel" },
    { id: "Personnel from other BSP Office", value: "Personnel from other BSP Office" },
    { id: "BSP-QC Personnel", value: "BSP-QC Personnel" }
  ];

  return (
    <Grid item xs={12}>
      <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <h3 style={{ margin: 0 }}>Purpose and Participants</h3>
          </Grid>
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Purpose of Use"
              {...formik.getFieldProps('purposeOfUse')}
              error={formik.touched.purposeOfUse && Boolean(formik.errors.purposeOfUse)}
              helperText={formik.touched.purposeOfUse && formik.errors.purposeOfUse}
              SelectProps={{
                native: true
              }}
            >
              <option value="">Select</option>
              {purposeOfUseList.map((option) => (
                <option key={option.id} value={option.value}>
                  {option.value}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <FormGroup>
              {participantOptions.map((option) => (
                <FormControlLabel
                  key={option.id}
                  control={
                    <Checkbox
                      checked={formik.values.participant.includes(option.value)}
                      onChange={(e) => {
                        const currentParticipants = [...formik.values.participant];
                        if (e.target.checked) {
                          currentParticipants.push(option.value);
                        } else {
                          const index = currentParticipants.indexOf(option.value);
                          if (index > -1) {
                            currentParticipants.splice(index, 1);
                          }
                        }
                        formik.setFieldValue('participant', currentParticipants);
                      }}
                    />
                  }
                  label={option.value}
                />
              ))}
            </FormGroup>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Number of Participants"
              type="number"
              {...formik.getFieldProps('numberOfParticipants')}
              error={formik.touched.numberOfParticipants && Boolean(formik.errors.numberOfParticipants)}
              helperText={formik.touched.numberOfParticipants && formik.errors.numberOfParticipants}
            />
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
};

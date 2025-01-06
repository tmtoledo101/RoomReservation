import * as React from "react";
import { Grid, TextField } from "@material-ui/core";
import { FormikProps } from "formik";
import { CustomDateTimePicker } from "./FormComponents";
import { IFormValues } from "../interfaces/IResDisplay";
import styles from "../ResDisplay.module.scss";

interface IDateTimeSelectionProps {
  formik: FormikProps<IFormValues>;
  isEditing: boolean;
  handleDateChange?: (date: any, name: string) => void;
}

export const DateTimeSelection: React.FC<IDateTimeSelectionProps> = ({
  formik,
  isEditing,
  handleDateChange
}) => {
  return (
    <>
      <Grid item xs={12} sm={6}>
        <div className={styles.width}>
          <div className={styles.label}>Date and Time of use - From</div>
          {isEditing ? (
            <CustomDateTimePicker
              name="fromDate"
              handleChange={handleDateChange}
            />
          ) : (
            <div>{formik.values.fromDate}</div>
          )}
        </div>
      </Grid>
      <Grid item xs={12} sm={6}>
        <div className={styles.width}>
          <div className={styles.label}>Date and Time of use - To</div>
          {isEditing ? (
            <CustomDateTimePicker
              name="toDate"
              handleChange={handleDateChange}
            />
          ) : (
            <div>{formik.values.toDate}</div>
          )}
        </div>
      </Grid>
      <Grid item xs={12} sm={6}>
        <div className={styles.width}>
          <div className={styles.label}>Other Requirements</div>
          <div>
            {isEditing ? (
              <TextField
                value={formik.values.otherRequirements}
                onChange={(e) => formik.setFieldValue("otherRequirements", e.target.value)}
                multiline
                rows={4}
                variant="outlined"
                fullWidth
              />
            ) : (
              formik.values.otherRequirements
            )}
          </div>
        </div>
      </Grid>
      {!isEditing && (
        <Grid item xs={12} sm={6}>
          <div className={styles.width}>
            <div className={styles.label}>Status</div>
            <div>{formik.values.status}</div>
          </div>
        </Grid>
      )}
    </>
  );
};

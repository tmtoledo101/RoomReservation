import * as React from "react";
import { Grid, FormControl, Button } from "@material-ui/core";
import { Field } from "formik";
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import { MaterialUiPickersDate } from "@material-ui/pickers/typings/date";
import DateFnsUtils from "@date-io/date-fns";
import styles from "../ResViews.module.scss";

interface IDateRangePickerProps {
  onSearch: (fromDate: MaterialUiPickersDate, toDate: MaterialUiPickersDate) => void;
  formik: any;
}

const CustomDateTimePicker: React.FC<{
  name: string;
  handleChange?: (date: MaterialUiPickersDate, name: string) => void;
}> = ({ name, handleChange }) => {
  return (
    <Field name={name}>
      {({ field, meta, form }) => {
        const { error, touched } = meta;
        return (
          <FormControl fullWidth>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <DatePicker
                clearable
                autoOk
                format="MM/dd/yyyy"
                value={field.value ? field.value : null}
                onChange={(date: MaterialUiPickersDate) => {
                  form.setFieldValue(name, date);
                  if (handleChange) {
                    handleChange(date, name);
                  }
                }}
                onBlur={(e) => {
                  form.setFieldTouched(name, true, false);
                  field.onBlur(e);
                }}
                className={styles.width}
              />
            </MuiPickersUtilsProvider>
            {error && touched ? (
              <span className={styles.error}>{error}</span>
            ) : null}
          </FormControl>
        );
      }}
    </Field>
  );
};

export const DateRangePicker: React.FC<IDateRangePickerProps> = ({
  onSearch,
  formik
}) => {
  return (
    <>
      <Grid item xs={4}>
        <div className={styles.width}>
          <div className={styles.label}>From</div>
          <CustomDateTimePicker name="fromDate" />
        </div>
      </Grid>
      <Grid item xs={4}>
        <div className={styles.width}>
          <div className={styles.label}>To</div>
          <CustomDateTimePicker name="toDate" />
        </div>
      </Grid>
      <Grid item xs={4}>
        <div className={styles.width}>
          <Button
            type="button"
            variant="contained"
            onClick={() =>
              onSearch(
                formik.values.fromDate,
                formik.values.toDate
              )
            }
            color="primary"
            disabled={!formik.values.fromDate || !formik.values.toDate}
          >
            Search
          </Button>
        </div>
      </Grid>
    </>
  );
};

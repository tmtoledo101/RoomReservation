{/*The CustomDateTimePicker component is a reusable date picker that integrates with Formik for 
  form management and Material-UI Pickers for date handling in the Resource Reservation System.
  This component is used in:
Reservation creation forms
Date range selection interfaces
Event scheduling components
Booking modification forms
  */}
import * as React from "react";
import { Field } from "formik";
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import { FormControl } from "@material-ui/core";
import styles from "../ResViews.module.scss";

interface ICustomDateTimePickerProps {
  name: string;
  handleChange?: (date: Date | null, name: string) => void;
}

export const CustomDateTimePicker: React.FC<ICustomDateTimePickerProps> = ({ name, handleChange }) => {
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
                onChange={(e: Date | null) => {
                  // Update form value
                  form.setFieldValue(name, e);
                   // Call optional change handler
                  if (handleChange) {
                    handleChange(e, name);
                  }
                }}
                onBlur={(e) => {
                  form.setFieldTouched(name, true, false);
                  field.onBlur(e);
                }}
                className={styles.width}
              />
            </MuiPickersUtilsProvider>
             {/* Error message display */}
            {error && touched ? (
              <span className={styles.error}>{error}</span>
            ) : null}
          </FormControl>
        );
      }}
    </Field>
  );
};

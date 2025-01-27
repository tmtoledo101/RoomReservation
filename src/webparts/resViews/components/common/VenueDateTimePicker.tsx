import * as React from "react";
import { Field } from "formik";
import { DateTimePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import { FormControl } from "@material-ui/core";
import styles from "../ResViews.module.scss";

interface IVenueDateTimePickerProps {
  name: string;
  handleChange?: (date: Date | null, name: string) => void;
}

export const VenueDateTimePicker: React.FC<IVenueDateTimePickerProps> = ({ name, handleChange }) => {
  return (
    <Field name={name}>
      {({ field, meta, form }) => {
        const { error, touched } = meta;
        return (
          <FormControl fullWidth>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <DateTimePicker
                clearable
                autoOk
                ampm
                disablePast
                format="MM/dd/yyyy hh:mm a"
                value={field.value ? field.value : null}
                onChange={(e: Date | null) => {
                  form.setFieldValue(name, e);
                  if (handleChange) {
                    handleChange(e, name);
                  }
                }}
                onBlur={(e) => {
                  form.setFieldTouched(name, true, false);
                  field.onBlur(e);
                }}
                className={styles.width}
                minutesStep={5}
                views={["date", "hours", "minutes"]}
              />
            </MuiPickersUtilsProvider>
            {error && touched && (
              <div className={styles.error} style={{ color: 'red', marginTop: '4px', fontSize: '0.75rem' }}>{error}</div>
            )}
          </FormControl>
        );
      }}
    </Field>
  );
};

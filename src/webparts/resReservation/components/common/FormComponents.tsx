import * as React from "react";
import { Field } from "formik";
import {
  FormControl,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  Chip,
  Box,
} from "@material-ui/core";
import { DateTimePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import styles from "../ResReservation.module.scss";

export const CustomInput = (props) => {
  const { name, disabled = false } = props;
  return (
    <Field name={name}>
      {({ field, meta, form }) => {
        const { error, touched } = meta;
        return (
          <FormControl fullWidth>
            <TextField
              value={field.value}
              variant="standard"
              onChange={(e) => {
                field.onChange(e);
              }}
              onBlur={(e) => {
                form.setFieldTouched(name, true, false);
                field.onBlur(e);
              }}
              name={name}
              disabled={disabled}
              className={styles.width}
            />
            {error && touched && (
              <div className={styles.error}>{error}</div>
            )}
          </FormControl>
        );
      }}
    </Field>
  );
};

export const Dropdown = (props) => {
  const { items, handleChange, name, multiple } = props;
  return (
    <Field name={name}>
      {({ field, meta, form }) => {
        const { error, touched } = meta;
        return (
          <FormControl fullWidth>
            <Select
              name={field.name}
              multiple={multiple}
              onChange={(e) => {
                field.onChange(e);
                if (handleChange) {
                  handleChange(e);
                }
              }}
              onBlur={(e) => {
                form.setFieldTouched(name, true, false);
                field.onBlur(e);
              }}
              value={field.value}
              className={styles.width}
              variant="standard"
              renderValue={(selected: any) => {
                if (multiple) {
                  return (
                    <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                      {selected && selected.map((value) => (
                        <Chip
                          key={value}
                          label={value}
                          style={{ margin: "3px", height: "20px" }}
                        />
                      ))}
                    </Box>
                  );
                } else {
                  return selected;
                }
              }}
              {...props}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {items.map((item) => (
                <MenuItem key={item.id} value={item.value}>
                  {multiple && <Checkbox checked={field.value.indexOf(item.value) > -1} /> }
                  {item.value}
                </MenuItem>
              ))}
            </Select>
            {error && touched && (
              <div className={styles.error}>{error}</div>
            )}
          </FormControl>
        );
      }}
    </Field>
  );
};

export const CustomDateTimePicker = (props) => {
  const { name, handleChange } = props;
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
                hideTabs
                ampm={true}
                disablePast
                format="MM/dd/yyyy hh:mm a"
                value={field.value ? field.value : null}
                minDate={new Date()}
                onChange={(e) => {
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
              />
            </MuiPickersUtilsProvider>
            {error && touched && (
              <div className={styles.error}>{error}</div>
            )}
          </FormControl>
        );
      }}
    </Field>
  );
};

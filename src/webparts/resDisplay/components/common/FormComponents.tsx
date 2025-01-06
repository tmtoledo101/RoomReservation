import * as React from "react";
import { Field } from "formik";
import { FormControl, TextField, Select, MenuItem, Box, Chip, Checkbox } from "@material-ui/core";
import { DateTimePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import styles from "../ResDisplay.module.scss";
import { IDropdownItem } from "../interfaces/IResDisplay";

interface ICustomInputProps {
  name: string;
  disabled?: boolean;
}

interface IDropdownProps {
  items: IDropdownItem[];
  name: string;
  multiple?: boolean;
  disabled?: boolean;
  handleChange?: (e: any) => void;
}

interface ICustomDateTimePickerProps {
  name: string;
  handleChange?: (date: any, name: string) => void;
}

export const CustomInput: React.FC<ICustomInputProps> = ({ name, disabled = false }) => {
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
              style={{
                border: form.errors[field.name] ? "1px solid red" : "none",
              }}
            />
            {error && touched ? (
              <span className={styles.error}>{error}</span>
            ) : null}
          </FormControl>
        );
      }}
    </Field>
  );
};

export const Dropdown: React.FC<IDropdownProps> = ({ items, handleChange, name, multiple, disabled }) => {
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
              variant="standard"
              disabled={disabled}
              style={{
                border: form.errors[field.name] ? "1px solid red" : "none"
              }}
              renderValue={(selected: any) => {
                if (multiple) {
                  return (
                    <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                      {selected &&
                        selected.map((value) => (
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
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {items.map((item) => (
                <MenuItem key={item.id} value={item.value}>
                  {multiple && <Checkbox checked={field.value.indexOf(item.value) > -1} />}
                  {item.value}
                </MenuItem>
              ))}
            </Select>
            {error && touched ? (
              <span className={styles.error}>{error}</span>
            ) : null}
          </FormControl>
        );
      }}
    </Field>
  );
};

export const CustomDateTimePicker: React.FC<ICustomDateTimePickerProps> = ({ name, handleChange }) => {
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
                ampm={false}
                format="MM/dd/yyyy HH:MM"
                style={{
                  border: form.errors[field.name] ? "1px solid red" : "none"
                }}
                value={field.value ? field.value : null}
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

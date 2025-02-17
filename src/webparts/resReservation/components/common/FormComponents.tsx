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
              <div className={styles.error} style={{ color: 'red', marginTop: '4px', fontSize: '0.75rem' }}>{error}</div>
            )}
          </FormControl>
        );
      }}
    </Field>
  );
};

export const Dropdown = (props) => {
  const { items, handleChange, name, multiple, disabled } = props;
  
  const [localItems, setLocalItems] = React.useState(items || []);
  const [localValue, setLocalValue] = React.useState<string | string[]>(multiple ? [] : "");

  React.useEffect(() => {
    console.log(`Dropdown ${name} - Items updated:`, items);
    setLocalItems(items || []);
  }, [items, name]);

  const updateLocalValue = (value: any) => {
    if (multiple) {
      setLocalValue(Array.isArray(value) ? value : []);
    } else {
      setLocalValue(value ? value.toString() : "");
    }
  };

  return (
    <Field name={name}>
      {({ field, meta, form }) => {
        const { error, touched } = meta;
        
        React.useEffect(() => {
          console.log(`Dropdown ${name} - Field value updated:`, field.value);
          updateLocalValue(field.value);
        }, [field.value]);

        return (
          <FormControl fullWidth>
            <Select
              name={field.name}
              multiple={multiple}
              onChange={async (e) => {
                const value = e.target.value;
                console.log(`Dropdown ${name} - Value changing to:`, value);
                
                try {
                  // Set local value first
                  updateLocalValue(value);
                  
                  // Set the value in formik and wait for it to complete
                  await form.setFieldValue(name, value);
                  await form.setFieldTouched(name, true);
                  
                  // Call the custom onChange if provided
                  if (handleChange) {
                    await handleChange(e, form);
                  }
                  
                  // Log the updated values
                  console.log(`Dropdown ${name} - Updated values:`, {
                    localValue: value,
                    fieldValue: form.values[name],
                    allValues: form.values,
                    touched: form.touched[name]
                  });

                  // Validate the form
                  const errors = await form.validateForm();
                  console.log(`Dropdown ${name} - Validation result:`, errors);
                } catch (error) {
                  console.error(`Dropdown ${name} - Error updating value:`, error);
                  // Reset local value on error
                  updateLocalValue(field.value);
                }
              }}
              onBlur={(e) => {
                console.log(`Dropdown ${name} - Field touched`);
                form.setFieldTouched(name, true, false);
                field.onBlur(e);
              }}
              value={localValue}
              className={styles.width}
              variant="standard"
              MenuProps={{
                anchorOrigin: {
                  vertical: "bottom",
                  horizontal: "left"
                },
                transformOrigin: {
                  vertical: "top",
                  horizontal: "left"
                },
                getContentAnchorEl: null
              }}
              renderValue={(selected: any) => {
                console.log(`Dropdown ${name} - Rendering value:`, selected);
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
                  // For single select, ensure we return a string
                  return selected ? selected.toString() : "";
                }
              }}
              disabled={disabled}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {localItems && localItems.length > 0 ? (
                localItems.map((item) => (
                  <MenuItem key={item.id} value={item.value}>
                    {multiple && <Checkbox checked={field.value.indexOf(item.value) > -1} /> }
                    {item.value}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No items available</MenuItem>
              )}
            </Select>
            {error && touched && (
              <div className={styles.error} style={{ color: 'red', marginTop: '4px', fontSize: '0.75rem' }}>{error}</div>
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
              <div className={styles.error} style={{ color: 'red', marginTop: '4px', fontSize: '0.75rem' }}>{error}</div>
            )}
          </FormControl>
        );
      }}
    </Field>
  );
};

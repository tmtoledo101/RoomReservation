/*
The validation.ts file defines Yup validation schemas for two main components in the resView webpart
*/
import * as yup from "yup";
import * as moment from "moment";
import { validateDateTime,validateDateTime_, validateDateRange } from "./helpers";

export const resViewValidationSchema = yup.object().shape({
  fromDate: yup
    .date()
    .nullable()
    .required("From date is required")
    .test(
      "is-valid-date",
      "Enter valid date",
      (value) => !value || moment(value).isValid()
    ),
  toDate: yup
    .date()
    .nullable()
    .required("To date is required")
    .test(
      "is-valid-date",
      "Enter valid date",
      (value) => !value || moment(value).isValid()
    )
    .when("fromDate", (fromDate, schema) => {
      return schema.test({
        test: (toDate) => !fromDate || !toDate || validateDateTime(fromDate, toDate),
        message: "Invalid date range, fromDate < toDate",
      });
    }),
});


export const validationSchema = yup.object().shape({
  department: yup.string().required("Department is required"),
  building: yup.string().test(
    'building-required',
    'Building is required',
    value => value !== undefined && value !== null &&  value.trim().length > 0
  ),
  fromDate: yup.date()
    .nullable()
    .required("From date is required")
    .test("isValid", "Enter valid date", (value) => !value || moment(value).isValid()),
  toDate: yup.date()
    .nullable()
    .required("To date is required")
    .test("isValid", "Enter valid date", (value) => !value || moment(value).isValid())
    .test("dateRange", "End date must be after start date", function(value) {
      return !value || !this.parent.fromDate || validateDateTime_(this.parent.fromDate, value);
    })
    .test("maxRange", "Reservation cannot exceed 3 months", function(value) {
      return !value || !this.parent.fromDate || validateDateRange(this.parent.fromDate, value);
    })
});
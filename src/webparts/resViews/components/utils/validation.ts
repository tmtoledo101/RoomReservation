import * as yup from "yup";
import * as moment from "moment";
import { validateDateTime } from "./helpers";

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

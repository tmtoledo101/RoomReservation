import * as yup from "yup";
import * as moment from "moment";
import { validateDateTime } from "./helpers";

export const approverValidationSchema = yup.object().shape({
  building: yup.string().required("Building is required"),
  venue: yup.string().required("Venue is required"),
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
  purposeOfUse: yup.string().required("Purpose of use is required"),
  numberOfParticipants: yup
    .number()
    .required("Number of participants is required")
    .min(1, "Must be at least 1 participant"),
  requestedBy: yup.string().required("Requestor is required"),
  department: yup.string().required("Department is required"),
  contactNumber: yup.string().required("Contact number is required"),
  approverComments: yup.string().when("status", {
    is: (status: string) => status === "Disapproved",
    then: yup.string().required("Comments are required when rejecting a request"),
    otherwise: yup.string(),
  }),
});

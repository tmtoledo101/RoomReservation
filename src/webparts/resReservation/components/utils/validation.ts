
{/*This utility file contains validation schemas and helper functions for form validation 
  in the Resource Reservation System using Yup validation library.*/}
import * as yup from "yup";
import * as moment from "moment";
import { configService } from "../../../shared/services/ConfigurationService";
export const validateDateTime = (startDateTime, endDateTime) =>
  startDateTime &&
  moment(startDateTime).isValid() &&
  endDateTime &&
  moment(endDateTime).isValid() &&
  moment(endDateTime).isAfter(startDateTime);

export const validateDateRange = (startDate, endDate) => {
   // Validates reservation duration:
  // - Maximum 3 months between dates
  // - Handles null date checks
  if (!startDate || !endDate) return true;
  const start = moment(startDate);
  const end = moment(endDate);
  const monthsDiff = end.diff(start, 'months', true);
  return monthsDiff <= 3;
};

export const validationSchema = yup.object().shape({
  requestedBy: yup.string().required(),
  department: yup.string().required("Department is required"),
  building: yup.string().required("Building is required"),
  venue: yup.string().required("Venue is required"),
  participant: yup.string().required("Participant is required"),
  purposeOfUse: yup.string().required("Purpose of use is required"),
  contactNumber: yup.number().required("Contact number is required"),
  numberOfParticipant: yup
    .number()
    .required("Number of participant is required"),
  titleDesc: yup.string().required("Title is required"),
  isCSDR: yup.boolean(),
  layout: yup.string().when("isCSDR", {
    is: (isCSDR) => isCSDR === true,
    then: yup.string().required("Layout is required"),
    otherwise: yup.string(),
  }),
  principal: yup.string().when("isCSDR", {
    is: (isCSDR) => isCSDR === true,
    then: configService.isTestEnvironment()?yup.string().required("Principal is required"):yup.string(),
    otherwise: yup.string(),
  }),
  contactPerson: yup.string().when("isCSDR", {
    is: (isCSDR) => isCSDR === true,
    then: yup.string().required("Contact person is required"),
    otherwise: yup.string(),
  }),
  fromDate: yup.lazy((data) => {
    // Handles date format validation
    // Required field validation
    // Custom date logic
    if (data) {
      return yup
        .mixed()
        .test(
          "Is date valid",
          "Enter valid date",
          (val) => val && moment(val).isValid()
        )
        .required("From date is required");
    }
    return yup.string().required("From date is required");
  }),
  toDate: yup.lazy((data) => {
    if (data) {
      return yup
        .mixed()
        .test(
          "Is date valid",
          "Enter valid date",
          (val) => val && moment(val).isValid()
        )
        .test(
          "date-range-validation",
          function(toDate) {
            const { fromDate } = this.parent;
            if (!validateDateTime(fromDate, toDate)) {
              return this.createError({
                message: "Invalid date range, fromDate < toDate"
              });
            }
            if (!validateDateRange(fromDate, toDate)) {
              return this.createError({
                message: "Reservation exceeds 3 months limit"
              });
            }
            return true;
          }
        )
        .required("toDate is required");
    }
    return yup.mixed().when("fromDate", (fromDate, schema) => {
      if (fromDate) {
        return schema
          .test({
            test: (toDate) => validateDateTime(fromDate, toDate),
            message: "Invalid date range",
          })
          .required("toDate is required");
      }
      return yup.mixed().required("toDate is required");
    });
  }),
});

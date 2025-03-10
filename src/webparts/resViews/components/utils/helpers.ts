/*The helpers.ts file contains utility functions for date formatting, validation, and conversion used throughout the resView wepart.
*/
import * as moment from "moment";

export const formatDateForInput = (dateString: string): string => {
  return moment(dateString).format("YYYY-MM-DDTHH:mm");
};

export const formatDate = (dateString: string): string => {
  return moment(dateString).format("MM/DD/YYYY hh:mm A");
};

export const validateDateTime = (fromDate: Date, toDate: Date): boolean => {
  return moment(toDate).isSameOrAfter(moment(fromDate));
};

export const dateConverter = (date: string, type: number): string => {
  const dateObj = new Date(date);
  if (type === 1) {
    dateObj.setHours(0, 0, 0);
  } else {
    dateObj.setHours(23, 59, 59);
  }
  return dateObj.toISOString();
};


export const validateDateTime_ = (startDateTime: Date | null, endDateTime: Date | null): boolean =>
  startDateTime &&
  moment(startDateTime).isValid() &&
  endDateTime &&
  moment(endDateTime).isValid() &&
  moment(endDateTime).isAfter(startDateTime);

export const validateDateRange = (startDate: Date | null, endDate: Date | null): boolean => {
  if (!startDate || !endDate) return true;
  const start = moment(startDate);
  const end = moment(endDate);
  const monthsDiff = end.diff(start, 'months', true);
  return monthsDiff <= 3;
};

import * as moment from "moment";

export const validateDateTime = (startDateTime: Date, endDateTime: Date): boolean => {
  return startDateTime &&
    moment(startDateTime).isValid() &&
    endDateTime &&
    moment(endDateTime).isValid() &&
    moment(endDateTime).isSameOrAfter(startDateTime);
};

export const dateConverter = (date: Date, type: number): string => {
  if (!date) return null;

  if (type === 1) {
    return `${moment(date).format("YYYY-MM-DD")}T00:00:00Z`;
  } else if (type === 2) {
    return `${moment(date).add(1, 'days').format("YYYY-MM-DD")}T00:00:00Z`;
  }
  return null;
};

export const formatDate = (date: Date): string => {
  return date ? moment(date).format("MM/DD/yyyy") : null;
};

export const createDateRangeFilter = (fromDate: Date, toDate: Date, department: string[]): string => {
  const dateRange = `FromDate ge datetime'${dateConverter(fromDate, 1)}'and ToDate le datetime'${dateConverter(toDate, 2)}'`;
  
  if (!department || department.length === 0) {
    return dateRange;
  }

  const departmentQuery = department
    .map(item => `Department eq '${item}'`)
    .join(' or ');

  return `${dateRange} and (${departmentQuery})`;
};

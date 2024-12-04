import * as moment from "moment";

export const dateConverter = (date: string | Date, type: number): string => {
  let result = null;
  if (type === 1) {
    result = `${moment(date).format("YYYY-MM-DD")}T00:00:00Z`;
  } else if (type === 2) {
    result = `${moment(date).add(1, 'days').format("YYYY-MM-DD")}T00:00:00Z`;
  }
  return result;
};

export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  try {
    return moment(date).format("MM/DD/yyyy");
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export const validateDateTime = (startDateTime: string | Date, endDateTime: string | Date): boolean => {
  return startDateTime &&
    moment(startDateTime).isValid() &&
    endDateTime &&
    moment(endDateTime).isValid() &&
    moment(endDateTime).isSameOrAfter(startDateTime);
};

export const parseSharePointDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    return moment(dateString).format();
  } catch (error) {
    console.error('Error parsing SharePoint date:', error);
    return dateString;
  }
};

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
  return date ? moment(date).format("MM/DD/yyyy") : null;
};

export const validateDateTime = (startDateTime: string | Date, endDateTime: string | Date): boolean => {
  return startDateTime &&
    moment(startDateTime).isValid() &&
    endDateTime &&
    moment(endDateTime).isValid() &&
    moment(endDateTime).isSameOrAfter(startDateTime);
};

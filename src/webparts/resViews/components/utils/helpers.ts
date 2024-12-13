import * as moment from "moment";

export const formatDateForInput = (dateString: string): string => {
  return moment(dateString).format("YYYY-MM-DDTHH:mm");
};

export const formatDate = (dateString: string): string => {
  return moment(dateString).format("MM/DD/YYYY hh:mm A");
};

export const validateDateTime = (fromDate: Date, toDate: Date): boolean => {
  return moment(toDate).isAfter(moment(fromDate));
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

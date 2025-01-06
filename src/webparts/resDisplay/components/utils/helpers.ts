import * as moment from "moment";
import { IDropdownItem } from "../interfaces/IResDisplay";

export const validateDateTime = (startDateTime: string, endDateTime: string): boolean =>
  startDateTime &&
  moment(startDateTime).isValid() &&
  endDateTime &&
  moment(endDateTime).isValid() &&
  moment(endDateTime).isAfter(startDateTime);

export const dateFormat = (date: string): string => {
  return moment(date).format("MM/DD/yyyy HH:mm");
};

export const mapArrayToObject = (obj: { [key: string]: any }): IDropdownItem[] =>
  Object.keys(obj).map((item) => {
    return { id: item, value: item };
  });

export const arrayToDropDownValues = (array: string[]): IDropdownItem[] =>
  array.map((item) => ({ id: item, value: item }));

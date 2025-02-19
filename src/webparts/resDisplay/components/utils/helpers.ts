/**
 * helpers.ts:
 *
 * This file provides helper functions for the ResDisplay components, including functions for validating date and time,
 * formatting dates, and mapping arrays to objects and dropdown values.
 */

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

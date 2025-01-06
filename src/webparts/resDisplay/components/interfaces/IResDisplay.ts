export interface IFacilityData {
  facility: string;
  quantity: string;
  assetNumber: string;
}

export interface IDropdownItem {
  id: string | number;
  value: string;
}

export interface IVenueData extends IDropdownItem {
  venueImage: string;
  facilitiesAvailable: string;
  exclusiveTo: string;
  group: string;
  capacityperLayout: string;
  venueId: string;
  building: string;
  itemId: string;
}

export interface IFormValues {
  referenceNumber: string;
  requestDate: string;
  requestedBy: string;
  department: string;
  building: string;
  venue: string;
  layout: string;
  principal: string;
  contactPerson: string;
  contactNumber: string;
  purposeOfUse: string;
  participants: string[];
  numberOfParticipant: string;
  titleDesc: string;
  fromDate: string;
  toDate: string;
  otherRequirements: string;
  status: string;
  facility: string;
  quantity: string;
  currentRecord: number;
  isCSDR?: boolean;
}

export const FSS = "FSS";
export const PENDING = "Pending for Approval";
export const APPROVED = "Approved";
export const DISAPPROVED = "Disapproved";
export const CANCELLED = "Cancelled";

export const statusMapper = {
  [APPROVED]: "approved",
  [DISAPPROVED]: "disapprove",
  [CANCELLED]: "cancel",
};

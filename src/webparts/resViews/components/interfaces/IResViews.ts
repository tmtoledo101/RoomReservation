{/*
  This file contains TypeScript interfaces and constants for managing reservation views, 
  table data structures, and status management in the resView webpart.
  */}

export interface ITableItem {
  building: string;
  venue: string;
  fromDate: string;
  toDate: string;
  referenceNumber: string;
  purposeOfUse: string;
  numberOfParticipants: number;
  requestedBy: string;
  department: string;
  contactNumber: string;
  status: string;
  ID: number;
  layout?: string;
  contactPerson?: string;
  principal?: string;
  titleDesc?: string;  // Maps to TitleDescription in SharePoint
  participant?: string[];
  otherRequirment?: string;  // Maps to OtherRequirement in SharePoint
}

export interface IFormValues {
  fromDate: Date | null;
  toDate: Date | null;
}

export const STATUS = {
  PENDING: "Pending for Approval",
  APPROVED: "Approved",
  DISAPPROVED: "Disapproved",
  CANCELLED: "Cancelled"
};

export const HEADER_OBJ = {
  "0": "By Reference No",
  "1": "Past Request",
  "2": "For Approval",
};

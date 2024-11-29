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
}

export interface IFormValues {
  fromDate: string;
  toDate: string;
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

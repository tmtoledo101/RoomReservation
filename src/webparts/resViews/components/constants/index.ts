import { Column } from 'material-table';
import { IRequestItem } from '../services/SharePointService';

export const STATUS = {
  PENDING: "Pending for Approval",
  APPROVED: "Approved",
  DISAPPROVED: "Disapproved",
  CANCELLED: "Cancelled"
};

export const TAB_HEADERS: { [key: number]: string } = {
  0: "By Reference No",
  1: "Past Request",
  2: "For Approval"
};

export const TABLE_COLUMNS: Array<Column<IRequestItem>> = [
  {
    title: "Date of use - From",
    field: "fromDate",
    type: "datetime",
    cellStyle: {
      minWidth: 150,
    }
  },
  {
    title: "Date of use - To",
    field: "toDate",
    type: "datetime",
    cellStyle: {
      minWidth: 150,
    }
  },
  {
    title: "Building",
    field: "building",
    type: "string"
  },
  {
    title: "Venue",
    field: "venue",
    type: "string"
  },
  {
    title: "Reference No.",
    field: "referenceNumber",
    type: "string"
  },
  {
    title: "Purpose of Use",
    field: "purposeOfUse",
    type: "string"
  },
  {
    title: "Number of Participants",
    field: "numberOfParticipants",
    type: "numeric"
  },
  {
    title: "Requested By",
    field: "requestedBy",
    type: "string"
  },
  {
    title: "Department",
    field: "department",
    type: "string"
  },
  {
    title: "Contact No.",
    field: "contactNumber",
    type: "string"
  },
  {
    title: "Status",
    field: "status",
    type: "string"
  }
];

import * as React from "react";
import MaterialTable from "material-table";
import VisibilityIcon from "@material-ui/icons/Visibility";
import { ITableItem } from "../interfaces/IResViews";
import { formatDate } from "../utils/helpers";

interface ICustomTableProps {
  title: string;
  data: ITableItem[];
  onView: (event: any, data: ITableItem | ITableItem[]) => void;
}

export const CustomTable: React.FC<ICustomTableProps> = ({ title, data, onView }) => {
  return (
    <MaterialTable
      title={title}
      columns={[
        {
          title: "Date of use - From",
          field: "fromDate",
          type: "date",
          cellStyle: {
            minWidth: 150,
          },
          render: (rowData) => formatDate(rowData.fromDate),
        },
        {
          title: "Date of use - To",
          field: "toDate",
          type: "date",
          cellStyle: {
            minWidth: 150,
          },
          render: (rowData) => formatDate(rowData.toDate),
        },
        {
          title: "Building",
          field: "building",
        },
        {
          title: "Venue",
          field: "venue",
        },
        {
          title: "Reference No.",
          field: "referenceNumber",
        },
        {
          title: "Purpose of Use",
          field: "purposeOfUse",
        },
        {
          title: "Number of Participants",
          field: "numberOfParticipants",
        },
        {
          title: "Requested By",
          field: "requestedBy",
        },
        {
          title: "Department",
          field: "department",
        },
        {
          title: "Contact No.",
          field: "contactNumber",
        },
        {
          title: "Status",
          field: "status",
        },
      ]}
      data={data}
      options={{
        filtering: true,
        pageSize: 5,
        pageSizeOptions: [5, 10, data.length],
        search: false,
        grouping: true,
        selection: false,
        columnsButton: false,
        exportButton: true,
      }}
      actions={[
        {
          icon: () => <VisibilityIcon />,
          tooltip: "View Record",
          onClick: onView,
        },
      ]}
    />
  );
};

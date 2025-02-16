import * as React from "react";
import MaterialTable from "material-table";
import VisibilityIcon from "@material-ui/icons/Visibility";
import { ITableItem } from "../interfaces/IResViews";
import { formatDate } from "../utils/helpers";
import CircularProgress from "@material-ui/core/CircularProgress";

interface ICustomTableProps {
  title: string;
  from: string;
  to: string;
  departments: string[];
  data: ITableItem[];
  onView: (event: any, data: ITableItem | ITableItem[]) => void;
  pageSize: number;
  currentPage: number;
  totalCount: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const CustomTable: React.FC<ICustomTableProps> = ({ 
  title, 
  onView, 
  from,
  to,
  departments,
  data,
  pageSize,
  currentPage,
  totalCount,
  isLoading,
  onPageChange,
  onPageSizeChange
}) => {
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
          defaultSort: "desc"
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
          customFilterAndSearch: (term: string, rowData: ITableItem) => 
            term === rowData.venue
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
      ]}
      data={data || []}
      options={{
        filtering: false,
        pageSize: pageSize,
        pageSizeOptions: [5,10, 100, 200, 500],
        search: false,
        grouping: true,
        selection: false,
        columnsButton: false,
        exportButton: true,
        sorting: true,
        debounceInterval: 500
      }}
      actions={[
        {
          icon: () => <VisibilityIcon />,
          tooltip: "View Record",
          onClick: onView,
        },
      ]}
      components={{
        OverlayLoading: () => (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)'
          }}>
            <CircularProgress />
          </div>
        )
      }}
      isLoading={isLoading}
      onChangePage={onPageChange}
      onChangeRowsPerPage={onPageSizeChange}
      page={currentPage}
      totalCount={totalCount}
    />
  );
};

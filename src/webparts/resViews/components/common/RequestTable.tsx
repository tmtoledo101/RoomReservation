import * as React from "react";
import { Paper } from "@material-ui/core";
import MaterialTable, { Column } from "material-table";
import VisibilityIcon from "@material-ui/icons/Visibility";
import { TABLE_COLUMNS } from "../constants";
import { formatDate } from "../utils/dateUtils";
import styles from "../ResViews.module.scss";
import { IRequestItem } from "../services/SharePointService";

interface IRequestTableProps {
  title: string;
  data: IRequestItem[];
  onView: (rowData: IRequestItem) => void;
}

export const RequestTable: React.FC<IRequestTableProps> = ({
  title,
  data,
  onView
}) => {
  const columns: Array<Column<IRequestItem>> = TABLE_COLUMNS.map(col => {
    if (col.field === 'fromDate' || col.field === 'toDate') {
      return {
        ...col,
        render: (rowData: IRequestItem) => {
          const value = rowData[col.field as keyof IRequestItem];
          return value ? formatDate(value as Date) : '';
        }
      };
    }
    return col;
  });

  return (
    <Paper variant="outlined" className={styles.paper}>
      <MaterialTable
        title={title}
        columns={columns}
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
            onClick: (_event, rowData) => {
              onView(rowData as IRequestItem);
            },
          },
        ]}
      />
    </Paper>
  );
};

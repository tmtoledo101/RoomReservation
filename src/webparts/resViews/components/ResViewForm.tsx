import * as React from "react";
import { Formik } from "formik";
import { Grid, Button, Paper, AppBar, Tabs, Tab } from "@material-ui/core";
import MaterialTable from "material-table";
import VisibilityIcon from "@material-ui/icons/Visibility";
import CloseIcon from "@material-ui/icons/Close";
import { CustomDateTimePicker } from "./common/CustomDateTimePicker";
import { resViewValidationSchema } from "./utils/validation";
import { formatDate } from "./utils/helpers";
import { IFormValues, ITableItem, HEADER_OBJ } from "./interfaces/IResViews";
import styles from "./ResViews.module.scss";

interface IResViewFormProps {
  tabValue: number;
  menuTabs: string[];
  data: ITableItem[];
  onTabChange: (event: React.ChangeEvent<{}>, value: number) => void;
  onSearch: (fromDate: string | Date, toDate: string | Date) => void;
  onView: (event: any, data: ITableItem | ITableItem[]) => void;
  onClose: () => void;
}

export const ResViewForm: React.FC<IResViewFormProps> = ({
  tabValue,
  menuTabs,
  data,
  onTabChange,
  onSearch,
  onView,
  onClose,
}) => {
  const initialValues: IFormValues = {
    fromDate: "",
    toDate: "",
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={resViewValidationSchema}
      onSubmit={() => {}}
    >
      {(formik) => (
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              View Reservation Request
            </Grid>
            <Grid item xs={12}>
              <Paper square className={styles.paper}>
                <AppBar position="static" color="default">
                  <Tabs
                    value={tabValue}
                    indicatorColor="primary"
                    textColor="primary"
                    onChange={onTabChange}
                    aria-label="tabs example"
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    {menuTabs.map((item: string, index: number) => (
                      <Tab key={index} label={item} className={styles.tabbar} />
                    ))}
                  </Tabs>
                </AppBar>
              </Paper>
            </Grid>

            <Grid item xs={4}>
              <div className={styles.width}>
                <div className={styles.label}>From</div>
                <CustomDateTimePicker name="fromDate" />
              </div>
            </Grid>
            <Grid item xs={4}>
              <div className={styles.width}>
                <div className={styles.label}>To</div>
                <CustomDateTimePicker name="toDate" />
              </div>
            </Grid>
            <Grid item xs={4}>
              <div className={styles.width}>
                <Button
                  type="button"
                  variant="contained"
                  onClick={() =>
                    onSearch(formik.values.fromDate, formik.values.toDate)
                  }
                  color="primary"
                  disabled={!formik.values.fromDate || !formik.values.toDate}
                >
                  Search
                </Button>
              </div>
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" className={styles.paper}>
                <div>
                  <MaterialTable
                    title={HEADER_OBJ[`${tabValue}`]}
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
                </div>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Button
                type="button"
                variant="contained"
                startIcon={<CloseIcon />}
                onClick={onClose}
                style={{
                  color: "lightgrey",
                  background: "grey",
                  float: "right",
                }}
              >
                Close
              </Button>
            </Grid>
          </Grid>
        </form>
      )}
    </Formik>
  );
};

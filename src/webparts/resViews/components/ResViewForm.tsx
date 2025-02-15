import * as React from "react";
import { Formik } from "formik";
import { Grid, Button, Paper } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import { CustomDateTimePicker } from "./common/CustomDateTimePicker";
import { CustomTabs } from "./common/CustomTabs";
import { CustomTable } from "./common/CustomTable";
import { resViewValidationSchema } from "./utils/validation";
import { IFormValues, ITableItem, HEADER_OBJ } from "./interfaces/IResViews";
import styles from "./ResViews.module.scss";

interface IResViewFormProps {
  tabValue: number;
  menuTabs: string[];
  onTabChange: (event: React.ChangeEvent<{}>, value: number) => void;
  onSearch: (fromDate: Date | null, toDate: Date | null) => void;
  onView: (event: any, data: ITableItem | ITableItem[]) => void;
  onClose: () => void;
  departments: string[];
  pageSize: number;
  currentPage: number;
  totalCount: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  fromDate: string | null;
  toDate: string | null;
  items: ITableItem[];
}

export const ResViewForm: React.FC<IResViewFormProps> = ({
  tabValue,
  menuTabs,
  onTabChange,
  onSearch,
  onView,
  onClose,
  departments,
  pageSize,
  currentPage,
  totalCount,
  isLoading,
  onPageChange,
  onPageSizeChange,
  fromDate: initialFromDate,
  toDate: initialToDate,
  items
}) => {
  const initialValues: IFormValues = {
    fromDate: initialFromDate ? new Date(initialFromDate) : null,
    toDate: initialToDate ? new Date(initialToDate) : null,
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={resViewValidationSchema}
      onSubmit={() => {}}
      enableReinitialize
    >
      {(formik) => (
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              View Reservation Request
            </Grid>
            <Grid item xs={12}>
              <CustomTabs
                value={tabValue}
                menuTabs={menuTabs}
                onChange={onTabChange}
              />
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
                <CustomTable
                  title={HEADER_OBJ[`${tabValue}`]}
                  onView={onView}
                  from={formik.values.fromDate ? formik.values.fromDate.toISOString() : ''}
                  to={formik.values.toDate ? formik.values.toDate.toISOString() : ''}
                  departments={departments}
                  data={items}
                  pageSize={pageSize}
                  currentPage={currentPage}
                  totalCount={totalCount}
                  isLoading={isLoading}
                  onPageChange={onPageChange}
                  onPageSizeChange={onPageSizeChange}
                />
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

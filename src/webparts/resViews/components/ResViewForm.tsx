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
  data: ITableItem[];
  onTabChange: (event: React.ChangeEvent<{}>, value: number) => void;
  onSearch: (fromDate: Date | null, toDate: Date | null) => void;
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
    fromDate: null,
    toDate: null,
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
                  data={data}
                  onView={onView}
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

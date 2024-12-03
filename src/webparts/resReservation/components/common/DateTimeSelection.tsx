import * as React from "react";
import { Grid } from "@material-ui/core";
import { CustomDateTimePicker } from "./FormComponents";
import styles from "../ResReservation.module.scss";

export const DateTimeSelection: React.FC = () => {
  return (
    <>
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Date and Time of use - From</div>
          <CustomDateTimePicker name="fromDate" />
        </div>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Date and Time of use - To</div>
          <CustomDateTimePicker name="toDate" />
        </div>
      </Grid>
    </>
  );
};

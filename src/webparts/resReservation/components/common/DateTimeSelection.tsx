import * as React from "react";
import { Grid } from "@material-ui/core";
import { CustomInput } from "./FormComponents";
import styles from "../ResReservation.module.scss";
// Component Definition
export const DateTimeSelection: React.FC = () => {
  // Renders date/time selection fields in a grid layout
  return (
    <>
       {/* From Date Field */}
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Date and Time of use - From</div>
          <CustomInput 
            name="fromDate" 
            disabled
          />
        </div>
      </Grid>
      {/* To Date Field */}
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Date and Time of use - To</div>
          <CustomInput 
            name="toDate" 
            disabled
          />
        </div>
      </Grid>
    </>
  );
};

import * as React from "react";
import { Grid } from "@material-ui/core";
import { CustomInput, Dropdown } from "./FormComponents";
import styles from "../ResReservation.module.scss";

interface ICSRDFieldsProps {
  showCSRDField: boolean;
  layoutList: any[];
  principalList: any[];
}

export const CSRDFields: React.FC<ICSRDFieldsProps> = ({
  showCSRDField,
  layoutList,
  principalList,
}) => {
  if (!showCSRDField) {
    return null;
  }

  return (
    <>
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Layout Tables/Chairs*</div>
          <Dropdown items={layoutList} name="layout" />
        </div>
      </Grid>
      
      <Grid item xs={6}>
        <div className={styles.label}>Contact Person*</div>
        <CustomInput name="contactPerson" />
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Principal User*</div>
          <Dropdown items={principalList} name="principal" />
        </div>
      </Grid>
    </>
  );
};

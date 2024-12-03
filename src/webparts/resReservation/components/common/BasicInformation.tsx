import * as React from "react";
import { Grid } from "@material-ui/core";
import { CustomInput, Dropdown } from "./FormComponents";
import styles from "../ResReservation.module.scss";

interface IBasicInformationProps {
  departmentList: any[];
  onDepartmentChange: (e: any) => void;
}

export const BasicInformation: React.FC<IBasicInformationProps> = ({
  departmentList,
  onDepartmentChange,
}) => {
  return (
    <>
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Requested By</div>
          <CustomInput name="requestedBy" disabled />
        </div>
      </Grid>
      <Grid item xs={6}>
        <div className={styles.label}>Department</div>
        <Dropdown
          items={departmentList}
          name="department"
          handleChange={onDepartmentChange}
        />
      </Grid>
    </>
  );
};

import * as React from "react";
import { Grid } from "@material-ui/core";
import { CustomInput } from "./FormComponents";
import styles from "../ResReservation.module.scss";

// Interface defining the props required by the BasicInformation component
// departmentList: Array of available departments
// onDepartmentChange: Callback function triggered when department selection changes
interface IBasicInformationProps {
  departmentList: any[];
  onDepartmentChange: (e: any, preserveBuilding?: boolean) => void;
}
// BasicInformation component: Renders the basic user information form section
// Displays read-only fields for the requester's name and department
export const BasicInformation: React.FC<IBasicInformationProps> = ({
  departmentList,
  onDepartmentChange,
}) => {
  return (
    <>
       {/* Grid container for form layout */}
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Requested By</div>
          <CustomInput name="requestedBy" disabled />
        </div>
      </Grid>
       {/* Label and input field for the department */}
      <Grid item xs={6}>
        <div className={styles.label}>Department</div>
        <CustomInput 
          name="department"
          disabled
        />
      </Grid>
    </>
  );
};

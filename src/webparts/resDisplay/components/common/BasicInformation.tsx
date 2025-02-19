/**
 * BasicInformation Component:
 *
 * This component renders basic information fields for a reservation form, including requested by, department, building, venue,
 * layout, principal user, contact person, and contact number.
 */
import * as React from "react";
import { Grid } from "@material-ui/core";
import { FormikProps } from "formik";
import { CustomInput, Dropdown } from "./FormComponents";
import { IDropdownItem, IFormValues } from "../interfaces/IResDisplay";
import styles from "../ResDisplay.module.scss";

interface IBasicInformationProps {
  formik: FormikProps<IFormValues>;
  isEditing: boolean;
  departmentList: IDropdownItem[];
  buildingList: IDropdownItem[];
  venueList: IDropdownItem[];
  showCSRDField: boolean;
  layoutList: IDropdownItem[];
  principalList: IDropdownItem[];
  departmentHandler?: (e: any) => void;
  buildingHandler?: (e: any) => void;
  venueHandler?: (e: any) => void;
  toggler?: boolean;
}

export const BasicInformation: React.FC<IBasicInformationProps> = ({
  formik,
  isEditing,
  departmentList,
  buildingList,
  venueList,
  showCSRDField,
  layoutList,
  principalList,
  departmentHandler,
  buildingHandler,
  venueHandler,
  toggler
}) => {
  return (
    <>
      <Grid item xs={12} sm={6}>
        <div className={styles.width}>
          <div className={styles.label}>Requested By</div>
          <CustomInput name="requestedBy" disabled />
        </div>
      </Grid>
      <Grid item xs={12} sm={6}>
        <div className={styles.width}>
          <div className={styles.label}>Department</div>
          <Dropdown
            items={departmentList}
            name="department"
            disabled={!isEditing}
            handleChange={departmentHandler}
          />
        </div>
      </Grid>
      <Grid item xs={12} sm={6}>
        <div className={styles.width}>
          <div className={styles.label}>Building</div>
          <Dropdown
            items={buildingList}
            name="building"
            disabled={!isEditing}
            handleChange={buildingHandler}
          />
        </div>
      </Grid>
      <Grid item xs={12} sm={6}>
        <div className={styles.width}>
          <div className={styles.label}>Venue</div>
          <Dropdown
            items={venueList}
            name="venue"
            disabled={!isEditing}
            handleChange={venueHandler}
            key={toggler !== undefined ? toggler.toString() : undefined}
          />
        </div>
      </Grid>
      {showCSRDField && (
        <>
          <Grid item xs={12} sm={6}>
            <div className={styles.width}>
              <div className={styles.label}>Layout Tables/Chairs*</div>
              <Dropdown
                items={layoutList}
                name="layout"
                disabled={!isEditing} // Disable the dropdown if not editing
              />
            </div>
          </Grid>
          <Grid item xs={12} sm={6}>
            <div className={styles.width}>
              <div className={styles.label}>Principal User*</div>
              <Dropdown
                items={principalList}
                name="principal"
                disabled={!isEditing} // Disable the dropdown if not editing
              />
            </div>
          </Grid>
          <Grid item xs={12} sm={6}>
            <div className={styles.width}>
              <div className={styles.label}>Contact Person*</div>
              <CustomInput
                name="contactPerson"
                disabled={!isEditing}
              />
            </div>
          </Grid>
        </>
      )}
      <Grid item xs={12} sm={6}>
        <div className={styles.width}>
          <div className={styles.label}>Contact No.</div>
          <CustomInput
            name="contactNumber"
            disabled={!isEditing} // Disable the input if not editing
          />
        </div>
      </Grid>
    </>
  );
};

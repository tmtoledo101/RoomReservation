import * as React from "react";
import { Grid } from "@material-ui/core";
import { FormikProps } from "formik";
import { CustomInput, Dropdown } from "./FormComponents";
import { IDropdownItem, IFormValues } from "../interfaces/IResDisplay";
import styles from "../ResDisplay.module.scss";

interface IParticipantInformationProps {
  formik: FormikProps<IFormValues>;
  isEditing: boolean;
  purposeOfUseList: IDropdownItem[];
  participantList: IDropdownItem[];
  participantHandler?: (e: any) => void;
  isDDMember?: boolean;
  showCSRDField?: boolean;
}

export const ParticipantInformation: React.FC<IParticipantInformationProps> = ({
  formik,
  isEditing,
  purposeOfUseList,
  participantList,
  participantHandler,
  isDDMember,
  showCSRDField
}) => {
  return (
    <>
      <Grid item xs={12} sm={6}>
        <div className={styles.width}>
          <div className={styles.label}>Purpose Of Use</div>
          <Dropdown
            items={purposeOfUseList}
            name="purposeOfUse"
            disabled={!isEditing}
          />
        </div>
      </Grid>
      <Grid item xs={12} sm={6}>
        <div className={styles.width}>
          <div className={styles.label}>Participants</div>
          <Dropdown
            items={participantList}
            name="participants"
            multiple
            disabled={!isEditing}
            handleChange={participantHandler}
          />
          {formik.values.participants.length > 0 && showCSRDField && (
            <span>
              Selected type of participants are subject for approval by{" "}
              {isDDMember ? "DD" : "CRSD"} staff level
            </span>
          )}
        </div>
      </Grid>
      <Grid item xs={12} sm={6}>
        <div className={styles.width}>
          <div className={styles.label}>Number of Participants</div>
          <CustomInput
            name="numberOfParticipant"
            disabled={!isEditing}
          />
        </div>
      </Grid>
      <Grid item xs={12} sm={6}>
        <div className={styles.width}>
          <div className={styles.label}>Title Description</div>
          <CustomInput
            name="titleDesc"
            disabled={!isEditing}
          />
        </div>
      </Grid>
    </>
  );
};

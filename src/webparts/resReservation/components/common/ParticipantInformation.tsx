import * as React from "react";
import { Grid } from "@material-ui/core";
import { CustomInput, Dropdown } from "./FormComponents";
import styles from "../ResReservation.module.scss";

interface IParticipantInformationProps {
  participantList: any[];
  purposeOfUseList: any[];
  onParticipantChange: (e: any) => void;
  showCSRDField: boolean;
  isddMember: boolean;
  participantLength: number;
}

export const ParticipantInformation: React.FC<IParticipantInformationProps> = ({
  participantList,
  purposeOfUseList,
  onParticipantChange,
  showCSRDField,
  isddMember,
  participantLength,
}) => {
  return (
    <>
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Contact No.</div>
          <CustomInput name="contactNumber" />
        </div>
      </Grid>
      
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Purpose Of Use</div>
          <Dropdown items={purposeOfUseList} name="purposeOfUse" />
        </div>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Participants</div>
          <Dropdown
            items={participantList}
            name="participant"
            multiple
            handleChange={onParticipantChange}
          />
          {participantLength > 0 && showCSRDField && (
            <span>Selected type of participants are subject for approval by {isddMember ? 'DD' : 'CRSD'} staff level</span>
          )}
        </div>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Number of Participants</div>
          <CustomInput name="numberOfParticipant" />
        </div>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Title Description</div>
          <CustomInput name="titleDesc" />
        </div>
      </Grid>
    </>
  );
};

import * as React from "react";
import { Grid, Button, Fab, Tooltip } from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import SaveIcon from "@material-ui/icons/Save";
import CloseIcon from "@material-ui/icons/Close";
import styles from "../ResDisplay.module.scss";
import { PENDING } from "../interfaces/IResDisplay";

interface IActionButtonsProps {
  status: string;
  currentUser: string;
  approverList: string[];
  isDDMember: boolean;
  ddMemberList: string[];
  crsdMemberList: string[];
  isEdit: boolean;
  saveStart: boolean;
  onEditClick: () => void;
  onApprove: () => void;
  onDisapprove: () => void;
  onCancel: () => void;
  onClose: () => void;
  requestorEmail: string;
}

export const ActionButtons: React.FC<IActionButtonsProps> = ({
  status,
  currentUser,
  approverList,
  isDDMember,
  ddMemberList,
  crsdMemberList,
  isEdit,
  saveStart,
  onEditClick,
  onApprove,
  onDisapprove,
  onCancel,
  onClose,
  requestorEmail
}) => {
  return (
    <Grid item xs={12}>
      <div className={styles.formHandle}>
        {!isEdit && status === PENDING && 
          ((isDDMember && ddMemberList.indexOf(currentUser) > -1) || 
           (!isDDMember && crsdMemberList.indexOf(currentUser) > -1)) && (
          <Tooltip title="Edit">
            <Fab
              id="editFab"
              size="medium"
              color="primary"
              onClick={onEditClick}
            >
              <EditIcon />
            </Fab>
          </Tooltip>
        )}

        {status === PENDING && approverList.indexOf(currentUser) > -1 && isEdit && (
          <>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={onApprove}
              color="primary"
              disabled={saveStart}
            >
              Approve
            </Button>

            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              color="secondary"
              onClick={onDisapprove}
              disabled={saveStart}
            >
              Disapprove
            </Button>
          </>
        )}

        {((currentUser === requestorEmail || approverList.indexOf(currentUser) > -1) && 
          status === PENDING) && (
          <Button
            type="submit"
            variant="contained"
            startIcon={<CloseIcon />}
            onClick={onCancel}
            style={{
              color: "lightgrey",
              background: "grey",
            }}
            disabled={saveStart}
          >
            Cancel
          </Button>
        )}

        <Button
          type="button"
          variant="outlined"
          style={{
            color: "lightgrey",
            background: "grey",
          }}
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </Grid>
  );
};

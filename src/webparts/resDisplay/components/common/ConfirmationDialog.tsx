/**
 * ConfirmationDialog Component:
 *
 * This component renders a confirmation dialog, displaying a message asking the user if they want to perform an action and providing
 * "Cancel" and "Ok" buttons for the user to confirm or cancel the action.
 */

import * as React from "react";
import { Grid, Button } from "@material-ui/core";
import { FormikProps } from "formik";
import { ModalPopup } from "./ModalPopup";
import { IFormValues } from "../interfaces/IResDisplay";
import { statusMapper } from "../interfaces/IResDisplay";

interface IConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (formik: FormikProps<IFormValues>) => void;
  formik: FormikProps<IFormValues>;
  newStatus: string;
}

export const ConfirmationDialog: React.FC<IConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  formik,
  newStatus
}) => {
  return (
    <ModalPopup
      title=""
      hideCloseIcon={false}
      open={open}
      onClose={onClose}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <h3>Do you want to {statusMapper[newStatus]} this request?</h3>
        </Grid>
        <Grid item xs={12}>
          <div
            style={{
              display: "flex",
              justifyContent: "end",
              alignItems: "center",
            }}
          >
            <Button
              color="secondary"
              variant="contained"
              onClick={onClose} // Call onClose when Cancel is clicked
            >
              Cancel
            </Button>
            <Button
              color="primary"
              variant="contained"
              style={{
                marginLeft: "20px",
              }}
              onClick={() => onConfirm(formik)} // Call onConfirm with formik when Ok is clicked
            >
              Ok
            </Button>
          </div>
        </Grid>
      </Grid>
    </ModalPopup>
  );
};

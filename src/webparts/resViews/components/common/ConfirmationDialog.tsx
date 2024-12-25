import * as React from "react";
import { Grid, Button } from "@material-ui/core";
import { ModalPopup } from "./ModalPopup";

interface IConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmationDialog: React.FC<IConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Ok",
  cancelLabel = "Cancel"
}) => {
  return (
    <ModalPopup
      title={title}
      hideCloseIcon={false}
      open={open}
      onClose={onClose}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <h3>{message}</h3>
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
              onClick={onClose}
            >
              {cancelLabel}
            </Button>
            <Button
              color="primary"
              variant="contained"
              style={{
                marginLeft: "20px",
              }}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </Grid>
      </Grid>
    </ModalPopup>
  );
};

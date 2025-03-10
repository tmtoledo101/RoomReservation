import * as React from "react";
import { Grid, Button } from "@material-ui/core";
import { ModalPopup } from "./ModalPopup";
// Interface defining the props for the ConfirmationDialog component
interface IConfirmationDialogProps {
  open: boolean;  // Controls dialog visibility
  onClose: () => void;  // Handler for dialog close action
  onConfirm: () => void; // Dialog title
  title: string;  // Dialog title
  message: string; // Dialog message content
  confirmLabel?: string; // Optional custom label for confirm button
  cancelLabel?: string;  // Optional custom label for cancel button
}

export const ConfirmationDialog: React.FC<IConfirmationDialogProps> = ({
  open,
  onClose, 
  onConfirm,
  title,
  message,
  confirmLabel = "Ok",  // Default confirm button text
  cancelLabel = "Cancel"  // Default cancel button text
}) => {
  return (
    // ModalPopup: Base dialog component with customizable header
    <ModalPopup
      title={title}
      hideCloseIcon={false}
      open={open}
      onClose={onClose}
    >
       {/* Grid container for dialog content layout */}
      <Grid container spacing={2}>
          {/* Message section */}
        <Grid item xs={12}>
          <h3>{message}</h3>
        </Grid>
        {/* Action buttons section */}
        <Grid item xs={12}>
          <div
            style={{
              display: "flex",
              justifyContent: "end",
              alignItems: "center",
            }}
          >
             {/* Cancel button */}
            <Button
              color="secondary"
              variant="contained"
              onClick={onClose}
            >
              {cancelLabel}
            </Button>
              {/* Confirm button */}
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

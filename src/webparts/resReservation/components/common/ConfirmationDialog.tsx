import * as React from "react";
import { Grid, Button, CircularProgress } from "@material-ui/core";
import { ModalPopup } from "./ModalPopup";
// Interface defining the props for the ConfirmationDialog component
interface IConfirmationDialogProps {
  open: boolean;  // Controls dialog visibility
  onClose: () => void;  // Handler for dialog close action
  onConfirm: () => void; // Handler for confirm action
  title: string;  // Dialog title
  message: string; // Dialog message content
  confirmLabel?: string; // Optional custom label for confirm button
  cancelLabel?: string;  // Optional custom label for cancel button
  isLoading?: boolean; // Optional loading state
}

export const ConfirmationDialog: React.FC<IConfirmationDialogProps> = ({
  open,
  onClose, 
  onConfirm,
  title,
  message,
  confirmLabel = "Ok",  // Default confirm button text
  cancelLabel = "Cancel",  // Default cancel button text
  isLoading = false // Default loading state
}) => {
  const handleConfirm = () => {
    onClose(); // Close dialog immediately
    onConfirm(); // Then execute the confirm action
  };
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
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </Grid>
      </Grid>
    </ModalPopup>
  );
};

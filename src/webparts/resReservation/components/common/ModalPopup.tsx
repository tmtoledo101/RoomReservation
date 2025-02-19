{/*The ModalPopup component serves as a reusable dialog/modal window throughout the Resource Reservation System.
   It provides a consistent way to display overlay content with a standardized header and close button.*/}
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import styles from "../ResReservation.module.scss";

interface IModalPopupProps {
  children: React.ReactNode; // Content to be displayed in the modal
  title: string;  // Modal header title
  open: boolean;  // Controls modal visibility
  onClose: () => void;  // Handler for close actions
  hideCloseIcon?: boolean; // Option to hide the close button
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false; // Modal size options
  fullWidth?: boolean; // Controls if modal takes full width
}

export const ModalPopup: React.FC<IModalPopupProps> = ({ 
  children, 
  title, 
  open, 
  onClose, 
  hideCloseIcon,
  maxWidth = 'lg',
  fullWidth = true
}) => {
  return (
    <Dialog
      open={open}
      keepMounted
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      aria-labelledby="faciliites-dialog-title"
      aria-describedby="faciliites-dialog-description"
    >
      <DialogTitle id="faciliites-dialog-title" disableTypography>
        <h4>{title}</h4>
        {!hideCloseIcon && (
          <Button
            onClick={onClose}
            className={styles.closeBtn}
            style={{
              position: "absolute",
              top: "0",
              right: "0",
            }}
          >
            <CloseIcon />
          </Button>
        )}
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
};

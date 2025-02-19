
{/*The ModalPopup component provides a reusable modal dialog with consistent styling and behavior 
  across the Resource Reservation System.*/}
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import styles from "../ResViews.module.scss";

interface IModalPopupProps {
  children: React.ReactNode;
  title: string;
  open: boolean;
  onClose: () => void;
  hideCloseIcon?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
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
    // Material-UI Dialog with accessibility attributes
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

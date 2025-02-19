/**
 * ModalPopup Component:
 *
 * This component renders a modal popup dialog, providing a container for displaying content in a modal.
 * It includes a title and a close button (optional).
 */

import * as React from "react";
import { Dialog, DialogTitle, DialogContent, Button } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import styles from "../ResDisplay.module.scss";

interface IModalPopupProps {
  children: React.ReactNode;
  title: string;
  open: boolean;
  onClose: () => void;
  hideCloseIcon?: boolean;
}

/**
 * ModalPopup Component
 * @param {IModalPopupProps} props - The component props
 * @returns {JSX.Element} - The ModalPopup component
 */
export const ModalPopup: React.FC<IModalPopupProps> = ({ 
  children, 
  title, 
  open, 
  onClose, 
  hideCloseIcon 
}) => {
  return (
    <Dialog
      open={open}
      keepMounted
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

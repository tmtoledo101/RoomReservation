import * as React from "react";
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';

function Alert(props: AlertProps) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

interface INotificationProps {
  open: boolean;
  message: string;
  severity: "success" | "error" | "warning" | "info";
  onClose?: () => void;
  autoHideDuration?: number;
}

export const Notification: React.FC<INotificationProps> = ({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 3000
}) => {
  const handleClose = (event?: React.SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Snackbar 
      open={open} 
      autoHideDuration={autoHideDuration} 
      onClose={handleClose}
    >
      <Alert onClose={handleClose} severity={severity}>
        {message}
      </Alert>
    </Snackbar>
  );
};

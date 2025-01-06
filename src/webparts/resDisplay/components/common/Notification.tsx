import * as React from "react";
import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert, { AlertProps } from "@material-ui/lab/Alert";

interface INotificationProps {
  open: boolean;
  message: string;
  severity: "success" | "error" | "warning" | "info";
  autoHideDuration?: number;
}

function Alert(props: AlertProps) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export const Notification: React.FC<INotificationProps> = ({
  open,
  message,
  severity,
  autoHideDuration = 1000
}) => {
  return (
    <Snackbar open={open} autoHideDuration={autoHideDuration}>
      <Alert severity={severity}>
        {message}
      </Alert>
    </Snackbar>
  );
};

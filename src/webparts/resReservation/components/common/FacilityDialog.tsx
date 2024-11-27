import * as React from "react";
import { Grid, Button } from "@material-ui/core";
import { FormikProps } from "formik";
import { ModalPopup } from "./ModalPopup";
import { Dropdown, CustomInput } from "./FormComponents";
import { IDropdownItem } from "../interfaces/IResReservation";
import styles from "../ResReservation.module.scss";

interface IFacilityDialogProps {
  open: boolean;
  onClose: () => void;
  facilityList: IDropdownItem[];
  quantityList: IDropdownItem[];
  formik: FormikProps<any>;
  onSave: (form: FormikProps<any>) => void;
  onDelete: (form: FormikProps<any>) => void;
  onFacilityChange: (e: React.ChangeEvent<{ value: any }>) => void;
}

export const FacilityDialog: React.FC<IFacilityDialogProps> = ({
  open,
  onClose,
  facilityList,
  quantityList,
  formik,
  onSave,
  onDelete,
  onFacilityChange
}) => {
  return (
    <ModalPopup
      title="Add Facilities"
      hideCloseIcon={false}
      open={open}
      onClose={onClose}
    >
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <div className={styles.label}>Facility</div>
          <div className={styles.data}>
            <Dropdown
              items={facilityList}
              name="facility"
              onChange={onFacilityChange}
            />
          </div>
        </Grid>
        <Grid item xs={6}>
          <div className={styles.label}>Quantity</div>
          <div className={styles.data}>
            <Dropdown
              items={quantityList}
              name="quantity"
            />
          </div>
        </Grid>
        <Grid item xs={6}>
          <div className={styles.label}>Asset Number</div>
          <div className={styles.data}>
            <CustomInput name="assetNumber" disabled />
          </div>
        </Grid>
        <Grid item xs={6}>
          {" "}
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
              Cancel
            </Button>
            {formik.values.currentRecord >= 0 && (
              <Button
                color="secondary"
                variant="contained"
                style={{
                  marginLeft: "20px",
                }}
                onClick={() => onDelete(formik)}
              >
                Delete
              </Button>
            )}
            <Button
              color="primary"
              variant="contained"
              style={{
                marginLeft: "20px",
              }}
              disabled={!formik.values.facility || !formik.values.quantity}
              onClick={() => onSave(formik)}
            >
              Save
            </Button>
          </div>
        </Grid>
      </Grid>
    </ModalPopup>
  );
};

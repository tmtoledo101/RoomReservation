import * as React from "react";
import { Grid, Button } from "@material-ui/core";
import { FormikProps } from "formik";
import { ModalPopup } from "./ModalPopup";
import { Dropdown, CustomInput } from "./FormComponents";
import { IDropdownItem, IFormValues } from "../interfaces/IResDisplay";

interface IFacilityDialogProps {
  open: boolean;
  onClose: () => void;
  facilityList: IDropdownItem[];
  quantityList: IDropdownItem[];
  formik: FormikProps<IFormValues>;
  onSave: (formik: FormikProps<IFormValues>) => void;
  onDelete?: (formik: FormikProps<IFormValues>) => void;
  facilityHandler: (e: any) => void;
}

export const FacilityDialog: React.FC<IFacilityDialogProps> = ({
  open,
  onClose,
  facilityList,
  quantityList,
  formik,
  onSave,
  onDelete,
  facilityHandler
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
          <div className="label">Facility</div>
          <Dropdown
            items={facilityList}
            name="facility"
            handleChange={(e) => facilityHandler(e)}
          />
        </Grid>
        <Grid item xs={6}>
          <div className="label">Quantity</div>
          <Dropdown
            items={quantityList}
            name="quantity"
          />
        </Grid>
        <Grid item xs={6}>
          <div className="label">Asset Number</div>
          <CustomInput name="assetNumber" disabled />
        </Grid>
        <Grid item xs={6}>{" "}</Grid>
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
            {formik.values.currentRecord >= 0 && onDelete && (
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
              disabled={
                !formik.values.facility ||
                !formik.values.quantity
              }
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

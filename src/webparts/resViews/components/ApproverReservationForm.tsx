import * as React from "react";
import { Formik } from "formik";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Grid,
  Button,
  TextField,
  Paper,
  CircularProgress,
  Snackbar
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { ITableItem, STATUS } from "./interfaces/IResViews";
import { SharePointService } from "./services/SharePointService";
import { approverValidationSchema } from "./utils/approverValidation";
import { formatDateForInput } from "./utils/helpers";
import { FacilityList } from "./common/FacilityList";
import { FacilityDialog } from "./common/FacilityDialog";
import { IFacilityData, IDropdownItem, IFacilityMapItem } from "./interfaces/IFacility";
import styles from "./ResViews.module.scss";

interface IApproverReservationFormProps {
  isOpen: boolean;
  selectedReservation: ITableItem | null;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export const ApproverReservationForm: React.FC<IApproverReservationFormProps> = ({
  isOpen,
  selectedReservation,
  onClose,
  onUpdateSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showFacilityDialog, setShowFacilityDialog] = React.useState(false);
  const [showCSRDField, setShowCSRDField] = React.useState(false);
  const [facilityData, setFacilityData] = React.useState<IFacilityData[]>([]);
  const [facilityList, setFacilityList] = React.useState<IDropdownItem[]>([]);
  const [quantityList, setQuantityList] = React.useState<IDropdownItem[]>([]);
  const [facilityMap, setFacilityMap] = React.useState<{ [key: string]: IFacilityMapItem }>({});
  const [notification, setNotification] = React.useState<{
    show: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    show: false,
    message: "",
    severity: "success"
  });

  React.useEffect(() => {
    const init = async () => {
      if (isOpen && selectedReservation) {
        try {
          // Load facilities first
          const { facilityList: facilities, facilityMap: map } = await SharePointService.getFacilities();
          console.log("Loaded facility map:", map); // Debug log
          setFacilityList(facilities);
          setFacilityMap(map);
          
          // Then check venue group
          if (selectedReservation.venue) {
            const isCRSD = await SharePointService.isVenueCRSD(selectedReservation.venue);
            setShowCSRDField(isCRSD);
          }
        } catch (error) {
          console.error('Error initializing form:', error);
          setShowCSRDField(false);
        }
      }
    };

    init();
  }, [isOpen, selectedReservation]);

  if (!selectedReservation) return null;

  const initialValues = {
    ...selectedReservation,
    fromDate: formatDateForInput(selectedReservation.fromDate),
    toDate: formatDateForInput(selectedReservation.toDate),
    facility: "",
    quantity: "",
    assetNumber: "",
    currentRecord: -1
  };

  const handleSubmit = async (values: any, status: string) => {
    try {
      setIsSubmitting(true);
      await SharePointService.updateReservation(
        selectedReservation.ID,
        {
          ...values,
          status,
          facilityData: showCSRDField ? facilityData : []
        }
      );
      
      setNotification({
        show: true,
        message: `Reservation ${status === STATUS.APPROVED ? 'approved' : 'rejected'} successfully`,
        severity: "success"
      });

      setTimeout(() => {
        onUpdateSuccess();
        onClose();
      }, 1500);

    } catch (error) {
      setNotification({
        show: true,
        message: "Failed to update reservation. Please try again.",
        severity: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFacilitySave = (form: any): void => {
    const newFacilityData = [...facilityData];
    const facilityItem = {
      facility: form.values.facility,
      quantity: form.values.quantity,
      assetNumber: form.values.assetNumber,
    };
    
    if (form.values.currentRecord >= 0) {
      newFacilityData[form.values.currentRecord] = facilityItem;
    } else {
      newFacilityData.push(facilityItem);
    }

    setFacilityData(newFacilityData);
    setShowFacilityDialog(false);
    form.setFieldValue("currentRecord", -1);
  };

  const handleFacilityDelete = (form: any): void => {
    const newFacilityData = [...facilityData];
    newFacilityData.splice(form.values.currentRecord, 1);
    setFacilityData(newFacilityData);
    setShowFacilityDialog(false);
    form.setFieldValue("currentRecord", -1);
  };
  const createQuantityList = (quantity: number): IDropdownItem[] => {
    return Array.from({ length: quantity }, (_, i) => ({
      id: (i + 1).toString(),
      value: (i + 1).toString()
    }));
  };

  const handleFacilityChange = (e: any, formik: any): void => {
    const facility = e.target.value as string;
    console.log("Selected facility:", facility); // Debug log
    
    if (facilityMap[facility]) {
      const { Quantity, AssetNumber } = facilityMap[facility];
      console.log("Facility data:", { Quantity, AssetNumber }); // Debug log
      
      setQuantityList(createQuantityList(Quantity));
      // Set the asset number using the formik instance
      formik.setFieldValue('assetNumber', AssetNumber || '');
      console.log("Asset number set to:", AssetNumber); // Debug log
    } else {
      console.log("Facility not found in map:", facility); // Debug log for when facility is not found
    }
  };

 
  return (
    <>
      <Dialog 
        open={isOpen} 
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        disableBackdropClick={isSubmitting}
        disableEscapeKeyDown={isSubmitting}
      >
        <DialogTitle>
          Modify Reservation Request - {selectedReservation.referenceNumber}
        </DialogTitle>
        <DialogContent>
          <Formik
            initialValues={initialValues}
            validationSchema={approverValidationSchema}
            onSubmit={() => {}}
          >
            {(formik) => (
              <>
                <form onSubmit={formik.handleSubmit}>
                  <Grid container spacing={3}>
                    {/* Basic Information Section */}
                    <Grid item xs={12}>
                      <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12}>
                            <h3 style={{ margin: 0 }}>Basic Information</h3>
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="Requested By"
                              {...formik.getFieldProps('requestedBy')}
                              error={formik.touched.requestedBy && Boolean(formik.errors.requestedBy)}
                              helperText={formik.touched.requestedBy && formik.errors.requestedBy}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="Department"
                              {...formik.getFieldProps('department')}
                              error={formik.touched.department && Boolean(formik.errors.department)}
                              helperText={formik.touched.department && formik.errors.department}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="Contact Number"
                              {...formik.getFieldProps('contactNumber')}
                              error={formik.touched.contactNumber && Boolean(formik.errors.contactNumber)}
                              helperText={formik.touched.contactNumber && formik.errors.contactNumber}
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>

                    {/* Venue Details Section */}
                    <Grid item xs={12}>
                      <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12}>
                            <h3 style={{ margin: 0 }}>Venue Details</h3>
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="Building"
                              {...formik.getFieldProps('building')}
                              error={formik.touched.building && Boolean(formik.errors.building)}
                              helperText={formik.touched.building && formik.errors.building}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="Venue"
                              {...formik.getFieldProps('venue')}
                              error={formik.touched.venue && Boolean(formik.errors.venue)}
                              helperText={formik.touched.venue && formik.errors.venue}
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>

                    {/* Date and Time Section */}
                    <Grid item xs={12}>
                      <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12}>
                            <h3 style={{ margin: 0 }}>Date and Time</h3>
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="From Date"
                              type="datetime-local"
                              InputLabelProps={{ shrink: true }}
                              {...formik.getFieldProps('fromDate')}
                              error={formik.touched.fromDate && Boolean(formik.errors.fromDate)}
                              helperText={formik.touched.fromDate && formik.errors.fromDate}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="To Date"
                              type="datetime-local"
                              InputLabelProps={{ shrink: true }}
                              {...formik.getFieldProps('toDate')}
                              error={formik.touched.toDate && Boolean(formik.errors.toDate)}
                              helperText={formik.touched.toDate && formik.errors.toDate}
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>

                    {/* Purpose and Participants Section */}
                    <Grid item xs={12}>
                      <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12}>
                            <h3 style={{ margin: 0 }}>Purpose and Participants</h3>
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Purpose of Use"
                              multiline
                              rows={3}
                              {...formik.getFieldProps('purposeOfUse')}
                              error={formik.touched.purposeOfUse && Boolean(formik.errors.purposeOfUse)}
                              helperText={formik.touched.purposeOfUse && formik.errors.purposeOfUse}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="Number of Participants"
                              type="number"
                              {...formik.getFieldProps('numberOfParticipants')}
                              error={formik.touched.numberOfParticipants && Boolean(formik.errors.numberOfParticipants)}
                              helperText={formik.touched.numberOfParticipants && formik.errors.numberOfParticipants}
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>

                    {/* Facilities Section - Only shown for CRSD venues */}
                    {showCSRDField && (
                      <Grid item xs={12}>
                        <FacilityList
                          facilityData={facilityData}
                          onAddClick={() => setShowFacilityDialog(true)}
                          onEditClick={(index) => {
                            const data = facilityData[index];
                            formik.setFieldValue("facility", data.facility);
                            formik.setFieldValue("quantity", data.quantity);
                            formik.setFieldValue("assetNumber", data.assetNumber);
                            formik.setFieldValue("currentRecord", index);
                            setShowFacilityDialog(true);
                          }}
                        />
                      </Grid>
                    )}
                  </Grid>

                  <DialogActions>
                    <Button 
                      onClick={onClose} 
                      color="default"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      color="primary" 
                      variant="contained"
                      onClick={() => handleSubmit(formik.values, STATUS.APPROVED)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <CircularProgress size={24} /> : 'Approve'}
                    </Button>
                    <Button 
                      color="secondary" 
                      variant="contained"
                      onClick={() => handleSubmit(formik.values, STATUS.DISAPPROVED)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <CircularProgress size={24} /> : 'Reject'}
                    </Button>
                  </DialogActions>
                </form>

                {showCSRDField && (
                  <FacilityDialog
                    open={showFacilityDialog}
                    onClose={() => setShowFacilityDialog(false)}
                    facilityList={facilityList}
                    quantityList={quantityList}
                    formik={formik}
                    onSave={handleFacilitySave}
                    onDelete={handleFacilityDelete}
                    onFacilityChange={(e) => handleFacilityChange(e, formik)}
                  />
                )}
              </>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      <Snackbar 
        open={notification.show} 
        autoHideDuration={6000} 
        onClose={() => setNotification({ ...notification, show: false })}
      >
        <Alert onClose={() => setNotification({ ...notification, show: false })} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

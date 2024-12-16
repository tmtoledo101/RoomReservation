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
  Snackbar,
  FormGroup,
  FormControlLabel,
  Checkbox
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { ITableItem, STATUS } from "./interfaces/IResViews";
import { SharePointService } from "./services/SharePointService";
import { approverValidationSchema } from "./utils/approverValidation";
import { formatDateForInput } from "./utils/helpers";
import { FacilityList } from "./common/FacilityList";
import { FacilityDialog } from "./common/FacilityDialog";
import { IFacilityData, IDropdownItem, IFacilityMapItem } from "./interfaces/IFacility";

interface IApproverReservationFormProps {
  isOpen: boolean;
  selectedReservation: ITableItem | null;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

// Basic Information Section Component
const BasicInformationSection: React.FC<any> = ({ formik }) => (
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
);

// Venue Details Section Component
const VenueDetailsSection: React.FC<any> = ({ formik }) => (
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
);

// CRSD Fields Section Component
const CRSDFieldsSection: React.FC<{
  formik: any;
  showCSRDField: boolean;
  layoutList: IDropdownItem[];
  principalList: IDropdownItem[];
}> = ({ formik, showCSRDField, layoutList, principalList }) => (
  showCSRDField && (
    <Grid item xs={12}>
      <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <h3 style={{ margin: 0 }}>CRSD Details</h3>
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              fullWidth
              label="Layout Tables/Chairs"
              {...formik.getFieldProps('layout')}
              error={formik.touched.layout && Boolean(formik.errors.layout)}
              helperText={formik.touched.layout && formik.errors.layout}
              SelectProps={{
                native: true,
              }}
            >
              <option value=""></option>
              {layoutList.map((option) => (
                <option key={option.id} value={option.value}>
                  {option.value}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Contact Person"
              {...formik.getFieldProps('contactPerson')}
              error={formik.touched.contactPerson && Boolean(formik.errors.contactPerson)}
              helperText={formik.touched.contactPerson && formik.errors.contactPerson}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              fullWidth
              label="Principal User"
              {...formik.getFieldProps('principal')}
              error={formik.touched.principal && Boolean(formik.errors.principal)}
              helperText={formik.touched.principal && formik.errors.principal}
              SelectProps={{
                native: true,
              }}
            >
              <option value=""></option>
              {principalList.map((option) => (
                <option key={option.id} value={option.value}>
                  {option.value}
                </option>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  )
);

// Date and Time Section Component
const DateTimeSection: React.FC<any> = ({ formik }) => (
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
);

// Purpose and Participants Section Component
const PurposeParticipantsSection: React.FC<{
  formik: any;
  purposeOfUseList: IDropdownItem[];
}> = ({ formik, purposeOfUseList }) => {
  const participantOptions = [
    { id: "Non-BSP Personnel", value: "Non-BSP Personnel" },
    { id: "Personnel from other BSP Office", value: "Personnel from other BSP Office" },
    { id: "BSP-QC Personnel", value: "BSP-QC Personnel" }
  ];

  return (
    <Grid item xs={12}>
      <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <h3 style={{ margin: 0 }}>Purpose and Participants</h3>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title Description"
              {...formik.getFieldProps('titleDesc')}
              error={formik.touched.titleDesc && Boolean(formik.errors.titleDesc)}
              helperText={formik.touched.titleDesc && formik.errors.titleDesc}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Purpose of Use"
              {...formik.getFieldProps('purposeOfUse')}
              error={formik.touched.purposeOfUse && Boolean(formik.errors.purposeOfUse)}
              helperText={formik.touched.purposeOfUse && formik.errors.purposeOfUse}
              SelectProps={{
                native: true
              }}
            >
              <option value="">Select</option>
              {purposeOfUseList.map((option) => (
                <option key={option.id} value={option.value}>
                  {option.value}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <FormGroup>
              {participantOptions.map((option) => (
                <FormControlLabel
                  key={option.id}
                  control={
                    <Checkbox
                      checked={formik.values.participant.includes(option.value)}
                      onChange={(e) => {
                        const currentParticipants = [...formik.values.participant];
                        if (e.target.checked) {
                          currentParticipants.push(option.value);
                        } else {
                          const index = currentParticipants.indexOf(option.value);
                          if (index > -1) {
                            currentParticipants.splice(index, 1);
                          }
                        }
                        formik.setFieldValue('participant', currentParticipants);
                      }}
                    />
                  }
                  label={option.value}
                />
              ))}
            </FormGroup>
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
  );
};

// Facilities Section Component
const FacilitiesSection: React.FC<{
  showCSRDField: boolean;
  facilityData: IFacilityData[];
  onAddClick: () => void;
  onEditClick: (index: number) => void;
}> = ({ showCSRDField, facilityData, onAddClick, onEditClick }) => (
  showCSRDField && (
    <Grid item xs={12}>
      <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <h3 style={{ margin: 0 }}>Facilities</h3>
          </Grid>
          <Grid item xs={12}>
            <FacilityList
              facilityData={facilityData}
              onAddClick={onAddClick}
              onEditClick={onEditClick}
            />
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  )
);

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
  const [layoutList, setLayoutList] = React.useState<IDropdownItem[]>([]);
  const [principalList, setPrincipalList] = React.useState<IDropdownItem[]>([]);
  const [purposeOfUseList, setPurposeOfUseList] = React.useState<IDropdownItem[]>([]);
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
          console.log("Loaded facility map:", map);
          setFacilityList(facilities);
          setFacilityMap(map);
          
          // Load existing facility data if any
          const existingFacilityData = await SharePointService.getFacilityData(selectedReservation.ID);
          if (existingFacilityData && existingFacilityData.length > 0) {
            setFacilityData(existingFacilityData);
            setShowCSRDField(true);
          }
          
          // Then check venue group if no facility data exists
          if (selectedReservation.venue) {
            const isCRSD = await SharePointService.isVenueCRSD(selectedReservation.venue);
            setShowCSRDField(isCRSD);

            if (isCRSD) {
              // Load layouts for the venue
              const layouts = await SharePointService.getLayouts(selectedReservation.venue);
              setLayoutList(layouts);

              // Load principal users for the department
              if (selectedReservation.department) {
                const principalMap = await SharePointService.getPrincipalUsers(selectedReservation.department);
                if (principalMap[selectedReservation.department]) {
                  setPrincipalList(
                    principalMap[selectedReservation.department].map(name => ({
                      id: name,
                      value: name
                    }))
                  );
                }
              }
            }
          }

          // Load purpose of use options
          const purposeOfUse = await SharePointService.getPurposeOfUse();
          setPurposeOfUseList(purposeOfUse);

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
    currentRecord: -1,
    layout: selectedReservation.layout || "",
    contactPerson: selectedReservation.contactPerson || "",
    principal: selectedReservation.principal || "",
    titleDesc: selectedReservation.titleDesc || "",
    purposeOfUse: selectedReservation.purposeOfUse || "",
    participant: selectedReservation.participant || []
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

  const handleFacilityChange = (e: any, formik: any): void => {
    const facility = e.target.value as string;
    if (facilityMap[facility]) {
      const { Quantity, AssetNumber } = facilityMap[facility];
      setQuantityList(createQuantityList(Quantity));
      formik.setFieldValue('assetNumber', AssetNumber || '');
    }
  };

  const createQuantityList = (quantity: number): IDropdownItem[] => {
    return Array.from({ length: quantity }, (_, i) => ({
      id: (i + 1).toString(),
      value: (i + 1).toString()
    }));
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
                    <BasicInformationSection formik={formik} />
                    <VenueDetailsSection formik={formik} />
                    <CRSDFieldsSection 
                      formik={formik}
                      showCSRDField={showCSRDField}
                      layoutList={layoutList}
                      principalList={principalList}
                    />
                    <DateTimeSection formik={formik} />
                    <PurposeParticipantsSection 
                      formik={formik}
                      purposeOfUseList={purposeOfUseList}
                    />
                    <FacilitiesSection
                      showCSRDField={showCSRDField}
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

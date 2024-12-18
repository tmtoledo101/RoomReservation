import * as React from "react";
import { Formik } from "formik";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Grid,
  Button,
  CircularProgress,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { ITableItem, STATUS } from "./interfaces/IResViews";
import { SharePointService } from "./services/SharePointService";
import { approverValidationSchema } from "./utils/approverValidation";
import { formatDateForInput } from "./utils/helpers";
import { FacilityDialog } from "./common/FacilityDialog";
import { IFacilityData, IDropdownItem, IFacilityMapItem } from "./interfaces/IFacility";

// Import new components
import { BasicInformationSection } from "./approverForm/BasicInformationSection";
import { VenueDetailsSection } from "./approverForm/VenueDetailsSection";
import { CRSDFieldsSection } from "./approverForm/CRSDFieldsSection";
import { DateTimeSection } from "./approverForm/DateTimeSection";
import { PurposeParticipantsSection } from "./approverForm/PurposeParticipantsSection";
import { FacilitiesSection } from "./approverForm/FacilitiesSection";

interface IApproverReservationFormProps {
  isOpen: boolean;
  selectedReservation: ITableItem | null;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

const formatDateTime12Hour = (dateString: string | undefined) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
  return `${date.toLocaleDateString()} ${hours}:${formattedMinutes} ${ampm}`;
};

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
  const [files, setFiles] = React.useState<File[]>([]);
  const [notification, setNotification] = React.useState<{
    show: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    show: false,
    message: "",
    severity: "success"
  });

  const [status, setStatus] = React.useState<string>(selectedReservation? selectedReservation.status : STATUS.PENDING);

  React.useEffect(() => {
    const init = async () => {
      if (isOpen && selectedReservation) {
        try {
          // Load facilities first
          const { facilityList: facilities, facilityMap: map } = await SharePointService.getFacilities();
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
    if(selectedReservation) {
      setStatus(selectedReservation.status);
    }
  }, [isOpen, selectedReservation]);

  if (!selectedReservation) return null;

  const initialValues = {
    ...selectedReservation,
    fromDate: formatDateTime12Hour(selectedReservation.fromDate),
    toDate: formatDateTime12Hour(selectedReservation.toDate),
    facility: "",
    quantity: "",
    assetNumber: "",
    currentRecord: -1,
    layout: selectedReservation.layout || "",
    contactPerson: selectedReservation.contactPerson || "",
    principal: selectedReservation.principal || "",
    titleDesc: selectedReservation.titleDesc || "",
    purposeOfUse: selectedReservation.purposeOfUse || "",
    participant: selectedReservation.participant || [],
    otherRequirment: selectedReservation.otherRequirment || ""
  };

  const handleSubmit = async (values: any) => {
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
    if (facilityMap[facility]) {
      const { Quantity, AssetNumber } = facilityMap[facility];
      setQuantityList(createQuantityList(Quantity));
      formik.setFieldValue('assetNumber', AssetNumber || '');
    }
  };

  const handleFilesChange = (newFiles: File[]): void => {
    setFiles(newFiles);
  };

  const handleStatusChange = (event: React.ChangeEvent<{ value: any }>) => {
    setStatus(event.target.value as string);
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
                      onFilesChange={handleFilesChange}
                      formik={formik}
                    />
                  </Grid>
                  <FormControl fullWidth style={{ marginTop: 16 }}>
                    <InputLabel id="status-select-label">Status</InputLabel>
                    <Select
                      labelId="status-select-label"
                      id="status-select"
                      value={status}
                      onChange={handleStatusChange}
                    >
                      {Object.values(STATUS).map((statusOption) => (
                        <MenuItem key={statusOption} value={statusOption}>
                          {statusOption}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                      onClick={() => handleSubmit(formik.values)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <CircularProgress size={24} /> : 'Update'}
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

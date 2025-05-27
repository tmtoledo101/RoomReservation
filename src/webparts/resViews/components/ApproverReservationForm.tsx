/*
This component provides a form for approvers to modify reservation requests. It handles the display of reservation details,
 * allows approvers to update the reservation status (Approve/Reject), and manages related data such as facilities and venue details.
 *
*/
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
  MenuItem,
  Paper
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { ITableItem, STATUS } from "./interfaces/IResViews";
import { SharePointService } from "./services/SharePointService";
import { approverValidationSchema } from "./utils/approverValidation";
import { newResEmail } from "./utils/helpers";
import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { FacilityDialog } from "./common/FacilityDialog";
import { IFacilityData, IDropdownItem, IFacilityMapItem } from "./interfaces/IFacility";
import { ConfirmationDialog } from "./common/ConfirmationDialog";
import { FileList } from "./common/FileList";
// Import new components
import { BasicInformationSection } from "./approverForm/BasicInformationSection";
import { VenueDetailsSection } from "./approverForm/VenueDetailsSection";
import { CRSDFieldsSection } from "./approverForm/CRSDFieldsSection";
import { DateTimeSection } from "./approverForm/DateTimeSection";
import { PurposeParticipantsSection } from "./approverForm/PurposeParticipantsSection";
import { FacilitiesSection } from "./approverForm/FacilitiesSection";
import { ModalPopup } from "./common/ModalPopup";

interface IApproverReservationFormProps {
  isOpen: boolean;
  selectedReservation: ITableItem | null;
  onClose: () => void;
  onUpdateSuccess: () => void;
  context: any;
  siteUrl: string;
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
  context,
  siteUrl
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showFacilityDialog, setShowFacilityDialog] = React.useState(false);
  const [showCSRDField, setShowCSRDField] = React.useState(false);
  // Use a state to hold facility data specific to the current reservation
  const [currentFacilityData, setCurrentFacilityData] = React.useState<IFacilityData[]>([]);
  const [facilityList, setFacilityList] = React.useState<IDropdownItem[]>([]);
  const [quantityList, setQuantityList] = React.useState<IDropdownItem[]>([]);
  const [facilityMap, setFacilityMap] = React.useState<{ [key: string]: IFacilityMapItem }>({});
  const [layoutList, setLayoutList] = React.useState<IDropdownItem[]>([]);
  const [principalList, setPrincipalList] = React.useState<IDropdownItem[]>([]);
  const [purposeOfUseList, setPurposeOfUseList] = React.useState<IDropdownItem[]>([]);
  const [files, setFiles] = React.useState<File[]>([]);
  const [existingFiles, setExistingFiles] = React.useState<string[]>([]);
  const [siteRelativeUrl, setSiteRelativeUrl] = React.useState<string>("/sites/ResourceReservation");
  const [notification, setNotification] = React.useState<{
    show: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    show: false,
    message: "",
    severity: "success"
  });

  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [pendingValues, setPendingValues] = React.useState<any>(null);

  const [status, setStatus] = React.useState<string>(selectedReservation ? selectedReservation.status : STATUS.PENDING);

  React.useEffect(() => {
    const init = async () => {
      if (isOpen && selectedReservation) {
        try {
          // Load facilities first
          const { facilityList: facilities, facilityMap: map } = await SharePointService.getFacilities();
          setFacilityList(facilities);
          setFacilityMap(map);

          // Load existing facility data for the selected reservation
          const existingFacilityData = await SharePointService.getFacilityData(selectedReservation.ID);
          if (existingFacilityData && existingFacilityData.length > 0) {
            setCurrentFacilityData(existingFacilityData);
            setShowCSRDField(true);
          } else {
            setCurrentFacilityData([]); // Ensure it's empty for new requests or when no data exists
          }
          
          // Load existing files if available
          console.log('Selected reservation:', selectedReservation);
          console.log('Selected reservation GUID:', selectedReservation.guid);
          
          if (selectedReservation.guid) {
            try {
              console.log('Attempting to get files for GUID:', selectedReservation.guid);
              const docs = await SharePointService.getFiles(selectedReservation.guid, siteUrl);
              console.log('Retrieved files:', docs);
              
              if (docs && docs.length > 0) {
                const fileNames = docs.map(file => file.Name);
                console.log('File names:', fileNames);
                setExistingFiles(fileNames);
              } else {
                console.log('No files found for this reservation');
                setExistingFiles([]);
              }
            } catch (error) {
              console.error('Error loading files:', error);
              setExistingFiles([]);
            }
          } else {
            console.log('No GUID available for this reservation');
            setExistingFiles([]);
          }

          // Then check venue group if no facility data exists
          if (selectedReservation.venue) {
            console.log('Selected venue:', selectedReservation.venue);
            const isCRSD = await SharePointService.isVenueCRSD(selectedReservation.venue);
            setShowCSRDField(isCRSD);

            if (isCRSD) {
              // Load layouts for the venue
              const layouts = await SharePointService.getLayouts(selectedReservation.venue);
              setLayoutList(layouts);

              // Load principal users for the department
              if (selectedReservation.department) {
                const spService = new SharePointService();
                const principalMap = await spService.getPrincipalUsers(selectedReservation.department);
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
    if (selectedReservation) {
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
    otherRequirment: selectedReservation.otherRequirment || "",
    isVenueCRSD: false
  };

  const handleConfirmedSubmit = async () => {
    if (!pendingValues) return;

    try {
      setIsSubmitting(true);
      setShowConfirmDialog(false);

      // First update the reservation data
      await SharePointService.updateReservation(
        selectedReservation.ID,
        {
          ...pendingValues,
          status,
          facilityData: showCSRDField ? currentFacilityData : []
        }
      );

      // Then upload files if there are any
      if (files.length > 0 && selectedReservation.guid) {
        try {
          console.log('Uploading files for GUID:', selectedReservation.guid);
          
          // First, ensure the folder exists by adding it to the ReservationDocs list
          try {
            // Just add the GUID as the folder name, not the full path
            await sp.web.lists.getByTitle("ReservationDocs").rootFolder.folders.add(selectedReservation.guid);
            console.log(`Folder created or already exists for GUID: ${selectedReservation.guid}`);
          } catch (folderError) {
            console.log(`Folder might already exist or error creating folder: ${folderError}`);
            // Continue even if there's an error (folder might already exist)
          }
          
          // Use the same hardcoded path as in SharePointService.getFiles method
          const folderPath = "/sites/ResourceReservationDev/ReservationDocs/" + selectedReservation.guid;
          console.log(`Full folder path: ${folderPath}`);
          
          // Upload each file
          for (const file of files) {
            try {
              console.log(`Attempting to upload file: ${file.name} to ${folderPath}`);
              if (file.size <= 10485760) {
                // Regular file upload for files <= 10MB
                const result = await sp.web.getFolderByServerRelativeUrl(folderPath).files.add(file.name, file, true);
                console.log(`File ${file.name} uploaded successfully:`, result);
              } else {
                // Chunked upload for larger files
                const result = await sp.web.getFolderByServerRelativeUrl(folderPath).files.addChunked(file.name, file, data => {
                  console.log(`Upload progress: ${Math.round((data.blockNumber / data.totalBlocks) * 100)}%`);
                }, true);
                console.log(`Large file ${file.name} uploaded successfully:`, result);
              }
            } catch (fileError) {
              console.error(`Error uploading file ${file.name}:`, fileError);
              console.error(fileError);
            }
          }
          
          console.log('All files uploaded successfully');
        } catch (uploadError) {
          console.error('Error during file upload:', uploadError);
          // Continue with the process even if file upload fails
        }
      }

      // Send email notification if status is Approved, Disapproved, or Cancelled
      if (status === STATUS.APPROVED || status === STATUS.DISAPPROVED || status === STATUS.CANCELLED) {
        try {
          // Get requestor email
          const requestorEmail = await SharePointService.getRequestorEmail(selectedReservation.requestedBy);
          
          // Get approver emails
          const { crsdMembers, ddMembers, fssApproversMembers } = await SharePointService.getApproverEmails();
          
          // Determine which group to send to based on building
          let approverEmails = [];
          
          if (pendingValues.building === "HO Multi-Storey Bldg") {
            approverEmails = fssApproversMembers;
          } else if (pendingValues.building === "SPC") {
            // For SPC building, combine both CRSD and DD members
            approverEmails = [...crsdMembers, ...ddMembers];
          } else {
            // For other buildings, use the same logic as before
            const isDDMember = selectedReservation.participant && 
                              Array.isArray(selectedReservation.participant) && 
                              !(selectedReservation.participant.indexOf('BSP-QC Personnel') > -1 && 
                                selectedReservation.participant.length === 1);
            console.log("isDDMember", isDDMember);
            approverEmails = isDDMember ? ddMembers : crsdMembers;
          }
          
          // Get site URL
          const fullSiteUrl = siteUrl;
          
          // Send email notification
          await newResEmail(
            context,
            [requestorEmail], 
            approverEmails, 
            pendingValues, 
            status, 
            fullSiteUrl, 
            selectedReservation.ID,
            selectedReservation.referenceNumber
          );
        } catch (emailError) {
          console.error("Error sending email notification:", emailError);
          // Continue with the process even if email sending fails
        }
      }

      setNotification({
        show: true,
        message: `Reservation ${status === STATUS.APPROVED ? 'approved' : status === STATUS.DISAPPROVED ? 'disapproved' : 'cancelled'} successfully`,
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
//start
const isDateTimeAvailable = async (fromDate: string, toDate: string, reservationId: number) => {
  try {
    // Call your SharePointService to get existing reservations
    const existingReservations = await SharePointService.getAllReservations();

    const from = new Date(fromDate);
    const to = new Date(toDate);

    const conflict = existingReservations.some((reservation: any) => {
      if (reservation.ID === reservationId) return false; // Skip self if editing
      const existingFrom = new Date(reservation.fromDate);
      const existingTo = new Date(reservation.toDate);

      return (from < existingTo && to > existingFrom);
    });

    return !conflict;
  } catch (error) {
    console.error("Error checking date/time availability:", error);
    return false;
  }
};

const handleSubmit = async (values: any) => {
  const fromDate = values.fromDate;
  const toDate = values.toDate;

  const isAvailable = await isDateTimeAvailable(fromDate, toDate, selectedReservation.ID);

  if (!isAvailable) {
    setNotification({
      show: true,
      message: "The selected date and time overlap with an existing reservation. Please choose another slot.",
      severity: "error"
    });
    return;
  }

  setPendingValues(values);
  setShowConfirmDialog(true);
};

  // const handleSubmit = async (values: any) => {
  //   setPendingValues(values);
  //   setShowConfirmDialog(true);
  // };

  const handleFacilitySave = (form: any): void => {
    const newFacilityData = [...currentFacilityData];
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

    setCurrentFacilityData(newFacilityData);
    setShowFacilityDialog(false);
    form.setFieldValue("currentRecord", -1);
  };

  const handleFacilityDelete = (form: any): void => {
    const newFacilityData = [...currentFacilityData];
    newFacilityData.splice(form.values.currentRecord, 1);
    setCurrentFacilityData(newFacilityData);
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

  const handleFileClick = (file: string): void => {
    if (selectedReservation.guid) {
      const fileUrl = `${siteUrl}/ReservationDocs/${selectedReservation.guid}/${file}`;
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = file;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleStatusChange = (event: React.ChangeEvent<{ value: any }>) => {
    setStatus(event.target.value as string);
  };

  return (
    <>
      <ModalPopup
        open={isOpen}
        title=""
        onClose={onClose}
        maxWidth="lg"
        fullWidth
      //disableBackdropClick={isSubmitting}
      //disableEscapeKeyDown={isSubmitting}
      >
        <DialogTitle>
          Modify Reservation Request - {selectedReservation.referenceNumber}
        </DialogTitle>
        <DialogContent>
          <Formik
            initialValues={initialValues}
            validationSchema={approverValidationSchema}
            onSubmit={() => { }}
          >
            {(formik) => (
              <>
                <form onSubmit={formik.handleSubmit}>
                  <Grid container spacing={3}>
                    <BasicInformationSection formik={formik} />
                    <VenueDetailsSection
                      formik={formik}
                      onVenueSelect={async (venue) => {
                        try {
                          const isCRSD = await SharePointService.isVenueCRSD(venue.value);
                          setShowCSRDField(isCRSD);
                          formik.setFieldValue('isVenueCRSD', isCRSD);

                          if (isCRSD) {
                            // Load layouts for the venue
                            const layouts = await SharePointService.getLayouts(venue.value);
                            setLayoutList(layouts);

                            // Load principal users if department is set
                            if (formik.values.department) {
                              const spService = new SharePointService();
                              const principalMap = await spService.getPrincipalUsers(formik.values.department);
                              if (principalMap[formik.values.department]) {
                                setPrincipalList(
                                  principalMap[formik.values.department].map(name => ({
                                    id: name,
                                    value: name
                                  }))
                                );
                              }
                            }
                          } else {
                            setLayoutList([]);
                            setPrincipalList([]);
                            // Clear facility data when venue is not CRSD
                            setCurrentFacilityData([]);
                          }
                        } catch (error) {
                          console.error('Error handling venue selection:', error);
                          setShowCSRDField(false);
                          formik.setFieldValue('isVenueCRSD', false);
                          setCurrentFacilityData([]);
                          setLayoutList([]);
                          setPrincipalList([]);
                        }
                      }}
                    />
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
                      facilityData={currentFacilityData}
                      onAddClick={() => setShowFacilityDialog(true)}
                      onEditClick={(index) => {
                        const data = currentFacilityData[index];
                        formik.setFieldValue("facility", data.facility);
                        formik.setFieldValue("quantity", data.quantity);
                        formik.setFieldValue("assetNumber", data.assetNumber);
                        formik.setFieldValue("currentRecord", index);
                        setShowFacilityDialog(true);
                      }}
                      onFilesChange={handleFilesChange}
                      existingFiles={existingFiles}
                      onFileClick={handleFileClick}
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

                  <ConfirmationDialog
                    open={showConfirmDialog}
                    title="Confirm Update"
                    message={`Are you sure you want to ${status.toLowerCase()} this reservation?`}
                    onConfirm={handleConfirmedSubmit}
                    onClose={() => setShowConfirmDialog(false)}
                    confirmLabel="Update"
                  />
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
      </ModalPopup>

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

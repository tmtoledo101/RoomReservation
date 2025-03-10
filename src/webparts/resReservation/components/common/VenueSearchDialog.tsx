{/*The VenueSearchDialog component provides a comprehensive search interface for finding 
  and booking available venues within the Resource Reservation System.The component is used in:
Main reservation form for venue selection
Venue availability checking
Booking modification interfaces*/}

import * as React from "react";
import * as moment from "moment";
import {
  TextField,
  List,
  ListItem,
  ListItemText,
  Grid,
  Button,
  Typography,
  Paper,
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import { Formik } from "formik";


import { ModalPopup } from "./ModalPopup";
import { CustomDateTimePicker, Dropdown } from "./FormComponents";
import { validationSchema } from "../utils/validation";
import { SharePointService } from "../services/SharePointService";
import { ConfirmationDialog } from "./ConfirmationDialog";
import styles from "../ResReservation.module.scss";

interface IVenueSearchDialogProps {
  open: boolean;
  onClose: () => void;
  buildingList: any[];
  venueList: any[];
  departmentList: any[];
  departmentSectorMap: { [key: string]: string };
  onVenueSelect: (venue: any, fromDate: Date | null, toDate: Date | null, department: string) => void;
  initialDepartment?: string;
  initialBuilding?: string;
  initialFromDate?: Date | null;
  initialToDate?: Date | null;
}

export const VenueSearchDialog: React.FC<IVenueSearchDialogProps> = ({
  open,
  onClose,
  buildingList,
  venueList,
  departmentList,
  departmentSectorMap,
  onVenueSelect,
  initialDepartment = "",
  initialBuilding = "",
  initialFromDate = null,
  initialToDate = null,
  
}) => {
  const [selectedBuilding, setSelectedBuilding] = React.useState(initialBuilding);
  const [filteredVenueList, setFilteredVenueList] = React.useState(venueList);
  const [unavailableVenues, setUnavailableVenues] = React.useState<string[]>([]);
  const [showResults, setShowResults] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [selectedVenue, setSelectedVenue] = React.useState<any>(null);
  const [selectedFormikValues, setSelectedFormikValues] = React.useState<any>(null);
  const spService = new SharePointService();

  // Update selected building when initialBuilding changes
  React.useEffect(() => {
    setSelectedBuilding(initialBuilding);
  }, [initialBuilding]);

  const handleDepartmentChange = async (e: any, formik: any): Promise<void> => {
    const { value } = e.target;
    console.log("VenueSearchDialog - Department changing to:", value);
    
    try {
      let newVenue = venueList;
      
      if (value && departmentSectorMap[value] !== "FSS") {
        newVenue = venueList.filter((item) => item.exclusiveTo !== "FSS");
      }

      // Update filtered venue list
      setFilteredVenueList(newVenue);

      // Set department value in formik
      await formik.setFieldValue("department", value);
      await formik.setFieldTouched("department", true);
      
      // Reset principal value since department changed
      await formik.setFieldValue("principal", "");
      
      // Reset search results
      setShowResults(false);

      // Log updated formik values
      console.log("VenueSearchDialog - Updated formik values:", {
        department: formik.values.department,
        principal: formik.values.principal,
        allValues: formik.values
      });
    } catch (error) {
      console.error("VenueSearchDialog - Error in handleDepartmentChange:", error);
    }
  };

  const handleBuildingChange = (e: any, formik: any): void => {
    const { value } = e.target;
    setSelectedBuilding(value);
    formik.setFieldValue("building", value);
    formik.setFieldTouched("building", true);
    formik.setFieldValue("building", value);
    setShowResults(false);
  };

  const handleSearch = async (formik: any): Promise<void> => {
    const { fromDate, toDate } = formik.values;
    if (fromDate && toDate && !formik.errors.fromDate && !formik.errors.toDate) {
      try {
        const unavailableVenueList = await spService.checkVenueAvailability(fromDate, toDate);
        setUnavailableVenues(unavailableVenueList);
        setShowResults(true);
      } catch (error) {
        console.error('Error checking venue availability:', error);
      }
    }
  };

  const handleVenueClick = async (venue: any, formikValues: any): Promise<void> => {
    try {
      console.log("VenueSearchDialog - Venue clicked with values:", {
        venue,
        formikValues,
        department: formikValues.department
      });

      if (!formikValues.department) {
        console.error("VenueSearchDialog - Department is required");
        return;
      }

      // Create complete form values
      const completeValues = {
        ...formikValues,
        building: venue.building || "",
        venue: venue.value,
        IsCSDR: venue.group === 'CRSD'
      };

      // Store values in state
      setSelectedVenue(venue);
      setSelectedFormikValues(completeValues);

      // Open confirmation dialog
      setConfirmationOpen(true);

      console.log("VenueSearchDialog - Values prepared:", {
        venue,
        completeValues,
        originalValues: formikValues
      });
    } catch (error) {
      console.error("VenueSearchDialog - Error in handleVenueClick:", error);
    }
  };
  const handleCloseDialog = (): void => {
    setUnavailableVenues([]);
    setShowResults(false);
    setConfirmationOpen(false);
    setSelectedVenue(null);
    setSelectedFormikValues(null);
    onClose();
  };

  const handleConfirmVenue = async (): Promise<void> => {
    if (!selectedVenue || !selectedFormikValues) {
      console.warn("VenueSearchDialog - Missing venue or form values");
      return;
    }

    try {
      console.log("VenueSearchDialog - Confirming venue selection:", {
        venue: selectedVenue,
        formValues: selectedFormikValues
      });

      if (!selectedFormikValues.department) {
        console.error("VenueSearchDialog - Department value is missing");
        return;
      }

      // Call onVenueSelect with complete values
      await onVenueSelect(
        selectedVenue,
        selectedFormikValues.fromDate, 
        selectedFormikValues.toDate,
        selectedFormikValues.department
      );

      console.log("VenueSearchDialog - Venue selection confirmed successfully");
      handleCloseDialog();
    } catch (error) {
      console.error("VenueSearchDialog - Error confirming venue selection:", error);
      // Keep dialog open on error
      setConfirmationOpen(false);
    }
  };

  
  const canSearch = (formik: any): boolean => {
    return formik.values.department &&
            formik.values.building && 
           formik.values.fromDate && 
           formik.values.toDate && 
           !formik.errors.fromDate && 
           !formik.errors.toDate;
  };

  const filteredVenues = React.useMemo(() => {
    return filteredVenueList.filter((venue) => {
      const matchesBuilding = !selectedBuilding || venue.building === selectedBuilding;
      const isAvailable = !unavailableVenues.includes(venue.value);
      return matchesBuilding && isAvailable;
    });
  }, [filteredVenueList, selectedBuilding, unavailableVenues]);

  return (
    <>
      <ModalPopup
        open={open}
        onClose={handleCloseDialog}
        title="Search Venue"
        maxWidth="lg"
        fullWidth={true}
      >
        <Formik
          initialValues={{
            requestedBy: "",
            department: initialDepartment,
            building: initialBuilding,
            venue: "",
            participant: "",
            purposeOfUse: "",
            contactNumber: "",
            numberOfParticipant: "",
            titleDesc: "",
            isCSDR: false,
            layout: "",
            principal: "",
            contactPerson: "",
            fromDate: initialFromDate,
            toDate: initialToDate
          }}
          validationSchema={validationSchema}
          onSubmit={() => {}}
          enableReinitialize={true}
        >
          {(formik) => (
            <div style={{ padding: "30px" }}>
              <Grid container spacing={4}>
                {/* Department Selection */}
                <Grid item xs={12}>
                  <div className={styles.width}>
                    <div className={styles.label}>Department</div>
                      <TextField
                         select
                        fullWidth
                        variant="outlined"
                        name="department"
                        value={formik.values.department}
                        onChange={(e) => handleDepartmentChange(e, formik)}
                        error={formik.touched.department && Boolean(formik.errors.department)}
                        helperText={formik.touched.department && formik.errors.department}
                        SelectProps={{
                          native: true
                        }}
                        >
                        <option value="">Select Department</option>
                        {departmentList.map((dept) => (
                        <option key={dept.id} value={dept.value}>
                        {dept.value}
                        </option>
                        ))}
                      </TextField>
                  </div>
                </Grid>

                {/* Building Filter Section */}
                <Grid item xs={12}>
                  <div className={styles.width}>
                    <div className={styles.label}>Building</div>
                    <TextField
                      select
                      fullWidth
                      variant="outlined"
                      name="building"
                      value={formik.values.building}
                      onChange={(e) => handleBuildingChange(e, formik)}
                      error={formik.touched.building && Boolean(formik.errors.building)}
                      helperText={formik.touched.building && formik.errors.building}
                      SelectProps={{
                        native: true
                      }}
                    >
                      <option value="">All Buildings</option>
                      {buildingList.map((building) => (
                        <option key={building.id} value={building.value}>
                          {building.value}
                        </option>
                      ))}
                    </TextField>
                  </div>
                </Grid>

                {/* Date Selection Section */}
                <Grid item xs={12}>
                  <Grid container spacing={4}>
                    <Grid item xs={6}>
                      <div className={styles.width}>
                        <div className={styles.label}>Date and Time of use - From</div>
                        <CustomDateTimePicker 
                          name="fromDate"
                          handleChange={() => setShowResults(false)}
                        />
                      </div>
                    </Grid>

                    <Grid item xs={6}>
                      <div className={styles.width}>
                        <div className={styles.label}>Date and Time of use - To</div>
                        <CustomDateTimePicker 
                          name="toDate"
                          handleChange={() => setShowResults(false)}
                        />
                      </div>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Search Button */}
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SearchIcon />}
                    fullWidth
                    onClick={() => handleSearch(formik)}
                    disabled={!canSearch(formik)}
                  >
                    Search Available Venues
                  </Button>
                </Grid>

                {/* Venues List Section */}
                {showResults && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" style={{ marginBottom: "15px", fontWeight: 500 }}>
                      {filteredVenues.length} venues available
                    </Typography>
                    <Paper style={{ maxHeight: "400px", overflow: "auto" }}>
                      <List>
                        {filteredVenues.map((venue) => (
                          <ListItem
                            button
                            key={venue.id || venue.value}
                            onClick={() => handleVenueClick(venue, formik.values)}
                            divider
                            style={{ padding: "16px" }}
                          >
                            <ListItemText
                              primary={<Typography variant="h6">{venue.value}</Typography>}
                              secondary={
                                <Typography variant="body2" style={{ marginTop: "8px" }}>
                                  Building: {venue.building || 'N/A'}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </div>
          )}
        </Formik>
      </ModalPopup>

      <ConfirmationDialog
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={handleConfirmVenue}
        title="Confirm Venue Booking"
        message={`Do you want to book this venue: ${selectedVenue && selectedVenue.value ? selectedVenue.value : ''} ${selectedFormikValues ? `for the period from ${moment(selectedFormikValues.fromDate).format('LLL')} to ${moment(selectedFormikValues.toDate).format('LLL')}` : ''}?`}
        confirmLabel="Book Venue"
        cancelLabel="Cancel"
      />

    </>
  );
};

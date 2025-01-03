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

  const handleDepartmentChange = (e: any, formik: any): void => {
    const { value } = e.target;
    let newVenue = venueList;
    
    if (value && departmentSectorMap[value] !== "FSS") {
      newVenue = venueList.filter((item) => item.exclusiveTo !== "FSS");
    }

    setFilteredVenueList(newVenue);
    formik.setFieldValue("department", value);
    formik.setFieldTouched("department", true);
    formik.setFieldValue("department", value);
    setShowResults(false);
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

  const handleVenueClick = (venue: any, values: any): void => {
    setSelectedVenue(venue);
    setSelectedFormikValues(values);
    setConfirmationOpen(true);
  };
  const handleCloseDialog = (): void => {
    setUnavailableVenues([]);
    setShowResults(false);
    setConfirmationOpen(false);
    setSelectedVenue(null);
    setSelectedFormikValues(null);
    onClose();
  };

  const handleConfirmVenue = (): void => {
    if (selectedVenue && selectedFormikValues) {
      onVenueSelect(
        selectedVenue, 
        selectedFormikValues.fromDate, 
        selectedFormikValues.toDate,
        selectedFormikValues.department
      );
      handleCloseDialog();
    }
  };

  
  const canSearch = (formik: any): boolean => {
    return formik.values.department && 
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

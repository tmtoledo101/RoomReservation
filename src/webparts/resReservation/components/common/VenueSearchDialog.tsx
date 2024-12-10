import * as React from "react";
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
}

export const VenueSearchDialog: React.FC<IVenueSearchDialogProps> = ({
  open,
  onClose,
  buildingList,
  venueList,
  departmentList,
  departmentSectorMap,
  onVenueSelect,
}) => {
  const [selectedBuilding, setSelectedBuilding] = React.useState("");
  const [filteredVenueList, setFilteredVenueList] = React.useState(venueList);
  const [unavailableVenues, setUnavailableVenues] = React.useState<string[]>([]);
  const [showResults, setShowResults] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [selectedVenue, setSelectedVenue] = React.useState<any>(null);
  const [selectedFormikValues, setSelectedFormikValues] = React.useState<any>(null);
  const spService = new SharePointService();

  const handleDepartmentChange = (e: any, formik: any): void => {
    const { value } = e.target;
    let newVenue = venueList;
    
    if (value && departmentSectorMap[value] !== "FSS") {
      newVenue = venueList.filter((item) => item.exclusiveTo !== "FSS");
    }

    setFilteredVenueList(newVenue);
    formik.setFieldValue("department", value);
    setSelectedBuilding("");
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

  const handleConfirmVenue = (): void => {
    if (selectedVenue && selectedFormikValues) {
      onVenueSelect(
        selectedVenue, 
        selectedFormikValues.fromDate, 
        selectedFormikValues.toDate,
        selectedFormikValues.department // Pass the department value
      );
      handleCloseDialog();
    }
  };

  const handleCloseDialog = (): void => {
    setSelectedBuilding("");
    setUnavailableVenues([]);
    setShowResults(false);
    setConfirmationOpen(false);
    setSelectedVenue(null);
    setSelectedFormikValues(null);
    onClose();
  };

  const canSearch = (formik: any): boolean => {
    return formik.values.department && // Require department selection
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
            department: "",
            building: "",
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
            fromDate: null,
            toDate: null
          }}
          validationSchema={validationSchema}
          onSubmit={() => {}}
        >
          {(formik) => (
            <div style={{ padding: "30px" }}>
              <Grid container spacing={4}>
                {/* Department Selection */}
                <Grid item xs={12}>
                  <div className={styles.width}>
                    <div className={styles.label}>Department</div>
                    <Dropdown
                      items={departmentList}
                      name="department"
                      handleChange={(e) => handleDepartmentChange(e, formik)}
                    />
                  </div>
                </Grid>

                {/* Building Filter Section */}
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Filter by Building"
                    variant="outlined"
                    value={selectedBuilding}
                    onChange={(e) => {
                      setSelectedBuilding(e.target.value);
                      setShowResults(false);
                    }}
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
        message={`Do you want to book this venue: ${selectedVenue && selectedVenue.value ? selectedVenue.value : ''}`}
        confirmLabel="Book Venue"
        cancelLabel="Cancel"
      />
    </>
  );
};

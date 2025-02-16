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
  Dialog,
  DialogTitle,
  DialogContent,
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import { Formik } from "formik";
import * as moment from "moment";
import { VenueDateTimePicker } from "./VenueDateTimePicker";
import { SharePointService } from "../services/SharePointService";
import styles from "../ResViews.module.scss";
import {validationSchema} from "../utils/validation";
import{ validateDateTime_, validateDateRange } from "../utils/helpers";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { ModalPopup } from "./ModalPopup";
// Validation helper functions

// Validation schema


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
  const [filteredVenueList, setFilteredVenueList] = React.useState(venueList);
  const [unavailableVenues, setUnavailableVenues] = React.useState<string[]>([]);
  const [showResults, setShowResults] = React.useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = React.useState(false);
  const [selectedVenue, setSelectedVenue] = React.useState<any>(null);
  const [selectedFormikValues, setSelectedFormikValues] = React.useState<any>(null);

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
    formik.setFieldValue("building", value);
    formik.setFieldTouched("building", true);
    formik.setFieldValue("building", value);
    setShowResults(false);
  };


  const handleSearch = async (formik: any): Promise<void> => {
    const { fromDate, toDate } = formik.values;
    
    try {
      await formik.validateForm();
      if (formik.isValid && fromDate && toDate) {
        const unavailableVenueList = await SharePointService.checkVenueAvailability(fromDate, toDate);
        setUnavailableVenues(unavailableVenueList);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error checking venue availability:', error);
    }
  };

  const handleVenueClick = (venue: any, values: any): void => {
    setSelectedVenue(venue);
    setSelectedFormikValues(values);
    setConfirmDeleteDialogOpen(true);
  };

  const handleDateChange = (date: Date | null, name: string, formik: any): void => {
    formik.setFieldValue(name, date);
    formik.setFieldTouched(name, true);
    formik.setFieldValue(name, date);
    setShowResults(false);
  };

  const canSearch = (formik: any): boolean => {
    return formik.values.department && 
           formik.values.building &&
           formik.values.fromDate && 
           formik.values.toDate &&
           !formik.errors.department &&
           !formik.errors.building &&
           !formik.errors.fromDate && 
           !formik.errors.toDate &&
           validateDateTime_(formik.values.fromDate, formik.values.toDate) &&
           validateDateRange(formik.values.fromDate, formik.values.toDate);
  };

  return (
    <ModalPopup
      open={open}
      title=""
      onClose={onClose}
      maxWidth="lg"
      fullWidth={true}
    >
      <DialogTitle>Search Venue</DialogTitle>
      <DialogContent>
        <Formik
          initialValues={{
            department: initialDepartment,
            building: initialBuilding,
            fromDate: initialFromDate,
            toDate: initialToDate
          }}
          validationSchema={validationSchema}
          onSubmit={() => {}}
          enableReinitialize={true}
        >
          {(formik) => {
            const filteredVenues = React.useMemo(() => {
              return filteredVenueList.filter((venue) => {
                const matchesBuilding = !formik.values.building || venue.building === formik.values.building;
                const isAvailable = !unavailableVenues.includes(venue.value);
                return matchesBuilding && isAvailable;
              });
            }, [filteredVenueList, formik.values.building, unavailableVenues]);

            return (
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
                          <VenueDateTimePicker 
                            name="fromDate"
                            handleChange={(date, name) => handleDateChange(date, name, formik)}
                          />
                        </div>
                      </Grid>

                      <Grid item xs={6}>
                        <div className={styles.width}>
                          <div className={styles.label}>Date and Time of use - To</div>
                          <VenueDateTimePicker 
                            name="toDate"
                            handleChange={(date, name) => handleDateChange(date, name, formik)}
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
            );
          }}
        </Formik>
        {selectedVenue && selectedFormikValues && (
          <ConfirmationDialog
            open={confirmDeleteDialogOpen}
            title="Confirm Venue Selection"
            message={`Are you sure you want to select ${selectedVenue.value} for the period from ${moment(selectedFormikValues.fromDate).format('LLL')} to ${moment(selectedFormikValues.toDate).format('LLL')}?`}
            onClose={() => setConfirmDeleteDialogOpen(false)}
            onConfirm={() => {
              try {
                // Ensure we have valid dates
                const fromDate = selectedFormikValues.fromDate ? new Date(selectedFormikValues.fromDate) : null;
                const toDate = selectedFormikValues.toDate ? new Date(selectedFormikValues.toDate) : null;

                // Validate dates
                if (fromDate && isNaN(fromDate.getTime())) {
                  console.error('Invalid fromDate');
                  return;
                }
                if (toDate && isNaN(toDate.getTime())) {
                  console.error('Invalid toDate');
                  return;
                }

                // Call onVenueSelect with validated dates
                onVenueSelect(
                  selectedVenue,
                  fromDate,
                  toDate,
                  selectedFormikValues.department
                );
                onClose();
                setConfirmDeleteDialogOpen(false);
              } catch (error) {
                console.error('Error in venue selection confirmation:', error);
              }
            }}
          />
        )}
      </DialogContent>
    </ModalPopup>
  );
};

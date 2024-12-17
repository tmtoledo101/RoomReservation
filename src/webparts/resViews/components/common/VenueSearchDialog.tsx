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
import { CustomDateTimePicker } from "./CustomDateTimePicker";
import { SharePointService } from "../services/SharePointService";
import styles from "../ResViews.module.scss";

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
    setSelectedBuilding("");
    setShowResults(false);
  };

  const handleSearch = async (formik: any): Promise<void> => {
    const { fromDate, toDate } = formik.values;
    if (fromDate && toDate) {
      try {
        const unavailableVenueList = await SharePointService.checkVenueAvailability(fromDate, toDate);
        setUnavailableVenues(unavailableVenueList);
        setShowResults(true);
      } catch (error) {
        console.error('Error checking venue availability:', error);
      }
    }
  };

  const handleVenueClick = (venue: any, values: any): void => {
    onVenueSelect(
      venue,
      values.fromDate,
      values.toDate,
      values.department
    );
    onClose();
  };

  const handleDateChange = (date: Date | null, name: string, formik: any): void => {
    formik.setFieldValue(name, date);
    setShowResults(false);
  };

  const canSearch = (formik: any): boolean => {
    return formik.values.department && 
           formik.values.fromDate && 
           formik.values.toDate;
  };

  const filteredVenues = React.useMemo(() => {
    return filteredVenueList.filter((venue) => {
      const matchesBuilding = !selectedBuilding || venue.building === selectedBuilding;
      const isAvailable = !unavailableVenues.includes(venue.value);
      return matchesBuilding && isAvailable;
    });
  }, [filteredVenueList, selectedBuilding, unavailableVenues]);

  return (
    <Dialog
      open={open}
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
                          handleChange={(date, name) => handleDateChange(date, name, formik)}
                        />
                      </div>
                    </Grid>

                    <Grid item xs={6}>
                      <div className={styles.width}>
                        <div className={styles.label}>Date and Time of use - To</div>
                        <CustomDateTimePicker 
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
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

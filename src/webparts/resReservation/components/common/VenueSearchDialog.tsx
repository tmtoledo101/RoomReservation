import * as React from "react";
import {
  TextField,
  List,
  ListItem,
  ListItemText,
  Grid,
  Typography,
  Paper,
} from "@material-ui/core";
import { Formik } from "formik";
import { ModalPopup } from "./ModalPopup";
import { CustomDateTimePicker, Dropdown } from "./FormComponents";
import { validationSchema } from "../utils/validation";
import { SharePointService } from "../services/SharePointService";
import styles from "../ResReservation.module.scss";

interface IVenueSearchDialogProps {
  open: boolean;
  onClose: () => void;
  buildingList: any[];
  venueList: any[];
  departmentList: any[];
  departmentSectorMap: { [key: string]: string };
  onVenueSelect: (venue: any, fromDate: Date | null, toDate: Date | null) => void;
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
  const spService = new SharePointService();

  const handleDepartmentChange = (e: any, formik: any) => {
    const { value } = e.target;
    let newVenue = venueList;
    
    if (value && departmentSectorMap[value] !== "FSS") {
      newVenue = venueList.filter((item) => item.exclusiveTo !== "FSS");
    }

    setFilteredVenueList(newVenue);
    formik.setFieldValue("department", value);
    setSelectedBuilding("");
  };

  const handleDateChange = async (formik: any) => {
    const { fromDate, toDate } = formik.values;
    if (fromDate && toDate && !formik.errors.fromDate && !formik.errors.toDate) {
      try {
        const unavailableVenueList = await spService.checkVenueAvailability(fromDate, toDate);
        setUnavailableVenues(unavailableVenueList);
      } catch (error) {
        console.error('Error checking venue availability:', error);
      }
    }
  };

  const filteredVenues = React.useMemo(() => {
    return filteredVenueList.filter((venue) => {
      const matchesBuilding = !selectedBuilding || venue.building === selectedBuilding;
      const isAvailable = !unavailableVenues.includes(venue.value);
      return matchesBuilding && isAvailable;
    });
  }, [filteredVenueList, selectedBuilding, unavailableVenues]);

  const handleVenueSelect = (venue: any, formikValues: any) => {
    onVenueSelect(venue, formikValues.fromDate, formikValues.toDate);
    onClose();
    // Reset state
    setSelectedBuilding("");
    setUnavailableVenues([]);
  };

  const handleClose = () => {
    setSelectedBuilding("");
    setUnavailableVenues([]);
    onClose();
  };

  return (
    <ModalPopup
      open={open}
      onClose={handleClose}
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
                  onChange={(e) => setSelectedBuilding(e.target.value)}
                  SelectProps={{
                    native: true,
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
                        handleChange={() => handleDateChange(formik)}
                      />
                    </div>
                  </Grid>

                  <Grid item xs={6}>
                    <div className={styles.width}>
                      <div className={styles.label}>Date and Time of use - To</div>
                      <CustomDateTimePicker 
                        name="toDate"
                        handleChange={() => handleDateChange(formik)}
                      />
                    </div>
                  </Grid>
                </Grid>
              </Grid>

              {/* Venues List Section */}
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
                        onClick={() => {
                          if (!formik.errors.fromDate && !formik.errors.toDate) {
                            handleVenueSelect(venue, formik.values);
                          }
                        }}
                        divider
                        style={{ padding: "16px" }}
                        disabled={!!(formik.errors.fromDate || formik.errors.toDate)}
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
            </Grid>
          </div>
        )}
      </Formik>
    </ModalPopup>
  );
};

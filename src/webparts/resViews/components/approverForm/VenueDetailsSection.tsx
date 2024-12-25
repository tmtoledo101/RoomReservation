import * as React from "react";
import { Grid, Paper, TextField, Button, CircularProgress } from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import { VenueSearchDialog } from "../common/VenueSearchDialog";
import { SharePointService } from "../services/SharePointService";
import { IDropdownItem } from "../interfaces/IFacility";
import { ConfirmationDialog } from "../common/ConfirmationDialog";

interface IVenueDetailsSectionProps {
  formik: any;
}

export const VenueDetailsSection: React.FC<IVenueDetailsSectionProps> = ({ formik }) => {
  const [showVenueSearch, setShowVenueSearch] = React.useState(false);
  const [buildingList, setBuildingList] = React.useState<IDropdownItem[]>([]);
  const [venueList, setVenueList] = React.useState<any[]>([]);
  const [departmentList, setDepartmentList] = React.useState<IDropdownItem[]>([]);
  const [departmentSectorMap, setDepartmentSectorMap] = React.useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [selectedVenue, setSelectedVenue] = React.useState<any>(null);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load buildings and venues using the updated SharePointService
        const { buildings, venues } = await SharePointService.getBuildings();
        setBuildingList(buildings);
        setVenueList(venues);

        // Load departments and sector map with requestedBy value
        const { departmentList: departments, departmentSectorMap: sectorMap } = 
          await SharePointService.getDepartments(formik.values.requestedBy);
        setDepartmentList(departments);
        setDepartmentSectorMap(sectorMap);

      } catch (error) {
        console.error('Error loading venue search data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [formik.values.requestedBy]); // Add dependency on requestedBy

  const handleVenueSelect = (venue: any, fromDate: Date | null, toDate: Date | null, department: string) => {
    formik.setFieldValue('building', venue.building);
    formik.setFieldValue('venue', venue.value);
    
    // If we want to update the dates and department as well
    if (fromDate) formik.setFieldValue('fromDate', fromDate);
    if (toDate) formik.setFieldValue('toDate', toDate);
    if (department) formik.setFieldValue('department', department);
  };

  const handleVenueClick = (venue: any, fromDate: Date | null, toDate: Date | null, department: string): void => {
    setSelectedVenue(venue);
    setConfirmationOpen(true);
  };

  const handleCloseConfirmation = (): void => {
    setConfirmationOpen(false);
    setSelectedVenue(null);
  };

  const handleConfirmVenue = (): void => {
    if (selectedVenue) {
      handleVenueSelect(
        selectedVenue,
        formik.values.fromDate,
        formik.values.toDate,
        formik.values.department
      );
      handleCloseConfirmation();
    }
  };

  return (
    <>
      <Grid item xs={12}>
        <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Venue Details</h3>
              <Button
                variant="contained"
                color="primary"
                startIcon={isLoading ? <CircularProgress size={20} /> : <SearchIcon />}
                onClick={() => setShowVenueSearch(true)}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Search Venue'}
              </Button>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Building"
                {...formik.getFieldProps('building')}
                error={formik.touched.building && Boolean(formik.errors.building)}
                helperText={formik.touched.building && formik.errors.building}
                InputProps={{
                  readOnly: true,
                }}
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Venue"
                {...formik.getFieldProps('venue')}
                error={formik.touched.venue && Boolean(formik.errors.venue)}
                helperText={formik.touched.venue && formik.errors.venue}
                InputProps={{
                  readOnly: true,
                }}
                disabled
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {!isLoading && (
        <VenueSearchDialog
          open={showVenueSearch}
          onClose={() => setShowVenueSearch(false)}
          buildingList={buildingList}
          venueList={venueList}
          departmentList={departmentList}
          departmentSectorMap={departmentSectorMap}
          onVenueSelect={(venue, fromDate, toDate, department) => handleVenueClick(venue, fromDate, toDate, department)}
          initialDepartment={formik.values.department}
          initialBuilding={formik.values.building}
          initialFromDate={formik.values.fromDate}
          initialToDate={formik.values.toDate}
        />
      )}
      
      <ConfirmationDialog
        open={confirmationOpen}
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirmVenue}
        title="Confirm Venue Selection"
        message={`Do you want to select this venue: ${selectedVenue ? selectedVenue.value : ''}`}
        confirmLabel="Select Venue"
        cancelLabel="Cancel"
      />
    </>
  );
};

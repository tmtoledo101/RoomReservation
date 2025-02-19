
{/*The VenueDetailsSection component manages venue selection and display in the Resource Reservation System's approval form. 
  It provides a search interface and displays selected venue details.*/}
  
import * as React from "react";
import { Grid, Paper, TextField, Button, CircularProgress } from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import { VenueSearchDialog } from "../common/VenueSearchDialog";
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { SharePointService } from "../services/SharePointService";
import { IDropdownItem } from "../interfaces/IFacility";

interface IVenueDetailsSectionProps {
  formik: any;
  onVenueSelect?: (venue: any) => void;
}

export const VenueDetailsSection: React.FC<IVenueDetailsSectionProps> = ({
  formik,
  onVenueSelect
}) => {
  const [showVenueSearch, setShowVenueSearch] = React.useState(false);
  const [buildingList, setBuildingList] = React.useState<IDropdownItem[]>([]);
  const [venueList, setVenueList] = React.useState<any[]>([]);
  const [departmentList, setDepartmentList] = React.useState<IDropdownItem[]>([]);
  const [departmentSectorMap, setDepartmentSectorMap] = React.useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [selectedVenue, setSelectedVenue] = React.useState<any | null>(null);

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

  const formatDateTime12Hour = (dateInput: Date | null): string => {
    if (!dateInput) return "";
    
    try {
      // Ensure we have a valid Date object
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        console.error('Invalid date provided to formatDateTime12Hour');
        return "";
      }

      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
      return `${date.toLocaleDateString()} ${hours}:${formattedMinutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return "";
    }
  };

  const handleVenueSelect = async (venue: any, fromDate: Date | null, toDate: Date | null, department: string) => {
    try {
      console.log('Department in handleVenueSelect:', department); // Add logging
      console.log('Current formik values:', formik.values); // Log current formik values
      
      // First check if venue is CRSD
      const isCRSD = await SharePointService.isVenueCRSD(venue.value);
      
      // Update form values
      formik.setFieldValue('building', venue.building);
      formik.setFieldValue('venue', venue.value);
      formik.setFieldValue('isVenueCRSD', isCRSD);
      
      // Ensure dates are valid before formatting and setting
      if (fromDate instanceof Date && !isNaN(fromDate.getTime())) {
        formik.setFieldValue('fromDate', formatDateTime12Hour(fromDate));
      }
      
      if (toDate instanceof Date && !isNaN(toDate.getTime())) {
        formik.setFieldValue('toDate', formatDateTime12Hour(toDate));
      }
      
      // Set department value and ensure it's set
      if (department) {
        console.log('Setting department value:', department); // Log before setting
        await formik.setFieldValue('department', department);
        console.log('Department after setting:', formik.values.department); // Log after setting
        console.log('Updated formik values:', formik.values); // Log all updated values
      }

      // Notify parent component about venue selection
      if (onVenueSelect) {
        onVenueSelect(venue);
      }

      // Close venue search dialog
      setShowVenueSearch(false);
    } catch (error) {
      console.error('Error in handleVenueSelect:', error);
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
          onVenueSelect={handleVenueSelect}
          initialDepartment={formik.values.department}
          initialBuilding={formik.values.building}
          initialFromDate={formik.values.fromDate}
          initialToDate={formik.values.toDate}
        />
      )}
    </>
  );
};

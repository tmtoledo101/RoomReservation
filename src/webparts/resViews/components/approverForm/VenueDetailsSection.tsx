import * as React from "react";
import { Grid, Paper, TextField, Button, CircularProgress } from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import { VenueSearchDialog } from "../common/VenueSearchDialog";
import { SharePointService } from "../services/SharePointService";
import { IDropdownItem } from "../interfaces/IFacility";

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

  const formatDateTime12Hour = (date: Date | null): string => {
    if (!date) return "";
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${date.toLocaleDateString()} ${hours}:${formattedMinutes} ${ampm}`;
  };

  const handleVenueSelect = (venue: any, fromDate: Date | null, toDate: Date | null, department: string) => {
    formik.setFieldValue('building', venue.building);
    formik.setFieldValue('venue', venue.value);
    
    // Format dates consistently with the 12-hour format
    if (fromDate) formik.setFieldValue('fromDate', formatDateTime12Hour(fromDate));
    if (toDate) formik.setFieldValue('toDate', formatDateTime12Hour(toDate));
    if (department) formik.setFieldValue('department', department);
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


{/*The VenueSelection component manages the venue selection process in the Resource Reservation System, 
  including search functionality, venue details display, and form state management.This component is used in:
ReservationForm (main booking form)
VenueBookingWizard
EventPlanningForm
*/}
import * as React from "react";
import { Grid, Button, CircularProgress } from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import { useFormikContext } from "formik";
import * as moment from "moment";
import { CustomInput } from "./FormComponents";
import { VenueDetails } from "./VenueDetails";
import { VenueSearchDialog } from "./VenueSearchDialog";
import styles from "../ResReservation.module.scss";
// Props interface defining required data and handlers
interface IVenueSelectionProps {
  buildingList: any[];
  venueList: any[];
  departmentList: any[];
  departmentSectorMap: { [key: string]: string };
  onVenueChange: (e: any) => void;
  onDepartmentChange: (e: any, preserveBuilding?: boolean) => void;
  venueImage: string;
  capacityperLayout: string;
  facilitiesAvailable: any;
}

export const VenueSelection: React.FC<IVenueSelectionProps> = ({
  buildingList,
  venueList,
  departmentList,
  departmentSectorMap,
  onVenueChange,
  onDepartmentChange,
  venueImage,
  capacityperLayout,
  facilitiesAvailable,
}) => {
  // Local state for managing search dialog and loading states
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const formik = useFormikContext<any>();
// Set loading state based on requester information
  React.useEffect(() => {
    setIsLoading(!formik.values.requestedBy);
  }, [formik.values.requestedBy]);

  const handleVenueSelect = async (venue: any, fromDate: Date | null, toDate: Date | null, department: string) => {
    console.log("VenueSelection - Starting venue selection with:", {
      venue,
      fromDate,
      toDate,
      department
    });
    
    try {
      // First call department change handler and wait for it to complete
      await new Promise<void>((resolve) => {
        onDepartmentChange({
          target: {
            value: department,
            name: "department"
          }
        }, true); // Pass preserveBuilding=true to keep building value
        setTimeout(resolve, 100);
      });

      // Set form values and wait for each update
      await formik.setFieldValue("department", department);
      await formik.setFieldTouched("department", true);

      await formik.setFieldValue("building", venue.building || "");
      await formik.setFieldTouched("building", true);

      await formik.setFieldValue("venue", venue.value);
      await formik.setFieldTouched("venue", true);

      await formik.setFieldValue("IsCSDR", venue.group === 'CRSD');
      await formik.setFieldTouched("IsCSDR", true);
      
      if (fromDate) {
        await formik.setFieldValue("fromDate", moment(fromDate).format("MM/DD/YYYY hh:mm A"));
        await formik.setFieldTouched("fromDate", true);
      }
      if (toDate) {
        await formik.setFieldValue("toDate", moment(toDate).format("MM/DD/YYYY hh:mm A"));
        await formik.setFieldTouched("toDate", true);
      }

      // Wait for form updates to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Call venue change handler last
      await new Promise<void>((resolve) => {
        onVenueChange({
          target: {
            value: venue.value,
            name: "venue"
          }
        });
        setTimeout(resolve, 100);
      });

      // Validate form
      const errors = await formik.validateForm();
      console.log("VenueSelection - Form validation result:", errors);

      console.log("VenueSelection - Selection complete:", {
        formikValues: formik.values,
        venue,
        department,
        touched: formik.touched,
        errors: formik.errors
      });
    } catch (error) {
      console.error("VenueSelection - Error in handleVenueSelect:", error);
      // Reset form values on error
      await formik.setFieldValue("venue", "");
      await formik.setFieldValue("building", "");
      await formik.setFieldValue("IsCSDR", false);
    }
  };

  return (
    <>
      <Grid container spacing={2} alignItems="flex-end">
        <Grid item xs={2}>
          <Button
            variant="contained"
            color="primary"
            startIcon={isLoading ? <CircularProgress size={20} /> : <SearchIcon />}
            onClick={() => setIsSearchOpen(true)}
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Search'}
          </Button>
        </Grid>
      </Grid>
      <Grid container spacing={1} alignItems="flex-end">
        <Grid item xs={5}>
          <div className={styles.label}>Building</div>
          <CustomInput
            name="building"
            disabled
          />
        </Grid>
        <Grid item xs={5} style={{ marginLeft: '75px' }}>
          <div className={styles.label}>Venue</div>
          <CustomInput
            name="venue"
            disabled
          />
        </Grid>
      </Grid>

      {/* Venue Details */}
      <VenueDetails
        venueImage={venueImage}
        capacityperLayout={capacityperLayout}
        facilitiesAvailable={facilitiesAvailable}
      />

      {/* Search Dialog */}
      <VenueSearchDialog
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        buildingList={buildingList}
        venueList={venueList}
        departmentList={departmentList}
        departmentSectorMap={departmentSectorMap}
        onVenueSelect={handleVenueSelect}
      />
    </>
  );
};

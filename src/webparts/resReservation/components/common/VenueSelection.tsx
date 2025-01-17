import * as React from "react";
import { Grid, Button, CircularProgress } from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import { useFormikContext } from "formik";
import * as moment from "moment";
import { CustomInput } from "./FormComponents";
import { VenueDetails } from "./VenueDetails";
import { VenueSearchDialog } from "./VenueSearchDialog";
import styles from "../ResReservation.module.scss";

interface IVenueSelectionProps {
  buildingList: any[];
  venueList: any[];
  departmentList: any[];
  departmentSectorMap: { [key: string]: string };
  onVenueChange: (e: any) => void;
  onDepartmentChange: (e: any) => void;
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
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const formik = useFormikContext<any>();

  React.useEffect(() => {
    setIsLoading(!formik.values.requestedBy);
  }, [formik.values.requestedBy]);

  const handleVenueSelect = (venue: any, fromDate: Date | null, toDate: Date | null, department: string) => {
    // Set department value
    formik.setFieldValue("department", department);
    onDepartmentChange({
      target: {
        value: department,
        name: "department"
      }
    });

    // Update venue selection
    onVenueChange({
      target: {
        value: venue.value,
        name: "venue"
      }
    });

    // Set building value
    formik.setFieldValue("building", venue.building || "");

    // Set date values in the required format
    if (fromDate) {
      formik.setFieldValue("fromDate", moment(fromDate).format("MM/DD/YYYY hh:mm A"));
    }
    if (toDate) {
      formik.setFieldValue("toDate", moment(toDate).format("MM/DD/YYYY hh:mm A"));
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

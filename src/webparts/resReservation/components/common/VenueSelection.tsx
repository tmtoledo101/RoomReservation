import * as React from "react";
import { Grid, Button } from "@material-ui/core";
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
  const formik = useFormikContext<any>();

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
      <Grid container spacing={2}>
        <Grid item xs={5}>
          <div className={styles.width}>
            <div className={styles.label}>Building</div>
            <CustomInput
              name="building"
              disabled
            />
          </div>
        </Grid>

        <Grid item xs={5}>
          <div className={styles.width}>
            <div className={styles.label}>Venue</div>
            <CustomInput
              name="venue"
              disabled
            />
          </div>
        </Grid>

        <Grid item xs={2}>
          <div style={{ marginTop: "32px" }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              onClick={() => setIsSearchOpen(true)}
              fullWidth
            >
              Search
            </Button>
          </div>
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

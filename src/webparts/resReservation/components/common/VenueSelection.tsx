import * as React from "react";
import { Grid, Button } from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import { Dropdown } from "./FormComponents";
import { VenueDetails } from "./VenueDetails";
import { VenueSearchDialog } from "./VenueSearchDialog";
import styles from "../ResReservation.module.scss";

interface IVenueSelectionProps {
  buildingList: any[];
  venueList: any[];
  departmentList: any[];
  departmentSectorMap: { [key: string]: string };
  onVenueChange: (e: any) => void;
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
  venueImage,
  capacityperLayout,
  facilitiesAvailable,
}) => {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  const handleVenueSelect = (venue: any, fromDate: Date | null, toDate: Date | null) => {
    // Update venue selection
    onVenueChange({
      target: {
        value: venue.value,
        name: "venue"
      }
    });
  };

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={5}>
          <div className={styles.width}>
            <div className={styles.label}>Building</div>
            <Dropdown
              items={buildingList}
              name="building"
            />
          </div>
        </Grid>

        <Grid item xs={5}>
          <div className={styles.width}>
            <div className={styles.label}>Venue</div>
            <Dropdown
              items={venueList}
              name="venue"
              handleChange={onVenueChange}
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

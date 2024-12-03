import * as React from "react";
import { Grid } from "@material-ui/core";
import { Dropdown } from "./FormComponents";
import { VenueDetails } from "./VenueDetails";
import styles from "../ResReservation.module.scss";

interface IVenueSelectionProps {
  buildingList: any[];
  venueList: any[];
  onVenueChange: (e: any) => void;
  venueImage: string;
  capacityperLayout: string;
  facilitiesAvailable: any;
}

export const VenueSelection: React.FC<IVenueSelectionProps> = ({
  buildingList,
  venueList,
  onVenueChange,
  venueImage,
  capacityperLayout,
  facilitiesAvailable,
}) => {
  return (
    <>
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Building</div>
          <Dropdown
            items={buildingList}
            name="building"
          />
        </div>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Venue</div>
          <Dropdown
            items={venueList}
            name="venue"
            handleChange={onVenueChange}
          />
        </div>
      </Grid>

      {/* Venue Details */}
      <VenueDetails
        venueImage={venueImage}
        capacityperLayout={capacityperLayout}
        facilitiesAvailable={facilitiesAvailable}
      />
    </>
  );
};


{/**The VenueDetails component displays detailed information about a venue, including its image, capacity layouts, 
  and available facilities in a structured table format. The component is typically used within:
ReservationForm
EventBookingForm
VenueRequestForm*/}
import * as React from "react";
import { Grid } from "@material-ui/core";
import styles from "../ResReservation.module.scss";
// Interface defining required props for venue information display
interface IVenueDetailsProps {
  venueImage: string;
  capacityperLayout: string;
  facilitiesAvailable: string;
}

export const VenueDetails: React.FC<IVenueDetailsProps> = ({
  venueImage,
  capacityperLayout,
  facilitiesAvailable,
}) => {
  return (
    <>
      <Grid item xs={12}>
        <div className={styles.image}>
          <img src={venueImage} alt="Venue" />
        </div>
      </Grid>
      <Grid item xs={12}>
        <div className={styles.facilityDetails}>
          <table>
            <thead>
              <tr>
                <th>
                  <div>CAPACITY PER LAY-OUT </div>
                  <div>(NO. OF PAX)</div>
                </th>
                <th>
                  <div>FACLITIES AVAILABLE </div>
                  <div>IN THE VENUE </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><pre>{capacityperLayout}</pre></td>
                <td><pre>{facilitiesAvailable}</pre></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Grid>
    </>
  );
};

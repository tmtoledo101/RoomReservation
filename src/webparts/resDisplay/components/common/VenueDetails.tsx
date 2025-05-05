/**
 * VenueDetails Component:
 *
 * This component displays details about a venue, including its image, capacity per layout, and facilities available.
 */

import * as React from "react";
import { Grid } from "@material-ui/core";
import styles from "../ResDisplay.module.scss";

interface IVenueDetailsProps {
  venueImage: string;
  capacityperLayout: string;
  facilitiesAvailable: string;
}

export const VenueDetails: React.FC<IVenueDetailsProps> = ({
  venueImage,
  capacityperLayout,
  facilitiesAvailable
}) => {
  return (
    <>
      <Grid item xs={12}>
        <div className={styles.imageData}>
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
                <td>
                  <pre>{facilitiesAvailable}</pre>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Grid>
    </>
  );
};

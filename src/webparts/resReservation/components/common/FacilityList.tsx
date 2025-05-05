import * as React from "react";
import { Fab } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import VisibilityIcon from "@material-ui/icons/Visibility";
import { IFacilityData } from "../interfaces/IResReservation";
import styles from "../ResReservation.module.scss";
// Interface defining props for the FacilityList component
interface IFacilityListProps {
  facilityData: IFacilityData[]; //Array of facility items to display
  onAddClick: () => void; // Handler for adding new facilities
  onEditClick: (index: number) => void; // Handler for editing existing facilities
} 
// FacilityList Component: Displays a list of facilities with add/edit capabilities
export const FacilityList: React.FC<IFacilityListProps> = ({
  facilityData,
  onAddClick,
  onEditClick,
}) => {
  return (
    <>
      {/* Section Header */}
      <div className={styles.label}>Facilities</div>
      <div className={styles.data}>
         {/* Add Facility Button */}
        <Fab
          color="primary"
          aria-label="add"
          size="small"
          onClick={onAddClick}
        >
          <AddIcon />
        </Fab>
      </div>
      {/* Facility Table - Only shown when there are facilities */}
      {facilityData.length > 0 && (
        <div className={styles.facilityDetails}>
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Facility</th>
                <th>Quantity</th>
                <th>Asset Number</th>
              </tr>
            </thead>
             {/* Table Body - Maps through facility data */}
            <tbody>
              {facilityData.map((item, index) => (
                <tr key={`${item.assetNumber}-${index}`}>
                    {/* Edit Action Button */}
                  <td>
                    <div onClick={() => onEditClick(index)}>
                      <VisibilityIcon />
                    </div>
                  </td>
                    {/* Facility Details */}
                  <td>{item.facility}</td>
                  <td>{item.quantity}</td>
                  <td>{item.assetNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

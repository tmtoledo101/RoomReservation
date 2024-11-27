import * as React from "react";
import { Fab } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import VisibilityIcon from "@material-ui/icons/Visibility";
import { IFacilityData } from "../interfaces/IResReservation";
import styles from "../ResReservation.module.scss";

interface IFacilityListProps {
  facilityData: IFacilityData[];
  onAddClick: () => void;
  onEditClick: (index: number) => void;
}

export const FacilityList: React.FC<IFacilityListProps> = ({
  facilityData,
  onAddClick,
  onEditClick,
}) => {
  return (
    <>
      <div className={styles.label}>Facilities</div>
      <div className={styles.data}>
        <Fab
          color="primary"
          aria-label="add"
          size="small"
          onClick={onAddClick}
        >
          <AddIcon />
        </Fab>
      </div>
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
            <tbody>
              {facilityData.map((item, index) => (
                <tr key={`${item.assetNumber}-${index}`}>
                  <td>
                    <div onClick={() => onEditClick(index)}>
                      <VisibilityIcon />
                    </div>
                  </td>
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

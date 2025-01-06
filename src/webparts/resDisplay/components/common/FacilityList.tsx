import * as React from "react";
import { IFacilityData } from "../interfaces/IResDisplay";
import styles from "../ResDisplay.module.scss";
import VisibilityIcon from "@material-ui/icons/Visibility";

interface IFacilityListProps {
  facilityData: IFacilityData[];
  onView?: (index: number) => void;
  showActions?: boolean;
}

export const FacilityList: React.FC<IFacilityListProps> = ({ 
  facilityData, 
  onView,
  showActions = true 
}) => {
  if (!facilityData || facilityData.length === 0) {
    return null;
  }

  return (
    <div className={styles.facilityDetails}>
      <table>
        <thead>
          <tr>
            {showActions && <th>Action</th>}
            <th>Facility</th>
            <th>Quantity</th>
            <th>Asset Number</th>
          </tr>
        </thead>
        <tbody>
          {facilityData.map((item, index) => (
            <tr key={`${item.assetNumber}-${index}`}>
              {showActions && (
                <td>
                  {onView && (
                    <div onClick={() => onView(index)}>
                      <VisibilityIcon />
                    </div>
                  )}
                </td>
              )}
              <td>{item.facility}</td>
              <td>{item.quantity}</td>
              <td>{item.assetNumber}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

import * as React from "react";
import { Fab, Paper } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import VisibilityIcon from "@material-ui/icons/Visibility";
import { IFacilityData } from "../interfaces/IFacility";
import styles from "../ResViews.module.scss";

interface IFacilityListProps {
  facilityData: IFacilityData[];
  onAddClick: () => void;
  onEditClick: (index: number) => void;
}

const tableHeaderStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'left',
  backgroundColor: '#f5f5f5',
  borderBottom: '2px solid #ddd'
};

const tableCellStyle: React.CSSProperties = {
  padding: '12px',
  borderBottom: '1px solid #ddd'
};

export const FacilityList: React.FC<IFacilityListProps> = ({
  facilityData,
  onAddClick,
  onEditClick,
}) => {
  return (
    <Paper variant="outlined" style={{ padding: 16, marginBottom: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0, display: 'inline-block', marginRight: 16 }}>Facilities</h3>
        <Fab
          color="primary"
          aria-label="add"
          size="small"
          onClick={onAddClick}
          style={{ marginLeft: 8 }}
        >
          <AddIcon />
        </Fab>
      </div>
      {facilityData.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Action</th>
                <th style={tableHeaderStyle}>Facility</th>
                <th style={tableHeaderStyle}>Quantity</th>
                <th style={tableHeaderStyle}>Asset Number</th>
              </tr>
            </thead>
            <tbody>
              {facilityData.map((item, index) => (
                <tr key={`${item.assetNumber}-${index}`}>
                  <td style={tableCellStyle}>
                    <div 
                      onClick={() => onEditClick(index)}
                      style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                    >
                      <VisibilityIcon />
                    </div>
                  </td>
                  <td style={tableCellStyle}>{item.facility}</td>
                  <td style={tableCellStyle}>{item.quantity}</td>
                  <td style={tableCellStyle}>{item.assetNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Paper>
  );
};

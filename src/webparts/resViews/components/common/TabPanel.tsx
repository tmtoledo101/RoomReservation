import * as React from "react";
import { Paper, AppBar, Tabs, Tab } from "@material-ui/core";
import styles from "../ResViews.module.scss";

interface ITabPanelProps {
  tabs: string[];
  value: number;
  onChange: (_event: React.ChangeEvent<{}>, newValue: number) => void;
}

export const TabPanel: React.FC<ITabPanelProps> = ({
  tabs,
  value,
  onChange
}) => {
  return (
    <Paper square className={styles.paper}>
      <AppBar position="static" color="default">
        <Tabs
          value={value}
          indicatorColor="primary"
          textColor="primary"
          onChange={onChange}
          aria-label="reservation tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((label, index) => (
            <Tab 
              key={index}
              label={label} 
              className={styles.tabbar}
              id={`reservation-tab-${index}`}
              aria-controls={`reservation-tabpanel-${index}`}
            />
          ))}
        </Tabs>
      </AppBar>
    </Paper>
  );
};

interface ITabContentProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export const TabContent: React.FC<ITabContentProps> = ({
  children,
  value,
  index
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reservation-tabpanel-${index}`}
      aria-labelledby={`reservation-tab-${index}`}
    >
      {value === index && children}
    </div>
  );
};

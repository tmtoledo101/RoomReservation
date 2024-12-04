import * as React from "react";
import { Paper, AppBar, Tabs, Tab } from "@material-ui/core";
import styles from "../styles/ResViews.module.scss";

interface ICustomTabsProps {
  value: number;
  menuTabs: string[];
  onChange: (event: React.ChangeEvent<{}>, value: number) => void;
}

export const CustomTabs: React.FC<ICustomTabsProps> = ({ value, menuTabs, onChange }) => {
  return (
    <Paper square className={styles.paper}>
      <AppBar position="static" color="default">
        <Tabs
          value={value}
          indicatorColor="primary"
          textColor="primary"
          onChange={onChange}
          aria-label="tabs example"
          variant="scrollable"
          scrollButtons="auto"
        >
          {menuTabs.map((item: string, index: number) => (
            <Tab key={index} label={item} className={styles.tabbar} />
          ))}
        </Tabs>
      </AppBar>
    </Paper>
  );
};

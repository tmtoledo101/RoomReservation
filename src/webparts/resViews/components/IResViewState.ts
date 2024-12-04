import { ITableItem } from "./interfaces/IResViews";

export interface IResViewState {
  items: any[];
  menuTabs: string[];
  tabValue: number;
  referenceNumberList: ITableItem[];
  pastRequestList: ITableItem[];
  approvalRequest: ITableItem[];
  department: string[];
  isPanelOpen: boolean;
  selectedItem: ITableItem | null;
}

import { IRequestItem } from "./services/SharePointService";

export interface IResViewState {
  items: any[];
  menuTabs: string[];
  tabValue: number;
  referenceNumberList: IRequestItem[];
  pastRequestList: IRequestItem[];
  approvalRequest: IRequestItem[];
  department: string[];
}

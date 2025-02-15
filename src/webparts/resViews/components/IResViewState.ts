import { ITableItem } from "./interfaces/IResViews";

export interface IResViewState {
  items: any[];
  menuTabs: string[];
  tabValue: number;
  referenceNumberList: ITableItem[];
  pastRequestList: ITableItem[];
  approvalRequest: ITableItem[];
  department: string[];
  isModalOpen: boolean;
  selectedReservation: ITableItem | null;
  fromDate: string | null;
  toDate: string | null;
  pageSize: number;
  currentPage: number;
  totalCount: number;
  isLoading: boolean;
}

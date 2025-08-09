
//IresView state
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
  fromDate: Date | null;
  toDate: Date | null;
  approverGroups: {
    isCRSD: boolean;
    isDD: boolean;
    isFSSApprover: boolean;
  };
  isApprover: boolean;
  notification: {
    show: boolean;
    message: string;
    severity: "success" | "error";
  };
}

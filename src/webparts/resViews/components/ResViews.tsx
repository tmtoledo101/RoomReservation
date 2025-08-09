/*
This component serves as the main view for displaying reservation requests. It manages the state for different views,
 * handles user interactions such as tab changes, search, and view actions, and renders the appropriate forms and data. 
*/
import * as React from "react";
import { Snackbar } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { IResViewsProps } from "./IResViewsProps";
import { IResViewState } from "./IResViewState";
import { SharePointService } from "./services/SharePointService";
import { ResViewForm } from "./ResViewForm";
import { ApproverReservationForm } from "./ApproverReservationForm";
import { ITableItem } from "./interfaces/IResViews";
export default class ResViews extends React.Component<IResViewsProps, IResViewState> {
  constructor(props: IResViewsProps) {
    super(props);

    this.state = {
      items: [],
      menuTabs: ["By Reference No", "Past Request"],
      tabValue: 0,
      referenceNumberList: [],
      pastRequestList: [],
      approvalRequest: [],
      department: [],
      isModalOpen: false,
      selectedReservation: null,
      fromDate: null,
      toDate: null,
      approverGroups: {
        isCRSD: false,
        isDD: false,
        isFSSApprover: false
      },
      isApprover: false,
      notification: {
        show: false,
        message: "",
        severity: "success"
      }
    };
  }

  protected handleTabChange = (event: React.ChangeEvent<{}>, tabValue: number): void => {
    this.setState({ tabValue });
  }

  protected getData = (): ITableItem[] => {
    const { referenceNumberList, pastRequestList, approvalRequest, tabValue } = this.state;
    
    switch(tabValue) {
      case 1:
        return pastRequestList;
      case 2:
        return approvalRequest;
      default:
        return referenceNumberList;
    }
  }

  protected handleView = (event: any, rowData: ITableItem | ITableItem[]): void => {
    if (!Array.isArray(rowData)) {
      console.log('View clicked for reservation:', rowData);
      console.log('Reservation GUID:', rowData.guid);
      
      if (this.state.isApprover) {
        // If user is an approver, show modal for all tabs
        this.setState({
          isModalOpen: true,
          selectedReservation: rowData
        });
      } else {
        // If not an approver, use original behavior
        if (this.state.tabValue === 2) {
          // For approval tab, show modal
          this.setState({
            isModalOpen: true,
            selectedReservation: rowData
          });
        } else {
          // Other tabs, redirect to display page
          window.open(
            this.props.siteUrl +
              "/SitePages/DisplayReservation_appge.aspx?pid=" +
              rowData.ID,
            "_blank"
          );
        }
      }
    }
  }

  protected handleModalClose = (): void => {
    this.setState({
      isModalOpen: false,
      selectedReservation: null
    });
  }

  protected handleUpdateSuccess = async (): Promise<void> => {
    // Refresh data after successful update
    const { fromDate, toDate } = this.state;
    if (fromDate && toDate) {
      await this.getItems(fromDate, toDate);
    }
  }

  protected handleSearch = async (fromDate: Date | null, toDate: Date | null): Promise<void> => {
    if (fromDate && toDate) {
      // Store dates in state for refresh after update
      //this.setState({ fromDate: fromDate.toISOString(), toDate: toDate.toISOString() });
      this.setState({ fromDate: fromDate, toDate: toDate});
      await this.getItems(fromDate, toDate);
    }
  }

  protected handleClose = (): void => {
    window.open(this.props.siteUrl + "/SitePages/Home.aspx", "_self");
  }

  protected handleNotificationClose = (): void => {
    this.setState({
      notification: {
        ...this.state.notification,
        show: false
      }
    });
  }

  public async componentDidMount(): Promise<void> {
    const { isApprover, departments, approverGroups } = await SharePointService.getCurrentUserGroups();
    //Terence commented out this
    if (isApprover) {
      console.log("Complete MenuTabs");
      this.setState({
        menuTabs: ["By Reference No", "Past Request", "For Approval"],
        approverGroups,
        isApprover
      });
    } else {
      this.setState({ isApprover: false });
    }
    this.setState({ department: departments });
  }

  private async getItems(from: Date, to: Date): Promise<void> {
    try {
      const { department, approverGroups } = this.state;
      
      const {
        referenceNumberList,
        pastRequestList,
        approvalRequest: allApprovalRequests,
      } = await SharePointService.getRequestItems(from, to, department);

      // Filter approval requests based on user's security group
      let filteredApprovalRequests = [...allApprovalRequests];
      console.log("All Approval Requests:", allApprovalRequests);
      console.log("Approver Groups:", approverGroups);
      console.log("appgroups.isFSSApprover:", approverGroups.isFSSApprover);
      console.log("appgroups.isCRSD:", approverGroups.isCRSD);
      // User can see both HO and SPC records if they're in both groups
      if (approverGroups.isFSSApprover && (approverGroups.isCRSD || approverGroups.isDD)) {
        filteredApprovalRequests = allApprovalRequests.filter(
          item => item.building === "HO Multi-Storey Bldg" || item.building === "SPC"
        );
        console.log("Filtered for FSS AND CRSD/DD:", filteredApprovalRequests);
      } else if (approverGroups.isFSSApprover) {
        // FSS Approvers only
        filteredApprovalRequests = allApprovalRequests.filter(
          item => item.building === "HO Multi-Storey Bldg"
        );
        console.log("Filtered for FSS Approvers only:", filteredApprovalRequests);
      } else if (approverGroups.isCRSD || approverGroups.isDD) {
        // CRSD or DD only
        filteredApprovalRequests = allApprovalRequests.filter(
          item => item.building === "SPC"
        );
        console.log("Filtered for CRSD/DD only:", filteredApprovalRequests);
      }

      this.setState({
        referenceNumberList,
        pastRequestList,
        approvalRequest: filteredApprovalRequests,
      });
      
    } catch (error) {
      console.error("Exception encountered in search query:", error);
      this.setState({
        notification: {
          show: true,
          message: "Exception encountered in search query. Please contact the admin",
          severity: "error"
        }
      });
    }
  }
  public render(): React.ReactElement<IResViewsProps> {
    const { menuTabs, tabValue, isModalOpen, selectedReservation, notification } = this.state;

    return (
      <>
        <ResViewForm
          tabValue={tabValue}
          menuTabs={menuTabs}
          data={this.getData()}
          onTabChange={this.handleTabChange}
          onSearch={this.handleSearch}
          onView={this.handleView}
          onClose={this.handleClose}
        />
        <ApproverReservationForm
          isOpen={isModalOpen}
          selectedReservation={selectedReservation}
          onClose={this.handleModalClose}
          onUpdateSuccess={this.handleUpdateSuccess}
          context={this.props.context}
          siteUrl={this.props.siteUrl}
        />
        <Snackbar
          open={notification.show}
          autoHideDuration={6000}
          onClose={this.handleNotificationClose}
        >
          <Alert onClose={this.handleNotificationClose} severity={notification.severity}>
            {notification.message}
          </Alert>
        </Snackbar>
      </>
    );
  }
}

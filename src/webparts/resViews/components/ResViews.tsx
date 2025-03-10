/*
This component serves as the main view for displaying reservation requests. It manages the state for different views,
 * handles user interactions such as tab changes, search, and view actions, and renders the appropriate forms and data. 
*/
import * as React from "react";
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
      toDate: null
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
      this.setState({ fromDate: fromDate.toISOString(), toDate: toDate.toISOString() });
      await this.getItems(fromDate.toISOString(), toDate.toISOString());
    }
  }

  protected handleClose = (): void => {
    window.open(this.props.siteUrl + "/SitePages/Home.aspx", "_self");
  }

  public async componentDidMount(): Promise<void> {
    const { isApprover, departments } = await SharePointService.getCurrentUserGroups();
    //Terence commented out this
    if (isApprover) {

      console.log("Complete MenuTabs");
      this.setState({
        menuTabs: ["By Reference No", "Past Request", "For Approval"],
      });
    }
    this.setState({ department: departments });
  }

  private async getItems(from: string, to: string): Promise<void> {
    const { department } = this.state;
    
    const {
      referenceNumberList,
      pastRequestList,
      approvalRequest,
    } = await SharePointService.getRequestItems(from, to, department);

    this.setState({
      referenceNumberList,
      pastRequestList,
      approvalRequest,
    });
  }

  public render(): React.ReactElement<IResViewsProps> {
    const { menuTabs, tabValue, isModalOpen, selectedReservation } = this.state;

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
        />
      </>
    );
  }
}

import * as React from "react";
import { IResViewsProps } from "./IResViewsProps";
import { IResViewState } from "./IResViewState";
import { SharePointService } from "./services/SharePointService";
import { ResViewForm } from "./ResViewForm";
import { ApproverReservationForm } from "./ApproverReservationForm";
import { ITableItem, STATUS } from "./interfaces/IResViews";

export interface IPaginationState {
  pageSize: number;
  currentPage: number;
}

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
      pageSize: 100,
      currentPage: 0,
      totalCount: 0,
      isLoading: false
    };
  }

  protected handleTabChange = (event: React.ChangeEvent<{}>, tabValue: number): void => {
    this.setState({ tabValue }, () => {
      if (this.state.fromDate && this.state.toDate) {
        this.getItems(this.state.fromDate, this.state.toDate);
      }
    });
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
      this.setState({ 
        fromDate: fromDate.toISOString(), 
        toDate: toDate.toISOString(),
        currentPage: 0 // Reset to first page on new search
      });
      await this.getItems(fromDate.toISOString(), toDate.toISOString());
    }
  }

  protected handleClose = (): void => {
    window.open(this.props.siteUrl + "/SitePages/Home.aspx", "_self");
  }

  protected handlePageChange = (page: number): void => {
    this.setState({ currentPage: page }, () => {
      if (this.state.fromDate && this.state.toDate) {
        this.getItems(this.state.fromDate, this.state.toDate);
      }
    });
  }

  protected handlePageSizeChange = (newPageSize: number): void => {
    this.setState({ 
      pageSize: newPageSize,
      currentPage: 0 // Reset to first page when changing page size
    }, () => {
      if (this.state.fromDate && this.state.toDate) {
        this.getItems(this.state.fromDate, this.state.toDate);
      }
    });
  }

  public async componentDidMount(): Promise<void> {
    const { isApprover, departments } = await SharePointService.getCurrentUserGroups();
    //Terence commented out this
    //if (isApprover) {
    if (1) {
      console.log("Complete MenuTabs");
      this.setState({
        menuTabs: ["By Reference No", "Past Request", "For Approval"],
      });
    }
    this.setState({ department: departments });
  }

  private async getItems(from: string, to: string): Promise<void> {
    const { department, pageSize, currentPage } = this.state;
    
    this.setState({ isLoading: true });
    try {
      const result = await SharePointService.getPaginatedRequestItems(
        from,
        to,
        department,
        pageSize,
        currentPage
      );

      // Filter items based on status
      const pastRequests = result.items.filter(item => 
        item.status === STATUS.APPROVED || 
        item.status === STATUS.DISAPPROVED || 
        item.status === STATUS.CANCELLED
      );
      const approvalRequests = result.items.filter(item => 
        item.status === STATUS.PENDING
      );

      this.setState({
        referenceNumberList: result.items,
        pastRequestList: pastRequests,
        approvalRequest: approvalRequests,
        totalCount: result.totalCount,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching items:', error);
      this.setState({ isLoading: false });
    }
  }

  public render(): React.ReactElement<IResViewsProps> {
    const { 
      menuTabs, 
      tabValue, 
      isModalOpen, 
      selectedReservation, 
      department,
      pageSize,
      currentPage,
      totalCount,
      isLoading,
      fromDate,
      toDate
    } = this.state;

    return (
      <>
        <ResViewForm
          tabValue={tabValue}
          menuTabs={menuTabs}
          onTabChange={this.handleTabChange}
          onSearch={this.handleSearch}
          onView={this.handleView}
          onClose={this.handleClose}
          departments={department}
          pageSize={pageSize}
          currentPage={currentPage}
          totalCount={totalCount}
          isLoading={isLoading}
          onPageChange={this.handlePageChange}
          onPageSizeChange={this.handlePageSizeChange}
          fromDate={fromDate}
          toDate={toDate}
          items={tabValue === 0 ? this.state.referenceNumberList : 
                 tabValue === 1 ? this.state.pastRequestList :
                 this.state.approvalRequest}
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

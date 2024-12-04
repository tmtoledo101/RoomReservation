import * as React from "react";
import { IResViewsProps } from "./IResViewsProps";
import { IResViewState } from "./IResViewState";
import { SharePointService } from "./services/SharePointService";
import { ResViewForm } from "./ResViewForm";
import { ITableItem } from "./interfaces/IResViews";
import { 
  getDataByTabValue, 
  getMenuTabs, 
  isValidDateRange,
  getHomePageUrl
} from "./utils/businessLogic";

export default class ResViews extends React.Component<IResViewsProps, IResViewState> {
  constructor(props: IResViewsProps) {
    super(props);

    this.state = {
      items: [],
      menuTabs: getMenuTabs(false), // Initialize with non-approver tabs
      tabValue: 0,
      referenceNumberList: [],
      pastRequestList: [],
      approvalRequest: [],
      department: [],
      isPanelOpen: false,
      selectedItem: null,
    };
  }

  protected handleTabChange = (event: React.ChangeEvent<{}>, tabValue: number): void => {
    this.setState({ tabValue });
  }

  protected getData = (): ITableItem[] => {
    const { referenceNumberList, pastRequestList, approvalRequest, tabValue } = this.state;
    return getDataByTabValue(tabValue, referenceNumberList, pastRequestList, approvalRequest);
  }

  protected handleView = (event: any, rowData: ITableItem | ITableItem[]): void => {
    if (!Array.isArray(rowData)) {
      this.setState({
        selectedItem: rowData,
        isPanelOpen: true
      });
    }
  }

  protected handlePanelDismiss = (): void => {
    this.setState({
      isPanelOpen: false,
      selectedItem: null
    });
  }

  protected handleSearch = async (fromDate: Date | null, toDate: Date | null): Promise<void> => {
    if (fromDate && toDate && isValidDateRange(fromDate, toDate)) {
      await this.getItems(fromDate.toISOString(), toDate.toISOString());
    }
  }

  protected handleClose = (): void => {
    window.open(getHomePageUrl(this.props.siteUrl), "_self");
  }

  public async componentDidMount(): Promise<void> {
    try {
      const { isApprover, departments } = await SharePointService.getCurrentUserGroups();
      
      this.setState({
        menuTabs: getMenuTabs(isApprover),
        department: departments
      });
    } catch (error) {
      console.error('Error in componentDidMount:', error);
      // Here you could set an error state if needed
    }
  }

  private async getItems(from: string, to: string): Promise<void> {
    try {
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
    } catch (error) {
      console.error('Error fetching items:', error);
      // Here you could set an error state if needed
    }
  }

  public render(): React.ReactElement<IResViewsProps> {
    const { menuTabs, tabValue, isPanelOpen, selectedItem } = this.state;

    return (
      <ResViewForm
        tabValue={tabValue}
        menuTabs={menuTabs}
        data={this.getData()}
        onTabChange={this.handleTabChange}
        onSearch={this.handleSearch}
        onView={this.handleView}
        onClose={this.handleClose}
        isPanelOpen={isPanelOpen}
        selectedItem={selectedItem}
        onPanelDismiss={this.handlePanelDismiss}
      />
    );
  }
}

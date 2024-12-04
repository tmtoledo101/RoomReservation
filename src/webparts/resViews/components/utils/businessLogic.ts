import { ITableItem } from "../interfaces/IResViews";
import { parseSharePointDate } from "./helpers";

/**
 * Gets the appropriate data list based on the selected tab
 * @param tabValue Current selected tab index
 * @param referenceNumberList List of reference number items
 * @param pastRequestList List of past request items
 * @param approvalRequest List of approval request items
 * @returns The appropriate list of items based on tab selection
 */
export const getDataByTabValue = (
  tabValue: number,
  referenceNumberList: ITableItem[],
  pastRequestList: ITableItem[],
  approvalRequest: ITableItem[]
): ITableItem[] => {
  switch(tabValue) {
    case 1:
      return pastRequestList;
    case 2:
      return approvalRequest;
    default:
      return referenceNumberList;
  }
};

/**
 * Updates menu tabs based on user approval status
 * @param isApprover Whether the current user is an approver
 * @returns Updated menu tabs array
 */
export const getMenuTabs = (isApprover: boolean): string[] => {
  const baseTabs = ["By Reference No", "Past Request"];
  return isApprover ? [...baseTabs, "For Approval"] : baseTabs;
};

/**
 * Formats the SharePoint list data into the required format
 * @param data Raw data from SharePoint
 * @returns Formatted data
 */
export const formatSharePointData = (data: any[]): ITableItem[] => {
  return data.map((item: any) => {
    try {
      return {
        ID: item.Id,
        fromDate: parseSharePointDate(item.FromDate),
        toDate: parseSharePointDate(item.ToDate),
        building: item.Building || '',
        venue: item.Venue || '',
        referenceNumber: item.ReferenceNumber || '',
        purposeOfUse: item.PurposeOfUse || '',
        numberOfParticipants: parseInt(item.NoParticipant) || 0,
        requestedBy: item.RequestedBy || '',
        department: item.Department || '',
        contactNumber: item.ContactNumber || '',
        status: item.Status || ''
      };
    } catch (error) {
      console.error('Error formatting SharePoint data:', error);
      return item;
    }
  });
};

/**
 * Validates date range for search
 * @param fromDate Start date
 * @param toDate End date
 * @returns True if date range is valid
 */
export const isValidDateRange = (fromDate: Date | null, toDate: Date | null): boolean => {
  if (!fromDate || !toDate) {
    return false;
  }

  // Ensure fromDate is not after toDate
  return fromDate.getTime() <= toDate.getTime();
};

/**
 * Generates the home page URL
 * @param siteUrl Base SharePoint site URL
 * @returns Complete home page URL
 */
export const getHomePageUrl = (siteUrl: string): string => {
  return `${siteUrl}/SitePages/Home.aspx`;
};

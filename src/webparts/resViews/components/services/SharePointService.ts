import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/site-groups/web";
import { ITableItem, STATUS } from "../interfaces/IResViews";
import { dateConverter } from "../utils/helpers";
import { formatSharePointData } from "../utils/businessLogic";

interface IRequestResponse {
  referenceNumberList: ITableItem[];
  pastRequestList: ITableItem[];
  approvalRequest: ITableItem[];
}

interface IUserGroupResponse {
  isApprover: boolean;
  departments: string[];
}

export class SharePointService {
  private static createFilterQuery(dateRange: string, departments: string[]): string {
    return departments.length 
      ? `${dateRange} and ${departments.map(item => `Department eq '${item}'`).join(' or ')}`
      : dateRange;
  }

  private static categorizeRequests(items: ITableItem[]): IRequestResponse {
    try {
      const referenceNumberList = items;
      const pastRequestList = items.filter(item => 
        [STATUS.APPROVED, STATUS.DISAPPROVED, STATUS.CANCELLED].includes(item.status)
      );
      const approvalRequest = items.filter(item => 
        item.status === STATUS.PENDING
      );

      return {
        referenceNumberList,
        pastRequestList,
        approvalRequest,
      };
    } catch (error) {
      console.error('Error categorizing requests:', error);
      return {
        referenceNumberList: [],
        pastRequestList: [],
        approvalRequest: [],
      };
    }
  }

  public static async getRequestItems(from: string, to: string, department: string[]): Promise<IRequestResponse> {
    try {
      const dateRange = `FromDate ge datetime'${dateConverter(from, 1)}' and ToDate le datetime'${dateConverter(to, 2)}'`;
      const filterQuery = this.createFilterQuery(dateRange, department);

      const requestItems = await sp.web.lists
        .getByTitle("Request")
        .items.select(
          "Id",
          "FromDate",
          "ToDate",
          "Building",
          "Venue",
          "ReferenceNumber",
          "PurposeOfUse",
          "NoParticipant",
          "RequestedBy",
          "Department",
          "ContactNumber",
          "Status"
        )
        .filter(filterQuery)
        .orderBy("Id", false)
        .get();

      console.log('Raw SharePoint data:', requestItems); // Debug log
      const formattedItems = formatSharePointData(requestItems);
      console.log('Formatted items:', formattedItems); // Debug log
      return this.categorizeRequests(formattedItems);
    } catch (error) {
      console.error('Error fetching request items:', error);
      throw new Error('Failed to fetch request items');
    }
  }

  public static async getCurrentUserGroups(): Promise<IUserGroupResponse> {
    try {
      const [crsdUsers, ddUsers, currentUser] = await Promise.all([
        sp.web.siteGroups.getByName("CRSD").users(),
        sp.web.siteGroups.getByName("DD").users(),
        sp.web.currentUser.get()
      ]);

      const crsdEmails = crsdUsers.map((item) => item.Email);
      const ddEmails = ddUsers.map((item) => item.Email);
      const userEmail = currentUser.Email;

      const isApprover = crsdEmails.includes(userEmail) || ddEmails.includes(userEmail);

      const departmentData = await sp.web.lists
        .getByTitle("UsersPerDepartment")
        .items.select(
          "EmployeeName/EMail",
          "Department/Department",
        )
        .filter(`EmployeeName/EMail eq '${userEmail}'`)
        .expand(
          "Department/FieldValuesAsText",
          "EmployeeName/EMail",
        )
        .get();

      const departments = departmentData.map(item => item.Department.Department);

      return {
        isApprover,
        departments
      };
    } catch (error) {
      console.error('Error getting user groups:', error);
      throw new Error('Failed to get user groups');
    }
  }
}

import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { STATUS } from "../constants";
import { createDateRangeFilter } from "../utils/dateUtils";

export interface IRequestItem {
  building: string;
  venue: string;
  fromDate: Date;
  toDate: Date;
  referenceNumber: string;
  purposeOfUse: string;
  numberOfParticipants: number;
  requestedBy: string;
  department: string;
  contactNumber: string;
  status: string;
  ID: number;
}

export class SharePointService {
  public async getCurrentUser() {
    try {
      return await sp.web.currentUser.get();
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }

  public async getUserGroups() {
    try {
      const [crsdUsers, ddUsers] = await Promise.all([
        sp.web.siteGroups.getByName("CRSD").users(),
        sp.web.siteGroups.getByName("DD").users()
      ]);

      return {
        crsdUsers: crsdUsers.map(item => item.Email),
        ddUsers: ddUsers.map(item => item.Email)
      };
    } catch (error) {
      console.error('Error getting user groups:', error);
      throw error;
    }
  }

  public async getUserDepartments(userEmail: string) {
    try {
      const deparmentData = await sp.web.lists
        .getByTitle("UsersPerDepartment")
        .items.select(
          "EmployeeName/EMail",
          "Department/Department"
        )
        .filter(`EmployeeName/EMail eq '${userEmail}'`)
        .expand(
          "Department/FieldValuesAsText",
          "EmployeeName/EMail"
        )
        .get();

      return deparmentData.map(item => item.Department.Department);
    } catch (error) {
      console.error('Error getting user departments:', error);
      throw error;
    }
  }

  public async getRequestItems(fromDate: Date, toDate: Date, departments: string[]) {
    try {
      const filterQuery = createDateRangeFilter(fromDate, toDate, departments);
      
      const requestItems: any[] = await sp.web.lists
        .getByTitle("Request")
        .items.select("*")
        .filter(filterQuery)
        .orderBy("Id", false)
        .get();

      return this.processRequestItems(requestItems);
    } catch (error) {
      console.error('Error getting request items:', error);
      throw error;
    }
  }

  private processRequestItems(items: any[]): {
    allRequests: IRequestItem[];
    pastRequests: IRequestItem[];
    pendingRequests: IRequestItem[];
  } {
    const allRequests: IRequestItem[] = [];
    const pastRequests: IRequestItem[] = [];
    const pendingRequests: IRequestItem[] = [];

    items.forEach(item => {
      const requestItem: IRequestItem = {
        building: item.Building,
        venue: item.Venue,
        fromDate: item.FromDate,
        toDate: item.ToDate,
        referenceNumber: item.ReferenceNumber,
        purposeOfUse: item.PurposeOfUse,
        numberOfParticipants: item.NoParticipant,
        requestedBy: item.RequestedBy,
        department: item.Department,
        contactNumber: item.ContactNumber,
        status: item.Status,
        ID: item.Id
      };

      allRequests.push(requestItem);

      if (item.Status === STATUS.APPROVED || 
          item.Status === STATUS.DISAPPROVED || 
          item.Status === STATUS.CANCELLED) {
        pastRequests.push(requestItem);
      }

      if (item.Status === STATUS.PENDING) {
        pendingRequests.push(requestItem);
      }
    });

    return {
      allRequests,
      pastRequests,
      pendingRequests
    };
  }
}

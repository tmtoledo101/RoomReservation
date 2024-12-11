import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/site-groups/web";
import { ITableItem, STATUS } from "../interfaces/IResViews";
import { dateConverter } from "../utils/helpers";

export class SharePointService {
  public static async getRequestItems(from: string, to: string, department: string[]): Promise<{
    referenceNumberList: ITableItem[];
    pastRequestList: ITableItem[];
    approvalRequest: ITableItem[];
  }> {
    const dateRange = `FromDate ge datetime'${dateConverter(from, 1)}' and ToDate le datetime'${dateConverter(to, 2)}'`;
    let filterQuery = department.length 
      ? `${dateRange} and ${department.map(item => `Department eq '${item}'`).join(' or ')}`
      : dateRange;

    const RequestItem: any[] = await sp.web.lists
      .getByTitle("Request")
      .items.select("*")
      .filter(filterQuery)
      .orderBy("Id", false)
      .get();

    const itemArray1: ITableItem[] = [];
    const itemArray2: ITableItem[] = [];
    const itemArray3: ITableItem[] = [];

    RequestItem.forEach((item) => {
      const tempObj: ITableItem = {
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
        ID: item.Id,
      };

      itemArray1.push(tempObj);
      
      if (
        item.Status === STATUS.APPROVED ||
        item.Status === STATUS.DISAPPROVED ||
        item.Status === STATUS.CANCELLED
      ) {
        itemArray2.push(tempObj);
      }
      
      if (item.Status === STATUS.PENDING) {
        itemArray3.push(tempObj);
      }
    });

    return {
      referenceNumberList: itemArray1,
      pastRequestList: itemArray2,
      approvalRequest: itemArray3,
    };
  }

  public static async getCurrentUserGroups(): Promise<{
    isApprover: boolean;
    departments: string[];
  }> {
    //const crsdUsers = await sp.web.siteGroups.getByName("CRSD").users();
    //const ddUsers = await sp.web.siteGroups.getByName("DD").users();
    const currentUser = await sp.web.currentUser.get();

    //const crsdEmails = crsdUsers.map((item) => item.Email);
    //const ddEmails = ddUsers.map((item) => item.Email);
    const userEmail = currentUser.Title;

    //const isApprover = crsdEmails.includes(userEmail) || ddEmails.includes(userEmail);
    const isApprover = true;
    const departmentData: any[] = await sp.web.lists
      .getByTitle("UsersPerDepartment")
      .items.select(
        "EmployeeName/EMail",
        "Department/Department",
      )
      //Terence Commented this out
      //.filter(`EmployeeName/EMail eq '${userEmail}'`)
      .filter(`Title eq '${userEmail}'`)
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
  }
}

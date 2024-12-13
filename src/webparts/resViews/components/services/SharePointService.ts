import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/site-groups/web";
import { ITableItem, STATUS } from "../interfaces/IResViews";
import { IFacilityMapItem, IDropdownItem } from "../interfaces/IFacility";
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
    const currentUser = await sp.web.currentUser.get();
    const userEmail = currentUser.Title;
    const isApprover = true;
    
    const departmentData: any[] = await sp.web.lists
      .getByTitle("UsersPerDepartment")
      .items.select(
        "EmployeeName/EMail",
        "Department/Department",
      )
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

  public static async getFacilities(): Promise<{
    facilityList: IDropdownItem[];
    facilityMap: { [key: string]: IFacilityMapItem };
  }> {
    const facilities: any[] = await sp.web.lists
      .getByTitle("Facility")
      .items.select("*")
      .get();

    const facilityMap: { [key: string]: IFacilityMapItem } = {};
    const facilityList: IDropdownItem[] = [];

    facilities.forEach(facility => {
      facilityMap[facility.Title] = {
        Title: facility.Title,
        AssetNumber: facility.AssetNumber,
        Facility: facility.Facility,
        Quantity: facility.Quantity,
        FacilityOwner: facility.FacilityOwner
      };

      facilityList.push({
        id: facility.Title,
        value: facility.Title
      });
    });

    return {
      facilityList,
      facilityMap
    };
  }

  public static async isVenueCRSD(venue: string): Promise<boolean> {
    try {
      const venueItem = await sp.web.lists
        .getByTitle("Venue")
        .items.select("Group")
        .filter(`Venue eq '${venue}'`)
        .get();
      console.log('venueItem');
      console.log(venueItem.length ); 
      console.log(venueItem[0].Group);
      return venueItem.length > 0 && venueItem[0].Group === 'CRSD';
    } catch (error) {
      console.error('Error checking venue group:', error);
      return false;
    }
  }

  public static async updateReservation(id: number, data: any): Promise<void> {
    try {
      const updateData = {
        Building: data.building,
        Venue: data.venue,
        FromDate: data.fromDate,
        ToDate: data.toDate,
        PurposeOfUse: data.purposeOfUse,
        NoParticipant: data.numberOfParticipants,
        RequestedBy: data.requestedBy,
        Department: data.department,
        ContactNumber: data.contactNumber,
        Status: data.status,
        FacilityData: JSON.stringify(data.facilityData || [])
      };

      await sp.web.lists.getByTitle("Request").items.getById(id).update(updateData);
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw new Error('Failed to update reservation');
    }
  }
}

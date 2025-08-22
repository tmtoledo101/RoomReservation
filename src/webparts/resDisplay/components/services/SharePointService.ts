/**
 * SharePointService:
 *
 * This class provides methods for interacting with SharePoint, including retrieving venue information, user details,
 * list data, and updating request items. It also includes methods for checking room availability and sending emails.
 */

import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/sputilities";
import { Web } from "@pnp/sp/webs";
import { IEmailProperties } from "@pnp/sp/sputilities";
import * as moment from "moment";
import { IFacilityData } from "../interfaces/IResDisplay";
import { dateFormat } from "../utils/helpers";
import { configService } from "../../../shared/services/ConfigurationService";
import { isDevelopmentMode } from "../../../shared/utils/enivronmentHelper";
interface IGroupUsers {
  crsdUsers: { Email: string; Title: string; }[];
  ddUsers: { Email: string; Title: string; }[];
  fssUsers: { Email: string; Title: string; }[];
}
export class SharePointService {
  private web: any;

  constructor() {
    this.web = Web(configService.getAccessControlUrl());
  }
  
  public async getLoggedinUser() {
    return await sp.web.currentUser.get();
  }

  public async getVenueImage(filterData: string) {
    const buildingData: any[] = await sp.web.lists
      .getByTitle("Venue")
      .items.select("Image", "CapacityperLayout", "FacilitiesAvailable", "VenueId", "Id")
      .filter(`Venue eq '${filterData}'`)
      .get();

    if (buildingData.length > 0) {
      const item = buildingData[0];
      let venueImage = '';
      
      if (item.Image) {
        try {
          const image = JSON.parse(item.Image);
          venueImage = (image && image.serverRelativeUrl) ? image.serverRelativeUrl : '';
        } catch (error) {
          console.warn('Error parsing image data:', error);
        }
      }
      
      return {
        venueImage,
        facilitiesAvailable: JSON.parse(JSON.stringify(item.FacilitiesAvailable)),
        capacityperLayout: item.CapacityperLayout,
        venueId: item.VenueId,
        selectedID: item.Id
      };
    }
    return null;
  }

  public async getRequestById(id: string) {
    return await sp.web.lists.getByTitle("Request").items.getById(Number(id)).get();
  }

  public async getDepartments(email: string) {
    // Retrieves department information for a user
      // Includes sector mapping and pagination handling
      console.log("TESTENV_department", configService.isTestEnvironment() );
      console.log( "DEVUSER_department",configService.isDevUser());
      console.log("Terence, here is the user : " + email, "developmentMode:", isDevelopmentMode());
      // Remove .filter from the SharePoint query and do filtering in-memory
      let deparmentData = [];
      let page = await sp.web.lists
        .getByTitle("UsersPerDepartment")
        .items
        .select("EmployeeName/EMail", "Department/Department")
        .expand("Department", "EmployeeName")
        .top(5000)
        .getPaged();

      // Collect all pages
      while (true) {
        deparmentData.push(...page.results);
        if (page.hasNext) {
          page = await page.getNext();
        } else {
          break;
        }
      }

      // In-memory filter by email
      deparmentData = deparmentData.filter(item =>
        item.EmployeeName && item.EmployeeName.EMail === email
      );

      const deparmentList: any[] = await sp.web.lists
        .getByTitle("Department")
        .items.select(
          "Department",
          "Sector"
        )
        .get();

      return { deparmentData, deparmentList };
  }

  public async getBuildings() {
    return await sp.web.lists
      .getByTitle("Venue")
      .items.select(
        "Id",
        "Building",
        "Venue",
        "Group",
        "CapacityperLayout",
        "FacilitiesAvailable",
        "ExclusiveTo",
        "Image",
        "VenueId",
      )
      .get();
  }

  public async getLayout() {
    return await sp.web.lists
      .getByTitle("LayoutTablesChairs")
      .items.select("Venue/Venue", "Layout")
      .expand("Venue/FieldValuesAsText")
      .get();
  }

  public async getPrincipalUser(dept: string) {
    return await this.web.lists.getByTitle("Employees")
      .items.select("Name", "Dept")
      .filter(`Dept eq '${dept}'`)
      .get();
  }

  public async getPurposeofUse() {
    return await sp.web.lists
      .getByTitle("PurposeofUse")
      .items.select("Title")
      .get();
  }

  public async getParticipants() {
    return await sp.web.lists
      .getByTitle("Participants")
      .items.select("Title")
      .get();
  }

  public async getFacility() {
    const facilities = await sp.web.lists
      .getByTitle("Facility")
      .items.select("Title", "AssetNumber", "Facility", "Quantity", "FacilityOwner/Title", "FacilityOwner/ID", "FacilityOwner/EMail")
      .expand("FacilityOwner")
      .get();

    const facilityMap = {};
    facilities.forEach((item) => {
      facilityMap[item.Facility] = {
        ...item,
        "FacilityOwner":
          item.FacilityOwner && item.FacilityOwner.results && item.FacilityOwner.results.length > 0
            ? item.FacilityOwner.results[0].EMail
            : null
      };
    });

    return facilityMap;
  }

  public async getFiles(guid: string, siteRelativeUrl: string) {
    return await sp.web.getFolderByServerRelativeUrl(siteRelativeUrl + '/ReservationDocs/' + guid)
      .files
      .select("*")
      .top(5000)
      .expand('ListItemAllFields')
      .get();
  }

  public async getCRSD(): Promise<IGroupUsers> {
    let crsdUsers = [];
    let ddUsers = [];
    let fssUsers = [];
  
    try {
      try {
        crsdUsers = await sp.web.siteGroups.getById(27).users();
        console.log('CRSD Users fetched:', crsdUsers.length);
      } catch (error) {
        console.warn('Failed to fetch CRSD users:', error);
      }
  
      try {
        ddUsers = await sp.web.siteGroups.getById(28).users();
        console.log('DD Users fetched:', ddUsers.length);
      } catch (error) {
        console.warn('Failed to fetch DD users:', error);
      }

      try {
        fssUsers = await sp.web.siteGroups.getById(1016).users();
        console.log('FSS Users fetched:', fssUsers.length);
      } catch (error) {
        console.warn('Failed to fetch FSS users:', error);
      }
  
      return {
        crsdUsers: crsdUsers || [],
        ddUsers: ddUsers || [],
        fssUsers: fssUsers || []
      };
  
    } catch (error) {
      console.error('Error in getCRSD:', error);
      return {
        crsdUsers: [],
        ddUsers: [],
        fssUsers: []
      };
    }
  }

  public async updateRoomTimeSlot(id: string | number, venueId: string, fromDate: string, toDate: string, isRemoved = false) {
    const venueData: any[] = await sp.web.lists.getByTitle("Venue").items.select(
      "Timeslot",
      "VenueId",
    )
      .filter(`VenueId eq ${venueId}`)
      .get();

    const venue = venueData[0];
    let timeSlot: string[] = JSON.parse(venue.Timeslot) || [];
    if (isRemoved) {
      timeSlot = timeSlot.filter(item => item !== `${fromDate} ${toDate}`);
    } else {
      timeSlot.push(`${fromDate} ${toDate}`);
    }

    await sp.web.lists.getByTitle('Venue').items.getById(Number(id)).update({
      Timeslot: JSON.stringify(timeSlot),
    });
  }

  public async checkRoomAvailablity(venueId: string, fromDate: string, toDate: string) {
    const venueData: any[] = await sp.web.lists
      .getByTitle("Venue")
      .items.select(
        "Timeslot",
        "VenueId",
      )
      .filter(`VenueId eq ${venueId}`)
      .get();

    const venue = venueData[0];
    const TimeSlot = JSON.parse(venue.Timeslot) || [];
    let isAvailable = true;

    for (let i = 0; i < TimeSlot.length; i++) {
      const data = TimeSlot[i].split(" ");
      const [start, end] = data;
      isAvailable = (moment(fromDate).isAfter(start) && moment(fromDate).isAfter(end)
        && moment(toDate).isAfter(start) && moment(toDate).isAfter(end)) ||
        (moment(fromDate).isBefore(start) && moment(fromDate).isBefore(end)
          && moment(toDate).isBefore(start) && moment(toDate).isBefore(end)
        );
      if (!isAvailable) {
        break;
      }
    }
    return isAvailable;
  }

  public async updateRequest(id: string | number, formData: any, newStatus: string, selectedID: string | number, guid: string) {
    try {
      console.log("SharePointService.updateRequest - Starting with parameters:", {
        id,
        newStatus,
        selectedID,
        guid,
        hasFormData: !!formData
      });
      /*
      const participant = JSON.stringify(formData["participants"]);
      const facility = JSON.stringify(formData["facilityData"]);

      console.log("SharePointService.updateRequest - Serialized data:", {
        participant,
        facility
      });

      // Update room time slot for cancellation/disapproval
      if (newStatus === "Cancelled" || newStatus === "Disapproved") {
        console.log("SharePointService.updateRequest - Updating room time slot for cancellation/disapproval");
        try {
          await this.updateRoomTimeSlot(selectedID, formData["venueId"], this.ISODate(formData["fromDate"]), this.ISODate(formData["toDate"]), true);
          console.log("SharePointService.updateRequest - Room time slot updated successfully");
        } catch (timeSlotError) {
          console.error("SharePointService.updateRequest - Error updating room time slot:", timeSlotError);
          throw new Error(`Failed to update room time slot: ${timeSlotError.message}`);
        }
      }

      let dataNeedsToBeUpdated = {};

      if (formData.isEdit) {
        console.log("SharePointService.updateRequest - Processing edit mode");
        try {
          const isAvailable = await this.checkRoomAvailablity(formData["venueId"], this.ISODate(formData["fromDate"]), this.ISODate(formData["toDate"]));
          if (newStatus === "Approved" && isAvailable) {
            await this.updateRoomTimeSlot(selectedID, formData["venueId"], this.ISODate(formData["fromDate"]), this.ISODate(formData["toDate"]));
          }
        } catch (availabilityError) {
          console.error("SharePointService.updateRequest - Error checking room availability:", availabilityError);
          throw new Error(`Failed to check room availability: ${availabilityError.message}`);
        }

        dataNeedsToBeUpdated = {
          Title: formData["requestedBy"],
          RequestedBy: formData["requestedBy"],
          Department: formData["department"],
          Building: formData["building"],
          Venue: formData["venue"],
          Layout: formData["layout"],
          PrincipalUser: formData["principal"],
          ContactPerson: formData["contactPerson"],
          ContactNumber: formData["contactNumber"],
          PurposeOfUse: formData["purposeOfUse"],
          Participant: participant,
          NoParticipant: formData["numberOfParticipant"],
          TitleDescription: formData["titleDesc"],
          FromDate: formData["fromDate"],
          ToDate: formData["toDate"],
          OtherRequirement: formData["otherRequirements"],
          IsCSDR: formData["isCSDR"],
          FacilityData: facility,
        };
      }
      */
      // Update the main request item
      console.log("SharePointService.updateRequest - Updating main request item with data:", {
        Status: newStatus,
        id: Number(id)
      });

      try {
        await sp.web.lists.getByTitle('Request').items.getById(Number(id)).update({
          Status: newStatus,
        });
        console.log("SharePointService.updateRequest - Main request item updated successfully");
      } catch (updateError) {
        console.error("SharePointService.updateRequest - Error updating main request item:", updateError);
        throw new Error(`Failed to update request item: ${updateError.message}`);
      }

      // Handle file operations
      if (guid && formData.files && formData.files.length > 0) {
        console.log("SharePointService.updateRequest - Processing file operations for guid:", guid);
        try {
          const f = "/sites/ResourceReservation" + "/ReservationDocs/" + guid;
          
          // Delete existing folder
          try {
            await sp.web.lists.getByTitle("ReservationDocs").rootFolder.folders.getByName(guid).delete();
            console.log("SharePointService.updateRequest - Existing folder deleted");
          } catch (deleteError) {
            console.warn("SharePointService.updateRequest - Could not delete existing folder (may not exist):", deleteError);
          }

          // Create new folder and upload files
          await sp.web.lists.getByTitle("ReservationDocs").rootFolder.folders
            .add(guid)
            .then(r => {
              console.log("SharePointService.updateRequest - New folder created, uploading files");
              return Promise.all(formData.files.map((file) => {
                if (file.size <= 10485760) {
                  return sp.web.getFolderByServerRelativeUrl(f).files.add(file.name, file, true)
                    .then(result => {
                      return result.file.getItem()
                        .then(item => {
                          return item.update({
                            RequestId: guid
                          });
                        });
                    });
                } else {
                  return sp.web.getFolderByServerRelativeUrl(f).files.addChunked(file.name, file, d1 => {
                  }, true).then(({ file: fileData }) => fileData.getItem()).then((item: any) => {
                    return item.update({
                      RequestId: guid
                    });
                  });
                }
              }));
            });
          console.log("SharePointService.updateRequest - File operations completed successfully");
        } catch (fileError) {
          console.error("SharePointService.updateRequest - Error during file operations:", fileError);
          // Don't throw here as the main update was successful
          console.warn("SharePointService.updateRequest - Continuing despite file operation error");
        }
      }

      console.log("SharePointService.updateRequest - Update completed successfully");
    } catch (error) {
      console.error("SharePointService.updateRequest - Error during update:", error);
      throw error;
    }
  }



  private ISODate(date: string) {
    return moment(date).toISOString();
  }
}

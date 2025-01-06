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

export class SharePointService {
  private web = Web("https://bspgovph.sharepoint.com/sites/AccessControl");

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
      const image = JSON.parse(item.Image);
      return {
        venueImage: image.serverRelativeUrl,
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
    const deparmentData: any[] = await sp.web.lists
      .getByTitle("UsersPerDepartment")
      .items.select(
        "EmployeeName/EMail",
        "Department/Department",
      ).filter(`EmployeeName/EMail eq '${email}'`)
      .expand(
        "Department/FieldValuesAsText",
        "EmployeeName/EMail",
      )
      .get();

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
    return await sp.web.lists
      .getByTitle("Facility")
      .items.select("Title", "AssetNumber", "Facility", "Quantity")
      .get();
  }

  public async getFiles(guid: string, siteRelativeUrl: string) {
    return await sp.web.getFolderByServerRelativeUrl(siteRelativeUrl + '/ReservationDocs/' + guid)
      .files
      .select("*")
      .top(5000)
      .expand('ListItemAllFields')
      .get();
  }

  public async getCRSD() {
    const crsdUsers = await sp.web.siteGroups.getById(27).users();
    const ddUsers = await sp.web.siteGroups.getById(28).users();
    return { crsdUsers, ddUsers };
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
    const participant = JSON.stringify(formData["participant"]);
    const facility = JSON.stringify(formData["facilityData"]);

    if (newStatus === "Cancelled" || newStatus === "Disapproved") {
      await this.updateRoomTimeSlot(selectedID, formData["venueId"], this.ISODate(formData["fromDate"]), this.ISODate(formData["toDate"]), true);
    }

    let dataNeedsToBeUpdated = {};

    if (formData.isEdit) {
      const isAvailable = await this.checkRoomAvailablity(formData["venueId"], this.ISODate(formData["fromDate"]), this.ISODate(formData["toDate"]));
      if (newStatus === "Approved" && isAvailable) {
        await this.updateRoomTimeSlot(selectedID, formData["venueId"], this.ISODate(formData["fromDate"]), this.ISODate(formData["toDate"]));
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

    await sp.web.lists.getByTitle('Request').items.getById(Number(id)).update({
      ...dataNeedsToBeUpdated,
      Status: newStatus
    });

    if (guid) {
      const f = "/sites/ResourceReservation" + "/ReservationDocs/" + guid;
      await sp.web.lists.getByTitle("ReservationDocs").rootFolder.folders.getByName(guid).delete();
      await sp.web.lists.getByTitle("ReservationDocs").rootFolder.folders
        .add(guid)
        .then(r => {
          Promise.all(formData.files.map((file) => {
            if (file.size <= 10485760) {
              sp.web.getFolderByServerRelativeUrl(f).files.add(file.name, file, true)
                .then(result => {
                  result.file.getItem()
                    .then(item => {
                      item.update({
                        RequestId: guid
                      });
                    });
                });
            } else {
              sp.web.getFolderByServerRelativeUrl(f).files.addChunked(file.name, file, d1 => {
              }, true).then(({ file: fileData }) => fileData.getItem()).then((item: any) => {
                return item.update({
                  RequestId: guid
                });
              });
            }
          }));
        });
    }
  }

  public async sendEmail(to: string[], cc: string[], values: any, type: string, siteUrl: string, id: string) {
    let emailProps: IEmailProperties = {
      From: "NTT_LagmayJ_JavierGO@bsp.gov.ph",
      To: to,
      CC: cc,
      Subject: '',
      Body: '',
      AdditionalHeaders: {
        "content-type": "application/json;odata=verbose",
      }
    };

    if (type === 'Approved') {
      emailProps.Subject = `Approved Request for Reservation.:  ${id}. Date of Use: ${dateFormat(values["fromDate"])} to ${dateFormat(values["toDate"])}`;
      emailProps.Body = `We are pleased to inform you that your venue reservation request is approved. <br/>
      For further assistance, you may e-mail us at coraoreservations@bsp.gov.ph or call our Events and  
      Visitor Services Pool (EVSP) at local telephone numbers 2559 or 2462.<br/><br/>
      Link: <a href="${siteUrl}/SitePages/DisplayReservation_appge.aspx?pid=${id}">Request url</a>`;
    }
    if (type === 'Disapproved') {
      emailProps.Subject = `Disapproved Request for Reservation.:  ${id}. Date of Use: ${dateFormat(values["fromDate"])} to ${dateFormat(values["toDate"])}`;
      emailProps.Body = `We regret to inform you that your venue reservation request is disapproved. 
      For further clarifications, you may e-mail us at coraoreservations@bsp.gov.ph or call our
       Events and Visitor Services Pool (EVSP) at local telephone numbers 2559 or 2462.<br/><br/>
      Link: <a href="${siteUrl}/SitePages/DisplayReservation_appge.aspx?pid=${id}">Request url</a>`;
    }
    if (type === 'Cancelled') {
      emailProps.Subject = `Cancelled Request for Reservation.:  ${id}. Date of Use: ${dateFormat(values["fromDate"])} to ${dateFormat(values["toDate"])}`;
      emailProps.Body = `This venue reservation request is cancelled. 
      For further clarifications, you may e-mail us at coraoreservations@bsp.gov.ph or call our
       Events and Visitor Services Pool (EVSP) at local telephone numbers 2559 or 2462.<br/><br/>
      Link: <a href="${siteUrl}/SitePages/DisplayReservation_appge.aspx?pid=${id}">Request url</a>`;
    }

    await sp.utility.sendEmail(emailProps);
  }

  private ISODate(date: string) {
    return moment(date).toISOString();
  }
}

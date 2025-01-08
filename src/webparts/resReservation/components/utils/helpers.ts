import * as moment from "moment";
import { sp } from "@pnp/sp";
import { IEmailProperties } from "@pnp/sp/sputilities";
import "@pnp/sp/sputilities";
import { graph } from "@pnp/graph";
import "@pnp/graph/users";
import "@pnp/graph/messages";

interface IEmailResult {
  success: boolean;
  error?: string;
}

const validateEmailProps = (emailProps: IEmailProperties): string | null => {
  if (!emailProps.To || emailProps.To.length === 0) {
    return "Recipient (To) email address is required";
  }
  
  if (!emailProps.Subject) {
    return "Email subject is required";
  }
  
  if (!emailProps.Body) {
    return "Email body is required";
  }

  // Basic email format validation for To and CC recipients
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidTo = emailProps.To.some(email => !emailRegex.test(email));
  if (invalidTo) {
    return "Invalid recipient email address format";
  }

  if (emailProps.CC && emailProps.CC.length > 0) {
    const invalidCC = emailProps.CC.some(email => !emailRegex.test(email));
    if (invalidCC) {
      return "Invalid CC email address format";
    }
  }

  return null;
};

const sendEnhancedEmail = async (emailProps: IEmailProperties): Promise<IEmailResult> => {
  try {
    // Validate email properties
    console.log("Sending email From:", emailProps.From);
    const validationError = validateEmailProps(emailProps);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    if (emailProps.From) {
      try {
        // Send using PnP utility method
        console.log("Sending email via Graph API");
        await sp.utility.sendEmail({
          ...emailProps,
          AdditionalHeaders: {
            "content-type": "text/html",
            "X-SendAs": emailProps.From
          }
        });
        return { success: true };
      } catch (error) {
        console.error("Failed to send email via Graph API:", error);
        
        // Fallback to SharePoint if Graph API fails
        console.warn("Falling back to SharePoint email service");
        await sp.utility.sendEmail(emailProps);
        return { 
          success: true,
          error: "Used fallback SharePoint email service" 
        };
      }
    } else {
      // No From address specified, use SharePoint system account
      await sp.utility.sendEmail(emailProps);
      return { success: true };
    }
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      error: error.message || "Failed to send email"
    };
  }
};

export const PENDING = "Pending for Approval";
export const FSS = "FSS";
export const APPROVED = "Approved";

export const mapArrayToObject = (obj) =>
  Object.keys(obj).map((item) => {
    return { id: item, value: item };
  });
 
export const arrayToDropDownValues = (array) =>
  array.map((item) => ({ id: item, value: item }));

export const dateFormat = (date) => {
  return moment(date).format("MM/DD/yyyy HH:mm");
};

export const getCount = (count, padlen = 2) => {
  const newCount = `${count + 1}`;
  return newCount.padStart(padlen,'0');
};

export const newResEmail = async (to: Array<string>, cc: Array<string>, values: any, type: any, facilitiesAvailable: any, siteUrl: string, id): Promise<IEmailResult> => {
  const toEmail = [...to];
  const ccEmail = [...cc];
  const emailProps: IEmailProperties = {
    From: "TDO365ASMEDEV1_SYS@bsp.gov.ph",
    To: toEmail,
    CC: ccEmail,
    Subject: '',
    Body: '',
    AdditionalHeaders: {
      "content-type": "application/json;odata=verbose",
    }
  };
  emailProps.From = "TDO365ASMEDEV1_SYS@bsp.gov.ph"; 
  
  if(type === 1) {
    emailProps.Subject = `New Room Reservation Request: ${id}. Date of Use: ${dateFormat(values.fromDate)} to ${dateFormat(values.toDate)}`;
    emailProps.Body= `<b>Request for Use of Resource Reservation System</b><br/><br/>
    New reservation has been requested in Resource Reservation System<br/>
    Please visit the link below to view the document for your appropriate action.<br/><br/>
    Thank you.<br/><br/>
    Reference No. ${id}<br/>
    Date of Use: ${dateFormat(values.fromDate)} To ${dateFormat(values.toDate)}<br/><br/>
    Venue: ${values.venue}<br/><br/>
    Facilities Available: ${facilitiesAvailable}<br/><br/>
    Requestor: ${values.requestedBy}<br/>
    Department: ${values.department}<br/><br/>
    Principal User: ${values.principal}<br/><br/>
    Contact Person: ${values.contactPerson}<br/>
    Department: ${values.department}<br/>
    Contact No: ${values.contactNumber}<br/><br/>
    Participants: ${values.participant.join(' , ')}<br/>
    Purpose of Use:${values.purposeOfUse}<br/>
    Title Description: ${values.titleDesc}<br/>
    No. of Participants: ${values.numberOfParticipant}<br/><br/>
    Link: <a href="${siteUrl}/SitePages/DisplayReservation_appge.aspx?pid=${id}">Request url</a>
    `;
  }

  if(type === 2) {
    const data = facilitiesAvailable.owner.map(item => `${item.Facility} - ${item.Quantity}`).join(' , ');
    emailProps.Subject = `Facility In-Charge: Approved Request for Reservation. ${id}. Date of Use: ${dateFormat(values.fromDate)} to ${dateFormat(values.toDate)}`;
    emailProps.Body= `<b>Request for Use of Facility - Resource Reservation System</b><br/><br/>
    Request for reservation has been approved in the Resource Reservation System<br/>
    Please visit the link below to view the document.<br/><br/>
    Thank you.<br/><br/>
    Reference No. ${id}<br/><br/>
    Date of Use: ${dateFormat(values.fromDate)} To ${dateFormat(values.toDate)}<br/><br/>
    Venue: ${values.venue}<br/><br/>
    Facilities Available: <pre>${facilitiesAvailable.facility}</pre><br/>
    Facilities: ${data}<br/>
    Layout: ${values.layout}<br/><br/>
    Requestor: ${values.requestedBy}<br/>
    Department: ${values.department}<br/><br/>
    Principal User: ${values.principal}<br/><br/>
    Contact Person: ${values.contactPerson}<br/>
    Department: ${values.department}<br/>
    Contact No: ${values.contactNumber}<br/>
    Participants: ${values.participant.join(' , ')}<br/>
    Purpose of Use:${values.purposeOfUse}<br/>
    Title Description: ${values.titleDesc}<br/>
    No. of Participants: ${values.numberOfParticipant}<br/><br/>
    Link: <a href="${siteUrl}/SitePages/DisplayReservation_appge.aspx?pid=${id}">Request url</a>
    `;
  }

  if (type === 3) {
    emailProps.Subject = `Approved Request for Reservation.: ${id}. Date of Use: ${dateFormat(values["fromDate"])} to ${dateFormat(values["toDate"])}`;
    emailProps.Body = `We are pleased to inform you that your venue reservation request is approved. <br/>
    For further assistance, you may e-mail us at coraoreservations@bsp.gov.ph or call our Events and  
    Visitor Services Pool (EVSP) at local telephone numbers 2559 or 2462.<br/><br/>
    Link: <a href="${siteUrl}/SitePages/DisplayReservation_appge.aspx?pid=${id}">Request url</a>
    `;
  }

  if (type === 4) {
    emailProps.Subject = `Approved Request for Reservation.: ${id}. Date of Use: ${dateFormat(values["fromDate"])} to ${dateFormat(values["toDate"])}`;
    emailProps.Body = `We are pleased to inform you that your venue reservation request is approved. <br/>
    Link: <a href="${siteUrl}/SitePages/DisplayReservation_appge.aspx?pid=${id}">Request url</a>
    `;
  }

  const result = await sendEnhancedEmail(emailProps);
  if (!result.success) {
    console.error("Failed to send reservation email:", result.error);
  }
  return result;
};

export const checkRoomAvailability = async (venueId: string, fromDate: string, toDate: string) => {
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

  for(let i = 0; i < TimeSlot.length; i++) {
    const data = TimeSlot[i].split(" ");
    const [start, end] = data;
    isAvailable = (moment(fromDate).isAfter(start) && moment(fromDate).isAfter(end) 
                && moment(toDate).isAfter(start) && moment(toDate).isAfter(end)) || 
                (moment(fromDate).isBefore(start) && moment(fromDate).isBefore(end) 
                && moment(toDate).isBefore(start) && moment(toDate).isBefore(end));
    if(!isAvailable) {
      break;
    }
  }
  return isAvailable;
};

export const updateRoomTimeSlot = async (id: number, venueId: string, fromDate: string, toDate: string) => {
  const venueData: any[] = await sp.web.lists.getByTitle("Venue").items.select(
    "Timeslot",
    "VenueId",
  )
  .filter(`VenueId eq ${venueId}`)
  .get();
  
  const venue = venueData[0];
  const timeSlot = JSON.parse(venue.Timeslot) || [];
  timeSlot.push(`${fromDate} ${toDate}`);

  await sp.web.lists.getByTitle('Venue').items.getById(id).update({
    Timeslot: JSON.stringify(timeSlot),
  });
};

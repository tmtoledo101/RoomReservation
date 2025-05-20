
{/*This utility file contains helper functions for email handling, date formatting, 
  and venue availability management in the Resource Reservation System.*/}
  
  import * as moment from "moment";
  import { sp } from "@pnp/sp";
  import { IEmailProperties } from "@pnp/sp/sputilities";
  import "@pnp/sp/sputilities";
  import { MSGraphClient } from "@microsoft/sp-http";
  import { SharePointService } from "../services/SharePointService";
    
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
      console.log("To", emailProps.To);
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
    
  const sendEnhancedEmail = async (context: any, emailProps: IEmailProperties, url:string): Promise<IEmailResult> => {
    try {
      // Validate email properties
      console.log("Processing email data:", emailProps.From);
      const validationError = validateEmailProps(emailProps);
      if (validationError) {
        return {
          success: false,
          error: validationError
        };
      }
  
      const spService = new SharePointService();
      const saved = await spService.saveEmailData(emailProps, url);
  
      if (saved) {
        return { success: true };
      } else {
        return {
          success: false,
          error: "Failed to save email data"
        };
      }
    } catch (error) {
      console.error("Failed to process email:", error);
      return {
        success: false,
        error: error.message || "Failed to process email"
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
    
    export const newResEmail = async (context: any, to: Array<string>, cc: Array<string>, values: any, type: any, facilitiesAvailable: any, siteUrl: string, referenceNo: string, id:string): Promise<IEmailResult> => {
      const toEmail = [...to];
      const ccEmail = cc.filter(email => email && email.trim() !== '');
      const emailProps: IEmailProperties = {
        From : "", // Changed to empty string
        To: toEmail,
        CC: ccEmail,
        Subject: '',
        Body: '',
        AdditionalHeaders: {
          "content-type": "application/json;odata=verbose",
        }
      };
       
    try {
      const rrsConfig = await sp.web.lists.getByTitle("RRSConfig").items.filter("Key eq 'RRSEmailFrom'").select("Value").get();
      if (rrsConfig && rrsConfig.length > 0 && rrsConfig[0].Value) {
        emailProps.From = rrsConfig[0].Value;
      }  
    } catch (error) {
      console.error("Error fetching RRSConfig for email From address:", error);
      return { success: false, error: "Failed to fetch email configuration." };
    }
  
      console.log("siteUrl", siteUrl);
      if(type === 1) {
        emailProps.Subject = `New Room Reservation Request: ${referenceNo}. Date of Use: ${dateFormat(values.fromDate)} to ${dateFormat(values.toDate)}`;
        emailProps.Body= `<b>Request for Use of Resource Reservation System</b><br/><br/>
        New reservation has been requested in Resource Reservation System<br/>
        Please visit the link below to view the document for your appropriate action.<br/><br/>
        Thank you.<br/><br/>
        Reference No. ${referenceNo}<br/>
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
        emailProps.Subject = `Facility In-Charge: Approved Request for Reservation. ${referenceNo}. Date of Use: ${dateFormat(values.fromDate)} to ${dateFormat(values.toDate)}`;
        emailProps.Body= `<b>Request for Use of Facility - Resource Reservation System</b><br/><br/>
        Request for reservation has been approved in the Resource Reservation System<br/>
        Please visit the link below to view the document.<br/><br/>
        Thank you.<br/><br/>
        Reference No. ${referenceNo}<br/><br/>
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
        emailProps.Subject = `Approved Request for Reservation.: ${referenceNo}. Date of Use: ${dateFormat(values["fromDate"])} to ${dateFormat(values["toDate"])}`;
        emailProps.Body = `We are pleased to inform you that your venue reservation request is approved. <br/>
        For further assistance, you may e-mail us at coraoreservations@bsp.gov.ph or call our Events and  
        Visitor Services Pool (EVSP) at local telephone numbers 2559 or 2462.<br/><br/>
        Link: <a href="${siteUrl}/SitePages/DisplayReservation_appge.aspx?pid=${id}">Request url</a>
        `;
      }
    
      if (type === 4) {
        emailProps.Subject = `Approved Request for Reservation.: ${referenceNo}. Date of Use: ${dateFormat(values["fromDate"])} to ${dateFormat(values["toDate"])}`;
        emailProps.Body = `We are pleased to inform you that your venue reservation request is approved. <br/>
        `;
      }
      const url = `${siteUrl}/SitePages/DisplayReservation_appge.aspx?pid=${id}`;
      const result = await sendEnhancedEmail(context, emailProps, url);
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
  
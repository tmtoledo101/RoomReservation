/*This utility file contains helper functions for email handling, date formatting, 
  and venue availability management in the Resource Reservation System.*/
  
  import * as moment from "moment";
  import { sp } from "@pnp/sp";
  import { IEmailProperties } from "@pnp/sp/sputilities";
  import "@pnp/sp/sputilities";
  import { MSGraphClient, HttpClient, AadHttpClient } from "@microsoft/sp-http";
  
  // Define the email method type
  export type EmailMethod = 'graphapi' | 'sharepoint' | 'powerautomate';
  
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
  
  /**
   * Sends an email via Power Automate Flow
   * @param context The SPFx context
   * @param emailProps Email properties
   * @param flowUrl The Power Automate Flow HTTP trigger URL
   * @returns Result of the operation
   */
  const sendEmailViaPowerAutomate = async (context: any, emailProps: IEmailProperties, flowUrl: string): Promise<IEmailResult> => {
    try {
      // Validate email properties
      const validationError = validateEmailProps(emailProps);
      if (validationError) {
        return {
          success: false,
          error: validationError
        };
      }
  
      // Format the data for Power Automate
      const payload = {
        to: emailProps.To,
        cc: emailProps.CC || [],
        subject: emailProps.Subject,
        body: emailProps.Body,
        from: emailProps.From || "",
        additionalHeaders: emailProps.AdditionalHeaders || {},
        // Add user context information that might be needed for authentication
        userEmail: (context.pageContext && context.pageContext.user && context.pageContext.user.email) || "",
        userDisplayName: (context.pageContext && context.pageContext.user && context.pageContext.user.displayName) || "",
        siteUrl: (context.pageContext && context.pageContext.web && context.pageContext.web.absoluteUrl) || ""
      };
  
      console.log("Sending email via Power Automate flow:", flowUrl);
      console.log("Payload:", JSON.stringify(payload, null, 2));
      
      // Try using the Graph API directly
      try {
        console.log("Attempting to send email via Graph API directly");
        
        // Get the Graph client
        const graphClient: MSGraphClient = await context.msGraphClientFactory.getClient();
        console.log("Graph client created successfully");
        
        // Send the email using Graph API
        await graphClient.api(`/users/${emailProps.From}/sendMail`).post({
          message: {
            subject: emailProps.Subject,
            body: {
              contentType: "HTML",
              content: emailProps.Body
            },
            toRecipients: emailProps.To.map(email => ({
              emailAddress: { address: email }
            })),
            ...(emailProps.CC && emailProps.CC.length > 0 ? {
              ccRecipients: emailProps.CC.map(email => ({
                emailAddress: { address: email }
              }))
            } : {})
          },
          saveToSentItems: true
        });
        
        console.log("Email sent successfully via Graph API");
        return { success: true };
      } catch (graphError) {
        console.error("Failed to send email via Graph API, falling back to SharePoint:", graphError);
        
        // Try using SharePoint utility
        try {
          console.log("Attempting to send email via SharePoint utility");
          await sp.utility.sendEmail(emailProps);
          console.log("Email sent successfully via SharePoint utility");
          return { success: true };
        } catch (spError) {
          console.error("Failed to send email via SharePoint utility:", spError);
          
          // Last resort: try using standard HttpClient with the Power Automate flow
          try {
            console.log("Attempting to send email via Power Automate as last resort");
            const httpClient: HttpClient = context.httpClient;
            
            const response = await httpClient.post(
              flowUrl,
              HttpClient.configurations.v1,
              {
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
              }
            );
            
            console.log("HttpClient response status:", response.status);
            
            // Try to parse the response as JSON
            let responseData;
            try {
              responseData = await response.json();
              console.log("HttpClient response data:", responseData);
            } catch (e) {
              // If response is not JSON, get text instead
              const textResponse = await response.text();
              console.log("HttpClient response text:", textResponse);
              responseData = { text: textResponse };
            }
            
            if (response.ok) {
              return { success: true };
            } else {
              console.error("Power Automate error response from HttpClient:", responseData);
              return {
                success: false,
                error: (responseData.error && responseData.error.message) || 
                      (responseData.message) || 
                      `Failed to send email via Power Automate with HttpClient (Status: ${response.status})`
              };
            }
          } catch (httpError) {
            console.error("All email methods failed:", httpError);
            throw httpError;
          }
        }
      }
    } catch (error) {
      console.error("Failed to send email via Power Automate:", error);
      return {
        success: false,
        error: error.message || "Failed to send email via Power Automate"
      };
    }
  };
  
  /**
   * Enhanced email sending function with multiple methods support
   * @param context The SPFx context
   * @param emailProps Email properties 
   * @param method Email sending method - graphapi, sharepoint, or powerautomate
   * @param powerAutomateFlowUrl URL of the Power Automate flow (required if method is powerautomate)
   * @returns Result of the operation
   */
  const sendEnhancedEmail = async (
    context: any, 
    emailProps: IEmailProperties, 
    method: EmailMethod = 'powerautomate',
    powerAutomateFlowUrl?: string
  ): Promise<IEmailResult> => {
    try {
      // Validate email properties
      console.log(`Sending email using method: ${method}`);
      console.log("Email properties:", {
        To: emailProps.To,
        CC: emailProps.CC,
        From: emailProps.From,
        Subject: emailProps.Subject,
        BodyLength: emailProps.Body ? emailProps.Body.length : 0
      });
      
      const validationError = validateEmailProps(emailProps);
      if (validationError) {
        console.error("Email validation error:", validationError);
        return {
          success: false,
          error: validationError
        };
      }
  
      // Use Power Automate if specified
      if (method === 'powerautomate') {
        console.log("PA Flow URL:", powerAutomateFlowUrl);
        if (!powerAutomateFlowUrl) {
          console.error("Power Automate Flow URL is missing");
          return {
            success: false,
            error: "Power Automate Flow URL is required when using Power Automate method"
          };
        }
        
        console.log("Calling sendEmailViaPowerAutomate");
        const result = await sendEmailViaPowerAutomate(context, emailProps, powerAutomateFlowUrl);
        console.log("sendEmailViaPowerAutomate result:", result);
        return result;
      }
  
      // For other methods, use existing code
      if (method === 'graphapi' && emailProps.From) {
        try {
          // Send using Microsoft Graph API
          console.log("Sending email via Graph API");
          const graphClient: MSGraphClient = await context.msGraphClientFactory.getClient();
          await graphClient.api(`/users/${emailProps.From}/sendMail`).post({
            message: {
              subject: emailProps.Subject,
              body: {
                contentType: "HTML",
                content: emailProps.Body
              },
              toRecipients: emailProps.To.map(email => ({
                emailAddress: { address: email }
              })),
              ...(emailProps.CC && emailProps.CC.length > 0 ? {
                ccRecipients: emailProps.CC.map(email => ({
                  emailAddress: { address: email }
                }))
              } : {})
            },
            saveToSentItems: true
          });
          return { success: true };
        } catch (error) {
          // If method is explicitly graphapi, don't fall back
          if (method === 'graphapi') {
            console.error("Failed to send email via Graph API:", error);
            return {
              success: false,
              error: error.message || "Failed to send email via Graph API"
            };
          }
          
          // Otherwise, fall back to SharePoint
          console.warn("Falling back to SharePoint email service");
          await sp.utility.sendEmail(emailProps);
          return { 
            success: true,
            error: "Used fallback SharePoint email service" 
          };
        }
      } else {
        // Use SharePoint service
        console.log("Sending email via SharePoint utility");
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
  
  /**
   * Sends a reservation email with support for multiple sending methods
   * @param context The SPFx context
   * @param to Recipient email addresses
   * @param cc CC email addresses
   * @param values Reservation values
   * @param type Email type (1-4)
   * @param facilitiesAvailable Available facilities
   * @param siteUrl SharePoint site URL
   * @param id Reservation ID
   * @param method Email sending method (graphapi, sharepoint, powerautomate)
   * @param powerAutomateFlowUrl URL of the Power Automate flow (required if method is powerautomate)
   * @returns Result of the operation
   */
  export const newResEmail = async (
    context: any, 
    to: Array<string>, 
    cc: Array<string>, 
    values: any, 
    type: any, 
    facilitiesAvailable: any, 
    siteUrl: string, 
    id: string,
    method: EmailMethod = 'powerautomate',
    powerAutomateFlowUrl?: string
  ): Promise<IEmailResult> => {
    console.log("Starting newResEmail with parameters:", {
      to,
      cc,
      type,
      id,
      method,
      powerAutomateFlowUrl
    });
    
    const toEmail = [...to];
    const ccEmail = [...cc];
    const emailProps: IEmailProperties = {
      //From : "TDO365ASMEDEV1_SYS@bsp.gov.ph",
      From: "tmtoledo@s5b36.onmicrosoft.com",
      To: toEmail,
      CC: ccEmail,
      Subject: '',
      Body: '',
      AdditionalHeaders: {
        "content-type": "application/json;odata=verbose",
      }
    };
     
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
  
    // Pass the method and flow URL to sendEnhancedEmail
    // Use the provided powerAutomateFlowUrl parameter if available, otherwise use the default URL
    const flowUrl = powerAutomateFlowUrl || 'https://prod-46.southeastasia.logic.azure.com:443/workflows/38186fb1e49647ef83b68d08bfc08f6a/triggers/manual/paths/invoke?api-version=2016-06-01';
    console.log("Using Power Automate flow URL:", flowUrl);
    console.log("Make sure this flow is configured to use OAuth authentication and has proper permissions");
    
    const result = await sendEnhancedEmail(context, emailProps, method, flowUrl);
    if (!result.success) {
      console.error("Failed to send reservation email:", result.error);
    } else {
      console.log("Successfully sent reservation email");
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

/**
 * helpers.ts:
 *
 * This file provides helper functions for the ResDisplay components, including functions for validating date and time,
 * formatting dates, and mapping arrays to objects and dropdown values.
 */

import * as moment from "moment";
import { sp } from "@pnp/sp";
import { IEmailProperties } from "@pnp/sp/sputilities";
import "@pnp/sp/sputilities";
import { IDropdownItem } from "../interfaces/IResDisplay";

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

const sendEnhancedEmail = async (context: any, emailProps: IEmailProperties, url: string): Promise<IEmailResult> => {
  try {
    // Validate email properties
    const validationError = validateEmailProps(emailProps);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    // Save email data to EmailDataForPA list for Power Automate
    try {
      // Extract reference number from subject
      const refNoMatch = emailProps.Subject.match(/(?:Request:|No\|:)\s*([^.]+)/);
      const referenceNo = refNoMatch ? refNoMatch[1].trim() : '';

      await sp.web.lists.getByTitle("EmailDataForPA").items.add({
        ReferenceNo: referenceNo,
        To: emailProps.To ? [...new Set(emailProps.To)].join(';') : '',
        CC: emailProps.CC ? [...new Set(emailProps.CC)].join(';') : '',
        SendAsFrom: emailProps.From,
        Subject: emailProps.Subject,
        Body: emailProps.Body,
        RecordUrl: url
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to save email data:", error);
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

export const validateDateTime = (startDateTime: string, endDateTime: string): boolean =>
  startDateTime &&
  moment(startDateTime).isValid() &&
  endDateTime &&
  moment(endDateTime).isValid() &&
  moment(endDateTime).isAfter(startDateTime);

export const dateFormat = (date: string): string => {
  return moment(date).format("MM/DD/yyyy HH:mm");
};

export const mapArrayToObject = (obj: { [key: string]: any }): IDropdownItem[] =>
  Object.keys(obj).map((item) => {
    return { id: item, value: item };
  });

export const arrayToDropDownValues = (array: string[]): IDropdownItem[] =>
  array.map((item) => ({ id: item, value: item }));

export const sendCancellationEmail = async (context: any, to: Array<string>, cc: Array<string>, values: any, siteUrl: string, referenceNo: string, id: string): Promise<IEmailResult> => {
  const toEmail = [...to];
  const ccEmail = cc.filter(email => email && email.trim() !== '');
  const emailProps: IEmailProperties = {
    From: "", // Will be set from RRSConfig
    To: toEmail,
    CC: ccEmail,
    Subject: '',
    Body: '',
    AdditionalHeaders: {
      "content-type": "application/json;odata=verbose",
    }
  };

  try {
    // Get email From address from configuration
    console.log("Fetching RRSConfig for email From address...");
    const rrsConfig = await sp.web.lists.getByTitle("RRSConfig").items.filter("Key eq 'RRSEmailFrom'").select("Value").get();
    if (rrsConfig && rrsConfig.length > 0 && rrsConfig[0].Value) {
      emailProps.From = rrsConfig[0].Value;
    }
  } catch (error) {
    console.error("Error fetching RRSConfig for email From address:", error);
    return { success: false, error: "Failed to fetch email configuration." };
  }

  // Set email subject and body for cancellation
  emailProps.Subject = `Cancelled Room Reservation Request: ${referenceNo}. Date of Use: ${dateFormat(values.fromDate)} to ${dateFormat(values.toDate)}`;
  emailProps.Body = `<b>Room Reservation Request Cancelled</b><br/><br/>
  Your room reservation request has been cancelled in the Resource Reservation System.<br/>
  Please visit the link below to view the document for details.<br/><br/>
  Thank you.<br/><br/>
  Reference No. ${referenceNo}<br/>
  Date of Use: ${dateFormat(values.fromDate)} To ${dateFormat(values.toDate)}<br/><br/>
  Venue: ${values.venue}<br/><br/>
  Requestor: ${values.requestedBy}<br/>
  Department: ${values.department}<br/><br/>
  Principal User: ${values.principal}<br/><br/>
  Contact Person: ${values.contactPerson}<br/>
  Contact No: ${values.contactNumber}<br/><br/>
  Participants: ${values.participants ? values.participants.join(' , ') : ''}<br/>
  Purpose of Use: ${values.purposeOfUse}<br/>
  Title Description: ${values.titleDesc}<br/>
  No. of Participants: ${values.numberOfParticipant}<br/><br/>
  `;

  const url = `${siteUrl}/SitePages/DisplayReservation_appge.aspx?pid=${id}`;
  const result = await sendEnhancedEmail(context, emailProps, url);
  if (!result.success) {
    console.error("Failed to send cancellation email:", result.error);
  }
  return result;
};

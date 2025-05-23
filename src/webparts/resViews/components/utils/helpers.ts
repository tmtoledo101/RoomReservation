/*The helpers.ts file contains utility functions for date formatting, validation, and conversion used throughout the resView wepart.
*/
import * as moment from "moment";
import { sp } from "@pnp/sp";
import "@pnp/sp/sputilities";
import { IEmailProperties } from "@pnp/sp/sputilities";
import { STATUS } from "../interfaces/IResViews";
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

export const formatDateForInput = (dateString: string): string => {
  return moment(dateString).format("YYYY-MM-DDTHH:mm");
};

export const formatDate = (dateString: string): string => {
  return moment(dateString).format("MM/DD/YYYY hh:mm A");
};

export const validateDateTime = (fromDate: Date, toDate: Date): boolean => {
  return moment(toDate).isSameOrAfter(moment(fromDate));
};

export const dateConverter = (date: string, type: number): string => {
  const dateObj = new Date(date);
  if (type === 1) {
    dateObj.setHours(0, 0, 0);
  } else {
    dateObj.setHours(23, 59, 59);
  }
  return dateObj.toISOString();
};


export const validateDateTime_ = (startDateTime: Date | null, endDateTime: Date | null): boolean =>
  startDateTime &&
  moment(startDateTime).isValid() &&
  endDateTime &&
  moment(endDateTime).isValid() &&
  moment(endDateTime).isAfter(startDateTime);

export const validateDateRange = (startDate: Date | null, endDate: Date | null): boolean => {
  if (!startDate || !endDate) return true;
  const start = moment(startDate);
  const end = moment(endDate);
  const monthsDiff = end.diff(start, 'months', true);
  return monthsDiff <= 3;
};

export const dateFormat = (date: any): string => {
  return moment(date).format("MM/DD/yyyy HH:mm");
};

export const newResEmail = async (context: any, to: Array<string>, cc: Array<string>, values: any, type: string, siteUrl: string, id: number, refNo:string): Promise<IEmailResult> => {
  let toEmail = ['tmtoledo@kpmg.com',...to];
  let ccEmail = [...cc];
  let emailProps: IEmailProperties = {
    From: "",
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

  if (type === STATUS.APPROVED) {
    emailProps.Subject = `Approved Request for Reservation.: ${refNo}. Date of Use: ${dateFormat(values["fromDate"])} to ${dateFormat(values["toDate"])}`;
    emailProps.Body = `We are pleased to inform you that your venue reservation request is approved. <br/>
    For further assistance, you may e-mail us at coraoreservations@bsp.gov.ph or call our Events and  
    Visitor Services Pool (EVSP) at local telephone numbers 2559 or 2462.<br/><br/>`;
  }
  if (type === STATUS.DISAPPROVED) {
    emailProps.Subject = `Disapproved Request for Reservation.: ${refNo}. Date of Use: ${dateFormat(values["fromDate"])} to ${dateFormat(values["toDate"])}`;
    emailProps.Body = `We regret to inform you that your venue reservation request is disapproved. 
    For further clarifications, you may e-mail us at coraoreservations@bsp.gov.ph or call our
     Events and Visitor Services Pool (EVSP) at local telephone numbers 2559 or 2462.<br/><br/>`;
  }
  if (type === STATUS.CANCELLED) {
    emailProps.Subject = `Cancelled Request for Reservation.: ${refNo}. Date of Use: ${dateFormat(values["fromDate"])} to ${dateFormat(values["toDate"])}`;
    emailProps.Body = `We are pleased to inform you that your venue reservation request is cancelled. 
    For further clarifications, you may e-mail us at fosd-fpad@bsp.gov.ph or call local numbers 2578/2392.<br/><br/>`;
  }

  const url = `${siteUrl}/SitePages/DisplayReservation_appge.aspx?pid=${id}`;
  return await sendEnhancedEmail(context, emailProps, url);
};

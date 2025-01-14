import * as React from 'react';
import { ISendEmailProps } from './ISendEmailProps';
import { MSGraphClient } from "@microsoft/sp-http";
import { Button } from "@material-ui/core";

export default function SendEmail(props: ISendEmailProps): JSX.Element {
  const [previewMode, setPreviewMode] = React.useState(true);
  const [emailPreview, setEmailPreview] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");
  const [currentUser, setCurrentUser] = React.useState<string>("");

  // Get current user's email when component mounts
  React.useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const graphClient: MSGraphClient = await props.context.msGraphClientFactory.getClient();
        const user = await graphClient.api('/me').get();
        setCurrentUser(user.userPrincipalName);
      } catch (error) {
        console.error("Failed to get current user:", error);
        setError("Failed to get current user information. Please ensure you are logged in.");
      }
    };
    getCurrentUser();
  }, []);

  const sendEmail = async (): Promise<void> => {
    setError(""); // Clear any previous errors
    
    try {
      if (previewMode) {
        // In preview mode, just show what would be sent
        const previewContent = {
          from: currentUser,
          to: "tmtoledo@kpmg.com",
          subject: "Hello from SendEmail Webpart",
          body: "Hello, World!"
        };
        setEmailPreview(JSON.stringify(previewContent, null, 2));
        return;
      }

      const graphClient: MSGraphClient = await props.context.msGraphClientFactory.getClient();
      
      // First try with /me endpoint
      try {
        await graphClient.api('/me/sendMail').post({
          message: {
            subject: "Hello from SendEmail Webpart",
            body: {
              contentType: "HTML",
              content: "Hello, World!"
            },
            toRecipients: [{
              emailAddress: {
                address: "tmtoledo@kpmg.com"
              }
            }],
            from: {
              emailAddress: {
                address: currentUser
              }
            }
          },
          saveToSentItems: true
        });
      } catch (error) {
        // If /me endpoint fails, try with /users endpoint
        console.log("Falling back to /users endpoint...");
        await graphClient.api(`/users/${currentUser}/sendMail`).post({
          message: {
            subject: "Hello from SendEmail Webpart",
            body: {
              contentType: "HTML",
              content: "Hello, World!"
            },
            toRecipients: [{
              emailAddress: {
                address: "tmtoledo@kpmg.com"
              }
            }]
          },
          saveToSentItems: true
        });
      }

      alert('Email sent successfully!');
    } catch (error) {
      console.error("Failed to send email:", error);
      let errorMessage = "An error occurred while sending the email. ";
      
      if (error.message.includes("Access denied")) {
        errorMessage += `
          The system is not allowing emails from this location. This could be due to:
          1. IP restrictions in your Microsoft 365 tenant
          2. Conditional Access policies
          3. Exchange Online Protection settings
          
          Please contact your administrator to:
          - Check Exchange Online Protection settings
          - Verify Conditional Access policies
          - Review IP restrictions for email sending
          - Ensure the account has proper Exchange Online licenses`;
      } else if (error.message.includes("Token request")) {
        errorMessage += "Please ensure you are logged in to SharePoint and try again. If the issue persists, you may need to refresh the page.";
      } else if (error.message.includes("permission")) {
        errorMessage += "You may not have the required permissions. Please contact your administrator.";
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Send Test Email</h2>
      {currentUser && (
        <p>Logged in as: {currentUser}</p>
      )}
      <p>Click the button below to {previewMode ? 'preview' : 'send'} an email to tmtoledo@kpmg.com</p>
      
      <div style={{ marginBottom: '20px' }}>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => setPreviewMode(!previewMode)}
          style={{ marginRight: '10px' }}
        >
          {previewMode ? "Switch to Send Mode" : "Switch to Preview Mode"}
        </Button>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={sendEmail}
          disabled={!currentUser}
        >
          {previewMode ? "Preview Email" : "Send Email"}
        </Button>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '15px', 
          borderRadius: '4px',
          marginBottom: '20px',
          whiteSpace: 'pre-line'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {previewMode && emailPreview && (
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '4px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap'
        }}>
          <h3>Email Preview:</h3>
          {emailPreview}
        </div>
      )}

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '4px' 
      }}>
        <h3>Important Notes:</h3>
        <ul>
          <li>Emails will be sent from your current logged-in account ({currentUser || 'Not logged in'})</li>
          <li>Make sure you have the necessary Exchange Online licenses</li>
          <li>If you encounter IP restrictions, contact your administrator</li>
          <li>Use Preview mode to test without sending actual emails</li>
        </ul>
      </div>
    </div>
  );
}

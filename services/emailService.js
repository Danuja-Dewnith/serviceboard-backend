const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Email templates
const getAcceptJobEmailTemplate = (
  homeownerName,
  providerName,
  jobTitle,
  jobId,
) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    subject: `✅ Your job "${jobTitle}" has been accepted!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Job Accepted</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #ffffff; padding: 30px 25px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px; }
          .job-details { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1d4ed8; }
          .button { display: inline-block; background: #1d4ed8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; margin-top: 20px; }
          .highlight { color: #1d4ed8; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Job Accepted!</h1>
            <p>ServiceBoard</p>
          </div>
          <div class="content">
            <h2>Hello ${homeownerName},</h2>
            <p>Good news! A service provider has accepted your job request.</p>
            
            <div class="job-details">
              <p><strong>👤 Provider:</strong> ${providerName}</p>
              <p><strong>📋 Job Title:</strong> ${jobTitle}</p>
              <p><strong>📅 Status:</strong> <span class="highlight">In Progress</span></p>
            </div>
            
            <p>The provider has reviewed your requirements and is ready to start working on your project.</p>
            
            <div style="text-align: center;">
              <a href="${appUrl}/job/${jobId}" class="button">View Job Details</a>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Communicate with the provider through the platform</li>
              <li>Confirm the timeline and specific requirements</li>
              <li>Track the progress of your job</li>
              <li>Release payment when work is completed</li>
            </ul>
            
            <p>Best regards,<br><strong>ServiceBoard Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2026 ServiceBoard. All rights reserved.</p>
            <p>Connecting homeowners with trusted service providers</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${homeownerName},
      
      Good news! ${providerName} has accepted your job request "${jobTitle}".
      
      The provider is ready to start working on your project. You can view the job details and communicate with them through the platform.
      
      View your job: ${appUrl}/job/${jobId}
      
      Next steps:
      - Communicate with the provider
      - Confirm timeline and requirements
      - Track job progress
      - Release payment when completed
      
      Best regards,
      ServiceBoard Team
    `,
  };
};

const getJobCompletedEmailTemplate = (
  homeownerName,
  providerName,
  jobTitle,
  jobId,
) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    subject: `✅ Job "${jobTitle}" has been completed!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Job Completed</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Job Completed!</h1>
          </div>
          <div class="content">
            <h2>Hello ${homeownerName},</h2>
            <p>${providerName} has marked your job "${jobTitle}" as completed.</p>
            <p>Please review the work and release the payment if you're satisfied.</p>
            <div style="text-align: center;">
              <a href="${appUrl}/job/${jobId}" class="button">Review Job</a>
            </div>
            <p>Thank you for using ServiceBoard!</p>
          </div>
          <div class="footer">© 2026 ServiceBoard. All rights reserved.</div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${homeownerName},
      
      ${providerName} has completed your job "${jobTitle}".
      
      Please review the work and release the payment.
      
      View job: ${appUrl}/job/${jobId}
      
      Thank you for using ServiceBoard!
    `,
  };
};

// Send email function
const sendEmail = async (to, subject, html, text) => {
  try {
    const info = await transporter.sendMail({
      from: `"ServiceBoard" <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
    });
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

// Send job acceptance notification
const sendJobAcceptanceEmail = async (
  homeownerEmail,
  homeownerName,
  providerName,
  jobTitle,
  jobId,
) => {
  const { subject, html, text } = getAcceptJobEmailTemplate(
    homeownerName,
    providerName,
    jobTitle,
    jobId,
  );
  return await sendEmail(homeownerEmail, subject, html, text);
};

// Send job completion notification
const sendJobCompletionEmail = async (
  homeownerEmail,
  homeownerName,
  providerName,
  jobTitle,
  jobId,
) => {
  const { subject, html, text } = getJobCompletedEmailTemplate(
    homeownerName,
    providerName,
    jobTitle,
    jobId,
  );
  return await sendEmail(homeownerEmail, subject, html, text);
};

module.exports = {
  sendJobAcceptanceEmail,
  sendJobCompletionEmail,
};

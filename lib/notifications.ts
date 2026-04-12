import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const CLINIC_NAME = "Kalinga-ni Clinic";
const DEV_TO_EMAIL = process.env.RESEND_DEV_TO_EMAIL;

function resolveRecipient(email: string) {
  return process.env.NODE_ENV !== "production" && DEV_TO_EMAIL
    ? DEV_TO_EMAIL
    : email;
}

// FIX: Always explicitly pass timeZone: 'Asia/Manila' so that when this code
// runs on the server (which defaults to UTC), dates are formatted in PHT
// instead of showing the raw UTC time.
function formatDate(date: Date) {
  return date.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ── Email Templates ──────────────────────────────────────────────────────────

function build24hEmail(patientName: string, staffName: string, appointmentDate: Date, reason: string) {
  const date = formatDate(appointmentDate);
  const time = formatTime(appointmentDate);

  return {
    subject: `Reminder: Your appointment is tomorrow – ${date}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #0f766e; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">${CLINIC_NAME}</h1>
        </div>
        <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; margin-top: 0;">Hi <strong>${patientName}</strong>,</p>
          <p style="font-size: 15px; color: #374151;">
            This is a friendly reminder that you have an appointment <strong>tomorrow</strong>.
          </p>

          <div style="background: white; border: 1px solid #d1fae5; border-left: 4px solid #0f766e; border-radius: 6px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Appointment Details</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-size: 14px; width: 100px;">Date</td>
                <td style="padding: 6px 0; font-size: 14px; font-weight: 600;">${date}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Time</td>
                <td style="padding: 6px 0; font-size: 14px; font-weight: 600;">${time}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Doctor</td>
                <td style="padding: 6px 0; font-size: 14px; font-weight: 600;">${staffName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Reason</td>
                <td style="padding: 6px 0; font-size: 14px;">${reason}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            Please arrive on time. If you need to cancel or reschedule, please do so as soon as possible through the patient portal.
          </p>
          <p style="font-size: 14px; color: #374151;">See you tomorrow!</p>
          <p style="font-size: 14px; color: #374151; margin-bottom: 0;">– The ${CLINIC_NAME} Team</p>
        </div>
      </div>
    `,
  };
}

function build1hEmail(patientName: string, staffName: string, appointmentDate: Date, reason: string) {
  const date = formatDate(appointmentDate);
  const time = formatTime(appointmentDate);

  return {
    subject: `Your appointment is in 1 hour – ${time}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #0f766e; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">${CLINIC_NAME}</h1>
        </div>
        <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; margin-top: 0;">Hi <strong>${patientName}</strong>,</p>
          <p style="font-size: 15px; color: #374151;">
            Your appointment is coming up in <strong>about 1 hour</strong>. Please make your way to the clinic soon.
          </p>

          <div style="background: white; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Appointment Details</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-size: 14px; width: 100px;">Date</td>
                <td style="padding: 6px 0; font-size: 14px; font-weight: 600;">${date}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Time</td>
                <td style="padding: 6px 0; font-size: 14px; font-weight: 600;">${time}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Doctor</td>
                <td style="padding: 6px 0; font-size: 14px; font-weight: 600;">${staffName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Reason</td>
                <td style="padding: 6px 0; font-size: 14px;">${reason}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            We look forward to seeing you shortly!
          </p>
          <p style="font-size: 14px; color: #374151; margin-bottom: 0;">– The ${CLINIC_NAME} Team</p>
        </div>
      </div>
    `,
  };
}

// ── Send Functions ───────────────────────────────────────────────────────────

export async function send24hReminder({
  toEmail,
  patientName,
  staffName,
  appointmentDate,
  reason,
}: {
  toEmail: string;
  patientName: string;
  staffName: string;
  appointmentDate: Date;
  reason: string;
}) {
  const { subject, html } = build24hEmail(patientName, staffName, appointmentDate, reason);
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(toEmail),
    subject,
    html,
  });

  if (error) throw new Error(`Resend error (24h): ${error.message}`);
  return data;
}

export async function send1hReminder({
  toEmail,
  patientName,
  staffName,
  appointmentDate,
  reason,
}: {
  toEmail: string;
  patientName: string;
  staffName: string;
  appointmentDate: Date;
  reason: string;
}) {
  const { subject, html } = build1hEmail(patientName, staffName, appointmentDate, reason);
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: resolveRecipient(toEmail),
    subject,
    html,
  });

  if (error) throw new Error(`Resend error (1h): ${error.message}`);
  return data;
}
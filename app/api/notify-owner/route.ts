import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const OWNER_EMAIL = 'prashantgadwe142006@gmail.com';

// GET diagnostic endpoint for checking Resend configuration status
export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Luminous Dental <onboarding@resend.dev>';
  
  return NextResponse.json({
    status: 'ok',
    hasResendApiKey: Boolean(apiKey && apiKey.trim().length > 0),
    resendApiKeyPrefix: apiKey ? `${apiKey.substring(0, 6)}...` : 'not_set',
    ownerEmail: OWNER_EMAIL,
    fromEmail: fromEmail,
    hint: !apiKey
      ? 'RESEND_API_KEY is not configured in environment variables. Please add RESEND_API_KEY to Vercel Project Settings -> Environment Variables or .env.local.'
      : 'API key is configured. If using free Resend tier (onboarding@resend.dev), emails can only be delivered to your registered Resend email address unless domain is verified.'
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      patientName,
      phone,
      treatment,
      date,
      time,
      bookingRef,
      notes,
      bookingTimestamp,
    } = body;

    if (!patientName || !phone || !treatment || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required booking details (patientName, phone, treatment, date, time)' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const formattedTimestamp = bookingTimestamp
      ? new Date(bookingTimestamp).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short',
        });

    const subject = `🚨 New Appointment Booking: ${patientName} - ${treatment}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Appointment Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e1e8e7;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #2F3E3C 0%, #1e2927 100%); padding: 24px 32px; color: #ffffff;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #8ee0d5; font-weight: 700; margin-bottom: 6px;">
        Dental Clinic Management • Alert
      </div>
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; line-height: 1.4;">
        🚨 New Appointment Booking Received
      </h1>
      ${bookingRef ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #d1dedc;">Reference: <strong style="color: #ffffff; font-family: monospace;">${bookingRef}</strong></p>` : ''}
    </div>

    <!-- Body Content -->
    <div style="padding: 28px 32px;">
      <p style="margin-top: 0; margin-bottom: 20px; font-size: 15px; color: #374151; line-height: 1.5;">
        A new patient booking has been successfully recorded in the database. Please find the appointment details below:
      </p>

      <!-- Details Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
        <tbody>
          <tr style="border-bottom: 1px solid #eef2f2;">
            <td style="padding: 12px 14px; font-weight: 600; color: #2F3E3C; width: 35%; background-color: #f9fbfa;">Patient Name</td>
            <td style="padding: 12px 14px; color: #111827; font-weight: 500;">${patientName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eef2f2;">
            <td style="padding: 12px 14px; font-weight: 600; color: #2F3E3C; background-color: #f9fbfa;">Mobile Number</td>
            <td style="padding: 12px 14px; color: #111827;">
              <a href="tel:${phone}" style="color: #0f766e; text-decoration: none; font-weight: 600;">${phone}</a>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #eef2f2;">
            <td style="padding: 12px 14px; font-weight: 600; color: #2F3E3C; background-color: #f9fbfa;">Selected Treatment</td>
            <td style="padding: 12px 14px; color: #111827; font-weight: 600; color: #2F3E3C;">${treatment}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eef2f2;">
            <td style="padding: 12px 14px; font-weight: 600; color: #2F3E3C; background-color: #f9fbfa;">Appointment Date</td>
            <td style="padding: 12px 14px; color: #111827;">${date}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eef2f2;">
            <td style="padding: 12px 14px; font-weight: 600; color: #2F3E3C; background-color: #f9fbfa;">Time Slot</td>
            <td style="padding: 12px 14px; color: #111827; font-weight: 500;">${time}</td>
          </tr>
          ${notes ? `
          <tr style="border-bottom: 1px solid #eef2f2;">
            <td style="padding: 12px 14px; font-weight: 600; color: #2F3E3C; background-color: #f9fbfa;">Patient Notes</td>
            <td style="padding: 12px 14px; color: #4b5563;">${notes}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 12px 14px; font-weight: 600; color: #2F3E3C; background-color: #f9fbfa;">Booking Timestamp</td>
            <td style="padding: 12px 14px; color: #6b7280; font-size: 13px;">${formattedTimestamp}</td>
          </tr>
        </tbody>
      </table>

      <!-- WhatsApp quick action button -->
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #166534; font-weight: 600;">
          📲 Quick Action for Clinic Receptionist / Owner:
        </p>
        <a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(patientName)}%2C%20we%20have%20received%20your%20appointment%20request%20for%20${encodeURIComponent(treatment)}%20on%20${encodeURIComponent(date)}%20at%20${encodeURIComponent(time)}." 
           style="display: inline-block; background-color: #16a34a; color: #ffffff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">
          Message Patient on WhatsApp
        </a>
      </div>

      <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
        *Note: This is an automated internal notification intended strictly for the clinic owner and reception. No email was sent to the patient.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fbfa; padding: 16px 32px; border-top: 1px solid #eef2f2; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #6b7280;">
        Luminous Dental Clinic Management System
      </p>
    </div>

  </div>
</body>
</html>
    `;

    if (!apiKey) {
      console.warn(
        '⚠️ RESEND_API_KEY environment variable is not set. Simulated sending email to owner:',
        OWNER_EMAIL,
        { patientName, phone, treatment, date, time }
      );
      return NextResponse.json({
        success: true,
        simulated: true,
        message: 'Email notification logged (RESEND_API_KEY missing in environment)',
      });
    }

    const resend = new Resend(apiKey);
    const { data: resendData, error: resendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Luminous Dental <onboarding@resend.dev>',
      to: [OWNER_EMAIL],
      subject,
      html: htmlContent,
    });

    if (resendError) {
      console.error('Resend email error:', resendError);
      return NextResponse.json(
        { error: 'Failed to send notification email', details: resendError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resendData,
      message: 'Owner notification email sent successfully',
    });
  } catch (error: any) {
    console.error('Error in /api/notify-owner:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

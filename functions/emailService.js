/**
 * Email Service for Thomas Samuel Media
 * Sends branded booking confirmation emails using Firebase Admin SDK + nodemailer
 */

const nodemailer = require("nodemailer");

// ─── Brand Configuration ────────────────────────────────────────────────────
const BRAND = {
    name: "Thomas Samuel Media",
    email: "thomassamuelmedia@gmail.com",
    website: "https://www.thomassamuelmedia.com",
    logoUrl: "https://www.thomassamuelmedia.com/logos/Whitelogo-nobackground.png",
    primaryColor: "#cbb26a",     // Gold
    secondaryColor: "#1a1a1a",   // Dark background
    textColor: "#e0e0e0",        // Light text
    accentColor: "#b8972e",      // Darker gold
};

// ─── Create Transporter ─────────────────────────────────────────────────────
let transporter = null;

function getTransporter() {
    if (!transporter) {
        const gmailUser = process.env.GMAIL_USER || BRAND.email;
        const gmailPass = process.env.GMAIL_APP_PASSWORD;

        if (!gmailPass) {
            console.warn("⚠️ GMAIL_APP_PASSWORD not set — emails will not be sent.");
            return null;
        }

        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: gmailUser,
                pass: gmailPass,
            },
        });
    }
    return transporter;
}

// ─── Format Helpers ─────────────────────────────────────────────────────────
function formatCurrency(cents) {
    return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateValue) {
    if (!dateValue) return "TBD";
    let date;
    if (dateValue._seconds) {
        date = new Date(dateValue._seconds * 1000);
    } else if (dateValue.toDate) {
        date = dateValue.toDate();
    } else {
        date = new Date(dateValue);
    }
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function formatTime(dateValue) {
    if (!dateValue) return "TBD";
    let date;
    if (dateValue._seconds) {
        date = new Date(dateValue._seconds * 1000);
    } else if (dateValue.toDate) {
        date = dateValue.toDate();
    } else {
        date = new Date(dateValue);
    }
    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Los_Angeles",
    });
}

// ─── Build Confirmation Email HTML ──────────────────────────────────────────
function buildConfirmationEmail(booking, paymentAmount, paymentOption) {
    const addonsHtml = booking.addons && booking.addons.length > 0
        ? booking.addons.map(a => `
            <tr>
                <td style="padding: 8px 0; color: ${BRAND.textColor}; border-bottom: 1px solid #333;">
                    ${a.name}
                </td>
                <td style="padding: 8px 0; color: ${BRAND.primaryColor}; text-align: right; border-bottom: 1px solid #333;">
                    ${formatCurrency(a.price * 100)}
                </td>
            </tr>
        `).join("")
        : "";

    const paymentLabel = paymentOption === "deposit" ? "Deposit Paid" : "Paid in Full";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation — ${BRAND.name}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d0d0d; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0d0d0d;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

                    <!-- Header with Logo -->
                    <tr>
                        <td align="center" style="padding: 30px 40px; background-color: ${BRAND.secondaryColor}; border-radius: 16px 16px 0 0; border-bottom: 3px solid ${BRAND.primaryColor};">
                            <img src="${BRAND.logoUrl}" alt="${BRAND.name}" width="180" style="display: block; max-width: 180px; height: auto;" />
                        </td>
                    </tr>

                    <!-- Confirmation Banner -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px; background-color: ${BRAND.secondaryColor};">
                            <div style="width: 64px; height: 64px; background-color: rgba(203, 178, 106, 0.15); border-radius: 50%; display: inline-block; line-height: 64px; text-align: center; margin-bottom: 16px;">
                                <span style="font-size: 32px;">&#10003;</span>
                            </div>
                            <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: ${BRAND.primaryColor}; letter-spacing: 0.5px;">
                                Booking Confirmed
                            </h1>
                            <p style="margin: 0; font-size: 16px; color: #999;">
                                Thank you for choosing ${BRAND.name}
                            </p>
                        </td>
                    </tr>

                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 10px 40px 30px; background-color: ${BRAND.secondaryColor};">
                            <p style="margin: 0; font-size: 16px; color: ${BRAND.textColor}; line-height: 1.6;">
                                Hi <strong style="color: #fff;">${booking.clientName || "there"}</strong>,
                            </p>
                            <p style="margin: 12px 0 0; font-size: 16px; color: ${BRAND.textColor}; line-height: 1.6;">
                                Your shoot has been confirmed and added to our calendar. Here are the details of your upcoming session:
                            </p>
                        </td>
                    </tr>

                    <!-- Booking Details Card -->
                    <tr>
                        <td style="padding: 0 40px 30px; background-color: ${BRAND.secondaryColor};">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #222; border-radius: 12px; border: 1px solid #333;">
                                <!-- Package -->
                                <tr>
                                    <td style="padding: 20px 24px 12px;">
                                        <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Package</p>
                                        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #fff;">${booking.serviceName || "Studio Session"}</p>
                                    </td>
                                </tr>
                                <!-- Date & Time -->
                                <tr>
                                    <td style="padding: 12px 24px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="50%" style="vertical-align: top;">
                                                    <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Date</p>
                                                    <p style="margin: 0; font-size: 16px; color: #fff;">${formatDate(booking.dateTime?.start)}</p>
                                                </td>
                                                <td width="50%" style="vertical-align: top;">
                                                    <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Time</p>
                                                    <p style="margin: 0; font-size: 16px; color: #fff;">
                                                        ${formatTime(booking.dateTime?.start)}${booking.dateTime?.end ? " — " + formatTime(booking.dateTime.end) : ""}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <!-- Location -->
                                <tr>
                                    <td style="padding: 12px 24px ${booking.location?.notes ? '4px' : '20px'};">
                                        <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Location</p>
                                        <p style="margin: 0; font-size: 16px; color: #fff;">${booking.location?.address || "To be confirmed"}</p>
                                    </td>
                                </tr>
                                ${booking.location?.notes ? `
                                <tr>
                                    <td style="padding: 4px 24px 20px;">
                                        <p style="margin: 0; font-size: 14px; color: #999; font-style: italic;">${booking.location.notes}</p>
                                    </td>
                                </tr>
                                ` : ""}
                            </table>
                        </td>
                    </tr>

                    <!-- Payment Summary -->
                    <tr>
                        <td style="padding: 0 40px 30px; background-color: ${BRAND.secondaryColor};">
                            <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #fff;">Payment Summary</h2>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #222; border-radius: 12px; border: 1px solid #333; padding: 20px 24px;">
                                <tr>
                                    <td style="padding: 12px 24px 8px; color: ${BRAND.textColor}; border-bottom: 1px solid #333;">
                                        ${booking.serviceName || "Package"}
                                    </td>
                                    <td style="padding: 12px 24px 8px; color: ${BRAND.primaryColor}; text-align: right; border-bottom: 1px solid #333;">
                                        ${formatCurrency(booking.pricing?.subtotal || 0)}
                                    </td>
                                </tr>
                                ${addonsHtml}
                                ${booking.pricing?.travelFee > 0 ? `
                                <tr>
                                    <td style="padding: 8px 24px; color: ${BRAND.textColor}; border-bottom: 1px solid #333;">
                                        Travel Fee
                                    </td>
                                    <td style="padding: 8px 24px; color: ${BRAND.primaryColor}; text-align: right; border-bottom: 1px solid #333;">
                                        ${formatCurrency(booking.pricing.travelFee)}
                                    </td>
                                </tr>
                                ` : ""}
                                <tr>
                                    <td style="padding: 16px 24px 8px; font-weight: 700; color: #fff; font-size: 16px;">
                                        Total
                                    </td>
                                    <td style="padding: 16px 24px 8px; font-weight: 700; color: ${BRAND.primaryColor}; text-align: right; font-size: 16px;">
                                        ${formatCurrency(booking.pricing?.total || paymentAmount || 0)}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 24px 16px; color: #4ade80; font-size: 14px;">
                                        ${paymentLabel}
                                    </td>
                                    <td style="padding: 4px 24px 16px; color: #4ade80; text-align: right; font-size: 14px;">
                                        ${formatCurrency(paymentAmount || booking.pricing?.total || 0)}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    ${booking.notes ? `
                    <!-- Notes -->
                    <tr>
                        <td style="padding: 0 40px 30px; background-color: ${BRAND.secondaryColor};">
                            <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #fff;">Notes</h2>
                            <p style="margin: 0; font-size: 15px; color: ${BRAND.textColor}; line-height: 1.6; background-color: #222; padding: 16px 20px; border-radius: 12px; border: 1px solid #333;">
                                ${booking.notes}
                            </p>
                        </td>
                    </tr>
                    ` : ""}

                    <!-- What's Next -->
                    <tr>
                        <td style="padding: 0 40px 30px; background-color: ${BRAND.secondaryColor};">
                            <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #fff;">What's Next?</h2>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 12px 0; vertical-align: top; width: 36px;">
                                        <div style="width: 28px; height: 28px; background-color: rgba(203, 178, 106, 0.15); border-radius: 50%; text-align: center; line-height: 28px; color: ${BRAND.primaryColor}; font-weight: 700; font-size: 14px;">1</div>
                                    </td>
                                    <td style="padding: 12px 0 12px 12px; vertical-align: top;">
                                        <p style="margin: 0; font-size: 15px; color: #fff; font-weight: 600;">Prepare Your Property</p>
                                        <p style="margin: 4px 0 0; font-size: 14px; color: #999;">Ensure the space is clean, well-lit, and staged for the best results.</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; vertical-align: top; width: 36px;">
                                        <div style="width: 28px; height: 28px; background-color: rgba(203, 178, 106, 0.15); border-radius: 50%; text-align: center; line-height: 28px; color: ${BRAND.primaryColor}; font-weight: 700; font-size: 14px;">2</div>
                                    </td>
                                    <td style="padding: 12px 0 12px 12px; vertical-align: top;">
                                        <p style="margin: 0; font-size: 15px; color: #fff; font-weight: 600;">Day of the Shoot</p>
                                        <p style="margin: 4px 0 0; font-size: 14px; color: #999;">Our team will arrive on time and handle everything professionally.</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; vertical-align: top; width: 36px;">
                                        <div style="width: 28px; height: 28px; background-color: rgba(203, 178, 106, 0.15); border-radius: 50%; text-align: center; line-height: 28px; color: ${BRAND.primaryColor}; font-weight: 700; font-size: 14px;">3</div>
                                    </td>
                                    <td style="padding: 12px 0 12px 12px; vertical-align: top;">
                                        <p style="margin: 0; font-size: 15px; color: #fff; font-weight: 600;">Receive Your Deliverables</p>
                                        <p style="margin: 4px 0 0; font-size: 14px; color: #999;">Your edited photos, videos, and media will be delivered within 24-48 hours.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td align="center" style="padding: 0 40px 30px; background-color: ${BRAND.secondaryColor};">
                            <a href="${BRAND.website}/login" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, ${BRAND.primaryColor}, ${BRAND.accentColor}); color: #000; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 8px; letter-spacing: 0.5px;">
                                View Your Portal
                            </a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #111; border-radius: 0 0 16px 16px; border-top: 1px solid #333;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 8px; font-size: 14px; color: #888;">
                                            Questions about your booking?
                                        </p>
                                        <p style="margin: 0 0 16px; font-size: 14px;">
                                            <a href="mailto:${BRAND.email}" style="color: ${BRAND.primaryColor}; text-decoration: none;">${BRAND.email}</a>
                                        </p>
                                        <p style="margin: 0; font-size: 12px; color: #555;">
                                            &copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
                                        </p>
                                        <p style="margin: 8px 0 0; font-size: 12px;">
                                            <a href="${BRAND.website}" style="color: #666; text-decoration: none;">${BRAND.website.replace("https://www.", "")}</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

// ─── Send Booking Confirmation Email ────────────────────────────────────────
async function sendBookingConfirmation(booking, paymentAmount, paymentOption) {
    const transport = getTransporter();
    if (!transport) {
        console.warn("📧 Email transporter not configured — skipping confirmation email.");
        return { success: false, reason: "transporter_not_configured" };
    }

    const recipientEmail = booking.clientEmail;
    if (!recipientEmail) {
        console.warn("📧 No client email found on booking — skipping confirmation email.");
        return { success: false, reason: "no_client_email" };
    }

    const html = buildConfirmationEmail(booking, paymentAmount, paymentOption);

    const mailOptions = {
        from: `"${BRAND.name}" <${BRAND.email}>`,
        to: recipientEmail,
        subject: `Booking Confirmed — ${booking.serviceName || "Your Session"} | ${BRAND.name}`,
        html: html,
        replyTo: BRAND.email,
    };

    try {
        const info = await transport.sendMail(mailOptions);
        console.log(`📧 Confirmation email sent to ${recipientEmail} | messageId=${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error(`📧 Failed to send confirmation email to ${recipientEmail}:`, err.message);
        return { success: false, reason: err.message };
    }
}

module.exports = {
    sendBookingConfirmation,
    buildConfirmationEmail,
    BRAND,
};

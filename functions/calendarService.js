/**
 * Google Calendar Integration for Real Luxe Studios
 * 
 * Syncs bookings with Google Calendar to prevent double-booking.
 * Uses a service account for server-to-server authentication.
 */

const { google } = require("googleapis");

// Calendar ID — the Google Calendar to sync with
const CALENDAR_ID = "thomassamuelmedia@gmail.com";

// Service account credentials (loaded from environment or file)
let calendarClient = null;

/**
 * Initialize the Google Calendar client using service account credentials.
 * Credentials are stored as a Firebase environment config variable.
 */
function getCalendarClient() {
    if (calendarClient) return calendarClient;

    const credentials = JSON.parse(process.env.GOOGLE_CALENDAR_CREDENTIALS || "{}");

    if (!credentials.client_email || !credentials.private_key) {
        throw new Error("Missing Google Calendar service account credentials. Set GOOGLE_CALENDAR_CREDENTIALS env variable.");
    }

    const auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        ["https://www.googleapis.com/auth/calendar"]
    );

    calendarClient = google.calendar({ version: "v3", auth });
    return calendarClient;
}

/**
 * Create a Google Calendar event from a booking.
 * 
 * @param {Object} booking - The booking data from Firestore
 * @param {string} bookingId - The Firestore document ID
 * @returns {string} The Google Calendar event ID
 */
async function createCalendarEvent(booking, bookingId) {
    const calendar = getCalendarClient();

    // Build the event
    const event = {
        summary: `📸 ${booking.serviceName || "Studio Booking"} — ${booking.clientName || "Client"}`,
        description: buildEventDescription(booking, bookingId),
        start: {
            dateTime: toISO(booking.dateTime.start),
            timeZone: booking.dateTime.timezone || "America/Los_Angeles",
        },
        end: {
            dateTime: toISO(booking.dateTime.end),
            timeZone: booking.dateTime.timezone || "America/Los_Angeles",
        },
        location: booking.location?.address || "",
        colorId: "9", // Blueberry — stands out on the calendar
        reminders: {
            useDefault: false,
            overrides: [
                { method: "popup", minutes: 60 },    // 1 hour before
                { method: "popup", minutes: 1440 },   // 1 day before
            ],
        },
        // Store the Firestore booking ID in extended properties for reverse lookup
        extendedProperties: {
            private: {
                firestoreBookingId: bookingId,
                source: "realluxestudios",
            },
        },
    };

    try {
        const response = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: event,
        });

        console.log(`✅ Calendar event created: ${response.data.id} for booking ${bookingId}`);
        return response.data.id;
    } catch (err) {
        console.error(`❌ Failed to create calendar event for booking ${bookingId}:`, err.message);
        throw err;
    }
}

/**
 * Update an existing Google Calendar event when booking details change.
 * 
 * @param {string} calendarEventId - The Google Calendar event ID
 * @param {Object} booking - The updated booking data
 * @param {string} bookingId - The Firestore document ID
 */
async function updateCalendarEvent(calendarEventId, booking, bookingId) {
    const calendar = getCalendarClient();

    const event = {
        summary: `📸 ${booking.serviceName || "Studio Booking"} — ${booking.clientName || "Client"}`,
        description: buildEventDescription(booking, bookingId),
        start: {
            dateTime: toISO(booking.dateTime.start),
            timeZone: booking.dateTime.timezone || "America/Los_Angeles",
        },
        end: {
            dateTime: toISO(booking.dateTime.end),
            timeZone: booking.dateTime.timezone || "America/Los_Angeles",
        },
        location: booking.location?.address || "",
    };

    try {
        await calendar.events.update({
            calendarId: CALENDAR_ID,
            eventId: calendarEventId,
            resource: event,
        });
        console.log(`✅ Calendar event updated: ${calendarEventId} for booking ${bookingId}`);
    } catch (err) {
        console.error(`❌ Failed to update calendar event ${calendarEventId}:`, err.message);
        throw err;
    }
}

/**
 * Delete a Google Calendar event when a booking is cancelled.
 * 
 * @param {string} calendarEventId - The Google Calendar event ID to delete
 * @param {string} bookingId - The Firestore booking ID (for logging)
 */
async function deleteCalendarEvent(calendarEventId, bookingId) {
    const calendar = getCalendarClient();

    try {
        await calendar.events.delete({
            calendarId: CALENDAR_ID,
            eventId: calendarEventId,
        });
        console.log(`🗑️ Calendar event deleted: ${calendarEventId} for booking ${bookingId}`);
    } catch (err) {
        // If event was already deleted, that's fine
        if (err.code === 404 || err.code === 410) {
            console.log(`Calendar event ${calendarEventId} already deleted — skipping.`);
            return;
        }
        console.error(`❌ Failed to delete calendar event ${calendarEventId}:`, err.message);
        throw err;
    }
}

/**
 * Check Google Calendar for conflicts in a given time range.
 * Returns an array of busy time slots.
 * 
 * @param {Date|string} startTime - Start of the range to check
 * @param {Date|string} endTime - End of the range to check
 * @returns {Array} Array of { start, end } busy periods
 */
async function checkCalendarAvailability(startTime, endTime) {
    const calendar = getCalendarClient();

    try {
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: toISO(startTime),
                timeMax: toISO(endTime),
                items: [{ id: CALENDAR_ID }],
            },
        });

        const busySlots = response.data.calendars[CALENDAR_ID]?.busy || [];
        return busySlots.map(slot => ({
            start: new Date(slot.start),
            end: new Date(slot.end),
        }));
    } catch (err) {
        console.error("❌ Failed to check calendar availability:", err.message);
        // On failure, return empty (don't block bookings due to calendar API issues)
        return [];
    }
}

/**
 * Get all events for a specific date from Google Calendar.
 * Used to show blocked times on the booking form.
 * 
 * @param {Date|string} date - The date to check
 * @returns {Array} Array of events with start/end times
 */
async function getEventsForDate(date) {
    const calendar = getCalendarClient();

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    try {
        const response = await calendar.events.list({
            calendarId: CALENDAR_ID,
            timeMin: dayStart.toISOString(),
            timeMax: dayEnd.toISOString(),
            singleEvents: true,
            orderBy: "startTime",
        });

        return (response.data.items || []).map(event => ({
            id: event.id,
            summary: event.summary || "Busy",
            start: new Date(event.start.dateTime || event.start.date),
            end: new Date(event.end.dateTime || event.end.date),
            firestoreBookingId: event.extendedProperties?.private?.firestoreBookingId || null,
        }));
    } catch (err) {
        console.error("❌ Failed to get calendar events:", err.message);
        return [];
    }
}

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Convert a Date, Firestore Timestamp, or ISO string to ISO 8601 format.
 */
function toISO(value) {
    if (!value) return new Date().toISOString();
    if (typeof value === "string") return new Date(value).toISOString();
    if (value.toDate) return value.toDate().toISOString(); // Firestore Timestamp
    if (value instanceof Date) return value.toISOString();
    return new Date(value).toISOString();
}

/**
 * Build a rich description for the calendar event.
 */
function buildEventDescription(booking, bookingId) {
    const lines = [
        `🎬 Real Luxe Studios Booking`,
        ``,
        `Client: ${booking.clientName || "N/A"}`,
        `Email: ${booking.clientEmail || "N/A"}`,
        `Service: ${booking.serviceName || "N/A"}`,
    ];

    if (booking.addons && booking.addons.length > 0) {
        lines.push(`Add-ons: ${booking.addons.map(a => a.name).join(", ")}`);
    }

    if (booking.location?.address) {
        lines.push(`Location: ${booking.location.address}`);
    }

    if (booking.location?.notes) {
        lines.push(`Location Notes: ${booking.location.notes}`);
    }

    if (booking.pricing) {
        lines.push(``);
        lines.push(`💰 Pricing:`);
        lines.push(`  Subtotal: $${(booking.pricing.subtotal / 100).toFixed(2)}`);
        if (booking.pricing.travelFee) {
            lines.push(`  Travel Fee: $${(booking.pricing.travelFee / 100).toFixed(2)}`);
        }
        lines.push(`  Total: $${(booking.pricing.total / 100).toFixed(2)}`);
    }

    if (booking.notes) {
        lines.push(``);
        lines.push(`📝 Notes: ${booking.notes}`);
    }

    lines.push(``);
    lines.push(`Booking ID: ${bookingId}`);
    lines.push(`Status: ${booking.status || "pending"}`);
    lines.push(`Payment: ${booking.payment?.status || "pending"}`);

    return lines.join("\n");
}

module.exports = {
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    checkCalendarAvailability,
    getEventsForDate,
    CALENDAR_ID,
};

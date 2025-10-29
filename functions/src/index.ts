import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize SendGrid
const SENDGRID_API_KEY = functions.config().sendgrid?.apikey || process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Types
interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  serialNumber: string;
  revisionNumber: string;
  nextInspectionDate: string;
  isExcluded: boolean;
}

interface Operator {
  name: string;
  address: string;
  ico: string;
  contactPerson: string;
  email?: string;
}

interface NotificationSettings {
  enabled: boolean;
  recipients: string[];
  daysBeforeInspection: number[];
}

/**
 * Scheduled function that runs daily at 9:00 AM (Europe/Bratislava time)
 * Checks for upcoming inspections and sends email reminders
 */
export const sendInspectionReminders = functions
  .region('europe-west1')
  .pubsub.schedule('0 9 * * *')
  .timeZone('Europe/Bratislava')
  .onRun(async (context) => {
    try {
      console.log('Starting daily inspection reminder check...');

      // Get notification settings
      const settingsDoc = await admin.firestore()
        .collection('settings')
        .doc('notifications')
        .get();

      const settings = settingsDoc.data() as NotificationSettings | undefined;

      if (!settings || !settings.enabled || !settings.recipients.length) {
        console.log('Email notifications are disabled or no recipients configured');
        return null;
      }

      // Get operator info for email
      const operatorDoc = await admin.firestore()
        .collection('operator')
        .doc('main')
        .get();

      const operator = operatorDoc.data() as Operator | undefined;

      // Get all active assets
      const assetsSnapshot = await admin.firestore()
        .collection('assets')
        .where('isExcluded', '==', false)
        .get();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const assetsToNotify: { [days: number]: Asset[] } = {};
      
      // Group assets by days until inspection
      assetsSnapshot.forEach((doc) => {
        const asset = { id: doc.id, ...doc.data() } as Asset;
        const nextDate = new Date(asset.nextInspectionDate);
        nextDate.setHours(0, 0, 0, 0);

        const diffTime = nextDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        // Check if this matches any notification threshold
        if (settings.daysBeforeInspection.includes(diffDays)) {
          if (!assetsToNotify[diffDays]) {
            assetsToNotify[diffDays] = [];
          }
          assetsToNotify[diffDays].push(asset);
        }
      });

      // Send emails for each notification threshold
      for (const [daysStr, assets] of Object.entries(assetsToNotify)) {
        const days = parseInt(daysStr);
        
        if (assets.length > 0) {
          await sendReminderEmail(
            settings.recipients,
            assets,
            days,
            operator
          );
          
          console.log(`Sent reminder for ${assets.length} assets (${days} days)`);
        }
      }

      console.log('Daily inspection reminder check completed');
      return null;
    } catch (error) {
      console.error('Error in sendInspectionReminders:', error);
      throw error;
    }
  });

/**
 * HTTP function to manually trigger inspection reminders
 * Useful for testing and manual checks
 */
export const triggerInspectionReminders = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    try {
      // Trigger the scheduled function logic
      await sendInspectionReminders.run(context);
      
      return { success: true, message: 'Reminders sent successfully' };
    } catch (error) {
      console.error('Error triggering reminders:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to send reminders'
      );
    }
  });

/**
 * HTTP function to update notification settings
 */
export const updateNotificationSettings = functions
  .region('europe-west1')
  .https.onCall(async (data: NotificationSettings, context) => {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    try {
      await admin.firestore()
        .collection('settings')
        .doc('notifications')
        .set(data, { merge: true });

      return { success: true, message: 'Settings updated successfully' };
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to update settings'
      );
    }
  });

/**
 * Helper function to send reminder email via SendGrid
 */
async function sendReminderEmail(
  recipients: string[],
  assets: Asset[],
  daysUntilInspection: number,
  operator?: Operator
): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.error('SendGrid API key not configured');
    return;
  }

  const subject = daysUntilInspection === 0
    ? '🚨 DNES - Revízia elektrických zariadení'
    : daysUntilInspection < 0
    ? `⚠️ PO TERMÍNE - Revízia elektrických zariadení (${Math.abs(daysUntilInspection)} dní)`
    : `📋 Pripomienka - Revízia za ${daysUntilInspection} ${getDaysSuffix(daysUntilInspection)}`;

  const html = generateEmailHTML(assets, daysUntilInspection, operator);
  const text = generateEmailText(assets, daysUntilInspection, operator);

  const msg = {
    to: recipients,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || 'noreply@revnote.app',
      name: 'RevNote - Evidencia revízií'
    },
    subject,
    text,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent to ${recipients.join(', ')}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Generate HTML email content
 */
function generateEmailHTML(
  assets: Asset[],
  daysUntilInspection: number,
  operator?: Operator
): string {
  const urgencyColor = daysUntilInspection <= 0 ? '#dc2626' : 
                       daysUntilInspection <= 7 ? '#f59e0b' : 
                       '#3b82f6';

  const urgencyText = daysUntilInspection === 0 
    ? 'DNES je potrebná revízia týchto zariadení:'
    : daysUntilInspection < 0
    ? `Tieto zariadenia sú ${Math.abs(daysUntilInspection)} dní po termíne revízie:`
    : `Za ${daysUntilInspection} ${getDaysSuffix(daysUntilInspection)} je potrebná revízia týchto zariadení:`;

  const assetRows = assets.map(asset => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px; font-weight: 500;">${asset.name}</td>
      <td style="padding: 12px 8px; color: #6b7280;">${asset.type}</td>
      <td style="padding: 12px 8px; color: #6b7280;">${asset.location}</td>
      <td style="padding: 12px 8px; color: #6b7280;">${asset.revisionNumber}</td>
      <td style="padding: 12px 8px; color: #6b7280;">${formatDate(asset.nextInspectionDate)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pripomienka revízie</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin: 0; font-size: 24px;">RevNote</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Evidencia revízií náradia a spotrebičov</p>
          </div>

          <div style="background-color: ${urgencyColor}; color: white; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
            <h2 style="margin: 0; font-size: 18px;">📋 Pripomienka revízie</h2>
            <p style="margin: 10px 0 0 0;">${urgencyText}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <thead>
              <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Názov</th>
                <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Typ</th>
                <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Umiestnenie</th>
                <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Rev. č.</th>
                <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Termín</th>
              </tr>
            </thead>
            <tbody>
              ${assetRows}
            </tbody>
          </table>

          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>Celkový počet zariadení:</strong> ${assets.length}
            </p>
          </div>

          ${operator ? `
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;"><strong>Prevádzkovateľ:</strong></p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">${operator.name}</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">${operator.address}</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">IČO: ${operator.ico}</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Kontaktná osoba: ${operator.contactPerson}</p>
            </div>
          ` : ''}

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://idea3dsvk.github.io/revnote/" 
               style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 6px; font-weight: 500;">
              Otvoriť aplikáciu RevNote
            </a>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              Tento email bol automaticky odoslaný systémom RevNote.
            </p>
            <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">
              © ${new Date().getFullYear()} RevNote - Evidencia revízií náradia a spotrebičov
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text email content
 */
function generateEmailText(
  assets: Asset[],
  daysUntilInspection: number,
  operator?: Operator
): string {
  const urgencyText = daysUntilInspection === 0 
    ? 'DNES je potrebná revízia týchto zariadení:'
    : daysUntilInspection < 0
    ? `Tieto zariadenia sú ${Math.abs(daysUntilInspection)} dní po termíne revízie:`
    : `Za ${daysUntilInspection} ${getDaysSuffix(daysUntilInspection)} je potrebná revízia týchto zariadení:`;

  let text = `RevNote - Pripomienka revízie\n\n`;
  text += `${urgencyText}\n\n`;
  
  assets.forEach(asset => {
    text += `• ${asset.name}\n`;
    text += `  Typ: ${asset.type}\n`;
    text += `  Umiestnenie: ${asset.location}\n`;
    text += `  Rev. č.: ${asset.revisionNumber}\n`;
    text += `  Termín: ${formatDate(asset.nextInspectionDate)}\n\n`;
  });

  text += `Celkový počet zariadení: ${assets.length}\n\n`;

  if (operator) {
    text += `Prevádzkovateľ:\n`;
    text += `${operator.name}\n`;
    text += `${operator.address}\n`;
    text += `IČO: ${operator.ico}\n`;
    text += `Kontaktná osoba: ${operator.contactPerson}\n\n`;
  }

  text += `Otvoriť aplikáciu: https://idea3dsvk.github.io/revnote/\n\n`;
  text += `---\n`;
  text += `Tento email bol automaticky odoslaný systémom RevNote.\n`;

  return text;
}

/**
 * Helper function to get Slovak day suffix
 */
function getDaysSuffix(days: number): string {
  if (days === 1) return 'deň';
  if (days >= 2 && days <= 4) return 'dni';
  return 'dní';
}

/**
 * Helper function to format date
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

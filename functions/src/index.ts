import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize SendGrid
const SENDGRID_API_KEY = functions.config().sendgrid?.apikey || process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = functions.config().sendgrid?.fromemail || process.env.SENDGRID_FROM_EMAIL || 'noreply@revnote.app';

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

interface ReportCategories {
  overdue: Asset[];
  dueSoon: Asset[];
  ok: Asset[];
}

/**
 * HTTP function to send inspection report email
 * Called manually by admin from the app
 */
export const sendInspectionReport = functions
  .region('europe-west1')
  .https.onCall(async (data: { recipientEmail: string }, context: functions.https.CallableContext) => {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    try {
      console.log('Sending inspection report to:', data.recipientEmail);

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

      // Categorize assets by status
      const categories = {
        overdue: [] as Asset[],
        dueSoon: [] as Asset[],  // 30 days or less
        ok: [] as Asset[],
      };

      assetsSnapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
        const asset = { id: doc.id, ...doc.data() } as Asset;
        const nextDate = new Date(asset.nextInspectionDate);
        nextDate.setHours(0, 0, 0, 0);

        const diffTime = nextDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          categories.overdue.push(asset);
        } else if (diffDays <= 30) {
          categories.dueSoon.push(asset);
        } else {
          categories.ok.push(asset);
        }
      });

      // Send email report
      await sendReportEmail(
        data.recipientEmail,
        categories,
        operator
      );

      console.log('Report sent successfully to:', data.recipientEmail);
      return { 
        success: true, 
        message: 'Email report bol úspešne odoslaný',
        stats: {
          overdue: categories.overdue.length,
          dueSoon: categories.dueSoon.length,
          ok: categories.ok.length,
        }
      };
    } catch (error) {
      console.error('Error sending report:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Chyba pri odosielaní email reportu'
      );
    }
  });

/**
 * Helper function to send inspection report email via SendGrid
 */
async function sendReportEmail(
  recipient: string,
  categories: ReportCategories,
  operator?: Operator
): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.error('SendGrid API key not configured');
    return;
  }

  const totalAssets = categories.overdue.length + categories.dueSoon.length + categories.ok.length;
  const subject = categories.overdue.length > 0
    ? `⚠️ Prehľad revízií - ${categories.overdue.length} po termíne`
    : categories.dueSoon.length > 0
    ? `📋 Prehľad revízií - ${categories.dueSoon.length} do 30 dní`
    : '✅ Prehľad revízií - Všetko v poriadku';

  const html = generateReportEmailHTML(categories, operator, totalAssets);
  const text = generateReportEmailText(categories, operator, totalAssets);

  const msg = {
    to: recipient,
    from: {
      email: SENDGRID_FROM_EMAIL,
      name: 'RevNote - Evidencia revízií'
    },
    subject,
    text,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log(`Report email sent to ${recipient}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Generate HTML report email content
 */
function generateReportEmailHTML(
  categories: ReportCategories,
  operator: Operator | undefined,
  totalAssets: number
): string {
  const renderAssetTable = (assets: Asset[], title: string, color: string) => {
    if (assets.length === 0) return '';

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
      <div style="margin-bottom: 30px;">
        <div style="background-color: ${color}; color: white; padding: 12px 15px; border-radius: 6px 6px 0 0;">
          <h3 style="margin: 0; font-size: 16px;">${title} (${assets.length})</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-top: none;">
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
      </div>
    `;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Prehľad revízií</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin: 0; font-size: 24px;">RevNote</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Evidencia revízií náradia a spotrebičov</p>
          </div>

          <div style="background-color: #3b82f6; color: white; padding: 15px; border-radius: 6px; margin-bottom: 25px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">� Prehľad stavu revízií</h2>
            <p style="margin: 10px 0 0 0;">Celkový počet zariadení: ${totalAssets}</p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
            <div style="background-color: ${categories.overdue.length > 0 ? '#fef2f2' : '#f9fafb'}; 
                        border: 2px solid ${categories.overdue.length > 0 ? '#dc2626' : '#e5e7eb'}; 
                        padding: 15px; border-radius: 6px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: ${categories.overdue.length > 0 ? '#dc2626' : '#6b7280'};">
                ${categories.overdue.length}
              </div>
              <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">Po termíne</div>
            </div>
            <div style="background-color: ${categories.dueSoon.length > 0 ? '#fffbeb' : '#f9fafb'}; 
                        border: 2px solid ${categories.dueSoon.length > 0 ? '#f59e0b' : '#e5e7eb'}; 
                        padding: 15px; border-radius: 6px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: ${categories.dueSoon.length > 0 ? '#f59e0b' : '#6b7280'};">
                ${categories.dueSoon.length}
              </div>
              <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">Do 30 dní</div>
            </div>
            <div style="background-color: ${categories.ok.length > 0 ? '#f0fdf4' : '#f9fafb'}; 
                        border: 2px solid ${categories.ok.length > 0 ? '#10b981' : '#e5e7eb'}; 
                        padding: 15px; border-radius: 6px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: ${categories.ok.length > 0 ? '#10b981' : '#6b7280'};">
                ${categories.ok.length}
              </div>
              <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">V poriadku</div>
            </div>
          </div>

          ${renderAssetTable(categories.overdue, '⚠️ Po termíne revízie', '#dc2626')}
          ${renderAssetTable(categories.dueSoon, '📋 Blíži sa revízia (do 30 dní)', '#f59e0b')}
          ${renderAssetTable(categories.ok, '✅ V poriadku (nad 30 dní)', '#10b981')}

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
              Tento email bol odoslaný na požiadanie z aplikácie RevNote.
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
 * Generate plain text report email content
 */
function generateReportEmailText(
  categories: ReportCategories,
  operator: Operator | undefined,
  totalAssets: number
): string {
  const renderAssetSection = (assets: Asset[], title: string) => {
    if (assets.length === 0) return '';

    let section = `\n${title} (${assets.length}):\n`;
    section += '='.repeat(50) + '\n\n';
    
    assets.forEach(asset => {
      section += `• ${asset.name}\n`;
      section += `  Typ: ${asset.type}\n`;
      section += `  Umiestnenie: ${asset.location}\n`;
      section += `  Rev. č.: ${asset.revisionNumber}\n`;
      section += `  Termín: ${formatDate(asset.nextInspectionDate)}\n\n`;
    });

    return section;
  };

  let text = `RevNote - Prehľad stavu revízií\n\n`;
  text += `Celkový počet zariadení: ${totalAssets}\n`;
  text += `Po termíne: ${categories.overdue.length}\n`;
  text += `Do 30 dní: ${categories.dueSoon.length}\n`;
  text += `V poriadku: ${categories.ok.length}\n`;

  text += renderAssetSection(categories.overdue, '⚠️ PO TERMÍNE REVÍZIE');
  text += renderAssetSection(categories.dueSoon, '📋 BLÍŽI SA REVÍZIA (do 30 dní)');
  text += renderAssetSection(categories.ok, '✅ V PORIADKU (nad 30 dní)');

  if (operator) {
    text += `\nPrevádzkovateľ:\n`;
    text += `${operator.name}\n`;
    text += `${operator.address}\n`;
    text += `IČO: ${operator.ico}\n`;
    text += `Kontaktná osoba: ${operator.contactPerson}\n\n`;
  }

  text += `\nOtvoriť aplikáciu: https://idea3dsvk.github.io/revnote/\n\n`;
  text += `---\n`;
  text += `Tento email bol odoslaný na požiadanie z aplikácie RevNote.\n`;

  return text;
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

const SHEET_NAME = 'Student Registrations';
const SPREADSHEET_ID = '1yzZ7TRUg5yFvhcKzYfPPDJz3vkbMgxlGriN-VTx1CmU';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const sheet = getRegistrationSheet();

    sheet.appendRow([
      new Date(),
      cleanValue(data.name),
      cleanValue(data.className),
      cleanValue(data.section),
      cleanValue(data.phone),
      cleanValue(data.year),
      cleanValue(data.source),
      cleanValue(data.submittedAt)
    ]);

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) });
  }
}

function doGet() {
  return jsonResponse({ ok: true, message: 'Student registration endpoint is active.' });
}

function getRegistrationSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp',
      'Student Name',
      'Class',
      'Section',
      'Phone Number',
      'Year',
      'Source',
      'Submitted At'
    ]);
  }

  return sheet;
}

function cleanValue(value) {
  return String(value || '').trim();
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

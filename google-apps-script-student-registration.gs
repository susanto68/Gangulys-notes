const SHEET_NAME = 'Student Registrations';
const SPREADSHEET_ID = '1yzZ7TRUg5yFvhcKzYfPPDJz3vkbMgxlGriN-VTx1CmU';

function doPost(e) {
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || '{}');
    const registration = {
      name: cleanValue(data.name),
      className: cleanValue(data.className),
      section: cleanValue(data.section),
      phone: cleanValue(data.phone),
      year: cleanValue(data.year),
      source: cleanValue(data.source),
      submittedAt: cleanValue(data.submittedAt)
    };

    if (!isValidRegistration(registration)) {
      return jsonResponse({
        ok: false,
        message: 'Please fill all required fields.'
      });
    }

    const sheet = getRegistrationSheet();

    sheet.appendRow([
      new Date(),
      registration.name,
      registration.className,
      registration.section,
      registration.phone,
      registration.year,
      registration.source,
      registration.submittedAt
    ]);

    return jsonResponse({
      ok: true,
      message: 'Registration submitted successfully.'
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      message: 'Registration could not be saved. Please try again.',
      error: String(error)
    });
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

function isValidRegistration(data) {
  return Boolean(
    data.name &&
    data.className &&
    data.section &&
    /^[0-9]{10,15}$/.test(data.phone) &&
    /^[0-9]{4}$/.test(data.year)
  );
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

const SPREADSHEET_ID = "1_B52q9-hXEpsWvYbcgLGJcY8NSKBgL4EmByqy3726tY";
const SHEET_NAME = "Khảo sát";
const HEADERS = [
  "Timestamp",
  "Tên gọi",
  "Thành phố",
  "Email",
  "Nhóm món yêu thích",
  "Ưu tiên khi ăn",
  "Tần suất ăn ngoài",
  "Ngân sách (VND)",
  "Món / quán yêu thích",
  "Vĩ độ",
  "Kinh độ",
  "Đồng ý chia sẻ"
];

function getSurveySheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function safeText_(value) {
  const text = value == null ? "" : String(value).trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Request body is empty.");
    }

    const data = JSON.parse(e.postData.contents);
    if (!data.city || !Array.isArray(data.cuisine) || data.cuisine.length === 0 ||
        !data.priority || data.consent !== true && data.consent !== "true" && data.consent !== "on") {
      throw new Error("Missing required survey answers.");
    }

    const sheet = getSurveySheet_();
    sheet.appendRow([
      new Date(),
      safeText_(data.nickname),
      safeText_(data.city),
      safeText_(data.email),
      safeText_(data.cuisine.join(", ")),
      safeText_(data.priority),
      safeText_(data.frequency),
      safeText_(data.budget),
      safeText_(data.favorite),
      safeText_(data.latitude),
      safeText_(data.longitude),
      "Có"
    ]);

    return jsonResponse_({ success: true, message: "Survey saved." });
  } catch (error) {
    console.error("Survey submission failed: " + error.message);
    return jsonResponse_({ success: false, message: error.message });
  }
}

function doGet() {
  try {
    const sheet = getSurveySheet_();
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) {
      return jsonResponse_({ success: true, data: [] });
    }

    const headers = values[0];
    const rows = values.slice(1).map(function (row) {
      const record = {};
      headers.forEach(function (header, index) {
        const value = row[index];
        record[header] = value instanceof Date ? value.toISOString() : value;
      });
      return record;
    });
    return jsonResponse_({ success: true, data: rows });
  } catch (error) {
    console.error("Survey retrieval failed: " + error.message);
    return jsonResponse_({ success: false, message: error.message });
  }
}

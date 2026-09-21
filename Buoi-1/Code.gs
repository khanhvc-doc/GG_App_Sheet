/**
 * Buổi 1 — Làm quen Apps Script qua Google Sheet
 * Dán toàn bộ nội dung file này vào Code.gs trong Apps Script Editor
 * của Google Sheet "QUAN_LY_TRA_NO_MON".
 */

function moSheet(tenSheet) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tenSheet);
}

function docDuLieu(tenSheet) {
  const sheet = moSheet(tenSheet);
  return sheet.getDataRange().getValues(); // gồm cả dòng tiêu đề
}

function ghiDuLieu(tenSheet, hang, cot, giaTri) {
  moSheet(tenSheet).getRange(hang, cot).setValue(giaTri);
}

function layDanhSachSinhVien() {
  const data = docDuLieu('SINHVIEN');
  const [header, ...rows] = data;
  return rows.map(r => ({
    mssv: r[0],
    hoTen: r[1],
    lop: r[2],
    khoa: r[3],
    chuyenNganh: r[4],
    maNganh: r[5],
    kyHoc: r[6],
    trangThai: r[7],
    email: r[8],
    sdt: r[9],
    boMon: r[10],
    phanLoai: r[11],
    ghiChu: r[12],
  }));
}

// Hàm tạm để chạy thử và xem kết quả trong View → Executions
// soDong: số dòng đầu muốn log ra, mặc định 20 — tránh Logger.log bị treo/chậm khi dữ liệu lớn
function test(soDong = 20) {
  const danhSach = layDanhSachSinhVien();
  Logger.log('Tổng số sinh viên: ' + danhSach.length);
  Logger.log(danhSach.slice(0, soDong));
}

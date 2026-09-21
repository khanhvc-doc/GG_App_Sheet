# Buổi 1 — Làm quen Apps Script qua Google Sheet

> Nguồn: [`Docs/GG Apps Script Ver2.md`](../Docs/GG%20Apps%20Script%20Ver2.md) — mục 7, "Buổi 1". File này là **nhật ký thực hiện + hướng dẫn từng bước** cho buổi 1, không thay thế tài liệu khung. Các AI khác khi đọc project này nên mở file này trước để biết buổi 1 đã làm tới đâu, rồi mới đọc khung chương trình để biết mục tiêu tổng thể.

## Mục tiêu buổi 1

Hiểu chuỗi đối tượng `SpreadsheetApp → Spreadsheet → Sheet → Range → Cell/Data`, và tự giải thích được vì sao `getValues()` trả về mảng 2 chiều "không sống" (không tự đồng bộ với Sheet khi Sheet đổi).

## Tiến độ

- [x] Bước 1 — Tạo Google Sheet `QUAN_LY_TRA_NO_MON` + 5 sheet con
- [x] Bước 2 — Tạo tiêu đề cột cho từng sheet
- [x] Bước 3 — Nhập dữ liệu mẫu vào `SINHVIEN`
- [x] Bước 4 — Mở Apps Script Editor (Extensions → Apps Script)
- [x] Bước 5 — Viết `moSheet()`, `docDuLieu()`, `ghiDuLieu()`
- [x] Bước 6 — Viết `layDanhSachSinhVien()`
- [x] Bước 7 — Chạy thử, xem log, kiểm tra kết quả — đã trả về dữ liệu đúng như kỳ vọng
- [ ] Bước 8 — Tự kiểm tra tiêu chí đạt (giải thích được vì sao mảng "không sống")

*(Cập nhật dấu `[x]` khi hoàn thành từng bước — xem chi tiết bên dưới.)*

## File phát sinh trong buổi 1

- [`Code.gs`](./Code.gs) — bản sao code mẫu để dán vào Apps Script Editor (moSheet, docDuLieu, ghiDuLieu, layDanhSachSinhVien).

---

## Hướng dẫn chi tiết từng bước

### Bước 1 — Tạo Google Sheet

1. Vào [sheets.google.com](https://sheets.google.com) → tạo file mới.
2. Đặt tên file: `QUAN_LY_TRA_NO_MON`.
3. Tạo đủ 5 sheet (tab) với **đúng tên** sau (Apps Script sẽ tham chiếu theo tên, sai tên là lỗi `getSheetByName` trả về `null`):
   - `SINHVIEN`
   - `MONHOC`
   - `DANGKY`
   - `LICH`
   - `BAOCAO`

> Ghi chú: mô hình dữ liệu đầy đủ ở mục 3.2 của khung chương trình còn có sheet `KETQUA` (kết quả thi), nhưng buổi 1 không tạo — sheet này sẽ được thêm khi học đến phần kiểm tra điều kiện / cập nhật kết quả (buổi 4 trở đi).

### Bước 2 — Tạo tiêu đề cột (dòng 1 mỗi sheet)

| Sheet | Cột (dòng 1) |
|---|---|
| `SINHVIEN` | `MSSV`, `HoTen`, `Lop`, `Khoa`, `ChuyenNganh`, `MaNganh`, `KyHoc`, `TrangThai`, `Email`, `SDT`, `BoMon`, `PhanLoai`, `GhiChu` |
| `MONHOC` | `MaMon`, `TenMon`, `SoTinChi` |
| `DANGKY` | `MSSV`, `MaMon`, `NgayDangKy`, `TrangThai` |
| `LICH` | `MaMon`, `Nhom`, `Ngay`, `Phong`, `SiSo` |
| `BAOCAO` | để trống — bảng báo cáo sẽ được định nghĩa ở buổi 3 |

### Bước 3 — Nhập dữ liệu mẫu vào `SINHVIEN`

Nhập tay 3-5 dòng sinh viên mẫu bên dưới dòng tiêu đề, ví dụ:

| MSSV | HoTen | Lop | Khoa | ChuyenNganh | MaNganh | KyHoc | TrangThai | Email | SDT | BoMon | PhanLoai | GhiChu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SV001 | Nguyen Van A | CNTT1 | CNTT | Ky thuat phan mem | 7480103 | 5 | Dang hoc | a@example.com | 0900000001 | Cong nghe phan mem | Chinh quy | |
| SV002 | Tran Thi B | CNTT1 | CNTT | He thong thong tin | 7480104 | 5 | Dang hoc | b@example.com | 0900000002 | He thong thong tin | Chinh quy | |
| SV003 | Le Van C | CNTT2 | CNTT | Ky thuat phan mem | 7480103 | 3 | Dang hoc | c@example.com | 0900000003 | Cong nghe phan mem | Lien thong | |

> `SINHVIEN.TrangThai` ở đây là trạng thái học tập của sinh viên (Đang học / Bảo lưu / Đã tốt nghiệp...) — **khác** với `DANGKY.TrangThai` (trạng thái tiến trình đăng ký trả nợ: Đã đăng ký → Đã xếp lịch → Đã học → Đã thi, xem mục 3.2 khung chương trình). Hai cột trùng tên nhưng khác sheet, khác ý nghĩa, đừng nhầm lẫn khi viết code lọc theo `trangThai`.

Có dữ liệu mẫu thì mới chạy thử được `layDanhSachSinhVien()` ở bước 6.

### Bước 4 — Mở Apps Script Editor

Trong Google Sheet: menu **Extensions (Tiện ích mở rộng) → Apps Script**. Trình soạn thảo mở ra với file mặc định `Code.gs`.

### Bước 5 — Viết hàm đọc/ghi cơ bản

Dán vào `Code.gs`:

```javascript
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
```

### Bước 6 — Viết `layDanhSachSinhVien()`

Đọc toàn bộ sheet `SINHVIEN` và trả về **mảng object** thay vì mảng thô — vì các buổi sau (filter/groupBy/HTML) thao tác trên object sẽ dễ đọc hơn nhiều so với truy cập `row[2]` lặp lại:

```javascript
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
```

### Bước 7 — Chạy thử và kiểm tra

1. Trong Apps Script Editor, chọn hàm `layDanhSachSinhVien` ở thanh chọn hàm trên cùng.
2. Bấm **Run** (▶). Lần đầu chạy, Google sẽ yêu cầu cấp quyền — chọn tài khoản, bấm **Advanced → Go to (tên project) (unsafe)** rồi **Allow** (đây là quyền truy cập Sheet của chính mình, không phải rủi ro bảo mật thật).
3. Mở **View → Executions** (hoặc icon đồng hồ ở sidebar) để xem log/kết quả trả về.
4. Muốn thấy kết quả rõ hơn, dùng hàm `test` tạm có sẵn trong [`Code.gs`](./Code.gs):
   ```javascript
   function test(soDong = 20) {
     const danhSach = layDanhSachSinhVien();
     Logger.log('Tổng số sinh viên: ' + danhSach.length);
     Logger.log(danhSach.slice(0, soDong));
   }
   ```
   rồi chọn chạy hàm `test`. Tham số `soDong` (mặc định 20) giới hạn số dòng log ra — nếu sau này `SINHVIEN` có hàng nghìn dòng, log toàn bộ mảng dễ làm Executions bị chậm/treo. Muốn xem nhiều/ít hơn thì gọi `test(50)` từ một hàm khác, hoặc sửa tạm giá trị mặc định.

Kết quả mong đợi: một mảng object, ví dụ
```
[{mssv=SV001.0, hoTen=Nguyen Van A, lop=CNTT1, khoa=CNTT}, ...]
```

### Bước 8 — Tự kiểm tra tiêu chí đạt

Trả lời được (không cần viết ra, chỉ cần tự giải thích):
- Vì sao `getValues()` trả về **mảng 2 chiều** (mỗi hàng Sheet = 1 mảng con)?
- Vì sao mảng đó **không "sống"** — nếu sau khi gọi `getValues()` mà sửa dữ liệu trực tiếp trên Sheet, biến JS đang giữ mảng cũ sẽ **không** tự cập nhật theo?

Nếu trả lời được hai câu trên → đạt tiêu chí buổi 1.

**Giải thích chi tiết:**

1. *Vì sao là mảng 2 chiều?*
   Một Sheet về bản chất là một lưới ô (hàng × cột). `getDataRange().getValues()` đọc nguyên khối ô đó và trả về đúng cấu trúc lưới ấy dưới dạng JS: **mảng ngoài = danh sách các hàng**, **mỗi mảng con = danh sách giá trị các cột trong hàng đó**. Ví dụ Sheet có 3 hàng × 4 cột thì `getValues()` trả về `[[h1c1, h1c2, h1c3, h1c4], [h2c1, ...], [h3c1, ...]]`. Đây là lý do buổi 1 phải "giải mã" mảng 2 chiều đó thành mảng object dễ đọc hơn (`layDanhSachSinhVien()`), vì `r[0], r[1], r[2]...` không tự nói lên ý nghĩa cột — object `{mssv, hoTen, lop, ...}` thì có.

2. *Vì sao mảng đó "không sống" (not live)?*
   `getValues()` **chụp một bản snapshot** dữ liệu tại đúng thời điểm gọi hàm, rồi copy nó vào bộ nhớ của Apps Script dưới dạng mảng JS bình thường. Từ lúc đó, mảng này hoàn toàn độc lập với Sheet — nó không phải là "con trỏ" hay "view" trỏ về ô tính. Vì vậy:
   - Nếu sau khi gọi `docDuLieu('SINHVIEN')` (hoặc `layDanhSachSinhVien()`) mà ai đó sửa/thêm/xoá dòng trực tiếp trên Sheet, **biến JS đang giữ kết quả cũ sẽ không tự cập nhật** — muốn thấy dữ liệu mới phải gọi lại `getValues()` một lần nữa.
   - Ngược lại, sửa trực tiếp vào mảng JS trong bộ nhớ (`arr[0].hoTen = 'X'`) **không** làm thay đổi gì trên Sheet thật — muốn ghi lại phải chủ động gọi `setValue()/setValues()` (đây chính là lý do phải có cặp hàm đọc riêng và ghi riêng như `docDuLieu()` / `ghiDuLieu()`).

3. *Vì sao điều này quan trọng cho hệ thống trả nợ môn?*
   Ở các buổi sau, logic nghiệp vụ thường là: đọc dữ liệu (`getValues()`) → xử lý bằng JS (filter/groupBy/map) → ghi kết quả trở lại (`setValues()`/`appendRow()`). Nếu hiểu nhầm rằng mảng đọc được sẽ "tự đồng bộ" với Sheet, học viên dễ mắc lỗi kinh điển: đọc dữ liệu 1 lần ở đầu hàm, xử lý xong tưởng Sheet đã tự thay đổi theo, rồi đọc lại vẫn thấy dữ liệu cũ, hoặc ghi đè nhầm vì dùng chỉ số dòng (`idx`) đã lệch so với Sheet thật (đặc biệt nguy hiểm khi có `LockService` và nhiều người cùng sửa ở Buổi 6). Nắm chắc "đọc = snapshot, ghi = hành động riêng" là nền tảng để hiểu đúng mọi hàm CRUD ở các buổi tiếp theo.

---

## Nhật ký cập nhật

- 2026-09-21 — Khởi tạo hướng dẫn buổi 1, chưa bắt đầu thực hiện bước nào.
- 2026-09-21 — Mở rộng cột `SINHVIEN` thành 13 cột thực tế (`MSSV, HoTen, Lop, Khoa, ChuyenNganh, MaNganh, KyHoc, TrangThai, Email, SDT, BoMon, PhanLoai, GhiChu`) theo yêu cầu người dùng; cập nhật `layDanhSachSinhVien()` trong README và [`Code.gs`](./Code.gs) để map đủ 13 trường.
- 2026-09-21 — Sửa hàm `test()` nhận tham số `soDong` (mặc định 20), chỉ log N dòng đầu thay vì log toàn bộ mảng, tránh treo/chậm khi `SINHVIEN` có nhiều dữ liệu.
- 2026-09-21 — Bước 1-7 hoàn thành, `layDanhSachSinhVien()` chạy đúng, trả về dữ liệu như kỳ vọng. Bổ sung giải thích chi tiết cho Bước 8 (mảng 2 chiều + snapshot "không sống"). Còn lại: tự xác nhận hiểu Bước 8 để chốt buổi 1.

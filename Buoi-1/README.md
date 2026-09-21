# Buổi 1 — Làm quen Apps Script qua Google Sheet

> Nguồn: [`Docs/GG Apps Script Ver2.md`](../Docs/GG%20Apps%20Script%20Ver2.md) — mục 7, "Buổi 1". File này là **nhật ký thực hiện + hướng dẫn từng bước** cho buổi 1, không thay thế tài liệu khung. Các AI khác khi đọc project này nên mở file này trước để biết buổi 1 đã làm tới đâu, rồi mới đọc khung chương trình để biết mục tiêu tổng thể.

## Mục tiêu buổi 1

Hiểu chuỗi đối tượng `SpreadsheetApp → Spreadsheet → Sheet → Range → Cell/Data`, và tự giải thích được vì sao `getValues()` trả về mảng 2 chiều "không sống" (không tự đồng bộ với Sheet khi Sheet đổi).

## Tiến độ

- [x] Bước 1 — Tạo Google Sheet `QUAN_LY_TRA_NO_MON` + các sheet con (thực tế: 8 sheet, xem ghi chú Bước 1)
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
- [`QUAN_LY_TRA_NO_MON.xlsx`](./QUAN_LY_TRA_NO_MON.xlsx) — bản export thật của Google Sheet đang dùng, dùng làm **nguồn đối chiếu thực tế** khi tài liệu và dữ liệu thật lệch nhau (xem Bước 1-2 và mục "Chênh lệch so với tài liệu khung" bên dưới).

## Chênh lệch giữa dữ liệu thật (`QUAN_LY_TRA_NO_MON.xlsx`) và hướng dẫn ban đầu

Sau khi đối chiếu file `.xlsx` thật, các mục dưới đây trong README này đã được **sửa lại cho khớp thực tế** (không sửa tài liệu khung `Docs/GG Apps Script Ver2.md`, vì đó là đặc tả gốc):

1. **Nhiều hơn 5 sheet.** File thật có 8 sheet: `Header_Raw`, `DANH_MUC`, `SINHVIEN`, `MONHOC`, `DANGKY`, `LICH`, `BAOCAO`, `KETQUA` — xem chi tiết Bước 1.
2. **`MONHOC`, `DANGKY`, `LICH` có nhiều cột hơn/khác thứ tự** so với mục 3.2 tài liệu khung — xem bảng Bước 2.
3. **Lỗi dữ liệu cần sửa trên Sheet thật:**
   - `DANGKY` có **2 cột cùng tên `GhiChu`** (cột F và G) — trùng tên do lỗi khi tạo cột, cần đổi tên hoặc xoá 1 cột trước khi viết code đọc/ghi `DANGKY` ở Buổi 4/6, nếu không code dựa theo tên cột sẽ không biết cột nào là cột đúng.
   - `SINHVIEN.SDT` đang được lưu là **kiểu số**, Excel/Sheets hiển thị dạng khoa học (`9.01234561E8`) — số điện thoại Việt Nam bắt đầu bằng `0` sẽ bị mất chữ số 0 đầu khi đọc bằng `getValues()`. Nên đổi định dạng cột `SDT` thành **Plain text**, và nhập lại kèm dấu `'` trước số (ví dụ `'0901234561`) để giữ đúng chuỗi số.
4. **`SINHVIEN` đã có 200 dòng dữ liệu thật** (MSSV dạng `PS20001...`, email `@fpt.edu.vn`), **`MONHOC` có 270 dòng thật** — vượt xa mức "3-5 dòng mẫu" ban đầu hướng dẫn ở Bước 3, không cần nhập thêm.
5. **`KETQUA` đã được tạo sẵn** đúng cấu trúc mục 3.2 (`MSSV, MaMon, Diem, KetQua, GhiChu`) — sớm hơn dự kiến (tài liệu khung dự kiến tạo từ Buổi 4), không phải vấn đề, chỉ cần ghi nhận.

---

## Hướng dẫn chi tiết từng bước

### Bước 1 — Tạo Google Sheet

1. Vào [sheets.google.com](https://sheets.google.com) → tạo file mới.
2. Đặt tên file: `QUAN_LY_TRA_NO_MON`.
3. Tạo các sheet (tab) — Apps Script tham chiếu theo tên, sai tên là lỗi `getSheetByName` trả về `null`.

**Trạng thái thực tế (đối chiếu từ `QUAN_LY_TRA_NO_MON.xlsx`) — file hiện có 8 sheet:**

| Sheet | Vai trò |
|---|---|
| `SINHVIEN` | Danh mục sinh viên — 200 dòng dữ liệu thật |
| `MONHOC` | Danh mục môn học — 270 dòng dữ liệu thật |
| `DANGKY` | Đăng ký trả nợ — đã tạo cấu trúc, chưa có dữ liệu |
| `LICH` | Lịch học — đã tạo cấu trúc, chưa có dữ liệu |
| `BAOCAO` | Báo cáo thống kê — đã tạo cấu trúc, chưa có dữ liệu |
| `KETQUA` | Kết quả thi (mục 3.2 khung chương trình) — đã tạo sẵn, sớm hơn dự kiến (tài liệu khung dự kiến từ Buổi 4) |
| `DANH_MUC` | **Không có trong tài liệu khung** — chứa các danh mục chuẩn hoá (mã trạng thái, mã bộ môn, mã chuyên ngành...), chuẩn bị cho dropdown/`DataValidation` ở Buổi 6 |
| `Header_Raw` | **Không có trong tài liệu khung** — 1 dòng, đúng 13 cột tiêu đề của `SINHVIEN`. Có vẻ là bản lưu/nháp tiêu đề gốc, không được code nào tham chiếu tới. Có thể giữ lại làm bản backup tên cột, hoặc xoá nếu không cần — không ảnh hưởng đến bài tập buổi 1. |

5 sheet lõi theo đúng tên tài liệu khung yêu cầu (`SINHVIEN, MONHOC, DANGKY, LICH, BAOCAO`) đã có đủ; `KETQUA` cũng đã có sẵn nên không cần tạo thêm ở Buổi 4. `DANH_MUC` và `Header_Raw` là phần mở rộng tự thêm, không bắt buộc theo tài liệu khung nhưng không sai — chỉ cần lưu ý code buổi 1-2 (`Code.gs`) không đụng tới 2 sheet này.

### Bước 2 — Tạo tiêu đề cột (dòng 1 mỗi sheet)

**Cột thực tế trên Sheet thật** (đối chiếu từ `QUAN_LY_TRA_NO_MON.xlsx`, khác một phần so với mục 3.2 tài liệu khung — xem cột "Ghi chú"):

| Sheet | Cột (dòng 1) | Ghi chú |
|---|---|---|
| `SINHVIEN` | `MSSV`, `HoTen`, `Lop`, `Khoa`, `ChuyenNganh`, `MaNganh`, `KyHoc`, `TrangThai`, `Email`, `SDT`, `BoMon`, `PhanLoai`, `GhiChu` | Khớp đúng bản mở rộng 13 cột đã chốt trước đó |
| `MONHOC` | `MaMon`, `TenMon`, `BoMon`, `SoTinChi`, `LoaiMon`, `TrangThai`, `GhiChu` | Tài liệu khung mục 3.2 chỉ ghi 3 cột (`MaMon, TenMon, SoTinChi`) — Sheet thật có thêm `BoMon, LoaiMon, TrangThai, GhiChu` và đổi thứ tự (`BoMon` trước `SoTinChi`). Nhiều dòng chỉ điền `MaMon/TenMon/BoMon`, các cột còn lại đang trống — code đọc cột này cần xử lý giá trị rỗng. |
| `DANGKY` | `MSSV`, `MaMon`, `NgayDangKy`, `TrangThai`, `Nhom`, `GhiChu`, **`GhiChu`** | **Lỗi:** cột F và G cùng tên `GhiChu` — cần sửa trên Sheet thật trước khi dùng ở Buổi 4/6 (xem mục "Chênh lệch..." ở trên). Cột `Nhom` cũng là phần mở rộng, không có trong mục 3.2. |
| `LICH` | `MaMon`, `Nhom`, `Ngay`, `Ca`, `Phong`, `SiSo`, `GhiChu` | Tài liệu khung mục 3.2 không có cột `Ca` và `GhiChu` — đây là mở rộng hợp lý (thêm buổi/ca học), không cần sửa. |
| `BAOCAO` | `MaMon`, `TenMon`, `SoLuongDangKy`, `SoNhom`, `SoSVDaHoc`, `SoSVChuaHoc`, `SoSVDaThi`, `SoSVDat`, `SoSVKhongDat`, `TyLeDat`, `NgayCapNhat` | Đã định nghĩa sẵn đủ cho cả bảng báo cáo Buổi 3 và dashboard Buổi 7, sớm hơn dự kiến — không cần sửa ở buổi 1. |
| `KETQUA` | `MSSV`, `MaMon`, `Diem`, `KetQua`, `GhiChu` | Khớp đúng mục 3.2 tài liệu khung. |

### Bước 3 — Nhập dữ liệu mẫu vào `SINHVIEN`

**Đã có sẵn — không cần làm gì thêm.** Đối chiếu `QUAN_LY_TRA_NO_MON.xlsx` cho thấy `SINHVIEN` đã có **200 dòng dữ liệu thật** (MSSV dạng `PS20001, PS20002...`, họ tên tiếng Việt, email `@fpt.edu.vn`), vượt xa mức "3-5 dòng mẫu" dự kiến ban đầu. Ví dụ 2 dòng đầu:

| MSSV | HoTen | Lop | Khoa | ChuyenNganh | MaNganh | KyHoc | TrangThai | Email | SDT | BoMon | PhanLoai | GhiChu |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PS20001 | Nguyễn Văn An | UD19301 | K19 | UDPM_N | UDPM | Kỳ 1 | HD | annvps20001@fpt.edu.vn | *(số, dạng khoa học — xem lỗi bên dưới)* | UDPM | UDPMITI101 - Nhập môn Công nghệ thông tin | Sinh viên mới nhập học |
| PS20002 | Trần Thị Bình | UD19301 | K19 | UDPM_N | UDPM | Kỳ 1 | HD | binhttps20002@fpt.edu.vn | *(số, dạng khoa học)* | UDPM | UDPMNAV101 - Lập trình web cơ bản (Java) | |

**Hai điểm cần lưu ý về dữ liệu thật này:**

1. `TrangThai` dùng **mã ngắn** (`HD`, `HL`...) chứ không phải chữ đầy đủ như ví dụ "Dang hoc" ban đầu — mã này tra nghĩa qua sheet `DANH_MUC`. Đây **vẫn là trạng thái học tập của sinh viên** (`SINHVIEN.TrangThai`), khác với `DANGKY.TrangThai` (trạng thái tiến trình đăng ký trả nợ: Đã đăng ký → Đã xếp lịch → Đã học → Đã thi, mục 3.2 khung chương trình). Hai cột trùng tên nhưng khác sheet, khác ý nghĩa — đừng nhầm khi viết code lọc theo `trangThai`.
2. Cột `SDT` đang lưu kiểu **số**, Sheets/Excel hiển thị dạng khoa học (ví dụ `9.01234561E8`) — số điện thoại Việt Nam có số `0` đứng đầu sẽ **bị mất chữ số 0** khi đọc bằng `getValues()`. Nên đổi định dạng cột này thành **Plain text** trên Sheet thật trước khi các buổi sau (5, 6 — hiển thị/tra cứu số điện thoại) dùng tới, và nhập lại số kèm dấu `'` ở đầu (ví dụ `'0901234561`) để Sheets không tự chuyển thành số.

Vì đã có dữ liệu thật, `layDanhSachSinhVien()` ở bước 6 chạy thử trực tiếp trên 200 dòng này luôn, không cần nhập thêm.

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

Kết quả mong đợi: một mảng object với dữ liệu thật, ví dụ
```
[{mssv=PS20001, hoTen=Nguyễn Văn An, lop=UD19301, khoa=K19, ...}, ...] (200 phần tử)
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
- 2026-09-21 — Chuyển sang Buổi 2, xem [`Buoi-2/README.md`](../Buoi-2/README.md). `Sheet.gs`/`SinhVien.gs` của buổi 2 kế thừa trực tiếp từ [`Code.gs`](./Code.gs) ở đây (đổi tên chuỗi `'SINHVIEN'` thành hằng số, thêm try/catch).
- 2026-09-21 — Đọc `QUAN_LY_TRA_NO_MON.xlsx` (bản export thật) để đối chiếu lại README. Phát hiện: file thật có 8 sheet (thêm `DANH_MUC`, `Header_Raw`, và `KETQUA` đã có sẵn); `MONHOC`/`DANGKY`/`LICH` có cột khác mục 3.2 tài liệu khung; `SINHVIEN` đã có 200 dòng, `MONHOC` có 270 dòng dữ liệu thật (không còn là dữ liệu mẫu). Hai lỗi dữ liệu cần người dùng tự sửa trên Sheet thật: (1) `DANGKY` có 2 cột trùng tên `GhiChu` (cột F, G); (2) `SINHVIEN.SDT` lưu kiểu số gây mất số 0 đầu — nên đổi định dạng cột thành Plain text. Đã cập nhật Bước 1-3, 7 và thêm mục "Chênh lệch giữa dữ liệu thật và hướng dẫn ban đầu" ở đầu file.

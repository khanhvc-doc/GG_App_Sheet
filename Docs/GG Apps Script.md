# Khung học Google Apps Script — 8 buổi (Bản đề xuất final)

> Tài liệu này là bản đặc tả đã chỉnh sửa từ khung học gốc do giảng viên soạn, qua 2 vòng review. Mục đích: làm nguồn tham chiếu duy nhất (single source of truth) để các AI hỗ trợ (biên soạn bài giảng, sinh code mẫu, chấm bài, review) hiểu đúng phạm vi, thứ tự kiến thức, và các quy ước đặt tên/dữ liệu — không cần suy đoán lại từ bản gốc dạng sơ đồ ASCII.
>
> Trạng thái: **Final v2** — thay thế hoàn toàn v1. Các thay đổi so với bản gốc (v1) được đánh dấu **[NEW]**/**[SỬA]**; các thay đổi thêm ở vòng review thứ 2 (v2) được đánh dấu **[v2]**. Xem lịch sử đầy đủ ở mục 9.

---

## 1. Mục tiêu khóa học

Sau 8 buổi, học viên tự xây dựng được một ứng dụng nhỏ chạy trên Google Workspace (Sheet + Apps Script + HTML Service) theo mô hình: **đăng ký → kiểm tra điều kiện → lập lịch → tra cứu → cập nhật trạng thái → thống kê**, không chỉ biết rời rạc "Apps Script là gì".

Đối tượng: người đã biết JavaScript cơ bản (function, biến, mảng, object) nhưng **chưa chắc đã thạo** `map/filter/reduce` hay thao tác bất đồng bộ client-server.

**Điều kiện tiên quyết / tài liệu tự đọc trước buổi 1** (không tính là buổi học riêng, tránh kéo khóa học thành 9 buổi):
- Cú pháp JS cơ bản: `function`, `let/const`, template literal, array literal, object literal, JSON.
- Khái niệm mảng 2 chiều (mảng của mảng).
- Có tài khoản Google, biết tạo Google Sheet, mở trình soạn Apps Script (Extensions → Apps Script).

---

## 2. Nguyên tắc học xuyên suốt **[v2]**

**Không học Apps Script theo API. Mỗi kiến thức mới phải giải quyết một vấn đề cụ thể trong hệ thống quản lý trả nợ môn.**

| API / kỹ thuật | Vấn đề nó giải quyết trong hệ thống |
|---|---|
| `getValues()` | Lấy dữ liệu sinh viên/đăng ký từ Sheet vào bộ nhớ để xử lý |
| `filter()` | Lọc sinh viên theo lớp/môn/trạng thái |
| `reduce()` | GroupBy theo môn, thống kê số lượng |
| `setValues()` / `appendRow()` | Ghi kết quả xử lý (lịch, trạng thái) trở lại Sheet |
| `google.script.run` | Cho HTML Form gọi được hàm Apps Script phía server |
| `LockService` | Chống 2 người cùng cập nhật trạng thái ghi đè lên nhau |
| `DataValidation` | Chặn nhập sai chính tả trạng thái (`Da dang ky` vs `Đã đăng ký`) làm sai lệch thống kê |
| Trigger | Tự động cập nhật trạng thái/báo cáo mỗi ngày mà không cần mở Sheet |

Khi soạn bài giảng/bài tập cho một buổi, luôn mở đầu bằng **câu hỏi nghiệp vụ** ("làm sao biết sinh viên này còn nợ môn gì?") rồi mới giới thiệu API trả lời câu hỏi đó — không mở đầu bằng "hôm nay học `reduce()`".

**Thang tiêu chí đánh giá cho mọi buổi** (áp dụng thống nhất, xem cách dùng cụ thể ở mục "Tiêu chí đạt" của từng buổi trong mục 6):
```
Biết API  →  Hiểu dữ liệu  →  Viết được code  →  Xử lý được lỗi  →  Giải thích được luồng nghiệp vụ
```
Học viên chỉ được coi là đạt buổi học khi lên tới bước cuối — giải thích được **tại sao** bước này cần trong hệ thống trả nợ môn, không chỉ chạy được code mẫu.

---

## 3. Dự án xuyên suốt: Hệ thống quản lý trả nợ môn

### 3.1 Luồng nghiệp vụ

```
Sinh viên
   │
   ▼
Đăng ký trả nợ (DANGKY)
   │
   ▼
Kiểm tra điều kiện  ← bước nghiệp vụ này phải có code kiểm tra thật (không chỉ liệt kê)
   │
   ▼
Xếp nhóm lớp / môn
   │
   ▼
Lập lịch học (LICH)
   │
   ▼
Theo dõi trạng thái (DANGKY.TrangThai)
   │
   ▼
Cập nhật kết quả (KETQUA)
   │
   ▼
Thống kê / báo cáo (BAOCAO)
```

"Kiểm tra điều kiện" là một bước có logic cụ thể, không phải chỉ là tên bước trong sơ đồ. Ví dụ điều kiện tối thiểu cần code hóa ở Buổi 4:
1. Sinh viên chưa đăng ký môn này ở trạng thái đang xử lý (chống đăng ký trùng).
2. Môn đăng ký nằm trong danh sách môn sinh viên còn nợ (đối chiếu MONHOC/kết quả cũ).
3. (Tùy chọn nâng cao) Không trùng khung giờ với lịch đã xếp của sinh viên đó.

### 3.2 Mô hình dữ liệu (chuẩn hóa tên Sheet)

Chuẩn hóa còn 6 sheet, tên cố định xuyên suốt tài liệu và code mẫu:

| Sheet | Vai trò | Cột chính |
|---|---|---|
| `SINHVIEN` | Danh mục sinh viên | `MSSV`, `HoTen`, `Lop`, `Khoa` |
| `MONHOC` | Danh mục môn học | `MaMon`, `TenMon`, `SoTinChi` |
| `DANGKY` | Bản ghi đăng ký trả nợ — **chỉ quản lý tiến trình đăng ký/học**, không chứa kết quả cuối | `MSSV`, `MaMon`, `NgayDangKy`, `TrangThai` |
| `LICH` | Lịch học đã xếp cho từng nhóm | `MaMon`, `Nhom`, `Ngay`, `Phong`, `SiSo` |
| `KETQUA` | Kết quả cuối cùng sau thi — **nguồn duy nhất** cho Đạt/Không đạt | `MSSV`, `MaMon`, `Diem`, `KetQua`, `GhiChu` |
| `BAOCAO` | Sheet đích ghi kết quả thống kê (Buổi 3, 7) | tùy báo cáo, xem 6.3 / 6.7 |

**[v2] Tách rõ trách nhiệm giữa `DANGKY.TrangThai` và `KETQUA.KetQua`** — đây là điểm dễ gây trùng lặp dữ liệu nhất nếu không quy định rõ:

```
DANGKY.TrangThai  → chỉ quản lý QUÁ TRÌNH:
    Đã đăng ký → Đã xếp lịch → Đã học → Đã thi

KETQUA.KetQua     → chỉ quản lý KẾT QUẢ CUỐI:
    Đạt | Không đạt
```

Quy tắc: khi `DANGKY.TrangThai = "Đã thi"`, hệ thống mới cho phép tạo/cập nhật một dòng tương ứng trong `KETQUA`. **Không** ghi "Đạt"/"Không đạt" vào `DANGKY.TrangThai` — tránh tình trạng hai nơi cùng chứa một thông tin và có thể lệch nhau (ví dụ `DANGKY` ghi "Đạt" nhưng `KETQUA` chưa có điểm).

**Khóa tra cứu bắt buộc**: mọi thao tác tìm/sửa một dòng đăng ký hoặc kết quả phải dùng khóa ghép **`MSSV + MaMon`**, không dùng `MSSV` một mình (một sinh viên có thể nợ nhiều môn).

**[v2] Giới hạn phạm vi của khóa `MSSV + MaMon`** (chưa đủ tổng quát cho hệ thống thật, nhưng đủ cho khóa học): quy ước rõ ràng —

> Trong phạm vi khóa học, mỗi sinh viên chỉ có **một** bản ghi đăng ký đang xử lý cho một môn tại một thời điểm (không xử lý trường hợp đăng ký lại môn đã từng đăng ký ở đợt trước).

Nếu phát triển thành hệ thống thật (nhiều đợt trả nợ, sinh viên có thể đăng ký lại môn đã rớt ở đợt trước), khóa cần nâng cấp thành `MaDangKy` (khóa tự sinh duy nhất) hoặc `MSSV + MaMon + DotTraNo`. Ghi rõ điều này trong bài giảng để học viên hiểu đây là lựa chọn đơn giản hóa có chủ đích, không phải thiết kế sai.

---

## 4. Nguyên tắc thiết kế lộ trình

Chia theo **mức độ trưởng thành của ứng dụng**, không chia theo cú pháp ngôn ngữ:

| Buổi | Trọng tâm | Sản phẩm |
|---|---|---|
| 1 | SpreadsheetApp / Spreadsheet / Sheet / Range | Đọc & ghi Sheet |
| 2 | Array 2 chiều + Object + CRUD + debug cơ bản + kiến trúc code | Tìm / thêm / sửa dữ liệu |
| 3 | Filter + GroupBy (reduce) + thống kê | Báo cáo đăng ký |
| 4 | Validate → GroupBy → chia nhóm → lập lịch (3 bài nhỏ) | Tự động lập lịch |
| 5 | HTML Form + Search (doGet + google.script.run) | Web tra cứu |
| 6 | Update trạng thái + DataValidation + chống ghi đè đồng thời | Web cập nhật |
| 7 | Dashboard + Trigger | Báo cáo tự động |
| 8 | Tích hợp + phân quyền khái niệm | Mini Application hoàn chỉnh |

**Đánh giá rủi ro thời gian**: Buổi 4 và Buổi 8 là hai buổi nặng nhất, dễ vỡ tiến độ nếu học viên yếu JS array.
- Buổi 4: đã tách thành 3 bài nhỏ tuần tự (Validate → GroupBy → Chia nhóm/Lập lịch), xem chi tiết mục 6.4 — giúp học viên nhìn thấy và debug từng bước thay vì một khối logic lớn.
- Buổi 8: không dạy API mới, chỉ ráp nối; nếu lớp yếu, có thể tách thêm buổi 8.5 (buffer/Q&A) tùy tình hình thực tế.

---

## 5. Bộ API / kỹ thuật trọng tâm

Giữ phạm vi hẹp, tránh học lan man.

**Apps Script / SpreadsheetApp:**
```
SpreadsheetApp, Spreadsheet, Sheet, Range
getRange(), getValue()/getValues(), setValue()/setValues()
getLastRow(), getLastColumn(), appendRow(), clearContent()
TextFinder (tìm kiếm nhanh thay vì loop thủ công)
DataValidation  ← [v2] nâng lên thành API trọng tâm, không chỉ nhắc ở Buổi 6
```

**JavaScript (V8 runtime):**
```
Array: map, filter, find, findIndex, some, every, sort, reduce
Object, Map, Set
Date (xử lý ngày trong lập lịch — Buổi 4)
```

**Web app (trọng tâm bắt buộc):**
```
HtmlService, doGet()
google.script.run
  .withSuccessHandler()
  .withFailureHandler()
```

**[v2] `doPost()` — chuyển thành phần mở rộng/tham khảo, không bắt buộc.** Lý do sư phạm: mục tiêu Buổi 5 là "HTML Form → `google.script.run` → Apps Script → Sheet", và `google.script.run` đã đủ để form gọi hàm ghi dữ liệu phía server. Dạy thêm `doPost()` song song dễ khiến học viên nhầm lẫn giữa hai cơ chế gọi server (điều hướng URL vs RPC qua `google.script.run`) trong khi bài toán không cần đến điều hướng URL. Nếu có học viên khá muốn tìm hiểu thêm (ví dụ để nhận webhook từ bên ngoài Sheet), giới thiệu `doPost()` như nội dung đọc thêm sau Buổi 5, không đưa vào bài tập bắt buộc.

**Debug & vận hành an toàn** (bắt buộc từ Buổi 2, không đợi đến khi có lỗi mới dạy):
```
Logger.log() / console.log() + View → Executions (xem log & lỗi runtime)
try/catch quanh mọi hàm ghi dữ liệu
LockService.getScriptLock() ← bắt buộc trước khi ghi đè dòng trong Buổi 6
```

**Trigger — làm rõ 2 loại:**
- Simple trigger: `onOpen()`, `onEdit(e)` — tự chạy, không cần cấp quyền thêm, nhưng bị giới hạn (không gọi được service cần OAuth như gửi mail).
- Installable trigger: tạo bằng `ScriptApp.newTrigger(...)` (ví dụ chạy mỗi ngày 7h) — cần cấp quyền, không bị giới hạn như trên.

---

## 6. Kiến trúc code **[v2]**

Không dạy kiến trúc phần mềm sâu, nhưng giới thiệu **rất nhẹ** từ Buổi 2 để tránh học viên dồn hết logic vào một file `Code.gs` phẳng hàng nghìn dòng đến Buổi 8.

Chỉ cần học viên phân biệt được 4 loại hàm và đặt chúng vào các file `.gs` riêng theo module nghiệp vụ:

```
Hàm đọc dữ liệu    (VD: docSinhVien())
Hàm xử lý dữ liệu  (VD: timSinhVien(), groupBy())
Hàm ghi dữ liệu    (VD: ghiDangKy())
Hàm nghiệp vụ      (VD: dangKyTraNo() — gọi validate rồi mới ghi)
```

Gợi ý cấu trúc file trong project Apps Script (giới thiệu ở Buổi 2, áp dụng dần đến Buổi 8):

```
CauHinh.gs   ← hằng số dùng chung (tên sheet, sức chứa phòng...)
Sheet.gs     ← hàm đọc/ghi thô: moSheet(), docDuLieu(), ghiDuLieu()
SinhVien.gs  ← timSinhVien(), laySinhVienTheoLop()
DangKy.gs    ← dangKyTraNo() (nghiệp vụ), ghiDangKy() (ghi thô)
Lich.gs      ← taoLichTraNo()
BaoCao.gs    ← thongKeTheoMon(), capNhatBaoCao()
Utils.gs     ← groupBy() và các hàm tiện ích dùng chung nhiều nơi
```

Ví dụ chuỗi gọi hàm minh họa sự phân tầng (đọc → xử lý → nghiệp vụ → ghi):
```
docSinhVien()  →  timSinhVien()  →  dangKyTraNo()  →  ghiDangKy()
```

Đây không phải yêu cầu bắt buộc chấm điểm, nhưng nên nhắc lại ở mỗi buổi khi tạo hàm mới: "hàm này thuộc nhóm nào, nên đặt ở file nào".

---

## 7. Chi tiết 8 buổi

### Buổi 1 — Làm quen Apps Script qua Google Sheet

**Mục tiêu:** Hiểu chuỗi đối tượng `SpreadsheetApp → Spreadsheet → Sheet → Range → Cell/Data`.

**Thực hành:** Tạo file `QUAN_LY_TRA_NO_MON` với các sheet `SINHVIEN, MONHOC, DANGKY, LICH, BAOCAO`.

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

**Bài toán cuối buổi:** `layDanhSachSinhVien()` — đọc toàn bộ sheet `SINHVIEN`, trả về **mảng object** (không phải mảng thô), vì toàn bộ các buổi sau (filter/groupBy/HTML) thao tác trên object sẽ dễ đọc hơn nhiều so với truy cập `row[2]` lặp lại:
```javascript
function layDanhSachSinhVien() {
  const data = docDuLieu('SINHVIEN');
  const [header, ...rows] = data;
  return rows.map(r => ({ mssv: r[0], hoTen: r[1], lop: r[2], khoa: r[3] }));
}
```

**Tiêu chí đạt:** Học viên tự giải thích được vì sao `getValues()` trả về mảng 2 chiều và mảng đó không "sống" (không tự đồng bộ với Sheet khi Sheet đổi).

---

### Buổi 2 — Đọc/ghi dữ liệu, xử lý mảng, debug cơ bản, kiến trúc code

**Mục tiêu:** Chuyển tư duy từ thao tác từng ô sang: `Sheet → getValues() → Array → xử lý JS → setValues()/appendRow() → Sheet`.

**Kỹ thuật:** `getValues, setValues, getDisplayValues, appendRow, clearContent` + `map, filter, find, findIndex, some, every, sort, reduce`.

**Debug:** Giới thiệu `Logger.log()` và panel *Executions* — mọi hàm viết từ buổi này trở đi phải có `try/catch` bọc quanh phần ghi dữ liệu, log lỗi ra `Logger.log(err)`.

**[v2] Kiến trúc code:** Giới thiệu nhẹ cách tách file theo mục 6 (`Sheet.gs`, `SinhVien.gs`...). Từ buổi này, mỗi hàm mới viết ra phải được xếp vào đúng file theo loại (đọc/xử lý/ghi/nghiệp vụ).

**Bài toán cuối buổi:**
```javascript
function timSinhVien(mssv) {
  return layDanhSachSinhVien().find(sv => sv.mssv === mssv) || null;
}

function laySinhVienTheoLop(maLop) {
  return layDanhSachSinhVien().filter(sv => sv.lop === maLop);
}
```
**Tiêu chí đạt:** `timSinhVien` trả về `null` (không throw lỗi) khi không tìm thấy — học viên phải tự xử lý case rỗng, vì Buổi 5 sẽ hiển thị kết quả này lên UI.

---

### Buổi 3 — Filter + GroupBy + Thống kê

**Kỹ thuật:** Filter theo lớp/môn/trạng thái; GroupBy bằng `reduce()`.

**Dạy GroupBy như một hàm tiện ích tái sử dụng** (đặt trong `Utils.gs` theo mục 6):
```javascript
function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key];
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {});
}
// groupBy(danhSachDangKy, 'maMon') → { Java: [...], Python: [...] }
```

**Bài toán cuối buổi:** Ghi vào sheet `BAOCAO` bảng:

| Môn | Số lượng đăng ký | Số nhóm | Số SV đã học | Số SV chưa học |
|---|---|---|---|---|

**Tiêu chí đạt:** Học viên giải thích được vì sao dùng `reduce()` cho groupBy thay vì vòng lặp `for` thủ công, và chỉ ra được `groupBy()` sẽ được tái sử dụng lại ở Buổi 4 và Buổi 7.

---

### Buổi 4 — Lập lịch trả nợ môn (kiểm tra điều kiện + xử lý nghiệp vụ)

**[v2] Buổi này được tách thành 3 bài nhỏ tuần tự**, thay vì một khối logic Validate→GroupBy→Chia nhóm→Xếp ngày→Xếp phòng→Ghi→Update liền mạch. Mục đích: học viên chạy và kiểm tra được kết quả từng bước trước khi ghép bước tiếp theo — dễ debug hơn nhiều so với viết một hàm lớn rồi mới chạy thử.

**Bài 1 — Validate:**
```javascript
function daDangKy(mssv, maMon) {
  const data = docDuLieu('DANGKY').slice(1);
  return data.some(r => r[0] === mssv && r[1] === maMon);
}

function konNoMon(mssv, maMon) {
  // đối chiếu với danh sách môn còn nợ của sinh viên (nguồn: KETQUA hoặc danh sách nợ đầu vào)
}
```
Input: `MSSV + MaMon` → Output: có đăng ký chưa? / môn có nằm trong danh sách nợ không?

**Bài 2 — GroupBy:**
```javascript
const dangKyTheoMon = groupBy(layDanhSachDangKy(), 'maMon');
// { Java: [75 SV], Python: [42 SV] }
```

**Bài 3 — Chia nhóm và ghi lịch:**
```javascript
const SUC_CHUA_PHONG = 30; // [SỬA v1] giới hạn phạm vi: sức chứa cố định, không tối ưu hóa xếp lịch

function chiaNhom(danhSachSV, sucChua) {
  const soNhom = Math.ceil(danhSachSV.length / sucChua);
  const nhoms = [];
  for (let i = 0; i < soNhom; i++) {
    nhoms.push(danhSachSV.slice(i * sucChua, (i + 1) * sucChua));
  }
  return nhoms; // Java: 75 SV → [Nhóm 1: 30, Nhóm 2: 30, Nhóm 3: 15]
}
```
Sau khi có kết quả `chiaNhom()`, mới ghi vào sheet `LICH` và cập nhật `DANGKY.TrangThai = "Đã xếp lịch"`.

**Bài toán cuối buổi:** `taoLichTraNo()` — ghép 3 bài trên thành một hàm nghiệp vụ, tự động sinh sheet `LICH` từ `DANGKY`.

**Tiêu chí đạt:** Học viên chạy và in ra (Logger.log) được kết quả trung gian của từng bài (danh sách hợp lệ sau validate → object sau groupBy → mảng nhóm sau chia nhóm) trước khi ghép thành hàm cuối.

---

### Buổi 5 — Form Input + Search (Web tra cứu)

**Kỹ thuật (bắt buộc):** HTML + CSS cơ bản + JS phía client, `HtmlService`, `doGet()`, `google.script.run`.

```javascript
google.script.run
  .withSuccessHandler(hienThiKetQua)
  .withFailureHandler(err => alert('Lỗi: ' + err.message))
  .timSinhVien(mssv);
```

**[v2] `doPost()` không nằm trong nội dung bắt buộc buổi này** — xem lý do ở mục 5. Nếu còn thời gian hoặc có học viên khá, giới thiệu như đọc thêm, không kiểm tra trong bài tập.

**Chức năng tra cứu:** theo `MSSV`, `HoTen`, `Lop`, `MaMon` — hiển thị họ tên, lớp, môn đang nợ, trạng thái, lịch học (nếu có).

**Tiêu chí đạt:** Giao diện phải xử lý được 3 trạng thái: đang tải, có kết quả, không tìm thấy — không chỉ demo happy path.

---

### Buổi 6 — Cập nhật trạng thái (Web cập nhật)

**Luồng trạng thái** (theo mục 3.2 — **không** bao gồm Đạt/Không đạt): `Đã đăng ký → Đã xếp lịch → Đã học → Đã thi`. Khi vào trạng thái `Đã thi`, form cập nhật chuyển hướng sang nhập kết quả vào `KETQUA` (Điểm, Kết quả, Ghi chú) — đây là hai form/hai bước riêng biệt, không gộp chung một cột trạng thái.

**Khóa tìm kiếm bắt buộc: `MSSV + MaMon`.**

**[v2] `DataValidation` — dropdown trạng thái trên Sheet:**
```javascript
function themDropdownTrangThai(sheet, cot) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Đã đăng ký', 'Đã xếp lịch', 'Đã học', 'Đã thi'])
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, cot, sheet.getMaxRows() - 1).setDataValidation(rule);
}
```
Lý do đưa vào bắt buộc: nếu ai đó nhập tay trực tiếp trên Sheet với các biến thể như `Da dang ky`, `Đã đăng ký `, `Đăng ký`, thì `filter()`/`groupBy()`/thống kê ở Buổi 3 và 7 sẽ cho kết quả sai mà không báo lỗi. Đây là bài học: **Apps Script không chỉ xử lý dữ liệu, mà còn phải kiểm soát chất lượng dữ liệu đầu vào.**

**Chống ghi đè đồng thời (`LockService`)** — lỗi thực tế phổ biến nhất khi nhiều người dùng cùng cập nhật một Sheet qua web app:
```javascript
function capNhatTrangThai(mssv, maMon, trangThaiMoi) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // chờ tối đa 10s
  try {
    const sheet = moSheet('DANGKY');
    const data = sheet.getDataRange().getValues();
    const idx = data.findIndex(r => r[0] === mssv && r[1] === maMon);
    if (idx === -1) throw new Error('Không tìm thấy bản ghi đăng ký');
    sheet.getRange(idx + 1, 4).setValue(trangThaiMoi); // cột TrangThai
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}
```

**Tiêu chí đạt:** Học viên giải thích được vì sao cần `LockService` (mô phỏng 2 tab cùng cập nhật 1 dòng) và vì sao `DataValidation` không thay thế được việc kiểm tra dữ liệu trong code (vì dữ liệu cũ nhập trước khi có dropdown vẫn có thể sai).

---

### Buổi 7 — Dashboard + thống kê + tự động hóa

**Dashboard mẫu:** Tổng đăng ký / Đã xếp lịch / Đã học / Đã thi / Đạt / Không đạt (Đạt/Không đạt lấy từ `KETQUA`, không lấy từ `DANGKY`), cắt theo Lớp, Môn, Khóa, Trạng thái, Ngày học.

**Làm rõ 2 loại trigger** (xem mục 5): `onOpen()/onEdit(e)` là simple trigger; trigger chạy theo giờ (`ScriptApp.newTrigger('capNhatBaoCao').timeBased().everyDays(1).atHour(7).create()`) là installable trigger, cần chạy 1 lần thủ công để cấp quyền.

**Luồng tự động hóa:**
```
Trigger 7h sáng mỗi ngày
      ↓
Kiểm tra lịch (đối chiếu ngày hiện tại với LICH)
      ↓
Cập nhật trạng thái (VD: tự chuyển "Đã xếp lịch" → "Đã học" đúng ngày)
      ↓
Ghi báo cáo vào BAOCAO
```

**Tiêu chí đạt:** Học viên giải thích được sự khác nhau giữa simple trigger và installable trigger, và vì sao báo cáo Đạt/Không đạt phải join dữ liệu từ `KETQUA` chứ không đọc từ `DANGKY`.

---

### Buổi 8 — Hoàn thiện hệ thống

Không học API mới. Ráp toàn bộ thành ứng dụng hoàn chỉnh theo kiến trúc:

```
                        GOOGLE SHEET
                             │
        ┌────────────┬───────────────┬────────────┐
        ▼            ▼               ▼            ▼
    SINHVIEN      MONHOC          DANGKY        KETQUA
                                     │
                                     ▼
                                   LICH
                                     │
                                     ▼
                                  BAOCAO
                     ▲
                     │
                APPS SCRIPT (business logic + LockService)
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Search     Register    Update
          │          │          │
          └──────────┼──────────┘
                     ▼
                 HTML FORM (doGet, google.script.run)
```

**Chức năng bắt buộc có trong sản phẩm cuối:**
1. Tra cứu (Buổi 5) — MSSV → thông tin SV + môn nợ + trạng thái + lịch.
2. Đăng ký (Buổi 4) — chọn môn → validate điều kiện → ghi `DANGKY`.
3. Lập lịch (Buổi 4) — groupBy môn/lớp → chia nhóm → xếp ngày/phòng.
4. Cập nhật (Buổi 6) — đổi trạng thái tuần tự, có `DataValidation` + khóa chống ghi đè.
5. Báo cáo (Buổi 3, 7) — theo lớp/môn/trạng thái/ngày, tự động cập nhật qua trigger.

**[v2] Phân quyền (khái niệm, không triển khai OAuth/authentication thật):**

```
Người dùng
    │
    ├── Sinh viên
    │     ├── Tra cứu
    │     └── Đăng ký
    │
    └── Giáo vụ
          ├── Lập lịch
          ├── Cập nhật trạng thái
          └── Xem báo cáo
```

Ở mức khóa học, chỉ cần giới thiệu khái niệm (ví dụ: giao diện web app cho sinh viên và trang tính/giao diện riêng cho giáo vụ, không cho sinh viên thấy nút "Cập nhật trạng thái"), **không** dạy OAuth hay hệ thống authentication phức tạp. Ghi rõ với học viên: *"Phân quyền đầy đủ (đăng nhập, kiểm tra vai trò server-side) là phần mở rộng sau khóa học."* Mục đích là để học viên hiểu **Web App chạy được ≠ hệ thống triển khai thực tế đã hoàn chỉnh**.

**Tiêu chí hoàn thành khóa học:** học viên tự trình bày được luồng dữ liệu từ lúc sinh viên đăng ký đến lúc ra kết quả thống kê, chỉ ra chính xác hàm nào (và ở file `.gs` nào theo mục 6) xử lý bước nào trong sơ đồ trên.

---

## 8. Kiến trúc hệ thống tổng thể

(Xem sơ đồ chi tiết ở Buổi 8, mục 7.)

---

## 9. Lịch sử thay đổi

### v0 → v1

| # | Thay đổi | Lý do |
|---|---|---|
| 1 | Chuẩn hóa tên sheet: bỏ `DANGKY_TRA_NO`/`LICH_TRA_NO`, chỉ dùng `DANGKY`/`LICH` | Bản gốc dùng lẫn lộn 2 tên cho cùng 1 sheet |
| 2 | Thêm sheet `KETQUA` riêng (tách khỏi `DANGKY`) | Bản gốc nhắc "Cập nhật kết quả" nhưng không có sheet chứa điểm/kết quả tường minh |
| 3 | Bỏ hàm `layFile()` mơ hồ ở Buổi 1 | Không phải API thật, dễ gây hiểu lầm |
| 4 | Trả về mảng object thay vì mảng thô từ Buổi 1 | Nhất quán, dễ mở rộng ở các buổi sau |
| 5 | Thêm `groupBy()` như hàm tiện ích ở Buổi 3 | Tránh viết lại `reduce` groupBy nhiều lần |
| 6 | Giới hạn thuật toán chia nhóm ở Buổi 4 (sức chứa cố định) | Bản gốc không giới hạn phạm vi, dễ vỡ tiến độ 1 buổi |
| 7 | Thêm `doPost()`, `withFailureHandler()` ở Buổi 5 | Bản gốc chỉ có `doGet`/`withSuccessHandler`, thiếu xử lý ghi & lỗi |
| 8 | Thêm `LockService` ở Buổi 6 | Chống ghi đè khi nhiều người cập nhật cùng lúc |
| 9 | Thêm `DataValidation` (chỉ nhắc ở Buổi 6) | Tránh nhập sai trạng thái trực tiếp trên Sheet |
| 10 | Phân biệt simple trigger vs installable trigger ở Buổi 7 | Bản gốc liệt kê chung, dễ nhầm về giới hạn quyền |
| 11 | Thêm mục Debug (`Logger.log`, Executions, `try/catch`) từ Buổi 2 | Bản gốc không dạy debug ở buổi nào |
| 12 | Thêm "Tiêu chí đạt" cho từng buổi | Bản gốc chỉ có sản phẩm cuối buổi |
| 13 | Cảnh báo rủi ro thời gian ở Buổi 4 và Buổi 8 | Hai buổi có khối lượng logic lớn nhất |
| 14 | Thêm mục điều kiện tiên quyết (đọc trước Buổi 1) | Bản gốc giả định học viên đã thạo `map/filter/reduce` |

### v1 → v2

| # | Thay đổi | Lý do |
|---|---|---|
| 15 | Bỏ "Đạt/Không đạt" khỏi `DANGKY.TrangThai`, chỉ để trong `KETQUA.KetQua` | v1 để cả hai nơi có thể chứa cùng thông tin kết quả, dễ lệch dữ liệu |
| 16 | Ghi rõ giới hạn của khóa `MSSV + MaMon` (mỗi SV chỉ 1 bản ghi đang xử lý/môn) + hướng nâng cấp `MaDangKy`/`DotTraNo` sau này | Tránh hiểu lầm đây là thiết kế sai khi hệ thống mở rộng nhiều đợt trả nợ |
| 17 | Tách Buổi 4 thành 3 bài nhỏ: Validate → GroupBy → Chia nhóm/Lập lịch | v1 gộp thành một khối logic lớn, khó debug từng bước |
| 18 | Chuyển `doPost()` từ bắt buộc sang mở rộng/tham khảo ở Buổi 5 | `google.script.run` đã đủ cho bài toán form; dạy thêm `doPost()` gây rối không cần thiết |
| 19 | Nâng `DataValidation` thành API trọng tâm (mục 5) thay vì chỉ nhắc ở Buổi 6 | Đây là bài học quan trọng về kiểm soát chất lượng dữ liệu, không chỉ là chi tiết kỹ thuật phụ |
| 20 | Thêm mục "Kiến trúc code" (mục 6), giới thiệu từ Buổi 2 | Tránh dồn toàn bộ logic vào một file phẳng đến Buổi 8 |
| 21 | Thêm "Phân quyền" (khái niệm) ở Buổi 8 | Giúp học viên phân biệt "chạy được" và "triển khai thực tế" |
| 22 | Thêm mục "Nguyên tắc học xuyên suốt" (mục 2) và thang tiêu chí 5 bước (Biết API → ... → Giải thích luồng nghiệp vụ) | Định hướng dạy theo vấn đề nghiệp vụ, không dạy theo danh sách API |

---

## 10. Ghi chú cho AI đọc tài liệu này

- Đây là tài liệu **khung chương trình**, không phải code hoàn chỉnh — các đoạn code trong mục 7 là *code mẫu tối thiểu* để minh họa API, không phải lời giải đầy đủ của bài tập cuối buổi.
- Khi được yêu cầu soạn slide/bài giảng/bài tập chi tiết cho một buổi cụ thể, ưu tiên bám theo đúng tên sheet, tên cột, tên hàm, trạng thái chuẩn (mục 3.2) và tổ chức file theo mục 6 — không tự đặt tên khác.
- **`DANGKY.TrangThai` không bao giờ chứa "Đạt"/"Không đạt"** — nếu một yêu cầu soạn bài có vẻ cần việc này, kiểm tra lại xem có phải nên thao tác trên `KETQUA` thay vì `DANGKY`.
- `doPost()` chỉ xuất hiện trong nội dung mở rộng/đọc thêm, không đưa vào bài tập bắt buộc của Buổi 5.
- Nếu nội dung yêu cầu vượt phạm vi API liệt kê ở mục 5 (ví dụ: gửi email, tích hợp Calendar, PropertiesService/CacheService, OAuth/authentication thật), coi là mở rộng ngoài khóa 8 buổi và cần nêu rõ đó là phần nâng cao, không bắt buộc.

/**
 * BỘ CÀI HỆ THỐNG KHÁCH ĐĂNG KÝ — Đầu tư cùng Thiên Quốc
 *
 * Cách dùng (làm một lần, khoảng 3 phút):
 *   1. Mở https://script.new (đăng nhập đúng tài khoản Google nhận báo cáo).
 *   2. Xoá hết chữ có sẵn, dán toàn bộ tệp này vào, bấm biểu tượng Lưu.
 *   3. Ở ô chọn hàm phía trên, chọn "caiDat" rồi bấm Chạy (Run).
 *   4. Google hỏi quyền: chọn tài khoản → "Nâng cao" (Advanced) → "Đi tới dự án" → "Cho phép".
 *      (Cảnh báo "chưa xác minh" là bình thường vì đây là mã của chính anh, chạy trong tài khoản của anh.)
 *   5. Chờ khoảng 20 giây. Anh sẽ nhận một email "Đã cài xong hệ thống khách đăng ký" kèm link Form và Sheet.
 *
 * Sau khi cài, hệ thống tự làm:
 *   - Tạo Google Form 10 câu và Sheet "Lead – Đầu tư cùng Thiên Quốc".
 *   - Mỗi khi có người đăng ký: chấm điểm, xếp hạng Nóng / Ấm / Lạnh, tô màu. Khách Nóng thì gửi email ngay.
 *   - 8h sáng T2–T6: email "Việc tìm khách hôm nay" kèm tin nhắn soạn sẵn đúng mốc (N0, N1, N3, N7, N14).
 *   - 19h Chủ nhật: email báo cáo phễu tuần.
 *   - Tạo bảng "Tổng hợp Lead (không có thông tin cá nhân)": chỉ có con số đếm, để agent điều hành đọc.
 *
 * Dữ liệu khách nằm trong Google Drive của anh, chỉ anh xem được. Mã này không gửi dữ liệu đi đâu khác.
 */

const TEN_FORM = 'Đăng ký nhận bản tin – Đầu tư cùng Thiên Quốc';
const TEN_SHEET = 'Lead – Đầu tư cùng Thiên Quốc';
const TEN_TONG_HOP = 'Tổng hợp Lead (không có thông tin cá nhân)';
const MUI_GIO = 'Asia/Ho_Chi_Minh';
const MIEN_TRU = 'Thông tin tham khảo, không phải khuyến nghị đầu tư.';

// Tiêu đề câu hỏi. Mã tìm cột theo các tiêu đề này, nên đừng đổi chữ trong Form sau khi cài.
const Q = {
  ten: 'Họ tên',
  zalo: 'Số Zalo',
  email: 'Email (không bắt buộc)',
  nhan: 'Anh chị muốn nhận gì?',
  kn: 'Kinh nghiệm đầu tư chứng khoán',
  tk: 'Anh chị đã có tài khoản chứng khoán chưa?',
  von: 'Quy mô vốn dự định đầu tư',
  nguon: 'Anh chị biết đến kênh qua đâu?',
  lo: 'Điều anh chị đang băn khoăn nhất',
  dongy: 'Đồng ý nhận thông tin'
};
const LUA_CHON = {
  nhan: ['Bản tin trước phiên 7h mỗi sáng', 'Tổng kết phiên mỗi chiều', 'Báo cáo vĩ mô hằng tuần', 'Hướng dẫn cho người mới bắt đầu', 'Buổi trao đổi danh mục 20 phút'],
  kn: ['Chưa bắt đầu', 'Dưới 1 năm', '1–3 năm', 'Trên 3 năm'],
  tk: ['Chưa có', 'Có, ít dùng', 'Có, giao dịch thường xuyên'],
  von: ['Dưới 100 triệu', '100–500 triệu', '500 triệu–2 tỷ', 'Trên 2 tỷ', 'Chưa muốn chia sẻ'],
  nguon: ['TikTok', 'Facebook', 'YouTube', 'Threads', 'Zalo', 'Website', 'Bạn bè giới thiệu']
};
const COT = { diem: 'Điểm', hang: 'Hạng', tt: 'Trạng thái', lienhe: 'Ngày liên hệ gần nhất', fu: 'Follow-up tiếp theo', ghichu: 'Ghi chú' };
const TRANG_THAI = ['Mới', 'Đã nhắn', 'Đã trả lời', 'Hẹn trao đổi', 'Đã mở tài khoản', 'Không quan tâm', 'Hủy'];
const KET_THUC = ['Đã trả lời', 'Hẹn trao đổi', 'Đã mở tài khoản', 'Không quan tâm', 'Hủy'];
const MOC = [1, 3, 7, 14];
const MAU = { 'Nóng': '#fde2e0', 'Ấm': '#fdf0d5', 'Lạnh': '#e7eefb' };

/* ====================== CÀI ĐẶT (chạy một lần) ====================== */
function caiDat() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('SHEET_ID')) {
    Logger.log('Đã cài từ trước. Sheet: https://docs.google.com/spreadsheets/d/' + props.getProperty('SHEET_ID'));
    Logger.log('Muốn cài lại từ đầu: chạy hàm "xoaCaiDat" rồi chạy lại "caiDat" (Form và Sheet cũ không bị xoá).');
    return;
  }

  // 1. Form
  const form = FormApp.create(TEN_FORM);
  form.setDescription('Em Quốc gửi bản tin trước phiên lúc 7h mỗi sáng qua Zalo, miễn phí. Anh chị điền vài thông tin để em gửi đúng nội dung anh chị cần.\n\n' + MIEN_TRU);
  form.setConfirmationMessage('Em đã nhận thông tin. Em sẽ nhắn Zalo cho anh chị trong hôm nay để gửi link cộng đồng nhận bản tin. Cảm ơn anh chị!');
  form.addTextItem().setTitle(Q.ten).setRequired(true);
  form.addTextItem().setTitle(Q.zalo).setHelpText('Em chỉ dùng để gửi bản tin và trả lời câu hỏi của anh chị.').setRequired(true);
  form.addTextItem().setTitle(Q.email);
  form.addCheckboxItem().setTitle(Q.nhan).setChoiceValues(LUA_CHON.nhan).setRequired(true);
  form.addMultipleChoiceItem().setTitle(Q.kn).setChoiceValues(LUA_CHON.kn).setRequired(true);
  form.addMultipleChoiceItem().setTitle(Q.tk).setChoiceValues(LUA_CHON.tk).setRequired(true);
  form.addMultipleChoiceItem().setTitle(Q.von).setChoiceValues(LUA_CHON.von);
  form.addMultipleChoiceItem().setTitle(Q.nguon).setChoiceValues(LUA_CHON.nguon);
  form.addParagraphTextItem().setTitle(Q.lo).setHelpText('Ví dụ: chưa biết bắt đầu từ đâu, đang lỗ chưa biết xử lý sao, muốn hiểu cách đọc báo cáo tài chính...');
  form.addCheckboxItem().setTitle(Q.dongy)
    .setChoiceValues(['Tôi đồng ý nhận bản tin và tin nhắn từ Đầu tư cùng Thiên Quốc. Tôi có thể nhắn HỦY bất cứ lúc nào để ngừng nhận.'])
    .setRequired(true);

  // 2. Sheet nhận câu trả lời
  const ss = SpreadsheetApp.create(TEN_SHEET);
  ss.setSpreadsheetTimeZone(MUI_GIO);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();
  Utilities.sleep(4000);
  props.setProperty('SHEET_ID', ss.getId());
  props.setProperty('FORM_ID', form.getId());

  const sh = sheetTraLoi_();
  const lastCol = sh.getLastColumn();
  const them = [COT.diem, COT.hang, COT.tt, COT.lienhe, COT.fu, COT.ghichu];
  sh.getRange(1, lastCol + 1, 1, them.length).setValues([them]).setFontWeight('bold').setBackground('#e1f0ec');
  sh.setFrozenRows(1);
  const c = cot_(sh);
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(TRANG_THAI, true).setAllowInvalid(false).build();
  sh.getRange(2, c.tt, 2000, 1).setDataValidation(rule);
  sh.getRange(2, c.lienhe, 2000, 1).setNumberFormat('dd/MM/yyyy');
  sh.getRange(2, c.fu, 2000, 1).setNumberFormat('dd/MM/yyyy');

  // 3. Việc tự chạy
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('khiCoDangKy').forSpreadsheet(ss).onFormSubmit().create();
  ScriptApp.newTrigger('khiSua').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('viecHomNay').timeBased().everyDays(1).atHour(8).inTimezone(MUI_GIO).create();
  ScriptApp.newTrigger('baoCaoTuan').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(19).inTimezone(MUI_GIO).create();
  ScriptApp.newTrigger('capNhatTongHop').timeBased().everyHours(4).create();

  // 4. Bảng tổng hợp không có thông tin cá nhân
  capNhatTongHop();

  // 5. Báo kết quả
  const tin = [
    'Hệ thống khách đăng ký đã cài xong.',
    '',
    '1) LINK FORM ĐỂ GỬI CHO KHÁCH (gắn vào tiểu sử các kênh, bình luận ghim, website):',
    form.getPublishedUrl(),
    '',
    '2) SHEET KHÁCH (chỉ anh xem được):',
    ss.getUrl(),
    '',
    '3) BẢNG TỔNG HỢP (chỉ có con số, agent điều hành đọc bảng này):',
    'https://docs.google.com/spreadsheets/d/' + props.getProperty('TONGHOP_ID'),
    '',
    '4) SỬA FORM (đổi màu, thêm ảnh bìa; đừng đổi chữ của câu hỏi):',
    form.getEditUrl(),
    '',
    'Việc tiếp theo: mở Trung tâm điều khiển → Phễu khách → dán link Sheet và link Form vào ô tương ứng.',
    'Thử ngay: tự điền Form một lần, xem Sheet có chấm điểm và tô màu không.'
  ].join('\n');
  MailApp.sendEmail(Session.getActiveUser().getEmail(), 'Đã cài xong hệ thống khách đăng ký', tin);
  Logger.log(tin);
}

function xoaCaiDat() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  PropertiesService.getScriptProperties().deleteAllProperties();
  Logger.log('Đã gỡ các việc tự chạy và quên Form, Sheet cũ (không xoá tệp nào). Chạy "caiDat" để cài lại.');
}

/* ====================== TIỆN ÍCH ====================== */
function sheetTraLoi_() {
  const ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) if (sheets[i].getFormUrl()) return sheets[i];
  return sheets[0];
}
// Trả về số thứ tự cột (bắt đầu từ 1) theo tiêu đề
function cot_(sh) {
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); });
  const tim = function (t) { const i = head.indexOf(t); return i < 0 ? 0 : i + 1; };
  const out = { time: 1 };
  Object.keys(Q).forEach(function (k) { out[k] = tim(Q[k]); });
  Object.keys(COT).forEach(function (k) { out[k] = tim(COT[k]); });
  return out;
}
function homNay_() {
  const s = Utilities.formatDate(new Date(), MUI_GIO, 'yyyy-MM-dd').split('-');
  return new Date(Number(s[0]), Number(s[1]) - 1, Number(s[2]));
}
function ngay_(d) {
  if (!(d instanceof Date) || isNaN(d)) return null;
  const s = Utilities.formatDate(d, MUI_GIO, 'yyyy-MM-dd').split('-');
  return new Date(Number(s[0]), Number(s[1]) - 1, Number(s[2]));
}
function cong_(d, n) { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
function soNgay_(a, b) { return Math.round((b.getTime() - a.getTime()) / 86400000); }
function dm_(d) { return Utilities.formatDate(d, MUI_GIO, 'dd/MM'); }

/* ====================== CHẤM ĐIỂM ====================== */
function chamDiem(o) {
  let d = 0;
  if (String(o.nhan || '').indexOf('Buổi trao đổi danh mục') >= 0) d += 3;
  if (o.von === 'Trên 2 tỷ') d += 3; else if (o.von === '500 triệu–2 tỷ') d += 2; else if (o.von === '100–500 triệu') d += 1;
  if (o.tk === 'Chưa có' || o.tk === 'Có, ít dùng') d += 2;
  if (o.nguon === 'Bạn bè giới thiệu') d += 2;
  if (o.kn === '1–3 năm' || o.kn === 'Trên 3 năm') d += 1;
  if (String(o.lo || '').trim()) d += 1;
  return { diem: d, hang: d >= 6 ? 'Nóng' : d >= 3 ? 'Ấm' : 'Lạnh' };
}
function docDong_(sh, c, row) {
  const v = sh.getRange(row, 1, 1, sh.getLastColumn()).getValues()[0];
  const g = function (k) { return c[k] ? v[c[k] - 1] : ''; };
  return { row: row, time: v[0], ten: g('ten'), nhan: g('nhan'), kn: g('kn'), tk: g('tk'), von: g('von'), nguon: g('nguon'), lo: g('lo'),
    diem: g('diem'), hang: g('hang'), tt: g('tt'), lienhe: g('lienhe'), fu: g('fu') };
}

/* ====================== TIN NHẮN SOẠN SẴN ====================== */
function tinNhan(moc, o) {
  const ten = 'anh/chị' + (o.ten ? ' ' + String(o.ten).trim().split(/\s+/).pop() : '');
  const lo = String(o.lo || '').trim();
  if (moc === 'N0') return 'Chào ' + ten + ', em là Quốc ở kênh Đầu tư cùng Thiên Quốc. Cảm ơn ' + ten + ' đã đăng ký nhận bản tin.\nTừ sáng mai, bản tin trước phiên 7h em gửi trong cộng đồng Zalo: [link cộng đồng Zalo]\n' +
    (lo ? 'Em có đọc phần ' + ten + ' chia sẻ: "' + lo + '". Em sẽ gửi thêm nội dung về đúng chuyện này trong vài ngày tới.\n' : '') + 'Có gì cần hỏi ' + ten + ' cứ nhắn em ạ.\n' + MIEN_TRU;
  if (moc === 'N1') return 'Chào ' + ten + ', bản tin sáng nay ' + ten + ' đọc có dễ theo dõi không ạ? ' + ten.charAt(0).toUpperCase() + ten.slice(1) + ' muốn em viết thêm về chủ đề nào (vĩ mô, nhóm ngành, cách đọc báo cáo tài chính...) thì nhắn em nhé.';
  if (moc === 'N3') return 'Chào ' + ten + ', hôm trước ' + ten + ' có quan tâm ' + (lo ? '"' + lo + '"' : 'một vài chủ đề') + '. Em gửi ' + ten + ' vài ý:\n[viết 3–4 câu phân tích riêng theo đúng điều họ quan tâm]\n[nếu kênh đã có video đúng chủ đề: dán link video]\n' + MIEN_TRU;
  if (moc === 'N7') return (o.kn === 'Chưa bắt đầu' || o.tk === 'Chưa có')
    ? 'Chào ' + ten + ', nếu ' + ten + ' muốn bắt đầu, em có thể hướng dẫn từng bước từ mở tài khoản tới đặt lệnh đầu tiên, khoảng 15 phút qua Zalo. ' + ten.charAt(0).toUpperCase() + ten.slice(1) + ' tiện hôm nào thì báo em ạ.\n' + MIEN_TRU
    : 'Chào ' + ten + ', em đang mở các buổi trao đổi danh mục 20 phút, miễn phí, để cùng nhìn lại tỷ trọng và mức rủi ro ' + ten + ' đang chấp nhận. ' + ten.charAt(0).toUpperCase() + ten.slice(1) + ' tiện khung giờ nào trong tuần này ạ?\n' + MIEN_TRU;
  return 'Chào ' + ten + ', em nhắn lần cuối để không làm phiền. Bản tin trước phiên 7h em vẫn gửi đều trong cộng đồng Zalo, ' + ten + ' cần trao đổi gì cứ nhắn em bất cứ lúc nào. Chúc ' + ten + ' một tuần nhẹ nhàng!';
}
function mocCua_(o, today) {
  if (o.tt === 'Mới' || !o.tt) return 'N0';
  const reg = ngay_(o.time);
  if (!reg) return 'N1';
  const n = soNgay_(reg, today);
  let m = 1;
  MOC.forEach(function (x) { if (n >= x) m = x; });
  return 'N' + m;
}

/* ====================== KHI CÓ NGƯỜI ĐĂNG KÝ ====================== */
function khiCoDangKy(e) {
  const sh = sheetTraLoi_();
  const c = cot_(sh);
  const row = e && e.range ? e.range.getRow() : sh.getLastRow();
  const o = docDong_(sh, c, row);
  const k = chamDiem(o);
  sh.getRange(row, c.diem).setValue(k.diem);
  sh.getRange(row, c.hang).setValue(k.hang);
  sh.getRange(row, c.tt).setValue('Mới');
  sh.getRange(row, c.fu).setValue(homNay_());
  sh.getRange(row, 1, 1, sh.getLastColumn()).setBackground(MAU[k.hang]);
  if (k.hang === 'Nóng') {
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Lead nóng: dòng ' + row + ' (' + k.diem + ' điểm)',
      'Có khách hạng Nóng vừa đăng ký, nên nhắn trong hôm nay.\n\n' +
      'Dòng ' + row + ' trong Sheet: ' + sh.getParent().getUrl() + '\n' +
      'Muốn nhận: ' + o.nhan + '\nKinh nghiệm: ' + o.kn + '\nTài khoản: ' + o.tk + '\nVốn: ' + o.von + '\nNguồn: ' + o.nguon + '\nBăn khoăn: ' + (o.lo || '(không ghi)') +
      '\n\n--- TIN NHẮN N0 SOẠN SẴN ---\n' + tinNhan('N0', o));
  }
  capNhatTongHop();
}

/* ====================== KHI ANH ĐỔI TRẠNG THÁI TRONG SHEET ====================== */
function khiSua(e) {
  if (!e || !e.range) return;
  const sh = e.range.getSheet();
  if (!sh.getFormUrl()) return;
  const c = cot_(sh);
  const row = e.range.getRow();
  if (row < 2 || e.range.getColumn() !== c.tt || e.range.getNumRows() > 1) return;
  const tt = String(e.range.getValue());
  const today = homNay_();
  sh.getRange(row, c.lienhe).setValue(today);
  const fu = sh.getRange(row, c.fu);
  if (KET_THUC.indexOf(tt) >= 0) { fu.clearContent(); return; }
  if (tt === 'Mới') { fu.setValue(today); return; }
  const reg = ngay_(sh.getRange(row, 1).getValue()) || today;
  let next = null;
  MOC.forEach(function (n) { const d = cong_(reg, n); if (!next && d.getTime() > today.getTime()) next = d; });
  if (next) fu.setValue(next); else fu.clearContent();
}

/* ====================== 8H SÁNG: VIỆC TÌM KHÁCH HÔM NAY ====================== */
function canNhan_() {
  const sh = sheetTraLoi_();
  const c = cot_(sh);
  const today = homNay_();
  const out = [];
  for (let r = 2; r <= sh.getLastRow(); r++) {
    const o = docDong_(sh, c, r);
    if (!o.time) continue;
    if (KET_THUC.indexOf(String(o.tt)) >= 0) continue;
    const fu = ngay_(o.fu);
    if (o.tt === 'Mới' || !o.tt || (fu && fu.getTime() <= today.getTime())) { o.moc = mocCua_(o, today); out.push(o); }
  }
  const thuTu = { 'Nóng': 0, 'Ấm': 1, 'Lạnh': 2 };
  out.sort(function (a, b) { return (thuTu[a.hang] || 0) - (thuTu[b.hang] || 0); });
  return out;
}
function viecHomNay() {
  const thu = Number(Utilities.formatDate(new Date(), MUI_GIO, 'u')); // 1 = Thứ Hai ... 7 = Chủ nhật
  if (thu > 5) return;
  const ds = canNhan_();
  if (!ds.length) return;
  const sh = sheetTraLoi_();
  const than = ['Hôm nay có ' + ds.length + ' khách cần nhắn. Nhắn xong, anh đổi cột Trạng thái trong Sheet để hệ thống tính mốc tiếp theo.', 'Sheet: ' + sh.getParent().getUrl(), ''];
  ds.forEach(function (o, i) {
    than.push('━━ ' + (i + 1) + '. Dòng ' + o.row + ' · ' + (o.ten || '') + ' · ' + o.hang + ' (' + o.diem + ' điểm) · mốc ' + o.moc + ' ━━');
    than.push(tinNhan(o.moc, o));
    than.push('');
  });
  than.push('Ai nhắn HỦY thì đổi Trạng thái thành "Hủy" và ngừng nhắn.');
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Việc tìm khách hôm nay ' + dm_(new Date()) + ' — ' + ds.length + ' khách cần nhắn', than.join('\n'));
}

/* ====================== ĐẾM (không có thông tin cá nhân) ====================== */
function dem_() {
  const sh = sheetTraLoi_();
  const c = cot_(sh);
  const today = homNay_();
  const dauTuan = cong_(today, -((today.getDay() + 6) % 7));
  const k = { tong: 0, tuanNay: 0, canNhan: 0, hang: {}, tt: {}, nguon: {}, nhan: {}, kn: {}, nguonMo: {} };
  const tang = function (m, key) { key = String(key || '(trống)'); m[key] = (m[key] || 0) + 1; };
  for (let r = 2; r <= sh.getLastRow(); r++) {
    const o = docDong_(sh, c, r);
    if (!o.time) continue;
    k.tong++;
    const reg = ngay_(o.time);
    if (reg && reg.getTime() >= dauTuan.getTime()) k.tuanNay++;
    tang(k.hang, o.hang); tang(k.tt, o.tt || 'Mới'); tang(k.nguon, o.nguon); tang(k.kn, o.kn);
    String(o.nhan || '').split(',').forEach(function (x) { if (x.trim()) tang(k.nhan, x.trim()); });
    if (o.tt === 'Đã mở tài khoản') tang(k.nguonMo, o.nguon);
    const fu = ngay_(o.fu);
    if (KET_THUC.indexOf(String(o.tt)) < 0 && (o.tt === 'Mới' || !o.tt || (fu && fu.getTime() <= today.getTime()))) k.canNhan++;
  }
  return k;
}
function capNhatTongHop() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('TONGHOP_ID');
  let ss;
  if (id) { ss = SpreadsheetApp.openById(id); } else { ss = SpreadsheetApp.create(TEN_TONG_HOP); ss.setSpreadsheetTimeZone(MUI_GIO); props.setProperty('TONGHOP_ID', ss.getId()); }
  const k = dem_();
  const rows = [['Mục', 'Giá trị', 'Số lượng'],
    ['Cập nhật lúc', Utilities.formatDate(new Date(), MUI_GIO, 'dd/MM/yyyy HH:mm'), ''],
    ['Tổng khách đăng ký', '', k.tong], ['Đăng ký mới tuần này', '', k.tuanNay], ['Cần nhắn hôm nay', '', k.canNhan]];
  const them = function (ten, m) { Object.keys(m).sort().forEach(function (key) { rows.push([ten, key, m[key]]); }); };
  them('Theo hạng', k.hang); them('Theo trạng thái', k.tt); them('Theo nguồn', k.nguon); them('Muốn nhận', k.nhan); them('Theo kinh nghiệm', k.kn); them('Đã mở tài khoản, theo nguồn', k.nguonMo);
  const sh = ss.getSheets()[0];
  sh.clearContents();
  sh.getRange(1, 1, rows.length, 3).setValues(rows);
  sh.getRange(1, 1, 1, 3).setFontWeight('bold');
}

/* ====================== 19H CHỦ NHẬT: BÁO CÁO PHỄU TUẦN ====================== */
function baoCaoTuan() {
  capNhatTongHop();
  const k = dem_();
  const dong = function (m) { return Object.keys(m).sort().map(function (key) { return '  ' + key + ': ' + m[key]; }).join('\n') || '  (chưa có)'; };
  const mo = k.tt['Đã mở tài khoản'] || 0;
  const than = ['PHỄU KHÁCH TUẦN NÀY', '',
    'Tổng khách đăng ký: ' + k.tong + ' (mới trong tuần: ' + k.tuanNay + ')',
    'Đã mở tài khoản: ' + mo + (k.tong ? ' (' + Math.round(mo / k.tong * 100) + '% trên tổng)' : ''),
    'Đang chờ nhắn: ' + k.canNhan, '',
    'THEO TRẠNG THÁI', dong(k.tt), '', 'THEO HẠNG', dong(k.hang), '', 'THEO NGUỒN', dong(k.nguon), '',
    'ĐÃ MỞ TÀI KHOẢN, THEO NGUỒN', dong(k.nguonMo), '', 'KHÁCH MUỐN NHẬN GÌ', dong(k.nhan), '',
    'Gợi ý: nguồn nào ra nhiều khách mở tài khoản nhất thì tuần tới dồn nội dung cho kênh đó.'].join('\n');
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Báo cáo phễu khách tuần ' + dm_(new Date()), than);
}

/* ====================== THỬ CÁCH CHẤM ĐIỂM (không đụng dữ liệu thật) ====================== */
function thuChamDiem() {
  const mau = [
    { nhan: 'Buổi trao đổi danh mục 20 phút', von: 'Trên 2 tỷ', tk: 'Có, ít dùng', nguon: 'Bạn bè giới thiệu', kn: 'Trên 3 năm', lo: 'đang lỗ' },
    { nhan: 'Bản tin trước phiên 7h mỗi sáng', von: '100–500 triệu', tk: 'Chưa có', nguon: 'TikTok', kn: 'Chưa bắt đầu', lo: '' },
    { nhan: 'Bản tin trước phiên 7h mỗi sáng', von: 'Dưới 100 triệu', tk: 'Có, giao dịch thường xuyên', nguon: 'Facebook', kn: 'Dưới 1 năm', lo: '' },
    { nhan: 'Hướng dẫn cho người mới bắt đầu, Buổi trao đổi danh mục 20 phút', von: '500 triệu–2 tỷ', tk: 'Chưa có', nguon: 'YouTube', kn: 'Chưa bắt đầu', lo: 'chưa biết bắt đầu từ đâu' },
    { nhan: 'Tổng kết phiên mỗi chiều', von: 'Chưa muốn chia sẻ', tk: 'Có, giao dịch thường xuyên', nguon: 'Threads', kn: '1–3 năm', lo: '' }
  ];
  mau.forEach(function (o, i) { const k = chamDiem(o); Logger.log('Mẫu ' + (i + 1) + ': ' + k.diem + ' điểm → ' + k.hang); });
  Logger.log('Kỳ vọng: 12 Nóng · 3 Ấm · 0 Lạnh · 8 Nóng · 1 Lạnh');
}

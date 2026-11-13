/* Trung tâm điều khiển — Đầu tư cùng Thiên Quốc
 * Một trang tĩnh, không máy chủ, không thư viện ngoài. Dữ liệu lưu trong trình duyệt (localStorage).
 */
(function () {
  'use strict';
  const D = TQ.DATA;
  const KEY = 'tq-dieu-khien-v1';
  const H = 3600e3, DAY = 24 * H, VN = 7 * H;
  const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const WD_LONG = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  /* ---------- Lưu trữ ---------- */
  const blank = () => ({ channels: {}, tasks: {}, daily: {}, jobsSeen: {}, video: {}, drafts: [], compose: '', claudeForm: null, claudeHistory: [], log: [], notes: {}, funnel: {}, goals: {}, leadForm: '', mail: '', theme: 'auto' });
  let S = load();
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign(blank(), JSON.parse(raw));
    } catch (e) { /* trình duyệt chặn lưu trữ: chạy tạm trong bộ nhớ */ }
    return blank();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Trình duyệt không cho lưu. Dữ liệu sẽ mất khi đóng trang.'); }
  }

  /* ---------- Tiện ích ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const now = () => Date.now();
  const vn = (ms) => new Date((ms == null ? now() : ms) + VN); // đọc bằng getUTC*
  const pad = (n) => String(n).padStart(2, '0');
  const dayKey = (ms) => { const d = vn(ms); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); };
  const weekKey = (ms) => { const d = vn(ms); const back = (d.getUTCDay() + 6) % 7; return dayKey((ms == null ? now() : ms) - back * DAY); };
  const fmtHM = (ms) => { const d = vn(ms); return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); };
  const fmtDM = (ms) => { const d = vn(ms); return pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1); };
  const fmtFull = (iso) => { const t = typeof iso === 'number' ? iso : Date.parse(iso); return isNaN(t) ? '—' : fmtHM(t) + ' · ' + fmtDM(t); };
  const fmtDate = (iso) => { const t = Date.parse(iso); if (isNaN(t)) return '—'; const d = vn(t); return pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear(); };
  const vnMs = (key, hm) => { const [y, m, d] = key.split('-').map(Number); const [h, mi] = hm.split(':').map(Number); return Date.UTC(y, m - 1, d, h, mi) - VN; };
  const addDays = (key, n) => dayKey(vnMs(key, '12:00') + n * DAY);
  const weekdayOf = (key) => new Date(vnMs(key, '12:00') + VN).getUTCDay();
  const rel = (ms) => {
    const diff = ms - now(), a = Math.abs(diff), m = Math.round(a / 60e3);
    const txt = m < 60 ? m + ' phút' : (m < 1440 ? Math.floor(m / 60) + ' giờ' + (m % 60 ? ' ' + (m % 60) + ' phút' : '') : Math.round(m / 1440) + ' ngày');
    return diff >= 0 ? 'còn ' + txt : txt + ' trước';
  };
  const chById = (id) => D.channels.find((c) => c.id === id);
  const isUrl = (s) => /^https:\/\/[^\s]+\.[^\s]+/.test(s);

  function addLog(ch, text, kind) {
    S.log.unshift({ id: uid(), at: new Date().toISOString(), ch, text, kind: kind || 'ok' });
    if (S.log.length > 600) S.log.length = 600;
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e2) { /* bỏ qua */ }
      ta.remove();
    }
    toast('Đã copy');
  }

  /* ---------- Trạng thái kênh ---------- */
  const STATUS = {
    connected: { label: 'Đã kết nối', kind: 'ok' },
    manual: { label: 'Tự đăng tay', kind: 'info' },
    none: { label: 'Chưa kết nối', kind: 'warn' },
    reconnect: { label: 'Cần kết nối lại', kind: 'bad' },
    notcreated: { label: 'Chưa tạo', kind: 'warn' },
    auto: { label: 'Tự chạy', kind: 'info' }
  };
  const needsAction = (st) => st === 'none' || st === 'reconnect' || st === 'notcreated';
  function chState(id) {
    const c = chById(id);
    const own = S.channels[id];
    return Object.assign({}, c.seed, own || {}, { fromSeed: !own });
  }
  function methodName(c, mid) {
    const m = c.connect && c.connect.methods.find((x) => x.id === mid);
    if (m) return m.name;
    return { claude: 'Claude gửi qua Gmail', github: 'GitHub Pages', 'claude-code': 'Claude Code' }[mid] || '';
  }
  function videoProgress() {
    const c = chById('video');
    const w = S.video[weekKey()] || {};
    const done = c.steps.filter((s) => w[s.id]).length;
    return { done, total: c.steps.length };
  }
  function pillFor(id) {
    const c = chById(id), st = chState(id);
    if (c.workflow) {
      const p = videoProgress();
      return { label: p.done === p.total ? 'Xong tuần này' : 'Tuần này ' + p.done + '/' + p.total, kind: p.done === p.total ? 'ok' : 'info', href: '#/kenh/' + id };
    }
    const s = STATUS[st.status] || STATUS.none;
    const toConnect = needsAction(st.status) || (st.status === 'manual' && !st.handle && !st.url);
    return { label: s.label, kind: s.kind, href: toConnect ? '#/ket-noi/' + id : '#/kenh/' + id };
  }
  function pillHtml(id, title) {
    const p = pillFor(id);
    const t = needsAction(chState(id).status) ? 'Bấm để kết nối' : 'Xem chi tiết';
    return '<a class="pill k-' + p.kind + '" href="' + p.href + '" title="' + esc(title || t) + '">' + esc(p.label) + '</a>';
  }
  function tileLine(id) {
    const c = chById(id), st = chState(id);
    if (id === 'email') { const r = todayJobs('email'); return 'Hôm nay đã nhận ' + r.seen + '/' + r.due + ' bản tin tới giờ'; }
    if (id === 'website') {
      const j = D.jobs.find((x) => x.id === 'web'), pub = liveSummary().pub;
      return (pub ? 'Đăng gần nhất ' + fmtFull(pub.t) + ' · ' : '') + 'Lần tới: ' + fmtHM(nextRun(j)) + ' (' + rel(nextRun(j)) + ')';
    }
    if (c.workflow) { const s = c.steps.find((x) => !(S.video[weekKey()] || {})[x.id]); return s ? 'Bước tiếp: ' + s.text : 'Đã xong mọi bước tuần này'; }
    if (needsAction(st.status)) return id === 'lead' ? 'Bấm "Chưa tạo" để làm theo từng bước' : 'Bấm "Chưa kết nối" để đăng nhập và kết nối';
    if (st.status === 'manual' && !st.handle && !st.url) return 'Tự đăng · bấm để lưu tài khoản';
    const parts = [];
    if (st.handle) parts.push(st.handle);
    if (st.method === 'vidiq') parts.push('Claude đăng qua vidIQ');
    else if (st.method === 'tu-chu') parts.push('Tự đăng');
    return parts.join(' · ') || st.note || c.desc;
  }

  /* ---------- Lịch tự động ---------- */
  function nextRun(job, from) {
    from = from == null ? now() : from;
    const today = dayKey(from);
    for (let i = 0; i < 9; i++) {
      const k = addDays(today, i);
      if (!job.days.includes(weekdayOf(k))) continue;
      for (const t of job.times) { const ms = vnMs(k, t); if (ms > from) return ms; }
    }
    return null;
  }
  function occurrences(job, key) {
    if (job.quiet || !job.days.includes(weekdayOf(key))) return []; // quiet: việc chạy ngầm, không có gì để "nhận"
    return job.times.map((t) => ({ job, key, time: t, ms: vnMs(key, t), id: job.id + '@' + t }));
  }
  function todayJobs(channel) {
    const k = dayKey();
    let due = 0, cnt = 0;
    for (const j of D.jobs) {
      if (channel && j.channel !== channel) continue;
      for (const o of occurrences(j, k)) if (o.ms <= now()) { due++; if (seenInfo(o)) cnt++; }
    }
    return { due, seen: cnt };
  }

  /* ---------- Trạng thái trực tiếp: đọc lịch sử đăng bài công khai của website trên GitHub ---------- */
  // Không cần đăng nhập. Website chỉ đăng được khi bản tin đã về, nên một bài lên web = bot đó đã chạy.
  const LIVE_KEY = 'tq-live-v1', LIVE_TTL = 10 * 60e3;
  let LIVE = { at: 0, tried: 0, commits: [], runs: [], err: '', status: null };
  // Báo cáo của agent điều hành: coi là dữ liệu, cắt ngắn và ép kiểu từng trường trước khi dùng
  function cleanStatus(j) {
    if (!j || typeof j !== 'object') return null;
    const str = (v, n) => String(v == null ? '' : v).slice(0, n);
    const t = Date.parse(j.at);
    if (isNaN(t)) return null;
    const num = (v) => Math.max(0, parseInt(v, 10) || 0);
    return {
      at: t, mode: str(j.mode, 12), headline: str(j.headline, 200), note: str(j.note, 240), pending: num(j.pending),
      bots: (Array.isArray(j.bots) ? j.bots : []).slice(0, 30).map((b) => ({ id: str(b && b.id, 30), ok: !!b && b.ok === true, time: /^\d{2}:\d{2}$/.test(b && b.time) ? b.time : '', note: str(b && b.note, 160) })),
      tasks: (Array.isArray(j.tasks) ? j.tasks : []).slice(0, 12).map((x) => str(x, 140)),
      lead: j.lead && typeof j.lead === 'object' ? { tong: num(j.lead.tong), moi: num(j.lead.moi), canNhan: num(j.lead.canNhan) } : null
    };
  }
  try { const raw = localStorage.getItem(LIVE_KEY); if (raw) LIVE = Object.assign(LIVE, JSON.parse(raw), { err: '' }); } catch (e) { /* bỏ qua */ }
  let liveBusy = false;
  async function liveRefresh(force) {
    const L = D.live;
    if (!L || liveBusy || (!force && now() - Math.max(LIVE.at, LIVE.tried) < LIVE_TTL)) return;
    liveBusy = true;
    if (D.status && D.status.url) {
      try {
        const s = await fetch(D.status.url + '?t=' + Math.floor(now() / 3e5), { cache: 'no-store' });
        if (s.ok) { LIVE.status = cleanStatus(await s.json()); try { localStorage.setItem(LIVE_KEY, JSON.stringify(LIVE)); } catch (e) { /* bỏ qua */ } }
      } catch (e) { /* chưa có báo cáo hoặc mất mạng: bỏ qua */ }
    }
    try {
      const api = 'https://api.github.com/repos/' + L.repo;
      const [c, r] = await Promise.all([fetch(api + '/commits?per_page=60'), fetch(api + '/actions/runs?per_page=12')]);
      if (!c.ok || !r.ok) throw new Error((c.status === 403 || r.status === 403 || c.status === 429 || r.status === 429) ? 'GitHub tạm giới hạn lượt đọc, thử lại sau ít phút.' : 'GitHub trả lỗi ' + (c.ok ? r.status : c.status) + '.');
      const cj = await c.json(), rj = await r.json();
      LIVE = {
        at: now(), tried: now(), err: '', status: LIVE.status,
        commits: (Array.isArray(cj) ? cj : []).map((x) => ({ t: Date.parse(x.commit.committer.date), m: String(x.commit.message).split('\n')[0].slice(0, 120) })),
        runs: ((rj && rj.workflow_runs) || []).map((x) => ({ t: Date.parse(x.created_at), n: String(x.name), s: String(x.status), c: String(x.conclusion), u: String(x.html_url) }))
      };
      try { localStorage.setItem(LIVE_KEY, JSON.stringify(LIVE)); } catch (e) { /* bỏ qua */ }
      if (force) toast('Đã đọc lại từ GitHub');
    } catch (e) {
      LIVE.err = (e && e.message && /GitHub/.test(e.message)) ? e.message : 'Không đọc được GitHub (kiểm tra mạng).';
      LIVE.tried = now();
    }
    liveBusy = false;
    const { route } = parse();
    const busy = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if ((route === '' || route === 'lich' || route === 'doi') && !busy) rerender();
  }
  // Bằng chứng một lần chạy đã ra kết quả: có commit đúng loại trên website sau giờ chạy
  function liveProof(o) {
    const p = o.job.proof;
    if (!p || !LIVE.commits.length) return null;
    const end = o.ms + (o.job.proofHours || 14) * H;
    const hits = LIVE.commits.filter((c) => c.t >= o.ms - 10 * 60e3 && c.t <= end && c.m.indexOf(p) === 0);
    return hits.length ? hits[hits.length - 1].t : null; // commit sớm nhất
  }
  function seenInfo(o) {
    const manual = (S.jobsSeen[o.key] || {})[o.id];
    if (manual) return { at: Date.parse(manual), auto: false };
    const t = liveProof(o);
    if (t) return { at: t, auto: true };
    const st = LIVE.status; // agent điều hành đã kiểm tra và báo bot này ra kết quả
    if (st && dayKey(st.at) === o.key && o.ms <= st.at) {
      const b = st.bots.find((x) => x.id === o.job.id && x.ok);
      if (b) return { at: b.time ? Math.max(vnMs(o.key, b.time), o.ms) : st.at, auto: true };
    }
    return null;
  }
  const CONTENT_NAMES = { 'diem-tin': 'Điểm tin', 'nhan-dinh': 'Nhận định', 'tong-ket': 'Tổng kết phiên', 'bao-cao': 'Báo cáo' };
  function liveSummary() {
    const pub = LIVE.commits.find((c) => c.m.indexOf('content: publish') === 0);
    const dep = LIVE.runs.find((r) => r.n === 'Deploy');
    const k = dayKey();
    const today = [];
    for (const c of LIVE.commits) {
      const m = /^content\(([a-z-]+)\)/.exec(c.m);
      if (m && dayKey(c.t) === k) { const n = CONTENT_NAMES[m[1]] || m[1]; if (!today.includes(n)) today.unshift(n); }
    }
    const depState = !dep ? null : dep.s !== 'completed' ? 'run' : dep.c === 'success' ? 'ok' : 'bad';
    return { pub, dep, depState, today };
  }
  function liveCard() {
    if (!D.live) return '';
    const s = liveSummary();
    const rows = [];
    if (D.check) rows.push('<li><span class="dot ' + (D.check.ok ? 'ok' : 'warn') + '"></span><div class="body"><b>Claude kiểm tra ngày ' + fmtDate(D.check.at) + '</b><div class="tag">' + esc(D.check.text) + '</div></div></li>');
    if (LIVE.at) {
      rows.push('<li><span class="dot ' + (s.pub ? 'ok' : 'info') + '"></span><div class="body"><b>Website: lần đăng gần nhất</b><div class="tag">' + (s.pub ? fmtFull(s.pub.t) + ' (' + rel(s.pub.t) + ')' : 'Chưa thấy lần đăng nào gần đây') + '</div></div></li>');
      if (s.dep) {
        const u = s.dep.u.indexOf('https://github.com/') === 0 ? s.dep.u : D.links.websiteActions;
        rows.push('<li><span class="dot ' + ({ ok: 'ok', bad: 'bad', run: 'info' }[s.depState]) + '"></span><div class="body"><b>' + ({ ok: 'Website lên sóng thành công', bad: 'Website đăng bị lỗi', run: 'Website đang cập nhật' }[s.depState]) + '</b><div class="tag">' + fmtFull(s.dep.t) + (s.depState === 'bad' ? ' · Nhắn Claude Code kèm ảnh chụp trang lỗi' : '') + '</div></div><a class="btn small ext" href="' + esc(u) + '" target="_blank" rel="noopener">Xem</a></li>');
      }
      rows.push('<li><span class="dot ' + (s.today.length ? 'ok' : 'info') + '"></span><div class="body"><b>Hôm nay đã lên website</b><div class="tag">' + (s.today.length ? esc(s.today.join(' · ')) : 'Chưa có bài nào hôm nay') + '</div></div></li>');
    }
    const foot = LIVE.err ? '<span class="dot warn"></span> ' + esc(LIVE.err) : LIVE.at ? 'Tự đọc từ GitHub lúc ' + fmtHM(LIVE.at) + ', 10 phút đọc lại một lần.' : 'Đang đọc từ GitHub…';
    return '<div class="card" id="truc-tiep"><div class="card-head"><h2>Trạng thái trực tiếp</h2><button class="btn small right" data-act="live-refresh" type="button">Làm mới</button></div>' +
      '<ul class="list">' + rows.join('') + '</ul><p class="muted small">' + foot + '</p></div>';
  }
  const gmailSearch = (subject) => 'https://mail.google.com/mail/u/0/#search/' + encodeURIComponent('subject:"' + subject + '" newer_than:2d');

  function marketStatus() {
    const d = vn(), wd = d.getUTCDay(), m = d.getUTCHours() * 60 + d.getUTCMinutes();
    if (wd === 0 || wd === 6) return { text: 'Cuối tuần, thị trường nghỉ', kind: 'muted' };
    if (m < 540) return { text: 'Chưa mở phiên (9h00)', kind: 'muted' };
    if (m < 555) return { text: 'Phiên ATO', kind: 'info' };
    if (m < 690) return { text: 'Đang khớp lệnh sáng', kind: 'ok' };
    if (m < 780) return { text: 'Nghỉ trưa', kind: 'muted' };
    if (m < 870) return { text: 'Đang khớp lệnh chiều', kind: 'ok' };
    if (m < 885) return { text: 'Phiên ATC', kind: 'info' };
    if (m < 900) return { text: 'Giao dịch thoả thuận', kind: 'muted' };
    return { text: 'Đã đóng phiên', kind: 'muted' };
  }

  /* ---------- Việc trong ngày ---------- */
  function dailyToday() {
    const k = dayKey(), wd = weekdayOf(k);
    return D.daily.filter((x) => x.days.includes(wd)).sort((a, b) => a.time.localeCompare(b.time));
  }

  /* ---------- Bố cục chung ---------- */
  const NAV = [
    ['', 'Hôm nay'], ['tim-khach', 'Phễu khách'], ['doi', 'Đội ngũ'], ['dang-bai', 'Đăng bài'], ['lich', 'Lịch'], ['claude', 'Trợ lý Claude'], ['nhat-ky', 'Nhật ký'], ['cai-dat', 'Cài đặt']
  ];
  function renderNav(route) {
    const pending = D.channels.filter((c) => needsAction(chState(c.id).status)).length;
    $('#nav').innerHTML = NAV.map(([r, label]) => {
      const cur = (route === r) || (r === '' && (route === 'kenh' || route === 'ket-noi'));
      const badge = r === '' && pending ? '<span class="count" title="Kênh cần kết nối">' + pending + '</span>' : '';
      return '<a href="#/' + r + '"' + (cur ? ' aria-current="page"' : '') + '>' + label + badge + '</a>';
    }).join('');
  }
  function renderClock() {
    const d = vn();
    $('#clock').innerHTML = '<b class="num">' + fmtHM(now()) + '</b><br><span class="date">' + WD_LONG[d.getUTCDay()] + ', ' + fmtDM(now()) + ' · </span>' + esc(marketStatus().text);
  }

  /* ---------- Đội ngũ: trạng thái từng thành viên ---------- */
  const GRACE = 40 * 60e3;
  const statusToday = () => (LIVE.status && dayKey(LIVE.status.at) === dayKey() ? LIVE.status : null);
  // Có cách nào tự biết lượt chạy này đã ra kết quả hay chưa?
  function verifiable(o) {
    if (o.job.proof) return LIVE.commits.length > 0;
    const st = LIVE.status;
    return !!(st && dayKey(st.at) === o.key && st.at >= o.ms + GRACE);
  }
  function occState(o) {
    const got = seenInfo(o);
    if (got) return { kind: 'ok', got };
    if (o.ms > now()) return { kind: 'wait' };
    if (now() - o.ms <= GRACE) return { kind: 'run' };
    return { kind: verifiable(o) ? 'late' : 'unknown' };
  }
  function memberState(m) {
    if (m.human) return { kind: 'info', label: 'Con người' };
    if (m.needs) return needsAction(chState(m.needs).status) ? { kind: 'warn', label: 'Chưa cài', href: '#/tim-khach' } : { kind: 'ok', label: 'Đang chạy' };
    const k = dayKey();
    let total = 0, due = 0, got = 0, late = 0, unknown = 0;
    for (const id of m.jobs) {
      const j = D.jobs.find((x) => x.id === id);
      if (!j) continue;
      for (const o of occurrences(j, k)) {
        total++;
        const s = occState(o).kind;
        if (s !== 'wait') due++;
        if (s === 'ok') got++; else if (s === 'late') late++; else if (s === 'unknown') unknown++;
      }
    }
    if (late) return { kind: 'warn', label: 'Thiếu ' + late + ' kết quả', href: '#/lich' };
    if (due && got === due) return { kind: 'ok', label: 'Xong ' + got + '/' + due + ' hôm nay' };
    if (unknown) return { kind: 'muted', label: 'Chưa xác nhận', href: '#/lich' };
    if (due) return { kind: 'info', label: 'Đang chạy' };
    return { kind: 'muted', label: total ? 'Chưa tới giờ' : 'Hôm nay nghỉ' };
  }
  function memberPill(m) {
    const s = memberState(m);
    return s.href ? '<a class="pill k-' + s.kind + '" href="' + s.href + '">' + esc(s.label) + '</a>' : '<span class="pill k-' + s.kind + '">' + esc(s.label) + '</span>';
  }

  /* ---------- Trang: Hôm nay ---------- */
  function goLink(go) {
    return go ? '<a href="' + esc(go) + '"' + (go.indexOf('https://') === 0 ? ' target="_blank" rel="noopener"' : '') + '>Làm ›</a>' : '';
  }
  function timeline() {
    const k = dayKey(), doneMap = S.daily[k] || {};
    const rows = dailyToday().map((x) => ({ ms: vnMs(k, x.time), me: x }))
      .concat(D.jobs.flatMap((j) => occurrences(j, k)).map((o) => ({ ms: o.ms, bot: o })))
      .sort((a, b) => a.ms - b.ms || (a.bot ? -1 : 1));
    if (!rows.length) return '<p class="empty">Hôm nay không có việc nào.</p>';
    let marked = false, html = '';
    for (const r of rows) {
      if (!marked && r.ms > now()) { html += '<div class="tl-now"><span>Bây giờ ' + fmtHM(now()) + '</span></div>'; marked = true; }
      if (r.me) {
        const x = r.me, done = doneMap[x.id];
        html += '<label class="tl me' + (done ? ' done' : '') + (!done && r.ms <= now() ? ' late' : '') + '"><time>' + x.time + '</time>' +
          '<input type="checkbox" data-act="toggle-daily" data-id="' + esc(x.id) + '"' + (done ? ' checked' : '') + '>' +
          '<span class="t"><span class="who me">Bạn</span>' + esc(x.text) + '</span>' + goLink(x.go) + '</label>';
      } else {
        const o = r.bot, s = occState(o);
        const pill = s.kind === 'ok' ? '<span class="pill k-ok">Xong ' + fmtHM(s.got.at) + '</span>' :
          s.kind === 'late' ? '<a class="pill k-warn" href="#/lich">Chưa thấy kết quả</a>' :
          s.kind === 'unknown' ? '<a class="pill k-muted" href="#/lich">Chưa xác nhận</a>' :
          s.kind === 'run' ? '<span class="pill k-info">Đang chạy</span>' : '';
        html += '<div class="tl bot' + (s.kind === 'ok' ? ' done' : '') + '"><time>' + o.time + '</time><span class="botic" aria-hidden="true">●</span>' +
          '<span class="t"><span class="who">Đội bot</span>' + esc(o.job.name) + '</span>' + pill + '</div>';
      }
    }
    if (!marked) html += '<div class="tl-now"><span>Bây giờ ' + fmtHM(now()) + ' · hết việc trong ngày</span></div>';
    return html;
  }
  function funnelStrip() {
    const f = S.funnel[weekKey()] || {}, g = S.goals || {};
    return '<a class="fstrip" href="#/tim-khach" title="Mở Phễu khách">' + FUNNEL.map(([key, l], i) => {
      const v = +f[key] || 0, goal = +g[key] || 0;
      const prev = i ? (+f[FUNNEL[i - 1][0]] || 0) : 0;
      const conv = i && prev ? Math.round(v / prev * 100) + '% từ bước trước' : (i ? '—' : 'đầu phễu');
      return '<div class="fs' + (goal && v >= goal ? ' hit' : '') + '"><div class="fs-l">' + l + '</div><div class="fs-v num">' + v + (goal ? '<small> / ' + goal + '</small>' : '') + '</div><div class="fs-c">' + conv + '</div></div>';
    }).join('<span class="fs-arrow" aria-hidden="true">›</span>') + '</a>';
  }
  function pageHome() {
    const k = dayKey();
    const items = dailyToday();
    const doneMap = S.daily[k] || {};
    const doneN = items.filter((x) => doneMap[x.id]).length;
    const jt = todayJobs();
    const occToday = D.jobs.flatMap((j) => occurrences(j, k)).length;
    const todo = D.channels.filter((c) => needsAction(chState(c.id).status));
    const st = statusToday();
    const hour = vn().getUTCHours();
    const hello = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
    const next = items.find((x) => !doneMap[x.id]);
    const f = S.funnel[weekKey()] || {};
    const funnelEmpty = !FUNNEL.some(([key]) => +f[key]);
    const line = st && st.headline ? st.headline : (items.length ? 'Hôm nay có ' + items.length + ' việc cần bạn làm' : 'Hôm nay không có việc tay') + ', đội bot có ' + occToday + ' lượt chạy.';
    const leadNote = st && st.lead ? 'Sheet khách: ' + st.lead.moi + ' đăng ký mới tuần này · ' + st.lead.canNhan + ' người cần nhắn hôm nay.' :
      (needsAction(chState('lead').status) ? 'Chưa có Form đăng ký nên phễu chưa đếm được. Cài trong 3 phút ở mục Phễu khách.' : (funnelEmpty ? 'Chưa nhập số tuần này. Bấm vào để cập nhật.' : ''));

    return '<section class="hero"><div class="hero-main"><div class="eyebrow">' + WD_LONG[weekdayOf(k)] + ' ' + fmtDM(now()) + ' · ' + esc(marketStatus().text) + '</div>' +
      '<h1>' + hello + ', Thiên Quốc</h1><p class="hero-line">' + esc(line) + '</p>' +
      (st ? '<p class="hero-src">Agent điều hành báo lúc ' + fmtHM(st.at) + '</p>' : '') +
      '<div class="btns">' + (next ? '<a class="btn hero-btn" href="' + esc(next.go || '#viec-hom-nay') + '"' + (next.go && next.go.indexOf('https://') === 0 ? ' target="_blank" rel="noopener"' : '') + '>Việc tiếp theo · ' + next.time + ' ' + esc(next.text.length > 44 ? next.text.slice(0, 42) + '…' : next.text) + '</a>' : '') +
      '<a class="btn hero-btn ghost ext" href="' + D.links.gmail + '" target="_blank" rel="noopener">Mở Gmail</a></div></div>' +
      '<div class="hero-kpi">' +
      '<a class="kpi" href="#viec-hom-nay"><b class="num">' + doneN + '<small>/' + items.length + '</small></b><span>việc của bạn đã xong</span></a>' +
      '<a class="kpi" href="#/doi"><b class="num">' + jt.seen + '<small>/' + jt.due + '</small></b><span>lượt bot đã có kết quả</span></a>' +
      '<a class="kpi" href="' + (st && st.pending ? D.links.gmail : '#/dang-bai') + '"' + (st && st.pending ? ' target="_blank" rel="noopener"' : '') + '><b class="num">' + (st ? st.pending : S.drafts.filter((d) => !Object.keys(d.posted || {}).length).length) + '</b><span>' + (st ? 'bài chờ bạn duyệt' : 'bài nháp chưa đăng') + '</span></a>' +
      '</div></section>' +

      '<section class="fwrap"><div class="fhead"><h2>Phễu khách tuần này</h2><span class="muted small">' + esc(leadNote) + '</span></div>' + funnelStrip() + '</section>' +

      '<div class="grid2"><div>' +
      '<div class="card" id="viec-hom-nay"><div class="card-head"><h2>Dòng việc hôm nay</h2><span class="right muted small">Bạn và đội bot, theo giờ</span></div>' + timeline() + '</div>' +
      '<div class="card" id="gan-day"><div class="card-head"><h2>Nhật ký gần đây</h2><a class="right small" href="#/nhat-ky">Tất cả</a></div>' + logList(S.log.slice(0, 5)) + '</div>' +
      '</div><div>' +
      (todo.length ? '<div class="card" id="can-xu-ly"><div class="card-head"><h2>Cần xử lý</h2></div><ul class="list">' +
        todo.map((c) => '<li><span class="dot warn"></span><div class="body"><b>' + c.icon + ' ' + esc(c.name) + '</b><div class="tag">' + esc(chState(c.id).note || c.desc) + '</div></div><a class="btn small primary" href="' + (c.id === 'lead' ? '#/tim-khach' : '#/ket-noi/' + c.id) + '">' + (c.id === 'lead' ? 'Cài' : 'Kết nối') + '</a></li>').join('') + '</ul></div>' : '') +
      '<div class="card" id="doi-mini"><div class="card-head"><h2>Đội ngũ</h2><a class="right small" href="#/doi">Xem cả đội</a></div><ul class="list">' +
      D.team.map((m) => '<li><span class="mic" aria-hidden="true">' + m.icon + '</span><div class="body"><b>' + esc(m.role) + '</b><div class="tag">' + esc(m.short) + '</div></div>' + memberPill(m) + '</li>').join('') + '</ul></div>' +
      liveCard() +
      '<div class="card" id="cac-kenh"><div class="card-head"><h2>Kênh</h2></div><ul class="list">' +
      D.channels.map((c) => '<li id="tile-' + c.id + '"><span class="mic" aria-hidden="true">' + c.icon + '</span><div class="body"><a href="#/kenh/' + c.id + '"><b>' + esc(c.name) + '</b></a><div class="tag">' + esc(tileLine(c.id)) + '</div></div>' + pillHtml(c.id) + '</li>').join('') + '</ul></div>' +
      '</div></div>';
  }

  /* ---------- Trang: Đội ngũ ---------- */
  const STAGES = [
    ['thu-hut', 'Thu hút người xem', 'Làm cho người chưa biết kênh dừng lại xem.'],
    ['nuoi', 'Nuôi dưỡng niềm tin', 'Cho người xem lý do quay lại mỗi ngày.'],
    ['chuyen', 'Chuyển thành khách', 'Từ người đăng ký tới buổi trao đổi và mở tài khoản.'],
    ['dieu-phoi', 'Điều phối', 'Giữ cả đội chạy đúng giờ, đúng quy tắc nội dung.']
  ];
  function jobLine(j) {
    const days = j.days.length === 7 ? 'Mỗi ngày' : j.days.map((d) => WD[d]).join(' ');
    return '<li><span class="dot info"></span><div class="body">' + esc(j.name) + '<div class="tag">' + days + ' · ' + j.times.join(', ') + ' · lần tới ' + fmtFull(nextRun(j)) + '</div></div>' +
      (j.subject ? '<a class="small" href="' + gmailSearch(j.subject) + '" target="_blank" rel="noopener">Gmail ↗</a>' : j.link ? '<a class="small" href="' + esc(j.link) + '" target="_blank" rel="noopener">Xem ↗</a>' : '') + '</li>';
  }
  function pageTeam() {
    const st = LIVE.status;
    const report = st ? '<div class="card" id="bao-cao-agent"><div class="card-head"><h2>Báo cáo gần nhất của agent điều hành</h2><span class="right muted small">' + fmtFull(st.at) + ' (' + rel(st.at) + ')</span></div>' +
      '<p class="hero-line" style="margin:0 0 10px">' + esc(st.headline || '—') + '</p>' +
      (st.tasks.length ? '<ul class="list">' + st.tasks.map((t) => '<li><span class="dot info"></span><div class="body">' + esc(t) + '</div></li>').join('') + '</ul>' : '') +
      (st.bots.some((b) => !b.ok) ? '<ul class="list">' + st.bots.filter((b) => !b.ok).map((b) => { const j = D.jobs.find((x) => x.id === b.id); return '<li><span class="dot warn"></span><div class="body"><b>' + esc(j ? j.name : b.id) + '</b><div class="tag">' + esc(b.note || 'Chưa có kết quả') + '</div></div></li>'; }).join('') + '</ul>' : '') +
      (st.note ? '<p class="muted small" style="margin:10px 0 0">' + esc(st.note) + '</p>' : '') + '</div>' :
      '<div class="note">Agent điều hành sẽ tự ghi báo cáo lên đây sau mỗi lần chạy sáng (7h15) và chiều (17h40). Chưa có báo cáo nào.</div>';
    return '<div class="pagehead"><div class="grow"><h1>Đội ngũ</h1><p>Mỗi bot là một thành viên có việc riêng trong phễu tìm khách. Bạn là người duy nhất nói chuyện với khách và chốt.</p></div>' +
      '<div class="btns"><a class="btn" href="#/lich">Lịch chạy chi tiết</a></div></div>' + report +
      '<div class="flow">' + STAGES.map(([id, name]) => '<span>' + name + '</span>').join('<i aria-hidden="true">→</i>') + '</div>' +
      STAGES.map(([id, name, why]) => {
        const ms = D.team.filter((m) => m.stage === id);
        if (!ms.length) return '';
        return '<div class="stage-head"><h2>' + name + '</h2><span class="muted small">' + why + '</span></div><div class="members">' + ms.map((m) => {
          const jobs = (m.jobs || []).map((id2) => D.jobs.find((x) => x.id === id2)).filter(Boolean);
          return '<div class="member" id="tv-' + m.id + '"><div class="mrow"><span class="mic big" aria-hidden="true">' + m.icon + '</span><div class="grow"><div class="role">' + esc(m.role) + '</div><div class="muted small">' + esc(m.kind) + '</div></div>' + memberPill(m) + '</div>' +
            '<p>' + esc(m.does) + '</p>' +
            (jobs.length ? '<ul class="list">' + jobs.map(jobLine).join('') + '</ul>' : '') +
            (m.hands ? '<p class="hands"><b>Bàn giao:</b> ' + esc(m.hands) + '</p>' : '') +
            (m.go ? '<div class="btns"><a class="btn small" href="' + esc(m.go[1]) + '">' + esc(m.go[0]) + '</a></div>' : '') + '</div>';
        }).join('') + '</div>';
      }).join('');
  }

  function checkRow(act, id, text, done, when, go, extra) {
    return '<label class="check' + (done ? ' done' : '') + '"><input type="checkbox" data-act="' + act + '" data-id="' + esc(id) + '"' + (extra || '') + (done ? ' checked' : '') + '>' +
      '<span class="t">' + esc(text) + (done ? '<br><span class="when">Xong lúc ' + fmtFull(done) + '</span>' : '') + '</span>' +
      (when ? '<span class="when">' + esc(when) + '</span>' : '') +
      (go ? '<a href="' + esc(go) + '"' + (go.indexOf('https://') === 0 ? ' target="_blank" rel="noopener"' : '') + '>Làm ›</a>' : '') + '</label>';
  }

  function logList(rows, empty) {
    if (!rows.length) return '<p class="empty">' + (empty || 'Chưa có gì. Các việc bạn đánh dấu, kết nối, bài đã đăng sẽ hiện ở đây.') + '</p>';
    return '<ul class="list">' + rows.map((r) => {
      const c = chById(r.ch);
      return '<li><span class="dot ' + esc(r.kind) + '"></span><time>' + fmtFull(r.at) + '</time><div class="body">' + esc(r.text) + (c ? '<div class="tag">' + c.icon + ' ' + esc(c.name) + '</div>' : '') + '</div></li>';
    }).join('') + '</ul>';
  }

  /* ---------- Trang: Chi tiết kênh ---------- */
  function pageChannel(id) {
    const c = chById(id);
    if (!c) return pageNotFound();
    const st = chState(id);
    const jobs = D.jobs.filter((j) => j.channel === id || (id === 'facebook' || id === 'tiktok' || id === 'threads') && j.id === 'tim-khach');
    const daily = D.daily.filter((x) => x.channel === id);
    const tasksDone = S.tasks[id] || {};
    const log = S.log.filter((r) => r.ch === id).slice(0, 30);
    const p = pillFor(id);
    let html = '<div class="crumbs"><a href="#/">Hôm nay</a> › ' + esc(c.name) + '</div>' +
      '<div class="pagehead"><div class="grow"><h1>' + c.icon + ' ' + esc(c.name) + '</h1><p>' + esc(c.desc) + '</p></div>' +
      '<div class="btns">' + (c.group === 'social' ? '<a class="btn" href="#/dang-bai/' + id + '">Soạn & đăng bài</a>' : '') +
      (c.connect ? '<a class="btn primary" href="#/ket-noi/' + id + '">' + (needsAction(st.status) ? (id === 'lead' ? 'Bắt đầu tạo' : 'Kết nối ngay') : 'Quản lý kết nối') + '</a>' : '') + '</div></div>' +
      '<div class="grid2"><div>';

    if (c.workflow) {
      const w = S.video[weekKey()] || {};
      const pr = videoProgress();
      html += '<div class="card" id="tien-do"><div class="card-head"><h2>Tiến độ tuần này</h2><span class="right pill k-' + p.kind + '">' + esc(p.label) + '</span></div>' +
        '<p class="muted small">Tuần bắt đầu ' + fmtDate(weekKey() + 'T00:00:00+07:00') + '. Tự làm mới mỗi thứ Hai.</p>' +
        '<div class="bar"><i style="width:' + Math.round(pr.done / pr.total * 100) + '%"></i></div>' +
        c.steps.map((s) => checkRow('toggle-video', s.id, s.text, w[s.id])).join('') + '</div>';
    } else {
      html += '<div class="card" id="ket-noi"><div class="card-head"><h2>Kết nối</h2><span class="right">' + pillHtml(id) + '</span></div>' +
        '<dl class="kv">' +
        (st.method ? '<dt>Cách</dt><dd>' + esc(methodName(c, st.method)) + '</dd>' : '') +
        (st.handle ? '<dt>Tài khoản</dt><dd>' + esc(st.handle) + '</dd>' : '') +
        (st.url ? '<dt>Link</dt><dd><a href="' + esc(st.url) + '" target="_blank" rel="noopener">' + esc(st.url) + '</a></dd>' : '') +
        (st.since ? '<dt>Từ</dt><dd>' + fmtFull(st.since) + '</dd>' : '') +
        (st.note ? '<dt>Ghi chú</dt><dd>' + esc(st.note) + '</dd>' : '') +
        (st.fromSeed ? '<dt>Nguồn</dt><dd class="muted">Claude kiểm tra ngày ' + fmtDate(D.asOf + 'T12:00:00+07:00') + '. Bấm Quản lý kết nối để cập nhật.</dd>' : '') +
        '</dl>' +
        (needsAction(st.status) ? '<div class="btns" style="margin-top:14px"><a class="btn primary" href="#/ket-noi/' + id + '">' + (id === 'lead' ? 'Làm theo từng bước' : 'Đăng nhập & kết nối') + ' →</a></div>' : '') +
        '</div>';
    }

    html += '<div class="card" id="mo-nhanh"><h2>Mở nhanh</h2><div class="btns">' +
      c.links.map((l) => '<a class="btn' + (l.url.startsWith('#') ? '' : ' ext') + '" href="' + esc(l.url) + '"' + (l.url.startsWith('#') ? '' : ' target="_blank" rel="noopener"') + '>' + esc(l.label) + '</a>').join('') + '</div></div>';

    if (c.tasks && c.tasks.length) {
      const n = c.tasks.filter((_, i) => tasksDone[i]).length;
      html += '<div class="card" id="viec-can-lam"><div class="card-head"><h2>Việc cần làm một lần</h2><span class="right muted small">' + n + '/' + c.tasks.length + '</span></div>' +
        c.tasks.map((t, i) => checkRow('toggle-task', String(i), t, tasksDone[i], '', '', ' data-ch="' + id + '"')).join('') + '</div>';
    }

    html += '<div class="card" id="nhat-ky-kenh"><h2>Nhật ký kênh</h2>' +
      '<form class="inline" data-form="add-log" data-ch="' + id + '" style="margin-bottom:8px"><input type="text" name="text" placeholder="Ghi lại việc vừa làm, ví dụ: Đăng video tổng kết 12/11" aria-label="Nội dung nhật ký" required><button class="btn" type="submit">Ghi</button></form>' +
      logList(log, 'Chưa có việc nào được ghi cho kênh này.') + '</div>';

    html += '</div><div>';
    if (jobs.length || daily.length) {
      html += '<div class="card" id="lich-kenh"><h2>Lịch liên quan</h2><ul class="list">' +
        jobs.map((j) => '<li><span class="dot info"></span><div class="body">' + esc(j.name) + '<div class="tag">' + j.days.map((d) => WD[d]).join(', ') + ' · ' + j.times.join(', ') + ' · tới: ' + fmtFull(nextRun(j)) + '</div></div><a class="small" href="' + gmailSearch(j.subject) + '" target="_blank" rel="noopener">Gmail</a></li>').join('') +
        daily.map((x) => '<li><span class="dot warn"></span><div class="body">' + esc(x.text) + '<div class="tag">Việc tay · ' + x.days.map((d) => WD[d]).join(', ') + ' · ' + x.time + '</div></div></li>').join('') +
        '</ul></div>';
    }
    html += '<div class="card" id="ghi-chu"><h2>Ghi chú</h2><textarea data-notes="' + id + '" placeholder="Mật khẩu KHÔNG ghi ở đây. Ghi ý tưởng, việc cần nhớ...">' + esc(S.notes[id] || '') + '</textarea><p class="muted small">Tự lưu trên trình duyệt này.</p></div>';
    html += '</div></div>';
    return html;
  }

  /* ---------- Trang: Kết nối ---------- */
  const UI = { method: {}, draftId: null };
  function pageConnect(id) {
    const c = chById(id);
    if (!c) return pageNotFound();
    if (!c.connect) { location.hash = '#/kenh/' + id; return ''; }
    const st = chState(id);
    const methods = c.connect.methods;
    const mid = UI.method[id] || (methods.find((m) => m.id === st.method) || methods[0]).id;
    UI.method[id] = mid;
    const m = methods.find((x) => x.id === mid);
    const f = c.connect.idField;
    const curVal = f.kind === 'url' ? (st.url || '') : (st.handle || '');

    let html = '<div class="crumbs"><a href="#/">Hôm nay</a> › <a href="#/kenh/' + id + '">' + esc(c.name) + '</a> › Kết nối</div>' +
      '<div class="pagehead"><div class="grow"><h1>' + (id === 'lead' ? 'Tạo' : 'Kết nối') + ' ' + c.icon + ' ' + esc(c.name) + '</h1><p>Làm lần lượt từng bước. Nút có dấu ↗ mở trang đăng nhập chính thức ở tab mới, bạn tự đăng nhập ở đó. Trang này không bao giờ hỏi mật khẩu.</p></div>' +
      '<div class="status-big">' + pillHtml(id) + '</div></div>';

    if (st.note && needsAction(st.status)) html += '<p class="note warn">' + esc(st.note) + '</p>';

    if (methods.length > 1) {
      html += '<h2 style="margin-bottom:10px">Chọn cách kết nối</h2><div class="methods" role="group" aria-label="Cách kết nối">' +
        methods.map((x) => '<button class="method" type="button" data-act="pick-method" data-ch="' + id + '" data-id="' + x.id + '" aria-pressed="' + (x.id === mid) + '"><span class="badge">' + esc(x.badge) + '</span><b>' + esc(x.name) + '</b><span class="d">' + esc(x.text) + '</span></button>').join('') + '</div>';
    } else {
      html += '<p class="note">' + esc(m.text) + '</p>';
    }

    html += '<div class="card" id="cac-buoc"><h2>Các bước: ' + esc(m.name) + '</h2><ol class="steps">' +
      m.steps.map((s) => '<li><h3>' + esc(s.title) + '</h3>' + (s.text ? '<p>' + esc(s.text) + '</p>' : '') +
        (s.copy ? '<div class="copybox"><code>' + esc(s.copy) + '</code><button class="btn small" type="button" data-act="copy" data-text="' + esc(s.copy) + '">Copy</button></div>' : '') +
        (s.actions ? '<div class="btns">' + s.actions.map((a, i) => '<a class="btn ext' + (i === 0 ? ' primary' : '') + '" href="' + esc(a.url) + '" target="_blank" rel="noopener">' + esc(a.label) + '</a>').join('') + '</div>' : '') + '</li>').join('') +
      '</ol>' +
      '<form class="confirm" data-form="connect" data-ch="' + id + '" data-method="' + mid + '" novalidate>' +
      '<label class="field"><span>' + esc(f.label) + '</span><input type="' + (f.kind === 'url' ? 'url' : 'text') + '" name="val" value="' + esc(curVal) + '" placeholder="' + esc(f.placeholder) + '" autocomplete="off" spellcheck="false"></label>' +
      '<p class="small" id="preview" style="margin:-4px 0 12px"></p>' +
      '<div class="btns"><button class="btn primary" type="submit">Xác nhận đã ' + (id === 'lead' ? 'tạo xong' : 'kết nối') + '</button>' +
      (st.status === 'connected' ? '<button class="btn" type="button" data-act="set-status" data-ch="' + id + '" data-id="reconnect">Báo lỗi: cần kết nối lại</button><button class="btn danger" type="button" data-act="set-status" data-ch="' + id + '" data-id="none">Ngắt kết nối</button>' : '') +
      '</div></form></div>';
    return html;
  }
  function connectPreview(form) {
    const c = chById(form.dataset.ch);
    const v = form.val.value.trim();
    const out = $('#preview');
    if (!out) return;
    if (!v) { out.innerHTML = '<span class="muted">Chưa nhập.</span>'; return; }
    if (c.connect.idField.kind === 'handle' && c.profile) {
      const ok = /^@?[A-Za-z0-9._-]{2,40}$/.test(v);
      out.innerHTML = ok ? 'Link hồ sơ: <a href="' + esc(c.profile(v)) + '" target="_blank" rel="noopener">' + esc(c.profile(v)) + '</a> ↗ (bấm để kiểm tra đúng tài khoản)' : '<span style="color:var(--bad)">Tên tài khoản chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới.</span>';
    } else if (c.connect.idField.kind === 'url') {
      out.innerHTML = isUrl(v) ? '<a href="' + esc(v) + '" target="_blank" rel="noopener">Mở link để kiểm tra ↗</a>' : '<span style="color:var(--bad)">Link phải bắt đầu bằng https://</span>';
    } else out.textContent = '';
  }

  /* ---------- Trang: Lịch tự động ---------- */
  function pageSchedule() {
    const k = dayKey();
    const occ = D.jobs.flatMap((j) => occurrences(j, k)).sort((a, b) => a.ms - b.ms);
    const rate = (j) => {
      let due = 0, got = 0;
      for (let i = 0; i < 7; i++) {
        const key = addDays(k, -i);
        for (const o of occurrences(j, key)) if (o.ms <= now()) { due++; if (seenInfo(o)) got++; }
      }
      return { due, got };
    };
    return '<div class="pagehead"><div class="grow"><h1>Lịch tự động</h1><p>Các việc Claude chạy trên mây theo giờ Việt Nam. Bản tin nào đã lên website thì trang <b>tự xác nhận</b>. Các việc còn lại, thấy email về thì bấm <b>Đã nhận</b>.</p></div>' +
      '<div class="btns"><a class="btn ext" href="' + D.links.claudeDashboard + '" target="_blank" rel="noopener">Bảng tự đọc Gmail (Claude)</a></div></div>' +
      '<div class="grid2"><div><div class="card" id="hom-nay"><div class="card-head"><h2>Hôm nay · ' + WD_LONG[weekdayOf(k)] + ' ' + fmtDM(now()) + '</h2></div>' +
      (occ.length ? '<ul class="list">' + occ.map((o) => {
        const past = o.ms <= now(), got = seenInfo(o);
        const dot = got ? 'ok' : past ? 'warn' : 'info';
        const right = got ? '<span class="pill k-ok" title="' + (got.auto ? 'Trang tự thấy bài này trên website' : 'Bạn đã bấm Đã nhận') + '">' + (got.auto ? 'Tự xác nhận ' : 'Đã nhận ') + fmtHM(got.at) + '</span>' :
          past ? '<button class="btn small" data-act="seen-job" data-id="' + esc(o.id) + '">Đã nhận</button>' : '<span class="muted small">' + rel(o.ms) + '</span>';
        const link = o.job.link ? '<a href="' + esc(o.job.link) + '" target="_blank" rel="noopener">' + esc(o.job.linkLabel || 'Mở') + ' ↗</a>' : '<a href="' + gmailSearch(o.job.subject) + '" target="_blank" rel="noopener">Tìm trong Gmail ↗</a>';
        return '<li><span class="dot ' + dot + '"></span><time>' + o.time + '</time><div class="body">' + esc(o.job.name) + '<div class="tag">' + link + '</div></div>' + right + '</li>';
      }).join('') + '</ul>' : '<p class="empty">Hôm nay không có việc tự động.</p>') + '</div></div>' +
      '<div><div class="card" id="ca-tuan"><h2>Cả tuần</h2><div class="tablewrap"><table><thead><tr><th>Việc</th><th>Lịch</th><th>Lần tới</th><th>7 ngày</th></tr></thead><tbody>' +
      D.jobs.map((j) => { const r = rate(j); return '<tr><td>' + esc(j.name) + '</td><td class="nowrap">' + (j.days.length === 7 ? 'Mỗi ngày' : j.days.map((d) => WD[d]).join(' ')) + '<br><span class="muted small">' + j.times.join(', ') + '</span></td><td class="nowrap">' + fmtFull(nextRun(j)) + '</td><td class="nowrap num">' + (r.due ? r.got + '/' + r.due : '—') + '</td></tr>'; }).join('') +
      '</tbody></table></div><p class="muted small">Cột 7 ngày: số lần đã nhận (tự xác nhận hoặc bạn bấm) trên số lần tới lịch. Dấu — là việc chạy ngầm, không gửi gì để nhận. Website không có bài mới thì không đăng, nên đôi khi lượt 21h45 trống là bình thường. Ngày lễ thị trường nghỉ có thể không có bản tin.</p></div>' + liveCard() + '</div></div>';
  }

  /* ---------- Trang: Đăng bài ---------- */
  const PLATS = [
    { id: 'threads', name: 'Threads', icon: '🧵', how: 'Mở Threads, bài đã điền sẵn. Bạn bấm Đăng.', open: (t) => 'https://www.threads.net/intent/post?text=' + encodeURIComponent(t) },
    { id: 'facebook', name: 'Facebook Page', icon: '📘', how: 'Copy bài, mở trình soạn của Meta. Dán (Ctrl+V) rồi đăng hoặc hẹn giờ.', open: () => 'https://business.facebook.com/latest/composer' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', how: 'Copy chú thích, mở TikTok Studio, chọn video, dán chú thích.', open: () => 'https://www.tiktok.com/tiktokstudio/upload' },
    { id: 'zalo', name: 'Zalo', icon: '💬', how: 'Copy bài, mở Zalo web, dán vào cộng đồng.', open: () => 'https://chat.zalo.me/' },
    { id: 'youtube', name: 'YouTube', icon: '▶️', how: 'Copy làm mô tả video, mở YouTube Studio.', open: () => 'https://studio.youtube.com/' }
  ];
  function complianceCheck(text) {
    const C = D.compliance;
    const t = text.normalize('NFC');
    const low = t.toLowerCase();
    const out = [];
    if (!t.trim()) return out;
    const banned = C.banned.filter((w) => low.includes(w.normalize('NFC')));
    if (banned.length) out.push({ k: 'bad', m: 'Có từ cấm: "' + banned.join('", "') + '" (quy tắc 1 và 4).' });
    const predictions = ['sẽ tăng', 'sẽ giảm', 'sắp tăng', 'sắp giảm', 'chắc tăng', 'chắc giảm', 'bùng nổ', 'nhân đôi', 'tăng bằng lần', 'lợi nhuận cao', 'lợi nhuận hấp dẫn', 'lãi khủng', 'lãi đều', 'ăn chắc', 'về bờ'];
    const pr = predictions.filter((w) => low.includes(w));
    if (pr.length) out.push({ k: 'warn', m: 'Nên đọc lại câu có "' + pr.join('", "') + '": không nói chắc giá tăng giảm, không hứa lợi nhuận.' });
    const brokers = C.brokers.filter((b) => (/^[A-Z]+$/.test(b) ? new RegExp('(^|[^A-Za-z])' + b + '([^A-Za-z]|$)').test(t) : low.includes(b.toLowerCase())));
    if (brokers.length) out.push({ k: 'bad', m: 'Nhắc tên công ty chứng khoán: ' + brokers.join(', ') + ' (quy tắc 3).' });
    const skip = new Set(C.notTickers.concat(C.brokers).map((x) => x.toUpperCase()));
    const tickers = Array.from(new Set((t.match(/(^|[^A-Za-z0-9])([A-Z]{3})(?=[^A-Za-z0-9]|$)/g) || []).map((x) => x.replace(/[^A-Z]/g, '')))).filter((x) => !skip.has(x));
    if (tickers.length) out.push({ k: 'warn', m: 'Có thể là mã cổ phiếu: ' + tickers.join(', ') + '. Không khuyến nghị mua bán mã cụ thể (quy tắc 2).' });
    if (!low.includes('không phải khuyến nghị đầu tư')) out.push({ k: 'bad', m: 'Thiếu dòng miễn trừ: "' + C.disclaimer + '"', fix: 'disc' });
    if (!low.includes('zalo')) out.push({ k: 'warn', m: 'Chưa có lời mời nhận bản tin qua Zalo.', fix: 'cta' });
    if (!out.length) out.push({ k: 'ok', m: 'Đạt 6 quy tắc nội dung.' });
    return out;
  }
  function pageCompose(focus) {
    const text = S.compose || '';
    const zalo = chState('zalo');
    return '<div class="pagehead"><div class="grow"><h1>Đăng bài</h1><p>Hệ thống đăng bài của riêng bạn: dán bài từ email 17h25 hoặc tự viết, trang rà quy tắc nội dung, rồi một nút mở đúng nơi đăng. Không cần công cụ trả phí.</p></div>' +
      '<div class="btns"><a class="btn" href="#/claude">✍️ Nhờ Claude viết</a><a class="btn ext" href="' + gmailSearch('Nội dung tìm khách') + '" target="_blank" rel="noopener">Lấy bài 17h25 trong Gmail</a></div></div>' +
      '<div class="grid2"><div>' +
      '<div class="card" id="soan-bai"><div class="card-head"><h2>Soạn bài</h2><span class="right muted small" id="savestate">' + (UI.draftId ? 'Đang sửa bản nháp' : 'Bài mới') + '</span></div>' +
      '<textarea id="composer" placeholder="Dán hoặc viết bài ở đây...">' + esc(text) + '</textarea>' +
      '<div class="btns" style="margin:10px 0 14px"><button class="btn small" data-act="insert" data-id="cta">+ Lời mời Zalo</button><button class="btn small" data-act="insert" data-id="disc">+ Dòng miễn trừ</button><button class="btn small" data-act="copy-compose">Copy</button><button class="btn small" data-act="save-draft">Lưu nháp</button><button class="btn small" data-act="new-draft">Bài mới</button></div>' +
      '<h3 style="margin-bottom:8px">Rà quy tắc</h3><ul class="issues" id="issues"></ul></div>' +
      '<div class="card" id="noi-dang"><h2>Đăng lên</h2><div class="platforms">' +
      PLATS.map((p) => {
        const conn = chState(p.id);
        return '<div class="plat' + (focus === p.id ? '" style="border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-soft)' : '') + '" id="plat-' + p.id + '"><div class="h">' + p.icon + ' ' + esc(p.name) + '<span class="right" data-count="' + p.id + '"></span></div>' +
          '<div class="small muted">' + esc(p.how) + '</div>' +
          (needsAction(conn.status) ? '<a class="pill k-warn" href="#/ket-noi/' + p.id + '">Chưa kết nối</a>' : '') +
          '<div class="btns"><button class="btn small primary" data-act="plat-open" data-id="' + p.id + '">Copy & mở ↗</button><button class="btn small" data-act="plat-done" data-id="' + p.id + '">Đã đăng</button></div></div>';
      }).join('') + '</div>' +
      (zalo.url ? '' : '<p class="muted small" style="margin:12px 0 0">Mẹo: lưu link cộng đồng Zalo ở <a href="#/ket-noi/zalo">trang kết nối Zalo</a> để nút "+ Lời mời Zalo" chèn kèm link.</p>') +
      '</div></div>' +
      '<div><div class="card" id="ban-nhap"><div class="card-head"><h2>Bản nháp</h2><span class="right muted small">' + S.drafts.length + '</span></div><div id="drafts">' + draftsHtml() + '</div></div></div></div>';
  }
  function draftsHtml() {
    if (!S.drafts.length) return '<p class="empty">Chưa có bản nháp. Bấm "Lưu nháp" hoặc "Copy & mở" để lưu.</p>';
    return S.drafts.slice(0, 40).map((d) => {
      const posted = Object.keys(d.posted || {});
      return '<div class="draft"><p>' + esc(d.text) + '</p><div class="meta">' + fmtFull(d.created) + ' · ' +
        (posted.length ? posted.map((p) => '<span class="pill k-ok">' + esc((PLATS.find((x) => x.id === p) || { name: p }).name) + '</span>').join('') : '<span class="pill k-muted">Chưa đăng</span>') +
        '<span style="margin-left:auto" class="btns"><button class="btn small" data-act="load-draft" data-id="' + d.id + '">Mở</button><button class="btn small danger" data-act="del-draft" data-id="' + d.id + '">Xoá</button></span></div></div>';
    }).join('');
  }
  function composeUpdate() {
    const ta = $('#composer');
    if (!ta) return;
    const text = ta.value;
    const issues = complianceCheck(text);
    $('#issues').innerHTML = issues.length ? issues.map((i) => '<li class="' + i.k + '">' + esc(i.m) + (i.fix ? ' <button class="btn small" data-act="insert" data-id="' + i.fix + '">Thêm</button>' : '') + '</li>').join('') : '<li class="warn">Chưa có nội dung.</li>';
    for (const p of PLATS) {
      const el = $('[data-count="' + p.id + '"]');
      const lim = D.limits[p.id];
      const n = Array.from(text).length;
      if (el) { el.textContent = n + '/' + lim; el.style.color = n > lim ? 'var(--bad)' : 'var(--muted)'; }
    }
  }
  function saveDraft(silent) {
    const text = ($('#composer') || {}).value || S.compose || '';
    if (!text.trim()) { if (!silent) toast('Chưa có nội dung'); return null; }
    let d = UI.draftId && S.drafts.find((x) => x.id === UI.draftId);
    if (d) d.text = text;
    else { d = { id: uid(), text, created: new Date().toISOString(), posted: {} }; S.drafts.unshift(d); UI.draftId = d.id; }
    save();
    const box = $('#drafts'); if (box) box.innerHTML = draftsHtml();
    const ss = $('#savestate'); if (ss) ss.textContent = 'Đang sửa bản nháp';
    if (!silent) toast('Đã lưu nháp');
    return d;
  }
  function ctaText() {
    const z = chState('zalo');
    return D.compliance.cta + (z.url ? ': ' + z.url : '.');
  }

  /* ---------- Trang: Tìm khách ---------- */
  const LEAD_Q = [
    { id: 'muon', label: 'Muốn nhận gì', type: 'checkbox', opts: [['Bản tin sáng', 0], ['Buổi trao đổi danh mục 20 phút', 3]] },
    { id: 'von', label: 'Quy mô vốn', type: 'radio', opts: [['Dưới 100 triệu', 0], ['100–500 triệu', 1], ['500 triệu–2 tỷ', 2], ['Trên 2 tỷ', 3]] },
    { id: 'tk', label: 'Đã có tài khoản chưa', type: 'radio', opts: [['Chưa có', 2], ['Có, ít dùng', 2], ['Có, dùng thường xuyên', 0]] },
    { id: 'kn', label: 'Kinh nghiệm', type: 'radio', opts: [['Chưa bắt đầu', 0], ['Dưới 1 năm', 0], ['1–3 năm', 1], ['Trên 3 năm', 1]] },
    { id: 'nguon', label: 'Biết đến qua đâu', type: 'radio', opts: [['Bạn bè giới thiệu', 2], ['TikTok', 0], ['Facebook', 0], ['YouTube', 0], ['Threads', 0], ['Zalo', 0], ['Khác', 0]] },
    { id: 'bk', label: 'Có ghi điều băn khoăn', type: 'checkbox', opts: [['Có', 1]] }
  ];
  const FUNNEL = [['moi', 'Lead mới'], ['nhan', 'Đã nhắn'], ['traloi', 'Đã trả lời'], ['hen', 'Hẹn trao đổi'], ['mo', 'Mở tài khoản']];
  const isMail = (s) => /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,80}\.[A-Za-z]{2,}$/.test(s);
  function mailField(label) {
    return '<label class="field"><span>' + label + '</span><input type="text" inputmode="email" autocomplete="email" data-mail="1" value="' + esc(S.mail || '') + '" placeholder="tenhopthu@gmail.com"></label>';
  }
  // Link Gmail mặc định mở tài khoản đang đăng nhập đầu tiên. Có hộp thư đã lưu thì mở đúng hộp thư đó.
  function fixMailLinks(rootEl) {
    if (!S.mail || !isMail(S.mail)) return;
    const pre = 'https://mail.google.com/mail/u/0/';
    for (const a of $$('a[href^="' + pre + '"]', rootEl)) a.href = 'https://mail.google.com/mail/u/?authuser=' + encodeURIComponent(S.mail) + a.getAttribute('href').slice(pre.length);
  }
  function installCard(open) {
    return '<details class="card install" id="cai-dat-lead"' + (open ? ' open' : '') + '><summary><h2>Cài Form đăng ký và Sheet khách trong 3 phút</h2><span class="muted small">Làm một lần. Mã chạy trong tài khoản Google của bạn, dữ liệu khách chỉ bạn xem được.</span></summary>' +
      '<ol class="steps" style="margin-top:14px">' +
      '<li><h3>Nhập hộp thư nhận email, rồi copy mã</h3><p>Email nhắc nhắn khách, khách Nóng và báo cáo phễu sẽ gửi về hộp thư này. Địa chỉ chỉ lưu trên máy bạn và được điền sẵn vào mã khi copy.</p>' + mailField('Hộp thư nhận email') + '<div class="btns"><button class="btn primary" type="button" data-act="copy-lead-code">Copy mã cài đặt</button></div></li>' +
      '<li><h3>Mở trang Apps Script và dán</h3><p>Đăng nhập đúng tài khoản Google nhận báo cáo. Xoá hết chữ có sẵn, dán mã (Ctrl+V), bấm biểu tượng lưu.</p><div class="btns"><a class="btn ext" href="https://script.new" target="_blank" rel="noopener">Mở script.new</a></div></li>' +
      '<li><h3>Chọn hàm caiDat rồi bấm Chạy</h3><p>Google hỏi quyền: chọn tài khoản → <b>Nâng cao</b> → <b>Đi tới dự án</b> → <b>Cho phép</b>. Cảnh báo "chưa xác minh" là bình thường vì đây là mã của riêng bạn.</p></li>' +
      '<li><h3>Mở email "Đã cài xong hệ thống khách đăng ký"</h3><p>Trong email có link Form (gửi cho khách), link Sheet khách và link bảng tổng hợp. Dán hai link đầu vào ô bên dưới.</p><div class="btns"><a class="btn" href="#/ket-noi/lead">Dán link Sheet khách</a></div></li>' +
      '</ol><div class="note"><b>Đã cài rồi, chỉ muốn đổi hộp thư?</b> Nhập hộp thư mới ở bước 1 và bấm Copy. Mở <a href="https://script.google.com/home" target="_blank" rel="noopener">script.google.com ↗</a>, mở đúng dự án đã cài, xoá mã cũ, dán mã mới, bấm lưu. Sau đó chọn hàm <b>guiLaiLink</b> và bấm Chạy để nhận lại link Form ở hộp thư mới. Không chạy lại caiDat.</div>' +
      '<p class="muted small" style="margin:0">Sau khi cài: có người đăng ký là Sheet tự chấm điểm và tô màu; khách Nóng thì báo email ngay; 8h sáng T2–T6 có email "Việc tìm khách hôm nay" kèm tin nhắn soạn sẵn; 19h Chủ nhật có báo cáo phễu tuần.</p></details>';
  }
  function playbookCard() {
    return '<div class="card" id="kich-ban-tu-van"><div class="card-head"><h2>Khi khách hỏi khó</h2><span class="right muted small">Bấm để mở, copy rồi sửa cho hợp người</span></div>' +
      D.playbook.map((p, i) => '<details class="qa"><summary>' + esc(p.q) + '</summary><p class="muted small">' + esc(p.aim) + '</p><pre class="msg">' + esc(p.a) + '</pre><div class="btns"><button class="btn small" type="button" data-act="copy" data-text="' + esc(p.a) + '">Copy câu trả lời</button></div></details>').join('') +
      '<p class="muted small" style="margin:10px 0 0">Không nêu tên công ty chứng khoán trong tin nhắn công khai, không hứa lợi nhuận, không khuyến nghị mã. Con số phí, lãi vay phải lấy từ biểu phí hiện hành.</p></div>';
  }
  function pageLeads() {
    const wk = weekKey();
    const f = S.funnel[wk] || {}, g = S.goals || {};
    const st = chState('lead');
    const ready = !needsAction(st.status);
    const agent = LIVE.status && LIVE.status.lead;
    return '<div class="pagehead"><div class="grow"><h1>Phễu khách</h1><p>Từ người xem tới người đăng ký, tới buổi trao đổi, tới mở tài khoản. Trang này <b>không lưu</b> tên hay số điện thoại của khách: dữ liệu khách chỉ nằm trong Google Sheet của bạn.</p></div>' +
      '<div class="btns">' + (st.url ? '<a class="btn ext primary" href="' + esc(st.url) + '" target="_blank" rel="noopener">Mở Sheet khách</a>' : '') +
      (S.leadForm ? '<button class="btn" type="button" data-act="copy" data-text="' + esc(S.leadForm) + '">Copy link Form</button>' : '') + '</div></div>' +
      (ready ? '' : installCard(true)) +
      '<section class="fwrap"><div class="fhead"><h2>Tuần này</h2><span class="muted small">từ ' + fmtDM(vnMs(wk, '12:00')) + (agent ? ' · Sheet báo: ' + agent.moi + ' đăng ký mới, ' + agent.canNhan + ' cần nhắn hôm nay' : '') + '</span></div>' + funnelStrip() + '</section>' +
      '<div class="grid2"><div>' +
      '<div class="card" id="pheu"><div class="card-head"><h2>Cập nhật số tuần này</h2><span class="right muted small">Chỉ ghi con số, không ghi tên khách</span></div>' +
      '<div class="inline" style="margin-bottom:6px">' + FUNNEL.map(([k, l]) => '<label class="field" style="margin:0"><span>' + l + '</span><input type="number" min="0" inputmode="numeric" data-funnel="' + k + '" value="' + esc(f[k] || '') + '" placeholder="0"></label>').join('') + '</div>' +
      '<p class="muted small" style="margin:10px 0 6px"><b>Mục tiêu mỗi tuần</b> (đặt một lần, dùng cho các tuần sau)</p>' +
      '<div class="inline" style="margin-bottom:12px">' + FUNNEL.map(([k, l]) => '<label class="field" style="margin:0"><span class="sr">Mục tiêu ' + l + '</span><input type="number" min="0" inputmode="numeric" data-goal="' + k + '" value="' + esc(g[k] || '') + '" placeholder="mục tiêu"></label>').join('') + '</div>' +
      '<div class="funnel" id="funnel"></div></div>' +
      '<div class="card" id="tin-nhan"><h2>Tin nhắn soạn sẵn theo mốc</h2>' +
      '<div class="inline"><label class="field"><span>Mốc</span><select id="mstage"><option value="N0">N0 · ngay khi đăng ký</option><option value="N1">N1 · sau 1 ngày</option><option value="N3">N3 · sau 3 ngày</option><option value="N7">N7 · sau 7 ngày</option><option value="N14">N14 · chào lần cuối</option></select></label>' +
      '<label class="field"><span>Tên gọi (không lưu)</span><input type="text" id="mname" placeholder="anh Minh" autocomplete="off"></label></div>' +
      '<label class="field"><span>Điều khách băn khoăn (không lưu)</span><input type="text" id="mworry" placeholder="ví dụ: không biết bắt đầu từ đâu" autocomplete="off"></label>' +
      '<pre class="msg" id="mtext"></pre><div class="btns"><button class="btn primary" data-act="copy-msg">Copy tin nhắn</button><a class="btn ext" href="https://chat.zalo.me/" target="_blank" rel="noopener">Mở Zalo</a></div>' +
      '<p class="muted small" style="margin:10px 0 0">Ai nhắn HỦY thì ngừng nhắn và xoá thông tin khi họ yêu cầu. Chỉ nhắn người đã tự đăng ký.</p></div>' +
      playbookCard() +
      '</div><div>' +
      '<div class="card" id="link-form"><h2>Link Form đăng ký</h2><label class="field"><span>Dán link Form gửi cho khách (lưu trên máy này)</span><input type="url" id="leadformurl" value="' + esc(S.leadForm || '') + '" placeholder="https://docs.google.com/forms/d/e/..."></label>' +
      '<p class="muted small" style="margin:0">Gắn link này vào tiểu sử TikTok, Threads, YouTube, bài ghim Facebook và bình luận đầu tiên của mỗi bài.</p></div>' +
      '<div class="card" id="cham-diem"><div class="card-head"><h2>Chấm điểm nhanh một khách</h2></div><form id="leadform">' +
      LEAD_Q.map((q) => '<fieldset><legend>' + esc(q.label) + '</legend><div class="choices">' + q.opts.map((o, i) => '<label><input type="' + q.type + '" name="' + q.id + '" value="' + i + '">' + esc(o[0]) + (o[1] ? ' <span class="muted">+' + o[1] + '</span>' : '') + '</label>').join('') + '</div></fieldset>').join('') +
      '</form><div class="confirm status-big"><div><div class="muted small">Điểm</div><div class="score" id="score">0</div></div><div id="rank"></div><div class="small" id="rank-next" style="flex:1 1 200px"></div></div></div>' +
      '<div class="card" id="moc"><h2>Tính ngày follow-up</h2><label class="field"><span>Ngày khách đăng ký</span><input type="date" id="regdate" value="' + dayKey() + '"></label><ul class="list" id="moclist"></ul></div>' +
      '<div class="card" id="cac-tuan"><h2>Các tuần trước</h2>' + funnelHistory() + '</div>' +
      (ready ? installCard(false) : '') +
      '</div></div>';
  }
  function funnelHistory() {
    const weeks = Object.keys(S.funnel).sort().reverse().slice(0, 8);
    if (!weeks.length) return '<p class="empty">Chưa có số liệu.</p>';
    return '<div class="tablewrap"><table><thead><tr><th>Tuần</th>' + FUNNEL.map(([, l]) => '<th>' + l + '</th>').join('') + '</tr></thead><tbody>' +
      weeks.map((w) => '<tr><td class="nowrap">' + fmtDM(vnMs(w, '12:00')) + '</td>' + FUNNEL.map(([k]) => '<td class="num">' + esc(S.funnel[w][k] || 0) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  }
  function leadUpdate() {
    const form = $('#leadform');
    if (!form) return;
    let score = 0;
    const picked = {};
    for (const q of LEAD_Q) {
      for (const inp of $$('input[name="' + q.id + '"]', form)) if (inp.checked) { score += q.opts[+inp.value][1]; (picked[q.id] = picked[q.id] || []).push(q.opts[+inp.value][0]); }
    }
    const rank = score >= 6 ? ['Nóng', 'bad', 'Nhắn trong hôm nay, mời buổi trao đổi danh mục 20 phút.'] : score >= 3 ? ['Ấm', 'warn', 'Nhắn theo chuỗi N0 → N14, gửi nội dung đúng điều họ quan tâm.'] : ['Lạnh', 'info', 'Gửi N0, để họ đọc bản tin đều đặn.'];
    $('#score').textContent = score;
    $('#rank').innerHTML = '<span class="pill k-' + rank[1] + '">' + rank[0] + '</span>';
    $('#rank-next').textContent = rank[2];
    UI.leadPicked = picked;
    msgUpdate();
  }
  function msgUpdate() {
    const out = $('#mtext');
    if (!out) return;
    const stage = $('#mstage').value;
    const name = $('#mname').value.trim() || 'anh/chị';
    const worry = $('#mworry').value.trim();
    const kn = ((UI.leadPicked || {}).kn || [])[0] || '';
    const zalo = chState('zalo').url || '[link cộng đồng Zalo]';
    const disc = D.compliance.disclaimer;
    const T = {
      N0: 'Chào ' + name + ', em là Quốc ở kênh Đầu tư cùng Thiên Quốc. Cảm ơn ' + name + ' đã đăng ký nhận bản tin.\nTừ sáng mai, bản tin trước phiên 7h sẽ gửi trong cộng đồng Zalo: ' + zalo + '\n' + (worry ? name.charAt(0).toUpperCase() + name.slice(1) + ' có nhắc tới "' + worry + '", em sẽ chia sẻ thêm về chủ đề này trong thời gian tới.\n' : '') + 'Có gì cần hỏi cứ nhắn em nhé.\n' + disc,
      N1: 'Chào ' + name + ', bản tin sáng nay ' + name + ' đọc thấy có dễ theo dõi không? ' + name.charAt(0).toUpperCase() + name.slice(1) + ' muốn em viết thêm về chủ đề nào (vĩ mô, nhóm ngành, cách đọc báo cáo tài chính...) thì nhắn em nhé.',
      N3: 'Chào ' + name + ', hôm trước ' + name + ' có quan tâm ' + (worry ? '"' + worry + '"' : 'một vài chủ đề') + '. Em gửi ' + name + ' vài ý:\n[phân tích riêng theo chủ đề họ quan tâm]\nNếu kênh YouTube đã có video đúng chủ đề: [link video]\n' + disc,
      N7: kn === 'Chưa bắt đầu'
        ? 'Chào ' + name + ', nếu ' + name + ' muốn bắt đầu đầu tư, em có thể hướng dẫn từng bước mở tài khoản và đặt lệnh đầu tiên, khoảng 15 phút qua Zalo. ' + name.charAt(0).toUpperCase() + name.slice(1) + ' tiện hôm nào thì báo em nhé.\n' + disc
        : 'Chào ' + name + ', em đang mở các buổi trao đổi danh mục 20 phút, miễn phí, để cùng nhìn lại tỷ trọng và mức rủi ro ' + name + ' đang chấp nhận. ' + name.charAt(0).toUpperCase() + name.slice(1) + ' tiện khung giờ nào trong tuần này?\n' + disc,
      N14: 'Chào ' + name + ', em nhắn lần cuối để không làm phiền. Bản tin trước phiên 7h vẫn gửi đều trong cộng đồng Zalo, ' + name + ' cần trao đổi gì cứ nhắn em bất cứ lúc nào. Chúc ' + name + ' một tuần nhẹ nhàng!'
    };
    out.textContent = T[stage];
  }
  function funnelUpdate() {
    const box = $('#funnel');
    if (!box) return;
    const f = S.funnel[weekKey()] || {};
    const max = Math.max(1, ...FUNNEL.map(([k]) => +f[k] || 0));
    box.innerHTML = FUNNEL.map(([k, l], i) => {
      const v = +f[k] || 0;
      const prev = i ? (+f[FUNNEL[i - 1][0]] || 0) : 0;
      const conv = i && prev ? ' <span class="muted small">(' + Math.round(v / prev * 100) + '%)</span>' : '';
      return '<div class="fr"><span>' + l + conv + '</span><span class="fb"><i style="width:' + (v / max * 100) + '%"></i></span><span class="fv">' + v + '</span></div>';
    }).join('');
  }
  function stripUpdate() { const fs = $('.fstrip'); if (fs) fs.outerHTML = funnelStrip(); }
  function mocUpdate() {
    const inp = $('#regdate'), ul = $('#moclist');
    if (!inp || !ul || !/^\d{4}-\d{2}-\d{2}$/.test(inp.value)) return;
    const today = dayKey();
    ul.innerHTML = [0, 1, 3, 7, 14].map((n) => {
      const k = addDays(inp.value, n);
      const tag = k === today ? '<span class="pill k-warn">Hôm nay</span>' : k < today ? '<span class="muted small">đã qua</span>' : '';
      return '<li><time>N' + n + '</time><div class="body">' + WD_LONG[weekdayOf(k)] + ', ' + fmtDM(vnMs(k, '12:00')) + '</div>' + tag + '</li>';
    }).join('');
  }

  /* ---------- Trang: Trợ lý Claude ---------- */
  const CL = D.claude;
  const NO_SAVE = { 'tra-loi': true, 'trao-doi-20': true }; // không lưu nội dung có thể chứa thông tin người xem
  function clState() {
    S.claudeForm = S.claudeForm || { tpl: CL.templates[0].id, values: {} };
    S.claudeHistory = S.claudeHistory || [];
    UI.clValues = UI.clValues || {};
    return S.claudeForm;
  }
  function clTpl() { const f = clState(); return CL.templates.find((t) => t.id === f.tpl) || CL.templates[0]; }
  function clValues(t) {
    const f = clState();
    const saved = NO_SAVE[t.id] ? (UI.clValues[t.id] || {}) : (f.values[t.id] || {});
    const v = {};
    for (const fld of t.fields) v[fld.id] = saved[fld.id] != null ? saved[fld.id] : (fld.type === 'select' ? fld.options[0] : '');
    return v;
  }
  function clSetValue(t, id, val) {
    const f = clState();
    const bag = NO_SAVE[t.id] ? (UI.clValues[t.id] = UI.clValues[t.id] || {}) : (f.values[t.id] = f.values[t.id] || {});
    bag[id] = val;
    if (!NO_SAVE[t.id]) save();
  }
  function clMissing(t, v) {
    return t.fields.filter((f) => f.type !== 'select' && !/không bắt buộc/.test(f.label) && !String(v[f.id] || '').trim());
  }
  function clPrompt(t, v) {
    const d = vn();
    const today = WD_LONG[d.getUTCDay()] + ', ' + pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
    return CL.context.join('\n') + '\nHôm nay là ' + today + ' (giờ Việt Nam).\n\nYÊU CẦU:\n' + t.task(v);
  }
  function pageClaude() {
    const t = clTpl(), v = clValues(t);
    const field = (f) => {
      const val = v[f.id];
      const attrs = ' data-cf="' + f.id + '" id="cf-' + f.id + '"';
      let input;
      if (f.type === 'select') input = '<select' + attrs + '>' + f.options.map((o) => '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select>';
      else if (f.type === 'textarea') input = '<textarea' + attrs + ' style="min-height:110px" placeholder="' + esc(f.placeholder || '') + '">' + esc(val) + '</textarea>';
      else input = '<div class="inline"><input type="text"' + attrs + ' value="' + esc(val) + '" placeholder="' + esc(f.placeholder || '') + '" autocomplete="off">' +
        (f.random ? '<button class="btn" type="button" data-act="cl-random" data-id="' + f.id + '" title="Chọn chủ đề ngẫu nhiên">🎲 Ngẫu nhiên</button>' : '') + '</div>';
      return '<label class="field"><span>' + esc(f.label) + '</span>' + input + '</label>';
    };
    return '<div class="pagehead"><div class="grow"><h1>Trợ lý Claude</h1><p>Chọn mẫu, điền chủ đề. Trang ghép sẵn yêu cầu (đã kèm thương hiệu và 6 quy tắc nội dung) rồi mở Claude.ai bằng gói bạn đang dùng, không tốn thêm phí.</p></div>' +
      '<div class="btns"><a class="btn" href="#/dang-bai">Mục Đăng bài</a></div></div>' +
      '<div class="methods" role="group" aria-label="Mẫu yêu cầu">' + CL.templates.map((x) =>
        '<button class="method" type="button" data-act="cl-tpl" data-id="' + x.id + '" aria-pressed="' + (x.id === t.id) + '"><b>' + x.icon + ' ' + esc(x.name) + '</b><span class="d">' + esc(x.desc) + '</span></button>').join('') + '</div>' +
      '<div class="grid2"><div>' +
      '<div class="card" id="cl-form"><h2>' + t.icon + ' ' + esc(t.name) + '</h2><form data-form="claude" novalidate>' + t.fields.map(field).join('') + '</form>' +
      (NO_SAVE[t.id] ? '<p class="note warn">Bỏ tên, số điện thoại, thông tin cá nhân của người hỏi trước khi dán. Mẫu này không lưu lại nội dung.</p>' : '') +
      '<div class="btns"><button class="btn primary" type="button" data-act="cl-open">Mở Claude với yêu cầu này ↗</button><button class="btn" type="button" data-act="cl-copy">Chỉ copy yêu cầu</button></div>' +
      '<p class="muted small" style="margin:10px 0 0">Bấm nút: trang copy yêu cầu và mở Claude.ai ở tab mới. Nếu ô chat chưa có chữ, bấm <b>Ctrl+V</b> rồi Enter.</p>' +
      '<details style="margin-top:12px"><summary class="muted small">Xem yêu cầu sẽ gửi</summary><pre class="msg" id="cl-preview" style="margin-top:8px"></pre></details></div>' +
      '<div class="card" id="cl-ket-qua"><h2>Dán kết quả từ Claude</h2><p class="muted small">Copy câu trả lời của Claude, dán vào đây để rà quy tắc rồi chuyển sang đăng.</p>' +
      '<textarea id="cl-out" placeholder="Dán kết quả ở đây..."></textarea>' +
      '<h3 style="margin:12px 0 8px">Rà quy tắc</h3><ul class="issues" id="cl-issues"><li class="warn">Chưa có nội dung.</li></ul>' +
      '<div class="btns"><button class="btn primary" type="button" data-act="cl-to-compose">Chuyển sang Đăng bài</button><button class="btn" type="button" data-act="cl-save-draft">Lưu vào bản nháp</button></div></div>' +
      '</div><div>' +
      clHistCard() +
      '<div class="card" id="cl-meo"><h2>Mẹo</h2><ul class="list">' +
      '<li><span class="dot info"></span><div class="body">Báo cáo phân tích cần số liệu mới: trong Claude.ai bật <b>Tìm kiếm web</b> (biểu tượng ⚙ hoặc + cạnh ô chat) trước khi gửi.</div></li>' +
      '<li><span class="dot info"></span><div class="body">Muốn sửa: trả lời ngay trong Claude, ví dụ "ngắn lại một nửa", "giọng thân mật hơn".</div></li>' +
      '<li><span class="dot warn"></span><div class="body">Claude có thể nhầm số liệu. Kiểm tra lại mọi con số có [CẦN KIỂM TRA] hoặc không có nguồn trước khi đăng.</div></li>' +
      '</ul></div></div></div>';
  }
  function clHistCard() {
    const hist = S.claudeHistory.slice(0, 12);
    return '<div class="card" id="cl-gan-day"><div class="card-head"><h2>Đã gửi gần đây</h2><span class="right muted small">' + S.claudeHistory.length + '</span></div>' +
      (hist.length ? '<ul class="list">' + hist.map((h, i) => {
        const tt = CL.templates.find((x) => x.id === h.tpl) || { icon: '•', name: h.tpl };
        return '<li><time>' + fmtFull(h.at) + '</time><div class="body">' + tt.icon + ' ' + esc(h.title) + '<div class="tag">' + esc(tt.name) + '</div></div><button class="btn small" data-act="cl-hist" data-id="' + i + '">Dùng lại</button></li>';
      }).join('') + '</ul>' : '<p class="empty">Chưa gửi yêu cầu nào.</p>') + '</div>';
  }
  function clUpdate() {
    const pv = $('#cl-preview');
    if (pv) { const t = clTpl(); pv.textContent = clPrompt(t, clValues(t)); }
  }
  function clOutUpdate() {
    const ta = $('#cl-out'), box = $('#cl-issues');
    if (!ta || !box) return;
    const issues = complianceCheck(ta.value);
    box.innerHTML = issues.length ? issues.map((i) => '<li class="' + i.k + '">' + esc(i.m) + '</li>').join('') : '<li class="warn">Chưa có nội dung.</li>';
  }
  function clReady() {
    const t = clTpl(), v = clValues(t), miss = clMissing(t, v);
    if (miss.length) { toast('Điền "' + miss[0].label + '" trước'); const el = $('#cf-' + miss[0].id); if (el) el.focus(); return null; }
    return { t, v, prompt: clPrompt(t, v) };
  }
  function clRecord(r) {
    const title = String(r.v.topic || r.v.ask || r.t.name).replace(/\s+/g, ' ').slice(0, 80);
    S.claudeHistory.unshift({ at: new Date().toISOString(), tpl: r.t.id, title: NO_SAVE[r.t.id] ? r.t.name : title, values: NO_SAVE[r.t.id] ? {} : Object.assign({}, r.v) });
    if (S.claudeHistory.length > 50) S.claudeHistory.length = 50;
    const card = $('#cl-gan-day'); if (card) card.outerHTML = clHistCard();
    addLog('', 'Nhờ Claude: ' + r.t.name + (NO_SAVE[r.t.id] ? '' : ' · ' + title), 'info');
    save();
  }

  /* ---------- Trang: Nhật ký ---------- */
  function pageLog(filter) {
    const rows = filter ? S.log.filter((r) => r.ch === filter) : S.log;
    return '<div class="pagehead"><div class="grow"><h1>Nhật ký</h1><p>Mọi việc đã làm: kết nối, đánh dấu, bài đã đăng, ghi chú tay.</p></div>' +
      '<div class="btns"><button class="btn" data-act="export-csv">Tải CSV</button></div></div>' +
      '<div class="card"><div class="inline" style="margin-bottom:10px"><select id="logfilter" aria-label="Lọc theo kênh"><option value="">Tất cả kênh</option>' +
      D.channels.map((c) => '<option value="' + c.id + '"' + (filter === c.id ? ' selected' : '') + '>' + c.icon + ' ' + esc(c.name) + '</option>').join('') + '</select></div>' +
      '<form class="inline" data-form="add-log" data-ch="' + esc(filter || '') + '" style="margin-bottom:8px"><input type="text" name="text" placeholder="Ghi thêm việc đã làm" aria-label="Nội dung" required><button class="btn" type="submit">Ghi</button></form>' +
      logList(rows.slice(0, 300)) + '</div>';
  }

  /* ---------- Trang: Cài đặt ---------- */
  function pageSettings() {
    let size = 0;
    try { size = (localStorage.getItem(KEY) || '').length; } catch (e) { /* bỏ qua */ }
    return '<div class="pagehead"><div class="grow"><h1>Cài đặt</h1><p>Trang này là của riêng bạn: chạy trên GitHub Pages, không máy chủ, không tài khoản, không phí.</p></div></div>' +
      '<div class="grid2"><div>' +
      '<div class="card" id="du-lieu"><h2>Dữ liệu của bạn</h2><p class="muted">Trạng thái kết nối, việc đã làm, bản nháp, nhật ký được lưu <b>trong trình duyệt này</b> (' + Math.round(size / 1024) + ' KB). Mở trên máy khác sẽ trống: tải bản sao lưu ở đây và nạp lại ở máy kia.</p>' +
      '<div class="btns"><button class="btn primary" data-act="export">Tải bản sao lưu (.json)</button><label class="btn">Nạp bản sao lưu<input type="file" accept="application/json,.json" id="importfile" hidden></label><button class="btn danger" data-act="reset">Xoá hết, làm lại</button></div></div>' +
      '<div class="card" id="hop-thu"><h2>Hộp thư nhận báo cáo</h2>' + mailField('Địa chỉ Gmail đang nhận email của các bot') + '<p class="muted small" style="margin:0">Mọi nút "Mở Gmail" và "Tìm trong Gmail" trên trang sẽ mở đúng hộp thư này, kể cả khi máy đang đăng nhập nhiều tài khoản Google. Địa chỉ chỉ lưu trong trình duyệt này.</p></div>' +
      '<div class="card" id="giao-dien"><h2>Giao diện</h2><div class="choices">' +
      [['auto', 'Theo máy'], ['light', 'Sáng'], ['dark', 'Tối']].map(([v, l]) => '<label><input type="radio" name="theme" value="' + v + '"' + (S.theme === v ? ' checked' : '') + '>' + l + '</label>').join('') + '</div></div>' +
      '<div class="card" id="an-toan"><h2>An toàn</h2><ul class="list"><li><span class="dot ok"></span><div class="body">Trang không hỏi, không lưu mật khẩu. Mọi nút đăng nhập mở trang chính thức của TikTok, Google, Facebook...</div></li>' +
      '<li><span class="dot ok"></span><div class="body">Không lưu thông tin khách hàng. Dữ liệu khách nằm trong Google Sheet của riêng bạn.</div></li>' +
      '<li><span class="dot warn"></span><div class="body">Địa chỉ trang là công khai, nhưng người khác mở sẽ chỉ thấy trang trống của họ, không thấy dữ liệu của bạn.</div></li></ul></div>' +
      '</div><div>' +
      '<div class="card" id="lien-ket"><h2>Liên kết</h2><ul class="list">' +
      [['Bảng dữ liệu trực tiếp (Claude đọc Gmail, vidIQ)', D.links.claudeDashboard], ['Kế hoạch hệ thống tìm khách', D.links.plan], ['Website', D.links.website], ['Mã nguồn trang này', D.links.controlRepo]]
        .map(([l, u]) => '<li><div class="body"><a href="' + u + '" target="_blank" rel="noopener">' + esc(l) + ' ↗</a></div></li>').join('') + '</ul></div>' +
      '<div class="card" id="sua-trang"><h2>Sửa lịch, link, hướng dẫn</h2><p class="muted">Mọi cấu hình nằm trong file <code>assets/data.js</code>. Nhờ Claude Code sửa rồi đẩy lên GitHub, trang tự cập nhật sau khoảng 1 phút.</p></div>' +
      '</div></div>';
  }
  function pageNotFound() {
    return '<div class="card"><h1>Không tìm thấy trang</h1><p><a href="#/">Về trang Hôm nay</a></p></div>';
  }

  /* ---------- Định tuyến ---------- */
  function parse() {
    const parts = (location.hash.replace(/^#\/?/, '') || '').split('/');
    return { route: parts[0] || '', arg: decodeURIComponent(parts[1] || '') };
  }
  function render() {
    if (location.hash && !location.hash.startsWith('#/')) history.replaceState(null, '', '#/');
    const { route, arg } = parse();
    renderNav(route);
    const pages = { '': pageHome, kenh: () => pageChannel(arg), 'ket-noi': () => pageConnect(arg), lich: pageSchedule, doi: pageTeam, 'dang-bai': () => pageCompose(arg), claude: pageClaude, 'tim-khach': pageLeads, 'nhat-ky': () => pageLog(arg), 'cai-dat': pageSettings };
    const fn = pages[route] || pageNotFound;
    const html = fn();
    if (html === '' && route === 'ket-noi') return;
    $('#main').innerHTML = html;
    fixMailLinks($('#main'));
    const titles = { '': 'Hôm nay', doi: 'Đội ngũ', kenh: (chById(arg) || {}).name, 'ket-noi': 'Kết nối ' + ((chById(arg) || {}).name || ''), lich: 'Lịch tự động', 'dang-bai': 'Đăng bài', claude: 'Trợ lý Claude', 'tim-khach': 'Phễu khách', 'nhat-ky': 'Nhật ký', 'cai-dat': 'Cài đặt' };
    document.title = (titles[route] || 'Trung tâm điều khiển') + ' · Thiên Quốc';
    if (route === 'ket-noi') { const f = $('form[data-form="connect"]'); if (f) connectPreview(f); }
    if (route === 'dang-bai') composeUpdate();
    if (route === 'claude') { clUpdate(); clOutUpdate(); }
    if (route === 'tim-khach') { leadUpdate(); funnelUpdate(); mocUpdate(); }
    window.scrollTo(0, 0);
  }
  function rerender() { const y = window.scrollY; render(); window.scrollTo(0, y); }

  /* ---------- Sự kiện ---------- */
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]:not([href^="#/"])');
    if (anchor) { // neo trong trang: cuộn tới, không đổi địa chỉ
      e.preventDefault();
      const target = document.getElementById(anchor.getAttribute('href').slice(1));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act, id = el.dataset.id;
    if (el.tagName === 'INPUT') return; // checkbox xử lý ở change
    e.preventDefault();
    if (act === 'copy') copy(el.dataset.text);
    else if (act === 'live-refresh') liveRefresh(true);
    else if (act === 'copy-lead-code') {
      fetch('lead/cai-dat-lead.gs', { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error('x'); return r.text(); })
        .then((t) => {
          const mark = "const EMAIL_NHAN = '';";
          if (S.mail && isMail(S.mail) && t.indexOf(mark) >= 0) t = t.replace(mark, "const EMAIL_NHAN = '" + S.mail + "';");
          copy(t); if (!S.mail) toast('Đã copy. Chưa nhập hộp thư nên email sẽ về tài khoản đang cài.');
          addLog('lead', 'Đã copy mã cài đặt Form + Sheet khách', 'info'); save();
        })
        .catch(() => toast('Không tải được mã. Kiểm tra mạng rồi bấm lại.'));
    }
    else if (act === 'pick-method') { UI.method[el.dataset.ch] = id; rerender(); }
    else if (act === 'set-status') {
      const ch = el.dataset.ch, c = chById(ch);
      if (id === 'none' && !confirm('Đánh dấu ' + c.name + ' là chưa kết nối?')) return;
      S.channels[ch] = Object.assign({}, chState(ch), { status: id, since: new Date().toISOString(), note: id === 'reconnect' ? 'Bạn báo cần kết nối lại.' : '' });
      delete S.channels[ch].fromSeed;
      addLog(ch, id === 'reconnect' ? 'Báo cần kết nối lại ' + c.name : 'Ngắt kết nối ' + c.name, id === 'reconnect' ? 'bad' : 'warn');
      save(); rerender();
    }
    else if (act === 'seen-job') {
      const k = dayKey();
      S.jobsSeen[k] = S.jobsSeen[k] || {};
      S.jobsSeen[k][id] = new Date().toISOString();
      const job = D.jobs.find((j) => id.startsWith(j.id + '@'));
      addLog(job ? job.channel : 'email', 'Đã nhận: ' + (job ? job.name : id) + ' (' + id.split('@')[1] + ')', 'ok');
      save(); rerender();
    }
    else if (act === 'insert') {
      const ta = $('#composer'); if (!ta) return;
      const add = id === 'cta' ? ctaText() : D.compliance.disclaimer;
      ta.value = ta.value.replace(/\s+$/, '') + (ta.value.trim() ? '\n\n' : '') + add;
      S.compose = ta.value; save(); composeUpdate(); ta.focus();
    }
    else if (act === 'copy-compose') { const t = ($('#composer') || {}).value || ''; if (t.trim()) copy(t); else toast('Chưa có nội dung'); }
    else if (act === 'save-draft') saveDraft(false);
    else if (act === 'new-draft') { if (S.compose.trim()) saveDraft(true); UI.draftId = null; S.compose = ''; save(); rerender(); }
    else if (act === 'load-draft') { const d = S.drafts.find((x) => x.id === id); if (d) { UI.draftId = d.id; S.compose = d.text; save(); rerender(); } }
    else if (act === 'del-draft') { if (confirm('Xoá bản nháp này?')) { S.drafts = S.drafts.filter((x) => x.id !== id); if (UI.draftId === id) UI.draftId = null; save(); $('#drafts').innerHTML = draftsHtml(); } }
    else if (act === 'plat-open') {
      const text = ($('#composer') || {}).value || '';
      if (!text.trim()) { toast('Viết hoặc dán bài trước'); return; }
      const bad = complianceCheck(text).filter((i) => i.k === 'bad');
      if (bad.length && !confirm('Bài còn ' + bad.length + ' lỗi quy tắc nội dung:\n- ' + bad.map((b) => b.m).join('\n- ') + '\n\nVẫn mở để đăng?')) return;
      const p = PLATS.find((x) => x.id === id);
      copy(text);
      window.open(p.open(text), '_blank', 'noopener');
      saveDraft(true);
    }
    else if (act === 'plat-done') {
      const d = saveDraft(true);
      if (!d) { toast('Chưa có nội dung'); return; }
      d.posted = d.posted || {};
      d.posted[id] = new Date().toISOString();
      const p = PLATS.find((x) => x.id === id);
      addLog(id, 'Đã đăng bài lên ' + p.name + ': "' + d.text.replace(/\s+/g, ' ').slice(0, 60) + (d.text.length > 60 ? '…' : '') + '"', 'ok');
      save(); $('#drafts').innerHTML = draftsHtml(); toast('Đã ghi: đăng lên ' + p.name);
    }
    else if (act === 'copy-msg') copy($('#mtext').textContent);
    else if (act === 'cl-tpl') { clState().tpl = id; save(); rerender(); }
    else if (act === 'cl-random') {
      const inp = $('#cf-' + id); if (!inp) return;
      const pool = CL.randomTopics.filter((x) => x !== inp.value);
      inp.value = pool[Math.floor(Math.random() * pool.length)];
      clSetValue(clTpl(), id, inp.value); clUpdate();
    }
    else if (act === 'cl-copy') { const r = clReady(); if (r) { copy(r.prompt); clRecord(r); } }
    else if (act === 'cl-open') {
      const r = clReady(); if (!r) return;
      copy(r.prompt);
      const url = CL.url + '?q=' + encodeURIComponent(r.prompt);
      window.open(url.length > 7000 ? CL.url : url, '_blank', 'noopener');
      clRecord(r);
      toast(url.length > 7000 ? 'Yêu cầu dài: đã copy, bấm Ctrl+V trong Claude' : 'Đã copy yêu cầu. Ô chat trống thì bấm Ctrl+V');
    }
    else if (act === 'cl-hist') {
      const h = S.claudeHistory[+id]; if (!h) return;
      const f = clState(); f.tpl = h.tpl;
      if (h.values && Object.keys(h.values).length) f.values[h.tpl] = Object.assign({}, h.values);
      save(); render(); toast('Đã nạp lại yêu cầu');
    }
    else if (act === 'cl-to-compose' || act === 'cl-save-draft') {
      const text = ($('#cl-out') || {}).value || '';
      if (!text.trim()) { toast('Dán kết quả từ Claude trước'); return; }
      if (act === 'cl-to-compose') { UI.draftId = null; S.compose = text; save(); location.hash = '#/dang-bai'; }
      else { S.drafts.unshift({ id: uid(), text, created: new Date().toISOString(), posted: {} }); save(); toast('Đã lưu vào bản nháp'); }
    }
    else if (act === 'export') {
      const blob = new Blob([JSON.stringify(Object.assign({ app: 'tq-dieu-khien', exported: new Date().toISOString() }, S), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'dieu-khien-sao-luu-' + dayKey() + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
    else if (act === 'export-csv') {
      const rows = [['thoi_gian', 'kenh', 'noi_dung', 'loai']].concat(S.log.map((r) => [fmtFull(r.at), (chById(r.ch) || { name: '' }).name, r.text, r.kind]));
      const csv = '﻿' + rows.map((r) => r.map((x) => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'nhat-ky-' + dayKey() + '.csv';
      document.body.appendChild(a); a.click(); a.remove();
    }
    else if (act === 'reset') {
      if (confirm('Xoá toàn bộ dữ liệu trên trình duyệt này? Nên tải bản sao lưu trước.')) { S = blank(); save(); applyTheme(); location.hash = '#/'; render(); toast('Đã làm mới'); }
    }
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    const act = t.dataset && t.dataset.act;
    if (act === 'toggle-daily') {
      const k = dayKey(); S.daily[k] = S.daily[k] || {};
      const item = D.daily.find((x) => x.id === t.dataset.id);
      if (t.checked) { S.daily[k][t.dataset.id] = new Date().toISOString(); addLog(item.channel, 'Xong: ' + item.text, 'ok'); }
      else delete S.daily[k][t.dataset.id];
      save(); rerender();
    } else if (act === 'toggle-task') {
      const ch = t.dataset.ch, i = t.dataset.id;
      S.tasks[ch] = S.tasks[ch] || {};
      if (t.checked) { S.tasks[ch][i] = new Date().toISOString(); addLog(ch, 'Xong: ' + chById(ch).tasks[+i], 'ok'); }
      else delete S.tasks[ch][i];
      save(); rerender();
    } else if (act === 'toggle-video') {
      const wk = weekKey(); S.video[wk] = S.video[wk] || {};
      const step = chById('video').steps.find((s) => s.id === t.dataset.id);
      if (t.checked) { S.video[wk][t.dataset.id] = new Date().toISOString(); addLog('video', 'Video tuần: ' + step.text, 'ok'); }
      else delete S.video[wk][t.dataset.id];
      save(); rerender();
    } else if (t.name === 'theme') { S.theme = t.value; save(); applyTheme(); }
    else if (t.id === 'importfile' && t.files[0]) {
      const r = new FileReader();
      r.onload = () => {
        try {
          const data = JSON.parse(r.result);
          if (data.app !== 'tq-dieu-khien') throw new Error('sai file');
          if (!confirm('Thay dữ liệu hiện tại bằng bản sao lưu ngày ' + fmtFull(data.exported) + '?')) return;
          delete data.app; delete data.exported;
          S = Object.assign(blank(), data); save(); applyTheme(); toast('Đã nạp bản sao lưu'); render();
        } catch (err) { toast('File không đúng bản sao lưu của trang này'); }
      };
      r.readAsText(t.files[0]);
    } else if (t.id === 'logfilter') { location.hash = '#/nhat-ky' + (t.value ? '/' + t.value : ''); }
    else if (t.closest('#leadform') || t.id === 'mstage') leadUpdate();
    else if (t.id === 'regdate') mocUpdate();
  });

  let notesTimer;
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'composer') { S.compose = t.value; save(); composeUpdate(); }
    else if (t.dataset.notes) { clearTimeout(notesTimer); notesTimer = setTimeout(() => { S.notes[t.dataset.notes] = t.value; save(); }, 400); }
    else if (t.dataset.funnel) { const wk = weekKey(); S.funnel[wk] = S.funnel[wk] || {}; S.funnel[wk][t.dataset.funnel] = Math.max(0, parseInt(t.value, 10) || 0); save(); funnelUpdate(); stripUpdate(); }
    else if (t.dataset.goal) { S.goals = S.goals || {}; S.goals[t.dataset.goal] = Math.max(0, parseInt(t.value, 10) || 0); save(); stripUpdate(); }
    else if (t.dataset.mail) { const v = t.value.trim(); if (!v || isMail(v)) { S.mail = v; save(); fixMailLinks(document); } }
    else if (t.id === 'leadformurl') { const v = t.value.trim(); if (!v || isUrl(v)) { S.leadForm = v; save(); } }
    else if (t.id === 'mname' || t.id === 'mworry') msgUpdate();
    else if (t.dataset.cf) { clSetValue(clTpl(), t.dataset.cf, t.value); clUpdate(); }
    else if (t.id === 'cl-out') clOutUpdate();
    else if (t.form && t.form.dataset.form === 'connect') connectPreview(t.form);
  });

  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (f.dataset.form === 'add-log') {
      e.preventDefault();
      const text = f.text.value.trim(); if (!text) return;
      addLog(f.dataset.ch || '', text, 'info'); save(); rerender(); toast('Đã ghi');
    } else if (f.dataset.form === 'connect') {
      e.preventDefault();
      const id = f.dataset.ch, c = chById(id), fld = c.connect.idField;
      let v = f.val.value.trim();
      if (!v) { toast('Nhập ' + fld.label.toLowerCase() + ' trước'); f.val.focus(); return; }
      const st = { status: 'connected', method: f.dataset.method, since: new Date().toISOString(), note: '' };
      if (fld.kind === 'handle') {
        if (!/^@?[A-Za-z0-9._-]{2,40}$/.test(v)) { toast('Tên tài khoản chưa đúng'); return; }
        v = '@' + v.replace(/^@/, '');
        st.handle = v; st.url = c.profile ? c.profile(v) : '';
      } else if (fld.kind === 'url') {
        if (!isUrl(v)) { toast('Link phải bắt đầu bằng https://'); return; }
        st.url = v; st.handle = chState(id).handle || '';
      } else st.handle = v;
      S.channels[id] = st;
      addLog(id, (id === 'lead' ? 'Đã tạo ' : 'Đã kết nối ') + c.name + ' · ' + methodName(c, st.method) + (st.handle ? ' · ' + st.handle : ''), 'ok');
      save();
      toast(id === 'lead' ? 'Đã ghi nhận Sheet Lead' : 'Đã kết nối ' + c.name);
      location.hash = '#/kenh/' + id;
    }
  });

  function applyTheme() {
    if (S.theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', S.theme);
  }
  $('#themebtn').addEventListener('click', () => {
    const dark = S.theme === 'dark' || (S.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    S.theme = dark ? 'light' : 'dark'; save(); applyTheme();
  });

  window.addEventListener('hashchange', render);
  applyTheme();
  renderClock();
  render();
  liveRefresh();
  setInterval(() => {
    renderClock();
    liveRefresh();
    const { route } = parse();
    const busy = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if ((route === '' || route === 'lich' || route === 'doi') && !busy) rerender();
  }, 60e3);
})();

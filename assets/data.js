/*
 * Cấu hình Trung tâm điều khiển — Đầu tư cùng Thiên Quốc
 * Muốn đổi lịch, đường link hay nội dung hướng dẫn thì sửa file này.
 * Trạng thái bạn bấm trên trang (đã kết nối, việc đã làm, nhật ký...) KHÔNG nằm ở đây:
 * nó được lưu trong trình duyệt của bạn và có thể sao lưu ở mục Cài đặt.
 */
window.TQ = window.TQ || {};

TQ.DATA = {
  // Ngày Claude kiểm tra thực tế các kết nối lần gần nhất (dùng làm trạng thái ban đầu)
  asOf: '2026-11-12',

  links: {
    website: 'https://voq30113-bit.github.io/dautucungthienquoc/',
    websiteRepo: 'https://github.com/voq30113-bit/dautucungthienquoc',
    websiteActions: 'https://github.com/voq30113-bit/dautucungthienquoc/actions',
    controlRepo: 'https://github.com/voq30113-bit/trung-tam-dieu-khien',
    claudeDashboard: 'https://claude.ai/artifact/Fbf19pkCLJQJbdMZRsptzx',
    plan: 'https://claude.ai/artifact/Rw2fEfKWkXqf1sdUvGiv2a',
    claude: 'https://claude.ai/new',
    gmail: 'https://mail.google.com/mail/u/0/#inbox'
  },

  // Trạng thái: connected = Đã kết nối · manual = Tự đăng tay · none = Chưa kết nối
  //             reconnect = Cần kết nối lại · notcreated = Chưa tạo · auto = Tự chạy
  channels: [
    {
      id: 'email', name: 'Bản tin email', icon: '✉️', group: 'auto',
      desc: 'Sáu việc tự động trên mây gửi bản tin về hộp thư Gmail của bạn mỗi ngày.',
      seed: { status: 'connected', method: 'claude', handle: 'Gmail', note: 'Claude chạy theo lịch, gửi về hộp thư của bạn.' },
      links: [
        { label: 'Mở Gmail', url: 'https://mail.google.com/mail/u/0/#inbox' },
        { label: 'Bảng dữ liệu trực tiếp (Claude)', url: 'https://claude.ai/artifact/Fbf19pkCLJQJbdMZRsptzx' }
      ],
      connect: {
        methods: [{
          id: 'claude', name: 'Claude gửi qua Gmail', badge: 'Đang dùng',
          text: 'Các việc theo lịch của Claude soạn và gửi bản tin vào hộp thư. Bạn chỉ cần đăng nhập Gmail để đọc.',
          steps: [
            { title: 'Đăng nhập Gmail', text: 'Mở Gmail bằng tài khoản nhận báo cáo.', actions: [{ label: 'Mở Gmail', url: 'https://mail.google.com/mail/u/0/#inbox' }] },
            { title: 'Kiểm tra email bản tin', text: 'Tìm email "Điểm tin tài chính ngày" trong 24 giờ qua. Có là đã chạy.', actions: [{ label: 'Tìm trong Gmail', url: 'https://mail.google.com/mail/u/0/#search/subject%3A%22%C4%90i%E1%BB%83m+tin%22+newer_than%3A2d' }] }
          ]
        }],
        idField: { label: 'Tên hộp thư (ghi chú cho bạn)', placeholder: 'Gmail cá nhân', kind: 'text' }
      },
      tasks: ['Đọc Điểm tin sáng trước 7h30', 'Đọc Tổng kết phiên sau 16h30', 'Đọc Báo cáo vĩ mô tối Chủ nhật']
    },
    {
      id: 'website', name: 'Website', icon: '🌐', group: 'auto',
      desc: 'Trang GitHub Pages tự đăng bài lúc 7h45, 17h45 và 21h45 từ các bản tin.',
      seed: { status: 'connected', method: 'github', handle: 'dautucungthienquoc', url: 'https://voq30113-bit.github.io/dautucungthienquoc/' },
      links: [
        { label: 'Mở website', url: 'https://voq30113-bit.github.io/dautucungthienquoc/' },
        { label: 'Lần đăng tự động (GitHub Actions)', url: 'https://github.com/voq30113-bit/dautucungthienquoc/actions' },
        { label: 'Kho mã website', url: 'https://github.com/voq30113-bit/dautucungthienquoc' }
      ],
      connect: {
        methods: [{
          id: 'github', name: 'GitHub Pages (của riêng bạn)', badge: 'Tự chủ',
          text: 'Website nằm trên tài khoản GitHub của bạn, không thuê dịch vụ nào. Việc tự động đẩy bài lên nhánh content/*, GitHub tự gộp và đăng.',
          steps: [
            { title: 'Đăng nhập GitHub', text: 'Dùng tài khoản voq30113-bit.', actions: [{ label: 'Đăng nhập GitHub', url: 'https://github.com/login' }] },
            { title: 'Xem lần đăng gần nhất', text: 'Dấu tích xanh là đăng thành công. Dấu X đỏ là lỗi: nhắn Claude Code kèm ảnh chụp.', actions: [{ label: 'Mở GitHub Actions', url: 'https://github.com/voq30113-bit/dautucungthienquoc/actions' }] },
            { title: 'Mở website kiểm tra', text: 'Bài mới nhất phải có ngày hôm nay.', actions: [{ label: 'Mở website', url: 'https://voq30113-bit.github.io/dautucungthienquoc/' }] }
          ]
        }],
        idField: { label: 'Địa chỉ website', placeholder: 'https://...github.io/...', kind: 'url' }
      },
      tasks: ['Kiểm tra bài 7h45 đã lên', 'Kiểm tra bài 17h45 đã lên', 'Kiểm tra bài 21h45 đã lên']
    },
    {
      id: 'video', name: 'Video tuần', icon: '🎬', group: 'auto', workflow: true,
      desc: 'Thứ Năm có kịch bản, Thứ Bảy thu âm, Claude Code dựng video và Shorts, rồi đăng.',
      seed: { status: 'auto', method: 'claude-code' },
      links: [
        { label: 'Tìm kịch bản trong Gmail', url: 'https://mail.google.com/mail/u/0/#search/subject%3A%22K%E1%BB%8Bch+b%E1%BA%A3n+video+tu%E1%BA%A7n%22' },
        { label: 'YouTube Studio', url: 'https://studio.youtube.com/' }
      ],
      steps: [
        { id: 'kichban', text: 'Nhận kịch bản (Thứ Năm 19h47)' },
        { id: 'thuam', text: 'Thu âm giọng đọc (Thứ Bảy)' },
        { id: 'dung', text: 'Claude Code dựng video + Shorts (Prompt 6)' },
        { id: 'youtube', text: 'Đăng video lên YouTube' },
        { id: 'shorts', text: 'Đăng Shorts lên TikTok và Facebook' }
      ]
    },
    {
      id: 'youtube', name: 'YouTube', icon: '▶️', group: 'social', platform: 'YOUTUBE',
      desc: 'Kênh "Đầu tư cùng Thiên Quốc" (kênh mới, tách khỏi kênh Bean.).',
      seed: { status: 'none', note: 'Ngày 12/11/2026 vidIQ chưa có kênh YouTube nào được cấp quyền.' },
      links: [
        { label: 'YouTube Studio', url: 'https://studio.youtube.com/' },
        { label: 'Tải video lên', url: 'https://www.youtube.com/upload' }
      ],
      profile: (h) => 'https://www.youtube.com/@' + h.replace(/^@/, ''),
      connect: {
        methods: [
          {
            id: 'tu-chu', name: 'Tự chủ: tự đăng bằng YouTube Studio', badge: 'Không phụ thuộc',
            text: 'Chỉ cần tài khoản Google. Video dựng xong bạn tải lên YouTube Studio.',
            steps: [
              { title: 'Đăng nhập Google', text: 'Dùng tài khoản Google sẽ sở hữu kênh mới.', actions: [{ label: 'Đăng nhập', url: 'https://accounts.google.com/ServiceLogin?service=youtube&continue=https%3A%2F%2Fwww.youtube.com%2F' }] },
              { title: 'Tạo kênh (nếu chưa có)', text: 'Đặt tên "Đầu tư cùng Thiên Quốc". Không dùng chung kênh Bean.', actions: [{ label: 'Tạo kênh', url: 'https://www.youtube.com/create_channel' }, { label: 'Đổi tên / @handle', url: 'https://studio.youtube.com/channel/editing/profile' }] },
              { title: 'Nhập @handle bên dưới', text: 'Trang tạo link kênh để bạn bấm kiểm tra.' }
            ]
          },
          {
            id: 'vidiq', name: 'Tự động: Claude đăng và hẹn giờ (qua vidIQ)', badge: 'Tiện hơn',
            text: 'Claude đăng, hẹn giờ video và Shorts giúp bạn sau khi bạn cấp quyền.',
            steps: [
              { title: 'Nhắn Claude', text: 'Copy câu dưới, dán vào Claude. Claude gửi lại một nút kết nối.', copy: 'Kết nối kênh YouTube "Đầu tư cùng Thiên Quốc" với vidIQ cho tôi', actions: [{ label: 'Mở Claude', url: 'https://claude.ai/new' }] },
              { title: 'Đăng nhập và cho phép', text: 'Bấm nút Claude gửi, chọn ĐÚNG tài khoản Google sở hữu kênh mới, bấm Cho phép.' },
              { title: 'Nhập @handle bên dưới và xác nhận', text: 'Claude sẽ báo lại khi thấy kênh trong vidIQ.' }
            ]
          }
        ],
        idField: { label: '@handle của kênh', placeholder: '@dautucungthienquoc', kind: 'handle' }
      },
      tasks: ['Đặt ảnh đại diện và ảnh bìa', 'Viết phần Giới thiệu kênh có dòng miễn trừ', 'Tạo danh sách phát "Bản tin tuần"']
    },
    {
      id: 'facebook', name: 'Facebook Page', icon: '📘', group: 'social', platform: 'FACEBOOK_PAGES',
      desc: 'Page "Đầu tư cùng Thiên Quốc". Bài tìm khách soạn sẵn lúc 17h25.',
      seed: { status: 'connected', method: 'vidiq', handle: 'Đầu tư cùng Thiên Quốc', url: 'https://www.facebook.com/profile.php?id=735658762958605', note: 'Đã nối vidIQ, đăng được (kiểm tra 12/11/2026).' },
      links: [
        { label: 'Mở Page', url: 'https://www.facebook.com/profile.php?id=735658762958605' },
        { label: 'Meta Business Suite', url: 'https://business.facebook.com/latest/home' },
        { label: 'Soạn bài (Business Suite)', url: 'https://business.facebook.com/latest/composer' }
      ],
      connect: {
        methods: [
          {
            id: 'tu-chu', name: 'Tự chủ: đăng bằng Meta Business Suite', badge: 'Không phụ thuộc',
            text: 'Đăng và hẹn giờ ngay trên công cụ miễn phí của Meta.',
            steps: [
              { title: 'Đăng nhập Facebook', text: 'Dùng tài khoản quản trị Page.', actions: [{ label: 'Đăng nhập', url: 'https://www.facebook.com/login' }] },
              { title: 'Mở Business Suite', text: 'Chọn Page "Đầu tư cùng Thiên Quốc" ở góc trái.', actions: [{ label: 'Mở Business Suite', url: 'https://business.facebook.com/latest/home' }] },
              { title: 'Dán link Page bên dưới và xác nhận' }
            ]
          },
          {
            id: 'vidiq', name: 'Tự động: Claude đăng (qua vidIQ)', badge: 'Đang dùng',
            text: 'Nhắn Claude "đăng bài Facebook hôm nay": Claude lấy bài từ email 17h25, cho bạn xem, bạn đồng ý thì đăng.',
            steps: [
              { title: 'Nếu báo cần kết nối lại', text: 'Copy câu dưới gửi Claude, bấm nút Claude gửi lại, đăng nhập Facebook, tick đúng Page.', copy: 'Kết nối lại Facebook Page "Đầu tư cùng Thiên Quốc" với vidIQ', actions: [{ label: 'Mở Claude', url: 'https://claude.ai/new' }] },
              { title: 'Xác nhận bên dưới' }
            ]
          }
        ],
        idField: { label: 'Link Page', placeholder: 'https://www.facebook.com/...', kind: 'url' }
      },
      tasks: ['Ghim bài giới thiệu bản tin Zalo', 'Bật nút "Gửi tin nhắn" trên Page']
    },
    {
      id: 'tiktok', name: 'TikTok', icon: '🎵', group: 'social', platform: 'TIKTOK',
      desc: 'Video tổng kết phiên quay mặt và Shorts từ video tuần.',
      seed: { status: 'none', note: 'Ngày 12/11/2026 chưa có tài khoản TikTok nào nối với vidIQ.' },
      links: [
        { label: 'TikTok Studio', url: 'https://www.tiktok.com/tiktokstudio' },
        { label: 'Tải video lên', url: 'https://www.tiktok.com/tiktokstudio/upload' }
      ],
      profile: (h) => 'https://www.tiktok.com/@' + h.replace(/^@/, ''),
      connect: {
        methods: [
          {
            id: 'tu-chu', name: 'Tự chủ: tự đăng bằng TikTok Studio', badge: 'Không phụ thuộc',
            text: 'Đăng nhập TikTok trên máy tính hoặc điện thoại, lưu @tên tài khoản ở đây. Bài viết lấy từ mục Đăng bài.',
            steps: [
              { title: 'Đăng nhập TikTok', text: 'Chưa có tài khoản thì bấm Tạo tài khoản, đặt tên "Đầu tư cùng Thiên Quốc".', actions: [{ label: 'Đăng nhập TikTok', url: 'https://www.tiktok.com/login' }, { label: 'Tạo tài khoản', url: 'https://www.tiktok.com/signup' }] },
              { title: 'Mở TikTok Studio', text: 'Nơi tải video và xem số liệu trên máy tính.', actions: [{ label: 'Mở TikTok Studio', url: 'https://www.tiktok.com/tiktokstudio' }] },
              { title: 'Nhập @tên tài khoản bên dưới', text: 'Bấm "Mở hồ sơ" để chắc đúng tài khoản, rồi Xác nhận.' }
            ]
          },
          {
            id: 'vidiq', name: 'Tự động: Claude đăng và hẹn giờ (qua vidIQ)', badge: 'Tiện hơn',
            text: 'Sau khi cấp quyền, Claude đăng Shorts lên TikTok giúp bạn (luôn hỏi bạn trước).',
            steps: [
              { title: 'Nhắn Claude', text: 'Copy câu dưới, dán vào Claude. Claude gửi lại nút "Kết nối TikTok".', copy: 'Kết nối TikTok của tôi với vidIQ để đăng bài', actions: [{ label: 'Mở Claude', url: 'https://claude.ai/new' }] },
              { title: 'Đăng nhập TikTok và cho phép', text: 'Bấm nút Claude gửi, đăng nhập đúng tài khoản, bấm Cho phép.' },
              { title: 'Nhập @tên tài khoản bên dưới và xác nhận' }
            ]
          }
        ],
        idField: { label: '@tên tài khoản TikTok', placeholder: '@dautucungthienquoc', kind: 'handle' }
      },
      tasks: ['Viết tiểu sử có lời mời nhận bản tin Zalo', 'Chuyển sang tài khoản Doanh nghiệp để xem số liệu']
    },
    {
      id: 'threads', name: 'Threads', icon: '🧵', group: 'social', platform: 'THREADS',
      desc: 'Mỗi ngày giao dịch có 2 bài Threads soạn sẵn trong email 17h25.',
      seed: { status: 'manual', method: 'tu-chu', note: 'Công cụ đăng tự động chưa hỗ trợ Threads. Dùng mục Đăng bài: một nút mở Threads với bài đã điền sẵn.' },
      links: [
        { label: 'Mở Threads', url: 'https://www.threads.net/' },
        { label: 'Đăng bài trên Threads', url: 'https://www.threads.net/intent/post' }
      ],
      profile: (h) => 'https://www.threads.net/@' + h.replace(/^@/, ''),
      connect: {
        methods: [{
          id: 'tu-chu', name: 'Tự chủ: nút "Đăng lên Threads" có sẵn nội dung', badge: 'Không phụ thuộc',
          text: 'Trang mở Threads với bài viết đã điền sẵn. Bạn chỉ bấm Đăng.',
          steps: [
            { title: 'Đăng nhập Threads', text: 'Threads dùng tài khoản Instagram.', actions: [{ label: 'Đăng nhập Threads', url: 'https://www.threads.net/login' }] },
            { title: 'Nhập @tên tài khoản bên dưới và xác nhận' }
          ]
        }],
        idField: { label: '@tên tài khoản Threads', placeholder: '@dautucungthienquoc', kind: 'handle' }
      },
      tasks: ['Viết tiểu sử có lời mời nhận bản tin Zalo']
    },
    {
      id: 'zalo', name: 'Zalo', icon: '💬', group: 'social',
      desc: 'Cộng đồng "Đầu tư cùng Thiên Quốc – Bản tin sáng". Gửi bản tin 7h mỗi sáng.',
      seed: { status: 'manual', method: 'tu-chu', note: 'Zalo không cho công cụ bên ngoài đăng thay. Copy bản tin 7h từ mục Đăng bài rồi dán.' },
      links: [
        { label: 'Zalo trên web', url: 'https://chat.zalo.me/' },
        { label: 'Zalo Official Account', url: 'https://oa.zalo.me/' }
      ],
      connect: {
        methods: [{
          id: 'tu-chu', name: 'Tự chủ: copy và dán vào cộng đồng', badge: 'Không phụ thuộc',
          text: 'Mỗi sáng bấm Copy ở mục Đăng bài, mở Zalo, dán vào cộng đồng.',
          steps: [
            { title: 'Đăng nhập Zalo trên web', text: 'Quét mã QR bằng Zalo trên điện thoại.', actions: [{ label: 'Mở Zalo web', url: 'https://chat.zalo.me/' }] },
            { title: 'Dán link mời cộng đồng bên dưới', text: 'Trong cộng đồng: Tuỳ chọn → Link tham gia → Sao chép. Link này dùng cho lời mời cuối mọi bài.' }
          ]
        }],
        idField: { label: 'Link tham gia cộng đồng Zalo', placeholder: 'https://zalo.me/g/...', kind: 'url' }
      },
      tasks: ['Ghim nội quy cộng đồng có dòng miễn trừ', 'Bật duyệt thành viên mới']
    },
    {
      id: 'lead', name: 'Khách đăng ký', icon: '📋', group: 'khach',
      desc: 'Google Form + Sheet Lead, chấm điểm và nhắc việc mỗi sáng bằng Apps Script.',
      seed: { status: 'notcreated', note: 'Ngày 12/11/2026 chưa thấy Sheet "Lead – Đầu tư cùng Thiên Quốc" trên Drive.' },
      links: [
        { label: 'Trợ lý tìm khách', url: '#/tim-khach' },
        { label: 'Google Forms', url: 'https://docs.google.com/forms/u/0/' },
        { label: 'Google Sheets', url: 'https://docs.google.com/spreadsheets/u/0/' },
        { label: 'Kế hoạch hệ thống', url: 'https://claude.ai/artifact/Rw2fEfKWkXqf1sdUvGiv2a' }
      ],
      connect: {
        methods: [{
          id: 'google', name: 'Google Form + Sheet của chính bạn', badge: 'Miễn phí',
          text: 'Dữ liệu khách nằm trong Google Drive của bạn, chỉ bạn xem được. Trang này không lưu thông tin khách.',
          steps: [
            { title: 'Tạo Google Form', text: 'Tên: "Đăng ký nhận bản tin – Đầu tư cùng Thiên Quốc". 10 câu theo mục Form đăng ký trong kế hoạch. Có ô Đồng ý.', actions: [{ label: 'Tạo Form mới', url: 'https://forms.new' }, { label: 'Mở kế hoạch', url: 'https://claude.ai/artifact/Rw2fEfKWkXqf1sdUvGiv2a' }] },
            { title: 'Liên kết với Sheet', text: 'Trong Form: tab Câu trả lời → Liên kết với Trang tính → Tạo bảng tính mới, đặt tên "Lead – Đầu tư cùng Thiên Quốc".' },
            { title: 'Cài Apps Script chấm điểm', text: 'Mở Claude Code, dán Prompt 1 (prompts/01-apps-script-lead.md).' },
            { title: 'Dán link Sheet bên dưới và xác nhận', text: 'Link chỉ lưu trên máy bạn để mở nhanh.' }
          ]
        }],
        idField: { label: 'Link Sheet Lead', placeholder: 'https://docs.google.com/spreadsheets/d/...', kind: 'url' }
      },
      tasks: ['Tạo Google Form 10 câu', 'Liên kết Sheet Lead', 'Chạy Prompt 1 (Apps Script)', 'Gắn link Form vào website và tiểu sử các kênh']
    }
  ],

  // Việc tự động trên mây (giờ Việt Nam). days: 0 = Chủ nhật ... 6 = Thứ Bảy
  jobs: [
    { id: 'diem-tin', name: 'Điểm tin sáng', channel: 'email', days: [1, 2, 3, 4, 5], times: ['07:00'], subject: 'Điểm tin tài chính ngày' },
    { id: 'nhan-dinh', name: 'Nhận định trước phiên', channel: 'email', days: [1, 2, 3, 4, 5], times: ['07:00'], subject: 'Nhận định trước phiên' },
    { id: 'tong-ket', name: 'Tổng kết phiên', channel: 'email', days: [1, 2, 3, 4, 5], times: ['16:30'], subject: 'Tổng kết phiên' },
    { id: 'tim-khach', name: 'Nội dung tìm khách (FB · TikTok · Threads)', channel: 'email', days: [1, 2, 3, 4, 5], times: ['17:25'], subject: 'Nội dung tìm khách' },
    { id: 'kich-ban', name: 'Kịch bản video tuần', channel: 'video', days: [4], times: ['19:47'], subject: 'Kịch bản video tuần' },
    { id: 'vi-mo', name: 'Báo cáo vĩ mô tuần', channel: 'email', days: [0], times: ['20:00'], subject: 'Báo cáo vĩ mô' },
    { id: 'web', name: 'Đăng bài lên website', channel: 'website', days: [0, 1, 2, 3, 4, 5, 6], times: ['07:45', '17:45', '21:45'], subject: 'Đã đăng website' }
  ],

  // Việc tay mỗi ngày (tự làm mới mỗi ngày)
  daily: [
    { id: 'zalo-7h', time: '07:05', text: 'Copy Nhận định trước phiên vào cộng đồng Zalo', channel: 'zalo', days: [1, 2, 3, 4, 5], go: '#/dang-bai' },
    { id: 'lead-8h', time: '08:00', text: 'Nhắn khách cần follow-up hôm nay', channel: 'lead', days: [1, 2, 3, 4, 5], go: '#/tim-khach' },
    { id: 'tiktok-16h', time: '16:45', text: 'Quay và đăng video tổng kết phiên lên TikTok', channel: 'tiktok', days: [1, 2, 3, 4, 5], go: '#/dang-bai' },
    { id: 'fb-17h', time: '17:30', text: 'Đăng bài tìm khách lên Facebook Page', channel: 'facebook', days: [1, 2, 3, 4, 5], go: '#/dang-bai' },
    { id: 'threads-17h', time: '17:30', text: 'Đăng 2 bài Threads', channel: 'threads', days: [1, 2, 3, 4, 5], go: '#/dang-bai' },
    { id: 'thuam-t7', time: '09:00', text: 'Thu âm giọng đọc video tuần', channel: 'video', days: [6], go: '#/kenh/video' }
  ],

  // Quy tắc nội dung (bản rút gọn để rà bài trước khi đăng)
  compliance: {
    banned: ['cam kết', 'chắc chắn', 'kèo', 'x2 tài khoản', 'x2 tk', 'x3 tài khoản', 'bao lãi', 'đảm bảo lợi nhuận', 'lãi chắc', 'chắc thắng', 'không thể thua', 'mua ngay', 'bán ngay', 'khuyến nghị mua', 'khuyến nghị bán', 'điểm mua', 'tín hiệu mua', 'all in', 'tất tay', 'cầm chắc', 'lợi nhuận tối thiểu'],
    brokers: ['SSI', 'VPS', 'VNDirect', 'VNDIRECT', 'HSC', 'MBS', 'TCBS', 'Vietcap', 'KIS', 'Mirae', 'ACBS', 'BSC', 'VCBS', 'FPTS', 'DNSE', 'Pinetree', 'KBSV', 'Yuanta', 'Rồng Việt', 'VDSC', 'Phú Hưng', 'Shinhan', 'SHS', 'Agriseco', 'BVSC', 'Vietinbank Securities', 'TPS', 'VIX'],
    notTickers: ['VNI', 'HNX', 'HOSE', 'UPCOM', 'VN30', 'GDP', 'CPI', 'FED', 'USD', 'VND', 'ETF', 'IPO', 'ROE', 'ROA', 'EPS', 'NIM', 'FDI', 'PMI', 'ECB', 'BOJ', 'SBV', 'NHNN', 'ATC', 'ATO', 'TPCP', 'OTC', 'CEO', 'ESG', 'AI', 'BĐS', 'DXY', 'PCE', 'NFP', 'OPEC', 'IMF', 'WTO', 'WB', 'ADB', 'GTGT', 'TNDN', 'TNCN', 'KRX', 'MSCI', 'FTSE', 'YTD', 'QoQ', 'YoY', 'TP', 'HCM', 'TPHCM', 'Q1', 'Q2', 'Q3', 'Q4', 'Zalo', 'FB', 'OK'],
    disclaimer: 'Thông tin tham khảo, không phải khuyến nghị đầu tư.',
    cta: 'Nhận bản tin trước phiên 7h miễn phí qua Zalo'
  },

  // Trợ lý Claude: mẫu yêu cầu. Trang ghép bối cảnh thương hiệu + quy tắc + mẫu, rồi mở Claude.ai.
  claude: {
    url: 'https://claude.ai/new',
    // Bối cảnh gắn vào đầu mọi yêu cầu
    context: [
      'Bạn đang viết cho thương hiệu "Đầu tư cùng Thiên Quốc" của Thiên Quốc, môi giới chứng khoán tại TP.HCM, làm nội dung giáo dục tài chính cho người mới và nhà đầu tư cá nhân.',
      'Viết bằng tiếng Việt, dễ hiểu, không thuật ngữ khó khi không cần. Xưng "mình"; gọi người đọc là "anh chị" (bài đăng, bản tin) hoặc "bạn" (video, website).',
      'Quy tắc bắt buộc:',
      '1. Không nói chắc giá sẽ tăng hay giảm, không hứa lợi nhuận.',
      '2. Không khuyến nghị mua/bán mã cổ phiếu cụ thể.',
      '3. Không nhắc tên công ty chứng khoán nào.',
      '4. Không dùng các chữ "cam kết", "chắc chắn", "kèo", "x2 tài khoản".',
      '5. Mọi con số (lãi suất, tỷ giá, chỉ số, phí, thuế) phải ghi nguồn và thời điểm; không chắc thì ghi [CẦN KIỂM TRA], không đoán.',
      '6. Không hỏi hay nhắc tới thông tin cá nhân của khách.',
      'Nội dung công khai kết thúc bằng lời mời: "Nhận bản tin trước phiên 7h miễn phí qua Zalo" và dòng "Thông tin tham khảo, không phải khuyến nghị đầu tư."'
    ],
    randomTopics: [
      'Lãi suất điều hành ảnh hưởng tới thị trường chứng khoán thế nào',
      'Tỷ giá USD/VND và nhóm doanh nghiệp xuất nhập khẩu',
      'P/E là gì và vì sao P/E thấp chưa chắc là rẻ',
      'Dòng tiền khối ngoại: đọc thế nào cho đúng',
      'Chu kỳ ngành ngân hàng: các chỉ số cần theo dõi (NIM, nợ xấu, tăng trưởng tín dụng)',
      'Giá dầu thế giới tác động tới kinh tế Việt Nam ra sao',
      'Nâng hạng thị trường: ý nghĩa với nhà đầu tư cá nhân',
      'Lạm phát (CPI) và quyết định phân bổ tài sản',
      'Đầu tư định kỳ (DCA) so với mua một lần',
      'Đọc báo cáo kết quả kinh doanh quý trong 10 phút',
      'Margin: cơ chế, rủi ro và cách tính tỷ lệ ký quỹ',
      'Chứng chỉ quỹ ETF dành cho người mới',
      'Trái phiếu doanh nghiệp: lợi suất và rủi ro',
      'Cổ tức tiền mặt và cổ tức cổ phiếu khác nhau thế nào',
      'Chính sách tài khoá, đầu tư công và nhóm ngành liên quan',
      'Kinh tế Mỹ, Fed và tác động tới thị trường mới nổi',
      'Quản trị rủi ro: tỷ trọng, cắt lỗ và đa dạng hoá danh mục',
      'Tâm lý đám đông (FOMO) và sai lầm thường gặp của người mới',
      'Chỉ số PMI và sức khoẻ ngành sản xuất',
      'Bất động sản và tín dụng: mối liên hệ cần biết'
    ],
    templates: [
      {
        id: 'bai-dang', icon: '✍️', name: 'Viết bài đăng',
        desc: 'Bài Facebook, chú thích TikTok, bài Threads hoặc tin Zalo.',
        fields: [
          { id: 'platform', label: 'Nền tảng', type: 'select', options: ['Facebook Page', 'TikTok (chú thích video)', 'Threads (2 bài ngắn)', 'Zalo cộng đồng'] },
          { id: 'topic', label: 'Chủ đề', type: 'text', placeholder: 'Ví dụ: vì sao người mới nên có quỹ dự phòng trước khi đầu tư', random: true },
          { id: 'style', label: 'Giọng văn', type: 'select', options: ['Giáo dục, rõ ràng', 'Kể chuyện gần gũi', 'Hỏi đáp', 'Danh sách mẹo'] },
          { id: 'note', label: 'Ý muốn thêm (không bắt buộc)', type: 'textarea', placeholder: 'Dán ý chính, số liệu có nguồn, hoặc bài 17h25 để Claude viết lại...' }
        ],
        task: (v) => 'Viết một bài cho ' + v.platform + ' về chủ đề: "' + v.topic + '". Giọng văn: ' + v.style + '.\n' +
          ({ 'Facebook Page': 'Độ dài 150–250 chữ, mở đầu bằng một câu gây tò mò, chia đoạn ngắn, tối đa 3 emoji, 3–5 hashtag cuối bài.',
             'TikTok (chú thích video)': 'Chú thích dưới 300 ký tự, một câu móc đầu, 3–5 hashtag. Kèm thêm 3 ý chính để mình nói trong video 45 giây.',
             'Threads (2 bài ngắn)': 'Viết 2 bài riêng biệt, mỗi bài dưới 450 ký tự, đánh số Bài 1 / Bài 2. Mỗi bài tự đủ ý.',
             'Zalo cộng đồng': 'Tin nhắn 120–200 chữ, văn bản thuần, không hashtag, gạch đầu dòng bằng dấu "-".' }[v.platform] || '') +
          (v.note ? '\nTư liệu/ý muốn thêm:\n' + v.note : '') +
          '\nTrả về đúng nội dung để copy đăng, không giải thích thêm. Sau đó, ở cuối, liệt kê riêng các con số cần kiểm tra lại (nếu có).'
      },
      {
        id: 'bao-cao', icon: '📊', name: 'Báo cáo phân tích',
        desc: 'Một báo cáo ngắn về vĩ mô, ngành hoặc một khái niệm. Có nút chọn chủ đề ngẫu nhiên.',
        fields: [
          { id: 'topic', label: 'Chủ đề', type: 'text', placeholder: 'Bấm 🎲 để chọn chủ đề ngẫu nhiên', random: true },
          { id: 'depth', label: 'Độ dài', type: 'select', options: ['Ngắn (khoảng 1 trang)', 'Vừa (2–3 trang)', 'Chi tiết (có bảng số liệu)'] },
          { id: 'reader', label: 'Người đọc', type: 'select', options: ['Người mới bắt đầu', 'Nhà đầu tư đã có kinh nghiệm', 'Dùng làm tư liệu cho mình'] },
          { id: 'note', label: 'Góc nhìn / câu hỏi muốn trả lời (không bắt buộc)', type: 'textarea', placeholder: 'Ví dụ: tập trung vào tác động tới nhóm ngân hàng trong 6 tháng tới' }
        ],
        task: (v) => 'Viết một báo cáo phân tích về: "' + v.topic + '". Độ dài: ' + v.depth + '. Người đọc: ' + v.reader + '.\n' +
          'Hãy tìm kiếm web để lấy số liệu mới nhất có thể, ghi rõ nguồn và ngày cho từng con số. Không tìm được thì ghi [CẦN KIỂM TRA].\n' +
          'Cấu trúc: 1) Tóm tắt 3 ý chính. 2) Bối cảnh và số liệu. 3) Các yếu tố cần theo dõi (kịch bản tích cực / tiêu cực, không dự đoán chắc chắn). 4) Ý nghĩa với nhà đầu tư cá nhân (giáo dục, không khuyến nghị mã). 5) Nguồn tham khảo.\n' +
          (v.note ? 'Góc nhìn mong muốn: ' + v.note + '\n' : '') +
          'Cuối cùng, gợi ý 3 ý có thể cắt thành bài đăng mạng xã hội.'
      },
      {
        id: 'kich-ban', icon: '🎬', name: 'Kịch bản video ngắn',
        desc: 'Kịch bản 45–60 giây cho TikTok, YouTube Shorts.',
        fields: [
          { id: 'topic', label: 'Chủ đề', type: 'text', placeholder: 'Ví dụ: 3 sai lầm khi mới mở tài khoản chứng khoán', random: true },
          { id: 'length', label: 'Độ dài', type: 'select', options: ['30 giây', '45 giây', '60 giây', '90 giây'] },
          { id: 'format', label: 'Hình thức', type: 'select', options: ['Nói trước camera', 'Lồng tiếng + chữ trên màn hình', 'Tổng kết phiên'] }
        ],
        task: (v) => 'Viết kịch bản video ' + v.length + ' về: "' + v.topic + '". Hình thức: ' + v.format + '. Xưng "mình", gọi "bạn".\n' +
          'Trình bày theo bảng 3 cột: Thời điểm | Lời nói | Chữ/hình trên màn hình. 3 giây đầu phải có câu móc. Kết video bằng lời mời nhận bản tin Zalo.\n' +
          'Sau kịch bản: đề xuất 3 tiêu đề, 1 chú thích dưới 300 ký tự kèm hashtag.'
      },
      {
        id: 'tra-loi', icon: '💬', name: 'Trả lời bình luận / tin nhắn',
        desc: 'Dán câu hỏi của người xem, Claude soạn câu trả lời đúng quy tắc.',
        fields: [
          { id: 'question', label: 'Câu hỏi / bình luận (bỏ tên, số điện thoại trước khi dán)', type: 'textarea', placeholder: 'Ví dụ: Anh ơi mã này giờ vào được chưa ạ?' },
          { id: 'where', label: 'Trả lời ở đâu', type: 'select', options: ['Bình luận công khai', 'Tin nhắn riêng'] }
        ],
        task: (v) => 'Soạn câu trả lời (' + v.where + ') cho câu hỏi sau của một người xem:\n"""\n' + v.question + '\n"""\n' +
          'Nếu câu hỏi xin khuyến nghị mã cụ thể hoặc hỏi giá sẽ tăng/giảm: từ chối nhẹ nhàng, giải thích vì sao mình không khuyến nghị, rồi đưa kiến thức chung giúp họ tự đánh giá. ' +
          'Dưới 80 chữ cho bình luận, dưới 150 chữ cho tin nhắn. Đưa 2 phương án để mình chọn.'
      },
      {
        id: 'tu-do', icon: '✨', name: 'Yêu cầu tự do',
        desc: 'Gõ bất cứ yêu cầu nào, trang tự gắn bối cảnh thương hiệu và quy tắc.',
        fields: [
          { id: 'ask', label: 'Bạn muốn Claude làm gì?', type: 'textarea', placeholder: 'Ví dụ: Lên lịch nội dung 2 tuần cho TikTok, mỗi ngày một chủ đề, xen kẽ kiến thức và tổng kết phiên' }
        ],
        task: (v) => v.ask
      }
    ]
  },

  // Giới hạn ký tự từng nền tảng
  limits: { threads: 500, tiktok: 2200, facebook: 63206, zalo: 4000, youtube: 5000 }
};

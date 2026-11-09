/* ============================================================
   EtikaSosial — script.js
   Berisi: tema, navigasi, router halaman, artikel, simulasi CS,
   autentikasi user/admin, tiket pengaduan, dan formulir kontak.
   ============================================================ */

"use strict";

/* Selalu mulai dari atas halaman agar gerbang login tidak terbuka di tengah. */
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

/* ---------- 1. Utilitas ---------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const STORAGE = {
  users: "es_users",
  session: "es_session",
  tickets: "es_tickets",
  contact: "es_contact",
  theme: "es_theme",
};

const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* penyimpanan penuh atau diblokir: abaikan agar UI tetap berjalan */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      /* abaikan */
    }
  },
};

const uid = (prefix = "") =>
  prefix + Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-4);

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char];
  });

const formatDate = (iso) => {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch (error) {
    return "-";
  }
};

const formatDateTime = (iso) => {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch (error) {
    return "-";
  }
};

const nowTime = () =>
  new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date());

const initials = (name = "") =>
  String(name)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

/* ---------- 2. Toast ---------- */
const toastStack = $("#toastStack");

function toast(type, title, message) {
  if (!toastStack) return;
  const icons = { success: "✓", error: "!", info: "i" };
  const el = document.createElement("div");
  el.className = "toast toast--" + type;
  el.innerHTML =
    '<span class="toast-icon" aria-hidden="true">' +
    (icons[type] || "i") +
    "</span><div><strong>" +
    escapeHtml(title) +
    "</strong><p>" +
    escapeHtml(message || "") +
    "</p></div>";
  toastStack.appendChild(el);

  window.setTimeout(() => {
    el.classList.add("is-out");
    window.setTimeout(() => el.remove(), 360);
  }, 4600);
}

/* ---------- 3. Tema terang / gelap ---------- */
const themeToggle = $("#themeToggle");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  store.set(STORAGE.theme, theme);
}

const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
applyTheme(store.get(STORAGE.theme, prefersLight ? "light" : "dark"));

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(next);
    toast("info", next === "light" ? "Tema terang aktif" : "Tema gelap aktif", "Preferensi tersimpan di peramban ini.");
  });
}

/* ---------- 4. Header, progress, back to top ---------- */
const header = $("#siteHeader");
const headerProgress = $("#headerProgress");
const backToTop = $("#backToTop");

function onScroll() {
  const y = window.scrollY || window.pageYOffset;
  if (header) header.classList.toggle("is-scrolled", y > 8);
  if (backToTop) backToTop.classList.toggle("is-visible", y > 620);
  if (headerProgress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const percent = max > 0 ? (y / max) * 100 : 0;
    headerProgress.style.width = percent + "%";
  }
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

if (backToTop) {
  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* ---------- 5. Navigasi seluler ---------- */
const navToggle = $("#navToggle");
const mainNav = $("#mainNav");

function closeMobileNav() {
  if (!mainNav || !navToggle) return;
  mainNav.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
}

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const open = mainNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  mainNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMobileNav();
  });

  document.addEventListener("click", (event) => {
    if (!mainNav.classList.contains("is-open")) return;
    if (event.target.closest("#mainNav") || event.target.closest("#navToggle")) return;
    closeMobileNav();
  });
}

/* ---------- 6. Data artikel ---------- */
const POSTS = {
  "komentar-empati": {
    title: "Berkomentar dengan Empati: Seni Menyampaikan Kritik di Ruang Digital",
    category: "Etika Digital",
    date: "2026-10-14",
    read: "6 menit baca",
    tags: ["#KomentarSehat", "#EmpatiDigital", "#KritikKonstruktif"],
    image:
      "https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=1400",
    imageAlt:
      "Seorang perempuan mengetik di laptop di atas meja putih, ditemani buku catatan, ponsel, dan secangkir kopi",
    sourceLabel: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/4050315/",
    body:
      "<p>Kritik dan penghinaan sering kali hanya dipisahkan oleh satu kata. Keduanya sama-sama menyampaikan ketidaksetujuan, tetapi yang satu membuka ruang perbaikan, sedangkan yang lain menutup pintu komunikasi. Di media sosial, perbedaan ini menjadi semakin rumit karena tulisan tidak membawa intonasi. Kalimat yang di kepala kita terdengar tegas bisa terbaca sebagai serangan di layar orang lain.</p>" +
      "<p>Etika berkomentar bertumpu pada satu pertanyaan sederhana: apakah yang saya tulis membantu orang lain memahami sesuatu, atau hanya melampiaskan emosi saya? Komentar yang berfokus pada gagasan, bukan pada fisik, keluarga, agama, atau latar belakang penulis, memiliki peluang jauh lebih besar untuk didengar. Sebaliknya, komentar yang menyerang pribadi hampir selalu memicu pembelaan, bukan perubahan.</p>" +
      "<h3>Tiga kebiasaan yang bisa langsung diterapkan</h3>" +
      "<ul>" +
      "<li><strong>Gunakan kalimat &ldquo;saya&rdquo;.</strong> Daripada menulis &ldquo;kamu salah dan tidak paham apa-apa&rdquo;, cobalah &ldquo;saya membaca sumber yang berbeda, bolehkah kamu sertakan tautannya?&rdquo;. Kalimat seperti ini menyampaikan ketidaksetujuan tanpa merendahkan lawan bicara.</li>" +
      "<li><strong>Tanyakan niat sebelum menekan kirim.</strong> Jika tujuanmu hanya membuat orang lain malu di depan publik, tahan komentar itu. Kritik yang baik disampaikan untuk memperbaiki keadaan, bukan untuk mendapatkan sorakan dari penonton.</li>" +
      "<li><strong>Beri jeda sepuluh menit.</strong> Emosi di media sosial bergerak jauh lebih cepat daripada pikiran. Menunda sebentar sering cukup untuk mengubah kalimat yang menyakitkan menjadi pertanyaan yang membangun.</li>" +
      "</ul>" +
      "<p>Hal yang sering dilupakan adalah posisi saksi. Ketika seseorang dirundung di kolom komentar, kehadiran orang lain yang ikut menertawakan membuat dampaknya berkali-kali lipat. Sebaliknya, satu komentar yang menenangkan dapat mengubah suasana seluruh percakapan. Menjadi saksi yang baik berarti berani mengatakan &ldquo;ini sudah keterlaluan&rdquo; tanpa harus ikut berdebat panjang.</p>" +
      "<blockquote>Sopan bukan berarti setuju. Sopan berarti tetap membuka jalan bagi orang lain untuk berubah.</blockquote>" +
      "<p>Jika kamu berada di posisi korban, kamu berhak memblokir, melaporkan, dan menyimpan bukti sebelum memutuskan langkah berikutnya. Jangan ragu menceritakan kepada orang yang kamu percaya. Etika digital bukan hanya soal menghukum pelaku, tetapi juga soal memastikan korban tidak menghadapi tekanannya sendirian.</p>",
  },

  "jejak-digital": {
    title: "Jejak Digital: Mengapa Unggahan Masa Lalu Bisa Menentukan Masa Depanmu",
    category: "Privasi & Keamanan",
    date: "2026-10-21",
    read: "7 menit baca",
    tags: ["#JejakDigital", "#Privasi", "#ReputasiOnline"],
    image:
      "https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=1400",
    imageAlt:
      "Tampilan dekat deretan ikon media sosial seperti Instagram, Facebook, Twitter, dan YouTube pada layar ponsel",
    sourceLabel: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/267350/",
    body:
      "<p>Internet tidak benar-benar lupa. Sebuah unggahan yang dihapus hari ini bisa saja sudah tersimpan sebagai tangkapan layar, masuk ke grup percakapan, atau terindeks mesin pencari. Banyak orang baru menyadari hal ini ketika melamar pekerjaan, mendaftar beasiswa, atau menjalin hubungan baru, lalu mendapati bahwa masa lalunya mudah ditemukan hanya dengan mengetik namanya.</p>" +
      "<p>Jejak digital bukan hanya tentang foto. Ia mencakup komentar di forum lama, ulasan yang ditulis saat marah, alamat surel yang pernah dipakai, nomor telepon di unggahan jual beli, hingga lokasi yang tercatat pada metadata foto. Semua potongan kecil ini, bila digabungkan, dapat membentuk gambaran yang jauh lebih lengkap daripada yang kita bayangkan.</p>" +
      "<h3>Mengapa jejak digital penting</h3>" +
      "<p>Perekrut kerja, panitia beasiswa, dan calon mitra bisnis kini terbiasa memeriksa jejak publik seseorang. Mereka mencari konsistensi antara apa yang kita tulis dan bagaimana kita bersikap. Satu komentar kasar yang ditulis lima tahun lalu bisa menjadi pertanyaan besar dalam wawancara, meskipun kita sudah berubah. Di sisi lain, jejak digital yang positif, seperti tulisan, karya, atau dokumentasi kegiatan sosial, dapat menjadi bukti kompetensi yang sulit dibantah.</p>" +
      "<h3>Langkah sederhana mengelola jejak digital</h3>" +
      "<ul>" +
      "<li><strong>Audit nama sendiri.</strong> Cari namamu di mesin pencari setiap beberapa bulan, lalu periksa hasil yang muncul di halaman pertama.</li>" +
      "<li><strong>Pisahkan ruang pribadi dan profesional.</strong> Gunakan pengaturan privasi yang berbeda untuk akun keluarga dan akun yang kamu pakai untuk bekerja atau berkarya.</li>" +
      "<li><strong>Hindari membagikan data sensitif.</strong> Nomor identitas, alamat rumah, tiket perjalanan, dan foto dokumen sebaiknya tidak pernah diunggah ke ruang publik.</li>" +
      "<li><strong>Matikan geotag pada unggahan real-time.</strong> Menandai lokasi saat sedang bepergian memberi tahu orang lain bahwa rumahmu sedang kosong.</li>" +
      "</ul>" +
      "<p>Menghapus unggahan lama memang tidak menjamin semuanya hilang, tetapi tetap bermanfaat. Mulailah dari akun yang paling sering dilihat orang, lalu lanjutkan ke platform yang jarang kamu buka. Jika menemukan konten yang sudah tidak mencerminkan dirimu, hapus atau ubah pengaturannya menjadi pribadi.</p>" +
      "<blockquote>Reputasi online dibangun bertahun-tahun, tetapi bisa runtuh dalam satu unggahan yang salah tempat.</blockquote>" +
      "<p>Pada akhirnya, mengelola jejak digital bukan tentang berpura-pura sempurna. Ini tentang kesadaran bahwa apa yang kita bagikan akan dibaca oleh orang yang belum mengenal kita. Sedikit kehati-hatian hari ini akan menghemat banyak penjelasan di kemudian hari.</p>",
  },

  "verifikasi-hoaks": {
    title: "Verifikasi Sebelum Membagikan: Melawan Hoaks Tanpa Ikut Menyebarkannya",
    category: "Literasi Digital",
    date: "2026-10-28",
    read: "6 menit baca",
    tags: ["#AntiHoaks", "#FaktaCek", "#LiterasiDigital"],
    image:
      "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1400",
    imageAlt:
      "Enam tangan saling menumpuk di atas meja kerja kayu sebagai simbol kerja sama, dengan laptop dan dokumen di sekitarnya",
    sourceLabel: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/3184418/",
    body:
      "<p>Hoaks jarang datang dalam bentuk yang jelas-jelas palsu. Ia biasanya dibungkus dengan judul yang emosional, potongan video yang dipotong sedemikian rupa, atau tangkapan layar tanpa konteks. Karena terasa mendesak dan membuat marah, banyak orang membagikannya sebelum sempat berpikir. Padahal, setiap kali hoaks dibagikan, jangkauannya bertambah dan biaya untuk meluruskannya semakin besar.</p>" +
      "<p>Melawan hoaks tidak selalu berarti menjadi ahli pemeriksa fakta. Sebagian besar hoaks dapat dikenali dari pola sederhana: sumbernya tidak jelas, tanggalnya tidak cocok, gambar terasa terlalu dramatis, atau isinya meminta kita segera menyebarkan ke banyak grup. Semakin sebuah pesan mendesak kita untuk bertindak cepat, semakin besar alasan untuk berhenti dan memeriksanya.</p>" +
      "<h3>Ciri hoaks yang perlu diwaspadai</h3>" +
      "<ul>" +
      "<li>Judul memancing emosi dan menggunakan huruf kapital berlebihan.</li>" +
      "<li>Tidak mencantumkan nama media, penulis, atau tanggal peristiwa.</li>" +
      "<li>Meminta pembaca menyebarkan pesan &ldquo;sebelum dihapus&rdquo;.</li>" +
      "<li>Menggunakan foto lama untuk peristiwa baru.</li>" +
      "<li>Menyertakan satu kutipan tanpa tautan ke pidato atau dokumen aslinya.</li>" +
      "</ul>" +
      "<h3>Lima langkah verifikasi</h3>" +
      "<ol>" +
      "<li><strong>Baca seluruh isi, bukan hanya judul.</strong> Banyak hoaks runtuh ketika dibaca sampai akhir.</li>" +
      "<li><strong>Cari sumber aslinya.</strong> Periksa apakah peristiwa itu benar-benar diberitakan media kredibel dan apakah tanggalnya sesuai.</li>" +
      "<li><strong>Periksa gambar dengan pencarian terbalik.</strong> Foto yang sama sering muncul dalam konteks yang berbeda beberapa tahun sebelumnya.</li>" +
      "<li><strong>Bandingkan dengan lebih dari satu sumber.</strong> Satu sumber tidak cukup, terutama jika isinya sangat emosional.</li>" +
      "<li><strong>Tunggu sebelum membagikan.</strong> Jika masih ragu, jangan sebarkan. Diam bukan berarti tidak peduli.</li>" +
      "</ol>" +
      "<p>Ketika menemukan hoaks, langkah paling membantu adalah melaporkannya ke platform, memberi tahu pengirim dengan sopan disertai tautan klarifikasi, dan tidak menyebarkan ulang kontennya meski untuk tujuan mengoreksi. Tangkapan layar yang disensor biasanya lebih aman daripada membagikan tautan aslinya.</p>" +
      "<blockquote>Kecepatan bukan ukuran kepedulian. Kadang cara paling bertanggung jawab untuk peduli adalah memeriksa dahulu.</blockquote>" +
      "<p>Literasi digital bukan kemampuan menghafal aplikasi terbaru, melainkan kebiasaan bertanya: siapa yang diuntungkan jika saya membagikan ini? Jika jawabannya tidak jelas, menahan jempol adalah pilihan yang bijak.</p>",
  },
};

/* ---------- 7. Modal artikel ---------- */
const articleModal = $("#articleModal");
const articleContent = $("#articleModalContent");

function openArticle(slug) {
  const post = POSTS[slug];
  if (!post || !articleModal || !articleContent) return;

  const tags = post.tags.map((tag) => '<span class="tag">' + escapeHtml(tag) + "</span>").join("");

  articleContent.innerHTML =
    '<div class="article-hero">' +
    '<img src="' + post.image + '" alt="' + escapeHtml(post.imageAlt) + '" />' +
    '<div class="article-hero-meta">' +
    '<span class="article-cat">' + escapeHtml(post.category) + "</span>" +
    "<h2 id=\"articleModalTitle\">" + escapeHtml(post.title) + "</h2>" +
    "</div></div>" +
    '<div class="article-body">' +
    '<div class="article-info">' +
    "<span>Kategori: " + escapeHtml(post.category) + "</span>" +
    "<span>" + formatDate(post.date) + "</span>" +
    "<span>" + escapeHtml(post.read) + "</span>" +
    "</div>" +
    post.body +
    '<div class="article-tags" aria-label="Tag artikel">' + tags + "</div>" +
    '<p class="article-source">Sumber gambar: <a href="' + post.sourceUrl + '" target="_blank" rel="noopener noreferrer">' +
    escapeHtml(post.sourceLabel) + "</a> — lisensi bebas royalti.</p>" +
    "</div>";

  articleModal.classList.add("is-open");
  articleModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  const closeBtn = $(".modal-close", articleModal);
  if (closeBtn) closeBtn.focus();
}

function closeArticle() {
  if (!articleModal) return;
  articleModal.classList.remove("is-open");
  articleModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

if (articleModal) {
  $$("[data-close-modal]", articleModal).forEach((el) => el.addEventListener("click", closeArticle));
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeArticle();
});

$$("[data-open-post]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const slug = link.dataset.openPost;
    if (location.hash === "#artikel/" + slug) {
      event.preventDefault();
      openArticle(slug);
    }
  });
});

/* ---------- 8. Router halaman ---------- */
const PAGE_TITLES = {
  beranda: "EtikaSosial — Etika Bermedia Sosial yang Baik dan Benar",
  tentang: "Tentang Saya — EtikaSosial",
  kontak: "Kontak — EtikaSosial",
  masuk: "Masuk atau Daftar — EtikaSosial",
  dashboard: "Dasbor User — EtikaSosial",
  admin: "Panel Admin (CS) — EtikaSosial",
};

const SECTION_ANCHORS = ["layanan", "artikel"];
let pendingAuthTab = "login";
let isInitialRoute = true;

function showPage(name) {
  const session = getSession();

  if (!session) {
    /* Gerbang login: tamu hanya boleh berada di halaman Masuk/Daftar. */
    if (name !== "masuk") {
      if (!isInitialRoute) {
        toast("info", "Masuk diperlukan", "Silakan masuk atau buat akun terlebih dahulu untuk mengakses EtikaSosial.");
      }
      name = "masuk";
      history.replaceState(null, "", "#masuk");
    }
  } else {
    if (name === "masuk") {
      name = session.role === "admin" ? "admin" : "beranda";
      history.replaceState(null, "", "#" + name);
    }
    if (name === "admin" && session.role !== "admin") {
      toast("error", "Akses ditolak", "Halaman ini hanya untuk admin (customer service).");
      name = "dashboard";
      history.replaceState(null, "", "#dashboard");
    }
  }

  $$(".page").forEach((page) => page.classList.toggle("is-active", page.id === "page-" + name));
  $$(".nav-link").forEach((link) => link.classList.toggle("is-active", link.dataset.nav === name));

  document.title = PAGE_TITLES[name] || PAGE_TITLES.beranda;
  window.scrollTo({ top: 0, behavior: "auto" });

  if (name === "masuk") {
    switchAuthTab(pendingAuthTab);
    pendingAuthTab = "login";
  }
  if (name === "dashboard") renderUserDashboard();
  if (name === "admin") renderAdminDashboard();
  if (name === "beranda") window.setTimeout(runCounters, 450);

  observeReveals();
  isInitialRoute = false;
}

function router() {
  const route = (location.hash || "#beranda").replace(/^#/, "") || "beranda";

  if (route.indexOf("artikel/") === 0) {
    if (!getSession()) {
      showPage("masuk");
      return;
    }
    showPage("beranda");
    openArticle(route.split("/")[1]);
    return;
  }

  if (SECTION_ANCHORS.indexOf(route) !== -1) {
    if (!getSession()) {
      showPage("masuk");
      return;
    }
    showPage("beranda");
    const target = document.getElementById(route);
    if (target) {
      window.setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    }
    return;
  }

  closeArticle();
  showPage(route);
}

window.addEventListener("hashchange", router);

$$("[data-scroll]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (!getSession()) {
      showPage("masuk");
      return;
    }
    const id = link.getAttribute("href").replace("#", "");
    showPage("beranda");
    history.replaceState(null, "", "#" + id);
    const target = document.getElementById(id);
    if (target) {
      window.setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  });
});

/* ---------- 9. Animasi reveal & counter ---------- */
let revealObserver = null;

if ("IntersectionObserver" in window) {
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
}

function observeReveals() {
  const items = $$(".reveal:not(.is-visible)");
  if (!revealObserver) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  items.forEach((item) => revealObserver.observe(item));
}

function animateCounter(el) {
  const target = Number(el.dataset.count || 0);
  const duration = 1300;
  const start = performance.now();

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = String(Math.round(target * eased));
    if (progress < 1) window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
}

let countersStarted = false;

function runCounters() {
  if (countersStarted) return;
  countersStarted = true;
  $$(".counter").forEach(animateCounter);
}

/* ---------- 10. Simulasi customer service ---------- */
const chatBody = $("#chatBody");
const chatForm = $("#chatForm");
const chatInput = $("#chatInput");
const chatSuggest = $("#chatSuggest");
const chatReset = $("#chatReset");
const openTicketBtn = $("#openTicketBtn");

const CS_RULES = [
  {
    id: "hoaks",
    keys: ["hoaks", "hoax", "bohong", "fitnah", "berita palsu", "palsu", "fake"],
    title: "Hoaks dan informasi palsu",
    intro:
      "Terima kasih sudah bertanya. Hoaks paling efektif dihentikan oleh orang yang menolak membagikannya. Berikut langkah yang bisa kamu lakukan:",
    steps: [
      "Jangan bagikan ulang kontennya, termasuk ke grup keluarga. Cukup simpan tangkapan layar sebagai bukti.",
      "Periksa sumber aslinya: nama media, tanggal, dan apakah ada media kredibel lain yang memberitakan hal sama.",
      "Gunakan pencarian terbalik (reverse image search) untuk memastikan foto bukan hasil suntingan atau kejadian lama.",
      "Laporkan unggahan melalui menu lapor platform dengan alasan informasi palsu atau menyesatkan.",
      "Jika sudah terlanjur menyebar, kirim koreksi dengan sopan disertai tautan klarifikasi.",
    ],
    note: "Jika hoaks memuat ancaman atau fitnah yang merugikan nama baik, pertimbangkan konsultasi hukum dan simpan semua bukti.",
  },
  {
    id: "bullying",
    keys: ["bully", "bullying", "rundung", "hina", "ejek", "cela", "body shaming", "cacian", "kasar"],
    title: "Perundungan dan komentar kasar",
    intro:
      "Saya turut prihatin atas apa yang kamu alami. Perundungan siber tidak boleh dianggap hal sepele. Langkah awal yang bisa dilakukan:",
    steps: [
      "Berhenti membalas. Tanggapan emosional biasanya justru memberi bahan bakar bagi pelaku.",
      "Simpan bukti berupa tangkapan layar lengkap: nama akun, tanggal, dan isi pesan.",
      "Blokir dan laporkan akun tersebut melalui fitur platform. Lakukan untuk setiap akun yang terlibat.",
      "Ceritakan kepada orang yang kamu percaya, seperti keluarga, guru, atau teman dekat.",
      "Batasi waktu membuka aplikasi untuk sementara dan alihkan perhatian ke aktivitas yang menenangkan.",
    ],
    note: "Jika terjadi ancaman kekerasan, penyebaran foto pribadi, atau pemerasan, segera hubungi pihak berwenang atau layanan bantuan.",
  },
  {
    id: "privasi",
    keys: ["privasi", "data pribadi", "doxx", "alamat", "nomor", "ktp", "foto pribadi", "sebar foto", "tanpa izin"],
    title: "Penyalahgunaan data pribadi",
    intro:
      "Data pribadi yang tersebar bisa berdampak jangka panjang. Mari amankan langkahnya satu per satu:",
    steps: [
      "Catat dan simpan bukti penyebaran: tautan, tangkapan layar, serta nama akun penyebar.",
      "Ajukan permintaan penghapusan kepada platform melalui menu lapor dengan alasan privasi.",
      "Ubah kata sandi dan aktifkan verifikasi dua langkah pada semua akun penting.",
      "Periksa pengaturan privasi: siapa yang bisa melihat nomor telepon, surel, dan daftar teman.",
      "Jika menyangkut dokumen identitas atau foto intim, laporkan ke layanan pengaduan resmi dan pertimbangkan bantuan hukum.",
    ],
    note: "Jangan mengirim uang atau data tambahan kepada pihak yang mengancam. Simpan bukti dan minta pendampingan.",
  },
  {
    id: "ujaran",
    keys: ["ujaran kebencian", "rasis", "agama", "suku", "hate speech", "provokasi", "sara"],
    title: "Ujaran kebencian",
    intro:
      "Ujaran kebencian menyerang identitas, bukan gagasan. Berikut cara menanganinya dengan aman:",
    steps: [
      "Jangan membalas dengan ujaran serupa, karena dapat membuatmu ikut melanggar aturan platform.",
      "Simpan bukti dan laporkan melalui fitur pelaporan dengan kategori ujaran kebencian.",
      "Jika terjadi di grup, laporkan ke admin grup disertai bukti, bukan dengan perdebatan terbuka.",
      "Hindari menyebarkan ulang tangkapan layarnya tanpa menyensor nama dan foto korban.",
      "Dukung pihak yang menjadi sasaran dengan pesan pribadi yang menenangkan.",
    ],
    note: "Konten yang memicu kekerasan atau ancaman nyata sebaiknya dilaporkan ke pihak berwenang, bukan diselesaikan sendiri.",
  },
  {
    id: "hakcipta",
    keys: ["hak cipta", "copyright", "plagiat", "repost", "karya", "copas", "klaim"],
    title: "Hak cipta dan pencurian konten",
    intro:
      "Karya digital tetap dilindungi hak cipta meskipun mudah diunduh. Ini langkah yang bisa kamu ambil:",
    steps: [
      "Pastikan kamu memegang bukti kepemilikan: file asli, tanggal unggah, atau arsip karya.",
      "Hubungi pengunggah secara sopan untuk meminta kredit atau penghapusan.",
      "Jika tidak diindahkan, gunakan fitur laporan pelanggaran hak cipta milik platform.",
      "Untuk karya bernilai komersial, pertimbangkan surat peringatan tertulis melalui bantuan hukum.",
      "Mulai sekarang, cantumkan lisensi dan tanda air pada karya yang kamu bagikan.",
    ],
    note: "Mengutip sebagian karya untuk kritik atau pendidikan umumnya diperbolehkan, tetapi tetap wajib menyebut sumbernya.",
  },
  {
    id: "spam",
    keys: ["spam", "judi", "iklan", "penipuan", "phishing", "tautan", "link", "hadiah", "transfer"],
    title: "Spam, penipuan, dan phishing",
    intro:
      "Tautan mencurigakan sering menyamar sebagai hadiah atau undangan. Jangan panik, lakukan ini:",
    steps: [
      "Jangan mengklik tautan, mengisi formulir, atau mengirim kode OTP kepada siapa pun.",
      "Periksa alamat pengirim dengan teliti; penipu sering memakai nama yang mirip.",
      "Blokir dan laporkan akun pengirim sebagai spam atau penipuan.",
      "Jika sudah terlanjur mengisi data, segera ganti kata sandi dan hubungi layanan resmi terkait.",
      "Ingat: institusi resmi tidak pernah meminta kata sandi atau kode OTP melalui pesan pribadi.",
    ],
    note: "Semakin besar iming-iming hadiah, semakin besar kemungkinan itu penipuan. Verifikasi melalui kanal resmi.",
  },
  {
    id: "akun",
    keys: ["diretas", "hack", "akun hilang", "dibajak", "login", "tidak bisa masuk", "email berubah"],
    title: "Akun dibajak atau diretas",
    intro:
      "Akun yang diambil alih bisa dipakai untuk menipu kontakmu. Bertindak cepat sangat membantu:",
    steps: [
      "Gunakan fitur pemulihan akun resmi dari platform, bukan jasa pemulihan tidak dikenal.",
      "Jika surel pemulihan sudah diubah, segera hubungi dukungan platform dan lampirkan bukti kepemilikan.",
      "Beri tahu teman dan keluarga bahwa akunmu sedang bermasalah agar mereka tidak tertipu.",
      "Setelah pulih, aktifkan verifikasi dua langkah dan keluarkan semua sesi perangkat yang tidak dikenal.",
      "Periksa apakah ada unggahan atau pesan yang dikirim selama akun diambil alih, lalu hapus.",
    ],
    note: "Hindari membayar pihak yang menjanjikan pemulihan instan. Banyak di antaranya adalah penipuan lanjutan.",
  },
  {
    id: "etika",
    keys: ["etika", "sopan", "aturan", "adab", "bermedia sosial", "baik dan benar"],
    title: "Prinsip dasar etika bermedia sosial",
    intro:
      "Etika digital dapat diringkas menjadi beberapa prinsip yang mudah diingat:",
    steps: [
      "Berpikir sebelum mengunggah: apakah ini benar, perlu, dan tidak merugikan orang lain?",
      "Perlakukan orang di layar seperti orang di hadapanmu. Tidak ada perundungan yang tidak berdampak.",
      "Hormati privasi: jangan membagikan foto, nomor, atau percakapan pribadi tanpa izin.",
      "Verifikasi sebelum membagikan, terutama informasi yang memancing emosi.",
      "Akui kesalahan dan minta maaf secara terbuka bila kamu melukai orang lain.",
    ],
    note: "Etika bukan daftar larangan, melainkan kebiasaan mempertimbangkan dampak sebelum bertindak.",
  },
];

const CHAT_CHIPS = [
  "Saya dapat komentar kasar",
  "Cara cek berita hoaks",
  "Foto saya disebar tanpa izin",
  "Akun saya tiba-tiba diretas",
];

function chatMessageHtml(role, html) {
  const meta = role === "user" ? "Kamu" : "Bot · CS";
  return html + '<span class="msg-meta">' + meta + " · " + nowTime() + "</span>";
}

function addChatMessage(role, html, animate = true) {
  if (!chatBody) return null;
  const el = document.createElement("div");
  el.className = "msg msg--" + role;
  if (!animate) el.style.animation = "none";
  el.innerHTML = chatMessageHtml(role, html);
  chatBody.appendChild(el);
  chatBody.scrollTop = chatBody.scrollHeight;
  return el;
}

function seedChat() {
  if (!chatBody) return;
  chatBody.innerHTML = "";
  const session = getSession();
  const name = session && session.role === "user" ? session.name.split(" ")[0] : "teman";
  addChatMessage(
    "bot",
    "<p>Halo, " +
      escapeHtml(name) +
      "! Saya <strong>Bot</strong>, asisten layanan pelanggan EtikaSosial. Ceritakan keluhan atau pertanyaanmu soal etika bermedia sosial, nanti saya bantu carikan langkah penyelesaiannya.</p>",
    false
  );
  addChatMessage(
    "bot",
    '<p class="msg-note">Contoh: &ldquo;Saya menerima komentar kasar di Instagram&rdquo; atau &ldquo;Bagaimana cara memastikan berita itu hoaks?&rdquo;</p>',
    false
  );
}

function buildRuleReply(rule) {
  const steps = rule.steps.map((step) => "<li>" + step + "</li>").join("");
  return (
    '<span class="msg-title">' +
    rule.title +
    "</span><p>" +
    rule.intro +
    '</p><ul class="msg-list">' +
    steps +
    '</ul><p class="msg-note">' +
    rule.note +
    "</p>"
  );
}

function findRule(text) {
  const value = text.toLowerCase();
  return CS_RULES.find((rule) => rule.keys.some((key) => value.indexOf(key) !== -1)) || null;
}

function typingIndicator() {
  if (!chatBody) return null;
  const el = document.createElement("div");
  el.className = "msg msg--bot";
  el.innerHTML = '<span class="typing" aria-label="Bot sedang menulis"><span></span><span></span><span></span></span>';
  chatBody.appendChild(el);
  chatBody.scrollTop = chatBody.scrollHeight;
  return el;
}

function respondTo(text) {
  const rule = findRule(text);
  const typing = typingIndicator();

  window.setTimeout(
    () => {
      if (typing) typing.remove();

      if (rule) {
        addChatMessage("bot", buildRuleReply(rule));
        return;
      }

      if (/(halo|hai|hi|pagi|siang|malam|sore|assalam)/i.test(text)) {
        addChatMessage(
          "bot",
          "<p>Halo juga! Saya siap membantu. Kamu bisa menceritakan masalah yang kamu alami di media sosial, misalnya komentar kasar, hoaks, atau penyebaran data pribadi.</p>"
        );
        return;
      }

      addChatMessage(
        "bot",
        '<span class="msg-title">Saya butuh sedikit detail</span><p>Agar saran saya lebih tepat, boleh dijelaskan: apa yang terjadi, di platform mana, dan apakah kamu menyimpan bukti seperti tangkapan layar?</p><ul class="msg-list"><li>Untuk masalah komentar atau perundungan, sebutkan bentuk komentarnya.</li><li>Untuk hoaks, sebutkan judul atau isi pesan yang kamu terima.</li><li>Untuk privasi, sebutkan data apa yang tersebar.</li></ul><p class="msg-note">Jika ingin ditangani lebih lanjut, kamu bisa membuat tiket pengaduan melalui dasbor.</p>'
      );
    },
    900 + Math.random() * 600
  );
}

if (chatForm) {
  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = (chatInput.value || "").trim();
    if (!text) return;
    addChatMessage("user", "<p>" + escapeHtml(text) + "</p>");
    chatInput.value = "";
    respondTo(text);
  });
}

if (chatSuggest) {
  CHAT_CHIPS.forEach((chip) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggest-chip";
    button.textContent = chip;
    button.addEventListener("click", () => {
      addChatMessage("user", "<p>" + escapeHtml(chip) + "</p>");
      respondTo(chip);
    });
    chatSuggest.appendChild(button);
  });
}

if (chatReset) {
  chatReset.addEventListener("click", () => {
    seedChat();
    toast("info", "Percakapan direset", "Kamu bisa memulai konsultasi baru.");
  });
}

seedChat();

if (openTicketBtn) {
  openTicketBtn.addEventListener("click", () => {
    const session = getSession();
    if (!session) {
      toast("info", "Masuk dahulu", "Buat akun gratis untuk mengirim tiket pengaduan.");
      location.hash = "#masuk";
      return;
    }
    if (session.role === "admin") {
      toast("info", "Kamu admin", "Gunakan panel admin untuk menjawab pengaduan.");
      location.hash = "#admin";
      return;
    }
    location.hash = "#dashboard";
    window.setTimeout(() => {
      const field = $("#ticketSubject");
      if (field) field.focus();
    }, 320);
  });
}

/* ---------- 11. Autentikasi ---------- */
const ADMIN_ACCOUNT = {
  id: "admin-1",
  name: "Fadil",
  email: "admin",
  altEmail: "admin@etikasosial.id",
  password: "admin123",
  role: "admin",
};

const authArea = $("#authArea");

function getUsers() {
  return store.get(STORAGE.users, []);
}

function saveUsers(users) {
  store.set(STORAGE.users, users);
}

function getSession() {
  return store.get(STORAGE.session, null);
}

function setSession(session) {
  if (session) store.set(STORAGE.session, session);
  else store.remove(STORAGE.session);
}

function renderAuthArea() {
  if (!authArea) return;
  const session = getSession();

  document.body.classList.toggle("is-guest", !session);
  document.body.dataset.role = session ? session.role : "";

  if (!session) {
    authArea.innerHTML =
      '<a class="btn btn-ghost" href="#masuk">Masuk</a>' +
      '<a class="btn btn-primary" href="#masuk" data-auth-cta="register">Daftar</a>';
  } else {
    const roleLabel = session.role === "admin" ? "Admin / CS" : "User";
    authArea.innerHTML =
      '<div class="user-chip" title="Akun ' + escapeHtml(session.name) + '">' +
      '<span class="user-avatar">' + escapeHtml(initials(session.name)) + "</span>" +
      '<span class="user-chip-text"><span class="user-chip-name">' + escapeHtml(session.name) + "</span>" +
      '<span class="user-chip-role">' + roleLabel + "</span></span></div>" +
      '<button class="icon-btn logout-btn" type="button" id="logoutBtn" aria-label="Keluar dari akun" title="Keluar">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 17l5-5-5-5M20 12H9M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6"/></svg>' +
      "</button>";
  }

  const logoutBtn = $("#logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      setSession(null);
      renderAuthArea();
      toast("success", "Berhasil keluar", "Sesi kamu sudah diakhiri.");
      location.hash = "#masuk";
    });
  }

}

/* Delegasi tunggal: tautan "Masuk"/"Daftar" di mana pun, termasuk saat sudah di halaman masuk. */
document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href="#masuk"]');
  if (!link) return;
  pendingAuthTab = link.dataset.authCta === "register" ? "register" : "login";
  const page = document.getElementById("page-masuk");
  if (page && page.classList.contains("is-active")) {
    switchAuthTab(pendingAuthTab);
  }
});

const loginForm = $("#loginForm");
const registerForm = $("#registerForm");
const tabLogin = $("#tabLogin");
const tabRegister = $("#tabRegister");

function switchAuthTab(tab) {
  const isLogin = tab !== "register";
  if (tabLogin) {
    tabLogin.classList.toggle("is-active", isLogin);
    tabLogin.setAttribute("aria-selected", String(isLogin));
  }
  if (tabRegister) {
    tabRegister.classList.toggle("is-active", !isLogin);
    tabRegister.setAttribute("aria-selected", String(!isLogin));
  }
  if (loginForm) loginForm.classList.toggle("is-active", isLogin);
  if (registerForm) registerForm.classList.toggle("is-active", !isLogin);
}

if (tabLogin) tabLogin.addEventListener("click", () => switchAuthTab("login"));
if (tabRegister) tabRegister.addEventListener("click", () => switchAuthTab("register"));

$$("[data-auth-switch]").forEach((button) => {
  button.addEventListener("click", () => switchAuthTab(button.dataset.authSwitch));
});

$$("[data-toggle-password]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.togglePassword);
    if (!input) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.textContent = show ? "Sembunyi" : "Lihat";
    button.setAttribute("aria-label", show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
  });
});

function setFieldError(id, message) {
  const input = document.getElementById(id);
  const holder = document.querySelector('[data-error-for="' + id + '"]');
  if (holder) holder.textContent = message || "";
  if (input) {
    const field = input.closest(".field");
    if (field) field.classList.toggle("has-error", Boolean(message));
  }
}

function clearErrors(ids) {
  ids.forEach((id) => setFieldError(id, ""));
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors(["loginEmail", "loginPassword"]);

    const identifier = ($("#loginEmail").value || "").trim();
    const password = $("#loginPassword").value || "";
    let valid = true;

    if (!identifier) {
      setFieldError("loginEmail", "Surel atau nama pengguna wajib diisi.");
      valid = false;
    }
    if (password.length < 6) {
      setFieldError("loginPassword", "Kata sandi minimal 6 karakter.");
      valid = false;
    }
    if (!valid) return;

    const lower = identifier.toLowerCase();
    const isAdmin =
      (lower === ADMIN_ACCOUNT.email || lower === ADMIN_ACCOUNT.altEmail) &&
      password === ADMIN_ACCOUNT.password;

    if (isAdmin) {
      setSession({ id: ADMIN_ACCOUNT.id, name: ADMIN_ACCOUNT.name, email: ADMIN_ACCOUNT.email, role: "admin" });
      renderAuthArea();
      loginForm.reset();
      toast("success", "Selamat datang, Admin", "Panel customer service sudah terbuka.");
      location.hash = "#admin";
      return;
    }

    const user = getUsers().find(
      (item) => item.email.toLowerCase() === lower && item.password === password
    );

    if (!user) {
      setFieldError("loginEmail", "Akun tidak ditemukan atau kata sandi salah.");
      setFieldError("loginPassword", "Periksa kembali data masukmu.");
      toast("error", "Gagal masuk", "Pastikan surel dan kata sandi sudah benar.");
      return;
    }

    setSession({ id: user.id, name: user.name, email: user.email, role: "user" });
    renderAuthArea();
    loginForm.reset();
    toast("success", "Berhasil masuk", "Halo, " + user.name.split(" ")[0] + "!");
    location.hash = "#beranda";
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const ids = ["registerName", "registerEmail", "registerPassword", "registerConfirm", "registerConsent"];
    clearErrors(ids);

    const name = ($("#registerName").value || "").trim();
    const email = ($("#registerEmail").value || "").trim().toLowerCase();
    const password = $("#registerPassword").value || "";
    const confirm = $("#registerConfirm").value || "";
    const consent = $("#registerConsent").checked;
    let valid = true;

    if (name.length < 2) {
      setFieldError("registerName", "Nama minimal 2 karakter.");
      valid = false;
    }
    if (!emailPattern.test(email)) {
      setFieldError("registerEmail", "Format surel belum benar.");
      valid = false;
    }
    if (password.length < 6) {
      setFieldError("registerPassword", "Kata sandi minimal 6 karakter.");
      valid = false;
    }
    if (confirm !== password) {
      setFieldError("registerConfirm", "Ulangi kata sandi dengan tepat.");
      valid = false;
    }
    if (!consent) {
      setFieldError("registerConsent", "Kamu perlu menyetujui aturan komunitas.");
      valid = false;
    }

    const users = getUsers();
    if (email === ADMIN_ACCOUNT.email || email === ADMIN_ACCOUNT.altEmail) {
      setFieldError("registerEmail", "Surel ini sudah dipakai.");
      valid = false;
    }
    if (users.some((item) => item.email.toLowerCase() === email)) {
      setFieldError("registerEmail", "Surel ini sudah terdaftar. Silakan masuk.");
      valid = false;
    }
    if (!valid) return;

    const user = {
      id: uid("usr-"),
      name: name,
      email: email,
      password: password,
      role: "user",
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    saveUsers(users);
    setSession({ id: user.id, name: user.name, email: user.email, role: "user" });
    renderAuthArea();
    registerForm.reset();
    toast("success", "Akun berhasil dibuat", "Selamat bergabung, " + name.split(" ")[0] + "!");
    location.hash = "#beranda";
  });
}

/* ---------- 12. Tiket pengaduan ---------- */
const ticketForm = $("#ticketForm");
const userTicketList = $("#userTicketList");
const userTicketCount = $("#userTicketCount");
const adminTicketList = $("#adminTicketList");
const adminStats = $("#adminStats");
const userStats = $("#userStats");
const adminFilter = $("#adminFilter");

let adminFilterValue = "all";

function getTickets() {
  return store.get(STORAGE.tickets, []);
}

function saveTickets(tickets) {
  store.set(STORAGE.tickets, tickets);
}

const STATUS_LABEL = {
  open: "Terbuka",
  answered: "Dijawab",
  closed: "Selesai",
};

function statusPill(status) {
  return '<span class="status-pill status-pill--' + status + '">' + (STATUS_LABEL[status] || status) + "</span>";
}

function countTickets(tickets) {
  return {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    answered: tickets.filter((t) => t.status === "answered").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  };
}

function renderStats(container, counts) {
  if (!container) return;
  container.innerHTML =
    '<div class="stat-card"><span class="stat-label">Total tiket</span><span class="stat-value">' + counts.total + "</span></div>" +
    '<div class="stat-card stat-card--gold"><span class="stat-label">Terbuka</span><span class="stat-value">' + counts.open + "</span></div>" +
    '<div class="stat-card stat-card--mint"><span class="stat-label">Dijawab</span><span class="stat-value">' + counts.answered + "</span></div>" +
    '<div class="stat-card"><span class="stat-label">Selesai</span><span class="stat-value">' + counts.closed + "</span></div>";
}

function repliesHtml(ticket) {
  if (!ticket.replies || !ticket.replies.length) return "";
  const items = ticket.replies
    .map(
      (reply) =>
        '<div class="reply"><span class="reply-head">' +
        escapeHtml(reply.by) +
        " · " +
        formatDateTime(reply.at) +
        "</span><p>" +
        escapeHtml(reply.text) +
        "</p></div>"
    )
    .join("");
  return '<div class="ticket-replies">' + items + "</div>";
}

function userTicketCard(ticket) {
  const closeButton =
    ticket.status !== "closed"
      ? '<button class="btn btn-ghost btn-sm" type="button" data-action="close" data-id="' +
        ticket.id +
        '">Tandai selesai</button>'
      : "";

  return (
    '<article class="ticket-item">' +
    '<div class="ticket-top"><div><span class="ticket-id">' +
    escapeHtml(ticket.id) +
    '</span><h3 class="ticket-title">' +
    escapeHtml(ticket.subject) +
    "</h3></div>" +
    statusPill(ticket.status) +
    "</div>" +
    '<div class="ticket-meta"><span class="ticket-cat">' +
    escapeHtml(ticket.category) +
    "</span><span>" +
    formatDateTime(ticket.createdAt) +
    "</span></div>" +
    '<p class="ticket-message">' +
    escapeHtml(ticket.message) +
    "</p>" +
    repliesHtml(ticket) +
    '<div class="ticket-actions">' +
    closeButton +
    "</div></article>"
  );
}

function adminTicketCard(ticket) {
  const replyForm =
    '<form class="reply-form" data-ticket-id="' +
    ticket.id +
    '">' +
    '<textarea name="reply" placeholder="Tulis balasan resmi untuk ' +
    escapeHtml(ticket.userName) +
    '..." required minlength="10"></textarea>' +
    '<div class="ticket-actions">' +
    '<button class="btn btn-primary btn-sm" type="submit">Kirim balasan</button>' +
    '<button class="btn btn-ghost btn-sm" type="button" data-action="toggle-reply" data-id="' +
    ticket.id +
    '">Batal</button>' +
    "</div></form>";

  const statusButton =
    ticket.status === "closed"
      ? '<button class="btn btn-ghost btn-sm" type="button" data-action="reopen" data-id="' +
        ticket.id +
        '">Buka kembali</button>'
      : '<button class="btn btn-ghost btn-sm" type="button" data-action="close" data-id="' +
        ticket.id +
        '">Tandai selesai</button>';

  return (
    '<article class="ticket-item">' +
    '<div class="ticket-top"><div><span class="ticket-id">' +
    escapeHtml(ticket.id) +
    " · " +
    escapeHtml(ticket.userName) +
    '</span><h3 class="ticket-title">' +
    escapeHtml(ticket.subject) +
    "</h3></div>" +
    statusPill(ticket.status) +
    "</div>" +
    '<div class="ticket-meta"><span class="ticket-cat">' +
    escapeHtml(ticket.category) +
    "</span><span>" +
    escapeHtml(ticket.userEmail) +
    "</span><span>" +
    formatDateTime(ticket.createdAt) +
    "</span></div>" +
    '<p class="ticket-message">' +
    escapeHtml(ticket.message) +
    "</p>" +
    repliesHtml(ticket) +
    '<div class="ticket-actions">' +
    '<button class="btn btn-primary btn-sm" type="button" data-action="toggle-reply" data-id="' +
    ticket.id +
    '">Balas</button>' +
    statusButton +
    "</div>" +
    replyForm +
    "</article>"
  );
}

function renderUserDashboard() {
  const session = getSession();
  if (!session) return;

  const greeting = $("#dashUserName");
  if (greeting) greeting.textContent = session.name.split(" ")[0];

  const tickets = getTickets()
    .filter((ticket) => ticket.userId === session.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  renderStats(userStats, countTickets(tickets));

  if (userTicketCount) {
    userTicketCount.textContent = tickets.length + " tiket";
  }

  if (!userTicketList) return;

  if (!tickets.length) {
    userTicketList.innerHTML =
      '<div class="ticket-empty"><strong>Belum ada tiket.</strong>Kirim pengaduan pertamamu melalui formulir di atas. Admin akan membalas di daftar ini.</div>';
    return;
  }

  userTicketList.innerHTML = tickets.map(userTicketCard).join("");
}

function renderAdminDashboard() {
  const session = getSession();
  if (!session || session.role !== "admin") return;

  const tickets = getTickets().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  renderStats(adminStats, countTickets(tickets));

  if (!adminTicketList) return;

  const filtered =
    adminFilterValue === "all" ? tickets : tickets.filter((ticket) => ticket.status === adminFilterValue);

  if (!filtered.length) {
    adminTicketList.innerHTML =
      '<div class="ticket-empty"><strong>Tidak ada tiket pada filter ini.</strong>Pilih filter lain atau tunggu pengaduan baru masuk.</div>';
    return;
  }

  adminTicketList.innerHTML = filtered.map(adminTicketCard).join("");
}

if (ticketForm) {
  ticketForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const session = getSession();
    if (!session || session.role !== "user") {
      toast("error", "Akses ditolak", "Masuk sebagai user untuk mengirim pengaduan.");
      return;
    }

    const ids = ["ticketCategory", "ticketSubject", "ticketMessage"];
    clearErrors(ids);

    const category = $("#ticketCategory").value;
    const subject = ($("#ticketSubject").value || "").trim();
    const message = ($("#ticketMessage").value || "").trim();
    let valid = true;

    if (!category) {
      setFieldError("ticketCategory", "Pilih salah satu kategori.");
      valid = false;
    }
    if (subject.length < 5) {
      setFieldError("ticketSubject", "Subjek minimal 5 karakter.");
      valid = false;
    }
    if (message.length < 30) {
      setFieldError("ticketMessage", "Ceritakan kronologi minimal 30 karakter.");
      valid = false;
    }
    if (!valid) return;

    const tickets = getTickets();
    const ticket = {
      id: "TKT-" + uid().slice(-6).toUpperCase(),
      userId: session.id,
      userName: session.name,
      userEmail: session.email,
      category: category,
      subject: subject,
      message: message,
      status: "open",
      createdAt: new Date().toISOString(),
      replies: [],
    };

    tickets.push(ticket);
    saveTickets(tickets);
    ticketForm.reset();
    const counter = $("#ticketCount");
    if (counter) counter.textContent = "0";
    renderUserDashboard();
    toast("success", "Pengaduan terkirim", "Nomor tiket " + ticket.id + ". Pantau balasan admin di daftar tiket.");
  });
}

if (userTicketList) {
  userTicketList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='close']");
    if (!button) return;
    const id = button.dataset.id;
    const tickets = getTickets();
    const ticket = tickets.find((item) => item.id === id);
    if (!ticket) return;
    ticket.status = "closed";
    saveTickets(tickets);
    renderUserDashboard();
    toast("success", "Tiket ditutup", "Tiket " + id + " ditandai selesai.");
  });
}

if (adminTicketList) {
  adminTicketList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;
    const tickets = getTickets();
    const ticket = tickets.find((item) => item.id === id);
    if (!ticket) return;

    if (action === "toggle-reply") {
      const form = adminTicketList.querySelector('[data-ticket-id="' + id + '"]');
      if (form) {
        form.classList.toggle("is-open");
        if (form.classList.contains("is-open")) {
          const textarea = form.querySelector("textarea");
          if (textarea) textarea.focus();
        }
      }
      return;
    }

    if (action === "close") {
      ticket.status = "closed";
      saveTickets(tickets);
      renderAdminDashboard();
      toast("success", "Tiket diselesaikan", id + " telah ditutup.");
      return;
    }

    if (action === "reopen") {
      ticket.status = "open";
      saveTickets(tickets);
      renderAdminDashboard();
      toast("info", "Tiket dibuka kembali", id + " kembali berstatus terbuka.");
    }
  });

  adminTicketList.addEventListener("submit", (event) => {
    const form = event.target.closest(".reply-form");
    if (!form) return;
    event.preventDefault();

    const session = getSession();
    if (!session || session.role !== "admin") {
      toast("error", "Akses ditolak", "Hanya admin yang dapat membalas pengaduan.");
      return;
    }

    const id = form.dataset.ticketId;
    const textarea = form.querySelector("textarea");
    const text = (textarea.value || "").trim();

    if (text.length < 10) {
      toast("error", "Balasan terlalu singkat", "Tulis minimal 10 karakter agar jelas.");
      return;
    }

    const tickets = getTickets();
    const ticket = tickets.find((item) => item.id === id);
    if (!ticket) return;

    ticket.replies = ticket.replies || [];
    ticket.replies.push({
      by: session.name,
      role: "admin",
      text: text,
      at: new Date().toISOString(),
    });
    if (ticket.status !== "closed") ticket.status = "answered";

    saveTickets(tickets);
    renderAdminDashboard();
    toast("success", "Balasan terkirim", "User akan melihat balasan pada tiket " + id + ".");
  });
}

if (adminFilter) {
  adminFilter.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    adminFilterValue = button.dataset.filter;
    $$("[data-filter]", adminFilter).forEach((item) =>
      item.classList.toggle("is-active", item === button)
    );
    renderAdminDashboard();
  });
}

/* ---------- 13. Formulir kontak ---------- */
const contactForm = $("#contactForm");
const contactMessage = $("#contactMessage");
const contactCount = $("#contactCount");

if (contactMessage && contactCount) {
  contactMessage.addEventListener("input", () => {
    contactCount.textContent = String(contactMessage.value.length);
  });
}

if (ticketForm) {
  const ticketMessage = $("#ticketMessage");
  const ticketCount = $("#ticketCount");
  if (ticketMessage && ticketCount) {
    ticketMessage.addEventListener("input", () => {
      ticketCount.textContent = String(ticketMessage.value.length);
    });
  }
}

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const ids = ["contactName", "contactEmail", "contactSubject", "contactMessage", "contactConsent"];
    clearErrors(ids);

    const name = ($("#contactName").value || "").trim();
    const email = ($("#contactEmail").value || "").trim().toLowerCase();
    const subject = ($("#contactSubject").value || "").trim();
    const message = ($("#contactMessage").value || "").trim();
    const consent = $("#contactConsent").checked;
    let valid = true;

    if (name.length < 2) {
      setFieldError("contactName", "Nama minimal 2 karakter.");
      valid = false;
    }
    if (!emailPattern.test(email)) {
      setFieldError("contactEmail", "Format surel belum benar.");
      valid = false;
    }
    if (subject.length < 3) {
      setFieldError("contactSubject", "Subjek minimal 3 karakter.");
      valid = false;
    }
    if (message.length < 20) {
      setFieldError("contactMessage", "Pesan minimal 20 karakter.");
      valid = false;
    }
    if (!consent) {
      setFieldError("contactConsent", "Centang persetujuan sebelum mengirim.");
      valid = false;
    }
    if (!valid) return;

    const messages = store.get(STORAGE.contact, []);
    messages.push({
      id: uid("msg-"),
      name: name,
      email: email,
      subject: subject,
      message: message,
      at: new Date().toISOString(),
    });
    store.set(STORAGE.contact, messages);

    contactForm.reset();
    if (contactCount) contactCount.textContent = "0";
    toast("success", "Pesan terkirim", "Terima kasih, " + name.split(" ")[0] + ". Kami akan membalas maksimal 1x24 jam kerja.");
  });
}

/* ---------- 14. Inisialisasi ---------- */
const yearEl = $("#year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

renderAuthArea();
router();
observeReveals();

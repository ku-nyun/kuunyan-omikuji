const STAMP_IMG  = "https://stickershop.line-scdn.net/stickershop/v1/product";
const EMOJI_IMG  = "https://stickershop.line-scdn.net/sticonshop/v1/product";
const STAMP_STORE = "https://store.line.me/stickershop/product";
const EMOJI_STORE = "https://store.line.me/emojishop/product";
const THEME_STORE = "https://store.line.me/themeshop/product";

let allItems = [];       // 全データ
let filtered  = [];      // 現在のフィルター結果
let currentType = "all"; // all / stamp / emoji / theme
let currentKana = "";    // あいうえお絞り込み
let currentQuery = "";   // 検索ワード
let allPage = 1;
const PAGE_SIZE = 60;

// ===== かな行マッピング =====
const KANA_ROWS = {
  "あ": /^[あ-おぁ-ぉア-オァ-ォ]/,
  "か": /^[か-こが-ごカ-コガ-ゴ]/,
  "さ": /^[さ-そざ-ぞサ-ソザ-ゾ]/,
  "た": /^[た-とだ-どタ-トダ-ド]/,
  "な": /^[な-のナ-ノ]/,
  "は": /^[は-ほば-ぼぱ-ぽハ-ホバ-ボパ-ポ]/,
  "ま": /^[ま-もマ-モ]/,
  "や": /^[や-よゃ-ょヤ-ヨャ-ョ]/,
  "ら": /^[ら-ろラ-ロ]/,
  "わ": /^[わ-んワ-ン]/,
  "A":  /^[A-Za-z]/,
};

// 各行の段落分け定義
const KANA_SECTIONS = {
  "あ": [
    { label: "あ", re: /^[あぁアァ]/ },
    { label: "い", re: /^[いぃイィ]/ },
    { label: "う", re: /^[うぅウゥヴ]/ },
    { label: "え", re: /^[えぇエェ]/ },
    { label: "お", re: /^[おぉオォ]/ },
  ],
  "か": [
    { label: "か", re: /^[かがカガ]/ },
    { label: "き", re: /^[きぎキギ]/ },
    { label: "く", re: /^[くぐクグ]/ },
    { label: "け", re: /^[けげケゲ]/ },
    { label: "こ", re: /^[こごコゴ]/ },
  ],
  "さ": [
    { label: "さ", re: /^[さざサザ]/ },
    { label: "し", re: /^[しじシジ]/ },
    { label: "す", re: /^[すずスズ]/ },
    { label: "せ", re: /^[せぜセゼ]/ },
    { label: "そ", re: /^[そぞソゾ]/ },
  ],
  "た": [
    { label: "た", re: /^[ただタダ]/ },
    { label: "ち", re: /^[ちぢチヂ]/ },
    { label: "つ", re: /^[つづッツヅ]/ },
    { label: "て", re: /^[てでテデ]/ },
    { label: "と", re: /^[とどトド]/ },
  ],
  "な": [
    { label: "な", re: /^[なナ]/ },
    { label: "に", re: /^[にニ]/ },
    { label: "ぬ", re: /^[ぬヌ]/ },
    { label: "ね", re: /^[ねネ]/ },
    { label: "の", re: /^[のノ]/ },
  ],
  "は": [
    { label: "は", re: /^[はばぱハバパ]/ },
    { label: "ひ", re: /^[ひびぴヒビピ]/ },
    { label: "ふ", re: /^[ふぶぷフブプ]/ },
    { label: "へ", re: /^[へべぺヘベペ]/ },
    { label: "ほ", re: /^[ほぼぽホボポ]/ },
  ],
  "ま": [
    { label: "ま", re: /^[まマ]/ },
    { label: "み", re: /^[みミ]/ },
    { label: "む", re: /^[むム]/ },
    { label: "め", re: /^[めメ]/ },
    { label: "も", re: /^[もモ]/ },
  ],
  "や": [
    { label: "や", re: /^[やゃヤャ]/ },
    { label: "ゆ", re: /^[ゆゅユュ]/ },
    { label: "よ", re: /^[よょヨョ]/ },
  ],
  "ら": [
    { label: "ら", re: /^[らラ]/ },
    { label: "り", re: /^[りリ]/ },
    { label: "る", re: /^[るル]/ },
    { label: "れ", re: /^[れレ]/ },
    { label: "ろ", re: /^[ろロ]/ },
  ],
  "わ": [
    { label: "わ", re: /^[わワ]/ },
    { label: "を", re: /^[をヲ]/ },
    { label: "ん", re: /^[んン]/ },
  ],
  "A": [
    { label: "A-F", re: /^[A-Fa-f]/ },
    { label: "G-L", re: /^[G-Lg-l]/ },
    { label: "M-R", re: /^[M-Rm-r]/ },
    { label: "S-Z", re: /^[S-Zs-z]/ },
  ],
};

// ===== データ読み込み =====
async function loadAll() {
  const [stamps, emoji, themes] = await Promise.all([
    fetch("data/stamps.json").then(r => r.json()).catch(() => ({ stamps: [] })),
    fetch("data/emoji.json").then(r => r.json()).catch(() => ({ stamps: [] })),
    fetch("data/themes.json").then(r => r.json()).catch(() => ({ stamps: [] })),
  ]);

  const stampItems = (stamps.stamps || []).map(s => ({ ...s, type: "stamp" }));
  const emojiItems = (emoji.stamps || []).map(s => ({ ...s, type: "emoji" }));
  const themeItems = (themes.stamps || []).map(s => ({ ...s, type: "theme" }));

  allItems = [...stampItems, ...emojiItems, ...themeItems];

  document.getElementById("total-count").textContent = allItems.length.toLocaleString();
  applyFilter();
  buildPickup();
}

// ===== カード生成 =====
function makeCard(item) {
  const a = document.createElement("a");
  let href, imgSrc;

  if (item.type === "stamp") {
    href   = `${STAMP_STORE}/${item.id}/ja`;
    imgSrc = `${STAMP_IMG}/${item.id}/LINEStorePC/main.png?v=1`;
  } else if (item.type === "emoji") {
    href   = `${EMOJI_STORE}/${item.id}/ja`;
    imgSrc = `${EMOJI_IMG}/${item.id}/iPhone/main.png`;
  } else {
    href   = `${THEME_STORE}/${item.id}/ja`;
    imgSrc = item.img || "";
  }

  a.href = href;
  a.target = "_blank";
  a.className = "card";

  const typeLabel = item.type === "stamp" ? "スタンプ" : item.type === "emoji" ? "絵文字" : "着せかえ";

  a.innerHTML = `
    <div class="card-img-wrap">
      <img src="${imgSrc}" alt="${item.name}" loading="lazy" onerror="this.parentElement.style.background='#eee'">
    </div>
    <div class="card-info">
      <p class="card-name">${item.name}</p>
      <p class="card-type">${typeLabel}</p>
    </div>
  `;
  return a;
}

// ===== フィルター適用 =====
function applyFilter() {
  filtered = allItems.filter(item => {
    // タイプフィルター
    if (currentType !== "all" && item.type !== currentType) return false;

    // あいうえお
    if (currentKana) {
      const regex = KANA_ROWS[currentKana];
      if (regex && !regex.test(item.name)) return false;
    }

    // キーワード
    if (currentQuery) {
      if (!item.name.toLowerCase().includes(currentQuery.toLowerCase())) return false;
    }

    return true;
  });

  allPage = 1;
  renderAll();
}

// ===== 全件レンダリング =====
function renderAll() {
  const isSearching = currentQuery || currentKana;
  const pickupArea  = document.getElementById("pickup-area");
  const resultsArea = document.getElementById("results-area");
  const allArea     = document.getElementById("all-area");

  // pickupはすべて表示かつ絞り込みなしの時だけ表示
  pickupArea.style.display = (!isSearching && currentType === "all") ? "block" : "none";

  if (isSearching) {
    resultsArea.style.display = "block";
    allArea.style.display     = "none";
    renderResults();
  } else {
    resultsArea.style.display = "none";
    allArea.style.display     = "block";
    renderAllGrid();
  }
}

// ===== 検索結果 =====
function renderResults() {
  const grid  = document.getElementById("results-grid");
  const title = document.getElementById("results-title");
  const more  = document.getElementById("btn-more");

  // かな行絞り込み中は段落分け表示
  if (currentKana && KANA_SECTIONS[currentKana]) {
    title.textContent = `${currentKana}行の作品（${filtered.length.toLocaleString()} 件）`;
    grid.innerHTML = "";
    grid.style.display = "block"; // かな段落モード
    more.style.display = "none";

    KANA_SECTIONS[currentKana].forEach(section => {
      const items = filtered.filter(item => section.re.test(item.name));
      if (items.length === 0) return;

      // 段落ヘッダー
      const heading = document.createElement("div");
      heading.className = "kana-heading";
      heading.textContent = `${section.label}（${items.length}件）`;
      grid.appendChild(heading);

      // グリッド
      const g = document.createElement("div");
      g.className = "grid";
      items.forEach(item => g.appendChild(makeCard(item)));
      grid.appendChild(g);
    });
    return;
  }

  title.textContent = `検索結果：${filtered.length.toLocaleString()} 件`;
  grid.innerHTML = "";
  grid.style.display = ""; // 通常グリッドに戻す

  const show = filtered.slice(0, PAGE_SIZE * allPage);
  show.forEach(item => grid.appendChild(makeCard(item)));

  more.style.display = filtered.length > show.length ? "block" : "none";
  more.onclick = () => { allPage++; renderResults(); };
}

// ===== 全件グリッド =====
function renderAllGrid() {
  const grid  = document.getElementById("all-grid");
  const title = document.getElementById("all-title");
  const more  = document.getElementById("btn-more-all");

  const typeLabel = currentType === "all" ? "すべての作品" :
                    currentType === "stamp" ? "スタンプ一覧" :
                    currentType === "emoji" ? "絵文字一覧" : "着せかえ一覧";
  title.textContent = `${typeLabel}（${filtered.length.toLocaleString()} 件）`;

  grid.innerHTML = "";
  const show = filtered.slice(0, PAGE_SIZE * allPage);
  show.forEach(item => grid.appendChild(makeCard(item)));

  more.style.display = filtered.length > show.length ? "block" : "none";
  more.onclick = () => { allPage++; renderAllGrid(); };
}

// ===== PickUp =====
function buildPickup() {
  const grid = document.getElementById("pickup-grid");
  const shuffled = [...allItems].sort(() => Math.random() - 0.5).slice(0, 12);
  shuffled.forEach(item => grid.appendChild(makeCard(item)));
}

// ===== イベント設定 =====
function setupEvents() {
  // 検索
  const input = document.getElementById("search-input");
  const clear = document.getElementById("search-clear");

  input.addEventListener("input", () => {
    currentQuery = input.value.trim();
    clear.style.display = currentQuery ? "block" : "none";
    // キーワード入力中はかな絞り込みを解除
    if (currentQuery) {
      currentKana = "";
      document.querySelectorAll(".aiueo-btn").forEach(b => b.classList.remove("active"));
    }
    allPage = 1;
    applyFilter();
  });

  clear.addEventListener("click", () => {
    input.value = "";
    currentQuery = "";
    clear.style.display = "none";
    allPage = 1;
    applyFilter();
  });

  // フィルターボタン
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentType = btn.dataset.type;
      allPage = 1;
      // すべて以外を選んだらPickUpを非表示
      document.getElementById("pickup-area").style.display =
        currentType === "all" ? "block" : "none";
      applyFilter();
    });
  });

  // あいうえお
  document.querySelectorAll(".aiueo-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const kana = btn.dataset.kana;
      if (currentKana === kana) {
        // 同じボタンを押したら解除
        currentKana = "";
        document.querySelectorAll(".aiueo-btn").forEach(b => b.classList.remove("active"));
      } else {
        currentKana = kana;
        document.querySelectorAll(".aiueo-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      }
      allPage = 1;
      applyFilter();
    });
  });
}

setupEvents();
loadAll();

// ===== 鳩の自己紹介吹き出し =====
const hatoBtn = document.getElementById("hato-btn");
const hatoBalloon = document.getElementById("hato-balloon");

hatoBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  hatoBalloon.classList.toggle("open");
});

document.addEventListener("click", () => {
  hatoBalloon.classList.remove("open");
});

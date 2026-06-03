const AUTHOR_ID = "5607562";
const STORE_BASE = "https://store.line.me/stickershop/product";
const IMG_BASE = "https://stickershop.line-scdn.net/stickershop/v1/product";

let stamps = [];
let selectedMood = null;

// ===== データ読み込み =====
async function loadStamps() {
  try {
    const res = await fetch("data/stamps.json");
    const json = await res.json();
    stamps = json.stamps || [];
  } catch {
    // stamps.json がまだない場合のダミーデータ
    stamps = [
      { id: "34236142", name: "liquid pigeon" },
      { id: "34236199", name: "pigeon cat!" },
      { id: "34234542", name: "Manul cat to send to lover" },
      { id: "34210078", name: "Baby cheetah live action" },
      { id: "34216758", name: "Round panda live action" },
      { id: "34209043", name: "Rabbit sushi!" },
      { id: "34208896", name: "Pi live action" },
      { id: "34207310", name: "Beluga dolphin live action" },
      { id: "34245005", name: "BIG! Pitbull live action" },
      { id: "34252857", name: "BIG! Baby meerkat live action" },
    ];
  }
}

// ===== URLから結果を復元 =====
function getStampFromUrl() {
  const params = new URLSearchParams(location.search);
  return params.get("stamp");
}

// ===== ランダムにスタンプを選ぶ =====
function pickRandom() {
  return stamps[Math.floor(Math.random() * stamps.length)];
}

// ===== 結果を表示 =====
function showResult(stamp) {
  const imgEl = document.getElementById("result-img");
  const nameEl = document.getElementById("result-name");
  const linkEl = document.getElementById("result-link");

  imgEl.src = `${IMG_BASE}/${stamp.id}/LINEStorePC/main.png?v=1`;
  imgEl.onerror = () => {
    imgEl.src = `${IMG_BASE}/${stamp.id}/iPhone/main.png?v=1`;
  };
  nameEl.textContent = stamp.name || `スタンプ #${stamp.id}`;
  linkEl.href = `${STORE_BASE}/${stamp.id}/ja`;

  // URLにスタンプIDを埋め込む（シェア用）
  const resultUrl = `${location.origin}${location.pathname}?stamp=${stamp.id}`;

  // シェアボタン設定
  document.getElementById("btn-x").onclick = () => {
    const text = encodeURIComponent(`あなたに選ばれたくーにゅんのスタンプはこれ！\n${resultUrl}`);
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
  };

  document.getElementById("btn-line").onclick = () => {
    const text = encodeURIComponent(`あなたに選ばれたくーにゅんのスタンプはこれ！ ${resultUrl}`);
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(resultUrl)}&text=${text}`, "_blank");
  };

  document.getElementById("btn-copy").onclick = () => {
    navigator.clipboard.writeText(resultUrl).then(() => {
      const btn = document.getElementById("btn-copy");
      btn.textContent = "✅ コピーしました！";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = "🔗 URLをコピー";
        btn.classList.remove("copied");
      }, 2000);
    });
  };

  showScreen("result");
}

// ===== 画面切り替え =====
function showScreen(name) {
  document.querySelectorAll(".screen").forEach(el => el.classList.remove("active"));
  document.getElementById(`screen-${name}`).classList.add("active");
}

// ===== おみくじを引く =====
function drawOmikuji() {
  showScreen("loading");

  setTimeout(() => {
    const stamp = pickRandom();
    // URLを更新（ブラウザの履歴に追加）
    history.pushState({}, "", `?stamp=${stamp.id}`);
    showResult(stamp);
  }, 1800);
}

// ===== 初期化 =====
async function init() {
  await loadStamps();
  buildSideColumns();

  // 気分ボタン
  document.querySelectorAll(".choice-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".choice-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedMood = btn.dataset.value;
      document.getElementById("btn-omikuji").disabled = false;
    });
  });

  // おみくじボタン
  document.getElementById("btn-omikuji").addEventListener("click", drawOmikuji);

  // もう一回ボタン
  document.getElementById("btn-retry").addEventListener("click", () => {
    document.querySelectorAll(".choice-btn").forEach(b => b.classList.remove("selected"));
    selectedMood = null;
    document.getElementById("btn-omikuji").disabled = true;
    history.pushState({}, "", location.pathname);
    showScreen("top");
  });

  // URLにstampパラメータがあれば直接結果を表示（シェアURLから来た場合）
  const stampId = getStampFromUrl();
  if (stampId) {
    const stamp = stamps.find(s => s.id === stampId) || { id: stampId, name: "" };
    showResult(stamp);
  } else {
    showScreen("top");
  }
}

init();

// ===== 左右流れるスタンプ装飾 =====
function buildSideColumns() {
  if (stamps.length === 0) return;

  // ランダムに30枚選ぶ
  const shuffled = [...stamps].sort(() => Math.random() - 0.5).slice(0, 30);

  // スマホ用：上下の帯
  ["track-top", "track-bottom"].forEach(id => {
    const track = document.getElementById(id);
    if (!track) return;
    const picked = [...stamps].sort(() => Math.random() - 0.5).slice(0, 20);
    [...picked, ...picked].forEach(s => {
      const a = document.createElement("a");
      a.href = `${STORE_BASE}/${s.id}/ja`;
      a.target = "_blank";
      const img = document.createElement("img");
      img.src = `${IMG_BASE}/${s.id}/LINEStorePC/main.png?v=1`;
      img.alt = s.name;
      img.className = "bottom-stamp-img";
      img.onerror = () => { a.style.display = "none"; };
      a.appendChild(img);
      track.appendChild(a);
    });
  });

  ["track-left", "track-right"].forEach(id => {
    const track = document.getElementById(id);
    // 2セット分追加してループが途切れないようにする
    [...shuffled, ...shuffled].forEach(s => {
      const a = document.createElement("a");
      a.href = `${STORE_BASE}/${s.id}/ja`;
      a.target = "_blank";
      const img = document.createElement("img");
      img.src = `${IMG_BASE}/${s.id}/LINEStorePC/main.png?v=1`;
      img.alt = s.name;
      img.className = "side-stamp-img";
      img.onerror = () => { a.style.display = "none"; };
      a.appendChild(img);
      track.appendChild(a);
    });
  });
}

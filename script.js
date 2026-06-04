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
  // OGP付きシェアURL（Vercel経由）
  const shareUrl = `${location.origin}/api/share?stamp=${stamp.id}`;

  // シェアボタン設定
  document.getElementById("btn-x").onclick = () => {
    const text = encodeURIComponent(`あなたに選ばれたくーにゅんのスタンプはこれ！`);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  document.getElementById("btn-line").onclick = () => {
    const text = encodeURIComponent(`あなたに選ばれたくーにゅんのスタンプはこれ！`);
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${text}`, "_blank");
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

// ===== シェア画像生成 =====
async function generateShareImage(stamp, resultUrl) {
  const btn = document.getElementById("btn-img-share");
  btn.textContent = "⏳ 生成中...";
  btn.disabled = true;

  try {
    const canvas = document.createElement("canvas");
    const W = 600, H = 600;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // 背景グラデーション
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#fff0f5");
    grad.addColorStop(0.5, "#ffe8f0");
    grad.addColorStop(1, "#fff5e0");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // タイトル
    ctx.fillStyle = "#d4436a";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("くーにゅんスタンプおみくじ", W / 2, 56);

    // サブタイトル
    ctx.fillStyle = "#aaa";
    ctx.font = "18px sans-serif";
    ctx.fillText("✨ あなたに選ばれたスタンプ ✨", W / 2, 94);

    // 白いカード背景
    ctx.fillStyle = "white";
    roundRect(ctx, 120, 114, 360, 360, 20);
    ctx.fill();

    // スタンプ画像（CORSなしで試みる）
    const imgEl = document.getElementById("result-img");
    if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
      try {
        ctx.drawImage(imgEl, 140, 124, 320, 320);
      } catch {
        drawPlaceholder(ctx, W);
      }
    } else {
      drawPlaceholder(ctx, W);
    }

    // スタンプ名
    ctx.fillStyle = "#555";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    const name = stamp.name || "";
    ctx.fillText(name.length > 22 ? name.slice(0, 22) + "…" : name, W / 2, 512);

    // URL
    ctx.fillStyle = "#bbb";
    ctx.font = "13px sans-serif";
    ctx.fillText("ku-nyun.github.io/kuunyan-omikuji", W / 2, 556);

    // 画像をBlobに変換
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));

    const file = new File([blob], "kuunyan-omikuji.png", { type: "image/png" });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        text: `あなたに選ばれたくーにゅんのスタンプはこれ！\n${resultUrl}`,
      });
    } else {
      showImageModal(blob);
    }
  } catch (e) {
    if (e.name !== "AbortError") {
      alert("画像の生成に失敗しました。URLをコピーしてシェアしてください。");
    }
  } finally {
    btn.textContent = "📸 画像でシェア";
    btn.disabled = false;
  }
}

function drawPlaceholder(ctx, W) {
  ctx.fillStyle = "#f5e8f0";
  ctx.font = "80px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🎴", W / 2, 330);
}

function loadImageCors(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function showImageModal(blob) {
  const url = URL.createObjectURL(blob);

  // 既存モーダルがあれば削除
  document.getElementById("share-modal")?.remove();

  const modal = document.createElement("div");
  modal.id = "share-modal";
  modal.innerHTML = `
    <div class="share-modal-overlay">
      <div class="share-modal-box">
        <p class="share-modal-hint">長押し or 右クリックで画像を保存できます</p>
        <img src="${url}" class="share-modal-img" alt="シェア画像">
        <button class="share-modal-close">閉じる</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector(".share-modal-close").onclick = () => modal.remove();
  modal.querySelector(".share-modal-overlay").onclick = (e) => {
    if (e.target === modal.querySelector(".share-modal-overlay")) modal.remove();
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

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

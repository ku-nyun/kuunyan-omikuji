export default function handler(req, res) {
  const { stamp, type } = req.query;

  const host = req.headers.host;
  const siteUrl = `https://${host}`;

  // スタンプ画像URL
  let imgUrl, storeUrl, resultUrl, title, description;

  if (type === "emoji") {
    imgUrl = stamp
      ? `https://stickershop.line-scdn.net/sticonshop/v1/product/${stamp}/iPhone/main.png`
      : `${siteUrl}/download.png`;
    storeUrl = `https://store.line.me/emojishop/product/${stamp}/ja`;
    resultUrl = `${siteUrl}/emoji.html?stamp=${stamp}`;
    title = "くーにゅん絵文字おみくじ";
    description = "あなたに選ばれたくーにゅんの絵文字はこれ！";
  } else {
    imgUrl = stamp
      ? `https://stickershop.line-scdn.net/stickershop/v1/product/${stamp}/LINEStorePC/main.png`
      : `${siteUrl}/download.png`;
    storeUrl = `https://store.line.me/stickershop/product/${stamp}/ja`;
    resultUrl = `${siteUrl}/?stamp=${stamp}`;
    title = "くーにゅんスタンプおみくじ";
    description = "あなたに選ばれたくーにゅんのスタンプはこれ！";
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");

  res.send(`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imgUrl}">
  <meta property="og:url" content="${resultUrl}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imgUrl}">
  <meta http-equiv="refresh" content="0;url=${resultUrl}">
</head>
<body>
  <script>location.replace("${resultUrl}");</script>
</body>
</html>`);
}

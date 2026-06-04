"""
クーニャン LINEスタンプ一覧をスクレイピングして data/stamps.json に保存するスクリプト
"""

import json
import time
import re
import ssl
from datetime import date
from pathlib import Path
import urllib.request

# macOS の SSL 証明書エラー対策
SSL_CONTEXT = ssl.create_default_context()
SSL_CONTEXT.check_hostname = False
SSL_CONTEXT.verify_mode = ssl.CERT_NONE

AUTHOR_ID = "5607562"
THEME_AUTHOR_ID = "10835258"
BASE_URL = f"https://store.line.me/stickershop/author/{AUTHOR_ID}/ja"
EMOJI_URL = f"https://store.line.me/stickershop/author/{AUTHOR_ID}/ja?category=emoji"
THEME_URL = f"https://store.line.me/themeshop/author/{THEME_AUTHOR_ID}/ja"
OUTPUT_PATH = Path(__file__).parent.parent / "data" / "stamps.json"
EMOJI_OUTPUT_PATH = Path(__file__).parent.parent / "data" / "emoji.json"
THEME_OUTPUT_PATH = Path(__file__).parent.parent / "data" / "themes.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "ja,en;q=0.9",
}


def fetch_page(url: str) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15, context=SSL_CONTEXT) as res:
        return res.read().decode("utf-8")


def parse_products(html: str, product_type: str = "stamp") -> list[dict]:
    products = []

    if product_type == "stamp":
        # スタンプ: 数字ID
        pattern = re.findall(
            r'href="/stickershop/product/(\d+)/ja"[^>]*>.*?alt="([^"]+)"',
            html, re.DOTALL,
        )
        seen = set()
        for product_id, name in pattern:
            if product_id not in seen:
                seen.add(product_id)
                products.append({"id": product_id, "name": name.strip()})
    elif product_type == "emoji":
        # 絵文字: 16進数ID
        pattern = re.findall(
            r'href="/emojishop/product/([0-9a-f]{24})/ja"[^>]*>.*?alt="([^"]+)"',
            html, re.DOTALL,
        )
        seen = set()
        for product_id, name in pattern:
            if product_id not in seen:
                seen.add(product_id)
                products.append({"id": product_id, "name": name.strip()})
    else:
        # 着せかえ: UUID形式、画像URLも一緒に取得
        # <a href="/themeshop/product/UUID/ja"> ... <img alt="名前" src="...">
        pattern = re.findall(
            r'href="/themeshop/product/([0-9a-f-]{36})/ja".*?alt="([^"]+)".*?src="(https://shop\.line-scdn\.net/themeshop/[^"]+)"',
            html, re.DOTALL,
        )
        seen = set()
        for product_id, name, img_url in pattern:
            if product_id not in seen:
                seen.add(product_id)
                products.append({"id": product_id, "name": name.strip(), "img": img_url})

    return products


def scrape_all(base_url: str, label: str, product_type: str = "stamp") -> list[dict]:
    all_products = []
    page = 1

    print(f"スクレイピング開始: {base_url} ({label})")

    while True:
        sep = "&" if "?" in base_url else "?"
        url = f"{base_url}{sep}page={page}"
        print(f"  ページ {page} を取得中...")

        try:
            html = fetch_page(url)
        except Exception as e:
            print(f"  エラー: {e}")
            break

        products = parse_products(html, product_type)

        if not products:
            print(f"  ページ {page}: 商品なし → 終了")
            break

        all_products.extend(products)
        print(f"  ページ {page}: {len(products)} 件取得（累計 {len(all_products)} 件）")

        if f'page={page + 1}' not in html:
            print("  次ページなし → 終了")
            break

        page += 1
        time.sleep(1)

    return all_products


EXCLUDE_NAMES = {"Premium", "PREMIUM", "premium"}

def dedupe(products: list[dict]) -> list[dict]:
    seen = set()
    unique = []
    for p in products:
        if p["id"] not in seen and p.get("name") not in EXCLUDE_NAMES:
            seen.add(p["id"])
            unique.append(p)
    return unique


def save(products: list[dict], path: Path, key: str):
    data = {
        "updated": str(date.today()),
        "count": len(products),
        key: products,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(f"完了！{len(products)} 件を {path} に保存しました。")


def main():
    # スタンプ
    stamps = dedupe(scrape_all(BASE_URL, "スタンプ"))
    save(stamps, OUTPUT_PATH, "stamps")

    print()

    # 絵文字
    emoji = dedupe(scrape_all(EMOJI_URL, "絵文字", product_type="emoji"))
    save(emoji, EMOJI_OUTPUT_PATH, "stamps")

    print()

    # 着せかえ
    themes = dedupe(scrape_all(THEME_URL, "着せかえ", product_type="theme"))
    save(themes, THEME_OUTPUT_PATH, "stamps")


if __name__ == "__main__":
    main()

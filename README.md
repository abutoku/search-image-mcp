# search-image-mcp

Unsplash APIを使用した画像検索機能を提供するMCPサーバーです。

## 機能

- Unsplash APIを使用した画像検索
- ページネーション対応
- 画像URL、説明、撮影者情報を返します

## セットアップ

1. https://unsplash.com/developers でUnsplashデベロッパーアカウントを作成
2. 新しいアプリケーションを作成してAccess Keyを取得
3. 依存関係をインストール:
   ```bash
   npm install
   ```
4. プロジェクトをビルド:
   ```bash
   npm run build
   ```

## 設定

サーバーは環境変数経由でUnsplash Access Keyが必要です。

### MCP設定

MCP設定JSONファイルに以下を追加してください：

```json
{
  "mcpServers": {
    "search-image-mcp": {
      "command": "node",
      "args": ["/path/to/search-image-mcp/dist/index.js"],
      "env": {
        "UNSPLASH_ACCESS_KEY": "your-unsplash-access-key-here"
      }
    }
  }
}
```

## 利用可能なツール

### search_images

Unsplashで画像を検索します。

**パラメータ:**
- `query` (必須): 画像検索クエリ
- `page` (オプション): ページ番号 (デフォルト: 1)
- `per_page` (オプション): 1ページあたりのアイテム数 (デフォルト: 10, 最大: 30)

**レスポンス:**
以下を含むJSONオブジェクトを返します：
- `query`: 使用された検索クエリ
- `total`: 結果の総数
- `total_pages`: 総ページ数
- `page`: 現在のページ番号
- `results`: 画像オブジェクトの配列
  - `id`: 画像ID
  - `description`: 画像の説明
  - `urls`: small、regular、fullサイズのURLを含むオブジェクト
  - `photographer`: 撮影者の名前とユーザー名
  - `link`: Unsplash上の画像へのリンク

## 開発

- TypeScriptをウォッチモードで実行: `npm run dev`
- ビルド: `npm run build`
- サーバー起動: `npm start`

## Docker

### Dockerイメージのビルド

```bash
npm run docker:build
```

### Docker Hubへのプッシュ

```bash
# Docker Hubのユーザー名を設定
export DOCKER_USERNAME="your-docker-username"

# ビルドしてプッシュ
npm run docker:publish
```

または個別に実行：

```bash
# イメージをビルド
npm run docker:build

# タグ付け
npm run docker:tag

# プッシュ
npm run docker:push
```

## npx

```json
{
  "mcpServers": {
    "search-image-mcp": {
      "command": "npx",
      "args": ["@abutoku/search-image-mcp"],
      "env": {
        "UNSPLASH_ACCESS_KEY": "your-unsplash-access-key-here"
      }
    }
  }
}
```

## docker

ローカルのdocker imageを指定する場合:
```json
Docker Hubに公開されたイメージをMCPサーバーとして使用する場合：

```json
{
  "mcpServers": {
    "search-image-mcp": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "UNSPLASH_ACCESS_KEY=your-unsplash-access-key-here",
        "search-image-mcp:latest"
      ]
    }
  }
}
```

Docker Hubに公開されたイメージをMCPサーバーとして使用する場合：

```json
{
  "mcpServers": {
    "search-image-mcp": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "UNSPLASH_ACCESS_KEY=your-unsplash-access-key-here",
        "abutoku/search-image-mcp:latest"
      ]
    }
  }
}
```

docker-composeを仕様する場合：

docker-compose.ymlに追記
```yaml
services:
  search-image-mcp:
    image: abutoku/search-image-mcp:latest
    environment:
      - UNSPLASH_ACCESS_KEY=${UNSPLASH_ACCESS_KEY}
    stdin_open: true
    tty: true
```


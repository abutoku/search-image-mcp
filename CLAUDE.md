# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## コマンド

### ビルドと開発
- `npm run build` - TypeScriptをJavaScriptにコンパイル
- `npm run dev` - TypeScriptコンパイラをウォッチモードで実行
- `npm start` - コンパイル済みのMCPサーバーを起動

### npm公開
- `npm publish` - npmに公開（prepublishOnly/postpublishフックでREADMEファイルを自動切り替え）
- `npm publish --dry-run` - 公開のテスト実行

## アーキテクチャ

このプロジェクトはUnsplash画像検索機能を提供するModel Context Protocol (MCP) サーバーです。

### シングルファイル構造
サーバーロジック全体が`src/index.ts`に含まれており、以下を実装：
- StdioServerTransportを使用したMCPサーバーの作成
- `search_images`ツールの実装
- Axios経由でのUnsplash API統合
- 認証用の環境変数`UNSPLASH_ACCESS_KEY`の使用

### 技術的な重要事項
- **TypeScript設定**: ES2022をターゲットにNode.js互換のCommonJSにコンパイル
- **エラーハンドリング**: MCPエラーコード（InvalidRequest、InternalError）を使用し、詳細なエラーメッセージを提供
- **APIリミット**: Unsplash APIから最大30件/ページの制限を強制
- **通信**: MCPプロトコル通信にstdioを使用

### デュアルREADMEシステム
プロジェクトは2つのREADMEファイルを維持：
- `README.md` - GitHub/ローカル開発用ドキュメント
- `README.npm.md` - npmパッケージドキュメント

package.jsonの`prepublishOnly`と`postpublish`フックがnpm publish時に自動的にこれらを切り替えます。コピー方式を使用しているため、ファイルの消失リスクがありません。

## 環境要件
- **必須**: `UNSPLASH_ACCESS_KEY`環境変数の設定が必要
- **Node.js**: CommonJSモジュールシステムを使用
- **依存関係**: 最小限 - プロダクションではMCP SDKとAxiosのみ
#!/usr/bin/env node
// MCP (Model Context Protocol) サーバーとして動作するNode.jsアプリケーション
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

// Unsplash APIのベースURLとアクセスキーの設定
const UNSPLASH_API_BASE = 'https://api.unsplash.com';
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// 環境変数からアクセスキーが取得できない場合はエラーを表示して終了
if (!UNSPLASH_ACCESS_KEY) {
  console.error('Error: UNSPLASH_ACCESS_KEY environment variable is not set');
  console.error('Please set it in your MCP settings configuration');
  process.exit(1);
}

// Unsplash APIから返される写真データの型定義
interface UnsplashPhoto {
  id: string;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    self: string;
    html: string;
    download: string;
  };
  user: {
    name: string;
    username: string;
  };
}

// Unsplash検索APIのレスポンス型定義
interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

// MCPサーバーインスタンスの作成
// サーバー名とバージョン、および提供する機能（ツール）を定義
const server = new Server(
  {
    name: 'get-image-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},  // このサーバーはツール機能を提供する
    },
  }
);

// ListToolsRequestハンドラー
// クライアントがこのサーバーで利用可能なツールの一覧を要求したときに呼ばれる
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_images',
        description: 'Search for images on Unsplash',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for images',
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
              default: 1,
            },
            per_page: {
              type: 'number',
              description: 'Number of items per page (default: 10, max: 30)',
              default: 10,
            },
          },
          required: ['query'],  // queryパラメータは必須
        },
      },
    ],
  };
});

// CallToolRequestハンドラー
// クライアントがツールを実行したときに呼ばれる
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // search_images以外のツールが呼ばれた場合はエラー
  if (request.params.name !== 'search_images') {
    throw new McpError(
      ErrorCode.MethodNotFound,
      `Unknown tool: ${request.params.name}`
    );
  }

  // リクエストパラメータを取得（デフォルト値も設定）
  const { query, page = 1, per_page = 10 } = request.params.arguments as {
    query: string;
    page?: number;
    per_page?: number;
  };

  try {
    // Unsplash APIにHTTPリクエストを送信
    const response = await axios.get<UnsplashSearchResponse>(
      `${UNSPLASH_API_BASE}/search/photos`,
      {
        headers: {
          // 認証ヘッダーにアクセスキーを設定
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
        params: {
          query,
          page,
          per_page: Math.min(per_page, 30),  // 最大30件に制限
        },
      }
    );

    const { total, total_pages, results } = response.data;

    // 検索結果が0件の場合
    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No images found for query: "${query}"`,
          },
        ],
      };
    }

    // 結果を整形して必要な情報のみを抽出
    const formattedResults = results.map((photo) => ({
      id: photo.id,
      description: photo.description || photo.alt_description || 'No description',
      urls: {
        small: photo.urls.small,
        regular: photo.urls.regular,
        full: photo.urls.full,
      },
      photographer: {
        name: photo.user.name,
        username: photo.user.username,
      },
      link: photo.links.html,
    }));

    // 整形した結果をJSON形式で返す
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              query,
              total,
              total_pages,
              page,
              results: formattedResults,
            },
            null,
            2  // インデント幅2で整形
          ),
        },
      ],
    };
  } catch (error) {
    // エラーハンドリング
    if (axios.isAxiosError(error)) {
      // 401エラー（認証エラー）の場合
      if (error.response?.status === 401) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          'Invalid Unsplash access key. Please check your UNSPLASH_ACCESS_KEY environment variable.'
        );
      }
      // その他のAPIエラー
      throw new McpError(
        ErrorCode.InternalError,
        `Unsplash API error: ${error.response?.data?.errors?.join(', ') || error.message}`
      );
    }
    // 予期しないエラー
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to search images: ${error}`
    );
  }
});

// メイン関数：サーバーを起動
async function main() {
  // 標準入出力を使用するトランスポートを作成
  const transport = new StdioServerTransport();
  // サーバーをトランスポートに接続
  await server.connect(transport);
}

// サーバー起動とエラーハンドリング
main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
# ともちゃんねる 要件定義

## 概要

ともちゃんねるは、日本語ニュースを掲示板まとめサイト風に読めるWebアプリです。固定のmockデータを使い、トップページ、記事詳細ページ、掲示板風コメント欄を表示します。

初回MVPではDB、n8n、OpenAI連携、認証、実保存は実装しません。

## 必須画面

### トップページ

- ヘッダー
- 検索ボックス
- 黒系のグローバルナビ
- カテゴリ別記事カード
- 人気ランキングサイドバー
- 新着記事
- カテゴリ導線
- 検索導線

### 記事詳細ページ

- 記事タイトル
- カテゴリタグ
- 投稿日時
- サムネイル画像
- 3行まとめ
- 本文解説
- とも向けポイント
- 出典リンク
- 掲示板風コメント欄
- コメント投稿フォーム

### v0.2.0 追加画面

- カテゴリ一覧ページ `/categories/[category]`
- 日付アーカイブページ `/archive`
- 検索結果ページ `/search?q=...`

## 型定義

### Article

- `id`: 内部ID
- `slug`: 公開URL用slug
- `title`
- `category`
- `publishedAt`
- `summaryLines`
- `body`
- `whyItMatters`
- `tomoPoint`
- `thumbnailUrl`
- `sources`
- `comments`

### Comment

- `id`: 内部ID
- `articleId`
- `displayNo`: 表示用番号
- `parentCommentId`
- `authorName`
- `authorRole`
- `shortId`
- `bodyLines`
- `commentType`: `user | ai | editor`
- `aiGenerated`
- `createdAt`
- `likeCount`
- `reportCount`

## コメントUI

- AIコメントには、短いIDの横に小さなグレーの `AI` バッジを表示します。
- `>>12` のような返信参照を表示できるようにします。
- 投稿フォームはDB保存せず、ローカルstateに一時追加するだけにします。

## Acceptance Criteria

- `pnpm install` が成功する
- `pnpm lint` が成功する
- `pnpm build` が成功する
- トップページが表示される
- 少なくとも5件のmock記事が表示される
- 記事詳細ページがslugで表示される
- 少なくとも15件のmockコメントが表示される
- AIバッジ付きコメントが表示される
- コメント投稿フォームが表示され、一時コメントを追加できる
- PCは2カラム、スマホは1カラムになる
- カテゴリページ、アーカイブ、検索ページが表示される

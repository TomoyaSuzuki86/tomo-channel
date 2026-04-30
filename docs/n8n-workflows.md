# n8n Workflows

## 1. collect-news

目的:
毎朝ニュースソースから記事候補を取得する。

流れ:

1. Cron Trigger
2. news_sourcesをPostgreSQLから取得
3. RSS/API/HTTPで記事取得
4. URL正規化
5. 重複排除
6. raw_articlesへ保存

## 2. generate-article

目的:
記事候補から、ともちゃんねる用の記事と初期コメントを生成する。

流れ:

1. Cron Trigger
2. raw_articlesから未処理記事を取得
3. 類似ニュースをクラスタリング
4. AIで事実抽出
5. AIで記事本文生成
6. AIで初期コメント生成
7. 画像候補を取得
8. articles/comments/sourcesへ保存

## 3. reply-to-comment

目的:
ユーザーコメントに対してAIスレ民の返信を生成する。

流れ:

1. Webhook Trigger
2. commentIdを受け取る
3. PostgreSQLからコメント、記事、既存コメントを取得
4. AIで返信モード判定
5. AIで返信生成
6. NG表現チェック
7. commentsへAI返信をinsert
8. ai_reply_jobsをcompletedへ更新

## 返信は非同期推奨

コメント投稿APIは、ユーザーコメントを即DB保存する。
その後、n8n Webhookを呼ぶ。
画面上では「スレ民が反応中...」などの表示を出し、返信は後から反映する。

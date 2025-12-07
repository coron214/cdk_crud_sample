# CDK CRUD アプリケーション

TypeScriptを使用したAWS CDKプロジェクトです。

## Webサイト

http://cdkcrudstack-websitebucket75c24d94-akbgd6ywvyun.s3-website-ap-northeast-1.amazonaws.com/

## アーキテクチャ

このプロジェクトは以下のAWSリソースで構成されています：
フルサーバーレス構成としており保守性や可用性に優れています。
セキュリティな部分にはまだまだ改善の余地があります。

- **DynamoDB**: アイテムデータの保存
- **Lambda**: CRUD操作のハンドラー
- **API Gateway**: RESTful APIエンドポイント
- **S3**: 静的Webサイトホスティングとファイルストレージ

## 主要なコマンド

* `npm run build`   TypeScriptをJavaScriptにコンパイル
* `npm run watch`   変更を監視して自動コンパイル
* `npm run test`    Jestユニットテストを実行
* `npx cdk deploy`  デフォルトのAWSアカウント/リージョンにデプロイ
* `npx cdk diff`    デプロイ済みスタックと現在の状態を比較
* `npx cdk synth`   CloudFormationテンプレートを生成

## APIエンドポイント

- `GET /items` - 全アイテムの取得
- `POST /items` - アイテムの作成
- `GET /items/{id}` - 特定アイテムの取得
- `DELETE /items/{id}` - アイテムの削除

## API 定義書

- openapi.jsonを参照。

## AWS構成図

- architecture.md を参照。
- または、draw.ioで architecture-diagram.drawio を参照。
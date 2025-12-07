# CDK CRUD アプリケーション構成図

## アーキテクチャ

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ HTTP
       ▼
┌─────────────────────┐
│  S3 Static Website  │ (index.html)
│  Website Bucket     │
└─────────────────────┘
       │
       │ HTTPS (CORS)
       ▼
┌─────────────────────┐
│   API Gateway       │ /items (GET, POST)
│   REST API          │ /items/{id} (GET, DELETE)
└──────┬──────────────┘
       │
       │ Invoke
       ▼
┌─────────────────────┐
│  Lambda Function    │ Node.js 20.x
│  ItemsHandler       │ CRUD Operations
└──────┬──────────────┘
       │
       │ Read/Write
       ▼
┌─────────────────────┐
│   DynamoDB Table    │ Partition Key: id
│   ItemsTable        │ Attributes: id, data
└─────────────────────┘
```

## コンポーネント

- **S3 Website Bucket**: 静的HTMLホスティング（Public Read Access）
- **API Gateway**: RESTful API エンドポイント（CORS有効）
- **Lambda Function**: DynamoDB CRUD操作を処理
- **DynamoDB Table**: アイテムデータ永続化

## エンドポイント

- Website: `http://cdkcrudstack-websitebucket75c24d94-akbgd6ywvyun.s3-website-ap-northeast-1.amazonaws.com`
- API: `https://fejl332auf.execute-api.ap-northeast-1.amazonaws.com/prod/`

## API仕様

| Method | Path | 説明 |
|--------|------|------|
| GET | /items | 全アイテム取得 |
| POST | /items | アイテム作成 |
| GET | /items/{id} | 特定アイテム取得 |
| DELETE | /items/{id} | アイテム削除 |

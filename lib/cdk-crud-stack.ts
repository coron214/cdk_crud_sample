import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class CdkCrudStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'ItemsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const bucket = new s3.Bucket(this, 'ItemsBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const handler = new lambda.Function(this, 'ItemsHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromInline(`
        const { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
        const client = new DynamoDBClient();
        const s3 = new S3Client();

        exports.handler = async (event) => {
          const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
          const method = event.httpMethod;
          const path = event.path;
          
          try {
            if (method === 'POST' && path === '/items') {
              const body = JSON.parse(event.body);
              await client.send(new PutItemCommand({
                TableName: process.env.TABLE_NAME,
                Item: { id: { S: body.id }, data: { S: body.data } }
              }));
              return { statusCode: 200, headers, body: JSON.stringify({ message: 'Created' }) };
            }
            
            if (method === 'GET' && path === '/items') {
              const result = await client.send(new ScanCommand({ TableName: process.env.TABLE_NAME }));
              return { statusCode: 200, headers, body: JSON.stringify(result.Items) };
            }
            
            if (method === 'GET' && path.startsWith('/items/')) {
              const id = path.split('/')[2];
              const result = await client.send(new GetItemCommand({
                TableName: process.env.TABLE_NAME,
                Key: { id: { S: id } }
              }));
              return { statusCode: 200, headers, body: JSON.stringify(result.Item) };
            }
            
            if (method === 'DELETE' && path.startsWith('/items/')) {
              const id = path.split('/')[2];
              await client.send(new DeleteItemCommand({
                TableName: process.env.TABLE_NAME,
                Key: { id: { S: id } }
              }));
              return { statusCode: 200, headers, body: JSON.stringify({ message: 'Deleted' }) };
            }
            
            return { statusCode: 404, headers, body: JSON.stringify({ message: 'Not Found' }) };
          } catch (error) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
          }
        };
      `),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: bucket.bucketName
      }
    });

    table.grantReadWriteData(handler);
    bucket.grantReadWrite(handler);

    const api = new apigateway.RestApi(this, 'ItemsApi', {
      restApiName: 'Items Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type']
      }
    });

    const items = api.root.addResource('items');
    items.addMethod('GET', new apigateway.LambdaIntegration(handler));
    items.addMethod('POST', new apigateway.LambdaIntegration(handler));

    const item = items.addResource('{id}');
    item.addMethod('GET', new apigateway.LambdaIntegration(handler));
    item.addMethod('DELETE', new apigateway.LambdaIntegration(handler));

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
    new cdk.CfnOutput(this, 'WebsiteUrl', { value: websiteBucket.bucketWebsiteUrl });
    new cdk.CfnOutput(this, 'SwaggerUrl', { 
      value: `${api.url}_doc`,
      description: 'Swagger UI URL (append stage name if needed)'
    });
    new cdk.CfnOutput(this, 'OpenApiExport', { 
      value: `https://${api.restApiId}.execute-api.${this.region}.amazonaws.com/${api.deploymentStage.stageName}/_doc`,
      description: 'OpenAPI specification endpoint'
    });
  }
}

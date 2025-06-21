import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ConfigService } from "@nestjs/config";

export const createDynamoDBClient = (configService: ConfigService): DynamoDBDocumentClient => {
    const region = configService.get<string>('AWS_DYNAMODB_REGION');
    const accessKeyId = configService.get<string>('AWS_DYNAMODB_ACCESS_KEY_ID');
    const secretAccessKey = configService.get<string>('AWS_DYNAMODB_SECRET_ACCESS_KEY');

    if (!region || !accessKeyId || !secretAccessKey) {
        throw new Error('Missing AWS DynamoDB configuration in environment variables');
    }
    
    const client = new DynamoDBClient({
        region,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    return DynamoDBDocumentClient.from(client, {
        marshallOptions: {
            convertEmptyValues: false,
            removeUndefinedValues: true,
            convertClassInstanceToMap: false,
        },
        unmarshallOptions: {
            wrapNumbers: false,
        },
    });
};
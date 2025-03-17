import { S3Client } from '@aws-sdk/client-s3';
import { RekognitionClient } from '@aws-sdk/client-rekognition';

export const region = import.meta.env.VITE_AWS_REGION || 'us-east-1';

// Development mode check
export const isDevelopment = import.meta.env.DEV || false;
const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
const bucketName = import.meta.env.VITE_S3_BUCKET_NAME;

// Always use real clients
// Initialize S3 client with proper error handling
export const s3Client = new S3Client({
    region,
    credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
    },
    requestHandler: {
        handleRequest: async (request: any) => {
            if (!request.headers) request.headers = {};
            request.headers['Access-Control-Allow-Origin'] = '*';
            request.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,HEAD,OPTIONS';
            request.headers['Access-Control-Allow-Headers'] = '*';
            return request;
        }
    }
});

// Initialize Rekognition client with proper error handling
export const rekognitionClient = new RekognitionClient({
    region,
    credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
    },
});

export const S3_BUCKET_NAME = bucketName || 'ps-pics';
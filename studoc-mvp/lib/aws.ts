
import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const region = process.env.AWS_REGION || "us-east-1";

export const s3 = new S3Client({ region });
const ddb = new DynamoDBClient({ region });
export const doc = DynamoDBDocumentClient.from(ddb);
export const tables = {
  users: process.env.STUDOC_USERS || "StuDocUsers",
  groups: process.env.STUDOC_GROUPS || "StuDocGroups",
  files: process.env.STUDOC_FILES || "StuDocFiles",
};
export const bucket = process.env.STUDOC_BUCKET || "CHANGE_ME_BUCKET";

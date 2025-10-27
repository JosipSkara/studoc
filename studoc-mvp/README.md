
# StuDoc MVP (Cloud Development)

EC2-deployable Next.js (App Router) app implementing:
- S3 document storage with presigned uploads
- DynamoDB for users, groups, and file metadata
- Password/role-based access (JWT cookie)
- Group folders and tags
- Simple search (by filename, tag)
- Minimal UI

## AWS Setup

Create the following resources (names are env vars below):
- S3 bucket: `STUDOC_BUCKET`
- DynamoDB tables:
  - `STUDOC_USERS` (PK: `userId`)
  - `STUDOC_GROUPS` (PK: `groupId`)
  - `STUDOC_FILES` (PK: `fileId`)
Set AWS credentials on the host with permissions for these resources.

## Environment

Create `.env.local`:

```
JWT_SECRET=change_me
AWS_REGION=eu-central-1
STUDOC_BUCKET=your-bucket
STUDOC_USERS=StuDocUsers
STUDOC_GROUPS=StuDocGroups
STUDOC_FILES=StuDocFiles
```

## Run

```bash
npm install
npm run build
npm start
# or for dev
npm run dev
```

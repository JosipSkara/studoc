// lib/userStore.ts
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { doc, tables } from '@/lib/aws';
import fs from 'fs/promises';
import path from 'path';

const MODE = (process.env.AUTH_MODE || 'aws').toLowerCase();
const dataFile = path.join(process.cwd(), '.data', 'users.json');

async function ensureFile() {
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    try { await fs.access(dataFile); } catch { await fs.writeFile(dataFile, '[]'); }
}

export async function getUserByEmail(email: string) {
    const keyEmail = email.toLowerCase();

    if (MODE === 'local') {
        await ensureFile();
        const arr = JSON.parse(await fs.readFile(dataFile, 'utf8')) as any[];
        return (
            arr.find(
                (u) =>
                    (u.Email?.toLowerCase?.() === keyEmail) ||
                    (u.email?.toLowerCase?.() === keyEmail) ||
                    (u.UserID === keyEmail) ||
                    (u.userId === keyEmail)
            ) || null
        );
    }

    // AWS-Modus
    const res = await doc.send(new GetCommand({
        TableName: tables.users,
        Key: { UserID: keyEmail },
    }));
    return (res.Item as any) ?? null;
}

export async function putUser(item: any) {
    if (MODE === 'local') {
        await ensureFile();
        const arr = JSON.parse(await fs.readFile(dataFile, 'utf8')) as any[];
        const idx = arr.findIndex((u) => (u.UserID || u.userId) === item.UserID);
        if (idx >= 0) arr[idx] = item; else arr.push(item);
        await fs.writeFile(dataFile, JSON.stringify(arr, null, 2));
        return;
    }

    // AWS-Modus
    await doc.send(new PutCommand({
        TableName: tables.users,
        Item: item,
    }));
}

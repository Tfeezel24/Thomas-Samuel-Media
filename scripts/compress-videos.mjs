#!/usr/bin/env node
/**
 * compress-videos.mjs
 *
 * Batch-compresses every portfolio video in Firebase Storage so the
 * public site and the admin Reorder tab don't eat bandwidth.
 *
 * For each video in the `portfolio` Firestore collection:
 *   1. Download from Firebase Storage
 *   2. Re-encode with ffmpeg (H.264, CRF 28, 1280w, AAC 96k, faststart)
 *   3. Upload back to the SAME storage path (overwrites original)
 *
 * The download URL stays the same — no Firestore update required.
 *
 * ─── Requirements ──────────────────────────────────────────────────────
 *   • ffmpeg installed          → `brew install ffmpeg`
 *   • Node 18+
 *   • firebase-admin + node-fetch installed:
 *       npm install -D firebase-admin node-fetch
 *   • Service account JSON key at $GOOGLE_APPLICATION_CREDENTIALS
 *     (download from Firebase Console → Project settings → Service accounts)
 *
 * ─── Usage ─────────────────────────────────────────────────────────────
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *   node scripts/compress-videos.mjs             # dry run — lists all videos
 *   node scripts/compress-videos.mjs --execute   # actually compress + upload
 *   node scripts/compress-videos.mjs --execute --id=<portfolioId>  # single item
 *
 * Typical savings: 50–80% file size. A 40 MB hero video becomes ~8–15 MB.
 */

import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import admin from 'firebase-admin';

const FIREBASE_BUCKET = 'thomassamuelmedia.firebasestorage.app'; // change if different
const TARGET_WIDTH = 1280;
const CRF = 28;               // 18=visually lossless, 23=default, 28=aggressive, 32=very small
const AUDIO_BITRATE = '96k';

const args = process.argv.slice(2);
const EXECUTE = args.includes('--execute');
const ID_ARG = args.find(a => a.startsWith('--id='))?.split('=')[1];

// ─── Firebase init ─────────────────────────────────────────────────────
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('❌ GOOGLE_APPLICATION_CREDENTIALS env var not set.');
    console.error('   Download a service account key from Firebase Console and:');
    console.error('   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: FIREBASE_BUCKET,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// ─── Helpers ───────────────────────────────────────────────────────────
function run(cmd, args) {
    return new Promise((resolve, reject) => {
        const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
        let stderr = '';
        p.stderr.on('data', d => { stderr += d.toString(); });
        p.on('close', code => code === 0 ? resolve() : reject(new Error(stderr || `${cmd} exited ${code}`)));
    });
}

// Extract the storage object path from a Firebase download URL.
// Handles both `firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>` and
// the newer `<bucket>.firebasestorage.app/<path>` format.
function storagePathFromUrl(url) {
    try {
        const u = new URL(url);
        if (u.pathname.startsWith('/v0/b/')) {
            const m = u.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)/);
            if (m) return decodeURIComponent(m[1]);
        }
        // Fallback: assume the path after the host is the object path
        return decodeURIComponent(u.pathname.replace(/^\/+/, ''));
    } catch {
        return null;
    }
}

function prettyBytes(n) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
    return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

// ─── Main ──────────────────────────────────────────────────────────────
async function main() {
    console.log(`Mode: ${EXECUTE ? 'EXECUTE (will overwrite files)' : 'DRY RUN (no changes)'}`);
    console.log(`Bucket: ${FIREBASE_BUCKET}`);
    console.log();

    let query = db.collection('portfolio');
    const snapshot = await query.get();

    const videos = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.videoUrl) videos.push({ id: doc.id, ...data });
    });

    const targets = ID_ARG ? videos.filter(v => v.id === ID_ARG) : videos;
    console.log(`Found ${videos.length} video(s) in Firestore. Processing ${targets.length}.\n`);

    let totalBefore = 0, totalAfter = 0, processed = 0, failed = 0;

    for (const v of targets) {
        const storagePath = storagePathFromUrl(v.videoUrl);
        if (!storagePath) {
            console.warn(`  ⚠️  ${v.id}: could not parse storage path from ${v.videoUrl}`);
            failed++;
            continue;
        }

        const inFile = path.join(tmpdir(), `in-${v.id}-${Date.now()}.mp4`);
        const outFile = path.join(tmpdir(), `out-${v.id}-${Date.now()}.mp4`);

        try {
            const file = bucket.file(storagePath);
            const [metaBefore] = await file.getMetadata();
            const sizeBefore = Number(metaBefore.size || 0);

            console.log(`→ ${v.id}  (${v.title || v.category || '(untitled)'})`);
            console.log(`    path: ${storagePath}`);
            console.log(`    before: ${prettyBytes(sizeBefore)}`);

            if (!EXECUTE) continue;

            // Download
            await file.download({ destination: inFile });

            // Re-encode
            await run('ffmpeg', [
                '-y', '-i', inFile,
                '-c:v', 'libx264',
                '-crf', String(CRF),
                '-preset', 'medium',
                '-vf', `scale='min(${TARGET_WIDTH},iw)':'-2'`,
                '-c:a', 'aac', '-b:a', AUDIO_BITRATE,
                '-movflags', '+faststart',
                outFile,
            ]);

            const sizeAfter = (await fs.stat(outFile)).size;
            const savings = ((1 - sizeAfter / sizeBefore) * 100).toFixed(1);
            console.log(`    after:  ${prettyBytes(sizeAfter)}  (−${savings}%)`);

            // Only overwrite if we actually saved space
            if (sizeAfter < sizeBefore) {
                await bucket.upload(outFile, {
                    destination: storagePath,
                    metadata: {
                        contentType: 'video/mp4',
                        cacheControl: 'public, max-age=31536000, immutable',
                    },
                });
                console.log(`    ✅ uploaded`);
                totalBefore += sizeBefore;
                totalAfter += sizeAfter;
                processed++;
            } else {
                console.log(`    ⏭  skipped (already smaller)`);
            }
        } catch (err) {
            console.error(`    ❌ ${err.message}`);
            failed++;
        } finally {
            for (const f of [inFile, outFile]) {
                if (existsSync(f)) await fs.unlink(f).catch(() => {});
            }
        }
        console.log();
    }

    console.log('─'.repeat(60));
    console.log(`Processed: ${processed}   Failed: ${failed}`);
    if (processed > 0) {
        const pct = ((1 - totalAfter / totalBefore) * 100).toFixed(1);
        console.log(`Total:    ${prettyBytes(totalBefore)} → ${prettyBytes(totalAfter)}  (−${pct}%)`);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});

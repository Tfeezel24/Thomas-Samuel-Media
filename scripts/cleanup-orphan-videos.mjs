#!/usr/bin/env node
/**
 * cleanup-orphan-videos.mjs
 *
 * Finds portfolio entries whose videoUrl points to a non-existent file in
 * Firebase Storage and deletes those Firestore docs.
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
 *   node scripts/cleanup-orphan-videos.mjs            # dry run
 *   node scripts/cleanup-orphan-videos.mjs --execute  # delete
 */

import admin from 'firebase-admin';

const FIREBASE_BUCKET = 'thomas-samuel-media.firebasestorage.app';
const EXECUTE = process.argv.includes('--execute');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('❌ GOOGLE_APPLICATION_CREDENTIALS not set');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: FIREBASE_BUCKET,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

function storagePathFromUrl(url) {
    try {
        const u = new URL(url);
        if (u.pathname.startsWith('/v0/b/')) {
            const m = u.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)/);
            if (m) return decodeURIComponent(m[1]);
        }
        return decodeURIComponent(u.pathname.replace(/^\/+/, ''));
    } catch {
        return null;
    }
}

async function main() {
    console.log(`Mode: ${EXECUTE ? 'EXECUTE (will delete)' : 'DRY RUN'}`);
    console.log();

    const snapshot = await db.collection('portfolio').get();
    const orphans = [];

    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (!data.videoUrl) continue;

        const path = storagePathFromUrl(data.videoUrl);
        if (!path) continue;

        try {
            const [exists] = await bucket.file(path).exists();
            if (!exists) {
                orphans.push({ id: doc.id, title: data.title, category: data.category, path });
            }
        } catch (err) {
            orphans.push({ id: doc.id, title: data.title, category: data.category, path, error: err.message });
        }
    }

    console.log(`Found ${orphans.length} orphan(s):\n`);
    for (const o of orphans) {
        console.log(`  • ${o.id}  [${o.category}]  ${o.title || '(untitled)'}`);
        console.log(`      ${o.path}`);
    }

    if (!EXECUTE) {
        console.log('\n(Dry run. Re-run with --execute to delete these Firestore docs.)');
        return;
    }

    console.log('\nDeleting...');
    let deleted = 0;
    for (const o of orphans) {
        try {
            await db.collection('portfolio').doc(o.id).delete();
            console.log(`  ✅ ${o.id}`);
            deleted++;
        } catch (err) {
            console.log(`  ❌ ${o.id}: ${err.message}`);
        }
    }
    console.log(`\nDeleted ${deleted}/${orphans.length}`);
}

main().catch(err => { console.error(err); process.exit(1); });

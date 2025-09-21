module.exports = [
"[project]/wigg/apps/wigg-admin/.next-internal/server/app/api/moderation/pending/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/punycode [external] (punycode, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("punycode", () => require("punycode"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[project]/wigg/apps/wigg-admin/lib/supabaseAdmin.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabaseAdmin",
    ()=>supabaseAdmin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/wigg/apps/wigg-admin/node_modules/@supabase/supabase-js/dist/module/index.js [app-route] (ecmascript) <locals>");
;
function supabaseAdmin() {
    const url = ("TURBOPACK compile-time value", "https://anmadaditlpkedmaeibx.supabase.co");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
        throw new Error('Missing Supabase env vars (URL or Service Role).');
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(url, serviceKey, {
        auth: {
            persistSession: false
        }
    });
}
}),
"[project]/wigg/apps/wigg-admin/lib/schema.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SCHEMA",
    ()=>SCHEMA
]);
const SCHEMA = {
    seedTable: process.env.MOMENTS_SEED_TABLE || 'moments_seed',
    momentsTable: process.env.MOMENTS_TABLE || 'moments',
    // Column mappings for seed table (adapt if your schema differs)
    seedCols: {
        id: 'id',
        title: 'content_title',
        season: 'season',
        episode: 'episode',
        minute: 'minute',
        sourceUrl: 'source_url',
        sourceType: 'source_type',
        sourceSubreddit: 'source_subreddit',
        sourceKind: 'source_kind',
        sourceId: 'source_id',
        score: 'score',
        confidence: 'confidence',
        quote: 'quote',
        createdUtc: 'created_utc',
        status: 'status',
        insertedAt: 'inserted_at'
    },
    momentsCols: {
        id: 'id',
        title: 'content_title',
        season: 'season',
        episode: 'episode',
        minute: 'minute',
        confidence: 'confidence',
        sourceUrl: 'source_url',
        source: 'source',
        quoted: 'quoted',
        createdUtc: 'created_utc',
        insertedAt: 'inserted_at'
    }
};
}),
"[project]/wigg/apps/wigg-admin/app/api/moderation/pending/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/wigg/apps/wigg-admin/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/wigg/apps/wigg-admin/lib/supabaseAdmin.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$lib$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/wigg/apps/wigg-admin/lib/schema.ts [app-route] (ecmascript)");
;
;
;
async function GET(req) {
    const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"])();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(process.env.MOD_PAGE_SIZE || '50', 10);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const cols = __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$lib$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SCHEMA"].seedCols;
    let query = db.from(__TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$lib$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SCHEMA"].seedTable).select(`${cols.id}, ${cols.title}, ${cols.season}, ${cols.episode}, ${cols.minute}, ${cols.sourceUrl}, ${cols.sourceSubreddit}, ${cols.sourceKind}, ${cols.confidence}, ${cols.quote}, ${cols.createdUtc}, ${cols.score}`, {
        count: 'exact'
    }).eq(cols.status, 'needs_review').order(cols.createdUtc, {
        ascending: false
    }).range(from, to);
    if (q) {
        // naive ILIKE on title; adapt if your DB uses a different column
        query = query.ilike(cols.title, `%${q}%`);
    }
    const { data, count, error } = await query;
    if (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message
        }, {
            status: 500
        });
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        data,
        count,
        page,
        pageSize
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__152c009f._.js.map
module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/wigg/apps/wigg-admin/components/usePendingMoments.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createPendingMomentsController",
    ()=>createPendingMomentsController,
    "normalizeMoment",
    ()=>normalizeMoment,
    "usePendingMoments",
    ()=>usePendingMoments
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/wigg/apps/wigg-admin/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
;
function normalizeMoment(raw) {
    if (!raw) return null;
    const numericId = typeof raw.id === "number" ? raw.id : Number(raw.id);
    if (!Number.isFinite(numericId)) return null;
    const title = typeof raw.content_title === "string" && raw.content_title.trim().length > 0 ? raw.content_title : "Untitled moment";
    const confidence = typeof raw.confidence === "number" ? raw.confidence : 0;
    const status = raw.status === "approved" || raw.status === "rejected" ? raw.status : "needs_review";
    return {
        id: numericId,
        content_title: title,
        season: raw.season ?? null,
        episode: raw.episode ?? null,
        minute: raw.minute ?? null,
        confidence,
        quote: raw.quote ?? null,
        source_subreddit: raw.source_subreddit ?? null,
        source_url: raw.source_url ?? null,
        created_utc: raw.created_utc ?? null,
        status
    };
}
function createPendingMomentsController(fetchImpl) {
    let moments = [];
    let error = null;
    const getMoments = ()=>moments;
    const getError = ()=>error;
    const load = async ()=>{
        try {
            const response = await fetchImpl("/api/moderation/pending");
            if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
            const result = await response.json();
            moments = Array.isArray(result?.data) ? result.data.map((item)=>normalizeMoment(item)).filter((value)=>value !== null) : [];
            error = null;
        } catch (err) {
            error = err instanceof Error ? err.message : "Failed to fetch data";
            console.error("Error fetching pending moments", err);
            throw err;
        }
        return moments;
    };
    const remove = (id)=>{
        moments = moments.filter((moment)=>moment.id !== id);
        return moments;
    };
    const postAction = async (path, id)=>{
        return fetchImpl(path, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id
            })
        });
    };
    const approve = async (id)=>{
        const numericId = typeof id === "number" ? id : Number(id);
        const response = await postAction("/api/moderation/approve", numericId);
        if (response.ok) remove(numericId);
        return response;
    };
    const reject = async (id)=>{
        const numericId = typeof id === "number" ? id : Number(id);
        const response = await postAction("/api/moderation/reject", numericId);
        if (response.ok) remove(numericId);
        return response;
    };
    return {
        load,
        approve,
        reject,
        remove,
        getMoments,
        getError
    };
}
function usePendingMoments() {
    const controller = (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>createPendingMomentsController(fetch), []);
    const [moments, setMoments] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(controller.getMoments());
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(controller.getError());
    const refresh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        try {
            setLoading(true);
            const data = await controller.load();
            setMoments([
                ...data
            ]);
            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to fetch data";
            setError(message);
        } finally{
            setLoading(false);
        }
    }, [
        controller
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        refresh();
    }, [
        refresh
    ]);
    const approveMoment = (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (id)=>{
        const response = await controller.approve(id);
        if (response.ok) setMoments([
            ...controller.getMoments()
        ]);
        return response;
    }, [
        controller
    ]);
    const rejectMoment = (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (id)=>{
        const response = await controller.reject(id);
        if (response.ok) setMoments([
            ...controller.getMoments()
        ]);
        return response;
    }, [
        controller
    ]);
    return {
        moments,
        loading,
        error,
        refresh,
        approveMoment,
        rejectMoment
    };
}
}),
"[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ModerationTable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/wigg/apps/wigg-admin/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$components$2f$usePendingMoments$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/wigg/apps/wigg-admin/components/usePendingMoments.ts [app-ssr] (ecmascript)");
"use client";
;
;
function formatSeasonEpisode(season, episode) {
    const parts = [
        season,
        episode
    ].filter((value)=>typeof value === "number" && Number.isFinite(value));
    return parts.length ? parts.join("x") : "N/A";
}
function formatMinute(minute) {
    if (typeof minute === "number" && Number.isFinite(minute)) return String(minute);
    return "N/A";
}
function formatConfidence(confidence) {
    if (!Number.isFinite(confidence)) return "0%";
    return `${Math.round(confidence * 100)}%`;
}
function confidenceColor(confidence) {
    if (confidence >= 0.8) return "bg-green-900 text-green-200";
    if (confidence >= 0.5) return "bg-yellow-900 text-yellow-200";
    return "bg-red-900 text-red-200";
}
function renderRow(moment, approve, reject) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
        className: "border-t border-neutral-800 hover:bg-neutral-800/50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "p-3 font-medium text-neutral-100",
                children: moment.content_title
            }, void 0, false, {
                fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                lineNumber: 30,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "p-3 text-neutral-200",
                children: formatSeasonEpisode(moment.season, moment.episode)
            }, void 0, false, {
                fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "p-3 text-neutral-200",
                children: formatMinute(moment.minute)
            }, void 0, false, {
                fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "p-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: `px-2 py-1 rounded text-xs font-medium ${confidenceColor(moment.confidence)}`,
                    children: formatConfidence(moment.confidence)
                }, void 0, false, {
                    fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                    lineNumber: 34,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "p-3 max-w-[320px]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "truncate text-neutral-300",
                    title: moment.quote ?? undefined,
                    children: moment.quote || "No quote provided"
                }, void 0, false, {
                    fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                    lineNumber: 39,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                lineNumber: 38,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "p-3 text-sm text-neutral-300",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col gap-1",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: moment.source_subreddit || "Unknown subreddit"
                        }, void 0, false, {
                            fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                            lineNumber: 45,
                            columnNumber: 11
                        }, this),
                        moment.source_url && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            href: moment.source_url,
                            target: "_blank",
                            rel: "noopener noreferrer",
                            className: "text-blue-400 hover:text-blue-300 underline",
                            children: "View Post"
                        }, void 0, false, {
                            fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                            lineNumber: 47,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                    lineNumber: 44,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                lineNumber: 43,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "p-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>approve(moment.id),
                            className: "px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-sm font-medium",
                            children: "Approve"
                        }, void 0, false, {
                            fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                            lineNumber: 60,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>reject(moment.id),
                            className: "px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-sm font-medium",
                            children: "Reject"
                        }, void 0, false, {
                            fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                            lineNumber: 66,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                    lineNumber: 59,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                lineNumber: 58,
                columnNumber: 7
            }, this)
        ]
    }, moment.id, true, {
        fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
        lineNumber: 29,
        columnNumber: 5
    }, this);
}
function ModerationTable() {
    const { moments, loading, error, refresh, approveMoment, rejectMoment } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$components$2f$usePendingMoments$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePendingMoments"])();
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-center p-8",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-lg",
                children: "Loading moments..."
            }, void 0, false, {
                fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                lineNumber: 84,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
            lineNumber: 83,
            columnNumber: 7
        }, this);
    }
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-4 bg-red-900 border border-red-700 rounded-lg",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    className: "font-semibold text-red-100",
                    children: "Error loading data"
                }, void 0, false, {
                    fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                    lineNumber: 92,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-red-200",
                    children: error
                }, void 0, false, {
                    fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                    lineNumber: 93,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: refresh,
                    className: "mt-3 inline-flex items-center px-4 py-2 rounded bg-red-700 hover:bg-red-600",
                    children: "Retry"
                }, void 0, false, {
                    fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                    lineNumber: 94,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
            lineNumber: 91,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-start justify-between gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-xl font-semibold",
                                children: "Pending Reddit Moments"
                            }, void 0, false, {
                                fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                                lineNumber: 108,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-neutral-400",
                                children: "Review community-sourced hook suggestions and approve or reject them."
                            }, void 0, false, {
                                fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                                lineNumber: 109,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                        lineNumber: 107,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: refresh,
                        className: "px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700",
                        children: "Refresh"
                    }, void 0, false, {
                        fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                        lineNumber: 113,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                lineNumber: 106,
                columnNumber: 7
            }, this),
            moments.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-10 text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-lg font-medium",
                        children: "No moments to review"
                    }, void 0, false, {
                        fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                        lineNumber: 123,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-neutral-400",
                        children: "Approved or rejected items will appear here once new data arrives."
                    }, void 0, false, {
                        fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                        lineNumber: 124,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                lineNumber: 122,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "overflow-x-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                    className: "w-full border border-neutral-800 rounded-xl bg-neutral-900",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                            className: "bg-neutral-800",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-3 text-left",
                                        children: "Title"
                                    }, void 0, false, {
                                        fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                                        lineNumber: 131,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-3 text-left",
                                        children: "S/E"
                                    }, void 0, false, {
                                        fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                                        lineNumber: 132,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-3 text-left",
                                        children: "Min"
                                    }, void 0, false, {
                                        fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                                        lineNumber: 133,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-3 text-left",
                                        children: "Confidence"
                                    }, void 0, false, {
                                        fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                                        lineNumber: 134,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-3 text-left",
                                        children: "Quote"
                                    }, void 0, false, {
                                        fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                                        lineNumber: 135,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-3 text-left",
                                        children: "Source"
                                    }, void 0, false, {
                                        fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                                        lineNumber: 136,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-3 text-left",
                                        children: "Actions"
                                    }, void 0, false, {
                                        fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                                        lineNumber: 137,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                                lineNumber: 130,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                            lineNumber: 129,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$wigg$2f$apps$2f$wigg$2d$admin$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            children: moments.map((moment)=>renderRow(moment, approveMoment, rejectMoment))
                        }, void 0, false, {
                            fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                            lineNumber: 140,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                    lineNumber: 128,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
                lineNumber: 127,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/wigg/apps/wigg-admin/components/ModerationTable.tsx",
        lineNumber: 105,
        columnNumber: 5
    }, this);
}
}),
"[project]/wigg/apps/wigg-admin/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        if ("TURBOPACK compile-time truthy", 1) {
            if ("TURBOPACK compile-time truthy", 1) {
                module.exports = __turbopack_context__.r("[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)");
            } else //TURBOPACK unreachable
            ;
        } else //TURBOPACK unreachable
        ;
    }
} //# sourceMappingURL=module.compiled.js.map
}),
"[project]/wigg/apps/wigg-admin/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/wigg/apps/wigg-admin/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
"[project]/wigg/apps/wigg-admin/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/wigg/apps/wigg-admin/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].React; //# sourceMappingURL=react.js.map
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__60f496b8._.js.map
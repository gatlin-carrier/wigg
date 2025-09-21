module.exports = [
"[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/wigg/apps/wigg-admin/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "build/chunks/64b0e_3f7bcbbe._.js",
  "build/chunks/[root-of-the-server]__4913057e._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/wigg/apps/wigg-admin/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript)");
    });
});
}),
];
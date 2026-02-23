const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Monorepo root (two levels up from apps/mobile)
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// ─── Monorepo workspace resolution ───────────────────────────────
// Watch the entire monorepo so Metro picks up workspace packages
config.watchFolders = [monorepoRoot];

// Explicit source extensions (user requested explicit, added cjs/mjs for Supabase)
config.resolver.sourceExts = ["ts", "tsx", "js", "jsx", "json", "cjs", "mjs"];

// Enable symlinks for pnpm workspace linking
config.resolver.unstable_enableSymlinks = true;

// Resolve node_modules from both the app and the monorepo root
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(monorepoRoot, "node_modules"),
];

module.exports = withNativeWind(config, { input: "./src/global.css" });

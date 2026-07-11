"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatUptime = formatUptime;
function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

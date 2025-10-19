"use strict";
'server-only';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyGroup = exports.notifyTv = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const NOTIFICATION_DIR = path_1.default.join(process.cwd(), '.notifications');
const sendNotification = async (payload) => {
    try {
        await promises_1.default.mkdir(NOTIFICATION_DIR, { recursive: true });
        const fileName = path_1.default.join(NOTIFICATION_DIR, `notif-${Date.now()}-${Math.random()}.json`);
        await promises_1.default.writeFile(fileName, JSON.stringify(payload));
    }
    catch (error) {
        console.error('Failed to send WebSocket notification:', error);
    }
};
const notifyTv = (tvId) => {
    console.log(`Queueing notification for TV: ${tvId}`);
    return sendNotification({ type: 'tv', id: tvId });
};
exports.notifyTv = notifyTv;
const notifyGroup = (groupId) => {
    console.log(`Queueing notification for Group: ${groupId}`);
    return sendNotification({ type: 'group', id: groupId });
};
exports.notifyGroup = notifyGroup;

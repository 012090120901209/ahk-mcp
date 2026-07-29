/**
 * DAP (Debug Adapter Protocol) translator for AutoHotkey.
 *
 * Public entry points:
 *   - startDapServer(options) : starts a TCP server that speaks DAP and
 *     translates to the existing DBGpClient.
 *   - DapSession / DapFrameCodec : exported for tests and advanced hosts.
 */

export { startDapServer, DapFrameCodec, encodeDapFrame } from './dap-server.js';
export type { DapServerOptions, DapServerHandle } from './dap-server.js';
export { DapSession } from './dap-session.js';
export type { DapTransport } from './dap-session.js';
export * as DapTranslator from './translator.js';
export type * from './types.js';

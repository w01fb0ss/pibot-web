import { B as e, N as t, U as n, j as r } from "./bounded-raw-part-cache-CsnNptAy.js";
import { n as i } from "./abort-VrnK7mdP.js";
import { b as a } from "./worksheet-pull-client-ClvPO_Jf.js";
import { a as o } from "./model-source-kz_NkZqT.js";
import { t as s } from "./host-layout-DVMw8hDY.js";
//#region packages/xlsx/src/internal/worker-worksheet-source.ts
var c = [
	"open_sheet_cursor",
	"pull_sheet_cursor",
	"sheet_cursor_pull_finished",
	"acknowledge_sheet_cursor_terminal",
	"cancel_sheet_cursor",
	"close_sheet_cursor",
	"assert_healthy",
	"parse",
	"extract_image"
];
function l(e) {
	return o(e, "XLSX", c), e;
}
function u(e) {
	let [t] = Object.keys(e);
	if (t !== void 0) throw TypeError(`unsupported XLSX model source view default: ${t}`);
}
//#endregion
//#region packages/xlsx/src/internal/archive-bootstrap-source.ts
function d(t, n) {
	let r = t(), i = n();
	return {
		workbook: r,
		usage: i === void 0 ? void 0 : e(i)
	};
}
//#endregion
//#region packages/xlsx/src/internal/node-model-source-acquisition.ts
var f = "XLSX workbook session was aborted";
function p(e, o = {}) {
	let s;
	try {
		let n = a(o);
		if (!Number.isSafeInteger(e.sourceByteLength) || e.sourceByteLength < 0) throw RangeError("XLSX sourceByteLength must be a non-negative safe integer");
		let c = t(o);
		s = new r({
			enabled: c.debug || c.onResourceMetrics !== void 0,
			format: "xlsx",
			mode: "node",
			scope: "session",
			policy: c.policy,
			formatLimits: { xlsxWorksheetLimits: { ...n.worksheet } },
			onMetrics: c.onResourceMetrics,
			emitToConsole: c.debug
		}), s.setSourceBytes(e.sourceByteLength), i(o.signal, f);
		let l = e.archive, { workbook: u, usage: p } = d(() => JSON.parse(new TextDecoder().decode(l.parse())), () => l.resource_usage?.());
		return e.layoutMetrics && (u.layoutMetrics = { maximumDigitWidth: e.layoutMetrics.maximumDigitWidth }), s.observeUsage(p), s.checkpoint("workbook index ready"), {
			archive: l,
			workbookIndex: u,
			usage: p,
			metrics: s,
			worksheetPolicy: n,
			closeArchive: () => e.closeArchive()
		};
	} catch (t) {
		try {
			e.closeArchive();
		} catch {}
		let r = n(t) ?? t;
		throw s?.fail(r), r;
	}
}
//#endregion
export { p as acquireXlsxSessionFromArchive, s as configureHostLayout, l as validateXlsxModelSourceArchive, u as validateXlsxModelSourceViewDefaults };

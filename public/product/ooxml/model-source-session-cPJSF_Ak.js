import { a as e } from "./slide-pull-client-tq7U_fYg.js";
import { H as t, N as n, j as r } from "./bounded-raw-part-cache-CsnNptAy.js";
import { n as i } from "./abort-VrnK7mdP.js";
import { a } from "./model-source-kz_NkZqT.js";
//#region packages/pptx/src/internal/worker-presentation-source.ts
var o = [
	"pull_slide",
	"slide_cursor_resource_usage",
	"acknowledge_slide",
	"cancel_slide",
	"close_presentation_session",
	"assert_healthy",
	"presentation_bootstrap",
	"extract_image"
];
function s(e) {
	return a(e, "PPTX", o), e;
}
function c(e) {
	let [t] = Object.keys(e);
	if (t !== void 0) throw TypeError(`unsupported PPTX model source view default: ${t}`);
}
//#endregion
//#region packages/pptx/src/internal/node-session-acquisition.ts
var l = "PPTX presentation session was aborted";
function u(a, o = {}, s) {
	let c = !1, u = () => {
		c || (c = !0, a.closeArchive());
	}, d = s;
	try {
		if (!Number.isSafeInteger(a.sourceByteLength) || a.sourceByteLength < 0) throw RangeError("PPTX sourceByteLength must be a non-negative safe integer");
		let t = n(o);
		d ??= new r({
			enabled: t.debug || t.onResourceMetrics !== void 0,
			format: "pptx",
			mode: "node",
			scope: "session",
			policy: t.policy,
			onMetrics: t.onResourceMetrics,
			emitToConsole: t.debug
		}), s || d.setSourceBytes(a.sourceByteLength), i(o.signal, l);
		let c = e(JSON.parse(new TextDecoder().decode(a.archive.presentation_bootstrap())));
		return i(o.signal, l), d.checkpoint("presentation bootstrap ready"), {
			archive: a.archive,
			bootstrap: c,
			metrics: d,
			closeArchive: u
		};
	} catch (e) {
		try {
			u();
		} catch {}
		let n = t(e) ?? e;
		throw d?.fail(n), n;
	}
}
//#endregion
export { u as acquirePptxSessionFromArchive, s as validatePptxModelSourceArchive, c as validatePptxModelSourceViewDefaults };

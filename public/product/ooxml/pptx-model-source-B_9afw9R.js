import { qt as e } from "./bounded-raw-part-cache-CsnNptAy.js";
import { n as t } from "./session-XPmC0CUd.js";
import { t as n } from "./pptx-CaJ6ILnw.js";
import { t as r } from "./model-source-s5hRpk4w.js";
//#region packages/node/src/pptx-model-source.ts
async function i(t, r, i) {
	let o = await a(t, r, i), s = new Proxy(o.archive, { get(e, t) {
		if (t === "extract_media" && !e.extract_media) return () => {
			throw Error("media extraction is unsupported for this source");
		};
		let n = Reflect.get(e, t);
		return typeof n == "function" ? n.bind(e) : n;
	} });
	return new n(o.closeArchive, s, o.bootstrap, o.metrics, r.signal, e(r.cjkFallback));
}
async function a(e, n, i) {
	let { acquirePptxSessionFromArchive: a, validatePptxModelSourceArchive: o, validatePptxModelSourceViewDefaults: s } = await import("./model-source-session-cPJSF_Ak.js"), c = await r(e, "pptx", {
		...n,
		source: n.legacyPpt
	}, o);
	if (c.kind === "ooxml") return t(c.bytes, i(), n);
	try {
		s(c.opened.viewDefaults);
	} catch (e) {
		try {
			c.opened.close();
		} catch {}
		throw e;
	}
	return a({
		archive: c.opened.archive,
		sourceByteLength: c.sourceByteLength,
		closeArchive: c.opened.close
	}, n);
}
//#endregion
export { i as openPptxSource };

import { t as e } from "./cfb-guard-dNeUiANF.js";
import { U as t } from "./bounded-raw-part-cache-CsnNptAy.js";
import { i as n, n as r, o as i } from "./model-source-kz_NkZqT.js";
//#region packages/node/src/model-source.ts
async function a(a, s, c, l, u = (e) => t(e) ?? e) {
	let d = a instanceof Uint8Array ? a : new Uint8Array(a), f = c.source === void 0 ? void 0 : i([c.source], s, d);
	if (!f) return {
		kind: "ooxml",
		bytes: await e(d, c.password)
	};
	let p = r(f, s);
	try {
		let e = await n(p.module, d, l, c.signal, p.transfer);
		try {
			p.release();
		} catch (t) {
			try {
				e.close();
			} catch {}
			throw t;
		}
		return {
			kind: "model-source",
			opened: {
				...e,
				archive: o(e.archive, u),
				close() {
					try {
						e.close();
					} catch (e) {
						throw u(e);
					}
				}
			},
			sourceByteLength: d.byteLength
		};
	} catch (e) {
		throw u(e);
	} finally {
		p.release();
	}
}
function o(e, t) {
	let n = e;
	return new Proxy(Object.create(n), { get(e, r) {
		try {
			let e = Reflect.get(n, r, n);
			return typeof e == "function" ? (...r) => {
				try {
					return Reflect.apply(e, n, r);
				} catch (e) {
					throw t(e);
				}
			} : e;
		} catch (e) {
			throw t(e);
		}
	} });
}
//#endregion
export { a as t };

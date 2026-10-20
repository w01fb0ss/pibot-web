import { yo as e } from "./plot-area-frame-Bs_j4uu7.js";
import { B as t, D as n, G as r, O as i, k as a } from "./bounded-raw-part-cache-CsnNptAy.js";
import { S as o, b as s, c, d as l, f as u, g as d, i as f, p, u as m, y as h } from "./worksheet-pull-client-ClvPO_Jf.js";
import { t as g } from "./grid-geometry-C3IG20ut.js";
import { o as _, t as v } from "./xlsx-DmHfeNNp.js";
import { t as y } from "./model-source-s5hRpk4w.js";
//#region packages/xlsx/src/worksheet-pull-source-worker.ts
var b = 64 * 1024 * 1024, x = class {
	archive;
	acceptWorksheet;
	executeArchive;
	prepareRows;
	provisional;
	worksheetPolicy;
	coordinator = new a();
	sessions = /* @__PURE__ */ new Map();
	operationTail = Promise.resolve();
	pendingOpens = /* @__PURE__ */ new Map();
	resourceFailure;
	constructor(e, t, n = (e) => e(this.requireArchive()), r, i, a = () => h) {
		this.archive = e, this.acceptWorksheet = t, this.executeArchive = n, this.prepareRows = r, this.provisional = i, this.worksheetPolicy = a;
	}
	reserveOpen(e) {
		this.pendingOpens.set(e.sessionId, {
			identity: e,
			canceled: !1
		});
	}
	abandonOpen(e) {
		this.pendingOpens.delete(e);
	}
	get pendingOpenCount() {
		return this.pendingOpens.size;
	}
	runDuringPull(t) {
		return this.sessions.size === 0 ? this.run(t) : this.coordinator.enqueue(async () => {
			if (this.resourceFailure) throw this.resourceFailure;
			try {
				return t();
			} catch (t) {
				throw t instanceof e && (this.resourceFailure ??= t), t;
			}
		});
	}
	async open(t, n, r) {
		if (this.resourceFailure) throw this.resourceFailure;
		let a = this.pendingOpens.get(r.sessionId);
		if (!a || a.identity.operationId !== r.operationId || a.identity.generation !== r.generation) throw Error("worksheet pull session open reservation is stale or missing");
		let s = this.worksheetPolicy(), h, g = new Promise((e) => {
			h = e;
		}), _ = this.operationTail.then(() => this.coordinator.enqueue(async () => {
			if (a.canceled) throw Error("worksheet pull session open was canceled");
			this.executeArchive((e) => e.open_sheet_cursor(t, n));
			let g = [], _ = {
				rows: 0,
				cells: 0,
				ownedUtf8Bytes: 0
			}, v, y = !1, x = new i({
				...r,
				maxByteCredit: b,
				coordinator: this.coordinator,
				driver: {
					pull: () => {
						let n = this.executeArchive((e) => e.pull_sheet_cursor(128)), r = this.executeArchive((e) => e.sheet_cursor_pull_finished());
						if (this.acceptWorksheet) {
							let i = f(n, r, void 0, this.prepareRows);
							try {
								if (i.kind === "preview") i.worksheet && (i.worksheet.rows = g, d(i.worksheet, s), this.provisional?.preview(t, i.worksheet));
								else if (i.kind === "rows") {
									let e = c(_, p(i.rows, s), s);
									l(e, "get-worksheet-worker", void 0, this.readResourceUsage(), s), g.push(...i.rows), _ = e;
								} else i.kind === "finished" && (v = i.worksheet);
							} catch (t) {
								throw t instanceof e && (this.resourceFailure ??= t), t;
							}
						}
						y = r;
						let i = o(n);
						return {
							payload: i,
							byteLength: i.byteLength,
							done: r,
							transfer: [i]
						};
					},
					measureChunk: ({ payload: e }) => e.byteLength,
					acknowledge: () => {
						if (!y) return;
						let n, i;
						try {
							if (this.acceptWorksheet) {
								if (!v) throw Error("worksheet terminal payload is missing");
								v.rows = v.parseError ? [] : g;
								let e = v.parseError ? {
									rows: 0,
									cells: 0,
									ownedUtf8Bytes: 0
								} : _, r = u(v, e, s), a = this.readResourceUsage();
								l(r, "get-worksheet-worker", void 0, a, s), m(r.jsonBytes, "get-worksheet-worker", void 0, a, s), d(v, s);
								let o = this.acceptWorksheet(t, v, r, a);
								typeof o == "function" ? n = o : o && ({rollback: n, commit: i} = o);
							}
							this.executeArchive((e) => e.acknowledge_sheet_cursor_terminal()), i?.();
						} catch (t) {
							throw n?.(), t instanceof e && (this.resourceFailure ??= t), t;
						}
						y = !1, this.sessions.delete(r.sessionId), this.provisional?.stop(t), h();
					},
					cancel: () => {
						try {
							this.archive() && this.executeArchive((e) => e.cancel_sheet_cursor());
						} finally {
							this.sessions.delete(r.sessionId), this.provisional?.stop(t), h();
						}
					},
					close: () => {
						try {
							this.archive() && this.executeArchive((e) => e.close_sheet_cursor());
						} finally {
							this.sessions.delete(r.sessionId), this.provisional?.stop(t), h();
						}
					},
					resourceUsage: () => this.readResourceUsage()
				}
			});
			this.sessions.set(r.sessionId, {
				host: x,
				identity: r
			}), this.pendingOpens.delete(r.sessionId);
		}));
		this.operationTail = _.then(() => g, () => void 0);
		try {
			await _;
		} catch (e) {
			throw this.pendingOpens.delete(r.sessionId), h(), e;
		}
	}
	async postOpenedSafely(e, t, n) {
		try {
			t();
		} catch (t) {
			await this.closeIdentity(e);
			try {
				n(t);
			} catch {}
		}
	}
	dispatch(e, t) {
		let i = this.sessions.get(e.sessionId);
		if (i) return i.host.dispatch(e, t);
		let a = this.pendingOpens.get(e.sessionId);
		if (a && (e.kind === "cancel" || e.kind === "close")) {
			let r = a.identity.operationId === e.operationId && a.identity.generation === e.generation;
			return r && (a.canceled = !0), t(r ? {
				protocol: n,
				kind: "accepted",
				sessionId: e.sessionId,
				operationId: e.operationId,
				generation: e.generation,
				requestId: e.requestId,
				command: e.kind
			} : {
				protocol: n,
				kind: "error",
				sessionId: e.sessionId,
				operationId: e.operationId,
				generation: e.generation,
				requestId: e.requestId,
				error: {
					message: "stale lifecycle targets another pending worksheet operation",
					errorName: "PullSessionProtocolError",
					code: "ooxml-stale-lifecycle"
				}
			}), Promise.resolve();
		}
		return e.kind === "cancel" || e.kind === "close" ? (t({
			protocol: n,
			kind: "accepted",
			sessionId: e.sessionId,
			operationId: e.operationId,
			generation: e.generation,
			requestId: e.requestId,
			command: e.kind
		}), Promise.resolve()) : (t({
			protocol: n,
			kind: "error",
			sessionId: e.sessionId,
			operationId: e.operationId,
			generation: e.generation,
			requestId: e.requestId,
			error: r(/* @__PURE__ */ Error("worksheet pull session is not open"))
		}), Promise.resolve());
	}
	async dispatchSafely(e, t) {
		try {
			await this.dispatch(e, t);
		} catch (i) {
			try {
				t({
					protocol: n,
					kind: "error",
					sessionId: e.sessionId,
					operationId: e.operationId,
					generation: e.generation,
					requestId: e.requestId,
					error: r(i)
				});
			} catch {}
		}
	}
	run(t) {
		let n = this.operationTail.then(() => this.coordinator.enqueue(async () => {
			if (this.resourceFailure) throw this.resourceFailure;
			return t();
		})).catch((t) => {
			throw t instanceof e && (this.resourceFailure ??= t), t;
		});
		return this.operationTail = n.then(() => void 0, () => void 0), n;
	}
	async reset() {
		for (let e of this.pendingOpens.values()) e.canceled = !0;
		let e = 1;
		for (let { host: t, identity: r } of [...this.sessions.values()]) await t.dispatch({
			protocol: n,
			kind: "close",
			...r,
			requestId: e++
		}, () => void 0);
		this.sessions.clear(), await this.operationTail, this.pendingOpens.clear(), this.resourceFailure = void 0;
	}
	requireArchive() {
		let e = this.archive();
		if (!e) throw Error("Workbook not loaded");
		return e;
	}
	async closeIdentity(e) {
		let t = this.sessions.get(e.sessionId);
		if (t) {
			await t.host.dispatch({
				protocol: n,
				kind: "close",
				...e,
				requestId: 1
			}, () => void 0);
			return;
		}
		let r = this.pendingOpens.get(e.sessionId);
		r && r.identity.operationId === e.operationId && r.identity.generation === e.generation && (r.canceled = !0);
	}
	readResourceUsage() {
		let e = this.executeArchive((e) => e.sheet_cursor_resource_usage?.());
		return e === void 0 ? void 0 : t(e);
	}
};
//#endregion
//#region packages/node/src/xlsx-model-source.ts
async function S(e, t, n) {
	return new C(await w(e, t, n), t.signal);
}
var C = class extends v {
	constructor(e, t) {
		super(e.closeArchive, e.archive, e.workbookIndex, e.metrics, e.usage, t, e.worksheetPolicy);
		let n = e.worksheetPolicy;
		this.pull = new x(() => e.archive, void 0, void 0, void 0, void 0, () => n);
	}
	async *worksheetRows(e) {
		for await (let t of super.worksheetRows(e)) {
			if (t.kind === "finished") {
				let e = this.workbookIndex.layoutMetrics?.maximumDigitWidth;
				e !== void 0 && g.forWorksheet(t.worksheet, e);
			}
			yield t;
		}
	}
};
async function w(e, t, n) {
	let r = s(t), i = {
		...t,
		xlsxWorksheetLimits: r.worksheet
	}, { acquireXlsxSessionFromArchive: a, configureHostLayout: o, validateXlsxModelSourceArchive: c, validateXlsxModelSourceViewDefaults: l } = await import("./model-source-session-6fuaqbGs.js"), u = await y(e, "xlsx", {
		...i,
		source: i.legacyXls
	}, c);
	if (u.kind === "ooxml") return _(u.bytes, n(), i);
	let { opened: d } = u, f;
	try {
		if (l(d.viewDefaults), f = await o(d.archive, async (e) => {
			if (!t.factory) return;
			let { measureHostLayoutFont: n } = await import("./host-layout-measure-DsuQ2UJs.js"), r = t.factory.createCanvas(1, 1).getContext("2d");
			return r ? n(e, r) : void 0;
		}), t.signal?.aborted) {
			let e = /* @__PURE__ */ Error("XLSX workbook session was aborted");
			throw e.name = "AbortError", e;
		}
	} catch (e) {
		try {
			d.close();
		} catch {}
		throw e;
	}
	return a({
		archive: d.archive,
		sourceByteLength: u.sourceByteLength,
		...f === void 0 ? {} : { layoutMetrics: { maximumDigitWidth: f } },
		closeArchive: d.close
	}, i);
}
//#endregion
export { S as openXlsxSource };

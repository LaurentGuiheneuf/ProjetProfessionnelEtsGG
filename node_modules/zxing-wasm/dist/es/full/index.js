import { A as e, C as t, D as n, E as r, F as i, I as a, L as o, M as s, N as c, O as l, P as u, S as d, T as f, _ as p, a as m, b as h, c as g, d as _, f as v, g as y, h as ee, i as te, j as ne, k as re, l as ie, m as ae, n as oe, o as b, p as se, r as ce, s as le, t as ue, u as de, v as fe, w as pe, x as me, y as x } from "../share.js";
//#region src/full/zxing_full.js
function he(e, t, n) {
	return t in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
async function S() {
	let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
	var t, n, r, i = e, a = !!globalThis.window, o = !!globalThis.WorkerGlobalScope;
	(n = globalThis.process) != null && (t = n.versions) != null && t.node && ((r = globalThis.process) == null || r.type);
	var s = "./this.program", c = (e, t) => {
		throw t;
	}, l = void 0, u = "";
	function d(e) {
		return i.locateFile ? i.locateFile(e, u) : u + e;
	}
	var f, p;
	if (a || o || typeof fetch == "function") {
		try {
			u = new URL(".", l).href;
		} catch {}
		o && (p = (e) => {
			var t = new XMLHttpRequest();
			return t.open("GET", e, !1), t.responseType = "arraybuffer", t.send(null), new Uint8Array(t.response);
		}), f = async (e) => {
			var t = await fetch(e, { credentials: "same-origin" });
			if (t.ok) return t.arrayBuffer();
			throw Error(t.status + " : " + t.url);
		};
	}
	var m = console.log.bind(console), h = console.error.bind(console), g, _ = !1, v;
	class y {}
	class ee extends y {
		constructor(e) {
			super(), this.excPtr = e;
		}
	}
	function te() {
		return wr.buffer;
	}
	function ne() {
		var e;
		if (!(x != null && (e = x.buffer) != null && e.resizable)) {
			var t = te();
			x = new Int8Array(t), an = new Int16Array(t), i.HEAPU8 = A = new Uint8Array(t), G = new Uint16Array(t), K = new Int32Array(t), O = new Uint32Array(t), $t = new Float32Array(t), en = new Float64Array(t);
		}
	}
	function re() {
		var e = i.preRun;
		e && (typeof e == "function" && (e = [e]), ge.push(...e)), S(ge);
	}
	function ie() {
		$.Ia();
	}
	function ae() {
		var e = i.postRun;
		e && (typeof e == "function" && (e = [e]), C.push(...e)), S(C);
	}
	function oe(e) {
		var t;
		throw (t = i.onAbort) == null || t.call(i, e), e = `Aborted(${e})`, h(e), _ = !0, e += ". Build with -sASSERTIONS for more info.", new WebAssembly.RuntimeError(e);
	}
	var b;
	function se() {
		return d("zxing_full.wasm");
	}
	function ce(e) {
		if (e == b && g) return new Uint8Array(g);
		if (p) return p(e);
		throw "both async and sync fetching of the wasm failed";
	}
	async function le(e) {
		if (!g) try {
			var t = await f(e);
			return new Uint8Array(t);
		} catch {}
		return ce(e);
	}
	async function ue(e, t) {
		try {
			var n = await le(e);
			return await WebAssembly.instantiate(n, t);
		} catch (e) {
			h(`failed to asynchronously prepare wasm: ${e}`), oe(e);
		}
	}
	async function de(e, t, n) {
		if (!e) try {
			var r = fetch(t, { credentials: "same-origin" });
			return await WebAssembly.instantiateStreaming(r, n);
		} catch (e) {
			h(`wasm streaming compile failed: ${e}`), h("falling back to ArrayBuffer instantiation");
		}
		return ue(t, n);
	}
	function fe() {
		return { a: Dr };
	}
	async function pe() {
		function e(e) {
			return $ = e.exports, Er($), ne(), $;
		}
		function t(t) {
			return e(t.instance);
		}
		var n = fe(), r = i.instantiateWasm;
		return r ? new Promise((t) => {
			r(n, (n) => t(e(n)));
		}) : (b != null || (b = se()), t(await de(g, b, n)));
	}
	class me {
		constructor(e) {
			he(this, "name", "ExitStatus"), this.message = `Program terminated with exit(${e})`, this.status = e;
		}
	}
	var x, S = (e) => {
		for (; e.length > 0;) e.shift()(i);
	}, C = [], ge = [], _e = !0, w = (e) => _r(e), T = () => yr(), ve = [], E = (e) => {
		var t = ve[e];
		return t || (ve[e] = t = Tr.get(e)), t;
	}, ye = (e, t) => E(e)(t), D = [], be = 0, O;
	class xe {
		set_type(e) {
			O[this.ptr + 4 >> 2] = e;
		}
		get_type() {
			return O[this.ptr + 4 >> 2];
		}
		set_destructor(e) {
			O[this.ptr + 8 >> 2] = e;
		}
		get_destructor() {
			return O[this.ptr + 8 >> 2];
		}
		set_caught(e) {
			e = +!!e, x[this.ptr + 12] = e;
		}
		get_caught() {
			return x[this.ptr + 12] != 0;
		}
		set_rethrown(e) {
			e = +!!e, x[this.ptr + 13] = e;
		}
		get_rethrown() {
			return x[this.ptr + 13] != 0;
		}
		init(e, t) {
			this.set_adjusted_ptr(0), this.set_type(e), this.set_destructor(t);
		}
		set_adjusted_ptr(e) {
			O[this.ptr + 16 >> 2] = e;
		}
		get_adjusted_ptr() {
			return O[this.ptr + 16 >> 2];
		}
		constructor(e) {
			this.excPtr = e, this.ptr = e - 24;
		}
	}
	var Se = (e) => {
		var t = new xe(e);
		return t.get_caught() || (t.set_caught(!0), be--), t.set_rethrown(!1), D.push(t), mr(e);
	}, k = null, Ce = () => {
		Q(0, 0);
		var e = D.pop();
		br(e.excPtr), k = null;
	}, we = (e) => gr(e), Te = (e) => {
		var t = k == null ? void 0 : k.excPtr;
		if (!t) return we(0), 0;
		var n = new xe(t);
		n.set_adjusted_ptr(t);
		var r = n.get_type();
		if (!r) return we(0), t;
		for (var i of e) {
			if (!i || i === r) break;
			var a = n.ptr + 16;
			if (Sr(i, r, a)) return we(i), t;
		}
		return we(r), t;
	}, Ee = () => Te([]), De = (e) => Te([e]), Oe = (e, t) => Te([e, t]), ke = (e) => {
		throw e;
	}, Ae = () => {
		D.length || oe("no exception to throw");
		var e = D[D.length - 1], t = e.excPtr;
		e.set_rethrown(!0), e.set_caught(!1), be++, xr(t), t = k = new ee(t), ke(t);
	}, je = (e, t, n) => {
		new xe(e).init(t, n), xr(e), e = k = new ee(e), be++, ke(e);
	}, Me = () => be, Ne = (e) => {
		throw e;
	}, Pe = (e) => {
		e = k == null ? k = new ee(e) : k, Ne(e);
	}, Fe = globalThis.TextDecoder && new TextDecoder(), Ie = (e, t, n, r) => {
		var i = t + n;
		if (r) return i;
		for (; e[t] && !(t >= i);) ++t;
		return t;
	}, Le = function(e) {
		let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0, n = arguments.length > 2 ? arguments[2] : void 0, r = arguments.length > 3 ? arguments[3] : void 0;
		var i = Ie(e, t, n, r);
		if (i - t > 16 && e.buffer && Fe) return Fe.decode(e.subarray(t, i));
		for (var a = ""; t < i;) {
			var o = e[t++];
			if (!(o & 128)) {
				a += String.fromCharCode(o);
				continue;
			}
			var s = e[t++] & 63;
			if ((o & 224) == 192) {
				a += String.fromCharCode((o & 31) << 6 | s);
				continue;
			}
			var c = e[t++] & 63;
			if (o = (o & 240) == 224 ? (o & 15) << 12 | s << 6 | c : (o & 7) << 18 | s << 12 | c << 6 | e[t++] & 63, o < 65536) a += String.fromCharCode(o);
			else {
				var l = o - 65536;
				a += String.fromCharCode(55296 | l >> 10, 56320 | l & 1023);
			}
		}
		return a;
	}, A, Re = (e, t, n) => e ? Le(A, e, t, n) : "";
	function ze(e, t, n) {
		return 0;
	}
	function Be(e, t, n) {
		return 0;
	}
	var Ve = (e, t, n) => {};
	function He(e, t, n, r) {}
	var Ue = (e, t) => {}, We = () => oe(""), Ge = {}, Ke = (e) => {
		for (; e.length;) {
			var t = e.pop();
			e.pop()(t);
		}
	};
	function j(e) {
		return this.fromWireType(O[e >> 2]);
	}
	var M = {}, N = {}, qe = {};
	class Je extends Error {
		constructor(e) {
			super(e), this.name = "InternalError";
		}
	}
	var Ye = (e) => {
		throw new Je(e);
	}, P = (e, t, n) => {
		e.forEach((e) => qe[e] = t);
		function r(t) {
			var r = n(t);
			r.length !== e.length && Ye("Mismatched type converter count");
			for (var i = 0; i < e.length; ++i) R(e[i], r[i]);
		}
		var i = Array(t.length), a = [], o = 0;
		for (let [e, n] of t.entries()) N.hasOwnProperty(n) ? i[e] = N[n] : (a.push(n), M.hasOwnProperty(n) || (M[n] = []), M[n].push(() => {
			i[e] = N[n], ++o, o === a.length && r(i);
		}));
		a.length === 0 && r(i);
	}, Xe = (e) => vr(e), Ze = (e, t) => A.fill(0, e, e + t), Qe = (e) => {
		var t = Ge[e];
		delete Ge[e];
		var n = t.rawConstructor, r = t.rawDestructor, i = t.valueSize, a = t.isTrivial, o = t.fields, s = o.map((e) => e.getterReturnType).concat(o.map((e) => e.setterArgumentType));
		P([e], s, (e) => {
			var s = {};
			for (var [c, l] of o.entries()) {
				let t = e[c], n = l.getter, r = l.getterContext, i = e[c + o.length], a = l.setter, d = l.setterContext;
				var u = i.destructorFunction === null && !i.argStackAlloc ? (e, t) => a(d, e, i.toWireType(null, t)) : (e, t) => {
					var n = [];
					a(d, e, i.toWireType(n, t)), Ke(n);
				};
				s[l.fieldName] = {
					read: (e) => t.fromWireType(n(r, e)),
					write: u,
					optional: t.optional
				};
			}
			return [{
				name: t.name,
				fromWireType: (e) => {
					var t = {};
					for (var n in s) t[n] = s[n].read(e);
					return r(e), t;
				},
				toWireType: (e, t) => {
					for (var o in s) if (!(o in t) && !s[o].optional) throw TypeError(`Missing field: "${o}"`);
					var c;
					for (o in a && !e ? (c = Xe(i), Ze(c, i)) : (c = n(), e && e.push(r, c)), s) s[o].write(c, t[o]);
					return c;
				},
				readValueFromPointer: j,
				destructorFunction: a ? null : r,
				argStackAlloc: a
			}];
		});
	}, $e = (e, t, n, r, i) => {}, F = (e) => {
		for (var t = "";;) {
			var n = A[e++];
			if (!n) return t;
			t += String.fromCharCode(n);
		}
	};
	class I extends Error {
		constructor(e) {
			super(e), this.name = "BindingError";
		}
	}
	var L = (e) => {
		throw new I(e);
	};
	function et(e, t) {
		let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
		var r = t.name;
		if (e || L(`type "${r}" must have a positive integer typeid pointer`), N.hasOwnProperty(e)) {
			if (n.ignoreDuplicateRegistrations) return;
			L(`Cannot register type '${r}' twice`);
		}
		if (N[e] = t, delete qe[e], M.hasOwnProperty(e)) {
			var i = M[e];
			delete M[e], i.forEach((e) => e());
		}
	}
	function R(e, t) {
		return et(e, t, arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {});
	}
	var tt = (e, t, n, r) => {
		t = F(t), R(e, {
			name: t,
			fromWireType: function(e) {
				return !!e;
			},
			toWireType: function(e, t) {
				return t ? n : r;
			},
			readValueFromPointer: function(e) {
				return this.fromWireType(A[e]);
			},
			destructorFunction: null
		});
	}, nt = (e) => ({
		count: e.count,
		deleteScheduled: e.deleteScheduled,
		preservePointerOnDelete: e.preservePointerOnDelete,
		ptr: e.ptr,
		ptrType: e.ptrType,
		smartPtr: e.smartPtr,
		smartPtrType: e.smartPtrType
	}), rt = (e) => {
		function t(e) {
			return e.$$.ptrType.registeredClass.name;
		}
		L(t(e) + " instance already deleted");
	}, it = !1, at = (e) => {}, ot = (e) => {
		e.smartPtr ? e.smartPtrType.rawDestructor(e.smartPtr) : e.ptrType.registeredClass.rawDestructor(e.ptr);
	}, st = (e) => {
		--e.count.value, e.count.value === 0 && ot(e);
	}, z = (e) => globalThis.FinalizationRegistry ? (it = new FinalizationRegistry((e) => {
		st(e.$$);
	}), z = (e) => {
		var t = e.$$;
		if (t.smartPtr) {
			var n = { $$: t };
			it.register(e, n, e);
		}
		return e;
	}, at = (e) => it.unregister(e), z(e)) : (z = (e) => e, e), ct = [], lt = () => {
		for (; ct.length;) {
			var e = ct.pop();
			e.$$.deleteScheduled = !1, e.delete();
		}
	}, ut, dt = () => {
		let e = ft.prototype;
		Object.assign(e, {
			isAliasOf(e) {
				if (!(this instanceof ft) || !(e instanceof ft)) return !1;
				var t = this.$$.ptrType.registeredClass, n = this.$$.ptr;
				e.$$ = e.$$;
				for (var r = e.$$.ptrType.registeredClass, i = e.$$.ptr; t.baseClass;) n = t.upcast(n), t = t.baseClass;
				for (; r.baseClass;) i = r.upcast(i), r = r.baseClass;
				return t === r && n === i;
			},
			clone() {
				if (this.$$.ptr || rt(this), this.$$.preservePointerOnDelete) return this.$$.count.value += 1, this;
				var e = z(Object.create(Object.getPrototypeOf(this), { $$: { value: nt(this.$$) } }));
				return e.$$.count.value += 1, e.$$.deleteScheduled = !1, e;
			},
			delete() {
				this.$$.ptr || rt(this), this.$$.deleteScheduled && !this.$$.preservePointerOnDelete && L("Object already scheduled for deletion"), at(this), st(this.$$), this.$$.preservePointerOnDelete || (this.$$.smartPtr = void 0, this.$$.ptr = void 0);
			},
			isDeleted() {
				return !this.$$.ptr;
			},
			deleteLater() {
				return this.$$.ptr || rt(this), this.$$.deleteScheduled && !this.$$.preservePointerOnDelete && L("Object already scheduled for deletion"), ct.push(this), ct.length === 1 && ut && ut(lt), this.$$.deleteScheduled = !0, this;
			}
		});
		let t = Symbol.dispose;
		t && (e[t] = e.delete);
	};
	function ft() {}
	var pt = (e, t) => Object.defineProperty(t, "name", { value: e }), mt = {}, ht = (e, t, n) => {
		if (e[t].overloadTable === void 0) {
			var r = e[t];
			e[t] = function() {
				var r = [...arguments];
				return e[t].overloadTable.hasOwnProperty(r.length) || L(`Function '${n}' called with an invalid number of arguments (${r.length}) - expects one of (${e[t].overloadTable})!`), e[t].overloadTable[r.length].apply(this, r);
			}, e[t].overloadTable = [], e[t].overloadTable[r.argCount] = r;
		}
	}, gt = (e, t, n) => {
		i.hasOwnProperty(e) ? ((n === void 0 || i[e].overloadTable !== void 0 && i[e].overloadTable[n] !== void 0) && L(`Cannot register public name '${e}' twice`), ht(i, e, e), i[e].overloadTable.hasOwnProperty(n) && L(`Cannot register multiple overloads of a function with the same number of arguments (${n})!`), i[e].overloadTable[n] = t) : (i[e] = t, i[e].argCount = n);
	}, _t = 48, vt = 57, yt = (e) => {
		e = e.replace(/[^a-zA-Z0-9_]/g, "$");
		var t = e.charCodeAt(0);
		return t >= _t && t <= vt ? `_${e}` : e;
	};
	function bt(e, t, n, r, i, a, o, s) {
		this.name = e, this.constructor = t, this.instancePrototype = n, this.rawDestructor = r, this.baseClass = i, this.getActualType = a, this.upcast = o, this.downcast = s, this.pureVirtualFunctions = [];
	}
	var xt = (e, t, n) => {
		for (; t !== n;) t.upcast || L(`Expected null or instance of ${n.name}, got an instance of ${t.name}`), e = t.upcast(e), t = t.baseClass;
		return e;
	}, St = (e) => {
		if (e === null) return "null";
		var t = typeof e;
		return t === "object" || t === "array" || t === "function" ? e.toString() : "" + e;
	};
	function Ct(e, t) {
		if (t === null) return this.isReference && L(`null is not a valid ${this.name}`), 0;
		t.$$ || L(`Cannot pass "${St(t)}" as a ${this.name}`), t.$$.ptr || L(`Cannot pass deleted object as a pointer of type ${this.name}`);
		var n = t.$$.ptrType.registeredClass;
		return xt(t.$$.ptr, n, this.registeredClass);
	}
	function wt(e, t) {
		var n;
		if (t === null) return this.isReference && L(`null is not a valid ${this.name}`), this.isSmartPointer ? (n = this.rawConstructor(), e !== null && e.push(this.rawDestructor, n), n) : 0;
		(!t || !t.$$) && L(`Cannot pass "${St(t)}" as a ${this.name}`), t.$$.ptr || L(`Cannot pass deleted object as a pointer of type ${this.name}`), !this.isConst && t.$$.ptrType.isConst && L(`Cannot convert argument of type ${t.$$.smartPtrType ? t.$$.smartPtrType.name : t.$$.ptrType.name} to parameter type ${this.name}`);
		var r = t.$$.ptrType.registeredClass;
		if (n = xt(t.$$.ptr, r, this.registeredClass), this.isSmartPointer) switch (t.$$.smartPtr === void 0 && L("Passing raw pointer to smart pointer is illegal"), this.sharingPolicy) {
			case 0:
				t.$$.smartPtrType === this ? n = t.$$.smartPtr : L(`Cannot convert argument of type ${t.$$.smartPtrType ? t.$$.smartPtrType.name : t.$$.ptrType.name} to parameter type ${this.name}`);
				break;
			case 1:
				n = t.$$.smartPtr;
				break;
			case 2:
				if (t.$$.smartPtrType === this) n = t.$$.smartPtr;
				else {
					var i = t.clone();
					n = this.rawShare(n, W.toHandle(() => i.delete())), e !== null && e.push(this.rawDestructor, n);
				}
				break;
			default: L("Unsupported sharing policy");
		}
		return n;
	}
	function Tt(e, t) {
		if (t === null) return this.isReference && L(`null is not a valid ${this.name}`), 0;
		t.$$ || L(`Cannot pass "${St(t)}" as a ${this.name}`), t.$$.ptr || L(`Cannot pass deleted object as a pointer of type ${this.name}`), t.$$.ptrType.isConst && L(`Cannot convert argument of type ${t.$$.ptrType.name} to parameter type ${this.name}`);
		var n = t.$$.ptrType.registeredClass;
		return xt(t.$$.ptr, n, this.registeredClass);
	}
	var Et = (e, t, n) => {
		if (t === n) return e;
		if (n.baseClass === void 0) return null;
		var r = Et(e, t, n.baseClass);
		return r === null ? null : n.downcast(r);
	}, Dt = {}, Ot = (e, t) => {
		for (t === void 0 && L("ptr should not be undefined"); e.baseClass;) t = e.upcast(t), e = e.baseClass;
		return t;
	}, kt = (e, t) => (t = Ot(e, t), Dt[t]), At = (e, t) => ((!t.ptrType || !t.ptr) && Ye("makeClassHandle requires ptr and ptrType"), !!t.smartPtrType != !!t.smartPtr && Ye("Both smartPtrType and smartPtr must be specified"), t.count = { value: 1 }, z(Object.create(e, { $$: {
		value: t,
		writable: !0
	} })));
	function jt(e) {
		var t = this.getPointee(e);
		if (!t) return this.destructor(e), null;
		var n = kt(this.registeredClass, t);
		if (n !== void 0) {
			if (n.$$.count.value === 0) return n.$$.ptr = t, n.$$.smartPtr = e, n.clone();
			var r = n.clone();
			return this.destructor(e), r;
		}
		function i() {
			return this.isSmartPointer ? At(this.registeredClass.instancePrototype, {
				ptrType: this.pointeeType,
				ptr: t,
				smartPtrType: this,
				smartPtr: e
			}) : At(this.registeredClass.instancePrototype, {
				ptrType: this,
				ptr: e
			});
		}
		var a = mt[this.registeredClass.getActualType(t)];
		if (!a) return i.call(this);
		var o = this.isConst ? a.constPointerType : a.pointerType, s = Et(t, this.registeredClass, o.registeredClass);
		return s === null ? i.call(this) : this.isSmartPointer ? At(o.registeredClass.instancePrototype, {
			ptrType: o,
			ptr: s,
			smartPtrType: this,
			smartPtr: e
		}) : At(o.registeredClass.instancePrototype, {
			ptrType: o,
			ptr: s
		});
	}
	var Mt = () => {
		Object.assign(B.prototype, {
			getPointee(e) {
				return this.rawGetPointee && (e = this.rawGetPointee(e)), e;
			},
			destructor(e) {
				var t, n;
				(t = (n = this).rawDestructor) == null || t.call(n, e);
			},
			readValueFromPointer: j,
			fromWireType: jt
		});
	};
	function B(e, t, n, r, i, a, o, s, c, l, u) {
		this.name = e, this.registeredClass = t, this.isReference = n, this.isConst = r, this.isSmartPointer = i, this.pointeeType = a, this.sharingPolicy = o, this.rawGetPointee = s, this.rawConstructor = c, this.rawShare = l, this.rawDestructor = u, !i && t.baseClass === void 0 ? r ? (this.toWireType = Ct, this.destructorFunction = null) : (this.toWireType = Tt, this.destructorFunction = null) : this.toWireType = wt;
	}
	var Nt = (e, t, n) => {
		i.hasOwnProperty(e) || Ye("Replacing nonexistent public symbol"), i[e].overloadTable !== void 0 && n !== void 0 ? i[e].overloadTable[n] = t : (i[e] = t, i[e].argCount = n);
	}, V = {}, Pt = (e, t, n) => {
		e = e.replace(/p/g, "i");
		var r = V[e];
		return r(t, ...n);
	}, Ft = function(e, t) {
		let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : [];
		if (arguments.length > 3 && arguments[3] !== void 0 && arguments[3], e.includes("j")) return Pt(e, t, n);
		var r = E(t)(...n);
		function i(e) {
			return e;
		}
		return i(r);
	}, It = function(e, t) {
		let n = arguments.length > 2 && arguments[2] !== void 0 && arguments[2];
		return function() {
			return Ft(e, t, [...arguments], n);
		};
	}, H = function(e, t) {
		arguments.length > 2 && arguments[2] !== void 0 && arguments[2], e = F(e);
		function n() {
			return e.includes("j") ? It(e, t) : E(t);
		}
		var r = n();
		return typeof r != "function" && L(`unknown function pointer with signature ${e}: ${t}`), r;
	};
	class Lt extends Error {}
	var Rt = (e) => {
		var t = fr(e), n = F(t);
		return Z(t), n;
	}, zt = (e, t) => {
		var n = [], r = {};
		function i(e) {
			if (!r[e] && !N[e]) {
				if (qe[e]) {
					qe[e].forEach(i);
					return;
				}
				n.push(e), r[e] = !0;
			}
		}
		throw t.forEach(i), new Lt(`${e}: ` + n.map(Rt).join([", "]));
	}, Bt = (e, t, n, r, i, a, o, s, c, l, u, d, f) => {
		u = F(u), a = H(i, a), s && (s = H(o, s)), l && (l = H(c, l)), f = H(d, f);
		var p = yt(u);
		gt(p, function() {
			zt(`Cannot construct ${u} due to unbound types`, [r]);
		}), P([
			e,
			t,
			n
		], r ? [r] : [], (t) => {
			t = t[0];
			var n, i;
			r ? (n = t.registeredClass, i = n.instancePrototype) : i = ft.prototype;
			var o = pt(u, function() {
				var e = [...arguments];
				if (Object.getPrototypeOf(this) !== c) throw new I(`Use 'new' to construct ${u}`);
				if (d.constructor_body === void 0) throw new I(`${u} has no accessible constructor`);
				var t = d.constructor_body[e.length];
				if (t === void 0) throw new I(`Tried to invoke ctor of ${u} with invalid number of parameters (${e.length}) - expected (${Object.keys(d.constructor_body).toString()}) parameters instead!`);
				return t.apply(this, e);
			}), c = Object.create(i, { constructor: { value: o } });
			o.prototype = c;
			var d = new bt(u, o, c, f, n, a, s, l);
			if (d.baseClass) {
				var m;
				(m = d.baseClass).__derivedClasses != null || (m.__derivedClasses = []), d.baseClass.__derivedClasses.push(d);
			}
			var h = new B(u, d, !0, !1, !1), g = new B(u + "*", d, !1, !1, !1), _ = new B(u + " const*", d, !1, !0, !1);
			return mt[e] = {
				pointerType: g,
				constPointerType: _
			}, Nt(p, o), [
				h,
				g,
				_
			];
		});
	}, Vt = (e, t) => {
		for (var n = [], r = 0; r < e; r++) n.push(O[t + r * 4 >> 2]);
		return n;
	};
	function Ht(e) {
		for (var t = 1; t < e.length; ++t) if (e[t] !== null && e[t].destructorFunction === void 0) return !0;
		return !1;
	}
	function Ut(e) {
		for (var t = 1; t < e.length; ++t) if (e[t] !== null && e[t].argStackAlloc) return !0;
		return !1;
	}
	function Wt(e, t, n, r, i, a) {
		var o = t.length;
		o < 2 && L("argTypes array size mismatch! Must at least get return value and receiver (this) types!");
		var s = t[1] !== null && n !== null, c = Ht(t), l = Ut(t), u = l && !a && !c;
		l && !u && (c = !0);
		var d = !t[0].isVoid, f = o - 2, p = Array(f), m = [], h = [];
		return pt(e, function() {
			var e = [...arguments];
			h.length = 0;
			var n;
			u && (n = T());
			var a, o;
			try {
				m.length = s ? 2 : 1, m[0] = i, s && (a = t[1].toWireType(h, this), m[1] = a);
				for (var l = 0; l < f; ++l) {
					var g = t[l + 2];
					p[l] = g.toWireType(u && g.argStackAlloc ? null : h, e[l]), m.push(p[l]);
				}
				o = r(...m);
			} finally {
				u && w(n);
			}
			function _(e) {
				if (c) Ke(h);
				else for (var n = s ? 1 : 2; n < t.length; n++) {
					var r = n === 1 ? a : p[n - 2];
					t[n].destructorFunction !== null && t[n].destructorFunction(r);
				}
				if (d) return t[0].fromWireType(e);
			}
			return _(o);
		});
	}
	var Gt = (e, t, n, r, i, a) => {
		var o = Vt(t, n);
		i = H(r, i), P([], [e], (e) => {
			e = e[0];
			var n = `constructor ${e.name}`;
			if (e.registeredClass.constructor_body === void 0 && (e.registeredClass.constructor_body = []), e.registeredClass.constructor_body[t - 1] !== void 0) throw new I(`Cannot register multiple constructors with identical number of parameters (${t - 1}) for class '${e.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`);
			return e.registeredClass.constructor_body[t - 1] = () => {
				zt(`Cannot construct ${e.name} due to unbound types`, o);
			}, P([], o, (r) => (r.splice(1, 0, null), e.registeredClass.constructor_body[t - 1] = Wt(n, r, null, i, a), [])), [];
		});
	}, Kt = (e) => {
		e = e.trim();
		let t = e.indexOf("(");
		return t === -1 ? e : e.slice(0, t);
	}, qt = (e, t, n, r, i, a, o, s, c, l) => {
		var u = Vt(n, r);
		t = F(t), t = Kt(t), a = H(i, a, c), P([], [e], (e) => {
			e = e[0];
			var r = `${e.name}.${t}`;
			t.startsWith("@@") && (t = Symbol[t.substring(2)]), s && e.registeredClass.pureVirtualFunctions.push(t);
			function i() {
				zt(`Cannot call ${r} due to unbound types`, u);
			}
			var l = e.registeredClass.instancePrototype, d = l[t];
			return d === void 0 || d.overloadTable === void 0 && d.className !== e.name && d.argCount === n - 2 ? (i.argCount = n - 2, i.className = e.name, l[t] = i) : (ht(l, t, r), l[t].overloadTable[n - 2] = i), P([], u, (i) => {
				var s = Wt(r, i, e, a, o, c);
				return l[t].overloadTable === void 0 ? (s.argCount = n - 2, l[t] = s) : l[t].overloadTable[n - 2] = s, [];
			}), [];
		});
	}, Jt = [], U = [
		0,
		1,
		,
		1,
		null,
		1,
		!0,
		1,
		!1,
		1
	], Yt = [], Xt = (e) => {
		if (e > 9 && --U[e + 1] === 0) {
			var t = U[e];
			U[e] = void 0;
			var n = Yt[e];
			n && (Yt[e] = void 0, n(t)), Jt.push(e);
		}
	}, W = {
		toValue: (e) => (e || L(`Cannot use deleted val. handle = ${e}`), U[e]),
		toHandle: (e) => {
			switch (e) {
				case void 0: return 2;
				case null: return 4;
				case !0: return 6;
				case !1: return 8;
				default: {
					let t = Jt.pop() || U.length;
					return U[t] = e, U[t + 1] = 1, t;
				}
			}
		}
	}, Zt = {
		name: "emscripten::val",
		fromWireType: (e) => {
			var t = W.toValue(e);
			return Xt(e), t;
		},
		toWireType: (e, t) => W.toHandle(t),
		readValueFromPointer: j,
		destructorFunction: null
	}, Qt = (e) => R(e, Zt), $t, en, tn = (e, t) => {
		switch (t) {
			case 4: return function(e) {
				return this.fromWireType($t[e >> 2]);
			};
			case 8: return function(e) {
				return this.fromWireType(en[e >> 3]);
			};
			default: throw TypeError(`invalid float width (${t}): ${e}`);
		}
	}, nn = (e, t, n) => {
		t = F(t), R(e, {
			name: t,
			fromWireType: (e) => e,
			toWireType: (e, t) => t,
			readValueFromPointer: tn(t, n),
			destructorFunction: null
		});
	}, rn = (e, t, n, r, i, a, o, s) => {
		var c = Vt(t, n);
		e = F(e), e = Kt(e), i = H(r, i, o), gt(e, function() {
			zt(`Cannot call ${e} due to unbound types`, c);
		}, t - 1), P([], c, (n) => {
			var r = [n[0], null].concat(n.slice(1));
			return Nt(e, Wt(e, r, null, i, a, o), t - 1), [];
		});
	}, an, G, K, on = (e, t, n) => {
		switch (t) {
			case 1: return n ? (e) => x[e] : (e) => A[e];
			case 2: return n ? (e) => an[e >> 1] : (e) => G[e >> 1];
			case 4: return n ? (e) => K[e >> 2] : (e) => O[e >> 2];
			default: throw TypeError(`invalid integer width (${t}): ${e}`);
		}
	}, sn = (e, t, n, r, i) => {
		t = F(t);
		let a = r === 0, o = (e) => e;
		if (a) {
			var s = 32 - 8 * n;
			o = (e) => e << s >>> s, i = o(i);
		}
		R(e, {
			name: t,
			fromWireType: o,
			toWireType: (e, t) => t,
			readValueFromPointer: on(t, n, r !== 0),
			destructorFunction: null
		});
	}, cn = (e, t, n) => {
		let r = (e, t) => {
			let n = 0;
			return {
				next() {
					if (n >= e) return { done: !0 };
					let r = n;
					return n++, {
						value: t(r),
						done: !1
					};
				},
				[Symbol.iterator]() {
					return this;
				}
			};
		};
		e[Symbol.iterator] || (e[Symbol.iterator] = function() {
			let e = this[t]();
			return r(e, (e) => this[n](e));
		});
	}, ln = (e, t, n, r) => {
		n = F(n), r = F(r), P([], [e, t], (e) => {
			let t = e[0];
			return cn(t.registeredClass.instancePrototype, n, r), [];
		});
	}, un = (e, t, n) => {
		var r = [
			Int8Array,
			Uint8Array,
			Int16Array,
			Uint16Array,
			Int32Array,
			Uint32Array,
			Float32Array,
			Float64Array
		][t];
		function i(e) {
			var t = O[e >> 2], n = O[e + 4 >> 2];
			return new r(x.buffer, n, t);
		}
		n = F(n), R(e, {
			name: n,
			fromWireType: i,
			readValueFromPointer: i
		}, { ignoreDuplicateRegistrations: !0 });
	}, dn = Object.assign({ optional: !0 }, Zt), fn = (e, t) => {
		R(e, dn);
	}, pn = (e, t, n, r) => {
		if (!(r > 0)) return 0;
		for (var i = n, a = n + r - 1, o = 0; o < e.length; ++o) {
			var s = e.codePointAt(o);
			if (s <= 127) {
				if (n >= a) break;
				t[n++] = s;
			} else if (s <= 2047) {
				if (n + 1 >= a) break;
				t[n++] = 192 | s >> 6, t[n++] = 128 | s & 63;
			} else if (s <= 65535) {
				if (n + 2 >= a) break;
				t[n++] = 224 | s >> 12, t[n++] = 128 | s >> 6 & 63, t[n++] = 128 | s & 63;
			} else {
				if (n + 3 >= a) break;
				t[n++] = 240 | s >> 18, t[n++] = 128 | s >> 12 & 63, t[n++] = 128 | s >> 6 & 63, t[n++] = 128 | s & 63, o++;
			}
		}
		return t[n] = 0, n - i;
	}, q = (e, t, n) => pn(e, A, t, n), mn = (e) => {
		for (var t = 0, n = 0; n < e.length; ++n) {
			var r = e.charCodeAt(n);
			r <= 127 ? t++ : r <= 2047 ? t += 2 : r >= 55296 && r <= 57343 ? (t += 4, ++n) : t += 3;
		}
		return t;
	}, hn = (e, t) => {
		t = F(t);
		var n = !0;
		R(e, {
			name: t,
			fromWireType(e) {
				var t = O[e >> 2], r = e + 4, i;
				if (n) i = Re(r, t, !0);
				else {
					i = "";
					for (var a = 0; a < t; ++a) i += String.fromCharCode(A[r + a]);
				}
				return Z(e), i;
			},
			toWireType(e, t) {
				t instanceof ArrayBuffer && (t = new Uint8Array(t));
				var r, i = typeof t == "string";
				i || ArrayBuffer.isView(t) && t.BYTES_PER_ELEMENT == 1 || L("Cannot pass non-string to std::string"), r = n && i ? mn(t) : t.length;
				var a = pr(4 + r + 1), o = a + 4;
				if (O[a >> 2] = r, i) {
					if (n) q(t, o, r + 1);
					else for (var s = 0; s < r; ++s) {
						var c = t.charCodeAt(s);
						c > 255 && (Z(a), L("String has UTF-16 code units that do not fit in 8 bits")), A[o + s] = c;
					}
				} else A.set(t, o);
				return e !== null && e.push(Z, a), a;
			},
			readValueFromPointer: j,
			destructorFunction(e) {
				Z(e);
			}
		});
	}, gn = globalThis.TextDecoder ? new TextDecoder("utf-16le") : void 0, _n = (e, t, n) => {
		var r = e >> 1, i = Ie(G, r, t / 2, n);
		if (i - r > 16 && gn) return gn.decode(G.subarray(r, i));
		for (var a = "", o = r; o < i; ++o) {
			var s = G[o];
			a += String.fromCharCode(s);
		}
		return a;
	}, vn = function(e, t) {
		let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 2147483647;
		if (n < 2) return 0;
		n -= 2;
		for (var r = t, i = n < e.length * 2 ? n / 2 : e.length, a = 0; a < i; ++a) {
			var o = e.charCodeAt(a);
			an[t >> 1] = o, t += 2;
		}
		return an[t >> 1] = 0, t - r;
	}, yn = (e) => e.length * 2, bn = (e, t, n) => {
		for (var r = "", i = e >> 2, a = 0; !(a >= t / 4); a++) {
			var o = O[i + a];
			if (!o && !n) break;
			r += String.fromCodePoint(o);
		}
		return r;
	}, xn = function(e, t) {
		let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 2147483647;
		if (n < 4) return 0;
		for (var r = t, i = r + n - 4, a = 0; a < e.length; ++a) {
			var o = e.codePointAt(a);
			if (o > 65535 && a++, K[t >> 2] = o, t += 4, t + 4 > i) break;
		}
		return K[t >> 2] = 0, t - r;
	}, Sn = (e) => {
		for (var t = 0, n = 0; n < e.length; ++n) e.codePointAt(n) > 65535 && n++, t += 4;
		return t;
	}, Cn = (e, t, n) => {
		n = F(n);
		var r, i, a;
		t === 2 ? (r = _n, i = vn, a = yn) : (r = bn, i = xn, a = Sn), R(e, {
			name: n,
			fromWireType: (e) => {
				var n = O[e >> 2], i = r(e + 4, n * t, !0);
				return Z(e), i;
			},
			toWireType: (e, r) => {
				typeof r != "string" && L(`Cannot pass non-string to C++ string type ${n}`);
				var o = a(r), s = pr(4 + o + t);
				return O[s >> 2] = o / t, i(r, s + 4, o + t), e !== null && e.push(Z, s), s;
			},
			readValueFromPointer: j,
			destructorFunction(e) {
				Z(e);
			}
		});
	}, wn = (e, t, n, r, i, a, o, s) => {
		Ge[e] = {
			name: F(t),
			rawConstructor: H(n, r),
			rawDestructor: H(i, a),
			valueSize: o,
			isTrivial: !!s,
			fields: []
		};
	}, Tn = (e, t, n, r, i, a, o, s, c, l) => {
		Ge[e].fields.push({
			fieldName: F(t),
			getterReturnType: n,
			getter: H(r, i),
			getterContext: a,
			setterArgumentType: o,
			setter: H(s, c),
			setterContext: l
		});
	}, En = (e, t) => {
		t = F(t), R(e, {
			isVoid: !0,
			name: t,
			fromWireType: () => void 0,
			toWireType: (e, t) => void 0
		});
	}, Dn = 0, On = () => {
		_e = !1, Dn = 0;
	}, kn = [], An = (e) => {
		var t = kn.length;
		return kn.push(e), t;
	}, jn = (e, t) => {
		var n = N[e];
		return n === void 0 && L(`${t} has unknown type ${Rt(e)}`), n;
	}, Mn = (e, t) => {
		for (var n = Array(e), r = 0; r < e; ++r) n[r] = jn(O[t + r * 4 >> 2], `parameter ${r}`);
		return n;
	}, Nn = (e, t, n) => {
		var r = [], i = e(r, n);
		return r.length && (O[t >> 2] = W.toHandle(r)), i;
	}, Pn = {}, Fn = (e) => {
		var t = Pn[e];
		return t === void 0 ? F(e) : t;
	}, In = (e, t, n) => {
		var [r, ...i] = Mn(e, t), a = r.toWireType.bind(r), o = i.map((e) => e.readValueFromPointer.bind(e));
		e--;
		var s = Array(e);
		return An(pt(`methodCaller<(${i.map((e) => e.name)}) => ${r.name}>`, (t, r, i, c) => {
			for (var l = 0, u = 0; u < e; ++u) s[u] = o[u](c + l), l += 8;
			var d;
			switch (n) {
				case 0:
					d = W.toValue(t).apply(null, s);
					break;
				case 2:
					d = Reflect.construct(W.toValue(t), s);
					break;
				case 3:
					d = s[0];
					break;
				case 1: d = W.toValue(t)[Fn(r)](...s);
			}
			return Nn(a, i, d);
		}));
	}, Ln = (e) => e ? (e = Fn(e), W.toHandle(globalThis[e])) : W.toHandle(globalThis), Rn = (e) => {
		e > 9 && (U[e + 1] += 1);
	}, zn = (e, t, n, r, i) => kn[e](t, n, r, i), Bn = (e) => {
		Ke(W.toValue(e)), Xt(e);
	}, J = {}, Vn = (e) => {
		if (e instanceof me || e == "unwind") return v;
		c(1, e);
	}, Hn = () => _e || Dn > 0, Un = (e) => {
		if (v = e, !Hn()) {
			var t;
			(t = i.onExit) == null || t.call(i, e), _ = !0;
		}
		c(e, new me(e));
	}, Wn = (e, t) => {
		v = e, Un(e);
	}, Gn = () => {
		if (!Hn()) try {
			Wn(v);
		} catch (e) {
			Vn(e);
		}
	}, Kn = function(e) {
		var t = [...arguments].slice(1);
		if (!_) try {
			return e(...t);
		} catch (e) {
			Vn(e);
		} finally {
			Gn();
		}
	}, qn = () => performance.now(), Jn = (e, t) => (J[e] && (clearTimeout(J[e].id), delete J[e]), t && (J[e] = {
		id: setTimeout(() => {
			delete J[e], Kn(hr, e, qn());
		}, t),
		timeout_ms: t
	}), 0), Yn = (e, t, n, r) => {
		var i = (/* @__PURE__ */ new Date()).getFullYear(), a = new Date(i, 0, 1), o = new Date(i, 6, 1), s = a.getTimezoneOffset(), c = o.getTimezoneOffset(), l = Math.max(s, c);
		O[e >> 2] = l * 60, K[t >> 2] = Number(s != c);
		var u = (e) => {
			var t = e >= 0 ? "-" : "+", n = Math.abs(e);
			return `UTC${t}${String(Math.floor(n / 60)).padStart(2, "0")}${String(n % 60).padStart(2, "0")}`;
		}, d = u(s), f = u(c);
		c < s ? (q(d, n, 17), q(f, r, 17)) : (q(d, r, 17), q(f, n, 17));
	}, Xn = () => 2147483648, Zn = (e, t) => Math.ceil(e / t) * t, Qn = (e) => {
		var t = (e - wr.buffer.byteLength + 65535) / 65536 | 0;
		try {
			return wr.grow(t), ne(), 1;
		} catch {}
	}, $n = (e) => {
		var t = A.length;
		e >>>= 0;
		var n = Xn();
		if (e > n) return !1;
		for (var r = 1; r <= 4; r *= 2) {
			var i = t * (1 + .2 / r);
			if (i = Math.min(i, e + 100663296), Qn(Math.min(n, Zn(Math.max(e, i), 65536)))) return !0;
		}
		return !1;
	}, er = {}, tr = () => s, Y = () => {
		if (!Y.strings) {
			var e, t, n = {
				USER: "web_user",
				LOGNAME: "web_user",
				PATH: "/",
				PWD: "/",
				HOME: "/home/web_user",
				LANG: ((e = (t = globalThis.navigator) == null ? void 0 : t.language) == null ? "C" : e).replace("-", "_") + ".UTF-8",
				_: tr()
			};
			for (var r in er) er[r] === void 0 ? delete n[r] : n[r] = er[r];
			var i = [];
			for (var r in n) i.push(`${r}=${n[r]}`);
			Y.strings = i;
		}
		return Y.strings;
	}, nr = (e, t) => {
		var n = 0, r = 0;
		for (var i of Y()) {
			var a = t + n;
			O[e + r >> 2] = a, n += q(i, a, Infinity) + 1, r += 4;
		}
		return 0;
	}, rr = (e, t) => {
		var n = Y();
		O[e >> 2] = n.length;
		var r = 0;
		for (var i of n) r += mn(i) + 1;
		return O[t >> 2] = r, 0;
	}, ir = (e) => 52, ar = (e, t, n, r) => 52, or = (e, t) => t + 2097152 >>> 0 < 4194305 - !!e ? (e >>> 0) + t * 4294967296 : NaN;
	function sr(e, t, n, r, i) {
		return or(t, n), 70;
	}
	var cr = [
		null,
		[],
		[]
	], lr = (e, t) => {
		var n = cr[e];
		!t || t === 10 ? ((e === 1 ? m : h)(Le(n)), n.length = 0) : n.push(t);
	}, ur = (e, t, n, r) => {
		for (var i = 0, a = 0; a < n; a++) {
			var o = O[t >> 2], s = O[t + 4 >> 2];
			t += 8;
			for (var c = 0; c < s; c++) lr(e, A[o + c]);
			i += s;
		}
		return O[r >> 2] = i, 0;
	}, dr = (e) => e;
	dt(), Mt(), i.noExitRuntime && (_e = i.noExitRuntime), i.print && (m = i.print), i.printErr && (h = i.printErr), i.wasmBinary && (g = i.wasmBinary), i.arguments && i.arguments, i.thisProgram && (s = i.thisProgram);
	var X = i.preInit;
	if (X) for (typeof X == "function" && (i.preInit = X = [X]); X.length > 0;) X.shift()();
	var fr, Z, pr, mr, hr, Q, gr, _r, vr, yr, br, xr, Sr, Cr, wr, Tr;
	function Er(e) {
		fr = e.Ja, Z = i._free = e.Ka, pr = i._malloc = e.La, mr = e.Ma, hr = e.Oa, Q = e.Pa, gr = e.Qa, _r = e.Ra, vr = e.Sa, yr = e.Ta, br = e.Ua, xr = e.Va, Sr = e.Wa, Cr = V.iiij = e.Xa, V.jiji = e.Ya, V.viijii = e.Za, V.iiiiij = e._a, V.iiiiijj = e.$a, V.iiiiiijj = e.ab, wr = e.Ha, Tr = e.Na;
	}
	var Dr = {
		qa: ye,
		s: Se,
		A: Ce,
		a: Ee,
		i: De,
		l: Oe,
		Y: Ae,
		r: je,
		na: Me,
		d: Pe,
		X: ze,
		xa: Be,
		ua: Ve,
		ya: He,
		pa: Ue,
		ta: We,
		ea: Qe,
		da: $e,
		Ba: tt,
		Ga: Bt,
		Fa: Gt,
		I: qt,
		za: Qt,
		Z: nn,
		O: rn,
		C: sn,
		Da: ln,
		w: un,
		aa: fn,
		Aa: hn,
		R: Cn,
		F: wn,
		ha: Tn,
		Ca: En,
		sa: On,
		$: In,
		wa: Xt,
		G: Ln,
		U: Rn,
		_: zn,
		Ea: Bn,
		ja: Jn,
		ka: Yn,
		oa: $n,
		la: nr,
		ma: rr,
		V: ir,
		va: ar,
		ca: sr,
		W: ur,
		ia: qr,
		N: Xr,
		D: Ar,
		S: ii,
		x: ai,
		b: jr,
		E: Yr,
		c: Mr,
		H: Kr,
		h: kr,
		k: Wr,
		p: Ur,
		Q: Jr,
		z: Rr,
		B: Ir,
		M: ei,
		K: oi,
		ba: ci,
		f: Pr,
		j: Or,
		fa: ti,
		g: Fr,
		T: Qr,
		P: ri,
		e: Nr,
		L: ni,
		m: Br,
		ga: $r,
		n: Lr,
		v: Hr,
		u: Gr,
		q: Vr,
		t: Zr,
		o: zr,
		J: si,
		y: dr,
		ra: Un
	};
	function Or(e, t) {
		var n = T();
		try {
			E(e)(t);
		} catch (e) {
			if (w(n), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function kr(e, t, n, r) {
		var i = T();
		try {
			return E(e)(t, n, r);
		} catch (e) {
			if (w(i), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Ar(e, t, n, r, i, a) {
		var o = T();
		try {
			return E(e)(t, n, r, i, a);
		} catch (e) {
			if (w(o), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function jr(e, t) {
		var n = T();
		try {
			return E(e)(t);
		} catch (e) {
			if (w(n), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Mr(e, t, n) {
		var r = T();
		try {
			return E(e)(t, n);
		} catch (e) {
			if (w(r), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Nr(e, t, n, r) {
		var i = T();
		try {
			E(e)(t, n, r);
		} catch (e) {
			if (w(i), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Pr(e) {
		var t = T();
		try {
			E(e)();
		} catch (e) {
			if (w(t), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Fr(e, t, n) {
		var r = T();
		try {
			E(e)(t, n);
		} catch (e) {
			if (w(r), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Ir(e, t, n, r, i, a, o, s) {
		var c = T();
		try {
			return E(e)(t, n, r, i, a, o, s);
		} catch (e) {
			if (w(c), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Lr(e, t, n, r, i, a) {
		var o = T();
		try {
			E(e)(t, n, r, i, a);
		} catch (e) {
			if (w(o), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Rr(e, t, n, r, i, a, o) {
		var s = T();
		try {
			return E(e)(t, n, r, i, a, o);
		} catch (e) {
			if (w(s), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function zr(e, t, n, r, i, a, o, s, c, l, u) {
		var d = T();
		try {
			E(e)(t, n, r, i, a, o, s, c, l, u);
		} catch (e) {
			if (w(d), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Br(e, t, n, r, i) {
		var a = T();
		try {
			E(e)(t, n, r, i);
		} catch (e) {
			if (w(a), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Vr(e, t, n, r, i, a, o, s, c) {
		var l = T();
		try {
			E(e)(t, n, r, i, a, o, s, c);
		} catch (e) {
			if (w(l), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Hr(e, t, n, r, i, a, o) {
		var s = T();
		try {
			E(e)(t, n, r, i, a, o);
		} catch (e) {
			if (w(s), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Ur(e, t, n, r, i, a) {
		var o = T();
		try {
			return E(e)(t, n, r, i, a);
		} catch (e) {
			if (w(o), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Wr(e, t, n, r, i) {
		var a = T();
		try {
			return E(e)(t, n, r, i);
		} catch (e) {
			if (w(a), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Gr(e, t, n, r, i, a, o, s) {
		var c = T();
		try {
			E(e)(t, n, r, i, a, o, s);
		} catch (e) {
			if (w(c), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Kr(e, t, n, r, i) {
		var a = T();
		try {
			return E(e)(t, n, r, i);
		} catch (e) {
			if (w(a), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function qr(e, t, n) {
		var r = T();
		try {
			return E(e)(t, n);
		} catch (e) {
			if (w(r), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Jr(e, t, n, r, i, a, o) {
		var s = T();
		try {
			return E(e)(t, n, r, i, a, o);
		} catch (e) {
			if (w(s), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Yr(e, t, n, r) {
		var i = T();
		try {
			return E(e)(t, n, r);
		} catch (e) {
			if (w(i), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Xr(e, t, n, r) {
		var i = T();
		try {
			return E(e)(t, n, r);
		} catch (e) {
			if (w(i), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Zr(e, t, n, r, i, a, o, s, c, l) {
		var u = T();
		try {
			E(e)(t, n, r, i, a, o, s, c, l);
		} catch (e) {
			if (w(u), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function Qr(e, t, n, r, i, a, o, s, c) {
		var l = T();
		try {
			E(e)(t, n, r, i, a, o, s, c);
		} catch (e) {
			if (w(l), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function $r(e, t, n, r, i, a, o, s) {
		var c = T();
		try {
			E(e)(t, n, r, i, a, o, s);
		} catch (e) {
			if (w(c), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function ei(e, t, n, r, i, a, o, s, c) {
		var l = T();
		try {
			return E(e)(t, n, r, i, a, o, s, c);
		} catch (e) {
			if (w(l), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function ti(e, t, n) {
		var r = T();
		try {
			E(e)(t, n);
		} catch (e) {
			if (w(r), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function ni(e, t, n, r, i, a, o) {
		var s = T();
		try {
			E(e)(t, n, r, i, a, o);
		} catch (e) {
			if (w(s), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function ri(e, t, n, r, i) {
		var a = T();
		try {
			E(e)(t, n, r, i);
		} catch (e) {
			if (w(a), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function ii(e, t, n, r) {
		var i = T();
		try {
			return E(e)(t, n, r);
		} catch (e) {
			if (w(i), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function ai(e) {
		var t = T();
		try {
			return E(e)();
		} catch (e) {
			if (w(t), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function oi(e, t, n, r, i, a, o, s, c, l, u, d) {
		var f = T();
		try {
			return E(e)(t, n, r, i, a, o, s, c, l, u, d);
		} catch (e) {
			if (w(f), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function si(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h) {
		var g = T();
		try {
			E(e)(t, n, r, i, a, o, s, c, l, u, d, f, p, m, h);
		} catch (e) {
			if (w(g), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	function ci(e, t, n, r, i) {
		var a = T();
		try {
			return Cr(e, t, n, r, i);
		} catch (e) {
			if (w(a), !(e instanceof y)) throw e;
			Q(1, 0);
		}
	}
	async function li() {
		var e;
		re();
		var t = i.setStatus;
		t && (t("Running..."), await new Promise((e) => setTimeout(e, 1)), setTimeout(t, 1, "")), !_ && (ie(), (e = i.onRuntimeInitialized) == null || e.call(i), ae());
	}
	var $ = await pe();
	return await li(), i;
}
//#endregion
//#region src/full/index.ts
function C(e) {
	return m(S, e);
}
function ge() {
	return b(S);
}
function _e(e) {
	return C({
		overrides: e,
		equalityFn: Object.is,
		fireImmediately: !0
	});
}
function w(e) {
	C({
		overrides: e,
		equalityFn: Object.is,
		fireImmediately: !1
	});
}
async function T(e, t) {
	return le(S, e, t);
}
async function ve(e, t) {
	return T(e, t);
}
async function E(e, t) {
	return T(e, t);
}
async function ye(e, t) {
	return g(S, e, t);
}
var D = "987604a30b002928ebb62021f4d92adbe1ac79a7ba27ae8b434f90170aa72d46";
//#endregion
export { x as BARCODE_FORMATS, h as BARCODE_HRI_LABELS, me as BARCODE_META_FORMATS, d as BARCODE_SYMBOLOGIES, p as BINARIZERS, ee as CHARACTER_SETS, se as CONTENT_TYPES, t as CREATABLE_BARCODE_FORMATS, _ as EAN_ADD_ON_SYMBOLS, pe as GS1_BARCODE_FORMATS, f as INDUSTRIAL_BARCODE_FORMATS, r as LINEAR_BARCODE_FORMATS, n as MATRIX_BARCODE_FORMATS, l as READABLE_BARCODE_FORMATS, re as RETAIL_BARCODE_FORMATS, ie as TEXT_MODES, ce as ZXING_CPP_COMMIT, D as ZXING_WASM_SHA256, te as ZXING_WASM_VERSION, e as barcodeFormats, fe as binarizers, y as characterSets, ae as contentTypes, oe as defaultReaderOptions, ue as defaultWriterOptions, v as eanAddOnSymbols, ne as encodeFormat, s as encodeFormats, c as formatToLabel, u as formatToSymbology, _e as getZXingModule, i as linearBarcodeFormats, a as matrixBarcodeFormats, C as prepareZXingModule, ge as purgeZXingModule, T as readBarcodes, E as readBarcodesFromImageData, ve as readBarcodesFromImageFile, w as setZXingModuleOverrides, o as symbologyToFormats, de as textModes, ye as writeBarcode };

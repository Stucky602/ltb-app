(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/react/cjs/react.production.min.js
  var require_react_production_min = __commonJS({
    "node_modules/react/cjs/react.production.min.js"(exports) {
      "use strict";
      var l = Symbol.for("react.element");
      var n = Symbol.for("react.portal");
      var p = Symbol.for("react.fragment");
      var q = Symbol.for("react.strict_mode");
      var r = Symbol.for("react.profiler");
      var t = Symbol.for("react.provider");
      var u = Symbol.for("react.context");
      var v = Symbol.for("react.forward_ref");
      var w = Symbol.for("react.suspense");
      var x = Symbol.for("react.memo");
      var y = Symbol.for("react.lazy");
      var z = Symbol.iterator;
      function A(a) {
        if (null === a || "object" !== typeof a) return null;
        a = z && a[z] || a["@@iterator"];
        return "function" === typeof a ? a : null;
      }
      var B = { isMounted: function() {
        return false;
      }, enqueueForceUpdate: function() {
      }, enqueueReplaceState: function() {
      }, enqueueSetState: function() {
      } };
      var C = Object.assign;
      var D = {};
      function E(a, b, e) {
        this.props = a;
        this.context = b;
        this.refs = D;
        this.updater = e || B;
      }
      E.prototype.isReactComponent = {};
      E.prototype.setState = function(a, b) {
        if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
        this.updater.enqueueSetState(this, a, b, "setState");
      };
      E.prototype.forceUpdate = function(a) {
        this.updater.enqueueForceUpdate(this, a, "forceUpdate");
      };
      function F() {
      }
      F.prototype = E.prototype;
      function G(a, b, e) {
        this.props = a;
        this.context = b;
        this.refs = D;
        this.updater = e || B;
      }
      var H = G.prototype = new F();
      H.constructor = G;
      C(H, E.prototype);
      H.isPureReactComponent = true;
      var I2 = Array.isArray;
      var J = Object.prototype.hasOwnProperty;
      var K = { current: null };
      var L = { key: true, ref: true, __self: true, __source: true };
      function M(a, b, e) {
        var d, c = {}, k = null, h = null;
        if (null != b) for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k = "" + b.key), b) J.call(b, d) && !L.hasOwnProperty(d) && (c[d] = b[d]);
        var g = arguments.length - 2;
        if (1 === g) c.children = e;
        else if (1 < g) {
          for (var f = Array(g), m = 0; m < g; m++) f[m] = arguments[m + 2];
          c.children = f;
        }
        if (a && a.defaultProps) for (d in g = a.defaultProps, g) void 0 === c[d] && (c[d] = g[d]);
        return { $$typeof: l, type: a, key: k, ref: h, props: c, _owner: K.current };
      }
      function N(a, b) {
        return { $$typeof: l, type: a.type, key: b, ref: a.ref, props: a.props, _owner: a._owner };
      }
      function O(a) {
        return "object" === typeof a && null !== a && a.$$typeof === l;
      }
      function escape(a) {
        var b = { "=": "=0", ":": "=2" };
        return "$" + a.replace(/[=:]/g, function(a2) {
          return b[a2];
        });
      }
      var P = /\/+/g;
      function Q(a, b) {
        return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
      }
      function R(a, b, e, d, c) {
        var k = typeof a;
        if ("undefined" === k || "boolean" === k) a = null;
        var h = false;
        if (null === a) h = true;
        else switch (k) {
          case "string":
          case "number":
            h = true;
            break;
          case "object":
            switch (a.$$typeof) {
              case l:
              case n:
                h = true;
            }
        }
        if (h) return h = a, c = c(h), a = "" === d ? "." + Q(h, 0) : d, I2(c) ? (e = "", null != a && (e = a.replace(P, "$&/") + "/"), R(c, b, e, "", function(a2) {
          return a2;
        })) : null != c && (O(c) && (c = N(c, e + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P, "$&/") + "/") + a)), b.push(c)), 1;
        h = 0;
        d = "" === d ? "." : d + ":";
        if (I2(a)) for (var g = 0; g < a.length; g++) {
          k = a[g];
          var f = d + Q(k, g);
          h += R(k, b, e, f, c);
        }
        else if (f = A(a), "function" === typeof f) for (a = f.call(a), g = 0; !(k = a.next()).done; ) k = k.value, f = d + Q(k, g++), h += R(k, b, e, f, c);
        else if ("object" === k) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
        return h;
      }
      function S(a, b, e) {
        if (null == a) return a;
        var d = [], c = 0;
        R(a, d, "", "", function(a2) {
          return b.call(e, a2, c++);
        });
        return d;
      }
      function T(a) {
        if (-1 === a._status) {
          var b = a._result;
          b = b();
          b.then(function(b2) {
            if (0 === a._status || -1 === a._status) a._status = 1, a._result = b2;
          }, function(b2) {
            if (0 === a._status || -1 === a._status) a._status = 2, a._result = b2;
          });
          -1 === a._status && (a._status = 0, a._result = b);
        }
        if (1 === a._status) return a._result.default;
        throw a._result;
      }
      var U = { current: null };
      var V = { transition: null };
      var W = { ReactCurrentDispatcher: U, ReactCurrentBatchConfig: V, ReactCurrentOwner: K };
      function X2() {
        throw Error("act(...) is not supported in production builds of React.");
      }
      exports.Children = { map: S, forEach: function(a, b, e) {
        S(a, function() {
          b.apply(this, arguments);
        }, e);
      }, count: function(a) {
        var b = 0;
        S(a, function() {
          b++;
        });
        return b;
      }, toArray: function(a) {
        return S(a, function(a2) {
          return a2;
        }) || [];
      }, only: function(a) {
        if (!O(a)) throw Error("React.Children.only expected to receive a single React element child.");
        return a;
      } };
      exports.Component = E;
      exports.Fragment = p;
      exports.Profiler = r;
      exports.PureComponent = G;
      exports.StrictMode = q;
      exports.Suspense = w;
      exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W;
      exports.act = X2;
      exports.cloneElement = function(a, b, e) {
        if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
        var d = C({}, a.props), c = a.key, k = a.ref, h = a._owner;
        if (null != b) {
          void 0 !== b.ref && (k = b.ref, h = K.current);
          void 0 !== b.key && (c = "" + b.key);
          if (a.type && a.type.defaultProps) var g = a.type.defaultProps;
          for (f in b) J.call(b, f) && !L.hasOwnProperty(f) && (d[f] = void 0 === b[f] && void 0 !== g ? g[f] : b[f]);
        }
        var f = arguments.length - 2;
        if (1 === f) d.children = e;
        else if (1 < f) {
          g = Array(f);
          for (var m = 0; m < f; m++) g[m] = arguments[m + 2];
          d.children = g;
        }
        return { $$typeof: l, type: a.type, key: c, ref: k, props: d, _owner: h };
      };
      exports.createContext = function(a) {
        a = { $$typeof: u, _currentValue: a, _currentValue2: a, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
        a.Provider = { $$typeof: t, _context: a };
        return a.Consumer = a;
      };
      exports.createElement = M;
      exports.createFactory = function(a) {
        var b = M.bind(null, a);
        b.type = a;
        return b;
      };
      exports.createRef = function() {
        return { current: null };
      };
      exports.forwardRef = function(a) {
        return { $$typeof: v, render: a };
      };
      exports.isValidElement = O;
      exports.lazy = function(a) {
        return { $$typeof: y, _payload: { _status: -1, _result: a }, _init: T };
      };
      exports.memo = function(a, b) {
        return { $$typeof: x, type: a, compare: void 0 === b ? null : b };
      };
      exports.startTransition = function(a) {
        var b = V.transition;
        V.transition = {};
        try {
          a();
        } finally {
          V.transition = b;
        }
      };
      exports.unstable_act = X2;
      exports.useCallback = function(a, b) {
        return U.current.useCallback(a, b);
      };
      exports.useContext = function(a) {
        return U.current.useContext(a);
      };
      exports.useDebugValue = function() {
      };
      exports.useDeferredValue = function(a) {
        return U.current.useDeferredValue(a);
      };
      exports.useEffect = function(a, b) {
        return U.current.useEffect(a, b);
      };
      exports.useId = function() {
        return U.current.useId();
      };
      exports.useImperativeHandle = function(a, b, e) {
        return U.current.useImperativeHandle(a, b, e);
      };
      exports.useInsertionEffect = function(a, b) {
        return U.current.useInsertionEffect(a, b);
      };
      exports.useLayoutEffect = function(a, b) {
        return U.current.useLayoutEffect(a, b);
      };
      exports.useMemo = function(a, b) {
        return U.current.useMemo(a, b);
      };
      exports.useReducer = function(a, b, e) {
        return U.current.useReducer(a, b, e);
      };
      exports.useRef = function(a) {
        return U.current.useRef(a);
      };
      exports.useState = function(a) {
        return U.current.useState(a);
      };
      exports.useSyncExternalStore = function(a, b, e) {
        return U.current.useSyncExternalStore(a, b, e);
      };
      exports.useTransition = function() {
        return U.current.useTransition();
      };
      exports.version = "18.3.1";
    }
  });

  // node_modules/react/index.js
  var require_react = __commonJS({
    "node_modules/react/index.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_react_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/scheduler/cjs/scheduler.production.min.js
  var require_scheduler_production_min = __commonJS({
    "node_modules/scheduler/cjs/scheduler.production.min.js"(exports) {
      "use strict";
      function f(a, b) {
        var c = a.length;
        a.push(b);
        a: for (; 0 < c; ) {
          var d = c - 1 >>> 1, e = a[d];
          if (0 < g(e, b)) a[d] = b, a[c] = e, c = d;
          else break a;
        }
      }
      function h(a) {
        return 0 === a.length ? null : a[0];
      }
      function k(a) {
        if (0 === a.length) return null;
        var b = a[0], c = a.pop();
        if (c !== b) {
          a[0] = c;
          a: for (var d = 0, e = a.length, w = e >>> 1; d < w; ) {
            var m = 2 * (d + 1) - 1, C = a[m], n = m + 1, x = a[n];
            if (0 > g(C, c)) n < e && 0 > g(x, C) ? (a[d] = x, a[n] = c, d = n) : (a[d] = C, a[m] = c, d = m);
            else if (n < e && 0 > g(x, c)) a[d] = x, a[n] = c, d = n;
            else break a;
          }
        }
        return b;
      }
      function g(a, b) {
        var c = a.sortIndex - b.sortIndex;
        return 0 !== c ? c : a.id - b.id;
      }
      if ("object" === typeof performance && "function" === typeof performance.now) {
        l = performance;
        exports.unstable_now = function() {
          return l.now();
        };
      } else {
        p = Date, q = p.now();
        exports.unstable_now = function() {
          return p.now() - q;
        };
      }
      var l;
      var p;
      var q;
      var r = [];
      var t = [];
      var u = 1;
      var v = null;
      var y = 3;
      var z = false;
      var A = false;
      var B = false;
      var D = "function" === typeof setTimeout ? setTimeout : null;
      var E = "function" === typeof clearTimeout ? clearTimeout : null;
      var F = "undefined" !== typeof setImmediate ? setImmediate : null;
      "undefined" !== typeof navigator && void 0 !== navigator.scheduling && void 0 !== navigator.scheduling.isInputPending && navigator.scheduling.isInputPending.bind(navigator.scheduling);
      function G(a) {
        for (var b = h(t); null !== b; ) {
          if (null === b.callback) k(t);
          else if (b.startTime <= a) k(t), b.sortIndex = b.expirationTime, f(r, b);
          else break;
          b = h(t);
        }
      }
      function H(a) {
        B = false;
        G(a);
        if (!A) if (null !== h(r)) A = true, I2(J);
        else {
          var b = h(t);
          null !== b && K(H, b.startTime - a);
        }
      }
      function J(a, b) {
        A = false;
        B && (B = false, E(L), L = -1);
        z = true;
        var c = y;
        try {
          G(b);
          for (v = h(r); null !== v && (!(v.expirationTime > b) || a && !M()); ) {
            var d = v.callback;
            if ("function" === typeof d) {
              v.callback = null;
              y = v.priorityLevel;
              var e = d(v.expirationTime <= b);
              b = exports.unstable_now();
              "function" === typeof e ? v.callback = e : v === h(r) && k(r);
              G(b);
            } else k(r);
            v = h(r);
          }
          if (null !== v) var w = true;
          else {
            var m = h(t);
            null !== m && K(H, m.startTime - b);
            w = false;
          }
          return w;
        } finally {
          v = null, y = c, z = false;
        }
      }
      var N = false;
      var O = null;
      var L = -1;
      var P = 5;
      var Q = -1;
      function M() {
        return exports.unstable_now() - Q < P ? false : true;
      }
      function R() {
        if (null !== O) {
          var a = exports.unstable_now();
          Q = a;
          var b = true;
          try {
            b = O(true, a);
          } finally {
            b ? S() : (N = false, O = null);
          }
        } else N = false;
      }
      var S;
      if ("function" === typeof F) S = function() {
        F(R);
      };
      else if ("undefined" !== typeof MessageChannel) {
        T = new MessageChannel(), U = T.port2;
        T.port1.onmessage = R;
        S = function() {
          U.postMessage(null);
        };
      } else S = function() {
        D(R, 0);
      };
      var T;
      var U;
      function I2(a) {
        O = a;
        N || (N = true, S());
      }
      function K(a, b) {
        L = D(function() {
          a(exports.unstable_now());
        }, b);
      }
      exports.unstable_IdlePriority = 5;
      exports.unstable_ImmediatePriority = 1;
      exports.unstable_LowPriority = 4;
      exports.unstable_NormalPriority = 3;
      exports.unstable_Profiling = null;
      exports.unstable_UserBlockingPriority = 2;
      exports.unstable_cancelCallback = function(a) {
        a.callback = null;
      };
      exports.unstable_continueExecution = function() {
        A || z || (A = true, I2(J));
      };
      exports.unstable_forceFrameRate = function(a) {
        0 > a || 125 < a ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : P = 0 < a ? Math.floor(1e3 / a) : 5;
      };
      exports.unstable_getCurrentPriorityLevel = function() {
        return y;
      };
      exports.unstable_getFirstCallbackNode = function() {
        return h(r);
      };
      exports.unstable_next = function(a) {
        switch (y) {
          case 1:
          case 2:
          case 3:
            var b = 3;
            break;
          default:
            b = y;
        }
        var c = y;
        y = b;
        try {
          return a();
        } finally {
          y = c;
        }
      };
      exports.unstable_pauseExecution = function() {
      };
      exports.unstable_requestPaint = function() {
      };
      exports.unstable_runWithPriority = function(a, b) {
        switch (a) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
          default:
            a = 3;
        }
        var c = y;
        y = a;
        try {
          return b();
        } finally {
          y = c;
        }
      };
      exports.unstable_scheduleCallback = function(a, b, c) {
        var d = exports.unstable_now();
        "object" === typeof c && null !== c ? (c = c.delay, c = "number" === typeof c && 0 < c ? d + c : d) : c = d;
        switch (a) {
          case 1:
            var e = -1;
            break;
          case 2:
            e = 250;
            break;
          case 5:
            e = 1073741823;
            break;
          case 4:
            e = 1e4;
            break;
          default:
            e = 5e3;
        }
        e = c + e;
        a = { id: u++, callback: b, priorityLevel: a, startTime: c, expirationTime: e, sortIndex: -1 };
        c > d ? (a.sortIndex = c, f(t, a), null === h(r) && a === h(t) && (B ? (E(L), L = -1) : B = true, K(H, c - d))) : (a.sortIndex = e, f(r, a), A || z || (A = true, I2(J)));
        return a;
      };
      exports.unstable_shouldYield = M;
      exports.unstable_wrapCallback = function(a) {
        var b = y;
        return function() {
          var c = y;
          y = b;
          try {
            return a.apply(this, arguments);
          } finally {
            y = c;
          }
        };
      };
    }
  });

  // node_modules/scheduler/index.js
  var require_scheduler = __commonJS({
    "node_modules/scheduler/index.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_scheduler_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/react-dom/cjs/react-dom.production.min.js
  var require_react_dom_production_min = __commonJS({
    "node_modules/react-dom/cjs/react-dom.production.min.js"(exports) {
      "use strict";
      var aa = require_react();
      var ca = require_scheduler();
      function p(a) {
        for (var b = "https://reactjs.org/docs/error-decoder.html?invariant=" + a, c = 1; c < arguments.length; c++) b += "&args[]=" + encodeURIComponent(arguments[c]);
        return "Minified React error #" + a + "; visit " + b + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
      }
      var da = /* @__PURE__ */ new Set();
      var ea = {};
      function fa(a, b) {
        ha(a, b);
        ha(a + "Capture", b);
      }
      function ha(a, b) {
        ea[a] = b;
        for (a = 0; a < b.length; a++) da.add(b[a]);
      }
      var ia = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement);
      var ja = Object.prototype.hasOwnProperty;
      var ka = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/;
      var la = {};
      var ma = {};
      function oa(a) {
        if (ja.call(ma, a)) return true;
        if (ja.call(la, a)) return false;
        if (ka.test(a)) return ma[a] = true;
        la[a] = true;
        return false;
      }
      function pa(a, b, c, d) {
        if (null !== c && 0 === c.type) return false;
        switch (typeof b) {
          case "function":
          case "symbol":
            return true;
          case "boolean":
            if (d) return false;
            if (null !== c) return !c.acceptsBooleans;
            a = a.toLowerCase().slice(0, 5);
            return "data-" !== a && "aria-" !== a;
          default:
            return false;
        }
      }
      function qa(a, b, c, d) {
        if (null === b || "undefined" === typeof b || pa(a, b, c, d)) return true;
        if (d) return false;
        if (null !== c) switch (c.type) {
          case 3:
            return !b;
          case 4:
            return false === b;
          case 5:
            return isNaN(b);
          case 6:
            return isNaN(b) || 1 > b;
        }
        return false;
      }
      function v(a, b, c, d, e, f, g) {
        this.acceptsBooleans = 2 === b || 3 === b || 4 === b;
        this.attributeName = d;
        this.attributeNamespace = e;
        this.mustUseProperty = c;
        this.propertyName = a;
        this.type = b;
        this.sanitizeURL = f;
        this.removeEmptyString = g;
      }
      var z = {};
      "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a) {
        z[a] = new v(a, 0, false, a, null, false, false);
      });
      [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(a) {
        var b = a[0];
        z[b] = new v(b, 1, false, a[1], null, false, false);
      });
      ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(a) {
        z[a] = new v(a, 2, false, a.toLowerCase(), null, false, false);
      });
      ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(a) {
        z[a] = new v(a, 2, false, a, null, false, false);
      });
      "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a) {
        z[a] = new v(a, 3, false, a.toLowerCase(), null, false, false);
      });
      ["checked", "multiple", "muted", "selected"].forEach(function(a) {
        z[a] = new v(a, 3, true, a, null, false, false);
      });
      ["capture", "download"].forEach(function(a) {
        z[a] = new v(a, 4, false, a, null, false, false);
      });
      ["cols", "rows", "size", "span"].forEach(function(a) {
        z[a] = new v(a, 6, false, a, null, false, false);
      });
      ["rowSpan", "start"].forEach(function(a) {
        z[a] = new v(a, 5, false, a.toLowerCase(), null, false, false);
      });
      var ra = /[\-:]([a-z])/g;
      function sa(a) {
        return a[1].toUpperCase();
      }
      "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a) {
        var b = a.replace(
          ra,
          sa
        );
        z[b] = new v(b, 1, false, a, null, false, false);
      });
      "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a) {
        var b = a.replace(ra, sa);
        z[b] = new v(b, 1, false, a, "http://www.w3.org/1999/xlink", false, false);
      });
      ["xml:base", "xml:lang", "xml:space"].forEach(function(a) {
        var b = a.replace(ra, sa);
        z[b] = new v(b, 1, false, a, "http://www.w3.org/XML/1998/namespace", false, false);
      });
      ["tabIndex", "crossOrigin"].forEach(function(a) {
        z[a] = new v(a, 1, false, a.toLowerCase(), null, false, false);
      });
      z.xlinkHref = new v("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true, false);
      ["src", "href", "action", "formAction"].forEach(function(a) {
        z[a] = new v(a, 1, false, a.toLowerCase(), null, true, true);
      });
      function ta(a, b, c, d) {
        var e = z.hasOwnProperty(b) ? z[b] : null;
        if (null !== e ? 0 !== e.type : d || !(2 < b.length) || "o" !== b[0] && "O" !== b[0] || "n" !== b[1] && "N" !== b[1]) qa(b, c, e, d) && (c = null), d || null === e ? oa(b) && (null === c ? a.removeAttribute(b) : a.setAttribute(b, "" + c)) : e.mustUseProperty ? a[e.propertyName] = null === c ? 3 === e.type ? false : "" : c : (b = e.attributeName, d = e.attributeNamespace, null === c ? a.removeAttribute(b) : (e = e.type, c = 3 === e || 4 === e && true === c ? "" : "" + c, d ? a.setAttributeNS(d, b, c) : a.setAttribute(b, c)));
      }
      var ua = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      var va = Symbol.for("react.element");
      var wa = Symbol.for("react.portal");
      var ya = Symbol.for("react.fragment");
      var za = Symbol.for("react.strict_mode");
      var Aa = Symbol.for("react.profiler");
      var Ba = Symbol.for("react.provider");
      var Ca = Symbol.for("react.context");
      var Da = Symbol.for("react.forward_ref");
      var Ea = Symbol.for("react.suspense");
      var Fa = Symbol.for("react.suspense_list");
      var Ga = Symbol.for("react.memo");
      var Ha = Symbol.for("react.lazy");
      Symbol.for("react.scope");
      Symbol.for("react.debug_trace_mode");
      var Ia = Symbol.for("react.offscreen");
      Symbol.for("react.legacy_hidden");
      Symbol.for("react.cache");
      Symbol.for("react.tracing_marker");
      var Ja = Symbol.iterator;
      function Ka(a) {
        if (null === a || "object" !== typeof a) return null;
        a = Ja && a[Ja] || a["@@iterator"];
        return "function" === typeof a ? a : null;
      }
      var A = Object.assign;
      var La;
      function Ma(a) {
        if (void 0 === La) try {
          throw Error();
        } catch (c) {
          var b = c.stack.trim().match(/\n( *(at )?)/);
          La = b && b[1] || "";
        }
        return "\n" + La + a;
      }
      var Na = false;
      function Oa(a, b) {
        if (!a || Na) return "";
        Na = true;
        var c = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        try {
          if (b) if (b = function() {
            throw Error();
          }, Object.defineProperty(b.prototype, "props", { set: function() {
            throw Error();
          } }), "object" === typeof Reflect && Reflect.construct) {
            try {
              Reflect.construct(b, []);
            } catch (l) {
              var d = l;
            }
            Reflect.construct(a, [], b);
          } else {
            try {
              b.call();
            } catch (l) {
              d = l;
            }
            a.call(b.prototype);
          }
          else {
            try {
              throw Error();
            } catch (l) {
              d = l;
            }
            a();
          }
        } catch (l) {
          if (l && d && "string" === typeof l.stack) {
            for (var e = l.stack.split("\n"), f = d.stack.split("\n"), g = e.length - 1, h = f.length - 1; 1 <= g && 0 <= h && e[g] !== f[h]; ) h--;
            for (; 1 <= g && 0 <= h; g--, h--) if (e[g] !== f[h]) {
              if (1 !== g || 1 !== h) {
                do
                  if (g--, h--, 0 > h || e[g] !== f[h]) {
                    var k = "\n" + e[g].replace(" at new ", " at ");
                    a.displayName && k.includes("<anonymous>") && (k = k.replace("<anonymous>", a.displayName));
                    return k;
                  }
                while (1 <= g && 0 <= h);
              }
              break;
            }
          }
        } finally {
          Na = false, Error.prepareStackTrace = c;
        }
        return (a = a ? a.displayName || a.name : "") ? Ma(a) : "";
      }
      function Pa(a) {
        switch (a.tag) {
          case 5:
            return Ma(a.type);
          case 16:
            return Ma("Lazy");
          case 13:
            return Ma("Suspense");
          case 19:
            return Ma("SuspenseList");
          case 0:
          case 2:
          case 15:
            return a = Oa(a.type, false), a;
          case 11:
            return a = Oa(a.type.render, false), a;
          case 1:
            return a = Oa(a.type, true), a;
          default:
            return "";
        }
      }
      function Qa(a) {
        if (null == a) return null;
        if ("function" === typeof a) return a.displayName || a.name || null;
        if ("string" === typeof a) return a;
        switch (a) {
          case ya:
            return "Fragment";
          case wa:
            return "Portal";
          case Aa:
            return "Profiler";
          case za:
            return "StrictMode";
          case Ea:
            return "Suspense";
          case Fa:
            return "SuspenseList";
        }
        if ("object" === typeof a) switch (a.$$typeof) {
          case Ca:
            return (a.displayName || "Context") + ".Consumer";
          case Ba:
            return (a._context.displayName || "Context") + ".Provider";
          case Da:
            var b = a.render;
            a = a.displayName;
            a || (a = b.displayName || b.name || "", a = "" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
            return a;
          case Ga:
            return b = a.displayName || null, null !== b ? b : Qa(a.type) || "Memo";
          case Ha:
            b = a._payload;
            a = a._init;
            try {
              return Qa(a(b));
            } catch (c) {
            }
        }
        return null;
      }
      function Ra(a) {
        var b = a.type;
        switch (a.tag) {
          case 24:
            return "Cache";
          case 9:
            return (b.displayName || "Context") + ".Consumer";
          case 10:
            return (b._context.displayName || "Context") + ".Provider";
          case 18:
            return "DehydratedFragment";
          case 11:
            return a = b.render, a = a.displayName || a.name || "", b.displayName || ("" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
          case 7:
            return "Fragment";
          case 5:
            return b;
          case 4:
            return "Portal";
          case 3:
            return "Root";
          case 6:
            return "Text";
          case 16:
            return Qa(b);
          case 8:
            return b === za ? "StrictMode" : "Mode";
          case 22:
            return "Offscreen";
          case 12:
            return "Profiler";
          case 21:
            return "Scope";
          case 13:
            return "Suspense";
          case 19:
            return "SuspenseList";
          case 25:
            return "TracingMarker";
          case 1:
          case 0:
          case 17:
          case 2:
          case 14:
          case 15:
            if ("function" === typeof b) return b.displayName || b.name || null;
            if ("string" === typeof b) return b;
        }
        return null;
      }
      function Sa(a) {
        switch (typeof a) {
          case "boolean":
          case "number":
          case "string":
          case "undefined":
            return a;
          case "object":
            return a;
          default:
            return "";
        }
      }
      function Ta(a) {
        var b = a.type;
        return (a = a.nodeName) && "input" === a.toLowerCase() && ("checkbox" === b || "radio" === b);
      }
      function Ua(a) {
        var b = Ta(a) ? "checked" : "value", c = Object.getOwnPropertyDescriptor(a.constructor.prototype, b), d = "" + a[b];
        if (!a.hasOwnProperty(b) && "undefined" !== typeof c && "function" === typeof c.get && "function" === typeof c.set) {
          var e = c.get, f = c.set;
          Object.defineProperty(a, b, { configurable: true, get: function() {
            return e.call(this);
          }, set: function(a2) {
            d = "" + a2;
            f.call(this, a2);
          } });
          Object.defineProperty(a, b, { enumerable: c.enumerable });
          return { getValue: function() {
            return d;
          }, setValue: function(a2) {
            d = "" + a2;
          }, stopTracking: function() {
            a._valueTracker = null;
            delete a[b];
          } };
        }
      }
      function Va(a) {
        a._valueTracker || (a._valueTracker = Ua(a));
      }
      function Wa(a) {
        if (!a) return false;
        var b = a._valueTracker;
        if (!b) return true;
        var c = b.getValue();
        var d = "";
        a && (d = Ta(a) ? a.checked ? "true" : "false" : a.value);
        a = d;
        return a !== c ? (b.setValue(a), true) : false;
      }
      function Xa(a) {
        a = a || ("undefined" !== typeof document ? document : void 0);
        if ("undefined" === typeof a) return null;
        try {
          return a.activeElement || a.body;
        } catch (b) {
          return a.body;
        }
      }
      function Ya(a, b) {
        var c = b.checked;
        return A({}, b, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: null != c ? c : a._wrapperState.initialChecked });
      }
      function Za(a, b) {
        var c = null == b.defaultValue ? "" : b.defaultValue, d = null != b.checked ? b.checked : b.defaultChecked;
        c = Sa(null != b.value ? b.value : c);
        a._wrapperState = { initialChecked: d, initialValue: c, controlled: "checkbox" === b.type || "radio" === b.type ? null != b.checked : null != b.value };
      }
      function ab(a, b) {
        b = b.checked;
        null != b && ta(a, "checked", b, false);
      }
      function bb(a, b) {
        ab(a, b);
        var c = Sa(b.value), d = b.type;
        if (null != c) if ("number" === d) {
          if (0 === c && "" === a.value || a.value != c) a.value = "" + c;
        } else a.value !== "" + c && (a.value = "" + c);
        else if ("submit" === d || "reset" === d) {
          a.removeAttribute("value");
          return;
        }
        b.hasOwnProperty("value") ? cb(a, b.type, c) : b.hasOwnProperty("defaultValue") && cb(a, b.type, Sa(b.defaultValue));
        null == b.checked && null != b.defaultChecked && (a.defaultChecked = !!b.defaultChecked);
      }
      function db(a, b, c) {
        if (b.hasOwnProperty("value") || b.hasOwnProperty("defaultValue")) {
          var d = b.type;
          if (!("submit" !== d && "reset" !== d || void 0 !== b.value && null !== b.value)) return;
          b = "" + a._wrapperState.initialValue;
          c || b === a.value || (a.value = b);
          a.defaultValue = b;
        }
        c = a.name;
        "" !== c && (a.name = "");
        a.defaultChecked = !!a._wrapperState.initialChecked;
        "" !== c && (a.name = c);
      }
      function cb(a, b, c) {
        if ("number" !== b || Xa(a.ownerDocument) !== a) null == c ? a.defaultValue = "" + a._wrapperState.initialValue : a.defaultValue !== "" + c && (a.defaultValue = "" + c);
      }
      var eb = Array.isArray;
      function fb(a, b, c, d) {
        a = a.options;
        if (b) {
          b = {};
          for (var e = 0; e < c.length; e++) b["$" + c[e]] = true;
          for (c = 0; c < a.length; c++) e = b.hasOwnProperty("$" + a[c].value), a[c].selected !== e && (a[c].selected = e), e && d && (a[c].defaultSelected = true);
        } else {
          c = "" + Sa(c);
          b = null;
          for (e = 0; e < a.length; e++) {
            if (a[e].value === c) {
              a[e].selected = true;
              d && (a[e].defaultSelected = true);
              return;
            }
            null !== b || a[e].disabled || (b = a[e]);
          }
          null !== b && (b.selected = true);
        }
      }
      function gb(a, b) {
        if (null != b.dangerouslySetInnerHTML) throw Error(p(91));
        return A({}, b, { value: void 0, defaultValue: void 0, children: "" + a._wrapperState.initialValue });
      }
      function hb(a, b) {
        var c = b.value;
        if (null == c) {
          c = b.children;
          b = b.defaultValue;
          if (null != c) {
            if (null != b) throw Error(p(92));
            if (eb(c)) {
              if (1 < c.length) throw Error(p(93));
              c = c[0];
            }
            b = c;
          }
          null == b && (b = "");
          c = b;
        }
        a._wrapperState = { initialValue: Sa(c) };
      }
      function ib(a, b) {
        var c = Sa(b.value), d = Sa(b.defaultValue);
        null != c && (c = "" + c, c !== a.value && (a.value = c), null == b.defaultValue && a.defaultValue !== c && (a.defaultValue = c));
        null != d && (a.defaultValue = "" + d);
      }
      function jb(a) {
        var b = a.textContent;
        b === a._wrapperState.initialValue && "" !== b && null !== b && (a.value = b);
      }
      function kb(a) {
        switch (a) {
          case "svg":
            return "http://www.w3.org/2000/svg";
          case "math":
            return "http://www.w3.org/1998/Math/MathML";
          default:
            return "http://www.w3.org/1999/xhtml";
        }
      }
      function lb(a, b) {
        return null == a || "http://www.w3.org/1999/xhtml" === a ? kb(b) : "http://www.w3.org/2000/svg" === a && "foreignObject" === b ? "http://www.w3.org/1999/xhtml" : a;
      }
      var mb;
      var nb = function(a) {
        return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction ? function(b, c, d, e) {
          MSApp.execUnsafeLocalFunction(function() {
            return a(b, c, d, e);
          });
        } : a;
      }(function(a, b) {
        if ("http://www.w3.org/2000/svg" !== a.namespaceURI || "innerHTML" in a) a.innerHTML = b;
        else {
          mb = mb || document.createElement("div");
          mb.innerHTML = "<svg>" + b.valueOf().toString() + "</svg>";
          for (b = mb.firstChild; a.firstChild; ) a.removeChild(a.firstChild);
          for (; b.firstChild; ) a.appendChild(b.firstChild);
        }
      });
      function ob(a, b) {
        if (b) {
          var c = a.firstChild;
          if (c && c === a.lastChild && 3 === c.nodeType) {
            c.nodeValue = b;
            return;
          }
        }
        a.textContent = b;
      }
      var pb = {
        animationIterationCount: true,
        aspectRatio: true,
        borderImageOutset: true,
        borderImageSlice: true,
        borderImageWidth: true,
        boxFlex: true,
        boxFlexGroup: true,
        boxOrdinalGroup: true,
        columnCount: true,
        columns: true,
        flex: true,
        flexGrow: true,
        flexPositive: true,
        flexShrink: true,
        flexNegative: true,
        flexOrder: true,
        gridArea: true,
        gridRow: true,
        gridRowEnd: true,
        gridRowSpan: true,
        gridRowStart: true,
        gridColumn: true,
        gridColumnEnd: true,
        gridColumnSpan: true,
        gridColumnStart: true,
        fontWeight: true,
        lineClamp: true,
        lineHeight: true,
        opacity: true,
        order: true,
        orphans: true,
        tabSize: true,
        widows: true,
        zIndex: true,
        zoom: true,
        fillOpacity: true,
        floodOpacity: true,
        stopOpacity: true,
        strokeDasharray: true,
        strokeDashoffset: true,
        strokeMiterlimit: true,
        strokeOpacity: true,
        strokeWidth: true
      };
      var qb = ["Webkit", "ms", "Moz", "O"];
      Object.keys(pb).forEach(function(a) {
        qb.forEach(function(b) {
          b = b + a.charAt(0).toUpperCase() + a.substring(1);
          pb[b] = pb[a];
        });
      });
      function rb(a, b, c) {
        return null == b || "boolean" === typeof b || "" === b ? "" : c || "number" !== typeof b || 0 === b || pb.hasOwnProperty(a) && pb[a] ? ("" + b).trim() : b + "px";
      }
      function sb(a, b) {
        a = a.style;
        for (var c in b) if (b.hasOwnProperty(c)) {
          var d = 0 === c.indexOf("--"), e = rb(c, b[c], d);
          "float" === c && (c = "cssFloat");
          d ? a.setProperty(c, e) : a[c] = e;
        }
      }
      var tb = A({ menuitem: true }, { area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true });
      function ub(a, b) {
        if (b) {
          if (tb[a] && (null != b.children || null != b.dangerouslySetInnerHTML)) throw Error(p(137, a));
          if (null != b.dangerouslySetInnerHTML) {
            if (null != b.children) throw Error(p(60));
            if ("object" !== typeof b.dangerouslySetInnerHTML || !("__html" in b.dangerouslySetInnerHTML)) throw Error(p(61));
          }
          if (null != b.style && "object" !== typeof b.style) throw Error(p(62));
        }
      }
      function vb(a, b) {
        if (-1 === a.indexOf("-")) return "string" === typeof b.is;
        switch (a) {
          case "annotation-xml":
          case "color-profile":
          case "font-face":
          case "font-face-src":
          case "font-face-uri":
          case "font-face-format":
          case "font-face-name":
          case "missing-glyph":
            return false;
          default:
            return true;
        }
      }
      var wb = null;
      function xb(a) {
        a = a.target || a.srcElement || window;
        a.correspondingUseElement && (a = a.correspondingUseElement);
        return 3 === a.nodeType ? a.parentNode : a;
      }
      var yb = null;
      var zb = null;
      var Ab = null;
      function Bb(a) {
        if (a = Cb(a)) {
          if ("function" !== typeof yb) throw Error(p(280));
          var b = a.stateNode;
          b && (b = Db(b), yb(a.stateNode, a.type, b));
        }
      }
      function Eb(a) {
        zb ? Ab ? Ab.push(a) : Ab = [a] : zb = a;
      }
      function Fb() {
        if (zb) {
          var a = zb, b = Ab;
          Ab = zb = null;
          Bb(a);
          if (b) for (a = 0; a < b.length; a++) Bb(b[a]);
        }
      }
      function Gb(a, b) {
        return a(b);
      }
      function Hb() {
      }
      var Ib = false;
      function Jb(a, b, c) {
        if (Ib) return a(b, c);
        Ib = true;
        try {
          return Gb(a, b, c);
        } finally {
          if (Ib = false, null !== zb || null !== Ab) Hb(), Fb();
        }
      }
      function Kb(a, b) {
        var c = a.stateNode;
        if (null === c) return null;
        var d = Db(c);
        if (null === d) return null;
        c = d[b];
        a: switch (b) {
          case "onClick":
          case "onClickCapture":
          case "onDoubleClick":
          case "onDoubleClickCapture":
          case "onMouseDown":
          case "onMouseDownCapture":
          case "onMouseMove":
          case "onMouseMoveCapture":
          case "onMouseUp":
          case "onMouseUpCapture":
          case "onMouseEnter":
            (d = !d.disabled) || (a = a.type, d = !("button" === a || "input" === a || "select" === a || "textarea" === a));
            a = !d;
            break a;
          default:
            a = false;
        }
        if (a) return null;
        if (c && "function" !== typeof c) throw Error(p(231, b, typeof c));
        return c;
      }
      var Lb = false;
      if (ia) try {
        Mb = {};
        Object.defineProperty(Mb, "passive", { get: function() {
          Lb = true;
        } });
        window.addEventListener("test", Mb, Mb);
        window.removeEventListener("test", Mb, Mb);
      } catch (a) {
        Lb = false;
      }
      var Mb;
      function Nb(a, b, c, d, e, f, g, h, k) {
        var l = Array.prototype.slice.call(arguments, 3);
        try {
          b.apply(c, l);
        } catch (m) {
          this.onError(m);
        }
      }
      var Ob = false;
      var Pb = null;
      var Qb = false;
      var Rb = null;
      var Sb = { onError: function(a) {
        Ob = true;
        Pb = a;
      } };
      function Tb(a, b, c, d, e, f, g, h, k) {
        Ob = false;
        Pb = null;
        Nb.apply(Sb, arguments);
      }
      function Ub(a, b, c, d, e, f, g, h, k) {
        Tb.apply(this, arguments);
        if (Ob) {
          if (Ob) {
            var l = Pb;
            Ob = false;
            Pb = null;
          } else throw Error(p(198));
          Qb || (Qb = true, Rb = l);
        }
      }
      function Vb(a) {
        var b = a, c = a;
        if (a.alternate) for (; b.return; ) b = b.return;
        else {
          a = b;
          do
            b = a, 0 !== (b.flags & 4098) && (c = b.return), a = b.return;
          while (a);
        }
        return 3 === b.tag ? c : null;
      }
      function Wb(a) {
        if (13 === a.tag) {
          var b = a.memoizedState;
          null === b && (a = a.alternate, null !== a && (b = a.memoizedState));
          if (null !== b) return b.dehydrated;
        }
        return null;
      }
      function Xb(a) {
        if (Vb(a) !== a) throw Error(p(188));
      }
      function Yb(a) {
        var b = a.alternate;
        if (!b) {
          b = Vb(a);
          if (null === b) throw Error(p(188));
          return b !== a ? null : a;
        }
        for (var c = a, d = b; ; ) {
          var e = c.return;
          if (null === e) break;
          var f = e.alternate;
          if (null === f) {
            d = e.return;
            if (null !== d) {
              c = d;
              continue;
            }
            break;
          }
          if (e.child === f.child) {
            for (f = e.child; f; ) {
              if (f === c) return Xb(e), a;
              if (f === d) return Xb(e), b;
              f = f.sibling;
            }
            throw Error(p(188));
          }
          if (c.return !== d.return) c = e, d = f;
          else {
            for (var g = false, h = e.child; h; ) {
              if (h === c) {
                g = true;
                c = e;
                d = f;
                break;
              }
              if (h === d) {
                g = true;
                d = e;
                c = f;
                break;
              }
              h = h.sibling;
            }
            if (!g) {
              for (h = f.child; h; ) {
                if (h === c) {
                  g = true;
                  c = f;
                  d = e;
                  break;
                }
                if (h === d) {
                  g = true;
                  d = f;
                  c = e;
                  break;
                }
                h = h.sibling;
              }
              if (!g) throw Error(p(189));
            }
          }
          if (c.alternate !== d) throw Error(p(190));
        }
        if (3 !== c.tag) throw Error(p(188));
        return c.stateNode.current === c ? a : b;
      }
      function Zb(a) {
        a = Yb(a);
        return null !== a ? $b(a) : null;
      }
      function $b(a) {
        if (5 === a.tag || 6 === a.tag) return a;
        for (a = a.child; null !== a; ) {
          var b = $b(a);
          if (null !== b) return b;
          a = a.sibling;
        }
        return null;
      }
      var ac = ca.unstable_scheduleCallback;
      var bc = ca.unstable_cancelCallback;
      var cc = ca.unstable_shouldYield;
      var dc = ca.unstable_requestPaint;
      var B = ca.unstable_now;
      var ec = ca.unstable_getCurrentPriorityLevel;
      var fc = ca.unstable_ImmediatePriority;
      var gc = ca.unstable_UserBlockingPriority;
      var hc = ca.unstable_NormalPriority;
      var ic = ca.unstable_LowPriority;
      var jc = ca.unstable_IdlePriority;
      var kc = null;
      var lc = null;
      function mc(a) {
        if (lc && "function" === typeof lc.onCommitFiberRoot) try {
          lc.onCommitFiberRoot(kc, a, void 0, 128 === (a.current.flags & 128));
        } catch (b) {
        }
      }
      var oc = Math.clz32 ? Math.clz32 : nc;
      var pc = Math.log;
      var qc = Math.LN2;
      function nc(a) {
        a >>>= 0;
        return 0 === a ? 32 : 31 - (pc(a) / qc | 0) | 0;
      }
      var rc = 64;
      var sc = 4194304;
      function tc(a) {
        switch (a & -a) {
          case 1:
            return 1;
          case 2:
            return 2;
          case 4:
            return 4;
          case 8:
            return 8;
          case 16:
            return 16;
          case 32:
            return 32;
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return a & 4194240;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            return a & 130023424;
          case 134217728:
            return 134217728;
          case 268435456:
            return 268435456;
          case 536870912:
            return 536870912;
          case 1073741824:
            return 1073741824;
          default:
            return a;
        }
      }
      function uc(a, b) {
        var c = a.pendingLanes;
        if (0 === c) return 0;
        var d = 0, e = a.suspendedLanes, f = a.pingedLanes, g = c & 268435455;
        if (0 !== g) {
          var h = g & ~e;
          0 !== h ? d = tc(h) : (f &= g, 0 !== f && (d = tc(f)));
        } else g = c & ~e, 0 !== g ? d = tc(g) : 0 !== f && (d = tc(f));
        if (0 === d) return 0;
        if (0 !== b && b !== d && 0 === (b & e) && (e = d & -d, f = b & -b, e >= f || 16 === e && 0 !== (f & 4194240))) return b;
        0 !== (d & 4) && (d |= c & 16);
        b = a.entangledLanes;
        if (0 !== b) for (a = a.entanglements, b &= d; 0 < b; ) c = 31 - oc(b), e = 1 << c, d |= a[c], b &= ~e;
        return d;
      }
      function vc(a, b) {
        switch (a) {
          case 1:
          case 2:
          case 4:
            return b + 250;
          case 8:
          case 16:
          case 32:
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return b + 5e3;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            return -1;
          case 134217728:
          case 268435456:
          case 536870912:
          case 1073741824:
            return -1;
          default:
            return -1;
        }
      }
      function wc(a, b) {
        for (var c = a.suspendedLanes, d = a.pingedLanes, e = a.expirationTimes, f = a.pendingLanes; 0 < f; ) {
          var g = 31 - oc(f), h = 1 << g, k = e[g];
          if (-1 === k) {
            if (0 === (h & c) || 0 !== (h & d)) e[g] = vc(h, b);
          } else k <= b && (a.expiredLanes |= h);
          f &= ~h;
        }
      }
      function xc(a) {
        a = a.pendingLanes & -1073741825;
        return 0 !== a ? a : a & 1073741824 ? 1073741824 : 0;
      }
      function yc() {
        var a = rc;
        rc <<= 1;
        0 === (rc & 4194240) && (rc = 64);
        return a;
      }
      function zc(a) {
        for (var b = [], c = 0; 31 > c; c++) b.push(a);
        return b;
      }
      function Ac(a, b, c) {
        a.pendingLanes |= b;
        536870912 !== b && (a.suspendedLanes = 0, a.pingedLanes = 0);
        a = a.eventTimes;
        b = 31 - oc(b);
        a[b] = c;
      }
      function Bc(a, b) {
        var c = a.pendingLanes & ~b;
        a.pendingLanes = b;
        a.suspendedLanes = 0;
        a.pingedLanes = 0;
        a.expiredLanes &= b;
        a.mutableReadLanes &= b;
        a.entangledLanes &= b;
        b = a.entanglements;
        var d = a.eventTimes;
        for (a = a.expirationTimes; 0 < c; ) {
          var e = 31 - oc(c), f = 1 << e;
          b[e] = 0;
          d[e] = -1;
          a[e] = -1;
          c &= ~f;
        }
      }
      function Cc(a, b) {
        var c = a.entangledLanes |= b;
        for (a = a.entanglements; c; ) {
          var d = 31 - oc(c), e = 1 << d;
          e & b | a[d] & b && (a[d] |= b);
          c &= ~e;
        }
      }
      var C = 0;
      function Dc(a) {
        a &= -a;
        return 1 < a ? 4 < a ? 0 !== (a & 268435455) ? 16 : 536870912 : 4 : 1;
      }
      var Ec;
      var Fc;
      var Gc;
      var Hc;
      var Ic;
      var Jc = false;
      var Kc = [];
      var Lc = null;
      var Mc = null;
      var Nc = null;
      var Oc = /* @__PURE__ */ new Map();
      var Pc = /* @__PURE__ */ new Map();
      var Qc = [];
      var Rc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
      function Sc(a, b) {
        switch (a) {
          case "focusin":
          case "focusout":
            Lc = null;
            break;
          case "dragenter":
          case "dragleave":
            Mc = null;
            break;
          case "mouseover":
          case "mouseout":
            Nc = null;
            break;
          case "pointerover":
          case "pointerout":
            Oc.delete(b.pointerId);
            break;
          case "gotpointercapture":
          case "lostpointercapture":
            Pc.delete(b.pointerId);
        }
      }
      function Tc(a, b, c, d, e, f) {
        if (null === a || a.nativeEvent !== f) return a = { blockedOn: b, domEventName: c, eventSystemFlags: d, nativeEvent: f, targetContainers: [e] }, null !== b && (b = Cb(b), null !== b && Fc(b)), a;
        a.eventSystemFlags |= d;
        b = a.targetContainers;
        null !== e && -1 === b.indexOf(e) && b.push(e);
        return a;
      }
      function Uc(a, b, c, d, e) {
        switch (b) {
          case "focusin":
            return Lc = Tc(Lc, a, b, c, d, e), true;
          case "dragenter":
            return Mc = Tc(Mc, a, b, c, d, e), true;
          case "mouseover":
            return Nc = Tc(Nc, a, b, c, d, e), true;
          case "pointerover":
            var f = e.pointerId;
            Oc.set(f, Tc(Oc.get(f) || null, a, b, c, d, e));
            return true;
          case "gotpointercapture":
            return f = e.pointerId, Pc.set(f, Tc(Pc.get(f) || null, a, b, c, d, e)), true;
        }
        return false;
      }
      function Vc(a) {
        var b = Wc(a.target);
        if (null !== b) {
          var c = Vb(b);
          if (null !== c) {
            if (b = c.tag, 13 === b) {
              if (b = Wb(c), null !== b) {
                a.blockedOn = b;
                Ic(a.priority, function() {
                  Gc(c);
                });
                return;
              }
            } else if (3 === b && c.stateNode.current.memoizedState.isDehydrated) {
              a.blockedOn = 3 === c.tag ? c.stateNode.containerInfo : null;
              return;
            }
          }
        }
        a.blockedOn = null;
      }
      function Xc(a) {
        if (null !== a.blockedOn) return false;
        for (var b = a.targetContainers; 0 < b.length; ) {
          var c = Yc(a.domEventName, a.eventSystemFlags, b[0], a.nativeEvent);
          if (null === c) {
            c = a.nativeEvent;
            var d = new c.constructor(c.type, c);
            wb = d;
            c.target.dispatchEvent(d);
            wb = null;
          } else return b = Cb(c), null !== b && Fc(b), a.blockedOn = c, false;
          b.shift();
        }
        return true;
      }
      function Zc(a, b, c) {
        Xc(a) && c.delete(b);
      }
      function $c() {
        Jc = false;
        null !== Lc && Xc(Lc) && (Lc = null);
        null !== Mc && Xc(Mc) && (Mc = null);
        null !== Nc && Xc(Nc) && (Nc = null);
        Oc.forEach(Zc);
        Pc.forEach(Zc);
      }
      function ad(a, b) {
        a.blockedOn === b && (a.blockedOn = null, Jc || (Jc = true, ca.unstable_scheduleCallback(ca.unstable_NormalPriority, $c)));
      }
      function bd(a) {
        function b(b2) {
          return ad(b2, a);
        }
        if (0 < Kc.length) {
          ad(Kc[0], a);
          for (var c = 1; c < Kc.length; c++) {
            var d = Kc[c];
            d.blockedOn === a && (d.blockedOn = null);
          }
        }
        null !== Lc && ad(Lc, a);
        null !== Mc && ad(Mc, a);
        null !== Nc && ad(Nc, a);
        Oc.forEach(b);
        Pc.forEach(b);
        for (c = 0; c < Qc.length; c++) d = Qc[c], d.blockedOn === a && (d.blockedOn = null);
        for (; 0 < Qc.length && (c = Qc[0], null === c.blockedOn); ) Vc(c), null === c.blockedOn && Qc.shift();
      }
      var cd = ua.ReactCurrentBatchConfig;
      var dd = true;
      function ed(a, b, c, d) {
        var e = C, f = cd.transition;
        cd.transition = null;
        try {
          C = 1, fd(a, b, c, d);
        } finally {
          C = e, cd.transition = f;
        }
      }
      function gd(a, b, c, d) {
        var e = C, f = cd.transition;
        cd.transition = null;
        try {
          C = 4, fd(a, b, c, d);
        } finally {
          C = e, cd.transition = f;
        }
      }
      function fd(a, b, c, d) {
        if (dd) {
          var e = Yc(a, b, c, d);
          if (null === e) hd(a, b, d, id, c), Sc(a, d);
          else if (Uc(e, a, b, c, d)) d.stopPropagation();
          else if (Sc(a, d), b & 4 && -1 < Rc.indexOf(a)) {
            for (; null !== e; ) {
              var f = Cb(e);
              null !== f && Ec(f);
              f = Yc(a, b, c, d);
              null === f && hd(a, b, d, id, c);
              if (f === e) break;
              e = f;
            }
            null !== e && d.stopPropagation();
          } else hd(a, b, d, null, c);
        }
      }
      var id = null;
      function Yc(a, b, c, d) {
        id = null;
        a = xb(d);
        a = Wc(a);
        if (null !== a) if (b = Vb(a), null === b) a = null;
        else if (c = b.tag, 13 === c) {
          a = Wb(b);
          if (null !== a) return a;
          a = null;
        } else if (3 === c) {
          if (b.stateNode.current.memoizedState.isDehydrated) return 3 === b.tag ? b.stateNode.containerInfo : null;
          a = null;
        } else b !== a && (a = null);
        id = a;
        return null;
      }
      function jd(a) {
        switch (a) {
          case "cancel":
          case "click":
          case "close":
          case "contextmenu":
          case "copy":
          case "cut":
          case "auxclick":
          case "dblclick":
          case "dragend":
          case "dragstart":
          case "drop":
          case "focusin":
          case "focusout":
          case "input":
          case "invalid":
          case "keydown":
          case "keypress":
          case "keyup":
          case "mousedown":
          case "mouseup":
          case "paste":
          case "pause":
          case "play":
          case "pointercancel":
          case "pointerdown":
          case "pointerup":
          case "ratechange":
          case "reset":
          case "resize":
          case "seeked":
          case "submit":
          case "touchcancel":
          case "touchend":
          case "touchstart":
          case "volumechange":
          case "change":
          case "selectionchange":
          case "textInput":
          case "compositionstart":
          case "compositionend":
          case "compositionupdate":
          case "beforeblur":
          case "afterblur":
          case "beforeinput":
          case "blur":
          case "fullscreenchange":
          case "focus":
          case "hashchange":
          case "popstate":
          case "select":
          case "selectstart":
            return 1;
          case "drag":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "mousemove":
          case "mouseout":
          case "mouseover":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "scroll":
          case "toggle":
          case "touchmove":
          case "wheel":
          case "mouseenter":
          case "mouseleave":
          case "pointerenter":
          case "pointerleave":
            return 4;
          case "message":
            switch (ec()) {
              case fc:
                return 1;
              case gc:
                return 4;
              case hc:
              case ic:
                return 16;
              case jc:
                return 536870912;
              default:
                return 16;
            }
          default:
            return 16;
        }
      }
      var kd = null;
      var ld = null;
      var md = null;
      function nd() {
        if (md) return md;
        var a, b = ld, c = b.length, d, e = "value" in kd ? kd.value : kd.textContent, f = e.length;
        for (a = 0; a < c && b[a] === e[a]; a++) ;
        var g = c - a;
        for (d = 1; d <= g && b[c - d] === e[f - d]; d++) ;
        return md = e.slice(a, 1 < d ? 1 - d : void 0);
      }
      function od(a) {
        var b = a.keyCode;
        "charCode" in a ? (a = a.charCode, 0 === a && 13 === b && (a = 13)) : a = b;
        10 === a && (a = 13);
        return 32 <= a || 13 === a ? a : 0;
      }
      function pd() {
        return true;
      }
      function qd() {
        return false;
      }
      function rd(a) {
        function b(b2, d, e, f, g) {
          this._reactName = b2;
          this._targetInst = e;
          this.type = d;
          this.nativeEvent = f;
          this.target = g;
          this.currentTarget = null;
          for (var c in a) a.hasOwnProperty(c) && (b2 = a[c], this[c] = b2 ? b2(f) : f[c]);
          this.isDefaultPrevented = (null != f.defaultPrevented ? f.defaultPrevented : false === f.returnValue) ? pd : qd;
          this.isPropagationStopped = qd;
          return this;
        }
        A(b.prototype, { preventDefault: function() {
          this.defaultPrevented = true;
          var a2 = this.nativeEvent;
          a2 && (a2.preventDefault ? a2.preventDefault() : "unknown" !== typeof a2.returnValue && (a2.returnValue = false), this.isDefaultPrevented = pd);
        }, stopPropagation: function() {
          var a2 = this.nativeEvent;
          a2 && (a2.stopPropagation ? a2.stopPropagation() : "unknown" !== typeof a2.cancelBubble && (a2.cancelBubble = true), this.isPropagationStopped = pd);
        }, persist: function() {
        }, isPersistent: pd });
        return b;
      }
      var sd = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(a) {
        return a.timeStamp || Date.now();
      }, defaultPrevented: 0, isTrusted: 0 };
      var td = rd(sd);
      var ud = A({}, sd, { view: 0, detail: 0 });
      var vd = rd(ud);
      var wd;
      var xd;
      var yd;
      var Ad = A({}, ud, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: zd, button: 0, buttons: 0, relatedTarget: function(a) {
        return void 0 === a.relatedTarget ? a.fromElement === a.srcElement ? a.toElement : a.fromElement : a.relatedTarget;
      }, movementX: function(a) {
        if ("movementX" in a) return a.movementX;
        a !== yd && (yd && "mousemove" === a.type ? (wd = a.screenX - yd.screenX, xd = a.screenY - yd.screenY) : xd = wd = 0, yd = a);
        return wd;
      }, movementY: function(a) {
        return "movementY" in a ? a.movementY : xd;
      } });
      var Bd = rd(Ad);
      var Cd = A({}, Ad, { dataTransfer: 0 });
      var Dd = rd(Cd);
      var Ed = A({}, ud, { relatedTarget: 0 });
      var Fd = rd(Ed);
      var Gd = A({}, sd, { animationName: 0, elapsedTime: 0, pseudoElement: 0 });
      var Hd = rd(Gd);
      var Id = A({}, sd, { clipboardData: function(a) {
        return "clipboardData" in a ? a.clipboardData : window.clipboardData;
      } });
      var Jd = rd(Id);
      var Kd = A({}, sd, { data: 0 });
      var Ld = rd(Kd);
      var Md = {
        Esc: "Escape",
        Spacebar: " ",
        Left: "ArrowLeft",
        Up: "ArrowUp",
        Right: "ArrowRight",
        Down: "ArrowDown",
        Del: "Delete",
        Win: "OS",
        Menu: "ContextMenu",
        Apps: "ContextMenu",
        Scroll: "ScrollLock",
        MozPrintableKey: "Unidentified"
      };
      var Nd = {
        8: "Backspace",
        9: "Tab",
        12: "Clear",
        13: "Enter",
        16: "Shift",
        17: "Control",
        18: "Alt",
        19: "Pause",
        20: "CapsLock",
        27: "Escape",
        32: " ",
        33: "PageUp",
        34: "PageDown",
        35: "End",
        36: "Home",
        37: "ArrowLeft",
        38: "ArrowUp",
        39: "ArrowRight",
        40: "ArrowDown",
        45: "Insert",
        46: "Delete",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12",
        144: "NumLock",
        145: "ScrollLock",
        224: "Meta"
      };
      var Od = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
      function Pd(a) {
        var b = this.nativeEvent;
        return b.getModifierState ? b.getModifierState(a) : (a = Od[a]) ? !!b[a] : false;
      }
      function zd() {
        return Pd;
      }
      var Qd = A({}, ud, { key: function(a) {
        if (a.key) {
          var b = Md[a.key] || a.key;
          if ("Unidentified" !== b) return b;
        }
        return "keypress" === a.type ? (a = od(a), 13 === a ? "Enter" : String.fromCharCode(a)) : "keydown" === a.type || "keyup" === a.type ? Nd[a.keyCode] || "Unidentified" : "";
      }, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: zd, charCode: function(a) {
        return "keypress" === a.type ? od(a) : 0;
      }, keyCode: function(a) {
        return "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
      }, which: function(a) {
        return "keypress" === a.type ? od(a) : "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
      } });
      var Rd = rd(Qd);
      var Sd = A({}, Ad, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 });
      var Td = rd(Sd);
      var Ud = A({}, ud, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: zd });
      var Vd = rd(Ud);
      var Wd = A({}, sd, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 });
      var Xd = rd(Wd);
      var Yd = A({}, Ad, {
        deltaX: function(a) {
          return "deltaX" in a ? a.deltaX : "wheelDeltaX" in a ? -a.wheelDeltaX : 0;
        },
        deltaY: function(a) {
          return "deltaY" in a ? a.deltaY : "wheelDeltaY" in a ? -a.wheelDeltaY : "wheelDelta" in a ? -a.wheelDelta : 0;
        },
        deltaZ: 0,
        deltaMode: 0
      });
      var Zd = rd(Yd);
      var $d = [9, 13, 27, 32];
      var ae = ia && "CompositionEvent" in window;
      var be = null;
      ia && "documentMode" in document && (be = document.documentMode);
      var ce = ia && "TextEvent" in window && !be;
      var de = ia && (!ae || be && 8 < be && 11 >= be);
      var ee = String.fromCharCode(32);
      var fe = false;
      function ge(a, b) {
        switch (a) {
          case "keyup":
            return -1 !== $d.indexOf(b.keyCode);
          case "keydown":
            return 229 !== b.keyCode;
          case "keypress":
          case "mousedown":
          case "focusout":
            return true;
          default:
            return false;
        }
      }
      function he(a) {
        a = a.detail;
        return "object" === typeof a && "data" in a ? a.data : null;
      }
      var ie = false;
      function je(a, b) {
        switch (a) {
          case "compositionend":
            return he(b);
          case "keypress":
            if (32 !== b.which) return null;
            fe = true;
            return ee;
          case "textInput":
            return a = b.data, a === ee && fe ? null : a;
          default:
            return null;
        }
      }
      function ke(a, b) {
        if (ie) return "compositionend" === a || !ae && ge(a, b) ? (a = nd(), md = ld = kd = null, ie = false, a) : null;
        switch (a) {
          case "paste":
            return null;
          case "keypress":
            if (!(b.ctrlKey || b.altKey || b.metaKey) || b.ctrlKey && b.altKey) {
              if (b.char && 1 < b.char.length) return b.char;
              if (b.which) return String.fromCharCode(b.which);
            }
            return null;
          case "compositionend":
            return de && "ko" !== b.locale ? null : b.data;
          default:
            return null;
        }
      }
      var le = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
      function me(a) {
        var b = a && a.nodeName && a.nodeName.toLowerCase();
        return "input" === b ? !!le[a.type] : "textarea" === b ? true : false;
      }
      function ne(a, b, c, d) {
        Eb(d);
        b = oe(b, "onChange");
        0 < b.length && (c = new td("onChange", "change", null, c, d), a.push({ event: c, listeners: b }));
      }
      var pe = null;
      var qe = null;
      function re(a) {
        se(a, 0);
      }
      function te(a) {
        var b = ue(a);
        if (Wa(b)) return a;
      }
      function ve(a, b) {
        if ("change" === a) return b;
      }
      var we = false;
      if (ia) {
        if (ia) {
          ye = "oninput" in document;
          if (!ye) {
            ze = document.createElement("div");
            ze.setAttribute("oninput", "return;");
            ye = "function" === typeof ze.oninput;
          }
          xe = ye;
        } else xe = false;
        we = xe && (!document.documentMode || 9 < document.documentMode);
      }
      var xe;
      var ye;
      var ze;
      function Ae() {
        pe && (pe.detachEvent("onpropertychange", Be), qe = pe = null);
      }
      function Be(a) {
        if ("value" === a.propertyName && te(qe)) {
          var b = [];
          ne(b, qe, a, xb(a));
          Jb(re, b);
        }
      }
      function Ce(a, b, c) {
        "focusin" === a ? (Ae(), pe = b, qe = c, pe.attachEvent("onpropertychange", Be)) : "focusout" === a && Ae();
      }
      function De(a) {
        if ("selectionchange" === a || "keyup" === a || "keydown" === a) return te(qe);
      }
      function Ee(a, b) {
        if ("click" === a) return te(b);
      }
      function Fe(a, b) {
        if ("input" === a || "change" === a) return te(b);
      }
      function Ge(a, b) {
        return a === b && (0 !== a || 1 / a === 1 / b) || a !== a && b !== b;
      }
      var He = "function" === typeof Object.is ? Object.is : Ge;
      function Ie(a, b) {
        if (He(a, b)) return true;
        if ("object" !== typeof a || null === a || "object" !== typeof b || null === b) return false;
        var c = Object.keys(a), d = Object.keys(b);
        if (c.length !== d.length) return false;
        for (d = 0; d < c.length; d++) {
          var e = c[d];
          if (!ja.call(b, e) || !He(a[e], b[e])) return false;
        }
        return true;
      }
      function Je(a) {
        for (; a && a.firstChild; ) a = a.firstChild;
        return a;
      }
      function Ke(a, b) {
        var c = Je(a);
        a = 0;
        for (var d; c; ) {
          if (3 === c.nodeType) {
            d = a + c.textContent.length;
            if (a <= b && d >= b) return { node: c, offset: b - a };
            a = d;
          }
          a: {
            for (; c; ) {
              if (c.nextSibling) {
                c = c.nextSibling;
                break a;
              }
              c = c.parentNode;
            }
            c = void 0;
          }
          c = Je(c);
        }
      }
      function Le(a, b) {
        return a && b ? a === b ? true : a && 3 === a.nodeType ? false : b && 3 === b.nodeType ? Le(a, b.parentNode) : "contains" in a ? a.contains(b) : a.compareDocumentPosition ? !!(a.compareDocumentPosition(b) & 16) : false : false;
      }
      function Me() {
        for (var a = window, b = Xa(); b instanceof a.HTMLIFrameElement; ) {
          try {
            var c = "string" === typeof b.contentWindow.location.href;
          } catch (d) {
            c = false;
          }
          if (c) a = b.contentWindow;
          else break;
          b = Xa(a.document);
        }
        return b;
      }
      function Ne(a) {
        var b = a && a.nodeName && a.nodeName.toLowerCase();
        return b && ("input" === b && ("text" === a.type || "search" === a.type || "tel" === a.type || "url" === a.type || "password" === a.type) || "textarea" === b || "true" === a.contentEditable);
      }
      function Oe(a) {
        var b = Me(), c = a.focusedElem, d = a.selectionRange;
        if (b !== c && c && c.ownerDocument && Le(c.ownerDocument.documentElement, c)) {
          if (null !== d && Ne(c)) {
            if (b = d.start, a = d.end, void 0 === a && (a = b), "selectionStart" in c) c.selectionStart = b, c.selectionEnd = Math.min(a, c.value.length);
            else if (a = (b = c.ownerDocument || document) && b.defaultView || window, a.getSelection) {
              a = a.getSelection();
              var e = c.textContent.length, f = Math.min(d.start, e);
              d = void 0 === d.end ? f : Math.min(d.end, e);
              !a.extend && f > d && (e = d, d = f, f = e);
              e = Ke(c, f);
              var g = Ke(
                c,
                d
              );
              e && g && (1 !== a.rangeCount || a.anchorNode !== e.node || a.anchorOffset !== e.offset || a.focusNode !== g.node || a.focusOffset !== g.offset) && (b = b.createRange(), b.setStart(e.node, e.offset), a.removeAllRanges(), f > d ? (a.addRange(b), a.extend(g.node, g.offset)) : (b.setEnd(g.node, g.offset), a.addRange(b)));
            }
          }
          b = [];
          for (a = c; a = a.parentNode; ) 1 === a.nodeType && b.push({ element: a, left: a.scrollLeft, top: a.scrollTop });
          "function" === typeof c.focus && c.focus();
          for (c = 0; c < b.length; c++) a = b[c], a.element.scrollLeft = a.left, a.element.scrollTop = a.top;
        }
      }
      var Pe = ia && "documentMode" in document && 11 >= document.documentMode;
      var Qe = null;
      var Re = null;
      var Se = null;
      var Te = false;
      function Ue(a, b, c) {
        var d = c.window === c ? c.document : 9 === c.nodeType ? c : c.ownerDocument;
        Te || null == Qe || Qe !== Xa(d) || (d = Qe, "selectionStart" in d && Ne(d) ? d = { start: d.selectionStart, end: d.selectionEnd } : (d = (d.ownerDocument && d.ownerDocument.defaultView || window).getSelection(), d = { anchorNode: d.anchorNode, anchorOffset: d.anchorOffset, focusNode: d.focusNode, focusOffset: d.focusOffset }), Se && Ie(Se, d) || (Se = d, d = oe(Re, "onSelect"), 0 < d.length && (b = new td("onSelect", "select", null, b, c), a.push({ event: b, listeners: d }), b.target = Qe)));
      }
      function Ve(a, b) {
        var c = {};
        c[a.toLowerCase()] = b.toLowerCase();
        c["Webkit" + a] = "webkit" + b;
        c["Moz" + a] = "moz" + b;
        return c;
      }
      var We = { animationend: Ve("Animation", "AnimationEnd"), animationiteration: Ve("Animation", "AnimationIteration"), animationstart: Ve("Animation", "AnimationStart"), transitionend: Ve("Transition", "TransitionEnd") };
      var Xe = {};
      var Ye = {};
      ia && (Ye = document.createElement("div").style, "AnimationEvent" in window || (delete We.animationend.animation, delete We.animationiteration.animation, delete We.animationstart.animation), "TransitionEvent" in window || delete We.transitionend.transition);
      function Ze(a) {
        if (Xe[a]) return Xe[a];
        if (!We[a]) return a;
        var b = We[a], c;
        for (c in b) if (b.hasOwnProperty(c) && c in Ye) return Xe[a] = b[c];
        return a;
      }
      var $e = Ze("animationend");
      var af = Ze("animationiteration");
      var bf = Ze("animationstart");
      var cf = Ze("transitionend");
      var df = /* @__PURE__ */ new Map();
      var ef = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
      function ff(a, b) {
        df.set(a, b);
        fa(b, [a]);
      }
      for (gf = 0; gf < ef.length; gf++) {
        hf = ef[gf], jf = hf.toLowerCase(), kf = hf[0].toUpperCase() + hf.slice(1);
        ff(jf, "on" + kf);
      }
      var hf;
      var jf;
      var kf;
      var gf;
      ff($e, "onAnimationEnd");
      ff(af, "onAnimationIteration");
      ff(bf, "onAnimationStart");
      ff("dblclick", "onDoubleClick");
      ff("focusin", "onFocus");
      ff("focusout", "onBlur");
      ff(cf, "onTransitionEnd");
      ha("onMouseEnter", ["mouseout", "mouseover"]);
      ha("onMouseLeave", ["mouseout", "mouseover"]);
      ha("onPointerEnter", ["pointerout", "pointerover"]);
      ha("onPointerLeave", ["pointerout", "pointerover"]);
      fa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
      fa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
      fa("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
      fa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
      fa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
      fa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
      var lf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" ");
      var mf = new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
      function nf(a, b, c) {
        var d = a.type || "unknown-event";
        a.currentTarget = c;
        Ub(d, b, void 0, a);
        a.currentTarget = null;
      }
      function se(a, b) {
        b = 0 !== (b & 4);
        for (var c = 0; c < a.length; c++) {
          var d = a[c], e = d.event;
          d = d.listeners;
          a: {
            var f = void 0;
            if (b) for (var g = d.length - 1; 0 <= g; g--) {
              var h = d[g], k = h.instance, l = h.currentTarget;
              h = h.listener;
              if (k !== f && e.isPropagationStopped()) break a;
              nf(e, h, l);
              f = k;
            }
            else for (g = 0; g < d.length; g++) {
              h = d[g];
              k = h.instance;
              l = h.currentTarget;
              h = h.listener;
              if (k !== f && e.isPropagationStopped()) break a;
              nf(e, h, l);
              f = k;
            }
          }
        }
        if (Qb) throw a = Rb, Qb = false, Rb = null, a;
      }
      function D(a, b) {
        var c = b[of];
        void 0 === c && (c = b[of] = /* @__PURE__ */ new Set());
        var d = a + "__bubble";
        c.has(d) || (pf(b, a, 2, false), c.add(d));
      }
      function qf(a, b, c) {
        var d = 0;
        b && (d |= 4);
        pf(c, a, d, b);
      }
      var rf = "_reactListening" + Math.random().toString(36).slice(2);
      function sf(a) {
        if (!a[rf]) {
          a[rf] = true;
          da.forEach(function(b2) {
            "selectionchange" !== b2 && (mf.has(b2) || qf(b2, false, a), qf(b2, true, a));
          });
          var b = 9 === a.nodeType ? a : a.ownerDocument;
          null === b || b[rf] || (b[rf] = true, qf("selectionchange", false, b));
        }
      }
      function pf(a, b, c, d) {
        switch (jd(b)) {
          case 1:
            var e = ed;
            break;
          case 4:
            e = gd;
            break;
          default:
            e = fd;
        }
        c = e.bind(null, b, c, a);
        e = void 0;
        !Lb || "touchstart" !== b && "touchmove" !== b && "wheel" !== b || (e = true);
        d ? void 0 !== e ? a.addEventListener(b, c, { capture: true, passive: e }) : a.addEventListener(b, c, true) : void 0 !== e ? a.addEventListener(b, c, { passive: e }) : a.addEventListener(b, c, false);
      }
      function hd(a, b, c, d, e) {
        var f = d;
        if (0 === (b & 1) && 0 === (b & 2) && null !== d) a: for (; ; ) {
          if (null === d) return;
          var g = d.tag;
          if (3 === g || 4 === g) {
            var h = d.stateNode.containerInfo;
            if (h === e || 8 === h.nodeType && h.parentNode === e) break;
            if (4 === g) for (g = d.return; null !== g; ) {
              var k = g.tag;
              if (3 === k || 4 === k) {
                if (k = g.stateNode.containerInfo, k === e || 8 === k.nodeType && k.parentNode === e) return;
              }
              g = g.return;
            }
            for (; null !== h; ) {
              g = Wc(h);
              if (null === g) return;
              k = g.tag;
              if (5 === k || 6 === k) {
                d = f = g;
                continue a;
              }
              h = h.parentNode;
            }
          }
          d = d.return;
        }
        Jb(function() {
          var d2 = f, e2 = xb(c), g2 = [];
          a: {
            var h2 = df.get(a);
            if (void 0 !== h2) {
              var k2 = td, n = a;
              switch (a) {
                case "keypress":
                  if (0 === od(c)) break a;
                case "keydown":
                case "keyup":
                  k2 = Rd;
                  break;
                case "focusin":
                  n = "focus";
                  k2 = Fd;
                  break;
                case "focusout":
                  n = "blur";
                  k2 = Fd;
                  break;
                case "beforeblur":
                case "afterblur":
                  k2 = Fd;
                  break;
                case "click":
                  if (2 === c.button) break a;
                case "auxclick":
                case "dblclick":
                case "mousedown":
                case "mousemove":
                case "mouseup":
                case "mouseout":
                case "mouseover":
                case "contextmenu":
                  k2 = Bd;
                  break;
                case "drag":
                case "dragend":
                case "dragenter":
                case "dragexit":
                case "dragleave":
                case "dragover":
                case "dragstart":
                case "drop":
                  k2 = Dd;
                  break;
                case "touchcancel":
                case "touchend":
                case "touchmove":
                case "touchstart":
                  k2 = Vd;
                  break;
                case $e:
                case af:
                case bf:
                  k2 = Hd;
                  break;
                case cf:
                  k2 = Xd;
                  break;
                case "scroll":
                  k2 = vd;
                  break;
                case "wheel":
                  k2 = Zd;
                  break;
                case "copy":
                case "cut":
                case "paste":
                  k2 = Jd;
                  break;
                case "gotpointercapture":
                case "lostpointercapture":
                case "pointercancel":
                case "pointerdown":
                case "pointermove":
                case "pointerout":
                case "pointerover":
                case "pointerup":
                  k2 = Td;
              }
              var t = 0 !== (b & 4), J = !t && "scroll" === a, x = t ? null !== h2 ? h2 + "Capture" : null : h2;
              t = [];
              for (var w = d2, u; null !== w; ) {
                u = w;
                var F = u.stateNode;
                5 === u.tag && null !== F && (u = F, null !== x && (F = Kb(w, x), null != F && t.push(tf(w, F, u))));
                if (J) break;
                w = w.return;
              }
              0 < t.length && (h2 = new k2(h2, n, null, c, e2), g2.push({ event: h2, listeners: t }));
            }
          }
          if (0 === (b & 7)) {
            a: {
              h2 = "mouseover" === a || "pointerover" === a;
              k2 = "mouseout" === a || "pointerout" === a;
              if (h2 && c !== wb && (n = c.relatedTarget || c.fromElement) && (Wc(n) || n[uf])) break a;
              if (k2 || h2) {
                h2 = e2.window === e2 ? e2 : (h2 = e2.ownerDocument) ? h2.defaultView || h2.parentWindow : window;
                if (k2) {
                  if (n = c.relatedTarget || c.toElement, k2 = d2, n = n ? Wc(n) : null, null !== n && (J = Vb(n), n !== J || 5 !== n.tag && 6 !== n.tag)) n = null;
                } else k2 = null, n = d2;
                if (k2 !== n) {
                  t = Bd;
                  F = "onMouseLeave";
                  x = "onMouseEnter";
                  w = "mouse";
                  if ("pointerout" === a || "pointerover" === a) t = Td, F = "onPointerLeave", x = "onPointerEnter", w = "pointer";
                  J = null == k2 ? h2 : ue(k2);
                  u = null == n ? h2 : ue(n);
                  h2 = new t(F, w + "leave", k2, c, e2);
                  h2.target = J;
                  h2.relatedTarget = u;
                  F = null;
                  Wc(e2) === d2 && (t = new t(x, w + "enter", n, c, e2), t.target = u, t.relatedTarget = J, F = t);
                  J = F;
                  if (k2 && n) b: {
                    t = k2;
                    x = n;
                    w = 0;
                    for (u = t; u; u = vf(u)) w++;
                    u = 0;
                    for (F = x; F; F = vf(F)) u++;
                    for (; 0 < w - u; ) t = vf(t), w--;
                    for (; 0 < u - w; ) x = vf(x), u--;
                    for (; w--; ) {
                      if (t === x || null !== x && t === x.alternate) break b;
                      t = vf(t);
                      x = vf(x);
                    }
                    t = null;
                  }
                  else t = null;
                  null !== k2 && wf(g2, h2, k2, t, false);
                  null !== n && null !== J && wf(g2, J, n, t, true);
                }
              }
            }
            a: {
              h2 = d2 ? ue(d2) : window;
              k2 = h2.nodeName && h2.nodeName.toLowerCase();
              if ("select" === k2 || "input" === k2 && "file" === h2.type) var na = ve;
              else if (me(h2)) if (we) na = Fe;
              else {
                na = De;
                var xa = Ce;
              }
              else (k2 = h2.nodeName) && "input" === k2.toLowerCase() && ("checkbox" === h2.type || "radio" === h2.type) && (na = Ee);
              if (na && (na = na(a, d2))) {
                ne(g2, na, c, e2);
                break a;
              }
              xa && xa(a, h2, d2);
              "focusout" === a && (xa = h2._wrapperState) && xa.controlled && "number" === h2.type && cb(h2, "number", h2.value);
            }
            xa = d2 ? ue(d2) : window;
            switch (a) {
              case "focusin":
                if (me(xa) || "true" === xa.contentEditable) Qe = xa, Re = d2, Se = null;
                break;
              case "focusout":
                Se = Re = Qe = null;
                break;
              case "mousedown":
                Te = true;
                break;
              case "contextmenu":
              case "mouseup":
              case "dragend":
                Te = false;
                Ue(g2, c, e2);
                break;
              case "selectionchange":
                if (Pe) break;
              case "keydown":
              case "keyup":
                Ue(g2, c, e2);
            }
            var $a;
            if (ae) b: {
              switch (a) {
                case "compositionstart":
                  var ba = "onCompositionStart";
                  break b;
                case "compositionend":
                  ba = "onCompositionEnd";
                  break b;
                case "compositionupdate":
                  ba = "onCompositionUpdate";
                  break b;
              }
              ba = void 0;
            }
            else ie ? ge(a, c) && (ba = "onCompositionEnd") : "keydown" === a && 229 === c.keyCode && (ba = "onCompositionStart");
            ba && (de && "ko" !== c.locale && (ie || "onCompositionStart" !== ba ? "onCompositionEnd" === ba && ie && ($a = nd()) : (kd = e2, ld = "value" in kd ? kd.value : kd.textContent, ie = true)), xa = oe(d2, ba), 0 < xa.length && (ba = new Ld(ba, a, null, c, e2), g2.push({ event: ba, listeners: xa }), $a ? ba.data = $a : ($a = he(c), null !== $a && (ba.data = $a))));
            if ($a = ce ? je(a, c) : ke(a, c)) d2 = oe(d2, "onBeforeInput"), 0 < d2.length && (e2 = new Ld("onBeforeInput", "beforeinput", null, c, e2), g2.push({ event: e2, listeners: d2 }), e2.data = $a);
          }
          se(g2, b);
        });
      }
      function tf(a, b, c) {
        return { instance: a, listener: b, currentTarget: c };
      }
      function oe(a, b) {
        for (var c = b + "Capture", d = []; null !== a; ) {
          var e = a, f = e.stateNode;
          5 === e.tag && null !== f && (e = f, f = Kb(a, c), null != f && d.unshift(tf(a, f, e)), f = Kb(a, b), null != f && d.push(tf(a, f, e)));
          a = a.return;
        }
        return d;
      }
      function vf(a) {
        if (null === a) return null;
        do
          a = a.return;
        while (a && 5 !== a.tag);
        return a ? a : null;
      }
      function wf(a, b, c, d, e) {
        for (var f = b._reactName, g = []; null !== c && c !== d; ) {
          var h = c, k = h.alternate, l = h.stateNode;
          if (null !== k && k === d) break;
          5 === h.tag && null !== l && (h = l, e ? (k = Kb(c, f), null != k && g.unshift(tf(c, k, h))) : e || (k = Kb(c, f), null != k && g.push(tf(c, k, h))));
          c = c.return;
        }
        0 !== g.length && a.push({ event: b, listeners: g });
      }
      var xf = /\r\n?/g;
      var yf = /\u0000|\uFFFD/g;
      function zf(a) {
        return ("string" === typeof a ? a : "" + a).replace(xf, "\n").replace(yf, "");
      }
      function Af(a, b, c) {
        b = zf(b);
        if (zf(a) !== b && c) throw Error(p(425));
      }
      function Bf() {
      }
      var Cf = null;
      var Df = null;
      function Ef(a, b) {
        return "textarea" === a || "noscript" === a || "string" === typeof b.children || "number" === typeof b.children || "object" === typeof b.dangerouslySetInnerHTML && null !== b.dangerouslySetInnerHTML && null != b.dangerouslySetInnerHTML.__html;
      }
      var Ff = "function" === typeof setTimeout ? setTimeout : void 0;
      var Gf = "function" === typeof clearTimeout ? clearTimeout : void 0;
      var Hf = "function" === typeof Promise ? Promise : void 0;
      var Jf = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof Hf ? function(a) {
        return Hf.resolve(null).then(a).catch(If);
      } : Ff;
      function If(a) {
        setTimeout(function() {
          throw a;
        });
      }
      function Kf(a, b) {
        var c = b, d = 0;
        do {
          var e = c.nextSibling;
          a.removeChild(c);
          if (e && 8 === e.nodeType) if (c = e.data, "/$" === c) {
            if (0 === d) {
              a.removeChild(e);
              bd(b);
              return;
            }
            d--;
          } else "$" !== c && "$?" !== c && "$!" !== c || d++;
          c = e;
        } while (c);
        bd(b);
      }
      function Lf(a) {
        for (; null != a; a = a.nextSibling) {
          var b = a.nodeType;
          if (1 === b || 3 === b) break;
          if (8 === b) {
            b = a.data;
            if ("$" === b || "$!" === b || "$?" === b) break;
            if ("/$" === b) return null;
          }
        }
        return a;
      }
      function Mf(a) {
        a = a.previousSibling;
        for (var b = 0; a; ) {
          if (8 === a.nodeType) {
            var c = a.data;
            if ("$" === c || "$!" === c || "$?" === c) {
              if (0 === b) return a;
              b--;
            } else "/$" === c && b++;
          }
          a = a.previousSibling;
        }
        return null;
      }
      var Nf = Math.random().toString(36).slice(2);
      var Of = "__reactFiber$" + Nf;
      var Pf = "__reactProps$" + Nf;
      var uf = "__reactContainer$" + Nf;
      var of = "__reactEvents$" + Nf;
      var Qf = "__reactListeners$" + Nf;
      var Rf = "__reactHandles$" + Nf;
      function Wc(a) {
        var b = a[Of];
        if (b) return b;
        for (var c = a.parentNode; c; ) {
          if (b = c[uf] || c[Of]) {
            c = b.alternate;
            if (null !== b.child || null !== c && null !== c.child) for (a = Mf(a); null !== a; ) {
              if (c = a[Of]) return c;
              a = Mf(a);
            }
            return b;
          }
          a = c;
          c = a.parentNode;
        }
        return null;
      }
      function Cb(a) {
        a = a[Of] || a[uf];
        return !a || 5 !== a.tag && 6 !== a.tag && 13 !== a.tag && 3 !== a.tag ? null : a;
      }
      function ue(a) {
        if (5 === a.tag || 6 === a.tag) return a.stateNode;
        throw Error(p(33));
      }
      function Db(a) {
        return a[Pf] || null;
      }
      var Sf = [];
      var Tf = -1;
      function Uf(a) {
        return { current: a };
      }
      function E(a) {
        0 > Tf || (a.current = Sf[Tf], Sf[Tf] = null, Tf--);
      }
      function G(a, b) {
        Tf++;
        Sf[Tf] = a.current;
        a.current = b;
      }
      var Vf = {};
      var H = Uf(Vf);
      var Wf = Uf(false);
      var Xf = Vf;
      function Yf(a, b) {
        var c = a.type.contextTypes;
        if (!c) return Vf;
        var d = a.stateNode;
        if (d && d.__reactInternalMemoizedUnmaskedChildContext === b) return d.__reactInternalMemoizedMaskedChildContext;
        var e = {}, f;
        for (f in c) e[f] = b[f];
        d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = b, a.__reactInternalMemoizedMaskedChildContext = e);
        return e;
      }
      function Zf(a) {
        a = a.childContextTypes;
        return null !== a && void 0 !== a;
      }
      function $f() {
        E(Wf);
        E(H);
      }
      function ag(a, b, c) {
        if (H.current !== Vf) throw Error(p(168));
        G(H, b);
        G(Wf, c);
      }
      function bg(a, b, c) {
        var d = a.stateNode;
        b = b.childContextTypes;
        if ("function" !== typeof d.getChildContext) return c;
        d = d.getChildContext();
        for (var e in d) if (!(e in b)) throw Error(p(108, Ra(a) || "Unknown", e));
        return A({}, c, d);
      }
      function cg(a) {
        a = (a = a.stateNode) && a.__reactInternalMemoizedMergedChildContext || Vf;
        Xf = H.current;
        G(H, a);
        G(Wf, Wf.current);
        return true;
      }
      function dg(a, b, c) {
        var d = a.stateNode;
        if (!d) throw Error(p(169));
        c ? (a = bg(a, b, Xf), d.__reactInternalMemoizedMergedChildContext = a, E(Wf), E(H), G(H, a)) : E(Wf);
        G(Wf, c);
      }
      var eg = null;
      var fg = false;
      var gg = false;
      function hg(a) {
        null === eg ? eg = [a] : eg.push(a);
      }
      function ig(a) {
        fg = true;
        hg(a);
      }
      function jg() {
        if (!gg && null !== eg) {
          gg = true;
          var a = 0, b = C;
          try {
            var c = eg;
            for (C = 1; a < c.length; a++) {
              var d = c[a];
              do
                d = d(true);
              while (null !== d);
            }
            eg = null;
            fg = false;
          } catch (e) {
            throw null !== eg && (eg = eg.slice(a + 1)), ac(fc, jg), e;
          } finally {
            C = b, gg = false;
          }
        }
        return null;
      }
      var kg = [];
      var lg = 0;
      var mg = null;
      var ng = 0;
      var og = [];
      var pg = 0;
      var qg = null;
      var rg = 1;
      var sg = "";
      function tg(a, b) {
        kg[lg++] = ng;
        kg[lg++] = mg;
        mg = a;
        ng = b;
      }
      function ug(a, b, c) {
        og[pg++] = rg;
        og[pg++] = sg;
        og[pg++] = qg;
        qg = a;
        var d = rg;
        a = sg;
        var e = 32 - oc(d) - 1;
        d &= ~(1 << e);
        c += 1;
        var f = 32 - oc(b) + e;
        if (30 < f) {
          var g = e - e % 5;
          f = (d & (1 << g) - 1).toString(32);
          d >>= g;
          e -= g;
          rg = 1 << 32 - oc(b) + e | c << e | d;
          sg = f + a;
        } else rg = 1 << f | c << e | d, sg = a;
      }
      function vg(a) {
        null !== a.return && (tg(a, 1), ug(a, 1, 0));
      }
      function wg(a) {
        for (; a === mg; ) mg = kg[--lg], kg[lg] = null, ng = kg[--lg], kg[lg] = null;
        for (; a === qg; ) qg = og[--pg], og[pg] = null, sg = og[--pg], og[pg] = null, rg = og[--pg], og[pg] = null;
      }
      var xg = null;
      var yg = null;
      var I2 = false;
      var zg = null;
      function Ag(a, b) {
        var c = Bg(5, null, null, 0);
        c.elementType = "DELETED";
        c.stateNode = b;
        c.return = a;
        b = a.deletions;
        null === b ? (a.deletions = [c], a.flags |= 16) : b.push(c);
      }
      function Cg(a, b) {
        switch (a.tag) {
          case 5:
            var c = a.type;
            b = 1 !== b.nodeType || c.toLowerCase() !== b.nodeName.toLowerCase() ? null : b;
            return null !== b ? (a.stateNode = b, xg = a, yg = Lf(b.firstChild), true) : false;
          case 6:
            return b = "" === a.pendingProps || 3 !== b.nodeType ? null : b, null !== b ? (a.stateNode = b, xg = a, yg = null, true) : false;
          case 13:
            return b = 8 !== b.nodeType ? null : b, null !== b ? (c = null !== qg ? { id: rg, overflow: sg } : null, a.memoizedState = { dehydrated: b, treeContext: c, retryLane: 1073741824 }, c = Bg(18, null, null, 0), c.stateNode = b, c.return = a, a.child = c, xg = a, yg = null, true) : false;
          default:
            return false;
        }
      }
      function Dg(a) {
        return 0 !== (a.mode & 1) && 0 === (a.flags & 128);
      }
      function Eg(a) {
        if (I2) {
          var b = yg;
          if (b) {
            var c = b;
            if (!Cg(a, b)) {
              if (Dg(a)) throw Error(p(418));
              b = Lf(c.nextSibling);
              var d = xg;
              b && Cg(a, b) ? Ag(d, c) : (a.flags = a.flags & -4097 | 2, I2 = false, xg = a);
            }
          } else {
            if (Dg(a)) throw Error(p(418));
            a.flags = a.flags & -4097 | 2;
            I2 = false;
            xg = a;
          }
        }
      }
      function Fg(a) {
        for (a = a.return; null !== a && 5 !== a.tag && 3 !== a.tag && 13 !== a.tag; ) a = a.return;
        xg = a;
      }
      function Gg(a) {
        if (a !== xg) return false;
        if (!I2) return Fg(a), I2 = true, false;
        var b;
        (b = 3 !== a.tag) && !(b = 5 !== a.tag) && (b = a.type, b = "head" !== b && "body" !== b && !Ef(a.type, a.memoizedProps));
        if (b && (b = yg)) {
          if (Dg(a)) throw Hg(), Error(p(418));
          for (; b; ) Ag(a, b), b = Lf(b.nextSibling);
        }
        Fg(a);
        if (13 === a.tag) {
          a = a.memoizedState;
          a = null !== a ? a.dehydrated : null;
          if (!a) throw Error(p(317));
          a: {
            a = a.nextSibling;
            for (b = 0; a; ) {
              if (8 === a.nodeType) {
                var c = a.data;
                if ("/$" === c) {
                  if (0 === b) {
                    yg = Lf(a.nextSibling);
                    break a;
                  }
                  b--;
                } else "$" !== c && "$!" !== c && "$?" !== c || b++;
              }
              a = a.nextSibling;
            }
            yg = null;
          }
        } else yg = xg ? Lf(a.stateNode.nextSibling) : null;
        return true;
      }
      function Hg() {
        for (var a = yg; a; ) a = Lf(a.nextSibling);
      }
      function Ig() {
        yg = xg = null;
        I2 = false;
      }
      function Jg(a) {
        null === zg ? zg = [a] : zg.push(a);
      }
      var Kg = ua.ReactCurrentBatchConfig;
      function Lg(a, b, c) {
        a = c.ref;
        if (null !== a && "function" !== typeof a && "object" !== typeof a) {
          if (c._owner) {
            c = c._owner;
            if (c) {
              if (1 !== c.tag) throw Error(p(309));
              var d = c.stateNode;
            }
            if (!d) throw Error(p(147, a));
            var e = d, f = "" + a;
            if (null !== b && null !== b.ref && "function" === typeof b.ref && b.ref._stringRef === f) return b.ref;
            b = function(a2) {
              var b2 = e.refs;
              null === a2 ? delete b2[f] : b2[f] = a2;
            };
            b._stringRef = f;
            return b;
          }
          if ("string" !== typeof a) throw Error(p(284));
          if (!c._owner) throw Error(p(290, a));
        }
        return a;
      }
      function Mg(a, b) {
        a = Object.prototype.toString.call(b);
        throw Error(p(31, "[object Object]" === a ? "object with keys {" + Object.keys(b).join(", ") + "}" : a));
      }
      function Ng(a) {
        var b = a._init;
        return b(a._payload);
      }
      function Og(a) {
        function b(b2, c2) {
          if (a) {
            var d2 = b2.deletions;
            null === d2 ? (b2.deletions = [c2], b2.flags |= 16) : d2.push(c2);
          }
        }
        function c(c2, d2) {
          if (!a) return null;
          for (; null !== d2; ) b(c2, d2), d2 = d2.sibling;
          return null;
        }
        function d(a2, b2) {
          for (a2 = /* @__PURE__ */ new Map(); null !== b2; ) null !== b2.key ? a2.set(b2.key, b2) : a2.set(b2.index, b2), b2 = b2.sibling;
          return a2;
        }
        function e(a2, b2) {
          a2 = Pg(a2, b2);
          a2.index = 0;
          a2.sibling = null;
          return a2;
        }
        function f(b2, c2, d2) {
          b2.index = d2;
          if (!a) return b2.flags |= 1048576, c2;
          d2 = b2.alternate;
          if (null !== d2) return d2 = d2.index, d2 < c2 ? (b2.flags |= 2, c2) : d2;
          b2.flags |= 2;
          return c2;
        }
        function g(b2) {
          a && null === b2.alternate && (b2.flags |= 2);
          return b2;
        }
        function h(a2, b2, c2, d2) {
          if (null === b2 || 6 !== b2.tag) return b2 = Qg(c2, a2.mode, d2), b2.return = a2, b2;
          b2 = e(b2, c2);
          b2.return = a2;
          return b2;
        }
        function k(a2, b2, c2, d2) {
          var f2 = c2.type;
          if (f2 === ya) return m(a2, b2, c2.props.children, d2, c2.key);
          if (null !== b2 && (b2.elementType === f2 || "object" === typeof f2 && null !== f2 && f2.$$typeof === Ha && Ng(f2) === b2.type)) return d2 = e(b2, c2.props), d2.ref = Lg(a2, b2, c2), d2.return = a2, d2;
          d2 = Rg(c2.type, c2.key, c2.props, null, a2.mode, d2);
          d2.ref = Lg(a2, b2, c2);
          d2.return = a2;
          return d2;
        }
        function l(a2, b2, c2, d2) {
          if (null === b2 || 4 !== b2.tag || b2.stateNode.containerInfo !== c2.containerInfo || b2.stateNode.implementation !== c2.implementation) return b2 = Sg(c2, a2.mode, d2), b2.return = a2, b2;
          b2 = e(b2, c2.children || []);
          b2.return = a2;
          return b2;
        }
        function m(a2, b2, c2, d2, f2) {
          if (null === b2 || 7 !== b2.tag) return b2 = Tg(c2, a2.mode, d2, f2), b2.return = a2, b2;
          b2 = e(b2, c2);
          b2.return = a2;
          return b2;
        }
        function q(a2, b2, c2) {
          if ("string" === typeof b2 && "" !== b2 || "number" === typeof b2) return b2 = Qg("" + b2, a2.mode, c2), b2.return = a2, b2;
          if ("object" === typeof b2 && null !== b2) {
            switch (b2.$$typeof) {
              case va:
                return c2 = Rg(b2.type, b2.key, b2.props, null, a2.mode, c2), c2.ref = Lg(a2, null, b2), c2.return = a2, c2;
              case wa:
                return b2 = Sg(b2, a2.mode, c2), b2.return = a2, b2;
              case Ha:
                var d2 = b2._init;
                return q(a2, d2(b2._payload), c2);
            }
            if (eb(b2) || Ka(b2)) return b2 = Tg(b2, a2.mode, c2, null), b2.return = a2, b2;
            Mg(a2, b2);
          }
          return null;
        }
        function r(a2, b2, c2, d2) {
          var e2 = null !== b2 ? b2.key : null;
          if ("string" === typeof c2 && "" !== c2 || "number" === typeof c2) return null !== e2 ? null : h(a2, b2, "" + c2, d2);
          if ("object" === typeof c2 && null !== c2) {
            switch (c2.$$typeof) {
              case va:
                return c2.key === e2 ? k(a2, b2, c2, d2) : null;
              case wa:
                return c2.key === e2 ? l(a2, b2, c2, d2) : null;
              case Ha:
                return e2 = c2._init, r(
                  a2,
                  b2,
                  e2(c2._payload),
                  d2
                );
            }
            if (eb(c2) || Ka(c2)) return null !== e2 ? null : m(a2, b2, c2, d2, null);
            Mg(a2, c2);
          }
          return null;
        }
        function y(a2, b2, c2, d2, e2) {
          if ("string" === typeof d2 && "" !== d2 || "number" === typeof d2) return a2 = a2.get(c2) || null, h(b2, a2, "" + d2, e2);
          if ("object" === typeof d2 && null !== d2) {
            switch (d2.$$typeof) {
              case va:
                return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, k(b2, a2, d2, e2);
              case wa:
                return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, l(b2, a2, d2, e2);
              case Ha:
                var f2 = d2._init;
                return y(a2, b2, c2, f2(d2._payload), e2);
            }
            if (eb(d2) || Ka(d2)) return a2 = a2.get(c2) || null, m(b2, a2, d2, e2, null);
            Mg(b2, d2);
          }
          return null;
        }
        function n(e2, g2, h2, k2) {
          for (var l2 = null, m2 = null, u = g2, w = g2 = 0, x = null; null !== u && w < h2.length; w++) {
            u.index > w ? (x = u, u = null) : x = u.sibling;
            var n2 = r(e2, u, h2[w], k2);
            if (null === n2) {
              null === u && (u = x);
              break;
            }
            a && u && null === n2.alternate && b(e2, u);
            g2 = f(n2, g2, w);
            null === m2 ? l2 = n2 : m2.sibling = n2;
            m2 = n2;
            u = x;
          }
          if (w === h2.length) return c(e2, u), I2 && tg(e2, w), l2;
          if (null === u) {
            for (; w < h2.length; w++) u = q(e2, h2[w], k2), null !== u && (g2 = f(u, g2, w), null === m2 ? l2 = u : m2.sibling = u, m2 = u);
            I2 && tg(e2, w);
            return l2;
          }
          for (u = d(e2, u); w < h2.length; w++) x = y(u, e2, w, h2[w], k2), null !== x && (a && null !== x.alternate && u.delete(null === x.key ? w : x.key), g2 = f(x, g2, w), null === m2 ? l2 = x : m2.sibling = x, m2 = x);
          a && u.forEach(function(a2) {
            return b(e2, a2);
          });
          I2 && tg(e2, w);
          return l2;
        }
        function t(e2, g2, h2, k2) {
          var l2 = Ka(h2);
          if ("function" !== typeof l2) throw Error(p(150));
          h2 = l2.call(h2);
          if (null == h2) throw Error(p(151));
          for (var u = l2 = null, m2 = g2, w = g2 = 0, x = null, n2 = h2.next(); null !== m2 && !n2.done; w++, n2 = h2.next()) {
            m2.index > w ? (x = m2, m2 = null) : x = m2.sibling;
            var t2 = r(e2, m2, n2.value, k2);
            if (null === t2) {
              null === m2 && (m2 = x);
              break;
            }
            a && m2 && null === t2.alternate && b(e2, m2);
            g2 = f(t2, g2, w);
            null === u ? l2 = t2 : u.sibling = t2;
            u = t2;
            m2 = x;
          }
          if (n2.done) return c(
            e2,
            m2
          ), I2 && tg(e2, w), l2;
          if (null === m2) {
            for (; !n2.done; w++, n2 = h2.next()) n2 = q(e2, n2.value, k2), null !== n2 && (g2 = f(n2, g2, w), null === u ? l2 = n2 : u.sibling = n2, u = n2);
            I2 && tg(e2, w);
            return l2;
          }
          for (m2 = d(e2, m2); !n2.done; w++, n2 = h2.next()) n2 = y(m2, e2, w, n2.value, k2), null !== n2 && (a && null !== n2.alternate && m2.delete(null === n2.key ? w : n2.key), g2 = f(n2, g2, w), null === u ? l2 = n2 : u.sibling = n2, u = n2);
          a && m2.forEach(function(a2) {
            return b(e2, a2);
          });
          I2 && tg(e2, w);
          return l2;
        }
        function J(a2, d2, f2, h2) {
          "object" === typeof f2 && null !== f2 && f2.type === ya && null === f2.key && (f2 = f2.props.children);
          if ("object" === typeof f2 && null !== f2) {
            switch (f2.$$typeof) {
              case va:
                a: {
                  for (var k2 = f2.key, l2 = d2; null !== l2; ) {
                    if (l2.key === k2) {
                      k2 = f2.type;
                      if (k2 === ya) {
                        if (7 === l2.tag) {
                          c(a2, l2.sibling);
                          d2 = e(l2, f2.props.children);
                          d2.return = a2;
                          a2 = d2;
                          break a;
                        }
                      } else if (l2.elementType === k2 || "object" === typeof k2 && null !== k2 && k2.$$typeof === Ha && Ng(k2) === l2.type) {
                        c(a2, l2.sibling);
                        d2 = e(l2, f2.props);
                        d2.ref = Lg(a2, l2, f2);
                        d2.return = a2;
                        a2 = d2;
                        break a;
                      }
                      c(a2, l2);
                      break;
                    } else b(a2, l2);
                    l2 = l2.sibling;
                  }
                  f2.type === ya ? (d2 = Tg(f2.props.children, a2.mode, h2, f2.key), d2.return = a2, a2 = d2) : (h2 = Rg(f2.type, f2.key, f2.props, null, a2.mode, h2), h2.ref = Lg(a2, d2, f2), h2.return = a2, a2 = h2);
                }
                return g(a2);
              case wa:
                a: {
                  for (l2 = f2.key; null !== d2; ) {
                    if (d2.key === l2) if (4 === d2.tag && d2.stateNode.containerInfo === f2.containerInfo && d2.stateNode.implementation === f2.implementation) {
                      c(a2, d2.sibling);
                      d2 = e(d2, f2.children || []);
                      d2.return = a2;
                      a2 = d2;
                      break a;
                    } else {
                      c(a2, d2);
                      break;
                    }
                    else b(a2, d2);
                    d2 = d2.sibling;
                  }
                  d2 = Sg(f2, a2.mode, h2);
                  d2.return = a2;
                  a2 = d2;
                }
                return g(a2);
              case Ha:
                return l2 = f2._init, J(a2, d2, l2(f2._payload), h2);
            }
            if (eb(f2)) return n(a2, d2, f2, h2);
            if (Ka(f2)) return t(a2, d2, f2, h2);
            Mg(a2, f2);
          }
          return "string" === typeof f2 && "" !== f2 || "number" === typeof f2 ? (f2 = "" + f2, null !== d2 && 6 === d2.tag ? (c(a2, d2.sibling), d2 = e(d2, f2), d2.return = a2, a2 = d2) : (c(a2, d2), d2 = Qg(f2, a2.mode, h2), d2.return = a2, a2 = d2), g(a2)) : c(a2, d2);
        }
        return J;
      }
      var Ug = Og(true);
      var Vg = Og(false);
      var Wg = Uf(null);
      var Xg = null;
      var Yg = null;
      var Zg = null;
      function $g() {
        Zg = Yg = Xg = null;
      }
      function ah(a) {
        var b = Wg.current;
        E(Wg);
        a._currentValue = b;
      }
      function bh(a, b, c) {
        for (; null !== a; ) {
          var d = a.alternate;
          (a.childLanes & b) !== b ? (a.childLanes |= b, null !== d && (d.childLanes |= b)) : null !== d && (d.childLanes & b) !== b && (d.childLanes |= b);
          if (a === c) break;
          a = a.return;
        }
      }
      function ch(a, b) {
        Xg = a;
        Zg = Yg = null;
        a = a.dependencies;
        null !== a && null !== a.firstContext && (0 !== (a.lanes & b) && (dh = true), a.firstContext = null);
      }
      function eh(a) {
        var b = a._currentValue;
        if (Zg !== a) if (a = { context: a, memoizedValue: b, next: null }, null === Yg) {
          if (null === Xg) throw Error(p(308));
          Yg = a;
          Xg.dependencies = { lanes: 0, firstContext: a };
        } else Yg = Yg.next = a;
        return b;
      }
      var fh = null;
      function gh(a) {
        null === fh ? fh = [a] : fh.push(a);
      }
      function hh(a, b, c, d) {
        var e = b.interleaved;
        null === e ? (c.next = c, gh(b)) : (c.next = e.next, e.next = c);
        b.interleaved = c;
        return ih(a, d);
      }
      function ih(a, b) {
        a.lanes |= b;
        var c = a.alternate;
        null !== c && (c.lanes |= b);
        c = a;
        for (a = a.return; null !== a; ) a.childLanes |= b, c = a.alternate, null !== c && (c.childLanes |= b), c = a, a = a.return;
        return 3 === c.tag ? c.stateNode : null;
      }
      var jh = false;
      function kh(a) {
        a.updateQueue = { baseState: a.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
      }
      function lh(a, b) {
        a = a.updateQueue;
        b.updateQueue === a && (b.updateQueue = { baseState: a.baseState, firstBaseUpdate: a.firstBaseUpdate, lastBaseUpdate: a.lastBaseUpdate, shared: a.shared, effects: a.effects });
      }
      function mh(a, b) {
        return { eventTime: a, lane: b, tag: 0, payload: null, callback: null, next: null };
      }
      function nh(a, b, c) {
        var d = a.updateQueue;
        if (null === d) return null;
        d = d.shared;
        if (0 !== (K & 2)) {
          var e = d.pending;
          null === e ? b.next = b : (b.next = e.next, e.next = b);
          d.pending = b;
          return ih(a, c);
        }
        e = d.interleaved;
        null === e ? (b.next = b, gh(d)) : (b.next = e.next, e.next = b);
        d.interleaved = b;
        return ih(a, c);
      }
      function oh(a, b, c) {
        b = b.updateQueue;
        if (null !== b && (b = b.shared, 0 !== (c & 4194240))) {
          var d = b.lanes;
          d &= a.pendingLanes;
          c |= d;
          b.lanes = c;
          Cc(a, c);
        }
      }
      function ph(a, b) {
        var c = a.updateQueue, d = a.alternate;
        if (null !== d && (d = d.updateQueue, c === d)) {
          var e = null, f = null;
          c = c.firstBaseUpdate;
          if (null !== c) {
            do {
              var g = { eventTime: c.eventTime, lane: c.lane, tag: c.tag, payload: c.payload, callback: c.callback, next: null };
              null === f ? e = f = g : f = f.next = g;
              c = c.next;
            } while (null !== c);
            null === f ? e = f = b : f = f.next = b;
          } else e = f = b;
          c = { baseState: d.baseState, firstBaseUpdate: e, lastBaseUpdate: f, shared: d.shared, effects: d.effects };
          a.updateQueue = c;
          return;
        }
        a = c.lastBaseUpdate;
        null === a ? c.firstBaseUpdate = b : a.next = b;
        c.lastBaseUpdate = b;
      }
      function qh(a, b, c, d) {
        var e = a.updateQueue;
        jh = false;
        var f = e.firstBaseUpdate, g = e.lastBaseUpdate, h = e.shared.pending;
        if (null !== h) {
          e.shared.pending = null;
          var k = h, l = k.next;
          k.next = null;
          null === g ? f = l : g.next = l;
          g = k;
          var m = a.alternate;
          null !== m && (m = m.updateQueue, h = m.lastBaseUpdate, h !== g && (null === h ? m.firstBaseUpdate = l : h.next = l, m.lastBaseUpdate = k));
        }
        if (null !== f) {
          var q = e.baseState;
          g = 0;
          m = l = k = null;
          h = f;
          do {
            var r = h.lane, y = h.eventTime;
            if ((d & r) === r) {
              null !== m && (m = m.next = {
                eventTime: y,
                lane: 0,
                tag: h.tag,
                payload: h.payload,
                callback: h.callback,
                next: null
              });
              a: {
                var n = a, t = h;
                r = b;
                y = c;
                switch (t.tag) {
                  case 1:
                    n = t.payload;
                    if ("function" === typeof n) {
                      q = n.call(y, q, r);
                      break a;
                    }
                    q = n;
                    break a;
                  case 3:
                    n.flags = n.flags & -65537 | 128;
                  case 0:
                    n = t.payload;
                    r = "function" === typeof n ? n.call(y, q, r) : n;
                    if (null === r || void 0 === r) break a;
                    q = A({}, q, r);
                    break a;
                  case 2:
                    jh = true;
                }
              }
              null !== h.callback && 0 !== h.lane && (a.flags |= 64, r = e.effects, null === r ? e.effects = [h] : r.push(h));
            } else y = { eventTime: y, lane: r, tag: h.tag, payload: h.payload, callback: h.callback, next: null }, null === m ? (l = m = y, k = q) : m = m.next = y, g |= r;
            h = h.next;
            if (null === h) if (h = e.shared.pending, null === h) break;
            else r = h, h = r.next, r.next = null, e.lastBaseUpdate = r, e.shared.pending = null;
          } while (1);
          null === m && (k = q);
          e.baseState = k;
          e.firstBaseUpdate = l;
          e.lastBaseUpdate = m;
          b = e.shared.interleaved;
          if (null !== b) {
            e = b;
            do
              g |= e.lane, e = e.next;
            while (e !== b);
          } else null === f && (e.shared.lanes = 0);
          rh |= g;
          a.lanes = g;
          a.memoizedState = q;
        }
      }
      function sh(a, b, c) {
        a = b.effects;
        b.effects = null;
        if (null !== a) for (b = 0; b < a.length; b++) {
          var d = a[b], e = d.callback;
          if (null !== e) {
            d.callback = null;
            d = c;
            if ("function" !== typeof e) throw Error(p(191, e));
            e.call(d);
          }
        }
      }
      var th = {};
      var uh = Uf(th);
      var vh = Uf(th);
      var wh = Uf(th);
      function xh(a) {
        if (a === th) throw Error(p(174));
        return a;
      }
      function yh(a, b) {
        G(wh, b);
        G(vh, a);
        G(uh, th);
        a = b.nodeType;
        switch (a) {
          case 9:
          case 11:
            b = (b = b.documentElement) ? b.namespaceURI : lb(null, "");
            break;
          default:
            a = 8 === a ? b.parentNode : b, b = a.namespaceURI || null, a = a.tagName, b = lb(b, a);
        }
        E(uh);
        G(uh, b);
      }
      function zh() {
        E(uh);
        E(vh);
        E(wh);
      }
      function Ah(a) {
        xh(wh.current);
        var b = xh(uh.current);
        var c = lb(b, a.type);
        b !== c && (G(vh, a), G(uh, c));
      }
      function Bh(a) {
        vh.current === a && (E(uh), E(vh));
      }
      var L = Uf(0);
      function Ch(a) {
        for (var b = a; null !== b; ) {
          if (13 === b.tag) {
            var c = b.memoizedState;
            if (null !== c && (c = c.dehydrated, null === c || "$?" === c.data || "$!" === c.data)) return b;
          } else if (19 === b.tag && void 0 !== b.memoizedProps.revealOrder) {
            if (0 !== (b.flags & 128)) return b;
          } else if (null !== b.child) {
            b.child.return = b;
            b = b.child;
            continue;
          }
          if (b === a) break;
          for (; null === b.sibling; ) {
            if (null === b.return || b.return === a) return null;
            b = b.return;
          }
          b.sibling.return = b.return;
          b = b.sibling;
        }
        return null;
      }
      var Dh = [];
      function Eh() {
        for (var a = 0; a < Dh.length; a++) Dh[a]._workInProgressVersionPrimary = null;
        Dh.length = 0;
      }
      var Fh = ua.ReactCurrentDispatcher;
      var Gh = ua.ReactCurrentBatchConfig;
      var Hh = 0;
      var M = null;
      var N = null;
      var O = null;
      var Ih = false;
      var Jh = false;
      var Kh = 0;
      var Lh = 0;
      function P() {
        throw Error(p(321));
      }
      function Mh(a, b) {
        if (null === b) return false;
        for (var c = 0; c < b.length && c < a.length; c++) if (!He(a[c], b[c])) return false;
        return true;
      }
      function Nh(a, b, c, d, e, f) {
        Hh = f;
        M = b;
        b.memoizedState = null;
        b.updateQueue = null;
        b.lanes = 0;
        Fh.current = null === a || null === a.memoizedState ? Oh : Ph;
        a = c(d, e);
        if (Jh) {
          f = 0;
          do {
            Jh = false;
            Kh = 0;
            if (25 <= f) throw Error(p(301));
            f += 1;
            O = N = null;
            b.updateQueue = null;
            Fh.current = Qh;
            a = c(d, e);
          } while (Jh);
        }
        Fh.current = Rh;
        b = null !== N && null !== N.next;
        Hh = 0;
        O = N = M = null;
        Ih = false;
        if (b) throw Error(p(300));
        return a;
      }
      function Sh() {
        var a = 0 !== Kh;
        Kh = 0;
        return a;
      }
      function Th() {
        var a = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
        null === O ? M.memoizedState = O = a : O = O.next = a;
        return O;
      }
      function Uh() {
        if (null === N) {
          var a = M.alternate;
          a = null !== a ? a.memoizedState : null;
        } else a = N.next;
        var b = null === O ? M.memoizedState : O.next;
        if (null !== b) O = b, N = a;
        else {
          if (null === a) throw Error(p(310));
          N = a;
          a = { memoizedState: N.memoizedState, baseState: N.baseState, baseQueue: N.baseQueue, queue: N.queue, next: null };
          null === O ? M.memoizedState = O = a : O = O.next = a;
        }
        return O;
      }
      function Vh(a, b) {
        return "function" === typeof b ? b(a) : b;
      }
      function Wh(a) {
        var b = Uh(), c = b.queue;
        if (null === c) throw Error(p(311));
        c.lastRenderedReducer = a;
        var d = N, e = d.baseQueue, f = c.pending;
        if (null !== f) {
          if (null !== e) {
            var g = e.next;
            e.next = f.next;
            f.next = g;
          }
          d.baseQueue = e = f;
          c.pending = null;
        }
        if (null !== e) {
          f = e.next;
          d = d.baseState;
          var h = g = null, k = null, l = f;
          do {
            var m = l.lane;
            if ((Hh & m) === m) null !== k && (k = k.next = { lane: 0, action: l.action, hasEagerState: l.hasEagerState, eagerState: l.eagerState, next: null }), d = l.hasEagerState ? l.eagerState : a(d, l.action);
            else {
              var q = {
                lane: m,
                action: l.action,
                hasEagerState: l.hasEagerState,
                eagerState: l.eagerState,
                next: null
              };
              null === k ? (h = k = q, g = d) : k = k.next = q;
              M.lanes |= m;
              rh |= m;
            }
            l = l.next;
          } while (null !== l && l !== f);
          null === k ? g = d : k.next = h;
          He(d, b.memoizedState) || (dh = true);
          b.memoizedState = d;
          b.baseState = g;
          b.baseQueue = k;
          c.lastRenderedState = d;
        }
        a = c.interleaved;
        if (null !== a) {
          e = a;
          do
            f = e.lane, M.lanes |= f, rh |= f, e = e.next;
          while (e !== a);
        } else null === e && (c.lanes = 0);
        return [b.memoizedState, c.dispatch];
      }
      function Xh(a) {
        var b = Uh(), c = b.queue;
        if (null === c) throw Error(p(311));
        c.lastRenderedReducer = a;
        var d = c.dispatch, e = c.pending, f = b.memoizedState;
        if (null !== e) {
          c.pending = null;
          var g = e = e.next;
          do
            f = a(f, g.action), g = g.next;
          while (g !== e);
          He(f, b.memoizedState) || (dh = true);
          b.memoizedState = f;
          null === b.baseQueue && (b.baseState = f);
          c.lastRenderedState = f;
        }
        return [f, d];
      }
      function Yh() {
      }
      function Zh(a, b) {
        var c = M, d = Uh(), e = b(), f = !He(d.memoizedState, e);
        f && (d.memoizedState = e, dh = true);
        d = d.queue;
        $h(ai.bind(null, c, d, a), [a]);
        if (d.getSnapshot !== b || f || null !== O && O.memoizedState.tag & 1) {
          c.flags |= 2048;
          bi(9, ci.bind(null, c, d, e, b), void 0, null);
          if (null === Q) throw Error(p(349));
          0 !== (Hh & 30) || di(c, b, e);
        }
        return e;
      }
      function di(a, b, c) {
        a.flags |= 16384;
        a = { getSnapshot: b, value: c };
        b = M.updateQueue;
        null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.stores = [a]) : (c = b.stores, null === c ? b.stores = [a] : c.push(a));
      }
      function ci(a, b, c, d) {
        b.value = c;
        b.getSnapshot = d;
        ei(b) && fi(a);
      }
      function ai(a, b, c) {
        return c(function() {
          ei(b) && fi(a);
        });
      }
      function ei(a) {
        var b = a.getSnapshot;
        a = a.value;
        try {
          var c = b();
          return !He(a, c);
        } catch (d) {
          return true;
        }
      }
      function fi(a) {
        var b = ih(a, 1);
        null !== b && gi(b, a, 1, -1);
      }
      function hi(a) {
        var b = Th();
        "function" === typeof a && (a = a());
        b.memoizedState = b.baseState = a;
        a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Vh, lastRenderedState: a };
        b.queue = a;
        a = a.dispatch = ii.bind(null, M, a);
        return [b.memoizedState, a];
      }
      function bi(a, b, c, d) {
        a = { tag: a, create: b, destroy: c, deps: d, next: null };
        b = M.updateQueue;
        null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.lastEffect = a.next = a) : (c = b.lastEffect, null === c ? b.lastEffect = a.next = a : (d = c.next, c.next = a, a.next = d, b.lastEffect = a));
        return a;
      }
      function ji() {
        return Uh().memoizedState;
      }
      function ki(a, b, c, d) {
        var e = Th();
        M.flags |= a;
        e.memoizedState = bi(1 | b, c, void 0, void 0 === d ? null : d);
      }
      function li(a, b, c, d) {
        var e = Uh();
        d = void 0 === d ? null : d;
        var f = void 0;
        if (null !== N) {
          var g = N.memoizedState;
          f = g.destroy;
          if (null !== d && Mh(d, g.deps)) {
            e.memoizedState = bi(b, c, f, d);
            return;
          }
        }
        M.flags |= a;
        e.memoizedState = bi(1 | b, c, f, d);
      }
      function mi(a, b) {
        return ki(8390656, 8, a, b);
      }
      function $h(a, b) {
        return li(2048, 8, a, b);
      }
      function ni(a, b) {
        return li(4, 2, a, b);
      }
      function oi(a, b) {
        return li(4, 4, a, b);
      }
      function pi(a, b) {
        if ("function" === typeof b) return a = a(), b(a), function() {
          b(null);
        };
        if (null !== b && void 0 !== b) return a = a(), b.current = a, function() {
          b.current = null;
        };
      }
      function qi(a, b, c) {
        c = null !== c && void 0 !== c ? c.concat([a]) : null;
        return li(4, 4, pi.bind(null, b, a), c);
      }
      function ri() {
      }
      function si(a, b) {
        var c = Uh();
        b = void 0 === b ? null : b;
        var d = c.memoizedState;
        if (null !== d && null !== b && Mh(b, d[1])) return d[0];
        c.memoizedState = [a, b];
        return a;
      }
      function ti(a, b) {
        var c = Uh();
        b = void 0 === b ? null : b;
        var d = c.memoizedState;
        if (null !== d && null !== b && Mh(b, d[1])) return d[0];
        a = a();
        c.memoizedState = [a, b];
        return a;
      }
      function ui(a, b, c) {
        if (0 === (Hh & 21)) return a.baseState && (a.baseState = false, dh = true), a.memoizedState = c;
        He(c, b) || (c = yc(), M.lanes |= c, rh |= c, a.baseState = true);
        return b;
      }
      function vi(a, b) {
        var c = C;
        C = 0 !== c && 4 > c ? c : 4;
        a(true);
        var d = Gh.transition;
        Gh.transition = {};
        try {
          a(false), b();
        } finally {
          C = c, Gh.transition = d;
        }
      }
      function wi() {
        return Uh().memoizedState;
      }
      function xi(a, b, c) {
        var d = yi(a);
        c = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
        if (zi(a)) Ai(b, c);
        else if (c = hh(a, b, c, d), null !== c) {
          var e = R();
          gi(c, a, d, e);
          Bi(c, b, d);
        }
      }
      function ii(a, b, c) {
        var d = yi(a), e = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
        if (zi(a)) Ai(b, e);
        else {
          var f = a.alternate;
          if (0 === a.lanes && (null === f || 0 === f.lanes) && (f = b.lastRenderedReducer, null !== f)) try {
            var g = b.lastRenderedState, h = f(g, c);
            e.hasEagerState = true;
            e.eagerState = h;
            if (He(h, g)) {
              var k = b.interleaved;
              null === k ? (e.next = e, gh(b)) : (e.next = k.next, k.next = e);
              b.interleaved = e;
              return;
            }
          } catch (l) {
          } finally {
          }
          c = hh(a, b, e, d);
          null !== c && (e = R(), gi(c, a, d, e), Bi(c, b, d));
        }
      }
      function zi(a) {
        var b = a.alternate;
        return a === M || null !== b && b === M;
      }
      function Ai(a, b) {
        Jh = Ih = true;
        var c = a.pending;
        null === c ? b.next = b : (b.next = c.next, c.next = b);
        a.pending = b;
      }
      function Bi(a, b, c) {
        if (0 !== (c & 4194240)) {
          var d = b.lanes;
          d &= a.pendingLanes;
          c |= d;
          b.lanes = c;
          Cc(a, c);
        }
      }
      var Rh = { readContext: eh, useCallback: P, useContext: P, useEffect: P, useImperativeHandle: P, useInsertionEffect: P, useLayoutEffect: P, useMemo: P, useReducer: P, useRef: P, useState: P, useDebugValue: P, useDeferredValue: P, useTransition: P, useMutableSource: P, useSyncExternalStore: P, useId: P, unstable_isNewReconciler: false };
      var Oh = { readContext: eh, useCallback: function(a, b) {
        Th().memoizedState = [a, void 0 === b ? null : b];
        return a;
      }, useContext: eh, useEffect: mi, useImperativeHandle: function(a, b, c) {
        c = null !== c && void 0 !== c ? c.concat([a]) : null;
        return ki(
          4194308,
          4,
          pi.bind(null, b, a),
          c
        );
      }, useLayoutEffect: function(a, b) {
        return ki(4194308, 4, a, b);
      }, useInsertionEffect: function(a, b) {
        return ki(4, 2, a, b);
      }, useMemo: function(a, b) {
        var c = Th();
        b = void 0 === b ? null : b;
        a = a();
        c.memoizedState = [a, b];
        return a;
      }, useReducer: function(a, b, c) {
        var d = Th();
        b = void 0 !== c ? c(b) : b;
        d.memoizedState = d.baseState = b;
        a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: a, lastRenderedState: b };
        d.queue = a;
        a = a.dispatch = xi.bind(null, M, a);
        return [d.memoizedState, a];
      }, useRef: function(a) {
        var b = Th();
        a = { current: a };
        return b.memoizedState = a;
      }, useState: hi, useDebugValue: ri, useDeferredValue: function(a) {
        return Th().memoizedState = a;
      }, useTransition: function() {
        var a = hi(false), b = a[0];
        a = vi.bind(null, a[1]);
        Th().memoizedState = a;
        return [b, a];
      }, useMutableSource: function() {
      }, useSyncExternalStore: function(a, b, c) {
        var d = M, e = Th();
        if (I2) {
          if (void 0 === c) throw Error(p(407));
          c = c();
        } else {
          c = b();
          if (null === Q) throw Error(p(349));
          0 !== (Hh & 30) || di(d, b, c);
        }
        e.memoizedState = c;
        var f = { value: c, getSnapshot: b };
        e.queue = f;
        mi(ai.bind(
          null,
          d,
          f,
          a
        ), [a]);
        d.flags |= 2048;
        bi(9, ci.bind(null, d, f, c, b), void 0, null);
        return c;
      }, useId: function() {
        var a = Th(), b = Q.identifierPrefix;
        if (I2) {
          var c = sg;
          var d = rg;
          c = (d & ~(1 << 32 - oc(d) - 1)).toString(32) + c;
          b = ":" + b + "R" + c;
          c = Kh++;
          0 < c && (b += "H" + c.toString(32));
          b += ":";
        } else c = Lh++, b = ":" + b + "r" + c.toString(32) + ":";
        return a.memoizedState = b;
      }, unstable_isNewReconciler: false };
      var Ph = {
        readContext: eh,
        useCallback: si,
        useContext: eh,
        useEffect: $h,
        useImperativeHandle: qi,
        useInsertionEffect: ni,
        useLayoutEffect: oi,
        useMemo: ti,
        useReducer: Wh,
        useRef: ji,
        useState: function() {
          return Wh(Vh);
        },
        useDebugValue: ri,
        useDeferredValue: function(a) {
          var b = Uh();
          return ui(b, N.memoizedState, a);
        },
        useTransition: function() {
          var a = Wh(Vh)[0], b = Uh().memoizedState;
          return [a, b];
        },
        useMutableSource: Yh,
        useSyncExternalStore: Zh,
        useId: wi,
        unstable_isNewReconciler: false
      };
      var Qh = { readContext: eh, useCallback: si, useContext: eh, useEffect: $h, useImperativeHandle: qi, useInsertionEffect: ni, useLayoutEffect: oi, useMemo: ti, useReducer: Xh, useRef: ji, useState: function() {
        return Xh(Vh);
      }, useDebugValue: ri, useDeferredValue: function(a) {
        var b = Uh();
        return null === N ? b.memoizedState = a : ui(b, N.memoizedState, a);
      }, useTransition: function() {
        var a = Xh(Vh)[0], b = Uh().memoizedState;
        return [a, b];
      }, useMutableSource: Yh, useSyncExternalStore: Zh, useId: wi, unstable_isNewReconciler: false };
      function Ci(a, b) {
        if (a && a.defaultProps) {
          b = A({}, b);
          a = a.defaultProps;
          for (var c in a) void 0 === b[c] && (b[c] = a[c]);
          return b;
        }
        return b;
      }
      function Di(a, b, c, d) {
        b = a.memoizedState;
        c = c(d, b);
        c = null === c || void 0 === c ? b : A({}, b, c);
        a.memoizedState = c;
        0 === a.lanes && (a.updateQueue.baseState = c);
      }
      var Ei = { isMounted: function(a) {
        return (a = a._reactInternals) ? Vb(a) === a : false;
      }, enqueueSetState: function(a, b, c) {
        a = a._reactInternals;
        var d = R(), e = yi(a), f = mh(d, e);
        f.payload = b;
        void 0 !== c && null !== c && (f.callback = c);
        b = nh(a, f, e);
        null !== b && (gi(b, a, e, d), oh(b, a, e));
      }, enqueueReplaceState: function(a, b, c) {
        a = a._reactInternals;
        var d = R(), e = yi(a), f = mh(d, e);
        f.tag = 1;
        f.payload = b;
        void 0 !== c && null !== c && (f.callback = c);
        b = nh(a, f, e);
        null !== b && (gi(b, a, e, d), oh(b, a, e));
      }, enqueueForceUpdate: function(a, b) {
        a = a._reactInternals;
        var c = R(), d = yi(a), e = mh(c, d);
        e.tag = 2;
        void 0 !== b && null !== b && (e.callback = b);
        b = nh(a, e, d);
        null !== b && (gi(b, a, d, c), oh(b, a, d));
      } };
      function Fi(a, b, c, d, e, f, g) {
        a = a.stateNode;
        return "function" === typeof a.shouldComponentUpdate ? a.shouldComponentUpdate(d, f, g) : b.prototype && b.prototype.isPureReactComponent ? !Ie(c, d) || !Ie(e, f) : true;
      }
      function Gi(a, b, c) {
        var d = false, e = Vf;
        var f = b.contextType;
        "object" === typeof f && null !== f ? f = eh(f) : (e = Zf(b) ? Xf : H.current, d = b.contextTypes, f = (d = null !== d && void 0 !== d) ? Yf(a, e) : Vf);
        b = new b(c, f);
        a.memoizedState = null !== b.state && void 0 !== b.state ? b.state : null;
        b.updater = Ei;
        a.stateNode = b;
        b._reactInternals = a;
        d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = e, a.__reactInternalMemoizedMaskedChildContext = f);
        return b;
      }
      function Hi(a, b, c, d) {
        a = b.state;
        "function" === typeof b.componentWillReceiveProps && b.componentWillReceiveProps(c, d);
        "function" === typeof b.UNSAFE_componentWillReceiveProps && b.UNSAFE_componentWillReceiveProps(c, d);
        b.state !== a && Ei.enqueueReplaceState(b, b.state, null);
      }
      function Ii(a, b, c, d) {
        var e = a.stateNode;
        e.props = c;
        e.state = a.memoizedState;
        e.refs = {};
        kh(a);
        var f = b.contextType;
        "object" === typeof f && null !== f ? e.context = eh(f) : (f = Zf(b) ? Xf : H.current, e.context = Yf(a, f));
        e.state = a.memoizedState;
        f = b.getDerivedStateFromProps;
        "function" === typeof f && (Di(a, b, f, c), e.state = a.memoizedState);
        "function" === typeof b.getDerivedStateFromProps || "function" === typeof e.getSnapshotBeforeUpdate || "function" !== typeof e.UNSAFE_componentWillMount && "function" !== typeof e.componentWillMount || (b = e.state, "function" === typeof e.componentWillMount && e.componentWillMount(), "function" === typeof e.UNSAFE_componentWillMount && e.UNSAFE_componentWillMount(), b !== e.state && Ei.enqueueReplaceState(e, e.state, null), qh(a, c, e, d), e.state = a.memoizedState);
        "function" === typeof e.componentDidMount && (a.flags |= 4194308);
      }
      function Ji(a, b) {
        try {
          var c = "", d = b;
          do
            c += Pa(d), d = d.return;
          while (d);
          var e = c;
        } catch (f) {
          e = "\nError generating stack: " + f.message + "\n" + f.stack;
        }
        return { value: a, source: b, stack: e, digest: null };
      }
      function Ki(a, b, c) {
        return { value: a, source: null, stack: null != c ? c : null, digest: null != b ? b : null };
      }
      function Li(a, b) {
        try {
          console.error(b.value);
        } catch (c) {
          setTimeout(function() {
            throw c;
          });
        }
      }
      var Mi = "function" === typeof WeakMap ? WeakMap : Map;
      function Ni(a, b, c) {
        c = mh(-1, c);
        c.tag = 3;
        c.payload = { element: null };
        var d = b.value;
        c.callback = function() {
          Oi || (Oi = true, Pi = d);
          Li(a, b);
        };
        return c;
      }
      function Qi(a, b, c) {
        c = mh(-1, c);
        c.tag = 3;
        var d = a.type.getDerivedStateFromError;
        if ("function" === typeof d) {
          var e = b.value;
          c.payload = function() {
            return d(e);
          };
          c.callback = function() {
            Li(a, b);
          };
        }
        var f = a.stateNode;
        null !== f && "function" === typeof f.componentDidCatch && (c.callback = function() {
          Li(a, b);
          "function" !== typeof d && (null === Ri ? Ri = /* @__PURE__ */ new Set([this]) : Ri.add(this));
          var c2 = b.stack;
          this.componentDidCatch(b.value, { componentStack: null !== c2 ? c2 : "" });
        });
        return c;
      }
      function Si(a, b, c) {
        var d = a.pingCache;
        if (null === d) {
          d = a.pingCache = new Mi();
          var e = /* @__PURE__ */ new Set();
          d.set(b, e);
        } else e = d.get(b), void 0 === e && (e = /* @__PURE__ */ new Set(), d.set(b, e));
        e.has(c) || (e.add(c), a = Ti.bind(null, a, b, c), b.then(a, a));
      }
      function Ui(a) {
        do {
          var b;
          if (b = 13 === a.tag) b = a.memoizedState, b = null !== b ? null !== b.dehydrated ? true : false : true;
          if (b) return a;
          a = a.return;
        } while (null !== a);
        return null;
      }
      function Vi(a, b, c, d, e) {
        if (0 === (a.mode & 1)) return a === b ? a.flags |= 65536 : (a.flags |= 128, c.flags |= 131072, c.flags &= -52805, 1 === c.tag && (null === c.alternate ? c.tag = 17 : (b = mh(-1, 1), b.tag = 2, nh(c, b, 1))), c.lanes |= 1), a;
        a.flags |= 65536;
        a.lanes = e;
        return a;
      }
      var Wi = ua.ReactCurrentOwner;
      var dh = false;
      function Xi(a, b, c, d) {
        b.child = null === a ? Vg(b, null, c, d) : Ug(b, a.child, c, d);
      }
      function Yi(a, b, c, d, e) {
        c = c.render;
        var f = b.ref;
        ch(b, e);
        d = Nh(a, b, c, d, f, e);
        c = Sh();
        if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
        I2 && c && vg(b);
        b.flags |= 1;
        Xi(a, b, d, e);
        return b.child;
      }
      function $i(a, b, c, d, e) {
        if (null === a) {
          var f = c.type;
          if ("function" === typeof f && !aj(f) && void 0 === f.defaultProps && null === c.compare && void 0 === c.defaultProps) return b.tag = 15, b.type = f, bj(a, b, f, d, e);
          a = Rg(c.type, null, d, b, b.mode, e);
          a.ref = b.ref;
          a.return = b;
          return b.child = a;
        }
        f = a.child;
        if (0 === (a.lanes & e)) {
          var g = f.memoizedProps;
          c = c.compare;
          c = null !== c ? c : Ie;
          if (c(g, d) && a.ref === b.ref) return Zi(a, b, e);
        }
        b.flags |= 1;
        a = Pg(f, d);
        a.ref = b.ref;
        a.return = b;
        return b.child = a;
      }
      function bj(a, b, c, d, e) {
        if (null !== a) {
          var f = a.memoizedProps;
          if (Ie(f, d) && a.ref === b.ref) if (dh = false, b.pendingProps = d = f, 0 !== (a.lanes & e)) 0 !== (a.flags & 131072) && (dh = true);
          else return b.lanes = a.lanes, Zi(a, b, e);
        }
        return cj(a, b, c, d, e);
      }
      function dj(a, b, c) {
        var d = b.pendingProps, e = d.children, f = null !== a ? a.memoizedState : null;
        if ("hidden" === d.mode) if (0 === (b.mode & 1)) b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, G(ej, fj), fj |= c;
        else {
          if (0 === (c & 1073741824)) return a = null !== f ? f.baseLanes | c : c, b.lanes = b.childLanes = 1073741824, b.memoizedState = { baseLanes: a, cachePool: null, transitions: null }, b.updateQueue = null, G(ej, fj), fj |= a, null;
          b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null };
          d = null !== f ? f.baseLanes : c;
          G(ej, fj);
          fj |= d;
        }
        else null !== f ? (d = f.baseLanes | c, b.memoizedState = null) : d = c, G(ej, fj), fj |= d;
        Xi(a, b, e, c);
        return b.child;
      }
      function gj(a, b) {
        var c = b.ref;
        if (null === a && null !== c || null !== a && a.ref !== c) b.flags |= 512, b.flags |= 2097152;
      }
      function cj(a, b, c, d, e) {
        var f = Zf(c) ? Xf : H.current;
        f = Yf(b, f);
        ch(b, e);
        c = Nh(a, b, c, d, f, e);
        d = Sh();
        if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
        I2 && d && vg(b);
        b.flags |= 1;
        Xi(a, b, c, e);
        return b.child;
      }
      function hj(a, b, c, d, e) {
        if (Zf(c)) {
          var f = true;
          cg(b);
        } else f = false;
        ch(b, e);
        if (null === b.stateNode) ij(a, b), Gi(b, c, d), Ii(b, c, d, e), d = true;
        else if (null === a) {
          var g = b.stateNode, h = b.memoizedProps;
          g.props = h;
          var k = g.context, l = c.contextType;
          "object" === typeof l && null !== l ? l = eh(l) : (l = Zf(c) ? Xf : H.current, l = Yf(b, l));
          var m = c.getDerivedStateFromProps, q = "function" === typeof m || "function" === typeof g.getSnapshotBeforeUpdate;
          q || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== d || k !== l) && Hi(b, g, d, l);
          jh = false;
          var r = b.memoizedState;
          g.state = r;
          qh(b, d, g, e);
          k = b.memoizedState;
          h !== d || r !== k || Wf.current || jh ? ("function" === typeof m && (Di(b, c, m, d), k = b.memoizedState), (h = jh || Fi(b, c, h, d, r, k, l)) ? (q || "function" !== typeof g.UNSAFE_componentWillMount && "function" !== typeof g.componentWillMount || ("function" === typeof g.componentWillMount && g.componentWillMount(), "function" === typeof g.UNSAFE_componentWillMount && g.UNSAFE_componentWillMount()), "function" === typeof g.componentDidMount && (b.flags |= 4194308)) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), b.memoizedProps = d, b.memoizedState = k), g.props = d, g.state = k, g.context = l, d = h) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), d = false);
        } else {
          g = b.stateNode;
          lh(a, b);
          h = b.memoizedProps;
          l = b.type === b.elementType ? h : Ci(b.type, h);
          g.props = l;
          q = b.pendingProps;
          r = g.context;
          k = c.contextType;
          "object" === typeof k && null !== k ? k = eh(k) : (k = Zf(c) ? Xf : H.current, k = Yf(b, k));
          var y = c.getDerivedStateFromProps;
          (m = "function" === typeof y || "function" === typeof g.getSnapshotBeforeUpdate) || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== q || r !== k) && Hi(b, g, d, k);
          jh = false;
          r = b.memoizedState;
          g.state = r;
          qh(b, d, g, e);
          var n = b.memoizedState;
          h !== q || r !== n || Wf.current || jh ? ("function" === typeof y && (Di(b, c, y, d), n = b.memoizedState), (l = jh || Fi(b, c, l, d, r, n, k) || false) ? (m || "function" !== typeof g.UNSAFE_componentWillUpdate && "function" !== typeof g.componentWillUpdate || ("function" === typeof g.componentWillUpdate && g.componentWillUpdate(d, n, k), "function" === typeof g.UNSAFE_componentWillUpdate && g.UNSAFE_componentWillUpdate(d, n, k)), "function" === typeof g.componentDidUpdate && (b.flags |= 4), "function" === typeof g.getSnapshotBeforeUpdate && (b.flags |= 1024)) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 1024), b.memoizedProps = d, b.memoizedState = n), g.props = d, g.state = n, g.context = k, d = l) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 1024), d = false);
        }
        return jj(a, b, c, d, f, e);
      }
      function jj(a, b, c, d, e, f) {
        gj(a, b);
        var g = 0 !== (b.flags & 128);
        if (!d && !g) return e && dg(b, c, false), Zi(a, b, f);
        d = b.stateNode;
        Wi.current = b;
        var h = g && "function" !== typeof c.getDerivedStateFromError ? null : d.render();
        b.flags |= 1;
        null !== a && g ? (b.child = Ug(b, a.child, null, f), b.child = Ug(b, null, h, f)) : Xi(a, b, h, f);
        b.memoizedState = d.state;
        e && dg(b, c, true);
        return b.child;
      }
      function kj(a) {
        var b = a.stateNode;
        b.pendingContext ? ag(a, b.pendingContext, b.pendingContext !== b.context) : b.context && ag(a, b.context, false);
        yh(a, b.containerInfo);
      }
      function lj(a, b, c, d, e) {
        Ig();
        Jg(e);
        b.flags |= 256;
        Xi(a, b, c, d);
        return b.child;
      }
      var mj = { dehydrated: null, treeContext: null, retryLane: 0 };
      function nj(a) {
        return { baseLanes: a, cachePool: null, transitions: null };
      }
      function oj(a, b, c) {
        var d = b.pendingProps, e = L.current, f = false, g = 0 !== (b.flags & 128), h;
        (h = g) || (h = null !== a && null === a.memoizedState ? false : 0 !== (e & 2));
        if (h) f = true, b.flags &= -129;
        else if (null === a || null !== a.memoizedState) e |= 1;
        G(L, e & 1);
        if (null === a) {
          Eg(b);
          a = b.memoizedState;
          if (null !== a && (a = a.dehydrated, null !== a)) return 0 === (b.mode & 1) ? b.lanes = 1 : "$!" === a.data ? b.lanes = 8 : b.lanes = 1073741824, null;
          g = d.children;
          a = d.fallback;
          return f ? (d = b.mode, f = b.child, g = { mode: "hidden", children: g }, 0 === (d & 1) && null !== f ? (f.childLanes = 0, f.pendingProps = g) : f = pj(g, d, 0, null), a = Tg(a, d, c, null), f.return = b, a.return = b, f.sibling = a, b.child = f, b.child.memoizedState = nj(c), b.memoizedState = mj, a) : qj(b, g);
        }
        e = a.memoizedState;
        if (null !== e && (h = e.dehydrated, null !== h)) return rj(a, b, g, d, h, e, c);
        if (f) {
          f = d.fallback;
          g = b.mode;
          e = a.child;
          h = e.sibling;
          var k = { mode: "hidden", children: d.children };
          0 === (g & 1) && b.child !== e ? (d = b.child, d.childLanes = 0, d.pendingProps = k, b.deletions = null) : (d = Pg(e, k), d.subtreeFlags = e.subtreeFlags & 14680064);
          null !== h ? f = Pg(h, f) : (f = Tg(f, g, c, null), f.flags |= 2);
          f.return = b;
          d.return = b;
          d.sibling = f;
          b.child = d;
          d = f;
          f = b.child;
          g = a.child.memoizedState;
          g = null === g ? nj(c) : { baseLanes: g.baseLanes | c, cachePool: null, transitions: g.transitions };
          f.memoizedState = g;
          f.childLanes = a.childLanes & ~c;
          b.memoizedState = mj;
          return d;
        }
        f = a.child;
        a = f.sibling;
        d = Pg(f, { mode: "visible", children: d.children });
        0 === (b.mode & 1) && (d.lanes = c);
        d.return = b;
        d.sibling = null;
        null !== a && (c = b.deletions, null === c ? (b.deletions = [a], b.flags |= 16) : c.push(a));
        b.child = d;
        b.memoizedState = null;
        return d;
      }
      function qj(a, b) {
        b = pj({ mode: "visible", children: b }, a.mode, 0, null);
        b.return = a;
        return a.child = b;
      }
      function sj(a, b, c, d) {
        null !== d && Jg(d);
        Ug(b, a.child, null, c);
        a = qj(b, b.pendingProps.children);
        a.flags |= 2;
        b.memoizedState = null;
        return a;
      }
      function rj(a, b, c, d, e, f, g) {
        if (c) {
          if (b.flags & 256) return b.flags &= -257, d = Ki(Error(p(422))), sj(a, b, g, d);
          if (null !== b.memoizedState) return b.child = a.child, b.flags |= 128, null;
          f = d.fallback;
          e = b.mode;
          d = pj({ mode: "visible", children: d.children }, e, 0, null);
          f = Tg(f, e, g, null);
          f.flags |= 2;
          d.return = b;
          f.return = b;
          d.sibling = f;
          b.child = d;
          0 !== (b.mode & 1) && Ug(b, a.child, null, g);
          b.child.memoizedState = nj(g);
          b.memoizedState = mj;
          return f;
        }
        if (0 === (b.mode & 1)) return sj(a, b, g, null);
        if ("$!" === e.data) {
          d = e.nextSibling && e.nextSibling.dataset;
          if (d) var h = d.dgst;
          d = h;
          f = Error(p(419));
          d = Ki(f, d, void 0);
          return sj(a, b, g, d);
        }
        h = 0 !== (g & a.childLanes);
        if (dh || h) {
          d = Q;
          if (null !== d) {
            switch (g & -g) {
              case 4:
                e = 2;
                break;
              case 16:
                e = 8;
                break;
              case 64:
              case 128:
              case 256:
              case 512:
              case 1024:
              case 2048:
              case 4096:
              case 8192:
              case 16384:
              case 32768:
              case 65536:
              case 131072:
              case 262144:
              case 524288:
              case 1048576:
              case 2097152:
              case 4194304:
              case 8388608:
              case 16777216:
              case 33554432:
              case 67108864:
                e = 32;
                break;
              case 536870912:
                e = 268435456;
                break;
              default:
                e = 0;
            }
            e = 0 !== (e & (d.suspendedLanes | g)) ? 0 : e;
            0 !== e && e !== f.retryLane && (f.retryLane = e, ih(a, e), gi(d, a, e, -1));
          }
          tj();
          d = Ki(Error(p(421)));
          return sj(a, b, g, d);
        }
        if ("$?" === e.data) return b.flags |= 128, b.child = a.child, b = uj.bind(null, a), e._reactRetry = b, null;
        a = f.treeContext;
        yg = Lf(e.nextSibling);
        xg = b;
        I2 = true;
        zg = null;
        null !== a && (og[pg++] = rg, og[pg++] = sg, og[pg++] = qg, rg = a.id, sg = a.overflow, qg = b);
        b = qj(b, d.children);
        b.flags |= 4096;
        return b;
      }
      function vj(a, b, c) {
        a.lanes |= b;
        var d = a.alternate;
        null !== d && (d.lanes |= b);
        bh(a.return, b, c);
      }
      function wj(a, b, c, d, e) {
        var f = a.memoizedState;
        null === f ? a.memoizedState = { isBackwards: b, rendering: null, renderingStartTime: 0, last: d, tail: c, tailMode: e } : (f.isBackwards = b, f.rendering = null, f.renderingStartTime = 0, f.last = d, f.tail = c, f.tailMode = e);
      }
      function xj(a, b, c) {
        var d = b.pendingProps, e = d.revealOrder, f = d.tail;
        Xi(a, b, d.children, c);
        d = L.current;
        if (0 !== (d & 2)) d = d & 1 | 2, b.flags |= 128;
        else {
          if (null !== a && 0 !== (a.flags & 128)) a: for (a = b.child; null !== a; ) {
            if (13 === a.tag) null !== a.memoizedState && vj(a, c, b);
            else if (19 === a.tag) vj(a, c, b);
            else if (null !== a.child) {
              a.child.return = a;
              a = a.child;
              continue;
            }
            if (a === b) break a;
            for (; null === a.sibling; ) {
              if (null === a.return || a.return === b) break a;
              a = a.return;
            }
            a.sibling.return = a.return;
            a = a.sibling;
          }
          d &= 1;
        }
        G(L, d);
        if (0 === (b.mode & 1)) b.memoizedState = null;
        else switch (e) {
          case "forwards":
            c = b.child;
            for (e = null; null !== c; ) a = c.alternate, null !== a && null === Ch(a) && (e = c), c = c.sibling;
            c = e;
            null === c ? (e = b.child, b.child = null) : (e = c.sibling, c.sibling = null);
            wj(b, false, e, c, f);
            break;
          case "backwards":
            c = null;
            e = b.child;
            for (b.child = null; null !== e; ) {
              a = e.alternate;
              if (null !== a && null === Ch(a)) {
                b.child = e;
                break;
              }
              a = e.sibling;
              e.sibling = c;
              c = e;
              e = a;
            }
            wj(b, true, c, null, f);
            break;
          case "together":
            wj(b, false, null, null, void 0);
            break;
          default:
            b.memoizedState = null;
        }
        return b.child;
      }
      function ij(a, b) {
        0 === (b.mode & 1) && null !== a && (a.alternate = null, b.alternate = null, b.flags |= 2);
      }
      function Zi(a, b, c) {
        null !== a && (b.dependencies = a.dependencies);
        rh |= b.lanes;
        if (0 === (c & b.childLanes)) return null;
        if (null !== a && b.child !== a.child) throw Error(p(153));
        if (null !== b.child) {
          a = b.child;
          c = Pg(a, a.pendingProps);
          b.child = c;
          for (c.return = b; null !== a.sibling; ) a = a.sibling, c = c.sibling = Pg(a, a.pendingProps), c.return = b;
          c.sibling = null;
        }
        return b.child;
      }
      function yj(a, b, c) {
        switch (b.tag) {
          case 3:
            kj(b);
            Ig();
            break;
          case 5:
            Ah(b);
            break;
          case 1:
            Zf(b.type) && cg(b);
            break;
          case 4:
            yh(b, b.stateNode.containerInfo);
            break;
          case 10:
            var d = b.type._context, e = b.memoizedProps.value;
            G(Wg, d._currentValue);
            d._currentValue = e;
            break;
          case 13:
            d = b.memoizedState;
            if (null !== d) {
              if (null !== d.dehydrated) return G(L, L.current & 1), b.flags |= 128, null;
              if (0 !== (c & b.child.childLanes)) return oj(a, b, c);
              G(L, L.current & 1);
              a = Zi(a, b, c);
              return null !== a ? a.sibling : null;
            }
            G(L, L.current & 1);
            break;
          case 19:
            d = 0 !== (c & b.childLanes);
            if (0 !== (a.flags & 128)) {
              if (d) return xj(a, b, c);
              b.flags |= 128;
            }
            e = b.memoizedState;
            null !== e && (e.rendering = null, e.tail = null, e.lastEffect = null);
            G(L, L.current);
            if (d) break;
            else return null;
          case 22:
          case 23:
            return b.lanes = 0, dj(a, b, c);
        }
        return Zi(a, b, c);
      }
      var zj;
      var Aj;
      var Bj;
      var Cj;
      zj = function(a, b) {
        for (var c = b.child; null !== c; ) {
          if (5 === c.tag || 6 === c.tag) a.appendChild(c.stateNode);
          else if (4 !== c.tag && null !== c.child) {
            c.child.return = c;
            c = c.child;
            continue;
          }
          if (c === b) break;
          for (; null === c.sibling; ) {
            if (null === c.return || c.return === b) return;
            c = c.return;
          }
          c.sibling.return = c.return;
          c = c.sibling;
        }
      };
      Aj = function() {
      };
      Bj = function(a, b, c, d) {
        var e = a.memoizedProps;
        if (e !== d) {
          a = b.stateNode;
          xh(uh.current);
          var f = null;
          switch (c) {
            case "input":
              e = Ya(a, e);
              d = Ya(a, d);
              f = [];
              break;
            case "select":
              e = A({}, e, { value: void 0 });
              d = A({}, d, { value: void 0 });
              f = [];
              break;
            case "textarea":
              e = gb(a, e);
              d = gb(a, d);
              f = [];
              break;
            default:
              "function" !== typeof e.onClick && "function" === typeof d.onClick && (a.onclick = Bf);
          }
          ub(c, d);
          var g;
          c = null;
          for (l in e) if (!d.hasOwnProperty(l) && e.hasOwnProperty(l) && null != e[l]) if ("style" === l) {
            var h = e[l];
            for (g in h) h.hasOwnProperty(g) && (c || (c = {}), c[g] = "");
          } else "dangerouslySetInnerHTML" !== l && "children" !== l && "suppressContentEditableWarning" !== l && "suppressHydrationWarning" !== l && "autoFocus" !== l && (ea.hasOwnProperty(l) ? f || (f = []) : (f = f || []).push(l, null));
          for (l in d) {
            var k = d[l];
            h = null != e ? e[l] : void 0;
            if (d.hasOwnProperty(l) && k !== h && (null != k || null != h)) if ("style" === l) if (h) {
              for (g in h) !h.hasOwnProperty(g) || k && k.hasOwnProperty(g) || (c || (c = {}), c[g] = "");
              for (g in k) k.hasOwnProperty(g) && h[g] !== k[g] && (c || (c = {}), c[g] = k[g]);
            } else c || (f || (f = []), f.push(
              l,
              c
            )), c = k;
            else "dangerouslySetInnerHTML" === l ? (k = k ? k.__html : void 0, h = h ? h.__html : void 0, null != k && h !== k && (f = f || []).push(l, k)) : "children" === l ? "string" !== typeof k && "number" !== typeof k || (f = f || []).push(l, "" + k) : "suppressContentEditableWarning" !== l && "suppressHydrationWarning" !== l && (ea.hasOwnProperty(l) ? (null != k && "onScroll" === l && D("scroll", a), f || h === k || (f = [])) : (f = f || []).push(l, k));
          }
          c && (f = f || []).push("style", c);
          var l = f;
          if (b.updateQueue = l) b.flags |= 4;
        }
      };
      Cj = function(a, b, c, d) {
        c !== d && (b.flags |= 4);
      };
      function Dj(a, b) {
        if (!I2) switch (a.tailMode) {
          case "hidden":
            b = a.tail;
            for (var c = null; null !== b; ) null !== b.alternate && (c = b), b = b.sibling;
            null === c ? a.tail = null : c.sibling = null;
            break;
          case "collapsed":
            c = a.tail;
            for (var d = null; null !== c; ) null !== c.alternate && (d = c), c = c.sibling;
            null === d ? b || null === a.tail ? a.tail = null : a.tail.sibling = null : d.sibling = null;
        }
      }
      function S(a) {
        var b = null !== a.alternate && a.alternate.child === a.child, c = 0, d = 0;
        if (b) for (var e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags & 14680064, d |= e.flags & 14680064, e.return = a, e = e.sibling;
        else for (e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags, d |= e.flags, e.return = a, e = e.sibling;
        a.subtreeFlags |= d;
        a.childLanes = c;
        return b;
      }
      function Ej(a, b, c) {
        var d = b.pendingProps;
        wg(b);
        switch (b.tag) {
          case 2:
          case 16:
          case 15:
          case 0:
          case 11:
          case 7:
          case 8:
          case 12:
          case 9:
          case 14:
            return S(b), null;
          case 1:
            return Zf(b.type) && $f(), S(b), null;
          case 3:
            d = b.stateNode;
            zh();
            E(Wf);
            E(H);
            Eh();
            d.pendingContext && (d.context = d.pendingContext, d.pendingContext = null);
            if (null === a || null === a.child) Gg(b) ? b.flags |= 4 : null === a || a.memoizedState.isDehydrated && 0 === (b.flags & 256) || (b.flags |= 1024, null !== zg && (Fj(zg), zg = null));
            Aj(a, b);
            S(b);
            return null;
          case 5:
            Bh(b);
            var e = xh(wh.current);
            c = b.type;
            if (null !== a && null != b.stateNode) Bj(a, b, c, d, e), a.ref !== b.ref && (b.flags |= 512, b.flags |= 2097152);
            else {
              if (!d) {
                if (null === b.stateNode) throw Error(p(166));
                S(b);
                return null;
              }
              a = xh(uh.current);
              if (Gg(b)) {
                d = b.stateNode;
                c = b.type;
                var f = b.memoizedProps;
                d[Of] = b;
                d[Pf] = f;
                a = 0 !== (b.mode & 1);
                switch (c) {
                  case "dialog":
                    D("cancel", d);
                    D("close", d);
                    break;
                  case "iframe":
                  case "object":
                  case "embed":
                    D("load", d);
                    break;
                  case "video":
                  case "audio":
                    for (e = 0; e < lf.length; e++) D(lf[e], d);
                    break;
                  case "source":
                    D("error", d);
                    break;
                  case "img":
                  case "image":
                  case "link":
                    D(
                      "error",
                      d
                    );
                    D("load", d);
                    break;
                  case "details":
                    D("toggle", d);
                    break;
                  case "input":
                    Za(d, f);
                    D("invalid", d);
                    break;
                  case "select":
                    d._wrapperState = { wasMultiple: !!f.multiple };
                    D("invalid", d);
                    break;
                  case "textarea":
                    hb(d, f), D("invalid", d);
                }
                ub(c, f);
                e = null;
                for (var g in f) if (f.hasOwnProperty(g)) {
                  var h = f[g];
                  "children" === g ? "string" === typeof h ? d.textContent !== h && (true !== f.suppressHydrationWarning && Af(d.textContent, h, a), e = ["children", h]) : "number" === typeof h && d.textContent !== "" + h && (true !== f.suppressHydrationWarning && Af(
                    d.textContent,
                    h,
                    a
                  ), e = ["children", "" + h]) : ea.hasOwnProperty(g) && null != h && "onScroll" === g && D("scroll", d);
                }
                switch (c) {
                  case "input":
                    Va(d);
                    db(d, f, true);
                    break;
                  case "textarea":
                    Va(d);
                    jb(d);
                    break;
                  case "select":
                  case "option":
                    break;
                  default:
                    "function" === typeof f.onClick && (d.onclick = Bf);
                }
                d = e;
                b.updateQueue = d;
                null !== d && (b.flags |= 4);
              } else {
                g = 9 === e.nodeType ? e : e.ownerDocument;
                "http://www.w3.org/1999/xhtml" === a && (a = kb(c));
                "http://www.w3.org/1999/xhtml" === a ? "script" === c ? (a = g.createElement("div"), a.innerHTML = "<script><\/script>", a = a.removeChild(a.firstChild)) : "string" === typeof d.is ? a = g.createElement(c, { is: d.is }) : (a = g.createElement(c), "select" === c && (g = a, d.multiple ? g.multiple = true : d.size && (g.size = d.size))) : a = g.createElementNS(a, c);
                a[Of] = b;
                a[Pf] = d;
                zj(a, b, false, false);
                b.stateNode = a;
                a: {
                  g = vb(c, d);
                  switch (c) {
                    case "dialog":
                      D("cancel", a);
                      D("close", a);
                      e = d;
                      break;
                    case "iframe":
                    case "object":
                    case "embed":
                      D("load", a);
                      e = d;
                      break;
                    case "video":
                    case "audio":
                      for (e = 0; e < lf.length; e++) D(lf[e], a);
                      e = d;
                      break;
                    case "source":
                      D("error", a);
                      e = d;
                      break;
                    case "img":
                    case "image":
                    case "link":
                      D(
                        "error",
                        a
                      );
                      D("load", a);
                      e = d;
                      break;
                    case "details":
                      D("toggle", a);
                      e = d;
                      break;
                    case "input":
                      Za(a, d);
                      e = Ya(a, d);
                      D("invalid", a);
                      break;
                    case "option":
                      e = d;
                      break;
                    case "select":
                      a._wrapperState = { wasMultiple: !!d.multiple };
                      e = A({}, d, { value: void 0 });
                      D("invalid", a);
                      break;
                    case "textarea":
                      hb(a, d);
                      e = gb(a, d);
                      D("invalid", a);
                      break;
                    default:
                      e = d;
                  }
                  ub(c, e);
                  h = e;
                  for (f in h) if (h.hasOwnProperty(f)) {
                    var k = h[f];
                    "style" === f ? sb(a, k) : "dangerouslySetInnerHTML" === f ? (k = k ? k.__html : void 0, null != k && nb(a, k)) : "children" === f ? "string" === typeof k ? ("textarea" !== c || "" !== k) && ob(a, k) : "number" === typeof k && ob(a, "" + k) : "suppressContentEditableWarning" !== f && "suppressHydrationWarning" !== f && "autoFocus" !== f && (ea.hasOwnProperty(f) ? null != k && "onScroll" === f && D("scroll", a) : null != k && ta(a, f, k, g));
                  }
                  switch (c) {
                    case "input":
                      Va(a);
                      db(a, d, false);
                      break;
                    case "textarea":
                      Va(a);
                      jb(a);
                      break;
                    case "option":
                      null != d.value && a.setAttribute("value", "" + Sa(d.value));
                      break;
                    case "select":
                      a.multiple = !!d.multiple;
                      f = d.value;
                      null != f ? fb(a, !!d.multiple, f, false) : null != d.defaultValue && fb(
                        a,
                        !!d.multiple,
                        d.defaultValue,
                        true
                      );
                      break;
                    default:
                      "function" === typeof e.onClick && (a.onclick = Bf);
                  }
                  switch (c) {
                    case "button":
                    case "input":
                    case "select":
                    case "textarea":
                      d = !!d.autoFocus;
                      break a;
                    case "img":
                      d = true;
                      break a;
                    default:
                      d = false;
                  }
                }
                d && (b.flags |= 4);
              }
              null !== b.ref && (b.flags |= 512, b.flags |= 2097152);
            }
            S(b);
            return null;
          case 6:
            if (a && null != b.stateNode) Cj(a, b, a.memoizedProps, d);
            else {
              if ("string" !== typeof d && null === b.stateNode) throw Error(p(166));
              c = xh(wh.current);
              xh(uh.current);
              if (Gg(b)) {
                d = b.stateNode;
                c = b.memoizedProps;
                d[Of] = b;
                if (f = d.nodeValue !== c) {
                  if (a = xg, null !== a) switch (a.tag) {
                    case 3:
                      Af(d.nodeValue, c, 0 !== (a.mode & 1));
                      break;
                    case 5:
                      true !== a.memoizedProps.suppressHydrationWarning && Af(d.nodeValue, c, 0 !== (a.mode & 1));
                  }
                }
                f && (b.flags |= 4);
              } else d = (9 === c.nodeType ? c : c.ownerDocument).createTextNode(d), d[Of] = b, b.stateNode = d;
            }
            S(b);
            return null;
          case 13:
            E(L);
            d = b.memoizedState;
            if (null === a || null !== a.memoizedState && null !== a.memoizedState.dehydrated) {
              if (I2 && null !== yg && 0 !== (b.mode & 1) && 0 === (b.flags & 128)) Hg(), Ig(), b.flags |= 98560, f = false;
              else if (f = Gg(b), null !== d && null !== d.dehydrated) {
                if (null === a) {
                  if (!f) throw Error(p(318));
                  f = b.memoizedState;
                  f = null !== f ? f.dehydrated : null;
                  if (!f) throw Error(p(317));
                  f[Of] = b;
                } else Ig(), 0 === (b.flags & 128) && (b.memoizedState = null), b.flags |= 4;
                S(b);
                f = false;
              } else null !== zg && (Fj(zg), zg = null), f = true;
              if (!f) return b.flags & 65536 ? b : null;
            }
            if (0 !== (b.flags & 128)) return b.lanes = c, b;
            d = null !== d;
            d !== (null !== a && null !== a.memoizedState) && d && (b.child.flags |= 8192, 0 !== (b.mode & 1) && (null === a || 0 !== (L.current & 1) ? 0 === T && (T = 3) : tj()));
            null !== b.updateQueue && (b.flags |= 4);
            S(b);
            return null;
          case 4:
            return zh(), Aj(a, b), null === a && sf(b.stateNode.containerInfo), S(b), null;
          case 10:
            return ah(b.type._context), S(b), null;
          case 17:
            return Zf(b.type) && $f(), S(b), null;
          case 19:
            E(L);
            f = b.memoizedState;
            if (null === f) return S(b), null;
            d = 0 !== (b.flags & 128);
            g = f.rendering;
            if (null === g) if (d) Dj(f, false);
            else {
              if (0 !== T || null !== a && 0 !== (a.flags & 128)) for (a = b.child; null !== a; ) {
                g = Ch(a);
                if (null !== g) {
                  b.flags |= 128;
                  Dj(f, false);
                  d = g.updateQueue;
                  null !== d && (b.updateQueue = d, b.flags |= 4);
                  b.subtreeFlags = 0;
                  d = c;
                  for (c = b.child; null !== c; ) f = c, a = d, f.flags &= 14680066, g = f.alternate, null === g ? (f.childLanes = 0, f.lanes = a, f.child = null, f.subtreeFlags = 0, f.memoizedProps = null, f.memoizedState = null, f.updateQueue = null, f.dependencies = null, f.stateNode = null) : (f.childLanes = g.childLanes, f.lanes = g.lanes, f.child = g.child, f.subtreeFlags = 0, f.deletions = null, f.memoizedProps = g.memoizedProps, f.memoizedState = g.memoizedState, f.updateQueue = g.updateQueue, f.type = g.type, a = g.dependencies, f.dependencies = null === a ? null : { lanes: a.lanes, firstContext: a.firstContext }), c = c.sibling;
                  G(L, L.current & 1 | 2);
                  return b.child;
                }
                a = a.sibling;
              }
              null !== f.tail && B() > Gj && (b.flags |= 128, d = true, Dj(f, false), b.lanes = 4194304);
            }
            else {
              if (!d) if (a = Ch(g), null !== a) {
                if (b.flags |= 128, d = true, c = a.updateQueue, null !== c && (b.updateQueue = c, b.flags |= 4), Dj(f, true), null === f.tail && "hidden" === f.tailMode && !g.alternate && !I2) return S(b), null;
              } else 2 * B() - f.renderingStartTime > Gj && 1073741824 !== c && (b.flags |= 128, d = true, Dj(f, false), b.lanes = 4194304);
              f.isBackwards ? (g.sibling = b.child, b.child = g) : (c = f.last, null !== c ? c.sibling = g : b.child = g, f.last = g);
            }
            if (null !== f.tail) return b = f.tail, f.rendering = b, f.tail = b.sibling, f.renderingStartTime = B(), b.sibling = null, c = L.current, G(L, d ? c & 1 | 2 : c & 1), b;
            S(b);
            return null;
          case 22:
          case 23:
            return Hj(), d = null !== b.memoizedState, null !== a && null !== a.memoizedState !== d && (b.flags |= 8192), d && 0 !== (b.mode & 1) ? 0 !== (fj & 1073741824) && (S(b), b.subtreeFlags & 6 && (b.flags |= 8192)) : S(b), null;
          case 24:
            return null;
          case 25:
            return null;
        }
        throw Error(p(156, b.tag));
      }
      function Ij(a, b) {
        wg(b);
        switch (b.tag) {
          case 1:
            return Zf(b.type) && $f(), a = b.flags, a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
          case 3:
            return zh(), E(Wf), E(H), Eh(), a = b.flags, 0 !== (a & 65536) && 0 === (a & 128) ? (b.flags = a & -65537 | 128, b) : null;
          case 5:
            return Bh(b), null;
          case 13:
            E(L);
            a = b.memoizedState;
            if (null !== a && null !== a.dehydrated) {
              if (null === b.alternate) throw Error(p(340));
              Ig();
            }
            a = b.flags;
            return a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
          case 19:
            return E(L), null;
          case 4:
            return zh(), null;
          case 10:
            return ah(b.type._context), null;
          case 22:
          case 23:
            return Hj(), null;
          case 24:
            return null;
          default:
            return null;
        }
      }
      var Jj = false;
      var U = false;
      var Kj = "function" === typeof WeakSet ? WeakSet : Set;
      var V = null;
      function Lj(a, b) {
        var c = a.ref;
        if (null !== c) if ("function" === typeof c) try {
          c(null);
        } catch (d) {
          W(a, b, d);
        }
        else c.current = null;
      }
      function Mj(a, b, c) {
        try {
          c();
        } catch (d) {
          W(a, b, d);
        }
      }
      var Nj = false;
      function Oj(a, b) {
        Cf = dd;
        a = Me();
        if (Ne(a)) {
          if ("selectionStart" in a) var c = { start: a.selectionStart, end: a.selectionEnd };
          else a: {
            c = (c = a.ownerDocument) && c.defaultView || window;
            var d = c.getSelection && c.getSelection();
            if (d && 0 !== d.rangeCount) {
              c = d.anchorNode;
              var e = d.anchorOffset, f = d.focusNode;
              d = d.focusOffset;
              try {
                c.nodeType, f.nodeType;
              } catch (F) {
                c = null;
                break a;
              }
              var g = 0, h = -1, k = -1, l = 0, m = 0, q = a, r = null;
              b: for (; ; ) {
                for (var y; ; ) {
                  q !== c || 0 !== e && 3 !== q.nodeType || (h = g + e);
                  q !== f || 0 !== d && 3 !== q.nodeType || (k = g + d);
                  3 === q.nodeType && (g += q.nodeValue.length);
                  if (null === (y = q.firstChild)) break;
                  r = q;
                  q = y;
                }
                for (; ; ) {
                  if (q === a) break b;
                  r === c && ++l === e && (h = g);
                  r === f && ++m === d && (k = g);
                  if (null !== (y = q.nextSibling)) break;
                  q = r;
                  r = q.parentNode;
                }
                q = y;
              }
              c = -1 === h || -1 === k ? null : { start: h, end: k };
            } else c = null;
          }
          c = c || { start: 0, end: 0 };
        } else c = null;
        Df = { focusedElem: a, selectionRange: c };
        dd = false;
        for (V = b; null !== V; ) if (b = V, a = b.child, 0 !== (b.subtreeFlags & 1028) && null !== a) a.return = b, V = a;
        else for (; null !== V; ) {
          b = V;
          try {
            var n = b.alternate;
            if (0 !== (b.flags & 1024)) switch (b.tag) {
              case 0:
              case 11:
              case 15:
                break;
              case 1:
                if (null !== n) {
                  var t = n.memoizedProps, J = n.memoizedState, x = b.stateNode, w = x.getSnapshotBeforeUpdate(b.elementType === b.type ? t : Ci(b.type, t), J);
                  x.__reactInternalSnapshotBeforeUpdate = w;
                }
                break;
              case 3:
                var u = b.stateNode.containerInfo;
                1 === u.nodeType ? u.textContent = "" : 9 === u.nodeType && u.documentElement && u.removeChild(u.documentElement);
                break;
              case 5:
              case 6:
              case 4:
              case 17:
                break;
              default:
                throw Error(p(163));
            }
          } catch (F) {
            W(b, b.return, F);
          }
          a = b.sibling;
          if (null !== a) {
            a.return = b.return;
            V = a;
            break;
          }
          V = b.return;
        }
        n = Nj;
        Nj = false;
        return n;
      }
      function Pj(a, b, c) {
        var d = b.updateQueue;
        d = null !== d ? d.lastEffect : null;
        if (null !== d) {
          var e = d = d.next;
          do {
            if ((e.tag & a) === a) {
              var f = e.destroy;
              e.destroy = void 0;
              void 0 !== f && Mj(b, c, f);
            }
            e = e.next;
          } while (e !== d);
        }
      }
      function Qj(a, b) {
        b = b.updateQueue;
        b = null !== b ? b.lastEffect : null;
        if (null !== b) {
          var c = b = b.next;
          do {
            if ((c.tag & a) === a) {
              var d = c.create;
              c.destroy = d();
            }
            c = c.next;
          } while (c !== b);
        }
      }
      function Rj(a) {
        var b = a.ref;
        if (null !== b) {
          var c = a.stateNode;
          switch (a.tag) {
            case 5:
              a = c;
              break;
            default:
              a = c;
          }
          "function" === typeof b ? b(a) : b.current = a;
        }
      }
      function Sj(a) {
        var b = a.alternate;
        null !== b && (a.alternate = null, Sj(b));
        a.child = null;
        a.deletions = null;
        a.sibling = null;
        5 === a.tag && (b = a.stateNode, null !== b && (delete b[Of], delete b[Pf], delete b[of], delete b[Qf], delete b[Rf]));
        a.stateNode = null;
        a.return = null;
        a.dependencies = null;
        a.memoizedProps = null;
        a.memoizedState = null;
        a.pendingProps = null;
        a.stateNode = null;
        a.updateQueue = null;
      }
      function Tj(a) {
        return 5 === a.tag || 3 === a.tag || 4 === a.tag;
      }
      function Uj(a) {
        a: for (; ; ) {
          for (; null === a.sibling; ) {
            if (null === a.return || Tj(a.return)) return null;
            a = a.return;
          }
          a.sibling.return = a.return;
          for (a = a.sibling; 5 !== a.tag && 6 !== a.tag && 18 !== a.tag; ) {
            if (a.flags & 2) continue a;
            if (null === a.child || 4 === a.tag) continue a;
            else a.child.return = a, a = a.child;
          }
          if (!(a.flags & 2)) return a.stateNode;
        }
      }
      function Vj(a, b, c) {
        var d = a.tag;
        if (5 === d || 6 === d) a = a.stateNode, b ? 8 === c.nodeType ? c.parentNode.insertBefore(a, b) : c.insertBefore(a, b) : (8 === c.nodeType ? (b = c.parentNode, b.insertBefore(a, c)) : (b = c, b.appendChild(a)), c = c._reactRootContainer, null !== c && void 0 !== c || null !== b.onclick || (b.onclick = Bf));
        else if (4 !== d && (a = a.child, null !== a)) for (Vj(a, b, c), a = a.sibling; null !== a; ) Vj(a, b, c), a = a.sibling;
      }
      function Wj(a, b, c) {
        var d = a.tag;
        if (5 === d || 6 === d) a = a.stateNode, b ? c.insertBefore(a, b) : c.appendChild(a);
        else if (4 !== d && (a = a.child, null !== a)) for (Wj(a, b, c), a = a.sibling; null !== a; ) Wj(a, b, c), a = a.sibling;
      }
      var X2 = null;
      var Xj = false;
      function Yj(a, b, c) {
        for (c = c.child; null !== c; ) Zj(a, b, c), c = c.sibling;
      }
      function Zj(a, b, c) {
        if (lc && "function" === typeof lc.onCommitFiberUnmount) try {
          lc.onCommitFiberUnmount(kc, c);
        } catch (h) {
        }
        switch (c.tag) {
          case 5:
            U || Lj(c, b);
          case 6:
            var d = X2, e = Xj;
            X2 = null;
            Yj(a, b, c);
            X2 = d;
            Xj = e;
            null !== X2 && (Xj ? (a = X2, c = c.stateNode, 8 === a.nodeType ? a.parentNode.removeChild(c) : a.removeChild(c)) : X2.removeChild(c.stateNode));
            break;
          case 18:
            null !== X2 && (Xj ? (a = X2, c = c.stateNode, 8 === a.nodeType ? Kf(a.parentNode, c) : 1 === a.nodeType && Kf(a, c), bd(a)) : Kf(X2, c.stateNode));
            break;
          case 4:
            d = X2;
            e = Xj;
            X2 = c.stateNode.containerInfo;
            Xj = true;
            Yj(a, b, c);
            X2 = d;
            Xj = e;
            break;
          case 0:
          case 11:
          case 14:
          case 15:
            if (!U && (d = c.updateQueue, null !== d && (d = d.lastEffect, null !== d))) {
              e = d = d.next;
              do {
                var f = e, g = f.destroy;
                f = f.tag;
                void 0 !== g && (0 !== (f & 2) ? Mj(c, b, g) : 0 !== (f & 4) && Mj(c, b, g));
                e = e.next;
              } while (e !== d);
            }
            Yj(a, b, c);
            break;
          case 1:
            if (!U && (Lj(c, b), d = c.stateNode, "function" === typeof d.componentWillUnmount)) try {
              d.props = c.memoizedProps, d.state = c.memoizedState, d.componentWillUnmount();
            } catch (h) {
              W(c, b, h);
            }
            Yj(a, b, c);
            break;
          case 21:
            Yj(a, b, c);
            break;
          case 22:
            c.mode & 1 ? (U = (d = U) || null !== c.memoizedState, Yj(a, b, c), U = d) : Yj(a, b, c);
            break;
          default:
            Yj(a, b, c);
        }
      }
      function ak(a) {
        var b = a.updateQueue;
        if (null !== b) {
          a.updateQueue = null;
          var c = a.stateNode;
          null === c && (c = a.stateNode = new Kj());
          b.forEach(function(b2) {
            var d = bk.bind(null, a, b2);
            c.has(b2) || (c.add(b2), b2.then(d, d));
          });
        }
      }
      function ck(a, b) {
        var c = b.deletions;
        if (null !== c) for (var d = 0; d < c.length; d++) {
          var e = c[d];
          try {
            var f = a, g = b, h = g;
            a: for (; null !== h; ) {
              switch (h.tag) {
                case 5:
                  X2 = h.stateNode;
                  Xj = false;
                  break a;
                case 3:
                  X2 = h.stateNode.containerInfo;
                  Xj = true;
                  break a;
                case 4:
                  X2 = h.stateNode.containerInfo;
                  Xj = true;
                  break a;
              }
              h = h.return;
            }
            if (null === X2) throw Error(p(160));
            Zj(f, g, e);
            X2 = null;
            Xj = false;
            var k = e.alternate;
            null !== k && (k.return = null);
            e.return = null;
          } catch (l) {
            W(e, b, l);
          }
        }
        if (b.subtreeFlags & 12854) for (b = b.child; null !== b; ) dk(b, a), b = b.sibling;
      }
      function dk(a, b) {
        var c = a.alternate, d = a.flags;
        switch (a.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            ck(b, a);
            ek(a);
            if (d & 4) {
              try {
                Pj(3, a, a.return), Qj(3, a);
              } catch (t) {
                W(a, a.return, t);
              }
              try {
                Pj(5, a, a.return);
              } catch (t) {
                W(a, a.return, t);
              }
            }
            break;
          case 1:
            ck(b, a);
            ek(a);
            d & 512 && null !== c && Lj(c, c.return);
            break;
          case 5:
            ck(b, a);
            ek(a);
            d & 512 && null !== c && Lj(c, c.return);
            if (a.flags & 32) {
              var e = a.stateNode;
              try {
                ob(e, "");
              } catch (t) {
                W(a, a.return, t);
              }
            }
            if (d & 4 && (e = a.stateNode, null != e)) {
              var f = a.memoizedProps, g = null !== c ? c.memoizedProps : f, h = a.type, k = a.updateQueue;
              a.updateQueue = null;
              if (null !== k) try {
                "input" === h && "radio" === f.type && null != f.name && ab(e, f);
                vb(h, g);
                var l = vb(h, f);
                for (g = 0; g < k.length; g += 2) {
                  var m = k[g], q = k[g + 1];
                  "style" === m ? sb(e, q) : "dangerouslySetInnerHTML" === m ? nb(e, q) : "children" === m ? ob(e, q) : ta(e, m, q, l);
                }
                switch (h) {
                  case "input":
                    bb(e, f);
                    break;
                  case "textarea":
                    ib(e, f);
                    break;
                  case "select":
                    var r = e._wrapperState.wasMultiple;
                    e._wrapperState.wasMultiple = !!f.multiple;
                    var y = f.value;
                    null != y ? fb(e, !!f.multiple, y, false) : r !== !!f.multiple && (null != f.defaultValue ? fb(
                      e,
                      !!f.multiple,
                      f.defaultValue,
                      true
                    ) : fb(e, !!f.multiple, f.multiple ? [] : "", false));
                }
                e[Pf] = f;
              } catch (t) {
                W(a, a.return, t);
              }
            }
            break;
          case 6:
            ck(b, a);
            ek(a);
            if (d & 4) {
              if (null === a.stateNode) throw Error(p(162));
              e = a.stateNode;
              f = a.memoizedProps;
              try {
                e.nodeValue = f;
              } catch (t) {
                W(a, a.return, t);
              }
            }
            break;
          case 3:
            ck(b, a);
            ek(a);
            if (d & 4 && null !== c && c.memoizedState.isDehydrated) try {
              bd(b.containerInfo);
            } catch (t) {
              W(a, a.return, t);
            }
            break;
          case 4:
            ck(b, a);
            ek(a);
            break;
          case 13:
            ck(b, a);
            ek(a);
            e = a.child;
            e.flags & 8192 && (f = null !== e.memoizedState, e.stateNode.isHidden = f, !f || null !== e.alternate && null !== e.alternate.memoizedState || (fk = B()));
            d & 4 && ak(a);
            break;
          case 22:
            m = null !== c && null !== c.memoizedState;
            a.mode & 1 ? (U = (l = U) || m, ck(b, a), U = l) : ck(b, a);
            ek(a);
            if (d & 8192) {
              l = null !== a.memoizedState;
              if ((a.stateNode.isHidden = l) && !m && 0 !== (a.mode & 1)) for (V = a, m = a.child; null !== m; ) {
                for (q = V = m; null !== V; ) {
                  r = V;
                  y = r.child;
                  switch (r.tag) {
                    case 0:
                    case 11:
                    case 14:
                    case 15:
                      Pj(4, r, r.return);
                      break;
                    case 1:
                      Lj(r, r.return);
                      var n = r.stateNode;
                      if ("function" === typeof n.componentWillUnmount) {
                        d = r;
                        c = r.return;
                        try {
                          b = d, n.props = b.memoizedProps, n.state = b.memoizedState, n.componentWillUnmount();
                        } catch (t) {
                          W(d, c, t);
                        }
                      }
                      break;
                    case 5:
                      Lj(r, r.return);
                      break;
                    case 22:
                      if (null !== r.memoizedState) {
                        gk(q);
                        continue;
                      }
                  }
                  null !== y ? (y.return = r, V = y) : gk(q);
                }
                m = m.sibling;
              }
              a: for (m = null, q = a; ; ) {
                if (5 === q.tag) {
                  if (null === m) {
                    m = q;
                    try {
                      e = q.stateNode, l ? (f = e.style, "function" === typeof f.setProperty ? f.setProperty("display", "none", "important") : f.display = "none") : (h = q.stateNode, k = q.memoizedProps.style, g = void 0 !== k && null !== k && k.hasOwnProperty("display") ? k.display : null, h.style.display = rb("display", g));
                    } catch (t) {
                      W(a, a.return, t);
                    }
                  }
                } else if (6 === q.tag) {
                  if (null === m) try {
                    q.stateNode.nodeValue = l ? "" : q.memoizedProps;
                  } catch (t) {
                    W(a, a.return, t);
                  }
                } else if ((22 !== q.tag && 23 !== q.tag || null === q.memoizedState || q === a) && null !== q.child) {
                  q.child.return = q;
                  q = q.child;
                  continue;
                }
                if (q === a) break a;
                for (; null === q.sibling; ) {
                  if (null === q.return || q.return === a) break a;
                  m === q && (m = null);
                  q = q.return;
                }
                m === q && (m = null);
                q.sibling.return = q.return;
                q = q.sibling;
              }
            }
            break;
          case 19:
            ck(b, a);
            ek(a);
            d & 4 && ak(a);
            break;
          case 21:
            break;
          default:
            ck(
              b,
              a
            ), ek(a);
        }
      }
      function ek(a) {
        var b = a.flags;
        if (b & 2) {
          try {
            a: {
              for (var c = a.return; null !== c; ) {
                if (Tj(c)) {
                  var d = c;
                  break a;
                }
                c = c.return;
              }
              throw Error(p(160));
            }
            switch (d.tag) {
              case 5:
                var e = d.stateNode;
                d.flags & 32 && (ob(e, ""), d.flags &= -33);
                var f = Uj(a);
                Wj(a, f, e);
                break;
              case 3:
              case 4:
                var g = d.stateNode.containerInfo, h = Uj(a);
                Vj(a, h, g);
                break;
              default:
                throw Error(p(161));
            }
          } catch (k) {
            W(a, a.return, k);
          }
          a.flags &= -3;
        }
        b & 4096 && (a.flags &= -4097);
      }
      function hk(a, b, c) {
        V = a;
        ik(a, b, c);
      }
      function ik(a, b, c) {
        for (var d = 0 !== (a.mode & 1); null !== V; ) {
          var e = V, f = e.child;
          if (22 === e.tag && d) {
            var g = null !== e.memoizedState || Jj;
            if (!g) {
              var h = e.alternate, k = null !== h && null !== h.memoizedState || U;
              h = Jj;
              var l = U;
              Jj = g;
              if ((U = k) && !l) for (V = e; null !== V; ) g = V, k = g.child, 22 === g.tag && null !== g.memoizedState ? jk(e) : null !== k ? (k.return = g, V = k) : jk(e);
              for (; null !== f; ) V = f, ik(f, b, c), f = f.sibling;
              V = e;
              Jj = h;
              U = l;
            }
            kk(a, b, c);
          } else 0 !== (e.subtreeFlags & 8772) && null !== f ? (f.return = e, V = f) : kk(a, b, c);
        }
      }
      function kk(a) {
        for (; null !== V; ) {
          var b = V;
          if (0 !== (b.flags & 8772)) {
            var c = b.alternate;
            try {
              if (0 !== (b.flags & 8772)) switch (b.tag) {
                case 0:
                case 11:
                case 15:
                  U || Qj(5, b);
                  break;
                case 1:
                  var d = b.stateNode;
                  if (b.flags & 4 && !U) if (null === c) d.componentDidMount();
                  else {
                    var e = b.elementType === b.type ? c.memoizedProps : Ci(b.type, c.memoizedProps);
                    d.componentDidUpdate(e, c.memoizedState, d.__reactInternalSnapshotBeforeUpdate);
                  }
                  var f = b.updateQueue;
                  null !== f && sh(b, f, d);
                  break;
                case 3:
                  var g = b.updateQueue;
                  if (null !== g) {
                    c = null;
                    if (null !== b.child) switch (b.child.tag) {
                      case 5:
                        c = b.child.stateNode;
                        break;
                      case 1:
                        c = b.child.stateNode;
                    }
                    sh(b, g, c);
                  }
                  break;
                case 5:
                  var h = b.stateNode;
                  if (null === c && b.flags & 4) {
                    c = h;
                    var k = b.memoizedProps;
                    switch (b.type) {
                      case "button":
                      case "input":
                      case "select":
                      case "textarea":
                        k.autoFocus && c.focus();
                        break;
                      case "img":
                        k.src && (c.src = k.src);
                    }
                  }
                  break;
                case 6:
                  break;
                case 4:
                  break;
                case 12:
                  break;
                case 13:
                  if (null === b.memoizedState) {
                    var l = b.alternate;
                    if (null !== l) {
                      var m = l.memoizedState;
                      if (null !== m) {
                        var q = m.dehydrated;
                        null !== q && bd(q);
                      }
                    }
                  }
                  break;
                case 19:
                case 17:
                case 21:
                case 22:
                case 23:
                case 25:
                  break;
                default:
                  throw Error(p(163));
              }
              U || b.flags & 512 && Rj(b);
            } catch (r) {
              W(b, b.return, r);
            }
          }
          if (b === a) {
            V = null;
            break;
          }
          c = b.sibling;
          if (null !== c) {
            c.return = b.return;
            V = c;
            break;
          }
          V = b.return;
        }
      }
      function gk(a) {
        for (; null !== V; ) {
          var b = V;
          if (b === a) {
            V = null;
            break;
          }
          var c = b.sibling;
          if (null !== c) {
            c.return = b.return;
            V = c;
            break;
          }
          V = b.return;
        }
      }
      function jk(a) {
        for (; null !== V; ) {
          var b = V;
          try {
            switch (b.tag) {
              case 0:
              case 11:
              case 15:
                var c = b.return;
                try {
                  Qj(4, b);
                } catch (k) {
                  W(b, c, k);
                }
                break;
              case 1:
                var d = b.stateNode;
                if ("function" === typeof d.componentDidMount) {
                  var e = b.return;
                  try {
                    d.componentDidMount();
                  } catch (k) {
                    W(b, e, k);
                  }
                }
                var f = b.return;
                try {
                  Rj(b);
                } catch (k) {
                  W(b, f, k);
                }
                break;
              case 5:
                var g = b.return;
                try {
                  Rj(b);
                } catch (k) {
                  W(b, g, k);
                }
            }
          } catch (k) {
            W(b, b.return, k);
          }
          if (b === a) {
            V = null;
            break;
          }
          var h = b.sibling;
          if (null !== h) {
            h.return = b.return;
            V = h;
            break;
          }
          V = b.return;
        }
      }
      var lk = Math.ceil;
      var mk = ua.ReactCurrentDispatcher;
      var nk = ua.ReactCurrentOwner;
      var ok = ua.ReactCurrentBatchConfig;
      var K = 0;
      var Q = null;
      var Y = null;
      var Z = 0;
      var fj = 0;
      var ej = Uf(0);
      var T = 0;
      var pk = null;
      var rh = 0;
      var qk = 0;
      var rk = 0;
      var sk = null;
      var tk = null;
      var fk = 0;
      var Gj = Infinity;
      var uk = null;
      var Oi = false;
      var Pi = null;
      var Ri = null;
      var vk = false;
      var wk = null;
      var xk = 0;
      var yk = 0;
      var zk = null;
      var Ak = -1;
      var Bk = 0;
      function R() {
        return 0 !== (K & 6) ? B() : -1 !== Ak ? Ak : Ak = B();
      }
      function yi(a) {
        if (0 === (a.mode & 1)) return 1;
        if (0 !== (K & 2) && 0 !== Z) return Z & -Z;
        if (null !== Kg.transition) return 0 === Bk && (Bk = yc()), Bk;
        a = C;
        if (0 !== a) return a;
        a = window.event;
        a = void 0 === a ? 16 : jd(a.type);
        return a;
      }
      function gi(a, b, c, d) {
        if (50 < yk) throw yk = 0, zk = null, Error(p(185));
        Ac(a, c, d);
        if (0 === (K & 2) || a !== Q) a === Q && (0 === (K & 2) && (qk |= c), 4 === T && Ck(a, Z)), Dk(a, d), 1 === c && 0 === K && 0 === (b.mode & 1) && (Gj = B() + 500, fg && jg());
      }
      function Dk(a, b) {
        var c = a.callbackNode;
        wc(a, b);
        var d = uc(a, a === Q ? Z : 0);
        if (0 === d) null !== c && bc(c), a.callbackNode = null, a.callbackPriority = 0;
        else if (b = d & -d, a.callbackPriority !== b) {
          null != c && bc(c);
          if (1 === b) 0 === a.tag ? ig(Ek.bind(null, a)) : hg(Ek.bind(null, a)), Jf(function() {
            0 === (K & 6) && jg();
          }), c = null;
          else {
            switch (Dc(d)) {
              case 1:
                c = fc;
                break;
              case 4:
                c = gc;
                break;
              case 16:
                c = hc;
                break;
              case 536870912:
                c = jc;
                break;
              default:
                c = hc;
            }
            c = Fk(c, Gk.bind(null, a));
          }
          a.callbackPriority = b;
          a.callbackNode = c;
        }
      }
      function Gk(a, b) {
        Ak = -1;
        Bk = 0;
        if (0 !== (K & 6)) throw Error(p(327));
        var c = a.callbackNode;
        if (Hk() && a.callbackNode !== c) return null;
        var d = uc(a, a === Q ? Z : 0);
        if (0 === d) return null;
        if (0 !== (d & 30) || 0 !== (d & a.expiredLanes) || b) b = Ik(a, d);
        else {
          b = d;
          var e = K;
          K |= 2;
          var f = Jk();
          if (Q !== a || Z !== b) uk = null, Gj = B() + 500, Kk(a, b);
          do
            try {
              Lk();
              break;
            } catch (h) {
              Mk(a, h);
            }
          while (1);
          $g();
          mk.current = f;
          K = e;
          null !== Y ? b = 0 : (Q = null, Z = 0, b = T);
        }
        if (0 !== b) {
          2 === b && (e = xc(a), 0 !== e && (d = e, b = Nk(a, e)));
          if (1 === b) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
          if (6 === b) Ck(a, d);
          else {
            e = a.current.alternate;
            if (0 === (d & 30) && !Ok(e) && (b = Ik(a, d), 2 === b && (f = xc(a), 0 !== f && (d = f, b = Nk(a, f))), 1 === b)) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
            a.finishedWork = e;
            a.finishedLanes = d;
            switch (b) {
              case 0:
              case 1:
                throw Error(p(345));
              case 2:
                Pk(a, tk, uk);
                break;
              case 3:
                Ck(a, d);
                if ((d & 130023424) === d && (b = fk + 500 - B(), 10 < b)) {
                  if (0 !== uc(a, 0)) break;
                  e = a.suspendedLanes;
                  if ((e & d) !== d) {
                    R();
                    a.pingedLanes |= a.suspendedLanes & e;
                    break;
                  }
                  a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), b);
                  break;
                }
                Pk(a, tk, uk);
                break;
              case 4:
                Ck(a, d);
                if ((d & 4194240) === d) break;
                b = a.eventTimes;
                for (e = -1; 0 < d; ) {
                  var g = 31 - oc(d);
                  f = 1 << g;
                  g = b[g];
                  g > e && (e = g);
                  d &= ~f;
                }
                d = e;
                d = B() - d;
                d = (120 > d ? 120 : 480 > d ? 480 : 1080 > d ? 1080 : 1920 > d ? 1920 : 3e3 > d ? 3e3 : 4320 > d ? 4320 : 1960 * lk(d / 1960)) - d;
                if (10 < d) {
                  a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), d);
                  break;
                }
                Pk(a, tk, uk);
                break;
              case 5:
                Pk(a, tk, uk);
                break;
              default:
                throw Error(p(329));
            }
          }
        }
        Dk(a, B());
        return a.callbackNode === c ? Gk.bind(null, a) : null;
      }
      function Nk(a, b) {
        var c = sk;
        a.current.memoizedState.isDehydrated && (Kk(a, b).flags |= 256);
        a = Ik(a, b);
        2 !== a && (b = tk, tk = c, null !== b && Fj(b));
        return a;
      }
      function Fj(a) {
        null === tk ? tk = a : tk.push.apply(tk, a);
      }
      function Ok(a) {
        for (var b = a; ; ) {
          if (b.flags & 16384) {
            var c = b.updateQueue;
            if (null !== c && (c = c.stores, null !== c)) for (var d = 0; d < c.length; d++) {
              var e = c[d], f = e.getSnapshot;
              e = e.value;
              try {
                if (!He(f(), e)) return false;
              } catch (g) {
                return false;
              }
            }
          }
          c = b.child;
          if (b.subtreeFlags & 16384 && null !== c) c.return = b, b = c;
          else {
            if (b === a) break;
            for (; null === b.sibling; ) {
              if (null === b.return || b.return === a) return true;
              b = b.return;
            }
            b.sibling.return = b.return;
            b = b.sibling;
          }
        }
        return true;
      }
      function Ck(a, b) {
        b &= ~rk;
        b &= ~qk;
        a.suspendedLanes |= b;
        a.pingedLanes &= ~b;
        for (a = a.expirationTimes; 0 < b; ) {
          var c = 31 - oc(b), d = 1 << c;
          a[c] = -1;
          b &= ~d;
        }
      }
      function Ek(a) {
        if (0 !== (K & 6)) throw Error(p(327));
        Hk();
        var b = uc(a, 0);
        if (0 === (b & 1)) return Dk(a, B()), null;
        var c = Ik(a, b);
        if (0 !== a.tag && 2 === c) {
          var d = xc(a);
          0 !== d && (b = d, c = Nk(a, d));
        }
        if (1 === c) throw c = pk, Kk(a, 0), Ck(a, b), Dk(a, B()), c;
        if (6 === c) throw Error(p(345));
        a.finishedWork = a.current.alternate;
        a.finishedLanes = b;
        Pk(a, tk, uk);
        Dk(a, B());
        return null;
      }
      function Qk(a, b) {
        var c = K;
        K |= 1;
        try {
          return a(b);
        } finally {
          K = c, 0 === K && (Gj = B() + 500, fg && jg());
        }
      }
      function Rk(a) {
        null !== wk && 0 === wk.tag && 0 === (K & 6) && Hk();
        var b = K;
        K |= 1;
        var c = ok.transition, d = C;
        try {
          if (ok.transition = null, C = 1, a) return a();
        } finally {
          C = d, ok.transition = c, K = b, 0 === (K & 6) && jg();
        }
      }
      function Hj() {
        fj = ej.current;
        E(ej);
      }
      function Kk(a, b) {
        a.finishedWork = null;
        a.finishedLanes = 0;
        var c = a.timeoutHandle;
        -1 !== c && (a.timeoutHandle = -1, Gf(c));
        if (null !== Y) for (c = Y.return; null !== c; ) {
          var d = c;
          wg(d);
          switch (d.tag) {
            case 1:
              d = d.type.childContextTypes;
              null !== d && void 0 !== d && $f();
              break;
            case 3:
              zh();
              E(Wf);
              E(H);
              Eh();
              break;
            case 5:
              Bh(d);
              break;
            case 4:
              zh();
              break;
            case 13:
              E(L);
              break;
            case 19:
              E(L);
              break;
            case 10:
              ah(d.type._context);
              break;
            case 22:
            case 23:
              Hj();
          }
          c = c.return;
        }
        Q = a;
        Y = a = Pg(a.current, null);
        Z = fj = b;
        T = 0;
        pk = null;
        rk = qk = rh = 0;
        tk = sk = null;
        if (null !== fh) {
          for (b = 0; b < fh.length; b++) if (c = fh[b], d = c.interleaved, null !== d) {
            c.interleaved = null;
            var e = d.next, f = c.pending;
            if (null !== f) {
              var g = f.next;
              f.next = e;
              d.next = g;
            }
            c.pending = d;
          }
          fh = null;
        }
        return a;
      }
      function Mk(a, b) {
        do {
          var c = Y;
          try {
            $g();
            Fh.current = Rh;
            if (Ih) {
              for (var d = M.memoizedState; null !== d; ) {
                var e = d.queue;
                null !== e && (e.pending = null);
                d = d.next;
              }
              Ih = false;
            }
            Hh = 0;
            O = N = M = null;
            Jh = false;
            Kh = 0;
            nk.current = null;
            if (null === c || null === c.return) {
              T = 1;
              pk = b;
              Y = null;
              break;
            }
            a: {
              var f = a, g = c.return, h = c, k = b;
              b = Z;
              h.flags |= 32768;
              if (null !== k && "object" === typeof k && "function" === typeof k.then) {
                var l = k, m = h, q = m.tag;
                if (0 === (m.mode & 1) && (0 === q || 11 === q || 15 === q)) {
                  var r = m.alternate;
                  r ? (m.updateQueue = r.updateQueue, m.memoizedState = r.memoizedState, m.lanes = r.lanes) : (m.updateQueue = null, m.memoizedState = null);
                }
                var y = Ui(g);
                if (null !== y) {
                  y.flags &= -257;
                  Vi(y, g, h, f, b);
                  y.mode & 1 && Si(f, l, b);
                  b = y;
                  k = l;
                  var n = b.updateQueue;
                  if (null === n) {
                    var t = /* @__PURE__ */ new Set();
                    t.add(k);
                    b.updateQueue = t;
                  } else n.add(k);
                  break a;
                } else {
                  if (0 === (b & 1)) {
                    Si(f, l, b);
                    tj();
                    break a;
                  }
                  k = Error(p(426));
                }
              } else if (I2 && h.mode & 1) {
                var J = Ui(g);
                if (null !== J) {
                  0 === (J.flags & 65536) && (J.flags |= 256);
                  Vi(J, g, h, f, b);
                  Jg(Ji(k, h));
                  break a;
                }
              }
              f = k = Ji(k, h);
              4 !== T && (T = 2);
              null === sk ? sk = [f] : sk.push(f);
              f = g;
              do {
                switch (f.tag) {
                  case 3:
                    f.flags |= 65536;
                    b &= -b;
                    f.lanes |= b;
                    var x = Ni(f, k, b);
                    ph(f, x);
                    break a;
                  case 1:
                    h = k;
                    var w = f.type, u = f.stateNode;
                    if (0 === (f.flags & 128) && ("function" === typeof w.getDerivedStateFromError || null !== u && "function" === typeof u.componentDidCatch && (null === Ri || !Ri.has(u)))) {
                      f.flags |= 65536;
                      b &= -b;
                      f.lanes |= b;
                      var F = Qi(f, h, b);
                      ph(f, F);
                      break a;
                    }
                }
                f = f.return;
              } while (null !== f);
            }
            Sk(c);
          } catch (na) {
            b = na;
            Y === c && null !== c && (Y = c = c.return);
            continue;
          }
          break;
        } while (1);
      }
      function Jk() {
        var a = mk.current;
        mk.current = Rh;
        return null === a ? Rh : a;
      }
      function tj() {
        if (0 === T || 3 === T || 2 === T) T = 4;
        null === Q || 0 === (rh & 268435455) && 0 === (qk & 268435455) || Ck(Q, Z);
      }
      function Ik(a, b) {
        var c = K;
        K |= 2;
        var d = Jk();
        if (Q !== a || Z !== b) uk = null, Kk(a, b);
        do
          try {
            Tk();
            break;
          } catch (e) {
            Mk(a, e);
          }
        while (1);
        $g();
        K = c;
        mk.current = d;
        if (null !== Y) throw Error(p(261));
        Q = null;
        Z = 0;
        return T;
      }
      function Tk() {
        for (; null !== Y; ) Uk(Y);
      }
      function Lk() {
        for (; null !== Y && !cc(); ) Uk(Y);
      }
      function Uk(a) {
        var b = Vk(a.alternate, a, fj);
        a.memoizedProps = a.pendingProps;
        null === b ? Sk(a) : Y = b;
        nk.current = null;
      }
      function Sk(a) {
        var b = a;
        do {
          var c = b.alternate;
          a = b.return;
          if (0 === (b.flags & 32768)) {
            if (c = Ej(c, b, fj), null !== c) {
              Y = c;
              return;
            }
          } else {
            c = Ij(c, b);
            if (null !== c) {
              c.flags &= 32767;
              Y = c;
              return;
            }
            if (null !== a) a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null;
            else {
              T = 6;
              Y = null;
              return;
            }
          }
          b = b.sibling;
          if (null !== b) {
            Y = b;
            return;
          }
          Y = b = a;
        } while (null !== b);
        0 === T && (T = 5);
      }
      function Pk(a, b, c) {
        var d = C, e = ok.transition;
        try {
          ok.transition = null, C = 1, Wk(a, b, c, d);
        } finally {
          ok.transition = e, C = d;
        }
        return null;
      }
      function Wk(a, b, c, d) {
        do
          Hk();
        while (null !== wk);
        if (0 !== (K & 6)) throw Error(p(327));
        c = a.finishedWork;
        var e = a.finishedLanes;
        if (null === c) return null;
        a.finishedWork = null;
        a.finishedLanes = 0;
        if (c === a.current) throw Error(p(177));
        a.callbackNode = null;
        a.callbackPriority = 0;
        var f = c.lanes | c.childLanes;
        Bc(a, f);
        a === Q && (Y = Q = null, Z = 0);
        0 === (c.subtreeFlags & 2064) && 0 === (c.flags & 2064) || vk || (vk = true, Fk(hc, function() {
          Hk();
          return null;
        }));
        f = 0 !== (c.flags & 15990);
        if (0 !== (c.subtreeFlags & 15990) || f) {
          f = ok.transition;
          ok.transition = null;
          var g = C;
          C = 1;
          var h = K;
          K |= 4;
          nk.current = null;
          Oj(a, c);
          dk(c, a);
          Oe(Df);
          dd = !!Cf;
          Df = Cf = null;
          a.current = c;
          hk(c, a, e);
          dc();
          K = h;
          C = g;
          ok.transition = f;
        } else a.current = c;
        vk && (vk = false, wk = a, xk = e);
        f = a.pendingLanes;
        0 === f && (Ri = null);
        mc(c.stateNode, d);
        Dk(a, B());
        if (null !== b) for (d = a.onRecoverableError, c = 0; c < b.length; c++) e = b[c], d(e.value, { componentStack: e.stack, digest: e.digest });
        if (Oi) throw Oi = false, a = Pi, Pi = null, a;
        0 !== (xk & 1) && 0 !== a.tag && Hk();
        f = a.pendingLanes;
        0 !== (f & 1) ? a === zk ? yk++ : (yk = 0, zk = a) : yk = 0;
        jg();
        return null;
      }
      function Hk() {
        if (null !== wk) {
          var a = Dc(xk), b = ok.transition, c = C;
          try {
            ok.transition = null;
            C = 16 > a ? 16 : a;
            if (null === wk) var d = false;
            else {
              a = wk;
              wk = null;
              xk = 0;
              if (0 !== (K & 6)) throw Error(p(331));
              var e = K;
              K |= 4;
              for (V = a.current; null !== V; ) {
                var f = V, g = f.child;
                if (0 !== (V.flags & 16)) {
                  var h = f.deletions;
                  if (null !== h) {
                    for (var k = 0; k < h.length; k++) {
                      var l = h[k];
                      for (V = l; null !== V; ) {
                        var m = V;
                        switch (m.tag) {
                          case 0:
                          case 11:
                          case 15:
                            Pj(8, m, f);
                        }
                        var q = m.child;
                        if (null !== q) q.return = m, V = q;
                        else for (; null !== V; ) {
                          m = V;
                          var r = m.sibling, y = m.return;
                          Sj(m);
                          if (m === l) {
                            V = null;
                            break;
                          }
                          if (null !== r) {
                            r.return = y;
                            V = r;
                            break;
                          }
                          V = y;
                        }
                      }
                    }
                    var n = f.alternate;
                    if (null !== n) {
                      var t = n.child;
                      if (null !== t) {
                        n.child = null;
                        do {
                          var J = t.sibling;
                          t.sibling = null;
                          t = J;
                        } while (null !== t);
                      }
                    }
                    V = f;
                  }
                }
                if (0 !== (f.subtreeFlags & 2064) && null !== g) g.return = f, V = g;
                else b: for (; null !== V; ) {
                  f = V;
                  if (0 !== (f.flags & 2048)) switch (f.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Pj(9, f, f.return);
                  }
                  var x = f.sibling;
                  if (null !== x) {
                    x.return = f.return;
                    V = x;
                    break b;
                  }
                  V = f.return;
                }
              }
              var w = a.current;
              for (V = w; null !== V; ) {
                g = V;
                var u = g.child;
                if (0 !== (g.subtreeFlags & 2064) && null !== u) u.return = g, V = u;
                else b: for (g = w; null !== V; ) {
                  h = V;
                  if (0 !== (h.flags & 2048)) try {
                    switch (h.tag) {
                      case 0:
                      case 11:
                      case 15:
                        Qj(9, h);
                    }
                  } catch (na) {
                    W(h, h.return, na);
                  }
                  if (h === g) {
                    V = null;
                    break b;
                  }
                  var F = h.sibling;
                  if (null !== F) {
                    F.return = h.return;
                    V = F;
                    break b;
                  }
                  V = h.return;
                }
              }
              K = e;
              jg();
              if (lc && "function" === typeof lc.onPostCommitFiberRoot) try {
                lc.onPostCommitFiberRoot(kc, a);
              } catch (na) {
              }
              d = true;
            }
            return d;
          } finally {
            C = c, ok.transition = b;
          }
        }
        return false;
      }
      function Xk(a, b, c) {
        b = Ji(c, b);
        b = Ni(a, b, 1);
        a = nh(a, b, 1);
        b = R();
        null !== a && (Ac(a, 1, b), Dk(a, b));
      }
      function W(a, b, c) {
        if (3 === a.tag) Xk(a, a, c);
        else for (; null !== b; ) {
          if (3 === b.tag) {
            Xk(b, a, c);
            break;
          } else if (1 === b.tag) {
            var d = b.stateNode;
            if ("function" === typeof b.type.getDerivedStateFromError || "function" === typeof d.componentDidCatch && (null === Ri || !Ri.has(d))) {
              a = Ji(c, a);
              a = Qi(b, a, 1);
              b = nh(b, a, 1);
              a = R();
              null !== b && (Ac(b, 1, a), Dk(b, a));
              break;
            }
          }
          b = b.return;
        }
      }
      function Ti(a, b, c) {
        var d = a.pingCache;
        null !== d && d.delete(b);
        b = R();
        a.pingedLanes |= a.suspendedLanes & c;
        Q === a && (Z & c) === c && (4 === T || 3 === T && (Z & 130023424) === Z && 500 > B() - fk ? Kk(a, 0) : rk |= c);
        Dk(a, b);
      }
      function Yk(a, b) {
        0 === b && (0 === (a.mode & 1) ? b = 1 : (b = sc, sc <<= 1, 0 === (sc & 130023424) && (sc = 4194304)));
        var c = R();
        a = ih(a, b);
        null !== a && (Ac(a, b, c), Dk(a, c));
      }
      function uj(a) {
        var b = a.memoizedState, c = 0;
        null !== b && (c = b.retryLane);
        Yk(a, c);
      }
      function bk(a, b) {
        var c = 0;
        switch (a.tag) {
          case 13:
            var d = a.stateNode;
            var e = a.memoizedState;
            null !== e && (c = e.retryLane);
            break;
          case 19:
            d = a.stateNode;
            break;
          default:
            throw Error(p(314));
        }
        null !== d && d.delete(b);
        Yk(a, c);
      }
      var Vk;
      Vk = function(a, b, c) {
        if (null !== a) if (a.memoizedProps !== b.pendingProps || Wf.current) dh = true;
        else {
          if (0 === (a.lanes & c) && 0 === (b.flags & 128)) return dh = false, yj(a, b, c);
          dh = 0 !== (a.flags & 131072) ? true : false;
        }
        else dh = false, I2 && 0 !== (b.flags & 1048576) && ug(b, ng, b.index);
        b.lanes = 0;
        switch (b.tag) {
          case 2:
            var d = b.type;
            ij(a, b);
            a = b.pendingProps;
            var e = Yf(b, H.current);
            ch(b, c);
            e = Nh(null, b, d, a, e, c);
            var f = Sh();
            b.flags |= 1;
            "object" === typeof e && null !== e && "function" === typeof e.render && void 0 === e.$$typeof ? (b.tag = 1, b.memoizedState = null, b.updateQueue = null, Zf(d) ? (f = true, cg(b)) : f = false, b.memoizedState = null !== e.state && void 0 !== e.state ? e.state : null, kh(b), e.updater = Ei, b.stateNode = e, e._reactInternals = b, Ii(b, d, a, c), b = jj(null, b, d, true, f, c)) : (b.tag = 0, I2 && f && vg(b), Xi(null, b, e, c), b = b.child);
            return b;
          case 16:
            d = b.elementType;
            a: {
              ij(a, b);
              a = b.pendingProps;
              e = d._init;
              d = e(d._payload);
              b.type = d;
              e = b.tag = Zk(d);
              a = Ci(d, a);
              switch (e) {
                case 0:
                  b = cj(null, b, d, a, c);
                  break a;
                case 1:
                  b = hj(null, b, d, a, c);
                  break a;
                case 11:
                  b = Yi(null, b, d, a, c);
                  break a;
                case 14:
                  b = $i(null, b, d, Ci(d.type, a), c);
                  break a;
              }
              throw Error(p(
                306,
                d,
                ""
              ));
            }
            return b;
          case 0:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), cj(a, b, d, e, c);
          case 1:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), hj(a, b, d, e, c);
          case 3:
            a: {
              kj(b);
              if (null === a) throw Error(p(387));
              d = b.pendingProps;
              f = b.memoizedState;
              e = f.element;
              lh(a, b);
              qh(b, d, null, c);
              var g = b.memoizedState;
              d = g.element;
              if (f.isDehydrated) if (f = { element: d, isDehydrated: false, cache: g.cache, pendingSuspenseBoundaries: g.pendingSuspenseBoundaries, transitions: g.transitions }, b.updateQueue.baseState = f, b.memoizedState = f, b.flags & 256) {
                e = Ji(Error(p(423)), b);
                b = lj(a, b, d, c, e);
                break a;
              } else if (d !== e) {
                e = Ji(Error(p(424)), b);
                b = lj(a, b, d, c, e);
                break a;
              } else for (yg = Lf(b.stateNode.containerInfo.firstChild), xg = b, I2 = true, zg = null, c = Vg(b, null, d, c), b.child = c; c; ) c.flags = c.flags & -3 | 4096, c = c.sibling;
              else {
                Ig();
                if (d === e) {
                  b = Zi(a, b, c);
                  break a;
                }
                Xi(a, b, d, c);
              }
              b = b.child;
            }
            return b;
          case 5:
            return Ah(b), null === a && Eg(b), d = b.type, e = b.pendingProps, f = null !== a ? a.memoizedProps : null, g = e.children, Ef(d, e) ? g = null : null !== f && Ef(d, f) && (b.flags |= 32), gj(a, b), Xi(a, b, g, c), b.child;
          case 6:
            return null === a && Eg(b), null;
          case 13:
            return oj(a, b, c);
          case 4:
            return yh(b, b.stateNode.containerInfo), d = b.pendingProps, null === a ? b.child = Ug(b, null, d, c) : Xi(a, b, d, c), b.child;
          case 11:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), Yi(a, b, d, e, c);
          case 7:
            return Xi(a, b, b.pendingProps, c), b.child;
          case 8:
            return Xi(a, b, b.pendingProps.children, c), b.child;
          case 12:
            return Xi(a, b, b.pendingProps.children, c), b.child;
          case 10:
            a: {
              d = b.type._context;
              e = b.pendingProps;
              f = b.memoizedProps;
              g = e.value;
              G(Wg, d._currentValue);
              d._currentValue = g;
              if (null !== f) if (He(f.value, g)) {
                if (f.children === e.children && !Wf.current) {
                  b = Zi(a, b, c);
                  break a;
                }
              } else for (f = b.child, null !== f && (f.return = b); null !== f; ) {
                var h = f.dependencies;
                if (null !== h) {
                  g = f.child;
                  for (var k = h.firstContext; null !== k; ) {
                    if (k.context === d) {
                      if (1 === f.tag) {
                        k = mh(-1, c & -c);
                        k.tag = 2;
                        var l = f.updateQueue;
                        if (null !== l) {
                          l = l.shared;
                          var m = l.pending;
                          null === m ? k.next = k : (k.next = m.next, m.next = k);
                          l.pending = k;
                        }
                      }
                      f.lanes |= c;
                      k = f.alternate;
                      null !== k && (k.lanes |= c);
                      bh(
                        f.return,
                        c,
                        b
                      );
                      h.lanes |= c;
                      break;
                    }
                    k = k.next;
                  }
                } else if (10 === f.tag) g = f.type === b.type ? null : f.child;
                else if (18 === f.tag) {
                  g = f.return;
                  if (null === g) throw Error(p(341));
                  g.lanes |= c;
                  h = g.alternate;
                  null !== h && (h.lanes |= c);
                  bh(g, c, b);
                  g = f.sibling;
                } else g = f.child;
                if (null !== g) g.return = f;
                else for (g = f; null !== g; ) {
                  if (g === b) {
                    g = null;
                    break;
                  }
                  f = g.sibling;
                  if (null !== f) {
                    f.return = g.return;
                    g = f;
                    break;
                  }
                  g = g.return;
                }
                f = g;
              }
              Xi(a, b, e.children, c);
              b = b.child;
            }
            return b;
          case 9:
            return e = b.type, d = b.pendingProps.children, ch(b, c), e = eh(e), d = d(e), b.flags |= 1, Xi(a, b, d, c), b.child;
          case 14:
            return d = b.type, e = Ci(d, b.pendingProps), e = Ci(d.type, e), $i(a, b, d, e, c);
          case 15:
            return bj(a, b, b.type, b.pendingProps, c);
          case 17:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), ij(a, b), b.tag = 1, Zf(d) ? (a = true, cg(b)) : a = false, ch(b, c), Gi(b, d, e), Ii(b, d, e, c), jj(null, b, d, true, a, c);
          case 19:
            return xj(a, b, c);
          case 22:
            return dj(a, b, c);
        }
        throw Error(p(156, b.tag));
      };
      function Fk(a, b) {
        return ac(a, b);
      }
      function $k(a, b, c, d) {
        this.tag = a;
        this.key = c;
        this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
        this.index = 0;
        this.ref = null;
        this.pendingProps = b;
        this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
        this.mode = d;
        this.subtreeFlags = this.flags = 0;
        this.deletions = null;
        this.childLanes = this.lanes = 0;
        this.alternate = null;
      }
      function Bg(a, b, c, d) {
        return new $k(a, b, c, d);
      }
      function aj(a) {
        a = a.prototype;
        return !(!a || !a.isReactComponent);
      }
      function Zk(a) {
        if ("function" === typeof a) return aj(a) ? 1 : 0;
        if (void 0 !== a && null !== a) {
          a = a.$$typeof;
          if (a === Da) return 11;
          if (a === Ga) return 14;
        }
        return 2;
      }
      function Pg(a, b) {
        var c = a.alternate;
        null === c ? (c = Bg(a.tag, b, a.key, a.mode), c.elementType = a.elementType, c.type = a.type, c.stateNode = a.stateNode, c.alternate = a, a.alternate = c) : (c.pendingProps = b, c.type = a.type, c.flags = 0, c.subtreeFlags = 0, c.deletions = null);
        c.flags = a.flags & 14680064;
        c.childLanes = a.childLanes;
        c.lanes = a.lanes;
        c.child = a.child;
        c.memoizedProps = a.memoizedProps;
        c.memoizedState = a.memoizedState;
        c.updateQueue = a.updateQueue;
        b = a.dependencies;
        c.dependencies = null === b ? null : { lanes: b.lanes, firstContext: b.firstContext };
        c.sibling = a.sibling;
        c.index = a.index;
        c.ref = a.ref;
        return c;
      }
      function Rg(a, b, c, d, e, f) {
        var g = 2;
        d = a;
        if ("function" === typeof a) aj(a) && (g = 1);
        else if ("string" === typeof a) g = 5;
        else a: switch (a) {
          case ya:
            return Tg(c.children, e, f, b);
          case za:
            g = 8;
            e |= 8;
            break;
          case Aa:
            return a = Bg(12, c, b, e | 2), a.elementType = Aa, a.lanes = f, a;
          case Ea:
            return a = Bg(13, c, b, e), a.elementType = Ea, a.lanes = f, a;
          case Fa:
            return a = Bg(19, c, b, e), a.elementType = Fa, a.lanes = f, a;
          case Ia:
            return pj(c, e, f, b);
          default:
            if ("object" === typeof a && null !== a) switch (a.$$typeof) {
              case Ba:
                g = 10;
                break a;
              case Ca:
                g = 9;
                break a;
              case Da:
                g = 11;
                break a;
              case Ga:
                g = 14;
                break a;
              case Ha:
                g = 16;
                d = null;
                break a;
            }
            throw Error(p(130, null == a ? a : typeof a, ""));
        }
        b = Bg(g, c, b, e);
        b.elementType = a;
        b.type = d;
        b.lanes = f;
        return b;
      }
      function Tg(a, b, c, d) {
        a = Bg(7, a, d, b);
        a.lanes = c;
        return a;
      }
      function pj(a, b, c, d) {
        a = Bg(22, a, d, b);
        a.elementType = Ia;
        a.lanes = c;
        a.stateNode = { isHidden: false };
        return a;
      }
      function Qg(a, b, c) {
        a = Bg(6, a, null, b);
        a.lanes = c;
        return a;
      }
      function Sg(a, b, c) {
        b = Bg(4, null !== a.children ? a.children : [], a.key, b);
        b.lanes = c;
        b.stateNode = { containerInfo: a.containerInfo, pendingChildren: null, implementation: a.implementation };
        return b;
      }
      function al(a, b, c, d, e) {
        this.tag = b;
        this.containerInfo = a;
        this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
        this.timeoutHandle = -1;
        this.callbackNode = this.pendingContext = this.context = null;
        this.callbackPriority = 0;
        this.eventTimes = zc(0);
        this.expirationTimes = zc(-1);
        this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
        this.entanglements = zc(0);
        this.identifierPrefix = d;
        this.onRecoverableError = e;
        this.mutableSourceEagerHydrationData = null;
      }
      function bl(a, b, c, d, e, f, g, h, k) {
        a = new al(a, b, c, h, k);
        1 === b ? (b = 1, true === f && (b |= 8)) : b = 0;
        f = Bg(3, null, null, b);
        a.current = f;
        f.stateNode = a;
        f.memoizedState = { element: d, isDehydrated: c, cache: null, transitions: null, pendingSuspenseBoundaries: null };
        kh(f);
        return a;
      }
      function cl(a, b, c) {
        var d = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
        return { $$typeof: wa, key: null == d ? null : "" + d, children: a, containerInfo: b, implementation: c };
      }
      function dl(a) {
        if (!a) return Vf;
        a = a._reactInternals;
        a: {
          if (Vb(a) !== a || 1 !== a.tag) throw Error(p(170));
          var b = a;
          do {
            switch (b.tag) {
              case 3:
                b = b.stateNode.context;
                break a;
              case 1:
                if (Zf(b.type)) {
                  b = b.stateNode.__reactInternalMemoizedMergedChildContext;
                  break a;
                }
            }
            b = b.return;
          } while (null !== b);
          throw Error(p(171));
        }
        if (1 === a.tag) {
          var c = a.type;
          if (Zf(c)) return bg(a, c, b);
        }
        return b;
      }
      function el(a, b, c, d, e, f, g, h, k) {
        a = bl(c, d, true, a, e, f, g, h, k);
        a.context = dl(null);
        c = a.current;
        d = R();
        e = yi(c);
        f = mh(d, e);
        f.callback = void 0 !== b && null !== b ? b : null;
        nh(c, f, e);
        a.current.lanes = e;
        Ac(a, e, d);
        Dk(a, d);
        return a;
      }
      function fl(a, b, c, d) {
        var e = b.current, f = R(), g = yi(e);
        c = dl(c);
        null === b.context ? b.context = c : b.pendingContext = c;
        b = mh(f, g);
        b.payload = { element: a };
        d = void 0 === d ? null : d;
        null !== d && (b.callback = d);
        a = nh(e, b, g);
        null !== a && (gi(a, e, g, f), oh(a, e, g));
        return g;
      }
      function gl(a) {
        a = a.current;
        if (!a.child) return null;
        switch (a.child.tag) {
          case 5:
            return a.child.stateNode;
          default:
            return a.child.stateNode;
        }
      }
      function hl(a, b) {
        a = a.memoizedState;
        if (null !== a && null !== a.dehydrated) {
          var c = a.retryLane;
          a.retryLane = 0 !== c && c < b ? c : b;
        }
      }
      function il(a, b) {
        hl(a, b);
        (a = a.alternate) && hl(a, b);
      }
      function jl() {
        return null;
      }
      var kl = "function" === typeof reportError ? reportError : function(a) {
        console.error(a);
      };
      function ll(a) {
        this._internalRoot = a;
      }
      ml.prototype.render = ll.prototype.render = function(a) {
        var b = this._internalRoot;
        if (null === b) throw Error(p(409));
        fl(a, b, null, null);
      };
      ml.prototype.unmount = ll.prototype.unmount = function() {
        var a = this._internalRoot;
        if (null !== a) {
          this._internalRoot = null;
          var b = a.containerInfo;
          Rk(function() {
            fl(null, a, null, null);
          });
          b[uf] = null;
        }
      };
      function ml(a) {
        this._internalRoot = a;
      }
      ml.prototype.unstable_scheduleHydration = function(a) {
        if (a) {
          var b = Hc();
          a = { blockedOn: null, target: a, priority: b };
          for (var c = 0; c < Qc.length && 0 !== b && b < Qc[c].priority; c++) ;
          Qc.splice(c, 0, a);
          0 === c && Vc(a);
        }
      };
      function nl(a) {
        return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType);
      }
      function ol(a) {
        return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType && (8 !== a.nodeType || " react-mount-point-unstable " !== a.nodeValue));
      }
      function pl() {
      }
      function ql(a, b, c, d, e) {
        if (e) {
          if ("function" === typeof d) {
            var f = d;
            d = function() {
              var a2 = gl(g);
              f.call(a2);
            };
          }
          var g = el(b, d, a, 0, null, false, false, "", pl);
          a._reactRootContainer = g;
          a[uf] = g.current;
          sf(8 === a.nodeType ? a.parentNode : a);
          Rk();
          return g;
        }
        for (; e = a.lastChild; ) a.removeChild(e);
        if ("function" === typeof d) {
          var h = d;
          d = function() {
            var a2 = gl(k);
            h.call(a2);
          };
        }
        var k = bl(a, 0, false, null, null, false, false, "", pl);
        a._reactRootContainer = k;
        a[uf] = k.current;
        sf(8 === a.nodeType ? a.parentNode : a);
        Rk(function() {
          fl(b, k, c, d);
        });
        return k;
      }
      function rl(a, b, c, d, e) {
        var f = c._reactRootContainer;
        if (f) {
          var g = f;
          if ("function" === typeof e) {
            var h = e;
            e = function() {
              var a2 = gl(g);
              h.call(a2);
            };
          }
          fl(b, g, a, e);
        } else g = ql(c, b, a, e, d);
        return gl(g);
      }
      Ec = function(a) {
        switch (a.tag) {
          case 3:
            var b = a.stateNode;
            if (b.current.memoizedState.isDehydrated) {
              var c = tc(b.pendingLanes);
              0 !== c && (Cc(b, c | 1), Dk(b, B()), 0 === (K & 6) && (Gj = B() + 500, jg()));
            }
            break;
          case 13:
            Rk(function() {
              var b2 = ih(a, 1);
              if (null !== b2) {
                var c2 = R();
                gi(b2, a, 1, c2);
              }
            }), il(a, 1);
        }
      };
      Fc = function(a) {
        if (13 === a.tag) {
          var b = ih(a, 134217728);
          if (null !== b) {
            var c = R();
            gi(b, a, 134217728, c);
          }
          il(a, 134217728);
        }
      };
      Gc = function(a) {
        if (13 === a.tag) {
          var b = yi(a), c = ih(a, b);
          if (null !== c) {
            var d = R();
            gi(c, a, b, d);
          }
          il(a, b);
        }
      };
      Hc = function() {
        return C;
      };
      Ic = function(a, b) {
        var c = C;
        try {
          return C = a, b();
        } finally {
          C = c;
        }
      };
      yb = function(a, b, c) {
        switch (b) {
          case "input":
            bb(a, c);
            b = c.name;
            if ("radio" === c.type && null != b) {
              for (c = a; c.parentNode; ) c = c.parentNode;
              c = c.querySelectorAll("input[name=" + JSON.stringify("" + b) + '][type="radio"]');
              for (b = 0; b < c.length; b++) {
                var d = c[b];
                if (d !== a && d.form === a.form) {
                  var e = Db(d);
                  if (!e) throw Error(p(90));
                  Wa(d);
                  bb(d, e);
                }
              }
            }
            break;
          case "textarea":
            ib(a, c);
            break;
          case "select":
            b = c.value, null != b && fb(a, !!c.multiple, b, false);
        }
      };
      Gb = Qk;
      Hb = Rk;
      var sl = { usingClientEntryPoint: false, Events: [Cb, ue, Db, Eb, Fb, Qk] };
      var tl = { findFiberByHostInstance: Wc, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" };
      var ul = { bundleType: tl.bundleType, version: tl.version, rendererPackageName: tl.rendererPackageName, rendererConfig: tl.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: ua.ReactCurrentDispatcher, findHostInstanceByFiber: function(a) {
        a = Zb(a);
        return null === a ? null : a.stateNode;
      }, findFiberByHostInstance: tl.findFiberByHostInstance || jl, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
      if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
        vl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (!vl.isDisabled && vl.supportsFiber) try {
          kc = vl.inject(ul), lc = vl;
        } catch (a) {
        }
      }
      var vl;
      exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = sl;
      exports.createPortal = function(a, b) {
        var c = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
        if (!nl(b)) throw Error(p(200));
        return cl(a, b, null, c);
      };
      exports.createRoot = function(a, b) {
        if (!nl(a)) throw Error(p(299));
        var c = false, d = "", e = kl;
        null !== b && void 0 !== b && (true === b.unstable_strictMode && (c = true), void 0 !== b.identifierPrefix && (d = b.identifierPrefix), void 0 !== b.onRecoverableError && (e = b.onRecoverableError));
        b = bl(a, 1, false, null, null, c, false, d, e);
        a[uf] = b.current;
        sf(8 === a.nodeType ? a.parentNode : a);
        return new ll(b);
      };
      exports.findDOMNode = function(a) {
        if (null == a) return null;
        if (1 === a.nodeType) return a;
        var b = a._reactInternals;
        if (void 0 === b) {
          if ("function" === typeof a.render) throw Error(p(188));
          a = Object.keys(a).join(",");
          throw Error(p(268, a));
        }
        a = Zb(b);
        a = null === a ? null : a.stateNode;
        return a;
      };
      exports.flushSync = function(a) {
        return Rk(a);
      };
      exports.hydrate = function(a, b, c) {
        if (!ol(b)) throw Error(p(200));
        return rl(null, a, b, true, c);
      };
      exports.hydrateRoot = function(a, b, c) {
        if (!nl(a)) throw Error(p(405));
        var d = null != c && c.hydratedSources || null, e = false, f = "", g = kl;
        null !== c && void 0 !== c && (true === c.unstable_strictMode && (e = true), void 0 !== c.identifierPrefix && (f = c.identifierPrefix), void 0 !== c.onRecoverableError && (g = c.onRecoverableError));
        b = el(b, null, a, 1, null != c ? c : null, e, false, f, g);
        a[uf] = b.current;
        sf(a);
        if (d) for (a = 0; a < d.length; a++) c = d[a], e = c._getVersion, e = e(c._source), null == b.mutableSourceEagerHydrationData ? b.mutableSourceEagerHydrationData = [c, e] : b.mutableSourceEagerHydrationData.push(
          c,
          e
        );
        return new ml(b);
      };
      exports.render = function(a, b, c) {
        if (!ol(b)) throw Error(p(200));
        return rl(null, a, b, false, c);
      };
      exports.unmountComponentAtNode = function(a) {
        if (!ol(a)) throw Error(p(40));
        return a._reactRootContainer ? (Rk(function() {
          rl(null, null, a, false, function() {
            a._reactRootContainer = null;
            a[uf] = null;
          });
        }), true) : false;
      };
      exports.unstable_batchedUpdates = Qk;
      exports.unstable_renderSubtreeIntoContainer = function(a, b, c, d) {
        if (!ol(c)) throw Error(p(200));
        if (null == a || void 0 === a._reactInternals) throw Error(p(38));
        return rl(a, b, c, false, d);
      };
      exports.version = "18.3.1-next-f1338f8080-20240426";
    }
  });

  // node_modules/react-dom/index.js
  var require_react_dom = __commonJS({
    "node_modules/react-dom/index.js"(exports, module) {
      "use strict";
      function checkDCE() {
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
          return;
        }
        if (false) {
          throw new Error("^_^");
        }
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
        } catch (err) {
          console.error(err);
        }
      }
      if (true) {
        checkDCE();
        module.exports = require_react_dom_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/react-dom/client.js
  var require_client = __commonJS({
    "node_modules/react-dom/client.js"(exports) {
      "use strict";
      var m = require_react_dom();
      if (true) {
        exports.createRoot = m.createRoot;
        exports.hydrateRoot = m.hydrateRoot;
      } else {
        i = m.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        exports.createRoot = function(c, o) {
          i.usingClientEntryPoint = true;
          try {
            return m.createRoot(c, o);
          } finally {
            i.usingClientEntryPoint = false;
          }
        };
        exports.hydrateRoot = function(c, h, o) {
          i.usingClientEntryPoint = true;
          try {
            return m.hydrateRoot(c, h, o);
          } finally {
            i.usingClientEntryPoint = false;
          }
        };
      }
      var i;
    }
  });

  // entry.jsx
  var import_react13 = __toESM(require_react());
  var import_client = __toESM(require_client());

  // src/App.jsx
  var import_react12 = __toESM(require_react());

  // src/icons.jsx
  var import_react = __toESM(require_react());
  var Icon = ({ size = 24, children, ...props }) => import_react.default.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", ...props }, ...Array.isArray(children) ? children : [children]);
  var _p = (d) => import_react.default.createElement("path", { d });
  var _ci = (cx, cy, r) => import_react.default.createElement("circle", { cx, cy, r });
  var _rect = (x, y, w, h, rx) => import_react.default.createElement("rect", { x, y, width: w, height: h, rx });
  var _line = (x1, y1, x2, y2) => import_react.default.createElement("line", { x1, y1, x2, y2 });
  var _poly = (points) => import_react.default.createElement("polyline", { points });
  var Plus = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M12 5v14"), _p("M5 12h14"));
  var Trash2 = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M3 6h18"), _p("M19 6l-1 14H6L5 6"), _p("M8 6V4h8v2"), _p("M10 11v6"), _p("M14 11v6"));
  var Check = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _poly("20 6 9 17 4 12"));
  var ChevronDown = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _poly("6 9 12 15 18 9"));
  var ChevronUp = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _poly("18 15 12 9 6 15"));
  var X = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M18 6 6 18"), _p("M6 6l12 12"));
  var Pencil = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"));
  var Copy = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _rect(8, 8, 13, 13, 2), _p("M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"));
  var RotateCcw = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"), _p("M3 3v5h5"));
  var ClipboardPaste = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M9 3h6v3H9z"), _p("M8 3H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"), _p("M8 13h8"), _p("M8 17h8"), _p("M8 9h8"));
  var Archive = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _rect(2, 3, 20, 5, 0), _p("M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"), _p("M10 12h4"));
  var ImageIcon = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _rect(3, 3, 18, 18, 2), _ci(8.5, 8.5, 1.5), _poly("21 15 16 10 5 21"));
  var AlertTriangle = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"), _line(12, 9, 12, 13), _line(12, 17, 12.01, 17));
  var FileText = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"), _poly("14 2 14 8 20 8"), _p("M16 13H8"), _p("M16 17H8"), _p("M10 9H8"));
  var Scale = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M16 16h6"), _p("M2 16h6"), _line(12, 2, 12, 22), _p("M8 16 2 8l6-8"), _p("M16 16l6-8-6-8"));
  var Camera = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"), _ci(12, 13, 4));
  var Download = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"), _poly("7 10 12 15 17 10"), _line(12, 15, 12, 3));
  var Upload = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"), _poly("17 8 12 3 7 8"), _line(12, 3, 12, 15));
  var Flame = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"));
  var Bell = ({ size = 24, ...r }) => import_react.default.createElement(Icon, { size, ...r }, _p("M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"), _p("M13.73 21a2 2 0 0 1-3.46 0"));

  // src/menu.js
  var ALL_DINNERS = [
    { name: "Indian Style Curry", variants: [
      { label: "Chicken, Small (~4-5)", price: 27, cost: 14.97 },
      { label: "Shrimp, Small (~4-5)", price: 36, cost: 23.97 },
      { label: "Chickpea, Small (~4-5)", price: 22, cost: 9.97 },
      { label: "Chicken, Large (~8-10)", price: 50, cost: 23.94 },
      { label: "Shrimp, Large (~8-10)", price: 70, cost: 32.94 },
      { label: "Chickpea, Large (~8-10)", price: 40, cost: 18.94 }
    ] },
    { name: "Shrimp or Tofu with Asparagus in Black Bean Sauce", variants: [
      { label: "Shrimp, Small Batch (~3-4)", price: 40, cost: 21.99 },
      { label: "Shrimp, Large Batch (~7-8)", price: 75, cost: 42.98 },
      { label: "Tofu, Small Batch (~3-4)", price: 25, cost: 10.6 },
      { label: "Tofu, Large Batch (~7-8)", price: 45, cost: 20.2 }
    ] },
    { name: "Texas Gulf Shrimp or Tofu and Chinese Broccoli", variants: [
      { label: "Shrimp, Small Batch (~4)", price: 40, cost: 19.56 },
      { label: "Shrimp, Large Batch (~8)", price: 75, cost: 38.12 },
      { label: "Tofu, Small Batch (~4)", price: 25, cost: 8.17 },
      { label: "Tofu, Large Batch (~8)", price: 45, cost: 15.34 }
    ] },
    { name: "Cumin Mushroom Noodles", variants: [
      { label: "Small (~3-4)", price: 40, cost: 18.35 },
      { label: "Large (~6-8)", price: 75, cost: 35.7 },
      { label: "Small (~3-4) + Asian Greens", price: 45, cost: 20.35 },
      { label: "Large (~6-8) + Asian Greens", price: 80, cost: 37.7 }
    ] },
    { name: "Thai Basil Chicken (Pad Krapow Gai)", variants: [
      { label: "Small (~3-4)", price: 30, cost: 13.35 },
      { label: "Large (~7-8)", price: 55, cost: 25.7 }
    ] },
    { name: "Pasta with Red Sauce", variants: [
      { label: "Base (~4)", price: 15, cost: 7.24 },
      { label: "With Beef or Turkey", price: 30, cost: 14.24 },
      { label: "With Mushrooms", price: 21, cost: 10.24 },
      { label: "With Both", price: 36, cost: 17.24 }
    ] },
    { name: "Bolognese", variants: [
      { label: "Small (split order, ~4)", price: 35, cost: 16.79 },
      { label: "Large (~8)", price: 60, cost: 32.57 }
    ] },
    { name: "Tex-Mex Kit", variants: [
      { label: "Pulled Pork, Small (~5-6)", price: 42, cost: 19.21 },
      { label: "Pulled Pork, Large (~9-10)", price: 80, cost: 37.42 },
      { label: "Pulled Beef, Small (~5-6)", price: 60, cost: 28.05 },
      { label: "Pulled Beef, Large (~9-10)", price: 115, cost: 55.1 }
    ] },
    { name: "Brunswick Stew", variants: [
      { label: "Small (~4)", price: 35, cost: 15.55 },
      { label: "Large (~8)", price: 65, cost: 31.1 }
    ] },
    { name: "Boeuf Bourguignon (Beef Stew)", variants: [
      { label: "~6 servings", price: 100, cost: 45.08 },
      { label: "With 1 lb mushrooms", price: 112, cost: 51.08 }
    ] },
    { name: "Chili", variants: [
      { label: "Small (split order, ~3-4)", price: 45, cost: 18.53 },
      { label: "Large (~6-8)", price: 80, cost: 37.06 }
    ] },
    { name: "Saffron Pork Ragu", variants: [
      { label: "Small (~4 servings)", price: 40, cost: 16.48 },
      { label: "Large (~8 servings)", price: 75, cost: 32.96 }
    ] },
    { name: "Mapo Eggplant", variants: [
      { label: "Small (~5-6 servings)", price: 35, cost: 13.63 },
      { label: "Large (~10-12 servings)", price: 65, cost: 27.26 }
    ] },
    { name: "Gumbo", variants: [
      { label: "Small (split order, ~3-4)", price: 40, cost: 15.31 },
      { label: "Large (~7-8)", price: 65, cost: 30.63 }
    ] },
    { name: "Stir Fried Long Beans with Ground Pork", variants: [
      { label: "Small (~4)", price: 30, cost: 11.58 },
      { label: "Large (~8)", price: 55, cost: 23.16 }
    ] }
  ];
  var DEFAULT_WEEK = ["Shrimp or Tofu with Asparagus in Black Bean Sauce", "Thai Basil Chicken (Pad Krapow Gai)", "Saffron Pork Ragu", "Mapo Eggplant", "Gumbo"];
  var ALWAYS_MENU2 = {
    breakfast: [
      { name: "Homemade Waffles", variants: [{ label: "Set of 12", price: 7, cost: 2.78 }] }
    ],
    fruit: [
      { name: "Fresh Cut Pineapple", variants: [{ label: "Per Container", price: 6, cost: 2.5 }] },
      { name: "Seasonal Cantaloupe", variants: [{ label: "Per Container", price: 6, cost: 3 }] }
    ],
    desserts: [
      { name: "Chocolate Chip Cookies", variants: [
        { label: "1 Dozen (Standard)", price: 25, cost: 11.33 },
        { label: "1 Dozen (Premium Valrhona)", price: 40, cost: 23.33 }
      ] },
      { name: "Peanut Butter Fudge", variants: [{ label: "1 Batch", price: 15, cost: 4.35 }] }
    ],
    addons: [
      { name: "Queso", variants: [
        { label: "Per Pint Jar", price: 12, cost: 4.87 },
        { label: "With jar swap", price: 10, cost: 3.62 }
      ] },
      { name: "Pickled Onions or Carrots", variants: [
        { label: "Standard", price: 7.5, cost: 4 },
        { label: "With jar swap", price: 5.5, cost: 2.75 }
      ] },
      { name: "Chili Oil", variants: [
        { label: "Per Jar", price: 10, cost: 4.07 },
        { label: "With jar swap", price: 8, cost: 3.07 }
      ] },
      { name: "Thyme or Lavender Syrup", variants: [
        { label: "Per Jar", price: 7, cost: 3.67 },
        { label: "With jar swap", price: 5, cost: 1.67 }
      ] },
      { name: "Vanilla Syrup", variants: [
        { label: "Per Jar", price: 12, cost: 7.17 },
        { label: "With jar swap", price: 10, cost: 5.17 }
      ] },
      { name: "Vanilla Lavender Syrup", variants: [
        { label: "Per Jar", price: 13, cost: 8.17 },
        { label: "With jar swap", price: 11, cost: 6.17 }
      ] }
    ],
    bag: [
      { name: "Ribeye", perLb: true, pricePerLb: 25, costPerLb: 19, variants: [{ label: "price by weight", price: 26.5, cost: 19 }] },
      { name: "NY Strip", perLb: true, pricePerLb: 23, costPerLb: 17.49, variants: [{ label: "price by weight", price: 24.5, cost: 17.49 }] },
      { name: "Filet Mignon", perLb: true, pricePerLb: 34, costPerLb: 24.99, variants: [{ label: "price by weight", price: 35.5, cost: 24.99 }] },
      { name: "Chicken Breast", perLb: true, pricePerLb: 9, costPerLb: 6, variants: [{ label: "price by weight", price: 10.5, cost: 6 }] },
      { name: "Pork Tenderloin", perLb: true, pricePerLb: 15, costPerLb: 8, variants: [{ label: "price by weight", price: 16.5, cost: 8 }] },
      { name: "Carrots", variants: [{ label: "~2 servings", price: 6, cost: 1.83 }] },
      { name: "Baby Gold Potatoes", variants: [{ label: "~2 servings", price: 7, cost: 2.5 }] },
      { name: "Corn (off the cob)", variants: [{ label: "~2 servings", price: 7, cost: 2 }] },
      { name: "Parsnips", variants: [{ label: "~2 servings", price: 7, cost: 2 }] },
      { name: "Asparagus", variants: [
        { label: "Whole (~2 servings)", price: 8, cost: 3 },
        { label: "Bite-size (~2 servings)", price: 8, cost: 3 }
      ] }
    ],
    sauces: [
      { name: "Chimichurri", variants: [{ label: "Per Container", price: 3, cost: 0.4 }] },
      { name: "Romesco", variants: [{ label: "Per Container", price: 4, cost: 0.8 }] },
      { name: "Chermoula", variants: [{ label: "Per Container", price: 3, cost: 0.4 }] },
      { name: "Miso Butter Sauce", variants: [{ label: "Per Container", price: 3, cost: 0.55 }] },
      { name: "Whipped Lemon Garlic Herb Butter", variants: [{ label: "Per Container", price: 3, cost: 0.45 }] }
    ]
  };
  var PER_LB_ITEMS = {};
  ALWAYS_MENU2.bag.forEach((it) => {
    if (it.perLb) PER_LB_ITEMS[it.name] = { pricePerLb: it.pricePerLb, costPerLb: it.costPerLb };
  });
  function isPerLbItem2(name) {
    return !!PER_LB_ITEMS[name];
  }
  var FULL_MENU = { dinner: ALL_DINNERS, ...ALWAYS_MENU2 };
  function buildMenu(selectedDinners) {
    return { dinner: ALL_DINNERS.filter((d) => selectedDinners.includes(d.name)), ...ALWAYS_MENU2 };
  }
  var CATEGORY_LABELS = {
    dinner: "Dinner",
    breakfast: "Breakfast",
    fruit: "Fresh Cut Fruit",
    desserts: "Desserts",
    addons: "Add-Ons & Extras",
    bag: "Stuff in a Bag"
  };
  var STATUSES = ["Ordered", "Cooking", "Ready", "Delivered"];
  var STATUS_COLORS = {
    Ordered: "#7F77DD",
    Cooking: "#EF9F27",
    Ready: "#1D9E75",
    Delivered: "#5F5E5A"
  };

  // src/recipes.js
  var I = (name, q, u, staple = false) => ({ name, q, u, staple });
  var RECIPES = {
    "Indian Style Curry": {
      factors: {
        "Chickpea, Small (~4-5)": 0.5,
        "Chicken, Small (~4-5)": 0.5,
        "Shrimp, Small (~4-5)": 0.5,
        "Chickpea, Large (~8-10)": 1,
        "Chicken, Large (~8-10)": 1,
        "Shrimp, Large (~8-10)": 1
      },
      base: [
        I("Canned tomatoes", 1, "28oz can"),
        I("Red onion", 28, "oz"),
        I("Butter", 2, "sticks"),
        I("Kitchen Basics chicken stock", 32, "oz"),
        I("Limes", 2, ""),
        I("Weekly vegetables + chickpeas", 1, "lb"),
        I("Mix of spicy peppers", 1, "handful"),
        I("Curry powder", 0.25, "cup", true),
        I("Brown sugar", 2, "tbsp", true),
        I("Rice (included with order)", 1, "batch", true)
      ],
      extras: {
        "Chicken, Small (~4-5)": [I("Chicken thighs", 1, "lb")],
        "Chicken, Large (~8-10)": [I("Chicken thighs", 1, "lb")],
        "Shrimp, Small (~4-5)": [I("Shrimp", 1, "lb")],
        "Shrimp, Large (~8-10)": [I("Shrimp", 1, "lb")]
      }
    },
    "Texas Gulf Shrimp or Tofu and Chinese Broccoli": {
      factors: {
        "Shrimp, Small Batch (~4)": 1,
        "Shrimp, Large Batch (~8)": 2,
        "Tofu, Small Batch (~4)": 1,
        "Tofu, Large Batch (~8)": 2
      },
      base: [
        I("Chinese broccoli", 8, "oz"),
        I("Garlic", 3, "cloves"),
        I("Ginger", 1, "knob"),
        I("Oyster sauce", 3, "tbsp", true),
        I("Soy sauce", 2, "tbsp", true),
        I("Dark soy sauce", 1, "tbsp", true),
        I("House chili oil", 2, "tbsp", true),
        I("Rice (included with order)", 1, "batch", true)
      ],
      extras: {
        "Shrimp, Small Batch (~4)": [I("Shrimp", 1, "lb")],
        "Shrimp, Large Batch (~8)": [I("Shrimp", 1, "lb")],
        "Tofu, Small Batch (~4)": [I("Tofu", 1, "block")],
        "Tofu, Large Batch (~8)": [I("Tofu", 1, "block")]
      }
    },
    "Cumin Mushroom Noodles": {
      factors: {
        "Small (~3-4)": 0.5,
        "Large (~6-8)": 1,
        "Small (~3-4) + Asian Greens": 0.5,
        "Large (~6-8) + Asian Greens": 1
      },
      base: [
        I("Mushrooms", 3, "lb"),
        I("Garlic", 16, "cloves"),
        I("Ginger", 4, "knobs"),
        I("Red onion (large)", 2, ""),
        I("Cilantro", 1, "bunch"),
        I("Fresh noodles (not dried)", 1, "batch"),
        I("Cumin + spices", 1, "blend", true),
        I("Chinkiang vinegar", 6, "tbsp", true),
        I("Shaoxing wine", 0.5, "cup", true),
        I("House chili oil", 1, "cup", true)
      ],
      extras: {
        "Small (~3-4) + Asian Greens": [{ ...I("Asian greens", 1, "lb"), fixed: true }],
        "Large (~6-8) + Asian Greens": [{ ...I("Asian greens", 1, "lb"), fixed: true }]
      }
    },
    "Bolognese": {
      factors: { "Small (split order, ~4)": 0.5, "Large (~8)": 1 },
      base: [
        I("Ground pork", 1, "lb"),
        I("Ground lamb", 1, "lb"),
        I("Ground beef", 1, "lb"),
        I("Whole milk", 1, "cup"),
        I("Red wine", 1, "bottle"),
        I("Tomato paste", 1, "small can"),
        I("Fresh thyme", 1, "bunch"),
        I("Onion", 1, ""),
        I("Carrot", 1, ""),
        I("Garlic", 4, "cloves"),
        I("Pasta (ask customer for shape!)", 2, "lb"),
        I("Nutmeg", 1, "pinch", true)
      ]
    },
    "Shrimp or Tofu with Asparagus in Black Bean Sauce": {
      factors: {
        "Shrimp, Small Batch (~3-4)": 1,
        "Shrimp, Large Batch (~7-8)": 2,
        "Tofu, Small Batch (~3-4)": 1,
        "Tofu, Large Batch (~7-8)": 2
      },
      base: [
        I("Asparagus", 1, "lb"),
        I("Scallions", 1, "bunch"),
        I("Garlic", 3, "cloves"),
        I("Ginger", 1, "knob"),
        I("Soy + Shaoxing + black beans + sugar", 1, "batch", true),
        I("Rice (included with order)", 1, "batch", true)
      ],
      extras: {
        "Shrimp, Small Batch (~3-4)": [I("Shrimp", 1, "lb")],
        "Shrimp, Large Batch (~7-8)": [I("Shrimp", 1, "lb")],
        "Tofu, Small Batch (~3-4)": [I("Tofu", 1, "block")],
        "Tofu, Large Batch (~7-8)": [I("Tofu", 1, "block")]
      }
    },
    "Thai Basil Chicken (Pad Krapow Gai)": {
      factors: { "Small (~3-4)": 1, "Large (~7-8)": 2 },
      base: [
        I("Ground chicken", 1, "lb"),
        I("Asparagus", 8, "oz"),
        I("Thai basil", 1, "bunch"),
        I("Garlic", 6, "cloves"),
        I("Limes", 1, ""),
        I("Oyster + soy + fish sauce + sugar", 1, "batch", true),
        I("Rice (included with order)", 1, "batch", true)
      ]
    },
    "Pasta with Red Sauce": {
      factors: { "Base (~4)": 1, "With Beef or Turkey": 1, "With Mushrooms": 1, "With Both": 1 },
      base: [
        I("Canned tomatoes", 1, "28oz can"),
        I("Garlic", 5, "cloves"),
        I("Pasta", 1, "lb"),
        I("Good olive oil", 1, "glug", true)
      ],
      extras: {
        "With Beef or Turkey": [I("Ground beef or turkey", 1, "lb")],
        "With Mushrooms": [I("Baby bella mushrooms", 8, "oz")],
        "With Both": [I("Ground beef or turkey", 1, "lb"), I("Baby bella mushrooms", 8, "oz")]
      }
    },
    "Tex-Mex Kit": {
      factors: {
        "Pulled Pork, Small (~5-6)": 1,
        "Pulled Pork, Large (~9-10)": 2,
        "Pulled Beef, Small (~5-6)": 1,
        "Pulled Beef, Large (~9-10)": 2
      },
      base: [
        I("Beans (for refried)", 1, "lb"),
        I("Tomatoes (pico)", 1, "lb"),
        I("Red onion", 1.5, "lb"),
        I("Cilantro", 1, "bunch"),
        I("Limes", 8, ""),
        I("Garlic", 4, "cloves"),
        I("HEB bakery tortillas", 1, "10-ct pack"),
        I("Dried peppers (red sauce)", 8, "oz"),
        I("Orange juice", 1, "small bottle"),
        I("Tex-Mex spices", 1, "blend", true)
      ],
      extras: {
        "Pulled Pork, Small (~5-6)": [I("Bone-in pork butt", 4, "lb")],
        "Pulled Pork, Large (~9-10)": [I("Bone-in pork butt", 4, "lb")],
        "Pulled Beef, Small (~5-6)": [I("Beef chuck roast", 2.5, "lb")],
        "Pulled Beef, Large (~9-10)": [I("Beef chuck roast", 2.5, "lb")]
      }
    },
    "Brunswick Stew": {
      factors: { "Small (~4)": 1, "Large (~8)": 2 },
      base: [
        I("Chicken thighs", 1, "lb"),
        I("Salt pork", 2, "oz"),
        I("Chicken stock", 4, "cups"),
        I("Canned peeled tomatoes", 1, "14oz can"),
        I("Red potatoes", 0.5, "lb"),
        I("Onion", 1, "lb"),
        I("Corn", 3, "ears"),
        I("Dried lima beans", 5, "oz"),
        I("Worcestershire + vinegar + flour", 1, "batch", true)
      ]
    },
    "Boeuf Bourguignon (Beef Stew)": {
      factors: { "~6 servings": 1, "With 1 lb mushrooms": 1 },
      base: [
        I("Beef chuck roast", 2.5, "lb"),
        I("Red potatoes", 1.5, "lb"),
        I("Carrots", 1.5, "lb"),
        I("Red wine", 1, "bottle"),
        I("Beef stock", 8, "cups"),
        I("Fresh thyme", 1, "bunch"),
        I("Tomato paste", 1, "small can"),
        I("Onion", 1, "lb"),
        I("Bay + salt + pepper + vinegar", 1, "batch", true)
      ],
      extras: {
        "With 1 lb mushrooms": [I("Mushrooms", 1, "lb")]
      }
    },
    "Chili": {
      factors: { "Small (split order, ~3-4)": 0.5, "Large (~6-8)": 1 },
      base: [
        I("Ground beef", 2, "lb"),
        I("Dried kidney beans", 1, "lb"),
        I("Assorted dried chilis", 1, "bag"),
        I("Chicken broth", 4, "cups"),
        I("Canned tomatoes", 1, "28oz can"),
        I("Dark chocolate", 1, "oz"),
        I("Anchovies", 1, "tin"),
        I("Tomato paste", 1, "small can"),
        I("Limes", 1, ""),
        I("Espresso + bourbon + marmite + soy + spices", 1, "batch", true)
      ]
    },
    "Homemade Waffles": {
      factors: { "Set of 12": 1 },
      base: [
        I("Milk", 2, "cups"),
        I("Butter", 1, "stick"),
        I("Flour", 270, "g", true),
        I("Eggs", 2, "", true),
        I("Gallon ziplock bag", 1, "", true)
      ]
    },
    "Fresh Cut Pineapple": {
      factors: { "Per Container": 0.5 },
      base: [I("Pineapple (1 makes 2 containers)", 1, "")]
    },
    "Seasonal Cantaloupe": {
      factors: { "Per Container": 1 },
      base: [I("Seasonal cantaloupe (HEB melons)", 1, "")]
    },
    "Chocolate Chip Cookies": {
      factors: { "1 Dozen (Standard)": 1, "1 Dozen (Premium Valrhona)": 1 },
      base: [
        I("Butter", 2, "sticks"),
        I("Flour", 322, "g", true),
        I("Eggs", 3, "", true),
        I("Brown + white sugar", 1, "batch", true)
      ],
      extras: {
        "1 Dozen (Standard)": [I("Guittard chocolate (low + high %)", 290, "g")],
        "1 Dozen (Premium Valrhona)": [I("Valrhona chocolate", 290, "g")]
      }
    },
    "Peanut Butter Fudge": {
      factors: { "1 Batch": 1 },
      base: [
        I("Peanut butter", 0.5, "cup"),
        I("Evaporated milk", 0.75, "cup"),
        I("Butter", 3, "tbsp"),
        I("Sugar + karo + cocoa + vanilla", 1, "batch", true)
      ]
    },
    "Queso": {
      factors: { "Per Pint Jar": 0.5, "With jar swap": 0.5 },
      base: [
        I("Oaxaca cheese", 250, "g"),
        I("Colby Jack", 250, "g"),
        I("Poblano pepper", 90, "g"),
        I("Sweet onion", 135, "g"),
        I("Habaneros", 2, ""),
        I("Dried ancho chili", 9, "g"),
        I("Limes", 1, ""),
        I("Cilantro", 15, "g"),
        I("Sodium citrate", 20, "g", true),
        I("Pint mason jar", 2, "", false)
      ]
    },
    "Pickled Onions or Carrots": {
      factors: { "Standard": 1, "With jar swap": 1 },
      base: [
        I("Onions or carrots (for pickling)", 1, "lb"),
        I("Pint mason jar", 1, ""),
        I("Pickling vinegar + spices", 1, "batch", true)
      ]
    },
    "Chili Oil": {
      factors: { "Per Jar": 0.5, "With jar swap": 0.5 },
      base: [
        I("Ginger", 4, "knobs"),
        I("Pint mason jar", 2, ""),
        I("Chili flakes + whole spices + oil", 1, "batch", true)
      ]
    },
    "Thyme or Lavender Syrup": {
      factors: { "Per Jar": 1, "With jar swap": 1 },
      base: [
        I("Fresh thyme or lavender", 1, "bunch"),
        I("Pint mason jar", 1, ""),
        I("Sugar", 1, "cup", true)
      ]
    },
    "Vanilla Syrup": {
      factors: { "Per Jar": 1, "With jar swap": 1 },
      base: [
        I("Pint mason jar", 1, ""),
        I("House vanilla extract + beans", 1, "batch", true),
        I("Sugar", 1, "cup", true)
      ]
    },
    "Vanilla Lavender Syrup": {
      factors: { "Per Jar": 1, "With jar swap": 1 },
      base: [
        I("Fresh lavender", 1, "bunch"),
        I("Pint mason jar", 1, ""),
        I("House vanilla extract + beans", 1, "batch", true),
        I("Sugar", 1, "cup", true)
      ]
    },
    "Ribeye": {
      factors: { "price by weight": 1 },
      base: [I("Ribeye", 1, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "NY Strip": {
      factors: { "price by weight": 1 },
      base: [I("NY Strip", 1, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "Filet Mignon": {
      factors: { "price by weight": 1 },
      base: [I("Filet Mignon", 1, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "Chicken Breast": {
      factors: { "price by weight": 1 },
      base: [I("Chicken breast", 1, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "Baby Gold Potatoes": {
      factors: { "2 servings": 1 },
      base: [I("Baby gold potatoes", 0.6, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "Carrots": {
      factors: { "2 servings": 1 },
      base: [I("Carrots", 0.6, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "Pork Tenderloin": {
      factors: { "price by weight": 1 },
      base: [I("Pork tenderloin", 1.25, "lb"), I("Sous vide bag + seasonings", 1, "", true)]
    },
    "Saffron Pork Ragu": {
      factors: { "Small (~4 servings)": 1, "Large (~8 servings)": 2 },
      base: [
        I("Ground pork", 1, "lb"),
        I("Fennel seeds", 1, "tsp"),
        I("Onion", 1, ""),
        I("Garlic", 4, "cloves"),
        I("Crushed tomatoes", 1, "can"),
        I("Dry sherry", 0.25, "cup"),
        I("Saffron", 1, "pinch", true),
        I("Pasta (ask customer for shape!)", 1, "lb")
      ]
    },
    "Mapo Eggplant": {
      factors: { "Small (~5-6 servings)": 1, "Large (~10-12 servings)": 2 },
      base: [
        I("Chinese eggplant", 2, "lb"),
        I("Ground chicken", 0.5, "lb"),
        I("Doubanjiang", 3, "tbsp"),
        I("Garlic", 4, "cloves"),
        I("Ginger", 1, "knob"),
        I("Scallions", 1, "bunch"),
        I("House chili oil", 0.25, "cup", true),
        I("Sichuan peppercorns", 1, "tbsp", true),
        I("Rice (included with order)", 1, "batch", true)
      ]
    },
    "Gumbo": {
      factors: { "Small (split order, ~3-4)": 0.5, "Large (~7-8)": 1 },
      base: [
        I("Chicken thighs", 2, "lb"),
        I("Boudin", 1, "lb"),
        I("Onion", 1, ""),
        I("Green bell pepper", 1, ""),
        I("Celery", 3, "stalks"),
        I("Garlic", 4, "cloves"),
        I("Flour", 1, "cup"),
        I("Okra", 0.5, "lb"),
        I("Cajun spices", 1, "blend", true),
        I("Rice (included with order)", 1, "batch", true)
      ]
    },
    "Stir Fried Long Beans with Ground Pork": {
      factors: { "Small (~4)": 0.5, "Large (~8)": 1 },
      base: [
        I("Long beans", 1.5, "lb"),
        I("Ground pork", 1, "lb"),
        I("Doubanjiang", 2, "tbsp"),
        I("Garlic", 6, "cloves"),
        I("Scallions", 1, "bunch"),
        I("Soy sauce", 2, "tbsp", true),
        I("Rice (included with order)", 1, "batch", true)
      ]
    }
  };
  var INGREDIENT_SYNONYMS = {
    "scallion": "green onion",
    "scallions": "green onion",
    "spring onion": "green onion",
    "coriander": "cilantro",
    "chili": "chile",
    "chilli": "chile"
  };
  function normalizeIngredientName(name) {
    let n = String(name).toLowerCase().trim();
    n = n.replace(/\s*\(.*?\)\s*/g, " ").trim();
    n = n.replace(/\s+/g, " ");
    n = n.split(" ").map((w) => {
      if (INGREDIENT_SYNONYMS[w]) return INGREDIENT_SYNONYMS[w];
      if (w.length > 4 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
      return w;
    }).join(" ");
    return INGREDIENT_SYNONYMS[n] || n;
  }
  function generateShoppingItems(activeOrders, includeStaples) {
    const agg = /* @__PURE__ */ new Map();
    const unknown = [];
    const addIng = (name, qty, unit, staple, factor) => {
      const norm = normalizeIngredientName(name);
      const normUnit = unit.length > 3 && unit.endsWith("s") && !unit.endsWith("ss") ? unit.slice(0, -1) : unit;
      const key = `${norm}|${normUnit}`;
      if (!agg.has(key)) agg.set(key, { display: name, u: unit, q: 0, staple });
      agg.get(key).q += qty * factor;
    };
    activeOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        if (isPerLbItem2(it.name)) {
          const lbs = (typeof it.weight === "number" && it.weight > 0 ? it.weight : 1) * it.qty;
          addIng(it.name, lbs, "lb", false, 1);
          if (includeStaples) addIng("Sous vide bag + seasonings", 1, "", true, it.qty);
          return;
        }
        const recipe = RECIPES[it.name];
        if (!recipe) {
          unknown.push(`${it.qty}x ${it.name} (${it.variant}) \u2014 no recipe data, plan manually`);
          return;
        }
        const factor = (recipe.factors?.[it.variant] ?? 1) * it.qty;
        const ings = [...recipe.base || [], ...(recipe.extras || {})[it.variant] || []];
        ings.forEach((ing) => {
          if (ing.staple && !includeStaples) return;
          addIng(ing.name, ing.q, ing.u, ing.staple, ing.fixed ? it.qty : factor);
        });
      });
    });
    const fmtQ = (q) => String(Math.round(q * 100) / 100);
    const lines = Array.from(agg.values()).sort((a, b) => a.staple === b.staple ? a.display.localeCompare(b.display) : a.staple ? 1 : -1).map((x) => {
      const qty = x.u ? `${fmtQ(x.q)} ${x.u}` : fmtQ(x.q);
      return `${x.display} \u2014 ${qty}${x.staple ? " (staple)" : ""}`;
    });
    return [...lines, ...unknown];
  }
  var SOUS_VIDE_VEG = ["Carrots", "Baby Gold Potatoes", "Corn (off the cob)", "Parsnips", "Asparagus"];
  var DINNER_REHEAT_BUCKET = {
    // Bagged dishes — reheated sealed in simmering water
    "Shrimp or Tofu with Asparagus in Black Bean Sauce": "bagged",
    "Texas Gulf Shrimp or Tofu and Chinese Broccoli": "bagged",
    "Thai Basil Chicken (Pad Krapow Gai)": "bagged",
    "Stir Fried Long Beans with Ground Pork": "bagged",
    // Stovetop in a container — warm gently, splash of water if thick
    "Mapo Eggplant": "stovetop",
    "Gumbo": "stovetop",
    "Brunswick Stew": "stovetop",
    "Chili": "stovetop",
    "Boeuf Bourguignon (Beef Stew)": "stovetop",
    "Indian Style Curry": "stovetop",
    // Pasta / noodle dishes — cook fresh, warm the sauce
    "Bolognese": "pasta",
    "Pasta with Red Sauce": "pasta",
    "Saffron Pork Ragu": "pasta",
    "Cumin Mushroom Noodles": "pasta",
    // Tex-Mex Kit — components, assemble at home
    "Tex-Mex Kit": "kit"
  };
  var RICE_DISHES = /* @__PURE__ */ new Set([
    "Shrimp or Tofu with Asparagus in Black Bean Sauce",
    "Texas Gulf Shrimp or Tofu and Chinese Broccoli",
    "Thai Basil Chicken (Pad Krapow Gai)",
    "Stir Fried Long Beans with Ground Pork",
    "Mapo Eggplant",
    "Gumbo",
    "Indian Style Curry"
  ]);
  var PASTA_DISHES = /* @__PURE__ */ new Set(["Bolognese", "Pasta with Red Sauce", "Saffron Pork Ragu"]);
  var NOODLE_DISHES = /* @__PURE__ */ new Set(["Cumin Mushroom Noodles"]);
  function buildReheatBlocks(order) {
    const items = order.items || [];
    const blocks = [];
    const byBucket = { bagged: [], stovetop: [], pasta: [], kit: [] };
    const proteins = [];
    const veg = [];
    let hasQueso = false;
    const seen = /* @__PURE__ */ new Set();
    items.forEach((it) => {
      const name = it.name;
      if (seen.has(name)) return;
      if (isPerLbItem2(name)) {
        proteins.push(name);
        seen.add(name);
        return;
      }
      if (SOUS_VIDE_VEG.includes(name)) {
        veg.push(name);
        seen.add(name);
        return;
      }
      if (name === "Queso") {
        hasQueso = true;
        seen.add(name);
        return;
      }
      const b = DINNER_REHEAT_BUCKET[name];
      if (b && byBucket[b]) {
        byBucket[b].push(name);
        seen.add(name);
      }
    });
    const listHasRice = (names) => names.some((n) => RICE_DISHES.has(n));
    const listHasPasta = (names) => names.some((n) => PASTA_DISHES.has(n));
    const listHasNoodle = (names) => names.some((n) => NOODLE_DISHES.has(n));
    if (byBucket.bagged.length) {
      let body = "Bring a pot of water to a gentle simmer and place the sealed bag in until heated through, then cut open and plate. Microwave or stovetop work too if you prefer. See the main menu for additional details.";
      if (listHasRice(byBucket.bagged)) body += " Cook the included rice fresh.";
      blocks.push({ title: "Reheat in the bag", dishes: byBucket.bagged, body });
    }
    if (byBucket.stovetop.length) {
      let body = "Comes in a container. Warm gently on the stove over medium-low until heated through. If it looks a little thick, add a splash of water to loosen it.";
      if (listHasRice(byBucket.stovetop)) body += " Cook the included rice fresh.";
      blocks.push({ title: "Reheat on the stovetop", dishes: byBucket.stovetop, body });
    }
    if (byBucket.pasta.length) {
      const hasP = listHasPasta(byBucket.pasta);
      const hasN = listHasNoodle(byBucket.pasta);
      const carb = hasP && hasN ? "pasta/noodles" : hasN ? "noodles" : "pasta";
      let body = `Cook the included ${carb} fresh. Warm the sauce gently on the stove, adding a splash of pasta water to loosen if needed, then toss together.`;
      blocks.push({ title: "Cook fresh, warm the sauce", dishes: byBucket.pasta, body });
    }
    if (byBucket.kit.length) {
      blocks.push({
        title: "Assemble at home",
        dishes: byBucket.kit,
        body: "Components travel separately with assembly notes. Warm the protein gently before building."
      });
    }
    if (proteins.length) {
      blocks.push({
        title: "Sear the proteins",
        dishes: proteins,
        body: "Already cooked through, they just need a sear. Pat dry, then sear in a hot pan with a little oil until a nice crust forms on each side. Rest a few minutes before slicing."
      });
    }
    if (veg.length) {
      blocks.push({
        title: "Reheat the vegetables",
        dishes: veg,
        body: "Bring a pot of water to a gentle simmer and place the sealed bag in until heated through. Plate as-is, or, if you have a few extra minutes, strain the liquid from the bag into a pan and reduce it down into a glaze to spoon over the top."
      });
    }
    if (hasQueso) {
      blocks.push({
        title: "Reheat the queso",
        dishes: ["Queso"],
        body: "Remove the lid and microwave at 50% power for 5 minutes. This should loosen it enough to transfer to a sauce pot, then heat on low until it reaches the temperature you want. You can keep microwaving at 50% power instead, but the stovetop finish is the better way to go."
      });
    }
    return blocks;
  }

  // src/config.js
  var SURCHARGE = 2;
  var ORDERS_KEY = "ltb-orders";
  var CHECKS_KEY = "ltb-cook-checks";
  var DELIVER_CHECKS_KEY = "ltb-deliver-checks";
  var DISH_NOTES_KEY = "ltb-dish-notes";
  var WEEK_NOTES_KEY = "ltb-week-notes";
  var SHOPPING_KEY = "ltb-shopping";
  var WEEK_KEY = "ltb-week";
  var PENDING_KEY = "ltb-pending-orders";
  var SEEN_ROWS_KEY = "ltb-seen-rows";
  var REGULARS_KEY = "ltb-regulars";
  var INVENTORY_KEY = "ltb-inventory";
  var WORKER_BASE = "https://ltb-proxy.strickland-kevinj.workers.dev";
  var PENDING_POLL_URL = WORKER_BASE + "/pending";
  var CONFIG_PUBLISH_URL = WORKER_BASE + "/config";
  var PUBLISH_TOKEN = "ltb-publish-2026";
  var VAPID_PUBLIC_KEY = "BD96MjYlJ5dAdlTEzTMLi1hAlDmy-s2d6eO5B2aavlXFdueX9jSH4BOKJpDLE2MdOKvttlwOdSrs0tjFEio3EU8";
  var USE_LEGACY_CSV = false;
  var FORM_CSV_URL2 = "https://ltb-proxy.strickland-kevinj.workers.dev/sheet";

  // src/utils.js
  var uid = () => Math.random().toString(36).slice(2, 10);
  var currency = (n) => `$${(Number(n) || 0).toFixed(2)}`;
  var round2 = (n) => Math.round(n * 100) / 100;
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }
  var DISH_CUISINE = {
    "Indian Style Curry": "Indian",
    "Shrimp or Tofu with Asparagus in Black Bean Sauce": "Chinese",
    "Texas Gulf Shrimp or Tofu and Chinese Broccoli": "Chinese",
    "Cumin Mushroom Noodles": "Chinese",
    "Thai Basil Chicken (Pad Krapow Gai)": "Thai",
    "Stir Fried Long Beans with Ground Pork": "Chinese",
    "Mapo Eggplant": "Chinese",
    "Pasta with Red Sauce": "Italian",
    "Bolognese": "Italian",
    "Saffron Pork Ragu": "Italian",
    "Tex-Mex Kit": "Tex-Mex",
    "Brunswick Stew": "Southern",
    "Gumbo": "Southern",
    "Boeuf Bourguignon (Beef Stew)": "French",
    "Chili": "American"
  };
  var dishCuisine = (name) => DISH_CUISINE[name] || "Other";
  var normName = (s) => String(s || "").toLowerCase().trim().replace(/\s+/g, " ");
  function nameMatchType(a, b) {
    const na = normName(a), nb = normName(b);
    if (!na || !nb) return null;
    if (na === nb) return "exact";
    const fa = na.split(" ")[0], fb = nb.split(" ")[0];
    if (fa && fa === fb) return "partial";
    if (na.includes(nb) || nb.includes(na)) return "partial";
    return null;
  }
  function regularNames(reg) {
    if (!reg) return [];
    if (Array.isArray(reg.names) && reg.names.length) {
      return reg.names.map((n) => String(n || "").trim()).filter(Boolean);
    }
    return reg.name ? [String(reg.name).trim()] : [];
  }
  function regularDisplayName(reg) {
    const names = regularNames(reg);
    if (names.length === 0) return "(unnamed)";
    if (names.length === 1) return names[0];
    return names.slice(0, -1).join(", ") + " & " + names[names.length - 1];
  }
  function regularMatchType(reg, customerName) {
    let best = null;
    for (const nm of regularNames(reg)) {
      const m = nameMatchType(nm, customerName);
      if (m === "exact") return "exact";
      if (m === "partial") best = "partial";
    }
    return best;
  }
  var MIN_ORDERS_FOR_INSIGHT = 5;
  function buildInsights(linkedOrders) {
    const orders = (linkedOrders || []).filter((o) => o && Array.isArray(o.items));
    if (orders.length < MIN_ORDERS_FOR_INSIGHT) return [];
    const insights = [];
    const cuisineCount = {};
    const dishCount = {};
    let totalDishLines = 0;
    orders.forEach((o) => {
      o.items.forEach((it) => {
        if (!ALL_DINNERS.some((d) => d.name === it.name)) return;
        const c = dishCuisine(it.name);
        cuisineCount[c] = (cuisineCount[c] || 0) + 1;
        dishCount[it.name] = (dishCount[it.name] || 0) + 1;
        totalDishLines += 1;
      });
    });
    if (totalDishLines >= 4) {
      const sorted = Object.entries(cuisineCount).sort((a, b) => b[1] - a[1]);
      if (sorted.length && sorted[0][1] >= 3 && sorted[0][1] / totalDishLines >= 0.5 && sorted[0][0] !== "Other") {
        insights.push(`Tends to favor ${sorted[0][0]} dishes (${sorted[0][1]} of ${totalDishLines} dinner orders).`);
      }
    }
    const favDish = Object.entries(dishCount).sort((a, b) => b[1] - a[1])[0];
    if (favDish && favDish[1] >= 3) {
      insights.push(`Repeat favorite: ${favDish[0]} (ordered ${favDish[1]} times).`);
    }
    const spiceNotes = [];
    orders.forEach((o) => {
      const blob = ((o.notes || "") + " " + (o.items || []).map((it) => it.note || "").join(" ")).toLowerCase();
      const m = blob.match(/spice\s*(?:level\s*)?(\d)/);
      if (m) spiceNotes.push(parseInt(m[1], 10));
    });
    if (spiceNotes.length >= 3) {
      const avg = spiceNotes.reduce((a, b) => a + b, 0) / spiceNotes.length;
      if (Math.max(...spiceNotes) - Math.min(...spiceNotes) <= 1) {
        insights.push(`Consistent spice preference around level ${Math.round(avg)}.`);
      }
    }
    const addonCount = {};
    orders.forEach((o) => {
      o.items.forEach((it) => {
        if (ALL_DINNERS.some((d) => d.name === it.name)) return;
        addonCount[it.name] = (addonCount[it.name] || 0) + 1;
      });
    });
    const favAddon = Object.entries(addonCount).sort((a, b) => b[1] - a[1])[0];
    if (favAddon && favAddon[1] >= 3) {
      insights.push(`Regularly adds ${favAddon[0]} (${favAddon[1]} orders).`);
    }
    return insights;
  }
  function insightStamp(text) {
    const d = /* @__PURE__ */ new Date();
    const mo = d.toLocaleDateString(void 0, { month: "short" });
    return `[Auto-insight \xB7 ${mo} ${d.getDate()}] ${text}`;
  }
  function discountAmount(itemsTotal, discountType, discountValue) {
    if (!discountType || !discountValue) return 0;
    if (discountType === "percent") return round2(itemsTotal * (discountValue / 100));
    return round2(Math.min(discountValue, itemsTotal));
  }
  function itemsUpchargeTotal(items) {
    return round2((items || []).reduce((sum, it) => {
      const amt = it.upcharge && typeof it.upcharge.amount === "number" ? it.upcharge.amount : 0;
      return sum + amt * it.qty;
    }, 0));
  }
  function customChargesTotal(customCharges) {
    return round2((customCharges || []).reduce((sum, ch) => sum + (Number(ch.amount) || 0), 0));
  }
  function itemsBaseTotal(items) {
    return round2((items || []).reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1), 0));
  }
  function orderTotal(items, jarSwaps, containerReturns, discountType, discountValue, customCharges, waiveSurcharge) {
    const base = itemsBaseTotal(items);
    const upcharges = itemsUpchargeTotal(items);
    const custom = customChargesTotal(customCharges);
    const disc = discountAmount(base, discountType, discountValue);
    const surcharge = waiveSurcharge ? 0 : SURCHARGE;
    return round2(base + upcharges - disc + custom + surcharge - (jarSwaps || 0) * 2 - (containerReturns || 0) * 1);
  }
  function repricePerLbItem(it) {
    const info = PER_LB_ITEMS[it.name];
    if (!info) return it;
    const lbs = typeof it.weight === "number" && it.weight > 0 ? it.weight : 1;
    const BAG = 1.5;
    return {
      ...it,
      weightPending: false,
      price: round2(info.pricePerLb * lbs + BAG),
      cost: round2(info.costPerLb * lbs)
    };
  }
  function itemCost(it) {
    if (typeof it.cost === "number") return it.cost;
    const menuItem = (FULL_MENU[it.category] || []).find((m) => m.name === it.name);
    const variant = menuItem?.variants.find((v) => v.label === it.variant);
    return typeof variant?.cost === "number" ? variant.cost : null;
  }
  function orderCostInfo(order) {
    let cost = 0;
    let complete = true;
    (order.items || []).forEach((it) => {
      const c = itemCost(it);
      if (c === null) complete = false;
      else cost += c * it.qty;
    });
    return { cost: round2(cost), complete };
  }
  function groupKeyFor(order, mode) {
    const d = new Date(order.createdAt || 0);
    if (mode === "week") {
      const day = (d.getDay() + 6) % 7;
      const mon = new Date(d);
      mon.setDate(d.getDate() - day);
      return {
        label: `Week of ${mon.toLocaleDateString(void 0, { month: "short", day: "numeric" })}`,
        stamp: new Date(mon.getFullYear(), mon.getMonth(), mon.getDate()).getTime()
      };
    }
    if (mode === "month") {
      return {
        label: d.toLocaleDateString(void 0, { month: "long", year: "numeric" }),
        stamp: new Date(d.getFullYear(), d.getMonth(), 1).getTime()
      };
    }
    if (mode === "year") {
      return { label: String(d.getFullYear()), stamp: new Date(d.getFullYear(), 0, 1).getTime() };
    }
    return { label: "", stamp: 0 };
  }
  function formatDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString(void 0, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  }
  function orderToText(order) {
    const lines = [`LTB Order \u2014 ${order.customer}`];
    (order.items || []).forEach((it) => {
      const up = it.upcharge && it.upcharge.amount ? it.price + it.upcharge.amount : it.price;
      lines.push(`${it.qty}x ${it.name} (${it.variant}) \u2014 ${currency(up * it.qty)}`);
      if (it.upcharge && it.upcharge.amount)
        lines.push(`   + ${it.upcharge.label || "Upcharge"} (+${currency(it.upcharge.amount)} ea)`);
      if (it.note) lines.push(`   note: ${it.note}`);
    });
    const base = itemsBaseTotal(order.items);
    const disc = discountAmount(base, order.discountType, order.discountValue);
    if (disc > 0) {
      const label = order.discountType === "percent" ? `${order.discountValue}% discount` : "Discount";
      lines.push(`${label} \u2014 -${currency(disc)}`);
    }
    (order.customCharges || []).forEach((ch) => {
      lines.push(`${ch.label || "Charge"} \u2014 ${currency(Number(ch.amount) || 0)}`);
    });
    if (!order.waiveSurcharge) lines.push(`Order surcharge \u2014 ${currency(SURCHARGE)}`);
    if (order.jarSwaps > 0)
      lines.push(`Jar swap x${order.jarSwaps} \u2014 -${currency(order.jarSwaps * 2)}`);
    if (order.containerReturns > 0)
      lines.push(`Container return x${order.containerReturns} \u2014 -${currency(order.containerReturns)}`);
    lines.push(`Total: ${currency(order.total)}`);
    if (order.notes) lines.push(`Notes: ${order.notes}`);
    return lines.join("\n");
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    }
  }
  var localStore = {
    async get(key) {
      const value = window.localStorage.getItem(key);
      return value === null ? null : { key, value };
    },
    async set(key, value) {
      window.localStorage.setItem(key, value);
      return { key, value };
    },
    async delete(key) {
      window.localStorage.removeItem(key);
      return { key, deleted: true };
    },
    async list(prefix) {
      const keys = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (!prefix || k.startsWith(prefix))) keys.push(k);
      }
      return { keys };
    }
  };
  var store = typeof window !== "undefined" && window.storage ? window.storage : localStore;
  async function loadJSON(key, fallback) {
    try {
      const result = await store.get(key);
      return result ? JSON.parse(result.value) : fallback;
    } catch {
      return fallback;
    }
  }
  async function saveJSON(key, value) {
    let serialized;
    try {
      serialized = JSON.stringify(value);
    } catch (e) {
      return { ok: false, error: "Could not serialize data", bytes: 0 };
    }
    const bytes = serialized.length;
    let lastErr = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await store.set(key, serialized);
        if (result) return { ok: true, error: null, bytes };
        lastErr = "Storage returned empty";
      } catch (e) {
        lastErr = e && e.message || "Storage threw an error";
      }
      if (attempt === 0) await new Promise((r) => setTimeout(r, 150));
    }
    return { ok: false, error: lastErr, bytes };
  }
  function saveError(res) {
    if (res && res.ok) return null;
    const bytes = res ? res.bytes : 0;
    if (bytes > 4.8 * 1024 * 1024) {
      return `Storage full: this data is ${(bytes / 1024 / 1024).toFixed(1)}MB, over the ~5MB limit. Archive or delete old orders, then it will save.`;
    }
    const detail = res && res.error ? ` (${res.error})` : "";
    return `Could not save${detail}. Your changes are shown but not yet stored \u2014 try again.`;
  }
  var PHOTO_PREFIX = "ltb-photo-";
  var PHOTO_TTL_DAYS = 30;
  function photoKey(orderId, itemIdx) {
    return `${PHOTO_PREFIX}${orderId}-${itemIdx}`;
  }
  async function savePhoto(orderId, itemIdx, base64) {
    try {
      const r = await store.set(photoKey(orderId, itemIdx), JSON.stringify({ d: base64, t: Date.now() }));
      return !!r;
    } catch {
      return false;
    }
  }
  async function loadPhoto(orderId, itemIdx) {
    try {
      const r = await store.get(photoKey(orderId, itemIdx));
      if (!r) return null;
      const parsed = JSON.parse(r.value);
      return parsed.d || null;
    } catch {
      return null;
    }
  }
  async function deletePhoto(orderId, itemIdx) {
    try {
      await store.delete(photoKey(orderId, itemIdx));
    } catch {
    }
  }
  async function photoStorageBytes() {
    try {
      const res = await store.list(PHOTO_PREFIX);
      const keys = res && res.keys || [];
      let bytes = 0;
      for (const k of keys) {
        try {
          const r = await store.get(k);
          if (r && r.value) bytes += r.value.length;
        } catch {
        }
      }
      return { bytes, count: keys.length };
    } catch {
      return { bytes: 0, count: 0 };
    }
  }
  async function cleanupPhotos(orders) {
    try {
      const res = await store.list(PHOTO_PREFIX);
      const keys = res && res.keys || [];
      if (keys.length === 0) return;
      const byId = new Map((orders || []).map((o) => [o.id, o]));
      const cutoff = Date.now() - PHOTO_TTL_DAYS * 24 * 60 * 60 * 1e3;
      for (const k of keys) {
        const rest = k.slice(PHOTO_PREFIX.length);
        const lastDash = rest.lastIndexOf("-");
        const orderId = lastDash >= 0 ? rest.slice(0, lastDash) : rest;
        const order = byId.get(orderId);
        let remove = false;
        if (!order) remove = true;
        else if (order.archived) remove = true;
        else {
          try {
            const r = await store.get(k);
            const t = r ? JSON.parse(r.value).t || 0 : 0;
            const stamp = t || new Date(order.createdAt || 0).getTime();
            if (stamp < cutoff) remove = true;
          } catch {
          }
        }
        if (remove) {
          try {
            await store.delete(k);
          } catch {
          }
        }
      }
    } catch {
    }
  }
  var fmtBytes = (b) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  };
  function menuForPrompt(menu) {
    const lines = [];
    Object.entries(menu).forEach(([cat, items]) => {
      items.forEach((item) => {
        item.variants.forEach((v) => {
          lines.push(`category="${cat}" name="${item.name}" variant="${v.label}" price=$${v.price}`);
        });
      });
    });
    return lines.join("\n");
  }
  async function fileToJpegBase64(file, maxDim = 1100, quality = 0.72) {
    const draw = (source, width, height) => {
      const scale = Math.min(1, maxDim / Math.max(width, height));
      const w = Math.max(1, Math.round(width * scale));
      const h = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(source, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (!dataUrl || dataUrl.length < 100) throw new Error("Image conversion produced no data");
      return dataUrl.split(",")[1];
    };
    if (typeof createImageBitmap === "function") {
      try {
        const bmp = await createImageBitmap(file);
        const result = draw(bmp, bmp.width, bmp.height);
        bmp.close && bmp.close();
        return result;
      } catch (e) {
      }
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          resolve(draw(img, img.naturalWidth || img.width, img.naturalHeight || img.height));
        } catch (e) {
          reject(e);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not decode image"));
      };
      img.src = url;
    });
  }
  async function parseOrderText(messageText, imageBase64, menu) {
    const intro = imageBase64 ? `You are an order parser for a small meal prep business. A customer sent a PHOTO of the menu with items circled, highlighted, or marked \u2014 possibly with handwritten notes on it${messageText ? ", along with this text message" : ""}.
Identify which menu items are circled/marked in the photo, and read any handwritten notes (like "sauce on side") into "notes".${messageText ? `

Their accompanying text:
"""
${messageText}
"""` : ""}` : `You are an order parser for a small meal prep business. A customer sent this text message with their order:

"""
${messageText}
"""`;
    const prompt = `${intro}

Here is the complete CURRENT menu. Each line is one orderable option:
${menuForPrompt(menu)}

Match what the customer asked for to menu options. Rules:
- Use EXACT category, name, and variant strings from the menu above.
- The customer may be looking at an OLDER version of the menu. If a marked item does not exist on the current menu, do NOT substitute a similar item \u2014 describe it in "notes" instead so the chef can follow up.
- If the customer mentions returning or swapping a jar for a jar item, choose the "With jar swap" variant of that item if one exists.
- "jarSwaps" should equal the number of jar items ordered with the jar-swap variant.
- "containerReturns" is the number of meal containers the customer says they will return (not jars).
- PER-ITEM NOTES: if a request clearly attaches to ONE specific item (e.g. "chili oil on the side", "extra spicy", "no cilantro"), put it in that item's "note" field, NOT in the order-level notes.
- ADD-ONS: some items have add-on options baked into their variants (e.g. a dish with a "+ Asian Greens" or "With Mushrooms" variant). If the customer asks for an add-on that EXISTS as a variant of that item (look for variants with + or "With" in the label, or a higher price than the base), select that upgraded variant \u2014 do NOT create an upcharge and do NOT flag it. Example: customer says "small mushroom noodles with Asian greens" \u2192 select variant "Small (~3-4) + Asian Greens", not "Small (~3-4)".
- OFF-MENU EXTRAS (upcharge): only if the customer asks to add something to an item that is NOT an available variant of that item (e.g. "add mushrooms" to a dish that has no mushroom option), set that item's "upcharge" to {"label":"short description","amount":null} with amount null. Do NOT also write a reviewReason for it \u2014 the app detects unpriced upcharges automatically. Just set the upcharge object.
- WEIGHT FOR PROTEINS: items named exactly "Ribeye", "NY Strip", "Filet Mignon", or "Chicken Breast" are priced by the pound, weighed by the chef after shopping. Do NOT price them, do NOT set an upcharge, and do NOT write a reviewReason about their weight. If the customer mentions an intended amount (e.g. "1 lb chicken", "ribeye about half a pound", "a 12 oz NY strip"), put that amount in the item's "note" field as a reminder (e.g. note "about 1 lb"). Always leave "weight" null.
- Order-level "notes" is only for things that don't attach to a single item (delivery time, general messages).
- CARROTS: if someone says "carrots" without qualification, match it to the sous vide bag item (category "bag", name "Carrots", variant "2 servings"). Only match to "Pickled Onions or Carrots" if they specifically say "pickled carrots".
- reviewReasons: ONLY use this for genuine ambiguity the app cannot detect on its own \u2014 an unclear quantity, an item you couldn't confidently match, or a confusing request. Do NOT add reviewReasons for unpriced upcharges or for protein weights; those are handled automatically. If everything is clear, return an empty reviewReasons array.

Respond with ONLY a JSON object, no markdown fences, no explanation. Shape:
{"items":[{"category":"...","name":"...","variant":"...","qty":1,"note":"","upcharge":null,"weight":null}],"jarSwaps":0,"containerReturns":0,"notes":"","reviewReasons":[]}`;
    const content = imageBase64 ? [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
      { type: "text", text: prompt }
    ] : prompt;
    let response;
    try {
      response = await fetch("https://ltb-proxy.strickland-kevinj.workers.dev/parse-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2e3,
          messages: [{ role: "user", content }]
        })
      });
    } catch (e) {
      throw new Error(`[network layer] ${e && e.message ? e.message : "request failed"}`);
    }
    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      throw new Error(`Non-JSON response (HTTP ${response.status}): ${raw.slice(0, 180)}`);
    }
    if (data.error) {
      const errType = data.error.type || "";
      const detail = typeof data.error === "string" ? data.error : data.error.message || JSON.stringify(data.error);
      if (response.status === 402 || errType === "credit_balance_too_low") {
        throw new Error("OUT_OF_CREDITS");
      }
      throw new Error(`HTTP ${response.status} \u2014 ${String(detail).slice(0, 120)} \u2014 raw: ${raw.slice(0, 180)}`);
    }
    if (!response.ok) {
      throw new Error(`API ${response.status}: ${raw.slice(0, 180)}`);
    }
    const text = (data.content || []).map((b) => b.type === "text" ? b.text : "").join("");
    if (!text.trim()) {
      throw new Error(`Empty response from parser \u2014 HTTP ${response.status}, raw: ${raw.slice(0, 120)}`);
    }
    const clean = text.replace(/```json|```/g, "").trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);
    return validateParsedOrder(parsed, menu);
  }
  function validateParsedOrder(parsed, menu) {
    const items = [];
    const misses = [];
    (parsed.items || []).forEach((pi) => {
      let matched = null;
      const cats = pi.category && menu[pi.category] ? [pi.category] : Object.keys(menu);
      for (const cat of cats) {
        const menuItem = menu[cat].find((m) => m.name.toLowerCase() === String(pi.name || "").toLowerCase());
        if (menuItem) {
          const variant = menuItem.variants.find((v) => v.label.toLowerCase() === String(pi.variant || "").toLowerCase()) || (menuItem.variants.length === 1 ? menuItem.variants[0] : null);
          if (variant) {
            let upcharge = null;
            if (!isPerLbItem(menuItem.name) && pi.upcharge && (pi.upcharge.label || pi.upcharge.amount != null)) {
              upcharge = {
                label: String(pi.upcharge.label || "Upcharge").slice(0, 40),
                amount: typeof pi.upcharge.amount === "number" ? pi.upcharge.amount : 0
              };
            }
            matched = {
              category: cat,
              name: menuItem.name,
              variant: variant.label,
              price: variant.price,
              cost: variant.cost,
              qty: Math.max(1, parseInt(pi.qty) || 1),
              note: pi.note ? String(pi.note).slice(0, 200) : "",
              upcharge
            };
            if (isPerLbItem(menuItem.name)) {
              matched.weightPending = true;
              matched.price = 0;
              matched.cost = 0;
              matched.weight = void 0;
            }
            break;
          }
        }
      }
      if (matched) {
        const dup = items.find((i) => i.category === matched.category && i.name === matched.name && i.variant === matched.variant && !i.note && !i.upcharge && !matched.note && !matched.upcharge);
        if (dup) dup.qty += matched.qty;
        else items.push(matched);
      } else misses.push(`${pi.qty || 1}x ${pi.name || "?"} ${pi.variant ? `(${pi.variant})` : ""}`.trim());
    });
    let notes = String(parsed.notes || "").trim();
    const overlapRe = /\b(upcharge|price|weigh|weight|pound|per lb|per-lb|couldn'?t match|could not match|not on the menu|off[- ]menu)\b/i;
    const reviewReasons = (Array.isArray(parsed.reviewReasons) ? parsed.reviewReasons : []).map((r) => String(r).trim()).filter(Boolean).filter((r) => !overlapRe.test(r));
    if (misses.length > 0) {
      reviewReasons.push(`Couldn't match to this week's menu: ${misses.join(", ")}`);
      notes = [notes, `Could not auto-match: ${misses.join(", ")} \u2014 review!`].filter(Boolean).join("\n");
    }
    items.forEach((it) => {
      if (it.upcharge && !it.upcharge.amount) {
        reviewReasons.push(`Set a price for "${it.upcharge.label}" on ${it.name}`);
      }
    });
    const seen = /* @__PURE__ */ new Set();
    const dedupedReasons = reviewReasons.filter((r) => {
      const k = r.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return {
      items,
      jarSwaps: Math.max(0, parseInt(parsed.jarSwaps) || 0),
      containerReturns: Math.max(0, parseInt(parsed.containerReturns) || 0),
      notes,
      reviewReasons: dedupedReasons
    };
  }
  async function parseAmendment(order, messageText, menu) {
    const currentLines = (order.items || []).map((it) => {
      const bits = [`${it.qty}x ${it.name} (${it.variant})`];
      if (it.note) bits.push(`note: ${it.note}`);
      if (it.upcharge && it.upcharge.label) bits.push(`upcharge: ${it.upcharge.label}${it.upcharge.amount ? ` $${it.upcharge.amount}` : " (unpriced)"}`);
      return "  - " + bits.join(", ");
    }).join("\n");
    const currentExtras = [];
    if (order.jarSwaps > 0) currentExtras.push(`jarSwaps: ${order.jarSwaps}`);
    if (order.containerReturns > 0) currentExtras.push(`containerReturns: ${order.containerReturns}`);
    if (order.notes) currentExtras.push(`order notes: ${order.notes}`);
    const prompt = `You are an order parser for a small meal prep business. An EXISTING order needs to be amended based on a new follow-up message from the customer.

THE CURRENT ORDER (for ${order.customer}):
${currentLines || "  (no items)"}
${currentExtras.length ? currentExtras.join("\n") : ""}

THE FOLLOW-UP MESSAGE:
"""
${messageText}
"""

Here is the complete CURRENT menu. Each line is one orderable option:
${menuForPrompt(menu)}

Apply the customer's requested changes to the current order and return the COMPLETE updated order (not just the changes). Keep every existing item that wasn't changed, exactly as it was (same variant, note, upcharge). Apply additions, removals, quantity changes, and variant changes as requested. Follow these rules:
- Use EXACT category, name, and variant strings from the menu.
- Keep existing per-item notes and upcharges unless the customer's message changes them.
- ADD-ONS: if the customer asks for an add-on that EXISTS as a variant of an item, switch to that variant. Do not create an upcharge for it.
- OFF-MENU EXTRAS: only if they ask to add something that is NOT an available variant, set that item's "upcharge" to {"label":"...","amount":null}. Do not also add a reviewReason for it.
- PER-LB PROTEINS (Ribeye, NY Strip, Filet Mignon, Chicken Breast): never price or weight them; put any stated amount in the item "note". Leave weight null.
- reviewReasons: ONLY for genuine ambiguity you cannot resolve (an unclear request, an item you couldn't match). Do not flag upcharges or weights.

Respond with ONLY a JSON object, no markdown fences, no explanation. Shape:
{"items":[{"category":"...","name":"...","variant":"...","qty":1,"note":"","upcharge":null,"weight":null}],"jarSwaps":0,"containerReturns":0,"notes":"","reviewReasons":[]}`;
    let response;
    try {
      response = await fetch("https://ltb-proxy.strickland-kevinj.workers.dev/parse-amendment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2e3,
          messages: [{ role: "user", content: prompt }]
        })
      });
    } catch (e) {
      throw new Error(`[network layer] ${e && e.message ? e.message : "request failed"}`);
    }
    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      throw new Error(`Non-JSON response (HTTP ${response.status}): ${raw.slice(0, 180)}`);
    }
    if (data.error) {
      const errType = data.error.type || "";
      const detail = typeof data.error === "string" ? data.error : data.error.message || JSON.stringify(data.error);
      if (response.status === 402 || errType === "credit_balance_too_low") {
        throw new Error("OUT_OF_CREDITS");
      }
      throw new Error(`HTTP ${response.status} \u2014 ${String(detail).slice(0, 120)}`);
    }
    if (!response.ok) throw new Error(`API ${response.status}: ${raw.slice(0, 180)}`);
    const text = (data.content || []).map((b) => b.type === "text" ? b.text : "").join("");
    if (!text.trim()) throw new Error("Empty response from parser");
    const clean = text.replace(/```json|```/g, "").trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : clean);
    const validated = validateParsedOrder(parsed, menu);
    return {
      ...validated,
      id: order.id,
      customer: order.customer,
      status: order.status,
      paid: order.paid,
      archived: order.archived,
      createdAt: order.createdAt,
      discountType: order.discountType,
      discountValue: order.discountValue,
      customCharges: order.customCharges || [],
      _amended: true
    };
  }
  function parseFormRow(headerMap) {
    const items = [];
    const notes = [];
    const priceIndex = {};
    const addToIndex = (item) => {
      (item.variants || []).forEach((v) => {
        const key = Math.round(v.price * 100);
        if (!priceIndex[key]) priceIndex[key] = [];
        priceIndex[key].push({ name: item.name, label: v.label, price: v.price, cost: v.cost });
      });
    };
    ALL_DINNERS.forEach(addToIndex);
    Object.values(ALWAYS_MENU).flat().forEach(addToIndex);
    let customer = "";
    Object.entries(headerMap).forEach(([header, value]) => {
      const h = header.toLowerCase().trim();
      const v = String(value || "").trim();
      if (!v || v.toLowerCase() === "no thanks" || h.includes("timestamp")) return;
      if (h === "your name" || h.includes("your name")) {
        customer = v;
        return;
      }
      if (h.includes("notes") || h.includes("anything else") || h.includes("quantity") || h.includes("weight")) {
        if (v) notes.push(v);
        return;
      }
      const selections = v.includes(",") ? v.split(",").map((s) => s.trim()) : [v];
      selections.forEach((sel) => {
        if (!sel || sel.toLowerCase() === "no thanks") return;
        const priceMatch = sel.match(/[—–-]\s*\$(\d+(?:\.\d+)?)/);
        let matched = null;
        if (priceMatch) {
          const dollars = Math.round(parseFloat(priceMatch[1]) * 100);
          const candidates = priceIndex[dollars] || [];
          if (candidates.length === 1) {
            matched = candidates[0];
          } else if (candidates.length > 1) {
            const hNorm = h.replace(/[^a-z0-9]/g, "");
            matched = candidates.find((c) => {
              const cNorm = c.name.toLowerCase().replace(/[^a-z0-9]/g, "");
              return cNorm.includes(hNorm.slice(0, 8)) || hNorm.includes(cNorm.slice(0, 8));
            }) || candidates[0];
          }
        }
        if (!matched) {
          const selNorm = sel.toLowerCase().replace(/[^a-z0-9]/g, "");
          let bestScore = 0;
          [...ALL_DINNERS, ...Object.values(ALWAYS_MENU).flat()].forEach((item) => {
            (item.variants || []).forEach((variant) => {
              const combined = (item.name + " " + variant.label).toLowerCase().replace(/[^a-z0-9]/g, "");
              let score = 0;
              for (let i = 0; i < Math.min(selNorm.length, combined.length); i++) {
                if (selNorm[i] === combined[i]) score++;
              }
              if (score > bestScore) {
                bestScore = score;
                matched = { name: item.name, label: variant.label, price: variant.price, cost: variant.cost };
              }
            });
          });
        }
        if (matched) {
          items.push({
            name: matched.name,
            variant: matched.label,
            qty: 1,
            price: matched.price,
            cost: matched.cost || 0,
            note: "",
            hasPhoto: false
          });
        } else {
          notes.push("Unmatched item: " + sel);
        }
      });
    });
    return { customer: customer || "Unknown", items, notes: notes.join(" | ") };
  }
  async function parseFormNotes(notes) {
    const prompt = 'You are a helper for a small meal prep chef reviewing customer order notes. The customer placed their order via a structured form (dropdowns), so the main items are already captured. These are their free-text notes: """' + notes + '""" Interpret these notes and return a JSON object with: "spice": any spice level request or null, "substitutions": any substitution requests as a string or null, "extras": any extra items or add-ons mentioned that were not in the form or null, "delivery": any delivery instructions or timing notes or null, "other": anything else worth flagging for the chef or null, "summary": a single short sentence summarizing what action the chef needs to take, or null if notes are routine. Return ONLY valid JSON, no markdown fences, no explanation.';
    try {
      const res = await fetch("https://ltb-proxy.strickland-kevinj.workers.dev/parse-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 500, messages: [{ role: "user", content: prompt }] })
      });
      const raw = await res.text();
      const data = JSON.parse(raw);
      const text = (data.content || []).map((b) => b.type === "text" ? b.text : "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : clean);
    } catch {
      return null;
    }
  }
  function parseDelimited(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    const delim = text.includes("	") ? "	" : ",";
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else inQuotes = false;
        } else field += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === delim) {
          row.push(field);
          field = "";
        } else if (ch === "\n") {
          row.push(field);
          rows.push(row);
          row = [];
          field = "";
        } else if (ch === "\r") {
        } else field += ch;
      }
    }
    if (field.length > 0 || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows.filter((r) => r.some((c) => c.trim()));
  }
  function rowToOrderText(headerMap) {
    const parts = [];
    let customer = "";
    Object.entries(headerMap).forEach(([header, value]) => {
      const h = header.toLowerCase().trim();
      const v = String(value || "").trim();
      if (!v || v.toLowerCase() === "none") return;
      if (h.includes("timestamp")) return;
      if ((h === "name" || h.includes("your name")) && !customer) {
        customer = v;
        return;
      }
      parts.push(`${header}: ${v}`);
    });
    return { customer, text: parts.join("\n") };
  }

  // src/styles.js
  var TEAL_DARK = "#1a3a3a";
  var TEAL_MID = "#2E6B6B";
  var TEAL_LIGHT = "#5DCAA5";
  var GOLD = "#C49A3C";
  var CREAM = "#F5F0E8";
  var DARK = "#1a1a1a";
  var CARD = "#222826";
  var styles = {
    page: {
      minHeight: "100vh",
      background: DARK,
      color: CREAM,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: "40px"
    },
    loadingText: {
      padding: "40px 20px",
      textAlign: "center",
      color: "#9aa5a0"
    },
    header: {
      background: TEAL_DARK,
      borderBottom: `2px solid ${GOLD}`,
      padding: "16px 16px 0",
      position: "sticky",
      top: 0,
      zIndex: 10
    },
    headerTop: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "14px"
    },
    headerCenter: {
      flex: 1
    },
    headerActions: {
      display: "flex",
      gap: "6px",
      alignItems: "center",
      flexShrink: 0
    },
    headerActionBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "34px",
      height: "34px",
      background: "transparent",
      border: "1px solid #37403c",
      borderRadius: "8px",
      color: "#9aa5a0",
      cursor: "pointer",
      flexShrink: 0
    },
    exportMsg: {
      fontSize: "12px",
      color: TEAL_LIGHT,
      background: "#0f2e2a",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "6px",
      padding: "7px 12px",
      margin: "0 16px 8px",
      textAlign: "center"
    },
    importModalCard: {
      width: "100%",
      maxWidth: "420px",
      background: CARD,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "14px",
      padding: "18px",
      boxSizing: "border-box"
    },
    importModalHint: {
      fontSize: "13px",
      color: "#9aa5a0",
      marginBottom: "10px",
      lineHeight: 1.4
    },
    logoMark: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      background: "#085041",
      border: `1.5px solid ${TEAL_LIGHT}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "13px",
      fontWeight: 700,
      color: TEAL_LIGHT,
      flexShrink: 0
    },
    title: {
      fontSize: "17px",
      fontWeight: 700,
      color: "#fff"
    },
    subtitle: {
      fontSize: "12px",
      color: TEAL_LIGHT
    },
    tabs: {
      display: "flex",
      gap: "2px"
    },
    tab: {
      flex: 1,
      background: "transparent",
      border: "none",
      color: "#9aa5a0",
      fontSize: "13px",
      fontWeight: 600,
      padding: "10px 4px",
      borderBottom: "2px solid transparent",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "5px"
    },
    tabActive: {
      color: TEAL_LIGHT,
      borderBottom: `2px solid ${TEAL_LIGHT}`
    },
    tabBadge: {
      background: TEAL_LIGHT,
      color: "#04342C",
      borderRadius: "10px",
      fontSize: "11px",
      fontWeight: 700,
      padding: "1px 7px"
    },
    errorBanner: {
      display: "block",
      width: "100%",
      background: "#501313",
      color: "#F7C1C1",
      padding: "10px 16px",
      fontSize: "13px",
      textAlign: "center",
      border: "none",
      borderBottom: "1px solid #6b1a1a",
      cursor: "pointer"
    },
    errorRetry: {
      display: "block",
      fontSize: "11px",
      color: "#F7C1C1",
      opacity: 0.7,
      marginTop: "3px",
      textDecoration: "underline"
    },
    main: {
      padding: "16px",
      maxWidth: "560px",
      margin: "0 auto"
    },
    statsBar: {
      display: "flex",
      gap: "8px",
      marginBottom: "14px"
    },
    statTile: {
      flex: 1,
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "10px",
      padding: "10px 8px",
      textAlign: "center"
    },
    statValue: {
      fontSize: "16px",
      fontWeight: 700,
      color: TEAL_LIGHT
    },
    statLabel: {
      fontSize: "11px",
      color: "#9aa5a0",
      marginTop: "2px"
    },
    topActions: {
      display: "flex",
      gap: "8px",
      marginBottom: "16px",
      flexWrap: "wrap"
    },
    newOrderBtn: {
      flex: 1.4,
      background: "#085041",
      color: TEAL_LIGHT,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "10px",
      padding: "14px",
      fontSize: "15px",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      cursor: "pointer"
    },
    pasteBtn: {
      flex: 1,
      background: "transparent",
      color: "#B5A2E8",
      border: "1px solid #7F77DD",
      borderRadius: "10px",
      padding: "14px",
      fontSize: "14px",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      cursor: "pointer"
    },
    // Disabled-button look for the dormant AI text features (GitHub build).
    disabledBtn: {
      opacity: 0.4,
      cursor: "not-allowed",
      filter: "grayscale(100%)"
    },
    // ── Pending form orders styles ────────────────────────────────────────────
    pendingSection: {
      marginBottom: "12px",
      borderRadius: "12px",
      border: "2px solid #c9a84c",
      overflow: "hidden"
    },
    pendingSectionHeader: {
      background: "#2a3a2a",
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    pendingSectionTitle: {
      color: "#c9a84c",
      fontWeight: 700,
      fontSize: "13px",
      letterSpacing: "0.5px",
      textTransform: "uppercase"
    },
    pendingBadge: {
      background: "#c9a84c",
      color: "#1a3a3a",
      borderRadius: "10px",
      padding: "1px 7px",
      fontSize: "12px",
      fontWeight: 800
    },
    pendingRow: {
      width: "100%",
      background: "#1e2e1e",
      border: "none",
      borderTop: "1px solid #2d4a2d",
      padding: "12px 14px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      cursor: "pointer",
      color: "#d4c9a8",
      textAlign: "left"
    },
    pendingRowName: {
      flex: 1,
      fontWeight: 600,
      fontSize: "14px"
    },
    pendingRowCount: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    pendingCard: {
      background: "#1e2e1e",
      borderTop: "1px solid #2d4a2d",
      padding: "14px"
    },
    pendingCardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: "10px"
    },
    pendingContactRow: {
      display: "flex",
      flexDirection: "column",
      gap: "2px",
      marginTop: "5px"
    },
    pendingContact: {
      fontSize: "12px",
      color: "#9aa5a0",
      lineHeight: 1.4
    },
    orderContactBlock: {
      background: "#1a1a1a",
      border: "1px solid #2d3a36",
      borderRadius: "8px",
      padding: "9px 12px",
      marginBottom: "10px",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      cursor: "pointer"
    },
    orderContactRow: {
      fontSize: "13px",
      color: "#9aa5a0",
      lineHeight: 1.4
    },
    contactBtnRow: {
      display: "flex",
      gap: "6px",
      marginTop: "6px"
    },
    contactActionBtn: {
      fontSize: "11px",
      fontWeight: 600,
      color: TEAL_LIGHT,
      background: "rgba(63,184,160,0.1)",
      border: "1px solid rgba(63,184,160,0.3)",
      borderRadius: "6px",
      padding: "4px 10px",
      cursor: "pointer"
    },
    weekNotesBlock: {
      background: "#1f2624",
      border: "1px solid #2d6a6a",
      borderRadius: "12px",
      padding: "14px",
      marginBottom: "14px"
    },
    weekNotesTitle: {
      fontSize: "11px",
      fontWeight: 700,
      color: GOLD,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "8px"
    },
    weekNotesBody: {
      fontSize: "13px",
      color: "#cfd6d2",
      lineHeight: 1.5,
      cursor: "pointer"
    },
    pendingCardName: {
      fontWeight: 700,
      fontSize: "15px",
      color: "#e8dfc0"
    },
    pendingCardTime: {
      fontSize: "11px",
      color: "#9aa5a0"
    },
    pendingItemList: {
      marginBottom: "12px"
    },
    pendingItem: {
      padding: "4px 0",
      borderBottom: "1px solid #2d4a2d",
      fontSize: "13px"
    },
    pendingItemName: {
      color: "#d4c9a8",
      fontWeight: 600
    },
    pendingItemVariant: {
      color: "#9aa5a0"
    },
    pendingItemPrice: {
      color: "#c9a84c",
      float: "right"
    },
    pendingNotes: {
      marginTop: "8px",
      fontSize: "12px",
      color: "#9aa5a0",
      fontStyle: "italic"
    },
    pendingActions: {
      display: "flex",
      gap: "8px"
    },
    pendingAcceptBtn: {
      flex: 1,
      background: "#1D9E75",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "13px",
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px"
    },
    pendingRejectBtn: {
      flex: 1,
      background: "#8B2020",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "13px",
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px"
    },
    pendingBackBtn: {
      background: "transparent",
      color: "#9aa5a0",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 14px",
      fontSize: "13px",
      cursor: "pointer"
    },
    pendingNotesSection: {
      marginBottom: "10px"
    },
    parsedNotesCard: {
      background: "#1a2e1a",
      border: "1px solid #3a6a3a",
      borderRadius: "8px",
      padding: "10px",
      marginTop: "6px"
    },
    parsedNotesTitle: {
      fontSize: "11px",
      fontWeight: 700,
      color: "#7abf7a",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "6px"
    },
    parsedNotesSummary: {
      fontSize: "13px",
      color: "#e8dfc0",
      fontWeight: 600,
      marginBottom: "6px"
    },
    parsedNotesItem: {
      fontSize: "12px",
      color: "#9aa5a0",
      marginBottom: "3px"
    },
    parsedNotesKey: {
      color: "#c9a84c",
      fontWeight: 600,
      textTransform: "capitalize"
    },
    parseNotesBtn: {
      marginTop: "6px",
      background: "#1a2e1a",
      color: "#7abf7a",
      border: "1px solid #3a6a3a",
      borderRadius: "8px",
      padding: "8px 12px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer",
      width: "100%"
    },
    // ── Regulars: list, form, profile ──────────────────────────────────────────
    addRegularBtn: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      background: "#c9a84c",
      color: "#1a3a3a",
      border: "none",
      borderRadius: "10px",
      padding: "13px",
      fontSize: "14px",
      fontWeight: 700,
      cursor: "pointer",
      marginBottom: "12px"
    },
    regularsList: {
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    },
    regularRow: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#232a28",
      border: "1px solid #2d3a36",
      borderRadius: "10px",
      padding: "14px",
      cursor: "pointer",
      color: "#e8e2d4",
      textAlign: "left"
    },
    regularRowLeft: { flex: 1 },
    regularRowName: { fontSize: "15px", fontWeight: 700, color: "#f2f2f0" },
    regularRowMeta: { fontSize: "12px", color: "#9aa5a0", marginTop: "2px" },
    regularStar: { color: "#c9a84c" },
    regularFormCard: {
      background: "#232a28",
      border: "1px solid #2d3a36",
      borderRadius: "12px",
      padding: "14px"
    },
    regularFormHint: {
      fontSize: "11px",
      color: "#9aa5a0",
      fontStyle: "italic",
      marginTop: "4px",
      marginBottom: "4px"
    },
    nameRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "8px"
    },
    nameRemoveBtn: {
      width: "34px",
      height: "34px",
      flexShrink: 0,
      borderRadius: "8px",
      border: "1px solid #5a2a3a",
      background: "transparent",
      color: "#C0517A",
      fontSize: "20px",
      fontWeight: 700,
      cursor: "pointer",
      lineHeight: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    addNameBtn: {
      background: "transparent",
      color: "#7abf7a",
      border: "1px dashed #3a6a3a",
      borderRadius: "8px",
      padding: "8px 12px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer",
      marginBottom: "4px"
    },
    regularFormActions: {
      display: "flex",
      gap: "8px",
      marginTop: "14px"
    },
    profileBackBtn: {
      background: "transparent",
      color: "#7abf7a",
      border: "none",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      padding: "4px 0",
      marginBottom: "8px"
    },
    profileHeader: {
      background: "linear-gradient(135deg, #1a3a3a, #232a28)",
      border: "1px solid #2d6a6a",
      borderRadius: "12px",
      padding: "16px",
      marginBottom: "12px"
    },
    profileName: {
      fontSize: "20px",
      fontWeight: 800,
      color: "#f2f2f0",
      marginBottom: "12px"
    },
    profileSummaryGrid: {
      display: "flex",
      justifyContent: "space-between",
      gap: "8px"
    },
    profileStat: {
      flex: 1,
      textAlign: "center",
      background: "#1a1a1a55",
      borderRadius: "8px",
      padding: "8px 4px"
    },
    profileStatNum: { fontSize: "15px", fontWeight: 700, color: "#c9a84c" },
    profileStatLabel: { fontSize: "10px", color: "#9aa5a0", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "2px" },
    profileDiscountBadge: {
      marginTop: "10px",
      display: "inline-block",
      background: "#c9a84c22",
      color: "#c9a84c",
      border: "1px solid #c9a84c55",
      borderRadius: "6px",
      padding: "4px 10px",
      fontSize: "12px",
      fontWeight: 600
    },
    profileSection: {
      background: "#232a28",
      border: "1px solid #2d3a36",
      borderRadius: "12px",
      padding: "14px",
      marginBottom: "10px"
    },
    profileSectionTitle: {
      fontSize: "12px",
      fontWeight: 700,
      color: "#c9a84c",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "8px"
    },
    profileField: { fontSize: "13px", color: "#d8d2c4", marginBottom: "4px", lineHeight: 1.4 },
    profileFieldKey: { color: "#9aa5a0", fontWeight: 600 },
    profileFieldEmpty: { fontSize: "13px", color: "#6a726c", fontStyle: "italic" },
    profileEditBtn: {
      marginTop: "8px",
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      background: "transparent",
      color: "#7abf7a",
      border: "1px solid #37403c",
      borderRadius: "7px",
      padding: "6px 10px",
      fontSize: "12px",
      cursor: "pointer"
    },
    profileNotes: {
      fontSize: "13px",
      color: "#d8d2c4",
      lineHeight: 1.5,
      whiteSpace: "pre-wrap"
    },
    profileNoteLine: { marginBottom: "3px" },
    profileInsightLine: {
      marginBottom: "4px",
      color: "#7abf7a",
      fontSize: "12px",
      fontStyle: "italic",
      background: "#1a2e1a",
      borderRadius: "5px",
      padding: "4px 7px"
    },
    profileHistoryList: { display: "flex", flexDirection: "column", gap: "6px" },
    profileHistoryRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      borderBottom: "1px solid #2d3a36",
      paddingBottom: "6px"
    },
    profileHistoryLeft: { flex: 1, paddingRight: "8px" },
    profileHistoryDate: { fontSize: "12px", fontWeight: 600, color: "#d8d2c4" },
    profileHistoryItems: { fontSize: "11px", color: "#9aa5a0", marginTop: "2px", lineHeight: 1.3 },
    profileHistoryRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" },
    profileHistoryTotal: { fontSize: "13px", fontWeight: 700, color: "#c9a84c" },
    profileUnlinkBtn: {
      background: "transparent",
      color: "#8a928c",
      border: "none",
      fontSize: "11px",
      cursor: "pointer",
      textDecoration: "underline",
      padding: 0
    },
    profileLinkBtn: {
      marginTop: "10px",
      width: "100%",
      background: "#1f2937",
      color: "#93b4d4",
      border: "1px solid #3d5a7a",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer"
    },
    linkBrowser: { marginTop: "10px" },
    linkBrowserList: { marginTop: "8px", display: "flex", flexDirection: "column", gap: "5px", maxHeight: "300px", overflowY: "auto" },
    linkBrowserRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "#1a1a1a",
      border: "1px solid #2d3a36",
      borderRadius: "7px",
      padding: "9px 11px",
      cursor: "pointer",
      textAlign: "left"
    },
    linkBrowserRowLeft: { display: "flex", flexDirection: "column", flex: 1 },
    linkBrowserName: { fontSize: "13px", fontWeight: 600, color: "#e8e2d4" },
    linkBrowserItems: { fontSize: "10px", color: "#8a928c", marginTop: "1px" },
    linkBrowserMeta: { fontSize: "10px", color: "#9aa5a0", textAlign: "right" },
    profileDeleteBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      background: "transparent",
      color: "#C0517A",
      border: "1px solid #5a2a3a",
      borderRadius: "7px",
      padding: "8px 12px",
      fontSize: "12px",
      cursor: "pointer"
    },
    profileDeleteConfirm: {
      fontSize: "13px",
      color: "#d8d2c4",
      lineHeight: 1.4
    },
    confirmDeleteRed: {
      flex: 1,
      background: "#8B2020",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "13px",
      fontWeight: 700,
      cursor: "pointer"
    },
    orderRegularStar: { color: "#c9a84c", fontSize: "15px" },
    // ── Regular discount toggle on order card ──────────────────────────────────
    regularDiscountToggle: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#1a2e1a",
      border: "1px solid #3a6a3a",
      borderRadius: "9px",
      padding: "10px 12px",
      cursor: "pointer",
      marginBottom: "10px"
    },
    regularDiscountLabel: { fontSize: "13px", fontWeight: 600, color: "#c9a84c" },
    toggleSwitch: {
      width: "40px",
      height: "22px",
      borderRadius: "11px",
      background: "#37403c",
      position: "relative",
      transition: "background 0.15s",
      flexShrink: 0
    },
    toggleSwitchOn: { background: "#1D9E75" },
    toggleKnob: {
      position: "absolute",
      top: "2px",
      left: "2px",
      width: "18px",
      height: "18px",
      borderRadius: "9px",
      background: "#fff",
      transition: "left 0.15s"
    },
    toggleKnobOn: { left: "20px" },
    // ── Link regular prompt modal ──────────────────────────────────────────────
    linkPromptCard: {
      background: "#232a28",
      border: "1px solid #2d6a6a",
      borderRadius: "14px",
      padding: "20px",
      maxWidth: "340px",
      width: "90%",
      margin: "auto"
    },
    linkPromptTitle: { fontSize: "16px", fontWeight: 700, color: "#c9a84c", marginBottom: "8px" },
    linkPromptBody: { fontSize: "13px", color: "#d8d2c4", lineHeight: 1.4, marginBottom: "14px" },
    linkPromptList: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" },
    linkPromptCandidate: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      background: "#1a3a3a",
      border: "1px solid #2d6a6a",
      borderRadius: "9px",
      padding: "11px 13px",
      cursor: "pointer"
    },
    linkPromptCandidateName: { fontSize: "14px", fontWeight: 700, color: "#f2f2f0" },
    linkPromptCandidateMeta: { fontSize: "11px", color: "#c9a84c", marginTop: "2px" },
    linkPromptSkip: {
      width: "100%",
      background: "transparent",
      color: "#9aa5a0",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "13px",
      cursor: "pointer"
    },
    // ── Inventory tracker (Shop tab) ───────────────────────────────────────────
    publishOk: {
      marginTop: "8px",
      fontSize: "12px",
      color: "#7abf7a",
      background: "#1a2e1a",
      border: "1px solid #3a6a3a",
      borderRadius: "8px",
      padding: "8px 10px",
      lineHeight: 1.4
    },
    publishErr: {
      marginTop: "8px",
      fontSize: "12px",
      color: "#e0828a",
      background: "#3a1a1f",
      border: "1px solid #5a2a3a",
      borderRadius: "8px",
      padding: "8px 10px",
      lineHeight: 1.4
    },
    collapsibleHeader: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: 0,
      textAlign: "left"
    },
    collapseChevron: {
      fontSize: "11px",
      color: "#9aa5a0",
      flexShrink: 0,
      marginLeft: "8px"
    },
    inventorySection: {
      background: "#232a28",
      border: "1px solid #2d6a6a",
      borderRadius: "12px",
      padding: "14px",
      marginBottom: "14px"
    },
    inventoryTitle: {
      fontSize: "14px",
      fontWeight: 700,
      color: "#fff",
      marginBottom: "4px"
    },
    inventoryHint: {
      fontSize: "11px",
      color: "#9aa5a0",
      fontStyle: "italic",
      marginBottom: "12px",
      lineHeight: 1.4
    },
    inventoryGroup: { marginBottom: "14px" },
    inventoryGroupLabel: {
      fontSize: "11px",
      fontWeight: 700,
      color: "#8a928c",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "6px"
    },
    inventoryRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 0",
      borderBottom: "1px solid #2d3a36"
    },
    inventoryName: { fontSize: "13px", color: "#e8e2d4", flex: 1 },
    inventoryControls: { display: "flex", alignItems: "center", gap: "10px" },
    inventoryBtn: {
      width: "30px",
      height: "30px",
      borderRadius: "8px",
      border: "1px solid #37403c",
      background: "#1a1a1a",
      color: "#e8e2d4",
      fontSize: "18px",
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1
    },
    inventoryCount: {
      minWidth: "34px",
      textAlign: "center",
      fontSize: "16px",
      fontWeight: 700,
      color: "#f2f2f0"
    },
    inventoryCountYellow: { color: "#EF9F27" },
    inventoryCountRed: { color: "#E8799A" },
    // Strikethrough applied to the button label text only (keeps the icon intact).
    struckText: {
      textDecoration: "line-through",
      textDecorationThickness: "2px"
    },
    pasteHint: {
      fontSize: "12px",
      color: "#9aa5a0",
      lineHeight: 1.5,
      marginBottom: "8px"
    },
    attachRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginTop: "8px",
      flexWrap: "wrap"
    },
    attachBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "12px",
      fontWeight: 600,
      color: "#B5A2E8",
      background: "transparent",
      border: "1px solid #7F77DD",
      borderRadius: "8px",
      padding: "8px 12px",
      cursor: "pointer"
    },
    attachChip: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "4px 4px 4px 10px"
    },
    attachName: {
      fontSize: "12px",
      color: CREAM,
      maxWidth: "140px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    shopBulkRow: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginTop: "12px",
      flexWrap: "wrap"
    },
    parseError: {
      fontSize: "12px",
      color: "#F7C1C1",
      background: "#501313",
      borderRadius: "6px",
      padding: "8px 10px",
      marginTop: "8px"
    },
    emptyState: {
      textAlign: "center",
      padding: "48px 20px",
      color: "#9aa5a0"
    },
    emptyTitle: {
      fontSize: "16px",
      fontWeight: 600,
      color: CREAM,
      marginBottom: "6px"
    },
    emptyBody: {
      fontSize: "13px",
      lineHeight: 1.5
    },
    orderList: {
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    },
    orderCard: {
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "10px",
      overflow: "hidden"
    },
    orderCardHeader: {
      width: "100%",
      padding: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      cursor: "pointer",
      color: CREAM,
      textAlign: "left"
    },
    orderCardLeft: {
      display: "flex",
      flexDirection: "column",
      gap: "3px",
      minWidth: 0
    },
    orderCustomer: {
      fontSize: "15px",
      fontWeight: 600
    },
    orderMeta: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    orderCardRight: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flexShrink: 0
    },
    paidPill: {
      fontSize: "11px",
      fontWeight: 700,
      padding: "4px 10px",
      borderRadius: "12px",
      cursor: "pointer",
      border: "none"
    },
    statusPill: {
      fontSize: "11px",
      fontWeight: 700,
      padding: "4px 10px",
      borderRadius: "12px",
      cursor: "pointer",
      border: "none"
    },
    orderCardBody: {
      padding: "0 14px 14px",
      borderTop: "1px solid #37403c"
    },
    orderItemsList: {
      padding: "12px 0 4px",
      display: "flex",
      flexDirection: "column",
      gap: "6px"
    },
    orderItemLine: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "13px",
      color: CREAM,
      gap: "10px"
    },
    orderItemVariant: {
      color: "#9aa5a0",
      fontSize: "12px"
    },
    loopSummary: {
      display: "flex",
      flexDirection: "column",
      gap: "2px",
      fontSize: "12px",
      color: TEAL_LIGHT,
      padding: "8px 0",
      borderTop: "1px dashed #37403c",
      marginTop: "4px"
    },
    notesBlock: {
      borderTop: "1px dashed #37403c",
      marginTop: "4px",
      paddingTop: "8px"
    },
    orderNotes: {
      fontSize: "12px",
      color: "#cccccc",
      fontStyle: "italic",
      cursor: "pointer",
      lineHeight: 1.5
    },
    notesEditHint: {
      color: "#7a8480",
      fontSize: "11px"
    },
    addNoteBtn: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      fontSize: "12px",
      fontWeight: 600,
      color: "#9aa5a0",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "2px 0"
    },
    notesEditActions: {
      display: "flex",
      gap: "8px",
      marginTop: "6px"
    },
    orderCardFooter: {
      marginTop: "10px"
    },
    statusRow: {
      display: "flex",
      gap: "6px",
      flexWrap: "wrap",
      marginBottom: "10px"
    },
    statusOption: {
      flex: "1 1 auto",
      fontSize: "12px",
      fontWeight: 600,
      padding: "7px 10px",
      borderRadius: "8px",
      border: "1px solid #37403c",
      background: "transparent",
      color: "#9aa5a0",
      cursor: "pointer"
    },
    actionRow: {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      flexWrap: "wrap"
    },
    actionBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "12px",
      fontWeight: 600,
      color: TEAL_LIGHT,
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "4px 0"
    },
    confirmRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "12px"
    },
    confirmText: {
      color: "#cccccc",
      fontSize: "12px"
    },
    confirmYes: {
      background: "#993556",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      padding: "5px 10px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer"
    },
    confirmYesGreen: {
      background: "#1D9E75",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      padding: "5px 10px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer"
    },
    confirmNo: {
      background: "transparent",
      color: "#9aa5a0",
      border: "1px solid #37403c",
      borderRadius: "6px",
      padding: "5px 10px",
      fontSize: "12px",
      cursor: "pointer"
    },
    deliveredSection: {
      marginTop: "20px"
    },
    deliveredSummary: {
      fontSize: "13px",
      fontWeight: 600,
      color: "#9aa5a0",
      cursor: "pointer",
      padding: "8px 0"
    },
    clearDeliveredBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "12px",
      fontWeight: 600,
      color: "#9aa5a0",
      background: "transparent",
      border: "1px dashed #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      cursor: "pointer",
      marginTop: "10px",
      width: "100%",
      justifyContent: "center"
    },
    clearConfirmRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      marginTop: "10px",
      flexWrap: "wrap"
    },
    // Form
    formCard: {
      background: CARD,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "10px",
      padding: "16px",
      marginBottom: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    },
    formHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "8px"
    },
    formTitle: {
      fontSize: "16px",
      fontWeight: 700,
      color: "#fff"
    },
    iconBtn: {
      background: "transparent",
      border: "none",
      color: "#9aa5a0",
      cursor: "pointer",
      padding: "4px"
    },
    label: {
      fontSize: "12px",
      fontWeight: 600,
      color: TEAL_LIGHT,
      marginTop: "10px",
      marginBottom: "4px"
    },
    input: {
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      fontSize: "14px",
      color: CREAM,
      outline: "none"
    },
    chipRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      marginTop: "6px"
    },
    chip: {
      fontSize: "12px",
      fontWeight: 600,
      color: TEAL_LIGHT,
      background: "#0f2e2a",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "14px",
      padding: "5px 12px",
      cursor: "pointer"
    },
    textarea: {
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      fontSize: "14px",
      color: CREAM,
      outline: "none",
      minHeight: "60px",
      resize: "vertical",
      fontFamily: "inherit"
    },
    selectedSummary: {
      fontSize: "12px",
      color: TEAL_LIGHT,
      fontWeight: 600,
      marginBottom: "4px"
    },
    qtyControl: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    qtyBtn: {
      width: "26px",
      height: "26px",
      borderRadius: "6px",
      border: "1px solid #37403c",
      background: "transparent",
      color: TEAL_LIGHT,
      fontSize: "16px",
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    qtyValue: {
      fontSize: "14px",
      fontWeight: 600,
      minWidth: "16px",
      textAlign: "center"
    },
    categoryGrid: {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      marginTop: "6px"
    },
    categoryBtn: {
      fontSize: "12px",
      fontWeight: 600,
      color: "#cccccc",
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "8px 10px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "4px"
    },
    categoryBtnActive: {
      color: TEAL_LIGHT,
      borderColor: TEAL_LIGHT,
      background: "#0f2e2a"
    },
    catCount: {
      background: GOLD,
      color: "#1a1a1a",
      borderRadius: "8px",
      fontSize: "10px",
      fontWeight: 700,
      padding: "1px 6px"
    },
    picker: {
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px",
      marginTop: "8px",
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    },
    pickerGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    },
    pickerGroupName: {
      fontSize: "12px",
      fontWeight: 700,
      color: "#fff"
    },
    pickerVariants: {
      display: "flex",
      flexDirection: "column",
      gap: "4px"
    },
    variantBtn: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "transparent",
      border: "1px solid #37403c",
      borderRadius: "6px",
      padding: "8px 10px",
      fontSize: "12px",
      color: CREAM,
      cursor: "pointer",
      textAlign: "left",
      minHeight: "38px"
    },
    variantBtnSelected: {
      borderColor: TEAL_LIGHT,
      background: "#0f2e2a"
    },
    variantLabel: {
      color: CREAM,
      flex: 1,
      paddingRight: "8px"
    },
    variantPrice: {
      color: GOLD,
      fontWeight: 700
    },
    reviewList: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      marginTop: "10px",
      paddingTop: "10px",
      borderTop: "1px dashed #37403c"
    },
    reviewRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px"
    },
    reviewText: {
      fontSize: "13px",
      color: CREAM,
      flex: 1
    },
    loopRow: {
      display: "flex",
      gap: "12px",
      marginTop: "4px"
    },
    loopField: {
      flex: 1,
      display: "flex",
      flexDirection: "column"
    },
    loopHint: {
      fontSize: "11px",
      color: "#9aa5a0",
      marginTop: "4px"
    },
    discountRow: {
      display: "flex",
      gap: "6px",
      alignItems: "stretch"
    },
    discountTypeBtn: {
      fontSize: "13px",
      fontWeight: 700,
      color: "#9aa5a0",
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "8px 14px",
      cursor: "pointer"
    },
    discountTypeBtnActive: {
      color: "#E8799A",
      borderColor: "#E8799A",
      background: "#2e1a22"
    },
    discountLine: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "13px",
      color: "#E8799A",
      fontWeight: 600,
      marginTop: "12px"
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "14px",
      fontWeight: 600,
      color: CREAM,
      marginTop: "8px",
      paddingTop: "10px",
      borderTop: `1px solid ${TEAL_MID}`
    },
    waiveSurchargeRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: "8px 0 2px",
      marginTop: "4px"
    },
    waiveSurchargeLabel: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "13px",
      color: "#9aa5a0"
    },
    waiveCheckbox: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "18px",
      height: "18px",
      borderRadius: "4px",
      border: "1px solid #4a5450",
      background: "#1a1a1a",
      color: "#0c1410",
      flexShrink: 0
    },
    waiveCheckboxOn: {
      background: TEAL_LIGHT,
      borderColor: TEAL_LIGHT
    },
    waiveSurchargeHint: {
      fontSize: "11px",
      color: "#7a8480",
      fontStyle: "italic"
    },
    negativeTotalNote: {
      fontSize: "12px",
      color: "#E8799A",
      background: "#2a1419",
      border: "1px solid #5a2433",
      borderRadius: "8px",
      padding: "8px 12px",
      marginTop: "8px",
      lineHeight: 1.4
    },
    totalValue: {
      fontSize: "18px",
      fontWeight: 700,
      color: GOLD
    },
    saveBtn: {
      marginTop: "12px",
      background: TEAL_LIGHT,
      color: "#04342C",
      border: "none",
      borderRadius: "8px",
      padding: "12px",
      fontSize: "14px",
      fontWeight: 700,
      cursor: "pointer"
    },
    saveBtnDisabled: {
      opacity: 0.4,
      cursor: "not-allowed"
    },
    // Cooking list
    cookSubToggle: {
      display: "flex",
      gap: "6px",
      marginBottom: "16px",
      background: "#1f2624",
      border: "1px solid #2d6a6a",
      borderRadius: "10px",
      padding: "4px"
    },
    cookSubBtn: {
      flex: 1,
      fontSize: "13px",
      fontWeight: 700,
      color: "#9aa5a0",
      background: "transparent",
      border: "none",
      borderRadius: "7px",
      padding: "9px",
      cursor: "pointer"
    },
    cookSubBtnActive: {
      background: TEAL_MID,
      color: "#fff"
    },
    deliverCustDone: {
      color: "#5a8f6a",
      textDecoration: "line-through"
    },
    // ── Dish Reference Card ───────────────────────────────────────────────────
    refCardPickerRow: {
      display: "flex",
      gap: "8px",
      alignItems: "center",
      marginBottom: "10px"
    },
    refCardSelect: {
      flex: 1,
      minWidth: 0,
      background: "#1f2624",
      border: "1px solid #2d6a6a",
      borderRadius: "8px",
      color: "#e8e2d4",
      fontSize: "14px",
      padding: "10px 12px"
    },
    refCardBody: {
      display: "flex",
      flexDirection: "column",
      gap: "14px"
    },
    refCardSection: {
      background: "#1a2320",
      border: "1px solid #2d3a36",
      borderRadius: "10px",
      padding: "12px 14px"
    },
    refCardSectionTitle: {
      fontSize: "11px",
      fontWeight: 700,
      color: GOLD,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "8px"
    },
    refCardRow: {
      display: "flex",
      alignItems: "baseline",
      gap: "8px",
      paddingBottom: "6px",
      borderBottom: "1px solid #2a3330",
      marginBottom: "6px",
      flexWrap: "wrap"
    },
    refCardVariantLabel: {
      flex: 1,
      fontSize: "13px",
      color: "#e8e2d4",
      minWidth: "120px"
    },
    refCardPrice: {
      fontSize: "13px",
      fontWeight: 700,
      color: "#e8e2d4"
    },
    refCardCost: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    refCardMargin: {
      fontSize: "12px",
      fontWeight: 700,
      marginLeft: "auto"
    },
    refCardIngRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: "8px",
      paddingBottom: "4px",
      borderBottom: "1px solid #232a28",
      marginBottom: "4px"
    },
    refCardIngName: {
      fontSize: "13px",
      color: "#e8e2d4",
      flex: 1
    },
    refCardIngStaple: {
      color: "#9aa5a0",
      fontStyle: "italic"
    },
    refCardIngQty: {
      fontSize: "12px",
      color: "#9aa5a0",
      textAlign: "right",
      whiteSpace: "nowrap"
    },
    refCardExtrasLabel: {
      fontSize: "11px",
      color: TEAL_LIGHT,
      fontWeight: 600,
      marginBottom: "3px",
      marginTop: "2px"
    },
    refCardNotes: {
      width: "100%",
      background: "#1f2624",
      border: "1px solid #2d6a6a",
      borderRadius: "8px",
      color: "#e8e2d4",
      fontSize: "13px",
      padding: "10px 12px",
      minHeight: "100px",
      resize: "vertical",
      lineHeight: 1.5,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    cookHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "12px"
    },
    cookSummary: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    resetBtn: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      fontSize: "12px",
      fontWeight: 600,
      color: "#9aa5a0",
      background: "transparent",
      border: "1px solid #37403c",
      borderRadius: "6px",
      padding: "5px 10px",
      cursor: "pointer"
    },
    cookCategory: {
      marginBottom: "16px"
    },
    cookCategoryTitle: {
      fontSize: "13px",
      fontWeight: 700,
      color: TEAL_LIGHT,
      marginBottom: "6px",
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    },
    cookItem: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      marginBottom: "6px",
      cursor: "pointer",
      textAlign: "left"
    },
    cookItemChecked: {
      opacity: 0.5
    },
    checkbox: {
      width: "18px",
      height: "18px",
      borderRadius: "5px",
      border: "1.5px solid #5F5E5A",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    checkboxChecked: {
      background: TEAL_LIGHT,
      borderColor: TEAL_LIGHT
    },
    cookItemText: {
      flex: 1
    },
    cookItemName: {
      fontSize: "14px",
      fontWeight: 600,
      color: CREAM
    },
    cookItemVariant: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    cookItemQty: {
      fontSize: "14px",
      fontWeight: 700,
      color: GOLD
    },
    // Shopping list
    genCard: {
      background: CARD,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "10px",
      padding: "14px",
      marginBottom: "14px"
    },
    genTitle: {
      fontSize: "14px",
      fontWeight: 700,
      color: "#fff",
      marginBottom: "4px"
    },
    genHint: {
      fontSize: "12px",
      color: "#9aa5a0",
      lineHeight: 1.5,
      marginBottom: "8px"
    },
    genToggleRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "12px",
      color: CREAM,
      cursor: "pointer"
    },
    genCheckbox: {
      width: "16px",
      height: "16px",
      accentColor: TEAL_LIGHT
    },
    shopInputRow: {
      display: "flex",
      gap: "8px",
      marginBottom: "14px",
      alignItems: "flex-start"
    },
    shopAddBtn: {
      background: TEAL_LIGHT,
      color: "#04342C",
      border: "none",
      borderRadius: "8px",
      width: "44px",
      height: "44px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      flexShrink: 0
    },
    shopItem: {
      display: "flex",
      alignItems: "center",
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "8px",
      marginBottom: "6px",
      overflow: "hidden"
    },
    shopItemMain: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      gap: "10px",
      background: "transparent",
      border: "none",
      padding: "11px 12px",
      cursor: "pointer",
      textAlign: "left"
    },
    shopItemText: {
      fontSize: "14px",
      color: CREAM
    },
    shopItemTextChecked: {
      textDecoration: "line-through",
      color: "#9aa5a0"
    },
    shopDeleteBtn: {
      background: "transparent",
      border: "none",
      color: "#5F5E5A",
      cursor: "pointer",
      padding: "11px 12px",
      flexShrink: 0
    },
    // Money tab
    moneyStatsBar: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      marginBottom: "8px"
    },
    moneyStatTile: {
      flex: "1 1 45%",
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "10px",
      padding: "10px 8px",
      textAlign: "center"
    },
    moneyFootnote: {
      fontSize: "10px",
      color: "#7a8480",
      fontStyle: "italic",
      marginBottom: "8px"
    },
    groupLabel: {
      fontSize: "12px",
      color: "#9aa5a0",
      fontWeight: 600
    },
    moneyGroup: {
      marginBottom: "14px"
    },
    groupHeader: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: "8px",
      padding: "4px 2px 6px",
      flexWrap: "wrap"
    },
    groupTitle: {
      fontSize: "13px",
      fontWeight: 700,
      color: TEAL_LIGHT,
      textTransform: "uppercase",
      letterSpacing: "0.04em"
    },
    groupTotals: {
      fontSize: "11px",
      color: "#9aa5a0"
    },
    moneyAmounts: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end"
    },
    moneyProfit: {
      fontSize: "11px",
      fontWeight: 600,
      color: "#1D9E75"
    },
    sortRow: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      marginBottom: "12px",
      flexWrap: "wrap"
    },
    sortBtn: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "12px",
      fontWeight: 600,
      color: "#9aa5a0",
      background: "transparent",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "6px 10px",
      cursor: "pointer"
    },
    sortBtnActive: {
      color: TEAL_LIGHT,
      borderColor: TEAL_LIGHT
    },
    sortDirText: {
      fontSize: "11px"
    },
    moneyCount: {
      marginLeft: "auto",
      fontSize: "12px",
      color: "#9aa5a0"
    },
    moneyList: {
      display: "flex",
      flexDirection: "column",
      gap: "6px"
    },
    moneyRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      gap: "10px"
    },
    moneyRowLeft: {
      minWidth: 0
    },
    moneyName: {
      fontSize: "14px",
      fontWeight: 600,
      color: CREAM
    },
    moneyMeta: {
      fontSize: "11px",
      color: "#9aa5a0",
      marginTop: "2px"
    },
    moneyRowRight: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      flexShrink: 0
    },
    moneyAmount: {
      fontSize: "14px",
      fontWeight: 700,
      color: GOLD
    },
    // Review banner (AI flags)
    // Per-item editor
    reviewItemCard: {
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "8px 10px",
      marginBottom: "6px"
    },
    reviewItemMain: {
      flex: 1,
      background: "transparent",
      border: "none",
      textAlign: "left",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: 0
    },
    itemExtraDot: {
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: TEAL_LIGHT,
      flexShrink: 0
    },
    itemNotePreview: {
      fontSize: "11px",
      color: "#9aa5a0",
      fontStyle: "italic",
      marginTop: "3px"
    },
    itemUpchargePreview: {
      fontSize: "11px",
      color: TEAL_LIGHT,
      marginTop: "3px"
    },
    itemUpchargeNeedsPrice: {
      fontSize: "11px",
      color: "#EF9F27",
      marginTop: "3px",
      fontWeight: 600
    },
    itemEditor: {
      marginTop: "8px",
      paddingTop: "8px",
      borderTop: "1px dashed #37403c"
    },
    miniLabel: {
      fontSize: "11px",
      fontWeight: 600,
      color: "#9aa5a0",
      display: "block",
      marginTop: "6px",
      marginBottom: "3px"
    },
    upchargeRow: {
      display: "flex",
      gap: "6px"
    },
    itemEditorActions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "8px",
      marginTop: "8px"
    },
    clearItemExtra: {
      background: "transparent",
      color: "#993556",
      border: "none",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer"
    },
    doneItemBtn: {
      background: TEAL_LIGHT,
      color: "#04342C",
      border: "none",
      borderRadius: "6px",
      padding: "5px 14px",
      fontSize: "12px",
      fontWeight: 700,
      cursor: "pointer"
    },
    // Custom charges
    customChargeList: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      marginBottom: "6px"
    },
    customChargeRow: {
      display: "flex",
      gap: "6px",
      alignItems: "center"
    },
    addChargeBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "12px",
      fontWeight: 600,
      color: TEAL_LIGHT,
      background: "transparent",
      border: "1px dashed #2E6B6B",
      borderRadius: "8px",
      padding: "8px 12px",
      cursor: "pointer",
      marginTop: "2px"
    },
    extraLine: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "13px",
      color: "#cccccc",
      marginTop: "10px"
    },
    // Order card per-item sub-lines
    orderItemBlock: {
      display: "flex",
      flexDirection: "column",
      gap: "2px"
    },
    orderItemSub: {
      fontSize: "11px",
      color: TEAL_LIGHT,
      paddingLeft: "2px"
    },
    orderItemNote: {
      fontSize: "11px",
      color: "#9aa5a0",
      fontStyle: "italic",
      paddingLeft: "2px"
    },
    // Invoice
    invoiceOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.75)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "20px 12px",
      zIndex: 100,
      overflowY: "auto"
    },
    invoiceScroll: {
      width: "100%",
      maxWidth: "380px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    },
    invoiceCard: {
      width: "100%",
      background: "linear-gradient(160deg, #14302e 0%, #1a1a1a 55%)",
      border: `1px solid ${GOLD}`,
      borderRadius: "16px",
      padding: "20px",
      boxSizing: "border-box"
    },
    invoiceHeader: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "14px"
    },
    invoiceLogo: {
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      background: "#085041",
      border: `2px solid ${TEAL_LIGHT}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "14px",
      fontWeight: 700,
      color: TEAL_LIGHT,
      flexShrink: 0
    },
    invoiceBrand: {
      fontSize: "15px",
      fontWeight: 700,
      color: "#fff"
    },
    invoiceTagline: {
      fontSize: "11px",
      color: TEAL_LIGHT,
      fontStyle: "italic"
    },
    invoiceMeta: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: "8px"
    },
    invoiceCustomer: {
      fontSize: "17px",
      fontWeight: 700,
      color: CREAM
    },
    invoiceDate: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    invoiceDivider: {
      height: "1px",
      background: "#37403c",
      margin: "12px 0"
    },
    invoiceItems: {
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    },
    invoiceItemBlock: {
      display: "flex",
      flexDirection: "column",
      gap: "1px"
    },
    invoiceItemLine: {
      display: "flex",
      justifyContent: "space-between",
      gap: "10px"
    },
    invoiceItemName: {
      fontSize: "14px",
      fontWeight: 600,
      color: CREAM
    },
    invoiceItemPrice: {
      fontSize: "14px",
      fontWeight: 700,
      color: CREAM,
      flexShrink: 0
    },
    invoiceItemVariant: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    invoiceItemExtra: {
      fontSize: "11px",
      color: TEAL_LIGHT
    },
    invoiceItemNote: {
      fontSize: "11px",
      color: "#b8a06a",
      fontStyle: "italic"
    },
    invoiceTotals: {
      display: "flex",
      flexDirection: "column",
      gap: "5px"
    },
    invoiceTotalRow: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "13px",
      color: "#cccccc"
    },
    invoiceGrandTotal: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "12px",
      paddingTop: "12px",
      borderTop: `1px solid ${GOLD}`
    },
    invoiceGrandValue: {
      fontSize: "22px",
      fontWeight: 700,
      color: GOLD
    },
    invoiceNotes: {
      fontSize: "12px",
      color: "#9aa5a0",
      fontStyle: "italic",
      marginTop: "12px",
      paddingTop: "10px",
      borderTop: "1px dashed #37403c"
    },
    invoiceFooter: {
      fontSize: "11px",
      color: TEAL_LIGHT,
      textAlign: "center",
      marginTop: "14px"
    },
    invoiceClose: {
      marginTop: "16px",
      background: TEAL_LIGHT,
      color: "#04342C",
      border: "none",
      borderRadius: "10px",
      padding: "12px 40px",
      fontSize: "14px",
      fontWeight: 700,
      cursor: "pointer"
    },
    invoiceShareBtn: {
      marginTop: "16px",
      background: "#c9a84c",
      color: "#1a3a3a",
      border: "none",
      borderRadius: "10px",
      padding: "12px 40px",
      fontSize: "14px",
      fontWeight: 700,
      cursor: "pointer"
    },
    // ── Invoice weight warnings ────────────────────────────────────────────────
    invoiceNotFinalBanner: {
      background: "#EF9F27",
      color: "#1a1a1a",
      fontWeight: 800,
      fontSize: "12px",
      textAlign: "center",
      padding: "8px 10px",
      borderRadius: "8px",
      margin: "10px 0 4px",
      letterSpacing: "0.3px",
      lineHeight: 1.3
    },
    invoiceItemPending: {
      fontSize: "11px",
      color: "#EF9F27",
      fontStyle: "italic",
      marginTop: "1px"
    },
    invoiceTotalPendingNote: {
      fontSize: "11px",
      color: "#EF9F27",
      fontStyle: "italic",
      textAlign: "right",
      marginTop: "4px",
      lineHeight: 1.3
    },
    invoiceHint: {
      fontSize: "12px",
      color: "#9aa5a0",
      marginTop: "8px",
      textAlign: "center"
    },
    // ── Reheat instructions card ───────────────────────────────────────────────
    reheatSubhead: {
      fontSize: "11px",
      color: GOLD,
      fontWeight: 600,
      letterSpacing: "0.5px",
      textTransform: "uppercase"
    },
    reheatBlocks: {
      display: "flex",
      flexDirection: "column",
      gap: "14px"
    },
    reheatBlock: {
      display: "flex",
      flexDirection: "column",
      gap: "3px"
    },
    reheatDishes: {
      fontSize: "14px",
      fontWeight: 700,
      color: CREAM
    },
    reheatBody: {
      fontSize: "13px",
      color: "#cfd6d2",
      lineHeight: 1.45
    },
    // Review open button (replaces passive banner)
    reviewOpenBtn: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      width: "100%",
      background: "#3a2e08",
      border: "1px solid #C49A3C",
      borderRadius: "10px",
      padding: "12px 14px",
      cursor: "pointer",
      marginBottom: "10px",
      color: GOLD,
      textAlign: "left"
    },
    reviewOpenText: { flex: 1 },
    reviewOpenTitle: { fontSize: "13px", fontWeight: 700, color: GOLD },
    reviewOpenSub: { fontSize: "11px", color: "#cbb87a", marginTop: "1px" },
    // Review modal
    reviewModalCard: {
      width: "100%",
      maxWidth: "420px",
      background: CARD,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "14px",
      padding: "18px",
      boxSizing: "border-box"
    },
    reviewModalHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "4px"
    },
    reviewModalTitle: { fontSize: "17px", fontWeight: 700, color: "#fff" },
    reviewProgress: { fontSize: "12px", color: "#9aa5a0", marginBottom: "14px" },
    reviewStep: { display: "flex", flexDirection: "column" },
    reviewReasonBox: {
      background: "#1a1a1a",
      border: "1px solid #C49A3C",
      borderRadius: "8px",
      padding: "12px",
      fontSize: "14px",
      color: CREAM,
      lineHeight: 1.4
    },
    reviewItemContext: {
      fontSize: "12px",
      color: "#9aa5a0",
      marginTop: "8px"
    },
    reviewField: {
      display: "flex",
      flexDirection: "column",
      marginTop: "12px"
    },
    reviewActionBtn: {
      marginTop: "8px",
      alignSelf: "flex-start",
      background: TEAL_LIGHT,
      color: "#04342C",
      border: "none",
      borderRadius: "8px",
      padding: "8px 16px",
      fontSize: "13px",
      fontWeight: 700,
      cursor: "pointer"
    },
    reviewOr: {
      fontSize: "11px",
      color: "#7a8480",
      textAlign: "center",
      margin: "10px 0 4px",
      textTransform: "uppercase",
      letterSpacing: "0.08em"
    },
    reviewSkipBtn: {
      marginTop: "14px",
      background: "transparent",
      color: "#9aa5a0",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "9px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer"
    },
    reviewNav: {
      display: "flex",
      justifyContent: "center",
      gap: "6px",
      marginTop: "14px"
    },
    reviewDot: {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      border: "none",
      background: "#37403c",
      cursor: "pointer",
      padding: 0
    },
    reviewDotActive: { background: TEAL_LIGHT },
    reviewDotDone: { background: "#1D9E75" },
    reviewDone: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10px",
      padding: "24px 0 8px",
      textAlign: "center"
    },
    reviewDoneText: { fontSize: "14px", color: CREAM, fontWeight: 600 },
    // Sous vide reprice button
    sousVideBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      width: "100%",
      marginTop: "12px",
      background: "#0f2e2a",
      color: TEAL_LIGHT,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "8px",
      padding: "11px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer"
    },
    weightPriceHint: {
      fontSize: "12px",
      color: TEAL_LIGHT,
      marginTop: "4px",
      fontWeight: 600
    },
    // Pending weight state on order cards
    pendingPrice: {
      fontSize: "12px",
      color: "#EF9F27",
      fontStyle: "italic",
      fontWeight: 600
    },
    setWeightBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      marginTop: "5px",
      background: "#0f2e2a",
      color: TEAL_LIGHT,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "6px",
      padding: "5px 10px",
      fontSize: "11px",
      fontWeight: 600,
      cursor: "pointer"
    },
    updateAllWeightsBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      width: "100%",
      marginBottom: "10px",
      background: "#0f2e2a",
      color: TEAL_LIGHT,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "8px",
      padding: "11px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer"
    },
    // Weight + photo modal
    weightModalCard: {
      width: "100%",
      maxWidth: "400px",
      background: CARD,
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "14px",
      padding: "18px",
      boxSizing: "border-box",
      maxHeight: "88vh",
      overflowY: "auto"
    },
    weightStepLabel: {
      fontSize: "11px",
      color: TEAL_LIGHT,
      marginTop: "2px"
    },
    amendBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "7px",
      flex: "1 1 100%",
      background: "#2a2333",
      color: "#b89adb",
      border: "1px solid #6b51a0",
      borderRadius: "10px",
      padding: "13px",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer"
    },
    amendOrderPicker: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      marginBottom: "4px"
    },
    amendOrderChip: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px",
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      cursor: "pointer",
      textAlign: "left",
      width: "100%"
    },
    amendOrderChipActive: {
      borderColor: TEAL_LIGHT,
      background: "#0f2e2a"
    },
    amendChipName: {
      fontSize: "14px",
      fontWeight: 600,
      color: CREAM
    },
    amendChipMeta: {
      fontSize: "12px",
      color: "#9aa5a0",
      flexShrink: 0
    },
    amendCurrentBox: {
      background: "#14302e",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "8px",
      padding: "10px 12px",
      margin: "4px 0 4px"
    },
    amendCurrentTitle: {
      fontSize: "11px",
      fontWeight: 700,
      color: TEAL_LIGHT,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      marginBottom: "6px"
    },
    amendCurrentItem: {
      fontSize: "13px",
      color: CREAM,
      padding: "2px 0"
    },
    weightDeferNote: {
      fontSize: "12px",
      color: "#9aa5a0",
      background: "#0f2e2a",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "8px",
      padding: "10px 12px",
      margin: "10px 0 0",
      lineHeight: 1.4
    },
    weightIntentNote: {
      fontSize: "12px",
      color: "#9aa5a0",
      fontStyle: "italic",
      background: "#1a1a1a",
      borderRadius: "6px",
      padding: "8px 10px",
      margin: "4px 0 12px"
    },
    weightModalHint: {
      fontSize: "11px",
      color: "#7a8480",
      marginTop: "8px",
      lineHeight: 1.4
    },
    photoUploadBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      width: "100%",
      background: "#1a1a1a",
      color: TEAL_LIGHT,
      border: "1px dashed #2E6B6B",
      borderRadius: "8px",
      padding: "14px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
      boxSizing: "border-box"
    },
    photoPreviewWrap: {
      position: "relative",
      borderRadius: "8px",
      overflow: "hidden",
      border: "1px solid #37403c"
    },
    photoPreview: {
      width: "100%",
      display: "block",
      maxHeight: "260px",
      objectFit: "contain",
      background: "#000"
    },
    photoRemoveBtn: {
      position: "absolute",
      top: "8px",
      right: "8px",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      background: "rgba(0,0,0,0.7)",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      padding: "5px 9px",
      fontSize: "11px",
      fontWeight: 600,
      cursor: "pointer"
    },
    // Storage gauge in Money tab
    storageGauge: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "12px",
      color: "#9aa5a0",
      padding: "12px 14px",
      marginTop: "8px",
      background: CARD,
      borderRadius: "8px",
      flexWrap: "wrap"
    },
    storageGaugeNote: {
      fontSize: "11px",
      color: "#7a8480",
      marginLeft: "auto"
    },
    // Order photos in Money tab
    moneyRowWrap: {
      display: "flex",
      flexDirection: "column"
    },
    orderPhotosWrap: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      padding: "10px 4px 4px"
    },
    orderPhotoItem: {
      display: "flex",
      flexDirection: "column",
      gap: "5px"
    },
    orderPhotoLabel: {
      fontSize: "12px",
      fontWeight: 600,
      color: TEAL_LIGHT
    },
    orderPhotoLoading: {
      fontSize: "11px",
      color: "#7a8480",
      fontStyle: "italic"
    },
    orderPhotoImg: {
      width: "100%",
      borderRadius: "8px",
      border: "1px solid #37403c",
      maxHeight: "320px",
      objectFit: "contain",
      background: "#000"
    },
    // Cook tab revenue bar
    cookRevenueBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#0f2e2a",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "10px",
      padding: "12px 14px",
      marginBottom: "12px"
    },
    cookRevenueLabel: {
      fontSize: "13px",
      color: "#9aa5a0"
    },
    cookRevenueValue: {
      fontSize: "18px",
      fontWeight: 700,
      color: TEAL_LIGHT
    },
    // Shop tab cost bar
    shopCostBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "10px",
      padding: "11px 14px",
      marginBottom: "12px"
    },
    shopCostLabel: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    shopCostValue: {
      fontSize: "16px",
      fontWeight: 700,
      color: GOLD
    },
    // ── Dish picker ────────────────────────────────────────────────────────────
    dishPickerGrid: {
      display: "flex",
      flexWrap: "wrap",
      gap: "7px",
      marginTop: "8px"
    },
    dishPickerChip: {
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "7px 10px",
      fontSize: "12px",
      color: "#9aa5a0",
      cursor: "pointer",
      textAlign: "left",
      display: "flex",
      alignItems: "center",
      gap: "4px"
    },
    dishPickerChipWeek: {
      border: "1px solid #2d6a6a",
      color: "#d8d2c4",
      background: "#1a2e2e"
    },
    dishPickerChipSelected: {
      background: "#c9a84c",
      color: "#1a3a3a",
      border: "1px solid #c9a84c",
      fontWeight: 700
    },
    dishPickerDot: {
      color: "#3fb8a0",
      fontSize: "8px"
    },
    dishPickerControls: {
      marginTop: "12px",
      paddingTop: "12px",
      borderTop: "1px solid #2d3a36"
    },
    dishPickerVariants: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      marginTop: "6px",
      marginBottom: "10px"
    },
    dishPickerVariantBtn: {
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "9px 12px",
      fontSize: "13px",
      color: "#9aa5a0",
      cursor: "pointer",
      textAlign: "left"
    },
    dishPickerVariantBtnOn: {
      background: "#1a3a3a",
      border: "1px solid #2d6a6a",
      color: "#e8e2d4",
      fontWeight: 600
    },
    dishPickerServing: {
      color: "#7abf7a",
      fontSize: "11px",
      fontWeight: 400
    },
    dishPickerCountRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "4px"
    },
    dishPickerCounter: {
      display: "flex",
      alignItems: "center",
      gap: "10px"
    },
    // Money tab search row
    moneySearchRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "12px"
    },
    moneySearchInput: {
      flex: 1,
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px",
      fontSize: "14px",
      color: CREAM,
      outline: "none"
    },
    moneySearchClear: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "32px",
      height: "32px",
      background: "transparent",
      border: "1px solid #37403c",
      borderRadius: "8px",
      color: "#9aa5a0",
      cursor: "pointer",
      flexShrink: 0
    },
    chartToggleBtn: {
      background: "transparent",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "8px",
      padding: "8px 14px",
      fontSize: "13px",
      fontWeight: 600,
      color: TEAL_LIGHT,
      cursor: "pointer",
      flexShrink: 0
    },
    chartToggleBtnActive: {
      background: "#0f2e2a",
      borderColor: TEAL_LIGHT
    },
    // Rich per-group summary header
    groupHeaderRich: {
      background: "#14302e",
      border: `1px solid ${TEAL_MID}`,
      borderRadius: "10px",
      padding: "12px 14px",
      marginBottom: "8px"
    },
    groupHeaderTop: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: "10px"
    },
    groupOrderCount: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    groupStatsRow: {
      display: "flex",
      gap: "8px"
    },
    groupStat: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: "2px"
    },
    groupStatValue: {
      fontSize: "15px",
      fontWeight: 700,
      color: CREAM
    },
    groupStatLabel: {
      fontSize: "10px",
      color: "#7a8480",
      textTransform: "uppercase",
      letterSpacing: "0.04em"
    },
    // Profit chart
    chartCard: {
      background: CARD,
      border: "1px solid #37403c",
      borderRadius: "12px",
      padding: "14px",
      marginBottom: "14px"
    },
    chartHeader: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: "8px"
    },
    chartTitle: {
      fontSize: "14px",
      fontWeight: 700,
      color: CREAM
    },
    chartSubtitle: {
      fontSize: "12px",
      color: "#9aa5a0"
    },
    chartSvg: {
      width: "100%",
      height: "auto",
      display: "block"
    },
    chartLegend: {
      fontSize: "11px",
      color: "#7a8480",
      marginTop: "8px",
      lineHeight: 1.4
    },
    // CSV import
    csvBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "7px",
      flex: "1 1 100%",
      background: "#1f2937",
      color: "#93b4d4",
      border: "1px solid #3d5a7a",
      borderRadius: "10px",
      padding: "13px",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer"
    },
    checkFormBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "7px",
      flex: "1 1 100%",
      background: "#1a2e1a",
      color: "#7abf7a",
      border: "1px solid #3a6a3a",
      borderRadius: "10px",
      padding: "13px",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer"
    },
    spinning: {
      animation: "spin 1s linear infinite"
    },
    csvProgress: {
      fontSize: "13px",
      color: TEAL_LIGHT,
      textAlign: "center",
      padding: "8px 0"
    },
    csvResultsList: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      marginBottom: "12px",
      maxHeight: "320px",
      overflowY: "auto"
    },
    csvResultRow: {
      background: "#1a1a1a",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px 12px"
    },
    csvResultName: {
      fontSize: "14px",
      fontWeight: 600,
      color: CREAM,
      marginBottom: "3px"
    },
    csvResultItems: {
      fontSize: "12px",
      color: "#9aa5a0",
      lineHeight: 1.4
    },
    csvResultItem: {
      marginRight: "4px"
    },
    csvResultFlag: {
      color: "#EF9F27"
    },
    csvResultError: {
      fontSize: "12px",
      color: "#E8799A",
      fontStyle: "italic"
    },
    csvBackBtn: {
      width: "100%",
      background: "transparent",
      color: "#9aa5a0",
      border: "1px solid #37403c",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "13px",
      fontWeight: 600,
      cursor: "pointer",
      marginTop: "8px"
    }
  };

  // src/components/ImportModal.jsx
  var import_react2 = __toESM(require_react());
  function ImportModal({ onSubmit, onCancel }) {
    const [text, setText] = (0, import_react2.useState)("");
    return /* @__PURE__ */ import_react2.default.createElement("div", { style: styles.invoiceOverlay, onClick: onCancel }, /* @__PURE__ */ import_react2.default.createElement("div", { style: styles.importModalCard, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react2.default.createElement("div", { style: styles.reviewModalHeader }, /* @__PURE__ */ import_react2.default.createElement("div", { style: styles.reviewModalTitle }, "Paste backup"), /* @__PURE__ */ import_react2.default.createElement("button", { style: styles.iconBtn, onClick: onCancel, "aria-label": "Cancel" }, /* @__PURE__ */ import_react2.default.createElement(X, { size: 18 }))), /* @__PURE__ */ import_react2.default.createElement("div", { style: styles.importModalHint }, "Open your backup note, select all, copy, then long-press in the box below and paste."), /* @__PURE__ */ import_react2.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "140px", fontSize: "11px", fontFamily: "monospace" },
        placeholder: "Paste your LTB backup JSON here...",
        value: text,
        onChange: (e) => setText(e.target.value),
        autoFocus: true
      }
    ), /* @__PURE__ */ import_react2.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, ...text.trim() ? {} : styles.saveBtnDisabled },
        disabled: !text.trim(),
        onClick: () => onSubmit(text)
      },
      "Restore orders"
    )));
  }

  // src/components/RegularsTab.jsx
  var import_react3 = __toESM(require_react());
  function LinkRegularPrompt({ order, candidates, onLink, onSkip }) {
    return /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.invoiceOverlay, onClick: onSkip }, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.linkPromptCard, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.linkPromptTitle }, "This looks like a regular"), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.linkPromptBody }, "The order from ", /* @__PURE__ */ import_react3.default.createElement("b", null, order.customer), " might match one of your regulars. Want to link it?"), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.linkPromptList }, candidates.map((r) => /* @__PURE__ */ import_react3.default.createElement("button", { key: r.id, style: styles.linkPromptCandidate, onClick: () => onLink(r.id) }, /* @__PURE__ */ import_react3.default.createElement("span", { style: styles.linkPromptCandidateName }, regularDisplayName(r), " \u2605"), r.discountPercent > 0 && /* @__PURE__ */ import_react3.default.createElement("span", { style: styles.linkPromptCandidateMeta }, r.discountPercent, "% off applies")))), /* @__PURE__ */ import_react3.default.createElement("button", { style: styles.linkPromptSkip, onClick: onSkip }, "Not a regular / skip")));
  }
  function RegularsTab({ regulars, orders, onAdd, onUpdate, onDelete, onLink, onUnlink }) {
    const [mode, setMode] = (0, import_react3.useState)("list");
    const [activeId, setActiveId] = (0, import_react3.useState)(null);
    const activeRegular = regulars.find((r) => r.id === activeId) || null;
    if (mode === "add") {
      return /* @__PURE__ */ import_react3.default.createElement(
        RegularForm,
        {
          onSave: (profile) => {
            onAdd(profile);
            setMode("list");
          },
          onCancel: () => setMode("list")
        }
      );
    }
    if (mode === "profile" && activeRegular) {
      return /* @__PURE__ */ import_react3.default.createElement(
        RegularProfile,
        {
          regular: activeRegular,
          orders,
          allRegulars: regulars,
          onUpdate,
          onDelete: (id) => {
            onDelete(id);
            setMode("list");
            setActiveId(null);
          },
          onLink,
          onUnlink,
          onBack: () => {
            setMode("list");
            setActiveId(null);
          }
        }
      );
    }
    return /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.genCard }, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.genTitle }, "Regulars"), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.genHint }, "Your VIP customers. Tap one to see their profile, order history, and the patterns Claude spots over time. New form orders auto-link to a regular when the full name matches exactly.")), /* @__PURE__ */ import_react3.default.createElement("button", { style: styles.addRegularBtn, onClick: () => setMode("add") }, /* @__PURE__ */ import_react3.default.createElement(Plus, { size: 18 }), " Add a regular"), regulars.length === 0 ? /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.emptyState }, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.emptyTitle }, "No regulars yet"), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.emptyBody }, "Add your repeat customers to track their preferences and order history.")) : /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.regularsList }, regulars.map((r) => {
      const linkedCount = (r.linkedOrderIds || []).length;
      return /* @__PURE__ */ import_react3.default.createElement(
        "button",
        {
          key: r.id,
          style: styles.regularRow,
          onClick: () => {
            setActiveId(r.id);
            setMode("profile");
          }
        },
        /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.regularRowLeft }, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.regularRowName }, regularDisplayName(r), " ", /* @__PURE__ */ import_react3.default.createElement("span", { style: styles.regularStar }, "\u2605")), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.regularRowMeta }, linkedCount, " order", linkedCount !== 1 ? "s" : "", r.discountPercent > 0 ? ` \xB7 ${r.discountPercent}% off` : "")),
        /* @__PURE__ */ import_react3.default.createElement(ChevronDown, { size: 16, style: { transform: "rotate(-90deg)" } })
      );
    })));
  }
  function RegularForm({ regular, onSave, onCancel }) {
    const seedNames = regular ? regularNames(regular) : [];
    const [names, setNames] = (0, import_react3.useState)(seedNames.length ? seedNames : [""]);
    const [address, setAddress] = (0, import_react3.useState)(regular?.address || "");
    const [phone, setPhone] = (0, import_react3.useState)(regular?.phone || "");
    const [dietary, setDietary] = (0, import_react3.useState)(regular?.dietary || "");
    const [spice, setSpice] = (0, import_react3.useState)(regular?.spice || "");
    const [discountPercent, setDiscountPercent] = (0, import_react3.useState)(regular?.discountPercent ? String(regular.discountPercent) : "");
    const cleanNames = names.map((n) => n.trim()).filter(Boolean);
    const canSave = cleanNames.length > 0;
    const MAX_NAMES = 3;
    const updateName = (idx, value) => {
      setNames((prev) => prev.map((n, i) => i === idx ? value : n));
    };
    const addName = () => {
      if (names.length < MAX_NAMES) setNames((prev) => [...prev, ""]);
    };
    const removeName = (idx) => {
      setNames((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
    };
    return /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.genCard }, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.genTitle }, regular ? "Edit profile" : "New regular")), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.regularFormCard }, /* @__PURE__ */ import_react3.default.createElement("label", { style: styles.miniLabel }, "Name(s) *"), names.map((nm, idx) => /* @__PURE__ */ import_react3.default.createElement("div", { key: idx, style: styles.nameRow }, /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        style: { ...styles.input, marginBottom: 0, flex: 1 },
        value: nm,
        onChange: (e) => updateName(idx, e.target.value),
        placeholder: idx === 0 ? "Full name (helps form orders auto-link)" : "Partner / second name"
      }
    ), names.length > 1 && /* @__PURE__ */ import_react3.default.createElement("button", { style: styles.nameRemoveBtn, onClick: () => removeName(idx), "aria-label": "Remove name" }, "\xD7"))), names.length < MAX_NAMES && /* @__PURE__ */ import_react3.default.createElement("button", { style: styles.addNameBtn, onClick: addName }, "+ Add another name"), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.regularFormHint }, "Add both people in a couple so either name on a form order links to this same profile."), /* @__PURE__ */ import_react3.default.createElement("label", { style: styles.miniLabel }, "Address"), /* @__PURE__ */ import_react3.default.createElement("input", { style: styles.input, value: address, onChange: (e) => setAddress(e.target.value), placeholder: "For your delivery reference" }), /* @__PURE__ */ import_react3.default.createElement("label", { style: styles.miniLabel }, "Phone"), /* @__PURE__ */ import_react3.default.createElement("input", { style: styles.input, type: "tel", value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "Phone number" }), /* @__PURE__ */ import_react3.default.createElement("label", { style: styles.miniLabel }, "Dietary restrictions"), /* @__PURE__ */ import_react3.default.createElement("input", { style: styles.input, value: dietary, onChange: (e) => setDietary(e.target.value), placeholder: "e.g. no peanuts, dairy-free" }), /* @__PURE__ */ import_react3.default.createElement("label", { style: styles.miniLabel }, "Preferred spice level"), /* @__PURE__ */ import_react3.default.createElement("input", { style: styles.input, value: spice, onChange: (e) => setSpice(e.target.value), placeholder: "e.g. level 3, mild" }), /* @__PURE__ */ import_react3.default.createElement("label", { style: styles.miniLabel }, "Lifetime discount (%)"), /* @__PURE__ */ import_react3.default.createElement("input", { style: styles.input, type: "number", inputMode: "decimal", value: discountPercent, onChange: (e) => setDiscountPercent(e.target.value), placeholder: "e.g. 20 for Mom, 5 for testers" }), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.regularFormHint }, "Auto-applies to their orders. You can toggle it off per order."), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.regularFormActions }, /* @__PURE__ */ import_react3.default.createElement("button", { style: styles.confirmNo, onClick: onCancel }, "Cancel"), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        style: { ...styles.confirmYesGreen, opacity: canSave ? 1 : 0.5 },
        disabled: !canSave,
        onClick: () => onSave({ names: cleanNames, address, phone, dietary, spice, discountPercent })
      },
      regular ? "Save changes" : "Add regular"
    ))));
  }
  function RegularProfile({ regular, orders, allRegulars, onUpdate, onDelete, onLink, onUnlink, onBack }) {
    const [editing, setEditing] = (0, import_react3.useState)(false);
    const [editingNotes, setEditingNotes] = (0, import_react3.useState)(false);
    const [notesDraft, setNotesDraft] = (0, import_react3.useState)(regular.notes || "");
    const [showLinkBrowser, setShowLinkBrowser] = (0, import_react3.useState)(false);
    const [linkSearch, setLinkSearch] = (0, import_react3.useState)("");
    const [confirmDelete, setConfirmDelete] = (0, import_react3.useState)(false);
    const linkedOrders = (0, import_react3.useMemo)(
      () => (regular.linkedOrderIds || []).map((oid) => orders.find((o) => o.id === oid)).filter(Boolean).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
      [regular.linkedOrderIds, orders]
    );
    const totalOrders = linkedOrders.length;
    const totalSpent = linkedOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const lastOrder = linkedOrders[0];
    const insights = (0, import_react3.useMemo)(() => buildInsights(linkedOrders), [linkedOrders]);
    (0, import_react3.useEffect)(() => {
      if (insights.length === 0) return;
      const sig = insights.join(" | ");
      if (regular.lastInsightSig === sig) return;
      const existingNotes = regular.notes || "";
      const newLines = insights.filter((text) => !existingNotes.includes(text)).map((text) => insightStamp(text));
      if (newLines.length > 0) {
        const updatedNotes = existingNotes ? existingNotes + "\n" + newLines.join("\n") : newLines.join("\n");
        onUpdate(regular.id, { notes: updatedNotes, lastInsightSig: sig });
        setNotesDraft(updatedNotes);
      } else {
        onUpdate(regular.id, { lastInsightSig: sig });
      }
    }, [insights]);
    const saveNotes = () => {
      onUpdate(regular.id, { notes: notesDraft });
      setEditing(false);
    };
    const linkableOrders = (0, import_react3.useMemo)(() => {
      const linkedSet = new Set(regular.linkedOrderIds || []);
      const q = normName(linkSearch);
      return orders.filter((o) => !linkedSet.has(o.id)).filter((o) => !q || normName(o.customer).includes(q)).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }, [orders, regular.linkedOrderIds, linkSearch]);
    if (editing) {
      return /* @__PURE__ */ import_react3.default.createElement(
        RegularForm,
        {
          regular,
          onSave: (profile) => {
            const names = (profile.names || []).map((n) => String(n || "").trim()).filter(Boolean);
            onUpdate(regular.id, {
              names,
              name: names[0] || "",
              // keep legacy primary in sync
              address: profile.address,
              phone: profile.phone,
              dietary: profile.dietary,
              spice: profile.spice,
              discountPercent: Number(profile.discountPercent) || 0
            });
            setEditing(false);
          },
          onCancel: () => setEditing(false)
        }
      );
    }
    return /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("button", { style: styles.profileBackBtn, onClick: onBack }, "\u2039 All regulars"), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileHeader }, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileName }, regularDisplayName(regular), " ", /* @__PURE__ */ import_react3.default.createElement("span", { style: styles.regularStar }, "\u2605")), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileSummaryGrid }, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileStat }, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileStatNum }, totalOrders), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileStatLabel }, "orders")), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileStat }, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileStatNum }, currency(totalSpent)), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileStatLabel }, "total spent")), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileStat }, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileStatNum }, lastOrder ? formatDate(lastOrder.createdAt) : "\u2014"), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileStatLabel }, "last order"))), regular.discountPercent > 0 && /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileDiscountBadge }, regular.discountPercent, "% lifetime discount")), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileSection }, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileSectionTitle }, "Details"), regular.address ? /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileField }, /* @__PURE__ */ import_react3.default.createElement("span", { style: styles.profileFieldKey }, "Address:"), " ", regular.address) : null, regular.phone ? /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileField }, /* @__PURE__ */ import_react3.default.createElement("span", { style: styles.profileFieldKey }, "Phone:"), " ", regular.phone) : null, regular.dietary ? /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileField }, /* @__PURE__ */ import_react3.default.createElement("span", { style: styles.profileFieldKey }, "Dietary:"), " ", regular.dietary) : null, regular.spice ? /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileField }, /* @__PURE__ */ import_react3.default.createElement("span", { style: styles.profileFieldKey }, "Spice:"), " ", regular.spice) : null, !regular.address && !regular.phone && !regular.dietary && !regular.spice && /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileFieldEmpty }, "No details added yet."), /* @__PURE__ */ import_react3.default.createElement("button", { style: styles.profileEditBtn, onClick: () => setEditing(true) }, /* @__PURE__ */ import_react3.default.createElement(Pencil, { size: 13 }), " Edit details")), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileSection }, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileSectionTitle }, "Notes & insights"), editingNotes ? /* @__PURE__ */ import_react3.default.createElement(import_react3.default.Fragment, null, /* @__PURE__ */ import_react3.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "90px" },
        value: notesDraft,
        onChange: (e) => setNotesDraft(e.target.value),
        placeholder: "Free-form notes. Auto-insights from Claude appear here too, datestamped.",
        autoFocus: true
      }
    ), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.regularFormActions }, /* @__PURE__ */ import_react3.default.createElement("button", { style: styles.confirmNo, onClick: () => {
      setNotesDraft(regular.notes || "");
      setEditingNotes(false);
    } }, "Cancel"), /* @__PURE__ */ import_react3.default.createElement("button", { style: styles.confirmYesGreen, onClick: saveNotes }, "Save notes"))) : /* @__PURE__ */ import_react3.default.createElement(import_react3.default.Fragment, null, notesDraft ? /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileNotes }, notesDraft.split("\n").map((line, i) => /* @__PURE__ */ import_react3.default.createElement("div", { key: i, style: line.startsWith("[Auto-insight") ? styles.profileInsightLine : styles.profileNoteLine }, line))) : /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileFieldEmpty }, "No notes yet. Insights appear automatically after ", MIN_ORDERS_FOR_INSIGHT, " orders."), /* @__PURE__ */ import_react3.default.createElement("button", { style: styles.profileEditBtn, onClick: () => {
      setNotesDraft(regular.notes || "");
      setEditingNotes(true);
    } }, /* @__PURE__ */ import_react3.default.createElement(Pencil, { size: 13 }), " Edit notes"))), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileSection }, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileSectionTitle }, "Order history (", totalOrders, ")"), linkedOrders.length === 0 ? /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileFieldEmpty }, "No orders linked yet.") : /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileHistoryList }, linkedOrders.map((o) => /* @__PURE__ */ import_react3.default.createElement("div", { key: o.id, style: styles.profileHistoryRow }, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileHistoryLeft }, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileHistoryDate }, o.createdAt ? formatDate(o.createdAt) : "undated"), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileHistoryItems }, (o.items || []).map((it) => `${it.qty}\xD7 ${it.name}`).join(", ") || "No items")), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileHistoryRight }, /* @__PURE__ */ import_react3.default.createElement("span", { style: styles.profileHistoryTotal }, currency(o.total)), /* @__PURE__ */ import_react3.default.createElement("button", { style: styles.profileUnlinkBtn, onClick: () => onUnlink(regular.id, o.id) }, "unlink"))))), /* @__PURE__ */ import_react3.default.createElement("button", { style: styles.profileLinkBtn, onClick: () => setShowLinkBrowser(!showLinkBrowser) }, showLinkBrowser ? "Close" : "+ Link past orders"), showLinkBrowser && /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.linkBrowser }, /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        style: styles.input,
        placeholder: "Search orders by name...",
        value: linkSearch,
        onChange: (e) => setLinkSearch(e.target.value)
      }
    ), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.linkBrowserList }, linkableOrders.length === 0 ? /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileFieldEmpty }, "No matching orders to link.") : linkableOrders.slice(0, 30).map((o) => /* @__PURE__ */ import_react3.default.createElement("button", { key: o.id, style: styles.linkBrowserRow, onClick: () => onLink(regular.id, o.id) }, /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.linkBrowserRowLeft }, /* @__PURE__ */ import_react3.default.createElement("span", { style: styles.linkBrowserName }, o.customer), /* @__PURE__ */ import_react3.default.createElement("span", { style: styles.linkBrowserItems }, (o.items || []).map((it) => it.name).join(", ").slice(0, 50))), /* @__PURE__ */ import_react3.default.createElement("span", { style: styles.linkBrowserMeta }, o.createdAt ? formatDate(o.createdAt) : "", " \xB7 ", currency(o.total))))))), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileSection }, confirmDelete ? /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.profileDeleteConfirm }, /* @__PURE__ */ import_react3.default.createElement("span", null, "Remove this regular? Their order history stays, just unlinked."), /* @__PURE__ */ import_react3.default.createElement("div", { style: styles.regularFormActions }, /* @__PURE__ */ import_react3.default.createElement("button", { style: styles.confirmNo, onClick: () => setConfirmDelete(false) }, "Cancel"), /* @__PURE__ */ import_react3.default.createElement("button", { style: styles.confirmDeleteRed, onClick: () => onDelete(regular.id) }, "Remove"))) : /* @__PURE__ */ import_react3.default.createElement("button", { style: styles.profileDeleteBtn, onClick: () => setConfirmDelete(true) }, /* @__PURE__ */ import_react3.default.createElement(Trash2, { size: 13 }), " Remove regular")));
  }

  // src/components/WeekTab.jsx
  var import_react4 = __toESM(require_react());
  function WeekTab({ selected, onToggle, onPublish }) {
    const [copied, setCopied] = (0, import_react4.useState)(false);
    const [publishing, setPublishing] = (0, import_react4.useState)(false);
    const [publishMsg, setPublishMsg] = (0, import_react4.useState)(null);
    const [pdfUrl, setPdfUrl] = (0, import_react4.useState)("");
    const [weekLabel, setWeekLabel] = (0, import_react4.useState)("");
    const computeWeekLabel = () => {
      const now = /* @__PURE__ */ new Date();
      const day = now.getDay();
      let daysToSun;
      if (day === 0) daysToSun = 0;
      else if (day <= 3) daysToSun = 7 - day;
      else daysToSun = 7 - day;
      const sun = new Date(now);
      sun.setDate(now.getDate() + daysToSun);
      const wed = new Date(sun);
      wed.setDate(sun.getDate() + 3);
      const fmt = (d) => d.toLocaleDateString(void 0, { month: "long", day: "numeric" });
      return `Orders due Sunday ${fmt(sun)} \xB7 Delivery Wednesday ${fmt(wed)}`;
    };
    const doPublish = async () => {
      setPublishing(true);
      setPublishMsg(null);
      try {
        await onPublish(selected, pdfUrl.trim(), weekLabel.trim() || computeWeekLabel());
        setPublishMsg({ ok: true, text: "Published! The order form now shows this week's menu." });
      } catch (e) {
        setPublishMsg({ ok: false, text: e && e.message || "Publish failed. Check your connection and try again." });
      }
      setPublishing(false);
    };
    const generateDropdown = () => {
      if (selected.length === 0) return "";
      const lines = [];
      selected.forEach((name) => {
        const dish = ALL_DINNERS.find((d) => d.name === name);
        if (!dish) return;
        lines.push(`--- ${dish.name} ---`);
        lines.push("No thanks");
        dish.variants.forEach((v) => {
          lines.push(`${v.label} \u2014 $${v.price}`);
        });
        lines.push("");
      });
      return lines.join("\n").trim();
    };
    const copyDropdown = () => {
      const text = generateDropdown();
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {
        const el = document.createElement("textarea");
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    };
    return /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("div", { style: styles.genCard }, /* @__PURE__ */ import_react4.default.createElement("div", { style: styles.genTitle }, "This week's dinner lineup"), /* @__PURE__ */ import_react4.default.createElement("div", { style: styles.genHint }, "Check the dishes you're offering. The order picker, text parser, and shopping list follow this instantly. Existing orders aren't affected. The customer-facing PDF still comes from Claude \u2014 just tell it your picks (or send it a screenshot of this screen)."), selected.length === 0 && /* @__PURE__ */ import_react4.default.createElement("div", { style: styles.parseError }, "No dishes selected \u2014 the Dinner section will be empty on new orders.")), ALL_DINNERS.map((dish) => {
      const isOn = selected.includes(dish.name);
      const prices = dish.variants.map((v) => v.price);
      const lo = Math.min(...prices);
      const hi = Math.max(...prices);
      const priceLabel = lo === hi ? currency(lo) : `${currency(lo)}\u2013${currency(hi)}`;
      return /* @__PURE__ */ import_react4.default.createElement(
        "button",
        {
          key: dish.name,
          style: { ...styles.cookItem, ...isOn ? {} : { opacity: 0.55 } },
          onClick: () => onToggle(dish.name)
        },
        /* @__PURE__ */ import_react4.default.createElement("div", { style: { ...styles.checkbox, ...isOn ? styles.checkboxChecked : {} } }, isOn && /* @__PURE__ */ import_react4.default.createElement(Check, { size: 14, color: "#1a1a1a" })),
        /* @__PURE__ */ import_react4.default.createElement("div", { style: styles.cookItemText }, /* @__PURE__ */ import_react4.default.createElement("div", { style: styles.cookItemName }, dish.name), /* @__PURE__ */ import_react4.default.createElement("div", { style: styles.cookItemVariant }, dish.variants.length, " option", dish.variants.length !== 1 ? "s" : "", " \xB7 ", priceLabel)),
        /* @__PURE__ */ import_react4.default.createElement("div", { style: { ...styles.cookItemQty, color: isOn ? "#5DCAA5" : "#5F5E5A", fontSize: "11px", fontWeight: 700 } }, isOn ? "ON" : "OFF")
      );
    }), selected.length > 0 && /* @__PURE__ */ import_react4.default.createElement("div", { style: styles.genCard }, /* @__PURE__ */ import_react4.default.createElement("div", { style: styles.genTitle }, "Publish this week's menu"), /* @__PURE__ */ import_react4.default.createElement("div", { style: styles.genHint }, "Pushes the checked dishes and prices to your order form instantly. Customers see the new menu the moment you publish. Optionally add the menu PDF link and a week label that show on the form."), /* @__PURE__ */ import_react4.default.createElement("label", { style: styles.miniLabel }, "Week label (optional)"), /* @__PURE__ */ import_react4.default.createElement(
      "input",
      {
        style: styles.input,
        value: weekLabel,
        onChange: (e) => setWeekLabel(e.target.value),
        placeholder: "e.g. Week of June 22 \xB7 Delivery June 25"
      }
    ), /* @__PURE__ */ import_react4.default.createElement("label", { style: styles.miniLabel }, "Menu PDF link (optional)"), /* @__PURE__ */ import_react4.default.createElement(
      "input",
      {
        style: styles.input,
        value: pdfUrl,
        onChange: (e) => setPdfUrl(e.target.value),
        placeholder: "https://...workers.dev/LTB_Weekly_Menu.pdf"
      }
    ), /* @__PURE__ */ import_react4.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, marginTop: "10px", background: publishMsg?.ok ? "#1D9E75" : void 0 },
        onClick: doPublish,
        disabled: publishing
      },
      publishing ? "Publishing\u2026" : publishMsg?.ok ? "\u2713 Published!" : "Publish to order form"
    ), publishMsg && /* @__PURE__ */ import_react4.default.createElement("div", { style: publishMsg.ok ? styles.publishOk : styles.publishErr }, publishMsg.text)), USE_LEGACY_CSV && selected.length > 0 && /* @__PURE__ */ import_react4.default.createElement("div", { style: styles.genCard }, /* @__PURE__ */ import_react4.default.createElement("div", { style: styles.genTitle }, "Google Form dropdown options"), /* @__PURE__ */ import_react4.default.createElement("div", { style: styles.genHint }, 'Copy these and paste them into your Google Form question options for the week. Each dish gets a "No thanks" option first, then each size and price.'), /* @__PURE__ */ import_react4.default.createElement("button", { style: { ...styles.saveBtn, marginTop: "8px", background: copied ? "#1D9E75" : void 0 }, onClick: copyDropdown }, copied ? "\u2713 Copied to clipboard!" : "Copy form options")));
  }

  // src/components/OrderInputs.jsx
  var import_react5 = __toESM(require_react());
  function StatsBar({ stats }) {
    return /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.statsBar }, /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.statTile }, /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.statValue }, stats.active), /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.statLabel }, "Active")), /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.statTile }, /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.statValue }, currency(stats.booked)), /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.statLabel }, "This week")), /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.statTile }, /* @__PURE__ */ import_react5.default.createElement("div", { style: { ...styles.statValue, ...stats.unpaid > 0 ? { color: "#EF9F27" } : {} } }, currency(stats.unpaid)), /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.statLabel }, "Unpaid")));
  }
  function PasteOrderCard({ menu, onParsed, onCancel }) {
    const [text, setText] = (0, import_react5.useState)("");
    const [imageFile, setImageFile] = (0, import_react5.useState)(null);
    const [parsing, setParsing] = (0, import_react5.useState)(false);
    const [parseError, setParseError] = (0, import_react5.useState)(null);
    const canParse = !!text.trim() || !!imageFile;
    const onPickImage = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) setImageFile(file);
      e.target.value = "";
    };
    const parse = async () => {
      if (!canParse) return;
      setParsing(true);
      setParseError(null);
      let imageBase64 = null;
      if (imageFile) {
        try {
          imageBase64 = await fileToJpegBase64(imageFile);
        } catch (e) {
          setParseError("Couldn't read the photo file. If it's a photo from your camera roll (HEIC), try taking a screenshot of it and attaching that instead.");
          setParsing(false);
          return;
        }
      }
      try {
        const draft = await parseOrderText(text.trim(), imageBase64, menu);
        if (draft.items.length === 0 && !draft.notes) {
          setParseError("Couldn't find any menu items in that. Add the order manually?");
          setParsing(false);
          return;
        }
        onParsed(draft);
      } catch (e) {
        const msg = e && e.message || "";
        if (msg === "OUT_OF_CREDITS") {
          setParseError("Out of Anthropic API credits \u2014 top up at console.anthropic.com to restore AI parsing. You can still add orders manually in the meantime.");
        } else if (imageBase64 && msg.startsWith("Non-JSON response (HTTP 200)")) {
          setParseError("Claude's artifact platform doesn't support reading photos yet (text works fine). Type the circled items into the text box instead \u2014 the photo button will start working if Anthropic enables image support.");
        } else {
          const detail = msg ? ` (${msg})` : "";
          setParseError(`Couldn't process that${detail}. Try again, or add the order manually.`);
        }
        setParsing(false);
      }
    };
    return /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.formCard }, /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.formHeader }, /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.formTitle }, "Paste a customer order"), /* @__PURE__ */ import_react5.default.createElement("button", { style: styles.iconBtn, onClick: onCancel, "aria-label": "Cancel" }, /* @__PURE__ */ import_react5.default.createElement(X, { size: 18 }))), /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.pasteHint }, "Paste their text and I'll match it to the current menu and pre-fill the order \u2014 you just add their name and double-check. Items from an old menu get flagged in notes instead of guessed. (Photo reading is built in but waiting on platform support \u2014 text is the reliable path.)"), /* @__PURE__ */ import_react5.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "90px" },
        placeholder: 'e.g. "Hey! Can I get a large mushroom noodles, 2 quesos (will return one jar), and a pineapple?"',
        value: text,
        onChange: (e) => setText(e.target.value)
      }
    ), /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.attachRow }, /* @__PURE__ */ import_react5.default.createElement("label", { style: styles.attachBtn }, /* @__PURE__ */ import_react5.default.createElement(ImageIcon, { size: 15 }), imageFile ? "Change photo" : "Attach a photo", /* @__PURE__ */ import_react5.default.createElement("input", { type: "file", accept: "image/*", onChange: onPickImage, style: { display: "none" } })), imageFile && /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.attachChip }, /* @__PURE__ */ import_react5.default.createElement("span", { style: styles.attachName }, imageFile.name || "photo"), /* @__PURE__ */ import_react5.default.createElement("button", { style: styles.iconBtn, onClick: () => setImageFile(null), "aria-label": "Remove photo" }, /* @__PURE__ */ import_react5.default.createElement(X, { size: 14 })))), parseError && /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.parseError }, parseError), /* @__PURE__ */ import_react5.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, ...!canParse || parsing ? styles.saveBtnDisabled : {} },
        onClick: parse,
        disabled: !canParse || parsing
      },
      parsing ? imageFile ? "Reading the photo..." : "Reading order..." : "Build the order"
    ));
  }
  function AmendOrderCard({ menu, orders, onAmended, onCancel }) {
    const [selectedId, setSelectedId] = (0, import_react5.useState)(orders.length === 1 ? orders[0].id : "");
    const [text, setText] = (0, import_react5.useState)("");
    const [parsing, setParsing] = (0, import_react5.useState)(false);
    const [parseError, setParseError] = (0, import_react5.useState)(null);
    const selectedOrder = orders.find((o) => o.id === selectedId) || null;
    const canParse = !!selectedOrder && !!text.trim();
    const parse = async () => {
      if (!canParse) return;
      setParsing(true);
      setParseError(null);
      try {
        const draft = await parseAmendment(selectedOrder, text.trim(), menu);
        if (draft.items.length === 0) {
          setParseError("That left the order with no items. If you meant to clear it, edit the order directly instead.");
          setParsing(false);
          return;
        }
        onAmended(draft);
      } catch (e) {
        const msg = e && e.message || "";
        const detail = msg ? ` (${msg})` : "";
        if ((e && e.message) === "OUT_OF_CREDITS") {
          setParseError("Out of Anthropic API credits \u2014 top up at console.anthropic.com to restore AI features.");
        } else {
          setParseError(`Couldn't process that change${detail}. Try again, or edit the order directly.`);
        }
        setParsing(false);
      }
    };
    return /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.formCard }, /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.formHeader }, /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.formTitle }, "Amend an order via text"), /* @__PURE__ */ import_react5.default.createElement("button", { style: styles.iconBtn, onClick: onCancel, "aria-label": "Cancel" }, /* @__PURE__ */ import_react5.default.createElement(X, { size: 18 }))), orders.length === 0 ? /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.pasteHint }, "No active orders to amend yet.") : /* @__PURE__ */ import_react5.default.createElement(import_react5.default.Fragment, null, /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.pasteHint }, "Pick the customer's order, paste their follow-up message, and I'll apply the change and open the updated order for you to review before saving."), /* @__PURE__ */ import_react5.default.createElement("label", { style: styles.label }, "Which order?"), /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.amendOrderPicker }, orders.map((o) => /* @__PURE__ */ import_react5.default.createElement(
      "button",
      {
        key: o.id,
        style: { ...styles.amendOrderChip, ...selectedId === o.id ? styles.amendOrderChipActive : {} },
        onClick: () => setSelectedId(o.id)
      },
      /* @__PURE__ */ import_react5.default.createElement("span", { style: styles.amendChipName }, o.customer),
      /* @__PURE__ */ import_react5.default.createElement("span", { style: styles.amendChipMeta }, (o.items || []).reduce((s, it) => s + it.qty, 0), " items \xB7 ", currency(o.total))
    ))), selectedOrder && /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.amendCurrentBox }, /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.amendCurrentTitle }, "Current order:"), (selectedOrder.items || []).map((it, i) => /* @__PURE__ */ import_react5.default.createElement("div", { key: i, style: styles.amendCurrentItem }, it.qty, "\xD7 ", it.name, " ", /* @__PURE__ */ import_react5.default.createElement("span", { style: styles.orderItemVariant }, "(", isPerLbItem2(it.name) && it.weight > 0 ? `${it.weight} lb` : it.variant, ")")))), /* @__PURE__ */ import_react5.default.createElement("label", { style: styles.label }, "Their follow-up message"), /* @__PURE__ */ import_react5.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "80px" },
        placeholder: 'e.g. "Actually can you make the curry large, and add a dozen cookies?"',
        value: text,
        onChange: (e) => setText(e.target.value)
      }
    ), parseError && /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.parseError }, parseError), /* @__PURE__ */ import_react5.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, ...!canParse || parsing ? styles.saveBtnDisabled : {} },
        onClick: parse,
        disabled: !canParse || parsing
      },
      parsing ? "Applying the change..." : "Apply change"
    )));
  }
  function CsvImportCard({ menu, onImport, onCancel }) {
    const [text, setText] = (0, import_react5.useState)("");
    const [parsing, setParsing] = (0, import_react5.useState)(false);
    const [progress, setProgress] = (0, import_react5.useState)(null);
    const [results, setResults] = (0, import_react5.useState)(null);
    const [parseError, setParseError] = (0, import_react5.useState)(null);
    const run = async () => {
      setParseError(null);
      const rows = parseDelimited(text);
      if (rows.length < 2) {
        setParseError("Need a header row plus at least one order row. Copy the rows from your Sheet including the header.");
        return;
      }
      const headers = rows[0].map((h) => h.trim());
      const dataRows = rows.slice(1);
      setParsing(true);
      setProgress({ done: 0, total: dataRows.length });
      const out = [];
      for (let r = 0; r < dataRows.length; r++) {
        const cells = dataRows[r];
        const headerMap = {};
        headers.forEach((h, i) => {
          headerMap[h] = cells[i] || "";
        });
        const { customer, text: orderText } = rowToOrderText(headerMap);
        if (!orderText.trim()) {
          setProgress({ done: r + 1, total: dataRows.length });
          continue;
        }
        try {
          const parsed = await parseOrderText(orderText, null, menu);
          out.push({
            customer: customer || `Row ${r + 1}`,
            order: { ...parsed, customer: customer || `Row ${r + 1}` },
            error: null
          });
        } catch (e) {
          out.push({
            customer: customer || `Row ${r + 1}`,
            order: null,
            error: e && e.message || "parse failed"
          });
        }
        setProgress({ done: r + 1, total: dataRows.length });
      }
      setResults(out);
      setParsing(false);
    };
    const importAll = () => {
      const good = results.filter((r) => r.order && r.order.items.length > 0);
      onImport(good.map((r) => r.order));
    };
    const goodCount = results ? results.filter((r) => r.order && r.order.items.length > 0).length : 0;
    return /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.formCard }, /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.formHeader }, /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.formTitle }, "Import from Google Sheet"), /* @__PURE__ */ import_react5.default.createElement("button", { style: styles.iconBtn, onClick: onCancel, "aria-label": "Cancel" }, /* @__PURE__ */ import_react5.default.createElement(X, { size: 18 }))), !results ? /* @__PURE__ */ import_react5.default.createElement(import_react5.default.Fragment, null, /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.pasteHint }, "In your Google Sheet, select the order rows ", /* @__PURE__ */ import_react5.default.createElement("strong", null, "including the header row"), ", copy, and paste below. Each row becomes an order you can review before saving."), /* @__PURE__ */ import_react5.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "120px", fontSize: "12px" },
        placeholder: "Paste your copied spreadsheet rows here...",
        value: text,
        onChange: (e) => setText(e.target.value)
      }
    ), parseError && /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.parseError }, parseError), parsing && progress && /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.csvProgress }, "Reading orders... ", progress.done, "/", progress.total), /* @__PURE__ */ import_react5.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, ...!text.trim() || parsing ? styles.saveBtnDisabled : {} },
        onClick: run,
        disabled: !text.trim() || parsing
      },
      parsing ? "Reading..." : "Read orders"
    )) : /* @__PURE__ */ import_react5.default.createElement(import_react5.default.Fragment, null, /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.pasteHint }, goodCount, " order", goodCount !== 1 ? "s" : "", " ready to import", results.length - goodCount > 0 ? `, ${results.length - goodCount} with issues` : "", "."), /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.csvResultsList }, results.map((r, i) => /* @__PURE__ */ import_react5.default.createElement("div", { key: i, style: styles.csvResultRow }, /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.csvResultName }, r.customer), r.order && r.order.items.length > 0 ? /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.csvResultItems }, r.order.items.map((it, j) => /* @__PURE__ */ import_react5.default.createElement("span", { key: j, style: styles.csvResultItem }, it.qty, "\xD7 ", it.name, j < r.order.items.length - 1 ? "," : "")), r.order.reviewReasons && r.order.reviewReasons.length > 0 && /* @__PURE__ */ import_react5.default.createElement("span", { style: styles.csvResultFlag }, " \xB7 ", r.order.reviewReasons.length, " to review")) : /* @__PURE__ */ import_react5.default.createElement("div", { style: styles.csvResultError }, r.error ? "Could not read this row" : "No items matched")))), /* @__PURE__ */ import_react5.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, ...goodCount === 0 ? styles.saveBtnDisabled : {} },
        onClick: importAll,
        disabled: goodCount === 0
      },
      "Import ",
      goodCount,
      " order",
      goodCount !== 1 ? "s" : ""
    ), /* @__PURE__ */ import_react5.default.createElement("button", { style: styles.csvBackBtn, onClick: () => {
      setResults(null);
      setText("");
    } }, "Start over")));
  }

  // src/components/OrderForm.jsx
  var import_react6 = __toESM(require_react());
  function OrderForm({ menu, initial, recentCustomers, regulars, onSave, onCancel }) {
    const isEdit = !!initial?.id;
    const [customer, setCustomer] = (0, import_react6.useState)(initial?.customer || "");
    const [items, setItems] = (0, import_react6.useState)(initial?.items || []);
    const [jarSwaps, setJarSwaps] = (0, import_react6.useState)(initial?.jarSwaps || 0);
    const [containerReturns, setContainerReturns] = (0, import_react6.useState)(initial?.containerReturns || 0);
    const [notes, setNotes] = (0, import_react6.useState)(initial?.notes || "");
    const [discountType, setDiscountType] = (0, import_react6.useState)(initial?.discountType || null);
    const [discountValue, setDiscountValue] = (0, import_react6.useState)(initial?.discountValue ? String(initial.discountValue) : "");
    const [customCharges, setCustomCharges] = (0, import_react6.useState)(initial?.customCharges || []);
    const [waiveSurcharge, setWaiveSurcharge] = (0, import_react6.useState)(!!initial?.waiveSurcharge);
    const [pickerCategory, setPickerCategory] = (0, import_react6.useState)(null);
    const [reviewReasons, setReviewReasons] = (0, import_react6.useState)(initial?.reviewReasons || []);
    const [expandedItem, setExpandedItem] = (0, import_react6.useState)(null);
    const [showReview, setShowReview] = (0, import_react6.useState)(false);
    const discNum = parseFloat(discountValue) || 0;
    const itemsTotal = itemsBaseTotal(items);
    const disc = discountAmount(itemsTotal, discountType, discNum);
    const total = orderTotal(items, jarSwaps, containerReturns, discountType, discNum, customCharges, waiveSurcharge);
    const itemCount = items.reduce((s, it) => s + it.qty, 0);
    const findItemIndex = (category, name, variant) => items.findIndex((i) => i.category === category && i.name === name && i.variant === variant.label);
    const addItem = (category, name, variant) => {
      const base = { category, name, variant: variant.label, price: variant.price, cost: variant.cost, qty: 1, note: "", upcharge: null };
      if (isPerLbItem2(name)) {
        base.weightPending = true;
        base.price = 0;
        base.cost = 0;
      }
      setItems((prev) => [...prev, base]);
    };
    const setQty = (idx, qty) => {
      setItems((prev) => {
        const next = [...prev];
        if (qty <= 0) next.splice(idx, 1);
        else next[idx] = { ...next[idx], qty };
        return next;
      });
    };
    const setItemNote = (idx, note) => {
      setItems((prev) => prev.map((it, i) => i === idx ? { ...it, note } : it));
    };
    const setItemUpcharge = (idx, label, amount) => {
      setItems((prev) => prev.map((it, i) => {
        if (i !== idx) return it;
        if (!label && !amount) return { ...it, upcharge: null };
        return { ...it, upcharge: { label: label || "Upcharge", amount: parseFloat(amount) || 0 } };
      }));
    };
    const setItemWeight = (idx, weightStr) => {
      setItems((prev) => prev.map((it, i) => {
        if (i !== idx) return it;
        const w = parseFloat(weightStr);
        const updated = { ...it, weight: w > 0 ? w : void 0 };
        return isPerLbItem2(it.name) && w > 0 ? repricePerLbItem(updated) : updated;
      }));
    };
    const hasPerLbItems = items.some((it) => isPerLbItem2(it.name));
    const repriceAllSousVide = () => {
      setItems((prev) => prev.map((it) => isPerLbItem2(it.name) ? repricePerLbItem(it) : it));
    };
    const addCustomCharge = () => setCustomCharges((prev) => [...prev, { id: uid(), label: "", amount: "" }]);
    const updateCustomCharge = (id, field, val) => setCustomCharges((prev) => prev.map((ch) => ch.id === id ? { ...ch, [field]: val } : ch));
    const removeCustomCharge = (id) => setCustomCharges((prev) => prev.filter((ch) => ch.id !== id));
    const dismissReview = (i) => setReviewReasons((prev) => prev.filter((_, idx) => idx !== i));
    const save = () => {
      if (!customer.trim() || items.length === 0) return;
      const cleanCharges = customCharges.map((ch) => ({ id: ch.id, label: (ch.label || "").trim(), amount: parseFloat(ch.amount) || 0 })).filter((ch) => ch.label && ch.amount);
      const matchedReg = (regulars || []).find((r) => regularMatchType(r, customer.trim()) !== "none");
      const address = initial?.address || matchedReg?.address || "";
      const phone = initial?.phone || matchedReg?.phone || "";
      onSave({
        id: initial?.id || uid(),
        customer: customer.trim(),
        address,
        phone,
        items,
        jarSwaps,
        containerReturns,
        notes: notes.trim(),
        discountType: discNum > 0 ? discountType : null,
        discountValue: discNum > 0 ? discNum : 0,
        customCharges: cleanCharges,
        waiveSurcharge,
        total: orderTotal(items, jarSwaps, containerReturns, discountType, discNum, cleanCharges, waiveSurcharge),
        status: initial?.status || "Ordered",
        paid: initial?.paid || false,
        archived: initial?.archived || false,
        createdAt: initial?.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      });
    };
    const showChips = !isEdit && !customer.trim() && recentCustomers.length > 0;
    const selectedByCategory = (0, import_react6.useMemo)(() => {
      const counts = {};
      items.forEach((it) => {
        counts[it.category] = (counts[it.category] || 0) + it.qty;
      });
      return counts;
    }, [items]);
    return /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.formCard }, /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.formHeader }, /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.formTitle }, isEdit ? `Edit order \u2014 ${initial.customer}` : "New order"), /* @__PURE__ */ import_react6.default.createElement("button", { style: styles.iconBtn, onClick: onCancel, "aria-label": "Cancel" }, /* @__PURE__ */ import_react6.default.createElement(X, { size: 18 }))), reviewReasons.length > 0 && /* @__PURE__ */ import_react6.default.createElement("button", { style: styles.reviewOpenBtn, onClick: () => setShowReview(true) }, /* @__PURE__ */ import_react6.default.createElement(AlertTriangle, { size: 16 }), /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.reviewOpenText }, /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.reviewOpenTitle }, reviewReasons.length, " thing", reviewReasons.length !== 1 ? "s" : "", " to sort out"), /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.reviewOpenSub }, "Tap to work through them")), /* @__PURE__ */ import_react6.default.createElement(ChevronDown, { size: 16, style: { transform: "rotate(-90deg)" } })), showReview && /* @__PURE__ */ import_react6.default.createElement(
      ReviewModal,
      {
        reasons: reviewReasons,
        items,
        onApplyNote: setItemNote,
        onApplyUpcharge: setItemUpcharge,
        onApplyWeight: setItemWeight,
        onAddCustomCharge: (label, amount) => setCustomCharges((prev) => [...prev, { id: uid(), label, amount: String(amount) }]),
        onResolve: (i) => dismissReview(i),
        onClose: () => setShowReview(false)
      }
    ), /* @__PURE__ */ import_react6.default.createElement("label", { style: styles.label }, "Customer"), /* @__PURE__ */ import_react6.default.createElement(
      "input",
      {
        style: styles.input,
        placeholder: "Who's this for?",
        value: customer,
        onChange: (e) => setCustomer(e.target.value),
        autoFocus: !isEdit && items.length > 0
      }
    ), showChips && /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.chipRow }, recentCustomers.map((name) => /* @__PURE__ */ import_react6.default.createElement("button", { key: name, style: styles.chip, onClick: () => setCustomer(name) }, name))), /* @__PURE__ */ import_react6.default.createElement("label", { style: styles.label }, "Items"), itemCount > 0 && /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.selectedSummary }, itemCount, " item", itemCount !== 1 ? "s" : "", " selected \xB7 ", currency(itemsTotal)), /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.categoryGrid }, Object.keys(menu).map((cat) => /* @__PURE__ */ import_react6.default.createElement(
      "button",
      {
        key: cat,
        style: {
          ...styles.categoryBtn,
          ...pickerCategory === cat ? styles.categoryBtnActive : {}
        },
        onClick: () => setPickerCategory(pickerCategory === cat ? null : cat)
      },
      CATEGORY_LABELS[cat],
      selectedByCategory[cat] > 0 && /* @__PURE__ */ import_react6.default.createElement("span", { style: styles.catCount }, selectedByCategory[cat]),
      pickerCategory === cat ? /* @__PURE__ */ import_react6.default.createElement(ChevronUp, { size: 16 }) : /* @__PURE__ */ import_react6.default.createElement(ChevronDown, { size: 16 })
    ))), pickerCategory && /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.picker }, menu[pickerCategory].map((menuItem) => /* @__PURE__ */ import_react6.default.createElement("div", { key: menuItem.name, style: styles.pickerGroup }, /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.pickerGroupName }, menuItem.name), /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.pickerVariants }, menuItem.variants.map((variant) => {
      const idx = findItemIndex(pickerCategory, menuItem.name, variant);
      const selected = idx >= 0;
      return /* @__PURE__ */ import_react6.default.createElement(
        "div",
        {
          key: variant.label,
          style: { ...styles.variantBtn, ...selected ? styles.variantBtnSelected : {} },
          onClick: () => !selected && addItem(pickerCategory, menuItem.name, variant),
          role: "button",
          tabIndex: 0
        },
        /* @__PURE__ */ import_react6.default.createElement("span", { style: styles.variantLabel }, variant.label),
        selected ? /* @__PURE__ */ import_react6.default.createElement(QtyControl, { value: items[idx].qty, onChange: (q) => setQty(idx, q) }) : /* @__PURE__ */ import_react6.default.createElement("span", { style: styles.variantPrice }, currency(variant.price))
      );
    }))))), items.length > 0 && /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.reviewList }, items.map((it, idx) => {
      const open = expandedItem === idx;
      const hasExtra = it.note || it.upcharge && typeof it.upcharge === "object" && (it.upcharge.label || it.upcharge.amount);
      return /* @__PURE__ */ import_react6.default.createElement("div", { key: `${it.category}-${it.name}-${it.variant}-${idx}`, style: styles.reviewItemCard }, /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.reviewRow }, /* @__PURE__ */ import_react6.default.createElement(
        "button",
        {
          style: styles.reviewItemMain,
          onClick: () => setExpandedItem(open ? null : idx)
        },
        /* @__PURE__ */ import_react6.default.createElement("span", { style: styles.reviewText }, it.qty, "\xD7 ", it.name, " ", /* @__PURE__ */ import_react6.default.createElement("span", { style: styles.orderItemVariant }, "(", it.variant, ")")),
        hasExtra && /* @__PURE__ */ import_react6.default.createElement("span", { style: styles.itemExtraDot })
      ), /* @__PURE__ */ import_react6.default.createElement(QtyControl, { value: it.qty, onChange: (q) => setQty(idx, q) })), !open && isPerLbItem2(it.name) && (it.weight > 0 ? /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.itemUpchargePreview }, it.weight, " lb \xB7 ", currency(it.price)) : /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.itemUpchargeNeedsPrice }, "set weight \u2304")), !open && it.note && /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.itemNotePreview }, "\u201C", it.note, "\u201D"), !open && it.upcharge && typeof it.upcharge === "object" && it.upcharge.amount > 0 ? /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.itemUpchargePreview }, "+ ", it.upcharge.label, " (", currency(it.upcharge.amount), ")") : null, !open && it.upcharge && typeof it.upcharge === "object" && it.upcharge.label && !it.upcharge.amount ? /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.itemUpchargeNeedsPrice }, "+ ", it.upcharge.label, " \u2014 set a price \u2304") : null, open && /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.itemEditor }, isPerLbItem2(it.name) && /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.weightDeferNote }, "Priced by weight (", currency(PER_LB_ITEMS[it.name].pricePerLb), "/lb + $1.50 bag). Set the actual weight from the order after you've weighed it."), /* @__PURE__ */ import_react6.default.createElement("label", { style: styles.miniLabel }, "Note for this item"), /* @__PURE__ */ import_react6.default.createElement(
        "input",
        {
          style: styles.input,
          placeholder: "e.g. chili oil on the side",
          value: it.note || "",
          onChange: (e) => setItemNote(idx, e.target.value)
        }
      ), /* @__PURE__ */ import_react6.default.createElement("label", { style: styles.miniLabel }, "Upcharge (optional)"), /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.upchargeRow }, /* @__PURE__ */ import_react6.default.createElement(
        "input",
        {
          style: { ...styles.input, flex: 2, marginTop: 0 },
          placeholder: "label, e.g. extra protein",
          value: it.upcharge?.label || "",
          onChange: (e) => setItemUpcharge(idx, e.target.value, it.upcharge?.amount || "")
        }
      ), /* @__PURE__ */ import_react6.default.createElement(
        "input",
        {
          style: { ...styles.input, flex: 1, marginTop: 0 },
          type: "number",
          inputMode: "decimal",
          placeholder: "$",
          value: it.upcharge?.amount || "",
          onChange: (e) => setItemUpcharge(idx, it.upcharge?.label || "Upcharge", e.target.value)
        }
      )), /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.itemEditorActions }, hasExtra && /* @__PURE__ */ import_react6.default.createElement(
        "button",
        {
          style: styles.clearItemExtra,
          onClick: () => {
            setItemNote(idx, "");
            setItemUpcharge(idx, "", "");
          }
        },
        "Clear"
      ), /* @__PURE__ */ import_react6.default.createElement("button", { style: styles.doneItemBtn, onClick: () => setExpandedItem(null) }, "Done"))));
    })), /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.loopRow }, /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.loopField }, /* @__PURE__ */ import_react6.default.createElement("label", { style: styles.label }, "Jar swaps"), /* @__PURE__ */ import_react6.default.createElement(QtyControl, { value: jarSwaps, onChange: setJarSwaps }), /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.loopHint }, "\u2212$2.00 each")), /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.loopField }, /* @__PURE__ */ import_react6.default.createElement("label", { style: styles.label }, "Containers returned"), /* @__PURE__ */ import_react6.default.createElement(QtyControl, { value: containerReturns, onChange: setContainerReturns }), /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.loopHint }, "\u2212$1.00 each"))), /* @__PURE__ */ import_react6.default.createElement("label", { style: styles.label }, "Discount"), /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.discountRow }, [
      [null, "None"],
      ["percent", "%"],
      ["dollar", "$"]
    ].map(([type, label]) => /* @__PURE__ */ import_react6.default.createElement(
      "button",
      {
        key: label,
        style: {
          ...styles.discountTypeBtn,
          ...discountType === type ? styles.discountTypeBtnActive : {}
        },
        onClick: () => setDiscountType(type)
      },
      label
    )), discountType && /* @__PURE__ */ import_react6.default.createElement(
      "input",
      {
        style: { ...styles.input, flex: 1, marginTop: 0 },
        type: "number",
        inputMode: "decimal",
        min: "0",
        placeholder: discountType === "percent" ? "e.g. 10" : "e.g. 5.00",
        value: discountValue,
        onChange: (e) => setDiscountValue(e.target.value)
      }
    )), /* @__PURE__ */ import_react6.default.createElement("label", { style: styles.label }, "Custom charges"), customCharges.length > 0 && /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.customChargeList }, customCharges.map((ch) => /* @__PURE__ */ import_react6.default.createElement("div", { key: ch.id, style: styles.customChargeRow }, /* @__PURE__ */ import_react6.default.createElement(
      "input",
      {
        style: { ...styles.input, flex: 2, marginTop: 0 },
        placeholder: "what for? e.g. special request",
        value: ch.label,
        onChange: (e) => updateCustomCharge(ch.id, "label", e.target.value)
      }
    ), /* @__PURE__ */ import_react6.default.createElement(
      "input",
      {
        style: { ...styles.input, flex: 1, marginTop: 0 },
        type: "number",
        inputMode: "decimal",
        placeholder: "$",
        value: ch.amount,
        onChange: (e) => updateCustomCharge(ch.id, "amount", e.target.value)
      }
    ), /* @__PURE__ */ import_react6.default.createElement("button", { style: styles.iconBtn, onClick: () => removeCustomCharge(ch.id), "aria-label": "Remove charge" }, /* @__PURE__ */ import_react6.default.createElement(X, { size: 16 }))))), /* @__PURE__ */ import_react6.default.createElement("button", { style: styles.addChargeBtn, onClick: addCustomCharge }, /* @__PURE__ */ import_react6.default.createElement(Plus, { size: 15 }), " Add a custom charge"), /* @__PURE__ */ import_react6.default.createElement("label", { style: styles.label }, "Notes"), /* @__PURE__ */ import_react6.default.createElement(
      "textarea",
      {
        style: styles.textarea,
        placeholder: "Anything that isn't tied to one item (delivery time, general message)...",
        value: notes,
        onChange: (e) => setNotes(e.target.value)
      }
    ), itemsUpchargeTotal(items) > 0 && /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.extraLine }, /* @__PURE__ */ import_react6.default.createElement("span", null, "Item upcharges"), /* @__PURE__ */ import_react6.default.createElement("span", null, "+", currency(itemsUpchargeTotal(items)))), disc > 0 && /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.discountLine }, /* @__PURE__ */ import_react6.default.createElement("span", null, "Discount", discountType === "percent" ? ` (${discNum}%)` : ""), /* @__PURE__ */ import_react6.default.createElement("span", null, "\u2212", currency(disc))), customChargesTotal(customCharges) > 0 && /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.extraLine }, /* @__PURE__ */ import_react6.default.createElement("span", null, "Custom charges"), /* @__PURE__ */ import_react6.default.createElement("span", null, "+", currency(customChargesTotal(customCharges)))), /* @__PURE__ */ import_react6.default.createElement(
      "button",
      {
        style: styles.waiveSurchargeRow,
        onClick: () => setWaiveSurcharge((v) => !v)
      },
      /* @__PURE__ */ import_react6.default.createElement("span", { style: styles.waiveSurchargeLabel }, /* @__PURE__ */ import_react6.default.createElement("span", { style: { ...styles.waiveCheckbox, ...waiveSurcharge ? styles.waiveCheckboxOn : {} } }, waiveSurcharge && /* @__PURE__ */ import_react6.default.createElement(Check, { size: 12 })), "Waive the $2 surcharge"),
      /* @__PURE__ */ import_react6.default.createElement("span", { style: styles.waiveSurchargeHint }, waiveSurcharge ? "waived" : "applied")
    ), /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.totalRow }, /* @__PURE__ */ import_react6.default.createElement("span", null, "Total ", waiveSurcharge ? "(surcharge waived)" : "(incl. $2 surcharge)"), /* @__PURE__ */ import_react6.default.createElement("span", { style: { ...styles.totalValue, ...total < 0 ? { color: "#E8799A" } : {} } }, currency(total))), total < 0 && /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.negativeTotalNote }, "This order is below zero, so you'll be covering ", currency(Math.abs(total)), " out of pocket. Saved as-is."), hasPerLbItems && /* @__PURE__ */ import_react6.default.createElement("div", { style: styles.weightDeferNote }, "Sous vide proteins are priced by weight \u2014 save the order, then set each weight from the order card once you've weighed them."), /* @__PURE__ */ import_react6.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, ...!customer.trim() || items.length === 0 ? styles.saveBtnDisabled : {} },
        onClick: save,
        disabled: !customer.trim() || items.length === 0
      },
      isEdit ? "Save changes" : "Save order"
    ));
  }

  // src/components/Modals.jsx
  var import_react7 = __toESM(require_react());

  // src/components/OrderCard.jsx
  var import_react8 = __toESM(require_react());
  function OrderCard({ order, regulars, expanded, onToggle, onUpdate, onDelete, onEdit }) {
    const [confirmDelete, setConfirmDelete] = (0, import_react8.useState)(false);
    const [copied, setCopied] = (0, import_react8.useState)(false);
    const [editingNotes, setEditingNotes] = (0, import_react8.useState)(false);
    const [notesDraft, setNotesDraft] = (0, import_react8.useState)("");
    const [editingContact, setEditingContact] = (0, import_react8.useState)(false);
    const [addressDraft, setAddressDraft] = (0, import_react8.useState)("");
    const [phoneDraft, setPhoneDraft] = (0, import_react8.useState)("");
    const [copyMsg, setCopyMsg] = (0, import_react8.useState)(null);
    const [showInvoice, setShowInvoice] = (0, import_react8.useState)(false);
    const [showReheat, setShowReheat] = (0, import_react8.useState)(false);
    const hasReheatable = (0, import_react8.useMemo)(() => buildReheatBlocks(order).length > 0, [order]);
    const [weightFlow, setWeightFlow] = (0, import_react8.useState)(null);
    const perLbIdxs = (order.items || []).map((it, i) => isPerLbItem2(it.name) ? i : -1).filter((i) => i >= 0);
    const anyPending = perLbIdxs.some((i) => order.items[i].weightPending || !(order.items[i].weight > 0));
    const applyWeight = async (itemIdx, weight, photoBase64) => {
      const items = order.items.map((it, i) => {
        if (i !== itemIdx) return it;
        const updated = repricePerLbItem({ ...it, weight });
        if (photoBase64) updated.hasPhoto = true;
        return updated;
      });
      const patch = {
        items,
        total: orderTotal(items, order.jarSwaps, order.containerReturns, order.discountType, order.discountValue, order.customCharges, order.waiveSurcharge)
      };
      onUpdate(patch);
      if (photoBase64) await savePhoto(order.id, itemIdx, photoBase64);
      setWeightFlow((prev) => {
        if (!prev || prev.mode !== "walk") return null;
        const nextPos = prev.pos + 1;
        return nextPos < prev.queue.length ? { ...prev, pos: nextPos } : null;
      });
    };
    const itemsTotal = (order.items || []).reduce((s, it) => s + it.price * it.qty, 0);
    const disc = discountAmount(itemsTotal, order.discountType, order.discountValue);
    const matchedRegular = (0, import_react8.useMemo)(() => {
      if (!regulars || regulars.length === 0) return null;
      if (order.regularId) {
        const byId = regulars.find((r) => r.id === order.regularId);
        if (byId) return byId;
      }
      return regulars.find((r) => regularMatchType(r, order.customer) === "exact") || null;
    }, [regulars, order.regularId, order.customer]);
    const isRegular = !!matchedRegular;
    const regularDiscount = matchedRegular ? matchedRegular.discountPercent || 0 : 0;
    const discountOn = order.discountType === "percent" && order.discountValue === regularDiscount && regularDiscount > 0;
    const toggleRegularDiscount = (e) => {
      e.stopPropagation();
      if (discountOn) {
        const total = orderTotal(order.items, order.jarSwaps, order.containerReturns, null, 0, order.customCharges, order.waiveSurcharge);
        onUpdate({ discountType: null, discountValue: 0, total });
      } else {
        const total = orderTotal(order.items, order.jarSwaps, order.containerReturns, "percent", regularDiscount, order.customCharges, order.waiveSurcharge);
        onUpdate({ discountType: "percent", discountValue: regularDiscount, total });
      }
    };
    const cycleStatus = (e) => {
      e.stopPropagation();
      const idx = STATUSES.indexOf(order.status);
      onUpdate({ status: STATUSES[(idx + 1) % STATUSES.length] });
    };
    const togglePaid = (e) => {
      e.stopPropagation();
      onUpdate({ paid: !order.paid });
    };
    const doCopy = async () => {
      const ok = await copyText(orderToText(order));
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    };
    const startNotes = () => {
      setNotesDraft(order.notes || "");
      setEditingNotes(true);
    };
    const saveNotes = () => {
      onUpdate({ notes: notesDraft.trim() });
      setEditingNotes(false);
    };
    const startContact = () => {
      setAddressDraft(order.address || "");
      setPhoneDraft(order.phone || "");
      setEditingContact(true);
    };
    const saveContact = () => {
      onUpdate({ address: addressDraft.trim(), phone: phoneDraft.trim() });
      setEditingContact(false);
    };
    return /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.orderCard }, /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.orderCardHeader, onClick: onToggle, role: "button", tabIndex: 0 }, /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.orderCardLeft }, /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.orderCustomer }, order.customer, isRegular && /* @__PURE__ */ import_react8.default.createElement("span", { style: styles.orderRegularStar }, " \u2605")), /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.orderMeta }, (order.items || []).reduce((s, it) => s + it.qty, 0), " item", (order.items || []).reduce((s, it) => s + it.qty, 0) !== 1 ? "s" : "", " ", "\xB7 ", currency(order.total), disc > 0 ? " \xB7 disc" : "", order.createdAt ? ` \xB7 ${formatDate(order.createdAt)}` : "")), /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.orderCardRight }, /* @__PURE__ */ import_react8.default.createElement(
      "button",
      {
        style: {
          ...styles.paidPill,
          ...order.paid ? { background: "#1D9E7522", color: "#1D9E75" } : { background: "#EF9F2722", color: "#EF9F27" }
        },
        onClick: togglePaid
      },
      order.paid ? "Paid" : "Unpaid"
    ), /* @__PURE__ */ import_react8.default.createElement(
      "button",
      {
        style: { ...styles.statusPill, background: `${STATUS_COLORS[order.status]}22`, color: STATUS_COLORS[order.status] },
        onClick: cycleStatus
      },
      order.status
    ), expanded ? /* @__PURE__ */ import_react8.default.createElement(ChevronUp, { size: 18 }) : /* @__PURE__ */ import_react8.default.createElement(ChevronDown, { size: 18 }))), expanded && /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.orderCardBody }, /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.orderItemsList }, (order.items || []).map((it, idx) => {
      const perLb = isPerLbItem2(it.name);
      const pending = perLb && (it.weightPending || !(it.weight > 0));
      const up = it.upcharge && it.upcharge.amount ? it.upcharge.amount : 0;
      const lineTotal = (it.price + up) * it.qty;
      return /* @__PURE__ */ import_react8.default.createElement("div", { key: idx, style: styles.orderItemBlock }, /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.orderItemLine }, /* @__PURE__ */ import_react8.default.createElement("span", null, it.qty, "\xD7 ", it.name, " ", /* @__PURE__ */ import_react8.default.createElement("span", { style: styles.orderItemVariant }, "(", perLb && it.weight > 0 ? `${it.weight} lb` : it.variant, ")")), /* @__PURE__ */ import_react8.default.createElement("span", null, pending ? /* @__PURE__ */ import_react8.default.createElement("span", { style: styles.pendingPrice }, "weigh after shopping") : currency(lineTotal))), it.upcharge && typeof it.upcharge === "object" && it.upcharge.amount > 0 ? /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.orderItemSub }, "+ ", it.upcharge.label, " (", currency(it.upcharge.amount), " ea)") : null, it.note && /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.orderItemNote }, "\u201C", it.note, "\u201D"), perLb && /* @__PURE__ */ import_react8.default.createElement(
        "button",
        {
          style: styles.setWeightBtn,
          onClick: () => setWeightFlow({ mode: "single", queue: [idx], pos: 0 })
        },
        /* @__PURE__ */ import_react8.default.createElement(Scale, { size: 12 }),
        " ",
        it.weight > 0 ? "Update weight" : "Set weight",
        it.hasPhoto ? " \xB7 \u{1F4F7}" : ""
      ));
    }), disc > 0 && /* @__PURE__ */ import_react8.default.createElement("div", { style: { ...styles.orderItemLine, color: "#E8799A" } }, /* @__PURE__ */ import_react8.default.createElement("span", null, "Discount", order.discountType === "percent" ? ` (${order.discountValue}%)` : ""), /* @__PURE__ */ import_react8.default.createElement("span", null, "\u2212", currency(disc))), (order.customCharges || []).map((ch) => /* @__PURE__ */ import_react8.default.createElement("div", { key: ch.id, style: styles.orderItemLine }, /* @__PURE__ */ import_react8.default.createElement("span", null, ch.label), /* @__PURE__ */ import_react8.default.createElement("span", null, currency(Number(ch.amount) || 0))))), (order.jarSwaps > 0 || order.containerReturns > 0) && /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.loopSummary }, order.jarSwaps > 0 && /* @__PURE__ */ import_react8.default.createElement("span", null, order.jarSwaps, " jar swap", order.jarSwaps > 1 ? "s" : "", " (\u2212", currency(order.jarSwaps * 2), ")"), order.containerReturns > 0 && /* @__PURE__ */ import_react8.default.createElement("span", null, order.containerReturns, " container", order.containerReturns > 1 ? "s" : "", " returned (\u2212", currency(order.containerReturns * 1), ")")), isRegular && regularDiscount > 0 && /* @__PURE__ */ import_react8.default.createElement("button", { style: styles.regularDiscountToggle, onClick: toggleRegularDiscount }, /* @__PURE__ */ import_react8.default.createElement("span", { style: styles.regularDiscountLabel }, "\u2605 ", regularDisplayName(matchedRegular), "'s ", regularDiscount, "% discount"), /* @__PURE__ */ import_react8.default.createElement("span", { style: { ...styles.toggleSwitch, ...discountOn ? styles.toggleSwitchOn : {} } }, /* @__PURE__ */ import_react8.default.createElement("span", { style: { ...styles.toggleKnob, ...discountOn ? styles.toggleKnobOn : {} } }))), /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.notesBlock }, editingContact ? /* @__PURE__ */ import_react8.default.createElement(import_react8.default.Fragment, null, /* @__PURE__ */ import_react8.default.createElement(
      "input",
      {
        style: { ...styles.textarea, minHeight: "unset", padding: "8px 10px", marginBottom: "6px" },
        value: addressDraft,
        onChange: (e) => setAddressDraft(e.target.value),
        placeholder: "Address\u2026",
        autoFocus: true
      }
    ), /* @__PURE__ */ import_react8.default.createElement(
      "input",
      {
        style: { ...styles.textarea, minHeight: "unset", padding: "8px 10px", marginBottom: "6px" },
        value: phoneDraft,
        onChange: (e) => setPhoneDraft(e.target.value),
        placeholder: "Phone\u2026"
      }
    ), /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.notesEditActions }, /* @__PURE__ */ import_react8.default.createElement("button", { style: styles.confirmYesGreen, onClick: saveContact }, "Save"), /* @__PURE__ */ import_react8.default.createElement("button", { style: styles.confirmNo, onClick: () => setEditingContact(false) }, "Cancel"))) : order.address || order.phone ? /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.orderContactBlock, onClick: startContact, role: "button", tabIndex: 0 }, order.address && /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.orderContactRow }, "\u{1F4CD} ", order.address), order.phone && /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.orderContactRow }, "\u{1F4DE} ", order.phone), order.address && /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.contactBtnRow, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ import_react8.default.createElement("button", { style: styles.contactActionBtn, onClick: () => {
      navigator.clipboard.writeText(order.address);
      setCopyMsg("Address copied!");
      setTimeout(() => setCopyMsg(null), 2500);
    } }, "Copy address"), /* @__PURE__ */ import_react8.default.createElement("button", { style: styles.contactActionBtn, onClick: () => {
      window.open("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(order.address), "_blank");
    } }, "Open in Maps")), /* @__PURE__ */ import_react8.default.createElement("span", { style: styles.notesEditHint }, "tap to edit"), copyMsg && /* @__PURE__ */ import_react8.default.createElement("span", { style: { ...styles.notesEditHint, color: TEAL_LIGHT } }, copyMsg)) : /* @__PURE__ */ import_react8.default.createElement("button", { style: styles.addNoteBtn, onClick: startContact }, /* @__PURE__ */ import_react8.default.createElement(Pencil, { size: 13 }), "Add address / phone")), /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.notesBlock }, editingNotes ? /* @__PURE__ */ import_react8.default.createElement(import_react8.default.Fragment, null, /* @__PURE__ */ import_react8.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "50px" },
        value: notesDraft,
        onChange: (e) => setNotesDraft(e.target.value),
        placeholder: "Add a note for this order...",
        autoFocus: true
      }
    ), /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.notesEditActions }, /* @__PURE__ */ import_react8.default.createElement("button", { style: styles.confirmYesGreen, onClick: saveNotes }, "Save note"), /* @__PURE__ */ import_react8.default.createElement("button", { style: styles.confirmNo, onClick: () => setEditingNotes(false) }, "Cancel"))) : order.notes ? /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.orderNotes, onClick: startNotes, role: "button", tabIndex: 0 }, order.notes, /* @__PURE__ */ import_react8.default.createElement("span", { style: styles.notesEditHint }, " \u2014 tap to edit")) : /* @__PURE__ */ import_react8.default.createElement("button", { style: styles.addNoteBtn, onClick: startNotes }, /* @__PURE__ */ import_react8.default.createElement(Pencil, { size: 13 }), "Add note")), /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.orderCardFooter }, perLbIdxs.length > 1 && /* @__PURE__ */ import_react8.default.createElement(
      "button",
      {
        style: styles.updateAllWeightsBtn,
        onClick: () => setWeightFlow({ mode: "walk", queue: perLbIdxs, pos: 0 })
      },
      /* @__PURE__ */ import_react8.default.createElement(Scale, { size: 14 }),
      anyPending ? "Set sous vide weights" : "Update sous vide weights",
      " (",
      perLbIdxs.length,
      ")"
    ), /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.statusRow }, STATUSES.map((s) => /* @__PURE__ */ import_react8.default.createElement(
      "button",
      {
        key: s,
        style: {
          ...styles.statusOption,
          ...order.status === s ? { background: STATUS_COLORS[s], color: "#1a1a1a", borderColor: STATUS_COLORS[s] } : {}
        },
        onClick: () => onUpdate({ status: s })
      },
      s
    ))), /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.actionRow }, /* @__PURE__ */ import_react8.default.createElement("button", { style: styles.actionBtn, onClick: onEdit }, /* @__PURE__ */ import_react8.default.createElement(Pencil, { size: 14 }), "Edit"), /* @__PURE__ */ import_react8.default.createElement("button", { style: styles.actionBtn, onClick: doCopy }, /* @__PURE__ */ import_react8.default.createElement(Copy, { size: 14 }), copied ? "Copied!" : "Copy text"), /* @__PURE__ */ import_react8.default.createElement("button", { style: styles.actionBtn, onClick: () => setShowInvoice(true) }, /* @__PURE__ */ import_react8.default.createElement(FileText, { size: 14 }), "Invoice"), /* @__PURE__ */ import_react8.default.createElement(
      "button",
      {
        style: hasReheatable ? styles.actionBtn : { ...styles.actionBtn, opacity: 0.4, cursor: "not-allowed" },
        onClick: () => hasReheatable && setShowReheat(true),
        disabled: !hasReheatable
      },
      /* @__PURE__ */ import_react8.default.createElement(Flame, { size: 14 }),
      "Reheat"
    ), confirmDelete ? /* @__PURE__ */ import_react8.default.createElement("div", { style: styles.confirmRow }, /* @__PURE__ */ import_react8.default.createElement("button", { style: styles.confirmYes, onClick: onDelete }, "Delete"), /* @__PURE__ */ import_react8.default.createElement("button", { style: styles.confirmNo, onClick: () => setConfirmDelete(false) }, "Cancel")) : /* @__PURE__ */ import_react8.default.createElement("button", { style: { ...styles.actionBtn, color: "#993556" }, onClick: () => setConfirmDelete(true) }, /* @__PURE__ */ import_react8.default.createElement(Trash2, { size: 14 }), "Remove")))), showInvoice && /* @__PURE__ */ import_react8.default.createElement(InvoiceModal, { order, onClose: () => setShowInvoice(false) }), showReheat && /* @__PURE__ */ import_react8.default.createElement(ReheatModal, { order, onClose: () => setShowReheat(false) }), weightFlow && (() => {
      const itemIdx = weightFlow.queue[weightFlow.pos];
      const it = order.items[itemIdx];
      if (!it) return null;
      return /* @__PURE__ */ import_react8.default.createElement(
        WeightPhotoModal,
        {
          orderId: order.id,
          itemIdx,
          item: it,
          stepLabel: weightFlow.mode === "walk" ? `${weightFlow.pos + 1} of ${weightFlow.queue.length}` : null,
          onApply: applyWeight,
          onClose: () => setWeightFlow(null)
        }
      );
    })());
  }

  // src/components/CookTabs.jsx
  var import_react9 = __toESM(require_react());
  function ArchiveDeliveredButton({ count, onArchive }) {
    const [confirm, setConfirm] = (0, import_react9.useState)(false);
    if (confirm) {
      return /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.clearConfirmRow }, /* @__PURE__ */ import_react9.default.createElement("span", { style: styles.confirmText }, "Archive all ", count, " delivered order", count !== 1 ? "s" : "", "? They stay in the Money tab."), /* @__PURE__ */ import_react9.default.createElement("button", { style: styles.confirmYesGreen, onClick: () => {
        onArchive();
        setConfirm(false);
      } }, "Archive"), /* @__PURE__ */ import_react9.default.createElement("button", { style: styles.confirmNo, onClick: () => setConfirm(false) }, "Cancel"));
    }
    return /* @__PURE__ */ import_react9.default.createElement("button", { style: styles.clearDeliveredBtn, onClick: () => setConfirm(true) }, /* @__PURE__ */ import_react9.default.createElement(Archive, { size: 14 }), "Archive all delivered (start a new week)");
  }
  function CookingList({ items, orderCount, revenue, checks, onToggle, onReset }) {
    if (items.length === 0) {
      return /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.emptyState }, /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.emptyTitle }, "Nothing to cook yet"), /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.emptyBody }, "Active orders will roll up into a cooking list here."));
    }
    const grouped = {};
    items.forEach((it) => {
      if (!grouped[it.category]) grouped[it.category] = [];
      grouped[it.category].push(it);
    });
    const doneCount = items.filter((it) => checks[it.key]).length;
    return /* @__PURE__ */ import_react9.default.createElement("div", null, revenue > 0 && /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.cookRevenueBar }, /* @__PURE__ */ import_react9.default.createElement("span", { style: styles.cookRevenueLabel }, "In active orders"), /* @__PURE__ */ import_react9.default.createElement("span", { style: styles.cookRevenueValue }, currency(revenue))), /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.cookHeader }, /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.cookSummary }, doneCount, "/", items.length, " done \xB7 from ", orderCount, " active order", orderCount !== 1 ? "s" : ""), doneCount > 0 && /* @__PURE__ */ import_react9.default.createElement("button", { style: styles.resetBtn, onClick: onReset }, /* @__PURE__ */ import_react9.default.createElement(RotateCcw, { size: 13 }), "Reset")), Object.entries(grouped).map(([cat, catItems]) => /* @__PURE__ */ import_react9.default.createElement("div", { key: cat, style: styles.cookCategory }, /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.cookCategoryTitle }, CATEGORY_LABELS[cat]), catItems.map((it) => {
      const isChecked = !!checks[it.key];
      return /* @__PURE__ */ import_react9.default.createElement(
        "button",
        {
          key: it.key,
          style: { ...styles.cookItem, ...isChecked ? styles.cookItemChecked : {} },
          onClick: () => onToggle(it.key)
        },
        /* @__PURE__ */ import_react9.default.createElement("div", { style: { ...styles.checkbox, ...isChecked ? styles.checkboxChecked : {} } }, isChecked && /* @__PURE__ */ import_react9.default.createElement(Check, { size: 14, color: "#1a1a1a" })),
        /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.cookItemText }, /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.cookItemName }, it.name), /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.cookItemVariant }, it.variant)),
        /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.cookItemQty }, "\xD7", it.qty)
      );
    }))));
  }
  function DeliverList({ groups, orderCount, checks, onToggle, onReset }) {
    if (groups.length === 0) {
      return /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.emptyState }, /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.emptyTitle }, "Nothing to deliver yet"), /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.emptyBody }, "Active orders will roll up by customer here."));
    }
    const allItems = groups.flatMap((g) => g.items);
    const doneCount = allItems.filter((it) => checks[it.key]).length;
    return /* @__PURE__ */ import_react9.default.createElement("div", null, /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.cookHeader }, /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.cookSummary }, doneCount, "/", allItems.length, " packed \xB7 ", orderCount, " active order", orderCount !== 1 ? "s" : ""), doneCount > 0 && /* @__PURE__ */ import_react9.default.createElement("button", { style: styles.resetBtn, onClick: onReset }, /* @__PURE__ */ import_react9.default.createElement(RotateCcw, { size: 13 }), "Reset")), groups.map((grp) => {
      const grpDone = grp.items.filter((it) => checks[it.key]).length;
      const allDone = grpDone === grp.items.length;
      return /* @__PURE__ */ import_react9.default.createElement("div", { key: grp.orderId, style: styles.cookCategory }, /* @__PURE__ */ import_react9.default.createElement("div", { style: { ...styles.cookCategoryTitle, ...allDone ? styles.deliverCustDone : {} } }, grp.customer, " \xB7 ", grpDone, "/", grp.items.length), grp.items.map((it) => {
        const isChecked = !!checks[it.key];
        return /* @__PURE__ */ import_react9.default.createElement(
          "button",
          {
            key: it.key,
            style: { ...styles.cookItem, ...isChecked ? styles.cookItemChecked : {} },
            onClick: () => onToggle(it.key)
          },
          /* @__PURE__ */ import_react9.default.createElement("div", { style: { ...styles.checkbox, ...isChecked ? styles.checkboxChecked : {} } }, isChecked && /* @__PURE__ */ import_react9.default.createElement(Check, { size: 14, color: "#1a1a1a" })),
          /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.cookItemText }, /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.cookItemName }, it.name), /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.cookItemVariant }, it.variant)),
          /* @__PURE__ */ import_react9.default.createElement("div", { style: styles.cookItemQty }, "\xD7", it.qty)
        );
      }));
    }));
  }

  // src/components/ShoppingList.jsx
  var import_react10 = __toESM(require_react());
  function ShoppingList({ items, onChange, onGenerate, activeCount, estCost, weekDishes, inventory, onAdjustInventory, onSetInventory, dishNotes, onSaveDishNote }) {
    const [input, setInput] = (0, import_react10.useState)("");
    const [includeStaples, setIncludeStaples] = (0, import_react10.useState)(false);
    const [confirmClear, setConfirmClear] = (0, import_react10.useState)(false);
    const [dishPickerOpen, setDishPickerOpen] = (0, import_react10.useState)(false);
    const [inventoryOpen, setInventoryOpen] = (0, import_react10.useState)(false);
    const [refCardOpen, setRefCardOpen] = (0, import_react10.useState)(false);
    const [refDish, setRefDish] = (0, import_react10.useState)("");
    const [refData, setRefData] = (0, import_react10.useState)(null);
    const [noteText, setNoteText] = (0, import_react10.useState)("");
    const [pickerDish, setPickerDish] = (0, import_react10.useState)(null);
    const [pickerVariant, setPickerVariant] = (0, import_react10.useState)("");
    const [pickerCount, setPickerCount] = (0, import_react10.useState)(1);
    const [pickerStaples, setPickerStaples] = (0, import_react10.useState)(false);
    const allPickerDishes = (0, import_react10.useMemo)(() => {
      const withRecipe = Object.keys(RECIPES);
      const thisWeek = new Set(weekDishes || []);
      return [
        ...withRecipe.filter((d) => thisWeek.has(d)).sort(),
        ...withRecipe.filter((d) => !thisWeek.has(d)).sort()
      ];
    }, [weekDishes]);
    const selectPickerDish = (dishName) => {
      setPickerDish(dishName);
      const recipe = RECIPES[dishName];
      if (!recipe) return;
      const variants = Object.entries(recipe.factors).sort((a, b) => a[1] - b[1]);
      setPickerVariant(variants[0]?.[0] || "");
      setPickerCount(1);
    };
    const servingLabel = (variant) => {
      const m = variant.match(/\(([^)]+)\)/);
      return m ? m[1] : variant;
    };
    const addDishToList = () => {
      if (!pickerDish || !pickerVariant) return;
      const recipe = RECIPES[pickerDish];
      if (!recipe) return;
      const factor = (recipe.factors[pickerVariant] || 1) * pickerCount;
      const lines = [];
      lines.push({ id: uid(), text: `\u2500\u2500 ${pickerDish} (${pickerVariant}${pickerCount > 1 ? ` \xD7 ${pickerCount}` : ""}) \u2500\u2500`, checked: false });
      recipe.base.forEach((ing) => {
        if (ing.staple && !pickerStaples) return;
        const qty = ing.q * factor;
        const qtyStr = qty % 1 === 0 ? String(qty) : qty.toFixed(1).replace(/\.0$/, "");
        lines.push({ id: uid(), text: `${qtyStr}${ing.u ? " " + ing.u : ""} ${ing.name}`, checked: false });
      });
      const extras = recipe.extras?.[pickerVariant] || [];
      extras.forEach((ing) => {
        if (ing.staple && !pickerStaples) return;
        const qty = ing.fixed ? ing.q : ing.q * factor;
        const qtyStr = qty % 1 === 0 ? String(qty) : qty.toFixed(1);
        lines.push({ id: uid(), text: `${qtyStr}${ing.u ? " " + ing.u : ""} ${ing.name}`, checked: false });
      });
      onChange([...items, ...lines]);
      setPickerDish(null);
    };
    const addItems = () => {
      const lines = input.split("\n").map((l) => l.replace(/^[\s•*\-–—]+|^\d+[.)]\s*/g, "").trim()).filter(Boolean);
      if (lines.length === 0) return;
      const additions = lines.map((text) => ({ id: uid(), text, checked: false }));
      onChange([...items, ...additions]);
      setInput("");
    };
    const toggle = (id) => {
      onChange(items.map((it) => it.id === id ? { ...it, checked: !it.checked } : it));
    };
    const remove = (id) => {
      onChange(items.filter((it) => it.id !== id));
    };
    const uncheckAll = () => {
      onChange(items.map((it) => ({ ...it, checked: false })));
    };
    const doneCount = items.filter((it) => it.checked).length;
    return /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.genCard }, /* @__PURE__ */ import_react10.default.createElement("button", { style: styles.collapsibleHeader, onClick: () => {
      setDishPickerOpen((o) => !o);
      setPickerDish(null);
    } }, /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.genTitle }, "Single Dish Ingredient List"), /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.collapseChevron }, dishPickerOpen ? "\u25B2" : "\u25BC")), dishPickerOpen && /* @__PURE__ */ import_react10.default.createElement(import_react10.default.Fragment, null, /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.genHint }, "Pick any dish to get its ingredient list. This week's menu is highlighted."), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.dishPickerGrid }, allPickerDishes.map((d) => {
      const isThisWeek = (weekDishes || []).includes(d);
      const isSelected = pickerDish === d;
      return /* @__PURE__ */ import_react10.default.createElement(
        "button",
        {
          key: d,
          style: {
            ...styles.dishPickerChip,
            ...isSelected ? styles.dishPickerChipSelected : {},
            ...isThisWeek && !isSelected ? styles.dishPickerChipWeek : {}
          },
          onClick: () => selectPickerDish(d)
        },
        isThisWeek && /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.dishPickerDot }, "\u25CF"),
        d
      );
    })), pickerDish && RECIPES[pickerDish] && /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.dishPickerControls }, /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.miniLabel }, "Size"), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.dishPickerVariants }, Object.entries(RECIPES[pickerDish].factors).sort((a, b) => a[1] - b[1]).map(([v]) => /* @__PURE__ */ import_react10.default.createElement(
      "button",
      {
        key: v,
        style: {
          ...styles.dishPickerVariantBtn,
          ...pickerVariant === v ? styles.dishPickerVariantBtnOn : {}
        },
        onClick: () => setPickerVariant(v)
      },
      v,
      /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.dishPickerServing }, " \xB7 ", servingLabel(v))
    ))), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.dishPickerCountRow }, /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.miniLabel }, "Batches"), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.dishPickerCounter }, /* @__PURE__ */ import_react10.default.createElement("button", { style: styles.inventoryBtn, onClick: () => setPickerCount((c) => Math.max(1, c - 1)) }, "\u2212"), /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.inventoryCount }, pickerCount), /* @__PURE__ */ import_react10.default.createElement("button", { style: styles.inventoryBtn, onClick: () => setPickerCount((c) => c + 1) }, "+"))), /* @__PURE__ */ import_react10.default.createElement("label", { style: { ...styles.genToggleRow, marginTop: "8px" } }, /* @__PURE__ */ import_react10.default.createElement(
      "input",
      {
        type: "checkbox",
        checked: pickerStaples,
        onChange: (e) => setPickerStaples(e.target.checked),
        style: styles.genCheckbox
      }
    ), "Include pantry staples"), /* @__PURE__ */ import_react10.default.createElement("button", { style: { ...styles.saveBtn, marginTop: "10px" }, onClick: addDishToList }, "Add ingredients to list")))), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.inventorySection }, /* @__PURE__ */ import_react10.default.createElement("button", { style: styles.collapsibleHeader, onClick: () => setInventoryOpen((o) => !o) }, /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.inventoryTitle }, "Sauce & Add-on Inventory"), /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.collapseChevron }, inventoryOpen ? "\u25B2" : "\u25BC")), inventoryOpen && /* @__PURE__ */ import_react10.default.createElement(import_react10.default.Fragment, null, /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.inventoryHint }, "Tap +/\u2212 to adjust stock. Auto-decrements when add-ons are ordered. 2oz frozen sauces warn yellow under 5, red under 2."), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.inventoryGroup }, /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.inventoryGroupLabel }, "2oz frozen sauces"), [
      { key: "chimichurri", label: "Chimichurri" },
      { key: "romesco", label: "Romesco" },
      { key: "chermoula", label: "Chermoula" },
      { key: "misoButter", label: "Miso Butter Sauce" },
      { key: "whippedButter", label: "Whipped Lemon Garlic Herb Butter" }
    ].map(({ key, label }) => {
      const count = Number(inventory?.[key]) || 0;
      const countStyle = count < 2 ? styles.inventoryCountRed : count < 5 ? styles.inventoryCountYellow : styles.inventoryCount;
      return /* @__PURE__ */ import_react10.default.createElement("div", { key, style: styles.inventoryRow }, /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.inventoryName }, label), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.inventoryControls }, /* @__PURE__ */ import_react10.default.createElement("button", { style: styles.inventoryBtn, onClick: () => onAdjustInventory(key, -1) }, "\u2212"), /* @__PURE__ */ import_react10.default.createElement("span", { style: countStyle }, count), /* @__PURE__ */ import_react10.default.createElement("button", { style: styles.inventoryBtn, onClick: () => onAdjustInventory(key, 1) }, "+")));
    })), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.inventoryGroup }, /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.inventoryGroupLabel }, "Jars"), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.inventoryRow }, /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.inventoryName }, "Queso")), [
      { key: "queso_0", label: "No Heat (0)" },
      { key: "queso_1", label: "Medium (1 hab.)" },
      { key: "queso_2", label: "Hot (2 hab.)" }
    ].map(({ key, label }) => {
      const count = Number(inventory?.[key]) || 0;
      return /* @__PURE__ */ import_react10.default.createElement("div", { key, style: { ...styles.inventoryRow, paddingLeft: "10px" } }, /* @__PURE__ */ import_react10.default.createElement("span", { style: { ...styles.inventoryName, fontSize: "12px", color: "#9aa5a0" } }, label), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.inventoryControls }, /* @__PURE__ */ import_react10.default.createElement("button", { style: styles.inventoryBtn, onClick: () => onAdjustInventory(key, -1) }, "\u2212"), /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.inventoryCount }, count), /* @__PURE__ */ import_react10.default.createElement("button", { style: styles.inventoryBtn, onClick: () => onAdjustInventory(key, 1) }, "+")));
    }), [{ key: "chiliOil", label: "Chili Oil" }].map(({ key, label }) => {
      const count = Number(inventory?.[key]) || 0;
      return /* @__PURE__ */ import_react10.default.createElement("div", { key, style: styles.inventoryRow }, /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.inventoryName }, label), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.inventoryControls }, /* @__PURE__ */ import_react10.default.createElement("button", { style: styles.inventoryBtn, onClick: () => onAdjustInventory(key, -1) }, "\u2212"), /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.inventoryCount }, count), /* @__PURE__ */ import_react10.default.createElement("button", { style: styles.inventoryBtn, onClick: () => onAdjustInventory(key, 1) }, "+")));
    })))), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.genCard }, /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.genTitle }, "Build list from this week's orders"), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.genHint }, "Reads every active order and adds up the ingredients per recipe. Re-tap any time orders change \u2014 your manual items and checkmarks stay put."), /* @__PURE__ */ import_react10.default.createElement("label", { style: styles.genToggleRow }, /* @__PURE__ */ import_react10.default.createElement(
      "input",
      {
        type: "checkbox",
        checked: includeStaples,
        onChange: (e) => setIncludeStaples(e.target.checked),
        style: styles.genCheckbox
      }
    ), "Include pantry staples (soy, spices, oils, etc.)"), /* @__PURE__ */ import_react10.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, marginTop: "8px", ...activeCount === 0 ? styles.saveBtnDisabled : {} },
        onClick: () => onGenerate(includeStaples),
        disabled: activeCount === 0
      },
      activeCount === 0 ? "No active orders yet" : `Generate from ${activeCount} active order${activeCount !== 1 ? "s" : ""}`
    )), estCost > 0 && /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.shopCostBar }, /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.shopCostLabel }, "Est. ingredient spend for active orders"), /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.shopCostValue }, "~", currency(estCost))), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.shopInputRow }, /* @__PURE__ */ import_react10.default.createElement(
      "textarea",
      {
        style: { ...styles.textarea, minHeight: "44px", flex: 1 },
        placeholder: "Add an item \u2014 or paste a whole list, one item per line",
        value: input,
        onChange: (e) => setInput(e.target.value)
      }
    ), /* @__PURE__ */ import_react10.default.createElement(
      "button",
      {
        style: { ...styles.shopAddBtn, ...!input.trim() ? styles.saveBtnDisabled : {} },
        onClick: addItems,
        disabled: !input.trim()
      },
      /* @__PURE__ */ import_react10.default.createElement(Plus, { size: 18 })
    )), items.length === 0 ? /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.emptyState }, /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.emptyTitle }, "Shopping list is empty"), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.emptyBody }, "Type items one at a time, or paste a whole ingredient list and each line becomes its own entry.")) : /* @__PURE__ */ import_react10.default.createElement(import_react10.default.Fragment, null, /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.cookHeader }, /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.cookSummary }, doneCount, "/", items.length, " in the cart"), doneCount > 0 && /* @__PURE__ */ import_react10.default.createElement("button", { style: styles.resetBtn, onClick: uncheckAll }, /* @__PURE__ */ import_react10.default.createElement(RotateCcw, { size: 13 }), "Uncheck all")), /* @__PURE__ */ import_react10.default.createElement("div", null, items.map((it) => /* @__PURE__ */ import_react10.default.createElement("div", { key: it.id, style: { ...styles.shopItem, ...it.checked ? styles.cookItemChecked : {} } }, /* @__PURE__ */ import_react10.default.createElement("button", { style: styles.shopItemMain, onClick: () => toggle(it.id) }, /* @__PURE__ */ import_react10.default.createElement("div", { style: { ...styles.checkbox, ...it.checked ? styles.checkboxChecked : {} } }, it.checked && /* @__PURE__ */ import_react10.default.createElement(Check, { size: 14, color: "#1a1a1a" })), /* @__PURE__ */ import_react10.default.createElement("span", { style: { ...styles.shopItemText, ...it.checked ? styles.shopItemTextChecked : {} } }, it.text)), /* @__PURE__ */ import_react10.default.createElement("button", { style: styles.shopDeleteBtn, onClick: () => remove(it.id), "aria-label": `Remove ${it.text}` }, /* @__PURE__ */ import_react10.default.createElement(X, { size: 15 }))))), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.shopBulkRow }, doneCount > 0 && /* @__PURE__ */ import_react10.default.createElement("button", { style: styles.resetBtn, onClick: () => onChange(items.filter((it) => !it.checked)) }, /* @__PURE__ */ import_react10.default.createElement(Trash2, { size: 13 }), "Remove checked (", doneCount, ")"), confirmClear ? /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.confirmRow }, /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.confirmText }, "Delete the whole list?"), /* @__PURE__ */ import_react10.default.createElement("button", { style: styles.confirmYes, onClick: () => {
      onChange([]);
      setConfirmClear(false);
    } }, "Clear"), /* @__PURE__ */ import_react10.default.createElement("button", { style: styles.confirmNo, onClick: () => setConfirmClear(false) }, "Cancel")) : /* @__PURE__ */ import_react10.default.createElement("button", { style: { ...styles.resetBtn, color: "#993556" }, onClick: () => setConfirmClear(true) }, /* @__PURE__ */ import_react10.default.createElement(Trash2, { size: 13 }), "Clear list"))), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.inventorySection }, /* @__PURE__ */ import_react10.default.createElement("button", { style: styles.collapsibleHeader, onClick: () => setRefCardOpen((o) => !o) }, /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.inventoryTitle }, "Dish Reference Card"), /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.collapseChevron }, refCardOpen ? "\u25B2" : "\u25BC")), refCardOpen && /* @__PURE__ */ import_react10.default.createElement("div", null, /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.inventoryHint }, "Full ingredient breakdown, margins, and cook notes for any dish."), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.refCardPickerRow }, /* @__PURE__ */ import_react10.default.createElement(
      "select",
      {
        style: styles.refCardSelect,
        value: refDish,
        onChange: (e) => {
          setRefDish(e.target.value);
          setRefData(null);
        }
      },
      /* @__PURE__ */ import_react10.default.createElement("option", { value: "" }, "Select a dish\u2026"),
      (() => {
        const thisWeek = new Set(weekDishes || []);
        const withRecipe = Object.keys(RECIPES);
        const thisWeekDishes = withRecipe.filter((d) => thisWeek.has(d)).sort();
        const otherDishes = withRecipe.filter((d) => !thisWeek.has(d)).sort();
        return [
          thisWeekDishes.length > 0 && /* @__PURE__ */ import_react10.default.createElement("optgroup", { key: "week", label: "This week" }, thisWeekDishes.map((d) => /* @__PURE__ */ import_react10.default.createElement("option", { key: d, value: d }, d))),
          otherDishes.length > 0 && /* @__PURE__ */ import_react10.default.createElement("optgroup", { key: "other", label: "Other dishes" }, otherDishes.map((d) => /* @__PURE__ */ import_react10.default.createElement("option", { key: d, value: d }, d)))
        ].filter(Boolean);
      })()
    ), /* @__PURE__ */ import_react10.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, marginTop: 0, flexShrink: 0, opacity: refDish ? 1 : 0.4 },
        disabled: !refDish,
        onClick: () => {
          if (!refDish) return;
          const recipe = RECIPES[refDish];
          const menuDish = ALL_DINNERS.find((d) => d.name === refDish);
          const variants = menuDish?.variants || [];
          setNoteText((dishNotes || {})[refDish] || "");
          setRefData({ recipe, variants });
        }
      },
      "Load"
    )), refData && /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.refCardBody }, refData.variants.length > 0 && /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.refCardSection }, /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.refCardSectionTitle }, "Margins by variant"), refData.variants.map((v) => {
      const margin = v.price - v.cost;
      const pct = v.price > 0 ? Math.round(margin / v.price * 100) : 0;
      const color = pct >= 55 ? "#5a8f6a" : pct >= 40 ? GOLD : "#993556";
      return /* @__PURE__ */ import_react10.default.createElement("div", { key: v.label, style: styles.refCardRow }, /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.refCardVariantLabel }, v.label), /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.refCardPrice }, currency(v.price)), /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.refCardCost }, "cost ", currency(v.cost)), /* @__PURE__ */ import_react10.default.createElement("span", { style: { ...styles.refCardMargin, color } }, currency(margin), " \xB7 ", pct, "%"));
    })), refData.recipe && /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.refCardSection }, /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.refCardSectionTitle }, "Base ingredients (1\xD7 batch)"), refData.recipe.base.map((ing, i) => /* @__PURE__ */ import_react10.default.createElement("div", { key: i, style: styles.refCardIngRow }, /* @__PURE__ */ import_react10.default.createElement("span", { style: { ...styles.refCardIngName, ...ing.staple ? styles.refCardIngStaple : {} } }, ing.name, ing.staple ? " \u2726" : ""), /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.refCardIngQty }, ing.q, " ", ing.u))), refData.recipe.extras && Object.keys(refData.recipe.extras).length > 0 && /* @__PURE__ */ import_react10.default.createElement("div", { style: { marginTop: "8px" } }, /* @__PURE__ */ import_react10.default.createElement("div", { style: { ...styles.refCardSectionTitle, fontSize: "11px", opacity: 0.7 } }, "Variant extras"), Object.entries(refData.recipe.extras).map(([vLabel, ings]) => /* @__PURE__ */ import_react10.default.createElement("div", { key: vLabel, style: { marginBottom: "6px" } }, /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.refCardExtrasLabel }, vLabel), ings.map((ing, i) => /* @__PURE__ */ import_react10.default.createElement("div", { key: i, style: styles.refCardIngRow }, /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.refCardIngName }, ing.name), /* @__PURE__ */ import_react10.default.createElement("span", { style: styles.refCardIngQty }, ing.q, " ", ing.u))))))), /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.refCardSection }, /* @__PURE__ */ import_react10.default.createElement("div", { style: styles.refCardSectionTitle }, "Cook notes"), /* @__PURE__ */ import_react10.default.createElement(
      "textarea",
      {
        style: styles.refCardNotes,
        placeholder: "Add notes about this dish \u2014 technique reminders, timing, substitutions, anything you want to remember\u2026",
        value: noteText,
        onChange: (e) => setNoteText(e.target.value)
      }
    ), /* @__PURE__ */ import_react10.default.createElement(
      "button",
      {
        style: { ...styles.saveBtn, marginTop: "6px", width: "100%" },
        onClick: () => onSaveDishNote(refDish, noteText)
      },
      "Save notes"
    ))))));
  }

  // src/components/MoneyTab.jsx
  var import_react11 = __toESM(require_react());
  function ProfitChart({ series }) {
    const W = 320, H = 160;
    const padL = 8, padR = 8, padT = 14, padB = 26;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const profits = series.map((s) => s.profit);
    const maxP = Math.max(...profits, 0);
    const minP = Math.min(...profits, 0);
    const range = maxP - minP || 1;
    const yFor = (p) => padT + plotH - (p - minP) / range * plotH;
    const zeroY = yFor(0);
    const n = series.length;
    const slotW = plotW / n;
    const barW = Math.min(slotW * 0.6, 34);
    const labelStep = Math.ceil(n / 6);
    const linePts = series.map((s, i) => {
      const cx = padL + slotW * i + slotW / 2;
      return `${cx},${yFor(s.profit)}`;
    }).join(" ");
    const totalProfit = round2(series.reduce((sum, s) => sum + s.profit, 0));
    const avgProfit = round2(totalProfit / n);
    return /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.chartCard }, /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.chartHeader }, /* @__PURE__ */ import_react11.default.createElement("span", { style: styles.chartTitle }, "Profit over time"), /* @__PURE__ */ import_react11.default.createElement("span", { style: styles.chartSubtitle }, "avg ", currency(avgProfit), "/period")), /* @__PURE__ */ import_react11.default.createElement("svg", { viewBox: `0 0 ${W} ${H}`, style: styles.chartSvg, preserveAspectRatio: "xMidYMid meet" }, /* @__PURE__ */ import_react11.default.createElement("line", { x1: padL, y1: zeroY, x2: W - padR, y2: zeroY, stroke: "#37403c", strokeWidth: "1", strokeDasharray: "3,3" }), series.map((s, i) => {
      const cx = padL + slotW * i + slotW / 2;
      const y = yFor(s.profit);
      const barTop = Math.min(y, zeroY);
      const barH = Math.abs(y - zeroY);
      const positive = s.profit >= 0;
      return /* @__PURE__ */ import_react11.default.createElement(
        "rect",
        {
          key: i,
          x: cx - barW / 2,
          y: barTop,
          width: barW,
          height: Math.max(barH, 1),
          rx: "2",
          fill: positive ? "#1D9E7544" : "#EF444444"
        }
      );
    }), n >= 2 && /* @__PURE__ */ import_react11.default.createElement("polyline", { points: linePts, fill: "none", stroke: "#5DCAA5", strokeWidth: "2", strokeLinejoin: "round", strokeLinecap: "round" }), series.map((s, i) => {
      const cx = padL + slotW * i + slotW / 2;
      return /* @__PURE__ */ import_react11.default.createElement("circle", { key: i, cx, cy: yFor(s.profit), r: "2.5", fill: "#5DCAA5" });
    }), series.map((s, i) => {
      if (i % labelStep !== 0 && i !== n - 1) return null;
      const cx = padL + slotW * i + slotW / 2;
      return /* @__PURE__ */ import_react11.default.createElement("text", { key: i, x: cx, y: H - 8, textAnchor: "middle", fontSize: "8", fill: "#7a8480" }, shortLabel(s.label));
    })), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.chartLegend }, "Each bar is one ", series.length > 1 ? "period" : "period", "'s estimated profit. Green line shows the trend."));
  }
  function shortLabel(label) {
    if (!label) return "";
    return label.replace(/^Week of /, "").replace(/^Week /, "W").slice(0, 9);
  }
  function MoneyTab({ orders, onUpdate }) {
    const [sortField, setSortField] = (0, import_react11.useState)("date");
    const [sortDir, setSortDir] = (0, import_react11.useState)("desc");
    const [groupMode, setGroupMode] = (0, import_react11.useState)("none");
    const [unpaidOnly, setUnpaidOnly] = (0, import_react11.useState)(false);
    const [openPhotos, setOpenPhotos] = (0, import_react11.useState)(null);
    const [storage, setStorage] = (0, import_react11.useState)(null);
    const [search, setSearch] = (0, import_react11.useState)("");
    const [showChart, setShowChart] = (0, import_react11.useState)(false);
    const [weekNotes, setWeekNotes] = (0, import_react11.useState)({});
    const [weekNotesDraft, setWeekNotesDraft] = (0, import_react11.useState)("");
    const [editingWeekNote, setEditingWeekNote] = (0, import_react11.useState)(false);
    const currentWeekKey = (0, import_react11.useMemo)(() => {
      if (!orders.length) return null;
      const sorted2 = [...orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return groupKeyFor(sorted2[0], "week");
    }, [orders]);
    (0, import_react11.useEffect)(() => {
      loadJSON(WEEK_NOTES_KEY, {}).then((n) => setWeekNotes(n || {}));
    }, []);
    const saveWeekNote = () => {
      const next = { ...weekNotes, [currentWeekKey]: weekNotesDraft.trim() };
      setWeekNotes(next);
      saveJSON(WEEK_NOTES_KEY, next);
      setEditingWeekNote(false);
    };
    const startWeekNote = () => {
      setWeekNotesDraft(weekNotes[currentWeekKey] || "");
      setEditingWeekNote(true);
    };
    (0, import_react11.useEffect)(() => {
      let live = true;
      photoStorageBytes().then((s) => {
        if (live) setStorage(s);
      });
      return () => {
        live = false;
      };
    }, [orders]);
    const filtered = (0, import_react11.useMemo)(() => {
      let arr = unpaidOnly ? orders.filter((o) => !o.paid) : orders;
      const q = search.trim().toLowerCase();
      if (q) arr = arr.filter((o) => (o.customer || "").toLowerCase().includes(q));
      return arr;
    }, [orders, unpaidOnly, search]);
    const totals = (0, import_react11.useMemo)(() => {
      let booked = 0, collected = 0, cost = 0, costComplete = true;
      filtered.forEach((o) => {
        booked += o.total;
        if (o.paid) collected += o.total;
        const info = orderCostInfo(o);
        cost += info.cost;
        if (!info.complete) costComplete = false;
      });
      return {
        booked: round2(booked),
        collected: round2(collected),
        outstanding: round2(booked - collected),
        profit: round2(booked - cost),
        costComplete,
        count: filtered.length
      };
    }, [filtered]);
    const sorted = (0, import_react11.useMemo)(() => {
      const arr = [...filtered];
      arr.sort((a, b) => {
        let cmp = 0;
        if (sortField === "date") cmp = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        if (sortField === "total") cmp = a.total - b.total;
        if (sortField === "name") cmp = (a.customer || "").localeCompare(b.customer || "");
        return sortDir === "asc" ? cmp : -cmp;
      });
      return arr;
    }, [filtered, sortField, sortDir]);
    const groups = (0, import_react11.useMemo)(() => {
      if (groupMode === "none") return [{ label: null, stamp: 0, orders: sorted }];
      const map = /* @__PURE__ */ new Map();
      sorted.forEach((o) => {
        const { label, stamp } = groupKeyFor(o, groupMode);
        if (!map.has(label)) map.set(label, { label, stamp, orders: [] });
        map.get(label).orders.push(o);
      });
      return Array.from(map.values()).sort((a, b) => b.stamp - a.stamp);
    }, [sorted, groupMode]);
    const profitSeries = (0, import_react11.useMemo)(() => {
      const mode = groupMode === "none" ? "week" : groupMode;
      const map = /* @__PURE__ */ new Map();
      filtered.forEach((o) => {
        const { label, stamp } = groupKeyFor(o, mode);
        if (!map.has(label)) map.set(label, { label, stamp, profit: 0, revenue: 0 });
        const e = map.get(label);
        e.revenue += o.total;
        e.profit += o.total - orderCostInfo(o).cost;
      });
      return Array.from(map.values()).sort((a, b) => a.stamp - b.stamp).map((e) => ({ ...e, profit: round2(e.profit), revenue: round2(e.revenue) }));
    }, [filtered, groupMode]);
    const setSort = (field) => {
      if (sortField === field) {
        setSortDir((d) => d === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDir(field === "name" ? "asc" : "desc");
      }
    };
    if (orders.length === 0) {
      return /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.emptyState }, /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.emptyTitle }, "No history yet"), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.emptyBody }, "Every order you save shows up here \u2014 including archived past weeks."));
    }
    return /* @__PURE__ */ import_react11.default.createElement("div", null, currentWeekKey && /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.weekNotesBlock }, /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.weekNotesTitle }, "Week notes"), editingWeekNote ? /* @__PURE__ */ import_react11.default.createElement(import_react11.default.Fragment, null, /* @__PURE__ */ import_react11.default.createElement(
      "textarea",
      {
        style: { ...styles.refCardNotes, minHeight: "80px" },
        value: weekNotesDraft,
        onChange: (e) => setWeekNotesDraft(e.target.value),
        placeholder: "Jot anything worth remembering about this week \u2014 what ran out, what to double, timing notes\u2026",
        autoFocus: true
      }
    ), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.notesEditActions }, /* @__PURE__ */ import_react11.default.createElement("button", { style: styles.confirmYesGreen, onClick: saveWeekNote }, "Save"), /* @__PURE__ */ import_react11.default.createElement("button", { style: styles.confirmNo, onClick: () => setEditingWeekNote(false) }, "Cancel"))) : weekNotes[currentWeekKey] ? /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.weekNotesBody, onClick: startWeekNote, role: "button", tabIndex: 0 }, weekNotes[currentWeekKey], /* @__PURE__ */ import_react11.default.createElement("span", { style: styles.notesEditHint }, " \u2014 tap to edit")) : /* @__PURE__ */ import_react11.default.createElement("button", { style: styles.addNoteBtn, onClick: startWeekNote }, /* @__PURE__ */ import_react11.default.createElement(Pencil, { size: 13 }), "Add week notes")), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.moneyStatsBar }, /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.moneyStatTile }, /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.statValue }, currency(totals.booked)), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.statLabel }, unpaidOnly ? "Unpaid total" : "Revenue")), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.moneyStatTile }, /* @__PURE__ */ import_react11.default.createElement("div", { style: { ...styles.statValue, color: "#1D9E75" } }, currency(totals.profit), totals.costComplete ? "" : "*"), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.statLabel }, "Est. profit")), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.moneyStatTile }, /* @__PURE__ */ import_react11.default.createElement("div", { style: { ...styles.statValue, color: "#1D9E75" } }, currency(totals.collected)), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.statLabel }, "Collected")), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.moneyStatTile }, /* @__PURE__ */ import_react11.default.createElement("div", { style: { ...styles.statValue, ...totals.outstanding > 0 ? { color: "#EF9F27" } : {} } }, currency(totals.outstanding)), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.statLabel }, "Outstanding"))), !totals.costComplete && /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.moneyFootnote }, "* some items predate cost tracking, so profit is partial"), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.sortRow }, [
      ["date", "Date"],
      ["total", "Amount"],
      ["name", "Customer"]
    ].map(([field, label]) => /* @__PURE__ */ import_react11.default.createElement(
      "button",
      {
        key: field,
        style: { ...styles.sortBtn, ...sortField === field ? styles.sortBtnActive : {} },
        onClick: () => setSort(field)
      },
      label,
      sortField === field && /* @__PURE__ */ import_react11.default.createElement("span", { style: styles.sortDirText }, sortDir === "asc" ? "\u2191" : "\u2193")
    )), /* @__PURE__ */ import_react11.default.createElement(
      "button",
      {
        style: { ...styles.sortBtn, ...unpaidOnly ? { color: "#EF9F27", borderColor: "#EF9F27" } : {} },
        onClick: () => setUnpaidOnly((v) => !v)
      },
      "Unpaid only"
    )), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.sortRow }, /* @__PURE__ */ import_react11.default.createElement("span", { style: styles.groupLabel }, "Group:"), [
      ["none", "None"],
      ["week", "Week"],
      ["month", "Month"],
      ["year", "Year"]
    ].map(([mode, label]) => /* @__PURE__ */ import_react11.default.createElement(
      "button",
      {
        key: mode,
        style: { ...styles.sortBtn, ...groupMode === mode ? styles.sortBtnActive : {} },
        onClick: () => setGroupMode(mode)
      },
      label
    )), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.moneyCount }, totals.count, " order", totals.count !== 1 ? "s" : "")), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.moneySearchRow }, /* @__PURE__ */ import_react11.default.createElement(
      "input",
      {
        style: styles.moneySearchInput,
        placeholder: "Search by customer name...",
        value: search,
        onChange: (e) => setSearch(e.target.value)
      }
    ), search && /* @__PURE__ */ import_react11.default.createElement("button", { style: styles.moneySearchClear, onClick: () => setSearch(""), "aria-label": "Clear search" }, /* @__PURE__ */ import_react11.default.createElement(X, { size: 15 })), profitSeries.length >= 2 && /* @__PURE__ */ import_react11.default.createElement(
      "button",
      {
        style: { ...styles.chartToggleBtn, ...showChart ? styles.chartToggleBtnActive : {} },
        onClick: () => setShowChart((v) => !v)
      },
      showChart ? "Hide graph" : "Graph"
    )), showChart && profitSeries.length >= 2 && /* @__PURE__ */ import_react11.default.createElement(ProfitChart, { series: profitSeries }), groups.map((group) => {
      let gRev = 0, gCost = 0, gCollected = 0;
      group.orders.forEach((o) => {
        gRev += o.total;
        gCost += orderCostInfo(o).cost;
        if (o.paid) gCollected += o.total;
      });
      const gProfit = round2(gRev - gCost);
      const gOutstanding = round2(gRev - gCollected);
      return /* @__PURE__ */ import_react11.default.createElement("div", { key: group.label || "all", style: styles.moneyGroup }, group.label && /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.groupHeaderRich }, /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.groupHeaderTop }, /* @__PURE__ */ import_react11.default.createElement("span", { style: styles.groupTitle }, group.label), /* @__PURE__ */ import_react11.default.createElement("span", { style: styles.groupOrderCount }, group.orders.length, " order", group.orders.length !== 1 ? "s" : "")), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.groupStatsRow }, /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.groupStat }, /* @__PURE__ */ import_react11.default.createElement("span", { style: styles.groupStatValue }, currency(round2(gRev))), /* @__PURE__ */ import_react11.default.createElement("span", { style: styles.groupStatLabel }, "revenue")), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.groupStat }, /* @__PURE__ */ import_react11.default.createElement("span", { style: { ...styles.groupStatValue, color: "#1D9E75" } }, currency(gProfit)), /* @__PURE__ */ import_react11.default.createElement("span", { style: styles.groupStatLabel }, "profit")), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.groupStat }, /* @__PURE__ */ import_react11.default.createElement("span", { style: { ...styles.groupStatValue, color: gOutstanding > 0 ? "#EF9F27" : "#9aa5a0" } }, currency(gOutstanding)), /* @__PURE__ */ import_react11.default.createElement("span", { style: styles.groupStatLabel }, "outstanding")))), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.moneyList }, group.orders.map((o) => {
        const info = orderCostInfo(o);
        const profit = round2(o.total - info.cost);
        const photoItems = (o.items || []).map((it, i) => ({ it, i })).filter(({ it }) => it.hasPhoto);
        return /* @__PURE__ */ import_react11.default.createElement("div", { key: o.id, style: { ...styles.moneyRowWrap, ...o.archived ? { opacity: 0.65 } : {} } }, /* @__PURE__ */ import_react11.default.createElement(
          "div",
          {
            style: { ...styles.moneyRow, ...photoItems.length ? { cursor: "pointer" } : {} },
            onClick: photoItems.length ? () => setOpenPhotos(openPhotos === o.id ? null : o.id) : void 0
          },
          /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.moneyRowLeft }, /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.moneyName }, o.customer, photoItems.length > 0 && /* @__PURE__ */ import_react11.default.createElement(Camera, { size: 12, style: { marginLeft: 6, verticalAlign: "middle", opacity: 0.7 } })), /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.moneyMeta }, formatDate(o.createdAt), o.archived ? " \xB7 archived" : ` \xB7 ${o.status}`, photoItems.length > 0 ? ` \xB7 ${photoItems.length} photo${photoItems.length !== 1 ? "s" : ""}` : "")),
          /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.moneyRowRight }, /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.moneyAmounts }, /* @__PURE__ */ import_react11.default.createElement("span", { style: styles.moneyAmount }, currency(o.total)), /* @__PURE__ */ import_react11.default.createElement("span", { style: styles.moneyProfit }, info.complete || info.cost > 0 ? `+${currency(profit)}${info.complete ? "" : "*"}` : "\u2014")), /* @__PURE__ */ import_react11.default.createElement(
            "button",
            {
              style: {
                ...styles.paidPill,
                ...o.paid ? { background: "#1D9E7522", color: "#1D9E75" } : { background: "#EF9F2722", color: "#EF9F27" }
              },
              onClick: (e) => {
                e.stopPropagation();
                onUpdate(o.id, { paid: !o.paid });
              }
            },
            o.paid ? "Paid" : "Unpaid"
          ))
        ), openPhotos === o.id && photoItems.length > 0 && /* @__PURE__ */ import_react11.default.createElement(OrderPhotos, { orderId: o.id, photoItems }));
      })));
    }), storage && storage.count > 0 && /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.storageGauge }, /* @__PURE__ */ import_react11.default.createElement(Camera, { size: 13 }), /* @__PURE__ */ import_react11.default.createElement("span", null, storage.count, " scale photo", storage.count !== 1 ? "s" : "", " stored \xB7 ", fmtBytes(storage.bytes)), /* @__PURE__ */ import_react11.default.createElement("span", { style: styles.storageGaugeNote }, "auto-deleted after 1 month")));
  }
  function OrderPhotos({ orderId, photoItems }) {
    const [photos, setPhotos] = (0, import_react11.useState)({});
    (0, import_react11.useEffect)(() => {
      let live = true;
      (async () => {
        for (const { i } of photoItems) {
          const d = await loadPhoto(orderId, i);
          if (!live) return;
          setPhotos((prev) => ({ ...prev, [i]: d || "none" }));
        }
      })();
      return () => {
        live = false;
      };
    }, [orderId]);
    return /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.orderPhotosWrap }, photoItems.map(({ it, i }) => /* @__PURE__ */ import_react11.default.createElement("div", { key: i, style: styles.orderPhotoItem }, /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.orderPhotoLabel }, it.name, it.weight > 0 ? ` \xB7 ${it.weight} lb` : ""), photos[i] === void 0 && /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.orderPhotoLoading }, "loading\u2026"), photos[i] === "none" && /* @__PURE__ */ import_react11.default.createElement("div", { style: styles.orderPhotoLoading }, "photo expired or missing"), photos[i] && photos[i] !== "none" && /* @__PURE__ */ import_react11.default.createElement("img", { src: `data:image/jpeg;base64,${photos[i]}`, alt: `${it.name} on scale`, style: styles.orderPhotoImg }))));
  }

  // src/App.jsx
  function LTBOrderTracker() {
    import_react12.default.useEffect(() => {
      if (!document.getElementById("ltb-spin-style")) {
        const s = document.createElement("style");
        s.id = "ltb-spin-style";
        s.textContent = "@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }";
        document.head.appendChild(s);
      }
    }, []);
    const [notifPerm, setNotifPerm] = import_react12.default.useState(
      typeof Notification !== "undefined" ? Notification.permission : "unsupported"
    );
    import_react12.default.useEffect(() => {
      if (!VAPID_PUBLIC_KEY) return;
      if (!("serviceWorker" in navigator)) return;
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((e) => {
        console.warn("SW registration failed:", e.message);
      });
    }, []);
    const enablePushNotifications = async () => {
      if (!VAPID_PUBLIC_KEY || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
      try {
        const permission = await Notification.requestPermission();
        setNotifPerm(permission);
        if (permission !== "granted") return;
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          });
        }
        await fetch(WORKER_BASE + "/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: PUBLISH_TOKEN, subscription: sub.toJSON() })
        });
      } catch (e) {
        console.warn("Push setup failed:", e.message);
      }
    };
    const [orders, setOrders] = (0, import_react12.useState)(null);
    const [cookChecks, setCookChecks] = (0, import_react12.useState)({});
    const [deliverChecks, setDeliverChecks] = (0, import_react12.useState)({});
    const [cookSubView, setCookSubView] = (0, import_react12.useState)("cook");
    const [dishNotes, setDishNotes] = (0, import_react12.useState)({});
    const [shopping, setShopping] = (0, import_react12.useState)([]);
    const [weekDishes, setWeekDishes] = (0, import_react12.useState)(DEFAULT_WEEK);
    const [loading, setLoading] = (0, import_react12.useState)(true);
    const [error, setError] = (0, import_react12.useState)(null);
    const [view, setView] = (0, import_react12.useState)("orders");
    const [formMode, setFormMode] = (0, import_react12.useState)(null);
    const [showPaste, setShowPaste] = (0, import_react12.useState)(false);
    const [showAmend, setShowAmend] = (0, import_react12.useState)(false);
    const [showCsv, setShowCsv] = (0, import_react12.useState)(false);
    const [pendingOrders, setPendingOrders] = (0, import_react12.useState)([]);
    const [showPendingIdx, setShowPendingIdx] = (0, import_react12.useState)(null);
    const [checkingForm, setCheckingForm] = (0, import_react12.useState)(false);
    const [parsedNotes, setParsedNotes] = (0, import_react12.useState)({});
    const [parsingNotes, setParsingNotes] = (0, import_react12.useState)(null);
    const [regulars, setRegulars] = (0, import_react12.useState)([]);
    const [inventory, setInventory] = (0, import_react12.useState)({});
    const [linkPrompt, setLinkPrompt] = (0, import_react12.useState)(null);
    const [expandedOrder, setExpandedOrder] = (0, import_react12.useState)(null);
    (0, import_react12.useEffect)(() => {
      let mounted = true;
      (async () => {
        const [loadedOrders, loadedChecks, loadedShopping, loadedWeek, loadedDeliverChecks, loadedDishNotes] = await Promise.all([
          loadJSON(ORDERS_KEY, []),
          loadJSON(CHECKS_KEY, {}),
          loadJSON(SHOPPING_KEY, []),
          loadJSON(WEEK_KEY, null),
          loadJSON(DELIVER_CHECKS_KEY, {}),
          loadJSON(DISH_NOTES_KEY, {})
        ]);
        if (!mounted) return;
        const migrated = loadedOrders.map((o) => ({
          ...o,
          // Item-level migration: form-imported orders previously stored
          // `upcharge: 0` (a number) and `lbs: null`, which broke rendering.
          // Normalize upcharge to either a proper {label, amount} object or
          // undefined, and drop the stray lbs field.
          items: (o.items || []).map((it) => {
            const clean = { ...it };
            if (clean.upcharge != null && typeof clean.upcharge !== "object") {
              delete clean.upcharge;
            }
            if ("lbs" in clean) delete clean.lbs;
            return clean;
          }),
          paid: o.paid === void 0 ? o.status === "Delivered" : o.paid,
          archived: o.archived || false,
          discountType: o.discountType || null,
          discountValue: o.discountValue || 0,
          customCharges: o.customCharges || [],
          jarSwaps: o.jarSwaps || 0,
          containerReturns: o.containerReturns || 0,
          waiveSurcharge: o.waiveSurcharge || false,
          total: Number(o.total) || 0
        }));
        setOrders(migrated);
        setCookChecks(loadedChecks || {});
        setDeliverChecks(loadedDeliverChecks || {});
        setDishNotes(loadedDishNotes || {});
        setShopping(loadedShopping || []);
        if (loadedWeek && Array.isArray(loadedWeek.selected)) {
          const valid = loadedWeek.selected.filter((n) => ALL_DINNERS.some((d) => d.name === n));
          setWeekDishes(valid.length > 0 ? valid : DEFAULT_WEEK);
        }
        const savedPending = await loadJSON(PENDING_KEY, []);
        if (mounted) setPendingOrders(savedPending || []);
        const savedRegulars = await loadJSON(REGULARS_KEY, []);
        const migratedRegulars = (savedRegulars || []).map((r) => {
          if (Array.isArray(r.names) && r.names.length) return r;
          const names = r.name ? [String(r.name).trim()] : [];
          return { ...r, names, name: names[0] || "" };
        });
        if (mounted) setRegulars(migratedRegulars);
        const savedInventory = await loadJSON(INVENTORY_KEY, {});
        if (mounted) setInventory(savedInventory || {});
        setLoading(false);
        cleanupPhotos(migrated);
        if (USE_LEGACY_CSV) {
          pollFormOrders(migrated, savedPending || []);
        } else {
          pollWorkerPending();
        }
      })();
      return () => {
        mounted = false;
      };
    }, []);
    const persistOrders = (0, import_react12.useCallback)(async (next) => {
      setOrders(next);
      const res = await saveJSON(ORDERS_KEY, next);
      setError(saveError(res));
      return res;
    }, []);
    const persistShopping = (0, import_react12.useCallback)((next) => {
      setShopping(next);
      saveJSON(SHOPPING_KEY, next).then((res) => setError(saveError(res)));
    }, []);
    const INVENTORY_ADDON_MAP = {
      "Queso": "queso_0",
      // defaults to no-heat; adjust manually in inventory if a different spice level
      "Chili Oil": "chiliOil",
      "Chimichurri": "chimichurri",
      "Romesco": "romesco",
      "Chermoula": "chermoula",
      "Miso Butter Sauce": "misoButter",
      "Whipped Lemon Garlic Herb Butter": "whippedButter"
    };
    const saveOrder = (0, import_react12.useCallback)((order) => {
      setOrders((prev) => {
        const exists = (prev || []).some((o) => o.id === order.id);
        const next = exists ? (prev || []).map((o) => o.id === order.id ? order : o) : [order, ...prev || []];
        saveJSON(ORDERS_KEY, next).then((res) => setError(saveError(res)));
        if (!exists) {
          (order.items || []).forEach((it) => {
            const invKey = INVENTORY_ADDON_MAP[it.name];
            if (invKey) {
              setInventory((inv) => {
                const current = Number(inv[invKey]) || 0;
                const updated = { ...inv, [invKey]: Math.max(0, current - (it.qty || 1)) };
                saveJSON(INVENTORY_KEY, updated);
                return updated;
              });
            }
          });
        }
        return next;
      });
      setFormMode(null);
    }, []);
    const importOrders = (0, import_react12.useCallback)((parsedOrders) => {
      const newOrders = parsedOrders.map((p) => {
        const items = p.items || [];
        const total = orderTotal(items, p.jarSwaps || 0, p.containerReturns || 0, null, 0, [], false);
        return {
          id: uid(),
          customer: p.customer,
          items,
          jarSwaps: p.jarSwaps || 0,
          containerReturns: p.containerReturns || 0,
          notes: p.notes || "",
          discountType: null,
          discountValue: 0,
          customCharges: [],
          waiveSurcharge: false,
          total,
          status: "Ordered",
          paid: false,
          archived: false,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      });
      setOrders((prev) => {
        const next = [...newOrders, ...prev || []];
        saveJSON(ORDERS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
      setShowCsv(false);
      setExportMsg(`Imported ${newOrders.length} order${newOrders.length !== 1 ? "s" : ""} from the sheet.`);
      setTimeout(() => setExportMsg(null), 4e3);
    }, []);
    const checkFormNow = import_react12.default.useCallback(async () => {
      setCheckingForm(true);
      try {
        alert("Fetching from: " + FORM_CSV_URL2);
        const rows = await fetchFormRows();
        alert("Done. rows=" + (rows === null ? "null" : Array.isArray(rows) ? rows.length : typeof rows));
        if (!rows) {
          setCheckingForm(false);
          return;
        }
        const seenRaw = await loadJSON(SEEN_ROWS_KEY, {});
        const seen = seenRaw || {};
        const newPending = [];
        rows.forEach((row) => {
          const ts = row["Timestamp"] || row["timestamp"] || "";
          if (!ts || seen[ts]) return;
          const { customer, items, notes } = parseFormRow(row);
          if (items.length === 0 && !notes) return;
          newPending.push({
            pendingId: "p_" + Date.now() + "_" + Math.random().toString(36).slice(2),
            timestamp: ts,
            customer,
            items,
            notes
          });
          seen[ts] = true;
        });
        if (newPending.length > 0) {
          setPendingOrders((prev) => {
            const updated = [...prev, ...newPending];
            saveJSON(PENDING_KEY, updated);
            return updated;
          });
          await saveJSON(SEEN_ROWS_KEY, seen);
        } else {
          await saveJSON(SEEN_ROWS_KEY, seen);
        }
      } catch (e) {
        alert("ERROR: " + e.message);
      }
      setCheckingForm(false);
    }, []);
    const resetRecentSeenRows = import_react12.default.useCallback(async () => {
      const seenRaw = await loadJSON(SEEN_ROWS_KEY, {});
      const seen = seenRaw || {};
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1e3;
      let removed = 0;
      const updated = {};
      Object.entries(seen).forEach(([ts, val]) => {
        const parsed = new Date(ts);
        if (!isNaN(parsed.getTime()) && parsed.getTime() >= cutoff) {
          removed++;
        } else {
          updated[ts] = val;
        }
      });
      await saveJSON(SEEN_ROWS_KEY, updated);
      alert("Reset " + removed + " recent order" + (removed !== 1 ? "s" : "") + ' from seen history. Tap "Check for new orders" to re-import them.');
    }, []);
    const pollFormOrders = import_react12.default.useCallback(async (existingOrders, existingPending) => {
      const rows = await fetchFormRows();
      if (!rows) return;
      const seenRaw = await loadJSON(SEEN_ROWS_KEY, {});
      const seen = seenRaw || {};
      const newPending = [];
      rows.forEach((row) => {
        const ts = row["Timestamp"] || row["timestamp"] || "";
        if (!ts || seen[ts]) return;
        const { customer, items, notes } = parseFormRow(row);
        if (items.length === 0 && !notes) return;
        newPending.push({
          pendingId: "p_" + Date.now() + "_" + Math.random().toString(36).slice(2),
          timestamp: ts,
          customer,
          items,
          notes
        });
        seen[ts] = true;
      });
      if (newPending.length > 0) {
        const updated = [...existingPending, ...newPending];
        setPendingOrders(updated);
        await saveJSON(PENDING_KEY, updated);
        await saveJSON(SEEN_ROWS_KEY, seen);
      } else {
        await saveJSON(SEEN_ROWS_KEY, seen);
      }
      setTimeout(() => pollFormOrders(existingOrders, existingPending), 5 * 60 * 1e3);
    }, []);
    const workerPollRef = import_react12.default.useRef(null);
    const pollWorkerPending = import_react12.default.useCallback(async (reschedule = true) => {
      try {
        const res = await fetch(PENDING_POLL_URL, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const submissions = data && data.pending || [];
          if (submissions.length > 0) {
            const mapped = submissions.map((s) => ({
              pendingId: s.id,
              // use the Worker's submission id as our pending id
              timestamp: s.submittedAt || (/* @__PURE__ */ new Date()).toISOString(),
              customer: s.customer || "Unknown",
              address: s.address || "",
              phone: s.phone || "",
              items: Array.isArray(s.items) ? s.items.map((it) => ({
                name: it.name,
                variant: it.variant,
                qty: it.qty || 1,
                price: it.price,
                cost: it.cost || 0,
                note: "",
                hasPhoto: false
              })) : [],
              notes: s.notes || ""
            }));
            setPendingOrders((prev) => {
              const have = new Set((prev || []).map((p) => p.pendingId));
              const fresh = mapped.filter((m) => !have.has(m.pendingId));
              if (fresh.length === 0) return prev;
              const updated = [...prev || [], ...fresh];
              saveJSON(PENDING_KEY, updated);
              return updated;
            });
            const ids = submissions.map((s) => s.id);
            fetch(WORKER_BASE + "/pending/clear", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids })
            }).catch(() => {
            });
          }
        }
      } catch (e) {
      }
      if (reschedule) {
        if (workerPollRef.current) clearTimeout(workerPollRef.current);
        workerPollRef.current = setTimeout(() => pollWorkerPending(true), 2 * 60 * 1e3);
      }
    }, []);
    const checkWorkerNow = import_react12.default.useCallback(async () => {
      setCheckingForm(true);
      await pollWorkerPending(false);
      setCheckingForm(false);
    }, [pollWorkerPending]);
    const publishWeek = import_react12.default.useCallback(async (currentWeekDishes, menuPdfUrl, weekLabel) => {
      const activeMenu = buildMenu(currentWeekDishes || []);
      const toVariants = (item) => {
        const info = PER_LB_ITEMS[item.name];
        if (info) {
          return {
            name: item.name,
            perLb: true,
            pricePerLb: info.pricePerLb,
            variants: [{ label: "By weight", price: info.pricePerLb, cost: info.costPerLb }]
          };
        }
        return {
          name: item.name,
          variants: (item.variants || []).map((v) => ({ label: v.label, price: v.price, cost: v.cost || 0 }))
        };
      };
      const dishes = (activeMenu.dinner || []).map(toVariants);
      const addons = [
        ...activeMenu.fruit || [],
        ...activeMenu.desserts || [],
        ...activeMenu.addons || []
      ].map(toVariants);
      const bag = (activeMenu.bag || []).map(toVariants);
      const sauces = (activeMenu.sauces || []).map(toVariants);
      const payload = {
        token: PUBLISH_TOKEN,
        dishes,
        addons,
        bag,
        sauces,
        menuPdfUrl: menuPdfUrl || "",
        weekLabel: weekLabel || ""
      };
      const res = await fetch(CONFIG_PUBLISH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error("Publish failed (" + res.status + "): " + txt.slice(0, 120));
      }
      return res.json();
    }, []);
    const acceptPending = (0, import_react12.useCallback)((pending) => {
      const orderId = uid();
      let exactReg = null;
      const partialRegs = [];
      regulars.forEach((r) => {
        const m = regularMatchType(r, pending.customer);
        if (m === "exact") exactReg = r;
        else if (m === "partial") partialRegs.push(r);
      });
      const discountType = exactReg && exactReg.discountPercent > 0 ? "percent" : null;
      const discountValue = exactReg && exactReg.discountPercent > 0 ? exactReg.discountPercent : 0;
      const total = orderTotal(pending.items, 0, 0, discountType, discountValue, [], false);
      const order = {
        id: orderId,
        // Keep the actual name the customer ordered under, not the profile's
        // primary — so you can see which half of a couple placed it.
        customer: pending.customer,
        address: pending.address || "",
        phone: pending.phone || "",
        items: pending.items,
        jarSwaps: 0,
        containerReturns: 0,
        notes: pending.notes || "",
        discountType,
        discountValue,
        customCharges: [],
        waiveSurcharge: false,
        total,
        status: "Ordered",
        paid: false,
        archived: false,
        regularId: exactReg ? exactReg.id : null,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      setOrders((prev) => {
        const next = [order, ...prev || []];
        saveJSON(ORDERS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
      (order.items || []).forEach((it) => {
        const invKey = INVENTORY_ADDON_MAP[it.name];
        if (invKey) adjustInventory(invKey, -(it.qty || 1));
      });
      if (exactReg) {
        linkOrderToRegular(exactReg.id, orderId);
      } else if (partialRegs.length > 0) {
        setLinkPrompt({ order, candidates: partialRegs });
      }
      dismissPending(pending.pendingId);
      setShowPendingIdx(null);
    }, [regulars]);
    const dismissPending = (0, import_react12.useCallback)((pendingId) => {
      setPendingOrders((prev) => {
        const next = prev.filter((p) => p.pendingId !== pendingId);
        saveJSON(PENDING_KEY, next);
        return next;
      });
      setShowPendingIdx(null);
    }, []);
    const persistRegulars = (0, import_react12.useCallback)((next) => {
      setRegulars(next);
      saveJSON(REGULARS_KEY, next).then((res) => setError(saveError(res)));
    }, []);
    const addRegular = (0, import_react12.useCallback)((profile) => {
      const names = (Array.isArray(profile.names) ? profile.names : [profile.name]).map((n) => String(n || "").trim()).filter(Boolean);
      const reg = {
        id: uid(),
        names,
        name: names[0] || "",
        // legacy primary, kept for backward compatibility
        address: profile.address || "",
        phone: profile.phone || "",
        dietary: profile.dietary || "",
        spice: profile.spice || "",
        discountPercent: Number(profile.discountPercent) || 0,
        notes: profile.notes || "",
        linkedOrderIds: profile.linkedOrderIds || [],
        lastInsightSig: "",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      setRegulars((prev) => {
        const next = [...prev, reg];
        saveJSON(REGULARS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
      return reg.id;
    }, []);
    const updateRegular = (0, import_react12.useCallback)((id, patch) => {
      setRegulars((prev) => {
        const next = prev.map((r) => r.id === id ? { ...r, ...patch } : r);
        saveJSON(REGULARS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const deleteRegular = (0, import_react12.useCallback)((id) => {
      setRegulars((prev) => {
        const next = prev.filter((r) => r.id !== id);
        saveJSON(REGULARS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const linkOrderToRegular = (0, import_react12.useCallback)((regularId, orderId) => {
      setRegulars((prev) => {
        const next = prev.map((r) => {
          if (r.id !== regularId) return r;
          const linkedOrderIds = r.linkedOrderIds.includes(orderId) ? r.linkedOrderIds : [...r.linkedOrderIds, orderId];
          return { ...r, linkedOrderIds };
        });
        saveJSON(REGULARS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const unlinkOrderFromRegular = (0, import_react12.useCallback)((regularId, orderId) => {
      setRegulars((prev) => {
        const next = prev.map(
          (r) => r.id === regularId ? { ...r, linkedOrderIds: r.linkedOrderIds.filter((oid) => oid !== orderId) } : r
        );
        saveJSON(REGULARS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const adjustInventory = (0, import_react12.useCallback)((key, delta) => {
      setInventory((prev) => {
        const current = Number(prev[key]) || 0;
        const next = { ...prev, [key]: Math.max(0, current + delta) };
        saveJSON(INVENTORY_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const setInventoryCount = (0, import_react12.useCallback)((key, value) => {
      setInventory((prev) => {
        const next = { ...prev, [key]: Math.max(0, Number(value) || 0) };
        saveJSON(INVENTORY_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const updateOrder = (0, import_react12.useCallback)((id, patch) => {
      setOrders((prev) => {
        const next = (prev || []).map((o) => o.id === id ? { ...o, ...patch } : o);
        saveJSON(ORDERS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const deleteOrder = (0, import_react12.useCallback)((id) => {
      setOrders((prev) => {
        const target = (prev || []).find((o) => o.id === id);
        if (target) (target.items || []).forEach((it, i) => {
          if (it.hasPhoto) deletePhoto(id, i);
        });
        const next = (prev || []).filter((o) => o.id !== id);
        saveJSON(ORDERS_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const archiveDelivered = (0, import_react12.useCallback)(() => {
      persistOrders((orders || []).map(
        (o) => o.status === "Delivered" && !o.archived ? { ...o, archived: true } : o
      ));
    }, [orders, persistOrders]);
    const [exportMsg, setExportMsg] = (0, import_react12.useState)(null);
    const exportData = (0, import_react12.useCallback)(async () => {
      const payload = {
        version: "ltb-v1",
        exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
        orders: orders || [],
        shopping,
        weekDishes,
        regulars,
        inventory
      };
      const json = JSON.stringify(payload, null, 2);
      try {
        await navigator.clipboard.writeText(json);
        setExportMsg("Copied! Paste into Notes or anywhere to save.");
      } catch {
        try {
          const ta = document.createElement("textarea");
          ta.value = json;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          setExportMsg("Copied! Paste into Notes or anywhere to save.");
        } catch {
          setExportMsg("Could not copy automatically. Try the export from Safari (not home screen).");
        }
      }
      setTimeout(() => setExportMsg(null), 4e3);
    }, [orders, shopping, weekDishes, regulars, inventory]);
    const importData = (0, import_react12.useCallback)(async (e) => {
      let json;
      if (typeof e === "string") {
        json = e;
      } else {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        e.target.value = "";
        json = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = (ev) => res(ev.target.result);
          r.onerror = () => rej(new Error("Could not read file"));
          r.readAsText(file);
        });
      }
      try {
        const payload = JSON.parse(json);
        if (!payload.version || !Array.isArray(payload.orders)) {
          setError("That doesn't look like an LTB backup. Nothing was changed.");
          return;
        }
        const ok = window.confirm(
          `Import ${payload.orders.length} orders from ${payload.exportedAt?.slice(0, 10) || "backup"}?

This will replace your current orders.`
        );
        if (!ok) return;
        const res = await persistOrders(payload.orders);
        if (!res.ok) return;
        if (Array.isArray(payload.shopping)) {
          setShopping(payload.shopping);
          await saveJSON(SHOPPING_KEY, payload.shopping);
        }
        if (Array.isArray(payload.weekDishes)) {
          setWeekDishes(payload.weekDishes);
          await saveJSON(WEEK_KEY, { selected: payload.weekDishes });
        }
        if (Array.isArray(payload.regulars)) {
          setRegulars(payload.regulars);
          await saveJSON(REGULARS_KEY, payload.regulars);
        }
        if (payload.inventory && typeof payload.inventory === "object") {
          setInventory(payload.inventory);
          await saveJSON(INVENTORY_KEY, payload.inventory);
        }
        setExportMsg(`Imported ${payload.orders.length} orders successfully.`);
        setTimeout(() => setExportMsg(null), 4e3);
        setError(null);
      } catch {
        setError("Couldn't read that backup \u2014 make sure you copied the full text.");
      }
    }, [persistOrders]);
    const [showImportModal, setShowImportModal] = (0, import_react12.useState)(false);
    const pasteImport = (0, import_react12.useCallback)(() => {
      setShowImportModal(true);
    }, []);
    const submitImport = (0, import_react12.useCallback)(async (text) => {
      setShowImportModal(false);
      if (!text.trim()) return;
      try {
        const payload = JSON.parse(text.trim());
        if (!payload.version || !Array.isArray(payload.orders)) {
          setError("That doesn't look like an LTB backup. Nothing was changed.");
          return;
        }
        const res = await persistOrders(payload.orders);
        if (!res.ok) {
          return;
        }
        if (Array.isArray(payload.shopping)) {
          setShopping(payload.shopping);
          await saveJSON(SHOPPING_KEY, payload.shopping);
        }
        if (Array.isArray(payload.weekDishes)) {
          setWeekDishes(payload.weekDishes);
          await saveJSON(WEEK_KEY, { selected: payload.weekDishes });
        }
        if (Array.isArray(payload.regulars)) {
          setRegulars(payload.regulars);
          await saveJSON(REGULARS_KEY, payload.regulars);
        }
        if (payload.inventory && typeof payload.inventory === "object") {
          setInventory(payload.inventory);
          await saveJSON(INVENTORY_KEY, payload.inventory);
        }
        setExportMsg(`Imported ${payload.orders.length} orders successfully.`);
        setTimeout(() => setExportMsg(null), 4e3);
        setError(null);
      } catch {
        setError("Couldn't read that \u2014 make sure you copied the full backup text.");
      }
    }, [persistOrders]);
    const currentOrders = (0, import_react12.useMemo)(() => (orders || []).filter((o) => !o.archived), [orders]);
    const activeOrders = (0, import_react12.useMemo)(() => currentOrders.filter((o) => o.status !== "Delivered"), [currentOrders]);
    const deliveredOrders = (0, import_react12.useMemo)(() => currentOrders.filter((o) => o.status === "Delivered"), [currentOrders]);
    const stats = (0, import_react12.useMemo)(() => {
      const booked = currentOrders.reduce((s, o) => s + o.total, 0);
      const unpaid = currentOrders.filter((o) => !o.paid).reduce((s, o) => s + o.total, 0);
      return { active: activeOrders.length, booked: round2(booked), unpaid: round2(unpaid) };
    }, [currentOrders, activeOrders]);
    const activeFinancials = (0, import_react12.useMemo)(() => {
      let revenue = 0;
      let cost = 0;
      activeOrders.forEach((o) => {
        revenue += o.total;
        cost += orderCostInfo(o).cost;
      });
      return { revenue: round2(revenue), cost: round2(cost), profit: round2(revenue - cost) };
    }, [activeOrders]);
    const recentCustomers = (0, import_react12.useMemo)(() => {
      const seen = /* @__PURE__ */ new Set();
      const names = [];
      for (const o of orders || []) {
        const name = (o.customer || "").trim();
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          names.push(name);
        }
        if (names.length >= 6) break;
      }
      return names;
    }, [orders]);
    const cookingList = (0, import_react12.useMemo)(() => {
      const map = /* @__PURE__ */ new Map();
      activeOrders.forEach((o) => {
        (o.items || []).forEach((it) => {
          const key = `${it.category}::${it.name}::${it.variant}`;
          if (!map.has(key)) {
            map.set(key, { key, category: it.category, name: it.name, variant: it.variant, qty: 0 });
          }
          map.get(key).qty += it.qty;
        });
      });
      const catOrder = Object.keys(CATEGORY_LABELS);
      return Array.from(map.values()).sort(
        (a, b) => catOrder.indexOf(a.category) - catOrder.indexOf(b.category) || a.name.localeCompare(b.name)
      );
    }, [activeOrders]);
    const deliverList = (0, import_react12.useMemo)(() => {
      const catOrder = Object.keys(CATEGORY_LABELS);
      return activeOrders.map((o) => {
        const items = (o.items || []).map((it, i) => ({
          key: `${o.id}::${i}`,
          category: it.category,
          name: it.name,
          variant: it.variant,
          qty: it.qty
        })).sort(
          (a, b) => catOrder.indexOf(a.category) - catOrder.indexOf(b.category) || a.name.localeCompare(b.name)
        );
        return { orderId: o.id, customer: o.customer || "Unnamed", items };
      }).filter((grp) => grp.items.length > 0).sort((a, b) => a.customer.localeCompare(b.customer));
    }, [activeOrders]);
    const toggleCheck = (0, import_react12.useCallback)((key) => {
      setCookChecks((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        const validKeys = new Set(cookingList.map((it) => it.key));
        Object.keys(next).forEach((k) => {
          if (!validKeys.has(k)) delete next[k];
        });
        saveJSON(CHECKS_KEY, next);
        return next;
      });
    }, [cookingList]);
    const resetChecks = (0, import_react12.useCallback)(() => {
      setCookChecks({});
      saveJSON(CHECKS_KEY, {});
    }, []);
    const toggleDeliverCheck = (0, import_react12.useCallback)((key) => {
      setDeliverChecks((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        const validKeys = /* @__PURE__ */ new Set();
        deliverList.forEach((grp) => grp.items.forEach((it) => validKeys.add(it.key)));
        Object.keys(next).forEach((k) => {
          if (!validKeys.has(k)) delete next[k];
        });
        saveJSON(DELIVER_CHECKS_KEY, next);
        return next;
      });
    }, [deliverList]);
    const resetDeliverChecks = (0, import_react12.useCallback)(() => {
      setDeliverChecks({});
      saveJSON(DELIVER_CHECKS_KEY, {});
    }, []);
    const saveDishNote = (0, import_react12.useCallback)((dishName, text) => {
      setDishNotes((prev) => {
        const next = { ...prev, [dishName]: text };
        saveJSON(DISH_NOTES_KEY, next);
        return next;
      });
    }, []);
    const menu = (0, import_react12.useMemo)(() => buildMenu(weekDishes), [weekDishes]);
    const toggleWeekDish = (0, import_react12.useCallback)((name) => {
      setWeekDishes((prev) => {
        const next = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name];
        saveJSON(WEEK_KEY, { selected: next }).then((res) => setError(saveError(res)));
        return next;
      });
    }, []);
    const generateShopping = (0, import_react12.useCallback)((includeStaples) => {
      const lines = generateShoppingItems(activeOrders, includeStaples);
      setShopping((prev) => {
        const checkedByText = new Map(prev.filter((it) => it.checked).map((it) => [it.text, true]));
        const manual = prev.filter((it) => !it.auto);
        const autos = lines.map((text) => ({
          id: uid(),
          text,
          checked: !!checkedByText.get(text),
          auto: true
        }));
        const next = [...autos, ...manual];
        saveJSON(SHOPPING_KEY, next).then((res) => setError(saveError(res)));
        return next;
      });
    }, [activeOrders]);
    if (loading) {
      return /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.page }, /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.loadingText }, "Loading orders..."));
    }
    return /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.page }, /* @__PURE__ */ import_react12.default.createElement("header", { style: styles.header }, /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.headerTop }, /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.logoMark }, "LTB"), /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.headerCenter }, /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.title }, "Order tracker"), /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.subtitle }, "Lettuce, Turnip, The Beet \xB7 v9.9-GH")), /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.headerActions }, VAPID_PUBLIC_KEY && notifPerm !== "granted" && notifPerm !== "unsupported" && /* @__PURE__ */ import_react12.default.createElement(
      "button",
      {
        style: { ...styles.headerActionBtn, color: notifPerm === "denied" ? "#993556" : GOLD },
        onClick: enablePushNotifications,
        title: notifPerm === "denied" ? "Notifications blocked \u2014 enable in Settings" : "Enable order notifications"
      },
      /* @__PURE__ */ import_react12.default.createElement(Bell, { size: 16 })
    ), /* @__PURE__ */ import_react12.default.createElement("button", { style: styles.headerActionBtn, onClick: exportData, title: "Copy backup to clipboard" }, /* @__PURE__ */ import_react12.default.createElement(Download, { size: 16 })), /* @__PURE__ */ import_react12.default.createElement("button", { style: styles.headerActionBtn, onClick: pasteImport, title: "Paste backup from clipboard" }, /* @__PURE__ */ import_react12.default.createElement(Upload, { size: 16 })))), exportMsg && /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.exportMsg }, exportMsg), /* @__PURE__ */ import_react12.default.createElement("nav", { style: styles.tabs }, [
      ["orders", "Orders"],
      ["cook", "Cook"],
      ["shop", "Shop"],
      ["money", "Money"],
      ["regulars", "Regulars"],
      ["week", "Week"]
    ].map(([key, label]) => /* @__PURE__ */ import_react12.default.createElement(
      "button",
      {
        key,
        style: { ...styles.tab, ...view === key ? styles.tabActive : {} },
        onClick: () => setView(key)
      },
      label,
      key === "orders" && stats.active > 0 && /* @__PURE__ */ import_react12.default.createElement("span", { style: styles.tabBadge }, stats.active)
    )))), error && /* @__PURE__ */ import_react12.default.createElement(
      "button",
      {
        style: styles.errorBanner,
        onClick: async () => {
          const res = await saveJSON(ORDERS_KEY, orders || []);
          setError(saveError(res));
          if (res.ok) {
            setExportMsg("Saved.");
            setTimeout(() => setExportMsg(null), 2500);
          }
        }
      },
      error,
      /* @__PURE__ */ import_react12.default.createElement("span", { style: styles.errorRetry }, "Tap to retry saving")
    ), showImportModal && /* @__PURE__ */ import_react12.default.createElement(ImportModal, { onSubmit: submitImport, onCancel: () => setShowImportModal(false) }), linkPrompt && /* @__PURE__ */ import_react12.default.createElement(
      LinkRegularPrompt,
      {
        order: linkPrompt.order,
        candidates: linkPrompt.candidates,
        onLink: (regularId) => {
          linkOrderToRegular(regularId, linkPrompt.order.id);
          const reg = regulars.find((r) => r.id === regularId);
          if (reg) {
            const patch = { regularId };
            if (reg.discountPercent > 0) {
              patch.discountType = "percent";
              patch.discountValue = reg.discountPercent;
              patch.total = orderTotal(linkPrompt.order.items, linkPrompt.order.jarSwaps, linkPrompt.order.containerReturns, "percent", reg.discountPercent, linkPrompt.order.customCharges, linkPrompt.order.waiveSurcharge);
            }
            updateOrder(linkPrompt.order.id, patch);
          }
          setLinkPrompt(null);
        },
        onSkip: () => setLinkPrompt(null)
      }
    ), /* @__PURE__ */ import_react12.default.createElement("main", { style: styles.main }, view === "orders" && /* @__PURE__ */ import_react12.default.createElement(import_react12.default.Fragment, null, /* @__PURE__ */ import_react12.default.createElement(StatsBar, { stats }), !formMode && !showPaste && !showAmend && !showCsv && /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.topActions }, /* @__PURE__ */ import_react12.default.createElement("button", { style: styles.newOrderBtn, onClick: () => setFormMode("new") }, /* @__PURE__ */ import_react12.default.createElement(Plus, { size: 18 }), "New order"), /* @__PURE__ */ import_react12.default.createElement("button", { style: styles.pasteBtn, onClick: () => setShowPaste(true) }, /* @__PURE__ */ import_react12.default.createElement(ClipboardPaste, { size: 18 }), "Paste a text"), /* @__PURE__ */ import_react12.default.createElement("button", { style: styles.amendBtn, onClick: () => setShowAmend(true) }, /* @__PURE__ */ import_react12.default.createElement(Pencil, { size: 16 }), "Amend via text"), USE_LEGACY_CSV && /* @__PURE__ */ import_react12.default.createElement("button", { style: styles.csvBtn, onClick: () => setShowCsv(true) }, /* @__PURE__ */ import_react12.default.createElement(FileText, { size: 16 }), "Import from sheet"), USE_LEGACY_CSV && /* @__PURE__ */ import_react12.default.createElement(
      "button",
      {
        style: styles.checkFormBtn,
        onClick: checkFormNow,
        onContextMenu: (e) => {
          e.preventDefault();
          resetRecentSeenRows();
        },
        onTouchStart: (e) => {
          const t = setTimeout(() => resetRecentSeenRows(), 700);
          e.currentTarget._ltbLongPress = t;
        },
        onTouchEnd: (e) => {
          clearTimeout(e.currentTarget._ltbLongPress);
        },
        onTouchMove: (e) => {
          clearTimeout(e.currentTarget._ltbLongPress);
        },
        disabled: checkingForm
      },
      /* @__PURE__ */ import_react12.default.createElement(RotateCcw, { size: 16, style: checkingForm ? styles.spinning : void 0 }),
      checkingForm ? "Checking..." : "Check for new orders"
    )), showPaste && /* @__PURE__ */ import_react12.default.createElement(
      PasteOrderCard,
      {
        menu,
        onParsed: (draft) => {
          setShowPaste(false);
          setFormMode(draft);
        },
        onCancel: () => setShowPaste(false)
      }
    ), showAmend && /* @__PURE__ */ import_react12.default.createElement(
      AmendOrderCard,
      {
        menu,
        orders: activeOrders,
        onAmended: (draft) => {
          setShowAmend(false);
          setFormMode(draft);
        },
        onCancel: () => setShowAmend(false)
      }
    ), showCsv && /* @__PURE__ */ import_react12.default.createElement(
      CsvImportCard,
      {
        menu,
        onImport: importOrders,
        onCancel: () => setShowCsv(false)
      }
    ), formMode && /* @__PURE__ */ import_react12.default.createElement(
      OrderForm,
      {
        menu,
        initial: formMode === "new" ? null : formMode,
        recentCustomers,
        regulars,
        onSave: saveOrder,
        onCancel: () => setFormMode(null)
      }
    ), activeOrders.length === 0 && !formMode && !showPaste && pendingOrders.length === 0 && /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.emptyState }, /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.emptyTitle }, "No active orders"), /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.emptyBody }, 'Tap "New order" to build one, "Paste a text" to auto-read an order, or "Import from sheet" to pull in Google Form orders.')), pendingOrders.length > 0 && !formMode && !showPaste && !showCsv && /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.pendingSection }, /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.pendingSectionHeader }, /* @__PURE__ */ import_react12.default.createElement("span", { style: styles.pendingBadge }, pendingOrders.length), /* @__PURE__ */ import_react12.default.createElement("span", { style: styles.pendingSectionTitle }, "Pending form order", pendingOrders.length !== 1 ? "s" : "")), pendingOrders.map((p, idx) => showPendingIdx === idx ? /* @__PURE__ */ import_react12.default.createElement("div", { key: p.pendingId, style: styles.pendingCard }, /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.pendingCardHeader }, /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.pendingCardName }, p.customer), /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.pendingCardTime }, p.timestamp), (p.address || p.phone) && /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.pendingContactRow }, p.address && /* @__PURE__ */ import_react12.default.createElement("span", { style: styles.pendingContact }, "\u{1F4CD} ", p.address), p.phone && /* @__PURE__ */ import_react12.default.createElement("span", { style: styles.pendingContact }, "\u{1F4DE} ", p.phone))), /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.pendingItemList }, p.items.map((it, i) => /* @__PURE__ */ import_react12.default.createElement("div", { key: i, style: styles.pendingItem }, /* @__PURE__ */ import_react12.default.createElement("span", { style: styles.pendingItemName }, it.name), it.variant && /* @__PURE__ */ import_react12.default.createElement("span", { style: styles.pendingItemVariant }, " \u2014 ", it.variant), /* @__PURE__ */ import_react12.default.createElement("span", { style: styles.pendingItemPrice }, " $", it.price.toFixed(2)))), p.notes && /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.pendingNotesSection }, /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.pendingNotes }, "Notes: ", p.notes), parsedNotes[p.pendingId] ? /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.parsedNotesCard }, /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.parsedNotesTitle }, "AI interpretation"), parsedNotes[p.pendingId].summary && /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.parsedNotesSummary }, parsedNotes[p.pendingId].summary), ["spice", "substitutions", "extras", "delivery", "other"].map(
      (k) => parsedNotes[p.pendingId][k] ? /* @__PURE__ */ import_react12.default.createElement("div", { key: k, style: styles.parsedNotesItem }, /* @__PURE__ */ import_react12.default.createElement("span", { style: styles.parsedNotesKey }, k, ":"), " ", parsedNotes[p.pendingId][k]) : null
    )) : /* @__PURE__ */ import_react12.default.createElement(
      "button",
      {
        style: styles.parseNotesBtn,
        disabled: parsingNotes === p.pendingId,
        onClick: async () => {
          setParsingNotes(p.pendingId);
          const result = await parseFormNotes(p.notes);
          if (result) setParsedNotes((prev) => ({ ...prev, [p.pendingId]: result }));
          setParsingNotes(null);
        }
      },
      parsingNotes === p.pendingId ? "Parsing..." : "Parse notes with AI"
    ))), /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.pendingActions }, /* @__PURE__ */ import_react12.default.createElement("button", { style: styles.pendingAcceptBtn, onClick: () => acceptPending(p) }, /* @__PURE__ */ import_react12.default.createElement(Check, { size: 16 }), " Accept"), /* @__PURE__ */ import_react12.default.createElement("button", { style: styles.pendingRejectBtn, onClick: () => dismissPending(p.pendingId) }, /* @__PURE__ */ import_react12.default.createElement(X, { size: 16 }), " Reject"), /* @__PURE__ */ import_react12.default.createElement("button", { style: styles.pendingBackBtn, onClick: () => setShowPendingIdx(null) }, "Back"))) : /* @__PURE__ */ import_react12.default.createElement("button", { key: p.pendingId, style: styles.pendingRow, onClick: () => setShowPendingIdx(idx) }, /* @__PURE__ */ import_react12.default.createElement("span", { style: styles.pendingRowName }, p.customer), /* @__PURE__ */ import_react12.default.createElement("span", { style: styles.pendingRowCount }, p.items.length, " item", p.items.length !== 1 ? "s" : ""), /* @__PURE__ */ import_react12.default.createElement(ChevronDown, { size: 16 })))), /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.orderList }, activeOrders.map((order) => /* @__PURE__ */ import_react12.default.createElement(
      OrderCard,
      {
        key: order.id,
        order,
        regulars,
        expanded: expandedOrder === order.id,
        onToggle: () => setExpandedOrder(expandedOrder === order.id ? null : order.id),
        onUpdate: (patch) => updateOrder(order.id, patch),
        onDelete: () => deleteOrder(order.id),
        onEdit: () => {
          setFormMode(order);
          setExpandedOrder(null);
        }
      }
    ))), deliveredOrders.length > 0 && /* @__PURE__ */ import_react12.default.createElement("details", { style: styles.deliveredSection }, /* @__PURE__ */ import_react12.default.createElement("summary", { style: styles.deliveredSummary }, "Delivered (", deliveredOrders.length, ")"), /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.orderList }, deliveredOrders.map((order) => /* @__PURE__ */ import_react12.default.createElement(
      OrderCard,
      {
        key: order.id,
        order,
        regulars,
        expanded: expandedOrder === order.id,
        onToggle: () => setExpandedOrder(expandedOrder === order.id ? null : order.id),
        onUpdate: (patch) => updateOrder(order.id, patch),
        onDelete: () => deleteOrder(order.id),
        onEdit: () => {
          setFormMode(order);
          setExpandedOrder(null);
        }
      }
    ))), /* @__PURE__ */ import_react12.default.createElement(ArchiveDeliveredButton, { count: deliveredOrders.length, onArchive: archiveDelivered }))), view === "cook" && /* @__PURE__ */ import_react12.default.createElement(import_react12.default.Fragment, null, /* @__PURE__ */ import_react12.default.createElement("div", { style: styles.cookSubToggle }, /* @__PURE__ */ import_react12.default.createElement(
      "button",
      {
        style: { ...styles.cookSubBtn, ...cookSubView === "cook" ? styles.cookSubBtnActive : {} },
        onClick: () => setCookSubView("cook")
      },
      "Cook"
    ), /* @__PURE__ */ import_react12.default.createElement(
      "button",
      {
        style: { ...styles.cookSubBtn, ...cookSubView === "deliver" ? styles.cookSubBtnActive : {} },
        onClick: () => setCookSubView("deliver")
      },
      "Deliver"
    )), cookSubView === "cook" ? /* @__PURE__ */ import_react12.default.createElement(
      CookingList,
      {
        items: cookingList,
        orderCount: activeOrders.length,
        revenue: activeFinancials.revenue,
        checks: cookChecks,
        onToggle: toggleCheck,
        onReset: resetChecks
      }
    ) : /* @__PURE__ */ import_react12.default.createElement(
      DeliverList,
      {
        groups: deliverList,
        orderCount: activeOrders.length,
        checks: deliverChecks,
        onToggle: toggleDeliverCheck,
        onReset: resetDeliverChecks
      }
    )), view === "shop" && /* @__PURE__ */ import_react12.default.createElement(
      ShoppingList,
      {
        items: shopping,
        onChange: persistShopping,
        onGenerate: generateShopping,
        activeCount: activeOrders.length,
        estCost: activeFinancials.cost,
        weekDishes,
        inventory,
        onAdjustInventory: adjustInventory,
        onSetInventory: setInventoryCount,
        dishNotes,
        onSaveDishNote: saveDishNote
      }
    ), view === "money" && /* @__PURE__ */ import_react12.default.createElement(MoneyTab, { orders: orders || [], onUpdate: updateOrder }), view === "regulars" && /* @__PURE__ */ import_react12.default.createElement(
      RegularsTab,
      {
        regulars,
        orders: orders || [],
        onAdd: addRegular,
        onUpdate: updateRegular,
        onDelete: deleteRegular,
        onLink: linkOrderToRegular,
        onUnlink: unlinkOrderFromRegular
      }
    ), view === "week" && /* @__PURE__ */ import_react12.default.createElement(WeekTab, { selected: weekDishes, onToggle: toggleWeekDish, onPublish: publishWeek })));
  }

  // entry.jsx
  var container = document.getElementById("root");
  var root = (0, import_client.createRoot)(container);
  root.render(import_react13.default.createElement(LTBOrderTracker));
})();
/*! Bundled license information:

react/cjs/react.production.min.js:
  (**
   * @license React
   * react.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

scheduler/cjs/scheduler.production.min.js:
  (**
   * @license React
   * scheduler.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.production.min.js:
  (**
   * @license React
   * react-dom.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/

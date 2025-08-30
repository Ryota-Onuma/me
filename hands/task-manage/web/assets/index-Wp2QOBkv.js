(function () {
  const t = document.createElement("link").relList;
  if (t && t.supports && t.supports("modulepreload")) return;
  for (const l of document.querySelectorAll('link[rel="modulepreload"]')) r(l);
  new MutationObserver((l) => {
    for (const o of l)
      if (o.type === "childList")
        for (const u of o.addedNodes)
          u.tagName === "LINK" && u.rel === "modulepreload" && r(u);
  }).observe(document, { childList: !0, subtree: !0 });
  function n(l) {
    const o = {};
    return (
      l.integrity && (o.integrity = l.integrity),
      l.referrerPolicy && (o.referrerPolicy = l.referrerPolicy),
      l.crossOrigin === "use-credentials"
        ? (o.credentials = "include")
        : l.crossOrigin === "anonymous"
          ? (o.credentials = "omit")
          : (o.credentials = "same-origin"),
      o
    );
  }
  function r(l) {
    if (l.ep) return;
    l.ep = !0;
    const o = n(l);
    fetch(l.href, o);
  }
})();
var Ji = { exports: {} },
  il = {},
  Zi = { exports: {} },
  D = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var er = Symbol.for("react.element"),
  ac = Symbol.for("react.portal"),
  cc = Symbol.for("react.fragment"),
  fc = Symbol.for("react.strict_mode"),
  dc = Symbol.for("react.profiler"),
  pc = Symbol.for("react.provider"),
  mc = Symbol.for("react.context"),
  hc = Symbol.for("react.forward_ref"),
  vc = Symbol.for("react.suspense"),
  yc = Symbol.for("react.memo"),
  gc = Symbol.for("react.lazy"),
  Uu = Symbol.iterator;
function wc(e) {
  return e === null || typeof e != "object"
    ? null
    : ((e = (Uu && e[Uu]) || e["@@iterator"]),
      typeof e == "function" ? e : null);
}
var qi = {
    isMounted: function () {
      return !1;
    },
    enqueueForceUpdate: function () {},
    enqueueReplaceState: function () {},
    enqueueSetState: function () {},
  },
  bi = Object.assign,
  es = {};
function cn(e, t, n) {
  ((this.props = e),
    (this.context = t),
    (this.refs = es),
    (this.updater = n || qi));
}
cn.prototype.isReactComponent = {};
cn.prototype.setState = function (e, t) {
  if (typeof e != "object" && typeof e != "function" && e != null)
    throw Error(
      "setState(...): takes an object of state variables to update or a function which returns an object of state variables.",
    );
  this.updater.enqueueSetState(this, e, t, "setState");
};
cn.prototype.forceUpdate = function (e) {
  this.updater.enqueueForceUpdate(this, e, "forceUpdate");
};
function ts() {}
ts.prototype = cn.prototype;
function Qo(e, t, n) {
  ((this.props = e),
    (this.context = t),
    (this.refs = es),
    (this.updater = n || qi));
}
var Ko = (Qo.prototype = new ts());
Ko.constructor = Qo;
bi(Ko, cn.prototype);
Ko.isPureReactComponent = !0;
var Au = Array.isArray,
  ns = Object.prototype.hasOwnProperty,
  Yo = { current: null },
  rs = { key: !0, ref: !0, __self: !0, __source: !0 };
function ls(e, t, n) {
  var r,
    l = {},
    o = null,
    u = null;
  if (t != null)
    for (r in (t.ref !== void 0 && (u = t.ref),
    t.key !== void 0 && (o = "" + t.key),
    t))
      ns.call(t, r) && !rs.hasOwnProperty(r) && (l[r] = t[r]);
  var i = arguments.length - 2;
  if (i === 1) l.children = n;
  else if (1 < i) {
    for (var s = Array(i), c = 0; c < i; c++) s[c] = arguments[c + 2];
    l.children = s;
  }
  if (e && e.defaultProps)
    for (r in ((i = e.defaultProps), i)) l[r] === void 0 && (l[r] = i[r]);
  return {
    $$typeof: er,
    type: e,
    key: o,
    ref: u,
    props: l,
    _owner: Yo.current,
  };
}
function Sc(e, t) {
  return {
    $$typeof: er,
    type: e.type,
    key: t,
    ref: e.ref,
    props: e.props,
    _owner: e._owner,
  };
}
function Xo(e) {
  return typeof e == "object" && e !== null && e.$$typeof === er;
}
function kc(e) {
  var t = { "=": "=0", ":": "=2" };
  return (
    "$" +
    e.replace(/[=:]/g, function (n) {
      return t[n];
    })
  );
}
var Vu = /\/+/g;
function Nl(e, t) {
  return typeof e == "object" && e !== null && e.key != null
    ? kc("" + e.key)
    : t.toString(36);
}
function _r(e, t, n, r, l) {
  var o = typeof e;
  (o === "undefined" || o === "boolean") && (e = null);
  var u = !1;
  if (e === null) u = !0;
  else
    switch (o) {
      case "string":
      case "number":
        u = !0;
        break;
      case "object":
        switch (e.$$typeof) {
          case er:
          case ac:
            u = !0;
        }
    }
  if (u)
    return (
      (u = e),
      (l = l(u)),
      (e = r === "" ? "." + Nl(u, 0) : r),
      Au(l)
        ? ((n = ""),
          e != null && (n = e.replace(Vu, "$&/") + "/"),
          _r(l, t, n, "", function (c) {
            return c;
          }))
        : l != null &&
          (Xo(l) &&
            (l = Sc(
              l,
              n +
                (!l.key || (u && u.key === l.key)
                  ? ""
                  : ("" + l.key).replace(Vu, "$&/") + "/") +
                e,
            )),
          t.push(l)),
      1
    );
  if (((u = 0), (r = r === "" ? "." : r + ":"), Au(e)))
    for (var i = 0; i < e.length; i++) {
      o = e[i];
      var s = r + Nl(o, i);
      u += _r(o, t, n, s, l);
    }
  else if (((s = wc(e)), typeof s == "function"))
    for (e = s.call(e), i = 0; !(o = e.next()).done; )
      ((o = o.value), (s = r + Nl(o, i++)), (u += _r(o, t, n, s, l)));
  else if (o === "object")
    throw (
      (t = String(e)),
      Error(
        "Objects are not valid as a React child (found: " +
          (t === "[object Object]"
            ? "object with keys {" + Object.keys(e).join(", ") + "}"
            : t) +
          "). If you meant to render a collection of children, use an array instead.",
      )
    );
  return u;
}
function sr(e, t, n) {
  if (e == null) return e;
  var r = [],
    l = 0;
  return (
    _r(e, r, "", "", function (o) {
      return t.call(n, o, l++);
    }),
    r
  );
}
function xc(e) {
  if (e._status === -1) {
    var t = e._result;
    ((t = t()),
      t.then(
        function (n) {
          (e._status === 0 || e._status === -1) &&
            ((e._status = 1), (e._result = n));
        },
        function (n) {
          (e._status === 0 || e._status === -1) &&
            ((e._status = 2), (e._result = n));
        },
      ),
      e._status === -1 && ((e._status = 0), (e._result = t)));
  }
  if (e._status === 1) return e._result.default;
  throw e._result;
}
var de = { current: null },
  Nr = { transition: null },
  Ec = {
    ReactCurrentDispatcher: de,
    ReactCurrentBatchConfig: Nr,
    ReactCurrentOwner: Yo,
  };
function os() {
  throw Error("act(...) is not supported in production builds of React.");
}
D.Children = {
  map: sr,
  forEach: function (e, t, n) {
    sr(
      e,
      function () {
        t.apply(this, arguments);
      },
      n,
    );
  },
  count: function (e) {
    var t = 0;
    return (
      sr(e, function () {
        t++;
      }),
      t
    );
  },
  toArray: function (e) {
    return (
      sr(e, function (t) {
        return t;
      }) || []
    );
  },
  only: function (e) {
    if (!Xo(e))
      throw Error(
        "React.Children.only expected to receive a single React element child.",
      );
    return e;
  },
};
D.Component = cn;
D.Fragment = cc;
D.Profiler = dc;
D.PureComponent = Qo;
D.StrictMode = fc;
D.Suspense = vc;
D.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Ec;
D.act = os;
D.cloneElement = function (e, t, n) {
  if (e == null)
    throw Error(
      "React.cloneElement(...): The argument must be a React element, but you passed " +
        e +
        ".",
    );
  var r = bi({}, e.props),
    l = e.key,
    o = e.ref,
    u = e._owner;
  if (t != null) {
    if (
      (t.ref !== void 0 && ((o = t.ref), (u = Yo.current)),
      t.key !== void 0 && (l = "" + t.key),
      e.type && e.type.defaultProps)
    )
      var i = e.type.defaultProps;
    for (s in t)
      ns.call(t, s) &&
        !rs.hasOwnProperty(s) &&
        (r[s] = t[s] === void 0 && i !== void 0 ? i[s] : t[s]);
  }
  var s = arguments.length - 2;
  if (s === 1) r.children = n;
  else if (1 < s) {
    i = Array(s);
    for (var c = 0; c < s; c++) i[c] = arguments[c + 2];
    r.children = i;
  }
  return { $$typeof: er, type: e.type, key: l, ref: o, props: r, _owner: u };
};
D.createContext = function (e) {
  return (
    (e = {
      $$typeof: mc,
      _currentValue: e,
      _currentValue2: e,
      _threadCount: 0,
      Provider: null,
      Consumer: null,
      _defaultValue: null,
      _globalName: null,
    }),
    (e.Provider = { $$typeof: pc, _context: e }),
    (e.Consumer = e)
  );
};
D.createElement = ls;
D.createFactory = function (e) {
  var t = ls.bind(null, e);
  return ((t.type = e), t);
};
D.createRef = function () {
  return { current: null };
};
D.forwardRef = function (e) {
  return { $$typeof: hc, render: e };
};
D.isValidElement = Xo;
D.lazy = function (e) {
  return { $$typeof: gc, _payload: { _status: -1, _result: e }, _init: xc };
};
D.memo = function (e, t) {
  return { $$typeof: yc, type: e, compare: t === void 0 ? null : t };
};
D.startTransition = function (e) {
  var t = Nr.transition;
  Nr.transition = {};
  try {
    e();
  } finally {
    Nr.transition = t;
  }
};
D.unstable_act = os;
D.useCallback = function (e, t) {
  return de.current.useCallback(e, t);
};
D.useContext = function (e) {
  return de.current.useContext(e);
};
D.useDebugValue = function () {};
D.useDeferredValue = function (e) {
  return de.current.useDeferredValue(e);
};
D.useEffect = function (e, t) {
  return de.current.useEffect(e, t);
};
D.useId = function () {
  return de.current.useId();
};
D.useImperativeHandle = function (e, t, n) {
  return de.current.useImperativeHandle(e, t, n);
};
D.useInsertionEffect = function (e, t) {
  return de.current.useInsertionEffect(e, t);
};
D.useLayoutEffect = function (e, t) {
  return de.current.useLayoutEffect(e, t);
};
D.useMemo = function (e, t) {
  return de.current.useMemo(e, t);
};
D.useReducer = function (e, t, n) {
  return de.current.useReducer(e, t, n);
};
D.useRef = function (e) {
  return de.current.useRef(e);
};
D.useState = function (e) {
  return de.current.useState(e);
};
D.useSyncExternalStore = function (e, t, n) {
  return de.current.useSyncExternalStore(e, t, n);
};
D.useTransition = function () {
  return de.current.useTransition();
};
D.version = "18.3.1";
Zi.exports = D;
var O = Zi.exports;
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Cc = O,
  _c = Symbol.for("react.element"),
  Nc = Symbol.for("react.fragment"),
  Pc = Object.prototype.hasOwnProperty,
  Tc = Cc.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
  zc = { key: !0, ref: !0, __self: !0, __source: !0 };
function us(e, t, n) {
  var r,
    l = {},
    o = null,
    u = null;
  (n !== void 0 && (o = "" + n),
    t.key !== void 0 && (o = "" + t.key),
    t.ref !== void 0 && (u = t.ref));
  for (r in t) Pc.call(t, r) && !zc.hasOwnProperty(r) && (l[r] = t[r]);
  if (e && e.defaultProps)
    for (r in ((t = e.defaultProps), t)) l[r] === void 0 && (l[r] = t[r]);
  return {
    $$typeof: _c,
    type: e,
    key: o,
    ref: u,
    props: l,
    _owner: Tc.current,
  };
}
il.Fragment = Nc;
il.jsx = us;
il.jsxs = us;
Ji.exports = il;
var S = Ji.exports,
  is = { exports: {} },
  Ce = {},
  ss = { exports: {} },
  as = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ (function (e) {
  function t(x, L) {
    var R = x.length;
    x.push(L);
    e: for (; 0 < R; ) {
      var X = (R - 1) >>> 1,
        ee = x[X];
      if (0 < l(ee, L)) ((x[X] = L), (x[R] = ee), (R = X));
      else break e;
    }
  }
  function n(x) {
    return x.length === 0 ? null : x[0];
  }
  function r(x) {
    if (x.length === 0) return null;
    var L = x[0],
      R = x.pop();
    if (R !== L) {
      x[0] = R;
      e: for (var X = 0, ee = x.length, ur = ee >>> 1; X < ur; ) {
        var kt = 2 * (X + 1) - 1,
          _l = x[kt],
          xt = kt + 1,
          ir = x[xt];
        if (0 > l(_l, R))
          xt < ee && 0 > l(ir, _l)
            ? ((x[X] = ir), (x[xt] = R), (X = xt))
            : ((x[X] = _l), (x[kt] = R), (X = kt));
        else if (xt < ee && 0 > l(ir, R)) ((x[X] = ir), (x[xt] = R), (X = xt));
        else break e;
      }
    }
    return L;
  }
  function l(x, L) {
    var R = x.sortIndex - L.sortIndex;
    return R !== 0 ? R : x.id - L.id;
  }
  if (typeof performance == "object" && typeof performance.now == "function") {
    var o = performance;
    e.unstable_now = function () {
      return o.now();
    };
  } else {
    var u = Date,
      i = u.now();
    e.unstable_now = function () {
      return u.now() - i;
    };
  }
  var s = [],
    c = [],
    h = 1,
    m = null,
    p = 3,
    y = !1,
    g = !1,
    k = !1,
    j = typeof setTimeout == "function" ? setTimeout : null,
    f = typeof clearTimeout == "function" ? clearTimeout : null,
    a = typeof setImmediate < "u" ? setImmediate : null;
  typeof navigator < "u" &&
    navigator.scheduling !== void 0 &&
    navigator.scheduling.isInputPending !== void 0 &&
    navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function d(x) {
    for (var L = n(c); L !== null; ) {
      if (L.callback === null) r(c);
      else if (L.startTime <= x)
        (r(c), (L.sortIndex = L.expirationTime), t(s, L));
      else break;
      L = n(c);
    }
  }
  function v(x) {
    if (((k = !1), d(x), !g))
      if (n(s) !== null) ((g = !0), z(E));
      else {
        var L = n(c);
        L !== null && K(v, L.startTime - x);
      }
  }
  function E(x, L) {
    ((g = !1), k && ((k = !1), f(P), (P = -1)), (y = !0));
    var R = p;
    try {
      for (
        d(L), m = n(s);
        m !== null && (!(m.expirationTime > L) || (x && !U()));

      ) {
        var X = m.callback;
        if (typeof X == "function") {
          ((m.callback = null), (p = m.priorityLevel));
          var ee = X(m.expirationTime <= L);
          ((L = e.unstable_now()),
            typeof ee == "function" ? (m.callback = ee) : m === n(s) && r(s),
            d(L));
        } else r(s);
        m = n(s);
      }
      if (m !== null) var ur = !0;
      else {
        var kt = n(c);
        (kt !== null && K(v, kt.startTime - L), (ur = !1));
      }
      return ur;
    } finally {
      ((m = null), (p = R), (y = !1));
    }
  }
  var C = !1,
    N = null,
    P = -1,
    $ = 5,
    T = -1;
  function U() {
    return !(e.unstable_now() - T < $);
  }
  function b() {
    if (N !== null) {
      var x = e.unstable_now();
      T = x;
      var L = !0;
      try {
        L = N(!0, x);
      } finally {
        L ? Ue() : ((C = !1), (N = null));
      }
    } else C = !1;
  }
  var Ue;
  if (typeof a == "function")
    Ue = function () {
      a(b);
    };
  else if (typeof MessageChannel < "u") {
    var or = new MessageChannel(),
      Cl = or.port2;
    ((or.port1.onmessage = b),
      (Ue = function () {
        Cl.postMessage(null);
      }));
  } else
    Ue = function () {
      j(b, 0);
    };
  function z(x) {
    ((N = x), C || ((C = !0), Ue()));
  }
  function K(x, L) {
    P = j(function () {
      x(e.unstable_now());
    }, L);
  }
  ((e.unstable_IdlePriority = 5),
    (e.unstable_ImmediatePriority = 1),
    (e.unstable_LowPriority = 4),
    (e.unstable_NormalPriority = 3),
    (e.unstable_Profiling = null),
    (e.unstable_UserBlockingPriority = 2),
    (e.unstable_cancelCallback = function (x) {
      x.callback = null;
    }),
    (e.unstable_continueExecution = function () {
      g || y || ((g = !0), z(E));
    }),
    (e.unstable_forceFrameRate = function (x) {
      0 > x || 125 < x
        ? console.error(
            "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported",
          )
        : ($ = 0 < x ? Math.floor(1e3 / x) : 5);
    }),
    (e.unstable_getCurrentPriorityLevel = function () {
      return p;
    }),
    (e.unstable_getFirstCallbackNode = function () {
      return n(s);
    }),
    (e.unstable_next = function (x) {
      switch (p) {
        case 1:
        case 2:
        case 3:
          var L = 3;
          break;
        default:
          L = p;
      }
      var R = p;
      p = L;
      try {
        return x();
      } finally {
        p = R;
      }
    }),
    (e.unstable_pauseExecution = function () {}),
    (e.unstable_requestPaint = function () {}),
    (e.unstable_runWithPriority = function (x, L) {
      switch (x) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          x = 3;
      }
      var R = p;
      p = x;
      try {
        return L();
      } finally {
        p = R;
      }
    }),
    (e.unstable_scheduleCallback = function (x, L, R) {
      var X = e.unstable_now();
      switch (
        (typeof R == "object" && R !== null
          ? ((R = R.delay), (R = typeof R == "number" && 0 < R ? X + R : X))
          : (R = X),
        x)
      ) {
        case 1:
          var ee = -1;
          break;
        case 2:
          ee = 250;
          break;
        case 5:
          ee = 1073741823;
          break;
        case 4:
          ee = 1e4;
          break;
        default:
          ee = 5e3;
      }
      return (
        (ee = R + ee),
        (x = {
          id: h++,
          callback: L,
          priorityLevel: x,
          startTime: R,
          expirationTime: ee,
          sortIndex: -1,
        }),
        R > X
          ? ((x.sortIndex = R),
            t(c, x),
            n(s) === null &&
              x === n(c) &&
              (k ? (f(P), (P = -1)) : (k = !0), K(v, R - X)))
          : ((x.sortIndex = ee), t(s, x), g || y || ((g = !0), z(E))),
        x
      );
    }),
    (e.unstable_shouldYield = U),
    (e.unstable_wrapCallback = function (x) {
      var L = p;
      return function () {
        var R = p;
        p = L;
        try {
          return x.apply(this, arguments);
        } finally {
          p = R;
        }
      };
    }));
})(as);
ss.exports = as;
var jc = ss.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Lc = O,
  Ee = jc;
function w(e) {
  for (
    var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1;
    n < arguments.length;
    n++
  )
    t += "&args[]=" + encodeURIComponent(arguments[n]);
  return (
    "Minified React error #" +
    e +
    "; visit " +
    t +
    " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
  );
}
var cs = new Set(),
  Fn = {};
function Mt(e, t) {
  (nn(e, t), nn(e + "Capture", t));
}
function nn(e, t) {
  for (Fn[e] = t, e = 0; e < t.length; e++) cs.add(t[e]);
}
var Je = !(
    typeof window > "u" ||
    typeof window.document > "u" ||
    typeof window.document.createElement > "u"
  ),
  ql = Object.prototype.hasOwnProperty,
  Rc =
    /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
  Bu = {},
  Hu = {};
function Oc(e) {
  return ql.call(Hu, e)
    ? !0
    : ql.call(Bu, e)
      ? !1
      : Rc.test(e)
        ? (Hu[e] = !0)
        : ((Bu[e] = !0), !1);
}
function Dc(e, t, n, r) {
  if (n !== null && n.type === 0) return !1;
  switch (typeof t) {
    case "function":
    case "symbol":
      return !0;
    case "boolean":
      return r
        ? !1
        : n !== null
          ? !n.acceptsBooleans
          : ((e = e.toLowerCase().slice(0, 5)), e !== "data-" && e !== "aria-");
    default:
      return !1;
  }
}
function Mc(e, t, n, r) {
  if (t === null || typeof t > "u" || Dc(e, t, n, r)) return !0;
  if (r) return !1;
  if (n !== null)
    switch (n.type) {
      case 3:
        return !t;
      case 4:
        return t === !1;
      case 5:
        return isNaN(t);
      case 6:
        return isNaN(t) || 1 > t;
    }
  return !1;
}
function pe(e, t, n, r, l, o, u) {
  ((this.acceptsBooleans = t === 2 || t === 3 || t === 4),
    (this.attributeName = r),
    (this.attributeNamespace = l),
    (this.mustUseProperty = n),
    (this.propertyName = e),
    (this.type = t),
    (this.sanitizeURL = o),
    (this.removeEmptyString = u));
}
var oe = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style"
  .split(" ")
  .forEach(function (e) {
    oe[e] = new pe(e, 0, !1, e, null, !1, !1);
  });
[
  ["acceptCharset", "accept-charset"],
  ["className", "class"],
  ["htmlFor", "for"],
  ["httpEquiv", "http-equiv"],
].forEach(function (e) {
  var t = e[0];
  oe[t] = new pe(t, 1, !1, e[1], null, !1, !1);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function (e) {
  oe[e] = new pe(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
[
  "autoReverse",
  "externalResourcesRequired",
  "focusable",
  "preserveAlpha",
].forEach(function (e) {
  oe[e] = new pe(e, 2, !1, e, null, !1, !1);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope"
  .split(" ")
  .forEach(function (e) {
    oe[e] = new pe(e, 3, !1, e.toLowerCase(), null, !1, !1);
  });
["checked", "multiple", "muted", "selected"].forEach(function (e) {
  oe[e] = new pe(e, 3, !0, e, null, !1, !1);
});
["capture", "download"].forEach(function (e) {
  oe[e] = new pe(e, 4, !1, e, null, !1, !1);
});
["cols", "rows", "size", "span"].forEach(function (e) {
  oe[e] = new pe(e, 6, !1, e, null, !1, !1);
});
["rowSpan", "start"].forEach(function (e) {
  oe[e] = new pe(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var Go = /[\-:]([a-z])/g;
function Jo(e) {
  return e[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height"
  .split(" ")
  .forEach(function (e) {
    var t = e.replace(Go, Jo);
    oe[t] = new pe(t, 1, !1, e, null, !1, !1);
  });
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type"
  .split(" ")
  .forEach(function (e) {
    var t = e.replace(Go, Jo);
    oe[t] = new pe(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
  });
["xml:base", "xml:lang", "xml:space"].forEach(function (e) {
  var t = e.replace(Go, Jo);
  oe[t] = new pe(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
});
["tabIndex", "crossOrigin"].forEach(function (e) {
  oe[e] = new pe(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
oe.xlinkHref = new pe(
  "xlinkHref",
  1,
  !1,
  "xlink:href",
  "http://www.w3.org/1999/xlink",
  !0,
  !1,
);
["src", "href", "action", "formAction"].forEach(function (e) {
  oe[e] = new pe(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function Zo(e, t, n, r) {
  var l = oe.hasOwnProperty(t) ? oe[t] : null;
  (l !== null
    ? l.type !== 0
    : r ||
      !(2 < t.length) ||
      (t[0] !== "o" && t[0] !== "O") ||
      (t[1] !== "n" && t[1] !== "N")) &&
    (Mc(t, n, l, r) && (n = null),
    r || l === null
      ? Oc(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n))
      : l.mustUseProperty
        ? (e[l.propertyName] = n === null ? (l.type === 3 ? !1 : "") : n)
        : ((t = l.attributeName),
          (r = l.attributeNamespace),
          n === null
            ? e.removeAttribute(t)
            : ((l = l.type),
              (n = l === 3 || (l === 4 && n === !0) ? "" : "" + n),
              r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
}
var et = Lc.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  ar = Symbol.for("react.element"),
  $t = Symbol.for("react.portal"),
  Ut = Symbol.for("react.fragment"),
  qo = Symbol.for("react.strict_mode"),
  bl = Symbol.for("react.profiler"),
  fs = Symbol.for("react.provider"),
  ds = Symbol.for("react.context"),
  bo = Symbol.for("react.forward_ref"),
  eo = Symbol.for("react.suspense"),
  to = Symbol.for("react.suspense_list"),
  eu = Symbol.for("react.memo"),
  nt = Symbol.for("react.lazy"),
  ps = Symbol.for("react.offscreen"),
  Wu = Symbol.iterator;
function pn(e) {
  return e === null || typeof e != "object"
    ? null
    : ((e = (Wu && e[Wu]) || e["@@iterator"]),
      typeof e == "function" ? e : null);
}
var Q = Object.assign,
  Pl;
function xn(e) {
  if (Pl === void 0)
    try {
      throw Error();
    } catch (n) {
      var t = n.stack.trim().match(/\n( *(at )?)/);
      Pl = (t && t[1]) || "";
    }
  return (
    `
` +
    Pl +
    e
  );
}
var Tl = !1;
function zl(e, t) {
  if (!e || Tl) return "";
  Tl = !0;
  var n = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    if (t)
      if (
        ((t = function () {
          throw Error();
        }),
        Object.defineProperty(t.prototype, "props", {
          set: function () {
            throw Error();
          },
        }),
        typeof Reflect == "object" && Reflect.construct)
      ) {
        try {
          Reflect.construct(t, []);
        } catch (c) {
          var r = c;
        }
        Reflect.construct(e, [], t);
      } else {
        try {
          t.call();
        } catch (c) {
          r = c;
        }
        e.call(t.prototype);
      }
    else {
      try {
        throw Error();
      } catch (c) {
        r = c;
      }
      e();
    }
  } catch (c) {
    if (c && r && typeof c.stack == "string") {
      for (
        var l = c.stack.split(`
`),
          o = r.stack.split(`
`),
          u = l.length - 1,
          i = o.length - 1;
        1 <= u && 0 <= i && l[u] !== o[i];

      )
        i--;
      for (; 1 <= u && 0 <= i; u--, i--)
        if (l[u] !== o[i]) {
          if (u !== 1 || i !== 1)
            do
              if ((u--, i--, 0 > i || l[u] !== o[i])) {
                var s =
                  `
` + l[u].replace(" at new ", " at ");
                return (
                  e.displayName &&
                    s.includes("<anonymous>") &&
                    (s = s.replace("<anonymous>", e.displayName)),
                  s
                );
              }
            while (1 <= u && 0 <= i);
          break;
        }
    }
  } finally {
    ((Tl = !1), (Error.prepareStackTrace = n));
  }
  return (e = e ? e.displayName || e.name : "") ? xn(e) : "";
}
function Ic(e) {
  switch (e.tag) {
    case 5:
      return xn(e.type);
    case 16:
      return xn("Lazy");
    case 13:
      return xn("Suspense");
    case 19:
      return xn("SuspenseList");
    case 0:
    case 2:
    case 15:
      return ((e = zl(e.type, !1)), e);
    case 11:
      return ((e = zl(e.type.render, !1)), e);
    case 1:
      return ((e = zl(e.type, !0)), e);
    default:
      return "";
  }
}
function no(e) {
  if (e == null) return null;
  if (typeof e == "function") return e.displayName || e.name || null;
  if (typeof e == "string") return e;
  switch (e) {
    case Ut:
      return "Fragment";
    case $t:
      return "Portal";
    case bl:
      return "Profiler";
    case qo:
      return "StrictMode";
    case eo:
      return "Suspense";
    case to:
      return "SuspenseList";
  }
  if (typeof e == "object")
    switch (e.$$typeof) {
      case ds:
        return (e.displayName || "Context") + ".Consumer";
      case fs:
        return (e._context.displayName || "Context") + ".Provider";
      case bo:
        var t = e.render;
        return (
          (e = e.displayName),
          e ||
            ((e = t.displayName || t.name || ""),
            (e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef")),
          e
        );
      case eu:
        return (
          (t = e.displayName || null),
          t !== null ? t : no(e.type) || "Memo"
        );
      case nt:
        ((t = e._payload), (e = e._init));
        try {
          return no(e(t));
        } catch {}
    }
  return null;
}
function Fc(e) {
  var t = e.type;
  switch (e.tag) {
    case 24:
      return "Cache";
    case 9:
      return (t.displayName || "Context") + ".Consumer";
    case 10:
      return (t._context.displayName || "Context") + ".Provider";
    case 18:
      return "DehydratedFragment";
    case 11:
      return (
        (e = t.render),
        (e = e.displayName || e.name || ""),
        t.displayName || (e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef")
      );
    case 7:
      return "Fragment";
    case 5:
      return t;
    case 4:
      return "Portal";
    case 3:
      return "Root";
    case 6:
      return "Text";
    case 16:
      return no(t);
    case 8:
      return t === qo ? "StrictMode" : "Mode";
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
      if (typeof t == "function") return t.displayName || t.name || null;
      if (typeof t == "string") return t;
  }
  return null;
}
function vt(e) {
  switch (typeof e) {
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return e;
    case "object":
      return e;
    default:
      return "";
  }
}
function ms(e) {
  var t = e.type;
  return (
    (e = e.nodeName) &&
    e.toLowerCase() === "input" &&
    (t === "checkbox" || t === "radio")
  );
}
function $c(e) {
  var t = ms(e) ? "checked" : "value",
    n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t),
    r = "" + e[t];
  if (
    !e.hasOwnProperty(t) &&
    typeof n < "u" &&
    typeof n.get == "function" &&
    typeof n.set == "function"
  ) {
    var l = n.get,
      o = n.set;
    return (
      Object.defineProperty(e, t, {
        configurable: !0,
        get: function () {
          return l.call(this);
        },
        set: function (u) {
          ((r = "" + u), o.call(this, u));
        },
      }),
      Object.defineProperty(e, t, { enumerable: n.enumerable }),
      {
        getValue: function () {
          return r;
        },
        setValue: function (u) {
          r = "" + u;
        },
        stopTracking: function () {
          ((e._valueTracker = null), delete e[t]);
        },
      }
    );
  }
}
function cr(e) {
  e._valueTracker || (e._valueTracker = $c(e));
}
function hs(e) {
  if (!e) return !1;
  var t = e._valueTracker;
  if (!t) return !0;
  var n = t.getValue(),
    r = "";
  return (
    e && (r = ms(e) ? (e.checked ? "true" : "false") : e.value),
    (e = r),
    e !== n ? (t.setValue(e), !0) : !1
  );
}
function Fr(e) {
  if (((e = e || (typeof document < "u" ? document : void 0)), typeof e > "u"))
    return null;
  try {
    return e.activeElement || e.body;
  } catch {
    return e.body;
  }
}
function ro(e, t) {
  var n = t.checked;
  return Q({}, t, {
    defaultChecked: void 0,
    defaultValue: void 0,
    value: void 0,
    checked: n ?? e._wrapperState.initialChecked,
  });
}
function Qu(e, t) {
  var n = t.defaultValue == null ? "" : t.defaultValue,
    r = t.checked != null ? t.checked : t.defaultChecked;
  ((n = vt(t.value != null ? t.value : n)),
    (e._wrapperState = {
      initialChecked: r,
      initialValue: n,
      controlled:
        t.type === "checkbox" || t.type === "radio"
          ? t.checked != null
          : t.value != null,
    }));
}
function vs(e, t) {
  ((t = t.checked), t != null && Zo(e, "checked", t, !1));
}
function lo(e, t) {
  vs(e, t);
  var n = vt(t.value),
    r = t.type;
  if (n != null)
    r === "number"
      ? ((n === 0 && e.value === "") || e.value != n) && (e.value = "" + n)
      : e.value !== "" + n && (e.value = "" + n);
  else if (r === "submit" || r === "reset") {
    e.removeAttribute("value");
    return;
  }
  (t.hasOwnProperty("value")
    ? oo(e, t.type, n)
    : t.hasOwnProperty("defaultValue") && oo(e, t.type, vt(t.defaultValue)),
    t.checked == null &&
      t.defaultChecked != null &&
      (e.defaultChecked = !!t.defaultChecked));
}
function Ku(e, t, n) {
  if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
    var r = t.type;
    if (
      !(
        (r !== "submit" && r !== "reset") ||
        (t.value !== void 0 && t.value !== null)
      )
    )
      return;
    ((t = "" + e._wrapperState.initialValue),
      n || t === e.value || (e.value = t),
      (e.defaultValue = t));
  }
  ((n = e.name),
    n !== "" && (e.name = ""),
    (e.defaultChecked = !!e._wrapperState.initialChecked),
    n !== "" && (e.name = n));
}
function oo(e, t, n) {
  (t !== "number" || Fr(e.ownerDocument) !== e) &&
    (n == null
      ? (e.defaultValue = "" + e._wrapperState.initialValue)
      : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
}
var En = Array.isArray;
function Jt(e, t, n, r) {
  if (((e = e.options), t)) {
    t = {};
    for (var l = 0; l < n.length; l++) t["$" + n[l]] = !0;
    for (n = 0; n < e.length; n++)
      ((l = t.hasOwnProperty("$" + e[n].value)),
        e[n].selected !== l && (e[n].selected = l),
        l && r && (e[n].defaultSelected = !0));
  } else {
    for (n = "" + vt(n), t = null, l = 0; l < e.length; l++) {
      if (e[l].value === n) {
        ((e[l].selected = !0), r && (e[l].defaultSelected = !0));
        return;
      }
      t !== null || e[l].disabled || (t = e[l]);
    }
    t !== null && (t.selected = !0);
  }
}
function uo(e, t) {
  if (t.dangerouslySetInnerHTML != null) throw Error(w(91));
  return Q({}, t, {
    value: void 0,
    defaultValue: void 0,
    children: "" + e._wrapperState.initialValue,
  });
}
function Yu(e, t) {
  var n = t.value;
  if (n == null) {
    if (((n = t.children), (t = t.defaultValue), n != null)) {
      if (t != null) throw Error(w(92));
      if (En(n)) {
        if (1 < n.length) throw Error(w(93));
        n = n[0];
      }
      t = n;
    }
    (t == null && (t = ""), (n = t));
  }
  e._wrapperState = { initialValue: vt(n) };
}
function ys(e, t) {
  var n = vt(t.value),
    r = vt(t.defaultValue);
  (n != null &&
    ((n = "" + n),
    n !== e.value && (e.value = n),
    t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)),
    r != null && (e.defaultValue = "" + r));
}
function Xu(e) {
  var t = e.textContent;
  t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
}
function gs(e) {
  switch (e) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function io(e, t) {
  return e == null || e === "http://www.w3.org/1999/xhtml"
    ? gs(t)
    : e === "http://www.w3.org/2000/svg" && t === "foreignObject"
      ? "http://www.w3.org/1999/xhtml"
      : e;
}
var fr,
  ws = (function (e) {
    return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction
      ? function (t, n, r, l) {
          MSApp.execUnsafeLocalFunction(function () {
            return e(t, n, r, l);
          });
        }
      : e;
  })(function (e, t) {
    if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e)
      e.innerHTML = t;
    else {
      for (
        fr = fr || document.createElement("div"),
          fr.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>",
          t = fr.firstChild;
        e.firstChild;

      )
        e.removeChild(e.firstChild);
      for (; t.firstChild; ) e.appendChild(t.firstChild);
    }
  });
function $n(e, t) {
  if (t) {
    var n = e.firstChild;
    if (n && n === e.lastChild && n.nodeType === 3) {
      n.nodeValue = t;
      return;
    }
  }
  e.textContent = t;
}
var Pn = {
    animationIterationCount: !0,
    aspectRatio: !0,
    borderImageOutset: !0,
    borderImageSlice: !0,
    borderImageWidth: !0,
    boxFlex: !0,
    boxFlexGroup: !0,
    boxOrdinalGroup: !0,
    columnCount: !0,
    columns: !0,
    flex: !0,
    flexGrow: !0,
    flexPositive: !0,
    flexShrink: !0,
    flexNegative: !0,
    flexOrder: !0,
    gridArea: !0,
    gridRow: !0,
    gridRowEnd: !0,
    gridRowSpan: !0,
    gridRowStart: !0,
    gridColumn: !0,
    gridColumnEnd: !0,
    gridColumnSpan: !0,
    gridColumnStart: !0,
    fontWeight: !0,
    lineClamp: !0,
    lineHeight: !0,
    opacity: !0,
    order: !0,
    orphans: !0,
    tabSize: !0,
    widows: !0,
    zIndex: !0,
    zoom: !0,
    fillOpacity: !0,
    floodOpacity: !0,
    stopOpacity: !0,
    strokeDasharray: !0,
    strokeDashoffset: !0,
    strokeMiterlimit: !0,
    strokeOpacity: !0,
    strokeWidth: !0,
  },
  Uc = ["Webkit", "ms", "Moz", "O"];
Object.keys(Pn).forEach(function (e) {
  Uc.forEach(function (t) {
    ((t = t + e.charAt(0).toUpperCase() + e.substring(1)), (Pn[t] = Pn[e]));
  });
});
function Ss(e, t, n) {
  return t == null || typeof t == "boolean" || t === ""
    ? ""
    : n || typeof t != "number" || t === 0 || (Pn.hasOwnProperty(e) && Pn[e])
      ? ("" + t).trim()
      : t + "px";
}
function ks(e, t) {
  e = e.style;
  for (var n in t)
    if (t.hasOwnProperty(n)) {
      var r = n.indexOf("--") === 0,
        l = Ss(n, t[n], r);
      (n === "float" && (n = "cssFloat"), r ? e.setProperty(n, l) : (e[n] = l));
    }
}
var Ac = Q(
  { menuitem: !0 },
  {
    area: !0,
    base: !0,
    br: !0,
    col: !0,
    embed: !0,
    hr: !0,
    img: !0,
    input: !0,
    keygen: !0,
    link: !0,
    meta: !0,
    param: !0,
    source: !0,
    track: !0,
    wbr: !0,
  },
);
function so(e, t) {
  if (t) {
    if (Ac[e] && (t.children != null || t.dangerouslySetInnerHTML != null))
      throw Error(w(137, e));
    if (t.dangerouslySetInnerHTML != null) {
      if (t.children != null) throw Error(w(60));
      if (
        typeof t.dangerouslySetInnerHTML != "object" ||
        !("__html" in t.dangerouslySetInnerHTML)
      )
        throw Error(w(61));
    }
    if (t.style != null && typeof t.style != "object") throw Error(w(62));
  }
}
function ao(e, t) {
  if (e.indexOf("-") === -1) return typeof t.is == "string";
  switch (e) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return !1;
    default:
      return !0;
  }
}
var co = null;
function tu(e) {
  return (
    (e = e.target || e.srcElement || window),
    e.correspondingUseElement && (e = e.correspondingUseElement),
    e.nodeType === 3 ? e.parentNode : e
  );
}
var fo = null,
  Zt = null,
  qt = null;
function Gu(e) {
  if ((e = rr(e))) {
    if (typeof fo != "function") throw Error(w(280));
    var t = e.stateNode;
    t && ((t = dl(t)), fo(e.stateNode, e.type, t));
  }
}
function xs(e) {
  Zt ? (qt ? qt.push(e) : (qt = [e])) : (Zt = e);
}
function Es() {
  if (Zt) {
    var e = Zt,
      t = qt;
    if (((qt = Zt = null), Gu(e), t)) for (e = 0; e < t.length; e++) Gu(t[e]);
  }
}
function Cs(e, t) {
  return e(t);
}
function _s() {}
var jl = !1;
function Ns(e, t, n) {
  if (jl) return e(t, n);
  jl = !0;
  try {
    return Cs(e, t, n);
  } finally {
    ((jl = !1), (Zt !== null || qt !== null) && (_s(), Es()));
  }
}
function Un(e, t) {
  var n = e.stateNode;
  if (n === null) return null;
  var r = dl(n);
  if (r === null) return null;
  n = r[t];
  e: switch (t) {
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
      ((r = !r.disabled) ||
        ((e = e.type),
        (r = !(
          e === "button" ||
          e === "input" ||
          e === "select" ||
          e === "textarea"
        ))),
        (e = !r));
      break e;
    default:
      e = !1;
  }
  if (e) return null;
  if (n && typeof n != "function") throw Error(w(231, t, typeof n));
  return n;
}
var po = !1;
if (Je)
  try {
    var mn = {};
    (Object.defineProperty(mn, "passive", {
      get: function () {
        po = !0;
      },
    }),
      window.addEventListener("test", mn, mn),
      window.removeEventListener("test", mn, mn));
  } catch {
    po = !1;
  }
function Vc(e, t, n, r, l, o, u, i, s) {
  var c = Array.prototype.slice.call(arguments, 3);
  try {
    t.apply(n, c);
  } catch (h) {
    this.onError(h);
  }
}
var Tn = !1,
  $r = null,
  Ur = !1,
  mo = null,
  Bc = {
    onError: function (e) {
      ((Tn = !0), ($r = e));
    },
  };
function Hc(e, t, n, r, l, o, u, i, s) {
  ((Tn = !1), ($r = null), Vc.apply(Bc, arguments));
}
function Wc(e, t, n, r, l, o, u, i, s) {
  if ((Hc.apply(this, arguments), Tn)) {
    if (Tn) {
      var c = $r;
      ((Tn = !1), ($r = null));
    } else throw Error(w(198));
    Ur || ((Ur = !0), (mo = c));
  }
}
function It(e) {
  var t = e,
    n = e;
  if (e.alternate) for (; t.return; ) t = t.return;
  else {
    e = t;
    do ((t = e), t.flags & 4098 && (n = t.return), (e = t.return));
    while (e);
  }
  return t.tag === 3 ? n : null;
}
function Ps(e) {
  if (e.tag === 13) {
    var t = e.memoizedState;
    if (
      (t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)),
      t !== null)
    )
      return t.dehydrated;
  }
  return null;
}
function Ju(e) {
  if (It(e) !== e) throw Error(w(188));
}
function Qc(e) {
  var t = e.alternate;
  if (!t) {
    if (((t = It(e)), t === null)) throw Error(w(188));
    return t !== e ? null : e;
  }
  for (var n = e, r = t; ; ) {
    var l = n.return;
    if (l === null) break;
    var o = l.alternate;
    if (o === null) {
      if (((r = l.return), r !== null)) {
        n = r;
        continue;
      }
      break;
    }
    if (l.child === o.child) {
      for (o = l.child; o; ) {
        if (o === n) return (Ju(l), e);
        if (o === r) return (Ju(l), t);
        o = o.sibling;
      }
      throw Error(w(188));
    }
    if (n.return !== r.return) ((n = l), (r = o));
    else {
      for (var u = !1, i = l.child; i; ) {
        if (i === n) {
          ((u = !0), (n = l), (r = o));
          break;
        }
        if (i === r) {
          ((u = !0), (r = l), (n = o));
          break;
        }
        i = i.sibling;
      }
      if (!u) {
        for (i = o.child; i; ) {
          if (i === n) {
            ((u = !0), (n = o), (r = l));
            break;
          }
          if (i === r) {
            ((u = !0), (r = o), (n = l));
            break;
          }
          i = i.sibling;
        }
        if (!u) throw Error(w(189));
      }
    }
    if (n.alternate !== r) throw Error(w(190));
  }
  if (n.tag !== 3) throw Error(w(188));
  return n.stateNode.current === n ? e : t;
}
function Ts(e) {
  return ((e = Qc(e)), e !== null ? zs(e) : null);
}
function zs(e) {
  if (e.tag === 5 || e.tag === 6) return e;
  for (e = e.child; e !== null; ) {
    var t = zs(e);
    if (t !== null) return t;
    e = e.sibling;
  }
  return null;
}
var js = Ee.unstable_scheduleCallback,
  Zu = Ee.unstable_cancelCallback,
  Kc = Ee.unstable_shouldYield,
  Yc = Ee.unstable_requestPaint,
  G = Ee.unstable_now,
  Xc = Ee.unstable_getCurrentPriorityLevel,
  nu = Ee.unstable_ImmediatePriority,
  Ls = Ee.unstable_UserBlockingPriority,
  Ar = Ee.unstable_NormalPriority,
  Gc = Ee.unstable_LowPriority,
  Rs = Ee.unstable_IdlePriority,
  sl = null,
  He = null;
function Jc(e) {
  if (He && typeof He.onCommitFiberRoot == "function")
    try {
      He.onCommitFiberRoot(sl, e, void 0, (e.current.flags & 128) === 128);
    } catch {}
}
var Ie = Math.clz32 ? Math.clz32 : bc,
  Zc = Math.log,
  qc = Math.LN2;
function bc(e) {
  return ((e >>>= 0), e === 0 ? 32 : (31 - ((Zc(e) / qc) | 0)) | 0);
}
var dr = 64,
  pr = 4194304;
function Cn(e) {
  switch (e & -e) {
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
      return e & 4194240;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return e & 130023424;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return e;
  }
}
function Vr(e, t) {
  var n = e.pendingLanes;
  if (n === 0) return 0;
  var r = 0,
    l = e.suspendedLanes,
    o = e.pingedLanes,
    u = n & 268435455;
  if (u !== 0) {
    var i = u & ~l;
    i !== 0 ? (r = Cn(i)) : ((o &= u), o !== 0 && (r = Cn(o)));
  } else ((u = n & ~l), u !== 0 ? (r = Cn(u)) : o !== 0 && (r = Cn(o)));
  if (r === 0) return 0;
  if (
    t !== 0 &&
    t !== r &&
    !(t & l) &&
    ((l = r & -r), (o = t & -t), l >= o || (l === 16 && (o & 4194240) !== 0))
  )
    return t;
  if ((r & 4 && (r |= n & 16), (t = e.entangledLanes), t !== 0))
    for (e = e.entanglements, t &= r; 0 < t; )
      ((n = 31 - Ie(t)), (l = 1 << n), (r |= e[n]), (t &= ~l));
  return r;
}
function ef(e, t) {
  switch (e) {
    case 1:
    case 2:
    case 4:
      return t + 250;
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
      return t + 5e3;
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
function tf(e, t) {
  for (
    var n = e.suspendedLanes,
      r = e.pingedLanes,
      l = e.expirationTimes,
      o = e.pendingLanes;
    0 < o;

  ) {
    var u = 31 - Ie(o),
      i = 1 << u,
      s = l[u];
    (s === -1
      ? (!(i & n) || i & r) && (l[u] = ef(i, t))
      : s <= t && (e.expiredLanes |= i),
      (o &= ~i));
  }
}
function ho(e) {
  return (
    (e = e.pendingLanes & -1073741825),
    e !== 0 ? e : e & 1073741824 ? 1073741824 : 0
  );
}
function Os() {
  var e = dr;
  return ((dr <<= 1), !(dr & 4194240) && (dr = 64), e);
}
function Ll(e) {
  for (var t = [], n = 0; 31 > n; n++) t.push(e);
  return t;
}
function tr(e, t, n) {
  ((e.pendingLanes |= t),
    t !== 536870912 && ((e.suspendedLanes = 0), (e.pingedLanes = 0)),
    (e = e.eventTimes),
    (t = 31 - Ie(t)),
    (e[t] = n));
}
function nf(e, t) {
  var n = e.pendingLanes & ~t;
  ((e.pendingLanes = t),
    (e.suspendedLanes = 0),
    (e.pingedLanes = 0),
    (e.expiredLanes &= t),
    (e.mutableReadLanes &= t),
    (e.entangledLanes &= t),
    (t = e.entanglements));
  var r = e.eventTimes;
  for (e = e.expirationTimes; 0 < n; ) {
    var l = 31 - Ie(n),
      o = 1 << l;
    ((t[l] = 0), (r[l] = -1), (e[l] = -1), (n &= ~o));
  }
}
function ru(e, t) {
  var n = (e.entangledLanes |= t);
  for (e = e.entanglements; n; ) {
    var r = 31 - Ie(n),
      l = 1 << r;
    ((l & t) | (e[r] & t) && (e[r] |= t), (n &= ~l));
  }
}
var I = 0;
function Ds(e) {
  return (
    (e &= -e),
    1 < e ? (4 < e ? (e & 268435455 ? 16 : 536870912) : 4) : 1
  );
}
var Ms,
  lu,
  Is,
  Fs,
  $s,
  vo = !1,
  mr = [],
  st = null,
  at = null,
  ct = null,
  An = new Map(),
  Vn = new Map(),
  lt = [],
  rf =
    "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(
      " ",
    );
function qu(e, t) {
  switch (e) {
    case "focusin":
    case "focusout":
      st = null;
      break;
    case "dragenter":
    case "dragleave":
      at = null;
      break;
    case "mouseover":
    case "mouseout":
      ct = null;
      break;
    case "pointerover":
    case "pointerout":
      An.delete(t.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      Vn.delete(t.pointerId);
  }
}
function hn(e, t, n, r, l, o) {
  return e === null || e.nativeEvent !== o
    ? ((e = {
        blockedOn: t,
        domEventName: n,
        eventSystemFlags: r,
        nativeEvent: o,
        targetContainers: [l],
      }),
      t !== null && ((t = rr(t)), t !== null && lu(t)),
      e)
    : ((e.eventSystemFlags |= r),
      (t = e.targetContainers),
      l !== null && t.indexOf(l) === -1 && t.push(l),
      e);
}
function lf(e, t, n, r, l) {
  switch (t) {
    case "focusin":
      return ((st = hn(st, e, t, n, r, l)), !0);
    case "dragenter":
      return ((at = hn(at, e, t, n, r, l)), !0);
    case "mouseover":
      return ((ct = hn(ct, e, t, n, r, l)), !0);
    case "pointerover":
      var o = l.pointerId;
      return (An.set(o, hn(An.get(o) || null, e, t, n, r, l)), !0);
    case "gotpointercapture":
      return (
        (o = l.pointerId),
        Vn.set(o, hn(Vn.get(o) || null, e, t, n, r, l)),
        !0
      );
  }
  return !1;
}
function Us(e) {
  var t = _t(e.target);
  if (t !== null) {
    var n = It(t);
    if (n !== null) {
      if (((t = n.tag), t === 13)) {
        if (((t = Ps(n)), t !== null)) {
          ((e.blockedOn = t),
            $s(e.priority, function () {
              Is(n);
            }));
          return;
        }
      } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
        e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
        return;
      }
    }
  }
  e.blockedOn = null;
}
function Pr(e) {
  if (e.blockedOn !== null) return !1;
  for (var t = e.targetContainers; 0 < t.length; ) {
    var n = yo(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
    if (n === null) {
      n = e.nativeEvent;
      var r = new n.constructor(n.type, n);
      ((co = r), n.target.dispatchEvent(r), (co = null));
    } else return ((t = rr(n)), t !== null && lu(t), (e.blockedOn = n), !1);
    t.shift();
  }
  return !0;
}
function bu(e, t, n) {
  Pr(e) && n.delete(t);
}
function of() {
  ((vo = !1),
    st !== null && Pr(st) && (st = null),
    at !== null && Pr(at) && (at = null),
    ct !== null && Pr(ct) && (ct = null),
    An.forEach(bu),
    Vn.forEach(bu));
}
function vn(e, t) {
  e.blockedOn === t &&
    ((e.blockedOn = null),
    vo ||
      ((vo = !0),
      Ee.unstable_scheduleCallback(Ee.unstable_NormalPriority, of)));
}
function Bn(e) {
  function t(l) {
    return vn(l, e);
  }
  if (0 < mr.length) {
    vn(mr[0], e);
    for (var n = 1; n < mr.length; n++) {
      var r = mr[n];
      r.blockedOn === e && (r.blockedOn = null);
    }
  }
  for (
    st !== null && vn(st, e),
      at !== null && vn(at, e),
      ct !== null && vn(ct, e),
      An.forEach(t),
      Vn.forEach(t),
      n = 0;
    n < lt.length;
    n++
  )
    ((r = lt[n]), r.blockedOn === e && (r.blockedOn = null));
  for (; 0 < lt.length && ((n = lt[0]), n.blockedOn === null); )
    (Us(n), n.blockedOn === null && lt.shift());
}
var bt = et.ReactCurrentBatchConfig,
  Br = !0;
function uf(e, t, n, r) {
  var l = I,
    o = bt.transition;
  bt.transition = null;
  try {
    ((I = 1), ou(e, t, n, r));
  } finally {
    ((I = l), (bt.transition = o));
  }
}
function sf(e, t, n, r) {
  var l = I,
    o = bt.transition;
  bt.transition = null;
  try {
    ((I = 4), ou(e, t, n, r));
  } finally {
    ((I = l), (bt.transition = o));
  }
}
function ou(e, t, n, r) {
  if (Br) {
    var l = yo(e, t, n, r);
    if (l === null) (Vl(e, t, r, Hr, n), qu(e, r));
    else if (lf(l, e, t, n, r)) r.stopPropagation();
    else if ((qu(e, r), t & 4 && -1 < rf.indexOf(e))) {
      for (; l !== null; ) {
        var o = rr(l);
        if (
          (o !== null && Ms(o),
          (o = yo(e, t, n, r)),
          o === null && Vl(e, t, r, Hr, n),
          o === l)
        )
          break;
        l = o;
      }
      l !== null && r.stopPropagation();
    } else Vl(e, t, r, null, n);
  }
}
var Hr = null;
function yo(e, t, n, r) {
  if (((Hr = null), (e = tu(r)), (e = _t(e)), e !== null))
    if (((t = It(e)), t === null)) e = null;
    else if (((n = t.tag), n === 13)) {
      if (((e = Ps(t)), e !== null)) return e;
      e = null;
    } else if (n === 3) {
      if (t.stateNode.current.memoizedState.isDehydrated)
        return t.tag === 3 ? t.stateNode.containerInfo : null;
      e = null;
    } else t !== e && (e = null);
  return ((Hr = e), null);
}
function As(e) {
  switch (e) {
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
      switch (Xc()) {
        case nu:
          return 1;
        case Ls:
          return 4;
        case Ar:
        case Gc:
          return 16;
        case Rs:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var ut = null,
  uu = null,
  Tr = null;
function Vs() {
  if (Tr) return Tr;
  var e,
    t = uu,
    n = t.length,
    r,
    l = "value" in ut ? ut.value : ut.textContent,
    o = l.length;
  for (e = 0; e < n && t[e] === l[e]; e++);
  var u = n - e;
  for (r = 1; r <= u && t[n - r] === l[o - r]; r++);
  return (Tr = l.slice(e, 1 < r ? 1 - r : void 0));
}
function zr(e) {
  var t = e.keyCode;
  return (
    "charCode" in e
      ? ((e = e.charCode), e === 0 && t === 13 && (e = 13))
      : (e = t),
    e === 10 && (e = 13),
    32 <= e || e === 13 ? e : 0
  );
}
function hr() {
  return !0;
}
function ei() {
  return !1;
}
function _e(e) {
  function t(n, r, l, o, u) {
    ((this._reactName = n),
      (this._targetInst = l),
      (this.type = r),
      (this.nativeEvent = o),
      (this.target = u),
      (this.currentTarget = null));
    for (var i in e)
      e.hasOwnProperty(i) && ((n = e[i]), (this[i] = n ? n(o) : o[i]));
    return (
      (this.isDefaultPrevented = (
        o.defaultPrevented != null ? o.defaultPrevented : o.returnValue === !1
      )
        ? hr
        : ei),
      (this.isPropagationStopped = ei),
      this
    );
  }
  return (
    Q(t.prototype, {
      preventDefault: function () {
        this.defaultPrevented = !0;
        var n = this.nativeEvent;
        n &&
          (n.preventDefault
            ? n.preventDefault()
            : typeof n.returnValue != "unknown" && (n.returnValue = !1),
          (this.isDefaultPrevented = hr));
      },
      stopPropagation: function () {
        var n = this.nativeEvent;
        n &&
          (n.stopPropagation
            ? n.stopPropagation()
            : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0),
          (this.isPropagationStopped = hr));
      },
      persist: function () {},
      isPersistent: hr,
    }),
    t
  );
}
var fn = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function (e) {
      return e.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0,
  },
  iu = _e(fn),
  nr = Q({}, fn, { view: 0, detail: 0 }),
  af = _e(nr),
  Rl,
  Ol,
  yn,
  al = Q({}, nr, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState: su,
    button: 0,
    buttons: 0,
    relatedTarget: function (e) {
      return e.relatedTarget === void 0
        ? e.fromElement === e.srcElement
          ? e.toElement
          : e.fromElement
        : e.relatedTarget;
    },
    movementX: function (e) {
      return "movementX" in e
        ? e.movementX
        : (e !== yn &&
            (yn && e.type === "mousemove"
              ? ((Rl = e.screenX - yn.screenX), (Ol = e.screenY - yn.screenY))
              : (Ol = Rl = 0),
            (yn = e)),
          Rl);
    },
    movementY: function (e) {
      return "movementY" in e ? e.movementY : Ol;
    },
  }),
  ti = _e(al),
  cf = Q({}, al, { dataTransfer: 0 }),
  ff = _e(cf),
  df = Q({}, nr, { relatedTarget: 0 }),
  Dl = _e(df),
  pf = Q({}, fn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
  mf = _e(pf),
  hf = Q({}, fn, {
    clipboardData: function (e) {
      return "clipboardData" in e ? e.clipboardData : window.clipboardData;
    },
  }),
  vf = _e(hf),
  yf = Q({}, fn, { data: 0 }),
  ni = _e(yf),
  gf = {
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
    MozPrintableKey: "Unidentified",
  },
  wf = {
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
    224: "Meta",
  },
  Sf = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey",
  };
function kf(e) {
  var t = this.nativeEvent;
  return t.getModifierState ? t.getModifierState(e) : (e = Sf[e]) ? !!t[e] : !1;
}
function su() {
  return kf;
}
var xf = Q({}, nr, {
    key: function (e) {
      if (e.key) {
        var t = gf[e.key] || e.key;
        if (t !== "Unidentified") return t;
      }
      return e.type === "keypress"
        ? ((e = zr(e)), e === 13 ? "Enter" : String.fromCharCode(e))
        : e.type === "keydown" || e.type === "keyup"
          ? wf[e.keyCode] || "Unidentified"
          : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: su,
    charCode: function (e) {
      return e.type === "keypress" ? zr(e) : 0;
    },
    keyCode: function (e) {
      return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    },
    which: function (e) {
      return e.type === "keypress"
        ? zr(e)
        : e.type === "keydown" || e.type === "keyup"
          ? e.keyCode
          : 0;
    },
  }),
  Ef = _e(xf),
  Cf = Q({}, al, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0,
  }),
  ri = _e(Cf),
  _f = Q({}, nr, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: su,
  }),
  Nf = _e(_f),
  Pf = Q({}, fn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
  Tf = _e(Pf),
  zf = Q({}, al, {
    deltaX: function (e) {
      return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function (e) {
      return "deltaY" in e
        ? e.deltaY
        : "wheelDeltaY" in e
          ? -e.wheelDeltaY
          : "wheelDelta" in e
            ? -e.wheelDelta
            : 0;
    },
    deltaZ: 0,
    deltaMode: 0,
  }),
  jf = _e(zf),
  Lf = [9, 13, 27, 32],
  au = Je && "CompositionEvent" in window,
  zn = null;
Je && "documentMode" in document && (zn = document.documentMode);
var Rf = Je && "TextEvent" in window && !zn,
  Bs = Je && (!au || (zn && 8 < zn && 11 >= zn)),
  li = " ",
  oi = !1;
function Hs(e, t) {
  switch (e) {
    case "keyup":
      return Lf.indexOf(t.keyCode) !== -1;
    case "keydown":
      return t.keyCode !== 229;
    case "keypress":
    case "mousedown":
    case "focusout":
      return !0;
    default:
      return !1;
  }
}
function Ws(e) {
  return ((e = e.detail), typeof e == "object" && "data" in e ? e.data : null);
}
var At = !1;
function Of(e, t) {
  switch (e) {
    case "compositionend":
      return Ws(t);
    case "keypress":
      return t.which !== 32 ? null : ((oi = !0), li);
    case "textInput":
      return ((e = t.data), e === li && oi ? null : e);
    default:
      return null;
  }
}
function Df(e, t) {
  if (At)
    return e === "compositionend" || (!au && Hs(e, t))
      ? ((e = Vs()), (Tr = uu = ut = null), (At = !1), e)
      : null;
  switch (e) {
    case "paste":
      return null;
    case "keypress":
      if (!(t.ctrlKey || t.altKey || t.metaKey) || (t.ctrlKey && t.altKey)) {
        if (t.char && 1 < t.char.length) return t.char;
        if (t.which) return String.fromCharCode(t.which);
      }
      return null;
    case "compositionend":
      return Bs && t.locale !== "ko" ? null : t.data;
    default:
      return null;
  }
}
var Mf = {
  color: !0,
  date: !0,
  datetime: !0,
  "datetime-local": !0,
  email: !0,
  month: !0,
  number: !0,
  password: !0,
  range: !0,
  search: !0,
  tel: !0,
  text: !0,
  time: !0,
  url: !0,
  week: !0,
};
function ui(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t === "input" ? !!Mf[e.type] : t === "textarea";
}
function Qs(e, t, n, r) {
  (xs(r),
    (t = Wr(t, "onChange")),
    0 < t.length &&
      ((n = new iu("onChange", "change", null, n, r)),
      e.push({ event: n, listeners: t })));
}
var jn = null,
  Hn = null;
function If(e) {
  na(e, 0);
}
function cl(e) {
  var t = Ht(e);
  if (hs(t)) return e;
}
function Ff(e, t) {
  if (e === "change") return t;
}
var Ks = !1;
if (Je) {
  var Ml;
  if (Je) {
    var Il = "oninput" in document;
    if (!Il) {
      var ii = document.createElement("div");
      (ii.setAttribute("oninput", "return;"),
        (Il = typeof ii.oninput == "function"));
    }
    Ml = Il;
  } else Ml = !1;
  Ks = Ml && (!document.documentMode || 9 < document.documentMode);
}
function si() {
  jn && (jn.detachEvent("onpropertychange", Ys), (Hn = jn = null));
}
function Ys(e) {
  if (e.propertyName === "value" && cl(Hn)) {
    var t = [];
    (Qs(t, Hn, e, tu(e)), Ns(If, t));
  }
}
function $f(e, t, n) {
  e === "focusin"
    ? (si(), (jn = t), (Hn = n), jn.attachEvent("onpropertychange", Ys))
    : e === "focusout" && si();
}
function Uf(e) {
  if (e === "selectionchange" || e === "keyup" || e === "keydown")
    return cl(Hn);
}
function Af(e, t) {
  if (e === "click") return cl(t);
}
function Vf(e, t) {
  if (e === "input" || e === "change") return cl(t);
}
function Bf(e, t) {
  return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var $e = typeof Object.is == "function" ? Object.is : Bf;
function Wn(e, t) {
  if ($e(e, t)) return !0;
  if (typeof e != "object" || e === null || typeof t != "object" || t === null)
    return !1;
  var n = Object.keys(e),
    r = Object.keys(t);
  if (n.length !== r.length) return !1;
  for (r = 0; r < n.length; r++) {
    var l = n[r];
    if (!ql.call(t, l) || !$e(e[l], t[l])) return !1;
  }
  return !0;
}
function ai(e) {
  for (; e && e.firstChild; ) e = e.firstChild;
  return e;
}
function ci(e, t) {
  var n = ai(e);
  e = 0;
  for (var r; n; ) {
    if (n.nodeType === 3) {
      if (((r = e + n.textContent.length), e <= t && r >= t))
        return { node: n, offset: t - e };
      e = r;
    }
    e: {
      for (; n; ) {
        if (n.nextSibling) {
          n = n.nextSibling;
          break e;
        }
        n = n.parentNode;
      }
      n = void 0;
    }
    n = ai(n);
  }
}
function Xs(e, t) {
  return e && t
    ? e === t
      ? !0
      : e && e.nodeType === 3
        ? !1
        : t && t.nodeType === 3
          ? Xs(e, t.parentNode)
          : "contains" in e
            ? e.contains(t)
            : e.compareDocumentPosition
              ? !!(e.compareDocumentPosition(t) & 16)
              : !1
    : !1;
}
function Gs() {
  for (var e = window, t = Fr(); t instanceof e.HTMLIFrameElement; ) {
    try {
      var n = typeof t.contentWindow.location.href == "string";
    } catch {
      n = !1;
    }
    if (n) e = t.contentWindow;
    else break;
    t = Fr(e.document);
  }
  return t;
}
function cu(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return (
    t &&
    ((t === "input" &&
      (e.type === "text" ||
        e.type === "search" ||
        e.type === "tel" ||
        e.type === "url" ||
        e.type === "password")) ||
      t === "textarea" ||
      e.contentEditable === "true")
  );
}
function Hf(e) {
  var t = Gs(),
    n = e.focusedElem,
    r = e.selectionRange;
  if (
    t !== n &&
    n &&
    n.ownerDocument &&
    Xs(n.ownerDocument.documentElement, n)
  ) {
    if (r !== null && cu(n)) {
      if (
        ((t = r.start),
        (e = r.end),
        e === void 0 && (e = t),
        "selectionStart" in n)
      )
        ((n.selectionStart = t),
          (n.selectionEnd = Math.min(e, n.value.length)));
      else if (
        ((e = ((t = n.ownerDocument || document) && t.defaultView) || window),
        e.getSelection)
      ) {
        e = e.getSelection();
        var l = n.textContent.length,
          o = Math.min(r.start, l);
        ((r = r.end === void 0 ? o : Math.min(r.end, l)),
          !e.extend && o > r && ((l = r), (r = o), (o = l)),
          (l = ci(n, o)));
        var u = ci(n, r);
        l &&
          u &&
          (e.rangeCount !== 1 ||
            e.anchorNode !== l.node ||
            e.anchorOffset !== l.offset ||
            e.focusNode !== u.node ||
            e.focusOffset !== u.offset) &&
          ((t = t.createRange()),
          t.setStart(l.node, l.offset),
          e.removeAllRanges(),
          o > r
            ? (e.addRange(t), e.extend(u.node, u.offset))
            : (t.setEnd(u.node, u.offset), e.addRange(t)));
      }
    }
    for (t = [], e = n; (e = e.parentNode); )
      e.nodeType === 1 &&
        t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
    for (typeof n.focus == "function" && n.focus(), n = 0; n < t.length; n++)
      ((e = t[n]),
        (e.element.scrollLeft = e.left),
        (e.element.scrollTop = e.top));
  }
}
var Wf = Je && "documentMode" in document && 11 >= document.documentMode,
  Vt = null,
  go = null,
  Ln = null,
  wo = !1;
function fi(e, t, n) {
  var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
  wo ||
    Vt == null ||
    Vt !== Fr(r) ||
    ((r = Vt),
    "selectionStart" in r && cu(r)
      ? (r = { start: r.selectionStart, end: r.selectionEnd })
      : ((r = (
          (r.ownerDocument && r.ownerDocument.defaultView) ||
          window
        ).getSelection()),
        (r = {
          anchorNode: r.anchorNode,
          anchorOffset: r.anchorOffset,
          focusNode: r.focusNode,
          focusOffset: r.focusOffset,
        })),
    (Ln && Wn(Ln, r)) ||
      ((Ln = r),
      (r = Wr(go, "onSelect")),
      0 < r.length &&
        ((t = new iu("onSelect", "select", null, t, n)),
        e.push({ event: t, listeners: r }),
        (t.target = Vt))));
}
function vr(e, t) {
  var n = {};
  return (
    (n[e.toLowerCase()] = t.toLowerCase()),
    (n["Webkit" + e] = "webkit" + t),
    (n["Moz" + e] = "moz" + t),
    n
  );
}
var Bt = {
    animationend: vr("Animation", "AnimationEnd"),
    animationiteration: vr("Animation", "AnimationIteration"),
    animationstart: vr("Animation", "AnimationStart"),
    transitionend: vr("Transition", "TransitionEnd"),
  },
  Fl = {},
  Js = {};
Je &&
  ((Js = document.createElement("div").style),
  "AnimationEvent" in window ||
    (delete Bt.animationend.animation,
    delete Bt.animationiteration.animation,
    delete Bt.animationstart.animation),
  "TransitionEvent" in window || delete Bt.transitionend.transition);
function fl(e) {
  if (Fl[e]) return Fl[e];
  if (!Bt[e]) return e;
  var t = Bt[e],
    n;
  for (n in t) if (t.hasOwnProperty(n) && n in Js) return (Fl[e] = t[n]);
  return e;
}
var Zs = fl("animationend"),
  qs = fl("animationiteration"),
  bs = fl("animationstart"),
  ea = fl("transitionend"),
  ta = new Map(),
  di =
    "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
      " ",
    );
function gt(e, t) {
  (ta.set(e, t), Mt(t, [e]));
}
for (var $l = 0; $l < di.length; $l++) {
  var Ul = di[$l],
    Qf = Ul.toLowerCase(),
    Kf = Ul[0].toUpperCase() + Ul.slice(1);
  gt(Qf, "on" + Kf);
}
gt(Zs, "onAnimationEnd");
gt(qs, "onAnimationIteration");
gt(bs, "onAnimationStart");
gt("dblclick", "onDoubleClick");
gt("focusin", "onFocus");
gt("focusout", "onBlur");
gt(ea, "onTransitionEnd");
nn("onMouseEnter", ["mouseout", "mouseover"]);
nn("onMouseLeave", ["mouseout", "mouseover"]);
nn("onPointerEnter", ["pointerout", "pointerover"]);
nn("onPointerLeave", ["pointerout", "pointerover"]);
Mt(
  "onChange",
  "change click focusin focusout input keydown keyup selectionchange".split(
    " ",
  ),
);
Mt(
  "onSelect",
  "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
    " ",
  ),
);
Mt("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
Mt(
  "onCompositionEnd",
  "compositionend focusout keydown keypress keyup mousedown".split(" "),
);
Mt(
  "onCompositionStart",
  "compositionstart focusout keydown keypress keyup mousedown".split(" "),
);
Mt(
  "onCompositionUpdate",
  "compositionupdate focusout keydown keypress keyup mousedown".split(" "),
);
var _n =
    "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
      " ",
    ),
  Yf = new Set("cancel close invalid load scroll toggle".split(" ").concat(_n));
function pi(e, t, n) {
  var r = e.type || "unknown-event";
  ((e.currentTarget = n), Wc(r, t, void 0, e), (e.currentTarget = null));
}
function na(e, t) {
  t = (t & 4) !== 0;
  for (var n = 0; n < e.length; n++) {
    var r = e[n],
      l = r.event;
    r = r.listeners;
    e: {
      var o = void 0;
      if (t)
        for (var u = r.length - 1; 0 <= u; u--) {
          var i = r[u],
            s = i.instance,
            c = i.currentTarget;
          if (((i = i.listener), s !== o && l.isPropagationStopped())) break e;
          (pi(l, i, c), (o = s));
        }
      else
        for (u = 0; u < r.length; u++) {
          if (
            ((i = r[u]),
            (s = i.instance),
            (c = i.currentTarget),
            (i = i.listener),
            s !== o && l.isPropagationStopped())
          )
            break e;
          (pi(l, i, c), (o = s));
        }
    }
  }
  if (Ur) throw ((e = mo), (Ur = !1), (mo = null), e);
}
function A(e, t) {
  var n = t[Co];
  n === void 0 && (n = t[Co] = new Set());
  var r = e + "__bubble";
  n.has(r) || (ra(t, e, 2, !1), n.add(r));
}
function Al(e, t, n) {
  var r = 0;
  (t && (r |= 4), ra(n, e, r, t));
}
var yr = "_reactListening" + Math.random().toString(36).slice(2);
function Qn(e) {
  if (!e[yr]) {
    ((e[yr] = !0),
      cs.forEach(function (n) {
        n !== "selectionchange" && (Yf.has(n) || Al(n, !1, e), Al(n, !0, e));
      }));
    var t = e.nodeType === 9 ? e : e.ownerDocument;
    t === null || t[yr] || ((t[yr] = !0), Al("selectionchange", !1, t));
  }
}
function ra(e, t, n, r) {
  switch (As(t)) {
    case 1:
      var l = uf;
      break;
    case 4:
      l = sf;
      break;
    default:
      l = ou;
  }
  ((n = l.bind(null, t, n, e)),
    (l = void 0),
    !po ||
      (t !== "touchstart" && t !== "touchmove" && t !== "wheel") ||
      (l = !0),
    r
      ? l !== void 0
        ? e.addEventListener(t, n, { capture: !0, passive: l })
        : e.addEventListener(t, n, !0)
      : l !== void 0
        ? e.addEventListener(t, n, { passive: l })
        : e.addEventListener(t, n, !1));
}
function Vl(e, t, n, r, l) {
  var o = r;
  if (!(t & 1) && !(t & 2) && r !== null)
    e: for (;;) {
      if (r === null) return;
      var u = r.tag;
      if (u === 3 || u === 4) {
        var i = r.stateNode.containerInfo;
        if (i === l || (i.nodeType === 8 && i.parentNode === l)) break;
        if (u === 4)
          for (u = r.return; u !== null; ) {
            var s = u.tag;
            if (
              (s === 3 || s === 4) &&
              ((s = u.stateNode.containerInfo),
              s === l || (s.nodeType === 8 && s.parentNode === l))
            )
              return;
            u = u.return;
          }
        for (; i !== null; ) {
          if (((u = _t(i)), u === null)) return;
          if (((s = u.tag), s === 5 || s === 6)) {
            r = o = u;
            continue e;
          }
          i = i.parentNode;
        }
      }
      r = r.return;
    }
  Ns(function () {
    var c = o,
      h = tu(n),
      m = [];
    e: {
      var p = ta.get(e);
      if (p !== void 0) {
        var y = iu,
          g = e;
        switch (e) {
          case "keypress":
            if (zr(n) === 0) break e;
          case "keydown":
          case "keyup":
            y = Ef;
            break;
          case "focusin":
            ((g = "focus"), (y = Dl));
            break;
          case "focusout":
            ((g = "blur"), (y = Dl));
            break;
          case "beforeblur":
          case "afterblur":
            y = Dl;
            break;
          case "click":
            if (n.button === 2) break e;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            y = ti;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            y = ff;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            y = Nf;
            break;
          case Zs:
          case qs:
          case bs:
            y = mf;
            break;
          case ea:
            y = Tf;
            break;
          case "scroll":
            y = af;
            break;
          case "wheel":
            y = jf;
            break;
          case "copy":
          case "cut":
          case "paste":
            y = vf;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            y = ri;
        }
        var k = (t & 4) !== 0,
          j = !k && e === "scroll",
          f = k ? (p !== null ? p + "Capture" : null) : p;
        k = [];
        for (var a = c, d; a !== null; ) {
          d = a;
          var v = d.stateNode;
          if (
            (d.tag === 5 &&
              v !== null &&
              ((d = v),
              f !== null && ((v = Un(a, f)), v != null && k.push(Kn(a, v, d)))),
            j)
          )
            break;
          a = a.return;
        }
        0 < k.length &&
          ((p = new y(p, g, null, n, h)), m.push({ event: p, listeners: k }));
      }
    }
    if (!(t & 7)) {
      e: {
        if (
          ((p = e === "mouseover" || e === "pointerover"),
          (y = e === "mouseout" || e === "pointerout"),
          p &&
            n !== co &&
            (g = n.relatedTarget || n.fromElement) &&
            (_t(g) || g[Ze]))
        )
          break e;
        if (
          (y || p) &&
          ((p =
            h.window === h
              ? h
              : (p = h.ownerDocument)
                ? p.defaultView || p.parentWindow
                : window),
          y
            ? ((g = n.relatedTarget || n.toElement),
              (y = c),
              (g = g ? _t(g) : null),
              g !== null &&
                ((j = It(g)), g !== j || (g.tag !== 5 && g.tag !== 6)) &&
                (g = null))
            : ((y = null), (g = c)),
          y !== g)
        ) {
          if (
            ((k = ti),
            (v = "onMouseLeave"),
            (f = "onMouseEnter"),
            (a = "mouse"),
            (e === "pointerout" || e === "pointerover") &&
              ((k = ri),
              (v = "onPointerLeave"),
              (f = "onPointerEnter"),
              (a = "pointer")),
            (j = y == null ? p : Ht(y)),
            (d = g == null ? p : Ht(g)),
            (p = new k(v, a + "leave", y, n, h)),
            (p.target = j),
            (p.relatedTarget = d),
            (v = null),
            _t(h) === c &&
              ((k = new k(f, a + "enter", g, n, h)),
              (k.target = d),
              (k.relatedTarget = j),
              (v = k)),
            (j = v),
            y && g)
          )
            t: {
              for (k = y, f = g, a = 0, d = k; d; d = Ft(d)) a++;
              for (d = 0, v = f; v; v = Ft(v)) d++;
              for (; 0 < a - d; ) ((k = Ft(k)), a--);
              for (; 0 < d - a; ) ((f = Ft(f)), d--);
              for (; a--; ) {
                if (k === f || (f !== null && k === f.alternate)) break t;
                ((k = Ft(k)), (f = Ft(f)));
              }
              k = null;
            }
          else k = null;
          (y !== null && mi(m, p, y, k, !1),
            g !== null && j !== null && mi(m, j, g, k, !0));
        }
      }
      e: {
        if (
          ((p = c ? Ht(c) : window),
          (y = p.nodeName && p.nodeName.toLowerCase()),
          y === "select" || (y === "input" && p.type === "file"))
        )
          var E = Ff;
        else if (ui(p))
          if (Ks) E = Vf;
          else {
            E = Uf;
            var C = $f;
          }
        else
          (y = p.nodeName) &&
            y.toLowerCase() === "input" &&
            (p.type === "checkbox" || p.type === "radio") &&
            (E = Af);
        if (E && (E = E(e, c))) {
          Qs(m, E, n, h);
          break e;
        }
        (C && C(e, p, c),
          e === "focusout" &&
            (C = p._wrapperState) &&
            C.controlled &&
            p.type === "number" &&
            oo(p, "number", p.value));
      }
      switch (((C = c ? Ht(c) : window), e)) {
        case "focusin":
          (ui(C) || C.contentEditable === "true") &&
            ((Vt = C), (go = c), (Ln = null));
          break;
        case "focusout":
          Ln = go = Vt = null;
          break;
        case "mousedown":
          wo = !0;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          ((wo = !1), fi(m, n, h));
          break;
        case "selectionchange":
          if (Wf) break;
        case "keydown":
        case "keyup":
          fi(m, n, h);
      }
      var N;
      if (au)
        e: {
          switch (e) {
            case "compositionstart":
              var P = "onCompositionStart";
              break e;
            case "compositionend":
              P = "onCompositionEnd";
              break e;
            case "compositionupdate":
              P = "onCompositionUpdate";
              break e;
          }
          P = void 0;
        }
      else
        At
          ? Hs(e, n) && (P = "onCompositionEnd")
          : e === "keydown" && n.keyCode === 229 && (P = "onCompositionStart");
      (P &&
        (Bs &&
          n.locale !== "ko" &&
          (At || P !== "onCompositionStart"
            ? P === "onCompositionEnd" && At && (N = Vs())
            : ((ut = h),
              (uu = "value" in ut ? ut.value : ut.textContent),
              (At = !0))),
        (C = Wr(c, P)),
        0 < C.length &&
          ((P = new ni(P, e, null, n, h)),
          m.push({ event: P, listeners: C }),
          N ? (P.data = N) : ((N = Ws(n)), N !== null && (P.data = N)))),
        (N = Rf ? Of(e, n) : Df(e, n)) &&
          ((c = Wr(c, "onBeforeInput")),
          0 < c.length &&
            ((h = new ni("onBeforeInput", "beforeinput", null, n, h)),
            m.push({ event: h, listeners: c }),
            (h.data = N))));
    }
    na(m, t);
  });
}
function Kn(e, t, n) {
  return { instance: e, listener: t, currentTarget: n };
}
function Wr(e, t) {
  for (var n = t + "Capture", r = []; e !== null; ) {
    var l = e,
      o = l.stateNode;
    (l.tag === 5 &&
      o !== null &&
      ((l = o),
      (o = Un(e, n)),
      o != null && r.unshift(Kn(e, o, l)),
      (o = Un(e, t)),
      o != null && r.push(Kn(e, o, l))),
      (e = e.return));
  }
  return r;
}
function Ft(e) {
  if (e === null) return null;
  do e = e.return;
  while (e && e.tag !== 5);
  return e || null;
}
function mi(e, t, n, r, l) {
  for (var o = t._reactName, u = []; n !== null && n !== r; ) {
    var i = n,
      s = i.alternate,
      c = i.stateNode;
    if (s !== null && s === r) break;
    (i.tag === 5 &&
      c !== null &&
      ((i = c),
      l
        ? ((s = Un(n, o)), s != null && u.unshift(Kn(n, s, i)))
        : l || ((s = Un(n, o)), s != null && u.push(Kn(n, s, i)))),
      (n = n.return));
  }
  u.length !== 0 && e.push({ event: t, listeners: u });
}
var Xf = /\r\n?/g,
  Gf = /\u0000|\uFFFD/g;
function hi(e) {
  return (typeof e == "string" ? e : "" + e)
    .replace(
      Xf,
      `
`,
    )
    .replace(Gf, "");
}
function gr(e, t, n) {
  if (((t = hi(t)), hi(e) !== t && n)) throw Error(w(425));
}
function Qr() {}
var So = null,
  ko = null;
function xo(e, t) {
  return (
    e === "textarea" ||
    e === "noscript" ||
    typeof t.children == "string" ||
    typeof t.children == "number" ||
    (typeof t.dangerouslySetInnerHTML == "object" &&
      t.dangerouslySetInnerHTML !== null &&
      t.dangerouslySetInnerHTML.__html != null)
  );
}
var Eo = typeof setTimeout == "function" ? setTimeout : void 0,
  Jf = typeof clearTimeout == "function" ? clearTimeout : void 0,
  vi = typeof Promise == "function" ? Promise : void 0,
  Zf =
    typeof queueMicrotask == "function"
      ? queueMicrotask
      : typeof vi < "u"
        ? function (e) {
            return vi.resolve(null).then(e).catch(qf);
          }
        : Eo;
function qf(e) {
  setTimeout(function () {
    throw e;
  });
}
function Bl(e, t) {
  var n = t,
    r = 0;
  do {
    var l = n.nextSibling;
    if ((e.removeChild(n), l && l.nodeType === 8))
      if (((n = l.data), n === "/$")) {
        if (r === 0) {
          (e.removeChild(l), Bn(t));
          return;
        }
        r--;
      } else (n !== "$" && n !== "$?" && n !== "$!") || r++;
    n = l;
  } while (n);
  Bn(t);
}
function ft(e) {
  for (; e != null; e = e.nextSibling) {
    var t = e.nodeType;
    if (t === 1 || t === 3) break;
    if (t === 8) {
      if (((t = e.data), t === "$" || t === "$!" || t === "$?")) break;
      if (t === "/$") return null;
    }
  }
  return e;
}
function yi(e) {
  e = e.previousSibling;
  for (var t = 0; e; ) {
    if (e.nodeType === 8) {
      var n = e.data;
      if (n === "$" || n === "$!" || n === "$?") {
        if (t === 0) return e;
        t--;
      } else n === "/$" && t++;
    }
    e = e.previousSibling;
  }
  return null;
}
var dn = Math.random().toString(36).slice(2),
  Be = "__reactFiber$" + dn,
  Yn = "__reactProps$" + dn,
  Ze = "__reactContainer$" + dn,
  Co = "__reactEvents$" + dn,
  bf = "__reactListeners$" + dn,
  ed = "__reactHandles$" + dn;
function _t(e) {
  var t = e[Be];
  if (t) return t;
  for (var n = e.parentNode; n; ) {
    if ((t = n[Ze] || n[Be])) {
      if (
        ((n = t.alternate),
        t.child !== null || (n !== null && n.child !== null))
      )
        for (e = yi(e); e !== null; ) {
          if ((n = e[Be])) return n;
          e = yi(e);
        }
      return t;
    }
    ((e = n), (n = e.parentNode));
  }
  return null;
}
function rr(e) {
  return (
    (e = e[Be] || e[Ze]),
    !e || (e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3) ? null : e
  );
}
function Ht(e) {
  if (e.tag === 5 || e.tag === 6) return e.stateNode;
  throw Error(w(33));
}
function dl(e) {
  return e[Yn] || null;
}
var _o = [],
  Wt = -1;
function wt(e) {
  return { current: e };
}
function V(e) {
  0 > Wt || ((e.current = _o[Wt]), (_o[Wt] = null), Wt--);
}
function F(e, t) {
  (Wt++, (_o[Wt] = e.current), (e.current = t));
}
var yt = {},
  ae = wt(yt),
  ye = wt(!1),
  jt = yt;
function rn(e, t) {
  var n = e.type.contextTypes;
  if (!n) return yt;
  var r = e.stateNode;
  if (r && r.__reactInternalMemoizedUnmaskedChildContext === t)
    return r.__reactInternalMemoizedMaskedChildContext;
  var l = {},
    o;
  for (o in n) l[o] = t[o];
  return (
    r &&
      ((e = e.stateNode),
      (e.__reactInternalMemoizedUnmaskedChildContext = t),
      (e.__reactInternalMemoizedMaskedChildContext = l)),
    l
  );
}
function ge(e) {
  return ((e = e.childContextTypes), e != null);
}
function Kr() {
  (V(ye), V(ae));
}
function gi(e, t, n) {
  if (ae.current !== yt) throw Error(w(168));
  (F(ae, t), F(ye, n));
}
function la(e, t, n) {
  var r = e.stateNode;
  if (((t = t.childContextTypes), typeof r.getChildContext != "function"))
    return n;
  r = r.getChildContext();
  for (var l in r) if (!(l in t)) throw Error(w(108, Fc(e) || "Unknown", l));
  return Q({}, n, r);
}
function Yr(e) {
  return (
    (e =
      ((e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext) || yt),
    (jt = ae.current),
    F(ae, e),
    F(ye, ye.current),
    !0
  );
}
function wi(e, t, n) {
  var r = e.stateNode;
  if (!r) throw Error(w(169));
  (n
    ? ((e = la(e, t, jt)),
      (r.__reactInternalMemoizedMergedChildContext = e),
      V(ye),
      V(ae),
      F(ae, e))
    : V(ye),
    F(ye, n));
}
var Ke = null,
  pl = !1,
  Hl = !1;
function oa(e) {
  Ke === null ? (Ke = [e]) : Ke.push(e);
}
function td(e) {
  ((pl = !0), oa(e));
}
function St() {
  if (!Hl && Ke !== null) {
    Hl = !0;
    var e = 0,
      t = I;
    try {
      var n = Ke;
      for (I = 1; e < n.length; e++) {
        var r = n[e];
        do r = r(!0);
        while (r !== null);
      }
      ((Ke = null), (pl = !1));
    } catch (l) {
      throw (Ke !== null && (Ke = Ke.slice(e + 1)), js(nu, St), l);
    } finally {
      ((I = t), (Hl = !1));
    }
  }
  return null;
}
var Qt = [],
  Kt = 0,
  Xr = null,
  Gr = 0,
  Ne = [],
  Pe = 0,
  Lt = null,
  Ye = 1,
  Xe = "";
function Et(e, t) {
  ((Qt[Kt++] = Gr), (Qt[Kt++] = Xr), (Xr = e), (Gr = t));
}
function ua(e, t, n) {
  ((Ne[Pe++] = Ye), (Ne[Pe++] = Xe), (Ne[Pe++] = Lt), (Lt = e));
  var r = Ye;
  e = Xe;
  var l = 32 - Ie(r) - 1;
  ((r &= ~(1 << l)), (n += 1));
  var o = 32 - Ie(t) + l;
  if (30 < o) {
    var u = l - (l % 5);
    ((o = (r & ((1 << u) - 1)).toString(32)),
      (r >>= u),
      (l -= u),
      (Ye = (1 << (32 - Ie(t) + l)) | (n << l) | r),
      (Xe = o + e));
  } else ((Ye = (1 << o) | (n << l) | r), (Xe = e));
}
function fu(e) {
  e.return !== null && (Et(e, 1), ua(e, 1, 0));
}
function du(e) {
  for (; e === Xr; )
    ((Xr = Qt[--Kt]), (Qt[Kt] = null), (Gr = Qt[--Kt]), (Qt[Kt] = null));
  for (; e === Lt; )
    ((Lt = Ne[--Pe]),
      (Ne[Pe] = null),
      (Xe = Ne[--Pe]),
      (Ne[Pe] = null),
      (Ye = Ne[--Pe]),
      (Ne[Pe] = null));
}
var xe = null,
  ke = null,
  B = !1,
  Me = null;
function ia(e, t) {
  var n = Te(5, null, null, 0);
  ((n.elementType = "DELETED"),
    (n.stateNode = t),
    (n.return = e),
    (t = e.deletions),
    t === null ? ((e.deletions = [n]), (e.flags |= 16)) : t.push(n));
}
function Si(e, t) {
  switch (e.tag) {
    case 5:
      var n = e.type;
      return (
        (t =
          t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase()
            ? null
            : t),
        t !== null
          ? ((e.stateNode = t), (xe = e), (ke = ft(t.firstChild)), !0)
          : !1
      );
    case 6:
      return (
        (t = e.pendingProps === "" || t.nodeType !== 3 ? null : t),
        t !== null ? ((e.stateNode = t), (xe = e), (ke = null), !0) : !1
      );
    case 13:
      return (
        (t = t.nodeType !== 8 ? null : t),
        t !== null
          ? ((n = Lt !== null ? { id: Ye, overflow: Xe } : null),
            (e.memoizedState = {
              dehydrated: t,
              treeContext: n,
              retryLane: 1073741824,
            }),
            (n = Te(18, null, null, 0)),
            (n.stateNode = t),
            (n.return = e),
            (e.child = n),
            (xe = e),
            (ke = null),
            !0)
          : !1
      );
    default:
      return !1;
  }
}
function No(e) {
  return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function Po(e) {
  if (B) {
    var t = ke;
    if (t) {
      var n = t;
      if (!Si(e, t)) {
        if (No(e)) throw Error(w(418));
        t = ft(n.nextSibling);
        var r = xe;
        t && Si(e, t)
          ? ia(r, n)
          : ((e.flags = (e.flags & -4097) | 2), (B = !1), (xe = e));
      }
    } else {
      if (No(e)) throw Error(w(418));
      ((e.flags = (e.flags & -4097) | 2), (B = !1), (xe = e));
    }
  }
}
function ki(e) {
  for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; )
    e = e.return;
  xe = e;
}
function wr(e) {
  if (e !== xe) return !1;
  if (!B) return (ki(e), (B = !0), !1);
  var t;
  if (
    ((t = e.tag !== 3) &&
      !(t = e.tag !== 5) &&
      ((t = e.type),
      (t = t !== "head" && t !== "body" && !xo(e.type, e.memoizedProps))),
    t && (t = ke))
  ) {
    if (No(e)) throw (sa(), Error(w(418)));
    for (; t; ) (ia(e, t), (t = ft(t.nextSibling)));
  }
  if ((ki(e), e.tag === 13)) {
    if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e))
      throw Error(w(317));
    e: {
      for (e = e.nextSibling, t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === "/$") {
            if (t === 0) {
              ke = ft(e.nextSibling);
              break e;
            }
            t--;
          } else (n !== "$" && n !== "$!" && n !== "$?") || t++;
        }
        e = e.nextSibling;
      }
      ke = null;
    }
  } else ke = xe ? ft(e.stateNode.nextSibling) : null;
  return !0;
}
function sa() {
  for (var e = ke; e; ) e = ft(e.nextSibling);
}
function ln() {
  ((ke = xe = null), (B = !1));
}
function pu(e) {
  Me === null ? (Me = [e]) : Me.push(e);
}
var nd = et.ReactCurrentBatchConfig;
function gn(e, t, n) {
  if (
    ((e = n.ref), e !== null && typeof e != "function" && typeof e != "object")
  ) {
    if (n._owner) {
      if (((n = n._owner), n)) {
        if (n.tag !== 1) throw Error(w(309));
        var r = n.stateNode;
      }
      if (!r) throw Error(w(147, e));
      var l = r,
        o = "" + e;
      return t !== null &&
        t.ref !== null &&
        typeof t.ref == "function" &&
        t.ref._stringRef === o
        ? t.ref
        : ((t = function (u) {
            var i = l.refs;
            u === null ? delete i[o] : (i[o] = u);
          }),
          (t._stringRef = o),
          t);
    }
    if (typeof e != "string") throw Error(w(284));
    if (!n._owner) throw Error(w(290, e));
  }
  return e;
}
function Sr(e, t) {
  throw (
    (e = Object.prototype.toString.call(t)),
    Error(
      w(
        31,
        e === "[object Object]"
          ? "object with keys {" + Object.keys(t).join(", ") + "}"
          : e,
      ),
    )
  );
}
function xi(e) {
  var t = e._init;
  return t(e._payload);
}
function aa(e) {
  function t(f, a) {
    if (e) {
      var d = f.deletions;
      d === null ? ((f.deletions = [a]), (f.flags |= 16)) : d.push(a);
    }
  }
  function n(f, a) {
    if (!e) return null;
    for (; a !== null; ) (t(f, a), (a = a.sibling));
    return null;
  }
  function r(f, a) {
    for (f = new Map(); a !== null; )
      (a.key !== null ? f.set(a.key, a) : f.set(a.index, a), (a = a.sibling));
    return f;
  }
  function l(f, a) {
    return ((f = ht(f, a)), (f.index = 0), (f.sibling = null), f);
  }
  function o(f, a, d) {
    return (
      (f.index = d),
      e
        ? ((d = f.alternate),
          d !== null
            ? ((d = d.index), d < a ? ((f.flags |= 2), a) : d)
            : ((f.flags |= 2), a))
        : ((f.flags |= 1048576), a)
    );
  }
  function u(f) {
    return (e && f.alternate === null && (f.flags |= 2), f);
  }
  function i(f, a, d, v) {
    return a === null || a.tag !== 6
      ? ((a = Jl(d, f.mode, v)), (a.return = f), a)
      : ((a = l(a, d)), (a.return = f), a);
  }
  function s(f, a, d, v) {
    var E = d.type;
    return E === Ut
      ? h(f, a, d.props.children, v, d.key)
      : a !== null &&
          (a.elementType === E ||
            (typeof E == "object" &&
              E !== null &&
              E.$$typeof === nt &&
              xi(E) === a.type))
        ? ((v = l(a, d.props)), (v.ref = gn(f, a, d)), (v.return = f), v)
        : ((v = Ir(d.type, d.key, d.props, null, f.mode, v)),
          (v.ref = gn(f, a, d)),
          (v.return = f),
          v);
  }
  function c(f, a, d, v) {
    return a === null ||
      a.tag !== 4 ||
      a.stateNode.containerInfo !== d.containerInfo ||
      a.stateNode.implementation !== d.implementation
      ? ((a = Zl(d, f.mode, v)), (a.return = f), a)
      : ((a = l(a, d.children || [])), (a.return = f), a);
  }
  function h(f, a, d, v, E) {
    return a === null || a.tag !== 7
      ? ((a = zt(d, f.mode, v, E)), (a.return = f), a)
      : ((a = l(a, d)), (a.return = f), a);
  }
  function m(f, a, d) {
    if ((typeof a == "string" && a !== "") || typeof a == "number")
      return ((a = Jl("" + a, f.mode, d)), (a.return = f), a);
    if (typeof a == "object" && a !== null) {
      switch (a.$$typeof) {
        case ar:
          return (
            (d = Ir(a.type, a.key, a.props, null, f.mode, d)),
            (d.ref = gn(f, null, a)),
            (d.return = f),
            d
          );
        case $t:
          return ((a = Zl(a, f.mode, d)), (a.return = f), a);
        case nt:
          var v = a._init;
          return m(f, v(a._payload), d);
      }
      if (En(a) || pn(a))
        return ((a = zt(a, f.mode, d, null)), (a.return = f), a);
      Sr(f, a);
    }
    return null;
  }
  function p(f, a, d, v) {
    var E = a !== null ? a.key : null;
    if ((typeof d == "string" && d !== "") || typeof d == "number")
      return E !== null ? null : i(f, a, "" + d, v);
    if (typeof d == "object" && d !== null) {
      switch (d.$$typeof) {
        case ar:
          return d.key === E ? s(f, a, d, v) : null;
        case $t:
          return d.key === E ? c(f, a, d, v) : null;
        case nt:
          return ((E = d._init), p(f, a, E(d._payload), v));
      }
      if (En(d) || pn(d)) return E !== null ? null : h(f, a, d, v, null);
      Sr(f, d);
    }
    return null;
  }
  function y(f, a, d, v, E) {
    if ((typeof v == "string" && v !== "") || typeof v == "number")
      return ((f = f.get(d) || null), i(a, f, "" + v, E));
    if (typeof v == "object" && v !== null) {
      switch (v.$$typeof) {
        case ar:
          return (
            (f = f.get(v.key === null ? d : v.key) || null),
            s(a, f, v, E)
          );
        case $t:
          return (
            (f = f.get(v.key === null ? d : v.key) || null),
            c(a, f, v, E)
          );
        case nt:
          var C = v._init;
          return y(f, a, d, C(v._payload), E);
      }
      if (En(v) || pn(v)) return ((f = f.get(d) || null), h(a, f, v, E, null));
      Sr(a, v);
    }
    return null;
  }
  function g(f, a, d, v) {
    for (
      var E = null, C = null, N = a, P = (a = 0), $ = null;
      N !== null && P < d.length;
      P++
    ) {
      N.index > P ? (($ = N), (N = null)) : ($ = N.sibling);
      var T = p(f, N, d[P], v);
      if (T === null) {
        N === null && (N = $);
        break;
      }
      (e && N && T.alternate === null && t(f, N),
        (a = o(T, a, P)),
        C === null ? (E = T) : (C.sibling = T),
        (C = T),
        (N = $));
    }
    if (P === d.length) return (n(f, N), B && Et(f, P), E);
    if (N === null) {
      for (; P < d.length; P++)
        ((N = m(f, d[P], v)),
          N !== null &&
            ((a = o(N, a, P)),
            C === null ? (E = N) : (C.sibling = N),
            (C = N)));
      return (B && Et(f, P), E);
    }
    for (N = r(f, N); P < d.length; P++)
      (($ = y(N, f, P, d[P], v)),
        $ !== null &&
          (e && $.alternate !== null && N.delete($.key === null ? P : $.key),
          (a = o($, a, P)),
          C === null ? (E = $) : (C.sibling = $),
          (C = $)));
    return (
      e &&
        N.forEach(function (U) {
          return t(f, U);
        }),
      B && Et(f, P),
      E
    );
  }
  function k(f, a, d, v) {
    var E = pn(d);
    if (typeof E != "function") throw Error(w(150));
    if (((d = E.call(d)), d == null)) throw Error(w(151));
    for (
      var C = (E = null), N = a, P = (a = 0), $ = null, T = d.next();
      N !== null && !T.done;
      P++, T = d.next()
    ) {
      N.index > P ? (($ = N), (N = null)) : ($ = N.sibling);
      var U = p(f, N, T.value, v);
      if (U === null) {
        N === null && (N = $);
        break;
      }
      (e && N && U.alternate === null && t(f, N),
        (a = o(U, a, P)),
        C === null ? (E = U) : (C.sibling = U),
        (C = U),
        (N = $));
    }
    if (T.done) return (n(f, N), B && Et(f, P), E);
    if (N === null) {
      for (; !T.done; P++, T = d.next())
        ((T = m(f, T.value, v)),
          T !== null &&
            ((a = o(T, a, P)),
            C === null ? (E = T) : (C.sibling = T),
            (C = T)));
      return (B && Et(f, P), E);
    }
    for (N = r(f, N); !T.done; P++, T = d.next())
      ((T = y(N, f, P, T.value, v)),
        T !== null &&
          (e && T.alternate !== null && N.delete(T.key === null ? P : T.key),
          (a = o(T, a, P)),
          C === null ? (E = T) : (C.sibling = T),
          (C = T)));
    return (
      e &&
        N.forEach(function (b) {
          return t(f, b);
        }),
      B && Et(f, P),
      E
    );
  }
  function j(f, a, d, v) {
    if (
      (typeof d == "object" &&
        d !== null &&
        d.type === Ut &&
        d.key === null &&
        (d = d.props.children),
      typeof d == "object" && d !== null)
    ) {
      switch (d.$$typeof) {
        case ar:
          e: {
            for (var E = d.key, C = a; C !== null; ) {
              if (C.key === E) {
                if (((E = d.type), E === Ut)) {
                  if (C.tag === 7) {
                    (n(f, C.sibling),
                      (a = l(C, d.props.children)),
                      (a.return = f),
                      (f = a));
                    break e;
                  }
                } else if (
                  C.elementType === E ||
                  (typeof E == "object" &&
                    E !== null &&
                    E.$$typeof === nt &&
                    xi(E) === C.type)
                ) {
                  (n(f, C.sibling),
                    (a = l(C, d.props)),
                    (a.ref = gn(f, C, d)),
                    (a.return = f),
                    (f = a));
                  break e;
                }
                n(f, C);
                break;
              } else t(f, C);
              C = C.sibling;
            }
            d.type === Ut
              ? ((a = zt(d.props.children, f.mode, v, d.key)),
                (a.return = f),
                (f = a))
              : ((v = Ir(d.type, d.key, d.props, null, f.mode, v)),
                (v.ref = gn(f, a, d)),
                (v.return = f),
                (f = v));
          }
          return u(f);
        case $t:
          e: {
            for (C = d.key; a !== null; ) {
              if (a.key === C)
                if (
                  a.tag === 4 &&
                  a.stateNode.containerInfo === d.containerInfo &&
                  a.stateNode.implementation === d.implementation
                ) {
                  (n(f, a.sibling),
                    (a = l(a, d.children || [])),
                    (a.return = f),
                    (f = a));
                  break e;
                } else {
                  n(f, a);
                  break;
                }
              else t(f, a);
              a = a.sibling;
            }
            ((a = Zl(d, f.mode, v)), (a.return = f), (f = a));
          }
          return u(f);
        case nt:
          return ((C = d._init), j(f, a, C(d._payload), v));
      }
      if (En(d)) return g(f, a, d, v);
      if (pn(d)) return k(f, a, d, v);
      Sr(f, d);
    }
    return (typeof d == "string" && d !== "") || typeof d == "number"
      ? ((d = "" + d),
        a !== null && a.tag === 6
          ? (n(f, a.sibling), (a = l(a, d)), (a.return = f), (f = a))
          : (n(f, a), (a = Jl(d, f.mode, v)), (a.return = f), (f = a)),
        u(f))
      : n(f, a);
  }
  return j;
}
var on = aa(!0),
  ca = aa(!1),
  Jr = wt(null),
  Zr = null,
  Yt = null,
  mu = null;
function hu() {
  mu = Yt = Zr = null;
}
function vu(e) {
  var t = Jr.current;
  (V(Jr), (e._currentValue = t));
}
function To(e, t, n) {
  for (; e !== null; ) {
    var r = e.alternate;
    if (
      ((e.childLanes & t) !== t
        ? ((e.childLanes |= t), r !== null && (r.childLanes |= t))
        : r !== null && (r.childLanes & t) !== t && (r.childLanes |= t),
      e === n)
    )
      break;
    e = e.return;
  }
}
function en(e, t) {
  ((Zr = e),
    (mu = Yt = null),
    (e = e.dependencies),
    e !== null &&
      e.firstContext !== null &&
      (e.lanes & t && (ve = !0), (e.firstContext = null)));
}
function je(e) {
  var t = e._currentValue;
  if (mu !== e)
    if (((e = { context: e, memoizedValue: t, next: null }), Yt === null)) {
      if (Zr === null) throw Error(w(308));
      ((Yt = e), (Zr.dependencies = { lanes: 0, firstContext: e }));
    } else Yt = Yt.next = e;
  return t;
}
var Nt = null;
function yu(e) {
  Nt === null ? (Nt = [e]) : Nt.push(e);
}
function fa(e, t, n, r) {
  var l = t.interleaved;
  return (
    l === null ? ((n.next = n), yu(t)) : ((n.next = l.next), (l.next = n)),
    (t.interleaved = n),
    qe(e, r)
  );
}
function qe(e, t) {
  e.lanes |= t;
  var n = e.alternate;
  for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; )
    ((e.childLanes |= t),
      (n = e.alternate),
      n !== null && (n.childLanes |= t),
      (n = e),
      (e = e.return));
  return n.tag === 3 ? n.stateNode : null;
}
var rt = !1;
function gu(e) {
  e.updateQueue = {
    baseState: e.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: { pending: null, interleaved: null, lanes: 0 },
    effects: null,
  };
}
function da(e, t) {
  ((e = e.updateQueue),
    t.updateQueue === e &&
      (t.updateQueue = {
        baseState: e.baseState,
        firstBaseUpdate: e.firstBaseUpdate,
        lastBaseUpdate: e.lastBaseUpdate,
        shared: e.shared,
        effects: e.effects,
      }));
}
function Ge(e, t) {
  return {
    eventTime: e,
    lane: t,
    tag: 0,
    payload: null,
    callback: null,
    next: null,
  };
}
function dt(e, t, n) {
  var r = e.updateQueue;
  if (r === null) return null;
  if (((r = r.shared), M & 2)) {
    var l = r.pending;
    return (
      l === null ? (t.next = t) : ((t.next = l.next), (l.next = t)),
      (r.pending = t),
      qe(e, n)
    );
  }
  return (
    (l = r.interleaved),
    l === null ? ((t.next = t), yu(r)) : ((t.next = l.next), (l.next = t)),
    (r.interleaved = t),
    qe(e, n)
  );
}
function jr(e, t, n) {
  if (
    ((t = t.updateQueue), t !== null && ((t = t.shared), (n & 4194240) !== 0))
  ) {
    var r = t.lanes;
    ((r &= e.pendingLanes), (n |= r), (t.lanes = n), ru(e, n));
  }
}
function Ei(e, t) {
  var n = e.updateQueue,
    r = e.alternate;
  if (r !== null && ((r = r.updateQueue), n === r)) {
    var l = null,
      o = null;
    if (((n = n.firstBaseUpdate), n !== null)) {
      do {
        var u = {
          eventTime: n.eventTime,
          lane: n.lane,
          tag: n.tag,
          payload: n.payload,
          callback: n.callback,
          next: null,
        };
        (o === null ? (l = o = u) : (o = o.next = u), (n = n.next));
      } while (n !== null);
      o === null ? (l = o = t) : (o = o.next = t);
    } else l = o = t;
    ((n = {
      baseState: r.baseState,
      firstBaseUpdate: l,
      lastBaseUpdate: o,
      shared: r.shared,
      effects: r.effects,
    }),
      (e.updateQueue = n));
    return;
  }
  ((e = n.lastBaseUpdate),
    e === null ? (n.firstBaseUpdate = t) : (e.next = t),
    (n.lastBaseUpdate = t));
}
function qr(e, t, n, r) {
  var l = e.updateQueue;
  rt = !1;
  var o = l.firstBaseUpdate,
    u = l.lastBaseUpdate,
    i = l.shared.pending;
  if (i !== null) {
    l.shared.pending = null;
    var s = i,
      c = s.next;
    ((s.next = null), u === null ? (o = c) : (u.next = c), (u = s));
    var h = e.alternate;
    h !== null &&
      ((h = h.updateQueue),
      (i = h.lastBaseUpdate),
      i !== u &&
        (i === null ? (h.firstBaseUpdate = c) : (i.next = c),
        (h.lastBaseUpdate = s)));
  }
  if (o !== null) {
    var m = l.baseState;
    ((u = 0), (h = c = s = null), (i = o));
    do {
      var p = i.lane,
        y = i.eventTime;
      if ((r & p) === p) {
        h !== null &&
          (h = h.next =
            {
              eventTime: y,
              lane: 0,
              tag: i.tag,
              payload: i.payload,
              callback: i.callback,
              next: null,
            });
        e: {
          var g = e,
            k = i;
          switch (((p = t), (y = n), k.tag)) {
            case 1:
              if (((g = k.payload), typeof g == "function")) {
                m = g.call(y, m, p);
                break e;
              }
              m = g;
              break e;
            case 3:
              g.flags = (g.flags & -65537) | 128;
            case 0:
              if (
                ((g = k.payload),
                (p = typeof g == "function" ? g.call(y, m, p) : g),
                p == null)
              )
                break e;
              m = Q({}, m, p);
              break e;
            case 2:
              rt = !0;
          }
        }
        i.callback !== null &&
          i.lane !== 0 &&
          ((e.flags |= 64),
          (p = l.effects),
          p === null ? (l.effects = [i]) : p.push(i));
      } else
        ((y = {
          eventTime: y,
          lane: p,
          tag: i.tag,
          payload: i.payload,
          callback: i.callback,
          next: null,
        }),
          h === null ? ((c = h = y), (s = m)) : (h = h.next = y),
          (u |= p));
      if (((i = i.next), i === null)) {
        if (((i = l.shared.pending), i === null)) break;
        ((p = i),
          (i = p.next),
          (p.next = null),
          (l.lastBaseUpdate = p),
          (l.shared.pending = null));
      }
    } while (!0);
    if (
      (h === null && (s = m),
      (l.baseState = s),
      (l.firstBaseUpdate = c),
      (l.lastBaseUpdate = h),
      (t = l.shared.interleaved),
      t !== null)
    ) {
      l = t;
      do ((u |= l.lane), (l = l.next));
      while (l !== t);
    } else o === null && (l.shared.lanes = 0);
    ((Ot |= u), (e.lanes = u), (e.memoizedState = m));
  }
}
function Ci(e, t, n) {
  if (((e = t.effects), (t.effects = null), e !== null))
    for (t = 0; t < e.length; t++) {
      var r = e[t],
        l = r.callback;
      if (l !== null) {
        if (((r.callback = null), (r = n), typeof l != "function"))
          throw Error(w(191, l));
        l.call(r);
      }
    }
}
var lr = {},
  We = wt(lr),
  Xn = wt(lr),
  Gn = wt(lr);
function Pt(e) {
  if (e === lr) throw Error(w(174));
  return e;
}
function wu(e, t) {
  switch ((F(Gn, t), F(Xn, e), F(We, lr), (e = t.nodeType), e)) {
    case 9:
    case 11:
      t = (t = t.documentElement) ? t.namespaceURI : io(null, "");
      break;
    default:
      ((e = e === 8 ? t.parentNode : t),
        (t = e.namespaceURI || null),
        (e = e.tagName),
        (t = io(t, e)));
  }
  (V(We), F(We, t));
}
function un() {
  (V(We), V(Xn), V(Gn));
}
function pa(e) {
  Pt(Gn.current);
  var t = Pt(We.current),
    n = io(t, e.type);
  t !== n && (F(Xn, e), F(We, n));
}
function Su(e) {
  Xn.current === e && (V(We), V(Xn));
}
var H = wt(0);
function br(e) {
  for (var t = e; t !== null; ) {
    if (t.tag === 13) {
      var n = t.memoizedState;
      if (
        n !== null &&
        ((n = n.dehydrated), n === null || n.data === "$?" || n.data === "$!")
      )
        return t;
    } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
      if (t.flags & 128) return t;
    } else if (t.child !== null) {
      ((t.child.return = t), (t = t.child));
      continue;
    }
    if (t === e) break;
    for (; t.sibling === null; ) {
      if (t.return === null || t.return === e) return null;
      t = t.return;
    }
    ((t.sibling.return = t.return), (t = t.sibling));
  }
  return null;
}
var Wl = [];
function ku() {
  for (var e = 0; e < Wl.length; e++)
    Wl[e]._workInProgressVersionPrimary = null;
  Wl.length = 0;
}
var Lr = et.ReactCurrentDispatcher,
  Ql = et.ReactCurrentBatchConfig,
  Rt = 0,
  W = null,
  Z = null,
  te = null,
  el = !1,
  Rn = !1,
  Jn = 0,
  rd = 0;
function ue() {
  throw Error(w(321));
}
function xu(e, t) {
  if (t === null) return !1;
  for (var n = 0; n < t.length && n < e.length; n++)
    if (!$e(e[n], t[n])) return !1;
  return !0;
}
function Eu(e, t, n, r, l, o) {
  if (
    ((Rt = o),
    (W = t),
    (t.memoizedState = null),
    (t.updateQueue = null),
    (t.lanes = 0),
    (Lr.current = e === null || e.memoizedState === null ? id : sd),
    (e = n(r, l)),
    Rn)
  ) {
    o = 0;
    do {
      if (((Rn = !1), (Jn = 0), 25 <= o)) throw Error(w(301));
      ((o += 1),
        (te = Z = null),
        (t.updateQueue = null),
        (Lr.current = ad),
        (e = n(r, l)));
    } while (Rn);
  }
  if (
    ((Lr.current = tl),
    (t = Z !== null && Z.next !== null),
    (Rt = 0),
    (te = Z = W = null),
    (el = !1),
    t)
  )
    throw Error(w(300));
  return e;
}
function Cu() {
  var e = Jn !== 0;
  return ((Jn = 0), e);
}
function Ve() {
  var e = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };
  return (te === null ? (W.memoizedState = te = e) : (te = te.next = e), te);
}
function Le() {
  if (Z === null) {
    var e = W.alternate;
    e = e !== null ? e.memoizedState : null;
  } else e = Z.next;
  var t = te === null ? W.memoizedState : te.next;
  if (t !== null) ((te = t), (Z = e));
  else {
    if (e === null) throw Error(w(310));
    ((Z = e),
      (e = {
        memoizedState: Z.memoizedState,
        baseState: Z.baseState,
        baseQueue: Z.baseQueue,
        queue: Z.queue,
        next: null,
      }),
      te === null ? (W.memoizedState = te = e) : (te = te.next = e));
  }
  return te;
}
function Zn(e, t) {
  return typeof t == "function" ? t(e) : t;
}
function Kl(e) {
  var t = Le(),
    n = t.queue;
  if (n === null) throw Error(w(311));
  n.lastRenderedReducer = e;
  var r = Z,
    l = r.baseQueue,
    o = n.pending;
  if (o !== null) {
    if (l !== null) {
      var u = l.next;
      ((l.next = o.next), (o.next = u));
    }
    ((r.baseQueue = l = o), (n.pending = null));
  }
  if (l !== null) {
    ((o = l.next), (r = r.baseState));
    var i = (u = null),
      s = null,
      c = o;
    do {
      var h = c.lane;
      if ((Rt & h) === h)
        (s !== null &&
          (s = s.next =
            {
              lane: 0,
              action: c.action,
              hasEagerState: c.hasEagerState,
              eagerState: c.eagerState,
              next: null,
            }),
          (r = c.hasEagerState ? c.eagerState : e(r, c.action)));
      else {
        var m = {
          lane: h,
          action: c.action,
          hasEagerState: c.hasEagerState,
          eagerState: c.eagerState,
          next: null,
        };
        (s === null ? ((i = s = m), (u = r)) : (s = s.next = m),
          (W.lanes |= h),
          (Ot |= h));
      }
      c = c.next;
    } while (c !== null && c !== o);
    (s === null ? (u = r) : (s.next = i),
      $e(r, t.memoizedState) || (ve = !0),
      (t.memoizedState = r),
      (t.baseState = u),
      (t.baseQueue = s),
      (n.lastRenderedState = r));
  }
  if (((e = n.interleaved), e !== null)) {
    l = e;
    do ((o = l.lane), (W.lanes |= o), (Ot |= o), (l = l.next));
    while (l !== e);
  } else l === null && (n.lanes = 0);
  return [t.memoizedState, n.dispatch];
}
function Yl(e) {
  var t = Le(),
    n = t.queue;
  if (n === null) throw Error(w(311));
  n.lastRenderedReducer = e;
  var r = n.dispatch,
    l = n.pending,
    o = t.memoizedState;
  if (l !== null) {
    n.pending = null;
    var u = (l = l.next);
    do ((o = e(o, u.action)), (u = u.next));
    while (u !== l);
    ($e(o, t.memoizedState) || (ve = !0),
      (t.memoizedState = o),
      t.baseQueue === null && (t.baseState = o),
      (n.lastRenderedState = o));
  }
  return [o, r];
}
function ma() {}
function ha(e, t) {
  var n = W,
    r = Le(),
    l = t(),
    o = !$e(r.memoizedState, l);
  if (
    (o && ((r.memoizedState = l), (ve = !0)),
    (r = r.queue),
    _u(ga.bind(null, n, r, e), [e]),
    r.getSnapshot !== t || o || (te !== null && te.memoizedState.tag & 1))
  ) {
    if (
      ((n.flags |= 2048),
      qn(9, ya.bind(null, n, r, l, t), void 0, null),
      ne === null)
    )
      throw Error(w(349));
    Rt & 30 || va(n, t, l);
  }
  return l;
}
function va(e, t, n) {
  ((e.flags |= 16384),
    (e = { getSnapshot: t, value: n }),
    (t = W.updateQueue),
    t === null
      ? ((t = { lastEffect: null, stores: null }),
        (W.updateQueue = t),
        (t.stores = [e]))
      : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e)));
}
function ya(e, t, n, r) {
  ((t.value = n), (t.getSnapshot = r), wa(t) && Sa(e));
}
function ga(e, t, n) {
  return n(function () {
    wa(t) && Sa(e);
  });
}
function wa(e) {
  var t = e.getSnapshot;
  e = e.value;
  try {
    var n = t();
    return !$e(e, n);
  } catch {
    return !0;
  }
}
function Sa(e) {
  var t = qe(e, 1);
  t !== null && Fe(t, e, 1, -1);
}
function _i(e) {
  var t = Ve();
  return (
    typeof e == "function" && (e = e()),
    (t.memoizedState = t.baseState = e),
    (e = {
      pending: null,
      interleaved: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: Zn,
      lastRenderedState: e,
    }),
    (t.queue = e),
    (e = e.dispatch = ud.bind(null, W, e)),
    [t.memoizedState, e]
  );
}
function qn(e, t, n, r) {
  return (
    (e = { tag: e, create: t, destroy: n, deps: r, next: null }),
    (t = W.updateQueue),
    t === null
      ? ((t = { lastEffect: null, stores: null }),
        (W.updateQueue = t),
        (t.lastEffect = e.next = e))
      : ((n = t.lastEffect),
        n === null
          ? (t.lastEffect = e.next = e)
          : ((r = n.next), (n.next = e), (e.next = r), (t.lastEffect = e))),
    e
  );
}
function ka() {
  return Le().memoizedState;
}
function Rr(e, t, n, r) {
  var l = Ve();
  ((W.flags |= e),
    (l.memoizedState = qn(1 | t, n, void 0, r === void 0 ? null : r)));
}
function ml(e, t, n, r) {
  var l = Le();
  r = r === void 0 ? null : r;
  var o = void 0;
  if (Z !== null) {
    var u = Z.memoizedState;
    if (((o = u.destroy), r !== null && xu(r, u.deps))) {
      l.memoizedState = qn(t, n, o, r);
      return;
    }
  }
  ((W.flags |= e), (l.memoizedState = qn(1 | t, n, o, r)));
}
function Ni(e, t) {
  return Rr(8390656, 8, e, t);
}
function _u(e, t) {
  return ml(2048, 8, e, t);
}
function xa(e, t) {
  return ml(4, 2, e, t);
}
function Ea(e, t) {
  return ml(4, 4, e, t);
}
function Ca(e, t) {
  if (typeof t == "function")
    return (
      (e = e()),
      t(e),
      function () {
        t(null);
      }
    );
  if (t != null)
    return (
      (e = e()),
      (t.current = e),
      function () {
        t.current = null;
      }
    );
}
function _a(e, t, n) {
  return (
    (n = n != null ? n.concat([e]) : null),
    ml(4, 4, Ca.bind(null, t, e), n)
  );
}
function Nu() {}
function Na(e, t) {
  var n = Le();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && xu(t, r[1])
    ? r[0]
    : ((n.memoizedState = [e, t]), e);
}
function Pa(e, t) {
  var n = Le();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && xu(t, r[1])
    ? r[0]
    : ((e = e()), (n.memoizedState = [e, t]), e);
}
function Ta(e, t, n) {
  return Rt & 21
    ? ($e(n, t) || ((n = Os()), (W.lanes |= n), (Ot |= n), (e.baseState = !0)),
      t)
    : (e.baseState && ((e.baseState = !1), (ve = !0)), (e.memoizedState = n));
}
function ld(e, t) {
  var n = I;
  ((I = n !== 0 && 4 > n ? n : 4), e(!0));
  var r = Ql.transition;
  Ql.transition = {};
  try {
    (e(!1), t());
  } finally {
    ((I = n), (Ql.transition = r));
  }
}
function za() {
  return Le().memoizedState;
}
function od(e, t, n) {
  var r = mt(e);
  if (
    ((n = {
      lane: r,
      action: n,
      hasEagerState: !1,
      eagerState: null,
      next: null,
    }),
    ja(e))
  )
    La(t, n);
  else if (((n = fa(e, t, n, r)), n !== null)) {
    var l = fe();
    (Fe(n, e, r, l), Ra(n, t, r));
  }
}
function ud(e, t, n) {
  var r = mt(e),
    l = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
  if (ja(e)) La(t, l);
  else {
    var o = e.alternate;
    if (
      e.lanes === 0 &&
      (o === null || o.lanes === 0) &&
      ((o = t.lastRenderedReducer), o !== null)
    )
      try {
        var u = t.lastRenderedState,
          i = o(u, n);
        if (((l.hasEagerState = !0), (l.eagerState = i), $e(i, u))) {
          var s = t.interleaved;
          (s === null
            ? ((l.next = l), yu(t))
            : ((l.next = s.next), (s.next = l)),
            (t.interleaved = l));
          return;
        }
      } catch {
      } finally {
      }
    ((n = fa(e, t, l, r)),
      n !== null && ((l = fe()), Fe(n, e, r, l), Ra(n, t, r)));
  }
}
function ja(e) {
  var t = e.alternate;
  return e === W || (t !== null && t === W);
}
function La(e, t) {
  Rn = el = !0;
  var n = e.pending;
  (n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)),
    (e.pending = t));
}
function Ra(e, t, n) {
  if (n & 4194240) {
    var r = t.lanes;
    ((r &= e.pendingLanes), (n |= r), (t.lanes = n), ru(e, n));
  }
}
var tl = {
    readContext: je,
    useCallback: ue,
    useContext: ue,
    useEffect: ue,
    useImperativeHandle: ue,
    useInsertionEffect: ue,
    useLayoutEffect: ue,
    useMemo: ue,
    useReducer: ue,
    useRef: ue,
    useState: ue,
    useDebugValue: ue,
    useDeferredValue: ue,
    useTransition: ue,
    useMutableSource: ue,
    useSyncExternalStore: ue,
    useId: ue,
    unstable_isNewReconciler: !1,
  },
  id = {
    readContext: je,
    useCallback: function (e, t) {
      return ((Ve().memoizedState = [e, t === void 0 ? null : t]), e);
    },
    useContext: je,
    useEffect: Ni,
    useImperativeHandle: function (e, t, n) {
      return (
        (n = n != null ? n.concat([e]) : null),
        Rr(4194308, 4, Ca.bind(null, t, e), n)
      );
    },
    useLayoutEffect: function (e, t) {
      return Rr(4194308, 4, e, t);
    },
    useInsertionEffect: function (e, t) {
      return Rr(4, 2, e, t);
    },
    useMemo: function (e, t) {
      var n = Ve();
      return (
        (t = t === void 0 ? null : t),
        (e = e()),
        (n.memoizedState = [e, t]),
        e
      );
    },
    useReducer: function (e, t, n) {
      var r = Ve();
      return (
        (t = n !== void 0 ? n(t) : t),
        (r.memoizedState = r.baseState = t),
        (e = {
          pending: null,
          interleaved: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: e,
          lastRenderedState: t,
        }),
        (r.queue = e),
        (e = e.dispatch = od.bind(null, W, e)),
        [r.memoizedState, e]
      );
    },
    useRef: function (e) {
      var t = Ve();
      return ((e = { current: e }), (t.memoizedState = e));
    },
    useState: _i,
    useDebugValue: Nu,
    useDeferredValue: function (e) {
      return (Ve().memoizedState = e);
    },
    useTransition: function () {
      var e = _i(!1),
        t = e[0];
      return ((e = ld.bind(null, e[1])), (Ve().memoizedState = e), [t, e]);
    },
    useMutableSource: function () {},
    useSyncExternalStore: function (e, t, n) {
      var r = W,
        l = Ve();
      if (B) {
        if (n === void 0) throw Error(w(407));
        n = n();
      } else {
        if (((n = t()), ne === null)) throw Error(w(349));
        Rt & 30 || va(r, t, n);
      }
      l.memoizedState = n;
      var o = { value: n, getSnapshot: t };
      return (
        (l.queue = o),
        Ni(ga.bind(null, r, o, e), [e]),
        (r.flags |= 2048),
        qn(9, ya.bind(null, r, o, n, t), void 0, null),
        n
      );
    },
    useId: function () {
      var e = Ve(),
        t = ne.identifierPrefix;
      if (B) {
        var n = Xe,
          r = Ye;
        ((n = (r & ~(1 << (32 - Ie(r) - 1))).toString(32) + n),
          (t = ":" + t + "R" + n),
          (n = Jn++),
          0 < n && (t += "H" + n.toString(32)),
          (t += ":"));
      } else ((n = rd++), (t = ":" + t + "r" + n.toString(32) + ":"));
      return (e.memoizedState = t);
    },
    unstable_isNewReconciler: !1,
  },
  sd = {
    readContext: je,
    useCallback: Na,
    useContext: je,
    useEffect: _u,
    useImperativeHandle: _a,
    useInsertionEffect: xa,
    useLayoutEffect: Ea,
    useMemo: Pa,
    useReducer: Kl,
    useRef: ka,
    useState: function () {
      return Kl(Zn);
    },
    useDebugValue: Nu,
    useDeferredValue: function (e) {
      var t = Le();
      return Ta(t, Z.memoizedState, e);
    },
    useTransition: function () {
      var e = Kl(Zn)[0],
        t = Le().memoizedState;
      return [e, t];
    },
    useMutableSource: ma,
    useSyncExternalStore: ha,
    useId: za,
    unstable_isNewReconciler: !1,
  },
  ad = {
    readContext: je,
    useCallback: Na,
    useContext: je,
    useEffect: _u,
    useImperativeHandle: _a,
    useInsertionEffect: xa,
    useLayoutEffect: Ea,
    useMemo: Pa,
    useReducer: Yl,
    useRef: ka,
    useState: function () {
      return Yl(Zn);
    },
    useDebugValue: Nu,
    useDeferredValue: function (e) {
      var t = Le();
      return Z === null ? (t.memoizedState = e) : Ta(t, Z.memoizedState, e);
    },
    useTransition: function () {
      var e = Yl(Zn)[0],
        t = Le().memoizedState;
      return [e, t];
    },
    useMutableSource: ma,
    useSyncExternalStore: ha,
    useId: za,
    unstable_isNewReconciler: !1,
  };
function Oe(e, t) {
  if (e && e.defaultProps) {
    ((t = Q({}, t)), (e = e.defaultProps));
    for (var n in e) t[n] === void 0 && (t[n] = e[n]);
    return t;
  }
  return t;
}
function zo(e, t, n, r) {
  ((t = e.memoizedState),
    (n = n(r, t)),
    (n = n == null ? t : Q({}, t, n)),
    (e.memoizedState = n),
    e.lanes === 0 && (e.updateQueue.baseState = n));
}
var hl = {
  isMounted: function (e) {
    return (e = e._reactInternals) ? It(e) === e : !1;
  },
  enqueueSetState: function (e, t, n) {
    e = e._reactInternals;
    var r = fe(),
      l = mt(e),
      o = Ge(r, l);
    ((o.payload = t),
      n != null && (o.callback = n),
      (t = dt(e, o, l)),
      t !== null && (Fe(t, e, l, r), jr(t, e, l)));
  },
  enqueueReplaceState: function (e, t, n) {
    e = e._reactInternals;
    var r = fe(),
      l = mt(e),
      o = Ge(r, l);
    ((o.tag = 1),
      (o.payload = t),
      n != null && (o.callback = n),
      (t = dt(e, o, l)),
      t !== null && (Fe(t, e, l, r), jr(t, e, l)));
  },
  enqueueForceUpdate: function (e, t) {
    e = e._reactInternals;
    var n = fe(),
      r = mt(e),
      l = Ge(n, r);
    ((l.tag = 2),
      t != null && (l.callback = t),
      (t = dt(e, l, r)),
      t !== null && (Fe(t, e, r, n), jr(t, e, r)));
  },
};
function Pi(e, t, n, r, l, o, u) {
  return (
    (e = e.stateNode),
    typeof e.shouldComponentUpdate == "function"
      ? e.shouldComponentUpdate(r, o, u)
      : t.prototype && t.prototype.isPureReactComponent
        ? !Wn(n, r) || !Wn(l, o)
        : !0
  );
}
function Oa(e, t, n) {
  var r = !1,
    l = yt,
    o = t.contextType;
  return (
    typeof o == "object" && o !== null
      ? (o = je(o))
      : ((l = ge(t) ? jt : ae.current),
        (r = t.contextTypes),
        (o = (r = r != null) ? rn(e, l) : yt)),
    (t = new t(n, o)),
    (e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null),
    (t.updater = hl),
    (e.stateNode = t),
    (t._reactInternals = e),
    r &&
      ((e = e.stateNode),
      (e.__reactInternalMemoizedUnmaskedChildContext = l),
      (e.__reactInternalMemoizedMaskedChildContext = o)),
    t
  );
}
function Ti(e, t, n, r) {
  ((e = t.state),
    typeof t.componentWillReceiveProps == "function" &&
      t.componentWillReceiveProps(n, r),
    typeof t.UNSAFE_componentWillReceiveProps == "function" &&
      t.UNSAFE_componentWillReceiveProps(n, r),
    t.state !== e && hl.enqueueReplaceState(t, t.state, null));
}
function jo(e, t, n, r) {
  var l = e.stateNode;
  ((l.props = n), (l.state = e.memoizedState), (l.refs = {}), gu(e));
  var o = t.contextType;
  (typeof o == "object" && o !== null
    ? (l.context = je(o))
    : ((o = ge(t) ? jt : ae.current), (l.context = rn(e, o))),
    (l.state = e.memoizedState),
    (o = t.getDerivedStateFromProps),
    typeof o == "function" && (zo(e, t, o, n), (l.state = e.memoizedState)),
    typeof t.getDerivedStateFromProps == "function" ||
      typeof l.getSnapshotBeforeUpdate == "function" ||
      (typeof l.UNSAFE_componentWillMount != "function" &&
        typeof l.componentWillMount != "function") ||
      ((t = l.state),
      typeof l.componentWillMount == "function" && l.componentWillMount(),
      typeof l.UNSAFE_componentWillMount == "function" &&
        l.UNSAFE_componentWillMount(),
      t !== l.state && hl.enqueueReplaceState(l, l.state, null),
      qr(e, n, l, r),
      (l.state = e.memoizedState)),
    typeof l.componentDidMount == "function" && (e.flags |= 4194308));
}
function sn(e, t) {
  try {
    var n = "",
      r = t;
    do ((n += Ic(r)), (r = r.return));
    while (r);
    var l = n;
  } catch (o) {
    l =
      `
Error generating stack: ` +
      o.message +
      `
` +
      o.stack;
  }
  return { value: e, source: t, stack: l, digest: null };
}
function Xl(e, t, n) {
  return { value: e, source: null, stack: n ?? null, digest: t ?? null };
}
function Lo(e, t) {
  try {
    console.error(t.value);
  } catch (n) {
    setTimeout(function () {
      throw n;
    });
  }
}
var cd = typeof WeakMap == "function" ? WeakMap : Map;
function Da(e, t, n) {
  ((n = Ge(-1, n)), (n.tag = 3), (n.payload = { element: null }));
  var r = t.value;
  return (
    (n.callback = function () {
      (rl || ((rl = !0), (Vo = r)), Lo(e, t));
    }),
    n
  );
}
function Ma(e, t, n) {
  ((n = Ge(-1, n)), (n.tag = 3));
  var r = e.type.getDerivedStateFromError;
  if (typeof r == "function") {
    var l = t.value;
    ((n.payload = function () {
      return r(l);
    }),
      (n.callback = function () {
        Lo(e, t);
      }));
  }
  var o = e.stateNode;
  return (
    o !== null &&
      typeof o.componentDidCatch == "function" &&
      (n.callback = function () {
        (Lo(e, t),
          typeof r != "function" &&
            (pt === null ? (pt = new Set([this])) : pt.add(this)));
        var u = t.stack;
        this.componentDidCatch(t.value, {
          componentStack: u !== null ? u : "",
        });
      }),
    n
  );
}
function zi(e, t, n) {
  var r = e.pingCache;
  if (r === null) {
    r = e.pingCache = new cd();
    var l = new Set();
    r.set(t, l);
  } else ((l = r.get(t)), l === void 0 && ((l = new Set()), r.set(t, l)));
  l.has(n) || (l.add(n), (e = Cd.bind(null, e, t, n)), t.then(e, e));
}
function ji(e) {
  do {
    var t;
    if (
      ((t = e.tag === 13) &&
        ((t = e.memoizedState), (t = t !== null ? t.dehydrated !== null : !0)),
      t)
    )
      return e;
    e = e.return;
  } while (e !== null);
  return null;
}
function Li(e, t, n, r, l) {
  return e.mode & 1
    ? ((e.flags |= 65536), (e.lanes = l), e)
    : (e === t
        ? (e.flags |= 65536)
        : ((e.flags |= 128),
          (n.flags |= 131072),
          (n.flags &= -52805),
          n.tag === 1 &&
            (n.alternate === null
              ? (n.tag = 17)
              : ((t = Ge(-1, 1)), (t.tag = 2), dt(n, t, 1))),
          (n.lanes |= 1)),
      e);
}
var fd = et.ReactCurrentOwner,
  ve = !1;
function ce(e, t, n, r) {
  t.child = e === null ? ca(t, null, n, r) : on(t, e.child, n, r);
}
function Ri(e, t, n, r, l) {
  n = n.render;
  var o = t.ref;
  return (
    en(t, l),
    (r = Eu(e, t, n, r, o, l)),
    (n = Cu()),
    e !== null && !ve
      ? ((t.updateQueue = e.updateQueue),
        (t.flags &= -2053),
        (e.lanes &= ~l),
        be(e, t, l))
      : (B && n && fu(t), (t.flags |= 1), ce(e, t, r, l), t.child)
  );
}
function Oi(e, t, n, r, l) {
  if (e === null) {
    var o = n.type;
    return typeof o == "function" &&
      !Du(o) &&
      o.defaultProps === void 0 &&
      n.compare === null &&
      n.defaultProps === void 0
      ? ((t.tag = 15), (t.type = o), Ia(e, t, o, r, l))
      : ((e = Ir(n.type, null, r, t, t.mode, l)),
        (e.ref = t.ref),
        (e.return = t),
        (t.child = e));
  }
  if (((o = e.child), !(e.lanes & l))) {
    var u = o.memoizedProps;
    if (
      ((n = n.compare), (n = n !== null ? n : Wn), n(u, r) && e.ref === t.ref)
    )
      return be(e, t, l);
  }
  return (
    (t.flags |= 1),
    (e = ht(o, r)),
    (e.ref = t.ref),
    (e.return = t),
    (t.child = e)
  );
}
function Ia(e, t, n, r, l) {
  if (e !== null) {
    var o = e.memoizedProps;
    if (Wn(o, r) && e.ref === t.ref)
      if (((ve = !1), (t.pendingProps = r = o), (e.lanes & l) !== 0))
        e.flags & 131072 && (ve = !0);
      else return ((t.lanes = e.lanes), be(e, t, l));
  }
  return Ro(e, t, n, r, l);
}
function Fa(e, t, n) {
  var r = t.pendingProps,
    l = r.children,
    o = e !== null ? e.memoizedState : null;
  if (r.mode === "hidden")
    if (!(t.mode & 1))
      ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
        F(Gt, Se),
        (Se |= n));
    else {
      if (!(n & 1073741824))
        return (
          (e = o !== null ? o.baseLanes | n : n),
          (t.lanes = t.childLanes = 1073741824),
          (t.memoizedState = {
            baseLanes: e,
            cachePool: null,
            transitions: null,
          }),
          (t.updateQueue = null),
          F(Gt, Se),
          (Se |= e),
          null
        );
      ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
        (r = o !== null ? o.baseLanes : n),
        F(Gt, Se),
        (Se |= r));
    }
  else
    (o !== null ? ((r = o.baseLanes | n), (t.memoizedState = null)) : (r = n),
      F(Gt, Se),
      (Se |= r));
  return (ce(e, t, l, n), t.child);
}
function $a(e, t) {
  var n = t.ref;
  ((e === null && n !== null) || (e !== null && e.ref !== n)) &&
    ((t.flags |= 512), (t.flags |= 2097152));
}
function Ro(e, t, n, r, l) {
  var o = ge(n) ? jt : ae.current;
  return (
    (o = rn(t, o)),
    en(t, l),
    (n = Eu(e, t, n, r, o, l)),
    (r = Cu()),
    e !== null && !ve
      ? ((t.updateQueue = e.updateQueue),
        (t.flags &= -2053),
        (e.lanes &= ~l),
        be(e, t, l))
      : (B && r && fu(t), (t.flags |= 1), ce(e, t, n, l), t.child)
  );
}
function Di(e, t, n, r, l) {
  if (ge(n)) {
    var o = !0;
    Yr(t);
  } else o = !1;
  if ((en(t, l), t.stateNode === null))
    (Or(e, t), Oa(t, n, r), jo(t, n, r, l), (r = !0));
  else if (e === null) {
    var u = t.stateNode,
      i = t.memoizedProps;
    u.props = i;
    var s = u.context,
      c = n.contextType;
    typeof c == "object" && c !== null
      ? (c = je(c))
      : ((c = ge(n) ? jt : ae.current), (c = rn(t, c)));
    var h = n.getDerivedStateFromProps,
      m =
        typeof h == "function" ||
        typeof u.getSnapshotBeforeUpdate == "function";
    (m ||
      (typeof u.UNSAFE_componentWillReceiveProps != "function" &&
        typeof u.componentWillReceiveProps != "function") ||
      ((i !== r || s !== c) && Ti(t, u, r, c)),
      (rt = !1));
    var p = t.memoizedState;
    ((u.state = p),
      qr(t, r, u, l),
      (s = t.memoizedState),
      i !== r || p !== s || ye.current || rt
        ? (typeof h == "function" && (zo(t, n, h, r), (s = t.memoizedState)),
          (i = rt || Pi(t, n, i, r, p, s, c))
            ? (m ||
                (typeof u.UNSAFE_componentWillMount != "function" &&
                  typeof u.componentWillMount != "function") ||
                (typeof u.componentWillMount == "function" &&
                  u.componentWillMount(),
                typeof u.UNSAFE_componentWillMount == "function" &&
                  u.UNSAFE_componentWillMount()),
              typeof u.componentDidMount == "function" && (t.flags |= 4194308))
            : (typeof u.componentDidMount == "function" && (t.flags |= 4194308),
              (t.memoizedProps = r),
              (t.memoizedState = s)),
          (u.props = r),
          (u.state = s),
          (u.context = c),
          (r = i))
        : (typeof u.componentDidMount == "function" && (t.flags |= 4194308),
          (r = !1)));
  } else {
    ((u = t.stateNode),
      da(e, t),
      (i = t.memoizedProps),
      (c = t.type === t.elementType ? i : Oe(t.type, i)),
      (u.props = c),
      (m = t.pendingProps),
      (p = u.context),
      (s = n.contextType),
      typeof s == "object" && s !== null
        ? (s = je(s))
        : ((s = ge(n) ? jt : ae.current), (s = rn(t, s))));
    var y = n.getDerivedStateFromProps;
    ((h =
      typeof y == "function" ||
      typeof u.getSnapshotBeforeUpdate == "function") ||
      (typeof u.UNSAFE_componentWillReceiveProps != "function" &&
        typeof u.componentWillReceiveProps != "function") ||
      ((i !== m || p !== s) && Ti(t, u, r, s)),
      (rt = !1),
      (p = t.memoizedState),
      (u.state = p),
      qr(t, r, u, l));
    var g = t.memoizedState;
    i !== m || p !== g || ye.current || rt
      ? (typeof y == "function" && (zo(t, n, y, r), (g = t.memoizedState)),
        (c = rt || Pi(t, n, c, r, p, g, s) || !1)
          ? (h ||
              (typeof u.UNSAFE_componentWillUpdate != "function" &&
                typeof u.componentWillUpdate != "function") ||
              (typeof u.componentWillUpdate == "function" &&
                u.componentWillUpdate(r, g, s),
              typeof u.UNSAFE_componentWillUpdate == "function" &&
                u.UNSAFE_componentWillUpdate(r, g, s)),
            typeof u.componentDidUpdate == "function" && (t.flags |= 4),
            typeof u.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024))
          : (typeof u.componentDidUpdate != "function" ||
              (i === e.memoizedProps && p === e.memoizedState) ||
              (t.flags |= 4),
            typeof u.getSnapshotBeforeUpdate != "function" ||
              (i === e.memoizedProps && p === e.memoizedState) ||
              (t.flags |= 1024),
            (t.memoizedProps = r),
            (t.memoizedState = g)),
        (u.props = r),
        (u.state = g),
        (u.context = s),
        (r = c))
      : (typeof u.componentDidUpdate != "function" ||
          (i === e.memoizedProps && p === e.memoizedState) ||
          (t.flags |= 4),
        typeof u.getSnapshotBeforeUpdate != "function" ||
          (i === e.memoizedProps && p === e.memoizedState) ||
          (t.flags |= 1024),
        (r = !1));
  }
  return Oo(e, t, n, r, o, l);
}
function Oo(e, t, n, r, l, o) {
  $a(e, t);
  var u = (t.flags & 128) !== 0;
  if (!r && !u) return (l && wi(t, n, !1), be(e, t, o));
  ((r = t.stateNode), (fd.current = t));
  var i =
    u && typeof n.getDerivedStateFromError != "function" ? null : r.render();
  return (
    (t.flags |= 1),
    e !== null && u
      ? ((t.child = on(t, e.child, null, o)), (t.child = on(t, null, i, o)))
      : ce(e, t, i, o),
    (t.memoizedState = r.state),
    l && wi(t, n, !0),
    t.child
  );
}
function Ua(e) {
  var t = e.stateNode;
  (t.pendingContext
    ? gi(e, t.pendingContext, t.pendingContext !== t.context)
    : t.context && gi(e, t.context, !1),
    wu(e, t.containerInfo));
}
function Mi(e, t, n, r, l) {
  return (ln(), pu(l), (t.flags |= 256), ce(e, t, n, r), t.child);
}
var Do = { dehydrated: null, treeContext: null, retryLane: 0 };
function Mo(e) {
  return { baseLanes: e, cachePool: null, transitions: null };
}
function Aa(e, t, n) {
  var r = t.pendingProps,
    l = H.current,
    o = !1,
    u = (t.flags & 128) !== 0,
    i;
  if (
    ((i = u) ||
      (i = e !== null && e.memoizedState === null ? !1 : (l & 2) !== 0),
    i
      ? ((o = !0), (t.flags &= -129))
      : (e === null || e.memoizedState !== null) && (l |= 1),
    F(H, l & 1),
    e === null)
  )
    return (
      Po(t),
      (e = t.memoizedState),
      e !== null && ((e = e.dehydrated), e !== null)
        ? (t.mode & 1
            ? e.data === "$!"
              ? (t.lanes = 8)
              : (t.lanes = 1073741824)
            : (t.lanes = 1),
          null)
        : ((u = r.children),
          (e = r.fallback),
          o
            ? ((r = t.mode),
              (o = t.child),
              (u = { mode: "hidden", children: u }),
              !(r & 1) && o !== null
                ? ((o.childLanes = 0), (o.pendingProps = u))
                : (o = gl(u, r, 0, null)),
              (e = zt(e, r, n, null)),
              (o.return = t),
              (e.return = t),
              (o.sibling = e),
              (t.child = o),
              (t.child.memoizedState = Mo(n)),
              (t.memoizedState = Do),
              e)
            : Pu(t, u))
    );
  if (((l = e.memoizedState), l !== null && ((i = l.dehydrated), i !== null)))
    return dd(e, t, u, r, i, l, n);
  if (o) {
    ((o = r.fallback), (u = t.mode), (l = e.child), (i = l.sibling));
    var s = { mode: "hidden", children: r.children };
    return (
      !(u & 1) && t.child !== l
        ? ((r = t.child),
          (r.childLanes = 0),
          (r.pendingProps = s),
          (t.deletions = null))
        : ((r = ht(l, s)), (r.subtreeFlags = l.subtreeFlags & 14680064)),
      i !== null ? (o = ht(i, o)) : ((o = zt(o, u, n, null)), (o.flags |= 2)),
      (o.return = t),
      (r.return = t),
      (r.sibling = o),
      (t.child = r),
      (r = o),
      (o = t.child),
      (u = e.child.memoizedState),
      (u =
        u === null
          ? Mo(n)
          : {
              baseLanes: u.baseLanes | n,
              cachePool: null,
              transitions: u.transitions,
            }),
      (o.memoizedState = u),
      (o.childLanes = e.childLanes & ~n),
      (t.memoizedState = Do),
      r
    );
  }
  return (
    (o = e.child),
    (e = o.sibling),
    (r = ht(o, { mode: "visible", children: r.children })),
    !(t.mode & 1) && (r.lanes = n),
    (r.return = t),
    (r.sibling = null),
    e !== null &&
      ((n = t.deletions),
      n === null ? ((t.deletions = [e]), (t.flags |= 16)) : n.push(e)),
    (t.child = r),
    (t.memoizedState = null),
    r
  );
}
function Pu(e, t) {
  return (
    (t = gl({ mode: "visible", children: t }, e.mode, 0, null)),
    (t.return = e),
    (e.child = t)
  );
}
function kr(e, t, n, r) {
  return (
    r !== null && pu(r),
    on(t, e.child, null, n),
    (e = Pu(t, t.pendingProps.children)),
    (e.flags |= 2),
    (t.memoizedState = null),
    e
  );
}
function dd(e, t, n, r, l, o, u) {
  if (n)
    return t.flags & 256
      ? ((t.flags &= -257), (r = Xl(Error(w(422)))), kr(e, t, u, r))
      : t.memoizedState !== null
        ? ((t.child = e.child), (t.flags |= 128), null)
        : ((o = r.fallback),
          (l = t.mode),
          (r = gl({ mode: "visible", children: r.children }, l, 0, null)),
          (o = zt(o, l, u, null)),
          (o.flags |= 2),
          (r.return = t),
          (o.return = t),
          (r.sibling = o),
          (t.child = r),
          t.mode & 1 && on(t, e.child, null, u),
          (t.child.memoizedState = Mo(u)),
          (t.memoizedState = Do),
          o);
  if (!(t.mode & 1)) return kr(e, t, u, null);
  if (l.data === "$!") {
    if (((r = l.nextSibling && l.nextSibling.dataset), r)) var i = r.dgst;
    return (
      (r = i),
      (o = Error(w(419))),
      (r = Xl(o, r, void 0)),
      kr(e, t, u, r)
    );
  }
  if (((i = (u & e.childLanes) !== 0), ve || i)) {
    if (((r = ne), r !== null)) {
      switch (u & -u) {
        case 4:
          l = 2;
          break;
        case 16:
          l = 8;
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
          l = 32;
          break;
        case 536870912:
          l = 268435456;
          break;
        default:
          l = 0;
      }
      ((l = l & (r.suspendedLanes | u) ? 0 : l),
        l !== 0 &&
          l !== o.retryLane &&
          ((o.retryLane = l), qe(e, l), Fe(r, e, l, -1)));
    }
    return (Ou(), (r = Xl(Error(w(421)))), kr(e, t, u, r));
  }
  return l.data === "$?"
    ? ((t.flags |= 128),
      (t.child = e.child),
      (t = _d.bind(null, e)),
      (l._reactRetry = t),
      null)
    : ((e = o.treeContext),
      (ke = ft(l.nextSibling)),
      (xe = t),
      (B = !0),
      (Me = null),
      e !== null &&
        ((Ne[Pe++] = Ye),
        (Ne[Pe++] = Xe),
        (Ne[Pe++] = Lt),
        (Ye = e.id),
        (Xe = e.overflow),
        (Lt = t)),
      (t = Pu(t, r.children)),
      (t.flags |= 4096),
      t);
}
function Ii(e, t, n) {
  e.lanes |= t;
  var r = e.alternate;
  (r !== null && (r.lanes |= t), To(e.return, t, n));
}
function Gl(e, t, n, r, l) {
  var o = e.memoizedState;
  o === null
    ? (e.memoizedState = {
        isBackwards: t,
        rendering: null,
        renderingStartTime: 0,
        last: r,
        tail: n,
        tailMode: l,
      })
    : ((o.isBackwards = t),
      (o.rendering = null),
      (o.renderingStartTime = 0),
      (o.last = r),
      (o.tail = n),
      (o.tailMode = l));
}
function Va(e, t, n) {
  var r = t.pendingProps,
    l = r.revealOrder,
    o = r.tail;
  if ((ce(e, t, r.children, n), (r = H.current), r & 2))
    ((r = (r & 1) | 2), (t.flags |= 128));
  else {
    if (e !== null && e.flags & 128)
      e: for (e = t.child; e !== null; ) {
        if (e.tag === 13) e.memoizedState !== null && Ii(e, n, t);
        else if (e.tag === 19) Ii(e, n, t);
        else if (e.child !== null) {
          ((e.child.return = e), (e = e.child));
          continue;
        }
        if (e === t) break e;
        for (; e.sibling === null; ) {
          if (e.return === null || e.return === t) break e;
          e = e.return;
        }
        ((e.sibling.return = e.return), (e = e.sibling));
      }
    r &= 1;
  }
  if ((F(H, r), !(t.mode & 1))) t.memoizedState = null;
  else
    switch (l) {
      case "forwards":
        for (n = t.child, l = null; n !== null; )
          ((e = n.alternate),
            e !== null && br(e) === null && (l = n),
            (n = n.sibling));
        ((n = l),
          n === null
            ? ((l = t.child), (t.child = null))
            : ((l = n.sibling), (n.sibling = null)),
          Gl(t, !1, l, n, o));
        break;
      case "backwards":
        for (n = null, l = t.child, t.child = null; l !== null; ) {
          if (((e = l.alternate), e !== null && br(e) === null)) {
            t.child = l;
            break;
          }
          ((e = l.sibling), (l.sibling = n), (n = l), (l = e));
        }
        Gl(t, !0, n, null, o);
        break;
      case "together":
        Gl(t, !1, null, null, void 0);
        break;
      default:
        t.memoizedState = null;
    }
  return t.child;
}
function Or(e, t) {
  !(t.mode & 1) &&
    e !== null &&
    ((e.alternate = null), (t.alternate = null), (t.flags |= 2));
}
function be(e, t, n) {
  if (
    (e !== null && (t.dependencies = e.dependencies),
    (Ot |= t.lanes),
    !(n & t.childLanes))
  )
    return null;
  if (e !== null && t.child !== e.child) throw Error(w(153));
  if (t.child !== null) {
    for (
      e = t.child, n = ht(e, e.pendingProps), t.child = n, n.return = t;
      e.sibling !== null;

    )
      ((e = e.sibling),
        (n = n.sibling = ht(e, e.pendingProps)),
        (n.return = t));
    n.sibling = null;
  }
  return t.child;
}
function pd(e, t, n) {
  switch (t.tag) {
    case 3:
      (Ua(t), ln());
      break;
    case 5:
      pa(t);
      break;
    case 1:
      ge(t.type) && Yr(t);
      break;
    case 4:
      wu(t, t.stateNode.containerInfo);
      break;
    case 10:
      var r = t.type._context,
        l = t.memoizedProps.value;
      (F(Jr, r._currentValue), (r._currentValue = l));
      break;
    case 13:
      if (((r = t.memoizedState), r !== null))
        return r.dehydrated !== null
          ? (F(H, H.current & 1), (t.flags |= 128), null)
          : n & t.child.childLanes
            ? Aa(e, t, n)
            : (F(H, H.current & 1),
              (e = be(e, t, n)),
              e !== null ? e.sibling : null);
      F(H, H.current & 1);
      break;
    case 19:
      if (((r = (n & t.childLanes) !== 0), e.flags & 128)) {
        if (r) return Va(e, t, n);
        t.flags |= 128;
      }
      if (
        ((l = t.memoizedState),
        l !== null &&
          ((l.rendering = null), (l.tail = null), (l.lastEffect = null)),
        F(H, H.current),
        r)
      )
        break;
      return null;
    case 22:
    case 23:
      return ((t.lanes = 0), Fa(e, t, n));
  }
  return be(e, t, n);
}
var Ba, Io, Ha, Wa;
Ba = function (e, t) {
  for (var n = t.child; n !== null; ) {
    if (n.tag === 5 || n.tag === 6) e.appendChild(n.stateNode);
    else if (n.tag !== 4 && n.child !== null) {
      ((n.child.return = n), (n = n.child));
      continue;
    }
    if (n === t) break;
    for (; n.sibling === null; ) {
      if (n.return === null || n.return === t) return;
      n = n.return;
    }
    ((n.sibling.return = n.return), (n = n.sibling));
  }
};
Io = function () {};
Ha = function (e, t, n, r) {
  var l = e.memoizedProps;
  if (l !== r) {
    ((e = t.stateNode), Pt(We.current));
    var o = null;
    switch (n) {
      case "input":
        ((l = ro(e, l)), (r = ro(e, r)), (o = []));
        break;
      case "select":
        ((l = Q({}, l, { value: void 0 })),
          (r = Q({}, r, { value: void 0 })),
          (o = []));
        break;
      case "textarea":
        ((l = uo(e, l)), (r = uo(e, r)), (o = []));
        break;
      default:
        typeof l.onClick != "function" &&
          typeof r.onClick == "function" &&
          (e.onclick = Qr);
    }
    so(n, r);
    var u;
    n = null;
    for (c in l)
      if (!r.hasOwnProperty(c) && l.hasOwnProperty(c) && l[c] != null)
        if (c === "style") {
          var i = l[c];
          for (u in i) i.hasOwnProperty(u) && (n || (n = {}), (n[u] = ""));
        } else
          c !== "dangerouslySetInnerHTML" &&
            c !== "children" &&
            c !== "suppressContentEditableWarning" &&
            c !== "suppressHydrationWarning" &&
            c !== "autoFocus" &&
            (Fn.hasOwnProperty(c)
              ? o || (o = [])
              : (o = o || []).push(c, null));
    for (c in r) {
      var s = r[c];
      if (
        ((i = l != null ? l[c] : void 0),
        r.hasOwnProperty(c) && s !== i && (s != null || i != null))
      )
        if (c === "style")
          if (i) {
            for (u in i)
              !i.hasOwnProperty(u) ||
                (s && s.hasOwnProperty(u)) ||
                (n || (n = {}), (n[u] = ""));
            for (u in s)
              s.hasOwnProperty(u) &&
                i[u] !== s[u] &&
                (n || (n = {}), (n[u] = s[u]));
          } else (n || (o || (o = []), o.push(c, n)), (n = s));
        else
          c === "dangerouslySetInnerHTML"
            ? ((s = s ? s.__html : void 0),
              (i = i ? i.__html : void 0),
              s != null && i !== s && (o = o || []).push(c, s))
            : c === "children"
              ? (typeof s != "string" && typeof s != "number") ||
                (o = o || []).push(c, "" + s)
              : c !== "suppressContentEditableWarning" &&
                c !== "suppressHydrationWarning" &&
                (Fn.hasOwnProperty(c)
                  ? (s != null && c === "onScroll" && A("scroll", e),
                    o || i === s || (o = []))
                  : (o = o || []).push(c, s));
    }
    n && (o = o || []).push("style", n);
    var c = o;
    (t.updateQueue = c) && (t.flags |= 4);
  }
};
Wa = function (e, t, n, r) {
  n !== r && (t.flags |= 4);
};
function wn(e, t) {
  if (!B)
    switch (e.tailMode) {
      case "hidden":
        t = e.tail;
        for (var n = null; t !== null; )
          (t.alternate !== null && (n = t), (t = t.sibling));
        n === null ? (e.tail = null) : (n.sibling = null);
        break;
      case "collapsed":
        n = e.tail;
        for (var r = null; n !== null; )
          (n.alternate !== null && (r = n), (n = n.sibling));
        r === null
          ? t || e.tail === null
            ? (e.tail = null)
            : (e.tail.sibling = null)
          : (r.sibling = null);
    }
}
function ie(e) {
  var t = e.alternate !== null && e.alternate.child === e.child,
    n = 0,
    r = 0;
  if (t)
    for (var l = e.child; l !== null; )
      ((n |= l.lanes | l.childLanes),
        (r |= l.subtreeFlags & 14680064),
        (r |= l.flags & 14680064),
        (l.return = e),
        (l = l.sibling));
  else
    for (l = e.child; l !== null; )
      ((n |= l.lanes | l.childLanes),
        (r |= l.subtreeFlags),
        (r |= l.flags),
        (l.return = e),
        (l = l.sibling));
  return ((e.subtreeFlags |= r), (e.childLanes = n), t);
}
function md(e, t, n) {
  var r = t.pendingProps;
  switch ((du(t), t.tag)) {
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
      return (ie(t), null);
    case 1:
      return (ge(t.type) && Kr(), ie(t), null);
    case 3:
      return (
        (r = t.stateNode),
        un(),
        V(ye),
        V(ae),
        ku(),
        r.pendingContext &&
          ((r.context = r.pendingContext), (r.pendingContext = null)),
        (e === null || e.child === null) &&
          (wr(t)
            ? (t.flags |= 4)
            : e === null ||
              (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
              ((t.flags |= 1024), Me !== null && (Wo(Me), (Me = null)))),
        Io(e, t),
        ie(t),
        null
      );
    case 5:
      Su(t);
      var l = Pt(Gn.current);
      if (((n = t.type), e !== null && t.stateNode != null))
        (Ha(e, t, n, r, l),
          e.ref !== t.ref && ((t.flags |= 512), (t.flags |= 2097152)));
      else {
        if (!r) {
          if (t.stateNode === null) throw Error(w(166));
          return (ie(t), null);
        }
        if (((e = Pt(We.current)), wr(t))) {
          ((r = t.stateNode), (n = t.type));
          var o = t.memoizedProps;
          switch (((r[Be] = t), (r[Yn] = o), (e = (t.mode & 1) !== 0), n)) {
            case "dialog":
              (A("cancel", r), A("close", r));
              break;
            case "iframe":
            case "object":
            case "embed":
              A("load", r);
              break;
            case "video":
            case "audio":
              for (l = 0; l < _n.length; l++) A(_n[l], r);
              break;
            case "source":
              A("error", r);
              break;
            case "img":
            case "image":
            case "link":
              (A("error", r), A("load", r));
              break;
            case "details":
              A("toggle", r);
              break;
            case "input":
              (Qu(r, o), A("invalid", r));
              break;
            case "select":
              ((r._wrapperState = { wasMultiple: !!o.multiple }),
                A("invalid", r));
              break;
            case "textarea":
              (Yu(r, o), A("invalid", r));
          }
          (so(n, o), (l = null));
          for (var u in o)
            if (o.hasOwnProperty(u)) {
              var i = o[u];
              u === "children"
                ? typeof i == "string"
                  ? r.textContent !== i &&
                    (o.suppressHydrationWarning !== !0 &&
                      gr(r.textContent, i, e),
                    (l = ["children", i]))
                  : typeof i == "number" &&
                    r.textContent !== "" + i &&
                    (o.suppressHydrationWarning !== !0 &&
                      gr(r.textContent, i, e),
                    (l = ["children", "" + i]))
                : Fn.hasOwnProperty(u) &&
                  i != null &&
                  u === "onScroll" &&
                  A("scroll", r);
            }
          switch (n) {
            case "input":
              (cr(r), Ku(r, o, !0));
              break;
            case "textarea":
              (cr(r), Xu(r));
              break;
            case "select":
            case "option":
              break;
            default:
              typeof o.onClick == "function" && (r.onclick = Qr);
          }
          ((r = l), (t.updateQueue = r), r !== null && (t.flags |= 4));
        } else {
          ((u = l.nodeType === 9 ? l : l.ownerDocument),
            e === "http://www.w3.org/1999/xhtml" && (e = gs(n)),
            e === "http://www.w3.org/1999/xhtml"
              ? n === "script"
                ? ((e = u.createElement("div")),
                  (e.innerHTML = "<script><\/script>"),
                  (e = e.removeChild(e.firstChild)))
                : typeof r.is == "string"
                  ? (e = u.createElement(n, { is: r.is }))
                  : ((e = u.createElement(n)),
                    n === "select" &&
                      ((u = e),
                      r.multiple
                        ? (u.multiple = !0)
                        : r.size && (u.size = r.size)))
              : (e = u.createElementNS(e, n)),
            (e[Be] = t),
            (e[Yn] = r),
            Ba(e, t, !1, !1),
            (t.stateNode = e));
          e: {
            switch (((u = ao(n, r)), n)) {
              case "dialog":
                (A("cancel", e), A("close", e), (l = r));
                break;
              case "iframe":
              case "object":
              case "embed":
                (A("load", e), (l = r));
                break;
              case "video":
              case "audio":
                for (l = 0; l < _n.length; l++) A(_n[l], e);
                l = r;
                break;
              case "source":
                (A("error", e), (l = r));
                break;
              case "img":
              case "image":
              case "link":
                (A("error", e), A("load", e), (l = r));
                break;
              case "details":
                (A("toggle", e), (l = r));
                break;
              case "input":
                (Qu(e, r), (l = ro(e, r)), A("invalid", e));
                break;
              case "option":
                l = r;
                break;
              case "select":
                ((e._wrapperState = { wasMultiple: !!r.multiple }),
                  (l = Q({}, r, { value: void 0 })),
                  A("invalid", e));
                break;
              case "textarea":
                (Yu(e, r), (l = uo(e, r)), A("invalid", e));
                break;
              default:
                l = r;
            }
            (so(n, l), (i = l));
            for (o in i)
              if (i.hasOwnProperty(o)) {
                var s = i[o];
                o === "style"
                  ? ks(e, s)
                  : o === "dangerouslySetInnerHTML"
                    ? ((s = s ? s.__html : void 0), s != null && ws(e, s))
                    : o === "children"
                      ? typeof s == "string"
                        ? (n !== "textarea" || s !== "") && $n(e, s)
                        : typeof s == "number" && $n(e, "" + s)
                      : o !== "suppressContentEditableWarning" &&
                        o !== "suppressHydrationWarning" &&
                        o !== "autoFocus" &&
                        (Fn.hasOwnProperty(o)
                          ? s != null && o === "onScroll" && A("scroll", e)
                          : s != null && Zo(e, o, s, u));
              }
            switch (n) {
              case "input":
                (cr(e), Ku(e, r, !1));
                break;
              case "textarea":
                (cr(e), Xu(e));
                break;
              case "option":
                r.value != null && e.setAttribute("value", "" + vt(r.value));
                break;
              case "select":
                ((e.multiple = !!r.multiple),
                  (o = r.value),
                  o != null
                    ? Jt(e, !!r.multiple, o, !1)
                    : r.defaultValue != null &&
                      Jt(e, !!r.multiple, r.defaultValue, !0));
                break;
              default:
                typeof l.onClick == "function" && (e.onclick = Qr);
            }
            switch (n) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                r = !!r.autoFocus;
                break e;
              case "img":
                r = !0;
                break e;
              default:
                r = !1;
            }
          }
          r && (t.flags |= 4);
        }
        t.ref !== null && ((t.flags |= 512), (t.flags |= 2097152));
      }
      return (ie(t), null);
    case 6:
      if (e && t.stateNode != null) Wa(e, t, e.memoizedProps, r);
      else {
        if (typeof r != "string" && t.stateNode === null) throw Error(w(166));
        if (((n = Pt(Gn.current)), Pt(We.current), wr(t))) {
          if (
            ((r = t.stateNode),
            (n = t.memoizedProps),
            (r[Be] = t),
            (o = r.nodeValue !== n) && ((e = xe), e !== null))
          )
            switch (e.tag) {
              case 3:
                gr(r.nodeValue, n, (e.mode & 1) !== 0);
                break;
              case 5:
                e.memoizedProps.suppressHydrationWarning !== !0 &&
                  gr(r.nodeValue, n, (e.mode & 1) !== 0);
            }
          o && (t.flags |= 4);
        } else
          ((r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r)),
            (r[Be] = t),
            (t.stateNode = r));
      }
      return (ie(t), null);
    case 13:
      if (
        (V(H),
        (r = t.memoizedState),
        e === null ||
          (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
      ) {
        if (B && ke !== null && t.mode & 1 && !(t.flags & 128))
          (sa(), ln(), (t.flags |= 98560), (o = !1));
        else if (((o = wr(t)), r !== null && r.dehydrated !== null)) {
          if (e === null) {
            if (!o) throw Error(w(318));
            if (
              ((o = t.memoizedState),
              (o = o !== null ? o.dehydrated : null),
              !o)
            )
              throw Error(w(317));
            o[Be] = t;
          } else
            (ln(),
              !(t.flags & 128) && (t.memoizedState = null),
              (t.flags |= 4));
          (ie(t), (o = !1));
        } else (Me !== null && (Wo(Me), (Me = null)), (o = !0));
        if (!o) return t.flags & 65536 ? t : null;
      }
      return t.flags & 128
        ? ((t.lanes = n), t)
        : ((r = r !== null),
          r !== (e !== null && e.memoizedState !== null) &&
            r &&
            ((t.child.flags |= 8192),
            t.mode & 1 &&
              (e === null || H.current & 1 ? q === 0 && (q = 3) : Ou())),
          t.updateQueue !== null && (t.flags |= 4),
          ie(t),
          null);
    case 4:
      return (
        un(),
        Io(e, t),
        e === null && Qn(t.stateNode.containerInfo),
        ie(t),
        null
      );
    case 10:
      return (vu(t.type._context), ie(t), null);
    case 17:
      return (ge(t.type) && Kr(), ie(t), null);
    case 19:
      if ((V(H), (o = t.memoizedState), o === null)) return (ie(t), null);
      if (((r = (t.flags & 128) !== 0), (u = o.rendering), u === null))
        if (r) wn(o, !1);
        else {
          if (q !== 0 || (e !== null && e.flags & 128))
            for (e = t.child; e !== null; ) {
              if (((u = br(e)), u !== null)) {
                for (
                  t.flags |= 128,
                    wn(o, !1),
                    r = u.updateQueue,
                    r !== null && ((t.updateQueue = r), (t.flags |= 4)),
                    t.subtreeFlags = 0,
                    r = n,
                    n = t.child;
                  n !== null;

                )
                  ((o = n),
                    (e = r),
                    (o.flags &= 14680066),
                    (u = o.alternate),
                    u === null
                      ? ((o.childLanes = 0),
                        (o.lanes = e),
                        (o.child = null),
                        (o.subtreeFlags = 0),
                        (o.memoizedProps = null),
                        (o.memoizedState = null),
                        (o.updateQueue = null),
                        (o.dependencies = null),
                        (o.stateNode = null))
                      : ((o.childLanes = u.childLanes),
                        (o.lanes = u.lanes),
                        (o.child = u.child),
                        (o.subtreeFlags = 0),
                        (o.deletions = null),
                        (o.memoizedProps = u.memoizedProps),
                        (o.memoizedState = u.memoizedState),
                        (o.updateQueue = u.updateQueue),
                        (o.type = u.type),
                        (e = u.dependencies),
                        (o.dependencies =
                          e === null
                            ? null
                            : {
                                lanes: e.lanes,
                                firstContext: e.firstContext,
                              })),
                    (n = n.sibling));
                return (F(H, (H.current & 1) | 2), t.child);
              }
              e = e.sibling;
            }
          o.tail !== null &&
            G() > an &&
            ((t.flags |= 128), (r = !0), wn(o, !1), (t.lanes = 4194304));
        }
      else {
        if (!r)
          if (((e = br(u)), e !== null)) {
            if (
              ((t.flags |= 128),
              (r = !0),
              (n = e.updateQueue),
              n !== null && ((t.updateQueue = n), (t.flags |= 4)),
              wn(o, !0),
              o.tail === null && o.tailMode === "hidden" && !u.alternate && !B)
            )
              return (ie(t), null);
          } else
            2 * G() - o.renderingStartTime > an &&
              n !== 1073741824 &&
              ((t.flags |= 128), (r = !0), wn(o, !1), (t.lanes = 4194304));
        o.isBackwards
          ? ((u.sibling = t.child), (t.child = u))
          : ((n = o.last),
            n !== null ? (n.sibling = u) : (t.child = u),
            (o.last = u));
      }
      return o.tail !== null
        ? ((t = o.tail),
          (o.rendering = t),
          (o.tail = t.sibling),
          (o.renderingStartTime = G()),
          (t.sibling = null),
          (n = H.current),
          F(H, r ? (n & 1) | 2 : n & 1),
          t)
        : (ie(t), null);
    case 22:
    case 23:
      return (
        Ru(),
        (r = t.memoizedState !== null),
        e !== null && (e.memoizedState !== null) !== r && (t.flags |= 8192),
        r && t.mode & 1
          ? Se & 1073741824 && (ie(t), t.subtreeFlags & 6 && (t.flags |= 8192))
          : ie(t),
        null
      );
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(w(156, t.tag));
}
function hd(e, t) {
  switch ((du(t), t.tag)) {
    case 1:
      return (
        ge(t.type) && Kr(),
        (e = t.flags),
        e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
      );
    case 3:
      return (
        un(),
        V(ye),
        V(ae),
        ku(),
        (e = t.flags),
        e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null
      );
    case 5:
      return (Su(t), null);
    case 13:
      if ((V(H), (e = t.memoizedState), e !== null && e.dehydrated !== null)) {
        if (t.alternate === null) throw Error(w(340));
        ln();
      }
      return (
        (e = t.flags),
        e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
      );
    case 19:
      return (V(H), null);
    case 4:
      return (un(), null);
    case 10:
      return (vu(t.type._context), null);
    case 22:
    case 23:
      return (Ru(), null);
    case 24:
      return null;
    default:
      return null;
  }
}
var xr = !1,
  se = !1,
  vd = typeof WeakSet == "function" ? WeakSet : Set,
  _ = null;
function Xt(e, t) {
  var n = e.ref;
  if (n !== null)
    if (typeof n == "function")
      try {
        n(null);
      } catch (r) {
        Y(e, t, r);
      }
    else n.current = null;
}
function Fo(e, t, n) {
  try {
    n();
  } catch (r) {
    Y(e, t, r);
  }
}
var Fi = !1;
function yd(e, t) {
  if (((So = Br), (e = Gs()), cu(e))) {
    if ("selectionStart" in e)
      var n = { start: e.selectionStart, end: e.selectionEnd };
    else
      e: {
        n = ((n = e.ownerDocument) && n.defaultView) || window;
        var r = n.getSelection && n.getSelection();
        if (r && r.rangeCount !== 0) {
          n = r.anchorNode;
          var l = r.anchorOffset,
            o = r.focusNode;
          r = r.focusOffset;
          try {
            (n.nodeType, o.nodeType);
          } catch {
            n = null;
            break e;
          }
          var u = 0,
            i = -1,
            s = -1,
            c = 0,
            h = 0,
            m = e,
            p = null;
          t: for (;;) {
            for (
              var y;
              m !== n || (l !== 0 && m.nodeType !== 3) || (i = u + l),
                m !== o || (r !== 0 && m.nodeType !== 3) || (s = u + r),
                m.nodeType === 3 && (u += m.nodeValue.length),
                (y = m.firstChild) !== null;

            )
              ((p = m), (m = y));
            for (;;) {
              if (m === e) break t;
              if (
                (p === n && ++c === l && (i = u),
                p === o && ++h === r && (s = u),
                (y = m.nextSibling) !== null)
              )
                break;
              ((m = p), (p = m.parentNode));
            }
            m = y;
          }
          n = i === -1 || s === -1 ? null : { start: i, end: s };
        } else n = null;
      }
    n = n || { start: 0, end: 0 };
  } else n = null;
  for (ko = { focusedElem: e, selectionRange: n }, Br = !1, _ = t; _ !== null; )
    if (((t = _), (e = t.child), (t.subtreeFlags & 1028) !== 0 && e !== null))
      ((e.return = t), (_ = e));
    else
      for (; _ !== null; ) {
        t = _;
        try {
          var g = t.alternate;
          if (t.flags & 1024)
            switch (t.tag) {
              case 0:
              case 11:
              case 15:
                break;
              case 1:
                if (g !== null) {
                  var k = g.memoizedProps,
                    j = g.memoizedState,
                    f = t.stateNode,
                    a = f.getSnapshotBeforeUpdate(
                      t.elementType === t.type ? k : Oe(t.type, k),
                      j,
                    );
                  f.__reactInternalSnapshotBeforeUpdate = a;
                }
                break;
              case 3:
                var d = t.stateNode.containerInfo;
                d.nodeType === 1
                  ? (d.textContent = "")
                  : d.nodeType === 9 &&
                    d.documentElement &&
                    d.removeChild(d.documentElement);
                break;
              case 5:
              case 6:
              case 4:
              case 17:
                break;
              default:
                throw Error(w(163));
            }
        } catch (v) {
          Y(t, t.return, v);
        }
        if (((e = t.sibling), e !== null)) {
          ((e.return = t.return), (_ = e));
          break;
        }
        _ = t.return;
      }
  return ((g = Fi), (Fi = !1), g);
}
function On(e, t, n) {
  var r = t.updateQueue;
  if (((r = r !== null ? r.lastEffect : null), r !== null)) {
    var l = (r = r.next);
    do {
      if ((l.tag & e) === e) {
        var o = l.destroy;
        ((l.destroy = void 0), o !== void 0 && Fo(t, n, o));
      }
      l = l.next;
    } while (l !== r);
  }
}
function vl(e, t) {
  if (
    ((t = t.updateQueue), (t = t !== null ? t.lastEffect : null), t !== null)
  ) {
    var n = (t = t.next);
    do {
      if ((n.tag & e) === e) {
        var r = n.create;
        n.destroy = r();
      }
      n = n.next;
    } while (n !== t);
  }
}
function $o(e) {
  var t = e.ref;
  if (t !== null) {
    var n = e.stateNode;
    switch (e.tag) {
      case 5:
        e = n;
        break;
      default:
        e = n;
    }
    typeof t == "function" ? t(e) : (t.current = e);
  }
}
function Qa(e) {
  var t = e.alternate;
  (t !== null && ((e.alternate = null), Qa(t)),
    (e.child = null),
    (e.deletions = null),
    (e.sibling = null),
    e.tag === 5 &&
      ((t = e.stateNode),
      t !== null &&
        (delete t[Be], delete t[Yn], delete t[Co], delete t[bf], delete t[ed])),
    (e.stateNode = null),
    (e.return = null),
    (e.dependencies = null),
    (e.memoizedProps = null),
    (e.memoizedState = null),
    (e.pendingProps = null),
    (e.stateNode = null),
    (e.updateQueue = null));
}
function Ka(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function $i(e) {
  e: for (;;) {
    for (; e.sibling === null; ) {
      if (e.return === null || Ka(e.return)) return null;
      e = e.return;
    }
    for (
      e.sibling.return = e.return, e = e.sibling;
      e.tag !== 5 && e.tag !== 6 && e.tag !== 18;

    ) {
      if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
      ((e.child.return = e), (e = e.child));
    }
    if (!(e.flags & 2)) return e.stateNode;
  }
}
function Uo(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6)
    ((e = e.stateNode),
      t
        ? n.nodeType === 8
          ? n.parentNode.insertBefore(e, t)
          : n.insertBefore(e, t)
        : (n.nodeType === 8
            ? ((t = n.parentNode), t.insertBefore(e, n))
            : ((t = n), t.appendChild(e)),
          (n = n._reactRootContainer),
          n != null || t.onclick !== null || (t.onclick = Qr)));
  else if (r !== 4 && ((e = e.child), e !== null))
    for (Uo(e, t, n), e = e.sibling; e !== null; )
      (Uo(e, t, n), (e = e.sibling));
}
function Ao(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6)
    ((e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e));
  else if (r !== 4 && ((e = e.child), e !== null))
    for (Ao(e, t, n), e = e.sibling; e !== null; )
      (Ao(e, t, n), (e = e.sibling));
}
var re = null,
  De = !1;
function tt(e, t, n) {
  for (n = n.child; n !== null; ) (Ya(e, t, n), (n = n.sibling));
}
function Ya(e, t, n) {
  if (He && typeof He.onCommitFiberUnmount == "function")
    try {
      He.onCommitFiberUnmount(sl, n);
    } catch {}
  switch (n.tag) {
    case 5:
      se || Xt(n, t);
    case 6:
      var r = re,
        l = De;
      ((re = null),
        tt(e, t, n),
        (re = r),
        (De = l),
        re !== null &&
          (De
            ? ((e = re),
              (n = n.stateNode),
              e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n))
            : re.removeChild(n.stateNode)));
      break;
    case 18:
      re !== null &&
        (De
          ? ((e = re),
            (n = n.stateNode),
            e.nodeType === 8
              ? Bl(e.parentNode, n)
              : e.nodeType === 1 && Bl(e, n),
            Bn(e))
          : Bl(re, n.stateNode));
      break;
    case 4:
      ((r = re),
        (l = De),
        (re = n.stateNode.containerInfo),
        (De = !0),
        tt(e, t, n),
        (re = r),
        (De = l));
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (
        !se &&
        ((r = n.updateQueue), r !== null && ((r = r.lastEffect), r !== null))
      ) {
        l = r = r.next;
        do {
          var o = l,
            u = o.destroy;
          ((o = o.tag),
            u !== void 0 && (o & 2 || o & 4) && Fo(n, t, u),
            (l = l.next));
        } while (l !== r);
      }
      tt(e, t, n);
      break;
    case 1:
      if (
        !se &&
        (Xt(n, t),
        (r = n.stateNode),
        typeof r.componentWillUnmount == "function")
      )
        try {
          ((r.props = n.memoizedProps),
            (r.state = n.memoizedState),
            r.componentWillUnmount());
        } catch (i) {
          Y(n, t, i);
        }
      tt(e, t, n);
      break;
    case 21:
      tt(e, t, n);
      break;
    case 22:
      n.mode & 1
        ? ((se = (r = se) || n.memoizedState !== null), tt(e, t, n), (se = r))
        : tt(e, t, n);
      break;
    default:
      tt(e, t, n);
  }
}
function Ui(e) {
  var t = e.updateQueue;
  if (t !== null) {
    e.updateQueue = null;
    var n = e.stateNode;
    (n === null && (n = e.stateNode = new vd()),
      t.forEach(function (r) {
        var l = Nd.bind(null, e, r);
        n.has(r) || (n.add(r), r.then(l, l));
      }));
  }
}
function Re(e, t) {
  var n = t.deletions;
  if (n !== null)
    for (var r = 0; r < n.length; r++) {
      var l = n[r];
      try {
        var o = e,
          u = t,
          i = u;
        e: for (; i !== null; ) {
          switch (i.tag) {
            case 5:
              ((re = i.stateNode), (De = !1));
              break e;
            case 3:
              ((re = i.stateNode.containerInfo), (De = !0));
              break e;
            case 4:
              ((re = i.stateNode.containerInfo), (De = !0));
              break e;
          }
          i = i.return;
        }
        if (re === null) throw Error(w(160));
        (Ya(o, u, l), (re = null), (De = !1));
        var s = l.alternate;
        (s !== null && (s.return = null), (l.return = null));
      } catch (c) {
        Y(l, t, c);
      }
    }
  if (t.subtreeFlags & 12854)
    for (t = t.child; t !== null; ) (Xa(t, e), (t = t.sibling));
}
function Xa(e, t) {
  var n = e.alternate,
    r = e.flags;
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      if ((Re(t, e), Ae(e), r & 4)) {
        try {
          (On(3, e, e.return), vl(3, e));
        } catch (k) {
          Y(e, e.return, k);
        }
        try {
          On(5, e, e.return);
        } catch (k) {
          Y(e, e.return, k);
        }
      }
      break;
    case 1:
      (Re(t, e), Ae(e), r & 512 && n !== null && Xt(n, n.return));
      break;
    case 5:
      if (
        (Re(t, e),
        Ae(e),
        r & 512 && n !== null && Xt(n, n.return),
        e.flags & 32)
      ) {
        var l = e.stateNode;
        try {
          $n(l, "");
        } catch (k) {
          Y(e, e.return, k);
        }
      }
      if (r & 4 && ((l = e.stateNode), l != null)) {
        var o = e.memoizedProps,
          u = n !== null ? n.memoizedProps : o,
          i = e.type,
          s = e.updateQueue;
        if (((e.updateQueue = null), s !== null))
          try {
            (i === "input" && o.type === "radio" && o.name != null && vs(l, o),
              ao(i, u));
            var c = ao(i, o);
            for (u = 0; u < s.length; u += 2) {
              var h = s[u],
                m = s[u + 1];
              h === "style"
                ? ks(l, m)
                : h === "dangerouslySetInnerHTML"
                  ? ws(l, m)
                  : h === "children"
                    ? $n(l, m)
                    : Zo(l, h, m, c);
            }
            switch (i) {
              case "input":
                lo(l, o);
                break;
              case "textarea":
                ys(l, o);
                break;
              case "select":
                var p = l._wrapperState.wasMultiple;
                l._wrapperState.wasMultiple = !!o.multiple;
                var y = o.value;
                y != null
                  ? Jt(l, !!o.multiple, y, !1)
                  : p !== !!o.multiple &&
                    (o.defaultValue != null
                      ? Jt(l, !!o.multiple, o.defaultValue, !0)
                      : Jt(l, !!o.multiple, o.multiple ? [] : "", !1));
            }
            l[Yn] = o;
          } catch (k) {
            Y(e, e.return, k);
          }
      }
      break;
    case 6:
      if ((Re(t, e), Ae(e), r & 4)) {
        if (e.stateNode === null) throw Error(w(162));
        ((l = e.stateNode), (o = e.memoizedProps));
        try {
          l.nodeValue = o;
        } catch (k) {
          Y(e, e.return, k);
        }
      }
      break;
    case 3:
      if (
        (Re(t, e), Ae(e), r & 4 && n !== null && n.memoizedState.isDehydrated)
      )
        try {
          Bn(t.containerInfo);
        } catch (k) {
          Y(e, e.return, k);
        }
      break;
    case 4:
      (Re(t, e), Ae(e));
      break;
    case 13:
      (Re(t, e),
        Ae(e),
        (l = e.child),
        l.flags & 8192 &&
          ((o = l.memoizedState !== null),
          (l.stateNode.isHidden = o),
          !o ||
            (l.alternate !== null && l.alternate.memoizedState !== null) ||
            (ju = G())),
        r & 4 && Ui(e));
      break;
    case 22:
      if (
        ((h = n !== null && n.memoizedState !== null),
        e.mode & 1 ? ((se = (c = se) || h), Re(t, e), (se = c)) : Re(t, e),
        Ae(e),
        r & 8192)
      ) {
        if (
          ((c = e.memoizedState !== null),
          (e.stateNode.isHidden = c) && !h && e.mode & 1)
        )
          for (_ = e, h = e.child; h !== null; ) {
            for (m = _ = h; _ !== null; ) {
              switch (((p = _), (y = p.child), p.tag)) {
                case 0:
                case 11:
                case 14:
                case 15:
                  On(4, p, p.return);
                  break;
                case 1:
                  Xt(p, p.return);
                  var g = p.stateNode;
                  if (typeof g.componentWillUnmount == "function") {
                    ((r = p), (n = p.return));
                    try {
                      ((t = r),
                        (g.props = t.memoizedProps),
                        (g.state = t.memoizedState),
                        g.componentWillUnmount());
                    } catch (k) {
                      Y(r, n, k);
                    }
                  }
                  break;
                case 5:
                  Xt(p, p.return);
                  break;
                case 22:
                  if (p.memoizedState !== null) {
                    Vi(m);
                    continue;
                  }
              }
              y !== null ? ((y.return = p), (_ = y)) : Vi(m);
            }
            h = h.sibling;
          }
        e: for (h = null, m = e; ; ) {
          if (m.tag === 5) {
            if (h === null) {
              h = m;
              try {
                ((l = m.stateNode),
                  c
                    ? ((o = l.style),
                      typeof o.setProperty == "function"
                        ? o.setProperty("display", "none", "important")
                        : (o.display = "none"))
                    : ((i = m.stateNode),
                      (s = m.memoizedProps.style),
                      (u =
                        s != null && s.hasOwnProperty("display")
                          ? s.display
                          : null),
                      (i.style.display = Ss("display", u))));
              } catch (k) {
                Y(e, e.return, k);
              }
            }
          } else if (m.tag === 6) {
            if (h === null)
              try {
                m.stateNode.nodeValue = c ? "" : m.memoizedProps;
              } catch (k) {
                Y(e, e.return, k);
              }
          } else if (
            ((m.tag !== 22 && m.tag !== 23) ||
              m.memoizedState === null ||
              m === e) &&
            m.child !== null
          ) {
            ((m.child.return = m), (m = m.child));
            continue;
          }
          if (m === e) break e;
          for (; m.sibling === null; ) {
            if (m.return === null || m.return === e) break e;
            (h === m && (h = null), (m = m.return));
          }
          (h === m && (h = null),
            (m.sibling.return = m.return),
            (m = m.sibling));
        }
      }
      break;
    case 19:
      (Re(t, e), Ae(e), r & 4 && Ui(e));
      break;
    case 21:
      break;
    default:
      (Re(t, e), Ae(e));
  }
}
function Ae(e) {
  var t = e.flags;
  if (t & 2) {
    try {
      e: {
        for (var n = e.return; n !== null; ) {
          if (Ka(n)) {
            var r = n;
            break e;
          }
          n = n.return;
        }
        throw Error(w(160));
      }
      switch (r.tag) {
        case 5:
          var l = r.stateNode;
          r.flags & 32 && ($n(l, ""), (r.flags &= -33));
          var o = $i(e);
          Ao(e, o, l);
          break;
        case 3:
        case 4:
          var u = r.stateNode.containerInfo,
            i = $i(e);
          Uo(e, i, u);
          break;
        default:
          throw Error(w(161));
      }
    } catch (s) {
      Y(e, e.return, s);
    }
    e.flags &= -3;
  }
  t & 4096 && (e.flags &= -4097);
}
function gd(e, t, n) {
  ((_ = e), Ga(e));
}
function Ga(e, t, n) {
  for (var r = (e.mode & 1) !== 0; _ !== null; ) {
    var l = _,
      o = l.child;
    if (l.tag === 22 && r) {
      var u = l.memoizedState !== null || xr;
      if (!u) {
        var i = l.alternate,
          s = (i !== null && i.memoizedState !== null) || se;
        i = xr;
        var c = se;
        if (((xr = u), (se = s) && !c))
          for (_ = l; _ !== null; )
            ((u = _),
              (s = u.child),
              u.tag === 22 && u.memoizedState !== null
                ? Bi(l)
                : s !== null
                  ? ((s.return = u), (_ = s))
                  : Bi(l));
        for (; o !== null; ) ((_ = o), Ga(o), (o = o.sibling));
        ((_ = l), (xr = i), (se = c));
      }
      Ai(e);
    } else
      l.subtreeFlags & 8772 && o !== null ? ((o.return = l), (_ = o)) : Ai(e);
  }
}
function Ai(e) {
  for (; _ !== null; ) {
    var t = _;
    if (t.flags & 8772) {
      var n = t.alternate;
      try {
        if (t.flags & 8772)
          switch (t.tag) {
            case 0:
            case 11:
            case 15:
              se || vl(5, t);
              break;
            case 1:
              var r = t.stateNode;
              if (t.flags & 4 && !se)
                if (n === null) r.componentDidMount();
                else {
                  var l =
                    t.elementType === t.type
                      ? n.memoizedProps
                      : Oe(t.type, n.memoizedProps);
                  r.componentDidUpdate(
                    l,
                    n.memoizedState,
                    r.__reactInternalSnapshotBeforeUpdate,
                  );
                }
              var o = t.updateQueue;
              o !== null && Ci(t, o, r);
              break;
            case 3:
              var u = t.updateQueue;
              if (u !== null) {
                if (((n = null), t.child !== null))
                  switch (t.child.tag) {
                    case 5:
                      n = t.child.stateNode;
                      break;
                    case 1:
                      n = t.child.stateNode;
                  }
                Ci(t, u, n);
              }
              break;
            case 5:
              var i = t.stateNode;
              if (n === null && t.flags & 4) {
                n = i;
                var s = t.memoizedProps;
                switch (t.type) {
                  case "button":
                  case "input":
                  case "select":
                  case "textarea":
                    s.autoFocus && n.focus();
                    break;
                  case "img":
                    s.src && (n.src = s.src);
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
              if (t.memoizedState === null) {
                var c = t.alternate;
                if (c !== null) {
                  var h = c.memoizedState;
                  if (h !== null) {
                    var m = h.dehydrated;
                    m !== null && Bn(m);
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
              throw Error(w(163));
          }
        se || (t.flags & 512 && $o(t));
      } catch (p) {
        Y(t, t.return, p);
      }
    }
    if (t === e) {
      _ = null;
      break;
    }
    if (((n = t.sibling), n !== null)) {
      ((n.return = t.return), (_ = n));
      break;
    }
    _ = t.return;
  }
}
function Vi(e) {
  for (; _ !== null; ) {
    var t = _;
    if (t === e) {
      _ = null;
      break;
    }
    var n = t.sibling;
    if (n !== null) {
      ((n.return = t.return), (_ = n));
      break;
    }
    _ = t.return;
  }
}
function Bi(e) {
  for (; _ !== null; ) {
    var t = _;
    try {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          var n = t.return;
          try {
            vl(4, t);
          } catch (s) {
            Y(t, n, s);
          }
          break;
        case 1:
          var r = t.stateNode;
          if (typeof r.componentDidMount == "function") {
            var l = t.return;
            try {
              r.componentDidMount();
            } catch (s) {
              Y(t, l, s);
            }
          }
          var o = t.return;
          try {
            $o(t);
          } catch (s) {
            Y(t, o, s);
          }
          break;
        case 5:
          var u = t.return;
          try {
            $o(t);
          } catch (s) {
            Y(t, u, s);
          }
      }
    } catch (s) {
      Y(t, t.return, s);
    }
    if (t === e) {
      _ = null;
      break;
    }
    var i = t.sibling;
    if (i !== null) {
      ((i.return = t.return), (_ = i));
      break;
    }
    _ = t.return;
  }
}
var wd = Math.ceil,
  nl = et.ReactCurrentDispatcher,
  Tu = et.ReactCurrentOwner,
  ze = et.ReactCurrentBatchConfig,
  M = 0,
  ne = null,
  J = null,
  le = 0,
  Se = 0,
  Gt = wt(0),
  q = 0,
  bn = null,
  Ot = 0,
  yl = 0,
  zu = 0,
  Dn = null,
  me = null,
  ju = 0,
  an = 1 / 0,
  Qe = null,
  rl = !1,
  Vo = null,
  pt = null,
  Er = !1,
  it = null,
  ll = 0,
  Mn = 0,
  Bo = null,
  Dr = -1,
  Mr = 0;
function fe() {
  return M & 6 ? G() : Dr !== -1 ? Dr : (Dr = G());
}
function mt(e) {
  return e.mode & 1
    ? M & 2 && le !== 0
      ? le & -le
      : nd.transition !== null
        ? (Mr === 0 && (Mr = Os()), Mr)
        : ((e = I),
          e !== 0 || ((e = window.event), (e = e === void 0 ? 16 : As(e.type))),
          e)
    : 1;
}
function Fe(e, t, n, r) {
  if (50 < Mn) throw ((Mn = 0), (Bo = null), Error(w(185)));
  (tr(e, n, r),
    (!(M & 2) || e !== ne) &&
      (e === ne && (!(M & 2) && (yl |= n), q === 4 && ot(e, le)),
      we(e, r),
      n === 1 && M === 0 && !(t.mode & 1) && ((an = G() + 500), pl && St())));
}
function we(e, t) {
  var n = e.callbackNode;
  tf(e, t);
  var r = Vr(e, e === ne ? le : 0);
  if (r === 0)
    (n !== null && Zu(n), (e.callbackNode = null), (e.callbackPriority = 0));
  else if (((t = r & -r), e.callbackPriority !== t)) {
    if ((n != null && Zu(n), t === 1))
      (e.tag === 0 ? td(Hi.bind(null, e)) : oa(Hi.bind(null, e)),
        Zf(function () {
          !(M & 6) && St();
        }),
        (n = null));
    else {
      switch (Ds(r)) {
        case 1:
          n = nu;
          break;
        case 4:
          n = Ls;
          break;
        case 16:
          n = Ar;
          break;
        case 536870912:
          n = Rs;
          break;
        default:
          n = Ar;
      }
      n = rc(n, Ja.bind(null, e));
    }
    ((e.callbackPriority = t), (e.callbackNode = n));
  }
}
function Ja(e, t) {
  if (((Dr = -1), (Mr = 0), M & 6)) throw Error(w(327));
  var n = e.callbackNode;
  if (tn() && e.callbackNode !== n) return null;
  var r = Vr(e, e === ne ? le : 0);
  if (r === 0) return null;
  if (r & 30 || r & e.expiredLanes || t) t = ol(e, r);
  else {
    t = r;
    var l = M;
    M |= 2;
    var o = qa();
    (ne !== e || le !== t) && ((Qe = null), (an = G() + 500), Tt(e, t));
    do
      try {
        xd();
        break;
      } catch (i) {
        Za(e, i);
      }
    while (!0);
    (hu(),
      (nl.current = o),
      (M = l),
      J !== null ? (t = 0) : ((ne = null), (le = 0), (t = q)));
  }
  if (t !== 0) {
    if (
      (t === 2 && ((l = ho(e)), l !== 0 && ((r = l), (t = Ho(e, l)))), t === 1)
    )
      throw ((n = bn), Tt(e, 0), ot(e, r), we(e, G()), n);
    if (t === 6) ot(e, r);
    else {
      if (
        ((l = e.current.alternate),
        !(r & 30) &&
          !Sd(l) &&
          ((t = ol(e, r)),
          t === 2 && ((o = ho(e)), o !== 0 && ((r = o), (t = Ho(e, o)))),
          t === 1))
      )
        throw ((n = bn), Tt(e, 0), ot(e, r), we(e, G()), n);
      switch (((e.finishedWork = l), (e.finishedLanes = r), t)) {
        case 0:
        case 1:
          throw Error(w(345));
        case 2:
          Ct(e, me, Qe);
          break;
        case 3:
          if (
            (ot(e, r), (r & 130023424) === r && ((t = ju + 500 - G()), 10 < t))
          ) {
            if (Vr(e, 0) !== 0) break;
            if (((l = e.suspendedLanes), (l & r) !== r)) {
              (fe(), (e.pingedLanes |= e.suspendedLanes & l));
              break;
            }
            e.timeoutHandle = Eo(Ct.bind(null, e, me, Qe), t);
            break;
          }
          Ct(e, me, Qe);
          break;
        case 4:
          if ((ot(e, r), (r & 4194240) === r)) break;
          for (t = e.eventTimes, l = -1; 0 < r; ) {
            var u = 31 - Ie(r);
            ((o = 1 << u), (u = t[u]), u > l && (l = u), (r &= ~o));
          }
          if (
            ((r = l),
            (r = G() - r),
            (r =
              (120 > r
                ? 120
                : 480 > r
                  ? 480
                  : 1080 > r
                    ? 1080
                    : 1920 > r
                      ? 1920
                      : 3e3 > r
                        ? 3e3
                        : 4320 > r
                          ? 4320
                          : 1960 * wd(r / 1960)) - r),
            10 < r)
          ) {
            e.timeoutHandle = Eo(Ct.bind(null, e, me, Qe), r);
            break;
          }
          Ct(e, me, Qe);
          break;
        case 5:
          Ct(e, me, Qe);
          break;
        default:
          throw Error(w(329));
      }
    }
  }
  return (we(e, G()), e.callbackNode === n ? Ja.bind(null, e) : null);
}
function Ho(e, t) {
  var n = Dn;
  return (
    e.current.memoizedState.isDehydrated && (Tt(e, t).flags |= 256),
    (e = ol(e, t)),
    e !== 2 && ((t = me), (me = n), t !== null && Wo(t)),
    e
  );
}
function Wo(e) {
  me === null ? (me = e) : me.push.apply(me, e);
}
function Sd(e) {
  for (var t = e; ; ) {
    if (t.flags & 16384) {
      var n = t.updateQueue;
      if (n !== null && ((n = n.stores), n !== null))
        for (var r = 0; r < n.length; r++) {
          var l = n[r],
            o = l.getSnapshot;
          l = l.value;
          try {
            if (!$e(o(), l)) return !1;
          } catch {
            return !1;
          }
        }
    }
    if (((n = t.child), t.subtreeFlags & 16384 && n !== null))
      ((n.return = t), (t = n));
    else {
      if (t === e) break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return !0;
        t = t.return;
      }
      ((t.sibling.return = t.return), (t = t.sibling));
    }
  }
  return !0;
}
function ot(e, t) {
  for (
    t &= ~zu,
      t &= ~yl,
      e.suspendedLanes |= t,
      e.pingedLanes &= ~t,
      e = e.expirationTimes;
    0 < t;

  ) {
    var n = 31 - Ie(t),
      r = 1 << n;
    ((e[n] = -1), (t &= ~r));
  }
}
function Hi(e) {
  if (M & 6) throw Error(w(327));
  tn();
  var t = Vr(e, 0);
  if (!(t & 1)) return (we(e, G()), null);
  var n = ol(e, t);
  if (e.tag !== 0 && n === 2) {
    var r = ho(e);
    r !== 0 && ((t = r), (n = Ho(e, r)));
  }
  if (n === 1) throw ((n = bn), Tt(e, 0), ot(e, t), we(e, G()), n);
  if (n === 6) throw Error(w(345));
  return (
    (e.finishedWork = e.current.alternate),
    (e.finishedLanes = t),
    Ct(e, me, Qe),
    we(e, G()),
    null
  );
}
function Lu(e, t) {
  var n = M;
  M |= 1;
  try {
    return e(t);
  } finally {
    ((M = n), M === 0 && ((an = G() + 500), pl && St()));
  }
}
function Dt(e) {
  it !== null && it.tag === 0 && !(M & 6) && tn();
  var t = M;
  M |= 1;
  var n = ze.transition,
    r = I;
  try {
    if (((ze.transition = null), (I = 1), e)) return e();
  } finally {
    ((I = r), (ze.transition = n), (M = t), !(M & 6) && St());
  }
}
function Ru() {
  ((Se = Gt.current), V(Gt));
}
function Tt(e, t) {
  ((e.finishedWork = null), (e.finishedLanes = 0));
  var n = e.timeoutHandle;
  if ((n !== -1 && ((e.timeoutHandle = -1), Jf(n)), J !== null))
    for (n = J.return; n !== null; ) {
      var r = n;
      switch ((du(r), r.tag)) {
        case 1:
          ((r = r.type.childContextTypes), r != null && Kr());
          break;
        case 3:
          (un(), V(ye), V(ae), ku());
          break;
        case 5:
          Su(r);
          break;
        case 4:
          un();
          break;
        case 13:
          V(H);
          break;
        case 19:
          V(H);
          break;
        case 10:
          vu(r.type._context);
          break;
        case 22:
        case 23:
          Ru();
      }
      n = n.return;
    }
  if (
    ((ne = e),
    (J = e = ht(e.current, null)),
    (le = Se = t),
    (q = 0),
    (bn = null),
    (zu = yl = Ot = 0),
    (me = Dn = null),
    Nt !== null)
  ) {
    for (t = 0; t < Nt.length; t++)
      if (((n = Nt[t]), (r = n.interleaved), r !== null)) {
        n.interleaved = null;
        var l = r.next,
          o = n.pending;
        if (o !== null) {
          var u = o.next;
          ((o.next = l), (r.next = u));
        }
        n.pending = r;
      }
    Nt = null;
  }
  return e;
}
function Za(e, t) {
  do {
    var n = J;
    try {
      if ((hu(), (Lr.current = tl), el)) {
        for (var r = W.memoizedState; r !== null; ) {
          var l = r.queue;
          (l !== null && (l.pending = null), (r = r.next));
        }
        el = !1;
      }
      if (
        ((Rt = 0),
        (te = Z = W = null),
        (Rn = !1),
        (Jn = 0),
        (Tu.current = null),
        n === null || n.return === null)
      ) {
        ((q = 1), (bn = t), (J = null));
        break;
      }
      e: {
        var o = e,
          u = n.return,
          i = n,
          s = t;
        if (
          ((t = le),
          (i.flags |= 32768),
          s !== null && typeof s == "object" && typeof s.then == "function")
        ) {
          var c = s,
            h = i,
            m = h.tag;
          if (!(h.mode & 1) && (m === 0 || m === 11 || m === 15)) {
            var p = h.alternate;
            p
              ? ((h.updateQueue = p.updateQueue),
                (h.memoizedState = p.memoizedState),
                (h.lanes = p.lanes))
              : ((h.updateQueue = null), (h.memoizedState = null));
          }
          var y = ji(u);
          if (y !== null) {
            ((y.flags &= -257),
              Li(y, u, i, o, t),
              y.mode & 1 && zi(o, c, t),
              (t = y),
              (s = c));
            var g = t.updateQueue;
            if (g === null) {
              var k = new Set();
              (k.add(s), (t.updateQueue = k));
            } else g.add(s);
            break e;
          } else {
            if (!(t & 1)) {
              (zi(o, c, t), Ou());
              break e;
            }
            s = Error(w(426));
          }
        } else if (B && i.mode & 1) {
          var j = ji(u);
          if (j !== null) {
            (!(j.flags & 65536) && (j.flags |= 256),
              Li(j, u, i, o, t),
              pu(sn(s, i)));
            break e;
          }
        }
        ((o = s = sn(s, i)),
          q !== 4 && (q = 2),
          Dn === null ? (Dn = [o]) : Dn.push(o),
          (o = u));
        do {
          switch (o.tag) {
            case 3:
              ((o.flags |= 65536), (t &= -t), (o.lanes |= t));
              var f = Da(o, s, t);
              Ei(o, f);
              break e;
            case 1:
              i = s;
              var a = o.type,
                d = o.stateNode;
              if (
                !(o.flags & 128) &&
                (typeof a.getDerivedStateFromError == "function" ||
                  (d !== null &&
                    typeof d.componentDidCatch == "function" &&
                    (pt === null || !pt.has(d))))
              ) {
                ((o.flags |= 65536), (t &= -t), (o.lanes |= t));
                var v = Ma(o, i, t);
                Ei(o, v);
                break e;
              }
          }
          o = o.return;
        } while (o !== null);
      }
      ec(n);
    } catch (E) {
      ((t = E), J === n && n !== null && (J = n = n.return));
      continue;
    }
    break;
  } while (!0);
}
function qa() {
  var e = nl.current;
  return ((nl.current = tl), e === null ? tl : e);
}
function Ou() {
  ((q === 0 || q === 3 || q === 2) && (q = 4),
    ne === null || (!(Ot & 268435455) && !(yl & 268435455)) || ot(ne, le));
}
function ol(e, t) {
  var n = M;
  M |= 2;
  var r = qa();
  (ne !== e || le !== t) && ((Qe = null), Tt(e, t));
  do
    try {
      kd();
      break;
    } catch (l) {
      Za(e, l);
    }
  while (!0);
  if ((hu(), (M = n), (nl.current = r), J !== null)) throw Error(w(261));
  return ((ne = null), (le = 0), q);
}
function kd() {
  for (; J !== null; ) ba(J);
}
function xd() {
  for (; J !== null && !Kc(); ) ba(J);
}
function ba(e) {
  var t = nc(e.alternate, e, Se);
  ((e.memoizedProps = e.pendingProps),
    t === null ? ec(e) : (J = t),
    (Tu.current = null));
}
function ec(e) {
  var t = e;
  do {
    var n = t.alternate;
    if (((e = t.return), t.flags & 32768)) {
      if (((n = hd(n, t)), n !== null)) {
        ((n.flags &= 32767), (J = n));
        return;
      }
      if (e !== null)
        ((e.flags |= 32768), (e.subtreeFlags = 0), (e.deletions = null));
      else {
        ((q = 6), (J = null));
        return;
      }
    } else if (((n = md(n, t, Se)), n !== null)) {
      J = n;
      return;
    }
    if (((t = t.sibling), t !== null)) {
      J = t;
      return;
    }
    J = t = e;
  } while (t !== null);
  q === 0 && (q = 5);
}
function Ct(e, t, n) {
  var r = I,
    l = ze.transition;
  try {
    ((ze.transition = null), (I = 1), Ed(e, t, n, r));
  } finally {
    ((ze.transition = l), (I = r));
  }
  return null;
}
function Ed(e, t, n, r) {
  do tn();
  while (it !== null);
  if (M & 6) throw Error(w(327));
  n = e.finishedWork;
  var l = e.finishedLanes;
  if (n === null) return null;
  if (((e.finishedWork = null), (e.finishedLanes = 0), n === e.current))
    throw Error(w(177));
  ((e.callbackNode = null), (e.callbackPriority = 0));
  var o = n.lanes | n.childLanes;
  if (
    (nf(e, o),
    e === ne && ((J = ne = null), (le = 0)),
    (!(n.subtreeFlags & 2064) && !(n.flags & 2064)) ||
      Er ||
      ((Er = !0),
      rc(Ar, function () {
        return (tn(), null);
      })),
    (o = (n.flags & 15990) !== 0),
    n.subtreeFlags & 15990 || o)
  ) {
    ((o = ze.transition), (ze.transition = null));
    var u = I;
    I = 1;
    var i = M;
    ((M |= 4),
      (Tu.current = null),
      yd(e, n),
      Xa(n, e),
      Hf(ko),
      (Br = !!So),
      (ko = So = null),
      (e.current = n),
      gd(n),
      Yc(),
      (M = i),
      (I = u),
      (ze.transition = o));
  } else e.current = n;
  if (
    (Er && ((Er = !1), (it = e), (ll = l)),
    (o = e.pendingLanes),
    o === 0 && (pt = null),
    Jc(n.stateNode),
    we(e, G()),
    t !== null)
  )
    for (r = e.onRecoverableError, n = 0; n < t.length; n++)
      ((l = t[n]), r(l.value, { componentStack: l.stack, digest: l.digest }));
  if (rl) throw ((rl = !1), (e = Vo), (Vo = null), e);
  return (
    ll & 1 && e.tag !== 0 && tn(),
    (o = e.pendingLanes),
    o & 1 ? (e === Bo ? Mn++ : ((Mn = 0), (Bo = e))) : (Mn = 0),
    St(),
    null
  );
}
function tn() {
  if (it !== null) {
    var e = Ds(ll),
      t = ze.transition,
      n = I;
    try {
      if (((ze.transition = null), (I = 16 > e ? 16 : e), it === null))
        var r = !1;
      else {
        if (((e = it), (it = null), (ll = 0), M & 6)) throw Error(w(331));
        var l = M;
        for (M |= 4, _ = e.current; _ !== null; ) {
          var o = _,
            u = o.child;
          if (_.flags & 16) {
            var i = o.deletions;
            if (i !== null) {
              for (var s = 0; s < i.length; s++) {
                var c = i[s];
                for (_ = c; _ !== null; ) {
                  var h = _;
                  switch (h.tag) {
                    case 0:
                    case 11:
                    case 15:
                      On(8, h, o);
                  }
                  var m = h.child;
                  if (m !== null) ((m.return = h), (_ = m));
                  else
                    for (; _ !== null; ) {
                      h = _;
                      var p = h.sibling,
                        y = h.return;
                      if ((Qa(h), h === c)) {
                        _ = null;
                        break;
                      }
                      if (p !== null) {
                        ((p.return = y), (_ = p));
                        break;
                      }
                      _ = y;
                    }
                }
              }
              var g = o.alternate;
              if (g !== null) {
                var k = g.child;
                if (k !== null) {
                  g.child = null;
                  do {
                    var j = k.sibling;
                    ((k.sibling = null), (k = j));
                  } while (k !== null);
                }
              }
              _ = o;
            }
          }
          if (o.subtreeFlags & 2064 && u !== null) ((u.return = o), (_ = u));
          else
            e: for (; _ !== null; ) {
              if (((o = _), o.flags & 2048))
                switch (o.tag) {
                  case 0:
                  case 11:
                  case 15:
                    On(9, o, o.return);
                }
              var f = o.sibling;
              if (f !== null) {
                ((f.return = o.return), (_ = f));
                break e;
              }
              _ = o.return;
            }
        }
        var a = e.current;
        for (_ = a; _ !== null; ) {
          u = _;
          var d = u.child;
          if (u.subtreeFlags & 2064 && d !== null) ((d.return = u), (_ = d));
          else
            e: for (u = a; _ !== null; ) {
              if (((i = _), i.flags & 2048))
                try {
                  switch (i.tag) {
                    case 0:
                    case 11:
                    case 15:
                      vl(9, i);
                  }
                } catch (E) {
                  Y(i, i.return, E);
                }
              if (i === u) {
                _ = null;
                break e;
              }
              var v = i.sibling;
              if (v !== null) {
                ((v.return = i.return), (_ = v));
                break e;
              }
              _ = i.return;
            }
        }
        if (
          ((M = l), St(), He && typeof He.onPostCommitFiberRoot == "function")
        )
          try {
            He.onPostCommitFiberRoot(sl, e);
          } catch {}
        r = !0;
      }
      return r;
    } finally {
      ((I = n), (ze.transition = t));
    }
  }
  return !1;
}
function Wi(e, t, n) {
  ((t = sn(n, t)),
    (t = Da(e, t, 1)),
    (e = dt(e, t, 1)),
    (t = fe()),
    e !== null && (tr(e, 1, t), we(e, t)));
}
function Y(e, t, n) {
  if (e.tag === 3) Wi(e, e, n);
  else
    for (; t !== null; ) {
      if (t.tag === 3) {
        Wi(t, e, n);
        break;
      } else if (t.tag === 1) {
        var r = t.stateNode;
        if (
          typeof t.type.getDerivedStateFromError == "function" ||
          (typeof r.componentDidCatch == "function" &&
            (pt === null || !pt.has(r)))
        ) {
          ((e = sn(n, e)),
            (e = Ma(t, e, 1)),
            (t = dt(t, e, 1)),
            (e = fe()),
            t !== null && (tr(t, 1, e), we(t, e)));
          break;
        }
      }
      t = t.return;
    }
}
function Cd(e, t, n) {
  var r = e.pingCache;
  (r !== null && r.delete(t),
    (t = fe()),
    (e.pingedLanes |= e.suspendedLanes & n),
    ne === e &&
      (le & n) === n &&
      (q === 4 || (q === 3 && (le & 130023424) === le && 500 > G() - ju)
        ? Tt(e, 0)
        : (zu |= n)),
    we(e, t));
}
function tc(e, t) {
  t === 0 &&
    (e.mode & 1
      ? ((t = pr), (pr <<= 1), !(pr & 130023424) && (pr = 4194304))
      : (t = 1));
  var n = fe();
  ((e = qe(e, t)), e !== null && (tr(e, t, n), we(e, n)));
}
function _d(e) {
  var t = e.memoizedState,
    n = 0;
  (t !== null && (n = t.retryLane), tc(e, n));
}
function Nd(e, t) {
  var n = 0;
  switch (e.tag) {
    case 13:
      var r = e.stateNode,
        l = e.memoizedState;
      l !== null && (n = l.retryLane);
      break;
    case 19:
      r = e.stateNode;
      break;
    default:
      throw Error(w(314));
  }
  (r !== null && r.delete(t), tc(e, n));
}
var nc;
nc = function (e, t, n) {
  if (e !== null)
    if (e.memoizedProps !== t.pendingProps || ye.current) ve = !0;
    else {
      if (!(e.lanes & n) && !(t.flags & 128)) return ((ve = !1), pd(e, t, n));
      ve = !!(e.flags & 131072);
    }
  else ((ve = !1), B && t.flags & 1048576 && ua(t, Gr, t.index));
  switch (((t.lanes = 0), t.tag)) {
    case 2:
      var r = t.type;
      (Or(e, t), (e = t.pendingProps));
      var l = rn(t, ae.current);
      (en(t, n), (l = Eu(null, t, r, e, l, n)));
      var o = Cu();
      return (
        (t.flags |= 1),
        typeof l == "object" &&
        l !== null &&
        typeof l.render == "function" &&
        l.$$typeof === void 0
          ? ((t.tag = 1),
            (t.memoizedState = null),
            (t.updateQueue = null),
            ge(r) ? ((o = !0), Yr(t)) : (o = !1),
            (t.memoizedState =
              l.state !== null && l.state !== void 0 ? l.state : null),
            gu(t),
            (l.updater = hl),
            (t.stateNode = l),
            (l._reactInternals = t),
            jo(t, r, e, n),
            (t = Oo(null, t, r, !0, o, n)))
          : ((t.tag = 0), B && o && fu(t), ce(null, t, l, n), (t = t.child)),
        t
      );
    case 16:
      r = t.elementType;
      e: {
        switch (
          (Or(e, t),
          (e = t.pendingProps),
          (l = r._init),
          (r = l(r._payload)),
          (t.type = r),
          (l = t.tag = Td(r)),
          (e = Oe(r, e)),
          l)
        ) {
          case 0:
            t = Ro(null, t, r, e, n);
            break e;
          case 1:
            t = Di(null, t, r, e, n);
            break e;
          case 11:
            t = Ri(null, t, r, e, n);
            break e;
          case 14:
            t = Oi(null, t, r, Oe(r.type, e), n);
            break e;
        }
        throw Error(w(306, r, ""));
      }
      return t;
    case 0:
      return (
        (r = t.type),
        (l = t.pendingProps),
        (l = t.elementType === r ? l : Oe(r, l)),
        Ro(e, t, r, l, n)
      );
    case 1:
      return (
        (r = t.type),
        (l = t.pendingProps),
        (l = t.elementType === r ? l : Oe(r, l)),
        Di(e, t, r, l, n)
      );
    case 3:
      e: {
        if ((Ua(t), e === null)) throw Error(w(387));
        ((r = t.pendingProps),
          (o = t.memoizedState),
          (l = o.element),
          da(e, t),
          qr(t, r, null, n));
        var u = t.memoizedState;
        if (((r = u.element), o.isDehydrated))
          if (
            ((o = {
              element: r,
              isDehydrated: !1,
              cache: u.cache,
              pendingSuspenseBoundaries: u.pendingSuspenseBoundaries,
              transitions: u.transitions,
            }),
            (t.updateQueue.baseState = o),
            (t.memoizedState = o),
            t.flags & 256)
          ) {
            ((l = sn(Error(w(423)), t)), (t = Mi(e, t, r, n, l)));
            break e;
          } else if (r !== l) {
            ((l = sn(Error(w(424)), t)), (t = Mi(e, t, r, n, l)));
            break e;
          } else
            for (
              ke = ft(t.stateNode.containerInfo.firstChild),
                xe = t,
                B = !0,
                Me = null,
                n = ca(t, null, r, n),
                t.child = n;
              n;

            )
              ((n.flags = (n.flags & -3) | 4096), (n = n.sibling));
        else {
          if ((ln(), r === l)) {
            t = be(e, t, n);
            break e;
          }
          ce(e, t, r, n);
        }
        t = t.child;
      }
      return t;
    case 5:
      return (
        pa(t),
        e === null && Po(t),
        (r = t.type),
        (l = t.pendingProps),
        (o = e !== null ? e.memoizedProps : null),
        (u = l.children),
        xo(r, l) ? (u = null) : o !== null && xo(r, o) && (t.flags |= 32),
        $a(e, t),
        ce(e, t, u, n),
        t.child
      );
    case 6:
      return (e === null && Po(t), null);
    case 13:
      return Aa(e, t, n);
    case 4:
      return (
        wu(t, t.stateNode.containerInfo),
        (r = t.pendingProps),
        e === null ? (t.child = on(t, null, r, n)) : ce(e, t, r, n),
        t.child
      );
    case 11:
      return (
        (r = t.type),
        (l = t.pendingProps),
        (l = t.elementType === r ? l : Oe(r, l)),
        Ri(e, t, r, l, n)
      );
    case 7:
      return (ce(e, t, t.pendingProps, n), t.child);
    case 8:
      return (ce(e, t, t.pendingProps.children, n), t.child);
    case 12:
      return (ce(e, t, t.pendingProps.children, n), t.child);
    case 10:
      e: {
        if (
          ((r = t.type._context),
          (l = t.pendingProps),
          (o = t.memoizedProps),
          (u = l.value),
          F(Jr, r._currentValue),
          (r._currentValue = u),
          o !== null)
        )
          if ($e(o.value, u)) {
            if (o.children === l.children && !ye.current) {
              t = be(e, t, n);
              break e;
            }
          } else
            for (o = t.child, o !== null && (o.return = t); o !== null; ) {
              var i = o.dependencies;
              if (i !== null) {
                u = o.child;
                for (var s = i.firstContext; s !== null; ) {
                  if (s.context === r) {
                    if (o.tag === 1) {
                      ((s = Ge(-1, n & -n)), (s.tag = 2));
                      var c = o.updateQueue;
                      if (c !== null) {
                        c = c.shared;
                        var h = c.pending;
                        (h === null
                          ? (s.next = s)
                          : ((s.next = h.next), (h.next = s)),
                          (c.pending = s));
                      }
                    }
                    ((o.lanes |= n),
                      (s = o.alternate),
                      s !== null && (s.lanes |= n),
                      To(o.return, n, t),
                      (i.lanes |= n));
                    break;
                  }
                  s = s.next;
                }
              } else if (o.tag === 10) u = o.type === t.type ? null : o.child;
              else if (o.tag === 18) {
                if (((u = o.return), u === null)) throw Error(w(341));
                ((u.lanes |= n),
                  (i = u.alternate),
                  i !== null && (i.lanes |= n),
                  To(u, n, t),
                  (u = o.sibling));
              } else u = o.child;
              if (u !== null) u.return = o;
              else
                for (u = o; u !== null; ) {
                  if (u === t) {
                    u = null;
                    break;
                  }
                  if (((o = u.sibling), o !== null)) {
                    ((o.return = u.return), (u = o));
                    break;
                  }
                  u = u.return;
                }
              o = u;
            }
        (ce(e, t, l.children, n), (t = t.child));
      }
      return t;
    case 9:
      return (
        (l = t.type),
        (r = t.pendingProps.children),
        en(t, n),
        (l = je(l)),
        (r = r(l)),
        (t.flags |= 1),
        ce(e, t, r, n),
        t.child
      );
    case 14:
      return (
        (r = t.type),
        (l = Oe(r, t.pendingProps)),
        (l = Oe(r.type, l)),
        Oi(e, t, r, l, n)
      );
    case 15:
      return Ia(e, t, t.type, t.pendingProps, n);
    case 17:
      return (
        (r = t.type),
        (l = t.pendingProps),
        (l = t.elementType === r ? l : Oe(r, l)),
        Or(e, t),
        (t.tag = 1),
        ge(r) ? ((e = !0), Yr(t)) : (e = !1),
        en(t, n),
        Oa(t, r, l),
        jo(t, r, l, n),
        Oo(null, t, r, !0, e, n)
      );
    case 19:
      return Va(e, t, n);
    case 22:
      return Fa(e, t, n);
  }
  throw Error(w(156, t.tag));
};
function rc(e, t) {
  return js(e, t);
}
function Pd(e, t, n, r) {
  ((this.tag = e),
    (this.key = n),
    (this.sibling =
      this.child =
      this.return =
      this.stateNode =
      this.type =
      this.elementType =
        null),
    (this.index = 0),
    (this.ref = null),
    (this.pendingProps = t),
    (this.dependencies =
      this.memoizedState =
      this.updateQueue =
      this.memoizedProps =
        null),
    (this.mode = r),
    (this.subtreeFlags = this.flags = 0),
    (this.deletions = null),
    (this.childLanes = this.lanes = 0),
    (this.alternate = null));
}
function Te(e, t, n, r) {
  return new Pd(e, t, n, r);
}
function Du(e) {
  return ((e = e.prototype), !(!e || !e.isReactComponent));
}
function Td(e) {
  if (typeof e == "function") return Du(e) ? 1 : 0;
  if (e != null) {
    if (((e = e.$$typeof), e === bo)) return 11;
    if (e === eu) return 14;
  }
  return 2;
}
function ht(e, t) {
  var n = e.alternate;
  return (
    n === null
      ? ((n = Te(e.tag, t, e.key, e.mode)),
        (n.elementType = e.elementType),
        (n.type = e.type),
        (n.stateNode = e.stateNode),
        (n.alternate = e),
        (e.alternate = n))
      : ((n.pendingProps = t),
        (n.type = e.type),
        (n.flags = 0),
        (n.subtreeFlags = 0),
        (n.deletions = null)),
    (n.flags = e.flags & 14680064),
    (n.childLanes = e.childLanes),
    (n.lanes = e.lanes),
    (n.child = e.child),
    (n.memoizedProps = e.memoizedProps),
    (n.memoizedState = e.memoizedState),
    (n.updateQueue = e.updateQueue),
    (t = e.dependencies),
    (n.dependencies =
      t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }),
    (n.sibling = e.sibling),
    (n.index = e.index),
    (n.ref = e.ref),
    n
  );
}
function Ir(e, t, n, r, l, o) {
  var u = 2;
  if (((r = e), typeof e == "function")) Du(e) && (u = 1);
  else if (typeof e == "string") u = 5;
  else
    e: switch (e) {
      case Ut:
        return zt(n.children, l, o, t);
      case qo:
        ((u = 8), (l |= 8));
        break;
      case bl:
        return (
          (e = Te(12, n, t, l | 2)),
          (e.elementType = bl),
          (e.lanes = o),
          e
        );
      case eo:
        return ((e = Te(13, n, t, l)), (e.elementType = eo), (e.lanes = o), e);
      case to:
        return ((e = Te(19, n, t, l)), (e.elementType = to), (e.lanes = o), e);
      case ps:
        return gl(n, l, o, t);
      default:
        if (typeof e == "object" && e !== null)
          switch (e.$$typeof) {
            case fs:
              u = 10;
              break e;
            case ds:
              u = 9;
              break e;
            case bo:
              u = 11;
              break e;
            case eu:
              u = 14;
              break e;
            case nt:
              ((u = 16), (r = null));
              break e;
          }
        throw Error(w(130, e == null ? e : typeof e, ""));
    }
  return (
    (t = Te(u, n, t, l)),
    (t.elementType = e),
    (t.type = r),
    (t.lanes = o),
    t
  );
}
function zt(e, t, n, r) {
  return ((e = Te(7, e, r, t)), (e.lanes = n), e);
}
function gl(e, t, n, r) {
  return (
    (e = Te(22, e, r, t)),
    (e.elementType = ps),
    (e.lanes = n),
    (e.stateNode = { isHidden: !1 }),
    e
  );
}
function Jl(e, t, n) {
  return ((e = Te(6, e, null, t)), (e.lanes = n), e);
}
function Zl(e, t, n) {
  return (
    (t = Te(4, e.children !== null ? e.children : [], e.key, t)),
    (t.lanes = n),
    (t.stateNode = {
      containerInfo: e.containerInfo,
      pendingChildren: null,
      implementation: e.implementation,
    }),
    t
  );
}
function zd(e, t, n, r, l) {
  ((this.tag = t),
    (this.containerInfo = e),
    (this.finishedWork =
      this.pingCache =
      this.current =
      this.pendingChildren =
        null),
    (this.timeoutHandle = -1),
    (this.callbackNode = this.pendingContext = this.context = null),
    (this.callbackPriority = 0),
    (this.eventTimes = Ll(0)),
    (this.expirationTimes = Ll(-1)),
    (this.entangledLanes =
      this.finishedLanes =
      this.mutableReadLanes =
      this.expiredLanes =
      this.pingedLanes =
      this.suspendedLanes =
      this.pendingLanes =
        0),
    (this.entanglements = Ll(0)),
    (this.identifierPrefix = r),
    (this.onRecoverableError = l),
    (this.mutableSourceEagerHydrationData = null));
}
function Mu(e, t, n, r, l, o, u, i, s) {
  return (
    (e = new zd(e, t, n, i, s)),
    t === 1 ? ((t = 1), o === !0 && (t |= 8)) : (t = 0),
    (o = Te(3, null, null, t)),
    (e.current = o),
    (o.stateNode = e),
    (o.memoizedState = {
      element: r,
      isDehydrated: n,
      cache: null,
      transitions: null,
      pendingSuspenseBoundaries: null,
    }),
    gu(o),
    e
  );
}
function jd(e, t, n) {
  var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
  return {
    $$typeof: $t,
    key: r == null ? null : "" + r,
    children: e,
    containerInfo: t,
    implementation: n,
  };
}
function lc(e) {
  if (!e) return yt;
  e = e._reactInternals;
  e: {
    if (It(e) !== e || e.tag !== 1) throw Error(w(170));
    var t = e;
    do {
      switch (t.tag) {
        case 3:
          t = t.stateNode.context;
          break e;
        case 1:
          if (ge(t.type)) {
            t = t.stateNode.__reactInternalMemoizedMergedChildContext;
            break e;
          }
      }
      t = t.return;
    } while (t !== null);
    throw Error(w(171));
  }
  if (e.tag === 1) {
    var n = e.type;
    if (ge(n)) return la(e, n, t);
  }
  return t;
}
function oc(e, t, n, r, l, o, u, i, s) {
  return (
    (e = Mu(n, r, !0, e, l, o, u, i, s)),
    (e.context = lc(null)),
    (n = e.current),
    (r = fe()),
    (l = mt(n)),
    (o = Ge(r, l)),
    (o.callback = t ?? null),
    dt(n, o, l),
    (e.current.lanes = l),
    tr(e, l, r),
    we(e, r),
    e
  );
}
function wl(e, t, n, r) {
  var l = t.current,
    o = fe(),
    u = mt(l);
  return (
    (n = lc(n)),
    t.context === null ? (t.context = n) : (t.pendingContext = n),
    (t = Ge(o, u)),
    (t.payload = { element: e }),
    (r = r === void 0 ? null : r),
    r !== null && (t.callback = r),
    (e = dt(l, t, u)),
    e !== null && (Fe(e, l, u, o), jr(e, l, u)),
    u
  );
}
function ul(e) {
  if (((e = e.current), !e.child)) return null;
  switch (e.child.tag) {
    case 5:
      return e.child.stateNode;
    default:
      return e.child.stateNode;
  }
}
function Qi(e, t) {
  if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
    var n = e.retryLane;
    e.retryLane = n !== 0 && n < t ? n : t;
  }
}
function Iu(e, t) {
  (Qi(e, t), (e = e.alternate) && Qi(e, t));
}
function Ld() {
  return null;
}
var uc =
  typeof reportError == "function"
    ? reportError
    : function (e) {
        console.error(e);
      };
function Fu(e) {
  this._internalRoot = e;
}
Sl.prototype.render = Fu.prototype.render = function (e) {
  var t = this._internalRoot;
  if (t === null) throw Error(w(409));
  wl(e, t, null, null);
};
Sl.prototype.unmount = Fu.prototype.unmount = function () {
  var e = this._internalRoot;
  if (e !== null) {
    this._internalRoot = null;
    var t = e.containerInfo;
    (Dt(function () {
      wl(null, e, null, null);
    }),
      (t[Ze] = null));
  }
};
function Sl(e) {
  this._internalRoot = e;
}
Sl.prototype.unstable_scheduleHydration = function (e) {
  if (e) {
    var t = Fs();
    e = { blockedOn: null, target: e, priority: t };
    for (var n = 0; n < lt.length && t !== 0 && t < lt[n].priority; n++);
    (lt.splice(n, 0, e), n === 0 && Us(e));
  }
};
function $u(e) {
  return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
}
function kl(e) {
  return !(
    !e ||
    (e.nodeType !== 1 &&
      e.nodeType !== 9 &&
      e.nodeType !== 11 &&
      (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "))
  );
}
function Ki() {}
function Rd(e, t, n, r, l) {
  if (l) {
    if (typeof r == "function") {
      var o = r;
      r = function () {
        var c = ul(u);
        o.call(c);
      };
    }
    var u = oc(t, r, e, 0, null, !1, !1, "", Ki);
    return (
      (e._reactRootContainer = u),
      (e[Ze] = u.current),
      Qn(e.nodeType === 8 ? e.parentNode : e),
      Dt(),
      u
    );
  }
  for (; (l = e.lastChild); ) e.removeChild(l);
  if (typeof r == "function") {
    var i = r;
    r = function () {
      var c = ul(s);
      i.call(c);
    };
  }
  var s = Mu(e, 0, !1, null, null, !1, !1, "", Ki);
  return (
    (e._reactRootContainer = s),
    (e[Ze] = s.current),
    Qn(e.nodeType === 8 ? e.parentNode : e),
    Dt(function () {
      wl(t, s, n, r);
    }),
    s
  );
}
function xl(e, t, n, r, l) {
  var o = n._reactRootContainer;
  if (o) {
    var u = o;
    if (typeof l == "function") {
      var i = l;
      l = function () {
        var s = ul(u);
        i.call(s);
      };
    }
    wl(t, u, e, l);
  } else u = Rd(n, t, e, l, r);
  return ul(u);
}
Ms = function (e) {
  switch (e.tag) {
    case 3:
      var t = e.stateNode;
      if (t.current.memoizedState.isDehydrated) {
        var n = Cn(t.pendingLanes);
        n !== 0 &&
          (ru(t, n | 1), we(t, G()), !(M & 6) && ((an = G() + 500), St()));
      }
      break;
    case 13:
      (Dt(function () {
        var r = qe(e, 1);
        if (r !== null) {
          var l = fe();
          Fe(r, e, 1, l);
        }
      }),
        Iu(e, 1));
  }
};
lu = function (e) {
  if (e.tag === 13) {
    var t = qe(e, 134217728);
    if (t !== null) {
      var n = fe();
      Fe(t, e, 134217728, n);
    }
    Iu(e, 134217728);
  }
};
Is = function (e) {
  if (e.tag === 13) {
    var t = mt(e),
      n = qe(e, t);
    if (n !== null) {
      var r = fe();
      Fe(n, e, t, r);
    }
    Iu(e, t);
  }
};
Fs = function () {
  return I;
};
$s = function (e, t) {
  var n = I;
  try {
    return ((I = e), t());
  } finally {
    I = n;
  }
};
fo = function (e, t, n) {
  switch (t) {
    case "input":
      if ((lo(e, n), (t = n.name), n.type === "radio" && t != null)) {
        for (n = e; n.parentNode; ) n = n.parentNode;
        for (
          n = n.querySelectorAll(
            "input[name=" + JSON.stringify("" + t) + '][type="radio"]',
          ),
            t = 0;
          t < n.length;
          t++
        ) {
          var r = n[t];
          if (r !== e && r.form === e.form) {
            var l = dl(r);
            if (!l) throw Error(w(90));
            (hs(r), lo(r, l));
          }
        }
      }
      break;
    case "textarea":
      ys(e, n);
      break;
    case "select":
      ((t = n.value), t != null && Jt(e, !!n.multiple, t, !1));
  }
};
Cs = Lu;
_s = Dt;
var Od = { usingClientEntryPoint: !1, Events: [rr, Ht, dl, xs, Es, Lu] },
  Sn = {
    findFiberByHostInstance: _t,
    bundleType: 0,
    version: "18.3.1",
    rendererPackageName: "react-dom",
  },
  Dd = {
    bundleType: Sn.bundleType,
    version: Sn.version,
    rendererPackageName: Sn.rendererPackageName,
    rendererConfig: Sn.rendererConfig,
    overrideHookState: null,
    overrideHookStateDeletePath: null,
    overrideHookStateRenamePath: null,
    overrideProps: null,
    overridePropsDeletePath: null,
    overridePropsRenamePath: null,
    setErrorHandler: null,
    setSuspenseHandler: null,
    scheduleUpdate: null,
    currentDispatcherRef: et.ReactCurrentDispatcher,
    findHostInstanceByFiber: function (e) {
      return ((e = Ts(e)), e === null ? null : e.stateNode);
    },
    findFiberByHostInstance: Sn.findFiberByHostInstance || Ld,
    findHostInstancesForRefresh: null,
    scheduleRefresh: null,
    scheduleRoot: null,
    setRefreshHandler: null,
    getCurrentFiber: null,
    reconcilerVersion: "18.3.1-next-f1338f8080-20240426",
  };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
  var Cr = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!Cr.isDisabled && Cr.supportsFiber)
    try {
      ((sl = Cr.inject(Dd)), (He = Cr));
    } catch {}
}
Ce.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Od;
Ce.createPortal = function (e, t) {
  var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
  if (!$u(t)) throw Error(w(200));
  return jd(e, t, null, n);
};
Ce.createRoot = function (e, t) {
  if (!$u(e)) throw Error(w(299));
  var n = !1,
    r = "",
    l = uc;
  return (
    t != null &&
      (t.unstable_strictMode === !0 && (n = !0),
      t.identifierPrefix !== void 0 && (r = t.identifierPrefix),
      t.onRecoverableError !== void 0 && (l = t.onRecoverableError)),
    (t = Mu(e, 1, !1, null, null, n, !1, r, l)),
    (e[Ze] = t.current),
    Qn(e.nodeType === 8 ? e.parentNode : e),
    new Fu(t)
  );
};
Ce.findDOMNode = function (e) {
  if (e == null) return null;
  if (e.nodeType === 1) return e;
  var t = e._reactInternals;
  if (t === void 0)
    throw typeof e.render == "function"
      ? Error(w(188))
      : ((e = Object.keys(e).join(",")), Error(w(268, e)));
  return ((e = Ts(t)), (e = e === null ? null : e.stateNode), e);
};
Ce.flushSync = function (e) {
  return Dt(e);
};
Ce.hydrate = function (e, t, n) {
  if (!kl(t)) throw Error(w(200));
  return xl(null, e, t, !0, n);
};
Ce.hydrateRoot = function (e, t, n) {
  if (!$u(e)) throw Error(w(405));
  var r = (n != null && n.hydratedSources) || null,
    l = !1,
    o = "",
    u = uc;
  if (
    (n != null &&
      (n.unstable_strictMode === !0 && (l = !0),
      n.identifierPrefix !== void 0 && (o = n.identifierPrefix),
      n.onRecoverableError !== void 0 && (u = n.onRecoverableError)),
    (t = oc(t, null, e, 1, n ?? null, l, !1, o, u)),
    (e[Ze] = t.current),
    Qn(e),
    r)
  )
    for (e = 0; e < r.length; e++)
      ((n = r[e]),
        (l = n._getVersion),
        (l = l(n._source)),
        t.mutableSourceEagerHydrationData == null
          ? (t.mutableSourceEagerHydrationData = [n, l])
          : t.mutableSourceEagerHydrationData.push(n, l));
  return new Sl(t);
};
Ce.render = function (e, t, n) {
  if (!kl(t)) throw Error(w(200));
  return xl(null, e, t, !1, n);
};
Ce.unmountComponentAtNode = function (e) {
  if (!kl(e)) throw Error(w(40));
  return e._reactRootContainer
    ? (Dt(function () {
        xl(null, null, e, !1, function () {
          ((e._reactRootContainer = null), (e[Ze] = null));
        });
      }),
      !0)
    : !1;
};
Ce.unstable_batchedUpdates = Lu;
Ce.unstable_renderSubtreeIntoContainer = function (e, t, n, r) {
  if (!kl(n)) throw Error(w(200));
  if (e == null || e._reactInternals === void 0) throw Error(w(38));
  return xl(e, t, n, !1, r);
};
Ce.version = "18.3.1-next-f1338f8080-20240426";
function ic() {
  if (
    !(
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" ||
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"
    )
  )
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(ic);
    } catch (e) {
      console.error(e);
    }
}
(ic(), (is.exports = Ce));
var Md = is.exports,
  sc,
  Yi = Md;
((sc = Yi.createRoot), Yi.hydrateRoot);
const Xi = ["todo", "doing", "done"],
  Id = { todo: "未着手", doing: "進行中", done: "完了" };
function Fd({
  tasks: e,
  onAdd: t,
  onEdit: n,
  onDelete: r,
  onAttempt: l,
  onMove: o,
}) {
  const u = O.useMemo(() => {
    const i = { todo: [], doing: [], done: [] };
    for (const s of e) i[s.status].push(s);
    for (const s of Xi) i[s].sort((c, h) => c.order - h.order);
    return i;
  }, [e]);
  return S.jsx("main", {
    className: "board",
    id: "board",
    children: Xi.map((i) =>
      S.jsx(
        $d,
        {
          status: i,
          label: Id[i],
          tasks: u[i],
          onAdd: () => t(i),
          onEdit: n,
          onDelete: r,
          onAttempt: l,
          onMove: (s, c) => o(s, i, c),
        },
        i,
      ),
    ),
  });
}
function $d({
  status: e,
  label: t,
  tasks: n,
  onAdd: r,
  onEdit: l,
  onDelete: o,
  onAttempt: u,
  onMove: i,
}) {
  const s = O.useRef(null),
    [c, h] = O.useState(!1),
    [m, p] = O.useState(null),
    y = (g) => {
      const k = s.current;
      if (!k) return n.length;
      const j = Array.from(k.querySelectorAll(".card")),
        f = g.clientY;
      let a = j.length;
      for (let d = 0; d < j.length; d++) {
        const v = j[d].getBoundingClientRect();
        if (f < v.top + v.height / 2) {
          a = d;
          break;
        }
      }
      return a;
    };
  return S.jsxs("section", {
    className: "column",
    "data-status": e,
    children: [
      S.jsxs("header", {
        children: [
          S.jsx("h2", { children: t }),
          S.jsx("button", {
            className: "add",
            onClick: r,
            children: "＋ 追加",
          }),
        ],
      }),
      S.jsx("div", {
        className: "cards" + (c ? " drag-over" : ""),
        id: `col-${e}`,
        ref: s,
        onDragOver: (g) => {
          (g.preventDefault(), h(!0));
        },
        onDragLeave: () => h(!1),
        onDrop: (g) => {
          (g.preventDefault(), h(!1));
          const k = g.dataTransfer.getData("text/plain");
          if (!k) return;
          const j = y(g);
          (i(k, j), p(null));
        },
        children: n.map((g) =>
          S.jsx(
            Ud,
            {
              task: g,
              dragging: m === g.id,
              onDragStart: (k) => p(k),
              onDragEnd: () => p(null),
              onEdit: () => l(g),
              onDelete: () => o(g),
              onAttempt: () => u(g),
            },
            g.id,
          ),
        ),
      }),
    ],
  });
}
function Ud({
  task: e,
  dragging: t,
  onDragStart: n,
  onDragEnd: r,
  onEdit: l,
  onDelete: o,
  onAttempt: u,
}) {
  return S.jsxs("div", {
    className: "card" + (t ? " dragging" : ""),
    draggable: !0,
    "data-id": e.id,
    onDragStart: (i) => {
      (n(e.id),
        i.dataTransfer.setData("text/plain", e.id),
        (i.dataTransfer.effectAllowed = "move"));
    },
    onDragEnd: () => r(),
    children: [
      S.jsx("div", { className: "title", children: e.title }),
      !!e.description &&
        S.jsx("div", { className: "desc", children: e.description }),
      S.jsxs("div", {
        className: "toolbar",
        children: [
          S.jsx("button", { onClick: l, children: "編集" }),
          S.jsx("button", { onClick: o, children: "削除" }),
          S.jsx("button", { onClick: u, children: "試行" }),
        ],
      }),
    ],
  });
}
function El({ open: e, title: t, onClose: n, children: r, width: l = 960 }) {
  return e
    ? S.jsx("div", {
        className: "modal",
        children: S.jsxs("div", {
          className: "modal__dialog",
          style: { width: `min(${l}px, 96vw)` },
          children: [
            S.jsxs("div", {
              className: "modal__header",
              children: [
                S.jsx("h3", { style: { margin: 0 }, children: t }),
                S.jsx("button", {
                  className: "ghost",
                  onClick: n,
                  children: "閉じる",
                }),
              ],
            }),
            S.jsx("div", { className: "modal__body", children: r }),
          ],
        }),
      })
    : null;
}
const Ad = { todo: "未着手", doing: "進行中", done: "完了" };
function Vd({ open: e, status: t, onClose: n, onCreate: r }) {
  const [l, o] = O.useState(""),
    [u, i] = O.useState("");
  return (
    O.useEffect(() => {
      e && (o(""), i(""));
    }, [e]),
    S.jsx(El, {
      open: e,
      title: "タスクを追加",
      onClose: n,
      children: S.jsxs("div", {
        className: "form",
        children: [
          S.jsxs("div", {
            style: { fontSize: 12, color: "#b3c7e6", marginBottom: 8 },
            children: [
              "ステータス: ",
              S.jsx("span", { children: t ? Ad[t] : "-" }),
            ],
          }),
          S.jsxs("label", {
            children: [
              "タイトル ",
              S.jsx("span", { style: { color: "#ff6b6b" }, children: "*" }),
              S.jsx("input", {
                autoFocus: !0,
                value: l,
                onChange: (s) => o(s.target.value),
                type: "text",
                placeholder: "タスクのタイトルを入力",
              }),
            ],
          }),
          S.jsxs("label", {
            children: [
              "説明（任意）",
              S.jsx("textarea", {
                rows: 3,
                value: u,
                onChange: (s) => i(s.target.value),
                placeholder: "タスクの詳細説明を入力",
              }),
            ],
          }),
          S.jsxs("div", {
            className: "row",
            children: [
              S.jsx("button", {
                onClick: () => {
                  if (!l.trim()) {
                    alert("タイトルを入力してください");
                    return;
                  }
                  r(l.trim(), u.trim());
                },
                children: "追加",
              }),
              S.jsx("button", {
                className: "ghost",
                onClick: n,
                children: "キャンセル",
              }),
            ],
          }),
        ],
      }),
    })
  );
}
const he = async (e) => {
    const t = await e.json();
    if (!e.ok || t.success === !1) throw new Error(t.message || e.statusText);
    return t.data ?? t;
  },
  kn = {
    listTasks: async () => he(await fetch("/api/tasks")),
    createTask: async (e, t, n) =>
      he(
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: e, description: t, status: n }),
        }),
      ),
    updateTask: async (e, t) =>
      he(
        await fetch(`/api/tasks/${encodeURIComponent(e)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(t),
        }),
      ),
    deleteTask: async (e) => {
      await fetch(`/api/tasks/${encodeURIComponent(e)}`, { method: "DELETE" });
    },
    moveTask: async (e, t, n) =>
      he(
        await fetch(`/api/tasks/${encodeURIComponent(e)}/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to_status: t, to_index: n }),
        }),
      ),
  },
  Nn = {
    listProfiles: async () => he(await fetch("/api/profiles")),
    start: async (e) =>
      he(
        await fetch("/api/executions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(e),
        }),
      ),
    kill: async (e) => fetch(`/api/executions/${e}/kill`, { method: "POST" }),
    list: async () => he(await fetch("/api/executions")),
  },
  In = {
    create: async (e) =>
      he(
        await fetch("/api/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(e),
        }),
      ),
    list: async (e) =>
      he(await fetch(`/api/attempts?task_id=${encodeURIComponent(e)}`)),
    pr: async (e, t) =>
      he(
        await fetch(`/api/attempts/${encodeURIComponent(e)}/pr`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(t),
        }),
      ),
    status: async (e) =>
      he(await fetch(`/api/attempts/${encodeURIComponent(e)}/status`)),
    push: async (e) =>
      he(
        await fetch(`/api/attempts/${encodeURIComponent(e)}/push`, {
          method: "POST",
        }),
      ),
  },
  Gi = {
    get: async () => he(await fetch("/api/profiles")),
    save: async (e) =>
      he(
        await fetch("/api/profiles", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(e),
        }),
      ),
  };
function Bd({ open: e, onClose: t }) {
  const [n, r] = O.useState("[]");
  O.useEffect(() => {
    e &&
      (async () => {
        const o = await Gi.get();
        r(JSON.stringify(o, null, 2));
      })();
  }, [e]);
  const l = async () => {
    let o;
    try {
      o = JSON.parse(n);
    } catch {
      alert("JSON が不正です");
      return;
    }
    (await Gi.save(o), alert("保存しました"));
  };
  return S.jsx(El, {
    open: e,
    title: "プロファイル設定",
    onClose: t,
    children: S.jsxs("div", {
      className: "form",
      children: [
        S.jsxs("label", {
          children: [
            "JSON 編集（配列形式）",
            S.jsx("textarea", {
              rows: 12,
              value: n,
              onChange: (o) => r(o.target.value),
              placeholder:
                '[{"label":"claude-code","command":["npx","-y","@anthropic-ai/claude-code@latest"]}]',
            }),
          ],
        }),
        S.jsx("div", {
          className: "row",
          children: S.jsx("button", { onClick: l, children: "保存" }),
        }),
      ],
    }),
  });
}
function Hd({ open: e, taskId: t, onClose: n, onCreated: r }) {
  const [l, o] = O.useState([]),
    [u, i] = O.useState(""),
    [s, c] = O.useState(""),
    [h, m] = O.useState("main");
  O.useEffect(() => {
    e &&
      (async () => {
        var g, k;
        const y = await Nn.listProfiles();
        if ((o(y), i(((g = y[0]) == null ? void 0 : g.label) || ""), t))
          try {
            const j = await In.list(t);
            if (j.length > 0) {
              const f = j[0];
              (c(f.repo_path || ""),
                m(f.base_branch || "main"),
                i(f.profile || ((k = y[0]) == null ? void 0 : k.label) || ""));
            } else (c(""), m("main"));
          } catch {}
      })();
  }, [e, t]);
  const p = async () => {
    if (!t) return;
    if (!s.trim()) {
      alert("リポジトリパスを入力してください");
      return;
    }
    if (!h.trim()) {
      alert("ベースブランチを入力してください");
      return;
    }
    const y = await In.create({
      task_id: t,
      profile: u,
      repo_path: s.trim(),
      base_branch: h.trim(),
    });
    (r(y), n());
  };
  return S.jsx(El, {
    open: e,
    title: "試行の作成",
    onClose: n,
    children: S.jsxs("div", {
      className: "form",
      children: [
        S.jsxs("div", {
          style: { fontSize: 12, color: "#b3c7e6" },
          children: ["タスクID: ", S.jsx("span", { children: t })],
        }),
        S.jsxs("label", {
          children: [
            "エージェント",
            S.jsx("select", {
              value: u,
              onChange: (y) => i(y.target.value),
              children: l.map((y) =>
                S.jsx("option", { value: y.label, children: y.label }, y.label),
              ),
            }),
          ],
        }),
        S.jsxs("label", {
          children: [
            "リポジトリパス",
            S.jsx("input", {
              type: "text",
              value: s,
              onChange: (y) => c(y.target.value),
              placeholder: "例: /path/to/repo",
            }),
          ],
        }),
        S.jsxs("label", {
          children: [
            "ベースブランチ（必須）",
            S.jsx("input", {
              type: "text",
              value: h,
              onChange: (y) => m(y.target.value),
              placeholder: "main / develop など",
            }),
          ],
        }),
        S.jsx("div", {
          className: "row",
          children: S.jsx("button", { onClick: p, children: "作成" }),
        }),
      ],
    }),
  });
}
function Wd({ open: e, attemptId: t, presetCwd: n, onClose: r }) {
  const [l, o] = O.useState([]),
    [u, i] = O.useState(""),
    [s, c] = O.useState(""),
    [h, m] = O.useState(""),
    [p, y] = O.useState([]),
    [g, k] = O.useState(null),
    [j, f] = O.useState(!1),
    [a, d] = O.useState(null),
    [v, E] = O.useState(""),
    C = O.useRef(null);
  O.useEffect(() => {
    if (e)
      return (
        (async () => {
          var K;
          const z = await Nn.listProfiles();
          (o(z),
            i(((K = z[0]) == null ? void 0 : K.label) || ""),
            c(""),
            m(n || ""),
            E(""),
            f(!1),
            await N(),
            await P());
        })(),
        () => {
          C.current && (C.current.close(), (C.current = null));
        }
      );
  }, [e]);
  const N = async () => {
      const z = await Nn.list();
      y(z);
    },
    P = async () => {
      if (!t) {
        d(null);
        return;
      }
      try {
        d(await In.status(t));
      } catch {
        d(null);
      }
    },
    $ = async () => {
      if (!s.trim()) {
        alert("プロンプトを入力してください");
        return;
      }
      const z = { profile: u, prompt: s.trim() };
      (h.trim() && (z.cwd = h.trim()), t && (z.attempt_id = t));
      const K = await Nn.start(z);
      (k(K.id), f(!0), T(K.id));
    },
    T = (z) => {
      (C.current && C.current.close(), E(""));
      const K = new EventSource(`/api/executions/${z}/stream`);
      (K.addEventListener("stdout", (x) => U("▶", x.data)),
        K.addEventListener("stderr", (x) => U("!", x.data)),
        K.addEventListener("status", (x) => U("●", `[status] ${x.data}`)),
        (C.current = K));
    },
    U = (z, K) => {
      E(
        (x) =>
          x +
          `${z} ${K}
`,
      );
    },
    b = async () => {
      g && (await Nn.kill(g));
    },
    Ue = async () => {
      if (!t) {
        alert("先に試行を作成してください");
        return;
      }
      try {
        (await In.push(t), await P(), alert("Push 完了"));
      } catch (z) {
        alert("Push 失敗: " + ((z == null ? void 0 : z.message) || String(z)));
      }
    },
    or = async () => {
      if (!t) {
        alert("先に試行を作成してください");
        return;
      }
      const z = window.prompt("PRタイトルを入力（空なら自動）") || "",
        K = window.prompt("ベースブランチ（空なら試行のベース）") || "";
      try {
        const x = await In.pr(t, { title: z, body: "", base_branch: K });
        alert(`PR作成: ${x.pr_url || "成功"}`);
      } catch (x) {
        alert(
          "PR作成に失敗: " + ((x == null ? void 0 : x.message) || String(x)),
        );
      }
    },
    Cl = O.useMemo(() => {
      if (!a) return "";
      const z =
          a.remote_commits_behind == null ? "N/A" : a.remote_commits_behind,
        K = a.remote_commits_ahead == null ? "N/A" : a.remote_commits_ahead;
      return `ブランチ状態: base=${a.base_branch_name} / behind=${a.commits_behind} ahead=${a.commits_ahead} / remote behind=${z} ahead=${K} / 未コミット変更=${a.has_uncommitted_changes ? "あり" : "なし"}`;
    }, [a]);
  return S.jsxs(El, {
    open: e,
    title: "エージェントを実行",
    onClose: r,
    children: [
      S.jsxs("div", {
        className: "form",
        children: [
          S.jsxs("label", {
            children: [
              "エージェント",
              S.jsx("select", {
                value: u,
                onChange: (z) => i(z.target.value),
                children: l.map((z) =>
                  S.jsx(
                    "option",
                    { value: z.label, children: z.label },
                    z.label,
                  ),
                ),
              }),
            ],
          }),
          S.jsxs("label", {
            children: [
              "プロンプト",
              S.jsx("textarea", {
                rows: 5,
                value: s,
                onChange: (z) => c(z.target.value),
                placeholder: "やりたいことを記述",
              }),
            ],
          }),
          S.jsxs("label", {
            children: [
              "実行ディレクトリ（省略可）",
              S.jsx("input", {
                type: "text",
                value: h,
                onChange: (z) => m(z.target.value),
                placeholder: "例: /path/to/repo",
              }),
            ],
          }),
          S.jsxs("div", {
            className: "row",
            children: [
              S.jsx("button", { onClick: $, children: "実行" }),
              S.jsx("button", {
                className: "danger",
                disabled: !j,
                onClick: b,
                children: "停止",
              }),
              S.jsx("button", {
                className: "ghost",
                onClick: N,
                children: "履歴を更新",
              }),
              S.jsx("button", {
                className: "ghost",
                disabled: !t,
                onClick: Ue,
                children: "Push",
              }),
              S.jsx("button", {
                className: "ghost",
                disabled: !t,
                onClick: or,
                children: "PR作成",
              }),
            ],
          }),
        ],
      }),
      t &&
        S.jsx("div", {
          id: "branchStatus",
          className: "log",
          style: { whiteSpace: "normal", fontSize: 12, color: "#b3c7e6" },
          children: Cl,
        }),
      S.jsxs("div", {
        style: {
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 12,
          minHeight: 240,
        },
        children: [
          S.jsxs("div", {
            children: [
              S.jsx("div", {
                style: { fontSize: 12, color: "#b3c7e6", marginBottom: 6 },
                children: "実行履歴",
              }),
              S.jsxs("div", {
                className: "log",
                style: { maxHeight: "48vh", whiteSpace: "normal" },
                children: [
                  p.length === 0 &&
                    S.jsx("div", { children: "履歴はありません" }),
                  p.map((z) =>
                    S.jsxs(
                      "a",
                      {
                        href: "#",
                        style: { display: "block", color: "#e5eef7" },
                        onClick: (K) => {
                          (K.preventDefault(), k(z.id), f(!0), T(z.id));
                        },
                        children: [
                          new Date(z.started_at).toLocaleString(),
                          " [",
                          z.profile,
                          "]",
                          " ",
                          z.status,
                          z.attempt_id
                            ? ` attempt:${z.attempt_id.slice(0, 8)}`
                            : "",
                        ],
                      },
                      z.id,
                    ),
                  ),
                ],
              }),
            ],
          }),
          S.jsx("pre", { className: "log", style: { margin: 0 }, children: v }),
        ],
      }),
    ],
  });
}
function Qd() {
  const [e, t] = O.useState([]),
    [n, r] = O.useState(!1),
    [l, o] = O.useState(!1),
    [u, i] = O.useState(!1),
    [s, c] = O.useState(!1),
    [h, m] = O.useState(!1),
    [p, y] = O.useState(null),
    [g, k] = O.useState(null),
    [j, f] = O.useState(null),
    a = async () => {
      r(!0);
      try {
        const T = await kn.listTasks(),
          U = (b) =>
            b === "todo" ? 0 : b === "doing" ? 1 : b === "done" ? 2 : 99;
        (T.sort((b, Ue) => U(b.status) - U(Ue.status) || b.order - Ue.order),
          t(T));
      } finally {
        r(!1);
      }
    };
  O.useEffect(() => {
    a();
  }, []);
  const d = (T) => {
      (y(T), m(!0));
    },
    v = async (T, U) => {
      p && (await kn.createTask(T, U, p), m(!1), y(null), await a());
    },
    E = async (T) => {
      const U = window.prompt("タイトルを編集", T.title);
      if (U == null) return;
      const b = window.prompt("説明を編集", T.description || "");
      (await kn.updateTask(T.id, { title: U, description: b ?? "" }),
        await a());
    },
    C = async (T) => {
      window.confirm("本当に削除しますか？") &&
        (await kn.deleteTask(T.id), await a());
    },
    N = async (T, U, b) => {
      (await kn.moveTask(T, U, b), await a());
    },
    P = (T) => {
      (k(T.id), c(!0));
    },
    $ = (T) => {
      (f(T), i(!0));
    };
  return S.jsxs("div", {
    children: [
      S.jsxs("header", {
        className: "topbar",
        children: [
          S.jsx("h1", { children: "タスク管理" }),
          S.jsxs("div", {
            className: "actions",
            children: [
              S.jsx("button", {
                className: "ghost",
                onClick: () => o(!0),
                children: "設定",
              }),
              S.jsx("button", {
                onClick: () => {
                  (f(null), i(!0));
                },
                children: "エージェント実行",
              }),
              S.jsx("button", {
                className: "ghost",
                onClick: () => void a(),
                disabled: n,
                children: n ? "更新中..." : "再読み込み",
              }),
            ],
          }),
        ],
      }),
      S.jsx(Fd, {
        tasks: e,
        onAdd: d,
        onEdit: E,
        onDelete: C,
        onAttempt: P,
        onMove: N,
      }),
      S.jsx("footer", { className: "footer" }),
      S.jsx(Vd, {
        open: h,
        status: p,
        onClose: () => {
          (m(!1), y(null));
        },
        onCreate: v,
      }),
      S.jsx(Bd, { open: l, onClose: () => o(!1) }),
      S.jsx(Hd, { open: s, taskId: g, onClose: () => c(!1), onCreated: $ }),
      S.jsx(Wd, {
        open: u,
        attemptId: j == null ? void 0 : j.id,
        presetCwd: j == null ? void 0 : j.repo_path,
        onClose: () => i(!1),
      }),
    ],
  });
}
const Kd = document.getElementById("root");
sc(Kd).render(S.jsx(Qd, {}));

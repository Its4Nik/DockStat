/*　Bundled by DockStore　*/
var M7 = Object.create
var { getPrototypeOf: B7, defineProperty: jQ, getOwnPropertyNames: G7 } = Object
var N7 = Object.prototype.hasOwnProperty
var P8 = ($, X, Q) => {
  Q = $ != null ? M7(B7($)) : {}
  const J = X || !$ || !$.__esModule ? jQ(Q, "default", { value: $, enumerable: !0 }) : Q
  for (const Y of G7($)) if (!N7.call(J, Y)) jQ(J, Y, { get: () => $[Y], enumerable: !0 })
  return J
}
var U6 = ($, X) => () => (X || $((X = { exports: {} }).exports, X), X.exports)
var F$ = ($, X) => {
  for (var Q in X)
    jQ($, Q, { get: X[Q], enumerable: !0, configurable: !0, set: (J) => (X[Q] = () => J) })
}
var h0 = ($, X) => () => ($ && (X = $(($ = 0))), X)
var E6 = U6((_nV, bZ) => {
  var IZ = 12,
    JG = 0,
    XJ = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
      3, 3, 3, 3, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
      5, 5, 5, 5, 5, 5, 5, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 8, 7, 7, 10, 9, 9, 9, 11, 4, 4, 4,
      4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 24, 36, 48, 60,
      72, 84, 96, 0, 12, 12, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24,
      24, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 48, 48, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 48, 48, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 127,
      63, 63, 63, 0, 31, 15, 15, 15, 7, 7, 7,
    ]
  function YG($) {
    var X = $.indexOf("%")
    if (X === -1) return $
    var Q = $.length,
      J = "",
      Y = 0,
      Z = 0,
      W = X,
      q = IZ
    while (X > -1 && X < Q) {
      var M = TZ($[X + 1], 4),
        G = TZ($[X + 2], 0),
        B = M | G,
        N = XJ[B]
      if (((q = XJ[256 + q + N]), (Z = (Z << 6) | (B & XJ[364 + N])), q === IZ))
        (J += $.slice(Y, W)),
          (J +=
            Z <= 65535
              ? String.fromCharCode(Z)
              : String.fromCharCode(55232 + (Z >> 10), 56320 + (Z & 1023))),
          (Z = 0),
          (Y = X + 3),
          (X = W = $.indexOf("%", Y))
      else if (q === JG) return null
      else {
        if (((X += 3), X < Q && $.charCodeAt(X) === 37)) continue
        return null
      }
    }
    return J + $.slice(Y)
  }
  var ZG = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    a: 10,
    A: 10,
    b: 11,
    B: 11,
    c: 12,
    C: 12,
    d: 13,
    D: 13,
    e: 14,
    E: 14,
    f: 15,
    F: 15,
  }
  function TZ($, X) {
    var Q = ZG[$]
    return Q === void 0 ? 255 : Q << X
  }
  bZ.exports = YG
})
var SW = h0(() => {
  /*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
})
function CW($, X = "utf-8") {
  switch (X.toLowerCase()) {
    case "utf-8":
    case "utf8":
      if (typeof globalThis.TextDecoder < "u") return new globalThis.TextDecoder("utf-8").decode($)
      return YH($)
    case "utf-16le":
      return ZH($)
    case "ascii":
      return WH($)
    case "latin1":
    case "iso-8859-1":
      return qH($)
    case "windows-1252":
      return MH($)
    default:
      throw RangeError(`Encoding '${X}' not supported`)
  }
}
function YH($) {
  let X = "",
    Q = 0
  while (Q < $.length) {
    const J = $[Q++]
    if (J < 128) X += String.fromCharCode(J)
    else if (J < 224) {
      const Y = $[Q++] & 63
      X += String.fromCharCode(((J & 31) << 6) | Y)
    } else if (J < 240) {
      const Y = $[Q++] & 63,
        Z = $[Q++] & 63
      X += String.fromCharCode(((J & 15) << 12) | (Y << 6) | Z)
    } else {
      let Y = $[Q++] & 63,
        Z = $[Q++] & 63,
        W = $[Q++] & 63,
        q = ((J & 7) << 18) | (Y << 12) | (Z << 6) | W
      ;(q -= 65536), (X += String.fromCharCode(55296 + ((q >> 10) & 1023), 56320 + (q & 1023)))
    }
  }
  return X
}
function ZH($) {
  let X = ""
  for (let Q = 0; Q < $.length; Q += 2) X += String.fromCharCode($[Q] | ($[Q + 1] << 8))
  return X
}
function WH($) {
  return String.fromCharCode(...$.map((X) => X & 127))
}
function qH($) {
  return String.fromCharCode(...$)
}
function MH($) {
  let X = ""
  for (const Q of $)
    if (Q >= 128 && Q <= 159 && _J[Q]) X += _J[Q]
    else X += String.fromCharCode(Q)
  return X
}
var _J, JH
var jW = h0(() => {
  ;(_J = {
    128: "€",
    130: "‚",
    131: "ƒ",
    132: "„",
    133: "…",
    134: "†",
    135: "‡",
    136: "ˆ",
    137: "‰",
    138: "Š",
    139: "‹",
    140: "Œ",
    142: "Ž",
    145: "‘",
    146: "’",
    147: "“",
    148: "”",
    149: "•",
    150: "–",
    151: "—",
    152: "˜",
    153: "™",
    154: "š",
    155: "›",
    156: "œ",
    158: "ž",
    159: "Ÿ",
  }),
    (JH = {})
  for (const [$, X] of Object.entries(_J)) JH[X] = Number.parseInt($, 10)
})
function v1($) {
  return new DataView($.buffer, $.byteOffset)
}
class s1 {
  constructor($, X) {
    ;(this.len = $), (this.encoding = X)
  }
  get($, X = 0) {
    const Q = $.subarray(X, X + this.len)
    return CW(Q, this.encoding)
  }
}
var FW, v0, s8, e0, RW, VW, _W
var d6 = h0(() => {
  SW()
  jW()
  ;(FW = {
    len: 1,
    get($, X) {
      return v1($).getUint8(X)
    },
    put($, X, Q) {
      return v1($).setUint8(X, Q), X + 1
    },
  }),
    (v0 = {
      len: 2,
      get($, X) {
        return v1($).getUint16(X, !0)
      },
      put($, X, Q) {
        return v1($).setUint16(X, Q, !0), X + 2
      },
    }),
    (s8 = {
      len: 2,
      get($, X) {
        return v1($).getUint16(X)
      },
      put($, X, Q) {
        return v1($).setUint16(X, Q), X + 2
      },
    }),
    (e0 = {
      len: 4,
      get($, X) {
        return v1($).getUint32(X, !0)
      },
      put($, X, Q) {
        return v1($).setUint32(X, Q, !0), X + 4
      },
    }),
    (RW = {
      len: 4,
      get($, X) {
        return v1($).getUint32(X)
      },
      put($, X, Q) {
        return v1($).setUint32(X, Q), X + 4
      },
    }),
    (VW = {
      len: 4,
      get($, X) {
        return v1($).getInt32(X)
      },
      put($, X, Q) {
        return v1($).setInt32(X, Q), X + 4
      },
    }),
    (_W = {
      len: 8,
      get($, X) {
        return v1($).getBigUint64(X, !0)
      },
      put($, X, Q) {
        return v1($).setBigUint64(X, Q, !0), X + 8
      },
    })
})
var l0, r8
var h6 = h0(() => {
  l0 = class l0 extends Error {
    constructor() {
      super("End-Of-Stream")
      this.name = "EndOfStreamError"
    }
  }
  r8 = class r8 extends Error {
    constructor($ = "The operation was aborted") {
      super($)
      this.name = "AbortError"
    }
  }
})
class a8 {
  constructor() {
    ;(this.endOfStream = !1), (this.interrupted = !1), (this.peekQueue = [])
  }
  async peek($, X = !1) {
    const Q = await this.read($, X)
    return this.peekQueue.push($.subarray(0, Q)), Q
  }
  async read($, X = !1) {
    if ($.length === 0) return 0
    let Q = this.readFromPeekBuffer($)
    if (!this.endOfStream) Q += await this.readRemainderFromStream($.subarray(Q), X)
    if (Q === 0 && !X) throw new l0()
    return Q
  }
  readFromPeekBuffer($) {
    let X = $.length,
      Q = 0
    while (this.peekQueue.length > 0 && X > 0) {
      const J = this.peekQueue.pop()
      if (!J) throw Error("peekData should be defined")
      const Y = Math.min(J.length, X)
      if (($.set(J.subarray(0, Y), Q), (Q += Y), (X -= Y), Y < J.length))
        this.peekQueue.push(J.subarray(Y))
    }
    return Q
  }
  async readRemainderFromStream($, X) {
    let Q = 0
    while (Q < $.length && !this.endOfStream) {
      if (this.interrupted) throw new r8()
      const J = await this.readFromStream($.subarray(Q), X)
      if (J === 0) break
      Q += J
    }
    if (!X && Q < $.length) throw new l0()
    return Q
  }
}
var lX = h0(() => {
  h6()
})
var EW = h0(() => {
  h6()
  lX()
})
var EJ
var xW = h0(() => {
  lX()
  EJ = class EJ extends a8 {
    constructor($) {
      super()
      this.reader = $
    }
    async abort() {
      return this.close()
    }
    async close() {
      this.reader.releaseLock()
    }
  }
})
var tX
var xJ = h0(() => {
  xW()
  tX = class tX extends EJ {
    async readFromStream($, X) {
      if ($.length === 0) return 0
      const Q = await this.reader.read(new Uint8Array($.length), { min: X ? void 0 : $.length })
      if (Q.done) this.endOfStream = Q.done
      if (Q.value) return $.set(Q.value), Q.value.length
      return 0
    }
  }
})
var m6
var IJ = h0(() => {
  h6()
  lX()
  m6 = class m6 extends a8 {
    constructor($) {
      super()
      ;(this.reader = $), (this.buffer = null)
    }
    writeChunk($, X) {
      const Q = Math.min(X.length, $.length)
      if (($.set(X.subarray(0, Q)), Q < X.length)) this.buffer = X.subarray(Q)
      else this.buffer = null
      return Q
    }
    async readFromStream($, X) {
      if ($.length === 0) return 0
      let Q = 0
      if (this.buffer) Q += this.writeChunk($, this.buffer)
      while (Q < $.length && !this.endOfStream) {
        const J = await this.reader.read()
        if (J.done) {
          this.endOfStream = !0
          break
        }
        if (J.value) Q += this.writeChunk($.subarray(Q), J.value)
      }
      if (!X && Q === 0 && this.endOfStream) throw new l0()
      return Q
    }
    abort() {
      return (this.interrupted = !0), this.reader.cancel()
    }
    async close() {
      await this.abort(), this.reader.releaseLock()
    }
  }
})
function TJ($) {
  try {
    const X = $.getReader({ mode: "byob" })
    if (X instanceof ReadableStreamDefaultReader) return new m6(X)
    return new tX(X)
  } catch (X) {
    if (X instanceof TypeError) return new m6($.getReader())
    throw X
  }
}
var IW = h0(() => {
  xJ()
  IJ()
})
var q8 = h0(() => {
  h6()
  EW()
  xJ()
  IJ()
  IW()
})
class M8 {
  constructor($) {
    if (
      ((this.numBuffer = new Uint8Array(8)),
      (this.position = 0),
      (this.onClose = $?.onClose),
      $?.abortSignal)
    )
      $.abortSignal.addEventListener("abort", () => {
        this.abort()
      })
  }
  async readToken($, X = this.position) {
    const Q = new Uint8Array($.len)
    if ((await this.readBuffer(Q, { position: X })) < $.len) throw new l0()
    return $.get(Q, 0)
  }
  async peekToken($, X = this.position) {
    const Q = new Uint8Array($.len)
    if ((await this.peekBuffer(Q, { position: X })) < $.len) throw new l0()
    return $.get(Q, 0)
  }
  async readNumber($) {
    if ((await this.readBuffer(this.numBuffer, { length: $.len })) < $.len) throw new l0()
    return $.get(this.numBuffer, 0)
  }
  async peekNumber($) {
    if ((await this.peekBuffer(this.numBuffer, { length: $.len })) < $.len) throw new l0()
    return $.get(this.numBuffer, 0)
  }
  async ignore($) {
    if (this.fileInfo.size !== void 0) {
      const X = this.fileInfo.size - this.position
      if ($ > X) return (this.position += X), X
    }
    return (this.position += $), $
  }
  async close() {
    await this.abort(), await this.onClose?.()
  }
  normalizeOptions($, X) {
    if (!this.supportsRandomAccess() && X && X.position !== void 0 && X.position < this.position)
      throw Error("`options.position` must be equal or greater than `tokenizer.position`")
    return { ...{ mayBeLess: !1, offset: 0, length: $.length, position: this.position }, ...X }
  }
  abort() {
    return Promise.resolve()
  }
}
var u6 = h0(() => {
  q8()
})
var wH = 256000,
  bJ
var TW = h0(() => {
  u6()
  q8()
  bJ = class bJ extends M8 {
    constructor($, X) {
      super(X)
      ;(this.streamReader = $), (this.fileInfo = X?.fileInfo ?? {})
    }
    async readBuffer($, X) {
      const Q = this.normalizeOptions($, X),
        J = Q.position - this.position
      if (J > 0) return await this.ignore(J), this.readBuffer($, X)
      if (J < 0)
        throw Error("`options.position` must be equal or greater than `tokenizer.position`")
      if (Q.length === 0) return 0
      const Y = await this.streamReader.read($.subarray(0, Q.length), Q.mayBeLess)
      if (((this.position += Y), (!X || !X.mayBeLess) && Y < Q.length)) throw new l0()
      return Y
    }
    async peekBuffer($, X) {
      let Q = this.normalizeOptions($, X),
        J = 0
      if (Q.position) {
        const Y = Q.position - this.position
        if (Y > 0) {
          const Z = new Uint8Array(Q.length + Y)
          return (
            (J = await this.peekBuffer(Z, { mayBeLess: Q.mayBeLess })), $.set(Z.subarray(Y)), J - Y
          )
        }
        if (Y < 0) throw Error("Cannot peek from a negative offset in a stream")
      }
      if (Q.length > 0) {
        try {
          J = await this.streamReader.peek($.subarray(0, Q.length), Q.mayBeLess)
        } catch (Y) {
          if (X?.mayBeLess && Y instanceof l0) return 0
          throw Y
        }
        if (!Q.mayBeLess && J < Q.length) throw new l0()
      }
      return J
    }
    async ignore($) {
      let X = Math.min(wH, $),
        Q = new Uint8Array(X),
        J = 0
      while (J < $) {
        const Y = $ - J,
          Z = await this.readBuffer(Q, { length: Math.min(X, Y) })
        if (Z < 0) return Z
        J += Z
      }
      return J
    }
    abort() {
      return this.streamReader.abort()
    }
    async close() {
      return this.streamReader.close()
    }
    supportsRandomAccess() {
      return !1
    }
  }
})
var kJ
var bW = h0(() => {
  q8()
  u6()
  kJ = class kJ extends M8 {
    constructor($, X) {
      super(X)
      ;(this.uint8Array = $), (this.fileInfo = { ...(X?.fileInfo ?? {}), ...{ size: $.length } })
    }
    async readBuffer($, X) {
      if (X?.position) this.position = X.position
      const Q = await this.peekBuffer($, X)
      return (this.position += Q), Q
    }
    async peekBuffer($, X) {
      const Q = this.normalizeOptions($, X),
        J = Math.min(this.uint8Array.length - Q.position, Q.length)
      if (!Q.mayBeLess && J < Q.length) throw new l0()
      return $.set(this.uint8Array.subarray(Q.position, Q.position + J)), J
    }
    close() {
      return super.close()
    }
    supportsRandomAccess() {
      return !0
    }
    setPosition($) {
      this.position = $
    }
  }
})
var kW = h0(() => {
  q8()
  u6()
})
function gW($, X) {
  const Q = TJ($),
    J = X ?? {},
    Y = J.onClose
  return (
    (J.onClose = async () => {
      if ((await Q.close(), Y)) return Y()
    }),
    new bJ(Q, J)
  )
}
function fW($, X) {
  return new kJ($, X)
}
var yW = h0(() => {
  q8()
  TW()
  bW()
  kW()
  q8()
  u6()
})
function VH($, X) {
  return vJ($, { i: 2 }, X?.out, X?.dictionary)
}
function _H($, X) {
  var Q = jH($)
  if (Q + 8 > $.length) r1(6, "invalid gzip data")
  return vJ($.subarray(Q, -8), { i: 2 }, X?.out || new a1(FH($)), X?.dictionary)
}
function EH($, X) {
  return vJ($.subarray(RH($, X?.dictionary), -4), { i: 2 }, X?.out, X?.dictionary)
}
function iW($, X) {
  return $[0] === 31 && $[1] === 139 && $[2] === 8
    ? _H($, X)
    : ($[0] & 15) !== 8 || $[0] >> 4 > 7 || (($[0] << 8) | $[1]) % 31
      ? VH($, X)
      : EH($, X)
}
var a1,
  e8,
  zH,
  vW,
  dW,
  HH,
  hW = ($, X) => {
    var Q = new e8(31)
    for (var J = 0; J < 31; ++J) Q[J] = X += 1 << $[J - 1]
    var Y = new zH(Q[30])
    for (var J = 1; J < 30; ++J) for (var Z = Q[J]; Z < Q[J + 1]; ++Z) Y[Z] = ((Z - Q[J]) << 5) | J
    return { b: Q, r: Y }
  },
  mW,
  uW,
  AH,
  cW,
  DH,
  _EI,
  yJ,
  u2,
  _Y0,
  c6 = ($, X, Q) => {
    var J = $.length,
      Y = 0,
      Z = new e8(X)
    for (; Y < J; ++Y) if ($[Y]) ++Z[$[Y] - 1]
    var W = new e8(X)
    for (Y = 1; Y < X; ++Y) W[Y] = (W[Y - 1] + Z[Y - 1]) << 1
    var q
    if (Q) {
      q = new e8(1 << X)
      var M = 15 - X
      for (Y = 0; Y < J; ++Y)
        if ($[Y]) {
          var G = (Y << 4) | $[Y],
            B = X - $[Y],
            N = W[$[Y] - 1]++ << B
          for (var P = N | ((1 << B) - 1); N <= P; ++N) q[yJ[N] >> M] = G
        }
    } else {
      q = new e8(J)
      for (Y = 0; Y < J; ++Y) if ($[Y]) q[Y] = yJ[W[$[Y] - 1]++] >> (15 - $[Y])
    }
    return q
  },
  p6,
  Y0,
  Y0,
  Y0,
  Y0,
  pW,
  Y0,
  OH,
  PH,
  gJ = ($) => {
    var X = $[0]
    for (var Q = 1; Q < $.length; ++Q) if ($[Q] > X) X = $[Q]
    return X
  },
  I2 = ($, X, Q) => {
    var J = (X / 8) | 0
    return (($[J] | ($[J + 1] << 8)) >> (X & 7)) & Q
  },
  fJ = ($, X) => {
    var Q = (X / 8) | 0
    return ($[Q] | ($[Q + 1] << 8) | ($[Q + 2] << 16)) >> (X & 7)
  },
  LH = ($) => (($ + 7) / 8) | 0,
  KH = ($, X, Q) => {
    if (X == null || X < 0) X = 0
    if (Q == null || Q > $.length) Q = $.length
    return new a1($.subarray(X, Q))
  },
  SH,
  r1 = ($, X, Q) => {
    var J = Error(X || SH[$])
    if (((J.code = $), Error.captureStackTrace)) Error.captureStackTrace(J, r1)
    if (!Q) throw J
    return J
  },
  vJ = ($, X, Q, J) => {
    var Y = $.length,
      Z = J ? J.length : 0
    if (!Y || (X.f && !X.l)) return Q || new a1(0)
    var W = !Q,
      q = W || X.i !== 2,
      M = X.i
    if (W) Q = new a1(Y * 3)
    var G = (U) => {
        var D = Q.length
        if (U > D) {
          var z = new a1(Math.max(D * 2, U))
          z.set(Q), (Q = z)
        }
      },
      B = X.f || 0,
      N = X.p || 0,
      P = X.b || 0,
      w = X.l,
      H = X.d,
      A = X.m,
      S = X.n,
      j = Y * 8
    do {
      if (!w) {
        B = I2($, N, 1)
        var K = I2($, N + 1, 3)
        if (((N += 3), !K)) {
          var y = LH(N) + 4,
            o = $[y - 4] | ($[y - 3] << 8),
            n = y + o
          if (n > Y) {
            if (M) r1(0)
            break
          }
          if (q) G(P + o)
          Q.set($.subarray(y, n), P), (X.b = P += o), (X.p = N = n * 8), (X.f = B)
          continue
        } else if (K === 1) (w = OH), (H = PH), (A = 9), (S = 5)
        else if (K === 2) {
          var f = I2($, N, 31) + 257,
            I = I2($, N + 10, 15) + 4,
            k = f + I2($, N + 5, 31) + 1
          N += 14
          var b = new a1(k),
            _ = new a1(19)
          for (var V = 0; V < I; ++V) _[HH[V]] = I2($, N + V * 3, 7)
          N += I * 3
          var d = gJ(_),
            m = (1 << d) - 1,
            X0 = c6(_, d, 1)
          for (var V = 0; V < k; ) {
            var R0 = X0[I2($, N, m)]
            N += R0 & 15
            var y = R0 >> 4
            if (y < 16) b[V++] = y
            else {
              var e = 0,
                C$ = 0
              if (y === 16) (C$ = 3 + I2($, N, 3)), (N += 2), (e = b[V - 1])
              else if (y === 17) (C$ = 3 + I2($, N, 7)), (N += 3)
              else if (y === 18) (C$ = 11 + I2($, N, 127)), (N += 7)
              while (C$--) b[V++] = e
            }
          }
          var j$ = b.subarray(0, f),
            h1 = b.subarray(f)
          ;(A = gJ(j$)), (S = gJ(h1)), (w = c6(j$, A, 1)), (H = c6(h1, S, 1))
        } else r1(1)
        if (N > j) {
          if (M) r1(0)
          break
        }
      }
      if (q) G(P + 131072)
      var G2 = (1 << A) - 1,
        d0 = (1 << S) - 1,
        $1 = N
      for (; ; $1 = N) {
        var e = w[fJ($, N) & G2],
          t0 = e >> 4
        if (((N += e & 15), N > j)) {
          if (M) r1(0)
          break
        }
        if (!e) r1(2)
        if (t0 < 256) Q[P++] = t0
        else if (t0 === 256) {
          ;($1 = N), (w = null)
          break
        } else {
          var F1 = t0 - 254
          if (t0 > 264) {
            var V = t0 - 257,
              g2 = vW[V]
            ;(F1 = I2($, N, (1 << g2) - 1) + uW[V]), (N += g2)
          }
          var R1 = H[fJ($, N) & d0],
            f2 = R1 >> 4
          if (!R1) r1(3)
          N += R1 & 15
          var h1 = DH[f2]
          if (f2 > 3) {
            var g2 = dW[f2]
            ;(h1 += fJ($, N) & ((1 << g2) - 1)), (N += g2)
          }
          if (N > j) {
            if (M) r1(0)
            break
          }
          if (q) G(P + 131072)
          var D8 = P + F1
          if (P < h1) {
            var e1 = Z - h1,
              v = Math.min(h1, D8)
            if (e1 + P < 0) r1(3)
            for (; P < v; ++P) Q[P] = J[e1 + P]
          }
          for (; P < D8; ++P) Q[P] = Q[P - h1]
        }
      }
      if (((X.l = w), (X.p = $1), (X.b = P), (X.f = B), w)) (B = 1), (X.m = A), (X.d = H), (X.n = S)
    } while (!B)
    return P !== Q.length && W ? KH(Q, 0, P) : Q.subarray(0, P)
  },
  CH,
  jH = ($) => {
    if ($[0] !== 31 || $[1] !== 139 || $[2] !== 8) r1(6, "invalid gzip data")
    var X = $[3],
      Q = 10
    if (X & 4) Q += ($[10] | ($[11] << 8)) + 2
    for (var J = ((X >> 3) & 1) + ((X >> 4) & 1); J > 0; J -= !$[Q++]);
    return Q + (X & 2)
  },
  FH = ($) => {
    var X = $.length
    return ($[X - 4] | ($[X - 3] << 8) | ($[X - 2] << 16) | ($[X - 1] << 24)) >>> 0
  },
  RH = ($, X) => {
    if (($[0] & 15) !== 8 || $[0] >> 4 > 7 || (($[0] << 8) | $[1]) % 31) r1(6, "invalid zlib data")
    if ((($[1] >> 5) & 1) === +!X)
      r1(6, `invalid zlib data: ${$[1] & 32 ? "need" : "unexpected"} dictionary`)
    return (($[1] >> 3) & 4) + 2
  },
  xH,
  _IH = 0
var nW = h0(() => {
  ;(a1 = Uint8Array),
    (e8 = Uint16Array),
    (zH = Int32Array),
    (vW = new a1([
      0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0,
      0,
    ])),
    (dW = new a1([
      0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13,
      13, 0, 0,
    ])),
    (HH = new a1([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])),
    (mW = hW(vW, 2)),
    (uW = mW.b),
    (AH = mW.r)
  ;(uW[28] = 258), (AH[258] = 28)
  ;(cW = hW(dW, 0)), (DH = cW.b), (_EI = cW.r), (yJ = new e8(32768))
  for (Y0 = 0; Y0 < 32768; ++Y0)
    (u2 = ((Y0 & 43690) >> 1) | ((Y0 & 21845) << 1)),
      (u2 = ((u2 & 52428) >> 2) | ((u2 & 13107) << 2)),
      (u2 = ((u2 & 61680) >> 4) | ((u2 & 3855) << 4)),
      (yJ[Y0] = (((u2 & 65280) >> 8) | ((u2 & 255) << 8)) >> 1)
  p6 = new a1(288)
  for (Y0 = 0; Y0 < 144; ++Y0) p6[Y0] = 8
  for (Y0 = 144; Y0 < 256; ++Y0) p6[Y0] = 9
  for (Y0 = 256; Y0 < 280; ++Y0) p6[Y0] = 7
  for (Y0 = 280; Y0 < 288; ++Y0) p6[Y0] = 8
  pW = new a1(32)
  for (Y0 = 0; Y0 < 32; ++Y0) pW[Y0] = 5
  ;(OH = c6(p6, 9, 1)),
    (PH = c6(pW, 5, 1)),
    (SH = [
      "unexpected EOF",
      "invalid block type",
      "invalid length/literal",
      "invalid distance",
      "stream finished",
      "no stream handler",
      undefined,
      "no callback",
      "invalid UTF-8 data",
      "extra field too long",
      "date not in range 1980-2099",
      "filename too long",
      "stream finishing",
      "invalid zip data",
    ]),
    (CH = new a1(0))
  xH = typeof TextDecoder < "u" && new TextDecoder()
  try {
    xH.decode(CH, { stream: !0 }), (_IH = 1)
  } catch (_$) {}
})
var lW = U6((_II, oW) => {
  var $6 = 1000,
    X6 = $6 * 60,
    Q6 = X6 * 60,
    B8 = Q6 * 24,
    TH = B8 * 7,
    bH = B8 * 365.25
  oW.exports = ($, X) => {
    X = X || {}
    var Q = typeof $
    if (Q === "string" && $.length > 0) return kH($)
    else if (Q === "number" && Number.isFinite($)) return X.long ? fH($) : gH($)
    throw Error(`val is not a non-empty string or a valid number. val=${JSON.stringify($)}`)
  }
  function kH($) {
    if ((($ = String($)), $.length > 100)) return
    var X =
      /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        $
      )
    if (!X) return
    var Q = parseFloat(X[1]),
      J = (X[2] || "ms").toLowerCase()
    switch (J) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return Q * bH
      case "weeks":
      case "week":
      case "w":
        return Q * TH
      case "days":
      case "day":
      case "d":
        return Q * B8
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return Q * Q6
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return Q * X6
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return Q * $6
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return Q
      default:
        return
    }
  }
  function gH($) {
    var X = Math.abs($)
    if (X >= B8) return `${Math.round($ / B8)}d`
    if (X >= Q6) return `${Math.round($ / Q6)}h`
    if (X >= X6) return `${Math.round($ / X6)}m`
    if (X >= $6) return `${Math.round($ / $6)}s`
    return `${$}ms`
  }
  function fH($) {
    var X = Math.abs($)
    if (X >= B8) return sX($, X, B8, "day")
    if (X >= Q6) return sX($, X, Q6, "hour")
    if (X >= X6) return sX($, X, X6, "minute")
    if (X >= $6) return sX($, X, $6, "second")
    return `${$} ms`
  }
  function sX($, X, Q, J) {
    var Y = X >= Q * 1.5
    return `${Math.round($ / Q)} ${J}${Y ? "s" : ""}`
  }
})
var sW = U6((_TI, tW) => {
  function yH($) {
    ;(Q.debug = Q),
      (Q.default = Q),
      (Q.coerce = M),
      (Q.disable = W),
      (Q.enable = Y),
      (Q.enabled = q),
      (Q.humanize = lW()),
      (Q.destroy = G),
      Object.keys($).forEach((B) => {
        Q[B] = $[B]
      }),
      (Q.names = []),
      (Q.skips = []),
      (Q.formatters = {})
    function X(B) {
      let N = 0
      for (let P = 0; P < B.length; P++) (N = (N << 5) - N + B.charCodeAt(P)), (N |= 0)
      return Q.colors[Math.abs(N) % Q.colors.length]
    }
    Q.selectColor = X
    function Q(B) {
      let N,
        P = null,
        w,
        H
      function A(...S) {
        if (!A.enabled) return
        const j = A,
          K = Date.now(),
          y = K - (N || K)
        if (
          ((j.diff = y),
          (j.prev = N),
          (j.curr = K),
          (N = K),
          (S[0] = Q.coerce(S[0])),
          typeof S[0] !== "string")
        )
          S.unshift("%O")
        let o = 0
        ;(S[0] = S[0].replace(/%([a-zA-Z%])/g, (f, I) => {
          if (f === "%%") return "%"
          o++
          const k = Q.formatters[I]
          if (typeof k === "function") {
            const b = S[o]
            ;(f = k.call(j, b)), S.splice(o, 1), o--
          }
          return f
        })),
          Q.formatArgs.call(j, S),
          (j.log || Q.log).apply(j, S)
      }
      if (
        ((A.namespace = B),
        (A.useColors = Q.useColors()),
        (A.color = Q.selectColor(B)),
        (A.extend = J),
        (A.destroy = Q.destroy),
        Object.defineProperty(A, "enabled", {
          enumerable: !0,
          configurable: !1,
          get: () => {
            if (P !== null) return P
            if (w !== Q.namespaces) (w = Q.namespaces), (H = Q.enabled(B))
            return H
          },
          set: (S) => {
            P = S
          },
        }),
        typeof Q.init === "function")
      )
        Q.init(A)
      return A
    }
    function _J(B, N) {
      const P = Q(this.namespace + (typeof N > "u" ? ":" : N) + B)
      return (P.log = this.log), P
    }
    function Y(B) {
      Q.save(B), (Q.namespaces = B), (Q.names = []), (Q.skips = [])
      const N = (typeof B === "string" ? B : "")
        .trim()
        .replace(/\s+/g, ",")
        .split(",")
        .filter(Boolean)
      for (const P of N)
        if (P[0] === "-") Q.skips.push(P.slice(1))
        else Q.names.push(P)
    }
    function Z(B, N) {
      let P = 0,
        w = 0,
        H = -1,
        A = 0
      while (P < B.length)
        if (w < N.length && (N[w] === B[P] || N[w] === "*"))
          if (N[w] === "*") (H = w), (A = P), w++
          else P++, w++
        else if (H !== -1) (w = H + 1), A++, (P = A)
        else return !1
      while (w < N.length && N[w] === "*") w++
      return w === N.length
    }
    function W() {
      const B = [...Q.names, ...Q.skips.map((N) => `-${N}`)].join(",")
      return Q.enable(""), B
    }
    function q(B) {
      for (const N of Q.skips) if (Z(B, N)) return !1
      for (const N of Q.names) if (Z(B, N)) return !0
      return !1
    }
    function M(B) {
      if (B instanceof Error) return B.stack || B.message
      return B
    }
    function G() {
      console.warn(
        "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
      )
    }
    return Q.enable(Q.load()), Q
  }
  tW.exports = yH
})
var aW = U6((rW, rX) => {
  rW.formatArgs = dH
  rW.save = hH
  rW.load = mH
  rW.useColors = vH
  rW.storage = uH()
  rW.destroy = (() => {
    let $ = !1
    return () => {
      if (!$)
        ($ = !0),
          console.warn(
            "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
          )
    }
  })()
  rW.colors = [
    "#0000CC",
    "#0000FF",
    "#0033CC",
    "#0033FF",
    "#0066CC",
    "#0066FF",
    "#0099CC",
    "#0099FF",
    "#00CC00",
    "#00CC33",
    "#00CC66",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3300FF",
    "#3333CC",
    "#3333FF",
    "#3366CC",
    "#3366FF",
    "#3399CC",
    "#3399FF",
    "#33CC00",
    "#33CC33",
    "#33CC66",
    "#33CC99",
    "#33CCCC",
    "#33CCFF",
    "#6600CC",
    "#6600FF",
    "#6633CC",
    "#6633FF",
    "#66CC00",
    "#66CC33",
    "#9900CC",
    "#9900FF",
    "#9933CC",
    "#9933FF",
    "#99CC00",
    "#99CC33",
    "#CC0000",
    "#CC0033",
    "#CC0066",
    "#CC0099",
    "#CC00CC",
    "#CC00FF",
    "#CC3300",
    "#CC3333",
    "#CC3366",
    "#CC3399",
    "#CC33CC",
    "#CC33FF",
    "#CC6600",
    "#CC6633",
    "#CC9900",
    "#CC9933",
    "#CCCC00",
    "#CCCC33",
    "#FF0000",
    "#FF0033",
    "#FF0066",
    "#FF0099",
    "#FF00CC",
    "#FF00FF",
    "#FF3300",
    "#FF3333",
    "#FF3366",
    "#FF3399",
    "#FF33CC",
    "#FF33FF",
    "#FF6600",
    "#FF6633",
    "#FF9900",
    "#FF9933",
    "#FFCC00",
    "#FFCC33",
  ]
  function vH() {
    if (
      typeof window < "u" &&
      window.process &&
      (window.process.type === "renderer" || window.process.__nwjs)
    )
      return !0
    if (
      typeof navigator < "u" &&
      navigator.userAgent &&
      navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)
    )
      return !1
    let $
    return (
      (typeof document < "u" &&
        document.documentElement &&
        document.documentElement.style &&
        document.documentElement.style.WebkitAppearance) ||
      (typeof window < "u" &&
        window.console &&
        (window.console.firebug || (window.console.exception && window.console.table))) ||
      (typeof navigator < "u" &&
        navigator.userAgent &&
        ($ = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) &&
        parseInt($[1], 10) >= 31) ||
      (typeof navigator < "u" &&
        navigator.userAgent &&
        navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/))
    )
  }
  function dH($) {
    if (
      (($[0] =
        (this.useColors ? "%c" : "") +
        this.namespace +
        (this.useColors ? " %c" : " ") +
        $[0] +
        (this.useColors ? "%c " : " ") +
        "+" +
        rX.exports.humanize(this.diff)),
      !this.useColors)
    )
      return
    const X = `color: ${this.color}`
    $.splice(1, 0, X, "color: inherit")
    let Q = 0,
      J = 0
    $[0].replace(/%[a-zA-Z%]/g, (Y) => {
      if (Y === "%%") return
      if ((Q++, Y === "%c")) J = Q
    }),
      $.splice(J, 0, X)
  }
  rW.log = console.debug || console.log || (() => {})
  function hH($) {
    try {
      if ($) rW.storage.setItem("debug", $)
      else rW.storage.removeItem("debug")
    } catch (_X) {}
  }
  function mH() {
    let $
    try {
      $ = rW.storage.getItem("debug") || rW.storage.getItem("DEBUG")
    } catch (_X) {}
    if (!$ && typeof process < "u" && "env" in process) $ = process.env.DEBUG
    return $
  }
  function uH() {
    try {
      return localStorage
    } catch (_$) {}
  }
  rX.exports = sW()(rW)
  var { formatters: cH } = rX.exports
  cH.j = ($) => {
    try {
      return JSON.stringify($)
    } catch (X) {
      return `[UnexpectedJSONParseError]: ${X.message}`
    }
  }
})
var G8, dJ, eW, $5, X5
var Q5 = h0(() => {
  d6()
  ;(G8 = {
    LocalFileHeader: 67324752,
    DataDescriptor: 134695760,
    CentralFileHeader: 33639248,
    EndOfCentralDirectory: 101010256,
  }),
    (dJ = {
      get($) {
        const _X = v0.get($, 6)
        return {
          signature: e0.get($, 0),
          compressedSize: e0.get($, 8),
          uncompressedSize: e0.get($, 12),
        }
      },
      len: 16,
    }),
    (eW = {
      get($) {
        const X = v0.get($, 6)
        return {
          signature: e0.get($, 0),
          minVersion: v0.get($, 4),
          dataDescriptor: !!(X & 8),
          compressedMethod: v0.get($, 8),
          compressedSize: e0.get($, 18),
          uncompressedSize: e0.get($, 22),
          filenameLength: v0.get($, 26),
          extraFieldLength: v0.get($, 28),
          filename: null,
        }
      },
      len: 30,
    }),
    ($5 = {
      get($) {
        return {
          signature: e0.get($, 0),
          nrOfThisDisk: v0.get($, 4),
          nrOfThisDiskWithTheStart: v0.get($, 6),
          nrOfEntriesOnThisDisk: v0.get($, 8),
          nrOfEntriesOfSize: v0.get($, 10),
          sizeOfCd: e0.get($, 12),
          offsetOfStartOfCd: e0.get($, 16),
          zipFileCommentLength: v0.get($, 20),
        }
      },
      len: 22,
    }),
    (X5 = {
      get($) {
        const X = v0.get($, 8)
        return {
          signature: e0.get($, 0),
          minVersion: v0.get($, 6),
          dataDescriptor: !!(X & 8),
          compressedMethod: v0.get($, 10),
          compressedSize: e0.get($, 20),
          uncompressedSize: e0.get($, 24),
          filenameLength: v0.get($, 28),
          extraFieldLength: v0.get($, 30),
          fileCommentLength: v0.get($, 32),
          relativeOffsetOfLocalHeader: e0.get($, 42),
          filename: null,
        }
      },
      len: 46,
    })
})
function Y5($) {
  const X = new Uint8Array(e0.len)
  return e0.put(X, 0, $), X
}
class mJ {
  constructor($) {
    ;(this.tokenizer = $), (this.syncBuffer = new Uint8Array(hJ))
  }
  async isZip() {
    return (await this.peekSignature()) === G8.LocalFileHeader
  }
  peekSignature() {
    return this.tokenizer.peekToken(e0)
  }
  async findEndOfCentralDirectoryLocator() {
    const $ = this.tokenizer,
      X = Math.min(16384, $.fileInfo.size),
      Q = this.syncBuffer.subarray(0, X)
    await this.tokenizer.readBuffer(Q, { position: $.fileInfo.size - X })
    for (let J = Q.length - 4; J >= 0; J--)
      if (Q[J] === aX[0] && Q[J + 1] === aX[1] && Q[J + 2] === aX[2] && Q[J + 3] === aX[3])
        return $.fileInfo.size - X + J
    return -1
  }
  async readCentralDirectory() {
    if (!this.tokenizer.supportsRandomAccess()) {
      c2("Cannot reading central-directory without random-read support")
      return
    }
    c2("Reading central-directory...")
    const $ = this.tokenizer.position,
      X = await this.findEndOfCentralDirectoryLocator()
    if (X > 0) {
      c2("Central-directory 32-bit signature found")
      const Q = await this.tokenizer.readToken($5, X),
        J = []
      this.tokenizer.setPosition(Q.offsetOfStartOfCd)
      for (let Y = 0; Y < Q.nrOfEntriesOfSize; ++Y) {
        const Z = await this.tokenizer.readToken(X5)
        if (Z.signature !== G8.CentralFileHeader)
          throw Error("Expected Central-File-Header signature")
        ;(Z.filename = await this.tokenizer.readToken(new s1(Z.filenameLength, "utf-8"))),
          await this.tokenizer.ignore(Z.extraFieldLength),
          await this.tokenizer.ignore(Z.fileCommentLength),
          J.push(Z),
          c2(`Add central-directory file-entry: n=${Y + 1}/${J.length}: filename=${J[Y].filename}`)
      }
      return this.tokenizer.setPosition($), J
    }
    this.tokenizer.setPosition($)
  }
  async unzip($) {
    const X = await this.readCentralDirectory()
    if (X) return this.iterateOverCentralDirectory(X, $)
    let Q = !1
    do {
      const J = await this.readLocalFileHeader()
      if (!J) break
      const Y = $(J)
      Q = !!Y.stop
      let Z = void 0
      if (
        (await this.tokenizer.ignore(J.extraFieldLength),
        J.dataDescriptor && J.compressedSize === 0)
      ) {
        let W = [],
          q = hJ
        c2("Compressed-file-size unknown, scanning for next data-descriptor-signature....")
        let M = -1
        while (M < 0 && q === hJ) {
          ;(q = await this.tokenizer.peekBuffer(this.syncBuffer, { mayBeLess: !0 })),
            (M = aH(this.syncBuffer.subarray(0, q), rH))
          const G = M >= 0 ? M : q
          if (Y.handler) {
            const B = new Uint8Array(G)
            await this.tokenizer.readBuffer(B), W.push(B)
          } else await this.tokenizer.ignore(G)
        }
        if ((c2(`Found data-descriptor-signature at pos=${this.tokenizer.position}`), Y.handler))
          await this.inflate(J, eH(W), Y.handler)
      } else if (Y.handler)
        c2(`Reading compressed-file-data: ${J.compressedSize} bytes`),
          (Z = new Uint8Array(J.compressedSize)),
          await this.tokenizer.readBuffer(Z),
          await this.inflate(J, Z, Y.handler)
      else
        c2(`Ignoring compressed-file-data: ${J.compressedSize} bytes`),
          await this.tokenizer.ignore(J.compressedSize)
      if ((c2(`Reading data-descriptor at pos=${this.tokenizer.position}`), J.dataDescriptor)) {
        if ((await this.tokenizer.readToken(dJ)).signature !== 134695760)
          throw Error(
            `Expected data-descriptor-signature at position ${this.tokenizer.position - dJ.len}`
          )
      }
    } while (!Q)
  }
  async iterateOverCentralDirectory($, X) {
    for (const Q of $) {
      const J = X(Q)
      if (J.handler) {
        this.tokenizer.setPosition(Q.relativeOffsetOfLocalHeader)
        const Y = await this.readLocalFileHeader()
        if (Y) {
          await this.tokenizer.ignore(Y.extraFieldLength)
          const Z = new Uint8Array(Q.compressedSize)
          await this.tokenizer.readBuffer(Z), await this.inflate(Y, Z, J.handler)
        }
      }
      if (J.stop) break
    }
  }
  inflate($, X, Q) {
    if ($.compressedMethod === 0) return Q(X)
    c2(`Decompress filename=${$.filename}, compressed-size=${X.length}`)
    const J = iW(X)
    return Q(J)
  }
  async readLocalFileHeader() {
    const $ = await this.tokenizer.peekToken(e0)
    if ($ === G8.LocalFileHeader) {
      const X = await this.tokenizer.readToken(eW)
      return (X.filename = await this.tokenizer.readToken(new s1(X.filenameLength, "utf-8"))), X
    }
    if ($ === G8.CentralFileHeader) return !1
    if ($ === 3759263696) throw Error("Encrypted ZIP")
    throw Error("Unexpected signature")
  }
}
function aH($, X) {
  const Q = $.length,
    J = X.length
  if (J > Q) return -1
  for (let Y = 0; Y <= Q - J; Y++) {
    let Z = !0
    for (let W = 0; W < J; W++)
      if ($[Y + W] !== X[W]) {
        Z = !1
        break
      }
    if (Z) return Y
  }
  return -1
}
function eH($) {
  let X = $.reduce((Y, Z) => Y + Z.length, 0),
    Q = new Uint8Array(X),
    J = 0
  for (const Y of $) Q.set(Y, J), (J += Y.length)
  return Q
}
var J5,
  c2,
  hJ = 262144,
  rH,
  aX
var Z5 = h0(() => {
  d6()
  nW()
  Q5()
  J5 = P8(aW(), 1)
  ;(c2 = J5.default("tokenizer:inflate")),
    (rH = Y5(G8.DataDescriptor)),
    (aX = Y5(G8.EndOfCentralDirectory))
})
function uJ($) {
  const { byteLength: X } = $
  if (X === 6) return $.getUint16(0) * 4294967296 + $.getUint32(2)
  if (X === 5) return $.getUint8(0) * 4294967296 + $.getUint32(1)
  if (X === 4) return $.getUint32(0)
  if (X === 3) return $.getUint8(0) * 65536 + $.getUint16(1)
  if (X === 2) return $.getUint16(0)
  if (X === 1) return $.getUint8(0)
}
var _hI, _mI, _uI
var W5 = h0(() => {
  ;(_hI = { utf8: new globalThis.TextDecoder("utf8") }),
    (_mI = new globalThis.TextEncoder()),
    (_uI = Array.from({ length: 256 }, (_$, X) => X.toString(16).padStart(2, "0")))
})
function q5($) {
  return [...$].map((X) => X.charCodeAt(0))
}
function M5($, X = 0) {
  const Q = Number.parseInt(new s1(6).get($, 148).replace(/\0.*$/, "").trim(), 8)
  if (Number.isNaN(Q)) return !1
  let J = 256
  for (let Y = X; Y < X + 148; Y++) J += $[Y]
  for (let Y = X + 156; Y < X + 512; Y++) J += $[Y]
  return Q === J
}
var B5
var G5 = h0(() => {
  d6()
  B5 = {
    get: ($, X) => ($[X + 3] & 127) | ($[X + 2] << 7) | ($[X + 1] << 14) | ($[X] << 21),
    len: 4,
  }
})
var N5, w5
var U5 = h0(() => {
  ;(N5 = [
    "jpg",
    "png",
    "apng",
    "gif",
    "webp",
    "flif",
    "xcf",
    "cr2",
    "cr3",
    "orf",
    "arw",
    "dng",
    "nef",
    "rw2",
    "raf",
    "tif",
    "bmp",
    "icns",
    "jxr",
    "psd",
    "indd",
    "zip",
    "tar",
    "rar",
    "gz",
    "bz2",
    "7z",
    "dmg",
    "mp4",
    "mid",
    "mkv",
    "webm",
    "mov",
    "avi",
    "mpg",
    "mp2",
    "mp3",
    "m4a",
    "oga",
    "ogg",
    "ogv",
    "opus",
    "flac",
    "wav",
    "spx",
    "amr",
    "pdf",
    "epub",
    "elf",
    "macho",
    "exe",
    "swf",
    "rtf",
    "wasm",
    "woff",
    "woff2",
    "eot",
    "ttf",
    "otf",
    "ttc",
    "ico",
    "flv",
    "ps",
    "xz",
    "sqlite",
    "nes",
    "crx",
    "xpi",
    "cab",
    "deb",
    "ar",
    "rpm",
    "Z",
    "lz",
    "cfb",
    "mxf",
    "mts",
    "blend",
    "bpg",
    "docx",
    "pptx",
    "xlsx",
    "3gp",
    "3g2",
    "j2c",
    "jp2",
    "jpm",
    "jpx",
    "mj2",
    "aif",
    "qcp",
    "odt",
    "ods",
    "odp",
    "xml",
    "mobi",
    "heic",
    "cur",
    "ktx",
    "ape",
    "wv",
    "dcm",
    "ics",
    "glb",
    "pcap",
    "dsf",
    "lnk",
    "alias",
    "voc",
    "ac3",
    "m4v",
    "m4p",
    "m4b",
    "f4v",
    "f4p",
    "f4b",
    "f4a",
    "mie",
    "asf",
    "ogm",
    "ogx",
    "mpc",
    "arrow",
    "shp",
    "aac",
    "mp1",
    "it",
    "s3m",
    "xm",
    "skp",
    "avif",
    "eps",
    "lzh",
    "pgp",
    "asar",
    "stl",
    "chm",
    "3mf",
    "zst",
    "jxl",
    "vcf",
    "jls",
    "pst",
    "dwg",
    "parquet",
    "class",
    "arj",
    "cpio",
    "ace",
    "avro",
    "icc",
    "fbx",
    "vsdx",
    "vtt",
    "apk",
    "drc",
    "lz4",
    "potx",
    "xltx",
    "dotx",
    "xltm",
    "ott",
    "ots",
    "otp",
    "odg",
    "otg",
    "xlsm",
    "docm",
    "dotm",
    "potm",
    "pptm",
    "jar",
    "rm",
    "ppsm",
    "ppsx",
  ]),
    (w5 = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/flif",
      "image/x-xcf",
      "image/x-canon-cr2",
      "image/x-canon-cr3",
      "image/tiff",
      "image/bmp",
      "image/vnd.ms-photo",
      "image/vnd.adobe.photoshop",
      "application/x-indesign",
      "application/epub+zip",
      "application/x-xpinstall",
      "application/vnd.ms-powerpoint.slideshow.macroenabled.12",
      "application/vnd.oasis.opendocument.text",
      "application/vnd.oasis.opendocument.spreadsheet",
      "application/vnd.oasis.opendocument.presentation",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
      "application/zip",
      "application/x-tar",
      "application/x-rar-compressed",
      "application/gzip",
      "application/x-bzip2",
      "application/x-7z-compressed",
      "application/x-apple-diskimage",
      "application/vnd.apache.arrow.file",
      "video/mp4",
      "audio/midi",
      "video/matroska",
      "video/webm",
      "video/quicktime",
      "video/vnd.avi",
      "audio/wav",
      "audio/qcelp",
      "audio/x-ms-asf",
      "video/x-ms-asf",
      "application/vnd.ms-asf",
      "video/mpeg",
      "video/3gpp",
      "audio/mpeg",
      "audio/mp4",
      "video/ogg",
      "audio/ogg",
      "audio/ogg; codecs=opus",
      "application/ogg",
      "audio/flac",
      "audio/ape",
      "audio/wavpack",
      "audio/amr",
      "application/pdf",
      "application/x-elf",
      "application/x-mach-binary",
      "application/x-msdownload",
      "application/x-shockwave-flash",
      "application/rtf",
      "application/wasm",
      "font/woff",
      "font/woff2",
      "application/vnd.ms-fontobject",
      "font/ttf",
      "font/otf",
      "font/collection",
      "image/x-icon",
      "video/x-flv",
      "application/postscript",
      "application/eps",
      "application/x-xz",
      "application/x-sqlite3",
      "application/x-nintendo-nes-rom",
      "application/x-google-chrome-extension",
      "application/vnd.ms-cab-compressed",
      "application/x-deb",
      "application/x-unix-archive",
      "application/x-rpm",
      "application/x-compress",
      "application/x-lzip",
      "application/x-cfb",
      "application/x-mie",
      "application/mxf",
      "video/mp2t",
      "application/x-blender",
      "image/bpg",
      "image/j2c",
      "image/jp2",
      "image/jpx",
      "image/jpm",
      "image/mj2",
      "audio/aiff",
      "application/xml",
      "application/x-mobipocket-ebook",
      "image/heif",
      "image/heif-sequence",
      "image/heic",
      "image/heic-sequence",
      "image/icns",
      "image/ktx",
      "application/dicom",
      "audio/x-musepack",
      "text/calendar",
      "text/vcard",
      "text/vtt",
      "model/gltf-binary",
      "application/vnd.tcpdump.pcap",
      "audio/x-dsf",
      "application/x.ms.shortcut",
      "application/x.apple.alias",
      "audio/x-voc",
      "audio/vnd.dolby.dd-raw",
      "audio/x-m4a",
      "image/apng",
      "image/x-olympus-orf",
      "image/x-sony-arw",
      "image/x-adobe-dng",
      "image/x-nikon-nef",
      "image/x-panasonic-rw2",
      "image/x-fujifilm-raf",
      "video/x-m4v",
      "video/3gpp2",
      "application/x-esri-shape",
      "audio/aac",
      "audio/x-it",
      "audio/x-s3m",
      "audio/x-xm",
      "video/MP1S",
      "video/MP2P",
      "application/vnd.sketchup.skp",
      "image/avif",
      "application/x-lzh-compressed",
      "application/pgp-encrypted",
      "application/x-asar",
      "model/stl",
      "application/vnd.ms-htmlhelp",
      "model/3mf",
      "image/jxl",
      "application/zstd",
      "image/jls",
      "application/vnd.ms-outlook",
      "image/vnd.dwg",
      "application/vnd.apache.parquet",
      "application/java-vm",
      "application/x-arj",
      "application/x-cpio",
      "application/x-ace-compressed",
      "application/avro",
      "application/vnd.iccprofile",
      "application/x.autodesk.fbx",
      "application/vnd.visio",
      "application/vnd.android.package-archive",
      "application/vnd.google.draco",
      "application/x-lz4",
      "application/vnd.openxmlformats-officedocument.presentationml.template",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
      "application/vnd.ms-excel.template.macroenabled.12",
      "application/vnd.oasis.opendocument.text-template",
      "application/vnd.oasis.opendocument.spreadsheet-template",
      "application/vnd.oasis.opendocument.presentation-template",
      "application/vnd.oasis.opendocument.graphics",
      "application/vnd.oasis.opendocument.graphics-template",
      "application/vnd.ms-excel.sheet.macroenabled.12",
      "application/vnd.ms-word.document.macroenabled.12",
      "application/vnd.ms-word.template.macroenabled.12",
      "application/vnd.ms-powerpoint.template.macroenabled.12",
      "application/vnd.ms-powerpoint.presentation.macroenabled.12",
      "application/java-archive",
      "application/vnd.rn-realmedia",
    ])
})
var z5 = {}
F$(z5, {
  supportedMimeTypes: () => WA,
  supportedExtensions: () => ZA,
  reasonableDetectionSizeInBytes: () => eX,
  fileTypeStream: () => YA,
  fileTypeFromTokenizer: () => JA,
  fileTypeFromStream: () => $A,
  fileTypeFromBuffer: () => XA,
  fileTypeFromBlob: () => QA,
  FileTypeParser: () => N8,
})
async function $A($, X) {
  return new N8(X).fromStream($)
}
async function XA($, X) {
  return new N8(X).fromBuffer($)
}
async function QA($, X) {
  return new N8(X).fromBlob($)
}
function cJ($) {
  switch ((($ = $.toLowerCase()), $)) {
    case "application/epub+zip":
      return { ext: "epub", mime: $ }
    case "application/vnd.oasis.opendocument.text":
      return { ext: "odt", mime: $ }
    case "application/vnd.oasis.opendocument.text-template":
      return { ext: "ott", mime: $ }
    case "application/vnd.oasis.opendocument.spreadsheet":
      return { ext: "ods", mime: $ }
    case "application/vnd.oasis.opendocument.spreadsheet-template":
      return { ext: "ots", mime: $ }
    case "application/vnd.oasis.opendocument.presentation":
      return { ext: "odp", mime: $ }
    case "application/vnd.oasis.opendocument.presentation-template":
      return { ext: "otp", mime: $ }
    case "application/vnd.oasis.opendocument.graphics":
      return { ext: "odg", mime: $ }
    case "application/vnd.oasis.opendocument.graphics-template":
      return { ext: "otg", mime: $ }
    case "application/vnd.openxmlformats-officedocument.presentationml.slideshow":
      return { ext: "ppsx", mime: $ }
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return { ext: "xlsx", mime: $ }
    case "application/vnd.ms-excel.sheet.macroenabled":
      return { ext: "xlsm", mime: "application/vnd.ms-excel.sheet.macroenabled.12" }
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.template":
      return { ext: "xltx", mime: $ }
    case "application/vnd.ms-excel.template.macroenabled":
      return { ext: "xltm", mime: "application/vnd.ms-excel.template.macroenabled.12" }
    case "application/vnd.ms-powerpoint.slideshow.macroenabled":
      return { ext: "ppsm", mime: "application/vnd.ms-powerpoint.slideshow.macroenabled.12" }
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return { ext: "docx", mime: $ }
    case "application/vnd.ms-word.document.macroenabled":
      return { ext: "docm", mime: "application/vnd.ms-word.document.macroenabled.12" }
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.template":
      return { ext: "dotx", mime: $ }
    case "application/vnd.ms-word.template.macroenabledtemplate":
      return { ext: "dotm", mime: "application/vnd.ms-word.template.macroenabled.12" }
    case "application/vnd.openxmlformats-officedocument.presentationml.template":
      return { ext: "potx", mime: $ }
    case "application/vnd.ms-powerpoint.template.macroenabled":
      return { ext: "potm", mime: "application/vnd.ms-powerpoint.template.macroenabled.12" }
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return { ext: "pptx", mime: $ }
    case "application/vnd.ms-powerpoint.presentation.macroenabled":
      return { ext: "pptm", mime: "application/vnd.ms-powerpoint.presentation.macroenabled.12" }
    case "application/vnd.ms-visio.drawing":
      return { ext: "vsdx", mime: "application/vnd.visio" }
    case "application/vnd.ms-package.3dmanufacturing-3dmodel+xml":
      return { ext: "3mf", mime: "model/3mf" }
    default:
  }
}
function p2($, X, Q) {
  Q = { offset: 0, ...Q }
  for (const [J, Y] of X.entries())
    if (Q.mask) {
      if (Y !== (Q.mask[J] & $[J + Q.offset])) return !1
    } else if (Y !== $[J + Q.offset]) return !1
  return !0
}
async function JA($, X) {
  return new N8(X).fromTokenizer($)
}
async function YA($, X) {
  return new N8(X).toDetectionStream($, X)
}
class N8 {
  constructor($) {
    ;(this.options = { mpegOffsetTolerance: 0, ...$ }),
      (this.detectors = [
        ...($?.customDetectors ?? []),
        { id: "core", detect: this.detectConfident },
        { id: "core.imprecise", detect: this.detectImprecise },
      ]),
      (this.tokenizerOptions = { abortSignal: $?.signal })
  }
  async fromTokenizer($) {
    const X = $.position
    for (const Q of this.detectors) {
      const J = await Q.detect($)
      if (J) return J
      if (X !== $.position) return
    }
  }
  async fromBuffer($) {
    if (!($ instanceof Uint8Array || $ instanceof ArrayBuffer))
      throw TypeError(
        `Expected the \`input\` argument to be of type \`Uint8Array\` or \`ArrayBuffer\`, got \`${typeof $}\``
      )
    const X = $ instanceof Uint8Array ? $ : new Uint8Array($)
    if (!(X?.length > 1)) return
    return this.fromTokenizer(fW(X, this.tokenizerOptions))
  }
  async fromBlob($) {
    return this.fromStream($.stream())
  }
  async fromStream($) {
    const X = await gW($, this.tokenizerOptions)
    try {
      return await this.fromTokenizer(X)
    } finally {
      await X.close()
    }
  }
  async toDetectionStream($, X) {
    let { sampleSize: Q = eX } = X,
      J,
      Y,
      Z = $.getReader({ mode: "byob" })
    try {
      const { value: M, done: G } = await Z.read(new Uint8Array(Q))
      if (((Y = M), !G && M))
        try {
          J = await this.fromBuffer(M.subarray(0, Q))
        } catch (B) {
          if (!(B instanceof l0)) throw B
          J = void 0
        }
      Y = M
    } finally {
      Z.releaseLock()
    }
    const W = new TransformStream({
        async start(M) {
          M.enqueue(Y)
        },
        transform(M, G) {
          G.enqueue(M)
        },
      }),
      q = $.pipeThrough(W)
    return (q.fileType = J), q
  }
  check($, X) {
    return p2(this.buffer, $, X)
  }
  checkString($, X) {
    return this.check(q5($), X)
  }
  detectConfident = async ($) => {
    if (((this.buffer = new Uint8Array(eX)), $.fileInfo.size === void 0))
      $.fileInfo.size = Number.MAX_SAFE_INTEGER
    if (
      ((this.tokenizer = $),
      await $.peekBuffer(this.buffer, { length: 12, mayBeLess: !0 }),
      this.check([66, 77]))
    )
      return { ext: "bmp", mime: "image/bmp" }
    if (this.check([11, 119])) return { ext: "ac3", mime: "audio/vnd.dolby.dd-raw" }
    if (this.check([120, 1])) return { ext: "dmg", mime: "application/x-apple-diskimage" }
    if (this.check([77, 90])) return { ext: "exe", mime: "application/x-msdownload" }
    if (this.check([37, 33])) {
      if (
        (await $.peekBuffer(this.buffer, { length: 24, mayBeLess: !0 }),
        this.checkString("PS-Adobe-", { offset: 2 }) && this.checkString(" EPSF-", { offset: 14 }))
      )
        return { ext: "eps", mime: "application/eps" }
      return { ext: "ps", mime: "application/postscript" }
    }
    if (this.check([31, 160]) || this.check([31, 157]))
      return { ext: "Z", mime: "application/x-compress" }
    if (this.check([199, 113])) return { ext: "cpio", mime: "application/x-cpio" }
    if (this.check([96, 234])) return { ext: "arj", mime: "application/x-arj" }
    if (this.check([239, 187, 191])) return this.tokenizer.ignore(3), this.detectConfident($)
    if (this.check([71, 73, 70])) return { ext: "gif", mime: "image/gif" }
    if (this.check([73, 73, 188])) return { ext: "jxr", mime: "image/vnd.ms-photo" }
    if (this.check([31, 139, 8])) return { ext: "gz", mime: "application/gzip" }
    if (this.check([66, 90, 104])) return { ext: "bz2", mime: "application/x-bzip2" }
    if (this.checkString("ID3")) {
      await $.ignore(6)
      const X = await $.readToken(B5)
      if ($.position + X > $.fileInfo.size) return { ext: "mp3", mime: "audio/mpeg" }
      return await $.ignore(X), this.fromTokenizer($)
    }
    if (this.checkString("MP+")) return { ext: "mpc", mime: "audio/x-musepack" }
    if ((this.buffer[0] === 67 || this.buffer[0] === 70) && this.check([87, 83], { offset: 1 }))
      return { ext: "swf", mime: "application/x-shockwave-flash" }
    if (this.check([255, 216, 255])) {
      if (this.check([247], { offset: 3 })) return { ext: "jls", mime: "image/jls" }
      return { ext: "jpg", mime: "image/jpeg" }
    }
    if (this.check([79, 98, 106, 1])) return { ext: "avro", mime: "application/avro" }
    if (this.checkString("FLIF")) return { ext: "flif", mime: "image/flif" }
    if (this.checkString("8BPS")) return { ext: "psd", mime: "image/vnd.adobe.photoshop" }
    if (this.checkString("MPCK")) return { ext: "mpc", mime: "audio/x-musepack" }
    if (this.checkString("FORM")) return { ext: "aif", mime: "audio/aiff" }
    if (this.checkString("icns", { offset: 0 })) return { ext: "icns", mime: "image/icns" }
    if (this.check([80, 75, 3, 4])) {
      let X
      return (
        await new mJ($).unzip((Q) => {
          switch (Q.filename) {
            case "META-INF/mozilla.rsa":
              return (X = { ext: "xpi", mime: "application/x-xpinstall" }), { stop: !0 }
            case "META-INF/MANIFEST.MF":
              return (X = { ext: "jar", mime: "application/java-archive" }), { stop: !0 }
            case "mimetype":
              return {
                async handler(J) {
                  const Y = new TextDecoder("utf-8").decode(J).trim()
                  X = cJ(Y)
                },
                stop: !0,
              }
            case "[Content_Types].xml":
              return {
                async handler(J) {
                  let Y = new TextDecoder("utf-8").decode(J),
                    Z = Y.indexOf('.main+xml"')
                  if (Z === -1) {
                    if (
                      Y.includes(
                        'ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"'
                      )
                    )
                      X = cJ("application/vnd.ms-package.3dmanufacturing-3dmodel+xml")
                  } else {
                    Y = Y.slice(0, Math.max(0, Z))
                    const W = Y.lastIndexOf('"'),
                      q = Y.slice(Math.max(0, W + 1))
                    X = cJ(q)
                  }
                },
                stop: !0,
              }
            default:
              if (/classes\d*\.dex/.test(Q.filename))
                return (
                  (X = { ext: "apk", mime: "application/vnd.android.package-archive" }),
                  { stop: !0 }
                )
              return {}
          }
        }),
        X ?? { ext: "zip", mime: "application/zip" }
      )
    }
    if (this.checkString("OggS")) {
      await $.ignore(28)
      const X = new Uint8Array(8)
      if ((await $.readBuffer(X), p2(X, [79, 112, 117, 115, 72, 101, 97, 100])))
        return { ext: "opus", mime: "audio/ogg; codecs=opus" }
      if (p2(X, [128, 116, 104, 101, 111, 114, 97])) return { ext: "ogv", mime: "video/ogg" }
      if (p2(X, [1, 118, 105, 100, 101, 111, 0])) return { ext: "ogm", mime: "video/ogg" }
      if (p2(X, [127, 70, 76, 65, 67])) return { ext: "oga", mime: "audio/ogg" }
      if (p2(X, [83, 112, 101, 101, 120, 32, 32])) return { ext: "spx", mime: "audio/ogg" }
      if (p2(X, [1, 118, 111, 114, 98, 105, 115])) return { ext: "ogg", mime: "audio/ogg" }
      return { ext: "ogx", mime: "application/ogg" }
    }
    if (
      this.check([80, 75]) &&
      (this.buffer[2] === 3 || this.buffer[2] === 5 || this.buffer[2] === 7) &&
      (this.buffer[3] === 4 || this.buffer[3] === 6 || this.buffer[3] === 8)
    )
      return { ext: "zip", mime: "application/zip" }
    if (this.checkString("MThd")) return { ext: "mid", mime: "audio/midi" }
    if (
      this.checkString("wOFF") &&
      (this.check([0, 1, 0, 0], { offset: 4 }) || this.checkString("OTTO", { offset: 4 }))
    )
      return { ext: "woff", mime: "font/woff" }
    if (
      this.checkString("wOF2") &&
      (this.check([0, 1, 0, 0], { offset: 4 }) || this.checkString("OTTO", { offset: 4 }))
    )
      return { ext: "woff2", mime: "font/woff2" }
    if (this.check([212, 195, 178, 161]) || this.check([161, 178, 195, 212]))
      return { ext: "pcap", mime: "application/vnd.tcpdump.pcap" }
    if (this.checkString("DSD ")) return { ext: "dsf", mime: "audio/x-dsf" }
    if (this.checkString("LZIP")) return { ext: "lz", mime: "application/x-lzip" }
    if (this.checkString("fLaC")) return { ext: "flac", mime: "audio/flac" }
    if (this.check([66, 80, 71, 251])) return { ext: "bpg", mime: "image/bpg" }
    if (this.checkString("wvpk")) return { ext: "wv", mime: "audio/wavpack" }
    if (this.checkString("%PDF")) return { ext: "pdf", mime: "application/pdf" }
    if (this.check([0, 97, 115, 109])) return { ext: "wasm", mime: "application/wasm" }
    if (this.check([73, 73])) {
      const X = await this.readTiffHeader(!1)
      if (X) return X
    }
    if (this.check([77, 77])) {
      const X = await this.readTiffHeader(!0)
      if (X) return X
    }
    if (this.checkString("MAC ")) return { ext: "ape", mime: "audio/ape" }
    if (this.check([26, 69, 223, 163])) {
      async function X() {
        let W = await $.peekNumber(FW),
          q = 128,
          M = 0
        while ((W & q) === 0 && q !== 0) ++M, (q >>= 1)
        const G = new Uint8Array(M + 1)
        return await $.readBuffer(G), G
      }
      async function Q() {
        const W = await X(),
          q = await X()
        q[0] ^= 128 >> (q.length - 1)
        const M = Math.min(6, q.length),
          G = new DataView(W.buffer),
          B = new DataView(q.buffer, q.length - M, M)
        return { id: uJ(G), len: uJ(B) }
      }
      async function J(W) {
        while (W > 0) {
          const q = await Q()
          if (q.id === 17026) return (await $.readToken(new s1(q.len))).replaceAll(/\00.*$/g, "")
          await $.ignore(q.len), --W
        }
      }
      const Y = await Q()
      switch (await J(Y.len)) {
        case "webm":
          return { ext: "webm", mime: "video/webm" }
        case "matroska":
          return { ext: "mkv", mime: "video/matroska" }
        default:
          return
      }
    }
    if (this.checkString("SQLi")) return { ext: "sqlite", mime: "application/x-sqlite3" }
    if (this.check([78, 69, 83, 26])) return { ext: "nes", mime: "application/x-nintendo-nes-rom" }
    if (this.checkString("Cr24"))
      return { ext: "crx", mime: "application/x-google-chrome-extension" }
    if (this.checkString("MSCF") || this.checkString("ISc("))
      return { ext: "cab", mime: "application/vnd.ms-cab-compressed" }
    if (this.check([237, 171, 238, 219])) return { ext: "rpm", mime: "application/x-rpm" }
    if (this.check([197, 208, 211, 198])) return { ext: "eps", mime: "application/eps" }
    if (this.check([40, 181, 47, 253])) return { ext: "zst", mime: "application/zstd" }
    if (this.check([127, 69, 76, 70])) return { ext: "elf", mime: "application/x-elf" }
    if (this.check([33, 66, 68, 78])) return { ext: "pst", mime: "application/vnd.ms-outlook" }
    if (this.checkString("PAR1") || this.checkString("PARE"))
      return { ext: "parquet", mime: "application/vnd.apache.parquet" }
    if (this.checkString("ttcf")) return { ext: "ttc", mime: "font/collection" }
    if (this.check([207, 250, 237, 254])) return { ext: "macho", mime: "application/x-mach-binary" }
    if (this.check([4, 34, 77, 24])) return { ext: "lz4", mime: "application/x-lz4" }
    if (this.check([79, 84, 84, 79, 0])) return { ext: "otf", mime: "font/otf" }
    if (this.checkString("#!AMR")) return { ext: "amr", mime: "audio/amr" }
    if (this.checkString("{\\rtf")) return { ext: "rtf", mime: "application/rtf" }
    if (this.check([70, 76, 86, 1])) return { ext: "flv", mime: "video/x-flv" }
    if (this.checkString("IMPM")) return { ext: "it", mime: "audio/x-it" }
    if (
      this.checkString("-lh0-", { offset: 2 }) ||
      this.checkString("-lh1-", { offset: 2 }) ||
      this.checkString("-lh2-", { offset: 2 }) ||
      this.checkString("-lh3-", { offset: 2 }) ||
      this.checkString("-lh4-", { offset: 2 }) ||
      this.checkString("-lh5-", { offset: 2 }) ||
      this.checkString("-lh6-", { offset: 2 }) ||
      this.checkString("-lh7-", { offset: 2 }) ||
      this.checkString("-lzs-", { offset: 2 }) ||
      this.checkString("-lz4-", { offset: 2 }) ||
      this.checkString("-lz5-", { offset: 2 }) ||
      this.checkString("-lhd-", { offset: 2 })
    )
      return { ext: "lzh", mime: "application/x-lzh-compressed" }
    if (this.check([0, 0, 1, 186])) {
      if (this.check([33], { offset: 4, mask: [241] })) return { ext: "mpg", mime: "video/MP1S" }
      if (this.check([68], { offset: 4, mask: [196] })) return { ext: "mpg", mime: "video/MP2P" }
    }
    if (this.checkString("ITSF")) return { ext: "chm", mime: "application/vnd.ms-htmlhelp" }
    if (this.check([202, 254, 186, 190])) return { ext: "class", mime: "application/java-vm" }
    if (this.checkString(".RMF")) return { ext: "rm", mime: "application/vnd.rn-realmedia" }
    if (this.checkString("DRACO")) return { ext: "drc", mime: "application/vnd.google.draco" }
    if (this.check([253, 55, 122, 88, 90, 0])) return { ext: "xz", mime: "application/x-xz" }
    if (this.checkString("<?xml ")) return { ext: "xml", mime: "application/xml" }
    if (this.check([55, 122, 188, 175, 39, 28]))
      return { ext: "7z", mime: "application/x-7z-compressed" }
    if (this.check([82, 97, 114, 33, 26, 7]) && (this.buffer[6] === 0 || this.buffer[6] === 1))
      return { ext: "rar", mime: "application/x-rar-compressed" }
    if (this.checkString("solid ")) return { ext: "stl", mime: "model/stl" }
    if (this.checkString("AC")) {
      const X = new s1(4, "latin1").get(this.buffer, 2)
      if (X.match("^d*") && X >= 1000 && X <= 1050) return { ext: "dwg", mime: "image/vnd.dwg" }
    }
    if (this.checkString("070707")) return { ext: "cpio", mime: "application/x-cpio" }
    if (this.checkString("BLENDER")) return { ext: "blend", mime: "application/x-blender" }
    if (this.checkString("!<arch>")) {
      if ((await $.ignore(8), (await $.readToken(new s1(13, "ascii"))) === "debian-binary"))
        return { ext: "deb", mime: "application/x-deb" }
      return { ext: "ar", mime: "application/x-unix-archive" }
    }
    if (
      this.checkString("WEBVTT") &&
      [
        `
`,
        "\r",
        "\t",
        " ",
        "\x00",
      ].some((X) => this.checkString(X, { offset: 6 }))
    )
      return { ext: "vtt", mime: "text/vtt" }
    if (this.check([137, 80, 78, 71, 13, 10, 26, 10])) {
      await $.ignore(8)
      async function X() {
        return { length: await $.readToken(VW), type: await $.readToken(new s1(4, "latin1")) }
      }
      do {
        const Q = await X()
        if (Q.length < 0) return
        switch (Q.type) {
          case "IDAT":
            return { ext: "png", mime: "image/png" }
          case "acTL":
            return { ext: "apng", mime: "image/apng" }
          default:
            await $.ignore(Q.length + 4)
        }
      } while ($.position + 8 < $.fileInfo.size)
      return { ext: "png", mime: "image/png" }
    }
    if (this.check([65, 82, 82, 79, 87, 49, 0, 0]))
      return { ext: "arrow", mime: "application/vnd.apache.arrow.file" }
    if (this.check([103, 108, 84, 70, 2, 0, 0, 0])) return { ext: "glb", mime: "model/gltf-binary" }
    if (
      this.check([102, 114, 101, 101], { offset: 4 }) ||
      this.check([109, 100, 97, 116], { offset: 4 }) ||
      this.check([109, 111, 111, 118], { offset: 4 }) ||
      this.check([119, 105, 100, 101], { offset: 4 })
    )
      return { ext: "mov", mime: "video/quicktime" }
    if (this.check([73, 73, 82, 79, 8, 0, 0, 0, 24]))
      return { ext: "orf", mime: "image/x-olympus-orf" }
    if (this.checkString("gimp xcf ")) return { ext: "xcf", mime: "image/x-xcf" }
    if (this.checkString("ftyp", { offset: 4 }) && (this.buffer[8] & 96) !== 0) {
      const X = new s1(4, "latin1").get(this.buffer, 8).replace("\x00", " ").trim()
      switch (X) {
        case "avif":
        case "avis":
          return { ext: "avif", mime: "image/avif" }
        case "mif1":
          return { ext: "heic", mime: "image/heif" }
        case "msf1":
          return { ext: "heic", mime: "image/heif-sequence" }
        case "heic":
        case "heix":
          return { ext: "heic", mime: "image/heic" }
        case "hevc":
        case "hevx":
          return { ext: "heic", mime: "image/heic-sequence" }
        case "qt":
          return { ext: "mov", mime: "video/quicktime" }
        case "M4V":
        case "M4VH":
        case "M4VP":
          return { ext: "m4v", mime: "video/x-m4v" }
        case "M4P":
          return { ext: "m4p", mime: "video/mp4" }
        case "M4B":
          return { ext: "m4b", mime: "audio/mp4" }
        case "M4A":
          return { ext: "m4a", mime: "audio/x-m4a" }
        case "F4V":
          return { ext: "f4v", mime: "video/mp4" }
        case "F4P":
          return { ext: "f4p", mime: "video/mp4" }
        case "F4A":
          return { ext: "f4a", mime: "audio/mp4" }
        case "F4B":
          return { ext: "f4b", mime: "audio/mp4" }
        case "crx":
          return { ext: "cr3", mime: "image/x-canon-cr3" }
        default:
          if (X.startsWith("3g")) {
            if (X.startsWith("3g2")) return { ext: "3g2", mime: "video/3gpp2" }
            return { ext: "3gp", mime: "video/3gpp" }
          }
          return { ext: "mp4", mime: "video/mp4" }
      }
    }
    if (this.check([82, 73, 70, 70])) {
      if (this.checkString("WEBP", { offset: 8 })) return { ext: "webp", mime: "image/webp" }
      if (this.check([65, 86, 73], { offset: 8 })) return { ext: "avi", mime: "video/vnd.avi" }
      if (this.check([87, 65, 86, 69], { offset: 8 })) return { ext: "wav", mime: "audio/wav" }
      if (this.check([81, 76, 67, 77], { offset: 8 })) return { ext: "qcp", mime: "audio/qcelp" }
    }
    if (this.check([73, 73, 85, 0, 24, 0, 0, 0, 136, 231, 116, 216]))
      return { ext: "rw2", mime: "image/x-panasonic-rw2" }
    if (this.check([48, 38, 178, 117, 142, 102, 207, 17, 166, 217])) {
      async function X() {
        const Q = new Uint8Array(16)
        return await $.readBuffer(Q), { id: Q, size: Number(await $.readToken(_W)) }
      }
      await $.ignore(30)
      while ($.position + 24 < $.fileInfo.size) {
        let Q = await X(),
          J = Q.size - 24
        if (p2(Q.id, [145, 7, 220, 183, 183, 169, 207, 17, 142, 230, 0, 192, 12, 32, 83, 101])) {
          const Y = new Uint8Array(16)
          if (
            ((J -= await $.readBuffer(Y)),
            p2(Y, [64, 158, 105, 248, 77, 91, 207, 17, 168, 253, 0, 128, 95, 92, 68, 43]))
          )
            return { ext: "asf", mime: "audio/x-ms-asf" }
          if (p2(Y, [192, 239, 25, 188, 77, 91, 207, 17, 168, 253, 0, 128, 95, 92, 68, 43]))
            return { ext: "asf", mime: "video/x-ms-asf" }
          break
        }
        await $.ignore(J)
      }
      return { ext: "asf", mime: "application/vnd.ms-asf" }
    }
    if (this.check([171, 75, 84, 88, 32, 49, 49, 187, 13, 10, 26, 10]))
      return { ext: "ktx", mime: "image/ktx" }
    if (
      (this.check([126, 16, 4]) || this.check([126, 24, 4])) &&
      this.check([48, 77, 73, 69], { offset: 4 })
    )
      return { ext: "mie", mime: "application/x-mie" }
    if (this.check([39, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], { offset: 2 }))
      return { ext: "shp", mime: "application/x-esri-shape" }
    if (this.check([255, 79, 255, 81])) return { ext: "j2c", mime: "image/j2c" }
    if (this.check([0, 0, 0, 12, 106, 80, 32, 32, 13, 10, 135, 10]))
      switch ((await $.ignore(20), await $.readToken(new s1(4, "ascii")))) {
        case "jp2 ":
          return { ext: "jp2", mime: "image/jp2" }
        case "jpx ":
          return { ext: "jpx", mime: "image/jpx" }
        case "jpm ":
          return { ext: "jpm", mime: "image/jpm" }
        case "mjp2":
          return { ext: "mj2", mime: "image/mj2" }
        default:
          return
      }
    if (this.check([255, 10]) || this.check([0, 0, 0, 12, 74, 88, 76, 32, 13, 10, 135, 10]))
      return { ext: "jxl", mime: "image/jxl" }
    if (this.check([254, 255])) {
      if (this.check([0, 60, 0, 63, 0, 120, 0, 109, 0, 108], { offset: 2 }))
        return { ext: "xml", mime: "application/xml" }
      return
    }
    if (this.check([208, 207, 17, 224, 161, 177, 26, 225]))
      return { ext: "cfb", mime: "application/x-cfb" }
    if (
      (await $.peekBuffer(this.buffer, { length: Math.min(256, $.fileInfo.size), mayBeLess: !0 }),
      this.check([97, 99, 115, 112], { offset: 36 }))
    )
      return { ext: "icc", mime: "application/vnd.iccprofile" }
    if (this.checkString("**ACE", { offset: 7 }) && this.checkString("**", { offset: 12 }))
      return { ext: "ace", mime: "application/x-ace-compressed" }
    if (this.checkString("BEGIN:")) {
      if (this.checkString("VCARD", { offset: 6 })) return { ext: "vcf", mime: "text/vcard" }
      if (this.checkString("VCALENDAR", { offset: 6 })) return { ext: "ics", mime: "text/calendar" }
    }
    if (this.checkString("FUJIFILMCCD-RAW")) return { ext: "raf", mime: "image/x-fujifilm-raf" }
    if (this.checkString("Extended Module:")) return { ext: "xm", mime: "audio/x-xm" }
    if (this.checkString("Creative Voice File")) return { ext: "voc", mime: "audio/x-voc" }
    if (this.check([4, 0, 0, 0]) && this.buffer.length >= 16) {
      const X = new DataView(this.buffer.buffer).getUint32(12, !0)
      if (X > 12 && this.buffer.length >= X + 16)
        try {
          const Q = new TextDecoder().decode(this.buffer.subarray(16, X + 16))
          if (JSON.parse(Q).files) return { ext: "asar", mime: "application/x-asar" }
        } catch {}
    }
    if (this.check([6, 14, 43, 52, 2, 5, 1, 1, 13, 1, 2, 1, 1, 2]))
      return { ext: "mxf", mime: "application/mxf" }
    if (this.checkString("SCRM", { offset: 44 })) return { ext: "s3m", mime: "audio/x-s3m" }
    if (this.check([71]) && this.check([71], { offset: 188 }))
      return { ext: "mts", mime: "video/mp2t" }
    if (this.check([71], { offset: 4 }) && this.check([71], { offset: 196 }))
      return { ext: "mts", mime: "video/mp2t" }
    if (this.check([66, 79, 79, 75, 77, 79, 66, 73], { offset: 60 }))
      return { ext: "mobi", mime: "application/x-mobipocket-ebook" }
    if (this.check([68, 73, 67, 77], { offset: 128 }))
      return { ext: "dcm", mime: "application/dicom" }
    if (this.check([76, 0, 0, 0, 1, 20, 2, 0, 0, 0, 0, 0, 192, 0, 0, 0, 0, 0, 0, 70]))
      return { ext: "lnk", mime: "application/x.ms.shortcut" }
    if (this.check([98, 111, 111, 107, 0, 0, 0, 0, 109, 97, 114, 107, 0, 0, 0, 0]))
      return { ext: "alias", mime: "application/x.apple.alias" }
    if (this.checkString("Kaydara FBX Binary  \x00"))
      return { ext: "fbx", mime: "application/x.autodesk.fbx" }
    if (
      this.check([76, 80], { offset: 34 }) &&
      (this.check([0, 0, 1], { offset: 8 }) ||
        this.check([1, 0, 2], { offset: 8 }) ||
        this.check([2, 0, 2], { offset: 8 }))
    )
      return { ext: "eot", mime: "application/vnd.ms-fontobject" }
    if (this.check([6, 6, 237, 245, 216, 29, 70, 229, 189, 49, 239, 231, 254, 116, 183, 29]))
      return { ext: "indd", mime: "application/x-indesign" }
    if (
      (await $.peekBuffer(this.buffer, { length: Math.min(512, $.fileInfo.size), mayBeLess: !0 }),
      (this.checkString("ustar", { offset: 257 }) &&
        (this.checkString("\x00", { offset: 262 }) || this.checkString(" ", { offset: 262 }))) ||
        (this.check([0, 0, 0, 0, 0, 0], { offset: 257 }) && M5(this.buffer)))
    )
      return { ext: "tar", mime: "application/x-tar" }
    if (this.check([255, 254])) {
      if (this.check([60, 0, 63, 0, 120, 0, 109, 0, 108, 0], { offset: 2 }))
        return { ext: "xml", mime: "application/xml" }
      if (
        this.check(
          [
            255, 14, 83, 0, 107, 0, 101, 0, 116, 0, 99, 0, 104, 0, 85, 0, 112, 0, 32, 0, 77, 0, 111,
            0, 100, 0, 101, 0, 108, 0,
          ],
          { offset: 2 }
        )
      )
        return { ext: "skp", mime: "application/vnd.sketchup.skp" }
      return
    }
    if (this.checkString("-----BEGIN PGP MESSAGE-----"))
      return { ext: "pgp", mime: "application/pgp-encrypted" }
  }
  detectImprecise = async ($) => {
    if (
      ((this.buffer = new Uint8Array(eX)),
      await $.peekBuffer(this.buffer, { length: Math.min(8, $.fileInfo.size), mayBeLess: !0 }),
      this.check([0, 0, 1, 186]) || this.check([0, 0, 1, 179]))
    )
      return { ext: "mpg", mime: "video/mpeg" }
    if (this.check([0, 1, 0, 0, 0])) return { ext: "ttf", mime: "font/ttf" }
    if (this.check([0, 0, 1, 0])) return { ext: "ico", mime: "image/x-icon" }
    if (this.check([0, 0, 2, 0])) return { ext: "cur", mime: "image/x-icon" }
    if (
      (await $.peekBuffer(this.buffer, {
        length: Math.min(2 + this.options.mpegOffsetTolerance, $.fileInfo.size),
        mayBeLess: !0,
      }),
      this.buffer.length >= 2 + this.options.mpegOffsetTolerance)
    )
      for (let X = 0; X <= this.options.mpegOffsetTolerance; ++X) {
        const Q = this.scanMpeg(X)
        if (Q) return Q
      }
  }
  async readTiffTag($) {
    const X = await this.tokenizer.readToken($ ? s8 : v0)
    switch ((this.tokenizer.ignore(10), X)) {
      case 50341:
        return { ext: "arw", mime: "image/x-sony-arw" }
      case 50706:
        return { ext: "dng", mime: "image/x-adobe-dng" }
      default:
    }
  }
  async readTiffIFD($) {
    const X = await this.tokenizer.readToken($ ? s8 : v0)
    for (let Q = 0; Q < X; ++Q) {
      const J = await this.readTiffTag($)
      if (J) return J
    }
  }
  async readTiffHeader($) {
    const X = ($ ? s8 : v0).get(this.buffer, 2),
      Q = ($ ? RW : e0).get(this.buffer, 4)
    if (X === 42) {
      if (Q >= 6) {
        if (this.checkString("CR", { offset: 8 })) return { ext: "cr2", mime: "image/x-canon-cr2" }
        if (Q >= 8) {
          const Y = ($ ? s8 : v0).get(this.buffer, 8),
            Z = ($ ? s8 : v0).get(this.buffer, 10)
          if ((Y === 28 && Z === 254) || (Y === 31 && Z === 11))
            return { ext: "nef", mime: "image/x-nikon-nef" }
        }
      }
      return (
        await this.tokenizer.ignore(Q),
        (await this.readTiffIFD($)) ?? { ext: "tif", mime: "image/tiff" }
      )
    }
    if (X === 43) return { ext: "tif", mime: "image/tiff" }
  }
  scanMpeg($) {
    if (this.check([255, 224], { offset: $, mask: [255, 224] })) {
      if (this.check([16], { offset: $ + 1, mask: [22] })) {
        if (this.check([8], { offset: $ + 1, mask: [8] })) return { ext: "aac", mime: "audio/aac" }
        return { ext: "aac", mime: "audio/aac" }
      }
      if (this.check([2], { offset: $ + 1, mask: [6] })) return { ext: "mp3", mime: "audio/mpeg" }
      if (this.check([4], { offset: $ + 1, mask: [6] })) return { ext: "mp2", mime: "audio/mpeg" }
      if (this.check([6], { offset: $ + 1, mask: [6] })) return { ext: "mp1", mime: "audio/mpeg" }
    }
  }
}
var eX = 4100,
  ZA,
  WA
var H5 = h0(() => {
  d6()
  yW()
  Z5()
  W5()
  G5()
  U5()
  ;(ZA = new Set(N5)), (WA = new Set(w5))
})
var _5 = U6((V5) => {
  Object.defineProperty(V5, "__esModule", { value: !0 })
  V5.parse = kA
  V5.serialize = gA
  var _A = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/,
    EA = /^[\u0021-\u003A\u003C-\u007E]*$/,
    xA = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i,
    IA = /^[\u0020-\u003A\u003D-\u007E]*$/,
    TA = Object.prototype.toString,
    bA = (() => {
      const $ = () => {}
      return ($.prototype = Object.create(null)), $
    })()
  function kA($, X) {
    const Q = new bA(),
      J = $.length
    if (J < 2) return Q
    let Y = X?.decode || fA,
      Z = 0
    do {
      const W = $.indexOf("=", Z)
      if (W === -1) break
      const q = $.indexOf(";", Z),
        M = q === -1 ? J : q
      if (W > M) {
        Z = $.lastIndexOf(";", W - 1) + 1
        continue
      }
      const G = F5($, Z, W),
        B = R5($, W, G),
        N = $.slice(G, B)
      if (Q[N] === void 0) {
        const P = F5($, W + 1, M),
          w = R5($, M, P),
          H = Y($.slice(P, w))
        Q[N] = H
      }
      Z = M + 1
    } while (Z < J)
    return Q
  }
  function F5($, X, Q) {
    do {
      const J = $.charCodeAt(X)
      if (J !== 32 && J !== 9) return X
    } while (++X < Q)
    return Q
  }
  function R5($, X, Q) {
    while (X > Q) {
      const J = $.charCodeAt(--X)
      if (J !== 32 && J !== 9) return X + 1
    }
    return Q
  }
  function gA($, X, Q) {
    const J = Q?.encode || encodeURIComponent
    if (!_A.test($)) throw TypeError(`argument name is invalid: ${$}`)
    const Y = J(X)
    if (!EA.test(Y)) throw TypeError(`argument val is invalid: ${X}`)
    let Z = `${$}=${Y}`
    if (!Q) return Z
    if (Q.maxAge !== void 0) {
      if (!Number.isInteger(Q.maxAge)) throw TypeError(`option maxAge is invalid: ${Q.maxAge}`)
      Z += `; Max-Age=${Q.maxAge}`
    }
    if (Q.domain) {
      if (!xA.test(Q.domain)) throw TypeError(`option domain is invalid: ${Q.domain}`)
      Z += `; Domain=${Q.domain}`
    }
    if (Q.path) {
      if (!IA.test(Q.path)) throw TypeError(`option path is invalid: ${Q.path}`)
      Z += `; Path=${Q.path}`
    }
    if (Q.expires) {
      if (!yA(Q.expires) || !Number.isFinite(Q.expires.valueOf()))
        throw TypeError(`option expires is invalid: ${Q.expires}`)
      Z += `; Expires=${Q.expires.toUTCString()}`
    }
    if (Q.httpOnly) Z += "; HttpOnly"
    if (Q.secure) Z += "; Secure"
    if (Q.partitioned) Z += "; Partitioned"
    if (Q.priority)
      switch (typeof Q.priority === "string" ? Q.priority.toLowerCase() : void 0) {
        case "low":
          Z += "; Priority=Low"
          break
        case "medium":
          Z += "; Priority=Medium"
          break
        case "high":
          Z += "; Priority=High"
          break
        default:
          throw TypeError(`option priority is invalid: ${Q.priority}`)
      }
    if (Q.sameSite)
      switch (typeof Q.sameSite === "string" ? Q.sameSite.toLowerCase() : Q.sameSite) {
        case !0:
        case "strict":
          Z += "; SameSite=Strict"
          break
        case "lax":
          Z += "; SameSite=Lax"
          break
        case "none":
          Z += "; SameSite=None"
          break
        default:
          throw TypeError(`option sameSite is invalid: ${Q.sameSite}`)
      }
    return Z
  }
  function fA($) {
    if ($.indexOf("%") === -1) return $
    try {
      return decodeURIComponent($)
    } catch (_X) {
      return $
    }
  }
  function yA($) {
    return TA.call($) === "[object Date]"
  }
})
var FQ = {
  name: "DockStacks",
  description:
    "This Plugin allows for deploying so called stacks. Stacks are prebuilt docker compose file, with tempplating and plugin support",
  repository: "its4nik/dockstat:dev/apps/dockstore",
  version: "1.0.0",
  tags: ["compose", "management"],
  author: {
    email: "info@itsnik.de",
    license: "MIT",
    name: "Its4Nik",
    website: "https://github.com/Its4Nik",
  },
  manifest: "src/content/plugins/dockstacks/manifest.yml",
  repoType: "github",
}
var L8 = ($, X) => {
    const Q = X?.length ? {} : null
    if (Q) for (const J of X) Q[J.part.charCodeAt(0)] = J
    return { part: $, store: null, inert: Q, params: null, wildcardStore: null }
  },
  qY = ($, X) => ({ ...$, part: X }),
  MY = ($) => ({ name: $, store: null, inert: null }),
  RQ = class $ {
    constructor(X = {}) {
      if (((this.config = X), X.lazy)) this.find = this.lazyFind
      if (X.onParam && !Array.isArray(X.onParam)) this.config.onParam = [this.config.onParam]
    }
    root = {}
    history = []
    deferred = []
    static regex = {
      static: /:.+?(?=\/|$)/,
      params: /:.+?(?=\/|$)/g,
      optionalParams: /(\/:\w+\?)/g,
    }
    lazyFind = (X, Q) => {
      if (!this.config.lazy) return this.find
      return this.build(), this.find(X, Q)
    }
    build() {
      if (!this.config.lazy) return
      for (const [X, Q, J] of this.deferred) this.add(X, Q, J, { lazy: !1, ignoreHistory: !0 })
      ;(this.deferred = []),
        (this.find = (X, Q) => {
          const J = this.root[X]
          if (!J) return null
          return XX(Q, Q.length, J, 0, this.config.onParam)
        })
    }
    add(X, Q, J, { ignoreError: Y = !1, ignoreHistory: Z = !1, lazy: W = this.config.lazy } = {}) {
      if (W) return (this.find = this.lazyFind), this.deferred.push([X, Q, J]), J
      if (typeof Q !== "string") throw TypeError("Route path must be a string")
      if (Q === "") Q = "/"
      else if (Q[0] !== "/") Q = `/${Q}`
      const q = Q[Q.length - 1] === "*",
        M = Q.match($.regex.optionalParams)
      if (M) {
        const w = Q.replaceAll("?", "")
        this.add(X, w, J, { ignoreError: Y, ignoreHistory: Z, lazy: W })
        for (let H = 0; H < M.length; H++) {
          const A = Q.replace(M[H], "")
          this.add(X, A, J, { ignoreError: !0, ignoreHistory: Z, lazy: W })
        }
        return J
      }
      if (M) Q = Q.replaceAll("?", "")
      if (this.history.find(([w, H, _A]) => w === X && H === Q)) return J
      if (q || (M && Q.charCodeAt(Q.length - 1) === 63)) Q = Q.slice(0, -1)
      if (!Z) this.history.push([X, Q, J])
      const G = Q.split($.regex.static),
        B = Q.match($.regex.params) || []
      if (G[G.length - 1] === "") G.pop()
      let N
      if (!this.root[X]) N = this.root[X] = L8("/")
      else N = this.root[X]
      let P = 0
      for (let w = 0; w < G.length; ++w) {
        let H = G[w]
        if (w > 0) {
          const A = B[P++].slice(1)
          if (N.params === null) N.params = MY(A)
          else if (N.params.name !== A)
            if (Y) return J
            else
              throw Error(
                `Cannot create route "${Q}" with parameter "${A}" because a route already exists with a different parameter name ("${N.params.name}") in the same location`
              )
          const S = N.params
          if (S.inert === null) {
            N = S.inert = L8(H)
            continue
          }
          N = S.inert
        }
        for (let A = 0; ; ) {
          if (A === H.length) {
            if (A < N.part.length) {
              const S = qY(N, N.part.slice(A))
              Object.assign(N, L8(H, [S]))
            }
            break
          }
          if (A === N.part.length) {
            if (N.inert === null) N.inert = {}
            const S = N.inert[H.charCodeAt(A)]
            if (S) {
              ;(N = S), (H = H.slice(A)), (A = 0)
              continue
            }
            const j = L8(H.slice(A))
            ;(N.inert[H.charCodeAt(A)] = j), (N = j)
            break
          }
          if (H[A] !== N.part[A]) {
            const S = qY(N, N.part.slice(A)),
              j = L8(H.slice(A))
            Object.assign(N, L8(N.part.slice(0, A), [S, j])), (N = j)
            break
          }
          ++A
        }
      }
      if (P < B.length) {
        const H = B[P].slice(1)
        if (N.params === null) N.params = MY(H)
        else if (N.params.name !== H)
          if (Y) return J
          else
            throw Error(
              `Cannot create route "${Q}" with parameter "${H}" because a route already exists with a different parameter name ("${N.params.name}") in the same location`
            )
        if (N.params.store === null) N.params.store = J
        return N.params.store
      }
      if (q) {
        if (N.wildcardStore === null) N.wildcardStore = J
        return N.wildcardStore
      }
      if (N.store === null) N.store = J
      return N.store
    }
    find(X, Q) {
      const J = this.root[X]
      if (!J) return null
      return XX(Q, Q.length, J, 0, this.config.onParam)
    }
  },
  XX = ($, X, Q, J, Y) => {
    const Z = Q.part,
      W = Z.length,
      q = J + W
    if (W > 1) {
      if (q > X) return null
      if (W < 15) {
        for (let M = 1, G = J + 1; M < W; ++M, ++G)
          if (Z.charCodeAt(M) !== $.charCodeAt(G)) return null
      } else if ($.slice(J, q) !== Z) return null
    }
    if (q === X) {
      if (Q.store !== null) return { store: Q.store, params: {} }
      if (Q.wildcardStore !== null) return { store: Q.wildcardStore, params: { "*": "" } }
      return null
    }
    if (Q.inert !== null) {
      const M = Q.inert[$.charCodeAt(q)]
      if (M !== void 0) {
        const G = XX($, X, M, q, Y)
        if (G !== null) return G
      }
    }
    if (Q.params !== null) {
      const { store: M, name: G, inert: B } = Q.params,
        N = $.indexOf("/", q)
      if (N !== q) {
        if (N === -1 || N >= X) {
          if (M !== null) {
            const P = {}
            if (((P[G] = $.substring(q, X)), Y))
              for (let w = 0; w < Y.length; w++) {
                const H = Y[w](P[G], G)
                if (H !== void 0) P[G] = H
              }
            return { store: M, params: P }
          }
        } else if (B !== null) {
          const P = XX($, X, B, N, Y)
          if (P !== null) {
            if (((P.params[G] = $.substring(q, N)), Y))
              for (let w = 0; w < Y.length; w++) {
                const H = Y[w](P.params[G], G)
                if (H !== void 0) P.params[G] = H
              }
            return P
          }
        }
      }
    }
    if (Q.wildcardStore !== null)
      return { store: Q.wildcardStore, params: { "*": $.substring(q, X) } }
    return null
  }
var L1 = {}
F$(L1, {
  IsUndefined: () => r0,
  IsUint8Array: () => s2,
  IsSymbol: () => IQ,
  IsString: () => j0,
  IsRegExp: () => H6,
  IsObject: () => P0,
  IsNumber: () => m1,
  IsNull: () => xQ,
  IsIterator: () => EQ,
  IsFunction: () => _Q,
  IsDate: () => i$,
  IsBoolean: () => t2,
  IsBigInt: () => z6,
  IsAsyncIterator: () => VQ,
  IsArray: () => s0,
  HasPropertyKey: () => QX,
})
function QX($, X) {
  return X in $
}
function VQ($) {
  return P0($) && !s0($) && !s2($) && Symbol.asyncIterator in $
}
function s0($) {
  return Array.isArray($)
}
function z6($) {
  return typeof $ === "bigint"
}
function t2($) {
  return typeof $ === "boolean"
}
function i$($) {
  return $ instanceof globalThis.Date
}
function _Q($) {
  return typeof $ === "function"
}
function EQ($) {
  return P0($) && !s0($) && !s2($) && Symbol.iterator in $
}
function xQ($) {
  return $ === null
}
function m1($) {
  return typeof $ === "number"
}
function P0($) {
  return typeof $ === "object" && $ !== null
}
function H6($) {
  return $ instanceof globalThis.RegExp
}
function j0($) {
  return typeof $ === "string"
}
function IQ($) {
  return typeof $ === "symbol"
}
function s2($) {
  return $ instanceof globalThis.Uint8Array
}
function r0($) {
  return $ === void 0
}
function w7($) {
  return $.map((X) => JX(X))
}
function U7($) {
  return new Date($.getTime())
}
function z7($) {
  return new Uint8Array($)
}
function H7($) {
  return new RegExp($.source, $.flags)
}
function A7($) {
  const X = {}
  for (const Q of Object.getOwnPropertyNames($)) X[Q] = JX($[Q])
  for (const Q of Object.getOwnPropertySymbols($)) X[Q] = JX($[Q])
  return X
}
function JX($) {
  return s0($) ? w7($) : i$($) ? U7($) : s2($) ? z7($) : H6($) ? H7($) : P0($) ? A7($) : $
}
function E0($) {
  return JX($)
}
function K8($, X) {
  return X === void 0 ? E0($) : E0({ ...X, ...$ })
}
function YX($) {
  return l($) && globalThis.Symbol.asyncIterator in $
}
function ZX($) {
  return l($) && globalThis.Symbol.iterator in $
}
function TQ($) {
  return (
    l($) &&
    (globalThis.Object.getPrototypeOf($) === Object.prototype ||
      globalThis.Object.getPrototypeOf($) === null)
  )
}
function WX($) {
  return $ instanceof globalThis.Promise
}
function V1($) {
  return $ instanceof Date && globalThis.Number.isFinite($.getTime())
}
function BY($) {
  return $ instanceof globalThis.Map
}
function GY($) {
  return $ instanceof globalThis.Set
}
function $2($) {
  return globalThis.ArrayBuffer.isView($)
}
function S8($) {
  return $ instanceof globalThis.Uint8Array
}
function i($, X) {
  return X in $
}
function l($) {
  return $ !== null && typeof $ === "object"
}
function c($) {
  return globalThis.Array.isArray($) && !globalThis.ArrayBuffer.isView($)
}
function x0($) {
  return $ === void 0
}
function r2($) {
  return $ === null
}
function y2($) {
  return typeof $ === "boolean"
}
function u($) {
  return typeof $ === "number"
}
function qX($) {
  return globalThis.Number.isInteger($)
}
function z1($) {
  return typeof $ === "bigint"
}
function q0($) {
  return typeof $ === "string"
}
function R$($) {
  return typeof $ === "function"
}
function a2($) {
  return typeof $ === "symbol"
}
function u1($) {
  return z1($) || y2($) || r2($) || u($) || q0($) || a2($) || x0($)
}
var V0
;(($) => {
  ;($.InstanceMode = "default"),
    ($.ExactOptionalPropertyTypes = !1),
    ($.AllowArrayObject = !1),
    ($.AllowNaN = !1),
    ($.AllowNullVoid = !1)
  function X(W, q) {
    return $.ExactOptionalPropertyTypes ? q in W : W[q] !== void 0
  }
  $.IsExactOptionalProperty = X
  function Q(W) {
    const q = l(W)
    return $.AllowArrayObject ? q : q && !c(W)
  }
  $.IsObjectLike = Q
  function J(W) {
    return Q(W) && !(W instanceof Date) && !(W instanceof Uint8Array)
  }
  $.IsRecordLike = J
  function Y(W) {
    return $.AllowNaN ? u(W) : Number.isFinite(W)
  }
  $.IsNumberLike = Y
  function Z(W) {
    const q = x0(W)
    return $.AllowNullVoid ? q || W === null : q
  }
  $.IsVoidLike = Z
})(V0 || (V0 = {}))
function D7($) {
  return globalThis.Object.freeze($).map((X) => A6(X))
}
function O7($) {
  return $
}
function P7($) {
  return $
}
function L7($) {
  return $
}
function K7($) {
  const X = {}
  for (const Q of Object.getOwnPropertyNames($)) X[Q] = A6($[Q])
  for (const Q of Object.getOwnPropertySymbols($)) X[Q] = A6($[Q])
  return globalThis.Object.freeze(X)
}
function A6($) {
  return s0($) ? D7($) : i$($) ? O7($) : s2($) ? P7($) : H6($) ? L7($) : P0($) ? K7($) : $
}
function F($, X) {
  const Q = X !== void 0 ? { ...X, ...$ } : $
  switch (V0.InstanceMode) {
    case "freeze":
      return A6(Q)
    case "clone":
      return E0(Q)
    default:
      return Q
  }
}
class p extends Error {}
var C0 = Symbol.for("TypeBox.Transform"),
  N2 = Symbol.for("TypeBox.Readonly"),
  Z1 = Symbol.for("TypeBox.Optional"),
  X2 = Symbol.for("TypeBox.Hint"),
  L = Symbol.for("TypeBox.Kind")
function C8($) {
  return P0($) && $[N2] === "Readonly"
}
function T1($) {
  return P0($) && $[Z1] === "Optional"
}
function bQ($) {
  return Z0($, "Any")
}
function kQ($) {
  return Z0($, "Argument")
}
function w2($) {
  return Z0($, "Array")
}
function n$($) {
  return Z0($, "AsyncIterator")
}
function o$($) {
  return Z0($, "BigInt")
}
function e2($) {
  return Z0($, "Boolean")
}
function U2($) {
  return Z0($, "Computed")
}
function z2($) {
  return Z0($, "Constructor")
}
function S7($) {
  return Z0($, "Date")
}
function H2($) {
  return Z0($, "Function")
}
function A2($) {
  return Z0($, "Integer")
}
function m0($) {
  return Z0($, "Intersect")
}
function l$($) {
  return Z0($, "Iterator")
}
function Z0($, X) {
  return P0($) && L in $ && $[L] === X
}
function MX($) {
  return t2($) || m1($) || j0($)
}
function c1($) {
  return Z0($, "Literal")
}
function p1($) {
  return Z0($, "MappedKey")
}
function I0($) {
  return Z0($, "MappedResult")
}
function V$($) {
  return Z0($, "Never")
}
function C7($) {
  return Z0($, "Not")
}
function D6($) {
  return Z0($, "Null")
}
function D2($) {
  return Z0($, "Number")
}
function a0($) {
  return Z0($, "Object")
}
function t$($) {
  return Z0($, "Promise")
}
function s$($) {
  return Z0($, "Record")
}
function n0($) {
  return Z0($, "Ref")
}
function gQ($) {
  return Z0($, "RegExp")
}
function $$($) {
  return Z0($, "String")
}
function O6($) {
  return Z0($, "Symbol")
}
function i1($) {
  return Z0($, "TemplateLiteral")
}
function j7($) {
  return Z0($, "This")
}
function U0($) {
  return P0($) && C0 in $
}
function n1($) {
  return Z0($, "Tuple")
}
function X$($) {
  return Z0($, "Undefined")
}
function M0($) {
  return Z0($, "Union")
}
function F7($) {
  return Z0($, "Uint8Array")
}
function R7($) {
  return Z0($, "Unknown")
}
function V7($) {
  return Z0($, "Unsafe")
}
function _7($) {
  return Z0($, "Void")
}
function _$($) {
  return P0($) && L in $ && j0($[L])
}
function g0($) {
  return (
    bQ($) ||
    kQ($) ||
    w2($) ||
    e2($) ||
    o$($) ||
    n$($) ||
    U2($) ||
    z2($) ||
    S7($) ||
    H2($) ||
    A2($) ||
    m0($) ||
    l$($) ||
    c1($) ||
    p1($) ||
    I0($) ||
    V$($) ||
    C7($) ||
    D6($) ||
    D2($) ||
    a0($) ||
    t$($) ||
    s$($) ||
    n0($) ||
    gQ($) ||
    $$($) ||
    O6($) ||
    i1($) ||
    j7($) ||
    n1($) ||
    X$($) ||
    M0($) ||
    F7($) ||
    R7($) ||
    V7($) ||
    _7($) ||
    _$($)
  )
}
var O = {}
F$(O, {
  TypeGuardUnknownTypeError: () => NY,
  IsVoid: () => aY,
  IsUnsafe: () => rY,
  IsUnknown: () => sY,
  IsUnionLiteral: () => y7,
  IsUnion: () => vQ,
  IsUndefined: () => lY,
  IsUint8Array: () => tY,
  IsTuple: () => oY,
  IsTransform: () => nY,
  IsThis: () => iY,
  IsTemplateLiteral: () => pY,
  IsSymbol: () => cY,
  IsString: () => uY,
  IsSchema: () => T0,
  IsRegExp: () => mY,
  IsRef: () => hY,
  IsRecursive: () => f7,
  IsRecord: () => dY,
  IsReadonly: () => T7,
  IsProperties: () => BX,
  IsPromise: () => vY,
  IsOptional: () => b7,
  IsObject: () => yY,
  IsNumber: () => fY,
  IsNull: () => gY,
  IsNot: () => kY,
  IsNever: () => bY,
  IsMappedResult: () => TY,
  IsMappedKey: () => IY,
  IsLiteralValue: () => xY,
  IsLiteralString: () => _Y,
  IsLiteralNumber: () => EY,
  IsLiteralBoolean: () => g7,
  IsLiteral: () => L6,
  IsKindOf: () => $0,
  IsKind: () => eY,
  IsIterator: () => VY,
  IsIntersect: () => RY,
  IsInteger: () => FY,
  IsImport: () => k7,
  IsFunction: () => jY,
  IsDate: () => CY,
  IsConstructor: () => SY,
  IsComputed: () => KY,
  IsBoolean: () => LY,
  IsBigInt: () => PY,
  IsAsyncIterator: () => OY,
  IsArray: () => DY,
  IsArgument: () => AY,
  IsAny: () => HY,
})
class NY extends p {}
var E7 = [
  "Argument",
  "Any",
  "Array",
  "AsyncIterator",
  "BigInt",
  "Boolean",
  "Computed",
  "Constructor",
  "Date",
  "Enum",
  "Function",
  "Integer",
  "Intersect",
  "Iterator",
  "Literal",
  "MappedKey",
  "MappedResult",
  "Not",
  "Null",
  "Number",
  "Object",
  "Promise",
  "Record",
  "Ref",
  "RegExp",
  "String",
  "Symbol",
  "TemplateLiteral",
  "This",
  "Tuple",
  "Undefined",
  "Union",
  "Uint8Array",
  "Unknown",
  "Void",
]
function wY($) {
  try {
    return new RegExp($), !0
  } catch {
    return !1
  }
}
function fQ($) {
  if (!j0($)) return !1
  for (let X = 0; X < $.length; X++) {
    const Q = $.charCodeAt(X)
    if ((Q >= 7 && Q <= 13) || Q === 27 || Q === 127) return !1
  }
  return !0
}
function UY($) {
  return yQ($) || T0($)
}
function P6($) {
  return r0($) || z6($)
}
function F0($) {
  return r0($) || m1($)
}
function yQ($) {
  return r0($) || t2($)
}
function L0($) {
  return r0($) || j0($)
}
function x7($) {
  return r0($) || (j0($) && fQ($) && wY($))
}
function I7($) {
  return r0($) || (j0($) && fQ($))
}
function zY($) {
  return r0($) || T0($)
}
function T7($) {
  return P0($) && $[N2] === "Readonly"
}
function b7($) {
  return P0($) && $[Z1] === "Optional"
}
function HY($) {
  return $0($, "Any") && L0($.$id)
}
function AY($) {
  return $0($, "Argument") && m1($.index)
}
function DY($) {
  return (
    $0($, "Array") &&
    $.type === "array" &&
    L0($.$id) &&
    T0($.items) &&
    F0($.minItems) &&
    F0($.maxItems) &&
    yQ($.uniqueItems) &&
    zY($.contains) &&
    F0($.minContains) &&
    F0($.maxContains)
  )
}
function OY($) {
  return $0($, "AsyncIterator") && $.type === "AsyncIterator" && L0($.$id) && T0($.items)
}
function PY($) {
  return (
    $0($, "BigInt") &&
    $.type === "bigint" &&
    L0($.$id) &&
    P6($.exclusiveMaximum) &&
    P6($.exclusiveMinimum) &&
    P6($.maximum) &&
    P6($.minimum) &&
    P6($.multipleOf)
  )
}
function LY($) {
  return $0($, "Boolean") && $.type === "boolean" && L0($.$id)
}
function KY($) {
  return $0($, "Computed") && j0($.target) && s0($.parameters) && $.parameters.every((X) => T0(X))
}
function SY($) {
  return (
    $0($, "Constructor") &&
    $.type === "Constructor" &&
    L0($.$id) &&
    s0($.parameters) &&
    $.parameters.every((X) => T0(X)) &&
    T0($.returns)
  )
}
function CY($) {
  return (
    $0($, "Date") &&
    $.type === "Date" &&
    L0($.$id) &&
    F0($.exclusiveMaximumTimestamp) &&
    F0($.exclusiveMinimumTimestamp) &&
    F0($.maximumTimestamp) &&
    F0($.minimumTimestamp) &&
    F0($.multipleOfTimestamp)
  )
}
function jY($) {
  return (
    $0($, "Function") &&
    $.type === "Function" &&
    L0($.$id) &&
    s0($.parameters) &&
    $.parameters.every((X) => T0(X)) &&
    T0($.returns)
  )
}
function k7($) {
  return (
    $0($, "Import") &&
    QX($, "$defs") &&
    P0($.$defs) &&
    BX($.$defs) &&
    QX($, "$ref") &&
    j0($.$ref) &&
    $.$ref in $.$defs
  )
}
function FY($) {
  return (
    $0($, "Integer") &&
    $.type === "integer" &&
    L0($.$id) &&
    F0($.exclusiveMaximum) &&
    F0($.exclusiveMinimum) &&
    F0($.maximum) &&
    F0($.minimum) &&
    F0($.multipleOf)
  )
}
function BX($) {
  return P0($) && Object.entries($).every(([X, Q]) => fQ(X) && T0(Q))
}
function RY($) {
  return (
    $0($, "Intersect") &&
    (j0($.type) && $.type !== "object" ? !1 : !0) &&
    s0($.allOf) &&
    $.allOf.every((X) => T0(X) && !nY(X)) &&
    L0($.type) &&
    (yQ($.unevaluatedProperties) || zY($.unevaluatedProperties)) &&
    L0($.$id)
  )
}
function VY($) {
  return $0($, "Iterator") && $.type === "Iterator" && L0($.$id) && T0($.items)
}
function $0($, X) {
  return P0($) && L in $ && $[L] === X
}
function _Y($) {
  return L6($) && j0($.const)
}
function EY($) {
  return L6($) && m1($.const)
}
function g7($) {
  return L6($) && t2($.const)
}
function L6($) {
  return $0($, "Literal") && L0($.$id) && xY($.const)
}
function xY($) {
  return t2($) || m1($) || j0($)
}
function IY($) {
  return $0($, "MappedKey") && s0($.keys) && $.keys.every((X) => m1(X) || j0(X))
}
function TY($) {
  return $0($, "MappedResult") && BX($.properties)
}
function bY($) {
  return $0($, "Never") && P0($.not) && Object.getOwnPropertyNames($.not).length === 0
}
function kY($) {
  return $0($, "Not") && T0($.not)
}
function gY($) {
  return $0($, "Null") && $.type === "null" && L0($.$id)
}
function fY($) {
  return (
    $0($, "Number") &&
    $.type === "number" &&
    L0($.$id) &&
    F0($.exclusiveMaximum) &&
    F0($.exclusiveMinimum) &&
    F0($.maximum) &&
    F0($.minimum) &&
    F0($.multipleOf)
  )
}
function yY($) {
  return (
    $0($, "Object") &&
    $.type === "object" &&
    L0($.$id) &&
    BX($.properties) &&
    UY($.additionalProperties) &&
    F0($.minProperties) &&
    F0($.maxProperties)
  )
}
function vY($) {
  return $0($, "Promise") && $.type === "Promise" && L0($.$id) && T0($.item)
}
function dY($) {
  return (
    $0($, "Record") &&
    $.type === "object" &&
    L0($.$id) &&
    UY($.additionalProperties) &&
    P0($.patternProperties) &&
    ((X) => {
      const Q = Object.getOwnPropertyNames(X.patternProperties)
      return Q.length === 1 && wY(Q[0]) && P0(X.patternProperties) && T0(X.patternProperties[Q[0]])
    })($)
  )
}
function f7($) {
  return P0($) && X2 in $ && $[X2] === "Recursive"
}
function hY($) {
  return $0($, "Ref") && L0($.$id) && j0($.$ref)
}
function mY($) {
  return (
    $0($, "RegExp") &&
    L0($.$id) &&
    j0($.source) &&
    j0($.flags) &&
    F0($.maxLength) &&
    F0($.minLength)
  )
}
function uY($) {
  return (
    $0($, "String") &&
    $.type === "string" &&
    L0($.$id) &&
    F0($.minLength) &&
    F0($.maxLength) &&
    x7($.pattern) &&
    I7($.format)
  )
}
function cY($) {
  return $0($, "Symbol") && $.type === "symbol" && L0($.$id)
}
function pY($) {
  return (
    $0($, "TemplateLiteral") &&
    $.type === "string" &&
    j0($.pattern) &&
    $.pattern[0] === "^" &&
    $.pattern[$.pattern.length - 1] === "$"
  )
}
function iY($) {
  return $0($, "This") && L0($.$id) && j0($.$ref)
}
function nY($) {
  return P0($) && C0 in $
}
function oY($) {
  return (
    $0($, "Tuple") &&
    $.type === "array" &&
    L0($.$id) &&
    m1($.minItems) &&
    m1($.maxItems) &&
    $.minItems === $.maxItems &&
    ((r0($.items) && r0($.additionalItems) && $.minItems === 0) ||
      (s0($.items) && $.items.every((X) => T0(X))))
  )
}
function lY($) {
  return $0($, "Undefined") && $.type === "undefined" && L0($.$id)
}
function y7($) {
  return vQ($) && $.anyOf.every((X) => _Y(X) || EY(X))
}
function vQ($) {
  return $0($, "Union") && L0($.$id) && P0($) && s0($.anyOf) && $.anyOf.every((X) => T0(X))
}
function tY($) {
  return (
    $0($, "Uint8Array") &&
    $.type === "Uint8Array" &&
    L0($.$id) &&
    F0($.minByteLength) &&
    F0($.maxByteLength)
  )
}
function sY($) {
  return $0($, "Unknown") && L0($.$id)
}
function rY($) {
  return $0($, "Unsafe")
}
function aY($) {
  return $0($, "Void") && $.type === "void" && L0($.$id)
}
function eY($) {
  return P0($) && L in $ && j0($[L]) && !E7.includes($[L])
}
function T0($) {
  return (
    P0($) &&
    (HY($) ||
      AY($) ||
      DY($) ||
      LY($) ||
      PY($) ||
      OY($) ||
      KY($) ||
      SY($) ||
      CY($) ||
      jY($) ||
      FY($) ||
      RY($) ||
      VY($) ||
      L6($) ||
      IY($) ||
      TY($) ||
      bY($) ||
      kY($) ||
      gY($) ||
      fY($) ||
      yY($) ||
      vY($) ||
      dY($) ||
      hY($) ||
      mY($) ||
      uY($) ||
      cY($) ||
      pY($) ||
      iY($) ||
      oY($) ||
      lY($) ||
      vQ($) ||
      tY($) ||
      sY($) ||
      rY($) ||
      aY($) ||
      eY($))
  )
}
var $4 = "(true|false)",
  GX = "(0|[1-9][0-9]*)",
  X4 = "(.*)"
var E$ = "^(0|[1-9][0-9]*)$",
  x$ = "^(.*)$",
  Q4 = "^(?!.*)$"
var O0 = {}
F$(O0, {
  Set: () => u7,
  Has: () => m7,
  Get: () => c7,
  Entries: () => v7,
  Delete: () => h7,
  Clear: () => d7,
})
var j8 = new Map()
function v7() {
  return new Map(j8)
}
function d7() {
  return j8.clear()
}
function h7($) {
  return j8.delete($)
}
function m7($) {
  return j8.has($)
}
function u7($, X) {
  j8.set($, X)
}
function c7($) {
  return j8.get($)
}
var W1 = {}
F$(W1, {
  Set: () => l7,
  Has: () => o7,
  Get: () => t7,
  Entries: () => p7,
  Delete: () => n7,
  Clear: () => i7,
})
var F8 = new Map()
function p7() {
  return new Map(F8)
}
function i7() {
  return F8.clear()
}
function n7($) {
  return F8.delete($)
}
function o7($) {
  return F8.has($)
}
function l7($, X) {
  F8.set($, X)
}
function t7($) {
  return F8.get($)
}
function J4($, X) {
  return $.includes(X)
}
function Y4($) {
  return [...new Set($)]
}
function s7($, X) {
  return $.filter((Q) => X.includes(Q))
}
function r7($, X) {
  return $.reduce((Q, J) => {
    return s7(Q, J)
  }, X)
}
function Z4($) {
  return $.length === 1 ? $[0] : $.length > 1 ? r7($.slice(1), $[0]) : []
}
function W4($) {
  const X = []
  for (const Q of $) X.push(...Q)
  return X
}
function I$($) {
  return F({ [L]: "Any" }, $)
}
function R8($, X) {
  return F({ [L]: "Array", type: "array", items: $ }, X)
}
function q4($) {
  return F({ [L]: "Argument", index: $ })
}
function V8($, X) {
  return F({ [L]: "AsyncIterator", type: "AsyncIterator", items: $ }, X)
}
function _0($, X, Q) {
  return F({ [L]: "Computed", target: $, parameters: X }, Q)
}
function a7($, X) {
  const { [X]: Q, ...J } = $
  return J
}
function u0($, X) {
  return X.reduce((Q, J) => a7(Q, J), $)
}
function s($) {
  return F({ [L]: "Never", not: {} }, $)
}
function G0($) {
  return F({ [L]: "MappedResult", properties: $ })
}
function _8($, X, Q) {
  return F({ [L]: "Constructor", type: "Constructor", parameters: $, returns: X }, Q)
}
function v2($, X, Q) {
  return F({ [L]: "Function", type: "Function", parameters: $, returns: X }, Q)
}
function K6($, X) {
  return F({ [L]: "Union", anyOf: $ }, X)
}
function e7($) {
  return $.some((X) => T1(X))
}
function M4($) {
  return $.map((X) => (T1(X) ? $9(X) : X))
}
function $9($) {
  return u0($, [Z1])
}
function X9($, X) {
  return e7($) ? K1(K6(M4($), X)) : K6(M4($), X)
}
function d2($, X) {
  return $.length === 1 ? F($[0], X) : $.length === 0 ? s(X) : X9($, X)
}
function z0($, X) {
  return $.length === 0 ? s(X) : $.length === 1 ? F($[0], X) : K6($, X)
}
class dQ extends p {}
function Q9($) {
  return $.replace(/\\\$/g, "$")
    .replace(/\\\*/g, "*")
    .replace(/\\\^/g, "^")
    .replace(/\\\|/g, "|")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
}
function hQ($, X, Q) {
  return $[X] === Q && $.charCodeAt(X - 1) !== 92
}
function J$($, X) {
  return hQ($, X, "(")
}
function S6($, X) {
  return hQ($, X, ")")
}
function B4($, X) {
  return hQ($, X, "|")
}
function J9($) {
  if (!(J$($, 0) && S6($, $.length - 1))) return !1
  let X = 0
  for (let Q = 0; Q < $.length; Q++) {
    if (J$($, Q)) X += 1
    if (S6($, Q)) X -= 1
    if (X === 0 && Q !== $.length - 1) return !1
  }
  return !0
}
function Y9($) {
  return $.slice(1, $.length - 1)
}
function Z9($) {
  let X = 0
  for (let Q = 0; Q < $.length; Q++) {
    if (J$($, Q)) X += 1
    if (S6($, Q)) X -= 1
    if (B4($, Q) && X === 0) return !0
  }
  return !1
}
function W9($) {
  for (let X = 0; X < $.length; X++) if (J$($, X)) return !0
  return !1
}
function q9($) {
  let [X, Q] = [0, 0],
    J = []
  for (let Z = 0; Z < $.length; Z++) {
    if (J$($, Z)) X += 1
    if (S6($, Z)) X -= 1
    if (B4($, Z) && X === 0) {
      const W = $.slice(Q, Z)
      if (W.length > 0) J.push(E8(W))
      Q = Z + 1
    }
  }
  const Y = $.slice(Q)
  if (Y.length > 0) J.push(E8(Y))
  if (J.length === 0) return { type: "const", const: "" }
  if (J.length === 1) return J[0]
  return { type: "or", expr: J }
}
function M9($) {
  function X(Y, Z) {
    if (!J$(Y, Z)) throw new dQ("TemplateLiteralParser: Index must point to open parens")
    let W = 0
    for (let q = Z; q < Y.length; q++) {
      if (J$(Y, q)) W += 1
      if (S6(Y, q)) W -= 1
      if (W === 0) return [Z, q]
    }
    throw new dQ("TemplateLiteralParser: Unclosed group parens in expression")
  }
  function Q(Y, Z) {
    for (let W = Z; W < Y.length; W++) if (J$(Y, W)) return [Z, W]
    return [Z, Y.length]
  }
  const J = []
  for (let Y = 0; Y < $.length; Y++)
    if (J$($, Y)) {
      const [Z, W] = X($, Y),
        q = $.slice(Z, W + 1)
      J.push(E8(q)), (Y = W)
    } else {
      const [Z, W] = Q($, Y),
        q = $.slice(Z, W)
      if (q.length > 0) J.push(E8(q))
      Y = W - 1
    }
  return J.length === 0
    ? { type: "const", const: "" }
    : J.length === 1
      ? J[0]
      : { type: "and", expr: J }
}
function E8($) {
  return J9($) ? E8(Y9($)) : Z9($) ? q9($) : W9($) ? M9($) : { type: "const", const: Q9($) }
}
function x8($) {
  return E8($.slice(1, $.length - 1))
}
class G4 extends p {}
function B9($) {
  return (
    $.type === "or" &&
    $.expr.length === 2 &&
    $.expr[0].type === "const" &&
    $.expr[0].const === "0" &&
    $.expr[1].type === "const" &&
    $.expr[1].const === "[1-9][0-9]*"
  )
}
function G9($) {
  return (
    $.type === "or" &&
    $.expr.length === 2 &&
    $.expr[0].type === "const" &&
    $.expr[0].const === "true" &&
    $.expr[1].type === "const" &&
    $.expr[1].const === "false"
  )
}
function N9($) {
  return $.type === "const" && $.const === ".*"
}
function r$($) {
  return B9($) || N9($)
    ? !1
    : G9($)
      ? !0
      : $.type === "and"
        ? $.expr.every((X) => r$(X))
        : $.type === "or"
          ? $.expr.every((X) => r$(X))
          : $.type === "const"
            ? !0
            : (() => {
                throw new G4("Unknown expression type")
              })()
}
function NX($) {
  const X = x8($.pattern)
  return r$(X)
}
class N4 extends p {}
function* w4($) {
  if ($.length === 1) return yield* $[0]
  for (const X of $[0]) for (const Q of w4($.slice(1))) yield `${X}${Q}`
}
function* w9($) {
  return yield* w4($.expr.map((X) => [...C6(X)]))
}
function* U9($) {
  for (const X of $.expr) yield* C6(X)
}
function* z9($) {
  return yield $.const
}
function* C6($) {
  return $.type === "and"
    ? yield* w9($)
    : $.type === "or"
      ? yield* U9($)
      : $.type === "const"
        ? yield* z9($)
        : (() => {
            throw new N4("Unknown expression")
          })()
}
function I8($) {
  const X = x8($.pattern)
  return r$(X) ? [...C6(X)] : []
}
function W0($, X) {
  return F({ [L]: "Literal", const: $, type: typeof $ }, X)
}
function wX($) {
  return F({ [L]: "Boolean", type: "boolean" }, $)
}
function T8($) {
  return F({ [L]: "BigInt", type: "bigint" }, $)
}
function Q2($) {
  return F({ [L]: "Number", type: "number" }, $)
}
function _1($) {
  return F({ [L]: "String", type: "string" }, $)
}
function* H9($) {
  const X = $.trim().replace(/"|'/g, "")
  return X === "boolean"
    ? yield wX()
    : X === "number"
      ? yield Q2()
      : X === "bigint"
        ? yield T8()
        : X === "string"
          ? yield _1()
          : yield (() => {
              const Q = X.split("|").map((J) => W0(J.trim()))
              return Q.length === 0 ? s() : Q.length === 1 ? Q[0] : d2(Q)
            })()
}
function* A9($) {
  if ($[1] !== "{") {
    const X = W0("$"),
      Q = mQ($.slice(1))
    return yield* [X, ...Q]
  }
  for (let X = 2; X < $.length; X++)
    if ($[X] === "}") {
      const Q = H9($.slice(2, X)),
        J = mQ($.slice(X + 1))
      return yield* [...Q, ...J]
    }
  yield W0($)
}
function* mQ($) {
  for (let X = 0; X < $.length; X++)
    if ($[X] === "$") {
      const Q = W0($.slice(0, X)),
        J = A9($.slice(X))
      return yield* [Q, ...J]
    }
  yield W0($)
}
function U4($) {
  return [...mQ($)]
}
class z4 extends p {}
function D9($) {
  return $.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
function H4($, X) {
  return i1($)
    ? $.pattern.slice(1, $.pattern.length - 1)
    : M0($)
      ? `(${$.anyOf.map((Q) => H4(Q, X)).join("|")})`
      : D2($)
        ? `${X}${GX}`
        : A2($)
          ? `${X}${GX}`
          : o$($)
            ? `${X}${GX}`
            : $$($)
              ? `${X}${X4}`
              : c1($)
                ? `${X}${D9($.const.toString())}`
                : e2($)
                  ? `${X}${$4}`
                  : (() => {
                      throw new z4(`Unexpected Kind '${$[L]}'`)
                    })()
}
function uQ($) {
  return `^${$.map((X) => H4(X, "")).join("")}$`
}
function a$($) {
  const Q = I8($).map((J) => W0(J))
  return d2(Q)
}
function UX($, X) {
  const Q = j0($) ? uQ(U4($)) : uQ($)
  return F({ [L]: "TemplateLiteral", type: "string", pattern: Q }, X)
}
function O9($) {
  return I8($).map((Q) => Q.toString())
}
function P9($) {
  const X = []
  for (const Q of $) X.push(...b1(Q))
  return X
}
function L9($) {
  return [$.toString()]
}
function b1($) {
  return [
    ...new Set(
      i1($)
        ? O9($)
        : M0($)
          ? P9($.anyOf)
          : c1($)
            ? L9($.const)
            : D2($)
              ? ["[number]"]
              : A2($)
                ? ["[number]"]
                : []
    ),
  ]
}
function K9($, X, Q) {
  const J = {}
  for (const Y of Object.getOwnPropertyNames(X)) J[Y] = T$($, b1(X[Y]), Q)
  return J
}
function S9($, X, Q) {
  return K9($, X.properties, Q)
}
function A4($, X, Q) {
  const J = S9($, X, Q)
  return G0(J)
}
function O4($, X) {
  return $.map((Q) => P4(Q, X))
}
function C9($) {
  return $.filter((X) => !V$(X))
}
function j9($, X) {
  return zX(C9(O4($, X)))
}
function F9($) {
  return $.some((X) => V$(X)) ? [] : $
}
function R9($, X) {
  return d2(F9(O4($, X)))
}
function V9($, X) {
  return X in $ ? $[X] : X === "[number]" ? d2($) : s()
}
function _9($, X) {
  return X === "[number]" ? $ : s()
}
function E9($, X) {
  return X in $ ? $[X] : s()
}
function P4($, X) {
  return m0($)
    ? j9($.allOf, X)
    : M0($)
      ? R9($.anyOf, X)
      : n1($)
        ? V9($.items ?? [], X)
        : w2($)
          ? _9($.items, X)
          : a0($)
            ? E9($.properties, X)
            : s()
}
function j6($, X) {
  return X.map((Q) => P4($, Q))
}
function D4($, X) {
  return d2(j6($, X))
}
function T$($, X, Q) {
  if (n0($) || n0(X)) {
    if (!g0($) || !g0(X))
      throw new p("Index types using Ref parameters require both Type and Key to be of TSchema")
    return _0("Index", [$, X])
  }
  if (I0(X)) return A4($, X, Q)
  if (p1(X)) return L4($, X, Q)
  return F(g0(X) ? D4($, b1(X)) : D4($, X), Q)
}
function x9($, X, Q) {
  return { [X]: T$($, [X], E0(Q)) }
}
function I9($, X, Q) {
  return X.reduce((J, Y) => {
    return { ...J, ...x9($, Y, Q) }
  }, {})
}
function T9($, X, Q) {
  return I9($, X.keys, Q)
}
function L4($, X, Q) {
  const J = T9($, X, Q)
  return G0(J)
}
function b8($, X) {
  return F({ [L]: "Iterator", type: "Iterator", items: $ }, X)
}
function b9($) {
  const X = []
  for (const Q in $) if (!T1($[Q])) X.push(Q)
  return X
}
function k9($, X) {
  const Q = b9($),
    J =
      Q.length > 0
        ? { [L]: "Object", type: "object", properties: $, required: Q }
        : { [L]: "Object", type: "object", properties: $ }
  return F(J, X)
}
var H0 = k9
function HX($, X) {
  return F({ [L]: "Promise", type: "Promise", item: $ }, X)
}
function g9($) {
  return F(u0($, [N2]))
}
function f9($) {
  return F({ ...$, [N2]: "Readonly" })
}
function y9($, X) {
  return X === !1 ? g9($) : f9($)
}
function k1($, X) {
  const Q = X ?? !0
  return I0($) ? K4($, Q) : y9($, Q)
}
function v9($, X) {
  const Q = {}
  for (const J of globalThis.Object.getOwnPropertyNames($)) Q[J] = k1($[J], X)
  return Q
}
function d9($, X) {
  return v9($.properties, X)
}
function K4($, X) {
  const Q = d9($, X)
  return G0(Q)
}
function J2($, X) {
  return F(
    $.length > 0
      ? {
          [L]: "Tuple",
          type: "array",
          items: $,
          additionalItems: !1,
          minItems: $.length,
          maxItems: $.length,
        }
      : { [L]: "Tuple", type: "array", minItems: $.length, maxItems: $.length },
    X
  )
}
function S4($, X) {
  return $ in X ? Y2($, X[$]) : G0(X)
}
function h9($) {
  return { [$]: W0($) }
}
function m9($) {
  const X = {}
  for (const Q of $) X[Q] = W0(Q)
  return X
}
function u9($, X) {
  return J4(X, $) ? h9($) : m9(X)
}
function c9($, X) {
  const Q = u9($, X)
  return S4($, Q)
}
function F6($, X) {
  return X.map((Q) => Y2($, Q))
}
function p9($, X) {
  const Q = {}
  for (const J of globalThis.Object.getOwnPropertyNames(X)) Q[J] = Y2($, X[J])
  return Q
}
function Y2($, X) {
  const Q = { ...X }
  return T1(X)
    ? K1(Y2($, u0(X, [Z1])))
    : C8(X)
      ? k1(Y2($, u0(X, [N2])))
      : I0(X)
        ? S4($, X.properties)
        : p1(X)
          ? c9($, X.keys)
          : z2(X)
            ? _8(F6($, X.parameters), Y2($, X.returns), Q)
            : H2(X)
              ? v2(F6($, X.parameters), Y2($, X.returns), Q)
              : n$(X)
                ? V8(Y2($, X.items), Q)
                : l$(X)
                  ? b8(Y2($, X.items), Q)
                  : m0(X)
                    ? S1(F6($, X.allOf), Q)
                    : M0(X)
                      ? z0(F6($, X.anyOf), Q)
                      : n1(X)
                        ? J2(F6($, X.items ?? []), Q)
                        : a0(X)
                          ? H0(p9($, X.properties), Q)
                          : w2(X)
                            ? R8(Y2($, X.items), Q)
                            : t$(X)
                              ? HX(Y2($, X.item), Q)
                              : X
}
function i9($, X) {
  const Q = {}
  for (const J of $) Q[J] = Y2(J, X)
  return Q
}
function C4($, X, Q) {
  const J = g0($) ? b1($) : $,
    Y = X({ [L]: "MappedKey", keys: J }),
    Z = i9(J, Y)
  return H0(Z, Q)
}
function n9($) {
  return F(u0($, [Z1]))
}
function o9($) {
  return F({ ...$, [Z1]: "Optional" })
}
function l9($, X) {
  return X === !1 ? n9($) : o9($)
}
function K1($, X) {
  const Q = X ?? !0
  return I0($) ? j4($, Q) : l9($, Q)
}
function t9($, X) {
  const Q = {}
  for (const J of globalThis.Object.getOwnPropertyNames($)) Q[J] = K1($[J], X)
  return Q
}
function s9($, X) {
  return t9($.properties, X)
}
function j4($, X) {
  const Q = s9($, X)
  return G0(Q)
}
function R6($, X = {}) {
  const Q = $.every((Y) => a0(Y)),
    J = g0(X.unevaluatedProperties) ? { unevaluatedProperties: X.unevaluatedProperties } : {}
  return F(
    X.unevaluatedProperties === !1 || g0(X.unevaluatedProperties) || Q
      ? { ...J, [L]: "Intersect", type: "object", allOf: $ }
      : { ...J, [L]: "Intersect", allOf: $ },
    X
  )
}
function r9($) {
  return $.every((X) => T1(X))
}
function a9($) {
  return u0($, [Z1])
}
function F4($) {
  return $.map((X) => (T1(X) ? a9(X) : X))
}
function e9($, X) {
  return r9($) ? K1(R6(F4($), X)) : R6(F4($), X)
}
function zX($, X = {}) {
  if ($.length === 1) return F($[0], X)
  if ($.length === 0) return s(X)
  if ($.some((Q) => U0(Q))) throw Error("Cannot intersect transform types")
  return e9($, X)
}
function S1($, X) {
  if ($.length === 1) return F($[0], X)
  if ($.length === 0) return s(X)
  if ($.some((Q) => U0(Q))) throw Error("Cannot intersect transform types")
  return R6($, X)
}
function Z2(...$) {
  const [X, Q] = typeof $[0] === "string" ? [$[0], $[1]] : [$[0].$id, $[1]]
  if (typeof X !== "string") throw new p("Ref: $ref must be a string")
  return F({ [L]: "Ref", $ref: X }, Q)
}
function $q($, X) {
  return _0("Awaited", [_0($, X)])
}
function Xq($) {
  return _0("Awaited", [Z2($)])
}
function Qq($) {
  return S1(R4($))
}
function Jq($) {
  return z0(R4($))
}
function Yq($) {
  return k8($)
}
function R4($) {
  return $.map((X) => k8(X))
}
function k8($, X) {
  return F(
    U2($)
      ? $q($.target, $.parameters)
      : m0($)
        ? Qq($.allOf)
        : M0($)
          ? Jq($.anyOf)
          : t$($)
            ? Yq($.item)
            : n0($)
              ? Xq($.$ref)
              : $,
    X
  )
}
function V4($) {
  const X = []
  for (const Q of $) X.push(g1(Q))
  return X
}
function Zq($) {
  const X = V4($)
  return W4(X)
}
function Wq($) {
  const X = V4($)
  return Z4(X)
}
function qq($) {
  return $.map((_X, Q) => Q.toString())
}
function Mq(_$) {
  return ["[number]"]
}
function Bq($) {
  return globalThis.Object.getOwnPropertyNames($)
}
function Gq($) {
  if (!cQ) return []
  return globalThis.Object.getOwnPropertyNames($).map((Q) => {
    return Q[0] === "^" && Q[Q.length - 1] === "$" ? Q.slice(1, Q.length - 1) : Q
  })
}
function g1($) {
  return m0($)
    ? Zq($.allOf)
    : M0($)
      ? Wq($.anyOf)
      : n1($)
        ? qq($.items ?? [])
        : w2($)
          ? Mq($.items)
          : a0($)
            ? Bq($.properties)
            : s$($)
              ? Gq($.patternProperties)
              : []
}
var cQ = !1
function Y$($) {
  cQ = !0
  const X = g1($)
  return (cQ = !1), `^(${X.map((J) => `(${J})`).join("|")})$`
}
function Nq($, X) {
  return _0("KeyOf", [_0($, X)])
}
function wq($) {
  return _0("KeyOf", [Z2($)])
}
function Uq($, X) {
  const Q = g1($),
    J = zq(Q),
    Y = d2(J)
  return F(Y, X)
}
function zq($) {
  return $.map((X) => (X === "[number]" ? Q2() : W0(X)))
}
function g8($, X) {
  return U2($) ? Nq($.target, $.parameters) : n0($) ? wq($.$ref) : I0($) ? _4($, X) : Uq($, X)
}
function Hq($, X) {
  const Q = {}
  for (const J of globalThis.Object.getOwnPropertyNames($)) Q[J] = g8($[J], E0(X))
  return Q
}
function Aq($, X) {
  return Hq($.properties, X)
}
function _4($, X) {
  const Q = Aq($, X)
  return G0(Q)
}
function AX($) {
  const X = g1($),
    Q = j6($, X)
  return X.map((_J, Y) => [X[Y], Q[Y]])
}
function Dq($) {
  const X = []
  for (const Q of $) X.push(...g1(Q))
  return Y4(X)
}
function Oq($) {
  return $.filter((X) => !V$(X))
}
function Pq($, X) {
  const Q = []
  for (const J of $) Q.push(...j6(J, [X]))
  return Oq(Q)
}
function Lq($, X) {
  const Q = {}
  for (const J of X) Q[J] = zX(Pq($, J))
  return Q
}
function E4($, X) {
  const Q = Dq($),
    J = Lq($, Q)
  return H0(J, X)
}
function DX($) {
  return F({ [L]: "Date", type: "Date" }, $)
}
function OX($) {
  return F({ [L]: "Null", type: "null" }, $)
}
function PX($) {
  return F({ [L]: "Symbol", type: "symbol" }, $)
}
function LX($) {
  return F({ [L]: "Undefined", type: "undefined" }, $)
}
function KX($) {
  return F({ [L]: "Uint8Array", type: "Uint8Array" }, $)
}
function O2($) {
  return F({ [L]: "Unknown" }, $)
}
function Kq($) {
  return $.map((X) => pQ(X, !1))
}
function Sq($) {
  const X = {}
  for (const Q of globalThis.Object.getOwnPropertyNames($)) X[Q] = k1(pQ($[Q], !1))
  return X
}
function SX($, X) {
  return X === !0 ? $ : k1($)
}
function pQ($, X) {
  return VQ($)
    ? SX(I$(), X)
    : EQ($)
      ? SX(I$(), X)
      : s0($)
        ? k1(J2(Kq($)))
        : s2($)
          ? KX()
          : i$($)
            ? DX()
            : P0($)
              ? SX(H0(Sq($)), X)
              : _Q($)
                ? SX(v2([], O2()), X)
                : r0($)
                  ? LX()
                  : xQ($)
                    ? OX()
                    : IQ($)
                      ? PX()
                      : z6($)
                        ? T8()
                        : m1($)
                          ? W0($)
                          : t2($)
                            ? W0($)
                            : j0($)
                              ? W0($)
                              : H0({})
}
function x4($, X) {
  return F(pQ($, !0), X)
}
function I4($, X) {
  return z2($) ? J2($.parameters, X) : s(X)
}
function T4($, X) {
  if (r0($)) throw Error("Enum undefined or empty")
  const Q = globalThis.Object.getOwnPropertyNames($)
      .filter((Z) => Number.isNaN(Z))
      .map((Z) => $[Z]),
    Y = [...new Set(Q)].map((Z) => W0(Z))
  return z0(Y, { ...X, [X2]: "Enum" })
}
class y4 extends p {}
var R
;(($) => {
  ;($[($.Union = 0)] = "Union"), ($[($.True = 1)] = "True"), ($[($.False = 2)] = "False")
})(R || (R = {}))
function W2($) {
  return $ === R.False ? $ : R.True
}
function f8($) {
  throw new y4($)
}
function X1($) {
  return O.IsNever($) || O.IsIntersect($) || O.IsUnion($) || O.IsUnknown($) || O.IsAny($)
}
function Q1($, X) {
  return O.IsNever(X)
    ? h4($, X)
    : O.IsIntersect(X)
      ? CX($, X)
      : O.IsUnion(X)
        ? tQ($, X)
        : O.IsUnknown(X)
          ? p4($, X)
          : O.IsAny(X)
            ? lQ($, X)
            : f8("StructuralRight")
}
function lQ(_$, _X) {
  return R.True
}
function Cq($, X) {
  return O.IsIntersect(X)
    ? CX($, X)
    : O.IsUnion(X) && X.anyOf.some((Q) => O.IsAny(Q) || O.IsUnknown(Q))
      ? R.True
      : O.IsUnion(X)
        ? R.Union
        : O.IsUnknown(X)
          ? R.True
          : O.IsAny(X)
            ? R.True
            : R.Union
}
function jq($, _X) {
  return O.IsUnknown($) ? R.False : O.IsAny($) ? R.Union : O.IsNever($) ? R.True : R.False
}
function Fq($, X) {
  return O.IsObject(X) && jX(X)
    ? R.True
    : X1(X)
      ? Q1($, X)
      : !O.IsArray(X)
        ? R.False
        : W2(K0($.items, X.items))
}
function Rq($, X) {
  return X1(X) ? Q1($, X) : !O.IsAsyncIterator(X) ? R.False : W2(K0($.items, X.items))
}
function Vq($, X) {
  return X1(X)
    ? Q1($, X)
    : O.IsObject(X)
      ? C1($, X)
      : O.IsRecord(X)
        ? q2($, X)
        : O.IsBigInt(X)
          ? R.True
          : R.False
}
function v4($, _X) {
  return O.IsLiteralBoolean($) ? R.True : O.IsBoolean($) ? R.True : R.False
}
function _q($, X) {
  return X1(X)
    ? Q1($, X)
    : O.IsObject(X)
      ? C1($, X)
      : O.IsRecord(X)
        ? q2($, X)
        : O.IsBoolean(X)
          ? R.True
          : R.False
}
function Eq($, X) {
  return X1(X)
    ? Q1($, X)
    : O.IsObject(X)
      ? C1($, X)
      : !O.IsConstructor(X)
        ? R.False
        : $.parameters.length > X.parameters.length
          ? R.False
          : !$.parameters.every((Q, J) => W2(K0(X.parameters[J], Q)) === R.True)
            ? R.False
            : W2(K0($.returns, X.returns))
}
function xq($, X) {
  return X1(X)
    ? Q1($, X)
    : O.IsObject(X)
      ? C1($, X)
      : O.IsRecord(X)
        ? q2($, X)
        : O.IsDate(X)
          ? R.True
          : R.False
}
function Iq($, X) {
  return X1(X)
    ? Q1($, X)
    : O.IsObject(X)
      ? C1($, X)
      : !O.IsFunction(X)
        ? R.False
        : $.parameters.length > X.parameters.length
          ? R.False
          : !$.parameters.every((Q, J) => W2(K0(X.parameters[J], Q)) === R.True)
            ? R.False
            : W2(K0($.returns, X.returns))
}
function d4($, _X) {
  return O.IsLiteral($) && L1.IsNumber($.const)
    ? R.True
    : O.IsNumber($) || O.IsInteger($)
      ? R.True
      : R.False
}
function Tq($, X) {
  return O.IsInteger(X) || O.IsNumber(X)
    ? R.True
    : X1(X)
      ? Q1($, X)
      : O.IsObject(X)
        ? C1($, X)
        : O.IsRecord(X)
          ? q2($, X)
          : R.False
}
function CX($, X) {
  return X.allOf.every((Q) => K0($, Q) === R.True) ? R.True : R.False
}
function bq($, X) {
  return $.allOf.some((Q) => K0(Q, X) === R.True) ? R.True : R.False
}
function kq($, X) {
  return X1(X) ? Q1($, X) : !O.IsIterator(X) ? R.False : W2(K0($.items, X.items))
}
function gq($, X) {
  return O.IsLiteral(X) && X.const === $.const
    ? R.True
    : X1(X)
      ? Q1($, X)
      : O.IsObject(X)
        ? C1($, X)
        : O.IsRecord(X)
          ? q2($, X)
          : O.IsString(X)
            ? c4($, X)
            : O.IsNumber(X)
              ? m4($, X)
              : O.IsInteger(X)
                ? d4($, X)
                : O.IsBoolean(X)
                  ? v4($, X)
                  : R.False
}
function h4(_$, _X) {
  return R.False
}
function fq(_$, _X) {
  return R.True
}
function b4($) {
  let [X, Q] = [$, 0]
  while (!0) {
    if (!O.IsNot(X)) break
    ;(X = X.not), (Q += 1)
  }
  return Q % 2 === 0 ? X : O2()
}
function yq($, X) {
  return O.IsNot($) ? K0(b4($), X) : O.IsNot(X) ? K0($, b4(X)) : f8("Invalid fallthrough for Not")
}
function vq($, X) {
  return X1(X)
    ? Q1($, X)
    : O.IsObject(X)
      ? C1($, X)
      : O.IsRecord(X)
        ? q2($, X)
        : O.IsNull(X)
          ? R.True
          : R.False
}
function m4($, _X) {
  return O.IsLiteralNumber($) ? R.True : O.IsNumber($) || O.IsInteger($) ? R.True : R.False
}
function dq($, X) {
  return X1(X)
    ? Q1($, X)
    : O.IsObject(X)
      ? C1($, X)
      : O.IsRecord(X)
        ? q2($, X)
        : O.IsInteger(X) || O.IsNumber(X)
          ? R.True
          : R.False
}
function f1($, X) {
  return Object.getOwnPropertyNames($.properties).length === X
}
function k4($) {
  return jX($)
}
function g4($) {
  return (
    f1($, 0) ||
    (f1($, 1) &&
      "description" in $.properties &&
      O.IsUnion($.properties.description) &&
      $.properties.description.anyOf.length === 2 &&
      ((O.IsString($.properties.description.anyOf[0]) &&
        O.IsUndefined($.properties.description.anyOf[1])) ||
        (O.IsString($.properties.description.anyOf[1]) &&
          O.IsUndefined($.properties.description.anyOf[0]))))
  )
}
function iQ($) {
  return f1($, 0)
}
function f4($) {
  return f1($, 0)
}
function hq($) {
  return f1($, 0)
}
function mq($) {
  return f1($, 0)
}
function uq($) {
  return jX($)
}
function cq($) {
  const X = Q2()
  return (
    f1($, 0) || (f1($, 1) && "length" in $.properties && W2(K0($.properties.length, X)) === R.True)
  )
}
function pq($) {
  return f1($, 0)
}
function jX($) {
  const X = Q2()
  return (
    f1($, 0) || (f1($, 1) && "length" in $.properties && W2(K0($.properties.length, X)) === R.True)
  )
}
function iq($) {
  const X = v2([I$()], I$())
  return f1($, 0) || (f1($, 1) && "then" in $.properties && W2(K0($.properties.then, X)) === R.True)
}
function u4($, X) {
  return K0($, X) === R.False ? R.False : O.IsOptional($) && !O.IsOptional(X) ? R.False : R.True
}
function C1($, X) {
  return O.IsUnknown($)
    ? R.False
    : O.IsAny($)
      ? R.Union
      : O.IsNever($) ||
          (O.IsLiteralString($) && k4(X)) ||
          (O.IsLiteralNumber($) && iQ(X)) ||
          (O.IsLiteralBoolean($) && f4(X)) ||
          (O.IsSymbol($) && g4(X)) ||
          (O.IsBigInt($) && hq(X)) ||
          (O.IsString($) && k4(X)) ||
          (O.IsSymbol($) && g4(X)) ||
          (O.IsNumber($) && iQ(X)) ||
          (O.IsInteger($) && iQ(X)) ||
          (O.IsBoolean($) && f4(X)) ||
          (O.IsUint8Array($) && uq(X)) ||
          (O.IsDate($) && mq(X)) ||
          (O.IsConstructor($) && pq(X)) ||
          (O.IsFunction($) && cq(X))
        ? R.True
        : O.IsRecord($) && O.IsString(nQ($))
          ? (() => {
              return X[X2] === "Record" ? R.True : R.False
            })()
          : O.IsRecord($) && O.IsNumber(nQ($))
            ? (() => {
                return f1(X, 0) ? R.True : R.False
              })()
            : R.False
}
function nq($, X) {
  return X1(X)
    ? Q1($, X)
    : O.IsRecord(X)
      ? q2($, X)
      : !O.IsObject(X)
        ? R.False
        : (() => {
            for (const Q of Object.getOwnPropertyNames(X.properties)) {
              if (!(Q in $.properties) && !O.IsOptional(X.properties[Q])) return R.False
              if (O.IsOptional(X.properties[Q])) return R.True
              if (u4($.properties[Q], X.properties[Q]) === R.False) return R.False
            }
            return R.True
          })()
}
function oq($, X) {
  return X1(X)
    ? Q1($, X)
    : O.IsObject(X) && iq(X)
      ? R.True
      : !O.IsPromise(X)
        ? R.False
        : W2(K0($.item, X.item))
}
function nQ($) {
  return E$ in $.patternProperties
    ? Q2()
    : x$ in $.patternProperties
      ? _1()
      : f8("Unknown record key pattern")
}
function oQ($) {
  return E$ in $.patternProperties
    ? $.patternProperties[E$]
    : x$ in $.patternProperties
      ? $.patternProperties[x$]
      : f8("Unable to get record value schema")
}
function q2($, X) {
  const [Q, J] = [nQ(X), oQ(X)]
  return O.IsLiteralString($) && O.IsNumber(Q) && W2(K0($, J)) === R.True
    ? R.True
    : O.IsUint8Array($) && O.IsNumber(Q)
      ? K0($, J)
      : O.IsString($) && O.IsNumber(Q)
        ? K0($, J)
        : O.IsArray($) && O.IsNumber(Q)
          ? K0($, J)
          : O.IsObject($)
            ? (() => {
                for (const Y of Object.getOwnPropertyNames($.properties))
                  if (u4(J, $.properties[Y]) === R.False) return R.False
                return R.True
              })()
            : R.False
}
function lq($, X) {
  return X1(X) ? Q1($, X) : O.IsObject(X) ? C1($, X) : !O.IsRecord(X) ? R.False : K0(oQ($), oQ(X))
}
function tq($, X) {
  const Q = O.IsRegExp($) ? _1() : $,
    J = O.IsRegExp(X) ? _1() : X
  return K0(Q, J)
}
function c4($, _X) {
  return O.IsLiteral($) && L1.IsString($.const) ? R.True : O.IsString($) ? R.True : R.False
}
function sq($, X) {
  return X1(X)
    ? Q1($, X)
    : O.IsObject(X)
      ? C1($, X)
      : O.IsRecord(X)
        ? q2($, X)
        : O.IsString(X)
          ? R.True
          : R.False
}
function rq($, X) {
  return X1(X)
    ? Q1($, X)
    : O.IsObject(X)
      ? C1($, X)
      : O.IsRecord(X)
        ? q2($, X)
        : O.IsSymbol(X)
          ? R.True
          : R.False
}
function aq($, X) {
  return O.IsTemplateLiteral($)
    ? K0(a$($), X)
    : O.IsTemplateLiteral(X)
      ? K0($, a$(X))
      : f8("Invalid fallthrough for TemplateLiteral")
}
function eq($, X) {
  return O.IsArray(X) && $.items !== void 0 && $.items.every((Q) => K0(Q, X.items) === R.True)
}
function $M($, _X) {
  return O.IsNever($) ? R.True : O.IsUnknown($) ? R.False : O.IsAny($) ? R.Union : R.False
}
function XM($, X) {
  return X1(X)
    ? Q1($, X)
    : O.IsObject(X) && jX(X)
      ? R.True
      : O.IsArray(X) && eq($, X)
        ? R.True
        : !O.IsTuple(X)
          ? R.False
          : (L1.IsUndefined($.items) && !L1.IsUndefined(X.items)) ||
              (!L1.IsUndefined($.items) && L1.IsUndefined(X.items))
            ? R.False
            : L1.IsUndefined($.items) && !L1.IsUndefined(X.items)
              ? R.True
              : $.items.every((Q, J) => K0(Q, X.items[J]) === R.True)
                ? R.True
                : R.False
}
function QM($, X) {
  return X1(X)
    ? Q1($, X)
    : O.IsObject(X)
      ? C1($, X)
      : O.IsRecord(X)
        ? q2($, X)
        : O.IsUint8Array(X)
          ? R.True
          : R.False
}
function JM($, X) {
  return X1(X)
    ? Q1($, X)
    : O.IsObject(X)
      ? C1($, X)
      : O.IsRecord(X)
        ? q2($, X)
        : O.IsVoid(X)
          ? WM($, X)
          : O.IsUndefined(X)
            ? R.True
            : R.False
}
function tQ($, X) {
  return X.anyOf.some((Q) => K0($, Q) === R.True) ? R.True : R.False
}
function YM($, X) {
  return $.anyOf.every((Q) => K0(Q, X) === R.True) ? R.True : R.False
}
function p4(_$, _X) {
  return R.True
}
function ZM($, X) {
  return O.IsNever(X)
    ? h4($, X)
    : O.IsIntersect(X)
      ? CX($, X)
      : O.IsUnion(X)
        ? tQ($, X)
        : O.IsAny(X)
          ? lQ($, X)
          : O.IsString(X)
            ? c4($, X)
            : O.IsNumber(X)
              ? m4($, X)
              : O.IsInteger(X)
                ? d4($, X)
                : O.IsBoolean(X)
                  ? v4($, X)
                  : O.IsArray(X)
                    ? jq($, X)
                    : O.IsTuple(X)
                      ? $M($, X)
                      : O.IsObject(X)
                        ? C1($, X)
                        : O.IsUnknown(X)
                          ? R.True
                          : R.False
}
function WM($, _X) {
  return O.IsUndefined($) ? R.True : O.IsUndefined($) ? R.True : R.False
}
function qM($, X) {
  return O.IsIntersect(X)
    ? CX($, X)
    : O.IsUnion(X)
      ? tQ($, X)
      : O.IsUnknown(X)
        ? p4($, X)
        : O.IsAny(X)
          ? lQ($, X)
          : O.IsObject(X)
            ? C1($, X)
            : O.IsVoid(X)
              ? R.True
              : R.False
}
function K0($, X) {
  return O.IsTemplateLiteral($) || O.IsTemplateLiteral(X)
    ? aq($, X)
    : O.IsRegExp($) || O.IsRegExp(X)
      ? tq($, X)
      : O.IsNot($) || O.IsNot(X)
        ? yq($, X)
        : O.IsAny($)
          ? Cq($, X)
          : O.IsArray($)
            ? Fq($, X)
            : O.IsBigInt($)
              ? Vq($, X)
              : O.IsBoolean($)
                ? _q($, X)
                : O.IsAsyncIterator($)
                  ? Rq($, X)
                  : O.IsConstructor($)
                    ? Eq($, X)
                    : O.IsDate($)
                      ? xq($, X)
                      : O.IsFunction($)
                        ? Iq($, X)
                        : O.IsInteger($)
                          ? Tq($, X)
                          : O.IsIntersect($)
                            ? bq($, X)
                            : O.IsIterator($)
                              ? kq($, X)
                              : O.IsLiteral($)
                                ? gq($, X)
                                : O.IsNever($)
                                  ? fq($, X)
                                  : O.IsNull($)
                                    ? vq($, X)
                                    : O.IsNumber($)
                                      ? dq($, X)
                                      : O.IsObject($)
                                        ? nq($, X)
                                        : O.IsRecord($)
                                          ? lq($, X)
                                          : O.IsString($)
                                            ? sq($, X)
                                            : O.IsSymbol($)
                                              ? rq($, X)
                                              : O.IsTuple($)
                                                ? XM($, X)
                                                : O.IsPromise($)
                                                  ? oq($, X)
                                                  : O.IsUint8Array($)
                                                    ? QM($, X)
                                                    : O.IsUndefined($)
                                                      ? JM($, X)
                                                      : O.IsUnion($)
                                                        ? YM($, X)
                                                        : O.IsUnknown($)
                                                          ? ZM($, X)
                                                          : O.IsVoid($)
                                                            ? qM($, X)
                                                            : f8(
                                                                `Unknown left type operand '${$[L]}'`
                                                              )
}
function b$($, X) {
  return K0($, X)
}
function MM($, X, Q, J, Y) {
  const Z = {}
  for (const W of globalThis.Object.getOwnPropertyNames($)) Z[W] = y8($[W], X, Q, J, E0(Y))
  return Z
}
function BM($, X, Q, J, Y) {
  return MM($.properties, X, Q, J, Y)
}
function i4($, X, Q, J, Y) {
  const Z = BM($, X, Q, J, Y)
  return G0(Z)
}
function GM($, X, Q, J) {
  const Y = b$($, X)
  return Y === R.Union ? z0([Q, J]) : Y === R.True ? Q : J
}
function y8($, X, Q, J, Y) {
  return I0($) ? i4($, X, Q, J, Y) : p1($) ? F(n4($, X, Q, J, Y)) : F(GM($, X, Q, J), Y)
}
function NM($, X, Q, J, Y) {
  return { [$]: y8(W0($), X, Q, J, E0(Y)) }
}
function wM($, X, Q, J, Y) {
  return $.reduce((Z, W) => {
    return { ...Z, ...NM(W, X, Q, J, Y) }
  }, {})
}
function UM($, X, Q, J, Y) {
  return wM($.keys, X, Q, J, Y)
}
function n4($, X, Q, J, Y) {
  const Z = UM($, X, Q, J, Y)
  return G0(Z)
}
function zM($) {
  return $.allOf.every((X) => Z$(X))
}
function HM($) {
  return $.anyOf.some((X) => Z$(X))
}
function AM($) {
  return !Z$($.not)
}
function Z$($) {
  return $[L] === "Intersect"
    ? zM($)
    : $[L] === "Union"
      ? HM($)
      : $[L] === "Not"
        ? AM($)
        : $[L] === "Undefined"
          ? !0
          : !1
}
function o4($, X) {
  return v8(a$($), X)
}
function DM($, X) {
  const Q = $.filter((J) => b$(J, X) === R.False)
  return Q.length === 1 ? Q[0] : z0(Q)
}
function v8($, X, Q = {}) {
  if (i1($)) return F(o4($, X), Q)
  if (I0($)) return F(l4($, X), Q)
  return F(M0($) ? DM($.anyOf, X) : b$($, X) !== R.False ? s() : $, Q)
}
function OM($, X) {
  const Q = {}
  for (const J of globalThis.Object.getOwnPropertyNames($)) Q[J] = v8($[J], X)
  return Q
}
function PM($, X) {
  return OM($.properties, X)
}
function l4($, X) {
  const Q = PM($, X)
  return G0(Q)
}
function t4($, X) {
  return d8(a$($), X)
}
function LM($, X) {
  const Q = $.filter((J) => b$(J, X) !== R.False)
  return Q.length === 1 ? Q[0] : z0(Q)
}
function d8($, X, Q) {
  if (i1($)) return F(t4($, X), Q)
  if (I0($)) return F(s4($, X), Q)
  return F(M0($) ? LM($.anyOf, X) : b$($, X) !== R.False ? $ : s(), Q)
}
function KM($, X) {
  const Q = {}
  for (const J of globalThis.Object.getOwnPropertyNames($)) Q[J] = d8($[J], X)
  return Q
}
function SM($, X) {
  return KM($.properties, X)
}
function s4($, X) {
  const Q = SM($, X)
  return G0(Q)
}
function r4($, X) {
  return z2($) ? F($.returns, X) : s(X)
}
function FX($) {
  return k1(K1($))
}
function e$($, X, Q) {
  return F({ [L]: "Record", type: "object", patternProperties: { [$]: X } }, Q)
}
function sQ($, X, Q) {
  const J = {}
  for (const Y of $) J[Y] = X
  return H0(J, { ...Q, [X2]: "Record" })
}
function CM($, X, Q) {
  return NX($) ? sQ(b1($), X, Q) : e$($.pattern, X, Q)
}
function jM($, X, Q) {
  return sQ(b1(z0($)), X, Q)
}
function FM($, X, Q) {
  return sQ([$.toString()], X, Q)
}
function RM($, X, Q) {
  return e$($.source, X, Q)
}
function VM($, X, Q) {
  const J = r0($.pattern) ? x$ : $.pattern
  return e$(J, X, Q)
}
function _M(_$, X, Q) {
  return e$(x$, X, Q)
}
function EM(_$, X, Q) {
  return e$(Q4, X, Q)
}
function xM(_$, X, Q) {
  return H0({ true: X, false: X }, Q)
}
function IM(_$, X, Q) {
  return e$(E$, X, Q)
}
function TM(_$, X, Q) {
  return e$(E$, X, Q)
}
function RX($, X, Q = {}) {
  return M0($)
    ? jM($.anyOf, X, Q)
    : i1($)
      ? CM($, X, Q)
      : c1($)
        ? FM($.const, X, Q)
        : e2($)
          ? xM($, X, Q)
          : A2($)
            ? IM($, X, Q)
            : D2($)
              ? TM($, X, Q)
              : gQ($)
                ? RM($, X, Q)
                : $$($)
                  ? VM($, X, Q)
                  : bQ($)
                    ? _M($, X, Q)
                    : V$($)
                      ? EM($, X, Q)
                      : s(Q)
}
function VX($) {
  return globalThis.Object.getOwnPropertyNames($.patternProperties)[0]
}
function a4($) {
  const X = VX($)
  return X === x$ ? _1() : X === E$ ? Q2() : _1({ pattern: X })
}
function _X($) {
  return $.patternProperties[VX($)]
}
function bM($, X) {
  return (X.parameters = V6($, X.parameters)), (X.returns = P2($, X.returns)), X
}
function kM($, X) {
  return (X.parameters = V6($, X.parameters)), (X.returns = P2($, X.returns)), X
}
function gM($, X) {
  return (X.allOf = V6($, X.allOf)), X
}
function fM($, X) {
  return (X.anyOf = V6($, X.anyOf)), X
}
function yM($, X) {
  if (r0(X.items)) return X
  return (X.items = V6($, X.items)), X
}
function vM($, X) {
  return (X.items = P2($, X.items)), X
}
function dM($, X) {
  return (X.items = P2($, X.items)), X
}
function hM($, X) {
  return (X.items = P2($, X.items)), X
}
function mM($, X) {
  return (X.item = P2($, X.item)), X
}
function uM($, X) {
  const Q = nM($, X.properties)
  return { ...X, ...H0(Q) }
}
function cM($, X) {
  const Q = P2($, a4(X)),
    J = P2($, _X(X)),
    Y = RX(Q, J)
  return { ...X, ...Y }
}
function pM($, X) {
  return X.index in $ ? $[X.index] : O2()
}
function iM($, X) {
  const Q = C8(X),
    J = T1(X),
    Y = P2($, X)
  return Q && J ? FX(Y) : Q && !J ? k1(Y) : !Q && J ? K1(Y) : Y
}
function nM($, X) {
  return globalThis.Object.getOwnPropertyNames(X).reduce((Q, J) => {
    return { ...Q, [J]: iM($, X[J]) }
  }, {})
}
function V6($, X) {
  return X.map((Q) => P2($, Q))
}
function P2($, X) {
  return z2(X)
    ? bM($, X)
    : H2(X)
      ? kM($, X)
      : m0(X)
        ? gM($, X)
        : M0(X)
          ? fM($, X)
          : n1(X)
            ? yM($, X)
            : w2(X)
              ? vM($, X)
              : n$(X)
                ? dM($, X)
                : l$(X)
                  ? hM($, X)
                  : t$(X)
                    ? mM($, X)
                    : a0(X)
                      ? uM($, X)
                      : s$(X)
                        ? cM($, X)
                        : kQ(X)
                          ? pM($, X)
                          : X
}
function e4($, X) {
  return P2(X, K8($))
}
function $Z($) {
  return F({ [L]: "Integer", type: "integer" }, $)
}
function oM($, X, Q) {
  return { [$]: L2(W0($), X, E0(Q)) }
}
function lM($, X, Q) {
  return $.reduce((Y, Z) => {
    return { ...Y, ...oM(Z, X, Q) }
  }, {})
}
function tM($, X, Q) {
  return lM($.keys, X, Q)
}
function XZ($, X, Q) {
  const J = tM($, X, Q)
  return G0(J)
}
function sM($) {
  const [X, Q] = [$.slice(0, 1), $.slice(1)]
  return [X.toLowerCase(), Q].join("")
}
function rM($) {
  const [X, Q] = [$.slice(0, 1), $.slice(1)]
  return [X.toUpperCase(), Q].join("")
}
function aM($) {
  return $.toUpperCase()
}
function eM($) {
  return $.toLowerCase()
}
function $B($, X, Q) {
  const J = x8($.pattern)
  if (!r$(J)) return { ...$, pattern: QZ($.pattern, X) }
  const W = [...C6(J)].map((G) => W0(G)),
    q = JZ(W, X),
    M = z0(q)
  return UX([M], Q)
}
function QZ($, X) {
  return typeof $ === "string"
    ? X === "Uncapitalize"
      ? sM($)
      : X === "Capitalize"
        ? rM($)
        : X === "Uppercase"
          ? aM($)
          : X === "Lowercase"
            ? eM($)
            : $
    : $.toString()
}
function JZ($, X) {
  return $.map((Q) => L2(Q, X))
}
function L2($, X, Q = {}) {
  return p1($)
    ? XZ($, X, Q)
    : i1($)
      ? $B($, X, Q)
      : M0($)
        ? z0(JZ($.anyOf, X), Q)
        : c1($)
          ? W0(QZ($.const, X), Q)
          : F($, Q)
}
function YZ($, X = {}) {
  return L2($, "Capitalize", X)
}
function ZZ($, X = {}) {
  return L2($, "Lowercase", X)
}
function WZ($, X = {}) {
  return L2($, "Uncapitalize", X)
}
function qZ($, X = {}) {
  return L2($, "Uppercase", X)
}
function XB($, X, Q) {
  const J = {}
  for (const Y of globalThis.Object.getOwnPropertyNames($)) J[Y] = k$($[Y], X, E0(Q))
  return J
}
function QB($, X, Q) {
  return XB($.properties, X, Q)
}
function MZ($, X, Q) {
  const J = QB($, X, Q)
  return G0(J)
}
function JB($, X) {
  return $.map((Q) => rQ(Q, X))
}
function YB($, X) {
  return $.map((Q) => rQ(Q, X))
}
function ZB($, X) {
  const { [X]: Q, ...J } = $
  return J
}
function WB($, X) {
  return X.reduce((Q, J) => ZB(Q, J), $)
}
function qB($, X) {
  const Q = u0($, [C0, "$id", "required", "properties"]),
    J = WB($.properties, X)
  return H0(J, Q)
}
function MB($) {
  const X = $.reduce((Q, J) => (MX(J) ? [...Q, W0(J)] : Q), [])
  return z0(X)
}
function rQ($, X) {
  return m0($) ? S1(JB($.allOf, X)) : M0($) ? z0(YB($.anyOf, X)) : a0($) ? qB($, X) : H0({})
}
function k$($, X, Q) {
  const J = s0(X) ? MB(X) : X,
    Y = g0(X) ? b1(X) : X,
    Z = n0($),
    W = n0(X)
  return I0($)
    ? MZ($, Y, Q)
    : p1(X)
      ? BZ($, X, Q)
      : Z && W
        ? _0("Omit", [$, J], Q)
        : !Z && W
          ? _0("Omit", [$, J], Q)
          : Z && !W
            ? _0("Omit", [$, J], Q)
            : F({ ...rQ($, Y), ...Q })
}
function BB($, X, Q) {
  return { [X]: k$($, [X], E0(Q)) }
}
function GB($, X, Q) {
  return X.reduce((J, Y) => {
    return { ...J, ...BB($, Y, Q) }
  }, {})
}
function NB($, X, Q) {
  return GB($, X.keys, Q)
}
function BZ($, X, Q) {
  const J = NB($, X, Q)
  return G0(J)
}
function wB($, X, Q) {
  const J = {}
  for (const Y of globalThis.Object.getOwnPropertyNames($)) J[Y] = g$($[Y], X, E0(Q))
  return J
}
function UB($, X, Q) {
  return wB($.properties, X, Q)
}
function GZ($, X, Q) {
  const J = UB($, X, Q)
  return G0(J)
}
function zB($, X) {
  return $.map((Q) => aQ(Q, X))
}
function HB($, X) {
  return $.map((Q) => aQ(Q, X))
}
function AB($, X) {
  const Q = {}
  for (const J of X) if (J in $) Q[J] = $[J]
  return Q
}
function DB($, X) {
  const Q = u0($, [C0, "$id", "required", "properties"]),
    J = AB($.properties, X)
  return H0(J, Q)
}
function OB($) {
  const X = $.reduce((Q, J) => (MX(J) ? [...Q, W0(J)] : Q), [])
  return z0(X)
}
function aQ($, X) {
  return m0($) ? S1(zB($.allOf, X)) : M0($) ? z0(HB($.anyOf, X)) : a0($) ? DB($, X) : H0({})
}
function g$($, X, Q) {
  const J = s0(X) ? OB(X) : X,
    Y = g0(X) ? b1(X) : X,
    Z = n0($),
    W = n0(X)
  return I0($)
    ? GZ($, Y, Q)
    : p1(X)
      ? NZ($, X, Q)
      : Z && W
        ? _0("Pick", [$, J], Q)
        : !Z && W
          ? _0("Pick", [$, J], Q)
          : Z && !W
            ? _0("Pick", [$, J], Q)
            : F({ ...aQ($, Y), ...Q })
}
function PB($, X, Q) {
  return { [X]: g$($, [X], E0(Q)) }
}
function LB($, X, Q) {
  return X.reduce((J, Y) => {
    return { ...J, ...PB($, Y, Q) }
  }, {})
}
function KB($, X, Q) {
  return LB($, X.keys, Q)
}
function NZ($, X, Q) {
  const J = KB($, X, Q)
  return G0(J)
}
function SB($, X) {
  return _0("Partial", [_0($, X)])
}
function CB($) {
  return _0("Partial", [Z2($)])
}
function jB($) {
  const X = {}
  for (const Q of globalThis.Object.getOwnPropertyNames($)) X[Q] = K1($[Q])
  return X
}
function FB($) {
  const X = u0($, [C0, "$id", "required", "properties"]),
    Q = jB($.properties)
  return H0(Q, X)
}
function wZ($) {
  return $.map((X) => UZ(X))
}
function UZ($) {
  return U2($)
    ? SB($.target, $.parameters)
    : n0($)
      ? CB($.$ref)
      : m0($)
        ? S1(wZ($.allOf))
        : M0($)
          ? z0(wZ($.anyOf))
          : a0($)
            ? FB($)
            : o$($)
              ? $
              : e2($)
                ? $
                : A2($)
                  ? $
                  : c1($)
                    ? $
                    : D6($)
                      ? $
                      : D2($)
                        ? $
                        : $$($)
                          ? $
                          : O6($)
                            ? $
                            : X$($)
                              ? $
                              : H0({})
}
function h8($, X) {
  if (I0($)) return zZ($, X)
  else return F({ ...UZ($), ...X })
}
function RB($, X) {
  const Q = {}
  for (const J of globalThis.Object.getOwnPropertyNames($)) Q[J] = h8($[J], E0(X))
  return Q
}
function VB($, X) {
  return RB($.properties, X)
}
function zZ($, X) {
  const Q = VB($, X)
  return G0(Q)
}
function _B($, X) {
  return _0("Required", [_0($, X)])
}
function EB($) {
  return _0("Required", [Z2($)])
}
function xB($) {
  const X = {}
  for (const Q of globalThis.Object.getOwnPropertyNames($)) X[Q] = u0($[Q], [Z1])
  return X
}
function IB($) {
  const X = u0($, [C0, "$id", "required", "properties"]),
    Q = xB($.properties)
  return H0(Q, X)
}
function HZ($) {
  return $.map((X) => AZ(X))
}
function AZ($) {
  return U2($)
    ? _B($.target, $.parameters)
    : n0($)
      ? EB($.$ref)
      : m0($)
        ? S1(HZ($.allOf))
        : M0($)
          ? z0(HZ($.anyOf))
          : a0($)
            ? IB($)
            : o$($)
              ? $
              : e2($)
                ? $
                : A2($)
                  ? $
                  : c1($)
                    ? $
                    : D6($)
                      ? $
                      : D2($)
                        ? $
                        : $$($)
                          ? $
                          : O6($)
                            ? $
                            : X$($)
                              ? $
                              : H0({})
}
function m8($, X) {
  if (I0($)) return DZ($, X)
  else return F({ ...AZ($), ...X })
}
function TB($, X) {
  const Q = {}
  for (const J of globalThis.Object.getOwnPropertyNames($)) Q[J] = m8($[J], X)
  return Q
}
function bB($, X) {
  return TB($.properties, X)
}
function DZ($, X) {
  const Q = bB($, X)
  return G0(Q)
}
function kB($, X) {
  return X.map((Q) => {
    return n0(Q) ? eQ($, Q.$ref) : o1($, Q)
  })
}
function eQ($, X) {
  return X in $ ? (n0($[X]) ? eQ($, $[X].$ref) : o1($, $[X])) : s()
}
function gB($) {
  return k8($[0])
}
function fB($) {
  return T$($[0], $[1])
}
function yB($) {
  return g8($[0])
}
function vB($) {
  return h8($[0])
}
function dB($) {
  return k$($[0], $[1])
}
function hB($) {
  return g$($[0], $[1])
}
function mB($) {
  return m8($[0])
}
function uB($, X, Q) {
  const J = kB($, Q)
  return X === "Awaited"
    ? gB(J)
    : X === "Index"
      ? fB(J)
      : X === "KeyOf"
        ? yB(J)
        : X === "Partial"
          ? vB(J)
          : X === "Omit"
            ? dB(J)
            : X === "Pick"
              ? hB(J)
              : X === "Required"
                ? mB(J)
                : s()
}
function cB($, X) {
  return R8(o1($, X))
}
function pB($, X) {
  return V8(o1($, X))
}
function iB($, X, Q) {
  return _8(_6($, X), o1($, Q))
}
function nB($, X, Q) {
  return v2(_6($, X), o1($, Q))
}
function oB($, X) {
  return S1(_6($, X))
}
function lB($, X) {
  return b8(o1($, X))
}
function tB($, X) {
  return H0(
    globalThis.Object.keys(X).reduce((Q, J) => {
      return { ...Q, [J]: o1($, X[J]) }
    }, {})
  )
}
function sB($, X) {
  const [Q, J] = [o1($, _X(X)), VX(X)],
    Y = K8(X)
  return (Y.patternProperties[J] = Q), Y
}
function rB($, X) {
  return n0(X) ? { ...eQ($, X.$ref), [C0]: X[C0] } : X
}
function aB($, X) {
  return J2(_6($, X))
}
function eB($, X) {
  return z0(_6($, X))
}
function _6($, X) {
  return X.map((Q) => o1($, Q))
}
function o1($, X) {
  return T1(X)
    ? F(o1($, u0(X, [Z1])), X)
    : C8(X)
      ? F(o1($, u0(X, [N2])), X)
      : U0(X)
        ? F(rB($, X), X)
        : w2(X)
          ? F(cB($, X.items), X)
          : n$(X)
            ? F(pB($, X.items), X)
            : U2(X)
              ? F(uB($, X.target, X.parameters))
              : z2(X)
                ? F(iB($, X.parameters, X.returns), X)
                : H2(X)
                  ? F(nB($, X.parameters, X.returns), X)
                  : m0(X)
                    ? F(oB($, X.allOf), X)
                    : l$(X)
                      ? F(lB($, X.items), X)
                      : a0(X)
                        ? F(tB($, X.properties), X)
                        : s$(X)
                          ? F(sB($, X))
                          : n1(X)
                            ? F(aB($, X.items || []), X)
                            : M0(X)
                              ? F(eB($, X.anyOf), X)
                              : X
}
function $G($, X) {
  return X in $ ? o1($, $[X]) : s()
}
function OZ($) {
  return globalThis.Object.getOwnPropertyNames($).reduce((X, Q) => {
    return { ...X, [Q]: $G($, Q) }
  }, {})
}
class PZ {
  constructor($) {
    const X = OZ($),
      Q = this.WithIdentifiers(X)
    this.$defs = Q
  }
  Import($, X) {
    const Q = { ...this.$defs, [$]: F(this.$defs[$], X) }
    return F({ [L]: "Import", $defs: Q, $ref: $ })
  }
  WithIdentifiers($) {
    return globalThis.Object.getOwnPropertyNames($).reduce((X, Q) => {
      return { ...X, [Q]: { ...$[Q], $id: Q } }
    }, {})
  }
}
function LZ($) {
  return new PZ($)
}
function KZ($, X) {
  return F({ [L]: "Not", not: $ }, X)
}
function SZ($, X) {
  return H2($) ? J2($.parameters, X) : s()
}
var XG = 0
function CZ($, X = {}) {
  if (r0(X.$id)) X.$id = `T${XG++}`
  const Q = K8($({ [L]: "This", $ref: `${X.$id}` }))
  return (Q.$id = X.$id), F({ [X2]: "Recursive", ...Q }, X)
}
function jZ($, X) {
  const Q = j0($) ? new globalThis.RegExp($) : $
  return F({ [L]: "RegExp", type: "RegExp", source: Q.source, flags: Q.flags }, X)
}
function QG($) {
  return m0($) ? $.allOf : M0($) ? $.anyOf : n1($) ? ($.items ?? []) : []
}
function FZ($) {
  return QG($)
}
function RZ($, X) {
  return H2($) ? F($.returns, X) : s(X)
}
class VZ {
  constructor($) {
    this.schema = $
  }
  Decode($) {
    return new _Z(this.schema, $)
  }
}
class _Z {
  constructor($, X) {
    ;(this.schema = $), (this.decode = X)
  }
  EncodeTransform($, X) {
    const Y = { Encode: (Z) => X[C0].Encode($(Z)), Decode: (Z) => this.decode(X[C0].Decode(Z)) }
    return { ...X, [C0]: Y }
  }
  EncodeSchema($, X) {
    const Q = { Decode: this.decode, Encode: $ }
    return { ...X, [C0]: Q }
  }
  Encode($) {
    return U0(this.schema)
      ? this.EncodeTransform($, this.schema)
      : this.EncodeSchema($, this.schema)
  }
}
function EZ($) {
  return new VZ($)
}
function EX($ = {}) {
  return F({ [L]: $[L] ?? "Unsafe" }, $)
}
function xZ($) {
  return F({ [L]: "Void", type: "void" }, $)
}
var $J = {}
F$($J, {
  Void: () => xZ,
  Uppercase: () => qZ,
  Unsafe: () => EX,
  Unknown: () => O2,
  Union: () => z0,
  Undefined: () => LX,
  Uncapitalize: () => WZ,
  Uint8Array: () => KX,
  Tuple: () => J2,
  Transform: () => EZ,
  TemplateLiteral: () => UX,
  Symbol: () => PX,
  String: () => _1,
  ReturnType: () => RZ,
  Rest: () => FZ,
  Required: () => m8,
  RegExp: () => jZ,
  Ref: () => Z2,
  Recursive: () => CZ,
  Record: () => RX,
  ReadonlyOptional: () => FX,
  Readonly: () => k1,
  Promise: () => HX,
  Pick: () => g$,
  Partial: () => h8,
  Parameters: () => SZ,
  Optional: () => K1,
  Omit: () => k$,
  Object: () => H0,
  Number: () => Q2,
  Null: () => OX,
  Not: () => KZ,
  Never: () => s,
  Module: () => LZ,
  Mapped: () => C4,
  Lowercase: () => ZZ,
  Literal: () => W0,
  KeyOf: () => g8,
  Iterator: () => b8,
  Intersect: () => S1,
  Integer: () => $Z,
  Instantiate: () => e4,
  InstanceType: () => r4,
  Index: () => T$,
  Function: () => v2,
  Extract: () => d8,
  Extends: () => y8,
  Exclude: () => v8,
  Enum: () => T4,
  Date: () => DX,
  ConstructorParameters: () => I4,
  Constructor: () => _8,
  Const: () => x4,
  Composite: () => E4,
  Capitalize: () => YZ,
  Boolean: () => wX,
  BigInt: () => T8,
  Awaited: () => k8,
  AsyncIterator: () => V8,
  Array: () => R8,
  Argument: () => q4,
  Any: () => I$,
})
var K2 = $J
var WY = P8(E6(), 1)
function WG($) {
  switch ($.errorType) {
    case C.ArrayContains:
      return "Expected array to contain at least one matching value"
    case C.ArrayMaxContains:
      return `Expected array to contain no more than ${$.schema.maxContains} matching values`
    case C.ArrayMinContains:
      return `Expected array to contain at least ${$.schema.minContains} matching values`
    case C.ArrayMaxItems:
      return `Expected array length to be less or equal to ${$.schema.maxItems}`
    case C.ArrayMinItems:
      return `Expected array length to be greater or equal to ${$.schema.minItems}`
    case C.ArrayUniqueItems:
      return "Expected array elements to be unique"
    case C.Array:
      return "Expected array"
    case C.AsyncIterator:
      return "Expected AsyncIterator"
    case C.BigIntExclusiveMaximum:
      return `Expected bigint to be less than ${$.schema.exclusiveMaximum}`
    case C.BigIntExclusiveMinimum:
      return `Expected bigint to be greater than ${$.schema.exclusiveMinimum}`
    case C.BigIntMaximum:
      return `Expected bigint to be less or equal to ${$.schema.maximum}`
    case C.BigIntMinimum:
      return `Expected bigint to be greater or equal to ${$.schema.minimum}`
    case C.BigIntMultipleOf:
      return `Expected bigint to be a multiple of ${$.schema.multipleOf}`
    case C.BigInt:
      return "Expected bigint"
    case C.Boolean:
      return "Expected boolean"
    case C.DateExclusiveMinimumTimestamp:
      return `Expected Date timestamp to be greater than ${$.schema.exclusiveMinimumTimestamp}`
    case C.DateExclusiveMaximumTimestamp:
      return `Expected Date timestamp to be less than ${$.schema.exclusiveMaximumTimestamp}`
    case C.DateMinimumTimestamp:
      return `Expected Date timestamp to be greater or equal to ${$.schema.minimumTimestamp}`
    case C.DateMaximumTimestamp:
      return `Expected Date timestamp to be less or equal to ${$.schema.maximumTimestamp}`
    case C.DateMultipleOfTimestamp:
      return `Expected Date timestamp to be a multiple of ${$.schema.multipleOfTimestamp}`
    case C.Date:
      return "Expected Date"
    case C.Function:
      return "Expected function"
    case C.IntegerExclusiveMaximum:
      return `Expected integer to be less than ${$.schema.exclusiveMaximum}`
    case C.IntegerExclusiveMinimum:
      return `Expected integer to be greater than ${$.schema.exclusiveMinimum}`
    case C.IntegerMaximum:
      return `Expected integer to be less or equal to ${$.schema.maximum}`
    case C.IntegerMinimum:
      return `Expected integer to be greater or equal to ${$.schema.minimum}`
    case C.IntegerMultipleOf:
      return `Expected integer to be a multiple of ${$.schema.multipleOf}`
    case C.Integer:
      return "Expected integer"
    case C.IntersectUnevaluatedProperties:
      return "Unexpected property"
    case C.Intersect:
      return "Expected all values to match"
    case C.Iterator:
      return "Expected Iterator"
    case C.Literal:
      return `Expected ${typeof $.schema.const === "string" ? `'${$.schema.const}'` : $.schema.const}`
    case C.Never:
      return "Never"
    case C.Not:
      return "Value should not match"
    case C.Null:
      return "Expected null"
    case C.NumberExclusiveMaximum:
      return `Expected number to be less than ${$.schema.exclusiveMaximum}`
    case C.NumberExclusiveMinimum:
      return `Expected number to be greater than ${$.schema.exclusiveMinimum}`
    case C.NumberMaximum:
      return `Expected number to be less or equal to ${$.schema.maximum}`
    case C.NumberMinimum:
      return `Expected number to be greater or equal to ${$.schema.minimum}`
    case C.NumberMultipleOf:
      return `Expected number to be a multiple of ${$.schema.multipleOf}`
    case C.Number:
      return "Expected number"
    case C.Object:
      return "Expected object"
    case C.ObjectAdditionalProperties:
      return "Unexpected property"
    case C.ObjectMaxProperties:
      return `Expected object to have no more than ${$.schema.maxProperties} properties`
    case C.ObjectMinProperties:
      return `Expected object to have at least ${$.schema.minProperties} properties`
    case C.ObjectRequiredProperty:
      return "Expected required property"
    case C.Promise:
      return "Expected Promise"
    case C.RegExp:
      return "Expected string to match regular expression"
    case C.StringFormatUnknown:
      return `Unknown format '${$.schema.format}'`
    case C.StringFormat:
      return `Expected string to match '${$.schema.format}' format`
    case C.StringMaxLength:
      return `Expected string length less or equal to ${$.schema.maxLength}`
    case C.StringMinLength:
      return `Expected string length greater or equal to ${$.schema.minLength}`
    case C.StringPattern:
      return `Expected string to match '${$.schema.pattern}'`
    case C.String:
      return "Expected string"
    case C.Symbol:
      return "Expected symbol"
    case C.TupleLength:
      return `Expected tuple to have ${$.schema.maxItems || 0} elements`
    case C.Tuple:
      return "Expected tuple"
    case C.Uint8ArrayMaxByteLength:
      return `Expected byte length less or equal to ${$.schema.maxByteLength}`
    case C.Uint8ArrayMinByteLength:
      return `Expected byte length greater or equal to ${$.schema.minByteLength}`
    case C.Uint8Array:
      return "Expected Uint8Array"
    case C.Undefined:
      return "Expected undefined"
    case C.Union:
      return "Expected union value"
    case C.Void:
      return "Expected void"
    case C.Kind:
      return `Expected kind '${$.schema[L]}'`
    default:
      return "Unknown error type"
  }
}
var qG = WG
function kZ() {
  return qG
}
class gZ extends p {
  constructor($) {
    super(`Unable to dereference schema with $id '${$.$ref}'`)
    this.schema = $
  }
}
function MG($, X) {
  const Q = X.find((J) => J.$id === $.$ref)
  if (Q === void 0) throw new gZ($)
  return B0(Q, X)
}
function N1($, X) {
  if (!q0($.$id) || X.some((Q) => Q.$id === $.$id)) return X
  return X.push($), X
}
function B0($, X) {
  return $[L] === "This" || $[L] === "Ref" ? MG($, X) : $
}
class fZ extends p {
  constructor($) {
    super("Unable to hash value")
    this.value = $
  }
}
var l1
;(($) => {
  ;($[($.Undefined = 0)] = "Undefined"),
    ($[($.Null = 1)] = "Null"),
    ($[($.Boolean = 2)] = "Boolean"),
    ($[($.Number = 3)] = "Number"),
    ($[($.String = 4)] = "String"),
    ($[($.Object = 5)] = "Object"),
    ($[($.Array = 6)] = "Array"),
    ($[($.Date = 7)] = "Date"),
    ($[($.Uint8Array = 8)] = "Uint8Array"),
    ($[($.Symbol = 9)] = "Symbol"),
    ($[($.BigInt = 10)] = "BigInt")
})(l1 || (l1 = {}))
var u8 = BigInt("14695981039346656037"),
  [BG, GG] = [BigInt("1099511628211"), BigInt("18446744073709551616")],
  NG = Array.from({ length: 256 }).map((_$, X) => BigInt(X)),
  yZ = new Float64Array(1),
  vZ = new DataView(yZ.buffer),
  dZ = new Uint8Array(yZ.buffer)
function* wG($) {
  const X = $ === 0 ? 1 : Math.ceil(Math.floor(Math.log2($) + 1) / 8)
  for (let Q = 0; Q < X; Q++) yield ($ >> (8 * (X - 1 - Q))) & 255
}
function UG($) {
  j1(l1.Array)
  for (const X of $) c8(X)
}
function zG($) {
  j1(l1.Boolean), j1($ ? 1 : 0)
}
function HG($) {
  j1(l1.BigInt), vZ.setBigInt64(0, $)
  for (const X of dZ) j1(X)
}
function AG($) {
  j1(l1.Date), c8($.getTime())
}
function DG(_$) {
  j1(l1.Null)
}
function OG($) {
  j1(l1.Number), vZ.setFloat64(0, $)
  for (const X of dZ) j1(X)
}
function PG($) {
  j1(l1.Object)
  for (const X of globalThis.Object.getOwnPropertyNames($).sort()) c8(X), c8($[X])
}
function LG($) {
  j1(l1.String)
  for (let X = 0; X < $.length; X++) for (const Q of wG($.charCodeAt(X))) j1(Q)
}
function KG($) {
  j1(l1.Symbol), c8($.description)
}
function SG($) {
  j1(l1.Uint8Array)
  for (let X = 0; X < $.length; X++) j1($[X])
}
function CG(_$) {
  return j1(l1.Undefined)
}
function c8($) {
  if (c($)) return UG($)
  if (y2($)) return zG($)
  if (z1($)) return HG($)
  if (V1($)) return AG($)
  if (r2($)) return DG($)
  if (u($)) return OG($)
  if (l($)) return PG($)
  if (q0($)) return LG($)
  if (a2($)) return KG($)
  if (S8($)) return SG($)
  if (x0($)) return CG($)
  throw new fZ($)
}
function j1($) {
  ;(u8 = u8 ^ NG[$]), (u8 = (u8 * BG) % GG)
}
function f$($) {
  return (u8 = BigInt("14695981039346656037")), c8($), u8
}
class hZ extends p {
  constructor($) {
    super("Unknown type")
    this.schema = $
  }
}
function jG($) {
  return $[L] === "Any" || $[L] === "Unknown"
}
function Q0($) {
  return $ !== void 0
}
function FG(_$, _X, _Q) {
  return !0
}
function RG(_$, _X, _Q) {
  return !0
}
function VG($, X, Q) {
  if (!c(Q)) return !1
  if (Q0($.minItems) && !(Q.length >= $.minItems)) return !1
  if (Q0($.maxItems) && !(Q.length <= $.maxItems)) return !1
  if (!Q.every((Z) => w1($.items, X, Z))) return !1
  if (
    $.uniqueItems === !0 &&
    !(() => {
      const Z = new Set()
      for (const W of Q) {
        const q = f$(W)
        if (Z.has(q)) return !1
        else Z.add(q)
      }
      return !0
    })()
  )
    return !1
  if (!(Q0($.contains) || u($.minContains) || u($.maxContains))) return !0
  const J = Q0($.contains) ? $.contains : s(),
    Y = Q.reduce((Z, W) => (w1(J, X, W) ? Z + 1 : Z), 0)
  if (Y === 0) return !1
  if (u($.minContains) && Y < $.minContains) return !1
  if (u($.maxContains) && Y > $.maxContains) return !1
  return !0
}
function _G(_$, _X, Q) {
  return YX(Q)
}
function EG($, _X, Q) {
  if (!z1(Q)) return !1
  if (Q0($.exclusiveMaximum) && !(Q < $.exclusiveMaximum)) return !1
  if (Q0($.exclusiveMinimum) && !(Q > $.exclusiveMinimum)) return !1
  if (Q0($.maximum) && !(Q <= $.maximum)) return !1
  if (Q0($.minimum) && !(Q >= $.minimum)) return !1
  if (Q0($.multipleOf) && Q % $.multipleOf !== BigInt(0)) return !1
  return !0
}
function xG(_$, _X, Q) {
  return y2(Q)
}
function IG($, X, Q) {
  return w1($.returns, X, Q.prototype)
}
function TG($, _X, Q) {
  if (!V1(Q)) return !1
  if (Q0($.exclusiveMaximumTimestamp) && !(Q.getTime() < $.exclusiveMaximumTimestamp)) return !1
  if (Q0($.exclusiveMinimumTimestamp) && !(Q.getTime() > $.exclusiveMinimumTimestamp)) return !1
  if (Q0($.maximumTimestamp) && !(Q.getTime() <= $.maximumTimestamp)) return !1
  if (Q0($.minimumTimestamp) && !(Q.getTime() >= $.minimumTimestamp)) return !1
  if (Q0($.multipleOfTimestamp) && Q.getTime() % $.multipleOfTimestamp !== 0) return !1
  return !0
}
function bG(_$, _X, Q) {
  return R$(Q)
}
function kG($, X, Q) {
  const J = globalThis.Object.values($.$defs),
    Y = $.$defs[$.$ref]
  return w1(Y, [...X, ...J], Q)
}
function gG($, _X, Q) {
  if (!qX(Q)) return !1
  if (Q0($.exclusiveMaximum) && !(Q < $.exclusiveMaximum)) return !1
  if (Q0($.exclusiveMinimum) && !(Q > $.exclusiveMinimum)) return !1
  if (Q0($.maximum) && !(Q <= $.maximum)) return !1
  if (Q0($.minimum) && !(Q >= $.minimum)) return !1
  if (Q0($.multipleOf) && Q % $.multipleOf !== 0) return !1
  return !0
}
function fG($, X, Q) {
  const J = $.allOf.every((Y) => w1(Y, X, Q))
  if ($.unevaluatedProperties === !1) {
    const Y = new RegExp(Y$($)),
      Z = Object.getOwnPropertyNames(Q).every((W) => Y.test(W))
    return J && Z
  } else if (g0($.unevaluatedProperties)) {
    const Y = new RegExp(Y$($)),
      Z = Object.getOwnPropertyNames(Q).every(
        (W) => Y.test(W) || w1($.unevaluatedProperties, X, Q[W])
      )
    return J && Z
  } else return J
}
function yG(_$, _X, Q) {
  return ZX(Q)
}
function vG($, _X, Q) {
  return Q === $.const
}
function dG(_$, _X, _Q) {
  return !1
}
function hG($, X, Q) {
  return !w1($.not, X, Q)
}
function mG(_$, _X, Q) {
  return r2(Q)
}
function uG($, _X, Q) {
  if (!V0.IsNumberLike(Q)) return !1
  if (Q0($.exclusiveMaximum) && !(Q < $.exclusiveMaximum)) return !1
  if (Q0($.exclusiveMinimum) && !(Q > $.exclusiveMinimum)) return !1
  if (Q0($.minimum) && !(Q >= $.minimum)) return !1
  if (Q0($.maximum) && !(Q <= $.maximum)) return !1
  if (Q0($.multipleOf) && Q % $.multipleOf !== 0) return !1
  return !0
}
function cG($, X, Q) {
  if (!V0.IsObjectLike(Q)) return !1
  if (Q0($.minProperties) && !(Object.getOwnPropertyNames(Q).length >= $.minProperties)) return !1
  if (Q0($.maxProperties) && !(Object.getOwnPropertyNames(Q).length <= $.maxProperties)) return !1
  const J = Object.getOwnPropertyNames($.properties)
  for (const Y of J) {
    const Z = $.properties[Y]
    if ($.required?.includes(Y)) {
      if (!w1(Z, X, Q[Y])) return !1
      if ((Z$(Z) || jG(Z)) && !(Y in Q)) return !1
    } else if (V0.IsExactOptionalProperty(Q, Y) && !w1(Z, X, Q[Y])) return !1
  }
  if ($.additionalProperties === !1) {
    const Y = Object.getOwnPropertyNames(Q)
    if ($.required && $.required.length === J.length && Y.length === J.length) return !0
    else return Y.every((Z) => J.includes(Z))
  } else if (typeof $.additionalProperties === "object")
    return Object.getOwnPropertyNames(Q).every(
      (Z) => J.includes(Z) || w1($.additionalProperties, X, Q[Z])
    )
  else return !0
}
function pG(_$, _X, Q) {
  return WX(Q)
}
function iG($, X, Q) {
  if (!V0.IsRecordLike(Q)) return !1
  if (Q0($.minProperties) && !(Object.getOwnPropertyNames(Q).length >= $.minProperties)) return !1
  if (Q0($.maxProperties) && !(Object.getOwnPropertyNames(Q).length <= $.maxProperties)) return !1
  const [J, Y] = Object.entries($.patternProperties)[0],
    Z = new RegExp(J),
    W = Object.entries(Q).every(([G, B]) => {
      return Z.test(G) ? w1(Y, X, B) : !0
    }),
    q =
      typeof $.additionalProperties === "object"
        ? Object.entries(Q).every(([G, B]) => {
            return !Z.test(G) ? w1($.additionalProperties, X, B) : !0
          })
        : !0,
    M =
      $.additionalProperties === !1
        ? Object.getOwnPropertyNames(Q).every((G) => {
            return Z.test(G)
          })
        : !0
  return W && q && M
}
function nG($, X, Q) {
  return w1(B0($, X), X, Q)
}
function oG($, _X, Q) {
  const J = new RegExp($.source, $.flags)
  if (Q0($.minLength)) {
    if (!(Q.length >= $.minLength)) return !1
  }
  if (Q0($.maxLength)) {
    if (!(Q.length <= $.maxLength)) return !1
  }
  return J.test(Q)
}
function lG($, _X, Q) {
  if (!q0(Q)) return !1
  if (Q0($.minLength)) {
    if (!(Q.length >= $.minLength)) return !1
  }
  if (Q0($.maxLength)) {
    if (!(Q.length <= $.maxLength)) return !1
  }
  if (Q0($.pattern)) {
    if (!new RegExp($.pattern).test(Q)) return !1
  }
  if (Q0($.format)) {
    if (!O0.Has($.format)) return !1
    return O0.Get($.format)(Q)
  }
  return !0
}
function tG(_$, _X, Q) {
  return a2(Q)
}
function sG($, _X, Q) {
  return q0(Q) && new RegExp($.pattern).test(Q)
}
function rG($, X, Q) {
  return w1(B0($, X), X, Q)
}
function aG($, X, Q) {
  if (!c(Q)) return !1
  if ($.items === void 0 && Q.length !== 0) return !1
  if (Q.length !== $.maxItems) return !1
  if (!$.items) return !0
  for (let J = 0; J < $.items.length; J++) if (!w1($.items[J], X, Q[J])) return !1
  return !0
}
function eG(_$, _X, Q) {
  return x0(Q)
}
function $N($, X, Q) {
  return $.anyOf.some((J) => w1(J, X, Q))
}
function XN($, _X, Q) {
  if (!S8(Q)) return !1
  if (Q0($.maxByteLength) && !(Q.length <= $.maxByteLength)) return !1
  if (Q0($.minByteLength) && !(Q.length >= $.minByteLength)) return !1
  return !0
}
function QN(_$, _X, _Q) {
  return !0
}
function JN(_$, _X, Q) {
  return V0.IsVoidLike(Q)
}
function YN($, _X, Q) {
  if (!W1.Has($[L])) return !1
  return W1.Get($[L])($, Q)
}
function w1($, X, Q) {
  const J = Q0($.$id) ? N1($, X) : X,
    Y = $
  switch (Y[L]) {
    case "Any":
      return FG(Y, J, Q)
    case "Argument":
      return RG(Y, J, Q)
    case "Array":
      return VG(Y, J, Q)
    case "AsyncIterator":
      return _G(Y, J, Q)
    case "BigInt":
      return EG(Y, J, Q)
    case "Boolean":
      return xG(Y, J, Q)
    case "Constructor":
      return IG(Y, J, Q)
    case "Date":
      return TG(Y, J, Q)
    case "Function":
      return bG(Y, J, Q)
    case "Import":
      return kG(Y, J, Q)
    case "Integer":
      return gG(Y, J, Q)
    case "Intersect":
      return fG(Y, J, Q)
    case "Iterator":
      return yG(Y, J, Q)
    case "Literal":
      return vG(Y, J, Q)
    case "Never":
      return dG(Y, J, Q)
    case "Not":
      return hG(Y, J, Q)
    case "Null":
      return mG(Y, J, Q)
    case "Number":
      return uG(Y, J, Q)
    case "Object":
      return cG(Y, J, Q)
    case "Promise":
      return pG(Y, J, Q)
    case "Record":
      return iG(Y, J, Q)
    case "Ref":
      return nG(Y, J, Q)
    case "RegExp":
      return oG(Y, J, Q)
    case "String":
      return lG(Y, J, Q)
    case "Symbol":
      return tG(Y, J, Q)
    case "TemplateLiteral":
      return sG(Y, J, Q)
    case "This":
      return rG(Y, J, Q)
    case "Tuple":
      return aG(Y, J, Q)
    case "Undefined":
      return eG(Y, J, Q)
    case "Union":
      return $N(Y, J, Q)
    case "Uint8Array":
      return XN(Y, J, Q)
    case "Unknown":
      return QN(Y, J, Q)
    case "Void":
      return JN(Y, J, Q)
    default:
      if (!W1.Has(Y[L])) throw new hZ(Y)
      return YN(Y, J, Q)
  }
}
function r(...$) {
  return $.length === 3 ? w1($[0], $[1], $[2]) : w1($[0], [], $[1])
}
var C
;(($) => {
  ;($[($.ArrayContains = 0)] = "ArrayContains"),
    ($[($.ArrayMaxContains = 1)] = "ArrayMaxContains"),
    ($[($.ArrayMaxItems = 2)] = "ArrayMaxItems"),
    ($[($.ArrayMinContains = 3)] = "ArrayMinContains"),
    ($[($.ArrayMinItems = 4)] = "ArrayMinItems"),
    ($[($.ArrayUniqueItems = 5)] = "ArrayUniqueItems"),
    ($[($.Array = 6)] = "Array"),
    ($[($.AsyncIterator = 7)] = "AsyncIterator"),
    ($[($.BigIntExclusiveMaximum = 8)] = "BigIntExclusiveMaximum"),
    ($[($.BigIntExclusiveMinimum = 9)] = "BigIntExclusiveMinimum"),
    ($[($.BigIntMaximum = 10)] = "BigIntMaximum"),
    ($[($.BigIntMinimum = 11)] = "BigIntMinimum"),
    ($[($.BigIntMultipleOf = 12)] = "BigIntMultipleOf"),
    ($[($.BigInt = 13)] = "BigInt"),
    ($[($.Boolean = 14)] = "Boolean"),
    ($[($.DateExclusiveMaximumTimestamp = 15)] = "DateExclusiveMaximumTimestamp"),
    ($[($.DateExclusiveMinimumTimestamp = 16)] = "DateExclusiveMinimumTimestamp"),
    ($[($.DateMaximumTimestamp = 17)] = "DateMaximumTimestamp"),
    ($[($.DateMinimumTimestamp = 18)] = "DateMinimumTimestamp"),
    ($[($.DateMultipleOfTimestamp = 19)] = "DateMultipleOfTimestamp"),
    ($[($.Date = 20)] = "Date"),
    ($[($.Function = 21)] = "Function"),
    ($[($.IntegerExclusiveMaximum = 22)] = "IntegerExclusiveMaximum"),
    ($[($.IntegerExclusiveMinimum = 23)] = "IntegerExclusiveMinimum"),
    ($[($.IntegerMaximum = 24)] = "IntegerMaximum"),
    ($[($.IntegerMinimum = 25)] = "IntegerMinimum"),
    ($[($.IntegerMultipleOf = 26)] = "IntegerMultipleOf"),
    ($[($.Integer = 27)] = "Integer"),
    ($[($.IntersectUnevaluatedProperties = 28)] = "IntersectUnevaluatedProperties"),
    ($[($.Intersect = 29)] = "Intersect"),
    ($[($.Iterator = 30)] = "Iterator"),
    ($[($.Kind = 31)] = "Kind"),
    ($[($.Literal = 32)] = "Literal"),
    ($[($.Never = 33)] = "Never"),
    ($[($.Not = 34)] = "Not"),
    ($[($.Null = 35)] = "Null"),
    ($[($.NumberExclusiveMaximum = 36)] = "NumberExclusiveMaximum"),
    ($[($.NumberExclusiveMinimum = 37)] = "NumberExclusiveMinimum"),
    ($[($.NumberMaximum = 38)] = "NumberMaximum"),
    ($[($.NumberMinimum = 39)] = "NumberMinimum"),
    ($[($.NumberMultipleOf = 40)] = "NumberMultipleOf"),
    ($[($.Number = 41)] = "Number"),
    ($[($.ObjectAdditionalProperties = 42)] = "ObjectAdditionalProperties"),
    ($[($.ObjectMaxProperties = 43)] = "ObjectMaxProperties"),
    ($[($.ObjectMinProperties = 44)] = "ObjectMinProperties"),
    ($[($.ObjectRequiredProperty = 45)] = "ObjectRequiredProperty"),
    ($[($.Object = 46)] = "Object"),
    ($[($.Promise = 47)] = "Promise"),
    ($[($.RegExp = 48)] = "RegExp"),
    ($[($.StringFormatUnknown = 49)] = "StringFormatUnknown"),
    ($[($.StringFormat = 50)] = "StringFormat"),
    ($[($.StringMaxLength = 51)] = "StringMaxLength"),
    ($[($.StringMinLength = 52)] = "StringMinLength"),
    ($[($.StringPattern = 53)] = "StringPattern"),
    ($[($.String = 54)] = "String"),
    ($[($.Symbol = 55)] = "Symbol"),
    ($[($.TupleLength = 56)] = "TupleLength"),
    ($[($.Tuple = 57)] = "Tuple"),
    ($[($.Uint8ArrayMaxByteLength = 58)] = "Uint8ArrayMaxByteLength"),
    ($[($.Uint8ArrayMinByteLength = 59)] = "Uint8ArrayMinByteLength"),
    ($[($.Uint8Array = 60)] = "Uint8Array"),
    ($[($.Undefined = 61)] = "Undefined"),
    ($[($.Union = 62)] = "Union"),
    ($[($.Void = 63)] = "Void")
})(C || (C = {}))
class mZ extends p {
  constructor($) {
    super("Unknown type")
    this.schema = $
  }
}
function W$($) {
  return $.replace(/~/g, "~0").replace(/\//g, "~1")
}
function J0($) {
  return $ !== void 0
}
class $8 {
  constructor($) {
    this.iterator = $
  }
  [Symbol.iterator]() {
    return this.iterator
  }
  First() {
    const $ = this.iterator.next()
    return $.done ? void 0 : $.value
  }
}
function h($, X, Q, J, Y = []) {
  return {
    type: $,
    schema: X,
    path: Q,
    value: J,
    message: kZ()({ errorType: $, path: Q, schema: X, value: J, errors: Y }),
    errors: Y,
  }
}
function* ZN(_$, _X, _Q, _J) {}
function* WN(_$, _X, _Q, _J) {}
function* qN($, X, Q, J) {
  if (!c(J)) return yield h(C.Array, $, Q, J)
  if (J0($.minItems) && !(J.length >= $.minItems)) yield h(C.ArrayMinItems, $, Q, J)
  if (J0($.maxItems) && !(J.length <= $.maxItems)) yield h(C.ArrayMaxItems, $, Q, J)
  for (let W = 0; W < J.length; W++) yield* U1($.items, X, `${Q}/${W}`, J[W])
  if (
    $.uniqueItems === !0 &&
    !(() => {
      const W = new Set()
      for (const q of J) {
        const M = f$(q)
        if (W.has(M)) return !1
        else W.add(M)
      }
      return !0
    })()
  )
    yield h(C.ArrayUniqueItems, $, Q, J)
  if (!(J0($.contains) || J0($.minContains) || J0($.maxContains))) return
  const Y = J0($.contains) ? $.contains : s(),
    Z = J.reduce((W, q, M) => (U1(Y, X, `${Q}${M}`, q).next().done === !0 ? W + 1 : W), 0)
  if (Z === 0) yield h(C.ArrayContains, $, Q, J)
  if (u($.minContains) && Z < $.minContains) yield h(C.ArrayMinContains, $, Q, J)
  if (u($.maxContains) && Z > $.maxContains) yield h(C.ArrayMaxContains, $, Q, J)
}
function* MN($, _X, Q, J) {
  if (!YX(J)) yield h(C.AsyncIterator, $, Q, J)
}
function* BN($, _X, Q, J) {
  if (!z1(J)) return yield h(C.BigInt, $, Q, J)
  if (J0($.exclusiveMaximum) && !(J < $.exclusiveMaximum))
    yield h(C.BigIntExclusiveMaximum, $, Q, J)
  if (J0($.exclusiveMinimum) && !(J > $.exclusiveMinimum))
    yield h(C.BigIntExclusiveMinimum, $, Q, J)
  if (J0($.maximum) && !(J <= $.maximum)) yield h(C.BigIntMaximum, $, Q, J)
  if (J0($.minimum) && !(J >= $.minimum)) yield h(C.BigIntMinimum, $, Q, J)
  if (J0($.multipleOf) && J % $.multipleOf !== BigInt(0)) yield h(C.BigIntMultipleOf, $, Q, J)
}
function* GN($, _X, Q, J) {
  if (!y2(J)) yield h(C.Boolean, $, Q, J)
}
function* NN($, X, Q, J) {
  yield* U1($.returns, X, Q, J.prototype)
}
function* wN($, _X, Q, J) {
  if (!V1(J)) return yield h(C.Date, $, Q, J)
  if (J0($.exclusiveMaximumTimestamp) && !(J.getTime() < $.exclusiveMaximumTimestamp))
    yield h(C.DateExclusiveMaximumTimestamp, $, Q, J)
  if (J0($.exclusiveMinimumTimestamp) && !(J.getTime() > $.exclusiveMinimumTimestamp))
    yield h(C.DateExclusiveMinimumTimestamp, $, Q, J)
  if (J0($.maximumTimestamp) && !(J.getTime() <= $.maximumTimestamp))
    yield h(C.DateMaximumTimestamp, $, Q, J)
  if (J0($.minimumTimestamp) && !(J.getTime() >= $.minimumTimestamp))
    yield h(C.DateMinimumTimestamp, $, Q, J)
  if (J0($.multipleOfTimestamp) && J.getTime() % $.multipleOfTimestamp !== 0)
    yield h(C.DateMultipleOfTimestamp, $, Q, J)
}
function* UN($, _X, Q, J) {
  if (!R$(J)) yield h(C.Function, $, Q, J)
}
function* zN($, X, Q, J) {
  const Y = globalThis.Object.values($.$defs),
    Z = $.$defs[$.$ref]
  yield* U1(Z, [...X, ...Y], Q, J)
}
function* HN($, _X, Q, J) {
  if (!qX(J)) return yield h(C.Integer, $, Q, J)
  if (J0($.exclusiveMaximum) && !(J < $.exclusiveMaximum))
    yield h(C.IntegerExclusiveMaximum, $, Q, J)
  if (J0($.exclusiveMinimum) && !(J > $.exclusiveMinimum))
    yield h(C.IntegerExclusiveMinimum, $, Q, J)
  if (J0($.maximum) && !(J <= $.maximum)) yield h(C.IntegerMaximum, $, Q, J)
  if (J0($.minimum) && !(J >= $.minimum)) yield h(C.IntegerMinimum, $, Q, J)
  if (J0($.multipleOf) && J % $.multipleOf !== 0) yield h(C.IntegerMultipleOf, $, Q, J)
}
function* AN($, X, Q, J) {
  let Y = !1
  for (const Z of $.allOf) for (const W of U1(Z, X, Q, J)) (Y = !0), yield W
  if (Y) return yield h(C.Intersect, $, Q, J)
  if ($.unevaluatedProperties === !1) {
    const Z = new RegExp(Y$($))
    for (const W of Object.getOwnPropertyNames(J))
      if (!Z.test(W)) yield h(C.IntersectUnevaluatedProperties, $, `${Q}/${W}`, J)
  }
  if (typeof $.unevaluatedProperties === "object") {
    const Z = new RegExp(Y$($))
    for (const W of Object.getOwnPropertyNames(J))
      if (!Z.test(W)) {
        const q = U1($.unevaluatedProperties, X, `${Q}/${W}`, J[W]).next()
        if (!q.done) yield q.value
      }
  }
}
function* DN($, _X, Q, J) {
  if (!ZX(J)) yield h(C.Iterator, $, Q, J)
}
function* ON($, _X, Q, J) {
  if (J !== $.const) yield h(C.Literal, $, Q, J)
}
function* PN($, _X, Q, J) {
  yield h(C.Never, $, Q, J)
}
function* LN($, X, Q, J) {
  if (U1($.not, X, Q, J).next().done === !0) yield h(C.Not, $, Q, J)
}
function* KN($, _X, Q, J) {
  if (!r2(J)) yield h(C.Null, $, Q, J)
}
function* SN($, _X, Q, J) {
  if (!V0.IsNumberLike(J)) return yield h(C.Number, $, Q, J)
  if (J0($.exclusiveMaximum) && !(J < $.exclusiveMaximum))
    yield h(C.NumberExclusiveMaximum, $, Q, J)
  if (J0($.exclusiveMinimum) && !(J > $.exclusiveMinimum))
    yield h(C.NumberExclusiveMinimum, $, Q, J)
  if (J0($.maximum) && !(J <= $.maximum)) yield h(C.NumberMaximum, $, Q, J)
  if (J0($.minimum) && !(J >= $.minimum)) yield h(C.NumberMinimum, $, Q, J)
  if (J0($.multipleOf) && J % $.multipleOf !== 0) yield h(C.NumberMultipleOf, $, Q, J)
}
function* CN($, X, Q, J) {
  if (!V0.IsObjectLike(J)) return yield h(C.Object, $, Q, J)
  if (J0($.minProperties) && !(Object.getOwnPropertyNames(J).length >= $.minProperties))
    yield h(C.ObjectMinProperties, $, Q, J)
  if (J0($.maxProperties) && !(Object.getOwnPropertyNames(J).length <= $.maxProperties))
    yield h(C.ObjectMaxProperties, $, Q, J)
  const Y = Array.isArray($.required) ? $.required : [],
    Z = Object.getOwnPropertyNames($.properties),
    W = Object.getOwnPropertyNames(J)
  for (const q of Y) {
    if (W.includes(q)) continue
    yield h(C.ObjectRequiredProperty, $.properties[q], `${Q}/${W$(q)}`, void 0)
  }
  if ($.additionalProperties === !1) {
    for (const q of W)
      if (!Z.includes(q)) yield h(C.ObjectAdditionalProperties, $, `${Q}/${W$(q)}`, J[q])
  }
  if (typeof $.additionalProperties === "object")
    for (const q of W) {
      if (Z.includes(q)) continue
      yield* U1($.additionalProperties, X, `${Q}/${W$(q)}`, J[q])
    }
  for (const q of Z) {
    const M = $.properties[q]
    if ($.required?.includes(q)) {
      if ((yield* U1(M, X, `${Q}/${W$(q)}`, J[q]), Z$($) && !(q in J)))
        yield h(C.ObjectRequiredProperty, M, `${Q}/${W$(q)}`, void 0)
    } else if (V0.IsExactOptionalProperty(J, q)) yield* U1(M, X, `${Q}/${W$(q)}`, J[q])
  }
}
function* jN($, _X, Q, J) {
  if (!WX(J)) yield h(C.Promise, $, Q, J)
}
function* FN($, X, Q, J) {
  if (!V0.IsRecordLike(J)) return yield h(C.Object, $, Q, J)
  if (J0($.minProperties) && !(Object.getOwnPropertyNames(J).length >= $.minProperties))
    yield h(C.ObjectMinProperties, $, Q, J)
  if (J0($.maxProperties) && !(Object.getOwnPropertyNames(J).length <= $.maxProperties))
    yield h(C.ObjectMaxProperties, $, Q, J)
  const [Y, Z] = Object.entries($.patternProperties)[0],
    W = new RegExp(Y)
  for (const [q, M] of Object.entries(J)) if (W.test(q)) yield* U1(Z, X, `${Q}/${W$(q)}`, M)
  if (typeof $.additionalProperties === "object") {
    for (const [q, M] of Object.entries(J))
      if (!W.test(q)) yield* U1($.additionalProperties, X, `${Q}/${W$(q)}`, M)
  }
  if ($.additionalProperties === !1)
    for (const [q, M] of Object.entries(J)) {
      if (W.test(q)) continue
      return yield h(C.ObjectAdditionalProperties, $, `${Q}/${W$(q)}`, M)
    }
}
function* RN($, X, Q, J) {
  yield* U1(B0($, X), X, Q, J)
}
function* VN($, _X, Q, J) {
  if (!q0(J)) return yield h(C.String, $, Q, J)
  if (J0($.minLength) && !(J.length >= $.minLength)) yield h(C.StringMinLength, $, Q, J)
  if (J0($.maxLength) && !(J.length <= $.maxLength)) yield h(C.StringMaxLength, $, Q, J)
  if (!new RegExp($.source, $.flags).test(J)) return yield h(C.RegExp, $, Q, J)
}
function* _N($, _X, Q, J) {
  if (!q0(J)) return yield h(C.String, $, Q, J)
  if (J0($.minLength) && !(J.length >= $.minLength)) yield h(C.StringMinLength, $, Q, J)
  if (J0($.maxLength) && !(J.length <= $.maxLength)) yield h(C.StringMaxLength, $, Q, J)
  if (q0($.pattern)) {
    if (!new RegExp($.pattern).test(J)) yield h(C.StringPattern, $, Q, J)
  }
  if (q0($.format)) {
    if (!O0.Has($.format)) yield h(C.StringFormatUnknown, $, Q, J)
    else if (!O0.Get($.format)(J)) yield h(C.StringFormat, $, Q, J)
  }
}
function* EN($, _X, Q, J) {
  if (!a2(J)) yield h(C.Symbol, $, Q, J)
}
function* xN($, _X, Q, J) {
  if (!q0(J)) return yield h(C.String, $, Q, J)
  if (!new RegExp($.pattern).test(J)) yield h(C.StringPattern, $, Q, J)
}
function* IN($, X, Q, J) {
  yield* U1(B0($, X), X, Q, J)
}
function* TN($, X, Q, J) {
  if (!c(J)) return yield h(C.Tuple, $, Q, J)
  if ($.items === void 0 && J.length !== 0) return yield h(C.TupleLength, $, Q, J)
  if (J.length !== $.maxItems) return yield h(C.TupleLength, $, Q, J)
  if (!$.items) return
  for (let Y = 0; Y < $.items.length; Y++) yield* U1($.items[Y], X, `${Q}/${Y}`, J[Y])
}
function* bN($, _X, Q, J) {
  if (!x0(J)) yield h(C.Undefined, $, Q, J)
}
function* kN($, X, Q, J) {
  if (r($, X, J)) return
  const Y = $.anyOf.map((Z) => new $8(U1(Z, X, Q, J)))
  yield h(C.Union, $, Q, J, Y)
}
function* gN($, _X, Q, J) {
  if (!S8(J)) return yield h(C.Uint8Array, $, Q, J)
  if (J0($.maxByteLength) && !(J.length <= $.maxByteLength))
    yield h(C.Uint8ArrayMaxByteLength, $, Q, J)
  if (J0($.minByteLength) && !(J.length >= $.minByteLength))
    yield h(C.Uint8ArrayMinByteLength, $, Q, J)
}
function* fN(_$, _X, _Q, _J) {}
function* yN($, _X, Q, J) {
  if (!V0.IsVoidLike(J)) yield h(C.Void, $, Q, J)
}
function* vN($, _X, Q, J) {
  if (!W1.Get($[L])($, J)) yield h(C.Kind, $, Q, J)
}
function* U1($, X, Q, J) {
  const Y = J0($.$id) ? [...X, $] : X,
    Z = $
  switch (Z[L]) {
    case "Any":
      return yield* ZN(Z, Y, Q, J)
    case "Argument":
      return yield* WN(Z, Y, Q, J)
    case "Array":
      return yield* qN(Z, Y, Q, J)
    case "AsyncIterator":
      return yield* MN(Z, Y, Q, J)
    case "BigInt":
      return yield* BN(Z, Y, Q, J)
    case "Boolean":
      return yield* GN(Z, Y, Q, J)
    case "Constructor":
      return yield* NN(Z, Y, Q, J)
    case "Date":
      return yield* wN(Z, Y, Q, J)
    case "Function":
      return yield* UN(Z, Y, Q, J)
    case "Import":
      return yield* zN(Z, Y, Q, J)
    case "Integer":
      return yield* HN(Z, Y, Q, J)
    case "Intersect":
      return yield* AN(Z, Y, Q, J)
    case "Iterator":
      return yield* DN(Z, Y, Q, J)
    case "Literal":
      return yield* ON(Z, Y, Q, J)
    case "Never":
      return yield* PN(Z, Y, Q, J)
    case "Not":
      return yield* LN(Z, Y, Q, J)
    case "Null":
      return yield* KN(Z, Y, Q, J)
    case "Number":
      return yield* SN(Z, Y, Q, J)
    case "Object":
      return yield* CN(Z, Y, Q, J)
    case "Promise":
      return yield* jN(Z, Y, Q, J)
    case "Record":
      return yield* FN(Z, Y, Q, J)
    case "Ref":
      return yield* RN(Z, Y, Q, J)
    case "RegExp":
      return yield* VN(Z, Y, Q, J)
    case "String":
      return yield* _N(Z, Y, Q, J)
    case "Symbol":
      return yield* EN(Z, Y, Q, J)
    case "TemplateLiteral":
      return yield* xN(Z, Y, Q, J)
    case "This":
      return yield* IN(Z, Y, Q, J)
    case "Tuple":
      return yield* TN(Z, Y, Q, J)
    case "Undefined":
      return yield* bN(Z, Y, Q, J)
    case "Union":
      return yield* kN(Z, Y, Q, J)
    case "Uint8Array":
      return yield* gN(Z, Y, Q, J)
    case "Unknown":
      return yield* fN(Z, Y, Q, J)
    case "Void":
      return yield* yN(Z, Y, Q, J)
    default:
      if (!W1.Has(Z[L])) throw new mZ($)
      return yield* vN(Z, Y, Q, J)
  }
}
function h2(...$) {
  const X = $.length === 3 ? U1($[0], $[1], "", $[2]) : U1($[0], [], "", $[1])
  return new $8(X)
}
var dN = ($, X, Q, J, Y) => {
    if (J === "m") throw TypeError("Private method is not writable")
    if (J === "a" && !Y) throw TypeError("Private accessor was defined without a setter")
    if (typeof X === "function" ? $ !== X || !Y : !X.has($))
      throw TypeError("Cannot write private member to an object whose class did not declare it")
    return J === "a" ? Y.call($, Q) : Y ? (Y.value = Q) : X.set($, Q), Q
  },
  cZ = ($, X, Q, J) => {
    if (Q === "a" && !J) throw TypeError("Private accessor was defined without a getter")
    if (typeof X === "function" ? $ !== X || !J : !X.has($))
      throw TypeError("Cannot read private member from an object whose class did not declare it")
    return Q === "m" ? J : Q === "a" ? J.call($) : J ? J.value : X.get($)
  },
  QJ,
  xX,
  pZ
class iZ extends p {
  constructor($) {
    const X = $.First()
    super(X === void 0 ? "Invalid Value" : X.message)
    QJ.add(this), xX.set(this, void 0), dN(this, xX, $, "f"), (this.error = X)
  }
  Errors() {
    return new $8(cZ(this, QJ, "m", pZ).call(this))
  }
}
;(xX = new WeakMap()),
  (QJ = new WeakSet()),
  (pZ = function* () {
    if (this.error) yield this.error
    yield* cZ(this, xX, "f")
  })
function uZ($, X, Q) {
  if (r($, X, Q)) return
  throw new iZ(h2($, X, Q))
}
function IX(...$) {
  return $.length === 3 ? uZ($[0], $[1], $[2]) : uZ($[0], [], $[1])
}
function hN($) {
  const X = {}
  for (const Q of Object.getOwnPropertyNames($)) X[Q] = N0($[Q])
  for (const Q of Object.getOwnPropertySymbols($)) X[Q] = N0($[Q])
  return X
}
function mN($) {
  return $.map((X) => N0(X))
}
function uN($) {
  return $.slice()
}
function cN($) {
  return new Map(N0([...$.entries()]))
}
function pN($) {
  return new Set(N0([...$.entries()]))
}
function iN($) {
  return new Date($.toISOString())
}
function nN($) {
  return $
}
function N0($) {
  if (c($)) return mN($)
  if (V1($)) return iN($)
  if ($2($)) return uN($)
  if (BY($)) return cN($)
  if (GY($)) return pN($)
  if (l($)) return hN($)
  if (u1($)) return nN($)
  throw Error("ValueClone: Unable to clone value")
}
class M2 extends p {
  constructor($, X) {
    super(X)
    this.schema = $
  }
}
function w0($) {
  return R$($) ? $() : N0($)
}
function oN($, _X) {
  if (i($, "default")) return w0($.default)
  else return {}
}
function lN(_$, _X) {
  return {}
}
function tN($, X) {
  if ($.uniqueItems === !0 && !i($, "default"))
    throw new M2($, "Array with the uniqueItems constraint requires a default value")
  else if ("contains" in $ && !i($, "default"))
    throw new M2($, "Array with the contains constraint requires a default value")
  else if ("default" in $) return w0($.default)
  else if ($.minItems !== void 0)
    return Array.from({ length: $.minItems }).map((_Q) => {
      return t1($.items, X)
    })
  else return []
}
function sN($, _X) {
  if (i($, "default")) return w0($.default)
  else return (async function* () {})()
}
function rN($, _X) {
  if (i($, "default")) return w0($.default)
  else return BigInt(0)
}
function aN($, _X) {
  if (i($, "default")) return w0($.default)
  else return !1
}
function eN($, X) {
  if (i($, "default")) return w0($.default)
  else {
    const Q = t1($.returns, X)
    if (typeof Q === "object" && !Array.isArray(Q))
      return class {
        constructor() {
          for (const [J, Y] of Object.entries(Q)) {
            this[J] = Y
          }
        }
      }
    else return class {}
  }
}
function $w($, _X) {
  if (i($, "default")) return w0($.default)
  else if ($.minimumTimestamp !== void 0) return new Date($.minimumTimestamp)
  else return new Date()
}
function Xw($, X) {
  if (i($, "default")) return w0($.default)
  else return () => t1($.returns, X)
}
function Qw($, X) {
  const Q = globalThis.Object.values($.$defs),
    J = $.$defs[$.$ref]
  return t1(J, [...X, ...Q])
}
function Jw($, _X) {
  if (i($, "default")) return w0($.default)
  else if ($.minimum !== void 0) return $.minimum
  else return 0
}
function Yw($, X) {
  if (i($, "default")) return w0($.default)
  else {
    const Q = $.allOf.reduce((J, Y) => {
      const Z = t1(Y, X)
      return typeof Z === "object" ? { ...J, ...Z } : Z
    }, {})
    if (!r($, X, Q))
      throw new M2($, "Intersect produced invalid value. Consider using a default value.")
    return Q
  }
}
function Zw($, _X) {
  if (i($, "default")) return w0($.default)
  else return (function* () {})()
}
function Ww($, _X) {
  if (i($, "default")) return w0($.default)
  else return $.const
}
function qw($, _X) {
  if (i($, "default")) return w0($.default)
  else throw new M2($, "Never types cannot be created. Consider using a default value.")
}
function Mw($, _X) {
  if (i($, "default")) return w0($.default)
  else throw new M2($, "Not types must have a default value")
}
function Bw($, _X) {
  if (i($, "default")) return w0($.default)
  else return null
}
function Gw($, _X) {
  if (i($, "default")) return w0($.default)
  else if ($.minimum !== void 0) return $.minimum
  else return 0
}
function Nw($, X) {
  if (i($, "default")) return w0($.default)
  else {
    const Q = new Set($.required),
      J = {}
    for (const [Y, Z] of Object.entries($.properties)) {
      if (!Q.has(Y)) continue
      J[Y] = t1(Z, X)
    }
    return J
  }
}
function ww($, X) {
  if (i($, "default")) return w0($.default)
  else return Promise.resolve(t1($.item, X))
}
function Uw($, _X) {
  if (i($, "default")) return w0($.default)
  else return {}
}
function zw($, X) {
  if (i($, "default")) return w0($.default)
  else return t1(B0($, X), X)
}
function Hw($, _X) {
  if (i($, "default")) return w0($.default)
  else throw new M2($, "RegExp types cannot be created. Consider using a default value.")
}
function Aw($, _X) {
  if ($.pattern !== void 0)
    if (!i($, "default")) throw new M2($, "String types with patterns must specify a default value")
    else return w0($.default)
  else if ($.format !== void 0)
    if (!i($, "default")) throw new M2($, "String types with formats must specify a default value")
    else return w0($.default)
  else if (i($, "default")) return w0($.default)
  else if ($.minLength !== void 0)
    return Array.from({ length: $.minLength })
      .map(() => " ")
      .join("")
  else return ""
}
function Dw($, _X) {
  if (i($, "default")) return w0($.default)
  else if ("value" in $) return Symbol.for($.value)
  else return Symbol()
}
function Ow($, _X) {
  if (i($, "default")) return w0($.default)
  if (!NX($))
    throw new M2(
      $,
      "Can only create template literals that produce a finite variants. Consider using a default value."
    )
  return I8($)[0]
}
function Pw($, X) {
  if (nZ++ > Vw)
    throw new M2(
      $,
      "Cannot create recursive type as it appears possibly infinite. Consider using a default."
    )
  if (i($, "default")) return w0($.default)
  else return t1(B0($, X), X)
}
function Lw($, X) {
  if (i($, "default")) return w0($.default)
  if ($.items === void 0) return []
  else return Array.from({ length: $.minItems }).map((_Q, J) => t1($.items[J], X))
}
function Kw($, _X) {
  if (i($, "default")) return w0($.default)
  else return
}
function Sw($, X) {
  if (i($, "default")) return w0($.default)
  else if ($.anyOf.length === 0)
    throw Error("ValueCreate.Union: Cannot create Union with zero variants")
  else return t1($.anyOf[0], X)
}
function Cw($, _X) {
  if (i($, "default")) return w0($.default)
  else if ($.minByteLength !== void 0) return new Uint8Array($.minByteLength)
  else return new Uint8Array(0)
}
function jw($, _X) {
  if (i($, "default")) return w0($.default)
  else return {}
}
function Fw($, _X) {
  if (i($, "default")) return w0($.default)
  else return
}
function Rw($, _X) {
  if (i($, "default")) return w0($.default)
  else throw Error("User defined types must specify a default value")
}
function t1($, X) {
  const Q = N1($, X),
    J = $
  switch (J[L]) {
    case "Any":
      return oN(J, Q)
    case "Argument":
      return lN(J, Q)
    case "Array":
      return tN(J, Q)
    case "AsyncIterator":
      return sN(J, Q)
    case "BigInt":
      return rN(J, Q)
    case "Boolean":
      return aN(J, Q)
    case "Constructor":
      return eN(J, Q)
    case "Date":
      return $w(J, Q)
    case "Function":
      return Xw(J, Q)
    case "Import":
      return Qw(J, Q)
    case "Integer":
      return Jw(J, Q)
    case "Intersect":
      return Yw(J, Q)
    case "Iterator":
      return Zw(J, Q)
    case "Literal":
      return Ww(J, Q)
    case "Never":
      return qw(J, Q)
    case "Not":
      return Mw(J, Q)
    case "Null":
      return Bw(J, Q)
    case "Number":
      return Gw(J, Q)
    case "Object":
      return Nw(J, Q)
    case "Promise":
      return ww(J, Q)
    case "Record":
      return Uw(J, Q)
    case "Ref":
      return zw(J, Q)
    case "RegExp":
      return Hw(J, Q)
    case "String":
      return Aw(J, Q)
    case "Symbol":
      return Dw(J, Q)
    case "TemplateLiteral":
      return Ow(J, Q)
    case "This":
      return Pw(J, Q)
    case "Tuple":
      return Lw(J, Q)
    case "Undefined":
      return Kw(J, Q)
    case "Union":
      return Sw(J, Q)
    case "Uint8Array":
      return Cw(J, Q)
    case "Unknown":
      return jw(J, Q)
    case "Void":
      return Fw(J, Q)
    default:
      if (!W1.Has(J[L])) throw new M2(J, "Unknown type")
      return Rw(J, Q)
  }
}
var Vw = 512,
  nZ = 0
function S2(...$) {
  return (nZ = 0), $.length === 2 ? t1($[0], $[1]) : t1($[0], [])
}
class JJ extends p {
  constructor($, X) {
    super(X)
    this.schema = $
  }
}
function oZ($, X, Q) {
  if ($[L] === "Object" && typeof Q === "object" && !r2(Q)) {
    const J = $,
      Y = Object.getOwnPropertyNames(Q)
    return Object.entries(J.properties).reduce((W, [q, M]) => {
      const G = M[L] === "Literal" && M.const === Q[q] ? 100 : 0,
        B = r(M, X, Q[q]) ? 10 : 0,
        N = Y.includes(q) ? 1 : 0
      return W + (G + B + N)
    }, 0)
  } else if ($[L] === "Union") {
    const Y = $.anyOf.map((Z) => B0(Z, X)).map((Z) => oZ(Z, X, Q))
    return Math.max(...Y)
  } else return r($, X, Q) ? 1 : 0
}
function _w($, X, Q) {
  let J = $.anyOf.map((W) => B0(W, X)),
    [Y, Z] = [J[0], 0]
  for (const W of J) {
    const q = oZ(W, X, Q)
    if (q > Z) (Y = W), (Z = q)
  }
  return Y
}
function Ew($, X, Q) {
  if ("default" in $) return typeof Q === "function" ? $.default : N0($.default)
  else {
    const J = _w($, X, Q)
    return x6(J, X, Q)
  }
}
function xw($, X, Q) {
  return r($, X, Q) ? N0(Q) : S2($, X)
}
function Iw($, X, Q) {
  return r($, X, Q) ? Q : S2($, X)
}
function Tw($, X, Q) {
  if (r($, X, Q)) return N0(Q)
  const J = c(Q) ? N0(Q) : S2($, X),
    Y =
      u($.minItems) && J.length < $.minItems
        ? [...J, ...Array.from({ length: $.minItems - J.length }, () => null)]
        : J,
    W = (u($.maxItems) && Y.length > $.maxItems ? Y.slice(0, $.maxItems) : Y).map((M) =>
      C2($.items, X, M)
    )
  if ($.uniqueItems !== !0) return W
  const q = [...new Set(W)]
  if (!r($, X, q)) throw new JJ($, "Array cast produced invalid data due to uniqueItems constraint")
  return q
}
function bw($, X, Q) {
  if (r($, X, Q)) return S2($, X)
  const J = new Set($.returns.required || []),
    Y = () => {}
  for (const [Z, W] of Object.entries($.returns.properties)) {
    if (!J.has(Z) && Q.prototype[Z] === void 0) continue
    Y.prototype[Z] = C2(W, X, Q.prototype[Z])
  }
  return Y
}
function kw($, X, Q) {
  const J = globalThis.Object.values($.$defs),
    Y = $.$defs[$.$ref]
  return C2(Y, [...X, ...J], Q)
}
function lZ($, X) {
  if ((l($) && !l(X)) || (!l($) && l(X))) return $
  if (!l($) || !l(X)) return X
  return globalThis.Object.getOwnPropertyNames($).reduce((Q, J) => {
    const Y = J in X ? lZ($[J], X[J]) : $[J]
    return { ...Q, [J]: Y }
  }, {})
}
function gw($, X, Q) {
  if (r($, X, Q)) return Q
  const J = S2($, X),
    Y = lZ(J, Q)
  return r($, X, Y) ? Y : J
}
function fw($, _X, _Q) {
  throw new JJ($, "Never types cannot be cast")
}
function yw($, X, Q) {
  if (r($, X, Q)) return Q
  if (Q === null || typeof Q !== "object") return S2($, X)
  const J = new Set($.required || []),
    Y = {}
  for (const [Z, W] of Object.entries($.properties)) {
    if (!J.has(Z) && Q[Z] === void 0) continue
    Y[Z] = C2(W, X, Q[Z])
  }
  if (typeof $.additionalProperties === "object") {
    const Z = Object.getOwnPropertyNames($.properties)
    for (const W of Object.getOwnPropertyNames(Q)) {
      if (Z.includes(W)) continue
      Y[W] = C2($.additionalProperties, X, Q[W])
    }
  }
  return Y
}
function vw($, X, Q) {
  if (r($, X, Q)) return N0(Q)
  if (Q === null || typeof Q !== "object" || Array.isArray(Q) || Q instanceof Date) return S2($, X)
  const J = Object.getOwnPropertyNames($.patternProperties)[0],
    Y = $.patternProperties[J],
    Z = {}
  for (const [W, q] of Object.entries(Q)) Z[W] = C2(Y, X, q)
  return Z
}
function dw($, X, Q) {
  return C2(B0($, X), X, Q)
}
function hw($, X, Q) {
  return C2(B0($, X), X, Q)
}
function mw($, X, Q) {
  if (r($, X, Q)) return N0(Q)
  if (!c(Q)) return S2($, X)
  if ($.items === void 0) return []
  return $.items.map((J, Y) => C2(J, X, Q[Y]))
}
function uw($, X, Q) {
  return r($, X, Q) ? N0(Q) : Ew($, X, Q)
}
function C2($, X, Q) {
  const J = q0($.$id) ? N1($, X) : X,
    Y = $
  switch ($[L]) {
    case "Array":
      return Tw(Y, J, Q)
    case "Constructor":
      return bw(Y, J, Q)
    case "Import":
      return kw(Y, J, Q)
    case "Intersect":
      return gw(Y, J, Q)
    case "Never":
      return fw(Y, J, Q)
    case "Object":
      return yw(Y, J, Q)
    case "Record":
      return vw(Y, J, Q)
    case "Ref":
      return dw(Y, J, Q)
    case "This":
      return hw(Y, J, Q)
    case "Tuple":
      return mw(Y, J, Q)
    case "Union":
      return uw(Y, J, Q)
    case "Date":
    case "Symbol":
    case "Uint8Array":
      return xw($, X, Q)
    default:
      return Iw(Y, J, Q)
  }
}
function x6(...$) {
  return $.length === 3 ? C2($[0], $[1], $[2]) : C2($[0], [], $[1])
}
function cw($) {
  return _$($) && $[L] !== "Unsafe"
}
function pw($, X, Q) {
  if (!c(Q)) return Q
  return Q.map((J) => y1($.items, X, J))
}
function iw($, X, Q) {
  const J = globalThis.Object.values($.$defs),
    Y = $.$defs[$.$ref]
  return y1(Y, [...X, ...J], Q)
}
function nw($, X, Q) {
  const J = $.unevaluatedProperties,
    Z = $.allOf.map((q) => y1(q, X, N0(Q))).reduce((q, M) => (l(M) ? { ...q, ...M } : M), {})
  if (!l(Q) || !l(Z) || !_$(J)) return Z
  const W = g1($)
  for (const q of Object.getOwnPropertyNames(Q)) {
    if (W.includes(q)) continue
    if (r(J, X, Q[q])) Z[q] = y1(J, X, Q[q])
  }
  return Z
}
function ow($, X, Q) {
  if (!l(Q) || c(Q)) return Q
  const J = $.additionalProperties
  for (const Y of Object.getOwnPropertyNames(Q)) {
    if (i($.properties, Y)) {
      Q[Y] = y1($.properties[Y], X, Q[Y])
      continue
    }
    if (_$(J) && r(J, X, Q[Y])) {
      Q[Y] = y1(J, X, Q[Y])
      continue
    }
    delete Q[Y]
  }
  return Q
}
function lw($, X, Q) {
  if (!l(Q)) return Q
  const J = $.additionalProperties,
    Y = Object.getOwnPropertyNames(Q),
    [Z, W] = Object.entries($.patternProperties)[0],
    q = new RegExp(Z)
  for (const M of Y) {
    if (q.test(M)) {
      Q[M] = y1(W, X, Q[M])
      continue
    }
    if (_$(J) && r(J, X, Q[M])) {
      Q[M] = y1(J, X, Q[M])
      continue
    }
    delete Q[M]
  }
  return Q
}
function tw($, X, Q) {
  return y1(B0($, X), X, Q)
}
function sw($, X, Q) {
  return y1(B0($, X), X, Q)
}
function rw($, X, Q) {
  if (!c(Q)) return Q
  if (x0($.items)) return []
  const J = Math.min(Q.length, $.items.length)
  for (let Y = 0; Y < J; Y++) Q[Y] = y1($.items[Y], X, Q[Y])
  return Q.length > J ? Q.slice(0, J) : Q
}
function aw($, X, Q) {
  for (const J of $.anyOf) if (cw(J) && r(J, X, Q)) return y1(J, X, Q)
  return Q
}
function y1($, X, Q) {
  const J = q0($.$id) ? N1($, X) : X,
    Y = $
  switch (Y[L]) {
    case "Array":
      return pw(Y, J, Q)
    case "Import":
      return iw(Y, J, Q)
    case "Intersect":
      return nw(Y, J, Q)
    case "Object":
      return ow(Y, J, Q)
    case "Record":
      return lw(Y, J, Q)
    case "Ref":
      return tw(Y, J, Q)
    case "This":
      return sw(Y, J, Q)
    case "Tuple":
      return rw(Y, J, Q)
    case "Union":
      return aw(Y, J, Q)
    default:
      return Q
  }
}
function TX(...$) {
  return $.length === 3 ? y1($[0], $[1], $[2]) : y1($[0], [], $[1])
}
function bX($) {
  return q0($) && !Number.isNaN($) && !Number.isNaN(parseFloat($))
}
function ew($) {
  return z1($) || y2($) || u($)
}
function I6($) {
  return (
    $ === !0 ||
    (u($) && $ === 1) ||
    (z1($) && $ === BigInt("1")) ||
    (q0($) && ($.toLowerCase() === "true" || $ === "1"))
  )
}
function T6($) {
  return (
    $ === !1 ||
    (u($) && ($ === 0 || Object.is($, -0))) ||
    (z1($) && $ === BigInt("0")) ||
    (q0($) && ($.toLowerCase() === "false" || $ === "0" || $ === "-0"))
  )
}
function $U($) {
  return (
    q0($) && /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i.test($)
  )
}
function XU($) {
  return q0($) && /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)?$/i.test($)
}
function QU($) {
  return (
    q0($) &&
    /^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i.test(
      $
    )
  )
}
function JU($) {
  return q0($) && /^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)?$/i.test($)
}
function YU($) {
  return q0($) && /^\d\d\d\d-[0-1]\d-[0-3]\d$/i.test($)
}
function ZU($, X) {
  const Q = sZ($)
  return Q === X ? Q : $
}
function WU($, X) {
  const Q = rZ($)
  return Q === X ? Q : $
}
function qU($, X) {
  const Q = tZ($)
  return Q === X ? Q : $
}
function MU($, X) {
  return q0($.const)
    ? ZU(X, $.const)
    : u($.const)
      ? WU(X, $.const)
      : y2($.const)
        ? qU(X, $.const)
        : X
}
function tZ($) {
  return I6($) ? !0 : T6($) ? !1 : $
}
function BU($) {
  const X = (Q) => Q.split(".")[0]
  return bX($)
    ? BigInt(X($))
    : u($)
      ? BigInt(Math.trunc($))
      : T6($)
        ? BigInt(0)
        : I6($)
          ? BigInt(1)
          : $
}
function sZ($) {
  return a2($) && $.description !== void 0 ? $.description.toString() : ew($) ? $.toString() : $
}
function rZ($) {
  return bX($) ? parseFloat($) : I6($) ? 1 : T6($) ? 0 : $
}
function GU($) {
  return bX($) ? parseInt($, 10) : u($) ? Math.trunc($) : I6($) ? 1 : T6($) ? 0 : $
}
function NU($) {
  return q0($) && $.toLowerCase() === "null" ? null : $
}
function wU($) {
  return q0($) && $ === "undefined" ? void 0 : $
}
function UU($) {
  return V1($)
    ? $
    : u($)
      ? new Date($)
      : I6($)
        ? new Date(1)
        : T6($)
          ? new Date(0)
          : bX($)
            ? new Date(parseInt($, 10))
            : XU($)
              ? new Date(`1970-01-01T${$}.000Z`)
              : $U($)
                ? new Date(`1970-01-01T${$}`)
                : JU($)
                  ? new Date(`${$}.000Z`)
                  : QU($)
                    ? new Date($)
                    : YU($)
                      ? new Date(`${$}T00:00:00.000Z`)
                      : $
}
function zU($) {
  return $
}
function HU($, X, Q) {
  return (c(Q) ? Q : [Q]).map((Y) => j2($.items, X, Y))
}
function AU(_$, _X, Q) {
  return BU(Q)
}
function DU(_$, _X, Q) {
  return tZ(Q)
}
function OU(_$, _X, Q) {
  return UU(Q)
}
function PU($, X, Q) {
  const J = globalThis.Object.values($.$defs),
    Y = $.$defs[$.$ref]
  return j2(Y, [...X, ...J], Q)
}
function LU(_$, _X, Q) {
  return GU(Q)
}
function KU($, X, Q) {
  return $.allOf.reduce((J, Y) => j2(Y, X, J), Q)
}
function SU($, _X, Q) {
  return MU($, Q)
}
function CU(_$, _X, Q) {
  return NU(Q)
}
function jU(_$, _X, Q) {
  return rZ(Q)
}
function FU($, X, Q) {
  if (!l(Q) || c(Q)) return Q
  for (const J of Object.getOwnPropertyNames($.properties)) {
    if (!i(Q, J)) continue
    Q[J] = j2($.properties[J], X, Q[J])
  }
  return Q
}
function RU($, X, Q) {
  if (!(l(Q) && !c(Q))) return Q
  const Y = Object.getOwnPropertyNames($.patternProperties)[0],
    Z = $.patternProperties[Y]
  for (const [W, q] of Object.entries(Q)) Q[W] = j2(Z, X, q)
  return Q
}
function VU($, X, Q) {
  return j2(B0($, X), X, Q)
}
function _U(_$, _X, Q) {
  return sZ(Q)
}
function EU(_$, _X, Q) {
  return q0(Q) || u(Q) ? Symbol(Q) : Q
}
function xU($, X, Q) {
  return j2(B0($, X), X, Q)
}
function IU($, X, Q) {
  if (!(c(Q) && !x0($.items))) return Q
  return Q.map((Y, Z) => {
    return Z < $.items.length ? j2($.items[Z], X, Y) : Y
  })
}
function TU(_$, _X, Q) {
  return wU(Q)
}
function bU($, X, Q) {
  for (const J of $.anyOf) if (r(J, X, Q)) return Q
  for (const J of $.anyOf) {
    const Y = j2(J, X, N0(Q))
    if (!r(J, X, Y)) continue
    return Y
  }
  return Q
}
function j2($, X, Q) {
  const J = N1($, X),
    Y = $
  switch ($[L]) {
    case "Array":
      return HU(Y, J, Q)
    case "BigInt":
      return AU(Y, J, Q)
    case "Boolean":
      return DU(Y, J, Q)
    case "Date":
      return OU(Y, J, Q)
    case "Import":
      return PU(Y, J, Q)
    case "Integer":
      return LU(Y, J, Q)
    case "Intersect":
      return KU(Y, J, Q)
    case "Literal":
      return SU(Y, J, Q)
    case "Null":
      return CU(Y, J, Q)
    case "Number":
      return jU(Y, J, Q)
    case "Object":
      return FU(Y, J, Q)
    case "Record":
      return RU(Y, J, Q)
    case "Ref":
      return VU(Y, J, Q)
    case "String":
      return _U(Y, J, Q)
    case "Symbol":
      return EU(Y, J, Q)
    case "This":
      return xU(Y, J, Q)
    case "Tuple":
      return IU(Y, J, Q)
    case "Undefined":
      return TU(Y, J, Q)
    case "Union":
      return bU(Y, J, Q)
    default:
      return zU(Q)
  }
}
function kX(...$) {
  return $.length === 3 ? j2($[0], $[1], $[2]) : j2($[0], [], $[1])
}
class b6 extends p {
  constructor($, X, Q) {
    super("Unable to decode value as it does not match the expected schema")
    ;(this.schema = $), (this.value = X), (this.error = Q)
  }
}
class gX extends p {
  constructor($, X, Q, J) {
    super(J instanceof Error ? J.message : "Unknown error")
    ;(this.schema = $), (this.path = X), (this.value = Q), (this.error = J)
  }
}
function f0($, X, Q) {
  try {
    return U0($) ? $[C0].Decode(Q) : Q
  } catch (J) {
    throw new gX($, X, Q, J)
  }
}
function kU($, X, Q, J) {
  return c(J)
    ? f0(
        $,
        Q,
        J.map((Y, Z) => F2($.items, X, `${Q}/${Z}`, Y))
      )
    : f0($, Q, J)
}
function gU($, X, Q, J) {
  if (!l(J) || u1(J)) return f0($, Q, J)
  const Y = AX($),
    Z = Y.map((B) => B[0]),
    W = { ...J }
  for (const [B, N] of Y) if (B in W) W[B] = F2(N, X, `${Q}/${B}`, W[B])
  if (!U0($.unevaluatedProperties)) return f0($, Q, W)
  const q = Object.getOwnPropertyNames(W),
    M = $.unevaluatedProperties,
    G = { ...W }
  for (const B of q) if (!Z.includes(B)) G[B] = f0(M, `${Q}/${B}`, G[B])
  return f0($, Q, G)
}
function fU($, X, Q, J) {
  const Y = globalThis.Object.values($.$defs),
    Z = $.$defs[$.$ref],
    W = F2(Z, [...X, ...Y], Q, J)
  return f0($, Q, W)
}
function yU($, X, Q, J) {
  return f0($, Q, F2($.not, X, Q, J))
}
function vU($, X, Q, J) {
  if (!l(J)) return f0($, Q, J)
  const Y = g1($),
    Z = { ...J }
  for (const G of Y) {
    if (!i(Z, G)) continue
    if (x0(Z[G]) && (!X$($.properties[G]) || V0.IsExactOptionalProperty(Z, G))) continue
    Z[G] = F2($.properties[G], X, `${Q}/${G}`, Z[G])
  }
  if (!g0($.additionalProperties)) return f0($, Q, Z)
  const W = Object.getOwnPropertyNames(Z),
    q = $.additionalProperties,
    M = { ...Z }
  for (const G of W) if (!Y.includes(G)) M[G] = f0(q, `${Q}/${G}`, M[G])
  return f0($, Q, M)
}
function dU($, X, Q, J) {
  if (!l(J)) return f0($, Q, J)
  const Y = Object.getOwnPropertyNames($.patternProperties)[0],
    Z = new RegExp(Y),
    W = { ...J }
  for (const B of Object.getOwnPropertyNames(J))
    if (Z.test(B)) W[B] = F2($.patternProperties[Y], X, `${Q}/${B}`, W[B])
  if (!g0($.additionalProperties)) return f0($, Q, W)
  const q = Object.getOwnPropertyNames(W),
    M = $.additionalProperties,
    G = { ...W }
  for (const B of q) if (!Z.test(B)) G[B] = f0(M, `${Q}/${B}`, G[B])
  return f0($, Q, G)
}
function hU($, X, Q, J) {
  const Y = B0($, X)
  return f0($, Q, F2(Y, X, Q, J))
}
function mU($, X, Q, J) {
  const Y = B0($, X)
  return f0($, Q, F2(Y, X, Q, J))
}
function uU($, X, Q, J) {
  return c(J) && c($.items)
    ? f0(
        $,
        Q,
        $.items.map((Y, Z) => F2(Y, X, `${Q}/${Z}`, J[Z]))
      )
    : f0($, Q, J)
}
function cU($, X, Q, J) {
  for (const Y of $.anyOf) {
    if (!r(Y, X, J)) continue
    const Z = F2(Y, X, Q, J)
    return f0($, Q, Z)
  }
  return f0($, Q, J)
}
function F2($, X, Q, J) {
  const Y = N1($, X),
    Z = $
  switch ($[L]) {
    case "Array":
      return kU(Z, Y, Q, J)
    case "Import":
      return fU(Z, Y, Q, J)
    case "Intersect":
      return gU(Z, Y, Q, J)
    case "Not":
      return yU(Z, Y, Q, J)
    case "Object":
      return vU(Z, Y, Q, J)
    case "Record":
      return dU(Z, Y, Q, J)
    case "Ref":
      return hU(Z, Y, Q, J)
    case "Symbol":
      return f0(Z, Q, J)
    case "This":
      return mU(Z, Y, Q, J)
    case "Tuple":
      return uU(Z, Y, Q, J)
    case "Union":
      return cU(Z, Y, Q, J)
    default:
      return f0(Z, Q, J)
  }
}
function p8($, X, Q) {
  return F2($, X, "", Q)
}
class k6 extends p {
  constructor($, X, Q) {
    super("The encoded value does not match the expected schema")
    ;(this.schema = $), (this.value = X), (this.error = Q)
  }
}
class aZ extends p {
  constructor($, X, Q, J) {
    super(`${J instanceof Error ? J.message : "Unknown error"}`)
    ;(this.schema = $), (this.path = X), (this.value = Q), (this.error = J)
  }
}
function H1($, X, Q) {
  try {
    return U0($) ? $[C0].Encode(Q) : Q
  } catch (J) {
    throw new aZ($, X, Q, J)
  }
}
function pU($, X, Q, J) {
  const Y = H1($, Q, J)
  return c(Y) ? Y.map((Z, W) => R2($.items, X, `${Q}/${W}`, Z)) : Y
}
function iU($, X, Q, J) {
  const Y = globalThis.Object.values($.$defs),
    Z = $.$defs[$.$ref],
    W = H1($, Q, J)
  return R2(Z, [...X, ...Y], Q, W)
}
function nU($, X, Q, J) {
  const Y = H1($, Q, J)
  if (!l(J) || u1(J)) return Y
  const Z = AX($),
    W = Z.map((N) => N[0]),
    q = { ...Y }
  for (const [N, P] of Z) if (N in q) q[N] = R2(P, X, `${Q}/${N}`, q[N])
  if (!U0($.unevaluatedProperties)) return q
  const M = Object.getOwnPropertyNames(q),
    G = $.unevaluatedProperties,
    B = { ...q }
  for (const N of M) if (!W.includes(N)) B[N] = H1(G, `${Q}/${N}`, B[N])
  return B
}
function oU($, _X, Q, J) {
  return H1($.not, Q, H1($, Q, J))
}
function lU($, X, Q, J) {
  const Y = H1($, Q, J)
  if (!l(Y)) return Y
  const Z = g1($),
    W = { ...Y }
  for (const B of Z) {
    if (!i(W, B)) continue
    if (x0(W[B]) && (!X$($.properties[B]) || V0.IsExactOptionalProperty(W, B))) continue
    W[B] = R2($.properties[B], X, `${Q}/${B}`, W[B])
  }
  if (!g0($.additionalProperties)) return W
  const q = Object.getOwnPropertyNames(W),
    M = $.additionalProperties,
    G = { ...W }
  for (const B of q) if (!Z.includes(B)) G[B] = H1(M, `${Q}/${B}`, G[B])
  return G
}
function tU($, X, Q, J) {
  const Y = H1($, Q, J)
  if (!l(J)) return Y
  const Z = Object.getOwnPropertyNames($.patternProperties)[0],
    W = new RegExp(Z),
    q = { ...Y }
  for (const N of Object.getOwnPropertyNames(J))
    if (W.test(N)) q[N] = R2($.patternProperties[Z], X, `${Q}/${N}`, q[N])
  if (!g0($.additionalProperties)) return q
  const M = Object.getOwnPropertyNames(q),
    G = $.additionalProperties,
    B = { ...q }
  for (const N of M) if (!W.test(N)) B[N] = H1(G, `${Q}/${N}`, B[N])
  return B
}
function sU($, X, Q, J) {
  const Y = B0($, X),
    Z = R2(Y, X, Q, J)
  return H1($, Q, Z)
}
function rU($, X, Q, J) {
  const Y = B0($, X),
    Z = R2(Y, X, Q, J)
  return H1($, Q, Z)
}
function aU($, X, Q, J) {
  const Y = H1($, Q, J)
  return c($.items) ? $.items.map((Z, W) => R2(Z, X, `${Q}/${W}`, Y[W])) : []
}
function eU($, X, Q, J) {
  for (const Y of $.anyOf) {
    if (!r(Y, X, J)) continue
    const Z = R2(Y, X, Q, J)
    return H1($, Q, Z)
  }
  for (const Y of $.anyOf) {
    const Z = R2(Y, X, Q, J)
    if (!r($, X, Z)) continue
    return H1($, Q, Z)
  }
  return H1($, Q, J)
}
function R2($, X, Q, J) {
  const Y = N1($, X),
    Z = $
  switch ($[L]) {
    case "Array":
      return pU(Z, Y, Q, J)
    case "Import":
      return iU(Z, Y, Q, J)
    case "Intersect":
      return nU(Z, Y, Q, J)
    case "Not":
      return oU(Z, Y, Q, J)
    case "Object":
      return lU(Z, Y, Q, J)
    case "Record":
      return tU(Z, Y, Q, J)
    case "Ref":
      return sU(Z, Y, Q, J)
    case "This":
      return rU(Z, Y, Q, J)
    case "Tuple":
      return aU(Z, Y, Q, J)
    case "Union":
      return eU(Z, Y, Q, J)
    default:
      return H1(Z, Q, J)
  }
}
function i8($, X, Q) {
  return R2($, X, "", Q)
}
function $z($, X) {
  return U0($) || q1($.items, X)
}
function Xz($, X) {
  return U0($) || q1($.items, X)
}
function Qz($, X) {
  return U0($) || q1($.returns, X) || $.parameters.some((Q) => q1(Q, X))
}
function Jz($, X) {
  return U0($) || q1($.returns, X) || $.parameters.some((Q) => q1(Q, X))
}
function Yz($, X) {
  return U0($) || U0($.unevaluatedProperties) || $.allOf.some((Q) => q1(Q, X))
}
function Zz($, X) {
  const Q = globalThis.Object.getOwnPropertyNames($.$defs).reduce((Y, Z) => [...Y, $.$defs[Z]], []),
    J = $.$defs[$.$ref]
  return U0($) || q1(J, [...Q, ...X])
}
function Wz($, X) {
  return U0($) || q1($.items, X)
}
function qz($, X) {
  return U0($) || q1($.not, X)
}
function Mz($, X) {
  return (
    U0($) ||
    Object.values($.properties).some((Q) => q1(Q, X)) ||
    (g0($.additionalProperties) && q1($.additionalProperties, X))
  )
}
function Bz($, X) {
  return U0($) || q1($.item, X)
}
function Gz($, X) {
  const Q = Object.getOwnPropertyNames($.patternProperties)[0],
    J = $.patternProperties[Q]
  return U0($) || q1(J, X) || (g0($.additionalProperties) && U0($.additionalProperties))
}
function Nz($, X) {
  if (U0($)) return !0
  return q1(B0($, X), X)
}
function wz($, X) {
  if (U0($)) return !0
  return q1(B0($, X), X)
}
function Uz($, X) {
  return U0($) || (!x0($.items) && $.items.some((Q) => q1(Q, X)))
}
function zz($, X) {
  return U0($) || $.anyOf.some((Q) => q1(Q, X))
}
function q1($, X) {
  const Q = N1($, X),
    J = $
  if ($.$id && YJ.has($.$id)) return !1
  if ($.$id) YJ.add($.$id)
  switch ($[L]) {
    case "Array":
      return $z(J, Q)
    case "AsyncIterator":
      return Xz(J, Q)
    case "Constructor":
      return Qz(J, Q)
    case "Function":
      return Jz(J, Q)
    case "Import":
      return Zz(J, Q)
    case "Intersect":
      return Yz(J, Q)
    case "Iterator":
      return Wz(J, Q)
    case "Not":
      return qz(J, Q)
    case "Object":
      return Mz(J, Q)
    case "Promise":
      return Bz(J, Q)
    case "Record":
      return Gz(J, Q)
    case "Ref":
      return Nz(J, Q)
    case "This":
      return wz(J, Q)
    case "Tuple":
      return Uz(J, Q)
    case "Union":
      return zz(J, Q)
    default:
      return U0($)
  }
}
var YJ = new Set()
function q$($, X) {
  return YJ.clear(), q1($, X)
}
function eZ(...$) {
  const [X, Q, J] = $.length === 3 ? [$[0], $[1], $[2]] : [$[0], [], $[1]]
  if (!r(X, Q, J)) throw new b6(X, J, h2(X, Q, J).First())
  return q$(X, Q) ? p8(X, Q, J) : J
}
function M$($, X) {
  const Q = i($, "default") ? $.default : void 0,
    J = R$(Q) ? Q() : N0(Q)
  return x0(X) ? J : l(X) && l(J) ? Object.assign(J, X) : X
}
function ZJ($) {
  return _$($) && "default" in $
}
function Hz($, X, Q) {
  if (c(Q)) {
    for (let Y = 0; Y < Q.length; Y++) Q[Y] = E1($.items, X, Q[Y])
    return Q
  }
  const J = M$($, Q)
  if (!c(J)) return J
  for (let Y = 0; Y < J.length; Y++) J[Y] = E1($.items, X, J[Y])
  return J
}
function Az($, _X, Q) {
  return V1(Q) ? Q : M$($, Q)
}
function Dz($, X, Q) {
  const J = globalThis.Object.values($.$defs),
    Y = $.$defs[$.$ref]
  return E1(Y, [...X, ...J], Q)
}
function Oz($, X, Q) {
  const J = M$($, Q)
  return $.allOf.reduce((Y, Z) => {
    const W = E1(Z, X, J)
    return l(W) ? { ...Y, ...W } : W
  }, {})
}
function Pz($, X, Q) {
  const J = M$($, Q)
  if (!l(J)) return J
  const Y = Object.getOwnPropertyNames($.properties)
  for (const Z of Y) {
    const W = E1($.properties[Z], X, J[Z])
    if (x0(W)) continue
    J[Z] = E1($.properties[Z], X, J[Z])
  }
  if (!ZJ($.additionalProperties)) return J
  for (const Z of Object.getOwnPropertyNames(J)) {
    if (Y.includes(Z)) continue
    J[Z] = E1($.additionalProperties, X, J[Z])
  }
  return J
}
function Lz($, X, Q) {
  const J = M$($, Q)
  if (!l(J)) return J
  const Y = $.additionalProperties,
    [Z, W] = Object.entries($.patternProperties)[0],
    q = new RegExp(Z)
  for (const M of Object.getOwnPropertyNames(J)) {
    if (!(q.test(M) && ZJ(W))) continue
    J[M] = E1(W, X, J[M])
  }
  if (!ZJ(Y)) return J
  for (const M of Object.getOwnPropertyNames(J)) {
    if (q.test(M)) continue
    J[M] = E1(Y, X, J[M])
  }
  return J
}
function Kz($, X, Q) {
  return E1(B0($, X), X, M$($, Q))
}
function Sz($, X, Q) {
  return E1(B0($, X), X, Q)
}
function Cz($, X, Q) {
  const J = M$($, Q)
  if (!c(J) || x0($.items)) return J
  const [Y, Z] = [$.items, Math.max($.items.length, J.length)]
  for (let W = 0; W < Z; W++) if (W < Y.length) J[W] = E1(Y[W], X, J[W])
  return J
}
function jz($, X, Q) {
  const J = M$($, Q)
  for (const Y of $.anyOf) {
    const Z = E1(Y, X, N0(J))
    if (r(Y, X, Z)) return Z
  }
  return J
}
function E1($, X, Q) {
  const J = N1($, X),
    Y = $
  switch (Y[L]) {
    case "Array":
      return Hz(Y, J, Q)
    case "Date":
      return Az(Y, J, Q)
    case "Import":
      return Dz(Y, J, Q)
    case "Intersect":
      return Oz(Y, J, Q)
    case "Object":
      return Pz(Y, J, Q)
    case "Record":
      return Lz(Y, J, Q)
    case "Ref":
      return Kz(Y, J, Q)
    case "This":
      return Sz(Y, J, Q)
    case "Tuple":
      return Cz(Y, J, Q)
    case "Union":
      return jz(Y, J, Q)
    default:
      return M$(Y, Q)
  }
}
function fX(...$) {
  return $.length === 3 ? E1($[0], $[1], $[2]) : E1($[0], [], $[1])
}
var V2 = {}
F$(V2, {
  ValuePointerRootSetError: () => WJ,
  ValuePointerRootDeleteError: () => qJ,
  Set: () => Fz,
  Has: () => Vz,
  Get: () => _z,
  Format: () => g6,
  Delete: () => Rz,
})
class WJ extends p {
  constructor($, X, Q) {
    super("Cannot set root value")
    ;(this.value = $), (this.path = X), (this.update = Q)
  }
}
class qJ extends p {
  constructor($, X) {
    super("Cannot delete root value")
    ;(this.value = $), (this.path = X)
  }
}
function $W($) {
  return $.indexOf("~") === -1 ? $ : $.replace(/~1/g, "/").replace(/~0/g, "~")
}
function* g6($) {
  if ($ === "") return
  let [X, Q] = [0, 0]
  for (let J = 0; J < $.length; J++)
    if ($.charAt(J) === "/")
      if (J === 0) X = J + 1
      else (Q = J), yield $W($.slice(X, Q)), (X = J + 1)
    else Q = J
  yield $W($.slice(X))
}
function Fz($, X, Q) {
  if (X === "") throw new WJ($, X, Q)
  let [J, Y, Z] = [null, $, ""]
  for (const W of g6(X)) {
    if (Y[W] === void 0) Y[W] = {}
    ;(J = Y), (Y = Y[W]), (Z = W)
  }
  J[Z] = Q
}
function Rz($, X) {
  if (X === "") throw new qJ($, X)
  let [Q, J, Y] = [null, $, ""]
  for (const Z of g6(X)) {
    if (J[Z] === void 0 || J[Z] === null) return
    ;(Q = J), (J = J[Z]), (Y = Z)
  }
  if (Array.isArray(Q)) {
    const Z = parseInt(Y, 10)
    Q.splice(Z, 1)
  } else delete Q[Y]
}
function Vz($, X) {
  if (X === "") return !0
  let [Q, J, Y] = [null, $, ""]
  for (const Z of g6(X)) {
    if (J[Z] === void 0) return !1
    ;(Q = J), (J = J[Z]), (Y = Z)
  }
  return Object.getOwnPropertyNames(Q).includes(Y)
}
function _z($, X) {
  if (X === "") return $
  let Q = $
  for (const J of g6(X)) {
    if (Q[J] === void 0) return
    Q = Q[J]
  }
  return Q
}
function Ez($, X) {
  if (!l(X)) return !1
  const Q = [...Object.keys($), ...Object.getOwnPropertySymbols($)],
    J = [...Object.keys(X), ...Object.getOwnPropertySymbols(X)]
  if (Q.length !== J.length) return !1
  return Q.every((Y) => X8($[Y], X[Y]))
}
function xz($, X) {
  return V1(X) && $.getTime() === X.getTime()
}
function Iz($, X) {
  if (!c(X) || $.length !== X.length) return !1
  return $.every((Q, J) => X8(Q, X[J]))
}
function Tz($, X) {
  if (
    !$2(X) ||
    $.length !== X.length ||
    Object.getPrototypeOf($).constructor.name !== Object.getPrototypeOf(X).constructor.name
  )
    return !1
  return $.every((Q, J) => X8(Q, X[J]))
}
function bz($, X) {
  return $ === X
}
function X8($, X) {
  if (V1($)) return xz($, X)
  if ($2($)) return Tz($, X)
  if (c($)) return Iz($, X)
  if (l($)) return Ez($, X)
  if (u1($)) return bz($, X)
  throw Error("ValueEquals: Unable to compare value")
}
var kz = H0({ type: W0("insert"), path: _1(), value: O2() }),
  gz = H0({ type: W0("update"), path: _1(), value: O2() }),
  fz = H0({ type: W0("delete"), path: _1() }),
  QW = z0([kz, gz, fz])
class MJ extends p {
  constructor($, X) {
    super(X)
    this.value = $
  }
}
function yX($, X) {
  return { type: "update", path: $, value: X }
}
function JW($, X) {
  return { type: "insert", path: $, value: X }
}
function YW($) {
  return { type: "delete", path: $ }
}
function XW($) {
  if (globalThis.Object.getOwnPropertySymbols($).length > 0)
    throw new MJ($, "Cannot diff objects with symbols")
}
function* yz($, X, Q) {
  if ((XW(X), XW(Q), !TQ(Q))) return yield yX($, Q)
  const J = globalThis.Object.getOwnPropertyNames(X),
    Y = globalThis.Object.getOwnPropertyNames(Q)
  for (const Z of Y) {
    if (i(X, Z)) continue
    yield JW(`${$}/${Z}`, Q[Z])
  }
  for (const Z of J) {
    if (!i(Q, Z)) continue
    if (X8(X, Q)) continue
    yield* vX(`${$}/${Z}`, X[Z], Q[Z])
  }
  for (const Z of J) {
    if (i(Q, Z)) continue
    yield YW(`${$}/${Z}`)
  }
}
function* vz($, X, Q) {
  if (!c(Q)) return yield yX($, Q)
  for (let J = 0; J < Math.min(X.length, Q.length); J++) yield* vX(`${$}/${J}`, X[J], Q[J])
  for (let J = 0; J < Q.length; J++) {
    if (J < X.length) continue
    yield JW(`${$}/${J}`, Q[J])
  }
  for (let J = X.length - 1; J >= 0; J--) {
    if (J < Q.length) continue
    yield YW(`${$}/${J}`)
  }
}
function* dz($, X, Q) {
  if (
    !$2(Q) ||
    X.length !== Q.length ||
    globalThis.Object.getPrototypeOf(X).constructor.name !==
      globalThis.Object.getPrototypeOf(Q).constructor.name
  )
    return yield yX($, Q)
  for (let J = 0; J < Math.min(X.length, Q.length); J++) yield* vX(`${$}/${J}`, X[J], Q[J])
}
function* hz($, X, Q) {
  if (X === Q) return
  yield yX($, Q)
}
function* vX($, X, Q) {
  if (TQ(X)) return yield* yz($, X, Q)
  if (c(X)) return yield* vz($, X, Q)
  if ($2(X)) return yield* dz($, X, Q)
  if (u1(X)) return yield* hz($, X, Q)
  throw new MJ(X, "Unable to diff value")
}
function ZW($, X) {
  return [...vX("", $, X)]
}
function mz($) {
  return $.length > 0 && $[0].path === "" && $[0].type === "update"
}
function uz($) {
  return $.length === 0
}
function WW($, X) {
  if (mz(X)) return N0(X[0].value)
  if (uz(X)) return N0($)
  const Q = N0($)
  for (const J of X)
    switch (J.type) {
      case "insert": {
        V2.Set(Q, J.path, J.value)
        break
      }
      case "update": {
        V2.Set(Q, J.path, J.value)
        break
      }
      case "delete": {
        V2.Delete(Q, J.path)
        break
      }
    }
  return Q
}
function qW(...$) {
  const [X, Q, J] = $.length === 3 ? [$[0], $[1], $[2]] : [$[0], [], $[1]],
    Y = q$(X, Q) ? i8(X, Q, J) : J
  if (!r(X, Q, Y)) throw new k6(X, Y, h2(X, Q, Y).First())
  return Y
}
function dX($) {
  return l($) && !c($)
}
class BJ extends p {}
function cz($, X, Q, J) {
  if (!dX(Q)) V2.Set($, X, N0(J))
  else {
    const Y = Object.getOwnPropertyNames(Q),
      Z = Object.getOwnPropertyNames(J)
    for (const W of Y) if (!Z.includes(W)) delete Q[W]
    for (const W of Z) if (!Y.includes(W)) Q[W] = null
    for (const W of Z) GJ($, `${X}/${W}`, Q[W], J[W])
  }
}
function pz($, X, Q, J) {
  if (!c(Q)) V2.Set($, X, N0(J))
  else {
    for (let Y = 0; Y < J.length; Y++) GJ($, `${X}/${Y}`, Q[Y], J[Y])
    Q.splice(J.length)
  }
}
function iz($, X, Q, J) {
  if ($2(Q) && Q.length === J.length) for (let Y = 0; Y < Q.length; Y++) Q[Y] = J[Y]
  else V2.Set($, X, N0(J))
}
function nz($, X, Q, J) {
  if (Q === J) return
  V2.Set($, X, J)
}
function GJ($, X, Q, J) {
  if (c(J)) return pz($, X, Q, J)
  if ($2(J)) return iz($, X, Q, J)
  if (dX(J)) return cz($, X, Q, J)
  if (u1(J)) return nz($, X, Q, J)
}
function MW($) {
  return $2($) || u1($)
}
function oz($, X) {
  return (dX($) && c(X)) || (c($) && dX(X))
}
function BW($, X) {
  if (MW($) || MW(X)) throw new BJ("Only object and array types can be mutated at the root level")
  if (oz($, X)) throw new BJ("Cannot assign due type mismatch of assignable values")
  GJ($, "", $, X)
}
class wJ extends p {}
var NJ
;(($) => {
  const X = new Map([
    [
      "Assert",
      (Z, W, q) => {
        return IX(Z, W, q), q
      },
    ],
    ["Cast", (Z, W, q) => x6(Z, W, q)],
    ["Clean", (Z, W, q) => TX(Z, W, q)],
    ["Clone", (_Z, _W, q) => N0(q)],
    ["Convert", (Z, W, q) => kX(Z, W, q)],
    ["Decode", (Z, W, q) => (q$(Z, W) ? p8(Z, W, q) : q)],
    ["Default", (Z, W, q) => fX(Z, W, q)],
    ["Encode", (Z, W, q) => (q$(Z, W) ? i8(Z, W, q) : q)],
  ])
  function Q(Z) {
    X.delete(Z)
  }
  $.Delete = Q
  function J(Z, W) {
    X.set(Z, W)
  }
  $.Set = J
  function Y(Z) {
    return X.get(Z)
  }
  $.Get = Y
})(NJ || (NJ = {}))
var GW = ["Clone", "Clean", "Default", "Convert", "Assert", "Decode"]
function lz($, X, Q, J) {
  return $.reduce((Y, Z) => {
    const W = NJ.Get(Z)
    if (x0(W)) throw new wJ(`Unable to find Parse operation '${Z}'`)
    return W(X, Q, Y)
  }, J)
}
function NW(...$) {
  const [X, Q, J, Y] =
    $.length === 4
      ? [$[0], $[1], $[2], $[3]]
      : $.length === 3
        ? c($[0])
          ? [$[0], $[1], [], $[2]]
          : [GW, $[0], $[1], $[2]]
        : $.length === 2
          ? [GW, $[0], [], $[1]]
          : (() => {
              throw new wJ("Invalid Arguments")
            })()
  return lz(X, Q, J, Y)
}
var S0 = {}
F$(S0, {
  ValueErrorIterator: () => $8,
  Patch: () => WW,
  Parse: () => NW,
  Mutate: () => BW,
  Hash: () => f$,
  Errors: () => h2,
  Equal: () => X8,
  Encode: () => qW,
  Edit: () => QW,
  Diff: () => ZW,
  Default: () => fX,
  Decode: () => eZ,
  Create: () => S2,
  Convert: () => kX,
  Clone: () => N0,
  Clean: () => TX,
  Check: () => r,
  Cast: () => x6,
  Assert: () => IX,
})
class wW {
  constructor($, X, Q, J) {
    ;(this.schema = $),
      (this.references = X),
      (this.checkFunc = Q),
      (this.code = J),
      (this.hasTransform = q$($, X))
  }
  Code() {
    return this.code
  }
  Schema() {
    return this.schema
  }
  References() {
    return this.references
  }
  Errors($) {
    return h2(this.schema, this.references, $)
  }
  Check($) {
    return this.checkFunc($)
  }
  Decode($) {
    if (!this.checkFunc($)) throw new b6(this.schema, $, this.Errors($).First())
    return this.hasTransform ? p8(this.schema, this.references, $) : $
  }
  Encode($) {
    const X = this.hasTransform ? i8(this.schema, this.references, $) : $
    if (!this.checkFunc(X)) throw new k6(this.schema, $, this.Errors($).First())
    return X
  }
}
var B$
;(($) => {
  function X(Z) {
    return Z === 36
  }
  $.DollarSign = X
  function Q(Z) {
    return Z === 95
  }
  $.IsUnderscore = Q
  function J(Z) {
    return (Z >= 65 && Z <= 90) || (Z >= 97 && Z <= 122)
  }
  $.IsAlpha = J
  function Y(Z) {
    return Z >= 48 && Z <= 57
  }
  $.IsNumeric = Y
})(B$ || (B$ = {}))
var hX
;(($) => {
  function X(Z) {
    if (Z.length === 0) return !1
    return B$.IsNumeric(Z.charCodeAt(0))
  }
  function Q(Z) {
    if (X(Z)) return !1
    for (let W = 0; W < Z.length; W++) {
      const q = Z.charCodeAt(W)
      if (!(B$.IsAlpha(q) || B$.IsNumeric(q) || B$.DollarSign(q) || B$.IsUnderscore(q))) return !1
    }
    return !0
  }
  function J(Z) {
    return Z.replace(/'/g, "\\'")
  }
  function Y(Z, W) {
    return Q(W) ? `${Z}.${W}` : `${Z}['${J(W)}']`
  }
  $.Encode = Y
})(hX || (hX = {}))
var UJ
;(($) => {
  function X(Q) {
    const J = []
    for (let Y = 0; Y < Q.length; Y++) {
      const Z = Q.charCodeAt(Y)
      if (B$.IsNumeric(Z) || B$.IsAlpha(Z)) J.push(Q.charAt(Y))
      else J.push(`_${Z}_`)
    }
    return J.join("").replace(/__/g, "_")
  }
  $.Encode = X
})(UJ || (UJ = {}))
var zJ
;(($) => {
  function X(Q) {
    return Q.replace(/'/g, "\\'")
  }
  $.Escape = X
})(zJ || (zJ = {}))
class UW extends p {
  constructor($) {
    super("Unknown type")
    this.schema = $
  }
}
class HJ extends p {
  constructor($) {
    super("Preflight validation check failed to guard for the given schema")
    this.schema = $
  }
}
var Q8
;(($) => {
  function X(W, q, M) {
    return V0.ExactOptionalPropertyTypes
      ? `('${q}' in ${W} ? ${M} : true)`
      : `(${hX.Encode(W, q)} !== undefined ? ${M} : true)`
  }
  $.IsExactOptionalProperty = X
  function Q(W) {
    return !V0.AllowArrayObject
      ? `(typeof ${W} === 'object' && ${W} !== null && !Array.isArray(${W}))`
      : `(typeof ${W} === 'object' && ${W} !== null)`
  }
  $.IsObjectLike = Q
  function J(W) {
    return !V0.AllowArrayObject
      ? `(typeof ${W} === 'object' && ${W} !== null && !Array.isArray(${W}) && !(${W} instanceof Date) && !(${W} instanceof Uint8Array))`
      : `(typeof ${W} === 'object' && ${W} !== null && !(${W} instanceof Date) && !(${W} instanceof Uint8Array))`
  }
  $.IsRecordLike = J
  function Y(W) {
    return V0.AllowNaN ? `typeof ${W} === 'number'` : `Number.isFinite(${W})`
  }
  $.IsNumberLike = Y
  function Z(W) {
    return V0.AllowNullVoid ? `(${W} === undefined || ${W} === null)` : `${W} === undefined`
  }
  $.IsVoidLike = Z
})(Q8 || (Q8 = {}))
var _2
;(($) => {
  function X(U) {
    return U[L] === "Any" || U[L] === "Unknown"
  }
  function* Q(_U, _D, _z) {
    yield "true"
  }
  function* J(_U, _D, _z) {
    yield "true"
  }
  function* Y(U, D, z) {
    yield `Array.isArray(${z})`
    const [x, E] = [R1("value", "any"), R1("acc", "number")]
    if (u(U.maxItems)) yield `${z}.length <= ${U.maxItems}`
    if (u(U.minItems)) yield `${z}.length >= ${U.minItems}`
    const g = $1(U.items, D, "value")
    if (
      (yield `${z}.every((${x}) => ${g})`, T0(U.contains) || u(U.minContains) || u(U.maxContains))
    ) {
      const t = T0(U.contains) ? U.contains : s(),
        D0 = $1(t, D, "value"),
        i0 = u(U.minContains) ? [`(count >= ${U.minContains})`] : [],
        G1 = u(U.maxContains) ? [`(count <= ${U.maxContains})`] : [],
        P1 = `const count = value.reduce((${E}, ${x}) => ${D0} ? acc + 1 : acc, 0)`,
        p$ = ["(count > 0)", ...i0, ...G1].join(" && ")
      yield `((${x}) => { ${P1}; return ${p$}})(${z})`
    }
    if (U.uniqueItems === !0)
      yield `((${x}) => { const set = new Set(); for(const element of value) { const hashed = hash(element); if(set.has(hashed)) { return false } else { set.add(hashed) } } return true } )(${z})`
  }
  function* Z(_U, _D, z) {
    yield `(typeof value === 'object' && Symbol.asyncIterator in ${z})`
  }
  function* W(U, _D, z) {
    if ((yield `(typeof ${z} === 'bigint')`, z1(U.exclusiveMaximum)))
      yield `${z} < BigInt(${U.exclusiveMaximum})`
    if (z1(U.exclusiveMinimum)) yield `${z} > BigInt(${U.exclusiveMinimum})`
    if (z1(U.maximum)) yield `${z} <= BigInt(${U.maximum})`
    if (z1(U.minimum)) yield `${z} >= BigInt(${U.minimum})`
    if (z1(U.multipleOf)) yield `(${z} % BigInt(${U.multipleOf})) === 0`
  }
  function* q(_U, _D, z) {
    yield `(typeof ${z} === 'boolean')`
  }
  function* M(U, D, z) {
    yield* G2(U.returns, D, `${z}.prototype`)
  }
  function* G(U, _D, z) {
    if (
      (yield `(${z} instanceof Date) && Number.isFinite(${z}.getTime())`,
      u(U.exclusiveMaximumTimestamp))
    )
      yield `${z}.getTime() < ${U.exclusiveMaximumTimestamp}`
    if (u(U.exclusiveMinimumTimestamp)) yield `${z}.getTime() > ${U.exclusiveMinimumTimestamp}`
    if (u(U.maximumTimestamp)) yield `${z}.getTime() <= ${U.maximumTimestamp}`
    if (u(U.minimumTimestamp)) yield `${z}.getTime() >= ${U.minimumTimestamp}`
    if (u(U.multipleOfTimestamp)) yield `(${z}.getTime() % ${U.multipleOfTimestamp}) === 0`
  }
  function* B(_U, _D, z) {
    yield `(typeof ${z} === 'function')`
  }
  function* N(U, D, z) {
    const x = globalThis.Object.getOwnPropertyNames(U.$defs).reduce((E, g) => {
      return [...E, U.$defs[g]]
    }, [])
    yield* G2(Z2(U.$ref), [...D, ...x], z)
  }
  function* P(U, _D, z) {
    if ((yield `Number.isInteger(${z})`, u(U.exclusiveMaximum)))
      yield `${z} < ${U.exclusiveMaximum}`
    if (u(U.exclusiveMinimum)) yield `${z} > ${U.exclusiveMinimum}`
    if (u(U.maximum)) yield `${z} <= ${U.maximum}`
    if (u(U.minimum)) yield `${z} >= ${U.minimum}`
    if (u(U.multipleOf)) yield `(${z} % ${U.multipleOf}) === 0`
  }
  function* w(U, D, z) {
    const x = U.allOf.map((E) => $1(E, D, z)).join(" && ")
    if (U.unevaluatedProperties === !1) {
      const E = F1(`${new RegExp(Y$(U))};`),
        g = `Object.getOwnPropertyNames(${z}).every(key => ${E}.test(key))`
      yield `(${x} && ${g})`
    } else if (T0(U.unevaluatedProperties)) {
      const E = F1(`${new RegExp(Y$(U))};`),
        g = `Object.getOwnPropertyNames(${z}).every(key => ${E}.test(key) || ${$1(U.unevaluatedProperties, D, `${z}[key]`)})`
      yield `(${x} && ${g})`
    } else yield `(${x})`
  }
  function* H(_U, _D, z) {
    yield `(typeof value === 'object' && Symbol.iterator in ${z})`
  }
  function* A(U, _D, z) {
    if (typeof U.const === "number" || typeof U.const === "boolean") yield `(${z} === ${U.const})`
    else yield `(${z} === '${zJ.Escape(U.const)}')`
  }
  function* S(_U, _D, _z) {
    yield "false"
  }
  function* j(U, D, z) {
    yield `(!${$1(U.not, D, z)})`
  }
  function* K(_U, _D, z) {
    yield `(${z} === null)`
  }
  function* y(U, _D, z) {
    if ((yield Q8.IsNumberLike(z), u(U.exclusiveMaximum))) yield `${z} < ${U.exclusiveMaximum}`
    if (u(U.exclusiveMinimum)) yield `${z} > ${U.exclusiveMinimum}`
    if (u(U.maximum)) yield `${z} <= ${U.maximum}`
    if (u(U.minimum)) yield `${z} >= ${U.minimum}`
    if (u(U.multipleOf)) yield `(${z} % ${U.multipleOf}) === 0`
  }
  function* o(U, D, z) {
    if ((yield Q8.IsObjectLike(z), u(U.minProperties)))
      yield `Object.getOwnPropertyNames(${z}).length >= ${U.minProperties}`
    if (u(U.maxProperties)) yield `Object.getOwnPropertyNames(${z}).length <= ${U.maxProperties}`
    const x = Object.getOwnPropertyNames(U.properties)
    for (const E of x) {
      const g = hX.Encode(z, E),
        t = U.properties[E]
      if (U.required?.includes(E)) {
        if ((yield* G2(t, D, g), Z$(t) || X(t))) yield `('${E}' in ${z})`
      } else {
        const D0 = $1(t, D, g)
        yield Q8.IsExactOptionalProperty(z, E, D0)
      }
    }
    if (U.additionalProperties === !1)
      if (U.required && U.required.length === x.length)
        yield `Object.getOwnPropertyNames(${z}).length === ${x.length}`
      else {
        const E = `[${x.map((g) => `'${g}'`).join(", ")}]`
        yield `Object.getOwnPropertyNames(${z}).every(key => ${E}.includes(key))`
      }
    if (typeof U.additionalProperties === "object") {
      const E = $1(U.additionalProperties, D, `${z}[key]`),
        g = `[${x.map((t) => `'${t}'`).join(", ")}]`
      yield `(Object.getOwnPropertyNames(${z}).every(key => ${g}.includes(key) || ${E}))`
    }
  }
  function* n(_U, _D, z) {
    yield `${z} instanceof Promise`
  }
  function* f(U, D, z) {
    if ((yield Q8.IsRecordLike(z), u(U.minProperties)))
      yield `Object.getOwnPropertyNames(${z}).length >= ${U.minProperties}`
    if (u(U.maxProperties)) yield `Object.getOwnPropertyNames(${z}).length <= ${U.maxProperties}`
    const [x, E] = Object.entries(U.patternProperties)[0],
      g = F1(`${new RegExp(x)}`),
      t = $1(E, D, "value"),
      D0 = T0(U.additionalProperties)
        ? $1(U.additionalProperties, D, z)
        : U.additionalProperties === !1
          ? "false"
          : "true",
      i0 = `(${g}.test(key) ? ${t} : ${D0})`
    yield `(Object.entries(${z}).every(([key, value]) => ${i0}))`
  }
  function* I(U, D, z) {
    const x = B0(U, D)
    if (d0.functions.has(U.$ref)) return yield `${t0(U.$ref)}(${z})`
    yield* G2(x, D, z)
  }
  function* k(U, _D, z) {
    const x = F1(`${new RegExp(U.source, U.flags)};`)
    if ((yield `(typeof ${z} === 'string')`, u(U.maxLength))) yield `${z}.length <= ${U.maxLength}`
    if (u(U.minLength)) yield `${z}.length >= ${U.minLength}`
    yield `${x}.test(${z})`
  }
  function* b(U, _D, z) {
    if ((yield `(typeof ${z} === 'string')`, u(U.maxLength))) yield `${z}.length <= ${U.maxLength}`
    if (u(U.minLength)) yield `${z}.length >= ${U.minLength}`
    if (U.pattern !== void 0) yield `${F1(`${new RegExp(U.pattern)};`)}.test(${z})`
    if (U.format !== void 0) yield `format('${U.format}', ${z})`
  }
  function* _(_U, _D, z) {
    yield `(typeof ${z} === 'symbol')`
  }
  function* V(U, _D, z) {
    yield `(typeof ${z} === 'string')`, yield `${F1(`${new RegExp(U.pattern)};`)}.test(${z})`
  }
  function* d(U, _D, z) {
    yield `${t0(U.$ref)}(${z})`
  }
  function* m(U, D, z) {
    if ((yield `Array.isArray(${z})`, U.items === void 0)) return yield `${z}.length === 0`
    yield `(${z}.length === ${U.maxItems})`
    for (let x = 0; x < U.items.length; x++) yield `${$1(U.items[x], D, `${z}[${x}]`)}`
  }
  function* X0(_U, _D, z) {
    yield `${z} === undefined`
  }
  function* R0(U, D, z) {
    yield `(${U.anyOf.map((E) => $1(E, D, z)).join(" || ")})`
  }
  function* e(U, _D, z) {
    if ((yield `${z} instanceof Uint8Array`, u(U.maxByteLength)))
      yield `(${z}.length <= ${U.maxByteLength})`
    if (u(U.minByteLength)) yield `(${z}.length >= ${U.minByteLength})`
  }
  function* C$(_U, _D, _z) {
    yield "true"
  }
  function* j$(_U, _D, z) {
    yield Q8.IsVoidLike(z)
  }
  function* h1(U, _D, z) {
    const x = d0.instances.size
    d0.instances.set(x, U), yield `kind('${U[L]}', ${x}, ${z})`
  }
  function* G2(U, D, z, x = !0) {
    const E = q0(U.$id) ? [...D, U] : D,
      g = U
    if (x && q0(U.$id)) {
      const t = t0(U.$id)
      if (d0.functions.has(t)) return yield `${t}(${z})`
      else {
        d0.functions.set(t, "<deferred>")
        const D0 = g2(t, U, D, "value", !1)
        return d0.functions.set(t, D0), yield `${t}(${z})`
      }
    }
    switch (g[L]) {
      case "Any":
        return yield* Q(g, E, z)
      case "Argument":
        return yield* J(g, E, z)
      case "Array":
        return yield* Y(g, E, z)
      case "AsyncIterator":
        return yield* Z(g, E, z)
      case "BigInt":
        return yield* W(g, E, z)
      case "Boolean":
        return yield* q(g, E, z)
      case "Constructor":
        return yield* M(g, E, z)
      case "Date":
        return yield* G(g, E, z)
      case "Function":
        return yield* B(g, E, z)
      case "Import":
        return yield* N(g, E, z)
      case "Integer":
        return yield* P(g, E, z)
      case "Intersect":
        return yield* w(g, E, z)
      case "Iterator":
        return yield* H(g, E, z)
      case "Literal":
        return yield* A(g, E, z)
      case "Never":
        return yield* S(g, E, z)
      case "Not":
        return yield* j(g, E, z)
      case "Null":
        return yield* K(g, E, z)
      case "Number":
        return yield* y(g, E, z)
      case "Object":
        return yield* o(g, E, z)
      case "Promise":
        return yield* n(g, E, z)
      case "Record":
        return yield* f(g, E, z)
      case "Ref":
        return yield* I(g, E, z)
      case "RegExp":
        return yield* k(g, E, z)
      case "String":
        return yield* b(g, E, z)
      case "Symbol":
        return yield* _(g, E, z)
      case "TemplateLiteral":
        return yield* V(g, E, z)
      case "This":
        return yield* d(g, E, z)
      case "Tuple":
        return yield* m(g, E, z)
      case "Undefined":
        return yield* X0(g, E, z)
      case "Union":
        return yield* R0(g, E, z)
      case "Uint8Array":
        return yield* e(g, E, z)
      case "Unknown":
        return yield* C$(g, E, z)
      case "Void":
        return yield* j$(g, E, z)
      default:
        if (!W1.Has(g[L])) throw new UW(U)
        return yield* h1(g, E, z)
    }
  }
  const d0 = {
    language: "javascript",
    functions: new Map(),
    variables: new Map(),
    instances: new Map(),
  }
  function $1(U, D, z, x = !0) {
    return `(${[...G2(U, D, z, x)].join(" && ")})`
  }
  function t0(U) {
    return `check_${UJ.Encode(U)}`
  }
  function F1(U) {
    const D = `local_${d0.variables.size}`
    return d0.variables.set(D, `const ${D} = ${U}`), D
  }
  function g2(U, D, z, x, E = !0) {
    const [g, t] = [
        `
`,
        (P1) => "".padStart(P1, " "),
      ],
      D0 = R1("value", "any"),
      i0 = f2("boolean"),
      G1 = [...G2(D, z, x, E)].map((P1) => `${t(4)}${P1}`).join(` &&${g}`)
    return `function ${U}(${D0})${i0} {${g}${t(2)}return (${g}${G1}${g}${t(2)})
}`
  }
  function R1(U, D) {
    const z = d0.language === "typescript" ? `: ${D}` : ""
    return `${U}${z}`
  }
  function f2(U) {
    return d0.language === "typescript" ? `: ${U}` : ""
  }
  function D8(U, D, _z) {
    const x = g2("check", U, D, "value"),
      E = R1("value", "any"),
      g = f2("boolean"),
      t = [...d0.functions.values()],
      D0 = [...d0.variables.values()],
      i0 = q0(U.$id)
        ? `return function check(${E})${g} {
  return ${t0(U.$id)}(value)
}`
        : `return ${x}`
    return [...D0, ...t, i0].join(`
`)
  }
  function e1(...U) {
    const D = { language: "javascript" },
      [z, x, E] =
        U.length === 2 && c(U[1])
          ? [U[0], U[1], D]
          : U.length === 2 && !c(U[1])
            ? [U[0], [], U[1]]
            : U.length === 3
              ? [U[0], U[1], U[2]]
              : U.length === 1
                ? [U[0], [], D]
                : [null, [], D]
    if (
      ((d0.language = E.language),
      d0.variables.clear(),
      d0.functions.clear(),
      d0.instances.clear(),
      !T0(z))
    )
      throw new HJ(z)
    for (const g of x) if (!T0(g)) throw new HJ(g)
    return D8(z, x, E)
  }
  $.Code = e1
  function v(U, D = []) {
    const z = e1(U, D, { language: "javascript" }),
      x = globalThis.Function("kind", "format", "hash", z),
      E = new Map(d0.instances)
    function g(G1, P1, p$) {
      if (!W1.Has(G1) || !E.has(P1)) return !1
      const O8 = W1.Get(G1),
        q7 = E.get(P1)
      return O8(q7, p$)
    }
    function t(G1, P1) {
      if (!O0.Has(G1)) return !1
      return O0.Get(G1)(P1)
    }
    function D0(G1) {
      return f$(G1)
    }
    const i0 = x(g, t, D0)
    return new wW(U, D, i0, z)
  }
  $.Compile = v
})(_2 || (_2 = {}))
var E2 = typeof Bun < "u"
var OJ = {
    aac: "audio/aac",
    abw: "application/x-abiword",
    ai: "application/postscript",
    arc: "application/octet-stream",
    avi: "video/x-msvideo",
    azw: "application/vnd.amazon.ebook",
    bin: "application/octet-stream",
    bz: "application/x-bzip",
    bz2: "application/x-bzip2",
    csh: "application/x-csh",
    css: "text/css",
    csv: "text/csv",
    doc: "application/msword",
    dll: "application/octet-stream",
    eot: "application/vnd.ms-fontobject",
    epub: "application/epub+zip",
    gif: "image/gif",
    htm: "text/html",
    html: "text/html",
    ico: "image/x-icon",
    ics: "text/calendar",
    jar: "application/java-archive",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    js: "application/javascript",
    json: "application/json",
    mid: "audio/midi",
    midi: "audio/midi",
    mp2: "audio/mpeg",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    mpa: "video/mpeg",
    mpe: "video/mpeg",
    mpeg: "video/mpeg",
    mpkg: "application/vnd.apple.installer+xml",
    odp: "application/vnd.oasis.opendocument.presentation",
    ods: "application/vnd.oasis.opendocument.spreadsheet",
    odt: "application/vnd.oasis.opendocument.text",
    oga: "audio/ogg",
    ogv: "video/ogg",
    ogx: "application/ogg",
    otf: "font/otf",
    png: "image/png",
    pdf: "application/pdf",
    ppt: "application/vnd.ms-powerpoint",
    rar: "application/x-rar-compressed",
    rtf: "application/rtf",
    sh: "application/x-sh",
    svg: "image/svg+xml",
    swf: "application/x-shockwave-flash",
    tar: "application/x-tar",
    tif: "image/tiff",
    tiff: "image/tiff",
    ts: "application/typescript",
    ttf: "font/ttf",
    txt: "text/plain",
    vsd: "application/vnd.visio",
    wav: "audio/x-wav",
    weba: "audio/webm",
    webm: "video/webm",
    webp: "image/webp",
    woff: "font/woff",
    woff2: "font/woff2",
    xhtml: "application/xhtml+xml",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.ms-excel",
    xlsx_OLD: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xml: "application/xml",
    xul: "application/vnd.mozilla.xul+xml",
    zip: "application/zip",
    "3gp": "video/3gpp",
    "3gp_DOES_NOT_CONTAIN_VIDEO": "audio/3gpp",
    "3gp2": "video/3gpp2",
    "3gp2_DOES_NOT_CONTAIN_VIDEO": "audio/3gpp2",
    "7z": "application/x-7z-compressed",
  },
  tz = ($) => {
    const X = $.lastIndexOf(".")
    return X === -1 ? "" : $.slice(X + 1)
  }
var AJ, DJ
class J8 {
  constructor($) {
    if (((this.path = $), E2)) this.value = Bun.file($)
    else {
      if (!AJ || !DJ) {
        if (typeof window < "u") {
          console.warn("Browser environment does not support file")
          return
        }
        const X = (J) =>
          console.warn(
            Error(
              `[elysia] \`file\` require \`fs${J ? `.${J}` : ""}\` ${J?.includes(".") ? "module " : ""}which is not available in this environment`
            )
          )
        if (typeof process > "u" || typeof process.getBuiltinModule !== "function") {
          X()
          return
        }
        const Q = process.getBuiltinModule("fs")
        if (!Q) {
          X()
          return
        }
        if (typeof Q.createReadStream !== "function") {
          X()
          return
        }
        if (typeof Q.promises?.stat !== "function") {
          X()
          return
        }
        ;(AJ = Q.createReadStream), (DJ = Q.promises.stat)
      }
      ;(this.value = AJ($)), (this.stats = DJ($))
    }
  }
  get type() {
    return OJ[tz(this.path)] || "application/octet-stream"
  }
  get length() {
    return E2 ? this.value.size : (this.stats?.then(($) => $.size) ?? 0)
  }
}
var f6 = "toJSON" in new Headers(),
  uX = ($, X) => {
    const Q = new URL($)
    return (Q.pathname = X), Q.toString()
  },
  sz = ($) =>
    (typeof $ === "function" && /^\s*class\s+/.test($.toString())) ||
    ($.toString?.().startsWith("[object ") && $.toString() !== "[object Object]") ||
    A0(Object.getPrototypeOf($)),
  PJ = ($) => $ && typeof $ === "object" && !Array.isArray($),
  Y1 = ($, X, Q) => {
    const J = Q?.skipKeys,
      Y = Q?.override ?? !0,
      Z = Q?.mergeArray ?? !1
    if (!PJ($) || !PJ(X)) return $
    for (const [W, q] of Object.entries(X))
      if (!J?.includes(W)) {
        if (Z && Array.isArray(q)) {
          $[W] = Array.isArray($[W]) ? [...$[W], ...q] : ($[W] = q)
          continue
        }
        if (!PJ(q) || !(W in $) || sz(q)) {
          if ((Y || !(W in $)) && !Object.isFrozen($))
            try {
              $[W] = q
            } catch {}
          continue
        }
        if (!Object.isFrozen($[W]))
          try {
            $[W] = Y1($[W], q, { skipKeys: J, override: Y, mergeArray: Z })
          } catch {}
      }
    return $
  },
  y6 = ($, X) => {
    const Q = Y1(Object.assign({}, $), X, { skipKeys: ["properties"], mergeArray: !1 })
    return Q.properties && delete Q.properties, Q
  },
  y0 = ($, X) => {
    if (!X) return $
    const Q = [],
      J = []
    if ($) {
      Array.isArray($) || ($ = [$])
      for (const Y of $) Q.push(Y), Y.checksum && J.push(Y.checksum)
    }
    if (X) {
      Array.isArray(X) || (X = [X])
      for (const Y of X) J.includes(Y.checksum) || Q.push(Y)
    }
    return Q
  },
  rz = [
    "start",
    "request",
    "parse",
    "transform",
    "resolve",
    "beforeHandle",
    "afterHandle",
    "mapResponse",
    "afterResponse",
    "trace",
    "error",
    "stop",
    "body",
    "headers",
    "params",
    "query",
    "response",
    "type",
    "detail",
  ],
  _xx = rz.reduce(($, X) => (($[X] = !0), $), {}),
  mX = ($) => typeof $ === "object" && Object.keys($).every((X) => !Number.isNaN(+X)),
  HW = ($, X) =>
    mX($) && mX(X)
      ? Object.assign({}, $, X)
      : $ && !mX($) && mX(X)
        ? Object.assign({ 200: $ }, X)
        : (X ?? $),
  n8 = ($, X) =>
    !$ && !X
      ? {
          body: void 0,
          headers: void 0,
          params: void 0,
          query: void 0,
          cookie: void 0,
          response: void 0,
        }
      : {
          body: X?.body ?? $?.body,
          headers: X?.headers ?? $?.headers,
          params: X?.params ?? $?.params,
          query: X?.query ?? $?.query,
          cookie: X?.cookie ?? $?.cookie,
          response: HW($?.response, X?.response),
        },
  N$ = ($, X) => {
    if (!X) return $ ?? {}
    if (!$) return X ?? {}
    if (!Object.values(X).find((J) => J != null)) return { ...$ }
    const Q = {
      ...$,
      ...X,
      body: X.body ?? $.body,
      headers: X.headers ?? $.headers,
      params: X.params ?? $.params,
      query: X.query ?? $.query,
      cookie: X.cookie ?? $.cookie,
      response: HW($.response, X.response),
      type: $.type || X.type,
      detail: Y1(X.detail ?? {}, $.detail ?? {}),
      parse: y0($.parse, X.parse),
      transform: y0($.transform, X.transform),
      beforeHandle: y0(
        y0(J1($.resolve, "resolve"), $.beforeHandle),
        y0(J1(X.resolve, "resolve"), X.beforeHandle)
      ),
      afterHandle: y0($.afterHandle, X.afterHandle),
      mapResponse: y0($.mapResponse, X.mapResponse),
      afterResponse: y0($.afterResponse, X.afterResponse),
      trace: y0($.trace, X.trace),
      error: y0($.error, X.error),
      standaloneSchema:
        $.standaloneSchema || X.standaloneSchema
          ? $.standaloneSchema && !X.standaloneSchema
            ? $.standaloneSchema
            : X.standaloneSchema && !$.standaloneSchema
              ? X.standaloneSchema
              : [...($.standaloneSchema ?? []), ...(X.standaloneSchema ?? [])]
          : void 0,
    }
    return Q.resolve && delete Q.resolve, Q
  },
  AW = ($) => {
    $.parse && !Array.isArray($.parse) && ($.parse = [$.parse]),
      $.transform && !Array.isArray($.transform) && ($.transform = [$.transform]),
      $.afterHandle && !Array.isArray($.afterHandle) && ($.afterHandle = [$.afterHandle]),
      $.mapResponse && !Array.isArray($.mapResponse) && ($.mapResponse = [$.mapResponse]),
      $.afterResponse && !Array.isArray($.afterResponse) && ($.afterResponse = [$.afterResponse]),
      $.trace && !Array.isArray($.trace) && ($.trace = [$.trace]),
      $.error && !Array.isArray($.error) && ($.error = [$.error])
    let X = []
    return (
      $.resolve &&
        ((X = J1(Array.isArray($.resolve) ? $.resolve : [$.resolve], "resolve")), delete $.resolve),
      $.beforeHandle &&
        (X.length
          ? (X = X.concat(Array.isArray($.beforeHandle) ? $.beforeHandle : [$.beforeHandle]))
          : (X = Array.isArray($.beforeHandle) ? $.beforeHandle : [$.beforeHandle])),
      X.length && ($.beforeHandle = X),
      $
    )
  },
  az = typeof Bun < "u",
  _Ix = az && typeof Bun.hash === "function",
  v$ = ($) => {
    let X = 9
    for (let Q = 0; Q < $.length; ) X = Math.imul(X ^ $.charCodeAt(Q++), 387420489)
    return (X = X ^ (X >>> 9))
  },
  x2 = ($, X) => {
    if (!X) return
    if (!Array.isArray(X)) {
      const J = X
      return $ && !J.checksum && (J.checksum = $), J.scope === "scoped" && (J.scope = "local"), J
    }
    const Q = [...X]
    for (const J of Q)
      $ && !J.checksum && (J.checksum = $), J.scope === "scoped" && (J.scope = "local")
    return Q
  },
  LJ = ($, X, Q) => ({
    start: y0($.start, x2(Q, X?.start)),
    request: y0($.request, x2(Q, X?.request)),
    parse: y0($.parse, x2(Q, X?.parse)),
    transform: y0($.transform, x2(Q, X?.transform)),
    beforeHandle: y0(
      y0(J1($.resolve, "resolve"), $.beforeHandle),
      x2(Q, y0(J1(X?.resolve, "resolve"), X?.beforeHandle))
    ),
    afterHandle: y0($.afterHandle, x2(Q, X?.afterHandle)),
    mapResponse: y0($.mapResponse, x2(Q, X?.mapResponse)),
    afterResponse: y0($.afterResponse, x2(Q, X?.afterResponse)),
    trace: y0($.trace, x2(Q, X?.trace)),
    error: y0($.error, x2(Q, X?.error)),
    stop: y0($.stop, x2(Q, X?.stop)),
  }),
  DW = ($, X, { skipIfHasType: Q = !1 }) => {
    if (!$) return $
    if (!Array.isArray($)) return Q ? ($.scope ??= X) : ($.scope = X), $
    for (const J of $) Q ? (J.scope ??= X) : (J.scope = X)
    return $
  },
  y$ = ($) => {
    if (!$) return $
    if (!Array.isArray($))
      switch ($.scope) {
        case "global":
        case "scoped":
          return { ...$ }
        default:
          return { fn: $ }
      }
    const X = []
    for (const Q of $)
      switch (Q.scope) {
        case "global":
        case "scoped":
          X.push({ ...Q })
          break
      }
    return X
  },
  KJ = ($) => ({
    ...$,
    type: $?.type,
    detail: $?.detail,
    parse: y$($?.parse),
    transform: y$($?.transform),
    beforeHandle: y$($?.beforeHandle),
    afterHandle: y$($?.afterHandle),
    mapResponse: y$($?.mapResponse),
    afterResponse: y$($?.afterResponse),
    error: y$($?.error),
    trace: y$($?.trace),
  }),
  w$ = {
    Continue: 100,
    "Switching Protocols": 101,
    Processing: 102,
    "Early Hints": 103,
    OK: 200,
    Created: 201,
    Accepted: 202,
    "Non-Authoritative Information": 203,
    "No Content": 204,
    "Reset Content": 205,
    "Partial Content": 206,
    "Multi-Status": 207,
    "Already Reported": 208,
    "Multiple Choices": 300,
    "Moved Permanently": 301,
    Found: 302,
    "See Other": 303,
    "Not Modified": 304,
    "Temporary Redirect": 307,
    "Permanent Redirect": 308,
    "Bad Request": 400,
    Unauthorized: 401,
    "Payment Required": 402,
    Forbidden: 403,
    "Not Found": 404,
    "Method Not Allowed": 405,
    "Not Acceptable": 406,
    "Proxy Authentication Required": 407,
    "Request Timeout": 408,
    Conflict: 409,
    Gone: 410,
    "Length Required": 411,
    "Precondition Failed": 412,
    "Payload Too Large": 413,
    "URI Too Long": 414,
    "Unsupported Media Type": 415,
    "Range Not Satisfiable": 416,
    "Expectation Failed": 417,
    "I'm a teapot": 418,
    "Enhance Your Calm": 420,
    "Misdirected Request": 421,
    "Unprocessable Content": 422,
    Locked: 423,
    "Failed Dependency": 424,
    "Too Early": 425,
    "Upgrade Required": 426,
    "Precondition Required": 428,
    "Too Many Requests": 429,
    "Request Header Fields Too Large": 431,
    "Unavailable For Legal Reasons": 451,
    "Internal Server Error": 500,
    "Not Implemented": 501,
    "Bad Gateway": 502,
    "Service Unavailable": 503,
    "Gateway Timeout": 504,
    "HTTP Version Not Supported": 505,
    "Variant Also Negotiates": 506,
    "Insufficient Storage": 507,
    "Loop Detected": 508,
    "Not Extended": 510,
    "Network Authentication Required": 511,
  },
  cX = Object.fromEntries(Object.entries(w$).map(([$, X]) => [X, $]))
function ez($) {
  let X = $
  for (; X.endsWith("="); ) X = X.slice(0, -1)
  return X
}
var zW = new TextEncoder(),
  o8 = async ($, X) => {
    if (
      (typeof $ === "object" ? ($ = JSON.stringify($)) : typeof $ !== "string" && ($ = `${$}`),
      X === null)
    )
      throw TypeError("Secret key must be provided.")
    const Q = await crypto.subtle.importKey(
        "raw",
        zW.encode(X),
        { name: "HMAC", hash: "SHA-256" },
        !1,
        ["sign"]
      ),
      J = await crypto.subtle.sign("HMAC", Q, zW.encode($))
    return `${$}.${ez(Buffer.from(J).toString("base64"))}`
  },
  SJ = async ($, X) => {
    if (typeof $ !== "string") throw TypeError("Signed cookie string must be provided.")
    if (X === null) throw TypeError("Secret key must be provided.")
    const Q = $.slice(0, $.lastIndexOf("."))
    return (await o8(Q, X)) === $ ? Q : !1
  },
  OW = ($, X, Q) => {
    if (!$.standaloneValidator?.length || !Array.isArray($.standaloneValidator)) {
      $.standaloneValidator = [{ [X]: Q }]
      return
    }
    const J = $.standaloneValidator[$.standaloneValidator.length - 1]
    X in J ? $.standaloneValidator.push({ [X]: Q }) : (J[X] = Q)
  },
  $H = ($) => {
    if (typeof $ === "number") return $
    if ($.length < 16) {
      if ($.trim().length === 0) return null
      const X = Number($)
      return Number.isNaN(X) ? null : X
    }
    if ($.length === 16) {
      if ($.trim().length === 0) return null
      const X = Number($)
      return Number.isNaN(X) || X.toString() !== $ ? null : X
    }
    return null
  },
  pX = ($) => $H($) !== null
class CJ {
  constructor($ = console.error, X = () => {}) {
    ;(this.onError = $), (this.onFinally = X), (this.root = null), (this.promises = [])
  }
  get size() {
    return this.promises.length
  }
  add($) {
    return (
      this.promises.push($),
      (this.root ||= this.drain()),
      this.promises.length === 1 && this.then(this.onFinally),
      $
    )
  }
  async drain() {
    for (; this.promises.length > 0; ) {
      try {
        await this.promises[0]
      } catch ($) {
        this.onError($)
      }
      this.promises.shift()
    }
    this.root = null
  }
  then($, X) {
    return (this.root ?? Promise.resolve()).then($, X)
  }
}
var J1 = ($, X) => {
    if (!$) return $
    if (!Array.isArray($)) {
      if (typeof $ === "function" || typeof $ === "string")
        return X ? { fn: $, subType: X } : { fn: $ }
      if ("fn" in $) return $
    }
    const Q = []
    for (const J of $)
      typeof J === "function" || typeof J === "string"
        ? Q.push(X ? { fn: J, subType: X } : { fn: J })
        : "fn" in J && Q.push(J)
    return Q
  },
  jJ = ($) => (
    $.start && ($.start = J1($.start)),
    $.request && ($.request = J1($.request)),
    $.parse && ($.parse = J1($.parse)),
    $.transform && ($.transform = J1($.transform)),
    $.beforeHandle && ($.beforeHandle = J1($.beforeHandle)),
    $.afterHandle && ($.afterHandle = J1($.afterHandle)),
    $.mapResponse && ($.mapResponse = J1($.mapResponse)),
    $.afterResponse && ($.afterResponse = J1($.afterResponse)),
    $.trace && ($.trace = J1($.trace)),
    $.error && ($.error = J1($.error)),
    $.stop && ($.stop = J1($.stop)),
    $
  ),
  FJ = ($) => {
    const X = Object.create(null)
    return (
      $.start?.map && (X.start = $.start.map((Q) => Q.fn)),
      $.request?.map && (X.request = $.request.map((Q) => Q.fn)),
      $.parse?.map && (X.parse = $.parse.map((Q) => Q.fn)),
      $.transform?.map && (X.transform = $.transform.map((Q) => Q.fn)),
      $.beforeHandle?.map && (X.beforeHandle = $.beforeHandle.map((Q) => Q.fn)),
      $.afterHandle?.map && (X.afterHandle = $.afterHandle.map((Q) => Q.fn)),
      $.mapResponse?.map && (X.mapResponse = $.mapResponse.map((Q) => Q.fn)),
      $.afterResponse?.map && (X.afterResponse = $.afterResponse.map((Q) => Q.fn)),
      $.error?.map && (X.error = $.error.map((Q) => Q.fn)),
      $.stop?.map && (X.stop = $.stop.map((Q) => Q.fn)),
      $.trace?.map ? (X.trace = $.trace.map((Q) => Q.fn)) : (X.trace = []),
      X
    )
  },
  iX = ($) => ({
    body: $.body,
    cookie: $.cookie,
    headers: $.headers,
    query: $.query,
    set: $.set,
    server: $.server,
    path: $.path,
    route: $.route,
    url: $.url,
  }),
  U$ = ($, X = 302) => Response.redirect($, X),
  G$ = Symbol("ElysiaFormData"),
  z$ = Symbol("ElysiaRequestId"),
  RJ = ($) => {
    const X = new FormData()
    if (((X[G$] = {}), $))
      for (const [Q, J] of Object.entries($)) {
        if (Array.isArray(J)) {
          X[G$][Q] = []
          for (const _Y of J)
            J instanceof File
              ? X.append(Q, J, J.name)
              : J instanceof J8
                ? X.append(Q, J.value, J.value?.name)
                : X.append(Q, J),
              X[G$][Q].push(J)
          continue
        }
        J instanceof File
          ? X.append(Q, J, J.name)
          : J instanceof J8
            ? X.append(Q, J.value, J.value?.name)
            : X.append(Q, J),
          (X[G$][Q] = J)
      }
    return X
  },
  d$ =
    typeof crypto > "u"
      ? () => {
          let $ = "",
            X = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
            Q = X.length
          for (let J = 0; J < 16; J++) $ += X.charAt(Math.floor(Math.random() * Q))
          return $
        }
      : () => {
          const $ = crypto.randomUUID()
          return $.slice(0, 8) + $.slice(24, 32)
        },
  VJ = ($) => {
    if (!$.length) return []
    const X = []
    for (let Q = 0; Q < $.length; Q++) {
      const J = $[Q]
      J.checksum && (X.includes(J.checksum) && ($.splice(Q, 1), Q--), X.push(J.checksum))
    }
    return $
  },
  H$ = ($, X = "scoped") => {
    if ($) {
      if (X === "scoped") {
        for (const Q of $) "scope" in Q && Q.scope === "local" && (Q.scope = "scoped")
        return
      }
      for (const Q of $) "scope" in Q && (Q.scope = "global")
    }
  },
  Y8 = ($) => ($.charCodeAt($.length - 1) === 47 ? $.slice(0, $.length - 1) : `${$}/`),
  A0 = ($) => {
    if (!$) return !1
    for (const _X in $) return !0
    return !1
  },
  Z8 = ($, { dynamic: X = !1 } = {}) => {
    let Q = encodeURIComponent($).replace(/%2F/g, "/")
    return X && (Q = Q.replace(/%3A/g, ":").replace(/%3F/g, "?")), Q
  },
  nX = !!(typeof Bun > "u" || Bun.semver?.satisfies?.(Bun.version, ">=1.2.14"))
async function PW($) {
  if ($.bodyUsed || !$.body) return 0
  let X = 0,
    Q = $.body.getReader()
  for (;;) {
    const { done: J, value: Y } = await Q.read()
    if (J) break
    X += Y.byteLength
  }
  return X
}
var LW = { headers: !0, cookie: !0, query: !0, params: !0, body: !0, response: !0 }
var KW = typeof Bun < "u" ? Bun.env : typeof process < "u" ? process?.env : void 0,
  W8 = Symbol("ElysiaErrorCode"),
  A$ = (KW?.NODE_ENV ?? KW?.ENV) === "production",
  XH = { 101: void 0, 204: void 0, 205: void 0, 304: void 0, 307: void 0, 308: void 0 }
class o0 {
  constructor($, X) {
    const Q = X ?? ($ in cX ? cX[$] : $)
    ;(this.code = w$[$] ?? $), $ in XH ? (this.response = void 0) : (this.response = Q)
  }
}
var m2 = ($, X) => new o0($, X)
class l8 extends Error {
  constructor($) {
    super($ ?? "NOT_FOUND")
    ;(this.code = "NOT_FOUND"), (this.status = 404)
  }
}
class oX extends Error {
  constructor($) {
    super("Bad Request", { cause: $ })
    ;(this.code = "PARSE"), (this.status = 400)
  }
}
class v6 extends Error {
  constructor($, X) {
    super(X ?? `"${$}" has invalid cookie signature`)
    ;(this.key = $), (this.code = "INVALID_COOKIE_SIGNATURE"), (this.status = 400)
  }
}
var M1 = ($) => {
  if (!$) return { summary: void 0 }
  const { message: X, path: Q, value: J, type: Y } = $,
    Z = Q.slice(1).replaceAll("/", "."),
    W = Q === ""
  switch (Y) {
    case 42:
      return {
        ...$,
        summary: W ? "Value should not be provided" : `Property '${Z}' should not be provided`,
      }
    case 45:
      return { ...$, summary: W ? "Value is missing" : `Property '${Z}' is missing` }
    case 50: {
      const q = X.indexOf("'"),
        M = X.slice(q + 1, X.indexOf("'", q + 1))
      return { ...$, summary: W ? "Value should be an email" : `Property '${Z}' should be ${M}` }
    }
    case 54:
      return {
        ...$,
        summary: `${X.slice(0, 9).trim()} property '${Z}' to be ${X.slice(8).trim()} but found: ${J}`,
      }
    case 62: {
      const G = $.schema.anyOf.map((B) => `'${B?.format ?? B.type}'`).join(", ")
      return {
        ...$,
        summary: W ? `Value should be one of ${G}` : `Property '${Z}' should be one of: ${G}`,
      }
    }
    default:
      return { summary: X, ...$ }
  }
}
class t8 extends Error {
  constructor($, X, Q = `"${$}" has invalid file type`) {
    super(Q)
    ;(this.property = $),
      (this.expected = X),
      (this.message = Q),
      (this.code = "INVALID_FILE_TYPE"),
      (this.status = 422),
      Object.setPrototypeOf(this, t8.prototype)
  }
  toResponse($) {
    return A$
      ? new Response(JSON.stringify({ type: "validation", on: "body" }), {
          status: 422,
          headers: { ...$, "content-type": "application/json" },
        })
      : new Response(
          JSON.stringify({
            type: "validation",
            on: "body",
            summary: "Invalid file type",
            message: this.message,
            property: this.property,
            expected: this.expected,
          }),
          { status: 422, headers: { ...$, "content-type": "application/json" } }
        )
  }
}
class a extends Error {
  constructor($, X, Q, J) {
    let Y = "",
      Z,
      W,
      q
    if (X?.provider === "standard" || "~standard" in X || (X.schema && "~standard" in X.schema)) {
      const M = ("~standard" in X ? X : X.schema)["~standard"]
      ;(Z = (J ?? M.validate(Q).issues)?.[0]),
        A$
          ? (Y = JSON.stringify({ type: "validation", on: $, found: Q }))
          : (Y = JSON.stringify(
              {
                type: "validation",
                on: $,
                property: Z.path?.[0] || "root",
                message: Z?.message,
                summary: Z?.problem,
                expected: W,
                found: Q,
                errors: J,
              },
              null,
              2
            )),
        (q = Z?.message)
    } else {
      Q && typeof Q === "object" && Q instanceof o0 && (Q = Q.response),
        (Z = J?.First() ?? ("Errors" in X ? X.Errors(Q).First() : S0.Errors(X, Q).First()))
      const M = Z?.path || "root",
        G = X?.schema ?? X
      if (!A$)
        try {
          W = S0.Create(G)
        } catch (B) {
          W = { type: "Could not create expected value", message: B?.message, error: B }
        }
      ;(q =
        Z?.schema?.message || Z?.schema?.error !== void 0
          ? typeof Z.schema.error === "function"
            ? Z.schema.error(
                A$
                  ? { type: "validation", on: $, found: Q }
                  : {
                      type: "validation",
                      on: $,
                      value: Q,
                      property: M,
                      message: Z?.message,
                      summary: M1(Z).summary,
                      found: Q,
                      expected: W,
                      errors:
                        "Errors" in X ? [...X.Errors(Q)].map(M1) : [...S0.Errors(X, Q)].map(M1),
                    },
                X
              )
            : Z.schema.error
          : void 0),
        q !== void 0
          ? (Y = typeof q === "object" ? JSON.stringify(q) : `${q}`)
          : A$
            ? (Y = JSON.stringify({ type: "validation", on: $, found: Q }))
            : (Y = JSON.stringify(
                {
                  type: "validation",
                  on: $,
                  property: M,
                  message: Z?.message,
                  summary: M1(Z).summary,
                  expected: W,
                  found: Q,
                  errors: "Errors" in X ? [...X.Errors(Q)].map(M1) : [...S0.Errors(X, Q)].map(M1),
                },
                null,
                2
              ))
    }
    super(Y)
    ;(this.type = $),
      (this.validator = X),
      (this.value = Q),
      (this.code = "VALIDATION"),
      (this.status = 422),
      (this.valueError = Z),
      (this.expected = W),
      (this.customError = q),
      Object.setPrototypeOf(this, a.prototype)
  }
  get all() {
    return "Errors" in this.validator
      ? [...this.validator.Errors(this.value)].map(M1)
      : [...S0.Errors(this.validator, this.value)].map(M1)
  }
  static simplifyModel($) {
    const X = "schema" in $ ? $.schema : $
    try {
      return S0.Create(X)
    } catch {
      return X
    }
  }
  get model() {
    return "~standard" in this.validator ? this.validator : a.simplifyModel(this.validator)
  }
  toResponse($) {
    return new Response(this.message, {
      status: 400,
      headers: { ...$, "content-type": "application/json" },
    })
  }
  detail($) {
    if (!this.customError) return this.message
    const _X = this.validator,
      Q = this.value,
      J = this.expected,
      Y = this.all
    return A$
      ? { type: "validation", on: this.type, found: Q, message: $ }
      : {
          type: "validation",
          on: this.type,
          property: this.valueError?.path || "root",
          message: $,
          summary: M1(this.valueError).summary,
          found: Q,
          expected: J,
          errors: Y,
        }
  }
}
var J6 = ($, X) => {
  try {
    return JSON.parse($)
  } catch {
    throw new a("property", X, $)
  }
}
function Y6($, X) {
  return W1.Has($) || W1.Set($, X), (Q = {}) => EX({ ...Q, [L]: $ })
}
var i2 = ($) => {
    try {
      const X = _2.Compile($)
      return (
        (X.Create = () => S0.Create($)), (X.Error = (Q) => new a("property", $, Q, X.Errors(Q))), X
      )
    } catch {
      return {
        Check: (X) => S0.Check($, X),
        CheckThrow: (X) => {
          if (!S0.Check($, X)) throw new a("property", $, X, S0.Errors($, X))
        },
        Decode: (X) => S0.Decode($, X),
        Create: () => S0.Create($),
        Error: (X) => new a("property", $, X, S0.Errors($, X)),
      }
    }
  },
  A5 = ($) => {
    if (typeof $ === "string")
      switch ($.slice(-1)) {
        case "k":
          return +$.slice(0, $.length - 1) * 1024
        case "m":
          return +$.slice(0, $.length - 1) * 1048576
        default:
          return +$
      }
    return $
  },
  $Q = ($, X) =>
    $.startsWith(X)
      ? !0
      : X.charCodeAt(X.length - 1) === 42 &&
        X.charCodeAt(X.length - 2) === 47 &&
        $.startsWith(X.slice(0, -1)),
  D5 = !1,
  qA = () => {
    D5 ||
      (console.warn(
        "[Elysia] Attempt to validate file type without 'file-type'. This may lead to security risks. We recommend installing 'file-type' to properly validate file extension."
      ),
      (D5 = !0))
  },
  QQ = async () =>
    Promise.resolve()
      .then(() => (H5(), z5))
      .then(($) => ((XQ = $.fileTypeFromBlob), XQ))
      .catch(qA),
  XQ,
  MA = ($) =>
    XQ
      ? XQ($)
      : QQ().then((X) => {
          if (X) return X($)
        }),
  JQ = async ($, X, Q = $?.name ?? "") => {
    if (Array.isArray($)) return await Promise.all($.map((Y) => JQ(Y, X, Q))), !0
    if (!$) return !1
    const J = await MA($)
    if (!J) throw new t8(Q, X)
    if (typeof X === "string" && !$Q(J.mime, X)) throw new t8(Q, X)
    for (let Y = 0; Y < X.length; Y++) if ($Q(J.mime, X[Y])) return !0
    throw new t8(Q, X)
  },
  YQ = ($, X) => {
    if (X instanceof J8) return !0
    if (
      !(X instanceof Blob) ||
      ($.minSize && X.size < A5($.minSize)) ||
      ($.maxSize && X.size > A5($.maxSize))
    )
      return !1
    if ($.extension) {
      if (typeof $.extension === "string") return $Q(X.type, $.extension)
      for (let Q = 0; Q < $.extension.length; Q++) if ($Q(X.type, $.extension[Q])) return !0
      return !1
    }
    return !0
  }
var iJ = {
  date: j5,
  time: pJ(!0),
  "date-time": O5(!0),
  "iso-time": pJ(!1),
  "iso-date-time": O5(!1),
  duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
  uri: AA,
  "uri-reference":
    /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
  "uri-template":
    /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
  url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
  email:
    /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
  hostname:
    /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
  ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
  ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
  regex: CA,
  uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
  "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
  "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
  "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
  byte: DA,
  int32: { type: "number", validate: LA },
  int64: { type: "number", validate: KA },
  float: { type: "number", validate: L5 },
  double: { type: "number", validate: L5 },
  password: !0,
  binary: !0,
}
function BA($) {
  return $ % 4 === 0 && ($ % 100 !== 0 || $ % 400 === 0)
}
var GA = /^(\d\d\d\d)-(\d\d)-(\d\d)$/,
  NA = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
function j5($) {
  const X = GA.exec($)
  if (!X) return !1
  const Q = +X[1],
    J = +X[2],
    Y = +X[3]
  return J >= 1 && J <= 12 && Y >= 1 && Y <= (J === 2 && BA(Q) ? 29 : NA[J])
}
var wA = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i
function pJ($) {
  return (X) => {
    const Q = wA.exec(X)
    if (!Q) return !1
    const J = +Q[1],
      Y = +Q[2],
      Z = +Q[3],
      W = Q[4],
      q = Q[5] === "-" ? -1 : 1,
      M = +(Q[6] || 0),
      G = +(Q[7] || 0)
    if (M > 23 || G > 59 || ($ && !W)) return !1
    if (J <= 23 && Y <= 59 && Z < 60) return !0
    const B = Y - G * q,
      N = J - M * q - (B < 0 ? 1 : 0)
    return (N === 23 || N === -1) && (B === 59 || B === -1) && Z < 61
  }
}
var ZQ = ($) => ($.charCodeAt($.length - 6) === 32 ? `${$.slice(0, -6)}+${$.slice(-5)}` : $),
  UA = /t|\s/i
function O5($) {
  const X = pJ($)
  return (Q) => {
    const J = Q.split(UA)
    return J.length === 2 && j5(J[0]) && X(J[1])
  }
}
var zA = /\/|:/,
  HA =
    /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i
function AA($) {
  return zA.test($) && HA.test($)
}
var P5 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm
function DA($) {
  return (P5.lastIndex = 0), P5.test($)
}
var OA = -2147483648,
  PA = 2147483647
function LA($) {
  return Number.isInteger($) && $ <= PA && $ >= OA
}
function KA($) {
  return Number.isInteger($)
}
function L5() {
  return !0
}
var SA = /[^\\]\\Z/
function CA($) {
  if (SA.test($)) return !1
  try {
    return new RegExp($), !0
  } catch {
    return !1
  }
}
var K5 =
    /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/,
  S5 =
    /(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2}\sGMT(?:\+|-)\d{4}\s\([^)]+\)/,
  C5 =
    /^(?:(?:(?:(?:0?[1-9]|[12][0-9]|3[01])[/\s-](?:0?[1-9]|1[0-2])[/\s-](?:19|20)\d{2})|(?:(?:19|20)\d{2}[/\s-](?:0?[1-9]|1[0-2])[/\s-](?:0?[1-9]|[12][0-9]|3[01]))))(?:\s(?:1[012]|0?[1-9]):[0-5][0-9](?::[0-5][0-9])?(?:\s[AP]M)?)?$/,
  jA = iJ.date,
  FA = iJ["date-time"]
O0.Has("date") ||
  O0.Set("date", ($) => {
    const X = ZQ($).replace(/"/g, "")
    if (K5.test(X) || S5.test(X) || C5.test(X) || jA(X)) {
      const Q = new Date(X)
      if (!Number.isNaN(Q.getTime())) return !0
    }
    return !1
  }),
  O0.Has("date-time") ||
    O0.Set("date-time", ($) => {
      const X = $.replace(/"/g, "")
      if (K5.test(X) || S5.test(X) || C5.test(X) || FA(X)) {
        const Q = new Date(X)
        if (!Number.isNaN(Q.getTime())) return !0
      }
      return !1
    }),
  Object.entries(iJ).forEach(($) => {
    const [X, Q] = $
    O0.Has(X) ||
      (Q instanceof RegExp ? O0.Set(X, (J) => Q.test(J)) : typeof Q === "function" && O0.Set(X, Q))
  }),
  O0.Has("numeric") || O0.Set("numeric", ($) => !!$ && !Number.isNaN(+$)),
  O0.Has("integer") || O0.Set("integer", ($) => !!$ && Number.isInteger(+$)),
  O0.Has("boolean") || O0.Set("boolean", ($) => $ === "true" || $ === "false"),
  O0.Has("ObjectString") ||
    O0.Set("ObjectString", ($) => {
      let X = $.charCodeAt(0)
      if (
        ((X === 9 || X === 10 || X === 32) && (X = $.trimStart().charCodeAt(0)),
        X !== 123 && X !== 91)
      )
        return !1
      try {
        return JSON.parse($), !0
      } catch {
        return !1
      }
    }),
  O0.Has("ArrayString") ||
    O0.Set("ArrayString", ($) => {
      let X = $.charCodeAt(0)
      if (
        ((X === 9 || X === 10 || X === 32) && (X = $.trimStart().charCodeAt(0)),
        X !== 123 && X !== 91)
      )
        return !1
      try {
        return JSON.parse($), !0
      } catch {
        return !1
      }
    })
var T = Object.assign({}, K2)
Y6(
  "UnionEnum",
  ($, X) => (typeof X === "number" || typeof X === "string" || X === null) && $.enum.includes(X)
),
  Y6("ArrayBuffer", (_$, X) => X instanceof ArrayBuffer)
var RA = Y6("Files", ($, X) => {
    if ($.minItems && $.minItems > 1 && !Array.isArray(X)) return !1
    if (!Array.isArray(X)) return YQ($, X)
    if (($.minItems && X.length < $.minItems) || ($.maxItems && X.length > $.maxItems)) return !1
    for (let Q = 0; Q < X.length; Q++) if (!YQ($, X[Q])) return !1
    return !0
  }),
  VA = Y6("ElysiaForm", ({ compiler: $, ...X }, Q) => {
    if (!(Q instanceof FormData)) return !1
    if ($) {
      if (!(G$ in Q)) throw new a("property", X, Q)
      if (!$.Check(Q[G$])) throw $.Error(Q[G$])
    }
    return !0
  }),
  A1 = {
    String: ($) => K2.String($),
    Numeric: ($) => {
      const X = K2.Number($),
        Q = i2(X)
      return T.Transform(T.Union([T.String({ format: "numeric", default: 0 }), T.Number($)], $))
        .Decode((J) => {
          const Y = +J
          if (Number.isNaN(Y)) return J
          if ($ && !Q.Check(Y)) throw Q.Error(Y)
          return Y
        })
        .Encode((J) => J)
    },
    Integer: ($) => {
      const X = K2.Integer($),
        Q = i2(X)
      return T.Transform(T.Union([T.String({ format: "integer", default: 0 }), K2.Integer($)], $))
        .Decode((J) => {
          const Y = +J
          if (!Q.Check(Y)) throw Q.Error(Y)
          return Y
        })
        .Encode((J) => J)
    },
    Date: ($) => {
      const X = K2.Date($),
        Q = i2(X),
        J = $?.default ? new Date($.default) : void 0
      return T.Transform(
        T.Union(
          [
            K2.Date($),
            T.String({ format: "date-time", default: J?.toISOString() }),
            T.String({ format: "date", default: J?.toISOString() }),
            T.Number({ default: J?.getTime() }),
          ],
          $
        )
      )
        .Decode((Y) => {
          if (typeof Y === "number") {
            const W = new Date(Y)
            if (!Q.Check(W)) throw Q.Error(W)
            return W
          }
          if (Y instanceof Date) return Y
          const Z = new Date(ZQ(Y))
          if (!Z || Number.isNaN(Z.getTime())) throw new a("property", X, Z)
          if (!Q.Check(Z)) throw Q.Error(Z)
          return Z
        })
        .Encode((Y) => {
          if (Y instanceof Date) return Y.toISOString()
          if (typeof Y === "string") {
            if (Number.isNaN(new Date(ZQ(Y)).getTime())) throw new a("property", X, Y)
            return Y
          }
          if (!Q.Check(Y)) throw Q.Error(Y)
          return Y
        })
    },
    BooleanString: ($) => {
      const X = K2.Boolean($),
        Q = i2(X)
      return T.Transform(T.Union([T.Boolean($), T.String({ format: "boolean", default: !1 })], $))
        .Decode((J) => {
          if (typeof J === "string") return J === "true"
          if (J !== void 0 && !Q.Check(J)) throw Q.Error(J)
          return J
        })
        .Encode((J) => J)
    },
    ObjectString: ($, X) => {
      const Q = T.Object($, X),
        J = i2(Q)
      return T.Transform(
        T.Union([T.String({ format: "ObjectString", default: "{}" }), Q], {
          elysiaMeta: "ObjectString",
        })
      )
        .Decode((Y) => {
          if (typeof Y === "string") {
            if (Y.charCodeAt(0) !== 123) throw new a("property", Q, Y)
            if (!J.Check((Y = J6(Y, Q)))) throw J.Error(Y)
            return J.Decode(Y)
          }
          return Y
        })
        .Encode((Y) => {
          let Z
          if ((typeof Y === "string" && (Y = J6((Z = Y), Q)), !J.Check(Y))) throw J.Error(Y)
          return Z ?? JSON.stringify(Y)
        })
    },
    ArrayString: ($ = T.String(), X) => {
      const Q = T.Array($, X),
        J = i2(Q),
        Y = (Z, W = !1) => {
          if (Z.charCodeAt(0) === 91) {
            if (!J.Check((Z = J6(Z, Q)))) throw J.Error(Z)
            return J.Decode(Z)
          }
          if (W) return Z
          throw new a("property", Q, Z)
        }
      return T.Transform(T.Union([T.String({ format: "ArrayString", default: X?.default }), Q]))
        .Decode((Z) => {
          if (Array.isArray(Z)) {
            let W = []
            for (let q = 0; q < Z.length; q++) {
              const M = Z[q]
              if (typeof M === "string") {
                const G = Y(M, !0)
                Array.isArray(G) ? (W = W.concat(G)) : W.push(G)
                continue
              }
              W.push(M)
            }
            return W
          }
          return typeof Z === "string" ? Y(Z) : Z
        })
        .Encode((Z) => {
          let W
          if ((typeof Z === "string" && (Z = J6((W = Z), Q)), !J.Check(Z)))
            throw new a("property", Q, Z)
          return W ?? JSON.stringify(Z)
        })
    },
    ArrayQuery: ($ = T.String(), X) => {
      const Q = T.Array($, X),
        J = i2(Q),
        Y = (Z) => (Z.indexOf(",") !== -1 ? J.Decode(Z.split(",")) : [Z])
      return T.Transform(
        T.Union([T.String({ default: X?.default }), Q], { elysiaMeta: "ArrayQuery" })
      )
        .Decode((Z) => {
          if (Array.isArray(Z)) {
            let W = []
            for (let q = 0; q < Z.length; q++) {
              const M = Z[q]
              if (typeof M === "string") {
                const G = Y(M)
                Array.isArray(G) ? (W = W.concat(G)) : W.push(G)
                continue
              }
              W.push(M)
            }
            return W
          }
          return typeof Z === "string" ? Y(Z) : Z
        })
        .Encode((Z) => {
          let W
          if ((typeof Z === "string" && (Z = J6((W = Z), Q)), !J.Check(Z)))
            throw new a("property", Q, Z)
          return W ?? JSON.stringify(Z)
        })
    },
    File: Y6("File", YQ),
    Files: ($ = {}) =>
      T.Transform(RA($))
        .Decode((X) => (Array.isArray(X) ? X : [X]))
        .Encode((X) => X),
    Nullable: ($, X) => T.Union([$, T.Null()], { ...X, nullable: !0 }),
    MaybeEmpty: ($, X) => T.Union([$, T.Null(), T.Undefined()], X),
    Cookie: (
      $,
      {
        domain: X,
        expires: Q,
        httpOnly: J,
        maxAge: Y,
        path: Z,
        priority: W,
        sameSite: q,
        secure: M,
        secrets: G,
        sign: B,
        ...N
      } = {}
    ) => {
      const P = T.Object($, N)
      return (
        (P.config = {
          domain: X,
          expires: Q,
          httpOnly: J,
          maxAge: Y,
          path: Z,
          priority: W,
          sameSite: q,
          secure: M,
          secrets: G,
          sign: B,
        }),
        P
      )
    },
    UnionEnum: ($, X = {}) => {
      const Q = $.every((J) => typeof J === "string")
        ? { type: "string" }
        : $.every((J) => typeof J === "number")
          ? { type: "number" }
          : $.every((J) => J === null)
            ? { type: "null" }
            : {}
      if ($.some((J) => typeof J === "object" && J !== null))
        throw Error("This type does not support objects or arrays")
      return { default: $[0], ...X, [L]: "UnionEnum", ...Q, enum: $ }
    },
    NoValidate: ($, X = !0) => (($.noValidate = X), $),
    Form: ($, X = {}) => {
      const Q = T.Object($, { default: RJ({}), ...X }),
        J = i2(Q)
      return T.Union([Q, VA({ compiler: J })])
    },
    ArrayBuffer($ = {}) {
      return { default: [1, 2, 3], ...$, [L]: "ArrayBuffer" }
    },
    Uint8Array: ($) => {
      const X = K2.Uint8Array($),
        Q = i2(X)
      return T.Transform(T.Union([T.ArrayBuffer(), K2.Uint8Array($)]))
        .Decode((J) => {
          if (J instanceof ArrayBuffer) {
            if (!Q.Check((J = new Uint8Array(J)))) throw Q.Error(J)
            return J
          }
          return J
        })
        .Encode((J) => J)
    },
  }
;(T.BooleanString = A1.BooleanString),
  (T.ObjectString = A1.ObjectString),
  (T.ArrayString = A1.ArrayString),
  (T.ArrayQuery = A1.ArrayQuery),
  (T.Numeric = A1.Numeric),
  (T.Integer = A1.Integer),
  (T.File = ($) => (
    $?.type && QQ(),
    A1.File({ default: "File", ...$, extension: $?.type, type: "string", format: "binary" })
  )),
  (T.Files = ($) => (
    $?.type && QQ(),
    A1.Files({
      ...$,
      elysiaMeta: "Files",
      default: "Files",
      extension: $?.type,
      type: "array",
      items: { ...$, default: "Files", type: "string", format: "binary" },
    })
  )),
  (T.Nullable = A1.Nullable),
  (T.MaybeEmpty = A1.MaybeEmpty),
  (T.Cookie = A1.Cookie),
  (T.Date = A1.Date),
  (T.UnionEnum = A1.UnionEnum),
  (T.NoValidate = A1.NoValidate),
  (T.Form = A1.Form),
  (T.ArrayBuffer = A1.ArrayBuffer),
  (T.Uint8Array = A1.Uint8Array)
var WQ = P8(_5(), 1),
  x5 = P8(E6(), 1)
class B2 {
  constructor($, X, Q = {}) {
    ;(this.name = $), (this.jar = X), (this.initial = Q)
  }
  get cookie() {
    return this.jar[this.name] ?? this.initial
  }
  set cookie($) {
    this.name in this.jar || (this.jar[this.name] = this.initial), (this.jar[this.name] = $)
  }
  get setCookie() {
    return this.name in this.jar || (this.jar[this.name] = this.initial), this.jar[this.name]
  }
  set setCookie($) {
    this.cookie = $
  }
  get value() {
    return this.cookie.value
  }
  set value($) {
    this.setCookie.value = $
  }
  get expires() {
    return this.cookie.expires
  }
  set expires($) {
    this.setCookie.expires = $
  }
  get maxAge() {
    return this.cookie.maxAge
  }
  set maxAge($) {
    this.setCookie.maxAge = $
  }
  get domain() {
    return this.cookie.domain
  }
  set domain($) {
    this.setCookie.domain = $
  }
  get path() {
    return this.cookie.path
  }
  set path($) {
    this.setCookie.path = $
  }
  get secure() {
    return this.cookie.secure
  }
  set secure($) {
    this.setCookie.secure = $
  }
  get httpOnly() {
    return this.cookie.httpOnly
  }
  set httpOnly($) {
    this.setCookie.httpOnly = $
  }
  get sameSite() {
    return this.cookie.sameSite
  }
  set sameSite($) {
    this.setCookie.sameSite = $
  }
  get priority() {
    return this.cookie.priority
  }
  set priority($) {
    this.setCookie.priority = $
  }
  get partitioned() {
    return this.cookie.partitioned
  }
  set partitioned($) {
    this.setCookie.partitioned = $
  }
  get secrets() {
    return this.cookie.secrets
  }
  set secrets($) {
    this.setCookie.secrets = $
  }
  update($) {
    return (
      (this.setCookie = Object.assign(this.cookie, typeof $ === "function" ? $(this.cookie) : $)),
      this
    )
  }
  set($) {
    return (
      (this.setCookie = Object.assign(
        { ...this.initial, value: this.value },
        typeof $ === "function" ? $(this.cookie) : $
      )),
      this
    )
  }
  remove() {
    if (this.value !== void 0) return this.set({ expires: new Date(0), maxAge: 0, value: "" }), this
  }
  toString() {
    return typeof this.value === "object"
      ? JSON.stringify(this.value)
      : (this.value?.toString() ?? "")
  }
}
var E5 = ($, X, Q) => (
    $.cookie || ($.cookie = {}),
    new Proxy(X, {
      get(_J, Y) {
        return Y in X
          ? new B2(Y, $.cookie, Object.assign({}, Q ?? {}, X[Y]))
          : new B2(Y, $.cookie, Object.assign({}, Q))
      },
    })
  ),
  qQ = async ($, X, { secrets: Q, sign: J, ...Y } = {}) => {
    if (!X) return E5($, {}, Y)
    const Z = typeof Q === "string"
    J && J !== !0 && !Array.isArray(J) && (J = [J])
    const W = {},
      q = WQ.parse(X)
    for (const [M, G] of Object.entries(q)) {
      if (G === void 0) continue
      let B = x5.default(G)
      if (B) {
        const N = B.charCodeAt(0),
          P = B.charCodeAt(B.length - 1)
        if ((N === 123 && P === 125) || (N === 91 && P === 93))
          try {
            B = JSON.parse(B)
          } catch {}
      }
      if (J === !0 || J?.includes(M)) {
        if (!Q) throw Error("No secret is provided to cookie plugin")
        if (Z) {
          const N = await SJ(B, Q)
          if (N === !1) throw new v6(M)
          B = N
        } else {
          let N = !0
          for (let P = 0; P < Q.length; P++) {
            const w = await SJ(B, Q[P])
            if (w !== !1) {
              ;(N = !0), (B = w)
              break
            }
          }
          if (!N) throw new v6(M)
        }
      }
      W[M] = { value: B }
    }
    return E5($, W, Y)
  },
  n6 = ($) => {
    if (!$ || !A0($)) return
    const X = []
    for (const [Q, J] of Object.entries($)) {
      if (!Q || !J) continue
      const Y = J.value
      Y != null && X.push(WQ.serialize(Q, typeof Y === "object" ? JSON.stringify(Y) : `${Y}`, J))
    }
    if (X.length !== 0) return X.length === 1 ? X[0] : X
  }
var b0 = ($, X) => {
    if (!E2 && $ instanceof Promise) return $.then((Z) => b0(Z, X))
    const Q = $.size,
      J = X && (X.status === 206 || X.status === 304 || X.status === 412 || X.status === 416),
      Y = J
        ? { "transfer-encoding": "chunked" }
        : {
            "accept-ranges": "bytes",
            "content-range": Q ? `bytes 0-${Q - 1}/${Q}` : void 0,
            "transfer-encoding": "chunked",
          }
    if (!X && !Q) return new Response($)
    if (!X) return new Response($, { headers: Y })
    if (X.headers instanceof Headers) {
      for (const Z of Object.keys(Y)) Z in X.headers && X.headers.append(Z, Y[Z])
      return (
        J && (X.headers.delete("content-length"), X.headers.delete("accept-ranges")),
        new Response($, X)
      )
    }
    return A0(X.headers)
      ? new Response($, { status: X.status, headers: Object.assign(Y, X.headers) })
      : new Response($, { status: X.status, headers: Y })
  },
  nJ = ($, X) => {
    if (!$) return $
    $.delete("set-cookie")
    for (let Q = 0; Q < X.length; Q++) {
      const J = X[Q].indexOf("=")
      $.append("set-cookie", `${X[Q].slice(0, J)}=${X[Q].slice(J + 1) || ""}`)
    }
    return $
  },
  I5 = ($, X) => {
    if (X?.headers) {
      if ($)
        if (f6) Object.assign(X.headers, $.headers.toJSON())
        else for (const [Q, J] of $.headers.entries()) Q in X.headers && (X.headers[Q] = J)
      return (
        X.status === 200 && (X.status = $.status),
        X.headers["content-encoding"] && delete X.headers["content-encoding"],
        X
      )
    }
    if (!$) return { headers: {}, status: X?.status ?? 200 }
    if (f6)
      return (
        (X = { headers: $.headers.toJSON(), status: X?.status ?? 200 }),
        X.headers["content-encoding"] && delete X.headers["content-encoding"],
        X
      )
    X = { headers: {}, status: X?.status ?? 200 }
    for (const [Q, J] of $.headers.entries())
      Q !== "content-encoding" && Q in X.headers && (X.headers[Q] = J)
    return X
  },
  o6 =
    ({ mapResponse: $, mapCompactResponse: X }) =>
    async (Q, J, Y) => {
      let Z = Q.next?.()
      if ((J && w8(J), Z instanceof Promise && (Z = await Z), Z?.value instanceof ReadableStream))
        Q = Z.value
      else if (Z && (typeof Z?.done > "u" || Z?.done)) return J ? $(Z.value, J, Y) : X(Z.value, Y)
      const W =
          Z?.value?.sse ?? Q?.sse ?? J?.headers["content-type"]?.startsWith("text/event-stream"),
        q = W
          ? (G) => `data: ${G}

`
          : (G) => G,
        M = W
          ? "text/event-stream"
          : Z?.value && typeof Z?.value === "object"
            ? "application/json"
            : "text/plain"
      return (
        J?.headers
          ? (J.headers["transfer-encoding"] || (J.headers["transfer-encoding"] = "chunked"),
            J.headers["content-type"] || (J.headers["content-type"] = M),
            J.headers["cache-control"] || (J.headers["cache-control"] = "no-cache"))
          : (J = {
              status: 200,
              headers: {
                "content-type": M,
                "transfer-encoding": "chunked",
                "cache-control": "no-cache",
                connection: "keep-alive",
              },
            }),
        new Response(
          new ReadableStream({
            async start(G) {
              let B = !1
              if (
                (Y?.signal?.addEventListener("abort", () => {
                  B = !0
                  try {
                    G.close()
                  } catch {}
                }),
                !(!Z || Z.value instanceof ReadableStream))
              ) {
                if (Z.value !== void 0 && Z.value !== null)
                  if (Z.value.toSSE) G.enqueue(Z.value.toSSE())
                  else if (typeof Z.value === "object")
                    try {
                      G.enqueue(q(JSON.stringify(Z.value)))
                    } catch {
                      G.enqueue(q(Z.value.toString()))
                    }
                  else G.enqueue(q(Z.value.toString()))
              }
              try {
                for await (const N of Q) {
                  if (B) break
                  if (N != null)
                    if (N.toSSE) G.enqueue(N.toSSE())
                    else {
                      if (typeof N === "object")
                        try {
                          G.enqueue(q(JSON.stringify(N)))
                        } catch {
                          G.enqueue(q(N.toString()))
                        }
                      else G.enqueue(q(N.toString()))
                      W || (await new Promise((P) => setTimeout(() => P(), 0)))
                    }
                }
              } catch (N) {
                console.warn(N)
              }
              try {
                G.close()
              } catch {}
            },
          }),
          J
        )
      )
    }
async function* T5($) {
  const X = $.body
  if (!X) return
  const Q = X.getReader(),
    J = new TextDecoder()
  try {
    for (;;) {
      const { done: Y, value: Z } = await Q.read()
      if (Y) break
      typeof Z === "string" ? yield Z : yield J.decode(Z)
    }
  } finally {
    Q.releaseLock()
  }
}
var w8 = ($) => {
    if ((typeof $.status === "string" && ($.status = w$[$.status]), $.cookie && A0($.cookie))) {
      const X = n6($.cookie)
      X && ($.headers["set-cookie"] = X)
    }
    $.headers["set-cookie"] &&
      Array.isArray($.headers["set-cookie"]) &&
      ($.headers = nJ(new Headers($.headers), $.headers["set-cookie"]))
  },
  MQ = ($) => {
    const X = o6($)
    return (Q, J, Y) => {
      let Z = !1
      if (J.headers instanceof Headers)
        for (const q of J.headers.keys())
          if (q === "set-cookie") {
            if (Z) continue
            Z = !0
            for (const M of J.headers.getSetCookie()) Q.headers.append("set-cookie", M)
          } else Q.headers.append(q, J.headers?.get(q) ?? "")
      else for (const q in J.headers) Q.headers.append(q, J.headers[q])
      const W = J.status ?? 200
      if (Q.status !== W && W !== 200 && (Q.status <= 300 || Q.status > 400)) {
        const q = new Response(Q.body, { headers: Q.headers, status: J.status })
        return !q.headers.has("content-length") && q.headers.get("transfer-encoding") === "chunked"
          ? X(T5(q), I5(q, J), Y)
          : q
      }
      return !Q.headers.has("content-length") && Q.headers.get("transfer-encoding") === "chunked"
        ? X(T5(Q), I5(Q, J), Y)
        : Q
    }
  }
var BQ = ($, X = { headers: {} }) => {
    const Q = $.path,
      J = OJ[Q.slice(Q.lastIndexOf(".") + 1)]
    return (
      J && (X.headers["content-type"] = J),
      $.stats && X.status !== 206 && X.status !== 304 && X.status !== 412 && X.status !== 416
        ? $.stats.then((Y) => {
            const Z = Y.size
            return (
              Z !== void 0 &&
                ((X.headers["content-range"] = `bytes 0-${Z - 1}/${Z}`),
                (X.headers["content-length"] = Z)),
              b0($.value, X)
            )
          })
        : b0($.value, X)
    )
  },
  I1 = ($, X, Q) => {
    if (A0(X.headers) || X.status !== 200 || X.cookie)
      switch ((w8(X), $?.constructor?.name)) {
        case "String":
          return (X.headers["content-type"] = "text/plain"), new Response($, X)
        case "Array":
        case "Object":
          return (
            (X.headers["content-type"] = "application/json"), new Response(JSON.stringify($), X)
          )
        case "ElysiaFile":
          return BQ($, X)
        case "File":
          return b0($, X)
        case "Blob":
          return b0($, X)
        case "ElysiaCustomStatusResponse":
          return (X.status = $.code), I1($.response, X, Q)
        case void 0:
          return $ ? new Response(JSON.stringify($), X) : new Response("", X)
        case "Response":
          return GQ($, X, Q)
        case "Error":
          return h$($, X)
        case "Promise":
          return $.then((J) => I1(J, X, Q))
        case "Function":
          return I1($(), X, Q)
        case "Number":
        case "Boolean":
          return new Response($.toString(), X)
        case "Cookie":
          return $ instanceof B2 ? new Response($.value, X) : new Response($?.toString(), X)
        case "FormData":
          return new Response($, X)
        default:
          if ($ instanceof Response) return GQ($, X, Q)
          if ($ instanceof Promise) return $.then((J) => I1(J, X))
          if ($ instanceof Error) return h$($, X)
          if ($ instanceof o0) return (X.status = $.code), I1($.response, X, Q)
          if (typeof $?.next === "function" || $ instanceof ReadableStream) return l6($, X, Q)
          if (typeof $?.then === "function") return $.then((J) => I1(J, X))
          if (typeof $?.toResponse === "function") return I1($.toResponse(), X)
          if ("charCodeAt" in $) {
            const J = $.charCodeAt(0)
            if (J === 123 || J === 91)
              return (
                X.headers["Content-Type"] || (X.headers["Content-Type"] = "application/json"),
                new Response(JSON.stringify($), X)
              )
          }
          return new Response($, X)
      }
    return typeof $?.next === "function" || $ instanceof ReadableStream ? l6($, X, Q) : n2($, Q)
  },
  x1 = ($, X, Q) => {
    if ($ != null)
      if (A0(X.headers) || X.status !== 200 || X.cookie)
        switch ((w8(X), $?.constructor?.name)) {
          case "String":
            return (X.headers["content-type"] = "text/plain"), new Response($, X)
          case "Array":
          case "Object":
            return (
              (X.headers["content-type"] = "application/json"), new Response(JSON.stringify($), X)
            )
          case "ElysiaFile":
            return BQ($, X)
          case "File":
            return b0($, X)
          case "Blob":
            return b0($, X)
          case "ElysiaCustomStatusResponse":
            return (X.status = $.code), x1($.response, X, Q)
          case void 0:
            return $ ? new Response(JSON.stringify($), X) : void 0
          case "Response":
            return GQ($, X, Q)
          case "Promise":
            return $.then((J) => x1(J, X))
          case "Error":
            return h$($, X)
          case "Function":
            return x1($(), X)
          case "Number":
          case "Boolean":
            return new Response($.toString(), X)
          case "FormData":
            return new Response($)
          case "Cookie":
            return $ instanceof B2 ? new Response($.value, X) : new Response($?.toString(), X)
          default:
            if ($ instanceof Response) return GQ($, X, Q)
            if ($ instanceof Promise) return $.then((J) => x1(J, X))
            if ($ instanceof Error) return h$($, X)
            if ($ instanceof o0) return (X.status = $.code), x1($.response, X, Q)
            if (typeof $?.next === "function" || $ instanceof ReadableStream) return l6($, X, Q)
            if (typeof $?.then === "function") return $.then((J) => x1(J, X))
            if (typeof $?.toResponse === "function") return x1($.toResponse(), X)
            if ("charCodeAt" in $) {
              const J = $.charCodeAt(0)
              if (J === 123 || J === 91)
                return (
                  X.headers["Content-Type"] || (X.headers["Content-Type"] = "application/json"),
                  new Response(JSON.stringify($), X)
                )
            }
            return new Response($, X)
        }
      else
        switch ($?.constructor?.name) {
          case "String":
            return (X.headers["content-type"] = "text/plain"), new Response($)
          case "Array":
          case "Object":
            return (
              (X.headers["content-type"] = "application/json"), new Response(JSON.stringify($), X)
            )
          case "ElysiaFile":
            return BQ($, X)
          case "File":
            return b0($, X)
          case "Blob":
            return b0($, X)
          case "ElysiaCustomStatusResponse":
            return (X.status = $.code), x1($.response, X, Q)
          case void 0:
            return $
              ? new Response(JSON.stringify($), { headers: { "content-type": "application/json" } })
              : new Response("")
          case "Response":
            return $
          case "Promise":
            return $.then((J) => {
              const Y = x1(J, X)
              if (Y !== void 0) return Y
            })
          case "Error":
            return h$($, X)
          case "Function":
            return n2($(), Q)
          case "Number":
          case "Boolean":
            return new Response($.toString())
          case "Cookie":
            return $ instanceof B2 ? new Response($.value, X) : new Response($?.toString(), X)
          case "FormData":
            return new Response($)
          default:
            if ($ instanceof Response) return $
            if ($ instanceof Promise) return $.then((J) => x1(J, X))
            if ($ instanceof Error) return h$($, X)
            if ($ instanceof o0) return (X.status = $.code), x1($.response, X, Q)
            if (typeof $?.next === "function" || $ instanceof ReadableStream) return l6($, X, Q)
            if (typeof $?.then === "function") return $.then((J) => x1(J, X))
            if (typeof $?.toResponse === "function") return x1($.toResponse(), X)
            if ("charCodeAt" in $) {
              const J = $.charCodeAt(0)
              if (J === 123 || J === 91)
                return (
                  X.headers["Content-Type"] || (X.headers["Content-Type"] = "application/json"),
                  new Response(JSON.stringify($), X)
                )
            }
            return new Response($)
        }
  },
  n2 = ($, X) => {
    switch ($?.constructor?.name) {
      case "String":
        return new Response($, { headers: { "Content-Type": "text/plain" } })
      case "Object":
      case "Array":
        return new Response(JSON.stringify($), { headers: { "Content-Type": "application/json" } })
      case "ElysiaFile":
        return BQ($)
      case "File":
        return b0($)
      case "Blob":
        return b0($)
      case "ElysiaCustomStatusResponse":
        return I1($.response, { status: $.code, headers: {} })
      case void 0:
        return $
          ? new Response(JSON.stringify($), { headers: { "content-type": "application/json" } })
          : new Response("")
      case "Response":
        return $
      case "Error":
        return h$($)
      case "Promise":
        return $.then((Q) => n2(Q, X))
      case "Function":
        return n2($(), X)
      case "Number":
      case "Boolean":
        return new Response($.toString())
      case "FormData":
        return new Response($)
      default:
        if ($ instanceof Response) return $
        if ($ instanceof Promise) return $.then((Q) => n2(Q, X))
        if ($ instanceof Error) return h$($)
        if ($ instanceof o0) return I1($.response, { status: $.code, headers: {} })
        if (typeof $?.next === "function" || $ instanceof ReadableStream) return l6($, void 0, X)
        if (typeof $?.then === "function") return $.then((Q) => I1(Q, set))
        if (typeof $?.toResponse === "function") return n2($.toResponse())
        if ("charCodeAt" in $) {
          const Q = $.charCodeAt(0)
          if (Q === 123 || Q === 91)
            return new Response(JSON.stringify($), {
              headers: { "Content-Type": "application/json" },
            })
        }
        return new Response($)
    }
  },
  h$ = ($, X) =>
    new Response(JSON.stringify({ name: $?.name, message: $?.message, cause: $?.cause }), {
      status: X?.status !== 200 ? (X?.status ?? 500) : 500,
      headers: X?.headers,
    }),
  b5 = ($, X, Q = {}) => {
    if (typeof $ === "function") return
    const J = I1($, { headers: Q })
    if (
      !X.parse?.length &&
      !X.transform?.length &&
      !X.beforeHandle?.length &&
      !X.afterHandle?.length
    )
      return () => J.clone()
  },
  GQ = MQ({ mapResponse: I1, mapCompactResponse: n2 }),
  l6 = o6({ mapResponse: I1, mapCompactResponse: n2 })
var D$ = {
  name: "web-standard",
  isWebStandard: !0,
  handler: {
    mapResponse: I1,
    mapEarlyResponse: x1,
    mapCompactResponse: n2,
    createStaticHandler: b5,
  },
  composeHandler: {
    mapResponseContext: "c.request",
    preferWebstandardHeaders: !0,
    headers: `c.headers={}
for(const [k,v] of c.request.headers.entries())c.headers[k]=v
`,
    parser: {
      json($) {
        return $
          ? `try{c.body=await c.request.json()}catch{}
`
          : `c.body=await c.request.json()
`
      },
      text() {
        return `c.body=await c.request.text()
`
      },
      urlencoded() {
        return `c.body=parseQuery(await c.request.text())
`
      },
      arrayBuffer() {
        return `c.body=await c.request.arrayBuffer()
`
      },
      formData($) {
        let X = `
c.body={}
`
        return (
          $
            ? (X += "let form;try{form=await c.request.formData()}catch{}")
            : (X += `const form=await c.request.formData()
`),
          X +
            `for(const key of form.keys()){if(c.body[key]) continue
const value=form.getAll(key)
if(value.length===1)c.body[key]=value[0]
else c.body[key]=value}`
        )
      },
    },
  },
  async stop($, X) {
    if (!$.server) throw Error("Elysia isn't running. Call `app.listen` to start the server.")
    if ($.server && ($.server.stop(X), ($.server = null), $.event.stop?.length))
      for (let Q = 0; Q < $.event.stop.length; Q++) $.event.stop[Q].fn($)
  },
  composeGeneralHandler: {
    parameters: "r",
    createContext($) {
      let X = "",
        Q = "",
        J = $.setHeaders
      for (const W of Object.keys($.decorator)) X += `,'${W}':decorator['${W}']`
      const Y = $.config.handler?.standardHostname ?? !0,
        Z = !!$.event.trace?.length
      return (
        (Q += `const u=r.url,s=u.indexOf('/',${Y ? 11 : 7}),qi=u.indexOf('?',s+1)
let p
if(qi===-1)p=u.substring(s)
else p=u.substring(s, qi)
`),
        Z &&
          (Q += `const id=randomId()
`),
        (Q += "const c={request:r,store,qi,path:p,url:u,redirect,status,set:{headers:"),
        (Q += Object.keys(J ?? {}).length
          ? "Object.assign({},app.setHeaders)"
          : "Object.create(null)"),
        (Q += ",status:200}"),
        $.inference.server && (Q += ",get server(){return app.getServer()}"),
        Z && (Q += ",[ELYSIA_REQUEST_ID]:id"),
        (Q += X),
        (Q += `}
`),
        Q
      )
    },
    error404($, X, Q = "") {
      let J =
        "if(route===null){" +
        Q +
        `
return `
      return (
        X
          ? (J += `app.handleError(c,notFound,false,${this.parameters})`)
          : (J += $
              ? "new Response(error404Message,{status:c.set.status===200?404:c.set.status,headers:c.set.headers})"
              : "error404.clone()"),
        (J += "}"),
        {
          declare: X
            ? ""
            : `const error404Message=notFound.message.toString()
const error404=new Response(error404Message,{status:404})
`,
          code: J,
        }
      )
    },
  },
  composeError: {
    mapResponseContext: "",
    validationError:
      "return new Response(error.message,{headers:Object.assign({'content-type':'application/json'},set.headers),status:set.status})",
    unknownError:
      "return new Response(error.message,{headers:set.headers,status:error.status??set.status??500})",
  },
  listen() {
    return () => {
      throw Error(
        "WebStandard does not support listen, you might want to export default Elysia.fetch instead"
      )
    }
  },
}
function k5() {
  try {
    if ((typeof caches < "u" && typeof caches.default < "u") || typeof WebSocketPair < "u")
      return !0
  } catch {
    return !1
  }
  return !1
}
var _T = {
  ...D$,
  name: "cloudflare-worker",
  composeGeneralHandler: {
    ...D$.composeGeneralHandler,
    error404($, X, Q) {
      const { code: J } = D$.composeGeneralHandler.error404($, X, Q)
      return {
        code: J,
        declare: X
          ? ""
          : `const error404Message=notFound.message.toString()
const error404={clone:()=>new Response(error404Message,{status:404})}
`,
      }
    },
  },
  beforeCompile($) {
    for (const X of $.routes) X.compile()
  },
  listen($) {
    return (_X, _Q) => {
      console.warn(
        "Cloudflare Worker does not support listen method. Please export default Elysia instance instead."
      ),
        $.compile()
    }
  },
}
var hA = ($) => {
    $.startsWith("async") && ($ = $.slice(5)), ($ = $.trimStart())
    let X = -1
    if ($.charCodeAt(0) === 40 && ((X = $.indexOf("=>", $.indexOf(")"))), X !== -1)) {
      let Y = X
      for (; Y > 0 && $.charCodeAt(--Y) !== 41; );
      let Z = $.slice(X + 2)
      return (
        Z.charCodeAt(0) === 32 && (Z = Z.trimStart()),
        [$.slice(1, Y), Z, { isArrowReturn: Z.charCodeAt(0) !== 123 }]
      )
    }
    if (/^(\w+)=>/g.test($) && ((X = $.indexOf("=>")), X !== -1)) {
      let Y = $.slice(X + 2)
      return (
        Y.charCodeAt(0) === 32 && (Y = Y.trimStart()),
        [$.slice(0, X), Y, { isArrowReturn: Y.charCodeAt(0) !== 123 }]
      )
    }
    if ($.startsWith("function")) {
      X = $.indexOf("(")
      const Y = $.indexOf(")")
      return [$.slice(X + 1, Y), $.slice(Y + 2), { isArrowReturn: !1 }]
    }
    const Q = $.indexOf("(")
    if (Q !== -1) {
      const Y = $.indexOf(
          `
`,
          2
        ),
        Z = $.slice(0, Y),
        W = Z.lastIndexOf(")") + 1,
        q = $.slice(Y + 1)
      return [Z.slice(Q, W), `{${q}`, { isArrowReturn: !1 }]
    }
    const J = $.split(
      `
`,
      2
    )
    return [J[0], J[1], { isArrowReturn: !1 }]
  },
  mA = ($) => {
    const X = $.indexOf("{")
    if (X === -1) return [-1, 0]
    let Q = X + 1,
      J = 1
    for (; Q < $.length; Q++) {
      const Y = $.charCodeAt(Q)
      if ((Y === 123 ? J++ : Y === 125 && J--, J === 0)) break
    }
    return J !== 0 ? [0, $.length] : [X, Q + 1]
  },
  uA = ($) => {
    const X = $.lastIndexOf("}")
    if (X === -1) return [-1, 0]
    let Q = X - 1,
      J = 1
    for (; Q >= 0; Q--) {
      const Y = $.charCodeAt(Q)
      if ((Y === 125 ? J++ : Y === 123 && J--, J === 0)) break
    }
    return J !== 0 ? [-1, 0] : [Q, X + 1]
  },
  f5 = ($) => {
    for (;;) {
      const X = $.indexOf(":")
      if (X === -1) break
      let Q = $.indexOf(",", X)
      Q === -1 && (Q = $.indexOf("}", X) - 1),
        Q === -2 && (Q = $.length),
        ($ = $.slice(0, X) + $.slice(Q))
    }
    return $
  },
  y5 = ($) => {
    let X = !1
    $.charCodeAt(0) === 40 && ($ = $.slice(1, -1)),
      $.charCodeAt(0) === 123 && ((X = !0), ($ = $.slice(1, -1))),
      ($ = $.replace(/( |\t|\n)/g, "").trim())
    let Q = []
    for (;;) {
      let [Y, Z] = mA($)
      if (Y === -1) break
      Q.push($.slice(0, Y - 1)), $.charCodeAt(Z) === 44 && Z++, ($ = $.slice(Z))
    }
    ;($ = f5($)), $ && (Q = Q.concat($.split(",")))
    const J = Object.create(null)
    for (const Y of Q) {
      if (Y.indexOf(",") === -1) {
        J[Y] = !0
        continue
      }
      for (const Z of Y.split(",")) J[Z.trim()] = !0
    }
    return { hasParenthesis: X, parameters: J }
  },
  cA = ($, X) => {
    const { parameters: Q, hasParenthesis: J } = y5($)
    return (
      Q.query && (X.query = !0),
      Q.headers && (X.headers = !0),
      Q.body && (X.body = !0),
      Q.cookie && (X.cookie = !0),
      Q.set && (X.set = !0),
      Q.server && (X.server = !0),
      Q.route && (X.route = !0),
      Q.url && (X.url = !0),
      Q.path && (X.path = !0),
      J ? `{ ${Object.keys(Q).join(", ")} }` : Object.keys(Q).join(", ")
    )
  },
  g5 = ($, X, Q) => {
    const J = new RegExp(`${$.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\n\\t,; ]`)
    Q !== void 0 && (J.lastIndex = Q)
    const Y = J.exec(X)
    return Y ? Y.index : -1
  }
var v5 = ($, X, Q = 0) => {
    if (Q > 5) return []
    let J = [],
      Y = X
    for (;;) {
      let Z = g5(` = ${$}`, Y)
      if ((Z === -1 && (Z = g5(`=${$}`, Y)), Z === -1)) {
        let G = Y.indexOf(` = ${$}`)
        if ((G === -1 && (G = Y.indexOf(`=${$}`)), G + 3 + $.length !== Y.length)) break
        Z = G
      }
      let W = Y.slice(0, Z),
        q = W.lastIndexOf(" "),
        M = W.slice(q !== -1 ? q + 1 : -1)
      if (M === "}") {
        const [G, B] = uA(W)
        J.push(f5(Y.slice(G, B))), (Y = Y.slice(Z + 3 + $.length))
        continue
      }
      for (; M.charCodeAt(0) === 44; ) M = M.slice(1)
      for (; M.charCodeAt(0) === 9; ) M = M.slice(1)
      M.includes("(") || J.push(M), (Y = Y.slice(Z + 3 + $.length))
    }
    for (const Z of J) {
      if (Z.charCodeAt(0) === 123) continue
      const W = v5(Z, X)
      W.length > 0 && J.push(...W)
    }
    return J
  },
  pA = ($) => {
    if (!$) return
    if ($.charCodeAt(0) !== 123) return $
    if ((($ = $.slice(2, -2)), !$.includes(",")))
      return $.indexOf("...") !== -1 ? $.slice($.indexOf("...") + 3) : void 0
    const X = $.indexOf("...")
    if (X !== -1) return $.slice(X + 3).trimEnd()
  },
  iA = ($, X, Q) => {
    const J = (Y, Z) => new RegExp(`${Z}\\.(${Y})|${Z}\\["${Y}"\\]|${Z}\\['${Y}'\\]`).test($)
    for (const Y of X)
      if (Y) {
        if (Y.charCodeAt(0) === 123) {
          const Z = y5(Y).parameters
          Z.query && (Q.query = !0),
            Z.headers && (Q.headers = !0),
            Z.body && (Q.body = !0),
            Z.cookie && (Q.cookie = !0),
            Z.set && (Q.set = !0),
            Z.server && (Q.server = !0),
            Z.url && (Q.url = !0),
            Z.route && (Q.route = !0),
            Z.path && (Q.path = !0)
          continue
        }
        if (
          (!Q.query &&
            (J("query", Y) || $.includes(`return ${Y}`) || $.includes(`return ${Y}.query`)) &&
            (Q.query = !0),
          !Q.headers && J("headers", Y) && (Q.headers = !0),
          !Q.body && J("body", Y) && (Q.body = !0),
          !Q.cookie && J("cookie", Y) && (Q.cookie = !0),
          !Q.set && J("set", Y) && (Q.set = !0),
          !Q.server && J("server", Y) && (Q.server = !0),
          !Q.route && J("route", Y) && (Q.route = !0),
          !Q.url && J("url", Y) && (Q.url = !0),
          !Q.path && J("path", Y) && (Q.path = !0),
          Q.query &&
            Q.headers &&
            Q.body &&
            Q.cookie &&
            Q.set &&
            Q.server &&
            Q.route &&
            Q.url &&
            Q.path)
        )
          break
      }
    return X
  }
var nA = ($, X, Q) => {
    try {
      const J = new RegExp(`\\w\\((.*?)?${$}`, "gs")
      J.test(X)
      const Y = X.charCodeAt(J.lastIndex)
      return Y === 41 || Y === 44
        ? ((Q.query = !0),
          (Q.headers = !0),
          (Q.body = !0),
          (Q.cookie = !0),
          (Q.set = !0),
          (Q.server = !0),
          (Q.url = !0),
          (Q.route = !0),
          (Q.path = !0),
          !0)
        : !1
    } catch {
      return (
        console.log(
          "[Sucrose] warning: unexpected isContextPassToFunction error, you may continue development as usual but please report the following to maintainers:"
        ),
        console.log("--- body ---"),
        console.log(X),
        console.log("--- context ---"),
        console.log($),
        !0
      )
    }
  },
  NQ,
  wQ = {},
  oA = ($) => {
    $ === null ||
      k5() ||
      ($ === void 0 && ($ = 295000),
      NQ && clearTimeout(NQ),
      (NQ = setTimeout(() => {
        ;(wQ = {}), (NQ = void 0), E2 && Bun.gc(!1)
      }, $)))
  },
  UQ = ($, X) => ({
    body: $.body || X.body,
    cookie: $.cookie || X.cookie,
    headers: $.headers || X.headers,
    query: $.query || X.query,
    set: $.set || X.set,
    server: $.server || X.server,
    url: $.url || X.url,
    route: $.route || X.route,
    path: $.path || X.path,
  }),
  U8 = (
    $,
    X = {
      query: !1,
      headers: !1,
      body: !1,
      cookie: !1,
      set: !1,
      server: !1,
      url: !1,
      route: !1,
      path: !1,
    },
    Q = {}
  ) => {
    const J = []
    $.request?.length && J.push(...$.request),
      $.beforeHandle?.length && J.push(...$.beforeHandle),
      $.parse?.length && J.push(...$.parse),
      $.error?.length && J.push(...$.error),
      $.transform?.length && J.push(...$.transform),
      $.afterHandle?.length && J.push(...$.afterHandle),
      $.mapResponse?.length && J.push(...$.mapResponse),
      $.afterResponse?.length && J.push(...$.afterResponse),
      $.handler && typeof $.handler === "function" && J.push($.handler)
    for (let Y = 0; Y < J.length; Y++) {
      const Z = J[Y]
      if (!Z) continue
      const W = typeof Z === "object" ? Z.fn : Z
      if (typeof W !== "function") continue
      const q = W.toString(),
        M = v$(q),
        G = wQ[M]
      if (G) {
        X = UQ(X, G)
        continue
      }
      oA(Q.gcTime)
      const B = {
          query: !1,
          headers: !1,
          body: !1,
          cookie: !1,
          set: !1,
          server: !1,
          url: !1,
          route: !1,
          path: !1,
        },
        [N, P] = hA(q),
        w = cA(N, B),
        H = pA(w)
      if (H) {
        const A = v5(H, P.slice(1, -1))
        A.splice(0, -1, H)
        let S = P
        S.charCodeAt(0) === 123 && S.charCodeAt(P.length - 1) === 125 && (S = S.slice(1, -1)),
          nA(H, S, B) || iA(S, A, B),
          !B.query && S.includes(`return ${H}.query`) && (B.query = !0)
      }
      if (
        (wQ[M] || (wQ[M] = B),
        (X = UQ(X, B)),
        X.query &&
          X.headers &&
          X.body &&
          X.cookie &&
          X.set &&
          X.server &&
          X.url &&
          X.route &&
          X.path)
      )
        break
    }
    return X
  }
var O1 = ($, X, Q) => {
    if (A0(X.headers) || X.status !== 200 || X.cookie)
      switch ((w8(X), $?.constructor?.name)) {
        case "String":
          return new Response($, X)
        case "Array":
        case "Object":
          return (
            (X.headers["content-type"] = "application/json"), new Response(JSON.stringify($), X)
          )
        case "ElysiaFile":
          return b0($.value, X)
        case "File":
          return b0($, X)
        case "Blob":
          return b0($, X)
        case "ElysiaCustomStatusResponse":
          return (X.status = $.code), O1($.response, X, Q)
        case void 0:
          return $ ? new Response(JSON.stringify($), X) : new Response("", X)
        case "Response":
          return zQ($, X, Q)
        case "Error":
          return m$($, X)
        case "Promise":
          return $.then((J) => O1(J, X, Q))
        case "Function":
          return O1($(), X, Q)
        case "Number":
        case "Boolean":
          return new Response($.toString(), X)
        case "Cookie":
          return $ instanceof B2 ? new Response($.value, X) : new Response($?.toString(), X)
        case "FormData":
          return new Response($, X)
        default:
          if ($ instanceof Response) return zQ($, X, Q)
          if ($ instanceof Promise) return $.then((J) => O1(J, X))
          if ($ instanceof Error) return m$($, X)
          if ($ instanceof o0) return (X.status = $.code), O1($.response, X, Q)
          if (typeof $?.next === "function" || $ instanceof ReadableStream) return t6($, X, Q)
          if (typeof $?.then === "function") return $.then((J) => O1(J, X))
          if (typeof $?.toResponse === "function") return O1($.toResponse(), X)
          if ("charCodeAt" in $) {
            const J = $.charCodeAt(0)
            if (J === 123 || J === 91)
              return (
                X.headers["Content-Type"] || (X.headers["Content-Type"] = "application/json"),
                new Response(JSON.stringify($), X)
              )
          }
          return new Response($, X)
      }
    return typeof $?.next === "function" || $ instanceof ReadableStream ? t6($, X, Q) : o2($, Q)
  },
  D1 = ($, X, Q) => {
    if ($ != null)
      if (A0(X.headers) || X.status !== 200 || X.cookie)
        switch ((w8(X), $?.constructor?.name)) {
          case "String":
            return new Response($, X)
          case "Array":
          case "Object":
            return (
              (X.headers["content-type"] = "application/json"), new Response(JSON.stringify($), X)
            )
          case "ElysiaFile":
            return b0($.value, X)
          case "File":
            return b0($, X)
          case "Blob":
            return b0($, X)
          case "ElysiaCustomStatusResponse":
            return (X.status = $.code), D1($.response, X, Q)
          case void 0:
            return $ ? new Response(JSON.stringify($), X) : void 0
          case "Response":
            return zQ($, X, Q)
          case "Promise":
            return $.then((J) => D1(J, X))
          case "Error":
            return m$($, X)
          case "Function":
            return D1($(), X)
          case "Number":
          case "Boolean":
            return new Response($.toString(), X)
          case "FormData":
            return new Response($)
          case "Cookie":
            return $ instanceof B2 ? new Response($.value, X) : new Response($?.toString(), X)
          default:
            if ($ instanceof Response) return zQ($, X, Q)
            if ($ instanceof Promise) return $.then((J) => D1(J, X))
            if ($ instanceof Error) return m$($, X)
            if ($ instanceof o0) return (X.status = $.code), D1($.response, X, Q)
            if (typeof $?.next === "function" || $ instanceof ReadableStream) return t6($, X, Q)
            if (typeof $?.then === "function") return $.then((J) => D1(J, X))
            if (typeof $?.toResponse === "function") return D1($.toResponse(), X)
            if ("charCodeAt" in $) {
              const J = $.charCodeAt(0)
              if (J === 123 || J === 91)
                return (
                  X.headers["Content-Type"] || (X.headers["Content-Type"] = "application/json"),
                  new Response(JSON.stringify($), X)
                )
            }
            return new Response($, X)
        }
      else
        switch ($?.constructor?.name) {
          case "String":
            return new Response($)
          case "Array":
          case "Object":
            return (
              (X.headers["content-type"] = "application/json"), new Response(JSON.stringify($), X)
            )
          case "ElysiaFile":
            return b0($.value, X)
          case "File":
            return b0($, X)
          case "Blob":
            return b0($, X)
          case "ElysiaCustomStatusResponse":
            return (X.status = $.code), D1($.response, X, Q)
          case void 0:
            return $
              ? new Response(JSON.stringify($), { headers: { "content-type": "application/json" } })
              : new Response("")
          case "Response":
            return $
          case "Promise":
            return $.then((J) => {
              const Y = D1(J, X)
              if (Y !== void 0) return Y
            })
          case "Error":
            return m$($, X)
          case "Function":
            return o2($(), Q)
          case "Number":
          case "Boolean":
            return new Response($.toString())
          case "Cookie":
            return $ instanceof B2 ? new Response($.value, X) : new Response($?.toString(), X)
          case "FormData":
            return new Response($)
          default:
            if ($ instanceof Response) return $
            if ($ instanceof Promise) return $.then((J) => D1(J, X))
            if ($ instanceof Error) return m$($, X)
            if ($ instanceof o0) return (X.status = $.code), D1($.response, X, Q)
            if (typeof $?.next === "function" || $ instanceof ReadableStream) return t6($, X, Q)
            if (typeof $?.then === "function") return $.then((J) => D1(J, X))
            if (typeof $?.toResponse === "function") return D1($.toResponse(), X)
            if ("charCodeAt" in $) {
              const J = $.charCodeAt(0)
              if (J === 123 || J === 91)
                return (
                  X.headers["Content-Type"] || (X.headers["Content-Type"] = "application/json"),
                  new Response(JSON.stringify($), X)
                )
            }
            return new Response($)
        }
  },
  o2 = ($, X) => {
    switch ($?.constructor?.name) {
      case "String":
        return new Response($)
      case "Object":
      case "Array":
        return new Response(JSON.stringify($), { headers: { "Content-Type": "application/json" } })
      case "ElysiaFile":
        return b0($.value)
      case "File":
        return b0($)
      case "Blob":
        return b0($)
      case "ElysiaCustomStatusResponse":
        return O1($.response, { status: $.code, headers: {} })
      case void 0:
        return $
          ? new Response(JSON.stringify($), { headers: { "content-type": "application/json" } })
          : new Response("")
      case "Response":
        return $
      case "Error":
        return m$($)
      case "Promise":
        return $.then((Q) => o2(Q, X))
      case "Function":
        return o2($(), X)
      case "Number":
      case "Boolean":
        return new Response($.toString())
      case "FormData":
        return new Response($)
      default:
        if ($ instanceof Response) return $
        if ($ instanceof Promise) return $.then((Q) => o2(Q, X))
        if ($ instanceof Error) return m$($)
        if ($ instanceof o0) return O1($.response, { status: $.code, headers: {} })
        if (typeof $?.next === "function" || $ instanceof ReadableStream) return t6($, void 0, X)
        if (typeof $?.then === "function") return $.then((Q) => O1(Q, set))
        if (typeof $?.toResponse === "function") return o2($.toResponse())
        if ("charCodeAt" in $) {
          const Q = $.charCodeAt(0)
          if (Q === 123 || Q === 91)
            return new Response(JSON.stringify($), {
              headers: { "Content-Type": "application/json" },
            })
        }
        return new Response($)
    }
  },
  m$ = ($, X) =>
    new Response(JSON.stringify({ name: $?.name, message: $?.message, cause: $?.cause }), {
      status: X?.status !== 200 ? (X?.status ?? 500) : 500,
      headers: X?.headers,
    }),
  d5 = ($, X, Q = {}) => {
    if (typeof $ === "function") return
    const J = O1($, { headers: Q })
    if (
      !X.parse?.length &&
      !X.transform?.length &&
      !X.beforeHandle?.length &&
      !X.afterHandle?.length
    )
      return () => J.clone()
  },
  zQ = MQ({ mapResponse: O1, mapCompactResponse: o2 }),
  t6 = o6({ mapResponse: O1, mapCompactResponse: o2 })
var l5 = P8(E6(), 1)
var z8 = P8(E6(), 1),
  Z6 = 1,
  W6 = 2,
  q6 = 4,
  O$ = 8
function oJ($, X = 0, Q, J) {
  let Y = Object.create(null),
    Z = 0,
    W = $.length,
    q = X - 1,
    M = q
  for (let B = 0; B < W; B++)
    switch ($.charCodeAt(B)) {
      case 38:
        G($, B), (q = B), (M = B), (Z = 0)
        break
      case 61:
        M <= q ? (M = B) : (Z |= O$)
        break
      case 43:
        M > q ? (Z |= q6) : (Z |= Z6)
        break
      case 37:
        M > q ? (Z |= O$) : (Z |= W6)
        break
    }
  return q < W && G($, W), Y
  function G(B, N) {
    const P = M > q,
      w = P ? M : N,
      H = B.slice(q + 1, w)
    if (!P && H.length === 0) return
    let A = H
    Z & Z6 && (A = A.replace(/\+/g, " ")), Z & W6 && (A = z8.default(A) || A)
    let S = ""
    if (P) {
      let K = B.slice(M + 1, N)
      Z & q6 && (K = K.replace(/\+/g, " ")), Z & O$ && (K = z8.default(K) || K), (S = K)
    }
    const j = Y[A]
    Q?.[A]
      ? S.charCodeAt(0) === 91
        ? (J?.[A] ? (S = JSON.parse(S)) : (S = S.slice(1, -1).split(",")),
          j === void 0
            ? (Y[A] = S)
            : Array.isArray(j)
              ? j.push(...S)
              : ((Y[A] = S), Y[A].unshift(j)))
        : j === void 0
          ? (Y[A] = S)
          : Array.isArray(j)
            ? j.push(S)
            : (Y[A] = [j, S])
      : (Y[A] = S)
  }
}
function h5($, X = 0) {
  let Q = Object.create(null),
    J = 0,
    Y = $.length,
    Z = X - 1,
    W = Z
  for (let M = 0; M < Y; M++)
    switch ($.charCodeAt(M)) {
      case 38:
        q($, M), (Z = M), (W = M), (J = 0)
        break
      case 61:
        W <= Z ? (W = M) : (J |= O$)
        break
      case 43:
        W > Z ? (J |= q6) : (J |= Z6)
        break
      case 37:
        W > Z ? (J |= O$) : (J |= W6)
        break
    }
  return Z < Y && q($, Y), Q
  function q(M, G) {
    const B = W > Z,
      N = B ? W : G,
      P = M.slice(Z + 1, N)
    if (!B && P.length === 0) return
    let w = P
    J & Z6 && (w = w.replace(/\+/g, " ")), J & W6 && (w = z8.default(w) || w)
    let H = ""
    if (B) {
      let S = M.slice(W + 1, G)
      J & q6 && (S = S.replace(/\+/g, " ")), J & O$ && (S = z8.default(S) || S), (H = S)
    }
    const A = Q[w]
    if (H.charCodeAt(0) === 91 && H.charCodeAt(H.length - 1) === 93) {
      try {
        H = JSON.parse(H)
      } catch {}
      A === void 0 ? (Q[w] = H) : Array.isArray(A) ? A.push(H) : (Q[w] = [A, H])
    } else if (H.charCodeAt(0) === 123 && H.charCodeAt(H.length - 1) === 125) {
      try {
        H = JSON.parse(H)
      } catch {}
      A === void 0 ? (Q[w] = H) : Array.isArray(A) ? A.push(H) : (Q[w] = [A, H])
    } else
      H.includes(",") && (H = H.split(",")),
        A === void 0 ? (Q[w] = H) : Array.isArray(A) ? A.push(H) : (Q[w] = [A, H])
  }
}
function u$($) {
  let X = Object.create(null),
    Q = 0,
    J = $.length,
    Y = -1,
    Z = -1
  for (let q = 0; q < J; q++)
    switch ($.charCodeAt(q)) {
      case 38:
        W($, q), (Y = q), (Z = q), (Q = 0)
        break
      case 61:
        Z <= Y ? (Z = q) : (Q |= O$)
        break
      case 43:
        Z > Y ? (Q |= q6) : (Q |= Z6)
        break
      case 37:
        Z > Y ? (Q |= O$) : (Q |= W6)
        break
    }
  return Y < J && W($, J), X
  function W(q, M) {
    const G = Z > Y,
      B = G ? Z : M,
      N = q.slice(Y + 1, B)
    if (!G && N.length === 0) return
    let P = N
    Q & Z6 && (P = P.replace(/\+/g, " ")), Q & W6 && (P = z8.default(P) || P)
    let w = ""
    if (G) {
      let A = q.slice(Z + 1, M)
      Q & q6 && (A = A.replace(/\+/g, " ")), Q & O$ && (A = z8.default(A) || A), (w = A)
    }
    const H = X[P]
    H === void 0 ? (X[P] = w) : Array.isArray(H) ? H.push(w) : (X[P] = [H, w])
  }
}
var H8 = Symbol("ElysiaTrace"),
  P$ = () => {
    const { promise: $, resolve: X } = Promise.withResolvers(),
      { promise: Q, resolve: J } = Promise.withResolvers(),
      { promise: Y, resolve: Z } = Promise.withResolvers(),
      W = [],
      q = []
    return [
      (M) => (M && W.push(M), $),
      (M) => {
        let G = [],
          B = [],
          N = null
        for (let w = 0; w < (M.total ?? 0); w++) {
          const { promise: H, resolve: A } = Promise.withResolvers(),
            { promise: S, resolve: j } = Promise.withResolvers(),
            { promise: K, resolve: y } = Promise.withResolvers(),
            o = [],
            n = []
          G.push((f) => (f && o.push(f), H)),
            B.push((f) => {
              const I = {
                ...f,
                end: S,
                error: K,
                index: w,
                onStop(k) {
                  return k && n.push(k), S
                },
              }
              A(I)
              for (let k = 0; k < o.length; k++) o[k](I)
              return (k = null) => {
                const b = performance.now()
                k && (N = k)
                const _ = {
                  end: b,
                  error: k,
                  get elapsed() {
                    return b - f.begin
                  },
                }
                for (let V = 0; V < n.length; V++) n[V](_)
                j(b), y(k)
              }
            })
        }
        const P = {
          ...M,
          end: Q,
          error: Y,
          onEvent(w) {
            for (let H = 0; H < G.length; H++) G[H](w)
          },
          onStop(w) {
            return w && q.push(w), Q
          },
        }
        X(P)
        for (let w = 0; w < W.length; w++) W[w](P)
        return {
          resolveChild: B,
          resolve(w = null) {
            const H = performance.now()
            !w && N && (w = N)
            const A = {
              end: H,
              error: w,
              get elapsed() {
                return H - M.begin
              },
            }
            for (let S = 0; S < q.length; S++) q[S](A)
            J(H), Z(w)
          },
        }
      },
    ]
  },
  m5 = ($) => (X) => {
    const [Q, J] = P$(),
      [Y, Z] = P$(),
      [W, q] = P$(),
      [M, G] = P$(),
      [B, N] = P$(),
      [P, w] = P$(),
      [H, A] = P$(),
      [S, j] = P$(),
      [K, y] = P$()
    return (
      $({
        id: X[z$],
        context: X,
        set: X.set,
        onRequest: Q,
        onParse: Y,
        onTransform: W,
        onBeforeHandle: M,
        onHandle: B,
        onAfterHandle: P,
        onMapResponse: S,
        onAfterResponse: K,
        onError: H,
        time: Date.now(),
        store: X.store,
      }),
      {
        request: J,
        parse: Z,
        transform: q,
        beforeHandle: G,
        handle: N,
        afterHandle: w,
        error: A,
        mapResponse: j,
        afterResponse: y,
      }
    )
  }
var d1 = Symbol.for("TypeBox.Kind"),
  lA = Symbol.for("TypeBox.Hint"),
  c5 = ($) => /( |-|\t|\n|\.)/.test($) || !Number.isNaN(+$[0]),
  p5 = ($, X, Q = !1) => {
    if (typeof X === "number") return `${$}[${X}]`
    if (c5(X)) return `${$}${Q ? "?." : ""}["${X}"]`
    return `${$}${Q ? "?" : ""}.${X}`
  },
  tA = ($) => (c5($) ? `"${$}"` : $),
  u5 = ($, X = 0, Q) => {
    if (Q.type !== "string" || Q.const || Q.trusted) return $
    let J = ""
    for (let Y = X - 1; Y >= 0; Y--) J += `d.h${Y}(`
    return J + $ + ")".repeat(X)
  },
  i5 = ($) => {
    if (!$.allOf || (d1 in $ && ($[d1] !== "Intersect" || $.type !== "object"))) return $
    const { allOf: X, ...Q } = $
    if (((Q.properties = {}), d1 in Q)) Q[d1] = "Object"
    for (const J of X) {
      if (J.type !== "object") continue
      const { properties: Y, required: Z, type: W, [d1]: q, ...M } = J
      if (Z) Q.required = Q.required ? Q.required.concat(Z) : Z
      Object.assign(Q, M)
      for (const G in J.properties) Q.properties[G] = i5(J.properties[G])
    }
    return Q
  },
  sA = ($, X, Q) => {
    const J =
      $.patternProperties["^(.*)$"] ?? $.patternProperties[Object.keys($.patternProperties)[0]]
    if (!J) return X
    const Y = Q.array
    Q.array++
    let Z = `(()=>{const ar${Y}s=Object.keys(${X}),ar${Y}v={};for(let i=0;i<ar${Y}s.length;i++){const ar${Y}p=${X}[ar${Y}s[i]];ar${Y}v[ar${Y}s[i]]=${L$(J, `ar${Y}p`, Q)}`,
      W = Q.optionalsInArray[Y + 1]
    if (W)
      for (let q = 0; q < W.length; q++) {
        const M = `ar${Y}v[ar${Y}s[i]].${W[q]}`
        Z += `;if(${M}===undefined)delete ${M}`
      }
    return (Z += `}return ar${Y}v})()`), Z
  },
  rA = ($, X, Q) => {
    const J = Q.array
    Q.array++
    let Y = X === "v" && !Q.unions.length,
      Z = ""
    if (!Y) Z = "(()=>{"
    Z += `const ar${J}v=[`
    for (let W = 0; W < $.length; W++) {
      if (W !== 0) Z += ","
      Z += L$($[W], p5(X, W, Q.parentIsOptional), Q)
    }
    if (((Z += "];"), !Y)) Z += `return ar${J}v})()`
    return Z
  }
function HQ($, X = new WeakMap()) {
  if ($ === null || typeof $ !== "object" || typeof $ === "function") return $
  if (X.has($)) return X.get($)
  if (Array.isArray($)) {
    const Q = Array($.length)
    X.set($, Q)
    for (let J = 0; J < $.length; J++) Q[J] = HQ($[J], X)
    return Q
  }
  if (typeof $ === "object") {
    const Q = Object.keys($).concat(Object.getOwnPropertySymbols($)),
      J = {}
    for (const Y of Q) J[Y] = HQ($[Y], X)
    return J
  }
  return $
}
var aA = ($, X, Q) => {
    if (Q.TypeCompiler === void 0) {
      if (!Q.typeCompilerWanred)
        console.warn(Error("[exact-mirror] TypeBox's TypeCompiler is required to use Union")),
          (Q.typeCompilerWanred = !0)
      return X
    }
    Q.unionKeys[X] = 1
    let J = Q.unions.length,
      Y = (Q.unions[J] = []),
      Z = `(()=>{
`,
      W = (q) => {
        if (!(d1 in q) || !q.$ref) return q
        if (q[d1] === "This") return HQ(Q.definitions[q.$ref])
        else if (q[d1] === "Ref")
          if (!Q.modules)
            console.warn(
              Error("[exact-mirror] modules is required when using nested cyclic reference")
            )
          else return Q.modules.Import(q.$ref)
        return q
      }
    for (let q = 0; q < $.length; q++) {
      const M = W($[q])
      if (Array.isArray(M.anyOf))
        for (let G = 0; G < M.anyOf.length; G++) M.anyOf[G] = W(M.anyOf[G])
      else if (M.items)
        if (Array.isArray(M.items))
          for (let G = 0; G < M.items.length; G++) M.items[G] = W(M.items[G])
        else M.items = W(M.items)
      Y.push(_2.Compile(M)),
        (Z += `if(d.unions[${J}][${q}].Check(${X})){return ${L$(M, X, { ...Q, recursion: Q.recursion + 1, parentIsOptional: !0 })}}
`)
    }
    return (Z += `return ${Q.removeUnknownUnionType ? "undefined" : X}})()`), Z
  },
  L$ = ($, X, Q) => {
    if (!$) return ""
    const J = X === "v" && !Q.unions.length
    if (d1 in $ && $[d1] === "Import" && $.$ref in $.$defs)
      return L$($.$defs[$.$ref], X, { ...Q, definitions: Object.assign(Q.definitions, $.$defs) })
    if (J && $.type !== "object" && $.type !== "array" && !$.anyOf)
      return `return ${u5("v", Q.sanitize?.length, $)}`
    if (Q.recursion >= Q.recursionLimit) return X
    let Y = ""
    if ($.$id && lA in $) Q.definitions[$.$id] = $
    switch ($.type) {
      case "object": {
        if ($[d1] === "Record") {
          Y = sA($, X, Q)
          break
        }
        if ((($ = i5($)), (Y += "{"), $.additionalProperties)) Y += `...${X},`
        const Z = Object.keys($.properties)
        for (let G = 0; G < Z.length; G++) {
          const B = Z[G],
            N =
              !$.required ||
              ($.required && !$.required.includes(B)) ||
              Array.isArray($.properties[B].anyOf),
            P = p5(X, B, Q.parentIsOptional)
          if (N) {
            const H = Q.array
            if (X.startsWith("ar")) {
              const A = P.slice(P.indexOf(".") + 1),
                S = Q.optionalsInArray
              if (S[H]) S[H].push(A)
              else S[H] = [A]
            } else Q.optionals.push(P)
          }
          const w = $.properties[B]
          if (G !== 0) Y += ","
          Y += `${tA(B)}:${N ? `${P}===undefined?undefined:` : ""}${L$(w, P, { ...Q, recursion: Q.recursion + 1, parentIsOptional: N })}`
        }
        Y += "}"
        break
      }
      case "array": {
        if ($.items.type !== "object" && $.items.type !== "array")
          if (Array.isArray($.items)) {
            Y = rA($.items, X, Q)
            break
          } else if (J) return "return v"
          else if (
            d1 in $.items &&
            $.items.$ref &&
            ($.items[d1] === "Ref" || $.items[d1] === "This")
          )
            Y = L$(HQ(Q.definitions[$.items.$ref]), X, {
              ...Q,
              parentIsOptional: !0,
              recursion: Q.recursion + 1,
            })
          else {
            Y = X
            break
          }
        const W = Q.array
        Q.array++
        let q = X
        if (J) Y = `const ar${W}v=new Array(${X}.length);`
        else (q = `ar${W}s`), (Y = `((${q})=>{const ar${W}v=new Array(${q}.length);`)
        Y += `for(let i=0;i<${q}.length;i++){const ar${W}p=${q}[i];ar${W}v[i]=${L$($.items, `ar${W}p`, Q)}`
        const M = Q.optionalsInArray[W + 1]
        if (M)
          for (let G = 0; G < M.length; G++) {
            const B = `ar${W}v[i].${M[G]}`
            Y += `;if(${B}===undefined)delete ${B}`
          }
        if (((Y += "}"), !J)) Y += `return ar${W}v})(${X})`
        break
      }
      default:
        if ($.$ref && $.$ref in Q.definitions) return L$(Q.definitions[$.$ref], X, Q)
        if (Array.isArray($.anyOf)) {
          Y = aA($.anyOf, X, Q)
          break
        }
        Y = u5(X, Q.sanitize?.length, $)
        break
    }
    if (!J) return Y
    if ($.type === "array") Y = `${Y}const x=ar0v;`
    else
      Y = `const x=${Y}
`
    for (let Z = 0; Z < Q.optionals.length; Z++) {
      const W = Q.optionals[Z],
        q = W.slice(1)
      if (((Y += `if(${W}===undefined`), Q.unionKeys[W])) Y += `||x${q}===undefined`
      const M = q.charCodeAt(0) !== 63 && $.type !== "array"
      Y += `)delete x${M ? (q.charCodeAt(0) === 91 ? "?." : "?") : ""}${q}
`
    }
    return `${Y}return x`
  },
  AQ = (
    $,
    {
      TypeCompiler: X,
      modules: Q,
      definitions: J,
      sanitize: Y,
      recursionLimit: Z = 8,
      removeUnknownUnionType: W = !1,
    } = {}
  ) => {
    const q = []
    if (typeof Y === "function") Y = [Y]
    const M = L$($, "v", {
      optionals: [],
      optionalsInArray: [],
      array: 0,
      parentIsOptional: !1,
      unions: q,
      unionKeys: {},
      TypeCompiler: X,
      modules: Q,
      definitions: J ?? Q?.$defs ?? {},
      sanitize: Y,
      recursion: 0,
      recursionLimit: Z,
      removeUnknownUnionType: W,
    })
    if (!q.length && !Y?.length) return Function("v", M)
    let G
    if (Y?.length) {
      G = {}
      for (let B = 0; B < Y.length; B++) G[`h${B}`] = Y[B]
    }
    return Function("d", `return function mirror(v){${M}}`)({ unions: q, ...G })
  }
var rJ = ($) =>
    $
      ? $?.[L] === "Import" && $.References
        ? $.References().some(rJ)
        : ($.schema && ($ = $.schema), !!$ && Z1 in $)
      : !1,
  l2 = ($) => {
    if (!$) return !1
    const X = $?.schema ?? $
    if (X[L] === "Import" && $.References) return $.References().some(l2)
    if (X.anyOf) return X.anyOf.some(l2)
    if (X.someOf) return X.someOf.some(l2)
    if (X.allOf) return X.allOf.some(l2)
    if (X.not) return X.not.some(l2)
    if (X.type === "object") {
      const Q = X.properties
      if ("additionalProperties" in X) return X.additionalProperties
      if ("patternProperties" in X) return !1
      for (const J of Object.keys(Q)) {
        const Y = Q[J]
        if (Y.type === "object") {
          if (l2(Y)) return !0
        } else if (Y.anyOf) {
          for (let Z = 0; Z < Y.anyOf.length; Z++) if (l2(Y.anyOf[Z])) return !0
        }
        return Y.additionalProperties
      }
      return !1
    }
    return X.type === "array" && X.items && !Array.isArray(X.items) ? l2(X.items) : !1
  },
  K$ = ($, X) => {
    if (!X) return !1
    if (L in X && X[L] === $) return !0
    if (X.type === "object") {
      const Q = X.properties
      if (!Q) return !1
      for (const J of Object.keys(Q)) {
        const Y = Q[J]
        if (Y.type === "object") {
          if (K$($, Y)) return !0
        } else if (Y.anyOf) {
          for (let Z = 0; Z < Y.anyOf.length; Z++) if (K$($, Y.anyOf[Z])) return !0
        }
        if (L in Y && Y[L] === $) return !0
      }
      return !1
    }
    return !!X.properties && L in X.properties && X.properties[L] === $
  },
  T2 = ($, X) => {
    if (!X) return !1
    const Q = X?.schema ?? X
    if (Q.elysiaMeta === $) return !0
    if (Q[L] === "Import" && X.References) return X.References().some((J) => T2($, J))
    if (Q.anyOf) return Q.anyOf.some((J) => T2($, J))
    if (Q.someOf) return Q.someOf.some((J) => T2($, J))
    if (Q.allOf) return Q.allOf.some((J) => T2($, J))
    if (Q.not) return Q.not.some((J) => T2($, J))
    if (Q.type === "object") {
      const J = Q.properties
      for (const Y of Object.keys(J)) {
        const Z = J[Y]
        if (Z.type === "object") {
          if (T2($, Z)) return !0
        } else if (Z.anyOf) {
          for (let W = 0; W < Z.anyOf.length; W++) if (T2($, Z.anyOf[W])) return !0
        }
        return Q.elysiaMeta === $
      }
      return !1
    }
    return Q.type === "array" && Q.items && !Array.isArray(Q.items) ? T2($, Q.items) : !1
  },
  s6 = ($, X) => {
    if (!X) return
    const Q = X.schema ?? X
    if (Q[L] === "Import" && X.References) return X.References().some((J) => s6($, J))
    if (Q.type === "object") {
      const J = Q.properties
      if (!J) return !1
      for (const Y of Object.keys(J)) {
        const Z = J[Y]
        if ($ in Z) return !0
        if (Z.type === "object") {
          if (s6($, Z)) return !0
        } else if (Z.anyOf) {
          for (let W = 0; W < Z.anyOf.length; W++) if (s6($, Z.anyOf[W])) return !0
        }
      }
      return !1
    }
    return $ in Q
  },
  b2 = ($) => {
    if (!$) return !1
    if ($.oneOf) {
      for (let X = 0; X < $.oneOf.length; X++) if (b2($.oneOf[X])) return !0
    }
    if ($.anyOf) {
      for (let X = 0; X < $.anyOf.length; X++) if (b2($.anyOf[X])) return !0
    }
    if ($.oneOf) {
      for (let X = 0; X < $.oneOf.length; X++) if (b2($.oneOf[X])) return !0
    }
    if ($.allOf) {
      for (let X = 0; X < $.allOf.length; X++) if (b2($.allOf[X])) return !0
    }
    if ($.not && b2($.not)) return !0
    if ($.type === "object" && $.properties) {
      const X = $.properties
      for (const Q of Object.keys(X)) {
        const J = X[Q]
        if (b2(J) || (J.type === "array" && J.items && b2(J.items))) return !0
      }
    }
    return $.type === "array" && $.items && b2($.items) ? !0 : $[L] === "Ref" && "$ref" in $
  },
  k2 = ($) => {
    if (!$) return !1
    if ($.$ref && $.$defs && $.$ref in $.$defs && k2($.$defs[$.$ref])) return !0
    if ($.oneOf) {
      for (let X = 0; X < $.oneOf.length; X++) if (k2($.oneOf[X])) return !0
    }
    if ($.anyOf) {
      for (let X = 0; X < $.anyOf.length; X++) if (k2($.anyOf[X])) return !0
    }
    if ($.allOf) {
      for (let X = 0; X < $.allOf.length; X++) if (k2($.allOf[X])) return !0
    }
    if ($.not && k2($.not)) return !0
    if ($.type === "object" && $.properties) {
      const X = $.properties
      for (const Q of Object.keys(X)) {
        const J = X[Q]
        if (k2(J) || (J.type === "array" && J.items && k2(J.items))) return !0
      }
    }
    return $.type === "array" && $.items && k2($.items) ? !0 : C0 in $
  },
  DQ = ($, X, Q = {}) => {
    const J = Q
    if (((J.root = !0), !Array.isArray(X))) return (X.original = $), B1($, X, J)
    for (const Y of X) (Y.original = $), ($ = B1($, Y, J))
    return $
  },
  B1 = ($, X, Q) => {
    if (!$) return $
    const J = Q.root
    if (X.onlyFirst && $.type === X.onlyFirst) return X.to($) ?? $
    if (X.untilObjectFound && !J && $.type === "object") return $
    const Y = X.from[L]
    if ($.oneOf) {
      for (let q = 0; q < $.oneOf.length; q++) $.oneOf[q] = B1($.oneOf[q], X, Q)
      return $
    }
    if ($.anyOf) {
      for (let q = 0; q < $.anyOf.length; q++) $.anyOf[q] = B1($.anyOf[q], X, Q)
      return $
    }
    if ($.allOf) {
      for (let q = 0; q < $.allOf.length; q++) $.allOf[q] = B1($.allOf[q], X, Q)
      return $
    }
    if ($.not) return B1($.not, X, Q)
    const Z = J && !!X.excludeRoot
    if ($[L] === Y) {
      const { anyOf: q, oneOf: M, allOf: G, not: B, properties: N, items: P, ...w } = $,
        H = X.to(w)
      if (!H) return $
      let A,
        S = (K) => {
          const y = j(K)
          return y.$id && delete y.$id, y
        },
        j = (K) => {
          if (N && K.type === "object") {
            const o = {}
            for (const [n, f] of Object.entries(N)) o[n] = B1(f, X, { ...Q, root: !1 })
            return { ...w, ...K, properties: o }
          }
          if (P && K.type === "array") return { ...w, ...K, items: B1(P, X, { ...Q, root: !1 }) }
          const y = { ...w, ...K }
          return (
            delete y.required,
            N && K.type === "string" && K.format === "ObjectString" && K.default === "{}"
              ? ((A = T.ObjectString(N, w)), (y.properties = N))
              : P &&
                K.type === "string" &&
                K.format === "ArrayString" &&
                K.default === "[]" &&
                ((A = T.ArrayString(P, w)), (y.items = P)),
            y
          )
        }
      if (Z) {
        if (N) {
          const K = {}
          for (const [y, o] of Object.entries(N)) K[y] = B1(o, X, { ...Q, root: !1 })
          return { ...w, properties: K }
        } else if (P?.map) return { ...w, items: P.map((K) => B1(K, X, { ...Q, root: !1 })) }
        return w
      }
      if (H.anyOf) for (let K = 0; K < H.anyOf.length; K++) H.anyOf[K] = S(H.anyOf[K])
      else if (H.oneOf) for (let K = 0; K < H.oneOf.length; K++) H.oneOf[K] = S(H.oneOf[K])
      else if (H.allOf) for (let K = 0; K < H.allOf.length; K++) H.allOf[K] = S(H.allOf[K])
      else H.not && (H.not = S(H.not))
      if ((A && (H[C0] = A[C0]), H.anyOf || H.oneOf || H.allOf || H.not)) return H
      if (N) {
        const K = {}
        for (const [y, o] of Object.entries(N)) K[y] = B1(o, X, { ...Q, root: !1 })
        return { ...w, ...H, properties: K }
      } else if (P?.map) return { ...w, ...H, items: P.map((K) => B1(K, X, { ...Q, root: !1 })) }
      return { ...w, ...H }
    }
    const W = $?.properties
    if (W && J && X.rootOnly !== !0)
      for (const [q, M] of Object.entries(W))
        switch (M[L]) {
          case Y: {
            const { anyOf: G, oneOf: B, allOf: N, not: P, type: w, ...H } = M,
              A = X.to(H)
            if (!A) return $
            if (A.anyOf)
              for (let S = 0; S < A.anyOf.length; S++) A.anyOf[S] = { ...H, ...A.anyOf[S] }
            else if (A.oneOf)
              for (let S = 0; S < A.oneOf.length; S++) A.oneOf[S] = { ...H, ...A.oneOf[S] }
            else if (A.allOf)
              for (let S = 0; S < A.allOf.length; S++) A.allOf[S] = { ...H, ...A.allOf[S] }
            else A.not && (A.not = { ...H, ...A.not })
            W[q] = { ...H, ...B1(H, X, { ...Q, root: !1 }) }
            break
          }
          case "Object":
          case "Union":
            W[q] = B1(M, X, { ...Q, root: !1 })
            break
          default:
            if (Array.isArray(M.items))
              for (let S = 0; S < M.items.length; S++)
                M.items[S] = B1(M.items[S], X, { ...Q, root: !1 })
            else
              M.anyOf || M.oneOf || M.allOf || M.not
                ? (W[q] = B1(M, X, { ...Q, root: !1 }))
                : M.type === "array" && (M.items = B1(M.items, X, { ...Q, root: !1 }))
            break
        }
    return (
      $.type === "array" &&
        $.items &&
        (Array.isArray($.items)
          ? ($.items = $.items.map((q) => B1(q, X, { ...Q, root: !1 })))
          : ($.items = B1($.items, X, { ...Q, root: !1 }))),
      $
    )
  },
  M6 = ($) => (X) => {
    if (typeof X === "object")
      try {
        return S0.Clean($, X)
      } catch {}
    return X
  },
  c0 = (
    $,
    {
      models: X = {},
      dynamic: Q = !1,
      modules: J,
      normalize: Y = !1,
      additionalProperties: Z = !1,
      forceAdditionalProperties: W = !1,
      coerce: q = !1,
      additionalCoerce: M = [],
      validators: G,
      sanitize: B,
    } = {}
  ) => {
    if (((G = G?.filter((j) => j)), !$)) {
      if (!G?.length) return
      ;($ = G[0]), (G = G.slice(1))
    }
    let N,
      P = (j) =>
        q
          ? DQ(j, [
              { from: T.Number(), to: (K) => T.Numeric(K), untilObjectFound: !0 },
              { from: T.Boolean(), to: (K) => T.BooleanString(K), untilObjectFound: !0 },
              ...(Array.isArray(M) ? M : [M]),
            ])
          : DQ(j, M),
      w = (j) => {
        if (j && typeof j !== "string" && "~standard" in j) return j
        if (!j) return
        let K
        if (typeof j !== "string") K = j
        else if (((K = J && j in J.$defs ? J.Import(j) : X[j]), !K)) return
        if (L in K)
          if (K[L] === "Import")
            b2(K.$defs[K.$ref]) || ((K = K.$defs[K.$ref]), (q || M) && (K = P(K)))
          else if (b2(K)) {
            const y = d$()
            K = T.Module({ ...J?.$defs, [y]: K }).Import(y)
          } else (q || M) && (K = P(K))
        return K
      },
      H = w($),
      A = G
    if (
      "~standard" in H ||
      (G?.length && G.some((j) => j && typeof j !== "string" && "~standard" in j))
    ) {
      const j = (f) => {
          let I
          if (Y === !0 || Y === "exactMirror")
            try {
              I = AQ(f, { TypeCompiler: _2, sanitize: B?.(), modules: J })
            } catch {
              console.warn(
                "Failed to create exactMirror. Please report the following code to https://github.com/elysiajs/elysia/issues"
              ),
                console.warn(f),
                (I = M6(f))
            }
          const k = c0(f, {
            models: X,
            modules: J,
            dynamic: Q,
            normalize: Y,
            additionalProperties: !0,
            forceAdditionalProperties: !0,
            coerce: q,
            additionalCoerce: M,
          })
          return (
            (k.Decode = I),
            (b) => (k.Check(b) ? { value: k.Decode(b) } : { issues: [...k.Errors(b)] })
          )
        },
        K = H["~standard"] ? H["~standard"].validate : j(H),
        y = []
      if (G?.length) {
        for (const f of G)
          if (f && typeof f !== "string") {
            if (f?.["~standard"]) {
              y.push(f["~standard"])
              continue
            }
            if (L in f) {
              y.push(j(f))
            }
          }
      }
      async function o(f) {
        let I = K(f)
        if ((I instanceof Promise && (I = await I), I.issues)) return I
        const k = []
        I && typeof I === "object" && k.push(I.value)
        for (let _ = 0; _ < y.length; _++) {
          if (((I = y[_].validate(f)), I instanceof Promise && (I = await I), I.issues)) return I
          I && typeof I === "object" && k.push(I.value)
        }
        if (!k.length) return { value: I }
        if (k.length === 1) return { value: k[0] }
        if (k.length === 2) return { value: Y1(k[0], k[1]) }
        let b = Y1(k[0], k[1])
        for (let _ = 2; _ < k.length; _++) b = Y1(b, k[_])
        return { value: b }
      }
      const n = {
        provider: "standard",
        schema: H,
        references: "",
        checkFunc: () => {},
        code: "",
        Check: o,
        Errors: (f) => o(f)?.then?.((I) => I?.issues),
        Code: () => "",
        Decode: o,
        Encode: (f) => f,
        hasAdditionalProperties: !1,
        hasDefault: !1,
        isOptional: !1,
        hasTransform: !1,
        hasRef: !1,
      }
      return (
        (n.parse = (f) => {
          try {
            return n.Decode(n.Clean?.(f) ?? f)
          } catch {
            throw [...n.Errors(f)].map(M1)
          }
        }),
        (n.safeParse = (f) => {
          try {
            return { success: !0, data: n.Decode(n.Clean?.(f) ?? f), error: null }
          } catch {
            const I = [...S.Errors(f)].map(M1)
            return { success: !1, data: null, error: I[0]?.summary, errors: I }
          }
        }),
        n
      )
    } else if (G?.length) {
      let j = !1,
        K = A,
        { schema: y, notObjects: o } = eA([H, ...K.map(w)])
      o &&
        ((H = T.Intersect([
          ...(y ? [y] : []),
          ...o.map((n) => {
            const f = w(n)
            return (
              f.type === "object" &&
                "additionalProperties" in f &&
                (!j && f.additionalProperties === !1 && (j = !0), delete f.additionalProperties),
              f
            )
          }),
        ])),
        H.type === "object" && j && (H.additionalProperties = !1))
    } else
      H.type === "object" && (!("additionalProperties" in H) || W)
        ? (H.additionalProperties = Z)
        : (H = DQ(H, {
            onlyFirst: "object",
            from: T.Object({}),
            to({ properties: j, ...K }) {
              if (j && !("additionalProperties" in H))
                return T.Object(j, { ...K, additionalProperties: !1 })
            },
          }))
    if (Q)
      if (L in H) {
        const j = {
          provider: "typebox",
          schema: H,
          references: "",
          checkFunc: () => {},
          code: "",
          Check: (K) => S0.Check(H, K),
          Errors: (K) => S0.Errors(H, K),
          Code: () => "",
          Clean: M6(H),
          Decode: (K) => S0.Decode(H, K),
          Encode: (K) => S0.Encode(H, K),
          get hasAdditionalProperties() {
            return "~hasAdditionalProperties" in this
              ? this["~hasAdditionalProperties"]
              : (this["~hasAdditionalProperties"] = l2(H))
          },
          get hasDefault() {
            return "~hasDefault" in this
              ? this["~hasDefault"]
              : (this["~hasDefault"] = s6("default", H))
          },
          get isOptional() {
            return "~isOptional" in this ? this["~isOptional"] : (this["~isOptional"] = rJ(H))
          },
          get hasTransform() {
            return "~hasTransform" in this ? this["~hasTransform"] : (this["~hasTransform"] = k2(H))
          },
          "~hasRef": N,
          get hasRef() {
            return "~hasRef" in this ? this["~hasRef"] : (this["~hasRef"] = k2(H))
          },
        }
        if (
          (H.config && ((j.config = H.config), j?.schema?.config && delete j.schema.config),
          Y && H.additionalProperties === !1)
        )
          if (Y === !0 || Y === "exactMirror")
            try {
              j.Clean = AQ(H, { TypeCompiler: _2, sanitize: B?.(), modules: J })
            } catch {
              console.warn(
                "Failed to create exactMirror. Please report the following code to https://github.com/elysiajs/elysia/issues"
              ),
                console.warn(H),
                (j.Clean = M6(H))
            }
          else j.Clean = M6(H)
        return (
          (j.parse = (K) => {
            try {
              return j.Decode(j.Clean?.(K) ?? K)
            } catch {
              throw [...j.Errors(K)].map(M1)
            }
          }),
          (j.safeParse = (K) => {
            try {
              return { success: !0, data: j.Decode(j.Clean?.(K) ?? K), error: null }
            } catch {
              const y = [...S.Errors(K)].map(M1)
              return { success: !1, data: null, error: y[0]?.summary, errors: y }
            }
          }),
          j
        )
      } else {
        const j = {
          provider: "standard",
          schema: H,
          references: "",
          checkFunc: () => {},
          code: "",
          Check: (K) => H["~standard"].validate(K),
          Errors(K) {
            const y = H["~standard"].validate(K)
            if (y instanceof Promise)
              throw Error("Async validation is not supported in non-dynamic schema")
            return y.issues
          },
          Code: () => "",
          Decode(K) {
            const y = H["~standard"].validate(K)
            if (y instanceof Promise)
              throw Error("Async validation is not supported in non-dynamic schema")
            return y
          },
          Encode: (K) => K,
          hasAdditionalProperties: !1,
          hasDefault: !1,
          isOptional: !1,
          hasTransform: !1,
          hasRef: !1,
        }
        return (
          (j.parse = (K) => {
            try {
              return j.Decode(j.Clean?.(K) ?? K)
            } catch {
              throw [...j.Errors(K)].map(M1)
            }
          }),
          (j.safeParse = (K) => {
            try {
              return { success: !0, data: j.Decode(j.Clean?.(K) ?? K), error: null }
            } catch {
              const y = [...S.Errors(K)].map(M1)
              return { success: !1, data: null, error: y[0]?.summary, errors: y }
            }
          }),
          j
        )
      }
    let S
    if (L in H)
      if (
        ((S = _2.Compile(
          H,
          Object.values(X).filter((j) => L in j)
        )),
        (S.provider = "typebox"),
        H.config && ((S.config = H.config), S?.schema?.config && delete S.schema.config),
        Y === !0 || Y === "exactMirror")
      )
        try {
          S.Clean = AQ(H, { TypeCompiler: _2, sanitize: B?.(), modules: J })
        } catch {
          console.warn(
            "Failed to create exactMirror. Please report the following code to https://github.com/elysiajs/elysia/issues"
          ),
            console.dir(H, { depth: null }),
            (S.Clean = M6(H))
        }
      else Y === "typebox" && (S.Clean = M6(H))
    else
      S = {
        provider: "standard",
        schema: H,
        references: "",
        checkFunc(j) {
          const K = H["~standard"].validate(j)
          if (K instanceof Promise)
            throw Error("Async validation is not supported in non-dynamic schema")
          return K
        },
        code: "",
        Check: (j) => H["~standard"].validate(j),
        Errors(j) {
          const K = H["~standard"].validate(j)
          if (K instanceof Promise)
            throw Error("Async validation is not supported in non-dynamic schema")
          return K.issues
        },
        Code: () => "",
        Decode(j) {
          const K = H["~standard"].validate(j)
          if (K instanceof Promise)
            throw Error("Async validation is not supported in non-dynamic schema")
          return K
        },
        Encode: (j) => j,
        hasAdditionalProperties: !1,
        hasDefault: !1,
        isOptional: !1,
        hasTransform: !1,
        hasRef: !1,
      }
    return (
      (S.parse = (j) => {
        try {
          return S.Decode(S.Clean?.(j) ?? j)
        } catch {
          throw [...S.Errors(j)].map(M1)
        }
      }),
      (S.safeParse = (j) => {
        try {
          return { success: !0, data: S.Decode(S.Clean?.(j) ?? j), error: null }
        } catch {
          const K = [...S.Errors(j)].map(M1)
          return { success: !1, data: null, error: K[0]?.summary, errors: K }
        }
      }),
      L in H &&
        Object.assign(S, {
          get hasAdditionalProperties() {
            return "~hasAdditionalProperties" in this
              ? this["~hasAdditionalProperties"]
              : (this["~hasAdditionalProperties"] = l2(S))
          },
          get hasDefault() {
            return "~hasDefault" in this
              ? this["~hasDefault"]
              : (this["~hasDefault"] = s6("default", S))
          },
          get isOptional() {
            return "~isOptional" in this ? this["~isOptional"] : (this["~isOptional"] = rJ(S))
          },
          get hasTransform() {
            return "~hasTransform" in this ? this["~hasTransform"] : (this["~hasTransform"] = k2(H))
          },
          get hasRef() {
            return "~hasRef" in this ? this["~hasRef"] : (this["~hasRef"] = b2(H))
          },
          "~hasRef": N,
        }),
      S
    )
  },
  n5 = ($) => $[L] === "Union" || (!$.schema && !!$.anyOf),
  eA = ($) => {
    if ($.length === 0) return { schema: void 0, notObjects: [] }
    if ($.length === 1)
      return $[0].type === "object"
        ? { schema: $[0], notObjects: [] }
        : { schema: void 0, notObjects: $ }
    let X,
      Q = [],
      J = !1,
      Y = !1
    for (const Z of $) {
      if (Z.type !== "object") {
        Q.push(Z)
        continue
      }
      if (
        ("additionalProperties" in Z &&
          (Z.additionalProperties === !0 ? (J = !0) : Z.additionalProperties === !1 && (Y = !0)),
        !X)
      ) {
        X = Z
        continue
      }
      X = {
        ...X,
        ...Z,
        properties: { ...X.properties, ...Z.properties },
        required: [...(X?.required ?? []), ...Z.required],
      }
    }
    return (
      X &&
        (X.required && (X.required = [...new Set(X.required)]),
        Y ? (X.additionalProperties = !1) : J && (X.additionalProperties = !0)),
      { schema: X, notObjects: Q }
    )
  },
  OQ = (
    $,
    {
      models: X = {},
      modules: Q,
      dynamic: J = !1,
      normalize: Y = !1,
      additionalProperties: Z = !1,
      validators: W = [],
      sanitize: q,
    }
  ) => {
    if (((W = W.filter((B) => B)), !$)) {
      if (!W?.length) return
      ;($ = W[0]), (W = W.slice(1))
    }
    let M
    if (typeof $ !== "string") M = $
    else if (((M = Q && $ in Q.$defs ? Q.Import($) : X[$]), !M)) return
    if (!M) return
    if (L in M || "~standard" in M)
      return {
        200: c0(M, {
          modules: Q,
          models: X,
          additionalProperties: Z,
          dynamic: J,
          normalize: Y,
          coerce: !1,
          additionalCoerce: [],
          validators: W.map((B) => B[200]),
          sanitize: q,
        }),
      }
    const G = {}
    return (
      Object.keys(M).forEach((B) => {
        if (Number.isNaN(+B)) return
        const N = M[+B]
        if (typeof N === "string") {
          if (N in X) {
            const P = X[N]
            if (!P) return
            G[+B] =
              L in P || "~standard" in P
                ? c0(P, {
                    modules: Q,
                    models: X,
                    additionalProperties: Z,
                    dynamic: J,
                    normalize: Y,
                    coerce: !1,
                    additionalCoerce: [],
                    validators: W.map((w) => w[+B]),
                    sanitize: q,
                  })
                : P
          }
          return
        }
        G[+B] =
          L in N || "~standard" in N
            ? c0(N, {
                modules: Q,
                models: X,
                additionalProperties: Z,
                dynamic: J,
                normalize: Y,
                coerce: !1,
                additionalCoerce: [],
                validators: W.map((P) => P[+B]),
                sanitize: q,
              })
            : N
      }),
      G
    )
  },
  lJ,
  B6 = () => (
    lJ ||
      (lJ = [
        { from: T.Object({}), to: () => T.ObjectString({}), excludeRoot: !0 },
        { from: T.Array(T.Any()), to: () => T.ArrayString(T.Any()) },
      ]),
    lJ
  ),
  tJ,
  aJ = () => (
    tJ ||
      (tJ = [
        { from: T.Object({}), to: () => T.ObjectString({}), excludeRoot: !0 },
        { from: T.Array(T.Any()), to: () => T.ArrayQuery(T.Any()) },
      ]),
    tJ
  ),
  sJ,
  r6 = () => (
    sJ ||
      (sJ = [
        { from: T.Number(), to: ($) => T.Numeric($), rootOnly: !0 },
        { from: T.Boolean(), to: ($) => T.BooleanString($), rootOnly: !0 },
      ]),
    sJ
  ),
  o5 = ({
    validator: $,
    modules: X,
    defaultConfig: Q = {},
    config: J,
    dynamic: Y,
    normalize: Z = !1,
    models: W,
    validators: q,
    sanitize: M,
  }) => {
    let G = $?.provider
      ? $
      : c0($, {
          modules: X,
          dynamic: Y,
          models: W,
          normalize: Z,
          additionalProperties: !0,
          coerce: !0,
          additionalCoerce: B6(),
          validators: q,
          sanitize: M,
        })
    return (
      G
        ? (G.config = y6(G.config, J))
        : ((G = c0(T.Cookie(T.Any()), {
            modules: X,
            dynamic: Y,
            models: W,
            additionalProperties: !0,
            validators: q,
            sanitize: M,
          })),
          (G.config = Q)),
      G
    )
  },
  A8 = ($) => ($ && $[L] === "Import" && $.$defs[$.$ref][L] === "Object" ? $.$defs[$.$ref] : $)
var p0 = ($, X) => (X ? $ : ""),
  $D = [
    "json",
    "text",
    "urlencoded",
    "arrayBuffer",
    "formdata",
    "application/json",
    "text/plain",
    "application/x-www-form-urlencoded",
    "application/octet-stream",
    "multipart/form-data",
  ],
  $X = ({ context: $ = "c", trace: X = [], addFn: Q }) => {
    if (!X.length)
      return () => ({
        resolveChild() {
          return () => {}
        },
        resolve() {},
      })
    for (let J = 0; J < X.length; J++)
      Q(`let report${J},reportChild${J},reportErr${J},reportErrChild${J};let trace${J}=${$}[ELYSIA_TRACE]?.[${J}]??trace[${J}](${$});
`)
    return (J, { name: Y, total: Z = 0 } = {}) => {
      Y || (Y = "anonymous")
      const W = J === "error" ? "reportErr" : "report"
      for (let q = 0; q < X.length; q++)
        Q(`${W}${q} = trace${q}.${J}({id,event:'${J}',name:'${Y}',begin:performance.now(),total:${Z}})
`)
      return {
        resolve() {
          for (let q = 0; q < X.length; q++)
            Q(`${W}${q}.resolve()
`)
        },
        resolveChild(q) {
          for (let M = 0; M < X.length; M++)
            Q(`${W}Child${M}=${W}${M}.resolveChild?.shift()?.({id,event:'${J}',name:'${q}',begin:performance.now()})
`)
          return (M) => {
            for (let G = 0; G < X.length; G++)
              Q(
                M
                  ? `if(${M} instanceof Error){${W}Child${G}?.(${M}) }else{${W}Child${G}?.()}`
                  : `${W}Child${G}?.()
`
              )
          }
        },
      }
    }
  },
  a6 = ({ schema: $, name: X, type: Q, typeAlias: J = Q, normalize: Y, ignoreTryCatch: Z = !1 }) =>
    !Y || !$.Clean
      ? ""
      : Y === !0 || Y === "exactMirror"
        ? Z
          ? `${X}=validator.${J}.Clean(${X})
`
          : `try{${X}=validator.${J}.Clean(${X})
}catch{}`
        : Y === "typebox"
          ? `${X}=validator.${J}.Clean(${X})
`
          : "",
  XD = ({
    injectResponse: $ = "",
    normalize: X = !1,
    validator: Q,
    encodeSchema: J = !1,
    isStaticResponse: Y = !1,
    hasSanitize: Z = !1,
  }) => ({
    validate: (W, q = `c.${W}`, M) =>
      `c.set.status=422;throw new ValidationError('${W}',validator.${W},${q}${M ? `,${M}` : ""})`,
    response: (W = "r") => {
      if (Y || !Q.response) return ""
      let q =
        $ +
        `
`
      q += `if(${W} instanceof ElysiaCustomStatusResponse){c.set.status=${W}.code
${W}=${W}.response}if(${W} instanceof Response === false)switch(c.set.status){`
      for (const [M, G] of Object.entries(Q.response)) {
        if (
          ((q += `
case ${M}:
`),
          G.provider === "standard")
        ) {
          q += `let vare${M}=validator.response[${M}].Check(${W})
if(vare${M} instanceof Promise)vare${M}=await vare${M}
if(vare${M}.issues)throw new ValidationError('response',validator.response[${M}],${W},vare${M}.issues)
${W}=vare${M}.value
c.set.status=${M}
break
`
          continue
        }
        let B = G.schema?.noValidate === !0
        if (!B && G.schema?.$ref && G.schema?.$defs) {
          const H = G.schema.$ref,
            A = typeof H === "string" && H.includes("/") ? H.split("/").pop() : H
          G.schema.$defs[A]?.noValidate === !0 && (B = !0)
        }
        const N = B || Z,
          P = ({ ignoreTryCatch: H = !1 } = {}) =>
            a6({
              name: W,
              schema: G,
              type: "response",
              typeAlias: `response[${M}]`,
              normalize: X,
              ignoreTryCatch: H,
            })
        N && (q += P())
        const w = !N && X && !B
        J && G.hasTransform && !B
          ? ((q += `try{${W}=validator.response[${M}].Encode(${W})
`),
            N || (q += P({ ignoreTryCatch: !0 })),
            (q +=
              `c.set.status=${M}}catch{` +
              (w
                ? `try{
` +
                  P({ ignoreTryCatch: !0 }) +
                  `${W}=validator.response[${M}].Encode(${W})
}catch{throw new ValidationError('response',validator.response[${M}],${W})}`
                : `throw new ValidationError('response',validator.response[${M}],${W})`) +
              "}"))
          : (N || (q += P()),
            B ||
              (q += `if(validator.response[${M}].Check(${W})===false)throw new ValidationError('response',validator.response[${M}],${W})
c.set.status=${M}
`)),
          (q += `break
`)
      }
      return `${q}}`
    },
  }),
  c$ = ($) => ($?.fn ?? $).constructor.name === "AsyncFunction",
  QD = /=>\s?response\.clone\(/,
  JD = /(?:return|=>)\s?\S+\(|a(?:sync|wait)/,
  k0 = ($) => {
    const X = typeof $ === "object"
    if (X && $.isAsync !== void 0) return $.isAsync
    const Q = X ? $.fn : $
    if (Q.constructor.name === "AsyncFunction") return !0
    const J = Q.toString()
    if (QD.test(J)) return X && ($.isAsync = !1), !1
    const Y = JD.test(J)
    return X && ($.isAsync = Y), Y
  },
  e6 = ($) => {
    const X = typeof $ === "object"
    if (X && $.hasReturn !== void 0) return $.hasReturn
    const Q = X ? $.fn.toString() : typeof $ === "string" ? $.toString() : $,
      J = Q.indexOf(")")
    if (Q.charCodeAt(J + 2) === 61 && Q.charCodeAt(J + 5) !== 123)
      return X && ($.hasReturn = !0), !0
    const Y = Q.includes("return")
    return X && ($.hasReturn = Y), Y
  },
  PQ = ($) => {
    const X = $?.fn ?? $
    return (
      X.constructor.name === "AsyncGeneratorFunction" || X.constructor.name === "GeneratorFunction"
    )
  },
  G6 = (
    $,
    X,
    Q = `c.${X}`
  ) => `try{${$}}catch(error){if(error.constructor.name === 'TransformDecodeError'){c.set.status=422
throw error.error ?? new ValidationError('${X}',validator.${X},${Q})}}`,
  t5 = ({
    app: $,
    path: X,
    method: Q,
    hooks: J,
    validator: Y,
    handler: Z,
    allowMeta: W = !1,
    inference: q,
  }) => {
    const M = $["~adapter"].composeHandler,
      G = $["~adapter"].handler,
      B = typeof Z === "function"
    if (!B) {
      Z = G.mapResponse(Z, { headers: $.setHeaders ?? {} })
      const v =
        Z instanceof Response ||
        (Z?.constructor?.name === "Response" && typeof Z?.clone === "function")
      if (J.parse?.length && J.transform?.length && J.beforeHandle?.length && J.afterHandle?.length)
        return v
          ? Function(
              "a",
              `"use strict";
return function(){return a.clone()}`
            )(Z)
          : Function(
              "a",
              `"use strict";
return function(){return a}`
            )(Z)
      if (v) {
        const U = Z
        Z = () => U.clone()
      }
    }
    let N = B ? "handler(c)" : "handler",
      P = !!J.trace?.length,
      w = ""
    if (((q = U8(Object.assign({ handler: Z }, J), q, $.config.sucrose)), M.declare)) {
      const v = M.declare(q)
      v && (w += v)
    }
    q.server &&
      (w += `Object.defineProperty(c,'server',{get:function(){return getServer()}})
`),
      Y.createBody?.(),
      Y.createQuery?.(),
      Y.createHeaders?.(),
      Y.createParams?.(),
      Y.createCookie?.(),
      Y.createResponse?.()
    let H = !!Y.body || !!Y.headers || !!Y.params || !!Y.query || !!Y.cookie || !!Y.response,
      A = q.query || !!Y.query,
      S = J.parse?.length === 1 && J.parse[0].fn === "none",
      j =
        Q !== "" && Q !== "GET" && Q !== "HEAD" && (q.body || !!Y.body || !!J.parse?.length) && !S,
      K = $.setHeaders,
      y = K && !!Object.keys(K).length,
      o = q.headers || !!Y.headers || (M.preferWebstandardHeaders !== !0 && q.body),
      n = q.cookie || !!Y.cookie,
      f = Y.cookie?.config ? y6(Y?.cookie?.config, $.config.cookie) : $.config.cookie,
      I = "",
      k = () => {
        if (I) return I
        if (f?.sign) {
          if (!f.secrets) throw Error(`t.Cookie required secret which is not set in (${Q}) ${X}.`)
          const v = f.secrets ? (typeof f.secrets === "string" ? f.secrets : f.secrets[0]) : void 0
          if (
            ((I += `const _setCookie = c.set.cookie
if(_setCookie){`),
            f.sign === !0)
          )
            I += `for(const [key, cookie] of Object.entries(_setCookie)){c.set.cookie[key].value=await signCookie(cookie.value,'${v}')}`
          else
            for (const U of f.sign)
              I += `if(_setCookie['${U}']?.value)c.set.cookie['${U}'].value=await signCookie(_setCookie['${U}'].value,'${v}')
`
          I += `}
`
        }
        return I
      },
      b = $.config.normalize,
      _ = $.config.encodeSchema,
      V = XD({
        normalize: b,
        validator: Y,
        encodeSchema: _,
        isStaticResponse: Z instanceof Response,
        hasSanitize: !!$.config.sanitize,
      })
    o && (w += M.headers),
      P &&
        (w += `const id=c[ELYSIA_REQUEST_ID]
`)
    const d = $X({
      trace: J.trace,
      addFn: (v) => {
        w += v
      },
    })
    if (((w += "try{"), n)) {
      const v = (D, z) => {
          const x = f?.[D] ?? z
          return x
            ? typeof x === "string"
              ? `${D}:'${x}',`
              : x instanceof Date
                ? `${D}: new Date(${x.getTime()}),`
                : `${D}:${x},`
            : typeof z === "string"
              ? `${D}:"${z}",`
              : `${D}:${z},`
        },
        U = f
          ? `{secrets:${f.secrets !== void 0 ? (typeof f.secrets === "string" ? `'${f.secrets}'` : `[${f.secrets.reduce((D, z) => `${D}'${z}',`, "")}]`) : "undefined"},sign:${f.sign === !0 ? !0 : f.sign !== void 0 ? `[${f.sign.reduce((D, z) => `${D}'${z}',`, "")}]` : "undefined"},` +
            v("domain") +
            v("expires") +
            v("httpOnly") +
            v("maxAge") +
            v("path", "/") +
            v("priority") +
            v("sameSite") +
            v("secure") +
            "}"
          : "undefined"
      o
        ? (w += `
c.cookie=await parseCookie(c.set,c.headers.cookie,${U})
`)
        : (w += `
c.cookie=await parseCookie(c.set,c.request.headers.get('cookie'),${U})
`)
    }
    if (A) {
      let v = {},
        U = {},
        D = !1,
        z = !1
      if (Y.query?.schema) {
        const x = A8(Y.query?.schema)
        if (L in x && x.properties)
          for (const [E, g] of Object.entries(x.properties))
            T2("ArrayQuery", g) && ((v[E] = 1), (D = !0)),
              T2("ObjectString", g) && ((U[E] = 1), (z = !0))
      }
      w += `if(c.qi===-1){c.query=Object.create(null)}else{c.query=parseQueryFromURL(c.url,c.qi+1,${D ? JSON.stringify(v) : void 0},${z ? JSON.stringify(U) : void 0})}`
    }
    let m = typeof Z === "function" && k0(Z),
      X0 = P || J.afterResponse?.length ? "c.response=c.responseValue= " : "",
      R0 = Object.keys(Y.response ?? {}),
      e = R0.length > 1,
      C$ = R0.length === 0 || (R0.length === 1 && R0[0] === "200"),
      j$ =
        n ||
        j ||
        m ||
        !!J.parse?.length ||
        !!J.afterHandle?.some(k0) ||
        !!J.beforeHandle?.some(k0) ||
        !!J.transform?.some(k0) ||
        !!J.mapResponse?.some(k0) ||
        Y.body?.provider === "standard" ||
        Y.headers?.provider === "standard" ||
        Y.query?.provider === "standard" ||
        Y.params?.provider === "standard" ||
        Y.cookie?.provider === "standard" ||
        Object.values(Y.response ?? {}).find((v) => v.provider === "standard"),
      h1 =
        (typeof Z === "function" ? PQ(Z) : !1) ||
        !!J.beforeHandle?.some(PQ) ||
        !!J.afterHandle?.some(PQ) ||
        !!J.transform?.some(PQ),
      G2 = q.cookie || q.set || o || P || e || !C$ || (B && y) || h1,
      d0,
      $1 = () => {
        if (d0 !== void 0) return d0
        if (!J.afterResponse?.length && !P) return ""
        let v = "",
          U = J.afterResponse?.some(k0) ? "async " : ""
        v += `
setImmediate(${U}()=>{`
        const D = $X({
          trace: J.trace,
          addFn: (z) => {
            v += z
          },
        })("afterResponse", { total: J.afterResponse?.length })
        if (J.afterResponse?.length && J.afterResponse)
          for (let z = 0; z < J.afterResponse.length; z++) {
            const x = D.resolveChild(J.afterResponse[z].fn.name),
              E = k0(J.afterResponse[z]) ? "await " : ""
            ;(v += `
${E}e.afterResponse[${z}](c)
`),
              x()
          }
        return (
          D.resolve(),
          (v += `})
`),
          (d0 = v)
        )
      },
      t0 = (v = "r") => {
        const U = $1(),
          D = `${G2 ? "mapResponse" : "mapCompactResponse"}(${X0}${v}${G2 ? ",c.set" : ""}${F1})
`
        return U ? `const _res=${D}${U}return _res` : `return ${D}`
      },
      F1 = h1 || M.mapResponseContext ? `,${M.mapResponseContext}` : ""
    ;(P || q.route) &&
      (w += `c.route=\`${X}\`
`)
    const g2 = d("parse", { total: J.parse?.length })
    if (j) {
      const v = !!J.parse?.length || q.body || Y.body
      M.parser.declare && (w += M.parser.declare),
        (w += `
try{`)
      let U =
        typeof J.parse === "string"
          ? J.parse
          : Array.isArray(J.parse) && J.parse.length === 1
            ? typeof J.parse[0] === "string"
              ? J.parse[0]
              : typeof J.parse[0].fn === "string"
                ? J.parse[0].fn
                : void 0
            : void 0
      if (!U && Y.body && !J.parse?.length) {
        const D = Y.body.schema
        D?.anyOf &&
          D[L] === "Union" &&
          D.anyOf?.length === 2 &&
          D.anyOf?.find((z) => z[L] === "ElysiaForm") &&
          (U = "formdata")
      }
      if (U && $D.includes(U)) {
        const D = d("parse", { total: J.parse?.length }),
          z = !!Y.body?.isOptional
        switch (U) {
          case "json":
          case "application/json":
            w += M.parser.json(z)
            break
          case "text":
          case "text/plain":
            w += M.parser.text(z)
            break
          case "urlencoded":
          case "application/x-www-form-urlencoded":
            w += M.parser.urlencoded(z)
            break
          case "arrayBuffer":
          case "application/octet-stream":
            w += M.parser.arrayBuffer(z)
            break
          case "formdata":
          case "multipart/form-data":
            w += M.parser.formData(z)
            break
          default:
            U[0] in $["~parser"] &&
              ((w += o
                ? "let contentType = c.headers['content-type']"
                : "let contentType = c.request.headers.get('content-type')"),
              (w += `
if(contentType){const index=contentType.indexOf(';')
if(index!==-1)contentType=contentType.substring(0,index)}
else{contentType=''}c.contentType=contentType
let result=parser['${U}'](c, contentType)
if(result instanceof Promise)result=await result
if(result instanceof ElysiaCustomStatusResponse)throw result
if(result!==undefined)c.body=result
delete c.contentType
`))
            break
        }
        D.resolve()
      } else if (v) {
        ;(w += `
`),
          (w += `let contentType
if(c.request.body)`),
          (w += o
            ? `contentType=c.headers['content-type']
`
            : `contentType=c.request.headers.get('content-type')
`)
        let D = !1
        if (J.parse?.length)
          w += `if(contentType){
const index=contentType.indexOf(';')

if(index!==-1)contentType=contentType.substring(0,index)}else{contentType=''}let used=false
c.contentType=contentType
`
        else {
          D = !0
          const x = !!Y.body?.isOptional
          w +=
            `if(contentType)switch(contentType.charCodeAt(12)){
case 106:` +
            M.parser.json(x) +
            `break
case 120:` +
            M.parser.urlencoded(x) +
            `break
case 111:` +
            M.parser.arrayBuffer(x) +
            `break
case 114:` +
            M.parser.formData(x) +
            `break
default:if(contentType.charCodeAt(0)===116){` +
            M.parser.text(x) +
            `}break
}`
        }
        const z = d("parse", { total: J.parse?.length })
        if (J.parse)
          for (let x = 0; x < J.parse.length; x++) {
            const E = `bo${x}`
            if (
              (x !== 0 &&
                (w += `
if(!used){`),
              typeof J.parse[x].fn === "string")
            ) {
              const g = z.resolveChild(J.parse[x].fn),
                t = !!Y.body?.isOptional
              switch (J.parse[x].fn) {
                case "json":
                case "application/json":
                  ;(D = !0), (w += M.parser.json(t))
                  break
                case "text":
                case "text/plain":
                  ;(D = !0), (w += M.parser.text(t))
                  break
                case "urlencoded":
                case "application/x-www-form-urlencoded":
                  ;(D = !0), (w += M.parser.urlencoded(t))
                  break
                case "arrayBuffer":
                case "application/octet-stream":
                  ;(D = !0), (w += M.parser.arrayBuffer(t))
                  break
                case "formdata":
                case "multipart/form-data":
                  ;(D = !0), (w += M.parser.formData(t))
                  break
                default:
                  w += `let ${E}=parser['${J.parse[x].fn}'](c,contentType)
if(${E} instanceof Promise)${E}=await ${E}
if(${E}!==undefined){c.body=${E};used=true;}
`
              }
              g()
            } else {
              const g = z.resolveChild(J.parse[x].fn.name)
              ;(w += `let ${E}=e.parse[${x}]
${E}=${E}(c,contentType)
if(${E} instanceof Promise)${E}=await ${E}
if(${E}!==undefined){c.body=${E};used=true}`),
                g()
            }
            if ((x !== 0 && (w += "}"), D)) break
          }
        if ((z.resolve(), !D)) {
          const x = !!Y.body?.isOptional
          J.parse?.length &&
            (w += `
if(!used){
`),
            (w +=
              `switch(contentType){case 'application/json':
` +
              M.parser.json(x) +
              `break
case 'text/plain':` +
              M.parser.text(x) +
              `break
case 'application/x-www-form-urlencoded':` +
              M.parser.urlencoded(x) +
              `break
case 'application/octet-stream':` +
              M.parser.arrayBuffer(x) +
              `break
case 'multipart/form-data':` +
              M.parser.formData(x) +
              `break
`)
          for (const E of Object.keys($["~parser"]))
            w +=
              `case '${E}':let bo${E}=parser['${E}'](c,contentType)
if(bo${E} instanceof Promise)bo${E}=await bo${E}
if(bo${E} instanceof ElysiaCustomStatusResponse){` +
              t0(`bo${E}`) +
              `}if(bo${E}!==undefined)c.body=bo${E}
break
`
          J.parse?.length && (w += "}"), (w += "}")
        }
        J.parse?.length &&
          (w += `
delete c.contentType`)
      }
      w += "}catch(error){throw new ParseError(error)}"
    }
    if ((g2.resolve(), J?.transform || P)) {
      const v = d("transform", { total: J.transform?.length })
      if (J.transform?.length) {
        w += `let transformed
`
        for (let U = 0; U < J.transform.length; U++) {
          const D = J.transform[U],
            z = v.resolveChild(D.fn.name)
          ;(w += k0(D)
            ? `transformed=await e.transform[${U}](c)
`
            : `transformed=e.transform[${U}](c)
`),
            D.subType === "mapDerive"
              ? (w +=
                  "if(transformed instanceof ElysiaCustomStatusResponse){" +
                  t0("transformed") +
                  `}else{transformed.request=c.request
transformed.store=c.store
transformed.qi=c.qi
transformed.path=c.path
transformed.url=c.url
transformed.redirect=c.redirect
transformed.set=c.set
transformed.error=c.error
c=transformed}`)
              : (w +=
                  "if(transformed instanceof ElysiaCustomStatusResponse){" +
                  t0("transformed") +
                  `}else Object.assign(c,transformed)
`),
            z()
        }
      }
      v.resolve()
    }
    const R1 = []
    if (Y) {
      if (Y.headers) {
        if (Y.headers.hasDefault)
          for (const [v, U] of Object.entries(S0.Default(Y.headers.schema, {}))) {
            const D =
              typeof U === "object" ? JSON.stringify(U) : typeof U === "string" ? `'${U}'` : U
            D !== void 0 &&
              (w += `c.headers['${v}']??=${D}
`)
          }
        ;(w += a6({ name: "c.headers", schema: Y.headers, type: "headers", normalize: b })),
          Y.headers.isOptional && (w += "if(isNotEmpty(c.headers)){"),
          Y.headers?.provider === "standard"
            ? (w +=
                `let vah=validator.headers.Check(c.headers)
if(vah instanceof Promise)vah=await vah
if(vah.issues){` +
                V.validate("headers", void 0, "vah.issues") +
                `}else{c.headers=vah.value}
`)
            : Y.headers?.schema?.noValidate !== !0 &&
              (w += `if(validator.headers.Check(c.headers) === false){${V.validate("headers")}}`),
          Y.headers.hasTransform &&
            (w += G6(
              `c.headers=validator.headers.Decode(c.headers)
`,
              "headers"
            )),
          Y.headers.isOptional && (w += "}")
      }
      if (Y.params) {
        if (Y.params.hasDefault)
          for (const [v, U] of Object.entries(S0.Default(Y.params.schema, {}))) {
            const D =
              typeof U === "object" ? JSON.stringify(U) : typeof U === "string" ? `'${U}'` : U
            D !== void 0 &&
              (w += `c.params['${v}']??=${D}
`)
          }
        Y.params.provider === "standard"
          ? (w +=
              `let vap=validator.params.Check(c.params)
if(vap instanceof Promise)vap=await vap
if(vap.issues){` +
              V.validate("params", void 0, "vap.issues") +
              `}else{c.params=vap.value}
`)
          : Y.params?.schema?.noValidate !== !0 &&
            (w += `if(validator.params.Check(c.params)===false){${V.validate("params")}}`),
          Y.params.hasTransform &&
            (w += G6(
              `c.params=validator.params.Decode(c.params)
`,
              "params"
            ))
      }
      if (Y.query) {
        if (L in Y.query?.schema && Y.query.hasDefault)
          for (const [v, U] of Object.entries(S0.Default(Y.query.schema, {}))) {
            const D =
              typeof U === "object" ? JSON.stringify(U) : typeof U === "string" ? `'${U}'` : U
            D !== void 0 &&
              (w += `if(c.query['${v}']===undefined)c.query['${v}']=${D}
`)
          }
        ;(w += a6({ name: "c.query", schema: Y.query, type: "query", normalize: b })),
          Y.query.isOptional && (w += "if(isNotEmpty(c.query)){"),
          Y.query.provider === "standard"
            ? (w +=
                `let vaq=validator.query.Check(c.query)
if(vaq instanceof Promise)vaq=await vaq
if(vaq.issues){` +
                V.validate("query", void 0, "vaq.issues") +
                `}else{c.query=vaq.value}
`)
            : Y.query?.schema?.noValidate !== !0 &&
              (w += `if(validator.query.Check(c.query)===false){${V.validate("query")}}`),
          Y.query.hasTransform &&
            ((w += G6(
              `c.query=validator.query.Decode(c.query)
`,
              "query"
            )),
            (w += G6(
              `c.query=validator.query.Decode(c.query)
`,
              "query"
            ))),
          Y.query.isOptional && (w += "}")
      }
      if (j && Y.body) {
        ;(Y.body.hasTransform || Y.body.isOptional) &&
          (w += `const isNotEmptyObject=c.body&&(typeof c.body==="object"&&(isNotEmpty(c.body)||c.body instanceof ArrayBuffer))
`)
        let v = n5(Y.body.schema),
          U = !1
        if (Y.body.hasDefault) {
          let D = S0.Default(
              Y.body.schema,
              Y.body.schema.type === "object" || A8(Y.body.schema)[L] === "Object" ? {} : void 0
            ),
            z = A8(Y.body.schema)
          if (!v && D && typeof D === "object" && (K$("File", z) || K$("Files", z))) {
            U = !0
            for (const [E, g] of Object.entries(D)) (g === "File" || g === "Files") && delete D[E]
            A0(D) || (D = void 0)
          }
          const x = typeof D === "object" ? JSON.stringify(D) : typeof D === "string" ? `'${D}'` : D
          D != null &&
            (Array.isArray(D)
              ? (w += `if(!c.body)c.body=${x}
`)
              : typeof D === "object"
                ? (w += `c.body=Object.assign(${x},c.body)
`)
                : (w += `c.body=${x}
`)),
            (w += a6({ name: "c.body", schema: Y.body, type: "body", normalize: b })),
            Y.body.provider === "standard"
              ? (w +=
                  `let vab=validator.body.Check(c.body)
if(vab instanceof Promise)vab=await vab
if(vab.issues){` +
                  V.validate("body", void 0, "vab.issues") +
                  `}else{c.body=vab.value}
`)
              : Y.body?.schema?.noValidate !== !0 &&
                (Y.body.isOptional
                  ? (w +=
                      "if(isNotEmptyObject&&validator.body.Check(c.body)===false){" +
                      V.validate("body") +
                      "}")
                  : (w += `if(validator.body.Check(c.body)===false){${V.validate("body")}}`))
        } else
          (w += a6({ name: "c.body", schema: Y.body, type: "body", normalize: b })),
            Y.body.provider === "standard"
              ? (w +=
                  `let vab=validator.body.Check(c.body)
if(vab instanceof Promise)vab=await vab
if(vab.issues){` +
                  V.validate("body", void 0, "vab.issues") +
                  `}else{c.body=vab.value}
`)
              : Y.body?.schema?.noValidate !== !0 &&
                (Y.body.isOptional
                  ? (w +=
                      "if(isNotEmptyObject&&validator.body.Check(c.body)===false){" +
                      V.validate("body") +
                      "}")
                  : (w += `if(validator.body.Check(c.body)===false){${V.validate("body")}}`))
        if (
          (Y.body.hasTransform &&
            (w += G6(
              `if(isNotEmptyObject)c.body=validator.body.Decode(c.body)
`,
              "body"
            )),
          v && Y.body.schema.anyOf?.length)
        ) {
          const D = Object.values(Y.body.schema.anyOf)
          for (let z = 0; z < D.length; z++) {
            const x = D[z]
            if (K$("File", x) || K$("Files", x)) {
              const E = c0(x, {
                modules: $.definitions.typebox,
                dynamic: !$.config.aot,
                models: $.definitions.type,
                normalize: $.config.normalize,
                additionalCoerce: r6(),
                sanitize: () => $.config.sanitize,
              })
              if (E) {
                let g = R1.length === 0,
                  t = Object.entries(x.properties),
                  D0 = g
                    ? `
`
                    : " else "
                D0 += `if(fileUnions[${R1.length}].Check(c.body)){`
                let i0 = "",
                  G1 = 0
                for (let P1 = 0; P1 < t.length; P1++) {
                  const [p$, O8] = t[P1]
                  !O8.extension ||
                    (O8[L] !== "File" && O8[L] !== "Files") ||
                    (G1 && (i0 += ","),
                    (i0 += `fileType(c.body.${p$},${JSON.stringify(O8.extension)},'body.${p$}')`),
                    G1++)
                }
                i0 &&
                  (G1 === 1
                    ? (D0 += `await ${i0}
`)
                    : G1 > 1 &&
                      (D0 += `await Promise.all([${i0}])
`),
                  (D0 += "}"),
                  (w += D0),
                  R1.push(E))
              }
            }
          }
        } else if (U || (!v && (K$("File", A8(Y.body.schema)) || K$("Files", A8(Y.body.schema))))) {
          let D = "",
            z = 0
          for (const [x, E] of Object.entries(A8(Y.body.schema).properties))
            !E.extension ||
              (E[L] !== "File" && E[L] !== "Files") ||
              (z && (D += ","),
              (D += `fileType(c.body.${x},${JSON.stringify(E.extension)},'body.${x}')`),
              z++)
          z &&
            (w += `
`),
            z === 1
              ? (w += `await ${D}
`)
              : z > 1 &&
                (w += `await Promise.all([${D}])
`)
        }
      }
      Y.cookie &&
        ((Y.cookie.config = y6(Y.cookie.config, Y.cookie?.config ?? {})),
        (w += `let cookieValue={}
for(const [key,value] of Object.entries(c.cookie))cookieValue[key]=value.value
`),
        Y.cookie.isOptional && (w += "if(isNotEmpty(c.cookie)){"),
        Y.cookie.provider === "standard"
          ? ((w +=
              `let vac=validator.cookie.Check(cookieValue)
if(vac instanceof Promise)vac=await vac
if(vac.issues){` +
              V.validate("cookie", void 0, "vac.issues") +
              `}else{cookieValue=vac.value}
`),
            (w += `for(const k of Object.keys(cookieValue))c.cookie[k].value=cookieValue[k]
`))
          : Y.body?.schema?.noValidate !== !0 &&
            ((w +=
              "if(validator.cookie.Check(cookieValue)===false){" +
              V.validate("cookie", "cookieValue") +
              "}"),
            Y.cookie.hasTransform &&
              (w += G6(
                "for(const [key,value] of Object.entries(validator.cookie.Decode(cookieValue))){c.cookie[key].value=value}",
                "cookie"
              ))),
        Y.cookie.isOptional && (w += "}"))
    }
    if (J?.beforeHandle || P) {
      let v = d("beforeHandle", { total: J.beforeHandle?.length }),
        U = !1
      if (J.beforeHandle?.length)
        for (let D = 0; D < J.beforeHandle.length; D++) {
          const z = J.beforeHandle[D],
            x = v.resolveChild(z.fn.name),
            E = e6(z)
          if (z.subType === "resolve" || z.subType === "mapResolve")
            U ||
              ((U = !0),
              (w += `
let resolved
`)),
              (w += k0(z)
                ? `resolved=await e.beforeHandle[${D}](c);
`
                : `resolved=e.beforeHandle[${D}](c);
`),
              z.subType === "mapResolve"
                ? (w +=
                    "if(resolved instanceof ElysiaCustomStatusResponse){" +
                    t0("resolved") +
                    `}else{resolved.request=c.request
resolved.store=c.store
resolved.qi=c.qi
resolved.path=c.path
resolved.url=c.url
resolved.redirect=c.redirect
resolved.set=c.set
resolved.error=c.error
c=resolved}`)
                : (w +=
                    "if(resolved instanceof ElysiaCustomStatusResponse){" +
                    t0("resolved") +
                    `}else Object.assign(c, resolved)
`),
              x()
          else if (!E)
            (w += k0(z)
              ? `await e.beforeHandle[${D}](c)
`
              : `e.beforeHandle[${D}](c)
`),
              x()
          else {
            if (
              ((w += k0(z)
                ? `be=await e.beforeHandle[${D}](c)
`
                : `be=e.beforeHandle[${D}](c)
`),
              x("be"),
              (w += "if(be!==undefined){"),
              v.resolve(),
              J.afterHandle?.length || P)
            ) {
              d("handle", { name: B ? Z.name : void 0 }).resolve()
              const t = d("afterHandle", { total: J.afterHandle?.length })
              if (J.afterHandle?.length)
                for (let D0 = 0; D0 < J.afterHandle.length; D0++) {
                  const i0 = J.afterHandle[D0],
                    G1 = e6(i0),
                    P1 = t.resolveChild(i0.fn.name)
                  ;(w += `c.response=c.responseValue=be
`),
                    G1
                      ? ((w += k0(i0.fn)
                          ? `af=await e.afterHandle[${D0}](c)
`
                          : `af=e.afterHandle[${D0}](c)
`),
                        (w += `if(af!==undefined) c.response=c.responseValue=be=af
`))
                      : (w += k0(i0.fn)
                          ? `await e.afterHandle[${D0}](c, be)
`
                          : `e.afterHandle[${D0}](c, be)
`),
                    P1("af")
                }
              t.resolve()
            }
            Y.response && (w += V.response("be"))
            const g = d("mapResponse", { total: J.mapResponse?.length })
            if (J.mapResponse?.length) {
              w += `c.response=c.responseValue=be
`
              for (let t = 0; t < J.mapResponse.length; t++) {
                const D0 = J.mapResponse[t],
                  i0 = g.resolveChild(D0.fn.name)
                ;(w += `if(mr===undefined){mr=${c$(D0) ? "await " : ""}e.mapResponse[${t}](c)
if(mr!==undefined)be=c.response=c.responseValue=mr}`),
                  i0()
              }
            }
            g.resolve(),
              (w += $1()),
              (w += k()),
              (w += `return mapEarlyResponse(${X0}be,c.set${F1})}
`)
          }
        }
      v.resolve()
    }
    if (J.afterHandle?.length || P) {
      const v = d("handle", { name: B ? Z.name : void 0 })
      J.afterHandle?.length
        ? (w += m
            ? `let r=c.response=c.responseValue=await ${N}
`
            : `let r=c.response=c.responseValue=${N}
`)
        : (w += m
            ? `let r=await ${N}
`
            : `let r=${N}
`),
        v.resolve()
      const U = d("afterHandle", { total: J.afterHandle?.length })
      if (J.afterHandle?.length)
        for (let z = 0; z < J.afterHandle.length; z++) {
          const x = J.afterHandle[z],
            E = e6(x),
            g = U.resolveChild(x.fn.name)
          E
            ? ((w += k0(x.fn)
                ? `af=await e.afterHandle[${z}](c)
`
                : `af=e.afterHandle[${z}](c)
`),
              g("af"),
              Y.response
                ? ((w += "if(af!==undefined){"),
                  U.resolve(),
                  (w += V.response("af")),
                  (w += "c.response=c.responseValue=af}"))
                : ((w += "if(af!==undefined){"),
                  U.resolve(),
                  (w += "c.response=c.responseValue=af}")))
            : ((w += k0(x.fn)
                ? `await e.afterHandle[${z}](c)
`
                : `e.afterHandle[${z}](c)
`),
              g())
        }
      U.resolve(),
        J.afterHandle?.length &&
          (w += `r=c.response
`),
        Y.response && (w += V.response()),
        (w += k())
      const D = d("mapResponse", { total: J.mapResponse?.length })
      if (J.mapResponse?.length)
        for (let z = 0; z < J.mapResponse.length; z++) {
          const x = J.mapResponse[z],
            E = D.resolveChild(x.fn.name)
          ;(w += `mr=${c$(x) ? "await " : ""}e.mapResponse[${z}](c)
if(mr!==undefined)r=c.response=c.responseValue=mr
`),
            E()
        }
      D.resolve(), (w += t0())
    } else {
      const v = d("handle", { name: B ? Z.name : void 0 })
      if (Y.response || J.mapResponse?.length || P) {
        ;(w += m
          ? `let r=await ${N}
`
          : `let r=${N}
`),
          v.resolve(),
          Y.response && (w += V.response())
        const U = d("mapResponse", { total: J.mapResponse?.length })
        if (J.mapResponse?.length) {
          w += `
c.response=c.responseValue=r
`
          for (let D = 0; D < J.mapResponse.length; D++) {
            const z = J.mapResponse[D],
              x = U.resolveChild(z.fn.name)
            ;(w += `
if(mr===undefined){mr=${c$(z) ? "await " : ""}e.mapResponse[${D}](c)
if(mr!==undefined)r=c.response=c.responseValue=mr}
`),
              x()
          }
        }
        U.resolve(),
          (w += k()),
          Z instanceof Response
            ? ((w += $1()),
              (w += q.set
                ? `if(isNotEmpty(c.set.headers)||c.set.status!==200||c.set.redirect||c.set.cookie)return mapResponse(${X0}${N}.clone(),c.set${F1})
else return ${N}.clone()`
                : `return ${N}.clone()`),
              (w += `
`))
            : (w += t0())
      } else if (n || P) {
        ;(w += m
          ? `let r=await ${N}
`
          : `let r=${N}
`),
          v.resolve()
        const U = d("mapResponse", { total: J.mapResponse?.length })
        if (J.mapResponse?.length) {
          w += `c.response=c.responseValue= r
`
          for (let D = 0; D < J.mapResponse.length; D++) {
            const z = J.mapResponse[D],
              x = U.resolveChild(z.fn.name)
            ;(w += `if(mr===undefined){mr=${c$(z) ? "await " : ""}e.mapResponse[${D}](c)
if(mr!==undefined)r=c.response=c.responseValue=mr}`),
              x()
          }
        }
        U.resolve(), (w += k() + t0())
      } else {
        v.resolve()
        const U = m ? `await ${N}` : N
        Z instanceof Response
          ? ((w += $1()),
            (w += q.set
              ? `if(isNotEmpty(c.set.headers)||c.set.status!==200||c.set.redirect||c.set.cookie)return mapResponse(${X0}${N}.clone(),c.set${F1})
else return ${N}.clone()
`
              : `return ${N}.clone()
`))
          : (w += t0(U))
      }
    }
    if (
      ((w += `
}catch(error){`),
      !j$ && J.error?.length && (w += "return(async()=>{"),
      (w += `const set=c.set
if(!set.status||set.status<300)set.status=error?.status||500
`),
      n && (w += k()),
      P && J.trace)
    )
      for (let v = 0; v < J.trace.length; v++)
        w += `report${v}?.resolve(error);reportChild${v}?.(error)
`
    const f2 = d("error", { total: J.error?.length })
    if (J.error?.length) {
      ;(w += `c.error=error
`),
        H
          ? (w += `if(error instanceof TypeBoxError){c.code="VALIDATION"
c.set.status=422}else{c.code=error.code??error[ERROR_CODE]??"UNKNOWN"}`)
          : (w += `c.code=error.code??error[ERROR_CODE]??"UNKNOWN"
`),
        (w += `let er
`),
        J.mapResponse?.length &&
          (w += `let mep
`)
      for (let v = 0; v < J.error.length; v++) {
        const U = f2.resolveChild(J.error[v].fn.name)
        if (
          (k0(J.error[v])
            ? (w += `er=await e.error[${v}](c)
`)
            : (w += `er=e.error[${v}](c)
if(er instanceof Promise)er=await er
`),
          U(),
          J.mapResponse?.length)
        ) {
          const D = d("mapResponse", { total: J.mapResponse?.length })
          for (let z = 0; z < J.mapResponse.length; z++) {
            const x = J.mapResponse[z],
              E = D.resolveChild(x.fn.name)
            ;(w += `c.response=c.responseValue=er
mep=e.mapResponse[${z}](c)
if(mep instanceof Promise)er=await er
if(mep!==undefined)er=mep
`),
              E()
          }
          D.resolve()
        }
        if (
          ((w += `er=mapEarlyResponse(er,set${F1})
`),
          (w += "if(er){"),
          P && J.trace)
        ) {
          for (let D = 0; D < J.trace.length; D++)
            w += `report${D}.resolve()
`
          f2.resolve()
        }
        w += "return er}"
      }
    }
    f2.resolve(),
      (w += "return handleError(c,error,true)"),
      !j$ && J.error?.length && (w += "})()"),
      (w += "}")
    let D8 = M.inject ? `${Object.keys(M.inject).join(",")},` : "",
      e1 =
        "const {handler,handleError,hooks:e, " +
        p0("validator,", H) +
        "mapResponse,mapCompactResponse,mapEarlyResponse,isNotEmpty,utils:{" +
        p0("parseQuery,", j) +
        p0("parseQueryFromURL,", A) +
        "},error:{" +
        p0("ValidationError,", H) +
        p0("ParseError", j) +
        "},fileType,schema,definitions,ERROR_CODE," +
        p0("parseCookie,", n) +
        p0("signCookie,", n) +
        p0("decodeURIComponent,", A) +
        "ElysiaCustomStatusResponse," +
        p0("ELYSIA_TRACE,", P) +
        p0("ELYSIA_REQUEST_ID,", P) +
        p0("parser,", J.parse?.length) +
        p0("getServer,", q.server) +
        p0("fileUnions,", R1.length) +
        D8 +
        p0("TypeBoxError", H) +
        `}=hooks
const trace=e.trace
return ${j$ ? "async " : ""}function handle(c){`
    J.beforeHandle?.length &&
      (e1 += `let be
`),
      J.afterHandle?.length &&
        (e1 += `let af
`),
      J.mapResponse?.length &&
        (e1 += `let mr
`),
      W &&
        (e1 += `c.schema=schema
c.defs=definitions
`),
      (w = `${e1 + w}}`),
      (e1 = "")
    try {
      return Function(
        "hooks",
        `"use strict";
${w}`
      )({
        handler: Z,
        hooks: FJ(J),
        validator: H ? Y : void 0,
        handleError: $.handleError,
        mapResponse: G.mapResponse,
        mapCompactResponse: G.mapCompactResponse,
        mapEarlyResponse: G.mapEarlyResponse,
        isNotEmpty: A0,
        utils: {
          parseQuery: j ? u$ : void 0,
          parseQueryFromURL: A ? (Y.query?.provider === "standard" ? h5 : oJ) : void 0,
        },
        error: { ValidationError: H ? a : void 0, ParseError: j ? oX : void 0 },
        fileType: JQ,
        schema: $.router.history,
        definitions: $.definitions.type,
        ERROR_CODE: W8,
        parseCookie: n ? qQ : void 0,
        signCookie: n ? o8 : void 0,
        decodeURIComponent: A ? l5.default : void 0,
        ElysiaCustomStatusResponse: o0,
        ELYSIA_TRACE: P ? H8 : void 0,
        ELYSIA_REQUEST_ID: P ? z$ : void 0,
        getServer: q.server ? () => $.getServer() : void 0,
        fileUnions: R1.length ? R1 : void 0,
        TypeBoxError: H ? p : void 0,
        parser: $["~parser"],
        ...M.inject,
      })
    } catch (v) {
      const U = FJ(J)
      console.log("[Composer] failed to generate optimized handler"),
        console.log("---"),
        console.log({
          handler: typeof Z === "function" ? Z.toString() : Z,
          instruction: w,
          hooks: {
            ...U,
            transform: U?.transform?.map?.((D) => D.toString()),
            resolve: U?.resolve?.map?.((D) => D.toString()),
            beforeHandle: U?.beforeHandle?.map?.((D) => D.toString()),
            afterHandle: U?.afterHandle?.map?.((D) => D.toString()),
            mapResponse: U?.mapResponse?.map?.((D) => D.toString()),
            parse: U?.parse?.map?.((D) => D.toString()),
            error: U?.error?.map?.((D) => D.toString()),
            afterResponse: U?.afterResponse?.map?.((D) => D.toString()),
            stop: U?.stop?.map?.((D) => D.toString()),
          },
          validator: Y,
          definitions: $.definitions.type,
          error: v,
        }),
        console.log("---"),
        process.exit(1)
    }
  },
  eJ = ($, X) => {
    let Q = "",
      J = $X({
        trace: $.event.trace,
        addFn:
          X ??
          ((Y) => {
            Q += Y
          }),
      })("request", { total: $.event.request?.length })
    if ($.event.request?.length) {
      Q += "try{"
      for (let Y = 0; Y < $.event.request.length; Y++) {
        const Z = $.event.request[Y],
          W = e6(Z),
          q = k0(Z),
          M = J.resolveChild($.event.request[Y].fn.name)
        W
          ? ((Q += `re=mapEarlyResponse(${q ? "await " : ""}onRequest[${Y}](c),c.set)
`),
            M("re"),
            (Q += `if(re!==undefined)return re
`))
          : ((Q += `${q ? "await " : ""}onRequest[${Y}](c)
`),
            M())
      }
      Q += "}catch(error){return app.handleError(c,error,false)}"
    }
    return J.resolve(), Q
  },
  $Y = ($, X = "map") => {
    const Q = $.extender.higherOrderFunctions
    if (!Q.length) return `return ${X}`
    let J = $["~adapter"].composeGeneralHandler,
      Y = X
    for (let Z = 0; Z < Q.length; Z++) Y = `hoc[${Z}](${Y},${J.parameters})`
    return `return function hocMap(${J.parameters}){return ${Y}(${J.parameters})}`
  },
  LQ = ($) => {
    const X = $["~adapter"].composeGeneralHandler
    $.router.http.build()
    let Q = $["~adapter"].isWebStandard,
      J = $.event.trace?.length,
      Y = "",
      Z = $.router,
      W = Z.http.root.WS
        ? "const route=router.find(r.method==='GET'&&r.headers.get('upgrade')==='websocket'?'WS':r.method,p)"
        : "const route=router.find(r.method,p)"
    ;(W += Z.http.root.ALL
      ? `??router.find('ALL',p)
`
      : `
`),
      Q &&
        (W += `if(r.method==='HEAD'){const route=router.find('GET',p)
if(route){c.params=route.params
const _res=route.store.handler?route.store.handler(c):route.store.compile()(c)
if(_res)return getResponseLength(_res).then((length)=>{_res.headers.set('content-length', length)
return new Response(null,{status:_res.status,statusText:_res.statusText,headers:_res.headers})
})}}`)
    let q = `c.error=notFound
`
    if ($.event.afterResponse?.length && !$.event.error) {
      q = `
c.error=notFound
`
      const H = $.event.afterResponse.some(k0) ? "async" : ""
      q += `
setImmediate(${H}()=>{`
      for (let A = 0; A < $.event.afterResponse.length; A++) {
        const S = $.event.afterResponse[A].fn
        q += `
${c$(S) ? "await " : ""}afterResponse[${A}](c)
`
      }
      q += `})
`
    }
    $.inference.query &&
      (q += `
if(c.qi===-1){c.query={}}else{c.query=parseQueryFromURL(c.url,c.qi+1)}`)
    const M = X.error404(!!$.event.request?.length, !!$.event.error?.length, q)
    ;(W += M.code),
      (W += `
c.params=route.params
if(route.store.handler)return route.store.handler(c)
return route.store.compile()(c)
`)
    let G = ""
    for (const [H, A] of Object.entries(Z.static)) {
      ;(G += `case'${H}':`), $.config.strictPath !== !0 && (G += `case'${Y8(H)}':`)
      const S = Z8(H)
      H !== S && (G += `case'${S}':`),
        (G += "switch(r.method){"),
        ("GET" in A || "WS" in A) &&
          ((G += "case 'GET':"),
          "WS" in A &&
            ((G += `if(r.headers.get('upgrade')==='websocket')return ht[${A.WS}].composed(c)
`),
            "GET" in A ||
              ("ALL" in A
                ? (G += `return ht[${A.ALL}].composed(c)
`)
                : (G += `break map
`))),
          "GET" in A &&
            (G += `return ht[${A.GET}].composed(c)
`)),
        Q &&
          ("GET" in A || "ALL" in A) &&
          !("HEAD" in A) &&
          (G += `case 'HEAD':const _res=ht[${A.GET ?? A.ALL}].composed(c)
return getResponseLength(_res).then((length)=>{_res.headers.set('content-length', length)
return new Response(null,{status:_res.status,statusText:_res.statusText,headers:_res.headers})
})
`)
      for (const [j, K] of Object.entries(A))
        j === "ALL" ||
          j === "GET" ||
          j === "WS" ||
          (G += `case '${j}':return ht[${K}].composed(c)
`)
      "ALL" in A
        ? (G += `default:return ht[${A.ALL}].composed(c)
`)
        : (G += `default:break map
`),
        (G += "}")
    }
    const B = !!$.event.request?.some(k0),
      N = X.inject ? `${Object.keys(X.inject).join(",")},` : ""
    ;(Y +=
      `
const {app,mapEarlyResponse,NotFoundError,randomId,handleError,status,redirect,getResponseLength,` +
      p0("parseQueryFromURL,", $.inference.query) +
      p0("ELYSIA_TRACE,", J) +
      p0("ELYSIA_REQUEST_ID,", J) +
      N +
      `}=data
const store=app.singleton.store
const decorator=app.singleton.decorator
const staticRouter=app.router.static.http
const ht=app.router.history
const router=app.router.http
const trace=app.event.trace?.map(x=>typeof x==='function'?x:x.fn)??[]
const notFound=new NotFoundError()
const hoc=app.extender.higherOrderFunctions.map(x=>x.fn)
`),
      $.event.request?.length &&
        (Y += `const onRequest=app.event.request.map(x=>x.fn)
`),
      $.event.afterResponse?.length &&
        (Y += `const afterResponse=app.event.afterResponse.map(x=>x.fn)
`),
      (Y += M.declare),
      $.event.trace?.length &&
        (Y +=
          "const " +
          $.event.trace.map((_H, A) => `tr${A}=app.event.trace[${A}].fn`).join(",") +
          `
`),
      (Y += `${B ? "async " : ""}function map(${X.parameters}){`),
      $.event.request?.length &&
        (Y += `let re
`),
      (Y += X.createContext($)),
      $.event.trace?.length &&
        (Y +=
          "c[ELYSIA_TRACE]=[" +
          $.event.trace.map((_H, A) => `tr${A}(c)`).join(",") +
          `]
`),
      (Y += eJ($)),
      G &&
        (Y +=
          `
map: switch(p){
` +
          G +
          "}"),
      (Y +=
        W +
        `}
` +
        $Y($))
    const P = XY($)
    $.handleError = P
    const w = Function(
      "data",
      `"use strict";
${Y}`
    )({
      app: $,
      mapEarlyResponse: $["~adapter"].handler.mapEarlyResponse,
      NotFoundError: l8,
      randomId: d$,
      handleError: P,
      status: m2,
      redirect: U$,
      getResponseLength: PW,
      parseQueryFromURL: $.inference.query ? oJ : void 0,
      ELYSIA_TRACE: J ? H8 : void 0,
      ELYSIA_REQUEST_ID: J ? z$ : void 0,
      ...X.inject,
    })
    return E2 && Bun.gc(!1), w
  },
  XY = ($) => {
    let X = $.event,
      Q = "",
      J = $["~adapter"].composeError,
      Y = J.inject ? `${Object.keys(J.inject).join(",")},` : "",
      Z = !!$.event.trace?.length
    ;(Q +=
      "const {mapResponse,ERROR_CODE,ElysiaCustomStatusResponse," +
      p0("onError,", $.event.error) +
      p0("afterResponse,", $.event.afterResponse) +
      p0("trace,", $.event.trace) +
      p0("onMapResponse,", $.event.mapResponse) +
      p0("ELYSIA_TRACE,", Z) +
      p0("ELYSIA_REQUEST_ID,", Z) +
      Y +
      `}=inject
`),
      (Q += `return ${$.event.error?.find(k0) || $.event.mapResponse?.find(k0) ? "async " : ""}function(context,error,skipGlobal){`),
      (Q += ""),
      Z &&
        (Q += `const id=context[ELYSIA_REQUEST_ID]
`)
    const W = $X({
        context: "context",
        trace: X.trace,
        addFn: (N) => {
          Q += N
        },
      }),
      q = () => {
        if (!X.afterResponse?.length && !Z) return ""
        let N = "",
          P = X.afterResponse?.some(k0) ? "async" : ""
        N += `
setImmediate(${P}()=>{`
        const w = $X({
          context: "context",
          trace: X.trace,
          addFn: (H) => {
            N += H
          },
        })("afterResponse", { total: X.afterResponse?.length, name: "context" })
        if (X.afterResponse?.length && X.afterResponse)
          for (let H = 0; H < X.afterResponse.length; H++) {
            const A = X.afterResponse[H].fn,
              S = w.resolveChild(A.name)
            ;(N += `
${c$(A) ? "await " : ""}afterResponse[${H}](context)
`),
              S()
          }
        return (
          w.resolve(),
          (N += `})
`),
          N
        )
      }
    ;(Q += `const set=context.set
let _r
if(!context.code)context.code=error.code??error[ERROR_CODE]
if(!(context.error instanceof Error))context.error=error
if(error instanceof ElysiaCustomStatusResponse){set.status=error.status=error.code
error.message=error.response}`),
      J.declare && (Q += J.declare)
    const M = Z || X.afterResponse?.length ? "context.response = " : ""
    if ($.event.error)
      for (let N = 0; N < $.event.error.length; N++) {
        const P = $.event.error[N],
          w = `${k0(P) ? "await " : ""}onError[${N}](context)
`
        if (((Q += "if(skipGlobal!==true){"), e6(P))) {
          Q +=
            `_r=${w}
if(_r!==undefined){if(_r instanceof Response){` +
            q() +
            `return mapResponse(_r,set${J.mapResponseContext})}if(_r instanceof ElysiaCustomStatusResponse){error.status=error.code
error.message = error.response}if(set.status===200||!set.status)set.status=error.status
`
          const H = W("mapResponse", { total: X.mapResponse?.length, name: "context" })
          if (X.mapResponse?.length)
            for (let A = 0; A < X.mapResponse.length; A++) {
              const S = X.mapResponse[A],
                j = H.resolveChild(S.fn.name)
              ;(Q += `context.response=context.responseValue=_r_r=${c$(S) ? "await " : ""}onMapResponse[${A}](context)
`),
                j()
            }
          H.resolve(), (Q += `${q()}return mapResponse(${M}_r,set${J.mapResponseContext})}`)
        } else Q += w
        Q += "}"
      }
    ;(Q +=
      `if(error.constructor.name==="ValidationError"||error.constructor.name==="TransformDecodeError"){
if(error.error)error=error.error
set.status=error.status??422
` +
      q() +
      J.validationError +
      `
}
`),
      (Q +=
        "if(error instanceof Error){" +
        q() +
        `
if(typeof error.toResponse==='function')return context.response=context.responseValue=error.toResponse()
` +
        J.unknownError +
        `
}`)
    const G = W("mapResponse", { total: X.mapResponse?.length, name: "context" })
    if (
      ((Q += `
if(!context.response)context.response=context.responseValue=error.message??error
`),
      X.mapResponse?.length)
    ) {
      Q += `let mr
`
      for (let N = 0; N < X.mapResponse.length; N++) {
        const P = X.mapResponse[N],
          w = G.resolveChild(P.fn.name)
        ;(Q += `if(mr===undefined){mr=${c$(P) ? "await " : ""}onMapResponse[${N}](context)
if(mr!==undefined)error=context.response=context.responseValue=mr}`),
          w()
      }
    }
    G.resolve(),
      (Q +=
        q() +
        `
return mapResponse(${M}error,set${J.mapResponseContext})}`)
    const B = (N) => (typeof N === "function" ? N : N.fn)
    return Function(
      "inject",
      `"use strict";
${Q}`
    )({
      mapResponse: $["~adapter"].handler.mapResponse,
      ERROR_CODE: W8,
      ElysiaCustomStatusResponse: o0,
      onError: $.event.error?.map(B),
      afterResponse: $.event.afterResponse?.map(B),
      trace: $.event.trace?.map(B),
      onMapResponse: $.event.mapResponse?.map(B),
      ELYSIA_TRACE: Z ? H8 : void 0,
      ELYSIA_REQUEST_ID: Z ? z$ : void 0,
      ...J.inject,
    })
  }
var S$ = ($, X) => (X ? $ : ""),
  s5 = ($, X, Q, J = !1) => {
    let Y = "",
      Z = $.setHeaders,
      W = !!$.event.trace?.length
    W &&
      (Y += `const id=randomId()
`)
    const q = /[:*]/.test(X.path),
      M = `const u=request.url,s=u.indexOf('/',${($.config.handler?.standardHostname ?? !0) ? 11 : 7}),qi=u.indexOf('?', s + 1)
`,
      G =
        Q.query ||
        !!X.hooks.query ||
        !!X.hooks.standaloneValidator?.find((N) => N.query) ||
        $.event.request?.length
    G && (Y += M)
    const B = Q.path
      ? q
        ? "get path(){" +
          (G ? "" : M) +
          `if(qi===-1)return u.substring(s)
return u.substring(s,qi)
},`
        : `path:'${X.path}',`
      : ""
    ;(Y +=
      S$("const c=", !J) +
      "{request,store," +
      S$("qi,", G) +
      S$("params:request.params,", q) +
      B +
      S$("url:request.url,", W || Q.url || G) +
      "redirect,status,set:{headers:" +
      (A0(Z) ? "Object.assign({},app.setHeaders)" : "Object.create(null)") +
      ",status:200}"),
      Q.server && (Y += ",get server(){return app.getServer()}"),
      W && (Y += ",[ELYSIA_REQUEST_ID]:id")
    {
      let N = ""
      for (const P of Object.keys($.singleton.decorator)) N += `,'${P}':decorator['${P}']`
      Y += N
    }
    return (
      (Y += `}
`),
      Y
    )
  },
  KQ = ($, X) => {
    let Q = !!$.event.trace?.length,
      J = !!$.extender.higherOrderFunctions.length,
      Y = U8(X.hooks, $.inference)
    Y = U8({ handler: X.handler }, Y)
    let Z =
      "const handler=data.handler,app=data.app,store=data.store,decorator=data.decorator,redirect=data.redirect,route=data.route,mapEarlyResponse=data.mapEarlyResponse," +
      S$("randomId=data.randomId,", Q) +
      S$("ELYSIA_REQUEST_ID=data.ELYSIA_REQUEST_ID,", Q) +
      S$("ELYSIA_TRACE=data.ELYSIA_TRACE,", Q) +
      S$("trace=data.trace,", Q) +
      S$("hoc=data.hoc,", J) +
      `status=data.status
`
    $.event.request?.length &&
      (Z += `const onRequest=app.event.request.map(x=>x.fn)
`),
      (Z += `${$.event.request?.find(k0) ? "async" : ""} function map(request){`)
    const W = Y.query || !!X.hooks.query || !!X.hooks.standaloneValidator?.find((q) => q.query)
    return (
      Q || W || $.event.request?.length
        ? ((Z += s5($, X, Y)), (Z += eJ($)), (Z += "return handler(c)}"))
        : (Z += `return handler(${s5($, X, Y, !0)})}`),
      (Z += $Y($)),
      Function(
        "data",
        Z
      )({
        app: $,
        handler: X.compile?.() ?? X.composed,
        redirect: U$,
        status: m2,
        hoc: $.extender.higherOrderFunctions.map((q) => q.fn),
        store: $.store,
        decorator: $.decorator,
        route: X.path,
        randomId: Q ? d$ : void 0,
        ELYSIA_TRACE: Q ? H8 : void 0,
        ELYSIA_REQUEST_ID: Q ? z$ : void 0,
        trace: Q ? $.event.trace?.map((q) => q?.fn ?? q) : void 0,
        mapEarlyResponse: D1,
      })
    )
  }
var r5 = ($, X, Q) => {
  if (typeof $ === "function" || $ instanceof Blob) return
  if (SQ($)) return () => $
  const J = O1($, Q ?? { headers: {} })
  if (!X.parse?.length && !X.transform?.length && !X.beforeHandle?.length && !X.afterHandle?.length)
    return J instanceof Promise
      ? J.then((Y) => {
          if (Y)
            return (
              Y.headers.has("content-type") || Y.headers.append("content-type", "text/plain"),
              Y.clone()
            )
        })
      : (J.headers.has("content-type") || J.headers.append("content-type", "text/plain"),
        () => J.clone())
}
var QY = {
  open($) {
    $.data.open?.($)
  },
  message($, X) {
    $.data.message?.($, X)
  },
  drain($) {
    $.data.drain?.($)
  },
  close($, X, Q) {
    $.data.close?.($, X, Q)
  },
}
class N6 {
  constructor($, X, Q = void 0) {
    ;(this.raw = $),
      (this.data = X),
      (this.body = Q),
      (this.validator = $.data?.validator),
      (this.sendText = $.sendText.bind($)),
      (this.sendBinary = $.sendBinary.bind($)),
      (this.close = $.close.bind($)),
      (this.terminate = $.terminate.bind($)),
      (this.publishText = $.publishText.bind($)),
      (this.publishBinary = $.publishBinary.bind($)),
      (this.subscribe = $.subscribe.bind($)),
      (this.unsubscribe = $.unsubscribe.bind($)),
      (this.isSubscribed = $.isSubscribed.bind($)),
      (this.cork = $.cork.bind($)),
      (this.remoteAddress = $.remoteAddress),
      (this.binaryType = $.binaryType),
      (this.data = $.data),
      (this.send = this.send.bind(this)),
      (this.ping = this.ping.bind(this)),
      (this.pong = this.pong.bind(this)),
      (this.publish = this.publish.bind(this))
  }
  send($, X) {
    return Buffer.isBuffer($)
      ? this.raw.send($, X)
      : this.validator?.Check($) === !1
        ? this.raw.send(new a("message", this.validator, $).message)
        : (typeof $ === "object" && ($ = JSON.stringify($)), this.raw.send($, X))
  }
  ping($) {
    return Buffer.isBuffer($)
      ? this.raw.ping($)
      : this.validator?.Check($) === !1
        ? this.raw.send(new a("message", this.validator, $).message)
        : (typeof $ === "object" && ($ = JSON.stringify($)), this.raw.ping($))
  }
  pong($) {
    return Buffer.isBuffer($)
      ? this.raw.pong($)
      : this.validator?.Check($) === !1
        ? this.raw.send(new a("message", this.validator, $).message)
        : (typeof $ === "object" && ($ = JSON.stringify($)), this.raw.pong($))
  }
  publish($, X, Q) {
    return Buffer.isBuffer(X)
      ? this.raw.publish($, X, Q)
      : this.validator?.Check(X) === !1
        ? this.raw.send(new a("message", this.validator, X).message)
        : (typeof X === "object" && (X = JSON.stringify(X)), this.raw.publish($, X, Q))
  }
  get readyState() {
    return this.raw.readyState
  }
  get id() {
    return this.data.id
  }
}
var a5 = ($) => {
    const X = typeof $ === "function" ? [$] : $
    return async (Q, J) => {
      if (typeof J === "string") {
        const Y = J?.charCodeAt(0)
        if (Y === 34 || Y === 47 || Y === 91 || Y === 123)
          try {
            J = JSON.parse(J)
          } catch {}
        else
          pX(J)
            ? (J = +J)
            : J === "true"
              ? (J = !0)
              : J === "false"
                ? (J = !1)
                : J === "null" && (J = null)
      }
      if (X)
        for (let Y = 0; Y < X.length; Y++) {
          let Z = X[Y](Q, J)
          if ((Z instanceof Promise && (Z = await Z), Z !== void 0)) return Z
        }
      return J
    }
  },
  e5 = ($) => {
    const X = (Q, J) => {
      if (J instanceof Promise) return J.then((W) => X(Q, W))
      if (Buffer.isBuffer(J)) return Q.send(J.toString())
      if (J === void 0) return
      const Y = (W) => {
        if ($?.Check(W) === !1) return Q.send(new a("message", $, W).message)
        if (typeof W === "object") return Q.send(JSON.stringify(W))
        Q.send(W)
      }
      if (typeof J?.next !== "function") return void Y(J)
      const Z = J.next()
      if (Z instanceof Promise)
        return (async () => {
          const W = await Z
          if ($?.Check(W) === !1) return Q.send(new a("message", $, W).message)
          if ((Y(W.value), !W.done)) for await (const q of J) Y(q)
        })()
      if ((Y(Z.value), !Z.done)) for (const W of J) Y(W)
    }
    return X
  }
var YD = /:.+?\?(?=\/|$)/,
  $7 = ($) => {
    const X = YD.exec($)
    if (!X) return [$]
    const Q = [],
      J = $.slice(0, X.index),
      Y = X[0].slice(0, -1),
      Z = $.slice(X.index + X[0].length)
    Q.push(J.slice(0, -1)), Q.push(J + Y)
    for (const W of $7(Z))
      W && (W.startsWith("/:") || Q.push(J.slice(0, -1) + W), Q.push(J + Y + W))
    return Q
  },
  SQ = ($) =>
    typeof $ === "object" &&
    $ !== null &&
    ($.toString() === "[object HTMLBundle]" || typeof $.index === "string"),
  X7 = { GET: !0, HEAD: !0, OPTIONS: !0, DELETE: !0, PATCH: !0, POST: !0, PUT: !0 },
  JY = ($) => {
    if (!$.config.aot || !$.config.systemRouter) return
    const X = {},
      Q = (Y, Z) => {
        const W = encodeURI(Y.path)
        X[W] ? X[W][Y.method] || (X[W][Y.method] = Z) : (X[W] = { [Y.method]: Z })
      },
      J = $.routeTree
    for (const Y of $.router.history) {
      if (typeof Y.handler !== "function") continue
      const Z = Y.method
      if (
        (Z === "GET" && `WS_${Y.path}` in J) ||
        Z === "WS" ||
        Y.path.charCodeAt(Y.path.length - 1) === 42 ||
        !(Z in X7)
      )
        continue
      if (Z === "ALL") {
        ;`WS_${Y.path}` in J ||
          (X[Y.path] = Y.hooks?.config?.mount
            ? Y.hooks.trace || $.event.trace || $.extender.higherOrderFunctions
              ? KQ($, Y)
              : Y.hooks.mount || Y.handler
            : Y.handler)
        continue
      }
      let W,
        q = $.config.precompile ? KQ($, Y) : (M) => (W ? W(M) : (W = KQ($, Y))(M))
      for (const M of $7(Y.path)) Q({ method: Z, path: M }, q)
    }
    return X
  },
  w6 = ($, X) => {
    if (!X) return $
    for (const Q of Object.keys(X))
      if ($[Q] !== X[Q]) {
        if (!$[Q]) {
          $[Q] = X[Q]
          continue
        }
        if ($[Q] && X[Q]) {
          if (typeof $[Q] === "function" || $[Q] instanceof Response) {
            $[Q] = X[Q]
            continue
          }
          $[Q] = { ...$[Q], ...X[Q] }
        }
      }
    return $
  },
  Q7 = {
    ...D$,
    name: "bun",
    handler: {
      mapResponse: O1,
      mapEarlyResponse: D1,
      mapCompactResponse: o2,
      createStaticHandler: d5,
      createNativeStaticHandler: r5,
    },
    composeHandler: {
      ...D$.composeHandler,
      headers: f6
        ? `c.headers=c.request.headers.toJSON()
`
        : `c.headers={}
for(const [k,v] of c.request.headers.entries())c.headers[k]=v
`,
    },
    listen($) {
      return (X, Q) => {
        if (typeof Bun > "u")
          throw Error(
            ".listen() is designed to run on Bun only. If you are running Elysia in other environment please use a dedicated plugin or export the handler via Elysia.fetch"
          )
        if (($.compile(), typeof X === "string")) {
          if (!pX(X)) throw Error("Port must be a numeric value")
          X = parseInt(X, 10)
        }
        const J = (Z, { withAsync: W = !1 } = {}) => {
            const q = {},
              M = []
            for (let [G, B] of Object.entries(Z))
              if (((G = encodeURI(G)), nX)) {
                if (!B) continue
                for (const [N, P] of Object.entries(B))
                  if (!(!P || !(N in X7))) {
                    if (P instanceof Promise) {
                      W &&
                        (q[G] || (q[G] = {}),
                        M.push(
                          P.then((w) => {
                            w instanceof Response && (q[G][N] = w), SQ(w) && (q[G][N] = w)
                          })
                        ))
                      continue
                    }
                    ;(!(P instanceof Response) && !SQ(P)) || (q[G] || (q[G] = {}), (q[G][N] = P))
                  }
              } else {
                if (!B) continue
                if (B instanceof Promise) {
                  W &&
                    (q[G] || (q[G] = {}),
                    M.push(
                      B.then((N) => {
                        N instanceof Response && (q[G] = N)
                      })
                    ))
                  continue
                }
                if (!(B instanceof Response)) continue
                q[G] = B
              }
            return W ? Promise.all(M).then(() => q) : q
          },
          Y =
            typeof X === "object"
              ? {
                  development: !A$,
                  reusePort: !0,
                  idleTimeout: 30,
                  ...($.config.serve || {}),
                  ...(X || {}),
                  routes: w6(w6(J($.router.response), JY($)), $.config.serve?.routes),
                  websocket: {
                    ...($.config.websocket || {}),
                    ...(QY || {}),
                    ...(X.websocket || {}),
                  },
                  fetch: $.fetch,
                }
              : {
                  development: !A$,
                  reusePort: !0,
                  idleTimeout: 30,
                  ...($.config.serve || {}),
                  routes: w6(w6(J($.router.response), JY($)), $.config.serve?.routes),
                  websocket: { ...($.config.websocket || {}), ...(QY || {}) },
                  port: X,
                  fetch: $.fetch,
                }
        if ((($.server = Bun.serve(Y)), $.event.start))
          for (let Z = 0; Z < $.event.start.length; Z++) $.event.start[Z].fn($)
        Q?.($.server),
          process.on("beforeExit", () => {
            if ($.server && ($.server.stop?.(), ($.server = null), $.event.stop))
              for (let Z = 0; Z < $.event.stop.length; Z++) $.event.stop[Z].fn($)
          }),
          $.promisedModules.then(async () => {
            $.server?.reload({
              ...Y,
              fetch: $.fetch,
              routes: w6(
                w6(await J($.router.response, { withAsync: !0 }), JY($)),
                $.config.serve?.routes
              ),
            }),
              Bun?.gc(!1)
          })
      }
    },
    async stop($, X) {
      if ($.server) {
        if (($.server.stop(X), ($.server = null), $.event.stop?.length))
          for (let Q = 0; Q < $.event.stop.length; Q++) $.event.stop[Q].fn($)
      } else
        console.log("Elysia isn't running. Call `app.listen` to start the server.", Error().stack)
    },
    ws($, X, Q) {
      const { parse: J, body: Y, response: Z, ...W } = Q,
        q = c0(Y, {
          modules: $.definitions.typebox,
          models: $.definitions.type,
          normalize: $.config.normalize,
        }),
        M = c0(Z, {
          modules: $.definitions.typebox,
          models: $.definitions.type,
          normalize: $.config.normalize,
        })
      $.route(
        "WS",
        X,
        async (G) => {
          const B = G.server ?? $.server,
            { set: N, path: P, qi: w, headers: H, query: A, params: S } = G
          if (((G.validator = M), Q.upgrade))
            if (typeof Q.upgrade === "function") {
              const I = Q.upgrade(G)
              I instanceof Promise && (await I)
            } else Q.upgrade && Object.assign(N.headers, Q.upgrade)
          if (N.cookie && A0(N.cookie)) {
            const I = n6(N.cookie)
            I && (N.headers["set-cookie"] = I)
          }
          N.headers["set-cookie"] &&
            Array.isArray(N.headers["set-cookie"]) &&
            (N.headers = nJ(new Headers(N.headers), N.headers["set-cookie"]))
          let j = e5(M),
            K = a5(J),
            y
          if (typeof Q.beforeHandle === "function") {
            const I = Q.beforeHandle(G)
            I instanceof Promise && (await I)
          }
          const o = [
              ...(Q.error ? (Array.isArray(Q.error) ? Q.error : [Q.error]) : []),
              ...($.event.error ?? []).map((I) => (typeof I === "function" ? I : I.fn)),
            ].filter((I) => I),
            n = o.length > 0,
            f = n
              ? async (I, k) => {
                  for (const b of o) {
                    let _ = b(Object.assign(G, { error: k }))
                    if ((_ instanceof Promise && (_ = await _), await j(I, _), _)) break
                  }
                }
              : () => {}
          if (
            !B?.upgrade(G.request, {
              headers: A0(N.headers) ? N.headers : void 0,
              data: {
                ...G,
                get id() {
                  return y || (y = d$())
                },
                validator: M,
                ping(I, k) {
                  Q.ping?.(I, k)
                },
                pong(I, k) {
                  Q.pong?.(I, k)
                },
                open: async (I) => {
                  try {
                    await j(I, Q.open?.(new N6(I, G)))
                  } catch (k) {
                    f(I, k)
                  }
                },
                message: async (I, k) => {
                  const b = await K(I, k)
                  if (q?.Check(b) === !1) {
                    const _ = new a("message", q, b)
                    return n ? f(I, _) : void I.send(_.message)
                  }
                  try {
                    await j(I, Q.message?.(new N6(I, G, b), b))
                  } catch (_) {
                    f(I, _)
                  }
                },
                drain: async (I) => {
                  try {
                    await j(I, Q.drain?.(new N6(I, G)))
                  } catch (k) {
                    f(I, k)
                  }
                },
                close: async (I, k, b) => {
                  try {
                    await j(I, Q.close?.(new N6(I, G), k, b))
                  } catch (_) {
                    f(I, _)
                  }
                },
              },
            })
          )
            return (N.status = 400), "Expected a websocket connection"
        },
        { ...W, websocket: Q }
      )
    },
  }
var CQ = E2 ? Bun.env : typeof process < "u" && process?.env ? process.env : {}
var YY = ($, X) => {
    let Q = $.schema
    if (Q && (Q.$defs?.[Q.$ref] && (Q = Q.$defs[Q.$ref]), !!Q?.properties))
      for (const [J, Y] of Object.entries(Q.properties)) X[J] ??= Y.default
  },
  ZY = ($) => {
    const { mapResponse: X, mapEarlyResponse: Q } = $["~adapter"].handler,
      J = $.setHeaders
    return async (Y) => {
      const Z = Y.url,
        W = Z.indexOf("/", 11),
        q = Z.indexOf("?", W + 1),
        M = q === -1 ? Z.substring(W) : Z.substring(W, q),
        G = { cookie: {}, status: 200, headers: J ? { ...J } : {} },
        B = Object.assign({}, $.singleton.decorator, {
          set: G,
          store: $.singleton.store,
          request: Y,
          path: M,
          qi: q,
          error: m2,
          status: m2,
          redirect: U$,
        })
      try {
        if ($.event.request)
          for (let b = 0; b < $.event.request.length; b++) {
            let _ = $.event.request[b].fn,
              V = _(B)
            if ((V instanceof Promise && (V = await V), (V = Q(V, G)), V)) return (B.response = V)
          }
        const N =
            Y.method === "GET" && Y.headers.get("upgrade")?.toLowerCase() === "websocket"
              ? "WS"
              : Y.method,
          P =
            $.router.dynamic.find(Y.method, M) ??
            $.router.dynamic.find(N, M) ??
            $.router.dynamic.find("ALL", M)
        if (!P) throw ((B.query = q === -1 ? {} : u$(Z.substring(q + 1))), new l8())
        let { handle: w, hooks: H, validator: A, content: S, route: j } = P.store,
          K
        if (Y.method !== "GET" && Y.method !== "HEAD")
          if (S)
            switch (S) {
              case "application/json":
                K = await Y.json()
                break
              case "text/plain":
                K = await Y.text()
                break
              case "application/x-www-form-urlencoded":
                K = u$(await Y.text())
                break
              case "application/octet-stream":
                K = await Y.arrayBuffer()
                break
              case "multipart/form-data": {
                K = {}
                const b = await Y.formData()
                for (const _ of b.keys()) {
                  if (K[_]) continue
                  const V = b.getAll(_)
                  V.length === 1 ? (K[_] = V[0]) : (K[_] = V)
                }
                break
              }
            }
          else {
            let b
            if ((Y.body && (b = Y.headers.get("content-type")), b)) {
              const _ = b.indexOf(";")
              if ((_ !== -1 && (b = b.slice(0, _)), (B.contentType = b), H.parse))
                for (let V = 0; V < H.parse.length; V++) {
                  const d = H.parse[V].fn
                  if (typeof d === "string")
                    switch (d) {
                      case "json":
                      case "application/json":
                        K = await Y.json()
                        break
                      case "text":
                      case "text/plain":
                        K = await Y.text()
                        break
                      case "urlencoded":
                      case "application/x-www-form-urlencoded":
                        K = u$(await Y.text())
                        break
                      case "arrayBuffer":
                      case "application/octet-stream":
                        K = await Y.arrayBuffer()
                        break
                      case "formdata":
                      case "multipart/form-data": {
                        K = {}
                        const m = await Y.formData()
                        for (const R0 of m.keys()) {
                          if (K[R0]) continue
                          const e = m.getAll(R0)
                          e.length === 1 ? (K[R0] = e[0]) : (K[R0] = e)
                        }
                        break
                      }
                      default: {
                        const X0 = $["~parser"][d]
                        if (X0) {
                          let R0 = X0(B, b)
                          if ((R0 instanceof Promise && (R0 = await R0), R0)) {
                            K = R0
                            break
                          }
                        }
                        break
                      }
                    }
                  else {
                    let m = d(B, b)
                    if ((m instanceof Promise && (m = await m), m)) {
                      K = m
                      break
                    }
                  }
                }
              if ((delete B.contentType, K === void 0))
                switch (b) {
                  case "application/json":
                    K = await Y.json()
                    break
                  case "text/plain":
                    K = await Y.text()
                    break
                  case "application/x-www-form-urlencoded":
                    K = u$(await Y.text())
                    break
                  case "application/octet-stream":
                    K = await Y.arrayBuffer()
                    break
                  case "multipart/form-data": {
                    K = {}
                    const V = await Y.formData()
                    for (const d of V.keys()) {
                      if (K[d]) continue
                      const m = V.getAll(d)
                      m.length === 1 ? (K[d] = m[0]) : (K[d] = m)
                    }
                    break
                  }
                }
            }
          }
        ;(B.route = j),
          (B.body = K),
          (B.params = P?.params || void 0),
          (B.query = q === -1 ? {} : u$(Z.substring(q + 1))),
          (B.headers = {})
        for (const [b, _] of Y.headers.entries()) B.headers[b] = _
        const y = {
            domain: $.config.cookie?.domain ?? A?.cookie?.config.domain,
            expires: $.config.cookie?.expires ?? A?.cookie?.config.expires,
            httpOnly: $.config.cookie?.httpOnly ?? A?.cookie?.config.httpOnly,
            maxAge: $.config.cookie?.maxAge ?? A?.cookie?.config.maxAge,
            path: $.config.cookie?.path ?? A?.cookie?.config.path,
            priority: $.config.cookie?.priority ?? A?.cookie?.config.priority,
            partitioned: $.config.cookie?.partitioned ?? A?.cookie?.config.partitioned,
            sameSite: $.config.cookie?.sameSite ?? A?.cookie?.config.sameSite,
            secure: $.config.cookie?.secure ?? A?.cookie?.config.secure,
            secrets: $.config.cookie?.secrets ?? A?.cookie?.config.secrets,
            sign: $.config.cookie?.sign ?? A?.cookie?.config.sign,
          },
          o = Y.headers.get("cookie")
        B.cookie = await qQ(B.set, o, y)
        const n = A?.createHeaders?.()
        n && YY(n, B.headers)
        const f = A?.createParams?.()
        f && YY(f, B.params)
        const I = A?.createQuery?.()
        if ((I && YY(I, B.query), H.transform))
          for (let b = 0; b < H.transform.length; b++) {
            let _ = H.transform[b],
              V = _.fn(B)
            if ((V instanceof Promise && (V = await V), V instanceof o0)) {
              const d = Q(V, B.set)
              if (d) return (B.response = d)
            }
            _.subType === "derive" && Object.assign(B, V)
          }
        if (A) {
          if (n) {
            const b = structuredClone(B.headers)
            for (const [_, V] of Y.headers) b[_] = V
            if (A.headers.Check(b) === !1) throw new a("header", A.headers, b)
          } else A.headers?.Decode && (B.headers = A.headers.Decode(B.headers))
          if (f?.Check(B.params) === !1) throw new a("params", A.params, B.params)
          if ((A.params?.Decode && (B.params = A.params.Decode(B.params)), A.query?.schema)) {
            let b = A.query.schema
            b.$defs?.[b.$ref] && (b = b.$defs[b.$ref])
            const _ = b.properties
            for (const V of Object.keys(_)) {
              const d = _[V]
              ;(d.type === "array" || d.items?.type === "string") &&
                typeof B.query[V] === "string" &&
                B.query[V] &&
                (B.query[V] = B.query[V].split(","))
            }
          }
          if (I?.Check(B.query) === !1) throw new a("query", A.query, B.query)
          if ((A.query?.Decode && (B.query = A.query.Decode(B.query)), A.createCookie?.())) {
            let b = {}
            for (const [_, V] of Object.entries(B.cookie)) b[_] = V.value
            if (A.cookie.Check(b) === !1) throw new a("cookie", A.cookie, b)
            A.cookie?.Decode && (b = A.cookie.Decode(b))
          }
          if (A.createBody?.()?.Check(K) === !1) throw new a("body", A.body, K)
          A.body?.Decode && (B.body = A.body.Decode(K))
        }
        if (H.beforeHandle)
          for (let b = 0; b < H.beforeHandle.length; b++) {
            let _ = H.beforeHandle[b],
              V = _.fn(B)
            if ((V instanceof Promise && (V = await V), V instanceof o0)) {
              const d = Q(V, B.set)
              if (d) return (B.response = d)
            }
            if (_.subType === "resolve") {
              Object.assign(B, V)
              continue
            }
            if (V !== void 0) {
              if (((B.response = V), H.afterHandle))
                for (let m = 0; m < H.afterHandle.length; m++) {
                  let X0 = H.afterHandle[m].fn(B)
                  X0 instanceof Promise && (X0 = await X0), X0 && (V = X0)
                }
              const d = Q(V, B.set)
              if (d) return (B.response = d)
            }
          }
        let k = typeof w === "function" ? w(B) : w
        if ((k instanceof Promise && (k = await k), H.afterHandle?.length)) {
          B.response = k
          for (let b = 0; b < H.afterHandle.length; b++) {
            let _ = H.afterHandle[b].fn(B)
            _ instanceof Promise && (_ = await _)
            const V = _ instanceof o0,
              d = V
                ? _.code
                : G.status
                  ? typeof G.status === "string"
                    ? w$[G.status]
                    : G.status
                  : 200
            V && ((G.status = d), (_ = _.response))
            const m = A?.createResponse?.()?.[d]
            if (m?.Check(_) === !1)
              if (m?.Clean) {
                const R0 = m.Clean(_)
                if (m?.Check(R0) === !1) throw new a("response", m, _)
                _ = R0
              } else throw new a("response", m, _)
            m?.Encode && (B.response = _ = m.Encode(_)), m?.Clean && (B.response = _ = m.Clean(_))
            const X0 = Q(_, B.set)
            if (X0 !== void 0) return (B.response = X0)
          }
        } else {
          const b = k instanceof o0,
            _ = b
              ? k.code
              : G.status
                ? typeof G.status === "string"
                  ? w$[G.status]
                  : G.status
                : 200
          b && ((G.status = _), (k = k.response))
          const V = A?.createResponse?.()?.[_]
          if (V?.Check(k) === !1)
            if (V?.Clean) {
              const d = V.Clean(k)
              if (V?.Check(d) === !1) throw new a("response", V, k)
              k = d
            } else throw new a("response", V, k)
          V?.Encode && (k = V.Encode(k)), V?.Clean && (k = V.Clean(k))
        }
        if (B.set.cookie && y?.sign) {
          const b = y.secrets ? (typeof y.secrets === "string" ? y.secrets : y.secrets[0]) : void 0
          if (y.sign === !0) {
            if (b)
              for (const [_, V] of Object.entries(B.set.cookie))
                B.set.cookie[_].value = await o8(V.value, b)
          } else {
            const _ = A?.cookie?.schema?.properties
            if (b)
              for (const V of y.sign)
                V in _ &&
                  B.set.cookie[V]?.value &&
                  (B.set.cookie[V].value = await o8(B.set.cookie[V].value, b))
          }
        }
        return X((B.response = k), B.set)
      } catch (N) {
        const P = N instanceof gX && N.error ? N.error : N
        return $.handleError(B, P)
      } finally {
        $.event.afterResponse &&
          setImmediate(async () => {
            for (const N of $.event.afterResponse) await N.fn(B)
          })
      }
    }
  },
  J7 = ($) => {
    const { mapResponse: X } = $["~adapter"].handler
    return async (Q, J) => {
      const Y = Object.assign(Q, { error: J, code: J.code })
      if (((Y.set = Q.set), $.event.error))
        for (let Z = 0; Z < $.event.error.length; Z++) {
          let W = $.event.error[Z].fn(Y)
          if ((W instanceof Promise && (W = await W), W != null)) return (Q.response = X(W, Q.set))
        }
      return new Response(typeof J.cause === "string" ? J.cause : J.message, {
        headers: Q.set.headers,
        status: J.status ?? 500,
      })
    }
  }
var Y7
Y7 = Symbol.dispose
var ZD = class $ {
    constructor(X = {}) {
      ;(this.server = null),
        (this.dependencies = {}),
        (this["~Prefix"] = ""),
        (this["~Singleton"] = null),
        (this["~Definitions"] = null),
        (this["~Metadata"] = null),
        (this["~Ephemeral"] = null),
        (this["~Volatile"] = null),
        (this["~Routes"] = null),
        (this.singleton = { decorator: {}, store: {}, derive: {}, resolve: {} }),
        (this.definitions = { typebox: T.Module({}), type: {}, error: {} }),
        (this.extender = { macro: {}, higherOrderFunctions: [] }),
        (this.validator = {
          global: null,
          scoped: null,
          local: null,
          getCandidate() {
            return !this.global && !this.scoped && !this.local
              ? {
                  body: void 0,
                  headers: void 0,
                  params: void 0,
                  query: void 0,
                  cookie: void 0,
                  response: void 0,
                }
              : n8(n8(this.global, this.scoped), this.local)
          },
        }),
        (this.standaloneValidator = { global: null, scoped: null, local: null }),
        (this.event = {}),
        (this.router = {
          "~http": void 0,
          get http() {
            return (
              this["~http"] || (this["~http"] = new RQ({ lazy: !0, onParam: WY.default })),
              this["~http"]
            )
          },
          "~dynamic": void 0,
          get dynamic() {
            return (
              this["~dynamic"] || (this["~dynamic"] = new RQ({ onParam: WY.default })),
              this["~dynamic"]
            )
          },
          static: {},
          response: {},
          history: [],
        }),
        (this.routeTree = {}),
        (this.inference = {
          body: !1,
          cookie: !1,
          headers: !1,
          query: !1,
          set: !1,
          server: !1,
          path: !1,
          route: !1,
          url: !1,
        }),
        (this["~parser"] = {}),
        (this.handle = async (Q) => this.fetch(Q)),
        (this.fetch = (Q) => (this.fetch = this.config.aot ? LQ(this) : ZY(this))(Q)),
        (this.handleError = async (Q, J) =>
          (this.handleError = this.config.aot ? XY(this) : J7(this))(Q, J)),
        (this.listen = (Q, J) => (this["~adapter"].listen(this)(Q, J), this)),
        (this.stop = async (Q) => (await this["~adapter"].stop?.(this, Q), this)),
        (this[Y7] = () => {
          this.server && this.stop()
        }),
        X.tags && (X.detail ? (X.detail.tags = X.tags) : (X.detail = { tags: X.tags })),
        (this.config = {
          aot: CQ.ELYSIA_AOT !== "false",
          nativeStaticResponse: !0,
          systemRouter: !0,
          encodeSchema: !0,
          normalize: !0,
          ...X,
          prefix: X.prefix ? (X.prefix.charCodeAt(0) === 47 ? X.prefix : `/${X.prefix}`) : void 0,
          cookie: { path: "/", ...X?.cookie },
          experimental: X?.experimental ?? {},
          seed: X?.seed === void 0 ? "" : X?.seed,
        }),
        (this["~adapter"] = X.adapter ?? (typeof Bun < "u" ? Q7 : D$)),
        X?.analytic &&
          (X?.name || X?.seed !== void 0) &&
          (this.telemetry = { stack: Error().stack })
    }
    get store() {
      return this.singleton.store
    }
    get decorator() {
      return this.singleton.decorator
    }
    get routes() {
      return this.router.history
    }
    getGlobalRoutes() {
      return this.router.history
    }
    getGlobalDefinitions() {
      return this.definitions
    }
    getServer() {
      return this.server
    }
    getParent() {
      return null
    }
    get promisedModules() {
      return (
        this._promisedModules || (this._promisedModules = new CJ(console.error, () => {})),
        this._promisedModules
      )
    }
    env(X, Q = CQ) {
      if (
        c0(X, {
          modules: this.definitions.typebox,
          dynamic: !0,
          additionalProperties: !0,
          coerce: !0,
          sanitize: () => this.config.sanitize,
        }).Check(Q) === !1
      ) {
        const J = new a("env", X, Q)
        throw Error(
          J.all
            .map((Y) => Y.summary)
            .join(`
`)
        )
      }
      return this
    }
    wrap(X) {
      return (
        this.extender.higherOrderFunctions.push({
          checksum: v$(
            JSON.stringify({
              name: this.config.name,
              seed: this.config.seed,
              content: X.toString(),
            })
          ),
          fn: X,
        }),
        this
      )
    }
    get models() {
      const X = {}
      for (const Q of Object.keys(this.definitions.type))
        X[Q] = c0(this.definitions.typebox.Import(Q))
      return (X.modules = this.definitions.typebox), X
    }
    add(X, Q, J, Y, Z) {
      const W = Z?.skipPrefix ?? !1,
        q = Z?.allowMeta ?? !1
      ;(Y ??= {}), this.applyMacro(Y)
      let M = []
      if (
        (Y.standaloneValidator && (M = M.concat(Y.standaloneValidator)),
        this.standaloneValidator.local && (M = M.concat(this.standaloneValidator.local)),
        this.standaloneValidator.scoped && (M = M.concat(this.standaloneValidator.scoped)),
        this.standaloneValidator.global && (M = M.concat(this.standaloneValidator.global)),
        Q !== "" && Q.charCodeAt(0) !== 47 && (Q = `/${Q}`),
        this.config.prefix && !W && (Q = this.config.prefix + Q),
        Y?.type)
      )
        switch (Y.type) {
          case "text":
            Y.type = "text/plain"
            break
          case "json":
            Y.type = "application/json"
            break
          case "formdata":
            Y.type = "multipart/form-data"
            break
          case "urlencoded":
            Y.type = "application/x-www-form-urlencoded"
            break
          case "arrayBuffer":
            Y.type = "application/octet-stream"
            break
          default:
            break
        }
      const G = this.validator.getCandidate(),
        B = {
          body: Y?.body ?? G?.body,
          headers: Y?.headers ?? G?.headers,
          params: Y?.params ?? G?.params,
          query: Y?.query ?? G?.query,
          cookie: Y?.cookie ?? G?.cookie,
          response: Y?.response ?? G?.response,
        },
        N =
          this.config.precompile === !0 ||
          (typeof this.config.precompile === "object" && this.config.precompile.compose === !0),
        P = () => {
          const _ = this.definitions.type,
            V = !this.config.aot,
            d = this.config.normalize,
            m = this.definitions.typebox,
            X0 = () => this.config.sanitize,
            R0 = () => {
              if (B.cookie || M.find((e) => e.cookie))
                return o5({
                  modules: m,
                  validator: B.cookie,
                  defaultConfig: this.config.cookie,
                  normalize: d,
                  config: B.cookie?.config ?? {},
                  dynamic: V,
                  models: _,
                  validators: M.map((e) => e.cookie),
                  sanitize: X0,
                })
            }
          return N
            ? {
                body: c0(B.body, {
                  modules: m,
                  dynamic: V,
                  models: _,
                  normalize: d,
                  additionalCoerce: r6(),
                  validators: M.map((e) => e.body),
                  sanitize: X0,
                }),
                headers: c0(B.headers, {
                  modules: m,
                  dynamic: V,
                  models: _,
                  additionalProperties: !0,
                  coerce: !0,
                  additionalCoerce: B6(),
                  validators: M.map((e) => e.headers),
                  sanitize: X0,
                }),
                params: c0(B.params, {
                  modules: m,
                  dynamic: V,
                  models: _,
                  coerce: !0,
                  additionalCoerce: B6(),
                  validators: M.map((e) => e.params),
                  sanitize: X0,
                }),
                query: c0(B.query, {
                  modules: m,
                  dynamic: V,
                  models: _,
                  normalize: d,
                  coerce: !0,
                  additionalCoerce: aJ(),
                  validators: M.map((e) => e.query),
                  sanitize: X0,
                }),
                cookie: R0(),
                response: OQ(B.response, {
                  modules: m,
                  dynamic: V,
                  models: _,
                  normalize: d,
                  validators: M.map((e) => e.response),
                  sanitize: X0,
                }),
              }
            : {
                createBody() {
                  return this.body
                    ? this.body
                    : (this.body = c0(B.body, {
                        modules: m,
                        dynamic: V,
                        models: _,
                        normalize: d,
                        additionalCoerce: r6(),
                        validators: M.map((e) => e.body),
                        sanitize: X0,
                      }))
                },
                createHeaders() {
                  return this.headers
                    ? this.headers
                    : (this.headers = c0(B.headers, {
                        modules: m,
                        dynamic: V,
                        models: _,
                        normalize: d,
                        additionalProperties: !d,
                        coerce: !0,
                        additionalCoerce: B6(),
                        validators: M.map((e) => e.headers),
                        sanitize: X0,
                      }))
                },
                createParams() {
                  return this.params
                    ? this.params
                    : (this.params = c0(B.params, {
                        modules: m,
                        dynamic: V,
                        models: _,
                        normalize: d,
                        coerce: !0,
                        additionalCoerce: B6(),
                        validators: M.map((e) => e.params),
                        sanitize: X0,
                      }))
                },
                createQuery() {
                  return this.query
                    ? this.query
                    : (this.query = c0(B.query, {
                        modules: m,
                        dynamic: V,
                        models: _,
                        normalize: d,
                        coerce: !0,
                        additionalCoerce: aJ(),
                        validators: M.map((e) => e.query),
                        sanitize: X0,
                      }))
                },
                createCookie() {
                  return this.cookie ? this.cookie : (this.cookie = R0())
                },
                createResponse() {
                  return this.response
                    ? this.response
                    : (this.response = OQ(B.response, {
                        modules: m,
                        dynamic: V,
                        models: _,
                        normalize: d,
                        validators: M.map((e) => e.response),
                        sanitize: X0,
                      }))
                },
              }
        }
      ;(G.body || G.cookie || G.headers || G.params || G.query || G.response) && (Y = N$(Y, G)),
        Y.tags && (Y.detail ? (Y.detail.tags = Y.tags) : (Y.detail = { tags: Y.tags })),
        A0(this.config.detail) && (Y.detail = Y1(Object.assign({}, this.config.detail), Y.detail))
      const w = A0(this.event) ? N$(this.event, jJ(Y)) : { ...AW(jJ(Y)) }
      if ((M.length && Object.assign(w, { standaloneValidator: M }), this.config.aot === !1)) {
        const _ = P()
        this.router.dynamic.add(X, Q, {
          validator: _,
          hooks: w,
          content: Y?.type,
          handle: J,
          route: Q,
        })
        const V = Z8(Q, { dynamic: !0 })
        if (
          (Q !== V &&
            this.router.dynamic.add(X, V, {
              validator: _,
              hooks: w,
              content: Y?.type,
              handle: J,
              route: Q,
            }),
          this.config.strictPath === !1)
        ) {
          const d = Y8(Q)
          this.router.dynamic.add(X, d, {
            validator: _,
            hooks: w,
            content: Y?.type,
            handle: J,
            route: Q,
          })
          const m = Z8(d)
          d !== m &&
            this.router.dynamic.add(X, d, {
              validator: _,
              hooks: w,
              content: Y?.type,
              handle: J,
              route: Q,
            })
        }
        this.router.history.push({
          method: X,
          path: Q,
          composed: null,
          handler: J,
          compile: void 0,
          hooks: w,
        })
        return
      }
      const H = this["~adapter"].handler,
        A =
          typeof J !== "function"
            ? () => {
                const _ = {
                  redirect: U$,
                  request: this["~adapter"].isWebStandard
                    ? new Request(`http://e.ly${Q}`, { method: X })
                    : void 0,
                  server: null,
                  set: { headers: Object.assign({}, this.setHeaders) },
                  status: m2,
                  store: this.store,
                }
                try {
                  this.event.request?.map((d) => {
                    if (typeof d.fn === "function") return d.fn(_)
                    if (typeof d === "function") return d(_)
                  })
                } catch (d) {
                  let m
                  ;(_.error = d),
                    this.event.error?.some((X0) => {
                      if (typeof X0.fn === "function") return (m = X0.fn(_))
                      if (typeof X0 === "function") return (m = X0(_))
                    }),
                    m !== void 0 && (J = m)
                }
                const V = H.createNativeStaticHandler?.(J, w, _.set)
                return V instanceof Promise
                  ? V.then((d) => {
                      if (d) return d
                    })
                  : V?.()
              }
            : void 0,
        S = this.config.nativeStaticResponse === !0,
        j = (_) => {
          !S ||
            !A ||
            (nX
              ? this.router.response[_]
                ? (this.router.response[_][X] = A())
                : (this.router.response[_] = { [X]: A() })
              : (this.router.response[_] = A()))
        }
      j(Q)
      let K,
        y = () =>
          K ||
          (K = t5({
            app: this,
            path: Q,
            method: X,
            hooks: w,
            validator: P(),
            handler:
              typeof J !== "function" && typeof H.createStaticHandler !== "function" ? () => J : J,
            allowMeta: q,
            inference: this.inference,
          })),
        o
      if (`${X}_${Q}` in this.routeTree)
        for (let _ = 0; _ < this.router.history.length; _++) {
          const V = this.router.history[_]
          if (V.path === Q && V.method === X) {
            o = _
            break
          }
        }
      else this.routeTree[`${X}_${Q}`] = this.router.history.length
      const n = o ?? this.router.history.length,
        f = N ? y() : (_) => (this.router.history[n].composed = y())(_)
      o !== void 0
        ? (this.router.history[o] = Object.assign(
            { method: X, path: Q, composed: f, compile: y, handler: J, hooks: w },
            M.length ? { standaloneValidators: M } : void 0,
            Y.webSocket ? { websocket: Y.websocket } : void 0
          ))
        : this.router.history.push(
            Object.assign(
              { method: X, path: Q, composed: f, compile: y, handler: J, hooks: w },
              Y.webSocket ? { websocket: Y.websocket } : void 0
            )
          )
      const I = {
          handler: N ? f : void 0,
          compile() {
            return (this.handler = y())
          },
        },
        k = this.router.static,
        b = Q.indexOf(":") === -1 && Q.indexOf("*") === -1
      if (X === "WS") {
        if (b) {
          Q in k ? (k[Q][X] = n) : (k[Q] = { [X]: n })
          return
        }
        this.router.http.add("WS", Q, I),
          this.config.strictPath || this.router.http.add("WS", Y8(Q), I)
        const _ = Z8(Q, { dynamic: !0 })
        Q !== _ && this.router.http.add("WS", _, I)
        return
      }
      if (b) Q in k ? (k[Q][X] = n) : (k[Q] = { [X]: n }), this.config.strictPath || j(Y8(Q))
      else {
        if ((this.router.http.add(X, Q, I), !this.config.strictPath)) {
          const V = Y8(Q)
          j(V), this.router.http.add(X, V, I)
        }
        const _ = Z8(Q, { dynamic: !0 })
        Q !== _ && (this.router.http.add(X, _, I), j(_))
      }
    }
    headers(X) {
      return X
        ? (this.setHeaders || (this.setHeaders = {}),
          (this.setHeaders = Y1(this.setHeaders, X)),
          this)
        : this
    }
    onStart(X) {
      return this.on("start", X), this
    }
    onRequest(X) {
      return this.on("request", X), this
    }
    onParse(X, Q) {
      return Q
        ? this.on(X, "parse", Q)
        : typeof X === "string"
          ? this.on("parse", this["~parser"][X])
          : this.on("parse", X)
    }
    parser(X, Q) {
      return (this["~parser"][X] = Q), this
    }
    onTransform(X, Q) {
      return Q ? this.on(X, "transform", Q) : this.on("transform", X)
    }
    resolve(X, Q) {
      Q || ((Q = X), (X = { as: "local" }))
      const J = { subType: "resolve", fn: Q }
      return this.onBeforeHandle(X, J)
    }
    mapResolve(X, Q) {
      Q || ((Q = X), (X = { as: "local" }))
      const J = { subType: "mapResolve", fn: Q }
      return this.onBeforeHandle(X, J)
    }
    onBeforeHandle(X, Q) {
      return Q ? this.on(X, "beforeHandle", Q) : this.on("beforeHandle", X)
    }
    onAfterHandle(X, Q) {
      return Q ? this.on(X, "afterHandle", Q) : this.on("afterHandle", X)
    }
    mapResponse(X, Q) {
      return Q ? this.on(X, "mapResponse", Q) : this.on("mapResponse", X)
    }
    onAfterResponse(X, Q) {
      return Q ? this.on(X, "afterResponse", Q) : this.on("afterResponse", X)
    }
    trace(X, Q) {
      Q || ((Q = X), (X = { as: "local" })), Array.isArray(Q) || (Q = [Q])
      for (const J of Q) this.on(X, "trace", m5(J))
      return this
    }
    error(X, Q) {
      switch (typeof X) {
        case "string":
          return (Q.prototype[W8] = X), (this.definitions.error[X] = Q), this
        case "function":
          return (this.definitions.error = X(this.definitions.error)), this
      }
      for (const [J, Y] of Object.entries(X)) (Y.prototype[W8] = J), (this.definitions.error[J] = Y)
      return this
    }
    onError(X, Q) {
      return Q ? this.on(X, "error", Q) : this.on("error", X)
    }
    onStop(X) {
      return this.on("stop", X), this
    }
    on(X, Q, J) {
      let Y
      switch (typeof X) {
        case "string":
          ;(Y = X), (J = Q)
          break
        case "object":
          ;(Y = Q), !Array.isArray(Q) && typeof Q === "object" && (J = Q)
          break
      }
      Array.isArray(J) ? (J = J1(J)) : typeof J === "function" ? (J = [{ fn: J }]) : (J = [J])
      const Z = J
      for (const W of Z)
        (W.scope = typeof X === "string" ? "local" : (X?.as ?? "local")),
          (Y === "resolve" || Y === "derive") && (W.subType = Y)
      Y !== "trace" &&
        (this.inference = U8({ [Y]: Z.map((W) => W.fn) }, this.inference, this.config.sucrose))
      for (const W of Z) {
        const q = DW(W, "global", { skipIfHasType: !0 })
        switch (Y) {
          case "start":
            ;(this.event.start ??= []), this.event.start.push(q)
            break
          case "request":
            ;(this.event.request ??= []), this.event.request.push(q)
            break
          case "parse":
            ;(this.event.parse ??= []), this.event.parse.push(q)
            break
          case "transform":
            ;(this.event.transform ??= []), this.event.transform.push(q)
            break
          case "derive":
            ;(this.event.transform ??= []), this.event.transform.push(J1(q, "derive"))
            break
          case "beforeHandle":
            ;(this.event.beforeHandle ??= []), this.event.beforeHandle.push(q)
            break
          case "resolve":
            ;(this.event.beforeHandle ??= []), this.event.beforeHandle.push(J1(q, "resolve"))
            break
          case "afterHandle":
            ;(this.event.afterHandle ??= []), this.event.afterHandle.push(q)
            break
          case "mapResponse":
            ;(this.event.mapResponse ??= []), this.event.mapResponse.push(q)
            break
          case "afterResponse":
            ;(this.event.afterResponse ??= []), this.event.afterResponse.push(q)
            break
          case "trace":
            ;(this.event.trace ??= []), this.event.trace.push(q)
            break
          case "error":
            ;(this.event.error ??= []), this.event.error.push(q)
            break
          case "stop":
            ;(this.event.stop ??= []), this.event.stop.push(q)
            break
        }
      }
      return this
    }
    as(X) {
      return (
        H$(this.event.parse, X),
        H$(this.event.transform, X),
        H$(this.event.beforeHandle, X),
        H$(this.event.afterHandle, X),
        H$(this.event.mapResponse, X),
        H$(this.event.afterResponse, X),
        H$(this.event.trace, X),
        H$(this.event.error, X),
        X === "scoped"
          ? ((this.validator.scoped = n8(this.validator.scoped, this.validator.local)),
            (this.validator.local = null),
            this.standaloneValidator.local !== null &&
              ((this.standaloneValidator.scoped ||= []),
              this.standaloneValidator.scoped.push(...this.standaloneValidator.local),
              (this.standaloneValidator.local = null)))
          : X === "global" &&
            ((this.validator.global = n8(
              this.validator.global,
              n8(this.validator.scoped, this.validator.local)
            )),
            (this.validator.scoped = null),
            (this.validator.local = null),
            this.standaloneValidator.local !== null &&
              ((this.standaloneValidator.scoped ||= []),
              this.standaloneValidator.scoped.push(...this.standaloneValidator.local),
              (this.standaloneValidator.local = null)),
            this.standaloneValidator.scoped !== null &&
              ((this.standaloneValidator.global ||= []),
              this.standaloneValidator.global.push(...this.standaloneValidator.scoped),
              (this.standaloneValidator.scoped = null))),
        this
      )
    }
    group(X, Q, J) {
      const Y = new $({ ...this.config, prefix: "" })
      ;(Y.singleton = { ...this.singleton }),
        (Y.definitions = { ...this.definitions }),
        (Y.getServer = () => this.getServer()),
        (Y.inference = iX(this.inference)),
        (Y.extender = { ...this.extender }),
        (Y["~parser"] = this["~parser"]),
        (Y.standaloneValidator = {
          local: [...(this.standaloneValidator.local ?? [])],
          scoped: [...(this.standaloneValidator.scoped ?? [])],
          global: [...(this.standaloneValidator.global ?? [])],
        })
      const Z = typeof Q === "object",
        W = (Z ? J : Q)(Y)
      return (
        (this.singleton = Y1(this.singleton, Y.singleton)),
        (this.definitions = Y1(this.definitions, Y.definitions)),
        W.event.request?.length &&
          (this.event.request = [...(this.event.request || []), ...(W.event.request || [])]),
        W.event.mapResponse?.length &&
          (this.event.mapResponse = [
            ...(this.event.mapResponse || []),
            ...(W.event.mapResponse || []),
          ]),
        this.model(W.definitions.type),
        Object.values(Y.router.history).forEach(({ method: q, path: M, handler: G, hooks: B }) => {
          if (((M = (Z ? "" : (this.config.prefix ?? "")) + X + M), Z)) {
            const { body: N, headers: P, query: w, params: H, cookie: A, response: S, ...j } = Q,
              K = B,
              y = N || P || w || H || A || S
            this.add(
              q,
              M,
              G,
              N$(j, {
                ...(K || {}),
                error: K.error
                  ? Array.isArray(K.error)
                    ? [...(K.error ?? []), ...(W.event.error ?? [])]
                    : [K.error, ...(W.event.error ?? [])]
                  : W.event.error,
                standaloneValidator: y
                  ? [
                      ...(K.standaloneValidator ?? []),
                      { body: N, headers: P, query: w, params: H, cookie: A, response: S },
                    ]
                  : K.standaloneValidator,
              }),
              void 0
            )
          } else this.add(q, M, G, N$(B, { error: W.event.error }), { skipPrefix: !0 })
        }),
        this
      )
    }
    guard(X, Q) {
      if (!Q) {
        if (typeof X === "object") {
          this.applyMacro(X),
            X.detail &&
              (this.config.detail
                ? (this.config.detail = Y1(Object.assign({}, this.config.detail), X.detail))
                : (this.config.detail = X.detail)),
            X.tags &&
              (this.config.detail
                ? (this.config.detail.tags = X.tags)
                : (this.config.detail = { tags: X.tags }))
          const Z = X.as ?? "local"
          if (X.schema === "standalone") {
            this.standaloneValidator[Z] || (this.standaloneValidator[Z] = [])
            const W = X?.response
              ? typeof X.response === "string" || L in X.response || "~standard" in X.response
                ? { 200: X.response }
                : X?.response
              : void 0
            this.standaloneValidator[Z].push({
              body: X.body,
              headers: X.headers,
              params: X.params,
              query: X.query,
              response: W,
              cookie: X.cookie,
            })
          } else
            this.validator[Z] = {
              body: X.body ?? this.validator[Z]?.body,
              headers: X.headers ?? this.validator[Z]?.headers,
              params: X.params ?? this.validator[Z]?.params,
              query: X.query ?? this.validator[Z]?.query,
              response: X.response ?? this.validator[Z]?.response,
              cookie: X.cookie ?? this.validator[Z]?.cookie,
            }
          return (
            X.parse && this.on({ as: Z }, "parse", X.parse),
            X.transform && this.on({ as: Z }, "transform", X.transform),
            X.derive && this.on({ as: Z }, "derive", X.derive),
            X.beforeHandle && this.on({ as: Z }, "beforeHandle", X.beforeHandle),
            X.resolve && this.on({ as: Z }, "resolve", X.resolve),
            X.afterHandle && this.on({ as: Z }, "afterHandle", X.afterHandle),
            X.mapResponse && this.on({ as: Z }, "mapResponse", X.mapResponse),
            X.afterResponse && this.on({ as: Z }, "afterResponse", X.afterResponse),
            X.error && this.on({ as: Z }, "error", X.error),
            this
          )
        }
        return this.guard({}, X)
      }
      const J = new $({ ...this.config, prefix: "" })
      ;(J.singleton = { ...this.singleton }),
        (J.definitions = { ...this.definitions }),
        (J.inference = iX(this.inference)),
        (J.extender = { ...this.extender }),
        (J.getServer = () => this.getServer())
      const Y = Q(J)
      return (
        (this.singleton = Y1(this.singleton, J.singleton)),
        (this.definitions = Y1(this.definitions, J.definitions)),
        (Y.getServer = () => this.server),
        Y.event.request?.length &&
          (this.event.request = [...(this.event.request || []), ...(Y.event.request || [])]),
        Y.event.mapResponse?.length &&
          (this.event.mapResponse = [
            ...(this.event.mapResponse || []),
            ...(Y.event.mapResponse || []),
          ]),
        this.model(Y.definitions.type),
        Object.values(J.router.history).forEach(({ method: Z, path: W, handler: q, hooks: M }) => {
          const { body: G, headers: B, query: N, params: P, cookie: w, response: H, ...A } = X,
            S = G || B || N || P || w || H
          this.add(
            Z,
            W,
            q,
            N$(A, {
              ...(M || {}),
              error: M.error
                ? Array.isArray(M.error)
                  ? [...(M.error ?? []), ...(Y.event.error ?? [])]
                  : [M.error, ...(Y.event.error ?? [])]
                : Y.event.error,
              standaloneValidator: S
                ? [
                    ...(M.standaloneValidator ?? []),
                    { body: G, headers: B, query: N, params: P, cookie: w, response: H },
                  ]
                : M.standaloneValidator,
            })
          )
        }),
        this
      )
    }
    use(X) {
      if (!X) return this
      if (Array.isArray(X)) {
        let Q = this
        for (const J of X) Q = Q.use(J)
        return Q
      }
      return X instanceof Promise
        ? (this.promisedModules.add(
            X.then((Q) => {
              if (typeof Q === "function") return Q(this)
              if (Q instanceof $) return this._use(Q).compile()
              if (Q.constructor?.name === "Elysia") return this._use(Q).compile()
              if (typeof Q.default === "function") return Q.default(this)
              if (Q.default instanceof $) return this._use(Q.default)
              if (Q.constructor?.name === "Elysia") return this._use(Q.default)
              if (Q.constructor?.name === "_Elysia") return this._use(Q.default)
              try {
                return this._use(Q.default)
              } catch (J) {
                throw (
                  (console.error(
                    'Invalid plugin type. Expected Elysia instance, function, or module with "default" as Elysia instance or function that returns Elysia instance.'
                  ),
                  J)
                )
              }
            }).then((Q) => (Q && typeof Q.compile === "function" && Q.compile(), Q))
          ),
          this)
        : this._use(X)
    }
    propagatePromiseModules(X) {
      if (X.promisedModules.size <= 0) return this
      for (const Q of X.promisedModules.promises)
        this.promisedModules.add(
          Q.then((J) => {
            if (!J) return
            const Y = this._use(J)
            return Y instanceof Promise
              ? Y.then((Z) => {
                  Z ? Z.compile() : J.compile()
                })
              : J.compile()
          })
        )
      return this
    }
    _use(X) {
      if (typeof X === "function") {
        const Y = X(this)
        return Y instanceof Promise
          ? (this.promisedModules.add(
              Y.then((Z) => {
                if (Z instanceof $) {
                  ;(Z.getServer = () => this.getServer()),
                    (Z.getGlobalRoutes = () => this.getGlobalRoutes()),
                    (Z.getGlobalDefinitions = () => this.getGlobalDefinitions()),
                    Z.model(this.definitions.type),
                    Z.error(this.definitions.error)
                  for (const { method: W, path: q, handler: M, hooks: G } of Object.values(
                    Z.router.history
                  ))
                    this.add(W, q, M, G, void 0)
                  return Z === this ? void 0 : (this.propagatePromiseModules(Z), Z)
                }
                return typeof Z === "function"
                  ? Z(this)
                  : typeof Z.default === "function"
                    ? Z.default(this)
                    : this._use(Z)
              }).then((Z) => (Z && typeof Z.compile === "function" && Z.compile(), Z))
            ),
            this)
          : Y
      }
      this.propagatePromiseModules(X)
      const Q = X.config.name,
        J = X.config.seed
      if (
        ((X.getParent = () => this),
        (X.getServer = () => this.getServer()),
        (X.getGlobalRoutes = () => this.getGlobalRoutes()),
        (X.getGlobalDefinitions = () => this.getGlobalDefinitions()),
        X.standaloneValidator?.scoped &&
          (this.standaloneValidator.local
            ? (this.standaloneValidator.local = this.standaloneValidator.local.concat(
                X.standaloneValidator.scoped
              ))
            : (this.standaloneValidator.local = X.standaloneValidator.scoped)),
        X.standaloneValidator?.global &&
          (this.standaloneValidator.global
            ? (this.standaloneValidator.global = this.standaloneValidator.global.concat(
                X.standaloneValidator.global
              ))
            : (this.standaloneValidator.global = X.standaloneValidator.global)),
        A0(X["~parser"]) && (this["~parser"] = { ...X["~parser"], ...this["~parser"] }),
        X.setHeaders && this.headers(X.setHeaders),
        Q)
      ) {
        Q in this.dependencies || (this.dependencies[Q] = [])
        const Y = J !== void 0 ? v$(Q + JSON.stringify(J)) : 0
        this.dependencies[Q].some(({ checksum: Z }) => Y === Z) ||
          ((this.extender.macro = { ...this.extender.macro, ...X.extender.macro }),
          (this.extender.higherOrderFunctions = this.extender.higherOrderFunctions.concat(
            X.extender.higherOrderFunctions
          )))
      } else
        A0(X.extender.macro) &&
          (this.extender.macro = { ...this.extender.macro, ...X.extender.macro }),
          X.extender.higherOrderFunctions.length &&
            (this.extender.higherOrderFunctions = this.extender.higherOrderFunctions.concat(
              X.extender.higherOrderFunctions
            ))
      if (X.extender.higherOrderFunctions.length) {
        VJ(this.extender.higherOrderFunctions)
        const Y = []
        for (let Z = 0; Z < this.extender.higherOrderFunctions.length; Z++) {
          const W = this.extender.higherOrderFunctions[Z]
          W.checksum &&
            (Y.includes(W.checksum) && (this.extender.higherOrderFunctions.splice(Z, 1), Z--),
            Y.push(W.checksum))
        }
        Y.length = 0
      }
      ;(this.inference = UQ(this.inference, X.inference)),
        A0(X.singleton.decorator) && this.decorate(X.singleton.decorator),
        A0(X.singleton.store) && this.state(X.singleton.store),
        A0(X.definitions.type) && this.model(X.definitions.type),
        A0(X.definitions.error) && this.error(X.definitions.error),
        A0(X.extender.macro) &&
          (this.extender.macro = { ...this.extender.macro, ...X.extender.macro })
      for (const { method: Y, path: Z, handler: W, hooks: q } of Object.values(X.router.history))
        this.add(Y, Z, W, q)
      if (Q) {
        Q in this.dependencies || (this.dependencies[Q] = [])
        const Y = J !== void 0 ? v$(Q + JSON.stringify(J)) : 0
        if (this.dependencies[Q].some(({ checksum: Z }) => Y === Z)) return this
        this.dependencies[Q].push(
          this.config?.analytic
            ? {
                name: X.config.name,
                seed: X.config.seed,
                checksum: Y,
                dependencies: X.dependencies,
                stack: X.telemetry?.stack,
                routes: X.router.history,
                decorators: X.singleton,
                store: X.singleton.store,
                error: X.definitions.error,
                derive: X.event.transform
                  ?.filter((Z) => Z?.subType === "derive")
                  .map((Z) => ({ fn: Z.toString(), stack: Error().stack ?? "" })),
                resolve: X.event.transform
                  ?.filter((Z) => Z?.subType === "resolve")
                  .map((Z) => ({ fn: Z.toString(), stack: Error().stack ?? "" })),
              }
            : {
                name: X.config.name,
                seed: X.config.seed,
                checksum: Y,
                dependencies: X.dependencies,
              }
        ),
          A0(X.event) && (this.event = LJ(this.event, KJ(X.event), Y))
      } else A0(X.event) && (this.event = LJ(this.event, KJ(X.event)))
      return (
        X.validator.global &&
          (this.validator.global = N$(this.validator.global, { ...X.validator.global })),
        X.validator.scoped &&
          (this.validator.local = N$(this.validator.local, { ...X.validator.scoped })),
        this
      )
    }
    macro(X, Q) {
      if (typeof X === "string" && !Q) throw Error("Macro function is required")
      return (
        typeof X === "string"
          ? (this.extender.macro[X] = Q)
          : (this.extender.macro = { ...this.extender.macro, ...X }),
        this
      )
    }
    applyMacro(X, Q = X, { iteration: J = 0, applied: Y = {} } = {}) {
      if (J >= 16) return
      const Z = this.extender.macro
      for (const [W, q] of Object.entries(Q)) {
        if (!(W in Z)) continue
        const M = typeof Z[W] === "function" ? Z[W](q) : Z[W]
        if (!M || (typeof Z[W] === "object" && q === !1)) return
        const G = v$(W + JSON.stringify(M.seed ?? q))
        if (!(G in Y)) {
          Y[G] = !0
          for (let [B, N] of Object.entries(M))
            if (B !== "seed") {
              if (B in LW) {
                OW(X, B, N), delete X[W]
                continue
              }
              if (B === "detail") {
                X.detail || (X.detail = {}),
                  (X.detail = Y1(X.detail, N, { mergeArray: !0 })),
                  delete X[W]
                continue
              }
              if (B in Z) {
                this.applyMacro(X, { [B]: N }, { applied: Y, iteration: J + 1 }), delete X[W]
                continue
              }
              switch (
                ((B === "derive" || B === "resolve") &&
                  typeof N === "function" &&
                  (N = { fn: N, subType: B }),
                typeof X[B])
              ) {
                case "function":
                  X[B] = [X[B], N]
                  break
                case "object":
                  Array.isArray(X[B]) ? X[B].push(N) : (X[B] = [X[B], N])
                  break
                case "undefined":
                  X[B] = N
                  break
              }
              delete X[W]
            }
        }
      }
    }
    mount(X, Q, J) {
      if (X instanceof $ || typeof X === "function" || X.length === 0 || X === "/") {
        const q =
            typeof X === "function"
              ? X
              : X instanceof $
                ? X.compile().fetch
                : Q instanceof $
                  ? Q.compile().fetch
                  : typeof Q === "function"
                    ? Q
                    : (() => {
                        throw Error("Invalid handler")
                      })(),
          M = ({ request: G, path: B }) =>
            q(
              new Request(uX(G.url, B), {
                method: G.method,
                headers: G.headers,
                signal: G.signal,
                credentials: G.credentials,
                referrerPolicy: G.referrerPolicy,
                duplex: G.duplex,
                redirect: G.redirect,
                mode: G.mode,
                keepalive: G.keepalive,
                integrity: G.integrity,
                body: G.body,
              })
            )
        return (
          this.route("ALL", "/*", M, {
            parse: "none",
            ...J,
            detail: { ...J?.detail, hide: !0 },
            config: { mount: q },
          }),
          this
        )
      }
      const Y =
          Q instanceof $
            ? Q.compile().fetch
            : typeof Q === "function"
              ? Q
              : (() => {
                  throw Error("Invalid handler")
                })(),
        Z = X.length - (X.endsWith("*") ? 1 : 0),
        W = ({ request: q, path: M }) =>
          Y(
            new Request(uX(q.url, M.slice(Z) || "/"), {
              method: q.method,
              headers: q.headers,
              signal: q.signal,
              credentials: q.credentials,
              referrerPolicy: q.referrerPolicy,
              duplex: q.duplex,
              redirect: q.redirect,
              mode: q.mode,
              keepalive: q.keepalive,
              integrity: q.integrity,
              body: q.body,
            })
          )
      return (
        this.route("ALL", X, W, {
          parse: "none",
          ...J,
          detail: { ...J?.detail, hide: !0 },
          config: { mount: Y },
        }),
        this.route("ALL", X + (X.endsWith("/") ? "*" : "/*"), W, {
          parse: "none",
          ...J,
          detail: { ...J?.detail, hide: !0 },
          config: { mount: Y },
        }),
        this
      )
    }
    get(X, Q, J) {
      return this.add("GET", X, Q, J), this
    }
    post(X, Q, J) {
      return this.add("POST", X, Q, J), this
    }
    put(X, Q, J) {
      return this.add("PUT", X, Q, J), this
    }
    patch(X, Q, J) {
      return this.add("PATCH", X, Q, J), this
    }
    delete(X, Q, J) {
      return this.add("DELETE", X, Q, J), this
    }
    options(X, Q, J) {
      return this.add("OPTIONS", X, Q, J), this
    }
    all(X, Q, J) {
      return this.add("ALL", X, Q, J), this
    }
    head(X, Q, J) {
      return this.add("HEAD", X, Q, J), this
    }
    connect(X, Q, J) {
      return this.add("CONNECT", X, Q, J), this
    }
    route(X, Q, J, Y) {
      return this.add(X.toUpperCase(), Q, J, Y, Y?.config), this
    }
    ws(X, Q) {
      return (
        this["~adapter"].ws
          ? this["~adapter"].ws(this, X, Q)
          : console.warn("Current adapter doesn't support WebSocket"),
        this
      )
    }
    state(X, Q, J) {
      Q === void 0
        ? ((J = X), (X = { as: "append" }), (Q = ""))
        : J === void 0 &&
          (typeof X === "string"
            ? ((J = Q), (Q = X), (X = { as: "append" }))
            : typeof X === "object" && ((J = Q), (Q = "")))
      const { as: Y } = X
      if (typeof Q !== "string") return this
      switch (typeof J) {
        case "object":
          return !J || !A0(J)
            ? this
            : Q
              ? (Q in this.singleton.store
                  ? (this.singleton.store[Q] = Y1(this.singleton.store[Q], J, {
                      override: Y === "override",
                    }))
                  : (this.singleton.store[Q] = J),
                this)
              : J === null
                ? this
                : ((this.singleton.store = Y1(this.singleton.store, J, {
                    override: Y === "override",
                  })),
                  this)
        case "function":
          return (
            Q
              ? (Y === "override" || !(Q in this.singleton.store)) && (this.singleton.store[Q] = J)
              : (this.singleton.store = J(this.singleton.store)),
            this
          )
        default:
          return (
            (Y === "override" || !(Q in this.singleton.store)) && (this.singleton.store[Q] = J),
            this
          )
      }
    }
    decorate(X, Q, J) {
      Q === void 0
        ? ((J = X), (X = { as: "append" }), (Q = ""))
        : J === void 0 &&
          (typeof X === "string"
            ? ((J = Q), (Q = X), (X = { as: "append" }))
            : typeof X === "object" && ((J = Q), (Q = "")))
      const { as: Y } = X
      if (typeof Q !== "string") return this
      switch (typeof J) {
        case "object":
          return Q
            ? (Q in this.singleton.decorator
                ? (this.singleton.decorator[Q] = Y1(this.singleton.decorator[Q], J, {
                    override: Y === "override",
                  }))
                : (this.singleton.decorator[Q] = J),
              this)
            : J === null
              ? this
              : ((this.singleton.decorator = Y1(this.singleton.decorator, J, {
                  override: Y === "override",
                })),
                this)
        case "function":
          return (
            Q
              ? (Y === "override" || !(Q in this.singleton.decorator)) &&
                (this.singleton.decorator[Q] = J)
              : (this.singleton.decorator = J(this.singleton.decorator)),
            this
          )
        default:
          return (
            (Y === "override" || !(Q in this.singleton.decorator)) &&
              (this.singleton.decorator[Q] = J),
            this
          )
      }
    }
    derive(X, Q) {
      Q || ((Q = X), (X = { as: "local" }))
      const J = { subType: "derive", fn: Q }
      return this.onTransform(X, J)
    }
    model(X, Q) {
      const J = (Y) => {
        const Z = {}
        for (const W in Y) "~standard" in Y[W] || (Z[W] = Y[W])
        return Z
      }
      switch (typeof X) {
        case "object": {
          const Y = {},
            Z = Object.entries(X)
          if (!Z.length) return this
          for (const [M, G] of Z)
            M in this.definitions.type ||
              ("~standard" in G
                ? (this.definitions.type[M] = G)
                : ((Y[M] = this.definitions.type[M] = G),
                  (Y[M].$id ??= `#/components/schemas/${M}`)))
          return (
            (this.definitions.typebox = T.Module({ ...this.definitions.typebox.$defs, ...Y })), this
          )
        }
        case "function": {
          const W = X(this.definitions.type)
          return (this.definitions.type = W), (this.definitions.typebox = T.Module(J(W))), this
        }
        case "string": {
          if (!Q) break
          if (((this.definitions.type[X] = Q), "~standard" in Q)) return this
          const q = { ...Q, id: Q.$id ?? `#/components/schemas/${X}` }
          return (
            (this.definitions.typebox = T.Module({ ...this.definitions.typebox.$defs, ...q })), this
          )
        }
      }
      return Q
        ? ((this.definitions.type[X] = Q),
          "~standard" in Q
            ? this
            : ((this.definitions.typebox = T.Module({ ...this.definitions.typebox.$defs, [X]: Q })),
              this))
        : this
    }
    Ref(X) {
      return T.Ref(X)
    }
    mapDerive(X, Q) {
      Q || ((Q = X), (X = { as: "local" }))
      const J = { subType: "mapDerive", fn: Q }
      return this.onTransform(X, J)
    }
    affix(X, Q, J) {
      if (J === "") return this
      const Y = ["_", "-", " "],
        Z = (G) => G[0].toUpperCase() + G.slice(1),
        W =
          X === "prefix"
            ? (G, B) => (Y.includes(G.at(-1) ?? "") ? G + B : G + Z(B))
            : Y.includes(J.at(-1) ?? "")
              ? (G, B) => B + G
              : (G, B) => B + Z(G),
        q = (G) => {
          const B = {}
          switch (G) {
            case "decorator":
              for (const N in this.singleton.decorator) B[W(J, N)] = this.singleton.decorator[N]
              this.singleton.decorator = B
              break
            case "state":
              for (const N in this.singleton.store) B[W(J, N)] = this.singleton.store[N]
              this.singleton.store = B
              break
            case "model":
              for (const N in this.definitions.type) B[W(J, N)] = this.definitions.type[N]
              this.definitions.type = B
              break
            case "error":
              for (const N in this.definitions.error) B[W(J, N)] = this.definitions.error[N]
              this.definitions.error = B
              break
          }
        },
        M = Array.isArray(Q) ? Q : [Q]
      for (const G of M.some((B) => B === "all") ? ["decorator", "state", "model", "error"] : M)
        q(G)
      return this
    }
    prefix(X, Q) {
      return this.affix("prefix", X, Q)
    }
    suffix(X, Q) {
      return this.affix("suffix", X, Q)
    }
    compile() {
      return (
        this["~adapter"].beforeCompile?.(this),
        this["~adapter"].isWebStandard
          ? ((this.fetch = this.config.aot ? LQ(this) : ZY(this)),
            typeof this.server?.reload === "function" &&
              this.server.reload({ ...(this.server || {}), fetch: this.fetch }),
            this)
          : (typeof this.server?.reload === "function" && this.server.reload(this.server || {}),
            (this._handle = LQ(this)),
            this)
      )
    }
    get modules() {
      return this.promisedModules
    }
  },
  Z7 = ZD
var WD = new Z7().get("/", () => "OK"),
  W7 = WD
var qD = { ...FQ, routes: W7 },
  Ck = qD,
  Kk = FQ
export { Kk as meta, Ck as default }

//# debugId=E4E919579A1231EE64756E2164756E21

"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all2) => {
  for (var name in all2)
    __defProp(target, name, { get: all2[name], enumerable: true });
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "node_modules/ws/lib/constants.js"(exports2, module2) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module2.exports = {
      BINARY_TYPES,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: /* @__PURE__ */ Symbol("kIsForOnEventAttribute"),
      kListener: /* @__PURE__ */ Symbol("kListener"),
      kStatusCode: /* @__PURE__ */ Symbol("status-code"),
      kWebSocket: /* @__PURE__ */ Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "node_modules/ws/lib/buffer-util.js"(exports2, module2) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module2.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = require("bufferutil");
        module2.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module2.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "node_modules/ws/lib/limiter.js"(exports2, module2) {
    "use strict";
    var kDone = /* @__PURE__ */ Symbol("kDone");
    var kRun = /* @__PURE__ */ Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module2.exports = Limiter;
  }
});

// node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "node_modules/ws/lib/permessage-deflate.js"(exports2, module2) {
    "use strict";
    var zlib = require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = /* @__PURE__ */ Symbol("permessage-deflate");
    var kTotalLength = /* @__PURE__ */ Symbol("total-length");
    var kCallback = /* @__PURE__ */ Symbol("callback");
    var kBuffers = /* @__PURE__ */ Symbol("buffers");
    var kError = /* @__PURE__ */ Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       * @param {Boolean} [isServer=false] Create the instance in either server or
       *     client mode
       * @param {Number} [maxPayload=0] The maximum allowed message length
       */
      constructor(options, isServer, maxPayload) {
        this._maxPayload = maxPayload | 0;
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._isServer = !!isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num2 = +value;
                if (!Number.isInteger(num2) || num2 < 8 || num2 > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num2;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num2 = +value;
              if (!Number.isInteger(num2) || num2 < 8 || num2 > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num2;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module2.exports = PerMessageDeflate;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "node_modules/ws/lib/validation.js"(exports2, module2) {
    "use strict";
    var { isUtf8 } = require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module2.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module2.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = require("utf-8-validate");
        module2.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "node_modules/ws/lib/receiver.js"(exports2, module2) {
    "use strict";
    var { Writable } = require("stream");
    var PerMessageDeflate = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num2 = buf.readUInt32BE(0);
        if (num2 > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num2 * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module2.exports = Receiver2;
  }
});

// node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "node_modules/ws/lib/sender.js"(exports2, module2) {
    "use strict";
    var { Duplex } = require("stream");
    var { randomFillSync } = require("crypto");
    var PerMessageDeflate = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = /* @__PURE__ */ Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else {
            buf.set(data, 2);
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module2.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "node_modules/ws/lib/event-target.js"(exports2, module2) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = /* @__PURE__ */ Symbol("kCode");
    var kData = /* @__PURE__ */ Symbol("kData");
    var kError = /* @__PURE__ */ Symbol("kError");
    var kMessage = /* @__PURE__ */ Symbol("kMessage");
    var kReason = /* @__PURE__ */ Symbol("kReason");
    var kTarget = /* @__PURE__ */ Symbol("kTarget");
    var kType = /* @__PURE__ */ Symbol("kType");
    var kWasClean = /* @__PURE__ */ Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module2.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "node_modules/ws/lib/extension.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension) => {
        let configurations = extensions[extension];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module2.exports = { format, parse };
  }
});

// node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "node_modules/ws/lib/websocket.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var https = require("https");
    var http2 = require("http");
    var net = require("net");
    var tls = require("tls");
    var { randomBytes, createHash } = require("crypto");
    var { Duplex, Readable } = require("stream");
    var { URL } = require("url");
    var PerMessageDeflate = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format, parse } = require_extension();
    var { toBuffer } = require_buffer_util();
    var closeTimeout = 30 * 1e3;
    var kAborted = /* @__PURE__ */ Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate.extensionName]) {
          this._extensions[PerMessageDeflate.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module2.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        protocolVersion: protocolVersions[1],
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL(address);
        } catch (e) {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes(16).toString("base64");
      const request = isSecure ? https.request : http2.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate(
          opts.perMessageDeflate !== true ? opts.perMessageDeflate : {},
          false,
          opts.maxPayload
        );
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      let chunk;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && (chunk = websocket._socket.read()) !== null) {
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
  }
});

// node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "node_modules/ws/lib/stream.js"(exports2, module2) {
    "use strict";
    var WebSocket2 = require_websocket();
    var { Duplex } = require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module2.exports = createWebSocketStream2;
  }
});

// node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "node_modules/ws/lib/subprotocol.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module2.exports = { parse };
  }
});

// node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "node_modules/ws/lib/websocket-server.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var http2 = require("http");
    var { Duplex } = require("stream");
    var { createHash } = require("crypto");
    var extension = require_extension();
    var PerMessageDeflate = require_permessage_deflate();
    var subprotocol = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http2.createServer((req, res) => {
            const body = http2.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version !== 13 && version !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate(
            this.options.perMessageDeflate,
            true,
            this.options.maxPayload
          );
          try {
            const offers = extension.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
              extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate.extensionName]) {
          const params = extensions[PerMessageDeflate.extensionName].params;
          const value = extension.format({
            [PerMessageDeflate.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module2.exports = WebSocketServer2;
    function addListeners(server, map) {
      for (const event of Object.keys(map)) server.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server) {
      server._state = CLOSED;
      server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http2.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http2.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
      if (server.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
  }
});

// server/game-server.mjs
var game_server_exports = {};
__export(game_server_exports, {
  ADMIN_SHIP: () => ADMIN_SHIP,
  AEV_HP: () => AEV_HP,
  BOSS_HIT_CAP: () => BOSS_HIT_CAP,
  BOSS_LIFE_MS: () => BOSS_LIFE_MS,
  COMBAT_HEAL_SECONDS: () => COMBAT_HEAL_SECONDS,
  COMBAT_MS: () => COMBAT_MS,
  DOM_BASE_R: () => DOM_BASE_R,
  DOM_LOCK_MS: () => DOM_LOCK_MS,
  DOM_LOCK_SLACK: () => DOM_LOCK_SLACK,
  FAR_EVERY: () => FAR_EVERY,
  GOD_MARGIN: () => GOD_MARGIN,
  HEAL_SECONDS: () => HEAL_SECONDS,
  HP_BONUS_MAX: () => HP_BONUS_MAX,
  ISLAND_KEYS: () => ISLAND_KEYS,
  LIMITS: () => LIMITS,
  LOOT: () => LOOT,
  LS_AMMO: () => LS_AMMO,
  NEAR: () => NEAR,
  NPC_DMG_MODEL: () => NPC_DMG_MODEL,
  NPC_FIRE_RANGE: () => NPC_FIRE_RANGE,
  NPC_KILL_SHARE: () => NPC_KILL_SHARE,
  NPC_LEASH: () => NPC_LEASH,
  NPC_RANGE: () => NPC_RANGE,
  NPC_RESPAWN_MS: () => NPC_RESPAWN_MS,
  NPC_SPAWN_GRACE: () => NPC_SPAWN_GRACE,
  PVP_RANGE: () => PVP_RANGE,
  RUIN_MS: () => RUIN_MS,
  Rate: () => Rate,
  SHORE_SLACK: () => SHORE_SLACK,
  SIEGE_HIT_CAP: () => SIEGE_HIT_CAP,
  SIEGE_PIECES: () => SIEGE_PIECES,
  SIEGE_ROOM: () => SIEGE_ROOM,
  TICK_MS: () => TICK_MS,
  TOWER_HEAL_CAP: () => TOWER_HEAL_CAP,
  TOWER_HIT_CAP: () => TOWER_HIT_CAP,
  TOWER_SLOTS: () => TOWER_SLOTS,
  USE_COOLDOWN: () => USE_COOLDOWN,
  addCredit: () => addCredit,
  aevHit: () => aevHit,
  aevOpen: () => aevOpen,
  aevPools: () => aevPools,
  aevState: () => aevState,
  aevTier: () => aevTier,
  attackTarget: () => attackTarget,
  bossCredit: () => bossCredit,
  bossHit: () => bossHit,
  bossInfo: () => bossInfo,
  bossKill: () => bossKill,
  bossPool: () => bossPool,
  bossSeas: () => bossSeas,
  buildBatch: () => buildBatch,
  buildLoadout: () => buildLoadout,
  canJoin: () => canJoin,
  cannonsOf: () => cannonsOf,
  checkFire: () => checkFire,
  checkState: () => checkState,
  chestPicked: () => chestPicked,
  chestReward: () => chestReward,
  domDrop: () => domDrop,
  domFinish: () => domFinish,
  domLobby: () => domLobby,
  domLocked: () => domLocked,
  domMatchOfSea: () => domMatchOfSea,
  domMatches: () => domMatches,
  domMove: () => domMove,
  domOpen: () => domOpen,
  domPending: () => domPending,
  domPump: () => domPump,
  domQueue: () => domQueue,
  domSink: () => domSink,
  domStart: () => domStart,
  domStep: () => domStep,
  dpsCap: () => dpsCap,
  dpsTake: () => dpsTake,
  flushCredit: () => flushCredit,
  godCheck: () => godCheck,
  guildOf: () => guildOf,
  heroUntil: () => heroUntil,
  hpCap: () => hpCap,
  isAdminToken: () => isAdminToken,
  islandFromRow: () => islandFromRow,
  islandInfo: () => islandInfo,
  islands: () => islands,
  killCredit: () => killCredit,
  loadIslands: () => loadIslands,
  lootFor: () => lootFor,
  lootInfo: () => lootInfo,
  lootTake: () => lootTake,
  lootTick: () => lootTick,
  lsAddItem: () => lsAddItem,
  lsAttack: () => lsAttack,
  lsDrop: () => lsDrop,
  lsDropPick: () => lsDropPick,
  lsFinish: () => lsFinish,
  lsLobby: () => lsLobby,
  lsMatchOfSea: () => lsMatchOfSea,
  lsMatches: () => lsMatches,
  lsMove: () => lsMove,
  lsOpen: () => lsOpen,
  lsOut: () => lsOut,
  lsPending: () => lsPending,
  lsPick: () => lsPick,
  lsPump: () => lsPump,
  lsQueue: () => lsQueue,
  lsSpeed: () => lsSpeed,
  lsStart: () => lsStart,
  lsStep: () => lsStep,
  noteHp: () => noteHp,
  noteSalvo: () => noteSalvo,
  noteUse: () => noteUse,
  npcApply: () => npcApply,
  npcDeathCredit: () => npcDeathCredit,
  npcFill: () => npcFill,
  npcFire: () => npcFire,
  npcHit: () => npcHit,
  npcInfo: () => npcInfo,
  npcMove: () => npcMove,
  npcSpawn: () => npcSpawn,
  onLand: () => onLand,
  osbMatch: () => osbMatch,
  parseForm: () => parseForm,
  parseOsb: () => parseOsb,
  pendingCredits: () => pendingCredits,
  perBall: () => perBall,
  pickSpot: () => pickSpot,
  placeMine: () => placeMine,
  pvpGuard: () => pvpGuard,
  pvpHeal: () => pvpHeal,
  pvpReset: () => pvpReset,
  questCooldowns: () => questCooldowns,
  questCredit: () => questCredit,
  resetSiege: () => resetSiege,
  saveServerState: () => saveServerState,
  sbTake: () => sbTake,
  seaMap: () => seaMap,
  seaMines: () => seaMines,
  seaNpcs: () => seaNpcs,
  seaTier: () => seaTier,
  shipAllowed: () => shipAllowed,
  shotCheck: () => shotCheck,
  siegeCredit: () => siegeCredit,
  siegeHitPiece: () => siegeHitPiece,
  siegeInfo: () => siegeInfo,
  siegeJoin: () => siegeJoin,
  siegeRun: () => siegeRun,
  siegeWindowAt: () => siegeWindowAt,
  spByUid: () => spByUid,
  spCredit: () => spCredit,
  sparklePicked: () => sparklePicked,
  sparkleReward: () => sparkleReward,
  towerHit: () => towerHit,
  treasureDig: () => treasureDig,
  treasures: () => treasures,
  verifyOsb: () => verifyOsb,
  verifyToken: () => verifyToken
});
module.exports = __toCommonJS(game_server_exports);
var import_node_http = __toESM(require("node:http"), 1);
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_crypto = __toESM(require("node:crypto"), 1);

// node_modules/ws/wrapper.mjs
var import_stream = __toESM(require_stream(), 1);
var import_receiver = __toESM(require_receiver(), 1);
var import_sender = __toESM(require_sender(), 1);
var import_websocket = __toESM(require_websocket(), 1);
var import_websocket_server = __toESM(require_websocket_server(), 1);

// src/pve-balance.ts
var PVE_HP = [
  [],
  [8e3, 18e3, 35e3, 6e4],
  [2e4, 45e3, 85e3, 14e4],
  [45e3, 9e4, 17e4, 28e4],
  [8e4, 16e4, 3e5, 5e5],
  [13e4, 26e4, 48e4, 8e5],
  [2e5, 4e5, 75e4, 125e4],
  [3e5, 6e5, 11e5, 18e5],
  [45e4, 9e5, 165e4, 26e5]
];
var PVE_XP = [
  [],
  [100, 175, 300, 500],
  [160, 280, 480, 800],
  [250, 440, 750, 1250],
  [400, 700, 1200, 2e3],
  [600, 1050, 1800, 3e3],
  [900, 1575, 2700, 4500],
  [1300, 2275, 3900, 6500],
  [1800, 3150, 5400, 9e3]
];
var BOSS_HP = [0, 165e3, 41e4, 98e4, 22e5, 3e6, 45e5, 58e5, 63e5];
var SIEGE_HP_PER_CAPTAIN = { wall: 78e5, inner: 196e5, commander: 78e6 };

// src/fleetBalance.ts
var PLAYER_LEVEL_HP = [0, 54e3, 108e3, 228e3, 54e4, 69e4, 78e4, 93e4, 105e4];
var HULL_HP = 15e3;
var playerBaseHp = (level, hull) => PLAYER_LEVEL_HP[Math.max(1, Math.min(8, Math.round(level)))] + hull * HULL_HP;
var REF_HULL = [0, 0, 1, 2, 4, 6, 8, 10, 10];
var damageScale = (tier) => {
  const t = Math.max(1, Math.min(8, Math.round(tier)));
  return playerBaseHp(t, REF_HULL[t]) / (75e3 + (t - 1) * 2500 + REF_HULL[t] * 2500);
};
function fleetTowerStats(tier) {
  const step = Math.max(0, Math.min(8, tier) - 2);
  return {
    hp: Math.round(378e5 * (1 + 0.025 * step)),
    damage: Math.round(17600 * (1 + 0.015 * step) * damageScale(8)),
    reload: 3,
    range: 460,
    ownDamage: Math.round(117300 * (1 + 0.015 * step))
  };
}

// src/pvp.ts
var PVP_MIN_SECONDS = 20;
var PVP_BURST = 0.06;
var newPvpBudget = (maxHp, now) => ({ pool: maxHp * PVP_BURST, t: now });
function pvpClamp(b, maxHp, hit, now) {
  const cap = maxHp * PVP_BURST;
  b.pool = Math.min(cap, b.pool + Math.max(0, now - b.t) * maxHp / PVP_MIN_SECONDS);
  b.t = now;
  const dealt = Math.max(0, Math.min(hit, b.pool));
  b.pool -= dealt;
  return dealt;
}

// src/battle.ts
var RIVAL_SP = 25;
var RIVAL_DAILY_LIMIT = 3;

// src/campaign.ts
var WORLD_WIDTH = 6e3;
var WORLD_HEIGHT = 4e3;
var tierOf = (key) => Number(key.split("/")[0]);
var LEVEL_XP = [0, 2e4, 2e5, 5e5, 15e5, 32e5, 58e5, 114e5];
var THEMES = {
  1: { name: "G\xFCvenli Harita", sea: ["#09304a", "#082b43"], tint: "#6fd6c4", look: "haven", fleet: "verdant", label: "#b7d9d1" },
  2: { name: "\u0130nciyolu Denizi", sea: ["#09304a", "#082b43"], tint: "#8ff0dc", look: "coral", fleet: "coral", label: "#c8f4ea" },
  3: { name: "Azurya Denizi", sea: ["#09304a", "#082b43"], tint: "#82cbdc", look: "verdant", fleet: "verdant", label: "#c8eaf0" },
  4: { name: "Hayalet Denizi", sea: ["#09304a", "#082b43"], tint: "#9fb8b4", look: "misty", fleet: "misty", label: "#c8d4ce" },
  5: { name: "Buzmahzen Denizi", sea: ["#09304a", "#082b43"], tint: "#bfe6ff", look: "ice", fleet: "ice", label: "#e8f6ff" },
  6: { name: "F\u0131rt\u0131na Denizi", sea: ["#09304a", "#082b43"], tint: "#9fb4e0", look: "storm", fleet: "storm", label: "#c8d4f0" },
  7: { name: "Karanl\u0131k U\xE7urum Denizi", sea: ["#09304a", "#082b43"], tint: "#a79bdb", look: "abyss", fleet: "abyss", label: "#d8c0ff" },
  8: { name: "Alev Denizi", sea: ["#09304a", "#082b43"], tint: "#ff8a3a", look: "lava", fleet: "lava", label: "#ffc090" }
};
var XP_PER_HP = (_tier) => 1 / 120;
var GOLD_PER_HP = 0.65 / 90;
var killReward = (hp, tier) => ({ xp: Math.round(hp * XP_PER_HP(tier)), gold: Math.round(hp * GOLD_PER_HP) });
var hpScale = (tier) => Math.pow(1.6, tier - 1);
var dmgScale = (tier) => Math.min(4, 1 + 0.5 * (tier - 1));
var NPC_SPAN = { small: 84, medium: 112, large: 144 };
var npcSize = (id) => id.endsWith("-1-light") ? "small" : id.endsWith("-2-heavy") ? "large" : "medium";
var npc = (id, name, role, tier, sprite = "") => {
  const span = NPC_SPAN[npcSize(id)];
  const dmg = role === "light" ? 750 : 1650, t = tier - 1, size = npcSize(id) === "small" ? 0 : npcSize(id) === "medium" ? 1 : 2, hp = PVE_HP[tier][size], r = { xp: PVE_XP[tier][size], gold: killReward(Math.round((size === 0 ? 3750 : 9e3) * hpScale(tier)), tier).gold };
  const soft = role === "heavy" && tier <= 3 ? 0.8 : 1;
  return { id, name, sprite, span, role, tier, hp, damage: Math.round(dmg * dmgScale(tier) * soft * damageScale(tier)), reload: role === "light" ? 2.6 : 2.7, speed: (role === "light" ? 50 : 34) + t * 1.5, gold: r.gold, xp: r.xp };
};
var NPC_LIST = [
  npc("n1-1-light", "K\u0131y\u0131 Sandal\u0131", "light", 1, "/assets/trial-coast-boat-dir16-v1.webp"),
  npc("n1-1-heavy", "T\xFCccar Yelkenlisi", "heavy", 1, "/assets/trial-coast-merchant-dir16-v1.webp"),
  npc("n1-2-light", "T\xFCccar Yelkenlisi", "light", 1, "/assets/trial-coast-merchant-dir16-v1.webp"),
  npc("n1-2-heavy", "Kraliyet Firkateyni", "heavy", 1, "/assets/trial-coast-frigate-dir16-v1.webp"),
  npc("n2-1-light", "Sedef Kay\u0131\u011F\u0131", "light", 2, "/assets/pearl-boat-dir16-v1.webp"),
  npc("n2-1-heavy", "Mercan Kesici", "heavy", 2, "/assets/pearl-cutter-dir16-v1.webp"),
  npc("n2-2-light", "Mercan Kesici", "light", 2, "/assets/pearl-cutter-dir16-v1.webp"),
  npc("n2-2-heavy", "\u0130nci Krali\xE7e Kalyonu", "heavy", 2, "/assets/pearl-galleon-dir16-v1.webp"),
  npc("n3-1-light", "Ye\u015Fim S\xFCr\xFCklenen", "light", 3, "/assets/azur-boat-dir16-v1.webp"),
  npc("n3-1-heavy", "Kristal Yelkenli", "heavy", 3, "/assets/azur-sail-dir16-v1.webp"),
  npc("n3-2-light", "Kristal Yelkenli", "light", 3, "/assets/azur-sail-dir16-v1.webp"),
  npc("n3-2-heavy", "Kadim Azur Gardiyan\u0131", "heavy", 3, "/assets/azur-guardian-dir16-v1.webp"),
  npc("n4-1-light", "Solgun Ruh", "light", 4, "/assets/haunt-boat-dir16-v1.webp"),
  npc("n4-1-heavy", "Lanetli Yelken", "heavy", 4, "/assets/haunt-sail-dir16-v1.webp"),
  npc("n4-2-light", "Lanetli Yelken", "light", 4, "/assets/haunt-sail-dir16-v1.webp"),
  npc("n4-2-heavy", "Gece Deh\u015Feti F\u0131rkateyni", "heavy", 4, "/assets/haunt-frigate-dir16-v1.webp"),
  npc("n5-1-light", "Donuk Yelkenli", "light", 5, "/assets/frost-sail-dir16-v1.webp"),
  npc("n5-1-heavy", "Buz Kesici", "heavy", 5, "/assets/frost-sail-dir16-v1.webp"),
  npc("n5-2-light", "Buz Kesici", "light", 5, "/assets/frost-sail-dir16-v1.webp"),
  npc("n5-2-heavy", "K\u0131\u015F Z\u0131pk\u0131n\u0131 Kalyonu", "heavy", 5, "/assets/frost-galleon-dir16-v1.webp"),
  npc("n6-1-light", "Ya\u011Fmur Yaran", "light", 6, "/assets/storm-sail-dir16-v1.webp"),
  npc("n6-1-heavy", "F\u0131rt\u0131na Kesici", "heavy", 6, "/assets/storm-sail-dir16-v1.webp"),
  npc("n6-2-light", "F\u0131rt\u0131na Kesici", "light", 6, "/assets/storm-sail-dir16-v1.webp"),
  npc("n6-2-heavy", "\u015Eim\u015Fek Lordu", "heavy", 6, "/assets/storm-galleon-dir16-v1.webp"),
  npc("n7-1-light", "Obsidyen B\u0131\xE7a\u011F\u0131", "light", 7, "/assets/void-sail-dir16-v1.webp"),
  npc("n7-1-heavy", "Obsidyen Ak\u0131nc\u0131s\u0131", "heavy", 7, "/assets/void-sail-dir16-v1.webp"),
  npc("n7-2-light", "Obsidyen Ak\u0131nc\u0131s\u0131", "light", 7, "/assets/void-sail-dir16-v1.webp"),
  npc("n7-2-heavy", "Hi\xE7lik Sava\u015F\xE7\u0131s\u0131", "heavy", 7, "/assets/void-galleon-dir16-v1.webp"),
  npc("n8-1-light", "Lav Yaran", "light", 8, "/assets/lava-sail-dir16-v1.webp"),
  npc("n8-1-heavy", "Lav Ak\u0131nc\u0131s\u0131", "heavy", 8, "/assets/lava-sail-dir16-v1.webp"),
  npc("n8-2-light", "Lav Ak\u0131nc\u0131s\u0131", "light", 8, "/assets/lava-sail-dir16-v1.webp"),
  npc("n8-2-heavy", "Cehennem Kalyonu", "heavy", 8, "/assets/lava-galleon-dir16-v1.webp")
];
var NPCS = Object.fromEntries(NPC_LIST.map((n, i) => [n.id, { ...n, portrait: i }]));
var PORTRAIT_COUNT = NPC_LIST.length + 16;
var BOSS_KILLS = 200;
var BOSS_NAMES = {
  "1/1": "\u0130mparatorluk F\u0131rkateyni",
  "1/2": "\u0130mparatorluk F\u0131rkateyni",
  "2/1": "\u0130nci Krali\xE7esi",
  "2/2": "\u0130nci Krali\xE7esi",
  "3/1": "Kadim Azur \u0130mparatoru",
  "3/2": "Kadim Azur \u0130mparatoru",
  "4/1": "Gece Deh\u015Fet \u0130mparatoru",
  "4/2": "Gece Deh\u015Fet \u0130mparatoru",
  "5/1": "K\u0131\u015F Z\u0131pk\u0131n \u0130mparatoru",
  "5/2": "K\u0131\u015F Z\u0131pk\u0131n \u0130mparatoru",
  "6/1": "\u015Eim\u015Fek \u0130mparatoru",
  "6/2": "\u015Eim\u015Fek \u0130mparatoru",
  "7/1": "Hi\xE7lik \u0130mparatoru",
  "7/2": "Hi\xE7lik \u0130mparatoru",
  "8/1": "Cehennem Lordu",
  "8/2": "Cehennem Lordu"
};
var BOSS_DAMAGE = 0.17;
var bossFor = (key) => {
  const m = MAPS[key], h = NPCS[`n${m.tier}-2-heavy`], hp = BOSS_HP[m.tier], i = MAP_KEYS.indexOf(key);
  return {
    key,
    id: `boss-${key.replace("/", "-")}`,
    name: BOSS_NAMES[key],
    sprite: `/assets/boss-t${m.tier}-dir16-v2.webp`,
    span: 260,
    role: "heavy",
    tier: m.tier,
    hp,
    damage: Math.round(h.damage * BOSS_DAMAGE),
    reload: 2.2,
    speed: Math.round(h.speed * 0.8),
    gold: 0,
    xp: h.xp * 20,
    pearls: 50 * m.tier,
    portrait: i,
    trigger: h.id
  };
};
var GRID_COLS = 61;
var GRID_ROWS = 78;
var CELL_W = WORLD_WIDTH / GRID_COLS;
var CELL_H = WORLD_HEIGHT / GRID_ROWS;
var colName = (c) => String(c).padStart(2, "0");
var rowName = (r) => String.fromCharCode(65 + Math.floor(r / 26)) + String.fromCharCode(65 + r % 26);
var gridCell = (p2) => ({ c: Math.max(0, Math.min(GRID_COLS - 1, Math.floor(p2.x / CELL_W))), r: Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(p2.y / CELL_H))) });
function coordLabel(p2) {
  const g2 = gridCell(p2);
  return `${colName(g2.c)}${rowName(g2.r)}`;
}
var FLEET_SCALE = 0.8;
var FLEET_TOWERS_RAW = [
  [-577, -76],
  [-385, -194],
  [-140, -252],
  [148, -255],
  [417, -178],
  [601, -49],
  [-589, 197],
  [-384, 315],
  [-133, 386],
  [142, 385],
  [409, 330],
  [600, 217],
  [-131, -26],
  [132, -22],
  [-157, 98],
  [179, 108]
];
var FLEET = {
  islandR: 760 * FLEET_SCALE,
  wallR: 600 * FLEET_SCALE,
  gap: 0.6,
  towers: FLEET_TOWERS_RAW.map(([x, y]) => [Math.round(x * FLEET_SCALE), Math.round(y * FLEET_SCALE)])
};
var fleetReward = (tier) => ({ gold: 300 * tier, xp: Math.round(500 * Math.pow(tier, 1.2)) });
var I = (x, y, r, name, look, variant, flip = false) => ({ x, y, r, name, look, variant, flip });
function sea(key, name, description, opts) {
  const tier = tierOf(key), look = opts.look ?? THEMES[tier].look, sub = key.split("/")[1];
  return {
    key,
    tier,
    name,
    description,
    safe: !!opts.safe,
    npcs: [`n${tier}-${sub}-light`, `n${tier}-${sub}-heavy`, ...tier <= 8 ? [sub === "1" ? `n${tier}-2-heavy` : `n${tier}-1-light`] : []],
    npcCount: opts.safe ? 12 : 16,
    heavyShare: opts.heavy ?? 0.3 + tier * 0.03,
    islands: opts.islands.map(([x, y, r, n, v, f]) => I(x, y, r, n, look, v, !!f)),
    fleet: { x: opts.fleet[0], y: opts.fleet[1], name: opts.fleet[2] },
    labels: (opts.labels ?? []).map(([text, x, y]) => ({ text, x, y })),
    spawn: { x: opts.fleet[0], y: opts.fleet[1] + 530 }
  };
}
var MAPS = {
  "1/1": { ...sea(
    "1/1",
    "S\u0131\u011F\u0131nak Koyu",
    "Sava\u015Fa kapal\u0131 ba\u015Flang\u0131\xE7 denizi. Filo adan\u0131n lag\xFCn\xFCnde g\xF6vde kendili\u011Finden onar\u0131l\u0131r; buradaki gemiler sen sald\u0131rmad\u0131k\xE7a ate\u015F a\xE7maz.",
    { islands: [[640, 700, 170, "Mart\u0131 Kayas\u0131", 1], [2520, 820, 190, "Yosunlu Burun", 0, true], [2560, 2560, 160, "Sakin Resif", 1]], fleet: [1500, 1900, "S\u0131\u011F\u0131nak Filo Adas\u0131"], labels: [["SAK\u0130N SULAR", 1600, 700]], safe: true, count: 6, heavy: 0.25 }
  ), islands: [I(640, 700, 170, "Mart\u0131 Kayas\u0131", "haven", 1), I(2520, 820, 190, "Yosunlu Burun", "verdant", 0, true), I(2560, 2560, 160, "Sakin Resif", "coral", 1)] },
  "1/2": sea("1/2", "Mart\u0131 K\u0131y\u0131lar\u0131", "K\u0131y\u0131 Sandal\u0131, T\xFCccar Yelkenlisi ve Kraliyet Firkateyni bu sularda gezer.", { safe: true, islands: [[700, 650, 180, "F\u0131rt\u0131na Burnu", 0], [2500, 700, 210, "\xD6l\xFC Adam Adas\u0131", 1], [650, 2500, 200, "Sis Kayal\u0131klar\u0131", 0, true]], fleet: [2150, 2150, "Mart\u0131 Filo Adas\u0131"], labels: [["KIYI SULARI", 1400, 1e3]] }),
  "2/1": sea("2/1", "Mercan Ge\xE7idi", "Sedef Kay\u0131\u011F\u0131, Mercan Kesici ve \u0130nci Krali\xE7e Kalyonu mercan resiflerinde gezer.", { islands: [[650, 700, 190, "Mercan Kalesi", 0], [2550, 600, 160, "Pembe Resif", 1], [600, 2550, 170, "Deniz Kabu\u011Fu", 1, true]], fleet: [2050, 2100, "Mercan Filo Adas\u0131"], labels: [["MERCAN GE\xC7\u0130D\u0130", 1300, 900]] }),
  "2/2": sea("2/2", "\u0130nci Resifleri", "Sedef Kay\u0131\u011F\u0131, Mercan Kesici ve \u0130nci Krali\xE7e Kalyonu ile parlak resif sular\u0131.", { islands: [[2550, 700, 180, "\u0130nci Adas\u0131", 1], [700, 650, 200, "Lag\xFCn Adas\u0131", 0, true], [2600, 2550, 150, "Midye Kayas\u0131", 0]], fleet: [1150, 2100, "\u0130nci Filo Adas\u0131"], labels: [["\u0130NC\u0130 SI\u011ELI\u011EI", 1900, 1e3]] }),
  "3/1": sea("3/1", "Sis Kayal\u0131klar\u0131", "Ye\u015Fim S\xFCr\xFCklenen, Kristal Yelkenli ve Kadim Azur Gardiyan\u0131 bu sularda gezer.", { islands: [[650, 650, 200, "Sis Burnu", 0], [2550, 650, 180, "Kay\u0131p Fener", 1], [2550, 2550, 190, "Yank\u0131 Kayas\u0131", 0, true]], fleet: [1200, 2150, "Azurya Filo Adas\u0131"], labels: [["S\u0130S DEN\u0130Z\u0130", 2e3, 1300]] }),
  "3/2": sea("3/2", "Hayalet Bo\u011Faz\u0131", "Ye\u015Fim S\xFCr\xFCklenen, Kristal Yelkenli ve Kadim Azur Gardiyan\u0131 ile Azurya\u2019n\u0131n ge\xE7i\u015F sular\u0131.", { islands: [[700, 2550, 210, "Mezar Adas\u0131", 1], [2500, 2550, 170, "Kemik K\u0131y\u0131s\u0131", 0], [2550, 650, 190, "Bat\u0131klar Burnu", 1, true]], fleet: [1200, 1100, "Ye\u015Fim Filo Adas\u0131"], labels: [["HAYALET BO\u011EAZI", 2e3, 1800]] }),
  "4/1": sea("4/1", "Kan K\xF6rfezi", "Solgun Ruh, Lanetli Yelken ve Gece Deh\u015Feti F\u0131rkateyni bu lanetli sularda gezer.", { islands: [[650, 650, 190, "Kan Kayas\u0131", 0], [2550, 700, 160, "K\u0131z\u0131l Di\u015F", 1], [650, 2550, 200, "K\u0131r\u0131k S\xFCtunlar", 0, true]], fleet: [2050, 2100, "Hayalet Filo Adas\u0131"], labels: [["KAN K\xD6RFEZ\u0130", 1300, 1e3]] }),
  "4/2": sea("4/2", "Pasl\u0131 S\u0131\u011Fl\u0131k", "Solgun Ruh, Lanetli Yelken ve Gece Deh\u015Feti F\u0131rkateyni ile hayaletlerin sisli s\u0131\u011Fl\u0131\u011F\u0131.", { islands: [[2550, 650, 190, "Pasl\u0131 \xC7apa Adas\u0131", 1], [650, 700, 170, "Hurda K\u0131y\u0131s\u0131", 0, true], [2500, 2550, 200, "Demir Kayal\u0131k", 0]], fleet: [1150, 2100, "Bat\u0131k Filo Adas\u0131"], labels: [["PASLI SI\u011ELIK", 1900, 1e3]] }),
  "5/1": sea("5/1", "Ayaz Bo\u011Faz\u0131", "Donuk Yelkenli ve K\u0131\u015F Z\u0131pk\u0131n\u0131 Kalyonu buz k\xFCtleleri aras\u0131nda dola\u015F\u0131r.", { islands: [[650, 650, 200, "Ayaz Tepesi", 0], [2550, 650, 180, "Donmu\u015F Fener", 1], [650, 2550, 180, "Kar Kayas\u0131", 1, true]], fleet: [2050, 2100, "Ayaz Filo Adas\u0131"], labels: [["AYAZ BO\u011EAZI", 1300, 1e3]] }),
  "5/2": sea("5/2", "Kristal Buzullar", "Donuk Yelkenli ve K\u0131\u015F Z\u0131pk\u0131n\u0131 Kalyonu ile buzullar\u0131n par\u0131ldayan so\u011Fuk derinlikleri.", { islands: [[2550, 650, 210, "Kristal Buzul", 0], [650, 700, 170, "I\u015F\u0131lt\u0131 Kayas\u0131", 1, true], [2550, 2550, 180, "Kutup Kap\u0131s\u0131", 1]], fleet: [1150, 2100, "Kristal Filo Adas\u0131"], labels: [["KR\u0130STAL BUZULLAR", 1900, 1e3]] }),
  "6/1": sea("6/1", "Zehirli Mangrov", "Ya\u011Fmur Yaran ve \u015Eim\u015Fek Lordu f\u0131rt\u0131nal\u0131 sularda gezer.", { islands: [[650, 650, 200, "Mangrov K\xF6k\xFC", 0], [2550, 650, 170, "\xC7amur K\u0131y\u0131s\u0131", 1], [650, 2550, 190, "Sarma\u015F\u0131k Adas\u0131", 1, true]], fleet: [2050, 2100, "F\u0131rt\u0131na Filo Adas\u0131"], labels: [["ZEH\u0130RL\u0130 MANGROV", 1300, 1e3]] }),
  "6/2": sea("6/2", "\xC7\xFCr\xFCk Lag\xFCn", "Ya\u011Fmur Yaran ve \u015Eim\u015Fek Lordu ile f\u0131rt\u0131nan\u0131n \u015Fim\u015Fekli lag\xFCn\xFC.", { islands: [[2550, 650, 190, "\xC7\xFCr\xFCk Ada", 0], [650, 700, 180, "Bal\xE7\u0131k Kayas\u0131", 1, true], [2500, 2550, 200, "Veba K\u0131y\u0131s\u0131", 1]], fleet: [1150, 2100, "\u015Eim\u015Fek Filo Adas\u0131"], labels: [["\xC7\xDCR\xDCK LAG\xDCN", 1900, 1e3]] }),
  "7/1": sea("7/1", "K\xFCl Adalar\u0131", "Obsidyen B\u0131\xE7a\u011F\u0131 ve Hi\xE7lik Sava\u015F\xE7\u0131s\u0131 bu karanl\u0131k sularda gezer.", { islands: [[650, 650, 210, "K\xFCl Da\u011F\u0131", 0], [2550, 650, 180, "Duman Kayas\u0131", 1], [650, 2550, 170, "Kor Adas\u0131", 1, true]], fleet: [2050, 2100, "U\xE7urum Filo Adas\u0131"], labels: [["K\xDCL ADALARI", 1300, 1e3]] }),
  "7/2": sea("7/2", "Magma Bo\u011Faz\u0131", "Obsidyen B\u0131\xE7a\u011F\u0131 ve Hi\xE7lik Sava\u015F\xE7\u0131s\u0131 ile u\xE7urumun karanl\u0131k bo\u011Faz\u0131.", { islands: [[2550, 650, 200, "Magma Kap\u0131s\u0131", 1], [650, 700, 180, "Yan\u0131k K\u0131y\u0131", 0, true], [2550, 2550, 190, "Ate\u015F \xC7ukuru", 0]], fleet: [1150, 2100, "G\xF6lge Filo Adas\u0131"], labels: [["MAGMA BO\u011EAZI", 1900, 1e3]] }),
  "8/1": sea("8/1", "\u015Eim\u015Fek Denizi", "Lav Yaran ve Cehennem Kalyonu kaynayan sularda gezer.", { islands: [[650, 650, 200, "\u015Eim\u015Fek Kayal\u0131klar\u0131", 0], [2550, 650, 170, "G\xF6k Kulesi", 1], [650, 2550, 190, "Sessiz Mezar", 1, true]], fleet: [2050, 2100, "Alev Filo Adas\u0131"], labels: [["\u015E\u0130M\u015EEK DEN\u0130Z\u0130", 1300, 1e3]] }),
  "8/2": sea("8/2", "Kas\u0131rga G\xF6z\xFC", "Lav Yaran ve Cehennem Kalyonu ile lav\u0131n \xF6l\xFCmc\xFCl sular\u0131.", { islands: [[2550, 650, 190, "Kas\u0131rga Burnu", 1], [650, 700, 180, "R\xFCzg\xE2r Kayas\u0131", 0, true], [2550, 2550, 200, "G\xFCr\xFClt\xFC Adas\u0131", 0]], fleet: [1150, 2100, "Magma Filo Adas\u0131"], labels: [["KASIRGA G\xD6Z\xDC", 1900, 1e3]] })
};
var MAP_KEYS = Object.keys(MAPS);
var SEA_LORE = {
  1: "Kaptanlar\u0131n dinlendi\u011Fi korunakl\u0131 k\u0131y\u0131lar.",
  2: "\u0130nci gibi parlayan adalar, sakin meltemler ve denizk\u0131zlar\u0131n\u0131n ezgileri.",
  3: "G\xF6ky\xFCz\xFCn\xFC yans\u0131tan mavi sularda kadim uygarl\u0131klar\u0131n izleri sakl\u0131d\u0131r.",
  4: "G\xF6lgege\xE7it efsanesinin sular\u0131: sis i\xE7indeki g\xF6r\xFCnmez kap\u0131lar ve kay\u0131p gemiler.",
  5: "Sonsuz k\u0131\u015F\u0131n h\xFCk\xFCm s\xFCrd\xFC\u011F\xFC, buz alt\u0131nda kadim hazinelerin sakland\u0131\u011F\u0131 deniz.",
  6: "F\u0131rt\u0131na Taht\u0131 efsanesinin denizi; r\xFCzg\xE2rlar\u0131n ve cesur kaptanlar\u0131n s\u0131nav\u0131.",
  7: "Karanl\u0131k derinliklerde unutulmu\u015F g\xFC\xE7lerin ve kay\u0131p s\u0131rlar\u0131n denizi.",
  8: "Alev Sular\u0131 efsanesi: volkanlar\u0131n k\u0131zg\u0131n lavlar\u0131yla \xE7evrili kayal\u0131klar."
};
function islandLayout(key, fleet) {
  let seed = 2166136261;
  for (const c of `island-art-v2:${key}`) seed = Math.imul(seed ^ c.charCodeAt(0), 16777619);
  const random = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  const result = [], tier = tierOf(key), count = 8 + Math.floor(random() * 4);
  const variants = [0, 1, 2, 3, 4, 5];
  for (let i = variants.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [variants[i], variants[j]] = [variants[j], variants[i]];
  }
  const spawn = { x: fleet.x, y: Math.min(WORLD_HEIGHT - 200, fleet.y + 900) };
  for (let attempt = 0; attempt < 1e3 && result.length < count; attempt++) {
    const r = 90 + Math.floor(random() * 65), x = Math.round(300 + random() * (WORLD_WIDTH - 600)), y = Math.round(300 + random() * (WORLD_HEIGHT - 600));
    if (tier >= 2 && Math.hypot(x - fleet.x, y - fleet.y) < FLEET.islandR + r + 400) continue;
    if (Math.hypot(x - spawn.x, y - spawn.y) < r + 300) continue;
    if (result.some((i) => Math.hypot(x - i.x, y - i.y) < i.r + r + 230)) continue;
    result.push(I(x, y, r, `${THEMES[tier].name} \xB7 Adac\u0131k ${result.length + 1}`, THEMES[tier].look, variants[result.length % variants.length], false));
  }
  return result;
}
for (const key of MAP_KEYS) {
  const map = MAPS[key];
  map.name = THEMES[map.tier].name;
  map.description = SEA_LORE[map.tier];
  map.fleet.x = Math.round(map.fleet.x * WORLD_WIDTH / 3200);
  map.fleet.y = Math.round(map.fleet.y * WORLD_HEIGHT / 3200);
  map.islands = islandLayout(key, map.fleet);
  map.labels = [{ text: map.name.toLocaleUpperCase("tr"), x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 }];
  map.spawn = { x: map.fleet.x, y: Math.min(WORLD_HEIGHT - 200, map.fleet.y + 900) };
}
var QUEST_BONUS = 1.5;
var QUESTS = MAP_KEYS.flatMap((key) => {
  const m = MAPS[key], t = m.tier, L = NPCS[m.npcs[0]], H = NPCS[m.npcs[1]], pay = (n, u, k = QUEST_BONUS) => ({ gold: Math.round(n * u.gold * k), xp: Math.round(n * u.xp * k) });
  const nL = 20, nH = 20, nC = 20, head = `${key} ${m.name}`;
  return [
    { id: `q${key}-light`, map: key, tier: t, title: `${head}: Devriye Av\u0131`, description: `${L.name} gemilerinden ${nL} tanesini bat\u0131r.`, kind: "npc", ids: [L.id], required: nL, ...pay(nL, L), pearls: 2 * (2 + t) },
    { id: `q${key}-heavy`, map: key, tier: t, title: `${head}: A\u011F\u0131r Filo`, description: `${H.name} gemilerinden ${nH} tanesini denizin dibine g\xF6nder.`, kind: "npc", ids: [H.id], required: nH, ...pay(nH, H), pearls: 2 * (3 + 2 * t) },
    { id: `q${key}-sparkle`, map: key, tier: t, title: `${head}: P\u0131r\u0131lt\u0131 Av\u0131`, description: `Bu denizde ${nC} inci p\u0131r\u0131lt\u0131s\u0131 topla.`, kind: "sparkle", ids: [key], required: nC, ...pay(nC, { gold: L.gold, xp: Math.round(L.xp * 0.5) }, 3), pearls: 2 * (4 + 2 * t) }
  ];
});
var QUEST_COOLDOWN_MS = 8 * 60 * 60 * 1e3;

// src/treasure.ts
var TREASURE_PARTS = 4;
var PART_CHANCE = 0.15;
var DIG_RADIUS = 70;
var TREASURE_AMMO = ["chain", "fire", "explosive", "breaker", "leech"];
function treasureReward(tier, lightGold, rand = Math.random) {
  return { gold: Math.round(lightGold * 30), pearls: 8 + 4 * tier, ammo: TREASURE_AMMO[Math.floor(rand() * TREASURE_AMMO.length)], ammoQty: 150 + 50 * tier, powder: 20 + 5 * tier, shield: 20 + 5 * tier };
}

// src/arsenal.ts
var CONSUMABLES = {
  powder: { name: "Kara Barut", factor: 1.1, icon: "/assets/icon-powder-v4.webp", description: "A\xE7\u0131kken her salvoda 1 adet harcar; top hasar\u0131 %10 artar." },
  shield: { name: "Kalkan", factor: 0.9, icon: "/assets/icon-shield-v3.webp", description: "A\xE7\u0131kken her isabette 1 adet harcar; gelen hasar %10 azal\u0131r." }
};
var BALL_DAMAGE = 20;
var CHAIN_FACTOR = 1.25;
var SPECIAL_AMMO = {
  fire: { name: "Ate\u015F G\xFCllesi", damage: 2.5, reload: 1.1, rangeFactor: 1, burnSeconds: 0, burnDps: 250, blastRadius: 0, blastFactor: 0, towerFactor: 1, leech: 0, icon: "/assets/ammo-fire-v2.webp", description: "NPC ve canavarlara %40 fazla hasar." },
  explosive: { name: "Patlay\u0131c\u0131 G\xFClle", damage: 2.5, reload: 1.1, rangeFactor: 1, burnSeconds: 0, burnDps: 0, blastRadius: 0, blastFactor: 0, towerFactor: 1, leech: 0, icon: "/assets/ammo-explosive-v2.webp", description: "Oyunculara %40 fazla hasar." },
  breaker: { name: "Kule K\u0131r\u0131c\u0131", damage: 2.25, reload: 1.15, rangeFactor: 1, burnSeconds: 0, burnDps: 0, blastRadius: 0, blastFactor: 0, towerFactor: 2.6, leech: 0, icon: "/assets/ammo-breaker-v2.webp", description: "Kulelere ve ada tahkimat\u0131na 2,6 kat hasar." },
  leech: { name: "Can Emici", damage: 3, reload: 1.1, rangeFactor: 1, burnSeconds: 0, burnDps: 0, blastRadius: 0, blastFactor: 0, towerFactor: 1, leech: 0.3, icon: "/assets/ammo-leech-v2.webp", description: "Yaln\u0131z oyunculara kar\u015F\u0131: isabetlerin %20'si hasar\u0131n %15'i kadar can \xE7alar (en \xE7ok can\u0131n\u0131n %2'si)." },
  // Şifa: hasar vermez; vurduğu oyuncunun (ya da dost kulenin) canını, salvonun hasarı kadar doldurur. NPC'ye ve düşmana sıkılamaz.
  heal: { name: "\u015Eifa G\xFCllesi", damage: 1, reload: 1.1, rangeFactor: 1, burnSeconds: 0, burnDps: 0, blastRadius: 0, blastFactor: 0, towerFactor: 1, leech: 0, icon: "/assets/ammo-heal-v1.webp", description: "Hasar vermez: oyuncular\u0131n ve dost kulelerin can\u0131n\u0131 doldurur. NPC'ye s\u0131k\u0131lamaz." }
};
var FIRE_NPC_FACTOR = 1.4;
var EXPLOSIVE_PLAYER_FACTOR = 1.4;
var ELITE_EP = [0, 0, 5e4, 22e4, 58e4, 145e4, 26e5, 38e5, 54e5, 73e5, 98e5, 128e5, 166e5, 212e5, 277e5, 36e6];
var ELITE_MAX_LEVEL = 15;
var questEp = (tier) => 300 * tier;
var bossEp = (tier) => 7500 * tier;
var eliteLevelEp = (level) => ELITE_EP[Math.max(1, Math.min(ELITE_MAX_LEVEL, level))];
var eliteLevelFromEp = (ep) => {
  let l = 1;
  while (l < ELITE_MAX_LEVEL && ep >= eliteLevelEp(l + 1)) l++;
  return l;
};
var MINE = { armSeconds: 1, triggerRadius: 46, blastRadius: 95, baseDamage: 4e3, damagePerLevel: 400, maxActive: 5, icon: "/assets/icon-mine-v2.webp" };
var IRON_EP_PER_BALL = 0.2;
var ELITE_POINTS_PER_BALL = { chain: 1, fire: 1, breaker: 1, explosive: 2, leech: 2, heal: 2 };

// src/rage.ts
var RAGE_DAMAGE = 1.25;

// src/combat.ts
var CANNONS = {
  cast: { name: "D\xF6k\xFCm", damage: 1, range: 390, reload: 1.65 },
  long: { name: "Uzun", damage: 0.82, range: 470, reload: 2.05 },
  rapid: { name: "Seri", damage: 0.68, range: 340, reload: 1.05 },
  heavy: { name: "A\u011F\u0131r", damage: 1.38, range: 365, reload: 2.65 }
};
var ammoMult = (a) => a === "chain" ? CHAIN_FACTOR : a === "iron" ? 1 : SPECIAL_AMMO[a].damage;
function salvoDamage(L, a, n, i, powder, rage) {
  if (L.cannons <= 0) return 0;
  const mix = (a === "iron" ? n + i : n * ammoMult(a) + i) / L.cannons;
  return L.cannons * BALL_DAMAGE * (1 + L.upDamage * 0.11) * CANNONS[L.type].damage * L.crewDamage * mix * (1 + L.equipDamage + L.achDamage + L.eliteDamage + L.hero) * (powder ? CONSUMABLES.powder.factor : 1) * (rage ? RAGE_DAMAGE : 1);
}
function reloadTime(L, a) {
  return (1 - L.equipReload) * CANNONS[L.type].reload * Math.max(0.6, 1 - L.upReload * 0.04) * L.crewReload / (1 + L.eliteReload) * (a === "chain" ? 1.18 : 1) * (a !== "iron" && a !== "chain" ? SPECIAL_AMMO[a].reload : 1);
}
var rangeOf = (L) => CANNONS[L.type].range + L.upRange * 18 + L.crewRange + L.equipRange;
function targetFactor(a, kind) {
  return (a === "fire" && (kind === "npc" || kind === "boss") ? FIRE_NPC_FACTOR : 1) * (a === "explosive" && kind === "player" ? EXPLOSIVE_PLAYER_FACTOR : 1) * (a === "breaker" && kind === "tower" ? SPECIAL_AMMO.breaker.towerFactor : 1);
}

// src/equipment.ts
var g = (amount) => ({ amount, currency: "gold" });
var p = (amount) => ({ amount, currency: "pearls" });
var EQUIPMENT = [
  { id: "sail-0", slot: "sail", rarity: 0, name: "Kanvas Yelken", price: g(25e3), stats: { speed: 0.05 } },
  { id: "sail-2", slot: "sail", rarity: 2, name: "F\u0131rt\u0131na Yelkeni", price: p(2500), stats: { speed: 0.16 } },
  { id: "figure-0", slot: "figure", rarity: 0, name: "Ah\u015Fap Deniz K\u0131z\u0131", price: g(4e4), stats: { damage: 0.04 } },
  { id: "figure-2", slot: "figure", rarity: 2, name: "Alt\u0131n Kraken", price: p(3500), stats: { damage: 0.13 } },
  { id: "armor-0", slot: "armor", rarity: 0, name: "Me\u015Fe Kaplama", price: g(3e4), stats: { hp: 0.06 } },
  { id: "armor-2", slot: "armor", rarity: 2, name: "Ejder Pulu Z\u0131rh", price: p(3e3), stats: { hp: 0.2 } },
  { id: "carriage-0", slot: "carriage", rarity: 0, name: "Demir Kundak", price: g(35e3), stats: { reload: 0.05 } },
  { id: "carriage-2", slot: "carriage", rarity: 2, name: "D\xF6ner Kundak", price: p(3e3), stats: { reload: 0.14, range: 40 } }
];
var equipById = (id) => EQUIPMENT.find((e) => e.id === id);
function equipTotals(equipped) {
  const t = { speed: 0, damage: 0, hp: 0, reload: 0, range: 0 };
  for (const id of Object.values(equipped)) {
    const e = id ? equipById(id) : void 0;
    if (!e) continue;
    for (const k of Object.keys(t)) t[k] += e.stats[k] ?? 0;
  }
  return t;
}

// src/elite-progression.ts
var ELITE_CANNON_CAPACITY = 315;
var ELITE_REWARDS = [
  {},
  { damage: 2 },
  { hp: 3 },
  { reload: 2 },
  { speed: 2 },
  { damage: 3 },
  { hp: 4 },
  { reload: 3 },
  { defense: 3 },
  { speed: 3 },
  { damage: 4 },
  { hp: 5 },
  { reload: 3 },
  { defense: 2 },
  { repair: 5 },
  { damage: 6, hp: 8 }
];
function cumulativeEliteBonus(level) {
  const total = { damage: 0, hp: 0, reload: 0, speed: 0, defense: 0, repair: 0 };
  for (let i = 1; i <= Math.min(15, Math.max(0, Math.floor(level))); i++)
    for (const key of Object.keys(total)) total[key] += ELITE_REWARDS[i][key] ?? 0;
  for (const key of Object.keys(total)) total[key] /= 100;
  return total;
}

// src/achievements.ts
var ACHIEVEMENTS = [
  { id: "npc-100", name: "K\u0131y\u0131 Belas\u0131", desc: "100 NPC gemisi bat\u0131r", stat: "npc", goal: 100, pearls: 10, bonus: {} },
  { id: "npc-1000", name: "Deniz Kurdu", desc: "1.000 NPC gemisi bat\u0131r", stat: "npc", goal: 1e3, pearls: 50, bonus: {} },
  { id: "npc-10000", name: "Yedi Denizin Korkusu", desc: "10.000 NPC gemisi bat\u0131r", stat: "npc", goal: 1e4, pearls: 200, bonus: {} },
  { id: "heavy-200", name: "Filo Avc\u0131s\u0131", desc: "200 a\u011F\u0131r gemi bat\u0131r", stat: "heavy", goal: 200, pearls: 20, bonus: {} },
  { id: "boss-1", name: "\u0130lk Amiral", desc: "Bir harita bossunu bat\u0131r", stat: "boss", goal: 1, pearls: 20, bonus: {} },
  { id: "boss-16", name: "Yedi Denizin Efendisi", desc: "16 harita bossu bat\u0131r", stat: "boss", goal: 16, pearls: 300, bonus: {} },
  { id: "chest-100", name: "Ganimet\xE7i", desc: "100 ganimet sand\u0131\u011F\u0131 topla", stat: "chest", goal: 100, pearls: 15, bonus: {} },
  { id: "treasure-1", name: "Define Avc\u0131s\u0131", desc: "\u0130lk hazineyi kaz", stat: "treasure", goal: 1, pearls: 10, bonus: {} },
  { id: "treasure-25", name: "Define Ustas\u0131", desc: "25 hazine kaz", stat: "treasure", goal: 25, pearls: 100, bonus: {} },
  { id: "quest-10", name: "G\xF6rev Adam\u0131", desc: "10 g\xF6rev tamamla", stat: "quest", goal: 10, pearls: 15, bonus: {} },
  { id: "quest-100", name: "Efsanevi Kaptan", desc: "100 g\xF6rev tamamla", stat: "quest", goal: 100, pearls: 150, bonus: {} },
  { id: "elite-10000", name: "Elit Top\xE7u", desc: "10.000 elit g\xFClle ate\u015Fle", stat: "eliteBalls", goal: 1e4, pearls: 50, bonus: {} },
  { id: "level-5", name: "Tecr\xFCbeli Kaptan", desc: "5. seviyeye ula\u015F", stat: "level", goal: 5, pearls: 30, bonus: {} },
  { id: "level-8", name: "Amiral", desc: "8. seviyeye ula\u015F", stat: "level", goal: 8, pearls: 100, bonus: {} },
  { id: "daily-7", name: "Sad\u0131k Denizci", desc: "G\xFCnl\xFCk \xF6d\xFCl\xFC 7 g\xFCn art arda topla", stat: "daily", goal: 7, pearls: 30, bonus: {} }
];
var MAIN_COLLECTION = ["npc-100", "npc-1000", "npc-10000", "heavy-200", "boss-1", "boss-16", "chest-100", "treasure-1", "treasure-25", "quest-10", "quest-100", "elite-10000", "level-5", "level-8", "daily-7"];

// src/crew.ts
var TALENTS = {
  sapper: { name: "May\u0131n Uzman\u0131", max: 4, per: "+%15 may\u0131n hasar\u0131", icon: "/assets/icon-mine-v2.webp", apply: (b, r) => {
    b.mine *= 1 + 0.15 * r;
  } },
  tough: { name: "Sa\u011Flam Omurga", max: 5, per: "-%3 al\u0131nan hasar", icon: "/assets/icon-shield-v3.webp", apply: (b, r) => {
    b.taken *= 1 - 0.03 * r;
  } },
  windcaller: { name: "F\u0131rt\u0131na Bilgesi", max: 3, per: "-%10 may\u0131n bekleme", icon: "/assets/icon-speed-v2.webp", apply: (b, r) => {
    b.cooldown *= 1 - 0.1 * r;
  } },
  scavenger: { name: "Enkaz Avc\u0131s\u0131", max: 3, per: "+%8 yald\u0131zl\u0131 sand\u0131k \u015Fans\u0131", icon: "/assets/icon-chest-v2.webp", apply: (b, r) => {
    b.gilded += 0.08 * r;
  } },
  bounty: { name: "\xD6d\xFCl Avc\u0131s\u0131", max: 5, per: "+%5 bat\u0131rma alt\u0131n\u0131", icon: "/assets/icon-attack-v2.webp", apply: (b, r) => {
    b.bounty += 0.05 * r;
  } }
};
var OFFICER_MAX_RANK = 5;
var officerSlots = (level) => level >= 6 ? 3 : level >= 3 ? 2 : 1;
var talentPoints = (level) => Math.max(0, level - 1);

// src/events.ts
var BY_WEEKDAY = {
  6: { id: "sp", day: "Cumartesi", name: "Sava\u015F G\xFCn\xFC", desc: "Rakip oyuncu bat\u0131r\u0131nca 2 kat sava\u015F puan\u0131 (50 SP)" },
  0: { id: "tp", day: "Pazar", name: "Tecr\xFCbe \u015E\xF6leni", desc: "T\xFCm tecr\xFCbe puanlar\u0131 %50 fazla" },
  1: { id: "ep", day: "Pazartesi", name: "Elit G\xFCn\xFC", desc: "Elit puanlar\u0131 %50 fazla" },
  2: { id: "boss", day: "Sal\u0131", name: "Boss Av\u0131", desc: "Boss, gereken bat\u0131rman\u0131n yar\u0131s\u0131nda \xE7\u0131kar" },
  3: { id: "gold", day: "\xC7ar\u015Famba", name: "Alt\u0131n G\xFCn\xFC", desc: "T\xFCm alt\u0131n kazan\xE7lar\u0131 %50 fazla" },
  5: { id: "siege", day: "Cuma", name: "B\xFCy\xFCk Ku\u015Fatma", desc: "20:00\u201322:00 \xB7 b\xFCt\xFCn kaptanlar birlikte Kara Kale'ye sald\u0131r\u0131r" },
  4: { id: "pearl", day: "Per\u015Fembe", name: "\u0130nci Av\u0131", desc: "Denizde 2 kat inci p\u0131r\u0131lt\u0131s\u0131, 2 kat h\u0131zl\u0131 yenilenir" }
};
var dayEvent = (d = /* @__PURE__ */ new Date()) => BY_WEEKDAY[d.getDay()] ?? null;
var is = (id, d) => dayEvent(d)?.id === id;
var spMult = (d) => is("sp", d) ? 2 : 1;
var xpMult = (d) => is("tp", d) ? 1.5 : 1;
var epMult = (d) => is("ep", d) ? 1.5 : 1;
var goldMult = (d) => is("gold", d) ? 1.5 : 1;
var sparkleMult = (d) => is("pearl", d) ? 2 : 1;

// src/siege.ts
var SIEGE_START_H = 20;
var SIEGE_END_H = 22;
var SIEGE_TIER = 8;
var SIEGE_MS = (SIEGE_END_H - SIEGE_START_H) * 36e5;
var WALL_TOWERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
var INNER_TOWERS = [12, 13, 14, 15];
function siegeStats(participants = 4) {
  const k = Math.max(1, participants), t = fleetTowerStats(SIEGE_TIER);
  return { wallHp: SIEGE_HP_PER_CAPTAIN.wall * k, innerHp: SIEGE_HP_PER_CAPTAIN.inner * k, commanderHp: SIEGE_HP_PER_CAPTAIN.commander * k, towerDamage: t.damage, commanderDamage: Math.round(t.damage * 1.6), range: 460 };
}
function siegeTotalHp(participants = 4) {
  const s = siegeStats(participants);
  return s.wallHp * WALL_TOWERS.length + s.innerHp * INNER_TOWERS.length + s.commanderHp;
}
var SIEGE_LEVEL_XP = [0, 2e4, 2e5, 5e5, 15e5, 32e5, 58e5, 114e5, 114e5];
function contribBase(level) {
  const l = Math.max(1, Math.min(8, Math.round(level)));
  return { xp: Math.round(SIEGE_LEVEL_XP[l] * 0.05), gold: Math.round(1500 * Math.pow(1.6, l - 1) * 4), pearls: 500 + 250 * l };
}
var CONTRIB_MIN = 0.25;
var CONTRIB_CAP = 3;
function contribMult(damage, participants = 4) {
  const fair = siegeTotalHp(participants) / Math.max(1, participants), rel = Math.max(0, damage) / fair;
  return rel < CONTRIB_MIN ? 0.4 * rel / CONTRIB_MIN : 0.4 + 0.6 * Math.min(CONTRIB_CAP, rel);
}
function contribReward(damage, participants = 4, level = 8) {
  const b = contribBase(level), m = contribMult(damage, participants);
  return { xp: Math.round(b.xp * m), gold: Math.round(b.gold * m), pearls: Math.round(b.pearls * m) };
}
var CHEST_SHARE = 0.02;
var earnsChest = (damage, participants = 4) => damage >= siegeTotalHp(participants) * CHEST_SHARE;
var CHEST_AMMO = ["explosive", "breaker", "leech", "fire"];
function victoryChest(rand = Math.random, level = 8) {
  const l = Math.max(1, Math.min(8, Math.round(level)));
  const a = Math.floor(rand() * CHEST_AMMO.length), b = (a + 1 + Math.floor(rand() * (CHEST_AMMO.length - 1))) % CHEST_AMMO.length, q = 1500 + 500 * l;
  return { pearls: 300 + 100 * l, ammo: { [CHEST_AMMO[a]]: q, [CHEST_AMMO[b]]: q }, speed: 20, mine: 5 + l, powder: 100 * l, shield: 100 * l };
}
var HERO_DAYS = 7;
var HERO_DAMAGE = 0.03;

// src/loot.ts
var CHEST_AMMO2 = ["fire", "explosive", "breaker", "leech"];
var LOOT_TABLES = {
  drift: { gildedChance: 0.06, pearls: [2, 3], powder: [3, 6], shield: [3, 6], life: Infinity }
};
function createChest(source, x, y, gildedBonus = 0, tier = 1, rand = Math.random) {
  const table = LOOT_TABLES[source], gilded = rand() < table.gildedChance + gildedBonus, k = gilded ? 2 : 1, r = ([a, b]) => a + Math.floor(rand() * (b - a + 1)), roll = rand();
  const c = { x, y, source, kind: gilded ? "gilded" : "wood", life: table.life, maxLife: table.life, pearls: 0, powder: 0, shield: 0, ammo: CHEST_AMMO2[Math.floor(rand() * CHEST_AMMO2.length)], ammoQty: 0, speed: 0, mine: 0 };
  if (roll < 0.5) c.pearls = r(table.pearls) * k;
  else if (roll < 0.65) c.powder = r(table.powder) * k;
  else if (roll < 0.8) c.shield = r(table.shield) * k;
  else if (roll < 0.95) c.ammoQty = (50 + 20 * Math.max(1, Math.min(8, tier))) * k;
  else if (roll < 0.99) c.speed = 2 * k;
  else c.mine = k;
  return c;
}

// src/elite-ships.ts
var ELITE_SHIPS = [
  { id: "phantom", level: 1, name: "Hayalet Kad\u0131rga", english: "The Phantom Galleon", asset: "/assets/elite-phantom-art-v23.webp", role: "Ka\xE7\u0131\u015F" },
  { id: "magma", level: 2, name: "Volkanik Z\u0131rhl\u0131", english: "Volcanic Dreadnought", asset: "/assets/elite-magma-art-v23.webp", role: "Alan hasar\u0131" },
  { id: "glacial", level: 3, name: "Buzul Tiran\u0131", english: "Glacial Tyrant", asset: "/assets/elite-glacial-art-v23.webp", role: "Kontrol" },
  { id: "kraken", level: 4, name: "Kraken'in Gazab\u0131", english: "Kraken's Embrace", asset: "/assets/elite-kraken-art-v23.webp", role: "Yakalama" },
  { id: "ironclad", level: 5, name: "Veba Kad\u0131rgas\u0131", english: "Plague Galley", asset: "/assets/elite-ironclad-art-v23.webp", role: "Tank" },
  { id: "crimson", level: 6, name: "Kanl\u0131 Ay Korveti", english: "Crimson Moon Corsair", asset: "/assets/elite-crimson-art-v23.webp", role: "Can emme" },
  { id: "atlantean", level: 7, name: "Kadim Atlantis Muhaf\u0131z\u0131", english: "Atlantean Sentry", asset: "/assets/elite-atlantean-art-v23.webp", role: "Koruma" },
  { id: "bone", level: 8, name: "Kemik Bi\xE7ici", english: "Bone Harvester", asset: "/assets/elite-bone-art-v23.webp", role: "\u0130nfaz" },
  { id: "tempest", level: 9, name: "F\u0131rt\u0131na Habercisi", english: "Tempest Harbinger", asset: "/assets/elite-tempest-art-v23.webp", role: "Zincir hasar" },
  { id: "sovereign", level: 10, name: "Kraliyet Sancaktar\u0131", english: "Royal Standard-Bearer", asset: "/assets/elite-sovereign-art-v23.webp", role: "Destek / ganimet" },
  { id: "jade", level: 11, name: "Ye\u015Fim Ejderha", english: "Jade Dragon", asset: "/assets/elite-jade-art-v23.webp", role: "Menzil" },
  { id: "ragnarok", level: 12, name: "Ragnarok Y\u0131k\u0131c\u0131s\u0131", english: "Ragnarok Destroyer", asset: "/assets/elite-ragnarok-art-v23.webp", role: "\xD6fke" },
  { id: "void", level: 13, name: "Hi\xE7lik H\xFCk\xFCmdar\u0131", english: "Void Monarch", asset: "/assets/elite-void-art-v23.webp", role: "Kaos" },
  { id: "coral", level: 14, name: "Kara \xD6fke", english: "Black Fury", asset: "/assets/elite-coral-art-v23.webp", role: "\u0130yile\u015Ftirme" },
  { id: "sand", level: 15, name: "Alevli Ta\xE7", english: "Flaming Crown", asset: "/assets/elite-sand-art-v23.webp", role: "H\u0131z / gizlilik" }
];
var ELITE_DIR16 = Object.fromEntries(ELITE_SHIPS.map((s) => [s.id, `/assets/elite-${s.id}-dir16-v1.webp`]));

// src/domination.ts
var DOM_SIZE = 3;
var DOM_COUNTDOWN_MS = 15e3;
var DOM_MATCH_MS = 8 * 6e4;
var DOM_WIN = 240;
var DOM_ZONE = { x: 3e3, y: 2e3, r: 420 };
var DOM_CAPTURE_PER_SHIP = 25;
var DOM_BASE = { r: { x: 700, y: 2e3 }, b: { x: 5300, y: 2e3 } };
var DOM_PEARLS = { win: 300, draw: 200, lose: 100 };
var DOM_EP_PER_BALL = 2;
function domWindowAt(now) {
  const t = new Date(now + 3 * 36e5), day = t.getUTCDay(), h = t.getUTCHours();
  const open = day === 0 || day === 6 || h >= 20;
  return { open };
}
function domBalance(list, ep) {
  const n = list.length, half = n / 2;
  let best = { r: list.slice(0, half), b: list.slice(half) }, gap = Infinity;
  const total = list.reduce((a, x) => a + ep(x), 0);
  for (let mask = 0; mask < 1 << n; mask++) {
    if (!(mask & 1)) continue;
    let c = 0, s = 0;
    for (let i = 0; i < n; i++) if (mask >> i & 1) {
      c++;
      s += ep(list[i]);
    }
    if (c !== half) continue;
    const g2 = Math.abs(total - 2 * s);
    if (g2 < gap) {
      gap = g2;
      best = { r: list.filter((_, i) => mask >> i & 1), b: list.filter((_, i) => !(mask >> i & 1)) };
    }
  }
  return best;
}
function domZoneStep(z, nr, nb) {
  const contested = nr > 0 && nb > 0;
  if (!contested && (nr > 0 || nb > 0)) {
    const d = (nr - nb) * DOM_CAPTURE_PER_SHIP;
    z.cap = Math.max(-100, Math.min(100, z.cap + d));
    if (z.cap >= 100) z.own = "r";
    else if (z.cap <= -100) z.own = "b";
    else if (z.own === "r" && z.cap <= 0 || z.own === "b" && z.cap >= 0) z.own = null;
  }
  return { contested };
}
function domWinner(s) {
  return s.r === s.b ? null : s.r > s.b ? "r" : "b";
}
var domReward = (team, win, balls) => ({ pearls: win === null ? DOM_PEARLS.draw : win === team ? DOM_PEARLS.win : DOM_PEARLS.lose, ep: Math.max(0, Math.round(balls)) * DOM_EP_PER_BALL });

// src/cursed.ts
var LS_SIZE = 10;
var LS_COUNTDOWN_MS = 15e3;
var LS_LOADOUT = { cannons: 315, type: "cast", upDamage: 0, upReload: 0, upRange: 0, crewDamage: 1, crewReload: 1, crewRange: 0, equipDamage: 0, equipReload: 0, equipRange: 0, achDamage: 0, eliteDamage: 0, eliteReload: 0, hero: 0 };
var LS_SALVO = Math.round(salvoDamage(LS_LOADOUT, "iron", 0, LS_LOADOUT.cannons, false, false));
var LS_RELOAD = reloadTime(LS_LOADOUT, "iron");
var LS_RANGE = rangeOf(LS_LOADOUT);
var LS_HP = LS_SALVO * 14;
var LS_START_R = 3700;
var LS_RADII = [2300, 1400, 750, 300, 0];
var LS_PHASE_MS = 6e4;
var LS_SHRINK_MS = 2e4;
var LS_FOG_DPS = [0.02, 0.04, 0.08, 0.15, 0.25, 0.25];
var LS_MATCH_MS = LS_PHASE_MS * (LS_RADII.length + 1);
var LS_PEARLS = [500, 300, 200];
var LS_PEARLS_REST = 50;
var LS_KILL_PEARLS = 25;
var LS_EP_PER_BALL = 2;
function lsZoneAt(f, now) {
  const k = Math.max(0, Math.min(1, (now - f.at) / LS_SHRINK_MS));
  return { x: f.from.x + (f.to.x - f.from.x) * k, y: f.from.y + (f.to.y - f.from.y) * k, r: f.from.r + (f.to.r - f.from.r) * k };
}
function lsNext(cur, r, rand = Math.random) {
  const room = Math.max(0, cur.r - r), a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * room;
  const x = Math.max(r, Math.min(6e3 - r, cur.x + Math.cos(a) * d)), y = Math.max(r, Math.min(4e3 - r, cur.y + Math.sin(a) * d));
  return { x: r ? x : cur.x + Math.cos(a) * d, y: r ? y : cur.y + Math.sin(a) * d, r };
}
var lsReward = (rank, kills, balls) => ({ pearls: (LS_PEARLS[rank - 1] ?? LS_PEARLS_REST) + kills * LS_KILL_PEARLS, ep: Math.max(0, Math.round(balls)) * LS_EP_PER_BALL });
var lsSpawn = (i, n) => ({ x: Math.round(3e3 + Math.cos(i / n * Math.PI * 2) * 1700), y: Math.round(2e3 + Math.sin(i / n * Math.PI * 2) * 1300) });
var LS_ITEMS = {
  chain: { name: "Zincir G\xFCllesi", qty: 315 * 3, icon: "/assets/ammo-chain-v2.webp", weight: 3 },
  fire: { name: "Ate\u015F G\xFCllesi", qty: 315 * 2, icon: "/assets/ammo-fire-v2.webp", weight: 3 },
  explosive: { name: "Patlay\u0131c\u0131 G\xFClle", qty: 315 * 2, icon: "/assets/ammo-explosive-v2.webp", weight: 2 },
  powder: { name: "Kara Barut", qty: 6, icon: "/assets/icon-powder-v4.webp", weight: 2 },
  shield: { name: "Kalkan", qty: 8, icon: "/assets/icon-shield-v3.webp", weight: 2 },
  speed: { name: "H\u0131z \u0130ksiri", qty: 1, icon: "/assets/icon-speed-potion-v2.webp", weight: 1 }
};
var LS_ITEM_KEYS = Object.keys(LS_ITEMS);
var LS_ITEM_MAX = 26;
var LS_ITEM_RESPAWN_MS = 2500;
var LS_PICK_R = 46;
var LS_SPEED_MS = 1500;
var lsEmptyInv = () => ({ chain: 0, fire: 0, explosive: 0, powder: 0, shield: 0, speed: 0 });
function lsPickKind(rand = Math.random) {
  const tot = LS_ITEM_KEYS.reduce((a, k) => a + LS_ITEMS[k].weight, 0);
  let r = rand() * tot;
  for (const k of LS_ITEM_KEYS) {
    r -= LS_ITEMS[k].weight;
    if (r < 0) return k;
  }
  return "chain";
}
var LS_DROP_FIRST_MS = 45e3;
var LS_DROP_EVERY_MS = 75e3;
var LS_DROP_FALL_MS = 1e4;
var LS_DROP_PICK_R = 60;
var LS_DROP_LOOT = { explosive: 315 * 4, fire: 315 * 3, chain: 315 * 2, powder: 12, shield: 16, speed: 1 };

// src/level-quest.ts
var levelQuestTargets = (level) => ({ ships: [`n${level}-1-heavy`, `n${level}-2-heavy`], tier: level });
var levelQuestMap = (level) => `${level}/1`;

// server/game-server.mjs
var PORT = Number(process.env.PORT || 3e3);
var SUPABASE_URL = process.env.SUPABASE_URL || "https://vidjvineafeiyoclioau.supabase.co";
var SUPABASE_ANON = process.env.SUPABASE_ANON || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZGp2aW5lYWZlaXlvY2xpb2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3Mjk2NjMsImV4cCI6MjEwNzMwNTY2M30.sKlmmfQRr-ZASkaSbax22ca80cyDCc8DNz4Idq19g5s";
var LIMITS = { maxHit: 4e5, maxSpeed: 900, firesPerSec: 12, statesPerSec: 15, chatPerMin: 20, chatLen: 200, maxPerSea: 300 };
var started = Date.now();
var OSB_USER = process.env.SHOPIER_OSB_USER || "";
var OSB_PASS = process.env.SHOPIER_OSB_PASS || "";
var SERVER_SECRET = process.env.SERVER_SECRET || "";
async function verifyToken(token) {
  if (process.env.BENCH_AUTH === "1" && token.startsWith("bench:")) {
    const [n, g2] = token.slice(6).split(":").map(Number);
    return { uid: "b" + n, nick: "Bot" + n, playerNo: 9e4 + n, banned: false, guildId: g2 || 0 };
  }
  const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON, authorization: `Bearer ${token}` } });
  if (!u.ok) return null;
  const user = await u.json();
  const p2 = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=nick,player_no,banned`, { headers: { apikey: SUPABASE_ANON, authorization: `Bearer ${token}` } });
  const rows = p2.ok ? await p2.json() : [];
  const prof = rows[0];
  if (!prof) return null;
  return { uid: user.id, nick: prof.nick, playerNo: prof.player_no, banned: !!prof.banned, guildId: await guildOf(user.id).catch(() => 0) };
}
async function guildOf(uid) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/guild_members?user_id=eq.${uid}&select=guild_id`, { headers: { apikey: SUPABASE_ANON, authorization: `Bearer ${SUPABASE_ANON}` } });
  const rows = r.ok ? await r.json() : [];
  return Number(rows[0]?.guild_id || 0);
}
function osbMatch(res, hash, user, pass) {
  if (!res || !hash || !user || !pass) return "";
  user = user.trim();
  pass = pass.trim();
  const h = String(hash).trim();
  const eq = (a, b) => a.length === b.length && import_node_crypto.default.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  const tries = [["res+kullan\u0131c\u0131", pass, res + user], ["kullan\u0131c\u0131+res", pass, user + res], ["res (anahtar=\u015Fifre)", pass, res], ["ters anahtar", user, res + pass]];
  for (const [name, key, data] of tries) {
    const raw = import_node_crypto.default.createHmac("sha256", key).update(data).digest();
    if (eq(h.toLowerCase(), raw.toString("hex")) || eq(h, raw.toString("base64"))) return name;
  }
  return "";
}
var verifyOsb = (res, hash, user, pass) => !!osbMatch(res, hash, user, pass);
function parseOsb(res) {
  const d = JSON.parse(Buffer.from(res, "base64").toString("utf8"));
  const pick = (...k) => {
    for (const x of k) if (d[x] !== void 0 && d[x] !== null && d[x] !== "") return d[x];
    return null;
  };
  return {
    order: String(pick("orderid", "order_id", "platform_order_id", "id") ?? ""),
    email: pick("email", "buyer_email", "buyeremail"),
    note: pick("customernote", "customer_note", "note", "buyernote"),
    price: Number(String(pick("price", "total", "total_order_value", "amount") ?? "0").replace(",", ".")),
    test: ["1", "true", 1, true].includes(pick("istest", "is_test", "test")),
    keys: Object.keys(d)
  };
}
function parseForm(body, ctype = "") {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(ctype);
  if (!m) return new URLSearchParams(body);
  const out = new URLSearchParams(), b = "--" + (m[1] || m[2]).trim();
  for (const part of body.split(b)) {
    const i = part.indexOf("\r\n\r\n");
    if (i < 0) continue;
    const head = part.slice(0, i), name = /name="([^"]+)"/i.exec(head)?.[1];
    if (!name) continue;
    out.append(name, part.slice(i + 4).replace(/\r\n$/, ""));
  }
  return out;
}
async function handleOsb(body, ctype) {
  const form = parseForm(body, ctype), res = form.get("res") || "", hash = form.get("hash") || "";
  log("SHOPIER istek geldi", ctype || "-", "alanlar:", [...form.keys()].map((k) => `${k}(${(form.get(k) || "").length})`).join(",") || `g\xF6vde ${body.length} bayt`, "ayar:", OSB_USER ? "kullan\u0131c\u0131 var" : "KULLANICI YOK", OSB_PASS ? "\u015Fifre var" : "\u015E\u0130FRE YOK", SERVER_SECRET ? "anahtar var" : "ANAHTAR YOK");
  const how = osbMatch(res, hash, OSB_USER, OSB_PASS);
  if (!how) {
    let json = "hay\u0131r";
    try {
      JSON.parse(Buffer.from(res, "base64").toString("utf8"));
      json = "evet";
    } catch {
    }
    log("SHOPIER imza ge\xE7ersiz", "res uzunluk", res.length, "json okunuyor", json, "hash uzunluk", hash.length, "kullan\u0131c\u0131 uzunluk", OSB_USER.length, "\u015Fifre uzunluk", OSB_PASS.length);
    return false;
  }
  log("SHOPIER imza do\u011Fru:", how);
  let o;
  try {
    o = parseOsb(res);
  } catch {
    log("SHOPIER veri okunamad\u0131");
    return false;
  }
  log("SHOPIER sipari\u015F", o.order, o.price, "alanlar:", o.keys.join(","));
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/shopier_credit`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON, authorization: `Bearer ${SUPABASE_ANON}`, "content-type": "application/json" },
    body: JSON.stringify({ p_secret: SERVER_SECRET, p_order: o.order, p_email: o.email, p_note: o.note, p_price: o.price, p_test: o.test })
  });
  const st = r.ok ? await r.json() : `hata ${r.status} ${await r.text()}`;
  log("SHOPIER sonu\xE7", o.order, st);
  return r.ok && st !== null && !(typeof st === "object" && st.error);
}
var num = (v) => typeof v === "number" && Number.isFinite(v);
function checkState(prev, s, now) {
  if (!s || typeof s !== "object" || Array.isArray(s) || !num(s.x) || !num(s.y) || !num(s.hp) || s.hp < 0) return "bad";
  if (s.x < 0 || s.x > WORLD_WIDTH || s.y < 0 || s.y > WORLD_HEIGHT) return "bad";
  if (prev && prev.x !== void 0) {
    const dt = Math.max(0.05, (now - prev.at) / 1e3), d = Math.hypot(s.x - prev.x, s.y - prev.y);
    if (d / dt > LIMITS.maxSpeed * 1.6 + 200) return "speed";
  }
  return "ok";
}
var SHORE_SLACK = 25;
function onLand(map, x, y) {
  const m = MAPS[map];
  if (!m) return null;
  for (const is2 of m.islands) {
    if (Math.hypot(x - is2.x, y - is2.y) < is2.r * 0.72 + 28 - SHORE_SLACK) return is2.name;
  }
  return null;
}
function checkFire(f) {
  if (!f || !num(f.damage) || !num(f.x) || !num(f.y) || typeof f.to !== "string") return "bad";
  if (f.damage < 0 || f.damage > LIMITS.maxHit) return "damage";
  return "ok";
}
var HP_BONUS_MAX = 1.8;
var HEAL_SECONDS = 40;
var GOD_MARGIN = 0.3;
var PVP_RANGE = 1500;
function hpCap(st) {
  if (!st) return 0;
  return Math.round(playerBaseHp(Number(st.level) || 1, Number(st.u_hull) || 0) * HP_BONUS_MAX);
}
var pvpOf = (t) => t.pvp ??= { budget: null, heal: null, hp: null, at: 0, from: /* @__PURE__ */ new Map() };
function pvpGuard(t, dmg, now) {
  const p2 = pvpOf(t), max = t.maxHp || 1;
  p2.budget ??= newPvpBudget(max, now / 1e3);
  const dealt = pvpClamp(p2.budget, max, Math.max(0, dmg), now / 1e3);
  if (p2.hp !== null) p2.hp -= dealt;
  p2.hitAt = now;
  return Math.round(dealt);
}
function pvpHeal(t, amt, now) {
  const p2 = pvpOf(t), max = t.maxHp || 1;
  p2.heal ??= newPvpBudget(max, now / 1e3);
  const got = pvpClamp(p2.heal, max, Math.max(0, amt), now / 1e3);
  if (p2.hp !== null) p2.hp = Math.min(max, p2.hp + got);
  return Math.round(got);
}
var COMBAT_HEAL_SECONDS = 200;
var COMBAT_MS = 1e4;
function noteHp(t, hp, now) {
  const p2 = pvpOf(t), max = t.maxHp || hp, secs = t.domTeam || now - (p2.hitAt ?? -1e12) < COMBAT_MS ? COMBAT_HEAL_SECONDS : HEAL_SECONDS;
  p2.hp = p2.hp === null ? Math.min(hp, max) : Math.min(hp, Math.min(max, p2.hp + (t.lsOn ? 0 : Math.max(0, now - p2.at) * max / secs / 1e3)));
  p2.at = now;
}
function godCheck(t) {
  const p2 = t.pvp;
  return !!p2 && p2.hp !== null && !!t.maxHp && p2.hp <= -GOD_MARGIN * t.maxHp;
}
function pvpReset(t) {
  if (t.pvp) {
    t.pvp.budget = null;
    t.pvp.heal = null;
    t.pvp.hp = null;
    t.pvp.from.clear();
  }
}
function dpsCap(level) {
  const l = Math.max(1, Math.min(8, Math.round(Number(level) || 1)));
  return BOSS_HP[l] / 40;
}
function dpsTake(c, dmg, now) {
  const rate = dpsCap(c.econ?.level ?? 8);
  c.dps ??= { pool: rate * 3, t: now, over: 0 };
  const d = c.dps;
  d.pool = Math.min(rate * 3, d.pool + Math.max(0, now - d.t) / 1e3 * rate);
  d.t = now;
  const ok = Math.max(0, Math.min(dmg, d.pool));
  d.pool -= ok;
  d.over = dmg > ok ? d.over + (dmg - ok) : Math.max(0, d.over - ok);
  return { ok, flag: d.over > rate * 6 };
}
var talentRank = (c, id) => Number(c?.ld?.tal?.[id]) || 0;
var G = (n) => Math.round(n * goldMult());
var X = (n) => Math.round(n * xpMult());
var AMMO_MULT = { iron: 1, chain: 1.25, fire: 2.5 * 1.8, explosive: 2.5, breaker: 2.25 * 2.6, leech: 3, heal: 0 };
function perBall(ammo, st) {
  return 20 * 1.38 * (1 + (st ? Number(st.u_damage) || 0 : 10) * 0.11) * (AMMO_MULT[ammo] ?? 1) * 1.4 * 2.2;
}
function cannonsOf(st) {
  if (!st) return 0;
  return Math.min(315, ["cast", "long", "rapid", "heavy"].reduce((a, k) => a + Math.max(0, Number(st["c_" + k]) || 0), 0));
}
var ITEM_OF = { iron: "iron", chain: "chain" };
var stockOf = (st, k) => Math.max(0, Number(st?.[k]) || 0) + Math.max(0, (Number(st?.["cu_" + k]) || 0) - (Number(st?.["cn_" + k]) || 0));
function noteSalvo(c, d) {
  const a = String(d?.a || "iron");
  if (!Object.hasOwn(AMMO_MULT, a) || !c.econ || ![d?.n, d?.i ?? 0].every((x) => Number.isSafeInteger(x) && x >= 0 && x <= 1e4)) return { err: "salvo" };
  let n = Math.max(0, Math.floor(Number(d?.n) || 0)), i = Math.max(0, Math.floor(Number(d?.i) || 0));
  const cap = cannonsOf(c.econ), over = n + i > cap * 1.05 + 5;
  if (over) {
    const k = cap / (n + i);
    n = Math.floor(n * k);
    i = Math.floor(i * k);
  }
  const key = ITEM_OF[a] ?? "a_" + a;
  if (n + i === 0 || stockOf(c.econ, key) < n + (a === "iron" ? i : 0) || a !== "iron" && stockOf(c.econ, "iron") < i || d?.p && stockOf(c.econ, "a_powder") < 1) return { err: "stok" };
  const dmg = n * perBall(a, c.econ) + i * perBall("iron", c.econ);
  c.sb ??= { pool: 0 };
  c.sb.pool = Math.min(c.sb.pool + dmg, Math.max(dmg, 1) * 40);
  const use = {};
  if (n && a !== "iron") use["cn_" + (ITEM_OF[a] ?? "a_" + a)] = n;
  if (i) use.cn_iron = (use.cn_iron || 0) + i;
  if (n && a === "iron") use.cn_iron = (use.cn_iron || 0) + n;
  if (d?.p) use.cn_a_powder = 1;
  return { use, over };
}
function sbTake(c, amount) {
  c.sb ??= { pool: 0 };
  const ok = Math.max(0, Math.min(amount, c.sb.pool));
  c.sb.pool -= ok;
  return ok;
}
var USE_COOLDOWN = { speed: 2e4, mine: 2e4, compass: 16e3, shield: 0 };
function noteUse(c, id, now) {
  if (!(id in USE_COOLDOWN)) return { err: "t\xFCr" };
  c.uses ??= {};
  const last = c.uses[id] ?? -1e12, early = now - last < USE_COOLDOWN[id];
  if (early) return { err: "bekleme", early: true };
  if (!c.econ || stockOf(c.econ, "a_" + id) < 1) return { err: "stok" };
  c.uses[id] = now;
  return { use: { ["cn_a_" + id]: 1 }, early };
}
function killCredit(c, id, now) {
  const map = seaMap(c.sea);
  if (!map || !MAPS[map]) return { err: "deniz" };
  const m = MAPS[map], npc2 = NPCS[id];
  if (!npc2 || !m.npcs.includes(id)) return { err: "hedef" };
  const def = npc2;
  const rate = dpsCap(c.econ?.level ?? 8);
  c.kb ??= { pool: rate * 30, t: now, miss: 0 };
  const b = c.kb;
  b.pool = Math.min(rate * 30, b.pool + Math.max(0, now - b.t) / 1e3 * rate);
  b.t = now;
  if (b.pool < def.hp * 0.5) {
    b.miss++;
    return { err: "h\u0131z", flag: b.miss >= 10 };
  }
  if ((c.sb?.pool ?? 0) < def.hp * 0.6) {
    b.miss++;
    return { err: "mermi", flag: b.miss >= 10 };
  }
  sbTake(c, def.hp * 0.6);
  b.pool = Math.max(0, b.pool - def.hp);
  b.miss = 0;
  const add = { gold: G(def.gold), xp: X(def.xp) };
  add.st_npc = 1;
  if (npc2.role === "heavy") add.st_heavy = 1;
  c.qk ??= {};
  c.qk[id] = (c.qk[id] || 0) + 1;
  const lvl = Math.round(Number(c.econ?.level) || 1);
  if (npc2 && lvl >= 2 && map === levelQuestMap(lvl) && levelQuestTargets(lvl).ships.includes(id)) add.lqk = 1;
  return { add };
}
var questCooldowns = /* @__PURE__ */ new Map();
function questCredit(c, id, now) {
  const q = QUESTS.find((x) => x.id === id);
  if (!q) return { err: "g\xF6rev" };
  if (!c.econ || Number(c.econ.level) < q.tier || seaMap(c.sea) !== q.map) return { err: "deniz" };
  const cd = questCooldowns.get(c.uid) ?? /* @__PURE__ */ new Map();
  questCooldowns.set(c.uid, cd);
  if (now - (cd.get(id) ?? -1e15) < QUEST_COOLDOWN_MS * 0.95) return { err: "bekleme" };
  if (q.kind === "sparkle") {
    c.qk ??= {};
    const k = "spk:" + q.map;
    if ((c.qk[k] || 0) < q.required) return { err: "say\u0131", have: c.qk[k] || 0 };
    c.qk[k] -= q.required;
  }
  if (q.kind === "npc") {
    c.qk ??= {};
    const have = q.ids.reduce((a, k) => a + (c.qk[k] || 0), 0);
    if (have < q.required) return { err: "say\u0131", have };
    let need = q.required;
    for (const k of q.ids) {
      const t = Math.min(need, c.qk[k] || 0);
      c.qk[k] -= t;
      need -= t;
    }
  }
  cd.set(id, now);
  return { add: { pearls: q.pearls, gold: G(q.gold), xp: X(q.xp), ep: Math.round(questEp(q.tier) * epMult()), st_quest: 1 } };
}
var bossPool = (n) => 1 + 0.6 * (Math.min(5, Math.max(1, n)) - 1);
function bossCredit(map, share, n) {
  if (!MAPS[map] || !(share > 0)) return null;
  const b = bossFor(map), pool = bossPool(n);
  const add = { gold: G(Math.round(NPCS[b.trigger].gold * 20 * pool * share)), xp: X(Math.round(b.xp * pool * share)) };
  if (share >= 0.03) {
    add.ep = Math.round(bossEp(b.tier) * epMult());
    add.st_boss = 1;
    add.pearls = b.pearls;
  }
  return add;
}
function siegeCredit(dmg, n, level) {
  const r = contribReward(dmg, Math.max(1, n), Math.max(1, Math.min(8, Math.round(Number(level) || 8))));
  return { gold: G(r.gold), xp: X(r.xp), pearls: r.pearls };
}
var treasures = /* @__PURE__ */ new Map();
var treOf = (uid) => {
  let t = treasures.get(uid);
  if (!t) {
    t = { parts: 0, spot: null, chest: { pool: 4, t: 0 } };
    treasures.set(uid, t);
  }
  return t;
};
function pickSpot(map, rand = Math.random) {
  const m = MAPS[map];
  for (let i = 0; i < 80; i++) {
    const x = 300 + rand() * (WORLD_WIDTH - 600), y = 300 + rand() * (WORLD_HEIGHT - 600);
    if (m.islands.some((is2) => Math.hypot(x - is2.x, y - is2.y) < is2.r + 90)) continue;
    if (Math.hypot(x - m.fleet.x, y - m.fleet.y) < FLEET.islandR + 160) continue;
    return { map, x: Math.round(x), y: Math.round(y), label: coordLabel({ x, y }) };
  }
  return { map, x: Math.round(WORLD_WIDTH / 2), y: Math.round(WORLD_HEIGHT - 400), label: coordLabel({ x: WORLD_WIDTH / 2, y: WORLD_HEIGHT - 400 }) };
}
function chestPicked(c, now, rand = Math.random) {
  const map = seaMap(c.sea);
  if (!map || !MAPS[map]) return { err: "deniz" };
  const t = treOf(c.uid);
  t.chest.pool = Math.min(6, t.chest.pool + Math.max(0, now - t.chest.t) / 18e3);
  t.chest.t = now;
  if (t.chest.pool < 1) return { err: "h\u0131z" };
  t.chest.pool -= 1;
  if (rand() >= PART_CHANCE) return { parts: t.parts };
  t.parts++;
  if (t.parts >= TREASURE_PARTS && !t.spot) {
    t.parts -= TREASURE_PARTS;
    t.spot = pickSpot(map, rand);
    return { parts: t.parts, spot: t.spot, found: true };
  }
  return { parts: t.parts, found: true };
}
function sparklePicked(c, now) {
  const map = seaMap(c.sea);
  if (!map || !MAPS[map]) return { err: "deniz" };
  c.spb ??= { pool: 40, t: now };
  c.spb.pool = Math.min(40, c.spb.pool + Math.max(0, now - c.spb.t) * 1.5 / 1e3);
  c.spb.t = now;
  if (c.spb.pool < 1) return { err: "h\u0131z" };
  c.spb.pool -= 1;
  c.qk ??= {};
  const k = "spk:" + map;
  c.qk[k] = Math.min(200, (c.qk[k] || 0) + 1);
  return { ok: true };
}
var LOOT = { chests: 3, chestMax: 4, chestRespawn: 22e3, sparkles: 12, chestR: 46, sparkleR: 40, slack: 110 };
function lootFor(c, rand = Math.random) {
  const map = seaMap(c.sea);
  if (!map || !MAPS[map]) return null;
  if (c.loot?.map !== map) {
    c.loot = { map, ch: [], sp: [], seq: 0, chT: Date.now() };
    for (let i = 0; i < LOOT.chests; i++) lootAdd(c.loot, "ch", rand);
    for (let i = 0; i < LOOT.sparkles * sparkleMult(); i++) lootAdd(c.loot, "sp", rand);
  }
  return c.loot;
}
function lootAdd(l, kind, rand = Math.random) {
  const p2 = pickSpot(l.map, rand);
  l[kind].push([++l.seq, Math.round(p2.x), Math.round(p2.y)]);
}
var lootInfo = (l) => ({ ch: l.ch, sp: l.sp });
function lootTake(c, kind, id) {
  const l = c.loot;
  if (!l || l.map !== seaMap(c.sea) || !c.last) return { err: "yok" };
  const list = l[kind], i = list.findIndex((x2) => x2[0] === Number(id));
  if (i < 0) return { err: "yok" };
  const [, x, y] = list[i];
  if (Math.hypot(x - c.last.x, y - c.last.y) > (kind === "ch" ? LOOT.chestR : LOOT.sparkleR) + LOOT.slack) return { err: "uzak" };
  list.splice(i, 1);
  if (kind === "sp") lootAdd(l, "sp");
  return { ok: true };
}
function lootTick(c, now) {
  const l = c.loot;
  if (!l || now - l.chT < LOOT.chestRespawn) return false;
  l.chT = now;
  if (l.ch.length >= LOOT.chestMax) return false;
  lootAdd(l, "ch");
  return true;
}
function chestReward(c, gilded, rand = Math.random) {
  const map = seaMap(c.sea);
  const ch = createChest("drift", 0, 0, 0.08 * Math.min(3, talentRank(c, "scavenger")), MAPS[map]?.tier ?? 1, rand);
  const out = { kind: ch.kind, pearls: ch.pearls, powder: ch.powder, shield: ch.shield, ammo: ch.ammo, ammoQty: ch.ammoQty, speed: ch.speed, mine: ch.mine };
  const add = { pearls: ch.pearls, a_powder: ch.powder, a_shield: ch.shield, ["a_" + ch.ammo]: ch.ammoQty, a_speed: ch.speed, a_mine: ch.mine, st_chest: 1 };
  for (const k in add) if (!add[k]) delete add[k];
  return { out, add };
}
function sparkleReward(c, rand = Math.random) {
  const tier = MAPS[seaMap(c.sea)]?.tier ?? 1, roll = rand(), r = (a, b) => a + Math.floor(rand() * (b - a + 1)), kinds = ["fire", "explosive", "breaker", "leech"];
  if (roll < 0.5) {
    const n = r(1, 2);
    return { out: { pearls: n }, add: { pearls: n } };
  }
  if (roll < 0.65) {
    const n = r(2, 5);
    return { out: { powder: n }, add: { a_powder: n } };
  }
  if (roll < 0.8) {
    const n = r(2, 5);
    return { out: { shield: n }, add: { a_shield: n } };
  }
  if (roll < 0.95) {
    const k = kinds[Math.floor(rand() * kinds.length)], n = 30 + 15 * tier;
    return { out: { ammo: k, ammoQty: n }, add: { ["a_" + k]: n } };
  }
  if (roll < 0.99) return { out: { speed: 1 }, add: { a_speed: 1 } };
  return { out: { pearls: 5, mine: 1 }, add: { pearls: 5, a_mine: 1 } };
}
function treasureDig(c) {
  const t = treOf(c.uid);
  if (!t.spot) return { err: "harita" };
  const map = seaMap(c.sea);
  if (map !== t.spot.map || !c.last || Math.hypot(c.last.x - t.spot.x, c.last.y - t.spot.y) > DIG_RADIUS + 60) return { err: "yer" };
  const m = MAPS[map], r = treasureReward(m.tier, NPCS[m.npcs[0]].gold);
  t.spot = null;
  return { reward: r, add: { gold: G(r.gold), pearls: r.pearls, st_treasure: 1, [r.ammo === "chain" ? "chain" : "a_" + r.ammo]: r.ammoQty, a_powder: r.powder, a_shield: r.shield } };
}
var pendingCredits = /* @__PURE__ */ new Map();
var STATE_FILE = process.env.STATE_FILE || "/opt/game/state.json";
var qkByUid = /* @__PURE__ */ new Map();
var heroUntil = /* @__PURE__ */ new Map();
function saveServerState() {
  if (process.env.NODE_ENV === "test") return;
  try {
    for (const c of all) if (c.credit && !c.grant) {
      c.grant = { id: import_node_crypto.default.randomUUID(), add: c.credit };
      c.credit = null;
      pendingCredits.set(c.grant.id, c);
    }
    import_node_fs.default.writeFileSync(STATE_FILE + ".tmp", JSON.stringify({ g: [...pendingCredits.values()].map((c) => ({ uid: c.uid, grant: c.grant, credit: c.credit })), q: [...questCooldowns].map(([u, m]) => [u, [...m]]), k: [...qkByUid], t: [...treasures], h: [...heroUntil] }));
    import_node_fs.default.renameSync(STATE_FILE + ".tmp", STATE_FILE);
  } catch (e) {
    log("DURUM kay\u0131t hatas\u0131", e?.code);
  }
}
function loadServerState() {
  if (process.env.NODE_ENV === "test") return;
  try {
    const d = JSON.parse(import_node_fs.default.readFileSync(STATE_FILE, "utf8"));
    for (const c of d.g || []) if (c.grant?.id) pendingCredits.set(c.grant.id, c);
    for (const [u, m] of d.q || []) questCooldowns.set(u, new Map(m));
    for (const [u, k] of d.k || []) qkByUid.set(u, k);
    for (const [u, t] of d.t || []) treasures.set(u, t);
    for (const [u, t] of d.h || []) heroUntil.set(u, t);
  } catch {
  }
}
loadServerState();
setInterval(saveServerState, 6e4).unref();
process.on("SIGTERM", () => {
  saveServerState();
  process.exit(0);
});
process.on("SIGINT", () => {
  saveServerState();
  process.exit(0);
});
var spByUid = /* @__PURE__ */ new Map();
function spCredit(killer, victimUid, now) {
  if (!killer?.uid || !victimUid || killer.uid === victimUid) return null;
  const day = new Date(now + 3 * 36e5).toISOString().slice(0, 10);
  const m = spByUid.get(killer.uid) ?? /* @__PURE__ */ new Map();
  spByUid.set(killer.uid, m);
  const r = m.get(victimUid);
  const n = r && r.day === day ? r.n : 0;
  if (n >= RIVAL_DAILY_LIMIT) return null;
  m.set(victimUid, { day, n: n + 1 });
  return { sp: RIVAL_SP * spMult() };
}
function buildLoadout(st, d) {
  if (!st) return null;
  const lvl = Math.max(1, Math.min(8, Number(st.level) || 1)), elite = Number(st.elite) > 0 ? eliteLevelFromEp(Number(st.ep) || 0) : 0;
  const cap = elite > 0 ? ELITE_CANNON_CAPACITY : 100, mt = {};
  let total = 0;
  for (const k of Object.keys(CANNONS)) {
    const want = Math.max(0, Math.floor(Number(d?.mt?.[k]) || 0)), own = Math.max(0, Number(st["c_" + k]) || 0);
    mt[k] = Math.min(want, own, cap - total);
    total += mt[k];
  }
  let type = String(d?.type || "cast");
  if (!CANNONS[type] || !mt[type]) type = Object.keys(mt).sort((a, b) => mt[b] - mt[a])[0] || "cast";
  const eq = {}, used = {};
  for (const [slot, id] of Object.entries(d?.eq || {})) {
    if (typeof id !== "string" || !EQUIPMENT.some((e) => e.id === id && e.slot === slot)) continue;
    used[id] = (used[id] || 0) + 1;
    if (used[id] <= (Number(st["e_" + id]) || 0)) eq[slot] = id;
  }
  const et = equipTotals(eq), active = (Array.isArray(d?.act) ? d.act : []).filter((x) => typeof x === "string").slice(0, officerSlots(lvl));
  const rank = (id) => active.includes(id) ? Math.max(0, Math.min(OFFICER_MAX_RANK, Number(st["o_" + id]) || 0)) : 0;
  const achOk = !!d?.ach && MAIN_COLLECTION.every((id) => {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return true;
    if (a.stat === "daily") return true;
    if (a.stat === "level") return lvl >= a.goal;
    return (Number(st["st_" + a.stat]) || 0) >= a.goal;
  });
  const el = cumulativeEliteBonus(elite);
  let tal = {}, spent = 0;
  for (const [id, r] of Object.entries(d?.tal || {})) {
    const t = TALENTS[id];
    const n = Math.max(0, Math.min(t?.max ?? 0, Math.floor(Number(r) || 0)));
    if (t && n) {
      tal[id] = n;
      spent += n;
    }
  }
  if (spent > talentPoints(lvl)) tal = {};
  return {
    tal,
    level: lvl,
    mineMult: 1 + 0.15 * (tal.sapper || 0),
    cannons: total,
    type,
    upDamage: Number(st.u_damage) || 0,
    upReload: Number(st.u_reload) || 0,
    upRange: Number(st.u_range) || 0,
    crewDamage: 1 + 0.05 * rank("gunner"),
    crewReload: 1,
    crewRange: 12 * rank("lookout"),
    equipDamage: et.damage,
    equipReload: et.reload,
    equipRange: et.range,
    achDamage: achOk ? 0.05 : 0,
    eliteDamage: el.damage,
    eliteReload: el.reload,
    hero: d?.hero ? HERO_DAMAGE : 0
  };
}
function shotCheck(c, L, a, dist, now, rage) {
  const rl = reloadTime(L, a) * 1e3 * 0.85;
  if (now - (c.lastAtk ?? -1e12) < rl) return "dolum";
  if (dist > rangeOf(L) + 150) return "menzil";
  if (rage) {
    c.rageShots = (c.rageShots || []).filter((t) => now - t < 3e4);
    if (c.rageShots.length >= 2) return "\xF6fke";
    c.rageShots.push(now);
  }
  c.lastAtk = now;
  return null;
}
function addCredit(c, add) {
  c.credit ??= {};
  for (const k in add) c.credit[k] = (c.credit[k] || 0) + add[k];
}
var NPC_RANGE = 900;
var NPC_LEASH = 680;
var NPC_RESPAWN_MS = 3e3;
var NPC_KILL_SHARE = 0.3;
var seaNpcs = /* @__PURE__ */ new Map();
var npcPick = (m, list) => {
  const defs = m.npcs.map((id) => NPCS[id]).filter((d) => d && d.sprite);
  const missing = defs.filter((d) => ![...list.values()].some((n) => n.def.id === d.id));
  const pool = missing.length ? missing : defs;
  return pool[Math.floor(Math.random() * pool.length)];
};
function npcSpawn(sea2, now = Date.now(), rand = Math.random) {
  const map = seaMap(sea2), m = MAPS[map];
  if (!m) return null;
  let st = seaNpcs.get(sea2);
  if (!st) {
    st = { list: /* @__PURE__ */ new Map(), seq: 0, respawn: [] };
    seaNpcs.set(sea2, st);
  }
  const def = npcPick(m, st.list);
  if (!def) return null;
  const p2 = pickSpot(map, rand), id = `${map}:${++st.seq}`;
  const n = { id, def, x: p2.x, y: p2.y, hx: p2.x, hy: p2.y, hp: def.hp, max: def.hp, wx: p2.x, wy: p2.y, aggro: null, aggroUntil: 0, dmg: /* @__PURE__ */ new Map(), moved: true, hpDirty: false };
  st.list.set(id, n);
  return n;
}
function npcFill(sea2, now = Date.now()) {
  const m = MAPS[seaMap(sea2)];
  if (!m) return [];
  let st = seaNpcs.get(sea2);
  const out = [];
  while ((st?.list.size ?? 0) + (st?.respawn.length ?? 0) < m.npcCount) {
    const n = npcSpawn(sea2, now);
    if (!n) break;
    out.push(n);
    st = seaNpcs.get(sea2);
  }
  return out;
}
var npcInfo = (n) => ({ id: n.id, d: n.def.id, x: Math.round(n.x), y: Math.round(n.y), hp: Math.round(n.hp), max: n.max });
function npcMove(n, dt, players, now) {
  let tx = n.wx, ty = n.wy, v = n.def.speed * 0.45 * 1.4;
  const foe = n.aggro && now < n.aggroUntil ? players.find((p2) => p2.uid === n.aggro && p2.last) : null;
  if (foe && Math.hypot(n.x - n.hx, n.y - n.hy) < NPC_LEASH) {
    tx = foe.last.x;
    ty = foe.last.y;
    v = n.def.speed * 1.4;
    if (Math.hypot(tx - n.x, ty - n.y) < 240) return;
  } else {
    n.aggro = null;
    if (Math.hypot(n.wx - n.x, n.wy - n.y) < 20) {
      const a = Math.random() * Math.PI * 2, r = 60 + Math.random() * 240;
      n.wx = Math.max(80, Math.min(WORLD_WIDTH - 80, n.hx + Math.cos(a) * r));
      n.wy = Math.max(80, Math.min(WORLD_HEIGHT - 80, n.hy + Math.sin(a) * r));
      tx = n.wx;
      ty = n.wy;
    }
  }
  const d = Math.hypot(tx - n.x, ty - n.y);
  if (d < 1) return;
  const st = Math.min(d, v * dt);
  n.x += (tx - n.x) / d * st;
  n.y += (ty - n.y) / d * st;
  n.moved = true;
}
var NPC_FIRE_RANGE = 360;
var NPC_SPAWN_GRACE = 3e3;
var NPC_DMG_MODEL = 0.7;
function npcFire(n, players, now, safe, rand = Math.random) {
  if (safe || now < (n.cdUntil ?? 0)) return null;
  let t = n.aggro && now < n.aggroUntil ? players.find((p2) => p2.uid === n.aggro && p2.last) : null;
  if (!t || Math.hypot(t.last.x - n.x, t.last.y - n.y) > NPC_FIRE_RANGE) {
    t = null;
    let bd = NPC_FIRE_RANGE;
    for (const p2 of players) {
      if (!p2.last || p2.admin || now - (p2.tpAt || 0) < NPC_SPAWN_GRACE) continue;
      const d = Math.hypot(p2.last.x - n.x, p2.last.y - n.y);
      if (d < bd) {
        bd = d;
        t = p2;
      }
    }
  }
  if (!t) return null;
  if (!n.aggro) {
    n.aggro = t.uid;
    n.aggroUntil = now + 4e3;
  }
  n.cdUntil = now + (n.def.reload + rand() * 0.55) * 1e3;
  return { to: t, dmg: Math.round(n.def.damage * (0.85 + rand() * 0.3)) };
}
function npcHit(c, sea2, id, dmg, now) {
  const n = seaNpcs.get(sea2)?.list.get(String(id));
  if (!n || !(dmg > 0)) return null;
  if (!c.last || Math.hypot(c.last.x - n.x, c.last.y - n.y) > NPC_RANGE) return { err: "menzil" };
  const t = dpsTake(c, dmg, now);
  let d = sbTake(c, t.ok);
  d = Math.min(d, n.hp);
  if (d <= 0) return { err: "b\xFCt\xE7e", flag: t.flag };
  return { ...npcApply(c, sea2, n, d, now), flag: t.flag };
}
function npcApply(c, sea2, n, d, now) {
  d = Math.min(d, n.hp);
  n.hp -= d;
  n.hpDirty = true;
  n.dmg.set(c.uid, (n.dmg.get(c.uid) || 0) + d);
  n.aggro = c.uid;
  n.aggroUntil = now + 12e3;
  if (n.hp > 0) return { dealt: d };
  const st = seaNpcs.get(sea2);
  st.list.delete(n.id);
  st.respawn.push(now + NPC_RESPAWN_MS);
  const total = [...n.dmg.values()].reduce((a, v) => a + v, 0) || 1;
  return { dealt: d, dead: n, shares: [...n.dmg].map(([uid, v]) => [uid, v / total]) };
}
function npcDeathCredit(c, def, map, share) {
  const add = { gold: G(def.gold * share * (1 + 0.05 * talentRank(c, "bounty"))), xp: X(def.xp * share) };
  if (share >= NPC_KILL_SHARE) {
    add.st_npc = 1;
    if (def.role === "heavy") add.st_heavy = 1;
    c.qk ??= {};
    c.qk[def.id] = (c.qk[def.id] || 0) + 1;
    const lvl = Math.round(Number(c.econ?.level) || 1);
    if (lvl >= 2 && map === levelQuestMap(lvl) && levelQuestTargets(lvl).ships.includes(def.id)) add.lqk = 1;
  }
  return add;
}
var Rate = class {
  constructor(perWindow, windowMs) {
    this.n = perWindow;
    this.w = windowMs;
    this.t = [];
  }
  hit(now) {
    while (this.t.length && now - this.t[0] > this.w) this.t.shift();
    if (this.t.length >= this.n) return false;
    this.t.push(now);
    return true;
  }
};
function canJoin(c, name, now = Date.now()) {
  if (!name) return true;
  if (c.admin && name !== SIEGE_ROOM && MAPS[seaMap(name)]) return true;
  if (!c.econ) return false;
  if (name === SIEGE_ROOM) return siegeWindowAt(now).open || SIEGE_TRIAL;
  {
    const id = lsMatchOfSea(name);
    if (id !== void 0) {
      const m = lsMatches.get(id);
      return !!m && !m.result && !!m.players.get(c.uid)?.alive;
    }
  }
  {
    const id = domMatchOfSea(name);
    if (id !== void 0) {
      const m = domMatches.get(id);
      return !!m && !m.result && m.teams.has(c.uid);
    }
  }
  const map = MAPS[seaMap(name)];
  return !!map && Number(c.econ.level) >= map.tier;
}
async function applyUsage(c, salvo, item, now) {
  const shadow = { ...c, sb: { ...c.sb || { pool: 0 } }, uses: { ...c.uses || {} } };
  let r = item === null ? noteSalvo(shadow, salvo) : noteUse(shadow, item, now);
  if (r.err === "stok") {
    await loadEcon(c);
    shadow.econ = c.econ;
    r = item === null ? noteSalvo(shadow, salvo) : noteUse(shadow, item, now);
  }
  if (r.err) {
    send(c, { t: "usageDenied", reason: r.err });
    return;
  }
  const use = Object.fromEntries(Object.entries(r.use).map(([k, v]) => [k.slice(3), v]));
  const st = process.env.BENCH_AUTH === "1" && c.uid.startsWith("b") ? c.econ : await dbRpcJson("economy_reserve_usage", { p_uid: c.uid, p_use: use });
  if (!st || st.error) {
    send(c, { t: "usageDenied", reason: "stok do\u011Frulanamad\u0131" });
    return;
  }
  c.econ = st;
  c.sb = shadow.sb;
  c.uses = shadow.uses;
  if (r.over) suspect(c, "top say\u0131s\u0131");
  if (item === null) {
    const a = String(salvo?.a || ""), n = Number(use[ITEM_OF[a] ?? "a_" + a]) || 0;
    const dm = domMatches.get(domMatchOfSea(c.sea));
    if (dm && dm.teams.has(c.uid)) {
      const balls = a === "iron" ? Number(use.iron) || 0 : n + (Number(use.iron) || 0);
      dm.spent.set(c.uid, (dm.spent.get(c.uid) || 0) + balls);
      return;
    }
    if (n > 0 && ELITE_POINTS_PER_BALL[a]) addCredit(c, { ep: Math.round(n * ELITE_POINTS_PER_BALL[a] * epMult()), st_eliteBalls: n });
    const ni = Number(use.iron) || 0;
    if (ni > 0) addCredit(c, { ep: Math.round(ni * IRON_EP_PER_BALL * epMult()) });
  }
}
var seas = /* @__PURE__ */ new Map();
var all = /* @__PURE__ */ new Set();
var log = (...a) => console.log((/* @__PURE__ */ new Date()).toISOString(), ...a);
var FLAG_FILE = process.env.FLAG_FILE || "/opt/game/flags.jsonl";
var flags = [];
try {
  for (const l of import_node_fs.default.readFileSync(FLAG_FILE, "utf8").trim().split("\n").slice(-500)) if (l) flags.push(JSON.parse(l));
} catch {
}
function addFlag(c, why, extra) {
  const now = Date.now(), f = flags.findLast?.((x) => x.playerNo === c.playerNo && x.reason === why && now - x.last < 6e4);
  if (f) {
    f.count++;
    f.last = now;
    f.detail = extra;
    return;
  }
  const n = { playerNo: c.playerNo, nick: c.nick, reason: why, detail: extra, count: 1, at: now, last: now };
  flags.push(n);
  if (flags.length > 500) flags.shift();
  try {
    import_node_fs.default.appendFileSync(FLAG_FILE, JSON.stringify(n) + "\n");
  } catch {
  }
}
async function isAdminToken(token) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/is_admin`, { method: "POST", headers: { apikey: SUPABASE_ANON, authorization: `Bearer ${token}`, "content-type": "application/json" }, body: "{}" });
  return r.ok && await r.json() === true;
}
var suspect = (c, why, extra = "") => {
  c.strikes++;
  addFlag(c, why, String(extra));
  log("\u015E\xDCPHEL\u0130", `#${c.playerNo}`, c.nick, why, extra, `(uyar\u0131 ${c.strikes})`);
  if (c.strikes >= 30) {
    log("ATILDI", `#${c.playerNo}`, c.nick);
    c.ws.close(4003, "hile");
  }
};
var send = (c, o) => {
  if (c.ws.readyState === 1) c.ws.send(typeof o === "string" ? o : JSON.stringify(o));
};
var toSea = (c, o, self = false) => {
  const room = seas.get(c.sea);
  if (!room) return;
  const s = JSON.stringify(o);
  for (const x of room) if (self || x !== c) send(x, s);
};
var toNear = (c, o, target) => {
  const room = seas.get(c.sea);
  if (!room) return;
  const s = JSON.stringify(o);
  for (const x of room) {
    if (x === c) continue;
    if (x.netId === target || !c.last || !x.last || Math.abs(x.last.x - c.last.x) + Math.abs(x.last.y - c.last.y) < NEAR) send(x, s);
  }
};
var toAll = (c, o) => {
  const s = JSON.stringify(o);
  for (const x of all) if (x !== c && x.uid) send(x, s);
};
function leaveSea(c) {
  c.seen = null;
  c.state = null;
  for (const x of seas.get(c.sea) || []) x.seen?.delete(c);
  if (!c.sea) return;
  const room = seas.get(c.sea);
  if (room) {
    room.delete(c);
    if (!room.size) seas.delete(c.sea);
  }
  if (c.netId) toSea(c, { t: "leave", id: c.netId });
  c.sea = "";
  c.last = null;
}
var BOSS_LIFE_MS = 20 * 6e4;
var BOSS_HIT_CAP = 8e4;
var bossSeas = /* @__PURE__ */ new Map();
var seaTier = (name) => {
  const m = /^sea-(\d)-\d$/.exec(name);
  return m ? Number(m[1]) : 0;
};
function bossKill(name, need, now = Date.now(), rand = Math.random) {
  const tier = seaTier(name);
  if (!tier) return null;
  const st = bossSeas.get(name) ?? { kills: 0, boss: null };
  bossSeas.set(name, st);
  if (st.boss) return null;
  need = Math.max(50, Math.min(200, Math.round(Number(need) || 200)));
  if (++st.kills < need) return null;
  st.kills = 0;
  st.boss = { id: Math.random().toString(36).slice(2, 9), hp: BOSS_HP[tier], maxHp: BOSS_HP[tier], x: Math.round(700 + rand() * 4600), y: Math.round(600 + rand() * 2800), at: now, dmg: /* @__PURE__ */ new Map(), dirty: false };
  return st.boss;
}
var bossInfo = (name, b) => ({ sea: name, id: b.id, hp: b.hp, maxHp: b.maxHp, x: b.x, y: b.y, left: Math.max(0, BOSS_LIFE_MS - (Date.now() - b.at)) });
function bossHit(name, uid, dmg) {
  const b = bossSeas.get(name)?.boss;
  if (!b || !(dmg > 0)) return null;
  dmg = Math.min(BOSS_HIT_CAP, dmg, b.hp);
  b.hp -= dmg;
  b.dmg.set(uid, (b.dmg.get(uid) || 0) + dmg);
  b.dirty = true;
  if (b.hp > 0) return null;
  const total = [...b.dmg.values()].reduce((a, v) => a + v, 0) || 1, shares = {};
  for (const [u, d] of b.dmg) shares[u] = { share: d / total, dmg: Math.round(d) };
  bossSeas.get(name).boss = null;
  return { id: b.id, shares, n: b.dmg.size };
}
function bossTick(now) {
  for (const [name, st] of bossSeas) {
    const b = st.boss;
    if (!b) continue;
    const room = seas.get(name);
    if (now - b.at > BOSS_LIFE_MS) {
      st.boss = null;
      if (room) for (const x of room) send(x, { t: "bgone", d: { id: b.id } });
      continue;
    }
    if (b.dirty && room) {
      b.dirty = false;
      const msg = JSON.stringify({ t: "bhp", d: { id: b.id, hp: Math.round(b.hp) } });
      for (const x of room) send(x, msg);
    }
  }
}
var ISLAND_KEYS = ["2/1", "2/2", "3/1", "3/2", "4/1", "4/2", "5/1", "5/2", "6/1", "6/2", "7/1", "7/2", "8/1", "8/2"];
var TOWER_SLOTS = 16;
var RUIN_MS = 36e5;
var TOWER_HIT_CAP = 4e5;
var TOWER_HEAL_CAP = 3e5;
var islands = /* @__PURE__ */ new Map();
var islandTier = (k) => Number(String(k)[0]);
function islandFromRow(row, tag = "", now = Date.now()) {
  const tier = islandTier(row.map_key), max = fleetTowerStats(tier).hp, ruins = { ...row.ruins || {} };
  let towers;
  if (!row.guild_id) towers = Array.from({ length: TOWER_SLOTS }, (_, i) => ruins[i] && now - ruins[i] < RUIN_MS ? null : { type: "npc", hp: max, maxHp: max });
  else towers = Array.from({ length: TOWER_SLOTS }, (_, i) => {
    const t = (row.towers || [])[i];
    return t && typeof t === "object" ? { type: t.type || "cannon", hp: Math.max(1, Math.min(max, Number(t.hp) || max)), maxHp: max } : null;
  });
  return { key: row.map_key, guild: Number(row.guild_id || 0), tag, towers, ruins, hitAt: 0, hpDirty: false, dirty: /* @__PURE__ */ new Set(), emptySince: towers.some(Boolean) ? 0 : now };
}
var islandInfo = (i) => ({ key: i.key, guild: i.guild, tag: i.tag, towers: i.towers.map((t) => t ? [Math.round(t.hp), t.maxHp] : null), ruins: i.ruins });
var seaOfIsland = (k) => `sea-${k.replace("/", "-")}`;
var islandOfSea = (name) => {
  const m = /^sea-(\d)-(\d)$/.exec(name);
  return m && Number(m[1]) >= 2 ? `${m[1]}/${m[2]}` : null;
};
function towerHit(key, slot, guildId, dmg, heal, now = Date.now()) {
  const i = islands.get(key), t = i?.towers[slot];
  if (!t || !(dmg > 0)) return null;
  if (heal) {
    if (!guildId || guildId !== i.guild || t.hp >= t.maxHp) return null;
    t.hp = Math.min(t.maxHp, t.hp + Math.min(TOWER_HEAL_CAP, dmg));
    i.dirty.add(slot);
    i.hpDirty = true;
    return { healed: true };
  }
  if (i.guild && guildId === i.guild) return null;
  t.hp -= Math.min(TOWER_HIT_CAP, dmg);
  i.hitAt = now;
  i.dirty.add(slot);
  i.hpDirty = true;
  if (t.hp > 0) return {};
  i.towers[slot] = null;
  i.ruins[slot] = now;
  const res = { destroyed: true, captured: false };
  if (i.towers.every((x) => !x)) {
    i.emptySince = now;
    if (guildId) {
      i.guild = guildId;
      i.ruins = {};
      res.captured = true;
    }
  }
  return res;
}
async function dbRpc(fn, args) {
  if (!SERVER_SECRET) return;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: SUPABASE_ANON, authorization: `Bearer ${SUPABASE_ANON}`, "content-type": "application/json" }, body: JSON.stringify({ p_secret: SERVER_SECRET, ...args }) });
  if (!r.ok) log("ADA kay\u0131t hatas\u0131", fn, r.status, await r.text());
}
async function dbRpcJson(fn, args) {
  if (!SERVER_SECRET) return null;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: SUPABASE_ANON, authorization: `Bearer ${SUPABASE_ANON}`, "content-type": "application/json" }, body: JSON.stringify({ p_secret: SERVER_SECRET, ...args }) });
  if (!r.ok) {
    log("RPC hatas\u0131", fn, r.status, await r.text());
    return null;
  }
  return r.json();
}
var seaMap = (name) => {
  const m = /^sea-(\d)-(\d)$/.exec(name || "");
  return m ? `${m[1]}/${m[2]}` : null;
};
async function onSpy(c, nick) {
  const r = await dbRpcJson("spy_charge", { p_spy: c.uid, p_nick: String(nick || "").slice(0, 24) }).catch(() => null);
  if (!r) {
    send(c, { t: "spyr", d: { status: "error" } });
    return;
  }
  if (r.status === "found") {
    const live = [...all].find((x) => x.uid === r.target && x.sea && x.last);
    if (live) {
      const map = seaMap(live.sea);
      send(c, { t: "spyr", d: { status: "found", nick: r.nick, online: true, map: map ?? "kale", x: live.last.x, y: live.last.y } });
      return;
    }
    send(c, { t: "spyr", d: { status: "found", nick: r.nick, online: false, map: r.map ?? null, x: r.x ?? null, y: r.y ?? null } });
    return;
  }
  send(c, { t: "spyr", d: r });
}
async function loadEcon(c) {
  if (process.env.BENCH_AUTH === "1" && c.uid?.startsWith("b")) {
    c.econ = { level: 8, c_cast: 315, iron: 1e9, a_fire: 1e9 };
    return;
  }
  if (!SERVER_SECRET || !c.uid) return;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/economy_peek`, { method: "POST", headers: { apikey: SUPABASE_ANON, authorization: `Bearer ${SUPABASE_ANON}`, "content-type": "application/json" }, body: JSON.stringify({ p_secret: SERVER_SECRET, p_uid: c.uid }) });
    if (r.ok) {
      const st = await r.json();
      if (st && typeof st === "object") c.econ = st;
    }
  } catch {
  }
  if (all.has(c) && !c.econTimer) c.econTimer = setTimeout(() => {
    c.econTimer = null;
    void loadEcon(c);
  }, 5 * 6e4);
  c.econTimer?.unref?.();
}
async function guildTag(id) {
  if (!id) return "";
  const r = await fetch(`${SUPABASE_URL}/rest/v1/guilds?id=eq.${id}&select=tag`, { headers: { apikey: SUPABASE_ANON, authorization: `Bearer ${SUPABASE_ANON}` } });
  const rows = r.ok ? await r.json() : [];
  return rows[0]?.tag || "";
}
async function loadIsland(key) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/islands?map_key=eq.${encodeURIComponent(key)}&select=*`, { headers: { apikey: SUPABASE_ANON, authorization: `Bearer ${SUPABASE_ANON}` } });
  const row = (r.ok ? await r.json() : [])[0] ?? { map_key: key };
  const i = islandFromRow(row, await guildTag(row.guild_id).catch(() => ""));
  islands.set(key, i);
  return i;
}
async function loadIslands() {
  for (const k of ISLAND_KEYS) await loadIsland(k).catch((e) => {
    log("ADA okunamad\u0131", k, e?.message);
    islands.set(k, islandFromRow({ map_key: k }));
  });
  log("ADALAR y\xFCklendi");
}
async function saveIslandHp(i) {
  if (!i.guild || !i.hpDirty) return;
  i.hpDirty = false;
  await dbRpc("island_hp", { p_map: i.key, p_hps: i.towers.map((t) => t ? Math.round(t.hp) : null) }).catch(() => {
  });
}
function sendRoom(key, o) {
  const room = seas.get(seaOfIsland(key));
  if (!room) return;
  const m = JSON.stringify(o);
  for (const x of room) send(x, m);
}
var islandTickNo = 0;
function islandTick(now) {
  islandTickNo++;
  for (const i of islands.values()) {
    if (i.dirty.size) {
      sendRoom(i.key, { t: "thp", d: { key: i.key, s: [...i.dirty].map((n) => [n, Math.round(i.towers[n]?.hp ?? 0)]) } });
      i.dirty.clear();
    }
    if (!i.guild && i.towers.some((t, n) => !t && now - (i.ruins[n] ?? 0) >= RUIN_MS)) {
      const max = fleetTowerStats(islandTier(i.key)).hp;
      i.towers = i.towers.map((t, n) => t || (now - (i.ruins[n] ?? 0) >= RUIN_MS ? { type: "npc", hp: max, maxHp: max } : null));
      sendRoom(i.key, { t: "isle", d: islandInfo(i) });
    }
    if (i.guild && now - i.hitAt < 6e3 && islandTickNo % 17 === 0) {
      const m = JSON.stringify({ t: "ialert", d: { key: i.key } });
      for (const c of all) if (c.guildId === i.guild) send(c, m);
    }
    if (islandTickNo % 100 === 0) void saveIslandHp(i);
    if (i.guild && i.towers.some(Boolean)) i.emptySince = 0;
    else if (i.guild && i.emptySince && now - i.emptySince >= RUIN_MS) {
      log("ADA SAH\u0130PS\u0130Z KALDI", i.key);
      const n = islandFromRow({ map_key: i.key }, "", now);
      Object.assign(i, { guild: 0, tag: "", towers: n.towers, ruins: {}, emptySince: 0 });
      void dbRpc("island_capture", { p_map: i.key, p_guild: null }).catch(() => {
      });
      sendRoom(i.key, { t: "isle", d: islandInfo(i) });
    }
  }
}
async function towerApply(c, key, slot, dmg, heal, now) {
  const r = towerHit(key, slot, c.guildId, dmg, heal, now);
  if (!r?.destroyed) return;
  const i = islands.get(key);
  sendRoom(key, { t: "tdown", d: { key, slot, by: c.netId } });
  if (r.captured) {
    log("ADA ELE GE\xC7\u0130R\u0130LD\u0130", key, c.nick);
    i.tag = await guildTag(i.guild).catch(() => "");
    await dbRpc("island_capture", { p_map: key, p_guild: i.guild }).catch(() => {
    });
    sendRoom(key, { t: "isle", d: islandInfo(i) });
    {
      const rw = fleetReward(Number(String(key).split("/")[0]) || 1);
      addCredit(c, { gold: rw.gold, xp: rw.xp });
    }
    const msg = JSON.stringify({ t: "icap", d: { key, tag: i.tag, by: c.netId, nick: c.nick } });
    for (const x of all) if (x.uid) send(x, msg);
  } else await dbRpc("island_destroy", { p_map: key, p_slot: slot, p_at: now }).catch(() => {
  });
}
var SIEGE_TRIAL = process.env.SIEGE_TRIAL === "1";
var SIEGE_ROOM = "sea-siege";
var SIEGE_PIECES = 17;
var SIEGE_HIT_CAP = 4e5;
var SIEGE_GRACE_MS = 10 * 6e4;
var pieceBase = (i) => i < 12 ? SIEGE_HP_PER_CAPTAIN.wall : i < 16 ? SIEGE_HP_PER_CAPTAIN.inner : SIEGE_HP_PER_CAPTAIN.commander;
function siegeWindowAt(now) {
  const t = new Date(now + 3 * 36e5), day = t.getUTCDay(), h = t.getUTCHours();
  const start = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), 20) - 3 * 36e5;
  return { open: day === 5 && h >= 20 && h < 22, id: `w-${t.toISOString().slice(0, 10)}`, end: start + 2 * 36e5 };
}
var siegeRun = null;
function resetSiege() {
  siegeRun = null;
}
function siegeJoin(uid, nick, now = Date.now()) {
  const w = siegeWindowAt(now);
  if (!w.open && !SIEGE_TRIAL) return null;
  const reuse = siegeRun && (w.open ? siegeRun.id === w.id : !siegeRun.result && now < siegeRun.end);
  if (!reuse) {
    if (w.open || !siegeRun || siegeRun.result || now >= siegeRun.end) {
      siegeRun = {
        id: w.open ? w.id : `t-${now}`,
        end: w.open ? w.end : now + 2 * 36e5,
        hp: Array.from({ length: SIEGE_PIECES }, (_, i) => pieceBase(i)),
        max: Array.from({ length: SIEGE_PIECES }, (_, i) => pieceBase(i)),
        caps: /* @__PURE__ */ new Set(),
        contrib: /* @__PURE__ */ new Map(),
        result: null,
        dirty: /* @__PURE__ */ new Set(),
        rankDirty: true
      };
    }
  }
  const r = siegeRun;
  if (!r.caps.has(uid) && !r.result) {
    r.caps.add(uid);
    const n = r.caps.size;
    for (let i = 0; i < SIEGE_PIECES; i++) {
      const nm = pieceBase(i) * n;
      if (r.hp[i] > 0) r.hp[i] = r.hp[i] / r.max[i] * nm;
      r.max[i] = nm;
      r.dirty.add(i);
    }
  }
  if (!r.contrib.has(uid)) r.contrib.set(uid, { nick, dmg: 0 });
  return r;
}
var siegePhaseOf = (r) => r.hp.slice(0, 12).some((h) => h > 0) ? 1 : r.hp.slice(12, 16).some((h) => h > 0) ? 2 : 3;
function siegeHitPiece(uid, nick, i, dmg) {
  const r = siegeRun;
  if (!r || r.result || !(dmg > 0) || !Number.isInteger(i) || i < 0 || i >= SIEGE_PIECES || r.hp[i] <= 0) return null;
  const ph = siegePhaseOf(r);
  if (i >= 12 && i < 16 && ph < 2 || i === 16 && ph < 3) return null;
  const d = Math.min(SIEGE_HIT_CAP, dmg, r.hp[i]);
  r.hp[i] -= d;
  const c = r.contrib.get(uid) ?? { nick, dmg: 0 };
  c.dmg += d;
  c.nick = nick;
  r.contrib.set(uid, c);
  r.dirty.add(i);
  r.rankDirty = true;
  if (r.hp[i] > 0) return { damage: d };
  if (i === 16) {
    r.result = "won";
    return { down: i, won: true, damage: d };
  }
  return { down: i, damage: d };
}
var siegeTop = (r) => [...r.contrib.values()].filter((c) => c.dmg > 0).sort((a, b) => b.dmg - a.dmg).slice(0, 10).map((c) => [c.nick, Math.round(c.dmg)]);
var siegeInfo = (r, uid) => ({ id: r.id, end: r.end, n: r.caps.size, hp: r.hp.map(Math.round), max: r.max, result: r.result, top: siegeTop(r), mine: Math.round(r.contrib.get(uid)?.dmg ?? 0) });
function siegeFinish() {
  const r = siegeRun, room = seas.get(SIEGE_ROOM), total = [...r.contrib.values()].reduce((a, c) => a + c.dmg, 0) || 1;
  log("KU\u015EATMA B\u0130TT\u0130", r.result, r.caps.size, "kaptan");
  if (r.result === "won") {
    const t = Date.now() + HERO_DAYS * 864e5;
    [...r.contrib].filter(([, c]) => c.dmg > 0).sort((a, b) => b[1].dmg - a[1].dmg).slice(0, 3).forEach(([u]) => heroUntil.set(u, t));
  }
  const chests = /* @__PURE__ */ new Map();
  if (r.result === "won") for (const x of all) {
    const dmg = r.contrib.get(x.uid)?.dmg ?? 0;
    if (!x.uid || !earnsChest(dmg, r.caps.size)) continue;
    const ch = victoryChest(Math.random, Number(x.econ?.level) || 8), add = { pearls: ch.pearls, a_speed: ch.speed, a_mine: ch.mine, a_powder: ch.powder, a_shield: ch.shield };
    for (const [k, n] of Object.entries(ch.ammo)) add["a_" + k] = (add["a_" + k] || 0) + n;
    addCredit(x, add);
    chests.set(x.uid, ch);
  }
  for (const x of room || []) send(x, { t: "send", d: { won: r.result === "won", n: r.caps.size, top: siegeTop(r), mine: Math.round(r.contrib.get(x.uid)?.dmg ?? 0), share: (r.contrib.get(x.uid)?.dmg ?? 0) / total, chest: chests.get(x.uid) ?? null } });
}
var siegeTickNo = 0;
function siegeTick(now) {
  const r = siegeRun;
  if (!r) return;
  siegeTickNo++;
  const room = seas.get(SIEGE_ROOM);
  if (!r.result && now > r.end) {
    r.result = "lost";
    siegeFinish();
  }
  if (r.dirty.size && room) {
    const m = JSON.stringify({ t: "shp", d: [...r.dirty].map((i) => [i, Math.round(r.hp[i]), r.max[i]]) });
    for (const x of room) send(x, m);
    r.dirty.clear();
  }
  if (r.rankDirty && siegeTickNo % 7 === 0 && room) {
    r.rankDirty = false;
    const top = siegeTop(r);
    for (const x of room) send(x, { t: "srank", d: { n: r.caps.size, top, mine: Math.round(r.contrib.get(x.uid)?.dmg ?? 0) } });
  }
  if (r.result && now > r.end + SIEGE_GRACE_MS) siegeRun = null;
}
var NEAR = 1800;
var TICK_MS = 100;
var FAR_EVERY = 20;
var IDENT = ["nick", "tag", "ship", "maxHp", "sp", "level", "adm", "tm"];
function queueState(c, s) {
  const id = {};
  let changed = false;
  for (const k of IDENT) if (k in s) {
    if (k === "nick") s.nick = c.nick;
    if (JSON.stringify(c.ident?.[k]) !== JSON.stringify(s[k])) changed = true;
    id[k] = s[k];
    delete s[k];
  }
  if (changed) {
    c.ident = { ...c.ident, ...id };
    c.identVer = (c.identVer || 0) + 1;
  }
  c.state = s;
  c.stateVer = (c.stateVer || 0) + 1;
}
var tickNo = 0;
function buildBatch(rec, room, tick) {
  const out = [];
  if (!rec.seen) rec.seen = /* @__PURE__ */ new Map();
  const far = tick % FAR_EVERY === 0;
  for (const o of room) {
    if (o === rec || !o.state) continue;
    const seen = rec.seen.get(o) || { s: 0, i: 0 };
    if (seen.s === o.stateVer) continue;
    const near = !rec.last || !o.last || Math.abs(o.last.x - rec.last.x) + Math.abs(o.last.y - rec.last.y) < NEAR;
    if (!near && !far) continue;
    const d = { ...o.state };
    if (seen.i !== o.identVer && o.ident) {
      Object.assign(d, o.ident);
      seen.i = o.identVer;
    }
    seen.s = o.stateVer;
    rec.seen.set(o, seen);
    out.push(d);
  }
  return out;
}
setInterval(() => {
  tickNo++;
  if (tickNo % 2 === 0) {
    npcTick(Date.now());
    void mineTick(Date.now());
  }
  if (tickNo % 10 === 0) {
    const now = Date.now();
    for (const c of all) if (c.sea && lootTick(c, now)) send(c, { t: "loot", d: lootInfo(c.loot) });
  }
  if (tickNo % 3 === 0) {
    const now = Date.now();
    bossTick(now);
    islandTick(now);
    siegeTick(now);
  }
  for (const room of seas.values()) {
    if (room.size < 2) continue;
    for (const rec of room) {
      const b = buildBatch(rec, room, tickNo);
      if (b.length) send(rec, { t: "batch", d: b });
    }
  }
}, TICK_MS).unref();
function npcTick(now) {
  for (const [sea2, st] of seaNpcs) {
    const room = seas.get(sea2);
    if (!room || !room.size) {
      seaNpcs.delete(sea2);
      continue;
    }
    const players = [...room];
    st.respawn = st.respawn.filter((t) => {
      if (t > now) return true;
      const n = npcSpawn(sea2, now);
      if (n) {
        const m = JSON.stringify({ t: "nspawn", d: npcInfo(n) });
        for (const x of room) send(x, m);
      }
      return false;
    });
    const safe = !!MAPS[seaMap(sea2)]?.safe, fires = [];
    const pos = [], hp = [];
    for (const n of st.list.values()) {
      npcMove(n, 0.2, players, now);
      const f = npcFire(n, players, now, safe);
      if (f) {
        fires.push([n.id, f.to.netId, f.dmg]);
        npcDamage(f.to, f.dmg, n, now);
      }
      if (n.moved) {
        n.moved = false;
        pos.push([n.id, Math.round(n.x), Math.round(n.y)]);
      }
      if (n.hpDirty) {
        n.hpDirty = false;
        hp.push([n.id, Math.round(n.hp)]);
      }
    }
    if (pos.length || hp.length || fires.length) {
      const m = JSON.stringify({ t: "npos", d: { p: pos, h: hp, f: fires } });
      for (const x of room) send(x, m);
    }
  }
}
function npcDamage(t, dmg, n, now) {
  const p2 = pvpOf(t);
  p2.hitAt = now;
  if (p2.hp === null) return;
  p2.hp -= dmg * NPC_DMG_MODEL;
  if (godCheck(t)) {
    suspect(t, "\xF6l\xFCms\xFCz", "npc");
    pvpReset(t);
    send(t, { t: "forceSink", d: { by: "", byNick: n.def.name } });
  }
}
function npcDeath(c, r, now) {
  {
    const map = seaMap(c.sea);
    const room = seas.get(c.sea) || /* @__PURE__ */ new Set(), def = r.dead.def;
    for (const [uid, share] of r.shares) {
      const x = [...room].find((p2) => p2.uid === uid) ?? [...all].find((p2) => p2.uid === uid);
      if (!x) continue;
      addCredit(x, npcDeathCredit(x, def, map, share));
      send(x, { t: "nkilled", d: { id: r.dead.id, share } });
    }
    const m = JSON.stringify({ t: "ndie", d: { id: r.dead.id } });
    for (const x of room) send(x, m);
    if (def.id === bossFor(map).trigger) {
      const b = bossKill(c.sea, BOSS_KILLS, now);
      if (b) toSea(c, { t: "boss", d: bossInfo(c.sea, b) }, true);
    }
  }
}
var seaMines = /* @__PURE__ */ new Map();
var mineSeq = 0;
function placeMine(c, x, y, now) {
  if (!c.last || !num(x) || !num(y) || Math.hypot(x - c.last.x, y - c.last.y) > 80) return null;
  const list = seaMines.get(c.sea) ?? [];
  seaMines.set(c.sea, list);
  if (list.filter((m2) => m2.uid === c.uid).length >= MINE.maxActive) return null;
  const L = c.ldRaw ? buildLoadout(c.econ, c.ldRaw) : null, m = {
    id: ++mineSeq,
    uid: c.uid,
    netId: c.netId,
    guildId: c.guildId || 0,
    team: c.domTeam || null,
    x: Math.round(x),
    y: Math.round(y),
    arm: now + MINE.armSeconds * 1e3,
    until: now + 4e4,
    dmg: Math.round((MINE.baseDamage + (L?.level ?? 1) * MINE.damagePerLevel) * (L?.mineMult ?? 1))
  };
  list.push(m);
  return m;
}
function mineFoes(sea2, m) {
  const out = { npcs: [], players: [], towers: [] };
  const near = (x, y, r) => Math.hypot(x - m.x, y - m.y) < r;
  for (const n of seaNpcs.get(sea2)?.list.values() ?? []) out.npcs.push(n);
  for (const p2 of seas.get(sea2) ?? []) if (p2.uid !== m.uid && p2.last && !(m.guildId && p2.guildId === m.guildId && !m.team) && !(m.team && (p2.domTeam === m.team || domLocked(p2, Date.now())))) out.players.push(p2);
  const key = islandOfSea(sea2), isle = key ? islands.get(key) : null;
  if (isle && MAPS[key] && !(m.guildId && isle.guild === m.guildId)) {
    const f = MAPS[key].fleet;
    isle.towers.forEach((t, slot) => {
      if (t) {
        const [dx, dy] = FLEET.towers[slot] ?? [0, 0];
        out.towers.push({ key, slot, x: f.x + dx, y: f.y + dy });
      }
    });
  }
  return { all: out, near };
}
async function mineTick(now) {
  for (const [sea2, list] of seaMines) {
    const room = seas.get(sea2);
    if (!room || !room.size) {
      seaMines.delete(sea2);
      continue;
    }
    for (let k = list.length - 1; k >= 0; k--) {
      const m = list[k];
      if (now > m.until) {
        list.splice(k, 1);
        continue;
      }
      if (now < m.arm) continue;
      const { all: f, near } = mineFoes(sea2, m);
      const R = MINE.triggerRadius;
      if (!f.npcs.some((n) => near(n.x, n.y, R)) && !f.players.some((p2) => near(p2.last.x, p2.last.y, R)) && !f.towers.some((t) => near(t.x, t.y, R))) continue;
      list.splice(k, 1);
      const owner = [...all].find((x) => x.uid === m.uid) ?? { uid: m.uid, netId: m.netId, nick: "", sea: sea2, econ: null };
      const B = MINE.blastRadius;
      const boom = JSON.stringify({ t: "mboom", d: { id: m.id, x: m.x, y: m.y } });
      for (const x of room) send(x, boom);
      for (const n of f.npcs) if (near(n.x, n.y, B) && seaNpcs.get(sea2)?.list.has(n.id)) {
        const r = npcApply(owner, sea2, n, m.dmg, now);
        if (r.dead && owner.ws) npcDeath(owner, r, now);
      }
      for (const p2 of f.players) if (near(p2.last.x, p2.last.y, B)) {
        const dealt = pvpGuard(p2, m.dmg, now);
        pvpOf(p2).from.set(m.netId, now);
        if (dealt > 0) send(p2, { t: "mhit", d: { dmg: dealt, by: m.netId } });
      }
      for (const t of f.towers) if (near(t.x, t.y, B) && owner.ws) await towerApply(owner, t.key, t.slot, m.dmg, false, now);
    }
  }
}
function bossApply(c, dmg) {
  const r = bossHit(c.sea, c.uid, dmg);
  if (!r) return;
  const room = seas.get(c.sea);
  log("BOSS BATTI", c.sea, r.n, "kaptan");
  {
    const map = seaMap(c.sea);
    for (const x of all) {
      const sh = r.shares[x.uid];
      if (!sh) continue;
      const add = bossCredit(map, sh.share, r.n);
      if (add) addCredit(x, add);
    }
  }
  for (const x of room || []) send(x, { t: "bdown", d: { id: r.id, n: r.n, ...r.shares[x.uid] ?? { share: 0, dmg: 0 } } });
}
function siegeApply(c, i, dmg) {
  const r = siegeHitPiece(c.uid, c.nick, i, dmg);
  if (r?.damage > 0) addCredit(c, siegeCredit(r.damage, siegeRun.caps.size, c.econ?.level));
  if (!r?.down && r?.down !== 0) return;
  toSea(c, { t: "sdown", d: { i: r.down } }, true);
  if (r.won) siegeFinish();
}
function attackTarget(c, d) {
  const k = String(d?.k || "n"), id = String(d?.id ?? "");
  if (k === "n") {
    const n = seaNpcs.get(c.sea)?.list.get(id);
    return n ? { k, n, x: n.x, y: n.y, kind: "npc" } : null;
  }
  if (k === "b") return bossSeas.get(c.sea)?.boss ? { k, kind: "boss" } : null;
  if (k === "s") {
    const i = Number(id);
    return c.sea === SIEGE_ROOM && Number.isInteger(i) && i >= 0 && i < SIEGE_PIECES ? { k, i, kind: "tower" } : null;
  }
  if (k === "t") {
    const key = islandOfSea(c.sea), slot = Number(id);
    if (!key || !Number.isInteger(slot) || slot < 0 || slot >= TOWER_SLOTS || !MAPS[key]) return null;
    const f = MAPS[key].fleet, [dx, dy] = FLEET.towers[slot] ?? [0, 0];
    return { k, key, slot, x: f.x + dx, y: f.y + dy, kind: "tower" };
  }
  if (k === "p" && lsMatchOfSea(c.sea) !== void 0) {
    const t = [...seas.get(c.sea) || []].find((x) => x.netId === id && x !== c);
    return t?.last && t.lsOn && c.lsOn ? { k, t, x: t.last.x, y: t.last.y, kind: "player", ls: true } : null;
  }
  if (k === "p" && domMatchOfSea(c.sea) !== void 0) {
    const t = [...seas.get(c.sea) || []].find((x) => x.netId === id && x !== c);
    return t?.last && t.domTeam && !domLocked(t, Date.now()) ? { k, t, x: t.last.x, y: t.last.y, kind: "player", dom: true } : null;
  }
  if (k === "p") {
    const t = [...seas.get(c.sea) || []].find((x) => x.netId === id && x !== c);
    if (!t?.last || c.guildId && c.guildId === t.guildId && !t.admin) return null;
    if (t.admin && !aevOpen(c.sea)) return null;
    return { k, t, x: t.last.x, y: t.last.y, kind: "player" };
  }
  return null;
}
async function onAttack(c, d, now) {
  if (!c.last) return;
  const tg = attackTarget(c, d);
  if (!tg) return;
  if (tg.ls) {
    lsAttack(c, tg.t, now, d);
    return;
  }
  if (!c.ldRaw) return;
  c.ld = buildLoadout(c.econ, c.ldRaw);
  if (!c.ld) return;
  const a = String(d?.a || "iron");
  if (tg.dom && (a === "heal" || tg.t.domTeam === c.domTeam)) return;
  if (!["iron", "chain", "fire", "explosive", "breaker", "leech", ...tg.k === "p" || tg.k === "t" ? ["heal"] : []].includes(a)) return;
  const why = shotCheck(c, c.ld, a, tg.x === void 0 ? 0 : Math.hypot(c.last.x - tg.x, c.last.y - tg.y), now, !!d?.r);
  if (why) {
    if (why !== "dolum") suspect(c, "at\u0131\u015F", why);
    return;
  }
  const cap = c.ld.cannons;
  let k = Math.max(0, Math.floor(Number(d?.n) || 0)), i = Math.max(0, Math.floor(Number(d?.i) || 0));
  if (k + i > cap) {
    const f2 = cap / (k + i);
    k = Math.floor(k * f2);
    i = Math.floor(i * f2);
  }
  if (a === "iron") {
    i += k;
    k = 0;
  }
  const before = c.econ, pool = c.sb?.pool ?? 0;
  await applyUsage(c, { a, n: k, i, p: d?.p ? 1 : 0 }, null, now);
  if (c.sb) c.sb.pool = pool;
  if (c.econ === before && SERVER_SECRET && !(process.env.BENCH_AUTH === "1" && c.uid.startsWith("b"))) return;
  const raw = salvoDamage(c.ld, a, k, i, !!d?.p, !!d?.r), dmg = raw * targetFactor(a, tg.kind);
  if (tg.k === "n") {
    const live = seaNpcs.get(c.sea)?.list.get(tg.n.id);
    if (!live) return;
    const r = npcApply(c, c.sea, live, dmg, now);
    if (r.dead) npcDeath(c, r, now);
    return;
  }
  if (tg.k === "b") {
    bossApply(c, dmg);
    return;
  }
  if (tg.k === "s") {
    siegeApply(c, tg.i, dmg);
    return;
  }
  if (tg.k === "t") {
    if (a === "heal") towerHit(tg.key, tg.slot, c.guildId, Math.round(raw * 2.6), true, now);
    else await towerApply(c, tg.key, tg.slot, dmg, false, now);
    return;
  }
  if (tg.t.admin && a !== "heal" && !tg.dom) {
    const t2 = tg.t, r = aevHit(c, t2, dmg);
    if (!r) return;
    addCredit(c, r.add);
    send(c, { t: "arew", d: r.add });
    t2.state && (t2.state.hp = r.hp);
    toNear(c, { t: "fire", d: { from: c.netId, to: t2.netId, x: Math.round(c.last.x), y: Math.round(c.last.y), tx: Math.round(t2.last.x), ty: Math.round(t2.last.y), ammo: a, damage: 0 } }, t2.netId);
    if (r.sunk) {
      const msg = JSON.stringify({ t: "chat", d: { nick: "Duyuru", tag: null, adm: true, text: `\u2693 ${c.nick} y\xF6netici gemisini bat\u0131rd\u0131! Gemi yeniden topland\u0131, avlanma s\xFCr\xFCyor.`, at: now } });
      for (const x of all) send(x, msg);
      toSea(c, { t: "aboom", d: { id: t2.netId } }, true);
    }
    return;
  }
  const t = tg.t, f = { from: c.netId, to: t.netId, x: Math.round(c.last.x), y: Math.round(c.last.y), tx: Math.round(t.last.x), ty: Math.round(t.last.y), ammo: a, damage: 0 };
  if (a === "heal") {
    f.damage = Math.round(Math.min(raw, (t.maxHp || 163e3) * (0.08 + Math.random() * 0.012)));
    pvpHeal(t, f.damage, now);
  } else {
    f.damage = pvpGuard(t, dmg, now);
    pvpOf(t).from.set(c.netId, now);
    if (godCheck(t)) {
      suspect(t, "\xF6l\xFCms\xFCz");
      pvpReset(t);
      if (t.domTeam) domSink(t, now);
      send(t, { t: "forceSink", d: { by: c.netId, byNick: c.nick } });
      toSea(t, { t: "sunk", d: { victim: t.netId, victimNick: t.nick, by: c.netId, byNick: c.nick } });
      return;
    }
  }
  toNear(c, { t: "fire", d: f }, t.netId);
}
var ADMIN_SHIP = "admin";
function shipAllowed(st, ship) {
  const e = ELITE_SHIPS.find((x) => x.id === ship);
  if (!e) return "starter";
  return st && Number(st.elite) > 0 && eliteLevelFromEp(Number(st.ep) || 0) >= e.level ? ship : "starter";
}
var AEV_HP = [0, 0, 15e6, 34e6, 75e6, 112e6, 165e6, 225e6, 262e6];
var aevTier = (sea2) => MAPS[seaMap(sea2)]?.tier ?? 0;
var aevOpen = (sea2) => aevTier(sea2) >= 2;
function aevPools(tier) {
  const t = Math.max(2, Math.min(8, tier)), need = LEVEL_XP[t] || LEVEL_XP[7];
  return { xp: need, ep: 25e4 * t, pearls: 5e3, kill: { xp: Math.round(need * 0.1), ep: 25e3 * t, pearls: 500 } };
}
function aevState(adm) {
  const tier = aevTier(adm.sea);
  if (!adm.aev || adm.aev.sea !== adm.sea) adm.aev = { sea: adm.sea, hp: AEV_HP[tier] || 0, max: AEV_HP[tier] || 0 };
  return adm.aev;
}
function aevHit(c, adm, dmg) {
  if (!aevOpen(adm.sea) || !(dmg > 0)) return null;
  const ev = aevState(adm), tier = aevTier(adm.sea), P = aevPools(tier);
  const d = Math.min(dmg, ev.max * 0.01, ev.hp);
  if (!(d > 0)) return null;
  ev.hp -= d;
  const share = d / ev.max;
  c.aevFrac ??= { xp: 0, ep: 0, pearls: 0 };
  const add = {};
  for (const k of ["xp", "ep", "pearls"]) {
    c.aevFrac[k] += P[k] * share;
    const n = Math.floor(c.aevFrac[k]);
    if (n > 0) {
      add[k] = n;
      c.aevFrac[k] -= n;
    }
  }
  let sunk = false;
  if (ev.hp <= 0) {
    sunk = true;
    for (const k of ["xp", "ep", "pearls"]) add[k] = (add[k] || 0) + P.kill[k];
    ev.hp = ev.max;
  }
  return { add, sunk, hp: Math.round(ev.hp), max: ev.max };
}
var DOM_TRIAL = process.env.DOM_TRIAL === "1";
var domQueue = [];
var domMatches = /* @__PURE__ */ new Map();
var domPending = null;
var domMatchOfSea = (sea2) => /^sea-dom-([a-z0-9]+)$/.exec(sea2 || "")?.[1];
var domOpen = (c, now) => domWindowAt(now).open || DOM_TRIAL || !!c?.admin;
var domNick = (c) => c.nick || "Kaptan";
var domInMatch = (c) => [...domMatches.values()].some((m) => !m.result && m.teams.has(c.uid));
function domLobby(c, now = Date.now()) {
  const p2 = domPending;
  return {
    k: "lobby",
    open: domOpen(c, now),
    q: domQueue.slice(0, DOM_SIZE * 2).map(domNick),
    me: domQueue.includes(c) || !!p2?.list.includes(c),
    teams: p2 ? { r: p2.r.map(domNick), b: p2.b.map(domNick) } : null,
    at: p2 ? p2.at : 0,
    live: domMatches.size
  };
}
function domBroadcast(now) {
  const to = new Set([...all].filter((x) => x.domWatch));
  for (const x of domQueue) to.add(x);
  for (const x of domPending?.list ?? []) to.add(x);
  for (const x of to) send(x, { t: "dom", d: domLobby(x, now) });
}
var DOM_LOCK_MS = 5e3;
var DOM_BASE_R = 400;
var DOM_LOCK_SLACK = 40;
var domLocked = (c, now) => !!c.domLock && now < c.domLock.until;
function domSink(c, now) {
  c.domLock = { until: now + DOM_LOCK_MS, pos: null, spawn: true };
}
function domMove(c, s, now) {
  if (!num(s?.x) || !num(s?.y)) return null;
  const base = DOM_BASE[c.domTeam];
  const spawn = !c.last || c.domLock?.spawn;
  if (spawn) {
    if (Math.hypot(s.x - base.x, s.y - base.y) > DOM_BASE_R) return { x: base.x, y: base.y };
    c.domLock = { until: c.domLock?.until ?? 0, pos: { x: s.x, y: s.y }, spawn: false };
    s.tp = 1;
    c.tpAt = 0;
    return null;
  }
  delete s.tp;
  if (domLocked(c, now) && c.domLock.pos && Math.hypot(s.x - c.domLock.pos.x, s.y - c.domLock.pos.y) > DOM_LOCK_SLACK) return c.domLock.pos;
  return null;
}
function domPump(now) {
  if (domPending || domQueue.length < DOM_SIZE * 2) return false;
  const list = domQueue.splice(0, DOM_SIZE * 2);
  const t = domBalance(list, (x) => Number(x.econ?.ep) || 0);
  domPending = { list, r: t.r, b: t.b, at: now + DOM_COUNTDOWN_MS };
  return true;
}
function domDrop(c) {
  const i = domQueue.indexOf(c);
  if (i >= 0) domQueue.splice(i, 1);
  if (domPending?.list.includes(c)) {
    domQueue.unshift(...domPending.list.filter((x) => x !== c && all.has(x)));
    domPending = null;
  }
}
function domStart(now, pend = domPending) {
  const id = import_node_crypto.default.randomUUID().replace(/-/g, "").slice(0, 10), teams = /* @__PURE__ */ new Map();
  for (const x of pend.r) teams.set(x.uid, "r");
  for (const x of pend.b) teams.set(x.uid, "b");
  const m = { id, teams, nicks: { r: pend.r.map(domNick), b: pend.b.map(domNick) }, score: { r: 0, b: 0 }, zone: { cap: 0, own: null }, start: now, end: now + DOM_MATCH_MS, spent: /* @__PURE__ */ new Map(), result: null };
  domMatches.set(id, m);
  if (pend === domPending) domPending = null;
  for (const x of pend.list) {
    x.domTeam = teams.get(x.uid);
    x.domLock = null;
    pvpReset(x);
    send(x, { t: "dom", d: { k: "start", id, team: x.domTeam, end: m.end, teams: m.nicks } });
  }
  log("HAK\u0130M\u0130YET BA\u015ELADI", id, m.nicks.r.join(","), "vs", m.nicks.b.join(","));
  return m;
}
function domStep(m, room, now) {
  let nr = 0, nb = 0;
  for (const x of room || []) {
    const tm = m.teams.get(x.uid);
    if (!tm || !x.last || x.state && !(x.state.hp > 0)) continue;
    if (Math.hypot(x.last.x - DOM_ZONE.x, x.last.y - DOM_ZONE.y) <= DOM_ZONE.r) {
      if (tm === "r") nr++;
      else nb++;
    }
  }
  const { contested } = domZoneStep(m.zone, nr, nb);
  if (m.zone.own && !contested) m.score[m.zone.own] = Math.min(DOM_WIN, m.score[m.zone.own] + 1);
  const done = m.score.r >= DOM_WIN || m.score.b >= DOM_WIN || now >= m.end;
  return { nr, nb, contested, done };
}
function domFinish(m, room) {
  m.result = { win: domWinner(m.score) };
  const out = [];
  for (const x of room || []) {
    const tm = m.teams.get(x.uid);
    if (!tm) continue;
    const add = domReward(tm, m.result.win, m.spent.get(x.uid) || 0);
    addCredit(x, { pearls: add.pearls, ep: add.ep });
    out.push([x, tm, add]);
  }
  for (const x of all) if (m.teams.has(x.uid)) x.domTeam = null;
  return out;
}
function domTick(now) {
  if (domPending) {
    if (domPending.list.some((x) => !all.has(x) || !x.uid)) {
      for (const x of domPending.list.filter((y) => !all.has(y))) domDrop(x);
      domBroadcast(now);
    } else if (now >= domPending.at) {
      domStart(now);
      domBroadcast(now);
    }
  }
  for (const [id, m] of domMatches) {
    const room = seas.get(`sea-dom-${id}`);
    if (m.result) {
      if (now - m.end > 6e4 || !room?.size) domMatches.delete(id);
      continue;
    }
    const r = domStep(m, room, now);
    const tick = JSON.stringify({ t: "dom", d: { k: "tick", s: [m.score.r, m.score.b], cap: m.zone.cap, own: m.zone.own, c: r.contested, n: [r.nr, r.nb], end: m.end } });
    for (const x of room || []) send(x, tick);
    if (r.done) {
      const paid = domFinish(m, room);
      m.end = now;
      log("HAK\u0130M\u0130YET B\u0130TT\u0130", id, m.score.r, m.score.b, m.result.win ?? "berabere");
      for (const [x, tm, add] of paid) {
        send(x, { t: "dom", d: { k: "end", win: m.result.win, s: [m.score.r, m.score.b], team: tm, pearls: add.pearls, ep: add.ep } });
        void flushCredit(x);
      }
    }
  }
}
function onDom(c, d, now) {
  const k = String(d?.k || "");
  if (k === "watch") {
    c.domWatch = !!d?.on;
    send(c, { t: "dom", d: domLobby(c, now) });
    return;
  }
  if (k === "q") {
    if (d?.on) {
      if (!domOpen(c, now)) {
        send(c, { t: "dom", d: { k: "err", msg: "Deniz Hakimiyeti \u015Fu an kapal\u0131" } });
        return;
      }
      if (domInMatch(c) || lsInMatch(c)) {
        send(c, { t: "dom", d: { k: "err", msg: "Zaten bir ma\xE7tas\u0131n" } });
        return;
      }
      lsDrop(c);
      if (!domQueue.includes(c) && !domPending?.list.includes(c)) domQueue.push(c);
      domPump(now);
    } else domDrop(c);
    domBroadcast(now);
    return;
  }
  if (k === "leave") {
    const id = domMatchOfSea(c.sea);
    const m = domMatches.get(id);
    if (m && !m.result) {
      m.teams.delete(c.uid);
      c.domTeam = null;
    }
    return;
  }
}
setInterval(() => domTick(Date.now()), 1e3).unref();
var LS_TRIAL = process.env.LS_TRIAL === "1";
var lsQueue = [];
var lsMatches = /* @__PURE__ */ new Map();
var lsPending = null;
var lsMatchOfSea = (sea2) => /^sea-ls-([a-z0-9]+)$/.exec(sea2 || "")?.[1];
var lsOpen = (c, now) => domWindowAt(now).open || LS_TRIAL || !!c?.admin;
var lsInMatch = (c) => [...lsMatches.values()].some((m) => !m.result && m.players.get(c.uid)?.alive);
function lsLobby(c, now = Date.now()) {
  const p2 = lsPending;
  return { k: "lobby", open: lsOpen(c, now), q: (p2 ? p2.list : lsQueue.slice(0, LS_SIZE)).map(domNick), me: lsQueue.includes(c) || !!p2?.list.includes(c), at: p2 ? p2.at : 0, live: lsMatches.size };
}
function lsBroadcast(now) {
  const to = new Set([...all].filter((x) => x.lsWatch));
  for (const x of lsQueue) to.add(x);
  for (const x of lsPending?.list ?? []) to.add(x);
  for (const x of to) send(x, { t: "ls", d: lsLobby(x, now) });
}
function lsPump(now) {
  if (lsPending || lsQueue.length < LS_SIZE) return false;
  lsPending = { list: lsQueue.splice(0, LS_SIZE), at: now + LS_COUNTDOWN_MS };
  return true;
}
function lsDrop(c) {
  const i = lsQueue.indexOf(c);
  if (i >= 0) lsQueue.splice(i, 1);
  if (lsPending?.list.includes(c)) {
    lsQueue.unshift(...lsPending.list.filter((x) => x !== c && all.has(x)));
    lsPending = null;
  }
}
var lsFogInfo = (m) => ({ from: m.fog.from, to: m.fog.to, at: m.fog.at, phase: m.fog.phase, now: Date.now() });
function lsStart(now, pend = lsPending, rand = Math.random) {
  const id = import_node_crypto.default.randomUUID().replace(/-/g, "").slice(0, 10), players = /* @__PURE__ */ new Map();
  const order = [...pend.list].sort(() => rand() - 0.5);
  order.forEach((x, i) => players.set(x.uid, { nick: domNick(x), alive: true, kills: 0, balls: 0, rank: 0, spawn: lsSpawn(i, order.length), inv: lsEmptyInv() }));
  const z = { x: 3e3, y: 2e3, r: LS_START_R };
  const m = { id, players, fog: { from: z, to: z, at: now, phase: 0 }, start: now, end: now + LS_MATCH_MS, result: null, items: [], seq: 0, itemAt: now, drops: [], dropNext: now + LS_DROP_FIRST_MS };
  lsMatches.set(id, m);
  for (let i = 0; i < LS_ITEM_MAX; i++) lsAddItem(m, now, rand);
  if (pend === lsPending) lsPending = null;
  for (const x of order) {
    const p2 = players.get(x.uid);
    x.lsOn = true;
    x.lsMatch = id;
    x.lsSpawned = false;
    x.maxHp = LS_HP;
    pvpReset(x);
    if (x.pvp) x.pvp.hp = LS_HP;
    else {
      x.pvp = { budget: null, heal: null, hp: LS_HP, at: now, from: /* @__PURE__ */ new Map() };
    }
    send(x, { t: "ls", d: { k: "start", id, spawn: p2.spawn, n: order.length, end: m.end, fog: lsFogInfo(m), items: m.items, drops: m.drops } });
  }
  log("LANETL\u0130 SULAR BA\u015ELADI", id, order.length);
  return m;
}
function lsMove(c, s) {
  const m = lsMatches.get(c.lsMatch), p2 = m?.players.get(c.uid);
  if (!p2 || !num(s?.x) || !num(s?.y)) return null;
  if (!c.lsSpawned) {
    if (Math.hypot(s.x - p2.spawn.x, s.y - p2.spawn.y) > 300) return p2.spawn;
    c.lsSpawned = true;
    s.tp = 1;
    c.tpAt = 0;
    return null;
  }
  delete s.tp;
  return null;
}
var lsAlive = (m) => [...m.players.values()].filter((p2) => p2.alive).length;
function lsOut(c, killer, now, left = false) {
  const m = lsMatches.get(c.lsMatch), p2 = m?.players.get(c.uid);
  if (!m || !p2?.alive || m.result) return null;
  p2.alive = false;
  p2.rank = lsAlive(m) + 1;
  c.lsOn = false;
  pvpReset(c);
  if (c.netId && lsMatchOfSea(c.sea) === m.id) toSea(c, { t: "leave", id: c.netId });
  const k = killer && killer !== c && killer.lsOn ? m.players.get(killer.uid) : null;
  if (k) k.kills++;
  const add = lsReward(p2.rank, p2.kills, p2.balls);
  if (!left) {
    addCredit(c, add);
    send(c, { t: "ls", d: { k: "out", rank: p2.rank, n: m.players.size, kills: p2.kills, ...add } });
    void flushCredit(c);
  }
  const room = seas.get(`sea-ls-${m.id}`);
  const msg = JSON.stringify({ t: "ls", d: { k: "alive", n: lsAlive(m), out: p2.nick, by: k?.nick ?? null } });
  for (const x of room || []) send(x, msg);
  if (lsAlive(m) <= 1) lsFinish(m, now, [...all, c, ...killer ? [killer] : []]);
  return { rank: p2.rank, add };
}
function lsFinish(m, now, clients = [...all]) {
  if (m.result) return;
  const alive = [...m.players].filter(([, p2]) => p2.alive).map(([uid, p2]) => ({ uid, p: p2, x: clients.find((y) => y.uid === uid && y.lsMatch === m.id) })).sort((a, b) => (b.x?.pvp?.hp ?? -1) - (a.x?.pvp?.hp ?? -1));
  alive.forEach(({ p: p2, x }, i) => {
    p2.alive = false;
    p2.rank = i + 1;
    if (!x) return;
    x.lsOn = false;
    const add = lsReward(p2.rank, p2.kills, p2.balls);
    addCredit(x, add);
    send(x, { t: "ls", d: { k: "out", rank: p2.rank, n: m.players.size, kills: p2.kills, win: p2.rank === 1, ...add } });
    void flushCredit(x);
  });
  for (const p2 of m.players.values()) p2.alive = false;
  m.result = { at: now };
  m.end = now;
  log("LANETL\u0130 SULAR B\u0130TT\u0130", m.id, alive[0]?.p.nick ?? "-");
}
var LS_AMMO = ["iron", "chain", "fire", "explosive"];
function lsAttack(c, t, now, d = {}) {
  const m = lsMatches.get(c.lsMatch), me = m?.players.get(c.uid), tp = m?.players.get(t.uid);
  if (!me?.alive || !tp?.alive) return null;
  const a = LS_AMMO.includes(String(d?.a)) ? String(d.a) : "iron";
  const why = shotCheck(c, LS_LOADOUT, a, Math.hypot(c.last.x - t.last.x, c.last.y - t.last.y), now, false);
  if (why) {
    if (why !== "dolum") suspect(c, "at\u0131\u015F", why);
    return null;
  }
  const cap = LS_LOADOUT.cannons, loaded = a === "iron" ? 0 : Math.min(cap, me.inv[a]);
  if (loaded) me.inv[a] -= loaded;
  const ammo = loaded ? a : "iron";
  const powder = !!d?.p && me.inv.powder > 0;
  if (powder) me.inv.powder--;
  me.balls += cap;
  let raw = salvoDamage(LS_LOADOUT, ammo, loaded, cap - loaded, powder, false) * targetFactor(ammo, "player");
  if (tp.inv.shield > 0) {
    tp.inv.shield--;
    raw *= CONSUMABLES.shield.factor;
    send(t, { t: "ls", d: { k: "inv", inv: tp.inv } });
  }
  if (loaded || powder) send(c, { t: "ls", d: { k: "inv", inv: me.inv } });
  const f = { from: c.netId, to: t.netId, x: Math.round(c.last.x), y: Math.round(c.last.y), tx: Math.round(t.last.x), ty: Math.round(t.last.y), ammo, damage: pvpGuard(t, raw, now) };
  pvpOf(t).from.set(c.netId, now);
  toNear(c, { t: "fire", d: f }, t.netId);
  if (godCheck(t)) {
    suspect(t, "\xF6l\xFCms\xFCz");
    send(t, { t: "forceSink", d: { by: c.netId, byNick: c.nick } });
    toSea(t, { t: "sunk", d: { victim: t.netId, victimNick: t.nick, by: c.netId, byNick: c.nick } });
    lsOut(t, c, now);
  }
  return f;
}
function lsAddItem(m, now, rand = Math.random) {
  const z = lsZoneAt(m.fog, now), r = Math.max(0, z.r * 0.85), a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * r;
  const x = Math.round(Math.max(120, Math.min(5880, z.x + Math.cos(a) * d))), y = Math.round(Math.max(120, Math.min(3880, z.y + Math.sin(a) * d)));
  m.items.push([++m.seq, lsPickKind(rand), x, y]);
}
function lsPick(c, id, now) {
  const m = lsMatches.get(c.lsMatch), p2 = m?.players.get(c.uid);
  if (!p2?.alive || !c.last) return { err: "yok" };
  const i = m.items.findIndex((x) => x[0] === Number(id));
  if (i < 0) return { err: "yok" };
  const it = m.items[i];
  if (Math.hypot(c.last.x - it[2], c.last.y - it[3]) > LS_PICK_R + 90) return { err: "uzak" };
  m.items.splice(i, 1);
  p2.inv[it[1]] += LS_ITEMS[it[1]].qty;
  return { kind: it[1], inv: p2.inv };
}
function lsDropPick(c, id, now) {
  const m = lsMatches.get(c.lsMatch), p2 = m?.players.get(c.uid);
  if (!p2?.alive || !c.last) return { err: "yok" };
  const i = m.drops.findIndex((x) => x.id === Number(id));
  if (i < 0) return { err: "yok" };
  const dr = m.drops[i];
  if (now < dr.land) return { err: "erken" };
  if (Math.hypot(c.last.x - dr.x, c.last.y - dr.y) > LS_DROP_PICK_R + 90) return { err: "uzak" };
  m.drops.splice(i, 1);
  for (const [k, v] of Object.entries(LS_DROP_LOOT)) p2.inv[k] += v;
  return { inv: p2.inv, nick: p2.nick };
}
function lsSpeed(c, now) {
  const p2 = lsMatches.get(c.lsMatch)?.players.get(c.uid);
  if (!p2?.alive || p2.inv.speed <= 0) return null;
  p2.inv.speed--;
  c.lsSpeedUntil = now + LS_SPEED_MS;
  return p2.inv;
}
function lsStep(m, room, now, rand = Math.random) {
  let changed = false;
  if (m.fog.phase < LS_RADII.length && now >= m.start + (m.fog.phase + 1) * LS_PHASE_MS) {
    const cur = lsZoneAt(m.fog, now);
    m.fog = { from: cur, to: lsNext(cur, LS_RADII[m.fog.phase], rand), at: now, phase: m.fog.phase + 1 };
    changed = true;
  }
  let drop = null;
  if (now >= m.dropNext) {
    m.dropNext += LS_DROP_EVERY_MS;
    const t = m.fog.to, r = Math.max(0, t.r * 0.7), a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * r;
    drop = { id: ++m.seq, x: Math.round(Math.max(150, Math.min(5850, t.x + Math.cos(a) * d))), y: Math.round(Math.max(150, Math.min(3850, t.y + Math.sin(a) * d))), land: now + LS_DROP_FALL_MS };
    m.drops.push(drop);
  }
  let items = false;
  if (now - m.itemAt >= LS_ITEM_RESPAWN_MS) {
    m.itemAt = now;
    if (m.items.length < LS_ITEM_MAX) {
      lsAddItem(m, now, rand);
      items = true;
    }
  }
  const z = lsZoneAt(m.fog, now), hits = [];
  for (const x of room || []) {
    if (!x.lsOn || x.lsMatch !== m.id || !x.last) continue;
    if (Math.hypot(x.last.x - z.x, x.last.y - z.y) <= z.r) continue;
    const dmg = Math.round(LS_HP * LS_FOG_DPS[Math.min(m.fog.phase, LS_FOG_DPS.length - 1)]);
    const p2 = pvpOf(x);
    if (p2.hp === null) p2.hp = LS_HP;
    p2.hp -= dmg;
    hits.push([x, dmg, p2.hp <= 0]);
  }
  return { changed, hits, items, drop };
}
function lsTick(now) {
  if (lsPending) {
    if (lsPending.list.some((x) => !all.has(x) || !x.uid)) {
      for (const x of lsPending.list.filter((y) => !all.has(y))) lsDrop(x);
      lsBroadcast(now);
    } else if (now >= lsPending.at) {
      lsStart(now);
      lsBroadcast(now);
    }
  }
  for (const [id, m] of lsMatches) {
    const room = seas.get(`sea-ls-${id}`);
    if (m.result) {
      if (now - m.end > 6e4 || !room?.size) lsMatches.delete(id);
      continue;
    }
    for (const [uid, p2] of m.players) {
      if (!p2.alive) continue;
      const x = [...all].find((y) => y.uid === uid);
      if (!x || now - m.start > 2e4 && x.sea !== `sea-ls-${id}`) {
        if (x) lsOut(x, null, now, true);
        else {
          p2.alive = false;
          p2.rank = lsAlive(m) + 1;
        }
      }
    }
    if (m.result) continue;
    if (lsAlive(m) <= 1) {
      lsFinish(m, now);
      continue;
    }
    const r = lsStep(m, room, now);
    if (r.drop) {
      const msg = JSON.stringify({ t: "ls", d: { k: "drops", drops: m.drops, fresh: r.drop.id } });
      for (const x of room || []) send(x, msg);
    }
    if (r.items) {
      const msg = JSON.stringify({ t: "ls", d: { k: "items", items: m.items } });
      for (const x of room || []) send(x, msg);
    }
    if (r.changed) {
      const msg = JSON.stringify({ t: "ls", d: { k: "fog", fog: lsFogInfo(m), n: lsAlive(m) } });
      for (const x of room || []) send(x, msg);
    }
    for (const [x, dmg, dead] of r.hits) {
      send(x, { t: "ls", d: { k: "burn", dmg } });
      if (dead) {
        send(x, { t: "forceSink", d: { by: "", byNick: "Lanetli Sis" } });
        toSea(x, { t: "sunk", d: { victim: x.netId, victimNick: x.nick, by: null, byNick: "Lanetli Sis" } });
        lsOut(x, null, now);
      }
    }
    if (now >= m.end) lsFinish(m, now);
  }
}
function onLs(c, d, now) {
  const k = String(d?.k || "");
  if (k === "watch") {
    c.lsWatch = !!d?.on;
    send(c, { t: "ls", d: lsLobby(c, now) });
    return;
  }
  if (k === "q") {
    if (d?.on) {
      if (!lsOpen(c, now)) {
        send(c, { t: "ls", d: { k: "err", msg: "Lanetli Sular \u015Fu an kapal\u0131" } });
        return;
      }
      if (lsInMatch(c) || domInMatch(c)) {
        send(c, { t: "ls", d: { k: "err", msg: "Zaten bir ma\xE7tas\u0131n" } });
        return;
      }
      domDrop(c);
      if (!lsQueue.includes(c) && !lsPending?.list.includes(c)) lsQueue.push(c);
      lsPump(now);
    } else lsDrop(c);
    lsBroadcast(now);
    return;
  }
  if (k === "leave") {
    if (c.lsOn) lsOut(c, null, now, true);
    return;
  }
  if (k === "pick") {
    const r = lsPick(c, d?.id, now);
    if (r.err) {
      if (r.err === "uzak") suspect(c, "uzak e\u015Fya");
      return;
    }
    send(c, { t: "ls", d: { k: "inv", inv: r.inv, got: r.kind } });
    const m = lsMatches.get(c.lsMatch);
    const msg = JSON.stringify({ t: "ls", d: { k: "items", items: m.items } });
    for (const x of seas.get(`sea-ls-${m.id}`) || []) send(x, msg);
    return;
  }
  if (k === "dpick") {
    const r = lsDropPick(c, d?.id, now);
    if (r.err) {
      if (r.err === "uzak") suspect(c, "uzak sand\u0131k");
      return;
    }
    send(c, { t: "ls", d: { k: "inv", inv: r.inv, drop: 1 } });
    const m = lsMatches.get(c.lsMatch);
    const msg = JSON.stringify({ t: "ls", d: { k: "drops", drops: m.drops, by: r.nick } });
    for (const x of seas.get(`sea-ls-${m.id}`) || []) send(x, msg);
    return;
  }
  if (k === "speed") {
    const inv = lsSpeed(c, now);
    if (inv) send(c, { t: "ls", d: { k: "inv", inv, speed: 1 } });
    return;
  }
}
setInterval(() => lsTick(Date.now()), 1e3).unref();
async function flushCredit(c) {
  if (c.flushing || !c.uid) return;
  c.flushing = true;
  try {
    if (!c.grant && c.credit) {
      c.grant = { id: import_node_crypto.default.randomUUID(), add: c.credit };
      c.credit = null;
      pendingCredits.set(c.grant.id, c);
    }
    if (!c.grant) return;
    const st = await dbRpcJson("economy_grant_once", { p_uid: c.uid, p_event: c.grant.id, p_add: c.grant.add });
    if (st && typeof st === "object") {
      c.econ = st;
      pendingCredits.delete(c.grant.id);
      c.grant = null;
      if (c.credit) {
        c.grant = { id: import_node_crypto.default.randomUUID(), add: c.credit };
        c.credit = null;
        pendingCredits.set(c.grant.id, c);
      }
    }
  } catch {
  } finally {
    c.flushing = false;
  }
}
setInterval(() => {
  for (const c of /* @__PURE__ */ new Set([...all, ...pendingCredits.values()])) if (c.credit || c.grant) void flushCredit(c);
}, 2e4).unref();
var httpServer = import_node_http.default.createServer(async (q, r) => {
  const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization", "content-type": "application/json" };
  if (q.method === "OPTIONS") {
    r.writeHead(204, cors);
    r.end();
    return;
  }
  if (q.method === "POST" && q.url?.startsWith("/shopier/osb")) {
    let body = "";
    q.on("data", (d) => {
      body += d;
      if (body.length > 1e5) q.destroy();
    });
    q.on("end", async () => {
      const ok = await handleOsb(body, q.headers["content-type"]).catch((e) => {
        log("SHOPIER hata", e?.message);
        return false;
      });
      r.writeHead(ok ? 200 : 400, { "content-type": "text/plain" });
      r.end(ok ? "success" : "fail");
    });
    return;
  }
  if (q.url?.startsWith("/flags")) {
    const token = String(q.headers.authorization || "").replace(/^Bearer /, "");
    if (!token || !await isAdminToken(token).catch(() => false)) {
      r.writeHead(403, cors);
      r.end('{"error":"yetki yok"}');
      return;
    }
    r.writeHead(200, cors);
    r.end(JSON.stringify([...flags].reverse().slice(0, 300)));
    return;
  }
  if (q.url?.startsWith("/stats")) {
    const token = String(q.headers.authorization || "").replace(/^Bearer /, "");
    if (!token || !await isAdminToken(token).catch(() => false)) {
      r.writeHead(403, cors);
      r.end('{"error":"yetki yok"}');
      return;
    }
    r.writeHead(200, cors);
    r.end(JSON.stringify({ online: [...all].filter((c) => c.uid).length, seas: Object.fromEntries([...seas].map(([k, v]) => [k, v.size])), uptime: Math.round((Date.now() - started) / 1e3) }));
    return;
  }
  r.writeHead(200, cors);
  r.end(JSON.stringify({ ok: true, name: "Pirate Rage oyun sunucusu" }));
});
var wss = new import_websocket_server.default({ server: httpServer, path: "/ws", maxPayload: 16 * 1024, perMessageDeflate: { threshold: 256, zlibDeflateOptions: { level: 3 }, serverNoContextTakeover: false, clientNoContextTakeover: true } });
wss.on("connection", (ws) => {
  const c = { ws, uid: "", nick: "", playerNo: 0, netId: "", sea: "", last: null, strikes: 0, rState: new Rate(LIMITS.statesPerSec, 1e3), rFire: new Rate(LIMITS.firesPerSec, 1e3), rChat: new Rate(LIMITS.chatPerMin, 6e4), rMsg: new Rate(60, 1e3), rBoss: new Rate(5, 1e3), rKill: new Rate(3, 1e3), rSalvo: new Rate(3, 1e3), rUse: new Rate(12, 1e3), rTower: new Rate(12, 1e3) };
  all.add(c);
  const authTimer = setTimeout(() => {
    if (!c.uid) ws.close(4001, "giri\u015F yok");
  }, 1e4);
  const handleMessage = async (raw) => {
    const now = Date.now();
    let m;
    try {
      m = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (!m || typeof m.t !== "string") return;
    if (m.t === "auth") {
      if (c.uid) return;
      const who = await verifyToken(String(m.token || "")).catch(() => null);
      if (!who) {
        ws.close(4001, "giri\u015F ge\xE7ersiz");
        return;
      }
      if (who.banned) {
        ws.close(4002, "hesap kapal\u0131");
        return;
      }
      for (const x of all) if (x.uid === who.uid && x !== c) x.ws.close(4004, "ba\u015Fka yerden ba\u011Flan\u0131ld\u0131");
      Object.assign(c, who);
      c.admin = await isAdminToken(String(m.token || "")).catch(() => false);
      c.netId = String(m.netId || "").slice(0, 16) || Math.random().toString(36).slice(2, 10);
      clearTimeout(authTimer);
      await loadEcon(c);
      if (!c.econ) {
        ws.close(4003, "hesap verisi y\xFCklenemedi");
        return;
      }
      send(c, { t: "hello", id: c.netId, nick: c.nick, playerNo: c.playerNo });
      log("G\u0130R\u0130\u015E", `#${c.playerNo}`, c.nick);
      if (!qkByUid.has(c.uid)) qkByUid.set(c.uid, {});
      c.qk = qkByUid.get(c.uid);
      {
        const t = treasures.get(c.uid);
        if (t) send(c, { t: "tstate", d: { parts: t.parts, spot: t.spot } });
      }
      return;
    }
    if (!c.uid || !c.econ) return;
    switch (m.t) {
      case "join": {
        const name = String(m.sea || "").slice(0, 40);
        if (name === c.sea) return;
        if (!canJoin(c, name, now)) {
          send(c, { t: "denied", reason: "harita kilitli" });
          return;
        }
        leaveSea(c);
        c.last = null;
        if (!name) return;
        const room = seas.get(name) ?? /* @__PURE__ */ new Set();
        if (room.size >= LIMITS.maxPerSea) {
          send(c, { t: "full" });
          return;
        }
        room.add(c);
        seas.set(name, room);
        c.sea = name;
        c.seen = null;
        send(c, { t: "joined", sea: name });
        if (seaMap(name)) {
          const fresh = npcFill(name, now);
          const st = seaNpcs.get(name);
          send(c, { t: "nlist", d: [...st?.list.values() ?? []].map(npcInfo) });
          if (fresh.length) {
            const m2 = JSON.stringify({ t: "nlist", d: [...st.list.values()].map(npcInfo) });
            for (const x of room) if (x !== c) send(x, m2);
          }
        }
        {
          const l = lootFor(c);
          if (l) send(c, { t: "loot", d: lootInfo(l) });
        }
        const b = bossSeas.get(name)?.boss;
        if (b) send(c, { t: "boss", d: bossInfo(name, b) });
        const isle = islands.get(islandOfSea(name));
        if (isle) send(c, { t: "isle", d: islandInfo(isle) });
        if (name === SIEGE_ROOM) {
          const r = siegeJoin(c.uid, c.nick, now);
          if (r) send(c, { t: "sstate", d: siegeInfo(r, c.uid) });
        }
        return;
      }
      case "state": {
        if (!c.sea || !c.rState.hit(now)) return;
        const s = m.d;
        if (c.domTeam && domMatchOfSea(c.sea) !== void 0) {
          const r = domMove(c, s, now);
          if (r) {
            send(c, { t: "pos", d: r });
            return;
          }
        }
        if (!c.lsOn && lsMatchOfSea(c.sea) !== void 0) return;
        if (c.lsOn) {
          const r = lsMove(c, s);
          if (r) {
            send(c, { t: "pos", d: r });
            return;
          }
          s.maxHp = LS_HP;
        }
        let v = checkState(c.last, s, now);
        if (v === "bad") return;
        if (v === "speed" && s.tp && now - (c.tpAt || 0) > 8e3) {
          c.tpAt = now;
          v = "ok";
        }
        delete s.tp;
        if (v === "bad") return;
        if (v === "speed") {
          suspect(c, "h\u0131z", `${Math.round(s.x)},${Math.round(s.y)}`);
          if (c.last) send(c, { t: "pos", d: { x: c.last.x, y: c.last.y } });
          return;
        }
        {
          const land = onLand(seaMap(c.sea), s.x, s.y);
          if (land) {
            c.landHits = (c.landHits || 0) + 1;
            if (c.landHits % 10 === 1) suspect(c, "karaya \xE7\u0131kma", land);
            if (c.last) send(c, { t: "pos", d: { x: c.last.x, y: c.last.y } });
            return;
          }
        }
        if (c.lsOn) c.maxHp = LS_HP;
        else if (num(s.maxHp)) {
          const cap = hpCap(c.econ);
          if (s.maxHp > cap * 1.02) {
            suspect(c, "can s\u0131n\u0131r\u0131", `${Math.round(s.maxHp)}>${cap}`);
            s.maxHp = cap;
          }
          c.maxHp = s.maxHp;
        }
        if (c.maxHp && s.hp > c.maxHp) s.hp = c.maxHp;
        noteHp(c, s.hp, now);
        if (s.ship !== void 0) s.ship = shipAllowed(c.econ, s.ship);
        if (c.admin) {
          s.adm = 1;
          s.ship = ADMIN_SHIP;
          if (aevOpen(c.sea)) {
            const ev = aevState(c);
            s.hp = Math.round(ev.hp);
            s.maxHp = ev.max;
            if (now - (c.ahpAt || 0) > 1e3) {
              c.ahpAt = now;
              send(c, { t: "ahp", d: { hp: s.hp, max: ev.max } });
            }
          }
        }
        if (c.lsOn) {
          const ph = c.pvp?.hp;
          if (num(s.hp) && ph != null) s.hp = Math.max(0, Math.min(s.hp, Math.round(ph)));
          s.ship = "ls";
          delete s.adm;
          delete s.tag;
        }
        if (c.domTeam && domMatchOfSea(c.sea) !== void 0) {
          const ph = c.pvp?.hp;
          if (num(s.hp) && ph != null) s.hp = Math.max(0, Math.min(s.hp, Math.round(ph)));
          s.ship = "dom-" + c.domTeam;
          s.tm = c.domTeam;
          delete s.adm;
        } else delete s.tm;
        c.last = { x: s.x, y: s.y, at: now };
        s.id = c.netId;
        queueState(c, s);
        return;
      }
      case "fire":
        return;
      // oyuncular arası atış yalnız sunucu atışıyla (atk); oyuncunun bildirdiği hasar kabul edilmez
      case "sunk": {
        if (!c.sea) return;
        const s = m.d || {};
        s.victim = c.netId;
        s.victimNick = c.nick;
        if (s.by && !(now - (c.pvp?.from.get(String(s.by)) ?? -1e12) < 6e4)) {
          suspect(c, "sahte bat\u0131rma", String(s.by));
          s.by = null;
          s.byNick = null;
        }
        if (s.by && domMatchOfSea(c.sea) === void 0) {
          const k = [...seas.get(c.sea) || []].find((x) => x.netId === String(s.by));
          const add = spCredit(k, c.uid, now);
          if (add) addCredit(k, add);
        }
        if (c.domTeam) domSink(c, now);
        if (c.lsOn) {
          lsOut(c, s.by ? [...seas.get(c.sea) || []].find((x) => x.netId === String(s.by)) : null, now);
          toSea(c, { t: "sunk", d: s });
          return;
        }
        pvpReset(c);
        toSea(c, { t: "sunk", d: s });
        return;
      }
      case "bkill":
        return;
      // Only accepted nkill events advance the boss counter.
      case "bhit":
        return;
      // oyuncunun bildirdiği hasar kabul edilmez (sunucu atışı ve mayın)
      case "shit":
        return;
      // oyuncunun bildirdiği hasar kabul edilmez (sunucu atışı ve mayın)
      case "ld": {
        const d = { ...m.d && typeof m.d === "object" ? m.d : {}, hero: (heroUntil.get(c.uid) ?? 0) > now };
        c.ld = buildLoadout(c.econ, d);
        c.ldRaw = d;
        return;
      }
      case "atk": {
        if (!c.sea || !c.rSalvo.hit(now)) return;
        await onAttack(c, m.d, now);
        return;
      }
      case "nhit":
        return;
      // oyuncunun bildirdiği hasar kabul edilmez (sunucu atışı ve mayın)
      case "nkill":
        return;
      // NPC batırmasını sunucu kendisi sayar (npcDeath); oyuncunun bildirdiği batırma kabul edilmez
      case "salvo": {
        if (c.lsOn) return;
        if (!c.rSalvo.hit(now)) {
          suspect(c, "salvo h\u0131z\u0131");
          return;
        }
        await applyUsage(c, m.d, null, now);
        return;
      }
      case "use": {
        if (c.lsOn || !c.rUse.hit(now)) return;
        const id = String(m.d?.id || ""), before = c.econ;
        await applyUsage(c, null, id, now);
        if (id === "mine" && (c.econ !== before || !SERVER_SECRET || process.env.BENCH_AUTH === "1" && c.uid.startsWith("b"))) {
          const mn = placeMine(c, Number(m.d?.x), Number(m.d?.y), now);
          if (mn) toSea(c, { t: "mine", d: { id: mn.id, x: mn.x, y: mn.y, by: c.netId } });
        }
        return;
      }
      case "qdone": {
        if (!c.uid || !c.rKill.hit(now)) return;
        const id = String(m.d?.id || "");
        const r = questCredit(c, id, now);
        if (r.err) {
          if (r.err === "bekleme") suspect(c, "g\xF6rev bekleme", id);
          send(c, { t: "qres", d: { id, ok: false, err: r.err } });
          return;
        }
        addCredit(c, r.add);
        send(c, { t: "qres", d: { id, ok: true } });
        return;
      }
      case "spk": {
        if (!c.sea || !c.rUse.hit(now)) return;
        {
          const t = lootTake(c, "sp", m.d?.id);
          if (t.err) {
            if (t.err === "uzak") suspect(c, "uzak p\u0131r\u0131lt\u0131");
            return;
          }
          send(c, { t: "loot", d: lootInfo(c.loot) });
        }
        const r = sparklePicked(c, now);
        if (r.err) {
          if (r.err === "h\u0131z") suspect(c, "p\u0131r\u0131lt\u0131 h\u0131z\u0131");
          return;
        }
        const sr = sparkleReward(c);
        addCredit(c, sr.add);
        send(c, { t: "spkr", d: sr.out });
        return;
      }
      case "chest": {
        if (!c.sea || !c.rKill.hit(now)) return;
        {
          const t = lootTake(c, "ch", m.d?.id);
          if (t.err) {
            if (t.err === "uzak") suspect(c, "uzak sand\u0131k");
            return;
          }
          send(c, { t: "loot", d: lootInfo(c.loot) });
        }
        const r = chestPicked(c, now);
        if (r.err) {
          if (r.err === "h\u0131z") suspect(c, "sand\u0131k h\u0131z\u0131");
          return;
        }
        {
          const cr = chestReward(c, m.d?.g);
          addCredit(c, cr.add);
          send(c, { t: "chestr", d: cr.out });
        }
        if (r.found) send(c, { t: "tstate", d: { parts: r.parts, spot: treOf(c.uid).spot, part: true } });
        return;
      }
      case "tdig": {
        if (!c.sea || !c.rKill.hit(now)) return;
        const r = treasureDig(c);
        if (r.err) {
          send(c, { t: "tdig", d: { ok: false, err: r.err } });
          return;
        }
        addCredit(c, r.add);
        send(c, { t: "tdig", d: { ok: true, reward: r.reward } });
        return;
      }
      case "spy": {
        if (!c.rKill.hit(now)) return;
        await onSpy(c, m.d?.nick);
        return;
      }
      case "thit":
        return;
      // kule hasarı ve tamiri yalnız sunucu atışıyla
      // Kule dikildi (veritabanında): önce canlar yazılır, sonra ada yeniden okunup denize gönderilir
      case "tbuilt": {
        const key = String(m.d?.key || "");
        const i = islands.get(key);
        if (!i || !c.rKill.hit(now)) return;
        await saveIslandHp({ ...i, hpDirty: true });
        const n = await loadIsland(key).catch(() => null);
        if (n) sendRoom(key, { t: "isle", d: islandInfo(n) });
        return;
      }
      // Filoya girme/çıkma sonrası filo bilgisi yenilenir
      case "gref": {
        if (!c.rKill.hit(now)) return;
        c.guildId = await guildOf(c.uid).catch(() => c.guildId);
        return;
      }
      case "dom": {
        if (!c.rUse.hit(now)) return;
        onDom(c, m.d, now);
        return;
      }
      case "ls": {
        if (!c.rUse.hit(now)) return;
        onLs(c, m.d, now);
        return;
      }
      case "chat": {
        if (!c.rChat.hit(now)) return;
        const text = String(m.d?.text || "").slice(0, LIMITS.chatLen).trim();
        if (!text) return;
        toAll(c, { t: "chat", d: { nick: c.nick, tag: m.d?.tag ?? null, text, at: now, ...c.admin ? { adm: true } : {} } });
        return;
      }
      case "bid": {
        const b = m.d || {};
        b.id = c.uid;
        b.nick = c.nick;
        toAll(c, { t: "bid", d: b });
        return;
      }
      case "known":
      case "ask": {
        toAll(c, { t: m.t, d: m.d });
        return;
      }
    }
  };
  let queue = Promise.resolve(), pending = 0;
  ws.on("message", (raw) => {
    if (!c.rMsg.hit(Date.now()) || pending >= 64) {
      suspect(c, "mesaj seli");
      return;
    }
    pending++;
    queue = queue.then(() => {
      if (ws.readyState === 1) return handleMessage(raw);
    }).catch((e) => {
      log("PAKET reddedildi", c.playerNo, e?.name || "hata");
    }).finally(() => {
      pending--;
    });
  });
  ws.on("close", () => {
    clearTimeout(authTimer);
    clearTimeout(c.econTimer);
    void flushCredit(c);
    if (c.uid && c.last && seaMap(c.sea)) void dbRpc("spy_seen", { p_uid: c.uid, p_map: seaMap(c.sea), p_x: Math.round(c.last.x), p_y: Math.round(c.last.y) }).catch(() => {
    });
    leaveSea(c);
    all.delete(c);
    domDrop(c);
    lsDrop(c);
    if (c.uid) log("\xC7IKI\u015E", `#${c.playerNo}`, c.nick);
  });
  ws.on("error", () => {
  });
});
setInterval(() => {
  for (const c of all) {
    if (c.ws.isAlive === false) {
      c.ws.terminate();
      continue;
    }
    c.ws.isAlive = false;
    try {
      c.ws.ping();
    } catch {
    }
  }
}, 3e4).unref();
wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });
});
if (process.env.NODE_ENV !== "test") void loadIslands();
if (process.env.NODE_ENV !== "test") httpServer.listen(PORT, "127.0.0.1", () => log(`Oyun sunucusu ${PORT} portunda`));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ADMIN_SHIP,
  AEV_HP,
  BOSS_HIT_CAP,
  BOSS_LIFE_MS,
  COMBAT_HEAL_SECONDS,
  COMBAT_MS,
  DOM_BASE_R,
  DOM_LOCK_MS,
  DOM_LOCK_SLACK,
  FAR_EVERY,
  GOD_MARGIN,
  HEAL_SECONDS,
  HP_BONUS_MAX,
  ISLAND_KEYS,
  LIMITS,
  LOOT,
  LS_AMMO,
  NEAR,
  NPC_DMG_MODEL,
  NPC_FIRE_RANGE,
  NPC_KILL_SHARE,
  NPC_LEASH,
  NPC_RANGE,
  NPC_RESPAWN_MS,
  NPC_SPAWN_GRACE,
  PVP_RANGE,
  RUIN_MS,
  Rate,
  SHORE_SLACK,
  SIEGE_HIT_CAP,
  SIEGE_PIECES,
  SIEGE_ROOM,
  TICK_MS,
  TOWER_HEAL_CAP,
  TOWER_HIT_CAP,
  TOWER_SLOTS,
  USE_COOLDOWN,
  addCredit,
  aevHit,
  aevOpen,
  aevPools,
  aevState,
  aevTier,
  attackTarget,
  bossCredit,
  bossHit,
  bossInfo,
  bossKill,
  bossPool,
  bossSeas,
  buildBatch,
  buildLoadout,
  canJoin,
  cannonsOf,
  checkFire,
  checkState,
  chestPicked,
  chestReward,
  domDrop,
  domFinish,
  domLobby,
  domLocked,
  domMatchOfSea,
  domMatches,
  domMove,
  domOpen,
  domPending,
  domPump,
  domQueue,
  domSink,
  domStart,
  domStep,
  dpsCap,
  dpsTake,
  flushCredit,
  godCheck,
  guildOf,
  heroUntil,
  hpCap,
  isAdminToken,
  islandFromRow,
  islandInfo,
  islands,
  killCredit,
  loadIslands,
  lootFor,
  lootInfo,
  lootTake,
  lootTick,
  lsAddItem,
  lsAttack,
  lsDrop,
  lsDropPick,
  lsFinish,
  lsLobby,
  lsMatchOfSea,
  lsMatches,
  lsMove,
  lsOpen,
  lsOut,
  lsPending,
  lsPick,
  lsPump,
  lsQueue,
  lsSpeed,
  lsStart,
  lsStep,
  noteHp,
  noteSalvo,
  noteUse,
  npcApply,
  npcDeathCredit,
  npcFill,
  npcFire,
  npcHit,
  npcInfo,
  npcMove,
  npcSpawn,
  onLand,
  osbMatch,
  parseForm,
  parseOsb,
  pendingCredits,
  perBall,
  pickSpot,
  placeMine,
  pvpGuard,
  pvpHeal,
  pvpReset,
  questCooldowns,
  questCredit,
  resetSiege,
  saveServerState,
  sbTake,
  seaMap,
  seaMines,
  seaNpcs,
  seaTier,
  shipAllowed,
  shotCheck,
  siegeCredit,
  siegeHitPiece,
  siegeInfo,
  siegeJoin,
  siegeRun,
  siegeWindowAt,
  spByUid,
  spCredit,
  sparklePicked,
  sparkleReward,
  towerHit,
  treasureDig,
  treasures,
  verifyOsb,
  verifyToken
});

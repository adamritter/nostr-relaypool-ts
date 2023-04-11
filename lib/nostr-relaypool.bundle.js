"use strict";
var NostrRelayPool = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod2) => function __require() {
    return mod2 || (0, cb[__getOwnPropNames(cb)[0]])((mod2 = { exports: {} }).exports, mod2), mod2.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod2, isNodeMode, target) => (target = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(
    isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target, "default", { value: mod2, enumerable: true }) : target,
    mod2
  ));
  var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);

  // <define:process>
  var init_define_process = __esm({
    "<define:process>"() {
    }
  });

  // node_modules/safe-stable-stringify/index.js
  var require_safe_stable_stringify = __commonJS({
    "node_modules/safe-stable-stringify/index.js"(exports, module2) {
      "use strict";
      init_define_process();
      var { hasOwnProperty } = Object.prototype;
      var stringify2 = configure2();
      stringify2.configure = configure2;
      stringify2.stringify = stringify2;
      stringify2.default = stringify2;
      exports.stringify = stringify2;
      exports.configure = configure2;
      module2.exports = stringify2;
      var strEscapeSequencesRegExp = /[\u0000-\u001f\u0022\u005c\ud800-\udfff]|[\ud800-\udbff](?![\udc00-\udfff])|(?:[^\ud800-\udbff]|^)[\udc00-\udfff]/;
      var strEscapeSequencesReplacer = new RegExp(strEscapeSequencesRegExp, "g");
      var meta = [
        "\\u0000",
        "\\u0001",
        "\\u0002",
        "\\u0003",
        "\\u0004",
        "\\u0005",
        "\\u0006",
        "\\u0007",
        "\\b",
        "\\t",
        "\\n",
        "\\u000b",
        "\\f",
        "\\r",
        "\\u000e",
        "\\u000f",
        "\\u0010",
        "\\u0011",
        "\\u0012",
        "\\u0013",
        "\\u0014",
        "\\u0015",
        "\\u0016",
        "\\u0017",
        "\\u0018",
        "\\u0019",
        "\\u001a",
        "\\u001b",
        "\\u001c",
        "\\u001d",
        "\\u001e",
        "\\u001f",
        "",
        "",
        '\\"',
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "\\\\"
      ];
      function escapeFn(str) {
        if (str.length === 2) {
          const charCode2 = str.charCodeAt(1);
          return `${str[0]}\\u${charCode2.toString(16)}`;
        }
        const charCode = str.charCodeAt(0);
        return meta.length > charCode ? meta[charCode] : `\\u${charCode.toString(16)}`;
      }
      function strEscape(str) {
        if (str.length < 5e3 && !strEscapeSequencesRegExp.test(str)) {
          return str;
        }
        if (str.length > 100) {
          return str.replace(strEscapeSequencesReplacer, escapeFn);
        }
        let result = "";
        let last = 0;
        for (let i = 0; i < str.length; i++) {
          const point = str.charCodeAt(i);
          if (point === 34 || point === 92 || point < 32) {
            result += `${str.slice(last, i)}${meta[point]}`;
            last = i + 1;
          } else if (point >= 55296 && point <= 57343) {
            if (point <= 56319 && i + 1 < str.length) {
              const nextPoint = str.charCodeAt(i + 1);
              if (nextPoint >= 56320 && nextPoint <= 57343) {
                i++;
                continue;
              }
            }
            result += `${str.slice(last, i)}\\u${point.toString(16)}`;
            last = i + 1;
          }
        }
        result += str.slice(last);
        return result;
      }
      function insertSort(array) {
        if (array.length > 200) {
          return array.sort();
        }
        for (let i = 1; i < array.length; i++) {
          const currentValue = array[i];
          let position = i;
          while (position !== 0 && array[position - 1] > currentValue) {
            array[position] = array[position - 1];
            position--;
          }
          array[position] = currentValue;
        }
        return array;
      }
      var typedArrayPrototypeGetSymbolToStringTag = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(
          Object.getPrototypeOf(
            new Int8Array()
          )
        ),
        Symbol.toStringTag
      ).get;
      function isTypedArrayWithEntries(value) {
        return typedArrayPrototypeGetSymbolToStringTag.call(value) !== void 0 && value.length !== 0;
      }
      function stringifyTypedArray(array, separator, maximumBreadth) {
        if (array.length < maximumBreadth) {
          maximumBreadth = array.length;
        }
        const whitespace = separator === "," ? "" : " ";
        let res = `"0":${whitespace}${array[0]}`;
        for (let i = 1; i < maximumBreadth; i++) {
          res += `${separator}"${i}":${whitespace}${array[i]}`;
        }
        return res;
      }
      function getCircularValueOption(options) {
        if (hasOwnProperty.call(options, "circularValue")) {
          const circularValue = options.circularValue;
          if (typeof circularValue === "string") {
            return `"${circularValue}"`;
          }
          if (circularValue == null) {
            return circularValue;
          }
          if (circularValue === Error || circularValue === TypeError) {
            return {
              toString() {
                throw new TypeError("Converting circular structure to JSON");
              }
            };
          }
          throw new TypeError('The "circularValue" argument must be of type string or the value null or undefined');
        }
        return '"[Circular]"';
      }
      function getBooleanOption(options, key) {
        let value;
        if (hasOwnProperty.call(options, key)) {
          value = options[key];
          if (typeof value !== "boolean") {
            throw new TypeError(`The "${key}" argument must be of type boolean`);
          }
        }
        return value === void 0 ? true : value;
      }
      function getPositiveIntegerOption(options, key) {
        let value;
        if (hasOwnProperty.call(options, key)) {
          value = options[key];
          if (typeof value !== "number") {
            throw new TypeError(`The "${key}" argument must be of type number`);
          }
          if (!Number.isInteger(value)) {
            throw new TypeError(`The "${key}" argument must be an integer`);
          }
          if (value < 1) {
            throw new RangeError(`The "${key}" argument must be >= 1`);
          }
        }
        return value === void 0 ? Infinity : value;
      }
      function getItemCount(number2) {
        if (number2 === 1) {
          return "1 item";
        }
        return `${number2} items`;
      }
      function getUniqueReplacerSet(replacerArray) {
        const replacerSet = /* @__PURE__ */ new Set();
        for (const value of replacerArray) {
          if (typeof value === "string" || typeof value === "number") {
            replacerSet.add(String(value));
          }
        }
        return replacerSet;
      }
      function getStrictOption(options) {
        if (hasOwnProperty.call(options, "strict")) {
          const value = options.strict;
          if (typeof value !== "boolean") {
            throw new TypeError('The "strict" argument must be of type boolean');
          }
          if (value) {
            return (value2) => {
              let message = `Object can not safely be stringified. Received type ${typeof value2}`;
              if (typeof value2 !== "function")
                message += ` (${value2.toString()})`;
              throw new Error(message);
            };
          }
        }
      }
      function configure2(options) {
        options = { ...options };
        const fail = getStrictOption(options);
        if (fail) {
          if (options.bigint === void 0) {
            options.bigint = false;
          }
          if (!("circularValue" in options)) {
            options.circularValue = Error;
          }
        }
        const circularValue = getCircularValueOption(options);
        const bigint = getBooleanOption(options, "bigint");
        const deterministic = getBooleanOption(options, "deterministic");
        const maximumDepth = getPositiveIntegerOption(options, "maximumDepth");
        const maximumBreadth = getPositiveIntegerOption(options, "maximumBreadth");
        function stringifyFnReplacer(key, parent, stack, replacer, spacer, indentation) {
          let value = parent[key];
          if (typeof value === "object" && value !== null && typeof value.toJSON === "function") {
            value = value.toJSON(key);
          }
          value = replacer.call(parent, key, value);
          switch (typeof value) {
            case "string":
              return `"${strEscape(value)}"`;
            case "object": {
              if (value === null) {
                return "null";
              }
              if (stack.indexOf(value) !== -1) {
                return circularValue;
              }
              let res = "";
              let join2 = ",";
              const originalIndentation = indentation;
              if (Array.isArray(value)) {
                if (value.length === 0) {
                  return "[]";
                }
                if (maximumDepth < stack.length + 1) {
                  return '"[Array]"';
                }
                stack.push(value);
                if (spacer !== "") {
                  indentation += spacer;
                  res += `
${indentation}`;
                  join2 = `,
${indentation}`;
                }
                const maximumValuesToStringify = Math.min(value.length, maximumBreadth);
                let i = 0;
                for (; i < maximumValuesToStringify - 1; i++) {
                  const tmp2 = stringifyFnReplacer(i, value, stack, replacer, spacer, indentation);
                  res += tmp2 !== void 0 ? tmp2 : "null";
                  res += join2;
                }
                const tmp = stringifyFnReplacer(i, value, stack, replacer, spacer, indentation);
                res += tmp !== void 0 ? tmp : "null";
                if (value.length - 1 > maximumBreadth) {
                  const removedKeys = value.length - maximumBreadth - 1;
                  res += `${join2}"... ${getItemCount(removedKeys)} not stringified"`;
                }
                if (spacer !== "") {
                  res += `
${originalIndentation}`;
                }
                stack.pop();
                return `[${res}]`;
              }
              let keys = Object.keys(value);
              const keyLength = keys.length;
              if (keyLength === 0) {
                return "{}";
              }
              if (maximumDepth < stack.length + 1) {
                return '"[Object]"';
              }
              let whitespace = "";
              let separator = "";
              if (spacer !== "") {
                indentation += spacer;
                join2 = `,
${indentation}`;
                whitespace = " ";
              }
              let maximumPropertiesToStringify = Math.min(keyLength, maximumBreadth);
              if (isTypedArrayWithEntries(value)) {
                res += stringifyTypedArray(value, join2, maximumBreadth);
                keys = keys.slice(value.length);
                maximumPropertiesToStringify -= value.length;
                separator = join2;
              }
              if (deterministic) {
                keys = insertSort(keys);
              }
              stack.push(value);
              for (let i = 0; i < maximumPropertiesToStringify; i++) {
                const key2 = keys[i];
                const tmp = stringifyFnReplacer(key2, value, stack, replacer, spacer, indentation);
                if (tmp !== void 0) {
                  res += `${separator}"${strEscape(key2)}":${whitespace}${tmp}`;
                  separator = join2;
                }
              }
              if (keyLength > maximumBreadth) {
                const removedKeys = keyLength - maximumBreadth;
                res += `${separator}"...":${whitespace}"${getItemCount(removedKeys)} not stringified"`;
                separator = join2;
              }
              if (spacer !== "" && separator.length > 1) {
                res = `
${indentation}${res}
${originalIndentation}`;
              }
              stack.pop();
              return `{${res}}`;
            }
            case "number":
              return isFinite(value) ? String(value) : fail ? fail(value) : "null";
            case "boolean":
              return value === true ? "true" : "false";
            case "undefined":
              return void 0;
            case "bigint":
              if (bigint) {
                return String(value);
              }
            default:
              return fail ? fail(value) : void 0;
          }
        }
        function stringifyArrayReplacer(key, value, stack, replacer, spacer, indentation) {
          if (typeof value === "object" && value !== null && typeof value.toJSON === "function") {
            value = value.toJSON(key);
          }
          switch (typeof value) {
            case "string":
              return `"${strEscape(value)}"`;
            case "object": {
              if (value === null) {
                return "null";
              }
              if (stack.indexOf(value) !== -1) {
                return circularValue;
              }
              const originalIndentation = indentation;
              let res = "";
              let join2 = ",";
              if (Array.isArray(value)) {
                if (value.length === 0) {
                  return "[]";
                }
                if (maximumDepth < stack.length + 1) {
                  return '"[Array]"';
                }
                stack.push(value);
                if (spacer !== "") {
                  indentation += spacer;
                  res += `
${indentation}`;
                  join2 = `,
${indentation}`;
                }
                const maximumValuesToStringify = Math.min(value.length, maximumBreadth);
                let i = 0;
                for (; i < maximumValuesToStringify - 1; i++) {
                  const tmp2 = stringifyArrayReplacer(i, value[i], stack, replacer, spacer, indentation);
                  res += tmp2 !== void 0 ? tmp2 : "null";
                  res += join2;
                }
                const tmp = stringifyArrayReplacer(i, value[i], stack, replacer, spacer, indentation);
                res += tmp !== void 0 ? tmp : "null";
                if (value.length - 1 > maximumBreadth) {
                  const removedKeys = value.length - maximumBreadth - 1;
                  res += `${join2}"... ${getItemCount(removedKeys)} not stringified"`;
                }
                if (spacer !== "") {
                  res += `
${originalIndentation}`;
                }
                stack.pop();
                return `[${res}]`;
              }
              stack.push(value);
              let whitespace = "";
              if (spacer !== "") {
                indentation += spacer;
                join2 = `,
${indentation}`;
                whitespace = " ";
              }
              let separator = "";
              for (const key2 of replacer) {
                const tmp = stringifyArrayReplacer(key2, value[key2], stack, replacer, spacer, indentation);
                if (tmp !== void 0) {
                  res += `${separator}"${strEscape(key2)}":${whitespace}${tmp}`;
                  separator = join2;
                }
              }
              if (spacer !== "" && separator.length > 1) {
                res = `
${indentation}${res}
${originalIndentation}`;
              }
              stack.pop();
              return `{${res}}`;
            }
            case "number":
              return isFinite(value) ? String(value) : fail ? fail(value) : "null";
            case "boolean":
              return value === true ? "true" : "false";
            case "undefined":
              return void 0;
            case "bigint":
              if (bigint) {
                return String(value);
              }
            default:
              return fail ? fail(value) : void 0;
          }
        }
        function stringifyIndent(key, value, stack, spacer, indentation) {
          switch (typeof value) {
            case "string":
              return `"${strEscape(value)}"`;
            case "object": {
              if (value === null) {
                return "null";
              }
              if (typeof value.toJSON === "function") {
                value = value.toJSON(key);
                if (typeof value !== "object") {
                  return stringifyIndent(key, value, stack, spacer, indentation);
                }
                if (value === null) {
                  return "null";
                }
              }
              if (stack.indexOf(value) !== -1) {
                return circularValue;
              }
              const originalIndentation = indentation;
              if (Array.isArray(value)) {
                if (value.length === 0) {
                  return "[]";
                }
                if (maximumDepth < stack.length + 1) {
                  return '"[Array]"';
                }
                stack.push(value);
                indentation += spacer;
                let res2 = `
${indentation}`;
                const join3 = `,
${indentation}`;
                const maximumValuesToStringify = Math.min(value.length, maximumBreadth);
                let i = 0;
                for (; i < maximumValuesToStringify - 1; i++) {
                  const tmp2 = stringifyIndent(i, value[i], stack, spacer, indentation);
                  res2 += tmp2 !== void 0 ? tmp2 : "null";
                  res2 += join3;
                }
                const tmp = stringifyIndent(i, value[i], stack, spacer, indentation);
                res2 += tmp !== void 0 ? tmp : "null";
                if (value.length - 1 > maximumBreadth) {
                  const removedKeys = value.length - maximumBreadth - 1;
                  res2 += `${join3}"... ${getItemCount(removedKeys)} not stringified"`;
                }
                res2 += `
${originalIndentation}`;
                stack.pop();
                return `[${res2}]`;
              }
              let keys = Object.keys(value);
              const keyLength = keys.length;
              if (keyLength === 0) {
                return "{}";
              }
              if (maximumDepth < stack.length + 1) {
                return '"[Object]"';
              }
              indentation += spacer;
              const join2 = `,
${indentation}`;
              let res = "";
              let separator = "";
              let maximumPropertiesToStringify = Math.min(keyLength, maximumBreadth);
              if (isTypedArrayWithEntries(value)) {
                res += stringifyTypedArray(value, join2, maximumBreadth);
                keys = keys.slice(value.length);
                maximumPropertiesToStringify -= value.length;
                separator = join2;
              }
              if (deterministic) {
                keys = insertSort(keys);
              }
              stack.push(value);
              for (let i = 0; i < maximumPropertiesToStringify; i++) {
                const key2 = keys[i];
                const tmp = stringifyIndent(key2, value[key2], stack, spacer, indentation);
                if (tmp !== void 0) {
                  res += `${separator}"${strEscape(key2)}": ${tmp}`;
                  separator = join2;
                }
              }
              if (keyLength > maximumBreadth) {
                const removedKeys = keyLength - maximumBreadth;
                res += `${separator}"...": "${getItemCount(removedKeys)} not stringified"`;
                separator = join2;
              }
              if (separator !== "") {
                res = `
${indentation}${res}
${originalIndentation}`;
              }
              stack.pop();
              return `{${res}}`;
            }
            case "number":
              return isFinite(value) ? String(value) : fail ? fail(value) : "null";
            case "boolean":
              return value === true ? "true" : "false";
            case "undefined":
              return void 0;
            case "bigint":
              if (bigint) {
                return String(value);
              }
            default:
              return fail ? fail(value) : void 0;
          }
        }
        function stringifySimple(key, value, stack) {
          switch (typeof value) {
            case "string":
              return `"${strEscape(value)}"`;
            case "object": {
              if (value === null) {
                return "null";
              }
              if (typeof value.toJSON === "function") {
                value = value.toJSON(key);
                if (typeof value !== "object") {
                  return stringifySimple(key, value, stack);
                }
                if (value === null) {
                  return "null";
                }
              }
              if (stack.indexOf(value) !== -1) {
                return circularValue;
              }
              let res = "";
              if (Array.isArray(value)) {
                if (value.length === 0) {
                  return "[]";
                }
                if (maximumDepth < stack.length + 1) {
                  return '"[Array]"';
                }
                stack.push(value);
                const maximumValuesToStringify = Math.min(value.length, maximumBreadth);
                let i = 0;
                for (; i < maximumValuesToStringify - 1; i++) {
                  const tmp2 = stringifySimple(i, value[i], stack);
                  res += tmp2 !== void 0 ? tmp2 : "null";
                  res += ",";
                }
                const tmp = stringifySimple(i, value[i], stack);
                res += tmp !== void 0 ? tmp : "null";
                if (value.length - 1 > maximumBreadth) {
                  const removedKeys = value.length - maximumBreadth - 1;
                  res += `,"... ${getItemCount(removedKeys)} not stringified"`;
                }
                stack.pop();
                return `[${res}]`;
              }
              let keys = Object.keys(value);
              const keyLength = keys.length;
              if (keyLength === 0) {
                return "{}";
              }
              if (maximumDepth < stack.length + 1) {
                return '"[Object]"';
              }
              let separator = "";
              let maximumPropertiesToStringify = Math.min(keyLength, maximumBreadth);
              if (isTypedArrayWithEntries(value)) {
                res += stringifyTypedArray(value, ",", maximumBreadth);
                keys = keys.slice(value.length);
                maximumPropertiesToStringify -= value.length;
                separator = ",";
              }
              if (deterministic) {
                keys = insertSort(keys);
              }
              stack.push(value);
              for (let i = 0; i < maximumPropertiesToStringify; i++) {
                const key2 = keys[i];
                const tmp = stringifySimple(key2, value[key2], stack);
                if (tmp !== void 0) {
                  res += `${separator}"${strEscape(key2)}":${tmp}`;
                  separator = ",";
                }
              }
              if (keyLength > maximumBreadth) {
                const removedKeys = keyLength - maximumBreadth;
                res += `${separator}"...":"${getItemCount(removedKeys)} not stringified"`;
              }
              stack.pop();
              return `{${res}}`;
            }
            case "number":
              return isFinite(value) ? String(value) : fail ? fail(value) : "null";
            case "boolean":
              return value === true ? "true" : "false";
            case "undefined":
              return void 0;
            case "bigint":
              if (bigint) {
                return String(value);
              }
            default:
              return fail ? fail(value) : void 0;
          }
        }
        function stringify3(value, replacer, space) {
          if (arguments.length > 1) {
            let spacer = "";
            if (typeof space === "number") {
              spacer = " ".repeat(Math.min(space, 10));
            } else if (typeof space === "string") {
              spacer = space.slice(0, 10);
            }
            if (replacer != null) {
              if (typeof replacer === "function") {
                return stringifyFnReplacer("", { "": value }, [], replacer, spacer, "");
              }
              if (Array.isArray(replacer)) {
                return stringifyArrayReplacer("", value, [], getUniqueReplacerSet(replacer), spacer, "");
              }
            }
            if (spacer.length !== 0) {
              return stringifyIndent("", value, [], spacer, "");
            }
          }
          return stringifySimple("", value, []);
        }
        return stringify3;
      }
    }
  });

  // (disabled):crypto
  var require_crypto = __commonJS({
    "(disabled):crypto"() {
      init_define_process();
    }
  });

  // node_modules/@scure/bip39/wordlists/english.js
  var require_english = __commonJS({
    "node_modules/@scure/bip39/wordlists/english.js"(exports) {
      "use strict";
      init_define_process();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.wordlist = void 0;
      exports.wordlist = `abandon
ability
able
about
above
absent
absorb
abstract
absurd
abuse
access
accident
account
accuse
achieve
acid
acoustic
acquire
across
act
action
actor
actress
actual
adapt
add
addict
address
adjust
admit
adult
advance
advice
aerobic
affair
afford
afraid
again
age
agent
agree
ahead
aim
air
airport
aisle
alarm
album
alcohol
alert
alien
all
alley
allow
almost
alone
alpha
already
also
alter
always
amateur
amazing
among
amount
amused
analyst
anchor
ancient
anger
angle
angry
animal
ankle
announce
annual
another
answer
antenna
antique
anxiety
any
apart
apology
appear
apple
approve
april
arch
arctic
area
arena
argue
arm
armed
armor
army
around
arrange
arrest
arrive
arrow
art
artefact
artist
artwork
ask
aspect
assault
asset
assist
assume
asthma
athlete
atom
attack
attend
attitude
attract
auction
audit
august
aunt
author
auto
autumn
average
avocado
avoid
awake
aware
away
awesome
awful
awkward
axis
baby
bachelor
bacon
badge
bag
balance
balcony
ball
bamboo
banana
banner
bar
barely
bargain
barrel
base
basic
basket
battle
beach
bean
beauty
because
become
beef
before
begin
behave
behind
believe
below
belt
bench
benefit
best
betray
better
between
beyond
bicycle
bid
bike
bind
biology
bird
birth
bitter
black
blade
blame
blanket
blast
bleak
bless
blind
blood
blossom
blouse
blue
blur
blush
board
boat
body
boil
bomb
bone
bonus
book
boost
border
boring
borrow
boss
bottom
bounce
box
boy
bracket
brain
brand
brass
brave
bread
breeze
brick
bridge
brief
bright
bring
brisk
broccoli
broken
bronze
broom
brother
brown
brush
bubble
buddy
budget
buffalo
build
bulb
bulk
bullet
bundle
bunker
burden
burger
burst
bus
business
busy
butter
buyer
buzz
cabbage
cabin
cable
cactus
cage
cake
call
calm
camera
camp
can
canal
cancel
candy
cannon
canoe
canvas
canyon
capable
capital
captain
car
carbon
card
cargo
carpet
carry
cart
case
cash
casino
castle
casual
cat
catalog
catch
category
cattle
caught
cause
caution
cave
ceiling
celery
cement
census
century
cereal
certain
chair
chalk
champion
change
chaos
chapter
charge
chase
chat
cheap
check
cheese
chef
cherry
chest
chicken
chief
child
chimney
choice
choose
chronic
chuckle
chunk
churn
cigar
cinnamon
circle
citizen
city
civil
claim
clap
clarify
claw
clay
clean
clerk
clever
click
client
cliff
climb
clinic
clip
clock
clog
close
cloth
cloud
clown
club
clump
cluster
clutch
coach
coast
coconut
code
coffee
coil
coin
collect
color
column
combine
come
comfort
comic
common
company
concert
conduct
confirm
congress
connect
consider
control
convince
cook
cool
copper
copy
coral
core
corn
correct
cost
cotton
couch
country
couple
course
cousin
cover
coyote
crack
cradle
craft
cram
crane
crash
crater
crawl
crazy
cream
credit
creek
crew
cricket
crime
crisp
critic
crop
cross
crouch
crowd
crucial
cruel
cruise
crumble
crunch
crush
cry
crystal
cube
culture
cup
cupboard
curious
current
curtain
curve
cushion
custom
cute
cycle
dad
damage
damp
dance
danger
daring
dash
daughter
dawn
day
deal
debate
debris
decade
december
decide
decline
decorate
decrease
deer
defense
define
defy
degree
delay
deliver
demand
demise
denial
dentist
deny
depart
depend
deposit
depth
deputy
derive
describe
desert
design
desk
despair
destroy
detail
detect
develop
device
devote
diagram
dial
diamond
diary
dice
diesel
diet
differ
digital
dignity
dilemma
dinner
dinosaur
direct
dirt
disagree
discover
disease
dish
dismiss
disorder
display
distance
divert
divide
divorce
dizzy
doctor
document
dog
doll
dolphin
domain
donate
donkey
donor
door
dose
double
dove
draft
dragon
drama
drastic
draw
dream
dress
drift
drill
drink
drip
drive
drop
drum
dry
duck
dumb
dune
during
dust
dutch
duty
dwarf
dynamic
eager
eagle
early
earn
earth
easily
east
easy
echo
ecology
economy
edge
edit
educate
effort
egg
eight
either
elbow
elder
electric
elegant
element
elephant
elevator
elite
else
embark
embody
embrace
emerge
emotion
employ
empower
empty
enable
enact
end
endless
endorse
enemy
energy
enforce
engage
engine
enhance
enjoy
enlist
enough
enrich
enroll
ensure
enter
entire
entry
envelope
episode
equal
equip
era
erase
erode
erosion
error
erupt
escape
essay
essence
estate
eternal
ethics
evidence
evil
evoke
evolve
exact
example
excess
exchange
excite
exclude
excuse
execute
exercise
exhaust
exhibit
exile
exist
exit
exotic
expand
expect
expire
explain
expose
express
extend
extra
eye
eyebrow
fabric
face
faculty
fade
faint
faith
fall
false
fame
family
famous
fan
fancy
fantasy
farm
fashion
fat
fatal
father
fatigue
fault
favorite
feature
february
federal
fee
feed
feel
female
fence
festival
fetch
fever
few
fiber
fiction
field
figure
file
film
filter
final
find
fine
finger
finish
fire
firm
first
fiscal
fish
fit
fitness
fix
flag
flame
flash
flat
flavor
flee
flight
flip
float
flock
floor
flower
fluid
flush
fly
foam
focus
fog
foil
fold
follow
food
foot
force
forest
forget
fork
fortune
forum
forward
fossil
foster
found
fox
fragile
frame
frequent
fresh
friend
fringe
frog
front
frost
frown
frozen
fruit
fuel
fun
funny
furnace
fury
future
gadget
gain
galaxy
gallery
game
gap
garage
garbage
garden
garlic
garment
gas
gasp
gate
gather
gauge
gaze
general
genius
genre
gentle
genuine
gesture
ghost
giant
gift
giggle
ginger
giraffe
girl
give
glad
glance
glare
glass
glide
glimpse
globe
gloom
glory
glove
glow
glue
goat
goddess
gold
good
goose
gorilla
gospel
gossip
govern
gown
grab
grace
grain
grant
grape
grass
gravity
great
green
grid
grief
grit
grocery
group
grow
grunt
guard
guess
guide
guilt
guitar
gun
gym
habit
hair
half
hammer
hamster
hand
happy
harbor
hard
harsh
harvest
hat
have
hawk
hazard
head
health
heart
heavy
hedgehog
height
hello
helmet
help
hen
hero
hidden
high
hill
hint
hip
hire
history
hobby
hockey
hold
hole
holiday
hollow
home
honey
hood
hope
horn
horror
horse
hospital
host
hotel
hour
hover
hub
huge
human
humble
humor
hundred
hungry
hunt
hurdle
hurry
hurt
husband
hybrid
ice
icon
idea
identify
idle
ignore
ill
illegal
illness
image
imitate
immense
immune
impact
impose
improve
impulse
inch
include
income
increase
index
indicate
indoor
industry
infant
inflict
inform
inhale
inherit
initial
inject
injury
inmate
inner
innocent
input
inquiry
insane
insect
inside
inspire
install
intact
interest
into
invest
invite
involve
iron
island
isolate
issue
item
ivory
jacket
jaguar
jar
jazz
jealous
jeans
jelly
jewel
job
join
joke
journey
joy
judge
juice
jump
jungle
junior
junk
just
kangaroo
keen
keep
ketchup
key
kick
kid
kidney
kind
kingdom
kiss
kit
kitchen
kite
kitten
kiwi
knee
knife
knock
know
lab
label
labor
ladder
lady
lake
lamp
language
laptop
large
later
latin
laugh
laundry
lava
law
lawn
lawsuit
layer
lazy
leader
leaf
learn
leave
lecture
left
leg
legal
legend
leisure
lemon
lend
length
lens
leopard
lesson
letter
level
liar
liberty
library
license
life
lift
light
like
limb
limit
link
lion
liquid
list
little
live
lizard
load
loan
lobster
local
lock
logic
lonely
long
loop
lottery
loud
lounge
love
loyal
lucky
luggage
lumber
lunar
lunch
luxury
lyrics
machine
mad
magic
magnet
maid
mail
main
major
make
mammal
man
manage
mandate
mango
mansion
manual
maple
marble
march
margin
marine
market
marriage
mask
mass
master
match
material
math
matrix
matter
maximum
maze
meadow
mean
measure
meat
mechanic
medal
media
melody
melt
member
memory
mention
menu
mercy
merge
merit
merry
mesh
message
metal
method
middle
midnight
milk
million
mimic
mind
minimum
minor
minute
miracle
mirror
misery
miss
mistake
mix
mixed
mixture
mobile
model
modify
mom
moment
monitor
monkey
monster
month
moon
moral
more
morning
mosquito
mother
motion
motor
mountain
mouse
move
movie
much
muffin
mule
multiply
muscle
museum
mushroom
music
must
mutual
myself
mystery
myth
naive
name
napkin
narrow
nasty
nation
nature
near
neck
need
negative
neglect
neither
nephew
nerve
nest
net
network
neutral
never
news
next
nice
night
noble
noise
nominee
noodle
normal
north
nose
notable
note
nothing
notice
novel
now
nuclear
number
nurse
nut
oak
obey
object
oblige
obscure
observe
obtain
obvious
occur
ocean
october
odor
off
offer
office
often
oil
okay
old
olive
olympic
omit
once
one
onion
online
only
open
opera
opinion
oppose
option
orange
orbit
orchard
order
ordinary
organ
orient
original
orphan
ostrich
other
outdoor
outer
output
outside
oval
oven
over
own
owner
oxygen
oyster
ozone
pact
paddle
page
pair
palace
palm
panda
panel
panic
panther
paper
parade
parent
park
parrot
party
pass
patch
path
patient
patrol
pattern
pause
pave
payment
peace
peanut
pear
peasant
pelican
pen
penalty
pencil
people
pepper
perfect
permit
person
pet
phone
photo
phrase
physical
piano
picnic
picture
piece
pig
pigeon
pill
pilot
pink
pioneer
pipe
pistol
pitch
pizza
place
planet
plastic
plate
play
please
pledge
pluck
plug
plunge
poem
poet
point
polar
pole
police
pond
pony
pool
popular
portion
position
possible
post
potato
pottery
poverty
powder
power
practice
praise
predict
prefer
prepare
present
pretty
prevent
price
pride
primary
print
priority
prison
private
prize
problem
process
produce
profit
program
project
promote
proof
property
prosper
protect
proud
provide
public
pudding
pull
pulp
pulse
pumpkin
punch
pupil
puppy
purchase
purity
purpose
purse
push
put
puzzle
pyramid
quality
quantum
quarter
question
quick
quit
quiz
quote
rabbit
raccoon
race
rack
radar
radio
rail
rain
raise
rally
ramp
ranch
random
range
rapid
rare
rate
rather
raven
raw
razor
ready
real
reason
rebel
rebuild
recall
receive
recipe
record
recycle
reduce
reflect
reform
refuse
region
regret
regular
reject
relax
release
relief
rely
remain
remember
remind
remove
render
renew
rent
reopen
repair
repeat
replace
report
require
rescue
resemble
resist
resource
response
result
retire
retreat
return
reunion
reveal
review
reward
rhythm
rib
ribbon
rice
rich
ride
ridge
rifle
right
rigid
ring
riot
ripple
risk
ritual
rival
river
road
roast
robot
robust
rocket
romance
roof
rookie
room
rose
rotate
rough
round
route
royal
rubber
rude
rug
rule
run
runway
rural
sad
saddle
sadness
safe
sail
salad
salmon
salon
salt
salute
same
sample
sand
satisfy
satoshi
sauce
sausage
save
say
scale
scan
scare
scatter
scene
scheme
school
science
scissors
scorpion
scout
scrap
screen
script
scrub
sea
search
season
seat
second
secret
section
security
seed
seek
segment
select
sell
seminar
senior
sense
sentence
series
service
session
settle
setup
seven
shadow
shaft
shallow
share
shed
shell
sheriff
shield
shift
shine
ship
shiver
shock
shoe
shoot
shop
short
shoulder
shove
shrimp
shrug
shuffle
shy
sibling
sick
side
siege
sight
sign
silent
silk
silly
silver
similar
simple
since
sing
siren
sister
situate
six
size
skate
sketch
ski
skill
skin
skirt
skull
slab
slam
sleep
slender
slice
slide
slight
slim
slogan
slot
slow
slush
small
smart
smile
smoke
smooth
snack
snake
snap
sniff
snow
soap
soccer
social
sock
soda
soft
solar
soldier
solid
solution
solve
someone
song
soon
sorry
sort
soul
sound
soup
source
south
space
spare
spatial
spawn
speak
special
speed
spell
spend
sphere
spice
spider
spike
spin
spirit
split
spoil
sponsor
spoon
sport
spot
spray
spread
spring
spy
square
squeeze
squirrel
stable
stadium
staff
stage
stairs
stamp
stand
start
state
stay
steak
steel
stem
step
stereo
stick
still
sting
stock
stomach
stone
stool
story
stove
strategy
street
strike
strong
struggle
student
stuff
stumble
style
subject
submit
subway
success
such
sudden
suffer
sugar
suggest
suit
summer
sun
sunny
sunset
super
supply
supreme
sure
surface
surge
surprise
surround
survey
suspect
sustain
swallow
swamp
swap
swarm
swear
sweet
swift
swim
swing
switch
sword
symbol
symptom
syrup
system
table
tackle
tag
tail
talent
talk
tank
tape
target
task
taste
tattoo
taxi
teach
team
tell
ten
tenant
tennis
tent
term
test
text
thank
that
theme
then
theory
there
they
thing
this
thought
three
thrive
throw
thumb
thunder
ticket
tide
tiger
tilt
timber
time
tiny
tip
tired
tissue
title
toast
tobacco
today
toddler
toe
together
toilet
token
tomato
tomorrow
tone
tongue
tonight
tool
tooth
top
topic
topple
torch
tornado
tortoise
toss
total
tourist
toward
tower
town
toy
track
trade
traffic
tragic
train
transfer
trap
trash
travel
tray
treat
tree
trend
trial
tribe
trick
trigger
trim
trip
trophy
trouble
truck
true
truly
trumpet
trust
truth
try
tube
tuition
tumble
tuna
tunnel
turkey
turn
turtle
twelve
twenty
twice
twin
twist
two
type
typical
ugly
umbrella
unable
unaware
uncle
uncover
under
undo
unfair
unfold
unhappy
uniform
unique
unit
universe
unknown
unlock
until
unusual
unveil
update
upgrade
uphold
upon
upper
upset
urban
urge
usage
use
used
useful
useless
usual
utility
vacant
vacuum
vague
valid
valley
valve
van
vanish
vapor
various
vast
vault
vehicle
velvet
vendor
venture
venue
verb
verify
version
very
vessel
veteran
viable
vibrant
vicious
victory
video
view
village
vintage
violin
virtual
virus
visa
visit
visual
vital
vivid
vocal
voice
void
volcano
volume
vote
voyage
wage
wagon
wait
walk
wall
walnut
want
warfare
warm
warrior
wash
wasp
waste
water
wave
way
wealth
weapon
wear
weasel
weather
web
wedding
weekend
weird
welcome
west
wet
whale
what
wheat
wheel
when
where
whip
whisper
wide
width
wife
wild
will
win
window
wine
wing
wink
winner
winter
wire
wisdom
wise
wish
witness
wolf
woman
wonder
wood
wool
word
work
world
worry
worth
wrap
wreck
wrestle
wrist
write
wrong
yard
year
yellow
you
young
youth
zebra
zero
zone
zoo`.split("\n");
    }
  });

  // node_modules/@scure/bip39/node_modules/@noble/hashes/_assert.js
  var require_assert = __commonJS({
    "node_modules/@scure/bip39/node_modules/@noble/hashes/_assert.js"(exports) {
      "use strict";
      init_define_process();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.output = exports.exists = exports.hash = exports.bytes = exports.bool = exports.number = void 0;
      function number2(n) {
        if (!Number.isSafeInteger(n) || n < 0)
          throw new Error(`Wrong positive integer: ${n}`);
      }
      exports.number = number2;
      function bool2(b) {
        if (typeof b !== "boolean")
          throw new Error(`Expected boolean, not ${b}`);
      }
      exports.bool = bool2;
      function bytes2(b, ...lengths) {
        if (!(b instanceof Uint8Array))
          throw new TypeError("Expected Uint8Array");
        if (lengths.length > 0 && !lengths.includes(b.length))
          throw new TypeError(`Expected Uint8Array of length ${lengths}, not of length=${b.length}`);
      }
      exports.bytes = bytes2;
      function hash2(hash3) {
        if (typeof hash3 !== "function" || typeof hash3.create !== "function")
          throw new Error("Hash should be wrapped by utils.wrapConstructor");
        number2(hash3.outputLen);
        number2(hash3.blockLen);
      }
      exports.hash = hash2;
      function exists2(instance, checkFinished = true) {
        if (instance.destroyed)
          throw new Error("Hash instance has been destroyed");
        if (checkFinished && instance.finished)
          throw new Error("Hash#digest() has already been called");
      }
      exports.exists = exists2;
      function output2(out, instance) {
        bytes2(out);
        const min = instance.outputLen;
        if (out.length < min) {
          throw new Error(`digestInto() expects output buffer of length at least ${min}`);
        }
      }
      exports.output = output2;
      var assert2 = {
        number: number2,
        bool: bool2,
        bytes: bytes2,
        hash: hash2,
        exists: exists2,
        output: output2
      };
      exports.default = assert2;
    }
  });

  // node_modules/@scure/bip39/node_modules/@noble/hashes/cryptoBrowser.js
  var require_cryptoBrowser = __commonJS({
    "node_modules/@scure/bip39/node_modules/@noble/hashes/cryptoBrowser.js"(exports) {
      "use strict";
      init_define_process();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.crypto = void 0;
      exports.crypto = {
        node: void 0,
        web: typeof self === "object" && "crypto" in self ? self.crypto : void 0
      };
    }
  });

  // node_modules/@scure/bip39/node_modules/@noble/hashes/utils.js
  var require_utils = __commonJS({
    "node_modules/@scure/bip39/node_modules/@noble/hashes/utils.js"(exports) {
      "use strict";
      init_define_process();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.randomBytes = exports.wrapConstructorWithOpts = exports.wrapConstructor = exports.checkOpts = exports.Hash = exports.concatBytes = exports.toBytes = exports.utf8ToBytes = exports.asyncLoop = exports.nextTick = exports.hexToBytes = exports.bytesToHex = exports.isLE = exports.rotr = exports.createView = exports.u32 = exports.u8 = void 0;
      var crypto_1 = require_cryptoBrowser();
      var u8 = (arr) => new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
      exports.u8 = u8;
      var u32 = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
      exports.u32 = u32;
      var createView3 = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
      exports.createView = createView3;
      var rotr3 = (word, shift) => word << 32 - shift | word >>> shift;
      exports.rotr = rotr3;
      exports.isLE = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
      if (!exports.isLE)
        throw new Error("Non little-endian hardware is not supported");
      var hexes4 = Array.from({ length: 256 }, (v, i) => i.toString(16).padStart(2, "0"));
      function bytesToHex3(uint8a) {
        if (!(uint8a instanceof Uint8Array))
          throw new Error("Uint8Array expected");
        let hex2 = "";
        for (let i = 0; i < uint8a.length; i++) {
          hex2 += hexes4[uint8a[i]];
        }
        return hex2;
      }
      exports.bytesToHex = bytesToHex3;
      function hexToBytes3(hex2) {
        if (typeof hex2 !== "string") {
          throw new TypeError("hexToBytes: expected string, got " + typeof hex2);
        }
        if (hex2.length % 2)
          throw new Error("hexToBytes: received invalid unpadded hex");
        const array = new Uint8Array(hex2.length / 2);
        for (let i = 0; i < array.length; i++) {
          const j = i * 2;
          const hexByte = hex2.slice(j, j + 2);
          const byte = Number.parseInt(hexByte, 16);
          if (Number.isNaN(byte) || byte < 0)
            throw new Error("Invalid byte sequence");
          array[i] = byte;
        }
        return array;
      }
      exports.hexToBytes = hexToBytes3;
      var nextTick2 = async () => {
      };
      exports.nextTick = nextTick2;
      async function asyncLoop(iters, tick, cb) {
        let ts = Date.now();
        for (let i = 0; i < iters; i++) {
          cb(i);
          const diff = Date.now() - ts;
          if (diff >= 0 && diff < tick)
            continue;
          await (0, exports.nextTick)();
          ts += diff;
        }
      }
      exports.asyncLoop = asyncLoop;
      function utf8ToBytes3(str) {
        if (typeof str !== "string") {
          throw new TypeError(`utf8ToBytes expected string, got ${typeof str}`);
        }
        return new TextEncoder().encode(str);
      }
      exports.utf8ToBytes = utf8ToBytes3;
      function toBytes3(data) {
        if (typeof data === "string")
          data = utf8ToBytes3(data);
        if (!(data instanceof Uint8Array))
          throw new TypeError(`Expected input type is Uint8Array (got ${typeof data})`);
        return data;
      }
      exports.toBytes = toBytes3;
      function concatBytes3(...arrays) {
        if (!arrays.every((a) => a instanceof Uint8Array))
          throw new Error("Uint8Array list expected");
        if (arrays.length === 1)
          return arrays[0];
        const length = arrays.reduce((a, arr) => a + arr.length, 0);
        const result = new Uint8Array(length);
        for (let i = 0, pad = 0; i < arrays.length; i++) {
          const arr = arrays[i];
          result.set(arr, pad);
          pad += arr.length;
        }
        return result;
      }
      exports.concatBytes = concatBytes3;
      var Hash3 = class {
        clone() {
          return this._cloneInto();
        }
      };
      exports.Hash = Hash3;
      var isPlainObject = (obj) => Object.prototype.toString.call(obj) === "[object Object]" && obj.constructor === Object;
      function checkOpts(defaults, opts) {
        if (opts !== void 0 && (typeof opts !== "object" || !isPlainObject(opts)))
          throw new TypeError("Options should be object or undefined");
        const merged = Object.assign(defaults, opts);
        return merged;
      }
      exports.checkOpts = checkOpts;
      function wrapConstructor3(hashConstructor) {
        const hashC = (message) => hashConstructor().update(toBytes3(message)).digest();
        const tmp = hashConstructor();
        hashC.outputLen = tmp.outputLen;
        hashC.blockLen = tmp.blockLen;
        hashC.create = () => hashConstructor();
        return hashC;
      }
      exports.wrapConstructor = wrapConstructor3;
      function wrapConstructorWithOpts(hashCons) {
        const hashC = (msg, opts) => hashCons(opts).update(toBytes3(msg)).digest();
        const tmp = hashCons({});
        hashC.outputLen = tmp.outputLen;
        hashC.blockLen = tmp.blockLen;
        hashC.create = (opts) => hashCons(opts);
        return hashC;
      }
      exports.wrapConstructorWithOpts = wrapConstructorWithOpts;
      function randomBytes2(bytesLength = 32) {
        if (crypto_1.crypto.web) {
          return crypto_1.crypto.web.getRandomValues(new Uint8Array(bytesLength));
        } else if (crypto_1.crypto.node) {
          return new Uint8Array(crypto_1.crypto.node.randomBytes(bytesLength).buffer);
        } else {
          throw new Error("The environment doesn't have randomBytes function");
        }
      }
      exports.randomBytes = randomBytes2;
    }
  });

  // node_modules/@scure/bip39/node_modules/@noble/hashes/hmac.js
  var require_hmac = __commonJS({
    "node_modules/@scure/bip39/node_modules/@noble/hashes/hmac.js"(exports) {
      "use strict";
      init_define_process();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.hmac = void 0;
      var _assert_js_1 = require_assert();
      var utils_js_1 = require_utils();
      var HMAC3 = class extends utils_js_1.Hash {
        constructor(hash2, _key) {
          super();
          this.finished = false;
          this.destroyed = false;
          _assert_js_1.default.hash(hash2);
          const key = (0, utils_js_1.toBytes)(_key);
          this.iHash = hash2.create();
          if (typeof this.iHash.update !== "function")
            throw new TypeError("Expected instance of class which extends utils.Hash");
          this.blockLen = this.iHash.blockLen;
          this.outputLen = this.iHash.outputLen;
          const blockLen = this.blockLen;
          const pad = new Uint8Array(blockLen);
          pad.set(key.length > blockLen ? hash2.create().update(key).digest() : key);
          for (let i = 0; i < pad.length; i++)
            pad[i] ^= 54;
          this.iHash.update(pad);
          this.oHash = hash2.create();
          for (let i = 0; i < pad.length; i++)
            pad[i] ^= 54 ^ 92;
          this.oHash.update(pad);
          pad.fill(0);
        }
        update(buf) {
          _assert_js_1.default.exists(this);
          this.iHash.update(buf);
          return this;
        }
        digestInto(out) {
          _assert_js_1.default.exists(this);
          _assert_js_1.default.bytes(out, this.outputLen);
          this.finished = true;
          this.iHash.digestInto(out);
          this.oHash.update(out);
          this.oHash.digestInto(out);
          this.destroy();
        }
        digest() {
          const out = new Uint8Array(this.oHash.outputLen);
          this.digestInto(out);
          return out;
        }
        _cloneInto(to) {
          to || (to = Object.create(Object.getPrototypeOf(this), {}));
          const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
          to = to;
          to.finished = finished;
          to.destroyed = destroyed;
          to.blockLen = blockLen;
          to.outputLen = outputLen;
          to.oHash = oHash._cloneInto(to.oHash);
          to.iHash = iHash._cloneInto(to.iHash);
          return to;
        }
        destroy() {
          this.destroyed = true;
          this.oHash.destroy();
          this.iHash.destroy();
        }
      };
      var hmac3 = (hash2, key, message) => new HMAC3(hash2, key).update(message).digest();
      exports.hmac = hmac3;
      exports.hmac.create = (hash2, key) => new HMAC3(hash2, key);
    }
  });

  // node_modules/@scure/bip39/node_modules/@noble/hashes/pbkdf2.js
  var require_pbkdf2 = __commonJS({
    "node_modules/@scure/bip39/node_modules/@noble/hashes/pbkdf2.js"(exports) {
      "use strict";
      init_define_process();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.pbkdf2Async = exports.pbkdf2 = void 0;
      var _assert_js_1 = require_assert();
      var hmac_js_1 = require_hmac();
      var utils_js_1 = require_utils();
      function pbkdf2Init(hash2, _password, _salt, _opts) {
        _assert_js_1.default.hash(hash2);
        const opts = (0, utils_js_1.checkOpts)({ dkLen: 32, asyncTick: 10 }, _opts);
        const { c, dkLen, asyncTick } = opts;
        _assert_js_1.default.number(c);
        _assert_js_1.default.number(dkLen);
        _assert_js_1.default.number(asyncTick);
        if (c < 1)
          throw new Error("PBKDF2: iterations (c) should be >= 1");
        const password = (0, utils_js_1.toBytes)(_password);
        const salt = (0, utils_js_1.toBytes)(_salt);
        const DK = new Uint8Array(dkLen);
        const PRF = hmac_js_1.hmac.create(hash2, password);
        const PRFSalt = PRF._cloneInto().update(salt);
        return { c, dkLen, asyncTick, DK, PRF, PRFSalt };
      }
      function pbkdf2Output(PRF, PRFSalt, DK, prfW, u) {
        PRF.destroy();
        PRFSalt.destroy();
        if (prfW)
          prfW.destroy();
        u.fill(0);
        return DK;
      }
      function pbkdf2(hash2, password, salt, opts) {
        const { c, dkLen, DK, PRF, PRFSalt } = pbkdf2Init(hash2, password, salt, opts);
        let prfW;
        const arr = new Uint8Array(4);
        const view = (0, utils_js_1.createView)(arr);
        const u = new Uint8Array(PRF.outputLen);
        for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += PRF.outputLen) {
          const Ti = DK.subarray(pos, pos + PRF.outputLen);
          view.setInt32(0, ti, false);
          (prfW = PRFSalt._cloneInto(prfW)).update(arr).digestInto(u);
          Ti.set(u.subarray(0, Ti.length));
          for (let ui = 1; ui < c; ui++) {
            PRF._cloneInto(prfW).update(u).digestInto(u);
            for (let i = 0; i < Ti.length; i++)
              Ti[i] ^= u[i];
          }
        }
        return pbkdf2Output(PRF, PRFSalt, DK, prfW, u);
      }
      exports.pbkdf2 = pbkdf2;
      async function pbkdf2Async(hash2, password, salt, opts) {
        const { c, dkLen, asyncTick, DK, PRF, PRFSalt } = pbkdf2Init(hash2, password, salt, opts);
        let prfW;
        const arr = new Uint8Array(4);
        const view = (0, utils_js_1.createView)(arr);
        const u = new Uint8Array(PRF.outputLen);
        for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += PRF.outputLen) {
          const Ti = DK.subarray(pos, pos + PRF.outputLen);
          view.setInt32(0, ti, false);
          (prfW = PRFSalt._cloneInto(prfW)).update(arr).digestInto(u);
          Ti.set(u.subarray(0, Ti.length));
          await (0, utils_js_1.asyncLoop)(c - 1, asyncTick, (i) => {
            PRF._cloneInto(prfW).update(u).digestInto(u);
            for (let i2 = 0; i2 < Ti.length; i2++)
              Ti[i2] ^= u[i2];
          });
        }
        return pbkdf2Output(PRF, PRFSalt, DK, prfW, u);
      }
      exports.pbkdf2Async = pbkdf2Async;
    }
  });

  // node_modules/@scure/bip39/node_modules/@noble/hashes/_sha2.js
  var require_sha2 = __commonJS({
    "node_modules/@scure/bip39/node_modules/@noble/hashes/_sha2.js"(exports) {
      "use strict";
      init_define_process();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.SHA2 = void 0;
      var _assert_js_1 = require_assert();
      var utils_js_1 = require_utils();
      function setBigUint643(view, byteOffset, value, isLE3) {
        if (typeof view.setBigUint64 === "function")
          return view.setBigUint64(byteOffset, value, isLE3);
        const _32n2 = BigInt(32);
        const _u32_max = BigInt(4294967295);
        const wh = Number(value >> _32n2 & _u32_max);
        const wl = Number(value & _u32_max);
        const h = isLE3 ? 4 : 0;
        const l = isLE3 ? 0 : 4;
        view.setUint32(byteOffset + h, wh, isLE3);
        view.setUint32(byteOffset + l, wl, isLE3);
      }
      var SHA23 = class extends utils_js_1.Hash {
        constructor(blockLen, outputLen, padOffset, isLE3) {
          super();
          this.blockLen = blockLen;
          this.outputLen = outputLen;
          this.padOffset = padOffset;
          this.isLE = isLE3;
          this.finished = false;
          this.length = 0;
          this.pos = 0;
          this.destroyed = false;
          this.buffer = new Uint8Array(blockLen);
          this.view = (0, utils_js_1.createView)(this.buffer);
        }
        update(data) {
          _assert_js_1.default.exists(this);
          const { view, buffer, blockLen } = this;
          data = (0, utils_js_1.toBytes)(data);
          const len = data.length;
          for (let pos = 0; pos < len; ) {
            const take = Math.min(blockLen - this.pos, len - pos);
            if (take === blockLen) {
              const dataView = (0, utils_js_1.createView)(data);
              for (; blockLen <= len - pos; pos += blockLen)
                this.process(dataView, pos);
              continue;
            }
            buffer.set(data.subarray(pos, pos + take), this.pos);
            this.pos += take;
            pos += take;
            if (this.pos === blockLen) {
              this.process(view, 0);
              this.pos = 0;
            }
          }
          this.length += data.length;
          this.roundClean();
          return this;
        }
        digestInto(out) {
          _assert_js_1.default.exists(this);
          _assert_js_1.default.output(out, this);
          this.finished = true;
          const { buffer, view, blockLen, isLE: isLE3 } = this;
          let { pos } = this;
          buffer[pos++] = 128;
          this.buffer.subarray(pos).fill(0);
          if (this.padOffset > blockLen - pos) {
            this.process(view, 0);
            pos = 0;
          }
          for (let i = pos; i < blockLen; i++)
            buffer[i] = 0;
          setBigUint643(view, blockLen - 8, BigInt(this.length * 8), isLE3);
          this.process(view, 0);
          const oview = (0, utils_js_1.createView)(out);
          const len = this.outputLen;
          if (len % 4)
            throw new Error("_sha2: outputLen should be aligned to 32bit");
          const outLen = len / 4;
          const state = this.get();
          if (outLen > state.length)
            throw new Error("_sha2: outputLen bigger than state");
          for (let i = 0; i < outLen; i++)
            oview.setUint32(4 * i, state[i], isLE3);
        }
        digest() {
          const { buffer, outputLen } = this;
          this.digestInto(buffer);
          const res = buffer.slice(0, outputLen);
          this.destroy();
          return res;
        }
        _cloneInto(to) {
          to || (to = new this.constructor());
          to.set(...this.get());
          const { blockLen, buffer, length, finished, destroyed, pos } = this;
          to.length = length;
          to.pos = pos;
          to.finished = finished;
          to.destroyed = destroyed;
          if (length % blockLen)
            to.buffer.set(buffer);
          return to;
        }
      };
      exports.SHA2 = SHA23;
    }
  });

  // node_modules/@scure/bip39/node_modules/@noble/hashes/sha256.js
  var require_sha256 = __commonJS({
    "node_modules/@scure/bip39/node_modules/@noble/hashes/sha256.js"(exports) {
      "use strict";
      init_define_process();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.sha224 = exports.sha256 = void 0;
      var _sha2_js_1 = require_sha2();
      var utils_js_1 = require_utils();
      var Chi3 = (a, b, c) => a & b ^ ~a & c;
      var Maj3 = (a, b, c) => a & b ^ a & c ^ b & c;
      var SHA256_K3 = new Uint32Array([
        1116352408,
        1899447441,
        3049323471,
        3921009573,
        961987163,
        1508970993,
        2453635748,
        2870763221,
        3624381080,
        310598401,
        607225278,
        1426881987,
        1925078388,
        2162078206,
        2614888103,
        3248222580,
        3835390401,
        4022224774,
        264347078,
        604807628,
        770255983,
        1249150122,
        1555081692,
        1996064986,
        2554220882,
        2821834349,
        2952996808,
        3210313671,
        3336571891,
        3584528711,
        113926993,
        338241895,
        666307205,
        773529912,
        1294757372,
        1396182291,
        1695183700,
        1986661051,
        2177026350,
        2456956037,
        2730485921,
        2820302411,
        3259730800,
        3345764771,
        3516065817,
        3600352804,
        4094571909,
        275423344,
        430227734,
        506948616,
        659060556,
        883997877,
        958139571,
        1322822218,
        1537002063,
        1747873779,
        1955562222,
        2024104815,
        2227730452,
        2361852424,
        2428436474,
        2756734187,
        3204031479,
        3329325298
      ]);
      var IV3 = new Uint32Array([
        1779033703,
        3144134277,
        1013904242,
        2773480762,
        1359893119,
        2600822924,
        528734635,
        1541459225
      ]);
      var SHA256_W3 = new Uint32Array(64);
      var SHA2563 = class extends _sha2_js_1.SHA2 {
        constructor() {
          super(64, 32, 8, false);
          this.A = IV3[0] | 0;
          this.B = IV3[1] | 0;
          this.C = IV3[2] | 0;
          this.D = IV3[3] | 0;
          this.E = IV3[4] | 0;
          this.F = IV3[5] | 0;
          this.G = IV3[6] | 0;
          this.H = IV3[7] | 0;
        }
        get() {
          const { A, B, C, D, E, F, G, H } = this;
          return [A, B, C, D, E, F, G, H];
        }
        set(A, B, C, D, E, F, G, H) {
          this.A = A | 0;
          this.B = B | 0;
          this.C = C | 0;
          this.D = D | 0;
          this.E = E | 0;
          this.F = F | 0;
          this.G = G | 0;
          this.H = H | 0;
        }
        process(view, offset) {
          for (let i = 0; i < 16; i++, offset += 4)
            SHA256_W3[i] = view.getUint32(offset, false);
          for (let i = 16; i < 64; i++) {
            const W15 = SHA256_W3[i - 15];
            const W2 = SHA256_W3[i - 2];
            const s0 = (0, utils_js_1.rotr)(W15, 7) ^ (0, utils_js_1.rotr)(W15, 18) ^ W15 >>> 3;
            const s1 = (0, utils_js_1.rotr)(W2, 17) ^ (0, utils_js_1.rotr)(W2, 19) ^ W2 >>> 10;
            SHA256_W3[i] = s1 + SHA256_W3[i - 7] + s0 + SHA256_W3[i - 16] | 0;
          }
          let { A, B, C, D, E, F, G, H } = this;
          for (let i = 0; i < 64; i++) {
            const sigma1 = (0, utils_js_1.rotr)(E, 6) ^ (0, utils_js_1.rotr)(E, 11) ^ (0, utils_js_1.rotr)(E, 25);
            const T1 = H + sigma1 + Chi3(E, F, G) + SHA256_K3[i] + SHA256_W3[i] | 0;
            const sigma0 = (0, utils_js_1.rotr)(A, 2) ^ (0, utils_js_1.rotr)(A, 13) ^ (0, utils_js_1.rotr)(A, 22);
            const T2 = sigma0 + Maj3(A, B, C) | 0;
            H = G;
            G = F;
            F = E;
            E = D + T1 | 0;
            D = C;
            C = B;
            B = A;
            A = T1 + T2 | 0;
          }
          A = A + this.A | 0;
          B = B + this.B | 0;
          C = C + this.C | 0;
          D = D + this.D | 0;
          E = E + this.E | 0;
          F = F + this.F | 0;
          G = G + this.G | 0;
          H = H + this.H | 0;
          this.set(A, B, C, D, E, F, G, H);
        }
        roundClean() {
          SHA256_W3.fill(0);
        }
        destroy() {
          this.set(0, 0, 0, 0, 0, 0, 0, 0);
          this.buffer.fill(0);
        }
      };
      var SHA2242 = class extends SHA2563 {
        constructor() {
          super();
          this.A = 3238371032 | 0;
          this.B = 914150663 | 0;
          this.C = 812702999 | 0;
          this.D = 4144912697 | 0;
          this.E = 4290775857 | 0;
          this.F = 1750603025 | 0;
          this.G = 1694076839 | 0;
          this.H = 3204075428 | 0;
          this.outputLen = 28;
        }
      };
      exports.sha256 = (0, utils_js_1.wrapConstructor)(() => new SHA2563());
      exports.sha224 = (0, utils_js_1.wrapConstructor)(() => new SHA2242());
    }
  });

  // node_modules/@scure/bip39/node_modules/@noble/hashes/_u64.js
  var require_u64 = __commonJS({
    "node_modules/@scure/bip39/node_modules/@noble/hashes/_u64.js"(exports) {
      "use strict";
      init_define_process();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.add = exports.toBig = exports.split = exports.fromBig = void 0;
      var U32_MASK642 = BigInt(2 ** 32 - 1);
      var _32n2 = BigInt(32);
      function fromBig2(n, le = false) {
        if (le)
          return { h: Number(n & U32_MASK642), l: Number(n >> _32n2 & U32_MASK642) };
        return { h: Number(n >> _32n2 & U32_MASK642) | 0, l: Number(n & U32_MASK642) | 0 };
      }
      exports.fromBig = fromBig2;
      function split2(lst, le = false) {
        let Ah = new Uint32Array(lst.length);
        let Al = new Uint32Array(lst.length);
        for (let i = 0; i < lst.length; i++) {
          const { h, l } = fromBig2(lst[i], le);
          [Ah[i], Al[i]] = [h, l];
        }
        return [Ah, Al];
      }
      exports.split = split2;
      var toBig2 = (h, l) => BigInt(h >>> 0) << _32n2 | BigInt(l >>> 0);
      exports.toBig = toBig2;
      var shrSH2 = (h, l, s) => h >>> s;
      var shrSL2 = (h, l, s) => h << 32 - s | l >>> s;
      var rotrSH2 = (h, l, s) => h >>> s | l << 32 - s;
      var rotrSL2 = (h, l, s) => h << 32 - s | l >>> s;
      var rotrBH2 = (h, l, s) => h << 64 - s | l >>> s - 32;
      var rotrBL2 = (h, l, s) => h >>> s - 32 | l << 64 - s;
      var rotr32H2 = (h, l) => l;
      var rotr32L2 = (h, l) => h;
      var rotlSH2 = (h, l, s) => h << s | l >>> 32 - s;
      var rotlSL2 = (h, l, s) => l << s | h >>> 32 - s;
      var rotlBH2 = (h, l, s) => l << s - 32 | h >>> 64 - s;
      var rotlBL2 = (h, l, s) => h << s - 32 | l >>> 64 - s;
      function add2(Ah, Al, Bh, Bl) {
        const l = (Al >>> 0) + (Bl >>> 0);
        return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
      }
      exports.add = add2;
      var add3L2 = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
      var add3H2 = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
      var add4L2 = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
      var add4H2 = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
      var add5L2 = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
      var add5H2 = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;
      var u642 = {
        fromBig: fromBig2,
        split: split2,
        toBig: exports.toBig,
        shrSH: shrSH2,
        shrSL: shrSL2,
        rotrSH: rotrSH2,
        rotrSL: rotrSL2,
        rotrBH: rotrBH2,
        rotrBL: rotrBL2,
        rotr32H: rotr32H2,
        rotr32L: rotr32L2,
        rotlSH: rotlSH2,
        rotlSL: rotlSL2,
        rotlBH: rotlBH2,
        rotlBL: rotlBL2,
        add: add2,
        add3L: add3L2,
        add3H: add3H2,
        add4L: add4L2,
        add4H: add4H2,
        add5H: add5H2,
        add5L: add5L2
      };
      exports.default = u642;
    }
  });

  // node_modules/@scure/bip39/node_modules/@noble/hashes/sha512.js
  var require_sha512 = __commonJS({
    "node_modules/@scure/bip39/node_modules/@noble/hashes/sha512.js"(exports) {
      "use strict";
      init_define_process();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.sha384 = exports.sha512_256 = exports.sha512_224 = exports.sha512 = exports.SHA512 = void 0;
      var _sha2_js_1 = require_sha2();
      var _u64_js_1 = require_u64();
      var utils_js_1 = require_utils();
      var [SHA512_Kh2, SHA512_Kl2] = _u64_js_1.default.split([
        "0x428a2f98d728ae22",
        "0x7137449123ef65cd",
        "0xb5c0fbcfec4d3b2f",
        "0xe9b5dba58189dbbc",
        "0x3956c25bf348b538",
        "0x59f111f1b605d019",
        "0x923f82a4af194f9b",
        "0xab1c5ed5da6d8118",
        "0xd807aa98a3030242",
        "0x12835b0145706fbe",
        "0x243185be4ee4b28c",
        "0x550c7dc3d5ffb4e2",
        "0x72be5d74f27b896f",
        "0x80deb1fe3b1696b1",
        "0x9bdc06a725c71235",
        "0xc19bf174cf692694",
        "0xe49b69c19ef14ad2",
        "0xefbe4786384f25e3",
        "0x0fc19dc68b8cd5b5",
        "0x240ca1cc77ac9c65",
        "0x2de92c6f592b0275",
        "0x4a7484aa6ea6e483",
        "0x5cb0a9dcbd41fbd4",
        "0x76f988da831153b5",
        "0x983e5152ee66dfab",
        "0xa831c66d2db43210",
        "0xb00327c898fb213f",
        "0xbf597fc7beef0ee4",
        "0xc6e00bf33da88fc2",
        "0xd5a79147930aa725",
        "0x06ca6351e003826f",
        "0x142929670a0e6e70",
        "0x27b70a8546d22ffc",
        "0x2e1b21385c26c926",
        "0x4d2c6dfc5ac42aed",
        "0x53380d139d95b3df",
        "0x650a73548baf63de",
        "0x766a0abb3c77b2a8",
        "0x81c2c92e47edaee6",
        "0x92722c851482353b",
        "0xa2bfe8a14cf10364",
        "0xa81a664bbc423001",
        "0xc24b8b70d0f89791",
        "0xc76c51a30654be30",
        "0xd192e819d6ef5218",
        "0xd69906245565a910",
        "0xf40e35855771202a",
        "0x106aa07032bbd1b8",
        "0x19a4c116b8d2d0c8",
        "0x1e376c085141ab53",
        "0x2748774cdf8eeb99",
        "0x34b0bcb5e19b48a8",
        "0x391c0cb3c5c95a63",
        "0x4ed8aa4ae3418acb",
        "0x5b9cca4f7763e373",
        "0x682e6ff3d6b2b8a3",
        "0x748f82ee5defb2fc",
        "0x78a5636f43172f60",
        "0x84c87814a1f0ab72",
        "0x8cc702081a6439ec",
        "0x90befffa23631e28",
        "0xa4506cebde82bde9",
        "0xbef9a3f7b2c67915",
        "0xc67178f2e372532b",
        "0xca273eceea26619c",
        "0xd186b8c721c0c207",
        "0xeada7dd6cde0eb1e",
        "0xf57d4f7fee6ed178",
        "0x06f067aa72176fba",
        "0x0a637dc5a2c898a6",
        "0x113f9804bef90dae",
        "0x1b710b35131c471b",
        "0x28db77f523047d84",
        "0x32caab7b40c72493",
        "0x3c9ebe0a15c9bebc",
        "0x431d67c49c100d4c",
        "0x4cc5d4becb3e42b6",
        "0x597f299cfc657e2a",
        "0x5fcb6fab3ad6faec",
        "0x6c44198c4a475817"
      ].map((n) => BigInt(n)));
      var SHA512_W_H2 = new Uint32Array(80);
      var SHA512_W_L2 = new Uint32Array(80);
      var SHA5122 = class extends _sha2_js_1.SHA2 {
        constructor() {
          super(128, 64, 16, false);
          this.Ah = 1779033703 | 0;
          this.Al = 4089235720 | 0;
          this.Bh = 3144134277 | 0;
          this.Bl = 2227873595 | 0;
          this.Ch = 1013904242 | 0;
          this.Cl = 4271175723 | 0;
          this.Dh = 2773480762 | 0;
          this.Dl = 1595750129 | 0;
          this.Eh = 1359893119 | 0;
          this.El = 2917565137 | 0;
          this.Fh = 2600822924 | 0;
          this.Fl = 725511199 | 0;
          this.Gh = 528734635 | 0;
          this.Gl = 4215389547 | 0;
          this.Hh = 1541459225 | 0;
          this.Hl = 327033209 | 0;
        }
        get() {
          const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
          return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
        }
        set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
          this.Ah = Ah | 0;
          this.Al = Al | 0;
          this.Bh = Bh | 0;
          this.Bl = Bl | 0;
          this.Ch = Ch | 0;
          this.Cl = Cl | 0;
          this.Dh = Dh | 0;
          this.Dl = Dl | 0;
          this.Eh = Eh | 0;
          this.El = El | 0;
          this.Fh = Fh | 0;
          this.Fl = Fl | 0;
          this.Gh = Gh | 0;
          this.Gl = Gl | 0;
          this.Hh = Hh | 0;
          this.Hl = Hl | 0;
        }
        process(view, offset) {
          for (let i = 0; i < 16; i++, offset += 4) {
            SHA512_W_H2[i] = view.getUint32(offset);
            SHA512_W_L2[i] = view.getUint32(offset += 4);
          }
          for (let i = 16; i < 80; i++) {
            const W15h = SHA512_W_H2[i - 15] | 0;
            const W15l = SHA512_W_L2[i - 15] | 0;
            const s0h = _u64_js_1.default.rotrSH(W15h, W15l, 1) ^ _u64_js_1.default.rotrSH(W15h, W15l, 8) ^ _u64_js_1.default.shrSH(W15h, W15l, 7);
            const s0l = _u64_js_1.default.rotrSL(W15h, W15l, 1) ^ _u64_js_1.default.rotrSL(W15h, W15l, 8) ^ _u64_js_1.default.shrSL(W15h, W15l, 7);
            const W2h = SHA512_W_H2[i - 2] | 0;
            const W2l = SHA512_W_L2[i - 2] | 0;
            const s1h = _u64_js_1.default.rotrSH(W2h, W2l, 19) ^ _u64_js_1.default.rotrBH(W2h, W2l, 61) ^ _u64_js_1.default.shrSH(W2h, W2l, 6);
            const s1l = _u64_js_1.default.rotrSL(W2h, W2l, 19) ^ _u64_js_1.default.rotrBL(W2h, W2l, 61) ^ _u64_js_1.default.shrSL(W2h, W2l, 6);
            const SUMl = _u64_js_1.default.add4L(s0l, s1l, SHA512_W_L2[i - 7], SHA512_W_L2[i - 16]);
            const SUMh = _u64_js_1.default.add4H(SUMl, s0h, s1h, SHA512_W_H2[i - 7], SHA512_W_H2[i - 16]);
            SHA512_W_H2[i] = SUMh | 0;
            SHA512_W_L2[i] = SUMl | 0;
          }
          let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
          for (let i = 0; i < 80; i++) {
            const sigma1h = _u64_js_1.default.rotrSH(Eh, El, 14) ^ _u64_js_1.default.rotrSH(Eh, El, 18) ^ _u64_js_1.default.rotrBH(Eh, El, 41);
            const sigma1l = _u64_js_1.default.rotrSL(Eh, El, 14) ^ _u64_js_1.default.rotrSL(Eh, El, 18) ^ _u64_js_1.default.rotrBL(Eh, El, 41);
            const CHIh = Eh & Fh ^ ~Eh & Gh;
            const CHIl = El & Fl ^ ~El & Gl;
            const T1ll = _u64_js_1.default.add5L(Hl, sigma1l, CHIl, SHA512_Kl2[i], SHA512_W_L2[i]);
            const T1h = _u64_js_1.default.add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh2[i], SHA512_W_H2[i]);
            const T1l = T1ll | 0;
            const sigma0h = _u64_js_1.default.rotrSH(Ah, Al, 28) ^ _u64_js_1.default.rotrBH(Ah, Al, 34) ^ _u64_js_1.default.rotrBH(Ah, Al, 39);
            const sigma0l = _u64_js_1.default.rotrSL(Ah, Al, 28) ^ _u64_js_1.default.rotrBL(Ah, Al, 34) ^ _u64_js_1.default.rotrBL(Ah, Al, 39);
            const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
            const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
            Hh = Gh | 0;
            Hl = Gl | 0;
            Gh = Fh | 0;
            Gl = Fl | 0;
            Fh = Eh | 0;
            Fl = El | 0;
            ({ h: Eh, l: El } = _u64_js_1.default.add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
            Dh = Ch | 0;
            Dl = Cl | 0;
            Ch = Bh | 0;
            Cl = Bl | 0;
            Bh = Ah | 0;
            Bl = Al | 0;
            const All = _u64_js_1.default.add3L(T1l, sigma0l, MAJl);
            Ah = _u64_js_1.default.add3H(All, T1h, sigma0h, MAJh);
            Al = All | 0;
          }
          ({ h: Ah, l: Al } = _u64_js_1.default.add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
          ({ h: Bh, l: Bl } = _u64_js_1.default.add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
          ({ h: Ch, l: Cl } = _u64_js_1.default.add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
          ({ h: Dh, l: Dl } = _u64_js_1.default.add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
          ({ h: Eh, l: El } = _u64_js_1.default.add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
          ({ h: Fh, l: Fl } = _u64_js_1.default.add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
          ({ h: Gh, l: Gl } = _u64_js_1.default.add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
          ({ h: Hh, l: Hl } = _u64_js_1.default.add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
          this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
        }
        roundClean() {
          SHA512_W_H2.fill(0);
          SHA512_W_L2.fill(0);
        }
        destroy() {
          this.buffer.fill(0);
          this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        }
      };
      exports.SHA512 = SHA5122;
      var SHA512_2242 = class extends SHA5122 {
        constructor() {
          super();
          this.Ah = 2352822216 | 0;
          this.Al = 424955298 | 0;
          this.Bh = 1944164710 | 0;
          this.Bl = 2312950998 | 0;
          this.Ch = 502970286 | 0;
          this.Cl = 855612546 | 0;
          this.Dh = 1738396948 | 0;
          this.Dl = 1479516111 | 0;
          this.Eh = 258812777 | 0;
          this.El = 2077511080 | 0;
          this.Fh = 2011393907 | 0;
          this.Fl = 79989058 | 0;
          this.Gh = 1067287976 | 0;
          this.Gl = 1780299464 | 0;
          this.Hh = 286451373 | 0;
          this.Hl = 2446758561 | 0;
          this.outputLen = 28;
        }
      };
      var SHA512_2562 = class extends SHA5122 {
        constructor() {
          super();
          this.Ah = 573645204 | 0;
          this.Al = 4230739756 | 0;
          this.Bh = 2673172387 | 0;
          this.Bl = 3360449730 | 0;
          this.Ch = 596883563 | 0;
          this.Cl = 1867755857 | 0;
          this.Dh = 2520282905 | 0;
          this.Dl = 1497426621 | 0;
          this.Eh = 2519219938 | 0;
          this.El = 2827943907 | 0;
          this.Fh = 3193839141 | 0;
          this.Fl = 1401305490 | 0;
          this.Gh = 721525244 | 0;
          this.Gl = 746961066 | 0;
          this.Hh = 246885852 | 0;
          this.Hl = 2177182882 | 0;
          this.outputLen = 32;
        }
      };
      var SHA3842 = class extends SHA5122 {
        constructor() {
          super();
          this.Ah = 3418070365 | 0;
          this.Al = 3238371032 | 0;
          this.Bh = 1654270250 | 0;
          this.Bl = 914150663 | 0;
          this.Ch = 2438529370 | 0;
          this.Cl = 812702999 | 0;
          this.Dh = 355462360 | 0;
          this.Dl = 4144912697 | 0;
          this.Eh = 1731405415 | 0;
          this.El = 4290775857 | 0;
          this.Fh = 2394180231 | 0;
          this.Fl = 1750603025 | 0;
          this.Gh = 3675008525 | 0;
          this.Gl = 1694076839 | 0;
          this.Hh = 1203062813 | 0;
          this.Hl = 3204075428 | 0;
          this.outputLen = 48;
        }
      };
      exports.sha512 = (0, utils_js_1.wrapConstructor)(() => new SHA5122());
      exports.sha512_224 = (0, utils_js_1.wrapConstructor)(() => new SHA512_2242());
      exports.sha512_256 = (0, utils_js_1.wrapConstructor)(() => new SHA512_2562());
      exports.sha384 = (0, utils_js_1.wrapConstructor)(() => new SHA3842());
    }
  });

  // node_modules/@scure/base/lib/index.js
  var require_lib = __commonJS({
    "node_modules/@scure/base/lib/index.js"(exports) {
      "use strict";
      init_define_process();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.bytes = exports.stringToBytes = exports.str = exports.bytesToString = exports.hex = exports.utf8 = exports.bech32m = exports.bech32 = exports.base58check = exports.base58xmr = exports.base58xrp = exports.base58flickr = exports.base58 = exports.base64url = exports.base64 = exports.base32crockford = exports.base32hex = exports.base32 = exports.base16 = exports.utils = exports.assertNumber = void 0;
      function assertNumber3(n) {
        if (!Number.isSafeInteger(n))
          throw new Error(`Wrong integer: ${n}`);
      }
      exports.assertNumber = assertNumber3;
      function chain2(...args) {
        const wrap = (a, b) => (c) => a(b(c));
        const encode = Array.from(args).reverse().reduce((acc, i) => acc ? wrap(acc, i.encode) : i.encode, void 0);
        const decode2 = args.reduce((acc, i) => acc ? wrap(acc, i.decode) : i.decode, void 0);
        return { encode, decode: decode2 };
      }
      function alphabet2(alphabet3) {
        return {
          encode: (digits) => {
            if (!Array.isArray(digits) || digits.length && typeof digits[0] !== "number")
              throw new Error("alphabet.encode input should be an array of numbers");
            return digits.map((i) => {
              assertNumber3(i);
              if (i < 0 || i >= alphabet3.length)
                throw new Error(`Digit index outside alphabet: ${i} (alphabet: ${alphabet3.length})`);
              return alphabet3[i];
            });
          },
          decode: (input) => {
            if (!Array.isArray(input) || input.length && typeof input[0] !== "string")
              throw new Error("alphabet.decode input should be array of strings");
            return input.map((letter) => {
              if (typeof letter !== "string")
                throw new Error(`alphabet.decode: not string element=${letter}`);
              const index = alphabet3.indexOf(letter);
              if (index === -1)
                throw new Error(`Unknown letter: "${letter}". Allowed: ${alphabet3}`);
              return index;
            });
          }
        };
      }
      function join2(separator = "") {
        if (typeof separator !== "string")
          throw new Error("join separator should be string");
        return {
          encode: (from) => {
            if (!Array.isArray(from) || from.length && typeof from[0] !== "string")
              throw new Error("join.encode input should be array of strings");
            for (let i of from)
              if (typeof i !== "string")
                throw new Error(`join.encode: non-string input=${i}`);
            return from.join(separator);
          },
          decode: (to) => {
            if (typeof to !== "string")
              throw new Error("join.decode input should be string");
            return to.split(separator);
          }
        };
      }
      function padding2(bits, chr = "=") {
        assertNumber3(bits);
        if (typeof chr !== "string")
          throw new Error("padding chr should be string");
        return {
          encode(data) {
            if (!Array.isArray(data) || data.length && typeof data[0] !== "string")
              throw new Error("padding.encode input should be array of strings");
            for (let i of data)
              if (typeof i !== "string")
                throw new Error(`padding.encode: non-string input=${i}`);
            while (data.length * bits % 8)
              data.push(chr);
            return data;
          },
          decode(input) {
            if (!Array.isArray(input) || input.length && typeof input[0] !== "string")
              throw new Error("padding.encode input should be array of strings");
            for (let i of input)
              if (typeof i !== "string")
                throw new Error(`padding.decode: non-string input=${i}`);
            let end = input.length;
            if (end * bits % 8)
              throw new Error("Invalid padding: string should have whole number of bytes");
            for (; end > 0 && input[end - 1] === chr; end--) {
              if (!((end - 1) * bits % 8))
                throw new Error("Invalid padding: string has too much padding");
            }
            return input.slice(0, end);
          }
        };
      }
      function normalize2(fn) {
        if (typeof fn !== "function")
          throw new Error("normalize fn should be function");
        return { encode: (from) => from, decode: (to) => fn(to) };
      }
      function convertRadix3(data, from, to) {
        if (from < 2)
          throw new Error(`convertRadix: wrong from=${from}, base cannot be less than 2`);
        if (to < 2)
          throw new Error(`convertRadix: wrong to=${to}, base cannot be less than 2`);
        if (!Array.isArray(data))
          throw new Error("convertRadix: data should be array");
        if (!data.length)
          return [];
        let pos = 0;
        const res = [];
        const digits = Array.from(data);
        digits.forEach((d) => {
          assertNumber3(d);
          if (d < 0 || d >= from)
            throw new Error(`Wrong integer: ${d}`);
        });
        while (true) {
          let carry = 0;
          let done = true;
          for (let i = pos; i < digits.length; i++) {
            const digit = digits[i];
            const digitBase = from * carry + digit;
            if (!Number.isSafeInteger(digitBase) || from * carry / from !== carry || digitBase - digit !== from * carry) {
              throw new Error("convertRadix: carry overflow");
            }
            carry = digitBase % to;
            digits[i] = Math.floor(digitBase / to);
            if (!Number.isSafeInteger(digits[i]) || digits[i] * to + carry !== digitBase)
              throw new Error("convertRadix: carry overflow");
            if (!done)
              continue;
            else if (!digits[i])
              pos = i;
            else
              done = false;
          }
          res.push(carry);
          if (done)
            break;
        }
        for (let i = 0; i < data.length - 1 && data[i] === 0; i++)
          res.push(0);
        return res.reverse();
      }
      var gcd2 = (a, b) => !b ? a : gcd2(b, a % b);
      var radix2carry2 = (from, to) => from + (to - gcd2(from, to));
      function convertRadix22(data, from, to, padding3) {
        if (!Array.isArray(data))
          throw new Error("convertRadix2: data should be array");
        if (from <= 0 || from > 32)
          throw new Error(`convertRadix2: wrong from=${from}`);
        if (to <= 0 || to > 32)
          throw new Error(`convertRadix2: wrong to=${to}`);
        if (radix2carry2(from, to) > 32) {
          throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${radix2carry2(from, to)}`);
        }
        let carry = 0;
        let pos = 0;
        const mask = 2 ** to - 1;
        const res = [];
        for (const n of data) {
          assertNumber3(n);
          if (n >= 2 ** from)
            throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
          carry = carry << from | n;
          if (pos + from > 32)
            throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
          pos += from;
          for (; pos >= to; pos -= to)
            res.push((carry >> pos - to & mask) >>> 0);
          carry &= 2 ** pos - 1;
        }
        carry = carry << to - pos & mask;
        if (!padding3 && pos >= from)
          throw new Error("Excess padding");
        if (!padding3 && carry)
          throw new Error(`Non-zero padding: ${carry}`);
        if (padding3 && pos > 0)
          res.push(carry >>> 0);
        return res;
      }
      function radix3(num) {
        assertNumber3(num);
        return {
          encode: (bytes2) => {
            if (!(bytes2 instanceof Uint8Array))
              throw new Error("radix.encode input should be Uint8Array");
            return convertRadix3(Array.from(bytes2), 2 ** 8, num);
          },
          decode: (digits) => {
            if (!Array.isArray(digits) || digits.length && typeof digits[0] !== "number")
              throw new Error("radix.decode input should be array of strings");
            return Uint8Array.from(convertRadix3(digits, num, 2 ** 8));
          }
        };
      }
      function radix22(bits, revPadding = false) {
        assertNumber3(bits);
        if (bits <= 0 || bits > 32)
          throw new Error("radix2: bits should be in (0..32]");
        if (radix2carry2(8, bits) > 32 || radix2carry2(bits, 8) > 32)
          throw new Error("radix2: carry overflow");
        return {
          encode: (bytes2) => {
            if (!(bytes2 instanceof Uint8Array))
              throw new Error("radix2.encode input should be Uint8Array");
            return convertRadix22(Array.from(bytes2), 8, bits, !revPadding);
          },
          decode: (digits) => {
            if (!Array.isArray(digits) || digits.length && typeof digits[0] !== "number")
              throw new Error("radix2.decode input should be array of strings");
            return Uint8Array.from(convertRadix22(digits, bits, 8, revPadding));
          }
        };
      }
      function unsafeWrapper2(fn) {
        if (typeof fn !== "function")
          throw new Error("unsafeWrapper fn should be function");
        return function(...args) {
          try {
            return fn.apply(null, args);
          } catch (e) {
          }
        };
      }
      function checksum2(len, fn) {
        assertNumber3(len);
        if (typeof fn !== "function")
          throw new Error("checksum fn should be function");
        return {
          encode(data) {
            if (!(data instanceof Uint8Array))
              throw new Error("checksum.encode: input should be Uint8Array");
            const checksum3 = fn(data).slice(0, len);
            const res = new Uint8Array(data.length + len);
            res.set(data);
            res.set(checksum3, data.length);
            return res;
          },
          decode(data) {
            if (!(data instanceof Uint8Array))
              throw new Error("checksum.decode: input should be Uint8Array");
            const payload = data.slice(0, -len);
            const newChecksum = fn(payload).slice(0, len);
            const oldChecksum = data.slice(-len);
            for (let i = 0; i < len; i++)
              if (newChecksum[i] !== oldChecksum[i])
                throw new Error("Invalid checksum");
            return payload;
          }
        };
      }
      exports.utils = { alphabet: alphabet2, chain: chain2, checksum: checksum2, radix: radix3, radix2: radix22, join: join2, padding: padding2 };
      exports.base16 = chain2(radix22(4), alphabet2("0123456789ABCDEF"), join2(""));
      exports.base32 = chain2(radix22(5), alphabet2("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"), padding2(5), join2(""));
      exports.base32hex = chain2(radix22(5), alphabet2("0123456789ABCDEFGHIJKLMNOPQRSTUV"), padding2(5), join2(""));
      exports.base32crockford = chain2(radix22(5), alphabet2("0123456789ABCDEFGHJKMNPQRSTVWXYZ"), join2(""), normalize2((s) => s.toUpperCase().replace(/O/g, "0").replace(/[IL]/g, "1")));
      exports.base64 = chain2(radix22(6), alphabet2("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"), padding2(6), join2(""));
      exports.base64url = chain2(radix22(6), alphabet2("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"), padding2(6), join2(""));
      var genBase582 = (abc) => chain2(radix3(58), alphabet2(abc), join2(""));
      exports.base58 = genBase582("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
      exports.base58flickr = genBase582("123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ");
      exports.base58xrp = genBase582("rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz");
      var XMR_BLOCK_LEN2 = [0, 2, 3, 5, 6, 7, 9, 10, 11];
      exports.base58xmr = {
        encode(data) {
          let res = "";
          for (let i = 0; i < data.length; i += 8) {
            const block = data.subarray(i, i + 8);
            res += exports.base58.encode(block).padStart(XMR_BLOCK_LEN2[block.length], "1");
          }
          return res;
        },
        decode(str) {
          let res = [];
          for (let i = 0; i < str.length; i += 11) {
            const slice = str.slice(i, i + 11);
            const blockLen = XMR_BLOCK_LEN2.indexOf(slice.length);
            const block = exports.base58.decode(slice);
            for (let j = 0; j < block.length - blockLen; j++) {
              if (block[j] !== 0)
                throw new Error("base58xmr: wrong padding");
            }
            res = res.concat(Array.from(block.slice(block.length - blockLen)));
          }
          return Uint8Array.from(res);
        }
      };
      var base58check3 = (sha2563) => chain2(checksum2(4, (data) => sha2563(sha2563(data))), exports.base58);
      exports.base58check = base58check3;
      var BECH_ALPHABET2 = chain2(alphabet2("qpzry9x8gf2tvdw0s3jn54khce6mua7l"), join2(""));
      var POLYMOD_GENERATORS2 = [996825010, 642813549, 513874426, 1027748829, 705979059];
      function bech32Polymod2(pre) {
        const b = pre >> 25;
        let chk = (pre & 33554431) << 5;
        for (let i = 0; i < POLYMOD_GENERATORS2.length; i++) {
          if ((b >> i & 1) === 1)
            chk ^= POLYMOD_GENERATORS2[i];
        }
        return chk;
      }
      function bechChecksum2(prefix, words, encodingConst = 1) {
        const len = prefix.length;
        let chk = 1;
        for (let i = 0; i < len; i++) {
          const c = prefix.charCodeAt(i);
          if (c < 33 || c > 126)
            throw new Error(`Invalid prefix (${prefix})`);
          chk = bech32Polymod2(chk) ^ c >> 5;
        }
        chk = bech32Polymod2(chk);
        for (let i = 0; i < len; i++)
          chk = bech32Polymod2(chk) ^ prefix.charCodeAt(i) & 31;
        for (let v of words)
          chk = bech32Polymod2(chk) ^ v;
        for (let i = 0; i < 6; i++)
          chk = bech32Polymod2(chk);
        chk ^= encodingConst;
        return BECH_ALPHABET2.encode(convertRadix22([chk % 2 ** 30], 30, 5, false));
      }
      function genBech322(encoding) {
        const ENCODING_CONST = encoding === "bech32" ? 1 : 734539939;
        const _words = radix22(5);
        const fromWords = _words.decode;
        const toWords = _words.encode;
        const fromWordsUnsafe = unsafeWrapper2(fromWords);
        function encode(prefix, words, limit = 90) {
          if (typeof prefix !== "string")
            throw new Error(`bech32.encode prefix should be string, not ${typeof prefix}`);
          if (!Array.isArray(words) || words.length && typeof words[0] !== "number")
            throw new Error(`bech32.encode words should be array of numbers, not ${typeof words}`);
          const actualLength = prefix.length + 7 + words.length;
          if (limit !== false && actualLength > limit)
            throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
          prefix = prefix.toLowerCase();
          return `${prefix}1${BECH_ALPHABET2.encode(words)}${bechChecksum2(prefix, words, ENCODING_CONST)}`;
        }
        function decode2(str, limit = 90) {
          if (typeof str !== "string")
            throw new Error(`bech32.decode input should be string, not ${typeof str}`);
          if (str.length < 8 || limit !== false && str.length > limit)
            throw new TypeError(`Wrong string length: ${str.length} (${str}). Expected (8..${limit})`);
          const lowered = str.toLowerCase();
          if (str !== lowered && str !== str.toUpperCase())
            throw new Error(`String must be lowercase or uppercase`);
          str = lowered;
          const sepIndex = str.lastIndexOf("1");
          if (sepIndex === 0 || sepIndex === -1)
            throw new Error(`Letter "1" must be present between prefix and data only`);
          const prefix = str.slice(0, sepIndex);
          const _words2 = str.slice(sepIndex + 1);
          if (_words2.length < 6)
            throw new Error("Data must be at least 6 characters long");
          const words = BECH_ALPHABET2.decode(_words2).slice(0, -6);
          const sum = bechChecksum2(prefix, words, ENCODING_CONST);
          if (!_words2.endsWith(sum))
            throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
          return { prefix, words };
        }
        const decodeUnsafe = unsafeWrapper2(decode2);
        function decodeToBytes(str) {
          const { prefix, words } = decode2(str, false);
          return { prefix, words, bytes: fromWords(words) };
        }
        return { encode, decode: decode2, decodeToBytes, decodeUnsafe, fromWords, fromWordsUnsafe, toWords };
      }
      exports.bech32 = genBech322("bech32");
      exports.bech32m = genBech322("bech32m");
      exports.utf8 = {
        encode: (data) => new TextDecoder().decode(data),
        decode: (str) => new TextEncoder().encode(str)
      };
      exports.hex = chain2(radix22(4), alphabet2("0123456789abcdef"), join2(""), normalize2((s) => {
        if (typeof s !== "string" || s.length % 2)
          throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
        return s.toLowerCase();
      }));
      var CODERS2 = {
        utf8: exports.utf8,
        hex: exports.hex,
        base16: exports.base16,
        base32: exports.base32,
        base64: exports.base64,
        base64url: exports.base64url,
        base58: exports.base58,
        base58xmr: exports.base58xmr
      };
      var coderTypeError2 = `Invalid encoding type. Available types: ${Object.keys(CODERS2).join(", ")}`;
      var bytesToString = (type, bytes2) => {
        if (typeof type !== "string" || !CODERS2.hasOwnProperty(type))
          throw new TypeError(coderTypeError2);
        if (!(bytes2 instanceof Uint8Array))
          throw new TypeError("bytesToString() expects Uint8Array");
        return CODERS2[type].encode(bytes2);
      };
      exports.bytesToString = bytesToString;
      exports.str = exports.bytesToString;
      var stringToBytes = (type, str) => {
        if (!CODERS2.hasOwnProperty(type))
          throw new TypeError(coderTypeError2);
        if (typeof str !== "string")
          throw new TypeError("stringToBytes() expects string");
        return CODERS2[type].decode(str);
      };
      exports.stringToBytes = stringToBytes;
      exports.bytes = exports.stringToBytes;
    }
  });

  // node_modules/@scure/bip39/index.js
  var require_bip39 = __commonJS({
    "node_modules/@scure/bip39/index.js"(exports) {
      "use strict";
      init_define_process();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.mnemonicToSeedSync = exports.mnemonicToSeed = exports.validateMnemonic = exports.entropyToMnemonic = exports.mnemonicToEntropy = exports.generateMnemonic = void 0;
      var _assert_1 = require_assert();
      var pbkdf2_1 = require_pbkdf2();
      var sha256_1 = require_sha256();
      var sha512_1 = require_sha512();
      var utils_1 = require_utils();
      var base_1 = require_lib();
      var isJapanese = (wordlist2) => wordlist2[0] === "\u3042\u3044\u3053\u304F\u3057\u3093";
      function nfkd(str) {
        if (typeof str !== "string")
          throw new TypeError(`Invalid mnemonic type: ${typeof str}`);
        return str.normalize("NFKD");
      }
      function normalize2(str) {
        const norm = nfkd(str);
        const words = norm.split(" ");
        if (![12, 15, 18, 21, 24].includes(words.length))
          throw new Error("Invalid mnemonic");
        return { nfkd: norm, words };
      }
      function assertEntropy(entropy) {
        _assert_1.default.bytes(entropy, 16, 20, 24, 28, 32);
      }
      function generateMnemonic2(wordlist2, strength = 128) {
        _assert_1.default.number(strength);
        if (strength % 32 !== 0 || strength > 256)
          throw new TypeError("Invalid entropy");
        return entropyToMnemonic((0, utils_1.randomBytes)(strength / 8), wordlist2);
      }
      exports.generateMnemonic = generateMnemonic2;
      var calcChecksum = (entropy) => {
        const bitsLeft = 8 - entropy.length / 4;
        return new Uint8Array([(0, sha256_1.sha256)(entropy)[0] >> bitsLeft << bitsLeft]);
      };
      function getCoder(wordlist2) {
        if (!Array.isArray(wordlist2) || wordlist2.length !== 2048 || typeof wordlist2[0] !== "string")
          throw new Error("Worlist: expected array of 2048 strings");
        wordlist2.forEach((i) => {
          if (typeof i !== "string")
            throw new Error(`Wordlist: non-string element: ${i}`);
        });
        return base_1.utils.chain(base_1.utils.checksum(1, calcChecksum), base_1.utils.radix2(11, true), base_1.utils.alphabet(wordlist2));
      }
      function mnemonicToEntropy(mnemonic, wordlist2) {
        const { words } = normalize2(mnemonic);
        const entropy = getCoder(wordlist2).decode(words);
        assertEntropy(entropy);
        return entropy;
      }
      exports.mnemonicToEntropy = mnemonicToEntropy;
      function entropyToMnemonic(entropy, wordlist2) {
        assertEntropy(entropy);
        const words = getCoder(wordlist2).encode(entropy);
        return words.join(isJapanese(wordlist2) ? "\u3000" : " ");
      }
      exports.entropyToMnemonic = entropyToMnemonic;
      function validateMnemonic2(mnemonic, wordlist2) {
        try {
          mnemonicToEntropy(mnemonic, wordlist2);
        } catch (e) {
          return false;
        }
        return true;
      }
      exports.validateMnemonic = validateMnemonic2;
      var salt = (passphrase) => nfkd(`mnemonic${passphrase}`);
      function mnemonicToSeed(mnemonic, passphrase = "") {
        return (0, pbkdf2_1.pbkdf2Async)(sha512_1.sha512, normalize2(mnemonic).nfkd, salt(passphrase), { c: 2048, dkLen: 64 });
      }
      exports.mnemonicToSeed = mnemonicToSeed;
      function mnemonicToSeedSync2(mnemonic, passphrase = "") {
        return (0, pbkdf2_1.pbkdf2)(sha512_1.sha512, normalize2(mnemonic).nfkd, salt(passphrase), { c: 2048, dkLen: 64 });
      }
      exports.mnemonicToSeedSync = mnemonicToSeedSync2;
    }
  });

  // index.ts
  var nostr_relaypool_ts_exports = {};
  __export(nostr_relaypool_ts_exports, {
    Author: () => Author,
    RelayPool: () => RelayPool,
    collect: () => collect,
    emitEventsOnNextTick: () => emitEventsOnNextTick
  });
  init_define_process();

  // relay-pool.ts
  init_define_process();

  // merge-similar-filters.ts
  init_define_process();

  // node_modules/safe-stable-stringify/esm/wrapper.js
  init_define_process();
  var import__ = __toESM(require_safe_stable_stringify(), 1);
  var configure = import__.default.configure;
  var stringify = import__.default;

  // merge-similar-filters.ts
  function indexForFilter(filter, key) {
    let new_filter = { ...filter };
    delete new_filter[key];
    return key + stringify(new_filter);
  }
  function mergeSimilarAndRemoveEmptyFilters(filters) {
    let r = [];
    let indexByFilter = /* @__PURE__ */ new Map();
    for (let filter of filters) {
      let added = false;
      for (let key in filter) {
        if (filter[key] && (["ids", "authors", "kinds"].includes(key) || key.startsWith("#"))) {
          if (filter[key].length === 0) {
            added = true;
            break;
          }
          let index_by = indexForFilter(filter, key);
          let index = indexByFilter.get(index_by);
          if (index !== void 0) {
            let extendedFilter = r[index];
            for (let key2 in extendedFilter) {
              if (key2 !== key) {
                let index_by2 = indexForFilter(extendedFilter, key2);
                indexByFilter.delete(index_by2);
              }
            }
            r[index][key] = [...new Set(r[index][key].concat(filter[key]))];
            added = true;
            break;
          }
        }
      }
      if (!added) {
        for (let key in filter) {
          if (filter[key] && (["ids", "authors", "kinds"].includes(key) || key.startsWith("#"))) {
            let index_by = indexForFilter(filter, key);
            indexByFilter.set(index_by, r.length);
          }
        }
        r.push({ ...filter });
      }
    }
    return r;
  }

  // relay.ts
  init_define_process();

  // node_modules/nostr-tools/lib/esm/nostr.mjs
  init_define_process();

  // node_modules/@noble/secp256k1/lib/esm/index.js
  init_define_process();
  var nodeCrypto = __toESM(require_crypto(), 1);
  var _0n = BigInt(0);
  var _1n = BigInt(1);
  var _2n = BigInt(2);
  var _3n = BigInt(3);
  var _8n = BigInt(8);
  var CURVE = Object.freeze({
    a: _0n,
    b: BigInt(7),
    P: BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f"),
    n: BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"),
    h: _1n,
    Gx: BigInt("55066263022277343669578718895168534326250603453777594175500187360389116729240"),
    Gy: BigInt("32670510020758816978083085130507043184471273380659243275938904335757337482424"),
    beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee")
  });
  var divNearest = (a, b) => (a + b / _2n) / b;
  var endo = {
    beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
    splitScalar(k) {
      const { n } = CURVE;
      const a1 = BigInt("0x3086d221a7d46bcde86c90e49284eb15");
      const b1 = -_1n * BigInt("0xe4437ed6010e88286f547fa90abfe4c3");
      const a2 = BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8");
      const b2 = a1;
      const POW_2_128 = BigInt("0x100000000000000000000000000000000");
      const c1 = divNearest(b2 * k, n);
      const c2 = divNearest(-b1 * k, n);
      let k1 = mod(k - c1 * a1 - c2 * a2, n);
      let k2 = mod(-c1 * b1 - c2 * b2, n);
      const k1neg = k1 > POW_2_128;
      const k2neg = k2 > POW_2_128;
      if (k1neg)
        k1 = n - k1;
      if (k2neg)
        k2 = n - k2;
      if (k1 > POW_2_128 || k2 > POW_2_128) {
        throw new Error("splitScalarEndo: Endomorphism failed, k=" + k);
      }
      return { k1neg, k1, k2neg, k2 };
    }
  };
  var fieldLen = 32;
  var groupLen = 32;
  var hashLen = 32;
  var compressedLen = fieldLen + 1;
  var uncompressedLen = 2 * fieldLen + 1;
  function weierstrass(x) {
    const { a, b } = CURVE;
    const x2 = mod(x * x);
    const x3 = mod(x2 * x);
    return mod(x3 + a * x + b);
  }
  var USE_ENDOMORPHISM = CURVE.a === _0n;
  var ShaError = class extends Error {
    constructor(message) {
      super(message);
    }
  };
  function assertJacPoint(other) {
    if (!(other instanceof JacobianPoint))
      throw new TypeError("JacobianPoint expected");
  }
  var JacobianPoint = class {
    constructor(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    static fromAffine(p) {
      if (!(p instanceof Point)) {
        throw new TypeError("JacobianPoint#fromAffine: expected Point");
      }
      if (p.equals(Point.ZERO))
        return JacobianPoint.ZERO;
      return new JacobianPoint(p.x, p.y, _1n);
    }
    static toAffineBatch(points) {
      const toInv = invertBatch(points.map((p) => p.z));
      return points.map((p, i) => p.toAffine(toInv[i]));
    }
    static normalizeZ(points) {
      return JacobianPoint.toAffineBatch(points).map(JacobianPoint.fromAffine);
    }
    equals(other) {
      assertJacPoint(other);
      const { x: X1, y: Y1, z: Z1 } = this;
      const { x: X2, y: Y2, z: Z2 } = other;
      const Z1Z1 = mod(Z1 * Z1);
      const Z2Z2 = mod(Z2 * Z2);
      const U1 = mod(X1 * Z2Z2);
      const U2 = mod(X2 * Z1Z1);
      const S1 = mod(mod(Y1 * Z2) * Z2Z2);
      const S2 = mod(mod(Y2 * Z1) * Z1Z1);
      return U1 === U2 && S1 === S2;
    }
    negate() {
      return new JacobianPoint(this.x, mod(-this.y), this.z);
    }
    double() {
      const { x: X1, y: Y1, z: Z1 } = this;
      const A = mod(X1 * X1);
      const B = mod(Y1 * Y1);
      const C = mod(B * B);
      const x1b = X1 + B;
      const D = mod(_2n * (mod(x1b * x1b) - A - C));
      const E = mod(_3n * A);
      const F = mod(E * E);
      const X3 = mod(F - _2n * D);
      const Y3 = mod(E * (D - X3) - _8n * C);
      const Z3 = mod(_2n * Y1 * Z1);
      return new JacobianPoint(X3, Y3, Z3);
    }
    add(other) {
      assertJacPoint(other);
      const { x: X1, y: Y1, z: Z1 } = this;
      const { x: X2, y: Y2, z: Z2 } = other;
      if (X2 === _0n || Y2 === _0n)
        return this;
      if (X1 === _0n || Y1 === _0n)
        return other;
      const Z1Z1 = mod(Z1 * Z1);
      const Z2Z2 = mod(Z2 * Z2);
      const U1 = mod(X1 * Z2Z2);
      const U2 = mod(X2 * Z1Z1);
      const S1 = mod(mod(Y1 * Z2) * Z2Z2);
      const S2 = mod(mod(Y2 * Z1) * Z1Z1);
      const H = mod(U2 - U1);
      const r = mod(S2 - S1);
      if (H === _0n) {
        if (r === _0n) {
          return this.double();
        } else {
          return JacobianPoint.ZERO;
        }
      }
      const HH = mod(H * H);
      const HHH = mod(H * HH);
      const V = mod(U1 * HH);
      const X3 = mod(r * r - HHH - _2n * V);
      const Y3 = mod(r * (V - X3) - S1 * HHH);
      const Z3 = mod(Z1 * Z2 * H);
      return new JacobianPoint(X3, Y3, Z3);
    }
    subtract(other) {
      return this.add(other.negate());
    }
    multiplyUnsafe(scalar) {
      const P0 = JacobianPoint.ZERO;
      if (typeof scalar === "bigint" && scalar === _0n)
        return P0;
      let n = normalizeScalar(scalar);
      if (n === _1n)
        return this;
      if (!USE_ENDOMORPHISM) {
        let p = P0;
        let d2 = this;
        while (n > _0n) {
          if (n & _1n)
            p = p.add(d2);
          d2 = d2.double();
          n >>= _1n;
        }
        return p;
      }
      let { k1neg, k1, k2neg, k2 } = endo.splitScalar(n);
      let k1p = P0;
      let k2p = P0;
      let d = this;
      while (k1 > _0n || k2 > _0n) {
        if (k1 & _1n)
          k1p = k1p.add(d);
        if (k2 & _1n)
          k2p = k2p.add(d);
        d = d.double();
        k1 >>= _1n;
        k2 >>= _1n;
      }
      if (k1neg)
        k1p = k1p.negate();
      if (k2neg)
        k2p = k2p.negate();
      k2p = new JacobianPoint(mod(k2p.x * endo.beta), k2p.y, k2p.z);
      return k1p.add(k2p);
    }
    precomputeWindow(W) {
      const windows = USE_ENDOMORPHISM ? 128 / W + 1 : 256 / W + 1;
      const points = [];
      let p = this;
      let base = p;
      for (let window2 = 0; window2 < windows; window2++) {
        base = p;
        points.push(base);
        for (let i = 1; i < 2 ** (W - 1); i++) {
          base = base.add(p);
          points.push(base);
        }
        p = base.double();
      }
      return points;
    }
    wNAF(n, affinePoint) {
      if (!affinePoint && this.equals(JacobianPoint.BASE))
        affinePoint = Point.BASE;
      const W = affinePoint && affinePoint._WINDOW_SIZE || 1;
      if (256 % W) {
        throw new Error("Point#wNAF: Invalid precomputation window, must be power of 2");
      }
      let precomputes = affinePoint && pointPrecomputes.get(affinePoint);
      if (!precomputes) {
        precomputes = this.precomputeWindow(W);
        if (affinePoint && W !== 1) {
          precomputes = JacobianPoint.normalizeZ(precomputes);
          pointPrecomputes.set(affinePoint, precomputes);
        }
      }
      let p = JacobianPoint.ZERO;
      let f2 = JacobianPoint.BASE;
      const windows = 1 + (USE_ENDOMORPHISM ? 128 / W : 256 / W);
      const windowSize = 2 ** (W - 1);
      const mask = BigInt(2 ** W - 1);
      const maxNumber = 2 ** W;
      const shiftBy = BigInt(W);
      for (let window2 = 0; window2 < windows; window2++) {
        const offset = window2 * windowSize;
        let wbits = Number(n & mask);
        n >>= shiftBy;
        if (wbits > windowSize) {
          wbits -= maxNumber;
          n += _1n;
        }
        const offset1 = offset;
        const offset2 = offset + Math.abs(wbits) - 1;
        const cond1 = window2 % 2 !== 0;
        const cond2 = wbits < 0;
        if (wbits === 0) {
          f2 = f2.add(constTimeNegate(cond1, precomputes[offset1]));
        } else {
          p = p.add(constTimeNegate(cond2, precomputes[offset2]));
        }
      }
      return { p, f: f2 };
    }
    multiply(scalar, affinePoint) {
      let n = normalizeScalar(scalar);
      let point;
      let fake;
      if (USE_ENDOMORPHISM) {
        const { k1neg, k1, k2neg, k2 } = endo.splitScalar(n);
        let { p: k1p, f: f1p } = this.wNAF(k1, affinePoint);
        let { p: k2p, f: f2p } = this.wNAF(k2, affinePoint);
        k1p = constTimeNegate(k1neg, k1p);
        k2p = constTimeNegate(k2neg, k2p);
        k2p = new JacobianPoint(mod(k2p.x * endo.beta), k2p.y, k2p.z);
        point = k1p.add(k2p);
        fake = f1p.add(f2p);
      } else {
        const { p, f: f2 } = this.wNAF(n, affinePoint);
        point = p;
        fake = f2;
      }
      return JacobianPoint.normalizeZ([point, fake])[0];
    }
    toAffine(invZ) {
      const { x, y, z } = this;
      const is0 = this.equals(JacobianPoint.ZERO);
      if (invZ == null)
        invZ = is0 ? _8n : invert(z);
      const iz1 = invZ;
      const iz2 = mod(iz1 * iz1);
      const iz3 = mod(iz2 * iz1);
      const ax = mod(x * iz2);
      const ay = mod(y * iz3);
      const zz = mod(z * iz1);
      if (is0)
        return Point.ZERO;
      if (zz !== _1n)
        throw new Error("invZ was invalid");
      return new Point(ax, ay);
    }
  };
  JacobianPoint.BASE = new JacobianPoint(CURVE.Gx, CURVE.Gy, _1n);
  JacobianPoint.ZERO = new JacobianPoint(_0n, _1n, _0n);
  function constTimeNegate(condition, item) {
    const neg = item.negate();
    return condition ? neg : item;
  }
  var pointPrecomputes = /* @__PURE__ */ new WeakMap();
  var Point = class {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
    _setWindowSize(windowSize) {
      this._WINDOW_SIZE = windowSize;
      pointPrecomputes.delete(this);
    }
    hasEvenY() {
      return this.y % _2n === _0n;
    }
    static fromCompressedHex(bytes2) {
      const isShort = bytes2.length === 32;
      const x = bytesToNumber(isShort ? bytes2 : bytes2.subarray(1));
      if (!isValidFieldElement(x))
        throw new Error("Point is not on curve");
      const y2 = weierstrass(x);
      let y = sqrtMod(y2);
      const isYOdd = (y & _1n) === _1n;
      if (isShort) {
        if (isYOdd)
          y = mod(-y);
      } else {
        const isFirstByteOdd = (bytes2[0] & 1) === 1;
        if (isFirstByteOdd !== isYOdd)
          y = mod(-y);
      }
      const point = new Point(x, y);
      point.assertValidity();
      return point;
    }
    static fromUncompressedHex(bytes2) {
      const x = bytesToNumber(bytes2.subarray(1, fieldLen + 1));
      const y = bytesToNumber(bytes2.subarray(fieldLen + 1, fieldLen * 2 + 1));
      const point = new Point(x, y);
      point.assertValidity();
      return point;
    }
    static fromHex(hex2) {
      const bytes2 = ensureBytes(hex2);
      const len = bytes2.length;
      const header = bytes2[0];
      if (len === fieldLen)
        return this.fromCompressedHex(bytes2);
      if (len === compressedLen && (header === 2 || header === 3)) {
        return this.fromCompressedHex(bytes2);
      }
      if (len === uncompressedLen && header === 4)
        return this.fromUncompressedHex(bytes2);
      throw new Error(`Point.fromHex: received invalid point. Expected 32-${compressedLen} compressed bytes or ${uncompressedLen} uncompressed bytes, not ${len}`);
    }
    static fromPrivateKey(privateKey) {
      return Point.BASE.multiply(normalizePrivateKey(privateKey));
    }
    static fromSignature(msgHash, signature, recovery) {
      const { r, s } = normalizeSignature(signature);
      if (![0, 1, 2, 3].includes(recovery))
        throw new Error("Cannot recover: invalid recovery bit");
      const h = truncateHash(ensureBytes(msgHash));
      const { n } = CURVE;
      const radj = recovery === 2 || recovery === 3 ? r + n : r;
      const rinv = invert(radj, n);
      const u1 = mod(-h * rinv, n);
      const u2 = mod(s * rinv, n);
      const prefix = recovery & 1 ? "03" : "02";
      const R = Point.fromHex(prefix + numTo32bStr(radj));
      const Q = Point.BASE.multiplyAndAddUnsafe(R, u1, u2);
      if (!Q)
        throw new Error("Cannot recover signature: point at infinify");
      Q.assertValidity();
      return Q;
    }
    toRawBytes(isCompressed = false) {
      return hexToBytes(this.toHex(isCompressed));
    }
    toHex(isCompressed = false) {
      const x = numTo32bStr(this.x);
      if (isCompressed) {
        const prefix = this.hasEvenY() ? "02" : "03";
        return `${prefix}${x}`;
      } else {
        return `04${x}${numTo32bStr(this.y)}`;
      }
    }
    toHexX() {
      return this.toHex(true).slice(2);
    }
    toRawX() {
      return this.toRawBytes(true).slice(1);
    }
    assertValidity() {
      const msg = "Point is not on elliptic curve";
      const { x, y } = this;
      if (!isValidFieldElement(x) || !isValidFieldElement(y))
        throw new Error(msg);
      const left = mod(y * y);
      const right = weierstrass(x);
      if (mod(left - right) !== _0n)
        throw new Error(msg);
    }
    equals(other) {
      return this.x === other.x && this.y === other.y;
    }
    negate() {
      return new Point(this.x, mod(-this.y));
    }
    double() {
      return JacobianPoint.fromAffine(this).double().toAffine();
    }
    add(other) {
      return JacobianPoint.fromAffine(this).add(JacobianPoint.fromAffine(other)).toAffine();
    }
    subtract(other) {
      return this.add(other.negate());
    }
    multiply(scalar) {
      return JacobianPoint.fromAffine(this).multiply(scalar, this).toAffine();
    }
    multiplyAndAddUnsafe(Q, a, b) {
      const P = JacobianPoint.fromAffine(this);
      const aP = a === _0n || a === _1n || this !== Point.BASE ? P.multiplyUnsafe(a) : P.multiply(a);
      const bQ = JacobianPoint.fromAffine(Q).multiplyUnsafe(b);
      const sum = aP.add(bQ);
      return sum.equals(JacobianPoint.ZERO) ? void 0 : sum.toAffine();
    }
  };
  Point.BASE = new Point(CURVE.Gx, CURVE.Gy);
  Point.ZERO = new Point(_0n, _0n);
  function sliceDER(s) {
    return Number.parseInt(s[0], 16) >= 8 ? "00" + s : s;
  }
  function parseDERInt(data) {
    if (data.length < 2 || data[0] !== 2) {
      throw new Error(`Invalid signature integer tag: ${bytesToHex(data)}`);
    }
    const len = data[1];
    const res = data.subarray(2, len + 2);
    if (!len || res.length !== len) {
      throw new Error(`Invalid signature integer: wrong length`);
    }
    if (res[0] === 0 && res[1] <= 127) {
      throw new Error("Invalid signature integer: trailing length");
    }
    return { data: bytesToNumber(res), left: data.subarray(len + 2) };
  }
  function parseDERSignature(data) {
    if (data.length < 2 || data[0] != 48) {
      throw new Error(`Invalid signature tag: ${bytesToHex(data)}`);
    }
    if (data[1] !== data.length - 2) {
      throw new Error("Invalid signature: incorrect length");
    }
    const { data: r, left: sBytes } = parseDERInt(data.subarray(2));
    const { data: s, left: rBytesLeft } = parseDERInt(sBytes);
    if (rBytesLeft.length) {
      throw new Error(`Invalid signature: left bytes after parsing: ${bytesToHex(rBytesLeft)}`);
    }
    return { r, s };
  }
  var Signature = class {
    constructor(r, s) {
      this.r = r;
      this.s = s;
      this.assertValidity();
    }
    static fromCompact(hex2) {
      const arr = hex2 instanceof Uint8Array;
      const name = "Signature.fromCompact";
      if (typeof hex2 !== "string" && !arr)
        throw new TypeError(`${name}: Expected string or Uint8Array`);
      const str = arr ? bytesToHex(hex2) : hex2;
      if (str.length !== 128)
        throw new Error(`${name}: Expected 64-byte hex`);
      return new Signature(hexToNumber(str.slice(0, 64)), hexToNumber(str.slice(64, 128)));
    }
    static fromDER(hex2) {
      const arr = hex2 instanceof Uint8Array;
      if (typeof hex2 !== "string" && !arr)
        throw new TypeError(`Signature.fromDER: Expected string or Uint8Array`);
      const { r, s } = parseDERSignature(arr ? hex2 : hexToBytes(hex2));
      return new Signature(r, s);
    }
    static fromHex(hex2) {
      return this.fromDER(hex2);
    }
    assertValidity() {
      const { r, s } = this;
      if (!isWithinCurveOrder(r))
        throw new Error("Invalid Signature: r must be 0 < r < n");
      if (!isWithinCurveOrder(s))
        throw new Error("Invalid Signature: s must be 0 < s < n");
    }
    hasHighS() {
      const HALF = CURVE.n >> _1n;
      return this.s > HALF;
    }
    normalizeS() {
      return this.hasHighS() ? new Signature(this.r, mod(-this.s, CURVE.n)) : this;
    }
    toDERRawBytes() {
      return hexToBytes(this.toDERHex());
    }
    toDERHex() {
      const sHex = sliceDER(numberToHexUnpadded(this.s));
      const rHex = sliceDER(numberToHexUnpadded(this.r));
      const sHexL = sHex.length / 2;
      const rHexL = rHex.length / 2;
      const sLen = numberToHexUnpadded(sHexL);
      const rLen = numberToHexUnpadded(rHexL);
      const length = numberToHexUnpadded(rHexL + sHexL + 4);
      return `30${length}02${rLen}${rHex}02${sLen}${sHex}`;
    }
    toRawBytes() {
      return this.toDERRawBytes();
    }
    toHex() {
      return this.toDERHex();
    }
    toCompactRawBytes() {
      return hexToBytes(this.toCompactHex());
    }
    toCompactHex() {
      return numTo32bStr(this.r) + numTo32bStr(this.s);
    }
  };
  function concatBytes(...arrays) {
    if (!arrays.every((b) => b instanceof Uint8Array))
      throw new Error("Uint8Array list expected");
    if (arrays.length === 1)
      return arrays[0];
    const length = arrays.reduce((a, arr) => a + arr.length, 0);
    const result = new Uint8Array(length);
    for (let i = 0, pad = 0; i < arrays.length; i++) {
      const arr = arrays[i];
      result.set(arr, pad);
      pad += arr.length;
    }
    return result;
  }
  var hexes = Array.from({ length: 256 }, (v, i) => i.toString(16).padStart(2, "0"));
  function bytesToHex(uint8a) {
    if (!(uint8a instanceof Uint8Array))
      throw new Error("Expected Uint8Array");
    let hex2 = "";
    for (let i = 0; i < uint8a.length; i++) {
      hex2 += hexes[uint8a[i]];
    }
    return hex2;
  }
  var POW_2_256 = BigInt("0x10000000000000000000000000000000000000000000000000000000000000000");
  function numTo32bStr(num) {
    if (typeof num !== "bigint")
      throw new Error("Expected bigint");
    if (!(_0n <= num && num < POW_2_256))
      throw new Error("Expected number 0 <= n < 2^256");
    return num.toString(16).padStart(64, "0");
  }
  function numTo32b(num) {
    const b = hexToBytes(numTo32bStr(num));
    if (b.length !== 32)
      throw new Error("Error: expected 32 bytes");
    return b;
  }
  function numberToHexUnpadded(num) {
    const hex2 = num.toString(16);
    return hex2.length & 1 ? `0${hex2}` : hex2;
  }
  function hexToNumber(hex2) {
    if (typeof hex2 !== "string") {
      throw new TypeError("hexToNumber: expected string, got " + typeof hex2);
    }
    return BigInt(`0x${hex2}`);
  }
  function hexToBytes(hex2) {
    if (typeof hex2 !== "string") {
      throw new TypeError("hexToBytes: expected string, got " + typeof hex2);
    }
    if (hex2.length % 2)
      throw new Error("hexToBytes: received invalid unpadded hex" + hex2.length);
    const array = new Uint8Array(hex2.length / 2);
    for (let i = 0; i < array.length; i++) {
      const j = i * 2;
      const hexByte = hex2.slice(j, j + 2);
      const byte = Number.parseInt(hexByte, 16);
      if (Number.isNaN(byte) || byte < 0)
        throw new Error("Invalid byte sequence");
      array[i] = byte;
    }
    return array;
  }
  function bytesToNumber(bytes2) {
    return hexToNumber(bytesToHex(bytes2));
  }
  function ensureBytes(hex2) {
    return hex2 instanceof Uint8Array ? Uint8Array.from(hex2) : hexToBytes(hex2);
  }
  function normalizeScalar(num) {
    if (typeof num === "number" && Number.isSafeInteger(num) && num > 0)
      return BigInt(num);
    if (typeof num === "bigint" && isWithinCurveOrder(num))
      return num;
    throw new TypeError("Expected valid private scalar: 0 < scalar < curve.n");
  }
  function mod(a, b = CURVE.P) {
    const result = a % b;
    return result >= _0n ? result : b + result;
  }
  function pow2(x, power) {
    const { P } = CURVE;
    let res = x;
    while (power-- > _0n) {
      res *= res;
      res %= P;
    }
    return res;
  }
  function sqrtMod(x) {
    const { P } = CURVE;
    const _6n = BigInt(6);
    const _11n = BigInt(11);
    const _22n = BigInt(22);
    const _23n = BigInt(23);
    const _44n = BigInt(44);
    const _88n = BigInt(88);
    const b2 = x * x * x % P;
    const b3 = b2 * b2 * x % P;
    const b6 = pow2(b3, _3n) * b3 % P;
    const b9 = pow2(b6, _3n) * b3 % P;
    const b11 = pow2(b9, _2n) * b2 % P;
    const b22 = pow2(b11, _11n) * b11 % P;
    const b44 = pow2(b22, _22n) * b22 % P;
    const b88 = pow2(b44, _44n) * b44 % P;
    const b176 = pow2(b88, _88n) * b88 % P;
    const b220 = pow2(b176, _44n) * b44 % P;
    const b223 = pow2(b220, _3n) * b3 % P;
    const t1 = pow2(b223, _23n) * b22 % P;
    const t2 = pow2(t1, _6n) * b2 % P;
    const rt = pow2(t2, _2n);
    const xc = rt * rt % P;
    if (xc !== x)
      throw new Error("Cannot find square root");
    return rt;
  }
  function invert(number2, modulo = CURVE.P) {
    if (number2 === _0n || modulo <= _0n) {
      throw new Error(`invert: expected positive integers, got n=${number2} mod=${modulo}`);
    }
    let a = mod(number2, modulo);
    let b = modulo;
    let x = _0n, y = _1n, u = _1n, v = _0n;
    while (a !== _0n) {
      const q = b / a;
      const r = b % a;
      const m = x - u * q;
      const n = y - v * q;
      b = a, a = r, x = u, y = v, u = m, v = n;
    }
    const gcd2 = b;
    if (gcd2 !== _1n)
      throw new Error("invert: does not exist");
    return mod(x, modulo);
  }
  function invertBatch(nums, p = CURVE.P) {
    const scratch = new Array(nums.length);
    const lastMultiplied = nums.reduce((acc, num, i) => {
      if (num === _0n)
        return acc;
      scratch[i] = acc;
      return mod(acc * num, p);
    }, _1n);
    const inverted = invert(lastMultiplied, p);
    nums.reduceRight((acc, num, i) => {
      if (num === _0n)
        return acc;
      scratch[i] = mod(acc * scratch[i], p);
      return mod(acc * num, p);
    }, inverted);
    return scratch;
  }
  function bits2int_2(bytes2) {
    const delta = bytes2.length * 8 - groupLen * 8;
    const num = bytesToNumber(bytes2);
    return delta > 0 ? num >> BigInt(delta) : num;
  }
  function truncateHash(hash2, truncateOnly = false) {
    const h = bits2int_2(hash2);
    if (truncateOnly)
      return h;
    const { n } = CURVE;
    return h >= n ? h - n : h;
  }
  var _sha256Sync;
  var _hmacSha256Sync;
  var HmacDrbg = class {
    constructor(hashLen2, qByteLen) {
      this.hashLen = hashLen2;
      this.qByteLen = qByteLen;
      if (typeof hashLen2 !== "number" || hashLen2 < 2)
        throw new Error("hashLen must be a number");
      if (typeof qByteLen !== "number" || qByteLen < 2)
        throw new Error("qByteLen must be a number");
      this.v = new Uint8Array(hashLen2).fill(1);
      this.k = new Uint8Array(hashLen2).fill(0);
      this.counter = 0;
    }
    hmac(...values) {
      return utils.hmacSha256(this.k, ...values);
    }
    hmacSync(...values) {
      return _hmacSha256Sync(this.k, ...values);
    }
    checkSync() {
      if (typeof _hmacSha256Sync !== "function")
        throw new ShaError("hmacSha256Sync needs to be set");
    }
    incr() {
      if (this.counter >= 1e3)
        throw new Error("Tried 1,000 k values for sign(), all were invalid");
      this.counter += 1;
    }
    async reseed(seed = new Uint8Array()) {
      this.k = await this.hmac(this.v, Uint8Array.from([0]), seed);
      this.v = await this.hmac(this.v);
      if (seed.length === 0)
        return;
      this.k = await this.hmac(this.v, Uint8Array.from([1]), seed);
      this.v = await this.hmac(this.v);
    }
    reseedSync(seed = new Uint8Array()) {
      this.checkSync();
      this.k = this.hmacSync(this.v, Uint8Array.from([0]), seed);
      this.v = this.hmacSync(this.v);
      if (seed.length === 0)
        return;
      this.k = this.hmacSync(this.v, Uint8Array.from([1]), seed);
      this.v = this.hmacSync(this.v);
    }
    async generate() {
      this.incr();
      let len = 0;
      const out = [];
      while (len < this.qByteLen) {
        this.v = await this.hmac(this.v);
        const sl = this.v.slice();
        out.push(sl);
        len += this.v.length;
      }
      return concatBytes(...out);
    }
    generateSync() {
      this.checkSync();
      this.incr();
      let len = 0;
      const out = [];
      while (len < this.qByteLen) {
        this.v = this.hmacSync(this.v);
        const sl = this.v.slice();
        out.push(sl);
        len += this.v.length;
      }
      return concatBytes(...out);
    }
  };
  function isWithinCurveOrder(num) {
    return _0n < num && num < CURVE.n;
  }
  function isValidFieldElement(num) {
    return _0n < num && num < CURVE.P;
  }
  function kmdToSig(kBytes, m, d, lowS = true) {
    const { n } = CURVE;
    const k = truncateHash(kBytes, true);
    if (!isWithinCurveOrder(k))
      return;
    const kinv = invert(k, n);
    const q = Point.BASE.multiply(k);
    const r = mod(q.x, n);
    if (r === _0n)
      return;
    const s = mod(kinv * mod(m + d * r, n), n);
    if (s === _0n)
      return;
    let sig = new Signature(r, s);
    let recovery = (q.x === sig.r ? 0 : 2) | Number(q.y & _1n);
    if (lowS && sig.hasHighS()) {
      sig = sig.normalizeS();
      recovery ^= 1;
    }
    return { sig, recovery };
  }
  function normalizePrivateKey(key) {
    let num;
    if (typeof key === "bigint") {
      num = key;
    } else if (typeof key === "number" && Number.isSafeInteger(key) && key > 0) {
      num = BigInt(key);
    } else if (typeof key === "string") {
      if (key.length !== 2 * groupLen)
        throw new Error("Expected 32 bytes of private key");
      num = hexToNumber(key);
    } else if (key instanceof Uint8Array) {
      if (key.length !== groupLen)
        throw new Error("Expected 32 bytes of private key");
      num = bytesToNumber(key);
    } else {
      throw new TypeError("Expected valid private key");
    }
    if (!isWithinCurveOrder(num))
      throw new Error("Expected private key: 0 < key < n");
    return num;
  }
  function normalizePublicKey(publicKey) {
    if (publicKey instanceof Point) {
      publicKey.assertValidity();
      return publicKey;
    } else {
      return Point.fromHex(publicKey);
    }
  }
  function normalizeSignature(signature) {
    if (signature instanceof Signature) {
      signature.assertValidity();
      return signature;
    }
    try {
      return Signature.fromDER(signature);
    } catch (error) {
      return Signature.fromCompact(signature);
    }
  }
  function getPublicKey(privateKey, isCompressed = false) {
    return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed);
  }
  function isProbPub(item) {
    const arr = item instanceof Uint8Array;
    const str = typeof item === "string";
    const len = (arr || str) && item.length;
    if (arr)
      return len === compressedLen || len === uncompressedLen;
    if (str)
      return len === compressedLen * 2 || len === uncompressedLen * 2;
    if (item instanceof Point)
      return true;
    return false;
  }
  function getSharedSecret(privateA, publicB, isCompressed = false) {
    if (isProbPub(privateA))
      throw new TypeError("getSharedSecret: first arg must be private key");
    if (!isProbPub(publicB))
      throw new TypeError("getSharedSecret: second arg must be public key");
    const b = normalizePublicKey(publicB);
    b.assertValidity();
    return b.multiply(normalizePrivateKey(privateA)).toRawBytes(isCompressed);
  }
  function bits2int(bytes2) {
    const slice = bytes2.length > fieldLen ? bytes2.slice(0, fieldLen) : bytes2;
    return bytesToNumber(slice);
  }
  function bits2octets(bytes2) {
    const z1 = bits2int(bytes2);
    const z2 = mod(z1, CURVE.n);
    return int2octets(z2 < _0n ? z1 : z2);
  }
  function int2octets(num) {
    return numTo32b(num);
  }
  function initSigArgs(msgHash, privateKey, extraEntropy) {
    if (msgHash == null)
      throw new Error(`sign: expected valid message hash, not "${msgHash}"`);
    const h1 = ensureBytes(msgHash);
    const d = normalizePrivateKey(privateKey);
    const seedArgs = [int2octets(d), bits2octets(h1)];
    if (extraEntropy != null) {
      if (extraEntropy === true)
        extraEntropy = utils.randomBytes(fieldLen);
      const e = ensureBytes(extraEntropy);
      if (e.length !== fieldLen)
        throw new Error(`sign: Expected ${fieldLen} bytes of extra data`);
      seedArgs.push(e);
    }
    const seed = concatBytes(...seedArgs);
    const m = bits2int(h1);
    return { seed, m, d };
  }
  function finalizeSig(recSig, opts) {
    const { sig, recovery } = recSig;
    const { der, recovered } = Object.assign({ canonical: true, der: true }, opts);
    const hashed = der ? sig.toDERRawBytes() : sig.toCompactRawBytes();
    return recovered ? [hashed, recovery] : hashed;
  }
  function signSync(msgHash, privKey, opts = {}) {
    const { seed, m, d } = initSigArgs(msgHash, privKey, opts.extraEntropy);
    const drbg = new HmacDrbg(hashLen, groupLen);
    drbg.reseedSync(seed);
    let sig;
    while (!(sig = kmdToSig(drbg.generateSync(), m, d, opts.canonical)))
      drbg.reseedSync();
    return finalizeSig(sig, opts);
  }
  var vopts = { strict: true };
  function verify(signature, msgHash, publicKey, opts = vopts) {
    let sig;
    try {
      sig = normalizeSignature(signature);
      msgHash = ensureBytes(msgHash);
    } catch (error) {
      return false;
    }
    const { r, s } = sig;
    if (opts.strict && sig.hasHighS())
      return false;
    const h = truncateHash(msgHash);
    let P;
    try {
      P = normalizePublicKey(publicKey);
    } catch (error) {
      return false;
    }
    const { n } = CURVE;
    const sinv = invert(s, n);
    const u1 = mod(h * sinv, n);
    const u2 = mod(r * sinv, n);
    const R = Point.BASE.multiplyAndAddUnsafe(P, u1, u2);
    if (!R)
      return false;
    const v = mod(R.x, n);
    return v === r;
  }
  function schnorrChallengeFinalize(ch) {
    return mod(bytesToNumber(ch), CURVE.n);
  }
  var SchnorrSignature = class {
    constructor(r, s) {
      this.r = r;
      this.s = s;
      this.assertValidity();
    }
    static fromHex(hex2) {
      const bytes2 = ensureBytes(hex2);
      if (bytes2.length !== 64)
        throw new TypeError(`SchnorrSignature.fromHex: expected 64 bytes, not ${bytes2.length}`);
      const r = bytesToNumber(bytes2.subarray(0, 32));
      const s = bytesToNumber(bytes2.subarray(32, 64));
      return new SchnorrSignature(r, s);
    }
    assertValidity() {
      const { r, s } = this;
      if (!isValidFieldElement(r) || !isWithinCurveOrder(s))
        throw new Error("Invalid signature");
    }
    toHex() {
      return numTo32bStr(this.r) + numTo32bStr(this.s);
    }
    toRawBytes() {
      return hexToBytes(this.toHex());
    }
  };
  function schnorrGetPublicKey(privateKey) {
    return Point.fromPrivateKey(privateKey).toRawX();
  }
  var InternalSchnorrSignature = class {
    constructor(message, privateKey, auxRand = utils.randomBytes()) {
      if (message == null)
        throw new TypeError(`sign: Expected valid message, not "${message}"`);
      this.m = ensureBytes(message);
      const { x, scalar } = this.getScalar(normalizePrivateKey(privateKey));
      this.px = x;
      this.d = scalar;
      this.rand = ensureBytes(auxRand);
      if (this.rand.length !== 32)
        throw new TypeError("sign: Expected 32 bytes of aux randomness");
    }
    getScalar(priv) {
      const point = Point.fromPrivateKey(priv);
      const scalar = point.hasEvenY() ? priv : CURVE.n - priv;
      return { point, scalar, x: point.toRawX() };
    }
    initNonce(d, t0h) {
      return numTo32b(d ^ bytesToNumber(t0h));
    }
    finalizeNonce(k0h) {
      const k0 = mod(bytesToNumber(k0h), CURVE.n);
      if (k0 === _0n)
        throw new Error("sign: Creation of signature failed. k is zero");
      const { point: R, x: rx, scalar: k } = this.getScalar(k0);
      return { R, rx, k };
    }
    finalizeSig(R, k, e, d) {
      return new SchnorrSignature(R.x, mod(k + e * d, CURVE.n)).toRawBytes();
    }
    error() {
      throw new Error("sign: Invalid signature produced");
    }
    async calc() {
      const { m, d, px, rand } = this;
      const tag = utils.taggedHash;
      const t = this.initNonce(d, await tag(TAGS.aux, rand));
      const { R, rx, k } = this.finalizeNonce(await tag(TAGS.nonce, t, px, m));
      const e = schnorrChallengeFinalize(await tag(TAGS.challenge, rx, px, m));
      const sig = this.finalizeSig(R, k, e, d);
      if (!await schnorrVerify(sig, m, px))
        this.error();
      return sig;
    }
    calcSync() {
      const { m, d, px, rand } = this;
      const tag = utils.taggedHashSync;
      const t = this.initNonce(d, tag(TAGS.aux, rand));
      const { R, rx, k } = this.finalizeNonce(tag(TAGS.nonce, t, px, m));
      const e = schnorrChallengeFinalize(tag(TAGS.challenge, rx, px, m));
      const sig = this.finalizeSig(R, k, e, d);
      if (!schnorrVerifySync(sig, m, px))
        this.error();
      return sig;
    }
  };
  async function schnorrSign(msg, privKey, auxRand) {
    return new InternalSchnorrSignature(msg, privKey, auxRand).calc();
  }
  function schnorrSignSync(msg, privKey, auxRand) {
    return new InternalSchnorrSignature(msg, privKey, auxRand).calcSync();
  }
  function initSchnorrVerify(signature, message, publicKey) {
    const raw = signature instanceof SchnorrSignature;
    const sig = raw ? signature : SchnorrSignature.fromHex(signature);
    if (raw)
      sig.assertValidity();
    return {
      ...sig,
      m: ensureBytes(message),
      P: normalizePublicKey(publicKey)
    };
  }
  function finalizeSchnorrVerify(r, P, s, e) {
    const R = Point.BASE.multiplyAndAddUnsafe(P, normalizePrivateKey(s), mod(-e, CURVE.n));
    if (!R || !R.hasEvenY() || R.x !== r)
      return false;
    return true;
  }
  async function schnorrVerify(signature, message, publicKey) {
    try {
      const { r, s, m, P } = initSchnorrVerify(signature, message, publicKey);
      const e = schnorrChallengeFinalize(await utils.taggedHash(TAGS.challenge, numTo32b(r), P.toRawX(), m));
      return finalizeSchnorrVerify(r, P, s, e);
    } catch (error) {
      return false;
    }
  }
  function schnorrVerifySync(signature, message, publicKey) {
    try {
      const { r, s, m, P } = initSchnorrVerify(signature, message, publicKey);
      const e = schnorrChallengeFinalize(utils.taggedHashSync(TAGS.challenge, numTo32b(r), P.toRawX(), m));
      return finalizeSchnorrVerify(r, P, s, e);
    } catch (error) {
      if (error instanceof ShaError)
        throw error;
      return false;
    }
  }
  var schnorr = {
    Signature: SchnorrSignature,
    getPublicKey: schnorrGetPublicKey,
    sign: schnorrSign,
    verify: schnorrVerify,
    signSync: schnorrSignSync,
    verifySync: schnorrVerifySync
  };
  Point.BASE._setWindowSize(8);
  var crypto2 = {
    node: nodeCrypto,
    web: typeof self === "object" && "crypto" in self ? self.crypto : void 0
  };
  var TAGS = {
    challenge: "BIP0340/challenge",
    aux: "BIP0340/aux",
    nonce: "BIP0340/nonce"
  };
  var TAGGED_HASH_PREFIXES = {};
  var utils = {
    bytesToHex,
    hexToBytes,
    concatBytes,
    mod,
    invert,
    isValidPrivateKey(privateKey) {
      try {
        normalizePrivateKey(privateKey);
        return true;
      } catch (error) {
        return false;
      }
    },
    _bigintTo32Bytes: numTo32b,
    _normalizePrivateKey: normalizePrivateKey,
    hashToPrivateKey: (hash2) => {
      hash2 = ensureBytes(hash2);
      const minLen = groupLen + 8;
      if (hash2.length < minLen || hash2.length > 1024) {
        throw new Error(`Expected valid bytes of private key as per FIPS 186`);
      }
      const num = mod(bytesToNumber(hash2), CURVE.n - _1n) + _1n;
      return numTo32b(num);
    },
    randomBytes: (bytesLength = 32) => {
      if (crypto2.web) {
        return crypto2.web.getRandomValues(new Uint8Array(bytesLength));
      } else if (crypto2.node) {
        const { randomBytes: randomBytes2 } = crypto2.node;
        return Uint8Array.from(randomBytes2(bytesLength));
      } else {
        throw new Error("The environment doesn't have randomBytes function");
      }
    },
    randomPrivateKey: () => utils.hashToPrivateKey(utils.randomBytes(groupLen + 8)),
    precompute(windowSize = 8, point = Point.BASE) {
      const cached = point === Point.BASE ? point : new Point(point.x, point.y);
      cached._setWindowSize(windowSize);
      cached.multiply(_3n);
      return cached;
    },
    sha256: async (...messages) => {
      if (crypto2.web) {
        const buffer = await crypto2.web.subtle.digest("SHA-256", concatBytes(...messages));
        return new Uint8Array(buffer);
      } else if (crypto2.node) {
        const { createHash } = crypto2.node;
        const hash2 = createHash("sha256");
        messages.forEach((m) => hash2.update(m));
        return Uint8Array.from(hash2.digest());
      } else {
        throw new Error("The environment doesn't have sha256 function");
      }
    },
    hmacSha256: async (key, ...messages) => {
      if (crypto2.web) {
        const ckey = await crypto2.web.subtle.importKey("raw", key, { name: "HMAC", hash: { name: "SHA-256" } }, false, ["sign"]);
        const message = concatBytes(...messages);
        const buffer = await crypto2.web.subtle.sign("HMAC", ckey, message);
        return new Uint8Array(buffer);
      } else if (crypto2.node) {
        const { createHmac } = crypto2.node;
        const hash2 = createHmac("sha256", key);
        messages.forEach((m) => hash2.update(m));
        return Uint8Array.from(hash2.digest());
      } else {
        throw new Error("The environment doesn't have hmac-sha256 function");
      }
    },
    sha256Sync: void 0,
    hmacSha256Sync: void 0,
    taggedHash: async (tag, ...messages) => {
      let tagP = TAGGED_HASH_PREFIXES[tag];
      if (tagP === void 0) {
        const tagH = await utils.sha256(Uint8Array.from(tag, (c) => c.charCodeAt(0)));
        tagP = concatBytes(tagH, tagH);
        TAGGED_HASH_PREFIXES[tag] = tagP;
      }
      return utils.sha256(tagP, ...messages);
    },
    taggedHashSync: (tag, ...messages) => {
      if (typeof _sha256Sync !== "function")
        throw new ShaError("sha256Sync is undefined, you need to set it");
      let tagP = TAGGED_HASH_PREFIXES[tag];
      if (tagP === void 0) {
        const tagH = _sha256Sync(Uint8Array.from(tag, (c) => c.charCodeAt(0)));
        tagP = concatBytes(tagH, tagH);
        TAGGED_HASH_PREFIXES[tag] = tagP;
      }
      return _sha256Sync(tagP, ...messages);
    },
    _JacobianPoint: JacobianPoint
  };
  Object.defineProperties(utils, {
    sha256Sync: {
      configurable: false,
      get() {
        return _sha256Sync;
      },
      set(val) {
        if (!_sha256Sync)
          _sha256Sync = val;
      }
    },
    hmacSha256Sync: {
      configurable: false,
      get() {
        return _hmacSha256Sync;
      },
      set(val) {
        if (!_hmacSha256Sync)
          _hmacSha256Sync = val;
      }
    }
  });

  // node_modules/nostr-tools/node_modules/@noble/hashes/esm/sha256.js
  init_define_process();

  // node_modules/nostr-tools/node_modules/@noble/hashes/esm/_sha2.js
  init_define_process();

  // node_modules/nostr-tools/node_modules/@noble/hashes/esm/utils.js
  init_define_process();

  // node_modules/nostr-tools/node_modules/@noble/hashes/esm/cryptoBrowser.js
  init_define_process();
  var crypto3 = {
    node: void 0,
    web: typeof self === "object" && "crypto" in self ? self.crypto : void 0
  };

  // node_modules/nostr-tools/node_modules/@noble/hashes/esm/utils.js
  var createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
  var rotr = (word, shift) => word << 32 - shift | word >>> shift;
  var isLE = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
  if (!isLE)
    throw new Error("Non little-endian hardware is not supported");
  var hexes2 = Array.from({ length: 256 }, (v, i) => i.toString(16).padStart(2, "0"));
  var nextTick = (() => {
    const nodeRequire = typeof module !== "undefined" && typeof module.require === "function" && module.require.bind(module);
    try {
      if (nodeRequire) {
        const { setImmediate } = nodeRequire("timers");
        return () => new Promise((resolve) => setImmediate(resolve));
      }
    } catch (e) {
    }
    return () => new Promise((resolve) => setTimeout(resolve, 0));
  })();
  function utf8ToBytes(str) {
    if (typeof str !== "string") {
      throw new TypeError(`utf8ToBytes expected string, got ${typeof str}`);
    }
    return new TextEncoder().encode(str);
  }
  function toBytes(data) {
    if (typeof data === "string")
      data = utf8ToBytes(data);
    if (!(data instanceof Uint8Array))
      throw new TypeError(`Expected input type is Uint8Array (got ${typeof data})`);
    return data;
  }
  function assertNumber(n) {
    if (!Number.isSafeInteger(n) || n < 0)
      throw new Error(`Wrong positive integer: ${n}`);
  }
  function assertHash(hash2) {
    if (typeof hash2 !== "function" || typeof hash2.create !== "function")
      throw new Error("Hash should be wrapped by utils.wrapConstructor");
    assertNumber(hash2.outputLen);
    assertNumber(hash2.blockLen);
  }
  var Hash = class {
    clone() {
      return this._cloneInto();
    }
  };
  function wrapConstructor(hashConstructor) {
    const hashC = (message) => hashConstructor().update(toBytes(message)).digest();
    const tmp = hashConstructor();
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = () => hashConstructor();
    return hashC;
  }
  function randomBytes(bytesLength = 32) {
    if (crypto3.web) {
      return crypto3.web.getRandomValues(new Uint8Array(bytesLength));
    } else if (crypto3.node) {
      return new Uint8Array(crypto3.node.randomBytes(bytesLength).buffer);
    } else {
      throw new Error("The environment doesn't have randomBytes function");
    }
  }

  // node_modules/nostr-tools/node_modules/@noble/hashes/esm/_sha2.js
  function setBigUint64(view, byteOffset, value, isLE3) {
    if (typeof view.setBigUint64 === "function")
      return view.setBigUint64(byteOffset, value, isLE3);
    const _32n2 = BigInt(32);
    const _u32_max = BigInt(4294967295);
    const wh = Number(value >> _32n2 & _u32_max);
    const wl = Number(value & _u32_max);
    const h = isLE3 ? 4 : 0;
    const l = isLE3 ? 0 : 4;
    view.setUint32(byteOffset + h, wh, isLE3);
    view.setUint32(byteOffset + l, wl, isLE3);
  }
  var SHA2 = class extends Hash {
    constructor(blockLen, outputLen, padOffset, isLE3) {
      super();
      this.blockLen = blockLen;
      this.outputLen = outputLen;
      this.padOffset = padOffset;
      this.isLE = isLE3;
      this.finished = false;
      this.length = 0;
      this.pos = 0;
      this.destroyed = false;
      this.buffer = new Uint8Array(blockLen);
      this.view = createView(this.buffer);
    }
    update(data) {
      if (this.destroyed)
        throw new Error("instance is destroyed");
      const { view, buffer, blockLen, finished } = this;
      if (finished)
        throw new Error("digest() was already called");
      data = toBytes(data);
      const len = data.length;
      for (let pos = 0; pos < len; ) {
        const take = Math.min(blockLen - this.pos, len - pos);
        if (take === blockLen) {
          const dataView = createView(data);
          for (; blockLen <= len - pos; pos += blockLen)
            this.process(dataView, pos);
          continue;
        }
        buffer.set(data.subarray(pos, pos + take), this.pos);
        this.pos += take;
        pos += take;
        if (this.pos === blockLen) {
          this.process(view, 0);
          this.pos = 0;
        }
      }
      this.length += data.length;
      this.roundClean();
      return this;
    }
    digestInto(out) {
      if (this.destroyed)
        throw new Error("instance is destroyed");
      if (!(out instanceof Uint8Array) || out.length < this.outputLen)
        throw new Error("_Sha2: Invalid output buffer");
      if (this.finished)
        throw new Error("digest() was already called");
      this.finished = true;
      const { buffer, view, blockLen, isLE: isLE3 } = this;
      let { pos } = this;
      buffer[pos++] = 128;
      this.buffer.subarray(pos).fill(0);
      if (this.padOffset > blockLen - pos) {
        this.process(view, 0);
        pos = 0;
      }
      for (let i = pos; i < blockLen; i++)
        buffer[i] = 0;
      setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE3);
      this.process(view, 0);
      const oview = createView(out);
      this.get().forEach((v, i) => oview.setUint32(4 * i, v, isLE3));
    }
    digest() {
      const { buffer, outputLen } = this;
      this.digestInto(buffer);
      const res = buffer.slice(0, outputLen);
      this.destroy();
      return res;
    }
    _cloneInto(to) {
      to || (to = new this.constructor());
      to.set(...this.get());
      const { blockLen, buffer, length, finished, destroyed, pos } = this;
      to.length = length;
      to.pos = pos;
      to.finished = finished;
      to.destroyed = destroyed;
      if (length % blockLen)
        to.buffer.set(buffer);
      return to;
    }
  };

  // node_modules/nostr-tools/node_modules/@noble/hashes/esm/sha256.js
  var Chi = (a, b, c) => a & b ^ ~a & c;
  var Maj = (a, b, c) => a & b ^ a & c ^ b & c;
  var SHA256_K = new Uint32Array([
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ]);
  var IV = new Uint32Array([
    1779033703,
    3144134277,
    1013904242,
    2773480762,
    1359893119,
    2600822924,
    528734635,
    1541459225
  ]);
  var SHA256_W = new Uint32Array(64);
  var SHA256 = class extends SHA2 {
    constructor() {
      super(64, 32, 8, false);
      this.A = IV[0] | 0;
      this.B = IV[1] | 0;
      this.C = IV[2] | 0;
      this.D = IV[3] | 0;
      this.E = IV[4] | 0;
      this.F = IV[5] | 0;
      this.G = IV[6] | 0;
      this.H = IV[7] | 0;
    }
    get() {
      const { A, B, C, D, E, F, G, H } = this;
      return [A, B, C, D, E, F, G, H];
    }
    set(A, B, C, D, E, F, G, H) {
      this.A = A | 0;
      this.B = B | 0;
      this.C = C | 0;
      this.D = D | 0;
      this.E = E | 0;
      this.F = F | 0;
      this.G = G | 0;
      this.H = H | 0;
    }
    process(view, offset) {
      for (let i = 0; i < 16; i++, offset += 4)
        SHA256_W[i] = view.getUint32(offset, false);
      for (let i = 16; i < 64; i++) {
        const W15 = SHA256_W[i - 15];
        const W2 = SHA256_W[i - 2];
        const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
        const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
        SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
      }
      let { A, B, C, D, E, F, G, H } = this;
      for (let i = 0; i < 64; i++) {
        const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
        const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
        const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
        const T2 = sigma0 + Maj(A, B, C) | 0;
        H = G;
        G = F;
        F = E;
        E = D + T1 | 0;
        D = C;
        C = B;
        B = A;
        A = T1 + T2 | 0;
      }
      A = A + this.A | 0;
      B = B + this.B | 0;
      C = C + this.C | 0;
      D = D + this.D | 0;
      E = E + this.E | 0;
      F = F + this.F | 0;
      G = G + this.G | 0;
      H = H + this.H | 0;
      this.set(A, B, C, D, E, F, G, H);
    }
    roundClean() {
      SHA256_W.fill(0);
    }
    destroy() {
      this.set(0, 0, 0, 0, 0, 0, 0, 0);
      this.buffer.fill(0);
    }
  };
  var sha256 = wrapConstructor(() => new SHA256());

  // node_modules/@scure/base/lib/esm/index.js
  init_define_process();
  function assertNumber2(n) {
    if (!Number.isSafeInteger(n))
      throw new Error(`Wrong integer: ${n}`);
  }
  function chain(...args) {
    const wrap = (a, b) => (c) => a(b(c));
    const encode = Array.from(args).reverse().reduce((acc, i) => acc ? wrap(acc, i.encode) : i.encode, void 0);
    const decode2 = args.reduce((acc, i) => acc ? wrap(acc, i.decode) : i.decode, void 0);
    return { encode, decode: decode2 };
  }
  function alphabet(alphabet2) {
    return {
      encode: (digits) => {
        if (!Array.isArray(digits) || digits.length && typeof digits[0] !== "number")
          throw new Error("alphabet.encode input should be an array of numbers");
        return digits.map((i) => {
          assertNumber2(i);
          if (i < 0 || i >= alphabet2.length)
            throw new Error(`Digit index outside alphabet: ${i} (alphabet: ${alphabet2.length})`);
          return alphabet2[i];
        });
      },
      decode: (input) => {
        if (!Array.isArray(input) || input.length && typeof input[0] !== "string")
          throw new Error("alphabet.decode input should be array of strings");
        return input.map((letter) => {
          if (typeof letter !== "string")
            throw new Error(`alphabet.decode: not string element=${letter}`);
          const index = alphabet2.indexOf(letter);
          if (index === -1)
            throw new Error(`Unknown letter: "${letter}". Allowed: ${alphabet2}`);
          return index;
        });
      }
    };
  }
  function join(separator = "") {
    if (typeof separator !== "string")
      throw new Error("join separator should be string");
    return {
      encode: (from) => {
        if (!Array.isArray(from) || from.length && typeof from[0] !== "string")
          throw new Error("join.encode input should be array of strings");
        for (let i of from)
          if (typeof i !== "string")
            throw new Error(`join.encode: non-string input=${i}`);
        return from.join(separator);
      },
      decode: (to) => {
        if (typeof to !== "string")
          throw new Error("join.decode input should be string");
        return to.split(separator);
      }
    };
  }
  function padding(bits, chr = "=") {
    assertNumber2(bits);
    if (typeof chr !== "string")
      throw new Error("padding chr should be string");
    return {
      encode(data) {
        if (!Array.isArray(data) || data.length && typeof data[0] !== "string")
          throw new Error("padding.encode input should be array of strings");
        for (let i of data)
          if (typeof i !== "string")
            throw new Error(`padding.encode: non-string input=${i}`);
        while (data.length * bits % 8)
          data.push(chr);
        return data;
      },
      decode(input) {
        if (!Array.isArray(input) || input.length && typeof input[0] !== "string")
          throw new Error("padding.encode input should be array of strings");
        for (let i of input)
          if (typeof i !== "string")
            throw new Error(`padding.decode: non-string input=${i}`);
        let end = input.length;
        if (end * bits % 8)
          throw new Error("Invalid padding: string should have whole number of bytes");
        for (; end > 0 && input[end - 1] === chr; end--) {
          if (!((end - 1) * bits % 8))
            throw new Error("Invalid padding: string has too much padding");
        }
        return input.slice(0, end);
      }
    };
  }
  function normalize(fn) {
    if (typeof fn !== "function")
      throw new Error("normalize fn should be function");
    return { encode: (from) => from, decode: (to) => fn(to) };
  }
  function convertRadix(data, from, to) {
    if (from < 2)
      throw new Error(`convertRadix: wrong from=${from}, base cannot be less than 2`);
    if (to < 2)
      throw new Error(`convertRadix: wrong to=${to}, base cannot be less than 2`);
    if (!Array.isArray(data))
      throw new Error("convertRadix: data should be array");
    if (!data.length)
      return [];
    let pos = 0;
    const res = [];
    const digits = Array.from(data);
    digits.forEach((d) => {
      assertNumber2(d);
      if (d < 0 || d >= from)
        throw new Error(`Wrong integer: ${d}`);
    });
    while (true) {
      let carry = 0;
      let done = true;
      for (let i = pos; i < digits.length; i++) {
        const digit = digits[i];
        const digitBase = from * carry + digit;
        if (!Number.isSafeInteger(digitBase) || from * carry / from !== carry || digitBase - digit !== from * carry) {
          throw new Error("convertRadix: carry overflow");
        }
        carry = digitBase % to;
        digits[i] = Math.floor(digitBase / to);
        if (!Number.isSafeInteger(digits[i]) || digits[i] * to + carry !== digitBase)
          throw new Error("convertRadix: carry overflow");
        if (!done)
          continue;
        else if (!digits[i])
          pos = i;
        else
          done = false;
      }
      res.push(carry);
      if (done)
        break;
    }
    for (let i = 0; i < data.length - 1 && data[i] === 0; i++)
      res.push(0);
    return res.reverse();
  }
  var gcd = (a, b) => !b ? a : gcd(b, a % b);
  var radix2carry = (from, to) => from + (to - gcd(from, to));
  function convertRadix2(data, from, to, padding2) {
    if (!Array.isArray(data))
      throw new Error("convertRadix2: data should be array");
    if (from <= 0 || from > 32)
      throw new Error(`convertRadix2: wrong from=${from}`);
    if (to <= 0 || to > 32)
      throw new Error(`convertRadix2: wrong to=${to}`);
    if (radix2carry(from, to) > 32) {
      throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${radix2carry(from, to)}`);
    }
    let carry = 0;
    let pos = 0;
    const mask = 2 ** to - 1;
    const res = [];
    for (const n of data) {
      assertNumber2(n);
      if (n >= 2 ** from)
        throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
      carry = carry << from | n;
      if (pos + from > 32)
        throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
      pos += from;
      for (; pos >= to; pos -= to)
        res.push((carry >> pos - to & mask) >>> 0);
      carry &= 2 ** pos - 1;
    }
    carry = carry << to - pos & mask;
    if (!padding2 && pos >= from)
      throw new Error("Excess padding");
    if (!padding2 && carry)
      throw new Error(`Non-zero padding: ${carry}`);
    if (padding2 && pos > 0)
      res.push(carry >>> 0);
    return res;
  }
  function radix(num) {
    assertNumber2(num);
    return {
      encode: (bytes2) => {
        if (!(bytes2 instanceof Uint8Array))
          throw new Error("radix.encode input should be Uint8Array");
        return convertRadix(Array.from(bytes2), 2 ** 8, num);
      },
      decode: (digits) => {
        if (!Array.isArray(digits) || digits.length && typeof digits[0] !== "number")
          throw new Error("radix.decode input should be array of strings");
        return Uint8Array.from(convertRadix(digits, num, 2 ** 8));
      }
    };
  }
  function radix2(bits, revPadding = false) {
    assertNumber2(bits);
    if (bits <= 0 || bits > 32)
      throw new Error("radix2: bits should be in (0..32]");
    if (radix2carry(8, bits) > 32 || radix2carry(bits, 8) > 32)
      throw new Error("radix2: carry overflow");
    return {
      encode: (bytes2) => {
        if (!(bytes2 instanceof Uint8Array))
          throw new Error("radix2.encode input should be Uint8Array");
        return convertRadix2(Array.from(bytes2), 8, bits, !revPadding);
      },
      decode: (digits) => {
        if (!Array.isArray(digits) || digits.length && typeof digits[0] !== "number")
          throw new Error("radix2.decode input should be array of strings");
        return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
      }
    };
  }
  function unsafeWrapper(fn) {
    if (typeof fn !== "function")
      throw new Error("unsafeWrapper fn should be function");
    return function(...args) {
      try {
        return fn.apply(null, args);
      } catch (e) {
      }
    };
  }
  function checksum(len, fn) {
    assertNumber2(len);
    if (typeof fn !== "function")
      throw new Error("checksum fn should be function");
    return {
      encode(data) {
        if (!(data instanceof Uint8Array))
          throw new Error("checksum.encode: input should be Uint8Array");
        const checksum2 = fn(data).slice(0, len);
        const res = new Uint8Array(data.length + len);
        res.set(data);
        res.set(checksum2, data.length);
        return res;
      },
      decode(data) {
        if (!(data instanceof Uint8Array))
          throw new Error("checksum.decode: input should be Uint8Array");
        const payload = data.slice(0, -len);
        const newChecksum = fn(payload).slice(0, len);
        const oldChecksum = data.slice(-len);
        for (let i = 0; i < len; i++)
          if (newChecksum[i] !== oldChecksum[i])
            throw new Error("Invalid checksum");
        return payload;
      }
    };
  }
  var base16 = chain(radix2(4), alphabet("0123456789ABCDEF"), join(""));
  var base32 = chain(radix2(5), alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"), padding(5), join(""));
  var base32hex = chain(radix2(5), alphabet("0123456789ABCDEFGHIJKLMNOPQRSTUV"), padding(5), join(""));
  var base32crockford = chain(radix2(5), alphabet("0123456789ABCDEFGHJKMNPQRSTVWXYZ"), join(""), normalize((s) => s.toUpperCase().replace(/O/g, "0").replace(/[IL]/g, "1")));
  var base64 = chain(radix2(6), alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"), padding(6), join(""));
  var base64url = chain(radix2(6), alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"), padding(6), join(""));
  var genBase58 = (abc) => chain(radix(58), alphabet(abc), join(""));
  var base58 = genBase58("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
  var base58flickr = genBase58("123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ");
  var base58xrp = genBase58("rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz");
  var XMR_BLOCK_LEN = [0, 2, 3, 5, 6, 7, 9, 10, 11];
  var base58xmr = {
    encode(data) {
      let res = "";
      for (let i = 0; i < data.length; i += 8) {
        const block = data.subarray(i, i + 8);
        res += base58.encode(block).padStart(XMR_BLOCK_LEN[block.length], "1");
      }
      return res;
    },
    decode(str) {
      let res = [];
      for (let i = 0; i < str.length; i += 11) {
        const slice = str.slice(i, i + 11);
        const blockLen = XMR_BLOCK_LEN.indexOf(slice.length);
        const block = base58.decode(slice);
        for (let j = 0; j < block.length - blockLen; j++) {
          if (block[j] !== 0)
            throw new Error("base58xmr: wrong padding");
        }
        res = res.concat(Array.from(block.slice(block.length - blockLen)));
      }
      return Uint8Array.from(res);
    }
  };
  var base58check = (sha2563) => chain(checksum(4, (data) => sha2563(sha2563(data))), base58);
  var BECH_ALPHABET = chain(alphabet("qpzry9x8gf2tvdw0s3jn54khce6mua7l"), join(""));
  var POLYMOD_GENERATORS = [996825010, 642813549, 513874426, 1027748829, 705979059];
  function bech32Polymod(pre) {
    const b = pre >> 25;
    let chk = (pre & 33554431) << 5;
    for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
      if ((b >> i & 1) === 1)
        chk ^= POLYMOD_GENERATORS[i];
    }
    return chk;
  }
  function bechChecksum(prefix, words, encodingConst = 1) {
    const len = prefix.length;
    let chk = 1;
    for (let i = 0; i < len; i++) {
      const c = prefix.charCodeAt(i);
      if (c < 33 || c > 126)
        throw new Error(`Invalid prefix (${prefix})`);
      chk = bech32Polymod(chk) ^ c >> 5;
    }
    chk = bech32Polymod(chk);
    for (let i = 0; i < len; i++)
      chk = bech32Polymod(chk) ^ prefix.charCodeAt(i) & 31;
    for (let v of words)
      chk = bech32Polymod(chk) ^ v;
    for (let i = 0; i < 6; i++)
      chk = bech32Polymod(chk);
    chk ^= encodingConst;
    return BECH_ALPHABET.encode(convertRadix2([chk % 2 ** 30], 30, 5, false));
  }
  function genBech32(encoding) {
    const ENCODING_CONST = encoding === "bech32" ? 1 : 734539939;
    const _words = radix2(5);
    const fromWords = _words.decode;
    const toWords = _words.encode;
    const fromWordsUnsafe = unsafeWrapper(fromWords);
    function encode(prefix, words, limit = 90) {
      if (typeof prefix !== "string")
        throw new Error(`bech32.encode prefix should be string, not ${typeof prefix}`);
      if (!Array.isArray(words) || words.length && typeof words[0] !== "number")
        throw new Error(`bech32.encode words should be array of numbers, not ${typeof words}`);
      const actualLength = prefix.length + 7 + words.length;
      if (limit !== false && actualLength > limit)
        throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
      prefix = prefix.toLowerCase();
      return `${prefix}1${BECH_ALPHABET.encode(words)}${bechChecksum(prefix, words, ENCODING_CONST)}`;
    }
    function decode2(str, limit = 90) {
      if (typeof str !== "string")
        throw new Error(`bech32.decode input should be string, not ${typeof str}`);
      if (str.length < 8 || limit !== false && str.length > limit)
        throw new TypeError(`Wrong string length: ${str.length} (${str}). Expected (8..${limit})`);
      const lowered = str.toLowerCase();
      if (str !== lowered && str !== str.toUpperCase())
        throw new Error(`String must be lowercase or uppercase`);
      str = lowered;
      const sepIndex = str.lastIndexOf("1");
      if (sepIndex === 0 || sepIndex === -1)
        throw new Error(`Letter "1" must be present between prefix and data only`);
      const prefix = str.slice(0, sepIndex);
      const _words2 = str.slice(sepIndex + 1);
      if (_words2.length < 6)
        throw new Error("Data must be at least 6 characters long");
      const words = BECH_ALPHABET.decode(_words2).slice(0, -6);
      const sum = bechChecksum(prefix, words, ENCODING_CONST);
      if (!_words2.endsWith(sum))
        throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
      return { prefix, words };
    }
    const decodeUnsafe = unsafeWrapper(decode2);
    function decodeToBytes(str) {
      const { prefix, words } = decode2(str, false);
      return { prefix, words, bytes: fromWords(words) };
    }
    return { encode, decode: decode2, decodeToBytes, decodeUnsafe, fromWords, fromWordsUnsafe, toWords };
  }
  var bech32 = genBech32("bech32");
  var bech32m = genBech32("bech32m");
  var utf8 = {
    encode: (data) => new TextDecoder().decode(data),
    decode: (str) => new TextEncoder().encode(str)
  };
  var hex = chain(radix2(4), alphabet("0123456789abcdef"), join(""), normalize((s) => {
    if (typeof s !== "string" || s.length % 2)
      throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
    return s.toLowerCase();
  }));
  var CODERS = {
    utf8,
    hex,
    base16,
    base32,
    base64,
    base64url,
    base58,
    base58xmr
  };
  var coderTypeError = `Invalid encoding type. Available types: ${Object.keys(CODERS).join(", ")}`;

  // node_modules/nostr-tools/lib/esm/nostr.mjs
  var import_english = __toESM(require_english(), 1);
  var import_bip39 = __toESM(require_bip39(), 1);

  // node_modules/@scure/bip32/lib/esm/index.js
  init_define_process();

  // node_modules/@scure/bip32/node_modules/@noble/hashes/esm/hmac.js
  init_define_process();

  // node_modules/@scure/bip32/node_modules/@noble/hashes/esm/_assert.js
  init_define_process();
  function number(n) {
    if (!Number.isSafeInteger(n) || n < 0)
      throw new Error(`Wrong positive integer: ${n}`);
  }
  function bool(b) {
    if (typeof b !== "boolean")
      throw new Error(`Expected boolean, not ${b}`);
  }
  function bytes(b, ...lengths) {
    if (!(b instanceof Uint8Array))
      throw new TypeError("Expected Uint8Array");
    if (lengths.length > 0 && !lengths.includes(b.length))
      throw new TypeError(`Expected Uint8Array of length ${lengths}, not of length=${b.length}`);
  }
  function hash(hash2) {
    if (typeof hash2 !== "function" || typeof hash2.create !== "function")
      throw new Error("Hash should be wrapped by utils.wrapConstructor");
    number(hash2.outputLen);
    number(hash2.blockLen);
  }
  function exists(instance, checkFinished = true) {
    if (instance.destroyed)
      throw new Error("Hash instance has been destroyed");
    if (checkFinished && instance.finished)
      throw new Error("Hash#digest() has already been called");
  }
  function output(out, instance) {
    bytes(out);
    const min = instance.outputLen;
    if (out.length < min) {
      throw new Error(`digestInto() expects output buffer of length at least ${min}`);
    }
  }
  var assert = {
    number,
    bool,
    bytes,
    hash,
    exists,
    output
  };
  var assert_default = assert;

  // node_modules/@scure/bip32/node_modules/@noble/hashes/esm/utils.js
  init_define_process();

  // node_modules/@scure/bip32/node_modules/@noble/hashes/esm/cryptoBrowser.js
  init_define_process();
  var crypto4 = {
    node: void 0,
    web: typeof self === "object" && "crypto" in self ? self.crypto : void 0
  };

  // node_modules/@scure/bip32/node_modules/@noble/hashes/esm/utils.js
  var createView2 = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
  var rotr2 = (word, shift) => word << 32 - shift | word >>> shift;
  var isLE2 = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
  if (!isLE2)
    throw new Error("Non little-endian hardware is not supported");
  var hexes3 = Array.from({ length: 256 }, (v, i) => i.toString(16).padStart(2, "0"));
  function bytesToHex2(uint8a) {
    if (!(uint8a instanceof Uint8Array))
      throw new Error("Uint8Array expected");
    let hex2 = "";
    for (let i = 0; i < uint8a.length; i++) {
      hex2 += hexes3[uint8a[i]];
    }
    return hex2;
  }
  function hexToBytes2(hex2) {
    if (typeof hex2 !== "string") {
      throw new TypeError("hexToBytes: expected string, got " + typeof hex2);
    }
    if (hex2.length % 2)
      throw new Error("hexToBytes: received invalid unpadded hex");
    const array = new Uint8Array(hex2.length / 2);
    for (let i = 0; i < array.length; i++) {
      const j = i * 2;
      const hexByte = hex2.slice(j, j + 2);
      const byte = Number.parseInt(hexByte, 16);
      if (Number.isNaN(byte) || byte < 0)
        throw new Error("Invalid byte sequence");
      array[i] = byte;
    }
    return array;
  }
  function utf8ToBytes2(str) {
    if (typeof str !== "string") {
      throw new TypeError(`utf8ToBytes expected string, got ${typeof str}`);
    }
    return new TextEncoder().encode(str);
  }
  function toBytes2(data) {
    if (typeof data === "string")
      data = utf8ToBytes2(data);
    if (!(data instanceof Uint8Array))
      throw new TypeError(`Expected input type is Uint8Array (got ${typeof data})`);
    return data;
  }
  function concatBytes2(...arrays) {
    if (!arrays.every((a) => a instanceof Uint8Array))
      throw new Error("Uint8Array list expected");
    if (arrays.length === 1)
      return arrays[0];
    const length = arrays.reduce((a, arr) => a + arr.length, 0);
    const result = new Uint8Array(length);
    for (let i = 0, pad = 0; i < arrays.length; i++) {
      const arr = arrays[i];
      result.set(arr, pad);
      pad += arr.length;
    }
    return result;
  }
  var Hash2 = class {
    clone() {
      return this._cloneInto();
    }
  };
  function wrapConstructor2(hashConstructor) {
    const hashC = (message) => hashConstructor().update(toBytes2(message)).digest();
    const tmp = hashConstructor();
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = () => hashConstructor();
    return hashC;
  }

  // node_modules/@scure/bip32/node_modules/@noble/hashes/esm/hmac.js
  var HMAC = class extends Hash2 {
    constructor(hash2, _key) {
      super();
      this.finished = false;
      this.destroyed = false;
      assert_default.hash(hash2);
      const key = toBytes2(_key);
      this.iHash = hash2.create();
      if (typeof this.iHash.update !== "function")
        throw new TypeError("Expected instance of class which extends utils.Hash");
      this.blockLen = this.iHash.blockLen;
      this.outputLen = this.iHash.outputLen;
      const blockLen = this.blockLen;
      const pad = new Uint8Array(blockLen);
      pad.set(key.length > blockLen ? hash2.create().update(key).digest() : key);
      for (let i = 0; i < pad.length; i++)
        pad[i] ^= 54;
      this.iHash.update(pad);
      this.oHash = hash2.create();
      for (let i = 0; i < pad.length; i++)
        pad[i] ^= 54 ^ 92;
      this.oHash.update(pad);
      pad.fill(0);
    }
    update(buf) {
      assert_default.exists(this);
      this.iHash.update(buf);
      return this;
    }
    digestInto(out) {
      assert_default.exists(this);
      assert_default.bytes(out, this.outputLen);
      this.finished = true;
      this.iHash.digestInto(out);
      this.oHash.update(out);
      this.oHash.digestInto(out);
      this.destroy();
    }
    digest() {
      const out = new Uint8Array(this.oHash.outputLen);
      this.digestInto(out);
      return out;
    }
    _cloneInto(to) {
      to || (to = Object.create(Object.getPrototypeOf(this), {}));
      const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
      to = to;
      to.finished = finished;
      to.destroyed = destroyed;
      to.blockLen = blockLen;
      to.outputLen = outputLen;
      to.oHash = oHash._cloneInto(to.oHash);
      to.iHash = iHash._cloneInto(to.iHash);
      return to;
    }
    destroy() {
      this.destroyed = true;
      this.oHash.destroy();
      this.iHash.destroy();
    }
  };
  var hmac = (hash2, key, message) => new HMAC(hash2, key).update(message).digest();
  hmac.create = (hash2, key) => new HMAC(hash2, key);

  // node_modules/@scure/bip32/node_modules/@noble/hashes/esm/ripemd160.js
  init_define_process();

  // node_modules/@scure/bip32/node_modules/@noble/hashes/esm/_sha2.js
  init_define_process();
  function setBigUint642(view, byteOffset, value, isLE3) {
    if (typeof view.setBigUint64 === "function")
      return view.setBigUint64(byteOffset, value, isLE3);
    const _32n2 = BigInt(32);
    const _u32_max = BigInt(4294967295);
    const wh = Number(value >> _32n2 & _u32_max);
    const wl = Number(value & _u32_max);
    const h = isLE3 ? 4 : 0;
    const l = isLE3 ? 0 : 4;
    view.setUint32(byteOffset + h, wh, isLE3);
    view.setUint32(byteOffset + l, wl, isLE3);
  }
  var SHA22 = class extends Hash2 {
    constructor(blockLen, outputLen, padOffset, isLE3) {
      super();
      this.blockLen = blockLen;
      this.outputLen = outputLen;
      this.padOffset = padOffset;
      this.isLE = isLE3;
      this.finished = false;
      this.length = 0;
      this.pos = 0;
      this.destroyed = false;
      this.buffer = new Uint8Array(blockLen);
      this.view = createView2(this.buffer);
    }
    update(data) {
      assert_default.exists(this);
      const { view, buffer, blockLen } = this;
      data = toBytes2(data);
      const len = data.length;
      for (let pos = 0; pos < len; ) {
        const take = Math.min(blockLen - this.pos, len - pos);
        if (take === blockLen) {
          const dataView = createView2(data);
          for (; blockLen <= len - pos; pos += blockLen)
            this.process(dataView, pos);
          continue;
        }
        buffer.set(data.subarray(pos, pos + take), this.pos);
        this.pos += take;
        pos += take;
        if (this.pos === blockLen) {
          this.process(view, 0);
          this.pos = 0;
        }
      }
      this.length += data.length;
      this.roundClean();
      return this;
    }
    digestInto(out) {
      assert_default.exists(this);
      assert_default.output(out, this);
      this.finished = true;
      const { buffer, view, blockLen, isLE: isLE3 } = this;
      let { pos } = this;
      buffer[pos++] = 128;
      this.buffer.subarray(pos).fill(0);
      if (this.padOffset > blockLen - pos) {
        this.process(view, 0);
        pos = 0;
      }
      for (let i = pos; i < blockLen; i++)
        buffer[i] = 0;
      setBigUint642(view, blockLen - 8, BigInt(this.length * 8), isLE3);
      this.process(view, 0);
      const oview = createView2(out);
      const len = this.outputLen;
      if (len % 4)
        throw new Error("_sha2: outputLen should be aligned to 32bit");
      const outLen = len / 4;
      const state = this.get();
      if (outLen > state.length)
        throw new Error("_sha2: outputLen bigger than state");
      for (let i = 0; i < outLen; i++)
        oview.setUint32(4 * i, state[i], isLE3);
    }
    digest() {
      const { buffer, outputLen } = this;
      this.digestInto(buffer);
      const res = buffer.slice(0, outputLen);
      this.destroy();
      return res;
    }
    _cloneInto(to) {
      to || (to = new this.constructor());
      to.set(...this.get());
      const { blockLen, buffer, length, finished, destroyed, pos } = this;
      to.length = length;
      to.pos = pos;
      to.finished = finished;
      to.destroyed = destroyed;
      if (length % blockLen)
        to.buffer.set(buffer);
      return to;
    }
  };

  // node_modules/@scure/bip32/node_modules/@noble/hashes/esm/ripemd160.js
  var Rho = new Uint8Array([7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8]);
  var Id = Uint8Array.from({ length: 16 }, (_, i) => i);
  var Pi = Id.map((i) => (9 * i + 5) % 16);
  var idxL = [Id];
  var idxR = [Pi];
  for (let i = 0; i < 4; i++)
    for (let j of [idxL, idxR])
      j.push(j[i].map((k) => Rho[k]));
  var shifts = [
    [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8],
    [12, 13, 11, 15, 6, 9, 9, 7, 12, 15, 11, 13, 7, 8, 7, 7],
    [13, 15, 14, 11, 7, 7, 6, 8, 13, 14, 13, 12, 5, 5, 6, 9],
    [14, 11, 12, 14, 8, 6, 5, 5, 15, 12, 15, 14, 9, 9, 8, 6],
    [15, 12, 13, 13, 9, 5, 8, 6, 14, 11, 12, 11, 8, 6, 5, 5]
  ].map((i) => new Uint8Array(i));
  var shiftsL = idxL.map((idx, i) => idx.map((j) => shifts[i][j]));
  var shiftsR = idxR.map((idx, i) => idx.map((j) => shifts[i][j]));
  var Kl = new Uint32Array([0, 1518500249, 1859775393, 2400959708, 2840853838]);
  var Kr = new Uint32Array([1352829926, 1548603684, 1836072691, 2053994217, 0]);
  var rotl = (word, shift) => word << shift | word >>> 32 - shift;
  function f(group, x, y, z) {
    if (group === 0)
      return x ^ y ^ z;
    else if (group === 1)
      return x & y | ~x & z;
    else if (group === 2)
      return (x | ~y) ^ z;
    else if (group === 3)
      return x & z | y & ~z;
    else
      return x ^ (y | ~z);
  }
  var BUF = new Uint32Array(16);
  var RIPEMD160 = class extends SHA22 {
    constructor() {
      super(64, 20, 8, true);
      this.h0 = 1732584193 | 0;
      this.h1 = 4023233417 | 0;
      this.h2 = 2562383102 | 0;
      this.h3 = 271733878 | 0;
      this.h4 = 3285377520 | 0;
    }
    get() {
      const { h0, h1, h2, h3, h4 } = this;
      return [h0, h1, h2, h3, h4];
    }
    set(h0, h1, h2, h3, h4) {
      this.h0 = h0 | 0;
      this.h1 = h1 | 0;
      this.h2 = h2 | 0;
      this.h3 = h3 | 0;
      this.h4 = h4 | 0;
    }
    process(view, offset) {
      for (let i = 0; i < 16; i++, offset += 4)
        BUF[i] = view.getUint32(offset, true);
      let al = this.h0 | 0, ar = al, bl = this.h1 | 0, br = bl, cl = this.h2 | 0, cr = cl, dl = this.h3 | 0, dr = dl, el = this.h4 | 0, er = el;
      for (let group = 0; group < 5; group++) {
        const rGroup = 4 - group;
        const hbl = Kl[group], hbr = Kr[group];
        const rl = idxL[group], rr = idxR[group];
        const sl = shiftsL[group], sr = shiftsR[group];
        for (let i = 0; i < 16; i++) {
          const tl = rotl(al + f(group, bl, cl, dl) + BUF[rl[i]] + hbl, sl[i]) + el | 0;
          al = el, el = dl, dl = rotl(cl, 10) | 0, cl = bl, bl = tl;
        }
        for (let i = 0; i < 16; i++) {
          const tr = rotl(ar + f(rGroup, br, cr, dr) + BUF[rr[i]] + hbr, sr[i]) + er | 0;
          ar = er, er = dr, dr = rotl(cr, 10) | 0, cr = br, br = tr;
        }
      }
      this.set(this.h1 + cl + dr | 0, this.h2 + dl + er | 0, this.h3 + el + ar | 0, this.h4 + al + br | 0, this.h0 + bl + cr | 0);
    }
    roundClean() {
      BUF.fill(0);
    }
    destroy() {
      this.destroyed = true;
      this.buffer.fill(0);
      this.set(0, 0, 0, 0, 0);
    }
  };
  var ripemd160 = wrapConstructor2(() => new RIPEMD160());

  // node_modules/@scure/bip32/node_modules/@noble/hashes/esm/sha256.js
  init_define_process();
  var Chi2 = (a, b, c) => a & b ^ ~a & c;
  var Maj2 = (a, b, c) => a & b ^ a & c ^ b & c;
  var SHA256_K2 = new Uint32Array([
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ]);
  var IV2 = new Uint32Array([
    1779033703,
    3144134277,
    1013904242,
    2773480762,
    1359893119,
    2600822924,
    528734635,
    1541459225
  ]);
  var SHA256_W2 = new Uint32Array(64);
  var SHA2562 = class extends SHA22 {
    constructor() {
      super(64, 32, 8, false);
      this.A = IV2[0] | 0;
      this.B = IV2[1] | 0;
      this.C = IV2[2] | 0;
      this.D = IV2[3] | 0;
      this.E = IV2[4] | 0;
      this.F = IV2[5] | 0;
      this.G = IV2[6] | 0;
      this.H = IV2[7] | 0;
    }
    get() {
      const { A, B, C, D, E, F, G, H } = this;
      return [A, B, C, D, E, F, G, H];
    }
    set(A, B, C, D, E, F, G, H) {
      this.A = A | 0;
      this.B = B | 0;
      this.C = C | 0;
      this.D = D | 0;
      this.E = E | 0;
      this.F = F | 0;
      this.G = G | 0;
      this.H = H | 0;
    }
    process(view, offset) {
      for (let i = 0; i < 16; i++, offset += 4)
        SHA256_W2[i] = view.getUint32(offset, false);
      for (let i = 16; i < 64; i++) {
        const W15 = SHA256_W2[i - 15];
        const W2 = SHA256_W2[i - 2];
        const s0 = rotr2(W15, 7) ^ rotr2(W15, 18) ^ W15 >>> 3;
        const s1 = rotr2(W2, 17) ^ rotr2(W2, 19) ^ W2 >>> 10;
        SHA256_W2[i] = s1 + SHA256_W2[i - 7] + s0 + SHA256_W2[i - 16] | 0;
      }
      let { A, B, C, D, E, F, G, H } = this;
      for (let i = 0; i < 64; i++) {
        const sigma1 = rotr2(E, 6) ^ rotr2(E, 11) ^ rotr2(E, 25);
        const T1 = H + sigma1 + Chi2(E, F, G) + SHA256_K2[i] + SHA256_W2[i] | 0;
        const sigma0 = rotr2(A, 2) ^ rotr2(A, 13) ^ rotr2(A, 22);
        const T2 = sigma0 + Maj2(A, B, C) | 0;
        H = G;
        G = F;
        F = E;
        E = D + T1 | 0;
        D = C;
        C = B;
        B = A;
        A = T1 + T2 | 0;
      }
      A = A + this.A | 0;
      B = B + this.B | 0;
      C = C + this.C | 0;
      D = D + this.D | 0;
      E = E + this.E | 0;
      F = F + this.F | 0;
      G = G + this.G | 0;
      H = H + this.H | 0;
      this.set(A, B, C, D, E, F, G, H);
    }
    roundClean() {
      SHA256_W2.fill(0);
    }
    destroy() {
      this.set(0, 0, 0, 0, 0, 0, 0, 0);
      this.buffer.fill(0);
    }
  };
  var SHA224 = class extends SHA2562 {
    constructor() {
      super();
      this.A = 3238371032 | 0;
      this.B = 914150663 | 0;
      this.C = 812702999 | 0;
      this.D = 4144912697 | 0;
      this.E = 4290775857 | 0;
      this.F = 1750603025 | 0;
      this.G = 1694076839 | 0;
      this.H = 3204075428 | 0;
      this.outputLen = 28;
    }
  };
  var sha2562 = wrapConstructor2(() => new SHA2562());
  var sha224 = wrapConstructor2(() => new SHA224());

  // node_modules/@scure/bip32/node_modules/@noble/hashes/esm/sha512.js
  init_define_process();

  // node_modules/@scure/bip32/node_modules/@noble/hashes/esm/_u64.js
  init_define_process();
  var U32_MASK64 = BigInt(2 ** 32 - 1);
  var _32n = BigInt(32);
  function fromBig(n, le = false) {
    if (le)
      return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
    return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
  }
  function split(lst, le = false) {
    let Ah = new Uint32Array(lst.length);
    let Al = new Uint32Array(lst.length);
    for (let i = 0; i < lst.length; i++) {
      const { h, l } = fromBig(lst[i], le);
      [Ah[i], Al[i]] = [h, l];
    }
    return [Ah, Al];
  }
  var toBig = (h, l) => BigInt(h >>> 0) << _32n | BigInt(l >>> 0);
  var shrSH = (h, l, s) => h >>> s;
  var shrSL = (h, l, s) => h << 32 - s | l >>> s;
  var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
  var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
  var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
  var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
  var rotr32H = (h, l) => l;
  var rotr32L = (h, l) => h;
  var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
  var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
  var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
  var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
  function add(Ah, Al, Bh, Bl) {
    const l = (Al >>> 0) + (Bl >>> 0);
    return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
  }
  var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
  var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
  var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
  var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
  var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
  var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;
  var u64 = {
    fromBig,
    split,
    toBig,
    shrSH,
    shrSL,
    rotrSH,
    rotrSL,
    rotrBH,
    rotrBL,
    rotr32H,
    rotr32L,
    rotlSH,
    rotlSL,
    rotlBH,
    rotlBL,
    add,
    add3L,
    add3H,
    add4L,
    add4H,
    add5H,
    add5L
  };
  var u64_default = u64;

  // node_modules/@scure/bip32/node_modules/@noble/hashes/esm/sha512.js
  var [SHA512_Kh, SHA512_Kl] = u64_default.split([
    "0x428a2f98d728ae22",
    "0x7137449123ef65cd",
    "0xb5c0fbcfec4d3b2f",
    "0xe9b5dba58189dbbc",
    "0x3956c25bf348b538",
    "0x59f111f1b605d019",
    "0x923f82a4af194f9b",
    "0xab1c5ed5da6d8118",
    "0xd807aa98a3030242",
    "0x12835b0145706fbe",
    "0x243185be4ee4b28c",
    "0x550c7dc3d5ffb4e2",
    "0x72be5d74f27b896f",
    "0x80deb1fe3b1696b1",
    "0x9bdc06a725c71235",
    "0xc19bf174cf692694",
    "0xe49b69c19ef14ad2",
    "0xefbe4786384f25e3",
    "0x0fc19dc68b8cd5b5",
    "0x240ca1cc77ac9c65",
    "0x2de92c6f592b0275",
    "0x4a7484aa6ea6e483",
    "0x5cb0a9dcbd41fbd4",
    "0x76f988da831153b5",
    "0x983e5152ee66dfab",
    "0xa831c66d2db43210",
    "0xb00327c898fb213f",
    "0xbf597fc7beef0ee4",
    "0xc6e00bf33da88fc2",
    "0xd5a79147930aa725",
    "0x06ca6351e003826f",
    "0x142929670a0e6e70",
    "0x27b70a8546d22ffc",
    "0x2e1b21385c26c926",
    "0x4d2c6dfc5ac42aed",
    "0x53380d139d95b3df",
    "0x650a73548baf63de",
    "0x766a0abb3c77b2a8",
    "0x81c2c92e47edaee6",
    "0x92722c851482353b",
    "0xa2bfe8a14cf10364",
    "0xa81a664bbc423001",
    "0xc24b8b70d0f89791",
    "0xc76c51a30654be30",
    "0xd192e819d6ef5218",
    "0xd69906245565a910",
    "0xf40e35855771202a",
    "0x106aa07032bbd1b8",
    "0x19a4c116b8d2d0c8",
    "0x1e376c085141ab53",
    "0x2748774cdf8eeb99",
    "0x34b0bcb5e19b48a8",
    "0x391c0cb3c5c95a63",
    "0x4ed8aa4ae3418acb",
    "0x5b9cca4f7763e373",
    "0x682e6ff3d6b2b8a3",
    "0x748f82ee5defb2fc",
    "0x78a5636f43172f60",
    "0x84c87814a1f0ab72",
    "0x8cc702081a6439ec",
    "0x90befffa23631e28",
    "0xa4506cebde82bde9",
    "0xbef9a3f7b2c67915",
    "0xc67178f2e372532b",
    "0xca273eceea26619c",
    "0xd186b8c721c0c207",
    "0xeada7dd6cde0eb1e",
    "0xf57d4f7fee6ed178",
    "0x06f067aa72176fba",
    "0x0a637dc5a2c898a6",
    "0x113f9804bef90dae",
    "0x1b710b35131c471b",
    "0x28db77f523047d84",
    "0x32caab7b40c72493",
    "0x3c9ebe0a15c9bebc",
    "0x431d67c49c100d4c",
    "0x4cc5d4becb3e42b6",
    "0x597f299cfc657e2a",
    "0x5fcb6fab3ad6faec",
    "0x6c44198c4a475817"
  ].map((n) => BigInt(n)));
  var SHA512_W_H = new Uint32Array(80);
  var SHA512_W_L = new Uint32Array(80);
  var SHA512 = class extends SHA22 {
    constructor() {
      super(128, 64, 16, false);
      this.Ah = 1779033703 | 0;
      this.Al = 4089235720 | 0;
      this.Bh = 3144134277 | 0;
      this.Bl = 2227873595 | 0;
      this.Ch = 1013904242 | 0;
      this.Cl = 4271175723 | 0;
      this.Dh = 2773480762 | 0;
      this.Dl = 1595750129 | 0;
      this.Eh = 1359893119 | 0;
      this.El = 2917565137 | 0;
      this.Fh = 2600822924 | 0;
      this.Fl = 725511199 | 0;
      this.Gh = 528734635 | 0;
      this.Gl = 4215389547 | 0;
      this.Hh = 1541459225 | 0;
      this.Hl = 327033209 | 0;
    }
    get() {
      const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
      return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
    }
    set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
      this.Ah = Ah | 0;
      this.Al = Al | 0;
      this.Bh = Bh | 0;
      this.Bl = Bl | 0;
      this.Ch = Ch | 0;
      this.Cl = Cl | 0;
      this.Dh = Dh | 0;
      this.Dl = Dl | 0;
      this.Eh = Eh | 0;
      this.El = El | 0;
      this.Fh = Fh | 0;
      this.Fl = Fl | 0;
      this.Gh = Gh | 0;
      this.Gl = Gl | 0;
      this.Hh = Hh | 0;
      this.Hl = Hl | 0;
    }
    process(view, offset) {
      for (let i = 0; i < 16; i++, offset += 4) {
        SHA512_W_H[i] = view.getUint32(offset);
        SHA512_W_L[i] = view.getUint32(offset += 4);
      }
      for (let i = 16; i < 80; i++) {
        const W15h = SHA512_W_H[i - 15] | 0;
        const W15l = SHA512_W_L[i - 15] | 0;
        const s0h = u64_default.rotrSH(W15h, W15l, 1) ^ u64_default.rotrSH(W15h, W15l, 8) ^ u64_default.shrSH(W15h, W15l, 7);
        const s0l = u64_default.rotrSL(W15h, W15l, 1) ^ u64_default.rotrSL(W15h, W15l, 8) ^ u64_default.shrSL(W15h, W15l, 7);
        const W2h = SHA512_W_H[i - 2] | 0;
        const W2l = SHA512_W_L[i - 2] | 0;
        const s1h = u64_default.rotrSH(W2h, W2l, 19) ^ u64_default.rotrBH(W2h, W2l, 61) ^ u64_default.shrSH(W2h, W2l, 6);
        const s1l = u64_default.rotrSL(W2h, W2l, 19) ^ u64_default.rotrBL(W2h, W2l, 61) ^ u64_default.shrSL(W2h, W2l, 6);
        const SUMl = u64_default.add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
        const SUMh = u64_default.add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
        SHA512_W_H[i] = SUMh | 0;
        SHA512_W_L[i] = SUMl | 0;
      }
      let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
      for (let i = 0; i < 80; i++) {
        const sigma1h = u64_default.rotrSH(Eh, El, 14) ^ u64_default.rotrSH(Eh, El, 18) ^ u64_default.rotrBH(Eh, El, 41);
        const sigma1l = u64_default.rotrSL(Eh, El, 14) ^ u64_default.rotrSL(Eh, El, 18) ^ u64_default.rotrBL(Eh, El, 41);
        const CHIh = Eh & Fh ^ ~Eh & Gh;
        const CHIl = El & Fl ^ ~El & Gl;
        const T1ll = u64_default.add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
        const T1h = u64_default.add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
        const T1l = T1ll | 0;
        const sigma0h = u64_default.rotrSH(Ah, Al, 28) ^ u64_default.rotrBH(Ah, Al, 34) ^ u64_default.rotrBH(Ah, Al, 39);
        const sigma0l = u64_default.rotrSL(Ah, Al, 28) ^ u64_default.rotrBL(Ah, Al, 34) ^ u64_default.rotrBL(Ah, Al, 39);
        const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
        const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
        Hh = Gh | 0;
        Hl = Gl | 0;
        Gh = Fh | 0;
        Gl = Fl | 0;
        Fh = Eh | 0;
        Fl = El | 0;
        ({ h: Eh, l: El } = u64_default.add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
        Dh = Ch | 0;
        Dl = Cl | 0;
        Ch = Bh | 0;
        Cl = Bl | 0;
        Bh = Ah | 0;
        Bl = Al | 0;
        const All = u64_default.add3L(T1l, sigma0l, MAJl);
        Ah = u64_default.add3H(All, T1h, sigma0h, MAJh);
        Al = All | 0;
      }
      ({ h: Ah, l: Al } = u64_default.add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
      ({ h: Bh, l: Bl } = u64_default.add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
      ({ h: Ch, l: Cl } = u64_default.add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
      ({ h: Dh, l: Dl } = u64_default.add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
      ({ h: Eh, l: El } = u64_default.add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
      ({ h: Fh, l: Fl } = u64_default.add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
      ({ h: Gh, l: Gl } = u64_default.add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
      ({ h: Hh, l: Hl } = u64_default.add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
      this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
    }
    roundClean() {
      SHA512_W_H.fill(0);
      SHA512_W_L.fill(0);
    }
    destroy() {
      this.buffer.fill(0);
      this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
  };
  var SHA512_224 = class extends SHA512 {
    constructor() {
      super();
      this.Ah = 2352822216 | 0;
      this.Al = 424955298 | 0;
      this.Bh = 1944164710 | 0;
      this.Bl = 2312950998 | 0;
      this.Ch = 502970286 | 0;
      this.Cl = 855612546 | 0;
      this.Dh = 1738396948 | 0;
      this.Dl = 1479516111 | 0;
      this.Eh = 258812777 | 0;
      this.El = 2077511080 | 0;
      this.Fh = 2011393907 | 0;
      this.Fl = 79989058 | 0;
      this.Gh = 1067287976 | 0;
      this.Gl = 1780299464 | 0;
      this.Hh = 286451373 | 0;
      this.Hl = 2446758561 | 0;
      this.outputLen = 28;
    }
  };
  var SHA512_256 = class extends SHA512 {
    constructor() {
      super();
      this.Ah = 573645204 | 0;
      this.Al = 4230739756 | 0;
      this.Bh = 2673172387 | 0;
      this.Bl = 3360449730 | 0;
      this.Ch = 596883563 | 0;
      this.Cl = 1867755857 | 0;
      this.Dh = 2520282905 | 0;
      this.Dl = 1497426621 | 0;
      this.Eh = 2519219938 | 0;
      this.El = 2827943907 | 0;
      this.Fh = 3193839141 | 0;
      this.Fl = 1401305490 | 0;
      this.Gh = 721525244 | 0;
      this.Gl = 746961066 | 0;
      this.Hh = 246885852 | 0;
      this.Hl = 2177182882 | 0;
      this.outputLen = 32;
    }
  };
  var SHA384 = class extends SHA512 {
    constructor() {
      super();
      this.Ah = 3418070365 | 0;
      this.Al = 3238371032 | 0;
      this.Bh = 1654270250 | 0;
      this.Bl = 914150663 | 0;
      this.Ch = 2438529370 | 0;
      this.Cl = 812702999 | 0;
      this.Dh = 355462360 | 0;
      this.Dl = 4144912697 | 0;
      this.Eh = 1731405415 | 0;
      this.El = 4290775857 | 0;
      this.Fh = 2394180231 | 0;
      this.Fl = 1750603025 | 0;
      this.Gh = 3675008525 | 0;
      this.Gl = 1694076839 | 0;
      this.Hh = 1203062813 | 0;
      this.Hl = 3204075428 | 0;
      this.outputLen = 48;
    }
  };
  var sha512 = wrapConstructor2(() => new SHA512());
  var sha512_224 = wrapConstructor2(() => new SHA512_224());
  var sha512_256 = wrapConstructor2(() => new SHA512_256());
  var sha384 = wrapConstructor2(() => new SHA384());

  // node_modules/@scure/bip32/lib/esm/index.js
  utils.hmacSha256Sync = (key, ...msgs) => hmac(sha2562, key, utils.concatBytes(...msgs));
  var base58check2 = base58check(sha2562);
  function bytesToNumber2(bytes2) {
    return BigInt(`0x${bytesToHex2(bytes2)}`);
  }
  function numberToBytes(num) {
    return hexToBytes2(num.toString(16).padStart(64, "0"));
  }
  var MASTER_SECRET = utf8ToBytes2("Bitcoin seed");
  var BITCOIN_VERSIONS = { private: 76066276, public: 76067358 };
  var HARDENED_OFFSET = 2147483648;
  var hash160 = (data) => ripemd160(sha2562(data));
  var fromU32 = (data) => createView2(data).getUint32(0, false);
  var toU32 = (n) => {
    if (!Number.isSafeInteger(n) || n < 0 || n > 2 ** 32 - 1) {
      throw new Error(`Invalid number=${n}. Should be from 0 to 2 ** 32 - 1`);
    }
    const buf = new Uint8Array(4);
    createView2(buf).setUint32(0, n, false);
    return buf;
  };
  var HDKey = class {
    constructor(opt) {
      this.depth = 0;
      this.index = 0;
      this.chainCode = null;
      this.parentFingerprint = 0;
      if (!opt || typeof opt !== "object") {
        throw new Error("HDKey.constructor must not be called directly");
      }
      this.versions = opt.versions || BITCOIN_VERSIONS;
      this.depth = opt.depth || 0;
      this.chainCode = opt.chainCode;
      this.index = opt.index || 0;
      this.parentFingerprint = opt.parentFingerprint || 0;
      if (!this.depth) {
        if (this.parentFingerprint || this.index) {
          throw new Error("HDKey: zero depth with non-zero index/parent fingerprint");
        }
      }
      if (opt.publicKey && opt.privateKey) {
        throw new Error("HDKey: publicKey and privateKey at same time.");
      }
      if (opt.privateKey) {
        if (!utils.isValidPrivateKey(opt.privateKey)) {
          throw new Error("Invalid private key");
        }
        this.privKey = typeof opt.privateKey === "bigint" ? opt.privateKey : bytesToNumber2(opt.privateKey);
        this.privKeyBytes = numberToBytes(this.privKey);
        this.pubKey = getPublicKey(opt.privateKey, true);
      } else if (opt.publicKey) {
        this.pubKey = Point.fromHex(opt.publicKey).toRawBytes(true);
      } else {
        throw new Error("HDKey: no public or private key provided");
      }
      this.pubHash = hash160(this.pubKey);
    }
    get fingerprint() {
      if (!this.pubHash) {
        throw new Error("No publicKey set!");
      }
      return fromU32(this.pubHash);
    }
    get identifier() {
      return this.pubHash;
    }
    get pubKeyHash() {
      return this.pubHash;
    }
    get privateKey() {
      return this.privKeyBytes || null;
    }
    get publicKey() {
      return this.pubKey || null;
    }
    get privateExtendedKey() {
      const priv = this.privateKey;
      if (!priv) {
        throw new Error("No private key");
      }
      return base58check2.encode(this.serialize(this.versions.private, concatBytes2(new Uint8Array([0]), priv)));
    }
    get publicExtendedKey() {
      if (!this.pubKey) {
        throw new Error("No public key");
      }
      return base58check2.encode(this.serialize(this.versions.public, this.pubKey));
    }
    static fromMasterSeed(seed, versions = BITCOIN_VERSIONS) {
      bytes(seed);
      if (8 * seed.length < 128 || 8 * seed.length > 512) {
        throw new Error(`HDKey: wrong seed length=${seed.length}. Should be between 128 and 512 bits; 256 bits is advised)`);
      }
      const I = hmac(sha512, MASTER_SECRET, seed);
      return new HDKey({
        versions,
        chainCode: I.slice(32),
        privateKey: I.slice(0, 32)
      });
    }
    static fromExtendedKey(base58key, versions = BITCOIN_VERSIONS) {
      const keyBuffer = base58check2.decode(base58key);
      const keyView = createView2(keyBuffer);
      const version = keyView.getUint32(0, false);
      const opt = {
        versions,
        depth: keyBuffer[4],
        parentFingerprint: keyView.getUint32(5, false),
        index: keyView.getUint32(9, false),
        chainCode: keyBuffer.slice(13, 45)
      };
      const key = keyBuffer.slice(45);
      const isPriv = key[0] === 0;
      if (version !== versions[isPriv ? "private" : "public"]) {
        throw new Error("Version mismatch");
      }
      if (isPriv) {
        return new HDKey({ ...opt, privateKey: key.slice(1) });
      } else {
        return new HDKey({ ...opt, publicKey: key });
      }
    }
    static fromJSON(json) {
      return HDKey.fromExtendedKey(json.xpriv);
    }
    derive(path) {
      if (!/^[mM]'?/.test(path)) {
        throw new Error('Path must start with "m" or "M"');
      }
      if (/^[mM]'?$/.test(path)) {
        return this;
      }
      const parts = path.replace(/^[mM]'?\//, "").split("/");
      let child = this;
      for (const c of parts) {
        const m = /^(\d+)('?)$/.exec(c);
        if (!m || m.length !== 3) {
          throw new Error(`Invalid child index: ${c}`);
        }
        let idx = +m[1];
        if (!Number.isSafeInteger(idx) || idx >= HARDENED_OFFSET) {
          throw new Error("Invalid index");
        }
        if (m[2] === "'") {
          idx += HARDENED_OFFSET;
        }
        child = child.deriveChild(idx);
      }
      return child;
    }
    deriveChild(index) {
      if (!this.pubKey || !this.chainCode) {
        throw new Error("No publicKey or chainCode set");
      }
      let data = toU32(index);
      if (index >= HARDENED_OFFSET) {
        const priv = this.privateKey;
        if (!priv) {
          throw new Error("Could not derive hardened child key");
        }
        data = concatBytes2(new Uint8Array([0]), priv, data);
      } else {
        data = concatBytes2(this.pubKey, data);
      }
      const I = hmac(sha512, this.chainCode, data);
      const childTweak = bytesToNumber2(I.slice(0, 32));
      const chainCode = I.slice(32);
      if (!utils.isValidPrivateKey(childTweak)) {
        throw new Error("Tweak bigger than curve order");
      }
      const opt = {
        versions: this.versions,
        chainCode,
        depth: this.depth + 1,
        parentFingerprint: this.fingerprint,
        index
      };
      try {
        if (this.privateKey) {
          const added = utils.mod(this.privKey + childTweak, CURVE.n);
          if (!utils.isValidPrivateKey(added)) {
            throw new Error("The tweak was out of range or the resulted private key is invalid");
          }
          opt.privateKey = added;
        } else {
          const added = Point.fromHex(this.pubKey).add(Point.fromPrivateKey(childTweak));
          if (added.equals(Point.ZERO)) {
            throw new Error("The tweak was equal to negative P, which made the result key invalid");
          }
          opt.publicKey = added.toRawBytes(true);
        }
        return new HDKey(opt);
      } catch (err) {
        return this.deriveChild(index + 1);
      }
    }
    sign(hash2) {
      if (!this.privateKey) {
        throw new Error("No privateKey set!");
      }
      bytes(hash2, 32);
      return signSync(hash2, this.privKey, {
        canonical: true,
        der: false
      });
    }
    verify(hash2, signature) {
      bytes(hash2, 32);
      bytes(signature, 64);
      if (!this.publicKey) {
        throw new Error("No publicKey set!");
      }
      let sig;
      try {
        sig = Signature.fromCompact(signature);
      } catch (error) {
        return false;
      }
      return verify(sig, hash2, this.publicKey);
    }
    wipePrivateData() {
      this.privKey = void 0;
      if (this.privKeyBytes) {
        this.privKeyBytes.fill(0);
        this.privKeyBytes = void 0;
      }
      return this;
    }
    toJSON() {
      return {
        xpriv: this.privateExtendedKey,
        xpub: this.publicExtendedKey
      };
    }
    serialize(version, key) {
      if (!this.chainCode) {
        throw new Error("No chainCode set");
      }
      bytes(key, 33);
      return concatBytes2(toU32(version), new Uint8Array([this.depth]), toU32(this.parentFingerprint), toU32(this.index), this.chainCode, key);
    }
  };

  // node_modules/nostr-tools/node_modules/@noble/hashes/esm/hmac.js
  init_define_process();
  var HMAC2 = class extends Hash {
    constructor(hash2, _key) {
      super();
      this.finished = false;
      this.destroyed = false;
      assertHash(hash2);
      const key = toBytes(_key);
      this.iHash = hash2.create();
      if (!(this.iHash instanceof Hash))
        throw new TypeError("Expected instance of class which extends utils.Hash");
      const blockLen = this.blockLen = this.iHash.blockLen;
      this.outputLen = this.iHash.outputLen;
      const pad = new Uint8Array(blockLen);
      pad.set(key.length > this.iHash.blockLen ? hash2.create().update(key).digest() : key);
      for (let i = 0; i < pad.length; i++)
        pad[i] ^= 54;
      this.iHash.update(pad);
      this.oHash = hash2.create();
      for (let i = 0; i < pad.length; i++)
        pad[i] ^= 54 ^ 92;
      this.oHash.update(pad);
      pad.fill(0);
    }
    update(buf) {
      if (this.destroyed)
        throw new Error("instance is destroyed");
      this.iHash.update(buf);
      return this;
    }
    digestInto(out) {
      if (this.destroyed)
        throw new Error("instance is destroyed");
      if (!(out instanceof Uint8Array) || out.length !== this.outputLen)
        throw new Error("HMAC: Invalid output buffer");
      if (this.finished)
        throw new Error("digest() was already called");
      this.finished = true;
      this.iHash.digestInto(out);
      this.oHash.update(out);
      this.oHash.digestInto(out);
      this.destroy();
    }
    digest() {
      const out = new Uint8Array(this.oHash.outputLen);
      this.digestInto(out);
      return out;
    }
    _cloneInto(to) {
      to || (to = Object.create(Object.getPrototypeOf(this), {}));
      const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
      to = to;
      to.finished = finished;
      to.destroyed = destroyed;
      to.blockLen = blockLen;
      to.outputLen = outputLen;
      to.oHash = oHash._cloneInto(to.oHash);
      to.iHash = iHash._cloneInto(to.iHash);
      return to;
    }
    destroy() {
      this.destroyed = true;
      this.oHash.destroy();
      this.iHash.destroy();
    }
  };
  var hmac2 = (hash2, key, message) => new HMAC2(hash2, key).update(message).digest();
  hmac2.create = (hash2, key) => new HMAC2(hash2, key);

  // node_modules/nostr-tools/lib/esm/nostr.mjs
  var __defProp2 = Object.defineProperty;
  var __export2 = (target, all) => {
    for (var name in all)
      __defProp2(target, name, { get: all[name], enumerable: true });
  };
  function getPublicKey2(privateKey) {
    return utils.bytesToHex(schnorr.getPublicKey(privateKey));
  }
  var utils_exports = {};
  __export2(utils_exports, {
    insertEventIntoAscendingList: () => insertEventIntoAscendingList,
    insertEventIntoDescendingList: () => insertEventIntoDescendingList,
    normalizeURL: () => normalizeURL,
    utf8Decoder: () => utf8Decoder,
    utf8Encoder: () => utf8Encoder
  });
  var utf8Decoder = new TextDecoder("utf-8");
  var utf8Encoder = new TextEncoder();
  function normalizeURL(url) {
    let p = new URL(url);
    p.pathname = p.pathname.replace(/\/+/g, "/");
    if (p.pathname.endsWith("/"))
      p.pathname = p.pathname.slice(0, -1);
    if (p.port === "80" && p.protocol === "ws:" || p.port === "443" && p.protocol === "wss:")
      p.port = "";
    p.searchParams.sort();
    p.hash = "";
    return p.toString();
  }
  function insertEventIntoDescendingList(sortedArray, event) {
    let start = 0;
    let end = sortedArray.length - 1;
    let midPoint;
    let position = start;
    if (end < 0) {
      position = 0;
    } else if (event.created_at < sortedArray[end].created_at) {
      position = end + 1;
    } else if (event.created_at >= sortedArray[start].created_at) {
      position = start;
    } else
      while (true) {
        if (end <= start + 1) {
          position = end;
          break;
        }
        midPoint = Math.floor(start + (end - start) / 2);
        if (sortedArray[midPoint].created_at > event.created_at) {
          start = midPoint;
        } else if (sortedArray[midPoint].created_at < event.created_at) {
          end = midPoint;
        } else {
          position = midPoint;
          break;
        }
      }
    if (sortedArray[position]?.id !== event.id) {
      return [
        ...sortedArray.slice(0, position),
        event,
        ...sortedArray.slice(position)
      ];
    }
    return sortedArray;
  }
  function insertEventIntoAscendingList(sortedArray, event) {
    let start = 0;
    let end = sortedArray.length - 1;
    let midPoint;
    let position = start;
    if (end < 0) {
      position = 0;
    } else if (event.created_at > sortedArray[end].created_at) {
      position = end + 1;
    } else if (event.created_at <= sortedArray[start].created_at) {
      position = start;
    } else
      while (true) {
        if (end <= start + 1) {
          position = end;
          break;
        }
        midPoint = Math.floor(start + (end - start) / 2);
        if (sortedArray[midPoint].created_at < event.created_at) {
          start = midPoint;
        } else if (sortedArray[midPoint].created_at > event.created_at) {
          end = midPoint;
        } else {
          position = midPoint;
          break;
        }
      }
    if (sortedArray[position]?.id !== event.id) {
      return [
        ...sortedArray.slice(0, position),
        event,
        ...sortedArray.slice(position)
      ];
    }
    return sortedArray;
  }
  var Kind = /* @__PURE__ */ ((Kind2) => {
    Kind2[Kind2["Metadata"] = 0] = "Metadata";
    Kind2[Kind2["Text"] = 1] = "Text";
    Kind2[Kind2["RecommendRelay"] = 2] = "RecommendRelay";
    Kind2[Kind2["Contacts"] = 3] = "Contacts";
    Kind2[Kind2["EncryptedDirectMessage"] = 4] = "EncryptedDirectMessage";
    Kind2[Kind2["EventDeletion"] = 5] = "EventDeletion";
    Kind2[Kind2["Reaction"] = 7] = "Reaction";
    Kind2[Kind2["ChannelCreation"] = 40] = "ChannelCreation";
    Kind2[Kind2["ChannelMetadata"] = 41] = "ChannelMetadata";
    Kind2[Kind2["ChannelMessage"] = 42] = "ChannelMessage";
    Kind2[Kind2["ChannelHideMessage"] = 43] = "ChannelHideMessage";
    Kind2[Kind2["ChannelMuteUser"] = 44] = "ChannelMuteUser";
    Kind2[Kind2["Report"] = 1984] = "Report";
    Kind2[Kind2["ZapRequest"] = 9734] = "ZapRequest";
    Kind2[Kind2["Zap"] = 9735] = "Zap";
    Kind2[Kind2["RelayList"] = 10002] = "RelayList";
    Kind2[Kind2["ClientAuth"] = 22242] = "ClientAuth";
    Kind2[Kind2["Article"] = 30023] = "Article";
    return Kind2;
  })(Kind || {});
  function serializeEvent(evt) {
    if (!validateEvent(evt))
      throw new Error("can't serialize event with wrong or missing properties");
    return JSON.stringify([
      0,
      evt.pubkey,
      evt.created_at,
      evt.kind,
      evt.tags,
      evt.content
    ]);
  }
  function getEventHash(event) {
    let eventHash = sha256(utf8Encoder.encode(serializeEvent(event)));
    return utils.bytesToHex(eventHash);
  }
  function validateEvent(event) {
    if (typeof event !== "object")
      return false;
    if (typeof event.kind !== "number")
      return false;
    if (typeof event.content !== "string")
      return false;
    if (typeof event.created_at !== "number")
      return false;
    if (typeof event.pubkey !== "string")
      return false;
    if (!event.pubkey.match(/^[a-f0-9]{64}$/))
      return false;
    if (!Array.isArray(event.tags))
      return false;
    for (let i = 0; i < event.tags.length; i++) {
      let tag = event.tags[i];
      if (!Array.isArray(tag))
        return false;
      for (let j = 0; j < tag.length; j++) {
        if (typeof tag[j] === "object")
          return false;
      }
    }
    return true;
  }
  function verifySignature(event) {
    return schnorr.verifySync(
      event.sig,
      getEventHash(event),
      event.pubkey
    );
  }
  function matchFilter(filter, event) {
    if (filter.ids && filter.ids.indexOf(event.id) === -1)
      return false;
    if (filter.kinds && filter.kinds.indexOf(event.kind) === -1)
      return false;
    if (filter.authors && filter.authors.indexOf(event.pubkey) === -1)
      return false;
    for (let f2 in filter) {
      if (f2[0] === "#") {
        let tagName = f2.slice(1);
        let values = filter[`#${tagName}`];
        if (values && !event.tags.find(
          ([t, v]) => t === f2.slice(1) && values.indexOf(v) !== -1
        ))
          return false;
      }
    }
    if (filter.since && event.created_at < filter.since)
      return false;
    if (filter.until && event.created_at >= filter.until)
      return false;
    return true;
  }
  function matchFilters(filters, event) {
    for (let i = 0; i < filters.length; i++) {
      if (matchFilter(filters[i], event))
        return true;
    }
    return false;
  }
  var fakejson_exports = {};
  __export2(fakejson_exports, {
    getHex64: () => getHex64,
    getInt: () => getInt,
    getSubscriptionId: () => getSubscriptionId,
    matchEventId: () => matchEventId,
    matchEventKind: () => matchEventKind,
    matchEventPubkey: () => matchEventPubkey
  });
  function getHex64(json, field) {
    let len = field.length + 3;
    let idx = json.indexOf(`"${field}":`) + len;
    let s = json.slice(idx).indexOf(`"`) + idx + 1;
    return json.slice(s, s + 64);
  }
  function getInt(json, field) {
    let len = field.length;
    let idx = json.indexOf(`"${field}":`) + len + 3;
    let sliced = json.slice(idx);
    let end = Math.min(sliced.indexOf(","), sliced.indexOf("}"));
    return parseInt(sliced.slice(0, end), 10);
  }
  function getSubscriptionId(json) {
    let idx = json.slice(0, 22).indexOf(`"EVENT"`);
    if (idx === -1)
      return null;
    let pstart = json.slice(idx + 7 + 1).indexOf(`"`);
    if (pstart === -1)
      return null;
    let start = idx + 7 + 1 + pstart;
    let pend = json.slice(start + 1, 80).indexOf(`"`);
    if (pend === -1)
      return null;
    let end = start + 1 + pend;
    return json.slice(start + 1, end);
  }
  function matchEventId(json, id) {
    return id === getHex64(json, "id");
  }
  function matchEventPubkey(json, pubkey) {
    return pubkey === getHex64(json, "pubkey");
  }
  function matchEventKind(json, kind) {
    return kind === getInt(json, "kind");
  }
  var nip19_exports = {};
  __export2(nip19_exports, {
    decode: () => decode,
    naddrEncode: () => naddrEncode,
    neventEncode: () => neventEncode,
    noteEncode: () => noteEncode,
    nprofileEncode: () => nprofileEncode,
    npubEncode: () => npubEncode,
    nsecEncode: () => nsecEncode
  });
  var Bech32MaxSize = 5e3;
  function decode(nip19) {
    let { prefix, words } = bech32.decode(nip19, Bech32MaxSize);
    let data = new Uint8Array(bech32.fromWords(words));
    switch (prefix) {
      case "nprofile": {
        let tlv = parseTLV(data);
        if (!tlv[0]?.[0])
          throw new Error("missing TLV 0 for nprofile");
        if (tlv[0][0].length !== 32)
          throw new Error("TLV 0 should be 32 bytes");
        return {
          type: "nprofile",
          data: {
            pubkey: utils.bytesToHex(tlv[0][0]),
            relays: tlv[1] ? tlv[1].map((d) => utf8Decoder.decode(d)) : []
          }
        };
      }
      case "nevent": {
        let tlv = parseTLV(data);
        if (!tlv[0]?.[0])
          throw new Error("missing TLV 0 for nevent");
        if (tlv[0][0].length !== 32)
          throw new Error("TLV 0 should be 32 bytes");
        if (tlv[2] && tlv[2][0].length !== 32)
          throw new Error("TLV 2 should be 32 bytes");
        return {
          type: "nevent",
          data: {
            id: utils.bytesToHex(tlv[0][0]),
            relays: tlv[1] ? tlv[1].map((d) => utf8Decoder.decode(d)) : [],
            author: tlv[2]?.[0] ? utils.bytesToHex(tlv[2][0]) : void 0
          }
        };
      }
      case "naddr": {
        let tlv = parseTLV(data);
        if (!tlv[0]?.[0])
          throw new Error("missing TLV 0 for naddr");
        if (!tlv[2]?.[0])
          throw new Error("missing TLV 2 for naddr");
        if (tlv[2][0].length !== 32)
          throw new Error("TLV 2 should be 32 bytes");
        if (!tlv[3]?.[0])
          throw new Error("missing TLV 3 for naddr");
        if (tlv[3][0].length !== 4)
          throw new Error("TLV 3 should be 4 bytes");
        return {
          type: "naddr",
          data: {
            identifier: utf8Decoder.decode(tlv[0][0]),
            pubkey: utils.bytesToHex(tlv[2][0]),
            kind: parseInt(utils.bytesToHex(tlv[3][0]), 16),
            relays: tlv[1] ? tlv[1].map((d) => utf8Decoder.decode(d)) : []
          }
        };
      }
      case "nsec":
      case "npub":
      case "note":
        return { type: prefix, data: utils.bytesToHex(data) };
      default:
        throw new Error(`unknown prefix ${prefix}`);
    }
  }
  function parseTLV(data) {
    let result = {};
    let rest = data;
    while (rest.length > 0) {
      let t = rest[0];
      let l = rest[1];
      let v = rest.slice(2, 2 + l);
      rest = rest.slice(2 + l);
      if (v.length < l)
        continue;
      result[t] = result[t] || [];
      result[t].push(v);
    }
    return result;
  }
  function nsecEncode(hex2) {
    return encodeBytes("nsec", hex2);
  }
  function npubEncode(hex2) {
    return encodeBytes("npub", hex2);
  }
  function noteEncode(hex2) {
    return encodeBytes("note", hex2);
  }
  function encodeBytes(prefix, hex2) {
    let data = utils.hexToBytes(hex2);
    let words = bech32.toWords(data);
    return bech32.encode(prefix, words, Bech32MaxSize);
  }
  function nprofileEncode(profile) {
    let data = encodeTLV({
      0: [utils.hexToBytes(profile.pubkey)],
      1: (profile.relays || []).map((url) => utf8Encoder.encode(url))
    });
    let words = bech32.toWords(data);
    return bech32.encode("nprofile", words, Bech32MaxSize);
  }
  function neventEncode(event) {
    let data = encodeTLV({
      0: [utils.hexToBytes(event.id)],
      1: (event.relays || []).map((url) => utf8Encoder.encode(url)),
      2: event.author ? [utils.hexToBytes(event.author)] : []
    });
    let words = bech32.toWords(data);
    return bech32.encode("nevent", words, Bech32MaxSize);
  }
  function naddrEncode(addr) {
    let kind = new ArrayBuffer(4);
    new DataView(kind).setUint32(0, addr.kind, false);
    let data = encodeTLV({
      0: [utf8Encoder.encode(addr.identifier)],
      1: (addr.relays || []).map((url) => utf8Encoder.encode(url)),
      2: [utils.hexToBytes(addr.pubkey)],
      3: [new Uint8Array(kind)]
    });
    let words = bech32.toWords(data);
    return bech32.encode("naddr", words, Bech32MaxSize);
  }
  function encodeTLV(tlv) {
    let entries = [];
    Object.entries(tlv).forEach(([t, vs]) => {
      vs.forEach((v) => {
        let entry = new Uint8Array(v.length + 2);
        entry.set([parseInt(t)], 0);
        entry.set([v.length], 1);
        entry.set(v, 2);
        entries.push(entry);
      });
    });
    return utils.concatBytes(...entries);
  }
  var nip04_exports = {};
  __export2(nip04_exports, {
    decrypt: () => decrypt,
    encrypt: () => encrypt
  });
  async function encrypt(privkey, pubkey, text) {
    const key = getSharedSecret(privkey, "02" + pubkey);
    const normalizedKey = getNormalizedX(key);
    let iv = Uint8Array.from(randomBytes(16));
    let plaintext = utf8Encoder.encode(text);
    let cryptoKey = await crypto.subtle.importKey(
      "raw",
      normalizedKey,
      { name: "AES-CBC" },
      false,
      ["encrypt"]
    );
    let ciphertext = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv },
      cryptoKey,
      plaintext
    );
    let ctb64 = base64.encode(new Uint8Array(ciphertext));
    let ivb64 = base64.encode(new Uint8Array(iv.buffer));
    return `${ctb64}?iv=${ivb64}`;
  }
  async function decrypt(privkey, pubkey, data) {
    let [ctb64, ivb64] = data.split("?iv=");
    let key = getSharedSecret(privkey, "02" + pubkey);
    let normalizedKey = getNormalizedX(key);
    let cryptoKey = await crypto.subtle.importKey(
      "raw",
      normalizedKey,
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );
    let ciphertext = base64.decode(ctb64);
    let iv = base64.decode(ivb64);
    let plaintext = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      cryptoKey,
      ciphertext
    );
    let text = utf8Decoder.decode(plaintext);
    return text;
  }
  function getNormalizedX(key) {
    return key.slice(1, 33);
  }
  var nip05_exports = {};
  __export2(nip05_exports, {
    queryProfile: () => queryProfile,
    searchDomain: () => searchDomain,
    useFetchImplementation: () => useFetchImplementation
  });
  var _fetch;
  try {
    _fetch = fetch;
  } catch {
  }
  function useFetchImplementation(fetchImplementation) {
    _fetch = fetchImplementation;
  }
  async function searchDomain(domain, query = "") {
    try {
      let res = await (await _fetch(`https://${domain}/.well-known/nostr.json?name=${query}`)).json();
      return res.names;
    } catch (_) {
      return {};
    }
  }
  async function queryProfile(fullname) {
    let [name, domain] = fullname.split("@");
    if (!domain) {
      domain = name;
      name = "_";
    }
    if (!name.match(/^[A-Za-z0-9-_]+$/))
      return null;
    if (!domain.includes("."))
      return null;
    let res;
    try {
      res = await (await _fetch(`https://${domain}/.well-known/nostr.json?name=${name}`)).json();
    } catch (err) {
      return null;
    }
    if (!res?.names?.[name])
      return null;
    let pubkey = res.names[name];
    let relays = res.relays?.[pubkey] || [];
    return {
      pubkey,
      relays
    };
  }
  var nip06_exports = {};
  __export2(nip06_exports, {
    generateSeedWords: () => generateSeedWords,
    privateKeyFromSeedWords: () => privateKeyFromSeedWords,
    validateWords: () => validateWords
  });
  function privateKeyFromSeedWords(mnemonic, passphrase) {
    let root = HDKey.fromMasterSeed((0, import_bip39.mnemonicToSeedSync)(mnemonic, passphrase));
    let privateKey = root.derive(`m/44'/1237'/0'/0/0`).privateKey;
    if (!privateKey)
      throw new Error("could not derive private key");
    return utils.bytesToHex(privateKey);
  }
  function generateSeedWords() {
    return (0, import_bip39.generateMnemonic)(import_english.wordlist);
  }
  function validateWords(words) {
    return (0, import_bip39.validateMnemonic)(words, import_english.wordlist);
  }
  var nip26_exports = {};
  __export2(nip26_exports, {
    createDelegation: () => createDelegation,
    getDelegator: () => getDelegator
  });
  function createDelegation(privateKey, parameters) {
    let conditions = [];
    if ((parameters.kind || -1) >= 0)
      conditions.push(`kind=${parameters.kind}`);
    if (parameters.until)
      conditions.push(`created_at<${parameters.until}`);
    if (parameters.since)
      conditions.push(`created_at>${parameters.since}`);
    let cond = conditions.join("&");
    if (cond === "")
      throw new Error("refusing to create a delegation without any conditions");
    let sighash = sha256(
      utf8Encoder.encode(`nostr:delegation:${parameters.pubkey}:${cond}`)
    );
    let sig = utils.bytesToHex(
      schnorr.signSync(sighash, privateKey)
    );
    return {
      from: getPublicKey2(privateKey),
      to: parameters.pubkey,
      cond,
      sig
    };
  }
  function getDelegator(event) {
    let tag = event.tags.find((tag2) => tag2[0] === "delegation" && tag2.length >= 4);
    if (!tag)
      return null;
    let pubkey = tag[1];
    let cond = tag[2];
    let sig = tag[3];
    let conditions = cond.split("&");
    for (let i = 0; i < conditions.length; i++) {
      let [key, operator, value] = conditions[i].split(/\b/);
      if (key === "kind" && operator === "=" && event.kind === parseInt(value))
        continue;
      else if (key === "created_at" && operator === "<" && event.created_at < parseInt(value))
        continue;
      else if (key === "created_at" && operator === ">" && event.created_at > parseInt(value))
        continue;
      else
        return null;
    }
    let sighash = sha256(
      utf8Encoder.encode(`nostr:delegation:${event.pubkey}:${cond}`)
    );
    if (!schnorr.verifySync(sig, sighash, pubkey))
      return null;
    return pubkey;
  }
  var nip39_exports = {};
  __export2(nip39_exports, {
    useFetchImplementation: () => useFetchImplementation2,
    validateGithub: () => validateGithub
  });
  var _fetch2;
  try {
    _fetch2 = fetch;
  } catch {
  }
  function useFetchImplementation2(fetchImplementation) {
    _fetch2 = fetchImplementation;
  }
  async function validateGithub(pubkey, username, proof) {
    try {
      let res = await (await _fetch2(`https://gist.github.com/${username}/${proof}/raw`)).text();
      return res === `Verifying that I control the following Nostr public key: ${pubkey}`;
    } catch (_) {
      return false;
    }
  }
  var nip57_exports = {};
  __export2(nip57_exports, {
    getZapEndpoint: () => getZapEndpoint,
    makeZapReceipt: () => makeZapReceipt,
    makeZapRequest: () => makeZapRequest,
    useFetchImplementation: () => useFetchImplementation3,
    validateZapRequest: () => validateZapRequest
  });
  var _fetch3;
  try {
    _fetch3 = fetch;
  } catch {
  }
  function useFetchImplementation3(fetchImplementation) {
    _fetch3 = fetchImplementation;
  }
  async function getZapEndpoint(metadata) {
    try {
      let lnurl = "";
      let { lud06, lud16 } = JSON.parse(metadata.content);
      if (lud06) {
        let { words } = bech32.decode(lud06, 1e3);
        let data = bech32.fromWords(words);
        lnurl = utf8Decoder.decode(data);
      } else if (lud16) {
        let [name, domain] = lud16.split("@");
        lnurl = `https://${domain}/.well-known/lnurlp/${name}`;
      } else {
        return null;
      }
      let res = await _fetch3(lnurl);
      let body = await res.json();
      if (body.allowsNostr && body.nostrPubkey) {
        return body.callback;
      }
    } catch (err) {
    }
    return null;
  }
  function makeZapRequest({
    profile,
    event,
    amount,
    relays,
    comment = ""
  }) {
    if (!amount)
      throw new Error("amount not given");
    if (!profile)
      throw new Error("profile not given");
    let zr = {
      kind: 9734,
      created_at: Math.round(Date.now() / 1e3),
      content: comment,
      tags: [
        ["p", profile],
        ["amount", amount.toString()],
        ["relays", ...relays]
      ]
    };
    if (event) {
      zr.tags.push(["e", event]);
    }
    return zr;
  }
  function validateZapRequest(zapRequestString) {
    let zapRequest;
    try {
      zapRequest = JSON.parse(zapRequestString);
    } catch (err) {
      return "Invalid zap request JSON.";
    }
    if (!validateEvent(zapRequest))
      return "Zap request is not a valid Nostr event.";
    if (!verifySignature(zapRequest))
      return "Invalid signature on zap request.";
    let p = zapRequest.tags.find(([t, v]) => t === "p" && v);
    if (!p)
      return "Zap request doesn't have a 'p' tag.";
    if (!p[1].match(/^[a-f0-9]{64}$/))
      return "Zap request 'p' tag is not valid hex.";
    let e = zapRequest.tags.find(([t, v]) => t === "e" && v);
    if (e && !e[1].match(/^[a-f0-9]{64}$/))
      return "Zap request 'e' tag is not valid hex.";
    let relays = zapRequest.tags.find(([t, v]) => t === "relays" && v);
    if (!relays)
      return "Zap request doesn't have a 'relays' tag.";
    return null;
  }
  function makeZapReceipt({
    zapRequest,
    preimage,
    bolt11,
    paidAt
  }) {
    let zr = JSON.parse(zapRequest);
    let tagsFromZapRequest = zr.tags.filter(
      ([t]) => t === "e" || t === "p" || t === "a"
    );
    let zap = {
      kind: 9735,
      created_at: Math.round(paidAt.getTime() / 1e3),
      content: "",
      tags: [
        ...tagsFromZapRequest,
        ["bolt11", bolt11],
        ["description", zapRequest]
      ]
    };
    if (preimage) {
      zap.tags.push(["preimage", preimage]);
    }
    return zap;
  }
  utils.hmacSha256Sync = (key, ...msgs) => hmac2(sha256, key, utils.concatBytes(...msgs));
  utils.sha256Sync = (...msgs) => sha256(utils.concatBytes(...msgs));

  // node_modules/isomorphic-ws/browser.js
  init_define_process();
  var ws = null;
  if (typeof WebSocket !== "undefined") {
    ws = WebSocket;
  } else if (typeof MozWebSocket !== "undefined") {
    ws = MozWebSocket;
  } else if (typeof self !== "undefined") {
    ws = self.WebSocket || self.MozWebSocket;
  } else if (typeof self !== "undefined") {
    ws = self.WebSocket || self.MozWebSocket;
  } else if (typeof self !== "undefined") {
    ws = self.WebSocket || self.MozWebSocket;
  }
  var browser_default = ws;

  // fakejson.ts
  init_define_process();
  function getHex642(json, field) {
    let len = field.length + 3;
    let idx = json.indexOf(`"${field}":`) + len;
    let s = json.slice(idx).indexOf(`"`) + idx + 1;
    return json.slice(s, s + 64);
  }
  function getSubName(json) {
    let idx = json.indexOf(`"EVENT"`) + 7;
    let sliced = json.slice(idx);
    let idx2 = sliced.indexOf(`"`) + 1;
    let sliced2 = sliced.slice(idx2);
    return sliced2.slice(0, sliced2.indexOf(`"`));
  }

  // relay.ts
  function relayInit(url, alreadyHaveEvent, autoReconnect) {
    return new RelayC(url, alreadyHaveEvent, autoReconnect).relayInit();
  }
  var RelayC = class {
    url;
    alreadyHaveEvent;
    logging = false;
    constructor(url, alreadyHaveEvent, autoReconnect) {
      this.url = url;
      this.alreadyHaveEvent = alreadyHaveEvent;
      this.autoReconnect = autoReconnect;
    }
    autoReconnect;
    ws;
    sendOnConnect = [];
    openSubs = {};
    closedByClient = false;
    listeners = {
      connect: [],
      disconnect: [],
      error: [],
      notice: []
    };
    subListeners = {};
    pubListeners = {};
    incomingMessageQueue = [];
    handleNextInterval;
    #handleNext() {
      if (this.incomingMessageQueue.length === 0) {
        clearInterval(this.handleNextInterval);
        this.handleNextInterval = null;
        return;
      }
      this.#handleMessage({ data: this.incomingMessageQueue.shift() });
    }
    async trySend(params) {
      const msg = JSON.stringify(params);
      if (this.connected) {
        this.ws?.send(msg);
      } else {
        this.sendOnConnect.push(msg);
      }
    }
    resolveClose = void 0;
    async #onclose() {
      if (this.closedByClient) {
        this.listeners.disconnect.forEach((cb) => cb());
        this.resolveClose && this.resolveClose();
      } else {
        if (this.autoReconnect) {
          this.#reconnect();
        }
      }
    }
    reconnectTimeout = 0;
    #reconnect() {
      setTimeout(() => {
        this.reconnectTimeout = Math.max(2e3, this.reconnectTimeout * 3);
        console.log(
          this.url,
          "reconnecting after " + this.reconnectTimeout / 1e3 + "s"
        );
        this.connect();
      }, this.reconnectTimeout);
    }
    async #onmessage(e) {
      this.incomingMessageQueue.push(e.data);
      if (!this.handleNextInterval) {
        this.handleNextInterval = setInterval(() => this.#handleNext(), 0);
      }
    }
    async #handleMessage(e) {
      let data;
      let json = e.data.toString();
      if (!json) {
        return;
      }
      let eventId = getHex642(json, "id");
      let event = this.alreadyHaveEvent?.(eventId);
      if (event) {
        const listener = this.subListeners[getSubName(json)];
        if (!listener) {
          return;
        }
        return listener.event.forEach((cb) => cb(event));
      }
      try {
        data = JSON.parse(json);
      } catch (err) {
        data = e.data;
      }
      if (data.length >= 1) {
        switch (data[0]) {
          case "EVENT":
            if (this.logging) {
              console.log(data);
            }
            if (data.length !== 3)
              return;
            const id = data[1];
            const event2 = data[2];
            if (!this.openSubs[id]) {
              return;
            }
            if (this.openSubs[id].eventIds?.has(eventId)) {
              return;
            }
            this.openSubs[id].eventIds?.add(eventId);
            if (validateEvent(event2) && this.openSubs[id] && (this.openSubs[id].skipVerification || verifySignature(event2)) && matchFilters(this.openSubs[id].filters, event2)) {
              this.openSubs[id];
              (this.subListeners[id]?.event || []).forEach((cb) => cb(event2));
            }
            return;
          case "EOSE": {
            if (data.length !== 2)
              return;
            const id2 = data[1];
            if (this.logging) {
              console.log("EOSE", this.url, id2);
            }
            (this.subListeners[id2]?.eose || []).forEach((cb) => cb());
            return;
          }
          case "OK": {
            if (data.length < 3)
              return;
            const id2 = data[1];
            const ok = data[2];
            const reason = data[3] || "";
            if (ok)
              this.pubListeners[id2]?.ok.forEach((cb) => cb());
            else
              this.pubListeners[id2]?.failed.forEach((cb) => cb(reason));
            return;
          }
          case "NOTICE":
            if (data.length !== 2)
              return;
            const notice = data[1];
            this.listeners.notice.forEach((cb) => cb(notice));
            return;
        }
      }
    }
    #onopen(opened) {
      if (this.resolveClose) {
        this.resolveClose();
        return;
      }
      for (const subid in this.openSubs) {
        if (this.logging) {
          console.log("REQ", this.url, subid, ...this.openSubs[subid].filters);
        }
        this.trySend(["REQ", subid, ...this.openSubs[subid].filters]);
      }
      for (const msg of this.sendOnConnect) {
        if (this.logging) {
          console.log("(Relay msg)", this.url, msg);
        }
        this.ws?.send(msg);
      }
      this.sendOnConnect = [];
      this.listeners.connect.forEach((cb) => cb());
      opened();
    }
    async connectRelay() {
      return new Promise((resolve, reject) => {
        const ws2 = new browser_default(this.url);
        this.ws = ws2;
        ws2.onopen = this.#onopen.bind(this, resolve);
        ws2.onerror = (e) => {
          this.listeners.error.forEach((cb) => cb());
          reject(e);
        };
        ws2.onclose = this.#onclose.bind(this);
        ws2.onmessage = this.#onmessage.bind(this);
      });
    }
    async connect() {
      if (this.ws?.readyState && this.ws.readyState === 1)
        return;
      try {
        await this.connectRelay();
      } catch (err) {
        console.error("Error connecting relay ", this.url);
      }
    }
    relayInit() {
      const this2 = this;
      return {
        url: this2.url,
        sub: this2.sub.bind(this2),
        on: this2.on.bind(this2),
        off: this2.off.bind(this2),
        publish: this2.publish.bind(this2),
        connect: this2.connect.bind(this2),
        close() {
          return this2.close();
        },
        get status() {
          return this2.status;
        },
        relay: this2
      };
    }
    get status() {
      return this.ws?.readyState ?? 3;
    }
    get connected() {
      return this.ws?.readyState === 1;
    }
    close() {
      this.closedByClient = true;
      this.ws?.close();
      return new Promise((resolve) => {
        this.resolveClose = resolve;
      });
    }
    on(type, cb) {
      this.listeners[type].push(cb);
      if (type === "connect" && this.ws?.readyState === 1) {
        cb();
      }
    }
    off(type, cb) {
      const index = this.listeners[type].indexOf(cb);
      if (index !== -1)
        this.listeners[type].splice(index, 1);
    }
    publish(event) {
      const this2 = this;
      if (!event.id)
        throw new Error(`event ${event} has no id`);
      const id = event.id;
      let sent = false;
      let mustMonitor = false;
      this2.trySend(["EVENT", event]).then(() => {
        sent = true;
        if (mustMonitor) {
          startMonitoring();
          mustMonitor = false;
        }
      }).catch(() => {
      });
      const startMonitoring = () => {
        const monitor = this.sub([{ ids: [id] }], {
          id: `monitor-${id.slice(0, 5)}`
        });
        const willUnsub = setTimeout(() => {
          (this2.pubListeners[id]?.failed || []).forEach(
            (cb) => cb("event not seen after 5 seconds")
          );
          monitor.unsub();
        }, 5e3);
        monitor.on("event", () => {
          clearTimeout(willUnsub);
          (this2.pubListeners[id]?.seen || []).forEach((cb) => cb());
        });
      };
      return {
        on: (type, cb) => {
          this2.pubListeners[id] = this2.pubListeners[id] || {
            ok: [],
            seen: [],
            failed: []
          };
          this2.pubListeners[id][type].push(cb);
          if (type === "seen") {
            if (sent)
              startMonitoring();
            else
              mustMonitor = true;
          }
        },
        off: (type, cb) => {
          const listeners = this2.pubListeners[id];
          if (!listeners)
            return;
          const idx = listeners[type].indexOf(cb);
          if (idx >= 0)
            listeners[type].splice(idx, 1);
        }
      };
    }
    sub(filters, opts = {}) {
      const this2 = this;
      const subid = opts.id || Math.random().toString().slice(2);
      const skipVerification = opts.skipVerification || false;
      this2.openSubs[subid] = {
        id: subid,
        filters,
        skipVerification
      };
      if (this2.connected) {
        if (this.logging) {
          console.log("REQ2", this.url, subid, ...filters);
        }
        this2.trySend(["REQ", subid, ...filters]);
      }
      return {
        sub: (newFilters, newOpts = {}) => this.sub(newFilters || filters, {
          skipVerification: newOpts.skipVerification || skipVerification,
          id: subid
        }),
        unsub: () => {
          delete this2.openSubs[subid];
          delete this2.subListeners[subid];
          if (this2.connected) {
            if (this2.logging) {
              console.log("CLOSE", this.url, subid);
            }
            this2.trySend(["CLOSE", subid]);
          }
        },
        on: (type, cb) => {
          this2.subListeners[subid] = this2.subListeners[subid] || {
            event: [],
            eose: []
          };
          this2.subListeners[subid][type].push(cb);
        },
        off: (type, cb) => {
          const listeners = this2.subListeners[subid];
          if (!listeners)
            return;
          const idx = listeners[type].indexOf(cb);
          if (idx >= 0)
            listeners[type].splice(idx, 1);
        }
      };
    }
  };

  // event-cache.ts
  init_define_process();
  var EventCache = class {
    eventsById = /* @__PURE__ */ new Map();
    metadataByPubKey = /* @__PURE__ */ new Map();
    contactsByPubKey = /* @__PURE__ */ new Map();
    authorsKindsByPubKey = /* @__PURE__ */ new Map();
    eventsByTags = /* @__PURE__ */ new Map();
    #addEventToAuthorKindsByPubKey(event) {
      const kindsByPubKey = this.authorsKindsByPubKey.get(event.pubkey);
      if (!kindsByPubKey) {
        this.authorsKindsByPubKey.set(
          event.pubkey,
          /* @__PURE__ */ new Map([[event.kind, [event]]])
        );
      } else {
        const events = kindsByPubKey.get(event.kind);
        if (!events) {
          kindsByPubKey.set(event.kind, [event]);
        } else {
          if (event.kind === Kind.Metadata || event.kind === Kind.Contacts) {
            if (event.created_at > events[0].created_at) {
              events[0] = event;
            }
          } else {
            events.push(event);
          }
        }
      }
    }
    #addEventToEventsByTags(event) {
      for (const tag of event.tags) {
        let tag2 = tag[0] + ":" + tag[1];
        const events = this.eventsByTags.get(tag2);
        if (events) {
          events.push(event);
        } else {
          this.eventsByTags.set(tag2, [event]);
        }
      }
    }
    addEvent(event) {
      if (this.getEventById(event.id)) {
        return;
      }
      this.eventsById.set(event.id, event);
      if (event.kind === Kind.Metadata) {
        this.metadataByPubKey.set(event.pubkey, event);
      }
      if (event.kind === Kind.Contacts) {
        this.contactsByPubKey.set(event.pubkey, event);
      }
      this.#addEventToAuthorKindsByPubKey(event);
      this.#addEventToEventsByTags(event);
    }
    getEventById(id) {
      return this.eventsById.get(id);
    }
    hasEventById(id) {
      return this.eventsById.has(id);
    }
    #getCachedEventsByPubKeyWithUpdatedFilter(filter) {
      if (filter.noCache || !filter.authors || !filter.kinds || filter.kinds.find(
        (kind) => kind !== Kind.Contacts && kind !== Kind.Metadata
      ) !== void 0) {
        return void 0;
      }
      const authors = [];
      const events = /* @__PURE__ */ new Set();
      for (const author of filter.authors) {
        let contactEvent;
        if (filter.kinds.includes(Kind.Contacts)) {
          contactEvent = this.contactsByPubKey.get(author);
          if (!contactEvent) {
            authors.push(author);
            continue;
          }
        }
        let metadataEvent;
        if (filter.kinds.includes(Kind.Metadata)) {
          metadataEvent = this.metadataByPubKey.get(author);
          if (!metadataEvent) {
            authors.push(author);
            continue;
          }
        }
        if (contactEvent) {
          events.add(contactEvent);
        }
        if (metadataEvent) {
          events.add(metadataEvent);
        }
      }
      return { filter: { ...filter, authors }, events };
    }
    #getCachedEventsByPubKeyWithUpdatedFilter2(filter) {
      if (filter.noCache || !filter.authors) {
        return void 0;
      }
      const events = /* @__PURE__ */ new Set();
      for (const author of filter.authors) {
        if (filter.kinds) {
          const kindsByPubKey = this.authorsKindsByPubKey.get(author);
          if (kindsByPubKey) {
            for (const kind of filter.kinds) {
              const events2 = kindsByPubKey.get(kind);
              if (events2) {
                for (const event of events2) {
                  events.add(event);
                }
              }
            }
          }
        } else {
          const kindsByPubKey = this.authorsKindsByPubKey.get(author);
          if (kindsByPubKey) {
            for (const events2 of kindsByPubKey.values()) {
              for (const event3 of events2) {
                events.add(event3);
              }
            }
          }
        }
      }
      return { filter, events };
    }
    #getCachedEventsByTagsWithUpdatedFilter(filter) {
      if (filter.noCache) {
        return void 0;
      }
      const events = /* @__PURE__ */ new Set();
      for (const tag in filter) {
        if (tag[0] !== "#") {
          continue;
        }
        let tag2 = tag.slice(1) + ":" + filter[tag][0];
        const events2 = this.eventsByTags.get(tag2);
        if (events2) {
          for (const event of events2) {
            events.add(event);
          }
        }
      }
      return { filter, events };
    }
    #getCachedEventsByIdWithUpdatedFilter(filter) {
      if (!filter.ids) {
        return void 0;
      }
      const events = /* @__PURE__ */ new Set();
      const ids = [];
      for (const id of filter.ids) {
        const event = this.getEventById(id);
        if (event) {
          events.add(event);
        } else {
          ids.push(id);
        }
      }
      return { filter: { ...filter, ids }, events };
    }
    getCachedEventsWithUpdatedFilters(filters, relays) {
      const events = /* @__PURE__ */ new Set();
      const new_filters = [];
      for (const filter of filters) {
        const new_data = this.#getCachedEventsByIdWithUpdatedFilter(filter) || this.#getCachedEventsByPubKeyWithUpdatedFilter2(filter) || this.#getCachedEventsByTagsWithUpdatedFilter(filter) || {
          filter,
          events: []
        };
        for (const event of new_data.events) {
          events.add(event);
        }
        new_filters.push(new_data.filter);
      }
      return { filters: new_filters, events: [...events] };
    }
  };

  // event.ts
  init_define_process();

  // author.ts
  init_define_process();
  var Author = class {
    pubkey;
    relayPool;
    relays;
    constructor(relayPool, relays, pubkey) {
      this.pubkey = pubkey;
      this.relayPool = relayPool;
      this.relays = relays;
    }
    metaData(cb, maxDelayms) {
      return this.relayPool.subscribeEventObject(
        [
          {
            authors: [this.pubkey],
            kinds: [Kind.Metadata]
          }
        ],
        this.relays,
        cb,
        maxDelayms
      );
    }
    subscribe(filters, cb, maxDelayms) {
      return this.relayPool.subscribeEventObject(
        filters.map((filter) => ({
          authors: [this.pubkey],
          ...filter
        })),
        this.relays,
        cb,
        maxDelayms
      );
    }
    followsPubkeys(cb, maxDelayms) {
      return this.relayPool.subscribeEventObject(
        [
          {
            authors: [this.pubkey],
            kinds: [Kind.Contacts]
          }
        ],
        this.relays,
        (event) => {
          let r = [];
          for (const tag of event.tags) {
            if (tag[0] === "p") {
              r.push(tag[1]);
            }
          }
          cb(r);
        },
        maxDelayms
      );
    }
    follows(cb, maxDelayms) {
      return this.relayPool.subscribeEventObject(
        [
          {
            authors: [this.pubkey],
            kinds: [Kind.Contacts]
          }
        ],
        this.relays,
        (event) => {
          let r = [];
          for (const tag of event.tags) {
            if (tag[0] === "p") {
              let relays = this.relays;
              if (tag[1]) {
                relays = [tag[1], ...this.relays || []];
              }
              r.push(new Author(this.relayPool, relays, tag[1]));
            }
          }
          cb(r);
        },
        maxDelayms
      );
    }
    secondFollows(cb, maxDelayms, removeDirectFollows = true) {
      return this.followsPubkeys((pubkeys) => {
        let sfollows = /* @__PURE__ */ new Map();
        for (const pubkey of pubkeys) {
          this.relayPool.subscribeEventObject(
            [
              {
                authors: [pubkey],
                kinds: [Kind.Contacts]
              }
            ],
            this.relays,
            (event) => {
              let dweight = 1 / event.tags.length;
              for (const tag of event.tags) {
                if (tag[0] === "p") {
                  let weight = sfollows.get(tag[1]);
                  if (weight) {
                    weight += dweight;
                  } else {
                    weight = dweight;
                  }
                  sfollows.set(tag[1], weight);
                }
              }
              if (removeDirectFollows) {
                for (const pubkey2 of pubkeys) {
                  sfollows.delete(pubkey2);
                }
              }
              cb(Array.from(sfollows.entries()).sort((a, b) => b[1] - a[1]));
            },
            maxDelayms
          );
        }
      }, maxDelayms);
    }
    allEvents(cb, limit = 100, maxDelayms) {
      return this.relayPool.subscribe(
        [
          {
            authors: [this.pubkey],
            limit
          }
        ],
        this.relays,
        cb,
        maxDelayms
      );
    }
    referenced(cb, limit = 100, maxDelayms) {
      return this.relayPool.subscribe(
        [
          {
            "#p": [this.pubkey],
            limit
          }
        ],
        this.relays,
        cb,
        maxDelayms
      );
    }
    followers(cb, limit = 100, maxDelayms) {
      return this.relayPool.subscribe(
        [
          {
            "#p": [this.pubkey],
            kinds: [Kind.Contacts],
            limit
          }
        ],
        this.relays,
        cb,
        maxDelayms
      );
    }
    sentAndRecievedDMs(cb, limit = 100, maxDelayms) {
      return this.relayPool.subscribe(
        [
          {
            authors: [this.pubkey],
            kinds: [Kind.EncryptedDirectMessage],
            limit
          },
          {
            "#p": [this.pubkey],
            kinds: [Kind.EncryptedDirectMessage],
            limit
          }
        ],
        this.relays,
        cb,
        maxDelayms
      );
    }
    text(cb, limit = 100, maxDelayms) {
      return this.relayPool.subscribe(
        [
          {
            authors: [this.pubkey],
            kinds: [Kind.Text],
            limit
          }
        ],
        this.relays,
        cb,
        maxDelayms
      );
    }
  };

  // event.ts
  var EventObject = class {
    id;
    kind;
    pubkey;
    tags;
    created_at;
    content;
    relayPool;
    relays;
    sig;
    constructor(event, relayPool, relays) {
      this.id = event.id;
      this.kind = event.kind;
      this.pubkey = event.pubkey;
      this.tags = event.tags;
      this.created_at = event.created_at;
      this.content = event.content;
      this.relayPool = relayPool;
      this.relays = relays;
      this.sig = event.sig;
    }
    referencedAuthors() {
      const r = [];
      for (const tag of this.tags) {
        if (tag[0] === "p") {
          r.push(new Author(this.relayPool, void 0, tag[1]));
        }
      }
      return r;
    }
    referencedEvents(maxDelayms) {
      const r = [];
      for (const tag of this.tags) {
        if (tag[0] === "e") {
          let relays = this.relays;
          if (tag[2]) {
            relays = [tag[2], ...relays || []];
          }
          r.push(
            this.relayPool.getEventById(tag[1], relays, maxDelayms).then((e) => new EventObject(e, this.relayPool, this.relays))
          );
        }
      }
      return r;
    }
    thread(cb, maxDelayms) {
      let relays = this.relays;
      let ids = [];
      for (const tag of this.tags) {
        if (tag[0] === "e") {
          if (tag[2]) {
            relays = [tag[2], ...relays || []];
          }
          ids.push(tag[1]);
        }
      }
      return this.relayPool.subscribe(
        [{ ids }, { "#e": ids }],
        relays,
        cb,
        maxDelayms
      );
    }
  };

  // group-filters-by-relay.ts
  init_define_process();

  // on-event-filters.ts
  init_define_process();
  function doNotEmitDuplicateEvents(onEvent) {
    let event_ids = /* @__PURE__ */ new Set();
    return (event, afterEose, url) => {
      if (event_ids.has(event.id))
        return;
      event_ids.add(event.id);
      onEvent(event, afterEose, url);
    };
  }
  function doNotEmitOlderEvents(onEvent) {
    let created_at_by_events_kinds = /* @__PURE__ */ new Map();
    return (event, afterEose, url) => {
      if (event.kind === Kind.Metadata || event.kind === Kind.Contacts) {
        let event_kind = event.pubkey + " " + event.kind;
        if ((created_at_by_events_kinds.get(event_kind) || 0) > event.created_at)
          return;
        created_at_by_events_kinds.set(event_kind, event.created_at);
      }
      onEvent(event, afterEose, url);
    };
  }
  function matchOnEventFilters(onEvent, filters) {
    return (event, afterEose, url) => {
      for (let filter of filters) {
        if (matchFilter(filter, event)) {
          onEvent(event, afterEose, url);
          break;
        }
      }
    };
  }
  function emitEventsOnNextTick(onEvent) {
    return (event, afterEose, url) => {
      setTimeout(() => {
        onEvent(event, afterEose, url);
      }, 0);
    };
  }

  // callback-replayer.ts
  init_define_process();
  var CallbackReplayer = class {
    subs = [];
    events = [];
    onunsub;
    constructor(onunsub) {
      this.onunsub = onunsub;
    }
    event(...args) {
      this.events.push(args);
      this.subs.forEach((sub) => sub(...args));
    }
    sub(callback) {
      this.events.forEach((event) => callback(...event));
      this.subs.push(callback);
      return () => {
        this.subs = this.subs.filter((sub) => sub !== callback);
        if (this.subs.length === 0) {
          this.onunsub?.();
          this.onunsub = void 0;
        }
      };
    }
  };

  // group-filters-by-relay.ts
  var unique = (arr) => [...new Set(arr)];
  function groupFiltersByRelayAndEmitCacheHits(filters, relays, onEvent, options = {}, eventCache) {
    let events = [];
    if (eventCache) {
      const cachedEventsWithUpdatedFilters = eventCache.getCachedEventsWithUpdatedFilters(filters, relays);
      filters = cachedEventsWithUpdatedFilters.filters;
      events = cachedEventsWithUpdatedFilters.events;
    }
    if (options.logAllEvents) {
      const onEventNow = onEvent;
      onEvent = (event, afterEose, url) => {
        onEventNow(event, afterEose, url);
      };
    }
    if (!options.allowDuplicateEvents) {
      onEvent = doNotEmitDuplicateEvents(onEvent);
    }
    if (!options.allowOlderEvents) {
      onEvent = doNotEmitOlderEvents(onEvent);
    }
    for (const event of events) {
      onEvent(event, false, void 0);
    }
    filters = mergeSimilarAndRemoveEmptyFilters(filters);
    onEvent = matchOnEventFilters(onEvent, filters);
    relays = unique(relays);
    const filtersByRelay = getFiltersByRelay(filters, relays);
    return [onEvent, filtersByRelay];
  }
  function getFiltersByRelay(filters, relays) {
    const filtersByRelay = /* @__PURE__ */ new Map();
    const filtersWithoutRelay = [];
    for (const filter of filters) {
      const relay = filter.relay;
      if (relay) {
        const relayFilters = filtersByRelay.get(relay);
        if (relayFilters) {
          relayFilters.push(withoutRelay(filter));
        } else {
          filtersByRelay.set(relay, [withoutRelay(filter)]);
        }
      } else {
        filtersWithoutRelay.push(filter);
      }
    }
    if (filtersWithoutRelay.length > 0) {
      for (const relay of relays) {
        const filters2 = filtersByRelay.get(relay);
        if (filters2) {
          filtersByRelay.set(relay, filters2.concat(filtersWithoutRelay));
        } else {
          filtersByRelay.set(relay, filtersWithoutRelay);
        }
      }
    }
    return filtersByRelay;
  }
  function withoutRelay(filter) {
    filter = { ...filter };
    delete filter.relay;
    return filter;
  }
  function batchFiltersByRelay(subscribedFilters, subscriptionCache) {
    const filtersByRelay = /* @__PURE__ */ new Map();
    const onEvents = [];
    let counter = 0;
    let unsubOnEoseCounter = 0;
    let allUnsub = { unsubcb: () => {
    }, unsuboneosecb: () => {
    } };
    let unsubVirtualSubscription = () => {
      counter--;
      if (counter === 0) {
        allUnsub.unsubcb();
      } else if (unsubOnEoseCounter === 0) {
        allUnsub.unsuboneosecb();
      }
    };
    for (const [
      onEvent2,
      filtersByRelayBySub,
      unsub,
      unsubscribeOnEose,
      subscriptionCacheKey
    ] of subscribedFilters) {
      if (!unsub.unsubcb) {
        continue;
      }
      for (const [relay, filters] of filtersByRelayBySub) {
        const filtersByRelayFilters = filtersByRelay.get(relay);
        if (filtersByRelayFilters) {
          filtersByRelay.set(relay, filtersByRelayFilters.concat(filters));
        } else {
          filtersByRelay.set(relay, filters);
        }
      }
      let onEventWithUnsub = (event, afterEose, url) => {
        if (unsub.unsubcb) {
          onEvent2(event, afterEose, url);
        }
      };
      if (subscriptionCache && subscriptionCacheKey) {
        const callbackReplayer = new CallbackReplayer(unsubVirtualSubscription);
        onEvents.push((event, afterEose, url) => {
          callbackReplayer.event(event, afterEose, url);
        });
        let unsubReplayerVirtualSubscription = callbackReplayer.sub(onEventWithUnsub);
        subscriptionCache.set(subscriptionCacheKey, callbackReplayer);
        unsub.unsubcb = () => {
          unsub.unsubcb = void 0;
          unsubReplayerVirtualSubscription();
          if (!unsubscribeOnEose) {
            unsubOnEoseCounter--;
          }
        };
      } else {
        onEvents.push(onEventWithUnsub);
        unsub.unsubcb = () => {
          unsub.unsubcb = void 0;
          unsubVirtualSubscription();
          if (!unsubscribeOnEose) {
            unsubOnEoseCounter--;
          }
        };
      }
      counter++;
      if (!unsubscribeOnEose) {
        unsubOnEoseCounter++;
      }
    }
    if (unsubOnEoseCounter === 0) {
      setTimeout(() => {
        allUnsub.unsuboneosecb();
      }, 0);
    } else {
    }
    const onEvent = (event, afterEose, url) => {
      for (const onEvent2 of onEvents) {
        onEvent2(event, afterEose, url);
      }
    };
    subscribedFilters.length = 0;
    return [onEvent, filtersByRelay, allUnsub];
  }

  // newest-event-cache.ts
  init_define_process();
  var NewestEventCache = class {
    data;
    promises;
    relays;
    kind;
    relayPool;
    useps;
    constructor(kind, relayPool, relays, useps) {
      this.data = /* @__PURE__ */ new Map();
      this.promises = /* @__PURE__ */ new Map();
      this.kind = kind;
      this.relayPool = relayPool;
      this.relays = relays || ["wss://us.rbr.bio", "wss://eu.rbr.bio"];
      this.useps = useps || false;
    }
    async get(pubkey) {
      let value = this.data.get(pubkey);
      if (value) {
        return Promise.resolve(value);
      }
      const promise = this.promises.get(pubkey);
      if (promise) {
        return promise;
      }
      return new Promise((resolve, reject) => {
        let tries = 0;
        const filter = this.useps ? { kinds: [this.kind], "#p": [pubkey] } : { kinds: [this.kind], authors: [pubkey] };
        this.relayPool.subscribe(
          [filter],
          this.relays,
          (event) => {
            this.data.set(pubkey, event);
            this.promises.delete(pubkey);
            resolve(event);
          },
          void 0,
          (relayUrl) => {
            if (this.relays.includes(relayUrl)) {
              tries++;
            }
            if (tries === this.relays.length) {
              this.promises.delete(pubkey);
              reject(
                `Can't find data2 for ${pubkey} with kind ${this.kind} on RelayInfoServers ${this.relays.join(",")}, ${tries} tries`
              );
            }
          }
        );
      });
    }
  };

  // relay-pool.ts
  var unique2 = (arr) => [...new Set(arr)];
  function parseJSON(json) {
    if (json) {
      return JSON.parse(json);
    }
  }
  var RelayPool = class {
    relayByUrl = /* @__PURE__ */ new Map();
    noticecbs = [];
    eventCache;
    minMaxDelayms = Infinity;
    filtersToSubscribe = [];
    timer;
    externalGetEventById;
    logSubscriptions = false;
    autoReconnect = false;
    startTime = new Date().getTime();
    deleteSignatures;
    subscriptionCache;
    skipVerification;
    writeRelays;
    metadataCache;
    contactListCache;
    constructor(relays, options = {}) {
      this.externalGetEventById = options.externalGetEventById;
      this.logSubscriptions = options.logSubscriptions;
      this.autoReconnect = options.autoReconnect;
      this.deleteSignatures = options.deleteSignatures;
      this.skipVerification = options.skipVerification;
      this.writeRelays = new NewestEventCache(10003, this, void 0, true);
      this.metadataCache = new NewestEventCache(0, this);
      this.contactListCache = new NewestEventCache(3, this);
      if (options.useEventCache) {
        this.eventCache = new EventCache();
      }
      if (options.subscriptionCache) {
        this.subscriptionCache = /* @__PURE__ */ new Map();
      }
      if (relays) {
        for (const relay of unique2(relays)) {
          this.addOrGetRelay(relay);
        }
      }
    }
    addOrGetRelay(relay) {
      const origRelayInstance = this.relayByUrl.get(relay);
      if (origRelayInstance) {
        return origRelayInstance;
      }
      const relayInstance = relayInit(
        relay,
        this.externalGetEventById ? this.externalGetEventById : this.eventCache ? (id) => this.eventCache?.getEventById(id) : void 0,
        this.autoReconnect
      );
      this.relayByUrl.set(relay, relayInstance);
      relayInstance.connect().then(
        (onfulfilled) => {
          relayInstance?.on("notice", (msg) => {
            this.noticecbs.forEach((cb) => cb(relay, msg));
          });
        },
        (onrejected) => {
          console.warn("failed to connect to relay " + relay);
        }
      );
      return relayInstance;
    }
    async close() {
      const promises = [];
      for (const relayInstance of this.relayByUrl.values()) {
        promises.push(relayInstance.close());
      }
      this.relayByUrl.clear();
      return Promise.all(promises);
    }
    removeRelay(url) {
      const relay = this.relayByUrl.get(url);
      if (relay) {
        relay.close();
        this.relayByUrl.delete(url);
      }
    }
    #subscribeRelay(relay, filters, onEvent, onEose, eventIds) {
      const mergedAndRemovedEmptyFilters = mergeSimilarAndRemoveEmptyFilters(filters);
      if (mergedAndRemovedEmptyFilters.length === 0) {
        return;
      }
      const instance = this.addOrGetRelay(relay);
      const sub = instance.sub(mergedAndRemovedEmptyFilters, {
        skipVerification: this.skipVerification,
        eventIds
      });
      let afterEose = false;
      let minCreatedAt = Infinity;
      sub.on("event", (nostrEvent) => {
        if (nostrEvent.created_at < minCreatedAt) {
          minCreatedAt = nostrEvent.created_at;
        }
        let event = nostrEvent;
        if (!this.deleteSignatures) {
          event.sig = nostrEvent.sig;
        }
        this.eventCache?.addEvent(event);
        onEvent(event, afterEose, relay);
      });
      sub.on("eose", () => {
        onEose?.(relay, minCreatedAt);
        afterEose = true;
      });
      return sub;
    }
    #mergeAndRemoveEmptyFiltersByRelay(filtersByRelay) {
      const mergedAndRemovedEmptyFiltersByRelay = /* @__PURE__ */ new Map();
      for (const [relay, filters] of filtersByRelay) {
        const mergedAndRemovedEmptyFilters = mergeSimilarAndRemoveEmptyFilters(filters);
        if (mergedAndRemovedEmptyFilters.length > 0) {
          mergedAndRemovedEmptyFiltersByRelay.set(
            relay,
            mergedAndRemovedEmptyFilters
          );
        }
      }
      return mergedAndRemovedEmptyFiltersByRelay;
    }
    #subscribeRelays(filtersByRelay, onEvent, onEose, unsub = {}, minMaxDelayms) {
      if (filtersByRelay.size === 0) {
        return () => {
        };
      }
      filtersByRelay = this.#mergeAndRemoveEmptyFiltersByRelay(filtersByRelay);
      if (this.logSubscriptions) {
        console.log(
          "RelayPool at ",
          new Date().getTime() - this.startTime,
          " subscribing to relays, minMaxDelayms=",
          minMaxDelayms,
          filtersByRelay
        );
      }
      const subs = [];
      let unsuboneosecbcalled = false;
      let eoseSubs = [];
      unsub.unsuboneosecb = () => {
        unsuboneosecbcalled = true;
        eoseSubs.forEach((sub) => sub.unsub());
      };
      for (const [relay, filters] of filtersByRelay) {
        let subHolder = {};
        const subOnEose = (url, minCreatedAt) => {
          if (onEose) {
            onEose(url, minCreatedAt);
          }
          if (unsuboneosecbcalled) {
            subHolder.sub?.unsub();
          } else {
            if (subHolder.sub) {
              eoseSubs.push(subHolder.sub);
            }
          }
        };
        const eventIds = /* @__PURE__ */ new Set();
        const sub = this.#subscribeRelay(
          relay,
          filters,
          onEvent,
          subOnEose,
          eventIds
        );
        if (sub) {
          subHolder.sub = sub;
          subs.push(sub);
        }
      }
      const allUnsub = () => subs.forEach((sub) => sub.unsub());
      unsub.unsubcb = () => {
        allUnsub();
        delete unsub.unsubcb;
      };
      return allUnsub;
    }
    sendSubscriptions(onEose) {
      clearTimeout(this.timer);
      this.timer = void 0;
      let minMaxDelayms = this.minMaxDelayms;
      this.minMaxDelayms = Infinity;
      const [onEvent, filtersByRelay, unsub] = batchFiltersByRelay(this.filtersToSubscribe, this.subscriptionCache);
      let allUnsub = this.#subscribeRelays(
        filtersByRelay,
        onEvent,
        onEose,
        unsub,
        minMaxDelayms
      );
      return allUnsub;
    }
    #resetTimer(maxDelayms) {
      if (this.minMaxDelayms > maxDelayms) {
        this.minMaxDelayms = maxDelayms;
      }
      clearTimeout(this.timer);
      this.timer = void 0;
      if (this.minMaxDelayms !== Infinity) {
        this.timer = setTimeout(() => {
          this.sendSubscriptions();
        }, this.minMaxDelayms);
      }
    }
    async #getRelaysAndSubscribe(filters, onEvent, maxDelayms, onEose, options = {}) {
      const allAuthors = /* @__PURE__ */ new Set();
      for (const filter of filters) {
        if (filter.authors) {
          for (const author of filter.authors) {
            allAuthors.add(author);
          }
        } else {
          if (!options.defaultRelays) {
            throw new Error(
              "Authors must be specified if no relays are subscribed and no default relays are specified."
            );
          }
        }
      }
      const promises = [];
      const allAuthorsArray = [];
      for (const author of allAuthors) {
        promises.push(
          this.writeRelays?.get(author).then((event) => parseJSON(event?.content))
        );
        allAuthorsArray.push(author);
      }
      const allRelays = /* @__PURE__ */ new Set();
      let i = 0;
      for (const promise of promises) {
        const author = allAuthorsArray[i];
        i += 1;
        let relays = await promise;
        if (!Array.isArray(relays)) {
          console.error("Couldn't load relays for author ", author);
          continue;
        }
        for (let relay of relays) {
          allRelays.add(relay);
        }
      }
      let allRelaysArray = Array.from(allRelays);
      if (allRelaysArray.length === 0) {
        if (options.defaultRelays) {
          allRelaysArray = options.defaultRelays;
        }
      }
      return this.subscribe(
        filters,
        allRelaysArray,
        onEvent,
        maxDelayms,
        onEose,
        options
      );
    }
    subscribeEventObject(filters, relays, onEventObject, maxDelayms, onEose, options = {}) {
      return this.subscribe(
        filters,
        relays,
        (event, afterEose, url) => onEventObject(new EventObject(event, this, relays), afterEose, url)
      );
    }
    subscribe(filters, relays, onEvent, maxDelayms, onEose, options = {}) {
      if (maxDelayms !== void 0 && onEose) {
        throw new Error("maxDelayms and onEose cannot be used together");
      }
      if (relays === void 0) {
        const promise = this.#getRelaysAndSubscribe(
          filters,
          onEvent,
          maxDelayms,
          onEose,
          options
        );
        return () => {
          promise.then((x) => {
            x();
          });
        };
      }
      let subscriptionCacheKey;
      if (options.unsubscribeOnEose && !onEose) {
        subscriptionCacheKey = JSON.stringify([filters, relays]);
        const cachedSubscription = this.subscriptionCache?.get(subscriptionCacheKey);
        if (cachedSubscription) {
          return cachedSubscription.sub(onEvent);
        }
      }
      const [dedupedOnEvent, filtersByRelay] = groupFiltersByRelayAndEmitCacheHits(
        filters,
        relays,
        onEvent,
        options,
        this.eventCache
      );
      let unsub = { unsubcb: () => {
      } };
      if (maxDelayms === void 0 && onEose && this.filtersToSubscribe.length > 0) {
        this.sendSubscriptions();
      }
      this.filtersToSubscribe.push([
        dedupedOnEvent,
        filtersByRelay,
        unsub,
        options.unsubscribeOnEose,
        subscriptionCacheKey,
        maxDelayms
      ]);
      if (maxDelayms === void 0) {
        return this.sendSubscriptions(onEose);
      } else {
        this.#resetTimer(maxDelayms);
        return () => {
          unsub.unsubcb?.();
          delete unsub.unsubcb;
        };
      }
    }
    async getEventObjectById(id, relays, maxDelayms) {
      return this.getEventById(id, relays, maxDelayms).then(
        (event) => new EventObject(event, this, relays)
      );
    }
    async getEventById(id, relays, maxDelayms) {
      return new Promise((resolve, reject) => {
        this.subscribe(
          [{ ids: [id] }],
          relays,
          (event) => {
            resolve(event);
          },
          maxDelayms,
          void 0
        );
      });
    }
    publish(event, relays) {
      for (const relay of unique2(relays)) {
        const instance = this.addOrGetRelay(relay);
        instance.publish(event);
      }
    }
    onnotice(cb) {
      this.noticecbs.push(cb);
    }
    onerror(cb) {
      this.relayByUrl.forEach(
        (relay, url) => relay.on("error", (msg) => cb(url, msg))
      );
    }
    ondisconnect(cb) {
      this.relayByUrl.forEach(
        (relay, url) => relay.on("disconnect", (msg) => cb(url, msg))
      );
    }
    getRelayStatuses() {
      return Array.from(this.relayByUrl.entries()).map(
        ([url, relay]) => [url, relay.status]
      ).sort();
    }
    setWriteRelaysForPubKey(pubkey, writeRelays, created_at) {
      const event = {
        created_at,
        pubkey: "",
        id: "",
        sig: "",
        content: JSON.stringify(writeRelays),
        kind: 2,
        tags: [["p", pubkey]]
      };
      this.writeRelays.data.set(pubkey, event);
    }
    setCachedMetadata(pubkey, metadata) {
      this.metadataCache.data.set(pubkey, metadata);
    }
    setCachedContactList(pubkey, contactList) {
      this.contactListCache.data.set(pubkey, contactList);
    }
    subscribeReferencedEvents(event, onEvent, maxDelayms, onEose, options = {}) {
      let ids = [];
      let authors = [];
      for (const tag of event.tags) {
        if (tag[0] === "p") {
          const pubkey = tag[1];
          if (pubkey.length !== 64) {
            console.log("bad pubkey", pubkey, tag);
            continue;
          }
          authors.push(pubkey);
        }
        if (tag[0] === "e") {
          const id = tag[1];
          ids.push(id);
        }
      }
      if (ids.length === 0) {
        return () => {
        };
      }
      if (authors.length === 0) {
        if (options.defaultRelays) {
          return this.subscribe(
            [{ ids }],
            options.defaultRelays,
            onEvent,
            maxDelayms,
            onEose,
            options
          );
        } else {
          console.error("No authors for ids in event", event);
          return () => {
          };
        }
      }
      return this.subscribe(
        [{ ids, authors }],
        void 0,
        onEvent,
        maxDelayms,
        onEose,
        options
      );
    }
    fetchAndCacheMetadata(pubkey) {
      return this.metadataCache.get(pubkey);
    }
    fetchAndCacheContactList(pubkey) {
      return this.contactListCache.get(pubkey);
    }
    subscribeReferencedEventsAndPrefetchMetadata(event, onEvent, maxDelayms, onEose, options = {}) {
      for (const tag of event.tags) {
        if (tag[0] === "p") {
          const pubkey = tag[1];
          if (pubkey.length !== 64) {
            console.log("bad pubkey", pubkey, tag);
            continue;
          }
          this.fetchAndCacheMetadata(pubkey);
        }
      }
      return this.subscribeReferencedEvents(
        event,
        onEvent,
        maxDelayms,
        onEose,
        options
      );
    }
  };

  // collect.ts
  init_define_process();
  var binarySearch = function(a, target) {
    var l = 0, h = a.length - 1, m, comparison;
    let comparator = function(a2, b) {
      return a2.created_at - b.created_at;
    };
    while (l <= h) {
      m = l + h >>> 1;
      comparison = comparator(a[m], target);
      if (comparison < 0) {
        l = m + 1;
      } else if (comparison > 0) {
        h = m - 1;
      } else {
        return m;
      }
    }
    return ~l;
  };
  var binaryInsert = function(a, target) {
    const duplicate = true;
    var i = binarySearch(a, target);
    if (i >= 0) {
      if (!duplicate) {
        return i;
      }
    } else {
      i = ~i;
    }
    a.splice(i, 0, target);
    return i;
  };
  function collect(onEvents, skipSort = false) {
    let events = [];
    return (event, afterEose, url) => {
      if (skipSort) {
        events.push(event);
      } else {
        binaryInsert(events, event);
      }
      onEvents(events);
    };
  }
  return __toCommonJS(nostr_relaypool_ts_exports);
})();

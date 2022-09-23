var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => viteCodeNavigation
});
module.exports = __toCommonJS(src_exports);
var import_fs = __toESM(require("fs"));
function viteCodeNavigation(componentNames = []) {
  return {
    name: "vite-plugin-react-code-navigation",
    apply: "serve",
    transform(code, id) {
      if (!componentNames.length) {
        return code;
      }
      if (id.search(/\.[t|j]sx/) > -1) {
        const codeContent = import_fs.default.readFileSync(id).toString();
        const codeContentSplit = codeContent.split(/\n/);
        const matchedPositions = [];
        const compNames = componentNames.map((name, index) => `(${name})${index + 1 !== componentNames.length ? "|" : ""}`).join("");
        codeContentSplit.forEach((eachLine, line) => {
          const char = eachLine.search(new RegExp(`<(${compNames})+\\s*`, "g"));
          if (char > -1) {
            matchedPositions.push({
              line: line + 1,
              char: char + 1
            });
          }
        });
        let i = 0;
        return code.replace(new RegExp(`\\((${compNames}),\\s*{`, "g"), (match) => {
          const { line, char } = matchedPositions[i];
          const subString = `${match}  
              onContextMenu: (e) => {
                if(e.shiftKey){
                  e.preventDefault();
                  window.open('vscode://file/${id}:${line}:${char}')
                }
              },`;
          i++;
          return subString;
        });
      }
      return code;
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});

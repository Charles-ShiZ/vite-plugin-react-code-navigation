// src/index.ts
import fs from "fs";
function viteCodeNavigation({ componentNames = [] }) {
  return {
    name: "vite-plugin-react-code-navigation",
    apply: "serve",
    transform(code, id) {
      if (!componentNames.length) {
        return code;
      }
      if (id.search(/\.[t|j]sx/) > -1) {
        const codeContent = fs.readFileSync(id).toString();
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
export {
  viteCodeNavigation as default
};

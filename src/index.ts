import fs from 'fs'
import { Plugin } from 'vite';
export default function viteCodeNavigation (componentNames:string[] = []):Plugin {
    return {
      name: "vite-plugin-react-code-navigation",
      apply: "serve",
      transform(code: string, id:string) {
        if(!componentNames.length){
          return code
        }
        if(id.search(/\.[t|j]sx/) > -1){ // 如果是jsx或者tsx
          const codeContent = fs.readFileSync(id).toString() // 获取文件代码
          const codeContentSplit = codeContent.split(/\n/) // 按行分割代码
          const matchedPositions:{line:number,char:number}[]= [] // 存放匹配的代码位置
          const compNames = componentNames.map((name,index) =>
          `(${name})${index + 1 !== componentNames.length ? '|':''}`).join('') // 为正则表达式拼接字符串

          codeContentSplit.forEach((eachLine, line) => {
            // ?<! 可能不能兼容环境
            const char = eachLine.search(new RegExp(`(?<!\\/\\*\\s*)<(${compNames})+\\s*`, 'g')) // 匹配所有未被注释的组件开头。如，<Button 
            if(char > -1){
              matchedPositions.push({
                line: line + 1,// 字符纵向位置
                char: char + 1 // 字符横向位置
              })
            }
          })
          let i = 0
          return code.replace(new RegExp(`\\((${compNames}),\\s*{`, 'g'), (match) => {
            const { line, char } = matchedPositions[i]
            const subString = `${match}  
              onContextMenu: (e) => {
                if(e.shiftKey){
                  e.preventDefault();
                  window.open('vscode://file/${id}:${line}:${char}')
                }
              },`
            i++
            return subString
          })
        }
        return code
      },
    };
}
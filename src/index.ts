
import generate from '@babel/generator'
import * as parser from '@babel/parser'
import { Plugin } from 'vite';
export default function viteCodeNavigation (options:{
  triggerEvent:'onContextMenu'|'onClick'
  triggerKey:'shift'|'ctrl'
}):Plugin {
  const { triggerEvent = 'onContextMenu', triggerKey = 'shift' } = options ?? {}
  const bodyClosingTagRegExp = /<\/body>/
  const triggerEventCode = `
    document.${triggerEvent.toLocaleLowerCase()} = function (e) {
      const getDebugSource = (element) => {
        const fiberKey = Object.keys(element).find((key) => key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')) // __reactInternalInstance: react <= v16.13.1
        let debugOwner = element[fiberKey]
        while (debugOwner) {
          if (debugOwner._debugSource) {
            const { fileName, columnNumber, lineNumber } = debugOwner._debugSource
            return { fileName, columnNumber, lineNumber }
          }
          debugOwner = debugOwner._debugOwner
        }
      }
      const stackGetDebugSource = (element) => {
        if(!element) return
        const debugSource = getDebugSource(element)
        if(debugSource){
          return debugSource
        } else {
          return stackGetDebugSource(element.parentNode)
        }
      }
      const goToVscode = (filePath, line, column) => {
        const vscodeFilePath = \`vscode://file/\${filePath}:\${line}:\${column}\`
        const decodedFilePath = ((string) => {
          return decodeURI(string.replace(/\\\\u/g, '%u'))
        })(vscodeFilePath)
        window.open(decodedFilePath)
      }
      if (e[\`${triggerKey}Key\`]) {
        e.preventDefault()
        e.stopPropagation()
        const element = e.target
        const debugSource = stackGetDebugSource(element)
        if(debugSource) {
          const { fileName, columnNumber, lineNumber } = debugSource
          goToVscode(fileName, lineNumber, columnNumber)
        }
      }
    }
  `
  return {
    name: 'vite-plugin-react-code-navigation',
    apply: 'serve',
    enforce: 'pre',
    transformIndexHtml(html) {
      const triggerEventAst = parser.parse(triggerEventCode, {
        sourceType: 'unambiguous',
      })
      const { code: triggerEventCleanString } = generate(triggerEventAst, {
        comments: false, //无注释
        compact: true, //无空白
      })
      return html.replace(bodyClosingTagRegExp, (rootDivHtml) => {
        return `<script type="text/javascript">${triggerEventCleanString}</script>${rootDivHtml}`
      })
    },
  }
}
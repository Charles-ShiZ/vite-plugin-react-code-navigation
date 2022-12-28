import type { Plugin } from 'vite'
import generate from '@babel/generator'
import traverse from '@babel/traverse'
import * as parser from '@babel/parser'
import * as types from '@babel/types'

const forbiddenNodeTypes = ['JSXFragment']
const excludeDefault = [
  'React.Fragment',
  'Fragment',
  'MuiThemeProvider',
  'CssBaseline',
  'ThemeProvider',
  'ClickAwayListener',
]

const jsxStringAttribute = (attrName: string, attrValue: number | string) => {
  return [types.jsxIdentifier(attrName), types.stringLiteral(String(attrValue))] as const
}
const getJsxElementName = (openingElement: types.JSXOpeningElement) => { // 获取JSX元素名字
  const identifier = openingElement.name as types.JSXIdentifier
  if (identifier.name) return identifier.name

  const memberExpression = openingElement.name as types.JSXMemberExpression
  const memberExpressionObject = memberExpression.object as types.JSXIdentifier
  const memberExpressionProperty = memberExpression.property as types.JSXIdentifier
  return `${memberExpressionObject.name}.${memberExpressionProperty.name}`
}

export default function viteCodeNavigation(options?: {
  triggerEvent?: 'onContextMenu' | 'onClick'
  triggerKey?: 'shift' | 'ctrl'
  exclude?: string[]
  lineJsxKey: string
  columnJsxKey: string
  filePathJsxKey: string
}): Plugin {
  const {
    lineJsxKey = 'data-code-line',
    columnJsxKey = 'data-code-column',
    filePathJsxKey = 'data-code-file-path',
    triggerEvent = 'onContextMenu',
    triggerKey = 'shift',
    exclude = [],
  } = options ?? {}
  const excludeSet = Array.from(new Set([...exclude, ...excludeDefault]))
  // const rootDivRegExp = /<\w+ id\s*=\s*["|'|`]\s*root\s*["|'|`]\s*\/?>(<\/\w+>)/
  /* <div id="root"></div> */
  const bodyClosingTagRegExp = /<\/body>/
  const triggerEventCode = `
    document.${triggerEvent.toLocaleLowerCase()} = function (e) {
      if (e[\`${triggerKey}Key\`]) {
        e.preventDefault()
        e.stopPropagation()
        const element = e.target
        const attributes = element.attributes
        const { line, column, filePath } = ((element) => {
          const attributes = element.attributes
          const line = attributes.getNamedItem('${lineJsxKey}')
          const column = attributes.getNamedItem('${columnJsxKey}')
          const filePath = attributes.getNamedItem('${filePathJsxKey}')
          if (line && column && filePath) {
            return {
              line: line.value,
              column: +column.value + 1,
              filePath: filePath.value,
            }
          } else {
            const fiberKey = Object.keys(element).find((key) => key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance'))
            // __reactInternalInstance: react <= v16.13.1
            let debugOwner = element[fiberKey]
            while (debugOwner) {
              if (Object.keys(debugOwner.pendingProps).find((key) => key === '${lineJsxKey}')) {
                const line = debugOwner.pendingProps['${lineJsxKey}']
                const column = debugOwner.pendingProps['${columnJsxKey}']
                const filePath = debugOwner.pendingProps['${filePathJsxKey}']
                return {
                  line,
                  column: +column + 1,
                  filePath,
                }
              }
              debugOwner = debugOwner._debugOwner
            }
          }
        })(element)
        const vscodeFilePath = \`vscode://file/\${filePath}:\${line}:\${column}\`
        const decodedFilePath = ((string) => {
          return decodeURI(string.replace(/\\\\u/g, '%u'))
        })(vscodeFilePath)
        window.open(decodedFilePath)
      }
    }
  `
  return {
    name: 'vite-plugin-react-code-navigation',
    apply: 'serve',
    enforce: 'pre',
    transformIndexHtml(html: string) { // 修改入口html文件 index.html 的钩子
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
    transform(source: string, filePath: string) { // 修改每个编译的文件的钩子，source表示文件源码，filePath表示文件地址
      if (filePath.search(/\.[t|j]sx/) > -1) { // 如果是jsx或tsx文件
        const sourceAst = parser.parse(source, { // 将代码转化为ast树
          sourceType: 'unambiguous',
          plugins: ['typescript', 'jsx'],
          errorRecovery: false,
        })
        traverse(sourceAst, { // 遍历并修改ast树
          JSXElement(path) {
            const nodeType = path.node.type
            const openingElement = path.node.openingElement
            const jsxElementName = getJsxElementName(openingElement)
            if (!forbiddenNodeTypes.includes(nodeType) && !excludeSet.includes(jsxElementName)) {
              const { line, column } = path.node.loc?.start ?? {}
              if (line && column) {
                openingElement.attributes.unshift( // 添加新属性
                  types.jsxAttribute(...jsxStringAttribute(lineJsxKey, line)),
                  types.jsxAttribute(...jsxStringAttribute(columnJsxKey, column)),
                  types.jsxAttribute(...jsxStringAttribute(filePathJsxKey, filePath))
                )
              }
            }
          },
        })
        const { code: JsxCode } = generate(sourceAst) // 将新的ast树转化为新代码
        return JsxCode
      }
      return source
    },
  }
}

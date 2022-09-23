# vite-plugin-react-code-navigation
代码导航 vite 插件

## 功能 ( function )
在网页的某个组件上点击某个快捷键，快速跳转到 vscode 上组件对应的位置

## 使用 esbuild 打包 ( use esbuild to bundle ) 
   `npm run build` 执行打包

## 插件使用方法 ( how to use the vite plugin )
   vite.config.ts
   ```ts
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import codeNavigation from 'vite-plugin-react-code-navigation'

   export default defineConfig({
      plugins: [
         react(), 
         codeNavigation(['Button', 'IconButton', 'DialogTitle']) 
         // array of react component name
      ]
   })
   ```
   点击 shift 和 鼠标右键 跳转到组件在vscode编辑器的对应位置。
   
   click shift + right mouse button to jump the component position in vscode IDE
##  预览效果图 ( preview )
![pin-Interview](https://github.com/Charles-ShiZ/images/blob/master/code-navigation/preview.gif)

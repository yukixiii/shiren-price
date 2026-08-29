import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages でリポジトリ名のサブパスに配置されるため base を設定
// (リポジトリ名を変える場合はここを合わせる)
export default defineConfig({
  plugins: [react()],
  base: '/shiren-price/',
})

import { useEffect } from 'react'
import { destroySpecularButtons, mountSpecularButtons } from '../lib/specular'

/**
 * 给页面上所有 .btn 挂镜面高光（单上下文、单 rAF、空闲停帧）。
 * key 传路由标识：换页后重新扫描，旧页的按钮项被清空。
 */
export function useSpecularButtons(key: string) {
  useEffect(() => {
    mountSpecularButtons()
    return () => destroySpecularButtons()
  }, [key])
}

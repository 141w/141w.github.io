import { useEffect } from 'react'
import { initBorderGlow } from '../lib/borderGlow'

/**
 * 边框光走事件委托：不包 DOM、不随路由重建，
 * 指针第一次进入某个框时才给它补上光层。
 */
export function useBorderGlow() {
  useEffect(() => {
    initBorderGlow()
  }, [])
}

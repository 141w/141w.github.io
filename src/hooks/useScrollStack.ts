import { useEffect } from 'react'
import { destroyScrollStack, mountScrollStack, refreshScrollStack } from '../lib/scrollStack'

/**
 * /projects 的滚动堆叠。key 传路由标识，换页时解绑 scroll/resize 监听，
 * 并把高光层的叠卡钩子摘掉。
 */
export function useScrollStack(key: string) {
  useEffect(() => {
    mountScrollStack()
    refreshScrollStack()
    return () => destroyScrollStack()
  }, [key])
}

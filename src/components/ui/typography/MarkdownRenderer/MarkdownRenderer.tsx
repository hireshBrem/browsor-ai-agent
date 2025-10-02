import { type FC } from 'react'
import { Streamdown } from 'streamdown'

import { cn } from '@/lib/utils'

import { type MarkdownRendererProps } from './types'
import { inlineComponents } from './inlineStyles'
import { components } from './styles'

const MarkdownRenderer: FC<MarkdownRendererProps> = ({
  children,
  classname,
  inline = false
}) => (
  <Streamdown
    className={cn(
      'prose prose-h1:text-xl dark:prose-invert flex w-full flex-col gap-y-5 rounded-lg',
      classname
    )}
    components={{ ...(inline ? inlineComponents : components) }}
  >
    {children}
  </Streamdown>
)

export default MarkdownRenderer

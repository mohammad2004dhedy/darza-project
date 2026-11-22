import { useState, type ComponentProps } from 'react'
import { ImageIcon } from 'lucide-react'

type Props = Omit<ComponentProps<'img'>, 'onLoad'> & {
  containerClassName: string
  placeholderLabel?: string
}

export function ImageWithPlaceholder(props: Props) {
  return <ImageState key={props.src ?? ''} {...props} />
}

function ImageState({
  containerClassName,
  placeholderLabel,
  onError,
  className = 'h-full w-full object-cover',
  ...props
}: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const hasImage = Boolean(props.src) && status !== 'error'
  return (
    <span className={`relative block overflow-hidden bg-background ${containerClassName}`}>
      {status !== 'loaded' && (
        <span
          role={!hasImage && placeholderLabel ? 'img' : undefined}
          aria-label={!hasImage ? placeholderLabel : undefined}
          aria-hidden={hasImage || !placeholderLabel ? true : undefined}
          className="absolute inset-0 flex items-center justify-center"
        >
          <ImageIcon aria-hidden="true" className="size-5 text-text-muted" />
        </span>
      )}
      {hasImage && (
        <img
          {...props}
          decoding="async"
          onLoad={() => setStatus('loaded')}
          onError={(event) => {
            setStatus('error')
            onError?.(event)
          }}
          className={`${className} ${status === 'loaded' ? '' : 'opacity-0'}`}
        />
      )}
    </span>
  )
}

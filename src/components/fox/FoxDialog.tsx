'use client'

import Image from 'next/image'
import styles from './FoxDialog.module.css'

interface FoxDialogProps {
  line: string
  secondaryLine?: string
  delay?: number
  className?: string
  size?: number
}

export function FoxDialog({ line, secondaryLine, delay = 300, className = '', size = 48 }: FoxDialogProps) {
  return (
    <div
      className={`${styles.container} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Fox character */}
      <div
        className={styles.fox}
        style={{ animationDelay: `${delay}ms`, width: size, height: size }}
      >
        <Image
          src="/images/fox-coach.png"
          alt="Fox coach"
          width={size}
          height={size}
          className={styles.foxImage}
          style={{ width: size, height: size }}
        />
      </div>

      {/* Speech bubble */}
      <div
        className={styles.bubble}
        style={{ animationDelay: `${delay + 500}ms` }}
      >
        <p className={styles.line}>{line}</p>
        {secondaryLine && (
          <p className={styles.secondaryLine}>{secondaryLine}</p>
        )}
        <div className={styles.bubbleTail} />
      </div>
    </div>
  )
}

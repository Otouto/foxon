'use client'

import Image from 'next/image'
import styles from './FoxDialog.module.css'

interface FoxDialogProps {
  line: string
  secondaryLine?: string
  delay?: number
  className?: string
}

export function FoxDialog({ line, secondaryLine, delay = 300, className = '' }: FoxDialogProps) {
  return (
    <div
      className={`${styles.container} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
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

      {/* Fox character */}
      <div
        className={styles.fox}
        style={{ animationDelay: `${delay}ms` }}
      >
        <Image
          src="/images/fox-coach.png"
          alt="Fox coach"
          width={48}
          height={48}
          className={styles.foxImage}
        />
      </div>
    </div>
  )
}

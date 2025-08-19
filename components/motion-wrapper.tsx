"use client"

import { motion, type MotionProps } from "framer-motion"
import type { ReactNode } from "react"

interface MotionWrapperProps extends MotionProps {
  children: ReactNode
  className?: string
}

export function MotionWrapper({ children, className, ...props }: MotionWrapperProps) {
  return (
    <motion.div className={className} {...props}>
      {children}
    </motion.div>
  )
}

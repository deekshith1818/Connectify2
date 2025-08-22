import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function cva(base, config = {}) {
  const { variants = {}, defaultVariants = {} } = config

  return function (props = {}) {
    const { className, ...rest } = props
    const variantProps = Object.keys(variants).reduce((acc, key) => {
      if (rest[key] !== undefined) {
        acc[key] = rest[key]
      }
      return acc
    }, {})

    const variantClasses = Object.keys(variantProps).map(key => {
      const variant = variants[key]
      const value = variantProps[key]
      return variant[value] || variant[defaultVariants[key]]
    }).filter(Boolean)

    return cn(base, ...variantClasses, className)
  }
}

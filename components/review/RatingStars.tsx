'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  rating: number
  size?: number
  interactive?: boolean
  onChange?: (rating: number) => void
  className?: string
}

export function RatingStars({ 
  rating, 
  size = 20, 
  interactive = false, 
  onChange,
  className 
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating

  const handleStarClick = (starValue: number) => {
    if (interactive && onChange) {
      onChange(starValue)
    }
  }

  const handleStarHover = (starValue: number) => {
    if (interactive) {
      setHoverRating(starValue)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0)
    }
  }

  return (
    <div 
      className={cn('flex items-center gap-0.5', className)}
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((starValue) => (
        <Star
          key={starValue}
          size={size}
          className={cn(
            'transition-colors',
            starValue <= displayRating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300',
            interactive && 'cursor-pointer hover:scale-110 transition-transform'
          )}
          onClick={() => handleStarClick(starValue)}
          onMouseEnter={() => handleStarHover(starValue)}
        />
      ))}
      {!interactive && (
        <span className="ml-2 text-sm text-gray-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

interface RatingDisplayProps {
  rating: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

export function RatingDisplay({ 
  rating, 
  label, 
  size = 'md',
  showValue = true,
  className 
}: RatingDisplayProps) {
  const sizeMap = {
    sm: 14,
    md: 16,
    lg: 20,
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && (
        <span className="text-sm text-gray-600 font-medium">
          {label}
        </span>
      )}
      <RatingStars rating={rating} size={sizeMap[size]} />
      {showValue && (
        <span className={cn(
          'font-semibold text-gray-700',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-lg'
        )}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
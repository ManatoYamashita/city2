'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({
  value = '',
  onChange,
  onSearch,
  placeholder = '授業名、教員名、科目コードで検索...',
  className
}: SearchBarProps) {
  const [searchValue, setSearchValue] = useState(value)

  useEffect(() => {
    setSearchValue(value)
  }, [value])

  const handleInputChange = (newValue: string) => {
    setSearchValue(newValue)
    onChange?.(newValue)
  }

  const handleSearch = () => {
    onSearch?.(searchValue)
  }

  const handleClear = () => {
    setSearchValue('')
    onChange?.('')
    onSearch?.('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className={cn('relative flex items-center gap-2', className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={searchValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <Button onClick={handleSearch} className="flex-shrink-0">
        検索
      </Button>
    </div>
  )
}
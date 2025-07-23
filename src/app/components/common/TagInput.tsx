import * as React from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  disabled?: boolean
  maxTags?: number
}

export function TagInput({
  tags,
  onChange,
  placeholder = '添加标签...',
  disabled = false,
  maxTags = 10,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState('')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  const addTag = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !tags.includes(trimmed) && tags.length < maxTags) {
      onChange([...tags, trimmed])
      setInputValue('')
    }
  }

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index))
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 p-2 border border-input rounded-md min-h-[42px]">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full"
          >
            {tag}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-blue-200"
              onClick={() => removeTag(index)}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </span>
        ))}
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length < maxTags ? placeholder : ''}
          className="flex-1 min-w-[100px] border-0 focus:ring-0 px-1 py-0 h-auto"
          disabled={disabled || tags.length >= maxTags}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {tags.length}/{maxTags} 标签
      </p>
    </div>
  )
}
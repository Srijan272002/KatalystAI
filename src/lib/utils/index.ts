import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateDuration(startTime: string, endTime: string): number {
  try {
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 60 // Default 1 hour
    }
    
    const durationMs = end.getTime() - start.getTime()
    const durationMinutes = Math.round(durationMs / (1000 * 60))
    
    // Ensure positive duration, minimum 15 minutes
    return Math.max(durationMinutes, 15)
  } catch {
    return 60 // Default 1 hour on error
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${remainingMinutes}m`
}

export function formatDateTime(dateTime: string): string {
  try {
    const date = new Date(dateTime)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return 'Invalid date'
  }
}

export function formatDate(dateTime: string): string {
  try {
    const date = new Date(dateTime)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return 'Invalid date'
  }
}

export function formatTime(dateTime: string): string {
  try {
    const date = new Date(dateTime)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return 'Invalid time'
  }
}

export function isToday(dateTime: string): boolean {
  try {
    const date = new Date(dateTime)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  } catch {
    return false
  }
}

export function isTomorrow(dateTime: string): boolean {
  try {
    const date = new Date(dateTime)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return date.toDateString() === tomorrow.toDateString()
  } catch {
    return false
  }
}

export function getRelativeDateLabel(dateTime: string): string {
  if (isToday(dateTime)) return 'Today'
  if (isTomorrow(dateTime)) return 'Tomorrow'
  
  try {
    const date = new Date(dateTime)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return diffDays === -1 ? 'Yesterday' : `${Math.abs(diffDays)} days ago`
    } else if (diffDays <= 7) {
      return `In ${diffDays} days`
    }
    
    return formatDate(dateTime)
  } catch {
    return formatDate(dateTime)
  }
}
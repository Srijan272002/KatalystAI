type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: Record<string, unknown>
  userId?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatLog(level: LogLevel, message: string, data?: Record<string, unknown>, userId?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userId,
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true
    
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error'
  }

  debug(message: string, data?: Record<string, unknown>, userId?: string) {
    if (this.shouldLog('debug')) {
      const logEntry = this.formatLog('debug', message, data, userId)
      console.debug(JSON.stringify(logEntry))
    }
  }

  info(message: string, data?: Record<string, unknown>, userId?: string) {
    if (this.shouldLog('info')) {
      const logEntry = this.formatLog('info', message, data, userId)
      console.info(JSON.stringify(logEntry))
    }
  }

  warn(message: string, data?: Record<string, unknown>, userId?: string) {
    if (this.shouldLog('warn')) {
      const logEntry = this.formatLog('warn', message, data, userId)
      console.warn(JSON.stringify(logEntry))
    }
  }

  error(message: string, error?: Error | unknown, userId?: string, duration?: number) {
    if (this.shouldLog('error')) {
      const logEntry = this.formatLog('error', message, {
        error: (error as Error)?.message || error,
        stack: (error as Error)?.stack,
        duration: duration ? `${duration}ms` : undefined,
      }, userId)
      console.error(JSON.stringify(logEntry))
    }
  }

  // Security-focused logging
  securityEvent(event: string, userId?: string, details?: Record<string, unknown>) {
    const logEntry = this.formatLog('warn', `SECURITY_EVENT: ${event}`, {
      ...details,
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : undefined,
    }, userId)
    console.warn(JSON.stringify(logEntry))
  }

  // API request logging
  apiRequest(method: string, path: string, userId?: string, duration?: number) {
    this.info(`API_REQUEST: ${method} ${path}`, {
      duration: duration ? `${duration}ms` : undefined,
    }, userId)
  }

  apiError(method: string, path: string, error: Error, userId?: string, duration?: number) {
    this.error(`API_ERROR: ${method} ${path}`, error, userId, duration)
  }
}

export const logger = new Logger()

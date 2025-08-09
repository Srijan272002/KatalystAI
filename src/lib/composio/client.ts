import { Composio } from "composio-core"
import { config } from "../config"

export class ComposioClient {
  private client: Composio

  constructor() {
    this.client = new Composio({
      apiKey: config.composio.apiKey,
    })
  }

  async getConnectedAccount(userId: string): Promise<{ id: string; status: string; appName?: string } | null> {
    try {
      // Helper to detect plain object
      const isObject = (val: unknown): val is Record<string, unknown> =>
        typeof val === 'object' && val !== null

      // Extract an array of accounts from any response shape
      const extractAccounts = (resp: unknown): unknown[] => {
        const arrays: unknown[] = []
        if (Array.isArray(resp)) arrays.push(resp)
        if (isObject(resp)) {
          const r = resp
          const candidates = [
            (r as { items?: unknown[] }).items,
            (r as { data?: unknown }).data,
            (r as { results?: unknown[] }).results,
            (r as { connectedAccounts?: unknown[] }).connectedAccounts,
            (r as { accounts?: unknown[] }).accounts,
          ]
          for (const c of candidates) if (Array.isArray(c)) arrays.push(c)
          if (arrays.length === 0) {
            const queue: unknown[] = [r]
            const visited = new Set<unknown>()
            while (queue.length) {
              const cur = queue.shift()!
              if (visited.has(cur)) continue
              visited.add(cur)
              if (Array.isArray(cur)) { arrays.push(cur); break }
              if (isObject(cur)) for (const v of Object.values(cur)) queue.push(v)
            }
          }
        }
        return arrays.find(Array.isArray) || []
      }

      const normalize = (s?: unknown) =>
        (typeof s === 'string' ? s : String(s ?? '')).toLowerCase().replace(/[^a-z0-9]/g, '')

      const desiredApp = normalize('googlecalendar')
      const acceptableStatuses = new Set(['active', 'connected', 'authorized', 'verified'])

      const pickAccount = (arr: unknown[]): { id: string; status: string; appName?: string } | null => {
        for (const item of arr) {
          if (!isObject(item)) continue
          const appName = (item.appName ?? item.app ?? item.integrationName ?? item.app_slug) as unknown
          const normalizedApp = normalize(appName)
          if (normalizedApp !== desiredApp && !normalizedApp.includes('googlecalendar')) continue

          const id = (item.id ?? (item as any).connectedAccountId ?? (item as any).account_id ?? (item as any).uuid) as string | undefined
          if (!id) continue

          const statusRaw = (item.status ?? (item as any).connectionStatus ?? (item as any).state) as unknown
          const statusNorm = normalize(statusRaw)
          const mappedStatus = statusNorm || 'active'
          const finalStatus = acceptableStatuses.has(mappedStatus) ? 'ACTIVE' : mappedStatus.toUpperCase()
          return { id, status: finalStatus, appName: typeof appName === 'string' ? appName : undefined }
        }
        return null
      }

      // Attempt 1: list with email using correct filters
      let resp: unknown = await this.client.connectedAccounts.list({
        user_uuid: userId,
        appNames: 'googlecalendar',
        status: 'ACTIVE',
      } as any)
      let found = pickAccount(extractAccounts(resp))

      // Attempt 2: list with local-part of email (e.g., "user" from user@example.com)
      if (!found && userId.includes('@')) {
        const local = userId.split('@')[0]
        try {
          resp = await this.client.connectedAccounts.list({
            user_uuid: local,
            appNames: 'googlecalendar',
            status: 'ACTIVE',
          } as any)
          found = pickAccount(extractAccounts(resp))
        } catch {/* ignore */}
      }

      // Attempt 2.5: use Entity API to fetch connection tied to this user
      if (!found) {
        try {
          const entity = this.client.getEntity(userId)
          const connection = await (entity as any).getConnection({ app: 'googlecalendar' })
          if (connection?.id) {
            found = { id: connection.id as string, status: 'ACTIVE', appName: 'googlecalendar' }
          }
        } catch { /* ignore */ }
      }

      // Attempt 3: broad query without entity filter (if supported)
      if (!found) {
        try {
          resp = await this.client.connectedAccounts.list({ appNames: 'googlecalendar' } as any)
          found = pickAccount(extractAccounts(resp))
        } catch {/* ignore */}
      }

      return found
    } catch (error) {
      console.error("Error getting connected account:", error)
      throw new Error("Failed to get connected account")
    }
  }

  async initiateConnection(userId: string, redirectUrl?: string) {
    try {
      const connectionRequest = await this.client.connectedAccounts.initiate({
        entityId: userId,
        appName: "googlecalendar",
        authMode: "OAUTH2",
        authConfig: {
          id: config.composio.authConfigId,
        },
        redirectUri: redirectUrl || `${config.nextAuth.url}/dashboard`,
      })

      return connectionRequest
    } catch (error) {
      console.error("Error initiating connection:", error)
      throw new Error("Failed to initiate calendar connection")
    }
  }

  async executeAction(
    connectedAccountId: string,
    action: string,
    parameters: Record<string, unknown> = {}
  ) {
    try {
      const result = await this.client.actions.execute({
        actionName: action,
        requestBody: {
          connectedAccountId,
          appName: "googlecalendar",
          input: parameters,
        },
      })

      return result
    } catch (error) {
      console.error(`Error executing action ${action}:`, error)
      throw new Error(`Failed to execute calendar action: ${action}`)
    }
  }

  async getUpcomingEvents(connectedAccountId: string, maxResults: number = 5) {
    return this.executeAction(connectedAccountId, "GOOGLECALENDAR_LIST_EVENTS", {
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    })
  }

  async getPastEvents(connectedAccountId: string, maxResults: number = 5) {
    const endTime = new Date()
    const startTime = new Date()
    startTime.setMonth(startTime.getMonth() - 1) // Get events from last month

    return this.executeAction(connectedAccountId, "GOOGLECALENDAR_LIST_EVENTS", {
      calendarId: "primary",
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    })
  }
}

export const composioClient = new ComposioClient()

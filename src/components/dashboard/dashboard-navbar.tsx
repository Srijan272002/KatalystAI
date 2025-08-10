"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw, Calendar } from "lucide-react"
import { SimpleAuthStatus } from "@/components/auth/simple-auth-status"

interface DashboardNavbarProps {
  activeTab: "upcoming" | "past"
  onTabChange: (tab: "upcoming" | "past") => void
  onRefresh: () => void
  refreshing: boolean
  lastUpdated?: string
}

export function DashboardNavbar({ 
  activeTab, 
  onTabChange, 
  onRefresh, 
  refreshing, 
  lastUpdated 
}: DashboardNavbarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Title and tabs */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl font-semibold text-gray-900">Calendar Dashboard</h1>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1">
            <Button
              variant={activeTab === "upcoming" ? "default" : "ghost"}
              size="sm"
              onClick={() => onTabChange("upcoming")}
              className={`px-4 py-2 ${
                activeTab === "upcoming" 
                  ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Upcoming Meetings
            </Button>
            <Button
              variant={activeTab === "past" ? "default" : "ghost"}
              size="sm"
              onClick={() => onTabChange("past")}
              className={`px-4 py-2 ${
                activeTab === "past" 
                  ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Past Meetings
            </Button>
          </div>
        </div>

        {/* Right side - Refresh and auth status */}
        <div className="flex items-center space-x-4">
          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {/* Last updated timestamp */}
          {lastUpdated && (
            <span className="text-sm text-gray-600 font-medium">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}

          {/* Auth status */}
          <SimpleAuthStatus />
        </div>
      </div>
    </div>
  )
}

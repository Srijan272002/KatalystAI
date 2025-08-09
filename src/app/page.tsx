import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Users, Zap, Brain, Shield } from "lucide-react"
import { ConnectGoogleButton } from "@/components/auth/connect-google-button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            AI-Powered Calendar Intelligence
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Transform your Google Calendar into an intelligent workspace. Get AI-powered insights, summaries, and
            contextual information about your meetings.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <ConnectGoogleButton 
              size="lg" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white" 
              label="Login with Google Calendar"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600">Simple steps to unlock your calendar's potential</p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <Calendar className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Connect Calendar</h3>
              <p className="mt-2 text-gray-600">Securely connect your Google Calendar with one click</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <Brain className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">AI Analysis</h3>
              <p className="mt-2 text-gray-600">Our AI analyzes your meetings and generates intelligent insights</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <Zap className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Get Insights</h3>
              <p className="mt-2 text-gray-600">Access summaries, action items, and contextual information</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">Powerful Features</h2>
            <p className="mt-4 text-lg text-gray-800">Everything you need to make your meetings more productive</p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Clock className="h-8 w-8 text-indigo-600" />
                <CardTitle>Smart Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed">
                  View upcoming and past meetings with detailed information including duration, attendees, and
                  descriptions.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Brain className="h-8 w-8 text-indigo-600" />
                <CardTitle>AI Summaries</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Get AI-generated summaries of your past meetings with key takeaways and action items.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-indigo-600" />
                <CardTitle>Attendee Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed">
                  See who attended your meetings and get context about your interactions with different people.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-indigo-600" />
                <CardTitle>Secure Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Your calendar data is processed securely with enterprise-grade encryption and privacy protection.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-indigo-600" />
                <CardTitle>Real-time Sync</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Stay up-to-date with real-time synchronization of your Google Calendar events and changes.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Calendar className="h-8 w-8 text-indigo-600" />
                <CardTitle>Smart Filtering</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Easily filter and search through your meetings to find exactly what you're looking for.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Transform Your Calendar?
            </h2>
            <p className="mt-4 text-lg text-indigo-200 max-w-2xl">
              Connect your Google Calendar and start getting AI-powered insights today.
            </p>
            <div className="mt-8 flex justify-center w-full">
              <ConnectGoogleButton 
                size="lg" 
                className="bg-white text-indigo-600 hover:bg-gray-100 flex items-center gap-2 px-8 py-3 rounded-full font-medium" 
                label="Login with Google Calendar"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-lg font-semibold text-white">Katalyst Calendar AI</h3>
              <p className="mt-2 text-gray-400">
                Transforming how you interact with your calendar through AI-powered intelligence.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Product</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Company</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800">
            <p className="text-center text-gray-400">© 2024 Katalyst Calendar AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
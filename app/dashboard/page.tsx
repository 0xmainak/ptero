'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface User {
  id: string
  username: string
  email: string
  avatar?: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingServer, setCreatingServer] = useState(false)
  const [serverCreated, setServerCreated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/user')
      setUser(response.data)
    } catch (error) {
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const createServer = async () => {
    setCreatingServer(true)
    try {      await axios.post(
        '/api/create-server',
        {
          user_uploaded_files: false, // Maps to egg variable USER_UPLOAD - boolean converted to "0"/"1" in backend
          auto_update: false, // Maps to egg variable AUTO_UPDATE - boolean converted to "0"/"1" in backend
          mainFile: 'main.py', // Maps to egg variable PY_FILE
          extraPackages: 'discord.py', // Maps to egg variable PY_PACKAGES
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      setServerCreated(true)
    } catch (error) {
      console.error('Failed to create server:', error)
      alert('Failed to create server. Check console for more info.')
    } finally {
      setCreatingServer(false)
    }
  }

  const logout = async () => {
    document.cookie = 'discord_user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={logout}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Your Account</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <p className="text-gray-900">{user.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Discord ID</label>
                <p className="text-gray-900">{user.id}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Bot Hosting</h2>
            {!serverCreated ? (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Ready to get your bot hosting slot? Click below to create your server.
                </p>
                <button
                  onClick={createServer}
                  disabled={creatingServer}
                  className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {creatingServer ? 'Creating Server...' : 'Create Bot Server'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-green-800 font-medium">Server Created!</h3>
                  <p className="text-green-700 text-sm mt-1">
                    Your bot hosting server has been successfully created.
                  </p>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Server Name</label>
                    <p className="text-gray-900">{user.username}-bot</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Resources</label>
                    <p className="text-gray-900">200MB RAM, 500MB Storage</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Access Panel</label>
                    <p className="text-gray-600 text-sm">
                      Check your email for panel access credentials or contact support.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Real-Time Collaboration Component
 * Provides live collaboration features including presence, shared cursors, and real-time sync
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Share2,
  Edit3,
  UserPlus,
  Settings,
  Bell,
  Wifi,
  WifiOff,
  MessageCircle,
  Video,
  CheckCircle2,
  MousePointer2,
  Send,
  Phone,
  Calendar
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

const RealTimeCollaboration = ({ _modelId, currentUser, _onDataChange }) => {
  const [activeUsers, setActiveUsers] = useState([
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      avatar: 'SJ',
      status: 'online',
      cursor: { x: 245, y: 120 },
      currentSection: 'DCF Assumptions',
      lastActive: new Date(),
      color: '#3B82F6'
    },
    {
      id: 2,
      name: 'Mike Chen',
      email: 'mike@company.com',
      avatar: 'MC',
      status: 'online',
      cursor: { x: 450, y: 280 },
      currentSection: 'Scenario Analysis',
      lastActive: new Date(),
      color: '#10B981'
    },
    {
      id: 3,
      name: 'Alex Rivera',
      email: 'alex@company.com',
      avatar: 'AR',
      status: 'away',
      cursor: null,
      currentSection: null,
      lastActive: new Date(Date.now() - 300000), // 5 minutes ago
      color: '#F59E0B'
    }
  ]);

  const [isConnected, setIsConnected] = useState(true);
  const [notifications, _setNotifications] = useState([
    {
      id: 1,
      type: 'change',
      user: 'Sarah Johnson',
      message: 'Updated WACC assumptions',
      timestamp: new Date(Date.now() - 120000),
      read: false
    },
    {
      id: 2,
      type: 'comment',
      user: 'Mike Chen',
      message: 'Added comment on terminal growth rate',
      timestamp: new Date(Date.now() - 300000),
      read: false
    }
  ]);

  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      user: 'Sarah Johnson',
      message: 'Updated the WACC to reflect current market conditions',
      timestamp: new Date(Date.now() - 600000),
      type: 'message'
    },
    {
      id: 2,
      user: 'Mike Chen',
      message: 'Looks good! Should we also update the terminal growth rate?',
      timestamp: new Date(Date.now() - 480000),
      type: 'message'
    },
    {
      id: 3,
      user: 'System',
      message: 'Alex Rivera joined the session',
      timestamp: new Date(Date.now() - 360000),
      type: 'system'
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState('presence');
  const chatEndRef = useRef(null);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate cursor movements
      setActiveUsers(prev =>
        prev.map(user => ({
          ...user,
          cursor:
            user.status === 'online'
              ? {
                  x: Math.random() * 800,
                  y: Math.random() * 600
                }
              : user.cursor
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        user: currentUser?.name || 'Current User',
        message: newMessage,
        timestamp: new Date(),
        type: 'message'
      };
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const formatTime = date => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = status => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Connection Status */}
      <div
        className={`flex items-center justify-between p-4 rounded-lg ${
          isConnected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}
      >
        <div className="flex items-center space-x-3">
          {isConnected ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-600" />
          )}
          <span className={`font-medium ${isConnected ? 'text-green-900' : 'text-red-900'}`}>
            {isConnected ? 'Connected to collaboration server' : 'Disconnected - Working offline'}
          </span>
        </div>
        {!isConnected && (
          <button
            onClick={() => setIsConnected(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Reconnect
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Collaboration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Users & Presence */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Live Collaboration ({activeUsers.filter(u => u.status === 'online').length} online)
              </h2>
            </div>

            <div className="p-6">
              {/* Tab Navigation */}
              <div className="flex space-x-4 mb-6 border-b border-gray-200">
                {[
                  { id: 'presence', label: 'Presence', icon: Users },
                  { id: 'changes', label: 'Live Changes', icon: Edit3 },
                  { id: 'permissions', label: 'Permissions', icon: Settings }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Presence Tab */}
              {activeTab === 'presence' && (
                <div className="space-y-4">
                  {activeUsers.map(user => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                            style={{ backgroundColor: user.color }}
                          >
                            {user.avatar}
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(user.status)}`}
                          />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-600 flex items-center space-x-2">
                            <span>{user.status}</span>
                            {user.currentSection && (
                              <>
                                <span>•</span>
                                <span>Working on {user.currentSection}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-blue-600 p-2">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-green-600 p-2">
                          <Video className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-purple-600 p-2">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Invite collaborator
                  </button>
                </div>
              )}

              {/* Live Changes Tab */}
              {activeTab === 'changes' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="font-medium text-blue-900">Live Sync Enabled</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          All changes are automatically synchronized across all collaborators in
                          real-time.
                        </p>
                      </div>
                    </div>
                  </div>

                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {notification.type === 'change' ? (
                          <Edit3 className="w-4 h-4 text-blue-600" />
                        ) : (
                          <MessageCircle className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{notification.user}</div>
                        <div className="text-sm text-gray-600">{notification.message}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatTime(notification.timestamp)}
                        </div>
                      </div>
                      {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                    </div>
                  ))}
                </div>
              )}

              {/* Permissions Tab */}
              {activeTab === 'permissions' && (
                <div className="space-y-4">
                  {activeUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.avatar}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </div>
                      </div>

                      <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option>Can Edit</option>
                        <option>Can Comment</option>
                        <option>Can View</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Shared Cursors Visualization */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <MousePointer2 className="w-5 h-5 mr-2" />
                Live Cursors & Focus Areas
              </h3>
            </div>
            <div className="p-6">
              <div className="relative bg-gray-100 rounded-lg h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50" />

                {/* Simulate worksheet sections */}
                <div className="absolute top-4 left-4 w-32 h-16 bg-white border-2 border-gray-300 rounded text-center flex items-center justify-center text-sm font-medium">
                  DCF Model
                </div>
                <div className="absolute top-4 right-4 w-32 h-16 bg-white border-2 border-gray-300 rounded text-center flex items-center justify-center text-sm font-medium">
                  Scenarios
                </div>
                <div className="absolute bottom-4 left-4 w-32 h-16 bg-white border-2 border-gray-300 rounded text-center flex items-center justify-center text-sm font-medium">
                  Charts
                </div>
                <div className="absolute bottom-4 right-4 w-32 h-16 bg-white border-2 border-gray-300 rounded text-center flex items-center justify-center text-sm font-medium">
                  Results
                </div>

                {/* Live cursors */}
                {activeUsers
                  .filter(u => u.status === 'online' && u.cursor)
                  .map(user => (
                    <motion.div
                      key={user.id}
                      className="absolute pointer-events-none"
                      style={{
                        left: user.cursor.x,
                        top: user.cursor.y,
                        color: user.color
                      }}
                      animate={{
                        x: [0, 10, 0],
                        y: [0, 5, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    >
                      <MousePointer2 className="w-5 h-5" style={{ color: user.color }} />
                      <div
                        className="absolute left-6 top-0 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name}
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chat & Communication Sidebar */}
        <div className="space-y-6">
          {/* Chat Panel */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
              <h3 className="text-white font-medium flex items-center">
                <MessageCircle className="w-4 h-4 mr-2" />
                Team Chat
              </h3>
              <button
                onClick={() => setShowChat(!showChat)}
                className="text-gray-300 hover:text-white"
              >
                {showChat ? 'Hide' : 'Show'}
              </button>
            </div>

            <AnimatePresence>
              {showChat && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="h-64 overflow-y-auto p-4 space-y-3">
                    {chatMessages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.type === 'system' ? 'justify-center' : 'justify-start'
                        }`}
                      >
                        {message.type === 'system' ? (
                          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {message.message}
                          </div>
                        ) : (
                          <div className="max-w-xs">
                            <div className="bg-blue-600 text-white px-3 py-2 rounded-lg">
                              <div className="text-xs font-medium mb-1">{message.user}</div>
                              <div className="text-sm">{message.message}</div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatTime(message.timestamp)}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="border-t border-gray-200 p-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center">
                <Video className="w-4 h-4 mr-2" />
                Start Video Call
              </button>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center">
                <Phone className="w-4 h-4 mr-2" />
                Start Voice Call
              </button>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Meeting
              </button>
              <button className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center">
                <Share2 className="w-4 h-4 mr-2" />
                Share Screen
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {notifications.slice(0, 3).map(notification => (
                <div key={notification.id} className="text-sm">
                  <div className="font-medium text-gray-900">{notification.user}</div>
                  <div className="text-gray-600">{notification.message}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTime(notification.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeCollaboration;

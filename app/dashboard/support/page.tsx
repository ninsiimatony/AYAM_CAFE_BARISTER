import type { Metadata } from 'next'
import ChatWindow from '@/components/chat/ChatWindow'

export const metadata: Metadata = { title: 'Customer Support' }

export default function SupportPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-coffee-900">Customer Support</h1>
        <p className="text-coffee-500 mt-1">
          Chat with our AI assistant — powered by OpenAI. Get instant answers about orders, menu, and more.
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <ChatWindow />
      </div>
    </div>
  )
}

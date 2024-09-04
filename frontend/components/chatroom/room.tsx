'use client';

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { SendIcon } from "lucide-react"
import { useEffect, useState } from "react"

type Message = {
  author: string
  content: string
}

const INITIAL_MESSAGES: Message[] = [
  { author: 'AI', content: 'Hey there! How\'s it going?' },
]

export default function Room() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const handleSend = () => {
    if (input.trim() === '') return
    setMessages((messages) => [
      ...messages,
      input.trim() === '' ? { author: 'AI', content: 'I didn\'t get that. Could you try again?' } : { author: 'Me', content: input },
    ])
    setInput('')
  }
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    const getAIResponse = async () => {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: lastMessage.content }),
      })
      return await response.json()
    }
    if (lastMessage.author === 'Me') {
      getAIResponse().then((aiResponse) => {
        setMessages((messages) => [
          ...messages,
          aiResponse.message.trim() === '' ? { author: 'AI', content: 'I didn\'t get that. Could you try again?' } : { author: 'AI', content: aiResponse.message },
        ])
      }).catch(() => {
        setMessages((messages) => [
          ...messages,
          { author: 'AI', content: 'I didn\'t get that. Could you try again?' },
        ])
      })
    }
  }, [messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Backspace') {
      setInput(currentInput => currentInput.slice(0, -1))
      return
    }

    if (e.shiftKey || e.metaKey || e.altKey || e.ctrlKey) return

    if (e.key === 'Enter') {
      handleSend()
      e.preventDefault()
      setInput('')
      return
    }

    setInput(currentInput => currentInput + e.key)
  }


  return (
    <div className="flex flex-col h-screen max-w-full mx-auto">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex items-center gap-4 ${message.author !== 'AI' && 'justify-end'}`}>
            {message.author === 'AI' ? ( // Show AI avatar on the left
              <>
                <Avatar className="w-8 h-8 border">
                  <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
                  <AvatarFallback>{message.author}</AvatarFallback>
                </Avatar>
                <div className="bg-card rounded-lg p-3 max-w-[70%] border">
                  <p className="text-sm text-card-foreground">{message.content}</p>
                </div>
              </>
            ) : ( // Show user avatar on the right
              <>
                <div className="bg-card rounded-lg p-3 max-w-[70%] border">
                  <p className="text-sm text-card-foreground">{message.content}</p>
                </div>
                <Avatar className="w-8 h-8 border">
                  <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
                  <AvatarFallback>{message.author}</AvatarFallback>
                </Avatar>
              </>
            )
            }
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 p-4 bg-background rounded-lg shadow-sm">
        <Textarea
          placeholder="Type your message..."
          className="flex-1 resize-none focus:ring-0 focus:outline-none"
          onKeyDown={handleKeyDown}
          value={input}
          rows={1}
        />
        <Button onClick={handleSend}>
          <SendIcon className="w-5 h-5" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  )
}

'use client';

import {Textarea} from "@/components/ui/textarea"
import {Button} from "@/components/ui/button"
import {Loader2, SendIcon} from "lucide-react"
import React, {useEffect, useState} from "react"
import {TopLevelSpec} from "vega-lite";
import MessageBubble from "@/components/ui/messagebubble";
import MessageSkeleton from "@/components/ui/messageskeleton";
import CSVUploader from "@/components/ui/csvuploader";

export const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT!

type Message = {
    author: string
    content?: string
    attachment?: TopLevelSpec
}

const INITIAL_MESSAGES: Message[] = [
    {author: 'AI', content: 'Hey there! How\'s it going?'},
]

export default function Room() {
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [showUploader, setShowUploader] = useState(false)

    const handleSend = () => {
        if (input.trim() === '') return
        setMessages((messages) => [
            ...messages,
            {author: 'Me', content: input},
        ])
        setInput('')
    }
    useEffect(() => {
        const lastMessage = messages[messages.length - 1]
        const getAIResponse = async () => {
            const isQueryData = lastMessage?.content?.startsWith("/query")
            const url = `${API_ENDPOINT}/${isQueryData ? 'query-data' : 'query'}`
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({prompt: lastMessage.content}),
                signal: AbortSignal.timeout(30000),
            })
            if (!response.ok) {
                throw new Error("Cannot get api response")
            }
            return await response.json()
        }
        if (lastMessage.author !== "Me") {
            return
        }
        setLoading(true)
        getAIResponse().then((aiResponse) => {
            if (!aiResponse?.response) {
                setLoading(false)
                return
            }
            setLoading(false)
            const response = aiResponse.response
            if (response instanceof Object) {
                setMessages(
                    messages => [...messages, {
                        author: 'AI',
                        content: '',
                        attachment: response as TopLevelSpec
                    }]
                )
                return
            }
            setMessages((messages) => [
                ...messages,
                aiResponse.response.trim() === '' ? {
                    author: 'AI',
                    content: 'I didn\'t get that. Could you try again?'
                } : {author: 'AI', content: aiResponse.response},
            ])
        }).catch(() => {
            setLoading(false)
            setMessages((messages) => [
                ...messages,
                {author: 'AI', content: 'I didn\'t get that. Could you try again?'},
            ])
        })
    }, [messages])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        e.preventDefault()
        setInput(e.target.value)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const MessageContent = () => {
        return (
            <>
                {
                    messages.map((message, index) => (
                        <MessageBubble {...message} key={index}/>
                    ))
                }
                {
                    loading && <MessageSkeleton/>
                }
            </>
        )
    }


    return (
        <div className="flex flex-col h-screen max-w-full mx-auto">
            <div className="flex items-center justify-between p-4 bg-background rounded-t-lg shadow-sm">
                <h1 className="text-lg font-bold text-card-foreground">CSCI3360 Chatroom Demo</h1>
                <div className="actions space-x-1">
                    <Button onClick={() => setShowUploader(state => !state)}
                            className={`bg-amber-400 hover:bg-amber-700`}>Upload file</Button>
                    <Button onClick={() => setMessages(INITIAL_MESSAGES)}>Clear Chat</Button>
                </div>
            </div>
            {
                showUploader && (
                    <CSVUploader/>
                )
            }
            <div className="flex-1 overflow-auto p-4 space-y-4">
                <MessageContent/>
            </div>
            <div className="flex items-start gap-2 p-4 bg-background rounded-lg shadow-sm">
                <Textarea
                    placeholder="Type your message..."
                    className="flex-1 resize-none focus:ring-0 focus:outline-none"
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    value={input}
                    rows={1}
                />
                {loading ? (
                    // Show loading spinner
                    <Button disabled>
                        <Loader2 className="w-5 h-5 animate-spin"/>
                    </Button>
                ) : (
                    <Button onClick={handleSend}>
                        <SendIcon className="w-5 h-5"/>
                        <span className="sr-only">Send</span>
                    </Button>
                )
                }
            </div>
        </div>
    )
}

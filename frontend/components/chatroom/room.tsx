'use client';

import {Avatar, AvatarImage, AvatarFallback} from "@/components/ui/avatar"
import {Textarea} from "@/components/ui/textarea"
import {Button} from "@/components/ui/button"
import {Loader2, SendIcon} from "lucide-react"
import {useEffect, useState} from "react"
import {Skeleton} from "../ui/skeleton";

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT!

type Message = {
    author: string
    content: string
}

const INITIAL_MESSAGES: Message[] = [
    {author: 'AI', content: 'Hey there! How\'s it going?'},
]

export default function Room() {
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)

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
            const isQueryData = lastMessage.content.startsWith("/query")
            const url = `${API_ENDPOINT}/${isQueryData ? 'query-data' : 'query'}`
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({prompt: lastMessage.content}),
                signal: AbortSignal.timeout(5000),
            })
            if (response.ok) {
                throw new Error("Cannot get api response")
            }
            return await response.json()
        }
        if (lastMessage.author !== "Me") {
            return
        }
        setLoading(true)
        getAIResponse().then((aiResponse) => {
            if (!aiResponse?.message) {
                setLoading(false)
                return
            }
            setLoading(false)
            // TODO: change response schema
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


    return (
        <div className="flex flex-col h-screen max-w-full mx-auto">
            <div className="flex items-center justify-between p-4 bg-background rounded-t-lg shadow-sm">
                <h1 className="text-lg font-bold text-card-foreground">CSCI3360 Chatroom Demo</h1>
                <Button onClick={() => setMessages(INITIAL_MESSAGES)}>Clear Chat</Button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
                {messages.map((message, index) => (
                    <div key={index} className={`flex items-center gap-4 ${message.author !== 'AI' && 'justify-end'}`}>
                        {message.author === 'AI' ? ( // Show AI avatar on the left
                            <>
                                <Avatar className="w-8 h-8 border">
                                    <AvatarImage src="/placeholder-user.jpg" alt="User Avatar"/>
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
                                    <AvatarImage src="/placeholder-user.jpg" alt="User Avatar"/>
                                    <AvatarFallback>{message.author}</AvatarFallback>
                                </Avatar>
                            </>
                        )
                        }
                    </div>
                ))}
                {
                    loading && (
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-full"/>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]"/>
                                <Skeleton className="h-4 w-[200px]"/>
                            </div>
                        </div>
                    )
                }
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

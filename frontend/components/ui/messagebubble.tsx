import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import VegaChart from "@/components/ui/vegachart";
import React from "react";
import {TopLevelSpec} from "vega-lite";
import {Sparkles} from "lucide-react";

type MessageBubbleProps = {
    author: string
    content?: string
    attachment?: unknown & TopLevelSpec
}
const MessageBubble: React.FC<MessageBubbleProps> = ({author, attachment, content}) => {
    return (
        <div className={`flex items-center gap-4 ${author !== 'AI' && 'justify-end'}`}>
            {author === 'AI' ? ( // Show AI avatar on the left
                <>
                    <Avatar className="w-8 h-8 border">
                        <AvatarImage alt="User Avatar"/>
                        <AvatarFallback>{author}</AvatarFallback>
                    </Avatar>
                    <div className="message-ai-content flex flex-col space-y-4 border p-4 max-w-[70%] rounded-lg">
                        {
                            content && (
                                <div className="bg-card">
                                    <p className="text-sm text-card-foreground">{content}</p>
                                </div>
                            )
                        }
                        {attachment && (
                            <VegaChart spec={attachment}/>
                        )}
                    </div>
                </>
            ) : ( // Show user avatar on the right
                <>
                    <div className="bg-card rounded-lg p-3 max-w-[70%] border transition-opacity ease-in-out delay-150 duration-300">
                        <p className={`text-sm text-card-foreground ${
                            content?.includes('/query') && 'text-primary font-bold'
                        }`}>
                            {content?.includes('/query') && <Sparkles className="inline-block"/>}
                            {content?.replace('/query', '')}
                        </p>
                    </div>
                    <Avatar className="w-8 h-8 border">
                        <AvatarImage alt="User Avatar"/>
                        <AvatarFallback>{author}</AvatarFallback>
                    </Avatar>
                </>)
            }
        </div>
    )
}
export default MessageBubble
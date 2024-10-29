import Room from "@/components/chatroom/room";
import {API_ENDPOINT} from "@/app/constants";

async function getCurrentData() {
    const response = await fetch(`${API_ENDPOINT}/current-data`, {
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    })
    if (!response.ok) {
        console.error('no current data')
        return new Array([])
    }
    return await response.json()
}

export default async function Home() {
    const currentData = await getCurrentData()
    return (
        <div className="px-8 w-full">
            <Room contextData={currentData}/>
        </div>
    );
}

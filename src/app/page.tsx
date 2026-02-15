import XMBInterface from '@/components/xmb/XMBInterface'
import { getXMBData } from '@/lib/xmb-data'

export default async function Home() {
    const categories = await getXMBData()
    return (
        <div className="relative w-full h-full">
            <XMBInterface categories={categories} />
        </div>
    )
}

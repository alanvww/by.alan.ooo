import LayoutWrapper from '@/components/LayoutWrapper'
import XMBInterface from '@/components/xmb/XMBInterface'
import { getXMBData } from '@/lib/xmb-data'

export default async function Home() {
    const categories = await getXMBData()
    return (
        <LayoutWrapper>
            <div className="relative w-full h-full">
                <h1 className="sr-only">alan.ooo — Alan Yam, frontend design engineer</h1>
                <XMBInterface categories={categories} />
            </div>
        </LayoutWrapper>
    )
}

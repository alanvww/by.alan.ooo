'use client'

import { useRef, useEffect, ReactNode, useState } from 'react'
import { animate } from 'motion/react'
import { cn } from '@/lib/utils'

type AnimatedSectionProps = {
    children: ReactNode
    className?: string
    delay?: number
    distanceY?: number
    direction?: 'up' | 'down' | 'left' | 'right'
    threshold?: number
}

export default function AnimatedSection({
    children,
    className,
    delay = 0,
    distanceY = 20,
    direction = 'up',
    threshold = 0.1
}: AnimatedSectionProps) {
    const sectionRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!sectionRef.current || !mounted) return

        // Create an IntersectionObserver to detect when the element is in view
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Calculate animation properties based on direction
                        const animationProps: any = { opacity: [0, 1] }
                        
                        switch (direction) {
                            case 'up':
                                animationProps.y = [distanceY, 0]
                                break
                            case 'down':
                                animationProps.y = [-distanceY, 0]
                                break
                            case 'left':
                                animationProps.x = [distanceY, 0]
                                break
                            case 'right':
                                animationProps.x = [-distanceY, 0]
                                break
                        }
                        
                        // Animate the element
                        animate(
                            entry.target as any,
                            {
                                ...animationProps,
                                duration: 0.6,
                                delay,
                                easing: [0.22, 1, 0.36, 1]
                            } as any
                        )
                        
                        // Disconnect the observer after animation starts
                        observer.disconnect()
                    }
                })
            },
            { threshold }
        )
        
        // Start observing the element
        observer.observe(sectionRef.current)

        // Clean up the observer on unmount
        return () => {
            observer.disconnect()
        }
    }, [delay, direction, distanceY, threshold, mounted])

    return (
        <div
            ref={sectionRef}
            className={cn(mounted ? 'opacity-0' : '', className)}
            style={{ willChange: 'transform, opacity' }}
        >
            {children}
        </div>
    )
}

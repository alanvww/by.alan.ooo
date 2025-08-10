'use client'

import { useRef, useEffect, ReactNode, Children, isValidElement, cloneElement } from 'react'
import { animate, stagger } from 'motion/react'
import { cn } from '@/lib/utils'

type StaggeredListProps = {
    children: ReactNode
    className?: string
    itemClassName?: string
    staggerDelay?: number
    duration?: number
    threshold?: number
}

export default function StaggeredList({
    children,
    className,
    itemClassName,
    staggerDelay = 0.1,
    duration = 0.5,
    threshold = 0.1
}: StaggeredListProps) {
    const listRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!listRef.current) return

        // Create an IntersectionObserver to detect when the element is in view
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const childElements = Array.from(entry.target.children)

                        // Animate all child elements with staggered delay
                        animate(
                            childElements as any,
                            {
                                opacity: [0, 1],
                                y: [20, 0]
                            } as any,
                            {
                                delay: stagger(staggerDelay),
                                duration,
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
        observer.observe(listRef.current)

        // Clean up the observer on unmount
        return () => {
            observer.disconnect()
        }
    }, [duration, staggerDelay, threshold])

    // Clone children to add opacity-0 className
    const enhancedChildren = Children.map(children, child => {
        if (isValidElement(child)) {
            return cloneElement(child as React.ReactElement<any>, {
                className: cn('opacity-0', itemClassName, (child as any).props.className)
            })
        }
        return child
    })

    return (
        <div
            ref={listRef}
            className={className}
        >
            {enhancedChildren}
        </div>
    )
}

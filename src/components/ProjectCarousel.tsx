'use client'

import { useRef, useState, useEffect } from 'react'
import ProjectCard from './ProjectCard'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'

type ProjectCarouselProps = {
  projects: {
    title: string
    description: string
    image: string
    link: string
    tags: string[]
    featured?: boolean
  }[]
}

export default function ProjectCarousel({ projects }: ProjectCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScrollButtons = () => {
    if (!carouselRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10) // 10px buffer
  }

  useEffect(() => {
    const carousel = carouselRef.current
    if (carousel) {
      carousel.addEventListener('scroll', checkScrollButtons)
      // Initial check
      checkScrollButtons()

      return () => {
        carousel.removeEventListener('scroll', checkScrollButtons)
      }
    }
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return

    const carousel = carouselRef.current
    const cardWidth = carousel.querySelector('div')?.clientWidth || 0
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth

    carousel.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    })
  }

  return (
    <div className="relative">
      {/* Carousel Navigation */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 glass-effect rounded-full p-3 transition-all hover:scale-110"
          aria-label="Scroll left"
        >
          <CaretLeft size={20} />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 glass-effect rounded-full p-3 transition-all hover:scale-110"
          aria-label="Scroll right"
        >
          <CaretRight size={20} />
        </button>
      )}

      {/* Carousel Container */}
      <div
        ref={carouselRef}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-6 px-6"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {projects.map((project) => (
          <div
            key={project.title}
            className="min-w-[320px] md:min-w-[380px] flex-shrink-0 snap-start"
          >
            <ProjectCard
              title={project.title}
              description={project.description}
              image={project.image}
              link={project.link}
              tags={project.tags}
              featured={project.featured}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// CSS for hiding scrollbar
const scrollbarHideStyles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`

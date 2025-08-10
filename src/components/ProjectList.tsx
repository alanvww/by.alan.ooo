'use client'

import ProjectCard from './ProjectCard'
import { cn } from '@/lib/utils'

interface Project {
    title: string
    description: string
    image: string
    link: string
    tags: string[]
    featured?: boolean
}

interface ProjectListProps {
    projects: Project[]
    className?: string
    showFeatured?: boolean
}

export default function ProjectList({ projects, className, showFeatured = false }: ProjectListProps) {
    if (!projects || projects.length === 0) {
        return (
            <div className={cn("text-center py-12", className)}>
                <p className="text-muted-foreground text-lg">No projects found.</p>
            </div>
        )
    }

    // Filter featured projects if requested
    const filteredProjects = showFeatured 
        ? projects.filter(project => project.featured)
        : projects

    return (
        <div className={cn("space-y-8", className)}>
            {showFeatured && (
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold text-foreground">Featured Projects</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        A selection of my most impactful and innovative work, showcasing the range of 
                        technologies and design approaches I bring to every project.
                    </p>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project, index) => (
                    <ProjectCard
                        key={project.title}
                        title={project.title}
                        description={project.description}
                        image={project.image}
                        link={project.link}
                        tags={project.tags}
                        featured={project.featured}
                    />
                ))}
            </div>
        </div>
    )
}

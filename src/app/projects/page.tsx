import { getAllProjects } from '@/lib/mdx'
import ProjectCard from '@/components/ProjectCard'

export const metadata = {
    title: 'Projects',
    description: 'Explore my portfolio of projects spanning web development, design, and creative coding.',
}

export default async function ProjectsPage() {
    const projects = await getAllProjects()
    
    // Debug: Log all project slugs
    console.log("Project slugs:", projects.map(p => p.slug))

    return (
        <div className="px-4 py-10">
            <div className="mx-auto max-w-3xl">
                <h1 className="text-2xl font-semibold mb-2">Projects</h1>
                <p className="text-sm text-muted-foreground mb-8">Explore my portfolio of projects spanning web development, design, and creative coding.</p>
                {projects.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2">
                        {projects.map((project) => (
                            <ProjectCard
                                key={project.slug}
                                title={project.title}
                                description={project.excerpt || ''}
                                image={project.coverImage || '/assets/projects/placeholder.png'}
                                link={`/projects/${project.slug}`}
                                tags={project.tags || []}
                                featured={project.featured}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">
                            No projects found. Check back soon!
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

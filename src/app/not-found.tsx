import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center">
            <div className="text-center max-w-lg">
                <h1 className="text-6xl font-bold mb-6">404</h1>
                <h2 className="text-2xl font-medium mb-8">Page Not Found</h2>
                <p className="text-muted-foreground mb-8">
                    Sorry, the page you are looking for doesn't exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                >
                    Return Home
                </Link>
            </div>
        </div>
    )
}
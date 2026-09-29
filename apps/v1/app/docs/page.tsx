import Link from 'next/link'

const sections = [
    {
        title: 'Getting Started',
        description: 'Learn what Phestus is, how it works, and how to get your first project running.',
        href: '/docs/getting-started/introduction',
    },
    {
        title: 'Modules',
        description: 'Explore the capabilities that make up the Phestus platform and learn how to build your own.',
        href: '/docs/modules/introduction',
    },
    {
        title: 'Providers',
        description: 'Connect modules to concrete implementations such as queues, databases, and external services.',
        href: '/docs/providers/introduction',
    },
    {
        title: 'Plugins',
        description: 'Package and distribute modules, providers, and functionality as reusable Phestus plugins.',
        href: '/docs/plugins/introduction',
    },
    {
        title: 'Services',
        description: 'Explore how Phestus lets you build off of exisiting frameworks and services such as other CMSs, ORMs, and more.',
        href: '/',
    },
    {
        title: 'API',
        description: 'Understand how to build, manage, and protect API routes using Phestus.',
        href: '/docs/api/introduction',
    },
    {
        title: 'Middleware',
        description: 'Explore how Phestus enables you to protect and extend logic ontop of your API endpoints.',
        href: '/docs/middleware/introduction',
    },
    {
        title: 'Auth',
        description: 'learn how Phestus helps you defend your services through custom implementation and security methods.',
        href: '/docs/auth/introduction',
    },
    {
        title: 'Workflows & Jobs',
        description: 'Figure out how to build custom workflows for your project fit with jobs, steps, and event triggers.',
        href: '/docs/workflows-jobs/introduction',
    },
    {
        title: 'Cron',
        description: 'Learn how to schedule tasks, manage long running workflows, and more through the native Cron Module.',
        href: '/docs/cron/introduction',
    },
    {
        title: 'Workers',
        description: 'Explore how Phestus handles scaling through our powerful and dynamic worker architecture.',
        href: '/docs/workers/introduction',
    },
    {
        title: 'Cache',
        description: 'Learn how to use the built in caching module, and extend it to suit your needs',
        href: '/docs/cache/introduction',
    },
    {
        title: 'Concepts',
        description: 'Explore core Phestus concepts.',
        href: '/docs/concepts/internal-communication',
    },
    {
        title: 'Guides',
        description: 'Learn by following along with custom built guides.',
        href: '/docs/guides/making-service-adapter',
    },
]

export default function DocsPage() {
    return (
        <main className="min-h-[calc(100vh-72px)] bg-[var(--theme-elevation-0)]">
            <section className="mx-auto w-[min(100%-40px,1200px)] py-24 max-[640px]:w-[calc(100%-28px)] max-[640px]:py-16">
                <div className="max-w-[680px]">
                    <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--theme-accent-600)]">
                        Documentation
                    </p>

                    <h1 className="m-0 font-[var(--font-body)] text-[clamp(36px,5vw,56px)] font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--theme-elevation-950)]">
                        Build with Phestus.
                    </h1>

                    <p className="mt-5 max-w-[600px] text-[16px] leading-[1.7] text-[var(--theme-elevation-600)]">
                        Explore the platform, learn how its pieces fit
                        together, and start building your own modular
                        applications with Phestus.
                    </p>
                </div>

                <div className="mt-16 grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[640px]:mt-12 max-[640px]:grid-cols-1">
                    {sections.map((section, index) => (
                        <Link
                            key={section.href}
                            href={section.href}
                            className="group flex min-h-[190px] flex-col justify-between rounded-[var(--style-radius-m)] border border-[var(--theme-elevation-150)] bg-[var(--theme-elevation-0)] p-6 no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--theme-accent-200)] hover:bg-[var(--theme-accent-50)]"
                        >
                            <div>
                                <span className="text-[11px] font-medium tracking-[0.06em] text-[var(--theme-elevation-400)]">
                                    0{index + 1}
                                </span>

                                <h2 className="mt-5 mb-0 font-[var(--font-body)] text-[18px] font-semibold tracking-[-0.02em] text-[var(--theme-elevation-900)] transition-colors duration-200 group-hover:text-[var(--theme-accent-700)]">
                                    {section.title}
                                </h2>

                                <p className="mt-2 mb-0 text-[13px] leading-[1.6] text-[var(--theme-elevation-550)]">
                                    {section.description}
                                </p>
                            </div>

                            <div className="mt-6 flex items-center gap-2 text-[12px] font-medium text-[var(--theme-elevation-600)] transition-colors duration-200 group-hover:text-[var(--theme-accent-600)] hover:underline">
                                Explore
                                <svg
                                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    aria-hidden="true"
                                >
                                    <path d="M3 8h9" />
                                    <path d="m8 4 4 4-4 4" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    )
}
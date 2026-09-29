const ecosystem = [
    {
        number: '01',
        title: 'Modules',
        description: 'Define capabilities that Phestus applications can use.',
        example: 'Events, queues, jobs, workflows, and so much more',
    },
    {
        number: '02',
        title: 'Providers',
        description: 'Implement module capabilities using a specific backend or technology.',
        example: 'Redis, BullMQ, Stripe, ORMs, PayloadCMS',
    },
    {
        number: '03',
        title: 'Plugins',
        description: 'Package and distribute functionality, providers, dependencies, and configuration.',
        example: 'Installable extensions for your stack',
    },
    {
        number: '04',
        title: 'Service Adapters',
        description: 'Connect Phestus to the underlying services that power your application.',
        example: 'Payload, Sanity, PostgreSQL, and more',
    },
]

export default function Ecosystem() {
    return (
        <section className="border-b border-[var(--theme-elevation-150)]">
            <div className="mx-auto max-w-6xl px-6 py-20">
                <div className="max-w-2xl">
                    <p className="text-sm font-medium text-[var(--theme-accent-600)]">
                        The ecosystem
                    </p>

                    <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--theme-elevation-900)]">
                        Build with the pieces you need.
                    </h2>

                    <p className="mt-4 text-[var(--theme-elevation-600)]">
                        Phestus separates capabilities from their
                        implementations, making your stack easier to extend
                        and replace.
                    </p>
                </div>

                <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--style-radius-m)] border border-[var(--theme-elevation-200)] bg-[var(--theme-elevation-200)] md:grid-cols-2">
                    {ecosystem.map((item) => (
                        <div
                            key={item.title}
                            className="bg-[var(--theme-elevation-0)] p-7"
                        >
                            <div className="flex items-start justify-between">
                                <span className="text-sm font-medium text-[var(--theme-accent-600)]">
                                    {item.number}
                                </span>

                                <span className="rounded-full bg-[var(--theme-elevation-50)] px-2.5 py-1 text-xs text-[var(--theme-elevation-600)]">
                                    {item.title}
                                </span>
                            </div>

                            <h3 className="mt-8 text-xl font-semibold tracking-[-0.02em] text-[var(--theme-elevation-900)]">
                                {item.title}
                            </h3>

                            <p className="mt-3 text-sm leading-6 text-[var(--theme-elevation-600)]">
                                {item.description}
                            </p>

                            <p className="mt-5 font-mono text-xs text-[var(--theme-elevation-500)]">
                                {item.example}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

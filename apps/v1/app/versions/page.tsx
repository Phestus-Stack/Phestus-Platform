'use client'

import { useMemo, useState } from 'react'

type PackageStatus = 'stable' | 'development' | 'deprecated'

type PackageEntry = {
    name: string
    description: string
    version: string
    status: PackageStatus
    category: string
    recommended?: boolean
    compatibility?: string
}

type PackageGroup = {
    title: string
    description: string
    packages: PackageEntry[]
}


const packageGroups: PackageGroup[] = [
    {
        title: 'Foundation',
        description: 'The core underlying packages that power then entire system.',
        packages: [
            {
                name: '@phestus/sdk',
                description: 'Provides the core typing for the Phestus platform.',
                version: '0.1.0',
                status: 'stable',
                category: 'Foundation',
                compatibility: 'N/A',
            },
            {
                name: '@phestus/core',
                description: 'Manages the dependency, lifecycle, state, and systems for Phestus',
                version: '0.1.0',
                status: 'stable',
                category: 'Foundation',
                compatibility: 'Phestus SDK',
            },
        ],
    },
    {
        title: 'Modules',
        description: 'Core capabilities that applications can compose to build their backend.',
        packages: [
            {
                name: '@phestus/event-module',
                description: 'Provides an event bus for publishing and subscribing to application events.',
                version: '0.1.0',
                status: 'stable',
                category: 'Events',
                compatibility: 'Phestus SDK',
            },
            {
                name: '@phestus/queue-module',
                description: 'Defines queue capabilities for processing asynchronous work.',
                version: '0.1.0',
                status: 'stable',
                category: 'Queues',
                compatibility: 'Phestus SDK',
            },
            {
                name: '@phestus/job-module',
                description: 'Provides a foundation for defining and executing background jobs.',
                version: '0.1.0',
                status: 'stable',
                category: 'Jobs',
                compatibility: 'Phestus SDK',
            },
            {
                name: '@phestus/cron-module',
                description: 'Provides a foundation for defining and executing scheduled background jobs.',
                version: '0.1.0',
                status: 'stable',
                category: 'Scheduling',
                compatibility: 'Phestus SDK',
            },
            {
                name: '@phestus/cache-module',
                description: 'Allows developers to implement caching natively.',
                version: '0.1.0',
                status: 'stable',
                category: 'Caching',
                compatibility: 'Phestus SDK',
            },
            {
                name: '@phestus/workflow-module',
                description: 'Connects events, jobs, and queues into reusable workflows.',
                version: '0.1.0',
                status: 'stable',
                category: 'Workflows',
                compatibility: 'Phestus SDK',
            },
            {
                name: '@phestus/auth-module',
                description: 'Provides authentication and access control capabilities for applications.',
                version: '0.1.0',
                status: 'stable',
                category: 'Security',
                compatibility: 'Phestus SDK',
            },
            {
                name: '@phestus/middleware-module',
                description: 'Allows developers to build dynamic middleware tailored to their applications.',
                version: '0.1.0',
                status: 'stable',
                category: 'Middleware',
                compatibility: 'Phestus SDK',
            },
            {
                name: '@phestus/api-module',
                description: 'Provides tools to define, manage, and handle API interfaces.',
                version: '0.1.0',
                status: 'stable',
                category: 'API',
                compatibility: 'Phestus SDK',
            },
            {
                name: '@phestus/api-client-module',
                description: 'Provides typed client-side tooling for interacting with the API module.',
                version: '0.1.0',
                status: 'stable',
                category: 'API',
                compatibility: '@phestus/api-module',
            },
            {
                name: '@phestus/worker-module',
                description: 'Enables distributed backend workloads, server management, and load balancing.',
                version: '0.1.0',
                status: 'stable',
                category: 'Workers',
                compatibility: 'Phestus SDK',
            },
        ],
    },
    {
        title: 'Providers',
        description: 'Implementations that connect Phestus modules to specific technologies.',
        packages: [
            {
                name: '@phestus/bullmq',
                description: 'A BullMQ-backed implementation of the Phestus Queue module.',
                version: '0.1.0',
                status: 'stable',
                category: 'Queue Provider',
                compatibility: '@phestus/queue-module',
            },
            {
                name: '@phestus/express-api',
                description: 'An Express.js API provider for deploying APIs defined with the Phestus API module.',
                version: '0.1.0',
                status: 'stable',
                category: 'API Provider',
                compatibility: '@phestus/api-module',
            },
        ],
    },
    {
        title: 'Service Adapters',
        description: 'Adapters for integrating application services with different implementations.',
        packages: [
            {
                name: 'in-memory',
                description: 'An in-memory service adapter for convenient testing and fast implementation.',
                version: '0.1.0',
                status: 'stable',
                category: 'Service Adapter',
                compatibility: 'Phestus service interface',
            },
        ],
    },
]

const statusConfig: Record<
    PackageStatus,
    { label: string; dot: string; badge: string }
> = {
    stable: {
        label: 'Stable',
        dot: 'bg-emerald-500',
        badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    development: {
        label: 'In development',
        dot: 'bg-amber-500',
        badge: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    deprecated: {
        label: 'Deprecated',
        dot: 'bg-red-500',
        badge: 'border-red-200 bg-red-50 text-red-700',
    },
}

function PackageCard({ item }: { item: PackageEntry }) {
    const status = statusConfig[item.status]
    const [copied, setCopied] = useState(false)

    async function copyVersion() {
        try {
            await navigator.clipboard.writeText(item.version)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
        } catch {
            // Clipboard access may be unavailable in insecure contexts.
            setCopied(false)
        }
    }

    return (
        <article className="relative pl-10">
            <span
                className={`absolute left-0 top-6 z-10 h-3 w-3
                    -translate-x-1/2 rounded-full border-2
                    border-[var(--theme-elevation-0)] ${status.dot}`}
            />

            <div className="rounded-[var(--style-radius-m)]
                border border-[var(--theme-elevation-150)]
                bg-[var(--theme-elevation-0)] p-5
                shadow-[0_1px_2px_rgba(15,35,65,0.04)]
                transition-colors hover:border-[var(--theme-elevation-250)]">

                <div className="flex flex-col gap-4 sm:flex-row
                    sm:items-start sm:justify-between">

                    <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="font-mono text-sm font-semibold
                                tracking-tight text-[var(--theme-elevation-900)]">
                                {item.name}
                            </h3>

                            <span className="rounded-[var(--style-radius-s)]
                                bg-[var(--theme-elevation-50)] px-2 py-0.5
                                text-[11px] font-medium
                                text-[var(--theme-elevation-600)]">
                                {item.category}
                            </span>
                        </div>

                        <p className="max-w-2xl text-sm leading-6
                            text-[var(--theme-elevation-600)]">
                            {item.description}
                        </p>

                        {item.compatibility && (
                            <p className="mt-3 text-xs
                                text-[var(--theme-elevation-500)]">
                                Compatible with:{' '}
                                <code>{item.compatibility}</code>
                            </p>
                        )}
                    </div>

                    <div className="flex shrink-0 flex-row flex-wrap
                        items-center gap-2 sm:flex-col sm:items-end">

                        <span className={`rounded-full border px-2.5 py-1
                            text-[11px] font-medium ${status.badge}`}>
                            {status.label}
                        </span>

                        {item.recommended && (
                            <span className="text-xs font-medium
                                text-[var(--theme-accent-600)]">
                                Recommended
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center
                    justify-between gap-3 border-t
                    border-[var(--theme-elevation-100)] pt-4">

                    <span className="text-xs font-medium
                        text-[var(--theme-elevation-500)]">
                        Internal version
                    </span>

                    <button
                        type="button"
                        onClick={copyVersion}
                        title="Copy internal version"
                        aria-label={`Copy version ${item.version} for ${item.name}`}
                        className="inline-flex items-center gap-2 rounded-md
                            border border-[var(--theme-elevation-200)]
                            px-3 py-1.5 font-mono text-xs
                            text-[var(--theme-elevation-800)]
                            transition-colors hover:bg-[var(--theme-elevation-50)]"
                    >
                        {item.version}
                        <span className="font-sans">
                            {copied ? 'Copied!' : 'Copy'}
                        </span>
                    </button>
                </div>
            </div>
        </article>
    )
}

export default function PackageVersions() {
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')
    const [status, setStatus] = useState('All')

    const categories = useMemo(
        () => [
            'All',
            ...new Set(
                packageGroups.flatMap((group) =>
                    group.packages.map((item) => item.category),
                ),
            ),
        ],
        [],
    )

    const filteredGroups = useMemo(() => {
        const query = search.trim().toLowerCase()

        return packageGroups
            .map((group) => ({
                ...group,
                packages: group.packages.filter((item) => {
                    const matchesSearch =
                        !query ||
                        [
                            item.name,
                            item.description,
                            item.category,
                            item.version,
                            item.compatibility ?? '',
                        ].some((value) =>
                            value.toLowerCase().includes(query),
                        )

                    const matchesCategory =
                        category === 'All' || item.category === category

                    const matchesStatus =
                        status === 'All' || item.status === status

                    return (
                        matchesSearch &&
                        matchesCategory &&
                        matchesStatus
                    )
                }),
            }))
            .filter((group) => group.packages.length > 0)
    }, [search, category, status])

    const total = packageGroups.reduce(
        (count, group) => count + group.packages.length,
        0,
    )

    const stableCount = packageGroups.reduce(
        (count, group) =>
            count +
            group.packages.filter((item) => item.status === 'stable').length,
        0,
    )

    const developmentCount = packageGroups.reduce(
        (count, group) =>
            count +
            group.packages.filter(
                (item) => item.status === 'development',
            ).length,
        0,
    )

    return (
        <main className="min-h-screen bg-[var(--theme-elevation-0)]">
            <section className="mx-auto max-w-5xl px-6 pb-24
                pt-20 lg:px-8 lg:pt-28">

                <header className="max-w-2xl">
                    <div className="mb-5 text-xs font-semibold
                        uppercase tracking-[0.12em]
                        text-[var(--theme-accent-600)]">
                        Developer Resources
                    </div>

                    <h1 className="text-4xl font-semibold tracking-[-0.035em]
                        text-[var(--theme-elevation-900)] sm:text-5xl">
                        Package versions.
                    </h1>

                    <p className="mt-5 text-base leading-7
                        text-[var(--theme-elevation-600)] sm:text-lg">
                        Find the correct internal version for every package
                        in the Phestus ecosystem, including compatibility
                        requirements and recommended versions.
                    </p>
                </header>

                <div className="mt-10 grid grid-cols-1 gap-3
                    sm:grid-cols-3">
                    {[
                        { label: 'Total packages', value: total },
                        { label: 'Stable', value: stableCount },
                        { label: 'In development', value: developmentCount },
                    ].map((stat) => (
                        <div key={stat.label} className="rounded-lg border
                            border-[var(--theme-elevation-150)] p-4">
                            <p className="text-xs font-medium
                                text-[var(--theme-elevation-500)]">
                                {stat.label}
                            </p>
                            <p className="mt-2 text-2xl font-semibold
                                tracking-tight tabular-nums
                                text-[var(--theme-elevation-900)]">
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex flex-col gap-4
                    border-y border-[var(--theme-elevation-150)] py-5">

                    <label className="relative block">
                        <span className="sr-only">Search packages</span>
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by package, version, or capability..."
                            className="w-full rounded-lg border
                                border-[var(--theme-elevation-200)]
                                bg-transparent px-4 py-3 text-sm
                                text-[var(--theme-elevation-900)]
                                outline-none transition-colors
                                placeholder:text-[var(--theme-elevation-400)]
                                focus:border-[var(--theme-accent-500)]"
                        />
                    </label>

                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-xs
                            text-[var(--theme-elevation-500)]">
                            Category
                            <select
                                value={category}
                                onChange={(event) =>
                                    setCategory(event.target.value)
                                }
                                className="rounded-md border
                                    border-[var(--theme-elevation-200)]
                                    bg-[var(--theme-elevation-0)]
                                    px-3 py-2 text-xs
                                    text-[var(--theme-elevation-800)]"
                            >
                                {categories.map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="flex items-center gap-2 text-xs
                            text-[var(--theme-elevation-500)]">
                            Status
                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                                className="rounded-md border
                                    border-[var(--theme-elevation-200)]
                                    bg-[var(--theme-elevation-0)]
                                    px-3 py-2 text-xs
                                    text-[var(--theme-elevation-800)]"
                            >
                                <option value="All">All statuses</option>
                                <option value="stable">Stable</option>
                                <option value="development">
                                    In development
                                </option>
                                <option value="deprecated">Deprecated</option>
                            </select>
                        </label>

                        {(search || category !== 'All' || status !== 'All') && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('')
                                    setCategory('All')
                                    setStatus('All')
                                }}
                                className="text-xs font-medium
                                    text-[var(--theme-accent-600)]
                                    hover:underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-12">
                    {filteredGroups.length === 0 ? (
                        <div className="rounded-lg border
                            border-[var(--theme-elevation-150)]
                            px-6 py-12 text-center">
                            <h2 className="font-semibold
                                text-[var(--theme-elevation-800)]">
                                No packages found
                            </h2>
                            <p className="mt-2 text-sm
                                text-[var(--theme-elevation-500)]">
                                Try another search term or clear your filters.
                            </p>
                        </div>
                    ) : (
                        filteredGroups.map((group, index) => (
                            <section
                                key={group.title}
                                className="relative pb-14 last:pb-0"
                            >
                                <div className="mb-7">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium
                                            tabular-nums
                                            text-[var(--theme-elevation-400)]">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <h2 className="text-xl font-semibold
                                            tracking-[-0.02em]
                                            text-[var(--theme-elevation-800)]">
                                            {group.title}
                                        </h2>
                                        <span className="rounded-full
                                            bg-[var(--theme-elevation-50)]
                                            px-2 py-0.5 text-[11px]
                                            font-medium
                                            text-[var(--theme-elevation-500)]">
                                            {group.packages.length}
                                        </span>
                                    </div>

                                    <p className="mt-2 max-w-2xl pl-9
                                        text-sm leading-6
                                        text-[var(--theme-elevation-500)]">
                                        {group.description}
                                    </p>
                                </div>

                                <div className="relative ml-4 space-y-4
                                    border-l border-[var(--theme-elevation-200)]">
                                    {group.packages.map((item) => (
                                        <PackageCard
                                            key={item.name}
                                            item={item}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))
                    )}
                </div>

                <footer className="mt-16 border-t
                    border-[var(--theme-elevation-150)] pt-6">
                    <p className="text-sm leading-6
                        text-[var(--theme-elevation-500)]">
                        Always check package compatibility before upgrading.
                        Internal versions are maintained by the Phestus
                        team and should be treated as the source of truth
                        for internal development.
                    </p>
                </footer>
            </section>
        </main>
    )
}

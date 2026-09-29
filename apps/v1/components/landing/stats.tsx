const stats = [
    {
        value: '11',
        label: 'Core modules',
    },
    {
        value: '2',
        label: 'Core providers',
    },
    {
        value: '∞',
        label: 'Combinations',
    },
    {
        value: '100%',
        label: 'Customizable',
    },
]

export default function Stats() {
    return (
        <section className="border-b border-[var(--theme-elevation-150)]">
            <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-[var(--theme-elevation-150)] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                {stats.map((stat) => (
                    <div key={stat.label} className="px-6 py-10">
                        <div className="text-3xl font-semibold tracking-[-0.03em] text-[var(--theme-elevation-900)]">
                            {stat.value}
                        </div>

                        <div className="mt-1 text-sm text-[var(--theme-elevation-600)]">
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
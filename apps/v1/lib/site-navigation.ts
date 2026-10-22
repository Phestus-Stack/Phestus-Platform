export type NavigationItem = {
    label: string
    href: string
    position?: 'left' | 'center' | 'right'
    order?: number
}

export type FooterColumn = {
    title: string
    links: {
        label: string
        href: string
    }[]
}

export type SiteNavigation = {
    header: {
        logo: {
            label: string
            href: string
        }
        navigation: NavigationItem[]
    }

    footer: {
        description: string
        contact?: {
            email?: string
            phone?: string
        }
        columns: FooterColumn[]
        copyright: string
    }
}

export const siteNavigation: SiteNavigation = {
    header: {
        logo: {
            label: 'Phestus',
            href: '/',
        },
        navigation: [
            {
                label: 'Features',
                href: '/features',
                position: 'center',
                order: 1,
            },
            {
                label: 'Ecosystem',
                href: '/ecosystem',
                position: 'center',
                order: 2,
            },
            {
                label: 'Community',
                href: '/community',
                position: 'center',
                order: 3,
            },
            {
                label: 'Roadmap',
                href: '/roadmap',
                position: 'center',
                order: 4,
            },
            {
                label: 'Docs',
                href: '/docs',
                position: 'center',
                order: 5,
            },
            {
                label: 'Versions',
                href: '/versions',
                position: 'center',
                order: 6,
            },
            {
                label: 'GitHub',
                href: 'https://github.com/Tech-Know2/Phestus-Platform',
                position: 'right',
                order: 1,
            },
        ],
    },
    footer: {
        description: 'A custom and modular web stack built for a new wave of software development.',
        contact: {
            email: 'https://cooperharris.vercel.app/',
        },
        columns: [
            {
                title: 'Platform',
                links: [
                    {
                        label: 'Features',
                        href: '/features',
                    },
                    {
                        label: 'Ecosystem',
                        href: '/ecosystem',
                    },
                    {
                        label: 'Roadmap',
                        href: '/roadmap',
                    },
                    {
                        label: 'Documentation',
                        href: '/docs',
                    },
                    {
                        label: 'Versions',
                        href: '/versions',
                    },
                ],
            },
            {
                title: 'Resources',
                links: [
                    {
                        label: 'Getting Started',
                        href: '/docs/getting-started/introduction',
                    },
                    {
                        label: 'Modules',
                        href: '/docs/modules/introduction',
                    },
                    {
                        label: 'Plugins',
                        href: '/docs/plugins/introduction',
                    },
                    {
                        label: 'Providers',
                        href: '/docs/providers/introduction',
                    },
                ],
            },
            {
                title: 'Community',
                links: [
                    {
                        label: 'Community',
                        href: '/community',
                    },
                    {
                        label: 'GitHub',
                        href: 'https://github.com/Tech-Know2/Phestus-Platform',
                    },
                    {
                        label: 'Contact',
                        href: 'https://cooperharris.vercel.app/',
                    },
                ],
            },
        ],
        copyright: '© 2026 Phestus. All rights reserved.',
    },
}
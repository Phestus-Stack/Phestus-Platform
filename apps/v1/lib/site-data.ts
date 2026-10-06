export type AnnouncementType =
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'maintenance'
    | 'bug'

export const announcementData = {
    enabled: true,
    type: 'info' as AnnouncementType,
    message: 'Phestus v0.1 is just weeks away from being released! Explore the latest modules and documentation.',
    link: {
        label: 'Learn more',
        href: '/docs',
    },
}

export const ecosystemData = {
    hero: {
        eyebrow: 'Ecosystem',
        title: 'Build with the Phestus ecosystem.',
        description:
            'Phestus is designed around modular capabilities, interchangeable providers, and service adapters that let you build the stack your project needs.',
    },
    modules: [
        {
            name: 'Event',
            slug: '@phestus/event-module',
            description: 'Provides an event bus for publishing and subscribing to application events.',
        },
        {
            name: 'Queue',
            slug: '@phestus/queue-module',
            description: 'Defines queue capabilities for processing asynchronous work.',
        },
        {
            name: 'Job',
            slug: '@phestus/job-module',
            description: 'Provides a foundation for defining and executing background jobs.',
        },
        {
            name: 'Cron',
            slug: '@phestus/cron-module',
            description: 'Provides a foundation for defining and executing background jobs.',
        },
        {
            name: 'Cache',
            slug: '@phestus/cache-module',
            description: 'Allows developers to implement caching natively.'
        },
        {
            name: 'Workflow',
            slug: '@phestus/workflow-module',
            description: 'Connects events, jobs, and queues into reusable workflows.',
        },
        {
            name: 'Auth',
            slug: '@phestus/auth-module',
            description: 'Provides auth and access control capabilities for applications.',
        },
        {
            name: 'Middleware',
            slug: '@phestus/middleware-module',
            description: 'Allows you to build dynamic and powerful middleware custom suited for your application and needs.',
        },
        {
            name: 'API',
            slug: '@phestus/api-module',
            description: 'Provides the ability to define, manage, and curate the creation of an API interface and handler.'
        },
        {
            name: 'API Client',
            slug: '@phestus/api-client-module',
            description: 'Provides developers the ability to interact with the API Module from the client side using custom typed tooling.'
        },
        {
            name: 'Worker',
            slug: '@phestus/worker-module',
            description: 'Enables developers to build a distributed backend, handle servers, and load balancing.'
        },
    ],
    providers: [
        {
            name: 'BullMQ',
            slug: '@phestus/bullmq',
            module: 'Queue',
            description: 'A BullMQ-backed implementation of the Phestus Queue module.',
        },
        {
            name: 'ExpressJS API',
            slug: '@phestus/express-api',
            module: 'API',
            description: 'A ExpressJS api provider that interprets the Phestus API Module for easy deloyment within ExpressJS.',
        },
    ],
    serviceAdapters: [
        {
            name: 'In Memory',
            slug: 'in-memory',
            description: 'A service adapter that is built for in memory usage which allows for convenient testing and fast implementation',
        },
        {
            name: 'Custom Service',
            slug: 'custom',
            description: 'Build your own service adapter around the systems your application already uses.',
        },
    ],
}

export const communityData = {
    hero: {
        eyebrow: 'Community',
        title: 'Build with us.',
        description: 'Phestus is an evolving open platform. Explore the project, contribute ideas, build integrations, and share what you create.',
    },
    notice: {
        title: 'Built with the assistance of AI',
        description: 'Phestus has been developed with the assistance of artificial intelligence throughout its design, development, documentation, and experimentation. AI is treated as a development tool alongside traditional engineering practices.',
    },
    involvement: [
        {
            title: 'Build',
            description: 'Create modules, providers, plugins, and service adapters that extend the Phestus ecosystem.',
        },
        {
            title: 'Contribute',
            description: 'Help improve the core platform, documentation, examples, and developer experience.',
        },
        {
            title: 'Share',
            description: 'Show the community what you are building with Phestus and share your experience.',
        },
    ],
    projects: [
        /*{
            name: 'Project Alpha',
            description: 'A custom application built around Phestus modules and a Payload CMS service adapter.',
            author: 'Community',
            tags: ['Payload CMS', 'Phestus'],
            href: '#',
        },
        {
            name: 'Project Beta',
            description: 'An event-driven application using Redis events and BullMQ queues.',
            author: 'Community',
            tags: ['Redis', 'BullMQ', 'Events'],
            href: '#',
        },
        {
            name: 'Project Gamma',
            description: 'A custom Phestus service adapter connecting an existing application stack.',
            author: 'Community',
            tags: ['Service Adapter'],
            href: '#',
        },*/
    ],
}

export const featuresData = {
    hero: {
        eyebrow: 'Features',
        title: 'A web stack built around composition.',
        description: 'Phestus gives applications a common runtime and a collection of modular building blocks that can be combined, replaced, and extended.',
    },
    features: [
        {
            title: 'Modular Architecture',
            description: 'Add capabilities through independent modules instead of coupling your application to a single implementation.',
        },
        {
            title: 'Provider System',
            description: 'Swap implementations without changing the module API your application depends on.',
        },
        {
            title: 'Service Adapters',
            description: 'Connect Phestus to Payload CMS, Sanity, or your own application service.',
        },
        {
            title: 'Auth & Middleware',
            description: 'Endlessly dynamic and configurable middleware and auth functionality to protect routes, users, and data.',
        },
        {
            title: 'API',
            description: 'Powerfully typed and dynamic API module that allows for easy route deployment and protection.',
        },
        {
            title: 'Event Driven',
            description: 'Publish and consume events throughout your application using a consistent event bus.',
        },
        {
            title: 'Background Jobs',
            description: 'Move asynchronous work out of your request path with queues and jobs.',
        },
        {
            title: 'Cron Jobs/Tasks',
            description: 'Implement and handle scheudling for complex, long running tasks out of the box.',
        },
        {
            title: 'Workflows',
            description: 'Compose events, jobs, and other capabilities into reusable application workflows.',
        },
        {
            title: 'Plugin Architecture',
            description: 'Package modules and providers together into installable plugins.',
        },
        {
            title: 'Developer First',
            description: 'Keep the core runtime small and give developers control over the technologies behind it.',
        },
        {
            title: 'Endless Scalability',
            description: 'Phestus helps you scale when you want, and how you want. We support everything from a monolithic design to a microservice design.',
        },
    ],
}
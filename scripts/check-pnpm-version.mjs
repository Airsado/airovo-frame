const required = '9.15.4'
const userAgent = process.env.npm_config_user_agent ?? ''
const match = userAgent.match(/(?:^|\s)pnpm\/(\d+\.\d+\.\d+)/)

if (!match || match[1] !== required) {
    const detected = match?.[1] ?? (userAgent.split(' ')[0] || 'unknown package manager')
    console.error(`This workspace requires pnpm ${required}; detected ${detected}.`)
    console.error('Run "corepack enable" and then "corepack prepare pnpm@9.15.4 --activate".')
    process.exit(1)
}

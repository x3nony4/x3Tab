export interface SearchEngine {
    id: string
    name: string
    urlTemplate: string
    color: string
}

export const DEFAULT_ENGINES: SearchEngine[] = [
    { id: 'baidu', name: 'Baidu', urlTemplate: 'https://www.baidu.com/s?wd=%s', color: '#2932e1' },
    { id: 'google', name: 'Google', urlTemplate: 'https://www.google.com/search?q=%s', color: '#4285f4' },
    { id: 'bing', name: 'Bing', urlTemplate: 'https://www.bing.com/search?q=%s', color: '#008373' },
    { id: 'duckduckgo', name: 'DuckDuckGo', urlTemplate: 'https://duckduckgo.com/?q=%s', color: '#de5833' }
]

export function randomEngineColor(): string {
    const h = Math.floor(Math.random() * 360)
    return `hsl(${h}, 45%, 35%)`
}

export function generateEngineId(name: string): string {
    return `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
}

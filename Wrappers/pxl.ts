export interface Options {
    endpoint: string,
    images?: Array<string>,
}
export type EyesType =
    | 'big'
    | 'black'
    | 'bloodshot'
    | 'blue'
    | 'default'
    | 'googly'
    | 'green'
    | 'horror'
    | 'illuminati'
    | 'money'
    | 'pink'
    | 'red'
    | 'small'
    | 'spinner'
    | 'spongebob'
    | 'white'
    | 'yellow'
    | 'random'
export type FlagType =
    | 'asexual'
    | 'aromantic'
    | 'bisexual'
    | 'pansexual'
    | 'gay'
    | 'lesbian'
    | 'trans'
    | 'nonbinary'
    | 'genderfluid'
    | 'genderqueer'
    | 'polysexual'
    | 'austria'
    | 'belgium'
    | 'botswana'
    | 'bulgaria'
    | 'ivory'
    | 'estonia'
    | 'france'
    | 'gabon'
    | 'gambia'
    | 'germany'
    | 'guinea'
    | 'hungary'
    | 'indonesia'
    | 'ireland'
    | 'italy'
    | 'luxembourg'
    | 'monaco'
    | 'nigeria'
    | 'poland'
    | 'russia'
    | 'romania'
    | 'sierralione'
    | 'thailand'
    | 'ukraine'
    | 'yemen'
export type SnapChatFilter =
    | 'dog'
    | 'dog2'
    | 'dog3'
    | 'pig'
    | 'flowers'
    | 'clown'
    | 'random'
export type SafeSearchTypes = 'off' | 'moderate' | 'strict'
export type Timespan =
    | '1m'
    | '3m'
    | '5m'
    | '15m'
    | '30m'
    | '1h'
    | '2h'
    | '4h'
    | '6h'
    | '8h'
    | '12h'
    | '1d'
    | '3d'
    | '1w'
    | '1mo'
export interface WebSearchResult {
    results: Array<{
        title: string,
        description: string,
        url: string
    }>,
    news: Array<{
        title: string,
        source: string,
        image?: string,
        url: string
    }>
    images: Array<string>,
    relatedQueries: Array<string>
}

export class PxlAPI {
    public readonly token: string
    public headers: HeadersInit
    public readonly baseUrl = 'https://api.pxlapi.dev/'
    constructor(accessToken: string) {
        this.token = accessToken
        this.headers = { Authorization: `Application ${this.token}`, 'Content-Type': 'application/json' }
    }
    public async ajit(images: Array<string>) {
        return (await this.post({ endpoint: 'ajit', images }))
    }
    public async emojiMosaic(images: Array<string>, body: { groupSize?: number, scale?: boolean }) {
        return await this.post({ endpoint: 'emojimosaic', images }, body)
    }
    public async eyes(images: Array<string>, type: EyesType = 'default', allowedRandomFilters?: Array<EyesType>) {
        return await this.post({ endpoint: `eyes/${type}`, images }, { type: allowedRandomFilters })
    }
    public async flag(images: Array<string>, flag: FlagType = 'gay', body?: { opacity?: number }) {
        return await this.post({ endpoint: `flag/${flag}`, images }, body)
    }
    public async flash(images: Array<string>) {
        return await this.post({ endpoint: 'flash', images })
    }
    public async ganimal(images: Array<string>) {
        return await this.post({ endpoint: 'ganimal', images })
    }
    public async glitch(images: Array<string>, body: { iterations?: number, amount?: number, gif?: { count?: number, delay?: number } }) {
        return (await this.post({ endpoint: 'glitch', images }, body))
    }
    public async imagescript(code: string, version: string = 'latest', body: { inject?: object, timeout?: number }) {
        return await this.post({ endpoint: `imagescript/${version}` }, { ...body, code })
    }
    public async imagescriptVersions() {
        return await this.get(`imagescript/versions`, 'json')
    }
    public async jpeg(images: Array<string>, quality: number = 1) {
        return await this.post({ endpoint: 'jpeg', images }, { quality })
    }
    public async lego(images: Array<string>, body: { groupSize?: number, scale?: boolean }) {
        return await this.post({ endpoint: 'lego', images }, body)
    }
    public async snapchat(images: Array<string>, filter: SnapChatFilter = 'dog', allowedRandomFilters?: Array<SnapChatFilter>) {
        return await this.post({ endpoint: `snapchat/${filter}`, images }, { type: allowedRandomFilters })
    }
    public async sonic(text: string) {
        return await this.post({ endpoint: 'sonic' }, { text })
    }
    public async thonkify(text: string) {
        return await this.post({ endpoint: 'thonkify' }, { text })
    }

    public async imageSearch(query: string, safeSearch: SafeSearchTypes, meta: false): Promise<Array<string>>
    public async imageSearch(query: string, safeSearch: SafeSearchTypes, meta: true): Promise<Array<{ url: string, title: string, location: string }>>
    public async imageSearch(query: string, safeSearch: SafeSearchTypes = 'strict', meta: boolean = false) {
        return await this.post({ endpoint: 'image_search', }, { query, safeSearch, meta }, 'json')
    }

    public async kLines(pair: string, timespan: Timespan = '1m', limit?: number) {
        return await this.post({ endpoint: `klines/${pair}` }, { timespan, limit })
    }

    public async screenshot(
        url: string,
        body?: {
            device?: string,
            locale?: string,
            blocklist?: Array<string>,
            defaultBlocklist?: boolean,
            browser?: 'chromium' | 'firefox',
            theme?: 'light' | 'dark',
            timeout?: number,
            fullPage?: boolean
        }) {
        return this.post({ endpoint: 'screenshot' }, { ...body, url })
    }

    public async webSearch(query: string, safeSearch: SafeSearchTypes = 'strict'): Promise<Array<WebSearchResult>> {
        return await this.post({ endpoint: 'web_search' }, { query, safeSearch }, 'json')
    }

    // lol
    private async get(endpoint: string, as: 'arrayBuffer'): Promise<ArrayBuffer>
    private async get(endpoint: string, as: 'json'): Promise<any>
    private async get(endpoint: string, as: 'text'): Promise<string>
    private async get(endpoint: string, as: 'text' | 'json' | 'arrayBuffer' = 'arrayBuffer') {
        const request = await fetch(`${this.baseUrl}${endpoint}`, { headers: this.headers, method: 'GET' })
        if (!request.ok || request.status !== 200) throw new Error(`Error ${request.status} whilst fetching '${request.url}': ${request.statusText}`)
        return await request[as]()
    }

    private async post(opt: Options, body?: object, as?: 'arrayBuffer'): Promise<ArrayBuffer>
    private async post(opt: Options, body?: object, as?: 'json'): Promise<any>
    private async post(opt: Options, body?: object, as?: 'text'): Promise<string>
    private async post(opt: Options, body?: object, as: 'text' | 'json' | 'arrayBuffer' = 'arrayBuffer') {
        const request = await fetch(`${this.baseUrl}${opt.endpoint}`, { method: 'POST', headers: this.headers, body: JSON.stringify({ body, images: opt.images }) })
        if (!request.ok || request.status !== 200) throw new Error(`Error ${request.status} whilst fetching '${request.url}': ${request.statusText}`)
        return await request[as]()
    }
}


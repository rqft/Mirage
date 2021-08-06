import { HVNAS } from "..";

export interface ImaggaResult<T> {
    result: T,
    status: {
        text: string,
        type: 'success' | 'error'
    }
}

export interface Body { image_url?: string, [x: string]: any }
export type Language<T> = { en: T }
export type NumberBoolean = 0 | 1

export interface TagsResult { tags: Array<Tag> }
export interface Tag { confidence: number, tag: Language<string> }

export interface CategorizersResult { categorizers: Array<Categorizer> }
export interface Categorizer { id: string, labels: Array<string>, title: string }

export interface CategoriesResult { categories: Array<Category> }
export interface Category { confidence: number, name: Language<string> }

export interface CroppingsResult { croppings: Array<Cropping> }
export interface Cropping {
    target_height: number,
    target_width: number,
    x1: number
    x2: number
    y1: number
    y2: number
}

export interface ColorsResult {
    colors: Colors
}
export interface Colors {
    background_colors: Array<Color & { percentage: string }>,
    color_variance: number,
    object_percentage: number,
    image_colors: Array<Color & { percent: string }>,
    color_percent_threshold: number,
    foreground_colors: Array<Color & { percentage: string }>
}
export interface Color {
    r: number
    g: number
    b: number,
    closest_palette_color: string,
    closest_palette_distance: number,
    closest_palette_color_html_code: string,
    html_code: string,
    closest_palette_color_parent: string,
}

export interface UsageResult {
    billing_period_end: string,
    billing_period_start: string,
    concurrency?: {
        max: number,
        now: number
    },
    daily: Record<string, number>
    daily_for: string,
    daily_processed: number,
    daily_requests: number,
    last_usage: number,
    monthly: Record<string, number>,
    monthly_limit: number,
    monthly_processed: number,
    monthly_requests: number,
    total_processed: number,
    total_requests: number,
    weekly: Record<string, number>
    weekly_processed: number,
    weekly_requests: number
}

export class Imagga {
    private headers: { Authorization: string; }
    public token: string;
    private baseUrl: string = 'https://api.imagga.com/v2/'
    constructor(token: string) {
        this.token = token
        this.headers = { Authorization: `Basic ${this.token}` }
    }
    public async tags(imageUrl: string, other?: Partial<{ language: string, verbose: NumberBoolean, threshold: number, decrease_parents: NumberBoolean, }>, taggerId: string = '') {
        return await this.get<TagsResult>(`tags/${taggerId}`, { image_url: imageUrl, ...other })
    }
    public async categorizers() {
        return await this.get<CategorizersResult>('categorizers')
    }
    public async categories(imageUrl: string, categorizerId: string, others?: Partial<{ language: string }>) {
        return await this.get<CategoriesResult>(`categories/${categorizerId}`, { image_url: imageUrl, ...others })
    }
    public async croppings(imageUrl: string, resolution?: Array<string>, others?: Partial<{ no_scaling: NumberBoolean, rect_percentage: number, image_result: NumberBoolean }>) {
        return await this.get<CroppingsResult>('croppings', { image_url: imageUrl, resolution: resolution.join(','), ...others })
    }
    public async colors(imageUrl: string, others?: Partial<{ extract_overall_colors: NumberBoolean, extract_object_colors: NumberBoolean, overall_count: number, separated_count: number, deterministic: NumberBoolean, features_type: 'overall' | 'object' }>) {
        return this.get<ColorsResult>('colors', { image_url: imageUrl, ...others })
    }
    public async usage(history: NumberBoolean = 0, concurrency: NumberBoolean = 0) {
        return this.get<UsageResult>('usage', { history, concurrency })
    }

    private async get<T>(endpoint: string, body: Body = {}) {
        const request = await fetch(`${this.baseUrl}${endpoint}${HVNAS.Utility.toUrlParams(body)}`, { headers: this.headers })
        if (!request.ok) throw new Error(`Error whilst fetching '${request.url}' (${request.status}): ${request.statusText}`)

        const data = await request.json() as ImaggaResult<T>
        if (data.status.type !== 'success') throw new Error(data.status.text)

        return data.result
    }
}

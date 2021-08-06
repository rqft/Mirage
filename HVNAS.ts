import {
    Snowflake,
    SnowflakeUtil,
    MessageEmbed,
    Permissions as __,
    PermissionResolvable,
    MessageAttachment,
} from "discord.js";

module HVNAS {

    export namespace Permissions {
        export function format(array: PermissionResolvable[]) {
            return HVNAS.Utility.flattenArray(array.map(v => new __(v).toArray())).map(v => v.toLowerCase().replace(/_/g, ' ').replace(/(^| )./gi, (m) => m.toUpperCase()))
        }
    }

    export namespace Utility {
        export const units = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        export const siUnits = units.map(v => v.split('').join('i'))
        export function readableBytes(bytes: number, s: boolean = false, d: number = 1) {
            const t = s ? 1000 : 1024

            if (Math.abs(bytes) < t) return `${bytes} Bytes`
            const _ = s ? units : siUnits
            let u = -1
            const r = 10 ** d
            do { bytes /= t } while (Math.round(Math.abs(bytes) * r) / r >= t && u < _.length - 1)
            return `${bytes.toFixed(d)} ${_[u]}`
        }
        export function createImageEmbed(img: Buffer | ArrayBuffer | MessageAttachment, name: string = 'image.png') {
            if (img instanceof ArrayBuffer) img = Buffer.from(img) as Buffer
            if (img instanceof MessageAttachment) img = img.attachment as Buffer
            img = new MessageAttachment(img as Buffer, name)
            return new MessageEmbed({ files: [img], footer: { text: `${img.name}, ${img.width}x${img.height}, ${readableBytes(img.size)}` } })
        }
        export function toUrlParams(obj: object) {
            return `?${Object.entries(obj).filter(isNotUndefinedOrNull).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`
        }
        export function flattenType<T>(type: T | T[]) {
            return type instanceof Array ? type : [type]
        }
        export function not(x?: any) { return !x }
        export function isUndefined(x?: any) { return x === undefined }
        export function isNotUndefined(x?: any) { return not(isUndefined(x)) }
        export function isNull(x?: any) { return x === null }
        export function isNotNull(x?: any) { return not(isNull(x)) }
        export function isUndefinedOrNull(x?: any) { return isUndefined(x) || isNull(x) }
        export function isNotUndefinedOrNull(x?: any) { return not(isUndefinedOrNull(x)) }

        export function flattenArray<T>(a: T[][]): T[] {
            const n = []; for (const i of a) n.push(...i)
            if (n.some(v => v instanceof Array)) flattenArray(n)
            return n
        }
        export function escapeRegex(s: string) {
            return s.replace(/[$./*+^{}|():?<>\[\]\\]/gi, '\\$&')
        }
    }

    export type HasID = { id: Snowflake }
    export type TimestampFlag = 'R'
    export namespace Markdown {
        export const wrap = (text: string, wrapper: string) => wrapper + text + wrapper;
        export const bold = (text: string) => wrap(text, MarkdownWrappers.BOLD);
        export const italic = (text: string) => wrap(text, MarkdownWrappers.ITALIC);
        export const underline = (text: string) => wrap(text, MarkdownWrappers.UNDERLINE);
        export const strikethrough = (text: string) => wrap(text, MarkdownWrappers.STRIKETHROUGH);
        export const spoiler = (text: string) => wrap(text, MarkdownWrappers.SPOILER);
        export const snippet = (text: string) => wrap(text, MarkdownWrappers.SNIPPET)
        export const timestamp = (unix: number | HasID | Snowflake, flags?: TimestampFlag[] | TimestampFlag) => {
            const unixify = (unix: number | HasID | Snowflake) => {
                return (typeof unix === 'number')
                    ? unix : (typeof unix !== 'string' && 'id' in unix)
                        ? +SnowflakeUtil.deconstruct(unix.id).date : +SnowflakeUtil.deconstruct(unix).date
            }
            return `<t:${unixify(unix)}:${Utility.flattenType(flags).join('')}>`
        }
        export const codeblock = (text: string, language?: string) => wrap(`${language}\n${text}`, MarkdownWrappers.CODEBLOCK)
    }
    export enum MarkdownWrappers {
        BOLD = '**',
        ITALIC = '*',
        UNDERLINE = '__',
        STRIKETHROUGH = '~~',
        SPOILER = '||',
        SNIPPET = '`',
        CODEBLOCK = '```'
    }
}
export { HVNAS }
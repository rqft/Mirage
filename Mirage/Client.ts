import { HVNAS } from './HVNAS'
import { List } from './List'
import { Message, Guild, Client as _Client, PermissionResolvable, Permissions, ColorResolvable, MessageEmbed, PresenceStatus, Presence, Activity, ActivityType, PresenceData, ClientUser, User, Snowflake, Channel, Emoji, Role, GuildMember, TextChannel, DMChannel, NewsChannel } from 'discord.js'
export module MIRVGE {

    type CacheKey = ('guilds' | 'users' | 'channels' | 'emojis')
    export class Client {

        public internals: _Client

        public readonly guildId: string
        public readonly guild: Guild
        public readonly token: string
        public ran: boolean = false
        public commands: List<Command>
        public prefixes: List<string> = List.from(['!'])
        public listeners: Runners = {}
        public readonly presence: PresenceData
        public readonly rawOptions: ClientOptions
        public cache: MirageCache
        public readonly self: ClientUser
        public guilds: List<Guild> = new List()
        public users: List<User> = new List()
        public channels: List<Channel> = new List()
        public emojis: List<Emoji> = new List()
        public blacklist: List<User> = new List()

        constructor(options: ClientOptions) {
            this.rawOptions = options
            this.guildId = this.rawOptions.guild ? this.rawOptions.guild instanceof Guild ? this.rawOptions.guild.id : this.rawOptions.guild : null
            this.internals = new _Client()
            this.self = this.internals.user
            this.cache = (() => {
                const cache: any = {};
                (['guilds', 'users', 'channels', 'emojis'] as Array<CacheKey>).forEach((v: CacheKey) => cache[v] = List.from<Guild | User | Channel | Emoji>(this.internals[v].cache.array()))
                return cache
            })()
            this.guilds = this.cache.guilds
            this.users = this.cache.users
            this.channels = this.cache.channels
            this.emojis = this.cache.emojis
            this.guild = this.guildId ? this.internals.guilds.cache.get(this.guildId) : null
            this.token = this.rawOptions.token
            this.commands = this.rawOptions.commands
            if (this.listeners.onCommandsLoaded) this.listeners.onCommandsLoaded(this)
            this.prefixes = (this.rawOptions.prefix || this.rawOptions.prefixes) ? List.from([this.rawOptions.prefix, ...this.rawOptions.prefixes]).filter(HVNAS.Utility.isUndefinedOrNull) : this.prefixes;
            this.presence = Client.convertPresence(this.rawOptions.presence)
            this.blacklist = this.rawOptions.blacklist.map(v => this.users.find(x => x.id === v))
        }
        public static convertPresence(presence: ClientPresence): PresenceData {
            return { activity: { type: presence.activityType, name: presence.text, url: presence.url }, status: presence.onlineStatus }
        }

        public handleCommand(context: CommandContext) {
            if (this.blacklist.size) {
                if (this.listeners.onBlacklistedCommandCheck) this.listeners.onBlacklistedCommandCheck(context)
                if (this.blacklist.some((v) => v.id === context.member.id)) {
                    if (this.listeners.onBlacklistedCommandUse) this.listeners.onBlacklistedCommandUse(context)
                    return
                }
            }

            if (context.command.memberPermissions) {
                if (this.listeners.onMemberPermissionsCheck) this.listeners.onMemberPermissionsCheck(context)
                if (!context.command.memberPermissions.every(p => context.member.hasPermission(p))) {
                    if (this.listeners.onMemberPermissionsFail) this.listeners.onMemberPermissionsFail(context)
                    return
                } else if (this.listeners.onMemberPermissionsPass) this.listeners.onMemberPermissionsPass(context)
            }
            if (context.command.clientPermissions) {
                if (this.listeners.onClientPermissionsCheck) this.listeners.onClientPermissionsCheck(context)
                if (!context.command.clientPermissions.every(p => context.me.hasPermission(p))) {
                    if (this.listeners.onClientPermissionsFail) this.listeners.onClientPermissionsFail(context)
                    return
                } else if (this.listeners.onClientPermissionsPass) this.listeners.onClientPermissionsPass(context)
            }
            if (this.listeners.onCommandMissingArgumentsCheck) this.listeners.onCommandMissingArgumentsCheck(context)
            if (context.arguments.size < context.command.arguments.filter((v) => v.required).size) {
                // const missingKeys = Array.from(context.command.arguments.filter((v) => v.required).keys())
                //     .filter((i) => !Array.from(context.arguments.keys())
                //         .includes(i)).map((v) => requiredKeys[v])
                if (this.listeners.onCommandMissingArguments) this.listeners.onCommandMissingArguments(context)
                return
            }
            context.arguments.forEach((value, i) => {
                const needed = context.command.arguments[i]
                if (needed.type !== typeof value) {
                    if (this.listeners.onTypeError) this.listeners.onTypeError({ ...context, error: new Error(`Expected argument type '${needed.type}', got '${value}'`) })
                    return
                }
            })
            if (this.listeners.onBeforeCommandRun)
                if (this.listeners.onBeforeCommandRun(context) === false) {
                    if (this.listeners.onCommandCancel) this.listeners.onCommandCancel(context)
                    return
                } else if (this.listeners.onCommandPass) this.listeners.onCommandPass(context)

            if (this.listeners.onCommandExecute) this.listeners.onCommandExecute(context)
            try {
                context.command.run(context)
                if (this.listeners.onCommandSuccess) this.listeners.onCommandSuccess(context)
                return
            } catch (error) {
                if (this.listeners.onCommandFail) this.listeners.onCommandFail({ ...context, error: new Error(error) })
                return
            }
        }
        public static createHelpObject(command: Command, client: Client) {
            const { name, description, aliases, clientPermissions, memberPermissions } = command
            return {
                name,
                description,
                aliases,
                arguments: command.arguments,
                clientPermissions,
                memberPermissions,
                prefixes: client.prefixes,
                usage: Client.createCommandUsage(command, client)
            }
        }
        public static identifyType(s: string) {
            if (parseFloat(s) !== NaN) return 'number'
            if (['true', 'false'].some(v => v === s.trim().toLowerCase())) return 'boolean'
            return 'string'
        }
        public static solidifyType(s: string) {
            const i = this.identifyType(s)
            if (i === 'boolean') return s === 'true'
            if (i === 'number') return parseFloat(s)
            return s
        }
        public static createCommandUsage(command: Command, client: MIRVGE.Client) {
            return `${client.prefixes}${command.name} ${command.arguments.map(v =>
                `${v.required ? '<' : '['}${v.name}: ${
                v.choices && v.choices.size && v.choices.size < 7
                    ? v.choices.stringify('|') : v.type}${v.required ? '>' : ']'}`).stringify(' ')}`
        }

        public static handleMessage(message: Message, client: Client) {

            // member check
            if (client.listeners.onMemberCheck) client.listeners.onMemberCheck({ message, client })

            // member check fail
            if (!message.member) {
                if (client.listeners.onMemberFail) client.listeners.onMemberFail({ message, client })
                return
            }

            // member check pass
            if (client.listeners.onMemberPass) client.listeners.onMemberPass({ message, client })

            // member bot check
            if (client.rawOptions.allowBots !== true) {
                if (client.listeners.onIsBotCheck) client.listeners.onIsBotCheck({ message, client })

                // member bot fail
                if (message.member.user.bot === true) {
                    if (client.listeners.onIsBotFail) {
                        client.listeners.onIsBotFail({ message, client })
                        return
                    }
                }

                if (client.listeners.onIsBotPass) client.listeners.onIsBotFail({ message, client })
            }
            if (message.channel instanceof NewsChannel || message.channel instanceof DMChannel) return
            // guild stuff
            if (client.guild) {

                // guild check
                if (client.listeners.onGuildCheck) client.listeners.onGuildCheck({ message, client })

                // guild check fail
                if (!message.guild) {
                    if (client.listeners.onGuildFail) client.listeners.onGuildFail({ message, client })
                    return
                }

                // guild check pass
                if (client.listeners.onGuildPass) client.listeners.onGuildPass({ message, client })

                // guild id check
                if (client.listeners.onGuildIdCheck) client.listeners.onGuildIdCheck({ message, client })

                // guild id check fail
                if (client.guildId !== message.guild.id) {
                    if (client.listeners.onGuildIdFail) client.listeners.onGuildIdFail({ message, client })
                    return
                }
            }

            // guild id check pass
            if (client.listeners.onGuildIdPass) client.listeners.onGuildIdPass({ message, client })

            // message parsing
            const prefixRegex = new RegExp(`^(${client.prefixes.map(HVNAS.Utility.escapeRegex).stringify('|')})`)
            const prefix = message.content.match(prefixRegex)[0]
            if (!prefix) return
            const args = List.from(message.content.slice(prefix.length).trim().split(/ +/g));
            const commandName = (() => { const a = args.first; args.deleteLast(); return a })()

            // command search
            const command = client.commands.find(cmd => [cmd.name, ...cmd.aliases].includes(commandName))
            if (client.listeners.onCommandSearch) client.listeners.onCommandSearch({ message, client })

            // command not found
            if (!command) {
                if (client.listeners.onCommandNotFound) client.listeners.onCommandNotFound({ message, client })
                return
            }

            // command found
            if (client.listeners.onCommandFound) client.listeners.onCommandFound({ message, client })
            client.handleCommand({
                command,
                message,
                arguments: args.map(Client.solidifyType),
                rawArguments: args,
                client,
                me: message.guild.me,
                channel: message.channel,
                member: message.member,
                guild: message.guild
            })

            return
        }

        public static findCommand(query: string, client: Client) {
            return client.commands.find((v) => [v.name, ...v.aliases].map(String.prototype.toLowerCase).includes(query.normalize().toLowerCase()))
        }
        public findCommand(query: string) { return Client.findCommand(query, this) }

        public run() {
            this.internals.on('message', message => Client.handleMessage(message, this))
            this.self.setPresence(this.presence)
            if (this.listeners.onBotLoaded) this.listeners.onBotLoaded(this)
            this.ran = true
            this.internals.login(this.token)
        }
    }

    export interface MirageCache {
        channels: List<Channel>,
        users: List<User>,
        guilds: List<Guild>,
        emojis: List<Emoji>,
    }
    export interface CommandContext {
        command: Command,
        message: Message,
        arguments: List<string | boolean | number>,
        rawArguments: List<string>,
        client: Client,
        me: GuildMember,
        member: GuildMember,
        guild: Guild,
        channel: TextChannel
    }
    export interface ClientOptions {
        token: string,
        allowBots?: boolean
        guild?: string | Guild,
        commands: List<Command>,
        prefix?: string,
        prefixes?: List<string>
        listeners?: Runners,
        presence?: ClientPresence,
        blacklist?: List<User | Snowflake>
    }
    export interface ClientPresence {
        text?: string,
        onlineStatus?: 'idle' | 'dnd' | 'invisible' | 'online',
        activityType?: 'PLAYING' | 'LISTENING' | 'WATCHING' | 'STREAMING',
        url?: string
    }
    export interface Command {
        name: string,
        aliases?: List<string>,
        description?: string,
        arguments?: List<Arguments.Argument>,
        clientPermissions?: List<PermissionResolvable>,
        memberPermissions?: List<PermissionResolvable>,
        listeners?: Runners,
        run: CFN
        serverOwnerOnly?: boolean
        botOwnerOnly?: boolean
    }

    export type SAFN<T, R = any> = (any: T) => R
    export type MFN = SAFN<{ message: Message, client: Client }, void | Message>

    export type CFN<R = any> = SAFN<CommandContext, R>

    export type Runners = Partial<{

        onBotLoaded: SAFN<Client>
        onCommandsLoaded: SAFN<Client>

        onMemberCheck: MFN
        onMemberPass: MFN
        onMemberFail: MFN

        onIsBotCheck: MFN
        onIsBotPass: MFN
        onIsBotFail: MFN

        onGuildCheck: MFN
        onGuildPass: MFN
        onGuildFail: MFN

        onGuildIdCheck: MFN
        onGuildIdPass: MFN
        onGuildIdFail: MFN

        onCommandSearch: MFN
        onCommandFound: MFN
        onCommandNotFound: MFN

        onCommandMissingArgumentsCheck: CFN
        onCommandMissingArguments: CFN

        onClientPermissionsCheck: CFN
        onClientPermissionsPass: CFN
        onClientPermissionsFail: CFN

        onMemberPermissionsCheck: CFN
        onMemberPermissionsPass: CFN
        onMemberPermissionsFail: CFN

        onBlacklistedCommandCheck: CFN
        onBlacklistedCommandUse: CFN

        onBeforeCommandRun: CFN<boolean>
        onCommandCancel: CFN
        onCommandPass: CFN

        onCommandExecute: CFN
        onCommandSuccess: CFN
        onCommandFail: SAFN<CommandContext & { error: Error }>

        onTypeError: SAFN<CommandContext & { error: Error }>
    }>

    export namespace Arguments {
        export interface Argument {
            type: 'string' | 'number' | 'boolean',
            choices?: List<string>,
            name: string,
            required?: boolean,
        }
    }

    export namespace Errors {
        export class Error {

            public text: string;
            public type: string

            get emoji() { return ErrorEmoji[this.type] }
            get formatted() { return `${this.emoji} ${HVNAS.Markdown.snippet(this.text)}` }
            get formattedEmbed() {
                return new MessageEmbed({
                    color: ErrorColor[this.type], description: `${HVNAS.Markdown.codeblock(this.text, 'txt')}`
                })
            }

            respond(message: Message, useEmbed: boolean = false) { message.reply(useEmbed ? this.formattedEmbed : this.formatted) }
            log() { console[this.type.toLowerCase()](this.text) }

            constructor(text: string, type: ErrorType = 'ERROR') {
                this.text = text
                this.type = type
            }

        }

        export type ErrorType = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
        export enum ErrorEmoji {
            ERROR = '❌',
            WARN = '⚠',
            INFO = '🌀',
            DEBUG = '☔'
        }
        export enum ErrorColor {
            ERROR = 0xE74C3C,
            WARN = 0xC27C0E,
            INFO = 0x3498DB,
            DEBUG = 0x9B59B6
        }
    }

}

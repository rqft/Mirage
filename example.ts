import { MIRVGE, List, HVNAS } from "./Mirage";
import { Constants, MessageEmbed } from "discord.js";
import { stock } from "./stock";
const client = new MIRVGE.Client({
    commands: new List([
        { name: 'ping', async run(context) { context.message.reply('pong') } },
        {
            name: 'help',
            async run(ctx) {
                const emb = new MessageEmbed({ color: Constants.Colors.NOT_QUITE_BLACK, title: 'Help Menu' })
                if (!ctx.arguments[0]) {
                    return await ctx.message.reply(emb
                        .setDescription(`list of commands: ${
                            HVNAS.Utility.flattenArray(ctx.client.commands.map(v => [v.name, ...v.aliases]).array)
                                .map(HVNAS.Markdown.snippet).join(', ')}`))
                }
                const command = ctx.client.findCommand(ctx.arguments[0])
                if (!command) return await ctx.message.reply('hey goofy i cant find that command')
                const help = MIRVGE.Client.createHelpObject(command, ctx.client)
                const data = [
                    help.name,
                    HVNAS.Markdown.italic(help.description),
                ]
                if (help.aliases.size) data.push(`${HVNAS.Markdown.bold('Aliases:')} ${help.aliases.map(HVNAS.Markdown.snippet).stringify()}`);
                data.push(HVNAS.Markdown.bold('⋙ Permissions Needed'))
                data.push(`\u200b\t⨠ **Bot**: ${HVNAS.Permissions.format(help.clientPermissions.array).map(HVNAS.Markdown.snippet).join(' ')}`) // '⋙⨠⫻'
                data.push(`\u200b\t⨠ **You**: ${HVNAS.Permissions.format(help.memberPermissions.array).map(HVNAS.Markdown.snippet).join(' ')}`) // '⋙⨠⫻'
                emb.setDescription(data.join('\n'))
                return await ctx.message.reply(emb)
            },
            arguments: List.of({ name: 'query', type: 'string' }),
            clientPermissions: List.of('ADMINISTRATOR')
        },
        stock
    ]),
    prefix: '.',
    token: 'real token',
    allowBots: false,
    presence: {
        text: 'ayo the pizza here',
    },
    blacklist: new List('1'),
    listeners: {
        onBotLoaded(ctx) { new MIRVGE.Errors.Error(`> Logged in with Mirage as ${ctx.self.tag}`, 'INFO').log() },
        onCommandsLoaded(ctx) { new MIRVGE.Errors.Error(`> Loaded ${ctx.commands.size} command${ctx.commands.size === 1 ? '' : 's'}`).log() }
    }
});
(() => {
    client.run()
})()

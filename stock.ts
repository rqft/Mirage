import { MIRVGE, HVNAS, List } from "./Mirage"
import { PxlAPI, Timespan } from "../src/hanas/wrappers/pxl"

export const stock: MIRVGE.Command = {
    name: 'stockmarket',
    async run(ctx) {
        const pxl = new PxlAPI('application token')
        const klines = await pxl.kLines(ctx.arguments.get(0) as string, ctx.arguments.get(1) as Timespan ?? '1h', 250)
        return await ctx.message.reply(HVNAS.Utility.createImageEmbed(klines, 'coin.png'))
    },
    arguments: List.from<MIRVGE.Arguments.Argument>([
        { name: 'coin', type: 'string', required: true },
        { name: 'interval', type: 'string', required: false }
    ])
}
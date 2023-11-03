#!/usr/bin/env node
import chalk from "chalk"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"

import { listenToFhirCastStream } from "./websockets"

yargs(hideBin(process.argv))
    .command(
        "listen",
        "Subscribe to the FHIRcast stream on [url] for [topic].",
        (yargs) => {
            return yargs.options({
                url: { type: "string", default: "http://localhost:8103/fhircast/STU2" },
                topic: { type: "string", default: "test" },
                verbose: { type: "boolean", default: false },
            })
        },
        async (argv) => {
            const webSocket = await listenToFhirCastStream({
                url: argv.url,
                topicId: argv.topic,
                verbose: argv.verbose,
            })

            if (webSocket.OPEN) {
                console.log(chalk.yellow("Press CTL + C to quit."))
                // Just sleep forever while our connection is open
                while (webSocket.OPEN) {
                    await new Promise((resolve) => setTimeout(resolve, 1000))
                }
            } else {
                console.error("Unable to open WebSocket connection.")
                console.error("Please ensure that your `url` is correct and your FHIRcast Hub is online.")
            }
        }
    )
    .parse()

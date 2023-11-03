import chalk from "chalk"
import { WebSocket } from "ws"
import { z } from "zod"

import { HubChannelScope, ZodFhirCastEvent } from "./events"

type Mode = "subscribe" | "unsubscribe"

function serializedHubChannelRequest(request: { mode: Mode; topic: string; scopes: HubChannelScope[] }) {
    return new URLSearchParams({
        "hub.channel.type": "websocket",
        "hub.mode": request.mode,
        "hub.topic": request.topic,
        "hub.events": request.scopes.join(","),
    }).toString()
}

const ZodHubChannelResponse = z.object({
    "hub.channel.endpoint": z.string().url(),
})

/****************************************************************************/
/* Utils */
export async function listenToFhirCastStream({
    url,
    topicId,
    verbose,
}: {
    url: string
    topicId: string
    verbose: boolean
}) {
    // Connect to the FHIRcast topic
    const response = await fetch(url, {
        method: "POST",
        body: serializedHubChannelRequest({
            mode: "subscribe",
            topic: topicId,
            scopes: Object.values(HubChannelScope),
        }),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    })

    const connectionData = await response.json()
    const parsedConnectionData = ZodHubChannelResponse.parse(connectionData)

    // Connect via WebSocket
    const newWebSocket = new WebSocket(parsedConnectionData["hub.channel.endpoint"])

    newWebSocket.on("open", () => {
        console.log(chalk.blue("Connected to the FHIRcast Hub."))
    })

    newWebSocket.on("message", (event) => {
        const message = JSON.parse(event.toString())

        if ("hub.topic" in message) {
            // Initial connection message, we can ignore this
            console.log(chalk.blue(`Subscribed to topic '${topicId}'.`))
            return
        }

        const result = ZodFhirCastEvent.safeParse(message)

        if (result.success) {
            console.log(chalk.green(`✅ Valid message: ${result.data.event["hub.event"]}.`))
        } else {
            console.log(chalk.red("❌ Invalid message."))
            console.error(chalk.red(JSON.stringify(result.error.issues, null, 2)))

            if (verbose) {
                console.log(chalk.whiteBright("👀 Raw message..."))
                console.error(chalk.white(JSON.stringify(message, null, 2)))
            }
        }
    })

    // Wait up to 5 seconds for the connection to open
    const startTime = Date.now()

    while (!newWebSocket.OPEN && startTime + 5000 < Date.now()) {
        await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return newWebSocket
}

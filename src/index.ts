#!/usr/bin/env node
import chalk from "chalk"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"

import { FhirCastEvent, FhirCastEventDiagnosticReportOpen, HubChannelScope } from "./events"
import { publishToFhirCastStream } from "./publish"
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
                console.log(chalk.yellow("Press CTL + C to quit"))
                // Just sleep forever while our connection is open
                while (webSocket.OPEN) {
                    await new Promise((resolve) => setTimeout(resolve, 1000))
                }
            } else {
                console.log(chalk.red("Unable to open WebSocket connection"))
                console.log(chalk.red("Please ensure that your `url` is correct and your FHIRcast Hub is online"))
            }
        }
    )
    .command(
        "publish-diagnostic-report-open",
        "Publish to the FHIRcast stream on [url] for [topic].",
        (yargs) => {
            return yargs.options({
                url: { type: "string", default: "http://localhost:8103/fhircast/STU2" },
                topic: { type: "string", default: "test" },
                accessionNumber: { type: "string", default: "ABCD" },
                verbose: { type: "boolean", default: false },
            })
        },
        async (argv) => {
            const imagingStudyId = crypto.randomUUID()

            const data: FhirCastEvent<FhirCastEventDiagnosticReportOpen> = {
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                event: {
                    "hub.event": HubChannelScope.DiagnosticReportOpen,
                    "hub.topic": argv.topic,
                    "context.versionId": "",
                    context: [
                        {
                            key: "report",
                            resource: {
                                id: crypto.randomUUID(),
                                status: "status",
                                resourceType: "DiagnosticReport",
                                subject: {
                                    reference: "subject reference",
                                },
                                imagingStudy: [
                                    {
                                        reference: `ImagingStudy/${imagingStudyId}`,
                                    },
                                ],
                            },
                        },
                        {
                            key: "study",
                            resource: {
                                resourceType: "ImagingStudy",
                                id: imagingStudyId,
                                description: "description",
                                started: new Date().toISOString(),
                                status: "status",
                                identifier: [
                                    {
                                        type: {
                                            coding: [
                                                {
                                                    system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                                                    code: "ACSN",
                                                },
                                            ],
                                        },
                                        value: argv.accessionNumber,
                                    },
                                ],
                                subject: {
                                    reference: "reference",
                                },
                            },
                        },
                    ],
                },
            }

            await publishToFhirCastStream({
                url: argv.url,
                topicId: argv.topic,
                data: data,
            })
        }
    )
    .parse()

#!/usr/bin/env node
import chalk from "chalk"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"

import {
    FhirCastEvent,
    FhirCastEventDiagnosticReportOpen,
    FhirCastEventDiagnosticReportOpened,
    FhirCastEventDiagnosticReportUpdate,
    HubChannelScope,
} from "./events"
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
    .command("publish", "Publish an event to the FHIRcast stream on [url] for [topic].", (yargs) => {
        return yargs
            .options({
                url: { type: "string", default: "http://localhost:8103/fhircast/STU2" },
                topic: { type: "string", default: "test" },
                accessionNumber: { type: "string", default: "ABCD" },
                verbose: { type: "boolean", default: false },
            })
            .command(
                "diagnostic-report-open",
                "Publish a `DiagnosticReport-open` event.",
                (yargs) => {
                    return yargs.options({
                        accessionNumber: { type: "string", default: "ABCD" },
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
            .command(
                "diagnostic-report-opened",
                "Publish a `DiagnosticReport-opened` event.",
                (yargs) => {
                    return yargs
                },
                async (argv) => {
                    const data: FhirCastEvent<FhirCastEventDiagnosticReportOpened> = {
                        id: crypto.randomUUID(),
                        timestamp: new Date().toISOString(),
                        event: {
                            "hub.event": HubChannelScope.DiagnosticReportOpened,
                            "hub.topic": argv.topic,
                            context: [
                                {
                                    key: "OperationOutcome",
                                    reference: {
                                        reference: "",
                                    },
                                    resource: {
                                        resourceType: "OperationOutcome",
                                        issue: [
                                            {
                                                severity: "information",
                                                diagnostics: "Report opened",
                                            },
                                        ],
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
            .command(
                "diagnostic-report-update",
                "Publish a `DiagnosticReport-update` event.",
                (yargs) => {
                    return yargs.options({
                        status: { type: "string", default: "partial" },
                    })
                },
                async (argv) => {
                    const data: FhirCastEvent<FhirCastEventDiagnosticReportUpdate> = {
                        id: crypto.randomUUID(),
                        timestamp: new Date().toISOString(),
                        event: {
                            "hub.event": HubChannelScope.DiagnosticReportUpdate,
                            "hub.topic": argv.topic,
                            context: [
                                {
                                    key: "updates",
                                    resource: {
                                        resourceType: "Bundle",
                                        type: "transaction",
                                        entry: [
                                            {
                                                request: {
                                                    method: "PUT",
                                                },
                                                resource: {
                                                    resourceType: "DiagnosticReport",
                                                    id: crypto.randomUUID(),
                                                    status: argv.status,
                                                },
                                            },
                                        ],
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
    })
    .parse()

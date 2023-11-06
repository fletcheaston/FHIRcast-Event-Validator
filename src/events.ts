import { z } from "zod"

export enum HubChannelScope {
    PatientOpen = "Patient-open",
    ImagingStudyOpen = "ImagingStudy-open",
    DiagnosticReportOpen = "DiagnosticReport-open",
    DiagnosticReportOpened = "DiagnosticReport-opened",
    DiagnosticReportUpdate = "DiagnosticReport-update",
}

/****************************************************************************/
/* Zod parsers for FHIR resource fragments (really just helpers) */
const ZodFhirFragmentReference = z.object({
    reference: z.string(),
})

const ZodFhirFragmentSimpleIdentifier = z.object({
    system: z.string(),
    value: z.string(),
})

const ZodFhirFragmentComplexIdentifier = z.object({
    type: z.object({
        coding: z.array(
            z.object({
                system: z.string(),
                code: z.string(),
            })
        ),
    }),
    value: z.optional(z.string()),
})

/****************************************************************************/
/* Zod parsers for FHIR resources */
const ZodFhirResourcePatient = z.object({
    key: z.literal("patient"),
    resource: z.object({
        resourceType: z.literal("Patient"),
        id: z.string(),
        identifier: z.array(z.union([ZodFhirFragmentComplexIdentifier, ZodFhirFragmentSimpleIdentifier])),
    }),
})

const ZodFhirResourceDiagnosticReport = z.object({
    key: z.literal("report"),
    resource: z.object({
        resourceType: z.literal("DiagnosticReport"),
        id: z.string(),
        status: z.string(),
        subject: ZodFhirFragmentReference,
        imagingStudy: z.array(ZodFhirFragmentReference),
    }),
})

const ZodFhirResourceDiagnosticReportPut = z.object({
    key: z.literal("updates"),
    resource: z.object({
        resourceType: z.literal("Bundle"),
        type: z.literal("transaction"),
        entry: z.array(
            z.object({
                request: z.object({
                    method: z.literal("PUT"),
                }),
                resource: z.object({
                    resourceType: z.literal("DiagnosticReport"),
                    id: z.string(),
                    status: z.string(),
                }),
            })
        ),
    }),
})

const ZodFhirResourceImagingStudy = z.object({
    key: z.literal("study"),
    resource: z.object({
        resourceType: z.literal("ImagingStudy"),
        id: z.string(),
        description: z.string(),
        started: z.string().datetime(),
        status: z.string(),
        identifier: z.array(z.union([ZodFhirFragmentComplexIdentifier, ZodFhirFragmentSimpleIdentifier])),
        subject: ZodFhirFragmentReference,
    }),
})

const ZodFhirResourceOperationOutcome = z.object({
    key: z.literal("OperationOutcome"),
    reference: ZodFhirFragmentReference,
    resource: z.object({
        resourceType: z.literal("OperationOutcome"),
        issue: z.array(
            z.object({
                severity: z.string(),
                diagnostics: z.string(),
            })
        ),
    }),
})

/****************************************************************************/
/* Zod parsers for FHIRcast events */
const ZodFhirCastEventPatientOpen = z.object({
    "hub.event": z.literal(HubChannelScope.PatientOpen),
    "hub.topic": z.string(),
    context: z.array(ZodFhirResourcePatient),
})

const ZodFhirCastEventDiagnosticReportOpen = z.object({
    "hub.event": z.literal(HubChannelScope.DiagnosticReportOpen),
    "hub.topic": z.string(),
    "context.versionId": z.string(),
    context: z.array(
        z.discriminatedUnion("key", [
            ZodFhirResourcePatient,
            ZodFhirResourceImagingStudy,
            ZodFhirResourceDiagnosticReport,
        ])
    ),
})

const ZodFhirCastEventDiagnosticReportOpened = z.object({
    "hub.event": z.literal(HubChannelScope.DiagnosticReportOpened),
    "hub.topic": z.string(),
    context: z.array(z.discriminatedUnion("key", [ZodFhirResourceOperationOutcome])),
})

const ZodFhirCastEventDiagnosticReportUpdate = z.object({
    "hub.event": z.literal(HubChannelScope.DiagnosticReportUpdate),
    "hub.topic": z.string(),
    context: z.array(
        z.discriminatedUnion("key", [ZodFhirResourceDiagnosticReport, ZodFhirResourceDiagnosticReportPut])
    ),
})

const ZodFhirCastEventImagingStudyOpen = z.object({
    "hub.event": z.literal(HubChannelScope.ImagingStudyOpen),
    "hub.topic": z.string(),
    context: z.array(z.discriminatedUnion("key", [ZodFhirResourcePatient, ZodFhirResourceImagingStudy])),
})

const ZodFhirCastHubEvent = z.discriminatedUnion("hub.event", [
    ZodFhirCastEventPatientOpen,
    ZodFhirCastEventDiagnosticReportOpen,
    ZodFhirCastEventDiagnosticReportOpened,
    ZodFhirCastEventDiagnosticReportUpdate,
    ZodFhirCastEventImagingStudyOpen,
])

export const ZodFhirCastEvent = z.object({
    timestamp: z.string().datetime(),
    id: z.string().uuid(),
    event: ZodFhirCastHubEvent,
})

/****************************************************************************/
/* Types that match Zod parsers */
export type FhirCastEventPatientOpen = z.infer<typeof ZodFhirCastEventPatientOpen>
export type FhirCastEventDiagnosticReportOpen = z.infer<typeof ZodFhirCastEventDiagnosticReportOpen>
export type FhirCastEventDiagnosticReportOpened = z.infer<typeof ZodFhirCastEventDiagnosticReportOpened>
export type FhirCastEventDiagnosticReportUpdate = z.infer<typeof ZodFhirCastEventDiagnosticReportUpdate>
export type FhirCastEventImagingStudyOpen = z.infer<typeof ZodFhirCastEventImagingStudyOpen>

type FhirCastHubEvent =
    | FhirCastEventPatientOpen
    | FhirCastEventDiagnosticReportOpen
    | FhirCastEventDiagnosticReportOpened
    | FhirCastEventDiagnosticReportUpdate
    | FhirCastEventImagingStudyOpen

export interface FhirCastEvent<T extends FhirCastHubEvent> extends z.infer<typeof ZodFhirCastEvent> {
    timestamp: string
    id: string
    event: T
}

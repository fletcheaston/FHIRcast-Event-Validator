import { z } from "zod"

export enum HubChannelScope {
    PatientOpen = "patient-open",
    ImagingStudyOpen = "imagingstudy-open",
    DiagnosticReportOpen = "DiagnosticReport-open",
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

const ZodFhirCastEventImagingStudyOpen = z.object({
    "hub.event": z.literal(HubChannelScope.ImagingStudyOpen),
    "hub.topic": z.string(),
    context: z.array(z.discriminatedUnion("key", [ZodFhirResourcePatient, ZodFhirResourceImagingStudy])),
})

const ZodFhirCastHubEvent = z.discriminatedUnion("hub.event", [
    ZodFhirCastEventPatientOpen,
    ZodFhirCastEventDiagnosticReportOpen,
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

export function isFhirCastEventPatientOpen(event: any): event is FhirCastEvent<FhirCastEventPatientOpen> {
    return isFhirCastEvent(event) && event.event["hub.event"] === HubChannelScope.PatientOpen
}

export type FhirCastEventDiagnosticReportOpen = z.infer<typeof ZodFhirCastEventDiagnosticReportOpen>

export function isFhirCastEventDiagnosticReportOpen(
    event: any
): event is FhirCastEvent<FhirCastEventDiagnosticReportOpen> {
    return isFhirCastEvent(event) && event.event["hub.event"] === HubChannelScope.DiagnosticReportOpen
}

export type FhirCastEventImagingStudyOpen = z.infer<typeof ZodFhirCastEventImagingStudyOpen>

export function isFhirCastEventImagingStudyOpen(event: any): event is FhirCastEvent<FhirCastEventImagingStudyOpen> {
    return isFhirCastEvent(event) && event.event["hub.event"] === HubChannelScope.ImagingStudyOpen
}

type FhirCastHubEvent = FhirCastEventPatientOpen | FhirCastEventDiagnosticReportOpen | FhirCastEventImagingStudyOpen

export interface FhirCastEvent<T extends FhirCastHubEvent> extends z.infer<typeof ZodFhirCastEvent> {
    timestamp: string
    id: string
    event: T
}

function isFhirCastEvent(event: any): event is FhirCastEvent<any> {
    if (typeof event !== "object") {
        return false
    }

    if (!("event" in event)) {
        return false
    }

    if (!("hub.event" in event.event)) {
        return false
    }

    return true
}

import { FhirCastEvent } from "./events"

export async function publishToFhirCastStream({
    url,
    topicId,
    data,
}: {
    url: string
    topicId: string
    data: FhirCastEvent<any>
}) {
    await fetch(`${url}/${topicId}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json",
        },
    })
}

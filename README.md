# FHIRcast Event Validator

A simple CLI that validates your FHIRcast messages and message handling.

## Listen

Subscribe to all available events on the default URL and default topic.

```shell
npx fhircast-event-validator listen
```

---

Subscribe to all available events on the provided URL and default topic.

```shell
npx fhircast-event-validator listen --url {http(s) url}
```

---

Subscribe to all available events on the default URL and provided topic.

```shell
npx fhircast-event-validator listen --topic "{topic}"
```

---

Provides some additional information when validation errors occur.

```shell
npx fhircast-event-validator listen --verbose
```

---

## Publish

The same `url` and `topic` options used for `listen` apply here as well.

### DiagnosticReport-open

Publish a `DiagnosticReport-open` event.

```shell
npx fhircast-event-validator publish diagnostic-report-open
```

### DiagnosticReport-opened

Publish a `DiagnosticReport-opened` event.

```shell
npx fhircast-event-validator publish diagnostic-report-opened
```

### DiagnosticReport-update

Publish a `DiagnosticReport-update` event.

```shell
npx fhircast-event-validator publish diagnostic-report-update
```

Publish a `DiagnosticReport-update` event with a custom status.

```shell
npx fhircast-event-validator publish diagnostic-report-update --status "{status}"
```

## TODO

- [x] Add command to publish messages
- [ ] Provide authentication options

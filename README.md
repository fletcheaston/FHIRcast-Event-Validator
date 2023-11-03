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

## TODO

- [ ] Add command to publish messages
- [ ] Provide authentication options

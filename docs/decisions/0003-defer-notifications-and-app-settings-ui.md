# 0003 - Defer Notifications And App Settings UI

Date: 2026-06-29

## Decision

`notifications` and `app_settings` already exist in the Phase 1 schema, but their manual UI will be deferred.

## Context

There are not enough automatic events yet to make `notifications` useful as an operational feed. `app_settings` is also not required for the current basic operational use of Lucas OS.

## Consequences

Phase 2 can start without implementing manual UI for these tables.

When capture and AI begin generating actions, `notifications` will be resumed as an audit feed for proposed, created, updated, and reversible changes.

`app_settings` will be resumed when real preferences exist, such as timezone, Today density, capture defaults, or integrations.

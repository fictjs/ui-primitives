---
'@fictjs/floating-ui-dom': patch
'@fictjs/one-time-password-field': patch
'@fictjs/radio-group': patch
'@fictjs/slider': patch
'@fictjs/switch': patch
'@fictjs/use-callback-ref': patch
---

Keep managed element refs and stable callbacks safe after their Fict 0.32 reactive roots are disposed.

Avoid forwarding the readonly DOM `form` property while preserving explicit form association through attributes.

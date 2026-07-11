---
'@fictjs/radio-group': patch
'@fictjs/switch': patch
'@fictjs/checkbox': patch
'@fictjs/slider': patch
'@fictjs/core-primitive': patch
---

Defer browser form bubble inputs until their controls are connected, including after cross-document adoption or insertion into a connected shadow tree, and react to ancestor and explicit form ownership. Transparent internal hosts keep those delayed input roots attached to the control lifecycle.

import * as React from '../helpers/element.js';
import { Slot as SlotPrimitive } from '@fictjs/radix-ui';
export const Root: React.FC<Record<string, unknown>> = (props) => <SlotPrimitive.Root {...props} />;
export const Slot: React.FC<Record<string, unknown>> = (props) => <SlotPrimitive.Root {...props} />;
export const Slottable: React.FC<{ children?: React.ReactNode }> = (props) => props.children ?? null;

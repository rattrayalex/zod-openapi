import type { ZodSet, ZodTypeAny } from 'zod';

import type { oas31 } from '../../openapi3-ts/dist';

import { type SchemaState, createSchemaOrRef } from '.';

export const createSetSchema = (
  zodSet: ZodSet<any>,
  state: SchemaState,
): oas31.SchemaObject => {
  const schema = zodSet._def.valueType as ZodTypeAny;
  const minItems = zodSet._def.minSize?.value;
  const maxItems = zodSet._def.maxSize?.value;
  return {
    type: 'array',
    items: createSchemaOrRef(schema, state),
    uniqueItems: true,
    ...(minItems !== undefined && { minItems }),
    ...(maxItems !== undefined && { maxItems }),
  };
};

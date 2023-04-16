import { oas30, oas31 } from 'openapi3-ts';
import { ZodNumber, ZodNumberCheck } from 'zod';

import { satisfiesVersion } from '../../openapi';
import { ComponentsObject } from '../components';
import { ZodOpenApiVersion } from '../document';

export const createNumberSchema = (
  zodNumber: ZodNumber,
  components: ComponentsObject,
): oas31.SchemaObject => {
  const zodNumberChecks = getZodNumberChecks(zodNumber);

  const minimum = mapMinimum(zodNumberChecks, components.openapi);
  const maximum = mapMaximum(zodNumberChecks, components.openapi);

  return {
    type: mapNumberType(zodNumberChecks),
    ...(minimum && (minimum as oas31.SchemaObject)), // Union types are not easy to tame
    ...(maximum && (maximum as oas31.SchemaObject)),
  };
};

export const mapNumberChecks = () => {};

export const mapMaximum = (
  zodNumberCheck: ZodNumberCheckMap,
  openapi: ZodOpenApiVersion,
):
  | Pick<
      oas31.SchemaObject | oas30.SchemaObject,
      'maximum' | 'exclusiveMaximum'
    >
  | undefined => {
  if (!zodNumberCheck.max) {
    return undefined;
  }

  const maximum = zodNumberCheck.max.value;
  if (zodNumberCheck.max.inclusive) {
    return { ...(maximum !== undefined && { maximum }) };
  }
  if (satisfiesVersion(openapi, '3.1.0')) {
    return { exclusiveMaximum: maximum };
  }
  return { maximum, exclusiveMaximum: true };
};
export const mapMinimum = (
  zodNumberCheck: ZodNumberCheckMap,
  openapi: ZodOpenApiVersion,
):
  | Pick<
      oas31.SchemaObject | oas30.SchemaObject,
      'minimum' | 'exclusiveMinimum'
    >
  | undefined => {
  if (!zodNumberCheck.min) {
    return undefined;
  }

  const minimum = zodNumberCheck.min.value;
  if (zodNumberCheck.min.inclusive) {
    return { ...(minimum !== undefined && { minimum }) };
  }
  if (satisfiesVersion(openapi, '3.1.0')) {
    return { exclusiveMinimum: minimum };
  }
  return { minimum, exclusiveMinimum: true };
};

type ZodNumberCheckMap = {
  [kind in ZodNumberCheck['kind']]?: Extract<ZodNumberCheck, { kind: kind }>;
};

const getZodNumberChecks = (zodNumber: ZodNumber): ZodNumberCheckMap =>
  zodNumber._def.checks.reduce<ZodNumberCheckMap>((acc, check) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    acc[check.kind] = check as any;
    return acc;
  }, {});

const mapNumberType = (
  zodNumberChecks: ZodNumberCheckMap,
): oas31.SchemaObject['type'] => (zodNumberChecks.int ? 'integer' : 'number');

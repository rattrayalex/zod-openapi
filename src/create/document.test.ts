import { z } from 'zod';

import { extendZodWithOpenApi } from '../extendZod';

import { type ZodOpenApiObject, createDocument } from './document';

extendZodWithOpenApi(z);

const schema = z.object({
  a: z.string(),
});
const path = z.object({ b: z.string() });
const simpleZodOpenApiObject: ZodOpenApiObject = {
  info: {
    title: 'My API',
    version: '1.0.0',
  },
  openapi: '3.1.0',
  paths: {
    '/jobs': {
      get: {
        requestParams: {
          path,
        },
        requestBody: {
          content: {
            'application/json': {
              schema,
            },
          },
        },
        responses: {
          '200': {
            description: '200 OK',
            content: {
              'application/json': {
                schema,
              },
            },
          },
        },
      },
    },
  },
};

const registered = z.object({
  a: z.string().openapi({ ref: 'a' }),
});
const registeredPath = z.object({
  b: z.string().openapi({ param: { ref: 'b' } }),
});
const registeredZodOpenApiObject: ZodOpenApiObject = {
  info: {
    title: 'My API',
    version: '1.0.0',
  },
  openapi: '3.1.0',
  paths: {
    '/jobs': {
      get: {
        requestParams: {
          path: registeredPath,
        },
        requestBody: {
          content: {
            'application/json': {
              schema: registered,
            },
          },
        },
        responses: {
          '200': {
            description: '200 OK',
            content: {
              'application/json': {
                schema: registered,
              },
            },
            headers: z.object({
              'my-header': z.string().openapi({ header: { ref: 'my-header' } }),
            }),
          },
        },
      },
    },
  },
};

const baseObject = z
  .object({
    a: z.string(),
  })
  .openapi({ ref: 'b' });
const manual = z.boolean();
type Lazy = Lazy[];
const zodLazy: z.ZodType<Lazy> = z.lazy(() => zodLazy.array());
const complex = z.object({
  a: z.string().openapi({ ref: 'a' }),
  b: baseObject,
  c: baseObject.optional(),
  d: baseObject.extend({ d: z.string().nullable() }).openapi({ ref: 'c' }),
  e: z.discriminatedUnion('type', [
    z.object({ type: z.literal('a') }).openapi({ ref: 'union-a' }),
    z.object({ type: z.literal('b') }).openapi({ ref: 'union-b' }),
  ]),
  f: z.tuple([z.string(), z.number(), manual]),
  g: zodLazy,
});
const complexZodOpenApiObject: ZodOpenApiObject = {
  info: {
    title: 'My API',
    version: '1.0.0',
  },
  openapi: '3.1.0',
  paths: {
    '/jobs': {
      get: {
        requestParams: {
          path: registeredPath,
        },
        requestBody: {
          content: {
            'application/json': {
              schema: complex,
            },
          },
        },
        responses: {
          '200': {
            description: '200 OK',
            content: {
              'application/json': {
                schema: complex,
              },
            },
            headers: z.object({
              'my-header': z.string().openapi({ header: { ref: 'my-header' } }),
            }),
          },
        },
      },
    },
  },
  components: {
    schemas: {
      manual,
      lazy: zodLazy,
    },
  },
};

describe('createDocument', () => {
  it('should generate a JSON document string', () => {
    const document = createDocument(simpleZodOpenApiObject);

    expect(document).toMatchInlineSnapshot(`
      {
        "info": {
          "title": "My API",
          "version": "1.0.0",
        },
        "openapi": "3.1.0",
        "paths": {
          "/jobs": {
            "get": {
              "parameters": [
                {
                  "in": "path",
                  "name": "b",
                  "required": true,
                  "schema": {
                    "type": "string",
                  },
                },
              ],
              "requestBody": {
                "content": {
                  "application/json": {
                    "schema": {
                      "properties": {
                        "a": {
                          "type": "string",
                        },
                      },
                      "required": [
                        "a",
                      ],
                      "type": "object",
                    },
                  },
                },
              },
              "responses": {
                "200": {
                  "content": {
                    "application/json": {
                      "schema": {
                        "properties": {
                          "a": {
                            "type": "string",
                          },
                        },
                        "required": [
                          "a",
                        ],
                        "type": "object",
                      },
                    },
                  },
                  "description": "200 OK",
                },
              },
            },
          },
        },
      }
    `);
  });

  it('should generate a JSON document string with components', () => {
    const document = createDocument(registeredZodOpenApiObject);

    expect(document).toMatchInlineSnapshot(`
      {
        "components": {
          "headers": {
            "my-header": {
              "required": true,
              "schema": {
                "type": "string",
              },
            },
          },
          "parameters": {
            "b": {
              "in": "path",
              "name": "b",
              "required": true,
              "schema": {
                "type": "string",
              },
            },
          },
          "schemas": {
            "a": {
              "type": "string",
            },
          },
        },
        "info": {
          "title": "My API",
          "version": "1.0.0",
        },
        "openapi": "3.1.0",
        "paths": {
          "/jobs": {
            "get": {
              "parameters": [
                {
                  "$ref": "#/components/parameters/b",
                },
              ],
              "requestBody": {
                "content": {
                  "application/json": {
                    "schema": {
                      "properties": {
                        "a": {
                          "$ref": "#/components/schemas/a",
                        },
                      },
                      "required": [
                        "a",
                      ],
                      "type": "object",
                    },
                  },
                },
              },
              "responses": {
                "200": {
                  "content": {
                    "application/json": {
                      "schema": {
                        "properties": {
                          "a": {
                            "$ref": "#/components/schemas/a",
                          },
                        },
                        "required": [
                          "a",
                        ],
                        "type": "object",
                      },
                    },
                  },
                  "description": "200 OK",
                  "headers": {
                    "my-header": {
                      "$ref": "#/components/headers/my-header",
                    },
                  },
                },
              },
            },
          },
        },
      }
    `);
  });

  it('should generate a complex JSON document string with components', () => {
    const document = createDocument(complexZodOpenApiObject);

    expect(document).toMatchInlineSnapshot(`
      {
        "components": {
          "headers": {
            "my-header": {
              "required": true,
              "schema": {
                "type": "string",
              },
            },
          },
          "parameters": {
            "b": {
              "in": "path",
              "name": "b",
              "required": true,
              "schema": {
                "type": "string",
              },
            },
          },
          "schemas": {
            "a": {
              "type": "string",
            },
            "b": {
              "properties": {
                "a": {
                  "type": "string",
                },
              },
              "required": [
                "a",
              ],
              "type": "object",
            },
            "c": {
              "allOf": [
                {
                  "$ref": "#/components/schemas/b",
                },
              ],
              "properties": {
                "d": {
                  "type": [
                    "string",
                    "null",
                  ],
                },
              },
              "required": [
                "d",
              ],
              "type": "object",
            },
            "lazy": {
              "items": {
                "$ref": "#/components/schemas/lazy",
              },
              "type": "array",
            },
            "manual": {
              "type": "boolean",
            },
            "union-a": {
              "properties": {
                "type": {
                  "enum": [
                    "a",
                  ],
                  "type": "string",
                },
              },
              "required": [
                "type",
              ],
              "type": "object",
            },
            "union-b": {
              "properties": {
                "type": {
                  "enum": [
                    "b",
                  ],
                  "type": "string",
                },
              },
              "required": [
                "type",
              ],
              "type": "object",
            },
          },
        },
        "info": {
          "title": "My API",
          "version": "1.0.0",
        },
        "openapi": "3.1.0",
        "paths": {
          "/jobs": {
            "get": {
              "parameters": [
                {
                  "$ref": "#/components/parameters/b",
                },
              ],
              "requestBody": {
                "content": {
                  "application/json": {
                    "schema": {
                      "properties": {
                        "a": {
                          "$ref": "#/components/schemas/a",
                        },
                        "b": {
                          "$ref": "#/components/schemas/b",
                        },
                        "c": {
                          "$ref": "#/components/schemas/b",
                        },
                        "d": {
                          "$ref": "#/components/schemas/c",
                        },
                        "e": {
                          "discriminator": {
                            "mapping": {
                              "a": "#/components/schemas/union-a",
                              "b": "#/components/schemas/union-b",
                            },
                            "propertyName": "type",
                          },
                          "oneOf": [
                            {
                              "$ref": "#/components/schemas/union-a",
                            },
                            {
                              "$ref": "#/components/schemas/union-b",
                            },
                          ],
                        },
                        "f": {
                          "maxItems": 3,
                          "minItems": 3,
                          "prefixItems": [
                            {
                              "type": "string",
                            },
                            {
                              "type": "number",
                            },
                            {
                              "$ref": "#/components/schemas/manual",
                            },
                          ],
                          "type": "array",
                        },
                        "g": {
                          "$ref": "#/components/schemas/lazy",
                        },
                      },
                      "required": [
                        "a",
                        "b",
                        "d",
                        "e",
                        "f",
                        "g",
                      ],
                      "type": "object",
                    },
                  },
                },
              },
              "responses": {
                "200": {
                  "content": {
                    "application/json": {
                      "schema": {
                        "properties": {
                          "a": {
                            "$ref": "#/components/schemas/a",
                          },
                          "b": {
                            "$ref": "#/components/schemas/b",
                          },
                          "c": {
                            "$ref": "#/components/schemas/b",
                          },
                          "d": {
                            "$ref": "#/components/schemas/c",
                          },
                          "e": {
                            "discriminator": {
                              "mapping": {
                                "a": "#/components/schemas/union-a",
                                "b": "#/components/schemas/union-b",
                              },
                              "propertyName": "type",
                            },
                            "oneOf": [
                              {
                                "$ref": "#/components/schemas/union-a",
                              },
                              {
                                "$ref": "#/components/schemas/union-b",
                              },
                            ],
                          },
                          "f": {
                            "maxItems": 3,
                            "minItems": 3,
                            "prefixItems": [
                              {
                                "type": "string",
                              },
                              {
                                "type": "number",
                              },
                              {
                                "$ref": "#/components/schemas/manual",
                              },
                            ],
                            "type": "array",
                          },
                          "g": {
                            "$ref": "#/components/schemas/lazy",
                          },
                        },
                        "required": [
                          "a",
                          "b",
                          "d",
                          "e",
                          "f",
                          "g",
                        ],
                        "type": "object",
                      },
                    },
                  },
                  "description": "200 OK",
                  "headers": {
                    "my-header": {
                      "$ref": "#/components/headers/my-header",
                    },
                  },
                },
              },
            },
          },
        },
      }
    `);
  });

  it('should generate a complex JSON document string with components in 3.0.0', () => {
    const document = createDocument({
      ...complexZodOpenApiObject,
      openapi: '3.0.0',
    });

    expect(document).toMatchInlineSnapshot(`
      {
        "components": {
          "headers": {
            "my-header": {
              "required": true,
              "schema": {
                "type": "string",
              },
            },
          },
          "parameters": {
            "b": {
              "in": "path",
              "name": "b",
              "required": true,
              "schema": {
                "type": "string",
              },
            },
          },
          "schemas": {
            "a": {
              "type": "string",
            },
            "b": {
              "properties": {
                "a": {
                  "type": "string",
                },
              },
              "required": [
                "a",
              ],
              "type": "object",
            },
            "c": {
              "allOf": [
                {
                  "$ref": "#/components/schemas/b",
                },
              ],
              "properties": {
                "d": {
                  "nullable": true,
                  "type": "string",
                },
              },
              "required": [
                "d",
              ],
              "type": "object",
            },
            "lazy": {
              "items": {
                "$ref": "#/components/schemas/lazy",
              },
              "type": "array",
            },
            "manual": {
              "type": "boolean",
            },
            "union-a": {
              "properties": {
                "type": {
                  "enum": [
                    "a",
                  ],
                  "type": "string",
                },
              },
              "required": [
                "type",
              ],
              "type": "object",
            },
            "union-b": {
              "properties": {
                "type": {
                  "enum": [
                    "b",
                  ],
                  "type": "string",
                },
              },
              "required": [
                "type",
              ],
              "type": "object",
            },
          },
        },
        "info": {
          "title": "My API",
          "version": "1.0.0",
        },
        "openapi": "3.0.0",
        "paths": {
          "/jobs": {
            "get": {
              "parameters": [
                {
                  "$ref": "#/components/parameters/b",
                },
              ],
              "requestBody": {
                "content": {
                  "application/json": {
                    "schema": {
                      "properties": {
                        "a": {
                          "$ref": "#/components/schemas/a",
                        },
                        "b": {
                          "$ref": "#/components/schemas/b",
                        },
                        "c": {
                          "$ref": "#/components/schemas/b",
                        },
                        "d": {
                          "$ref": "#/components/schemas/c",
                        },
                        "e": {
                          "discriminator": {
                            "mapping": {
                              "a": "#/components/schemas/union-a",
                              "b": "#/components/schemas/union-b",
                            },
                            "propertyName": "type",
                          },
                          "oneOf": [
                            {
                              "$ref": "#/components/schemas/union-a",
                            },
                            {
                              "$ref": "#/components/schemas/union-b",
                            },
                          ],
                        },
                        "f": {
                          "items": {
                            "oneOf": [
                              {
                                "type": "string",
                              },
                              {
                                "type": "number",
                              },
                              {
                                "$ref": "#/components/schemas/manual",
                              },
                            ],
                          },
                          "maxItems": 3,
                          "minItems": 3,
                          "type": "array",
                        },
                        "g": {
                          "$ref": "#/components/schemas/lazy",
                        },
                      },
                      "required": [
                        "a",
                        "b",
                        "d",
                        "e",
                        "f",
                        "g",
                      ],
                      "type": "object",
                    },
                  },
                },
              },
              "responses": {
                "200": {
                  "content": {
                    "application/json": {
                      "schema": {
                        "properties": {
                          "a": {
                            "$ref": "#/components/schemas/a",
                          },
                          "b": {
                            "$ref": "#/components/schemas/b",
                          },
                          "c": {
                            "$ref": "#/components/schemas/b",
                          },
                          "d": {
                            "$ref": "#/components/schemas/c",
                          },
                          "e": {
                            "discriminator": {
                              "mapping": {
                                "a": "#/components/schemas/union-a",
                                "b": "#/components/schemas/union-b",
                              },
                              "propertyName": "type",
                            },
                            "oneOf": [
                              {
                                "$ref": "#/components/schemas/union-a",
                              },
                              {
                                "$ref": "#/components/schemas/union-b",
                              },
                            ],
                          },
                          "f": {
                            "items": {
                              "oneOf": [
                                {
                                  "type": "string",
                                },
                                {
                                  "type": "number",
                                },
                                {
                                  "$ref": "#/components/schemas/manual",
                                },
                              ],
                            },
                            "maxItems": 3,
                            "minItems": 3,
                            "type": "array",
                          },
                          "g": {
                            "$ref": "#/components/schemas/lazy",
                          },
                        },
                        "required": [
                          "a",
                          "b",
                          "d",
                          "e",
                          "f",
                          "g",
                        ],
                        "type": "object",
                      },
                    },
                  },
                  "description": "200 OK",
                  "headers": {
                    "my-header": {
                      "$ref": "#/components/headers/my-header",
                    },
                  },
                },
              },
            },
          },
        },
      }
    `);
  });
});

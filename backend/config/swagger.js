/* eslint-disable no-console */
/**
 * swagger.js — 𝘀𝘄𝗮𝗴𝗴𝗲𝗿-𝗷𝘀𝗱𝗼𝗰 implementation (Aug 2025)
 * =============================================================================
 *  • Uses **swagger-jsdoc** to harvest all `@swagger` JSDoc blocks — no manual
 *    YAML parsing, so the “Implicit keys need to be on a single line” errors
 *    vanish.
 *  • Still injects dynamic Mongoose component schemas and any endpoints that
 *    lack documentation (via routing.js discovery) so the spec is complete.
 *  • Exposes generateSwagger, setupSwagger, initializeSwagger — API unchanged.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Imports & constants
// ──────────────────────────────────────────────────────────────────────────────
const fs = require('fs').promises;
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const mongoose = require('mongoose');
const requireAll = require('require-all');

const routing = require('./routing');
const { enumCache } = require('../models/common/Metadata');

const OUTPUT_FILE = path.join(__dirname, '../docs/swagger_output.json');

// ──────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ──────────────────────────────────────────────────────────────────────────────
/** Deep-merge helper (arrays overwritten). */
function deepMerge(target = {}, source = {}) {
  if (typeof source !== 'object' || !source) return target;
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (Array.isArray(source[key])) out[key] = source[key];
    else if (typeof source[key] === 'object' && source[key] !== null) out[key] = deepMerge(target[key], source[key]);
    else out[key] = source[key];
  }
  return out;
}

/** Require *all* model files so their schemas are compiled. */
function bootModels() {
  const modelsDir = path.join(__dirname, '../models');
  requireAll({ dirname: modelsDir, filter: /(.+)\.js$/, recursive: true });
}

// ──────────────────────────────────────────────────────────────────────────────
// Mongoose → OpenAPI component schema conversion
// ──────────────────────────────────────────────────────────────────────────────
function mongooseSchemaToOpenApi(schema, modelName = 'Unknown') {
  const openApi = { type: 'object', properties: {}, description: `${modelName} schema` };
  for (const [field, def] of Object.entries(schema.paths)) {
    if (['_id', '__v', 'id'].includes(field)) continue;
    const oa = convertField(def, field);
    if (oa) {
      openApi.properties[field] = oa;
      if (def.options?.required) {
        openApi.required = openApi.required || [];
        openApi.required.push(field);
      }
    }
  }
  return openApi;
}

function convertField(def, name) {
  const kind = def.instance || def.constructor.name;
  switch (kind) {
    case 'String': return stringField(def, name);
    case 'Number': return numberField(def);
    case 'Date':   return { type: 'string', format: 'date-time' };
    case 'Boolean':return { type: 'boolean' };
    case 'ObjectId':return { type: 'string', format: 'objectid' };
    case 'Array':  return arrayField(def, name);
    case 'Mixed':
    case 'Object': return { type: 'object', additionalProperties: true };
    default:       return { type: 'string' };
  }
}

function stringField(def, name) {
  const f = { type: 'string' };
  if (def.enumValues?.length) f.enum = def.enumValues;
  if (def.validators?.length) {
    for (const v of def.validators) {
      if (v.type === 'user defined' && v.validator) {
        const enumVals = extractEnum(v, name);
        if (enumVals.length) f.enum = enumVals;
      }
    }
  }
  if (def.options?.match?.toString().includes('email')) f.format = 'email';
  if (def.options?.match?.toString().includes('url'))   f.format = 'uri';
  if (def.options?.minlength) f.minLength = def.options.minlength;
  if (def.options?.maxlength) f.maxLength = def.options.maxlength;
  return f;
}

function numberField(def) {
  const f = { type: 'number' };
  if (def.options?.min !== undefined) f.minimum = def.options.min;
  if (def.options?.max !== undefined) f.maximum = def.options.max;
  return f;
}

function arrayField(def, name) {
  const f = { type: 'array' };
  if (def.schema?.paths) f.items = mongooseSchemaToOpenApi(def.schema, `${name}Item`);
  else if (def.caster)    f.items = convertField(def.caster, `${name}Item`);
  else                    f.items = { type: 'string' };
  return f;
}

function extractEnum(validator, fieldName) {
  try {
    const src = validator.validator.toString();
    const ids = [
      'ROLE_TYPES','APPLICATION_STATUSES','ORGANIZATION_TYPES','PROVINCES','COUNTRIES',
      'CURRENCIES','LANGUAGES','SSO_PROVIDERS','ADDRESS_TYPES'
    ];
    for (const id of ids) if (src.includes(id)) return enumCache.getValues(id) || [];
    const upper = fieldName.toUpperCase();
    if (upper.includes('ROLE')) return enumCache.getValues('ROLE_TYPES');
    if (upper.includes('STATUS')) return enumCache.getValues('APPLICATION_STATUSES');
    if (upper.includes('COUNTRY')) return enumCache.getValues('COUNTRIES');
  } catch (_) { /* ignore */ }
  return [];
}

function discoverAllModels() {
  const schemas = {};
  for (const [name, model] of Object.entries(mongoose.models)) {
    try { schemas[name] = mongooseSchemaToOpenApi(model.schema, name); }
    catch (e) { console.warn(`⚠️ model ${name}:`, e.message); }
  }
  return schemas;
}

function deriveTags(routePath) {
  if (routePath.includes('/auth')) return ['Authentication'];
  if (routePath.includes('/health')) return ['Health'];
  return ['Default'];
}

// ──────────────────────────────────────────────────────────────────────────────
// Core generator (swagger-jsdoc powered)
// ──────────────────────────────────────────────────────────────────────────────
async function generateSwagger() {
  try {
    console.log('📚 Generating Swagger spec (swagger-jsdoc)…');

    // 1️⃣  Dynamic enums
    if (!enumCache.initialized) await enumCache.initialize();

    // 2️⃣  Compile models & schemas
    bootModels();
    const schemas = discoverAllModels();

    // 3️⃣  Base OpenAPI definition (without paths)
    const baseDefinition = {
      openapi: '3.0.0',
      info: {
        title: 'RED VENOM Template API',
        version: '2.0.0',
        description: 'Comprehensive REST API for Template App'
      },
      servers: [{ url: 'http://localhost:3000', description: 'Development' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
        },
        schemas: {
          ...schemas,
          SuccessResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: { type: 'object' }
            }
          },
          ErrorResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          },
          ValidationError: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        responses: {
          ValidationError: {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          },
          UnauthorizedError: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          ForbiddenError: {
            description: 'Forbidden',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          RateLimitError: {
            description: 'Too many requests',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    };

    // 4️⃣  Run swagger-jsdoc to harvest @swagger blocks
    const apiFiles = routing.getRouteFilesForSwagger();
    const swaggerSpec = swaggerJSDoc({ definition: baseDefinition, apis: apiFiles });

    // 5️⃣  Add any undocumented endpoints for completeness
    const endpoints = await routing.getAllEndpoints();
    for (const ep of endpoints) {
      const m = ep.method.toLowerCase();
      swaggerSpec.paths[ep.path] = swaggerSpec.paths[ep.path] || {};
      if (!swaggerSpec.paths[ep.path][m]) {
        swaggerSpec.paths[ep.path][m] = {
          summary: `${ep.method} ${ep.path}`,
          description: ep.description || '',
          tags: deriveTags(ep.path),
          responses: {
            '200': {
              description: 'Success',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } }
            }
          }
        };
      }
    }

    // 6️⃣  Write the spec to disk
    await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(swaggerSpec, null, 2));
    console.log(`✔️ Swagger written → ${OUTPUT_FILE}`);
    return { success: true, outputFile: OUTPUT_FILE };
  } catch (e) {
    console.error('💥 generateSwagger failed:', e);
    return { success: false, error: e.message };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Swagger-UI & bootstrap helpers
// ──────────────────────────────────────────────────────────────────────────────
function setupSwagger(app) {
  let spec;
  try { spec = require('../docs/swagger_output.json'); }
  catch (_) { /* not generated yet */ }

  app.use('/api-docs', swaggerUi.serve, (req, res, next) => {
    if (!spec) spec = require('../docs/swagger_output.json');
    return swaggerUi.setup(spec, {
      customSiteTitle: 'RED VENOM API Docs',
      explorer: true,
      swaggerOptions: { persistAuthorization: true }
    })(req, res, next);
  });

  app.get('/api-docs/regenerate', async (_req, res) => {
    const result = await generateSwagger();
    if (result.success) {
      delete require.cache[require.resolve('../docs/swagger_output.json')];
      spec = require('../docs/swagger_output.json');
    }
    res.status(result.success ? 200 : 500).json(result);
  });

  console.log('✔️ Swagger UI mounted at /api-docs');
}

/**
 * initializeSwagger(app) — convenience wrapper for server bootstrap.
 */
async function initializeSwagger(app) {
  setupSwagger(app);

  //Always regenerate the swagger definitions when the app launches
  if (['development', 'test'].includes(process.env.NODE_ENV)) {
    await generateSwagger();
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Exports
// ──────────────────────────────────────────────────────────────────────────────
module.exports = {
  generateSwagger,
  setupSwagger,
  initializeSwagger
};
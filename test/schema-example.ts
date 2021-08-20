import {OASServer} from "../dist";
import {OpenApiSpecificationBuilder, SchemaBuilder} from "../src";

const builder = SchemaBuilder.create();

const servers: OASServer[] = [
  {
    url: 'https://api.{environment}.xyz.io/{basePath}',
    variables: { environment: { default: 'dev' },  basePath: { default: 'views' } }
  },
  {
    url: 'https://api.xyz.io/{basePath}',
    variables: { environment: { default: 'prod' },  basePath: { default: 'views' } }
  },
  {
    url: 'http://localhost:{port}', variables: {  environment: { default: 'local' }, port: { default: '3000' } }
  },
];

const schemas = builder.add('Chicken', s => s.object({
  identifier: s.string(),
  type: s.string(),
  name: s.string()
}))
.add('ChickenCollection', s => s.array(s.reference('Chicken')))
.add('Schema', s => s.object(undefined, undefined, true))
.add('ChickenCreateRequest', s => s.object({
  type: s.string(),
  name: s.string()
})).build();

export default OpenApiSpecificationBuilder
.create(schemas, { title: 'Chicken Store API', version: '1.0.0'})
.add('servers', o => servers)
.addComponent('securitySchemes', () => ({ OAuth: { type: 'oauth', flows: { authorizationCode: { authorizationUrl: '', scopes: { read: 'Read', write: 'Write', admin: 'Admin' }}} }}))
.add('paths', o => ({
  '/chicken': {
    get: {
      security: [{OAuth: ['read', 'write', 'admin']}],
      operationId: 'getChickens',
      responses: {
        200: {description: 'The Flock', content: o.jsonContent('ChickenCollection')},
      }
    },
    post: {
      operationId: 'createChicken',
      requestBody: {
        description: 'A Chicken',
        content: o.jsonContent('ChickenCreateRequest')
      },
      responses: {
        201: {
          description: 'The Flock',
          content: o.jsonContent('ChickenCollection')
        },
        400: {description: 'Bad Request', content: o.textContent()}
      }
    }
  },
  '/chicken/{chickenId}': {
    get: {
      operationId: 'getChicken',
      parameters: [{required: true, name: 'chickenId', in: 'path'},{required: true, name: 'someQuery', in: 'query'}, {required: false, name: 'someQuery2', in: 'query'}],
      responses: {
        200: {description: 'The Chicken', content: o.jsonContent('Chicken')},
      }
    },
    put: {
      operationId: 'updateChicken',
      parameters: [{required: true, name: 'chickenId', in: 'path'}, {required: true, name: 'someQuery', in: 'query', schema: builder.array(builder.string())}],
      requestBody: {
        description: 'A Chicken',
        content: o.jsonContent('ChickenCreateRequest')
      },
      responses: {
        200: {description: 'The Chicken', content: o.jsonContent('Chicken')},
      }
    },
    delete: {
      operationId: 'deleteChicken',
      parameters: [{required: true, name: 'chickenId', in: 'path'}, {required: true, name: 'X-Encryption-Key', in: 'header'}],
      responses: {
        200: {description: 'Success', content: o.textContent('Deleted')},
      }
    },
  },
  '/schema': {
    get: { responses: { 200: {description:'Schema', content: o.jsonContent('Schema') } } }
  }
}))
.build();

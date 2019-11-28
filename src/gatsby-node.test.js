import got from 'got'
import * as plugin from './gatsby-node'

const mockFeature = {
  id: 'id',
  geometry: {
    type: 'Polygon',
    coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10]]],
  },
  // Arbitrary properties from the ArcGIS feature service.
  properties: {
    foo: 'bar',
    bar: 'baz',
  },
  // Ensure stray properties are **not** included.
  foo: 'bar',
}

// got is used to fetch JSON data from the ArcGIS Feature service. We need to
// mock its return value in tests.
jest.mock('got')
got.mockImplementation((url, options) => {
  // Ensure we are telling got to parse JSON response data.
  if (!options.json) throw new Error('Did not request JSON data from server.')

  // Ensure we are requesting GeoJSON data from the server.
  if (options.query.f !== 'geojson')
    throw new Error('Did not request GeoJSON data from server.')

  return { body: { features: [mockFeature] } }
})

const gatsbyContext = {
  actions: {
    createNode: jest.fn(),
    createTypes: jest.fn(),
  },
  createNodeId: jest.fn().mockReturnValue('createNodeId'),
  createContentDigest: jest.fn().mockReturnValue('createContentDigest'),
  schema: {
    buildObjectType: jest.fn().mockImplementation(x => x),
  },
}

test('creates ArcGisFeature nodes', async () => {
  const pluginOptions = {
    name: 'test-source',
    url: 'https://example.com',
  }

  await plugin.sourceNodes(gatsbyContext, pluginOptions)

  expect(got).toHaveBeenCalledWith('https://example.com/0/query', {
    json: true,
    query: { f: 'geojson', outFields: '*', where: '1=1' },
  })

  expect(gatsbyContext.actions.createTypes).toHaveBeenCalledWith({
    name: 'ArcGisFeature',
    fields: {
      featureId: {
        type: 'ID!',
        description: "The feature's ID within the ArcGIS feature service.",
      },
      geometry: {
        type: 'JSON!',
        description:
          'GeoJSON geometry data. Child fields do **not** need to be queried individually.',
      },
      polylabel: {
        type: '[Float!]',
        description:
          'If feature is a polygon, this is the optimal point within the polygon for a label.',
      },
      sourceName: {
        type: 'String',
        description:
          'If provided in the plugin options, this is the name given to the plugin to categorize multiple feature services.',
      },
      type: { type: 'String!', description: "The feature's GeoJSON type." },
    },
    interfaces: ['Node'],
  })

  expect(gatsbyContext.actions.createNode).toHaveBeenCalledWith({
    id: 'createNodeId',
    featureId: mockFeature.id,
    polylabel: [5, 5],
    sourceName: 'test-source',
    type: mockFeature.type,
    properties: mockFeature.properties,
    internal: {
      contentDigest: 'createContentDigest',
      type: 'ArcGisFeature',
    },
  })
})

test('allows setting/overriding query params from plugin options', async () => {
  const pluginOptions = {
    name: 'test-source',
    url: 'https://example.com',
    params: { where: '1=0', foo: 'bar' },
  }

  await plugin.sourceNodes(gatsbyContext, pluginOptions)

  expect(got).toHaveBeenCalledWith('https://example.com/0/query', {
    json: true,
    query: { f: 'geojson', outFields: '*', where: '1=0', foo: 'bar' },
  })
})

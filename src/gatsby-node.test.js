import nock from 'nock'
import * as plugin from './gatsby-node'

const mockPluginOptions = {
  name: 'test-source',
  url: 'https://example.com',
}
const mockFeature = {
  id: 'id',
  geometry: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
        ],
      ],
      [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
        ],
      ],
    ],
  },
  // Arbitrary properties from the ArcGIS feature service.
  properties: {
    foo: 'bar',
    bar: 'baz',
  },
  // Ensure stray properties are **not** included.
  foo: 'bar',
}

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
  nock(mockPluginOptions.url)
    .get('/0/query?f=geojson&where=1%3D1&outFields=*')
    .reply(200, { features: [mockFeature] })

  await plugin.sourceNodes(gatsbyContext, mockPluginOptions)

  expect(gatsbyContext.actions.createTypes).toMatchSnapshot()
  expect(gatsbyContext.actions.createNode).toMatchSnapshot()
})

test('supports MultiPolygon features with additional fields', async () => {
  nock(mockPluginOptions.url)
    .get('/0/query?f=geojson&where=1%3D1&outFields=*')
    .reply(200, { features: [mockFeature] })

  await plugin.sourceNodes(gatsbyContext, mockPluginOptions)

  expect(gatsbyContext.actions.createTypes).toMatchSnapshot()
  expect(gatsbyContext.actions.createNode).toMatchSnapshot()
})

test('allows setting/overriding query params from plugin options', async () => {
  const pluginOptions = {
    ...mockPluginOptions,
    params: { where: '1=0', foo: 'bar' },
  }

  nock(mockPluginOptions.url)
    .get('/0/query?f=geojson&where=1%3D0&outFields=*&foo=bar')
    .reply(200, { features: [mockFeature] })

  await plugin.sourceNodes(gatsbyContext, pluginOptions)

  expect(gatsbyContext.actions.createTypes).toMatchSnapshot()
  expect(gatsbyContext.actions.createNode).toMatchSnapshot()
})

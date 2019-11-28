import url from 'url'
import got from 'got'
import polylabel from 'polylabel'

// Default parameters for the ArcGIS feature service request: fetch all
// features and fields in GeoJSON format.
const DEFAULT_PARAMS = {
  f: 'geojson',
  where: '1=1',
  outFields: '*',
}

// ArcGIS feature service query endpoint path.
const URL_PATH = '0/query'

// ArcGIS feature type name.
const FEATURE_TYPE = 'ArcGisFeature'

export const sourceNodes = async (gatsbyContext, pluginOptions) => {
  const { actions, createNodeId, createContentDigest, schema } = gatsbyContext
  const { createTypes, createNode } = actions
  const { name, url: serverURL, params } = pluginOptions

  const resolvedURL = url.resolve(serverURL, URL_PATH)
  const response = await got(resolvedURL, {
    json: true,
    query: { ...DEFAULT_PARAMS, ...params },
  })

  createTypes(
    schema.buildObjectType({
      name: FEATURE_TYPE,
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
    }),
  )

  // Create ArcGisFeature nodes for each feature.
  response?.body?.features?.forEach?.(feature =>
    createNode({
      id: createNodeId([name, feature?.id].filter(Boolean).join(' ')),
      featureId: feature?.id,
      polylabel:
        feature.geometry.type === 'Polygon'
          ? polylabel(feature.geometry.coordinates, 0.1)
          : null,
      sourceName: name,
      type: feature.type,
      properties: feature.properties,
      internal: {
        type: FEATURE_TYPE,
        contentDigest: createContentDigest(feature),
      },
    }),
  )
}

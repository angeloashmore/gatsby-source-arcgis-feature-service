import url from 'url'
import got from 'got'
import polylabel from 'polylabel'

// Default parameters for the ArcGIS feature server request: fetch all features
// and fields in GeoJSON format.
const DEFAULT_PARAMS = {
  f: 'geojson',
  where: '1=1',
  outFields: '*',
}

// ArcGIS feature server query endpoint path.
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

  // Set the geometry field as JSON. This field may have a different shape per
  // feature and will likely not need direct access to child properties via
  // GraphQL.
  createTypes(
    schema.buildObjectType({
      name: FEATURE_TYPE,
      fields: {
        featureId: 'ID!',
        geometry: 'JSON!',
        polylabel: '[Float!]',
        sourceName: 'String',
      },
      interfaces: ['Node'],
      extensions: { infer: false },
    }),
  )

  // Create ArcGisFeature nodes for each feature.
  response?.body?.features?.forEach?.(feature =>
    createNode({
      ...feature,
      id: createNodeId([name, feature?.id].filter(Boolean).join(' ')),
      featureId: feature?.id,
      polylabel:
        feature.geometry.type === 'Polygon'
          ? polylabel(feature.geometry.coordinates, 0.1)
          : null,
      sourceName: name,
      internal: {
        type: FEATURE_TYPE,
        contentDigest: createContentDigest(feature),
      },
    }),
  )
}

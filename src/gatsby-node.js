import url from 'url'
import got from 'got'
import pascalcase from 'pascalcase'

// Default parameters for the ArcGIS feature server request: fetch all features
// and fields in GeoJSON format.
const DEFAULT_PARAMS = {
  f: 'geojson',
  where: '1=1',
  outFields: '*',
}

// ArcGIS feature type name.
const FEATURE_TYPE = 'ArcGisFeature'

export const sourceNodes = async (gatsbyContext, pluginOptions) => {
  const { actions, createNodeId, createContentDigest } = gatsbyContext
  const { createTypes, createNode } = actions
  const { name: namespace, url: serverURL, params } = pluginOptions

  const resolvedURL = url.resolve(serverURL, '0/query')
  const response = await got(resolvedURL, {
    json: true,
    query: { ...DEFAULT_PARAMS, ...params },
  })

  const nodeType = pascalcase(
    [FEATURE_TYPE, namespace].filter(Boolean).join(' '),
  )

  // Set the geometry field as JSON. This field may have a different shape per
  // feature and will likely not need direct access to child properties via
  // GraphQL.
  createTypes(`
    type ${nodeType} implements Node {
      geometry: JSON!
    }
  `)

  // Create ArcGisFeature nodes for each feature.
  response?.body?.features?.forEach?.(feature =>
    createNode({
      ...feature,
      id: createNodeId([namespace, feature?.id].filter(Boolean).join(' ')),
      featureId: feature?.id,
      internal: {
        type: nodeType,
        contentDigest: createContentDigest(feature),
      },
    }),
  )
}

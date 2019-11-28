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

// ArcGIS feature properties type name.
const FEATURE_PROPERTIES_TYPE = 'ArcGisFeatureProperties'

export const sourceNodes = async (gatsbyContext, pluginOptions) => {
  const { actions, createNodeId, createContentDigest } = gatsbyContext
  const { createTypes, createNode } = actions
  const { name, url: serverURL, params } = pluginOptions

  const resolvedURL = url.resolve(serverURL, URL_PATH)
  const response = await got(resolvedURL, {
    json: true,
    query: { ...DEFAULT_PARAMS, ...params },
  })

  createTypes(`
    "A GeoJSON feature from an ArcGIS feature service."
    type ${FEATURE_TYPE} implements Node @dontInfer {
      "The feature's ID within the ArcGIS feature service."
      featureId: ID!

      "GeoJSON geometry data. Child fields do **not** need to be queried individually."
      geometry: JSON

      "If the feature is a polygon, this is the optimal point within the polygon for a label."
      polylabel: [Float!]

      "If provided in the plugin options, this is the name given to the plugin to categorize multiple feature services."
      sourceName: String

      "The feature's GeoJSON type."
      type: String!

      "The feature's GeoJSON type."
      properties: ArcGisFeatureProperties @link
    }
  `)

  // Implemented as a separate type because we want to infer this type.
  createTypes(`
    "ArcGIS GeoJSON feature properties."
    type ${FEATURE_PROPERTIES_TYPE} implements Node @infer {
      "If provided in the plugin options, this is the name given to the plugin to categorize multiple feature services."
      sourceName: String
    }
  `)

  // Create ArcGisFeature nodes for each feature.
  response?.body?.features?.forEach?.(feature => {
    const featureId = createNodeId(
      [name, feature?.id].filter(Boolean).join(' '),
    )
    const propertiesId = createNodeId(
      [name, feature?.id, 'properties'].filter(Boolean).join(' '),
    )

    createNode({
      id: featureId,
      featureId: feature?.id,
      geometry: feature.geometry,
      polylabel:
        feature.geometry.type === 'Polygon'
          ? polylabel(feature.geometry.coordinates, 0.1)
          : null,
      sourceName: name,
      type: feature.type,
      properties: propertiesId,
      internal: {
        type: FEATURE_TYPE,
        contentDigest: createContentDigest(feature),
      },
    })

    createNode({
      ...feature.properties,
      id: propertiesId,
      sourceName: name,
      internal: {
        type: FEATURE_PROPERTIES_TYPE,
        contentDigest: createContentDigest(feature.properties),
      },
    })
  })
}

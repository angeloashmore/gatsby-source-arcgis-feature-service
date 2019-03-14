import url from 'url'
import got from 'got'
import {
  GraphQLJSON,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'gatsby/graphql'
import createNodeHelpers from 'gatsby-node-helpers'
import * as R from 'ramda'

export const sourceNodes = async (gatsbyContext, pluginOptions) => {
  const { actions } = gatsbyContext
  const { createNode } = actions
  const { name, url: urlOption, params } = pluginOptions

  const { createNodeFactory } = createNodeHelpers({
    typePrefix: name ? `${name}GeoJson` : 'GeoJson',
  })

  const FeatureNode = createNodeFactory('Feature')

  const resolvedURL = url.resolve(urlOption, '0/query')

  // By default, fetch all features and fields in GeoJSON format.
  const response = await got(resolvedURL, {
    json: true,
    query: {
      f: 'geojson',
      where: '1=1',
      outFields: '*',
      ...params,
    },
  })

  // Create FeatureNodes for each GeoJSON feature
  R.compose(
    R.forEach(createNode),
    R.map(FeatureNode),
    R.path(['body', 'features']),
  )(response)
}

export const setFieldsOnGraphQLNodeType = ({ type }) => {
  // Set geometry.coordinates as type GraphQLJSON
  if (type.name.endsWith('GeoJsonFeature')) {
    const GraphQLGeoJSONGeometry = new GraphQLObjectType({
      name: 'GeoJSONGeometry',
      fields: {
        type: { type: GraphQLString },
        coordinates: { type: GraphQLJSON },
      },
    })

    return {
      geometry: { type: GraphQLGeoJSONGeometry },
    }
  }
}

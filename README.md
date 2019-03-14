# gatsby-source-prismic

Source plugin for pulling data into [Gatsby][gatsby] from an [ArcGIS Feature
Service][arcgis-feature-service] via [ArcGIS REST API][arcgis-feature-service-rest-api].

## Table of Contents

- [Features](#features)
- [Install](#install)
- [How to use](#how-to-use)
- [Providing JSON schemas](#providing-json-schemas)
- [How to query](#how-to-query)
  - [Query Rich Text fields](#query-right-text-fields)
  - [Query Link fields](#query-link-fields)
  - [Query Content Relation fields](#query-content-relation-fields)
  - [Query Slices](#query-slices)
  - [Query direct API data as a fallback](#query-direct-api-data-as-a-fallback)
  - [Image processing](#image-processing)
- [Site's `gatsby-node.js` example](#sites-gatsby-nodejs-example)

## Features

- Fetches feature data from an ArcGIS Feature Service

## Install

```sh
npm install --save gatsby-source-arcgis-feature-service
```

## How to use

```js
// In your gatsby-config.js
plugins: [
  /*
   * Gatsby's data processing layer begins with “source”
   * plugins. Here the site sources its data from an ArcGIS Feature Service.
   */
  {
    resolve: 'gatsby-source-arcgis-feature-service',
    options: {
      // The url of your ArcGIS Feature Service. This is required.
      url: 'https://<catalog-url>/<serviceName>/FeatureServer',

      // A name to namespace your feature data. If you have multiple instances
      // of this source plugin, this will allow you to query features
      // independently. This is optional.
      name: 'myProject',

      // Set the request parameters to filter the feature data returned from
      // the server. The following parameters are the defaults: request
      // all features and fields in GeoJSON format.
      params: {
        f: 'geojson',
        where: '1=1',
        outFields: '*',
      },
    },
  },
]
```

## How to query

You can query nodes created from your ArcGIS Feature Service using GraphQL like
the following:

**Note**: Learn to use the GraphQL tool and Ctrl+Spacebar at
<http://localhost:8000/___graphql> to discover the types and properties of your
GraphQL model.

```graphql
{
  allGeoJsonFeature {
    edges {
      node {
        id
        type
      }
    }
  }
}
```

All features are pulled from your server and created as `geoJsonFeature` and
`allGeoJsonFeature`. If you provide `name` as a plugin option, all features are
created as `${name}GeoJsonFeature` and `all${name}GeoJsonFeature`, where
`${name}` is the name provided in your options.

For example, if you have `myProject` as one of your names, you will be able to
query it like the following:

```graphql
{
  allMyProjectGeoJsonFeatures {
    edges {
      node {
        id
        geometry {
          type
          coordinates
        }
      }
    }
  }
}
```

### Query Geometry

Geometry data for each feature is provided on the `geometry` field per the
GeoJSON standard.

Coordinates within a feature can vary in shape due to the different types of
geometry (e.g. Point, Polygon, LineString). To ensure all geometry types can
be queried reliably, the `coordinates` field is provided as JSON. This means
you can query `coordinates` and receive deeper data without explicitly stating
the shape.

```graphql
{
  allGeoJsonFeature {
    edges {
      node {
        id
        geometry {
          type
          coordinates
        }
      }
    }
  }
}
```

### Query Properties

Property data for each feature is provided on the `properties` field.

The subfields available on this field is determined by the data returned from
the ArcGIS Feature Service.

```graphql
{
  allGeoJsonFeature {
    edges {
      node {
        id
        properties {
          name
          status
        }
      }
    }
  }
}
```

## Site's `gatsby-node.js` example

```js
const path = require('path')

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const features = await graphql(`
    {
      allGeoJsonFeature {
        edges {
          node {
            id
            geoJsonId
          }
        }
      }
    }
  `)

  features.data.allGeoJsonFeature.edges.forEach(edge => {
    createPage({
      path: `/${edge.node.geoJsonId}`,
      component: path.resolve('./src/templates/feature.js'),
      context: {
        id: edge.node.id,
        geoJsonId: edge.node.geoJsonId,
      },
    })
  })
}
```

[gatsby]: https://www.gatsbyjs.org/
[arcgis-feature-service]: https://enterprise.arcgis.com/en/server/latest/publish-services/linux/what-is-a-feature-service-.htm
[arcgis-feature-service-rest-api]: https://developers.arcgis.com/rest/services-reference/feature-service.htm

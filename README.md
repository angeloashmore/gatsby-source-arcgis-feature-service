# gatsby-source-arcgis-feature-service

Source plugin for pulling data into [Gatsby][gatsby] from an [ArcGIS Feature
Service][arcgis-feature-service] via [ArcGIS REST
API][arcgis-feature-service-rest-api].

## Table of Contents

- [Features](#features)
- [Install](#install)
- [How to use](#how-to-use)
- [How to query](#how-to-query)
  - [Query Geometry](#query-geometry)
  - [Query Properties](#query-properties)
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

      // A name to identify your feature data. If you have multiple instances
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
  allArcGisFeature {
    nodes {
      id
      type
    }
  }
}
```

All features are pulled from your server and created as `arcGisFeature` and
`allArcGisFeature`.

If you provide `name` as a plugin option, all features include a `sourceName`
field with that value which allows you to filter your features.

```graphql
{
  allArcGisFeature(filter: { sourceName: "myProject" }) {
    nodes {
      id
      type
    }
  }
}
```

### Query Geometry

Geometry data for each feature is provided on the `geometry` field per the
GeoJSON standard.

Geometry data within a feature can vary in object shape due to the different
types of geometry (e.g. Point, Polygon, LineString). To ensure all geometry
types can be queried reliably, the `geometry` field is provided as JSON. This
means you can query `geometry` and receive deeper data without explicitly
stating its fields.

```graphql
{
  allArcGisFeature {
    nodes {
      id
      geometry
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
  allArcGisFeature {
    nodes {
      id
      properties {
        name
        status
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
      allArcGisFeature {
        nodes {
          id
          featureId
        }
      }
    }
  `)

  features.data.allArcGisFeature.nodes.forEach(node => {
    createPage({
      path: `/${node.geoJsonId}`,
      component: path.resolve('./src/templates/feature.js'),
      context: {
        id: node.id,
        featureId: node.featureId,
      },
    })
  })
}
```

[gatsby]: https://www.gatsbyjs.org/
[arcgis-feature-service]:
  https://enterprise.arcgis.com/en/server/latest/publish-services/linux/what-is-a-feature-service-.htm
[arcgis-feature-service-rest-api]:
  https://developers.arcgis.com/rest/services-reference/feature-service.htm

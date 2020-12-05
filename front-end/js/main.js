// import {addCountries} from "./createMap.js"

var ctx = {
    w: 960,
    h: 484,
    filter: {
        startDate: null,
        endDate: null,
        states: new Set(),
        airlines: new Set(),
        types: new Set(),
    },
    selectionMode: 'world',
    drawRoutes: true,
    drawAirports: true,
    drawPlanes: true,
}

var createViz = () => {
    console.log('Using D3 v' + d3.version)
    var svgEl = d3.select('#interactiveMap').append('svg')
    svgEl.attr('width', ctx.w)
    svgEl.attr('height', ctx.h)
    loadData(svgEl)
}

var loadData = svgEl => {
    // Load data, transform it, store it in ctx
    const path = 'data/'
    const files = [
        'ne_50m_admin_0_countries.geojson',
        'brazil_states.geojson',
        'filtered_airports.csv',
        'filtered_airlines.csv',
    ]
    var loaders = files.map(f => {
        if (f.substring(f.length - 3, f.length) == 'csv')
            return d3.csv(path + f)
        else return d3.json(path + f)
    })

    loaders = [
        ...loaders,

        // Google API authentication
        new Promise((resolve, _) => {
            // gapi.load('auth2', () => {
            //     gapi.client
            //         .init({
            //             client_id:
            //                 '870126430098-7f54u9u9slslr732v5i6enppueaa94gf.apps.googleusercontent.com',
            //             scope:
            //                 'https://www.googleapis.com/auth/bigquery.readonly',
            //         })
            //         .then(() => {
            //             gapi.client.load('bigquery', 'v2', () => {
            //                 ctx.projectId = 'my-project-1501985873141'
            //                 resolve(gapi.client.bigquery)
            //             })
            //         })
            // })

            options = {
                client_id:
                    '870126430098-7f54u9u9slslr732v5i6enppueaa94gf.apps.googleusercontent.com',
                scope: 'https://www.googleapis.com/auth/bigquery.readonly',
            }
            
            gapi.auth.authorize(options, () => {
                gapi.client.load('bigquery', 'v2', () => {
                    ctx.projectId = 'my-project-1501985873141'
                    resolve(gapi.client.bigquery)
                })
            })
        }),
    ]

    // Executing loads and then calling makeMap
    Promise.all(loaders).then(values => {
        ctx.countries = values[0].features
        ctx.states = values[1].features
        ctx.airports = values[2]
        ctx.airlines = values[3]
        ctx.bigquery = values[4]
        ctx.airportsMap = new Map(
            ctx.airports.map(airport => [airport.code, airport])
        )
        ctx.airlinesMap = new Map(
            ctx.airlines.map(airline => [airline.code, airline])
        )

        // Drawing screen elements
        makeMap(svgEl)
        makeSlider()
        makeTypesPlot()
        makeCompaniesPlot()
        updateMap()
    })
}

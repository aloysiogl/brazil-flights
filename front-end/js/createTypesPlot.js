const makeTypesPlot = () => {
    const HEIGHT = 240
    const WIDTH = ctx.w / 2 - 50
    const BACKGROUND_COLOR = 'rgb(24,26,27)'
    const GRID_COLOR = 'rgb(52, 51, 50)'
    const LABEL_COLOR = 'lightgray'
    const TYPES_COLORS = [
        'rgba(47, 255, 28, .75)',
        'rgba(231, 255, 15, .75)',
        'rgba(255, 69, 252, .75)',
        'rgba(255, 131, 15, .75)'
    ]

    var vlSpec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        width: WIDTH,
        height: HEIGHT,
        data: {
            values: [
                { "a": "A", "b": 28 },
                { "a": "B", "b": 55 },
                { "a": "C", "b": 43 },
                { "a": "D", "b": 91 }
            ]
        },
        mark: {
            type: 'bar',
            cornerRadiusEnd: { "expr": 2 }
        },
        background: BACKGROUND_COLOR,
        config: { view: { stroke: GRID_COLOR } },
        encoding: {
            x: {
                field: "a",
                type: 'nominal',
                title: null,
                axis: {
                    "labelAngle": 0,
                    labelColor: LABEL_COLOR,
                },
                scale: {
                    paddingInner: 0.6,
                    paddingOuter: 0.6
                }
            },
            color: {
                field: "a",
                type: 'nominal',
                legend: null,
                scale: {
                    range: TYPES_COLORS
                }
            },
            y: {
                field: "b",
                type: 'quantitative',
                title: 'Nº of flights',
                axis: {
                    titleColor: LABEL_COLOR,
                    gridColor: GRID_COLOR,
                    domainColor: GRID_COLOR,
                    tickColor: GRID_COLOR,
                    labelColor: LABEL_COLOR,
                },
            }
        }
    }

    // Create element
    sliderG = d3.select('#plots').append('g').attr('id', 'types')
    var vlOpts = { actions: false }
    vegaEmbed('#plots #types', vlSpec, vlOpts)
}
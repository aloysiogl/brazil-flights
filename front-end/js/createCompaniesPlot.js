const makeCompaniesPlot = () => {
    d3.select('#plots').append('g').attr('id', 'companies')
    getAirlinesData(data => {
        const HEIGHT = 260 - 4
        const WIDTH = ctx.w / 2
        const BACKGROUND_COLOR = 'rgb(24,26,27)'
        const GRID_COLOR = 'rgb(52, 51, 50)'
        const BARS_COLOR = 'rgba(9, 255, 243, .75)'
        const LABEL_COLOR = 'lightgray'

        var vlSpec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            width: WIDTH,
            height: HEIGHT,
            autosize: {
                type: 'fit',
                contains: 'padding',
            },
            data: { name: 'data', values: data },
            mark: {
                type: 'bar',
                cornerRadiusEnd: { expr: 1 },
            },
            background: BACKGROUND_COLOR,
            config: { view: { stroke: GRID_COLOR } },
            selection: {
                highlight: { type: 'single', empty: 'none', on: 'mouseover' },
                select: { type: 'single' },
            },
            encoding: {
                y: {
                    field: 'airline',
                    type: 'nominal',
                    title: null,
                    axis: {
                        labelAngle: 0,
                        labelColor: LABEL_COLOR,
                        labelFont: ctx.font,
                    },
                    scale: {
                        paddingInner: 0.8,
                        paddingOuter: 0.8,
                    },
                    sort: '-x',
                },
                x: {
                    field: 'count',
                    type: 'quantitative',
                    title: 'Nº of Flights',
                    axis: {
                        format: '~s',
                        titleColor: LABEL_COLOR,
                        gridColor: GRID_COLOR,
                        domainColor: GRID_COLOR,
                        tickColor: GRID_COLOR,
                        labelColor: LABEL_COLOR,
                        labelFont: ctx.font,
                        titleFont: ctx.font,
                        titleFontWeight: 1,
                    },
                },
                tooltip: { field: 'name', type: 'nominal' },
                color: { value: BARS_COLOR },
                fillOpacity: {
                    condition: [
                        { selection: 'highlight', value: 1 },
                        { selection: 'select', value: 0.75 },
                    ],
                    value: 0.3,
                },
            },
        }

        // Create element
        var vlOpts = { actions: false }
        vegaEmbed('#plots #companies', vlSpec, vlOpts).then(({ _, view }) => {
            configureAirlinesSignalListener(view)

            ctx.updateAirlines = () => {
                d3.select('#spinner_airlines').attr('class', 'loader loader-small spinner_airlines')
                getAirlinesData(data => {
                    updateVegaSlider(view, data)
                    d3.select('#spinner_airlines').attr('class', 'hidden')
                })
            }
        })

        ctx.sectionsLoaded += 1
        if (ctx.sectionsLoaded == 4) {
            d3.select('#main').attr('class', 'main')
        }
    })
}

const configureAirlinesSignalListener = view => {
    view.addSignalListener('select', (_, item) => {
        // The only way I found to get their respective airlines was building their vgsid when data changes
        const selectedSids = item?._vgsid_ ?? []
        ctx.filter.airlines = new Set(
            Array.from(ctx.airlinesVgSid.entries())
                .filter(([_, vgsid]) => selectedSids.includes(vgsid))
                .map(([airline, _]) => airline)
        )

        updateMap()
        ctx.updateSlider()
        ctx.updateTypes()
    })
}

const getAirlinesData = callback => {
    jQuery.get(
        ctx.serverUrl,
        {
            name: 'airlines',
            startDate: ctx.filter.startDate,
            endDate: ctx.filter.endDate,
            types: JSON.stringify([...ctx.filter.types]),
            states: JSON.stringify([...ctx.filter.states]),
        },
        response => {
            const data = response.map(row => ({
                name: ctx.airlinesMap.get(row.airline).name,
                ...row,
            }))

            // Fix vgsig indices to be used later
            if (!ctx.airlinesVgSidCnt) {
                ctx.airlinesVgSidCnt = 0
                ctx.airlinesVgSid = new Map(
                    data.map(({ airline }) => {
                        ctx.airlinesVgSidCnt += 1
                        return [airline, ctx.airlinesVgSidCnt]
                    })
                )
            }

            callback(data)
        }
    )
}

const updateVegaSlider = (view, newData) => {
    const newDataMap = new Map(newData.map(data => [data.airline, data]))
    const curData = view.data('data')
    const curDataMap = new Map(curData.map(data => [data.airline, data]))

    // Airlines that weren't showing before
    const insert = newData.filter(({ airline }) => !curDataMap.has(airline))

    // Airlines that won't show anymore
    const remove = curData.filter(({ airline }) => {
        if (!newDataMap.has(airline)) {
            // Remove from filter
            if (ctx.filter.airlines.has(airline)) {
                ctx.filter.airlines.delete(airline)
            }
            return true
        }
        return false
    })

    // Fix vgsig indices to be used later
    insert.forEach(({ airline }) => {
        ctx.airlinesVgSidCnt += 1
        ctx.airlinesVgSid.set(airline, ctx.airlinesVgSidCnt)
    })

    // Modify airlines that are already in the plot
    const changeSet = vega.changeset().remove(remove).insert(insert)
    curData
        .filter(({ airline }) => newDataMap.has(airline))
        .forEach(cur => {
            changeSet.modify(cur, 'count', newDataMap.get(cur.airline).count)
        })

    view.change('data', changeSet).run()
}

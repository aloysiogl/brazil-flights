const makeCompaniesPlot = () => {
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
        data: { name: 'data', values: getAirlinesData() },
        mark: {
            type: 'bar',
            cornerRadiusEnd: { expr: 1 },
        },
        background: BACKGROUND_COLOR,
        config: { view: { stroke: GRID_COLOR } },
        selection: {
            highlight: { type: 'single', empty: 'none', on: 'mouseover' },
            select: { type: 'multi', toggle: 'true' },
        },
        encoding: {
            y: {
                field: 'airline',
                type: 'nominal',
                title: null,
                axis: {
                    labelAngle: 0,
                    labelColor: LABEL_COLOR,
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
    sliderG = d3.select('#plots').append('g').attr('id', 'companies')
    var vlOpts = { actions: false }
    vegaEmbed('#plots #companies', vlSpec, vlOpts).then(({ _, view }) => {
        configureSignalListener(view)

        ctx.updateAirlines = () => {
            const newData = getAirlinesData()
            const newDataMap = new Map(
                newData.map(data => [data.airline, data])
            )
            const curData = view.data('data')
            const curDataMap = new Map(
                curData.map(data => [data.airline, data])
            )

            // Airlines that weren't showing before
            const insert = newData.filter(
                ({ airline }) => !curDataMap.has(airline)
            )

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
                    changeSet.modify(
                        cur,
                        'count',
                        newDataMap.get(cur.airline).count
                    )
                })

            view.change('data', changeSet).run()
        }
    })
}

const configureSignalListener = view => {
    view.addSignalListener('select_tuple', (_, item) => {
        if (item) {
            // The only way I found to get their respective airlines was building their vgsid when data changes
            const airline = Array.from(ctx.airlinesVgSid.entries()).filter(
                ([_, vgsid]) => vgsid == item.values[0]
            )[0][0]
            if (ctx.filter.airlines.has(airline)) {
                ctx.filter.airlines.delete(airline)
            } else {
                ctx.filter.airlines.add(airline)
            }
        }

        updateMap()
        ctx.updateSlider()
        ctx.updateTypes()
    })
}

const getAirlinesData = () => {
    const { startDate: start, endDate: end, states } = ctx.filter

    const routesCounts = ctx.airlinesCounts.filter(
        ({ origin_airport, destination_airport, date }) => {
            var stateOk = states.size == 0
            if (!stateOk) {
                const originState = ctx.airportsMap.get(origin_airport).state
                const destinationState = ctx.airportsMap.get(
                    destination_airport
                ).state
                stateOk =
                    states.has(originState) && states.has(destinationState)
            }

            const dateOk = !start || !end || (start < date && date < end)

            return stateOk && dateOk
        }
    )

    var airlinesData = new Map()
    routesCounts.forEach(({ airline, count }) => {
        const cur = airlinesData.has(airline) ? airlinesData.get(airline) : 0
        airlinesData.set(airline, cur + parseInt(count))
    })
    airlinesData = Array.from(airlinesData.entries()).map(([key, value]) => ({
        airline: key,
        count: value,
        name: ctx.airlinesMap.get(key).name,
    }))
    airlinesData.sort(({ count: count1 }, { count: count2 }) =>
        count1 < count2 ? 1 : -1
    )

    // Build this to use on selection later
    if (!ctx.airlinesVgSidCnt) {
        ctx.airlinesVgSidCnt = 0
        ctx.airlinesVgSid = new Map(
            airlinesData.map(({ airline }) => {
                ctx.airlinesVgSidCnt += 1
                return [airline, ctx.airlinesVgSidCnt]
            })
        )
    }

    return airlinesData
}

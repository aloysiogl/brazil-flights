var ctx = {
    w: 800,
    h: 400,
    LA_MIN: 41.31,
    LA_MAX: 51.16,
    LO_MIN: -4.93,
    LO_MAX: 7.72,
    TRANSITION_DURATION: 1000,
    scale: 1,
    currentFlights: [],
    planeUpdater: null
};

const PROJECTIONS = {
    ER: d3.geoEquirectangular().center([0,0]).scale(128).translate([ctx.w/2,ctx.h/2]),
};

var path4proj = d3.geoPath()
                  .projection(PROJECTIONS.ER);

var drawMap = function(countries, lakes, rivers, svgEl){
    // Storing countries
    ctx.countries = countries.features

    ctx.mapG = svgEl.append("g")
                    .attr("id", "map");
    // bind and draw geographical features to <path> elements
    var path4proj = d3.geoPath()
                 .projection(PROJECTIONS.ER);
    var countryG = ctx.mapG.append("g").attr("id", "countries");
    ctx.countryG = countryG
    countryG.selectAll("path.country")
            .data(countries.features)
            .enter()
            .append("path")
            .style("fill", "white")
            .attr("d", path4proj)
            .attr("class", "country");
    var lakeG = ctx.mapG.append("g").attr("id", "lakes");
    lakeG.selectAll("path.lakes")
         .data(lakes.features)
         .enter()
         .append("path")
         .attr("d", path4proj)
         .attr("class", "lake");
    var riverG = ctx.mapG.append("g").attr("id", "rivers");
    riverG.selectAll("path.rivers")
         .data(rivers.features)
         .enter()
         .append("path")
         .attr("d", path4proj)
         .attr("class", "river");
    ctx.mapG.append("g")
            .attr("id", "planes");
    // pan & zoom
    function zoomed(event, d) {
      ctx.mapG.attr("transform", event.transform);
      var scale = ctx.mapG.attr("transform");
      scale = scale.substring(scale.indexOf('scale(')+6);
      scale = parseFloat(scale.substring(0, scale.indexOf(')')));
      ctx.scale = 1 / scale;
      if (ctx.scale != 1){
          d3.selectAll("image")
            .attr("transform", (d) => (getPlaneTransform(d)));
      }
    }
    var zoom = d3.zoom()
        .scaleExtent([1, 40])
        .on("zoom", zoomed);
    svgEl.call(zoom);
};

var getPlaneTransform = function(d){
    var xy = PROJECTIONS.ER([d.lon, d.lat]);
    var sc = 4*ctx.scale;
    var x = xy[0] - sc;
    var y = xy[1] - sc;
    if (d.bearing != null && d.bearing != 0){
        var t = `translate(${x},${y}) rotate(${d.bearing} ${sc} ${sc})`;
        return (ctx.scale == 1) ? t : t + ` scale(${ctx.scale})`;
    }
    else {
        var t = `translate(${x},${y})`;
        return (ctx.scale == 1) ? t : t + ` scale(${ctx.scale})`;
    }
};

var createViz = function(){
    d3.select("body")
      .on("keydown", function(event,d){handleKeyEvent(event);});
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.w);
    svgEl.attr("height", ctx.h);
    svgEl.append("rect")
         .attr("x", 0)
         .attr("y", 0)
         .attr("width", "100%")
         .attr("height", "100%")
         .attr("fill", "#bcd1f1");
    loadGeo(svgEl);
};

/* data fetching and transforming */
var loadGeo = function(svgEl){
    var promises = [d3.json("ne_50m_admin_0_countries.geojson"),
                    d3.json("ne_50m_lakes.geojson"),
                    d3.json("ne_50m_rivers_lake_centerlines.geojson")];
    Promise.all(promises).then(function(data){
        drawMap(data[0], data[1], data[2], svgEl);
    }).catch(function(error){console.log(error)});
};

var toggleUpdate = function(){
    if (d3.select("#updateBt").attr("value") == "On"){
        d3.select("#updateBt").attr("value", "Off");
        ctx.intervalId = setInterval(updatePlanes, 10000);
    }
    else {
        d3.select("#updateBt").attr("value", "On");
        clearInterval(ctx.intervalId)
    }
};

var createVegaChart = () => {
        var vlSpec = {
            "vconcat":[
                {
                    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
                    "data": {"values" : ctx.currentFlights},
                    "mark": "bar",
                    "encoding": {
                      "x": {
                          "aggregate": "count",
                          "axis": {"title": "Origin continent"}
                        },
                      "color": {
                        "condition": {
                            "selection": "click1",
                            "field": "ground",
                            "type": "nominal",
                            "legend": {"title": "Grounded", "values": [true, false]}
                        },
                        "value": "lightgray"
                        }
                    },
                    "selection": {"click1": {"encodings": ["color"], "type": "multi"}},
                    "resolve": {"legend": {"color": "independent"}}
                  },
                
                {
                "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
                "data": {"values" : ctx.currentFlights},
                "mark": "bar",
                "encoding": {
                "x": {
                    "field": "cont",
                    "type": "nominal",
                    "axis": {"title": "Number of flights"}
                },
                "y": {
                    "aggregate": "count",
                    "axis": {"title": "Origin continent"}
                    },
                "color": {
                    "condition": {
                        "selection": "click2",
                        "field": "cont",
                        "type": "nominal",
                        "legend": null
                    },
                    "value": "lightgray"
                    }
                },
                "selection": {"click2": {"encodings": ["color"], "type": "multi"}},
                "resolve": {"legend": {"color": "independent"}}
            }
        ]
          }
        
    
        var vlOpts = {width:150, height:300, actions:false};
        vegaEmbed("#inTheAir", vlSpec, vlOpts).then(({spec, view}) => {
            view.addEventListener('click', function (event, item) {
                if (item && item.datum){
                    if (item.datum.hasOwnProperty("ground")){
                        ctx.selectionGrounded = item.datum.ground
                    }
                    else if ((item.datum.hasOwnProperty("cont"))) {
                        ctx.selectionCont = item.datum.cont
                    } else {
                        ctx.selectionGrounded = null
                        ctx.selectionCont = null
                        updatePlanes(true) 
                    }
                    updatePlanes(false)
                }
                else{
                    console.log("here")
                    createVegaChart()
                    updatePlanes(true)
                }
            })
        })
}

var updatePlanes = (updateVega = true) => {
    d3.json("https://opensky-network.org/api/states/all").then(
            rawData => {
                processedData = rawData.states.map(data => {
                    orig_country = ctx.countries.find(c => c.properties.brk_name == data[2])
                    
                    var verify = c => {
                        if (c)
                            return orig_country.properties.continent
                        return "Unidentified"
                    }

                    var onGround = d => {
                        if (data[13])
                            return false
                        return true
                    } 

                    return {
                        id: data[0],
                        callsign: data[1],
                        origin: data[2],
                        lon: data[5],
                        lat: data[6],
                        bearing: data[10],
                        alt: data[13],
                        ground: onGround(data),
                        cont: verify(orig_country)
                    }
                })

                // Filter out planes in the null island
                processedData = processedData.filter(data => !(Math.abs(data.lat) < 1e-7 && Math.abs(data.lon) < 1e-7))
                
                if (!updateVega)
                    processedData = processedData.filter(data => {
                        if (ctx.selectionGrounded != null && ctx.selectionCont != null)
                            return data.cont == ctx.selectionCont && data.ground == ctx.selectionGrounded
                        else if (ctx.selectionGrounded != null) {
                            return data.ground == ctx.selectionGrounded
                        }
                        else if (ctx.selectionCont != null){
                            return data.cont == ctx.selectionCont 
                        }
                        return true
                    })

                ctx.currentFlights = processedData

                // Drawing planes
                var planes = d3.select("#planes").selectAll("image")
                .data(ctx.currentFlights, d => d.id);
                
                // Adding new planes
                planes.enter()
                        .append("image")
                        .attr("transform", d => getPlaneTransform(d))
                        .attr("width", 8)
                        .attr("height", 8)
                        .attr("xlink:href", "plane_icon.png")
                        .on("mouseover", (e,d) => {
                            d3.select("div#info").text(d.callsign)
                            countries = d3.select("svg").select("g#countries")

                            origin = d.origin
                            
                            // Color coutnries based on origin flight
                            var recolor = (data) => {
                                name = data.properties.brk_name

                                if (name == origin)
                                    return "red"
                                return "white"
                            }
                            
                            // Recoloring countries
                            ctx.countryG.selectAll("path.country")
                                        .data(ctx.countries)
                                        .style("fill", recolor)
                        })
                
                // Moving planes
                planes.transition()
                      .duration(600)
                      .attr("transform", d => getPlaneTransform(d))

                // Deleting planes that are not present anymore
                planes.exit()
                      .remove()
                if (updateVega){
                    createVegaChart()
                }
                else {
                    ctx.selectionCont == null
                    ctx.selectionGrounded == null
                }
            }
        )
}

/* Input events */
var handleKeyEvent = function(e){
    if (e.keyCode === 85){
        // hitting u on the keyboard triggers flight data fetching and display
        updatePlanes()
    }
};

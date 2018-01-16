//JS file, where the magic happens

//Setup SVG size vars
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

//Used to color code based on position
var color = d3.scale.category10();
var positions = {
    "C": ["Center", 250],
    "C-F": ["Center/Forward", 270],
    "F-C": ["Forward/Center", 290],
    "F": ["Forward", 310],
    "F-G": ["Forward/Guard", 330],
    "G-F": ["Guard/Forward", 350],
    "G": ["Guard", 370]
};

//Setup the x and y axis 
var x = d3.scale.linear(),
    y = d3.scale.linear(),
    xAxis = d3.svg.axis(),
    yAxis = d3.svg.axis();

//Initialize the svg
var plotSVG = d3.select(".plotSVG").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//Initalize the mini hover tip
var tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-5, 0])
    .html(function(d) {
        return "<span>" + d.name + "<br>" + d.height + " in<br>" + d.weight + " lbs<br></span>";
    });

plotSVG.call(tip);

//Import and handle the data
d3.csv("data/player_data.csv", function(error, players) {
    if (error) throw error;

    //List of player names for autofill
    playerNames = [];

    //Preprocess player data
    players.forEach(function(d, index, object) {
        d.height = +d.height;
        d.weight = +d.weight;
        d.year_start = +d.year_start;
        d.year_end = +d.year_end;
        playerNames.push(d.name);
    });

    //Create crossfilters for the players
    var player = crossfilter(players),
        all = player.groupAll(),
        filter_year = player.dimension(function(d) { return d.year_start; }),
        filter_years = filter_year.group(Math.floor),
        filter_weight = player.dimension(function(d) { return d.weight; }),
        filter_weights = filter_weight.group(function(d) { return Math.floor(d/10)*10; }),
        filter_height = player.dimension(function(d) { return d.height; }),
        filter_heights = filter_height.group(Math.floor);
        filter_position = player.dimension(function(d) { return d.position; });

    // Render the total.
    d3.selectAll("#total")
    .text((players.length));

    //Render the plot axiss
    xAxis.scale(x).orient("bottom");
    x.range([0, width]);
    yAxis.scale(y).orient("left");
    y.range([height, 0]);
    x.domain(d3.extent(players, function(d) { return d.weight; })).nice();
    y.domain(d3.extent(players, function(d) { return d.height; })).nice();

    //Render the plot x axis
    plotSVG.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Player Weight (lbs)");

    //Render the plot y axis
    plotSVG.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Player Height (inches)");

    //Setup zoom brushing
    var zoombrush = d3.svg.brush()
        .y(y)
        .x(x)
        .on("brushend", brushended);
    
    //Attach the zoom-brush to the svg
    var zbrush = plotSVG.append("g")
        .attr("class", "zoom-brush")
        .call(zoombrush);

    var charts = [
        barChart()
            .dimension(filter_weight)
            .group(filter_weights)
            .x(d3.scale.linear()
            .domain([110, 370])
            .rangeRound([0, 425])),

        barChart()
            .dimension(filter_height)
            .group(filter_heights)
            .x(d3.scale.linear()
            .domain([62, 92])
            .rangeRound([0, 425])),

        barChart()
            .dimension(filter_year)
            .group(filter_years)
            .x(d3.scale.linear()
            .domain([1947, 2019])
            .rangeRound([0 , 900]))
    ];

    //Iniatilize the filter barcharts
    var chart = d3.selectAll(".chart")
        .data(charts)
        .each(function(chart) {
            chart.on("brush", renderAll).on("brushend", renderAll);
    });

    var lists = [
        d3.select("#top-height"),
        d3.select("#bot-height"),
        d3.select("#top-weight"),
        d3.select("#bot-weight")
    ];

    //Initialize the "top 10" lists
    var list = d3.selectAll(".list")
        .data(lists)
        .each(function(list) {
            list.data([playerList]);
        });

    //Ready to render filters and plot
    renderAll();

    //Render the plot legend
    var legend = plotSVG.selectAll(".legend")
        .data(color.domain())
      .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + (positions[d][1]) + ")"; });
  
    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color)
        .style("opacity", "0.6");

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return positions[d][0]; });

    //Handles brush changes
    window.filter = function(filters) {
        filters.forEach(function(d, i) {
            charts[i].filter(d);
        });
        renderAll();
    };

    //Handles brush resets
    window.reset = function(i) {
        charts[i].filter(null);
        renderAll();
    };

    //Renderer
    function render(method) {
        d3.select(this).call(method);
    }

    //Renders filters and plots
    function renderAll() {
        chart.each(render);
        list.each(render);
        updatePlot();
        d3.select("#active").text((all.value()));
    }

    //Handles searching for a player
    $('#playerSearch').on('input change keyup', function() {

        $(this).autocomplete({
            source: function(request, response) {
                var results = $.ui.autocomplete.filter(playerNames, request.term);
                response(results.slice(0, 10));
            },
            messages: {
                noResults: '',
                results: function() { }
            },
        });

        //Searched term
        var searchedPlayer = $(this)[0].value.toLowerCase();

        //Find corresponding player
        var thePlayer = d3.selectAll(".dot")
                            .filter(function(d) { return d.name.toLowerCase() == searchedPlayer; });

        //Reset previously searched players
        plotSVG.selectAll(".searched")
            .transition().duration(250)
            .attr("r", 4)
            .style("fill", "#FFF");

        plotSVG.selectAll(".searched").classed("searched", false);

        //Make changes to selected player if name matches
        if (thePlayer[0].length > 0) {
            thePlayer.moveToFront();
            thePlayer.transition().duration(500)
                .attr("r", 10)
                .style("fill", function(d) { return color(d.position);});
            
            //Class the searched player
            thePlayer.classed("searched", true);
        }

    });

    //Re inserts an object as the last child of the parent
    d3.selection.prototype.moveToFront = function() {
        return this.each(function(){
            this.parentNode.appendChild(this);
        });
    };

    //Handles the zoom-brush
    function brushended() {
        var s = zoombrush.extent();
        // plotSVG.selectAll(".selected").classed("selected", false)
        //     .transition().duration(1000).attr("r", 4);
          
        // var selCir = plotSVG.selectAll("circle")
        //     .filter(function(d) {
        //     return s[0][0] <= d.weight && s[1][0] >= d.weight && s[0][1] <= d.height && s[1][1] >= d.height;
        // });

        // selCir.transition().duration(1000)
        //     .attr("r", 10);

        // selCir.classed("selected", function(d, i) {
        //     return !d3.select(this).classed("selected");
        // });
    }

    //Handles rendering the top player lists
    function playerList(div) {

        var topPlayers;
        switch(this[0][0].id) {
            case "top-height":
                topPlayers = filter_height.top(10);
                break;
            case "bot-height":
                topPlayers = filter_height.bottom(10);
                break;
            case "top-weight":
                topPlayers = filter_weight.top(10);
                break;
            case "bot-weight":
                topPlayers = filter_weight.bottom(10);
                break;
        }

        div.each(function() {

            d3.select(this).selectAll(".player").remove();
            var player = d3.select(this).selectAll(".player")
                .data(topPlayers);

            var playerEnter = player.enter().append("div")
                .attr("class", "player");
            
            playerEnter.append("div")
                .attr("class", "name")
                .text(function(d) { return (d.name); });

            playerEnter.append("div")
                .attr("class", "value")
                .text(function(d) { 
                    if (this.parentNode.parentNode.id == "top-height" | 
                        this.parentNode.parentNode.id == "bot-height") {
                            return (d.height + " in"); 
                        } else {
                            return (d.weight + " lbs");
                        }
                });
        });
    }

    //Handles rendering plot with updated data
    function updatePlot() {

        plotSVG.selectAll(".dot").remove();

        //Get updated data
        players = filter_year.top(Infinity);

        //Add all dots with updated data
        plot = plotSVG.selectAll(".dot")
            .data(players);

        //Update new players
        plot.enter().append("circle")
            .attr("class", "dot")
            .attr("r", 4)
            .attr("cx", function(d) { return x(d.weight); })
            .attr("cy", function(d) { return y(d.height); })
            .style("stroke", function(d) { return color(d.position); })
            .on("mouseover", function(d) {
                tip.show(d);
                d3.select(this).style("fill", function(d) { return color(d.position);});
            })
            .on("mouseout", function(d) {
                tip.hide(d);
                d3.select(this).style("fill", "#fff");
            });

    }

    //The barchart function
    function barChart() {
        if (!barChart.id) barChart.id = 0;
    
        var margin = {top: 10, right: 10, bottom: 20, left: 20},
            x,
            y = d3.scale.linear().range([100, 0]),
            id = barChart.id++,
            axis = d3.svg.axis().orient("bottom").tickFormat(d3.format("d")),
            brush = d3.svg.brush(),
            brushDirty,
            dimension,
            group,
            round;
    
        function chart(div) {
            var width = x.range()[1],
                height = y.range()[0];
            
            y.domain([0, group.top(1)[0].value]);
    
            div.each(function() {
            var div = d3.select(this),
                g = div.select("g");
    
            // Create the skeletal chart.
            if (g.empty()) {
                div.select(".title-reset").append("a")
                    .attr("href", "javascript:reset(" + id + ")")
                    .attr("class", "reset")
                    .text("reset")
                    .style("display", "none");
    
                g = div.append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
                g.append("clipPath")
                    .attr("id", "clip-" + id)
                .append("rect")
                    .attr("width", width)
                    .attr("height", height);
    
                g.selectAll(".bar")
                    .data(["background", "foreground"])
                .enter().append("path")
                    .attr("class", function(d) { return d + " bar"; })
                    .datum(group.all());
    
                g.selectAll(".foreground.bar")
                    .attr("clip-path", "url(#clip-" + id + ")");
    
                g.append("g")
                    .attr("class", "axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(axis);
    
                // Initialize the brush component with pretty resize handles.
                var gBrush = g.append("g").attr("class", "brush").call(brush);
                gBrush.selectAll("rect").attr("height", height);
                gBrush.selectAll(".resize").append("path").attr("d", resizePath);
            }
    
            // Only redraw the brush if set externally.
            if (brushDirty) {
                brushDirty = false;
                g.selectAll(".brush").call(brush);
                div.select(".title-reset a").style("display", brush.empty() ? "none" : null);
                if (brush.empty()) {
                g.selectAll("#clip-" + id + " rect")
                    .attr("x", 0)
                    .attr("width", width);
                } else {
                var extent = brush.extent();
                g.selectAll("#clip-" + id + " rect")
                    .attr("x", x(extent[0]))
                    .attr("width", x(extent[1]) - x(extent[0]));
                }
            }
    
            g.selectAll(".bar").attr("d", barPath);
            });
    
            function barPath(groups) {
            var path = [],
                i = -1,
                n = groups.length,
                d;
            while (++i < n) {
                d = groups[i];
                path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
            }
            return path.join("");
            }
    
            function resizePath(d) {
            var e = +(d == "e"),
                x = e ? 1 : -1,
                y = height / 3;
            return "M" + (.5 * x) + "," + y
                + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
                + "V" + (2 * y - 6)
                + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
                + "Z"
                + "M" + (2.5 * x) + "," + (y + 8)
                + "V" + (2 * y - 8)
                + "M" + (4.5 * x) + "," + (y + 8)
                + "V" + (2 * y - 8);
            }
        }
    
        brush.on("brushstart.chart", function() {
            var div = d3.select(this.parentNode.parentNode.parentNode);
            div.select(".title-reset a").style("display", null);
        });
    
        brush.on("brush.chart", function() {
            var g = d3.select(this.parentNode),
                extent = brush.extent();
            if (round) g.select(".brush")
                .call(brush.extent(extent = extent.map(round)))
            .selectAll(".resize")
                .style("display", null);
            g.select("#clip-" + id + " rect")
                .attr("x", x(extent[0]))
                .attr("width", x(extent[1]) - x(extent[0]));
            dimension.filterRange(extent);
        });
    
        brush.on("brushend.chart", function() {
            if (brush.empty()) {
            var div = d3.select(this.parentNode.parentNode.parentNode);
            div.select(".title a").style("display", "none");
            div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
            dimension.filterAll();
            }
        });
    
        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin = _;
            return chart;
        };
    
        chart.x = function(_) {
            if (!arguments.length) return x;
            x = _;
            axis.scale(x);
            brush.x(x);
            return chart;
        };
    
        chart.y = function(_) {
            if (!arguments.length) return y;
            y = _;
            return chart;
        };
    
        chart.dimension = function(_) {
            if (!arguments.length) return dimension;
            dimension = _;
            return chart;
        };
    
        chart.filter = function(_) {
            if (_) {
            brush.extent(_);
            dimension.filterRange(_);
            } else {
            brush.clear();
            dimension.filterAll();
            }
            brushDirty = true;
            return chart;
        };
    
        chart.group = function(_) {
            if (!arguments.length) return group;
            group = _;
            return chart;
        };
    
        chart.round = function(_) {
            if (!arguments.length) return round;
            round = _;
            return chart;
        };
    
        return d3.rebind(chart, brush, "on");
    }
});

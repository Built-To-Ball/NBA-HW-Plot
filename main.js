//JS file, where the magic happens
$(document).ready(function() {

  //Setup SVG size vars
  var margin = { top: 20, right: 20, bottom: 30, left: 40 },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  //Used to color code based on position
  var color = d3.scaleOrdinal(d3.schemeCategory20);

  var positions = {
    C: ["Center", 250],
    "C-F": ["Center/Forward", 270],
    "F-C": ["Forward/Center", 290],
    F: ["Forward", 310],
    "F-G": ["Forward/Guard", 330],
    "G-F": ["Guard/Forward", 350],
    G: ["Guard", 370]
  };

  //Initialize the svg
  var plotSVG = d3
    .select(".plotSVG")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
      filter_year = player.dimension(function(d) {
        return d.year_start;
      }),
      filter_years = filter_year.group(Math.floor),
      filter_weight = player.dimension(function(d) {
        return d.weight;
      }),
      filter_weights = filter_weight.group(function(d) {
        return Math.floor(d / 10) * 10;
      }),
      filter_height = player.dimension(function(d) {
        return d.height;
      }),
      filter_heights = filter_height.group(Math.floor);
      filter_position = player.dimension(function(d) {
        return d.position;
      });

    // Render the total.
    d3.selectAll("#total").text(players.length);

    //Render the plot axiss
    var x = d3.scaleLinear().range([0, width]).domain(
      d3.extent(players, function(d) {
        return d.weight;
      })
    ).nice(),
    y = d3.scaleLinear().range([height, 0]).domain(
      d3.extent(players, function(d) {
        return d.height;
      })
    ).nice();

    var xAxis = d3.axisBottom(x),
    yAxis = d3.axisLeft(y);

    //Render the plot x axis
    plotSVG
      .append("g")
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
    plotSVG
      .append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Player Height (inches)");

    //Setup the player info
    var playerInfoDisp = plotSVG
      .append("g")
      .attr("class", "playerInfo")
      .attr("transform", "translate(480, 300)");

    playerInfoDisp.append("text").attr("id", "playerInfoName").attr("y", 0);
    playerInfoDisp.append("text").attr("id", "playerInfoPos").attr("y", 15);
    playerInfoDisp.append("text").attr("id", "playerInfoHeight").attr("y", 30);
    playerInfoDisp.append("text").attr("id", "playerInfoWeight").attr("y", 45);
    playerInfoDisp.append("text").attr("id", "playerInfoBirth").attr("y", 60);
    playerInfoDisp.append("text").attr("id", "playerInfoCollege").attr("y", 75);
    playerInfoDisp.append("text").attr("id", "playerInfoRookieYear").attr("y", 90);

    var charts = [
      barChart()
        .dimension(filter_weight)
        .group(filter_weights)
        .x(
          d3.scaleLinear()
            .domain([110, 370])
            .rangeRound([0, 425])
        ),

      barChart()
        .dimension(filter_height)
        .group(filter_heights)
        .x(
          d3.scaleLinear()
            .domain([62, 92])
            .rangeRound([0, 425])
        ),

      barChart()
        .dimension(filter_year)
        .group(filter_years)
        .x(
          d3.scaleLinear()
            .domain([1947, 2019])
            .rangeRound([0, 900])
        )
    ];

    //Iniatilize the filter barcharts
    var chart = d3
      .selectAll(".chart")
      .data(charts);

    window.filter = filters => {
      filters.forEach((d, i) => { charts[i].filter(d); });
      renderAll();
    };
  
    window.reset = i => {
      charts[i].filter(null);
      renderAll();
    };

    var lists = [
      d3.select("#top-height"),
      d3.select("#bot-height"),
      d3.select("#top-weight"),
      d3.select("#bot-weight")
    ];

    //Initialize the "top 10" lists
    var list = d3
      .selectAll(".list")
      .data(lists)
      .each(function(list) {
        list.data([playerList]);
      });

    //Ready to render filters and plot
    renderAll();

    //Render the plot legend
    var legend = plotSVG
      .selectAll(".legend")
      .data(color.domain())
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) {
        return "translate(0," + positions[d][1] + ")";
      });

    legend
      .append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

    legend
      .append("text")
      .attr("class", "legendText")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) {
        return positions[d][0];
      });

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
      d3.select("#active").text(all.value());
    }

    //Handles searching for a player
    $("#playerSearch").on("input change keyup", function() {
      $(this).autocomplete({
        source: function(request, response) {
          var results = $.ui.autocomplete.filter(playerNames, request.term);
          response(results.slice(0, 10));
        },
        messages: {
          noResults: "",
          results: function() {}
        }
      });

      //Searched term
      var searchedPlayer = $(this)[0].value.toLowerCase();

      //Find corresponding player
      var thePlayer = d3.selectAll(".dot").filter(function(d) {
        return d.name.toLowerCase() == searchedPlayer;
      });

      //Reset previously searched players
      var prevPlayer = plotSVG.selectAll(".searched");

      if (prevPlayer[0].length > 0) {
        prevPlayer
          .transition()
          .duration(250)
          .attr("r", 4)
          .style("fill", "var(--main_dark");

        prevPlayer.classed("searched", false).hidePlayerInfo();
      }

      //Make changes to selected player if name matches
      if (thePlayer[0].length > 0) {
        thePlayer.moveToFront();
        thePlayer
          .transition()
          .duration(500)
          .attr("r", 12)
          .style("fill", function(d) {
            return color(d.position);
          });

        //Class the searched player
        thePlayer.classed("searched", true);
        thePlayer.showPlayerInfo();
      }
    });

    //Appends player info to the SVG
    d3.selection.prototype.showPlayerInfo = function(d) {
      playerInfo = this._groups[0][0].__data__;
      $(".playerInfo").css("display", "block");

      plotSVG
        .select("#playerInfoName")
        .text(playerInfo.name)
        .style();
      plotSVG.select("#playerInfoBirth").text("Born: " + playerInfo.birth_date);
      plotSVG
        .select("#playerInfoCollege")
        .text("College: " + playerInfo.college);
      plotSVG.select("#playerInfoPos").text(positions[playerInfo.position][0]);
      plotSVG.select("#playerInfoHeight").text(playerInfo.height + " inches");
      plotSVG.select("#playerInfoWeight").text(playerInfo.weight + " lbs");
      plotSVG
        .select("#playerInfoRookieYear")
        .text("Rookie Year: " + playerInfo.year_start);
      plotSVG.select(".playerInfo").style("fill", function() {
        return color(playerInfo.position);
      });
      return this;
    };

    d3.selection.prototype.hidePlayerInfo = function() {
      $(".playerInfo").css("display", "none");
      return this;
    };

    //Re inserts an object as the last child of the parent
    d3.selection.prototype.moveToFront = function() {
      return this.each(function() {
        this.parentNode.appendChild(this);
      });
    };

    //Handles rendering the top player lists
    function playerList(div) {
      var topPlayers;
      switch (div._groups[0][0].id) {
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
        d3
          .select(this)
          .selectAll(".player")
          .remove();
        var player = d3
          .select(this)
          .selectAll(".player")
          .data(topPlayers);

        var playerEnter = player
          .enter()
          .append("div")
          .attr("class", "player");

        playerEnter
          .append("div")
          .attr("class", "name")
          .text(function(d) {
            return d.name;
          });

        playerEnter
          .append("div")
          .attr("class", "value")
          .text(function(d) {
            if (
              (this.parentNode.parentNode.id == "top-height") |
              (this.parentNode.parentNode.id == "bot-height")
            ) {
              return d.height + " in";
            } else {
              return d.weight + " lbs";
            }
          });
      });
    }

    //Handles rendering plot with updated data
    function updatePlot() {
      plotSVG.selectAll(".dot").remove();

      //Get updated data
      players = filter_year.top(Infinity);
      playerNames = players.map(function(a) {
        return a.name;
      });

      //Add all dots with updated data
      plot = plotSVG.selectAll(".dot").data(players);

      //Update new players
      plot
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("r", 4)
        .attr("cx", function(d) {
          return x(d.weight);
        })
        .attr("cy", function(d) {
          return y(d.height);
        })
        .style("stroke", function(d) {
          return color(d.position);
        })
        .on("mouseover", function(d) {
          d3.select(this).moveToFront();
          d3
            .select(this)
            .showPlayerInfo()
            .style("fill", function(d) {
              return color(d.position);
            });
          d3
            .select(this)
            .showPlayerInfo()
            .attr("r", 10);
        })
        .on("mouseout", function(d) {
          d3
            .select(this)
            .hidePlayerInfo()
            .style("fill", "var(--main_dark)");
          d3
            .select(this)
            .hidePlayerInfo()
            .attr("r", 4);
        });
    }

    //The barchart function
    function barChart() {
      if (!barChart.id) barChart.id = 0;
  
      let margin = { top: 10, right: 13, bottom: 20, left: 10 };
      let x;
      let y = d3.scaleLinear().range([100, 0]);
      const id = barChart.id++;
      const axis = d3.axisBottom();
      const brush = d3.brushX();
      let brushDirty;
      let dimension;
      let group;
      let round;
      let gBrush;
  
      function chart(div) {
        const width = x.range()[1];
        const height = y.range()[0];
  
        brush.extent([[0, 0], [width, height]]);
  
        y.domain([0, group.top(1)[0].value]);
  
        div.each(function () {
          const div = d3.select(this);
          let g = div.select('g');
  
          // Create the skeletal chart.
          if (g.empty()) {
            div.select('.title-reset').append('a')
              .attr('href', `javascript:reset(${id})`)
              .attr('class', 'reset')
              .text('reset')
              .style('display', 'none');
  
            g = div.append('svg')
              .attr('width', width + margin.left + margin.right)
              .attr('height', height + margin.top + margin.bottom)
              .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);
  
            g.append('clipPath')
              .attr('id', `clip-${id}`)
              .append('rect')
                .attr('width', width)
                .attr('height', height);
  
            g.selectAll('.bar')
              .data(['background', 'foreground'])
              .enter().append('path')
                .attr('class', d => `${d} bar`)
                .datum(group.all());
  
            g.selectAll('.foreground.bar')
              .attr('clip-path', `url(#clip-${id})`);
  
            g.append('g')
              .attr('class', 'axis')
              .attr('transform', `translate(0,${height})`)
              .call(axis);
  
            // Initialize the brush component with pretty resize handles.
            gBrush = g.append('g')
              .attr('class', 'brush')
              .call(brush);
  
            gBrush.selectAll('.handle--custom')
              .data([{ type: 'w' }, { type: 'e' }])
              .enter().append('path')
                .attr('class', 'brush-handle')
                .attr('cursor', 'ew-resize')
                .attr('d', resizePath)
                .style('display', 'none');
          }
  
          // Only redraw the brush if set externally.
          if (brushDirty !== false) {
            const filterVal = brushDirty;
            brushDirty = false;
  
            div.select('.title-reset a').style('display', d3.brushSelection(div) ? null : 'none');
  
            if (!filterVal) {
              g.call(brush);
  
              g.selectAll(`#clip-${id} rect`)
                .attr('x', 0)
                .attr('width', width);
  
              g.selectAll('.brush-handle').style('display', 'none');
              renderAll();
            } else {
              const range = filterVal.map(x);
              brush.move(gBrush, range);
            }
          }
  
          g.selectAll('.bar').attr('d', barPath);
        });
  
        function barPath(groups) {
          const path = [];
          let i = -1;
          const n = groups.length;
          let d;
          while (++i < n) {
            d = groups[i];
            path.push('M', x(d.key), ',', height, 'V', y(d.value), 'h9V', height);
          }
          return path.join('');
        }
  
        function resizePath(d) {
          const e = +(d.type === 'e');
          const x = e ? 1 : -1;
          const y = height / 3;
          return `M${0.5 * x},${y}A6,6 0 0 ${e} ${6.5 * x},${y + 6}V${2 * y - 6}A6,6 0 0 ${e} ${0.5 * x},${2 * y}ZM${2.5 * x},${y + 8}V${2 * y - 8}M${4.5 * x},${y + 8}V${2 * y - 8}`;
        }
      }
  
      brush.on('start.chart', function () {
        const div = d3.select(this.parentNode.parentNode.parentNode);
        div.select('.title-reset a').style('display', null);
      });
  
      brush.on('brush.chart', function () {
        const g = d3.select(this.parentNode);
        const brushRange = d3.event.selection || d3.brushSelection(this); // attempt to read brush range
        const xRange = x && x.range(); // attempt to read range from x scale
        let activeRange = brushRange || xRange; // default to x range if no brush range available
  
        const hasRange = activeRange &&
          activeRange.length === 2 &&
          !isNaN(activeRange[0]) &&
          !isNaN(activeRange[1]);
  
        if (!hasRange) return; // quit early if we don't have a valid range
  
        // calculate current brush extents using x scale
        let extents = activeRange.map(x.invert);
  
        // if rounding fn supplied, then snap to rounded extents
        // and move brush rect to reflect rounded range bounds if it was set by user interaction
        if (round) {
          extents = extents.map(round);
          activeRange = extents.map(x);
  
          if (
            d3.event.sourceEvent &&
            d3.event.sourceEvent.type === 'mousemove'
          ) {
            d3.select(this).call(brush.move, activeRange);
          }
        }
  
        // move brush handles to start and end of range
        g.selectAll('.brush-handle')
          .style('display', null)
          .attr('transform', (d, i) => `translate(${activeRange[i]}, 0)`);
  
        // resize sliding window to reflect updated range
        g.select(`#clip-${id} rect`)
          .attr('x', activeRange[0])
          .attr('width', activeRange[1] - activeRange[0]);
  
        // filter the active dimension to the range extents
        dimension.filterRange(extents);
  
        // re-render the other charts accordingly
        renderAll();
      });
  
      brush.on('end.chart', function () {
        // reset corresponding filter if the brush selection was cleared
        // (e.g. user "clicked off" the active range)
        if (!d3.brushSelection(this)) {
          reset(id);
        }
      });
  
      chart.margin = function (_) {
        if (!arguments.length) return margin;
        margin = _;
        return chart;
      };
  
      chart.x = function (_) {
        if (!arguments.length) return x;
        x = _;
        axis.scale(x);
        return chart;
      };
  
      chart.y = function (_) {
        if (!arguments.length) return y;
        y = _;
        return chart;
      };
  
      chart.dimension = function (_) {
        if (!arguments.length) return dimension;
        dimension = _;
        return chart;
      };
  
      chart.filter = _ => {
        if (!_) dimension.filterAll();
        brushDirty = _;
        return chart;
      };
  
      chart.group = function (_) {
        if (!arguments.length) return group;
        group = _;
        return chart;
      };
  
      chart.round = function (_) {
        if (!arguments.length) return round;
        round = _;
        return chart;
      };
  
      chart.gBrush = () => gBrush;
  
      return chart;
    }
  });
});


//Setup SVG size vars
var margin = { top: 20, right: 20, bottom: 30, left: 40 },
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

//Used to color code based on position
var color = d3.scaleOrdinal(d3.schemeCategory20);
let charts = [];
let filter_height, filter_weight, filter_year;
let player;
let playerNames = [];

var lists = [
  d3.select("#top-height"),
  d3.select("#bot-height"),
  d3.select("#top-weight"),
  d3.select("#bot-weight")
];

let x, y;

//Initialize the "top 10" lists
var list = d3
  .selectAll(".list")
  .data(lists)
  .each(function(list) {
    list.data([playerList]);
  });

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

function processPlayerData(players) {
  //Preprocess player data
  players.forEach(function(d, index, object) {
    d.height = +d.height;
    d.weight = +d.weight;
    d.year_start = +d.year_start;
    d.year_end = +d.year_end;
    playerNames.push(d.name);
  });

  return players;
}

//Handles rendering plot with updated data
function updatePlot() {

  //Get updated data
  players = filter_year.top(Infinity);
  playerNames = players.map(function(a) {
    return a.name;
  });

  //Add all dots with updated data
  plot = plotSVG.selectAll("circle").data(players);

  plot.exit().remove();

  //Update new players
  plot.enter()
    .append("circle")
    .attr("r", 4)
  .merge(plot)
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
      d3.select(this)
        .moveToFront()
        .showPlayerInfo()
        .attr("r", 10)
        .style("fill", function(d) {
          return color(d.position);
        });
    })
    .on("mouseout", function(d) {
      d3.select(this)
        .hidePlayerInfo()
        .attr("r", 4)
        .style("fill", "var(--main_dark)");
    });
}

const defineCharts = () => {
  chart = d3
    .selectAll(".chart")
    .data(charts);
};

//Renders filters and plots
const renderAll = () => {
  chart.each(render);
  list.each(render);
  updatePlot();
  d3.select("#active").text(player.groupAll().value());
}

function createCrossfilters(players) {
  //Create crossfilters for the players
  player = crossfilter(players);
  filter_year = player.dimension(function(d) {
    return d.year_start;
  });
  var filter_years = filter_year.group(Math.floor);
  filter_weight = player.dimension(function(d) {
    return d.weight;
  });
  var filter_weights = filter_weight.group(function(d) {
    return Math.floor(d / 10) * 10;
  });
  filter_height = player.dimension(function(d) {
    return d.height;
  });
  filter_heights = filter_height.group(Math.floor);
  var filter_position = player.dimension(function(d) {
    return d.position;
  });

  charts = [
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
}

//Renderer
function render(method) {
  d3.select(this).call(method);
}

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
    
    d3.select(this).selectAll(".player")
      .remove();

    var player = d3.select(this)
      .selectAll(".player")
      .data(topPlayers);

    var playerEnter = player.enter()
      .append("div")
      .attr("class", "player");

    playerEnter.append("div")
      .attr("class", "name")
      .text(function(d) {
        return d.name;
      });

    playerEnter.append("div")
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

//Import and handle the data
d3.csv("data/player_data.csv", function(error, players) {
  if (error) throw error;

  //List of player names for autofill
  players = processPlayerData(players);

  createCrossfilters(players);
  defineCharts();

  // Render the total.
  d3.selectAll("#total").text(players.length);

  //Render the plot axiss
  x = d3.scaleLinear().range([0, width]).domain(
    d3.extent(players, function(d) {
      return d.weight;
    })
  ).nice();
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

  window.filter = filters => {
    filters.forEach((d, i) => { charts[i].filter(d); });
    renderAll();
  };

  window.reset = i => {
    charts[i].filter(null);
    renderAll();
  };

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

  //Appends player info to the SVG
  d3.selection.prototype.showPlayerInfo = function(d) {
    playerInfo = this._groups[0][0].__data__;
    $(".playerInfo").css("display", "block");

    plotSVG.select("#playerInfoName").text(playerInfo.name).style();
    plotSVG.select("#playerInfoBirth").text("Born: " + playerInfo.birth_date);
    plotSVG.select("#playerInfoCollege").text("College: " + playerInfo.college);
    plotSVG.select("#playerInfoPos").text(positions[playerInfo.position][0]);
    plotSVG.select("#playerInfoHeight").text(playerInfo.height + " inches");
    plotSVG.select("#playerInfoWeight").text(playerInfo.weight + " lbs");
    plotSVG.select("#playerInfoRookieYear").text("Rookie Year: " + playerInfo.year_start);
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
});

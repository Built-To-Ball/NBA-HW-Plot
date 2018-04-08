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
    var thePlayer = d3.selectAll("circle").filter(function(d) {
      return d.name.toLowerCase() == searchedPlayer;
    });

    //Reset previously searched players
    var prevPlayer = plotSVG.selectAll(".searched");

    if (prevPlayer._groups[0].length > 0) {
      prevPlayer
        .transition()
        .duration(250)
        .attr("r", 4)
        .style("fill", "var(--main_dark");

      prevPlayer.classed("searched", false).hidePlayerInfo();
    }

    //Make changes to selected player if name matches
    if (thePlayer._groups[0].length > 0) {
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
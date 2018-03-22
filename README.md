# NBA Height vs Weight
NBA Historical Height vs Weight Interactive Scatter Plot

![BTB-HvW](assets/screenshots/preview.png)

## Overview

Interactive scatter plot including all 4550 players to have ever played in the NBA dating back to 1947.
The players are plotted using their height (inches) and weight (lbs).

## Details
The plot can be filtered by a player's height, weight, or rookie year, implemented using Crossfilter.js.
![BTB-HvW2](assets/screenshots/preview2.png)

When hovering over a player, a player's additional information can be seen on the plot.
![BTB-HvW2](assets/screenshots/preview3.png)

Using jQuery UI's autocomplete widget, a player search has been implemented to search through the thousands of players.
When searching, simply press UP, DOWN, or double click on a player name to select the player, and the player will be highlighted on the plot.

Created using D3.js and data scraped from basketball-reference.com
//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){
//pseudo-global variables
var attrArray = ["dhs_Stunting", "dhs_Stunting_U_UI", "dhs_Stunting_L_UI", "dhs_Wasting", "dhs_Wasting_U_UI", "dhs_Wasting_L_UI", "dhs_Underweight", "dhs_Underweight_U_UI", "dhs_Underweight_L_UI",  "ihme_Stunting", "ihme_Stunting_Upper", "ihme_Stunting_Lower","ihme_Wasting",	"ihme_Wasting_Upper", "ihme_Wasting_Lower",	"ihme_UnderW", "ihme_UnderW_Upper", "ihme_UnderW_Lower"];
var expressed = attrArray[0];    

    
//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 473,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
    .range([463, 0])
    .domain([0, 100])
    
    
//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    //map frame dimensions
    var width = window.innerWidth * .5,
    height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on Zambia
    var projection = d3.geoAlbers()
        .center([27.5, -12.8])
        .rotate([0, 0, 0])
        .parallels([0, 25])
        .scale(2500)
        .translate([width / 2, height / 2]);
    
    var path = d3.geoPath()
        .projection(projection)
    
    //use promises to parallelize asynchronous data loading
    
    var files = ["data/zambia_ihme_dhs_data.json","data/southern_africa_lsib2.json","data/zambia_adm2.json"]
    var promises = [];
    
    files.forEach(function(url) {
        promises.push(d3.json(url))
    });

    Promise.all(promises).then(function(values) {
        var africa = topojson.feature(values[1], values[1].objects.southern_africa_lsib2)
        var zambia = topojson.feature(values[2], values[2].objects.zambia_adm2).features
        var csvData = values[0]
        //console.log(africa)
        console.log(zambia)

            
        //add africa countries to map
        var countries = map.append("path")
            .datum(africa)
            .attr("class", "countries")
            .attr("d", path);
        
        //join csv data to GeoJSON enumeration units
        zambia = joinData(zambia, csvData);
         //create the color scale
        var colorScale = makeColorScale(csvData);
        //add enumeration units to the map
        setEnumerationUnits(zambia, map, path,colorScale);
        //add coordinated visualization to the map
        setChart(csvData, colorScale);
        //add dropdown to the map
        createDropdown(csvData);

    });

};
    

//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 100]);

    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.Name_2;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", function(d){
            highlightBar(d);
        })
        .on("mouseout", function(d){
            dehighlightBar(d);
        })
        .on("mousemove", function(d){
            moveLabel(d);
        });
    
     var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Prevalence of " + expressed  );

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    
     //set bar positions, heights, and colors
    updateChart(bars, csvData.length, colorScale);
};
    
    
function joinData(zambia, csvData){
    //...DATA JOIN LOOPS FROM EXAMPLE 1.1
         //variables for data join
        for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.Name_2; //the CSV primary key
         //loop through geojson regions to find correct region
        for (var a=0; a<zambia.length; a++){

            var geojsonProps = zambia[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.Name_2; //the geojson primary key

            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
    };
    return zambia;
};

    
function makeColorScale(data){
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
    };
    
function setEnumerationUnits(zambia, map, path, colorScale){

    //add France regions to map
    var regions = map.selectAll(".regions")
        .data(zambia)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "regions " + d.properties.Name_2;
        })
        .attr("d", path)
        .style("fill", function(d){
             return choropleth(d.properties, colorScale);
        })
        .on("mouseover", function(d){
            highlight(d);
        })
         .on("mouseout", function(d){
            dehighlight(d);
        })
         .on("mousemove", moveLabel);

        
    
    var desc = regions.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};
    
//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};    

//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)});

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};
//dropdown change listener handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var regions = d3.selectAll(".regions")
         .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });
    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(1000);
    //set bar positions, heights, and colors
    updateChart(bars, csvData.length, colorScale);
};

//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
    var chartTitle = d3.select(".chartTitle")
        .text("Prevalence of " + expressed);
};

function highlight(props){
    //console.log(props)
    //change stroke
    var selected = d3.selectAll("."+ props.srcElement.__data__.properties.Name_2)
       .style("stroke", "blue")
       .style("stroke-width", "2");
    //setLabel
    setLabel(props)
};
    
function highlightBar(props){
    console.log(props)
    //change stroke
    var selected = d3.selectAll("."+ props.srcElement.__data__.Name_2)
       .style("stroke", "blue")
       .style("stroke-width", "2");
    //setLabel
    setLabelBar(props)
};
    
    
function dehighlight(props){
    var selected = d3.selectAll("."+ props.srcElement.__data__.properties.Name_2)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
    d3.select(".infolabel")
        .remove()
};
    
  
function dehighlightBar(props){
    var selected = d3.selectAll("."+ props.srcElement.__data__.Name_2)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
    d3.select(".infolabel")
        .remove()
};

//function to create dynamic label
function setLabel(props){
    //label content
    //console.log(props)
    var labelAttribute = "<h1>" +   props.srcElement.__data__.properties.Name_2 +
        "</h1><b>" + expressed + ":" + props.srcElement.__data__.properties[expressed]  + "</b>";
    //console.log(labelAttribute)
    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.srcElement.__data__.properties.Name_2 + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};
    
//function to create dynamic label
function setLabelBar(props){
    //label content
    //console.log(props)
    var labelAttribute = "<h1>" + props.srcElement.__data__[expressed] +
        "</h1><b>" + expressed + "</b>";
    //console.log(labelAttribute)
    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.srcElement.__data__.Name_2 + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};
    
//Example 2.8 line 1...function to move info label with mouse
function moveLabel(props){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;
    console.log(props.clientY)
    //use coordinates of mousemove event to set label coordinates
    var x1 = props.clientX + 10,
        y1 = props.clientY - 75,
        x2 = props.clientX - labelWidth - 10,
        y2 = props.clientY + 25;
    

    //horizontal label coordinate, testing for overflow
    var x = props.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = props.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};
    
})(); //last line of main.js
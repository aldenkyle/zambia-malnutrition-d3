//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){
//pseudo-global variables
var attrArray = ["Stunting","Stunting Uncertainty", "Wasting","Wasting Uncertainty", "Underweight", "Underweight Uncertainty","dataset"];
var expressed = attrArray[0];    

    
//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 400,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding ,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")",
    maxValueY = 65;

//create original input for Chart height 

    
//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
    .range([chartHeight, 0])
    .domain([0, maxValueY])
    
    
//begin script when window loads
window.onload = setMap();


//set up choropleth map
function setMap(){
    //map frame dimensions
    var width = window.innerWidth * .5,
    height = 400;

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
        .scale(2300)
        .translate([width / 2, height / 2]);
    
    var path = d3.geoPath()
        .projection(projection)
    
    //use promises to parallelize asynchronous data loading
    
    var files = ["data/zambia_ihme.json","data/southern_africa_lsib2.json","data/zambia_adm2.json", "data/zambia_dhs.json"]
    var promises = [];
    
    files.forEach(function(url) {
        promises.push(d3.json(url))
    });

    Promise.all(promises).then(function(values) {
        var africa = topojson.feature(values[1], values[1].objects.southern_africa_lsib2)
        var zambia = topojson.feature(values[2], values[2].objects.zambia_adm2).features
        var csvData = values[0]
        var csvData2 = values[3]
        var group = "ihme"
        //console.log(csvData)
        //console.log(zambia)

            
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
        createDropdown(csvData,csvData2, group);
                            
        //create a text element for the chart title
        var mapTitle = map.append("text")
            .attr("x", 20)
            .attr("y", 30)
            .attr("class", "mapTitle")
            .text("IHME Prevalence of " + expressed  );
        setMap2()

    });

};
    

    
//set up choropleth map for DHS data
function setMap2(){
    //map frame dimensions
    var width = window.innerWidth * .5,
    height = 400;

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
        .scale(2300)
        .translate([width / 2, height / 2]);
    
    var path = d3.geoPath()
        .projection(projection)
    
    //use promises to parallelize asynchronous data loading
    
    var files = ["data/zambia_ihme.json","data/southern_africa_lsib2.json","data/zambia_adm2.json", "data/zambia_dhs.json"]
    var promises = [];
    
    files.forEach(function(url) {
        promises.push(d3.json(url))
    });

    Promise.all(promises).then(function(values) {
        var africa = topojson.feature(values[1], values[1].objects.southern_africa_lsib2)
        var zambia2 = topojson.feature(values[2], values[2].objects.zambia_adm2).features
        var csvData2 = values[3]
        var group = "dhs"
        //console.log(africa)
        //console.log(zambia)

            
        //add africa countries to map
        var countries = map.append("path")
            .datum(africa)
            .attr("class", "countries")
            .attr("d", path);
        
        //join csv data to GeoJSON enumeration units
        zambia2 = joinData(zambia2, csvData2);
        //console.log(zambia2)
         //create the color scale
        var colorScale = makeColorScale(csvData2);
        //add enumeration units to the map
        setEnumerationUnits2(zambia2, map, path,colorScale);
        //add coordinated visualization to the map
        
            
        //create a text element for the chart title
        var mapTitle2 = map.append("text")
            .attr("x", 20)
            .attr("y", 30)
            .attr("class", "mapTitle2")
            .text("DHS Prevalence of " + expressed  );

        setChart2(csvData2, colorScale);
        //updateOnDropdown(csvData2);
    });

};
    
function joinData(zambia2, csvData){
    //...DATA JOIN LOOPS FROM EXAMPLE 1.1
         //variables for data join
        for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.Name_2; //the CSV primary key
         //loop through geojson regions to find correct region
        for (var a=0; a<zambia2.length; a++){

            var geojsonProps = zambia2[a].properties; //the current region geojson properties
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
    return zambia2;
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){

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
    var titleText = (expressed.length > 12) ? ("IHME " + expressed + " interval"):("IHME Prevalence of " + expressed);
    
    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 35)
        .attr("y", 35)
        .attr("class", "chartTitle")
        .text(titleText  );

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
    maxValue = makeMaxValue(csvData)
    updateChart(bars, csvData.length, colorScale, maxValue);
};
    

//function to create coordinated bar chart
function setChart2(csvData, colorScale){

    //create a second svg element to hold the bar chart
    var chart2 = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart2");

    //create a rectangle for chart background fill
    var chartBackground = chart2.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);


    //set bars for each province
    var bars2 = chart2.selectAll(".bar2")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar2 " + d.Name_2;
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
    
     var desc = bars2.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

    //create a text element for the chart title
    var chartTitle2 = chart2.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle2")
        .text("Prevalence of " + expressed  );

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis2 = chart2.append("g")
        .attr("class", "axis2")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart2.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    
     //set bar positions, heights, and colors
    maxValue2 = makeMaxValue(csvData)
    updateChart2(bars2, csvData.length, colorScale, maxValue2);
};
    
    
function makeColorScale(data){
    var colorClasses = [
        "#006837",
        "#66bd63",
        "#ffffbf",
        "#fdae61",
        "#a50026"
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

function makeMaxValue(data){
    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };
    var maxValue = Math.max.apply(null, domainArray) * 1.2
    //console.log(maxValue)
    
    return maxValue;
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
            featureLabels2(d);
        })
         .on("mouseout", function(d){
            dehighlight(d);
        })
         .on("mousemove", moveLabel);

        
    
    var desc = regions.append("desc")
        .text('{"stroke": "#f7f7f7", "stroke-width": "0.25px"}');
};
    
function setEnumerationUnits2(zambia, map, path, colorScale){

    //add France regions to map
    var admin2s = map.selectAll(".admin2s")
        .data(zambia)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "admin2s " + d.properties.Name_2;
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

        
    
    var desc = admin2s.append("desc")
        .text('{"stroke": "#f7f7f7", "stroke-width": "0.25px"}');
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
function createDropdown(csvData,csvData2,group){
    var panel2h = $("#head-desc").height()
    //console.log(panel2h)
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .attr("top", (panel2h-30)+"px")
        .on("change", function(){
        changeAttribute(this.value, csvData, csvData2)});

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray.slice(0,6))
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};

//once we change the dropdown, change the colors
function changeAttribute(attribute, csvData, csvData2){
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);
    var colorScale2 = makeColorScale(csvData2);
    //build array of all values of the expressed attribute - getting max to reset the y axis
    var maxValue = makeMaxValue(csvData);
    var maxValue2 = makeMaxValue(csvData2);
    //recolor enumeration units
    var regions = d3.selectAll(".regions")
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });
    //recolor enumeration units
    var admin2s = d3.selectAll(".admin2s")
        .style("fill", function(d){
            return choropleth(d.properties, colorScale2)
        });
    //re-sort, resize, and recolor bars FOR CHART 1
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
    updateChart(bars, csvData.length, colorScale, maxValue);
    
    //re-sort, resize, and recolor bars FOR CHART 2
    var bars2 = d3.selectAll(".bar2")
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
    updateChart2(bars2, csvData.length, colorScale2, maxValue2);
};
    
//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale, maxValue){
    //console.log(chartHeight)
    //console.log(maxValue)
    var yScale = d3.scaleLinear()
    .range([chartHeight, 0])
    .domain([0, maxValue])
    
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 400 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
    var yAxis = d3.axisLeft()
        .scale(yScale);
        //place axis
    var axis = d3.select(".axis")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);
    var titleText = (expressed.length > 12) ? ("IHME " + expressed + " Interval"):("IHME Prevalence of " + expressed);
    var chartTitle = d3.select(".chartTitle")
        .text(titleText);
    var mapTitle = d3.select(".mapTitle")
        .text(titleText);
};
    
function updateChart2(bars, n, colorScale, maxValue2){
    //console.log(chartHeight)
    //console.log(maxValue2)
    var yScale = d3.scaleLinear()
    .range([chartHeight, 0])
    .domain([0, maxValue2])
    
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 400 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
    var yAxis = d3.axisLeft()
        .scale(yScale);
        //place axis
    
     var axis2 = d3.select(".axis2")
        .attr("class", "axis2")
        .attr("transform", translate)
        .call(yAxis);
    var titleText = (expressed.length > 12) ? ("DHS " + expressed + " Interval"):("DHS Prevalence of " + expressed);
    var chartTitle2 = d3.select(".chartTitle2")
        .text(titleText);
    var mapTitle2 = d3.select(".mapTitle2")
        .text(titleText);
};

function highlight(props){
    //console.log(props)
    //change stroke
    var selected = d3.selectAll("."+ props.srcElement.__data__.properties.Name_2)
       .style("stroke", "#fcf403")
       .style("stroke-width", "3");
    //setLabel
    setLabel(props)
};
    

function featureLabels2(props){
    //console.log(props)
    //change stroke
    var selected  = d3.selectAll(".regions."+ props.srcElement.__data__.properties.Name_2)
    var ihme = selected._groups[0][0].__data__.properties[expressed]
    var selected2  = d3.selectAll(".admin2s."+ props.srcElement.__data__.properties.Name_2)
    var dhs = selected2._groups[0][0].__data__.properties[expressed]
    //setLabel
};
    
function highlightBar(props){
    //console.log(props)
    //change stroke
    var selected = d3.selectAll("."+ props.srcElement.__data__.Name_2)
       .style("stroke", "#fcf403")
       .style("stroke-width", "3");
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
    var selected  = d3.selectAll(".regions."+ props.srcElement.__data__.properties.Name_2)
    var ihme = selected._groups[0][0].__data__.properties[expressed]
    var selected2  = d3.selectAll(".admin2s."+ props.srcElement.__data__.properties.Name_2)
    var dhs = selected2._groups[0][0].__data__.properties[expressed]
    var labelAttribute =  "<b>" + props.srcElement.__data__.properties.Name_2 +
        "</b><br> IHME " + expressed + ": " + ihme + "</b><br> DHS " + expressed + ": " + dhs ;
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
    var selected  = d3.selectAll(".regions."+ props.srcElement.__data__.Name_2)
    var ihme = selected._groups[0][0].__data__.properties[expressed]
    var selected2  = d3.selectAll(".admin2s."+ props.srcElement.__data__.Name_2)
    var dhs = selected2._groups[0][0].__data__.properties[expressed]
    var labelAttribute =  "<b>" + props.srcElement.__data__.Name_2 +
        "</b><br> IHME " + expressed + ": " + ihme + "</b><br> DHS " + expressed + ": " + dhs  ;
    //var labelAttribute = "<b>" + props.srcElement.__data__.Name_2 +
        "</b><br>" + expressed + ": " + props.srcElement.__data__[expressed];
    //console.log(labelAttribute)
    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.srcElement.__data__.Name_2 + "_label")
        .html(labelAttribute);
};
    
//Example 2.8 line 1...function to move info label with mouse
function moveLabel(props){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;
    //console.log(props.clientY)
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

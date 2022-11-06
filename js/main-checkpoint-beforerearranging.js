//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    //map frame dimensions
    var width = 740,
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
        console.log(africa)
        console.log(zambia)
        
        //variables for data join
        var attrArray = ["dhs_Stunting", "dhs_Stunting_U_UI", "dhs_Stunting_L_UI", "dhs_Wasting", "dhs_Wasting_U_UI", "dhs_Wasting_L_UI", "dhs_Underweight", "dhs_Underweight_U_UI", "dhs_Underweight_L_UI",  "ihme_Stunting", "ihme_Stunting_Upper", "ihme_Stunting_Lower","ihme_Wasting",	"ihme_Wasting_Upper", "ihme_Wasting_Lower",	"ihme_UnderW", "ihme_UnderW_Upper", "ihme_UnderW_Lower"];
        
        for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.Admin2; //the CSV primary key
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
        
        
        
        
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule
        
        //add africa countries to map
        var countries = map.append("path")
            .datum(africa)
            .attr("class", "countries")
            .attr("d", path);

        //add France regions to map
        var regions = map.selectAll(".regions")
            .data(zambia)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "regions " + d.properties.Name_2;
            })
            .attr("d", path);
    });
};
    

})(); //last line of main.js
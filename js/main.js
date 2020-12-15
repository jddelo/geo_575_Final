
//create blank function to create info window dialog when DOM is ready
$(function () {
    $("#infowindow").dialog({
        autoOpen: false,
        height: 400,
        width: 600
    
    });
    $(".info").click(function(){
        $("#infowindow").dialog("open");

    });

});   

//Define the fire marker icons
var fireIcon1 = L.icon({
    iconUrl: 'img/forest.png',
    iconSize: [10,10]
});

var fireIcon2 = L.icon({
    iconUrl: 'img/forest.png',
    iconSize: [25,25]
});

var fireIcon3 = L.icon({
    iconUrl: 'img/forest.png',
    iconSize: [40,40]
});

var fireIcon4 = L.icon({
    iconUrl: 'img/forest.png',
    iconSize: [55,55]
});

var fireIcon5 = L.icon({
    iconUrl: 'img/forest.png',
    iconSize: [90,90]
});

//Function to select icon size based on fire size
function iconByAcres(feature){
    
  var icon;
    
  if (feature.properties.BurnBndAc >= 499 && feature.properties.BurnBndAc < 1335) icon = fireIcon1;
    else if (feature.properties.BurnBndAc >= 1336 && feature.properties.BurnBndAc < 80383) icon = fireIcon2;
    else if (feature.properties.BurnBndAc >= 80384 && feature.properties.BurnBndAc < 190655) icon = fireIcon3;
    else if (feature.properties.BurnBndAc >= 190656 && feature.properties.BurnBndAc < 353548) icon = fireIcon4;
  else icon = fireIcon5;

  return icon;
};


var imagery = L.esri.basemapLayer('ImageryFirefly'),
    topo = L.esri.basemapLayer('Topographic'),
    gray = L.esri.basemapLayer('DarkGray'),
    
    places = L.esri.tiledMapLayer({
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer'}),
    
    //function to retrieve the fire data, style it based on acres burned, and symbolize with custom icon
    fires = L.esri.featureLayer({
        url: 'https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/mtbs_FODpoints_DD_wgs84/FeatureServer/0',
        where: "datefmt = '2000-01'",
        pointToLayer: function(feature, latlng) {return L.marker(latlng, {icon: iconByAcres(feature)})},
    }),
    
    
    //Function to retrieve and symbolize the drought data
    drought = L.esri.featureLayer({
    url: 'https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/Drought_Data_2000_2019/FeatureServer/0',
    //simplifyFactor: 0.35,
    useCors: true,
    where: "datefmt = '2000-01'",
    //timeField: 'modate',
    //precision: 5,
    //from: new Date('01/01/2000'),
    //to: new Date('01/31/2000')
    //ignoreRenderer: true,
    style: function (feature){
        if (feature.properties.DM === 4) {
            return {color: '#730000', fillOpacity: '0.7', opacity: '0.5', weight: 1};
        } else if (feature.properties.DM === 3) {
            return {color: '#e60000',  fillOpacity: '0.65',opacity: '0.5', weight: 1};
        } else if (feature.properties.DM === 2) {
            return {color: '#fa0',  fillOpacity: '0.55',opacity: '0.5', weight: 1};
        } else if (feature.properties.DM === 1) {
            return {color: '#fcd37f',  fillOpacity: '0.5', opacity: '0.5', weight: 1};
        } else {
            return {color: '#ff0',  fillOpacity: '0.4',opacity: '0.5', weight: 1};
        }
    }});

    states = L.esri.featureLayer({
    url: 'https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/UStates/FeatureServer/0',
    useCors: true,

    style: {fillColor: 'none', weight:1.5, color:'#8c8c8c'}
    });

    //Create pop up for fires
    fires.bindPopup(function (layer){
        return L.Util.template('<p>{BurnBndAc} Acres Burned in {datefmt}</p>', layer.feature.properties);

    });


//create map
function createMap(){
    
    var mymap = L.map('mapid', {
        center: [39, -95],
        zoom: 4,
        layers: [imagery, places, fires, drought]
    });
    

    //call getData function
    //getData(mymap);
    
    //get layers and add to layer control operator
    var baseMaps = {
        "Imagery": imagery,
        "Topographic": topo,
        "Gray": gray
    }
    var overlayMaps = {
        "Places": places,
        "Fires": fires,
        "Drought": drought, 
        "States": states
    }

    L.control.layers(baseMaps, overlayMaps).addTo(mymap);

    createSequenceControls(mymap);

    /*var yearquery = document.getElementById('yearselect');

    yearquery.addEventListener('change', function () {
        console.log("yearquery value =" + yearquery.value);
        console.log("type of yearquery: " + typeof yearquery.value);
        drought.setWhere(yearquery.value);
        fires.setWhere(yearquery.value);
        var nd = yearquery.value;
        var nd2 = nd.slice(-8, -1);
        console.log( nd2);
        $('#dateshown').html(nd2);

    }); */

    var yearquery = document.getElementById('yearselect');

    yearquery.addEventListener('change', function () {
        updateYear();
    });
};



//define popup object
function Popup(properties, attribute, layer, radius){
    this.properties = properties;
    this.layer = layer; 
    this.year = attribute;
    this.mortalities = this.properties[attribute];
    this.content = "<p><b>State:</b> " + this.properties.State + "</p><p><b>Cancer Mortalities in " + this.year + ":</b> " + this.mortalities + "</p>";
    this.bindToLayer = function(){
        this.layer.bindPopup(this.content, {
            offset: new L.Point(0, -radius)
        });
    };
};

//define update proportional symbols function 
function updatePropSymbols(mymap,attribute){
    mymap.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            var props = layer.feature.properties;
            //calculate radius based on value from currently selected year
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
            //create new popups based on new values
            var popup = new Popup(props, attribute, layer, radius);
            popup.bindToLayer();
            
            //run update legend function after symbols are updated
            updateLegend(mymap, attribute);
        };
    });
};

//create sequence controls for map data
function createSequenceControls(mymap){
    //extend the leaflet control class
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
        onAdd: function (mymap){
            //create new div for sequence controller & add all control buttons/slider
            var container = L.DomUtil.create('div', 'sequence-control-container');
            $(container).append('<p class = "curDate" id = "dateshown"></p>');
            $(container).append('<select class="year" id="yearselect"></select>');
            $(container).append('<input class ="range-slider" id="slider" type="range">');
            $(container).append('<button class="skip" id="reverse" title="Reverse">Reverse</button>');
            $(container).append('<button class="skip" id="forward" title="Forward">Skip</button>');


            //kill any mouse event listeners on the map
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
            });
            $(container).mousedown(function () {
                mymap.dragging.disable();
            });
            $(document).mouseup(function () {
                mymap.dragging.enable();
            });
            
            return container;
        }
    });
    // add the new div with sequence controls to the map
    mymap.addControl(new SequenceControl());

    //set properties for range slider
    $('.range-slider').attr({
        max: 11,
        min: 0,
        value: 0,
        step: 1
    });
    /*$('.year').html('<option value="datefmt = \'2000-01\'">2000</option>' +
                    '<option value="datefmt = \'2001-01\'">2001</option>' +
                    '<option value="datefmt = \'2002-01\'">2002</option>' +
                    '<option value="datefmt = \'2003-01\'">2003</option>' +
                    '<option value="datefmt = \'2004-01\'">2004</option>' +
                    '<option value="datefmt = \'2005-01\'">2005</option>' +
                    '<option value="datefmt = \'2006-01\'">2006</option>' +
                    '<option value="datefmt = \'2007-01\'">2007</option>' +
                    '<option value="datefmt = \'2008-01\'">2008</option>' +
                    '<option value="datefmt = \'2009-01\'">2009</option>' +
                    '<option value="datefmt = \'2010-01\'">2010</option>' +
                    '<option value="datefmt = \'2011-01\'">2011</option>' +
                    '<option value="datefmt = \'2012-01\'">2012</option>' +
                    '<option value="datefmt = \'2013-01\'">2013</option>' +
                    '<option value="datefmt = \'2014-01\'">2014</option>' +
                    '<option value="datefmt = \'2015-01\'">2015</option>' +
                    '<option value="datefmt = \'2016-01\'">2016</option>' +
                    '<option value="datefmt = \'2017-01\'">2017</option>' +
                    '<option value="datefmt = \'2018-01\'">2018</option>')  */
    $('.year').html('<option value="2000">2000</option>' +
                    '<option value="2001">2001</option>' +
                    '<option value="2002">2002</option>' +
                    '<option value="2003">2003</option>' +
                    '<option value="2004">2004</option>' +
                    '<option value="2005">2005</option>' +
                    '<option value="2006">2006</option>' +
                    '<option value="2007">2007</option>' +
                    '<option value="2008">2008</option>' +
                    '<option value="2009">2009</option>' +
                    '<option value="2010">2010</option>' +
                    '<option value="2011">2011</option>' +
                    '<option value="2012">2012</option>' +
                    '<option value="2013">2013</option>' +
                    '<option value="2014">2014</option>' +
                    '<option value="2015">2015</option>' +
                    '<option value="2016">2016</option>' +
                    '<option value="2017">2017</option>' +
                    '<option value="2018">2018</option>')
    //add arrow images to the skip buttons
    $('#reverse').html('<img src = "img/back.png">');
    $('#forward').html('<img src = "img/forward.png">');
    $('#dateshown').html('2000-01')

    //create logic for function controls
    $('.skip').click(function(){

        //get index value from slider
        var index = $('.range-slider').val();

        //toggle to next year if forward is pressed unless it goes outside of value range
        if ($(this).attr('id') == 'forward'){
            index++;
            index = index > 11 ? 0 : index;

        //toggle to last year if reverse is pressed unless it goes outside of value range
        } else {
            ($(this).attr('id') == 'reverse')
            index--;
            index = index < 0 ? 11 : index;
        };

        //update proportional symbols after new year is selected
        //updatePropSymbols(mymap, attributes[index]);
        updateMonth(index);

        
        //update the range slider to coincide with button pushes
        $('.range-slider').val(index);
        
    });

    //get the value fron the range slider to use for year index
    $('.range-slider').on('input', function(){
        var index = $(this).val();

    //update proportional symbols based on changes to slider
    //updatePropSymbols(mymap, attributes[index]);
    updateMonth(index);
    });
};

function updateMonth(rangeindex) {
    var curDate = document.getElementById('dateshown').innerHTML;

    console.log("ds= " + curDate);
    console.log(typeof curDate);
    if (rangeindex < 9){
        var newDate = curDate.slice(0,4) + "-0" + (rangeindex + 1).toString();
    } else {
        var newDate = curDate.slice(0,4) + "-" + (rangeindex + 1).toString();
    }
    console.log("newDate- " + newDate);
    var newQuery = "datefmt = '" + newDate + "'";
    console.log("newQuery- " + newQuery)
    drought.setWhere(newQuery);
    fires.setWhere(newQuery);
    $('#dateshown').html(newDate);
    
};

function updateYear() {
    var curDate = document.getElementById('dateshown').innerHTML;
        dateParts = curDate.split("-", 2);
        newYear = document.getElementById('yearselect').value;
        newDate = newYear + "-" + dateParts[1];
        newQuery = "datefmt = '" + newDate + "'";
        drought.setWhere(newQuery);
        fires.setWhere(newQuery);
        $('#dateshown').html(newDate);    
};




//create point layer from geojson layer
function pointToLayer(feature, latlng, attributes){
    var attribute = attributes[0];

    //set symbol properties
    var options = {
        fillColor: "#C71585",
        color: "#4C2882",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //get attribute values as numbers
    var attValue = Number(feature.properties[attribute]);

    //calculate radius based on values
    options.radius = calcPropRadius(attValue);

    //create the feature with the options chosen
    var layer = L.circleMarker(latlng, options);


    //create & bind a popup for newly created featues
     var popup = new Popup(feature.properties, attribute, layer, options.radius);
     popup.bindToLayer();

    //open popup for layer interaction, mouseover & click
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        click: function(){
           this.openPopup();
        }
    });
    return layer;
};

//create function for proportional symbols, set scale factor & do maths to calculate radius of symbols
function calcPropRadius(attValue) {
    var scaleFactor = .050;
    var area = attValue * scaleFactor;
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

//take data, create geojson layer & run pointToLayer to convert to layer & add to map
function createPropSymbols(data,mymap, attributes){
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(mymap);   
};


//process geojson data, create attribute array from input properties
function processData(data){
    var attributes = [];

    var properties = data.features[0].properties;
    //add years to attributes but keep state name separate
    for (var attribute in properties){
        if (attribute.indexOf("State") > -1){

        } else {
            attributes.push(attribute);
        };
    };
    return attributes;
};

//function to update legend upon input from user controls
function updateLegend(mymap, attribute){
    var year = attribute;
    //change text based on year selected
    $('#temporal-legend').html("Cancer Mortalities in " + year);
    //change symbol sizes based on data
    var circleValues = getCircleValues(mymap, attribute);

    for (var key in circleValues){
        var radius =calcPropRadius(circleValues[key]);
        $('#'+key).attr({
            cy:59-radius,
            r:radius
        });

        $('#'+key+'-text').text(Math.round(circleValues[key]*100)/100);
    };

} ; 

//create legend class by extending leaflet control
function createLegend(mymap, attributes){
    var LegendControl= L.Control.extend({
        options: {
            position: 'bottomleft'
        },
        //create div for legend
        onAdd: function(mymap) {
            var container = L.DomUtil.create('div', 'legend-control-container');
           //add temporal legend to legend div
           $(container).append('<div id="temporal-legend">')
            //set properties for svg marker
           var svg = '<svg id="attribute-legend" width="120px" height="80px">';

           var circles = {
               max:20,
               mean:40,
               min:60
           };

           for (var circle in circles){
               svg += '<circle class="legend-circle" id="' + circle + '" fill="#C71585" fill-opacity="0.8" stroke="#4C2882" cx="30"/>';
               svg += '<text id="' + circle + '-text" x="65" y = "' + circles[circle] + '"></text>';
           };

           svg += "</svg>";

           //add svg to legend
           $(container).append(svg);
           
           return container;        
        }
    });

    //add legend to map
    mymap.addControl(new LegendControl());

    //update legend based on any changes to sequence controls
    updateLegend(mymap, attributes[0]);
};

//get attribute values & prepare for legend
function getCircleValues(mymap, attribute){
    var min= Infinity,
    max = -Infinity;
    mymap.eachLayer(function(layer){
        if(layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            if(attributeValue < min){
                min=attributeValue;
            };
            if(attributeValue >max){
                max = attributeValue;
            };
        };
    });

    var mean = (max + min) / 2;

    return {
        max:max,
        mean:mean,
        min:min
    };
};

// set the dimensions and margins of the graph
var margin = {top: 50, right: 30, bottom: 50, left: 70},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

//Read the data
d3.csv("data/Drought_Data_by_State_Year.csv", function(data) {
    
    // Parse the date variable
    var parseDate = d3.timeParse("%Y-%m");
    
    //format acres
    data.forEach(function(d) {
      d.date = parseDate(d.date);
      d.Acres = +d.Acres;
    });

    // group the data: one array for each value of the X axis.
    var sumstat = d3.nest()
      .key(function(d) { return d.date;})
      .entries(data);

    // Stack the data: each group will be represented on top of each other
    var mygroups = ["D0", "D1", "D2", "D3", "D4"] // list of group names
    var mygroup = [1,2,3,4,5] // list of group names
    var stackedData = d3.stack()
      .keys(mygroup)
      .value(function(d, key){
        return d.values[key].Acres
      })
      (sumstat)
  
    console.log (stackedData);
  
    // Add X axis
    var x = d3.scaleTime()
      .domain(d3.extent(data, function (d) {
        return d.date;
      }))
      .range([ 0, width ]);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).ticks(10));

   
    // Add X axis label:
    svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", width)
      .attr("y", height+40 )
      .text("Time");
    
    // Add Y axis
    var y = d3.scaleLinear()
      .domain([0, d3.max(data, function(d) { return +d.Acres;  })*1.2])
      .range([ height, 0 ]);
    svg.append("g")
      .call(d3.axisLeft(y)
          .ticks(10)
          .tickSizeInner(0)
          .tickPadding(6)
          .tickSize(0, 0));
    
    // Add Y axis label:
    svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", -57)
      .attr("y", -20 )
      .text("Number of acres")
      .attr("text-anchor", "start")
   
    
    // color palette
    var color = d3.scaleOrdinal()
      .domain(mygroups)
      .range(['#ff0','#fcd37f','#fa0','#e60000','#730000'])

    // Add the area
    svg
      .selectAll("mylayers")
      .data(stackedData)
      .enter()
      .append("path")
      .style("fill", function(d) { name = mygroups[d.key-1] ;  return color(name); })
      .attr("d", d3.area()
        .x(function(d, i) { return x(d.data.key); })
        .y0(function(d) { return y(d[0]); })
        .y1(function(d) { return y(d[1]); })
    )

})

//create the map when the dom is ready
$(document).ready(createMap);
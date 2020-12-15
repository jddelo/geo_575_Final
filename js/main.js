
//create blank function to create info window dialog when DOM is ready
$(function () {
    $("#infowindow").dialog({
        autoOpen: false,
    
    });
    $(".info").click(function(){
        $("#infowindow").dialog("open");

    });

});   

//create variables for background data sources

var imagery = L.esri.basemapLayer('ImageryFirefly'),
    topo = L.esri.basemapLayer('Topographic'),
<<<<<<< Updated upstream
    fires = L.esri.Heat.featureLayer({
    //url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/CommunityAddressing/MapServer/0',
    url: 'https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/mtbs_FODpoints_DD_wgs84/FeatureServer/0',
    radius: 60});

=======
    gray = L.esri.basemapLayer('DarkGray'),
    
    places = L.esri.tiledMapLayer({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer'}),
    
    //Add the fire data, style it based on acres burned, and symbolize with custom icon
    fires = L.esri.featureLayer({
        url: 'https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/mtbs_FODpoints_DD_wgs84/FeatureServer/0',
        where: "datefmt = '2000-01'",
        pointToLayer: function(feature, latlng) {return L.marker(latlng, {icon: iconByAcres(feature)})},
    }),
    
    
    //Add and symbolize the drought data
    drought = L.esri.featureLayer({
        url: 'https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/Drought_Data_2000_2019/FeatureServer/0',
       //simplifyFactor: 0.35,
        useCors: true,
        where: "datefmt = '2000-01'",

        style: function (feature){
            if (feature.properties.DM === 4) {
                return {color: '#730000', fillOpacity: '0.7', opacity: '0.5', weight: 1};
            } else if (feature.properties.DM === 3) {
                return {color: '#e60000',  fillOpacity: '0.65',opacity: '0.5', weight: 1};
            } else if (feature.properties.DM === 2) {
                return {color: '#fa0',  fillOpacity: '0.65',opacity: '0.5', weight: 1};
            } else if (feature.properties.DM === 1) {
                return {color: '#fcd37f',  fillOpacity: '0.65', opacity: '0.5', weight: 1};
            } else {
                return {color: '#ff0',  fillOpacity: '0.5',opacity: '0.5', weight: 1};
            }
        }
    }),
    
    
    //Add state data
    states = L.esri.featureLayer({
    url: 'https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/States_drought/FeatureServer/0',
    useCors: true,
    simplifyFactor: 0.6,
    precision: 4,
    onEachFeature: onEachFeature,
    pane: 'statespane',
    style: {fillOpacity: 0, weight:1.5, color:'#8c8c8c'}
    });


    //Create pop up for fires
    fires.bindPopup(function (layer){
        return L.Util.template('<p>{BurnBndAc} Acres Burned</p>', layer.feature.properties);
    });
//    fires.on('mouseover', function () {
//        this.openPopup();
//    });
    fires.on('mouseout', function () {
        this.closePopup();
    });
>>>>>>> Stashed changes

//create map
function createMap(){
    
    var mymap = L.map('mapid', {
        center: [39, -95],
        zoom: 2,
        layers: [imagery, fires]
    });
    

    //call getData function
    getData(mymap);
    
    //get layers and add to layer control operator
    var baseMaps = {
        "Imagery": imagery,
        "Topographic": topo
    }
    var overlayMaps = {
        "Fires": fires
    }

    L.control.layers(baseMaps, overlayMaps).addTo(mymap);
};

<<<<<<< Updated upstream
=======
    //run the create sequence control function
    createSequenceControls(mymap);
    
    newLegend(mymap);
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
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

=======
>>>>>>> Stashed changes
//create sequence controls for map data
function createSequenceControls(mymap, attributes){
    //extend the leaflet control class
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
        onAdd: function (mymap){
            //create new div for sequence controller & add all control buttons/slider
            var container = L.DomUtil.create('div', 'sequence-control-container');
            $(container).append('<input class ="range-slider" type="range">');
            $(container).append('<button class="skip" id="reverse" title="Reverse">Reverse</button>');
            $(container).append('<button class="skip" id="forward" title="Forward">Skip</button>');

            
            return container;
        }
    });
    // add the new div with sequence controls to the map
    mymap.addControl(new SequenceControl());

    //set properties for range slider
    $('.range-slider').attr({
        max: 9,
        min: 0,
        value: 0,
        step: 1
    });

    //add arrow images to the skip buttons
    $('#reverse').html('<img src = "img/back.png">');
    $('#forward').html('<img src = "img/forward.png">');

    //create logic for function controls
    $('.skip').click(function(){

        //get index value from slider
        var index = $('.range-slider').val();

        //toggle to next year if forward is pressed unless it goes outside of value range
        if ($(this).attr('id') == 'forward'){
            index++;
            index = index > 9 ? 0 : index;

        //toggle to last year if reverse is pressed unless it goes outside of value range
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            index = index < 0 ? 9 : index;
        };

        //update proportional symbols after new year is selected
        updatePropSymbols(mymap, attributes[index]);

        
        //update the range slider to coincide with button pushes
        $('.range-slider').val(index);
        
    });

    //get the value fron the range slider to use for year index
    $('.range-slider').on('input', function(){
        var index = $(this).val();

<<<<<<< Updated upstream
    //update proportional symbols based on changes to slider
    updatePropSymbols(mymap, attributes[index]);
=======
    //get the value of the slider upon input and change month
    updateMonth(index);
    });
};

//function to change the month being displayed
function updateMonth(rangeindex) {
    var curDate = document.getElementById('dateshown').innerHTML;
    if (rangeindex < 10){
        var newDate = curDate.slice(0,4) + "-0" + rangeindex.toString();
    } else {
        var newDate = curDate.slice(0,4) + "-" + rangeindex.toString();
    }
    var newQuery = "datefmt = '" + newDate + "'";
    console.log("newQuery- " + newQuery)
    drought.setWhere(newQuery);
    fires.setWhere(newQuery);
    $('#dateshown').html(newDate);
    
};

//create function to change the year being displayed
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

function highlightState(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 4,
        color: '#000000',
        fillOpacity: 0
    });
};

function unhighlightState(e) {
    states.resetStyle(e.target);
    //states.setStyle({
      //  fillColor: 'none', 
        //weight:1.5, 
        //color:'#8c8c8c'
    //});
};

function onEachFeature(feature, states) {
    states.on({
        mouseover: highlightState,
        mouseout: unhighlightState
>>>>>>> Stashed changes
    });
};

//create point layer from geojson layer
//function pointToLayer(feature, latlng, attributes){
//    var attribute = attributes[0];
//
//    //set symbol properties
//    var options = {
//        fillColor: "#C71585",
//        color: "#4C2882",
//        weight: 1,
//        opacity: 1,
//        fillOpacity: 0.8
//    };
//
//    //get attribute values as numbers
//    var attValue = Number(feature.properties[attribute]);
//
//    //calculate radius based on values
//    options.radius = calcPropRadius(attValue);
//
//    //create the feature with the options chosen
//    var layer = L.circleMarker(latlng, options);
//
//
//    //create & bind a popup for newly created featues
//     var popup = new Popup(feature.properties, attribute, layer, options.radius);
//     popup.bindToLayer();
//
//    //open popup for layer interaction, mouseover & click
//    layer.on({
//        mouseover: function(){
//            this.openPopup();
//        },
//        click: function(){
//           this.openPopup();
//        }
//    });
//    return layer;
//};

//create function for proportional symbols, set scale factor & do maths to calculate radius of symbols
//function calcPropRadius(attValue) {
//    var scaleFactor = .050;
//    var area = attValue * scaleFactor;
//    var radius = Math.sqrt(area/Math.PI);
//
//    return radius;
//};

//take data, create geojson layer & run pointToLayer to convert to layer & add to map
//function createPropSymbols(data,mymap, attributes){
//    L.geoJson(data, {
//        pointToLayer: function(feature, latlng){
//            return pointToLayer(feature, latlng, attributes);
//        }
//    }).addTo(mymap);   
//};


//process geojson data, create attribute array from input properties
//function processData(data){
//    var attributes = [];
//
//    var properties = data.features[0].properties;
//    //add years to attributes but keep state name separate
//    for (var attribute in properties){
//        if (attribute.indexOf("State") > -1){
//
//        } else {
//            attributes.push(attribute);
//        };
//    };
//    return attributes;
//};

//function to update legend upon input from user controls
//function updateLegend(mymap, attribute){
//    var year = attribute;
//    //change text based on year selected
//    $('#temporal-legend').html("Cancer Mortalities in " + year);
//    //change symbol sizes based on data
//    var circleValues = getCircleValues(mymap, attribute);
//
//    for (var key in circleValues){
//        var radius =calcPropRadius(circleValues[key]);
//        $('#'+key).attr({
//            cy:59-radius,
//            r:radius
//        });
//
//        $('#'+key+'-text').text(Math.round(circleValues[key]*100)/100);
//    };
//
//} ; 


function newLegend(mymap){
    
    var legend = L.control({position: "bottomleft"});

    legend.onAdd = function(mymap){
        var div = L.DomUtil.create("div", "legend");
        div.innerHTML += "<h4>Fire Size (Acres)</h4>";
        div.innerHTML += '<img src="img/forest.png" height="10" width ="10"><text> < 1k</text><br>';
        div.innerHTML += '<img src="img/forest.png" height="25" width ="25"><span> 1k - 5k</span><br>';
        div.innerHTML += '<img src="img/forest.png" height="40" width ="40"><span> 5k - 50k</span><br>';
        div.innerHTML += '<img src="img/forest.png" height="55" width ="55"><span> 50k - 100k</span><br>';
        div.innerHTML += '<img src="img/forest.png" height="90" width ="90"><span> > 100k</span><br>';

      return div;
    };
 
    legend.addTo(mymap);  

};


//create legend class by extending leaflet control
//function createLegend(mymap, attributes){
//    var LegendControl= L.Control.extend({
//        options: {
//            position: 'bottomright'
//        },
//        //create div for legend
//        onAdd: function(mymap) {
//            var container = L.DomUtil.create('div', 'legend-control-container');
//           //add temporal legend to legend div
//           $(container).append('<div id="temporal-legend">')
//            //set properties for svg marker
//           var svg = '<svg id="attribute-legend" width="120px" height="80px">';
//
//           var circles = {
//               max:20,
//               mean:40,
//               min:60
//           };
//
//           for (var circle in circles){
//               svg += '<circle class="legend-circle" id="' + circle + '" fill="#C71585" fill-opacity="0.8" stroke="#4C2882" cx="30"/>';
//               svg += '<text id="' + circle + '-text" x="65" y = "' + circles[circle] + '"></text>';
//           };
//
//           svg += "</svg>";
//
//           //add svg to legend
//           $(container).append(svg);
//           
//           return container;        
//        }
//    });
//
//    //add legend to map
//    mymap.addControl(new LegendControl());

    //update legend based on any changes to sequence controls
    //updateLegend(mymap, attributes[0]);
//};

//get attribute values & prepare for legend
//function getCircleValues(mymap, attribute){
//    var min= Infinity,
//    max = -Infinity;
//    mymap.eachLayer(function(layer){
//        if(layer.feature){
//            var attributeValue = Number(layer.feature.properties[attribute]);
//
//            if(attributeValue < min){
//                min=attributeValue;
//            };
//            if(attributeValue >max){
//                max = attributeValue;
//            };
//        };
//    });
//
//    var mean = (max + min) / 2;
//
//    return {
//        max:max,
//        mean:mean,
//        min:min
//    };
//};

//use ajax to get geojson data, pass the response data into the functions
function getData(map){
    //load the data
    $.ajax("data/1999-2019_V3.geojson", {
        dataType: "json",
        success: function(response){

            //create a Leaflet GeoJSON layer and add it to the map
            L.geoJson(response).addTo(map);
        }
    });
};

//function getData(mymap){
//    //load the data
//    $.ajax("data/CancerStats.geojson", {
//        dataType: "json",
//        success: function(response){
//            var attributes = processData(response);
//            createPropSymbols(response,mymap, attributes);
//            createSequenceControls(mymap, attributes);
//            createLegend(mymap, attributes);
//            
//        }
//    });
//};


//create the map when the dom is ready
$(document).ready(createMap);
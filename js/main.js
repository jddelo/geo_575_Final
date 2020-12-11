
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

var fireIcon = L.icon({
    iconUrl: 'img/forest.png',
    iconSize: [20,20]
});

var imagery = L.esri.basemapLayer('ImageryFirefly'),
    topo = L.esri.basemapLayer('Topographic'),
    gray = L.esri.basemapLayer('DarkGray'),
    
    places = L.esri.tiledMapLayer({
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer'}),
    
    fires = L.esri.featureLayer({
    url: 'https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/mtbs_FODpoints_DD_wgs84/FeatureServer/0',
    pointToLayer: function(feature, latlng) {
        return L.marker(latlng, {
            icon: fireIcon
        });
    }}),

    drought = L.esri.featureLayer({
    url: 'https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/Drought_Data_2000_2019/FeatureServer/0',
    //simplifyFactor: 0.35,
    useCors: true,
    where: "ddate = '01/04/2000'",
    timeField: 'modate',
    //precision: 5,
    //from: new Date('01/01/2000'),
    //to: new Date('01/31/2000')
   // ignoreRenderer: true,
    style: function (feature){
        if (feature.properties.DM === 4) {
            return {fillColor: '#73004C', fillOpacity: '0.5', stroke: 'none'};
        } else if (feature.properties.DM === 3) {
            return {fillColor: '#A80084', fillOpacity: '0.5', stroke: 'none'};
        } else if (feature.properties.DM === 2) {
            return {fillColor: '#FF73DF', fillOpacity: '0.5', stroke: 'none'};
        } else if (feature.properties.DM === 1) {
            return {fillColor: '#FFAA00', fillOpacity: '0.5', stroke: 'none'};
        } else {
            return {fillColor: '#FFFF00', fillOpacity: '0.5', stroke: 'none'};
        }
    }});

    states = L.esri.featureLayer({
    url: 'https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/UStates/FeatureServer',
    useCors: true,
    style: {fillColor: 'none', stroke: 'none'}
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
            $(container).append('<input class ="range-slider" type="range">');
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
        max: 227,
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

    //update proportional symbols based on changes to slider
    updatePropSymbols(mymap, attributes[index]);
    });
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

//use ajax to get geojson data, pass the response data into the functions
//function getData(map){
//    //load the data
//    $.ajax("data/1999-2019_V3.geojson", {
//        dataType: "json",
//        success: function(response){
//
//            //create a Leaflet GeoJSON layer and add it to the map
//            L.geoJson(response).addTo(map);
//        }
//    });
//};


var attributes = L.esri.query({
    url: "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/Drought_Data_2000_2019/FeatureServer/0"
  });
 
attributes.distinct('dddate').orderBy('modate', 'ASC').limit(20000);

attributes.run(function(error, featureCollection, response){
    if(error) {
        console.log(error);
        return;
    }
    console.log(featureCollection);
})

console.log(attributes);


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
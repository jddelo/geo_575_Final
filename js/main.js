
//create blank function to create info window dialog when DOM is ready
$(function () {
    $("#infowindow").dialog({
        autoOpen: true,
        height: 400,
        width: 900
    
    });
    $("#infowindow").scrollTop(0);
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
    
  if (feature.properties.BurnBndAc >= 1 && feature.properties.BurnBndAc < 1000) icon = fireIcon1;
    else if (feature.properties.BurnBndAc >= 1000 && feature.properties.BurnBndAc < 5000) icon = fireIcon2;
    else if (feature.properties.BurnBndAc >= 5000 && feature.properties.BurnBndAc < 50000) icon = fireIcon3;
    else if (feature.properties.BurnBndAc >= 50000 && feature.properties.BurnBndAc < 100000) icon = fireIcon4;
  else icon = fireIcon5;

  return icon;
};

//Load basemaps
var imagery = L.esri.basemapLayer('ImageryFirefly'),
    topo = L.esri.basemapLayer('Topographic'),
    gray = L.esri.basemapLayer('DarkGray'),
    
    //add places data
    places = L.esri.tiledMapLayer({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer'
    }),
    
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
                return {color: '#640000', fillOpacity: '0.7', opacity: '0.5', weight: 1};
            } else if (feature.properties.DM === 3) {
                return {color: '#fe0000',  fillOpacity: '0.65',opacity: '0.5', weight: 1};
            } else if (feature.properties.DM === 2) {
                return {color: '#fe6603',  fillOpacity: '0.65',opacity: '0.5', weight: 1};
            } else if (feature.properties.DM === 1) {
                return {color: '#ffcb99',  fillOpacity: '0.65', opacity: '0.5', weight: 1};
            } else {
                return {color: '#fffe03',  fillOpacity: '0.5',opacity: '0.5', weight: 1};
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
        return L.Util.template('<p>Name: {Incid_Name}<br> {BurnBndAc} Acres Burned</p>', layer.feature.properties);
    });

    fires.on('mouseout', function () {
        this.closePopup();
    });

    //Create pop up for states
    states.on('click', function (evt) {
        feature = evt.layer.feature;
        var statename = feature.properties.STATE_ABBR;
        makeChart(statename);
    });

//create map
function createMap(){
    
    var mymap = L.map('mapid', {
        center: [39, -95],
        zoom: 4,
        layers: [imagery, fires, drought, states]
    });
    
    //get layers and add to layer control operator
    var baseMaps = {
        "Imagery": imagery,
        "Topographic": topo,
        "Gray": gray
    }
    
    var overlayMaps = {
        "Places": places,
        "Fires": fires,
        "Drought": drought
    }

    //create a pane to put states on top
    mymap.createPane('statespane');


    //run the create sequence control function
    createSequenceControls(mymap);
    
    //create the legend
    newLegend(mymap);

    
    //add layers & layer control to map
    L.control.layers(baseMaps, overlayMaps).addTo(mymap);

    //add event listener for year query change and call updateYear function
    var yearquery = document.getElementById('yearselect');
    yearquery.addEventListener('change', function () {
        updateYear();
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
            
            //create new div for sequence controller & add all control buttons/slider/year query selector & current displayed value text
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
        max: 12,
        min: 1,
        value: 1,
        step: 1
    });
    
    // set the properties for the year selector
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
    //add default value for current display date
    $('#dateshown').html('2000-01')

    //create logic for function controls
    $('.skip').click(function(){

        //get index value from slider
        var index = $('.range-slider').val();

        //toggle to next month if forward is pressed unless it goes outside of value range
        if ($(this).attr('id') == 'forward'){
            index++;
            index = index > 12 ? 1 : index;

        //toggle to last month if reverse is pressed unless it goes outside of value range
        } else {
            ($(this).attr('id') == 'reverse')
            index--;
            index = index < 1 ? 12 : index;
        };

        //update month when buttons are pushed
        updateMonth(index);

        
        //update the range slider to coincide with button pushes
        $('.range-slider').val(index);
        
    });

    //get the value fron the range slider to use for year index
    $('.range-slider').on('input', function(){
        var index = $(this).val();
        
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

//create function to highlight states
function highlightState(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 4.5,
        color: '#8c8c8c',
        fillOpacity: 0
    });
};

//create function to unhighlight states
function unhighlightState(e) {
    states.resetStyle(e.target);
    //states.setStyle({
      //  fillColor: 'none', 
        //weight:1.5, 
        //color:'#8c8c8c'
    //});
};

//open the info window pane
function openNav() {
    document.getElementById("my_dataviz").style.width = "25%";
    document.getElementById("mapid").style.width = "75%";
  };

//close the info window pane
function closeNav() {
    document.getElementById("my_dataviz").style.width = "0";
    document.getElementById("mapid").style.width = "100%";
  };

//add interaction to states layer
function onEachFeature(feature, states) {
    states.on({
        mouseover: highlightState,
        mouseout: unhighlightState,
        //click: openChart

    });
};

//function to open info window with state chart
/*function openChart(e) {
    states.on("click", function(evt) {
        var statename = evt.graphic.attributes.STATE_NAME;
        console.log("state name -" + statename);
    });
};  */

function newLegend(mymap){
    
    var legend = L.control({position: "bottomleft"});

    legend.onAdd = function(mymap){
        var div = L.DomUtil.create("div", "legend");
        div.innerHTML += "<h4>Drought Intensity</h4>";
        div.innerHTML += '<i style="background: #fffe03"></i><span>D0-Abnormally Dry</span><br>';
        div.innerHTML += '<i style="background: #ffcb99"></i><span>D1-Moderate Drought</span><br>';
        div.innerHTML += '<i style="background: #fe6603"></i><span>D2-Severe Drought</span><br>';
        div.innerHTML += '<i style="background: #fe0000"></i><span>D3-Extreme Drought</span><br>';
        div.innerHTML += '<i style="background: #640000"></i><span>D4-Exceptional Drought</span><br>';
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

//function to create the chart
function makeChart(state) {
    openNav()
    var filterDate = document.getElementById("dateshown").innerHTML;
    
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
        
        //format date and acres
        data.forEach(function(d) {
        d.date = parseDate(d.date);
        d.Acres = +d.Acres;
        });

        // group the data: one array for each value of the X axis.
        var sumstat = d3.nest()
        .key(function(d) { return +d.date;})
        .entries(data);

        // Stack the data
        var mygroups = ["D0", "D1", "D2", "D3", "D4"] // list of group names
        var mygroup = [1,2,3,4,5] // list of group names
        var stackedData = d3.stack()
        .keys(mygroup)
        .value(function(d, key){
            return d.values[key].Acres
        })
        (sumstat)
    
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

        console.log("stateabbr" + state + "filterdate " + filterDate)


        // Add the area
        svg
        .selectAll("mylayers")
        .data(stackedData)
        .enter()
        //.filter(function(row) {
        //    return row['STATE_ABBR'] == state ;
        //})
        .append("path")
        .style("fill", function(d) { name = mygroups[d.key-1] ;  return color(name); })
        .attr("d", d3.area()
            .x(function(d, i) { return x(d.data.key); })
            .y0(function(d) { return y(d[0]); })
            .y1(function(d) { return y(d[1]); })
        )

    })
};

//create the map when the dom is ready
$(document).ready(createMap);
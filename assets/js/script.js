/////////Code from https://gist.github.com/liabru/11263124 //////////

var element = document.createElement('div');
element.innerHTML = '<input type="file" multiple >';
var fileInput = element.firstChild;

var JsonData = [];

fileInput.addEventListener('change', function() {
    var files = fileInput.files;

    for (var i = 0; i < files.length; i++) {         
        (function(file) {
            var name = file.name;
            name=name.substr(1);
            var reader = new FileReader();  
            if(i==files.length-1){
                reader.onload = function(e) {  
                    var text = e.target.result; 
                    var json = JSON.parse(text);
                    json.MetaData.FileName = name; 
                    JsonData.push(json);
                    var scope = angular.element(document.getElementById("Visualizer")).scope();
                    scope.$apply(function(){
                        scope.SetShowData(true);
                    })
                }
            }else{
                reader.onload = function(e) {  
                    var text = e.target.result; 
                    var json = JSON.parse(text);
                    json.MetaData.FileName= name; 
                    JsonData.push(json);
                }
            }
            reader.readAsText(file);
        })(files[i]);
    }
    /*
    */
});

document.getElementById("FileInputButton").addEventListener('click', function() {
    fileInput.click();
});
/////////////////////////////Data Visualizer////////////////////////////

function test(){
    var scope = angular.element(document.getElementById("Visualizer")).scope();
    scope.$apply(function(){
        scope.SetShowData(true);
    })
}

var app = angular.module("app", []);

app.controller('Visualizer', function($scope) {
    $scope.ShowData=false;//false;
    $scope.Data=[];

    $scope.SetShowData = function(state) {
        $scope.ShowData=state;
        $scope.Data=JsonData;
    }
});

var DefaultStepSize=1;

var ctx = document.getElementById('LiveChart');

ctx.height=innerDimensions('ChartCon').height;
ctx.width=innerDimensions('ChartCon').width;

var LiveChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['0'],
        datasets: [{
            data: [],
            backgroundColor: '#297446',
            borderColor: '#297947',
            borderWidth: 1,
            lineTension: 0,
            lineTension: 0,
            pointRadius: 0,
            fill: false,
        }]
    }, 
    options: {
        responsive: true,
        tooltips: {
            mode: 'ipoint',
            //  intersect: false,
        },
        hover: {
            mode: 'nearest', 
            intersect: true
        },
        scales: {
            xAxes: [{
                display: true,
                ticks: {
                    min: 0,
                    max: 100,
                    stepSize: 0.5
                },
                scaleLabel: {
                    display: true,
                    labelString: 'Time (s)'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Force (N)'
                }
            }]
        }
    }
});

function innerDimensions(id){
    var node= document.getElementById(id)
    var computedStyle = getComputedStyle(node);

    let width = node.clientWidth; // width with padding
    let height = node.clientHeight; // height with padding

    height -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    width -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    return { height, width };
}

function SetData(JsonArray){
    for(var i=0; i<JsonArray.length; i++){
        addData(JsonArray[i]);
    }
    LiveChart.update();
}

function addData(data, steps) {
    var DataSteps = steps || DefaultStepSize;
    var LD=LiveChart.data.labels;
    LD.push((Number(LD[LD.length-1])+DataSteps).toString());
    var DatasetData=LiveChart.data.datasets[0].data;
    DatasetData.push(data);
    /*if(DatasetData.length>DisplayedValues){
        DatasetData.shift();
        LD.shift();
    }*/
}

/////////Code from https://gist.github.com/liabru/11263124 //////////

var element = document.createElement('div');
element.innerHTML = '<input type="file" multiple >';
var fileInput = element.firstChild;

var JsonData = [];

var Mode = 0; //Mode 0 = View TestData / 1 = View Breakpoints

fileInput.addEventListener('change', function() {
    var files = fileInput.files;
    var ErrorFiles = [];

    for (var i = 0; i < files.length; i++) {         
        (function(file) {
            var name = file.name;
            var reader = new FileReader();  
            if(i==files.length-1){
                reader.onload = function(e) {  
                    try{
                        var text = e.target.result; 
                        var json = JSON.parse(text);

                        json.MetaData.FileName = name; 
                        JsonData.push(json);
                    }catch(error){
                        console.log(error);
                        ErrorFiles.push(name);
                    }

                    if(ErrorFiles.length!=0){
                        alert("Attention this Files are Broken: "+ErrorFiles.toString());
                    }

                    if(JsonData.length!=0){
                        var scope = angular.element(document.getElementById("Visualizer")).scope();
                        scope.$apply(function(){
                            scope.SetShowData(Mode+1);
                        });
                    }

                }
            }else{
                reader.onload = function(e) { 

                    try{
                        var text = e.target.result; 
                        var json = JSON.parse(text);
                        json.MetaData.FileName= name; 
                        JsonData.push(json);

                    }catch(error){
                        console.log(error);
                        ErrorFiles.push(name);
                    }

                }
            }
            reader.readAsText(file);
        })(files[i]);
    }
    /*
    */
});

document.getElementById("DataFileInputButton").addEventListener('click', function() {
    fileInput.click();
    Mode=0;
});

document.getElementById("BreakpointFileInputButton").addEventListener('click', function() {
    fileInput.click();
    Mode=1;
});
/////////////////////////////Data Visualizer////////////////////////////

var app = angular.module("app", []);

app.controller('Visualizer', function($scope) {
    $scope.ShowMode=0; // 0 = SeöectScreen / 1 = View TestData / 2 = Breakpoints
    $scope.Data=[];
    $scope.CurrentTestData = {};
    $scope.DisplayMetaData =[];
    $scope.DisplayParameter =[];
    $scope.DisplayBreakpoint = 0;

    $scope.SetShowData = function(mode) {
        $scope.ShowMode=mode;
        $scope.Data=JsonData;
        if($scope.ShowMode==2){
            $scope.SetBreakpointData();   
        }
    }

    $scope.BackToSelectMenu = function(){
        $scope.BackToMenu();
        $scope.ShowMode=0;
        $scope.Data=[];
        JsonData=[];
    }

    $scope.BackToMenu = function(){

        angular.element( document.querySelector( '.SelectTest' ) ).removeClass('SelectTestMove');

        var element = angular.element(document.querySelector('.SelectTest'));
        var height = element[0].offsetHeight;
        document.querySelector( '.MetaData' ).style.transform = "translate(130%, -"+height+"px)";

        ClearData();
        $scope.CurrentTestData = {};
        $scope.DisplayMetaData =[];
        $scope.DisplayParameter =[];
        $scope.DisplayBreakpoint = 0;
    }

    $scope.SetFile = function(FN){

        var JsonIndex=0;
        for(var i=0; i<$scope.Data.length; i++){
            if($scope.Data[i].MetaData.FileName==FN){
                JsonIndex=i;
                break;
            }
        }

        $scope.CurrentTestData=$scope.Data[JsonIndex];
        $scope.DisplayBreakpoint = $scope.CurrentTestData.BreakPoint;

        var TestDataNames;
        var TestDataValues;

        TestDataNames=Object.getOwnPropertyNames($scope.CurrentTestData.MetaData);
        TestDataValues=Object.values($scope.CurrentTestData.MetaData);


        for(var i=0; i<TestDataNames.length; i++){
            if(TestDataNames[i]!="Parameter"){
                $scope.DisplayMetaData.push([TestDataNames[i], TestDataValues[i]]);
            }
        }


        var TestDataParameterNames;
        var TestDataParameterValues;

        TestDataParameterNames=Object.getOwnPropertyNames($scope.CurrentTestData.MetaData.Parameter);
        TestDataParameterValues=Object.values($scope.CurrentTestData.MetaData.Parameter);


        for(var i=0; i<TestDataParameterNames.length; i++){
            if(TestDataParameterNames[i]!="Parameter"){
                $scope.DisplayParameter.push([TestDataParameterNames[i], TestDataParameterValues[i]]);
            }
        }

        console.log($scope.DisplayMetaData);

        angular.element( document.querySelector( '.SelectTest' ) ).addClass('SelectTestMove');

        var element = angular.element(document.querySelector('.SelectTest'));
        var height = element[0].offsetHeight;
        document.querySelector( '.MetaData' ).style.transform = "translate(0px, -"+height+"px)";

        SetData($scope.CurrentTestData.Data);
    }

    $scope.SetBreakpointData = function() {
        SetBarData(JsonData);
    }
});

var DefaultStepSize=1;

var ctx = document.getElementById('LiveChartId');

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
            borderWidth: 2,
            lineTension: 0,
            lineTension: 0,
            pointRadius: 0,
            fill: false,
        }]
    }, 
    options: {
        responsive: true,
        tooltips: {
            mode: 'index',
            //intersect: false,
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

var ctx2 = document.getElementById('BreakpointChartId');

ctx2.height=innerDimensions('BarChartCon').height;
ctx2.width=innerDimensions('BarChartCon').width;

var BarChart = new Chart(ctx2, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: 'rgba(41, 121, 71, 0.48)',
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
        onAnimationComplete: function () {
            var ctx = this.chart.ctx;
            ctx.font = this.scale.font;
            ctx.fillStyle = this.scale.textColor
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";

            this.datasets.forEach(function (dataset) {
                dataset.bars.forEach(function (bar) {
                    ctx.fillText(bar.value, bar.x, bar.y - 5);
                });
            })
        },
        tooltips: {
            mode: 'index',
            //intersect: false,
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
                    display: false
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
}

function ClearData(){
    LiveChart.data.labels=["0"];
    LiveChart.data.datasets[0].data = [];
    LiveChart.update();

    BarChart.data.labels=["0"];
    BarChart.data.datasets[0].data = [];
    BarChart.update();
}

function SetBarData(JsonObj){
    for(var i=0; i<JsonObj.length; i++){
        AddBarData(JsonObj[i].BreakPoint, JsonObj[i].MetaData.Name)
    }
    BarChart.update();
}

function AddBarData(data, label){
    var BL=BarChart.data.labels;
    BL.push(label)
    var BD=BarChart.data.datasets[0].data;
    BD.push(data);
}
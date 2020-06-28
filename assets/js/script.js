/////////////File Upload Handler
/////////Base Code from https://gist.github.com/liabru/11263124 //////////


///create input type file element 
var element = document.createElement('div');
element.innerHTML = '<input type="file" multiple >';
var fileInput = element.firstChild;
/////


var JsonData = [];  //Array which contains The files in form of a Json obj

var Mode = 0; //Mode 0 = View TestData / 1 = View Breakpoints

fileInput.addEventListener('change', function() {
    var files = fileInput.files;                //get files
    var ErrorFiles = [];                        //Array of broken file names
    for (var i = 0; i < files.length; i++) {         //loop through files
        (function(file) {
            var name = file.name;                    //get file name
            var reader = new FileReader();           //create File reader from the file Api
            if(i==files.length-1){                   //Check if it is last file
                reader.onload = function(e) {  
                    try{                             //try creating JSON
                        var text = e.target.result;  //get data
                        var json = JSON.parse(text); //convert data to Json 

                        json.MetaData.FileName = name;//add File Name to Json obj
                        JsonData.push(json);          //add Data to Json Array

                    }catch(error){
                        console.log(error);
                        ErrorFiles.push(name);        //If file ist broken push its name to the Error Array
                    }

                    if(ErrorFiles.length!=0){  //If there are broken files alert them to the user
                        alert("Attention this Files are Broken: "+ErrorFiles.toString());
                    }

                    if(JsonData.length!=0){ //if there is Valid Data Activate load Data
                        var scope = angular.element(document.getElementById("Visualizer")).scope();
                        scope.$apply(function(){
                            scope.SetShowData(Mode+1);
                        });
                    }

                }
            }else{
                reader.onload = function(e) { 

                    try{                             //try creating JSON
                        var text = e.target.result;  //get data
                        var json = JSON.parse(text); //convert data to Json 

                        json.MetaData.FileName = name;//add File Name to Json obj
                        JsonData.push(json);          //add Data to Json Array
                    }catch(error){
                        console.log(error);
                        ErrorFiles.push(name);        //If file ist broken push its name to the Error Array
                    }

                }
            }
            reader.readAsText(file);
        })(files[i]);
    }
    /*
    */
});

//When Upload Btton clicked Set Mode and start File Api
document.getElementById("DataFileInputButton").addEventListener('click', function() {
    fileInput.click();
    Mode=0;
});

document.getElementById("BreakpointFileInputButton").addEventListener('click', function() {
    fileInput.click();
    Mode=1;
});

/////////////////////////////Angular ///// Data Visualizer////////////////////////////

var app = angular.module("app", []);

app.controller('Visualizer', function($scope) {
    $scope.ShowMode=0; // 0 = SelectScreen / 1 = View TestData / 2 = Breakpoints
    $scope.Data=[];   //Data Array Containing Json Data
    $scope.CurrentTestData = {};   //Obj containig the selected Test Data
    $scope.DisplayMetaData =[];       //Array Containig the MetaData of the Selected Test (Used for ng-repeat)  // Data: [Name, Data]
    $scope.DisplayParameter =[];  //Array Containig the Parameter of the Selected Test (Used for ng-repeat) // Data: [Name, Data]
    $scope.DisplayBreakpoint = 0;  //Breakpoint of the selected Test
    $scope.DisplayMaximum = 0; //Maximum of the selected Test

    $scope.SetShowData = function(mode) {  //Called when Files are loaded
        $scope.ShowMode=mode;   //Set the mode
        $scope.Data=JsonData;    //set the data
        if($scope.ShowMode==2){   //If Breakpoint analyses
            $scope.SetBreakpointData();     //Draw Bar Graph
        }
    }

    $scope.BackToSelectMenu = function(){   //Reset Data when Back arrow is clicked
        $scope.BackToMenu();
        $scope.ShowMode=0;
        $scope.Data=[];
        JsonData=[];
        fileInput.value=[];
    }

    $scope.BackToMenu = function(){    //Reset Graph  and selected Test //Back to Select Data Menu (only in ShowMode = 1)

        angular.element( document.querySelector( '.SelectTest' ) ).removeClass('SelectTestMove');

        var element = angular.element(document.querySelector('.SelectTest'));
        var height = element[0].offsetHeight;
        document.querySelector( '.MetaData' ).style.transform = "translate(130%, -"+height+"px)";

        ClearData();
        $scope.CurrentTestData = {};
        $scope.DisplayMetaData =[];
        $scope.DisplayParameter =[];
        $scope.DisplayBreakpoint = 0;
        $scope.DisplayMaximum = 0;
    }

    $scope.SetFile = function(FN){   //Called When Test is selected // FN = FileName

        var JsonIndex=0;
        for(var i=0; i<$scope.Data.length; i++){   //Search for the Index of the file in the Json Array
            if($scope.Data[i].MetaData.FileName==FN){
                JsonIndex=i;
                break;
            }
        }

        $scope.CurrentTestData=$scope.Data[JsonIndex];  //Set Current Test Data
        $scope.DisplayBreakpoint = $scope.CurrentTestData.BreakPoint;   //Set Breakpoint
        $scope.DisplayMaximum = $scope.CurrentTestData.Maximum;   //Set Maximum

        var TestDataNames;   //Get Names of JSON Metadata Properties in Array
        var TestDataValues;  //Get Data of Json Metadata Properties in Array

        TestDataNames=Object.getOwnPropertyNames($scope.CurrentTestData.MetaData);
        TestDataValues=Object.values($scope.CurrentTestData.MetaData);


        //Set Data Values
        for(var i=0; i<TestDataNames.length; i++){ //Set MetaData vor every Property except "Parameter"
            if(TestDataNames[i]!="Parameter"){
                $scope.DisplayMetaData.push([TestDataNames[i], TestDataValues[i]]);
            }
        }


        var TestDataParameterNames; //Get Names of JSON Metadata Parameter Properties in Array
        var TestDataParameterValues; //Get Data of JSON Metadata Parameter Properties in Array

        TestDataParameterNames=Object.getOwnPropertyNames($scope.CurrentTestData.MetaData.Parameter);
        TestDataParameterValues=Object.values($scope.CurrentTestData.MetaData.Parameter);


        for(var i=0; i<TestDataParameterNames.length; i++){   //Set Parameter vor every Property
            $scope.DisplayParameter.push([TestDataParameterNames[i], TestDataParameterValues[i]]);

        }

        console.log($scope.DisplayMetaData);


        ///////Set swipe animation
        angular.element( document.querySelector( '.SelectTest' ) ).addClass('SelectTestMove');

        var element = angular.element(document.querySelector('.SelectTest'));
        var height = element[0].offsetHeight;
        document.querySelector( '.MetaData' ).style.transform = "translate(0px, -"+height+"px)";

        SetData($scope.CurrentTestData.Data); //Set Line Chart Data
    }

    $scope.SetBreakpointData = function() {
        SetBarData(JsonData);
        SetCompareLineData(JsonData);
    }
});

var DefaultStepSize=1;   //Step Siz eof Displayed Data (y-Axis)

var ctx = document.getElementById('LiveChartId');  //Get chart context 

//Set Width and Height of the chart to fit container
ctx.height=innerDimensions('ChartCon').height;   
ctx.width=innerDimensions('ChartCon').width;

var LiveChart = new Chart(ctx, {  //create Chart.js Chart and Set options for the Line Chart
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

var ctx2 = document.getElementById('BreakpointChartId');  //Get Chart Index

//Set Width and Height of the chart to fit container
ctx2.height=innerDimensions('BarChartCon').height;
ctx2.width=innerDimensions('BarChartCon').width;

var BarChart = new Chart(ctx2, {   //create Chart.js Chart and Set options for the Bar Chart
    type: 'bar',
    data: {
        labels: [],
        datasets: [
            {
                label: "Maximum",
                data: [],
                backgroundColor: 'rgba(41, 121, 71, 0.48)',
                borderColor: '#297947',
                borderWidth: 1,
                lineTension: 0,
                lineTension: 0,
                pointRadius: 0,
                fill: false,
            },
            {
                label: "Breakpoint",
                data: [],
                backgroundColor: 'rgba(41, 78, 121, 0.48)',
                borderColor: '#293579',
                borderWidth: 1,
                lineTension: 0,
                lineTension: 0,
                pointRadius: 0,
                fill: false,
            }
        ]
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
                },
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    }
});

var ctx3 = document.getElementById('CompareLineChartId');  //Get Chart Index

//Set Width and Height of the chart to fit container
ctx3.height=innerDimensions('CompareLineChartCon').height;
ctx3.width=innerDimensions('CompareLineChartCon').width;

var CompareLineChart = new Chart(ctx3, {   //create Chart.js Chart and Set options for the Bar Chart
    type: 'line',                   
    data: {
        labels: [],
        datasets: []
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

function innerDimensions(id){                   //get the dimensions with padding of element
    var node= document.getElementById(id)
    var computedStyle = getComputedStyle(node);

    let width = node.clientWidth; // width with padding
    let height = node.clientHeight; // height with padding

    height -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    width -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    return { height, width };
}

function SetData(JsonArray){                    //Shows the Data Passed as an array
    for(var i=0; i<JsonArray.length; i++){   //Loop through the data 
        addData(JsonArray[i]);                 //add Data to CHart
    }
    LiveChart.update();                     //Update Chart
}

function addData(data, steps) {     
    var DataSteps = steps || DefaultStepSize;       //If steps are passed set this steps else use default steps
    var LD=LiveChart.data.labels;      //Get Chart labels
    LD.push((Number(LD[LD.length-1])+DataSteps).toString());   //Set new label which is an increment of the Datasteps from the last label
    var DatasetData=LiveChart.data.datasets[0].data;    //Get Chart Data
    DatasetData.push(data);                             //ADd Data to CHart
}

function ClearData(){                          //Reset Data of the Charts
    LiveChart.data.labels=["0"];
    LiveChart.data.datasets[0].data = [];
    LiveChart.update();

    BarChart.data.labels=[];
    BarChart.data.datasets[0].data = [];
    BarChart.data.datasets[1].data = [];
    BarChart.update();


    CompareLineChart.data.labels=[];
    CompareLineChart.data.datasets=[];
    CompareLineChart.update();
}

function SetBarData(JsonObj){             //Sets the Bar Data
    for(var i=0; i<JsonObj.length; i++){  //Go through all of the data
        AddBarData(JsonObj[i].BreakPoint,JsonObj[i].Maximum, JsonObj[i].MetaData.Name)   //Get Breakpoint and Test Name and add it to the Bar Chart
    }
    BarChart.update();   //Update Bar Chart
}

function AddBarData(BP, Max, label){           
    var BL=BarChart.data.labels;    //Get Bar CHart Labels
    BL.push(label)      //Set Bar Chart Label
    var BPD=BarChart.data.datasets[1].data;   //Get Bar CHart BReakpoint Data 
    BPD.push(BP);   //Set Bar Chart Breakpoint Data
    var MaxD=BarChart.data.datasets[0].data;   //Get Bar CHart Maximum Data 
    MaxD.push(Max);   //Set Bar Chart Maximum Data
    console.log(Max)
}


function SetCompareLineData(JsonObj){             //Sets the Compare Line Data
    var MaxDataLength = 0;  //The Longest Array (to scale the graph to the biggest dataset)

    for(var i=0; i<JsonObj.length; i++){  //Go through all of the data
        AddCompareLineData(JsonObj[i].Data, JsonObj[i].MetaData.Name)   //Get Data array and and Test Name and add it to the Line Chart
        if(JsonObj[i].Data.length>MaxDataLength){
            MaxDataLength=JsonObj[i].Data.length;
        }
    }

    for(var i=0; i<=MaxDataLength; i++){  //Set Labels
        CompareLineChart.data.labels.push(i.toString())      //Set Line Chart Labels
    }

    CompareLineChart.update();   //Update Chart
}

function AddCompareLineData(ArrData, label){   
    var RandomColor = randomColor({
   luminosity: 'dark'});  //get random Color
    var NewDataset={   //Create Dataset
        label: label,
        data: ArrData,
        backgroundColor: RandomColor,
        borderColor: RandomColor,
        borderWidth: 2,
        lineTension: 0,
        lineTension: 0,
        pointRadius: 0,
        fill: false,
    };
    var MaxD=CompareLineChart.data.datasets;   //Get Bar CHart datasets 
    MaxD.push(NewDataset);   //Set Bar Chart Maximum Data
}
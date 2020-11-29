/////////////File Upload Handler
/////////Base Code from https://gist.github.com/liabru/11263124 //////////


///create input type file element 
var element = document.createElement('div');
element.innerHTML = '<input type="file" accept="application/JSON, .txt" multiple >';
var fileInput = element.firstChild;
/////


var JsonData = [];  //Array which contains The files in form of a Json obj
var GruopdData = []; 

var Mode = 0; //Mode 0 = View TestData / 1 = View Breakpoints /2 = Standard Diviation

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

                    if(JsonData.length!=0){ //if there is Valid Data go to select mode screen
                        var scope = angular.element(document.getElementById("Visualizer")).scope();
                        scope.$apply(function(){
                            scope.ShowMode=1;
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
});

//When Mode Button clicked select Mode
document.getElementById("TestData").addEventListener('click', function() {
    Mode=0; 
    var scope = angular.element(document.getElementById("Visualizer")).scope();
    scope.$apply(function(){
        scope.SetShowData(Mode+2);
    });
});

document.getElementById("CompareData").addEventListener('click', function() {
    Mode=1;
    var scope = angular.element(document.getElementById("Visualizer")).scope();
    scope.$apply(function(){
        scope.SetShowData(Mode+2);
    });
});


document.getElementById("StandardDiviation").addEventListener('click', function() {
    Mode=2;
    var scope = angular.element(document.getElementById("Visualizer")).scope();
    scope.$apply(function(){
        scope.SetShowData(Mode+2);
    });
});


document.getElementById("takeScreenshot").addEventListener('click', function() {
    console.log("Screenshot");
    let filename=document.getElementById('filenametf').value;
    console.log(filename)
    if(filename.length>0){
        if(filename.slice(-4)!='.png'){
            filename += '.png';
        }
    }else{
        filename='OpenPullTestData.png';
    }
    html2canvas(document.querySelector("#ErrorChartId")).then(canvas => {
        saveAs(canvas.toDataURL(), filename);
    });
});

document.getElementById("DownloadCSV").addEventListener('click', function() {
    GenerateCSV();
});

/////////////////////////////Angular ///// Data Visualizer////////////////////////////
const urlParams = new URLSearchParams(window.location.search);

var app = angular.module("app", []);

app.controller('Visualizer', function($scope) {
    $scope.ShowMode=0; // 0 = SelectDataScreen / 1=SelectModeScreen / 2 = View TestData / 3 = Breakpoints
    $scope.Data=[];   //Data Array Containing Json Data
    $scope.CurrentTestData = {};   //Obj containig the selected Test Data
    $scope.DisplayMetaData =[];       //Array Containig the MetaData of the Selected Test (Used for ng-repeat)  // Data: [Name, Data]
    $scope.DisplayParameter =[];  //Array Containig the Parameter of the Selected Test (Used for ng-repeat) // Data: [Name, Data]
    $scope.DisplayBreakpoint = 0;  //Breakpoint of the selected Test
    $scope.DisplayMaximum = 0; //Maximum of the selected Test

    $scope.isLocalStorageData = urlParams.get("localData");
    if($scope.isLocalStorageData=="true"){  //when there is available localstorage data
        console.log(JSON.parse(localStorage.getItem("openPullTestData"))); 
        var json = JSON.parse(localStorage.getItem("openPullTestData")) //convert data to Json 

        json.MetaData.FileName = json.MetaData.Name;//add File Name to Json obj
        JsonData.push(json);          //add Data to Json Array
        $scope.ShowMode=1;   //change ShowMode
    }

    $scope.SetShowData = function(mode) {  //Called when Files are loaded
        $scope.ShowMode=mode;   //Set the mode
        $scope.Data=JsonData;    //set the data
        console.log($scope.Data);
        for(let key in $scope.Data){  //Add Selected par. to data array (for data seletion in Mode Compare Test Data)
            $scope.Data[key].Selected=true;
        }
        console.log($scope.Data);
        if($scope.ShowMode==3){   //If Breakpoint analyses
            $scope.SetBreakpointData();     //Draw Bar Graph
        }
        if($scope.ShowMode==4){
            $scope.calculateData();
        }
    }

    $scope.BackToSelectMode = function(){   //Reset Mode when Back to menu arrow is clicked
        $scope.BackToMenu();
        $scope.ShowMode=1;
    }

    $scope.BackToSelectData = function(){   //Reset Data when Back arrow is clicked
        $scope.BackToMenu();
        $scope.ShowMode=0;
        $scope.Data=[];
        JsonData=[];
        fileInput.value=[];
    }

    $scope.BackToMenu = function(){    //Reset Graph  and selected Test //Back to Select Data Menu (only in ShowMode = 2)

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
        ClearData();
        SetBarData($scope.Data);
        SetCompareLineData($scope.Data);
        console.log("Breakpoint Set");
    }

    $scope.calculateData = function(){
        ClearData();

        let gruopedIndexes = new Map();  //get all the filenames with index and gruop them,
        for(let i=0; i<$scope.Data.length; i++){
            let fname = $scope.Data[i].MetaData.FileName;
            fname.replace('(', '');
            fname.replace(')', '');
            fname = (fname.split('.').slice(0, -1)).join('.');
            fname = fname.slice(0, -1); 

            if(gruopedIndexes.has(fname)){
                let gruopIndexes = gruopedIndexes.get(fname);
                gruopIndexes.push(i);
                gruopedIndexes.set(fname, gruopIndexes);
            }else{
                gruopedIndexes.set(fname,[i]);
            }
        }
        
        //Sort gruoped indexes by Mean
         gruopedIndexes = new Map([...gruopedIndexes.entries()].sort((a,b) => {
                let breakpointsA = [];
                let breakpointsB = [];
             
                let Avalue = a[1];
                let Bvalue = b[1];
             
                for(let i=0; i<Avalue.length; i++){
                    breakpointsA.push($scope.Data[Avalue[i]].BreakPoint);
                }
                for(let i=0; i<Bvalue.length; i++){
                    breakpointsB.push($scope.Data[Bvalue[i]].BreakPoint);
                }
                
                let meanA = Mean(breakpointsA);
                let meanB = Mean(breakpointsB);

                return meanA-meanB;
            }));

        let ErrorChartData = { 
            labels: [],
            datasets: [
                {
                    label: 'Zugfestigkeit',
                    data: [
                    ]
                }
            ]
        };
        ///Calculate Mean and SD for each gruop and add it to the Data object
        gruopedIndexes.forEach((value, key) => {

            let gruopedDataObject = {
                name: key,
                sampleSize: -1,
                values: [],
                mean: -1,
                sd: -1,
            }

            let breakpoints = [];
            for(let i=0; i<value.length; i++){
                breakpoints.push($scope.Data[value[i]].BreakPoint)
            }

            let mean = Mean(breakpoints);
            let sd = StandardDiviation(breakpoints);

            ErrorChartData.labels.push(key);

            dataObject = {
                y: mean,
                yMin: mean-sd<0?0:mean-sd,
                yMax: mean+sd
            }

            gruopedDataObject.sampleSize = breakpoints.length;
            gruopedDataObject.values = breakpoints;
            gruopedDataObject.mean = mean;
            gruopedDataObject.sd = sd;

            GruopdData.push(gruopedDataObject);

            ErrorChartData.datasets[0].data.push(dataObject);
        })
        //console.log(ErrorChart);
        ErrorChartData.datasets[0].data.sort(
            (a,b) => {
                console.log(a,b);
                return a.y-b.y;
            }
        );


        SetErroChart(ErrorChartData);  //Set the generated Data
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
        labels: ['0'],
        datasets: [
            {
                label: 'Dataset',
                //backgroundColor: '#d95f02',
                borderColor: '#d95f02',
                borderWidth: 1,
                data: [],
            }
        ]
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


var ctx4 = document.getElementById('ErrorChartId');  //Get Chart Index

//Set Width and Height of the chart to fit container
ctx4.height=innerDimensions('ErrorChartCon').height;
ctx4.width=innerDimensions('ErrorChartCon').width;

var ErrorChart = new Chart(ctx4, {   //create Chart.js Chart and Set options for the Bar Chart
    type: 'barWithErrorBars',                   
    data: { 
        labels: [],
        datasets: [
            {
                label: 'Zugfestigkeit',
            }
        ]
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
                scaleLabel: {
                    display: true,
                    labelString: 'Samples'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Force (N)'
                },
                ticks: {
                    beginAtZero: true,
                    stepSize: 100,
                },
            }]
        },

    }});

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

    ErrorChart.data.labels=[];
    ErrorChart.data.datasets=[
        {
            errorBarLineWidth: 3,
            errorBarWhiskerLineWidth: 3,
            backgroundColor: 'rgba(17, 95, 86, 0.7)',
            label: 'Zugfestigkeit',
            data: []
        }
    ];
    ErrorChart.update();
}

function SetBarData(JsonObj){             //Sets the Bar Data
    for(var i=0; i<JsonObj.length; i++){  //Go through all of the data
        if(JsonObj[i].Selected){          //Check if data is selected
            AddBarData(JsonObj[i].BreakPoint,JsonObj[i].Maximum, JsonObj[i].MetaData.Name)   //Get Breakpoint and Test Name and add it to the Bar Chart
        }
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
}


function SetCompareLineData(JsonObj){             //Sets the Compare Line Data
    var MaxDataLength = 0;  //The Longest Array (to scale the graph to the biggest dataset)

    for(var i=0; i<JsonObj.length; i++){  //Go through all of the data
        if(JsonObj[i].Selected){          //Check if data is seleceted
            AddCompareLineData(JsonObj[i].Data, JsonObj[i].MetaData.Name)   //Get Data array and and Test Name and add it to the Line Chart
            if(JsonObj[i].Data.length>MaxDataLength){
                MaxDataLength=JsonObj[i].Data.length;
            }
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

function SetErroChart(data){
    var EL=ErrorChart.data.labels;    //Get Labels
    EL.push.apply(EL, data.labels);//Set Labels
    var ED=ErrorChart.data.datasets[0];   //Set Labels
    ED.data = data.datasets[0].data;   //Set Data

    ErrorChart.update();
} 

function Mean(data){  //Calculate the Mean of an Array
    console.log(data);
    let sum = 0.0;
    for (let i of data){
        sum += Number(i);
        console.log(i);
    }
    console.log(sum);
    return sum/data.length;
}

function StandardDiviation(data){   //Calculate the Standard deviation of an array
    let m = Mean(data);
    return Math.sqrt(data.reduce(function (sq, n) {
        return sq + Math.pow(n - m, 2);
    }, 0) / (data.length - 1));
}

function saveAs(uri, filename) {
    var link = document.createElement('a');
    if (typeof link.download === 'string') {
        link.href = uri;
        link.download = filename;

        //Firefox requires the link to be in the body
        document.body.appendChild(link);

        //simulate click
        link.click();

        //remove the link when done
        document.body.removeChild(link);
    } else {
        window.open(uri);
    }
}

function GenerateCSV(){  //converts the grouped data to an scv table
    MaxSampleSize = 0;
    for(let data of GruopdData){
        if(data.sampleSize>MaxSampleSize){
            MaxSampleSize=data.sampleSize;
        }
    }

    let csvData = '"sep=,"\r\n';
    let header = '"Name","Stichproben Anzahl",';
    for(let i=0; i<MaxSampleSize; i++){
        header += '"Wert' + (i+1) + '",';
    }
    header += '"Mittelwert","Standardabweichung"\r\n';

    csvData += header;

    for(let data of GruopdData){
        let row = '"' + data.name + '","' + data.sampleSize + '",';

        for(let i=0; i<MaxSampleSize; i++){
            let sample = data.values[i];
            if(!sample){
                sample = '/';
            }
            row += '"' + sample + '",';
        }

        row += '"' + data.mean.toFixed(2) + '","' + data.sd.toFixed(2) + '"\r\n'

        csvData += row;

    }

    let filename=document.getElementById('filenametf').value;
    console.log(filename)
    if(filename.length>0){
        if(filename.slice(-4)!='.csv'){
            filename += '.csv';
        }
    }else{
        filename='OpenPullTestData.csv';
    }

    csvData = 'data:text/csv,' +csvData;
    saveAs(csvData, filename);  //error when download 
}
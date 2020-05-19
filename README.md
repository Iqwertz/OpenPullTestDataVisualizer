# OpenPullTestDataVisualizer

## Website Purpose:
The Purpose of this Website is to display and Visulize data, which is generated by the OpenPullTest Maschine with Bluetooth and Sd Card feature. 

## Modes: 
This Website has two Analyse Modes:

### View Test Data:
In this Mode the Files get Displayed and the user can select a Test Data. The Selected Test gets Plotted and the the Metadata is displayed

### View Breakpoints:
The Breakpoints of the selected Tests are Shown on a Bar Chart

## Data Format:
The Data is formated as Json and stored in a .txt File. 

Example of valid Json Data:

```JSON
{
  "MetaData": {
    "Name": "TestName",
    "Date": "2020/05/12 17:15:55",
    "Parameter": {
      "Material": "PLA",
      "Infill Type": "Gyroid",
      "Infill": "15 %",
      "Layer Height": "0.3 mm",
      "First Layer Height": "0.3 mm",
      "Nozzle Size": "0.5 mm",
      "Bed Temperatur": "70 °",
      "Nozzle Temperatur": "200 °",
      "Vertical Shells": "3 ",
      "Top Layers": "3 ",
      "Bottom Layers": "3 "
    },
    "TestMode": "M13",
    "Notes": "Notes of the Test"
  },
  "Data": [
    0,
    1,
    2,
    3,
    4,
    0
  ],
  "BreakPoint": 4
}
```

var ERR_INDEX = -1;
var addButton = $('#addDomain');
var domField = $('#domains');
var domLabel = $('#domainList');
var inputFile = $('#inputCsv');
var genButton = $('#download');
var tolSlider = $('#tolerance');

var domain = [];
var email = [];
var master = [];
var tolerance = 1;
var filename = "";

function initMaster(){
  master = [];
  var header = ["EMAILS", "ORIGINAL EMAILS", "VALIDITY", "ID", "DOMAIN", "CORRECTED DOMAIN", "ERROR SCORE", "NOTES"];
  master.push(header);
}

function domainObj(name){
  this.name = name;
  this.hash = new Array(95).fill(0);
}

function emailObj(name){
  this.name = name;
  var atIndex = name.indexOf("@");
  if(atIndex != -1){
    this.id = name.substring(0, name.indexOf("@"));
    this.domain = name.substring(name.indexOf("@")+1, name.length);
    this.valid = true;
  }
  else{
    this.id = name;
    this.domain = "";
    this.valid= false;
  }
  this.hash = new Array(95).fill(0);
}

//translate ascii to index for hash
function indexASCII(ascii){
  if(ascii>=32 && ascii<=126){
    return ascii-32;
  }
  else {
    console.log("invalid ASCII code");
    return ERR_INDEX;
  }
}

//returns ascii in char form
function toChar(ascii){
  return String.fromCharCode(ascii);
}

//creates domain and fills its hash
function createDomain(name){
  domain.push(new domainObj(name));
  for(var i = 0; i < name.length; i++){
    var ascii = name.charCodeAt(i);
    domain[domain.length-1].hash[indexASCII(ascii)]++;
  }
}

//creates email and fills its hash
function createEmail(name){
  email.push(new emailObj(name));
  for(var i = 0; i < email[email.length-1].domain.length; i++){
    var ascii = email[email.length-1].domain.charCodeAt(i);
    email[email.length-1].hash[indexASCII(ascii)]++;
  }
}

//initial function that adds gmail and hotmail as default
function init(){
  initMaster();
  createDomain("gmail.com");
  createDomain("hotmail.com");
  updateLabel();
}

//update domain label with the domains that user has entered
function updateLabel(){
  var textUpdate = "";
  for(var i = 0; i < domain.length; i++){
    textUpdate = textUpdate.concat(domain[i].name);
    textUpdate = textUpdate.concat("<br/>");
  }
  domLabel.html(textUpdate);
}

// Make Enter button add domain
domField.keyup(function(event){
    if(event.keyCode == 13){
        addButton.click();
    }
});

//create new domain from text field
addButton.on('click', function(){
  if(domField.val() != ""){
    createDomain(domField.val().toLowerCase());
    domField.val("");
    updateLabel();
  }
});

tolSlider.on('input', function(){
  $('#sliderLabel').html(this.value);
  tolerance = this.value;
});


genButton.on('click', function(){
  for(var i = 0; i < email.length; i++){
    var pushArr = [];
    var lowest;
    var newData = false;

    if(!email[i].valid){
      master.push([email[i].name, email[i].name, email[i].valid, "-", "-", "-", "-", "Invalid Email: Missing @"]);
      continue;
    }

    for(var j = 0; j < domain.length; j++){
      var pushData = ["", email[i].name, email[i].valid, email[i].id, email[i].domain, domain[j].name, "", "Fixed to @" +domain[j].name];
      pushData[0] = email[i].id + "@" + domain[j].name;
      pushData[6] = checkSame(email[i].hash, domain[j].hash);
      pushArr.push(pushData);
    }

    lowest = pushArr[0][6];
    for(var k = 0; k < pushArr.length; k++){
      if(pushArr[k][6] < lowest)
        lowest = pushArr[k][6];
    }

    //push lowest score only
    for(var k = 0; k < pushArr.length; k++){
      if(pushArr[k][6] == lowest && pushArr[k][6] <= tolerance){
        if(lowest == 0){
          pushArr[k][7] = "Email is Correct";
        }
        master.push(pushArr[k]);
        newData = true;
      }
    }

    if(!newData){
      master.push([email[i].name, email[i].name, email[i].valid, email[i].id, email[i].domain, "-", "-", "Outside Tolerance Level"]);
    }
  }
  arrayToCSV(master);
});


// READ FILES SECTION
//******************************************************************************

var fileData = [];

function handleFiles(files) {
	// Check for the various File API support.
	if (window.FileReader) {
		// FileReader are supported.
    var name = inputFile.val().split('\\').pop();
    filename = name.substring(0, name.indexOf('.'));

		getAsText(files[0]);
	} else {
		alert('FileReader are not supported in this browser.');
	}
}

function getAsText(fileToRead) {
	var reader = new FileReader();
	// Handle errors load
	reader.onload = loadHandler;
	reader.onerror = errorHandler;
	// Read file into memory as UTF-8
	reader.readAsText(fileToRead);
}


function loadHandler(event) {
	var csv = event.target.result;
	processData(csv);
}

function errorHandler(evt) {
	if(evt.target.error.name == "NotReadableError") {
		alert("Cannot read file !");
	}
}

function processData(csv) {
  var allTextLines = csv.split(/\r\n|\n/);

  while (allTextLines.length) {
    fileData.push(allTextLines.shift().split(','));
  }
	console.log(fileData);
  processEmail();
}

//******************************************************************************
//END OF READ FILES CODE SECTION





// PROCESS CSV SECTION
//******************************************************************************

function processEmail(){
  for(var i = 1; i < fileData.length; i++){
    createEmail(fileData[i][0]);
  }
}

//******************************************************************************
//END OF PROCESS CSV CODE SECTION







// PROCESS CSV SECTION
//******************************************************************************
function checkSame(a, b){
  var sameVal = 0;
  for(var i = 0; i < a.length; i++){
    sameVal += Math.abs(a[i] - b[i]);
  }
  return sameVal;
}

function checkLess(a,b){
  var lessVal = 0;
  for(var i = 0; i < a.length; i++){
    if(a[i] < b[i]) lessVal += b[i] - a[i];
  }
  return lessVal;
}

function checkMore(a,b){
  var moreVal = 0;
  for(var i = 0; i < a.length; i++){
    if(a[i] > b[i]) moreVal += a[i] - b[i];
  }
  return moreVal;
}

//******************************************************************************
//END OF PROCESS CSV CODE SECTION








// DEVELOPER FUNCTIONS SECTION
//******************************************************************************

function findInvalid(){
  for(var i = 0; i < email.length; i++){
    if(email[i].valid == false){
      console.log(email[i]);
    }
  }
}

function arrayToCSV (twoDiArray) {
    //  export-javascript-data-to-csv-file-without-server-interaction
    var csvRows = [];
    for (var i = 0; i < twoDiArray.length; ++i) {
        for (var j = 0; j < twoDiArray[i].length; ++j) {
            twoDiArray[i][j] = '\"' + twoDiArray[i][j] + '\"';  // Handle elements that contain commas
        }
        csvRows.push(twoDiArray[i].join(','));
    }

    var csvString = csvRows.join('\n');
    var a         = document.createElement('a');
    var href2 = encodeURI('data:text/csv;charset=utf-8,' + csvString);
    a.href        = href2;
    a.target      = '_blank';
    a.download    = filename + '_fixed.csv';
    a.id          = 'output';


    document.body.appendChild(a);
    a.click();
    location.reload();
    // Optional: Remove <a> from <body> after done
}

//******************************************************************************
//END OF DEVELOPER FUNCTIONS CODE SECTION

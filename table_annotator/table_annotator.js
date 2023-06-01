let pdfURL = getParam("file");
let currentPageIndex = 0;
let pageMode = 1;
let cursorIndex = Math.floor(currentPageIndex / pageMode);
let pdfInstance = null;
let totalPagesCount = 0;
let cursorX = -1;
let cursorY = -1;
let cursorOnX = -1;
let cursorOnY = -1
let cursorOffX = -1;
let cursorOffY = -1;
let cursorClickX = -1;
let cursorClickY = -1;
let tableTopViewer = -1;
let tableLeftViewer = -1;
let tableBottomViewer = -1;
let tableRightViewer = -1;
let selectedCell = -1;
let cellNum = 0;
var cellList = [];
let isAnnotate = false;
var tokenList = [];
let tableNum = 0;
let isSet = true;

function getParam(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function removeTokenInfo() {
  for (var i=0; i<cellNum; i++) {
    let removedDiv = document.getElementById("tokens#"+String(i));
    if (removedDiv != null) {
      removedDiv.remove();
    }
  }
}

function selectCell(cell) {
  removeTokenInfo();
  selectedCell = Number(cell.id.replace("select#", ""));
  let divC = document.getElementById(cell.id.replace("select", ""))
  let divCellTokens = document.createElement("div");
  divCellTokens.id = cell.id.replace("select", "tokens");
  let k = findKey(cell.id.replace("select", ""));
  if (k > -1) {
    for (var i=0; i<cellList[k]["content"].length; i++) {
      cellText = cellList[k]["content"][i]["id"]+": "+cellList[k]["content"][i]["text"];
      divCellTokens.appendChild(document.createTextNode(cellText));
      divCellTokens.appendChild(document.createElement("br"));
    }
  }
  divC.appendChild(divCellTokens);
}

function removeCell(cell) {
  cellId = cell.id.replace("remove", "");
  k = findKey(cellId);
  if (k != -1) cellList.splice(k, 1);
  document.getElementById(cellId).remove();
}

function findKey(key) {
  for (var i=0; i<cellList.length; i++) {
    if (key == cellList[i]["cellId"]) return i;
  }
  return -1;
}

function findToken(id) {
  for (var i=0; i<cellList.length; i++) {
    for (var j=0; j<cellList[i]["content"].length; j++) {
      if (id == cellList[i]["content"][j]["id"]) return true;
    }
  }
  return false;
}

function initialize() {
  const viewport = document.querySelector("#viewport");
  pdfjsLib.getDocument(pdfURL).then(pdf => {
    pdfInstance = pdf;
    totalPagesCount = pdf.numPages;
    document.getElementById("max-page").innerHTML = totalPagesCount;
    pageMover();
    render();
    cursorListener();
    Extractor();
    cellAdd();
    Saver();
    Reset();
  });
}

function createCell() {
  let cellRoot= document.getElementById("cell-list");
  let cellView = document.getElementById("cell-view");
  let cellDiv = document.createElement("div");
  cellDiv.id = "#"+String(cellNum);
  cellDiv.appendChild(document.createTextNode("#"+String(cellNum+1)));
  let s = document.createElement("button");
  s.id = "select#"+String(cellNum);
  s.innerHTML = "Select";
  s.setAttribute("onclick", "selectCell(this);");
  cellDiv.appendChild(s);
  let r = document.createElement("button");
  r.id = "remove#"+String(cellNum);
  r.innerHTML = "Remove";
  r.setAttribute("onclick", "removeCell(this);");
  cellDiv.appendChild(r);
  cellDiv.appendChild(document.createTextNode("Row"));
  let row = document.createElement("input");
  row.id = "row#"+String(cellNum);
  row.setAttribute("type", "text");
  row.setAttribute("maxlength", 7);
  row.setAttribute("size", 7);
  row.setAttribute("value", "");
  cellDiv.appendChild(row);
  cellDiv.appendChild(document.createTextNode("Column"));
  let col = document.createElement("input");
  col.id = "col#"+String(cellNum);
  col.setAttribute("type", "text");
  col.setAttribute("maxlength", 7);
  col.setAttribute("size", 7);
  col.setAttribute("value", "");
  cellDiv.appendChild(col);
  cellView.prepend(cellDiv);
  cellRoot.appendChild(cellView);
}

function cellAdd() {
  let addButton = document.getElementById("add-cell");
  addButton.addEventListener("click", function(){
  if (isSet != true) {
    alert("No token(s) selected!");
    return 0;
  }
  createCell();
    isSet = false;
    cellNum += 1;
  });
}

function Reset() {
  let resetButton = document.getElementById("reset");
  resetButton.addEventListener("click", function(){
    resetVar();
  });
}

function setTabLocation() {
  tableTopViewer = cursorOnY;
  tableLeftViewer = cursorOnX;
  tableBottomViewer = cursorOffY;
  tableRightViewer = cursorOffX;
  tablePage = currentPageIndex;
}

function fillRowColumn(e) {
  if (e.key == "f") {
    let rowNum = Number(document.getElementById("row#"+String(selectedCell)).value.split("-")[0]);
    let colNum = 0;
    if (document.getElementById("col#"+String(selectedCell)).value != "") {
      colNum = Number(document.getElementById("col#"+String(selectedCell)).value.split("-")[0]);
    }
    for (var i=selectedCell; i<cellNum; i++) {
      if (i == selectedCell) {
        document.getElementById("col#"+String(i)).value = String(colNum)+"-"+String(colNum);
        colNum += 1;
      } else {
        if (document.getElementById("row#"+String(i)) != null) {
          document.getElementById("row#"+String(i)).value = String(rowNum)+"-"+String(rowNum);
          document.getElementById("col#"+String(i)).value = String(colNum)+"-"+String(colNum);
          colNum += 1;
        }
      }
    }
  }
  if (e.key == "a") {
    let maxRow = -1;
    for (var i=0; i<cellNum; i++){
      if (document.getElementById("row#"+String(i)) != null) {
        if (document.getElementById("row#"+String(i)).value ==  "") continue;
        let r = Number(document.getElementById("row#"+String(i)).value.split("-")[1]);
        if (r > maxRow) maxRow = r;
      }
    }
    let rowNum = maxRow+1;
    let colNum = 0;
    if (document.getElementById("col#"+String(selectedCell)).value != "") {
      colNum = Number(document.getElementById("col#"+String(selectedCell)).value.split("-")[0]);
    }
    for (var i=selectedCell; i<cellNum; i++) {
      if (document.getElementById("row#"+String(i)) != null) {
        document.getElementById("row#"+String(i)).value = String(rowNum)+"-"+String(rowNum);
        document.getElementById("col#"+String(i)).value = String(colNum)+"-"+String(colNum);
        colNum += 1;
      }
    }
  }
  if (e.key == "c") {
    if (isSet != true) {
      alert("No token(s) selected!");
      return 0;
    }
    createCell();
    selectedCell = cellNum;
    showTokensInCell();
    isSet = false;
    cellNum += 1;
  }
}

function Extractor() {
  $(function() {
    document.getElementById("get-tokens").addEventListener("click", function(){
      let cellRoot = document.getElementById("cell-list");
      let cellView = document.createElement("div");
      cellView.id = "cell-view";
      cellRoot.appendChild(cellView);
      var tabInfo = {};
      setTabLocation();
      tabInfo["pdf_name"] =  pdfURL;
      tabInfo["table_page"] =  currentPageIndex;
      tabInfo["table_left"] =  tableLeftViewer;
      tabInfo["table_top"] =  tableTopViewer;
      tabInfo["table_right"] =  tableRightViewer;
      tabInfo["table_bottom"] =  tableBottomViewer;
      tabInfo["canvas_heigt"] = document.getElementById("viewCanvas").height;
      tabInfo["canvas_width"] = document.getElementById("viewCanvas").width;
      $.ajax({
        type:"post",
        url:"/cgi-bin/table_annotator/extractor.py",
        data:JSON.stringify(tabInfo),
        dataType: "json"
      }).done(function(data){
        for (var i=0; i<data["tokens"].length; i++) {
          token = {}
          token["id"] = data["tokens"][i]["id"];
          token["text"] = data["tokens"][i]["text"];
          token["upper_x"] = data["tokens"][i]["upper_x"];
          token["upper_y"] = data["tokens"][i]["upper_y"];
          token["lower_x"] = data["tokens"][i]["lower_x"];
          token["lower_y"] = data["tokens"][i]["lower_y"];
          tokenList.push(token);
        }
        isAnnotate = true;
      }).fail(function(){});
})});}

function resetVar() {
  document.getElementById("cell-view").remove();
  selectedCell = -1;
  cellNum = 0;
  cellList = [];
  isAnnotate = false;
  tokenList = [];
}

function Saver() {
  $(function() {
    document.getElementById("save-str").addEventListener("click", function(){
      let tabStr = {}
      tabStr["pdf_name"] =  pdfURL;
      tabStr["table_page"] =  currentPageIndex;
      tabStr["table_left"] =  tableLeftViewer;
      tabStr["table_top"] =  tableTopViewer;
      tabStr["table_right"] =  tableRightViewer;
      tabStr["table_bottom"] =  tableBottomViewer;
      tabStr["canvas_heigt"] = document.getElementById("viewCanvas").height;
      tabStr["canvas_width"] = document.getElementById("viewCanvas").width;
      let cellStr = [];
      for (var i=0; i<cellList.length; i++) {
        let cellRow = document.getElementById("row"+cellList[i]["cellId"]).value;
        let cellCol = document.getElementById("col"+cellList[i]["cellId"]).value;
        let sRow = cellRow.split("-")[0];
        let eRow = cellRow.split("-")[1];
        let sCol = cellCol.split("-")[0];
        let eCol = cellCol.split("-")[1];
        let dict = {};
        dict["start_row"] = sRow;
        dict["end_row"] = eRow;
        dict["start_col"] = sCol;
        dict["end_col"] = eCol;
        dict["content"] = cellList[i]["content"];
        cellStr.push(dict);
      }
      tabStr["str"] = cellStr;
      $.ajax({
        type:"post",
        url:"/cgi-bin/table_annotator/saver.py",
        data:JSON.stringify(tabStr),
        dataType: "json"
      }).done(function(data){
        resetVar();
      }).fail(function(){});
})});}

function movePage(event) {
  const action = event.target.getAttribute("data-pager");
  if (action === "prev") {
    if (currentPageIndex === 0) {
      return;
    }
    currentPageIndex -= pageMode;
    if (currentPageIndex < 0) {
      currentPageIndex = 0;
    }
    render();
  }
  if (action === "next") {
    if (currentPageIndex === totalPagesCount - 1) {
      return;
    }
    currentPageIndex += pageMode;
    if (currentPageIndex > totalPagesCount - 1) {
      currentPageIndex = totalPagesCount - 1;
    }
    render();
  }
  document.getElementById("current-page").value = currentPageIndex + 1;
}

function jumpPage(e) {
  jumpTo = Number(e.target.value);
  if (jumpTo == NaN || jumpTo == 0 || jumpTo > totalPagesCount) {
    return 0;
  }
  currentPageIndex = jumpTo - 1;
  render();
}

function movePageByKey(e) {
  if (e.key == "ArrowRight" && currentPageIndex < totalPagesCount-1) {
    currentPageIndex += 1;
    render();
    document.getElementById("current-page").value = currentPageIndex + 1;
  }
  if (e.key == "ArrowLeft" && currentPageIndex > 0) {
    currentPageIndex -= 1;
    render();
    document.getElementById("current-page").value = currentPageIndex + 1;
  }
}

function pageMover() {
  const pager = document.querySelector("#pager");
  document.getElementById("current-page").max = totalPagesCount;
  document.getElementById("current-page").addEventListener("input", jumpPage);
  document.addEventListener('keydown', fillRowColumn);
  document.addEventListener('keydown', movePageByKey);
  pager.addEventListener("click", movePage);
  return () => {
    pager.removeEventListener("click", movePage);
  };
}

function cursorListener() {
  let viewer = document.getElementById("viewport");

  viewer.addEventListener("mousemove", function(e){
    cursorX = e.offsetX;
    cursorY = e.offsetY;
  });

  viewer.addEventListener("mousedown", function(e){
    cursorOnX = e.offsetX;
    cursorOnY = e.offsetY;
    cursorClickX = e.offsetX;
    cursorClickY = e.offsetY;
  });

  viewer.addEventListener("mouseup", function(e){
    cursorOffX = e.offsetX;
    cursorOffY = e.offsetY;
    if (isAnnotate) {
      if (selectedCell != -1){
        setTokens();
      }
    }
  });
}

function showTokensInCell() {
  removeTokenInfo();
  let divC = document.getElementById("#"+String(selectedCell));
  let divCellTokens = document.createElement("div");
  divCellTokens.id = "tokens#"+String(selectedCell);
  let k = findKey("#"+String(selectedCell));
  if (k > -1) {
    for (var i=0; i<cellList[k]["content"].length; i++) {
      cellText = cellList[k]["content"][i]["id"]+": "+cellList[k]["content"][i]["text"];
      divCellTokens.appendChild(document.createTextNode(cellText));
      divCellTokens.appendChild(document.createElement("br"));
    }
  }
  divC.appendChild(divCellTokens);
}

function setToken() {
  let tmp = [];
  for (var i=0; i<tokenList.length; i++) {
    if ((cursorClickX > tokenList[i]["upper_x"]) && (cursorClickY > tokenList[i]["upper_y"]) && (cursorClickX < tokenList[i]["lower_x"]) && (cursorClickY < tokenList[i]["lower_y"])) {
      let k = "#"+String(selectedCell);
      if (findToken(tokenList[i]["id"]) != true) {
        x = findKey(k);
        if (x>-1) cellList[x]["content"].push(tokenList[i]);
        else {
          dict = {}
          dict["cellId"] = k
          dict["content"] = [tokenList[i]];
          cellList.push(dict);
        }
        isSet = true;
        return true;
      }
    }
  }
  return false;
}

function setTokens() {
  if ((Math.abs(cursorOnX-cursorOffX) < 1) && (Math.abs(cursorOnY-cursorOffY) < 1)) {
    setToken();
    showTokensInCell();
    return 0;
  }
  let tmp = [];
  for (var i=0; i<tokenList.length; i++) {
    if ((cursorOnX < tokenList[i]["upper_x"]) && (cursorOnY < tokenList[i]["upper_y"]) && (cursorOffX > tokenList[i]["lower_x"]) && (cursorOffY > tokenList[i]["lower_y"])) {
      tmp.push(tokenList[i]);
      isSet = true;
    }
  }
  if (tmp.length < 1) {
    return 0;
  }
  let k = "#"+String(selectedCell);
  if (findKey(k) > -1) {
    dict = {}
    var x = findKey(k)
    dict["cellId"] = k
    dict["content"] = tmp;
    cellList[x] = dict;
  } else {
    dict = {}
    dict["cellId"] = k
    dict["content"] = tmp;
    cellList.push(dict);
  }
  showTokensInCell();
  return 0;
}

function render() {
  cursorIndex = Math.floor(currentPageIndex / pageMode);
  const startPageIndex = cursorIndex * pageMode;
  const endPageIndex =
    startPageIndex + pageMode < totalPagesCount
      ? startPageIndex + pageMode - 1
      : totalPagesCount - 1;

  const renderPagesPromises = [];
  for (let i = startPageIndex; i <= endPageIndex; i++) {
    renderPagesPromises.push(pdfInstance.getPage(i + 1));
  }

  Promise.all(renderPagesPromises).then(pages => {
    const pagesHTML = `<div id="viewArea" style="width: ${
      pageMode > 1 ? "50%" : "100%"
      }"><canvas id="viewCanvas"></canvas></div>`.repeat(pages.length);
    viewport.innerHTML = pagesHTML;
    pages.forEach(renderPage);
  });
}

function renderPage(page) {
  let pdfViewport = page.getViewport(1);

  const container =
    viewport.children[page.pageIndex - cursorIndex * pageMode];
  pdfViewport = page.getViewport(container.offsetWidth / pdfViewport.width);
  const canvas = container.children[0];
  const context = canvas.getContext("2d");
  canvas.height = pdfViewport.height;
  canvas.width = pdfViewport.width;

  page.render({
    canvasContext: context,
    viewport: pdfViewport
  });
}

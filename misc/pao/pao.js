var pao = null;

// Issues
//  4. would an explicit touch listener be smoother on mobile?

(function() {

var DEFAULT_TAB_NAME = 'PAO list';

function PAO() {
    var that = this;

    that.alphabet = [];
    var aCode = 'A'.charCodeAt(0);
    var zCode = 'Z'.charCodeAt(0);
    for(var ch = aCode; ch <= zCode; ch++) {
        that.alphabet.push(String.fromCharCode(ch));
    }

    that.wordTypes = [ "Person", "Action", "Object" ];

    that.pairs_pao = null;
    that.tabsAndAreas = [];
    that.paoGrids = {};
    that.tables = [];

    window.addEventListener('load', function() {
        var paoTables = document.getElementById('paoTables');
        var paoList = document.createElement("div");
        that.paoList = paoList;
        paoTables.appendChild(paoList);
        that._addTab(DEFAULT_TAB_NAME, paoList);

        for(var i = 0; i < that.wordTypes.length; i++) {
            var wordType = that.wordTypes[i];

            var grid = document.createElement("div");
            paoTables.appendChild(grid);
            that.paoGrids[wordType] = grid;

            that._addTab(wordType + " grid", grid);
        }
        that._createPaoList();
        that._createPaoGrids();

        window.addEventListener('hashchange', that._hashChange.bind(that));
        that._hashChange();
    });
}

PAO.prototype._addTab = function(title, area) {
    var that = this;

    var tabsDiv = document.getElementById('tabs');

    var tab = document.createElement("span");
    tab.appendChild(document.createTextNode(title));
    tab.classList.add("tab");
    tab.addEventListener('click', function(e) {
        that._tabClicked(e.target);
    });
    tab.area = area;

    tabsDiv.appendChild(tab);
    that.tabsAndAreas[title] = [ tab, area ];
    return tab;
};

PAO.prototype._tabClicked = function(tab) {
    var that = this;

    for(var title in that.tabsAndAreas) {
        if(that.tabsAndAreas.hasOwnProperty(title)) {
            var otherTab = that.tabsAndAreas[title][0];
            var otherArea = that.tabsAndAreas[title][1];
            if(otherTab == tab) {
                continue;
            }
            otherTab.classList.remove('active');
            otherArea.style.display = 'none';
        }
    }
    tab.classList.add('active');
    tab.area.style.display = '';
    that.activeTab = tab;
    that._updateHash();
};

PAO.prototype._hashChange = function(e) {
    var that = this;

    var hash = location.hash.substring(1);
    var desiredTab = null;
    that.pairs_pao = {};
    if(hash.length != 0) {
        var pairs = hash.split("&");
        for(var i = 0; i < pairs.length; i++) {
            // We don't allow "=" in pairs or PAOs.
            var pair_pao = pairs[i].split("=");
            if(pair_pao.length != 2) {
                that.log("Invalid pair=pao: " + pairs[i]);
                continue;
            }
            var pair = pair_pao[0];
            if(pair == "tab") {
                desiredTab = pair_pao[1];
                continue;
            }
            var pao = pair_pao[1].split(",");
            var validPair = false;
            if(pair.length == 2) {
                if(that.alphabet.indexOf(pair[0]) >= 0 && that.alphabet.indexOf(pair[1]) >= 0) {
                    validPair = true;
                }
            }
            if(!validPair) {
                that.log("Invalid pair: " + pair);
                continue;
            }
            if(pao.length != 3) {
                that.log("Invalid pao: " + pair_pao[1]);
                continue;
            }
            var paoDict = {
                'Person': pao[0],
                'Action': pao[1],
                'Object': pao[2]
            };
            that.pairs_pao[pair] = paoDict;
        }
    }
    var tab_area = that.tabsAndAreas[desiredTab] || that.tabsAndAreas[DEFAULT_TAB_NAME];
    that._tabClicked(tab_area[0]);
    that._refreshData();
};

PAO.prototype._cellClicked = function(e) {
    var that = this;

    var pair = e.target.dataset.pair;
    var type = e.target.dataset.type;
    if(!that.pairs_pao[pair]) {
        that.pairs_pao[pair] = {};
    }
    // Sanitize your inputs!
    var oldValue = that.pairs_pao[pair][type];
    var newValue = prompt("Enter word for " + pair + " " + type, oldValue || '');
    if(newValue === null) {
        return;
    }

    newValue = newValue.replace(/[=,&]/g, "");

    that.log("Old " + pair + " " + type + ": " + newValue);
    that.pairs_pao[pair][type] = newValue;
    that.log("New " + pair + " " + type + ": " + that.pairs_pao[pair][type]);

    that._updateHash();
};

PAO.prototype._updateHash = function() {
    var that = this;
    var pairStrs = [];
    var definedPairs = Object.keys(that.pairs_pao).sort();
    for(var i = 0; i < definedPairs.length; i++) {
        var pair = definedPairs[i];
        var paoDict = that.pairs_pao[pair];
        var paoArr = that.wordTypes.map(function(type) { return paoDict[type] || ''; });
        var pao = paoArr.join(",");
        var emptyArr = [ '', '', '' ];
        if(pao == emptyArr.join(",")) {
            continue;
        }

        pairStrs.push(pair + "=" + pao);
    }
    if(that.activeTab.textContent != DEFAULT_TAB_NAME) {
        pairStrs.push("tab=" + that.activeTab.textContent);
    }
    var hash = pairStrs.join("&");
    location.hash = hash;
};


PAO.prototype._refreshData = function() {
    var that = this;

    for(var i = 0; i < that.alphabet.length; i++) {
        for(var j = 0; j < that.alphabet.length; j++) {
            var pair = that.alphabet[i] + that.alphabet[j];
            for(var k = 0; k < that.wordTypes.length; k++) {
                var wordType = that.wordTypes[k];
                var word = (that.pairs_pao[pair] || {})[wordType] || '';

                var gridInputId = that._getGridInputId(pair, wordType);
                document.getElementById(gridInputId).textContent = word;
                var listInputId = that._getListInputId(pair, wordType);
                document.getElementById(listInputId).textContent = word;
            }
        }
    }
    
    // Refresh the sticky table headers for all tables
    $(that.tables).each(function(i, table) {
        var $table = $(table);
        var sticky = $table.data('sticky');
        sticky.refreshWidths.bind(sticky)();
    });
};

PAO.prototype._getListInputId = function(pair, wordType) {
    return "paoList" + pair + wordType;
};

PAO.prototype._createPaoList = function() {
    var that = this;

    var paoListTable = document.createElement("table");
    var paoListTableHead = document.createElement("thead");
    paoListTable.appendChild(paoListTableHead);

    var header = paoListTableHead.insertRow(-1);
    var cornerCell = document.createElement('th');
    cornerCell.appendChild(document.createTextNode("Pair"));
    header.appendChild(cornerCell); // corner
    for(var i = 0; i < that.wordTypes.length; i++) {
	var headerCell = document.createElement('th');
        header.appendChild(headerCell);
	headerCell.appendChild(document.createTextNode(that.wordTypes[i]));
    }

    var paoListTableBody = document.createElement("tbody");
    paoListTable.appendChild(paoListTableBody);

    for(var i = 0; i < that.alphabet.length; i++) {
        for(var j = 0; j < that.alphabet.length; j++) {
            var pair = that.alphabet[i] + that.alphabet[j];

            var row = paoListTableBody.insertRow(-1);

            var pairTextNode = document.createTextNode(pair);
            row.insertCell(-1).appendChild(pairTextNode);
            for(var k = 0; k < that.wordTypes.length; k++) {
                var wordType = that.wordTypes[k];
                var cell = row.insertCell(-1);
                cell.dataset.pair = pair;
                cell.dataset.type = wordType;
                cell.id = that._getListInputId(pair, wordType);
                cell.addEventListener('click', that._cellClicked.bind(that));
                cell.addEventListener('mouseover', that._mouseOverCell.bind(that));
                cell.addEventListener('mouseout', that._mouseOutCell.bind(that));
            }
        }
    }

    that.paoList.appendChild(paoListTable);
    that.tables.push(paoListTable);
    $(paoListTable).sticky({ columnCount: 1});
};

function elIndex(el) {
    var index = 0;
    while(el.previousElementSibling) {
        index++;
        el = el.previousElementSibling;
    }
    return index;
}

function findAncestor(el, cond) {
    if(el === null || cond(el)) {
        return el;
    }
    return findAncestor(el.parentNode, cond);
}

PAO.prototype._mouseOverCell = function(e) {
    this._hoverCell(e.target, true);
};

PAO.prototype._mouseOutCell = function(e) {
    this._hoverCell(e.target, false);
};

PAO.prototype._hoverCell = function(cell, hovered) {
    var column = elIndex(cell);
    var table = findAncestor(cell, function(anscestor) {
        return anscestor.tagName == "TABLE";
    });
    var cells = table.querySelectorAll("td:nth-child(" + (column+1) + ")");
    for(var i = 0; i < cells.length; i++) {
        if(hovered) {
            cells[i].classList.add('hovered');
        } else {
            cells[i].classList.remove('hovered');
        }
    }
    if(cell.cornerCells) {
        for(var i = 0; i < cell.cornerCells.length; i++) {
            var cornerCell = cell.cornerCells[i];
            if(hovered) {
//cornerCell.style.backgroundColor = 'red';
                cornerCell.textContent = cell.dataset.pair;
            } else {
//cornerCell.style.backgroundColor = '';
                cornerCell.innerHTML = "&nbsp;&nbsp;";
            }
        }
    }
};

PAO.prototype._getGridInputId = function(pair, wordType) {
    return "paoGrid" + pair + wordType;
};

PAO.prototype._createPaoGrids = function() {
    var that = this;

    for(var i = 0; i < that.wordTypes.length; i++) {
        var wordType = that.wordTypes[i];
        var grid = that.paoGrids[wordType];

        var paoGridTable = document.createElement("table");
        var paoGridTableHead = document.createElement("thead");
        paoGridTable.appendChild(paoGridTableHead);
        var header = paoGridTableHead.insertRow(-1);
        var cornerCell = document.createElement('th');
        header.appendChild(cornerCell); // corner
        for(var j = 0; j < that.alphabet.length; j++) {
	    var headerCell = document.createElement('th');
            header.appendChild(headerCell);
            headerCell.appendChild(document.createTextNode(that.alphabet[j]));
        }

        var paoGridTableBody = document.createElement("tbody");
        paoGridTable.appendChild(paoGridTableBody);
        var cell = null;
        for(var j = 0; j < that.alphabet.length; j++) {
            var row = paoGridTableBody.insertRow(-1);
            row.insertCell(-1).appendChild(document.createTextNode(that.alphabet[j]));
            for(var k = 0; k < that.alphabet.length; k++) {
                var pair = that.alphabet[j] + that.alphabet[k];
                cell = row.insertCell(-1);
                cell.dataset.pair = pair;
                cell.dataset.type = wordType;
                cell.cornerCells = [ cornerCell ];
                cell.id = that._getGridInputId(pair, wordType);
                cell.addEventListener('click', that._cellClicked.bind(that));
                cell.addEventListener('mouseover', that._mouseOverCell.bind(that));
                cell.addEventListener('mouseout', that._mouseOutCell.bind(that));
            }
        }
        // This will resize the corner appropriately.
        that._hoverCell(cell, false);

        grid.appendChild(paoGridTable);
        that.tables.push(paoGridTable);

        $(paoGridTable).sticky({ columnCount: 1 });
        var sticky = $(paoGridTable).data('sticky');
        var stickyCornerCell = sticky.$stickyTableCorner.find('tr')[0].children[0];
        var stickyHeaderCornerCell = sticky.$stickyTableHeader.find('tr')[0].children[0];
        var stickyColumnCornerCell = sticky.$stickyTableColumn.find('tr')[0].children[0];
        for(var j = 0; j < that.alphabet.length; j++) {
            for(var k = 0; k < that.alphabet.length; k++) {
                var pair = that.alphabet[j] + that.alphabet[k];
                var id = that._getGridInputId(pair, wordType);
                var cell = document.getElementById(id);
                cell.cornerCells.push(stickyCornerCell);
                cell.cornerCells.push(stickyHeaderCornerCell);
                cell.cornerCells.push(stickyColumnCornerCell);
            }
        }
    }

};

PAO.prototype.log = function(str) {
    console.log(str);
};

pao = new PAO();

})();

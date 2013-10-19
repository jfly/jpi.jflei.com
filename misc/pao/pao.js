var pao = null;

(function() {

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

    window.addEventListener('load', function() {
        var paoTables = document.getElementById('paoTables');
        var paoList = document.createElement("div");
        that.paoList = paoList;
        paoTables.appendChild(paoList);
        var defaultTab = that._addTab('PAO list', paoList);

        for(var i = 0; i < that.wordTypes.length; i++) {
            var wordType = that.wordTypes[i];

            var grid = document.createElement("div");
            paoTables.appendChild(grid);
            that.paoGrids[wordType] = grid;

            that._addTab(wordType + " grid", grid);
        }
        that._tabClicked(defaultTab);
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
    that.tabsAndAreas.push([ tab, area ]);
    return tab;
};

PAO.prototype._tabClicked = function(tab) {
    var that = this;

    for(var i = 0; i < that.tabsAndAreas.length; i++) {
        var otherTab = that.tabsAndAreas[i][0];
        var otherArea = that.tabsAndAreas[i][1];
        if(otherTab == tab) {
            continue;
        }
        otherTab.classList.remove('active');
        otherArea.style.display = 'none';
    }
    tab.classList.add('active');
    tab.area.style.display = '';
};

PAO.prototype._hashChange = function(e) {
    var that = this;

    var hash = location.hash.substring(1);
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

    that._refreshData();
};

PAO.prototype._cellClicked = function(e) {
    var pair = e.target.dataset.pair;
    var type = e.target.dataset.type;
    if(!this.pairs_pao[pair]) {
        this.pairs_pao[pair] = {};
    }
    // Sanitize your inputs!
    var oldValue = this.pairs_pao[pair][type];
    var newValue = prompt("Enter word for " + pair + " " + type, oldValue || '');
    if(newValue === null) {
        return;
    }

    newValue = newValue.replace(/[=,&]/g, "");

    this.log("Old " + pair + " " + type + ": " + newValue);
    this.pairs_pao[pair][type] = newValue;
    this.log("New " + pair + " " + type + ": " + this.pairs_pao[pair][type]);

    var pairStrs = [];
    var definedPairs = Object.keys(this.pairs_pao).sort();
    for(var i = 0; i < definedPairs.length; i++) {
        var pair = definedPairs[i];
        var paoDict = this.pairs_pao[pair];
        var paoArr = this.wordTypes.map(function(type) { return paoDict[type] || ''; });
        var pao = paoArr.join(",");
        var emptyArr = [ '', '', '' ];
        if(pao == emptyArr.join(",")) {
            continue;
        }

        pairStrs.push(pair + "=" + pao);
    }
    var hash = pairStrs.join("&");
    location.hash = hash;
};


PAO.prototype._refreshData = function() {
    var that = this;

    for(var i = 0; i < that.alphabet.length; i++) {
        for(var j = 0; j < that.alphabet.length; j++) {
            var pair = that.alphabet[i] + that.alphabet[j];
            for(var k = 0; k < this.wordTypes.length; k++) {
                var wordType = this.wordTypes[k];
                var word = (this.pairs_pao[pair] || {})[wordType] || '';

                var gridInputId = that._getGridInputId(pair, wordType);
                document.getElementById(gridInputId).textContent = word;
                var listInputId = that._getListInputId(pair, wordType);
                document.getElementById(listInputId).textContent = word;
            }
        }
    }
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
    header.insertCell(-1).appendChild(document.createTextNode("Pair"));
    for(var i = 0; i < that.wordTypes.length; i++) {
        header.insertCell(-1).appendChild(document.createTextNode(that.wordTypes[i]));
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
    if(cell.cornerCell) {
        if(hovered) {
            cell.cornerCell.textContent = cell.dataset.pair;
        } else {
            cell.cornerCell.innerHTML = "&nbsp;&nbsp;";
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
        var row = paoGridTableHead.insertRow(-1);
        var cornerCell = row.insertCell(-1); // corner
        for(var j = 0; j < that.alphabet.length; j++) {
            var headerCell = row.insertCell(-1);
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
                cell.cornerCell = cornerCell;
                cell.id = that._getGridInputId(pair, wordType);
                cell.addEventListener('click', that._cellClicked.bind(that));
                cell.addEventListener('mouseover', that._mouseOverCell.bind(that));
                cell.addEventListener('mouseout', that._mouseOutCell.bind(that));
            }
        }
        // This will resize the corner appropriately.
        that._hoverCell(cell, false);

        grid.appendChild(paoGridTable);
    }

};

PAO.prototype.log = function(str) {
    console.log(str);
};

pao = new PAO();

})();

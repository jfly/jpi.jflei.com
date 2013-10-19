(function( $, window ) {

  'use strict';

  var defaults = {
    offset: { top: 0, left: 0 },
    scrollContainer : window,
    headerCssClass : 'sticky-header',
    columnCssClass : 'sticky-column',
    cornerCssClass : 'sticky-corner',
    tableCssClass: 'table-non-sticky',
    columnCount : 0,
    cellWidth : 60,
    cellHeight: 20,
    cellCount : -1
  },

  tableCss = { 'table-layout': 'fixed' },
  stickyTableHeaderCss = $.extend( { 'position': 'fixed',
                                     'margin-bottom':'0px',
                                     'background-color':'white',
                                     'display': 'none' }, tableCss ),

  stickyTableColumnCss = $.extend( { 'position': 'fixed',
                                     'background-color': 'white',
                                     'display': 'none' }, tableCss ),

  stickyCornerCss = $.extend( { 'position': 'fixed',
                                'margin-bottom':'0px',
                                'background-color':'white',
                                'display': 'none' }, tableCss ),

  // event handler attached to scroll event,
  // will call StickyHeader.refresh with appropriate arguments
  scrollHandler = function( e ) {
    var stickytable = e.data,
        $scrollContainer;

    if ( stickytable.$table.is( ':hidden' ) ) {
      return;
    }
    $scrollContainer = $( stickytable.scrollContainer );
    stickytable.refresh( { top: $scrollContainer.scrollTop(),
                           left: $scrollContainer.scrollLeft() } );
  },

  resizeHandler = function( e ) {
    var stickytable = e.data,
        width;

    if ( stickytable.offsets ) {
      stickytable.offset = findMatchingOffset( stickytable.offsets ) || defaults.offset;
      stickytable.$stickyTableHeader.css( { 'top': stickytable.offset.top } );
    }

    scrollHandler( e );
  },

  findMatchingOffset = function( offsets ) {
    var width = $(window).width();
    for ( var i = 0; i < offsets.length; i++ ) {
      if ( width < offsets[i].width ) {
        return offsets[i];
      }
    }
    return offsets[offsets.length-1];
  },

  buildColumnSelector = function( columnCount ) {
    var columnSelector = [];
    for ( var i = 0; i < columnCount; i++ ) {
      columnSelector.push( 'td:nth-child(' + (i+1) + '), th:nth-child(' + (i+1) + ')' );
    }
    return columnSelector.join(',');
  },

  cloneCells = function( $cells, columnCount, maxRows ) {
    var cells = [], rows = [];

    for ( var i = 0; i < $cells.length; i++ ) {
      var td = $cells[i];
      cells.push( td.outerHTML );

      // skip columns when colspan is specified
      i += td.colSpan - 1;

      if ( i % columnCount === columnCount - 1 ) {
        rows.push( '<tr>' + cells.join('') + '</tr>' );
        if ( rows.length > maxRows ) {
          break;
        }
        cells = [];
      }
    }
    return rows.join('');
  };

  // StickyTable constructor function
  function StickyTable( $elm, options ) {
    this.$table = $elm;

    if ( $.isArray( options.offset ) ) {
      options.offsets = options.offset;
      options.offset = findMatchingOffset( options.offsets ) || defaults.offset;
    }
    $.extend( this, defaults, options );
  }

  StickyTable.prototype = {
    // attach scroll handler
    stick : function() {
      this.initialize();
      $( this.scrollContainer ).on( 'scroll', this, scrollHandler );
      $( this.scrollContainer ).on( 'resize', this, resizeHandler );
    },

    // detach scroll handler
    unstick : function() {
      $( this.scrollContainer ).off( 'scroll', scrollHandler );
      $( this.scrollContainer ).off( 'resize', resizeHandler );
    },

    remove: function() {
      this.unstick();
      this.$stickyTableHeader.remove();
      this.$stickyTableColumn.remove();
      this.$stickyTableCorner.remove();
      this.$table.removeClass( this.tableCssClass );
      delete this.$table.data().sticky;
    },

    // create sticky header, by clone thead of table
    createHeader : function() {
      // create dummy table to use for sticky header
      return $( '<table></table>' )
        .append( this.$table.find( 'thead' ).clone() )
        .css( $.extend( { 'top': this.offset.top }, stickyTableHeaderCss ) )
        .addClass( this.headerCssClass ) // add class from options
        .addClass( this.$table.attr( 'class' ) ); // add class(es) from real table
    },

    // create sticky column, by cloning first this.columnCount tds from table
    createColumn : function() {
      var that = this,
          // create dummy table to use for sticky column
          $column = $( '<table></table>' )
            .css( $.extend( { 'left':  this.offset.left, 'top':  this.offset.top },
                              stickyTableColumnCss ) )
            .addClass( this.columnCssClass ) // add class from options
            .addClass( this.$table.attr( 'class' ) ),  // add class(es) from real table
          columnSelector = buildColumnSelector( this.columnCount ); // jQuery selector for selecting columns to copy

      $column.append( cloneCells( this.$table.find( columnSelector ),
                                  this.columnCount ) );
      return $column;
    },

    // create a div element that acts as a corner
    createCorner : function() {
      var cornerCss = $.extend( {
        'left':  this.offset.left,
        'top':  this.offset.top,
        'z-index': 1000
      }, stickyTableColumnCss ),
        $corner = $( '<table></table>' )
          .css( cornerCss )
          .addClass( this.cornerCssClass )
          .addClass( this.$table.attr( 'class' ) ),
        columnSelector = buildColumnSelector( this.columnCount );

      $corner.append( cloneCells( this.$table.find( columnSelector ),
                                  this.columnCount, this.$table.find( 'thead tr' ).length - 1 /*i don't know why i need this -1 --jfly <<<*/ ) );

      return $corner;
    },

    // Initialize sticky header, creates $stickyTableHeader, $stickyTableColumn
    // and $stickyTableCorner which are the tables that are actually sticked to
    // the top and left of the screen.
    initialize : function() {
      this.$stickyTableHeader = this.createHeader();
      this.$stickyTableColumn = this.createColumn();
      this.$stickyTableCorner = this.createCorner();

      this.$table.addClass( this.tableCssClass );

      // mark real table
      this.$table.css( tableCss );

      // insert "dummies" before real table
      this.$table
        .before( '<style>' +
          'table tr td, table tr th { ' +
          '  height: ' + this.cellHeight + 'px;' +
          '}</style>' )
        .before( this.$stickyTableCorner )
        .before( this.$stickyTableColumn )
        .before( this.$stickyTableHeader );

      // guesstimate the cellcount based on first row
      if ( this.cellCount === -1 ) {
        this.cellCount = this.$table.find( 'tbody tr:eq(0) td' ).length;
      }
      //this.refreshWidths(); --jfly
    },

    // refresh sticky table, called when ever user scrolls
    //
    // show/hide the sticky header as needed
    refresh : function( offset ) {
      this.refreshWidths(); // --jfly
      var rawOffset = this.$table.offset(),
          tableOffSet = { top: rawOffset.top - this.offset.top,
                          left: rawOffset.left - this.offset.left },
          headerHidden = this.$stickyTableHeader.is( ':hidden' ),
          columnHidden = this.$stickyTableColumn.is( ':hidden' ),
          cornerHidden = this.$stickyTableCorner.is( ':hidden' );

      offset.top = offset.top || $( this.scrollContainer ).scrollTop();
      offset.left = offset.left || $( this.scrollContainer ).scrollLeft();

      // turn on sticky header
      if ( offset.top >= tableOffSet.top && headerHidden ) {
        this.$stickyTableHeader.show();
      }

      this.$stickyTableHeader.css( 'left', (offset.left * -1) + rawOffset.left );

      // turn off sticky header
      if ( offset.top < tableOffSet.top  && !headerHidden ) {
        this.$stickyTableHeader.hide();
      }

      // turn on sticky column
      if ( offset.left > tableOffSet.left && columnHidden ) {
        this.$stickyTableColumn.show();
      }

      this.$stickyTableColumn.css( 'top', (offset.top * -1) + rawOffset.top );

      // turn off sticky column
      if ( offset.left <= tableOffSet.left  && !columnHidden ) {
        this.$stickyTableColumn.hide();
      }

      // recalculate visibility of header and column
      headerHidden = this.$stickyTableHeader.is( ':hidden' );
      columnHidden = this.$stickyTableColumn.is( ':hidden' );

      // show corner if both header and column are visible
      if ( !headerHidden && !columnHidden && cornerHidden ) {
        this.$stickyTableCorner.show();
      }
      // hide corner when either header and column are hidden
      if ( ( headerHidden || columnHidden ) && !cornerHidden ) {
        this.$stickyTableCorner.hide();
      }
    },

    refreshWidths: function( ) {
      var width = this.cellCount * this.cellWidth,
          stickyColumnWidth = this.columnCount * this.cellWidth,
          cssWidth = { 'max-width': width, 'min-width': width, 'width': width };

      // --jfly
      var newHeaders = this.$stickyTableHeader.find("th");
      this.$table.find("th").each(function(i, th) {
          var $th = $(th);
          var $newHeader = $(newHeaders[i]);
          var width = $th.width() + 1; // +1 for table borders --jfly
          $newHeader.css( {
             'max-width': width,
             'min-width': width,
             'width': width
          } );
      });
      // --jfly
      /*this.$table.css( cssWidth );
      this.$stickyTableHeader.css( cssWidth );
      this.$stickyTableColumn.css( { 'max-width': stickyColumnWidth,
                                     'min-width': stickyColumnWidth,
                                     'width' : stickyColumnWidth } );

      this.$stickyTableCorner.css( { 'max-width': stickyColumnWidth,
                                     'min-width': stickyColumnWidth,
                                     'width' : stickyColumnWidth } );
      */
    }
  };

  // sticky - jquery extension that makes tables stick
  // ---------------------------------------------------
  //
  // sticks table headers to top of screen
  //
  // Usage:
  //
  //     $( '.mytable' ).sticky();
  //
  // Attaches it self to window.scroll, call unstick to detach:
  //
  //     $( '.mytable' ).sticky( 'unstick' );
  //
  // Options:
  //
  //     // offset to use for sticking top header - use if your header shouldn't be sticky a 0
  //     { offset: 0,
  //     // container to attach scroll to - use to scroll in div with overflow
  //       scrollContainer : window }
  $.fn.sticky = function( method, options ) {
    // use method a options if methods is an object
    options = $.extend( {}, typeof method === 'object' ? method : options || {} );

    // use method if provide, else assume fix
    method = typeof method === 'string' ? method : 'stick';

    this.each( function() {
      var $this = $(this),
          stickytable = $this.data( 'sticky' );

      // create and store fix header
      if ( !stickytable ) {
        if ( method === 'remove' ) {
          return;
        }
        $this.data( 'sticky', ( stickytable = new StickyTable( $this, options ) ) );
      }
      // call specified method
      stickytable[ method ]();
    } );
  };
} )( jQuery, window || {} );

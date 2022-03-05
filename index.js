$(function () {
  //called when save changes button is clicked.
  function saveChanges() {
    var grid = this;
    //attempt to save editing cell.
    if (grid.saveEditCell() === false) {
      return false;
    }

    if (grid.isDirty() && grid.isValidChange({ focusInvalid: true }).valid) {
      var gridChanges = grid.getChanges({ format: 'byVal' });

      //post changes to server
      $.ajax({
        dataType: 'json',
        type: 'POST',
        async: true,
        beforeSend: function (jqXHR, settings) {
          grid.showLoading();
        },
        url: 'https://paramquery.com/pro/products/batch', //for ASP.NET, java
        //url: '/products.php?pq_batch=1', for PHP
        data: {
          //JSON.stringify not required for PHP
          list: JSON.stringify(gridChanges),
        },
        success: function (changes) {
          //debugger;
          grid.commit({ type: 'add', rows: changes.addList });
          grid.commit({ type: 'update', rows: changes.updateList });
          grid.commit({ type: 'delete', rows: changes.deleteList });

          grid.history({ method: 'reset' });
        },
        complete: function () {
          grid.hideLoading();
        },
      });
    }
  }
  var obj = {
    hwrap: false,
    rowHt: 32,
    rowBorders: false,
    trackModel: { on: true }, //to turn on the track changes.
    toolbar: {
      items: [
        {
          type: 'button',
          icon: 'ui-icon-plus',
          label: 'New Product',
          listener: function () {
            //append empty row at the end.
            var rowData = { ProductID: 34, UnitPrice: 0.2 }; //empty row
            var rowIndx = this.addRow({
              rowData: rowData,
              checkEditable: true,
              rowIndxPage: 0,
            });
            this.goToPage({ rowIndx: rowIndx });
            this.editFirstCellInRow({ rowIndx: rowIndx });
          },
        },
        { type: 'separator' },
        {
          type: 'button',
          icon: 'ui-icon-disk',
          label: 'Save Changes',
          cls: 'changes',
          listener: saveChanges,
          options: { disabled: true },
        },
        {
          type: 'button',
          icon: 'ui-icon-cancel',
          label: 'Reject Changes',
          cls: 'changes',
          listener: function () {
            this.rollback();
            this.history({ method: 'resetUndo' });
          },
          options: { disabled: true },
        },
        {
          type: 'button',
          icon: 'ui-icon-cart',
          label: 'Get Changes',
          cls: 'changes',
          listener: function () {
            var changes = this.getChanges({ format: 'byVal' });
            if (console && console.log) {
              console.log(changes);
            }
            alert('Please see the log of changes in your browser console.');
          },
          options: { disabled: true },
        },
        { type: 'separator' },
        {
          type: 'button',
          icon: 'ui-icon-arrowreturn-1-s',
          label: 'Undo',
          cls: 'changes',
          listener: function () {
            this.history({ method: 'undo' });
          },
          options: { disabled: true },
        },
        {
          type: 'button',
          icon: 'ui-icon-arrowrefresh-1-s',
          label: 'Redo',
          listener: function () {
            this.history({ method: 'redo' });
          },
          options: { disabled: true },
        },
      ],
    },
    scrollModel: {
      autoFit: true,
    },
    swipeModel: { on: false },
    editor: {
      select: true,
    },
    title: '<b>Batch Editing</b>',
    history: function (evt, ui) {
      var $tb = this.toolbar();
      if (ui.canUndo != null) {
        $('button.changes', $tb).button('option', { disabled: !ui.canUndo });
      }
      if (ui.canRedo != null) {
        $("button:contains('Redo')", $tb).button(
          'option',
          'disabled',
          !ui.canRedo
        );
      }
      $("button:contains('Undo')", $tb).button('option', {
        label: 'Undo (' + ui.num_undo + ')',
      });
      $("button:contains('Redo')", $tb).button('option', {
        label: 'Redo (' + ui.num_redo + ')',
      });
    },
    colModel: [
      {
        title: 'Product ID',
        dataType: 'integer',
        dataIndx: 'ProductID',
        editable: false,
        width: 80,
      },
      {
        title: 'Product Name',
        width: 165,
        dataType: 'string',
        dataIndx: 'ProductName',
        validations: [
          { type: 'minLen', value: 1, msg: 'Required' },
          { type: 'maxLen', value: 40, msg: 'length should be <= 40' },
        ],
      },
      {
        title: 'Quantity Per Unit',
        width: 140,
        dataType: 'string',
        align: 'right',
        dataIndx: 'QuantityPerUnit',
        validations: [
          { type: 'minLen', value: 1, msg: 'Required.' },
          { type: 'maxLen', value: 20, msg: 'length should be <= 20' },
        ],
      },
      {
        title: 'Unit Price',
        width: 100,
        dataType: 'float',
        dataIndx: 'UnitPrice',
        validations: [{ type: 'gt', value: 0.5, msg: 'should be > 0.5' }],
        render: function (ui) {
          var cellData = ui.cellData;
          if (cellData != null) {
            return '$' + parseFloat(ui.cellData).toFixed(2);
          } else {
            return '';
          }
        },
      },
      { hidden: true },
      {
        title: 'Units In Stock',
        width: 100,
        dataType: 'integer',
        dataIndx: 'UnitsInStock',
        validations: [
          { type: 'gte', value: 1, msg: 'should be >= 1' },
          { type: 'lte', value: 1000, msg: 'should be <= 1000' },
        ],
      },
      {
        title: 'Discontinued',
        width: 100,
        dataType: 'bool',
        align: 'center',
        dataIndx: 'Discontinued',
        editor: false,
        type: 'checkbox',
        validations: [{ type: 'nonEmpty', msg: 'Required' }],
      },
      {
        title: '',
        editable: false,
        minWidth: 83,
        sortable: false,
        render: function (ui) {
          return "<button type='button' class='delete_btn'>Delete</button>";
        },
        postRender: function (ui) {
          var rowIndx = ui.rowIndx,
            grid = this,
            $cell = grid.getCell(ui);

          $cell
            .find('button')
            .button({ icons: { primary: 'ui-icon-scissors' } })
            .bind('click', function () {
              grid.addClass({ rowIndx: ui.rowIndx, cls: 'pq-row-delete' });

              setTimeout(function () {
                var ans = window.confirm(
                  'Are you sure to delete row No ' + (rowIndx + 1) + '?'
                );
                grid.removeClass({ rowIndx: rowIndx, cls: 'pq-row-delete' });
                if (ans) {
                  grid.deleteRow({ rowIndx: rowIndx });
                }
              });
            });
        },
      },
    ],
    postRenderInterval: -1, //call postRender synchronously.
    pageModel: { type: 'remote', rPP: 20 },
    create: function () {
      this.widget().pqTooltip();
    },
    dataModel: {
      dataType: 'JSON',
      location: 'remote',
      recIndx: 'ProductID',
      url: 'https://paramquery.com/pro/products/getP', //for ASP.NET
      //url: "/pro/products.php", //for PHP
    },
  };
  pq.grid('#grid_editing', obj);
});

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;
(function ($, window, document, undefined) {

    "use strict";

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window and document are passed through as local variables rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = "pagiNation",
        defaults = {
            beforePageChange: function (){},
            disabled: false,
            evtName: "pagination",
            firstPage: 1,
            lastPage: 1,
            cPages: 5,
            imgSource: 'paginatorLoader.gif',
            linkContainerSelector: '#paginacion',
            pageChangeFail: function (){},
            pageChangeSuccess: function (){}
        };


    function Paginator(options){
        this.options = options;
        
        this.container = $(this.options['containerSelector']);
        this.data = {}; // Persist data in between page changes 
        this.linkContainer = $(this.options['linkContainerSelector']);
        this.currentPage = 1;
        this.pages = [];
        
        var allPages = this.options['lastPage'] - this.options['firstPage'] + 1;
        this.cPages = (this.options['cPages'] === "all")? allPages: this.options['cPages'];
        
        this.init();
    }

    Paginator.prototype = {

        cambiarPagina: function (nuevaPag) {

	        var np = parseInt(nuevaPag, 10);

	        if (this.currentPage !== np && !this.disabled) {

	            this.deshabilitarLinksPaginacion();
	            this.overlay.fadeIn();

	            if (this.options['beforePageChange'])
	                this.options['beforePageChange'].apply(this);

	            this.fetchRemotePage(np);

	        } else {
	            alert("No necesito recargar la pagina");
	        }
	    },

    	buildOverlay: function(){
            var outer = $('<div></div>').css({
                'display':  'table',
                'position': 'absolute',
                'height':   '100%',
                'width':    '100%'
            });

            var middle = $('<div></div>').css({
                'display':        'table-cell',
                'vertical-align': 'middle'
            });

            var inner = $('<div></div>').css({
                'margin-left':  'auto',
                'margin-right': 'auto',
                'width':        '78px'
            });

            var img = $('<img>').attr("src", this.imgSource);
            var texto = '<br /><h2 style="color:#FFFFFF;">Cargando Página...</h2>';

            inner.append(img, texto);
            middle.append(inner);
            outer.append(middle);

            return $('<div></div>')
                    .addClass("overlay")
                    .css({
                        'position': 'absolute',
                        'top': '0',
                        'left': '0',
                        'width': '100%',
                        'height': '100%',
                        'z-index': '10',
                        'background-color': 'rgba(0,0,0,0.5)' /*dim the background*/
                    })
                    .append(outer);
    	},

    	setFirstPageLink: function(){
            var firstPage = this.options['firstPage'];
            
            if (firstPage) {
                $('#firstPagLink')
                    .click($.proxy(this, "cambiarPagina", firstPage))
                    .attr("href", "#!");

            }
    	},

    	setLastPageLink: function(){
            var lastPage = this.options['lastPage '];

            if (lastPage) {
                $('#lastPagLink')
                    .click($.proxy(this, "cambiarPagina", lastPage))
                    .attr("href", "#!");
            }
    	},

    	onChangeToPreviousPage: function(){
            var newPage   = this.currentPage - 1,
                            firstPage = this.options['firstPage'];

            if (newPage >= firstPage) {
                this.cambiarPagina(newPage);
            } else {
                alert("Can´t move before first page");
            }
    	},

    	setPrevPagLink: function(){
            $('#previousPagLink')
                .click($.proxy(this, "onChangeToPreviousPage"))
                .attr("href", "#!");
    	},

    	onChangeToNextPage: function(){
            var newPage  = this.currentPage + 1,
                lastPage = this.options['lastPage'];

            if (newPage <= lastPage)
                this.cambiarPagina(newPage);
            else
                alert("Can´t move beyond last page");
    	},

    	setNextPagLink: function(){
    		$('#nextPagLink')
                .click($.proxy(this, "onChangeToNextPage"))
                .attr("href", "#!");	
    	},

        // Esta saltando error aca, CORREGIR DESPUES
    	createLink: function(i){
            
            return $('<a>')
                .text(i)
                .attr("href", "#!")
                .on(this.options.evtName, null, this, function (e){
                    $(this).text(e.data.pages[i-1]);
                });
        
    	},

    	createLinks: function(){
            for (var i = 1, c = this.cPages, link; i <= c; i++) {
                link = this.createLink(i);
                link.appendTo(this.linkContainer).after(" ");
                this.pages.push(i);
            }
    	},

        init: function(){
            // Set special links
            this.setFirstPageLink();
            this.setLastPageLink();
            this.setPrevPagLink();
            this.setNextPagLink();

            this.overlay = this.buildOverlay();


            /* 
             * Si javascript no esta deshabilitado, saco los links obtenidos por 
             el servidor y los reemplazo por los mios
             */
            this.linkContainer.empty();

            // Seteo links correspondientes a las paginas
            this.createLinks();

            // Seteo comportamiento del container
            this.linkContainer.on("click", "a", this, function(e){
                e.data.cambiarPagina($(this).text());
            });


            this.overlay.hide();
            this.container
                .css('position', 'relative')
                .append(this.overlay);

        },

        // Habilita/Deshabilita los links de paginacion
        deshabilitarLinksPaginacion: function () { this.disabled = true; },

    	habilitarLinksPaginacion: function () {    this.disabled = false; },

        // Determina los nuevos numeros de paginas
        obtenerNuevasPaginas: function (nuevaPag) {

	        var
                nb_links = this.cPages, j = 0,
                tmp = nuevaPag - Math.floor(nb_links / 2),
                check = this.options['lastPage'] - nb_links + 1,
                limit = check > 0 ? check : 1,
                begin = tmp > 0 ? (tmp > limit ? limit : tmp) : 1,
                i = Math.round(begin);

	        while (i < begin + nb_links && i <= this.options['lastPage']) {
	            this.pages[j] = i;
	            i++, j++;
	        }

	    },

    	fetchRemotePage: function (pagina) {
	        var paginador = this;

	        $.ajax({
	            context: $('tbody#page'),
	            type: 'GET',
	            dataType: "html",
	            url: paginador.options['url'] + pagina
	        }).done(function (data, textStatus, jqXHR) {
	            // Reemplaza el contenido de la pagina
	            this.html(data);
	            // Calcula los nuevos numeros de pagina y le avisa a las paginas 
	            // que recarguen su numero de pagina
	            paginador.obtenerNuevasPaginas(pagina);

	            $(paginador.options['linkContainerSelector'] + ' a')
                            .trigger(paginador.options['evtName']);
                    
	            // Cambio el numero de pagina
	            paginador.currentPage = pagina;

	            if (paginador.options['pageChangeSuccess'])
	                paginador.options['pageChangeSuccess'].apply(paginador);


	        }).fail(function (jqXHR, textStatus, errorThrown) {
	            console.error('No se pudo cargar la pagina correctamente');

	            // En caso de fallo, reestablezco los links de la pagina
	            if (paginador.options['pageChangeFail'])
	                paginador.options['pageChangeFail'].apply(paginador);

	        }).always(function (jqXHR, textStatus, errorThrown) {
	            // Siempre...
	            // Rehabilito los links
	            paginador.habilitarLinksPaginacion();
	            // Saca el overlay
	            paginador.overlay.fadeOut();
	        });

	    }


    };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        p: null,
        init: function () {
            this.p = new Paginator(this.settings);
        },
        getData: function(){
            return this.p.data;
        },
        getCurrentPage: function (){
            return this.p.currentPage;
        }
    });

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[ pluginName ] = function (options) {
        var plug = null, methodName = "";
        
        if(typeof options === 'object'){
            return this.each(function () {
                if (!$.data(this, "plugin_" + pluginName)) {
                    $.data(this, "plugin_" + pluginName, new Plugin(this, options));
                }
            });
        } else if(typeof options === 'string'){
            methodName = options;
            plug = $.data(this[0], "plugin_" + pluginName);
            return plug[methodName]();
        }    
        
        
    };

})(jQuery, window, document);
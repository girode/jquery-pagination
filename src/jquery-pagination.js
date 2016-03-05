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
    var pluginName = "defaultPluginName",
            defaults = {
                propertyName: "value"
            };


    function Paginator(options){
    	this.pages = [];
		this.disabled = false;
		this.currentPage = 1;
		this.evtName = "pagination";
		this.options = options;
		this.container = $(this.options['container']);
		this.linkContainer = $(this.options['selectStr']) || $('#paginacion');
		this.data = {}; // Persist data in between page changes 
		this.overlay = this.buildOverlay();

		this.init();
    }


    Paginator.prototype = {

    	buildOverlay: function(){
    		var outer = $('<div></div>').css({
		        'display': 'table',
		        'position': 'absolute',
		        'height': '100%',
		        'width': '100%'
		    });

		    var middle = $('<div></div>').css({
		        'display': 'table-cell',
		        'vertical-align': 'middle'
		    });

		    var inner = $('<div></div>').css({
		        'margin-left': 'auto',
		        'margin-right': 'auto',
		        'width': '78px'
		    });

		    // PUT PATH TO IMAGE!!!!
		    var img = '';
		    // '<?php echo image_tag('/v2/images/matriculacion/paginatorLoader.gif') ?>';
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
		            }).append(outer);
    	},


		init: function(){
			var paginador = this, link;

	        // Seteo links de primer y ultima pagina
	        if (paginador.options['primerPagina']) {
	            $('#firstPagLink')
	                .click(function () {
	                    paginador.cambiarPagina(paginador.options['primerPagina']);
	                })
	                .attr("href", "#!");
	        }

	        if (paginador.options['ultimaPagina']) {
	            $('#lastPagLink')
	                    .click(function () {
	                        paginador.cambiarPagina(paginador.options['ultimaPagina']);
	                    })
	                    .attr("href", "#!");
	        }

	        /* 
	         * Si javascript no esta deshabilitado, saco los links obtenidos por 
	         el servidor y los reemplazo por los mios
	         */
	        this.linkContainer.empty();

	        // Seteo links correspondientes a las paginas
	        for (var i = 1, c = this.options.cPaginas; i <= c; i++) {

	            link = $('<a></a>')
	                    .text(i)
	                    .attr("href", "#!")
	                    .on(this.evtName, (function (j) {
	                        return function () {
	                            $(this).text(paginador.paginas[j]);
	                        };
	                    })(i - 1));


	            this.paginas.push(i);

	            link.appendTo(this.options['selectStr']).after(" ");
	        }

	        // Seteo comportamiento del container
	        this.linkContainer.on("click", "a", (function () {
	            return function () {
	                paginador.cambiarPagina($(this).text());
	            };
	        })());

	        this.overlay.hide();
	        $(this.options['container'])
	                .css('position', 'relative')
	                .append(this.overlay);


	        // Seteo los links de paginacion hacia adelante y hacia atras
	        $('#previousPagLink')
	                .click(function () {
	                    var nuevaPagina = paginador.paginaActual - 1;

	                    if (nuevaPagina >= paginador.options['primerPagina']) {
	                        paginador.cambiarPagina(nuevaPagina);
	                    } else {
	                        alert("No puedo pasarme de la primer pagina");
	                    }

	                })
	                .attr("href", "#!");

	        $('#nextPagLink')
	                .click(function () {
	                    var nuevaPagina = paginador.paginaActual + 1;

	                    if (nuevaPagina <= paginador.options['ultimaPagina'])
	                        paginador.cambiarPagina(nuevaPagina);
	                    else
	                        alert("No puedo pasarme de la ultima pagina");

	                })
	                .attr("href", "#!");
		},

		// Habilita/Deshabilita los links de paginacion
		deshabilitarLinksPaginacion: function () {
		    this.deshabilitado = true;
		},

    	habilitarLinksPaginacion: function () {
        	this.deshabilitado = false;
    	},

	    // Determina los nuevos numeros de paginas
	    obtenerNuevasPaginas: function (nuevaPag) {

	        var
                nb_links = this.options.cPaginas, j = 0,
                tmp = nuevaPag - Math.floor(nb_links / 2),
                check = this.options['ultimaPagina'] - nb_links + 1,
                limit = check > 0 ? check : 1,
                begin = tmp > 0 ? (tmp > limit ? limit : tmp) : 1,
                i = Math.round(begin);

	        while (i < begin + nb_links && i <= this.options['ultimaPagina']) {
	            this.paginas[j] = i;
	            i++, j++;
	        }

	    },

    	fetchRemotePage: function (pagina) {
	        var paginador = this;

	        $.ajax({
	            context: $('tbody#page'),
	            type: 'GET',
	            dataType: "html",
	            url: paginador.options['url'] + '?estado=<?php echo $estado ?>&pag=' + pagina
	        }).done(function (data, textStatus, jqXHR) {
	            // Reemplaza el contenido de la pagina
	            this.html(data);
	            // Calcula los nuevos numeros de pagina y le avisa a las paginas 
	            // que recarguen su numero de pagina
	            paginador.obtenerNuevasPaginas(pagina);
	            $(paginador.options['selectStr'] + ' a').trigger(paginador.evtName);
	            // Cambio el numero de pagina
	            paginador.paginaActual = pagina;

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

	    },


	    cambiarPagina: function (nuevaPag) {

	        var np = parseInt(nuevaPag, 10);

	        if (this.paginaActual !== np && !this.deshabilitado) {

	            this.deshabilitarLinksPaginacion();
	            this.overlay.fadeIn();

	            if (this.options['beforePageChange'])
	                this.options['beforePageChange'].apply(this);

	            this.fetchRemotePage(np);

	        } else {
	            alert("No necesito recargar la pagina");
	        }
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
        init: function () {

        	var p = new Paginator();


            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. this.element
            // and this.settings
            // you can add more functions like the one below and
            // call them like the example below
            this.yourOtherFunction("jQuery Boilerplate");
        },
        yourOtherFunction: function (text) {

            // some logic
            $(this.element).text(text);
        }
    });

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[ pluginName ] = function (options) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" +
                        pluginName, new Plugin(this, options));
            }
        });
    };

})(jQuery, window, document);
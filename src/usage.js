/* A ejecutar cuando se carga la pagina */
    $(document).ready(function(){
        var paginador = new Paginador({
            // 'imgSource': '<?php echo image_tag('/v2/images/matriculacion/paginatorLoader.gif') ?>',
            'containerSelector':     'div.sf_admin_list',
            'linkContainerSelector':     '#paginationLinks', 
            // 'firstPage':  <?php echo $pager->getFirstPage(); ?>,
            // 'lastPage':  <?php echo $pager->getLastPage();  ?>,
            // 'url':           '<?php echo url_for("pase_interno/getPageAjax") . "?estado= echo $estado &pag=" ?>',
            'beforePageChange': function () {
                $('ul.sf_admin_td_actions > li a').click(false);
            },
            'pageChangeFail': function () {
                $('ul.sf_admin_td_actions > li a').off('click');
            },
            'pageChangeSuccess': function () {
                // Tengo que restaurar los valores de los check
                var datosPaginaActual = this.data['personasSeleccionadas'][this.paginaActual];

                if(datosPaginaActual) {
                    for(var i = 0, c = datosPaginaActual.length ; i<c ; i++){
                        $('#page input[value="'+ datosPaginaActual[i] +'"][type="checkbox"]').prop('checked', true);  
                    }
                }

                // Restauro el valor del check maestro
                var m = paginador.data['checkMaestro'][this.paginaActual];
                if(m) {
                    $('#sf_admin_list_batch_checkbox').prop('checked', true);
                } else {
                    $('#sf_admin_list_batch_checkbox').prop('checked', false);
                }


                var pag        = this.paginaActual,
                    texto      = $('div.sf_admin_pagination')[0].nextSibling.nodeValue,
                    nuevoTexto = texto.replace(/\d+/g, function(allText, index){
                            return (index === 74)? pag: allText;  
                    });

                $('div.sf_admin_pagination')[0].nextSibling.nodeValue = nuevoTexto;    

            }
        });

        

        // Solo para debug: comentar
        window.p = paginador;

        $('form input:checkbox').prop('checked', false);
        paginador.data['personasSeleccionadas'] = {};
        paginador.data['checkMaestro'] = [];
        paginador.data['checkMaestro'][0] = 'nada';

        for(var i=<?php echo $pager->getFirstPage(); ?>;
            i<=<?php echo $pager->getLastPage();  ?>;
            i++) {
            paginador.data['checkMaestro'][i] = false;
        }

        /*    
         *  Handler de los checkbox "normales":  
         */

        $('table').on('change', "input[type='checkbox']:not([id='sf_admin_list_batch_checkbox'])", function(){

            var value = $(this).val(), index;

            if(!paginador.data['personasSeleccionadas'][paginador.paginaActual]){
                paginador.data['personasSeleccionadas'][paginador.paginaActual] = [];
                index = -1;
            } else {
                index = $.inArray(value, paginador.data['personasSeleccionadas'][paginador.paginaActual]);
            }   

            // Si tildo, agrego elemento
            if(this.checked){
                // Si no esta, lo agrego
                if (!(index > -1)) {
                    paginador.data['personasSeleccionadas'][paginador.paginaActual].push(value);
                }
            // Si destildo, quito elemento
            } else {
                // Si lo encuentra, lo saco
                if (index > -1) {
                    paginador.data['personasSeleccionadas'][paginador.paginaActual].splice(index, 1);
                }
            }    

        });


        /*
        * 
        *  Metodo submit del formulario: 
        *  - Agrega campos ocultos
        *  - Chequea que se haya seleccionado al menos un alumno
        * 
        */

        $('#sf_admin_content form').submit(function(){
            var $form = $(this), algunoSeleccionado = false;

            // borrar campos hidden si los hubiere (viejos) ?
            // console.log($("input[name^='ids_seleccionados']"));
            $("form input[type=hidden]").remove("[name^='ids_seleccionados']");

            // Tomo las personas del paginador y hago un poco de validacion
            var personas = paginador.data['personasSeleccionadas'];

            for(var pagina in personas){
                for(var i = 0, c = personas[pagina].length; i<c; i++){

                    if(!algunoSeleccionado) algunoSeleccionado = true;

                    $form.append($('<input>').attr({
                            type:  'hidden', 
                            value: personas[pagina][i],
                            name:  'ids_seleccionados[]'
                        })
                    );
                }
            }  

            /*
            * Contempla bug (se debe seleccionar al menos un elem de la pagina actual):
            *  - Seleciono uno
            *  - Cambio pagina
            *  - No selecciono ninguno
            *  - Pongo pasar => Tira error
            *  
            */ 
            // var haySeleccionadoEnPaginaActual = $("div#sf_admin_content > form input:checkbox:checked").length > 0;

            if(!algunoSeleccionado) alert("No se selecciono ningun alumno!");

            // if(!haySeleccionadoEnPaginaActual) alert("Debe haber al menos un alumno seleccionado en la pagina actual");

            return (!algunoSeleccionado /* || !haySeleccionadoEnPaginaActual*/ )? false: true;

        });


        /*
        *  
        *  Handler del checkbox "maestro"
        * 
        */

        $("#sf_admin_list_batch_checkbox").change(function(){
            var chequeado = this.checked;
            $('#page input[type="checkbox"]').prop('checked', chequeado).change(); 

            if(chequeado) {
                paginador.data['checkMaestro'][paginador.paginaActual] = true;
                if($('#cancel_all_div').is(':hidden'))
                    $('#select_all_div').show();
            }
            else {
                paginador.data['checkMaestro'][paginador.paginaActual] = false;
                if($('#select_all_div').is(':visible'))
                    $('#cancel_all_div').hide();
            }
        });

        /* Armo los divs necesarios y los agrego a la pagina */
        var optionsDiv = $("<div></div>")
            .append("<div id=\"select_all_div\"><p>Se han seleccionado todos los registros de esta pagina. ¿Desea seleccionar los registros de <a href=\"#!\"> todas las paginas?<\/a><\/p></div>")
            .append("<div id=\"cancel_all_div\"><p>Se han seleccionado todos los registros. ¿Desea <a href=\"#!\">cancelar</a> la seleccion de todos los registros?<\/p><\/div>");

        $("#sf_admin_content").before(optionsDiv);

        $('#select_all_div').hide();
        $('#cancel_all_div').hide();

        var timer;

        // Selecciona todos los registros de todas las paginas
        $('#select_all_div > p > a').click(function(){

            if(timer)
                clearTimeout(timer);

            timer = setTimeout(function () {
                $.ajax({
                    type: "POST",
                    url : '<?php echo url_for("pase_interno/getInfoAjax"); ?>',
                    data: { estado: "<?php echo $estado; ?>" },
                    dataType: 'json'
                }).done(function(msj){
                    paginador.data['personasSeleccionadas'] = msj;
                    $('#select_all_div').hide();
                    $('#cancel_all_div').show();
                    // Marcar todos los check de la pagina actual graficamente
                    $("input[type='checkbox']:not([id='sf_admin_list_batch_checkbox'])").prop('checked', true);

                    // Tambien tengo q marcar todos los master checkbox 
                    for(var i=<?php echo $pager->getFirstPage(); ?>;
                        i<=<?php echo $pager->getLastPage();  ?>;
                        i++) {
                        paginador.data['checkMaestro'][i] = true;
                    }


                }).fail(function( jqXHR, textStatus, errorThrown ){
                    alert("No se pudieron seleccionar todas las paginas");
                    console.error("No se pudo seleccionar todas las paginas");
                });
            }, 500);

            return false;
        });

        // Cancelar seleccion de todas las paginas
        $('#cancel_all_div > p > a').click(function(){
            paginador.data['personasSeleccionadas'] = {};

            for(var i=<?php echo $pager->getFirstPage(); ?>;
                i<=<?php echo $pager->getLastPage();  ?>;
                i++) 
            {
                paginador.data['checkMaestro'][i] = false;
            }

            // Desmarco todos los check
            $("input[type='checkbox']").prop('checked', false);

            $('#cancel_all_div').hide();
            return false;
        });


    }); // FIN

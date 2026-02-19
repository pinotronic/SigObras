/** Demo test application.
 *
 *  WARNING! ACHTUNG! THIS IS FOR DEVELOPMENT PURPOSES ONLY!!!
 *
 */

/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Dan "Ducky" Little
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

//JSOLIS: Definición de estilos para los resaltados de busqueda por solicitud WFS.
const highlightColor = '#FFFF00';
const highlightStyle = {
    'circle-color': highlightColor,
    'circle-stroke-color': highlightColor,
    'line-color': highlightColor,
    'line-width': 5,
    'line-opacity': 1,
    'fill-color': 'rgba(0, 0, 0, 0)'
};

var app = new gm3.Application({
    mapserver_url: CONFIG.mapserver_url,
    mapfile_root: CONFIG.mapfile_root ,
    resultsStyle: {
        highlight: highlightStyle,
    },
    map: {
        view: {
            extent: [-11344554.4270,2362744.9813,-11286080.1004,2418926.1971]
        },
        projection: 'EPSG:32614',
        scaleLine: {
            enabled: true,
            units: 'metric',
        }
    },
    lang: {
        es: './es.json?v=1.1',
    },
    //JSOLIS: En esta sección se establece el archivo de configuración de los mapas disponibles de GeoMoose: Mapbook.xml
    mapbooks: {
        'default': 'mapbook.xml?idDeploy=030620250942',
        'editing': 'mapbook-editing.xml',
        'test': 'mapbook-test-servers.xml'
    },
    serviceManager: {
        loadingHTML: '<div id="loading_sapal" style="margin-top: 10vh;"><center><img src="img/sapal_loading.gif" alt="Espere, por favor." width="90" height="110" /></center></div>',
    },
});

app.uiUpdate = function(ui) {
    // when the UI hint is set for the service manager
    //  show the service manager tab.
    if(ui.hint == 'service-manager' || ui.hint == 'service-start') {
        showTabByName('service-tab');
        app.clearHint();
    }
}

app.loadMapbook().then(function() {
    // JSOLIS: Se deifne la vista inicial por defecto del mapa
    app.setView({
        center: app.lonLatToMeters(-101.666609, 21.097551),
        zoom: 17
    });

    // establish some state trackers
    var tracker = new gm3.trackers.LocalStorageTracker(app.store);
    var hash_tracker = new gm3.trackers.HashTracker(app.store);

    tracker.restore();
    hash_tracker.restore();

    //JSOLIS: Se establecen de esta forma las proyecciones que manejará Geomoose
    app.addProjection({
        ref: 'EPSG:32614',
        def: '+proj=utm +zone=14 +ellps=WGS84 +datum=WGS84 +units=m +no_defs'
    });

    //JSOLIS: Apartado donde se deberán de registrar los servicios que utiliza GeoMoose
    //Asocia un nombre del toolbar especificado en el Mapbook.xml con una función definida en un script js que se vincula en el index.html mediante una etiqueta <script>
    //e.g. En esta línea: app.registerService('identify', IdentificarElemento);
    // app.registerService() => es el método que registra los servicios en GeoMoose
    // 'identify' => es el 'name' del toolbar definido en el archivo mapbook.xml 
    // 'IdentificarElemento' es el nombre de la función que se ejecuta al dar click en el toolbar
    // Para que Geomoose encuentre las funciones asociadas a los toolbars se referencian los archivos que las contienen con una etiqueta <script src="identificarElemento.js"></script> en el archivo index.html
    app.registerService('identify', IdentificarElemento);

    app.registerService('poligono', TrazarPoligonoService, {
        title: 'Trazar polígono',
        resultsTitle: 'Detalles del polígono',
        showGrid: true,
        defaultLayer: 'wfspredios/SS_MAP_INFO_PREDIOS',
        drawToolsLabel: 'Dibuja el polígono en el mapa para consultar los datos. Doble-click para finalizar el poligono.',
        keepAlive: true,
        tools:
        {
            'Polygon': true,
            'default': 'Polygon'
        },
        results: {
            showBufferAll: false,
            showLayerCount: false
        }
    });

    app.registerService('trazar', TrazarRutaService, {
        title: 'Trazar ruta',
        resultsTitle: 'Detalle de la consulta',
        showGrid: true,
        drawToolsLabel: 'Click a los puntos de la linea. Doble-click para finalizar la linea.',
        defaultLayer: 'wfspredios/SS_MAP_INFO_PREDIOS',
        keepAlive: true,
        tools:
        {
            'LineString': true,
            'default': 'LineString'
        },
        results: {
            showBufferAll: false,
            showLayerCount: false
        }
    });

    app.registerService('acercar', AcercarPorCoordenadasService, {
        fields: [
            { type: 'text', label: 'Utm x', name: 'x' },
            { type: 'text', label: 'Utm y', name: 'y' },
        ]
    });

    app.registerService('buffer-select', SelectService, {
        drawToolsLabel: 'Trazar',
        tools: {
            'buffer': true,
            'LineString': true,
        },
        // tell the app to use the select service templates
        //  for this services.
        alias: 'select',
    });
    app.registerService('VistaDeCalle',VistaDeCalleService);
    app.registerService('geocode', OSMGeocoder, {});
    
    //JSOLIS: Apartado donde se deberán de registrar las Actions que utiliza GeoMoose
    // This uses the OpenStreetMap Nominatim geocoder,
    // there is also a BingGeocoder service, but requires
    // signing up for Bing and getting an appropriate usage key.
    app.registerAction('findme', FindMeAction);
    app.registerAction('clear', LimpiarAction);
    //app.registerAction('cerrar', CerrarAction);
    app.registerAction('imprimir', ImprimirAction);
    app.registerAction('estadi', EstadisticasAction);
    app.registerAction('ruta', RutaLecturistasAction);
    app.registerAction('multicuentas', MultiCuentasAction);
    app.registerAction('actualizarcap', ActualizarCapasAction);
    app.registerAction('capasdina', CapasDinamicasAction);
    app.registerAction('cerrar', function() {
        this.run = function() {
            setTimeout(() => {fActualizarTituloModal('¡Atención!')}, 1);
            var desMensajeConfirmacion = '¿Seguro que desea cerrar su sesión?';
            app.confirm('reload-okay', desMensajeConfirmacion, function(response) {
                if(response === 'confirm') {
                    window.fDestruirSesion();
                }
            });
        }
    });

    //JSOLIS: Función que se ejecuta con la herramienta "Vista Completa"
    app.registerAction('fullextent', ZoomToAction, {
        extent: [-11391716.0735,2371688.1136,-11246103.5346,2442392.3648],
        zoom: 10
    });

    //JSOLIS: Registro de  plugins
    app.addPlugin(LimpiarSeleccionPlugin, 'limpiarseleccion-tab');
    app.addPlugin(EstadisticasComponent, 'estadisticas-tab');
    app.addPlugin(ActualizarCapasPlugin, 'actualizarcapas-tab');
    app.addPlugin(CapasDinamicasPlugin, 'capasdinamicas-tab');
    app.addPlugin(BuscarPlugin, 'buscar-tab');

    app.add(gm3.components.Catalog, 'catalog');
    // app.add(gm3.components.Favorites, 'favorites');
    // app.add(gm3.components.VisibleLayers, 'visible-layers');
    app.add(gm3.components.Toolbar, 'toolbar');
    app.add(gm3.components.Grid, 'results-grid');
    app.add(gm3.components.Version, 'version');

    var point_projections = [
        {
            label: 'UTM 14:  ',
            ref: 'EPSG:32614'
        }
    ];

    app.add(gm3.components.CoordinateDisplay, 'coordinate-display', {
        projections:  point_projections
    });
    //JSOLIS: Parámetros de configuración de la herramienta "Medir Longitud"
    app.add(gm3.components.ServiceManager, 'service-tab', {
        title: 'Medir longitud',
        services: true,
        measureToolOptions: {
            pointProjections: point_projections,
            initialUnits: 'm'
        }
    });

    app.add(gm3.components.Map, 'map', {});

    app.add(gm3.components.BookmarkModal, 'bookmark-modal', {});
    app.registerAction('bookmark', function() {
        this.run = function() {
            app.showModal('bookmark');
        }
    }, {});

    //JSOLIS: Función que se ejecuta con la herramienta "Restablecer"
    app.registerAction('reload', function() {
        this.run = function() {
            setTimeout(() => {fActualizarTituloModal('¡Atención!')}, 1);
            var reload_msg = '¿Deseas reiniciar la aplicación?';
            app.confirm('reload-okay', reload_msg, function(response) {
                if(response === 'confirm') {
                    document.location.hash = '';
                    if (document.location.search.length > 0) {
                        document.location.search = '';
                    } else {
                        document.location.reload();
                    }
                }
            });
        }
    });

    tracker.startTracking();
    hash_tracker.startTracking();

    showTab('catalog');

    // check the URL for starting up a service
    // This is a new feature available starting in GeoMoose 3.11!
    app.startServiceFromQuery();
});
/* JSOLIS: Objeto que define la ruta al servidor de MapServer y el directorio de los archivos .map en el servidor de MapServer
    A lo que se ajustó bajo las siguientes condicionantes:
    1. Se valida el entorno para indicar qué recursos deberá consumir: DEV, QA o Prod
    2. Se remplaza el valor asignado a la clave: mapfile_root por los siguientes argumentos:
        a. 'clUsuario': Debido a la necesidad de utilizar la clave del usuario en el servicio de MapServer. E.g. "Todas las capa" de la sección: "Capas Dinámicas".
        b. 'clToken': Debido a que no se encontró la forma de enviar el Token de JWT mediante el encabezado de la solicitud desde GeoMoose.
        c. 'pGid': Igualmente que el argumento 'clUsuario', este argumento es requerido en el servicio de MapServer. E.g. "Todas las capa" de la sección: "Capas Dinámicas".
*/

let vUrlMapServer = 'https://wsorquestador.sapal.gob.mx/api/exWSOrquestadorGeografico/FObtenerDatosMapServerData';
if(gClEnvironment !== undefined && gClEnvironment !== '')
    vUrlMapServer = 'https://'+gClEnvironment+'.wsorquestador.sapal.gob.mx/api/exWSOrquestadorGeografico/FObtenerDatosMapServerData';

var CONFIG = {
    mapserver_url: vUrlMapServer,
    mapfile_root: 'clusuario=' + gClUsuario +'/clToken='+pSessionData.clToken+"/pGid=" + gGid
};
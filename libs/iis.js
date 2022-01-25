var exec = require('child_process').exec;
var os = require("os");
var xml2js = require('xml2js');
var _ = require('underscore');

function Util_RetAppCmd()
{

    if( os.arch() === "x64" )
	{
		
		return process.env["windir"] + "\\syswow64\\inetsrv\\appcmd.exe";
		
	}else{
		
		return process.env["windir"] + "\\system32\\inetsrv\\appcmd.exe";
		
	}

}

async function SitesListar()
{

    return new Promise((resolve, reject) => {

        try {

            var parser = new xml2js.Parser();
			
            exec(Util_RetAppCmd() + " list site /xml", function(err, outxml){
				
				if(err)
				{
					
					reject(err);
					
				}else{
				
					parser.parseString(outxml, function(err, result) {
						
						if(err)
						{
							
							reject(err);
							
						}else{
							
							var RetFinal		= [];
							
							Object.keys(result.appcmd.SITE).map(function(ObjRet, ObjIdx){
								
								var TmpReg			= {};
								TmpReg["Name"]		= result.appcmd.SITE[ObjIdx]["$"]["SITE.NAME"];
								TmpReg["ID"]		= result.appcmd.SITE[ObjIdx]["$"]["SITE.ID"];
								TmpReg["Bindings"]	= [];
								TmpReg["State"]		= result.appcmd.SITE[ObjIdx]["$"]["state"];
								
								var TmpSep          = result.appcmd.SITE[ObjIdx]["$"]["bindings"].split(",");

								TmpSep.forEach(function(TmpSep2){

									if( TmpSep2 != "" )
									{

										TmpSep2         = TmpSep2.trim();
										TmpSep2			= TmpSep2.split(":");

										TmpReg["Bindings"].push({
										"Prefixo": TmpSep2[0],
										"Porta": TmpSep2[1],
										"Dominio": TmpSep2[2],
										});

									}
							
								});
								
								RetFinal.push(TmpReg);
								
							});
							
							resolve(RetFinal);

						}
						
					});
					
				}

            });

        } catch(err) {
            
            reject(err);

        }

    });

}

async function SitesRetCodigo(Dominio)
{

    return new Promise((resolve, reject) => {

		(async function(){
		
			try {

				var ListSites = await SitesListar();
				var CodigoRet = 0;
				
				ListSites.forEach(function(RegSite){

					if( RegSite.Name == Dominio )
					{

						CodigoRet = RegSite.ID;

					}
			
				});
				
				if( CodigoRet != 0 )
				{
					
					resolve(CodigoRet);
					
				}else{
					
					reject("Falha em Identificar Site");
					
				}
				
			} catch(err) {
				
				reject(err);

			}
		
		})();

    });

}

async function SitesRetDetalhes(Dominio)
{

    return new Promise((resolve, reject) => {

        try {

            var parser = new xml2js.Parser();
			
            exec(Util_RetAppCmd() + " list site \"" + Dominio + "\" /xml", function(err, outxml){
            
                parser.parseString(outxml, function(err, result) {
                
                    var RetFinal		= [];

                    if( result.appcmd.SITE )
                    {

                        Object.keys(result.appcmd.SITE).map(function(ObjRet, ObjIdx){
                            
                            var TmpReg			= {};
                            TmpReg["Name"]		= result.appcmd.SITE[ObjIdx]["$"]["SITE.NAME"];
                            TmpReg["ID"]		= result.appcmd.SITE[ObjIdx]["$"]["SITE.ID"];
                            TmpReg["Bindings"]	= [];
                            TmpReg["State"]		= result.appcmd.SITE[ObjIdx]["$"]["state"];
                            
                            var TmpSep          = result.appcmd.SITE[ObjIdx]["$"]["bindings"].split(",");

                            TmpSep.forEach(function(TmpSep2){

                                if( TmpSep2 != "" )
                                {

                                    TmpSep2         = TmpSep2.trim();
                                    TmpSep2			= TmpSep2.split(":");

                                    TmpReg["Bindings"].push({
                                    "Prefixo": TmpSep2[0],
                                    "Porta": TmpSep2[1],
                                    "Dominio": TmpSep2[2],
                                    });

                                }
                        
                            });
                            
                            RetFinal.push(TmpReg);
                            
                        });
                        
                    }
                    
                    if( RetFinal.length == 0 )
                    {

                        reject("Dominio nao localizado");

                    }else{

                        resolve(RetFinal[0]);

                    }
                    
                });

            });

        } catch(err) {
            
            reject(err);

        }

    });

}

async function SitesParar(Dominio)
{

    return new Promise((resolve, reject) => {

        try {

            var parser = new xml2js.Parser();
			
            exec(Util_RetAppCmd() + " stop site \"" + Dominio + "\" /xml", function(err, outxml){
            
                parser.parseString(outxml, function(err, result) {
                    
                    if(err)
                    {
                        
                        reject(err);
                        
                    }else{
                        
                        try {

                            var DadMensagem     = "";

                            if( result.appcmd.ERROR )
                            {

                                try {

                                    if( result.appcmd.ERROR[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.ERROR[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }else{

                                try {

                                    if( result.appcmd.STATUS[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.STATUS[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }
                        
                        } catch(err) {

                            resolve(err);
                            
                        }

                    }
                    
                });

            });

        } catch(err) {
            
            reject(err);

        }

    });

}

async function SitesIniciar(Dominio)
{

    return new Promise((resolve, reject) => {

        try {

            var parser = new xml2js.Parser();
			
            exec(Util_RetAppCmd() + " start site \"" + Dominio + "\" /xml", function(err, outxml){
            
                parser.parseString(outxml, function(err, result) {
                    
                    if(err)
                    {
                        
                        reject(err);
                        
                    }else{
                        
                        try {

                            var DadMensagem     = "";

                            if( result.appcmd.ERROR )
                            {

                                try {

                                    if( result.appcmd.ERROR[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.ERROR[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }else{

                                try {

                                    if( result.appcmd.STATUS[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.STATUS[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }
                        
                        } catch(err) {

                            resolve(err);
                            
                        }

                    }
                    
                });

            });

        } catch(err) {
            
            reject(err);

        }

    });

}

async function SitesCadastrar(Dominio)
{

    return new Promise((resolve, reject) => {

        try {

            var parser = new xml2js.Parser();
			
            exec(Util_RetAppCmd() + " add site /name:\"" + Dominio + "\" /physicalPath:\"" + Diretorio + "\" /bindings:http/*:80:" + Dominio + " /xml", function(err, outxml){
            
                parser.parseString(outxml, function(err, result) {
                    
                    if(err)
                    {
                        
                        reject(err);
                        
                    }else{
                        
                        try {

                            var DadMensagem     = "";

                            if( result.appcmd.ERROR )
                            {

                                try {

                                    if( result.appcmd.ERROR[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.ERROR[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }else{

                                try {

                                    if( result.appcmd.STATUS[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.STATUS[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }
                        
                        } catch(err) {

                            resolve(err);
                            
                        }

                    }
                    
                });

            });

        } catch(err) {
            
            reject(err);

        }

    });

}

async function PoolCadastrar(Dominio)
{

    return new Promise((resolve, reject) => {

        try {

            var parser = new xml2js.Parser();
			
            exec(Util_RetAppCmd() + " add apppool /name:\"" + Dominio + "\" /xml", function(err, outxml){
            
                parser.parseString(outxml, function(err, result) {
                    
                    if(err)
                    {
                        
                        reject(err);
                        
                    }else{
                        
                        try {

                            var DadMensagem     = "";

                            if( result.appcmd.ERROR )
                            {

                                try {

                                    if( result.appcmd.ERROR[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.ERROR[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }else{

                                try {

                                    if( result.appcmd.STATUS[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.STATUS[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }
                        
                        } catch(err) {

                            resolve(err);
                            
                        }

                    }
                    
                });

            });

        } catch(err) {
            
            reject(err);

        }

    });

}

async function PoolVincularEmSite(Dominio)
{

    return new Promise((resolve, reject) => {

        try {

            var parser = new xml2js.Parser();
			
            exec(Util_RetAppCmd() + " set site /site.name:\"" + Dominio + "\" /[path='/'].applicationPool:\"" + Dominio + "\" /xml", function(err, outxml){
            
                parser.parseString(outxml, function(err, result) {
                    
                    if(err)
                    {
                        
                        reject(err);
                        
                    }else{
                        
                        try {

                            var DadMensagem     = "";

                            if( result.appcmd.ERROR )
                            {

                                try {

                                    if( result.appcmd.ERROR[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.ERROR[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }else{

                                try {

                                    if( result.appcmd.STATUS[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.STATUS[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }
                        
                        } catch(err) {

                            resolve(err);
                            
                        }

                    }
                    
                });

            });

        } catch(err) {
            
            reject(err);

        }

    });

}

async function SitesBindingsCadastrar(Dominio, Protocolo, Porta, Valor)
{

    return new Promise((resolve, reject) => {

        try {

            var parser = new xml2js.Parser();
			
            exec(Util_RetAppCmd() + " set site /site.name:\"" + Dominio + "\" /+bindings.[protocol='" + Protocolo + "',bindingInformation='*:" + Porta + ":" + Valor + "'] /xml", function(err, outxml){
            
                parser.parseString(outxml, function(err, result) {
                    
                    if(err)
                    {
                        
                        reject(err);
                        
                    }else{
                        
                        try {

                            var DadMensagem     = "";

                            if( result.appcmd.ERROR )
                            {

                                try {

                                    if( result.appcmd.ERROR[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.ERROR[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }else{

                                try {

                                    if( result.appcmd.STATUS[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.STATUS[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }
                        
                        } catch(err) {

                            resolve(err);
                            
                        }

                    }
                    
                });

            });

        } catch(err) {
            
            reject(err);

        }

    });

}

async function SitesBindingsDeletar(Dominio, Protocolo, Porta, Valor)
{

    return new Promise((resolve, reject) => {

        try {

            var parser = new xml2js.Parser();
			
            exec(Util_RetAppCmd() + " set site /site.name:\"" + Dominio + "\" /-bindings.[protocol='" + Protocolo + "',bindingInformation='*:" + Porta + ":" + Valor + "'] /xml", function(err, outxml){
            
                parser.parseString(outxml, function(err, result) {
                    
                    if(err)
                    {
                        
                        reject(err);
                        
                    }else{
                        
                        try {

                            var DadMensagem     = "";

                            if( result.appcmd.ERROR )
                            {

                                try {

                                    if( result.appcmd.ERROR[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.ERROR[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }else{

                                try {

                                    if( result.appcmd.STATUS[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.STATUS[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }
                        
                        } catch(err) {

                            resolve(err);
                            
                        }

                    }
                    
                });

            });

        } catch(err) {
            
            reject(err);

        }

    });

}

async function SitesHandlersCarregar(Dominio)
{

    return new Promise((resolve, reject) => {

        try {

            var parser = new xml2js.Parser();
			
            exec(Util_RetAppCmd() + " list config \"" + Dominio + "\" -section:system.webServer/handlers /xml", function(err, outxml){
            
                parser.parseString(outxml, function(err, result) {
                
                    var RetFinal		= [];

                    if( result.appcmd.CONFIG )
                    {

                        Object.keys(result.appcmd.CONFIG[0]["system.webServer-handlers"][0]["add"]).map(function(ObjRet, ObjIdx){
                            
                            var TmpReg			            = {};
                            TmpReg["name"]		            = result.appcmd.CONFIG[0]["system.webServer-handlers"][0]["add"][ObjIdx]["$"]["name"];
                            TmpReg["path"]		            = result.appcmd.CONFIG[0]["system.webServer-handlers"][0]["add"][ObjIdx]["$"]["path"];
                            TmpReg["verb"]		            = result.appcmd.CONFIG[0]["system.webServer-handlers"][0]["add"][ObjIdx]["$"]["verb"];
                            TmpReg["modules"]		        = result.appcmd.CONFIG[0]["system.webServer-handlers"][0]["add"][ObjIdx]["$"]["modules"];
                            TmpReg["scriptProcessor"]		= result.appcmd.CONFIG[0]["system.webServer-handlers"][0]["add"][ObjIdx]["$"]["scriptProcessor"];
                            TmpReg["resourceType"]		    = result.appcmd.CONFIG[0]["system.webServer-handlers"][0]["add"][ObjIdx]["$"]["resourceType"];
                            TmpReg["requireAccess"]		    = result.appcmd.CONFIG[0]["system.webServer-handlers"][0]["add"][ObjIdx]["$"]["requireAccess"];
                            
                            RetFinal.push(TmpReg);
                            
                        });
                        
                    }
                    
                    if( RetFinal.length == 0 )
                    {

                        reject("Registros nao Localizados");

                    }else{

                        resolve(RetFinal);

                    }
                    
                });

            });

        } catch(err) {
            
            reject(err);

        }

    });

}

async function SitesHandlersCadastrar(Dominio, name, path, verb, modules, scriptProcessor, resourceType)
{

    return new Promise((resolve, reject) => {

        try {

            var parser = new xml2js.Parser();
			
            exec(Util_RetAppCmd() + " set config \"" + Dominio + "\" -section:system.webServer/handlers /+\"[name='" + name + "',path='" + path + "',verb='" + verb + "',modules='" + modules + "',scriptProcessor='" + scriptProcessor + "',resourceType='" + resourceType + "']\" /xml", function(err, outxml){
            
                parser.parseString(outxml, function(err, result) {
                    
                    if(err)
                    {
                        
                        reject(err);
                        
                    }else{
                        
                        try {

                            var DadMensagem     = "";

                            if( result.appcmd.ERROR )
                            {

                                try {

                                    if( result.appcmd.ERROR[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.ERROR[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }else{

                                try {

                                    if( result.appcmd.STATUS[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.STATUS[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }
                        
                        } catch(err) {

                            resolve(err);
                            
                        }

                    }
                    
                });

            });

        } catch(err) {
            
            reject(err);

        }

    });

}

async function SitesHandlersDeletar(Dominio, name, path, verb, modules, scriptProcessor, resourceType)
{

    return new Promise((resolve, reject) => {

        try {

            var parser = new xml2js.Parser();
			
            exec(Util_RetAppCmd() + " set config \"" + Dominio + "\" -section:system.webServer/handlers /-\"[name='" + name + "',path='" + path + "',verb='" + verb + "',modules='" + modules + "',scriptProcessor='" + scriptProcessor + "',resourceType='" + resourceType + "']\" /xml", function(err, outxml){
            
                parser.parseString(outxml, function(err, result) {
                    
                    if(err)
                    {
                        
                        reject(err);
                        
                    }else{
                        
                        try {

                            var DadMensagem     = "";

                            if( result.appcmd.ERROR )
                            {

                                try {

                                    if( result.appcmd.ERROR[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.ERROR[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }else{

                                try {

                                    if( result.appcmd.STATUS[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.STATUS[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }
                        
                        } catch(err) {

                            resolve(err);
                            
                        }

                    }
                    
                });

            });

        } catch(err) {
            
            reject(err);

        }

    });

}

async function SitesDefaultDocumentCarregar(Dominio)
{

    return new Promise((resolve, reject) => {

        try {

            var parser = new xml2js.Parser();
			
            exec(Util_RetAppCmd() + " list config \"" + Dominio + "\" /section:defaultDocument /xml", function(err, outxml){
            
                parser.parseString(outxml, function(err, result) {
                
                    var RetFinal		= [];

                    if( result.appcmd.CONFIG )
                    {
						
                        Object.keys(result.appcmd.CONFIG[0]["system.webServer-defaultDocument"][0]["files"][0]["add"]).map(function(ObjRet, ObjIdx){
                            
                            var TmpReg			            = {};
                            TmpReg["value"]		            = result.appcmd.CONFIG[0]["system.webServer-defaultDocument"][0]["files"][0]["add"][ObjIdx]["$"]["value"];
                            
                            RetFinal.push(TmpReg);
                            
                        });
                        
                    }

                    if( RetFinal.length == 0 )
                    {

                        reject("Registros nao Localizados");

                    }else{

                        resolve(RetFinal);

                    }
                    
                });

            });

        } catch(err) {
            
            reject(err);

        }

    });

}

async function SitesDefaultDocumentCadastrar(Dominio, name)
{

    return new Promise((resolve, reject) => {

        try {

            var parser = new xml2js.Parser();
			
            exec(Util_RetAppCmd() + " set config \"" + Dominio + "\" /section:defaultDocument /enabled:true /+files.[value='" + name + "'] /xml", function(err, outxml){
            
                parser.parseString(outxml, function(err, result) {
                    
                    if(err)
                    {
                        
                        reject(err);
                        
                    }else{
                        
                        try {

                            var DadMensagem     = "";

                            if( result.appcmd.ERROR )
                            {

                                try {

                                    if( result.appcmd.ERROR[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.ERROR[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }else{

                                try {

                                    if( result.appcmd.STATUS[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.STATUS[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }
                        
                        } catch(err) {

                            resolve(err);
                            
                        }

                    }
                    
                });

            });

        } catch(err) {
            
            reject(err);

        }

    });

}

async function SitesDefaultDocumentDeletar(Dominio, name)
{

    return new Promise((resolve, reject) => {

        try {

            var parser = new xml2js.Parser();
			
            exec(Util_RetAppCmd() + " set config \"" + Dominio + "\" /section:defaultDocument /enabled:true /-files.[value='" + name + "'] /xml", function(err, outxml){
            
                parser.parseString(outxml, function(err, result) {
                    
                    if(err)
                    {
                        
                        reject(err);
                        
                    }else{
                        
                        try {

                            var DadMensagem     = "";

                            if( result.appcmd.ERROR )
                            {

                                try {

                                    if( result.appcmd.ERROR[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.ERROR[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }else{

                                try {

                                    if( result.appcmd.STATUS[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.STATUS[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }
                        
                        } catch(err) {

                            resolve(err);
                            
                        }

                    }
                    
                });

            });

        } catch(err) {
            
            reject(err);

        }

    });

}

async function SitesPermissaoPasta(diretorio, usuario)
{

    return new Promise((resolve, reject) => {

        try {

            exec("icacls \"" + diretorio + "\" /grant " + usuario + ":(OI)(CI)F /T", function(err, outxml){
            
                if(err)
				{
					
					reject(err);
					
				}else{
					
					var TmpSep          = outxml.split("\n");
					var TmpRet          = [];

					TmpSep.forEach(function(TmpSep2){

						if( TmpSep2 != "" )
						{

							TmpSep2         = TmpSep2.trim();

							if( TmpSep2 != "" )
							{

								TmpRet.push(TmpSep2);

							}

						}
				
					});
					
					if( outxml.indexOf("sucess") !== -1 )
					{
						
						resolve(TmpRet);
						
					}else{
						
						reject(TmpRet);
						
					}
					
				}

            });

        } catch(err) {
            
            reject(err);

        }

    });

}

async function SitesBackup(Nome)
{

    return new Promise((resolve, reject) => {

        try {

            var parser = new xml2js.Parser();
			
            exec(Util_RetAppCmd() + " add backup " + Nome + " /xml", function(err, outxml){
            
                parser.parseString(outxml, function(err, result) {
                    
                    if(err)
                    {
                        
                        reject(err);
                        
                    }else{
                        
                        try {

                            var DadMensagem     = "";

                            if( result.appcmd.ERROR )
                            {

                                try {

                                    if( result.appcmd.ERROR[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.ERROR[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }else{

                                try {

                                    if( result.appcmd.STATUS[0]["$"]["message"] )
                                    {
    
                                        var DadMensagem     = result.appcmd.STATUS[0]["$"]["message"];
    
                                    }
                                
                                } catch(err) {
    
                                    //
                                    
                                }

                                resolve(DadMensagem);

                            }
                        
                        } catch(err) {

                            resolve(err);
                            
                        }

                    }
                    
                });

            });

        } catch(err) {
            
            reject(err);

        }

    });

}

async function SitesConfigSSL(Wacs, CodigoDominio, Dominio, Dominios, Email)
{

    return new Promise((resolve, reject) => {

		try {

			exec(Wacs + " --target iis --siteid " + CodigoDominio + " --host " + Dominios + " --commonname " + Dominio + " --installation iis --emailaddress " + Email + " --accepttos", function(err, outxml){
				
				if(err)
				{
					
					reject(err);
					
				}else{
					
					var TmpSep          = outxml.split("\n");
					var TmpRet          = [];

					TmpSep.forEach(function(TmpSep2){

						if( TmpSep2 != "" )
						{

							TmpSep2         = TmpSep2.trim();

							if( TmpSep2 != "" )
							{

								TmpRet.push(TmpSep2);

							}

						}
				
					});
					
					if( outxml.indexOf("created") !== -1 )
					{
						
						resolve(TmpRet);
						
					}else{
						
						reject(TmpRet);
						
					}
					
				}
				
			});
			
		} catch(err) {
			
			reject(err);

		}

    });

}

module.exports.SitesListar = SitesListar;
module.exports.SitesRetCodigo = SitesRetCodigo;
module.exports.SitesRetDetalhes = SitesRetDetalhes;
module.exports.SitesParar = SitesParar;
module.exports.SitesIniciar = SitesIniciar;
module.exports.SitesCadastrar = SitesCadastrar;
module.exports.PoolCadastrar = PoolCadastrar;
module.exports.PoolVincularEmSite = PoolVincularEmSite;

module.exports.SitesBindingsCadastrar = SitesBindingsCadastrar;
module.exports.SitesBindingsDeletar = SitesBindingsDeletar;

module.exports.SitesHandlersCarregar = SitesHandlersCarregar;
module.exports.SitesHandlersCadastrar = SitesHandlersCadastrar;
module.exports.SitesHandlersDeletar = SitesHandlersDeletar;

module.exports.SitesDefaultDocumentCarregar = SitesDefaultDocumentCarregar;
module.exports.SitesDefaultDocumentCadastrar = SitesDefaultDocumentCadastrar;
module.exports.SitesDefaultDocumentDeletar = SitesDefaultDocumentDeletar;

module.exports.SitesPermissaoPasta = SitesPermissaoPasta;

module.exports.SitesBackup = SitesBackup;
module.exports.SitesConfigSSL = SitesConfigSSL;
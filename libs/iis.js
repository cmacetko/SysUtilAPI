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
			
            exec(Util_RetAppCmd() + " list site \"" + Dominio + "\" /config /xml", function(err, outxml){
				
				if(err)
				{
					
					reject(err);
					
				}else{
				
					parser.parseString(outxml, function(err, result) {
						
						if(err)
						{
							
							reject(err);
							
						}else{
							
							var RetFinal		= {
							"Diretorio": 		""
							};
							
							try {
									
								result.appcmd.SITE[0].site[0].application[0]["virtualDirectory"].forEach(function(TmpSep1){

									if( TmpSep1["$"]["path"] == "/" )
									{
										
										if( TmpSep1["$"]["physicalPath"] != "" )
										{
											
											RetFinal["Diretorio"]		= TmpSep1["$"]["physicalPath"].trim();
											
										}
										
									}
							
								});
							
							} catch(err) {
								
							}
							
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
module.exports.SitesConfigSSL = SitesConfigSSL;
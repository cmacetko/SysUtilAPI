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
					
					throw err;
					
				}else{
				
					parser.parseString(outxml, function(err, result) {
						
						if(err)
						{
							
							throw err;
							
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
            
            throw err;

        }

    });

}

module.exports.SitesListar = SitesListar;
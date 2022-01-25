var fs = require("fs");
var tmp = require("tmp");
var uuid = require("uuid");
var filesize = require("filesize");
var http = require('http');
var async = require('async');
var path = require('path');
var iis = require('./libs/iis');

var wkhtmltopdf = require("wkhtmltopdf");
var PDFImage = require("cmacetko-pdf-to-image").PDFImage;
var Tesseract = require("tesseract.js");
var ping = require('ping');
var Traceroute = require('nodejs-traceroute');
var whois = require('whois-json');
var geoip = require('geoip-lite');
var dns = require('native-dns');
var Screenshot = require("node-server-screenshot");
var ObjPix = require('faz-um-pix');
var imagemagick = require('imagemagick');
var Leite = require('leite')
var QRCode = require('qrcode')
var SitemapGenerator = require('sitemap-generator');
var sinespApi = require('sinesp-api');
var CNPJ = require('consulta-cnpj-ws');
var checkSslCertificate = require('checkSslCertificate').default
var getSize = require('get-folder-size');
var drivelist = require('@syndicats/drivelist');
var checkDiskSpace = require('check-disk-space')
var sslChecker = require('ssl-checker')
var FilezillaCtrl = require('ctrlfilezillaserver');

var express = require("express");
var bodyParser = require("body-parser");
var basicAuth = require('express-basic-auth')

const SimpleNodeLogger = require('simple-node-logger'),
opts = {
    logDirectory: __dirname + '/logs/',
    fileNamePattern: 'logs-<DATE>.txt',
    timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS'
},  
log = SimpleNodeLogger.createRollingFileLogger(opts);

const { Cfg } = require('./util/Constants');

var start = process.hrtime();

const sendRes = function(callback, IsSucesso, data){

	if( IsSucesso == true )
	{
		
		var response = {
        httpcode: 200,
		body: data
		};
		
	}else{
		
		var response = {
        httpcode: 500,
		body: data
		};
		
	}
    
	callback.json(response);

};

const remover_arquivo = function(filename){

    fs.unlink(filename, (err) => {

        if(err) 
        {
            
            log.error("unlink | error");
            log.error(err);
            
        }else{

            log.info("unlink | sucesso");
            
        }
    
    })

};

const remover_arquivo2 = function(filenames){

    filenames.forEach(function(filename){

        fs.unlink(filename, (err) => {

            if(err) 
            {
                
                log.error("unlink: " + filename + " | error");
                log.error(err);
                
            }else{

                log.info("unlink: " + filename + " | sucesso");
                
            }
        
        });

    });

};

var elapsed_time = function(){

    var precision = 10;
    var elapsed = process.hrtime(start)[1] / 1000000; 
    
    return process.hrtime(start)[0] + "s " + elapsed.toFixed(precision) + "ms";

}

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.use(function(req, res, next){

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Credentials", true);

    next();

});

app.use(basicAuth({
    users: Cfg.Usuarios
}))

app.get("/", function(req, res){

    sendRes(res, true, {"Msg": "Utilize um dos metodos disponiveis"});
    
});

app.post("/teste_conexao", function(req, res){

    sendRes(res, true, {"Msg": "Tudo OK"});
    
});

app.post("/url_to_pdf", function(req, res){

    if(req.body.url) 
	{

        log.info("-------------------------------------");
        log.info("Funcao: url_to_pdf");
        log.info("Usuario: " + req.auth.user);
        log.info("Link: " + req.body.url);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: url_to_pdf");
        console.log("Usuario: " + req.auth.user);
        console.log("Link: " + req.body.url);
    
        start = process.hrtime(); 

        var filename = uuid() + ".pdf";
		var output = __dirname + "/tmp/" + filename;
        var writeStream = fs.createWriteStream(output);

		wkhtmltopdf(req.body.url, req.body.options, function(code, signal) {

            log.info("wkhtmltopdf | code: " + code);
            log.info("wkhtmltopdf | signal: " + signal);

			if( code != null )
			{
            
                log.error("wkhtmltopdf | error");
                
                remover_arquivo(output);
				sendRes(res, false, {"Msg": "Falha Gerada pelo wkhtmltopdf"});
				
			}else{

                log.info("wkhtmltopdf | Sucesso");

                var stats = fs.statSync(output);

                fs.readFile(output, {encoding: 'base64'}, function (err, data) {

                    if(err) 
                    {
                        
                        log.error("readFile | error");
                        log.error(err);

                        remover_arquivo(output);
                        sendRes(res, false, {"Msg": "Falha em ler Raw"});

                    }else{

                        var TempoDuracao = elapsed_time();

                        remover_arquivo(output);

                        log.info(">>> SUCESSO <<<")
                        log.info("filename: " + filename)
                        log.info("Tamanho: " + stats.size)
                        log.info("Tamanho2: " + filesize(stats.size, {round: 0}))
                        log.info("Duracao: " + TempoDuracao)

                        console.log("Tamanho: " + stats.size)
                        console.log("Tamanho2: " + filesize(stats.size, {round: 0}))
                        console.log("Duracao: " + TempoDuracao);

                        sendRes(res, true, {"Nome": filename, "Tamanho": stats.size, "Tamanho2": filesize(stats.size, {round: 0}), "Pdf": data.toString(), "Duracao": TempoDuracao});

                    }

                });
			
			}

		}).pipe(writeStream);

	}else{

        log.warn("Url nao informada");
    
		sendRes(res, false, {"Msg": "Url nao informada"});

	}

});

app.post("/pdf_to_jpg", function(req, res){

    if(req.body.url) 
	{

        log.info("-------------------------------------");
        log.info("Funcao: pdf_to_jpg");
        log.info("Usuario: " + req.auth.user);
        log.info("Link: " + req.body.url);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: pdf_to_jpg");
        console.log("Usuario: " + req.auth.user);
        console.log("Link: " + req.body.url);
    
        start = process.hrtime(); 

        var filenamepre = uuid();
        var filename = filenamepre + ".pdf";
		var output = __dirname + "/tmp/" + filename;
        var writeStream = fs.createWriteStream(output);

		var request = http.get(req.body.url, function(response) {
            
            if( res.statusCode == 200 )
            {

                response.pipe(writeStream).on('finish', function() {
                    
                    var PDFImage = require("cmacetko-pdf-to-image").PDFImage;
                    
                    var pdfImage = new PDFImage(output, {
                        outputDirectory: __dirname +  "/output/",
                        convertExtension: "jpg",
                        QtdPaginas: req.body.QtdPaginas || 0,
                        convertOptions: {
                        "-density": "150",
                        "-quality": "85",
                        "-background": "White",
                        "-alpha": "remove",
                        "-colorspace": "rgb"
                        }
                    });

                    pdfImage.convertFile().then(function(imagesPath) {
                    
                        log.info(">>> SUCESSO <<<")
                        log.info(imagesPath);
						
						let TmpListArqs = [];
					
						imagesPath.forEach(function(imageObj){

							let TmpStg1 = imageObj;
							TmpStg1 = TmpStg1.replace(".jpg", "");
							TmpStg1 = TmpStg1.split("-");
							TmpStg1.reverse();
							
							let TmpStg2 = parseInt(TmpStg1[0]);
							TmpStg2 = TmpStg2 + 1;
												
							TmpListArqs.push({ "Pagina": TmpStg2, "Imagem": imageObj });
							
						});

                        var TempoDuracao = elapsed_time();

                        let TmpList = [];
                        let TmpCtrl1 = 0;

                        async.eachSeries(
                        TmpListArqs,
                        function(ObjFile, cb) {

                            TmpCtrl1++;
							
							console.log(ObjFile);

							let filename = ObjFile["Imagem"];
                            let TmpFile = {};
                            var stats = fs.statSync(filename);

                            fs.readFile(filename, {encoding: 'base64'}, function(err, content) {
                            
                                if(err) 
                                {
                                    
                                    log.error("readFile | error no arquivo: " + filename);
                                    log.error(err);

                                    remover_arquivo2(imagesPath);
                                    sendRes(res, false, {"Msg": "Falha em ler Raw"});

                                }else{

                                    log.info("Pagina: " + ObjFile["Pagina"]);
                                    log.info("Tamanho: " + stats.size)
                                    log.info("Tamanho2: " + filesize(stats.size, {round: 0}))

                                    console.log("Pagina: " + ObjFile["Pagina"])
                                    console.log("Tamanho: " + stats.size)
                                    console.log("Tamanho2: " + filesize(stats.size, {round: 0}))

                                    TmpFile["Pagina"]           = ObjFile["Pagina"];
                                    TmpFile["Tamanho"]          = stats.size;
                                    TmpFile["Tamanho2"]         = filesize(stats.size, {round: 0});
                                    TmpFile["Imagem"]           = content.toString();

                                    TmpList.push(TmpFile);

                                    cb(err);

                                }

                            });
                        },
                        function(err) {
							
                            remover_arquivo(output);
							remover_arquivo2(imagesPath);
                            sendRes(res, true, {"Arquivos": TmpList, "Duracao": TempoDuracao});

                        }
                        );

                    }, function (err) {
                    
                        log.warn("Falha no convertFile");
                        log.warn(err);
        
                        remover_arquivo(output);
                        sendRes(res, false, {"Msg": "Falha em Convert PDF"});

                    });

                }).on('error', function(e){
                    
                    log.warn("Falha no pipe");
                    log.warn(e);
    
                    remover_arquivo(output);
                    sendRes(res, false, {"Msg": "Falha em Obter Raw do Arquivo"});

                });

            }else{

                log.warn("Falha em Obter Arquivo - Status Code: " + res.statusCode);
    
                remover_arquivo(output);
		        sendRes(res, false, {"Msg": "Falha em Obter Arquivo - Status Code: " + res.statusCode});
                
            }

        });

	}else{

        log.warn("Url nao informada");
    
		sendRes(res, false, {"Msg": "Url nao informada"});

	}

});

app.post("/ocr", function(req, res){

    if(req.body.url) 
	{

        log.info("-------------------------------------");
        log.info("Funcao: ocr");        
        log.info("Usuario: " + req.auth.user);
        log.info("Link: " + req.body.url);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: ocr");        
        console.log("Usuario: " + req.auth.user);
        console.log("Link: " + req.body.url);
    
        start = process.hrtime(); 

        var filenamepre = uuid();
        var filename = filenamepre + ".jpg";
		var output = __dirname + "/tmp/" + filename;
        var writeStream = fs.createWriteStream(output);

		var request = http.get(req.body.url, function(response) {
            
            if( res.statusCode == 200 )
            {

                response.pipe(writeStream).on('finish', function() {
                    
                    Tesseract.recognize(
                    output,
                    'por',
                    { 
                        /*
                        logger: function(m){

                            console.log(m);

                        },
                        */
                        errorHandler: function(err){

                            log.warn("Falha no OCR");
                            log.warn(err);
            
                            remover_arquivo(output);
                            sendRes(res, false, {"Msg": "Falha no OCR"});

                        }
                    }
                    ).then(({ data: { text } }) => {

                        log.info(">>> SUCESSO <<<");
                        log.info(text);

                        var TempoDuracao    = elapsed_time();

                        var TmpSep          = text.split("\n");
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

                        console.log("OCR Finalizado em: " + TempoDuracao);

                        remover_arquivo(output);
                        sendRes(res, true, {"Resultado": TmpRet, "Duracao": TempoDuracao});

                    })

                }).on('error', function(e){
                    
                    log.warn("Falha no pipe");
                    log.warn(e);
    
                    remover_arquivo(output);
                    sendRes(res, false, {"Msg": "Falha em Obter Raw do Arquivo"});

                });

            }else{

                log.warn("Falha em Obter Arquivo - Status Code: " + res.statusCode);
    
                remover_arquivo(output);
		        sendRes(res, false, {"Msg": "Falha em Obter Arquivo - Status Code: " + res.statusCode});
                
            }

        });

	}else{

        log.warn("Url nao informada");
    
		sendRes(res, false, {"Msg": "Url nao informada"});

	}

});

app.post("/ping", function(req, res){

    if(req.body.url) 
	{

        log.info("-------------------------------------");
        log.info("Funcao: ping");        
        log.info("Usuario: " + req.auth.user);
        log.info("Link: " + req.body.url);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: ping");        
        console.log("Usuario: " + req.auth.user);
        console.log("Link: " + req.body.url);

        start = process.hrtime(); 

        try {

            ping.promise.probe(req.body.url, {
                timeout: 10,
            }).then(function (res2) {

                var TempoDuracao = elapsed_time();

                sendRes(res, true, {
                                    "Duracao": TempoDuracao,
                                    "Consulta": {
                                        "host": res2.host, 
                                        "numeric_host": res2.numeric_host, 
                                        "online": (( res2.alive == true ) ? "S" : "N" ), 
                                        "time": res2.time, 
                                        "output": res2.output
                                    }
                                    });

            });

        } catch (ex) {
                
            log.warn("Falha no Ping");
            log.warn(ex);
        
            sendRes(res, false, {"Msg": "Falha no Ping"});
        
        }

	}else{

        log.warn("Url nao informada");
    
		sendRes(res, false, {"Msg": "Url nao informada"});

	}

});

app.post("/tracert", function(req, res){

    if(req.body.url) 
	{

        log.info("-------------------------------------");
        log.info("Funcao: tracert");        
        log.info("Usuario: " + req.auth.user);
        log.info("Link: " + req.body.url);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: tracert");        
        console.log("Usuario: " + req.auth.user);
        console.log("Link: " + req.body.url);

        start = process.hrtime(); 

        try {

            var TmpRet = [];

            var tracer = new Traceroute();
            tracer
            .on('hop', (hop) => {

                TmpRet.push(hop);

            })
            .on('close', (code) => {
                
                var TempoDuracao = elapsed_time();

                sendRes(res, true, {
                                    "Duracao": TempoDuracao,
                                    "Consulta": TmpRet
                                    });
                
            });         
            tracer.trace(req.body.url);

        } catch (ex) {
            
            log.warn("Falha no Tracert");
            log.warn(ex);
        
            sendRes(res, false, {"Msg": "Falha no Tracert"});
        
        }

	}else{

        log.warn("Url nao informada");
    
		sendRes(res, false, {"Msg": "Url nao informada"});

	}

});

app.post("/whois", function(req, res){

    if(req.body.url) 
	{

        log.info("-------------------------------------");
        log.info("Funcao: whois");        
        log.info("Usuario: " + req.auth.user);
        log.info("Link: " + req.body.url);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: whois");        
        console.log("Usuario: " + req.auth.user);
        console.log("Link: " + req.body.url);

        start = process.hrtime(); 

        (async function(){

            try {

                var results = await whois(req.body.url);

                var TempoDuracao = elapsed_time();

                sendRes(res, true, {
                                    "Duracao": TempoDuracao,
                                    "Consulta": results
                                    });

            } catch (ex) {
                
                log.warn("Falha no Whois");
                log.warn(ex);
            
                sendRes(res, false, {"Msg": "Falha no Tracert"});
            
            }

        })();

	}else{

        log.warn("Url nao informada");
    
		sendRes(res, false, {"Msg": "Url nao informada"});

	}

});

app.post("/geoip", function(req, res){

    if(req.body.ip) 
	{

        log.info("-------------------------------------");
        log.info("Funcao: geoip");        
        log.info("Usuario: " + req.auth.user);
        log.info("IP: " + req.body.ip);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: geoip");        
        console.log("Usuario: " + req.auth.user);
        console.log("IP: " + req.body.ip);

        start = process.hrtime(); 

        try {

            var geo = geoip.lookup(req.body.ip);

            if( geo == null )
            {

                log.warn("IP nao Localizado para GeoIP");
            
                sendRes(res, false, {"Msg": "IP nao Localizado para GeoIP"});

            }else{

                var TempoDuracao = elapsed_time();

                sendRes(res, true, {
                                    "Duracao": TempoDuracao,
                                    "Consulta": geo
                                    });

            }

        } catch (ex) {
            
            log.warn("Falha no Geoip");
            log.warn(ex);
        
            sendRes(res, false, {"Msg": "Falha no Geoip"});
        
        }

	}else{

        log.warn("IP nao informada");
    
		sendRes(res, false, {"Msg": "IP nao informada"});

	}

});

app.post("/nslookup", function(req, res){

    if( req.body.name != "" && req.body.type != "" ) 
	{

        log.info("-------------------------------------");
        log.info("Funcao: nslookup");        
        log.info("Usuario: " + req.auth.user);
        log.info("Name: " + req.body.name);
        log.info("Type: " + req.body.type);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: nslookup");        
        console.log("Usuario: " + req.auth.user);
        console.log("Name: " + req.body.name);
        console.log("Type: " + req.body.type);

        start = process.hrtime(); 

        try {

            var RetFinal = [];
            var IsTimeout = false;

            var question = dns.Question({
            name: req.body.name,
            type: req.body.type,
            });

            var req2 = dns.Request({
            question: question,
            server: { address: '8.8.8.8', port: 53, type: 'udp' },
            timeout: 1000,
            });

            req2.on('timeout', function () {

                log.warn("Timeout");
                
                IsTimeout = true;

            });

            req2.on('message', function (err, answer) {

                answer.answer.forEach(function (a) {

                    RetFinal.push(a);

                });

            });

            req2.on('end', function () {

                if( IsTimeout == true )
                {

                    log.warn("Timeou na consulta ao Host");
                
                    sendRes(res, false, {"Msg": "Timeou na consulta ao Host"});

                }else{

                    var TempoDuracao = elapsed_time();

                    sendRes(res, true, {
                                        "Duracao": TempoDuracao,
                                        "Consulta": RetFinal
                                        });

                }

            });

            req2.send();

        } catch (ex) {
            
            log.warn("Falha no Nslookup");
            log.warn(ex);
        
            sendRes(res, false, {"Msg": "Falha no Nslookup"});
        
        }

	}else{

        log.warn("Name ou Type nao informada");
    
		sendRes(res, false, {"Msg": "Name ou Type nao informada"});

	}

});

app.post("/website_screenshot", function(req, res){

    if(req.body.url) 
	{

        log.info("-------------------------------------");
        log.info("Funcao: website_screenshot");        
        log.info("Usuario: " + req.auth.user);
        log.info("Link: " + req.body.url);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: website_screenshot");        
        console.log("Usuario: " + req.auth.user);
        console.log("Link: " + req.body.url);

        start = process.hrtime(); 

        try {

            var filename = uuid() + ".jpg";
            var output = __dirname + "/tmp/" + filename;

            Screenshot.fromURL(req.body.url, output, {show: false}, function(err){
            
                if(err) 
                {
                    
                    log.error("Screenshot | error");
                    log.error(err);

                    remover_arquivo(output);
                    sendRes(res, false, {"Msg": "Falha em Gerar Screenshot"});

                }else{

                    var stats = fs.statSync(output);

                    fs.readFile(output, {encoding: 'base64'}, function (err, data) {

                        if(err) 
                        {
                            
                            log.error("readFile | error");
                            log.error(err);

                            remover_arquivo(output);
                            sendRes(res, false, {"Msg": "Falha em ler Raw"});

                        }else{
                            
                            var TempoDuracao = elapsed_time();

                            remover_arquivo(output);

                            log.info(">>> SUCESSO <<<")
                            log.info("filename: " + filename)
                            log.info("Tamanho: " + stats.size)
                            log.info("Tamanho2: " + filesize(stats.size, {round: 0}))
                            log.info("Duracao: " + TempoDuracao)

                            console.log("Tamanho: " + stats.size)
                            console.log("Tamanho2: " + filesize(stats.size, {round: 0}))
                            console.log("Duracao: " + TempoDuracao);

                            sendRes(res, true, {"Nome": filename, "Tamanho": stats.size, "Tamanho2": filesize(stats.size, {round: 0}), "Imagem": data.toString(), "Duracao": TempoDuracao});

                        }

                    });

                }
                
            });

        } catch (ex) {
            
            log.warn("Falha no Gerar Screenshot");
            log.warn(ex);
        
            sendRes(res, false, {"Msg": "Falha no Gerar Screenshot"});
        
        }

	}else{

        log.warn("Url nao informada");
    
		sendRes(res, false, {"Msg": "Url nao informada"});

	}

});

app.post("/pix_codigo", function(req, res){

    if( req.body.chave != "" && req.body.nome != "" && req.body.cidade != "" && req.body.valor )
	{

        log.info("-------------------------------------");
        log.info("Funcao: pix_codigo");        
        log.info("Usuario: " + req.auth.user);
        log.info("Chave: " + req.body.chave);
        log.info("Nome: " + req.body.nome);
        log.info("Cidade: " + req.body.cidade);
        log.info("Valor: " + req.body.valor);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: pix_codigo");        
        console.log("Usuario: " + req.auth.user);
        console.log("Chave: " + req.body.chave);
        console.log("Nome: " + req.body.nome);
        console.log("Cidade: " + req.body.cidade);
        console.log("Valor: " + req.body.valor);

        start = process.hrtime(); 

        (async function(){

            try {

                var code = await ObjPix.Pix(req.body.chave, req.body.nome, req.body.cidade, req.body.valor, "")

                var TempoDuracao = elapsed_time();

                sendRes(res, true, {"Codigo": code, "Duracao": TempoDuracao});

            } catch (ex) {
                
                log.warn("Falha no Gerar PIX");
                log.warn(ex);
            
                sendRes(res, false, {"Msg": "Falha no Gerar PIX"});
            
            }

        })();

	}else{

        log.warn("Alguns dados nao foram preenchidos");
    
		sendRes(res, false, {"Msg": "Alguns dados nao foram preenchidos"});

	}

});

app.post("/pix_qrcode", function(req, res){

    if( req.body.chave != "" && req.body.nome != "" && req.body.cidade != "" && req.body.valor )
	{

        log.info("-------------------------------------");
        log.info("Funcao: pix_qrcode");        
        log.info("Usuario: " + req.auth.user);
        log.info("Chave: " + req.body.chave);
        log.info("Nome: " + req.body.nome);
        log.info("Cidade: " + req.body.cidade);
        log.info("Valor: " + req.body.valor);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: pix_qrcode");        
        console.log("Usuario: " + req.auth.user);
        console.log("Chave: " + req.body.chave);
        console.log("Nome: " + req.body.nome);
        console.log("Cidade: " + req.body.cidade);
        console.log("Valor: " + req.body.valor);

        start = process.hrtime(); 

        (async function(){

            try {

                var code = await ObjPix.Pix(req.body.chave, req.body.nome, req.body.cidade, req.body.valor, "", true)

                var TempoDuracao = elapsed_time();

                sendRes(res, true, {"Imagem": code, "Duracao": TempoDuracao});

            } catch (ex) {
                
                log.warn("Falha no Gerar PIX");
                log.warn(ex);
            
                sendRes(res, false, {"Msg": "Falha no Gerar PIX"});
            
            }
        })();

	}else{

        log.warn("Alguns dados nao foram preenchidos");
    
		sendRes(res, false, {"Msg": "Alguns dados nao foram preenchidos"});

	}

});

app.post("/otimizar_imagem", function(req, res){

    if(req.body.url) 
	{

        log.info("-------------------------------------");
        log.info("Funcao: otimizar_imagem");        
        log.info("Usuario: " + req.auth.user);
        log.info("Link: " + req.body.url);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: otimizar_imagem");        
        console.log("Usuario: " + req.auth.user);
        console.log("Link: " + req.body.url);
    
        start = process.hrtime(); 

        var extencao = path.extname(req.body.url);

        if( extencao == ".jpg" || extencao == ".png" || extencao == ".gif" )
        {

            var filenamepre = uuid();
            var filename = filenamepre + extencao;
            var output = __dirname + "/tmp/" + filename;
            var output2 = __dirname + "/tmp/ret_" + filename;
            var writeStream = fs.createWriteStream(output);

            try {

                var request = http.get(req.body.url, function(response) {
                    
                    if( res.statusCode == 200 )
                    {

                        response.pipe(writeStream).on('finish', function() {
                            
                            if( extencao == "jpg" )
                            {

                                var Parametros = [output, '-sampling-factor', '4:2:0', '-strip', '-quality', '70', '-interlace', 'JPEG', '-colorspace', 'sRGB', output2];

                            }else{

                                var Parametros = [output, '-strip', '-quality', '50', output2];

                            }

                            imagemagick.convert(Parametros, 
                            function(err, stdout){

                                if(err) 
                                {
                                    
                                    log.error("convert | error");
                                    log.error(err);

                                    remover_arquivo(output);
                                    remover_arquivo(output2);
                                    sendRes(res, false, {"Msg": "Falha em Converter Arquivo"});

                                }else{
                                    
                                    var stats1 = fs.statSync(output);
                                    var stats2 = fs.statSync(output2);

                                    fs.readFile(output2, {encoding: 'base64'}, function (err, data) {

                                        if(err) 
                                        {
                                            
                                            log.error("readFile | error");
                                            log.error(err);

                                            remover_arquivo(output);
                                            remover_arquivo(output2);
                                            sendRes(res, false, {"Msg": "Falha em ler Raw"});

                                        }else{
                                            
                                            var TempoDuracao = elapsed_time();

                                            remover_arquivo(output);
                                            remover_arquivo(output2);

                                            log.info(">>> SUCESSO <<<")
                                            log.info("Origem_Tamanho: " + stats1.size)
                                            log.info("Origem_Tamanho2: " + filesize(stats1.size, {round: 0}))
                                            log.info("ResultadoTamanho: " + stats2.size)
                                            log.info("Resultado_Tamanho2: " + filesize(stats2.size, {round: 0}))
                                            log.info("Duracao: " + TempoDuracao)

                                            console.log("Origem_Tamanho: " + stats1.size)
                                            console.log("Origem_Tamanho2: " + filesize(stats1.size, {round: 0}))
                                            console.log("Resultado_Tamanho: " + stats2.size)
                                            console.log("Resultado_Tamanho2: " + filesize(stats2.size, {round: 0}))
                                            console.log("Duracao: " + TempoDuracao);

                                            sendRes(res, true, {"Origem_Tamanho": stats1.size, "Origem_Tamanho2": filesize(stats1.size, {round: 0}), "Resultado_Tamanho": stats2.size, "Resultado_Tamanho2": filesize(stats2.size, {round: 0}), "Imagem": data.toString(), "Duracao": TempoDuracao});

                                        }

                                    });

                                }

                            });

                        }).on('error', function(e){
                            
                            log.warn("Falha no pipe");
                            log.warn(e);
            
                            remover_arquivo(output);
                            sendRes(res, false, {"Msg": "Falha em Obter Raw do Arquivo"});

                        });

                    }else{

                        log.warn("Falha em Obter Arquivo - Status Code: " + res.statusCode);
            
                        remover_arquivo(output);
                        sendRes(res, false, {"Msg": "Falha em Obter Arquivo - Status Code: " + res.statusCode});
                        
                    }

                });

            } catch (ex) {
                
                log.warn("Falha no Otimizar Imagem");
                log.warn(ex);
           
                sendRes(res, false, {"Msg": "Falha no Otimizar Imagem"});
            
            }

        }else{

            log.warn("Extencao nao Permitida");
        
            sendRes(res, false, {"Msg": "Extencao nao Permitida"});

        }

	}else{

        log.warn("Url nao informada");
    
		sendRes(res, false, {"Msg": "Url nao informada"});

	}

});

app.post("/gerar_dadospessoa", function(req, res){

    log.info("-------------------------------------");
    log.info("Funcao: gerar_dadospessoa");        
    log.info("Usuario: " + req.auth.user);
    log.info("Link: " + req.body.url);
    log.info(req.body);

    console.log("-------------------------------------");
    console.log("Funcao: gerar_dadospessoa");        
    console.log("Usuario: " + req.auth.user);

    try {

        var leite = new Leite()

        sendRes(res, true,  {
                            "Nome": leite.pessoa.nome(),
                            "CPF": leite.pessoa.cpf({ formatado: true }),
                            "RG": leite.pessoa.rg(),
                            "CNPJ": leite.empresa.cnpj({ formatado: false }),
                            "Email": leite.pessoa.email(),
                            "Usuario": leite.pessoa.usuario(),
                            "Idade": leite.pessoa.idade(),
                            "DataNascimento": leite.pessoa.nascimento({ formato: 'DD/MM/YYYY' }),
                            "Sexo": leite.pessoa.sexo(),
                            "Endereco": {
                                "CEP": leite.localizacao.cep(),
                                "Estado": leite.localizacao.estado(),
                                "Cidade": leite.localizacao.cidade(),
                                "Bairro": leite.localizacao.bairro(),
                                "Logradouro": leite.localizacao.logradouro(),
                                "Complemento": leite.localizacao.complemento(),
                            },
                            "Veiculo": {
                                "Tipo": leite.veiculo.tipo(),
                                "Marca": leite.veiculo.marca(),
                                "Modelo": leite.veiculo.modelo(),
                                "Especie": leite.veiculo.especie(),
                                "Categoria": leite.veiculo.categoria(),
                                "Placa": leite.veiculo.placa(),
                                "Combustivel": leite.veiculo.combustivel(),
                                "Carroceria": leite.veiculo.carroceria(),
                                "Restricao": leite.veiculo.restricao()
                            },
                            "CNH": {
                                "Numero": leite.cnh.numero(),
                                "Categoria": leite.cnh.categoria(),
                                "DataEmissao": leite.cnh.emissao(),
                                "DataValidade": leite.cnh.validade(),
                                "NumeroRegistro": leite.cnh.registro(),
                                "NumerSeguranca": leite.cnh.seguranca(),
                            }
                            });

    } catch (ex) {
        
        log.warn("Falha no Gerar Dados");
        log.warn(ex);
    
        sendRes(res, false, {"Msg": "Falha no Gerar Dados"});
    
    }

});

app.post("/qrcode", function(req, res){

    if( req.body.texto != "" ) 
	{

        log.info("-------------------------------------");
        log.info("Funcao: qrcode");        
        log.info("Usuario: " + req.auth.user);
        log.info("Texto: " + req.body.texto);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: qrcode");        
        console.log("Usuario: " + req.auth.user);
        console.log("Texto: " + req.body.texto);
    
        start = process.hrtime(); 

        try {

            QRCode.toDataURL(req.body.texto, function (err, url) {
            
                if(err) 
                {
                    
                    log.error("Falha no Gerar QRCode");
                    log.error(err);

                    sendRes(res, false, {"Msg": "Falha no Gerar QRCode"});

                }else{
                    
                    var TempoDuracao = elapsed_time();

                    sendRes(res, true, {"Imagem": url, "Duracao": TempoDuracao});

                }

            })

        } catch (ex) {
            
            log.warn("Falha no Gerar QRCode");
            log.warn(ex);
        
            sendRes(res, false, {"Msg": "Falha no Gerar QRCode"});
        
        }

	}else{

        log.warn("Texto nao informado");
    
		sendRes(res, false, {"Msg": "Texto nao informado"});

	}

});

app.post("/sitemap", function(req, res){

    if(req.body.url) 
	{

        log.info("-------------------------------------");
        log.info("Funcao: sitemap");        
        log.info("Usuario: " + req.auth.user);
        log.info("Link: " + req.body.url);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: sitemap");        
        console.log("Usuario: " + req.auth.user);
        console.log("Link: " + req.body.url);
    
        start = process.hrtime(); 

        var filenamepre = uuid();
        var filename = filenamepre + ".xml";
        var output = __dirname + "/tmp/" + filename;

        try {

            var generator = SitemapGenerator(req.body.url, {
                stripQuerystring: false,
                ignoreHreflang: true,
                filepath: output,
                maxDepth: 0
            });
            
            generator.on('done', () => {
                
                fs.readFile(output, {encoding: 'base64'}, function (err, data) {

                    if(err) 
                    {
                        
                        log.error("readFile | error");
                        log.error(err);

                        remover_arquivo(output);
                        sendRes(res, false, {"Msg": "Falha em ler Raw"});

                    }else{
                        
                        var TempoDuracao = elapsed_time();

                        remover_arquivo(output);

                        sendRes(res, true, {"XML": data.toString(), "Duracao": TempoDuracao});

                    }

                });

            });
            
            generator.start();

        } catch (ex) {
            
            log.warn("Falha em Gerar o Sitemap");
            log.warn(ex);
        
            sendRes(res, false, {"Msg": "Falha em Gerar o Sitemap"});
        
        }

	}else{

        log.warn("Url nao informada");
    
		sendRes(res, false, {"Msg": "Url nao informada"});

	}

});

app.post("/consultar_placa", function(req, res){

    if( req.body.placa != "" ) 
	{

        log.info("-------------------------------------");
        log.info("Funcao: consultar_placa");        
        log.info("Usuario: " + req.auth.user);
        log.info("Placa: " + req.body.placa);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: consultar_placa");        
        console.log("Usuario: " + req.auth.user);
        console.log("Placa: " + req.body.placa);
    
        start = process.hrtime(); 

        (async function(){

            try {

                var vehicle = await sinespApi.search(req.body.placa);
                var TempoDuracao = elapsed_time();
    
                sendRes(res, true, {
                                    "Duracao": TempoDuracao,
                                    "Consulta": vehicle
                                    });

            } catch (ex) {
                
                log.warn("Falha em Obter Detalhes");
                log.warn(ex);
            
                sendRes(res, false, {"Msg": "Falha em Obter Detalhes"});
            
            }

        })();

	}else{

        log.warn("Placa nao informada");
    
		sendRes(res, false, {"Msg": "Placa nao informada"});

	}

});

app.post("/consultar_cnpj", function(req, res){

    if( req.body.cnpj != "" ) 
	{

        log.info("-------------------------------------");
        log.info("Funcao: consultar_cnpj");        
        log.info("Usuario: " + req.auth.user);
        log.info("CNPJ: " + req.body.cnpj);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: consultar_cnpj");        
        console.log("Usuario: " + req.auth.user);
        console.log("CNPJ: " + req.body.cnpj);
    
        start = process.hrtime(); 

        try {

            let cnpj = new CNPJ();
 
            cnpj.consultaCNPJ({cnpj: req.body.cnpj })
            .then(result => {
                
                var TempoDuracao = elapsed_time();

                sendRes(res, true, {
                                    "Duracao": TempoDuracao,
                                    "Consulta": result
                                    });
                                    
            })
            .catch(error => {
                
                log.warn("Falha em Obter Detalhes");
                log.warn(error);
            
                if( error.message != undefined )
                {

                    sendRes(res, false, {"Msg": error.message});

                }else{

                    sendRes(res, false, {"Msg": "Falha em Obter Detalhes"});

                }
                
            })

        } catch (ex) {
            
            log.warn("Falha em Obter Detalhes");
            log.warn(ex);
        
            sendRes(res, false, {"Msg": "Falha em Obter Detalhes"});
        
        }

	}else{

        log.warn("CNPJ nao informado");
    
		sendRes(res, false, {"Msg": "CNPJ nao informado"});

	}

});

app.post("/consultar_ssl", function(req, res){

    if(req.body.url) 
	{

        log.info("-------------------------------------");
        log.info("Funcao: consultar_ssl");        
        log.info("Usuario: " + req.auth.user);
        log.info("Link: " + req.body.url);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: consultar_ssl");        
        console.log("Usuario: " + req.auth.user);
        console.log("Link: " + req.body.url);
    
        start = process.hrtime(); 

        try {

            checkSslCertificate({hostname: req.body.url}).then(res2 => {
            
                var TempoDuracao = elapsed_time();

                sendRes(res, true, {
                                    "Duracao": TempoDuracao,
                                    "Consulta": res2
                                    });

            });

        } catch (ex) {
            
            log.warn("Falha em Obter Detalhes");
            log.warn(ex);
        
            console.log(ex);

            sendRes(res, false, {"Msg": "Falha em Obter Detalhes"});
        
        }

	}else{

        log.warn("Url nao informada");
    
		sendRes(res, false, {"Msg": "Url nao informada"});

	}

});

app.post("/pasta_tamanho", function(req, res){

    if( req.body.pasta ) 
	{

        log.info("-------------------------------------");
        log.info("Funcao: pasta_tamanho");        
        log.info("Usuario: " + req.auth.user);
        log.info("Pasta: " + req.body.pasta);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: pasta_tamanho");        
        console.log("Usuario: " + req.auth.user);
        console.log("Pasta: " + req.body.pasta);
    
        start = process.hrtime(); 

        try {

            getSize(req.body.pasta, function(err, size) {

                if (err) 
                {

                    log.warn("Falha em Obter Tamanho");
                    log.warn(err);
                
                    console.log(err);

                    sendRes(res, false, {"Msg": "Falha em Obter Tamanho"});

                }else{

                    var TempoDuracao = elapsed_time();

                    sendRes(res, true, {
                                        "Duracao": TempoDuracao,
                                        "Tamanho": size,
                                        "Tamanho2": filesize(size, {round: 0})
                                        });

                }

            });

        } catch (ex) {
            
            log.warn("Falha em Obter Tamanho");
            log.warn(ex);
        
            console.log(ex);

            sendRes(res, false, {"Msg": "Falha em Obter Tamanho"});
        
        }

	}else{

        log.warn("Pasta nao informada");
    
		sendRes(res, false, {"Msg": "Pasta nao informada"});

	}

});

app.post("/hds_listagem", function(req, res){

    log.info("-------------------------------------");
    log.info("Funcao: hds_listagem");        
    log.info("Usuario: " + req.auth.user);
    log.info(req.body);

    console.log("-------------------------------------");
    console.log("Funcao: hds_listagem");        
    console.log("Usuario: " + req.auth.user);

    start = process.hrtime(); 

    try {

        (async function(){

            try {

                var drives = await drivelist.list();

                var TempoDuracao = elapsed_time();

                sendRes(res, true, {
                                    "Duracao": TempoDuracao,
                                    "Consulta": drives
                                    });

            } catch (ex) {
                
                log.warn("Falha em Obter Informacoes");
                log.warn(ex);
            
                sendRes(res, false, {"Msg": "Falha em Obter Informacoes"});
            
            }

        })();

    } catch (ex) {
        
        log.warn("Falha em Obter Informacoes");
        log.warn(ex);
    
        console.log(ex);

        sendRes(res, false, {"Msg": "Falha em Obter Informacoes"});
    
    }

});

app.post("/hds_espaco", function(req, res){

    if( req.body.unidade ) 
	{

        log.info("-------------------------------------");
        log.info("Funcao: hds_espaco");        
        log.info("Usuario: " + req.auth.user);
        log.info("Unidade: " + req.body.unidade);
        log.info(req.body);

        console.log("-------------------------------------");
        console.log("Funcao: hds_espaco");        
        console.log("Usuario: " + req.auth.user);
        console.log("Unidade: " + req.body.unidade);
    
        start = process.hrtime(); 

        try {

            checkDiskSpace(req.body.unidade).then((diskSpace) => {
                
                var TempoDuracao = elapsed_time();

                sendRes(res, true, {
                                    "Duracao": TempoDuracao,
                                    "Consulta": {
                                        "Total": diskSpace.size,
                                        "Total2": filesize(diskSpace.size, {round: 2}),
                                        "Disponivel": diskSpace.free,
                                        "Disponivel2": filesize(diskSpace.free, {round: 2})
                                    }
                                    });

            })

        } catch (ex) {
            
            log.warn("Falha em Obter Informacao");
            log.warn(ex);
        
            console.log(ex);

            sendRes(res, false, {"Msg": "Falha em Obter Informacao"});
        
        }

	}else{

        log.warn("Unidade nao informada");
    
		sendRes(res, false, {"Msg": "Unidade nao informada"});

	}

});

app.post("/iis_sites_listar", function(req, res){

	log.info("-------------------------------------");
	log.info("Funcao: iis_sites_listar");        
	log.info("Usuario: " + req.auth.user);
	log.info(req.body);

	console.log("-------------------------------------");
	console.log("Funcao: iis_sites_listar");        
	console.log("Usuario: " + req.auth.user);

	start = process.hrtime(); 

	try {

		iis.SitesListar()
		.then(result => {
                
			var TempoDuracao = elapsed_time();

			sendRes(res, true, {
								"Duracao": TempoDuracao,
								"Consulta": result
								});
								
		})
		.catch(error => {
			
			log.warn("Falha em Executar Comando");
			log.warn(error);
		
			if( error.message != undefined ){

                sendRes(res, false, {"Msg": error.message});
                
            }else if( error != undefined ){

                sendRes(res, false, {"Msg": error});

            }else{

                sendRes(res, false, {"Msg": "Falha em Executar Comando"});

            }
			
		});

	} catch (ex) {
		
        log.warn("Falha em Executar Comando");
        log.warn(ex);
    
        console.log(ex);

        sendRes(res, false, {"Msg": "Falha em Executar Comando"});
	
	}

});

app.post("/iis_sites_detalhes", function(req, res){

	if( req.body.dominio != "" ) 
	{
		
		log.info("-------------------------------------");
		log.info("Funcao: iis_sites_detalhes");        
		log.info("Usuario: " + req.auth.user);
        log.info("dominio: " + req.body.dominio);
		log.info(req.body);

		console.log("-------------------------------------");
		console.log("Funcao: iis_sites_detalhes");        
		console.log("Usuario: " + req.auth.user);
        console.log("dominio: " + req.body.dominio);
		
		start = process.hrtime(); 

		try {

			iis.SitesRetDetalhes(req.body.dominio)
			.then(Result => {
				
				var TempoDuracao = elapsed_time();

				sendRes(res, true, {
									"Duracao": TempoDuracao,
									"Detalhes": Result
									});
									
			})
			.catch(error => {
				
				log.warn("Falha em Obter Detalhes");
				log.warn(error);
			
				if( error.message != undefined ){

					sendRes(res, false, {"Msg": error.message});
					
				}else if( error != undefined ){

					sendRes(res, false, {"Msg": error});

				}else{

					sendRes(res, false, {"Msg": "Falha em Executar Comando"});

				}
				
			});

		} catch (ex) {
			
			log.warn("Falha em Executar Comando");
			log.warn(ex);
		
			console.log(ex);

			sendRes(res, false, {"Msg": "Falha em Executar Comando"});
		
		}
	
	}else{

        log.warn("Existem parametros pendentes");
    
		sendRes(res, false, {"Msg": "Existem parametros pendentes"});

	}

});

app.post("/iis_sites_parar", function(req, res){

	if( req.body.dominio != "" ) 
	{
		
		log.info("-------------------------------------");
		log.info("Funcao: iis_sites_parar");        
		log.info("Usuario: " + req.auth.user);
        log.info("dominio: " + req.body.dominio);
		log.info(req.body);

		console.log("-------------------------------------");
		console.log("Funcao: iis_sites_parar");        
		console.log("Usuario: " + req.auth.user);
        console.log("dominio: " + req.body.dominio);
		
		start = process.hrtime(); 

		try {

			iis.SitesParar(req.body.dominio)
			.then(Result => {
				
				var TempoDuracao = elapsed_time();

				sendRes(res, true, {
									"Duracao": TempoDuracao,
									"Detalhes": Result
									});
									
			})
			.catch(error => {
				
				log.warn("Falha");
				log.warn(error);
			
				if( error.message != undefined ){

					sendRes(res, false, {"Msg": error.message});
					
				}else if( error != undefined ){

					sendRes(res, false, {"Msg": error});

				}else{

					sendRes(res, false, {"Msg": "Falha em Executar Comando"});

				}
				
			});

		} catch (ex) {
			
			log.warn("Falha em Executar Comando");
			log.warn(ex);
		
			console.log(ex);

			sendRes(res, false, {"Msg": "Falha em Executar Comando"});
		
		}
	
	}else{

        log.warn("Existem parametros pendentes");
    
		sendRes(res, false, {"Msg": "Existem parametros pendentes"});

	}

});

app.post("/iis_sites_iniciar", function(req, res){

	if( req.body.dominio != "" ) 
	{
		
		log.info("-------------------------------------");
		log.info("Funcao: iis_sites_iniciar");        
		log.info("Usuario: " + req.auth.user);
        log.info("dominio: " + req.body.dominio);
		log.info(req.body);

		console.log("-------------------------------------");
		console.log("Funcao: iis_sites_iniciar");        
		console.log("Usuario: " + req.auth.user);
        console.log("dominio: " + req.body.dominio);
		
		start = process.hrtime(); 

		try {

			iis.SitesIniciar(req.body.dominio)
			.then(Result => {
				
				var TempoDuracao = elapsed_time();

				sendRes(res, true, {
									"Duracao": TempoDuracao,
									"Detalhes": Result
									});
									
			})
			.catch(error => {
				
				log.warn("Falha");
				log.warn(error);
			
				if( error.message != undefined ){

					sendRes(res, false, {"Msg": error.message});
					
				}else if( error != undefined ){

					sendRes(res, false, {"Msg": error});

				}else{

					sendRes(res, false, {"Msg": "Falha em Executar Comando"});

				}
				
			});

		} catch (ex) {
			
			log.warn("Falha em Executar Comando");
			log.warn(ex);
		
			console.log(ex);

			sendRes(res, false, {"Msg": "Falha em Executar Comando"});
		
		}
	
	}else{

        log.warn("Existem parametros pendentes");
    
		sendRes(res, false, {"Msg": "Existem parametros pendentes"});

	}

});

app.post("/iis_sites_cadastrar", function(req, res){

	if( req.body.dominio != "" && req.body.diretorio != "" ) 
	{
		
		log.info("-------------------------------------");
		log.info("Funcao: iis_sites_cadastrar");        
		log.info("Usuario: " + req.auth.user);
        log.info("dominio: " + req.body.dominio);
        log.info("diretorio: " + req.body.diretorio);
		log.info(req.body);

		console.log("-------------------------------------");
		console.log("Funcao: iis_sites_cadastrar");        
		console.log("Usuario: " + req.auth.user);
        console.log("dominio: " + req.body.dominio);
        console.log("diretorio: " + req.body.diretorio);
		
		start = process.hrtime(); 

		try {

            var RetFinal                = {};
            RetFinal["Mensagens"]       = [];
            RetFinal["Erros"]           = [];

            (async function(){

                try {
            
					fs.mkdir(req.body.diretorio, (err) => {
						
					});

				} catch (error) {
					
					

				}   
                
                try {
    
                    var RetEnv = await iis.SitesCadastrar(req.body.dominio, req.body.diretorio);

                    RetFinal["Mensagens"].push("[Sucesso] SitesCadastrar: " + RetEnv);
    
                } catch (ex) {
                    
                    RetFinal["Erros"].push("[Erro] SitesCadastrar: " + ex);
                
                }

                try {
    
                    var RetEnv = await iis.PoolCadastrar(req.body.dominio);

                    RetFinal["Mensagens"].push("[Sucesso] PoolCadastrar: " + RetEnv);
    
                } catch (ex) {
                    
                    RetFinal["Erros"].push("[Erro] PoolCadastrar: " + ex);
                
                }

                try {
    
                    var RetEnv = await iis.PoolVincularEmSite(req.body.dominio);

                    RetFinal["Mensagens"].push("[Sucesso] PoolVincularEmSite: " + RetEnv);
    
                } catch (ex) {
                    
                    RetFinal["Erros"].push("[Erro] PoolVincularEmSite: " + ex);
                
                }

                if( RetFinal["Erros"].length == 0 )
                {

                    var TempoDuracao = elapsed_time();
    
                    sendRes(res, true, {
                                        "Duracao": TempoDuracao,
                                        "Resultado": RetFinal
                                        });
    
                }else{
                    
                    log.warn("Falha em Executar Comando");
                    log.warn(RetFinal);
                
                    sendRes(res, false, {
                                        "Msg": RetFinal["Erros"].join(" | "),
                                        "Resultado": RetFinal
                                        });
                
                }
    
            })();

		} catch (ex) {
			
			log.warn("Falha em Executar Comando");
			log.warn(ex);
		
			console.log(ex);

			sendRes(res, false, {"Msg": "Falha em Executar Comando"});
		
		}
	
	}else{

        log.warn("Existem parametros pendentes");
    
		sendRes(res, false, {"Msg": "Existem parametros pendentes"});

	}

});

app.post("/iis_sites_bindings_cadastrar", function(req, res){

	if( req.body.dominio != "" && req.body.protocolo != "" && req.body.porta != "" && req.body.valor != "" ) 
	{
		
		log.info("-------------------------------------");
		log.info("Funcao: iis_sites_bindings_cadastrar");        
		log.info("Usuario: " + req.auth.user);
        log.info("dominio: " + req.body.dominio);
        log.info("protocolo: " + req.body.protocolo);
        log.info("porta: " + req.body.porta);
        log.info("valor: " + req.body.valor);
		log.info(req.body);

		console.log("-------------------------------------");
		console.log("Funcao: iis_sites_bindings_cadastrar");        
		console.log("Usuario: " + req.auth.user);
        console.log("dominio: " + req.body.dominio);
        console.log("protocolo: " + req.body.protocolo);
        console.log("porta: " + req.body.porta);
        console.log("valor: " + req.body.valor);
		
		start = process.hrtime(); 

		try {

			iis.SitesBindingsCadastrar(req.body.dominio, req.body.protocolo, req.body.porta, req.body.valor)
			.then(Result => {
				
				var TempoDuracao = elapsed_time();

				sendRes(res, true, {
									"Duracao": TempoDuracao,
									"Detalhes": Result
									});
									
			})
			.catch(error => {
				
				log.warn("Falha");
				log.warn(error);
			
				if( error.message != undefined ){

					sendRes(res, false, {"Msg": error.message});
					
				}else if( error != undefined ){

					sendRes(res, false, {"Msg": error});

				}else{

					sendRes(res, false, {"Msg": "Falha em Executar Comando"});

				}
				
			});

		} catch (ex) {
			
			log.warn("Falha em Executar Comando");
			log.warn(ex);
		
			console.log(ex);

			sendRes(res, false, {"Msg": "Falha em Executar Comando"});
		
		}
	
	}else{

        log.warn("Existem parametros pendentes");
    
		sendRes(res, false, {"Msg": "Existem parametros pendentes"});

	}

});

app.post("/iis_sites_bindings_deletar", function(req, res){

	if( req.body.dominio != "" && req.body.protocolo != "" && req.body.porta != "" && req.body.valor != "" ) 
	{
		
		log.info("-------------------------------------");
		log.info("Funcao: iis_sites_bindings_deletar");        
		log.info("Usuario: " + req.auth.user);
        log.info("dominio: " + req.body.dominio);
        log.info("protocolo: " + req.body.protocolo);
        log.info("porta: " + req.body.porta);
        log.info("valor: " + req.body.valor);
		log.info(req.body);

		console.log("-------------------------------------");
		console.log("Funcao: iis_sites_bindings_deletar");        
		console.log("Usuario: " + req.auth.user);
        console.log("dominio: " + req.body.dominio);
        console.log("protocolo: " + req.body.protocolo);
        console.log("porta: " + req.body.porta);
        console.log("valor: " + req.body.valor);
		
		start = process.hrtime(); 

		try {

			iis.SitesBindingsDeletar(req.body.dominio, req.body.protocolo, req.body.porta, req.body.valor)
			.then(Result => {
				
				var TempoDuracao = elapsed_time();

				sendRes(res, true, {
									"Duracao": TempoDuracao,
									"Detalhes": Result
									});
									
			})
			.catch(error => {
				
				log.warn("Falha");
				log.warn(error);
			
				if( error.message != undefined ){

					sendRes(res, false, {"Msg": error.message});
					
				}else if( error != undefined ){

					sendRes(res, false, {"Msg": error});

				}else{

					sendRes(res, false, {"Msg": "Falha em Executar Comando"});

				}
				
			});

		} catch (ex) {
			
			log.warn("Falha em Executar Comando");
			log.warn(ex);
		
			console.log(ex);

			sendRes(res, false, {"Msg": "Falha em Executar Comando"});
		
		}
	
	}else{

        log.warn("Existem parametros pendentes");
    
		sendRes(res, false, {"Msg": "Existem parametros pendentes"});

	}

});

app.post("/iis_sites_handlers_carregar", function(req, res){

	if( req.body.dominio != "" ) 
	{
		
		log.info("-------------------------------------");
		log.info("Funcao: iis_sites_handlers_carregar");        
		log.info("Usuario: " + req.auth.user);
        log.info("dominio: " + req.body.dominio);
		log.info(req.body);

		console.log("-------------------------------------");
		console.log("Funcao: iis_sites_handlers_carregar");        
		console.log("Usuario: " + req.auth.user);
        console.log("dominio: " + req.body.dominio);
		
		start = process.hrtime(); 

		try {

			iis.SitesHandlersCarregar(req.body.dominio)
			.then(Result => {
				
				var TempoDuracao = elapsed_time();

				sendRes(res, true, {
									"Duracao": TempoDuracao,
									"Detalhes": Result
									});
									
			})
			.catch(error => {
				
				log.warn("Falha");
				log.warn(error);
			
				if( error.message != undefined ){

					sendRes(res, false, {"Msg": error.message});
					
				}else if( error != undefined ){

					sendRes(res, false, {"Msg": error});

				}else{

					sendRes(res, false, {"Msg": "Falha em Executar Comando"});

				}
				
			});

		} catch (ex) {
			
			log.warn("Falha em Executar Comando");
			log.warn(ex);
		
			console.log(ex);

			sendRes(res, false, {"Msg": "Falha em Executar Comando"});
		
		}
	
	}else{

        log.warn("Existem parametros pendentes");
    
		sendRes(res, false, {"Msg": "Existem parametros pendentes"});

	}

});

app.post("/iis_sites_handlers_cadastrar", function(req, res){

	if( req.body.dominio != "" && req.body.name != "" && req.body.path != "" && req.body.verb != "" && req.body.modules != "" && req.body.scriptProcessor != "" && req.body.resourceType != "" ) 
	{
		
		log.info("-------------------------------------");
		log.info("Funcao: iis_sites_handlers_cadastrar");        
		log.info("Usuario: " + req.auth.user);
        log.info("dominio: " + req.body.dominio);
        log.info("name: " + req.body.name);
        log.info("path: " + req.body.path);
        log.info("verb: " + req.body.verb);
        log.info("modules: " + req.body.modules);
        log.info("scriptProcessor: " + req.body.scriptProcessor);
        log.info("resourceType: " + req.body.resourceType);
		log.info(req.body);

		console.log("-------------------------------------");
		console.log("Funcao: iis_sites_handlers_cadastrar");        
		console.log("Usuario: " + req.auth.user);
        console.log("dominio: " + req.body.dominio);
        console.log("name: " + req.body.name);
        console.log("path: " + req.body.path);
        console.log("verb: " + req.body.verb);
        console.log("modules: " + req.body.modules);
        console.log("scriptProcessor: " + req.body.scriptProcessor);
        console.log("resourceType: " + req.body.resourceType);
		
		start = process.hrtime(); 

		try {

			iis.SitesHandlersCadastrar(req.body.dominio, req.body.name, req.body.path, req.body.verb, req.body.modules, req.body.scriptProcessor, req.body.resourceType)
			.then(Result => {
				
				var TempoDuracao = elapsed_time();

				sendRes(res, true, {
									"Duracao": TempoDuracao,
									"Detalhes": Result
									});
									
			})
			.catch(error => {
				
				log.warn("Falha");
				log.warn(error);
			
				if( error.message != undefined ){

					sendRes(res, false, {"Msg": error.message});
					
				}else if( error != undefined ){

					sendRes(res, false, {"Msg": error});

				}else{

					sendRes(res, false, {"Msg": "Falha em Executar Comando"});

				}
				
			});

		} catch (ex) {
			
			log.warn("Falha em Executar Comando");
			log.warn(ex);
		
			console.log(ex);

			sendRes(res, false, {"Msg": "Falha em Executar Comando"});
		
		}
	
	}else{

        log.warn("Existem parametros pendentes");
    
		sendRes(res, false, {"Msg": "Existem parametros pendentes"});

	}

});

app.post("/iis_sites_handlers_deletar", function(req, res){

	if( req.body.dominio != "" && req.body.name != "" && req.body.path != "" && req.body.verb != "" && req.body.modules != "" && req.body.scriptProcessor != "" && req.body.resourceType != "" ) 
	{
		
		log.info("-------------------------------------");
		log.info("Funcao: iis_sites_handlers_deletar");        
		log.info("Usuario: " + req.auth.user);
        log.info("dominio: " + req.body.dominio);
        log.info("name: " + req.body.name);
        log.info("path: " + req.body.path);
        log.info("verb: " + req.body.verb);
        log.info("modules: " + req.body.modules);
        log.info("scriptProcessor: " + req.body.scriptProcessor);
        log.info("resourceType: " + req.body.resourceType);
		log.info(req.body);

		console.log("-------------------------------------");
		console.log("Funcao: iis_sites_handlers_deletar");        
		console.log("Usuario: " + req.auth.user);
        console.log("dominio: " + req.body.dominio);
        console.log("name: " + req.body.name);
        console.log("path: " + req.body.path);
        console.log("verb: " + req.body.verb);
        console.log("modules: " + req.body.modules);
        console.log("scriptProcessor: " + req.body.scriptProcessor);
        console.log("resourceType: " + req.body.resourceType);
		
		start = process.hrtime(); 

		try {

			iis.SitesHandlersDeletar(req.body.dominio, req.body.name, req.body.path, req.body.verb, req.body.modules, req.body.scriptProcessor, req.body.resourceType)
			.then(Result => {
				
				var TempoDuracao = elapsed_time();

				sendRes(res, true, {
									"Duracao": TempoDuracao,
									"Detalhes": Result
									});
									
			})
			.catch(error => {
				
				log.warn("Falha");
				log.warn(error);
			
				if( error.message != undefined ){

					sendRes(res, false, {"Msg": error.message});
					
				}else if( error != undefined ){

					sendRes(res, false, {"Msg": error});

				}else{

					sendRes(res, false, {"Msg": "Falha em Executar Comando"});

				}
				
			});

		} catch (ex) {
			
			log.warn("Falha em Executar Comando");
			log.warn(ex);
		
			console.log(ex);

			sendRes(res, false, {"Msg": "Falha em Executar Comando"});
		
		}
	
	}else{

        log.warn("Existem parametros pendentes");
    
		sendRes(res, false, {"Msg": "Existem parametros pendentes"});

	}

});

app.post("/iis_sites_defaultdocument_carregar", function(req, res){

	if( req.body.dominio != "" ) 
	{
		
		log.info("-------------------------------------");
		log.info("Funcao: iis_sites_defaultdocument_carregar");        
		log.info("Usuario: " + req.auth.user);
        log.info("dominio: " + req.body.dominio);
		log.info(req.body);

		console.log("-------------------------------------");
		console.log("Funcao: iis_sites_defaultdocument_carregar");        
		console.log("Usuario: " + req.auth.user);
        console.log("dominio: " + req.body.dominio);
		
		start = process.hrtime(); 

		try {

			iis.SitesDefaultDocumentCarregar(req.body.dominio)
			.then(Result => {
				
				var TempoDuracao = elapsed_time();

				sendRes(res, true, {
									"Duracao": TempoDuracao,
									"Detalhes": Result
									});
									
			})
			.catch(error => {
				
				log.warn("Falha");
				log.warn(error);
			
				if( error.message != undefined ){

					sendRes(res, false, {"Msg": error.message});
					
				}else if( error != undefined ){

					sendRes(res, false, {"Msg": error});

				}else{

					sendRes(res, false, {"Msg": "Falha em Executar Comando"});

				}
				
			});

		} catch (ex) {
			
			log.warn("Falha em Executar Comando");
			log.warn(ex);
		
			console.log(ex);

			sendRes(res, false, {"Msg": "Falha em Executar Comando"});
		
		}
	
	}else{

        log.warn("Existem parametros pendentes");
    
		sendRes(res, false, {"Msg": "Existem parametros pendentes"});

	}

});

app.post("/iis_sites_defaultdocument_cadastrar", function(req, res){

	if( req.body.dominio != "" && req.body.name != "" ) 
	{
		
		log.info("-------------------------------------");
		log.info("Funcao: iis_sites_defaultdocument_cadastrar");        
		log.info("Usuario: " + req.auth.user);
        log.info("dominio: " + req.body.dominio);
        log.info("name: " + req.body.name);
		log.info(req.body);

		console.log("-------------------------------------");
		console.log("Funcao: iis_sites_defaultdocument_cadastrar");        
		console.log("Usuario: " + req.auth.user);
        console.log("dominio: " + req.body.dominio);
        console.log("name: " + req.body.name);
		
		start = process.hrtime(); 

		try {

			iis.SitesDefaultDocumentCadastrar(req.body.dominio, req.body.name)
			.then(Result => {
				
				var TempoDuracao = elapsed_time();

				sendRes(res, true, {
									"Duracao": TempoDuracao,
									"Detalhes": Result
									});
									
			})
			.catch(error => {
				
				log.warn("Falha");
				log.warn(error);
			
				if( error.message != undefined ){

					sendRes(res, false, {"Msg": error.message});
					
				}else if( error != undefined ){

					sendRes(res, false, {"Msg": error});

				}else{

					sendRes(res, false, {"Msg": "Falha em Executar Comando"});

				}
				
			});

		} catch (ex) {
			
			log.warn("Falha em Executar Comando");
			log.warn(ex);
		
			console.log(ex);

			sendRes(res, false, {"Msg": "Falha em Executar Comando"});
		
		}
	
	}else{

        log.warn("Existem parametros pendentes");
    
		sendRes(res, false, {"Msg": "Existem parametros pendentes"});

	}

});

app.post("/iis_sites_defaultdocument_deletar", function(req, res){

	if( req.body.dominio != "" && req.body.name != "" ) 
	{
		
		log.info("-------------------------------------");
		log.info("Funcao: iis_sites_defaultdocument_deletar");        
		log.info("Usuario: " + req.auth.user);
        log.info("dominio: " + req.body.dominio);
        log.info("name: " + req.body.name);
		log.info(req.body);

		console.log("-------------------------------------");
		console.log("Funcao: iis_sites_defaultdocument_deletar");        
		console.log("Usuario: " + req.auth.user);
        console.log("dominio: " + req.body.dominio);
        console.log("name: " + req.body.name);
		
		start = process.hrtime(); 

		try {

			iis.SitesDefaultDocumentDeletar(req.body.dominio, req.body.name)
			.then(Result => {
				
				var TempoDuracao = elapsed_time();

				sendRes(res, true, {
									"Duracao": TempoDuracao,
									"Detalhes": Result
									});
									
			})
			.catch(error => {
				
				log.warn("Falha");
				log.warn(error);
			
				if( error.message != undefined ){

					sendRes(res, false, {"Msg": error.message});
					
				}else if( error != undefined ){

					sendRes(res, false, {"Msg": error});

				}else{

					sendRes(res, false, {"Msg": "Falha em Executar Comando"});

				}
				
			});

		} catch (ex) {
			
			log.warn("Falha em Executar Comando");
			log.warn(ex);
		
			console.log(ex);

			sendRes(res, false, {"Msg": "Falha em Executar Comando"});
		
		}
	
	}else{

        log.warn("Existem parametros pendentes");
    
		sendRes(res, false, {"Msg": "Existem parametros pendentes"});

	}

});

app.post("/iis_backup", function(req, res){

	if( req.body.nome != "" ) 
	{
		
		log.info("-------------------------------------");
		log.info("Funcao: iis_backup");        
		log.info("Usuario: " + req.auth.user);
		log.info("nome: " + req.body.nome);
		log.info(req.body);

		console.log("-------------------------------------");
		console.log("Funcao: iis_backup");        
		console.log("Usuario: " + req.auth.user);
		console.log("nome: " + req.body.nome);
        
		start = process.hrtime(); 

		try {

			iis.SitesBackup(req.body.nome)
			.then(Result => {
				
				var TempoDuracao = elapsed_time();

				sendRes(res, true, {
									"Duracao": TempoDuracao,
									"Detalhes": Result
									});
									
			})
			.catch(error => {
				
				log.warn("Falha");
				log.warn(error);
			
				if( error.message != undefined ){

					sendRes(res, false, {"Msg": error.message});
					
				}else if( error != undefined ){

					sendRes(res, false, {"Msg": error});

				}else{

					sendRes(res, false, {"Msg": "Falha em Executar Comando"});

				}
				
			});

		} catch (ex) {
			
			log.warn("Falha em Executar Comando");
			log.warn(ex);
		
			console.log(ex);

			sendRes(res, false, {"Msg": "Falha em Executar Comando"});
		
		}
	
	}else{

        log.warn("Existem parametros pendentes");
    
		sendRes(res, false, {"Msg": "Existem parametros pendentes"});

	}

});

app.post("/iis_config_ssl", function(req, res){

	if( req.body.dominio && req.body.dominios && req.body.email && req.body.empresa ) 
	{
		
		log.info("-------------------------------------");
		log.info("Funcao: iis_config_ssl");        
		log.info("Usuario: " + req.auth.user);
        log.info("dominio: " + req.body.dominio);
		log.info(req.body);

		console.log("-------------------------------------");
		console.log("Funcao: iis_config_ssl");        
		console.log("Usuario: " + req.auth.user);
        console.log("dominio: " + req.body.dominio);
		
		start = process.hrtime(); 

		try {

            let RetWacs         = "";

            if( req.body.empresa == "LetsEncrypt" ){

                RetWacs             = Cfg.Wacs_LetsEncrypt;

            }else if( req.body.empresa == "ZeroSSL" ){

                RetWacs             = Cfg.Wacs_ZeroSSL

            }else{

                log.warn("A Empresa selecionada nao possui automacao");
                sendRes(res, false, {"Msg": "A Empresa selecionada nao possui automacao"});

                return false;

            }

			iis.SitesRetCodigo(req.body.dominio)
			.then(Result1 => {
					
				let DominiosList = req.body.dominios;
				DominiosList = DominiosList.split(",");
				
				let DominioRaiz = DominiosList[0];
				
				iis.SitesConfigSSL(RetWacs, Result1, DominioRaiz, req.body.dominios, req.body.email)
				.then(Result2 => {
					
					(async function(){
						
						var getSslDetails = {};
						
						try {

							getSslDetails = await sslChecker(DominioRaiz);

						} catch(err) {
							
							//

						}
						
						var TempoDuracao = elapsed_time();

						sendRes(res, true, {
											"Duracao": TempoDuracao,
											"Detalhes": Result2,
											"PosConsulta": getSslDetails
											});
					
					})();
										
				})
				.catch(error => {
					
					log.warn("Falha em Obter Detalhes");
					log.warn(error);
				
					if( error.message != undefined )
					{

						sendRes(res, false, {"Msg": error.message});

					}else{

						sendRes(res, false, {"Msg": "Falha em Obter Detalhes"});

					}
					
				});
									
			})
			.catch(error => {
				
				log.warn("Falha em Obter Detalhes");
				log.warn(error);
			
				if( error.message != undefined )
				{

					sendRes(res, false, {"Msg": error.message});

				}else{

					sendRes(res, false, {"Msg": "Falha em Obter Detalhes"});

				}
				
			});

		} catch (ex) {
			
			log.warn("Falha em Obter Informacao");
			log.warn(ex);
		
			console.log(ex);

			sendRes(res, false, {"Msg": "Falha em Obter Informacao"});
		
		}
	
	}else{

        log.warn("Dominio nao informado");
    
		sendRes(res, false, {"Msg": "Dominio nao informado"});

	}

});

app.post("/iis_permissao_pasta", function(req, res){

	if( req.body.diretorio != "" && req.body.usuario != "" ) 
	{
		
		log.info("-------------------------------------");
		log.info("Funcao: iis_backup");        
		log.info("Usuario: " + req.auth.user);
		log.info("diretorio: " + req.body.diretorio);
		log.info("usuario: " + req.body.usuario);
		log.info(req.body);

		console.log("-------------------------------------");
		console.log("Funcao: iis_backup");        
		console.log("Usuario: " + req.auth.user);
		console.log("diretorio: " + req.body.diretorio);
		console.log("usuario: " + req.body.usuario);
        
		start = process.hrtime(); 

		try {

			iis.SitesPermissaoPasta(req.body.diretorio, req.body.usuario)
			.then(Result => {
				
				var TempoDuracao = elapsed_time();

				sendRes(res, true, {
									"Duracao": TempoDuracao,
									"Detalhes": Result
									});
									
			})
			.catch(error => {
				
				log.warn("Falha");
				log.warn(error);
			
				if( error.message != undefined ){

					sendRes(res, false, {"Msg": error.message});
					
				}else if( error != undefined ){

					sendRes(res, false, {"Msg": error});

				}else{

					sendRes(res, false, {"Msg": "Falha em Executar Comando"});

				}
				
			});

		} catch (ex) {
			
			log.warn("Falha em Executar Comando");
			log.warn(ex);
		
			console.log(ex);

			sendRes(res, false, {"Msg": "Falha em Executar Comando"});
		
		}
	
	}else{

        log.warn("Existem parametros pendentes");
    
		sendRes(res, false, {"Msg": "Existem parametros pendentes"});

	}

});

app.post("/criar_diretorio", function(req, res){

    log.info("-------------------------------------");
    log.info("Funcao: criar_diretorio");
    log.info("Usuario: " + req.auth.user);
    log.info(req.body);

    console.log("-------------------------------------");
    console.log("Funcao: criar_diretorio");
    console.log("Usuario: " + req.auth.user);

    if( req.body.Diretorio != "" ) 
	{

        try {
            
            if( !fs.existsSync(req.body.Diretorio) )
            {
                
                fs.mkdir(req.body.Diretorio, (err) => {
                    
                    if(err) 
                    {
                    
                        log.warn("Erro ao Criar o Diretorio");
                        log.warn(err);

                        sendRes(res, false, {"Msg": "Erro ao Criar o Diretorio"});
                        
                    }else{

                        log.info(">>> SUCESSO <<<")

                        sendRes(res, true);
                        
                    }
                    
                });

            }else{

                log.warn("Ja existe este diretorio");

                sendRes(res, false, {"Msg": "Ja existe este diretorio"});
                
            }

        } catch (error) {
            
            log.warn("Falha em Criar Diretorio");
			log.warn(error);

			sendRes(res, false, {"Msg": "Falha em Criar Diretorio"});

        }        

    }else{

        log.warn("Existem campos nao preenchidos");

        sendRes(res, false, {"Msg": "Existem campos nao preenchidos"});
        
    }

});

app.post("/filezilla_contas_listar", function(req, res){

    log.info("-------------------------------------");
    log.info("Funcao: filezilla_contas_listar");
    log.info("Usuario: " + req.auth.user);
    log.info(req.body);

    console.log("-------------------------------------");
    console.log("Funcao: filezilla_contas_listar");
    console.log("Usuario: " + req.auth.user);

    FilezillaCtrl.init(Cfg.Filezilla).then(function(){

        FilezillaCtrl.contas_listar().then(function(DadRet){
    
            log.info(">>> SUCESSO <<<")
            log.info(JSON.stringify(DadRet))

            sendRes(res, true, DadRet);
        
        }).catch(function(err){
    
            log.warn(err.message);
    
		    sendRes(res, false, {"Msg": err.message});
    
        });
    
    }).catch(function(err){
    
        log.warn(err.message);
    
		sendRes(res, false, {"Msg": err.message});
    
    });

});

app.post("/filezilla_contas_criar", function(req, res){

    log.info("-------------------------------------");
    log.info("Funcao: filezilla_contas_criar");
    log.info("Usuario: " + req.auth.user);
    log.info(req.body);

    console.log("-------------------------------------");
    console.log("Funcao: filezilla_contas_criar");
    console.log("Usuario: " + req.auth.user);

    if( req.body.Conta != "" && req.body.Senha != "" && req.body.Diretorio != "" ) 
	{

        FilezillaCtrl.init(Cfg.Filezilla).then(function(){

            var InfDad = { Senha: req.body.Senha, Diretorio: req.body.Diretorio, Permissoes: req.body.Permissoes };

            FilezillaCtrl.contas_criar(req.body.Conta, InfDad).then(function(){
        
                log.info(">>> SUCESSO <<<")

                sendRes(res, true);
            
            }).catch(function(err){
        
                log.warn(err.message);
        
                sendRes(res, false, {"Msg": err.message});
        
            });
        
        }).catch(function(err){
        
            log.warn(err.message);
        
            sendRes(res, false, {"Msg": err.message});
        
        });

    }else{

        log.warn("Existem campos nao preenchidos");

        sendRes(res, false, {"Msg": "Existem campos nao preenchidos"});
        
    }

});

app.post("/filezilla_contas_alterar", function(req, res){

    log.info("-------------------------------------");
    log.info("Funcao: filezilla_contas_alterar");
    log.info("Usuario: " + req.auth.user);
    log.info(req.body);

    console.log("-------------------------------------");
    console.log("Funcao: filezilla_contas_alterar");
    console.log("Usuario: " + req.auth.user);

    if( req.body.Conta != "" && req.body.Senha != "" && req.body.Diretorio != "" ) 
	{

        FilezillaCtrl.init(Cfg.Filezilla).then(function(){

            var InfDad = { Senha: req.body.Senha, Diretorio: req.body.Diretorio, Permissoes: req.body.Permissoes };

            FilezillaCtrl.contas_alterar(req.body.Conta, InfDad).then(function(){
        
                log.info(">>> SUCESSO <<<")

                sendRes(res, true);
            
            }).catch(function(err){
        
                log.warn(err.message);
        
                sendRes(res, false, {"Msg": err.message});
        
            });
        
        }).catch(function(err){
        
            log.warn(err.message);
        
            sendRes(res, false, {"Msg": err.message});
        
        });

    }else{

        log.warn("Existem campos nao preenchidos");

        sendRes(res, false, {"Msg": "Existem campos nao preenchidos"});
        
    }

});

app.post("/filezilla_contas_alterar_senha", function(req, res){

    log.info("-------------------------------------");
    log.info("Funcao: filezilla_contas_alterar_senha");
    log.info("Usuario: " + req.auth.user);
    log.info(req.body);

    console.log("-------------------------------------");
    console.log("Funcao: filezilla_contas_alterar_senha");
    console.log("Usuario: " + req.auth.user);

    if( req.body.Conta != "" && req.body.Senha != "" ) 
	{

        FilezillaCtrl.init(Cfg.Filezilla).then(function(){

            FilezillaCtrl.contas_alterar_senha(req.body.Conta, req.body.Senha).then(function(){
        
                log.info(">>> SUCESSO <<<")

                sendRes(res, true);
            
            }).catch(function(err){
        
                log.warn(err.message);
        
                sendRes(res, false, {"Msg": err.message});
        
            });
        
        }).catch(function(err){
        
            log.warn(err.message);
        
            sendRes(res, false, {"Msg": err.message});
        
        });

    }else{

        log.warn("Existem campos nao preenchidos");

        sendRes(res, false, {"Msg": "Existem campos nao preenchidos"});
        
    }

});

app.post("/filezilla_contas_alterar_diretorio", function(req, res){

    log.info("-------------------------------------");
    log.info("Funcao: filezilla_contas_alterar_diretorio");
    log.info("Usuario: " + req.auth.user);
    log.info(req.body);

    console.log("-------------------------------------");
    console.log("Funcao: filezilla_contas_alterar_diretorio");
    console.log("Usuario: " + req.auth.user);

    if( req.body.Conta != "" && req.body.Diretorio != "" ) 
	{

        FilezillaCtrl.init(Cfg.Filezilla).then(function(){

            FilezillaCtrl.contas_alterar_diretorio(req.body.Conta, req.body.Diretorio).then(function(){
        
                log.info(">>> SUCESSO <<<")

                sendRes(res, true);
            
            }).catch(function(err){
        
                log.warn(err.message);
        
                sendRes(res, false, {"Msg": err.message});
        
            });
        
        }).catch(function(err){
        
            log.warn(err.message);
        
            sendRes(res, false, {"Msg": err.message});
        
        });

    }else{

        log.warn("Existem campos nao preenchidos");

        sendRes(res, false, {"Msg": "Existem campos nao preenchidos"});
        
    }

});

app.post("/filezilla_contas_alterar_permissoes", function(req, res){

    log.info("-------------------------------------");
    log.info("Funcao: filezilla_contas_alterar_permissoes");
    log.info("Usuario: " + req.auth.user);
    log.info(req.body);

    console.log("-------------------------------------");
    console.log("Funcao: filezilla_contas_alterar_permissoes");
    console.log("Usuario: " + req.auth.user);

    if( req.body.Conta != "" ) 
	{

        FilezillaCtrl.init(Cfg.Filezilla).then(function(){

            FilezillaCtrl.contas_alterar_permissoes(req.body.Conta, req.body.Permissoes).then(function(){
        
                log.info(">>> SUCESSO <<<")

                sendRes(res, true);
            
            }).catch(function(err){
        
                log.warn(err.message);
        
                sendRes(res, false, {"Msg": err.message});
        
            });
        
        }).catch(function(err){
        
            log.warn(err.message);
        
            sendRes(res, false, {"Msg": err.message});
        
        });

    }else{

        log.warn("Existem campos nao preenchidos");

        sendRes(res, false, {"Msg": "Existem campos nao preenchidos"});
        
    }

});

app.post("/filezilla_contas_existe", function(req, res){

    log.info("-------------------------------------");
    log.info("Funcao: filezilla_contas_existe");
    log.info("Usuario: " + req.auth.user);
    log.info(req.body);

    console.log("-------------------------------------");
    console.log("Funcao: filezilla_contas_existe");
    console.log("Usuario: " + req.auth.user);

    if( req.body.Conta != "" ) 
	{

        FilezillaCtrl.init(Cfg.Filezilla).then(function(){

            FilezillaCtrl.contas_existe(req.body.Conta).then(function(DadRet){
        
                log.info(">>> SUCESSO <<<")

                sendRes(res, true, DadRet);
            
            }).catch(function(err){
        
                log.warn(err.message);
        
                sendRes(res, false, {"Msg": err.message});
        
            });
        
        }).catch(function(err){
        
            log.warn(err.message);
        
            sendRes(res, false, {"Msg": err.message});
        
        });

    }else{

        log.warn("Existem campos nao preenchidos");

        sendRes(res, false, {"Msg": "Existem campos nao preenchidos"});
        
    }

});

app.post("/filezilla_contas_deletar", function(req, res){

    log.info("-------------------------------------");
    log.info("Funcao: filezilla_contas_deletar");
    log.info("Usuario: " + req.auth.user);
    log.info(req.body);

    console.log("-------------------------------------");
    console.log("Funcao: filezilla_contas_deletar");
    console.log("Usuario: " + req.auth.user);

    if( req.body.Conta != "" ) 
	{

        FilezillaCtrl.init(Cfg.Filezilla).then(function(){

            FilezillaCtrl.contas_deletar(req.body.Conta).then(function(){
        
                log.info(">>> SUCESSO <<<")

                sendRes(res, true);
            
            }).catch(function(err){
        
                log.warn(err.message);
        
                sendRes(res, false, {"Msg": err.message});
        
            });
        
        }).catch(function(err){
        
            log.warn(err.message);
        
            sendRes(res, false, {"Msg": err.message});
        
        });

    }else{

        log.warn("Existem campos nao preenchidos");

        sendRes(res, false, {"Msg": "Existem campos nao preenchidos"});
        
    }

});

app.listen(Cfg.Porta, function(){ 
    
    console.log("SysUtilAPI - Porta: "  + Cfg.Porta);
    console.log("Desenvolvido por PALOMA MACETKO <cmacetko@gmail.com>");

    console.log("--------------");

    log.info("API Iniciada");

});
# SysUtilAPI

SysUtilAPI é uma API, que roda em Nodejs e combina várias ferramentas diferentes úteis.

## Porta

A aplicação roda na porta **9091** porém pode ser alterado na variável **cfg_porta**

## Autenticação

O acesso a api é feito utilizando **autenticação básica HTTP** *(Basic Auth)*, e os usuários/senha são controlados na variável **cfg_usuarios**

## Método

Toda chamada a API é feita via **POST** enviando no corpo da solicitação o JSON com os parâmetros

## Sucesso

Em caso de sucesso, será retornado um json com dois valores:

- **httpcode:** 200
- **body:** Json com o resultado da requisição

**Exemplo:**
```json
{
"httpcode": 200,
"body":{
}
}
```

## Erro

Em caso de erro, será retornado um json com dois valores:

- **httpcode:** 500
- **body/Msg:** Mensagem de erro

**Exemplo:**
```json
{
"httpcode": 500,
"body":{
"Msg": "Alguns dados nao foram preenchidos"
}
}
```

## Requisitos

Para o funcionamento deste método é necessário instalar alguns programas:
- https://wkhtmltopdf.org/downloads.html
- https://download.imagemagick.org/ImageMagick/download/binaries/ImageMagick-7.0.10-56-Q16-HDRI-x64-dll.exe
- https://www.ghostscript.com/download/gsdnld.html
- http://www.graphicsmagick.org/download.html
- https://dl.xpdfreader.com/xpdf-tools-win-4.02.zip

# Métodos

## Conversor de Página HTML para Arquivo PDF

**Método:** 
url_to_pdf

**Exemplo:**
```json
{
  "url": "https://br.lipsum.com/feed/html",
  "options": {
    "page-size": "A4",
    "margin-bottom": 0,
    "margin-left": 0,
    "margin-top": 0,
    "margin-right": 0,
    "viewport-size": "1280x1024"
  }
}
```

**Retorno:**
```json
{
"httpcode": 200,
"body":{
"Nome": "beafd9ea-7243-43a4-a894-2228a6b5bb4c.pdf",
"Tamanho": 1227,
"Tamanho2": "1 KB",
"Pdf": "XX",
"Duracao": "2s 815.4137010000ms"
}
}
```


## Conversor de PDF em JPG

**Método:**
pdf_to_jpg

**Exemplo:**
```json
{
  "url": "http://www.site.com.br/arquivo.pdf",
  "QtdPaginas": 2
}
```

**Retorno:**
```json
{
"httpcode": 200,
"body":{
"Arquivos":[
{
"Pagina": 1,
"Tamanho": 159170,
"Tamanho2": "155 KB",
"Imagem": "XXXXXXXXX"
},
{
"Pagina": 2,
"Tamanho": 211191,
"Tamanho2": "206 KB",
"Imagem": "XXXX"
}
],
"Duracao": "2s 936.7514000000ms"
}
}
```
 
## OCR (Transforma Imagem em Texto Livre)

**Método:**
ocr

**Exemplo:**
```json
{
  "url": "http://www.site.com.br/arquivo.jpg"
}
```

**Retorno:**
```json
{
"httpcode": 200,
"body":{
"Resultado":[
"Valor: R$122,21",
"Data: 12/12/1212"
],
"Duracao": "16s 766.9456000000ms"
}
}
```

## Ping

**Método:**
ping

**Exemplo:**
```json
{
  "url": "google.com.br"
}
```

**Retorno:**
```json
{
"httpcode": 200,
"body":{
"Duracao": "0s 142.4308990000ms",
"Consulta":{
"host": "google.com.br",
"numeric_host": "172.217.30.67",
"online": "S",
"time": 15,
"output": "XXX"
}
}
}
```

## Tracert

**Método:**
tracert

**Exemplo:**
```json
{
  "url": "8.8.8.8"
}
```

**Retorno:**
```json
{
"httpcode": 200,
"body":{
"Duracao": "7s 370.5857000000ms",
"Consulta":[
{
"hop": 1,
"rtt1": "<1 ms",
"rtt2": "<1 ms",
"rtt3": "<1 ms",
"ip": "192.168.20.1"
},
{
"hop": 2,
"rtt1": "1 ms",
"rtt2": "<1 ms",
"rtt3": "<1 ms",
"ip": "192.168.25.1"
},
{
"hop": 3,
"rtt1": "7 ms",
"rtt2": "4 ms",
"rtt3": "6 ms",
"ip": "10.85.161.4"
},
{
"hop": 4,
"rtt1": "20 ms",
"rtt2": "20 ms",
"rtt3": "20 ms",
"ip": "187.85.163.245"
},
{
"hop": 5,
"rtt1": "17 ms",
"rtt2": "22 ms",
"rtt3": "18 ms",
"ip": "187.16.216.55"
},
{
"hop": 6,
"rtt1": "20 ms",
"rtt2": "19 ms",
"rtt3": "20 ms",
"ip": "74.125.243.65"
},
{
"hop": 7,
"rtt1": "18 ms",
"rtt2": "19 ms",
"rtt3": "16 ms",
"ip": "108.170.225.157"
},
{
"hop": 8,
"rtt1": "18 ms",
"rtt2": "16 ms",
"rtt3": "16 ms",
"ip": "8.8.8.8"
}
]
}
}
```

## Whois (Obtêm dados de um domínio)

**Método:**
whois

**Exemplo:**
```json
{
  "url": "google.com"
}
```

**Retorno:**
```json
{
"httpcode": 200,
"body":{
"Duracao": "0s 916.9646000000ms",
"Consulta":{
"domainName": "google.com",
"registryDomainId": "2138514_DOMAIN_COM-VRSN",
"registrarWhoisServer": "whois.markmonitor.com",
"registrarUrl": "http://www.markmonitor.com",
"updatedDate": "2019-09-09T08:39:04-0700",
"creationDate": "1997-09-15T00:00:00-0700",
"registrarRegistrationExpirationDate": "2028-09-13T00:00:00-0700",
"registrar": "MarkMonitor, Inc.",
"registrarIanaId": "292",
"registrarAbuseContactEmail": "abusecomplaints@markmonitor.com",
"registrarAbuseContactPhone": "+1.2083895770",
"domainStatus": "clientUpdateProhibited (https://www.icann.org/epp#clientUpdateProhibited) clientTransferProhibited (https://www.icann.org/epp#clientTransferProhibited) clientDeleteProhibited (https://www.icann.org/epp#clientDeleteProhibited) serverUpdateProhibited (https://www.icann.org/epp#serverUpdateProhibited) serverTransferProhibited (https://www.icann.org/epp#serverTransferProhibited) serverDeleteProhibited (https://www.icann.org/epp#serverDeleteProhibited)",
"registrantOrganization": "Google LLC",
"registrantStateProvince": "CA",
"registrantCountry": "US",
"registrantEmail": "Select Request Email Form at https://domains.markmonitor.com/whois/google.com",
"adminOrganization": "Google LLC",
"adminStateProvince": "CA",
"adminCountry": "US",
"adminEmail": "Select Request Email Form at https://domains.markmonitor.com/whois/google.com",
"techOrganization": "Google LLC",
"techStateProvince": "CA",
"techCountry": "US",
"techEmail": "Select Request Email Form at https://domains.markmonitor.com/whois/google.com",
"nameServer": "ns2.google.com ns4.google.com ns3.google.com ns1.google.com",
"dnssec": "unsigned",
"urlOfTheIcannWhoisDataProblemReportingSystem": "http://wdprs.internic.net/",
"lastUpdateOfWhoisDatabase": "2021-01-18T06:00:32-0800 <<<"
}
}
}
```

## Geoip (Identifica o endereço relacionado a um IP)

**Método:**
geoip

**Exemplo:**
```json
{
  "ip": "8.8.8.8"
}
```

**Retorno:**
```json
{
"httpcode": 200,
"body":{
"Duracao": "0s 61.6183000000ms",
"Consulta":{
"range":[
134742016,
134774783
],
"country": "US",
"region": "",
"eu": "0",
"timezone": "America/Chicago",
"city": "",
"ll":[
37.751,
-97.822
],
"metro": 0,
"area": 1000
}
}
}
```

## Nslookup

**Método:**
nslookup

**Exemplo:**
```json
{
  "name": "google.com.br",
  "type": "A"
}
```

**Retorno:**
```json
{
"httpcode": 200,
"body":{
"Duracao": "0s 35.2099990000ms",
"Consulta":[
{
"name": "google.com.br",
"type": 1,
"class": 1,
"ttl": 176,
"address": "172.217.30.99"
}
]
}
}
```

## Tira um Screenshot de um Site

**Método:**
website_screenshot

**Exemplo:**
```json
{
  "url": "https://www.google.com.br"
}
```

**Retorno:**
```json
{
"httpcode": 200,
"body":{
"Nome": "22dbd3c3-02fe-457f-9652-b57a5dccf2fc.jpg",
"Tamanho": 29991,
"Tamanho2": "29 KB",
"Imagem": "XXXXXXX",
"Duracao": "12s 671.9190000000ms"
}
}
```

## PIX - Gera o código para pagamento

Método:
pix_codigo

**Exemplo:**
```json
{
  "chave": "00000000000",
  "nome": "TESTE",
  "cidade": "BRUSQUE",
  "valor": 1.23
}
```

**Retorno:**
```json
{
"httpcode": 200,
"body":{
"Codigo": "00020126330014br.gov.bcb.pix01110000000000052040000530398654041.235802BR5905TESTE6007BRUSQUE62070503***6304FC5C",
"Duracao": "0s 2.7841000000ms"
}
}
```

## PIX - Gera o QRCode para pagamento

**Método:**
pix_qrcode

**Exemplo:**
```json
{
  "chave": "00000000000",
  "nome": "TESTE",
  "cidade": "BRUSQUE",
  "valor": 1.23
}
```

**Retorno:**
```json
{
"httpcode": 200,
"body":{
"Imagem": "XXXX",
"Duracao": "0s 231.7903010000ms"
}
}
```

## Otimizar imagem reduzindo seu tamanho

**Método:**
otimizar_imagem

**Exemplo:**
```json
{
  "url": "http://www.site.com.br/imagem.jpg"
}
```

**Retorno:**
```json
{
"httpcode": 200,
"body":{
"Origem_Tamanho": 3084,
"Origem_Tamanho2": "3 KB",
"Resultado_Tamanho": 2905,
"Resultado_Tamanho2": "3 KB",
"Imagem": "XXX",
"Duracao": "0s 516.7765000000ms"
}
}
```
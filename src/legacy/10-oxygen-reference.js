

/* TEC v0.13 — Solubilità teorica ossigeno, NON misura dell'acquario.
 * USGS Open-File Report 94-455, Tabella 4, acqua dolce 760 mm Hg.
 * https://water.usgs.gov/nawqa/pnsp/pubs/ofr94-455/sw-t.html
 * I dati arrotondati della tabella provengono da Weiss (1970); per misure nuove
 * USGS raccomanda DOTABLES/Benson & Krause (1980, 1984). Nessun confronto
 * dinamico è possibile senza temperatura, pressione, salinità e DO misurati.
 */
(function(global){'use strict';
const SOURCE=Object.freeze({title:'USGS, Field Guide for Collecting and Processing Stream-Water Samples, Open-File Report 94-455, Tabella 4',url:'https://water.usgs.gov/nawqa/pnsp/pubs/ofr94-455/sw-t.html',updated:'Tabella storica basata su Weiss (1970); DOTABLES USGS aggiornato usa Benson & Krause.',dotables:'https://water.usgs.gov/water-resources/software/DOTABLES/'});
const TABLE=Object.freeze([{temperatureC:16,mgL:9.8},{temperatureC:18,mgL:9.4},{temperatureC:20,mgL:9.1},{temperatureC:22,mgL:8.7},{temperatureC:24,mgL:8.4},{temperatureC:26,mgL:8.1},{temperatureC:28,mgL:7.8},{temperatureC:30,mgL:7.5}].map(Object.freeze));
function atTemperature(t){if(!Number.isFinite(t)||t<16||t>30)throw Error('Temperatura fuori dal riferimento tabulato');const exact=TABLE.find(e=>e.temperatureC===t);if(exact)return {temperatureC:t,mgL:exact.mgL,method:'tabella'};const higher=TABLE.find(e=>e.temperatureC>t);const lower=TABLE[TABLE.indexOf(higher)-1];return {temperatureC:t,mgL:lower.mgL+(higher.mgL-lower.mgL)*(t-lower.temperatureC)/(higher.temperatureC-lower.temperatureC),method:'interpolazione lineare'};}
function selfTest(){const c={value20:atTemperature(20).mgL===9.1,value30:atTemperature(30).mgL===7.5,decline:atTemperature(16).mgL>atTemperature(30).mgL,interpolation:Math.abs(atTemperature(21).mgL-8.9)<1e-8,outOfRange: (()=>{try{atTemperature(35);return false}catch{return true}})()};return {allPassed:Object.values(c).every(Boolean),checks:c};}
global.TECOxygenReference=Object.freeze({SOURCE,TABLE,atTemperature,selfTest});
})(typeof window!=='undefined'?window:globalThis);



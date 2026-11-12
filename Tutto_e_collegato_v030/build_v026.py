"""Offline distribution of v0.30 from the v0.20 source baseline.
Exploratory N-cycle, trophic and O2 stocks; game coefficients not aquarium-calibrated.
Two HTMLs embed 22 pure JS modules + app.
"""
from pathlib import Path
BASE=Path(__file__).resolve().parent
SRC=BASE/'src'; OUT=BASE/'dist';OUT.mkdir(exist_ok=True)
mods=['balance-engine','leaf-reference','water-budget','tracer-reference',
 'leaf-element-reference','leaf-stocks','leaf-matter-ledger','nitrification-stoichiometry',
 'litter-protocol','early-leaching','oxygen-reference','oxygen-cycle','leaf-mass-protocol',
 'replicate-observations','leaf-retrieval-series','microbial-provenance','microbial-entry-history','process-evidence-gates','water-litter-interface','litter-dynamics','trophic-web','ecocycle-n','life-history']
scripts=[SRC/'modules'/f'{n}.js' for n in mods]+[SRC/'app.js']
for kind in ('autonomo','elementor'):
    html=(SRC/'templates'/f'{kind}.html').read_text(encoding='utf-8')
    anchor='</details>\n<details class="litter-protocol" id="litterProtocolSection">'
    assert html.count(anchor)==1
    panels=''.join((SRC/f).read_text(encoding='utf-8') for f in ('replicate-panel.html','retrieval-series-panel.html','microbial-provenance-panel.html','process-evidence-panel.html'))
    html=html.replace(anchor,'</details>\n'+panels+'<details class="litter-protocol" id="litterProtocolSection">')
    css='\n'.join((SRC/f).read_text(encoding='utf-8') for f in (
      f'styles/{kind}.css','replicate-panel.css','retrieval-series-panel.css','microbial-provenance-panel.css','microbial-entry-history.css','process-evidence-panel.css'))
    html=html.replace('<!-- TEC_STYLE -->','<style>\n'+css+'\n</style>')
    html=html.replace('<!-- TEC_SCRIPTS -->','\n'.join('<script>\n'+p.read_text(encoding='utf-8')+'\n</script>' for p in scripts))
    for a,b in (('Prototipo 0.16','Prototipo 0.30'),('PROTOTIPO 0.16','PROTOTIPO 0.30'),
                ('Versione 0.13 · misure sperimentali e limiti','Versione 0.30 · ossigeno e relazioni ecologiche'),
                ('prototipo 0.14 · laboratorio documentato','prototipo 0.30 · modello esplorativo'),
                ('Ecosistema v0.16','Ecosistema v0.30'),(' · V0.16',' · V0.30'),('v0.30 | Elementor','v0.30 | Elementor')):
        html=html.replace(a,b)
    for id in ('replicateObservationsForm','retrievalSeriesForm','microbialProvenanceSection','processEvidenceSection','processEvidenceResult','processEvidenceSourcesBtn'):
        assert html.count('id="'+id+'"')==1,id
    assert 'window.TECOxygenCycle' in html
    assert 'window.TECEcoCycleN' in html and 'window.TECProcessEvidenceGates' in html and 'window.TECWaterLitterInterface' in html and 'window.TECLitterDynamics' in html
    dest=OUT/f'Tutto_e_collegato_Prototipo_v30_{"AUTONOMO" if kind=="autonomo" else "ELEMENTOR"}.html'
    dest.write_text(html,encoding='utf-8')
    print(dest.name,dest.stat().st_size,'bytes')

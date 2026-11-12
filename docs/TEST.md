# Verifica v0.40 — migrazione tecnica

Test Chromium con il contenuto della pagina ricomposto in memoria (CSS e JS dal repository, stesso ordine), su viewport 1440×950 e 390×844. Il browser dell'ambiente bloccava le navigazioni locali e HTTP, quindi non sono stati verificati il caricamento HTTP reale e la persistenza su un'origine pubblicata. I file JavaScript hanno superato node --check. Il test è riproducibile con Playwright e Chromium (vedere tests/smoke.py).

## Superato
- Montaggio iniziale senza eccezioni JS; vasca asciutta.
- Pennello fondo, acqua parziale, Echinodorus e comparsa Physa, riempimento, avvio.
- Introduzione Neocaridina, Helena, Melanoides e Amularis; giorno 3 raggiunto. La predazione legacy può rimuovere una lumaca; non dimostra il bilancio biologico della Helena.
- Lente attivabile; contenitore tank-wrap. Il campione è ancora illustrativo.
- Tutti gli invarianti riportati da __TEC_TEST__.invariants() risultano true nello scenario breve.
- Trasferimento in memoria del salvataggio di prova dopo reset: import riuscito, giorno 3 ripristinato.
- Rendering mobile iniziale: larghezza corpo e root 390 px; nessuna eccezione JavaScript nel controllo iniziale.

## Ancora da verificare
- Persistenza dopo ricarica in browser reale, compatibilità v0.39 su WordPress e iframe cross-origin, download/import tramite UI, limiti di storage; nessuna sincronizzazione cloud.
- Test completo del touch e del layout con tutti i pannelli aperti; controlli di accessibilità; test di lungo periodo e validazione scientifica.
- Lente con microfauna locale reale, animazioni anatomiche, motore trofico di tutte le specie e tempo automatico: lacune ereditate, non risolte con questa migrazione.
- Il file 25 è ancora monolitico. Non confondere l'estrazione degli script con una riscrittura modulare completa.

Screenshot desktop/mobile sono acquisizioni del prototipo locale; non attestano la pubblicazione. Il vecchio header conteneva uno span non chiuso: corretto e aggiornato il tag versione in v0.40.

# Tutto è collegato — Ecosistema · v0.40

Web app autonoma di Sofia Benfaida. Migrazione conservativa del widget Elementor v0.39: non è ancora una versione definitiva del simulatore.

## Avvio immediato
Apri `index.html` in un browser moderno dopo aver estratto tutto il repository. Per un test più fedele alla pubblicazione usa un server HTTP locale, ad esempio con Python: `python -m http.server 8000`, poi apri `http://localhost:8000/`. Non occorrono Node, npm, Streamlit, database remoto né chiavi API. Non spostare i singoli file: i percorsi sono relativi.

## Pubblicazione GitHub Pages
1. Accedi a GitHub e crea un repository `tutto-e-collegato` (Public se usi GitHub Free; il codice e le immagini saranno pubblici, quindi valuta i diritti e la riservatezza della tesi).
2. Estrai lo ZIP e carica **il contenuto** del repository nella radice del branch `main` (non lo ZIP). Devono risultare visibili `index.html`, `assets/`, `src/`, ecc. Con GitHub Desktop o Git puoi caricare anche `.nojekyll` senza difficoltà.
3. Apri Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main, / (root) → Save.
4. Quando Pages mostra l'URL effettivo, aprilo e verifica il gioco. L'indirizzo normalmente ha la forma `https://USERNAME.github.io/tutto-e-collegato/` (USERNAME è il tuo nome account, non un dato noto).
5. Apri `integration/elementor-iframe.html` in un editor, sostituisci entrambe le occorrenze di `https://USERNAME.github.io/tutto-e-collegato/` con l'URL effettivo, poi copia il codice in un unico widget HTML in Elementor Free, su una pagina a larghezza piena. Verifica la pagina pubblicata e la vista mobile. Il link apre l'app indipendente.

Documentazione ufficiale: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Sorgenti
- `index.html`: interfaccia originale, wrapper HTML5 e controlli di trasferimento vasca.
- `assets/css/aquarium.css`: stili originali della v0.39; `platform.css`: adattamento autonomo.
- `src/legacy/00...25`: script classici estratti nello stesso ordine. 00–23: motori e modelli; 24: immagini bestiario; 25: applicazione principale ancora monolitica (circa 1 MB, comprese immagini). I numeri preservano l'ordine di caricamento; non sono moduli ES.
- `src/platform/save-tools.js`: import/export esplicito; usa il validatore del gioco. Importa solo file propri o di provenienza affidabile.
- `integration/`: template Elementor e istruzioni per trasferire un salvataggio preesistente.
- `docs/`: provenienza, test e roadmap.

## Salvataggi e browser
La chiave legacy `tec_ecosistema_proto_01` e IndexedDB `tutto_collegato_ecosistema` sono conservati. Passare da WordPress a GitHub Pages cambia origine web: i salvataggi non si trasferiscono da soli. Il file JSON permette il trasferimento. Anche iframe e app aperta direttamente possono avere storage separato a seconda del browser e delle sue politiche. Per la massima affidabilità apri l'app direttamente ed esporta una copia. Non esiste sincronizzazione cloud né elaborazione a browser chiuso.

## Prossimi passi
1. Pubblicazione di prova e QA su URL Pages + Elementor reale, test di salvataggio/ricaricamento e trasferimento cross-origin.
2. Separare stato, azioni, rendering e loop temporale dal file 25; estrarre immagini in asset individuali e mantenere la compatibilità dei salvataggi.
3. Integrare tutte le specie nel motore trofico e nella dinamica vitale; correggere la predazione e i bilanci della Helena.
4. Microfauna locale persistente, lente con osservazione effettiva delle zone, animazioni con rig SVG e interfaccia più intuitiva.
5. Verificare tempi automatici, equilibrio dinamico, bilanci, casi lunghi, touch e accessibilità. Nessuna riscrittura della grafica senza approvazione.

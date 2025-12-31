# Guida al Deployment

Questa guida spiega come mettere online l'applicazione e renderla operativa.

## 1. Preparazione alla Build

Assicurati di aver installato tutte le dipendenze:
```bash
npm install
```

## 2. Creazione della Versione di Produzione

Esegui il comando per costruire l'applicazione ottimizzata:
```bash
npm run build
```

Questo comando creerà una cartella `dist` nella root del progetto. Questa cartella contiene tutti i file necessari per il sito web.

## 3. Messa Online (Hosting)

Puoi ospitare la cartella `dist` su qualsiasi servizio di hosting statico. Ecco le opzioni più semplici e gratuite:

### Opzione A: Vercel (Molto Consigliato per React/Vite)
1.  Vai su [Vercel](https://vercel.com/) e registrati con GitHub.
2.  Clicca "Add New" -> "Project".
3.  Seleziona il repository GitHub del tuo progetto.
4.  Vercel rileverà automaticamente che è un progetto Vite.
5.  **IMPORTANTE**: Nella sezione "Environment Variables", devi aggiungere le variabili che hai nel tuo file `.env`:
    *   `VITE_SUPABASE_URL`: (il tuo url)
    *   `VITE_SUPABASE_ANON_KEY`: (la tua chiave)
6.  Clicca "Deploy".

### Opzione B: Netlify
1.  Creati un account su [Netlify](https://www.netlify.com/).
2.  Trascina la cartella `dist` (creata con `npm run build`) nella dashboard.
3.  **IMPORTANTE**: Per le variabili d'ambiente su Netlify, devi andare in Site Settings > Build & Deploy > Environment e aggiungere `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

## 4. Dati e Database
L'applicazione è collegata a **Supabase**.
- Questo significa che il database è **già online**.
- Tutti gli utenti che useranno l'app (sia da `localhost` che dal sito pubblico) vedranno e modificheranno gli **stessi dati**.
- Non c'è rischio di perdere dati pulendo la cache del browser.


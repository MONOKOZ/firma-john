# .secrets/ — lokale Geheimnisse (NIE committen)

Hier liegt der **Service-Account-Schlüssel** für den Build-Read aus Google Sheets.

## Was hier rein muss
Lege die von Google Cloud heruntergeladene JSON-Datei hier ab und benenne sie:

```
.secrets/service-account.json
```

Diese Datei enthält `client_email` und `private_key`. Sie ist über `.gitignore`
ausgeschlossen und verlässt deinen Rechner nicht. **Nirgendwo einfügen, nie committen.**

## Für den Cloudflare-/CI-Build (später)
Statt der Datei nutzt der Build dort eine Env-Variable (`GOOGLE_SA_KEY_BASE64`,
die komplette JSON als base64). Siehe `.env.example`, Variante B.

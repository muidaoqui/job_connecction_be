Seed import instructions

These JSON files are placed in `backend/data/seed` and are written in Extended JSON (they use `$oid` and `$date`). Use `mongoimport` to import them into your MongoDB instance.

Replace the connection URI and database name with your own. Example PowerShell commands:

```powershell
# change directory to the seed folder
cd backend\data\seed

# Example (replace <URI> and <DBNAME>):
mongoimport --uri "mongodb://localhost:27017/<DBNAME>" --collection users --file users.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/<DBNAME>" --collection companies --file companies.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/<DBNAME>" --collection recruiters --file recruiters.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/<DBNAME>" --collection jobs --file jobs.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/<DBNAME>" --collection candidates --file candidates.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/<DBNAME>" --collection resumes --file resumes.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/<DBNAME>" --collection applications --file applications.json --jsonArray
```

Notes:
- Import order matters because documents reference ObjectIds from other collections. Import `users` and `companies` first, then `recruiters` and `jobs`, then `candidates`, `resumes`, and `applications`.
- If your MongoDB version or tools do not accept Extended JSON, convert `$oid` fields to plain string `_id` values or use a small node script to insert documents using the MongoDB driver.
- After importing, you may want to grant index or run migrations if your app expects certain indexes.

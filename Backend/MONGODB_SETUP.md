# MongoDB Atlas — new database for COROnet

Follow these steps once. Your Node backend (`npm run dev` in `Backend`) and the optional FastAPI service both read **`MONGODB_URI`** from **`Backend/.env`**.

## 1. Create an Atlas account and project

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and sign up (or log in).
2. Create an **organization** if prompted, then a **project** (any name, e.g. `COROnet`).

## 2. Create a cluster (the “database server”)

1. Click **Build a Database**.
2. Choose **M0 FREE** (or paid if you prefer).
3. Pick a **region** close to you (lower latency).
4. Cluster name: e.g. **`COROnet`** (any name is fine).
5. Click **Create**. Wait until the cluster shows as deployed (a few minutes).

## 3. Database user (login for your app — not your Atlas email)

1. In the left sidebar, open **Database Access**.
2. Click **Add New Database User**.
3. **Authentication method:** Password.
4. **Username:** e.g. `coronet_app` (remember it).
5. **Password:** generate a strong password and **save it** (you will paste it into the connection string).
6. **Database User Privileges:** **Read and write to any database** (or at least `coronet`).
7. Click **Add User**.

## 4. Network access (allow your computer to connect)

1. Left sidebar → **Network Access**.
2. **Add IP Address** → **Allow Access from Anywhere** → `0.0.0.0/0` (fine for local dev; tighten for production).
3. Confirm **Active**.

## 5. Get the connection string

1. Left sidebar → **Database** → **Clusters** → on your cluster click **Connect**.
2. Choose **Drivers**.
3. **Driver:** Node.js, version as suggested.
4. Copy the **connection string** (starts with `mongodb+srv://`).

## 6. Edit the string for your app

The copied string looks like:

```text
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

1. Replace **`<username>`** with your database username (step 3).
2. Replace **`<password>`** with your database user password.  
   - If the password contains `@`, `#`, `:`, `/`, `%`, etc., you must **URL-encode** it (e.g. `@` → `%40`).
3. Set the **database name** in the path (before `?`). Use **`coronet`**:

   ```text
   ...mongodb.net/coronet?retryWrites=true&w=majority&appName=COROnet
   ```

   So the segment is `/coronet?` not `/?` only.

## 7. Put it in `Backend/.env`

Open **`Backend/.env`** and set:

```env
PORT=4000
MONGODB_URI=paste-your-full-string-here
JWT_SECRET=any-long-random-string-at-least-32-chars
CORS_ORIGIN=http://localhost:5173
```

Save the file. **Do not commit `.env`** to git (it should stay local).

## 8. Run the backend

```bash
cd Backend
npm install
npm run dev
```

You should see **`MongoDB connected`** and **`Server running on http://localhost:4000`**.

Test in a browser: `http://localhost:4000/api/health` → `"databaseOk": true`.

## 9. How “the database” appears in Atlas

MongoDB does not require you to create the `coronet` database manually. When your app first **registers a user** or **uploads a scan**, Mongoose creates **collections** (e.g. `users`, `scans`) inside `coronet`. You can open **Browse Collections** in Atlas to see them after you use the app.

## If connection still fails

- Confirm **Database Access** user and password match what is in `MONGODB_URI`.
- Confirm **Network Access** includes `0.0.0.0/0` or your current public IP.
- Confirm the cluster is **not paused** (free tier can pause after long inactivity — **Resume** if needed).
- Try another network (some school/work Wi‑Fi blocks MongoDB ports).

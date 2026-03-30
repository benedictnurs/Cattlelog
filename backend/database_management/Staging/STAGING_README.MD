
# Database Staging Workflow

## 1. Purpose
- Provide a **safe environment** for SQL changes before they enter production.
- Ensure **peer review**, **idempotence**, and **backout** verification.
- All testing should be done in the **dev** database (acr_db)

## 2. Directory Structure
```
backend/
└── database_management/
    ├── Staging/            ← all new scripts start here
    │   ├── add_col.sql
    │   ├── add_col_backout.sql
    │   ├── create_index.sql
    │   └── create_index_backout.sql
    └── SQL-Scripts/        ← once verified, move scripts here
        ├── add_col.sql
        ├── add_col_backout.sql
        └── …
```

## 3. Naming & Pairing Conventions
1. **Definitions**
   - **Forward**: implements the change.
   - **Backout**: undoes the change.
2. **Run in three phases**
   > **Phase 1 – Forward**
   - Run the forward script.
   - Applies the new schema/data change.
   - Confirm no errors, inspect the schema change.

   > **Phase 2 – Backout**
   - Run the backout script.
   - Reverses everything the forward did.
   - Ensures your backout script is complete and idempotent.
   - Verify the schema and data match the **pre-forward** state.

   > **Phase 3 – Forward again**
   - Re-applies the forward changes cleanly.
   - Final smoke test to confirm the change is repeatable.
3. **Naming**:  
   - **Forward Scripts**
      - `N_short_description.sql`  
   - **Backout Scripts**
      - `N_short_description_backout.sql`  
   - Use a numbered prefix (`1_`, `2_`) if multiple scripts must run in order from the same branch.  
   - No spaces: use underscores only.  
4. **File extension**:  
   - `.sql`

## 4. Lifecycle for Every Change
1. **Write** your forward & backout scripts in **`/Staging/`**  
   - Make sure you run them **forward, then back, then forward again** to confirm both paths work.  
3. Open a PR into `main`.  
4. **Merge & deploy**: Once verified, move the scripts into **`/SQL-Scripts/`** and merge into main.  

## 5. Best Practices & Tips
- **Backout safety**:  
  - Always test your backout in a fresh staging database.  
  - Keep data-destructive operations (e.g. `DROP COLUMN`) at the end of the backout.  
- **Validation**:  
  - After forward: run `SELECT COUNT(*)` on affected tables.  
  - After backout: ensure schema & row-counts match pre-change 
  baseline.
  - All verification should be done in development
- **Documentation**:  
  - At top of each script, add a comment block:
    ```sql
    -- Duration: how long should the query take
    ```

---
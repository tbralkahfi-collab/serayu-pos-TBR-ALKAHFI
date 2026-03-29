-- =====================================================
-- PRODUCTION-GRADE BACKUP RESTORE RPC FUNCTION
-- =====================================================
-- Atomic transaction-based restore with schema validation
-- Author: Senior Full-Stack Engineer
-- Version: 1.0

CREATE OR REPLACE FUNCTION restore_backup_atomic(
    p_backup_data JSONB,
    p_user_id UUID,
    p_version TEXT DEFAULT '1.0'
)
RETURNS TABLE(
    table_name TEXT,
    status TEXT,
    rows_processed INTEGER,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_version TEXT := '1.0';
    v_table_name TEXT;
    v_table_data JSONB;
    v_columns TEXT[];
    v_valid_columns TEXT[];
    v_clean_data JSONB;
    v_rows_processed INTEGER;
    v_error_message TEXT;
    v_total_rows INTEGER := 0;
    
    -- Define valid tables and their column order
    TYPE table_column_record IS RECORD (
        table_name TEXT,
        columns TEXT[]
    );
    
    v_table_columns table_column_record[];
    v_rec table_column_record;
    
BEGIN
    -- =====================================================
    -- STEP 1: VERSION VALIDATION
    -- =====================================================
    IF p_version IS NOT NULL AND p_version != v_current_version THEN
        RAISE EXCEPTION 'Backup version % is not compatible with current version %', p_version, v_current_version;
    END IF;
    
    -- =====================================================
    -- STEP 2: DEFINE TABLE SCHEMAS
    -- =====================================================
    v_table_columns := ARRAY[
        ('suppliers', ARRAY['id', 'user_id', 'nama', 'alamat', 'telepon', 'email', 'catatan', 'created_at'])::table_column_record,
        ('products', ARRAY['id', 'user_id', 'nama', 'kategori', 'harga_beli', 'harga_jual', 'stok', 'satuan', 'min_stok', 'created_at', 'updated_at'])::table_column_record,
        ('purchases', ARRAY['id', 'user_id', 'supplier_id', 'supplier_name', 'tanggal', 'total', 'dp', 'metode_bayar', 'status', 'items', 'catatan', 'created_at'])::table_column_record,
        ('debts', ARRAY['id', 'user_id', 'type', 'nama', 'total', 'sisa', 'tanggal', 'jatuh_tempo', 'keterangan', 'project_id', 'payments', 'created_at'])::table_column_record,
        ('expenses', ARRAY['id', 'user_id', 'kategori', 'deskripsi', 'jumlah', 'tanggal', 'created_at'])::table_column_record,
        ('transactions', ARRAY['id', 'user_id', 'tanggal', 'pelanggan', 'items', 'subtotal', 'diskon', 'diskon_persen', 'total', 'bayar', 'kembalian', 'metode', 'status', 'created_at'])::table_column_record,
        ('projects', ARRAY['id', 'user_id', 'nama_proyek', 'pelanggan', 'alamat', 'telepon', 'deskripsi', 'nilai_kontrak', 'diskon_persen', 'diskon_nominal', 'dp', 'biaya_tenaga_kerja', 'tanggal_order', 'tanggal_mulai', 'tanggal_selesai', 'status', 'catatan', 'materials', 'created_at'])::table_column_record
    ];
    
    -- =====================================================
    -- STEP 3: BEGIN ATOMIC TRANSACTION
    -- =====================================================
    -- Delete existing data in dependency order (reverse)
    FOR v_rec IN SELECT * FROM UNNEST(v_table_columns) ORDER BY 
        CASE table_name 
            WHEN 'expenses' THEN 1
            WHEN 'debts' THEN 2
            WHEN 'transactions' THEN 3
            WHEN 'purchases' THEN 4
            WHEN 'projects' THEN 5
            WHEN 'suppliers' THEN 6
            WHEN 'products' THEN 7
        END
    LOOP
        v_table_name := v_rec.table_name;
        v_columns := v_rec.columns;
        v_table_data := jsonb_extract_path_text(p_backup_data, ARRAY[v_table_name]);
        
        -- Skip if no data for this table
        IF v_table_data IS NULL OR jsonb_array_length(v_table_data) = 0 THEN
            RETURN NEXT;
            CONTINUE;
        END IF;
        
        BEGIN
            -- =====================================================
            -- STEP 4: DELETE EXISTING DATA
            -- =====================================================
            EXECUTE format('DELETE FROM %I WHERE user_id = $1', v_table_name) USING p_user_id;
            
            -- =====================================================
            -- STEP 5: DYNAMICALLY CLEAN AND INSERT DATA
            -- =====================================================
            -- Get valid columns for this table
            SELECT array_agg(column_name) INTO v_valid_columns
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = v_table_name 
            AND column_name = ANY(v_columns);
            
            -- Clean data by removing invalid columns
            v_clean_data := v_table_data;
            
            -- Insert data in batches of 100
            v_rows_processed := 0;
            FOR i IN 0..(jsonb_array_length(v_table_data) - 1) BY 100 LOOP
                DECLARE
                    v_batch JSONB := '[]'::jsonb;
                    v_batch_size INTEGER := 0;
                BEGIN
                    -- Create batch
                    FOR j IN i..LEAST(i + 99, jsonb_array_length(v_table_data) - 1) LOOP
                        DECLARE
                            v_record JSONB := v_table_data -> j;
                            v_clean_record JSONB := '{}'::jsonb;
                            v_col TEXT;
                        BEGIN
                            -- Only keep valid columns
                            FOR v_col IN SELECT unnest(v_valid_columns) LOOP
                                IF v_record ? v_col THEN
                                    v_clean_record := v_clean_record || jsonb_build_object(v_col, v_record -> v_col);
                                END IF;
                            END LOOP;
                            
                            -- Ensure user_id is set
                            v_clean_record := v_clean_record || jsonb_build_object('user_id', p_user_id);
                            
                            -- Add to batch
                            v_batch := v_batch || v_clean_record;
                            v_batch_size := v_batch_size + 1;
                        END;
                    END LOOP;
                    
                    -- Insert batch
                    IF v_batch_size > 0 THEN
                        EXECUTE format('INSERT INTO %I SELECT * FROM jsonb_to_recordset($1)', v_table_name)
                        USING v_batch;
                        v_rows_processed := v_rows_processed + v_batch_size;
                    END IF;
                END;
            END LOOP;
            
            -- Return success for this table
            RETURN NEXT;
            v_total_rows := v_total_rows + v_rows_processed;
            
        EXCEPTION WHEN OTHERS THEN
            v_error_message := SQLERRM;
            RETURN QUERY SELECT v_table_name, 'ERROR', 0, v_error_message;
            RAISE EXCEPTION 'Restore failed for table %: %', v_table_name, v_error_message;
        END;
    END LOOP;
    
    -- =====================================================
    -- STEP 6: RETURN SUMMARY
    -- =====================================================
    RETURN QUERY SELECT 'SUMMARY', 'SUCCESS', v_total_rows, NULL::TEXT;
    
EXCEPTION WHEN OTHERS THEN
    -- =====================================================
    -- STEP 7: AUTOMATIC ROLLBACK
    -- =====================================================
    v_error_message := SQLERRM;
    RETURN QUERY SELECT 'GLOBAL_ERROR', 'FAILED', 0, v_error_message;
    RAISE EXCEPTION 'Atomic restore failed: %', v_error_message;
END;
$$;

-- =====================================================
-- STEP 8: GRANT EXECUTION PERMISSION
-- =====================================================
GRANT EXECUTE ON FUNCTION restore_backup_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION restore_backup_atomic TO service_role;

-- =====================================================
-- STEP 9: CREATE INDEX FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_backups_user_id_created_at ON backups(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

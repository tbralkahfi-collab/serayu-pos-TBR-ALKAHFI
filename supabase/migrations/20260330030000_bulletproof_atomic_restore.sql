-- =====================================================
-- PRODUCTION-GRADE ATOMIC BACKUP RESTORE RPC
-- =====================================================
-- Bulletproof implementation with auto schema detection
-- Author: Senior Full-Stack Engineer
-- Version: 1.0

CREATE OR REPLACE FUNCTION restore_backup_atomic(
    p_backup_data JSONB,
    p_user_id UUID
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
    v_backup_version TEXT;
    v_table_name TEXT;
    v_table_data JSONB;
    v_columns TEXT[];
    v_valid_columns TEXT[];
    v_clean_data JSONB;
    v_rows_processed INTEGER;
    v_error_message TEXT;
    v_total_rows INTEGER := 0;
    v_batch_size INTEGER := 100;
    
    -- Define table processing order
    TYPE table_order_record IS RECORD (
        table_name TEXT,
        process_order INTEGER
    );
    
    v_delete_order table_order_record[] := ARRAY[
        ('expenses', 1)::table_order_record,
        ('debts', 2)::table_order_record,
        ('transactions', 3)::table_order_record,
        ('purchases', 4)::table_order_record,
        ('projects', 5)::table_order_record,
        ('suppliers', 6)::table_order_record,
        ('products', 7)::table_order_record
    ];
    
    v_insert_order table_order_record[] := ARRAY[
        ('products', 1)::table_order_record,
        ('suppliers', 2)::table_order_record,
        ('projects', 3)::table_order_record,
        ('purchases', 4)::table_order_record,
        ('transactions', 5)::table_order_record,
        ('debts', 6)::table_order_record,
        ('expenses', 7)::table_order_record
    ];
    
    v_rec table_order_record;
    
BEGIN
    -- =====================================================
    -- STEP 1: VALIDATE BACKUP STRUCTURE AND VERSION
    -- =====================================================
    -- Check if backup_data has required structure
    IF p_backup_data IS NULL THEN
        RAISE EXCEPTION 'Backup data is null';
    END IF;
    
    -- Extract and validate version
    v_backup_version := COALESCE((p_backup_data->>'version'), '1.0');
    
    IF v_backup_version != v_current_version THEN
        RAISE EXCEPTION 'Backup version % is not compatible with current version %', v_backup_version, v_current_version;
    END IF;
    
    -- Extract data section
    v_table_data := p_backup_data->'data';
    IF v_table_data IS NULL THEN
        RAISE EXCEPTION 'Backup data section is missing';
    END IF;
    
    -- =====================================================
    -- STEP 2: BEGIN ATOMIC TRANSACTION
    -- =====================================================
    -- Process tables in delete order first
    FOR v_rec IN SELECT * FROM UNNEST(v_delete_order) ORDER BY process_order
    LOOP
        v_table_name := v_rec.table_name;
        v_table_data := p_backup_data->'data'->v_table_name;
        
        -- Skip if no data for this table
        IF v_table_data IS NULL OR jsonb_typeof(v_table_data) != 'array' OR jsonb_array_length(v_table_data) = 0 THEN
            CONTINUE;
        END IF;
        
        BEGIN
            -- =====================================================
            -- STEP 3: DELETE EXISTING DATA
            -- =====================================================
            EXECUTE format('DELETE FROM %I WHERE user_id = $1', v_table_name) USING p_user_id;
            
            -- =====================================================
            -- STEP 4: AUTO SCHEMA DETECTION
            -- =====================================================
            -- Get actual table columns from information_schema
            SELECT array_agg(column_name ORDER BY ordinal_position) INTO v_valid_columns
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = v_table_name 
            AND column_name != 'id'  -- Exclude auto-generated id
            AND column_name != 'user_id';  -- Will be added manually
            
            IF v_valid_columns IS NULL THEN
                RAISE EXCEPTION 'No valid columns found for table %', v_table_name;
            END IF;
            
            -- =====================================================
            -- STEP 5: BATCH INSERT WITH DYNAMIC COLUMN FILTERING
            -- =====================================================
            v_rows_processed := 0;
            
            -- Process in batches
            FOR i IN 0..(jsonb_array_length(v_table_data) - 1) BY v_batch_size LOOP
                DECLARE
                    v_batch JSONB := '[]'::jsonb;
                    v_batch_actual_size INTEGER := 0;
                    v_end_index INTEGER;
                BEGIN
                    v_end_index := LEAST(i + v_batch_size - 1, jsonb_array_length(v_table_data) - 1);
                    
                    -- Create batch with column filtering
                    FOR j IN i..v_end_index LOOP
                        DECLARE
                            v_record JSONB := v_table_data -> j;
                            v_clean_record JSONB := '{}'::jsonb;
                            v_col TEXT;
                            v_col_value JSONB;
                        BEGIN
                            -- Only include valid columns
                            FOR v_col IN SELECT unnest(v_valid_columns) LOOP
                                v_col_value := v_record->v_col;
                                IF v_col_value IS NOT NULL THEN
                                    v_clean_record := v_clean_record || jsonb_build_object(v_col, v_col_value);
                                END IF;
                            END LOOP;
                            
                            -- Always include user_id
                            v_clean_record := v_clean_record || jsonb_build_object('user_id', p_user_id);
                            
                            -- Add to batch
                            v_batch := v_batch || v_clean_record;
                            v_batch_actual_size := v_batch_actual_size + 1;
                        END;
                    END LOOP;
                    
                    -- Insert batch if not empty
                    IF v_batch_actual_size > 0 THEN
                        -- Build dynamic INSERT statement
                        DECLARE
                            v_column_list TEXT;
                            v_insert_sql TEXT;
                        BEGIN
                            -- Build column list
                            SELECT string_agg(quote_ident(column_name), ', ') INTO v_column_list
                            FROM unnest(v_valid_columns || ARRAY['user_id']) AS column_name;
                            
                            -- Build and execute INSERT
                            v_insert_sql := format('INSERT INTO %I (%s) SELECT * FROM jsonb_to_recordset($1)', v_table_name, v_column_list);
                            EXECUTE v_insert_sql USING v_batch;
                            
                            v_rows_processed := v_rows_processed + v_batch_actual_size;
                        END;
                    END IF;
                END;
            END LOOP;
            
            -- Return success for this table
            RETURN QUERY SELECT v_table_name, 'SUCCESS', v_rows_processed, NULL::TEXT;
            v_total_rows := v_total_rows + v_rows_processed;
            
        EXCEPTION WHEN OTHERS THEN
            v_error_message := SQLERRM;
            RETURN QUERY SELECT v_table_name, 'ERROR', 0, v_error_message;
            RAISE EXCEPTION 'Atomic restore failed for table %: %', v_table_name, v_error_message;
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
    RAISE EXCEPTION 'Atomic restore transaction failed: %', v_error_message;
END;
$$;

-- =====================================================
-- STEP 8: SECURITY AND PERFORMANCE
-- =====================================================
-- Grant execution permissions
GRANT EXECUTE ON FUNCTION restore_backup_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION restore_backup_atomic TO service_role;

-- Create performance indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'backups' AND indexname = 'idx_backups_user_id_created_at') THEN
        CREATE INDEX idx_backups_user_id_created_at ON backups(user_id, created_at DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'products' AND indexname = 'idx_products_user_id') THEN
        CREATE INDEX idx_products_user_id ON products(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'suppliers' AND indexname = 'idx_suppliers_user_id') THEN
        CREATE INDEX idx_suppliers_user_id ON suppliers(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'purchases' AND indexname = 'idx_purchases_user_id') THEN
        CREATE INDEX idx_purchases_user_id ON purchases(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'transactions' AND indexname = 'idx_transactions_user_id') THEN
        CREATE INDEX idx_transactions_user_id ON transactions(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'debts' AND indexname = 'idx_debts_user_id') THEN
        CREATE INDEX idx_debts_user_id ON debts(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'expenses' AND indexname = 'idx_expenses_user_id') THEN
        CREATE INDEX idx_expenses_user_id ON expenses(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'projects' AND indexname = 'idx_projects_user_id') THEN
        CREATE INDEX idx_projects_user_id ON projects(user_id);
    END IF;
END $$;

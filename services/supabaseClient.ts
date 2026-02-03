
import { createClient } from '@supabase/supabase-js';

// Production Supabase Credentials provided by user
const SUPABASE_URL = "https://qofzswupwbkstjtocjpk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZnpzd3Vwd2Jrc3RqdG9janBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzODEwMzIsImV4cCI6MjA4NDk1NzAzMn0.J_fkLiIj6no9VyuhKIcG_-iXFXL0lK2SON-aEkTJR2c";

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes("placeholder"));

export const supabase = createClient(
    isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co',
    isSupabaseConfigured ? SUPABASE_ANON_KEY : 'placeholder'
);

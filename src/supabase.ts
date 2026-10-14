// Ortak Supabase istemcisi: giriş, bulut kayıt ve canlı kanallar aynı oturumu kullanır.
// Anon anahtar herkese açıktır; veriyi asıl koruyan veritabanındaki RLS kurallarıdır.
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
const URL='https://vidjvineafeiyoclioau.supabase.co';
const ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpZGp2aW5lYWZlaXlvY2xpb2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3Mjk2NjMsImV4cCI6MjEwNzMwNTY2M30.sKlmmfQRr-ZASkaSbax22ca80cyDCc8DNz4Idq19g5s';
let client:SupabaseClient|null=null;
export function supa():SupabaseClient|null{if(!client){try{client=createClient(URL,ANON,{realtime:{params:{eventsPerSecond:40}}});}catch{client=null;}}return client;}

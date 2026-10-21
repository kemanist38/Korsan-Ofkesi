import {defineConfig} from 'vite';
import {resolve} from 'node:path';
// Çok sayfalı yapı: / tanıtım sitesi, /oyna/ oyun, /gizlilik/, /kurallar/ ve /sartlar/ yasal sayfalar, /yonetim/ yönetici paneli
export default defineConfig({build:{rollupOptions:{input:{
  site:resolve(__dirname,'index.html'),
  game:resolve(__dirname,'oyna/index.html'),
  privacy:resolve(__dirname,'gizlilik/index.html'),
  terms:resolve(__dirname,'sartlar/index.html'),
  rules:resolve(__dirname,'kurallar/index.html'),
  admin:resolve(__dirname,'yonetim/index.html'),
}}}});
